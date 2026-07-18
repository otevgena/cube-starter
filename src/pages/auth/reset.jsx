// src/pages/auth/reset.jsx
// Страница установки нового пароля по ссылке из письма: /reset?token=...
// Разметка 1-в-1 со страницы «Контакты» (src/components/blocks/Contact.jsx):
// центральный заголовок как «КОНТАКТЫ» (текст над и под), две колонки,
// поля-подчёркивания без контура, ошибки — морковным текстом под полем.
import React from "react";
import { resetPassword, checkResetToken } from "@/lib/auth";
import Spinner from "@/components/common/Spinner.jsx";

// Мягкое появление (как на остальном сайте: лёгкий подъём + проявление).
const RISE = "cubeRise .5s cubic-bezier(.2,.8,.2,1) both";

// ==== стили, скопированные из Contact.jsx (чтобы НЕ отличались) ====
const LABEL_CLASS = "block text-left text-xs font-light uppercase tracking-[0.04em] text-[#a7a7a7]";
const fieldClass = (err) =>
  `block h-12 w-[683px] max-w-full border-0 border-b bg-white px-3.5 text-sm font-normal leading-6 text-black outline-none transition-colors duration-500 ${
    err ? "border-[#fa5d29]" : "border-line focus:border-[#999]"
  }`;

/* Слот ошибки под полем (фикс. высота, вёрстка не прыгает) — как в Contact */
function ErrorSlot({ text }) {
  return (
    <div className="relative h-[22px]">
      {text ? (
        <span className="absolute left-0 top-[11px] text-[11px] font-light leading-[11px] text-[#fa5d29]">{text}</span>
      ) : null}
    </div>
  );
}

// Клиентская проверка (зеркалит серверную политику: ≥6, заглавная, спецсимвол)
function policyError(pwd) {
  const s = String(pwd || "");
  if (!s) return "Введите пароль.";
  if (s.length < 6) return "Минимум 6 символов.";
  if (!/[A-ZА-ЯЁ]/.test(s)) return "Нужна хотя бы одна заглавная буква.";
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(s)) return "Нужен хотя бы один спецсимвол.";
  return null;
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
const goForgot = () => goModal("forgot");

