// src/pages/legal/legal-shell.jsx
// Общий чистый layout для legal-страниц (cookies / terms / privacy).
// Заменяет дублирующий <style> и пиксельные сдвиги в каждой странице.
import React from "react";

const TABS = [
  { to: "/legal/cookies", label: "Политика cookie" },
  { to: "/legal/terms", label: "Правовые положения" },
  { to: "/legal/privacy", label: "Политика конфиденциальности" },
];

const go = (e, to) => {
  e.preventDefault();
  try {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.location.href = to;
  }
};

export function LegalLayout({ active, title, slogan, children }) {
  return (
    <div className="-mt-[61px] bg-page font-tight text-black">
      {/* верхняя зона (компенсация padding у main — на внешнем контейнере) */}
      <div>
        <nav className="pt-[30px] text-center">
          {TABS.map((t) => (
            <a
              key={t.to}
              href={t.to}
              onClick={(e) => go(e, t.to)}
              className={`px-2.5 text-sm font-light uppercase leading-7 transition-colors duration-150 ${
                t.to === active ? "text-black" : "text-[#a7a7a7] hover:text-black"
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <h1
          className="mt-0.5 text-center font-semibold uppercase leading-none"
          style={{ fontSize: "clamp(48px, 13.5vw, 137px)" }}
        >
          {title}
        </h1>

        <p className="mt-3 text-center text-[21px] font-semibold leading-7 text-ink">{slogan}</p>
      </div>

      {/* контент: до 1-го заголовка ровно 150px (mt у H3) */}
      <div className="mx-[80px] pb-[58px]">{children}</div>
    </div>
  );
}

/* Контент-хелперы (вместо .terms-h / .terms-p / .terms-ul / …) */
export const H3 = ({ children }) => (
  <h3 className="mb-2 mt-[150px] text-[48px] font-semibold leading-[1.15]">{children}</h3>
);
export const P = ({ children }) => (
  <p className="mb-[18px] text-[24px] font-light leading-9">{children}</p>
);
export const UL = ({ children }) => (
  <ul className="mb-[18px] list-disc pl-[1.2em] text-[24px] font-light leading-9">{children}</ul>
);
export const OL = ({ children }) => (
  <ol className="mb-[18px] list-decimal pl-[1.2em] text-[24px] font-light leading-9 marker:font-semibold">{children}</ol>
);
export const LI = ({ children }) => <li className="mb-2">{children}</li>;
export const B = ({ children }) => <strong className="font-semibold">{children}</strong>;
export const A = ({ href, blank, children }) => (
  <a
    href={href}
    {...(blank ? { target: "_blank", rel: "noreferrer" } : {})}
    className="font-semibold text-black no-underline hover:underline"
  >
    {children}
  </a>
);
