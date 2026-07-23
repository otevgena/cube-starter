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
// Сидируем in-memory токен из sessionStorage при загрузке модуля. На жёстком
// обновлении (F5) память обнуляется, но sessionStorage хранит последний access.
// Без сида первый authed-запрос через api() (напр. GET /objects) уходит БЕЗ
// Authorization → 401 → лишний refresh+retry и красная строка в консоли.
// С сидом — первый же запрос идёт с токеном (а если он протух — прежний путь
// refresh-on-401 отработает как раньше).
let accessToken = (() => {
  try { return sessionStorage.getItem('auth:accessToken') || null; } catch { return null; }
})();
const listeners = new Set();
const debug = () => Boolean(localStorage.getItem('auth:debug'));

// Профиль/админка читают токен из sessionStorage['auth:accessToken'],
// поэтому держим его в синхроне с нашим in-memory токеном.
const SESSION_KEY = 'auth:accessToken';
function syncSession(token) {
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, token);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

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
    syncSession(accessToken);
    emit();
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  // Быстрый старт: НЕ блокирует UI
  async bootstrap() {
    // восстанавливаем access из local/session, если он у вас где-то сохранился
    try {
      const ls = localStorage.getItem('accessToken');
      if (ls) { accessToken = ls; syncSession(ls); }
    } catch {}

    // одна быстрая попытка рефреша (не обязательна, UI не ждёт)
    try { await refreshOnce({ force: true }); } catch {}
  },

  async forceLogout() {
    try { await doFetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    accessToken = null;
    try { localStorage.removeItem('accessToken'); } catch {}
    try { localStorage.removeItem('remember'); } catch {}
    syncSession(null);
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
    // Раньше было 1500 мс: на холодном старте Cloud Function рефреш не
    // успевал завершиться и рвался ПОСЛЕ ротации refresh-token на сервере —
    // новый cookie не фиксировался, старый rt уже недействителен → 401 →
    // logout → объекты пропадали. Даём запросу дожить до ответа.
    const TIMEOUT_MS = 8000;
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
        syncSession(token);
        emit();
        if (debug()) console.log('[auth] refresh OK');
        _refreshInflight = null;
        return token;
      }
      // ok без токена — считаем провалом
    }

    // 401/400/… — считаем провалом. РАНЬШЕ здесь звали /auth/logout, что
    // ДОБИВАЛО сессию: одна неудачная попытка рефреша (таймаут, гонка, холодный
    // старт функции) удаляла refresh-token на сервере → войти уже нельзя без
    // пароля, даже если cookie была жива. Больше так не делаем — просто ставим
    // cooldown и возвращаем null; сессия остаётся, следующий refresh её поднимет.
    // (Осознанный выход — только через auth.forceLogout()/logout().)
    _lastFailAt = Date.now();
    if (debug()) console.warn('[auth] refresh failed (session kept)');
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
export async function registerUser({ name, email, password, remember = true }) {
  const data = await api('/auth/register', { method: 'POST', authRequired: false, body: { name, email, password } });
  // Новый флоу: регистрация НЕ логинит сразу — сперва подтверждение почты письмом.
  // Бэкенд отдаёт { pendingVerification, email } без токена.
  if (data && data.pendingVerification) return data;
  // Обратная совместимость: если бэкенд всё же вернул accessToken — логиним.
  accessToken = data.accessToken || null;
  if (remember && accessToken) {
    localStorage.setItem('remember', '1');
    localStorage.setItem('accessToken', accessToken);
  }
  syncSession(accessToken);
  emit();
  return data; // { user, accessToken }
}

// Повторная отправка письма-подтверждения по e-mail (без входа) — для тех,
// кого не пустили из-за неподтверждённой почты.
export async function resendVerify(email) {
  return api('/auth/request-verify', { method: 'POST', authRequired: false, body: { email } });
}

