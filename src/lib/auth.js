// src/lib/auth.js

const PROD_API  = 'https://api.cube-tech.ru';
const LOCAL_API = 'http://127.0.0.1:3001';

let API_BASE = PROD_API;            // текущее выбранное основание (для дебага)
let _apiBasePromise = null;         // ленивое определение один раз

async function probe(url, timeoutMs = 600) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

async function getAPIBase() {
  if (_apiBasePromise) return _apiBasePromise;
  _apiBasePromise = (async () => {
    const envBase = (import.meta?.env?.VITE_API_BASE || '').trim();
    if (envBase) {
      API_BASE = envBase;
      return API_BASE;
    }
    const isLocalHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocalHost) {
      const ok = await probe(LOCAL_API + '/health');
      API_BASE = ok ? LOCAL_API : PROD_API;
      return API_BASE;
    }
    API_BASE = PROD_API;
    return API_BASE;
  })();
  return _apiBasePromise;
}

let accessToken = null;
const listeners = new Set();

export const auth = {
  get: () => accessToken,
  set: (t, remember = false) => {
    accessToken = t || null;
    if (remember && t) localStorage.setItem('accessToken', t);
    else localStorage.removeItem('accessToken');
    listeners.forEach(fn => fn(accessToken));
  },
  subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); },
  async bootstrap(){
    try{
      const base = await getAPIBase();
      const r = await fetch(base + '/auth/refresh', { method:'POST', credentials:'include' });
      if (r.ok){
        const data = await r.json();
        this.set(data.accessToken, !!localStorage.getItem('remember'));
      } else {
        this.set(null, false);
      }
    }catch{
      this.set(null, false);
    }
  }
};

async function api(path, { method='GET', body, authRequired=true } = {}){
  const base = await getAPIBase();
  const headers = { 'Content-Type':'application/json' };
  if (authRequired && auth.get()) headers.Authorization = 'Bearer ' + auth.get();

  let res = await fetch(base + path, {
    method, credentials:'include', headers, body: body ? JSON.stringify(body) : undefined
  });

  // авто-рефреш при 401
  if (res.status === 401 && authRequired){
    const rr = await fetch(base + '/auth/refresh', { method:'POST', credentials:'include' });
    if (rr.ok){
      const { accessToken } = await rr.json();
      auth.set(accessToken, !!localStorage.getItem('remember'));
      headers.Authorization = 'Bearer ' + accessToken;
      res = await fetch(base + path, {
        method, credentials:'include', headers, body: body ? JSON.stringify(body) : undefined
      });
    }
  }

  if (!res.ok){
    let payload; try{ payload = await res.json(); }catch{ payload = { error: await res.text() }; }
    const err = new Error(payload?.error || 'Request failed'); err.status = res.status; err.payload = payload; throw err;
  }
  return res.json();
}

export async function registerUser({ name, email, password }){
  return api('/auth/register', { method:'POST', authRequired:false, body:{ name, email, password } });
}

export async function loginUser({ idOrEmail, password, remember }){
  if (!idOrEmail.includes('@')){ const e = new Error('Введите e-mail (сейчас вход по e-mail).'); e.status=400; throw e; }
  const data = await api('/auth/login', { method:'POST', authRequired:false, body:{ email:idOrEmail, password } });
  auth.set(data.accessToken, !!remember);
  if (remember) localStorage.setItem('remember','1'); else localStorage.removeItem('remember');
  return data; // { user, accessToken }
}

export async function me(){ return api('/auth/me', { method:'GET', authRequired:true }); }
export async function logout(){ try{ await api('/auth/logout', { method:'POST', authRequired:false }); }catch{} auth.set(null,false); localStorage.removeItem('remember'); }

// Экспорт для дебага/проверки
export { API_BASE, getAPIBase };
