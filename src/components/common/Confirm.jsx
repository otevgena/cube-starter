// src/components/common/Confirm.jsx
// Единый брендовый диалог подтверждения КУБ вместо нативного window.confirm().
// Вызов из любого места — промис:
//   if (await confirmDialog("Удалить проект из витрины?")) removeProject(id);
//   await confirmDialog({ title, message, confirmText, cancelText, tone })
// tone: "danger" (карровая кнопка, по умолчанию) | "default" (тёмная кнопка).
// Хост монтируется один раз в App (<ConfirmHost/>). Esc — отмена, Enter — подтвердить.
import React from "react";
import { createPortal } from "react-dom";

const OPEN_EVT = "cube:confirm";
const UI = "'Inter Tight','Inter',system-ui";
const CARROT = "#FA5D29";

let _seq = 0;
const _resolvers = new Map();

function normalize(o = {}) {
  if (typeof o === "string") o = { message: o };
  return {
    title: o.title || "Подтвердите действие",
    message: o.message || "",
    confirmText: o.confirmText || "Удалить",
    cancelText: o.cancelText || "Отмена",
    tone: o.tone || "danger",
  };
}

// Открыть диалог. Возвращает Promise<boolean>: true — подтвердил, false — отменил/закрыл.
export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(false); return; }
    const id = ++_seq;
    _resolvers.set(id, resolve);
    try {
      window.dispatchEvent(new CustomEvent(OPEN_EVT, { detail: { id, ...normalize(opts) } }));
    } catch {
      _resolvers.delete(id);
      resolve(false);
    }
  });
}

function settle(id, value) {
  const r = _resolvers.get(id);
  if (r) { _resolvers.delete(id); r(value); }
}

export default function ConfirmHost() {
  const [dlg, setDlg] = React.useState(null); // { id, title, message, confirmText, cancelText, tone }
  const [phone, setPhone] = React.useState(false);
  const confirmRef = React.useRef(null);
  const cancelRef = React.useRef(null);

  React.useEffect(() => {
    const on = (e) => setDlg(e.detail || null);
    window.addEventListener(OPEN_EVT, on);
    return () => window.removeEventListener(OPEN_EVT, on);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setPhone(mq.matches);
    on();
    try { mq.addEventListener("change", on); } catch { mq.addListener(on); }
    return () => { try { mq.removeEventListener("change", on); } catch { mq.removeListener(on); } };
  }, []);

  const close = React.useCallback((value) => {
    setDlg((cur) => { if (cur) settle(cur.id, value); return null; });
  }, []);

  React.useEffect(() => {
    if (!dlg) return;
    // фокус на «Отмена» — безопаснее для деструктивного действия
    const t = setTimeout(() => { try { cancelRef.current?.focus(); } catch {} }, 0);
    const onKey = (ev) => {
      if (ev.key === "Escape") { ev.preventDefault(); close(false); }
      else if (ev.key === "Enter") { ev.preventDefault(); close(true); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey, true); };
  }, [dlg, close]);

  if (typeof document === "undefined" || !dlg) return null;

  const danger = dlg.tone !== "default";

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2147483601,
        display: "grid", placeItems: "center", padding: 16,
        background: "rgba(17,17,17,.42)", backdropFilter: "blur(2px)",
        animation: "cubeConfirmFade .16s ease",
      }}
    >
      <style>{`
        @keyframes cubeConfirmFade{from{opacity:0}to{opacity:1}}
        @keyframes cubeConfirmIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={dlg.title}
        style={{
          width: "min(94vw, 420px)",
          // Фон карточки — как у страницы сайта (#f8f8f8), не белый.
          background: "#f8f8f8",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,.28)",
          border: "1px solid rgba(0,0,0,.06)",
          padding: phone ? "20px 18px 18px" : "24px 24px 20px",
          fontFamily: UI,
          animation: "cubeConfirmIn .2s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div style={{ fontSize: phone ? 17 : 18, fontWeight: 600, color: "#111", lineHeight: 1.3 }}>{dlg.title}</div>
        {dlg.message ? (
          <div style={{ marginTop: 10, fontSize: 14.5, fontWeight: 400, color: "#666", lineHeight: 1.5 }}>{dlg.message}</div>
        ) : null}

        <div style={{ marginTop: 22, display: "flex", flexDirection: phone ? "column-reverse" : "row", justifyContent: "flex-end", gap: 10 }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={() => close(false)}
            style={{
              appearance: "none", cursor: "pointer", width: phone ? "100%" : undefined,
              fontFamily: UI, fontSize: 14, fontWeight: 500, color: "#111",
              padding: phone ? "13px 18px" : "10px 18px", borderRadius: 10,
              background: "transparent", border: "none",
              transition: "background .14s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {dlg.cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => close(true)}
            style={{
              appearance: "none", cursor: "pointer", width: phone ? "100%" : undefined,
              fontFamily: UI, fontSize: 14, fontWeight: 600, color: "#fff",
              padding: phone ? "13px 18px" : "10px 18px", borderRadius: 10,
              background: danger ? CARROT : "#111",
              border: `1px solid ${danger ? CARROT : "#111"}`,
              transition: "filter .14s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.94)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {dlg.confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
