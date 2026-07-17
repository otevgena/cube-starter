// src/components/common/Toast.jsx
// Глобальные всплывающие подсказки (тосты) в фирменном стиле КУБ — тёмная
// скруглённая плашка снизу по центру. Вызов из любого места: toast("Текст")
// или toast("Текст", { tone: "error" }). Хост монтируется один раз в App.
import React from "react";
import { createPortal } from "react-dom";

const EVT = "cube:toast";
let _seq = 0;

export function toast(message, opts = {}) {
  try {
    window.dispatchEvent(new CustomEvent(EVT, { detail: { message: String(message || ""), ...opts } }));
  } catch {}
}

export default function ToastHost() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const on = (e) => {
      const d = e.detail || {};
      if (!d.message) return;
      const id = ++_seq;
      const ttl = d.ttl || 3200;
      setItems((xs) => [...xs.slice(-3), { id, message: d.message, tone: d.tone || "default" }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), ttl);
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      aria-live="polite"
      style={{ position: "fixed", left: 0, right: 0, bottom: 30, zIndex: 2147483600, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, pointerEvents: "none", padding: "0 16px" }}
    >
      <style>{`@keyframes cubeToastIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            pointerEvents: "auto",
            maxWidth: "min(92vw, 480px)",
            background: t.tone === "error" ? "#1f1210" : "#161616",
            color: "#fff",
            fontFamily: "'Inter Tight','Inter',system-ui",
            fontSize: 14.5,
            fontWeight: 500,
            lineHeight: 1.4,
            padding: "13px 22px",
            borderRadius: 14,
            boxShadow: "0 14px 38px rgba(0,0,0,.30)",
            border: t.tone === "error" ? "1px solid rgba(250,93,41,.55)" : "1px solid rgba(255,255,255,.08)",
            animation: "cubeToastIn .22s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
