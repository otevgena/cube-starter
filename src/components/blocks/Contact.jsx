// src/components/blocks/Contact.jsx
// Блок «Контакты» (clean-rebuild): заголовок + форма заявки.
// Логика валидации и отправки в Yandex Cloud сохранена 1-в-1; разметка на Tailwind.
import React from "react";

const FALLBACK_URL = "https://functions.yandexcloud.net/d4emaopknkiq93o92km8?tag=%24latest&integration=raw";
const BACKEND_URL = (import.meta.env?.VITE_BACKEND_URL || FALLBACK_URL).trim();

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

const PLACEHOLDER = "-- Выберите вариант --";
const OPTIONS = [
  PLACEHOLDER,
  "Рассчитать стоимость работ",
  "Заказать монтаж «под ключ»",
  "Проектирование систем",
  "Слаботочные системы",
  "Вентиляция и кондиционирование",
  "Электромонтажные работы",
  "Обслуживание и ремонт",
  "Подбор оборудования",
  "Общестрой и отделка",
  "Другое",
];

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isPhoneLike = (v) => (v || "").replace(/\D/g, "").length >= 10;

const LABEL_CLASS = "block text-left text-xs font-light uppercase tracking-[0.04em] text-[#a7a7a7]";
const fieldClass = (err) =>
  `block h-12 w-[683px] max-w-full border-0 border-b bg-white px-3.5 text-sm font-normal leading-6 text-black outline-none transition-colors duration-500 ${
    err ? "border-[#fa5d29]" : "border-line focus:border-[#999]"
  }`;

/* Слот ошибки под полем (фикс. высота, верстка не прыгает) */
function ErrorSlot({ text }) {
  return (
    <div className="relative h-[22px]">
      {text ? (
        <span className="absolute left-0 top-[11px] text-[11px] font-light leading-[11px] text-[#fa5d29]">{text}</span>
      ) : null}
    </div>
  );
}

/* Чекбокс */
function FancyCheckbox({ checked, onChange }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}
      className="mt-[3px] inline-grid h-[18px] w-[18px] shrink-0 cursor-pointer select-none place-items-center rounded border border-[#d9d9d9]"
      aria-label="Принять условия"
      title="Принять условия"
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-[3px] bg-[#111] transition-transform duration-150"
        style={{ transform: checked ? "scale(1)" : "scale(0)" }}
      />
    </span>
  );
}

