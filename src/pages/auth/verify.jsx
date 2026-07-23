// src/pages/auth/verify.jsx
// Страница подтверждения почты по ссылке из письма: /verify-email?token=...
// При загрузке автоматически дергает /auth/verify и показывает результат.
// Разметка 1-в-1 со страницы «Новый пароль» (reset.jsx) / «Контакты»:
// центральный заголовок, две колонки, во время проверки — брендовый «кружок с точками».
import React from "react";
import { verifyEmail, auth, refreshOnce } from "@/lib/auth";
import Spinner from "@/components/common/Spinner.jsx";

// Мягкое появление (как на остальном сайте: лёгкий подъём + проявление).
const RISE = "cubeRise .5s cubic-bezier(.2,.8,.2,1) both";

// Дедуп запроса по токену: страница может перемонтироваться (ремоунт роутера),
// и без этого /auth/verify улетал бы дважды — а токен одноразовый, второй раз
// давал бы «ссылка недействительна». Здесь один и тот же токен → один запрос.
const _verifyRuns = new Map(); // token -> Promise<data>
function verifyOnce(token) {
  if (!_verifyRuns.has(token)) _verifyRuns.set(token, verifyEmail(token));
  return _verifyRuns.get(token);
}

function getToken() {
  try { return new URLSearchParams(window.location.search).get("token") || ""; }
  catch { return ""; }
}

function goModal(name) {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
  setTimeout(() => { try { window.openModal?.(name); } catch {} }, 60);
}
const goLogin = () => goModal("login");
const goHome = () => {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
};
const goAccount = () => {
  window.history.pushState({}, "", "/account");
  window.dispatchEvent(new PopStateEvent("popstate"));
};

// Тихая вторичная ссылка «в нашем стиле»: серая база + выезжающая тёмная линия.
const LINK =
  "relative inline-block pb-0.5 text-sm font-semibold text-[#111] no-underline " +
  "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-neutral-300 before:content-[''] " +
  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#111] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full";

export default function VerifyEmailPage({ _preview = null }) {
  const [token] = React.useState(getToken);
  // "checking" | "ok" | "invalid"
  const [state, setState] = React.useState(_preview || (token ? "checking" : "invalid"));

  // Уже вошёл ли пользователь в ЭТОМ браузере? Письмо открывается в НОВОЙ
  // вкладке, поэтому sessionStorage пуст — надёжно скажет только рефреш по
  // httpOnly-cookie. Если сессия жива, кнопка ведёт прямо в кабинет, а не
  // просит логин заново (жалоба: «уже подтвердил и вроде вошёл, а спрашивает пароль»).
  const [authed, setAuthed] = React.useState(!!auth.get());
  React.useEffect(() => {
    if (_preview) return;
    const unsub = auth.subscribe((t) => setAuthed(!!t));
    refreshOnce({ force: true }).then((t) => { if (t) setAuthed(true); }).catch(() => {});
    return unsub;
  }, [_preview]);

  React.useEffect(() => {
    if (_preview) return; // витрина: состояние задано вручную, сеть не дёргаем
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const data = await verifyOnce(token);
        // Авто-вход: бэкенд выдал сессию — сразу поднимаем шапку в аватар и
        // ведём кнопку «В личный кабинет», без повторного логина.
        if (data && data.accessToken) {
          try { window.setHeaderUser?.(data.user, data.accessToken); } catch {}
          if (alive) setAuthed(true);
        }
        if (alive) setState("ok");
      } catch {
        if (alive) setState("invalid");
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const heading = state === "ok" ? "ПОЧТА ПОДТВЕРЖДЕНА" : state === "invalid" ? "ССЫЛКА УСТАРЕЛА" : "ПОДТВЕРЖДАЕМ ПОЧТУ";

  return (
    <section className="bg-page font-tight text-ink -mt-8" aria-label="Подтверждение почты">
      <style>{`@keyframes cubeRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Шапка — как «Восстановление доступа» */}
      <div className="text-center text-sm font-light leading-7">Подтверждение почты</div>
      <div className="mt-[26px] text-center">
        <h2 key={heading} className="font-semibold uppercase leading-none h-hero" style={{ animation: RISE }}>
          {heading}
        </h2>
      </div>

      {/* Пока проверяем ссылку — наш брендовый «кружок с точками» */}
      {state === "checking" ? (
        <div key="checking" className="mt-14 flex justify-center lg:mt-20" style={{ animation: RISE }}>
          <Spinner size={34} />
        </div>
      ) : (
        <div key={state} className="mx-4 mt-12 grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:mx-[52px] lg:mt-20 xl:grid-cols-[1fr_auto]" style={{ animation: RISE }}>
          {/* Левый текст */}
          <div className="max-w-[760px] text-left">
            {state === "ok" ? (
              <>
                <p className="text-[21px] font-semibold leading-7">Готово!</p>
                <p className="mt-2 text-[21px] font-semibold leading-7">Ваш адрес электронной почты подтверждён.</p>
                <p className="mt-[18px] text-sm font-light leading-6">
                  {authed
                    ? "Вы уже вошли — можно сразу перейти в личный кабинет."
                    : "Теперь можно войти в личный кабинет с вашим логином и паролем."}
                </p>
              </>
            ) : (
              <>
                <p className="text-[21px] font-semibold leading-7">Ссылка недействительна</p>
                <p className="mt-2 text-[21px] font-semibold leading-7">или уже использована.</p>
                <p className="mt-[18px] text-sm font-light leading-6">
                  Ссылка из письма действует 24 часа и срабатывает один раз.
                </p>
                <p className="mt-1.5 text-sm font-light leading-6">
                  Если почта ещё не подтверждена — войдите, и мы предложим отправить письмо заново.
                </p>
              </>
            )}
          </div>

          {/* Правая колонка: кнопка входа + тихая вторичная ссылка (пространство под кнопкой) */}
          <div className="w-[683px] max-w-full text-left">
            <button
              type="button"
              onClick={state === "ok" && authed ? goAccount : goLogin}
              className="block h-[60px] w-[210px] rounded-[10px] bg-[#1c1c1c] text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-[#2a2a2a]"
            >
              {state === "ok" && authed ? "В личный кабинет" : "Войти"}
            </button>
            <button type="button" onClick={goHome} className={`${LINK} mt-5`}>
              На главную
            </button>
          </div>
        </div>
      )}

      <div className="h-0 lg:h-[58px]" />
    </section>
  );
}
