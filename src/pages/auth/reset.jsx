// src/pages/auth/reset.jsx
// Страница установки нового пароля по ссылке из письма: /reset?token=...
import React from "react";
import { resetPassword } from "@/lib/auth";

const BTN =
  "h-[56px] rounded-[10px] bg-black px-[18px] text-[17px] font-semibold tracking-[.02em] text-white transition-colors hover:bg-[#2f2f2f] active:translate-y-px disabled:opacity-60";
const LINK = "font-semibold text-[#111] underline underline-offset-2 hover:opacity-80";
const inputCls = (err) =>
  "h-[46px] w-full border-0 border-b bg-transparent px-0.5 text-[16px] font-light text-[#111] outline-none transition-colors placeholder:font-light placeholder:text-[#c7c7c7] " +
  (err ? "border-carrot" : "border-[#ededed] focus:border-[#d2d2d2]");

// Клиентская проверка (зеркалит серверную политику: ≥6, заглавная, спецсимвол)
function policyError(pwd) {
  const s = String(pwd || "");
  if (s.length < 6) return "Минимум 6 символов.";
  if (!/[A-ZА-ЯЁ]/.test(s)) return "Нужна хотя бы одна заглавная буква.";
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(s)) return "Нужен хотя бы один спецсимвол.";
  return null;
}

function getToken() {
  try { return new URLSearchParams(window.location.search).get("token") || ""; }
  catch { return ""; }
}

function goLogin() {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
  setTimeout(() => { try { window.openModal?.("login"); } catch {} }, 60);
}

export default function ResetPasswordPage() {
  const [token] = React.useState(getToken);
  const [pass, setPass] = React.useState("");
  const [pass2, setPass2] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!token) { setErr("Ссылка недействительна или устарела. Запросите сброс заново."); return; }
    const pe = policyError(pass);
    if (pe) { setErr(pe); return; }
    if (pass !== pass2) { setErr("Пароли не совпадают."); return; }
    try {
      setBusy(true);
      setErr("");
      await resetPassword({ token, newPassword: pass });
      setDone(true);
    } catch (e2) {
      if (e2.status === 400) {
        const p = (e2.payload && e2.payload.error) || "";
        if (/token/i.test(p)) setErr("Ссылка недействительна или устарела. Запросите сброс заново.");
        else if (/short/i.test(p)) setErr("Минимум 6 символов.");
        else if (/uppercase/i.test(p)) setErr("Нужна хотя бы одна заглавная буква.");
        else if (/symbol/i.test(p)) setErr("Нужен хотя бы один спецсимвол.");
        else setErr("Не удалось изменить пароль. Проверьте данные.");
      } else {
        setErr("Что-то пошло не так. Попробуйте позже.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[520px] flex-col justify-center px-6 py-16 font-tight">
      <span className="mb-6 text-[56px] font-black leading-none tracking-[.02em] text-[#111]">c.</span>

      {done ? (
        <>
          <h1 className="mb-3 text-[26px] font-semibold leading-[1.2] text-[#111]">Пароль изменён</h1>
          <p className="mb-8 text-[15px] font-light leading-6 text-[#555]">
            Теперь войдите с новым паролем. Все прежние сессии на других устройствах завершены.
          </p>
          <button className={BTN} onClick={goLogin}>Войти</button>
        </>
      ) : (
        <>
          <h1 className="mb-3 text-[26px] font-semibold leading-[1.2] text-[#111]">Новый пароль</h1>
          <p className="mb-7 text-[15px] font-light leading-6 text-[#555]">
            Придумайте новый пароль для вашего аккаунта на cube-tech.ru.
          </p>
          <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col">
              <label className="mb-1.5 text-[11px] font-light uppercase leading-none tracking-[.08em] text-[#666]">Новый пароль</label>
              <input className={inputCls(err)} type="password" value={pass} autoFocus autoComplete="new-password"
                onChange={(e) => { setPass(e.target.value); if (err) setErr(""); }} placeholder="Новый пароль" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1.5 text-[11px] font-light uppercase leading-none tracking-[.08em] text-[#666]">Повтор пароля</label>
              <input className={inputCls(err)} type="password" value={pass2} autoComplete="new-password"
                onChange={(e) => { setPass2(e.target.value); if (err) setErr(""); }} placeholder="Ещё раз" />
            </div>
            <div className="min-h-[20px] text-[12px] font-light leading-5 text-carrot">{err}</div>
            <button className={BTN} type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Сохранить пароль"}</button>
          </form>
          <div className="mt-6">
            <a href="/" className={LINK} onClick={(e) => { e.preventDefault(); goLogin(); }}>Вернуться ко входу</a>
          </div>
        </>
      )}
    </div>
  );
}
