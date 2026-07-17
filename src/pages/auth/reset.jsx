// src/pages/auth/reset.jsx
// Страница установки нового пароля по ссылке из письма: /reset?token=...
import React from "react";
import { resetPassword } from "@/lib/auth";

const BTN =
  "inline-flex h-[58px] items-center justify-center rounded-[12px] bg-black px-8 text-[16px] font-semibold tracking-[.02em] text-white transition-colors hover:bg-[#2f2f2f] active:translate-y-px disabled:opacity-60";

// Slide-подчёркивание как у ссылок в модалках/«Генеральный директор»: серая база + выезжающая тёмная.
const LINK =
  "relative inline-block pb-0.5 font-semibold text-[#111] no-underline " +
  "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-neutral-300 before:content-[''] " +
  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#111] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full";

// Широкое поле с рамкой (awwwards-стиль), скругления КУБ.
const inputCls = (err) =>
  "h-[58px] w-full rounded-[12px] border bg-white px-4 text-[16px] font-light text-[#111] outline-none transition-colors placeholder:font-light placeholder:text-[#bdbdbd] " +
  (err ? "border-carrot" : "border-[#e2e2e2] hover:border-[#cfcfcf] focus:border-[#999]");

const labelCls =
  "mb-2 block text-[11px] font-medium uppercase leading-none tracking-[.1em] text-[#666]";

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
    <div className="font-tight">
      <div className="mx-auto grid min-h-[78vh] max-w-[1080px] grid-cols-1 items-center gap-x-20 gap-y-12 px-6 py-16 md:grid-cols-2 md:py-24">

        {/* Левая колонка — крупный заголовок */}
        <div className="max-w-[460px]">
          <span className="mb-8 block text-[44px] font-black leading-none tracking-[.02em] text-[#111]">c.</span>
          {done ? (
            <>
              <h1 className="text-[40px] font-black leading-[1.05] tracking-[-.01em] text-[#111] md:text-[58px]">
                Пароль<br />изменён
              </h1>
              <p className="mt-6 max-w-[380px] text-[16px] font-light leading-7 text-[#555]">
                Теперь войдите с новым паролем. Все прежние сессии на других устройствах завершены.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[40px] font-black leading-[1.05] tracking-[-.01em] text-[#111] md:text-[58px]">
                Новый<br />пароль
              </h1>
              <p className="mt-6 max-w-[380px] text-[16px] font-light leading-7 text-[#555]">
                Придумайте новый пароль для вашего аккаунта на cube-tech.ru. Он должен быть надёжным — минимум 6 символов, с заглавной буквой и спецсимволом.
              </p>
              <div className="mt-8 hidden md:block">
                <a href="/" className={LINK} onClick={(e) => { e.preventDefault(); goLogin(); }}>Вернуться ко входу</a>
              </div>
            </>
          )}
        </div>

        {/* Правая колонка — форма */}
        <div className="w-full max-w-[440px]">
          {done ? (
            <button className={BTN} onClick={goLogin}>Войти</button>
          ) : (
            <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
              <div>
                <label className={labelCls}>
                  Пароль <span className="text-carrot">*</span>
                </label>
                <input className={inputCls(err)} type="password" value={pass} autoFocus autoComplete="new-password"
                  onChange={(e) => { setPass(e.target.value); if (err) setErr(""); }} placeholder="Новый пароль" />
              </div>
              <div>
                <label className={labelCls}>
                  Повтор <span className="text-carrot">*</span>
                </label>
                <input className={inputCls(err)} type="password" value={pass2} autoComplete="new-password"
                  onChange={(e) => { setPass2(e.target.value); if (err) setErr(""); }} placeholder="Ещё раз" />
              </div>
              <div className="min-h-[20px] text-[13px] font-light leading-5 text-carrot">{err}</div>
              <div>
                <button className={BTN} type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Сохранить пароль"}</button>
              </div>
              <div className="mt-2 md:hidden">
                <a href="/" className={LINK} onClick={(e) => { e.preventDefault(); goLogin(); }}>Вернуться ко входу</a>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
