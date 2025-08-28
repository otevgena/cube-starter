// src/components/blocks/Project.jsx
import React from "react";

/* === UI: точки свайпа (8px) === */
function Dots({ active = 0, total = 2, onSelect }) {
  const BASE = "#2e2e2e";    // чуть светлее фона
  const HOVER = "#3a3a3a";   // сереет при наведении
  const [hover, setHover] = React.useState(-1);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === active;
        const bg = isActive ? "#ffffff" : hover === i ? HOVER : BASE;
        return (
          <span
            key={i}
            role="button"
            aria-label={`Слайд ${i + 1}`}
            onClick={() => onSelect?.(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
            style={{
              width: 8,
              height: 8,
              borderRadius: "9999px",
              background: bg,
              display: "inline-block",
              cursor: "pointer",
              transition: "background-color 160ms ease",
            }}
          />
        );
      })}
    </div>
  );
}

/* === Карточка проекта (левая/правая одинаковые) === */
function ProjectCard({
  logoSrc,
  shotSrcs = [],
  location = "Ноябрьск",
  objectTitle = "Учебный центр",
  customer = "Газпромнефть",
  servicesLabel = "5 Услуг",
  days = 94,
}) {
  const CARD_W = 710, CARD_H = 555, R = 14, PAD = 47, LOGO = 52;
  const IMG_W = 308, IMG_H = 231, IMG_LEFT = PAD + 195, IMG_TOP = PAD;

  // свайп + кроссфейд
  const [idx, _setIdx] = React.useState(0);
  const [prevIdx, setPrevIdx] = React.useState(0);
  const [curOpacity, setCurOpacity] = React.useState(1);
  const clamp = (n) => (shotSrcs.length ? (n + shotSrcs.length) % shotSrcs.length : 0);
  const setIdx = (next) => {
    const nextIdx = clamp(next);
    setPrevIdx(idx);
    _setIdx(nextIdx);
    setCurOpacity(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setCurOpacity(1)));
  };
  const dragRef = React.useRef({ x: 0, dragging: false });
  const onPointerDown = (e) => { dragRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, dragging: true }; };
  const endDrag = (e) => {
    if (!dragRef.current.dragging) return;
    const x2 = e.clientX ?? e.changedTouches?.[0]?.clientX ?? dragRef.current.x;
    const dx = x2 - dragRef.current.x;
    dragRef.current.dragging = false;
    if (Math.abs(dx) > 40) setIdx(idx + (dx < 0 ? 1 : -1));
  };

  const BOTTOM_CUSTOMER = 52; // «customer» от низа
  const GAP_UP = 63;          // блок «location/title» выше на 63

  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        backgroundImage: "linear-gradient(to right, #222222 0%, #222222 100%)",
        borderRadius: R,
        overflow: "hidden",
      }}
    >
      {/* Лого 52×52 — круг с белым фоном */}
      <div
        style={{
          position: "absolute", left: PAD, top: PAD,
          width: LOGO, height: LOGO, borderRadius: "50%", background: "#fff",
          overflow: "hidden", display: "grid", placeItems: "center",
        }}
      >
        <img src={logoSrc} alt="Логотип" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6, display: "block" }} />
      </div>

      {/* Превью + точки (скругление 8px; полоска сдвинута правее на 180px) */}
      <div
        style={{ position: "absolute", left: IMG_LEFT, top: IMG_TOP, width: IMG_W, height: IMG_H, touchAction: "pan-y", cursor: "default" }}
        onMouseDown={onPointerDown} onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={onPointerDown} onTouchEnd={endDrag}
      >
        {shotSrcs.length > 0 && (
          <img
            key={`prev-${prevIdx}`} src={shotSrcs[prevIdx]} alt=""
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", borderRadius: 8, opacity: 1 - curOpacity,
              transition: "opacity 260ms ease", display: "block",
            }}
            aria-hidden="true"
          />
        )}
        {shotSrcs.length > 0 && (
          <img
            key={`cur-${idx}`} src={shotSrcs[idx]} alt="Проект — превью"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", borderRadius: 8, opacity: curOpacity,
              transition: "opacity 260ms ease", display: "block",
            }}
            loading="lazy" decoding="async"
          />
        )}
        <div
          style={{ position: "absolute", left: "calc(50% + 180px)", transform: "translateX(-50%)", top: IMG_H + 36 }}
        >
          <Dots active={idx} total={shotSrcs.length || 2} onSelect={(i) => setIdx(i)} />
        </div>
      </div>

      {/* Низ: customer (15px, light 300) */}
      <div
        style={{
          position: "absolute", left: PAD, right: 20, bottom: BOTTOM_CUSTOMER,
          color: "#fff", fontFamily: "'Inter Tight','Inter',system-ui",
          fontSize: 15, lineHeight: "22px", fontWeight: 300, textAlign: "left",
        }}
      >
        {customer}
      </div>

      {/* Блок выше: location (300) + title (оба слова 600) */}
      <div
        style={{
          position: "absolute", left: PAD, right: 20, bottom: BOTTOM_CUSTOMER + GAP_UP,
          color: "#fff", fontFamily: "'Inter Tight','Inter',system-ui",
          textAlign: "left", display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <div style={{ fontSize: 15, lineHeight: "22px", fontWeight: 300, opacity: 0.95 }}>{location}</div>
        <div style={{ fontSize: 43, lineHeight: "50px", fontWeight: 600 }}>{objectTitle}</div>
      </div>

      {/* Правый низ: кол-во услуг (light 300) */}
      <div
        style={{
          position: "absolute", right: PAD, bottom: PAD, color: "#fff",
          fontFamily: "'Inter Tight','Inter',system-ui", fontSize: 16, lineHeight: "24px", fontWeight: 300,
        }}
      >
        {servicesLabel}
      </div>

      {/* Квадрат «Дней» 60×60 (внутренний контент опущен на 4px) */}
      <div
        style={{
          position: "absolute", right: PAD, bottom: PAD + 41 + 24,
          width: 60, height: 60, borderRadius: R,
          boxShadow: "inset 0 0 0 1px #494949",
          backgroundImage: "linear-gradient(to right, #222222 0%, #222222 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: "'Inter Tight','Inter',system-ui", userSelect: "none",
        }}
        aria-label="Срок, дней"
      >
        <div style={{ transform: "translateY(4px)", textAlign: "center" }}>
          <div style={{ fontSize: 12, lineHeight: "14px", fontWeight: 300, opacity: 0.95 }}>Дней</div>
          <div style={{ fontSize: 24, lineHeight: "26px", fontWeight: 600 }}>{days}</div>
        </div>
      </div>
    </div>
  );
}

