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

/* --- профиль пользователя (PUT/PATCH) --- */
async function apiUpdateProfile(token, data) {
  const payload = JSON.stringify(data);
  const common = {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload,
  };
  const tryOne = async (url, method) => {
    try {
      const r = await fetch(api(url), { ...common, method });
      if (!r.ok) return null;
      const j = await r.json().catch(() => null);
      return j || { ok: true };
    } catch {
      return null;
    }
  };
  return (
    (await tryOne("/account/profile", "PUT")) ||
    (await tryOne("/users/me", "PATCH")) ||
    (await tryOne("/profile", "PATCH"))
  );
}

/* --- админ: чтение списка пользователей (сначала /users?admin=1) --- */
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
    (await tryOne(`/users?admin=1&${qs}`)) ||
    (await tryOne(`/admin/users?${qs}`)) ||
    (await tryOne(`/admin/list-users?${qs}`)) ||
    { users: [], total: 0 };

  const users = Array.isArray(raw?.users) ? raw.users : Array.isArray(raw) ? raw : [];
  const total = Number(raw?.total ?? users.length ?? 0);
  const filtered = group ? users.filter(u => String(u.group||"").toLowerCase() === group) : users;
  return { users: filtered, total: group ? filtered.length : total };
}

/* --- админ: обновление роли/группы (без 404) --- */
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

  return (
    (await tryJSON(`/users/${encodeURIComponent(id)}`, "PATCH", patch)) ||
    (await tryJSON(`/admin/update-user`, "POST", { id, userId: id, ...patch })) ||
    (await tryJSON(`/admin/users/${encodeURIComponent(id)}`, "PATCH", patch)) ||
    (await tryJSON(`/users/update`, "POST", { id, userId: id, ...patch }))
  );
}

/* ===== UI ===== */
const UI = "'Inter Tight','Inter',system-ui";
const TEXT = "#111";
const PH = "#A7A7A7";
const UNDERLINE = "#d7d7d7";
const UNDERLINE_FOCUS = "#8d8d8d";
const ERR = "#fa5d29";
const FIELD_H = 48;

function ErrorSlot({ text }) {
  return (
    <div style={{ minHeight: 18, paddingTop: 6 }}>
      {!!text && (
        <span style={{ color: ERR, fontSize: 11, lineHeight: "11px", fontWeight: 300 }}>
          {text}
        </span>
      )}
    </div>
  );
}
function Field({ label, required, children, error, dim = false }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: dim ? PH : TEXT,
          fontWeight: 300,
          marginBottom: 6,
        }}
      >
        {label}
        {required ? " (*)" : ""}
      </div>
      {children}
      <ErrorSlot text={error} />
    </div>
  );
}
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
function Input({ value, onChange, placeholder, error, type = "text", readOnly = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
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
function Textarea({ value, onChange, rows = 5, error, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="with-ph"
      style={{
        ...baseFieldStyle(error),
        minHeight: 93,
        padding: 12,
        height: "auto",
        resize: "vertical",
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = error
          ? `inset 0 -1px 0 0 ${ERR}`
          : `inset 0 -1px 0 0 ${UNDERLINE}`;
      }}
    />
  );
}

/* чекбокс */
function Square({ checked }) {
  const size = 18, inner = 10;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        border: "1px solid #cfcfcf",
        borderRadius: 4,
        background: "transparent",
      }}
    >
      <span
        style={{
          width: inner,
          height: inner,
          borderRadius: 3,
          background: TEXT,
          transform: checked ? "scale(1)" : "scale(0)",
          transition: "transform 140ms ease-out",
        }}
      />
    </span>
  );
}

/* замочек */
const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 6 }}>
    <path
      d="M7 10V8a5 5 0 0110 0v2M6 10h12v10H6z"
      fill="none"
      stroke="#8a8a8a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ===== Группы (серверные коды ↔ русские подписи) ===== */
