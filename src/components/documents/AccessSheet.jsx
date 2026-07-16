// src/components/documents/AccessSheet.jsx
// «Лист доступа к личному кабинету объекта» (форма КУБ-ЛК-01).
// Печатная A4-страница в фирменном стиле КУБ, шрифт Arial Narrow (как в Word-исходнике),
// рамка-прямоугольник вокруг листа + нижняя шапка. Логотип — фирменная марка «C.».
//
// Экспорт:
//   <AccessSheetModal data={...} onClose={...} /> — превью + стики-док (с. / Сохранить / Печать)
//   printAccessSheet(data)        — системный диалог печати (без превью)
//   downloadAccessSheetPdf(data)  — сразу скачать готовый PDF (html2canvas + jsPDF)
//
// data: {
//   customerName, objectNumber, objectTitle, objectAddress,
//   accountName, login, temporaryPassword, objectUrl,
//   issuedAt, contractNumber, contractDate
// }
import React from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

const ORANGE = "#F1571F";
const INK = "#111";
const GREY = "#6f6f6f";
const LINE = "#d9dbe0";
const FRAME = "#cfd2d8";
const LABEL_BG = "#f4f5f6";
const PWD_BG = "#fff3ee";
// Arial Narrow — как в исходном Word. Запасной ряд: узкие аналоги, затем обычный Arial.
const FONT = "'Arial Narrow','Arial Nova Cond','Roboto Condensed',Arial,'Helvetica Neue',sans-serif";
const DOCK_FONT = "'Inter Tight',Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

