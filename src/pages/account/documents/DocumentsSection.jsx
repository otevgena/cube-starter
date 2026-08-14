// src/pages/account/documents/DocumentsSection.jsx
// Раздел «Документы»: реестр счетов + форма счёта (стиль КУБ) + справочники
// «Мои организации» (с подписью/печатью) и «Контрагенты». Данные — src/data/documents.js.
import React from "react";
import {
  listDocuments, getDocument, addDocument, saveDocument, deleteDocument, hydrateDocuments, isDocumentsLoading,
  listOrgs, addOrg, saveOrg, deleteOrg, hydrateOrgs,
  listCounterparties, addCounterparty, saveCounterparty, deleteCounterparty, hydrateCounterparties,
  lookupOrgByInn, lookupBankByBik,
  KUB_ORG_SEED, VAT_MODES, DEFAULT_VAT_RATE, computeTotals, fmtMoney, parseNum, itemSum, nextInvoiceNumber,
} from "@/data/documents.js";
import { InvoiceSheetModal } from "@/components/documents/InvoiceSheet.jsx";

/* ============================ стиль ============================ */
const UI = "'Inter Tight',Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const TEXT = "#111", MUTED = "#8a8a8a", CARROT = "#F1571F", LINE = "#e6e6e6", CARD = "#fafafa";

const DEFAULT_NOTICE = "Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.";

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
function UnderSelect({ value, onChange, children, style, disabled }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled}
      style={{ height: 44, width: "100%", border: 0, borderRadius: 0, background: disabled ? "#f6f6f6" : "#fff", padding: "0 10px", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, outline: "none", boxShadow: `inset 0 -1px 0 0 ${LINE}`, cursor: "pointer", ...style }}>
      {children}
    </select>
  );
}
function Btn({ children, onClick, kind = "ghost", style, disabled, type = "button" }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 10, fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1, transition: "background .15s ease, border-color .15s ease", whiteSpace: "nowrap" };
  const kinds = {
    primary: { background: "#1c1c1c", color: "#fff", border: "1px solid #1c1c1c" },
    accent: { background: CARROT, color: "#fff", border: `1px solid ${CARROT}` },
    ghost: { background: "#fff", color: TEXT, border: `1px solid ${LINE}` },
    danger: { background: "#fff", color: "#d3441c", border: "1px solid #f0cfc4" },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}
