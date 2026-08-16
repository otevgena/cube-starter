// src/components/documents/InvoiceSheet.jsx
// Печатный бланк «Счёт на оплату» (формат 1С/банковский) — один-в-один с образцом
// заказчика: банковский блок в рамке, Исполнитель/Заказчик/Основание, таблица
// позиций, Итого/НДС/Всего, сумма прописью, подписи + печать (data-URI).
//
// Экспорт:
//   <InvoiceSheetModal doc={...} onClose={...} /> — превью + док (Печать / Скачать PDF)
//   printInvoice(doc)         — системный диалог печати
//   downloadInvoicePdf(doc)   — скачать готовый PDF (html2canvas + jsPDF)
import React from "react";
import { createPortal } from "react-dom";
import { fmtMoney, rublesInWords, computeTotals, DEFAULT_VAT_RATE } from "@/data/documents.js";
import { downloadInvoiceExcel } from "@/components/documents/InvoiceExcel.js";

const INK = "#000";
const LINE = "#000";
const FONT = "Arial,'Helvetica Neue',Helvetica,sans-serif";
const DOCK_FONT = "'Inter Tight',Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
function parseDate(s) {
  const str = String(s || "").trim();
  let m = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return { d: +m[1], mo: +m[2], y: +m[3] };
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { d: +m[3], mo: +m[2], y: +m[1] };
  const dt = new Date();
  return { d: dt.getDate(), mo: dt.getMonth() + 1, y: dt.getFullYear() };
}
function dateWordsRu(s) { const { d, mo, y } = parseDate(s); return `${d} ${MONTHS[mo - 1]} ${y}`; }
function dateDotsRu(s) { const { d, mo, y } = parseDate(s); const p = (n) => String(n).padStart(2, "0"); return `${p(d)}.${p(mo)}.${y}`; }
// "41 198 рублей 50 копеек" — цифрами число, словами валюта.
function _pluralRub(n) { const a = n % 10, b = n % 100; if (a === 1 && b !== 11) return "рубль"; if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "рубля"; return "рублей"; }
function _pluralKop(n) { const a = n % 10, b = n % 100; if (a === 1 && b !== 11) return "копейка"; if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "копейки"; return "копеек"; }
function rublesKop(n) {
  const total = Math.round((Number(n) || 0) * 100);
  const rub = Math.floor(total / 100), kop = total % 100;
  const grp = String(rub).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grp} ${_pluralRub(rub)} ${String(kop).padStart(2, "0")} ${_pluralKop(kop)}`;
}

// Строка реквизитов «Название, ИНН X, КПП Y, адрес».
function partyLine(p = {}) {
  const bits = [];
  if (p.name) bits.push(esc(p.name));
  if (p.inn) bits.push(`ИНН ${esc(p.inn)}`);
  if (p.kpp) bits.push(`КПП ${esc(p.kpp)}`);
  if (p.address) bits.push(esc(p.address));
  return bits.join(", ");
}

/* ---- Банковский блок (рамка) ---- */
function bankBlock(d) {
  const s = d.seller || {};
  const b = d.bank || {};
  const cell = `border:1px solid ${LINE};padding:2px 5px;font-size:11px;font-family:${FONT};vertical-align:top;`;
  const lab = `font-size:8.5px;color:#333;`;
  return `<table style="border-collapse:collapse;width:100%;margin-top:2px;">
    <tr>
      <td colspan="2" rowspan="2" style="${cell}width:62%;">
        <div style="min-height:24px;">${esc(b.bankName || "")}</div>
        <div style="${lab}">Банк получателя</div>
      </td>
      <td style="${cell}width:11%;">БИК</td>
      <td style="${cell}">${esc(b.bik || "")}</td>
    </tr>
    <tr>
      <td style="${cell}">Сч. №</td>
      <td style="${cell}">${esc(b.corrAccount || "")}</td>
    </tr>
    <tr>
      <td style="${cell}width:31%;">ИНН ${esc(s.inn || "")}</td>
      <td style="${cell}width:31%;">КПП ${esc(s.kpp || "")}</td>
      <td style="${cell}" rowspan="2">Сч. №</td>
      <td style="${cell}" rowspan="2">${esc(b.account || "")}</td>
    </tr>
    <tr>
      <td colspan="2" style="${cell}">
        <div style="min-height:22px;">${esc(s.name || "")}</div>
        <div style="${lab}">Получатель</div>
      </td>
    </tr>
  </table>`;
}

