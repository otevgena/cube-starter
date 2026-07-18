// src/pages/account/objects/ObjectsSection.jsx
// Раздел «Объекты» — простой вид (как раньше) + инструменты администратора:
// создать объект (заказчик + шаблон), редактировать (ответственный, этапы, документы),
// предпросмотр как заказчик. Фильтр-бар в стиле пилюль. Данные — src/data/objects.js.
import React from "react";
import { createPortal } from "react-dom";
import * as DB from "@/data/objects.js";
import Spinner, { CenterSpinner } from "@/components/common/Spinner.jsx";
import {
  OBJECT_STATUSES, STAGE_STATUSES, DOC_CATEGORIES, STAGE_PRESETS, OBJECT_TEMPLATES,
  toneOf, labelOf, extOf, getEmployees,
  getTemplates, templateByCode, addTemplate, updateTemplate, removeTemplate,
  resetTemplate, isTemplateModified, normalizePrefix,
  employeeByEmail, hydrateStaff, adminGetUser, saveStaff, removeStaff,
  getMessages, addMessage, threadStatus,
} from "@/data/objects.js";
import {
  PERMISSIONS, PERM_GROUP_LABELS, permLabel, ROLE_LABELS, STAFF_ROLES,
  effectivePerms, diffOverrides,
} from "@/lib/perms.js";

/* ===================== стиль ===================== */
const UI = "'Inter Tight','Inter',system-ui";
const TEXT = "#111", MUTED = "#777", LINE = "#e6e6e6", FIELD = "#e9e9e9", CARROT = "#FA5D29";
const FILTER_BG = "#efefef"; // фон самого фильтр-бара (рамка вокруг контролов)
const CTRL_REST = "#f8f8f8"; // контролы фильтра в покое — цвет общего фона страницы, при наведении белеют
const backBtn = { border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: MUTED };
const secLabel = { fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED };
const h1 = { fontSize: 24, fontWeight: 600, color: TEXT };
const inputStyle = { height: 40, padding: "0 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", fontFamily: UI, fontSize: 14, color: TEXT, outline: "none", minWidth: 0, width: "100%" };
const darkBtn = { height: 40, padding: "0 16px", borderRadius: 8, border: "none", background: "#111", color: "#fff", fontFamily: UI, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, transition: "background-color .15s ease" };
// компактная кнопка-иконка (↑ / ↓ / ✕) в строке этапа
const stepBtn = (disabled) => ({ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 6, border: `1px solid ${LINE}`, background: "#fff", color: disabled ? "#c8c8c8" : "#555", cursor: disabled ? "default" : "pointer", fontSize: 13, lineHeight: 1, flexShrink: 0 });
// Чёрная кнопка с hover как у «Ищу работу» в шапке (#111 → #262626). Наследует darkBtn + любой override через style.
function DarkBtn({ children, onClick, disabled, style, type = "button", ...rest }) {
  const base = { ...darkBtn, ...style };
  const bg = base.background || "#111";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={base}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#262626"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg; }}
      {...rest}
    >
      {children}
    </button>
  );
}

function navigate(to) { try { window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); } catch { window.location.href = to; } }
function useForceUpdate() { const [, s] = React.useState(0); return React.useCallback(() => s((v) => v + 1), []); }

/* ---- фирменная форма (как на /admin/create-account): подчёркнутое поле, uppercase-лейбл, квадратный чекбокс ---- */
const UNDER = "#e6e6e6", UNDER_FOCUS = "#111";
const fLabelStyle = { fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: TEXT, fontWeight: 300, marginBottom: 6 };
export function FLabel({ children }) { return <div style={fLabelStyle}>{children}</div>; }
export function UnderInput({ value, onChange, placeholder, type = "text", maxLength, upper }) {
  return (
    <input type={type} value={value} maxLength={maxLength} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} className="obj-ph"
      style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${UNDER}`, transition: "box-shadow .18s ease", ...(upper ? { textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 } : null) }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; }} />
  );
}
function SquareCheck({ checked }) {
  return (
    <span aria-hidden="true" style={{ width: 18, height: 18, display: "inline-grid", placeItems: "center", border: `1px solid ${checked ? TEXT : "#cfcfcf"}`, borderRadius: 4, background: "transparent", flexShrink: 0, transition: "border-color .14s ease" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: TEXT, transform: checked ? "scale(1)" : "scale(0)", transition: "transform 140ms ease-out" }} />
    </span>
  );
}

/* ---- подчёркнутый селект — ОДИН стиль с /admin/create-account (блок «Группа»): тот же шрифт, та же выпадашка ---- */
const underFieldStyle = (open, ok) => ({ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: ok ? TEXT : "#9a9a9a", padding: "0 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${open ? UNDER_FOCUS : UNDER}`, transition: "box-shadow .18s ease", display: "grid", gridTemplateColumns: "1fr 24px", alignItems: "center", textAlign: "left", cursor: "pointer" });
const underMenuStyle = { position: "absolute", left: 0, right: 0, top: 46, background: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,.08)", zIndex: 40, maxHeight: 320, overflowY: "auto" };
function Chevron({ open }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: "#b1b1b1", justifySelf: "end", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function UnderSelect({ value, onChange, options, placeholder = "Выберите вариант" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const cur = options.find((o) => o.value === value);
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={underFieldStyle(open, !!cur)}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur ? cur.label : placeholder}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="animate-svcfade" style={underMenuStyle}>
          {options.map((o) => (
            <button key={String(o.value)} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: o.value === value ? "#f3f3f3" : "#fff", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = "#f8f8f8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = o.value === value ? "#f3f3f3" : "#fff"; }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// Тот же подчёркнутый вид, но со встроенным поиском — для выбора учётной записи-заказчика.
function UnderAccountPicker({ accounts, value, onPick, loading }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const ql = q.trim().toLowerCase();
  const filtered = accounts.filter((a) => !ql || [a.name, a.email, a.org].some((f) => String(f || "").toLowerCase().includes(ql))).slice(0, 40);
  const display = value ? (value.name || value.email) : "";
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={underFieldStyle(open, !!display)}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display || (loading ? "Загрузка учётных записей…" : "Выберите учётную запись")}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="animate-svcfade" style={{ ...underMenuStyle, padding: 6 }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени, e-mail…"
            style={{ width: "100%", height: 40, border: "none", outline: "none", background: "#fafafa", padding: "0 12px", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, marginBottom: 6 }} />
          {filtered.length === 0 ? (
            <div style={{ padding: "10px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              {loading ? "Загрузка…" : (accounts.length === 0
                ? "Нет учётных записей. Создайте её в разделе «Администратор → Создать учётную запись»."
                : "Ничего не найдено.")}
            </div>
          ) : filtered.map((a) => {
            const active = value && value.id === a.id;
            return (
              <button key={a.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(a); setOpen(false); setQ(""); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: active ? "#f3f3f3" : "#fff", cursor: "pointer", fontFamily: UI }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = active ? "#f3f3f3" : "#fff"; }}>
                <div style={{ fontSize: 15, fontWeight: 300, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name || a.email}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.email}{a.org ? ` · ${a.org}` : ""}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
// Подчёркнутый ввод с фиксацией по blur (для редактора: defaultValue + onCommit).
function UnderCommitInput({ defaultValue, onCommit, placeholder }) {
  return (
    <input defaultValue={defaultValue} placeholder={placeholder} className="obj-ph"
      style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${UNDER}`, transition: "box-shadow .18s ease" }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; if (e.target.value !== (defaultValue || "")) onCommit(e.target.value); }} />
  );
}
// Поле ИНН с автоподстановкой организации (DaData): набрал 10/12 цифр → тянем КПП/адрес/заказчика.
function ObjInnField({ obj, save }) {
  const [busy, setBusy] = React.useState(false);
  const onType = async (v) => {
    const digits = String(v).replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 12) {
      setBusy(true);
      const c = await DB.lookupOrgByInn(digits);
      setBusy(false);
      const patch = { inn: v };
      if (c) {
        if (c.kpp) patch.kpp = c.kpp;
        if (c.address) patch.address = c.address;
        if (c.name && !obj.customerName) patch.customerName = c.name;
      }
      save(patch);
    }
  };
  return (
    <div>
      <FLabel>{busy ? "ИНН — подтягиваем…" : "ИНН"}</FLabel>
      <input defaultValue={obj.inn} placeholder="Введите ИНН" className="obj-ph"
        style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${UNDER}`, transition: "box-shadow .18s ease" }}
        onChange={(e) => onType(e.target.value)}
        onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; if (e.target.value !== (obj.inn || "")) save({ inn: e.target.value }); }} />
    </div>
  );
}
// Подчёркнутый поиск (вместо пилюли) — тот же язык, что и поля формы.
function UnderSearch({ value, onChange, placeholder, width = 460 }) {
  const [foc, setFoc] = React.useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, maxWidth: width, width: "100%", boxShadow: `inset 0 -1px 0 0 ${foc ? UNDER_FOCUS : UNDER}`, transition: "box-shadow .18s ease" }}>
      <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0, color: foc ? TEXT : "#b1b1b1", transition: "color .18s ease" }}><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} placeholder={placeholder}
        style={{ border: 0, background: "transparent", outline: "none", width: "100%", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT }} />
    </div>
  );
}

/* ---- список в стиле сайта (как таблица услуг): пунктирные строки, uppercase-заголовок ---- */
function DottedLine() {
  return <div style={{ height: 1, width: "100%", backgroundImage: "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)" }} />;
}
function ListHead({ label, count }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 12, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>
      <span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{String(count).padStart(2, "0")}</span>
    </div>
  );
}
// Строка списка с hover-подсветкой и пунктиром снизу. onOpen делает всю строку «проваливаемой».
function ListRow({ onOpen, children }) {
  const [h, setH] = React.useState(false);
  return (
    <>
      <div onClick={onOpen} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 8px", margin: "0 -8px", cursor: onOpen ? "pointer" : "default", background: h && onOpen ? "rgba(0,0,0,.02)" : "transparent", transition: "background-color .14s ease" }}>
        {children}
      </div>
      <DottedLine />
    </>
  );
}

/* ---- бейдж ---- */
function Badge({ label, tone = "#8a8a8a", light }) {
  return <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 9px", borderRadius: 999, background: light ? "#f1f1f1" : `${tone}1a`, color: light ? "#333" : tone, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
}

/* ---- поиск (стиль сайта) ---- */
function SearchInput({ value, onChange, placeholder, width = 300, bare }) {
  const [hov, setHov] = React.useState(false);
  const [foc, setFoc] = React.useState(false);
  // внутри фильтр-бара (bare): в покое сливается с фоном бара, при наведении/фокусе белеет
  const active = !bare || hov || foc;
  return (
    <label onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, height: 42, borderRadius: 8, background: active ? "#fff" : CTRL_REST, border: `1px solid ${bare ? "transparent" : LINE}`, padding: "0 16px", width, maxWidth: "100%", cursor: "text", transition: "background-color .18s ease, box-shadow .18s ease", boxShadow: bare && active ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>
      <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0, color: "#555" }}><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <input className="obj-ph" value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} placeholder={placeholder} style={{ border: 0, background: "transparent", outline: "none", width: "100%", fontFamily: UI, fontSize: 14, fontWeight: 500, color: TEXT }} />
    </label>
  );
}

/* ---- селект (наш стиль + анимация); pill — вид как в фильтре ---- */
function Select({ value, options, onChange, placeholder = "выбрать", width = 180, pill, dotColor }) {
  const [open, setOpen] = React.useState(false);
  const [hov, setHov] = React.useState(false);
  const ref = React.useRef(null);
  const cur = options.find((o) => o.value === value);
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  // pill (в фильтр-баре): в покое сливается с фоном бара, при наведении/раскрытии белеет
  const active = !pill || hov || open;
  return (
    <div ref={ref} style={{ position: "relative", width, flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 42, padding: "0 14px", borderRadius: 8, border: pill ? "1px solid transparent" : `1px solid ${open ? "#c2c2c2" : hov ? "#d5d5d5" : LINE}`, background: pill ? (active ? "#fff" : CTRL_REST) : "#fff", boxShadow: (pill && active) || (!pill && (open || hov)) ? "0 1px 3px rgba(0,0,0,.06)" : "none", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 500, color: TEXT, textAlign: "left", transition: "background-color .18s ease, box-shadow .18s ease, border-color .18s ease" }}>
        {dotColor && <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0 }} />}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur ? cur.label : placeholder}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: "#9a9a9a", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="animate-svcfade" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: "100%", zIndex: 70, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, maxHeight: 300, overflowY: "auto" }}>
          {options.map((o) => (
            <button key={String(o.value)} type="button" onClick={() => { onChange(o.value); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: UI, fontSize: 14, color: TEXT, textAlign: "left", background: o.value === value ? "#f3f3f3" : "transparent", whiteSpace: "normal", lineHeight: 1.35, transition: "background-color .12s ease" }} onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = "#f7f7f7"; }} onMouseLeave={(e) => { e.currentTarget.style.background = o.value === value ? "#f3f3f3" : "transparent"; }}>
              {o.dotColor && <span style={{ width: 8, height: 8, borderRadius: 999, background: o.dotColor, flexShrink: 0 }} />}{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- кнопка с hover-заливкой (как «Оставить заявку») ---- */
// Кнопка-капсула — идентична «Подробнее» в услугах: контур → чёрная заливка на hover, текст белый.
export function FillBtn({ children, onClick, href, download, fill = "#111", tiny, big }) {
  const [h, setH] = React.useState(false);
  const height = big ? 44 : tiny ? 34 : 42;
  const st = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height, padding: tiny ? "0 14px" : "0 18px", borderRadius: 12, border: `1px solid ${fill}`, background: h ? fill : "transparent", color: h ? "#fff" : fill, fontFamily: UI, fontSize: tiny ? 13 : 14, fontWeight: 400, cursor: "pointer", textDecoration: "none", userSelect: "none", transition: "background-color .16s ease, color .16s ease", flexShrink: 0, whiteSpace: "nowrap" };
  const on = { onMouseEnter: () => setH(true), onMouseLeave: () => setH(false) };
  if (href) return <a href={href} download={download} style={st} {...on}>{children}</a>;
  return <button type="button" onClick={onClick} style={st} {...on}>{children}</button>;
}

/* ---- основная кнопка (сплошная тёмная, парная к FillBtn big) ---- */
export function PrimaryBtn({ children, onClick, disabled, type = "button" }) {
  const [h, setH] = React.useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 44, padding: "0 22px", borderRadius: 10, border: "none", background: disabled ? "#bdbdbd" : (h ? "#262626" : "#111"), color: "#fff", fontFamily: UI, fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "background-color .16s ease, box-shadow .16s ease, transform .16s ease", boxShadow: h && !disabled ? "0 8px 22px rgba(0,0,0,.18)" : "none", transform: h && !disabled ? "translateY(-1px)" : "none" }}>
      {children}
    </button>
  );
}

/* ---- иконка «корзина» + инлайн-действие с подчёркиванием (как «Удалить аккаунт» в Настройках) ---- */
function IconTrash({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function IconAction({ onClick, children, prompt }) {
  const [h, setH] = React.useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {prompt && <span style={{ fontSize: 15, fontWeight: 300, color: "#4a4a4a" }}>{prompt}</span>}
      <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "transparent", border: "none", padding: 0, color: CARROT, cursor: "pointer" }}>
        <IconTrash />
        <span style={{ position: "relative", fontSize: 15, fontWeight: 600, paddingBottom: 4 }}>
          {children}
          <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "#d7d7d7" }} />
          <span style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: h ? "100%" : 0, background: CARROT, transition: "width .3s ease" }} />
        </span>
      </button>
    </div>
  );
}

/* Форматы, которые просмотрщик умеет показывать в браузере. Архивы (zip/rar/7z…),
   pptx, dwg, старый .doc и т.п. — только скачивание, кнопку «Открыть» не показываем. */
const PREVIEWABLE_EXT = new Set([
  "pdf",
  "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif",
  "txt", "log", "json", "md", "xml", "yml", "yaml",
  "docx", "xlsx", "xls", "csv",
]);
function canPreview(doc) {
  return PREVIEWABLE_EXT.has(extOf(doc.type || doc.file || doc.title));
}

