// src/pages/services/ventilation/ventilation-design-install.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ScenarioSwitcher, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ClimateStatGrid, AirBalanceBoard, EquipmentSchedule, CriticalCheckMatrix, ResultPackage } from "@/components/services/climateBlocks.jsx";

const BACK = { backTo: "/services/ventilation", backLabel: "Вернуться к климат-системам" };

const STATS = [
  { label: "Приток", value: "подача" },
  { label: "Вытяжка", value: "баланс" },
  { label: "Трассы", value: "воздух" },
  { label: "ПНР", value: "настройка" },
];

const ZONES = [
  { zone: "Рабочая зона", supply: "к людям", exhaust: "по балансу", check: "Расход, шум, направление потока.", mistake: "Дует в места или не доходит до зоны." },
  { zone: "Переговорная", supply: "по заполнению", exhaust: "после использования", check: "CO₂, шум, кратковременную нагрузку.", mistake: "Работает как обычный кабинет." },
  { zone: "Санузлы / кухня", supply: "компенсация", exhaust: "постоянное удаление", check: "Перетоки и направление воздуха.", mistake: "Запах уходит в общие зоны." },
  { zone: "Склад", supply: "по хранению", exhaust: "по режиму", check: "Ворота, высоту, перетоки.", mistake: "Не учтены ворота и техника." },
  { zone: "Технические", supply: "по теплу", exhaust: "по узлу", check: "Доступ, перегрев, шум.", mistake: "Нет понятного воздухообмена." },
];

const FIELDS = [
  { key: "zones", label: "Критичные зоны" },
  { key: "first", label: "Проверить первым" },
  { key: "mistake", label: "Частая ошибка" },
];
const OBJECTS = [
  { key: "office", label: "Офис", zones: "Рабочие места, переговорные, санузлы, кухня.", first: "Баланс притока и вытяжки, шум.", mistake: "Переговорные без отдельного сценария." },
  { key: "warehouse", label: "Склад", zones: "Хранение, погрузка, техзоны.", first: "Ворота, высоту, перетоки.", mistake: "Не учтены ворота и движение техники." },
  { key: "retail", label: "Ритейл", zones: "Торговый зал, склад, кассы.", first: "Равномерность и тепловые зоны.", mistake: "Воздух «падает» в одном месте." },
  { key: "production", label: "Производство", zones: "Посты, оборудование, вытяжные точки.", first: "Локальные выбросы и режимы.", mistake: "Общая вентиляция вместо локальной." },
  { key: "horeca", label: "HoReCa", zones: "Зал, кухня, бар, санузлы.", first: "Вытяжку кухни и компенсацию.", mistake: "Кухня тянет воздух из зала." },
];

const EQUIP = [
  ["Приточная установка", "Подача воздуха", "Фильтры, доступ, шум"],
  ["Вытяжная установка", "Удаление воздуха", "Баланс, выброс, обслуживание"],
  ["Воздуховоды", "Маршрут воздуха", "Сечения, крепления, герметичность"],
  ["Клапаны", "Регулировка веток", "Доступ, маркировка, настройка"],
  ["Решётки", "Подача и удаление в зоне", "Направление, скорость, вид"],
  ["Люки обслуживания", "Доступ к узлам", "Чтобы систему можно было обслуживать"],
];

const CRIT = [
  ["Нет баланса", "Одни зоны душные, другие шумят", "Проверяем приток и вытяжку вместе"],
  ["Нет доступа к клапанам", "Систему нельзя настроить", "Оставляем ревизии"],
  ["Решётки без сценария", "Поток мешает людям", "Проверяем направление"],
  ["Трасса слишком сложная", "Растут шум и сопротивление", "Проверяем маршрут"],
  ["Фильтры неудобно менять", "Обслуживание откладывают", "Предусматриваем доступ"],
];

const RESULT = [
  { title: "Схема", text: "Зоны, трассы, узлы, оборудование." },
  { title: "Монтаж", text: "Установки, воздуховоды, решётки, крепления." },
  { title: "Настройка", text: "Расходы, клапаны, шум, баланс." },
  { title: "Документы", text: "Исполнительная схема, замечания, параметры." },
];

export default function VentilationDesignInstallPage() {
  return (
    <ServiceDetailLayout
      active="/services/ventilation/ventilation-design-install"
      title={<>ПРОЕКТИРОВАНИЕ И МОНТАЖ<br />ВЕНТИЛЯЦИИ</>}
      slogan={<>Соберём вентиляцию по зонам: приток, вытяжка, трассы и доступ к узлам.<br />Чтобы воздух работал по системе, а не по остаточному принципу.</>}
    >
      <ClimateStatGrid items={STATS} />

      <section>
        <SectionHead label="Баланс" title="Баланс зон" />
        <AirBalanceBoard zones={ZONES} />
      </section>

      <section>
        <SectionHead label="Объекты" title="Тип объекта" />
        <ScenarioSwitcher scenarios={OBJECTS} fields={FIELDS} />
      </section>

      <section>
        <SectionHead label="Ведомость" title="Ведомость узлов вентиляции" />
        <EquipmentSchedule columns={["Оборудование", "Что делает", "Что важно"]} rows={EQUIP} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Почему вентиляция работает плохо" />
        <CriticalCheckMatrix columns={["Проблема", "Что происходит", "Как закрываем"]} rows={CRIT} />
      </section>

      <section>
        <SectionHead label="Результат" title="Что остаётся после работ" />
        <ResultPackage items={RESULT} />
      </section>

      <ServiceCTA
        title="Нужно собрать вентиляцию по зонам?"
        text="Отправьте план помещений и назначение объекта — разложим приток, вытяжку, трассы и узлы обслуживания."
        button="Разобрать вентиляцию"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