/* ---- строка «метка: значение» (Исполнитель/Заказчик/Основание) ---- */
function metaRow(label, value) {
  return `<tr>
    <td style="width:96px;padding:3px 0;vertical-align:top;font-size:11px;font-family:${FONT};">${label}</td>
    <td style="padding:3px 6px;vertical-align:top;font-size:11px;font-weight:700;font-family:${FONT};">${value}</td>
  </tr>`;
}

/* ---- таблица позиций ---- */
function itemsTable(d) {
  const items = Array.isArray(d.items) ? d.items : [];
  const th = `border:1px solid ${LINE};padding:3px 5px;font-size:10.5px;font-weight:700;background:#f0f0f0;text-align:center;font-family:${FONT};`;
  const td = `border:1px solid ${LINE};padding:3px 5px;font-size:11px;font-family:${FONT};vertical-align:top;`;
  const rows = items.map((it, i) => {
    const sum = it.sum != null && it.sum !== "" ? Number(it.sum) : (Number(it.qty) || 0) * (Number(it.price) || 0);
    return `<tr>
      <td style="${td}text-align:center;">${i + 1}</td>
      <td style="${td}">${esc(it.name || "")}</td>
      <td style="${td}text-align:center;white-space:nowrap;">${esc(String(it.qty ?? ""))}</td>
      <td style="${td}text-align:center;white-space:nowrap;">${esc(it.unit || "")}</td>
      <td style="${td}text-align:right;white-space:nowrap;">${fmtMoney(it.price)}</td>
      <td style="${td}text-align:right;white-space:nowrap;">${fmtMoney(sum)}</td>
    </tr>`;
  }).join("");
  return `<table style="border-collapse:collapse;width:100%;margin-top:6px;">
    <tr>
      <td style="${th}width:26px;">№</td>
      <td style="${th}">Наименование услуг</td>
      <td style="${th}width:66px;">Коли-<br>чество</td>
      <td style="${th}width:56px;">Ед. изм.</td>
      <td style="${th}width:96px;">Цена</td>
      <td style="${th}width:104px;">Сумма</td>
    </tr>
    ${rows || `<tr><td style="${td}text-align:center;">1</td><td style="${td}">&nbsp;</td><td style="${td}"></td><td style="${td}"></td><td style="${td}"></td><td style="${td}"></td></tr>`}
  </table>`;
}

/* ---- итоги ---- */
function totalsBlock(d, t) {
  const rate = Number(d.vatRate ?? DEFAULT_VAT_RATE);
  const row = (label, value, bold) => `<tr>
    <td style="text-align:right;padding:2px 8px;font-size:11.5px;font-family:${FONT};font-weight:${bold ? 700 : 400};">${label}</td>
    <td style="text-align:right;padding:2px 0;font-size:11.5px;font-family:${FONT};font-weight:700;white-space:nowrap;min-width:110px;">${value}</td>
  </tr>`;
  let mid = "";
  if (d.vatMode === "included") mid = row(`В том числе НДС (${rate}%):`, fmtMoney(t.vat));
  else if (d.vatMode === "ontop") mid = row(`Сумма НДС (${rate}%):`, fmtMoney(t.vat));
  else mid = row(`Без налога (НДС)`, "—");
  return `<table style="border-collapse:collapse;margin-top:6px;margin-left:auto;">
    ${row("Итого:", fmtMoney(t.subtotal), true)}
    ${mid}
    ${row("Всего к оплате:", fmtMoney(t.total), true)}
  </table>`;
}