/* === Табличный блок под карточками === */

const COLS = [
  { key: "name",   w: 360, label: "Заказчик" }, // подписи поменяны местами
  { key: "client", w: 288, label: "Название" },
  { key: "year",   w: 216, label: "Год" },
  { key: "serv",   w: 432, label: "Услуги" },
  { key: "act",    w: 144, label: "" },
];
const HEADER_H = 72;
const ROW_H = 104;
const TEXT_SHIFT = 28; // смещение текста вправо

/* Чёрная пунктирная линия (шаг 9px) */
function DottedLine({ width }) {
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

function HeaderRow() {
  const totalW = COLS.reduce((s, c) => s + c.w, 0);
  return (
    <div style={{ width: totalW }}>
      <div style={{ display: "flex", height: HEADER_H, fontFamily: "'Inter Tight','Inter',system-ui" }}>
        {COLS.map((c) => (
          <div
            key={c.key}
            style={{
              width: c.w,
              height: HEADER_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontSize: 14,
              color: "#222",
              fontWeight: 400,
            }}
          >
            <span style={{ marginLeft: TEXT_SHIFT }}>{c.label}</span>
          </div>
        ))}
      </div>
      <DottedLine width={totalW} />
    </div>
  );
}

/* Кнопка Подробнее: тончайший контур, текст до hover — чёрный */
function CellButton() {
  const R = 12;
  return (
    <button
      type="button"
      style={{
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
        fontFamily: "'Inter Tight','Inter',system-ui",
        fontSize: 14,
        fontWeight: 400,
        cursor: "pointer",
        transition: "all 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#000";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#000";
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      Подробнее
    </button>
  );
}

/* Ячейка-строка: в первой колонке лого + ссылка как в About + мини-бейдж (ННГ/ФББ) */
function DataRow({ logoSrc, name, client, year, services, badge }) {
  const totalW = COLS.reduce((s, c) => s + c.w, 0);
  return (
    <div style={{ width: totalW }}>
      <div style={{ display: "flex", height: ROW_H, fontFamily: "'Inter Tight','Inter',system-ui" }}>
        {/* КОЛОНКА 1 — Заказчик */}
        <div
          style={{
            width: COLS[0].w,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {/* смещение содержимого на 28px от левого края колонки */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: TEXT_SHIFT }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#fff",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <img
                src={logoSrc}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, display: "block" }}
              />
            </div>

            {/* ссылка как у «Генерального директора» + бейдж 9px, сдвиг влево на 2px и вверх на 1px */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <a href="#more" className="about-hero-role" style={{ fontSize: 18 }}>
                {name}
              </a>
              {badge && (
                <span
                  className="about-hero-badge"
                  aria-hidden="true"
                  style={{
                    fontSize: 9,
                    lineHeight: "12px",
                    position: "relative",
                    left: -2,   // на 2px ближе к тексту
                    top: -1,    // на 1px выше
                    marginLeft: 0,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* КОЛОНКА 2 — Название */}
        <div style={{ width: COLS[1].w, display: "flex", alignItems: "center" }}>
          <div style={{ marginLeft: TEXT_SHIFT, fontSize: 18, color: "#111", fontWeight: 400 }}>
            {client}
          </div>
        </div>

        {/* КОЛОНКА 3 — Год */}
        <div style={{ width: COLS[2].w, display: "flex", alignItems: "center" }}>
          <div style={{ marginLeft: TEXT_SHIFT, fontSize: 18, color: "#111", fontWeight: 400 }}>
            {year}
          </div>
        </div>

        {/* КОЛОНКА 4 — Услуги */}
        <div style={{ width: COLS[3].w, display: "flex", alignItems: "center" }}>
          <div style={{ marginLeft: TEXT_SHIFT, fontSize: 18, color: "#111", fontWeight: 400 }}>
            {services}
          </div>
        </div>

        {/* КОЛОНКА 5 — Кнопка */}
        <div style={{ width: COLS[4].w, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CellButton />
        </div>
      </div>

      <DottedLine width={totalW} />
    </div>
  );
}


/* === Страница Проекты === */

export default function Project() {
  return (
    <section id="projects" className="projects-hero" aria-label="Проекты">
      {/* Фон – как в About */}
      <div className="about-hero-header" style={{ transform: "translateY(-74px)", willChange: "transform" }}>
        <div className="container-wide">
          {/* Шапка */}
          <div className="projects-hero-flow" style={{ marginTop: "200px" }}>
            <div
              className="about-hero-overview"
              style={{ textAlign: "center", fontFamily: "'Inter Tight','Inter',system-ui", fontSize: "14px", lineHeight: "28px", fontWeight: 300, color: "#222222", margin: 0 }}
            >
              Директория
            </div>
            <div className="about-hero-more" style={{ textAlign: "center", fontFamily: "'Inter Tight','Inter',system-ui", position: "relative" }}>
              <h2 className="about-hero-title" style={{ margin: 0, marginTop: "25px", textTransform: "uppercase", fontWeight: 600 }}>
                ПРОЕКТЫ
              </h2>
              <p className="about-hero-more-sub" style={{ marginTop: "15px", fontSize: "20.9859px", lineHeight: "28px", fontWeight: 300, color: "#222222" }}>
                География выполненных работ
              </p>
            </div>
          </div>
        </div>

        {/* Две карточки */}
        <div
          style={{
            marginTop: 82, marginLeft: 52, marginRight: 52,
            display: "grid", gridTemplateColumns: "710px 710px", justifyContent: "space-between", alignItems: "start", rowGap: 24,
          }}
        >
          {/* Левый — Ноябрьск */}
          <ProjectCard
            logoSrc="/projects/rmm/nng_logo.png"
            shotSrcs={["/projects/rmm/2-1200.jpg", "/projects/rmm/3-1200.jpg"]}
            location="Ноябрьск"
            objectTitle="Учебный центр"
            customer="Газпром нефть"
            servicesLabel="5 Услуг"
            days={94}
          />

          {/* Правый — FRANK */}
          <ProjectCard
            logoSrc="/projects/Frank/frank_logo.png"
            shotSrcs={["/projects/Frank/1-1200.jpg", "/projects/Frank/2-1200.jpg"]}
            location="Тюмень"
            objectTitle="FRANK by БАСТА"
            customer="frankmeat"
            servicesLabel="3 услуги"
            days={76}
          />
        </div>

        {/* Таблица под карточками */}
        <div style={{ marginTop: 20, marginLeft: 52, marginRight: 52 }}>
          <HeaderRow />

          {/* Строка 1 — Газпромнефть */}
          <DataRow
            logoSrc="/projects/rmm/nng_logo.png"
            name="Газпромнефть"
            client="Учебный центр"
            year="2025"
            services="СКС, ОПС, ЭО"
            badge="ННГ"
          />

          {/* Строка 2 — FRANK by БАСТА */}
          <DataRow
            logoSrc="/projects/Frank/frank_logo.png"
            name="frankmeat"
            client="FRANK by БАСТА"
            year="2025"
            services="СКС, ОПС, ЭО"
            badge="ФББ"
          />
        </div>

        {/* ↓↓↓ Центровой блок как в About, через 108px */}
        <div
          style={{
            marginTop: "108px",
            marginLeft: "80px",
            marginRight: "80px",
            textAlign: "center",
            fontFamily: "'Inter Tight','Inter',system-ui",
            fontSize: "16px",
            lineHeight: "24px",
            fontWeight: 300,
            color: "#222",
          }}
        >
          <span>Познакомьтесь с </span>
          <span style={{ fontWeight: 600 }}>26</span>
          <span> проектами и реализованными объектами </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", verticalAlign: "middle" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
              <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <a
              href="/pages/projects"
              className="about-hero-role"
              style={{ fontSize: "16px", lineHeight: "24px", fontWeight: 600, textDecoration: "underline" }}
              onClick={(e) => {
                // Если нужен именно программный переход — раскомментируй:
                // e.preventDefault();
                // window.location.assign("/pages/projects");
              }}
            >
              Смотреть работы
            </a>
          </span>
        </div>

        <div style={{ height: 120 }} />
      </div>
    </section>
  );
}
