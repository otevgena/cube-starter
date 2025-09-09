// src/components/blocks/Services.jsx
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

/* =========================
   PRELOAD / WARM-UP HELPERS
   ========================= */

/** Кладём <link rel="preload"> в <head> для картинок и SVG-объектов. */
function useHeadPreload({ images = [], svgDocs = [] }) {
  React.useEffect(() => {
    const head = document.head;
    const added = [];

    const add = (attrs) => {
      const l = document.createElement("link");
      Object.entries(attrs).forEach(([k, v]) => (l[k] = v));
      head.appendChild(l);
      added.push(l);
    };

    images.forEach((href) => {
      try { add({ rel: "preload", as: "image", href }); } catch {}
    });

    svgDocs.forEach((href) => {
      try {
        add({ rel: "preload", as: "document", href, type: "image/svg+xml" });
        const pf = document.createElement("link");
        pf.rel = "prefetch";
        pf.href = href;
        document.head.appendChild(pf);
        added.push(pf);
      } catch {}
    });

    return () => { added.forEach((el) => el.parentNode && el.parentNode.removeChild(el)); };
  }, [images, svgDocs]);
}

/** Тёплый прогрев SVG-объектов (как document) */
function WarmSVGObjects({ svgs, batch = 4, delay = 60 }) {
  const [mounted, setMounted] = React.useState([]);
  React.useEffect(() => {
    let i = 0, cancel = false;
    const step = () => {
      if (cancel || i >= svgs.length) return;
      setMounted((p) => p.concat(svgs.slice(i, i + batch)));
      i += batch;
      if ("requestIdleCallback" in window) requestIdleCallback(step, { timeout: 200 });
      else setTimeout(step, delay);
    };
    const kickoff = () => step();
    if (document.readyState === "complete") kickoff();
    else window.addEventListener("load", kickoff, { once: true });
    return () => { cancel = true; window.removeEventListener("load", kickoff); };
  }, [svgs, batch, delay]);

  return (
    <div aria-hidden="true" style={{ position:"fixed", left:-9999, top:-9999, width:1, height:1, opacity:0, pointerEvents:"none", overflow:"hidden" }}>
      {mounted.map((src) => (
        <object key={src} data={src} type="image/svg+xml" width={1} height={1} tabIndex={-1} title="" aria-hidden="true" />
      ))}
    </div>
  );
}

function PreloadServicesAssets({ images, svgDocs }) {
  useHeadPreload({ images, svgDocs });
  return <WarmSVGObjects svgs={svgDocs} />;
}

/* =========================
   ОСНОВНОЙ КОМПОНЕНТ
   ========================= */

