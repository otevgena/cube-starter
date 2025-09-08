// src/components/common/Modals.jsx
import React from "react";
import { createPortal } from "react-dom";

/* ===== Хост модалок (API: window.openModal("register" | "login" | "forgot", { ... })) ===== */
export default function ModalsHost() {
  const [view, setView] = React.useState(null);
  const [props, setProps] = React.useState({});

  React.useEffect(() => {
    window.openModal  = (v, p = {}) => { setProps(p || {}); setView(v); };
    window.closeModal = () => setView(null);
    return () => { delete window.openModal; delete window.closeModal; };
  }, []);

  // скрываем StickyDock на время модалки
  React.useEffect(() => {
    const has = Boolean(view);
    document.body.classList.toggle('has-modal', has);
    return () => document.body.classList.remove('has-modal');
  }, [view]);

  // блокируем скролл под модалкой
  React.useEffect(() => {
    if (!view) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [view]);

  if (!view) return null;

  return createPortal(
    <ModalShell onClose={() => setView(null)} width={980}>
      {view === "register" && <RegisterForm email={props.email} />}
      {view === "login"    && <LoginForm />}
      {view === "forgot"   && <ForgotForm />}
      {view === "custom"   && <CustomCard {...props} />}
    </ModalShell>,
    document.body
  );
}

/* ---------- Константы под стиль Contact.jsx ---------- */
const ERR_COLOR = "#fa5d29";
const BORDER     = "#ededed";
const BORDER_FC  = "#d2d2d2";

/* ---------- Слот ошибки: 11px от поля до текста, 11px кегль ---------- */
function ErrorSlot({ text }) {
  const OFFSET = 11, SIZE = 11;
  return (
    <div style={{ height: OFFSET + SIZE, position: "relative" }}>
      {text ? (
        <span
          style={{
            position: "absolute",
            top: OFFSET,
            left: 0,
            color: ERR_COLOR,
            fontSize: SIZE,
            lineHeight: `${SIZE}px`,
            fontWeight: 300,
          }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}

/* ---------- Галочка как в Contact.jsx ---------- */
function FancyCheckbox({ checked, onChange, ariaLabel }) {
  const size = 18, inner = 10;
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        width: size, height: size, display: "inline-grid", placeItems: "center",
        border: `1px solid #d9d9d9`, borderRadius: 4, background: "transparent",
        cursor: "pointer", userSelect: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: inner, height: inner, borderRadius: 3, background: "#111",
          transform: checked ? "scale(1)" : "scale(0)",
          transition: "transform 140ms ease-out",
        }}
      />
    </span>
  );
}

/* ---------- Оболочка (фон + карточка + крестик-плитка) ---------- */
function ModalShell({ children, onClose, width }) {
  React.useEffect(() => {
    const onKey = (e) => { if ((e.key || "").toLowerCase() === "escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div aria-modal="true" role="dialog" className="m-root" onClick={onClose}>
      <div className="m-card" style={{ ["--m-w"]: `${width || 980}px` }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>

      {/* ЧЁРНЫЙ крестик-плитка (белый крест), выровнен по высоте со стрелкой StickyDock */}
      <button
        type="button"
        className="m-close"
        aria-label="Закрыть"
        title="Закрыть"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <style>{`
        .m-root{
          position: fixed; inset: 0; z-index: 1000;
          display: grid; place-items: center;
          background: rgba(0,0,0,.55);
          animation: m-fade .12s ease-out;
          padding: 24px;
        }
        .m-card{
          width: min(var(--m-w, 980px), calc(100vw - 48px));
          max-height: calc(100vh - 48px);
          background: #ffffff; color: #111;
          border: 1px solid #dcdcdc;
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,.35);
          overflow: hidden;
          transform: translateY(4px);
          animation: m-pop .16s ease-out forwards;
        }
        @keyframes m-fade { from{opacity:.0} to{opacity:1} }
        @keyframes m-pop  { to{ transform: none } }

        .m-close{
          position: fixed;
          right: 24px;
          bottom: calc(
            var(--dock-bottom, 21px)
            + (var(--dock-h, 72px) - var(--dock-left-tile, 60px)) / 2
          );
          width: var(--dock-left-tile, 60px);
          height: var(--dock-left-tile, 60px);
          display: grid; place-items: center;
          color: #fff; background: #111; border: 1px solid #111;
          border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
          cursor: pointer; transition: transform .15s ease, background .15s ease;
          z-index: 1001;
        }
        .m-close:hover{ transform: translateY(-1px); background:#0a0a0a; }
        .m-close:active{ transform: translateY(0); }

        /* Основные кнопки: 72px / 18px, без ВЕРХНЕГО регистра */
        .m-btn{
          height: 72px; padding: 0 18px; border-radius: 10px;
          background: #000; color: #fff; font-weight: 600; font-size: 18px;
          text-transform: none; letter-spacing: .02em;
          border: none; cursor: pointer;
          transition: background-color .16s ease, transform .06s ease;
        }
        .m-btn:hover{ background:#2f2f2f; }
        .m-btn:active{ transform: translateY(1px) }

        /* «жирные» ссылки без подчёркиваний */
        .m-link{ color:#111; text-decoration:none; font-weight:600; }
        .m-muted{ color:#666 }

        /* Универсальная "полоска-подчёркивание", как у about-hero-role */
        .u-underline{
          position: relative; display: inline-block; text-decoration: none;
          background-image: linear-gradient(currentColor,currentColor);
          background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat;
        }
      `}</style>
    </div>
  );
}

/* ---------- Регистрация ---------- */
function RegisterForm({ email = "" }) {
  const [form, setForm] = React.useState({
    user: "", email, pass: "", pass2: "", news: false, agree: false,
  });
  const [errors, setErrors] = React.useState({});

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

  const onSubmit = (e) => {
    e.preventDefault();
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

    window.openModal("custom", {
      title: "Черновой сабмит",
      content: <div>Готово! Подключу реальную отправку, когда дадите эндпоинт.</div>,
      width: 560,
    });
  };

  return (
    <div className="r-wrap">
      {/* ЛЕВАЯ колонка #ededed */}
      <aside className="r-left">
        <div className="r-welcome">Добро пожаловать!</div>
        <div className="r-brand">
          <span className="r-dot">c.</span>
          <SmileBadge />
        </div>
        <div className="r-bottom m-muted">
          Уже являетесь участником?{" "}
          <a
            className="about-hero-role u-underline"
            href="/login"
            onClick={(e)=>{ e.preventDefault(); window.openModal("login"); }}
          >
            Войдите
          </a>
        </div>
      </aside>

      {/* ПРАВАЯ колонка: грид auto | 1fr | auto  */}
      <section className="r-right">
        <h2 className="r-title">Регистрация по почте</h2>

        {/* СЕРЕДИНА: форма */}
        <form className="r-form" onSubmit={onSubmit} noValidate>
          {/* Имя пользователя (2 колонки) */}
          <div className="r-field r-span2">
            <label className="r-label">ИМЯ ПОЛЬЗОВАТЕЛЯ <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.user ? "is-error" : ""}`}
              type="text"
              value={form.user}
              onChange={(e)=>{ set("user", e.target.value); if (errors.user) setErrors({...errors, user:""}); }}
              placeholder="Имя пользователя"
            />
            <ErrorSlot text={errors.user} />
          </div>

          {/* Почта (2 колонки) */}
          <div className="r-field r-span2">
            <label className="r-label">ПОЧТА <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.email ? "is-error" : ""}`}
              type="email"
              value={form.email}
              onChange={(e)=>{ set("email", e.target.value); if (errors.email) setErrors({...errors, email:""}); }}
              placeholder="имя@домен.ру"
            />
            <ErrorSlot text={errors.email} />
          </div>

          {/* Пароли (2 колонки рядом) */}
          <div className="r-field">
            <label className="r-label">ПАРОЛЬ <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.pass ? "is-error" : ""}`}
              type="password"
              value={form.pass}
              onChange={(e)=>{ set("pass", e.target.value); if (errors.pass) setErrors({...errors, pass:""}); }}
              placeholder="Пароль"
            />
            <ErrorSlot text={errors.pass} />
          </div>

          <div className="r-field">
            <label className="r-label">ПОВТОР ПАРОЛЯ <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.pass2 ? "is-error" : ""}`}
              type="password"
              value={form.pass2}
              onChange={(e)=>{ set("pass2", e.target.value); if (errors.pass2) setErrors({...errors, pass2:""}); }}
              placeholder="Ещё раз"
            />
            <ErrorSlot text={errors.pass2} />
          </div>

          {/* Информирование (14px / 300) */}
          <p className="r-note m-muted r-span2">
            Мы можем информировать вас по электронной почте о продуктах и услугах.
            <span className="m-link"> Подробнее —</span>
          </p>

          {/* чекбоксы — тексты 14px / 300 */}
          <div className="r-check r-span2">
            <FancyCheckbox
              checked={!!form.news}
              onChange={(v)=> set("news", v)}
              ariaLabel="Связываться со мной по почте"
            />
            <span>Связываться со мной по почте</span>
          </div>

          <div className="r-check r-span2">
            <FancyCheckbox
              checked={!!form.agree}
              onChange={(v)=>{ set("agree", v); if (errors.agree) setErrors({...errors, agree:""}); }}
              ariaLabel="Принять условия"
            />
            <span>
              Я прочитал(а) и принимаю{" "}
              <span className="m-link">Правовые положения</span> и{" "}
              <span className="m-link">Политику конфиденциальности</span>.
            </span>
          </div>
          <ErrorSlot text={errors.agree} />

          {/* Кнопка */}
          <div className="r-actions r-span2">
            <button className="m-btn r-submit" type="submit">
              Создать аккаунт
            </button>
          </div>
        </form>

        {/* НИЗ: «или зарегистрируйтесь через» + Google (ПОЛНАЯ ширина, выровнено с левым .r-bottom) */}
        <div className="r-slab">
          <div className="r-or-left">или зарегистрируйтесь через</div>
          <div className="r-social">
            <button type="button" className="r-sbtn" onClick={()=>alert("Google OAuth — заглушка")}>
              <span className="r-sico">G</span>
              <span>Google</span>
            </button>
          </div>
        </div>
      </section>

      <SharedFormStyles />
    </div>
  );
}

/* ---------- Вход ---------- */
function LoginForm() {
  const [form, setForm] = React.useState({
    id: "", pass: "", keep: false,
  });
  const [errors, setErrors] = React.useState({});

  const set = (k, v) => setForm((s)=>({ ...s, [k]: v }));

  const onSubmit = (e) => {
    e.preventDefault();
    const es = {};
    if (!form.id.trim())   es.id   = "Это значение не должно быть пустым.";
    if (!form.pass.trim()) es.pass = "Это значение не должно быть пустым.";
    setErrors(es);
    if (Object.keys(es).length) return;

    window.openModal("custom", {
      title: "Вход (демо)",
      content: <div>Пользователь «{form.id}» вошёл (демо). Подключим API по готовности.</div>,
      width: 560,
    });
  };

  return (
    <div className="r-wrap">
      {/* ЛЕВАЯ колонка #ededед */}
      <aside className="r-left">
        <div className="r-welcome">С возвращением!</div>
        <div className="r-brand">
          <span className="r-dot">c.</span>
          <SmileBadge />
        </div>
        <div className="r-bottom m-muted">
          Ещё не зарегистрированы?{" "}
          <a
            className="about-hero-role u-underline"
            href="/register"
            onClick={(e)=>{ e.preventDefault(); window.openModal("register"); }}
          >
            Зарегистрируйтесь сейчас
          </a>
        </div>
      </aside>

      {/* ПРАВАЯ колонка: грид auto | 1fr | auto */}
      <section className="r-right">
        <h2 className="r-title">Вход</h2>

        {/* СЕРЕДИНА: форма */}
        <form className="r-form" onSubmit={onSubmit} noValidate>
          <div className="r-field r-span2">
            <label className="r-label">ПОЧТА ИЛИ ИМЯ ПОЛЬЗОВАТЕЛЯ <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.id ? "is-error" : ""}`}
              type="text"
              value={form.id}
              onChange={(e)=>{ set("id", e.target.value); if (errors.id) setErrors({...errors, id:""}); }}
              placeholder="имя@домен.ру или логин"
            />
            <ErrorSlot text={errors.id} />
          </div>

          <div className="r-field r-span2">
            <label className="r-label">ПАРОЛЬ <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.pass ? "is-error" : ""}`}
              type="password"
              value={form.pass}
              onChange={(e)=>{ set("pass", e.target.value); if (errors.pass) setErrors({...errors, pass:""}); }}
              placeholder="Пароль"
            />
            <ErrorSlot text={errors.pass} />
          </div>

          {/* чекбокс — 14px / 300 */}
          <div className="r-check r-span2">
            <FancyCheckbox
              checked={!!form.keep}
              onChange={(v)=> set("keep", v)}
              ariaLabel="Не выходить из системы"
            />
            <span>Не выходить из системы</span>
          </div>

          {/* кнопка входа */}
          <div className="r-actions r-span2">
            <button className="m-btn r-submit" type="submit">
              Войти
            </button>
          </div>

          {/* справа под кнопкой — Забыли пароль? */}
          <div className="r-span2" style={{ display:"flex", justifyContent:"flex-end", marginTop: 8 }}>
            <a
              href="/forgot"
              className="about-hero-role u-underline"
              onClick={(e)=>{ e.preventDefault(); window.openModal("forgot"); }}
              style={{ fontWeight:600, fontSize:11, lineHeight:"11px" }}
            >
              Забыли пароль?
            </a>
          </div>
        </form>

        {/* НИЗ: «Или войдите через» + Google, выровнено по низу как слева */}
        <div className="r-slab">
          <div className="r-or-left">Или войдите через</div>
          <div className="r-social">
            <button type="button" className="r-sbtn" onClick={()=>alert("Google OAuth — заглушка")}>
              <span className="r-sico">G</span>
              <span>Google</span>
            </button>
          </div>
        </div>
      </section>

      <SharedFormStyles />
    </div>
  );
}

