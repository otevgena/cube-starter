// src/components/blocks/HomeMain.jsx
// Первый экран (clean-rebuild): мета-строка, заголовок CUBE-TECH, подпись
// директора и «ромб» с главным изображением. Чистый Tailwind + токены.
import React from "react";

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export default function HomeMain() {
  const now = new Date();
  const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return (
    <section className="-mt-12 bg-page text-center font-tight text-ink lg:-mt-2" aria-label="Главная">
      {/* Сегодня • дата • загруженность (14px/14px) */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-sm font-normal leading-none">
        <span>Сегодня</span>
        <span className="rounded-md border border-black/20 px-2.5 py-1 font-medium">{dateStr}</span>
        <span>Загруженность 7.49 из 10</span>
      </div>

      {/* Заголовок */}
      <h1 className="mt-5 font-semibold uppercase leading-none h-hero">
        CUBE-TECH
      </h1>

      {/* Подпись: директор + бейдж */}
      <div className="mt-4 flex items-center justify-center gap-2.5 text-sm">
        <img src="/about/director.jpg" alt="" className="h-8 w-8 rounded-full object-cover" />
        <a href="#director" className="group relative pb-1 font-semibold">
          Генеральный директор
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-300" />
          <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-ink transition-[width] duration-300 group-hover:w-full" />
        </a>
        <span className="self-start text-[9px] leading-none">CUBE</span>
      </div>

      {/* «Ромб» с главным изображением (тёмная рамка вокруг картинки) */}
      <div className="mx-auto mt-8 aspect-[1441/1112] w-[calc(100vw-32px)] rounded-[10px] bg-ink p-[clamp(20px,4.3vw,62px)] sm:w-[min(1441px,96vw)] lg:mx-[52px] lg:mt-20 lg:w-auto xl:mx-auto xl:w-[min(1441px,96vw)]">
        <img
          src="/main/main.jpg"
          alt="Главное изображение"
          className="h-full w-full rounded-lg object-cover"
        />
      </div>
    </section>
  );
}
