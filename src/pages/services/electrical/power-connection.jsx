// src/pages/services/electrical/power-connection.jsx
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

/* ====== ТВОИ ТОКЕНЫ СТИЛЯ ====== */
const UI = "'Inter Tight','Inter',system-ui";
const GUTTER = 80;
const BLACK = "#000";
const TEXT = "#111";
const MUTED = "#A7A7A7";
const UNDERLINE = "#d7d7d7";
const UNDERLINE_FOCUS = "#8d8d8d";
const ERR = "#fa5d29";
const BG = "#f8f8f8";

/* ====== УТИЛИ ====== */
function formatRuDate(d = new Date()) {
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${mm} ${dd}, ${yy}`;
}

/* ====== БАЗОВЫЕ ПОЛЯ ====== */
const FIELD_H = 48;
function baseFieldStyle(error) {
  return {
    width: "100%",
    height: FIELD_H,
    border: "none",
    outline: "none",
    borderRadius: 0,
    background: "#fff",
    color: TEXT,
    padding: "0 12px",
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 300,
    boxShadow: error
      ? `inset 0 -1px 0 0 ${ERR}`
      : `inset 0 -1px 0 0 ${UNDERLINE}`,
    transition: "box-shadow .18s ease",
  };
}
function Input({ value, onChange, placeholder, error, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="with-ph"
      style={baseFieldStyle(error)}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = error
          ? `inset 0 -1px 0 0 ${ERR}`
          : `inset 0 -1px 0 0 ${UNDERLINE}`;
      }}
    />
  );
}
function Field({ label, required, children, error, dim = false }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: dim ? MUTED : TEXT,
          fontWeight: 300,
          marginBottom: 6,
        }}
      >
        {label}{required ? " (*)" : ""}
      </div>
      {children}
      <div style={{ minHeight: 18, paddingTop: 6 }}>
        {!!error && (
          <span style={{ color: ERR, fontSize: 11, lineHeight: "11px", fontWeight: 300 }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/* ====== КНОПКИ/КАПСУЛЫ ====== */
function CapsuleButton({ children, onClick, as = "button", href }) {
  const R = 12;
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    padding: "0 14px",
    border: "none",
    background: "transparent",
    boxShadow: "inset 0 0 0 0.5px #494949",
    borderRadius: R,
    color: BLACK,
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 400,
    cursor: "pointer",
    transition: "all 160ms ease",
    textDecoration: "none",
    userSelect: "none",
  };
  const onEnter = (e) => {
    e.currentTarget.style.background = BLACK;
    e.currentTarget.style.color = "#fff";
    e.currentTarget.style.textDecoration = "none";
  };
  const onLeave = (e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = BLACK;
    e.currentTarget.style.textDecoration = "none";
  };

  if (as === "a") {
    return (
      <a href={href} onClick={onClick} style={baseStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={baseStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
    </button>
  );
}

/* ====== ПРОСТОЙ ПУНКТИР ====== */
function DottedLine({ width = "100%" }) {
  return (
    <div
      style={{
        width,
        height: 1,
        backgroundImage:
          "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
      }}
    />
  );
}

/* ====== ПИЛЛЫ ДЛЯ ФАЗНОСТИ ====== */
function PhasePill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid #111" : "1px solid #cfcfcf",
        background: active ? "#fff" : "transparent",
        color: active ? "#111" : "#333",
        borderRadius: 999,
        height: 36,
        padding: "0 14px",
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 300,
        cursor: "pointer",
        transition: "border-color .14s ease, color .14s ease, background-color .14s ease",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "#111"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "#cfcfcf"; }}
    >
      {label}
    </button>
  );
}

/* ====== СТАТ-БОКС ====== */
function StatBox({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #000",  // чёрный контур
        borderRadius: 10,
        background: BG,            // заливка цветом фона
        padding: 14,
        minHeight: 90,
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 300 }}>
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 20, lineHeight: "28px", fontWeight: 600, color: "#111" }}>
        {value}
      </div>
    </div>
  );
}

/* ====== МАЛЕНЬКИЕ ИКОНКИ ====== */
const IconCalc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
    <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="#111" strokeWidth="1.6"/>
    <rect x="7" y="6" width="10" height="3" rx="1.2" fill="#111"/>
    <path d="M8 12h2M8 15h2M8 18h2M12 12h4M12 15h4M12 18h4" stroke="#111" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

/* ====== ГЛАВНАЯ СТРАНИЦА УСЛУГИ ====== */
export default function PowerConnectionPage() {
  // ---- состояние калькулятора
  const [address, setAddress] = React.useState("");
  const [power, setPower] = React.useState(30);
  const [distance, setDistance] = React.useState(100);
  const [phase, setPhase] = React.useState("3ф");
  const [showResult, setShowResult] = React.useState(false);

  const category = power <= 15 ? "до 15 кВт" : power <= 150 ? "15–150 кВт" : "150+ кВт";
  const estimateDays = React.useMemo(() => {
    let days = 30;
    if (power > 15 && power <= 150) days = 45;
    if (power > 150) days = 75;
    days += Math.ceil(distance / 200) * 5;
    if (days < 30) days = 30;
    if (days > 120) days = 120;
    return days;
  }, [power, distance]);
  const weeks = Math.round(estimateDays / 7);

  const steps = [
    "Получаем ТУ и заключаем договор ТП",
    "Проект ВЛ/КЛ и согласования",
    "Земляные/кабельные работы и ввод в здание",
    "Монтаж и пусконаладка щита учёта/ввода",
    "Приёмка сетевой, при необходимости — Ростехнадзор",
  ];

  // CSS для плейсхолдера
  React.useEffect(() => {
    const css = document.createElement("style");
    css.textContent = `.with-ph::placeholder{color:${MUTED};opacity:1}`;
    document.head.appendChild(css);
    return () => css.remove();
  }, []);

  const today = formatRuDate();

  function onCalc(e) {
    e?.preventDefault?.();
    setShowResult(true);
  }

  // заполнение трека для range
  const powerFill = `${((power - 1) / (300 - 1)) * 100}%`;
  const distFill  = `${(distance / 1000) * 100}%`;

  return (
    <main style={{ fontFamily: UI, color: BLACK, background: BG }}>
      <style>{`
        .electro-tabs{ text-align:center; margin-top:30px; }
        .electro-tabs a{
          color:${MUTED};
          text-decoration:none;
          transition:color .16s ease;
          letter-spacing:normal;
          font-size:14px;
          line-height:28px;
          font-weight:300;
          text-transform:uppercase;
          padding:0 10px;
          display:inline-block;
          margin:0 4px 8px 4px;
          cursor:pointer;
        }
        .electro-tabs a:hover{ color:${BLACK}; }
        .electro-tabs a.is-active{ color:${BLACK}; }
        .electro-title{ margin:0; text-transform:uppercase; font-weight:600; text-align:center; }
        .electro-sub{ margin:0; text-align:center; font-size:21px; line-height:28px; font-weight:600; color:#222222; }
        .electro-tabs-wrap{ display:inline-flex; flex-wrap:wrap; max-width:1080px; justify-content:center; }

        /* ===== СТИЛИЗАЦИЯ RANGE ===== */
        input[type="range"]{
          -webkit-appearance:none;
          appearance:none;
          width:100%;
          background:transparent;
          outline:none; /* без контура */
        }
        /* трек: прямоугольный, без скруглений; WebKit — через градиент по var(--fill) */
        input[type="range"]::-webkit-slider-runnable-track{
          height:6px;
          border:none;
          border-radius:0; /* острые края */
          background: linear-gradient(
            to right,
            #3e3e3e 0,
            #3e3e3e var(--fill, 0%),
            #dcdcdc var(--fill, 0%),
            #dcdcdc 100%
          );
        }
        input[type="range"]::-moz-range-track{
          height:6px;
          border:none;
          border-radius:0; /* острые края */
          background:#dcdcdc;
        }
        /* прогресс для Firefox */
        input[type="range"]::-moz-range-progress{
          height:6px;
          border:none;
          border-radius:0;
          background:#3e3e3e;
        }
        /* бегунок — КРУГЛЫЙ, как был */
        input[type="range"]::-webkit-slider-thumb{
          -webkit-appearance:none;
          appearance:none;
          width:14px;
          height:14px;
          background:#3e3e3e;
          border:none;
          border-radius:50%;
          margin-top:-4px; /* центрируем по треку */
        }
        input[type="range"]::-moz-range-thumb{
          width:14px;
          height:14px;
          background:#3e3e3e;
          border:none;
          border-radius:50%;
        }
      `}</style>

      {/* ВЕРХНЯЯ ЗОНА — как было (поднята на 61px) */}
      <div style={{ transform: "translateY(-61px)", willChange: "transform" }}>
        <div className="electro-tabs">
          <div className="electro-tabs-wrap">
            <SpaLink to="/services/electrical#grid-connect" className="is-active">
              Подключение объектов к электросетям
            </SpaLink>
            <SpaLink to="/services/electrical#power-upgrade">
              Увеличение мощности и модернизация сетей
            </SpaLink>
            <SpaLink to="/services/electrical#indoor">
              Внутренние электромонтажные работы
            </SpaLink>
            <SpaLink to="/services/electrical#outdoor">
              Наружные электросети и уличное освещение
            </SpaLink>
            <SpaLink to="/services/electrical#switchgear">
              Монтаж электрощитов и ВРУ
            </SpaLink>
            <SpaLink to="/services/electrical#earthing">
              Системы заземления и молниезащиты
            </SpaLink>
            <SpaLink to="/services/electrical#automation">
              Автоматизация и учёт электроэнергии
            </SpaLink>
            <SpaLink to="/services/electrical#backup">
              Резервное электроснабжение
            </SpaLink>
          </div>
        </div>

        {/* Заголовок */}
        <div style={{ textAlign: "center", position: "relative", marginTop: 2 }}>
          <h2 className="electro-title about-hero-title">
            <span style={{ display: "block" }}>ПОДКЛЮЧЕНИЕ ОБЪЕКТОВ</span>
            <span style={{ display: "block" }}>К ЭЛЕКТРОСЕТЯМ</span>
          </h2>
        </div>

        {/* Лид */}
        <div style={{ background: BG, marginTop: 12, marginBottom: 0, padding: 0 }}>
          <p className="electro-sub">
            Подготовим техусловия, проект и фактическое подключение «под ключ».<br/>
            Без беготни по инстанциям.
          </p>
        </div>
      </div>

      {/* Метка обновления — тоже как была */}
      <div style={{ marginTop: -61, marginLeft: GUTTER, marginRight: GUTTER, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ fontSize: 14, fontWeight: 300, color: "#3b3b3b" }}>Обновление: {today}</div>
      </div>

      {/* ВСЁ НИЖЕ — опускаем на 119px */}
      <div style={{ marginTop: 119 }}>
        {/* Блок: Что делаем / Результат */}
        <section style={{ marginTop: 64, marginLeft: GUTTER, marginRight: GUTTER }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Что делаем */}
            <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Что делаем</div>
              <DottedLine />
              <ul style={{ margin: "12px 0 0 16px", padding: 0, listStyle: "disc" }}>
                <li style={liStyle}>ТУ, договор технологического присоединения, проект ВЛ/КЛ</li>
                <li style={liStyle}>Трассировка, земляные работы, ввод в здание</li>
                <li style={liStyle}>Щит учёта/ввода, пусконаладка</li>
                <li style={liStyle}>Сдача сетевой организации и Ростехнадзор (при необходимости)</li>
              </ul>
            </div>

            {/* Результат и документы */}
            <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Результат и документы</div>
              <DottedLine />
              <ul style={{ margin: "12px 0 0 16px", padding: 0, listStyle: "disc" }}>
                <li style={liStyle}>Введённая мощность по договору ТП</li>
                <li style={liStyle}>Исполнительная документация и схемы</li>
                <li style={liStyle}>Протоколы измерений, акты скрытых работ</li>
                <li style={liStyle}>Соответствие ПУЭ / ГОСТ / ПТЭЭП</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Калькулятор ТП */}
        <section style={{ marginTop: 64, marginLeft: GUTTER, marginRight: GUTTER }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Левая часть — форма */}
            <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <IconCalc />
                <div style={{ fontSize: 18, fontWeight: 600, color: TEXT }}>Калькулятор ТП</div>
              </div>
              <DottedLine />

              <form onSubmit={onCalc} style={{ marginTop: 14 }}>
                <Field label="Адрес объекта" required>
                  <Input value={address} onChange={setAddress} placeholder="Город, улица, дом" />
                </Field>

                {/* Мощность */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#333" }}>
                    <span>Запрашиваемая мощность, кВт</span>
                    <span style={{ fontWeight: 600 }}>{power} кВт</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="300"
                    step="1"
                    value={power}
                    onChange={(e) => setPower(parseInt(e.target.value))}
                    style={{ width: "100%", "--fill": powerFill }}
                    aria-label="Запрашиваемая мощность, кВт"
                  />
                </div>

                {/* Дистанция */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#333" }}>
                    <span>Расстояние до ближайшей сети, м</span>
                    <span style={{ fontWeight: 600 }}>{distance} м</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    style={{ width: "100%", "--fill": distFill }}
                    aria-label="Расстояние до ближайшей сети, м"
                  />
                </div>

                {/* Фазность */}
                <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                  <PhasePill label="1 фаза"  active={phase === "1ф"} onClick={() => setPhase("1ф")} />
                  <PhasePill label="3 фазы" active={phase === "3ф"} onClick={() => setPhase("3ф")} />
                </div>

                {/* CTA */}
                <div style={{ marginTop: 18 }}>
                  <button
                    type="submit"
                    style={{
                      height: 48,
                      padding: "0 16px",
                      borderRadius: 10,
                      border: "none",
                      background: BLACK,
                      color: "#fff",
                      fontFamily: UI,
                      fontSize: 16,
                      fontWeight: 300,
                      cursor: "pointer",
                      transition: "filter .15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.92)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                  >
                    Рассчитать
                  </button>
                </div>
              </form>
            </div>

            {/* Правая часть — оценка */}
            <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Оценка</div>
              <DottedLine />

              <div style={{ marginTop: 14, display: "grid", rowGap: 10 }}>
                <Row label="Адрес">{address || "—"}</Row>
                <Row label="Мощность">{power} кВт ({phase})</Row>
                <Row label="Категория">{category}</Row>
                <Row label="Ориентировочный срок">
                  {`${estimateDays} дней (~${weeks} нед.)`} <span style={{ color: "#6b7280" }}> (проект + СМР)</span>
                </Row>

                <div style={{ marginTop: 8 }}>
                  <div style={{ color: "#333", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Ближайшие шаги</div>
                  <ol style={{ margin: 0, paddingLeft: 18, color: "#333", fontSize: 14, fontWeight: 300 }}>
                    {steps.map((s, i) => (<li key={i} style={{ marginBottom: 6 }}>{s}</li>))}
                  </ol>
                </div>

                <div style={{ marginTop: 10 }}>
                  <CapsuleButton onClick={() => setShowResult(true)}>
                    Оценить подключение по адресу
                  </CapsuleButton>
                  {showResult && (
                    <p style={{ marginTop: 10, color: "#6b7280", fontSize: 14, fontWeight: 300 }}>
                      Оставьте адрес и мощность — мы уточним ТУ и вернёмся со сроками и чек-листом документов.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Статы */}
        <section style={{ marginTop: 32, marginLeft: GUTTER, marginRight: GUTTER }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
            <StatBox title="Типовой срок" value={`${Math.max(30, Math.min(estimateDays, 90))} дней`} />
            <StatBox title="Категория присоединения" value={category} />
            <StatBox title="Следующее действие" value="Оставить адрес и мощность" />
          </div>
        </section>

        {/* Низ — навигация/возврат */}
        <section style={{ marginTop: 48, marginLeft: GUTTER, marginRight: GUTTER, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#3b3b3b", fontSize: 14, fontWeight: 300 }}>
            Страница услуги в составе раздела «Электромонтаж».
          </div>
          <CapsuleButton as="a" href="/services/electrical">
            ← Все услуги электромонтажа
          </CapsuleButton>
        </section>
      </div>

      <div style={{ height: 120 }} />
    </main>
  );
}

/* ====== МЕЛКИЕ ВСПОМОГАТЕЛЬНЫЕ ====== */
const liStyle = { fontSize: 16, lineHeight: "26px", fontWeight: 300, color: BLACK, marginBottom: 8 };

function Row({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, alignItems: "start" }}>
      <div style={{ color: "#6b7280", fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 300 }}>
        {label}
      </div>
      <div style={{ color: "#111", fontSize: 14, fontWeight: 300 }}>{children}</div>
    </div>
  );
}