const GROUPS = [
  { code: "customer",   label: "Заказчик" },
  { code: "user",       label: "Пользователь" },
  { code: "performer",  label: "Исполнитель" },
  { code: "contractor", label: "Подрядчик" },
  { code: "designer",   label: "Проектировщик" },
  { code: "other",      label: "Другое" },
  { code: "supplier",   label: "Поставщик", locked: true },
  { code: "partner",    label: "Партнёр",   locked: true },
];
const labelByCode = (code) => GROUPS.find(g => g.code === code)?.label || "";
const isLockedCode = (code) => !!GROUPS.find(g => g.code === code)?.locked;
const toCode = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (GROUPS.some(g => g.code === s)) return s;
  const found = GROUPS.find(g => g.label.toLowerCase() === s);
  return found?.code || "user";
};

/* селект групп (используем и в админке) */
function GroupSelect({ value, onChange, error, canPickLocked = false }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="with-ph"
        style={{
          ...baseFieldStyle(error),
          display: "grid",
          gridTemplateColumns: "1fr 24px",
          alignItems: "center",
          textAlign: "left",
          cursor: "pointer",
        }}
        aria-expanded={open}
      >
        <span style={{ color: value ? TEXT : PH }}>
          {value ? labelByCode(value) : "Выберите вариант"}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
          {open ? (
            <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" />
          ) : (
            <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
          )}
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: FIELD_H,
            background: "#fff",
            boxShadow: "0 14px 40px rgba(0,0,0,.08)",
            zIndex: 5,
          }}
          role="listbox"
        >
          {GROUPS.map((g) => {
            const disabled = g.locked && !canPickLocked && value !== g.code;
            return (
              <button
                key={g.code}
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) { onChange(g.code); setOpen(false); } }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "none",
                  background: "#fff",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontFamily: UI,
                  fontSize: 16,
                  fontWeight: 300,
                  color: disabled ? "#b7b7b7" : TEXT,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "#fff"; }}
                role="option"
                aria-selected={value === g.code}
              >
                {g.locked ? <Lock /> : null}
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* селект ролей доступа (admin/manager/user) */
function AccessRoleSelect({ value, onChange }) {
  const OPTIONS = [
    { code: "user", label: "User" },
    { code: "manager", label: "Manager" },
    { code: "admin", label: "Admin" },
  ];
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        ...baseFieldStyle(false),
        height: FIELD_H,
        padding: "0 10px",
        background: "#fff",
      }}
    >
      {OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  );
}

