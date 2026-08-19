// src/pages/account/documents/DocumentsSection.jsx
// Раздел «Документы»: реестр счетов + форма счёта (стиль КУБ) + справочники
// «Мои организации» (с подписью/печатью) и «Контрагенты». Данные — src/data/documents.js.
import React from "react";
import {
  listDocuments, getDocument, addDocument, saveDocument, deleteDocument, hydrateDocuments, isDocumentsLoading,
  listOrgs, addOrg, saveOrg, deleteOrg, hydrateOrgs,
  listCounterparties, addCounterparty, saveCounterparty, deleteCounterparty, hydrateCounterparties,
  lookupOrgByInn, lookupBankByBik, askAssistant, suggestParty,
  KUB_ORG_SEED, VAT_MODES, DEFAULT_VAT_RATE, computeTotals, fmtMoney, parseNum, itemSum, nextInvoiceNumber,
} from "@/data/documents.js";
import { listObjects, hydrateObjects, listAccounts, OBJECT_STATUSES, STAGE_STATUSES, labelOf } from "@/data/objects.js";
import { InvoiceSheetModal } from "@/components/documents/InvoiceSheet.jsx";
import { downloadInvoiceExcel } from "@/components/documents/InvoiceExcel.js";
import { downloadPaymentTxt, buildPurpose } from "@/components/documents/PaymentOrder.js";
import ImportItemsModal from "@/pages/account/documents/ImportItems.jsx";
import * as XLSX from "xlsx";

/* ============================ стиль ============================ */
const UI = "'Inter Tight',Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const TEXT = "#111", MUTED = "#777", CARROT = "#FA5D29", LINE = "#e6e6e6", CARD = "#fbfbfb";

const DEFAULT_NOTICE = "Внимание! Оплата данного счёта означает согласие с условиями оказания услуг и выполнения работ. Счёт действителен к оплате в течение 5 (пяти) банковских дней с даты выставления. Работы (услуги) выполняются после поступления оплаты на расчётный счёт Исполнителя, если иное не предусмотрено договором. По всем вопросам обращайтесь по реквизитам, указанным в счёте.";

