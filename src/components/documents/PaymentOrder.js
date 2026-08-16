// src/components/documents/PaymentOrder.js
// Экспорт платёжного поручения в формат 1CClientBankExchange (.txt) — для
// загрузки в интернет-банк (Т-Бизнес и др.) и быстрой оплаты по счёту.
// ВАЖНО: файл кодируется в Windows-1251 и с переносами CRLF, иначе банк
// не прочитает кириллицу («кракозябры»). JS TextEncoder умеет только UTF-8,
// поэтому кодируем в cp1251 вручную.
import { fmtMoney, parseNum } from "@/data/documents.js";

/* ---- кодировщик Unicode → Windows-1251 ---- */
const CP1251_MAP = {
  0x0401: 0xa8, 0x0451: 0xb8, 0x2116: 0xb9, 0x00ab: 0xab, 0x00bb: 0xbb,
  0x00a0: 0xa0, 0x2013: 0x96, 0x2014: 0x97, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2026: 0x85, 0x00b0: 0xb0, 0x2022: 0x95,
  0x00a9: 0xa9, 0x00ae: 0xae, 0x2122: 0x99, 0x00b7: 0xb7,
};
export function toCp1251(str) {
  const s = String(str || "");
  const out = [];
  for (const ch of s) {
    const c = ch.codePointAt(0);
    let b;
    if (c <= 0x7f) b = c;                                   // ASCII
    else if (c >= 0x0410 && c <= 0x044f) b = c - 0x0410 + 0xc0; // А..я
    else if (CP1251_MAP[c] != null) b = CP1251_MAP[c];
    else b = 0x3f;                                          // '?' для незнакомых
    out.push(b);
  }
  return new Uint8Array(out);
}

/* ---- вспомогательные ---- */
function two(n) { return String(n).padStart(2, "0"); }
function dmy(d) { return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`; }
function hms(d) { return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`; }
function digits(v) { return String(v || "").replace(/\D/g, ""); }
// Сумма в поле «Сумма=» — точка, две цифры, без разделителей тысяч (413280.00).
function amt(v) { return parseNum(v).toFixed(2); }

// Собрать назначение платежа из полей счёта (можно переопределить готовым текстом).
export function buildPurpose({ schetNum, schetDate, subject, sum, vatRate }) {
  const parts = [];
  const base = `Оплата по счету${schetNum ? ` № ${schetNum}` : ""}${schetDate ? ` от ${schetDate}` : ""}`;
  parts.push(subject ? `${base} за ${subject}` : base);
  const rate = parseNum(vatRate);
  if (rate > 0) {
    const vat = parseNum(sum) * rate / (100 + rate); // НДС «в том числе»
    parts.push(`В т.ч. НДС ${rate % 1 ? rate : Math.round(rate)}% - ${fmtMoney(Math.round(vat * 100) / 100)} руб.`);
  } else {
    parts.push("Без НДС");
  }
  return parts.join(". ").replace(/\.\.+/g, ".") + ".";
}

/* ---- собрать текст 1CClientBankExchange ---- */
export function buildPaymentTxt(d) {
  const now = new Date();
  const date = d.docDate || dmy(now);
  const purpose = (d.purpose && d.purpose.trim()) || buildPurpose(d);
  const L = [
    "1CClientBankExchange",
    "ВерсияФормата=1.03",
    "Кодировка=Windows",
    "Отправитель=КУБ · cube-tech.ru",
    "Получатель=",
    `ДатаСоздания=${dmy(now)}`,
    `ВремяСоздания=${hms(now)}`,
    `ДатаНачала=${date}`,
    `ДатаКонца=${date}`,
    `РасчСчет=${d.payerAcc || ""}`,
    "Документ=Платежное поручение",
    "СекцияДокумент=Платежное поручение",
    `Номер=${d.docNum || ""}`,
    `Дата=${date}`,
    `Сумма=${amt(d.sum)}`,
    `ПлательщикСчет=${d.payerAcc || ""}`,
    `Плательщик=ИНН ${digits(d.payerInn)} ${d.payerName || ""}`,
    `ПлательщикИНН=${digits(d.payerInn)}`,
    `Плательщик1=${d.payerName || ""}`,
    `ПлательщикРасчСчет=${d.payerAcc || ""}`,
    `ПлательщикБанк1=${d.payerBank1 || ""}`,
    `ПлательщикБанк2=${d.payerBank2 || ""}`,
    `ПлательщикБИК=${digits(d.payerBik)}`,
    `ПлательщикКорсчет=${d.payerCorr || ""}`,
    `ПолучательСчет=${d.recvAcc || ""}`,
    `Получатель=ИНН ${digits(d.recvInn)} ${d.recvName || ""}`,
    `ПолучательИНН=${digits(d.recvInn)}`,
    `Получатель1=${d.recvName || ""}`,
    `ПолучательРасчСчет=${d.recvAcc || ""}`,
    `ПолучательБанк1=${d.recvBank1 || ""}`,
    `ПолучательБанк2=${d.recvBank2 || ""}`,
    `ПолучательБИК=${digits(d.recvBik)}`,
    `ПолучательКорсчет=${d.recvCorr || ""}`,
    "ВидОплаты=01",
    "СтатусСоставителя=",
    `ПлательщикКПП=${digits(d.payerKpp)}`,
    `ПолучательКПП=${digits(d.recvKpp)}`,
    "ПоказательКБК=",
    "ОКАТО=",
    "ПоказательОснования=",
    "ПоказательПериода=",
    "ПоказательНомера=",
    "ПоказательДаты=",
    "ПоказательТипа=",
    "Очередность=5",
    `НазначениеПлатежа=${purpose}`,
    `НазначениеПлатежа1=${purpose}`,
    "Код=0",
    "КонецДокумента",
    "КонецФайла",
    "",
  ];
  return L.join("\r\n");
}

// Скачать .txt (cp1251) под именем ПП_№<номер>_<получатель>_<дата>.txt
export function downloadPaymentTxt(d) {
  const txt = buildPaymentTxt(d);
  const bytes = toCp1251(txt);
  const blob = new Blob([bytes], { type: "text/plain;charset=windows-1251" });
  const url = URL.createObjectURL(blob);
  const safe = (s) => String(s || "").replace(/["'«»]/g, "").replace(/[\\/:*?<>|]+/g, " ").trim().slice(0, 40);
  const name = `ПП_№${d.docNum || ""}_${safe(d.recvName) || "платеж"}_${(d.docDate || "").replace(/\./g, "-")}.txt`;
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
}
