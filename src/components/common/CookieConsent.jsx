// src/components/common/CookieConsent.jsx
// Брендовая карточка согласия на cookie в стиле КУБ — компактная, в правом нижнем углу,
// в одной палитре со стик-доком (графитовая плашка, пилюле-кнопки). Показывается один раз
// (пока не выбрано «Принять»/«Отклонить»); выбор хранится в localStorage.
// Метрика (Яндекс) подключается ТОЛЬКО после «Принять» — см. src/lib/metrika.js.
import React from "react";
import { createPortal } from "react-dom";
import { hasDecision, grantConsent, denyConsent, METRIKA_ENABLED } from "@/lib/metrika.js";

const UI = "'Inter Tight', Inter, system-ui";

export default function CookieConsent() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!METRIKA_ENABLED) return; // выключено — баннер не показываем
    try { if (!hasDecision()) setShow(true); } catch {}
  }, []);

  const decide = React.useCallback((fn) => {
    try { fn(); } catch {}
    setShow(false);
  }, []);

  const goCookies = (e) => {
    e.preventDefault();
    try {
      window.history.pushState({}, "", "/legal/cookies");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {}
  };

  if (typeof document === "undefined" || !show) return null;

  // Кнопки-пилюли как в стик-доке (графит #3E3E3E, светлая рамка). Без морковного.
  const pillBase = {
    appearance: "none", cursor: "pointer", fontFamily: UI,
    fontSize: 13, lineHeight: "16px",
    padding: "9px 14px", borderRadius: 8,
    background: "#3E3E3E", color: "#eaeaea",
    transition: "border-color .15s ease",
    whiteSpace: "nowrap",
  };

  return createPortal(
    <div className="cube-cc" style={{ fontFamily: UI }}>
      <style>{`
        @keyframes cubeCcIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .cube-cc__card{
          position: fixed; right: 20px; bottom: 22px; z-index: 2147483600;
          width: 270px; max-width: calc(100vw - 24px);
          background: rgba(69,69,69,.58);
          backdrop-filter: saturate(115%) blur(6px);
          -webkit-backdrop-filter: saturate(115%) blur(6px);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
          padding: 14px;
        }
        @media (max-width: 640px){
          .cube-cc__card{ right: 12px; left: 12px; bottom: 88px; width: auto; }
        }
      `}</style>

      <div
        className="cube-cc__card"
        role="dialog"
        aria-live="polite"
        aria-label="Согласие на использование cookie"
        style={{ animation: "cubeCcIn .28s cubic-bezier(.2,.8,.2,1)" }}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => setShow(false)}
          style={{
            position: "absolute", top: 8, right: 8,
            width: 20, height: 20, display: "grid", placeItems: "center",
            appearance: "none", cursor: "pointer",
            background: "transparent", border: "none", color: "#a3a3a3",
            borderRadius: 6, transition: "color .14s ease",
            fontSize: 12, lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#a3a3a3"; }}
        >
          ✕
        </button>

        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", paddingRight: 18 }}>
          Файлы cookie
        </div>

        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.3, color: "#e6e6e6", fontWeight: 300 }}>
          Используем cookie и Яндекс&nbsp;Метрику, чтобы сайт работал стабильно и удобнее.
          Аналитика — только с вашего согласия.{" "}
          <a
            href="/legal/cookies"
            onClick={goCookies}
            style={{ color: "#fff", textDecoration: "underline", textUnderlineOffset: 3, whiteSpace: "nowrap" }}
          >
            Подробнее
          </a>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => decide(grantConsent)}
            style={{ ...pillBase, flex: 1, fontWeight: 500, color: "#fff", border: "1px solid #ffffff", transition: "background .15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#141414"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#3E3E3E"; e.currentTarget.style.color = "#fff"; }}
          >
            Принять
          </button>
          <button
            type="button"
            onClick={() => decide(denyConsent)}
            style={{ ...pillBase, fontWeight: 300, border: "1px solid rgba(255,255,255,.12)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8f8f8f"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; }}
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
