// src/pages/services/design/power-eom.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, LoadCompilerBoard, VersionStrip, TabbedList, ProjectRiskMatrix } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "Нагрузки", value: "вход" },
  { label: "Щиты", value: "логика" },
  { label: "Схемы", value: "выпуск" },
  { label: "Спец.", value: "связка" },
];

const INPUTS = ["Рабочие места", "Освещение", "Силовое оборудование", "Серверная", "Вентиляция / климат", "Резерв"];
const LOGIC = ["Группы", "Щиты", "Категории", "Защита", "Резерв", "Баланс"];
const OUTPUTS = ["Однолинейная схема", "Планы сетей", "Кабельный журнал", "Спецификация", "Ведомость щитов"];
const TRACES = [
  "Рабочие места → розеточные группы → щит этажа → линии → кабельный журнал → спецификация.",
  "Освещение → группы освещения → щит → управление → планы сетей → спецификация.",
  "Силовое оборудование → отдельная группа → щит → линия → кабельный журнал → спецификация.",
  "Серверная → выделенный ввод → резерв → щит → однолинейная схема → ведомость щитов.",
  "Вентиляция / климат → силовые группы → щит → защита → планы сетей → спецификация.",
  "Резерв → свободные модули щитов → однолинейная схема → возможность развития объекта.",
];

const VERSIONS = [
  { v: "v01", label: "Исходные" },
  { v: "v02", label: "Проверка нагрузок" },
  { v: "v03", label: "Смежники" },
  { label: "Выпуск" },
];

const INPUT_TABS = [
  { key: "object", label: "Объект", items: ["Планировки и назначение помещений", "Существующий ввод и щитовая", "Ограничения трасс", "Точки подключения"] },
  { key: "equip", label: "Оборудование", items: ["Перечень потребителей", "Мощность и режимы", "Пусковые токи", "Требования к резерву"] },
  { key: "adjacent", label: "Смежники", items: ["Архитектура", "ОВ/ВК", "Слаботочные системы", "Технологическое оборудование"] },
  { key: "check", label: "Проверка", items: ["Противоречия в планах", "Неполные нагрузки", "Конфликт трасс", "Место под щиты"] },
];

const RISKS = [
  ["Нагрузка без оборудования", "Щиты не соответствуют реальности", "Уточняем перечень потребителей"],
  ["Схема не связана с планом", "Монтаж не понимает маршрут линий", "Сверяем листы"],
  ["Нет резерва", "Объект сложно развивать", "Фиксируем резерв в щитах"],
  ["Журнал не совпадает со спецификацией", "Закупка расходится", "Проверяем связку"],
  ["Нет места под щиты", "Проект конфликтует с объектом", "Проверяем планировки"],
];

export default function PowerEomPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/power-eom"
      title={<>ПРОЕКТ ЭЛЕКТРОСЕТЕЙ<br />ЭОМ</>}
      slogan={<>Превратим нагрузки объекта в схемы, щиты, линии и спецификации.<br />Чтобы монтаж видел не набор листов, а электрическую логику.</>}
    >
      {/* SIGNATURE — компилятор нагрузок */}
      <section>
        <SectionHead label="Компилятор" title="Компилятор нагрузок" />
        <LoadCompilerBoard inputs={INPUTS} logic={LOGIC} outputs={OUTPUTS} traces={TRACES} />
      </section>

      <ProjectStatGrid items={STATS} />

      <section>
        <SectionHead label="Версии" title="Как раздел доходит до выпуска" />
        <VersionStrip items={VERSIONS} />
      </section>

      <section>
        <SectionHead label="Исходные" title="Исходные данные" />
        <TabbedList tabs={INPUT_TABS} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Что ломает раздел ЭОМ" />
        <ProjectRiskMatrix columns={["Ошибка", "Что ломается", "Как проверяем"]} rows={RISKS} />
      </section>

      <ServiceCTA
        title="Нужно собрать ЭОМ без разрыва между нагрузками и листами?"
        text="Отправьте планировки, оборудование и вводные условия — соберём структуру раздела, схем и спецификаций."
        button="Собрать раздел ЭОМ"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
