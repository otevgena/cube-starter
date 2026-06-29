// src/components/blocks/Projects.jsx
// Блок «Проекты» (clean-rebuild): шапка + 2 карточки проектов (мини-карусель) +
// таблица + центровой блок. Чистый Tailwind + точечные inline-стили для
// попиксельной раскладки карточек.
import React from "react";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

const PROJECTS = [
  {
    logo: "/projects/rmm/nng_logo.png",
    shots: ["/projects/rmm/2-1200.jpg", "/projects/rmm/3-1200.jpg"],
    location: "Ноябрьск",
    objectTitle: "Учебный центр",
    customer: "Газпром нефть",
    servicesLabel: "5 Услуг",
    days: 94,
    // таблица
    name: "Газпромнефть",
    client: "Учебный центр",
    year: "2025",
    services: "СКС, ОПС, ЭО",
    badge: "ННГ",
  },
  {
    logo: "/projects/Frank/frank_logo.png",
    shots: ["/projects/Frank/1-1200.jpg", "/projects/Frank/2-1200.jpg"],
    location: "Тюмень",
    objectTitle: "FRANK by БАСТА",
    customer: "frankmeat",
    servicesLabel: "3 услуги",
    days: 76,
    name: "frankmeat",
    client: "FRANK by БАСТА",
    year: "2025",
    services: "СКС, ОПС, ЭО",
    badge: "ФББ",
  },
];

const COLS = [
  { key: "name", w: 360, label: "Заказчик" },
  { key: "client", w: 288, label: "Название" },
  { key: "year", w: 216, label: "Год" },
  { key: "serv", w: 432, label: "Услуги" },
  { key: "act", w: 144, label: "" },
];
const TABLE_W = COLS.reduce((s, c) => s + c.w, 0);
const SHIFT = 28; // сдвиг текста вправо в ячейках

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="block shrink-0">
      <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* подчёркивание как у «Генеральный директор» (работает внутри .group) */
function Underline() {
  return (
    <>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-300" />
      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-ink transition-[width] duration-300 group-hover:w-full" />
    </>
  );
}

function DottedLine() {
  return (
    <div
      className="h-px w-full"
      style={{ backgroundImage: "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)" }}
    />
  );
}

