// src/components/reviews/ReviewPopup.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as ReactDOMLegacy from "react-dom";

function ReviewPopupInner({
  imageSrc,
  fallbackSrc,
  name = "",
  company = "",
  date = "",
  city = "",
  onClose,
  backdropOpacity = 0.55,
}) {
  const [src, setSrc] = useState(imageSrc);

  // ESC закрывает
  useEffect(() => {
    const onKey = (e) => { if ((e.key || "").toLowerCase() === "escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Лок скролла без «прыжка» — как в Modal.jsx
  useEffect(() => {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top:      document.body.style.top,
      width:    document.body.style.width,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top      = `-${scrollY}px`;
    document.body.style.width    = "100%";
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      const top = document.body.style.top;
      document.body.style.top      = prev.top;
      document.body.style.width    = prev.width;
      const y = Math.max(0, parseInt((top || "0").replace("px",""), 10) * -1);
      window.scrollTo(0, y);
    };
  }, []);

  return (
    <div
      className="review-modal-root"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
      style={{ ["--backdrop-alpha"]: backdropOpacity }}
    >
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Верх: изображение */}
        <div className="review-modal-img">
          <img
            src={src}
            alt="Скан отзыва"
            onError={() => fallbackSrc && setSrc(fallbackSrc)}
          />
        </div>

        {/* Низ: таблица как в Project.jsx */}
        <div className="review-modal-meta">
          <div className="row header">
            <span>Имя клиента</span>
            <span>Компания</span>
            <span>Дата</span>
            <span>Город</span>
          </div>
          <div className="dotted" />
          <div className="row data">
            <span>{name}</span>
            <span>{company}</span>
            <span>{date}</span>
            <span>{city}</span>
          </div>
          <div className="dotted" />
        </div>
      </div>

      {/* «Ромбик» с крестиком — как в Modal.jsx (внизу справа) */}
      <button
        type="button"
        className="review-modal-close-tile"
        aria-label="Закрыть"
        title="Закрыть"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <style>{`
        .review-modal-root{
          position: fixed; inset: 0; z-index: 2000;
          display: grid; place-items: center;
          background: rgba(0,0,0,var(--backdrop-alpha, .55)); /* ← прозрачность как в Modal.jsx */
          animation: r-fade .15s ease-out;
          padding: 24px;
        }
        .review-modal-card{
          width: min(1200px, calc(100vw - 48px));
          max-height: calc(100vh - 48px);
          background: #ffffff; color: #111;
          border: 1px solid #dcdcdc;
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,.35);
          overflow: hidden;
          transform: translateY(4px);
          animation: r-pop .18s ease-out forwards;
          display: flex; flex-direction: column;
        }
        .review-modal-img{
          background:#111;
          max-height: 72vh;
          display:grid; place-items:center;
          border-bottom: 1px dashed #000; /* как в Project.jsx */
        }
        .review-modal-img img{
          width:100%; height:auto; display:block;
        }
        .review-modal-meta{
          padding: 14px 18px;
          font-family: 'Inter Tight','Inter',system-ui;
        }
        .review-modal-meta .row{
          display:grid;
          grid-template-columns: 1.6fr 1.4fr 0.9fr 0.9fr;
          align-items:center;
          min-height: 48px;
        }
        .review-modal-meta .row.header{
          font-size:14px; font-weight:400; color:#222;
        }
        .review-modal-meta .row.data{
          font-size:18px; font-weight:400; color:#111;
        }
        .review-modal-meta .dotted{
          width:100%; height:1px;
          background-image: repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px);
        }

        /* Ромбик-плитка снизу справа — копия стилей из Modal.jsx с префиксом */
        .review-modal-close-tile{
          position: fixed;
          right: 24px;
          bottom: calc(
            var(--dock-bottom, 21px)
            + (var(--dock-h, 72px)) / 2
          );
          width: var(--dock-left-tile, 60px);
          height: var(--dock-left-tile, 60px);
          display: grid; place-items: center;
          color: #fff; background: #111; border: 1px solid #111;
          border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
          cursor: pointer; transition: transform .15s ease, background .15s ease;
          z-index: 2001;
        }
        .review-modal-close-tile:hover{ transform: translateY(-1px); background:#0a0a0a; }
        .review-modal-close-tile:active{ transform: translateY(0); }

        @keyframes r-fade { from{opacity:0} to{opacity:1} }
        @keyframes r-pop  { to{ transform: none } }
      `}</style>
    </div>
  );
}

/* ===== Публичный компонент (если хочешь рендерить как <ReviewPopup ... />) ===== */
export default function ReviewPopup(props){
  if (!props?.onClose) return null; // для безопасного использования как компонента
  return createPortal(<ReviewPopupInner {...props} />, document.body);
}

/* ===== Статическое API для программного открытия из Reviews.jsx ===== */
ReviewPopup.open = function openReviewPopup(payload = {}, opts = {}) {
  const el = document.createElement("div");
  document.body.appendChild(el);

  const close = () => {
    // React 18+
    if (root && typeof root.unmount === "function") root.unmount();
    // React 17-
    else if (ReactDOMLegacy && ReactDOMLegacy.unmountComponentAtNode) {
      ReactDOMLegacy.unmountComponentAtNode(el);
    }
    el.remove();
  };

  const node = (
    <ReviewPopupInner
      {...payload}
      backdropOpacity={opts.backdropOpacity ?? 0.55}
      onClose={close}
    />
  );

  let root = null;
  if (ReactDOMClient && typeof ReactDOMClient.createRoot === "function") {
    root = ReactDOMClient.createRoot(el);
    root.render(node);
  } else {
    // React 17-
    ReactDOMLegacy.render(node, el);
  }
};