export default function ResetPasswordPage() {
  const [token] = React.useState(getToken);
  const [pass, setPass] = React.useState("");
  const [pass2, setPass2] = React.useState("");
  const [errors, setErrors] = React.useState({});   // { pass, pass2 }
  const [formErr, setFormErr] = React.useState("");  // общая ошибка под кнопкой
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  // Проверка ссылки ПРИ ЗАГРУЗКЕ: "checking" | "valid" | "invalid".
  // Мёртвую/протухшую ссылку не даём даже открыть — сразу «ссылка устарела».
  const [tokenState, setTokenState] = React.useState(token ? "checking" : "invalid");

  React.useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const r = await checkResetToken(token);
        if (alive) setTokenState(r && r.valid ? "valid" : "invalid");
      } catch {
        // сеть/сервер недоступны — не блокируем, пусть проверится на сабмите
        if (alive) setTokenState("valid");
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const clearErr = (field) => setErrors((e) => (e[field] ? { ...e, [field]: "" } : e));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setFormErr("");

    const next = {};
    const pe = policyError(pass);
    if (pe) next.pass = pe;
    if (!pass2) next.pass2 = "Повторите пароль.";
    else if (pass !== pass2) next.pass2 = "Пароли не совпадают.";
    if (!token) setFormErr("Ссылка недействительна или устарела. Запросите сброс заново.");
    setErrors(next);
    if (Object.keys(next).length || !token) return;

    try {
      setBusy(true);
      await resetPassword({ token, newPassword: pass });
      setDone(true);
    } catch (e2) {
      const p = (e2 && e2.payload && e2.payload.error) || "";
      if (e2 && e2.status === 400) {
        if (/token/i.test(p)) setTokenState("invalid");
        else if (/short/i.test(p)) setErrors((x) => ({ ...x, pass: "Минимум 6 символов." }));
        else if (/uppercase/i.test(p)) setErrors((x) => ({ ...x, pass: "Нужна хотя бы одна заглавная буква." }));
        else if (/symbol/i.test(p)) setErrors((x) => ({ ...x, pass: "Нужен хотя бы один спецсимвол." }));
        else setFormErr("Не удалось изменить пароль. Проверьте данные.");
      } else {
        setFormErr("Что-то пошло не так. Попробуйте позже.");
      }
    } finally {
      setBusy(false);
    }
  };

  const phase = done ? "done" : tokenState === "invalid" ? "invalid" : tokenState === "checking" ? "checking" : "form";
  const heading = phase === "done" ? "ПАРОЛЬ ИЗМЕНЁН" : phase === "invalid" ? "ССЫЛКА УСТАРЕЛА" : "НОВЫЙ ПАРОЛЬ";

  return (
    <section className="bg-page font-tight text-ink -mt-8" aria-label="Новый пароль">
      <style>{`@keyframes cubeRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Шапка — как «Напишите нам» / «КОНТАКТЫ» */}
      <div className="text-center text-sm font-light leading-7">Восстановление доступа</div>
      <div className="mt-[26px] text-center">
        {/* key по тексту заголовка → при смене фазы (НОВЫЙ ПАРОЛЬ → ССЫЛКА УСТАРЕЛА)
            заголовок мягко переигрывает появление */}
        <h2 key={heading} className="font-semibold uppercase leading-none h-hero" style={{ animation: RISE }}>
          {heading}
        </h2>
      </div>

      {/* Пока проверяем ссылку — вместо текста наш брендовый «кружок с точками» */}
      {phase === "checking" ? (
        <div key="checking" className="mt-14 flex justify-center lg:mt-20" style={{ animation: RISE }}>
          <Spinner size={34} />
        </div>
      ) : (
      /* Колонки: слева текст, справа форма — key по фазе для плавной смены */
      <div key={phase} className="mx-4 mt-12 grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:mx-[52px] lg:mt-20 xl:grid-cols-[1fr_auto]" style={{ animation: RISE }}>
        {/* Левый текст */}
        <div className="max-w-[760px] text-left">
          {phase === "done" ? (
            <>
              <p className="text-[21px] font-semibold leading-7">Готово!</p>
              <p className="mt-2 text-[21px] font-semibold leading-7">Пароль обновлён.</p>
              <p className="mt-[18px] text-sm font-light leading-6">
                Теперь войдите с новым паролем.
              </p>
              <p className="mt-1.5 text-sm font-light leading-6">
                Все прежние сессии на других устройствах завершены.
              </p>
            </>
          ) : phase === "invalid" ? (
            <>
              <p className="text-[21px] font-semibold leading-7">Ссылка недействительна</p>
              <p className="mt-2 text-[21px] font-semibold leading-7">или уже использована.</p>
              <p className="mt-[18px] text-sm font-light leading-6">
                Ссылка для сброса пароля действует 30 минут и срабатывает один раз.
              </p>
              <p className="mt-1.5 text-sm font-light leading-6">
                Запросите новую — на почту придёт свежее письмо со ссылкой.
              </p>
            </>
          ) : (
            <>
              <p className="text-[21px] font-semibold leading-7">Придумайте новый пароль</p>
              <p className="mt-2 text-[21px] font-semibold leading-7">для входа на cube-tech.ru.</p>
              <p className="mt-[18px] text-sm font-light leading-6">
                Минимум 6 символов, хотя бы одна заглавная буква и один спецсимвол.
              </p>
              <p className="mt-1.5 text-sm font-light leading-6">
                После сохранения все прежние сессии на других устройствах завершатся.
              </p>
            </>
          )}
        </div>

        {/* Правая колонка: форма / кнопка входа / запрос новой ссылки */}
        {phase === "done" ? (
          <div className="w-[683px] max-w-full text-left">
            <button
              type="button"
              onClick={goLogin}
              className="block h-[60px] w-[210px] rounded-[10px] bg-black text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-neutral-800"
            >
              Войти
            </button>
          </div>
        ) : phase === "invalid" ? (
          <div className="w-[683px] max-w-full text-left">
            <button
              type="button"
              onClick={goForgot}
              className="block h-[60px] w-[240px] rounded-[10px] bg-black text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-neutral-800"
            >
              Запросить новую ссылку
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="w-[683px] max-w-full text-left">
            {/* Пароль */}
            <div>
              <label className={LABEL_CLASS}>пароль (*)</label>
              <input
                type="password" value={pass} autoFocus autoComplete="new-password"
                onChange={(e) => { setPass(e.target.value); clearErr("pass"); }}
                className={fieldClass(!!errors.pass)}
              />
              <ErrorSlot text={errors.pass} />
            </div>

            {/* Повтор */}
            <div className="mt-3">
              <label className={LABEL_CLASS}>повтор (*)</label>
              <input
                type="password" value={pass2} autoComplete="new-password"
                onChange={(e) => { setPass2(e.target.value); clearErr("pass2"); }}
                className={fieldClass(!!errors.pass2)}
              />
              <ErrorSlot text={errors.pass2} />
            </div>

            {/* Кнопка — как «Оставить заявку». Во время сохранения вместо кнопки
                показываем брендовый «кружок с точками» в том же боксе (60×210). */}
            {busy ? (
              <div className="mt-[22px] flex h-[60px] w-[210px] items-center justify-center">
                <Spinner size={28} />
              </div>
            ) : (
              <button
                type="submit"
                className="mt-[22px] block h-[60px] w-[210px] rounded-[10px] bg-black text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-neutral-800"
              >
                Сохранить пароль
              </button>
            )}
            <ErrorSlot text={formErr} />
          </form>
        )}
      </div>
      )}

      <div className="h-0 lg:h-[58px]" />
    </section>
  );
}
