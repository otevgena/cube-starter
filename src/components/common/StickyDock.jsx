// src/components/common/StickyDock.jsx
import React from "react";

export default function StickyDock() {
  const pills = ["Услуги", "О нас", "Проекты", "Контакты", "Отзывы"];
  const [active, setActive] = React.useState(null);

  // Порог появления
  const SHOW_AFTER = 500;
  const [showUp, setShowUp] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const y =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setShowUp(y >= SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div id="dock-root">
      {/* Левый «чёрный блок»-клон со стрелкой */}
      <button
        type="button"
        aria-label="Наверх"
        title="Наверх"
        onClick={scrollToTop}
        className={`dock-up${showUp ? " is-visible" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="dock-up__icon" aria-hidden="true">
          <path
            d="M6 11l6-6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="5"
            x2="12"
            y2="19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* ВАША ПАНЕЛЬ — без изменений */}
      <div
        className="dock"
        style={{
          ["--dock-w"]: "595.602px",
          ["--dock-h"]: "72px",
          ["--dock-radius"]: "12px",
          ["--dock-bottom"]: "21px",

          ["--dock-left-tile"]: "60px",
          ["--dock-group-w"]: "426.812px",
          ["--dock-right-btn"]: "90.7891px",

          ["--pill-h"]: "48px",
          ["--pill-gap"]: "6px",
        }}
      >
        <div className="dock__inner">
          <a href="/" className="dock__brand" aria-label="Home">
            <span className="dock__brand-text">c.</span>
          </a>

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

          <a href="#" className="dock__cta" role="button">
            Купить
          </a>
        </div>
      </div>

      {/* Локальные стили ТОЛЬКО для стрелки */}
      <style>{`
        .dock-up{
          position: fixed;
          left: 24px; /* требуемый отступ слева */

          /* var(...) с fallback-ами — работает даже если переменные заданы внутри .dock */
          bottom: calc(
            var(--dock-bottom, 21px)
            + (var(--dock-h, 72px) - var(--dock-left-tile, 60px)) / 2
          );

          width: var(--dock-left-tile, 60px);
          height: var(--dock-left-tile, 60px);

          background: #1f1f1f;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,.35);
          color: #e5e7eb;

          display: grid;
          place-items: center;

          opacity: 0;
          pointer-events: none;
          transition: opacity .2s ease, transform .15s ease;
          z-index: 60;
        }
        .dock-up.is-visible{
          opacity: 1;
          pointer-events: auto;
        }
        .dock-up:hover{ transform: translateY(-1px); }
        .dock-up__icon{ width: 22px; height: 22px; }
      `}</style>
    </div>
  );
}
