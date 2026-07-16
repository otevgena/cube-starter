// src/components/common/Spinner.jsx
// Брендовый спиннер из 8 вращающихся точек — тот же стиль, что у прелоадера главной.
import React from "react";

// Ключевые кадры добавляем в <head> один раз (без дубликатов <style> на каждый спиннер).
function ensureCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cube-spin-css")) return;
  const el = document.createElement("style");
  el.id = "cube-spin-css";
  el.textContent = `
    @keyframes cube-spin-rot { to { transform: rotate(360deg); } }
    .cube-spin{ position:relative; display:inline-block; animation: cube-spin-rot 2s linear infinite; will-change: transform; }
    .cube-spin > i{ position:absolute; top:50%; left:50%; border-radius:50%; }
    @media (prefers-reduced-motion: reduce){ .cube-spin{ animation:none; } }
  `;
  document.head.appendChild(el);
}

/** Инлайновый спиннер. size — диаметр в px, dot — размер точки, color — цвет точек. */
export default function Spinner({ size = 28, dot = 2, color = "#7a7a7a", className = "", style }) {
  ensureCss();
  const radius = size / 2 - dot * 1.5;
  return (
    <span className={`cube-spin ${className}`} role="status" aria-label="Загрузка"
      style={{ width: size, height: size, ...style }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <i key={i} style={{
          width: dot, height: dot, background: color,
          margin: `${-dot / 2}px 0 0 ${-dot / 2}px`,
          transform: `rotate(${i * 45}deg) translate(${radius}px) rotate(${-i * 45}deg)`,
        }} />
      ))}
    </span>
  );
}

/** Центрированный спиннер, заполняющий контейнер (для панелей, списков, форм). */
export function CenterSpinner({ minHeight = 160, size = 32, label, color = "#7a7a7a" }) {
  return (
    <div style={{ minHeight, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <Spinner size={size} color={color} />
      {label ? <span style={{ fontSize: 13, fontWeight: 300, color: "#8a8a8a" }}>{label}</span> : null}
    </div>
  );
}
