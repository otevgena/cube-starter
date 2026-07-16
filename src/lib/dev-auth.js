// src/lib/dev-auth.js
// ВРЕМЕННЫЙ dev-вход без бэкенда (офлайн-моки). ПО УМОЛЧАНИИ ВЫКЛЮЧЕН — локально работает
// живой API (api.cube-tech.ru). В production-сборку не попадает. Перехватывает /auth/* и
// /admin/* и отдаёт фейковых пользователей.
//
// Включить моки: в консоли `localStorage.setItem('dev-auth','1')` и перезагрузить страницу
// (или собрать с VITE_DEV_AUTH=1). Выключить: `localStorage.removeItem('dev-auth')` + reload.
//
// Тестовые аккаунты (когда моки включены):
//   admin@cube.ru / 1234  — администратор (видит вкладку «Администратор»)
//   user@cube.ru  / 1234  — обычный пользователь

const ACCOUNTS = {
  "admin@cube.ru": {
    password: "1234",
    user: {
      id: "u-admin", name: "Администратор", username: "admin", email: "admin@cube.ru",
      role: "admin", group: "admin", isAdmin: true,
      phone: "+7 (912) 911-20-00", city: "Ноябрьск", about: "", emailOptIn: false,
    },
  },
  "user@cube.ru": {
    password: "1234",
    user: {
      id: "u-user", name: "Иван Тестов", username: "ivan", email: "user@cube.ru",
      role: "user", group: "user", isAdmin: false,
      phone: "", city: "", about: "", emailOptIn: false,
    },
  },
};

// список для админ-страницы
const FAKE_USERS = [
  { id: "u-admin", name: "Администратор", email: "admin@cube.ru", role: "admin", group: "admin" },
  { id: "u-user", name: "Иван Тестов", email: "user@cube.ru", role: "user", group: "user" },
  { id: "u-2", name: "Мария Петрова", email: "maria@example.com", role: "manager", group: "partner" },
  { id: "u-3", name: "ООО «СтройСервис»", email: "supply@example.com", role: "user", group: "supplier" },
  { id: "u-4", name: "Алексей Смирнов", email: "alex@example.com", role: "user", group: "user" },
];

const enc = (s) => "dev." + btoa(unescape(encodeURIComponent(s)));
const dec = (t) => { try { return decodeURIComponent(escape(atob(String(t).replace(/^dev\./, "")))); } catch { return ""; } };

const J = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

function readHeader(init, name) {
  const h = init && init.headers;
  if (!h) return "";
  if (typeof h.get === "function") return h.get(name) || "";
  return h[name] || h[name.toLowerCase()] || "";
}

function userFromAuth(init) {
  const bearer = readHeader(init, "Authorization").replace(/^Bearer\s+/i, "");
  return ACCOUNTS[dec(bearer)]?.user || null;
}

export function installDevAuth() {
  if (typeof window === "undefined" || window.__devAuthInstalled) return;
  window.__devAuthInstalled = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const method = (init.method || (typeof input !== "string" && input && input.method) || "GET").toUpperCase();

    const isAuth = /\/auth\/(login|register|me|refresh|logout)\b/.test(path);
    const isAdmin = /\/users\?admin=1/.test(path) || /\/admin\//.test(path) || /\/admin\/list-users/.test(path);
    if (!isAuth && !isAdmin) return realFetch(input, init);

    // ---------- AUTH ----------
    if (/\/auth\/login\b/.test(path)) {
      let b = {};
      try { b = JSON.parse(init.body || "{}"); } catch {}
      const acc = ACCOUNTS[String(b.email || "").toLowerCase().trim()];
      if (acc && acc.password === b.password) return J({ user: acc.user, accessToken: enc(acc.user.email) });
      return J({ error: "Неверный e-mail или пароль." }, 401);
    }
    if (/\/auth\/register\b/.test(path)) {
      let b = {};
      try { b = JSON.parse(init.body || "{}"); } catch {}
      const email = String(b.email || "").toLowerCase().trim() || "new@cube.ru";
      const user = {
        id: "u-new", name: b.name || "Новый пользователь", username: email.split("@")[0], email,
        role: "user", group: "user", isAdmin: false, phone: "", city: "", about: "", emailOptIn: false,
      };
      ACCOUNTS[email] = { password: b.password || "", user };
      return J({ user, accessToken: enc(email) });
    }
    if (/\/auth\/me\b/.test(path)) {
      const u = userFromAuth(init);
      return u ? J({ user: u }) : J({ error: "unauthorized" }, 401); // apiMe ждёт { user }
    }
    if (/\/auth\/refresh\b/.test(path)) return J({ error: "no session" }, 401);
    if (/\/auth\/logout\b/.test(path)) return J({ ok: true });

    // ---------- ADMIN ----------
    const u = userFromAuth(init);
    if (method === "GET") {
      if (!u || !u.isAdmin) return J({ users: [], total: 0 });
      return J({ users: FAKE_USERS, total: FAKE_USERS.length });
    }
    return J({ ok: true }); // обновление роли/группы и т.п.
  };

  // ручной выход из консоли: devLogout()
  window.devLogout = () => {
    try { sessionStorage.removeItem("auth:accessToken"); } catch {}
    try { localStorage.removeItem("accessToken"); localStorage.removeItem("remember"); } catch {}
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: null, accessToken: null } }));
  };

  // eslint-disable-next-line no-console
  console.info("%c[dev-auth] временный вход активен", "color:#FA5D29", "→ admin@cube.ru / 1234 или user@cube.ru / 1234");
}
