// src/pages/account/admin.jsx
import React from "react";

/* ===== API helpers ===== */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "https://api.cube-tech.ru";
const api = (p) => `${API_BASE}${p}`;

async function apiRefresh(timeoutMs = 1200) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(api("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.accessToken || null;
  } catch {
    clearTimeout(to);
    return null;
  }
}

async function apiMe(token) {
  try {
    const r = await fetch(api("/auth/me"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.user || null;
  } catch {
    return null;
  }
}

/* --- админ: чтение списка пользователей --- */
/* --- админ: чтение списка пользователей (с фоллбеками) --- */
async function apiAdminListUsers(token, { limit = 50, offset = 0, q = "", group } = {}) {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(q ? { q } : {}),
    ...(group ? { group } : {}),
  }).toString();

  const opts = {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    cache: "no-store",
  };
  const tryOne = async (url) => {
    try {
      const r = await fetch(api(url), opts);
      if (!r.ok) return null;
      return await r.json().catch(() => null);
    } catch { return null; }
  };

  const raw =
    (await tryOne(`/users?admin=1&${qs}`)) ||   // ← сначала не-404 путь
    (await tryOne(`/admin/users?${qs}`)) ||
    (await tryOne(`/admin/list-users?${qs}`)) ||
    { users: [], total: 0 };

  const users = Array.isArray(raw?.users) ? raw.users : Array.isArray(raw) ? raw : [];
  const total = Number(raw?.total ?? users.length ?? 0);
  return { users, total };
}

/* --- админ: обновление роли/группы (с фоллбеками и id в POST) --- */
/* --- админ: обновление роли/группы (без 404 в консоли) --- */
async function apiAdminUpdateUser(token, userId, patch) {
  const id = userId ?? patch?.id;
  if (!id) return null;

  const common = {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const tryJSON = async (url, method, bodyObj) => {
    try {
      const r = await fetch(api(url), { ...common, method, body: JSON.stringify(bodyObj) });
      if (!r.ok) return null;
      return (await r.json().catch(() => null)) || { ok: true };
    } catch {
      return null;
    }
  };

  // Порядок важен: сначала рабочие пути, чтобы не плодить 404
  return (
    // 1) основной живой путь у тебя — /users/:id (PATCH)
    (await tryJSON(`/users/${encodeURIComponent(id)}`, "PATCH", patch)) ||
    // 2) универсальный POST (некоторые бэки ждут именно его)
    (await tryJSON(`/admin/update-user`, "POST", { id, userId: id, ...patch })) ||
    // 3) запасной «старый» путь — на твоём сервере его нет, поэтому ставим последним
    (await tryJSON(`/admin/users/${encodeURIComponent(id)}`, "PATCH", patch)) ||
    // 4) ещё один возможный универсальный путь
    (await tryJSON(`/users/update`, "POST", { id, userId: id, ...patch }))
  );
}



/* ===== UI ===== */
const UI = "'Inter Tight','Inter',system-ui";
const TEXT = "#111";
const PH = "#A7A7A7";
const CARD = "#ffffff";
const BORDER = "#e5e5e5";
const UNDERLINE = "#d7d7d7";
const UNDERLINE_FOCUS = "#8d8d8d";
const ERR = "#fa5d29";
const PAGE_PAD = 52;

const LEFT_COL = 360;
const MID_COL = 714;
const GAP_COL = 78;
const RIGHT_COL = 277;
const LINE_RIGHT_INSET = 64;

const FIELD_H = 48;

function baseFieldStyle(error) {
  return {
    width: "100%",
    height: FIELD_H,
    border: "none",
    outline: "none",
    borderRadius: 0,
    background: "#fff",
    color: TEXT,
    padding: "0 12px",
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 300,
    boxShadow: error
      ? `inset 0 -1px 0 0 ${ERR}`
      : `inset 0 -1px 0 0 ${UNDERLINE}`,
    transition: "box-shadow .18s ease",
  };
}
function Input({ value, onChange, placeholder, error }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="with-ph"
      style={baseFieldStyle(error)}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = error
          ? `inset 0 -1px 0 0 ${ERR}`
          : `inset 0 -1px 0 0 ${UNDERLINE}`;
      }}
    />
  );
}

