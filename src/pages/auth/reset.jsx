// src/pages/auth/reset.jsx
// Страница установки нового пароля по ссылке из письма: /reset?token=...
// Раскладка awwwards-референса: одна колонка, крупный заголовок сверху,
// широкие поля во всю ширину, тёмная кнопка. Ошибки/успех — всплывающим тостом.
import React from "react";
import { resetPassword } from "@/lib/auth";
import { toast } from "@/components/common/Toast.jsx";

const BTN =
  "inline-flex h-[58px] items-center justify-center rounded-[12px] bg-black px-9 text-[16px] font-semibold tracking-[.02em] text-white transition-colors hover:bg-[#2f2f2f] active:translate-y-px disabled:opacity-60";

// Slide-подчёркивание как у ссылок в модалках/«Генеральный директор»: серая база + выезжающая тёмная.
const LINK =
  "relative inline-block pb-0.5 font-semibold text-[#111] no-underline " +
  "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-neutral-300 before:content-[''] " +
  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#111] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full";

// Широкое поле во всю ширину (референс): почти белый бар, едва заметная рамка.
const inputCls =
  "h-[62px] w-full rounded-[12px] border border-[#e8e8e8] bg-white px-5 text-[16px] font-light text-[#111] outline-none transition-colors placeholder:font-light placeholder:text-[#bdbdbd] hover:border-[#d6d6d6] focus:border-[#999]";

const labelCls =
  "mb-2 block text-[12px] font-medium uppercase leading-none tracking-[.08em] text-[#8a8a8a]";

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
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!token) { toast("Ссылка недействительна или устарела. Запросите сброс заново.", { tone: "error" }); return; }
    const pe = policyError(pass);
    if (pe) { toast(pe, { tone: "error" }); return; }
    if (pass !== pass2) { toast("Пароли не совпадают.", { tone: "error" }); return; }
    try {
      setBusy(true);
      await resetPassword({ token, newPassword: pass });
      setDone(true);
      toast("Пароль изменён — теперь войдите с новым паролем.");
    } catch (e2) {
      if (e2.status === 400) {
        const p = (e2.payload && e2.payload.error) || "";
        if (/token/i.test(p)) toast("Ссылка недействительна или устарела. Запросите сброс заново.", { tone: "error" });
        else if (/short/i.test(p)) toast("Минимум 6 символов.", { tone: "error" });
        else if (/uppercase/i.test(p)) toast("Нужна хотя бы одна заглавная буква.", { tone: "error" });
        else if (/symbol/i.test(p)) toast("Нужен хотя бы один спецсимвол.", { tone: "error" });
        else toast("Не удалось изменить пароль. Проверьте данные.", { tone: "error" });
      } else {
        toast("Что-то пошло не так. Попробуйте позже.", { tone: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="font-tight">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-14 md:px-10 md:py-20">
        <span className="mb-10 block text-[38px] font-black leading-none tracking-[.02em] text-[#111]">c.</span>

        {done ? (
          <>
            <h1 className="text-[44px] font-black leading-[1.02] tracking-[-.01em] text-[#111] md:text-[64px]">
              Пароль изменён
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] font-light leading-7 text-[#666]">
              Теперь войдите с новым паролем. Все прежние сессии на других устройствах завершены.
            </p>
            <div className="mt-10">
              <button className={BTN} onClick={goLogin}>Войти</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[44px] font-black leading-[1.02] tracking-[-.01em] text-[#111] md:text-[64px]">
              Новый пароль
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] font-light leading-7 text-[#666]">
              Придумайте новый пароль для аккаунта на cube-tech.ru — минимум 6 символов, с заглавной буквой и спецсимволом.
            </p>

            <form className="mt-12 flex max-w-[1080px] flex-col gap-7" onSubmit={onSubmit} noValidate>
              <div>
                <label className={labelCls}>Пароль <span className="text-carrot">*</span></label>
                <input className={inputCls} type="password" value={pass} autoFocus autoComplete="new-password"
                  onChange={(e) => setPass(e.target.value)} placeholder="Новый пароль" />
              </div>
              <div>
                <label className={labelCls}>Повтор <span className="text-carrot">*</span></label>
                <input className={inputCls} type="password" value={pass2} autoComplete="new-password"
                  onChange={(e) => setPass2(e.target.value)} placeholder="Ещё раз" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
                <button className={BTN} type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Сохранить пароль"}</button>
                <a href="/" className={LINK} onClick={(e) => { e.preventDefault(); goLogin(); }}>Вернуться ко входу</a>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
