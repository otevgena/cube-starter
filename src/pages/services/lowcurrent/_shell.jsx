// src/pages/services/lowcurrent/_shell.jsx
// Верх детальных страниц «Слаботочные системы»: вкладки + заголовок + слоган +
// «Обновление» и низ «← Все слаботочные системы». Композиция верха — как в электромонтаже.
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";
import { UI, BG, INK, Capsule } from "@/components/services/detailBlocks.jsx";

export const GUTTER = 80;
const PAD = "clamp(16px, 6vw, 80px)";
export { UI, BG, INK };

const TABS = [
  { label: "СКС и структурированные кабельные сети", href: "/services/lowcurrent/sks" },
  { label: "Видеонаблюдение (CCTV)", href: "/services/lowcurrent/cctv" },
  { label: "Охранно-пожарная сигнализация", href: "/services/lowcurrent/ops" },
  { label: "Системы контроля и управления доступом", href: "/services/lowcurrent/skud" },
  { label: "Домофония и интерком", href: "/services/lowcurrent/intercom" },
  { label: "Серверные, кроссовые и шкафы", href: "/services/lowcurrent/server-cross" },
  { label: "ЛВС и активное сетевое оборудование", href: "/services/lowcurrent/lan-network" },
  { label: "Системы оповещения и звука", href: "/services/lowcurrent/public-address" },
];

export function formatRuDate(d = new Date()) {
  const m = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  return `${m[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

export function ServiceDetailLayout({ active, title, slogan, children }) {
  return (
    <main style={{ background: BG, minHeight: "100dvh", fontFamily: UI, color: INK }}>
      {/* ВЕРХ: вкладки + заголовок + слоган, приподнят на высоту шапки */}
      <div style={{ transform: "translateY(-61px)", willChange: "transform", textAlign: "center" }}>
        <div style={{ marginTop: 30 }}>
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

        <h1 style={{ margin: "2px 0 0", fontWeight: 600, textTransform: "uppercase", lineHeight: 1, fontSize: "clamp(48px, 13.5vw, 137px)", color: "#222" }}>
          {title}
        </h1>

        <p style={{ margin: "12px 0 0", fontSize: 21, lineHeight: "28px", fontWeight: 600, color: "#222" }}>{slogan}</p>
      </div>

      {/* «Обновление» справа */}
      <div style={{ marginTop: -61, marginLeft: PAD, marginRight: PAD, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ fontSize: 14, fontWeight: 300, color: "#3b3b3b" }}>Обновление: {formatRuDate()}</div>
      </div>

      {/* ТЕЛО — страница сама решает порядок блоков; крупный вертикальный ритм */}
      <div style={{ marginTop: 80, marginLeft: PAD, marginRight: PAD, display: "grid", rowGap: 72 }}>
        {children}

        {/* низ — возврат к категории */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, flexWrap: "wrap", gap: 16 }}>
          <div style={{ color: "#3b3b3b", fontSize: 14, fontWeight: 300 }}>Страница услуги в составе раздела «Слаботочные системы».</div>
          <Capsule to="/services/lowcurrent">← Все слаботочные системы</Capsule>
        </div>
      </div>

      <div style={{ height: 120 }} />
    </main>
  );
}
