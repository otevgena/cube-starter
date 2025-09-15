// src/pages/account/profile.jsx
import React from "react";

/* ===== API helpers (как в Header.jsx) ===== */
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

/* гибкий апдейт профиля (пробуем несколько эндпоинтов) */
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
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`;
      }}
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
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`;
      }}
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
  { code: "executor",   label: "Исполнитель" },
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

/* селект — «Кто вы?» с блокировкой supplier/partner */
function RoleSelect({ value, onChange, error, canPickLocked = false }) {
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

/* города — как в pro.jsx */
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

/* аватар — иконка по центру, текст ещё ближе на 10px */
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
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z"
              fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 14V8m0 0l-3 3m3-3l3 3"
              fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* подвинул текст ближе к иконке на 10px */}
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

export default function AccountProfilePage() {
  const [token, setToken] = React.useState(null);
  const [userEmail, setUserEmail] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);

  /* поля */
  const [username, setUsername] = React.useState("");
  const [display, setDisplay] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState(""); // серверный код группы
  const [city, setCity] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [avatar, setAvatar] = React.useState(null);
  const [emailOptIn, setEmailOptIn] = React.useState(false);

  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  /* подхватываем юзера, автозаполнение username(часть до @) и display(name), role=код */
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
      setRole(toCode(u.group || u.role || "user"));
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

  const lineWidth = MID_COL + GAP_COL + RIGHT_COL;

  async function handleSave() {
    const next = {};
    if (!username.trim()) next.username = "Укажите имя пользователя.";
    if (!display.trim()) next.display = "Укажите отображаемое имя.";
    if (!city.trim()) next.city = "Выберите город.";
    if (!role) next.role = "Выберите вариант.";
    // подстраховка от выбора закрытых групп
    if (isLockedCode(role) && !isAdmin) next.role = "Недостаточно прав для выбора этой группы.";
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!token) { alert("Авторизуйтесь, чтобы сохранить изменения."); return; }

    try {
      setSaving(true);
      const avatarDataUrl = avatar ? await fileToDataURL(avatar) : undefined;

      const resp = await apiUpdateProfile(token, {
        username: username.trim(),
        name: display.trim(),
        phone: phone.trim(),
        group: role,            // серверный код
        role: role,             // дублируем для совместимости
        city,
        about,
        emailOptIn,
        ...(avatarDataUrl ? { avatar: avatarDataUrl } : {}),
      });

      if (!resp) throw new Error("save_failed");

      const updatedUser = resp.user || { name: display.trim(), email: userEmail, group: role };
      if (typeof window.setHeaderUser === "function") {
        window.setHeaderUser(updatedUser, token);
      } else {
        window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: updatedUser, accessToken: token } }));
      }

      alert("Изменения сохранены");
    } catch (e) {
      alert("Не удалось сохранить. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  const INFO_UP = 37;
  const emailPrefix = (userEmail || "").split("@")[0] || "";

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
            {/* Крошка — поднята, иконка перед «>» */}
            <div style={{ marginTop: -35 }}>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 7 }}>Профиль</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#333" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#111" }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="9.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                  <rect x="13.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 300 }}>{">"}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Профиль</span>
              </div>
            </div>

            <div ref={leftStartRef} />

            <div style={{ marginTop: leftShift }}>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35" }}>Ваш профиль</div>
              <div style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222" }}>
                Добавьте здесь дополнительную
              </div>
              <div style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222" }}>
                информацию о себе.
              </div>
            </div>
          </aside>

          {/* ЦЕНТР — вкладки + dotted + форма */}
          <section>
            <div style={{ position: "relative", marginTop: -35, paddingBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}>
                <button type="button" style={{ background: "transparent", border: "none", padding: 0, cursor: "default", fontWeight: 600, color: TEXT }}>
                  Профиль
                </button>
                <span style={{ display: "inline-flex", alignItems: "center", fontWeight: 300, color: "#777" }}>
                  <Lock /> Партнёр
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", fontWeight: 300, color: "#777" }}>
                  <Lock /> Поставщик
                </span>
                <span style={{ fontWeight: 300, color: TEXT }}>Личная информация</span>
              </div>

              <div
                style={{
                  marginTop: 10,
                  position: "relative",
                  width: `${lineWidth}px`,
                  height: 1,
                  backgroundImage:
                    "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
                }}
              >
                <div style={{ position: "absolute", left: 0, top: -1, width: 56, height: 2, background: "#000" }} />
              </div>
            </div>

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
                          placeholder={emailPrefix || "yourname"}
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
                    <Field label="Кто вы?" required error={errors.role}>
                      <RoleSelect
                        value={role}
                        onChange={(code) => { setRole(code); if (errors.role) setErrors({ ...errors, role: "" }); }}
                        error={errors.role}
                        canPickLocked={isAdmin || isLockedCode(role)}
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
                  </a>
                  .
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

              {/* нижний запас, чтобы футер не прилипал */}
              <div style={{ height: 200 }} />
            </div>
          </section>

          {/* промежуток */}
          <div />

          {/* ПРАВАЯ кнопка — верх ровно на уровне верха «Отображаемое имя» */}
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
        </div>
      </div>
    </main>
  );
}
