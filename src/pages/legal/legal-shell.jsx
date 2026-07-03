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

// назад: туда, откуда пришёл (по истории), иначе — на главную
const goBack = () => {
  try {
    if (window.history.length > 1) { window.history.back(); return; }
  } catch {}
  try {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.location.href = "/";
  }
};

export function LegalLayout({ active, title, slogan, children }) {
  return (
    <div className="-mt-[61px] bg-page font-tight text-black">
      {/* верхняя зона (компенсация padding у main — на внешнем контейнере) */}
      <div>
        {/* назад — мобилка (по истории / на главную) */}
        <div className="px-4 pt-2 text-left lg:hidden">
          <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-[14px] font-light uppercase leading-none text-[#a7a7a7]">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" className="block shrink-0">
              <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Назад
          </button>
        </div>
        <nav className="px-4 pt-4 text-center lg:px-0 lg:pt-[30px]">
          {TABS.map((t) => (
            <a
              key={t.to}
              href={t.to}
              onClick={(e) => go(e, t.to)}
              className={`inline-block px-2.5 text-[13px] font-light uppercase leading-7 transition-colors duration-150 lg:text-sm ${
                t.to === active ? "text-black" : "text-[#a7a7a7] hover:text-black"
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <h1 className="mt-2 text-center font-semibold uppercase leading-none text-[clamp(22px,8vw,32px)] sm:text-[clamp(48px,13.5vw,137px)] md:text-[clamp(40px,6vw,52px)] lg:mt-0.5 lg:text-[clamp(48px,13.5vw,137px)]">
          {title}
        </h1>

        <p className="mx-4 mt-3 text-center text-[18px] font-semibold leading-6 text-ink lg:mx-0 lg:text-[21px] lg:leading-7">{slogan}</p>
      </div>

      {/* контент */}
      <div className="mx-4 pb-10 lg:mx-[80px] lg:pb-[58px]">{children}</div>
    </div>
  );
}

/* Контент-хелперы (вместо .terms-h / .terms-p / .terms-ul / …) */
export const H3 = ({ children }) => (
  <h3 className="mb-2 mt-14 text-[26px] font-semibold leading-[1.2] lg:mt-[150px] lg:text-[48px] lg:leading-[1.15]">{children}</h3>
);
export const P = ({ children }) => (
  <p className="mb-3 text-[17px] font-light leading-7 lg:mb-[18px] lg:text-[24px] lg:leading-9">{children}</p>
);
export const UL = ({ children }) => (
  <ul className="mb-3 list-disc pl-[1.2em] text-[17px] font-light leading-7 lg:mb-[18px] lg:text-[24px] lg:leading-9">{children}</ul>
);
export const OL = ({ children }) => (
  <ol className="mb-3 list-decimal pl-[1.2em] text-[17px] font-light leading-7 marker:font-semibold lg:mb-[18px] lg:text-[24px] lg:leading-9">{children}</ol>
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
