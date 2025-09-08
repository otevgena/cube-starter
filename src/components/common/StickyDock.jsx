// src/components/common/StickyDock.jsx
import React from "react";

export default function StickyDock() {
  const pills = ["Услуги", "О нас", "Проекты", "Контакты", "Отзывы"];
  const [active, setActive] = React.useState(null);

  const SHOW_AFTER = 500;
  const [showUp, setShowUp] = React.useState(false);

  // Глобальные дефолты (можно оставить как есть)
  const DEFAULT_HEADER_OFFSET = 16;
  const DEFAULT_SPY_OFFSET = 120;
  const DEFAULT_CLICK_OFFSET = 16;
  const DEFAULT_HERO_SILENCE = 80;

  const idByLabel = {
    "Услуги": "services",
    "О нас": "about",
    "Проекты": "projects",
    "Контакты": "contact",
    "Отзывы": "reviews",
  };

  const getSectionEl = React.useCallback((label) => {
    const id = idByLabel[label];
    if (!id) return null;
    return (
      document.getElementById(id) ||
      document.querySelector(`[data-section="${id}"]`) ||
      document.querySelector(`[aria-label="${id}"]`)
    );
  }, []);

  const getNumber = (el, attr, fallback) => {
    if (!el) return fallback;
    const v = el.getAttribute(attr);
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const scrollToSection = React.useCallback((label) => {
    const el = getSectionEl(label);
    if (!el) return;

    const headerOffset = getNumber(el, "data-header-offset", DEFAULT_HEADER_OFFSET);
    const clickOffset  = getNumber(el, "data-click-offset",  DEFAULT_CLICK_OFFSET);

    const rect = el.getBoundingClientRect();
    const pageY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const top = pageY + rect.top - headerOffset - clickOffset;

    window.scrollTo({ top, behavior: "smooth" });
  }, [getSectionEl]);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      setShowUp(y >= SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy с «жёсткой» тихой зоной над services
  React.useEffect(() => {
    const items = pills
      .map((label, idx) => {
        const el = getSectionEl(label);
        if (!el) return null;
        return {
          label,
          idx,
          el,
          headerOffset: getNumber(el, "data-header-offset", DEFAULT_HEADER_OFFSET),
          spyOffset:    getNumber(el, "data-spy-offset",    DEFAULT_SPY_OFFSET),
        };
      })
      .filter(Boolean);

    if (!items.length) return;

    const first = items[0]; // services
    const heroSilence = getNumber(first.el, "data-hero-silence", DEFAULT_HERO_SILENCE);

    const recompute = () => {
      const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);

      // Абсолютный top первой секции
      const firstTopAbs = first.el.getBoundingClientRect().top + scrollY;

      // ВЫСШИЙ ПРИОРИТЕТ: тихая зона над services
      // Берём max(heroSilence, spyOffset), чтобы точно не загорались "Услуги" до порога
      const silenceUntil = firstTopAbs - first.headerOffset - Math.max(heroSilence, first.spyOffset);

      if (scrollY < silenceUntil) {
        if (active !== null) setActive(null);
        return;
      }

      // Иначе выбираем последнюю секцию, чей top <= текущей "контрольной" линии
      let currentIdx = first.idx;
      for (const s of items) {
        const topAbs = s.el.getBoundingClientRect().top + scrollY;
        const reached = (topAbs - s.headerOffset - s.spyOffset) <= scrollY;
        if (reached) currentIdx = s.idx;
      }

      if (currentIdx !== active) setActive(currentIdx);
    };

    // init + listeners
    recompute();
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pills.join("|")]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div id="dock-root">
      {/* Стрелка вверх */}
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

      {/* Панель */}
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
          {/* БРЕНД: клик = скролл к верху + сброс подсветки */}
          <a
            href="/"
            className="dock__brand"
            aria-label="Home"
            onClick={(e) => {
              e.preventDefault();
              setActive(null);
              scrollToTop();
            }}
          >
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
                onClick={() => {
                  setActive(i);
                  scrollToSection(t);
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("Контакты");
            }}
            className="dock__cta"
            role="button"
          >
            Купить
          </a>
        </div>
      </div>

      {/* Локальные стили стрелки */}
      <style>{`
        /* ⤵️Когда открыта модалка (body.has-modal ставит Modals.jsx), прячем весь док */
        body.has-modal #dock-root { display: none !important; }

        .dock-up{
          position: fixed;
          left: 24px;
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
