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
 * Прелоадер + тёплый прогрев ассетов для Services.
 * onReady вызывается, когда: (всё загружено) И (прошло minMs).
 */
export default function Preloader({ onReady, minMs = 1200 }) {
  const calledRef = useRef(false);

  // На время прелоадера блокируем скролл
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Прелоад + тёплый прогрев
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

// 2) <link rel="preload"> для SVG: без недопустимого as=document
// Достаточно as: "image" — валидно и без предупреждений.
ICON_SVGS.forEach((href) => {
  try { addLink({ rel: "preload", as: "image", href, type: "image/svg+xml" }); } catch {}
});


    // 3) Тёплый прогрев: реальная загрузка тех же ресурсов
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

    // — ключевое место: именно <object type="image/svg+xml"> —
    // это прогревает парсинг <animate> и т.п. до появления Services.
    const svgPromises = ICON_SVGS.map(
      (src) =>
        new Promise((resolve) => {
          const obj = document.createElement("object");
          obj.type = "image/svg+xml";
          obj.data = src;
          obj.width = 1;
          obj.height = 1;
          obj.onload = obj.onerror = () => resolve();
          holder.appendChild(obj);
        })
    );

    // Минимальная длительность прелоадера (чтобы не мигал)
    const minDelay = new Promise((res) => setTimeout(res, minMs));

    Promise.all([...imgPromises, minDelay]).then(() => {
      if (cancelled) return;
      cleanup();
      if (!calledRef.current) {
        calledRef.current = true;
        onReady && onReady();
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
        {/* 8 точек по кругу */}
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ ["--i"]: i }} />
        ))}
      </div>
    </div>
  );
}
