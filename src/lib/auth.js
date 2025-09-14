// src/lib/auth.js

// Базы API
const PROD_API  = 'https://api.cube-tech.ru';
const LOCAL_API = 'http://127.0.0.1:3001';

// ===== детектор API один раз =====
let API_BASE = PROD_API;
let _apiBasePromise = null;

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
    const isLocalHost = ['localhost','127.0.0.1'].includes(location.hostname);
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

// ===== внутренняя утилита запроса =====
async function doFetch(path, opt = {}) {
  const base = await getAPIBase();
  return fetch(base + path, opt);
}

// ===== состояние токена + подписки =====
let accessToken = null;
const listeners = new Set();
const debug = () => Boolean(localStorage.getItem('auth:debug'));

function emit() {
  listeners.forEach(fn => {
    try { fn(accessToken); } catch {}
  });
}

export const auth = {
  get: () => accessToken,
  set(t, remember = false) {
    accessToken = t || null;
    if (remember && t) localStorage.setItem('accessToken', t);
    else localStorage.removeItem('accessToken');
    emit();
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  // Быстрый старт: НЕ блокирует UI
  async bootstrap() {
    // восстанавливаем access из local/session, если он у вас где-то сохранился
    try {
      const ls = localStorage.getItem('accessToken');
      if (ls) accessToken = ls;
    } catch {}

    // одна быстрая попытка рефреша (не обязательна, UI не ждёт)
    try { await refreshOnce({ force: true }); } catch {}
  },

  async forceLogout() {
    try { await doFetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    accessToken = null;
    try { localStorage.removeItem('accessToken'); } catch {}
    try { localStorage.removeItem('remember'); } catch {}
    emit();
  },
};

// ===== ЕДИНСТВЕННАЯ точка обновления токена =====
let _refreshInflight = null;
let _lastFailAt = 0;

async function refreshOnce({ force = false } = {}) {
  // cooldown, чтобы не молотить бэк при провале
  const now = Date.now();
  const COOLDOWN_MS = 15000; // 15s
  if (!force && now - _lastFailAt < COOLDOWN_MS) {
    if (debug()) console.log('[auth] skip refresh (cooldown)');
    return null;
  }

  if (_refreshInflight) return _refreshInflight;

  _refreshInflight = (async () => {
    const base = await getAPIBase();
    const ctrl = new AbortController();
    const TIMEOUT_MS = 1500;
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    if (debug()) console.log('[auth] POST /auth/refresh …');

    let res;
    try {
      res = await fetch(base + '/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        // ВАЖНО: без Content-Type, без body (чтобы не ловить 400)
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      _lastFailAt = Date.now();
      if (debug()) console.warn('[auth] refresh network/timeout', e);
      _refreshInflight = null;
      return null;
    }
    clearTimeout(timer);

    if (res.ok) {
      let data = null;
      try { data = await res.json(); } catch {}
      const token = data?.accessToken || null;
      if (token) {
        accessToken = token;
        // запоминаем, если пользователь ставил “Не выходить”
        const remember = !!localStorage.getItem('remember');
        if (remember) localStorage.setItem('accessToken', token);
        emit();
        if (debug()) console.log('[auth] refresh OK');
        _refreshInflight = null;
        return token;
      }
      // ok без токена — считаем провалом
    }

    // 401/400/… — считаем провалом, сразу чистим rt на сервере
    _lastFailAt = Date.now();
    try {
      await fetch(base + '/auth/logout', { method: 'POST', credentials: 'include' });
      if (debug()) console.log('[auth] logout after failed refresh');
    } catch {}
    _refreshInflight = null;
    return null;
  })();

  return _refreshInflight;
}

// ===== универсальный API-обёртка с автодоговорами =====
export async function api(path, { method = 'GET', body, authRequired = true } = {}) {
  const headers = {};
  // ставим JSON только когда реально есть body
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authRequired && accessToken) headers['Authorization'] = 'Bearer ' + accessToken;

  let res = await doFetch(path, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // если получили 401 — одна попытка refresh и повтор
  if (res.status === 401 && authRequired) {
    const token = await refreshOnce();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
      res = await doFetch(path, {
        method,
        credentials: 'include',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    let payload;
    try { payload = await res.json(); } catch { payload = { error: await res.text() }; }
    const err = new Error(payload?.error || 'Request failed');
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return res.json();
}

// ===== high-level методы =====
export async function registerUser({ name, email, password }) {
  return api('/auth/register', { method: 'POST', authRequired: false, body: { name, email, password } });
}

export async function loginUser({ idOrEmail, password, remember }) {
  if (!idOrEmail.includes('@')) {
    const e = new Error('Введите e-mail (сейчас вход по e-mail).'); e.status = 400; throw e;
  }
  const data = await api('/auth/login', { method: 'POST', authRequired: false, body: { email: idOrEmail, password } });
  // сохраняем access и флаг remember
  accessToken = data.accessToken || null;
  if (remember && accessToken) {
    localStorage.setItem('remember', '1');
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('remember');
    localStorage.removeItem('accessToken');
  }
  emit();
  return data; // { user, accessToken }
}

export async function me()  { return api('/auth/me',    { method: 'GET',  authRequired: true  }); }
export async function logout() {
  try { await api('/auth/logout', { method: 'POST', authRequired: false }); } catch {}
  accessToken = null;
  try { localStorage.removeItem('accessToken'); } catch {}
  try { localStorage.removeItem('remember'); } catch {}
  emit();
}

// экспорт на всякий случай
export { API_BASE, getAPIBase };