/* ---- кнопка «Скачать/Открыть»: presigned-ссылка (key) или legacy base64 (url) ----
   preview=true — открыть просмотрщик в модалке, иначе — скачивание (attachment). ---- */
function DownloadBtn({ doc, label = "Скачать", preview = false }) {
  const [busy, setBusy] = React.useState(false);
  const [viewing, setViewing] = React.useState(false);
  const download = async () => {
    if (busy) return;
    if (doc.key) {
      try {
        setBusy(true);
        const url = await DB.downloadUrl(doc.key, doc.file || doc.title, { inline: false });
        const a = document.createElement("a"); a.href = url; a.download = doc.file || doc.title || "file"; document.body.appendChild(a); a.click(); a.remove();
      }
      catch (e) {
        const msg = e && e.status === 403 ? "Нет доступа к файлу" : e && e.status ? `Не удалось получить файл (${e.status})` : "Не удалось получить файл";
        window.showDockToast?.(msg, 3200, "error");
      }
      finally { setBusy(false); }
    } else if (doc.url) {
      const a = document.createElement("a"); a.href = doc.url; a.download = doc.file || doc.title || "file"; document.body.appendChild(a); a.click(); a.remove();
    } else { window.showDockToast?.("Файл не прикреплён", 3000, "error"); }
  };
  const onClick = () => {
    if (preview) { if (doc.key || doc.url) setViewing(true); else window.showDockToast?.("Файл не прикреплён", 3000, "error"); }
    else download();
  };
  if (busy) return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, minWidth: 44, flexShrink: 0 }}><Spinner size={18} /></span>;
  return (
    <>
      <FillBtn tiny onClick={onClick}>{label}</FillBtn>
      {viewing && <DocViewer doc={doc} onClose={() => setViewing(false)} />}
    </>
  );
}

/* ---- Просмотрщик документов (клиентский): pdf/картинки/текст — нативно,
   docx — mammoth, xlsx/csv — SheetJS; тяжёлые либы грузятся лениво import(). ---- */
function dataUrlToArrayBuffer(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function DocViewer({ doc, onClose }) {
  const ext = extOf(doc.type || doc.file || doc.title);
  const name = doc.file || doc.title || "Документ";
  const [st, setSt] = React.useState({ loading: true, error: "", kind: "", url: "", html: "", text: "", sheets: null });
  const [sheet, setSheet] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    const set = (patch) => { if (alive) setSt((s) => ({ ...s, ...patch })); };
    (async () => {
      try {
        const src = doc.key ? await DB.downloadUrl(doc.key, name, { inline: true }) : (doc.url || "");
        if (!src) throw new Error("нет ссылки на файл");
        const fetchOk = async () => { const r = await fetch(src); if (!r.ok) throw new Error(`файл недоступен в хранилище (${r.status})`); return r; };
        const getBuffer = async () => (doc.key ? (await fetchOk()).arrayBuffer() : dataUrlToArrayBuffer(src));

        if (ext === "pdf") { set({ loading: false, kind: "pdf", url: src }); return; }
        if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) { set({ loading: false, kind: "image", url: src }); return; }
        if (["txt", "log", "json", "md", "xml", "yml", "yaml"].includes(ext)) {
          const text = doc.key ? await (await fetchOk()).text() : new TextDecoder().decode(dataUrlToArrayBuffer(src));
          set({ loading: false, kind: "text", text }); return;
        }
        if (ext === "docx") {
          const arrayBuffer = await getBuffer();
          const mammoth = await import("mammoth/mammoth.browser.js");
          const res = await (mammoth.default || mammoth).convertToHtml({ arrayBuffer });
          set({ loading: false, kind: "html", html: res.value || "<p>Пустой документ.</p>" }); return;
        }
        if (["xlsx", "xls", "csv"].includes(ext)) {
          const arrayBuffer = await getBuffer();
          const XLSX = await import("xlsx");
          const wb = XLSX.read(arrayBuffer, { type: "array" });
          const sheets = wb.SheetNames.map((n) => ({ name: n, html: XLSX.utils.sheet_to_html(wb.Sheets[n], { editable: false }) }));
          set({ loading: false, kind: "sheets", sheets: sheets.length ? sheets : [{ name: "—", html: "<p>Пустая книга.</p>" }] }); return;
        }
        // остальное (doc, pptx, dwg, zip…) — предпросмотр невозможен
        set({ loading: false, kind: "unsupported" });
      } catch (e) {
        const msg = e && e.status === 403 ? "Нет доступа к файлу (объект не привязан к учётке или документ снят с публикации)" : (e && e.message) || String(e);
        set({ loading: false, error: msg });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadFallback = async () => {
    try {
      const url = doc.key ? await DB.downloadUrl(doc.key, name, { inline: false }) : doc.url;
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    } catch { window.showDockToast?.("Не удалось скачать файл", 3000, "error"); }
  };

  const frame = { border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff", width: "100%", height: "72vh" };
  return (
    <Modal title={name} onClose={onClose} width={960}>
      <style>{`
        .doc-view img{ max-width:100%; height:auto; }
        .doc-view table{ border-collapse:collapse; width:100%; }
        .doc-view td,.doc-view th{ border:1px solid ${LINE}; padding:6px 8px; }
        .doc-view h1,.doc-view h2,.doc-view h3{ margin:.6em 0 .3em; font-weight:600; }
        .doc-view p{ margin:.4em 0; }
        .doc-sheet table{ border-collapse:collapse; font-size:13px; }
        .doc-sheet td,.doc-sheet th{ border:1px solid ${LINE}; padding:4px 8px; white-space:nowrap; color:${TEXT}; }
        .doc-sheet tr:first-child td{ background:#f6f6f6; font-weight:600; }
      `}</style>
      {st.loading ? (
        <CenterSpinner minHeight={320} label="Открываем документ…" />
      ) : st.error ? (
        <div style={{ minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 300, color: MUTED }}>Не удалось открыть файл в браузере.</div>
          <FillBtn onClick={downloadFallback}>Скачать файл</FillBtn>
        </div>
      ) : st.kind === "pdf" ? (
        <iframe title={name} src={st.url} style={frame} />
      ) : st.kind === "image" ? (
        <div style={{ display: "flex", justifyContent: "center", background: "#f6f6f6", borderRadius: 10, padding: 12 }}>
          <img src={st.url} alt={name} style={{ maxWidth: "100%", maxHeight: "72vh", objectFit: "contain" }} />
        </div>
      ) : st.kind === "text" ? (
        <pre style={{ ...frame, height: "auto", maxHeight: "72vh", overflow: "auto", margin: 0, padding: 16, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: TEXT }}>{st.text}</pre>
      ) : st.kind === "html" ? (
        <div className="doc-view" style={{ ...frame, height: "auto", maxHeight: "72vh", overflow: "auto", padding: "24px 28px", fontSize: 14, lineHeight: 1.6, color: TEXT }} dangerouslySetInnerHTML={{ __html: st.html }} />
      ) : st.kind === "sheets" ? (
        <div>
          {st.sheets.length > 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {st.sheets.map((s, i) => (
                <button key={i} type="button" onClick={() => setSheet(i)}
                  style={{ height: 30, padding: "0 12px", borderRadius: 8, border: `1px solid ${i === sheet ? TEXT : LINE}`, background: i === sheet ? TEXT : "#fff", color: i === sheet ? "#fff" : TEXT, fontFamily: UI, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>{s.name}</button>
              ))}
            </div>
          )}
          <div className="doc-sheet" style={{ ...frame, height: "auto", maxHeight: "72vh", overflow: "auto", padding: 0 }} dangerouslySetInnerHTML={{ __html: st.sheets[sheet].html }} />
        </div>
      ) : (
        <div style={{ minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 300, color: MUTED }}>Для формата <b style={{ fontWeight: 600, color: TEXT }}>.{ext || "?"}</b> предпросмотр в браузере недоступен.</div>
          <FillBtn onClick={downloadFallback}>Скачать файл</FillBtn>
        </div>
      )}
    </Modal>
  );
}

const EXT_COLORS = { pdf: "#e5484d", docx: "#2b6cb0", doc: "#2b6cb0", xlsx: "#2f855a", xls: "#2f855a", pptx: "#c05621", zip: "#5b6472", dwg: "#b7791f" };
function ExtBadge({ ext }) { const e = extOf(ext); return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 46, height: 22, padding: "0 8px", borderRadius: 6, background: EXT_COLORS[e] || "#5b6472", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>{e || "файл"}</span>; }
function Dotted() { return <div aria-hidden="true" style={{ height: 1, backgroundImage: "repeating-linear-gradient(to right,#d9d9d9 0 1px,rgba(0,0,0,0) 1px 8px)" }} />; }

/* ---- фильтр-бар (стиль скрина: пилюли + счётчик + сброс) ---- */
function FilterBar({ search, filters, activeCount, onReset }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: FILTER_BG, borderRadius: 10, padding: 10 }}>
      {search && <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} width={280} bare />}
      {filters.map((f, i) => <Select key={i} pill value={f.value} onChange={f.onChange} options={f.options} placeholder={f.placeholder} width={f.width || 160} />)}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ display: "inline-grid", placeItems: "center", minWidth: 28, height: 28, borderRadius: 9, background: activeCount > 0 ? CARROT : "#dcdcdc", color: activeCount > 0 ? "#fff" : "#8a8a8a", fontSize: 13, fontWeight: 700, transition: "background-color .15s ease, color .15s ease" }}>{activeCount}</span>
        <button type="button" onClick={onReset} style={{ ...backBtn, display: "inline-flex", alignItems: "center", gap: 7, color: "#333", fontWeight: 500, fontSize: 14 }}>
          Сбросить фильтры
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: "#333" }}><path d="M20 11a8 8 0 1 0-2 5.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M20 5v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

/* десктоп ≥768px? (для единственного крестика — без конфликта Tailwind vs inline style) */
function useIsWide() {
  const [wide, setWide] = React.useState(() => (typeof window !== "undefined" ? window.innerWidth >= 768 : true));
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/* ---- модалка ---- */
function Modal({ title, onClose, children, width = 520 }) {
  const wide = useIsWide();
  React.useEffect(() => { const f = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onClose]);
  // как у модалок входа: прячем StickyDock (body.has-modal) + лочим скролл фона
  React.useEffect(() => {
    document.body.classList.add("has-modal");
    const root = document.documentElement;
    root.style.setProperty("overflow", "hidden", "important");
    return () => { document.body.classList.remove("has-modal"); root.style.removeProperty("overflow"); };
  }, []);

  // ОДИН крестик снаружи: десктоп — плитка внизу справа (как вход), мобилка — квадрат сверху справа.
  const closeBtn = wide
    ? { position: "fixed", right: 24, bottom: "calc(21px + (72px - 60px) / 2)", width: 60, height: 60, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }
    : { position: "fixed", right: 0, top: 0, width: 56, height: 56, borderRadius: 0 };

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, fontFamily: UI }}>
      <div onClick={onClose} className="animate-svcfade" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)" }} />
      <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 16, pointerEvents: "none" }}>
        <div className="animate-svcfade" style={{ minHeight: "100%", display: "flex" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ pointerEvents: "auto", width, maxWidth: "100%", margin: "auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,.35)" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 16 }}>{title}</div>
            {children}
          </div>
        </div>
      </div>

      <button type="button" aria-label="Закрыть" title="Закрыть" onClick={onClose}
        style={{ ...closeBtn, zIndex: 1001, display: "grid", placeItems: "center", background: "#111", color: "#fff", border: "none", cursor: "pointer", transition: "background-color .15s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#262626"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#111"; }}>
        <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </div>,
    document.body
  );
}

const STATUS_OPTS = OBJECT_STATUSES.map((s) => ({ value: s.code, label: s.label, dotColor: s.tone }));
const STAGE_OPTS = STAGE_STATUSES.map((s) => ({ value: s.code, label: s.label, dotColor: s.tone }));
function empOpts() { return [{ value: "", label: "— не назначен —" }, ...getEmployees().map((e) => ({ value: e.id, label: `${e.fio} · ${e.position}` }))]; }
function respIdOf(obj) { return getEmployees().find((e) => e.fio === obj.responsibleName)?.id || ""; }

/* ============================================================= */
/* ====================== АДМИН: СПИСОК ======================== */
/* ============================================================= */
function AdminObjectsList() {
  const [q, setQ] = React.useState("");
  const [fStatus, setFStatus] = React.useState("");
  const [fResp, setFResp] = React.useState("");
  const [fCity, setFCity] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const all = DB.listObjects();
  const cities = [...new Set(all.map((o) => o.city).filter(Boolean))];
  const resps = [...new Set(all.map((o) => o.responsibleName).filter(Boolean))];
  const t = q.toLowerCase().trim();
  const list = all.filter((o) => {
    if (fStatus && o.status !== fStatus) return false;
    if (fResp && o.responsibleName !== fResp) return false;
    if (fCity && o.city !== fCity) return false;
    if (t && ![o.title, o.customerName, o.inn, o.contractNumber, o.id].some((f) => String(f || "").toLowerCase().includes(t))) return false;
    return true;
  });
  const activeCount = [fStatus, fResp, fCity].filter(Boolean).length + (t ? 1 : 0);
  const reset = () => { setQ(""); setFStatus(""); setFResp(""); setFCity(""); };

  if (creating) {
    return <CreateObjectForm onCancel={() => setCreating(false)} onCreated={(id) => navigate(`/account/objects/${encodeURIComponent(id)}`)} />;
  }

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><div style={h1}>Объекты</div><div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Управление объектами заказчиков.</div></div>
        <FillBtn big onClick={() => setCreating(true)}>+ Создать объект</FillBtn>
      </div>

      <div style={{ marginTop: 18 }}>
        <FilterBar
          search={{ value: q, onChange: setQ, placeholder: "Поиск по объектам…" }}
          filters={[
            { value: fStatus, onChange: setFStatus, width: 170, placeholder: "Статус", options: [{ value: "", label: "Все статусы" }, ...STATUS_OPTS] },
            { value: fResp, onChange: setFResp, width: 190, placeholder: "Ответственный", options: [{ value: "", label: "Все ответственные" }, ...resps.map((r) => ({ value: r, label: r }))] },
            { value: fCity, onChange: setFCity, width: 150, placeholder: "Город", options: [{ value: "", label: "Все города" }, ...cities.map((c) => ({ value: c, label: c }))] },
          ]}
          activeCount={activeCount} onReset={reset}
        />
      </div>

      <div style={{ marginTop: 26 }}>
        <ListHead label="Объекты" count={list.length} />
        <DottedLine />
        {list.map((o) => {
          const st = OBJECT_STATUSES.find((s) => s.code === o.status) || {};
          return (
            <ListRow key={o.id} onOpen={() => navigate(`/account/objects/${encodeURIComponent(o.id)}`)}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", color: MUTED, textTransform: "uppercase" }}>№ {o.id}</span>
                  <Badge label={st.label || o.status} tone={st.tone} />
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{o.customerName} — {o.title}</span>
                  {/* Сотрудника уведомляют ТОЛЬКО новые сообщения заказчика, а не собственные правки (документы/статус). */}
                  {DB.hasUnreadMessages(o.id, "staff") && <NewBadge />}
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{o.address || o.city}{o.responsibleName ? <>{" · "}<RespHover name={o.responsibleName} coExecutors={o.coExecutors} /></> : ""} · {(o.documents || []).length} док.</div>
              </div>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ flexShrink: 0, color: "#bdbdbd" }}>
                <path d="M4 12h13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M11 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ListRow>
          );
        })}
        {list.length === 0 && (
          DB.isObjectsLoading()
            ? <CenterSpinner minHeight={180} label="Загружаем объекты…" />
            : <div style={{ padding: "28px 8px", color: MUTED, fontSize: 14, fontWeight: 300 }}>{all.length === 0 ? "Объектов пока нет." : "Ничего не найдено."}</div>
        )}
      </div>
    </div>
  );
}