// Фирменная марка «C.» — контур из favicon.svg + точка (self-contained, работает и в печати).
const LOGO_PATH = "M61,8 L58,10 L56,10 L55,11 L54,11 L53,12 L52,12 L51,13 L50,13 L49,14 L48,14 L47,15 L44,16 L42,18 L41,18 L38,21 L37,21 L33,25 L32,25 L26,31 L26,32 L22,36 L22,37 L19,40 L19,41 L17,43 L17,44 L16,45 L16,46 L15,47 L15,48 L14,49 L14,50 L13,51 L13,52 L10,57 L10,59 L9,60 L9,62 L8,63 L8,65 L7,66 L7,68 L6,69 L6,73 L5,74 L5,78 L4,79 L4,86 L3,87 L3,113 L4,114 L4,120 L5,121 L5,125 L6,126 L6,130 L7,131 L7,133 L8,134 L8,136 L9,137 L9,139 L10,140 L10,142 L11,143 L11,144 L12,145 L12,146 L13,147 L13,148 L14,149 L14,150 L15,151 L15,152 L16,153 L17,156 L19,158 L19,159 L22,162 L22,163 L26,167 L26,168 L32,174 L33,174 L37,178 L38,178 L41,181 L42,181 L44,183 L45,183 L46,184 L47,184 L48,185 L49,185 L50,186 L51,186 L56,189 L58,189 L61,191 L63,191 L64,192 L66,192 L67,193 L71,193 L72,194 L76,194 L77,195 L83,195 L84,196 L112,196 L113,195 L118,195 L119,194 L123,194 L124,193 L128,193 L129,192 L131,192 L132,191 L134,191 L137,189 L139,189 L140,188 L141,188 L142,187 L143,187 L144,186 L145,186 L146,185 L149,184 L151,182 L152,182 L154,180 L155,180 L159,176 L160,176 L166,170 L166,169 L170,165 L170,164 L174,159 L174,158 L175,157 L175,156 L176,155 L176,154 L179,149 L179,147 L180,146 L180,144 L181,143 L181,141 L182,140 L182,138 L183,137 L183,132 L184,131 L184,123 L185,122 L185,120 L184,119 L129,119 L129,122 L128,123 L128,126 L127,127 L127,129 L126,130 L126,132 L125,133 L124,136 L122,138 L122,139 L115,146 L114,146 L112,148 L111,148 L110,149 L108,149 L107,150 L104,150 L103,151 L94,151 L93,150 L90,150 L89,149 L87,149 L86,148 L83,147 L81,145 L80,145 L74,139 L74,138 L72,136 L71,133 L69,131 L69,129 L68,128 L68,126 L67,125 L67,123 L66,122 L66,119 L65,118 L65,113 L64,112 L64,86 L65,85 L65,80 L66,79 L66,76 L67,75 L67,73 L68,72 L68,70 L69,69 L69,68 L70,67 L71,64 L73,62 L73,61 L81,53 L82,53 L83,52 L84,52 L89,49 L93,49 L94,48 L103,48 L104,49 L107,49 L108,50 L110,50 L111,51 L114,52 L116,54 L117,54 L121,58 L121,59 L124,62 L124,63 L126,66 L126,68 L127,69 L127,71 L128,72 L128,75 L129,76 L129,79 L184,79 L185,78 L185,75 L184,74 L184,67 L183,66 L183,61 L182,60 L182,58 L181,57 L181,55 L180,54 L180,52 L179,51 L179,49 L178,48 L178,47 L177,46 L177,45 L176,44 L175,41 L173,39 L173,38 L171,36 L171,35 L167,31 L167,30 L160,23 L159,23 L155,19 L154,19 L152,17 L149,16 L147,14 L146,14 L145,13 L144,13 L139,10 L137,10 L134,8 L132,8 L131,7 L129,7 L128,6 L124,6 L123,5 L119,5 L118,4 L113,4 L112,3 L83,3 L82,4 L77,4 L76,5 L72,5 L71,6 L67,6 L66,7 L64,7 L63,8 Z";
function logoMark(h = 30) {
  return `<svg viewBox="0 0 244 200" width="${Math.round(h * 1.22)}" height="${h}" style="display:block;flex:0 0 auto;">
    <path d="${LOGO_PATH}" fill="${INK}" fill-rule="evenodd"/>
    <circle cx="212" cy="176" r="21" fill="${INK}"/>
  </svg>`;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const val = (s) => (s == null || s === "" ? "—" : esc(s));

function todayRu() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Строка «метка/значение» таблицы данных входа.
function credRow(label, value, opts = {}) {
  const vStyle = [
    "padding:7px 12px", `border:1px solid ${LINE}`, "font-size:13px",
    opts.bold ? "font-weight:700" : "font-weight:400",
    `color:${opts.accent ? ORANGE : INK}`,
    opts.accent ? `background:${PWD_BG}` : "",
    opts.mono ? "font-family:'Consolas','Courier New',monospace;letter-spacing:.02em" : `font-family:${FONT}`,
  ].filter(Boolean).join(";");
  return `<tr>
    <td style="width:150px;padding:7px 12px;border:1px solid ${LINE};background:${LABEL_BG};font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:#666;font-weight:700;font-family:${FONT};">${label}</td>
    <td style="${vStyle}">${value}</td>
  </tr>`;
}

function infoRow(label, value, accent) {
  return `<tr>
    <td style="width:168px;padding:8px 14px;border:1px solid ${LINE};background:${LABEL_BG};font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:#666;font-weight:700;font-family:${FONT};">${label}</td>
    <td style="padding:8px 14px;border:1px solid ${LINE};font-size:13px;color:${accent ? ORANGE : INK};font-weight:${accent ? 700 : 400};font-family:${FONT};">${value}</td>
  </tr>`;
}

function stepCol(num, title, desc) {
  return `<div style="flex:1;min-width:0;">
    <div style="display:flex;align-items:baseline;gap:7px;">
      <span style="color:${ORANGE};font-weight:700;font-size:16px;font-family:${FONT};">${num}</span>
      <span style="font-weight:700;font-size:11.5px;letter-spacing:.02em;text-transform:uppercase;color:${INK};font-family:${FONT};">${title}</span>
    </div>
    <div style="margin-top:4px;font-size:11px;line-height:1.4;color:${GREY};font-family:${FONT};">${desc}</div>
  </div>`;
}

// Собирает HTML одной A4-страницы (в рамке, с нижней шапкой). qr — data-URL QR (или "").
export function buildAccessSheetHTML(d = {}, qr = "") {
  const issued = d.issuedAt || todayRu();
  const qrImg = qr
    ? `<img src="${qr}" alt="QR" style="width:172px;height:172px;display:block;" />`
    : `<div style="width:172px;height:172px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;font-family:${FONT};">QR</div>`;

  const body = `
    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${logoMark(30)}
        <div style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#8a8a8a;font-weight:700;">Документ для заказчика</div>
      </div>
      <div style="text-align:right;line-height:1.5;">
        <div style="font-size:13.5px;font-weight:700;color:${INK};">ООО «КУБ»</div>
        <div style="font-size:10px;color:${GREY};">ИНН 8905070217&nbsp; | &nbsp;ОГРН 1258900002448</div>
        <div style="font-size:10px;color:${GREY};">info@cube-tech.ru&nbsp; | &nbsp;+7 (912) 911-20-00</div>
        <div style="font-size:10px;color:${GREY};">cube-tech.ru</div>
      </div>
    </div>

    <!-- Оранжевая линия -->
    <div style="height:2.5px;background:${ORANGE};margin:12px 0 0;border-radius:2px;"></div>

    <!-- Заголовок -->
    <div style="text-align:center;margin-top:16px;">
      <div style="font-size:27px;font-weight:700;letter-spacing:.01em;line-height:1;">ЛИСТ ДОСТУПА</div>
      <div style="font-size:16px;font-weight:700;color:#3a3a3a;margin-top:3px;">К ЛИЧНОМУ КАБИНЕТУ ОБЪЕКТА</div>
      <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${GREY};font-weight:700;margin-top:6px;">QR-код &nbsp;•&nbsp; Учётная запись &nbsp;•&nbsp; Документы объекта</div>
    </div>

    <!-- Инфо об объекте -->
    <table style="width:100%;border-collapse:collapse;margin-top:15px;">
      ${infoRow("Заказчик", val(d.customerName))}
      ${infoRow("Объект №", val(d.objectNumber), true)}
      ${infoRow("Наименование", val(d.objectTitle))}
      ${infoRow("Адрес", val(d.objectAddress))}
    </table>

    <!-- Данные для входа -->
    <div style="margin-top:18px;font-size:15px;font-weight:700;letter-spacing:.01em;">ДАННЫЕ ДЛЯ ВХОДА</div>
    <div style="font-size:11px;color:${GREY};margin-top:1px;">Используйте их при первом входе в личный кабинет</div>

    <div style="display:flex;margin-top:10px;border:1px solid ${LINE};border-radius:8px;overflow:hidden;">
      <div style="flex:1;min-width:0;padding:14px;">
        <table style="width:100%;border-collapse:collapse;">
          ${credRow("Имя учётной записи", val(d.accountName))}
          ${credRow("Логин", val(d.login), { bold: true, mono: true })}
          ${credRow("Временный пароль", val(d.temporaryPassword), { bold: true, accent: true, mono: true })}
          ${credRow("Ссылка для входа", val(d.objectUrl))}
        </table>
        <div style="margin-top:9px;font-size:11px;line-height:1.45;color:${GREY};">Временный пароль действует до первого входа. После авторизации система предложит установить собственный пароль.</div>
      </div>
      <div style="width:230px;flex-shrink:0;border-left:1px solid ${LINE};padding:14px;display:flex;flex-direction:column;align-items:center;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;">Откройте объект</div>
        <div style="margin-top:10px;">${qrImg}</div>
        <div style="margin-top:9px;font-size:11px;line-height:1.35;color:${GREY};text-align:center;">Наведите камеру телефона<br/>на QR-код</div>
      </div>
    </div>

    <!-- Как войти -->
    <div style="margin-top:18px;font-size:15px;font-weight:700;letter-spacing:.01em;">КАК ВОЙТИ</div>
    <div style="display:flex;gap:22px;margin-top:9px;">
      ${stepCol("01", "Сканируйте", "Откройте камеру телефона и наведите её на QR-код.")}
      ${stepCol("02", "Авторизуйтесь", "Введите логин и временный пароль из этого документа.")}
      ${stepCol("03", "Откройте объект", "В кабинете выберите «Объекты» и нужный номер объекта.")}
    </div>

    <!-- Важно -->
    <div style="margin-top:16px;background:#f6f6f6;border-left:3px solid ${ORANGE};padding:10px 14px;">
      <div style="font-size:11px;line-height:1.45;color:#333;"><span style="color:${ORANGE};font-weight:700;">ВАЖНО.</span> QR-код ведёт только на страницу объекта и не содержит пароль. Документ содержит конфиденциальные данные доступа — не пересылайте его третьим лицам. При утрате данных обратитесь в ООО «КУБ».</div>
      <div style="margin-top:6px;font-size:10px;color:${GREY};">Дата выдачи: ${esc(issued)}&nbsp;&nbsp;•&nbsp;&nbsp;Договор: ${val(d.contractNumber)} от ${val(d.contractDate)}</div>
      <div style="margin-top:2px;font-size:10px;color:#333;font-weight:700;">Поддержка: info@cube-tech.ru&nbsp;&nbsp;|&nbsp;&nbsp;+7 (912) 911-20-00</div>
    </div>`;

  const footer = `<div style="border-top:1px solid ${LINE};padding:9px 30px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:#b0b0b0;font-family:${FONT};">
      <span>Форма КУБ-ЛК-01</span><span>Документ содержит данные доступа</span><span>Лист 1 из 1</span>
    </div>`;

  // Внешний лист A4 → рамка-прямоугольник → контент (flex:1) + нижняя шапка (прижата вниз).
  return `<div class="cube-sheet" style="width:794px;min-height:1122px;box-sizing:border-box;padding:22px;background:#fff;color:${INK};font-family:${FONT};">
    <div style="border:1px solid ${FRAME};box-sizing:border-box;min-height:1078px;display:flex;flex-direction:column;">
      <div style="flex:1;padding:26px 30px 22px;">${body}</div>
      ${footer}
    </div>
  </div>`;
}

// QR как data-URL (общий помощник для печати/скачивания/превью).
async function makeQr(objectUrl) {
  if (!objectUrl) return "";
  try {
    return await QRCode.toDataURL(String(objectUrl), { errorCorrectionLevel: "H", margin: 1, width: 600, color: { dark: "#111111", light: "#ffffff" } });
  } catch { return ""; }
}

// Открыть системный диалог печати в отдельном окне.
export async function printAccessSheet(data = {}) {
  const qr = await makeQr(data.objectUrl);
  const html = buildAccessSheetHTML(data, qr);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Лист доступа</title>
    <style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}
    .cube-sheet{margin:0 auto}</style></head>
    <body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch {} }, 350);
}

