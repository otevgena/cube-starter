// src/components/common/Modals.jsx
// Модалки Вход / Регистрация / Восстановление / Custom — чистый Tailwind, без <style> и легаси .about-hero-*.
import React from "react";
import { createPortal } from "react-dom";
import { registerUser, loginUser, verifyTwoFactor, requestPasswordReset, auth } from "@/lib/auth";
import { CenterSpinner } from "@/components/common/Spinner.jsx";

/* После входа: если сохранён returnTo (напр. из ссылки в письме), возвращаем туда. */
function returnToAfterLogin() {
  let back = "";
  try {
    back = sessionStorage.getItem("auth:returnTo") || "";
    sessionStorage.removeItem("auth:returnTo");
  } catch {}
  if (back && back.startsWith("/account")) {
    setTimeout(() => {
      try {
        window.history.pushState({}, "", back);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch { window.location.href = back; }
    }, 60);
  }
}

/* ===== Хост модалок (API: window.openModal("register"|"login"|"forgot"|"custom", props)) ===== */
export default function ModalsHost() {
  const [view, setView] = React.useState(null);
  const [props, setProps] = React.useState({});

  React.useEffect(() => {
    window.openModal = (v, p = {}) => { setProps(p || {}); setView(v); };
    window.closeModal = () => setView(null);
    return () => { delete window.openModal; delete window.closeModal; };
  }, []);

  // скрываем StickyDock на время модалки
  React.useEffect(() => {
    document.body.classList.toggle("has-modal", Boolean(view));
    return () => document.body.classList.remove("has-modal");
  }, [view]);

  // блокируем скролл под модалкой без «прыжка» (html overflow + scrollbar-gutter:stable)
  React.useEffect(() => {
    if (!view) return;
    const root = document.documentElement;
    // !important — иначе html{overflow-y:scroll !important} из index.css не даст залочить скролл
    root.style.setProperty("overflow", "hidden", "important");
    return () => { root.style.removeProperty("overflow"); };
  }, [view]);

  if (!view) return null;

  return createPortal(
    <ModalShell onClose={() => setView(null)} width={980}>
      {view === "register" && <RegisterForm email={props.email} />}
      {view === "login" && <LoginForm />}
      {view === "forgot" && <ForgotForm />}
      {view === "custom" && <CustomCard {...props} />}
      {view === "review" && <div>{props.content}</div>}
    </ModalShell>,
    document.body
  );
}

/* ===== Общие классы ===== */
export const BTN =
  "h-[72px] rounded-[10px] bg-black px-[18px] text-[18px] font-semibold tracking-[.02em] text-white transition-colors hover:bg-[#2f2f2f] active:translate-y-px disabled:opacity-60";
// подчёркивание как у «Генеральный директор»: серая база + выезжающая тёмная линия
export const LINK =
  "relative inline-block pb-0.5 font-semibold text-[#111] no-underline " +
  "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-neutral-300 before:content-[''] " +
  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#111] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full";
const MUTED_LINK = "font-semibold text-[#111]";
export const inputCls = (err) =>
  "h-[42px] border-0 border-b bg-transparent px-0.5 font-light text-[#111] outline-none transition-colors placeholder:font-light placeholder:text-[#c7c7c7] " +
  (err ? "border-carrot" : "border-[#ededed] focus:border-[#d2d2d2]");

/* ===== Слот ошибки (фикс. высота, верстка не прыгает) ===== */
export function ErrorSlot({ text }) {
  return (
    <div className="relative h-[22px]">
      {text ? (
        <span className="absolute left-0 top-[11px] text-[11px] font-light leading-[11px] text-carrot">{text}</span>
      ) : null}
    </div>
  );
}

/* ===== Кастомный чекбокс ===== */
export function FancyCheckbox({ checked, onChange, ariaLabel }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-grid h-[18px] w-[18px] flex-none cursor-pointer select-none place-items-center rounded border border-[#d9d9d9]"
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-[3px] bg-[#111] transition-transform duration-150"
        style={{ transform: checked ? "scale(1)" : "scale(0)" }}
      />
    </span>
  );
}

/* ===== Оболочка модалки ===== */
function ModalShell({ children, onClose, width }) {
  React.useEffect(() => {
    const onKey = (e) => { if ((e.key || "").toLowerCase() === "escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] animate-svcfade bg-black/55 font-tight md:flex md:items-center md:justify-center md:p-6"
      onClick={onClose}
    >
      <div
        className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-white text-[#111] md:h-auto md:max-h-[calc(100dvh-48px)] md:w-[var(--mw)] md:overflow-hidden md:rounded-[10px] md:border md:border-[#dcdcdc] md:shadow-[0_16px_48px_rgba(0,0,0,.35)]"
        style={{ ["--mw"]: `min(${width || 980}px, calc(100vw - 48px))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* крестик — мобилка: тёмный квадрат в правом верхнем углу (как awwwards) */}
      <button
        type="button"
        aria-label="Закрыть"
        title="Закрыть"
        onClick={onClose}
        className="fixed right-0 top-0 z-[1001] grid h-14 w-14 place-items-center bg-[#111] text-white transition-colors hover:bg-[#262626] md:hidden"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* крестик — десктоп: плитка внизу справа (на месте дока) */}
      <button
        type="button"
        aria-label="Закрыть"
        title="Закрыть"
        onClick={onClose}
        className="fixed right-6 z-[1001] hidden h-[60px] w-[60px] place-items-center rounded-xl bg-[#111] text-white shadow-[0_8px_24px_rgba(0,0,0,.35)] transition-colors hover:bg-[#262626] md:grid"
        style={{ bottom: "calc(var(--dock-bottom, 21px) + (var(--dock-h, 72px) - var(--dock-left-tile, 60px)) / 2)" }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/* ===== Каркас формы: левая графит-панель + правая колонка ===== */
export function FormShell({ welcome, bottom, title, children }) {
  return (
    <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[1fr_1.35fr]">
      <aside className="grid grid-rows-[auto_1fr_auto] gap-[18px] bg-[#ededed] p-7 text-[#111]">
        <div className="text-[18px] font-semibold leading-tight">{welcome}</div>
        <div className="grid place-items-center gap-[30px]">
          <span className="text-[72px] font-black leading-none tracking-[.02em] text-[#111]">c.</span>
          <SmileBadge />
        </div>
        <div className="text-sm leading-snug text-[#666]">{bottom}</div>
      </aside>

      <section className="grid grid-rows-[auto_1fr_auto] bg-white px-6 py-8 md:px-9 md:py-[34px]">
        <h2 className="mb-[22px] text-[22px] font-semibold leading-[1.25] text-[#111]">{title}</h2>
        {children}
      </section>
    </div>
  );
}

export const Label = ({ children }) => (
  <span className="mb-1.5 text-[11px] font-light uppercase leading-none tracking-[.08em] text-[#666]">{children}</span>
);

function SocialSlab({ text }) {
  return (
    <div className="mt-3.5 self-end">
      <div className="mb-1.5 mt-2 text-left text-sm font-light text-[#111]">{text}</div>
      <button
        type="button"
        onClick={() => alert("Google OAuth — заглушка")}
        className="flex h-12 w-full items-center justify-center gap-1 rounded-[10px] border border-[#e1e1e1] bg-white px-4 text-sm font-light text-[#111] hover:bg-page"
      >
        <span className="grid h-[26px] w-[26px] place-items-center text-[22px] font-extrabold leading-[26px]">G</span>
        <span>Google</span>
      </button>
    </div>
  );
}

/* ===== Регистрация ===== */
function RegisterForm({ email = "" }) {
  const [form, setForm] = React.useState({ user: "", email, pass: "", pass2: "", news: false, agree: false });
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const es = {};
    if (!form.user.trim()) es.user = "Это значение не должно быть пустым.";
    if (!form.email.trim()) es.email = "Это значение не должно быть пустым.";
    else if (!isEmail(form.email)) es.email = "Неверный формат электронного адреса.";
    if (!form.pass) es.pass = "Это значение не должно быть пустым.";
    if (!form.pass2) es.pass2 = "Это значение не должно быть пустым.";
    if (form.pass && form.pass2 && form.pass !== form.pass2) es.pass2 = "Пароли не совпадают.";
    if (!form.agree) es.agree = "Подтвердите, что ознакомлены с условиями и принимаете их.";
    setErrors(es);
    if (Object.keys(es).length) return;

    try {
      setBusy(true);
      const { user, accessToken } = await registerUser({
        name: form.user.trim(),
        email: form.email.trim(),
        password: form.pass,
      });
      auth.set(accessToken, false);
      if (window.setHeaderUser) window.setHeaderUser(user, accessToken);
      if (window.closeModal) window.closeModal();
    } catch (err) {
      if (err.status === 409) setErrors({ ...es, email: "Аккаунт с такой почтой уже зарегистрирован." });
      else if (err.status === 400) setErrors({ ...es, email: "Проверьте корректность введённых данных." });
      else window.openModal("custom", { title: "Ошибка", content: <div>{err.message}</div>, width: 560 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormShell
      welcome="Добро пожаловать!"
      title="Регистрация по почте"
      bottom={
        <>
          Уже являетесь участником?{" "}
          <a className={LINK} href="/login" onClick={(e) => { e.preventDefault(); window.openModal("login"); }}>Войдите</a>
        </>
      }
    >
      <form className="flex flex-col gap-[14px] self-start sm:grid sm:grid-cols-2 sm:gap-x-[18px] sm:gap-y-[14px]" onSubmit={onSubmit} noValidate>
        <div className="col-span-2 flex flex-col">
          <Label>ИМЯ ПОЛЬЗОВАТЕЛЯ (*)</Label>
          <input className={inputCls(errors.user)} type="text" value={form.user}
            onChange={(e) => { set("user", e.target.value); if (errors.user) setErrors({ ...errors, user: "" }); }}
            placeholder="Имя пользователя" />
          <ErrorSlot text={errors.user} />
        </div>

        <div className="col-span-2 flex flex-col">
          <Label>ПОЧТА (*)</Label>
          <input className={inputCls(errors.email)} type="email" value={form.email}
            onChange={(e) => { set("email", e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
            placeholder="имя@домен.ру" />
          <ErrorSlot text={errors.email} />
        </div>

        <div className="flex flex-col">
          <Label>ПАРОЛЬ (*)</Label>
          <input className={inputCls(errors.pass)} type="password" value={form.pass}
            onChange={(e) => { set("pass", e.target.value); if (errors.pass) setErrors({ ...errors, pass: "" }); }}
            placeholder="Пароль" />
          <ErrorSlot text={errors.pass} />
        </div>

        <div className="flex flex-col">
          <Label>ПОВТОР ПАРОЛЯ (*)</Label>
          <input className={inputCls(errors.pass2)} type="password" value={form.pass2}
            onChange={(e) => { set("pass2", e.target.value); if (errors.pass2) setErrors({ ...errors, pass2: "" }); }}
            placeholder="Ещё раз" />
          <ErrorSlot text={errors.pass2} />
        </div>

        <p className="col-span-2 mb-0.5 mt-1.5 text-sm font-light leading-5 text-[#555]">
          Мы можем информировать вас по электронной почте о продуктах и услугах. <span className={MUTED_LINK}>Подробнее —</span>
        </p>

        <div className="col-span-2 flex items-center gap-2.5 text-sm font-light text-[#111]">
          <FancyCheckbox checked={!!form.news} onChange={(v) => set("news", v)} ariaLabel="Связываться со мной по почте" />
          <span>Связываться со мной по почте</span>
        </div>

        <div className="col-span-2 flex items-center gap-2.5 text-sm font-light text-[#111]">
          <FancyCheckbox checked={!!form.agree}
            onChange={(v) => { set("agree", v); if (errors.agree) setErrors({ ...errors, agree: "" }); }}
            ariaLabel="Принять условия" />
          <span>
            Я прочитал(а) и принимаю <span className={MUTED_LINK}>Правовые положения</span> и{" "}
            <span className={MUTED_LINK}>Политику конфиденциальности</span>.
          </span>
        </div>
        <div className="col-span-2"><ErrorSlot text={errors.agree} /></div>

        <div className="col-span-2 mt-2">
          <button className={`${BTN} w-full`} type="submit" disabled={busy}>Создать аккаунт</button>
        </div>
      </form>

      <SocialSlab text="или зарегистрируйтесь через" />
    </FormShell>
  );
}

/* ===== Вход ===== */
function LoginForm() {
  const [form, setForm] = React.useState({ id: "", pass: "", keep: false });
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Второй шаг при 2FA
  const [twofa, setTwofa] = React.useState(null); // { challenge, remember } | null
  const [code, setCode] = React.useState("");
  const [codeErr, setCodeErr] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const es = {};
    if (!form.id.trim()) es.id = "Это значение не должно быть пустым.";
    if (!form.pass.trim()) es.pass = "Это значение не должно быть пустым.";
    setErrors(es);
    if (Object.keys(es).length) return;

    try {
      setBusy(true);
      const res = await loginUser({ idOrEmail: form.id.trim(), password: form.pass, remember: !!form.keep });
      if (res && res.twoFactorRequired) {
        // переходим ко второму шагу — ввод кода из приложения
        setTwofa({ challenge: res.challenge, remember: res.remember });
        setCode(""); setCodeErr("");
        return;
      }
      if (window.setHeaderUser) window.setHeaderUser(res.user, res.accessToken);
      if (window.closeModal) window.closeModal();
      returnToAfterLogin();
    } catch (err) {
      if (err.status === 400) setErrors({ ...es, id: "Укажите e-mail или логин и пароль." });
      else if (err.status === 401) setErrors({ id: "Неверный e-mail/логин или пароль.", pass: "Проверьте пароль." });
      else window.openModal("custom", { title: "Ошибка", content: <div>{err.message}</div>, width: 560 });
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    if (busy) return;
    const c = code.trim();
    if (!c) { setCodeErr("Введите код."); return; }
    try {
      setBusy(true);
      setCodeErr("");
      const { user, accessToken } = await verifyTwoFactor({ challenge: twofa.challenge, code: c, remember: twofa.remember });
      if (window.setHeaderUser) window.setHeaderUser(user, accessToken);
      if (window.closeModal) window.closeModal();
      returnToAfterLogin();
    } catch (err) {
      if (err.status === 401) {
        // просроченный challenge — на первый шаг; неверный код — остаёмся
        if (/challenge/i.test(err.message || "")) {
          setTwofa(null);
          setErrors({ pass: "Сессия подтверждения истекла. Войдите заново." });
        } else {
          setCodeErr("Неверный код. Попробуйте ещё раз.");
        }
      } else {
        window.openModal("custom", { title: "Ошибка", content: <div>{err.message}</div>, width: 560 });
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Второй шаг: ввод кода 2FA ──
  if (twofa) {
    return (
      <FormShell
        welcome="Ещё один шаг"
        title="Двухфакторная защита"
        bottom={
          <>
            Не приходит код?{" "}
            <a className={LINK} href="#" onClick={(e) => { e.preventDefault(); setTwofa(null); }}>Вернуться ко входу</a>
          </>
        }
      >
        {busy ? <CenterSpinner minHeight={320} label="Проверяем код…" /> : (
        <form className="grid grid-cols-2 gap-x-[18px] gap-y-[14px] self-start" onSubmit={onVerify} noValidate>
          <div className="col-span-2 text-sm font-light text-[#555]">
            Введите 6-значный код из приложения-аутентификатора или один из резервных кодов.
          </div>
          <div className="col-span-2 flex flex-col">
            <Label>КОД ПОДТВЕРЖДЕНИЯ (*)</Label>
            <input className={inputCls(codeErr)} type="text" inputMode="text" autoFocus
              value={code} autoComplete="one-time-code"
              onChange={(e) => { setCode(e.target.value); if (codeErr) setCodeErr(""); }}
              placeholder="123456 или xxxx-xxxx-xx" />
            <ErrorSlot text={codeErr} />
          </div>
          <div className="col-span-2 mt-2">
            <button className={`${BTN} w-full`} type="submit" disabled={busy}>Подтвердить</button>
          </div>
          <div className="col-span-2 mt-1">
            <button type="button" className={`${LINK} text-[11px] leading-[11px]`}
              onClick={() => setTwofa(null)}>Назад ко входу</button>
          </div>
        </form>
        )}
      </FormShell>
    );
  }

  return (
    <FormShell
      welcome="С возвращением!"
      title="Вход"
      bottom={
        <>
          Ещё не зарегистрированы?{" "}
          <a className={LINK} href="/register" onClick={(e) => { e.preventDefault(); window.openModal("register"); }}>Зарегистрируйтесь сейчас</a>
        </>
      }
    >
      {busy ? <CenterSpinner minHeight={360} label="Входим в аккаунт…" /> : (<>
      <form className="grid grid-cols-2 gap-x-[18px] gap-y-[14px] self-start" onSubmit={onSubmit} noValidate>
        <div className="col-span-2 flex flex-col">
          <Label>ПОЧТА ИЛИ ИМЯ ПОЛЬЗОВАТЕЛЯ (*)</Label>
          <input className={inputCls(errors.id)} type="text" value={form.id}
            onChange={(e) => { set("id", e.target.value); if (errors.id) setErrors({ ...errors, id: "" }); }}
            placeholder="имя@домен.ру или логин" />
          <ErrorSlot text={errors.id} />
        </div>

        <div className="col-span-2 flex flex-col">
          <Label>ПАРОЛЬ (*)</Label>
          <input className={inputCls(errors.pass)} type="password" value={form.pass}
            onChange={(e) => { set("pass", e.target.value); if (errors.pass) setErrors({ ...errors, pass: "" }); }}
            placeholder="Пароль" />
          <ErrorSlot text={errors.pass} />
        </div>

        <div className="col-span-2 flex items-center gap-2.5 text-sm font-light text-[#111]">
          <FancyCheckbox checked={!!form.keep} onChange={(v) => set("keep", v)} ariaLabel="Не выходить из системы" />
          <span>Не выходить из системы</span>
        </div>

        <div className="col-span-2 mt-2">
          <button className={`${BTN} w-full`} type="submit" disabled={busy}>Войти</button>
        </div>

        <div className="col-span-2 mt-2 flex justify-end">
          <a href="/forgot" className={`${LINK} text-[11px] leading-[11px]`}
            onClick={(e) => { e.preventDefault(); window.openModal("forgot"); }}>
            Забыли пароль?
          </a>
        </div>
      </form>

      <SocialSlab text="Или войдите через" />
      </>)}
    </FormShell>
  );
}

/* ===== Восстановление пароля ===== */
function ForgotForm() {
  const [id, setId] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(null); // адрес, на который отправили | null
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const es = {};
    if (!id.trim()) es.id = "Это значение не должно быть пустым.";
    else if (!isEmail(id)) es.id = "Введите корректный e-mail (сейчас сброс по e-mail).";
    setErrors(es);
    if (Object.keys(es).length) return;

    try {
      setBusy(true);
      // Ответ всегда 200 — не раскрываем, зарегистрирован ли адрес.
      await requestPasswordReset(id.trim());
    } catch {
      // Даже при сбое показываем нейтральное сообщение (не палим существование аккаунта).
    } finally {
      setBusy(false);
    }

    // Успех показываем в том же брендовом окне (а не generic-карточкой).
    setSent(id.trim());
  };

  if (sent) {
    return (
      <FormShell
        welcome="Почти готово"
        title="Проверьте почту"
        bottom={
          <>
            Вспомнили пароль?{" "}
            <a className={LINK} href="/login" onClick={(e) => { e.preventDefault(); window.openModal("login"); }}>Войдите</a>
          </>
        }
      >
        <div className="flex flex-col gap-y-[16px] self-start">
          <p className="text-sm font-light leading-6 text-[#444]">
            Если адрес <span className="font-semibold text-[#111]">«{sent}»</span> зарегистрирован, мы отправили на него ссылку для сброса пароля. Ссылка действует 30 минут.
          </p>
          <p className="text-[13px] font-light leading-5 text-[#8a8a8a]">
            Не пришло письмо? Проверьте папку «Спам» или отправьте запрос ещё раз.
          </p>

          <div className="mt-2">
            <button className={`${BTN} w-full`} type="button" onClick={() => window.openModal("login")}>
              Вернуться ко входу
            </button>
          </div>

          <div className="flex justify-center">
            <button type="button" className={LINK} onClick={() => setSent(null)}>Отправить ещё раз</button>
          </div>
        </div>

        <div className="self-end" aria-hidden="true" />
      </FormShell>
    );
  }

  return (
    <FormShell
      welcome="Поможем восстановить доступ"
      title="Забыли пароль?"
      bottom={
        <>
          Ещё не зарегистрированы?{" "}
          <a className={LINK} href="/register" onClick={(e) => { e.preventDefault(); window.openModal("register"); }}>Зарегистрируйтесь сейчас</a>
        </>
      }
    >
      {busy ? <CenterSpinner minHeight={340} label="Отправляем ссылку…" /> : (<>
      <form className="grid grid-cols-1 gap-y-[14px] self-start" onSubmit={onSubmit} noValidate>
        <p className="mb-1.5 text-sm font-semibold leading-7 text-black">
          Введите адрес электронной почты, и мы вышлем вам ссылку для сброса пароля.
        </p>

        <div className="flex flex-col">
          <Label>ЭЛЕКТРОННАЯ ПОЧТА (*)</Label>
          <input className={inputCls(errors.id)} type="email" value={id}
            onChange={(e) => { setId(e.target.value); if (errors.id) setErrors({}); }}
            placeholder="имя@домен.ру" />
          <ErrorSlot text={errors.id} />
        </div>

        <div className="mt-2">
          <button className={`${BTN} w-full`} type="submit" disabled={busy}>
            {busy ? "Отправляем…" : "Сбросить пароль"}
          </button>
        </div>

        <div className="mt-2.5 flex justify-center">
          <a href="/login" className={LINK} onClick={(e) => { e.preventDefault(); window.openModal("login"); }}>Назад</a>
        </div>
      </form>

      <div className="self-end" aria-hidden="true" />
      </>)}
    </FormShell>
  );
}

/* ===== Кастомная карточка ===== */
function CustomCard({ title = "Сообщение", content = null, width }) {
  return (
    <div className="p-7 font-tight" style={{ maxWidth: width ? `${width}px` : "auto" }}>
      <h3 className="mb-2.5 text-[22px] font-bold leading-[1.25] text-[#111]">{title}</h3>
      <div className="text-sm leading-[1.55] text-[#333]">{content}</div>
      <div className="mt-[18px] flex gap-2.5">
        <button className={BTN} onClick={() => window.closeModal()}>Понятно</button>
      </div>
    </div>
  );
}

/* ===== Значок «улыбка» ===== */
function SmileBadge() {
  return (
    <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
      <circle cx="74" cy="74" r="58" fill="#3b36ff" />
      <circle cx="74" cy="74" r="66" fill="none" stroke="#9ef0ff" strokeWidth="8" />
      <circle cx="58" cy="66" r="8" fill="#9ef0ff" />
      <circle cx="90" cy="66" r="8" fill="#9ef0ff" />
      <path d="M50 90c10 16 38 16 48 0" fill="none" stroke="#9ef0ff" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
