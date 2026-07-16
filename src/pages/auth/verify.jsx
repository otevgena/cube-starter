// src/pages/auth/verify.jsx
// Страница подтверждения почты по ссылке из письма: /verify-email?token=...
// При загрузке автоматически дергает /auth/verify и показывает результат.
import React from "react";
import { verifyEmail } from "@/lib/auth";

const BTN =
  "h-[56px] rounded-[10px] bg-black px-[18px] text-[17px] font-semibold tracking-[.02em] text-white transition-colors hover:bg-[#2f2f2f] active:translate-y-px disabled:opacity-60";

function getToken() {
  try { return new URLSearchParams(window.location.search).get("token") || ""; }
  catch { return ""; }
}

function goHome() {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function VerifyEmailPage() {
  const [state, setState] = React.useState("pending"); // pending | ok | error

  React.useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) { setState("error"); return; }
    (async () => {
      try {
        await verifyEmail(token);
        if (alive) setState("ok");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[520px] flex-col justify-center px-6 py-16 font-tight">
      <span className="mb-6 text-[56px] font-black leading-none tracking-[.02em] text-[#111]">c.</span>

      {state === "pending" && (
        <>
          <h1 className="mb-3 text-[26px] font-semibold leading-[1.2] text-[#111]">Подтверждаем почту…</h1>
          <p className="text-[15px] font-light leading-6 text-[#555]">Секунду, проверяем ссылку.</p>
        </>
      )}

      {state === "ok" && (
        <>
          <h1 className="mb-3 text-[26px] font-semibold leading-[1.2] text-[#111]">Почта подтверждена</h1>
          <p className="mb-8 text-[15px] font-light leading-6 text-[#555]">
            Спасибо! Ваш адрес электронной почты успешно подтверждён.
          </p>
          <button className={BTN} onClick={goHome}>На главную</button>
        </>
      )}

      {state === "error" && (
        <>
          <h1 className="mb-3 text-[26px] font-semibold leading-[1.2] text-[#111]">Ссылка недействительна</h1>
          <p className="mb-8 text-[15px] font-light leading-6 text-[#555]">
            Ссылка подтверждения устарела или уже была использована. Запросите новое письмо
            в настройках профиля.
          </p>
          <button className={BTN} onClick={goHome}>На главную</button>
        </>
      )}
    </div>
  );
}
