// src/components/blocks/Projects.jsx
// Блок «Проекты» (clean-rebuild): шапка + 2 карточки проектов (мини-карусель) +
// таблица + центровой блок. Чистый Tailwind + точечные inline-стили для
// попиксельной раскладки карточек.
import React from "react";
import FitScale from "@/components/common/FitScale.jsx";
import { getFeaturedProjects } from "@/data/projects.js";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

// Данные проектов — из общего стора (управляются в админке «Добавить проект»).
// На главной показываем два самых свежих; hook перерисовывает при изменениях.
function useFeaturedProjects() {
  const [list, setList] = React.useState(() => getFeaturedProjects());
  React.useEffect(() => {
    const on = () => setList(getFeaturedProjects());
    window.addEventListener("projects:changed", on);
    return () => window.removeEventListener("projects:changed", on);
  }, []);
  return list;
}

const COLS = [
  { key: "name", w: 360, label: "Заказчик" },
  { key: "client", w: 288, label: "Название" },
  { key: "year", w: 216, label: "Год" },
  { key: "serv", w: 432, label: "Услуги" },
  { key: "act", w: 144, label: "" },
];
const TABLE_W = COLS.reduce((s, c) => s + c.w, 0);
const SHIFT = 28; // сдвиг текста вправо в ячейках

// Планшет: та же ПК-таблица, но с компактными (читаемыми) ширинами колонок
const TABLET_COLS = [
  { key: "name", w: 200, label: "Заказчик" },
  { key: "client", w: 168, label: "Название" },
  { key: "year", w: 74, label: "Год" },
  { key: "serv", w: 176, label: "Услуги" },
  { key: "act", w: 108, label: "" },
];
const TABLET_TABLE_W = TABLET_COLS.reduce((s, c) => s + c.w, 0);
const SHIFT_T = 12;

function useIsTablet() {
  const [v, setV] = React.useState(false);
  React.useEffect(() => {
    let mq;
    try { mq = window.matchMedia("(min-width:768px) and (max-width:1279px)"); } catch { return; }
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on); };
  }, []);
  return v;
}

function Arrow() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="block shrink-0">
      <path d="M4 12h14" stroke="#222" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
