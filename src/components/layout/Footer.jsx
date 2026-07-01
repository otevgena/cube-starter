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
      <div className="px-4 pb-6 pt-20 lg:px-[52px] lg:pt-24">
        {/* логотип */}
        <div className="select-none text-[30px] font-extrabold leading-none tracking-tight">c.</div>

        {/* навигационные колонки — 2 колонки (Контакты/Отзывы во второй) */}
        <div className="mt-[35px] flex gap-x-16 text-[14px] font-semibold leading-[1.2] sm:gap-0">
          {NAV.map((col, i) => (
            <nav key={i} className={i === 0 ? "" : "mt-9 sm:ml-[120px] sm:mt-0 lg:ml-[234px]"}>
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
        <div className="mt-6 flex flex-col gap-4 text-[14px] sm:mt-[52px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-[24px] sm:gap-y-2">
          <div className="flex flex-wrap gap-x-5 gap-y-2 sm:contents">
            {LEGAL.map((item) => (
              <a key={item.href} href={item.href} onClick={(e) => go(e, item.href)} className="font-normal hover:underline">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-[24px] gap-y-1 sm:ml-auto">
            <span className="whitespace-nowrap">
              <span className="font-semibold">Почта:</span>{" "}
              <a href="mailto:info@cube-tech.ru" className="font-normal hover:underline">info@cube-tech.ru</a>
            </span>
            <span className="whitespace-nowrap">
              <span className="font-semibold">Телефон:</span>{" "}
              <a href="tel:+79129112000" className="font-normal hover:underline">+7 (912) 911-20-00</a>
            </span>
          </div>
        </div>
      </div>

      {/* нижняя подложка */}
      <div className="h-16 bg-page lg:h-[120px]" />
    </footer>
  );
}
