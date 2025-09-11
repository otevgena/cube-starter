// src/components/common/StickyDock.jsx
import React from "react";

export default function StickyDock() {
  const getIsLegal = () => { try { return /^\/legal(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsElectroOnly = () => { try { return /^\/services\/electrical(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsLow = () => { try { return /^\/services\/lowcurrent(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsVent = () => { try { return /^\/services\/ventilation(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsDesign = () => { try { return /^\/services\/design(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsConstruction = () => { try { return /^\/services\/construction(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };

  const defaultPills = ["Услуги", "О нас", "Проекты", "Контакты", "Отзывы"];
  const legalNav = [
    { label: "Cookie", path: "/legal/cookies" },
    { label: "Права",  path: "/legal/terms" },
    { label: "Данные", path: "/legal/privacy" },
  ];
  const legalIndexByPath = { "/legal/cookies":0, "/legal/terms":1, "/legal/privacy":2 };

  const [isLegal, setIsLegal] = React.useState(getIsLegal());
  // один флаг для «компактного сервиса»: электромонтаж / слаботочка / климат / проектирование / общестрой
  const [isElectro, setIsElectro] = React.useState(
    getIsElectroOnly() || getIsLow() || getIsVent() || getIsDesign() || getIsConstruction()
  );
  const pills = isLegal ? legalNav.map(x => x.label) : defaultPills;
  const [active, setActive] = React.useState(null);

  const SHOW_AFTER = 500;
  const [showUp, setShowUp] = React.useState(false);

  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    setEntered(false);
    const node = document.getElementById("dock-panel");
    if (node) { void node.offsetWidth; }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [isLegal, isElectro]);

  const DEFAULT_HEADER_OFFSET = 16;
  const DEFAULT_SPY_OFFSET = 120;
  const DEFAULT_CLICK_OFFSET = 16;
  const DEFAULT_HERO_SILENCE = 80;

  const idByLabel = { "Услуги":"services","О нас":"about","Проекты":"projects","Контакты":"contact","Отзывы":"reviews" };

  const getSectionEl = React.useCallback((label) => {
    const id = idByLabel[label];
    if (!id) return null;
    return document.getElementById(id)
        || document.querySelector(`[data-section="${id}"]`)
        || document.querySelector(`[aria-label="${id}"]`);
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

  const go = React.useCallback((to) => {
    try {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.href = to;
    }
  }, []);
  const goHome = React.useCallback(() => { go("/"); }, [go]);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      setShowUp(y >= SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const syncFromLocation = () => {
      const legal = getIsLegal();
      const compactService = getIsElectroOnly() || getIsLow() || getIsVent() || getIsDesign() || getIsConstruction();
      setIsLegal(legal);
      setIsElectro(compactService);
      if (legal) {
        const p = window.location.pathname || "";
        const idx = legalIndexByPath[p];
        setActive(Number.isFinite(idx) ? idx : null);
      } else {
        setActive(null);
      }
    };
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  // scroll-spy на главной (не в legal и не в «компактных сервисах»)
  React.useEffect(() => {
    if (isLegal || isElectro) return;
    const items = defaultPills
      .map((label, idx) => {
        const el = getSectionEl(label);
        if (!el) return null;
        return {
          label, idx, el,
          headerOffset: getNumber(el, "data-header-offset", DEFAULT_HEADER_OFFSET),
          spyOffset:    getNumber(el, "data-spy-offset",    DEFAULT_SPY_OFFSET),
        };
      })
      .filter(Boolean);
    if (!items.length) return;

    const first = items[0];
    const heroSilence = getNumber(first.el, "data-hero-silence", DEFAULT_HERO_SILENCE);

    const recompute = () => {
      const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const firstTopAbs = first.el.getBoundingClientRect().top + scrollY;
      const silenceUntil = firstTopAbs - first.headerOffset - Math.max(heroSilence, first.spyOffset);
      if (scrollY < silenceUntil) { if (active !== null) setActive(null); return; }
      let currentIdx = first.idx;
      for (const s of items) {
        const topAbs = s.el.getBoundingClientRect().top + scrollY;
        const reached = (topAbs - s.headerOffset - s.spyOffset) <= scrollY;
        if (reached) currentIdx = s.idx;
      }
      if (currentIdx !== active) setActive(currentIdx);
    };

    recompute();
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLegal, isElectro, defaultPills.join("|")]);

  const onPillClick = (label, idx) => {
    if (isLegal) {
      const item = legalNav.find(x => x.label === label);
      if (!item) return;
      setActive(idx);
      go(item.path);
      return;
    }
    setActive(idx);
    scrollToSection(label);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // размеры панели
  const legalVars = {
    "--dock-w": "346px",
    "--dock-h": "72px",
    "--dock-radius": "12px",
    "--dock-bottom": "21px",
    "--dock-left-tile": "60px",
    "--dock-group-w": "270px",
    "--dock-right-btn": "0px",
    "--pill-h": "48px",
    "--pill-gap": "6px",
  };
  const defaultVars = {
    "--dock-w": "595.602px",
    "--dock-h": "72px",
    "--dock-radius": "12px",
    "--dock-bottom": "21px",
    "--dock-left-tile": "60px",
    "--dock-group-w": "426.812px",
    "--dock-right-btn": "90.7891px",
    "--pill-h": "48px",
    "--pill-gap": "6px",
  };
  /* компактные сервисы — убираем «воздух» справа на 48px */
  const electroVars = {
    "--dock-w": "197px", // 245 - 48
    "--dock-h": "72px",
    "--dock-radius": "12px",
    "--dock-bottom": "21px",
    "--dock-left-tile": "60px",
    "--dock-group-w": "0px",
    "--dock-right-btn": "0px",
    "--pill-h": "48px",
    "--pill-gap": "6px",
  };

  const dockClass = `dock${isLegal ? " is-legal" : ""}${isElectro ? " is-electro" : ""} ${entered ? " is-entered" : " is-enter"}`;
  const dockVars = isLegal ? legalVars : isElectro ? electroVars : defaultVars;

  return (
    <div id="dock-root">
      {/* стрелка вверх */}
      <button
        type="button"
        aria-label="Наверх"
        title="Наверх"
        onClick={scrollToTop}
        className={`dock-up${showUp ? " is-visible" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="dock-up__icon" aria-hidden="true">
          <path d="M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* панель */}
      <div id="dock-panel" className={dockClass} style={dockVars}>
        <div className="dock__inner">
          {/* левый ромб */}
          {isLegal ? (
            <button
              type="button"
              className="dock__brand"
              aria-label="На главную"
              onClick={(e) => { e.preventDefault(); goHome(); }}
              title="На главную"
              style={{ display: "grid", placeItems: "center", transform: "translateX(4px)" }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <g transform="rotate(-90 12 12)">
                  <path d="M6 11l6-6 6 6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="5" x2="12" y2="19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
            </button>
          ) : (
            <a
              href="/"
              className="dock__brand"
              aria-label={isElectro ? "На главную" : "Home"}
              onClick={(e) => { e.preventDefault(); if (isElectro) goHome(); else { setActive(null); scrollToTop(); } }}
              title={isElectro ? "На главную" : "Home"}
            >
              <span className="dock__brand-text">c.</span>
            </a>
          )}

          {/* центр — скрыт в компактных сервисах */}
          <div className="dock__group" role="tablist" aria-label="Dock" style={isElectro ? { display: "none" } : undefined}>
            {pills.map((t, i) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`dock__pill${active === i ? " is-active" : ""}`}
                onClick={() => onPillClick(t, i)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* CTA справа */}
          {!isLegal && (
            isElectro ? (
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollToSection("Контакты"); }}
                className="electro-cta"
                role="button"
              >
                Оставить заявку
              </a>
            ) : (
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollToSection("Контакты"); }}
                className="dock__cta"
                role="button"
              >
                Купить
              </a>
            )
          )}
        </div>
      </div>

      {/* локальные стили */}
      <style>{`
        body.has-modal #dock-root { display: none !important; }

        .dock-up{
          position: fixed;
          left: 24px;
          bottom: calc(var(--dock-bottom, 21px) + (var(--dock-h, 72px) - var(--dock-left-tile, 60px)) / 2);
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
        .dock-up.is-visible{ opacity: 1; pointer-events: auto; }
        .dock-up:hover{ transform: translateY(-1px); }
        .dock-up__icon{ width: 22px; height: 22px; }

        /* анимация панели */
        .dock{
          transform: translateX(-50%) translateY(var(--dock-ty, 0)) !important;
          transition: transform .28s cubic-bezier(.2,.8,.2,1), opacity .22s ease;
          will-change: transform, opacity;
        }
        .dock.is-enter  { --dock-ty: 22px; opacity: 0; }
        .dock.is-entered{ --dock-ty: 0;   opacity: 1; }

        /* compact: legal */
        .dock.is-legal .dock__group{ width: var(--dock-group-w); }
        .dock.is-legal .dock__cta{ display: none !important; }

        /* compact services: electrical / lowcurrent / ventilation / design / construction */
        .dock.is-electro .dock__group{ display: none !important; }
        .dock.is-electro .electro-cta{
          width: 121px !important;
          height: 60px !important;
          display: inline-grid !important;
          place-items: center !important;
          background: #FA5D29 !important;   /* яркий акцент */
          color: #000 !important;
          border: 1px solid #FA5D29 !important;
          border-radius: 6px !important;    /* как у «Купить» (зафиксировано) */
          font-weight: 600 !important;
          text-decoration: none !important;
          white-space: nowrap !important;
          box-shadow: none !important;
          transform: translateX(-5px);      /* сдвиг на 5px влево */
        }
        .dock.is-electro .electro-cta:hover{ filter: brightness(0.96); }
        .dock.is-electro .electro-cta:active{ filter: brightness(0.92); }
      `}</style>
    </div>
  );
}