/* ---- подписи + печать ---- */
function signBlock(d) {
  const s = d.seller || {};
  const sig = s.showSignature && s.signatureDataUri
    ? `<img src="${s.signatureDataUri}" alt="" style="position:absolute;left:40px;bottom:2px;height:42px;pointer-events:none;" />` : "";
  const stamp = s.showStamp && s.stampDataUri
    ? `<img src="${s.stampDataUri}" alt="" style="position:absolute;left:150px;bottom:-26px;height:120px;opacity:.92;pointer-events:none;" />` : "";
  const line = `border-bottom:1px solid ${LINE};`;
  const rowStyle = `display:flex;align-items:flex-end;gap:10px;font-size:11px;font-family:${FONT};`;
  return `<div style="margin-top:26px;position:relative;">
    ${stamp}
    <div style="${rowStyle}position:relative;">
      <div style="width:130px;">Руководитель</div>
      <div style="position:relative;flex:1;height:34px;">${sig}<div style="position:absolute;left:0;right:0;bottom:0;${line}"></div></div>
      <div style="width:220px;text-align:left;padding-left:8px;">${esc(s.director || "")}</div>
    </div>
    <div style="${rowStyle}margin-top:20px;">
      <div style="width:130px;">Главный бухгалтер</div>
      <div style="position:relative;flex:1;height:20px;"><div style="position:absolute;left:0;right:0;bottom:0;${line}"></div></div>
      <div style="width:220px;text-align:left;padding-left:8px;">${esc(s.accountant || "")}</div>
    </div>
  </div>`;
}

// Собирает HTML одной A4-страницы счёта.
export function buildInvoiceHTML(d = {}) {
  const t = d.totals && d.totals.total != null ? d.totals : computeTotals(d.items, d.vatMode, d.vatRate);
  const rate = Number(d.vatRate ?? DEFAULT_VAT_RATE);
  const n = (d.items || []).length || 1;
  // Сумма прописью: total + «в том числе НДС …» (если НДС есть).
  let words = rublesInWords(t.total);
  if (d.vatMode !== "none" && t.vat > 0) {
    const vw = rublesInWords(t.vat); words += `, в том числе НДС (${rate}%) ${vw.charAt(0).toLowerCase()}${vw.slice(1)}`;
  } else { words += ", без налога (НДС)"; }

  const notice = d.message
    ? `<div style="font-size:9px;line-height:1.35;color:#000;margin-bottom:6px;font-family:${FONT};">${esc(d.message)}</div>` : "";
  const consignee = d.consignee && d.consignee.name
    ? metaRow("Грузополучатель:", partyLine(d.consignee)) : "";

  const body = `
    ${notice}
    ${bankBlock(d)}
    <div style="text-align:center;font-size:15px;font-weight:700;margin:12px 0 2px;font-family:${FONT};">
      Счет на оплату № ${esc(d.number || "")} от ${esc(dateWordsRu(d.date))} г.
    </div>
    <div style="border-bottom:2px solid ${LINE};margin:4px 0 8px;"></div>
    <table style="border-collapse:collapse;width:100%;">
      ${metaRow("Исполнитель:", partyLine(d.seller))}
      ${metaRow("Заказчик:", partyLine(d.buyer))}
      ${consignee}
      ${metaRow("Основание:", esc(d.basis || ""))}
    </table>
    ${itemsTable(d)}
    ${totalsBlock(d, t)}
    <div style="margin-top:8px;font-size:11px;font-family:${FONT};">Всего наименований ${n}, на сумму ${fmtMoney(t.total)} руб.</div>
    <div style="margin-top:2px;font-size:11.5px;font-weight:700;font-family:${FONT};border-bottom:1px solid ${LINE};padding-bottom:6px;">${words}.</div>
    ${signBlock(d)}
    <div style="border-top:1px solid ${LINE};margin-top:26px;padding-top:4px;font-size:9px;color:#333;font-family:${FONT};">
      Счет на оплату № ${esc(d.number || "")} от ${esc(dateDotsRu(d.date))}&nbsp;&nbsp;&nbsp;страница 1 из 1
    </div>`;

  return `<div class="cube-invoice" style="width:794px;min-height:1122px;box-sizing:border-box;padding:40px 44px;background:#fff;color:${INK};font-family:${FONT};">${body}</div>`;
}

/* ---- печать ---- */
export function printInvoice(d = {}) {
  const html = buildInvoiceHTML(d);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Счёт № ${esc(d.number || "")}</title>
    <style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}.cube-invoice{margin:0 auto}</style></head>
    <body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch {} }, 350);
}

