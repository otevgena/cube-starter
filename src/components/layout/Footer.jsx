// src/components/layout/Footer.jsx
// Подвал (clean-rebuild): нормальный поток вместо абсолютного позиционирования.
import React from "react";

const NAV = [
  [
    { label: "Услуги", href: "/#services" },
    { label: "О нас", href: "/#about" },
    { label: "Проекты", href: "/#projects" },
  ],
  [
    { label: "Контакты", href: "/#contact" },
    { label: "Отзывы", href: "/#reviews" },
  ],
];

const LEGAL = [
  { label: "Политика cookie", href: "/legal/cookies" },
  { label: "Правовые положения", href: "/legal/terms" },
  { label: "Политика конфиденциальности", href: "/legal/privacy" },
];

export default function Footer() {
  // SPA-навигация для юр. ссылок (отдельные роуты)
  const go = (e, to) => {
    if (e) e.preventDefault();
    try {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.href = to;
    }
  };

  return (
    <footer className="bg-page font-tight text-ink">
      <div className="px-[52px] pb-6 pt-24">
        {/* логотип */}
        <div className="select-none text-[30px] font-extrabold leading-none tracking-tight">c.</div>

        {/* навигационные колонки */}
        <div className="mt-[35px] flex text-[14px] font-semibold leading-[1.2]">
          {NAV.map((col, i) => (
            <nav key={i} className={i === 0 ? "" : "ml-[234px]"}>
              {col.map((item, j) => (
                <a key={item.href} href={item.href} className={`block hover:underline ${j === 0 ? "" : "mt-[19px]"}`}>
                  {item.label}
                </a>
              ))}
            </nav>
          ))}
        </div>

        {/* пунктирный разделитель (как в таблице проектов) */}
        <div
          className="mt-[28px] h-px w-full"
          style={{ backgroundImage: "repeating-linear-gradient(to right, #2e2e2e 0 1px, rgba(0,0,0,0) 1px 9px)" }}
          aria-hidden="true"
        />

        {/* нижняя строка: слева юр. ссылки, справа контакты */}
        <div className="mt-[52px] flex flex-wrap items-center gap-x-[24px] text-[14px]">
          {LEGAL.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => go(e, item.href)} className="font-normal hover:underline">
              {item.label}
            </a>
          ))}

          <div className="ml-auto flex flex-wrap items-center gap-x-[24px]">
            <span className="font-semibold">Почта:</span>
            <a href="mailto:info@cube-tech.ru" className="font-normal hover:underline">info@cube-tech.ru</a>
            <span className="font-semibold">Телефон:</span>
            <a href="tel:+79129112000" className="font-normal hover:underline">+7 (912) 911-20-00</a>
          </div>
        </div>
      </div>

      {/* нижняя подложка */}
      <div className="h-[120px] bg-page" />
    </footer>
  );
}
