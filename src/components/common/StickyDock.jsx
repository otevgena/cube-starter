import React from "react";

export default function StickyDock() {
  // было: useState(0)
  const [active, setActive] = React.useState(-1);

  const pills = ["Услуги", "О нас", "Проекты", "Контакты", "Отзывы"];

  return (
    <div
      className="dock"
      style={{
        ["--dock-w"]: "595.602px",
        ["--dock-h"]: "72px",
        ["--dock-radius"]: "12px",
        ["--dock-bottom"]: "21px",
        ["--dock-gap-x"]: "9px",
        ["--dock-left-tile"]: "60px",
        ["--dock-group-w"]: "426.812px",
        ["--dock-right-btn"]: "90.7891px",
        ["--pill-gap"]: "6px",
        ["--pill-h"]: "48px",
        ["--font-size"]: "13px",
        ["--line"]: "28px",
        ["--font-weight"]: 300,
      }}
    >
      <div className="dock__inner">
        <a href="/" className="dock__brand" aria-label="Главная">
          <span className="dock__brand-text">c.</span>
        </a>

        <div className="dock__group">
          {pills.map((name, i) => (
            <button
              key={name}
              type="button"
              className={`dock__pill ${active === i ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              {name}
            </button>
          ))}
        </div>

        <a href="#sotd" className="dock__cta">Visit Sotd.</a>
      </div>
    </div>
  );
}