/* ---- PDF ---- */
async function buildInvoicePdf(d = {}) {
  const [{ default: html2canvas }, jspdf] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const JsPDF = jspdf.jsPDF || jspdf.default;
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;z-index:-1;background:#fff;";
  holder.innerHTML = buildInvoiceHTML(d);
  document.body.appendChild(holder);
  const node = holder.querySelector(".cube-invoice");
  const imgs = node ? Array.from(node.querySelectorAll("img")) : [];
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((res) => { im.onload = res; im.onerror = res; }))));
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const img = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "JPEG", 0, 0, pw, ph, undefined, "FAST");
    return pdf;
  } finally { document.body.removeChild(holder); }
}
export async function downloadInvoicePdf(d = {}) {
  const pdf = await buildInvoicePdf(d);
  pdf.save(`Счет № ${(d.number || "").toString().replace(/[^\w-]/g, "") || "б-н"}.pdf`);
}

/* ---- превью-модалка ---- */
const SHEET_W = 794;
function usePhone() {
  const [phone, setPhone] = React.useState(typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(max-width: 640px)").matches : false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 640px)"); const on = (e) => setPhone(e.matches);
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on); };
  }, []);
  return phone;
}

export function InvoiceSheetModal({ doc = {}, onClose }) {
  const phone = usePhone();
  const sheetRef = React.useRef(null);
  const [box, setBox] = React.useState({ scale: 1, h: 0 });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("has-modal");
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; document.body.classList.remove("has-modal"); };
  }, [onClose]);

  React.useLayoutEffect(() => {
    const compute = () => {
      const avail = (typeof window !== "undefined" ? window.innerWidth : SHEET_W) - (phone ? 16 : 40);
      const scale = Math.min(1, avail / SHEET_W);
      const innerH = sheetRef.current ? sheetRef.current.offsetHeight : 1122;
      setBox({ scale, h: innerH * scale });
    };
    compute(); window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [phone]);

  const html = buildInvoiceHTML(doc);
  const save = async () => { if (saving) return; setSaving(true); try { await downloadInvoicePdf(doc); } catch (e) { try { window.showDockToast?.("Не удалось сохранить PDF", 3000, "error"); } catch {} } setSaving(false); };

  const pill = { display: "inline-flex", alignItems: "center", justifyContent: "center", height: phone ? 44 : 48, padding: phone ? "0 16px" : "0 22px", borderRadius: 8, background: "#3E3E3E", border: "1px solid rgba(255,255,255,.12)", color: "#e8e8e8", fontSize: 13, fontWeight: 300, whiteSpace: "nowrap", cursor: "pointer" };
  const tile = { display: "grid", placeItems: "center", width: phone ? 52 : 60, height: phone ? 52 : 60, borderRadius: 8, background: "#1B1B1B", border: "1px solid rgba(255,255,255,.06)", color: "#e9e9e9", cursor: "pointer", fontSize: phone ? 22 : 26 };

  return createPortal(
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column", alignItems: "center", overflow: "auto", padding: phone ? "14px 8px 96px" : "28px 12px 108px" }}>
      <div style={{ width: SHEET_W * box.scale, height: box.h || undefined, position: "relative", flexShrink: 0 }}>
        <div ref={sheetRef}
          style={{ position: "absolute", top: 0, left: 0, width: SHEET_W, transform: `scale(${box.scale})`, transformOrigin: "top left", boxShadow: "0 24px 60px rgba(0,0,0,.4)", background: "#fff" }}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div style={{ position: "fixed", left: "50%", bottom: phone ? 12 : 21, transform: "translateX(-50%)", zIndex: 210, display: "flex", alignItems: "center", gap: 6, padding: 6, borderRadius: 12, background: "rgba(69,69,69,.58)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", boxShadow: "0 12px 40px rgba(0,0,0,.45)", fontFamily: DOCK_FONT }}>
        <button type="button" title="Закрыть" onClick={onClose} style={tile}>с.</button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, height: phone ? 52 : 60, padding: "6px 10px", borderRadius: 10, background: "#3E3E3E" }}>
          <button type="button" onClick={save} style={{ ...pill, opacity: saving ? 0.7 : 1 }}>{saving ? "Готовим…" : "Скачать PDF"}</button>
          <button type="button" onClick={() => downloadInvoiceExcel(doc)} style={pill}>Excel</button>
          <button type="button" onClick={() => printInvoice(doc)} style={pill}>Печать</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default InvoiceSheetModal;
