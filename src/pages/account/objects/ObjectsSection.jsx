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
  toneOf, labelOf, extOf, getEmployees, addEmployee, removeEmployee,
  getTemplates, templateByCode, addTemplate, updateTemplate, removeTemplate,
  resetTemplate, isTemplateModified, normalizePrefix,
  EMP_CAPS, addEmployeeFromAccount, updateEmployee, employeeByEmail,
  getMessages, addMessage, threadStatus,
} from "@/data/objects.js";

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
                  {DB.isObjectUnseen(o) && <NewBadge />}
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{o.address || o.city}{o.responsibleName ? ` · ${o.responsibleName}` : ""} · {(o.documents || []).length} док.</div>
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
function StageListEditor({ stages, setStages }) {
  const [newStage, setNewStage] = React.useState("");
  const addStage = () => { const s = newStage.trim(); if (!s) return; setStages((v) => [...v, s]); setNewStage(""); };
  const dragFrom = React.useRef(null);
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);
  const editAt = (i, val) => setStages((prev) => prev.map((x, j) => (j === i ? val : x)));
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
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", boxShadow: `inset 0 -1px 0 0 ${UNDER}`, opacity: dragging ? 0.4 : 1, background: over ? "#fafafa" : "transparent", transition: "background-color .12s ease" }}>
              <span draggable
                onDragStart={() => { dragFrom.current = i; setDragIdx(i); }}
                onDragEnd={() => { dragFrom.current = null; setDragIdx(null); setOverIdx(null); }}
                title="Перетащите"
                style={{ cursor: "grab", color: "#c4c4c4", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0 }}>⠿</span>
              <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>{i + 1}</span>
              <input key={`stage-in-${i}-${s}`} defaultValue={s} onBlur={(e) => { if (e.target.value !== s) editAt(i, e.target.value); }} placeholder="Название этапа"
                style={{ flex: 1, minWidth: 0, height: 40, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
              <button type="button" onClick={() => setStages(stages.filter((_, j) => j !== i))} title="Удалить этап"
                style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#b0b0b0", cursor: "pointer", flexShrink: 0, borderRadius: 8, transition: "color .12s, background-color .12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = CARROT; e.currentTarget.style.background = "#faf1ee"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#b0b0b0"; e.currentTarget.style.background = "transparent"; }}><IconTrash size={17} /></button>
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
  const [stages, setStages] = React.useState(() => ((templates.find((x) => x.code === firstCode) || {}).stages || []).slice());

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
            <UnderSelect value={respId} onChange={setRespId} placeholder="— выбрать из сотрудников —" options={empOpts()} />
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
function AdminObjectEditor({ id, autoOpenMessages }) {
  const force = useForceUpdate();
  const obj = DB.getObject(id);
  React.useEffect(() => { DB.markObjectSeen(id); }, [id]);
  if (!obj) return <div style={{ fontFamily: UI, marginTop: 8 }}><button style={backBtn} onClick={() => navigate("/account/objects")}>← К объектам</button><div style={{ marginTop: 20, color: MUTED }}>Объект не найден.</div></div>;
  const save = (patch) => { DB.updateObject(id, patch); force(); };
  const respId = respIdOf(obj);

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button style={backBtn} onClick={() => navigate("/account/objects")}>← К объектам</button>
        <FillBtn onClick={() => navigate(`/account/objects/${encodeURIComponent(id)}?preview=customer`)}>Предпросмотр как заказчик</FillBtn>
      </div>

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
          <div><FLabel>Заказчик</FLabel><UnderCommitInput key={`cust-${obj.customerName || ""}`} defaultValue={obj.customerName} onCommit={(v) => save({ customerName: v })} /></div>
          <ObjInnField obj={obj} save={save} />
          <div><FLabel>КПП</FLabel><UnderCommitInput key={`kpp-${obj.kpp || ""}`} defaultValue={obj.kpp} onCommit={(v) => save({ kpp: v })} /></div>
          <div><FLabel>Город</FLabel><UnderCommitInput defaultValue={obj.city} onCommit={(v) => save({ city: v })} /></div>
          <div><FLabel>Адрес</FLabel><UnderCommitInput key={`addr-${obj.address || ""}`} defaultValue={obj.address} onCommit={(v) => save({ address: v })} /></div>
          <div><FLabel>Договор</FLabel><UnderCommitInput defaultValue={obj.contractNumber} onCommit={(v) => save({ contractNumber: v })} /></div>
          <div>
            <FLabel>Ответственный</FLabel>
            <UnderSelect value={respId} options={empOpts()} placeholder="— не назначен —" onChange={(v) => { const e = getEmployees().find((x) => x.id === v); save({ responsibleName: e ? e.fio : "", responsibleRole: e ? e.position : "", responsibleEmail: e ? (e.email || "") : "" }); }} />
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
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", boxShadow: `inset 0 -1px 0 0 ${UNDER}`, opacity: dragging ? 0.4 : 1, background: over ? "#fafafa" : "transparent", transition: "background-color .12s ease" }}>
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
      {busy ? <Spinner size={14} /> : <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>{isImg ? "🖼" : "📎"}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name || "файл"}</span>
    </button>
  );
}

function MessagesPanel({ objId, side, authorName, disabled, autoOpen }) {
  const force = useForceUpdate();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [sentNote, setSentNote] = React.useState("");
  const [atts, setAtts] = React.useState([]); // черновик вложений: {id,name,size,mime,key?,uploading,error,isImage}
  const msgs = getMessages(objId);
  const status = threadStatus(objId);
  const isCustomer = side === "customer";
  const rootRef = React.useRef(null);
  const fileRef = React.useRef(null);
  // Перерисовка при обновлении треда (оптимистичное добавление + ответ сервера).
  React.useEffect(() => {
    const on = () => force();
    window.addEventListener("objects:changed", on);
    return () => window.removeEventListener("objects:changed", on);
  }, []);
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
    setTimeout(() => { try { rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {} }, 80);
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

  return (
    <div ref={rootRef} style={{ marginTop: 34, scrollMarginTop: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={secLabel}>{isCustomer ? "Сообщение по объекту" : "Запросы заказчика"}</div>
        {status === "awaiting" && <span style={{ fontSize: 11, fontWeight: 600, color: "#b0451f", background: "#fff4ef", border: "1px solid #f6c9b6", borderRadius: 999, padding: "3px 9px" }}>Ожидание ответа</span>}
        {status === "answered" && <span style={{ fontSize: 11, fontWeight: 600, color: "#2f7d32", background: "#eef7ee", border: "1px solid #cfe6cf", borderRadius: 999, padding: "3px 9px" }}>Отвечено</span>}
      </div>

      {/* История: запрос / ответ — обычными строками, не «чатом» */}
      {msgs.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
          {msgs.map((m) => {
            const fromCustomer = m.from === "customer";
            const mine = m.from === side; // моё сообщение — слева, собеседника — справа
            const accent = fromCustomer ? "#e0e0e0" : "#111";
            const mAtts = Array.isArray(m.attachments) ? m.attachments : [];
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-start" : "flex-end" }}>
                <div style={{
                  maxWidth: "82%",
                  borderLeft: mine ? `2px solid ${accent}` : "none",
                  borderRight: mine ? "none" : `2px solid ${accent}`,
                  paddingLeft: mine ? 14 : 0,
                  paddingRight: mine ? 0 : 14,
                  textAlign: mine ? "left" : "right",
                  opacity: m.pending ? 0.6 : 1,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: fromCustomer ? MUTED : TEXT }}>
                    {fromCustomer ? "Запрос заказчика" : "Ответ ответственного"}
                  </div>
                  {(m.author || m.at) && (
                    <div style={{ marginTop: 2, fontSize: 12, color: MUTED }}>
                      {m.author ? m.author : ""}{m.author && fmtMsgTime(m) ? " · " : ""}{fmtMsgTime(m)}
                    </div>
                  )}
                  {m.text && <div style={{ marginTop: 5, fontSize: 15, lineHeight: 1.5, color: TEXT, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>}
                  {mAtts.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: mine ? "flex-start" : "flex-end" }}>
                      {mAtts.map((att, i) => <MsgAttachment key={att.key || i} att={att} />)}
                    </div>
                  )}
                  {m.pending && <div style={{ marginTop: 4, fontSize: 11, color: MUTED }}>Отправляется…</div>}
                  {m.failed && <div style={{ marginTop: 4, fontSize: 11, color: "#b0451f" }}>Не отправлено — попробуйте ещё раз.</div>}
                </div>
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
            onFocus={(e) => { e.currentTarget.style.borderColor = "#999"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = LINE; }}
            placeholder={isCustomer ? "Опишите вопрос по объекту…" : "Напишите ответ заказчику…"}
            style={{ display: "block", width: "100%", height: 150, resize: "none", border: `1px solid ${LINE}`, borderRadius: 12, background: "#fff", padding: "12px 14px", fontFamily: UI, fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: TEXT, outline: "none", transition: "border-color .3s ease" }} />

          {/* Черновик вложений */}
          {atts.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {atts.map((a) => (
                <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 6px 0 10px", borderRadius: 8, border: `1px solid ${a.error ? "#f0b4a4" : LINE}`, background: a.error ? "#fff4ef" : "#fafafa", fontSize: 12.5, color: a.error ? "#b0451f" : TEXT, maxWidth: 240 }}>
                  {a.uploading ? <Spinner size={13} /> : <span aria-hidden style={{ lineHeight: 1 }}>{a.error ? "⚠" : a.isImage ? "🖼" : "📎"}</span>}
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
              {uploadingAny ? "Загрузка файла…" : isCustomer ? "Отправить запрос" : "Отправить ответ"}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} title="Прикрепить файл или скриншот"
              style={{ height: 52, width: 52, display: "grid", placeItems: "center", borderRadius: 10, border: `1px solid ${LINE}`, background: "#fff", color: "#555", fontSize: 18, cursor: "pointer", transition: "border-color .16s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#999"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; }}>📎</button>
            <button type="button" onClick={resetComposer}
              style={{ height: 52, padding: "0 24px", borderRadius: 10, border: `1px solid ${LINE}`, background: "#fff", color: TEXT, fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: "pointer", transition: "border-color .16s ease, background-color .16s ease" }}
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

// Иконка «отследить изменения»: линия с тремя кружками.
function TrackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="12" r="2.3" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.3" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="12" r="2.3" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Кнопка + выезжающая справа панель «История изменений» (таймлайн событий объекта).
// Морковная пульсирующая точка «новое» — тот же индикатор, что у «Запросы» в
// StickyDock (расходящееся кольцо). Ставится после названия объекта.
function NewBadge({ size = 8, style }) {
  return (
    <span aria-hidden="true" title="Есть новое"
      style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: CARROT, flexShrink: 0, animation: "cubeNewPulse 1.8s ease-out infinite", ...style }}>
      <style>{`@keyframes cubeNewPulse{0%{box-shadow:0 0 0 0 rgba(250,93,41,.5)}70%{box-shadow:0 0 0 6px rgba(250,93,41,0)}100%{box-shadow:0 0 0 0 rgba(250,93,41,0)}}`}</style>
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
      <button type="button" onClick={() => setOpen(true)} title="История изменений по объекту"
        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: 10, border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 13, fontWeight: 500, color: TEXT, whiteSpace: "nowrap", transition: "border-color .15s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#bbb"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; }}>
        <TrackIcon />
        Изменения
      </button>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: "rgba(17,17,17,.28)", animation: "clFade .2s ease" }}>
          <style>{`@keyframes clFade{from{opacity:0}to{opacity:1}}@keyframes clSlide{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(440px, 100%)", background: "#fff", boxShadow: "-12px 0 40px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", animation: "clSlide .28s cubic-bezier(.2,.8,.2,1)" }}>
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
                      <span style={{ position: "absolute", left: 3, top: 4, width: 9, height: 9, borderRadius: 999, background: "#fff", border: `2px solid ${CARROT}`, zIndex: 1 }} />
                      {i < list.length - 1 && <span style={{ position: "absolute", left: 7, top: 15, bottom: -18, width: 1, background: LINE }} />}
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{e.title || "Изменение"}</div>
                      {e.description && <div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 300, lineHeight: 1.45, color: "#444", wordBreak: "break-word" }}>{e.description}</div>}
                      <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>{e.author ? e.author : ""}{e.author && e.createdAt ? " · " : ""}{e.createdAt || ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CustomerObjectView({ id, preview, autoOpenMessages }) {
  const o = DB.getCustomerView(id);
  // Непросмотренность фиксируем на момент захода (до отметки «видел»), чтобы этот
  // визит показал «новое», а следующий — уже нет. В предпросмотре не трогаем.
  const unseen = React.useMemo(() => (!preview && o ? DB.isObjectUnseen(o) : false), [id, preview]);
  React.useEffect(() => { if (!preview) DB.markObjectSeen(id); }, [id, preview]);
  if (!o) return <div style={{ fontFamily: UI, marginTop: 8 }}><button style={backBtn} onClick={() => navigate("/account/objects")}>← Назад</button><div style={{ marginTop: 20, color: MUTED }}>Объект недоступен.</div></div>;
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
          {unseen && <NewBadge />}
        </div>
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 14, fontWeight: 300, color: "#444", alignItems: "center" }}>
          {o.address && <span>{o.address}</span>}
          {o.inn && <span>ИНН {o.inn}</span>}
          {o.kpp && <span>КПП {o.kpp}</span>}
          {o.contractNumber && <span>Договор: {o.contractNumber}</span>}
          <Badge label={st.label} tone={st.tone} />
        </div>
      </div>
        <ChangeLogButton events={o.events} />
      </div>

      {/* Ответственный */}
      {o.responsibleName && (
        <div style={{ marginTop: 22 }}>
          <div style={secLabel}>Ответственный за объект</div>
          <div style={{ marginTop: 8, fontSize: 15, color: TEXT }}>{o.responsibleName}{o.responsibleRole ? <span style={{ color: MUTED, fontWeight: 300 }}> · {o.responsibleRole}</span> : null}</div>
        </div>
      )}

      {/* Этапы (только чтение) */}
      <SectionRule />
      <div style={{ marginTop: 28 }}>
        <div style={secLabel}>Этапы работ</div>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {(o.stages || []).map((s) => { const sst = STAGE_STATUSES.find((x) => x.code === s.status) || {}; return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, flexShrink: 0, background: s.status === "not_started" ? "#fff" : sst.tone, border: `2px solid ${sst.tone}` }} />
              <span style={{ fontSize: 15, fontWeight: s.status === "in_progress" ? 600 : 400, color: s.status === "not_started" ? MUTED : TEXT }}>{s.title}</span>
              <Badge label={sst.label} tone={sst.tone} />
            </div>
          ); })}
          {(o.stages || []).length === 0 && <div style={{ color: MUTED, fontSize: 14, fontWeight: 300 }}>Этапы не заданы.</div>}
        </div>
      </div>

      {/* Документы */}
      <SectionRule />
      <div style={{ marginTop: 30 }}>
        <div style={secLabel}>Документы</div>
        {cats.length === 0 ? <div style={{ marginTop: 12, color: MUTED, fontSize: 14, fontWeight: 300 }}>Документов пока нет.</div> : (
          <div style={{ marginTop: 14, display: "grid", gap: 20 }}>
            {cats.map((cat) => (
              <div key={cat}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{cat}</div>
                <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
                  {byCat[cat].map((d, i) => (
                    <React.Fragment key={d.id}>
                      {i > 0 && <Dotted />}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                        <ExtBadge ext={d.type || d.file} />
                        <div style={{ minWidth: 0, flex: 1, fontSize: 14, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                        {canPreview(d) && <DownloadBtn doc={d} label="Открыть" preview />}
                        <DownloadBtn doc={d} label="Скачать" />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
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
                  <Badge label={st.label || o.status} tone={st.tone} />
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{o.customerName} — {o.title}</span>
                  {DB.isObjectUnseen(o) && <NewBadge />}
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{o.address || o.city}{o.responsibleName ? ` · ${o.responsibleName}` : ""} · {(o.documents || []).length} док.</div>
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
// Чек-лист прав «полуадмина» — фирменные квадратные галочки (как на /admin/create-account).
function CapsChecklist({ caps, setCaps }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      {EMP_CAPS.map((c) => {
        const on = !!caps[c.key];
        return (
          <div key={c.key} role="button" tabIndex={0} onClick={() => setCaps({ ...caps, [c.key]: !on })}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCaps({ ...caps, [c.key]: !on }); } }}
            style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 2px", cursor: "pointer", borderBottom: `1px solid ${UNDER}` }}>
            <span style={{ marginTop: 1 }}><SquareCheck checked={on} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: TEXT }}>{c.label}</span>
              <span style={{ display: "block", marginTop: 2, fontSize: 12, fontWeight: 300, color: MUTED, lineHeight: 1.4 }}>{c.hint}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Inline-форма (как /admin/create-account): добавить сотрудника из учётки (add) или отредактировать права (edit).
function EmployeeForm({ emp, accounts, existingEmails, onCancel, onSaved }) {
  const editing = !!emp;
  const [acc, setAcc] = React.useState(null);       // выбранная учётка (режим добавления)
  const [fio, setFio] = React.useState(emp?.fio || "");
  const [email, setEmail] = React.useState(emp?.email || "");
  const [position, setPosition] = React.useState(emp?.position || "");
  const [caps, setCaps] = React.useState(() => { const c = {}; EMP_CAPS.forEach((x) => (c[x.key] = !!emp?.caps?.[x.key])); return c; });
  const pickable = React.useMemo(() => (accounts || []).filter((a) => a.email && !existingEmails.has(a.email.toLowerCase())), [accounts, existingEmails]);
  const emailTrim = email.trim().toLowerCase();
  const emailBad = !!emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
  // при редактировании нельзя занять e-mail другого сотрудника
  const emailTaken = editing && !!emailTrim && emailTrim !== (emp?.email || "").toLowerCase() && existingEmails.has(emailTrim);
  const canSave = editing ? !emailBad && !emailTaken : !!acc;
  const save = () => {
    if (!canSave) return;
    if (editing) updateEmployee(emp.id, { fio, email: emailTrim, position, caps });
    else addEmployeeFromAccount(acc, { position, caps });
    onSaved();
  };
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={onCancel} style={backBtn}>← К списку сотрудников</button>
      <div style={{ marginTop: 14, ...h1 }}>{editing ? emp.fio : "Новый сотрудник"}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>
        {editing ? (emp.email || "без привязки к e-mail") : "Выберите учётную запись и выдайте права доступа."}
      </div>

      <div style={{ marginTop: 26, display: "grid", gap: 22 }}>
        <div style={{ display: "grid", gap: 22, gridTemplateColumns: editing ? "1fr" : "repeat(auto-fit,minmax(260px,1fr))" }}>
          {!editing && (
            <div>
              <FLabel>Учётная запись</FLabel>
              <UnderAccountPicker accounts={pickable} value={acc} onPick={setAcc} loading={false} />
              {pickable.length === 0 && <div style={{ marginTop: 6, fontSize: 12, color: MUTED, fontWeight: 300 }}>Нет свободных учёток. Сначала создайте её в разделе «Создать учётную запись».</div>}
            </div>
          )}
          <div>
            <FLabel>Должность</FLabel>
            <UnderInput value={position} onChange={setPosition} placeholder="Например: Инженер ПТО" />
          </div>
        </div>
        {editing && (
          <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <div>
              <FLabel>ФИО</FLabel>
              <UnderInput value={fio} onChange={setFio} placeholder="Фамилия Имя Отчество" />
            </div>
            <div>
              <FLabel>E-mail{emp?.email ? "" : " — привязать учётку"}</FLabel>
              <UnderInput value={email} onChange={setEmail} placeholder="name@cube-tech.ru" />
              {emailBad && <div style={{ marginTop: 6, fontSize: 12, color: CARROT, fontWeight: 300 }}>Проверьте адрес — похоже на ошибку.</div>}
              {emailTaken && <div style={{ marginTop: 6, fontSize: 12, color: CARROT, fontWeight: 300 }}>Этот e-mail уже привязан к другому сотруднику.</div>}
              {!emp?.email && !emailBad && <div style={{ marginTop: 6, fontSize: 12, color: MUTED, fontWeight: 300 }}>Укажите e-mail — на него уходят уведомления по объектам.</div>}
            </div>
          </div>
        )}
        <div>
          <FLabel>Права доступа</FLabel>
          <div style={{ marginTop: 4 }}><CapsChecklist caps={caps} setCaps={setCaps} /></div>
        </div>
        <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
          <PrimaryBtn onClick={save} disabled={!canSave}>{editing ? "Сохранить" : "Добавить сотрудника"}</PrimaryBtn>
          <FillBtn big onClick={onCancel}>Отмена</FillBtn>
        </div>
      </div>
    </div>
  );
}

export function EmployeesModule({ backTo }) {
  const force = useForceUpdate();
  const [q, setQ] = React.useState("");
  const [accounts, setAccounts] = React.useState([]);
  const [view, setView] = React.useState(null);   // null=список | {emp:null}=добавить | {emp}=редактировать
  React.useEffect(() => { let alive = true; (async () => { const list = await DB.listAccounts(); if (alive) setAccounts(list); })(); return () => { alive = false; }; }, []);
  const t = q.toLowerCase().trim();
  const all = getEmployees();
  const existingEmails = new Set(all.map((e) => (e.email || "").toLowerCase()).filter(Boolean));
  const list = all.filter((e) => !t || `${e.fio} ${e.position} ${e.email}`.toLowerCase().includes(t));

  if (view) {
    return (
      <EmployeeForm emp={view.emp} accounts={accounts} existingEmails={existingEmails}
        onCancel={() => setView(null)} onSaved={() => { setView(null); force(); }} />
    );
  }

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      {backTo && <button type="button" onClick={() => navigate(backTo)} style={backBtn}>← К модулям</button>}
      <div style={{ marginTop: backTo ? 14 : 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={h1}>Сотрудники</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED }}>Учётные записи с правами «полуадмина». Назначаются ответственными за объекты.</div>
        </div>
        <FillBtn big onClick={() => setView({ emp: null })}>+ Добавить сотрудника</FillBtn>
      </div>
      <div style={{ marginTop: 20 }}><UnderSearch value={q} onChange={setQ} placeholder="Поиск: ФИО, должность, e-mail…" /></div>

      <div style={{ marginTop: 26 }}>
        <ListHead label="Сотрудники" count={list.length} />
        <DottedLine />
        {list.map((e) => {
          const capList = EMP_CAPS.filter((c) => e.caps[c.key]);
          return (
            <ListRow key={e.id} onOpen={() => setView({ emp: e })}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{e.fio}</div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: MUTED }}>{e.position || "—"}{e.email ? <span> · {e.email}</span> : <span style={{ color: "#c07a2a" }}> · без учётки</span>}</div>
                <div style={{ marginTop: 8, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 400, color: capList.length ? "#888" : "#bbb", lineHeight: 1.5 }}>
                  {capList.length === 0 ? "Прав не выдано" : capList.map((c) => c.label).join("  ·  ")}
                </div>
              </div>
              <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <FillBtn onClick={() => setView({ emp: e })}>Права</FillBtn>
                <FillBtn fill={CARROT} onClick={() => { if (window.confirm(`Удалить «${e.fio}» из сотрудников?`)) { removeEmployee(e.id); force(); } }}>Удалить</FillBtn>
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
                {x.stages.length > 0 && <div style={{ marginTop: 8, fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 400, color: "#888", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.stages.join("  ·  ")}</div>}
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
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const preview = /(?:\?|&)preview=customer/.test(search);
  const openMsg = /(?:\?|&)msg=1(?:&|$)/.test(search); // диплинк из письма-уведомления
  const mObj = p.match(/\/account\/objects\/([^/?#]+)/);
  const objId = mObj ? decodeURIComponent(mObj[1]) : null;

  if (objId) {
    if (isAdmin && !preview) return <AdminObjectEditor id={objId} autoOpenMessages={openMsg} />;
    return <CustomerObjectView id={objId} preview={isAdmin && preview} autoOpenMessages={openMsg} />;
  }
  if (isAdmin) return <AdminObjectsList />;
  return <CustomerObjectsList email={userEmail} accountId={userId} />;
}