// Адаптив: узкий экран (телефон/маленький планшет портрет). Обновляется на resize/повороте.
function useNarrow(bp = 640) {
  const get = () => (typeof window !== "undefined" ? window.innerWidth <= bp : false);
  const [n, setN] = React.useState(get);
  React.useEffect(() => {
    const f = () => setN(get());
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [bp]);
  return n;
}

/* ---- примитивы формы (эталон КУБ: подчёркивание, без контура) ---- */
function FLabel({ children, style }) {
  return <div style={{ fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase", color: TEXT, fontWeight: 300, marginBottom: 6, ...style }}>{children}</div>;
}
function UnderInput({ value, onChange, placeholder, type = "text", style, onBlur, disabled }) {
  const [foc, setFoc] = React.useState(false);
  return (
    <input type={type} value={value ?? ""} placeholder={placeholder} disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)} onFocus={() => setFoc(true)} onBlur={(e) => { setFoc(false); onBlur?.(e); }}
      style={{ height: 44, width: "100%", border: 0, borderRadius: 0, background: disabled ? "#f6f6f6" : "#fff", padding: "0 12px", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, outline: "none", boxShadow: `inset 0 -1px 0 0 ${foc ? "#111" : LINE}`, transition: "box-shadow .18s ease", ...style }} />
  );
}
// Кастомный выпадающий список — как UnderSelect в объектах (кнопка-подчёркивание + меню).
function UnderSelect({ value, onChange, options = [], placeholder = "— выбрать —", disabled }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const cur = options.find((o) => String(o.value) === String(value));
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: disabled ? "#f6f6f6" : "#fff", color: cur ? TEXT : "#9a9a9a", padding: "0 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, boxShadow: `inset 0 -1px 0 0 ${open ? "#111" : LINE}`, transition: "box-shadow .18s ease", display: "grid", gridTemplateColumns: "1fr 24px", alignItems: "center", textAlign: "left", cursor: disabled ? "default" : "pointer" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur ? cur.label : placeholder}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: "#b1b1b1", justifySelf: "end", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="animate-svcfade" style={{ position: "absolute", left: 0, right: 0, top: 46, background: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,.10)", zIndex: 40, maxHeight: 320, overflowY: "auto" }}>
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <button key={String(o.value)} type="button" onClick={() => { onChange?.(o.value); setOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: active ? "#f3f3f3" : "#fff", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = active ? "#f3f3f3" : "#fff"; }}>{o.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
// Кнопки в стиле сайта: primary=чёрная (подъём при наведении), ghost=контур→заливка, soft=светлая, danger=мягкая. Наведение через JS.
function Btn({ children, onClick, kind = "ghost", style, disabled, type = "button" }) {
  const [h, setH] = React.useState(false); const on = h && !disabled;
  const kinds = {
    primary: { background: on ? "#262626" : "#111", color: "#fff", border: `1px solid ${on ? "#262626" : "#111"}`, boxShadow: on ? "0 8px 22px rgba(0,0,0,.18)" : "none", transform: on ? "translateY(-1px)" : "none" },
    ghost: { background: on ? "#111" : "transparent", color: on ? "#fff" : "#111", border: "1px solid #111" },
    soft: { background: on ? "#f2f2f2" : "#fff", color: TEXT, border: `1px solid ${on ? "#c8c8c8" : "#e2e2e2"}` },
    danger: { background: on ? "#fbe9e2" : "transparent", color: "#c0431c", border: `1px solid ${on ? "#e6c4b6" : "#e9d6ce"}` },
  };
  return <button type={type} onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: kind === "primary" ? 10 : 12, fontFamily: UI, fontSize: 14, fontWeight: kind === "primary" ? 600 : 400, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", transition: "background-color .16s ease, color .16s ease, box-shadow .16s ease, transform .16s ease, border-color .16s ease", ...kinds[kind], ...style }}>{children}</button>;
}
// Чекбокс-квадрат с масштабирующейся точкой (как SquareCheck в объектах).
function Check({ checked, onChange, label }) {
  return (
    <span onClick={() => onChange?.(!checked)} style={{ display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13.5, fontWeight: 300, color: TEXT, userSelect: "none" }}>
      <span aria-hidden="true" style={{ width: 18, height: 18, display: "inline-grid", placeItems: "center", border: `1px solid ${checked ? TEXT : "#cfcfcf"}`, borderRadius: 4, background: "#fff", flexShrink: 0, transition: "border-color .14s ease" }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: TEXT, transform: checked ? "scale(1)" : "scale(0)", transition: "transform 140ms ease-out" }} />
      </span>
      {label}
    </span>
  );
}
// Сегмент-переключатель (как «Заказчику приходит / Команде приходит»).
function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: "inline-flex", gap: 4, background: "#ededed", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          style={{ border: "none", background: value === o.value ? "#111" : "transparent", color: value === o.value ? "#fff" : "#666", fontFamily: UI, fontSize: 13, fontWeight: 400, padding: "8px 15px", borderRadius: 8, cursor: "pointer", transition: "background-color .15s ease, color .15s ease" }}>{o.label}</button>
      ))}
    </div>
  );
}
function UploadIcon({ size = 18 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z" /><path d="M12 14V8m0 0l-3 3m3-3l3 3" /></svg>;
}
function ExcelIcon() {
  return <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", background: "#2f7d4f", color: "#fff", borderRadius: 7, height: 26, padding: "0 8px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".02em", fontFamily: UI }}>XLSX</span>;
}
function PlusIcon({ size = 18 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#1f7a44" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
// Плоская кнопка-ссылка (иконка + текст, без контура) — как «+ Добавить строку»/«загрузить из файла».
function PlainBtn({ icon, children, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, height: 40, padding: "0 4px", border: "none", background: "transparent", color: h ? "#000" : "#222", fontFamily: UI, fontSize: 14.5, fontWeight: 400, cursor: "pointer", transition: "color .15s ease" }}>
      {icon}<span style={{ borderBottom: h ? "1px solid #aaa" : "1px solid transparent", transition: "border-color .15s ease" }}>{children}</span>
    </button>
  );
}
// Поле ИНН покупателя с подсказкой-подтверждением (как в профиле): вводишь ИНН →
// всплывает найденная компания → нажимаешь, реквизиты подставляются (не автоматом).
function BuyerInn({ inn, filled, onChange, onConfirm }) {
  const [sug, setSug] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef(null);
  const firstRun = React.useRef(true); // первый рендер = открыли форму, а не ввод пользователя
  React.useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  React.useEffect(() => {
    const q = String(inn || "").replace(/\D/g, "");
    const wasFirst = firstRun.current; firstRun.current = false;
    if (q.length !== 10 && q.length !== 12) { setSug(null); setOpen(false); setLoading(false); return; }
    // Открыли уже заполненного покупателя (есть название) — не навязываем подсказку.
    // Показываем только когда ИНН реально меняют (после первого рендера).
    if (wasFirst && filled) return;
    let alive = true; setLoading(true);
    const t = setTimeout(() => { lookupOrgByInn(q).then((r) => { if (!alive) return; setLoading(false); if (r && r.name) { setSug(r); setOpen(true); } else { setSug(null); setOpen(false); } }); }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [inn]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <UnderInput value={inn} onChange={onChange} placeholder="ИНН — введите, найдём компанию" />
      {loading && <div style={{ position: "absolute", right: 12, top: 15, fontSize: 12, color: MUTED }}>…</div>}
      {open && sug && (
        <div className="animate-svcfade" style={{ position: "absolute", left: 0, right: 0, top: 46, background: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,.12)", zIndex: 40 }}>
          <button type="button" onClick={() => { onConfirm(sug); setOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: "#fff", cursor: "pointer", fontFamily: UI }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8f8")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
            <div style={{ fontSize: 15, fontWeight: 400, color: TEXT }}>{sug.name}</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>Нажмите, чтобы подставить реквизиты{sug.kpp ? ` · КПП ${sug.kpp}` : ""}</div>
          </button>
        </div>
      )}
    </div>
  );
}
function Row({ label, children, style }) {
  const narrow = useNarrow(640);
  return (
    <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "minmax(160px,220px) 1fr", gap: narrow ? 5 : 14, alignItems: narrow ? "start" : "center", marginBottom: narrow ? 13 : 10, ...style }}>
      <div style={{ fontSize: 13.5, fontWeight: 300, color: "#444", textAlign: narrow ? "left" : "right" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
      {title && <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}
function StatusBadge({ status }) {
  const map = { draft: ["Черновик", "#eee", "#555"], issued: ["Выставлен", "#e5efff", "#2b6cb0"], paid: ["Оплачен", "#e4f6e9", "#0a7d33"] };
  const [label, bg, fg] = map[status] || map.draft;
  return <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 10px", borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 600 }}>{label}</span>;
}

/* перерисовка по событию стора */
function useStoreVersion(evt) {
  const [, bump] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => { const on = () => bump(); window.addEventListener(evt, on); return () => window.removeEventListener(evt, on); }, [evt]);
}

function today() { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`; }

/* ============================ Организации ============================ */
function readFileDataUri(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function OrgEditor({ org, onSave, onClose }) {
  const [o, setO] = React.useState(() => ({ banks: [], showStamp: true, showSignature: true, ...org }));
  const set = (k, v) => setO((p) => ({ ...p, [k]: v }));
  const setBank = (i, k, v) => setO((p) => { const banks = (p.banks || []).slice(); banks[i] = { ...banks[i], [k]: v }; return { ...p, banks }; });
  const addBank = () => setO((p) => ({ ...p, banks: [...(p.banks || []), { id: `bank-${Date.now()}`, label: "", account: "", bik: "", bankName: "", corrAccount: "" }] }));
  const rmBank = (i) => setO((p) => ({ ...p, banks: (p.banks || []).filter((_, j) => j !== i) }));
  const [bikBusy, setBikBusy] = React.useState(-1);
  const fillBik = async (i) => {
    const bik = (o.banks[i] || {}).bik; setBikBusy(i);
    const r = await lookupBankByBik(bik);
    if (r) setO((p) => { const banks = p.banks.slice(); banks[i] = { ...banks[i], bankName: r.bankName || banks[i].bankName, corrAccount: r.corrAccount || banks[i].corrAccount }; return { ...p, banks }; });
    setBikBusy(-1);
  };
  const upload = async (k, file) => { if (!file) return; try { const uri = await readFileDataUri(file); set(k, uri); } catch {} };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{org && org.id ? "Организация" : "Новая организация"}</div>
        <Btn onClick={onClose}>← Назад</Btn>
      </div>
      <Row label="Краткое название"><UnderInput value={o.name} onChange={(v) => set("name", v)} placeholder='ООО "КУБ"' /></Row>
      <Row label="Полное название"><UnderInput value={o.fullName} onChange={(v) => set("fullName", v)} placeholder="Общество с ограниченной ответственностью «КУБ»" /></Row>
      <Row label="Адрес"><UnderInput value={o.address} onChange={(v) => set("address", v)} placeholder="Индекс, регион, город, улица, дом" /></Row>
      <Row label="ИНН">
        <div style={{ display: "flex", gap: 8 }}>
          <UnderInput value={o.inn} onChange={(v) => set("inn", v)} placeholder="10 или 12 цифр" />
          <Btn onClick={async () => { const r = await lookupOrgByInn(o.inn); if (r) setO((p) => ({ ...p, name: p.name || r.name, kpp: r.kpp || p.kpp, address: r.address || p.address })); }}>По ИНН</Btn>
        </div>
      </Row>
      <Row label="КПП"><UnderInput value={o.kpp} onChange={(v) => set("kpp", v)} placeholder="9 цифр" /></Row>
      <Row label="ОГРН"><UnderInput value={o.ogrn} onChange={(v) => set("ogrn", v)} /></Row>
      <Row label="Руководитель"><UnderInput value={o.director} onChange={(v) => set("director", v)} placeholder="ФИО" /></Row>
      <Row label="Главный бухгалтер"><UnderInput value={o.accountant} onChange={(v) => set("accountant", v)} placeholder="ФИО" /></Row>

      <Section title="Банковские счета">
        {(o.banks || []).map((b, i) => (
          <div key={b.id || i} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, marginBottom: 10, background: CARD }}>
            <Row label="Название (метка)"><UnderInput value={b.label} onChange={(v) => setBank(i, "label", v)} placeholder='напр. АО «ТБанк»' /></Row>
            <Row label="Расчётный счёт"><UnderInput value={b.account} onChange={(v) => setBank(i, "account", v)} placeholder="20 цифр" /></Row>
            <Row label="БИК">
              <div style={{ display: "flex", gap: 8 }}>
                <UnderInput value={b.bik} onChange={(v) => setBank(i, "bik", v)} placeholder="9 цифр" />
                <Btn onClick={() => fillBik(i)} disabled={bikBusy === i}>{bikBusy === i ? "…" : "Заполнить по БИК"}</Btn>
              </div>
            </Row>
            <Row label="Банк"><UnderInput value={b.bankName} onChange={(v) => setBank(i, "bankName", v)} placeholder="Наименование банка" /></Row>
            <Row label="Корр. счёт"><UnderInput value={b.corrAccount} onChange={(v) => setBank(i, "corrAccount", v)} placeholder="20 цифр" /></Row>
            <div style={{ textAlign: "right" }}><Btn kind="danger" onClick={() => rmBank(i)} style={{ height: 36 }}>Удалить счёт</Btn></div>
          </div>
        ))}
        <Btn onClick={addBank}>+ Добавить банковский счёт</Btn>
      </Section>

      <Section title="Печать и подписи">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[["signatureDataUri", "Подпись руководителя"], ["stampDataUri", "Печать организации"], ["logoDataUri", "Логотип (необязательно)"]].map(([k, label]) => (
            <div key={k} style={{ width: 180 }}>
              <FLabel>{label}</FLabel>
              <div style={{ height: 90, border: `1px dashed ${LINE}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", overflow: "hidden" }}>
                {o[k] ? <img src={o[k]} alt="" style={{ maxHeight: 80, maxWidth: 160 }} /> : <span style={{ color: "#bbb", fontSize: 12 }}>нет файла</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <label style={{ flex: 1, textAlign: "center", height: 34, lineHeight: "34px", border: `1px solid ${LINE}`, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  Загрузить<input type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={(e) => upload(k, e.target.files?.[0])} />
                </label>
                {o[k] && <Btn kind="danger" onClick={() => set(k, "")} style={{ height: 34, padding: "0 12px" }}>×</Btn>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 22, flexWrap: "wrap" }}>
          <Check checked={!!o.showSignature} onChange={(v) => set("showSignature", v)} label="ставить подпись по умолчанию" />
          <Check checked={!!o.showStamp} onChange={(v) => set("showStamp", v)} label="ставить печать по умолчанию" />
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>Подпись и печать (прозрачный PNG) хранятся приватно и подставляются в счёт автоматически. В публичный доступ не попадают.</div>
      </Section>

      <Section title="Шаблон Excel (необязательно)">
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>
          Загрузите ваш файл-образец счёта (.xlsx) — тогда «Скачать Excel» будет <b>один-в-один</b> с ним: шрифты, рамки и разметка сохранятся, поменяются только данные. Позиции любой длины переносятся на 2-ю и 3-ю страницу.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ height: 40, minWidth: 150, padding: "0 12px", display: "inline-flex", alignItems: "center", border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff", fontSize: 13, color: o.invoiceTemplateXlsx ? "#0a7d33" : "#bbb" }}>
            {o.invoiceTemplateXlsx ? "шаблон загружен ✓" : "шаблон не загружен"}
          </div>
          <label style={{ height: 40, lineHeight: "40px", padding: "0 14px", border: `1px solid ${LINE}`, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
            Загрузить .xlsx<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} onChange={(e) => upload("invoiceTemplateXlsx", e.target.files?.[0])} />
          </label>
          {o.invoiceTemplateXlsx && <Btn kind="danger" onClick={() => set("invoiceTemplateXlsx", "")} style={{ height: 40 }}>Убрать</Btn>}
        </div>
      </Section>

      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn kind="primary" onClick={() => onSave(o)}>Сохранить организацию</Btn>
      </div>
    </div>
  );
}
function OrgsPanel({ onBack }) {
  useStoreVersion("orgs:changed");
  const [editing, setEditing] = React.useState(null); // org | 'new' | null
  const orgs = listOrgs();
  if (editing) {
    return <OrgEditor org={editing === "new" ? {} : editing}
      onClose={() => setEditing(null)}
      onSave={(o) => { if (o.id) saveOrg(o); else addOrg(o); setEditing(null); }} />;
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Мои организации</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!orgs.length && <Btn onClick={() => setEditing({ ...KUB_ORG_SEED })}>Заполнить ООО «КУБ»</Btn>}
          <Btn kind="primary" onClick={() => setEditing("new")}>+ Организация</Btn>
        </div>
      </div>
      {!orgs.length && <div style={{ color: MUTED, fontSize: 14 }}>Пока нет организаций. Добавьте продавца — его реквизиты, банк, подпись и печать будут подставляться в счёт.</div>}
      {orgs.map((o) => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, marginBottom: 8, background: CARD }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{o.name || "—"}</div>
            <div style={{ fontSize: 12.5, color: MUTED }}>ИНН {o.inn || "—"}{o.kpp ? ` · КПП ${o.kpp}` : ""} · счетов: {(o.banks || []).length}{o.stampDataUri ? " · печать ✓" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn onClick={() => setEditing(o)} style={{ height: 36 }}>Изменить</Btn>
            <Btn kind="danger" onClick={() => { if (confirm(`Удалить «${o.name}»?`)) deleteOrg(o.id); }} style={{ height: 36 }}>Удалить</Btn>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16 }}><Btn onClick={onBack}>← К документам</Btn></div>
    </div>
  );
}

/* ============================ Контрагенты ============================ */
function CounterpartiesPanel({ onBack }) {
  useStoreVersion("counterparties:changed");
  const [edit, setEdit] = React.useState(null);
  const list = listCounterparties();
  const save = (c) => { if (c.id) saveCounterparty(c); else addCounterparty(c); setEdit(null); };
  if (edit) {
    const c = edit === "new" ? {} : edit;
    return <CPEditor cp={c} onClose={() => setEdit(null)} onSave={save} />;
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Контрагенты</div>
        <Btn kind="primary" onClick={() => setEdit("new")}>+ Контрагент</Btn>
      </div>
      {!list.length && <div style={{ color: MUTED, fontSize: 14 }}>Пока нет контрагентов. Добавьте покупателя или создавайте его прямо в счёте — он сохранится сюда.</div>}
      {list.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, marginBottom: 8, background: CARD }}>
          <div><div style={{ fontSize: 15, fontWeight: 600 }}>{c.name || "—"}</div><div style={{ fontSize: 12.5, color: MUTED }}>ИНН {c.inn || "—"}{c.kpp ? ` · КПП ${c.kpp}` : ""}</div></div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn onClick={() => setEdit(c)} style={{ height: 36 }}>Изменить</Btn>
            <Btn kind="danger" onClick={() => { if (confirm(`Удалить «${c.name}»?`)) deleteCounterparty(c.id); }} style={{ height: 36 }}>Удалить</Btn>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16 }}><Btn onClick={onBack}>← К документам</Btn></div>
    </div>
  );
}
function CPEditor({ cp, onClose, onSave }) {
  const [c, setC] = React.useState(() => ({ ...cp }));
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>{c.id ? "Контрагент" : "Новый контрагент"}</div>
      <Row label="ИНН">
        <div style={{ display: "flex", gap: 8 }}>
          <UnderInput value={c.inn} onChange={(v) => set("inn", v)} placeholder="Поиск по ИНН" />
          <Btn onClick={async () => { const r = await lookupOrgByInn(c.inn); if (r) setC((p) => ({ ...p, name: r.name || p.name, kpp: r.kpp || p.kpp, address: r.address || p.address })); }}>Найти по ИНН</Btn>
        </div>
      </Row>
      <Row label="Название / ФИО"><UnderInput value={c.name} onChange={(v) => set("name", v)} placeholder='ООО "Покупатель"' /></Row>
      <Row label="КПП"><UnderInput value={c.kpp} onChange={(v) => set("kpp", v)} /></Row>
      <Row label="Адрес"><UnderInput value={c.address} onChange={(v) => set("address", v)} /></Row>
      <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
        <Btn onClick={onClose}>Отмена</Btn>
        <Btn kind="primary" onClick={() => onSave(c)}>Сохранить</Btn>
      </div>
    </div>
  );
}

/* ============================ Форма счёта ============================ */
function emptyInvoice(orgs, docs) {
  const org = orgs[0] || null;
  const seller = org ? snapSeller(org) : {};
  const bank = org && org.banks && org.banks[0] ? snapBank(org.banks[0]) : {};
  return {
    docType: "invoice", number: nextInvoiceNumber(docs), date: today(), basis: "",
    sellerId: org ? org.id : "", seller, bank,
    buyerId: "", buyer: {}, consignee: null,
    currency: "RUB", vatMode: "included", vatRate: DEFAULT_VAT_RATE,
    items: [{ name: "", unit: "", qty: "", price: "", sum: "" }],
    opts: { code: false, discount: false, photo: false },
    message: DEFAULT_NOTICE, status: "draft",
  };
}
function snapSeller(org) {
  // Снимок только ТЕКСТА реквизитов. Печать/подпись (тяжёлые data-URI) НЕ копируем
  // в счёт — они подтягиваются из карточки организации на печать/просмотр (ниже),
  // иначе каждый счёт весил бы ~0.5 МБ.
  return { name: org.name || "", address: org.address || "", inn: org.inn || "", kpp: org.kpp || "", director: org.director || "", accountant: org.accountant || "", showSignature: org.showSignature !== false, showStamp: org.showStamp !== false };
}
function snapBank(b) { return { account: b.account || "", bik: b.bik || "", bankName: b.bankName || "", corrAccount: b.corrAccount || "" }; }
// Наложить invoice от ИИ на пустой счёт (buyer/НДС/позиции); суммы считаем сами.
function applyAiInvoice(base, ai) {
  if (!ai) return base;
  const items = (ai.items || []).map((it) => {
    const sum = Math.round(parseNum(it.qty) * parseNum(it.price) * 100) / 100;
    return { name: it.name || "", unit: it.unit || "", qty: it.qty ?? "", price: it.price ?? "", sum: sum || "", code: it.code || "" };
  });
  const hasCode = items.some((it) => it.code);
  return {
    ...base,
    basis: ai.basis || base.basis,
    vatMode: ai.vatMode || base.vatMode,
    vatRate: ai.vatRate || base.vatRate,
    buyer: { ...(base.buyer || {}), ...(ai.buyerName ? { name: ai.buyerName } : {}), ...(ai.buyerInn ? { inn: ai.buyerInn } : {}), ...(ai.buyerKpp ? { kpp: ai.buyerKpp } : {}) },
    items: items.length ? items : base.items,
    opts: { ...(base.opts || {}), code: hasCode || !!(base.opts && base.opts.code) },
  };
}

function InvoiceForm({ id, initial, onDone }) {
  const orgs = listOrgs();
  const cps = listCounterparties();
  const [doc, setDoc] = React.useState(() => {
    if (id) return getDocument(id) || emptyInvoice(orgs, listDocuments());
    const base = emptyInvoice(orgs, listDocuments());
    return initial ? applyAiInvoice(base, initial) : base;
  });
  const [preview, setPreview] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState(null);
  const fileRef = React.useRef(null);
  const [bikBusy, setBikBusy] = React.useState(false);
  const onImportItems = (imported) => {
    if (!imported || !imported.length) return;
    const hasCode = imported.some((it) => it.code);
    setDoc((p) => { const keep = p.items.filter((it) => it.name || it.price || it.qty); return { ...p, opts: hasCode ? { ...(p.opts || {}), code: true } : (p.opts || {}), items: [...keep, ...imported] }; });
  };
  const set = (k, v) => setDoc((p) => ({ ...p, [k]: v }));
  const setSeller = (k, v) => setDoc((p) => ({ ...p, seller: { ...p.seller, [k]: v } }));
  const setBank = (k, v) => setDoc((p) => ({ ...p, bank: { ...p.bank, [k]: v } }));
  const setBuyer = (k, v) => setDoc((p) => ({ ...p, buyer: { ...p.buyer, [k]: v } }));

  const totals = computeTotals(doc.items, doc.vatMode, doc.vatRate);

  // доп. функции счёта (скидка/код/фото)
  const opts = doc.opts || {};
  const setOpt = (k, v) => setDoc((p) => ({ ...p, opts: { ...(p.opts || {}), [k]: v } }));
  const itemSumD = (it) => { const base = parseNum(it.qty) * parseNum(it.price); const d = parseNum(it.discount) || 0; return Math.round(base * (1 - d / 100) * 100) / 100; };
  // Общая скидка/наценка = проставить один % во ВСЕ позиции (дальше можно поправить в строке).
  const applyGlobalDiscount = () => { const gd = parseNum(opts.globalDiscount) || 0; setDoc((p) => ({ ...p, items: p.items.map((it) => { const nit = { ...it, discount: gd }; nit.sum = itemSumD(nit); return nit; }) })); };
  // позиции
  const setItem = (i, k, v) => setDoc((p) => {
    const items = p.items.slice(); items[i] = { ...items[i], [k]: v };
    if (k === "qty" || k === "price" || k === "discount") items[i].sum = itemSumD(items[i]); // авто-сумма (со скидкой/наценкой)
    return { ...p, items };
  });
  const addItem = () => setDoc((p) => ({ ...p, items: [...p.items, { name: "", unit: "", qty: "", price: "", sum: "" }] }));
  const rmItem = (i) => setDoc((p) => ({ ...p, items: p.items.filter((_, j) => j !== i).length ? p.items.filter((_, j) => j !== i) : [{ name: "", unit: "", qty: "", price: "", sum: "" }] }));

  const pickOrg = (orgId) => {
    const org = orgs.find((o) => o.id === orgId);
    if (!org) { setDoc((p) => ({ ...p, sellerId: "", seller: {}, bank: {} })); return; }
    setDoc((p) => ({ ...p, sellerId: org.id, seller: snapSeller(org), bank: org.banks && org.banks[0] ? snapBank(org.banks[0]) : {} }));
  };
  const pickBank = (bankId) => {
    const org = orgs.find((o) => o.id === doc.sellerId);
    const b = org && (org.banks || []).find((x) => x.id === bankId);
    if (b) setBank2(snapBank(b));
  };
  const setBank2 = (bank) => setDoc((p) => ({ ...p, bank }));
  const pickBuyer = (cpId) => {
    const c = cps.find((x) => x.id === cpId);
    if (!c) { setDoc((p) => ({ ...p, buyerId: "", buyer: {} })); return; }
    setDoc((p) => ({ ...p, buyerId: c.id, buyer: { name: c.name || "", inn: c.inn || "", kpp: c.kpp || "", address: c.address || "" } }));
  };
  // Меняем ИНН покупателя → сбрасываем связанного контрагента и его поля (начинаем заново).
  const onBuyerInn = (v) => setDoc((p) => ({ ...p, buyerId: "", buyer: { inn: v } }));
  // Подтверждение компании из подсказки по ИНН (как в профиле — не автоматом).
  const confirmBuyer = (sug) => setDoc((p) => ({ ...p, buyer: { ...p.buyer, name: sug.name || "", kpp: sug.kpp || "", address: sug.address || "" } }));
  const fillBik = async () => {
    setBikBusy(true); const r = await lookupBankByBik(doc.bank.bik);
    if (r) setDoc((p) => ({ ...p, bank: { ...p.bank, bankName: r.bankName || p.bank.bankName, corrAccount: r.corrAccount || p.bank.corrAccount } }));
    setBikBusy(false);
  };

  const persist = (status) => {
    const out = { ...doc, totals, status: status || doc.status };
    // сохраняем контрагента в справочник, если его там нет и есть ИНН
    if (doc.buyer && doc.buyer.name && !doc.buyerId) {
      const created = addCounterparty({ name: doc.buyer.name, inn: doc.buyer.inn || "", kpp: doc.buyer.kpp || "", address: doc.buyer.address || "" });
      out.buyerId = created.id;
    }
    let saved;
    if (doc.id) { saved = saveDocument(out); } else { saved = addDocument(out); }
    setDoc(saved);
    return saved;
  };
  const onSave = () => { persist(); if (window.showDockToast) window.showDockToast("Счёт сохранён", 2200); };
  const onIssue = () => { const s = persist("issued"); setDoc(s); };

  // Печать/подпись подтягиваем из карточки организации (в самом счёте их не храним).
  const sellerOrg = orgs.find((o) => o.id === doc.sellerId);
  const previewDoc = { ...doc, totals, seller: { ...doc.seller, signatureDataUri: sellerOrg?.signatureDataUri || "", stampDataUri: sellerOrg?.stampDataUri || "" }, _templateXlsx: sellerOrg?.invoiceTemplateXlsx || "" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{doc.id ? `Счёт № ${doc.number}` : "Новый счёт"}</div>
        <Btn onClick={onDone}>← Реестр</Btn>
      </div>

      {!orgs.length && (
        <div style={{ padding: "14px 16px", border: "1.5px dotted #c7c7c7", borderRadius: 12, background: "#f8f8f8", marginBottom: 14, fontSize: 14, fontWeight: 300, color: "#444" }}>
          Сначала добавьте свою организацию (продавца) с реквизитами, банком и печатью — на вкладке «Мои организации».
        </div>
      )}

      <Row label="Счёт №"><div style={{ display: "flex", gap: 10 }}><UnderInput value={doc.number} onChange={(v) => set("number", v)} style={{ maxWidth: 160 }} /><div style={{ alignSelf: "center", color: MUTED, fontSize: 13.5 }}>от</div><UnderInput value={doc.date} onChange={(v) => set("date", v)} style={{ maxWidth: 140 }} /></div></Row>
      <Row label="Основание"><UnderInput value={doc.basis} onChange={(v) => set("basis", v)} placeholder="Договор №… (можно не указывать)" /></Row>

      <Section title="Продавец (исполнитель)">
        <Row label="Моя организация">
          <UnderSelect value={doc.sellerId} onChange={pickOrg} placeholder="— выбрать организацию —"
            options={orgs.map((o) => ({ value: o.id, label: `${o.name} (ИНН ${o.inn})` }))} />
        </Row>
        <Row label="Название"><UnderInput value={doc.seller.name} onChange={(v) => setSeller("name", v)} /></Row>
        <Row label="Адрес"><UnderInput value={doc.seller.address} onChange={(v) => setSeller("address", v)} /></Row>
        <Row label="ИНН / КПП"><div style={{ display: "flex", gap: 8 }}><UnderInput value={doc.seller.inn} onChange={(v) => setSeller("inn", v)} placeholder="ИНН" /><UnderInput value={doc.seller.kpp} onChange={(v) => setSeller("kpp", v)} placeholder="КПП" /></div></Row>
        <Row label="Руководитель"><UnderInput value={doc.seller.director} onChange={(v) => setSeller("director", v)} /></Row>
        <Row label="Главный бухгалтер"><UnderInput value={doc.seller.accountant} onChange={(v) => setSeller("accountant", v)} /></Row>
        <Row label="Печать / подпись">
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Check checked={!!doc.seller.showSignature} onChange={(v) => setSeller("showSignature", v)} label="подпись" />
            <Check checked={!!doc.seller.showStamp} onChange={(v) => setSeller("showStamp", v)} label="печать" />
            {!doc.seller.stampDataUri && <span style={{ color: MUTED, fontSize: 12 }}>(загрузите печать/подпись в карточке организации)</span>}
          </div>
        </Row>
      </Section>

      <Section title="Банковские реквизиты продавца">
        {(() => { const org = orgs.find((o) => o.id === doc.sellerId); const banks = (org && org.banks) || []; return banks.length > 1 ? (
          <Row label="Банковский счёт"><UnderSelect value="" onChange={pickBank} placeholder="— выбрать счёт —" options={banks.map((b) => ({ value: b.id, label: `${b.label || b.bankName} · ${b.account}` }))} /></Row>
        ) : null; })()}
        <Row label="Расчётный счёт"><UnderInput value={doc.bank.account} onChange={(v) => setBank("account", v)} placeholder="20 цифр" /></Row>
        <Row label="БИК"><div style={{ display: "flex", gap: 8 }}><UnderInput value={doc.bank.bik} onChange={(v) => setBank("bik", v)} placeholder="9 цифр" /><Btn onClick={fillBik} disabled={bikBusy}>{bikBusy ? "…" : "Заполнить по БИК"}</Btn></div></Row>
        <Row label="Банк"><UnderInput value={doc.bank.bankName} onChange={(v) => setBank("bankName", v)} /></Row>
        <Row label="Корр. счёт"><UnderInput value={doc.bank.corrAccount} onChange={(v) => setBank("corrAccount", v)} /></Row>
      </Section>

      <Section title="Покупатель (заказчик)">
        <Row label="Контрагент">
          <UnderSelect value={doc.buyerId} onChange={pickBuyer} placeholder="— выбрать / новый —"
            options={cps.map((c) => ({ value: c.id, label: `${c.name} (ИНН ${c.inn})` }))} />
        </Row>
        <Row label="ИНН"><BuyerInn inn={doc.buyer.inn} filled={!!doc.buyer.name} onChange={onBuyerInn} onConfirm={confirmBuyer} /></Row>
        <Row label="Название / ФИО"><UnderInput value={doc.buyer.name} onChange={(v) => setBuyer("name", v)} placeholder='ООО "Покупатель"' /></Row>
        <Row label="КПП"><UnderInput value={doc.buyer.kpp} onChange={(v) => setBuyer("kpp", v)} /></Row>
        <Row label="Адрес"><UnderInput value={doc.buyer.address} onChange={(v) => setBuyer("address", v)} /></Row>
      </Section>

      <Section title="Ставка НДС">
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Seg value={doc.vatMode} onChange={(v) => set("vatMode", v)} options={VAT_MODES.map((m) => ({ value: m.code, label: m.label }))} />
          {doc.vatMode !== "none" && (
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#444" }}>ставка</span>
              <UnderInput value={doc.vatRate} onChange={(v) => set("vatRate", parseNum(v))} style={{ width: 70 }} /> <span style={{ fontSize: 14 }}>%</span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Наименование товаров, работ, услуг">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Наименование</th>
              {opts.code && <th style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Код товара</th>}
              <th style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Ед. изм.</th>
              <th style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Кол-во</th>
              <th style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Цена</th>
              {opts.discount && <th style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Скидка/наценка,&nbsp;%</th>}
              <th style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>Сумма</th>
              <th style={{ border: `1px solid ${LINE}` }} />
            </tr></thead>
            <tbody>
              {doc.items.map((it, i) => (
                <tr key={i}>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4 }}><UnderInput value={it.name} onChange={(v) => setItem(i, "name", v)} style={{ boxShadow: "none", height: 38 }} /></td>
                  {opts.code && <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 100 }}><UnderInput value={it.code} onChange={(v) => setItem(i, "code", v)} style={{ boxShadow: "none", height: 38, textAlign: "center" }} /></td>}
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 80 }}><UnderInput value={it.unit} onChange={(v) => setItem(i, "unit", v)} placeholder="шт, усл" style={{ boxShadow: "none", height: 38, textAlign: "center" }} /></td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 90 }}><UnderInput value={it.qty} onChange={(v) => setItem(i, "qty", v)} style={{ boxShadow: "none", height: 38, textAlign: "center" }} /></td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 120 }}><UnderInput value={it.price} onChange={(v) => setItem(i, "price", v)} style={{ boxShadow: "none", height: 38, textAlign: "right" }} /></td>
                  {opts.discount && <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 110 }}><UnderInput value={it.discount} onChange={(v) => setItem(i, "discount", v)} placeholder="0" style={{ boxShadow: "none", height: 38, textAlign: "center" }} /></td>}
                  <td style={{ border: `1px solid ${LINE}`, padding: "0 8px", width: 130, textAlign: "right", fontSize: 13.5, fontWeight: 600 }}>{fmtMoney(it.sum != null && it.sum !== "" ? it.sum : itemSumD(it))}</td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 40, textAlign: "center" }}><button onClick={() => rmItem(i)} title="Удалить" style={{ border: "none", background: "none", color: "#c0431c", cursor: "pointer", fontSize: 18 }}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
              <PlainBtn icon={<PlusIcon size={18} />} onClick={addItem}>Добавить строку</PlainBtn>
              <PlainBtn icon={<ExcelIcon size={20} />} onClick={() => fileRef.current?.click()}>Загрузить товары из файла</PlainBtn>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { setImportFile(f); setImportOpen(true); } }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16 }}>
              <Check checked={!!opts.discount} onChange={(v) => {
                if (!v) {
                  // сняли галку — убираем скидку/наценку из позиций, цены возвращаются к полным
                  setDoc((p) => ({ ...p, opts: { ...(p.opts || {}), discount: false, _globalOpen: false, globalDiscount: "" }, items: p.items.map((it) => { const nit = { ...it, discount: "" }; nit.sum = itemSumD(nit); return nit; }) }));
                } else setOpt("discount", true);
              }} label="добавить скидку/наценку" />
              {opts.discount && (
                <div className="animate-svcfade" style={{ marginLeft: 27, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                    <Check checked={!!opts.discountPrint} onChange={(v) => setOpt("discountPrint", v)} label="печатать в документе" />
                    <span onClick={() => setOpt("_globalOpen", !opts._globalOpen)} style={{ color: "#333", fontSize: 13.5, cursor: "pointer", borderBottom: "1px dashed #999" }}>задать общую скидку/наценку</span>
                  </div>
                  {opts._globalOpen && (
                    <div className="animate-svcfade" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, color: "#444" }}>Общая</span>
                      <UnderInput value={opts.globalDiscount} onChange={(v) => setOpt("globalDiscount", v)} placeholder="0" style={{ width: 80 }} />
                      <span style={{ fontSize: 13.5 }}>%</span>
                      <Btn kind="ghost" onClick={applyGlobalDiscount} style={{ height: 34, padding: "0 14px" }}>Применить ко всем</Btn>
                    </div>
                  )}
                </div>
              )}
              <Check checked={!!opts.code} onChange={(v) => setOpt("code", v)} label="добавить «Код товара»" />
              <Check checked={!!opts.photo} onChange={(v) => setOpt("photo", v)} label="добавить «Фото товара» (скоро)" />
            </div>
          </div>
          <div style={{ width: 320, maxWidth: "100%", flexShrink: 0, display: "grid", gridTemplateColumns: "1fr auto", columnGap: 16, rowGap: 6, alignItems: "baseline" }}>
            <div style={{ textAlign: "right", fontSize: 14, color: MUTED, whiteSpace: "nowrap" }}>Итого:</div>
            <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", minWidth: 110 }}>{fmtMoney(totals.subtotal)}</div>
            <div style={{ textAlign: "right", fontSize: 14, color: MUTED, whiteSpace: "nowrap" }}>{doc.vatMode === "included" ? `В том числе НДС (${doc.vatRate}%):` : doc.vatMode === "ontop" ? `НДС (${doc.vatRate}%):` : "Без НДС:"}</div>
            <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", minWidth: 110 }}>{fmtMoney(totals.vat)}</div>
            <div style={{ textAlign: "right", fontSize: 16, borderTop: `1px solid ${LINE}`, paddingTop: 6, whiteSpace: "nowrap" }}>Всего к оплате:</div>
            <div style={{ textAlign: "right", fontSize: 16, fontWeight: 700, borderTop: `1px solid ${LINE}`, paddingTop: 6, whiteSpace: "nowrap", minWidth: 110 }}>{fmtMoney(totals.total)}</div>
          </div>
        </div>
      </Section>

      <Section title="Сообщение для клиента">
        <textarea value={doc.message} onChange={(e) => set("message", e.target.value)} rows={4}
          style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, resize: "vertical", outline: "none" }} />
      </Section>

      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn kind="primary" onClick={() => { persist(); downloadInvoiceExcel({ ...doc, totals, seller: { ...doc.seller, signatureDataUri: sellerOrg?.signatureDataUri || "", stampDataUri: sellerOrg?.stampDataUri || "" } }, sellerOrg?.invoiceTemplateXlsx); }}>Скачать Excel</Btn>
          <Btn kind="ghost" onClick={onSave}>Сохранить</Btn>
          <Btn kind="soft" onClick={onIssue}>Пометить «Выставлен»</Btn>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {preview && <InvoiceSheetModal doc={previewDoc} onClose={() => setPreview(false)} />}
      {importOpen && <ImportItemsModal file={importFile} onClose={() => { setImportOpen(false); setImportFile(null); }} onImport={onImportItems} />}
    </div>
  );
}

