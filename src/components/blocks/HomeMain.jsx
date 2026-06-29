// src/components/blocks/HomeMain.jsx
// Первый экран (clean-rebuild): мета-строка, заголовок CUBE-TECH, подпись
// директора и «ромб» с главным изображением. Чистый Tailwind + токены.
import React from "react";

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export default function HomeMain() {
  const now = new Date();
  const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return (
    <section className="bg-page pt-2 text-center font-tight text-ink" aria-label="Главная">
      {/* Сегодня • дата • загруженность (14px/14px, обычный вес) */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 text-sm font-normal leading-none">
        <span>Сегодня</span>
        <span className="rounded-md border border-black/20 px-2.5 py-1">{dateStr}</span>
        <span>Загруженность 7.49 из 10</span>
      </div>

      {/* Заголовок */}
      <h1
        className="mt-5 font-semibold uppercase leading-none"
        style={{ fontSize: "clamp(48px, 13.5vw, 137px)" }}
      >
        CUBE-TECH
      </h1>

      {/* Подпись: директор + бейдж */}
      <div className="mt-4 flex items-center justify-center gap-2.5 text-sm">
        <img src="/about/director.png" alt="" className="h-8 w-8 rounded-full object-cover" />
        <a href="#director" className="group relative pb-1 font-semibold">
          Генеральный директор
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-300" />
          <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-ink transition-[width] duration-300 group-hover:w-full" />
        </a>
        <span className="self-start text-[9px] leading-none">CUBE</span>
      </div>

      {/* «Ромб» с главным изображением (тёмная рамка вокруг картинки) */}
      <div className="mx-auto mt-20 aspect-[1441/1112] w-[min(1441px,96vw)] rounded-2xl bg-ink p-[clamp(20px,4.3vw,62px)]">
        <img
          src="/main/main.png"
          alt="Главное изображение"
          className="h-full w-full rounded-xl object-cover"
        />
      </div>
    </section>
  );
}
