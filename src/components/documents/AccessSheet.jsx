// src/components/documents/AccessSheet.jsx
// «Лист доступа к личному кабинету объекта» (форма КУБ-ЛК-01).
// Печатная A4-страница в фирменном стиле КУБ: QR-код (ведёт на объект),
// имя учётки, логин, временный пароль. Собирается из данных учётки/объекта.
//
// Экспорт:
//   <AccessSheetModal data={...} onClose={...} /> — превью на экране + «Печать / PDF»
//   printAccessSheet(data) — сразу открыть системный диалог печати (без превью)
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
const GREY = "#7c7c7c";
const LINE = "#e5e7eb";
const LABEL_BG = "#f4f5f6";
const PWD_BG = "#fff3ee";
const FONT = "'Inter Tight','Inter',system-ui,Arial,sans-serif";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const val = (s) => (s == null || s === "" ? "—" : esc(s));

function todayRu() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Логотип-марка «с.» (текстовая, самодостаточная — работает и в окне печати).
const logoMark = `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;">
  <div style="font-family:${FONT};font-weight:800;font-size:44px;line-height:.8;color:${INK};letter-spacing:-.02em;">с.</div>
  <div style="width:4px;height:16px;background:${ORANGE};border-radius:1px;"></div>
</div>`;

// Строка «метка/значение» кредо-таблицы.
function credRow(label, value, opts = {}) {
  const vStyle = [
    "padding:10px 14px", `border:1px solid ${LINE}`, "font-size:14px",
    opts.bold ? "font-weight:700" : "font-weight:400",
    `color:${opts.accent ? ORANGE : INK}`,
    opts.accent ? `background:${PWD_BG}` : "",
    opts.mono ? "font-family:'Courier New',ui-monospace,monospace;letter-spacing:.02em" : `font-family:${FONT}`,
  ].filter(Boolean).join(";");
  return `<tr>
    <td style="width:170px;padding:10px 14px;border:1px solid ${LINE};background:${LABEL_BG};font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:#555;font-weight:700;font-family:${FONT};">${label}</td>
    <td style="${vStyle}">${value}</td>
  </tr>`;
}

function infoRow(label, value, accent) {
  return `<tr>
    <td style="width:190px;padding:11px 16px;border:1px solid ${LINE};background:${LABEL_BG};font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:#555;font-weight:700;font-family:${FONT};">${label}</td>
    <td style="padding:11px 16px;border:1px solid ${LINE};font-size:14px;color:${accent ? ORANGE : INK};font-weight:${accent ? 700 : 400};font-family:${FONT};">${value}</td>
  </tr>`;
}

function stepCol(num, title, desc) {
  return `<div style="flex:1;min-width:0;">
    <div style="display:flex;align-items:baseline;gap:8px;">
      <span style="color:${ORANGE};font-weight:800;font-size:18px;font-family:${FONT};">${num}</span>
      <span style="font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;color:${INK};font-family:${FONT};">${title}</span>
    </div>
    <div style="margin-top:5px;font-size:12px;line-height:1.45;color:${GREY};font-family:${FONT};">${desc}</div>
  </div>`;
}

