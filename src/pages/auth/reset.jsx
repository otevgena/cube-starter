// src/pages/auth/reset.jsx
// Страница установки нового пароля по ссылке из письма: /reset?token=...
// Раскладка awwwards-референса: одна колонка, крупный заголовок сверху,
// широкие поля во всю ширину, тёмная кнопка. Ошибки/успех — всплывающим тостом.
import React from "react";
import { resetPassword } from "@/lib/auth";
import { toast } from "@/components/common/Toast.jsx";

// Тёмная кнопка как в референсе awwwards: почти квадратный бокс, лёгкое скругление.
const BTN =
  "inline-flex h-[64px] items-center justify-center rounded-[6px] bg-[#1a1a1a] px-9 text-[16px] font-semibold text-white transition-colors hover:bg-[#2f2f2f] active:translate-y-px disabled:opacity-60";

// Поле-бокс как в референсе: белый прямоугольник во всю ширину, КВАДРАТНЫЕ углы,
// едва заметная рамка + мягкая тень (приподнятый белый блок на сером фоне).
const inputCls =
  "h-[64px] w-full rounded-[2px] border border-[#ececec] bg-white px-5 text-[16px] font-light text-[#111] shadow-[0_1px_2px_rgba(0,0,0,.04)] outline-none transition-colors placeholder:font-light placeholder:text-[#c2c2c2] hover:border-[#dcdcdc] focus:border-[#999]";

// Метка как в референсе: серая, капсом, с «(*)» тем же цветом.
const labelCls =
  "mb-3 block text-[13px] font-medium uppercase leading-none tracking-[.06em] text-[#9a9a9a]";

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
        {done ? (
          <>
            <h1 className="text-[44px] font-black leading-[1.02] tracking-[-.01em] text-[#111] md:text-[64px]">
              Пароль изменён
            </h1>
            <div className="mt-14 max-w-[1080px]">
              <button className={BTN} onClick={goLogin}>Войти</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[44px] font-black leading-[1.02] tracking-[-.01em] text-[#111] md:text-[64px]">
              Новый пароль
            </h1>

            <form className="mt-14 flex max-w-[1080px] flex-col gap-8" onSubmit={onSubmit} noValidate>
              <div>
                <label className={labelCls}>Пароль (*)</label>
                <input className={inputCls} type="password" value={pass} autoFocus autoComplete="new-password"
                  onChange={(e) => setPass(e.target.value)} placeholder="Новый пароль" />
              </div>
              <div>
                <label className={labelCls}>Повтор (*)</label>
                <input className={inputCls} type="password" value={pass2} autoComplete="new-password"
                  onChange={(e) => setPass2(e.target.value)} placeholder="Повторите пароль" />
              </div>
              <div className="mt-2">
                <button className={BTN} type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Сохранить пароль"}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
