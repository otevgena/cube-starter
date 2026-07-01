// src/components/blocks/Services.jsx
// Секция «Услуги» (clean-rebuild): заголовок УСЛУГИ + «Делегируйте всё…» +
// карточки услуг. Иконки-фичи — анимированные SVG (стоп-кадр, проигрывание на ховере).
import React from "react";

const SERVICES = [
  {
    key: "electrical",
    title: "Электромонтаж",
    img: "/services/electrical.png",
    href: "/services/electrical",
    features: [
      { icon: "/services/icon/thumbs_up.svg", top: "Долговечный", bottom: "результат", offset: 0.3 },
      { icon: "/services/icon/calendar.svg", top: "Планирование", bottom: "этапов", offset: 1.8 },
      { icon: "/services/icon/graduation_hat.svg", top: "Опытная", bottom: "команда", offset: 0.3 },
    ],
  },
  {
    key: "low_current",
    title: "Слаботочные системы",
    img: "/services/low_current_systems.png",
    href: "/services/lowcurrent",
    features: [
      { icon: "/services/icon/phone.svg", top: "Надёжная", bottom: "связь", offset: 0.1 },
      { icon: "/services/icon/lock.svg", top: "Безопасность", bottom: "объекта", offset: 0.1 },
      { icon: "/services/icon/list.svg", top: "Интеграция", bottom: "систем", offset: 0.1 },
    ],
  },
  {
    key: "ventilation",
    title: "Климат-системы",
    img: "/services/ventilation.png",
    href: "/services/ventilation",
    features: [
      { icon: "/services/icon/drop.svg", top: "Эффективное", bottom: "охлаждение", offset: 0.1 },
      { icon: "/services/icon/clock.svg", top: "Свежий", bottom: "воздух", offset: 1.8 },
      { icon: "/services/icon/bolt.svg", top: "Экономия", bottom: "ресурсов", offset: 1.6 },
    ],
  },
  {
    key: "design",
    title: "Проектирование",
    img: "/services/design.png",
    href: "/services/design",
    features: [
      { icon: "/services/icon/expand.svg", top: "Точные", bottom: "расчёты", offset: 1.7 },
      { icon: "/services/icon/doc.svg", top: "Соответствие", bottom: "нормам", offset: 0.0 },
      { icon: "/services/icon/bulb.svg", top: "Оптимальные", bottom: "решения", offset: 0.1 },
    ],
  },
  {
    key: "construction",
    title: "Общестрой",
    img: "/services/construction.png",
    href: "/services/construction",
    features: [
      { icon: "/services/icon/home.svg", top: "Надёжное", bottom: "строительство", offset: 1.7 },
      { icon: "/services/icon/clock2.svg", top: "Соблюдение", bottom: "сроков", offset: 1.7 },
      { icon: "/services/icon/tool.svg", top: "Качество", bottom: "работ", offset: 1.7 },
    ],
  },
];

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** Иконка-фича: стоп-кадр на offset; на ховере проигрываем ускоренно (speed). */
function FeatureIcon({ icon, top, bottom, offset = 0, speed = 1.5, size = 22 }) {
  const objRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const durRef = React.useRef(2);
  const playingRef = React.useRef(false);

  React.useEffect(() => {
    const obj = objRef.current;
    if (!obj) return;
    const onLoad = () => {
      try {
        const doc = obj.getSVGDocument ? obj.getSVGDocument() : obj.contentDocument;
        const svg = doc && doc.documentElement;
        if (!svg) return;
        const anim = doc.querySelector("animate[dur], animateTransform[dur]");
        if (anim) {
          const n = parseFloat(String(anim.getAttribute("dur") || "2s").replace(/s$/i, ""));
          if (!Number.isNaN(n) && n > 0.01) durRef.current = n;
        }
        const eps = 1e-4;
        const off = clamp(offset, 0, Math.max(0, durRef.current - eps));
        svg.pauseAnimations && svg.pauseAnimations();
        svg.setCurrentTime && svg.setCurrentTime(off);
      } catch {}
    };
    obj.addEventListener("load", onLoad);
    return () => obj.removeEventListener("load", onLoad);
  }, [offset]);

  const play = React.useCallback(() => {
    if (playingRef.current) return;
    const obj = objRef.current;
    if (!obj) return;
    try {
      const doc = obj.getSVGDocument ? obj.getSVGDocument() : obj.contentDocument;
      const svg = doc && doc.documentElement;
      if (!svg) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const eps = 1e-4;
      const dur = Math.max(eps, durRef.current);
      const startT = clamp(offset, 0, dur - eps);
      const totalMs = (Math.max(eps, dur - startT) * 1000) / Math.max(0.1, speed);

      svg.pauseAnimations && svg.pauseAnimations();
      svg.setCurrentTime && svg.setCurrentTime(startT);
      playingRef.current = true;
      const t0 = performance.now();

      const step = (now) => {
        const elapsed = now - t0;
        const t = clamp(startT + (elapsed / 1000) * speed, 0, dur - eps);
        try { svg.setCurrentTime && svg.setCurrentTime(t); } catch {}
        if (elapsed >= totalMs) {
          try {
            svg.setCurrentTime && svg.setCurrentTime(startT);
            svg.pauseAnimations && svg.pauseAnimations();
          } catch {}
          playingRef.current = false;
          rafRef.current = 0;
          return;
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    } catch {}
  }, [offset, speed]);

  React.useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
      <object
        ref={objRef}
        data={icon}
        type="image/svg+xml"
        width={size}
        height={size}
        className="block shrink-0 cursor-pointer"
        onMouseEnter={play}
        aria-label=""
      >
        <img src={icon} alt="" width={size} height={size} className="block" />
      </object>
      <div className="min-w-0 overflow-hidden text-[11px] font-light leading-[14px] text-dark sm:text-[13px] sm:leading-[16px]">
        <div className="truncate">{top}</div>
        <div className="truncate">{bottom}</div>
      </div>
    </div>
  );
}

/* стрелка → (чёткая) */
function Arrow() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="block shrink-0">
      <path d="M4 12h14" stroke="#222" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* позиция гифки на букве «И» */

export default function Services() {
  return (
    <section className="mt-14 bg-page pb-0 font-tight text-ink sm:mt-40 sm:pb-24 lg:mt-[255px]">
      {/* Заголовок УСЛУГИ + гифка на «И» */}
      <div className="text-center">
        <div className="text-sm font-light leading-7">Направления</div>
        <h2
          className="relative mt-[26px] inline-block font-semibold uppercase leading-none"
          style={{ fontSize: "clamp(48px, 13.5vw, 137px)" }}
        >
          УСЛУГ
          <span className="relative inline-block">
            И
            <img
              src="/services/hammer_chisel_logo.gif"
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 z-[2] block w-[54px] max-w-none translate-x-[calc(-50%+18px)] translate-y-[calc(-50%-15px)] select-none sm:w-[120px] sm:translate-x-[calc(-50%+39px)] sm:translate-y-[calc(-50%-34px)]"
            />
          </span>
        </h2>
      </div>

      {/* Вводный блок слева */}
      <div className="mt-3.5 px-4 text-center sm:mt-8 sm:pl-[52px] sm:pr-0 sm:text-left">
        <div className="text-[18px] font-light leading-7 sm:text-sm">Технологии под задачу</div>
        <h3 className="mt-3.5 hidden text-[28px] font-semibold leading-[1.2] sm:block sm:text-[36px] lg:text-[43px]">Делегируйте всё</h3>
        <h3 className="hidden text-[28px] font-semibold leading-[1.2] sm:block sm:text-[36px] lg:text-[43px]">— оставьте себе контроль.</h3>
      </div>

      {/* Карточки услуг: адаптивная сетка (моб 1 / планшет 2 / десктоп 3) */}
      <div className="mx-auto mt-12 grid max-w-[1461px] grid-cols-1 justify-center gap-5 px-4 sm:grid-cols-2 sm:mt-16 lg:grid-cols-3 lg:mt-20">
        {SERVICES.map((s) => (
          <article key={s.key} className="flex flex-col overflow-hidden rounded-[10px] bg-white">
            {/* картинка (клик → страница услуги, затемнение/зум на ховере) */}
            <a href={s.href} aria-label={s.title} className="group relative block h-[263px] overflow-hidden">
              <img
                src={s.img}
                alt={s.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.18]" />
            </a>

            {/* заголовок */}
            <div className="flex h-[88px] items-center px-5 sm:h-[129px]">
              <h4 className="text-[28px] font-semibold leading-tight text-dark">{s.title}</h4>
            </div>

            {/* «Подробно» — подчёркивание как у «Генеральный директор» */}
            <a
              href={s.href}
              className="group flex h-[58px] items-center justify-between border-y border-[#e9e9e9] px-5"
            >
              <span className="relative pb-1 text-base font-semibold text-dark">
                Подробно
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-300" />
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-ink transition-[width] duration-300 group-hover:w-full" />
              </span>
              <Arrow />
            </a>

            {/* фичи (иконки слева направо) */}
            <div className="flex h-[85px] items-center gap-1.5 px-4 sm:gap-5 sm:px-5">
              {s.features.map((f) => (
                <FeatureIcon key={f.top} icon={f.icon} top={f.top} bottom={f.bottom} offset={f.offset} />
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Каждая деталь имеет → Значение */}
      <div className="mt-8 px-4 text-center text-base font-light text-ink lg:mt-[108px]">
        Каждая деталь имеет{" "}
        <span className="inline-flex items-center gap-1.5 align-middle">
          <Arrow />
          <a href="#value" onClick={(e) => e.preventDefault()} className="group relative pb-1 font-semibold">
            Значение
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-300" />
            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-ink transition-[width] duration-300 group-hover:w-full" />
          </a>
        </span>
      </div>
    </section>
  );
}
