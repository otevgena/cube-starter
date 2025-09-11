// src/pages/services/lowcurrent/index.jsx
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

const UI = "'Inter Tight','Inter',system-ui";
const GUTTER = 80;
const BLACK = "#000";
const MUTED = "#A7A7A7";

// src/pages/services/lowcurrent/index.jsx
const LINES = [
  { key: "sks",        title: "Структурированные кабельные системы",                     dir: "СКС",          href: "/services/lowcurrent#sks" },
  { key: "cctv",       title: "Системы видеонаблюдения",                                 dir: "CCTV",         href: "/services/lowcurrent#cctv" },
  { key: "ops",        title: "Системы охранно-пожарной сигнализации",                   dir: "ОПС",          href: "/services/lowcurrent#ops" },
  { key: "skud",       title: "Системы контроля и управления доступом",                  dir: "СКУД",         href: "/services/lowcurrent#skud" },
  { key: "intercom",   title: "Домофонные системы и интерком",                           dir: "Домофония",    href: "/services/lowcurrent#intercom" },
  { key: "server",     title: "Организация серверных и кроссовых узлов",                 dir: "Серверные",    href: "/services/lowcurrent#server" },
  { key: "lan",        title: "Локально-вычислительные сети и сетевое оборудование",     dir: "ЛВС/Сеть",     href: "/services/lowcurrent#lan" },
  { key: "pa",         title: "Системы оповещения и звукового вещания",                  dir: "Оповещение",   href: "/services/lowcurrent#pa" },
];


/* ===== ГРАФИК (доли + оценки) ===== */
// src/pages/services/lowcurrent/index.jsx
const METRICS = [
  { key: "montage",  label: "Монтаж",            sharePct: 45, score10: 4.5 },
  { key: "design",   label: "Проектирование",    sharePct: 25, score10: 2.5 },
  { key: "qa",       label: "Контроль качества", sharePct: 10, score10: 1.0 },
  { key: "service",  label: "Сервис",            sharePct: 20, score10: 2.0 },
];


const HEADER_H = 72;
const ROW_H = 104;
const TEXT_SHIFT = 28;

/* --- горизонтальная пунктирная (как в Project.jsx) --- */
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

/* --- «Подробнее»: чёрный hover, без подчёркивания --- */
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