/* ============================ Реестр ============================ */
function Registry({ onOpen, onNew }) {
  useStoreVersion("documents:changed");
  React.useEffect(() => { hydrateDocuments(); }, []);
  const docs = listDocuments();
  const loading = isDocumentsLoading();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Счета</div>
        <Btn kind="primary" onClick={onNew}>+ Новый счёт</Btn>
      </div>
      {loading && !docs.length && <div style={{ color: MUTED, fontSize: 14 }}>Загружаем…</div>}
      {!loading && !docs.length && <div style={{ color: MUTED, fontSize: 14 }}>Счетов пока нет. Нажмите «Новый счёт».</div>}
      {docs.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
            <thead><tr>{["№", "Дата", "Покупатель", "Сумма", "Статус", ""].map((h, i) => <th key={i} style={{ textAlign: i === 3 ? "right" : "left", fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".04em", padding: "8px 10px", borderBottom: `1px solid ${LINE}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => onOpen(d.id)}>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${LINE}`, fontWeight: 600 }}>{d.number || "—"}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${LINE}`, color: "#444" }}>{d.date || "—"}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${LINE}` }}>{(d.buyer && d.buyer.name) || "—"}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${LINE}`, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtMoney(d.totals && d.totals.total)}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${LINE}` }}><StatusBadge status={d.status} /></td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${LINE}`, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { if (confirm(`Удалить счёт № ${d.number}?`)) deleteDocument(d.id); }} title="Удалить" style={{ border: "none", background: "none", color: "#d3441c", cursor: "pointer", fontSize: 18 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================ Платёжное поручение (.txt для банка) ============================ */
function PaymentOrderForm({ initial, onBack }) {
  const orgs = listOrgs();
  const cps = listCounterparties();
  const org0 = orgs[0] || null;
  const bank0 = org0 && org0.banks && org0.banks[0] ? org0.banks[0] : null;
  const [p, setP] = React.useState(() => {
    const base = {
      payerOrgId: org0 ? org0.id : "", payerBankIdx: 0,
      payerName: org0 ? org0.name : "", payerInn: org0 ? org0.inn : "", payerKpp: org0 ? org0.kpp : "",
      payerAcc: bank0 ? bank0.account : "", payerBik: bank0 ? bank0.bik : "", payerBank1: bank0 ? bank0.bankName : "", payerBank2: "", payerCorr: bank0 ? bank0.corrAccount : "",
      recvCpId: "", recvName: "", recvInn: "", recvKpp: "", recvAcc: "", recvBik: "", recvBank1: "", recvBank2: "", recvCorr: "",
      docNum: "", docDate: today(),
      sum: "", schetNum: "", schetDate: "", subject: "", vatRate: DEFAULT_VAT_RATE, purpose: "",
    };
    if (!initial) return base;
    return {
      ...base,
      recvName: initial.recvName || "", recvInn: initial.recvInn || "", recvKpp: initial.recvKpp || "",
      recvAcc: initial.recvAcc || "", recvBik: initial.recvBik || "",
      sum: initial.sum || "", schetNum: initial.schetNum || "", schetDate: initial.schetDate || "",
      subject: initial.subject || "", vatRate: initial.vatRate || DEFAULT_VAT_RATE, purpose: initial.purpose || "",
    };
  });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const [bikBusy, setBikBusy] = React.useState(false);

  // Пришли из чата с БИК получателя → подтянем банк/корсчёт.
  React.useEffect(() => {
    if (initial && String(initial.recvBik || "").replace(/\D/g, "").length === 9) {
      lookupBankByBik(initial.recvBik).then((r) => { if (r) setP((s) => ({ ...s, recvBank1: r.bankName || s.recvBank1, recvCorr: r.corrAccount || s.recvCorr })); }).catch(() => {});
    }
  }, []); // eslint-disable-line

  const pickPayerOrg = (id) => {
    const o = orgs.find((x) => x.id === id); if (!o) return set("payerOrgId", "");
    const b = (o.banks || [])[0] || null;
    setP((s) => ({ ...s, payerOrgId: id, payerBankIdx: 0, payerName: o.name || "", payerInn: o.inn || "", payerKpp: o.kpp || "", payerAcc: b ? b.account : "", payerBik: b ? b.bik : "", payerBank1: b ? b.bankName : "", payerCorr: b ? b.corrAccount : "" }));
  };
  const pickPayerBank = (idx) => {
    const o = orgs.find((x) => x.id === p.payerOrgId); const b = o && o.banks ? o.banks[Number(idx)] : null; if (!b) return;
    setP((s) => ({ ...s, payerBankIdx: Number(idx), payerAcc: b.account || "", payerBik: b.bik || "", payerBank1: b.bankName || "", payerCorr: b.corrAccount || "" }));
  };
  const pickRecvCp = (id) => {
    const c = cps.find((x) => x.id === id); if (!c) return set("recvCpId", "");
    setP((s) => ({ ...s, recvCpId: id, recvName: c.name || "", recvInn: c.inn || "", recvKpp: c.kpp || "" }));
  };
  const doRecvBik = async () => {
    if (String(p.recvBik || "").replace(/\D/g, "").length !== 9) return;
    setBikBusy(true); const r = await lookupBankByBik(p.recvBik); setBikBusy(false);
    if (r) setP((s) => ({ ...s, recvBank1: r.bankName || s.recvBank1, recvCorr: r.corrAccount || s.recvCorr }));
  };
  const download = () => {
    if (!p.recvName || !p.recvAcc || String(p.recvBik || "").replace(/\D/g, "").length !== 9) { alert("Заполните получателя: название, расчётный счёт и БИК."); return; }
    if (!parseNum(p.sum)) { alert("Укажите сумму платежа."); return; }
    if (!p.payerAcc) { alert("Выберите организацию-плательщика с расчётным счётом."); return; }
    downloadPaymentTxt(p);
  };

  const payerOrg = orgs.find((x) => x.id === p.payerOrgId);
  const purposePreview = buildPurpose(p);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Платёжное поручение</div>
        <Btn kind="primary" onClick={download}>Скачать .txt для банка</Btn>
      </div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 4, maxWidth: 640, lineHeight: 1.6 }}>
        Файл в формате 1C (Windows-1251) для загрузки в интернет-банк (Т-Бизнес и др.). Плательщик — ваша организация, получатель — из счёта поставщика.
      </div>

      <Section title="Плательщик (мы)">
        {orgs.length > 0 ? (
          <>
            <Row label="Организация">
              <UnderSelect value={p.payerOrgId} onChange={pickPayerOrg} options={orgs.map((o) => ({ value: o.id, label: `${o.name} (ИНН ${o.inn})` }))} placeholder="— выберите организацию —" />
            </Row>
            {payerOrg && (payerOrg.banks || []).length > 1 && (
              <Row label="Счёт списания">
                <UnderSelect value={String(p.payerBankIdx)} onChange={pickPayerBank} options={(payerOrg.banks || []).map((b, i) => ({ value: String(i), label: `${b.bankName || "банк"} · ${b.account || ""}` }))} />
              </Row>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13.5, color: MUTED }}>Нет организаций. Добавьте свою организацию с банковским счётом в разделе «Мои организации».</div>
        )}
        <Row label="Название"><UnderInput value={p.payerName} onChange={(v) => set("payerName", v)} /></Row>
        <Row label="ИНН / КПП">
          <div style={{ display: "flex", gap: 10 }}><UnderInput value={p.payerInn} onChange={(v) => set("payerInn", v)} placeholder="ИНН" /><UnderInput value={p.payerKpp} onChange={(v) => set("payerKpp", v)} placeholder="КПП" /></div>
        </Row>
        <Row label="Расчётный счёт"><UnderInput value={p.payerAcc} onChange={(v) => set("payerAcc", v)} /></Row>
        <Row label="БИК / банк">
          <div style={{ display: "flex", gap: 10 }}><UnderInput value={p.payerBik} onChange={(v) => set("payerBik", v)} placeholder="БИК" style={{ maxWidth: 140 }} /><UnderInput value={p.payerBank1} onChange={(v) => set("payerBank1", v)} placeholder="Банк" /></div>
        </Row>
        <Row label="Город банка"><UnderInput value={p.payerBank2} onChange={(v) => set("payerBank2", v)} placeholder="г. Москва" /></Row>
        <Row label="Корр. счёт"><UnderInput value={p.payerCorr} onChange={(v) => set("payerCorr", v)} /></Row>
      </Section>

      <Section title="Получатель (кому платим)">
        {cps.length > 0 && (
          <Row label="Из контрагентов">
            <UnderSelect value={p.recvCpId} onChange={pickRecvCp} options={cps.map((c) => ({ value: c.id, label: `${c.name} (ИНН ${c.inn})` }))} placeholder="— выбрать из справочника —" />
          </Row>
        )}
        <Row label="Название"><UnderInput value={p.recvName} onChange={(v) => set("recvName", v)} placeholder='ООО "Поставщик"' /></Row>
        <Row label="ИНН / КПП">
          <div style={{ display: "flex", gap: 10 }}><UnderInput value={p.recvInn} onChange={(v) => set("recvInn", v)} placeholder="ИНН" /><UnderInput value={p.recvKpp} onChange={(v) => set("recvKpp", v)} placeholder="КПП" /></div>
        </Row>
        <Row label="Расчётный счёт"><UnderInput value={p.recvAcc} onChange={(v) => set("recvAcc", v)} /></Row>
        <Row label="БИК банка">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <UnderInput value={p.recvBik} onChange={(v) => set("recvBik", v)} onBlur={doRecvBik} placeholder="БИК — подтянем банк" style={{ maxWidth: 180 }} />
            {bikBusy && <span style={{ fontSize: 12, color: MUTED }}>ищем…</span>}
          </div>
        </Row>
        <Row label="Банк"><UnderInput value={p.recvBank1} onChange={(v) => set("recvBank1", v)} /></Row>
        <Row label="Город банка"><UnderInput value={p.recvBank2} onChange={(v) => set("recvBank2", v)} placeholder="г. Москва" /></Row>
        <Row label="Корр. счёт"><UnderInput value={p.recvCorr} onChange={(v) => set("recvCorr", v)} /></Row>
      </Section>

      <Section title="Платёж">
        <Row label="№ / дата поручения">
          <div style={{ display: "flex", gap: 10 }}><UnderInput value={p.docNum} onChange={(v) => set("docNum", v)} placeholder="№" style={{ maxWidth: 120 }} /><UnderInput value={p.docDate} onChange={(v) => set("docDate", v)} placeholder="дд.мм.гггг" /></div>
        </Row>
        <Row label="Сумма, ₽"><UnderInput value={p.sum} onChange={(v) => set("sum", v)} placeholder="0,00" /></Row>
        <Row label="Счёт-основание">
          <div style={{ display: "flex", gap: 10 }}><UnderInput value={p.schetNum} onChange={(v) => set("schetNum", v)} placeholder="№ счёта" style={{ maxWidth: 140 }} /><UnderInput value={p.schetDate} onChange={(v) => set("schetDate", v)} placeholder="дата счёта" /></div>
        </Row>
        <Row label="За что (предмет)"><UnderInput value={p.subject} onChange={(v) => set("subject", v)} placeholder="плиту ЕВРО-ВЕНТ 80 …" /></Row>
        <Row label="Ставка НДС в т.ч., %"><UnderInput value={p.vatRate} onChange={(v) => set("vatRate", v)} placeholder="22" style={{ maxWidth: 100 }} /></Row>
        <Row label="Назначение платежа" style={{ alignItems: "start" }}>
          <div>
            <textarea value={p.purpose} onChange={(e) => set("purpose", e.target.value)} rows={3}
              placeholder={purposePreview}
              style={{ width: "100%", resize: "vertical", minHeight: 66, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, outline: "none", lineHeight: 1.5 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <button type="button" onClick={() => set("purpose", purposePreview)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 12.5, color: "#333", borderBottom: "1px dashed #999", padding: 0 }}>Собрать из полей выше</button>
              <span style={{ fontSize: 12, color: MUTED }}>если оставить пустым — соберётся автоматически</span>
            </div>
          </div>
        </Row>
      </Section>

      <div style={{ marginTop: 18 }}>
        <Btn kind="primary" onClick={download}>Скачать .txt для банка</Btn>
      </div>
    </div>
  );
}

/* ============================ Блоки-разделы (как в «Администраторе») ============================ */
const DIcon = {
  plus: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></svg>),
  bill: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h9l3 3v16l-2.4-1.4L13.2 21l-2.4-1.4L8.4 21 6 19.6V2z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>),
  org: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V5l7-2v18M19 21V9l-7-2M8 8h.01M8 12h.01M8 16h.01" /></svg>),
  cp: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18.5 20c0-2.2-1-3.7-2.6-4.6" /></svg>),
  act: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 12.5l2.5 2.5L16 9" /></svg>),
  upd: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h8M12 8v8" /></svg>),
  offer: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h6M9 16h5M13 11c1.3 0 2.2.7 2.2 1.6S14.3 14.2 13 14.2 10.8 13.5 10.8 12.6" /></svg>),
  pay: (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>),
};
function DocsCard({ icon, title, sub, onClick, locked }) {
  if (locked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, padding: 30, background: "#eee", minHeight: 123, opacity: 0.5 }}>
        <span style={{ color: "#bbb", display: "inline-flex" }}>{icon}</span>
        <div style={{ marginTop: "auto", paddingTop: 28 }}>
          <div style={{ fontSize: 14, lineHeight: "19.6px", fontWeight: 600, color: "#9a9a9a" }}>{title}</div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: "19.6px", fontWeight: 300, color: "#b0b0b0" }}>Скоро</div>
        </div>
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick}
      style={{ textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", border: "none", borderRadius: 12, padding: 30, background: "#e9e9e9", minHeight: 123, transition: "background-color .18s ease, box-shadow .18s ease, transform .18s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#e9e9e9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <span style={{ color: TEXT, display: "inline-flex" }}>{icon}</span>
      <div style={{ marginTop: "auto", paddingTop: 28 }}>
        <div style={{ fontSize: 14, lineHeight: "19.6px", fontWeight: 600, color: "#222" }}>{title}</div>
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: "19.6px", fontWeight: 300, color: "#222" }}>{sub}</div>
      </div>
    </button>
  );
}
function DocsLauncher({ go }) {
  useStoreVersion("documents:changed");
  const cnt = listDocuments().length;
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Разделы</div>
      <div style={{ marginTop: 16, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))" }}>
        <DocsCard icon={DIcon.plus} title="Новый счёт" sub="Создать счёт на оплату" onClick={() => go("form")} />
        <DocsCard icon={DIcon.bill} title="Счета" sub={cnt ? `Выставлено счетов: ${cnt}` : "Реестр выставленных счетов"} onClick={() => go("list")} />
        <DocsCard icon={DIcon.org} title="Мои организации" sub="Реквизиты, банк, подпись и печать" onClick={() => go("orgs")} />
        <DocsCard icon={DIcon.cp} title="Контрагенты" sub="Покупатели и заказчики" onClick={() => go("cps")} />
        <DocsCard icon={DIcon.pay} title="Платёжное поручение" sub="Счёт → .txt для банка (Т-Бизнес)" onClick={() => go("pay")} />
        <DocsCard icon={DIcon.act} title="Акт выполненных работ" locked />
        <DocsCard icon={DIcon.upd} title="УПД" locked />
        <DocsCard icon={DIcon.offer} title="Коммерческое предложение" locked />
      </div>
    </div>
  );
}

/* ============================ Помощник по документам (YandexGPT Lite) ============================ */
// Сжать картинку в JPEG-base64 (для OCR): ужимаем до 1600px, чтобы уложиться в лимит.
async function imageToJpegB64(file, maxDim = 1600, quality = 0.72) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  return c.toDataURL("image/jpeg", quality).split(",")[1];
}
// Прочитать файл (напр. PDF) в base64 без изменения — для OCR как есть.
async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = ""; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}
// Краткая сводка по объекту (ТОЛЬКО чтение) — для ответа ИИ по фактам.
// org/orgInn — юр.лицо заказчика (подтянуто из аккаунта, т.к. в объекте хранится ФИО).
function objBrief(o, org, orgInn) {
  const lbl = (list, code) => { try { return labelOf(list, code) || code || "—"; } catch { return code || "—"; } };
  const stages = (o.stages || []).map((s) => `  - ${s.title}: ${lbl(STAGE_STATUSES, s.status)} (${s.progress || 0}%)${s.id === o.currentStageId ? " ← текущий" : ""}`).join("\n");
  const docs = (o.documents || []).map((d) => `  - [${d.category || "Прочее"}] ${d.title || d.file || "документ"} (${d.type || ""}${d.status ? ", " + d.status : ""})`).join("\n");
  const now = o.now || {};
  const innForInv = String(o.inn || orgInn || "").replace(/\D/g, "");
  let invLine = "Счетов этому заказчику не найдено";
  try {
    if (innForInv) {
      const invs = listDocuments().filter((d) => d.buyer && String(d.buyer.inn || "").replace(/\D/g, "") === innForInv);
      if (invs.length) invLine = `Счета этому заказчику (${invs.length}): ` + invs.map((d) => `№${d.number || "—"} на ${fmtMoney(d.totals && d.totals.total)} [${d.status || "черновик"}]`).join("; ");
    }
  } catch {}
  return [
    `Объект: ${o.title || "—"} (№ ${o.id})`,
    `Контактное лицо заказчика: ${o.customerName || "—"}`,
    org ? `Заказчик (юр.лицо): ${org}${orgInn ? ", ИНН " + orgInn : (o.inn ? ", ИНН " + o.inn : "")}` : (o.inn ? `ИНН заказчика: ${o.inn}` : null),
    `Адрес: ${o.address || o.city || "—"}`,
    o.contractNumber ? `Договор №: ${o.contractNumber}` : null,
    `Статус: ${lbl(OBJECT_STATUSES, o.status)}, прогресс ${o.progress || 0}%`,
    now.doingNow ? `Сейчас: ${now.doingNow}` : null,
    now.nextStep ? `Дальше: ${now.nextStep}` : null,
    now.customerNeeds ? `От заказчика нужно: ${now.customerNeeds}` : null,
    stages ? `Этапы:\n${stages}` : null,
    docs ? `Документы объекта:\n${docs}` : "Документы объекта: нет",
    invLine,
  ].filter(Boolean).join("\n");
}
async function summarizeObjects(query) {
  const all = listObjects();
  if (!all.length) return "В системе нет объектов (или не загрузились).";
  // Подтягиваем аккаунты, чтобы связать объект (ФИО-контакт) с юр.лицом заказчика (org).
  let accounts = [];
  try { accounts = (await listAccounts()) || []; } catch {}
  const byId = new Map(), byEmail = new Map();
  accounts.forEach((a) => { if (a && a.id) byId.set(String(a.id), a); if (a && a.email) byEmail.set(String(a.email).toLowerCase(), a); });
  const acctOf = (o) => (o.customerId && byId.get(String(o.customerId))) || (o.customerEmail && byEmail.get(String(o.customerEmail).toLowerCase())) || null;
  const orgOf = (o) => { const a = acctOf(o); return (a && a.org) || o.customerOrg || ""; };
  const innOf = (o) => { const a = acctOf(o); return String((a && a.inn) || o.inn || "").replace(/\D/g, ""); };

  const q = String(query || "").toLowerCase().trim();
  const matches = q ? all.filter((o) => [o.title, o.customerName, orgOf(o), innOf(o), o.id, o.city, o.address, o.contractNumber].some((v) => String(v || "").toLowerCase().includes(q))) : [];
  if (!matches.length) return "Точного совпадения не нашёл. Есть объекты: " + all.slice(0, 12).map((o) => { const org = orgOf(o); return `${o.title}${org ? " — " + org : (o.customerName ? " — " + o.customerName : "")}`; }).join("; ");
  return matches.slice(0, 4).map((o) => objBrief(o, orgOf(o), innOf(o))).join("\n\n———\n\n");
}
// Нормализация названия компании (без ООО/АО/кавычек) для проверки совпадения из реестра.
function nameKey(s) {
  return String(s || "").toUpperCase().replace(/[«»"'().,]/g, "").replace(/\b(ООО|АО|ПАО|ЗАО|ИП|НАО|ОАО)\b/g, "").replace(/\s+/g, "").trim();
}
// Совпадает ли кандидат из реестра с тем, что просил пользователь (защита от случайных попаданий).
function looseMatch(candidate, query) {
  if (/^\d{10,12}$/.test(String(query || "").replace(/\D/g, ""))) return true; // запрос по ИНН — доверяем
  const c = nameKey(candidate), q = nameKey(query);
  if (!c || !q) return false;
  if (q.length <= 4) return c.includes(q);        // короткая аббревиатура — строгое включение
  return c.includes(q) || q.includes(c);
}
// Постепенное «печатание» текста ответа (по несколько символов за тик).
function TypeText({ text, animate, onStep }) {
  const full = String(text || "");
  const [n, setN] = React.useState(animate ? 0 : full.length);
  React.useEffect(() => {
    if (!animate) { setN(full.length); return; }
    setN(0);
    let i = 0; const step = Math.max(2, Math.round(full.length / 55));
    const id = setInterval(() => { i += step; setN(i >= full.length ? full.length : i); if (onStep) onStep(); if (i >= full.length) clearInterval(id); }, 22);
    return () => clearInterval(id);
  }, [full, animate]);
  return <>{full.slice(0, n)}{n < full.length ? <span style={{ opacity: 0.35 }}>▋</span> : null}</>;
}
const CHAT_LS = "cube:docs:chat:v1";
const CHAT_GREETING = { role: "ai", text: "Привет! Я Техас, помощник КУБ по документам. Могу собрать счёт или платёжку, добавить контрагента, заглянуть в объекты. Пришлите позиции текстом, прикрепите Excel, скан/фото или PDF счёта (скрепка слева) — и напишите, что нужно. Можно и просто спросить." };
function loadChat() {
  try { const s = JSON.parse(localStorage.getItem(CHAT_LS) || "null"); if (s && Array.isArray(s.msgs) && s.msgs.length) return s; } catch {}
  return null;
}
function DocsAssistant({ onInvoice, onPayment }) {
  const [saved] = React.useState(loadChat); // читаем сохранённую переписку один раз
  const [msgs, setMsgs] = React.useState(saved ? saved.msgs : [CHAT_GREETING]);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [pending, setPending] = React.useState(null); // прикреплённый, но не отправленный файл/скан
  const draftRef = React.useRef(saved ? saved.draft || null : null); // последний собранный счёт (для правок «поменяй цену…»)
  const scrollRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const narrow = useNarrow(560);
  const scrollToBottom = () => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; };
  React.useEffect(() => { scrollToBottom(); }, [msgs, busy]);
  // Сохраняем переписку + черновик, чтобы не терялись при переходе по вкладкам/разделам.
  React.useEffect(() => { try { localStorage.setItem(CHAT_LS, JSON.stringify({ msgs: msgs.map((m) => ({ ...m, anim: false })), draft: draftRef.current })); } catch {} }, [msgs]);
  const clearChat = () => { draftRef.current = null; setMsgs([CHAT_GREETING]); try { localStorage.removeItem(CHAT_LS); } catch {} };

  // Общая отправка истории на бэкенд (текст / файл / скан-картинка).
  const ask = async (history, image) => {
    setMsgs(history);
    setBusy(true);
    try {
      const res = await askAssistant(history.map((m) => ({ role: m.role, text: m.text })), draftRef.current, image);
      // Чтение объекта: подгружаем данные из системы и переспрашиваем модель (без показа служебного сообщения).
      if (res.action && res.action.type === "read_object" && res.action.query) {
        const summary = await summarizeObjects(res.action.query);
        const res2 = await askAssistant([...history, { role: "user", text: `OBJECT_DATA (данные из системы, отвечай строго по ним, не выдумывай):\n${summary}` }].map((m) => ({ role: m.role, text: m.text })), draftRef.current);
        setMsgs((m) => [...m, { role: "ai", anim: true, text: res2.reply || summary, invoice: res2.invoice || null, payment: res2.payment || null }]);
        return;
      }
      let inv = res.invoice || null;
      let pay = res.payment || null;
      let cpCand = null;
      let note = "";
      // Счёт: обогащаем покупателя из реестра (DaData) — только при совпадении по названию.
      if (inv && inv.buyerName && !inv.buyerInn) {
        try {
          const top = (await suggestParty(inv.buyerName)).find((s) => s.inn && looseMatch(s.name, inv.buyerName));
          if (top) { inv = { ...inv, buyerName: top.name || inv.buyerName, buyerInn: top.inn, buyerKpp: top.kpp || "" }; note = `\n\nНашёл в реестре: ${top.name}, ИНН ${top.inn}. Подставил покупателя — поправьте, если не тот.`; }
        } catch {}
      }
      // Платёжка: обогащаем получателя из реестра.
      if (pay && pay.recvName && !pay.recvInn) {
        try { const top = (await suggestParty(pay.recvName)).find((s) => s.inn && looseMatch(s.name, pay.recvName)); if (top) pay = { ...pay, recvName: top.name || pay.recvName, recvInn: top.inn, recvKpp: top.kpp || "" }; } catch {}
      }
      // Добавить контрагента: берём кандидата, совпавшего по названию/ИНН; иначе честно скажем.
      if (res.action && res.action.type === "add_counterparty" && res.action.query) {
        try {
          const list = await suggestParty(res.action.query);
          cpCand = (list || []).find((s) => s.inn && looseMatch(s.name, res.action.query)) || null;
          if (!cpCand) note = `\n\nНе нашёл точного совпадения по «${res.action.query}» в реестре. Уточните полное название или пришлите ИНН.`;
        } catch {}
      }
      if (inv) draftRef.current = inv;
      setMsgs((m) => [...m, { role: "ai", anim: true, text: (res.reply || (inv ? "Счёт собран." : pay ? "Платёжное поручение готово." : "Готово.")) + note, invoice: inv, payment: pay, cpCand }]);
    } catch (e) {
      const code = (e && (e.status || e.code)) || "";
      setMsgs((m) => [...m, { role: "ai", stub: true, text: code === 403 ? "Нет доступа к помощнику." : "Не удалось связаться с помощником. Попробуйте ещё раз чуть позже." }]);
    } finally { setBusy(false); }
  };

  const send = async () => {
    if (busy) return;
    const t = text.trim();
    if (!t && !pending) return;
    const p = pending;
    setText(""); setPending(null);
    if (p && p.kind === "image") {
      const display = (t ? t + "\n" : "") + `📷 ${p.name}`;
      await ask([...msgs, { role: "user", text: t || "Распознай счёт со скана и собери счёт по нему.", display }], { mime: p.mime, data: p.data });
      return;
    }
    if (p && p.kind === "file") {
      const display = (t ? t + "\n" : "") + `📎 ${p.name}`;
      const aiText = (t ? t + "\n\n" : "") + `Данные из файла «${p.name}» (CSV, первая строка может быть заголовком):\n${p.table}`;
      await ask([...msgs, { role: "user", text: aiText, display }]);
      return;
    }
    await ask([...msgs, { role: "user", text: t }]);
  };

  // Прикрепить файл: НЕ отправляем сразу — держим «прикреплённым», ждём комментарий.
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]; if (e.target) e.target.value = ""; if (!f || busy) return;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    const isPdf = ext === "pdf" || (f.type || "") === "application/pdf";
    const isImg = (f.type || "").startsWith("image/") || ["png", "jpg", "jpeg", "webp", "heic"].includes(ext);
    if (isPdf) {
      if (f.size > 2 * 1024 * 1024) { setMsgs((m) => [...m, { role: "ai", stub: true, text: "PDF великоват (>2 МБ). Пришлите покороче или отдельными страницами." }]); return; }
      try { const data = await fileToBase64(f); setPending({ kind: "image", name: f.name, mime: "application/pdf", data }); }
      catch { setMsgs((m) => [...m, { role: "ai", stub: true, text: "Не смог прочитать PDF. Пришлите JPG/PNG или Excel." }]); }
      return;
    }
    if (isImg) {
      try { const data = await imageToJpegB64(f); setPending({ kind: "image", name: f.name, mime: "image/jpeg", data }); }
      catch { setMsgs((m) => [...m, { role: "ai", stub: true, text: "Не смог открыть изображение. Пришлите фото/скан в JPG или PNG." }]); }
      return;
    }
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setMsgs((m) => [...m, { role: "ai", stub: true, text: "Пришлите Excel/CSV с позициями, фото/скан или PDF счёта, либо впишите позиции текстом." }]);
      return;
    }
    let table = "";
    try {
      if (ext === "csv") table = await f.text();
      else { const buf = await f.arrayBuffer(); const wb = XLSX.read(buf, { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]]; table = XLSX.utils.sheet_to_csv(ws); }
    } catch { setMsgs((m) => [...m, { role: "ai", stub: true, text: "Не смог прочитать файл. Проверьте, что это Excel или CSV." }]); return; }
    table = table.split("\n").slice(0, 80).join("\n").slice(0, 6000).trim();
    if (!table) { setMsgs((m) => [...m, { role: "ai", stub: true, text: "Файл пустой — не нашёл в нём данных." }]); return; }
    setPending({ kind: "file", name: f.name, table });
  };

  return (
    <div style={{ marginTop: 22, border: "1px solid #ececec", borderRadius: 16, background: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,.05)", overflow: "hidden" }}>
      <style>{`
        @keyframes cubeBlink { 0%,80%,100%{opacity:.2;transform:translateY(0)} 40%{opacity:1;transform:translateY(-2px)} }
        .cube-typing{display:inline-flex;align-items:center;gap:4px}
        .cube-typing span{width:7px;height:7px;border-radius:50%;background:#b0b0b0;display:inline-block;animation:cubeBlink 1.2s infinite ease-in-out}
        .cube-typing span:nth-child(2){animation-delay:.18s}
        .cube-typing span:nth-child(3){animation-delay:.36s}
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: narrow ? "11px 13px" : "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "#111", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-4 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: TEXT }}>Помощник по документам</div>
          {!narrow && <div style={{ fontSize: 12, color: MUTED }}>Соберёт счёт из ваших позиций и поправит его по просьбе</div>}
        </div>
        {msgs.length > 1 && (
          <button type="button" onClick={clearChat} title="Очистить переписку"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: MUTED, fontSize: 12.5, padding: "2px 4px", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)} onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>Очистить</button>
        )}
        <span style={{ fontSize: 11.5, color: "#8a8a8a", border: "1px solid #e6e6e6", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>YandexGPT&nbsp;Lite</span>
      </div>
      <div ref={scrollRef} style={{ height: narrow ? 240 : 200, overflowY: "auto", padding: narrow ? "13px 13px" : "16px 18px", display: "flex", flexDirection: "column", gap: 10, background: "#fafafa" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: narrow ? "90%" : "80%" }}>
            <div style={{ padding: "10px 14px", borderRadius: 14, fontSize: 14, fontWeight: 300, lineHeight: 1.5,
              background: m.role === "user" ? "#111" : "#fff",
              color: m.role === "user" ? "#fff" : (m.stub ? "#8a8a8a" : TEXT),
              border: m.role === "user" ? "none" : "1px solid #ececec", whiteSpace: "pre-wrap",
              borderBottomRightRadius: m.role === "user" ? 4 : 14, borderBottomLeftRadius: m.role === "user" ? 14 : 4 }}>{m.role === "ai" && !m.stub ? <TypeText text={m.text} animate={!!m.anim} onStep={scrollToBottom} /> : (m.display || m.text)}</div>
            {m.invoice && m.invoice.items && m.invoice.items.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Btn kind="primary" onClick={() => onInvoice(m.invoice)} style={{ height: 38 }}>
                  Открыть счёт · позиций: {m.invoice.items.length}
                </Btn>
              </div>
            )}
            {m.payment && (
              <div style={{ marginTop: 8 }}>
                <Btn kind="primary" onClick={() => onPayment(m.payment)} style={{ height: 38 }}>Открыть платёжное поручение</Btn>
              </div>
            )}
            {m.cpCand && m.cpCand.inn && (
              <div style={{ marginTop: 8 }}>
                {m.cpAdded ? (
                  <span style={{ fontSize: 13, color: "#2f7d4f" }}>✓ Добавлен в контрагенты: {m.cpCand.name}</span>
                ) : (
                  <Btn kind="primary" onClick={() => { addCounterparty({ name: m.cpCand.name, inn: m.cpCand.inn, kpp: m.cpCand.kpp || "", address: m.cpCand.address || "" }); setMsgs((prev) => prev.map((x, xi) => xi === i ? { ...x, cpAdded: true } : x)); }} style={{ height: 38 }}>
                    Добавить: {m.cpCand.name} (ИНН {m.cpCand.inn})
                  </Btn>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: "flex-start", maxWidth: narrow ? "90%" : "80%" }}>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "#fff", border: "1px solid #ececec", borderBottomLeftRadius: 4, display: "inline-flex", alignItems: "center" }}>
              <span className="cube-typing"><span /><span /><span /></span>
            </div>
          </div>
        )}
      </div>
      {pending && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 14px 0", padding: "8px 12px", background: "#f4f4f4", border: "1px solid #e6e6e6", borderRadius: 10, fontSize: 13, color: "#333" }}>
          <span style={{ flexShrink: 0 }}>{pending.kind === "image" ? "📷" : "📎"}</span>
          <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{pending.name}</span>
          <span style={{ flex: 1, minWidth: 0, color: MUTED, fontSize: 12 }}>прикреплено — добавьте комментарий и отправьте</span>
          <button type="button" onClick={() => setPending(null)} title="Убрать" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#888", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: narrow ? 8 : 10, padding: narrow ? "10px 12px" : "12px 14px", borderTop: pending ? "none" : "1px solid #f0f0f0" }}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,image/*,application/pdf,.pdf" style={{ display: "none" }} onChange={onFile} />
        <button type="button" title="Прикрепить Excel/CSV или скан счёта" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
          onMouseEnter={(e) => { if (busy) return; e.currentTarget.style.background = "#f4f4f4"; e.currentTarget.style.borderColor = "#cfcfcf"; e.currentTarget.style.color = "#111"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e6e6e6"; e.currentTarget.style.color = "#555"; e.currentTarget.style.transform = "none"; }}
          style={{ height: 44, width: 44, flexShrink: 0, display: "grid", placeItems: "center", border: "1px solid #e6e6e6", borderRadius: 12, background: "#fff", cursor: busy ? "default" : "pointer", color: "#555", opacity: busy ? 0.6 : 1, transition: "background-color .15s ease, border-color .15s ease, color .15s ease, transform .15s ease" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" /></svg>
        </button>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} disabled={busy}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={pending ? (narrow ? "Комментарий к файлу…" : "Добавьте комментарий к файлу (напр.: только монтаж, покупатель — ТСС Ноябрьск)…") : (narrow ? "Сообщение или файл…" : "Напишите позиции, прикрепите Excel/скан — «сделай счёт»…")}
          style={{ flex: 1, resize: "none", maxHeight: 120, minHeight: 44, border: "1px solid #e6e6e6", borderRadius: 12, padding: "11px 14px", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, outline: "none", lineHeight: 1.5, opacity: busy ? 0.6 : 1 }} />
        <Btn kind="primary" onClick={send} disabled={(!text.trim() && !pending) || busy} style={{ height: 44, width: 44, padding: 0, borderRadius: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </Btn>
      </div>
    </div>
  );
}

/* ============================ Корневой раздел ============================ */
export default function DocumentsSection() {
  const [view, setView] = React.useState({ name: "home", id: null });
  React.useEffect(() => { hydrateDocuments(); hydrateOrgs(); hydrateCounterparties(); try { hydrateObjects(); } catch {} }, []);
  const go = (name, id = null) => setView({ name, id });

  const BackLink = () => (
    <button type="button" onClick={() => go("home")}
      style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400, color: MUTED, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
      onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }} onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      Все документы
    </button>
  );

  return (
    <div className="animate-svcfade" style={{ fontFamily: UI, marginTop: 8, maxWidth: 980 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Документы</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777", maxWidth: 680, lineHeight: 1.6 }}>
        Выставление счетов, печать и PDF. Реквизиты организаций и контрагентов хранятся в справочниках и подставляются в документ.
      </div>

      {view.name === "home" && (<><DocsAssistant onInvoice={(inv) => setView({ name: "form", id: null, draft: inv })} onPayment={(p) => setView({ name: "pay", payment: p })} /><DocsLauncher go={go} /></>)}

      {view.name === "list" && (<div style={{ marginTop: 22 }}><BackLink /><div style={{ marginTop: 16 }} /><Registry onOpen={(id) => go("form", id)} onNew={() => go("form", null)} /></div>)}
      {view.name === "form" && (<div style={{ marginTop: 22 }}><InvoiceForm key={view.id || (view.draft ? "ai" : "new")} id={view.id} initial={view.draft} onDone={() => go("list")} /></div>)}
      {view.name === "orgs" && (<div style={{ marginTop: 22 }}><OrgsPanel onBack={() => go("home")} /></div>)}
      {view.name === "cps" && (<div style={{ marginTop: 22 }}><CounterpartiesPanel onBack={() => go("home")} /></div>)}
      {view.name === "pay" && (<div style={{ marginTop: 22 }}><BackLink /><div style={{ marginTop: 16 }} /><PaymentOrderForm key={view.payment ? "ai" : "new"} initial={view.payment} onBack={() => go("home")} /></div>)}
    </div>
  );
}
