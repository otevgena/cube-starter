// src/pages/services/electrical/index.jsx
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

const UI = "'Inter Tight','Inter',system-ui";
const GUTTER = 80;
const BLACK = "#000";
const MUTED = "#A7A7A7";

// ----- Данные услуг для таблицы (сохраняем прежний список) -----
const LINES = [
  { key: "grid-connect",   title: "Подключение объектов к электросетям",     dir: "Внешние сети",   href: "/services/electrical#grid-connect" },
  { key: "power-upgrade",  title: "Увеличение мощности и модернизация сетей", dir: "Распред. сети", href: "/services/electrical#power-upgrade" },
  { key: "indoor",         title: "Внутренние электромонтажные работы",       dir: "Внутренние сети",href: "/services/electrical#indoor" },
  { key: "outdoor",        title: "Наружные электросети и уличное освещение", dir: "Наружные сети",  href: "/services/electrical#outdoor" },
  { key: "switchgear",     title: "Монтаж электрощитов и ВРУ",                dir: "Щитовое",        href: "/services/electrical#switchgear" },
  { key: "earthing",       title: "Системы заземления и молниезащиты",        dir: "Безопасность",   href: "/services/electrical#earthing" },
  { key: "automation",     title: "Автоматизация и учёт электроэнергии",      dir: "Автоматизация",  href: "/services/electrical#automation" },
  { key: "backup",         title: "Резервное электроснабжение",               dir: "Надёжность",     href: "/services/electrical#backup" },
];

// ----- Данные для графика -----
const METRICS = [
  { key: "montage",  label: "Монтаж",           sharePct: 40, score10: 4.0 },
  { key: "design",   label: "Проектирование",   sharePct: 25, score10: 2.5 },
  { key: "auto",     label: "Автоматизация",    sharePct: 15, score10: 1.5 },
  { key: "qa",       label: "Контроль качества",sharePct: 12, score10: 1.2 },
  { key: "service",  label: "Сервис",           sharePct: 8,  score10: 0.8 },
];

const HEADER_H = 72;
const ROW_H = 104;
const TEXT_SHIFT = 28;

// пунктирная горизонтальная линия (как в Project.jsx)
function DottedLine() {
  return (
    <div
      style={{
        width: "100%",
        height: 1,
        backgroundImage:
          "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
      }}
    />
  );
}

// Кнопка «Подробнее» — тот же стиль, без подчёркивания
function CellButtonLink({ to }) {
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
    color: "#000",
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 400,
    cursor: "pointer",
    transition: "all 160ms ease",
    textDecoration: "none",
  };
  const onEnter = (e) => {
    e.currentTarget.style.background = "#000";
    e.currentTarget.style.color = "#fff";
    e.currentTarget.style.textDecoration = "none";
  };
  const onLeave = (e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = "#000";
    e.currentTarget.style.textDecoration = "none";
  };
  return (
    <SpaLink to={to} style={baseStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      Подробнее
    </SpaLink>
  );
}

function HeaderRow() {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 144px",
          columnGap: 18,
          height: HEADER_H,
          fontFamily: UI,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginLeft: TEXT_SHIFT, fontSize: 14, color: "#222", fontWeight: 400 }}>
            Услуга
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginLeft: TEXT_SHIFT, fontSize: 14, color: "#222", fontWeight: 400 }}>
            Направление
          </span>
        </div>
        <div />
      </div>
      <DottedLine />
    </>
  );
}