export function ProjectCard({ logo, shots = [], location, objectTitle, customer, servicesLabel, days }) {
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
    <div className="relative h-[555px] w-[710px] overflow-hidden rounded-[10px] bg-ink text-white">
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
      <div className="absolute bottom-[112px] right-[47px] flex h-[60px] w-[60px] items-center justify-center rounded-[10px] bg-ink ring-1 ring-inset ring-[#494949]">
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

/* Мобильная карточка проекта — вертикальная раскладка (крупная картинка во всю ширину, как у awwwards) */
export function MobileProjectCard({ logo, shots = [], location, objectTitle, customer, servicesLabel, days }) {
  const [idx, setIdx] = React.useState(0);
  const [prevIdx, setPrevIdx] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
  const dragRef = React.useRef({ x: 0, dragging: false });
  const total = shots.length || 1;

  const go = (next) => {
    const n = ((next % total) + total) % total;
    setPrevIdx(idx);
    setIdx(n);
    setOpacity(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpacity(1)));
  };
  const onDown = (e) => { dragRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, dragging: true }; };
  const onUp = (e) => {
    if (!dragRef.current.dragging) return;
    const x2 = e.clientX ?? e.changedTouches?.[0]?.clientX ?? dragRef.current.x;
    const dx = x2 - dragRef.current.x;
    dragRef.current.dragging = false;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="rounded-[10px] bg-ink p-5 text-white">
      {/* Лого */}
      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white">
        <img src={logo} alt="Логотип" className="block h-full w-full object-contain p-1.5" />
      </div>

      {/* Картинка (не на всю ширину блока) + точки под правым краем */}
      <div className="mt-5 w-[88%]">
        <div
          className="relative aspect-[16/10] w-full touch-pan-y overflow-hidden rounded-lg"
          onMouseDown={onDown}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchEnd={onUp}
        >
          {shots.length > 0 && (
            <img
              key={`m-prev-${prevIdx}`}
              src={shots[prevIdx]}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-300"
              style={{ opacity: 1 - opacity }}
            />
          )}
          {shots.length > 0 && (
            <img
              key={`m-cur-${idx}`}
              src={shots[idx]}
              alt="Проект — превью"
              className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-300"
              style={{ opacity }}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
        {total > 1 && (
          <div className="mt-3 flex justify-end">
            <Dots active={idx} total={total} onSelect={go} />
          </div>
        )}
      </div>

      {/* Локация + заголовок + бокс «Дней» */}
      <div className="mt-6 text-[15px] font-light leading-[22px] opacity-95">{location}</div>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h3 className="text-[32px] font-semibold leading-[38px]">{objectTitle}</h3>
        <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[10px] bg-ink ring-1 ring-inset ring-[#494949]">
          <div className="translate-y-0.5 text-center">
            <div className="text-[11px] font-light leading-[13px] opacity-95">Дней</div>
            <div className="text-[22px] font-semibold leading-[24px]">{days}</div>
          </div>
        </div>
      </div>

      {/* Заказчик + услуги */}
      <div className="mt-8 flex items-center justify-between text-[15px] font-light leading-[22px]">
        <span>{customer}</span>
        <span>{servicesLabel}</span>
      </div>
    </div>
  );
}

/* Планшетная карточка проекта — landscape (как у awwwards): лого + картинка справа сверху,
   крупный заголовок слева, «Дней» справа, заказчик/услуги снизу. Во всю ширину колонки. */
export function TabletProjectCard({ logo, shots = [], location, objectTitle, customer, servicesLabel, days }) {
  const [idx, setIdx] = React.useState(0);
  const [prevIdx, setPrevIdx] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
  const dragRef = React.useRef({ x: 0, dragging: false });
  const total = shots.length || 1;

  const go = (next) => {
    const n = ((next % total) + total) % total;
    setPrevIdx(idx);
    setIdx(n);
    setOpacity(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpacity(1)));
  };
  const onDown = (e) => { dragRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, dragging: true }; };
  const onUp = (e) => {
    if (!dragRef.current.dragging) return;
    const x2 = e.clientX ?? e.changedTouches?.[0]?.clientX ?? dragRef.current.x;
    const dx = x2 - dragRef.current.x;
    dragRef.current.dragging = false;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="rounded-[10px] bg-ink p-8 text-white">
      {/* верх: лого слева + картинка справа */}
      <div className="flex items-start justify-between gap-8">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
          <img src={logo} alt="Логотип" className="block h-full w-full object-contain p-1.5" />
        </div>
        <div className="w-[44%] shrink-0 mr-[16%]">
          <div
            className="relative aspect-[16/10] w-full touch-pan-y overflow-hidden rounded-lg"
            onMouseDown={onDown}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchEnd={onUp}
          >
            {shots.length > 0 && (
              <img
                key={`t-prev-${prevIdx}`}
                src={shots[prevIdx]}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-300"
                style={{ opacity: 1 - opacity }}
              />
            )}
            {shots.length > 0 && (
              <img
                key={`t-cur-${idx}`}
                src={shots[idx]}
                alt="Проект — превью"
                className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-300"
                style={{ opacity }}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </div>
      </div>
      {/* точки переключения — у правого края, под картинкой (как было) */}
      {total > 1 && (
        <div className="mt-3 flex justify-end">
          <Dots active={idx} total={total} onSelect={go} />
        </div>
      )}

      {/* локация + заголовок + «Дней» */}
      <div className="mt-5 flex items-end justify-between gap-6">
        <div>
          <div className="text-[14px] font-light leading-5 opacity-95">{location}</div>
          <h3 className="mt-2 text-[34px] font-semibold leading-[40px]">{objectTitle}</h3>
        </div>
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[10px] bg-ink ring-1 ring-inset ring-[#494949]">
          <div className="translate-y-0.5 text-center">
            <div className="text-[11px] font-light leading-[13px] opacity-95">Дней</div>
            <div className="text-[22px] font-semibold leading-[24px]">{days}</div>
          </div>
        </div>
      </div>

      {/* заказчик + услуги */}
      <div className="mt-8 flex items-center justify-between text-[14px] font-light leading-5">
        <span>{customer}</span>
        <span>{servicesLabel}</span>
      </div>
    </div>
  );
}

/* Адаптивная карточка одного проекта (мобилка / планшет / десктоп-FitScale).
   Единый источник для главной и страницы «Смотреть работы». */
export function ProjectCardResponsive({ project }) {
  return (
    <div className="mx-auto w-full max-w-[710px] md:max-w-none lg:max-w-[710px]">
      <div className="md:hidden"><MobileProjectCard {...project} /></div>
      <div className="hidden md:block lg:hidden"><TabletProjectCard {...project} /></div>
      <div className="hidden lg:block">
        <FitScale baseW={710} baseH={555}><ProjectCard {...project} /></FitScale>
      </div>
    </div>
  );
}

/* Кнопка «Подробнее» */
function MoreButton() {
  return (
    <button
      type="button"
      className="inline-flex h-[42px] items-center justify-center rounded-xl border border-[#111] px-[18px] text-sm font-normal text-[#111] transition-colors hover:bg-[#111] hover:text-white"
    >
      Подробнее
    </button>
  );
}

export default function Projects() {
  const isTablet = useIsTablet();
  const PROJECTS = useFeaturedProjects();
  const cols = isTablet ? TABLET_COLS : COLS;
  const tableW = isTablet ? TABLET_TABLE_W : TABLE_W;
  const shift = isTablet ? SHIFT_T : SHIFT;
  return (
    <section className="bg-page pt-14 font-tight text-ink lg:pt-[96px] xl:pt-[126px]" aria-label="Проекты">
      {/* Шапка */}
      <div className="text-center text-sm font-light leading-7">Директория</div>
      <div className="mt-[26px] text-center">
        <h2 className="font-semibold uppercase leading-none h-hero">ПРОЕКТЫ</h2>
        <p className="mt-3.5 text-[18px] font-light leading-7 sm:mt-4 sm:text-[21px] md:text-[19px] lg:text-[21px]">География выполненных работ</p>
      </div>

      {/* Две карточки: на узких экранах — в столбик, карточка масштабируется под ширину (дизайн 1:1) */}
      <div className="mt-16 grid grid-cols-1 gap-6 px-4 lg:mx-[52px] lg:mt-20 lg:grid-cols-2 lg:px-0">
        {PROJECTS.map((p) => (
          <div key={p.id || p.name} className="mx-auto w-full max-w-[710px] md:max-w-none lg:max-w-[710px]">
            {/* Мобилка — вертикальная карточка с крупной картинкой */}
            <div className="md:hidden">
              <MobileProjectCard {...p} />
            </div>
            {/* Планшет — landscape-карточка во всю ширину (как awwwards) */}
            <div className="hidden md:block lg:hidden">
              <TabletProjectCard {...p} />
            </div>
            {/* Десктоп — фиксированный дизайн 710×555, масштабируется под колонку */}
            <div className="hidden lg:block">
              <FitScale baseW={710} baseH={555}>
                <ProjectCard {...p} />
              </FitScale>
            </div>
          </div>
        ))}
      </div>

      {/* Список заказчиков (mobile) — строки с точками, как в таблице / awwwards */}
      <div className="mx-4 mt-10 md:hidden">
        <div className="pb-3 text-sm font-normal text-ink">Заказчик</div>
        <DottedLine />
        {PROJECTS.map((p) => (
          <div key={p.id || p.name}>
            <div className="flex h-[84px] items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
                  <img src={p.logo} alt="" className="block h-full w-full object-contain p-1" />
                </div>
                <a href="#more" onClick={(e) => e.preventDefault()} className="group relative truncate pb-1 text-[18px] text-ink">
                  {p.name}
                  <Underline />
                </a>
                {p.badge && <sup className="shrink-0 text-[9px] leading-3 text-neutral-500">{p.badge}</sup>}
              </div>
              <div className="shrink-0">
                <MoreButton />
              </div>
            </div>
            <DottedLine />
          </div>
        ))}
      </div>

      {/* Таблица (планшет + десктоп) — на планшете компактнее */}
      <div className="mx-4 mt-5 hidden overflow-x-auto md:block lg:mx-[52px]">
        <div style={{ width: isTablet ? "100%" : tableW }}>
          {/* шапка таблицы */}
          <div className="flex h-[64px] lg:h-[72px]">
            {cols.map((c, i) => (
              <div key={c.key} className="flex items-center text-sm font-normal text-ink" style={isTablet && i === cols.length - 1 ? { flex: 1 } : { width: c.w }}>
                <span style={{ marginLeft: shift }}>{c.label}</span>
              </div>
            ))}
          </div>
          <DottedLine />

          {/* строки */}
          {PROJECTS.map((p) => (
            <div key={p.id || p.name}>
              <div className="flex h-[88px] lg:h-[104px]">
                {/* Заказчик */}
                <div className="flex items-center" style={{ width: cols[0].w }}>
                  <div className="flex items-center gap-1.5" style={{ marginLeft: shift }}>
                    <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white">
                      <img src={p.logo} alt="" className="block h-full w-full object-contain p-1" />
                    </div>
                    <a href="#more" onClick={(e) => e.preventDefault()} className="group relative pb-1 text-[16px] lg:text-[18px]">
                      {p.name}
                      <Underline />
                    </a>
                    {p.badge && <sup className="text-[9px] leading-3 text-neutral-500">{p.badge}</sup>}
                  </div>
                </div>
                {/* Название */}
                <div className="flex items-center" style={{ width: cols[1].w }}>
                  <div className="text-[16px] text-dark lg:text-[18px]" style={{ marginLeft: shift }}>{p.client}</div>
                </div>
                {/* Год */}
                <div className="flex items-center" style={{ width: cols[2].w }}>
                  <div className="text-[16px] text-dark lg:text-[18px]" style={{ marginLeft: shift }}>{p.year}</div>
                </div>
                {/* Услуги */}
                <div className="flex items-center" style={{ width: cols[3].w }}>
                  <div className="text-[16px] text-dark lg:text-[18px]" style={{ marginLeft: shift }}>{p.services}</div>
                </div>
                {/* Кнопка */}
                <div className="flex items-center justify-center" style={isTablet ? { flex: 1, justifyContent: "flex-end" } : { width: cols[4].w }}>
                  <MoreButton />
                </div>
              </div>
              <DottedLine />
            </div>
          ))}
        </div>
      </div>

      {/* Центровой блок */}
      <div className="mt-8 px-4 pb-0 text-center text-base font-light lg:px-20 lg:pb-0 xl:mt-[108px] xl:pb-[120px]">
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
