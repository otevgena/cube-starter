// src/pages/services/design/estimate-documentation.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, BeforeAfterGrid, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, CostFunnelBoard, TabbedList, ProjectRiskMatrix } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "ВОР", value: "объёмы" },
  { label: "ЛСР", value: "смета" },
  { label: "Ресурсы", value: "состав" },
  { label: "Проверка", value: "связка" },
];

const LEVELS = [
  { title: "Проектные листы", has: "Планы, схемы, спецификации, узлы.", check: "Актуальность выпуска.", err: "Смета собирается по старой версии." },
  { title: "Ведомость объёмов", has: "Объёмы работ по проекту.", check: "Единицы измерения и связь с листами.", err: "Объёмы взяты без привязки." },
  { title: "Работы", has: "Монтажные и сопутствующие операции.", check: "Полноту состава.", err: "Часть работ не попадает в смету." },
  { title: "Материалы и оборудование", has: "Позиции из спецификаций и ведомостей.", check: "Комплектацию.", err: "Оборудование без обязательных узлов." },
  { title: "Ресурсы", has: "Труд, машины, механизмы, материалы.", check: "Логичность применения.", err: "Ресурсы не отражают технологию." },
  { title: "Локальная смета", has: "Итоговую структуру по разделам.", check: "Связь объёмов, ресурсов и работ.", err: "Смета выглядит как случайный список." },
];

const SOURCE = [
  { key: "project", label: "По проекту", items: ["Листы", "Спецификации", "Ведомости", "Узлы"] },
  { key: "vor", label: "По ВОР", items: ["Объёмы", "Единицы", "Участки", "Разделы"] },
  { key: "fact", label: "По факту", items: ["Замеры", "Фото", "Исполнительные данные", "Уточнения"] },
  { key: "check", label: "На проверку", items: ["Дубли", "Пропуски", "Единицы измерения", "Связка с проектом"] },
];

const BEFORE = { items: ["Позиции разрознены", "Объёмы сложно проверить", "Проект и смета живут отдельно", "Непонятно, где пропуски", "Сложно обсуждать изменения"] };
const AFTER = { items: ["Есть логика разделов", "Объёмы привязаны", "Ресурсы читаются", "Замечания фиксируются", "Изменения проще контролировать"] };

const RISKS = [
  ["Нет ВОР", "Объёмы собираются вручную", "Формируем структуру"],
  ["Спецификация неактуальна", "Материалы не совпадают", "Сверяем выпуск"],
  ["Работы не разбиты по разделам", "Сложно проверять", "Структурируем ЛСР"],
  ["Разные единицы измерения", "Появляются ошибки", "Приводим к единой логике"],
  ["Сопутствующие работы не учтены", "Бюджет занижен", "Проверяем технологию"],
];

export default function EstimateDocumentationPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/estimate-documentation"
      title={<>СМЕТНАЯ<br />ДОКУМЕНТАЦИЯ</>}
      slogan={<>Проведём проект через воронку объёмов, ресурсов и работ.<br />Чтобы стоимость была связана с листами, а не собрана отдельным списком.</>}
    >
      {/* SIGNATURE — воронка стоимости */}
      <section>
        <SectionHead label="Воронка" title="Воронка стоимости" />
        <CostFunnelBoard levels={LEVELS} />
      </section>

      <ProjectStatGrid items={STATS} />

      <section>
        <SectionHead label="Источник" title="Источник сметы" />
        <TabbedList tabs={SOURCE} />
      </section>

      <section>
        <SectionHead label="Эффект" title="До / после сметной структуры" />
        <BeforeAfterGrid before={BEFORE} after={AFTER} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Почему смета расходится с проектом" />
        <ProjectRiskMatrix columns={["Причина", "Что ломается", "Как проверяем"]} rows={RISKS} />
      </section>

      <ServiceCTA
        title="Нужно превратить проект в проверяемую смету?"
        text="Отправьте проект, ВОР или список работ — соберём структуру объёмов, ресурсов и сметных позиций."
        button="Собрать сметную структуру"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
