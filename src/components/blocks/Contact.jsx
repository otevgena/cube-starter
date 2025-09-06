import React from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const UI = "'Inter Tight','Inter',system-ui";

const GUTTER = 52;
const FORM_W = 683;
const FORM_H = 750;
const FIELD_H = 48;
const LABEL = "#A7A7A7";
const BLACK = "#000";
const GRAY = "#222222";
const BORDER = "#d9d9d9";
const ARROW = "#b3b3b3";
const ERR = "#fa5d29";

const GROUP_GAP = 12;
const ERROR_OFFSET = 11;
const ERROR_TEXT_SIZE = 11;
const ERROR_SLOT_H = ERROR_OFFSET + ERROR_TEXT_SIZE; // 22px
const CHECKBOX_EXTRA_SHIFT = 6;

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

/* Валидации */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isPhoneLike = (v) => ((v || "").replace(/\D/g, "").length >= 10);

/* Слот ошибки под полем, верстка не прыгает */
function ErrorSlot({ text }) {
  return (
    <div style={{ height: ERROR_SLOT_H, position: "relative" }}>
      {text ? (
        <span
          style={{
            position: "absolute",
            top: ERROR_OFFSET,
            left: 0,
            color: ERR,
            fontSize: ERROR_TEXT_SIZE,
            lineHeight: `${ERROR_TEXT_SIZE}px`,
            fontWeight: 300,
          }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}

/* Чекбокс */
function FancyCheckbox({ checked, onChange }) {
  const size = 18, inner = 10;
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}
      style={{
        width: size, height: size, display: "inline-grid", placeItems: "center",
        border: `1px solid ${BORDER}`, borderRadius: 4, background: "transparent",
        cursor: "pointer", userSelect: "none",
      }}
      aria-label="Принять условия"
      title="Принять условия"
    >
      <span
        aria-hidden="true"
        style={{
          width: inner, height: inner, borderRadius: 3, background: "#111",
          transform: checked ? "scale(1)" : "scale(0)", transition: "transform 140ms ease-out",
        }}
      />
    </span>
  );
}

export default function Contact({ sectionRef }) {
  const [open, setOpen] = React.useState(false);
  const [btnHover, setBtnHover] = React.useState(false);
  const [modal, setModal] = React.useState(false); // центр. всплывающий блок
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState("");

  // значения полей
  const [name, setName]       = React.useState("");
  const [email, setEmail]     = React.useState("");
  const [phone, setPhone]     = React.useState("");
  const [comment, setComment] = React.useState("");
  const [opt, setOpt]         = React.useState(PLACEHOLDER);
  const [agree, setAgree]     = React.useState(false);

  // ошибки
  const [errors, setErrors] = React.useState({
    name: "", email: "", phone: "", help: "", comment: "", agree: ""
  });

  const selectRef = React.useRef(null);
  React.useEffect(() => {
    const onDown = (e) => { if (open && selectRef.current && !selectRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // поле с нижней границей
  const fieldBottomBorder = (isError) => ({
    width: FORM_W,
    height: FIELD_H,
    border: "none",
    borderBottom: `1px solid ${isError ? ERR : BORDER}`,
    outline: "none",
    padding: "0 14px",
    fontSize: 16,
    lineHeight: "24px",
    color: BLACK,
    background: "#fff",
    boxSizing: "border-box",
    marginTop: 0,
  });

  const labelStyle = {
    display: "block",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 300,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: LABEL,
    marginBottom: 0,
  };

  const submit = async (e) => {
    e?.preventDefault();
    setSendError("");

    // моментальная проверка ВСЕХ полей
    const next = { name: "", email: "", phone: "", help: "", comment: "", agree: "" };

    if (!name.trim())        next.name    = "Это значение не должно быть пустым.";
    if (!email.trim())       next.email   = "Это значение не должно быть пустым.";
    if (email.trim() && !isEmail(email)) next.email = "Неверный формат электронного адреса.";
    if (phone.trim() && !isPhoneLike(phone)) next.phone = "Укажите телефон в формате +7 (XXX) XXX-XX-XX.";
    if (opt === PLACEHOLDER) next.help    = "Необходимо выбрать вариант из списка.";
    if (!comment.trim())     next.comment = "Это значение не должно быть пустым.";
    if (!agree)              next.agree   = "Подтвердите, что ознакомлены с условиями и принимаете их.";

    setErrors(next);

    const ok = Object.values(next).every((v) => !v);
    if (!ok) return;

    // ===== отправка в вашу функцию (Yandex Cloud) =====
    try {
      setSending(true);

      const payload = {
        name,
        email,
        phone,
        option: opt,
        message: comment,
        page: typeof window !== "undefined" ? window.location.href : "unknown",
      };

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Универсальный разбор (YC может вернуть { ok: true } либо обёртку {statusCode, body})
      let data = null;
      try { data = await res.json(); } catch { /* пустое тело или не-JSON */ }
      if (data && data.statusCode && data.body) {
        try { data = JSON.parse(data.body); } catch { /* оставим как есть */ }
      }

      if (!res.ok || !data || data.ok !== true) throw new Error("send_failed");

      // успех — показываем тост, поля не очищаем
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
    <section id="contact" ref={sectionRef} className="about-hero contact-hero" aria-label="Контакты">
      <div style={{ transform: "translateY(-98px)", willChange: "transform" }}>
        {/* Шапка */}
        <div className="about-hero-flow" style={{ marginTop: 30 }}>
          <div className="about-hero-overview" style={{ textAlign: "center", fontSize: 14, lineHeight: "28px", fontWeight: 300, color: GRAY, margin: 0 }}>
            Напишите нам
          </div>
          <div className="about-hero-more" style={{ textAlign: "center", position: "relative" }}>
            <h2 className="about-hero-title" style={{ margin: 0, textTransform: "uppercase", fontWeight: 600 }}>
              КОНТАКТЫ
            </h2>
          </div>
        </div>

        {/* Колонки */}
        <div
          style={{
            marginTop: 78, marginLeft: GUTTER, marginRight: GUTTER,
            display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start", columnGap: 40,
          }}
        >
          {/* Левый текст */}
          <div style={{ color: GRAY, textAlign: "left", maxWidth: 760 }}>
            <p style={{ margin: 0, fontSize: 21, lineHeight: "28px", fontWeight: 600 }}>
              Мы — КУБ, и мы рядом, чтобы помочь!
            </p>
            <p style={{ marginTop: 8, fontSize: 21, lineHeight: "28px", fontWeight: 600 }}>
              Чем можем быть полезны?
            </p>
            <p style={{ marginTop: 18, fontSize: 14, lineHeight: "24px", fontWeight: 300 }}>
              Если у вас есть вопросы по нашим услугам, проектам, сметам, договорам
            </p>
            <p style={{ marginTop: 6, fontSize: 14, lineHeight: "24px", fontWeight: 300 }}>
              или любым другим вопросам — мы всегда готовы помочь.
            </p>
          </div>

          {/* Правая колонка */}
          <form onSubmit={submit} noValidate style={{ width: FORM_W, height: FORM_H, border: "none", background: "transparent", textAlign: "left" }}>
            {/* Имя */}
            <div style={{ marginTop: 0 }}>
              <label style={labelStyle}>имя (*)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }); }}
                style={fieldBottomBorder(!!errors.name)}
              />
              <ErrorSlot text={errors.name} />
            </div>

            {/* Почта */}
            <div style={{ marginTop: GROUP_GAP }}>
              <label style={labelStyle}>почта (*)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
                style={fieldBottomBorder(!!errors.email)}
              />
              <ErrorSlot text={errors.email} />
            </div>

            {/* Телефон (необяз.) */}
            <div style={{ marginTop: GROUP_GAP }}>
              <label style={labelStyle}>телефон</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                style={fieldBottomBorder(!!errors.phone)}
              />
              <ErrorSlot text={errors.phone} />
            </div>

            {/* Чем помочь */}
            <div style={{ marginTop: GROUP_GAP }}>
              <label style={labelStyle}>чем помочь (*)</label>
              <div ref={selectRef}>
                {/* триггер */}
                <div
                  role="button"
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  style={{ ...fieldBottomBorder(!!errors.help), display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                >
                  <span style={{ fontWeight: 300, fontSize: opt === PLACEHOLDER ? 14 : 16, color: BLACK }}>
                    {opt}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : "none" }}>
                    <path d="M6 9l6 6 6-6" fill="none" stroke={ARROW} strokeWidth="2" strokeLinecap="square" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* список */}
                {open && (
                  <div
                    role="listbox"
                    style={{
                      width: FORM_W,
                      marginTop: 0,
                      background: "#fff",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 0,
                      boxShadow: "none",
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {OPTIONS.map((o) => (
                      <div
                        key={o}
                        onClick={() => { setOpt(o); setOpen(false); if (errors.help) setErrors({ ...errors, help: "" }); }}
                        role="option"
                        aria-selected={opt === o}
                        style={{
                          padding: "12px 14px",
                          fontSize: 16,
                          fontWeight: 300,
                          color: "#333",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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
            <div style={{ marginTop: GROUP_GAP }}>
              <label style={labelStyle}>Комментарий (*)</label>
              <textarea
                value={comment}
                onChange={(e) => { setComment(e.target.value); if (errors.comment) setErrors({ ...errors, comment: "" }); }}
                style={{
                  width: FORM_W, height: 150,
                  border: "none", borderBottom: `1px solid ${errors.comment ? ERR : BORDER}`,
                  outline: "none", padding: "12px 14px",
                  fontSize: 16, lineHeight: "24px", color: BLACK,
                  background: "#fff", boxSizing: "border-box", marginTop: 0, resize: "none",
                }}
              />
              <ErrorSlot text={errors.comment} />
            </div>

            {/* Чекбокс + текст — ниже на 6px */}
            <div style={{ marginTop: GROUP_GAP + CHECKBOX_EXTRA_SHIFT, display: "flex", alignItems: "center", gap: 10, color: GRAY, fontSize: 14, lineHeight: "20px", fontWeight: 400 }}>
              <FancyCheckbox checked={agree} onChange={(v) => { setAgree(v); if (errors.agree) setErrors({ ...errors, agree: "" }); }} />
              <span>
                Я прочитал(а) и принимаю{" "}
                <strong style={{ fontWeight: 600 }}>Правовые положения</strong>{" "}
                и{" "}
                <strong style={{ fontWeight: 600 }}>Политику конфиденциальности</strong>.
              </span>
            </div>
            <ErrorSlot text={errors.agree} />

            {/* Кнопка */}
            <button
              type="button"
              onClick={submit}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              disabled={sending}
              aria-busy={sending ? "true" : "false"}
              style={{
                display: "block",
                margin: "22px 0 0 0",
                width: 210,
                height: 60,
                background: sending ? "#3a3a3a" : (btnHover ? "#2f2f2f" : "#000"),
                color: "#fff",
                borderRadius: 10,
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: ".02em",
                border: "none",
                cursor: sending ? "not-allowed" : "pointer",
                transition: "background-color .16s ease", opacity: sending ? .85 : 1,
              }}
            >
              {sending ? "Отправка..." : "Оставить заявку"}
            </button>
            <ErrorSlot text={sendError} />
          </form>
        </div>

        <div style={{ height: 58 }} />
      </div>

      {/* ===== Всплывающий ЧЁРНЫЙ БЛОК по центру (без затемнения) ===== */}
      {modal && (
        <div
          role="status"
          aria-live="assertive"
          style={{
            position: "fixed", inset: 0,
            zIndex: 2147483647,
            display: "grid", placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "#000",
              color: "#fff",
              borderRadius: 12,
              padding: "14px 18px",
              fontFamily: UI,
              fontSize: 16,
              lineHeight: "22px",
              fontWeight: 500,
              maxWidth: 560,
              textAlign: "center",
              boxShadow: "0 6px 30px rgba(0,0,0,.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              animation: "toastIn .18s ease-out both, toastOut .18s ease-in both 1.82s",
            }}
          >
            {/* белая галочка */}
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
