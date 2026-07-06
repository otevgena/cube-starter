// src/pages/services/construction/_shell.jsx
// Верх детальных страниц «Общестрой»: вкладки + заголовок + слоган +
// «Обновление» и низ «← Весь общестрой». Композиция верха — как в других разделах.
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";
import { UI, BG, INK, Capsule } from "@/components/services/detailBlocks.jsx";

export const GUTTER = 80;
const PAD = "clamp(16px, 6vw, 80px)";
export { UI, BG, INK };

const TABS = [
  { label: "Общестроительные и отделочные работы", href: "/services/construction/general-finishing" },
  { label: "Монолитные и бетонные работы", href: "/services/construction/monolith-concrete" },
  { label: "Фундамент и земляные работы", href: "/services/construction/foundation-earthworks" },
  { label: "Кровля и фасад", href: "/services/construction/roof-facade" },
  { label: "Внутренние перегородки и проёмы", href: "/services/construction/partitions-openings" },
  { label: "Усиление конструкций", href: "/services/construction/structural-strengthening" },
  { label: "Генподряд и технадзор", href: "/services/construction/general-contracting-supervision" },
  { label: "Пуско-наладка инженерных систем", href: "/services/construction/commissioning" },
];

export function formatRuDate(d = new Date()) {
  const m = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  return `${m[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

export function ServiceDetailLayout({ active, title, slogan, children }) {
  return (
    <main style={{ background: BG, minHeight: "100dvh", fontFamily: UI, color: INK }}>
      <div className="-mt-12 text-center will-change-transform lg:mt-0 lg:-translate-y-[61px]">
        {/* назад к разделу — мобилка */}
        <div className="px-4 pt-2 text-left lg:hidden">
          <SpaLink to="/services/construction" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 300, textTransform: "uppercase", color: "#a7a7a7", textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
              <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Общестрой
          </SpaLink>
        </div>
        <div className="mt-[30px] hidden lg:block">
          <div style={{ display: "inline-flex", flexWrap: "wrap", maxWidth: 1080, justifyContent: "center" }}>
            {TABS.map((t) => (
              <SpaLink
                key={t.href}
                to={t.href}
                style={{
                  display: "inline-block", margin: "0 4px 8px", padding: "0 10px",
                  fontSize: 14, lineHeight: "28px", fontWeight: 300, textTransform: "uppercase",
                  color: t.href === active ? INK : "#a7a7a7", textDecoration: "none", transition: "color .16s ease",
                }}
              >
                {t.label}
              </SpaLink>
            ))}
          </div>
        </div>

        <h1 className="mt-2 text-[clamp(22px,8vw,32px)] sm:text-[clamp(48px,13.5vw,137px)] md:text-[clamp(40px,6vw,52px)] lg:mt-0.5 lg:text-[clamp(44px,7.5vw,88px)] xl:text-[clamp(48px,13.5vw,137px)]" style={{ fontWeight: 600, textTransform: "uppercase", lineHeight: 1, color: "#222" }}>
          {title}
        </h1>

        <p className="mx-4 mt-3 text-[18px] leading-6 lg:mx-0 lg:text-[21px] lg:leading-7" style={{ fontWeight: 600, color: "#222" }}>{slogan}</p>
      </div>

      <div className="mx-[clamp(16px,6vw,80px)] mt-2 flex justify-end md:mx-4 lg:mx-[80px] lg:-mt-[61px]">
        <div style={{ fontSize: 14, fontWeight: 300, color: "#3b3b3b" }}>Обновление: {formatRuDate()}</div>
      </div>

      <div data-reveal-seq className="mx-[clamp(16px,6vw,80px)] mt-10 grid gap-y-12 md:mx-4 lg:mx-[80px] lg:mt-20 lg:gap-y-[72px]">
        {children}
        <div className="flex flex-wrap items-center justify-between gap-4" style={{ marginTop: 24 }}>
          <div style={{ color: "#3b3b3b", fontSize: 14, fontWeight: 300 }}>Страница услуги в составе раздела «Общестрой».</div>
          <Capsule to="/services/construction">← Весь общестрой</Capsule>
        </div>
      </div>

      <div className="h-0 lg:h-[120px]" />
    </main>
  );
}