/* ---------- Восстановление пароля ---------- */
function ForgotForm() {
  const [id, setId] = React.useState("");
  const [errors, setErrors] = React.useState({});

  const onSubmit = (e) => {
    e.preventDefault();
    const es = {};
    if (!id.trim()) es.id = "Это значение не должно быть пустым.";
    setErrors(es);
    if (Object.keys(es).length) return;

    // заглушка — вместо реальной отправки
    window.openModal("custom", {
      title: "Письмо отправлено",
      content: (
        <div>
          Если адрес «{id}» зарегистрирован, мы отправили на него ссылку для сброса пароля.
        </div>
      ),
      width: 560,
    });
  };

  return (
    <div className="r-wrap">
      {/* ЛЕВАЯ колонка как у входа */}
      <aside className="r-left">
        <div className="r-welcome">Поможем восстановить доступ</div>
        <div className="r-brand">
          <span className="r-dot">c.</span>
          <SmileBadge />
        </div>
        <div className="r-bottom m-muted">
          Ещё не зарегистрированы?{" "}
          <a
            className="about-hero-role u-underline"
            href="/register"
            onClick={(e)=>{ e.preventDefault(); window.openModal("register"); }}
          >
            Зарегистрируйтесь сейчас
          </a>
        </div>
      </aside>

      {/* ПРАВАЯ колонка: грид auto | 1fr | auto */}
      <section className="r-right">
        <h2 className="r-title">Забыли пароль?</h2>

        {/* СЕРЕДИНА: форма */}
        <form className="r-form" onSubmit={onSubmit} noValidate>
          <p className="r-desc r-span2">
            Введите имя пользователя или адрес электронной почты, и мы вышлем вам ссылку для сброса пароля.
          </p>

          <div className="r-field r-span2">
            <label className="r-label">ЭЛЕКТРОННАЯ ПОЧТА ИЛИ ИМЯ ПОЛЬЗОВАТЕЛЯ <span className="r-req">(*)</span></label>
            <input
              className={`r-input r-line ${errors.id ? "is-error" : ""}`}
              type="text"
              value={id}
              onChange={(e)=>{ setId(e.target.value); if (errors.id) setErrors({}); }}
              placeholder="имя@домен.ру или логин"
            />
            <ErrorSlot text={errors.id} />
          </div>

          <div className="r-actions r-span2">
            <button className="m-btn r-submit" type="submit">
              Сбросить пароль
            </button>
          </div>

          {/* Назад — по центру блока */}
          <div className="r-span2" style={{ marginTop: 10, display:"flex", justifyContent:"center" }}>
            <a
              href="/login"
              className="about-hero-role u-underline"
              onClick={(e)=>{ e.preventDefault(); window.openModal("login"); }}
            >
              Назад
            </a>
          </div>
        </form>

        {/* НИЗ: для forgot соц-блока нет — оставляем пустым, чтобы выравнивание сохранилось */}
        <div className="r-slab" aria-hidden="true" />
      </section>

      <SharedFormStyles />
    </div>
  );
}