/* --- формат даты "Сен 09, 2025" --- */
function formatRuDate(d = new Date()) {
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${mm} ${dd}, ${yy}`;
}

/* ====== ГРАФИК (как в электромонтаже) ====== */
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

  return (
    <div ref={wrapRef} style={{ marginLeft: GUTTER, marginRight: GUTTER, position: "relative" }}>
      {/* сама полоса без скруглений */}
      <div
        style={{
          position: "relative",
          height: 48,
          display: "flex",
          alignItems: "stretch",
          border: "1px solid #e5e5e5",
          borderRadius: 0,
          overflow: "visible",
          background: "#fff",
        }}
      >
        {/* левая пунктирная, поднята на 58px */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: -58,
            height: 58,
            width: 0,
            borderLeft: "1px dashed rgba(0,0,0,.12)",
          }}
        />

        {METRICS.map((m, idx) => (
          <div
            key={m.key}
            style={{
              position: "relative",
              flexBasis: `${m.sharePct}%`,
              flexGrow: 0,
              flexShrink: 0,
              background: "#f5f5f5",
            }}
          >
            {/* подпись сверху (название + %) */}
            <div
              style={{
                position: "absolute",
                left: 11,
                top: -58,
                textAlign: "left",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>
                {m.label}
              </div>
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "#222" }}>
                {m.sharePct}%
              </div>
            </div>

            {/* разделители сверху (пунктир) */}
            {idx > 0 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: -58,
                  height: 58,
                  width: 0,
                  borderLeft: "1px dashed rgba(0,0,0,.12)",
                }}
              />
            )}

            {/* внутренняя заливка — анимация от 0 к (оценка/10) */}
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
          </div>
        ))}
      </div>

      {/* оценки под графиком — 14px */}
      <div style={{ marginTop: 30, display: "flex" }}>
        {METRICS.map((m) => (
          <div key={m.key} style={{ flexBasis: `${m.sharePct}%`, flexGrow: 0, flexShrink: 0 }}>
            <div style={{ fontSize: 14, lineHeight: "22px", fontWeight: 600, color: "#111" }}>
              {m.score10.toFixed(1)} <span style={{ fontWeight: 600, opacity: 0.9 }}>/ 10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** CUBE / ИНДЕКС — число под «К», «/ 10» приподнято */
function CubeIndex({ score = 2.6, dateText }) {
  const title = "CUBE / ИНДЕКС";
  const kPos = title.lastIndexOf("К");
  const before = kPos >= 0 ? title.slice(0, kPos) : title;
  const after = kPos >= 0 ? title.slice(kPos) : "";

  const wrapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const [offset, setOffset] = React.useState(0);

  React.useLayoutEffect(() => {
    const calc = () => {
      const wrap = wrapRef.current;
      const mark = markerRef.current;
      if (!wrap || !mark) return;
      const w = wrap.getBoundingClientRect();
      const m = mark.getBoundingClientRect();
      setOffset(Math.max(0, m.left - w.left));
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, []);

  return (
    <div style={{ marginLeft: GUTTER, marginRight: GUTTER, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div
          ref={wrapRef}
          style={{
            fontFamily: UI,
            fontWeight: 600,
            textTransform: "uppercase",
            fontSize: 96,
            lineHeight: 1.0,
            color: "#222",
            position: "relative",
            whiteSpace: "nowrap",
          }}
        >
          <span>{before}</span>
          <span ref={markerRef} style={{ display: "inline-block", width: 0 }} />
          <span>{after}</span>
        </div>

        <div style={{ position: "relative", marginTop: 24 }}>
          {/* стрелка слева от числа (можно заменить на strelka2.png при желании) */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: offset,
              transform: "translateX(calc(-100% - 16px))",
              top: 0,
            }}
          >
            <span style={{ fontSize: 96, fontWeight: 600, lineHeight: 1 }}>→</span>
          </div>

          <div
            style={{
              marginLeft: offset,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              color: "#111",
              fontFamily: UI,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 96, fontWeight: 600, lineHeight: 1 }}>
              {Number(score).toFixed(1)}
            </span>
            <span style={{ fontSize: 28, fontWeight: 300, lineHeight: 1, transform: "translateY(-6px)" }}>
              / 10
            </span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 20, lineHeight: "28px", fontWeight: 300, color: "#3b3b3b" }}>
        Обновление: {dateText}
      </div>
    </div>
  );
}

export default function LowCurrentServicesPage() {
  const SCORE = 2.6;
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

      {/* Верхняя зона (та же компоновка) */}
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
            <span style={{ display: "block" }}>СЛАБОТОЧНЫЕ</span>
            <span style={{ display: "block" }}>СИСТЕМЫ</span>
          </h2>
        </div>

        <div style={{ background: "#f8f8f8", marginTop: 12, marginBottom: 0, padding: 0 }}>
          <p className="electro-sub">
            Безопасность, как и доверие,<br/>
            рождается не в момент тревоги,<br/>
            а в тишине, где всё под контролем.
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
          fontWeight: 600,
          fontSize: "43px",
          lineHeight: "51px",
          color: "#222",
        }}
      >
        <p style={{ margin: 0 }}>Мы делаем слаботочные системы понятными и масштабируемыми:</p>
        <p style={{ margin: 0 }}>
          все направления собраны в одном месте. Выберите нужный раздел и найдите решение под свою задачу.
        </p>
      </div>

      {/* ===== УСЛУГИ (таблица) ===== */}
      <div style={{ marginTop: 120, marginLeft: GUTTER, marginRight: GUTTER }}>
        <HeaderRow />
        {LINES.map((it) => (
          <DataRow key={it.key} title={it.title} dir={it.dir} href={it.href} />
        ))}
      </div>

      {/* Заголовки к графику */}
      <div style={{ marginTop: 150, marginLeft: GUTTER, marginRight: GUTTER }}>
        <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, color: "#222" }}>График</div>
        <div style={{ marginTop: 14, fontSize: 43, lineHeight: "51px", fontWeight: 600, color: "#111" }}>
          Что мы делаем чаще всего
        </div>
      </div>

      {/* CUBE / ИНДЕКС */}
      <div style={{ marginTop: 150 }}>
        <CubeIndex score={SCORE} dateText={today} />
      </div>

      {/* График */}
      <div style={{ marginTop: 200 }}>
        <ActivityGraph />
      </div>

      <div style={{ height: 160 }} />
    </main>
  );
}