function DataRow({ title, dir, href }) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 144px",
          columnGap: 18,
          height: ROW_H,
          fontFamily: UI,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <div
            style={{
              marginLeft: TEXT_SHIFT,
              fontSize: 18,
              color: "#111",
              fontWeight: 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={title}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <div
            style={{
              marginLeft: TEXT_SHIFT,
              fontSize: 18,
              color: "#111",
              fontWeight: 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={dir}
          >
            {dir}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <CellButtonLink to={href} />
        </div>
      </div>
      <DottedLine />
    </>
  );
}

// формат даты "Сен 09, 2025"
function formatRuDate(d = new Date()) {
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${mm} ${dd}, ${yy}`;
}

// ----- График с анимацией -----
function ActivityGraph() {
  const wrapRef = React.useRef(null);
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting);
        if (vis) setAnimate(true);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // суммарно 100%
  return (
    <div ref={wrapRef} style={{ marginLeft: GUTTER, marginRight: GUTTER }}>
      {/* Верхние подписи (Название + % под ним) */}
      <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
        {METRICS.map((m, i) => (
          <div key={m.key} style={{ flexBasis: `${m.sharePct}%`, flexGrow: 0, flexShrink: 0, paddingRight: i === METRICS.length - 1 ? 0 : 0 }}>
            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{m.label}</div>
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "#222" }}>{m.sharePct}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Полоса графика (высота ~48px), отступы по 80px уже заданы контейнером */}
      <div
        style={{
          position: "relative",
          height: 48,
          display: "flex",
          gap: 0,
          alignItems: "stretch",
          border: "1px solid #e5e5e5",
          borderRadius: 6,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {METRICS.map((m, idx) => (
          <div
            key={m.key}
            style={{
              position: "relative",
              flexBasis: `${m.sharePct}%`,
              flexGrow: 0,
              flexShrink: 0,
              background: "#f5f5f5", // трек
            }}
          >
            {/* внутренняя заливка — анимированная */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: animate ? `${(m.score10 / 10) * 100}%` : "0%",
                background: "#ededed",
                transition: `width 900ms ${150 + idx * 120}ms ease`,
              }}
              aria-hidden="true"
            />
            {/* сепараторы между сегментами (тонкая вертикальная пунктирная) */}
            {idx > 0 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 0,
                  borderLeft: "1px dashed #e5e5e5",
                  opacity: 0.9,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Подписи оценок под полосой (через 30px) */}
      <div style={{ marginTop: 30, display: "flex" }}>
        {METRICS.map((m, i) => (
          <div key={m.key} style={{ flexBasis: `${m.sharePct}%`, flexGrow: 0, flexShrink: 0 }}>
            <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 600, color: "#111" }}>
              {m.score10.toFixed(1)} <span style={{ fontWeight: 600, opacity: 0.9 }}>/ 10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ElectricalServicesPage() {
  const SCORE = 2.0; // ← число заменено на 2.0
  const today = formatRuDate();

  return (
    <main style={{ fontFamily: UI, color: BLACK, background: "#f8f8f8" }}>
      <style>{`
        .electro-tabs { text-align:center; margin-top:30px; }
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
        .electro-title{ margin:0; text-transform:uppercase; font-weight:600; text-align:center; }
        .electro-sub{ margin:0; text-align:center; font-size:21px; line-height:28px; font-weight:600; color:#222222; }
        .electro-tabs-wrap{ display:inline-flex; flex-wrap:wrap; max-width:1080px; justify-content:center; }
      `}</style>

      {/* Верхняя зона */}
      <div style={{ transform: "translateY(-61px)", willChange: "transform" }}>
        <div className="electro-tabs">
          <div className="electro-tabs-wrap">
            {LINES.map((it) => (
              <SpaLink key={it.key} to={it.href}>{it.title}</SpaLink>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", position: "relative", marginTop: 2 }}>
          <h2 className="electro-title about-hero-title">
            <span style={{ display: "block" }}>ЭЛЕКТРОМОНТАЖ</span>
          </h2>
        </div>

        <div style={{ background: "#f8f8f8", marginTop: 12, marginBottom: 0, padding: 0 }}>
          <p className="electro-sub">
            Энергия проектов рождается<br/>из точности каждого соединения.
          </p>
        </div>
      </div>

      {/* Вступительный текст — 600 / 43px */}
      <div
        style={{
          marginTop: 150,
          marginLeft: GUTTER,
          marginRight: GUTTER,
          textAlign: "left",
          fontFamily: UI,
          fontWeight: 600,
          fontSize: "43px",
          lineHeight: "51px",
          color: "#222",
        }}
      >
        <p style={{ margin: 0 }}>
          Мы делаем электромонтаж прозрачным и удобным:
        </p>
        <p style={{ margin: 0 }}>
          все услуги собраны в одном месте. Выберите нужный раздел и найдите решение под свою задачу.
        </p>
      </div>

      {/* ===== УСЛУГИ — теперь ВВЕРХУ (перед графиком/индексом) ===== */}
      <div style={{ marginTop: 120, marginLeft: GUTTER, marginRight: GUTTER }}>
        <HeaderRow />
        {LINES.map((it) => (
          <DataRow key={it.key} title={it.title} dir={it.dir} href={it.href} />
        ))}
      </div>

      {/* --- Заголовки к графику --- */}
      <div style={{ marginTop: 150, marginLeft: GUTTER, marginRight: GUTTER }}>
        {/* «График» */}
        <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, color: "#222" }}>
          График
        </div>
        {/* «Что мы делаем чаще всего» — через 14px */}
        <div style={{ marginTop: 14, fontSize: 43, lineHeight: "51px", fontWeight: 600, color: "#111" }}>
          Что мы делаем чаще всего
        </div>
      </div>

      {/* === СНАЧАЛА ГРАФИК === */}
      <div style={{ marginTop: 100 }}>
        <ActivityGraph />
      </div>

      {/* === ПОТОМ ТЕКСТ ИНДЕКСА (поменяли местами с графиком) === */}
      <div style={{ marginTop: 150 }}>
        <div style={{ marginLeft: GUTTER, marginRight: GUTTER, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {/* Левая часть */}
          <div>
            <div
              style={{
                fontFamily: UI,
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: 96,
                lineHeight: 1.0,
                color: "#222",
              }}
            >
              CUBE / ИНДЕКС
            </div>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "baseline",
                gap: 16,
                fontFamily: UI,
                color: "#111",
              }}
            >
              <span style={{ fontSize: 96, fontWeight: 600 }}>→</span>
              <span style={{ fontSize: 96, fontWeight: 600 }}>{SCORE.toFixed(1)}</span>
              <span style={{ fontSize: 28, fontWeight: 300 }}>/ 10</span>
            </div>
          </div>

          {/* Правая часть: дата */}
          <div style={{ fontSize: 20, lineHeight: "28px", fontWeight: 300, color: "#3b3b3b", marginRight: 0 }}>
            Обновление: {today}
          </div>
        </div>
      </div>

      <div style={{ height: 160 }} />
    </main>
  );
}
