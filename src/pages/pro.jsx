// src/pages/pro.jsx
import React from "react";

const UI = "'Inter Tight','Inter',system-ui";
const BG = "#f8f8f8";
const CARD = "#ffffff";
const BORDER = "#e5e5e5";
const BORDER_DARK = "#cfcfcf";
const TEXT = "#111";
const MUTED = "#6b7280";
const ERR = "#fa5d29";
const EDGE = 80;

const FIELD_H = 46;
const R = 10;

/* === Настройки индикатора шага === */
const STEP_D = 18;       // внешний диаметр круга (px)
const STEP_FILL = 0.60;  // доля заливки активного круга (0.60 = 60%)

/* ——— утилиты ——— */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isPhoneLike = (v) => ((v || "").replace(/\D/g, "").length >= 10);

function ErrorSlot({ text }) {
  return (
    <div style={{ minHeight: 18, paddingTop: 6 }}>
      {!!text && (
        <span style={{ color: ERR, fontSize: 11, lineHeight: "11px", fontWeight: 300 }}>
          {text}
        </span>
      )}
    </div>
  );
}

/* ——— чекбокс-квадрат ——— */
function Square({ checked }) {
  const size = 18, inner = 10;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, display: "inline-grid", placeItems: "center",
        border: `1px solid ${BORDER_DARK}`, borderRadius: 4, background: "transparent",
      }}
    >
      <span
        style={{
          width: inner, height: inner, borderRadius: 3, background: TEXT,
          transform: checked ? "scale(1)" : "scale(0)", transition: "transform 140ms ease-out",
        }}
      />
    </span>
  );
}

/* ——— кликабельный «чип» без контура ——— */
function Chip({ label, selected, onToggle }) {
  const baseBg = "#f8f8f8";
  const hoverBg = "#f2f2f2";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="chip"
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        height: 40, padding: "0 14px",
        borderRadius: 10,
        border: "none",
        background: selected ? "#fff" : baseBg,
        cursor: "pointer", userSelect: "none",
        transition: "background-color .12s ease",
        fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT,
      }}
      onMouseEnter={(e)=>{ if(!selected) e.currentTarget.style.background=hoverBg; }}
      onMouseLeave={(e)=>{ if(!selected) e.currentTarget.style.background=baseBg; }}
    >
      <Square checked={selected} />
      <span>{label}</span>
    </button>
  );
}

/* ——— лэйаут поля ——— */
function Field({ label, required, children, error }) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase", color: TEXT, fontWeight: 300, marginBottom: 6 }}>
        {label}{required ? " (*)" : ""}
      </div>
      {children}
      <ErrorSlot text={error} />
    </div>
  );
}

/* ——— элементы формы (без контура) ——— */
function Input({ value, onChange, placeholder, error, type="text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", height: FIELD_H,
        border: "none",
        background: "#fff", color: TEXT,
        borderRadius: R, outline: "none", padding: "0 12px",
        fontFamily: UI, fontSize: 14, fontWeight: 300,
        boxShadow: error ? `inset 0 0 0 1px ${ERR}` : "none",
      }}
    />
  );
}

function Select({ value, onChange, options, error }) {
  return (
    <select
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      style={{
        width: "100%", height: FIELD_H,
        border: "none",
        background: "#fff", color: TEXT,
        borderRadius: R, outline: "none", padding: "0 12px",
        fontFamily: UI, fontSize: 14, fontWeight: 300,
        appearance: "none",
        backgroundImage: `linear-gradient(45deg, transparent 50%, ${MUTED} 50%), linear-gradient(135deg, ${MUTED} 50%, transparent 50%)`,
        backgroundPosition: "calc(100% - 18px) 18px, calc(100% - 12px) 18px",
        backgroundSize: "6px 6px, 6px 6px",
        backgroundRepeat: "no-repeat",
        boxShadow: error ? `inset 0 0 0 1px ${ERR}` : "none",
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, rows=5, error, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: "none",
        background: "#fff", color: TEXT,
        borderRadius: R, outline: "none", padding: "12px",
        fontFamily: UI, fontSize: 14, fontWeight: 300, resize: "vertical",
        minHeight: 120,
        boxShadow: error ? `inset 0 0 0 1px ${ERR}` : "none",
      }}
    />
  );
}

