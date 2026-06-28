// src/components/layout/Footer.jsx
import React from "react";

export default function Footer() {
  // универсальный SPA-навигационный клик
  const go = (e, to) => {
    if (e) e.preventDefault();
    try {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      // на всякий случай — обычный переход, если pushState недоступен
      window.location.href = to;
    }
  };

  return (
    <footer className="text-[#222222]">
      {/* Основной блок футера */}
      <div className="bg-[#f8f8f8]">
        {/* ≥768px — исходная абсолютная раскладка; <768px — обычный поток в колонку */}
        <div className="w-full relative md:h-[298px] px-5 py-10 md:px-0 md:py-0">
          {/* «c.» — 30px, Extra-Bold, отступ слева 52px (десктоп) */}
          <div className="md:absolute md:left-[52px] md:top-0 leading-none select-none">
            <span className="inline-block align-top text-[30px] font-extrabold tracking-tight">c.</span>
          </div>

          {/* Навигационные колонки */}
          <div className="md:absolute md:left-[52px] md:top-[59px] flex flex-col gap-6 mt-6 md:mt-0 md:flex-row md:gap-0">
            <nav className="text-[14px] leading-[1.2] font-semibold">
              <a href="/#services" className="block hover:underline">Услуги</a>
              <a href="/#about" className="block mt-[19px] hover:underline">О нас</a>
              <a href="/#projects" className="block mt-[19px] hover:underline">Проекты</a>
            </nav>
            <nav className="md:ml-[234px] text-[14px] leading-[1.2] font-semibold">
              <a href="/#contact" className="block hover:underline">Контакты</a>
              <a href="/#reviews" className="block mt-[19px] hover:underline">Отзывы</a>
            </nav>
          </div>

          {/* Полоса точек (как в Project.jsx) */}
          <div className="md:absolute md:left-[52px] md:right-[52px] mt-8 md:mt-0" style={{ top: 59 + 14 + 19 + 14 + 19 + 61 }}>
            <div
              className="w-full h-[1px]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #2e2e2e 0 1px, rgba(0,0,0,0) 1px 9px)",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Нижняя строка: слева юр. ссылки, справа почта/телефон */}
          <div className="md:absolute md:left-[52px] md:right-[52px] md:bottom-[24px] mt-6 md:mt-0">
            <div className="md:mt-[52px] text-[14px] flex flex-col items-start gap-y-3 md:flex-row md:items-center md:flex-wrap md:gap-x-[24px] md:gap-y-0">
              {/* ЛЕВО: юр. ссылки (normal 400) */}
              <a
                href="/legal/cookies"
                className="hover:underline font-normal"
                onClick={(e) => go(e, "/legal/cookies")}
              >
                Политика cookie
              </a>

              <a
                href="/legal/terms"
                className="hover:underline font-normal"
                onClick={(e) => go(e, "/legal/terms")}
              >
                Правовые положения
              </a>

              <a
                href="/legal/privacy"
                className="hover:underline font-normal"
                onClick={(e) => go(e, "/legal/privacy")}
              >
                Политика конфиденциальности
              </a>

              {/* ПРАВО: контактная секция — выравнивание по правому краю (десктоп) */}
              <div className="md:ml-auto flex flex-col items-start gap-y-1 mt-3 md:mt-0 md:flex-row md:items-center md:flex-wrap md:gap-x-[24px] md:gap-y-0 md:text-right">
                <span className="font-semibold">Почта:</span>
                <a href="mailto:info@cube-tech.ru" className="hover:underline font-normal">info@cube-tech.ru</a>
                <span className="font-semibold">Телефон:</span>
                <a href="tel:+79129112000" className="hover:underline font-normal">+7 (912) 911-20-00</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя серая подложка: 120px на десктопе, компактнее на мобиле */}
      <div className="h-[40px] md:h-[120px] bg-[#f8f8f8]" />
    </footer>
  );
}
