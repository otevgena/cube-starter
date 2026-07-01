// src/pages/services/design/lightning-earthing.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, ProtectionEnvelopeBoard, ChainStrip, TabbedList, ProjectRiskMatrix } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "Зоны", value: "защита" },
  { label: "Контур", value: "Rз" },
  { label: "Узлы", value: "чертежи" },
  { label: "Спец.", value: "выпуск" },
];

const ELEMENTS = [
  { title: "Зоны защиты", design: "Логику защиты здания и уязвимых участков.", check: "Геометрию, высоты, назначение объекта.", sheet: "План зон и принцип решения." },
  { title: "Молниеприёмники", design: "Расположение элементов защиты.", check: "Привязку к кровле и конструкциям.", sheet: "План размещения." },
  { title: "Токоотводы", design: "Пути отвода тока.", check: "Маршруты, крепления, доступность.", sheet: "Схема токоотводов." },
  { title: "Контур заземления", design: "Расположение и состав контура.", check: "Связь с вводами и ГЗШ.", sheet: "План заземления." },
  { title: "ГЗШ", design: "Узлы соединения и уравнивание потенциалов.", check: "Связь с инженерными системами.", sheet: "Узлы и схема." },
  { title: "Узлы крепления", design: "Детали крепления и соединений.", check: "Реализуемость на объекте.", sheet: "Чертежи узлов." },
  { title: "Спецификация", design: "Материалы и элементы.", check: "Полноту и связь с планом.", sheet: "Комплект для монтажа и сметы." },
];

const SHEETS = ["План молниезащиты", "План заземления", "Узлы", "Спецификация"];

const TABS = [
  { key: "roof", label: "Кровля", items: ["Молниеприёмники", "Крепления", "Привязка к конструкциям"] },
  { key: "facade", label: "Фасад", items: ["Токоотводы", "Маршруты", "Скрытая / открытая прокладка"] },
  { key: "contour", label: "Контур", items: ["Заземлители", "Соединения", "Сопротивление Rз"] },
  { key: "gzsh", label: "ГЗШ", items: ["Главная шина", "Уравнивание потенциалов", "Связь с системами"] },
  { key: "spec", label: "Спецификация", items: ["Материалы", "Элементы", "Связь с планом"] },
];

const RISKS = [
  ["Зоны не показаны", "Непонятна логика защиты", "Фиксируем карту зон"],
  ["Токоотводы без привязки", "Монтаж ищет путь на объекте", "Показываем маршруты"],
  ["Нет узлов", "Решение сложно реализовать", "Выпускаем детали"],
  ["Спецификация не связана с планом", "Закупка расходится", "Сверяем позиции"],
  ["Не учтён фасад или кровля", "Появляются конфликты", "Проверяем привязки"],
];

export default function LightningEarthingPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/lightning-earthing"
      title={<>МОЛНИЕЗАЩИТА<br />И ЗАЗЕМЛЕНИЕ</>}
      slogan={<>Соберём защитную оболочку объекта: зоны, токоотводы, контур и узлы.<br />Чтобы решение читалось на плане, разрезах и спецификации.</>}
    >
      {/* SIGNATURE — защитная оболочка */}
      <section>
        <SectionHead label="Оболочка" title="Защитная оболочка объекта" />
        <ProtectionEnvelopeBoard elements={ELEMENTS} />
      </section>

      <ProjectStatGrid items={STATS} />

      <section>
        <SectionHead label="Листы" title="Что выходит в выпуск" />
        <ChainStrip items={SHEETS} />
      </section>

      <section>
        <SectionHead label="Состав" title="Где принимаем решения" />
        <TabbedList tabs={TABS} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Что ломает проект защиты" />
        <ProjectRiskMatrix columns={["Ошибка", "Что ломается", "Как проверяем"]} rows={RISKS} />
      </section>

      <ServiceCTA
        title="Нужно собрать проект защитного контура?"
        text="Отправьте планы, фасады или кровлю — разложим зоны защиты, контур, узлы и спецификацию."
        button="Собрать защитное решение"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