/* группы (как в profile.jsx) */
const GROUPS = [
  { code: "customer",   label: "Заказчик" },
  { code: "user",       label: "Пользователь" },
  { code: "performer",  label: "Исполнитель" },
  { code: "contractor", label: "Подрядчик" },
  { code: "designer",   label: "Проектировщик" },
  { code: "other",      label: "Другое" },
  { code: "supplier",   label: "Поставщик" },
  { code: "partner",    label: "Партнёр" },
];
const toCode = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (GROUPS.some(g => g.code === s)) return s;
  const found = GROUPS.find(g => g.label.toLowerCase() === s);
  return found?.code || "user";
};
function GroupSelect({ value, onChange }) {
  return (
    <select
      value={toCode(value)}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ ...baseFieldStyle(false), height: FIELD_H, padding: "0 10px", background: "#fff" }}
    >
      {GROUPS.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
    </select>
  );
}

/* роли доступа */
function AccessRoleSelect({ value, onChange }) {
  const OPTIONS = [
    { code: "user",    label: "User" },
    { code: "manager", label: "Manager" },
    { code: "admin",   label: "Admin" },
  ];
  return (
    <select
      value={value || "user"}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ ...baseFieldStyle(false), height: FIELD_H, padding: "0 10px", background: "#fff" }}
    >
      {OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  );
}

