// src/components/common/StickyDock.jsx
import React from "react";

// услуга (страница) → предвыбранный пункт «чем помочь» в форме контактов
const SERVICE_HELP = {
  "/services/electrical": "Электромонтажные работы",
  "/services/lowcurrent": "Слаботочные системы",
  "/services/ventilation": "Вентиляция и кондиционирование",
  "/services/design": "Проектирование систем",
  "/services/construction": "Общестрой и отделка",
};

export default function StickyDock() {
  /* =============== helpers =============== */
  const getPath = () => {
    try {
      return (window.location.pathname || "/") + (window.location.search || "") + (window.location.hash || "");
    } catch {
      return "/";
    }
  };
  const isLegalPath = (p) => {
    try { return /^\/legal(\/|$)/.test(p || (window.location.pathname || "/")); }
    catch { return false; }
  };
  const preloaderActive = () => {
    try { return document.documentElement.classList.contains("preloader-active"); }
    catch { return false; }
  };

  const getIsElectroOnly  = () => { try { return /^\/services\/electrical(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsLow          = () => { try { return /^\/services\/lowcurrent(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsVent         = () => { try { return /^\/services\/ventilation(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsDesign       = () => { try { return /^\/services\/design(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsConstruction = () => { try { return /^\/services\/construction(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsContact      = () => { try { return /^\/contact(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  const getIsAccount      = () => { try { return /^\/account(\/|$)/.test(window.location.pathname || "/"); } catch { return false; } };
  // детальная страница услуги: /services/<направление>/<услуга> — в доке «c.» становится стрелкой «назад»
  const getIsServiceDetail = () => { try { return /^\/services\/[^/]+\/[^/]+/.test(window.location.pathname || "/"); } catch { return false; } };
  const getObjectNumber = () => { try { const m = (window.location.pathname || "/").match(/^\/account\/objects\/([^/?#]+)/); return (!m || m[1] === "u") ? null : decodeURIComponent(m[1]); } catch { return null; } };

  /* =============== state =============== */
  const [routeKey, setRouteKey] = React.useState(getPath());
  const allowAnimateRef = React.useRef(true);
  const prevPathRef = React.useRef(null);

  const [isLegal, setIsLegal] = React.useState(isLegalPath());
  const [isElectro, setIsElectro] = React.useState(
    getIsElectroOnly() || getIsLow() || getIsVent() || getIsDesign() || getIsConstruction()
  );
  const [isContact, setIsContact] = React.useState(getIsContact());
  const [isAccount, setIsAccount] = React.useState(getIsAccount());
  const [isServiceDetail, setIsServiceDetail] = React.useState(getIsServiceDetail());
  const [objectNumber, setObjectNumber] = React.useState(getObjectNumber());

  // имя профиля для дока (из кэша Header), обновляется на auth:changed
  const readUserName = () => {
    try {
      const u = JSON.parse(sessionStorage.getItem("auth:lastUser") || "null");
      if (!u) return "";
      return u.name || u.username || String(u.email || "").split("@")[0] || "Профиль";
    } catch { return ""; }
  };
  const nameFromUser = (u) => (u ? (u.name || u.username || String(u.email || "").split("@")[0] || "") : "");
  const [userName, setUserName] = React.useState(readUserName());
  React.useEffect(() => {
    const onAuth = (e) => {
      // имя берём прямо из события (без гонки с записью кэша), иначе из кэша
      if (e && e.detail && "user" in e.detail) setUserName(nameFromUser(e.detail.user));
      else setUserName(readUserName());
    };
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, []);

  const defaultPills = ["Услуги", "О нас", "Проекты", "Контакты", "Отзывы"];
  const legalNav = [
    { label: "Cookie", path: "/legal/cookies" },
    { label: "Права",  path: "/legal/terms" },
    { label: "Данные", path: "/legal/privacy" },
  ];
  const legalIndexByPath = { "/legal/cookies":0, "/legal/terms":1, "/legal/privacy":2 };
  const pills = isLegal ? legalNav.map(x => x.label) : defaultPills;

  const [active, setActive] = React.useState(null);

  /* =============== up button =============== */
  const SHOW_AFTER = 500;
  const [showUp, setShowUp] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      setShowUp(y >= SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* =============== sync by location (правило анимации) =============== */
  React.useEffect(() => {
    const syncFromLocation = () => {
      const nextPath = getPath();
      const prevPath = prevPathRef.current;

      if (prevPath == null) {
        allowAnimateRef.current = true;
      } else {
        const prevLegal = isLegalPath(prevPath);
        const nextLegal = isLegalPath(nextPath);
        const prevAcc = /^\/account(\/|$)/.test(prevPath || "");
        const nextAcc = /^\/account(\/|$)/.test(nextPath || "");
        // компактные сервисные страницы (форма дока одинаковая) — электро/слаботочка/вентиляция/проект/общестрой
        const svcRe = /^\/services\/(electrical|lowcurrent|ventilation|design|construction)(\/|$)/;
        const prevSvc = svcRe.test(prevPath || "");
        const nextSvc = svcRe.test(nextPath || "");
        // не анимируем док при переходах внутри legal / аккаунта / внутри сервисов (вкладки услуг)
        allowAnimateRef.current = !((prevLegal && nextLegal) || (prevAcc && nextAcc) || (prevSvc && nextSvc));
      }

      prevPathRef.current = nextPath;
      setRouteKey(nextPath);

      const legal = isLegalPath(nextPath);
      const compactService = getIsElectroOnly() || getIsLow() || getIsVent() || getIsDesign() || getIsConstruction();
      setIsLegal(legal);
      setIsElectro(compactService);
      setIsContact(getIsContact());
      setIsAccount(getIsAccount());
      setIsServiceDetail(getIsServiceDetail());
      setObjectNumber(getObjectNumber());

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

  /* =============== anchors / scroll spy =============== */
  const DEFAULT_HEADER_OFFSET = 16;
  const DEFAULT_SPY_OFFSET    = 120;
  const DEFAULT_CLICK_OFFSET  = 16;
  const DEFAULT_HERO_SILENCE  = 80;

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
    // верхний отступ секции задаёт её первый ребёнок (pt-…) — учитываем,
    // чтобы заголовок секции (напр. «Портфолио») встал у самого верха
    const child = el.firstElementChild;
    let padTop = 0;
    try { padTop = child ? (parseFloat(getComputedStyle(child).paddingTop) || 0) : 0; } catch {}
    const rect = el.getBoundingClientRect();
    const pageY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const top = pageY + rect.top + padTop - 8; // 8px воздуха над заголовком
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [getSectionEl]);

  /* =============== navigation =============== */
  const go = React.useCallback((to) => {
    try {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.href = to;
    }
  }, []);
  const goHome = React.useCallback(() => { go("/"); }, [go]);
  // на детальной странице услуги стрелка «назад» уводит на уровень выше (к странице направления)
  const goParent = React.useCallback(() => {
    const p = window.location.pathname || "/";
    const parent = p.replace(/\/[^/]+$/, "") || "/";
    go(parent);
  }, [go]);

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

  // c.: на главной — наверх; на любой другой странице — на главную
  const onBrandClick = (e) => {
    if (e) e.preventDefault();
    const p = window.location.pathname || "/";
    if (p === "/" || p === "") { setActive(null); scrollToTop(); }
    else goHome();
  };

  // «Оставить заявку» со страницы услуги → /contact с предвыбранной услугой
  const onElectroCta = (e) => {
    if (e) e.preventDefault();
    try {
      const p = window.location.pathname || "/";
      const key = Object.keys(SERVICE_HELP).find((k) => p.startsWith(k));
      if (key) sessionStorage.setItem("cube:help", SERVICE_HELP[key]);
      // тема комментария = заголовок страницы услуги (напр. «Серверные, кроссовые и шкафы»)
      const subj = (document.title || "").replace(/\s*—\s*CUBE\s*$/i, "").trim();
      if (subj) sessionStorage.setItem("cube:subject", subj);
    } catch {}
    go("/contact");
  };

  /* =============== sizes (CSS vars) =============== */
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
  const electroVars = {
    "--dock-w": "199px",
    "--dock-h": "72px",
    "--dock-radius": "12px",
    "--dock-bottom": "21px",
    "--dock-left-tile": "60px",
    "--dock-group-w": "0px",
    "--dock-right-btn": "0px",
    "--pill-h": "48px",
    "--pill-gap": "6px",
  };
  const contactVars = {
    "--dock-w": "72px",
    "--dock-h": "72px",
    "--dock-radius": "12px",
    "--dock-bottom": "21px",
    "--dock-left-tile": "60px",
    "--dock-group-w": "0px",
    "--dock-right-btn": "0px",
    "--pill-h": "48px",
    "--pill-gap": "6px",
  };
  const accountVars = {
    "--dock-w": "auto",
    "--dock-h": "72px",
    "--dock-radius": "12px",
    "--dock-bottom": "21px",
    "--dock-left-tile": "60px",
    "--dock-group-w": "0px",
    "--dock-right-btn": "0px",
    "--pill-h": "48px",
    "--pill-gap": "6px",
  };
  const dockVars = isAccount ? accountVars : isContact ? contactVars : isLegal ? legalVars : isElectro ? electroVars : defaultVars;

  /* =============== анимация (инлайн с !important) =============== */
  const panelRef = React.useRef(null);
  const animTimeoutRef = React.useRef(null);

  const setHiddenInstant = React.useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const DIST = 140;
    el.style.setProperty("transition", "none", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("transform", `translateX(-50%) translateY(${DIST}px)`, "important");
  }, []);

  const runDockAnimation = React.useCallback(() => {
    const el = panelRef.current;
    if (!el) return;

    if (!allowAnimateRef.current || preloaderActive()) return;

    if (animTimeoutRef.current) { clearTimeout(animTimeoutRef.current); animTimeoutRef.current = null; }

    const prefersReduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const DIST = 140;
    const DUR  = prefersReduced ? 1 : 600;
    const OP_DUR = Math.round(DUR * 0.85);

    el.style.setProperty("transition", "none", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("transform", `translateX(-50%) translateY(${DIST}px)`, "important");
    void el.offsetHeight;

    requestAnimationFrame(() => {
      el.style.setProperty("transition", `transform ${DUR}ms cubic-bezier(.2,.8,.2,1), opacity ${OP_DUR}ms ease`, "important");
      el.style.setProperty("transform", `translateX(-50%) translateY(0)`, "important");
      el.style.setProperty("opacity", "1", "important");
    });

    animTimeoutRef.current = setTimeout(() => {
      el.style.removeProperty("transition");
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
      animTimeoutRef.current = null;
    }, DUR + 120);
  }, []);

  React.useEffect(() => { if (preloaderActive()) setHiddenInstant(); }, [setHiddenInstant]);

  React.useEffect(() => {
    if (preloaderActive()) {
      setHiddenInstant();
      return;
    }
    runDockAnimation();
  }, [routeKey, runDockAnimation, setHiddenInstant]);

  React.useEffect(() => {
    const handler = () => {
      let tries = 0;
      const tick = () => {
        if (!preloaderActive()) {
          runDockAnimation();
        } else if (tries++ < 90) {
          setTimeout(tick, 16);
        }
      };
      setHiddenInstant();
      tick();
    };
    window.addEventListener("preloader:done", handler);
    return () => window.removeEventListener("preloader:done", handler);
  }, [runDockAnimation, setHiddenInstant]);

  /* =============== Toast "Сохранено" =============== */
  const [toast, setToast] = React.useState({ visible: false, text: "" });
  const toastTimerRef = React.useRef(null);
  const toastRef = React.useRef(null);

  React.useEffect(() => {
    window.showDockToast = (text = "Сохранено", ms = 2400) => {
      try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch {}
      // Ширина — всегда по содержимому, в одну строку (без ужимания, иначе текст переносится).
      setToast({ visible: true, text });

      toastTimerRef.current = setTimeout(() => {
        setToast({ visible: false, text: "" });
        toastTimerRef.current = null;
      }, Number(ms) || 2400);
    };
    return () => {
      try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch {}
      delete window.showDockToast;
    };
  }, []);

  /* =============== classes =============== */
  const dockClass = `dock${isLegal ? " is-legal" : ""}${isElectro ? " is-electro" : ""}${isContact ? " is-contact" : ""}${isAccount ? " is-account" : ""}`;

  /* =============== render =============== */
  return (
    <div id="dock-root">
      {/* стрелка вверх */}
      <button
        type="button"
        aria-label="Наверх"
        title="Наверх"
        onClick={scrollToTop}
        className={`dock-up${showUp && !toast.visible ? " is-visible" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="dock-up__icon" aria-hidden="true">
          <path d="M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* тост на месте стрелки */}
      <div
        ref={toastRef}
        className={`dock-toast${toast.visible ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="dock-toast__icon" aria-hidden="true">
          {/* круг + галочка (26px) */}
          <svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
            <circle cx="12" cy="12" r="10" fill="#ffffff"/>
            <path d="M7 12.5l3.1 3.1L17 9" fill="none" stroke="#111111" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="dock-toast__text">{toast.text || "Сохранено"}</span>
      </div>

      {/* панель */}
      <div id="dock-panel" ref={panelRef} className={dockClass} style={dockVars}>
        <div className="dock__inner">
          {/* левый ромб / бренд. На legal и на детальной странице услуги — стрелка «назад» */}
          {(isLegal || isServiceDetail || objectNumber) ? (
            <button
              type="button"
              className="dock__brand"
              aria-label="Назад"
              onClick={(e) => { e.preventDefault(); objectNumber ? go("/account/objects") : isServiceDetail ? goParent() : goHome(); }}
              title="Назад"
              style={{ display: "grid", placeItems: "center", ...(isLegal ? { transform: "translateX(4px)" } : null) }}
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
              aria-label="На главную"
              onClick={onBrandClick}
              title="На главную"
            >
              <span className="dock__brand-text">c.</span>
            </a>
          )}

          {/* центр — скрыт в компактных сервисах и аккаунте */}
          <div className="dock__group" role="tablist" aria-label="Dock" style={(isElectro || isContact || isAccount) ? { display: "none" } : undefined}>
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

          {/* аккаунт: кнопка профиля (иконка + имя с подчёркиванием) */}
          {isAccount && (
            <a
              href="/account/profile"
              onClick={(e) => { e.preventDefault(); go("/account/profile"); }}
              className="dock__profile"
              title="Профиль"
            >
              <img src="/profile/profile.png" alt="" className="dock__profile-avatar" />
              <span className="dock__profile-name">{objectNumber || userName || "Профиль"}</span>
            </a>
          )}

          {/* CTA справа */}
          {isAccount ? (
            <a
              href="/account/objects"
              onClick={(e) => { e.preventDefault(); go("/account/objects"); }}
              className="dock__settings"
              role="button"
            >
              Объекты
            </a>
          ) : (!isLegal && !isContact && (
            isElectro ? (
              <a
                href="/contact"
                onClick={onElectroCta}
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
          ))}
        </div>
      </div>

      {/* локальные стили */}
      <style>{`
        #dock-root{ position: relative; z-index: 2147483647; }
        /* при открытой модалке (has-modal) или внутри подпунктов админки (dock-off)
           док не пропадает резко, а плавно уезжает вниз */
        #dock-panel{ transition: width .4s cubic-bezier(.2,.8,.2,1), opacity .28s ease, transform .34s cubic-bezier(.2,.8,.2,1); }
        body.has-modal #dock-panel,
        body.dock-off #dock-panel{
          opacity: 0 !important;
          transform: translateX(-50%) translateY(130px) !important;
          pointer-events: none !important;
        }
        body.has-modal .dock-up,
        body.has-modal .dock-toast,
        body.dock-off .dock-up,
        body.dock-off .dock-toast{ opacity: 0 !important; pointer-events: none !important; }
        /* на мобиле/планшете (где работает мобильная шапка) док скрыт — не мешает чтению */
        @media (max-width: 1023px){ #dock-root{ display: none !important; } }

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
          display: grid; place-items: center;
          opacity: 0; pointer-events: none;
          transition: opacity .24s ease, transform .18s ease;
          z-index: 60;
        }
        .dock-up.is-visible{ opacity: 1; pointer-events: auto; }
        .dock-up:hover{ transform: translateY(-1px); }
        .dock-up__icon{ width: 22px; height: 22px; }

        /* Toast (высота как у стрелки, ширина −15%, выезд слева + fade, контент по центру) */
        .dock-toast{
          position: fixed;
          left: 24px;
          bottom: calc(var(--dock-bottom, 21px) + (var(--dock-h, 72px) - var(--dock-left-tile, 60px)) / 2);
          height: var(--dock-left-tile, 60px);
          display: inline-flex; align-items: center; justify-content: center; gap: 12px;
          padding: 0 18px;
          background: #1f1f1f;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          color: #f8fafc;
          box-shadow: 0 8px 24px rgba(0,0,0,.35);
          opacity: 0; pointer-events: none;
          transform: translateX(-22px);
          transition: opacity .22s ease, transform .24s cubic-bezier(.2,.8,.2,1);
          z-index: 61;
          will-change: opacity, transform, width;
          width: auto; /* после показа JS задаёт −15% */
        }
        .dock-toast.is-visible{ opacity: 1; transform: translateX(0); pointer-events: auto; }
        .dock-toast__icon{ display: grid; place-items: center; }
        .dock-toast__text{ font-size: 15px; font-weight: 400; white-space: nowrap; }

        /* ===== База дока ===== */
        .dock{
          position: fixed;
          left: 50%;
          bottom: var(--dock-bottom, 21px);
          transform: translateX(-50%);
          width: var(--dock-w);
          height: var(--dock-h, 72px);
          padding: 6px 0;
          border-radius: var(--dock-radius, 12px);
          background: rgba(69,69,69,.58);
          border: 1px solid transparent;
          backdrop-filter: saturate(115%) blur(6px);
          -webkit-backdrop-filter: saturate(115%) blur(6px);
          display: flex;
          align-items: center;
          z-index: 2147483647;
          font-family: "Inter Tight", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          transition: width .4s cubic-bezier(.2,.8,.2,1);
          will-change: transform, opacity, width;
        }
        @media (max-width: 640px){
          .dock{ transform: translateX(-50%) scale(.92); transform-origin: bottom center; }
        }

        .dock__inner{
          display: grid;
          grid-template-columns: var(--dock-left-tile) var(--dock-group-w) var(--dock-right-btn);
          align-items: center;
          column-gap: 10px;
          width: 100%;
          height: 100%;
        }

        /* левая плитка «c.» */
        .dock__brand{
          position: relative;
          display: grid; place-items: center;
          width: 60px; height: 60px;
          border-radius: 8px;
          background: #1B1B1B;
          border: 1px solid rgba(255,255,255,.06);
          text-decoration: none;
        }
        a.dock__brand{ left: 4px; }   /* выравнивание в сетке */
        .dock__brand-text{ font-size: 26px; line-height: 28px; font-weight: 400; color: #e9e9e9; }

        /* плашка под пилюлями */
        .dock__group{
          position: relative;
          left: -1px;
          width: 100%;
          height: 60px;
          display: flex; align-items: center; justify-content: center;
          gap: var(--pill-gap, 6px);
          padding: 6px 10px;
          border-radius: 10px;
          background: #3E3E3E;
        }

        /* пилюли */
        .dock__pill{
          display: inline-flex; align-items: center; justify-content: center;
          height: var(--pill-h, 48px);
          width: 82.5625px;
          border-radius: 8px;
          background: #3E3E3E;
          border: 1px solid rgba(255,255,255,.12);
          color: #e8e8e8;
          font-size: 13px; line-height: 28px; font-weight: 300;
          white-space: nowrap;
          cursor: pointer;
          transition: border-color .15s ease;
        }
        .dock__pill:hover,
        .dock__pill:focus-visible{ outline: none; border-color: #8f8f8f; }
        .dock__pill.is-active{ border-color: #ffffff; }

        /* белая кнопка справа */
        .dock__cta{
          position: relative;
          left: -6px;
          display: grid; place-items: center;
          width: calc(var(--dock-right-btn) - 3px);
          height: 60px;
          box-sizing: border-box;
          border-radius: 8px;
          background: #e9e9e9;
          color: #111;
          border: none;
          text-decoration: none;
          font-size: 13px; line-height: 28px; font-weight: 600;
          cursor: pointer;
          transition: background-color .18s ease;
        }
        .dock__cta:hover{ background: #dcdcdc; }
        .dock__cta:active{ background: #d5d5d5; }

        /* ===== режим legal ===== */
        .dock.is-legal .dock__group{ width: var(--dock-group-w); }
        .dock.is-legal .dock__cta{ display: none; }

        /* ===== компактные режимы: ровная рамка 6px со всех сторон (как на главной) ===== */
        .dock.is-electro,
        .dock.is-contact{ padding: 6px; }
        /* в компактных режимах убираем сдвиг главной (иначе рамка кривая) */
        .dock.is-electro a.dock__brand,
        .dock.is-contact a.dock__brand{ left: 0; }
        .dock.is-electro .dock__inner{
          grid-template-columns: var(--dock-left-tile) auto;  /* c. + кнопка рядом */
          column-gap: 6px;
        }
        .dock.is-electro .dock__group{ display: none; }
        .dock.is-electro .electro-cta{
          width: 121px; height: 60px;
          display: inline-grid; place-items: center;
          background: #FA5D29; color: #000;
          border: 1px solid #FA5D29; border-radius: 6px;
          font-weight: 600; text-decoration: none; white-space: nowrap;
        }
        .dock.is-electro .electro-cta:hover{ filter: brightness(0.96); }
        .dock.is-electro .electro-cta:active{ filter: brightness(0.92); }

        /* ===== страница «Контакты»: только плитка c. на прозрачной плашке ===== */
        .dock.is-contact .dock__inner{
          grid-template-columns: var(--dock-left-tile);
        }

        /* ===== режим аккаунта: c. + профиль (имя с подчёркиванием) + Настройки ===== */
        .dock.is-account{ width: auto; padding: 6px; }
        .dock.is-account a.dock__brand{ left: 0; }
        .dock.is-account .dock__inner{
          grid-template-columns: var(--dock-left-tile) auto auto;  /* c. + имя + Настройки */
          column-gap: 6px;
          width: auto;
        }
        .dock.is-account .dock__profile{
          display: inline-flex; align-items: center; gap: 12px;
          height: 60px; padding: 0 18px 0 12px;
          border-radius: 10px;
          background: #3E3E3E;            /* графитовая плашка как у пилюль */
          color: #e8e8e8; text-decoration: none;
          font-size: 14px; font-weight: 400; white-space: nowrap;
        }
        .dock.is-account .dock__profile-avatar{
          width: 36px; height: 36px; border-radius: 9999px; object-fit: cover; flex: 0 0 auto;
        }
        .dock.is-account .dock__profile-name{ position: relative; padding-bottom: 3px; }
        .dock.is-account .dock__profile-name::before{
          content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
          background: rgba(255,255,255,.28);
        }
        .dock.is-account .dock__profile-name::after{
          content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 0;
          background: #fff; transition: width .3s ease;
        }
        .dock.is-account .dock__profile:hover .dock__profile-name::after{ width: 100%; }
        .dock.is-account .dock__settings{
          display: inline-grid; place-items: center;
          height: 60px; padding: 0 18px;
          border-radius: 8px;
          background: #aceec4; color: #111;
          border: none; text-decoration: none; white-space: nowrap;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: filter .18s ease;
        }
        .dock.is-account .dock__settings:hover{ filter: brightness(0.96); }
        .dock.is-account .dock__settings:active{ filter: brightness(0.92); }
      `}</style>
    </div>
  );
}
