// src/components/documents/InvoiceExcel.js
// Выгрузка счёта в Excel ХИРУРГИЧЕСКИ на базе шаблона schet2 (однострочные позиции,
// высота строки по длине названия, авто-разбивка на страницы). Меняем ТОЛЬКО
// значения ячеек в xl/worksheets/sheet1.xml через JSZip (+ печать-титул в
// workbook.xml). styles.xml не трогаем → Excel открывает без «восстановления».
// Много позиций: генерим строки от 15-й, высота по тексту, итоги/подписи ниже,
// печать: fit по ширине + перенос по высоте + повтор шапки таблицы + «страница X из Y».
import JSZip from "jszip"; // статически (не await import) — иначе на давно открытой вкладке после деплоя ленивый чанк ловит 404
import { computeTotals, rublesInWords, fmtMoney, parseNum, DEFAULT_VAT_RATE } from "@/data/documents.js";
import { INVOICE_TEMPLATE_B64 } from "@/data/invoiceTemplateB64.js";

/* ---------- формат ---------- */
const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
function pd(s) { let m = String(s || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/); if (m) return { d: +m[1], mo: +m[2], y: +m[3] }; m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return { d: +m[3], mo: +m[2], y: +m[1] }; const t = new Date(); return { d: t.getDate(), mo: t.getMonth() + 1, y: t.getFullYear() }; }
const dWords = (s) => { const { d, mo, y } = pd(s); return `${d} ${MON[mo - 1]} ${y}`; };
const partyLine = (p = {}) => { const b = []; if (p.name) b.push(p.name); if (p.inn) b.push(`ИНН ${p.inn}`); if (p.kpp) b.push(`КПП ${p.kpp}`); if (p.address) b.push(p.address); return b.join(", "); };
const _pl = (n, f) => { const a = n % 10, b = n % 100; if (a === 1 && b !== 11) return f[0]; if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return f[1]; return f[2]; };
function rublesKop(n) { const tot = Math.round((Number(n) || 0) * 100); const rub = Math.floor(tot / 100), kop = tot % 100; return `${String(rub).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${_pl(rub, ["рубль", "рубля", "рублей"])} ${String(kop).padStart(2, "0")} ${_pl(kop, ["копейка", "копейки", "копеек"])}`; }
function wordsLine(doc, t) { const rate = Number(doc.vatRate ?? DEFAULT_VAT_RATE); let w = rublesInWords(t.total); if (doc.vatMode !== "none" && t.vat > 0) { const vw = rublesInWords(t.vat); w += `, в том числе НДС(${rate}%) ${vw.charAt(0).toLowerCase()}${vw.slice(1)}`; } else w += ", без налога (НДС)"; return w + "."; }

/* ---------- XML-хирургия ---------- */
const escXml = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function setCell(xml, ref, text) {
  const re = new RegExp('<c r="' + ref + '"([^>]*?)(?:/>|>[\\s\\S]*?</c>)');
  const m = xml.match(re); if (!m) return xml;
  const s = (m[1].match(/s="(\d+)"/) || [])[1]; const sAttr = s != null ? ' s="' + s + '"' : "";
  const repl = (text === "" || text == null) ? '<c r="' + ref + '"' + sAttr + "/>" : '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is><t xml:space="preserve">' + escXml(text) + "</t></is></c>";
  return xml.slice(0, m.index) + repl + xml.slice(m.index + m[0].length);
}
const renumber = (rowXml, oldR, newR) => rowXml.replace(new RegExp('<row r="' + oldR + '"'), '<row r="' + newR + '"').replace(new RegExp('(r="[A-Z]+)' + oldR + '"', "g"), "$1" + newR + '"');
const setHt = (rowXml, h) => rowXml.replace(/\sht="[^"]*"/, ' ht="' + h + '"').replace(/<row (?![^>]*customHeight)([^>]*)>/, '<row $1 customHeight="1">');
const mMax = (r) => Math.max(...r.match(/\d+/g).map(Number));
const mMin = (r) => Math.min(...r.match(/\d+/g).map(Number));
const shiftRef = (ref, d) => ref.replace(/([A-Z]+)(\d+)/g, (_, c, n) => c + (Number(n) + d));
// высота строки позиции по длине названия (Arial 8, колонка C:K ≈ 47 симв/строку): 13 / 22 / 31 …
const itemHt = (name) => { const lines = Math.max(1, Math.ceil(String(name || "").length / 47)); return lines <= 1 ? 13 : 13 + (lines - 1) * 9; };

