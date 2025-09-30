// src/pages/services/electrical/power-upgrade.jsx
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

/* ====== TOKENS ====== */
const UI = "'Inter Tight','Inter',system-ui";
const GUTTER = 80;
const BLACK = "#000";
const TEXT = "#111";
const MUTED = "#A7A7A7";
const BG = "#f8f8f8";

/* ====== UTILS ====== */
function formatRuDate(d = new Date()) {
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${mm} ${dd}, ${yy}`;
}

/* ====== UI PRIMITIVES ====== */
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

function StatBox({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #000",    // чёрный контур
        borderRadius: 10,
        background: BG,              // заливка цветом фона
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

/* ====== QUIZ ====== */
function PillOption({ active, label, onClick }) {
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

function QuizQuestion({ index, title, value, onChange }) {
  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 10 }}>
        {index}. {title}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PillOption active={value === 2} label="Да" onClick={() => onChange(2)} />
        <PillOption active={value === 1} label="Иногда / планируется" onClick={() => onChange(1)} />
        <PillOption active={value === 0} label="Нет / не знаю" onClick={() => onChange(0)} />
      </div>
    </div>
  );
}

/* ====== PAGE ====== */
export default function PowerUpgradePage() {
  const today = formatRuDate();

  // quiz state: 6 вопросов, по 0/1/2 балла
  const [q, setQ] = React.useState([0,0,0,0,0,0]);
  const setAns = (i, val) => setQ((old) => old.map((v, idx) => idx === i ? val : v));
  const score = q.reduce((s, v) => s + v, 0);

  let verdict = { title: "Нужен аудит", text: "Рекомендуем обследование и расчёты. Вероятна частичная модернизация.", color: "#111" };
  if (score >= 7) verdict = { title: "Модернизация необходима", text: "Нагрузка растёт или защита не селективна. Нужны расчёты, замена линий/муфт и перенастройка защит.", color: "#111" };
  if (score <= 3) verdict = { title: "Пока можно не трогать", text: "Критичных симптомов нет. Проведём быстрый аудит лимита и защит для спокойствия.", color: "#111" };

  const [ctaShown, setCtaShown] = React.useState(false);

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
      `}</style>

      {/* ВЕРХНЯЯ ЗОНА (как на других страницах) */}
      <div style={{ transform: "translateY(-61px)", willChange: "transform" }}>
        <div className="electro-tabs">
          <div className="electro-tabs-wrap">
            <SpaLink to="/services/electrical#grid-connect">
              Подключение объектов к электросетям
            </SpaLink>
            <SpaLink to="/services/electrical#power-upgrade" className="is-active">
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
            <span style={{ display: "block" }}>УВЕЛИЧЕНИЕ МОЩНОСТИ</span>
            <span style={{ display: "block" }}>И МОДЕРНИЗАЦИЯ СЕТЕЙ</span>
          </h2>
        </div>

        {/* Лид */}
        <div style={{ background: BG, marginTop: 12, marginBottom: 0, padding: 0 }}>
          <p className="electro-sub">
            Поднимем лимит мощности и обновим распределение так, чтобы хватало «с&nbsp;запасом»,<br/>
            а сеть была безопасной.
          </p>
        </div>
      </div>

      {/* Метка обновления */}
      <div style={{ marginTop: -61, marginLeft: GUTTER, marginRight: GUTTER, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ fontSize: 14, fontWeight: 300, color: "#3b3b3b" }}>Обновление: {today}</div>
      </div>

      {/* НИЖЕ — ОТСТУП НА 119px */}
      <div style={{ marginTop: 119 }}>
        {/* Блок: Что делаем / Результат */}
        <section style={{ marginTop: 64, marginLeft: GUTTER, marginRight: GUTTER }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Что делаем */}
            <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Что делаем</div>
              <DottedLine />
              <ul style={{ margin: "12px 0 0 16px", padding: 0, listStyle: "disc" }}>
                <li style={liStyle}>расчёты нагрузок/ТКЗ, заявка на увеличение;</li>
                <li style={liStyle}>модернизация КЛ/ВЛ, замена кабелей и муфт;</li>
                <li style={liStyle}>перенастройка защит, селективность;</li>
                <li style={liStyle}>переразделение групп.</li>
              </ul>
            </div>

            {/* Результат и документы */}
            <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Результат и документы</div>
              <DottedLine />
              <ul style={{ margin: "12px 0 0 16px", padding: 0, listStyle: "disc" }}>
                <li style={liStyle}>новый лимит мощности;</li>
                <li style={liStyle}>акты испытаний;</li>
                <li style={liStyle}>селективность подтверждена.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Интерактив: квиз */}
        <section style={{ marginTop: 64, marginLeft: GUTTER, marginRight: GUTTER }}>
          <div style={{ border: "1px solid #000", borderRadius: 10, background: BG, padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>
              Нужна ли вам модернизация?
            </div>
            <DottedLine />

            <div style={{ marginTop: 14 }}>
              <QuizQuestion
                index={1}
                title="Часто срабатывает вводной автомат или наблюдаются просадки напряжения?"
                value={q[0]}
                onChange={(v) => setAns(0, v)}
              />
              <QuizQuestion
                index={2}
                title="Планируется рост подключаемой нагрузки &gt; 20%?"
                value={q[1]}
                onChange={(v) => setAns(1, v)}
              />
              <QuizQuestion
                index={3}
                title="Кабельные линии/муфты старше 15 лет или есть перегрев/повреждения?"
                value={q[2]}
                onChange={(v) => setAns(2, v)}
              />
              <QuizQuestion
                index={4}
                title="Были неселективные отключения (вырубает «выше», чем должно)?"
                value={q[3]}
                onChange={(v) => setAns(3, v)}
              />
              <QuizQuestion
                index={5}
                title="Добавились новые группы/оборудование (станки, серверные, зарядки ЭВ)?"
                value={q[4]}
                onChange={(v) => setAns(4, v)}
              />
              <QuizQuestion
                index={6}
                title="Токи КЗ/уставки защит не подтверждены актуальными расчётами?"
                value={q[5]}
                onChange={(v) => setAns(5, v)}
              />
            </div>

            {/* Резюме по ответам */}
            <div style={{ marginTop: 18, border: "1px solid #000", borderRadius: 10, background: BG, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
                Итог: {verdict.title}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: TEXT }}>
                {verdict.text}
              </div>
              <div style={{ marginTop: 10 }}>
                <CapsuleButton onClick={() => setCtaShown(true)}>
                  Проверить ваш лимит и узкие места
                </CapsuleButton>
                {ctaShown && (
                  <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14, fontWeight: 300 }}>
                    Оставьте вводные (лимит, основные группы, вводной автомат) — подготовим чек-лист модернизации и сроки.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Сроки и статусы */}
        <section style={{ marginTop: 32, marginLeft: GUTTER, marginRight: GUTTER }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
            <StatBox title="Типовой срок" value="2–8 недель" />
            <StatBox title="Направление" value="Распред. сети" />
            <StatBox title="Следующее действие" value="Проверить лимит и узкие места" />
          </div>
        </section>

        {/* Низ — навигация/возврат */}
        <section
          style={{
            marginTop: 48,
            marginLeft: GUTTER,
            marginRight: GUTTER,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
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

/* ====== minor ====== */
const liStyle = { fontSize: 16, lineHeight: "26px", fontWeight: 300, color: BLACK, marginBottom: 8 };
