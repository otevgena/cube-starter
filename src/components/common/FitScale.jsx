// src/components/common/FitScale.jsx
// Масштабирует ребёнок фиксированного размера (baseW×baseH) под ширину контейнера.
// Дизайн карточки сохраняется 1:1, просто ужимается на узких экранах (без горизонтального скролла).
// На широких экранах scale ограничен 1 — оригинальный размер.
import React from "react";

export default function FitScale({ baseW, baseH, children, className = "", maxScale = 1 }) {
  const ref = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || baseW;
      // maxScale > 1 позволяет карточке слегка растянуться, чтобы заполнить
      // ширину планшета (одна колонка) и совпасть с общими отступами.
      setScale(Math.min(maxScale, w / baseW));
    };
    measure();
    let ro = null;
    try { ro = new ResizeObserver(measure); ro.observe(el); } catch {}
    window.addEventListener("resize", measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [baseW, maxScale]);

  return (
    <div ref={ref} className={className} style={{ width: "100%", height: baseH * scale, overflow: "hidden" }}>
      <div style={{ width: baseW, height: baseH, transformOrigin: "top left", transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
