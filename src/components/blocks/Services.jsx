// src/components/blocks/Services.jsx
// Секция «Услуги» (clean-rebuild): заголовок УСЛУГИ + «Делегируйте всё…» +
// карточки услуг. Чистый Tailwind, без анимированных <object>-SVG.
import React from "react";

const SERVICES = [
  {
    key: "electrical",
    title: "Электромонтаж",
    img: "/services/electrical.png",
    href: "/services/electrical",
    features: [
      { icon: "/services/icon/thumbs_up.svg", top: "Долговечный", bottom: "результат" },
      { icon: "/services/icon/calendar.svg", top: "Планирование", bottom: "этапов" },
      { icon: "/services/icon/graduation_hat.svg", top: "Профессиональная", bottom: "команда" },
    ],
  },
  {
    key: "low_current",
    title: "Слаботочные системы",
    img: "/services/low_current_systems.png",
    href: "/services/lowcurrent",
    features: [
      { icon: "/services/icon/phone.svg", top: "Надёжная", bottom: "связь" },
      { icon: "/services/icon/lock.svg", top: "Безопасность", bottom: "объекта" },
      { icon: "/services/icon/list.svg", top: "Интеграция", bottom: "систем" },
    ],
  },
  {
    key: "ventilation",
    title: "Климат-системы",
    img: "/services/ventilation.png",
    href: "/services/ventilation",
    features: [
      { icon: "/services/icon/drop.svg", top: "Эффективное", bottom: "охлаждение" },
      { icon: "/services/icon/clock.svg", top: "Свежий", bottom: "воздух" },
      { icon: "/services/icon/bolt.svg", top: "Экономия", bottom: "ресурсов" },
    ],
  },
  {
    key: "design",
    title: "Проектирование",
    img: "/services/design.png",
    href: "/services/design",
    features: [
      { icon: "/services/icon/expand.svg", top: "Точные", bottom: "расчёты" },
      { icon: "/services/icon/doc.svg", top: "Соответствие", bottom: "нормам" },
      { icon: "/services/icon/bulb.svg", top: "Оптимальные", bottom: "решения" },
    ],
  },
  {
    key: "construction",
    title: "Общестрой",
    img: "/services/construction.png",
    href: "/services/construction",
    features: [
      { icon: "/services/icon/home.svg", top: "Надёжное", bottom: "строительство" },
      { icon: "/services/icon/clock2.svg", top: "Соблюдение", bottom: "сроков" },
      { icon: "/services/icon/tool.svg", top: "Качество", bottom: "работ" },
    ],
  },
];

/* стрелка → (как в оригинале) */
function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="block shrink-0">
      <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* позиция гифки на букве «И» */
const GIF_POS = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(calc(-50% + 39px), calc(-50% - 34px))",
  width: "120px",
  height: "auto",
  maxWidth: "none",
  pointerEvents: "none",
  userSelect: "none",
  zIndex: 2,
  display: "block",
};

export default function Services() {
  return (
    <section className="mt-[255px] bg-field pb-24 font-tight text-ink">
      {/* Заголовок УСЛУГИ + гифка на «И» */}
      <div className="text-center">
        <h2
          className="relative inline-block font-semibold uppercase leading-none"
          style={{ fontSize: "clamp(48px, 13.5vw, 137px)" }}
        >
          УСЛУГ
          <span className="relative inline-block">
            И
            <img src="/services/hammer_chisel_logo.gif" alt="" style={GIF_POS} />
          </span>
        </h2>
      </div>

      {/* Вводный блок слева */}
      <div className="mt-8 pl-[52px] text-left">
        <div className="text-sm font-light leading-7">Технологии под задачу</div>
        <h3 className="mt-3.5 text-[43px] font-semibold leading-[1.2]">Делегируйте всё</h3>
        <h3 className="text-[43px] font-semibold leading-[1.2]">— оставьте себе контроль.</h3>
      </div>

      {/* Карточки услуг */}
      <div className="mt-20 flex flex-wrap justify-center gap-5 px-6">
        {SERVICES.map((s) => (
          <article key={s.key} className="flex w-[467px] flex-col overflow-hidden rounded-2xl bg-white">
            {/* картинка (клик → страница услуги, лёгкое затемнение на ховере) */}
            <a href={s.href} aria-label={s.title} className="group relative block h-[263px] overflow-hidden">
              <img
                src={s.img}
                alt={s.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
            </a>

            {/* заголовок */}
            <div className="flex h-[129px] items-center px-5">
              <h4 className="text-[28px] font-semibold leading-tight text-dark">{s.title}</h4>
            </div>

            {/* «Подробно» */}
            <a
              href={s.href}
              className="flex h-[58px] items-center justify-between border-y border-[#e9e9e9] px-5"
            >
              <span className="text-base font-semibold text-dark underline decoration-gold decoration-2 underline-offset-4">
                Подробно
              </span>
              <Arrow />
            </a>

            {/* фичи */}
            <div className="flex h-[85px] items-center justify-between px-5">
              {s.features.map((f) => (
                <div key={f.top} className="flex items-center gap-2">
                  <img src={f.icon} alt="" className="h-6 w-6 shrink-0" />
                  <div className="text-[11px] leading-tight text-dark">
                    <div>{f.top}</div>
                    <div>{f.bottom}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Каждая деталь имеет → Значение */}
      <div className="mt-[108px] px-6 text-center text-base font-light text-ink">
        Каждая деталь имеет{" "}
        <span className="inline-flex items-center gap-1.5 align-middle">
          <Arrow />
          <a href="#value" onClick={(e) => e.preventDefault()} className="font-semibold underline underline-offset-4">
            Значение
          </a>
        </span>
      </div>
    </section>
  );
}