/* города */
const fallbackCities = [
  "Москва","Санкт-Петербург","Новосибирск","Екатеринбург","Казань",
  "Нижний Новгород","Челябинск","Самара","Омск","Ростов-на-Дону",
  "Уфа","Красноярск","Пермь","Воронеж","Волгоград",
];
function CitySelect({ value, onChange, error, offset = 0 }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cities, setCities] = React.useState(fallbackCities);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    const url = `${(import.meta?.env?.BASE_URL || "/")}data/cities-ru.json`;
    fetch(url, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((arr) => { if (!cancelled) setCities(Array.isArray(arr) ? arr : Array.isArray(arr?.cities) ? arr.cities : fallbackCities); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const Arrow = ({ up }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
      {up ? <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" />
          : <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => String(c).toLowerCase().includes(q));
  }, [query, cities]);

  React.useEffect(() => {
    const onDocClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const inputStyle = {
    ...baseFieldStyle(error),
    display: "grid",
    gridTemplateColumns: "1fr 24px",
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 0,
    boxShadow: open
      ? "none"
      : error
      ? `inset 0 -1px 0 0 ${ERR}`
      : `inset 0 -1px 0 0 ${UNDERLINE}`,
  };

  return (
    <Field label="Город" required error={error}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="with-ph"
          style={inputStyle}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span style={{ color: value ? TEXT : PH }}>{value || "Выберите город"}</span>
          <Arrow up={open} />
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: FIELD_H + (offset || 0),
              zIndex: 70,
              background: "#fff",
              boxShadow: "0 14px 40px rgba(0,0,0,.08)",
              overflow: "hidden",
            }}
            role="listbox"
          >
            <div style={{ padding: 10, borderBottom: `1px solid ${UNDERLINE}` }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="with-ph"
                placeholder="Поиск города…"
                style={{
                  width: "100%",
                  height: 38,
                  border: "none",
                  outline: "none",
                  background: "#fff",
                  padding: "0 10px",
                  fontFamily: UI,
                  fontSize: 14,
                  fontWeight: 300,
                  color: TEXT,
                }}
              />
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 14, fontWeight: 300, color: "#6b7280" }}>
                  Не найдено
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      border: "none",
                      background: "#fff",
                      cursor: "pointer",
                      fontFamily: UI,
                      fontSize: 16,
                      fontWeight: 300,
                      color: TEXT,
                      transition: "background-color .12s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                    role="option"
                    aria-selected={value === c}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

/* аватар */
function AvatarPicker({ fileName, onPick, error }) {
  const inputRef = React.useRef(null);
  const open = () => inputRef.current?.click();
  const label = fileName || "Файл не выбран";
  const onChange = (e) => {
    const f = e.target.files?.[0] || null;
    e.target.value = "";
    if (!f) return;
    if (f.size > 400 * 1024) { alert("Макс. размер 400 КБ"); return; }
    onPick?.(f);
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
      <div
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
        style={{
          width: 200, height: 200, border: `1px dashed ${UNDERLINE}`, borderRadius: 10,
          display: "block", padding: 14, cursor: "pointer", background: "#fff",
          boxShadow: error ? `inset 0 0 0 1px ${ERR}` : "none",
        }}
        title="Перетащите или выберите файл"
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "center", transform: "translateY(-5px)" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z"
              fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 14V8m0 0l-3 3m3-3l3 3"
              fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: "center", color: "#222", fontFamily: UI, transform: "translateY(-10px)" }}>
          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 300 }}>
            {label}
            <br />
            Перетащите изображение или выберите файл в списке.
          </div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: "18px", fontWeight: 600 }}>
            Рекомендуемый размер: 400×400 пикселей. Макс. 400 КБ.
          </div>
        </div>
      </div>
      <ErrorSlot text={error} />
    </>
  );
}

/* утиль: файл → dataURL */
const fileToDataURL = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/* ширины/сетка */
const LEFT_COL = 360;
const MID_COL = 714;
const GAP_COL = 78;
const RIGHT_COL = 277;
const PAGE_PAD = 52;
const LINE_RIGHT_INSET = 64;

/* === надежное отслеживание текущего pathname === */
function useLocationPathname() {
  const [pathname, setPathname] = React.useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onPop = () => setPathname(window.location.pathname);

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    try {
      window.history.pushState = function (...args) {
        const ret = origPush.apply(this, args);
        window.dispatchEvent(new Event("locationchange"));
        window.dispatchEvent(new PopStateEvent("popstate"));
        return ret;
      };
      window.history.replaceState = function (...args) {
        const ret = origReplace.apply(this, args);
        window.dispatchEvent(new Event("locationchange"));
        window.dispatchEvent(new PopStateEvent("popstate"));
        return ret;
      };
    } catch {}

    const onLoc = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", onPop);
    window.addEventListener("locationchange", onLoc);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("locationchange", onLoc);
      try {
        window.history.pushState = origPush;
        window.history.replaceState = origReplace;
      } catch {}
    };
  }, []);

  return pathname;
}