/* ---------- Общие стили форм регистрации/входа/восстановления ---------- */
function SharedFormStyles(){
  return (
    <style>{`
      .r-wrap{ display:grid; grid-template-columns: 1fr 1.35fr; min-height: 560px; }
      @media (max-width:980px){ .r-wrap{ grid-template-columns: 1fr; } }

      .r-left{
        background:#ededed; color:#111;
        padding: 28px; display:grid; grid-template-rows:auto 1fr auto; gap:18px;
      }
      .r-welcome{ font:600 18px/1.2 Inter,system-ui,sans-serif; }
      .r-brand{ display:grid; place-items:center; gap:30px; }
      .r-dot{ font:900 72px/1 "Inter Tight", Inter, system-ui, sans-serif; letter-spacing:.02em; color:#111; }
      .r-bottom{ font:14px/1.4 Inter,system-ui,sans-serif; }

      /* ПРАВАЯ колонка — три ряда: заголовок / контент / НИЗ (соц-блок) */
      .r-right{
        background:#ffffff; padding: 34px 36px;
        display:grid; grid-template-rows: auto 1fr auto; row-gap: 0;
      }
      .r-title{
        margin:0 0 22px;
        font-family: "Inter Tight", Inter, system-ui, sans-serif;
        font-size: 22px; font-weight: 600; line-height: 1.25; color:#111;
      }

      /* ФОРМА в средней строке */
      .r-form{ display:grid; grid-template-columns: 1fr 1fr; column-gap: 18px; row-gap: 14px; align-self: start; }
      .r-span2{ grid-column: 1 / -1; }

      /* без лишнего gap между инпутом и ErrorSlot — 11px строго из слота */
      .r-field{ display:flex; flex-direction:column; gap:0; }
      .r-label{
        margin: 0 0 6px 0;
        font-family: "Inter Tight", Inter, system-ui, sans-serif;
        font-weight: 300; font-size: 11px; line-height: 1;
        letter-spacing: .08em; color:#666; text-transform: uppercase;
      }
      .r-req{ color: inherit; font-weight: inherit; } /* '(*)' того же цвета, что и текст */

      .r-input{
        height: 42px; padding: 0 2px;
        background: transparent; color:#111;
        border: none; border-bottom: 1px solid ${BORDER};
        outline: none; font-weight: 300;
      }
      .r-input.is-error{ border-bottom-color: ${ERR_COLOR} !important; } /* красная линия при ошибке */
      .r-input:focus{ border-bottom-color: ${BORDER_FC}; }
      .r-input::placeholder{ color:#c7c7c7; opacity:.95; font-weight:300; } /* еле заметный плейсхолдер */

      /* инфо-тексты и чекбоксы — 14px / 300 */
      .r-note{ margin: 6px 0 2px; font:300 14px/20px Inter,system-ui,sans-serif; color:#555; }
      .r-desc{
  margin: 0 0 18px;   /* было 6px → стало 18px */
  font: 600 14px/28px Inter,system-ui,sans-serif;
  letter-spacing: normal;
  color:#000;
}

      .r-check{ display:flex; align-items:center; gap:10px; color:#111; }
      .r-check > span{ font:300 14px/20px Inter,system-ui,sans-serif; }

      .r-actions{ margin-top: 8px; }
      .r-submit{ width:100%; }

      /* НИЗ ПРАВОЙ КОЛОНКИ — по одной линии с .r-bottom слева */
      .r-slab{ align-self: end; margin-top: 14px; }
      .r-or-left{
        color:#111;
        font:300 14px/20px Inter,system-ui,sans-serif;
        margin:8px 0 6px;
        text-align:left;
      }

      /* Соц-блок: ПОЛНАЯ ширина, кнопка 48px, текст ближе к иконке */
      .r-social{ display:block; }
      .r-sbtn{
        width:100%; height:48px; padding: 0 16px;
        border-radius:10px; border:1px solid #e1e1e1; background:#fff; color:#111; cursor:pointer;
        display:flex; align-items:center; justify-content:center; gap:4px; /* текст ближе к иконке */
        font-weight:300; font-size:14px; text-transform:none;
      }
      .r-sbtn:hover{ background:#f8f8f8; }
      .r-sico{
        width: 26px; height: 26px; display:inline-grid; place-items:center;
        font-weight:800; font-size:22px; line-height:26px;
      }
    `}</style>
  );
}