/* Точки-переключатели слайдов */
function Dots({ active, total, onSelect }) {
  return (
    <div className="flex gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Слайд ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-white" : "bg-[#2e2e2e] hover:bg-[#3a3a3a]"}`}
        />
      ))}
    </div>
  );
}

/* Карточка проекта */
function ProjectCard({ logo, shots = [], location, objectTitle, customer, servicesLabel, days }) {
  const [idx, setIdxState] = React.useState(0);
  const [prevIdx, setPrevIdx] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
  const dragRef = React.useRef({ x: 0, dragging: false });

  const total = shots.length || 1;
  const go = (next) => {
    const n = ((next % total) + total) % total;
    setPrevIdx(idx);
    setIdxState(n);
    setOpacity(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpacity(1)));
  };

  const onDown = (e) => {
    dragRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, dragging: true };
  };
  const onUp = (e) => {
    if (!dragRef.current.dragging) return;
    const x2 = e.clientX ?? e.changedTouches?.[0]?.clientX ?? dragRef.current.x;
    const dx = x2 - dragRef.current.x;
    dragRef.current.dragging = false;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="relative h-[555px] w-[710px] overflow-hidden rounded-[14px] bg-ink text-white">
      {/* Лого */}
      <div className="absolute left-[47px] top-[47px] grid h-[52px] w-[52px] place-items-center overflow-hidden rounded-full bg-white">
        <img src={logo} alt="Логотип" className="block h-full w-full object-contain p-1.5" />
      </div>

      {/* Превью с каруселью */}
      <div
        className="absolute left-[242px] top-[47px] h-[231px] w-[308px] touch-pan-y"
        onMouseDown={onDown}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchEnd={onUp}
      >
        {shots.length > 0 && (
          <img
            key={`prev-${prevIdx}`}
            src={shots[prevIdx]}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 block h-full w-full rounded-lg object-cover transition-opacity duration-300"
            style={{ opacity: 1 - opacity }}
          />
        )}
        {shots.length > 0 && (
          <img
            key={`cur-${idx}`}
            src={shots[idx]}
            alt="Проект — превью"
            className="absolute inset-0 block h-full w-full rounded-lg object-cover transition-opacity duration-300"
            style={{ opacity }}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="absolute top-[267px] left-1/2 -translate-x-1/2" style={{ left: "calc(50% + 180px)" }}>
          <Dots active={idx} total={total} onSelect={go} />
        </div>
      </div>

      {/* location + title */}
      <div className="absolute bottom-[115px] left-[47px] right-5 flex flex-col gap-3 text-left">
        <div className="text-[15px] font-light leading-[22px] opacity-95">{location}</div>
        <div className="text-[43px] font-semibold leading-[50px]">{objectTitle}</div>
      </div>

      {/* customer */}
      <div className="absolute bottom-[52px] left-[47px] right-5 text-left text-[15px] font-light leading-[22px]">
        {customer}
      </div>

      {/* Дней-бокс */}
      <div className="absolute bottom-[112px] right-[47px] flex h-[60px] w-[60px] items-center justify-center rounded-[14px] bg-ink ring-1 ring-inset ring-[#494949]">
        <div className="translate-y-1 text-center">
          <div className="text-[12px] font-light leading-[14px] opacity-95">Дней</div>
          <div className="text-[24px] font-semibold leading-[26px]">{days}</div>
        </div>
      </div>

      {/* кол-во услуг */}
      <div className="absolute bottom-[47px] right-[47px] text-base font-light leading-6">{servicesLabel}</div>
    </div>
  );
}

/* Кнопка «Подробнее» */
function MoreButton() {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center rounded-xl px-3.5 text-sm text-black ring-[0.5px] ring-inset ring-[#494949] transition-colors hover:bg-black hover:text-white hover:underline"
    >
      Подробнее
    </button>
  );
}

export default function Projects() {
  return (
    <section className="bg-page pt-[126px] font-tight text-ink" aria-label="Проекты">
      {/* Шапка */}
      <div className="text-center text-sm font-light leading-7">Директория</div>
      <div className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none" style={TITLE}>ПРОЕКТЫ</h2>
        <p className="mt-4 text-[21px] font-light leading-7">География выполненных работ</p>
      </div>

      {/* Две карточки */}
      <div className="mx-[52px] mt-20 flex justify-between gap-6">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.name} {...p} />
        ))}
      </div>

      {/* Таблица */}
      <div className="mx-[52px] mt-5 overflow-x-auto">
        <div style={{ width: TABLE_W }}>
          {/* шапка таблицы */}
          <div className="flex h-[72px]">
            {COLS.map((c) => (
              <div key={c.key} className="flex items-center text-sm font-normal text-ink" style={{ width: c.w }}>
                <span style={{ marginLeft: SHIFT }}>{c.label}</span>
              </div>
            ))}
          </div>
          <DottedLine />

          {/* строки */}
          {PROJECTS.map((p) => (
            <div key={p.name}>
              <div className="flex h-[104px]">
                {/* Заказчик */}
                <div className="flex items-center" style={{ width: COLS[0].w }}>
                  <div className="flex items-center gap-1.5" style={{ marginLeft: SHIFT }}>
                    <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white">
                      <img src={p.logo} alt="" className="block h-full w-full object-contain p-1" />
                    </div>
                    <a href="#more" onClick={(e) => e.preventDefault()} className="group relative pb-1 text-[18px]">
                      {p.name}
                      <Underline />
                    </a>
                    {p.badge && <sup className="text-[9px] leading-3 text-neutral-500">{p.badge}</sup>}
                  </div>
                </div>
                {/* Название */}
                <div className="flex items-center" style={{ width: COLS[1].w }}>
                  <div className="text-[18px] text-dark" style={{ marginLeft: SHIFT }}>{p.client}</div>
                </div>
                {/* Год */}
                <div className="flex items-center" style={{ width: COLS[2].w }}>
                  <div className="text-[18px] text-dark" style={{ marginLeft: SHIFT }}>{p.year}</div>
                </div>
                {/* Услуги */}
                <div className="flex items-center" style={{ width: COLS[3].w }}>
                  <div className="text-[18px] text-dark" style={{ marginLeft: SHIFT }}>{p.services}</div>
                </div>
                {/* Кнопка */}
                <div className="flex items-center justify-center" style={{ width: COLS[4].w }}>
                  <MoreButton />
                </div>
              </div>
              <DottedLine />
            </div>
          ))}
        </div>
      </div>

      {/* Центровой блок */}
      <div className="mt-[108px] px-20 pb-[120px] text-center text-base font-light">
        Познакомьтесь с <span className="font-semibold">26</span> проектами и реализованными объектами{" "}
        <span className="inline-flex items-center gap-1.5 align-middle">
          <Arrow />
          <a href="/pages/projects" className="group relative pb-1 font-semibold">
            Смотреть работы
            <Underline />
          </a>
        </span>
      </div>
    </section>
  );
}