function Row({ label, children, style }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(160px,220px) 1fr", gap: 14, alignItems: "center", marginBottom: 10, ...style }}>
      <div style={{ fontSize: 13.5, fontWeight: 300, color: "#444", textAlign: "right" }}>{label}</div>
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
        <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
          <label style={{ fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}><input type="checkbox" checked={!!o.showSignature} onChange={(e) => set("showSignature", e.target.checked)} /> ставить подпись по умолчанию</label>
          <label style={{ fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}><input type="checkbox" checked={!!o.showStamp} onChange={(e) => set("showStamp", e.target.checked)} /> ставить печать по умолчанию</label>
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>Подпись и печать (прозрачный PNG) хранятся приватно и подставляются в счёт автоматически. В публичный доступ не попадают.</div>
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

function InvoiceForm({ id, onDone }) {
  const orgs = listOrgs();
  const cps = listCounterparties();
  const [doc, setDoc] = React.useState(() => (id ? (getDocument(id) || emptyInvoice(orgs, listDocuments())) : emptyInvoice(orgs, listDocuments())));
  const [preview, setPreview] = React.useState(false);
  const [bikBusy, setBikBusy] = React.useState(false);
  const set = (k, v) => setDoc((p) => ({ ...p, [k]: v }));
  const setSeller = (k, v) => setDoc((p) => ({ ...p, seller: { ...p.seller, [k]: v } }));
  const setBank = (k, v) => setDoc((p) => ({ ...p, bank: { ...p.bank, [k]: v } }));
  const setBuyer = (k, v) => setDoc((p) => ({ ...p, buyer: { ...p.buyer, [k]: v } }));

  const totals = computeTotals(doc.items, doc.vatMode, doc.vatRate);

  // позиции
  const setItem = (i, k, v) => setDoc((p) => {
    const items = p.items.slice(); items[i] = { ...items[i], [k]: v };
    if (k === "qty" || k === "price") items[i].sum = itemSum(items[i]); // авто-сумма
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
  const findBuyerByInn = async () => {
    const r = await lookupOrgByInn(doc.buyer.inn);
    if (r) setDoc((p) => ({ ...p, buyer: { ...p.buyer, name: r.name || p.buyer.name, kpp: r.kpp || p.buyer.kpp, address: r.address || p.buyer.address } }));
  };
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
  const previewDoc = { ...doc, totals, seller: { ...doc.seller, signatureDataUri: sellerOrg?.signatureDataUri || "", stampDataUri: sellerOrg?.stampDataUri || "" } };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{doc.id ? `Счёт № ${doc.number}` : "Новый счёт"}</div>
        <Btn onClick={onDone}>← Реестр</Btn>
      </div>

      {!orgs.length && (
        <div style={{ padding: 14, border: `1px solid ${CARROT}`, borderRadius: 10, background: "#fff6f2", marginBottom: 14, fontSize: 14 }}>
          Сначала добавьте свою организацию (продавца) с реквизитами, банком и печатью — на вкладке «Мои организации».
        </div>
      )}

      <Row label="Счёт №"><div style={{ display: "flex", gap: 10 }}><UnderInput value={doc.number} onChange={(v) => set("number", v)} style={{ maxWidth: 160 }} /><div style={{ alignSelf: "center", color: MUTED, fontSize: 13.5 }}>от</div><UnderInput value={doc.date} onChange={(v) => set("date", v)} style={{ maxWidth: 140 }} /></div></Row>
      <Row label="Основание"><UnderInput value={doc.basis} onChange={(v) => set("basis", v)} placeholder="Договор №… (можно не указывать)" /></Row>

      <Section title="Продавец (исполнитель)">
        <Row label="Моя организация">
          <UnderSelect value={doc.sellerId} onChange={pickOrg}>
            <option value="">— выбрать организацию —</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} (ИНН {o.inn})</option>)}
          </UnderSelect>
        </Row>
        <Row label="Название"><UnderInput value={doc.seller.name} onChange={(v) => setSeller("name", v)} /></Row>
        <Row label="Адрес"><UnderInput value={doc.seller.address} onChange={(v) => setSeller("address", v)} /></Row>
        <Row label="ИНН / КПП"><div style={{ display: "flex", gap: 8 }}><UnderInput value={doc.seller.inn} onChange={(v) => setSeller("inn", v)} placeholder="ИНН" /><UnderInput value={doc.seller.kpp} onChange={(v) => setSeller("kpp", v)} placeholder="КПП" /></div></Row>
        <Row label="Руководитель"><UnderInput value={doc.seller.director} onChange={(v) => setSeller("director", v)} /></Row>
        <Row label="Главный бухгалтер"><UnderInput value={doc.seller.accountant} onChange={(v) => setSeller("accountant", v)} /></Row>
        <Row label="Печать / подпись">
          <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 13.5 }}>
            <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={!!doc.seller.showSignature} onChange={(e) => setSeller("showSignature", e.target.checked)} /> подпись</label>
            <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={!!doc.seller.showStamp} onChange={(e) => setSeller("showStamp", e.target.checked)} /> печать</label>
            {!doc.seller.stampDataUri && <span style={{ color: MUTED, fontSize: 12 }}>(загрузите печать/подпись в карточке организации)</span>}
          </div>
        </Row>
      </Section>

      <Section title="Банковские реквизиты продавца">
        {(() => { const org = orgs.find((o) => o.id === doc.sellerId); const banks = (org && org.banks) || []; return banks.length > 1 ? (
          <Row label="Банковский счёт"><UnderSelect value="" onChange={pickBank}><option value="">— выбрать счёт —</option>{banks.map((b) => <option key={b.id} value={b.id}>{b.label || b.bankName} · {b.account}</option>)}</UnderSelect></Row>
        ) : null; })()}
        <Row label="Расчётный счёт"><UnderInput value={doc.bank.account} onChange={(v) => setBank("account", v)} placeholder="20 цифр" /></Row>
        <Row label="БИК"><div style={{ display: "flex", gap: 8 }}><UnderInput value={doc.bank.bik} onChange={(v) => setBank("bik", v)} placeholder="9 цифр" /><Btn onClick={fillBik} disabled={bikBusy}>{bikBusy ? "…" : "Заполнить по БИК"}</Btn></div></Row>
        <Row label="Банк"><UnderInput value={doc.bank.bankName} onChange={(v) => setBank("bankName", v)} /></Row>
        <Row label="Корр. счёт"><UnderInput value={doc.bank.corrAccount} onChange={(v) => setBank("corrAccount", v)} /></Row>
      </Section>

      <Section title="Покупатель (заказчик)">
        <Row label="Контрагент">
          <UnderSelect value={doc.buyerId} onChange={pickBuyer}>
            <option value="">— выбрать / новый —</option>
            {cps.map((c) => <option key={c.id} value={c.id}>{c.name} (ИНН {c.inn})</option>)}
          </UnderSelect>
        </Row>
        <Row label="ИНН"><div style={{ display: "flex", gap: 8 }}><UnderInput value={doc.buyer.inn} onChange={(v) => setBuyer("inn", v)} placeholder="Поиск по ИНН" /><Btn onClick={findBuyerByInn}>Найти по ИНН</Btn></div></Row>
        <Row label="Название / ФИО"><UnderInput value={doc.buyer.name} onChange={(v) => setBuyer("name", v)} placeholder='ООО "Покупатель"' /></Row>
        <Row label="КПП"><UnderInput value={doc.buyer.kpp} onChange={(v) => setBuyer("kpp", v)} /></Row>
        <Row label="Адрес"><UnderInput value={doc.buyer.address} onChange={(v) => setBuyer("address", v)} /></Row>
      </Section>

      <Section title="Ставка НДС">
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {VAT_MODES.map((m) => (
            <label key={m.code} style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 14 }}>
              <input type="radio" name="vatmode" checked={doc.vatMode === m.code} onChange={() => set("vatMode", m.code)} /> {m.label}
            </label>
          ))}
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
              {["Наименование", "Ед. изм.", "Кол-во", "Цена", "Сумма", ""].map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "center", fontSize: 12.5, fontWeight: 600, padding: "8px 8px", border: `1px solid ${LINE}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {doc.items.map((it, i) => (
                <tr key={i}>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4 }}><UnderInput value={it.name} onChange={(v) => setItem(i, "name", v)} style={{ boxShadow: "none", height: 38 }} /></td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 80 }}><UnderInput value={it.unit} onChange={(v) => setItem(i, "unit", v)} placeholder="шт, усл" style={{ boxShadow: "none", height: 38, textAlign: "center" }} /></td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 90 }}><UnderInput value={it.qty} onChange={(v) => setItem(i, "qty", v)} style={{ boxShadow: "none", height: 38, textAlign: "center" }} /></td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 120 }}><UnderInput value={it.price} onChange={(v) => setItem(i, "price", v)} style={{ boxShadow: "none", height: 38, textAlign: "right" }} /></td>
                  <td style={{ border: `1px solid ${LINE}`, padding: "0 8px", width: 130, textAlign: "right", fontSize: 13.5, fontWeight: 600 }}>{fmtMoney(it.sum || itemSum(it))}</td>
                  <td style={{ border: `1px solid ${LINE}`, padding: 4, width: 40, textAlign: "center" }}><button onClick={() => rmItem(i)} title="Удалить" style={{ border: "none", background: "none", color: "#d3441c", cursor: "pointer", fontSize: 18 }}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, flexWrap: "wrap", gap: 12 }}>
          <Btn onClick={addItem}>+ Добавить строку</Btn>
          <div style={{ minWidth: 260, textAlign: "right" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}><span style={{ color: MUTED }}>Итого:</span><b>{fmtMoney(totals.subtotal)}</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}><span style={{ color: MUTED }}>{doc.vatMode === "included" ? `В том числе НДС (${doc.vatRate}%):` : doc.vatMode === "ontop" ? `НДС (${doc.vatRate}%):` : "Без НДС:"}</span><b>{fmtMoney(totals.vat)}</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, borderTop: `1px solid ${LINE}`, paddingTop: 6 }}><span>Всего к оплате:</span><b>{fmtMoney(totals.total)}</b></div>
          </div>
        </div>
      </Section>

      <Section title="Сообщение для клиента">
        <textarea value={doc.message} onChange={(e) => set("message", e.target.value)} rows={4}
          style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, resize: "vertical", outline: "none" }} />
      </Section>

      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn kind="primary" onClick={onSave}>Сохранить</Btn>
          <Btn kind="accent" onClick={() => { persist(); setPreview(true); }}>Просмотр / печать</Btn>
          <Btn onClick={onIssue}>Пометить «Выставлен»</Btn>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {preview && <InvoiceSheetModal doc={previewDoc} onClose={() => setPreview(false)} />}
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

/* ============================ Корневой раздел ============================ */
export default function DocumentsSection() {
  const [view, setView] = React.useState({ name: "list", id: null });
  React.useEffect(() => { hydrateDocuments(); hydrateOrgs(); hydrateCounterparties(); }, []);

  const tabBtn = (name, label) => (
    <button onClick={() => setView({ name, id: null })}
      style={{ height: 38, padding: "0 16px", borderRadius: 999, border: `1px solid ${view.name === name ? "#1c1c1c" : LINE}`, background: view.name === name ? "#1c1c1c" : "#fff", color: view.name === name ? "#fff" : TEXT, fontFamily: UI, fontSize: 13.5, cursor: "pointer" }}>
      {label}
    </button>
  );

  return (
    <div className="animate-svcfade" style={{ fontFamily: UI, marginTop: 8, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginRight: 8 }}>Документы</div>
        {tabBtn("list", "Счета")}
        {tabBtn("orgs", "Мои организации")}
        {tabBtn("cps", "Контрагенты")}
      </div>

      {view.name === "list" && <Registry onOpen={(id) => setView({ name: "form", id })} onNew={() => setView({ name: "form", id: null })} />}
      {view.name === "form" && <InvoiceForm id={view.id} onDone={() => setView({ name: "list", id: null })} />}
      {view.name === "orgs" && <OrgsPanel onBack={() => setView({ name: "list", id: null })} />}
      {view.name === "cps" && <CounterpartiesPanel onBack={() => setView({ name: "list", id: null })} />}
    </div>
  );
}