export async function loginUser({ idOrEmail, password, remember }) {
  // Вход по e-mail ИЛИ по логину (для учёток, заведённых админом по логину).
  // Бэкенд принимает body.login или body.email — отправляем нужное поле.
  const ident = String(idOrEmail || '').trim();
  const body = ident.includes('@') ? { email: ident, password } : { login: ident, password };
  const data = await api('/auth/login', { method: 'POST', authRequired: false, body });
  // Если включена 2FA — сервер вернул промежуточный challenge, токенов нет.
  // Пробрасываем наверх, чтобы UI показал второй шаг (ввод кода).
  if (data.twoFactorRequired) {
    return { twoFactorRequired: true, challenge: data.challenge, remember: !!remember };
  }
  // сохраняем access и флаг remember
  accessToken = data.accessToken || null;
  if (remember && accessToken) {
    localStorage.setItem('remember', '1');
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('remember');
    localStorage.removeItem('accessToken');
  }
  syncSession(accessToken);
  emit();
  return data; // { user, accessToken }
}

// Второй шаг входа при 2FA: обмениваем challenge + код (TOTP или резервный) на токены.
export async function verifyTwoFactor({ challenge, code, remember }) {
  const data = await api('/auth/2fa-verify', { method: 'POST', authRequired: false, body: { challenge, code } });
  accessToken = data.accessToken || null;
  if (remember && accessToken) {
    localStorage.setItem('remember', '1');
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('remember');
    localStorage.removeItem('accessToken');
  }
  syncSession(accessToken);
  emit();
  return data; // { user, accessToken }
}

// ===== Сброс пароля / подтверждение почты =====
// Запрос ссылки для сброса — всегда 200 (не раскрываем, есть ли аккаунт).
export async function requestPasswordReset(email) {
  return api('/auth/request-reset', { method: 'POST', authRequired: false, body: { email } });
}
// Проверка ссылки сброса ПРИ ЗАГРУЗКЕ страницы (жив ли токен, не сжигая его).
export async function checkResetToken(token) {
  return api('/auth/check-reset', { method: 'POST', authRequired: false, body: { token } });
}
// Установка нового пароля по одноразовому токену из письма.
export async function resetPassword({ token, newPassword }) {
  return api('/auth/reset', { method: 'POST', authRequired: false, body: { token, newPassword } });
}
// Запрос письма с подтверждением почты (нужен вход).
export async function requestEmailVerify() {
  return api('/auth/request-verify', { method: 'POST', authRequired: true });
}
// Подтверждение почты по одноразовому токену из письма. Бэкенд теперь заодно
// выдаёт сессию (accessToken + refresh-cookie) — авто-вход по ссылке, чтобы не
// просить логин/пароль после «ПОЧТА ПОДТВЕРЖДЕНА». Ставим токен как при login.
export async function verifyEmail(token) {
  const data = await api('/auth/verify', { method: 'POST', authRequired: false, body: { token } });
  if (data && data.accessToken) {
    accessToken = data.accessToken;
    // подтверждение почты = намеренный вход с этого устройства → помним сессию
    try { localStorage.setItem('remember', '1'); localStorage.setItem('accessToken', accessToken); } catch {}
    syncSession(accessToken);
    emit();
  }
  return data; // { ok, email, accessToken?, user? }
}

export async function me()  { return api('/auth/me',    { method: 'GET',  authRequired: true  }); }
export async function logout() {
  try { await api('/auth/logout', { method: 'POST', authRequired: false }); } catch {}
  accessToken = null;
  try { localStorage.removeItem('accessToken'); } catch {}
  try { localStorage.removeItem('remember'); } catch {}
  syncSession(null);
  emit();
}

// экспорт на всякий случай
// refreshOnce — единый single-flight рефреш: все страницы (Header/profile/admin)
// должны звать именно его, иначе параллельные вызовы /auth/refresh ротируют
// одноразовый refresh-token наперегонки → 401 → logout → «сессия слетела».
export { API_BASE, getAPIBase, refreshOnce };