/* ===== Верхняя полоска вкладок ===== */
function TabsBar({ active, isAdmin, onNavigate, lineWidth }) {
  const wrapRef = React.useRef(null);
  const tabRefs = React.useRef(new Map());
  const [underline, setUnderline] = React.useState({ left: 0, width: 56 });

  const TABS_DEF = React.useMemo(() => {
    return [
      { code: "profile",  label: "Профиль",  adminOnly: false, locked: false },
      { code: "partner",  label: "Партнёр",  adminOnly: false, locked: !isAdmin },
      { code: "supplier", label: "Поставщик",adminOnly: false, locked: !isAdmin },
      { code: "personal", label: "Личная информация", adminOnly: false, locked: false },
      { code: "admin",    label: "Администратор", adminOnly: true, locked: false },
    ].filter(t => (t.adminOnly ? isAdmin : true));
  }, [isAdmin]);

  const measure = React.useCallback(() => {
    const el = tabRefs.current.get(active);
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const rTab = el.getBoundingClientRect();
    const rWrap = wrap.getBoundingClientRect();
    setUnderline({
      left: Math.max(0, rTab.left - rWrap.left),
      width: Math.max(24, rTab.width),
    });
  }, [active]);

  React.useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  const toPath = (code) => {
    switch (code) {
      case "profile":  return "/account/profile";
      case "partner":  return "/account/partner";
      case "supplier": return "/account/supplier";
      case "personal": return "/account/personal";
      case "admin":    return "/account/admin";
      default:         return "/account/profile";
    }
  };

  const onClickTab = (e, tab) => {
    e.preventDefault();
    if (tab.locked) return;
    try {
      window.history.pushState({}, "", toPath(tab.code));
      onNavigate?.(tab.code);
    } catch {}
  };

  return (
    <div style={{ position: "relative", marginTop: -35, paddingBottom: 18 }}>
      <div
        ref={wrapRef}
        style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}
      >
        {TABS_DEF.map((t) => {
          const isActive = t.code === active;
          const refCb = (el) => { if (el) tabRefs.current.set(t.code, el); };
          const color = isActive ? TEXT : "#777";
          const weight = isActive ? 600 : 300;
          return (
            <a
              key={t.code}
              href={toPath(t.code)}
              ref={refCb}
              onClick={(e) => onClickTab(e, t)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color,
                fontWeight: weight,
                cursor: t.locked ? "not-allowed" : "pointer",
              }}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={t.locked || undefined}
              title={t.locked ? "Недоступно" : undefined}
            >
              {!isAdmin && (t.code === "partner" || t.code === "supplier") ? <Lock /> : null}
              {t.label}
            </a>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 10,
          position: "relative",
          width: typeof lineWidth === "number" ? `${lineWidth}px` : "100%",
          height: 1,
          backgroundImage:
            "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: underline.left,
            top: -1,
            width: underline.width,
            height: 2,
            background: "#000",
            transition: "left .18s ease, width .18s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ===== Админ-панель ===== */
function AdminPanel({ token }) {
  return <AdminPanelCore token={token} />;
}
function AdminPanelFiltered({ token, group }) {
  return <AdminPanelCore token={token} filterGroup={group} />;
}

function AdminPanelCore({ token, filterGroup }) {
  const [list, setList] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");

  // --- Черновики ---
  const [drafts, setDrafts] = React.useState({}); // { [key]: { group?, role? } }
  const getKey = (u) => String(u.id ?? u._id ?? u.userId ?? u.email ?? "");
  const setDraft = (key, patch) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  const clearDraft = (key) =>
    setDrafts((prev) => { const n = { ...prev }; delete n[key]; return n; });

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const j = await apiAdminListUsers(token, { limit: 50, offset: 0, q, group: filterGroup });
    const users = Array.isArray(j?.users) ? j.users : Array.isArray(j) ? j : [];
    setList(users);
    setTotal(Number(j?.total || users.length || 0));
    setLoading(false);
  }, [token, q, filterGroup]);

  React.useEffect(() => { load(); }, [load]);

  const currentGroup = (u, key) => toCode((drafts[key]?.group ?? u.group ?? "user"));
  const currentRole  = (u, key) => (drafts[key]?.role  ?? u.role  ?? "user");

  const isChanged = (u, key) => {
    const d = drafts[key];
    if (!d) return false;
    const gChanged = d.group && toCode(d.group) !== toCode(u.group);
    const rChanged = d.role  && d.role !== (u.role || "user");
    return gChanged || rChanged;
  };

  const saveRow = async (u) => {
    const key = getKey(u);
    const d = drafts[key] || {};
    const patch = {};
    if (d.group && toCode(d.group) !== toCode(u.group)) patch.group = toCode(d.group);
    if (d.role  && d.role !== (u.role || "user"))       patch.role  = d.role;
    if (!Object.keys(patch).length) return;

    const idForUpdate = u.id ?? u._id ?? u.userId ?? u.email;
    const res = await apiAdminUpdateUser(token, idForUpdate, patch);
    if (!res) { window.showDockToast?.("Не удалось сохранить"); return; }

    clearDraft(key);
    window.showDockToast?.("Сохранено");
    await load();
  };

  return (
    <div style={{ marginTop: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 600 }}>
          {filterGroup ? `Участники группы: ${labelByCode(filterGroup)}` : "Зарегистрированные учётные записи"}
        </div>
        <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
          Всего: {total}
        </div>
      </div>

      <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
        <Input value={q} onChange={setQ} placeholder="Поиск по имени, e-mail или телефону…" />
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
            const key = getKey(u) || String(idx);
            const changed = isChanged(u, key);
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
                    value={currentGroup(u, key)}
                    onChange={(code) => setDraft(key, { group: code })}
                    error={false}
                    canPickLocked={true}
                  />
                </div>
                <div>
                  <AccessRoleSelect
                    value={currentRole(u, key)}
                    onChange={(code) => setDraft(key, { role: code })}
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
                    disabled={!drafts[key]}
                    onClick={() => clearDraft(key)}
                    style={{
                      height: 36, padding: "0 12px", borderRadius: 8, border: `1px solid ${UNDERLINE}`,
                      background: "#fff", color: drafts[key] ? "#111" : "#999",
                      fontFamily: UI, fontSize: 13, fontWeight: 300, cursor: drafts[key] ? "pointer" : "not-allowed"
                    }}
                  >
                    Отменить
                  </button>
                  {changed ? <span style={{ fontSize: 12, fontWeight: 300, color: "#444" }}>• не сохранено</span> : null}
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
export default function AccountProfilePage() {
  const [token, setToken] = React.useState(null);
  const [userEmail, setUserEmail] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);

  /* поля */
  const [username, setUsername] = React.useState("");
  const [display, setDisplay] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [groupCode, setGroupCode] = React.useState("");
  const [city, setCity] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [avatar, setAvatar] = React.useState(null);
  const [emailOptIn, setEmailOptIn] = React.useState(false);

  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  /* вкладка из URL */
  const pathname = useLocationPathname();
  const tab = React.useMemo(() => {
    if (/\/account\/partner(\/|$)/.test(pathname))  return "partner";
    if (/\/account\/supplier(\/|$)/.test(pathname)) return "supplier";
    if (/\/account\/personal(\/|$)/.test(pathname)) return "personal";
    if (/\/account\/admin(\/|$)/.test(pathname))    return "admin";
    return "profile";
  }, [pathname]);

  /* подхватываем юзера */
  React.useEffect(() => {
    (async () => {
      let t = sessionStorage.getItem("auth:accessToken");
      if (!t) t = await apiRefresh(1200);
      if (!t) return;
      setToken(t);
      sessionStorage.setItem("auth:accessToken", t);

      const u = await apiMe(t);
      if (!u) return;

      const email = String(u.email || "");
      setUserEmail(email);

      const fromEmail = email.includes("@") ? email.split("@")[0] : "";
      setUsername((prev) => (prev || u.username || fromEmail));
      setDisplay((prev) => (prev || u.name || ""));

      setPhone(String(u.phone || ""));
      setGroupCode(toCode(u.group || u.role || "user"));
      setIsAdmin(Boolean(u.isAdmin || u.role === "admin" || u.group === "admin"));
      setCity(String(u.city || ""));
      setAbout(String(u.about || ""));
      setEmailOptIn(Boolean(u.emailOptIn));
    })();
  }, []);

  /* CSS плейсхолдера */
  React.useEffect(() => {
    const css = document.createElement("style");
    css.textContent = `.with-ph::placeholder{color:${PH};opacity:1}`;
    document.head.appendChild(css);
    return () => css.remove();
  }, []);

  /* якоря для выравнивания */
  const gridRef = React.useRef(null);
  const displayAnchorRef = React.useRef(null);
  const formTopAnchorRef = React.useRef(null);
  const leftStartRef = React.useRef(null);
  const [asideShift, setAsideShift] = React.useState(0);
  const [leftShift, setLeftShift] = React.useState(0);

  React.useEffect(() => {
    const calc = () => {
      if (!gridRef.current) return;
      const g = gridRef.current.getBoundingClientRect();
      if (displayAnchorRef.current) {
        const a = displayAnchorRef.current.getBoundingClientRect();
        setAsideShift(Math.max(0, a.top - g.top));
      }
      if (leftStartRef.current && formTopAnchorRef.current) {
        const l = leftStartRef.current.getBoundingClientRect();
        const f = formTopAnchorRef.current.getBoundingClientRect();
        setLeftShift(Math.max(0, f.top - l.top));
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const tabsLineWidth = MID_COL + GAP_COL + RIGHT_COL - LINE_RIGHT_INSET;

  async function handleSave() {
    const next = {};
    if (!username.trim()) next.username = "Укажите имя пользователя.";
    if (!display.trim()) next.display = "Укажите отображаемое имя.";
    if (!city.trim()) next.city = "Выберите город.";
    if (!groupCode) next.groupCode = "Выберите вариант.";
    if (isLockedCode(groupCode) && !isAdmin) next.groupCode = "Недостаточно прав для выбора этой группы.";
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }

    try {
      setSaving(true);
      const avatarDataUrl = avatar ? await fileToDataURL(avatar) : undefined;

      const resp = await apiUpdateProfile(token, {
        username: username.trim(),
        name: display.trim(),
        phone: phone.trim(),
        group: groupCode,
        city,
        about,
        emailOptIn,
        ...(avatarDataUrl ? { avatar: avatarDataUrl } : {}),
      });

      if (!resp) throw new Error("save_failed");

      const updatedUser = resp.user || { name: display.trim(), email: userEmail, group: groupCode };
      if (typeof window.setHeaderUser === "function") {
        window.setHeaderUser(updatedUser, token);
      } else {
        window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: updatedUser, accessToken: token } }));
      }

      window.showDockToast?.("Сохранено");
    } catch (e) {
      window.showDockToast?.("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  const INFO_UP = 37;

  const crumbLabel = {
    profile:  "Профиль",
    partner:  "Партнёр",
    supplier: "Поставщик",
    personal: "Личная информация",
    admin:    "Администратор",
  }[tab] || "Профиль";

  return (
    <main style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8", minHeight: "100dvh" }}>
      <div style={{ paddingTop: 72, paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD }}>
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: `${LEFT_COL}px ${MID_COL}px ${GAP_COL}px ${RIGHT_COL}px`,
            columnGap: 0,
            alignItems: "start",
            position: "relative",
          }}
        >
          {/* ЛЕВО — крошка + описание */}
          <aside>
            <div style={{ marginTop: -35 }}>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 7 }}>Профиль</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#333" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#111" }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="9.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                  <rect x="13.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 300 }}>{">"}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{crumbLabel}</span>
              </div>
            </div>

            <div ref={leftStartRef} />

            <div style={{ marginTop: leftShift }}>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35" }}>
                {tab === "admin"
                  ? "Роли и группы"
                  : tab === "personal"
                  ? "Личная информация"
                  : tab === "partner"
                  ? "Раздел: Партнёр"
                  : tab === "supplier"
                  ? "Раздел: Поставщик"
                  : "Ваш профиль"}
              </div>

              {tab === "admin" ? (
                <div style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222" }}>
                  Управляйте ролями (доступ) и группами (кто вы?) прямо тут.
                </div>
              ) : tab === "personal" ? (
                <div style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222" }}>
                  Заполните информацию о себе.
                </div>
              ) : (
                <>
                  <p style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222" }}>
                    Добавьте здесь дополнительную
                  </p>
                  <p style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222" }}>
                    информацию о себе.
                  </p>
                </>
              )}
            </div>
          </aside>

          {/* ЦЕНТР — вкладки + контент */}
          <section>
            <TabsBar
              active={tab}
              isAdmin={isAdmin}
              onNavigate={() => {}}
              lineWidth={tabsLineWidth}
            />

            {tab === "admin" && isAdmin ? (
              <AdminPanel token={token} />
            ) : tab === "partner" && isAdmin ? (
              <AdminPanelFiltered token={token} group="partner" />
            ) : tab === "supplier" && isAdmin ? (
              <AdminPanelFiltered token={token} group="supplier" />
            ) : (
              <>
                {tab === "personal" ? (
                  <div style={{ marginTop: 44 }}>
                    <form onSubmit={(e) => e.preventDefault()}>
                      <div style={{ display: "grid", gridTemplateColumns: "347px 347px", gap: 20 }}>
                        <div>
                          <CitySelect
                            value={city}
                            onChange={(v) => { setCity(v); if (errors.city) setErrors({ ...errors, city: "" }); }}
                            error={errors.city}
                            offset={0}
                          />
                        </div>
                        <div>
                          <Field label="Телефон" error={errors.phone}>
                            <Input
                              value={phone}
                              onChange={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                              placeholder="+7 (900) 000-00-00"
                              error={errors.phone}
                            />
                          </Field>
                        </div>
                      </div>

                      <div style={{ marginTop: 37 }}>
                        <Field label="Коротко о себе">
                          <Textarea value={about} onChange={setAbout} placeholder="Пара предложений о себе…" />
                        </Field>
                      </div>

                      <div style={{ marginTop: 37 }}>
                        <Field label="Аватар">
                          <AvatarPicker fileName={avatar?.name} onPick={(f) => setAvatar(f)} error={errors.avatar} />
                        </Field>
                      </div>

                      <div style={{ marginTop: 28, fontSize: 14, fontWeight: 300, color: "#222" }}>
                        КУБ может информировать меня о продуктах и услугах, отправляя персонализированные письма. Подробнее
                        см. в нашей{" "}
                        <a href="https://cube-tech.ru/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: TEXT, textDecoration: "none" }}>
                          Политике конфиденциальности
                        </a>.
                      </div>

                      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setEmailOptIn((v) => !v)}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                          aria-pressed={emailOptIn}
                        >
                          <Square checked={emailOptIn} />
                        </button>
                        <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
                          Свяжитесь со мной по электронной почте.
                        </div>
                      </div>
                    </form>

                    <div style={{ height: 200 }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 44 }}>
                    <div ref={formTopAnchorRef} />
                    <form onSubmit={(e) => e.preventDefault()}>
                      <div style={{ display: "grid", gridTemplateColumns: "347px 347px", gap: 20 }}>
                        <div>
                          <Field label="Имя пользователя" required error={errors.username}>
                            <div style={{ display: "grid", gridTemplateColumns: "161px 1fr", gap: 0 }}>
                              <div
                                tabIndex={-1}
                                style={{
                                  ...baseFieldStyle(false),
                                  color: PH,
                                  background: "#fff",
                                  pointerEvents: "none",
                                  userSelect: "text",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                https://cube-tech.ru/
                              </div>
                              <Input
                                value={username}
                                onChange={(v) => { setUsername(v); if (errors.username) setErrors({ ...errors, username: "" }); }}
                                placeholder={(userEmail || "").split("@")[0] || "yourname"}
                                error={errors.username}
                              />
                            </div>
                          </Field>
                        </div>

                        <div ref={displayAnchorRef}>
                          <Field label="Отображаемое имя" required error={errors.display}>
                            <Input
                              value={display}
                              onChange={(v) => { setDisplay(v); if (errors.display) setErrors({ ...errors, display: "" }); }}
                              placeholder="Фамилия Имя Отчество"
                              error={errors.display}
                            />
                          </Field>
                        </div>
                      </div>

                      <div style={{ marginTop: 58, display: "grid", gridTemplateColumns: "347px 347px", gap: 20 }}>
                        <div>
                          <Field label="Телефон" error={errors.phone}>
                            <Input
                              value={phone}
                              onChange={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                              placeholder="+7 (900) 000-00-00"
                              error={errors.phone}
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Кто вы?" required error={errors.groupCode}>
                            <GroupSelect
                              value={groupCode}
                              onChange={(code) => { setGroupCode(code); if (errors.groupCode) setErrors({ ...errors, groupCode: "" }); }}
                              error={errors.groupCode}
                              canPickLocked={isAdmin || isLockedCode(groupCode)}
                            />
                          </Field>
                        </div>
                      </div>

                      <div style={{ marginTop: 58 }}>
                        <CitySelect
                          value={city}
                          onChange={(v) => { setCity(v); if (errors.city) setErrors({ ...errors, city: "" }); }}
                          error={errors.city}
                          offset={0}
                        />
                      </div>

                      <div style={{ marginTop: 37 }}>
                        <Field label="Коротко о себе">
                          <Textarea value={about} onChange={setAbout} placeholder="Пара предложений о себе…" />
                        </Field>
                      </div>

                      <div style={{ marginTop: 37 }}>
                        <Field label="Аватар">
                          <AvatarPicker fileName={avatar?.name} onPick={(f) => setAvatar(f)} error={errors.avatar} />
                        </Field>
                      </div>

                      <div style={{ marginTop: 28 - INFO_UP, fontSize: 14, fontWeight: 300, color: "#222" }}>
                        КУБ может информировать меня о продуктах и услугах, отправляя персонализированные письма. Подробнее
                        см. в нашей{" "}
                        <a href="https://cube-tech.ru/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: TEXT, textDecoration: "none" }}>
                          Политике конфиденциальности
                        </a>.
                      </div>

                      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setEmailOptIn((v) => !v)}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                          aria-pressed={emailOptIn}
                        >
                          <Square checked={emailOptIn} />
                        </button>
                        <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
                          Свяжитесь со мной по электронной почте.
                        </div>
                      </div>
                    </form>

                    <div style={{ height: 200 }} />
                  </div>
                )}
              </>
            )}
          </section>

          {/* промежуток */}
          <div />

          {/* ПРАВАЯ кнопка — только на вкладках профиля/личной информации */}
          {tab === "admin" || (isAdmin && (tab === "partner" || tab === "supplier")) ? (
            <div />
          ) : (
            <aside style={{ position: "sticky", top: 24, marginTop: Math.max(0, asideShift) }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: RIGHT_COL,
                  height: 72,
                  borderRadius: 10,
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  fontFamily: UI,
                  fontSize: 18,
                  fontWeight: 300,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "filter .15s ease",
                  opacity: saving ? 0.92 : 1,
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.filter = "brightness(0.92)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
              >
                {saving ? "Сохранение…" : "Сохранить изменения"}
              </button>
              <div style={{ marginTop: 14, fontSize: 14, fontWeight: 300, color: "#222", maxWidth: RIGHT_COL }}>
                Если вы внесли какие-либо изменения, не забудьте сохранить их, прежде чем покинуть эту страницу.
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
