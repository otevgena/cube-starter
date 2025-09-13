// src/lib/auth.js

// ───────── API base autodetect ─────────
const PROD_API  = 'https://api.cube-tech.ru';
const LOCAL_API = 'http://127.0.0.1:3001';

let _apiBasePromise = null;

async function probe(url, timeoutMs = 600) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
    clearTimeout(id);
    return res.ok;
  } catch { return false; }
}

export async function getAPIBase() {
  if (_apiBasePromise) return _apiBasePromise;
  _apiBasePromise = (async () => {
    // явный приоритет: window.__API_BASE__ → VITE_API_BASE
    const fromWindow = typeof window !== 'undefined' && window.__API_BASE__;
    const fromEnv = (import.meta?.env?.VITE_API_BASE || '').trim();
    if (fromWindow) return fromWindow;
    if (fromEnv)    return fromEnv;

    const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
    if (isLocal) {
      const ok = await probe(LOCAL_API + '/health');
      return ok ? LOCAL_API : PROD_API;
    }
    return PROD_API;
  })();
  return _apiBasePromise;
}

// ───────── Auth state & helpers ─────────
let accessToken = null;
let rememberFlag = false;
const listeners = new Set();

// начальная подстановка из хранилищ (не делаем сеть)
try {
  const storedRemember = !!localStorage.getItem('remember');
  rememberFlag = storedRemember;
  const stored = storedRemember
    ? localStorage.getItem('accessToken')
    : sessionStorage.getItem('auth:accessToken');
  if (stored) accessToken = stored;
} catch {}

function notify() { listeners.forEach(fn => fn(accessToken)); }

function persistToken(token, remember) {
  try {
    // очистка
    sessionStorage.removeItem('auth:accessToken');
    localStorage.removeItem('accessToken');

    if (token) {
      if (remember) localStorage.setItem('accessToken', token);
      else sessionStorage.setItem('auth:accessToken', token);
    }
    if (remember) localStorage.setItem('remember', '1');
    else localStorage.removeItem('remember');
  } catch {}
}

export const auth = {
  get: () => accessToken,
  remember: () => rememberFlag,
  set(token, remember = rememberFlag) {
    accessToken = token || null;
    rememberFlag = !!remember;
    persistToken(accessToken, rememberFlag);
    notify();
    // пробрасываем событие наружу (для Header и пр.)
    try {
      window.dispatchEvent(
        new CustomEvent('auth:changed', { detail: { accessToken } })
      );
    } catch {}
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

// ───────── Refresh (с одинарным запросом) ─────────
let _refreshInFlight = null;

export async function refreshToken() {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    const base = await getAPIBase();
    try {
      // ВАЖНО: без Content-Type — тело пустое
      const r = await fetch(base + '/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) { auth.set(null, false); return null; }
      const { accessToken: t } = await r.json();
      if (!t) { auth.set(null, false); return null; }
      auth.set(t, rememberFlag || !!localStorage.getItem('remember'));
      return t;
    } catch {
      auth.set(null, false);
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();
  return _refreshInFlight;
}

// ───────── Универсальный вызов API ─────────
export async function api(
  path,
  { method = 'GET', body, authRequired = true, headers: extraHeaders } = {}
) {
  const base = await getAPIBase();
  const h = { ...(extraHeaders || {}) };

  // добавляем JSON заголовок ТОЛЬКО если есть тело
  if (body !== undefined && body !== null && !h['Content-Type'])
    h['Content-Type'] = 'application/json';

  // авторизация
  const tok = auth.get();
  if (authRequired && tok) h.Authorization = 'Bearer ' + tok;

  const doFetch = () =>
    fetch(base + path, {
      method,
      credentials: 'include',
      headers: h,
      body: body != null ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  // авто-рефреш на 401 (одна попытка; общий inflight)
  if (res.status === 401 && authRequired) {
    const t = await refreshToken();
    if (t) {
      h.Authorization = 'Bearer ' + t;
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let payload;
    try { payload = await res.json(); }
    catch { payload = { error: await res.text() }; }
    const err = new Error(payload?.error || 'Request failed');
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return res.json();
}

// ───────── Готовые вызовы ─────────
export async function registerUser({ name, email, password }) {
  return api('/auth/register', {
    method: 'POST',
    authRequired: false,
    body: { name, email, password },
  });
}

export async function loginUser({ idOrEmail, password, remember }) {
  if (!String(idOrEmail).includes('@')) {
    const e = new Error('Введите e-mail (сейчас вход по e-mail).');
    e.status = 400; throw e;
  }
  const data = await api('/auth/login', {
    method: 'POST',
    authRequired: false,
    body: { email: idOrEmail, password },
  });
  auth.set(data.accessToken, !!remember);
  if (remember) localStorage.setItem('remember', '1');
  else localStorage.removeItem('remember');
  return data; // { user, accessToken }
}

export async function me() {
  return api('/auth/me', { method: 'GET', authRequired: true });
}

export async function logout() {
  try { await api('/auth/logout', { method: 'POST', authRequired: false }); }
  catch {}
  auth.set(null, false);
  localStorage.removeItem('remember');
}

// ───────── Опциональный bootstrap (НЕ автозапускаем) ─────────
// Вызывай из своего кода вручную, если нужно.
// Он сделает 1 попытку refresh, только если токена нет.
export async function bootstrap() {
  if (auth.get()) return auth.get();
  return refreshToken();
}