// Собирает HTML одной A4-страницы. qr — data-URL картинки QR (или "").
export function buildAccessSheetHTML(d = {}, qr = "") {
  const issued = d.issuedAt || todayRu();
  const qrImg = qr
    ? `<img src="${qr}" alt="QR" style="width:196px;height:196px;display:block;" />`
    : `<div style="width:196px;height:196px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;font-family:${FONT};">QR</div>`;

  return `<div class="cube-sheet" style="width:794px;box-sizing:border-box;padding:38px 44px 30px;background:#fff;color:${INK};font-family:${FONT};">
    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:18px;">
        ${logoMark}
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a;font-weight:700;">Документ для заказчика</div>
      </div>
      <div style="text-align:right;line-height:1.55;">
        <div style="font-size:15px;font-weight:700;color:${INK};">ООО «КУБ»</div>
        <div style="font-size:11px;color:${GREY};">ИНН 8905070217&nbsp; | &nbsp;ОГРН 1258900002448</div>
        <div style="font-size:11px;color:${GREY};">info@cube-tech.ru&nbsp; | &nbsp;+7 (912) 911-20-00</div>
        <div style="font-size:11px;color:${GREY};">cube-tech.ru</div>
      </div>
    </div>

    <!-- Оранжевая линия -->
    <div style="position:relative;height:3px;background:${ORANGE};margin:16px 0 0;border-radius:2px;">
      <div style="position:absolute;right:-2px;top:-5px;width:12px;height:12px;border:1px solid ${LINE};background:#fff;"></div>
    </div>

    <!-- Заголовок -->
    <div style="text-align:center;margin-top:22px;">
      <div style="font-size:34px;font-weight:800;letter-spacing:.01em;line-height:1;">ЛИСТ ДОСТУПА</div>
      <div style="font-size:21px;font-weight:800;color:#3a3a3a;margin-top:4px;">К ЛИЧНОМУ КАБИНЕТУ ОБЪЕКТА</div>
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${GREY};font-weight:700;margin-top:8px;">QR-код &nbsp;•&nbsp; Учётная запись &nbsp;•&nbsp; Документы объекта</div>
    </div>

    <!-- Инфо об объекте -->
    <table style="width:100%;border-collapse:collapse;margin-top:20px;">
      ${infoRow("Заказчик", val(d.customerName))}
      ${infoRow("Объект №", val(d.objectNumber), true)}
      ${infoRow("Наименование", val(d.objectTitle))}
      ${infoRow("Адрес", val(d.objectAddress))}
    </table>

    <!-- Данные для входа -->
    <div style="margin-top:24px;font-size:19px;font-weight:800;">ДАННЫЕ ДЛЯ ВХОДА</div>
    <div style="font-size:12px;color:${GREY};margin-top:2px;">Используйте их при первом входе в личный кабинет</div>

    <div style="display:flex;margin-top:14px;border:1px solid ${LINE};border-radius:10px;overflow:hidden;">
      <div style="flex:1;min-width:0;padding:18px;">
        <table style="width:100%;border-collapse:collapse;">
          ${credRow("Имя учётной записи", val(d.accountName))}
          ${credRow("Логин", val(d.login), { bold: true, mono: true })}
          ${credRow("Временный пароль", val(d.temporaryPassword), { bold: true, accent: true, mono: true })}
          ${credRow("Ссылка для входа", val(d.objectUrl))}
        </table>
        <div style="margin-top:12px;font-size:12px;line-height:1.5;color:${GREY};">Временный пароль действует до первого входа. После авторизации система предложит установить собственный пароль.</div>
      </div>
      <div style="width:262px;flex-shrink:0;border-left:1px solid ${LINE};padding:18px;display:flex;flex-direction:column;align-items:center;">
        <div style="font-size:13px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;">Откройте объект</div>
        <div style="position:relative;margin-top:14px;">
          ${qrImg}
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid ${ORANGE};border-radius:8px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:${INK};font-family:${FONT};">с.</div>
        </div>
        <div style="margin-top:12px;font-size:12px;line-height:1.4;color:${GREY};text-align:center;">Наведите камеру телефона<br/>на QR-код</div>
      </div>
    </div>

    <!-- Как войти -->
    <div style="margin-top:24px;font-size:19px;font-weight:800;">КАК ВОЙТИ</div>
    <div style="display:flex;gap:26px;margin-top:12px;">
      ${stepCol("01", "Сканируйте", "Откройте камеру телефона и наведите её на QR-код.")}
      ${stepCol("02", "Авторизуйтесь", "Введите логин и временный пароль из этого документа.")}
      ${stepCol("03", "Откройте объект", "В кабинете выберите «Объекты» и нужный номер объекта.")}
    </div>

    <!-- Важно -->
    <div style="margin-top:22px;background:#f6f6f6;border-left:3px solid ${ORANGE};padding:12px 16px;">
      <div style="font-size:12px;line-height:1.5;color:#333;"><span style="color:${ORANGE};font-weight:800;">ВАЖНО.</span> QR-код ведёт только на страницу объекта и не содержит пароль. Документ содержит конфиденциальные данные доступа — не пересылайте его третьим лицам. При утрате данных обратитесь в ООО «КУБ».</div>
      <div style="margin-top:8px;font-size:11px;color:${GREY};">Дата выдачи: ${esc(issued)}&nbsp;&nbsp;•&nbsp;&nbsp;Договор: ${val(d.contractNumber)} от ${val(d.contractDate)}</div>
      <div style="margin-top:3px;font-size:11px;color:#333;font-weight:700;">Поддержка: info@cube-tech.ru&nbsp;&nbsp;|&nbsp;&nbsp;+7 (912) 911-20-00</div>
    </div>

    <!-- Низ формы -->
    <div style="display:flex;justify-content:space-between;border-top:1px solid ${LINE};margin-top:20px;padding-top:8px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#b3b3b3;">
      <span>Форма КУБ-ЛК-01</span><span>Документ содержит данные доступа</span><span>Лист 1 из 1</span>
    </div>
  </div>`;
}

// Открыть системный диалог печати в отдельном окне (надёжно для «Сохранить в PDF»).
export async function printAccessSheet(data = {}) {
  let qr = "";
  try {
    if (data.objectUrl) qr = await QRCode.toDataURL(String(data.objectUrl), { errorCorrectionLevel: "H", margin: 1, width: 600, color: { dark: "#111111", light: "#ffffff" } });
  } catch { /* без QR тоже печатаем */ }
  const html = buildAccessSheetHTML(data, qr);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Лист доступа</title>
    <style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}
    .cube-sheet{margin:0 auto}</style></head>
    <body>${html}</body></html>`);
  w.document.close();
  // даём картинке QR загрузиться, затем печать
  w.focus();
  setTimeout(() => { try { w.print(); } catch {} }, 350);
}

// Модалка-превью с кнопкой печати.
export function AccessSheetModal({ data = {}, onClose }) {
  const [qr, setQr] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (data.objectUrl) {
          const u = await QRCode.toDataURL(String(data.objectUrl), { errorCorrectionLevel: "H", margin: 1, width: 600, color: { dark: "#111111", light: "#ffffff" } });
          if (alive) setQr(u);
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [data.objectUrl]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; };
  }, [onClose]);

  const html = buildAccessSheetHTML(data, qr);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column", alignItems: "center", overflow: "auto", padding: "24px 12px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, position: "sticky", top: 0, zIndex: 2 }}>
        <button type="button" onClick={() => printAccessSheet(data)}
          style={{ height: 44, padding: "0 22px", borderRadius: 10, border: "none", background: "#111", color: "#fff", cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 500 }}>
          Печать / Сохранить в PDF
        </button>
        <button type="button" onClick={onClose}
          style={{ height: 44, padding: "0 22px", borderRadius: 10, border: "1px solid #d9d9d9", background: "#fff", color: "#111", cursor: "pointer", fontFamily: FONT, fontSize: 14 }}>
          Закрыть
        </button>
      </div>
      <div style={{ boxShadow: "0 24px 60px rgba(0,0,0,.4)", background: "#fff", flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>,
    document.body
  );
}

export default AccessSheetModal;