export default function Services() {
  const SERVICES = [
    { key: "electrical",   title: "Электромонтаж",        img: "/services/electrical.png" },
    { key: "low_current",  title: "Слаботочные системы",  img: "/services/low_current_systems.png" },
    { key: "ventilation",  title: "Климат-системы",       img: "/services/ventilation.png" },
    { key: "design",       title: "Проектирование",       img: "/services/design.png" },
    { key: "construction", title: "Общестрой",            img: "/services/construction.png" },
  ];

  const ICON_SVGS = [
    "/services/icon/thumbs_up.svg",
    "/services/icon/calendar.svg",
    "/services/icon/graduation_hat.svg",
    "/services/icon/phone.svg",
    "/services/icon/lock.svg",
    "/services/icon/list.svg",
    "/services/icon/drop.svg",
    "/services/icon/clock.svg",
    "/services/icon/bolt.svg",
    "/services/icon/expand.svg",
    "/services/icon/doc.svg",
    "/services/icon/bulb.svg",
    "/services/icon/home.svg",
    "/services/icon/clock2.svg",
    "/services/icon/tool.svg",
  ];

  // GIF на букве «И»
  const GIF_SIZE = 120, GIF_X = 39, GIF_Y = -34;
  const gifPos = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: `translate(calc(-50% + ${GIF_X}px), calc(-50% + ${GIF_Y}px))`,
    pointerEvents: "none",
    userSelect: "none",
    width: `${GIF_SIZE}px`,
    height: "auto",
    maxWidth: "none",
    maxHeight: "none",
    zIndex: 2,
    display: "block",
  };

  return (
    <section
      id="services"
      className="bg-page"
      style={{
        position: "relative",
        zIndex: 2,
        marginTop: "255px",
        paddingTop: 0,
        paddingBottom: "96px",
        backgroundColor: "#e9e9e9",
      }}
      data-section="services"
    >
      <PreloadServicesAssets images={SERVICES.map((s) => s.img)} svgDocs={ICON_SVGS} />

      {/* Заголовок по центру + GIF на «И» */}
      <div className="container-wide" style={{ position: "relative" }}>
        <div style={{ textAlign: "center", fontFamily: "'Inter Tight','Inter',system-ui" }}>
          <h2
            className="about-hero-title"
            style={{ margin: 0, textTransform: "uppercase", fontWeight: 600, position: "relative", display: "inline-block" }}
          >
            УСЛУГ
            <span style={{ position: "relative", display: "inline-block" }}>
              И
              <img src="/services/hammer_chisel_logo.gif" alt="" style={gifPos} />
            </span>
          </h2>
        </div>
      </div>

      {/* Левый вводный блок — 52px от левого края */}
      <div
        style={{
          marginTop: "30px",
          paddingLeft: "52px",
          textAlign: "left",
          fontFamily: "'Inter Tight','Inter',system-ui",
          color: "#222222",
        }}
      >
        <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, margin: 0 }}>
          Технологии под задачу
        </div>
        <h3 style={{ marginTop: 14, marginBottom: 0, fontSize: 43, lineHeight: "51.8901px", fontWeight: 600 }}>
          Делегируйте всё
        </h3>
        <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: 43, lineHeight: "51.8901px", fontWeight: 600 }}>
          — оставьте себе контроль.
        </h3>
      </div>

      {/* Сетка карточек */}
      <div className="container-wide">
        <div
          style={{
            marginTop: "78px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 467px)",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          {SERVICES.map((s, idx) => {
            const isFirst  = idx === 0;
            const isSecond = idx === 1;
            const isThird  = idx === 2;
            const isFourth = idx === 3;
            const isFifth  = idx === 4;

            const isElectrical = s.key === "electrical";
            const electricalTo = "/services/electrical";

            return (
              <article
                key={s.key}
                style={{
                  width: 467,
                  height: 537,
                  background: "#fefefe",
                  borderRadius: 14,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Верхнее изображение.
                    Для электромонтажа — SPA-оверлей из SpaLink (без перезагрузки).
                    Для остальных — заглушка с preventNav (пока страниц нет). */}
                <div style={{ width: "100%", height: 263, position: "relative" }}>
                  <ServiceImageBase img={s.img} title={s.title} eager={idx < 3} />
                  {isElectrical ? (
                    <SpaLink
                      to={electricalTo}
                      ariaLabel={s.title}
                      title={s.title}
                      className="block"
                      style={{ position: "absolute", inset: 0, zIndex: 3, cursor: "pointer" }}
                    />
                  ) : (
                    <a
                      href={`/${s.key}`}
                      onClick={(e)=>e.preventDefault()}
                      aria-label={s.title}
                      title={s.title}
                      style={{ position: "absolute", inset: 0, zIndex: 3, display: "block", cursor: "not-allowed" }}
                    />
                  )}
                </div>

                {/* Заголовок 129px — слева */}
                <div
                  style={{
                    height: 129,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "0 20px",
                    textAlign: "left",
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 28,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      fontFamily: "'Inter Tight','Inter',system-ui",
                      color: "#111",
                    }}
                  >
                    {s.title}
                  </h4>
                </div>

                {/* Средняя полоса: «Подробно» */}
                {(isFirst || isSecond || isThird || isFourth || isFifth) ? (
                  <div
                    style={{
                      height: 58,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 20px",
                      borderTop: "1px solid #e9e9e9",
                      borderBottom: "1px solid #e9e9e9",
                      boxSizing: "border-box",
                    }}
                  >
                    {isElectrical ? (
                      <SpaLink
                        to={electricalTo}
                        className="about-hero-role"
                        style={{
                          fontSize: 16,
                          lineHeight: "24px",
                          fontWeight: 600,
                          textDecorationLine: "underline",
                          textDecorationThickness: "2px",
                          textUnderlineOffset: 4,
                          textDecorationColor: "#fbbf24",
                          color: "#111",
                        }}
                      >
                        Подробно
                      </SpaLink>
                    ) : (
                      <a
                        href={`/#services-${s.key}`}
                        className="about-hero-role"
                        style={{
                          fontSize: 16,
                          lineHeight: "24px",
                          fontWeight: 600,
                          textDecorationLine: "underline",
                          textDecorationThickness: "2px",
                          textUnderlineOffset: 4,
                          textDecorationColor: "#fbbf24",
                          color: "#111",
                        }}
                        onClick={(e)=>e.preventDefault()}
                      >
                        Подробно
                      </a>
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
                      <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div
                    style={{
                      height: 58,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 20px",
                      fontFamily: "'Inter Tight','Inter',system-ui",
                      color: "#111",
                      borderTop: "1px solid #e9e9e9",
                      borderBottom: "1px solid #e9e9e9",
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300 }}>Услуги</span>
                    <span style={{ fontSize: 16, lineHeight: "24px", fontWeight: 600 }}>5</span>
                  </div>
                )}

                {/* Нижняя полоса (85px): иконки по блокам */}
                {isFirst ? (
                  <div style={iconsRowStyle}>
                    <IconItemHoverPlay src="/services/icon/thumbs_up.svg"   labelTop="Долговечный"   labelBottom="результат"   speedMult={1.5} offsetStartSec={0.3} />
                    <IconItemHoverPlay src="/services/icon/calendar.svg"     labelTop="Планирование"  labelBottom="этапов"      speedMult={1.5} offsetStartSec={1.8} />
                    <IconItemHoverPlay src="/services/icon/graduation_hat.svg" labelTop="Профессиональная" labelBottom="команда" speedMult={1.5} offsetStartSec={0.3} />
                  </div>
                ) : isSecond ? (
                  <div style={iconsRowStyle}>
                    <IconItemHoverPlay src="/services/icon/phone.svg" labelTop="Надёжная" labelBottom="связь" speedMult={1.5} offsetStartSec={0.1} />
                    <IconItemHoverPlay src="/services/icon/lock.svg"  labelTop="Безопасность" labelBottom="объекта" speedMult={1.5} offsetStartSec={0.1} />
                    <IconItemHoverPlay src="/services/icon/list.svg"  labelTop="Интеграция" labelBottom="систем" speedMult={1.5} offsetStartSec={0.1} />
                  </div>
                ) : isThird ? (
                  <div style={iconsRowStyle}>
                    <IconItemHoverPlay src="/services/icon/drop.svg"  labelTop="Эффективное" labelBottom="охлаждение" speedMult={1.5} offsetStartSec={0.1} />
                    <IconItemHoverPlay src="/services/icon/clock.svg" labelTop="Свежий" labelBottom="воздух" speeMult={1.5} offsetStartSec={1.8} />
                    <IconItemHoverPlay src="/services/icon/bolt.svg"  labelTop="Экономия" labelBottom="ресурсов" speedMult={1.5} offsetStartSec={1.6} />
                  </div>
                ) : isFourth ? (
                  <div style={iconsRowStyle}>
                    <IconItemHoverPlay src="/services/icon/expand.svg" labelTop="Точные" labelBottom="расчёты" speedMult={1.5} offsetStartSec={1.7} />
                    <IconItemHoverPlay src="/services/icon/doc.svg"    labelTop="Соответствие" labelBottom="нормам" speedMult={1.5} offsetStartSec={0.0} />
                    <IconItemHoverPlay src="/services/icon/bulb.svg"   labelTop="Оптимальные" labelBottom="решения" speedMult={1.5} offsetStartSec={0.1} />
                  </div>
                ) : isFifth ? (
                  <div style={iconsRowStyle}>
                    <IconItemHoverPlay src="/services/icon/home.svg"  labelTop="Надёжное" labelBottom="строительство" speedMult={1.5} offsetStartSec={1.7} />
                    <IconItemHoverPlay src="/services/icon/clock2.svg" labelTop="Соблюдение" labelBottom="сроков" speedMult={1.5} offsetStartSec={1.7} />
                    <IconItemHoverPlay src="/services/icon/tool.svg"  labelTop="Качество" labelBottom="работ" speedMult={1.5} offsetStartSec={1.7} />
                  </div>
                ) : (
                  <div style={{ height: 85, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
                    <a
                      href={`/#services-${s.key}`}
                      className="about-hero-role"
                      style={{ fontSize: 16, lineHeight: "24px", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4, textDecorationThickness: "2px", textDecorationColor: "#fbbf24", color: "#111" }}
                      onClick={(e)=>e.preventDefault()}
                    >
                      Подробно
                    </a>
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
                      <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Центр страницы: как в About → "Каждая деталь имеет Значение" */}
      <div
        style={{
          marginTop: "108px",
          marginLeft: "80px",
          marginRight: "80px",
          textAlign: "center",
          fontFamily: "'Inter Tight','Inter',system-ui",
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: 300,
          color: "#222",
        }}
      >
        <span>Каждая деталь имеет </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", verticalAlign: "middle" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
            <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <a href="#value" className="about-hero-role" style={{ fontSize: "16px", lineHeight: "24px", fontWeight: 600, textDecoration: "underline" }} onClick={(e) => e.preventDefault()}>
            Значение
          </a>
        </span>
      </div>
    </section>
  );
}

/* ——— Блок изображения карточки с затемнением и ховером (без <a> внутри) ——— */
function ServiceImageBase({ img, title, eager = false }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f0f0f0" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={img}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 200ms ease",
          transform: hover ? "scale(1.02)" : "none",
        }}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchpriority={eager ? "high" : undefined}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          opacity: hover ? 1 : 0,
          transition: "opacity 200ms ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ——— стили строки с иконками ——— */
const iconsRowStyle = {
  height: 85,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 20,
  padding: "0 20px",
  overflow: "hidden",
};

/** === Иконка: стоп-кадр на offset; ховер → ускоренно доигрываем; нельзя прервать === */
function IconItemHoverPlay({
  src,
  labelTop,
  labelBottom,
  size = 22,
  speedMult = 1.5,
  offsetStartSec = 0.0,
}) {
  const objRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const durSecRef = React.useRef(2);
  const playingRef = React.useRef(false);

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  React.useEffect(() => {
    const obj = objRef.current;
    if (!obj) return;

    const onLoad = () => {
      try {
        const doc = obj.getSVGDocument ? obj.getSVGDocument() : obj.contentDocument;
        const svg = doc && doc.documentElement;
        if (!svg) return;

        const anim = doc.querySelector('animate[dur], animateTransform[dur]');
        if (anim) {
          const val = anim.getAttribute('dur') || '2s';
          const n = parseFloat(String(val).replace(/s$/i, ''));
          if (!Number.isNaN(n) && n > 0.01) durSecRef.current = n;
        }

        const eps = 1e-4;
        const offset = clamp(offsetStartSec, 0, Math.max(0, durSecRef.current - eps));
        svg.pauseAnimations && svg.pauseAnimations();
        svg.setCurrentTime && svg.setCurrentTime(offset);
      } catch {}
    };

    obj.addEventListener('load', onLoad);
    return () => obj.removeEventListener('load', onLoad);
  }, [offsetStartSec]);

  const playOnce = React.useCallback(() => {
    if (playingRef.current) return;
    const obj = objRef.current;
    if (!obj) return;

    try {
      const doc = obj.getSVGDocument ? obj.getSVGDocument() : obj.contentDocument;
      const svg = doc && doc.documentElement;
      if (!svg) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const eps = 1e-4;
      const dur = Math.max(eps, durSecRef.current);
      const startT = clamp(offsetStartSec, 0, dur - eps);
      const spanSec = Math.max(eps, dur - startT);
      const totalMs = (spanSec * 1000) / Math.max(0.1, speedMult);

      svg.pauseAnimations && svg.pauseAnimations();
      svg.setCurrentTime && svg.setCurrentTime(startT);

      playingRef.current = true;
      const t0 = performance.now();

      const step = (now) => {
        const elapsed = now - t0;
        const t = clamp(startT + (elapsed / 1000) * speedMult, 0, dur - eps);
        try { svg.setCurrentTime && svg.setCurrentTime(t); } catch {}

        if (elapsed >= totalMs) {
          try {
            svg.setCurrentTime && svg.setCurrentTime(startT);
            svg.pauseAnimations && svg.pauseAnimations();
          } catch {}
          playingRef.current = false;
          rafRef.current = 0;
          return;
        }
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    } catch {}
  }, [speedMult, offsetStartSec]);

  React.useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); playingRef.current = false; };
  }, []);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "default" }}>
      <object
        ref={objRef}
        data={src}
        type="image/svg+xml"
        width={size}
        height={size}
        style={{ display: "block", pointerEvents: "auto", cursor: "pointer" }}
        onMouseEnter={playOnce}
        aria-label=""
      >
        <img src={src} alt="" width={size} height={size} style={{ display: "block" }} />
      </object>

      <div
        style={{
          fontFamily: "'Inter Tight','Inter',system-ui",
          fontSize: 13,
          lineHeight: "16px",
          fontWeight: 300,
          color: "#111",
          maxHeight: 32,
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        <div style={{ whiteSpace: "nowrap" }}>{labelTop}</div>
        <div style={{ whiteSpace: "nowrap" }}>{labelBottom}</div>
      </div>
    </div>
  );
}