/* Лейбл поля формы */
function FieldLabel({ children }) { return <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>{children}</div>; }

/* Комбобокс с поиском: печатаешь — снизу выпадают подсказки, можно ввести своё */
function Combo({ value, onChange, options, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const v = (value || "").toLowerCase();
  const filtered = options.filter((o) => o && o.toLowerCase().includes(v) && o.toLowerCase() !== v).slice(0, 8);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} style={inputStyle} />
      {open && filtered.length > 0 && (
        <div className="animate-svcfade" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 80, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, maxHeight: 220, overflowY: "auto" }}>
          {filtered.map((o) => (
            <button key={o} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(o); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 14, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Выбор заказчика — ТОЛЬКО из существующих учётных записей (без свободного ввода).
   Пустой список → подсказка «создайте учётную запись в разделе Администратор». */
function AccountPicker({ accounts, value, onPick, loading }) {
  const [open, setOpen] = React.useState(false);
  const [hov, setHov] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const ql = q.trim().toLowerCase();
  const filtered = accounts.filter((a) => !ql || [a.name, a.email, a.org].some((f) => String(f || "").toLowerCase().includes(ql))).slice(0, 40);
  const display = value ? (value.name || value.email) : "";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", textAlign: "left", borderColor: open ? "#c2c2c2" : hov ? "#d5d5d5" : LINE, boxShadow: open || hov ? "0 1px 3px rgba(0,0,0,.06)" : "none", transition: "border-color .18s ease, box-shadow .18s ease" }}>
        <span style={{ color: display ? TEXT : "#9a9a9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {display || (loading ? "Загрузка учётных записей…" : "— выбрать учётную запись —")}
        </span>
        <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: "#9a9a9a", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="animate-svcfade" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 80, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, maxHeight: 280, overflowY: "auto" }}>
          <input className="obj-input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени, e-mail…" style={{ ...inputStyle, height: 36, marginBottom: 6 }} />
          {filtered.length === 0 ? (
            <div style={{ padding: "10px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              {loading ? "Загрузка…" : (accounts.length === 0
                ? "Нет учётных записей. Создайте её в разделе «Администратор → Создать учётную запись»."
                : "Ничего не найдено.")}
            </div>
          ) : filtered.map((a) => {
            const active = value && value.id === a.id;
            return (
              <button key={a.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(a); setOpen(false); setQ(""); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 7, border: "none", background: active ? "#f1f1f1" : "transparent", cursor: "pointer", fontFamily: UI }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }} onMouseLeave={(e) => { e.currentTarget.style.background = active ? "#f1f1f1" : "transparent"; }}>
                <div style={{ fontSize: 14, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name || a.email}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.email}{a.org ? ` · ${a.org}` : ""}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Переиспользуемый редактор списка этапов: drag-and-drop за ручку ⠿ + добавление/удаление.
   Используется и в «Создать объект», и в редакторе шаблона (админка). */
// Этап в редакторе может быть строкой или {title, description}. Отдаём заголовок
// и описание, при правке сохраняем недостающее поле.
const stTitle = (s) => (typeof s === "string" ? s : (s && s.title) || "");
const stDesc = (s) => (typeof s === "string" ? "" : (s && s.description) || "");

// Поле «что входит в этап» — компактный триггер + выпадающая панель в нашем стиле.
// Пункты вносятся отдельными строками (каждый как «— пункт»), хранятся строкой
// через запятую (onSave отдаёт готовую строку). Высота строки этапа не растёт —
// удобно перетаскивать. Используется и в редакторе объекта, и в шаблонах/создании.
function StageItemsField({ value, onSave, side = "left" }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(() => descToItems(value));
  const [draft, setDraft] = React.useState("");
  const ref = React.useRef(null);
  const addRef = React.useRef(null);

  // Пока панель закрыта — держим локальный список в синхроне с внешним значением.
  React.useEffect(() => { if (!open) setItems(descToItems(value)); }, [value, open]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const commit = (next) => { setItems(next); onSave(joinDesc(next)); };
  const change = (i, val) => setItems(items.map((x, j) => (j === i ? val : x)));
  const blurItem = (i) => { if (!items[i].trim()) commit(items.filter((_, j) => j !== i)); else onSave(joinDesc(items)); };
  const remove = (i) => commit(items.filter((_, j) => j !== i));
  const add = () => { const t = draft.trim(); if (!t) return; commit([...items.filter((x) => x.trim()), t]); setDraft(""); addRef.current?.focus(); };

  const n = items.filter((x) => x.trim()).length;
  const underIn = (foc) => ({ flex: 1, minWidth: 0, height: 34, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, padding: "0 2px", boxShadow: `inset 0 -1px 0 0 ${foc ? UNDER_FOCUS : UNDER}`, transition: "box-shadow .18s ease" });

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 30, padding: "0 4px", border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 13, fontWeight: 400, color: n ? "#555" : MUTED, transition: "color .15s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = n ? "#555" : MUTED; }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
        </svg>
        {n ? `Что входит · ${n}` : "Что входит в этап"}
        <Chevron open={open} />
      </button>
      {open && (
        <div className="animate-svcfade"
          style={{ position: "absolute", top: "calc(100% + 8px)", [side]: 0, zIndex: 90, width: "min(400px, 86vw)", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: "0 16px 44px rgba(0,0,0,.16)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED }}>Что входит в этап</span>
            <span style={{ fontSize: 12, color: "#bbb", fontVariantNumeric: "tabular-nums" }}>{String(n).padStart(2, "0")}</span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: MUTED, flexShrink: 0 }}>—</span>
                <input autoFocus={i === items.length - 1 && it === ""} value={it}
                  onChange={(e) => change(i, e.target.value)}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; blurItem(i); }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRef.current?.focus(); } }}
                  placeholder="Пункт…" style={underIn(false)} />
                <button type="button" onClick={() => remove(i)} title="Удалить пункт"
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#c0c0c0", cursor: "pointer", borderRadius: 7, flexShrink: 0, transition: "color .12s, background-color .12s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = CARROT; e.currentTarget.style.background = "#faf1ee"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#c0c0c0"; e.currentTarget.style.background = "transparent"; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))}
            {n === 0 && <div style={{ fontSize: 13, fontWeight: 300, color: "#bbb", padding: "2px 0 4px" }}>Пунктов пока нет — добавьте ниже.</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ color: "#cfcfcf", flexShrink: 0 }}>+</span>
            <input ref={addRef} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; add(); }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }}
              placeholder="Добавить пункт и нажать Enter…" style={underIn(false)} />
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a8a8a8" }}>Каждый пункт — отдельной строкой. Заказчику покажем списком через тире, когда этап «В работе».</div>
        </div>
      )}
    </div>
  );
}

function BellIcon({ size = 13, off = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      {off && <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" />}
    </svg>
  );
}

// Компактный колокольчик-переключатель уведомлений (в строке выпадающего списка).
function BellToggle({ on, onToggle }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} title={on ? "Получает уведомления по объекту" : "Уведомления выключены"}
      style={{ width: 30, height: 30, display: "grid", placeItems: "center", border: "none", background: "transparent", color: on ? CARROT : "#cbcbcb", cursor: "pointer", borderRadius: 8, flexShrink: 0, transition: "color .15s, background-color .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
      <BellIcon size={16} off={!on} />
    </button>
  );
}
// Квадратик-галочка выбора — в стиле КУБ (как согласие в регистрации, FancyCheckbox):
// тёмная точка внутри, без морковного. disabled → серая (у ответственного, снять нельзя).
function CheckMark({ on, disabled }) {
  return (
    <span style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: disabled ? "#c2c2c2" : "#111", transform: on ? "scale(1)" : "scale(0)", transition: "transform .15s ease" }} />
    </span>
  );
}

// Соисполнители — мультиселект в стиле «Ответственный» (тот же подчёркнутый вид + chevron).
// Можно выбрать несколько; у выбранных — колокольчик «получает уведомления». Ответственный
// закреплён сверху списка (не выбирается), его уведомления — через onRespNotify.
// value: [{ id, fio, role, email, notify }]; onChange(next).
function CoExecutorsField({ value, onChange, respId = "", respName = "", respRole = "", respNotify = true, onRespNotify }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const items = Array.isArray(value) ? value : [];
  const selById = new Map(items.map((c) => [c.id, c]));
  const emps = getEmployees().filter((e) => e.id !== respId);

  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);

  const togglePick = (e) => {
    if (selById.has(e.id)) onChange(items.filter((c) => c.id !== e.id));
    else onChange([...items, { id: e.id, fio: e.fio, role: e.position || "", email: e.email || "", notify: true }]);
  };
  const toggleNotify = (id) => onChange(items.map((c) => (c.id === id ? { ...c, notify: c.notify === false } : c)));

  const label = items.length ? items.map((c) => c.fio).join(", ") : "";
  const nameSpan = { minWidth: 0, flex: 1, fontSize: 14.5, fontWeight: 300, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={underFieldStyle(open, !!label)}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label || "— выбрать соисполнителей —"}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="animate-svcfade" style={underMenuStyle}>
          {respName ? (
            <div style={{ display: "flex", alignItems: "center", background: "#fafafa", boxShadow: `inset 0 -1px 0 0 ${LINE}` }}>
              <div title="Ответственный всегда в команде — снять нельзя" style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, padding: "11px 14px", cursor: "default" }}>
                <CheckMark on disabled />
                <span style={nameSpan}>{respName}{respRole ? <span style={{ color: MUTED }}> · {respRole}</span> : null}<span style={{ color: "#bbb", marginLeft: 8, fontSize: 12 }}>ответственный</span></span>
              </div>
              <div style={{ paddingRight: 8 }}><BellToggle on={respNotify !== false} onToggle={() => onRespNotify && onRespNotify(respNotify === false)} /></div>
            </div>
          ) : null}

          {emps.length === 0 && <div style={{ padding: "12px 14px", fontSize: 13, color: MUTED }}>Нет других сотрудников.</div>}
          {emps.map((e) => {
            const sel = selById.get(e.id);
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", background: sel ? "#fbfbfb" : "#fff" }}
                onMouseEnter={(ev) => { if (!sel) ev.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = sel ? "#fbfbfb" : "#fff"; }}>
                <button type="button" onClick={() => togglePick(e)}
                  style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, textAlign: "left", padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: UI }}>
                  <CheckMark on={!!sel} />
                  <span style={nameSpan}>{e.fio}<span style={{ color: MUTED }}> · {e.position}</span></span>
                </button>
                {sel && <div style={{ paddingRight: 8 }}><BellToggle on={sel.notify !== false} onToggle={() => toggleNotify(e.id)} /></div>}
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}