export default function Contact({ topClass = "pt-14" }) {
  const [open, setOpen] = React.useState(false);
  const [modal, setModal] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState("");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [opt, setOpt] = React.useState(PLACEHOLDER);
  const [agree, setAgree] = React.useState(false);

  const [errors, setErrors] = React.useState({ name: "", email: "", phone: "", help: "", comment: "", agree: "" });
  const clearErr = (k) => errors[k] && setErrors((s) => ({ ...s, [k]: "" }));

  const selectRef = React.useRef(null);
  React.useEffect(() => {
    const onDown = (e) => { if (open && selectRef.current && !selectRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // предвыбор услуги + тема комментария, если пришли со страницы услуги
  React.useEffect(() => {
    try {
      const pre = sessionStorage.getItem("cube:help");
      if (pre && OPTIONS.includes(pre)) {
        setOpt(pre);
        sessionStorage.removeItem("cube:help");
      }
      const subj = sessionStorage.getItem("cube:subject");
      if (subj) {
        setComment((c) => (c ? c : `${subj}: `));
        sessionStorage.removeItem("cube:subject");
      }
    } catch {}
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setSendError("");

    const next = { name: "", email: "", phone: "", help: "", comment: "", agree: "" };
    if (!name.trim()) next.name = "Это значение не должно быть пустым.";
    if (!email.trim()) next.email = "Это значение не должно быть пустым.";
    if (email.trim() && !isEmail(email)) next.email = "Неверный формат электронного адреса.";
    if (phone.trim() && !isPhoneLike(phone)) next.phone = "Укажите телефон в формате +7 (XXX) XXX-XX-XX.";
    if (opt === PLACEHOLDER) next.help = "Необходимо выбрать вариант из списка.";
    if (!comment.trim()) next.comment = "Это значение не должно быть пустым.";
    if (!agree) next.agree = "Подтвердите, что ознакомлены с условиями и принимаете их.";
    setErrors(next);
    if (!Object.values(next).every((v) => !v)) return;

    try {
      setSending(true);
      const payload = {
        name, email, phone, option: opt, message: comment,
        page: typeof window !== "undefined" ? window.location.href : "unknown",
      };
      const url = (() => {
        try {
          let s = BACKEND_URL;
          if (s.includes("tag=$latest")) s = s.replace("tag=$latest", "tag=%24latest");
          if (/\btag=$(&|$)/.test(s)) s = s.replace("tag=$", "tag=%24");
          return s;
        } catch { return BACKEND_URL; }
      })();

      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}
      if (data && data.statusCode && typeof data.body === "string") {
        try { data = JSON.parse(data.body); } catch {}
      }
      if (!res.ok || !(data && data.ok === true)) throw new Error(`send_failed_${res.status}`);

      setModal(true);
      setTimeout(() => setModal(false), 2000);
    } catch (err) {
      console.error("Send error:", err);
      setSendError("Не удалось отправить заявку. Попробуйте ещё раз или напишите на info@cube-tech.ru");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={`bg-page font-tight text-ink ${topClass}`} aria-label="Контакты">
      {/* Шапка */}
      <div className="text-center text-sm font-light leading-7">Напишите нам</div>
      <div className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none h-hero">КОНТАКТЫ</h2>
      </div>

      {/* Колонки: слева текст, справа форма (на узких экранах — в одну колонку) */}
      <div className="mx-4 mt-12 grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:mx-[52px] lg:mt-20 xl:grid-cols-[1fr_auto]">
        {/* Левый текст */}
        <div className="max-w-[760px] text-left">
          <p className="text-[21px] font-semibold leading-7">Мы — КУБ, и мы рядом, чтобы помочь!</p>
          <p className="mt-2 text-[21px] font-semibold leading-7">Чем можем быть полезны?</p>
          <p className="mt-[18px] text-sm font-light leading-6">
            Если у вас есть вопросы по нашим услугам, проектам, сметам, договорам
          </p>
          <p className="mt-1.5 text-sm font-light leading-6">
            или любым другим вопросам — мы всегда готовы помочь.
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={submit} noValidate className="w-[683px] max-w-full text-left">
          {/* Имя */}
          <div>
            <label className={LABEL_CLASS}>имя (*)</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); clearErr("name"); }} className={fieldClass(!!errors.name)} />
            <ErrorSlot text={errors.name} />
          </div>

          {/* Почта */}
          <div className="mt-3">
            <label className={LABEL_CLASS}>почта (*)</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearErr("email"); }} className={fieldClass(!!errors.email)} />
            <ErrorSlot text={errors.email} />
          </div>

          {/* Телефон */}
          <div className="mt-3">
            <label className={LABEL_CLASS}>телефон</label>
            <input type="text" value={phone} onChange={(e) => { setPhone(e.target.value); clearErr("phone"); }} className={fieldClass(!!errors.phone)} />
            <ErrorSlot text={errors.phone} />
          </div>

          {/* Чем помочь — кастомный селект */}
          <div className="mt-3">
            <label className={LABEL_CLASS}>чем помочь (*)</label>
            <div ref={selectRef} className="relative">
              <div
                role="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-12 w-[683px] max-w-full cursor-pointer items-center justify-between border-0 border-b bg-white px-3.5 outline-none transition-colors duration-500 ${
                  errors.help ? "border-[#fa5d29]" : open ? "border-[#999]" : "border-line"
                }`}
              >
                <span className="text-sm font-normal text-black">{opt}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" fill="none" stroke="#b3b3b3" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round" />
                </svg>
              </div>
              {open && (
                <div role="listbox" className="absolute z-10 max-h-[280px] w-[683px] max-w-full overflow-y-auto border border-[#d9d9d9] bg-white">
                  {OPTIONS.map((o) => (
                    <div
                      key={o}
                      role="option"
                      aria-selected={opt === o}
                      onClick={() => { setOpt(o); setOpen(false); clearErr("help"); }}
                      className="cursor-pointer select-none px-3.5 py-3 text-base font-light text-[#333] hover:bg-black/[0.06]"
                    >
                      {o}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ErrorSlot text={errors.help} />
          </div>

          {/* Комментарий */}
          <div className="mt-3">
            <label className={LABEL_CLASS}>Комментарий (*)</label>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); clearErr("comment"); }}
              className={`block h-[150px] w-[683px] max-w-full resize-none border-0 border-b bg-white px-3.5 py-3 text-sm font-normal leading-6 text-black outline-none transition-colors duration-500 ${
                errors.comment ? "border-[#fa5d29]" : "border-line focus:border-[#999]"
              }`}
            />
            <ErrorSlot text={errors.comment} />
          </div>

          {/* Согласие */}
          <div className="mt-[18px] flex items-start gap-2.5 text-sm font-normal leading-5 text-ink">
            <FancyCheckbox checked={agree} onChange={(v) => { setAgree(v); clearErr("agree"); }} />
            <span>
              Я прочитал(а) и принимаю{" "}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                Правовые положения
              </a>{" "}
              и{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                Политику конфиденциальности
              </a>
              .
            </span>
          </div>
          <ErrorSlot text={errors.agree} />

          {/* Кнопка */}
          <button
            type="button"
            onClick={submit}
            disabled={sending}
            aria-busy={sending ? "true" : "false"}
            className="mt-[22px] block h-[60px] w-[210px] rounded-[10px] bg-black text-sm font-semibold uppercase tracking-[0.02em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-85"
          >
            {sending ? "Отправка..." : "Оставить заявку"}
          </button>
          <ErrorSlot text={sendError} />
        </form>
      </div>

      <div className="h-0 lg:h-[58px]" />

      {/* Тост успеха */}
      {modal && (
        <div role="status" aria-live="assertive" className="pointer-events-none fixed inset-0 z-[2147483647] grid place-items-center">
          <div
            className="inline-flex max-w-[560px] items-center gap-2.5 rounded-xl bg-black px-[18px] py-3.5 text-base font-medium leading-[22px] text-white shadow-2xl"
            style={{ animation: "toastIn .18s ease-out both, toastOut .18s ease-in both 1.82s" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Ваша заявка принята!</span>
          </div>
          <style>{`
            @keyframes toastIn { from { opacity: 0; transform: translateY(4px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
            @keyframes toastOut { from { opacity: 1; transform: translateY(0) scale(1) } to { opacity: 0; transform: translateY(4px) scale(.98) } }
          `}</style>
        </div>
      )}
    </section>
  );
}
