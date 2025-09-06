import "dotenv/config";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { handler } from "./index.mjs";

const app = express();
app.use(express.json());

// CORS
const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  }
}));

// Health: чтобы быстро понять, жив ли сервер
app.get("/health", (req, res) => res.json({ ok:true, ts: Date.now() }));

// Verify: проверка SMTP без отправки письма
app.get("/verify", async (req, res) => {
  try {
    // Вариант 1: SMTPS 465
let tr = nodemailer.createTransport({
  host: "smtp.yandex.ru", port: 587, secure: false, requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true, debug: true,
});

    // Вариант 2: STARTTLS 587 (если 465 не проходит)
    // let tr = nodemailer.createTransport({
    //   host: "smtp.yandex.ru", port: 587, secure: false, requireTLS: true,
    //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    //   logger: true, debug: true,
    // });

    await tr.verify();
    res.json({ ok:true });
  } catch (e) {
    res.status(500).json({ ok:false, code:e.code, responseCode:e.responseCode, message:e.message });
  }
});

// Основной прокси на handler
app.options("/send", (req,res)=> res.sendStatus(204));
app.post("/send", async (req, res) => {
  try {
    const event = {
      httpMethod: "POST",
      headers: req.headers,
      body: JSON.stringify(req.body || {})
    };
    const result = await handler(event);
    res.status(result.statusCode || 200);
    Object.entries(result.headers || {}).forEach(([k,v])=> res.setHeader(k, v));
    res.send(result.body || "");
  } catch (e) {
    console.error("[dev-server][ERR]", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Dev server running on http://localhost:${PORT}/send`));
