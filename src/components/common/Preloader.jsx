// src/components/common/Preloader.jsx
import React, { useEffect, useRef } from "react";

/** Картинки карточек Services (обычные <img>) */
const SERVICES_IMAGES = [
  "/services/electrical.png",
  "/services/low_current_systems.png",
  "/services/ventilation.png",
  "/services/design.png",
  "/services/construction.png",
];

/** Иконки для нижних полос карточек (грузятся через <object>) */
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

/**
 * Прелоадер для ГЛАВНОЙ: всегда показывается на / (каждый визит),
 * блокирует скролл, прогревает ассеты, по завершении диспатчит "preloader:done".
 */
export default function Preloader({ onReady, minMs = 1200 }) {
  // показываем ТОЛЬКО на главной
  const isHome = (() => {
    try { return (window.location.pathname || "/") === "/"; }
    catch { return false; }
  })();
  if (!isHome) return null;

  const calledRef = useRef(false);

  // Блокируем скролл на время прелоадера
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("no-scroll", "preloader-active");
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("no-scroll", "preloader-active");
    };
  }, []);

  // Прелоад + «тёплый» прогрев
  useEffect(() => {
    let cancelled = false;
    const addedLinks = [];
    const holder = document.createElement("div");
    holder.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;";
    document.body.appendChild(holder);

    const addLink = (attrs) => {
      const l = document.createElement("link");
      Object.entries(attrs).forEach(([k, v]) => (l[k] = v));
      document.head.appendChild(l);
      addedLinks.push(l);
    };

    // 1) <link rel="preload"> для изображений
    SERVICES_IMAGES.forEach((href) => {
      try { addLink({ rel: "preload", as: "image", href }); } catch {}
    });

    // 2) <link rel="preload"> для SVG (как image)
    ICON_SVGS.forEach((href) => {
      try { addLink({ rel: "preload", as: "image", href, type: "image/svg+xml" }); } catch {}
    });

    // 3) Реальная загрузка изображений (ждём)
    const imgPromises = SERVICES_IMAGES.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = img.onerror = () => resolve();
          img.src = src;
          holder.appendChild(img);
        })
    );

    // Прогрев парсинга SVG через <object> (не ждём)
    ICON_SVGS.forEach((src) => {
      const obj = document.createElement("object");
      obj.type = "image/svg+xml";
      obj.data = src;
      obj.width = 1;
      obj.height = 1;
      obj.onload = obj.onerror = () => {};
      holder.appendChild(obj);
    });

    // Минимальная длительность показа, чтобы не мигал
    const minDelay = new Promise((res) => setTimeout(res, minMs));

    Promise.all([...imgPromises, minDelay]).then(() => {
      if (cancelled) return;
      cleanup();

      if (!calledRef.current) {
        calledRef.current = true;
        try { onReady && onReady(); } catch {}
        try { window.dispatchEvent(new CustomEvent("preloader:done")); } catch {}
      }
    });

    function cleanup() {
      try { holder.remove(); } catch {}
      addedLinks.forEach((el) => { try { el.remove(); } catch {} });
    }

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [onReady, minMs]);

  return (
    <div className="preloader" role="status" aria-label="Загрузка">
      <div className="preloader__spinner">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ ["--i"]: i }} />
        ))}
      </div>

      {/* локальные стили */}
      <style>{`
        .preloader{
          position: fixed; inset: 0; z-index: 2147483647;
          background: var(--bg-page, #f8f8f8);
          display: flex; align-items: center; justify-content: center;
        }
        .preloader__spinner{
          position: relative; width: 64px; height: 64px;
          animation: preloader-spin 2s linear infinite;
          will-change: transform;
        }
        .preloader__spinner span{
          --dot-size: 2px; --radius: 18px;
          position: absolute; top: 50%; left: 50%;
          width: var(--dot-size); height: var(--dot-size);
          margin: calc(var(--dot-size)/-2) 0 0 calc(var(--dot-size)/-2);
          border-radius: 50%; background: #7a7a7a;
          transform:
            rotate(calc(var(--i) * 45deg))
            translate(var(--radius))
            rotate(calc(var(--i) * -45deg));
        }
        @keyframes preloader-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce){
          .preloader__spinner{ animation: none; }
        }
      `}</style>
    </div>
  );
}