// Показ ответственного в списках/шапке: имя как обычно, но если есть соисполнители —
// при наведении разворачивается список команды (наш стиль). Кружков нет — только имя.
function RespHover({ name, coExecutors }) {
  const list = Array.isArray(coExecutors) ? coExecutors : [];
  const [hover, setHover] = React.useState(false);
  if (!name) return null;
  if (!list.length) return <span>{name}</span>;
  return (
    <span style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ boxShadow: "inset 0 -1px 0 0 #d7d7d7", boxDecorationBreak: "clone", cursor: "pointer", borderBottom: "1px dotted transparent" }}>{name}</span>
      <span style={{ marginLeft: 5, color: "#b3b3b3", fontVariantNumeric: "tabular-nums" }}>+{list.length}</span>
      {hover && (
        <span onClick={(e) => e.stopPropagation()} className="animate-svcfade"
          style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 95, minWidth: 240, maxWidth: "min(360px, 80vw)", background: CTRL_REST, border: "1.5px dotted #c7c7c7", borderRadius: 12, padding: "12px 14px", cursor: "default", textAlign: "left", whiteSpace: "normal" }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED, marginBottom: 8 }}>Соисполнители</span>
          <span style={{ display: "grid", gap: 6 }}>
            {list.map((c, i) => (
              <span key={c.id || i} style={{ display: "flex", gap: 9, fontSize: 13.5, fontWeight: 300, lineHeight: 1.45, color: "#333" }}>
                <span style={{ color: MUTED, flexShrink: 0 }}>—</span>
                <span style={{ wordBreak: "break-word" }}>{c.fio}{c.role ? <span style={{ color: MUTED }}> · {c.role}</span> : null}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}

function StageListEditor({ stages, setStages }) {
  const [newStage, setNewStage] = React.useState("");
  const addStage = () => { const s = newStage.trim(); if (!s) return; setStages((v) => [...v, s]); setNewStage(""); };
  const dragFrom = React.useRef(null);
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);
  const editAt = (i, val) => setStages((prev) => prev.map((x, j) => (j === i ? (typeof x === "string" ? val : { ...x, title: val }) : x)));
  // Описание превращает строку-этап в объект {title, description} и обратно (пустое → снова строка).
  const setDescAt = (i, desc) => setStages((prev) => prev.map((x, j) => {
    if (j !== i) return x;
    const title = stTitle(x);
    return desc && desc.trim() ? { title, description: desc } : title;
  }));
  const dropStage = (to) => {
    const from = dragFrom.current; dragFrom.current = null; setDragIdx(null); setOverIdx(null);
    if (from == null || from === to) return;
    setStages((prev) => { const next = prev.slice(); const [m] = next.splice(from, 1); next.splice(to, 0, m); return next; });
  };
  return (
    <>
      <div style={{ marginTop: 4 }}>
        {stages.length === 0 && <div style={{ padding: "4px 0 14px", color: MUTED, fontSize: 14, fontWeight: 300 }}>Без этапов — добавите позже.</div>}
        {stages.map((s, i) => {
          const dragging = dragIdx === i;
          const over = overIdx === i && dragIdx !== i;
          return (
            <div key={`stage-${i}`}
              onDragOver={(e) => { e.preventDefault(); if (overIdx !== i) setOverIdx(i); }}
              onDrop={(e) => { e.preventDefault(); dropStage(i); }}
              style={{ padding: "8px 4px", boxShadow: `inset 0 -1px 0 0 ${UNDER}`, opacity: dragging ? 0.4 : 1, background: over ? "#fafafa" : "transparent", transition: "background-color .12s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span draggable
                  onDragStart={() => { dragFrom.current = i; setDragIdx(i); }}
                  onDragEnd={() => { dragFrom.current = null; setDragIdx(null); setOverIdx(null); }}
                  title="Перетащите"
                  style={{ cursor: "grab", color: "#c4c4c4", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0 }}>⠿</span>
                <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>{i + 1}</span>
                <input key={`stage-in-${i}`} defaultValue={stTitle(s)} onBlur={(e) => { if (e.target.value !== stTitle(s)) editAt(i, e.target.value); }} placeholder="Название этапа"
                  style={{ flex: 1, minWidth: 0, height: 40, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
                <button type="button" onClick={() => setStages(stages.filter((_, j) => j !== i))} title="Удалить этап"
                  style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#b0b0b0", cursor: "pointer", flexShrink: 0, borderRadius: 8, transition: "color .12s, background-color .12s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = CARROT; e.currentTarget.style.background = "#faf1ee"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#b0b0b0"; e.currentTarget.style.background = "transparent"; }}><IconTrash size={17} /></button>
              </div>
              <div style={{ paddingLeft: 44 }}>
                <StageItemsField value={stDesc(s)} onSave={(v) => setDescAt(i, v)} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={newStage} onChange={(e) => setNewStage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStage(); } }} placeholder="Добавить этап…" className="obj-ph"
            style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${UNDER}`, transition: "box-shadow .18s ease" }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; }} />
        </div>
        <FillBtn onClick={addStage}>+ Добавить</FillBtn>
      </div>
    </>
  );
}

export function CreateObjectForm({ onCancel, onCreated, fixedCustomer = null, embedded = false, submitLabel }) {
  const templates = React.useMemo(() => getTemplates(), []);
  const firstCode = (templates[0] && templates[0].code) || "free";
  const [tpl, setTpl] = React.useState(firstCode);
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [cust, setCust] = React.useState(fixedCustomer || null); // выбранная (или фиксированная) учётка-заказчик
  const [accounts, setAccounts] = React.useState([]);
  const [accLoading, setAccLoading] = React.useState(!fixedCustomer);
  const [respId, setRespId] = React.useState("");
  const [respNotify, setRespNotify] = React.useState(true);
  const [coExec, setCoExec] = React.useState([]); // [{ id, fio, role, email, notify }]
  const [stages, setStages] = React.useState(() => ((templates.find((x) => x.code === firstCode) || {}).stages || []).slice());
  // Если нового ответственного выбрали из уже добавленных соисполнителей — убираем дубль.
  const pickResp = (v) => { setRespId(v); setCoExec((prev) => prev.filter((c) => c.id !== v)); };
  const respEmp = getEmployees().find((e) => e.id === respId);

  // при смене типа работ подтягиваем его типовые этапы (пользователь дальше правит)
  React.useEffect(() => { setStages(((templates.find((x) => x.code === tpl) || {}).stages || []).slice()); }, [tpl]);

  // список учётных записей для выбора заказчика (не нужен, когда заказчик уже задан)
  React.useEffect(() => {
    if (fixedCustomer) return;
    let alive = true; (async () => { const list = await DB.listAccounts(); if (alive) { setAccounts(list); setAccLoading(false); } })(); return () => { alive = false; };
  }, [fixedCustomer]);

  const titlePreview = [name.trim(), city.trim()].filter(Boolean).join(" — ");

  const submit = () => {
    const emp = getEmployees().find((e) => e.id === respId);
    const o = DB.createObject({
      title: titlePreview || name.trim() || "Новый объект",
      templateCode: tpl,
      customerName: cust ? (cust.name || cust.email) : "",
      customerEmail: cust ? cust.email : "",
      customerId: cust ? (cust.id || "") : "",
      city: city.trim(),
      responsibleName: emp ? emp.fio : "",
      responsibleRole: emp ? emp.position : "",
      responsibleEmail: emp ? (emp.email || "") : "",
      responsibleNotify: respNotify,
      coExecutors: coExec,
      stages,
    });
    onCreated(o.id);
  };

  return (
    <div style={{ fontFamily: UI, marginTop: embedded ? 0 : 8 }}>
      {!embedded && (
        <>
          <button type="button" onClick={onCancel} style={backBtn}>← К объектам</button>
          <div style={{ marginTop: 14, ...h1 }}>Новый объект</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Тип работ задаёт префикс № и типовые этапы. Заказчик и ответственный — из учётных записей.</div>
        </>
      )}

      <div style={{ marginTop: embedded ? 0 : 26, display: "grid", gap: 22 }}>
        <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          <div>
            <FLabel>Тип работ — этапы и префикс</FLabel>
            <UnderSelect value={tpl} onChange={setTpl} options={templates.map((x) => ({ value: x.code, label: x.label }))} />
          </div>
          <div>
            <FLabel>Ответственный</FLabel>
            <UnderSelect value={respId} onChange={pickResp} placeholder="— выбрать из сотрудников —" options={empOpts()} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          <div>
            <FLabel>Соисполнители</FLabel>
            <CoExecutorsField value={coExec} onChange={setCoExec}
              respId={respId} respName={respEmp ? respEmp.fio : ""} respRole={respEmp ? respEmp.position : ""}
              respNotify={respNotify} onRespNotify={setRespNotify} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          <div><FLabel>Название</FLabel><UnderInput value={name} onChange={setName} placeholder="Например: Фасад" /></div>
          <div><FLabel>Город</FLabel><UnderInput value={city} onChange={setCity} placeholder="Например: Ноябрьск" /></div>
        </div>

        <div>
          <FLabel>Заказчик — из учётных записей</FLabel>
          {fixedCustomer ? (
            <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 14px", boxShadow: `inset 0 -1px 0 0 ${UNDER}`, fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT }}>
              {fixedCustomer.name || fixedCustomer.email}
              {fixedCustomer.email && fixedCustomer.name ? <span style={{ color: MUTED, marginLeft: 8, fontSize: 13 }}>· {fixedCustomer.email}</span> : null}
            </div>
          ) : (
            <UnderAccountPicker accounts={accounts} value={cust} onPick={setCust} loading={accLoading} />
          )}
        </div>

        <div>
          <FLabel>Этапы — перетащите за <span style={{ color: "#b8b8b8" }}>⠿</span></FLabel>
          <div style={{ marginTop: 4 }}><StageListEditor stages={stages} setStages={setStages} /></div>
        </div>

        <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
          <PrimaryBtn onClick={submit}>{submitLabel || "Создать объект"}</PrimaryBtn>
          {onCancel ? <FillBtn big onClick={onCancel}>Отмена</FillBtn> : null}
        </div>
      </div>
    </div>
  );
}

/* ============================================================= */
/* ================== АДМИН: РЕДАКТОР (просто) ================= */
/* ============================================================= */
// Разделительная полоса между секциями — как линия над «Опасной зоной».
function SectionRule() {
  return <div style={{ marginTop: 34, borderTop: `1px solid ${LINE}` }} />;
}
// Баннер публикации: правки админа копятся черновиком, заказчик видит последнюю
// публикацию. Пока есть незапубликованные изменения — тёплый баннер с кнопками
// «Опубликовать» / «Сбросить». Когда всё опубликовано — тихая строка-подтверждение.
function PublishBar({ dirty, onPublish, onDiscard }) {
  const [hDiscard, setHDiscard] = React.useState(false);
  const [hPublish, setHPublish] = React.useState(false);
  if (!dirty) {
    return (
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 300, color: MUTED }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: "#8bc48b", flexShrink: 0 }} />
        Опубликовано — заказчик видит актуальную версию.
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16, borderRadius: 12, border: "1px solid #f0d9cf", background: "#fdf6f2", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: CARROT, flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, fontWeight: 300, color: TEXT, lineHeight: 1.45 }}>
          Есть неопубликованные изменения — <b style={{ fontWeight: 500 }}>заказчик их пока не видит</b>.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button type="button" onClick={onDiscard} onMouseEnter={() => setHDiscard(true)} onMouseLeave={() => setHDiscard(false)}
          style={{ height: 40, padding: "0 16px", borderRadius: 10, background: hDiscard ? "#f5f5f5" : "#fff", color: TEXT, border: "1px solid", borderColor: hDiscard ? "#c2c2c2" : "#d9d9d9", fontFamily: UI, fontSize: 14, fontWeight: 300, cursor: "pointer", transition: "background-color .16s ease, border-color .16s ease" }}>Сбросить</button>
        <button type="button" onClick={onPublish} onMouseEnter={() => setHPublish(true)} onMouseLeave={() => setHPublish(false)}
          style={{ height: 40, padding: "0 18px", borderRadius: 10, background: hPublish ? "#262626" : "#111", color: "#fff", border: "none", fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: "pointer", boxShadow: hPublish ? "0 8px 22px rgba(0,0,0,.18)" : "none", transform: hPublish ? "translateY(-1px)" : "none", transition: "background-color .16s ease, box-shadow .16s ease, transform .16s ease" }}>Опубликовать изменения</button>
      </div>
    </div>
  );
}

function AdminObjectEditor({ id, autoOpenMessages }) {
  const force = useForceUpdate();
  const obj = DB.getObject(id);
  React.useEffect(() => { DB.markObjectSeen(id); }, [id]);
  // Легаси-объект без снимка: фиксируем базу публикации = текущее состояние,
  // чтобы дальнейшие правки копились как черновик, а не летели заказчику сразу.
  React.useEffect(() => { DB.ensurePublishedBaseline(id); }, [id]);
  // Учётки для выбора заказчика — БЕЗ сотрудников (их заводят отдельно как
  // ответственных/соисполнителей, в заказчиках им делать нечего).
  const [accounts, setAccounts] = React.useState([]);
  const [accLoading, setAccLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const list = await DB.listAccounts();
      if (!alive) return;
      const staff = new Set(getEmployees().map((e) => String(e.email || "").trim().toLowerCase()).filter(Boolean));
      setAccounts(list.filter((a) => !staff.has(String(a.email || "").trim().toLowerCase())));
      setAccLoading(false);
    })();
    return () => { alive = false; };
  }, []);
  // Пока объекты подгружаются с бэкенда (в т.ч. при переходе по ссылке из письма)
  // не мигаем «Объект не найден», а показываем кружок-загрузчик.
  if (!obj) return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button style={backBtn} onClick={() => navigate("/account/objects")}>← К объектам</button>
      {DB.isObjectsLoading()
        ? <CenterSpinner minHeight={220} label="Загружаем объект…" />
        : <div style={{ marginTop: 20, color: MUTED }}>Объект не найден.</div>}
    </div>
  );
  const save = (patch) => { DB.updateObject(id, patch); force(); };
  const respId = respIdOf(obj);
  const dirty = DB.hasUnpublished(id);
  const publish = () => { DB.publishObject(id); force(); };
  const discard = () => { if (window.confirm("Сбросить неопубликованные изменения? Черновик вернётся к тому, что сейчас видит заказчик.")) { DB.discardDraft(id); force(); } };
  // Текущий заказчик как учётка: ищем по id/e-mail среди клиентских учёток,
  // иначе показываем сохранённое имя (легаси-объекты со свободным вводом).
  const custMatch = obj.customerId
    ? accounts.find((a) => a.id === obj.customerId)
    : obj.customerEmail
      ? accounts.find((a) => String(a.email || "").toLowerCase() === String(obj.customerEmail).toLowerCase())
      : null;
  const custValue = custMatch || (obj.customerName ? { id: "__current__", name: obj.customerName, email: obj.customerEmail || "" } : null);
  const pickCustomer = (a) => save({ customerName: a.name || a.email, customerEmail: a.email || "", customerId: a.id || "" });

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button style={backBtn} onClick={() => navigate("/account/objects")}>← К объектам</button>
        <FillBtn onClick={() => navigate(`/account/objects/${encodeURIComponent(id)}?preview=customer`)}>Предпросмотр как заказчик</FillBtn>
      </div>

      <PublishBar dirty={dirty} onPublish={publish} onDiscard={discard} />

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".04em", color: MUTED, textTransform: "uppercase" }}>№ {obj.id}</div>
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px", alignItems: "end", gap: 18, maxWidth: 720 }}>
          <input defaultValue={obj.title} onBlur={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER}`; if (e.target.value !== (obj.title || "")) save({ title: e.target.value }); }} onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDER_FOCUS}`; }} placeholder="Название объекта"
            style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 2px", fontFamily: UI, fontSize: 16, fontWeight: 600, boxShadow: `inset 0 -1px 0 0 ${UNDER}`, transition: "box-shadow .18s ease" }} />
          <UnderSelect value={obj.status} options={STATUS_OPTS} onChange={(v) => save({ status: v })} />
        </div>
      </div>

      {/* Основное */}
      <div style={{ marginTop: 28 }}>
        <div style={secLabel}>Основное</div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 22 }}>
          <div><FLabel>Заказчик — из учётных записей</FLabel><UnderAccountPicker accounts={accounts} value={custValue} loading={accLoading} onPick={pickCustomer} /></div>
          <div><FLabel>Город</FLabel><UnderCommitInput defaultValue={obj.city} onCommit={(v) => save({ city: v })} /></div>
          <div><FLabel>Адрес</FLabel><UnderCommitInput key={`addr-${obj.address || ""}`} defaultValue={obj.address} onCommit={(v) => save({ address: v })} /></div>
          <div><FLabel>Договор</FLabel><UnderCommitInput defaultValue={obj.contractNumber} onCommit={(v) => save({ contractNumber: v })} /></div>
          <div>
            <FLabel>Ответственный</FLabel>
            <UnderSelect value={respId} options={empOpts()} placeholder="— не назначен —" onChange={(v) => { const e = getEmployees().find((x) => x.id === v); save({ responsibleName: e ? e.fio : "", responsibleRole: e ? e.position : "", responsibleEmail: e ? (e.email || "") : "", coExecutors: (obj.coExecutors || []).filter((c) => c.id !== v) }); }} />
          </div>
          <div>
            <FLabel>Соисполнители</FLabel>
            <CoExecutorsField value={obj.coExecutors || []} onChange={(next) => save({ coExecutors: next })}
              respId={respId} respName={obj.responsibleName} respRole={obj.responsibleRole}
              respNotify={obj.responsibleNotify !== false} onRespNotify={(v) => save({ responsibleNotify: v })} />
          </div>
        </div>
      </div>

      {/* Этапы */}
      <SectionRule />
      <StagesEditor id={id} obj={obj} onChange={force} />

      {/* Документы */}
      <SectionRule />
      <DocumentsEditor id={id} obj={obj} onChange={force} />

      {/* Переписка с заказчиком (внизу; кнопка «Ответить» → раскрывается поле) */}
      <SectionRule />
      <MessagesPanel objId={id} side="staff" authorName={obj.responsibleName || "Ответственный"} autoOpen={autoOpenMessages} />

      {/* Опасная зона — как «Удалить аккаунт» в Настройках */}
      <ObjectDangerZone id={id} title={obj.title} />
    </div>
  );
}
function ObjectDangerZone({ id, title }) {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const ok = v.trim().toLowerCase() === String(id).toLowerCase();
  const del = () => { if (!ok || busy) return; setBusy(true); DB.deleteObject(id); navigate("/account/objects"); };
  return (
    <div style={{ marginTop: 40, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
      <div style={secLabel}>Опасная зона</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED, maxWidth: 560, lineHeight: 1.5 }}>
        Если хотите навсегда удалить объект{title ? <> «<b style={{ fontWeight: 500, color: "#444" }}>{title}</b>»</> : null} со всеми этапами и документами — вам сюда.
      </div>
      <div style={{ marginTop: 16 }}>
        {!open ? (
          <IconAction prompt="Хотите удалить объект?" onClick={() => { setOpen(true); setV(""); }}>Удалить объект</IconAction>
        ) : (
          <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e3b4ae", background: "#fdf7f6", maxWidth: 480 }}>
            <div style={{ fontSize: 14, fontWeight: 300, color: TEXT, marginBottom: 10 }}>Чтобы подтвердить, введите номер объекта <b style={{ fontWeight: 600 }}>{id}</b>.</div>
            <input value={v} autoFocus onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") del(); }} placeholder={id}
              style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 12px", fontFamily: UI, fontSize: 15, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${UNDER}` }} />
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={del} disabled={!ok || busy} style={{ height: 46, padding: "0 20px", borderRadius: 10, background: ok && !busy ? "#c0392b" : "#e2b6b0", color: "#fff", border: "none", fontFamily: UI, fontSize: 15, fontWeight: 300, cursor: ok && !busy ? "pointer" : "not-allowed" }}>{busy ? "Удаляем…" : "Удалить навсегда"}</button>
              <button type="button" onClick={() => { setOpen(false); setV(""); }} style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#fff", color: TEXT, border: "1px solid #d9d9d9", fontFamily: UI, fontSize: 15, fontWeight: 300, cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function LabeledInput({ label, defaultValue, onCommit }) {
  return <div><div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>{label}</div><input defaultValue={defaultValue} onBlur={(e) => { if (e.target.value !== (defaultValue || "")) onCommit(e.target.value); }} style={inputStyle} /></div>;
}

/* --- Этапы: перетаскивание за ⠿, статус, удаление, добавление — единый подчёркнутый стиль --- */
function StagesEditor({ id, obj, onChange }) {
  const dragFrom = React.useRef(null);
  const [dragId, setDragId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);
  const stages = obj.stages || [];
  const drop = (to) => { const from = dragFrom.current; dragFrom.current = null; setDragId(null); setOverId(null); if (from == null || from === to) return; DB.reorderStages(id, from, to); onChange(); };
  return (
    <div style={{ marginTop: 30 }}>
      <div style={secLabel}>Этапы работ</div>
      <div style={{ marginTop: 14 }}>
        {stages.length === 0 && <div style={{ padding: "4px 0 14px", color: MUTED, fontSize: 14, fontWeight: 300 }}>Этапы не заданы.</div>}
        {stages.map((s, i) => {
          const dragging = dragId === s.id;
          const over = overId === s.id && dragId !== s.id;
          return (
            <div key={s.id}
              onDragOver={(e) => { e.preventDefault(); if (overId !== s.id) setOverId(s.id); }}
              onDrop={(e) => { e.preventDefault(); drop(i); }}
              style={{ padding: "8px 4px", boxShadow: `inset 0 -1px 0 0 ${UNDER}`, opacity: dragging ? 0.4 : 1, background: over ? "#fafafa" : "transparent", transition: "background-color .12s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span draggable onDragStart={() => { dragFrom.current = i; setDragId(s.id); }} onDragEnd={() => { dragFrom.current = null; setDragId(null); setOverId(null); }} title="Перетащите" style={{ cursor: "grab", color: "#c4c4c4", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0 }}>⠿</span>
                <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: s.status === "not_started" ? "#fff" : toneOf(STAGE_STATUSES, s.status), border: `2px solid ${toneOf(STAGE_STATUSES, s.status)}`, flexShrink: 0 }} />
                <input defaultValue={s.title} onBlur={(e) => { if (e.target.value !== s.title) { DB.updateStage(id, s.id, { title: e.target.value }); onChange(); } }} placeholder="Название этапа"
                  style={{ flex: 1, minWidth: 0, height: 40, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
                <div style={{ width: 190, flexShrink: 0 }}><UnderSelect value={s.status} options={STAGE_OPTS} onChange={(v) => { DB.updateStage(id, s.id, { status: v }); onChange(); }} /></div>
                <button type="button" onClick={() => { if (window.confirm(`Удалить этап «${s.title}»?`)) { DB.removeStage(id, s.id); onChange(); } }} title="Удалить этап"
                  style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#b0b0b0", cursor: "pointer", flexShrink: 0, borderRadius: 8, transition: "color .12s, background-color .12s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = CARROT; e.currentTarget.style.background = "#faf1ee"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#b0b0b0"; e.currentTarget.style.background = "transparent"; }}><IconTrash size={17} /></button>
              </div>
              {/* «Что входит» — компактный триггер + выпадающая панель (высота строки стабильна,
                  перетаскивать этапы удобно). Заказчику покажем списком через тире, когда этап «В работе». */}
              <div style={{ paddingLeft: 52 }}>
                <StageItemsField value={s.description || ""} side="left"
                  onSave={(v) => { if (v !== (s.description || "")) { DB.updateStage(id, s.id, { description: v }); onChange(); } }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px", minWidth: 220 }}>
          <FLabel>Добавить из типовых</FLabel>
          <UnderSelect value="" placeholder="Выберите этап…" options={STAGE_PRESETS.map((p) => ({ value: p, label: p }))} onChange={(v) => { if (v) { DB.addStage(id, { title: v }); onChange(); } }} />
        </div>
        <span style={{ color: MUTED, fontSize: 13, paddingBottom: 10 }}>или</span>
        <AddCustomStage id={id} onChange={onChange} />
      </div>
    </div>
  );
}
function AddCustomStage({ id, onChange }) {
  const [v, setV] = React.useState("");
  const add = () => { if (!v.trim()) return; DB.addStage(id, { title: v.trim() }); setV(""); onChange(); };
  return (
    <div style={{ flex: "1 1 240px", minWidth: 220 }}>
      <FLabel>Своё название</FLabel>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}><UnderInput value={v} onChange={setV} placeholder="Например: Монтаж" /></div>
        <FillBtn onClick={add}>+ Добавить</FillBtn>
      </div>
    </div>
  );
}

/* --- Одна категория документов: hover-подсветка области + пунктир-разделитель --- */
function DocCategory({ id, cat, docs, uploadDoc, onChange }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
    setUploading(true);
    try { await uploadDoc(cat, f); }
    catch (err) { alert("Не удалось загрузить файл: " + ((err && err.message) || err)); }
    finally { setUploading(false); }
  };
  return (
    <>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ padding: "18px 8px", margin: "0 -8px", background: hover ? "rgba(0,0,0,.02)" : "transparent", transition: "background-color .14s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: docs.length ? 10 : 0 }}>
          <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>{cat}<span style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>{String(docs.length).padStart(2, "0")}</span></div>
          <input ref={inputRef} type="file" onChange={onFile} style={{ display: "none" }} />
          {uploading
            ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 42, minWidth: 116, flexShrink: 0 }}><Spinner size={22} /></span>
            : <FillBtn onClick={() => inputRef.current?.click()}>+ Добавить</FillBtn>}
        </div>
        {docs.length === 0 ? <div style={{ fontSize: 13, fontWeight: 300, color: MUTED }}>Нет документов</div> : (
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            {docs.map((d, i) => {
              const hidden = d.status === "hidden" || d.status === "draft";
              return (
                <React.Fragment key={d.id}>
                  {i > 0 && <Dotted />}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: hidden ? "#fbfbfb" : "#fff" }}>
                    <ExtBadge ext={d.type || d.file} />
                    <div style={{ minWidth: 0, flex: 1, fontSize: 14, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}{hidden && <span style={{ marginLeft: 8 }}><Badge label="Скрыто" tone="#c05621" /></span>}</div>
                    {canPreview(d) && <DownloadBtn doc={d} label="Открыть" preview />}
                    <DownloadBtn doc={d} label="Скачать" />
                    <FillBtn tiny onClick={() => { DB.updateDocument(id, d.id, { status: hidden ? "published" : "hidden" }); onChange(); }}>{hidden ? "Показать" : "Скрыть"}</FillBtn>
                    <FillBtn tiny fill={CARROT} onClick={() => { if (window.confirm(`Удалить «${d.title}»?`)) { if (d.key) DB.deleteFile(d.key); DB.removeDocument(id, d.id); onChange(); } }}>Удалить</FillBtn>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
      <DottedLine />
    </>
  );
}

/* --- Документы (добавить/показать-скрыть/удалить) --- */
function DocumentsEditor({ id, obj, onChange }) {
  const byCat = {}; DOC_CATEGORIES.forEach((c) => (byCat[c] = []));
  (obj.documents || []).forEach((d) => (byCat[d.category] || byCat["Прочее"]).push(d));
  const uploadDoc = async (category, f) => {
    if (DB.usesApi()) {
      // прямая загрузка в Object Storage по presigned-ссылке, в документе — только ключ
      const up = await DB.uploadFile({ objectId: id, file: f });
      DB.addDocument(id, { title: f.name, category, name: f.name, file: f.name, type: up.type, size: f.size, key: up.key, status: "published" });
    } else {
      // localStorage-режим: как раньше, base64 в url
      const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
      DB.addDocument(id, { title: f.name, category, name: f.name, file: f.name, type: extOf(f.name), size: f.size, url: dataUrl, status: "published" });
    }
    onChange();
  };
  return (
    <div style={{ marginTop: 30 }}>
      <div style={secLabel}>Документы <span style={{ textTransform: "none", fontWeight: 400, color: MUTED }}>— скрытые заказчик не видит</span></div>
      <div style={{ marginTop: 14 }}>
        <DottedLine />
        {DOC_CATEGORIES.map((cat) => (
          <DocCategory key={cat} id={id} cat={cat} docs={byCat[cat]} uploadDoc={uploadDoc} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================= */
/* ================== ЗАКАЗЧИК: ВИД (простой) ================= */
/* ============================================================= */
/* --- Сообщение по объекту (в стиле блока «Контакты»: квадратное поле + тёмная кнопка).
      Это НЕ чат: внизу секция; по кнопке раскрывается поле-запрос → «Ожидание ответа».
      Демо на localStorage; реальные письма/хранение — при переносе на бэкенд. --- */
const msgLabel = { display: "block", textAlign: "left", fontSize: 12, fontWeight: 300, textTransform: "uppercase", letterSpacing: ".04em", color: "#a7a7a7", marginBottom: 6 };
// Вложение в треде: клик → presigned-ссылка (картинки открываем inline, файлы — скачиваем).
// Время сообщения в поясе автора: «17.07, 14:32».
function fmtMsgTime(m) {
  const iso = m && m.at;
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const tz = m.tz && typeof m.tz === "string" ? m.tz : "";
  const opts = { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
  try {
    if (tz) opts.timeZone = tz;
    return new Intl.DateTimeFormat("ru-RU", opts).format(d);
  } catch {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  }
}
// Дата+время для шапки блока диалога: «17 июля, 15:10» (в поясе автора).
function fmtMsgFull(m) {
  const d = m && m.at ? new Date(m.at) : null;
  if (!d || isNaN(d.getTime())) return "";
  const opts = { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" };
  try { if (m.tz) opts.timeZone = m.tz; return new Intl.DateTimeFormat("ru-RU", opts).format(d).replace(" в ", ", "); }
  catch { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d); }
}
// Только время: «15:10».
function fmtMsgClock(m) {
  const d = m && m.at ? new Date(m.at) : null;
  if (!d || isNaN(d.getTime())) return "";
  const opts = { hour: "2-digit", minute: "2-digit" };
  try { if (m.tz) opts.timeZone = m.tz; return new Intl.DateTimeFormat("ru-RU", opts).format(d); }
  catch { return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(d); }
}

// Контурные иконки Lucide вместо эмодзи — в едином аккуратном стиле сайта.
function PaperclipIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function ImageIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
// Иконка загрузки-в-облако — как в анкете «Ищу работу» (единый стиль по сайту).
function UploadIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z" />
      <path d="M12 14V8m0 0l-3 3m3-3l3 3" />
    </svg>
  );
}
function ArrowRightIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function MsgAttachment({ att }) {
  const [busy, setBusy] = React.useState(false);
  const isImg = /^image\//.test(att.mime || "") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.name || "");
  const onClick = async () => {
    if (busy || !att.key) return;
    try {
      setBusy(true);
      const url = await DB.downloadUrl(att.key, att.name, { inline: isImg });
      if (isImg) window.open(url, "_blank", "noopener");
      else { const a = document.createElement("a"); a.href = url; a.download = att.name || "file"; document.body.appendChild(a); a.click(); a.remove(); }
    } catch (e) {
      window.showDockToast?.(e && e.status === 403 ? "Нет доступа к файлу" : "Не удалось получить файл", 3200, "error");
    } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={onClick} title={att.name} disabled={!att.key}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, maxWidth: 260, height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", cursor: att.key ? "pointer" : "default", fontFamily: UI, fontSize: 13, color: TEXT, transition: "border-color .15s ease" }}
      onMouseEnter={(e) => { if (att.key) e.currentTarget.style.borderColor = "#bbb"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; }}>
      {busy ? <Spinner size={14} /> : <span aria-hidden style={{ display: "inline-flex", color: MUTED, lineHeight: 0 }}>{isImg ? <ImageIcon size={15} /> : <PaperclipIcon size={15} />}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name || "файл"}</span>
    </button>
  );
}

function MessagesPanel({ objId, side, authorName, disabled, autoOpen }) {
  const force = useForceUpdate();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [sentNote, setSentNote] = React.useState("");
  const [earlierExtra, setEarlierExtra] = React.useState(0); // сколько «более ранних» блоков раскрыто
  const [atts, setAtts] = React.useState([]); // черновик вложений: {id,name,size,mime,key?,uploading,error,isImage}
  const msgs = getMessages(objId);
  const status = threadStatus(objId);
  const isCustomer = side === "customer";
  const rootRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const fadeTimerRef = React.useRef(null);
  // Перерисовка при обновлении треда (оптимистичное добавление + ответ сервера).
  React.useEffect(() => {
    const on = () => force();
    window.addEventListener("objects:changed", on);
    return () => window.removeEventListener("objects:changed", on);
  }, []);
  // Точка «новое» у входящего сообщения: показываем, пока сообщение новее отметки
  // просмотра (seenUpTo). Когда собеседник подержал переписку на экране ~2.5с —
  // точка плавно сжимается (fading) и отметка поднимается, тред помечается
  // прочитанным (гасит точку на «Задать вопрос»/«Запросы»). Новое сообщение,
  // пришедшее live-опросом уже после, снова поднимает точку.
  const [seenUpTo, setSeenUpTo] = React.useState(() => DB.msgSeenAt(objId));
  const [fading, setFading] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver((es) => setInView(es.some((e) => e.isIntersecting)), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const incomingMax = msgs.reduce((mx, m) => (m.from !== side ? Math.max(mx, DB.msgTs(m)) : mx), 0);
  const hasNew = incomingMax > seenUpTo + 1000;
  React.useEffect(() => {
    if (disabled || !inView || !hasNew) { setFading(false); return; }
    const t1 = setTimeout(() => {
      setFading(true);
      fadeTimerRef.current = setTimeout(() => {
        setSeenUpTo(incomingMax); DB.markMessagesSeen(objId); setFading(false);
      }, 500);
    }, 2500);
    return () => { clearTimeout(t1); if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
  }, [disabled, inView, hasNew, incomingMax, objId]);
  // Клик по «Задать вопрос» / «Запросы» в StickyDock → подскроллить сюда (и заказчику раскрыть поле).
  React.useEffect(() => {
    const onOpen = () => {
      try { rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
      // заказчику — всегда; сотруднику — если заказчик уже что-то написал
      const canOpen = isCustomer ? !disabled : getMessages(objId).length > 0;
      if (canOpen) { setSentNote(""); setOpen(true); }
    };
    window.addEventListener("object:message-open", onOpen);
    return () => window.removeEventListener("object:message-open", onOpen);
  }, [isCustomer, disabled, objId]);
  // Диплинк из письма (?msg=1) → раскрыть переписку сразу. Ждём гидрацию: для
  // сотрудника открываем, когда сообщения заказчика подгрузились; заказчику — всегда.
  const autoOpenedRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoOpen || autoOpenedRef.current) return;
    const canOpen = isCustomer ? !disabled : getMessages(objId).length > 0;
    if (!canOpen) return;
    autoOpenedRef.current = true;
    setSentNote(""); setOpen(true);
    // Верстка ещё «плывёт» (спиннер сменяется контентом, грузятся вложения),
    // поэтому одиночный скролл промахивается вверх — повторяем по мере оседания
    // и наводимся на конец переписки (где как раз новое сообщение).
    const scrollToThread = () => { try { rootRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); } catch {} };
    const timers = [120, 400, 800].map((d) => setTimeout(scrollToThread, d));
    return () => timers.forEach(clearTimeout);
  }, [autoOpen, disabled, isCustomer, objId, msgs.length]);

  // Загрузка выбранных/вставленных файлов в S3 (presigned PUT).
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    files.forEach((file) => {
      const localId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const isImage = /^image\//.test(file.type || "");
      const name = file.name || (isImage ? "Скриншот.png" : "файл");
      setAtts((a) => [...a, { id: localId, name, size: file.size, mime: file.type || "", uploading: true, error: "", isImage }]);
      DB.uploadMessageAttachment({ objectId: objId, file })
        .then((up) => setAtts((a) => a.map((x) => (x.id === localId ? { ...x, key: up.key, uploading: false } : x))))
        .catch((e) => setAtts((a) => a.map((x) => (x.id === localId ? { ...x, uploading: false, error: e && e.status === 403 ? "нет доступа" : "ошибка загрузки" } : x))));
    });
  };
  const onPaste = (e) => {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    const imgs = [];
    for (const it of items) { if (it.kind === "file" && /^image\//.test(it.type)) { const f = it.getAsFile(); if (f) imgs.push(f); } }
    if (imgs.length) { e.preventDefault(); addFiles(imgs); }
  };
  const removeAtt = (id) => setAtts((a) => a.filter((x) => x.id !== id));
  const resetComposer = () => { setText(""); setAtts([]); setOpen(false); };

  const uploadingAny = atts.some((x) => x.uploading);
  const readyAtts = atts.filter((x) => x.key && !x.error);
  const hasContent = !!text.trim() || readyAtts.length > 0;
  const canSend = hasContent && !uploadingAny && !disabled;

  const send = () => {
    if (!canSend) return;
    const attachments = readyAtts.map((x) => ({ key: x.key, name: x.name, size: x.size, mime: x.mime }));
    const res = addMessage(objId, { from: side, author: authorName || (isCustomer ? "Заказчик" : "Ответственный"), text: text.trim(), attachments });
    resetComposer();
    setSentNote(isCustomer
      ? `Запрос отправлен — ожидайте ответа.${res && res.mailedTo ? ` Уведомление ушло ответственному: ${res.mailedTo}` : ""}`
      : "Ответ отправлен заказчику — уведомление ушло на почту.");
    if (res && res.promise) res.promise.catch(() => window.showDockToast?.("Не удалось отправить сообщение — попробуйте ещё раз", 3600, "error"));
    force();
  };
  const openBtnLabel = isCustomer ? "Отправить сообщение" : "Ответить заказчику";

  // «Протокол диалога»: подряд идущие сообщения одного автора — в один блок.
  // Заказчик нумеруется (01, 02…), ответы CUBE идут под запросом с отступом.
  const groups = [];
  let custNo = 0;
  for (const m of msgs) {
    const last = groups[groups.length - 1];
    if (last && last.from === m.from) last.items.push(m);
    else groups.push({ from: m.from, items: [m], no: 0 });
  }
  groups.forEach((g) => { if (g.from === "customer") g.no = ++custNo; });
  // В предпросмотре (disabled) точки «новое» тоже не показываем — чистый вид «как у заказчика».
  const groupIsNew = (g) => !disabled && g.items.some((m) => m.from !== side && DB.msgTs(m) > seenUpTo + 1000);

  // Свёртка старой переписки: по умолчанию показываем блоки за последние ~3 дня
  // (но не меньше двух последних). Более старое скрыто под бледным превью вверху;
  // клик раскрывает их порциями по 2-3 с анимацией — чтобы длинный тред не заставлял
  // каждый раз листать от самого первого сообщения.
  const groupTs = (g) => g.items.reduce((mx, m) => Math.max(mx, DB.msgTs(m) || 0), 0);
  const DAY_MS = 86400000;
  // По умолчанию видны блоки за последние сутки (от «сейчас»); более старое — под «Показать ранее».
  let baseVisible = groups.filter((g) => groupTs(g) >= Date.now() - DAY_MS).length;
  baseVisible = Math.min(groups.length, Math.max(2, baseVisible));
  const baseFloor = groups.length - baseVisible; // индексы < baseFloor — «более ранние»
  const shownStart = Math.max(0, baseFloor - earlierExtra);
  const shownGroups = groups.slice(shownStart);
  const hiddenCount = shownStart;
  const revealEarlier = () => setEarlierExtra((n) => n + Math.min(3, hiddenCount));

  return (
    <div ref={rootRef} style={{ marginTop: 34, scrollMarginTop: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={secLabel}>Коммуникация по объекту</div>
        {custNo > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#bdbdbd", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>{String(custNo).padStart(2, "0")}</span>}
        <span style={{ flex: 1 }} />
        {status === "awaiting" && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: CARROT, border: `1px solid ${CARROT}`, borderRadius: 6, padding: "3px 8px" }}>Ожидает ответа</span>}
        {status === "answered" && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#2f7d32", border: "1px solid #cfe6cf", borderRadius: 6, padding: "3px 8px" }}>Отвечено</span>}
      </div>

      {/* Протокол диалога: реестр запросов заказчика с ответами CUBE под ними.
          Вся область переписки очерчена пунктиром (теми же точками, что и разделители) со скруглёнными углами. */}
      {msgs.length > 0 && (
        <div style={{ position: "relative", marginTop: 16, padding: "22px 24px" }}>
          {/* Пунктирная рамка: SVG, чтобы скруглить углы (backgroundImage их не скругляет). Точки #000, период 9px — как <DottedLine/>. */}
          <svg width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "block", overflow: "visible" }}>
            <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="12" ry="12" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="1 8" />
          </svg>
          <style>{`@keyframes cubeEarlierIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}.cube-earlier-in{animation:cubeEarlierIn .32s ease}`}</style>

          {/* Бледное превью более ранней переписки — клик по кнопке «...» раскрывает 2-3 блока выше */}
          {hiddenCount > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ opacity: 0.38, WebkitMaskImage: "linear-gradient(to bottom,transparent,#000 85%)", maskImage: "linear-gradient(to bottom,transparent,#000 85%)", pointerEvents: "none", paddingTop: 2 }}>
                {(() => {
                  const prev = groups[shownStart - 1];
                  const isC = prev.from === "customer";
                  const line = ((prev.items.find((m) => m.text) || {}).text || "Вложение").replace(/\s+/g, " ").trim();
                  return (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: TEXT }}>{isC ? "Заказчик" : "Ответ CUBE"}</div>
                      <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.55, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>
                    </>
                  );
                })()}
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                <button type="button" onClick={revealEarlier} title={`Показать ранее — ещё ${hiddenCount}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, padding: "0 18px", borderRadius: 999, border: "1px solid #d4d4d4", background: "transparent", cursor: "pointer", transition: "border-color .18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#111"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d4d4d4"; }}>
                  {[0, 1, 2].map((i) => <span key={i} style={{ width: 4, height: 4, borderRadius: 999, background: "#111", display: "block" }} />)}
                </button>
              </div>
              <div style={{ marginTop: 16 }}><Dotted /></div>
            </div>
          )}

          {shownGroups.map((g, si) => {
            const gi = groups.indexOf(g);
            const isCust = g.from === "customer";
            const head = g.items[0];
            const headAuthor = head.author || (isCust ? "Заказчик" : "CUBE");
            const gNew = groupIsNew(g);
            const rows = (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  {isCust && <span style={{ fontSize: 12, fontWeight: 700, color: "#bdbdbd", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>{String(g.no).padStart(2, "0")}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: TEXT }}>{isCust ? "Заказчик" : "Ответ CUBE"}</span>
                  {gNew && <NewBadge size={7} fading={fading} />}
                </div>
                <div style={{ marginTop: 3, fontSize: 12, color: MUTED }}>{headAuthor}{fmtMsgFull(head) ? ` · ${fmtMsgFull(head)}` : ""}</div>
                <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                  {g.items.map((m, idx) => {
                    const mAtts = Array.isArray(m.attachments) ? m.attachments : [];
                    return (
                      <div key={m.id} style={{ opacity: m.pending ? 0.55 : 1 }}>
                        {m.text && (
                          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 15, lineHeight: 1.55, color: TEXT, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                            {idx > 0 && <span style={{ flexShrink: 0, fontSize: 11, color: "#b6b6b6", fontVariantNumeric: "tabular-nums" }}>{fmtMsgClock(m)}</span>}
                          </div>
                        )}
                        {mAtts.length > 0 && (
                          <div style={{ marginTop: m.text ? 8 : 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {mAtts.map((att, i) => <MsgAttachment key={att.key || i} att={att} />)}
                          </div>
                        )}
                        {m.pending && <div style={{ marginTop: 4, fontSize: 11, color: MUTED }}>Отправляется…</div>}
                        {m.failed && <div style={{ marginTop: 4, fontSize: 11, color: "#b0451f" }}>Не отправлено — попробуйте ещё раз.</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            );
            return (
              <div key={g.items[0].id} className={gi < baseFloor ? "cube-earlier-in" : undefined}>
                {/* пунктирный разделитель — перед каждым новым запросом заказчика (кроме самого верхнего в списке) */}
                {si > 0 && isCust && <div style={{ margin: "18px 0" }}><Dotted /></div>}
                {isCust
                  ? <div>{rows}</div>
                  : <div style={{ marginTop: 14, marginLeft: 2, paddingLeft: 20, borderLeft: "2px solid #111" }}>{rows}</div>}
              </div>
            );
          })}
        </div>
      )}

      {sentNote && <div style={{ marginTop: 14, fontSize: 13, fontWeight: 300, color: "#2f7d32" }}>{sentNote}</div>}

      {/* Сотрудник до первого сообщения заказчика — только заметка; дальше обе стороны отвечают */}
      {!isCustomer && msgs.length === 0 ? (
        <div style={{ marginTop: 14, fontSize: 14, fontWeight: 300, color: MUTED }}>Заказчик пока не оставлял сообщений по объекту.</div>
      ) : !open ? (
        <button type="button" onClick={() => { setSentNote(""); setOpen(true); }} disabled={disabled}
          style={{ marginTop: 18, height: 52, minWidth: 240, padding: "0 26px", borderRadius: 10, border: "none", background: disabled ? "#c9c9c9" : "#111", color: "#fff", fontFamily: UI, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".02em", cursor: disabled ? "not-allowed" : "pointer", transition: "background-color .2s ease" }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#262626"; }}
          onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "#111"; }}>
          {disabled ? "Недоступно в предпросмотре" : openBtnLabel}
        </button>
      ) : (
        <div className="animate-msgin" style={{ marginTop: 18, maxWidth: 620 }}>
          <label style={msgLabel}>{isCustomer ? "Ваше сообщение" : "Ответ заказчику"}</label>
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} onPaste={onPaste}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = UNDER_FOCUS; }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = LINE; }}
            placeholder={isCustomer ? "Напишите сообщение…" : "Напишите ответ заказчику…"}
            style={{ display: "block", width: "100%", height: 120, resize: "none", border: "none", borderBottom: `1px solid ${LINE}`, borderRadius: 0, background: "#fff", padding: "10px 2px", fontFamily: UI, fontSize: 15, fontWeight: 400, lineHeight: 1.55, color: TEXT, outline: "none", transition: "border-color .25s ease" }} />

          {/* Черновик вложений */}
          {atts.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {atts.map((a) => (
                <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 6px 0 10px", borderRadius: 8, border: `1px solid ${a.error ? "#f0b4a4" : LINE}`, background: a.error ? "#fff4ef" : "#fafafa", fontSize: 12.5, color: a.error ? "#b0451f" : TEXT, maxWidth: 240 }}>
                  {a.uploading ? <Spinner size={13} /> : <span aria-hidden style={{ display: "inline-flex", lineHeight: 0, color: a.error ? "#b0451f" : MUTED }}>{a.error ? "⚠" : a.isImage ? <ImageIcon size={14} /> : <PaperclipIcon size={14} />}</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.error ? `${a.name} — ${a.error}` : a.name}</span>
                  <button type="button" onClick={() => removeAtt(a.id)} aria-label="Убрать" style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
                </span>
              ))}
            </div>
          )}

          <input ref={fileRef} type="file" multiple style={{ display: "none" }}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={send} disabled={!canSend}
              style={{ height: 52, minWidth: 210, padding: "0 26px", borderRadius: 10, border: "none", background: !canSend ? "#c9c9c9" : "#111", color: "#fff", fontFamily: UI, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".02em", cursor: !canSend ? "not-allowed" : "pointer", transition: "background-color .2s ease" }}
              onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = "#262626"; }}
              onMouseLeave={(e) => { if (canSend) e.currentTarget.style.background = "#111"; }}>
              {uploadingAny ? "Загрузка файла…" : (<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{isCustomer ? "Отправить" : "Отправить ответ"}<ArrowRightIcon size={16} /></span>)}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} title="Прикрепить файл или скриншот"
              style={{ height: 52, padding: "0 18px", display: "inline-flex", alignItems: "center", gap: 9, borderRadius: 10, border: `1px solid ${LINE}`, background: CTRL_REST, color: "#555", fontFamily: UI, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "border-color .16s ease, color .16s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#999"; e.currentTarget.style.color = TEXT; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.color = "#555"; }}>
              <UploadIcon size={18} /> Прикрепить файл
            </button>
            <button type="button" onClick={resetComposer}
              style={{ height: 52, padding: "0 24px", borderRadius: 10, border: `1px solid ${LINE}`, background: CTRL_REST, color: TEXT, fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: "pointer", transition: "border-color .16s ease, background-color .16s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#999"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; }}>
              Отмена
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 300, color: MUTED }}>Можно приложить файл или вставить скриншот (Ctrl+V) прямо в поле.</div>
        </div>
      )}
    </div>
  );
}

// Иконка «отследить изменения»: узлы-связи (share).
function TrackIcon({ size = 21 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="6" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <line x1="8.35" y1="10.8" x2="15.65" y2="7.15" strokeLinecap="round" />
      <line x1="8.35" y1="13.2" x2="15.65" y2="16.85" strokeLinecap="round" />
    </svg>
  );
}

// «стрелка из рамки» — подписка на e-mail-уведомления по объекту.
function ExtIcon({ size = 21 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" />
      <path d="M20 4l-8 8" />
      <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

// Общий стиль иконки-кнопки без рамки (просто значок, мягкий ховер).
const iconBtnStyle = { flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", padding: 0, transition: "color .15s ease, background-color .15s ease" };

// Кнопка + выезжающая справа панель «История изменений» (таймлайн событий объекта).
// Морковная пульсирующая точка «новое» — тот же индикатор, что у «Запросы» в
// StickyDock (расходящееся кольцо). Ставится после названия объекта.
function NewBadge({ size = 8, style, fading, pulse = true }) {
  return (
    <span aria-hidden="true" title="Есть новое"
      style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: CARROT, flexShrink: 0,
        animation: (fading || !pulse) ? "none" : "cubeNewPulse 1.8s ease-out infinite",
        transform: fading ? "scale(0)" : "scale(1)", opacity: fading ? 0 : 1,
        transition: "transform .5s ease, opacity .5s ease", ...style }}>
      <style>{`@keyframes cubeNewPulse{0%{box-shadow:0 0 0 0 rgba(250,93,41,.5)}70%{box-shadow:0 0 0 6px rgba(250,93,41,0)}100%{box-shadow:0 0 0 0 rgba(250,93,41,0)}}`}</style>
    </span>
  );
}

// Морковная пилюля «New» — как бейдж «New» у пункта «Проекты» в шапке сайта,
// только фирменного морковного цвета. Стоит у объекта со свежими изменениями и
// исчезает, когда заказчик открыл объект (isObjectUnseen → markObjectSeen при
// заходе). Лёгкое «пружинистое» появление в общем стиле сайта.
function NewPill() {
  return (
    <span aria-label="Есть новое"
      style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, padding: "2px 6px",
        borderRadius: 5, background: CARROT, color: "#fff", fontSize: 10, fontWeight: 600,
        lineHeight: 1, letterSpacing: ".01em", animation: "cubeNewPop .32s cubic-bezier(.2,.8,.2,1) both" }}>
      New
      <style>{`@keyframes cubeNewPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}`}</style>
    </span>
  );
}

function ChangeLogButton({ events }) {
  const [open, setOpen] = React.useState(false);
  const list = Array.isArray(events) ? events : [];
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="История изменений по объекту" aria-label="История изменений по объекту"
        style={{ ...iconBtnStyle, color: TEXT }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#efefee"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        <TrackIcon />
      </button>
      {open && createPortal(
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: "rgba(17,17,17,.28)", animation: "clFade .2s ease" }}>
          <style>{`@keyframes clFade{from{opacity:0}to{opacity:1}}@keyframes clSlide{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(440px, 100%)", background: "#f4f4f3", boxShadow: "-12px 0 40px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", animation: "clSlide .28s cubic-bezier(.2,.8,.2,1)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px", borderBottom: `1px solid ${LINE}` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED }}>История изменений</div>
                <div style={{ marginTop: 3, fontSize: 18, fontWeight: 600, color: TEXT }}>Что менялось по объекту</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть"
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: 26, lineHeight: 1, color: MUTED, padding: 4 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
              {list.length === 0 ? (
                <div style={{ fontSize: 14, fontWeight: 300, color: MUTED }}>Изменений пока нет.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {list.map((e, i) => (
                    <div key={e.id || i} style={{ position: "relative", paddingLeft: 22 }}>
                      <span style={{ position: "absolute", left: 3, top: 4, width: 9, height: 9, borderRadius: 999, background: "transparent", border: `1.5px solid #b3b3b3`, zIndex: 1 }} />
                      {i < list.length - 1 && <span style={{ position: "absolute", left: 7, top: 16, bottom: -18, width: 1, backgroundImage: "repeating-linear-gradient(to bottom, #c4c4c4 0 1px, rgba(0,0,0,0) 1px 6px)" }} />}
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{e.title || "Изменение"}</div>
                      {e.description && <div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 300, lineHeight: 1.45, color: "#444", wordBreak: "break-word" }}>{e.description}</div>}
                      <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>{e.author ? e.author : ""}{e.author && e.createdAt ? " · " : ""}{e.createdAt || ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Описание этапа хранится строкой через запятую («осмотр, замеры, …»). Режем по
// запятой/переносу/точке с запятой, снимаем хвостовую точку — сырые пункты для
// редактора; для показа заказчику первую букву делаем заглавной (через тире).
function descToItems(desc) {
  return String(desc || "")
    .split(/\s*[\n;,]\s*/)
    .map((x) => x.replace(/\.\s*$/, "").trim())
    .filter(Boolean);
}
function stageDescItems(desc) {
  return descToItems(desc).map((x) => x.charAt(0).toUpperCase() + x.slice(1));
}
const joinDesc = (arr) => arr.map((x) => x.trim()).filter(Boolean).join(", ");

// Этапы у заказчика — плоский список слева. У этапа «В работе» с описанием при
// НАВЕДЕНИИ справа в той же рамке всплывает блок «что входит»: пунктирный контур,
// фон = фон страницы, без бейджа и названия внутри (они уже слева). Список слева
// фиксированной ширины — не сдвигается при появлении блока; длинный текст
// переносится внутри самого блока. На мобилке будет тап (сделаем позже).
function CustomerStages({ stages, stageUnseen }) {
  const list = (stages || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasDesc = (s) => s.status === "in_progress" && !!(s.description && s.description.trim());
  const [hoverId, setHoverId] = React.useState(null);
  const sel = list.find((s) => s.id === hoverId && hasDesc(s)) || null;

  if (list.length === 0) return <div style={{ marginTop: 12, color: MUTED, fontSize: 14, fontWeight: 300 }}>Этапы не заданы.</div>;

  return (
    <div onMouseLeave={() => setHoverId(null)}
      style={{ marginTop: 12, display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Список — фиксированная ширина, не реагирует на появление блока справа */}
      <div style={{ flex: "0 0 auto", width: "min(560px, 100%)", display: "grid", gap: 12 }}>
        {list.map((s) => {
          const sst = STAGE_STATUSES.find((x) => x.code === s.status) || {};
          const clickable = hasDesc(s);
          return (
            <div key={s.id}
              style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, flexShrink: 0, background: s.status === "not_started" ? "#fff" : sst.tone, border: `2px solid ${s.status === "not_started" ? "#d0d0d0" : sst.tone}` }} />
              <span
                onMouseEnter={() => clickable && setHoverId(s.id)}
                style={{ fontSize: 15, fontWeight: s.status === "in_progress" ? 600 : 400, color: s.status === "not_started" ? MUTED : TEXT, cursor: clickable ? "pointer" : "default" }}>{s.title}</span>
              <Badge label={sst.label} tone={sst.tone} />
              {stageUnseen[s.id] && <NewBadge size={8} />}
            </div>
          );
        })}
      </div>

      {/* Блок описания — присутствует всегда (ширина колонки постоянна), наполняется по наведению */}
      <div style={{ flex: "1 1 0", minWidth: 0, alignSelf: "stretch" }}>
        {sel && (
          <div key={sel.id}>
            <style>{`@keyframes stageDescIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div style={{ animation: "stageDescIn .24s cubic-bezier(.2,.8,.2,1)", background: CTRL_REST, border: "1.5px dotted #c7c7c7", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED }}>Что входит в этап</div>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                {stageDescItems(sel.description).map((it, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, fontSize: 14.5, fontWeight: 300, lineHeight: 1.5, color: "#333" }}>
                    <span style={{ color: MUTED, flexShrink: 0 }}>—</span>
                    <span style={{ wordBreak: "break-word" }}>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Иконка-переключатель подписки на e-mail-уведомления по объекту.
// Клик → морковная (подписан), повторный клик → выкл. Если у юзера нет почты —
// мягкая подсказка «сначала укажите e-mail». Состояние храним на бэкенде
// (таблица object_subs); локальный кэш даёт мгновенную отрисовку. Реальная
// рассылка уходит при публичных событиях по объекту (см. server/functions/objects).
function SubscribeButton({ objId, userEmail }) {
  const [on, setOn] = React.useState(() => DB.isSubscribedLocal(objId));
  const [busy, setBusy] = React.useState(false);
  const [hint, setHint] = React.useState("");
  const hintT = React.useRef(null);
  const showHint = (t) => { setHint(t); if (hintT.current) clearTimeout(hintT.current); hintT.current = setTimeout(() => setHint(""), 3200); };
  React.useEffect(() => () => { if (hintT.current) clearTimeout(hintT.current); }, []);
  // Свериться с сервером при монтировании (истина по подписке — на бэкенде).
  React.useEffect(() => {
    let alive = true;
    DB.getObjectSubscription(objId).then((v) => { if (alive) setOn(Boolean(v)); }).catch(() => {});
    return () => { alive = false; };
  }, [objId]);
  const toggle = async () => {
    if (busy) return;
    if (!userEmail) { showHint("Сначала укажите e-mail в профиле"); return; }
    const next = !on;
    setOn(next); setBusy(true); // оптимистично
    try {
      const server = await DB.setObjectSubscription(objId, next);
      setOn(server);
      try { window.dispatchEvent(new Event("objects:subscribed")); } catch {}
      showHint(server ? "Уведомления на e-mail включены" : "Уведомления на e-mail отключены");
    } catch {
      setOn(!next); // откат
      showHint("Не удалось сохранить — попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={toggle} aria-pressed={on} aria-label="Подписка на e-mail-уведомления"
        title={on ? "Уведомления на e-mail включены — нажмите, чтобы отключить" : "Получать уведомления об изменениях на e-mail"}
        style={{ ...iconBtnStyle, color: on ? CARROT : TEXT }}
        onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#efefee"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        <ExtIcon />
      </button>
      {hint && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, whiteSpace: "nowrap", background: TEXT, color: "#fff", fontSize: 12, fontWeight: 400, padding: "6px 10px", borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,.18)", zIndex: 5, animation: "subHint .18s ease" }}>
          {hint}
          <style>{`@keyframes subHint{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}

/* Категория документов у заказчика — визуально как реестр в админ-редакторе
   (DocCategory): uppercase-заголовок с счётчиком «01», наведение подсвечивает
   весь блок, строки в белой карточке с пунктиром. Только чтение; ширина берётся
   от контейнера заказчика (уже, чем у админа) — намеренно не трогаем. */
function CustDocCategory({ cat, docs, refAtOpen }) {
  const [hover, setHover] = React.useState(false);
  return (
    <>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ padding: "18px 8px", margin: "0 -8px", background: hover ? "rgba(0,0,0,.02)" : "transparent", transition: "background-color .14s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: docs.length ? 10 : 0 }}>
          <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>{cat}<span style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>{String(docs.length).padStart(2, "0")}</span></div>
        </div>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          {docs.map((d, i) => (
            <React.Fragment key={d.id}>
              {i > 0 && <Dotted />}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                <ExtBadge ext={d.type || d.file} />
                <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  <span style={{ minWidth: 0, fontSize: 14, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                  {(d.publishedTs || 0) > refAtOpen + 1000 && <NewPill />}
                </div>
                {canPreview(d) && <DownloadBtn doc={d} label="Открыть" preview />}
                <DownloadBtn doc={d} label="Скачать" />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <DottedLine />
    </>
  );
}

function CustomerObjectView({ id, preview, autoOpenMessages, userEmail }) {
  // Предпросмотр админом («preview») показывает ЧЕРНОВИК (draft:true) — то, что он
  // только что наредактировал; реальный заказчик видит последнюю публикацию.
  const o = DB.getCustomerView(id, { draft: !!preview });
  // Снимок отметки «просмотрено» ДО того, как откроем объект (ниже markObjectSeen
  // поднимет её к «сейчас»). По этому снимку внутри объекта решаем, что подсветить:
  // кружочек у статуса (смена статуса) и пилюлю New у свежезагруженных документов.
  // В предпросмотре «как заказчик» метки новизны не имеют смысла: они считаются
  // от ОТМЕТКИ администратора, а не заказчика, и лишь путают. Отматываем снимок в
  // +∞ — тогда статус/этапы/документы разом считаются просмотренными (меток нет).
  const refAtOpen = React.useMemo(() => (preview ? Infinity : DB.objectSeenRef(id)), [id, preview]);
  // Открытие объекта помечает его просмотренным (гасит кружочек в списке/меню).
  React.useEffect(() => { if (!preview) DB.markObjectSeen(id); }, [id, preview]);
  // Внутри объекта морковную метку ставим ТОЛЬКО там, где реально было изменение —
  // на конкретном этапе (ниже). У статуса в шапке кружка нет: сигнал «в объекте
  // что-то новое» живёт в СПИСКЕ объектов (строка «Заказчик — Название»), не здесь.
  // Какие этапы сменили статус после прошлого просмотра — по ним морковная метка.
  const stageUnseen = React.useMemo(() => {
    const m = {};
    (o?.stages || []).forEach((s) => { if ((s.statusTs || 0) > refAtOpen + 1000) m[s.id] = true; });
    return m;
  }, [o, refAtOpen]);
  // Морковная точка у статуса/этапа при смене держится всё время, пока заказчик
  // в объекте (как пилюля New у документов) — гаснет только в следующий визит,
  // когда снимок refAtOpen уже поднимется markObjectSeen.
  // При перезагрузке страницы объекта данные ещё грузятся с бэкенда — не мигаем
  // «Объект недоступен», а показываем наш кружок-загрузчик, пока идёт гидрация.
  if (!o) return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button style={backBtn} onClick={() => navigate("/account/objects")}>← Назад</button>
      {DB.isObjectsLoading()
        ? <CenterSpinner minHeight={220} label="Загружаем объект…" />
        : <div style={{ marginTop: 20, color: MUTED }}>Объект недоступен.</div>}
    </div>
  );
  const st = OBJECT_STATUSES.find((s) => s.code === o.status) || {};
  const byCat = {}; DOC_CATEGORIES.forEach((c) => (byCat[c] = [])); (o.documents || []).forEach((d) => (byCat[d.category] || byCat["Прочее"]).push(d));
  const cats = DOC_CATEGORIES.filter((c) => byCat[c].length);

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      {preview && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: 10, background: "#fff4ef", border: "1px solid #f6c9b6", marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#b0451f" }}>Предпросмотр как заказчик.</span>
        <FillBtn tiny onClick={() => navigate(`/account/objects/${encodeURIComponent(id)}`)}>← Вернуться к редактированию</FillBtn>
      </div>}
      {!preview && <button style={backBtn} onClick={() => navigate("/account/objects")}>← К объектам</button>}

      <div style={{ marginTop: preview ? 0 : 14, maxWidth: 820 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".04em", color: MUTED, textTransform: "uppercase" }}>№ {o.id}</div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 26, fontWeight: 600, color: TEXT }}>{o.customerName} — {o.title}</span>
        </div>
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 14, fontWeight: 300, color: "#444", alignItems: "center" }}>
          {o.address && <span>{o.address}</span>}
          {o.contractNumber && <span>Договор: {o.contractNumber}</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Badge label={st.label} tone={st.tone} />
          </span>
        </div>
      </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <ChangeLogButton events={o.events} />
          <SubscribeButton objId={o.id} userEmail={userEmail} />
        </div>
      </div>

      {/* Ответственный */}
      {o.responsibleName && (
        <div style={{ marginTop: 22 }}>
          <div style={secLabel}>Ответственный за объект</div>
          <div style={{ marginTop: 8, fontSize: 15, color: TEXT }}><RespHover name={o.responsibleName} coExecutors={o.coExecutors} />{o.responsibleRole ? <span style={{ color: MUTED, fontWeight: 300 }}> · {o.responsibleRole}</span> : null}</div>
        </div>
      )}

      {/* Этапы (только чтение) */}
      <SectionRule />
      <div style={{ marginTop: 28 }}>
        <div style={secLabel}>Этапы работ</div>
        <CustomerStages stages={o.stages || []} stageUnseen={stageUnseen} />
      </div>

      {/* Документы */}
      <SectionRule />
      <div style={{ marginTop: 30 }}>
        <div style={secLabel}>Документы</div>
        {cats.length === 0 ? <div style={{ marginTop: 12, color: MUTED, fontSize: 14, fontWeight: 300 }}>Документов пока нет.</div> : (
          <div style={{ marginTop: 14 }}>
            <DottedLine />
            {cats.map((cat) => (
              <CustDocCategory key={cat} cat={cat} docs={byCat[cat]} refAtOpen={refAtOpen} />
            ))}
          </div>
        )}
      </div>

      {/* Сообщение по объекту — внизу, не «чат»: кнопка → раскрывается поле-запрос */}
      <SectionRule />
      <MessagesPanel objId={o.id} side="customer" authorName={o.customerName || "Заказчик"} disabled={preview} autoOpen={autoOpenMessages} />
      </div>
    </div>
  );
}

/* --- Список объектов заказчика (+ фильтр) --- */
function CustomerObjectsList({ email, accountId }) {
  const [q, setQ] = React.useState("");
  const [fStatus, setFStatus] = React.useState("");
  // Матчим по почте ИЛИ по id учётки — вход по логину без почты тоже видит свои объекты.
  const items = DB.listObjectsForCustomer(email, accountId);
  const t = q.toLowerCase().trim();
  const list = items.filter((o) => {
    if (fStatus && o.status !== fStatus) return false;
    if (t && ![o.title, o.customerName, o.address, o.contractNumber, o.id].some((f) => String(f || "").toLowerCase().includes(t))) return false;
    return true;
  });
  const activeCount = (fStatus ? 1 : 0) + (t ? 1 : 0);
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <div style={h1}>Объекты</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Ваши объекты и документы по ним.</div>
      <div style={{ marginTop: 18 }}>
        <FilterBar search={{ value: q, onChange: setQ, placeholder: "Поиск: название, адрес, договор…" }}
          filters={[{ value: fStatus, onChange: setFStatus, width: 180, placeholder: "Статус", options: [{ value: "", label: "Все статусы" }, ...STATUS_OPTS] }]}
          activeCount={activeCount} onReset={() => { setQ(""); setFStatus(""); }} />
      </div>
      <div style={{ marginTop: 26 }}>
        <ListHead label="Объекты" count={list.length} />
        <DottedLine />
        {list.map((o) => {
          const st = OBJECT_STATUSES.find((s) => s.code === o.status) || {};
          return (
            <ListRow key={o.id} onOpen={() => navigate(`/account/objects/${encodeURIComponent(o.id)}`)}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", color: MUTED, textTransform: "uppercase" }}>№ {o.id}</span>
                  <Badge label={st.label || o.status} tone={DB.isObjectUnseen(o) ? "#8a8a8a" : st.tone} />
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{o.customerName} — {o.title}</span>
                  {DB.isObjectUnseen(o) && <NewBadge />}
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{o.address || o.city}{o.responsibleName ? <>{" · "}<RespHover name={o.responsibleName} coExecutors={o.coExecutors} /></> : ""} · {(o.documents || []).length} док.</div>
              </div>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style={{ flexShrink: 0, color: "#111" }}>
                <path d="M4 12h13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M11 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ListRow>
          );
        })}
        {list.length === 0 && (
          DB.isObjectsLoading()
            ? <CenterSpinner minHeight={180} label="Загружаем объекты…" />
            : <div style={{ padding: "28px 8px", color: MUTED, fontSize: 14, fontWeight: 300 }}>{items.length === 0 ? "Пока нет объектов." : "Ничего не найдено."}</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================= */
/* ================== МОДУЛЬ «СОТРУДНИКИ» ===================== */
/* ============================================================= */
// Чек-лист прав из КАТАЛОГА (server/functions/*/perms.js → src/lib/perms.js).
// permSet — Set включённых прав; roleSet — базовый набор роли (для пометки ручных
// оверрайдов). disabled — только чтение (роль admin = полный доступ).
function PermChecklist({ permSet, roleSet, onToggle, disabled }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {Object.keys(PERMISSIONS).map((ns) => (
        <div key={ns}>
          <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, color: MUTED, marginBottom: 2 }}>
            {PERM_GROUP_LABELS[ns] || ns}
          </div>
          {PERMISSIONS[ns].map(([perm, label]) => {
            const on = permSet.has(perm);
            const overridden = roleSet && (on !== roleSet.has(perm));
            const toggle = () => { if (!disabled) onToggle(perm); };
            return (
              <div key={perm} role="button" tabIndex={disabled ? -1 : 0} onClick={toggle}
                onKeyDown={(e) => { if (!disabled && (e.key === " " || e.key === "Enter")) { e.preventDefault(); toggle(); } }}
                style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 2px", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1, borderBottom: `1px solid ${LINE}` }}>
                <span><SquareCheck checked={on} /></span>
                <span style={{ minWidth: 0, flex: 1, fontSize: 14, fontWeight: 500, color: TEXT }}>{label}</span>
                {overridden && !disabled && (
                  <span style={{ fontSize: 11, fontWeight: 500, color: CARROT }} title="Отличается от пресета роли">
                    {on ? "+ вручную" : "− снято"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const ROLE_OPTIONS = STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }));

// Inline-форма: назначить сотрудника из учётки (add) либо изменить роль/права (edit).
// Хранит роль + оверрайды на учётке (/admin/users). Права — из каталога perms.js.
function EmployeeForm({ emp, accounts, onCancel, onSaved }) {
  const editing = !!emp;
  const [acc, setAcc] = React.useState(null);       // выбранная учётка (режим добавления)
  const [role, setRole] = React.useState(editing ? (emp.role || "executor") : "executor");
  const [position, setPosition] = React.useState(emp?.position || "");
  const [permSet, setPermSet] = React.useState(() => effectivePerms(editing ? (emp.role || "executor") : "executor", null));
  const [loading, setLoading] = React.useState(editing);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // При редактировании подтягиваем точные оверрайды учётки (список их не содержит).
  React.useEffect(() => {
    if (!editing) return;
    let alive = true;
    (async () => {
      try {
        const u = await adminGetUser(emp.id);
        if (!alive || !u) { if (alive) setLoading(false); return; }
        const r = u.role || "executor";
        setRole(r);
        setPosition(u.position || "");
        setPermSet(effectivePerms(r, u.permOverrides));
      } catch { /* оставляем предзаполнение из роли списка */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [editing, emp?.id]);

  const roleSet = React.useMemo(() => effectivePerms(role, null), [role]);
  const isAdminRole = role === "admin";

  const pickable = React.useMemo(
    () => (accounts || []).filter((a) => a.email && !STAFF_ROLES.includes(a.role)),
    [accounts]
  );

  const changeRole = (r) => { setRole(r); setPermSet(effectivePerms(r, null)); };       // роль → предзаполнить галочки
  const togglePerm = (perm) => setPermSet((s) => { const n = new Set(s); n.has(perm) ? n.delete(perm) : n.add(perm); return n; });
  const resetToRole = () => setPermSet(effectivePerms(role, null));

  const targetId = editing ? emp.id : (acc && acc.id);
  const canSave = !saving && !loading && !!targetId;

  const save = async () => {
    if (!canSave) return;
    setSaving(true); setError("");
    try {
      const permOverrides = isAdminRole ? { grant: [], revoke: [] } : diffOverrides(role, permSet);
      await saveStaff(targetId, { role, position: position.trim(), permOverrides });
      onSaved();
    } catch (e) {
      setError((e && e.message) || "Не удалось сохранить. Попробуйте ещё раз.");
      setSaving(false);
    }
  };

  const title = editing ? emp.fio : (acc ? acc.name || acc.email : "Новый сотрудник");

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={onCancel} style={backBtn}>← К списку сотрудников</button>
      <div style={{ marginTop: 14, ...h1 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>
        {editing ? (emp.email || "") : "Выберите учётную запись, роль и права доступа."}
      </div>

      {loading ? (
        <CenterSpinner minHeight={220} label="Загружаем права…" />
      ) : (
        <div style={{ marginTop: 26, display: "grid", gap: 22 }}>
          <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {!editing && (
              <div>
                <FLabel>Учётная запись</FLabel>
                <UnderAccountPicker accounts={pickable} value={acc} onPick={setAcc} loading={false} />
                {pickable.length === 0 && <div style={{ marginTop: 6, fontSize: 12, color: MUTED, fontWeight: 300 }}>Нет свободных учёток. Сначала создайте её в разделе «Создать учётную запись».</div>}
              </div>
            )}
            <div>
              <FLabel>Роль</FLabel>
              <UnderSelect value={role} onChange={changeRole} options={ROLE_OPTIONS} placeholder="Выберите роль" />
            </div>
            <div>
              <FLabel>Должность</FLabel>
              <UnderInput value={position} onChange={setPosition} placeholder="Например: Инженер ПТО" />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <FLabel>Права доступа</FLabel>
              {!isAdminRole && <button type="button" onClick={resetToRole} style={{ ...backBtn, color: CARROT }}>Сбросить к роли</button>}
            </div>
            {isAdminRole ? (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 300, color: MUTED }}>Администратор — полный доступ ко всем разделам. Отдельные права не настраиваются.</div>
            ) : (
              <div style={{ marginTop: 8 }}><PermChecklist permSet={permSet} roleSet={roleSet} onToggle={togglePerm} /></div>
            )}
          </div>

          {error && <div style={{ fontSize: 13, color: CARROT, fontWeight: 300 }}>{error}</div>}
          <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
            <PrimaryBtn onClick={save} disabled={!canSave}>{saving ? "Сохранение…" : editing ? "Сохранить" : "Добавить сотрудника"}</PrimaryBtn>
            <FillBtn big onClick={onCancel}>Отмена</FillBtn>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmployeesModule({ backTo }) {
  const force = useForceUpdate();
  const [q, setQ] = React.useState("");
  const [accounts, setAccounts] = React.useState([]);
  const [view, setView] = React.useState(null);   // null=список | {emp:null}=добавить | {emp}=редактировать
  const [busyId, setBusyId] = React.useState("");  // id учётки, которую сейчас понижаем
  // Учётки (для выбора при добавлении) + актуальный список сотрудников с бэкенда.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const list = await DB.listAccounts();
      if (alive) setAccounts(list);
      await hydrateStaff(true);
      if (alive) force();
    })();
    return () => { alive = false; };
  }, []);

  const t = q.toLowerCase().trim();
  const all = getEmployees();
  const list = all.filter((e) => !t || `${e.fio} ${e.position} ${e.email}`.toLowerCase().includes(t));

  const demote = async (e) => {
    if (busyId) return;
    if (!window.confirm(`Убрать «${e.fio}» из сотрудников? Учётная запись сохранится как заказчик.`)) return;
    setBusyId(e.id);
    try { await removeStaff(e.id); } catch { /* игнор: остаёмся как есть */ }
    finally { setBusyId(""); force(); }
  };

  const reloadAccounts = async () => { const l = await DB.listAccounts(); setAccounts(l); };

  if (view) {
    return (
      <EmployeeForm emp={view.emp} accounts={accounts}
        onCancel={() => setView(null)}
        onSaved={() => { setView(null); reloadAccounts(); force(); }} />
    );
  }

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      {backTo && <button type="button" onClick={() => navigate(backTo)} style={backBtn}>← К модулям</button>}
      <div style={{ marginTop: backTo ? 14 : 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={h1}>Сотрудники</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Учётные записи со штатной ролью и правами. Назначаются ответственными за объекты.</div>
        </div>
        <FillBtn big onClick={() => setView({ emp: null })}>+ Добавить сотрудника</FillBtn>
      </div>
      <div style={{ marginTop: 20 }}><UnderSearch value={q} onChange={setQ} placeholder="Поиск: ФИО, должность, e-mail…" /></div>

      <div style={{ marginTop: 26 }}>
        <ListHead label="Сотрудники" count={list.length} />
        <DottedLine />
        {list.map((e) => {
          const busy = busyId === e.id;
          return (
            <ListRow key={e.id} onOpen={() => setView({ emp: e })}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{e.fio}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "#555", background: "#f0f0f0", borderRadius: 6, padding: "2px 8px" }}>{ROLE_LABELS[e.role] || e.role}</span>
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{e.position || "—"}{e.email ? <span> · {e.email}</span> : null}</div>
                <div style={{ marginTop: 8, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 400, color: e.perms.length ? "#888" : "#bbb", lineHeight: 1.5 }}>
                  {e.role === "admin" ? "Полный доступ" : (e.perms.length === 0 ? "Прав не выдано" : e.perms.map((p) => permLabel(p)).join("  ·  "))}
                </div>
              </div>
              <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <FillBtn onClick={() => setView({ emp: e })}>Права</FillBtn>
                <FillBtn fill={CARROT} onClick={() => demote(e)} disabled={busy}>{busy ? "…" : "Убрать"}</FillBtn>
              </div>
            </ListRow>
          );
        })}
        {list.length === 0 && <div style={{ padding: "28px 8px", color: MUTED, fontSize: 14, fontWeight: 300 }}>{all.length === 0 ? "Сотрудников пока нет." : "Ничего не найдено."}</div>}
      </div>
    </div>
  );
}

/* ============================================================= */
/* ================== МОДУЛЬ «ШАБЛОНЫ ОБЪЕКТОВ» =============== */
/* ============================================================= */
// Inline-форма создания/редактирования шаблона: название, префикс (сокращение для № объекта), этапы.
function TemplateForm({ tpl, onCancel, onSaved }) {
  const editing = !!tpl;
  const [label, setLabel] = React.useState(tpl?.label || "");
  const [prefix, setPrefix] = React.useState(tpl?.prefix || "");
  const [stages, setStages] = React.useState(() => (tpl?.stages || []).slice());
  const canSave = label.trim() && normalizePrefix(prefix);
  const save = () => {
    if (!canSave) return;
    if (editing) updateTemplate(tpl.code, { label, prefix, stages });
    else addTemplate({ label, prefix, stages });
    onSaved();
  };
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={onCancel} style={backBtn}>← К шаблонам</button>
      <div style={{ marginTop: 14, ...h1 }}>{editing ? "Редактировать шаблон" : "Новый шаблон"}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Тип работ задаёт префикс для № объекта и типовые этапы при создании.</div>

      <div style={{ marginTop: 26, display: "grid", gap: 22 }}>
        <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          <div>
            <FLabel>Название</FLabel>
            <UnderInput value={label} onChange={setLabel} placeholder="Например: Электромонтаж" />
          </div>
          <div>
            <FLabel>Префикс — для № объекта</FLabel>
            <UnderInput value={prefix} onChange={(v) => setPrefix(normalizePrefix(v))} placeholder="ELM" maxLength={5} upper />
            <div style={{ marginTop: 6, fontSize: 12, color: MUTED, fontWeight: 300 }}>№ объекта будет вида <b style={{ color: TEXT }}>{(normalizePrefix(prefix) || "OBJ")}-A1B2C3</b>. Латиница и цифры, до 5.</div>
          </div>
        </div>
        <div>
          <FLabel>Этапы по умолчанию</FLabel>
          <div style={{ marginTop: 4 }}><StageListEditor stages={stages} setStages={setStages} /></div>
        </div>
        <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
          <PrimaryBtn onClick={save} disabled={!canSave}>{editing ? "Сохранить" : "Создать шаблон"}</PrimaryBtn>
          <FillBtn big onClick={onCancel}>Отмена</FillBtn>
        </div>
      </div>
    </div>
  );
}

export function TemplatesModule({ backTo }) {
  const force = useForceUpdate();
  const [q, setQ] = React.useState("");
  const [view, setView] = React.useState(null);   // null=список | {tpl:null}=создать | {tpl}=редактировать
  const t = q.toLowerCase().trim();
  const list = getTemplates().filter((x) => !t || `${x.label} ${x.prefix}`.toLowerCase().includes(t));

  if (view) {
    return <TemplateForm tpl={view.tpl} onCancel={() => setView(null)} onSaved={() => { setView(null); force(); }} />;
  }

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      {backTo && <button type="button" onClick={() => navigate(backTo)} style={backBtn}>← К модулям</button>}
      <div style={{ marginTop: backTo ? 14 : 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={h1}>Шаблоны объектов</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Тип работ задаёт префикс для № объекта и типовые этапы при создании.</div>
        </div>
        <FillBtn big onClick={() => setView({ tpl: null })}>+ Новый шаблон</FillBtn>
      </div>
      <div style={{ marginTop: 20 }}><UnderSearch value={q} onChange={setQ} placeholder="Поиск: название, префикс…" /></div>

      <div style={{ marginTop: 26 }}>
        <ListHead label="Шаблоны" count={list.length} />
        <DottedLine />
        {list.map((x) => {
          const modified = x.base && isTemplateModified(x.code);
          return (
            <ListRow key={x.code} onOpen={() => setView({ tpl: x })}>
              <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: "#111", padding: "5px 10px", borderRadius: 7 }}>{x.prefix}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{x.label}</div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{x.base ? "Базовый" : "Свой"}{modified ? " · изменён" : ""} · № вида {x.prefix}-… · этапов: {x.stages.length}</div>
                {x.stages.length > 0 && <div style={{ marginTop: 8, fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 400, color: "#888", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.stages.map(stTitle).join("  ·  ")}</div>}
              </div>
              <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <FillBtn onClick={() => setView({ tpl: x })}>Редактировать</FillBtn>
                {modified && <FillBtn onClick={() => { resetTemplate(x.code); force(); }}>Сбросить</FillBtn>}
                <FillBtn fill={CARROT} onClick={() => { if (window.confirm(x.base ? `Скрыть базовый шаблон «${x.label}»?` : `Удалить шаблон «${x.label}»?`)) { removeTemplate(x.code); force(); } }}>{x.base ? "Скрыть" : "Удалить"}</FillBtn>
              </div>
            </ListRow>
          );
        })}
        {list.length === 0 && <div style={{ padding: "28px 8px", color: MUTED, fontSize: 14, fontWeight: 300 }}>Ничего не найдено.</div>}
      </div>
    </div>
  );
}

/* ============================================================= */
/* ====================== ТОЧКА ВХОДА ========================= */
/* ============================================================= */
export default function ObjectsSection({ userEmail, userId, isAdmin }) {
  const force = useForceUpdate();
  React.useEffect(() => {
    const on = () => force();
    window.addEventListener("popstate", on);
    window.addEventListener("objects:changed", on);  // перерисовка после гидрации/записи
    DB.hydrateObjects && DB.hydrateObjects({ force: true }); // подтянуть свежие данные с бэка
    return () => { window.removeEventListener("popstate", on); window.removeEventListener("objects:changed", on); };
  }, [force]);

  // Живое обновление без F5: пока открыта вкладка «Объекты», раз в 15с тихо
  // перечитываем данные с бэка — новое сообщение/изменение появляется само и
  // загорается точка «новое». Опрос идёт ТОЛЬКО когда вкладка активна (при
  // сворачивании — пауза), чтобы не жечь вызовы функции впустую.
  React.useEffect(() => {
    if (!(DB.usesApi && DB.usesApi())) return;
    let timer = null;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      DB.hydrateObjects && DB.hydrateObjects({ force: true });
    };
    const start = () => { if (!timer) timer = setInterval(tick, 15000); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVis = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") { tick(); start(); }
      else stop();
    };
    start();
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis);
    return () => { stop(); if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis); };
  }, []);
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const preview = /(?:\?|&)preview=customer/.test(search);
  const openMsg = /(?:\?|&)msg=1(?:&|$)/.test(search); // диплинк из письма-уведомления
  const mObj = p.match(/\/account\/objects\/([^/?#]+)/);
  const objId = mObj ? decodeURIComponent(mObj[1]) : null;

  if (objId) {
    if (isAdmin && !preview) return <AdminObjectEditor id={objId} autoOpenMessages={openMsg} />;
    return <CustomerObjectView id={objId} preview={isAdmin && preview} autoOpenMessages={openMsg} userEmail={userEmail} />;
  }
  if (isAdmin) return <AdminObjectsList />;
  return <CustomerObjectsList email={userEmail} accountId={userId} />;
}