/* ===== Вкладки (зеркало profile.jsx) ===== */
function TabsBar({ isAdmin }) {
  const left = [
    { key: "profile",  label: "Профиль",  href: "/account/profile" },
    { key: "partner",  label: "Партнёр",  href: "/account/partner" },
    { key: "supplier", label: "Поставщик",href: "/account/supplier" },
    { key: "info",     label: "Личная информация", href: "/account/personal" },
  ];
  return (
    <div style={{ position: "relative", marginTop: -35, paddingBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}>
          {left.map((t) => (
            <a
              key={t.key}
              href={t.href}
              onClick={(e) => { e.preventDefault(); try { window.history.pushState({}, "", t.href); window.dispatchEvent(new PopStateEvent("popstate")); } catch {} }}
              style={{ textDecoration: "none", fontWeight: 300, color: "#777" }}
            >
              {t.label}
            </a>
          ))}
        </div>

        <div style={{ minWidth: 120, textAlign: "right" }}>
          {isAdmin ? (
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Администратор</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ===== Таблица пользователей (с «черновиками») ===== */
function UsersTable({ token }) {
  const [q, setQ] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("");
  const [list, setList] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [drafts, setDrafts] = React.useState({}); // { [id]: { group?, role? } }

  const dottedWidth = MID_COL + GAP_COL + RIGHT_COL - LINE_RIGHT_INSET;

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const j = await apiAdminListUsers(token, { limit: 100, offset: 0, q, group: groupFilter || undefined });
    const users = Array.isArray(j?.users) ? j.users : Array.isArray(j) ? j : [];
    setList(users);
    setTotal(Number(j?.total || users.length || 0));
    setLoading(false);
  }, [token, q, groupFilter]);

  React.useEffect(() => { load(); }, [load]);

  const setDraft = (id, patch) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };
  const clearDraft = (id) => {
    setDrafts((prev) => {
      const n = { ...prev }; delete n[id]; return n;
    });
  };

  const currentGroup = (u) => toCode((drafts[u.id]?.group ?? u.group ?? "user"));
  const currentRole  = (u) => (drafts[u.id]?.role  ?? u.role  ?? "user");

  const isChanged = (u) => {
    const d = drafts[u.id];
    if (!d) return false;
    return (d.group && toCode(d.group) !== toCode(u.group)) ||
           (d.role  && d.role !== (u.role || "user"));
  };

  const saveRow = async (u) => {
    const d = drafts[u.id] || {};
    const patch = {};
    if (d.group && toCode(d.group) !== toCode(u.group)) patch.group = toCode(d.group);
    if (d.role  && d.role !== (u.role || "user"))       patch.role  = d.role;
    if (!Object.keys(patch).length) return;

    const res = await apiAdminUpdateUser(token, u.id, patch);
    if (!res) { alert("Не удалось сохранить"); return; }
    clearDraft(u.id);
    await load();
  };

  return (
    <div>
      {/* Шапка в одну линию с "Роли и группы" */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          width: `${dottedWidth}px`,
          marginTop: 14,
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 600 }}>Зарегистрированные учётные записи</div>
        <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>Всего: {total}</div>
      </div>

      <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 220px 140px", gap: 12 }}>
        <Input value={q} onChange={setQ} placeholder="Поиск по имени, e-mail или телефону…" />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          style={{ ...baseFieldStyle(false), height: FIELD_H, padding: "0 10px", background: "#fff" }}
        >
          <option value="">Все группы</option>
          {GROUPS.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
        </select>
        <button
          type="button"
          onClick={load}
          style={{
            height: FIELD_H, border: "none", borderRadius: 8, background: "#000", color: "#fff",
            fontFamily: UI, fontSize: 14, fontWeight: 300, cursor: "pointer"
          }}
        >
          Обновить
        </button>
      </div>

      <div style={{ border: `1px solid ${UNDERLINE}`, borderRadius: 10, background: "#fff" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 260px 160px 140px 140px 1fr",
            gap: 0,
            padding: "12px 14px",
            borderBottom: `1px solid ${UNDERLINE}`,
            fontSize: 12,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "#666",
          }}
        >
          <div>Имя</div>
          <div>E-mail</div>
          <div>Телефон</div>
          <div>Группа</div>
          <div>Роль</div>
          <div>Действия</div>
        </div>

        {loading ? (
          <div style={{ padding: 16, fontSize: 14, fontWeight: 300 }}>Загрузка…</div>
        ) : list.length === 0 ? (
          <div style={{ padding: 16, fontSize: 14, fontWeight: 300, color: "#666" }}>Нет данных</div>
        ) : (
          list.map((u, idx) => {
            const key = String(u.id || idx);
            const changed = isChanged(u);
            return (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 260px 160px 140px 140px 1fr",
                  gap: 0,
                  padding: "10px 14px",
                  borderTop: `1px solid ${UNDERLINE}`,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 300, color: TEXT }}>{u.name || ""}</div>
                <div style={{ fontSize: 14, fontWeight: 300, color: "#333" }}>{u.email || ""}</div>
                <div style={{ fontSize: 14, fontWeight: 300, color: "#333" }}>{u.phone || ""}</div>
                <div>
                  <GroupSelect
                    value={currentGroup(u)}
                    onChange={(code) => setDraft(u.id, { group: code })}
                  />
                </div>
                <div>
                  <AccessRoleSelect
                    value={currentRole(u)}
                    onChange={(code) => setDraft(u.id, { role: code })}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    disabled={!changed}
                    onClick={() => saveRow(u)}
                    style={{
                      height: 36, padding: "0 12px", borderRadius: 8, border: "none",
                      background: changed ? "#000" : "#999", color: "#fff",
                      fontFamily: UI, fontSize: 13, fontWeight: 300, cursor: changed ? "pointer" : "not-allowed",
                      opacity: changed ? 1 : 0.8
                    }}
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    disabled={!drafts[u.id]}
                    onClick={() => clearDraft(u.id)}
                    style={{
                      height: 36, padding: "0 12px", borderRadius: 8,
                      border: `1px solid ${UNDERLINE}`, background: "#fff",
                      color: drafts[u.id] ? "#111" : "#999",
                      fontFamily: UI, fontSize: 13, fontWeight: 300,
                      cursor: drafts[u.id] ? "pointer" : "not-allowed"
                    }}
                  >
                    Отменить
                  </button>
                  {changed ? (
                    <span style={{ fontSize: 12, fontWeight: 300, color: "#444" }}>• не сохранено</span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ height: 58 }} />
    </div>
  );
}

/* ===== Страница ===== */
export default function AdminPage() {
  const [token, setToken] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userName, setUserName] = React.useState("");

  React.useEffect(() => {
    const css = document.createElement("style");
    css.textContent = `.with-ph::placeholder{color:${PH};opacity:1}`;
    document.head.appendChild(css);
    return () => css.remove();
  }, []);

  React.useEffect(() => {
    (async () => {
      let t = sessionStorage.getItem("auth:accessToken");
      if (!t) t = await apiRefresh(1200);
      if (!t) return;
      setToken(t);
      sessionStorage.setItem("auth:accessToken", t);

      const u = await apiMe(t);
      if (!u) return;
      setIsAdmin(Boolean(u.isAdmin || u.role === "admin" || u.group === "admin"));
      setUserName(u.name || u.email || "Пользователь");
    })();
  }, []);

  if (token && !isAdmin) {
    return (
      <main style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8", minHeight: "100dvh" }}>
        <div style={{ paddingTop: 72, paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 28,
              boxShadow: "0 6px 20px rgba(0,0,0,.05)",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Доступ запрещён (403)</div>
              <div style={{ fontSize: 14, fontWeight: 300, marginBottom: 18 }}>
                Эта секция доступна только администраторам.
              </div>
              <a
                href="/account/profile"
                onClick={(e) => { e.preventDefault(); try { window.history.pushState({}, "", "/account/profile"); window.dispatchEvent(new PopStateEvent("popstate")); } catch {} }}
                style={{
                  display: "inline-block",
                  background: "#000",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 300,
                }}
              >
                Вернуться в профиль
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const dottedWidth = MID_COL + GAP_COL + RIGHT_COL - LINE_RIGHT_INSET;

  return (
    <main style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8", minHeight: "100dvh" }}>
      <div style={{ paddingTop: 72, paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${LEFT_COL}px ${MID_COL}px ${GAP_COL}px ${RIGHT_COL}px`,
            columnGap: 0,
            alignItems: "start",
            position: "relative",
          }}
        >
          {/* ЛЕВО — крошка */}
          <aside>
            <div style={{ marginTop: -35 }}>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 7 }}>Администратор</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#333" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#111" }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="9.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                  <rect x="13.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 300 }}>{">"}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Администратор</span>
              </div>
            </div>
          </aside>

          {/* ЦЕНТР — вкладки + контент */}
          <section>
            <TabsBar isAdmin={isAdmin} />

            {/* пунктирная линия с правым отступом 64px */}
            <div
              style={{
                marginTop: 6,
                position: "relative",
                width: `${dottedWidth}px`,
                height: 1,
                backgroundImage:
                  "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: -1, width: 110, height: 2, background: "#000" }} />
            </div>

            {/* Шапка вровень */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                width: `${dottedWidth}px`,
                marginTop: 14,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 600 }}>Роли и группы</div>
              <div style={{ fontSize: 22, fontWeight: 600, opacity: 0 }}>Зарегистрированные учётные записи</div>
            </div>

            {/* Кратко о текущем админе */}
            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 6px 20px rgba(0,0,0,.05)",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Текущий администратор</div>
              <div style={{ fontSize: 14, fontWeight: 300 }}>
                Вы вошли как: <b>{userName || "—"}</b>
              </div>
            </div>

            {/* Роли и доступы (кнопки-ссылки) */}
            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 6px 20px rgba(0,0,0,.05)",
              marginBottom: 22,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Роли и доступы</div>
              <div style={{ fontSize: 14, fontWeight: 300, marginBottom: 12 }}>
                Здесь будет управление ролями пользователей (назначение «partner», «supplier», «admin» и т.д.).
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" style={btn()}>Открыть модуль ролей</button>
                <a href="/account/partner" onClick={(e)=>{e.preventDefault(); try{window.history.pushState({}, "", "/account/partner"); window.dispatchEvent(new PopStateEvent("popstate"));}catch{}}} style={{ ...btnLink() }}>
                  Заявки партнёров
                </a>
                <a href="/account/supplier" onClick={(e)=>{e.preventDefault(); try{window.history.pushState({}, "", "/account/supplier"); window.dispatchEvent(new PopStateEvent("popstate"));}catch{}}} style={{ ...btnLink() }}>
                  Заявки поставщиков
                </a>
              </div>
            </div>

            {/* Таблица пользователей */}
            <UsersTable token={token} />

            <div style={{ height: 120 }} />
          </section>

          {/* промежуток */}
          <div />

          {/* ПРАВО — инфоблок */}
          <aside style={{ position: "sticky", top: 24 }}>
            <div style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 18,
              boxShadow: "0 6px 20px rgba(0,0,0,.05)",
              fontSize: 14,
              fontWeight: 300,
            }}>
              Раздел администратора. Здесь мы сосредоточим действия управления доступом и модерации.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* стили кнопок */
function btn() {
  return {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 300,
    cursor: "pointer",
  };
}
function btnLink() {
  return {
    display: "inline-block",
    background: "#111",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 300,
  };
}
