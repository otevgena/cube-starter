import nodemailer from "nodemailer";

const ORIGINS = (process.env.ALLOWED_ORIGINS || "https://cube-tech.ru,http://localhost:5173")
  .split(",").map(s => s.trim());

const LOG = (...a) => console.log("[send]", ...a);
const ERR = (...a) => console.error("[send][ERR]", ...a);

export async function handler(event) {
  const origin = event.headers?.origin || "";
  const cors = {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    LOG("OPTIONS from", origin || "<no-origin>");
    return { statusCode: 204, headers: cors, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      name = "", email = "", phone = "", option = "", message = "", page = ""
    } = body;

    LOG("REQ from", origin || "<no-origin>", {
      name, email, phone, option, page, msgLen: String(message).length
    });

    if (!name || !email || !message) {
      LOG("Bad request: required fields missing");
      return { statusCode: 400, headers: cors, body: JSON.stringify({ ok:false, error:"bad_request" }) };
    }

    // ===== SMTP ТРАНСПОРТ =====
    // Вариант 1 (обычный, SMTPS 465):
let transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 587,
  secure: false,       // STARTTLS
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true,
  debug: true,
});

    // Если 465 упрётся в таймаут/фаервол — раскомментируй вариант 2 (587 STARTTLS) и закомментируй вариант 1:
    // let transporter = nodemailer.createTransport({
    //   host: "smtp.yandex.ru",
    //   port: 587,
    //   secure: false,           // STARTTLS
    //   requireTLS: true,
    //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    //   logger: true,
    //   debug: true,
    // });

    try {
      await transporter.verify();
      LOG("SMTP OK as", process.env.SMTP_USER);
    } catch (e) {
      ERR("SMTP VERIFY FAILED:", e.code, e.responseCode, e.message);
      throw e;
    }

    const now = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
    const esc = (s="") => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const br  = (s="") => s.replace(/\n/g,"<br/>");

    // 1) Вам
    try {
      await transporter.sendMail({
        from: `"КУБ — форма" <${process.env.SMTP_USER}>`,
        to: "info@cube-tech.ru",
        subject: `Заявка с сайта — ${name}`,
        replyTo: email,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">
            <h2 style="margin:0 0 12px">Новая заявка с cube-tech.ru</h2>
            <p><b>Имя:</b> ${esc(name)}</p>
            <p><b>Email:</b> ${esc(email)}</p>
            <p><b>Телефон:</b> ${esc(phone||"—")}</p>
            <p><b>Вариант:</b> ${esc(option||"—")}</p>
            <p><b>Сообщение:</b><br/>${br(esc(message))}</p>
            <p><b>Страница:</b> ${esc(page||"—")}</p>
            <hr/><p style="color:#666">Дата/время: ${now}</p>
          </div>`
      });
      LOG("Mail 1/2 sent to info@cube-tech.ru");
    } catch (e) {
      ERR("SEND 1/2 FAILED:", e.code, e.responseCode, e.message);
      throw e;
    }

    // 2) Клиенту автоответ
    try {
      await transporter.sendMail({
        from: `"КУБ" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Ваша заявка получена — КУБ",
        html: `
          <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">
            <p>Здравствуйте, ${esc(name)}!</p>
            <p>Спасибо за обращение. Мы получили вашу заявку и свяжемся в ближайшее время.</p>
            <p><b>Тема:</b> ${esc(option||"—")}</p>
            <p><b>Сообщение:</b><br/>${br(esc(message)).slice(0,800)}</p>
            <p>С уважением, команда «КУБ»</p>
          </div>`
      });
      LOG("Mail 2/2 sent to", email);
    } catch (e) {
      ERR("SEND 2/2 FAILED:", e.code, e.responseCode, e.message);
      // автоответ клиенту — не критично, не падаем; но логируем
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok:true }) };
  } catch (e) {
    ERR("HANDLER FAILED:", e.code, e.responseCode, e.message);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ ok:false, error:"server_error" }) };
  }
}