/* ——— индикатор шага ——— */
function StepDot({ active, done }) {
  const inner = Math.round(STEP_D * STEP_FILL);
  return (
    <span
      aria-hidden="true"
      style={{
        width: STEP_D, height: STEP_D, borderRadius: 9999, position: "relative",
        border: `1px solid ${done || active ? TEXT : BORDER_DARK}`,
        background: done ? TEXT : (active ? "#fff" : "transparent"),
        display: "inline-block",
      }}
    >
      {active && (
        <span
          aria-hidden="true"
          style={{
            width: inner, height: inner, borderRadius: 9999,
            background: TEXT,
            position: "absolute", inset: 0, margin: "auto",
          }}
        />
      )}
    </span>
  );
}

/* ——— страница ——— */
export default function ProJobsPage() {
  // базовые
  const [fio, setFio] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [city, setCity] = React.useState("");
  const [region, setRegion] = React.useState("Выберите регион");
  const [regionOther, setRegionOther] = React.useState("");

  // роль / занятость
  const roles = [
    "Электромонтажник",
    "Монтажник СКС / СКУД / CCTV",
    "Инженер-проектировщик",
    "Инженер ПНР (пусконаладка)",
    "Слесарь / разнорабочий",
    "Бригадир / прораб",
    "Сервисный инженер",
    "Другое"
  ];
  const [role, setRole] = React.useState("");
  const [employment, setEmployment] = React.useState("");

  // опыт/навыки
  const [exp, setExp] = React.useState("");
  const skills = [
    "Электромонтаж (ВРУ, щиты, кабельные линии)",
    "Слаботочные системы",
    "Вентиляция / дымоудаление (монтаж, обвязка)",
    "Кондиционирование",
    "Отопление / ИТП / БТП",
    "Водоснабжение и канализация (ХВС/ГВС, ВК)",
    "Автоматика / АСУ ТП / КИПиА",
    "Проектирование (ЭОМ / ОВ / ВК / СС)",
    "ПНР, балансировка, измерения",
    "Сервис и ТО",
    "Другое",
  ];
  const [skillset, setSkillset] = React.useState([]);
  const permits = [
    "Электробезопасность II","Электробезопасность III","Электробезопасность IV","Электробезопасность V",
    "Работы на высоте","Стропальщик","ПТМ / ПТБ","Сварка","Пайка медных труб","ПНР / измерения","Нет / в процессе","Другое"
  ];
  const [permset, setPermset] = React.useState([]);
  const tools = ["Есть ручной инструмент","Есть электроинструмент","Есть автомобиль","Нет"];
  const [toolset, setToolset] = React.useState([]);

  // доступность/условия
  const [start, setStart] = React.useState("");
  const [travel, setTravel] = React.useState("");
  const schedules = ["5/2","Смены 2/2","Ночные смены","Выходные по согласованию"];
  const [sched, setSched] = React.useState([]);

  const [payType, setPayType] = React.useState("");
  const [income, setIncome] = React.useState("");
  const [customIncome, setCustomIncome] = React.useState("");

  // портфолио/комментарий
  const [link, setLink] = React.useState("");
  const [about, setAbout] = React.useState("");

  // финал
  const [agree, setAgree] = React.useState(false);
  const [preferred, setPreferred] = React.useState("");

  const [errors, setErrors] = React.useState({});

  const regionOptions = [
    "Выберите регион","Москва","Санкт-Петербург","Московская область",
    "Ленинградская область","Свердловская область","Краснодарский край",
    "Татарстан","Новосибирская область","Другое",
  ];

  const expOptions = ["Без опыта","1–2 года","3–5 лет","6–9 лет","10+ лет"];

  const startOptions = ["Сегодня–завтра","В течение недели","В течение месяца","Обсудим"];
  const travelOptions = ["Готов к вахте","Готов к коротким командировкам","Только в городе","Обсудим"];
  const payOptions = ["Почасовая","За смену","Ежемесячная","Сдельная (за объект)"];
  const incomeShift = ["За смену: 3–4 тыс ₽","За смену: 4–6 тыс ₽","За смену: 6–8 тыс ₽","За смену: 8+ тыс ₽"];
  const incomeMonth = ["В месяц: до 60\u00A0000 ₽","В месяц: 60–90\u00A0000 ₽","В месяц: 90–130\u00A0000 ₽","В месяц: 130\u00A0000+ ₽","Укажу свой уровень"];

  const toggleMulti = (arr, setArr, value) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : arr.concat(value));
  };

  const scrollToFirstError = (map) => {
    const keys = Object.keys(map).filter(k=>map[k]);
    if (!keys.length) return;
    const el = document.querySelector(`[data-err-key="${keys[0]}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    const next = {};

    if (!fio.trim()) next.fio = "Укажите фамилию и имя.";
    if (!phone.trim() || !isPhoneLike(phone)) next.phone = "Укажите телефон в формате +7 (XXX) XXX-XX-XX.";
    if (email.trim() && !isEmail(email)) next.email = "Неверный формат e-mail.";
    if (region === "Выберите регион") next.region = "Выберите регион.";
    if (region === "Другое" && !regionOther.trim()) next.regionOther = "Уточните регион.";
    if (!role) next.role = "Выберите должность.";
    if (!employment) next.employment = "Выберите формат занятости.";
    if (!exp) next.exp = "Укажите опыт работы.";
    if (skillset.length === 0) next.skillset = "Отметьте хотя бы одно направление.";
    if (!start) next.start = "Выберите дату начала.";
    if (!travel) next.travel = "Укажите готовность к командировкам/вахте.";
    if (sched.length === 0) next.sched = "Выберите хотя бы один вариант графика.";
    if (!payType) next.payType = "Выберите формат оплаты.";
    if (!income) next.income = "Выберите ожидаемый доход.";
    if (income === "Укажу свой уровень" && !String(customIncome).trim()) next.customIncome = "Укажите сумму.";
    if (!agree) next.agree = "Дайте согласие на обработку данных.";

    setErrors(next);
    scrollToFirstError(next);

    const ok = Object.values(next).every(v => !v);
    if (!ok) return;

    const payload = {
      fio, phone, email, city, region, regionOther, role, employment, exp, skillset,
      permits: permset, tools: toolset, start, travel, schedule: sched,
      payType, income, customIncome, link, about, agree, preferred,
    };
    console.log("[pro] payload", payload);
    alert("Заявка заполнена корректно.\nОтправку подключим позже.");
  };

  const clearAll = () => {
    setFio(""); setPhone(""); setEmail(""); setCity(""); setRegion("Выберите регион"); setRegionOther("");
    setRole(""); setEmployment(""); setExp(""); setSkillset([]); setPermset([]); setToolset([]);
    setStart(""); setTravel(""); setSched([]); setPayType(""); setIncome(""); setCustomIncome("");
    setLink(""); setAbout(""); setAgree(false); setPreferred("");
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ——— ids секций и активный шаг ——— */
  const sections = [
    { id: "contacts",  title: "Контактные данные" },
    { id: "role",      title: "Желаемая позиция" },
    { id: "skills",    title: "Опыт и навыки" },
    { id: "availability", title: "Готовность к работе" },
    { id: "portfolio", title: "Портфолио" },
  ];
  const [activeId, setActiveId] = React.useState(sections[0].id);

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target?.id) setActiveId(visible.target.id);
    }, {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []); // eslint-disable-line

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main style={{ background: BG, minHeight: "100dvh", fontFamily: UI, color: TEXT }}>
      {/* ——— верхняя зона ——— */}
      <div style={{ paddingTop: 54, paddingBottom: 22, textAlign: "center" }}>
        {/* Часть 1: поднята на 80px */}
        <div style={{ transform: "translateY(-80px)" }}>
          <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, color: MUTED }}>Вакансии</div>
          <h1 className="about-hero-title" style={{ margin: 0, textTransform: "uppercase", fontWeight: 600 }}>
            РАБОТА В КУБ
          </h1>
          <div style={{ marginTop: 12, fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#222" }}>
            Мы — компания КУБ, занимаемся инженерными системами под ключ: электрика, слаботочка, ОВиК и многое другое.
            <br/>
            Проекты по всей России. Приглашаем монтажников, инженеров и студентов — на временную и постоянную работу.
          </div>
        </div>
        {/* спейсер, чтобы ниже ничего не уехало */}
        <div style={{ height: 80 }} />

        {/* Часть 2: остаётся на месте */}
        <div>
          <div style={{ marginTop: 22, fontSize: 21, lineHeight: "28px", fontWeight: 600, color: "#222" }}>
            Архитектура карьеры строится из реальных задач.
          </div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: "24px", fontWeight: 300, color: "#222" }}>
            Ниже — анкета. Заполните её, и мы свяжемся с вами.
          </div>
        </div>
      </div>

      {/* ——— контент: sidebar + центр + заметка ——— */}
      <div
        className="pro-wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(640px, 1fr) 280px",
          gap: 20,
          width: `calc(100% - ${EDGE * 2}px)`,
          margin: "0 auto",
          paddingBottom: 60,
          alignItems: "start",
        }}
      >
        {/* ЛЕВЫЙ СИДЕБАР (Этапы) */}
        <aside
          style={{
            background: "#ededed", border: "none", borderRadius: 14,
            padding: 16, position: "sticky", top: 24,
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: TEXT, fontWeight: 300, marginBottom: 10 }}>
            Этапы
          </div>

          {sections.map((s) => {
            const active = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                style={{
                  display: "grid", gridTemplateColumns: "18px 1fr", alignItems: "center", gap: 10,
                  padding: "10px 6px", borderRadius: 8, width: "100%",
                  textAlign: "left", background: active ? "#f6f7f8" : "transparent",
                  border: "none", cursor: "pointer",
                }}
              >
                <StepDot active={active} done={false} />
                <span style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>{s.title}</span>
              </button>
            );
          })}
        </aside>

        {/* ЦЕНТРАЛЬНАЯ КАРТОЧКА */}
        <section
          style={{
            background: "#ededed", border: "none", borderRadius: 14,
            padding: 18,
          }}
        >
          {/* Блок 1: Контактные данные */}
          <div id="contacts" style={{ scrollMarginTop: 90, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Контактные данные</div>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div data-err-key="fio">
                <Field label="Как к вам обращаться?" required error={errors.fio}>
                  <Input value={fio} onChange={setFio} placeholder="ФИО" error={errors.fio}/>
                </Field>
              </div>
              <div data-err-key="phone">
                <Field label="Телефон для связи" required error={errors.phone}>
                  <Input value={phone} onChange={setPhone} placeholder="+7 (900) 000-00-00" error={errors.phone}/>
                </Field>
              </div>
              <div data-err-key="email">
                <Field label="Электронная почта" error={errors.email}>
                  <Input type="email" value={email} onChange={setEmail} placeholder="name@domain.ru" error={errors.email}/>
                </Field>
              </div>
              <div />
              <div data-err-key="city">
                <Field label="Город">
                  <Input value={city} onChange={setCity} placeholder="Например: Ноябрьск" />
                </Field>
              </div>
              <div data-err-key="region">
                <Field label="Регион" required error={errors.region}>
                  <Select value={region} onChange={setRegion} options={regionOptions} error={errors.region}/>
                </Field>
              </div>
              {region === "Другое" && (
                <div data-err-key="regionOther" style={{ gridColumn: "1 / -1" }}>
                  <Field label="Регион (уточните)" required error={errors.regionOther}>
                    <Input value={regionOther} onChange={setRegionOther} placeholder="Укажите регион" error={errors.regionOther}/>
                  </Field>
                </div>
              )}
            </div>
          </div>

          {/* Блок 2: Желаемая позиция */}
          <div id="role" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Желаемая позиция</div>

            <div data-err-key="role">
              <Field label="Должность" required error={errors.role}/>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {roles.map(r => (
                  <Chip
                    key={r}
                    label={r}
                    selected={role === r}
                    onToggle={() => setRole(role === r ? "" : r)}
                  />
                ))}
              </div>
              <ErrorSlot text={errors.role}/>
            </div>

            <div data-err-key="employment" style={{ marginTop: 8 }}>
              <Field label="Формат занятости" required error={errors.employment}/>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {["Проектная (временная)","Постоянная","Не имеет значения"].map(v => (
                  <Chip
                    key={v}
                    label={v}
                    selected={employment === v}
                    onToggle={() => setEmployment(employment === v ? "" : v)}
                  />
                ))}
              </div>
              <ErrorSlot text={errors.employment}/>
            </div>
          </div>

          {/* Блок 3: Опыт и навыки */}
          <div id="skills" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Опыт и навыки</div>

            <div data-err-key="exp">
              <Field label="Опыт работы" required error={errors.exp}/>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {expOptions.map(v => (
                  <Chip key={v} label={v} selected={exp === v} onToggle={()=>setExp(exp===v ? "" : v)} />
                ))}
              </div>
              <ErrorSlot text={errors.exp}/>
            </div>

            <div data-err-key="skillset" style={{ marginTop: 8 }}>
              <Field label="Основные направления работ" required error={errors.skillset}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {skills.map(s => (
                  <Chip
                    key={s}
                    label={s}
                    selected={skillset.includes(s)}
                    onToggle={()=>toggleMulti(skillset, setSkillset, s)}
                  />
                ))}
              </div>
              <ErrorSlot text={errors.skillset}/>
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Удостоверения / допуски">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {permits.map(s => (
                    <Chip
                      key={s}
                      label={s}
                      selected={permset.includes(s)}
                      onToggle={()=>toggleMulti(permset, setPermset, s)}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Инструмент и транспорт">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {tools.map(s => (
                    <Chip
                      key={s}
                      label={s}
                      selected={toolset.includes(s)}
                      onToggle={()=>toggleMulti(toolset, setToolset, s)}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Блок 4: Готовность к работе */}
          <div id="availability" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Готовность к работе</div>

            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div data-err-key="start">
                <Field label="Когда готовы приступить" required error={errors.start}/>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {startOptions.map(v=>(
                    <Chip key={v} label={v} selected={start===v} onToggle={()=>setStart(start===v ? "" : v)} />
                  ))}
                </div>
                <ErrorSlot text={errors.start}/>
              </div>

              <div data-err-key="travel">
                <Field label="Готовность к командировкам / вахте" required error={errors.travel}/>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {travelOptions.map(v=>(
                    <Chip key={v} label={v} selected={travel===v} onToggle={()=>setTravel(travel===v ? "" : v)} />
                  ))}
                </div>
                <ErrorSlot text={errors.travel}/>
              </div>
            </div>

            <div data-err-key="sched" style={{ marginTop: 8 }}>
              <Field label="Предпочитаемый график" required error={errors.sched}/>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {schedules.map(v=>(
                  <Chip key={v} label={v} selected={sched.includes(v)} onToggle={()=>toggleMulti(sched, setSched, v)} />
                ))}
              </div>
              <ErrorSlot text={errors.sched}/>
            </div>

            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
              <div data-err-key="payType">
                <Field label="Формат оплаты" required error={errors.payType}/>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {payOptions.map(v=>(
                    <Chip key={v} label={v} selected={payType===v} onToggle={()=>setPayType(payType===v ? "" : v)} />
                  ))}
                </div>
                <ErrorSlot text={errors.payType}/>
              </div>

              <div data-err-key="income">
                <Field label="Ожидаемый доход" required error={errors.income}/>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {incomeShift.concat(incomeMonth).map(v=>(
                    <Chip key={v} label={v} selected={income===v} onToggle={()=>setIncome(income===v ? "" : v)} />
                  ))}
                </div>
                <ErrorSlot text={errors.income}/>
              </div>
            </div>

            {income === "Укажу свой уровень" && (
              <div data-err-key="customIncome" style={{ marginTop: 8 }}>
                <Field label="Ваш ожидаемый уровень дохода" required error={errors.customIncome}>
                  <Input
                    value={customIncome}
                    onChange={setCustomIncome}
                    placeholder="Например: 6 000 ₽ за смену / 120 000 ₽ в месяц"
                    error={errors.customIncome}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Блок 5: Портфолио */}
          <div id="portfolio" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Портфолио</div>

            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Field label="Ссылка на портфолио / резюме">
                  <Input value={link} onChange={setLink} placeholder="https://…" />
                </Field>
              </div>
              <div>
                <Field label="Резюме (файл)">
                  <input
                    type="file"
                    style={{
                      width: "100%", height: FIELD_H,
                      border: "none",
                      borderRadius: R, padding: 10, background: "#fff",
                      fontFamily: UI, fontSize: 14, fontWeight: 300
                    }}
                  />
                </Field>
              </div>
            </div>

            {/* Подсказка — ниже блока, light 300 */}
            <div style={{ marginTop: 6, fontSize: 12, lineHeight: "16px", fontWeight: 300, color: MUTED }}>
              PDF, DOCX — по возможности до 10 МБ
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Коротко о себе">
                <Textarea value={about} onChange={setAbout} placeholder="Например: есть бригада; готов к ночным сменам; нужен аванс и т. п." />
              </Field>
            </div>
          </div>

          {/* Блок 6: Согласия и связь */}
          <div style={{ marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div data-err-key="agree">
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={()=>setAgree(v=>!v)}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                    aria-pressed={agree}
                  >
                    <Square checked={agree} />
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
                    Даю согласие на обработку персональных данных и подтверждаю ознакомление с{" "}
                    <a href="/legal/privacy" style={{ color: TEXT, textDecoration: "none" }}>
                      <strong>Политикой конфиденциальности</strong>
                    </a>.
                  </div>
                </div>
                <ErrorSlot text={errors.agree}/>
              </div>

              <div>
                <Field label="Предпочтительный способ связи">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {["Позвонить","Telegram","WhatsApp","Email","Без разницы"].map(v=>(
                      <Chip key={v} label={v} selected={preferred===v} onToggle={()=>setPreferred(preferred===v ? "" : v)} />
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 12 }}>
            <button
              type="button"
              onClick={clearAll}
              style={{
                height: 48, padding: "0 18px",
                background: "transparent", borderRadius: 10,
                border: `1px solid ${BORDER_DARK}`,
                fontFamily: UI, fontSize: 14, fontWeight: 600, color: TEXT, cursor: "pointer",
              }}
              onMouseEnter={(e)=>{ e.currentTarget.style.background="#f6f6f6"; }}
              onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; }}
            >
              Очистить форму
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                style={{
                  height: 48, padding: "0 18px",
                  background: "transparent", borderRadius: 10,
                  border: `1px solid ${BORDER_DARK}`,
                  fontFamily: UI, fontSize: 14, fontWeight: 600, color: TEXT, cursor: "pointer",
                }}
                onMouseEnter={(e)=>{ e.currentTarget.style.background="#f6f6f6"; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; }}
              >
                Сохранить и вернуться позже
              </button>

              <button
                type="button"
                onClick={onSubmit}
                style={{
                  height: 48, padding: "0 22px",
                  background: TEXT, color: "#fff", border: "none",
                  borderRadius: 10, fontFamily: UI, fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Отправить анкету
              </button>
            </div>
          </div>
        </section>

        {/* ПРАВАЯ ПАМЯТКА */}
        <aside
          style={{
            background: "#ededed", border: "none", borderRadius: 14,
            padding: 16, position: "sticky", top: 24,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Подсказка</div>
          <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
            Заполняйте только актуальные поля — чем точнее анкета, тем быстрее обратная связь.
            <br/><br/>
            Отклики рассматриваем в течение 1–2 рабочих дней. Если ответа нет, напишите на <strong>info@cube-tech.ru</strong>.
            <br/><br/>
            Мы не передаём ваши данные третьим лицам. Они используются только для связи по вакансии.
          </div>
        </aside>
      </div>
    </main>
  );
}
