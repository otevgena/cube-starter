// src/pages/projects.jsx
import React from "react";

const TITLE = { fontSize: "clamp(48px, 13.5vw, 137px)" };

export default function ProjectsPage() {
  const TOTAL = 26; // сколько проектов показываем

  return (
    <section className="bg-page pt-[200px] font-tight text-ink" aria-label="Смотреть работы">
      <div className="text-center">
        <div className="text-sm font-light leading-7">Каталог</div>
        <h1 className="mt-[26px] font-semibold uppercase leading-none" style={TITLE}>
          СМОТРЕТЬ РАБОТЫ
        </h1>
        <p className="mt-4 text-[21px] font-light leading-7">
          Всего <b className="font-semibold">{TOTAL}</b> проектов — скоро здесь появится список и фильтры.
        </p>
      </div>

      {/* плейсхолдер под список работ */}
      <div className="mx-[80px] mt-[82px] text-base font-light leading-6 text-ink/90">
        Здесь будут карточки проектов, сортировка и поиск.
      </div>

      <div className="h-[160px]" />
    </section>
  );
}