const ITEM = 15, B0 = 49, B1 = 57; // schet2: позиции с 15-й строки; блок итогов/подписей 49–57
function buildSheet(sheetXml, doc) {
  const items = (doc.items && doc.items.length) ? doc.items : [{}];
  const N = items.length;
  const t = doc.totals && doc.totals.total != null ? doc.totals : computeTotals(items, doc.vatMode, doc.vatRate);
  const rate = Number(doc.vatRate ?? DEFAULT_VAT_RATE);
  const s = doc.seller || {}, bank = doc.bank || {};

  const sd = sheetXml.match(/(<sheetData[^>]*>)([\s\S]*?)(<\/sheetData>)/);
  const head = sheetXml.slice(0, sd.index) + sd[1];
  const tail = sd[3] + sheetXml.slice(sd.index + sd[0].length);
  const rows = {};
  for (const m of sd[2].matchAll(/<row r="(\d+)"[^>]*>[\s\S]*?<\/row>|<row r="(\d+)"[^>]*\/>/g)) rows[+(m[1] || m[2])] = m[0];

  const out = [];
  for (let r = 1; r <= 14; r++) {
    if (r === 13 && doc.basis && rows[12]) out.push(renumber(rows[12], 12, 13)); // Основание — по стилю строки Покупателя
    else if (rows[r]) out.push(rows[r]);
  }
  for (let i = 0; i < N; i++) { const r = ITEM + i; out.push(setHt(renumber(rows[ITEM], ITEM, r), itemHt(items[i].name))); }
  const bb = ITEM + N;
  for (let r = B0; r <= B1; r++) if (rows[r]) out.push(renumber(rows[r], r, r + (bb - B0)));
  let sheet = head + out.join("") + tail;

  const orig = [...sheetXml.matchAll(/<mergeCell ref="([^"]+)"/g)].map((m) => m[1]);
  const merges = orig.filter((m) => mMax(m) <= 14);
  if (doc.basis) merges.push("A13:E13", "F13:R13"); // Основание
  for (let i = 0; i < N; i++) { const r = ITEM + i; merges.push(`A${r}:B${r}`, `C${r}:K${r}`, `L${r}:M${r}`, `N${r}:O${r}`, `Q${r}:R${r}`); }
  for (const m of orig.filter((x) => mMin(x) >= B0 && mMax(x) <= B1)) merges.push(shiftRef(m, bb - B0));
  sheet = sheet.replace(/<mergeCells[\s\S]*?<\/mergeCells>/, `<mergeCells count="${merges.length}">` + merges.map((m) => `<mergeCell ref="${m}"/>`).join("") + `</mergeCells>`);

  const set = (ref, v) => { sheet = setCell(sheet, ref, v); };
  set("A2", bank.bankName); set("O2", bank.bik); set("O3", bank.corrAccount);
  set("D5", s.inn); set("I5", s.kpp); set("O5", bank.account); set("A6", s.name);
  set("A8", `Счет на оплату № ${doc.number || ""} от ${dWords(doc.date)} г.`);
  set("F10", partyLine(s)); set("F12", partyLine(doc.buyer));
  if (doc.basis) { set("A13", "Основание:"); set("F13", doc.basis); }
  for (let i = 0; i < N; i++) {
    const r = ITEM + i, it = items[i];
    const sum = it.sum != null && it.sum !== "" ? parseNum(it.sum) : parseNum(it.qty) * parseNum(it.price);
    set(`A${r}`, String(i + 1)); set(`C${r}`, it.name || ""); set(`L${r}`, it.qty != null && it.qty !== "" ? String(it.qty) : "");
    set(`N${r}`, it.unit || ""); set(`P${r}`, fmtMoney(parseNum(it.price))); set(`Q${r}`, fmtMoney(sum));
  }
  const B = (rel) => bb + rel;
  set(`Q${B(0)}`, fmtMoney(t.subtotal));
  set(`A${B(1)}`, doc.vatMode === "included" ? `В том числе НДС (${rate}%):` : doc.vatMode === "ontop" ? `Сумма НДС (${rate}%):` : "Без налога (НДС)");
  set(`Q${B(1)}`, doc.vatMode === "none" ? "-" : fmtMoney(t.vat));
  set(`Q${B(2)}`, fmtMoney(t.total));
  set(`A${B(3)}`, `Всего наименований ${N}, на сумму ${rublesKop(t.total)}`);
  set(`A${B(4)}`, wordsLine(doc, t));
  set(`K${B(6)}`, s.director || ""); set(`K${B(8)}`, s.accountant || "");

  // печать: fit по ширине, перенос по высоте (fitToHeight=0), повтор шапки (стр.14), «страница X из Y»
  sheet = sheet.replace(/<pageSetup[^>]*\/?>/, '<pageSetup paperSize="9" scale="100" orientation="portrait" fitToWidth="1" fitToHeight="0"/>');
  if (/<headerFooter/.test(sheet)) sheet = sheet.replace(/<headerFooter[\s\S]*?<\/headerFooter>/, '<headerFooter><oddFooter>&amp;C&amp;8страница &amp;P из &amp;N</oddFooter></headerFooter>');
  else sheet = sheet.replace(/(<pageSetup[^>]*\/>)/, '$1<headerFooter><oddFooter>&amp;C&amp;8страница &amp;P из &amp;N</oddFooter></headerFooter>');
  if (/<pageSetUpPr/.test(sheet)) sheet = sheet.replace(/<pageSetUpPr[^>]*\/>/, '<pageSetUpPr fitToPage="1"/>');
  else if (/<\/sheetPr>/.test(sheet)) sheet = sheet.replace("</sheetPr>", '<pageSetUpPr fitToPage="1"/></sheetPr>'); // pageSetUpPr идёт ПОСЛЕ outlinePr (порядок OOXML)
  else if (/<sheetPr[^>]*\/>/.test(sheet)) sheet = sheet.replace(/<sheetPr([^>]*)\/>/, '<sheetPr$1><pageSetUpPr fitToPage="1"/></sheetPr>');
  else sheet = sheet.replace(/(<dimension)/, '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>$1');
  return sheet;
}
function setPrintTitles(wbXml) {
  const dn = '<definedName name="_xlnm.Print_Titles" localSheetId="0">schet!$14:$14</definedName>';
  if (/_xlnm\.Print_Titles/.test(wbXml)) return wbXml.replace(/<definedName name="_xlnm\.Print_Titles"[^>]*>[\s\S]*?<\/definedName>/, dn);
  if (/<definedNames>/.test(wbXml)) return wbXml.replace("<definedNames>", "<definedNames>" + dn);
  return wbXml.replace(/(<\/sheets>)/, "$1<definedNames>" + dn + "</definedNames>");
}