// Сразу скачать готовый PDF (без диалога печати). Растрируем лист html2canvas'ом
// (браузер рисует кириллицу системным шрифтом) и кладём картинку на страницу A4 в jsPDF.
export async function downloadAccessSheetPdf(data = {}) {
  const [{ default: html2canvas }, jspdf] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const JsPDF = jspdf.jsPDF || jspdf.default;

  const qr = await makeQr(data.objectUrl);
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;z-index:-1;background:#fff;";
  holder.innerHTML = buildAccessSheetHTML(data, qr);
  document.body.appendChild(holder);
  const node = holder.querySelector(".cube-sheet");
  // дождаться загрузки картинки QR, иначе снимок будет без неё
  const imgEl = node && node.querySelector("img");
  if (imgEl && !imgEl.complete) {
    await new Promise((res) => { imgEl.onload = res; imgEl.onerror = res; });
  }
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const img = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "JPEG", 0, 0, pw, ph, undefined, "FAST");
    pdf.save("Лист доступа.pdf");
  } finally {
    document.body.removeChild(holder);
  }
}

// Стики-док: внешняя рамка + плитка «с.» + плашка с кнопками (структура как у legal-дока).
function SheetDock({ data, onClose }) {
  const [saving, setSaving] = React.useState(false);
  const frame = {
    position: "fixed", left: "50%", bottom: 21, transform: "translateX(-50%)", zIndex: 210,
    display: "flex", alignItems: "center", gap: 10, padding: 6, borderRadius: 12,
    background: "rgba(69,69,69,.58)", backdropFilter: "saturate(115%) blur(6px)", WebkitBackdropFilter: "saturate(115%) blur(6px)",
    boxShadow: "0 12px 40px rgba(0,0,0,.45)", fontFamily: DOCK_FONT,
  };
  const tile = {
    display: "grid", placeItems: "center", width: 60, height: 60, borderRadius: 8,
    background: "#1B1B1B", border: "1px solid rgba(255,255,255,.06)", color: "#e9e9e9",
    cursor: "pointer", fontSize: 26, fontWeight: 400,
  };
  const plate = {
    display: "flex", alignItems: "center", gap: 6, height: 60, padding: "6px 10px",
    borderRadius: 10, background: "#3E3E3E",
  };
  const pill = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, padding: "0 20px",
    borderRadius: 8, background: "#3E3E3E", border: "1px solid rgba(255,255,255,.12)", color: "#e8e8e8",
    fontSize: 13, fontWeight: 300, whiteSpace: "nowrap", cursor: "pointer", transition: "border-color .15s ease",
  };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try { await downloadAccessSheetPdf(data); } catch { try { window.showDockToast && window.showDockToast("Не удалось сохранить"); } catch {} }
    setSaving(false);
  };
  return (
    <div style={frame}>
      <button type="button" title="Закрыть" aria-label="Закрыть" onClick={onClose} style={tile}>с.</button>
      <div style={plate}>
        <button type="button" onClick={save} style={{ ...pill, opacity: saving ? 0.7 : 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8f8f8f")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.12)")}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        <button type="button" onClick={() => printAccessSheet(data)} style={pill}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8f8f8f")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.12)")}>
          Печать
        </button>
      </div>
    </div>
  );
}

// Модалка-превью листа + стики-док снизу.
export function AccessSheetModal({ data = {}, onClose }) {
  const [qr, setQr] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    (async () => { const u = await makeQr(data.objectUrl); if (alive) setQr(u); })();
    return () => { alive = false; };
  }, [data.objectUrl]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    // прячем сайтовый док (он route-aware), показываем свой
    document.body.classList.add("has-modal");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      document.body.classList.remove("has-modal");
    };
  }, [onClose]);

  const html = buildAccessSheetHTML(data, qr);

  return createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column", alignItems: "center", overflow: "auto", padding: "28px 12px 108px" }}>
      <div style={{ boxShadow: "0 24px 60px rgba(0,0,0,.4)", background: "#fff", flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: html }} />
      <SheetDock data={data} onClose={onClose} />
    </div>,
    document.body
  );
}

export default AccessSheetModal;
