import React from "react";

export default function StickyDock() {
  const pills = ["Услуги", "О нас", "Проекты", "Контакты", "Отзывы"];
  const [active, setActive] = React.useState(null);

  return (
    <div id="dock-root">
      <div
        className="dock"
        style={{
          // геометрия по ТЗ
          ["--dock-w"]: "595.602px",
          ["--dock-h"]: "72px",
          ["--dock-radius"]: "12px",
          ["--dock-bottom"]: "21px",

          // внутренние размеры
          ["--dock-left-tile"]: "60px",
          ["--dock-group-w"]: "426.812px",
          ["--dock-right-btn"]: "90.7891px",

          // таблетки
          ["--pill-h"]: "48px",
          ["--pill-gap"]: "6px",
        }}
      >
        <div className="dock__inner">
          {/* слева «c.» */}
          <a href="/" className="dock__brand" aria-label="Home">
            <span className="dock__brand-text">c.</span>
          </a>

          {/* группа кнопок */}
          <div className="dock__group" role="tablist" aria-label="Dock">
            {pills.map((t, i) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`dock__pill${active === i ? " is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* CTA */}
          <a href="#" className="dock__cta" role="button">Купить</a>
        </div>
      </div>
    </div>
  );
}