/* ---------- печать/подпись как ВСТРОЕННЫЕ картинки (schet2 уже несёт пустой drawing) ---------- */
const EMU = 9525; // 1px
const anchorXml = (col, row, colOff, rowOff, cx, cy, rId, id, name) =>
  `<xdr:oneCellAnchor><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>${colOff}</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>${rowOff}</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="${name}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
// размеры PNG из заголовка IHDR (ширина@16, высота@20, big-endian)
function pngSize(b64) {
  try { const bin = atob(b64.slice(0, 48)); const rd = (o) => (((bin.charCodeAt(o) << 24) | (bin.charCodeAt(o + 1) << 16) | (bin.charCodeAt(o + 2) << 8) | bin.charCodeAt(o + 3)) >>> 0); const w = rd(16) || 1, h = rd(20) || 1; return { w, h }; } catch { return { w: 1, h: 1 }; }
}
async function addImages(zip, doc, bb) {
  const s = doc.seller || {};
  if (!zip.file("xl/drawings/drawing1.xml")) return;
  const dataB64 = (uri) => String(uri || "").replace(/^data:[^,]*,/, "");
  // Классифицируем по пропорциям: широкая (w/h≥1.4) = ПОДПИСЬ (в двух местах),
  // квадратная = ПЕЧАТЬ (одна внизу). Устойчиво к тому, в какое поле их загрузили.
  const cand = [];
  if (s.showSignature && s.signatureDataUri) cand.push(dataB64(s.signatureDataUri));
  if (s.showStamp && s.stampDataUri) cand.push(dataB64(s.stampDataUri));
  let sig = null, stamp = null;
  for (const b of cand) { const d = pngSize(b); const wide = d.w / (d.h || 1) >= 1.4; if (wide && !sig) sig = { b, ...d }; else if (!wide && !stamp) stamp = { b, ...d }; else if (!sig) sig = { b, ...d }; else if (!stamp) stamp = { b, ...d }; }

  const rels = [], anchors = []; let n = 0;
  const relTag = (rId, i) => `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i}.png"/>`;
  if (sig) {
    n++; const rId = "rIdImg" + n; zip.file("xl/media/image" + n + ".png", sig.b, { base64: true }); rels.push(relTag(rId, n));
    const w = 80, h = Math.max(24, Math.round(w * sig.h / sig.w)); // меньше, пропорции сохраняем
    anchors.push(anchorXml(6, bb + 5, 430000, 95000, w * EMU, h * EMU, rId, 101, "sig-ruk"));  // подпись по центру линии Руководителя, чуть ниже
    anchors.push(anchorXml(6, bb + 7, 430000, 95000, w * EMU, h * EMU, rId, 102, "sig-buh"));  // подпись по центру линии Гл.бухгалтера, чуть ниже
  }
  if (stamp) {
    n++; const rId = "rIdImg" + n; zip.file("xl/media/image" + n + ".png", stamp.b, { base64: true }); rels.push(relTag(rId, n));
    const w = 156, h = Math.round(w * stamp.h / stamp.w);   // диаметр вровень с реальной синей печатью (замерено по распечатке — зафиксировано)
    anchors.push(anchorXml(14, bb + 8, 60000, 20000, w * EMU, h * EMU, rId, 121, "stamp"));    // печать правее и ниже — не заходит на ФИО
  }
  if (!n) return;
  const r = await zip.file("xl/drawings/_rels/drawing1.xml.rels").async("string");
  zip.file("xl/drawings/_rels/drawing1.xml.rels", r.replace("</Relationships>", rels.join("") + "</Relationships>"));
  const d = await zip.file("xl/drawings/drawing1.xml").async("string");
  zip.file("xl/drawings/drawing1.xml", d.replace("</xdr:wsDr>", anchors.join("") + "</xdr:wsDr>"));
}

/* ---------- IO ---------- */
function b64ToUint8(b64) { const raw = String(b64 || "").replace(/^data:[^,]*,/, ""); const bin = atob(raw); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
export async function downloadInvoiceExcel(doc = {}, templateXlsx = "") {
  const tpl = templateXlsx || doc._templateXlsx || INVOICE_TEMPLATE_B64;
  const zip = await JSZip.loadAsync(b64ToUint8(tpl));
  const path = zip.file("xl/worksheets/sheet1.xml") ? "xl/worksheets/sheet1.xml" : Object.keys(zip.files).find((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f));
  zip.file(path, buildSheet(await zip.file(path).async("string"), doc));
  if (zip.file("xl/workbook.xml")) zip.file("xl/workbook.xml", setPrintTitles(await zip.file("xl/workbook.xml").async("string")));
  await addImages(zip, doc, ITEM + ((doc.items && doc.items.length) || 1)); // печать/подпись

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Счет № ${(doc.number || "б-н").toString().replace(/[^\w\-а-яА-ЯёЁ]/g, "")}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
