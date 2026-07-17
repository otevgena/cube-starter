// src/pages/auth/reset.jsx
// Страница установки нового пароля по ссылке из письма: /reset?token=...
// Разметка 1-в-1 со страницы «Контакты» (src/components/blocks/Contact.jsx):
// центральный заголовок как «КОНТАКТЫ» (текст над и под), две колонки,
// поля-подчёркивания без контура, ошибки — морковным текстом под полем.
import React from "react";
import { resetPassword } from "@/lib/auth";

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

function goLogin() {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
  setTimeout(() => { try { window.openModal?.("login"); } catch {} }, 60);
}

export default function ResetPasswordPage() {
  const [token] = React.useState(getToken);
  const [pass, setPass] = React.useState("");
  const [pass2, setPass2] = React.useState("");
  const [errors, setErrors] = React.useState({});   // { pass, pass2 }
  const [formErr, setFormErr] = React.useState("");  // общая ошибка под кнопкой
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

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
        if (/token/i.test(p)) setFormErr("Ссылка недействительна или устарела. Запросите сброс заново.");
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

  return (
    <section className="bg-page font-tight text-ink pt-14" aria-label="Новый пароль">
      {/* Шапка — как «Напишите нам» / «КОНТАКТЫ» */}
      <div className="text-center text-sm font-light leading-7">Восстановление доступа</div>
      <div className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none h-hero">
          {done ? "ПАРОЛЬ ИЗМЕНЁН" : "НОВЫЙ ПАРОЛЬ"}
        </h2>
      </div>

      {/* Колонки: слева текст, справа форма */}
      <div className="mx-4 mt-12 grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:mx-[52px] lg:mt-20 xl:grid-cols-[1fr_auto]">
        {/* Левый текст */}
        <div className="max-w-[760px] text-left">
          {done ? (
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

        {/* Правая колонка: форма или кнопка входа */}
        {done ? (
          <div className="w-[683px] max-w-full text-left">
            <button
              type="button"
              onClick={goLogin}
              className="block h-[60px] w-[210px] rounded-[10px] bg-black text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-neutral-800"
            >
              Войти
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

            {/* Кнопка — как «Оставить заявку» */}
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy ? "true" : "false"}
              className="mt-[22px] block h-[60px] w-[210px] rounded-[10px] bg-black text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-85"
            >
              {busy ? "Сохранение..." : "Сохранить пароль"}
            </button>
            <ErrorSlot text={formErr} />
          </form>
        )}
      </div>

      <div className="h-0 lg:h-[58px]" />
    </section>
  );
}