/* ---------- Кастомная карточка ---------- */
function CustomCard({ title = "Сообщение", content = null, width }) {
  return (
    <div className="c-wrap" style={{ maxWidth: width ? `${width}px` : "auto" }}>
      <h3 className="c-title">{title}</h3>
      <div className="c-body">{content}</div>
      <div className="c-actions">
        <button className="m-btn" onClick={() => window.closeModal()}>Понятно</button>
      </div>

      <style>{`
        .c-wrap{ padding: 28px; }
        .c-title{ margin:0 0 10px; font:700 22px/1.25 Inter, system-ui, sans-serif; color:#111; }
        .c-body{ color:#333; font:14px/1.55 Inter, system-ui, sans-serif; }
        .c-actions{ margin-top:18px; display:flex; gap:10px; }
      `}</style>
    </div>
  );
}

/* ---------- Значок "улыбка" ---------- */
function SmileBadge() {
  return (
    <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
      <circle cx="74" cy="74" r="58" fill="#3b36ff" />
      <circle cx="74" cy="74" r="66" fill="none" stroke="#9ef0ff" strokeWidth="8" />
      <circle cx="58" cy="66" r="8" fill="#9ef0ff" />
      <circle cx="90" cy="66" r="8" fill="#9ef0ff" />
      <path d="M50 90c10 16 38 16 48 0" fill="none" stroke="#9ef0ff" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  );
}
