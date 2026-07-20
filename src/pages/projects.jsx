// src/pages/projects.jsx
// Страница «Смотреть работы» (переход из блока «ПРОЕКТЫ» на главной).
// Показывает ВСЕ витринные проекты одинаковыми тёмными карточками — без нижней
// таблицы-подписи (Заказчик/Название/Год/Услуги), только карточки.
// Данные — общий стор src/data/projects.js (управляются в админке «Добавить проект»).
import React from "react";
import { getProjects, isProjectsLoading } from "@/data/projects.js";
import { ProjectCardResponsive } from "@/components/blocks/Projects.jsx";
import { CenterSpinner } from "@/components/common/Spinner.jsx";

function useAllProjects() {
  const [list, setList] = React.useState(() => getProjects());
  const [loading, setLoading] = React.useState(() => isProjectsLoading());
  React.useEffect(() => {
    const on = () => { setList(getProjects()); setLoading(isProjectsLoading()); };
    window.addEventListener("projects:changed", on);
    // гидрация могла завершиться между первым рендером и подпиской — сверим ещё раз
    setLoading(isProjectsLoading());
    return () => window.removeEventListener("projects:changed", on);
  }, []);
  return { list, loading };
}

export default function ProjectsPage() {
  const { list: projects, loading } = useAllProjects();
  const total = projects.length;

  return (
    <section className="bg-page -mt-8 font-tight text-ink" aria-label="Смотреть работы">
      {/* Шапка — как на блоке «ПРОЕКТЫ»: маленький лейбл + крупный h-hero-заголовок */}
      <div className="text-center text-sm font-light leading-7">Каталог</div>
      <div className="mt-[26px] text-center">
        <h1 className="font-semibold uppercase leading-none h-hero">СМОТРЕТЬ РАБОТЫ</h1>
        {!loading && (
          <p className="mt-3.5 text-[18px] font-light leading-7 sm:mt-4 sm:text-[21px] md:text-[19px] lg:text-[21px]">
            Всего <b className="font-semibold">{total}</b> {plural(total, "проект", "проекта", "проектов")} и реализованных объектов
          </p>
        )}
      </div>

      {loading ? (
        // пока витрина не подгрузилась — только заголовок и наш спиннер, без карточек
        <CenterSpinner minHeight={340} label="Загружаем работы…" />
      ) : (
        <>
          {/* Сетка тёмных карточек — одинаковые, без подписи снизу */}
          <div className="mt-16 grid grid-cols-1 gap-6 px-4 lg:mx-[52px] lg:mt-20 lg:grid-cols-2 lg:px-0">
            {projects.map((p) => (
              <ProjectCardResponsive key={p.id} project={p} />
            ))}
          </div>

          {total === 0 && (
            <div className="mx-4 mt-10 text-center text-base font-light text-ink/70 lg:mx-[52px]">
              Пока нет опубликованных проектов.
            </div>
          )}
        </>
      )}

      <div className="h-[120px] lg:h-[160px]" />
    </section>
  );
}

// Русское склонение числительного (2 проекта / 5 проектов).
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
