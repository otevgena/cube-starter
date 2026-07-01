// src/pages/services/ventilation/conditioning-vrf-vrv.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ClimateStatGrid, ZoneTiles, EquipmentSchedule, CriticalCheckMatrix, TabbedList } from "@/components/services/climateBlocks.jsx";

const BACK = { backTo: "/services/ventilation", backLabel: "Вернуться к климат-системам" };

const STATS = [
  { label: "VRF", value: "зоны" },
  { label: "Блоки", value: "indoor" },
  { label: "Трассы", value: "фреон" },
  { label: "Дренаж", value: "контроль" },
];

const ZONES = [
  { zone: "Open space", unit: "Кассетный", control: "Групповое по зоне", important: "Не направлять поток на людей" },
  { zone: "Переговорная", unit: "Внутренний блок", control: "Локальный сценарий", important: "Учитывать заполненность" },
  { zone: "Кабинет", unit: "Настенный / канальный", control: "Индивидуальное", important: "Шум и сервис" },
  { zone: "Серверная", unit: "Отдельное решение", control: "Стабильный режим", important: "Резерв и непрерывность" },
  { zone: "Торговый зал", unit: "Несколько зон", control: "Группировка", important: "Равномерность и теплопритоки" },
  { zone: "Техзона", unit: "Настенный", control: "По расписанию", important: "Защита оборудования" },
];

const EQUIP = [
  ["Наружный блок", "Формирует холод или тепло", "Место установки, шум, доступ"],
  ["Внутренний блок", "Работает на помещение", "Поток, сервис, управление"],
  ["Фреоновая трасса", "Связывает блоки", "Длины, изоляция, маршрут"],
  ["Разветвители", "Распределяют контур", "Доступ, положение, схема"],
  ["Дренаж", "Отводит конденсат", "Уклоны, насосы, ревизия"],
  ["Управление", "Задаёт режимы", "Пульты, группы, сценарии"],
];

const CLARIFY = [
  { key: "rooms", label: "Помещения", items: ["Площадь", "Назначение", "Высота", "Режим работы"] },
  { key: "heat", label: "Теплопритоки", items: ["Люди", "Оборудование", "Солнце", "Витрины / кухня / серверы"] },
  { key: "routes", label: "Трассы", items: ["Место наружного блока", "Путь трасс", "Доступ к потолку", "Ограничения фасада"] },
  { key: "drain", label: "Дренаж", items: ["Куда отводить конденсат", "Уклоны", "Насосы", "Ревизия"] },
  { key: "control", label: "Управление", items: ["Локальные пульты", "Группы", "Центральный контроллер", "Интеграция с автоматикой"] },
];

const CRIT = [
  ["Нет доступа к блоку", "Сервис становится проблемой", "Оставляем ревизию"],
  ["Дренаж не продуман", "Появляются протечки", "Проверяем маршрут заранее"],
  ["Не учтены теплопритоки", "Система работает на пределе", "Собираем исходные данные"],
  ["Все зоны живут одним режимом", "Людям некомфортно", "Делим управление"],
  ["Трасса спрятана без логики", "Сложно обслуживать", "Фиксируем маршрут"],
];

export default function ConditioningVrfVrvPage() {
  return (
    <ServiceDetailLayout
      active="/services/ventilation/conditioning-vrf-vrv"
      title={<>КЛИМАТ ПО ЗОНАМ<br />VRF / VRV</>}
      slogan={<>Разделим холод по помещениям, блокам, трассам и управлению.<br />Чтобы каждая зона работала в своём режиме и была доступна для сервиса.</>}
    >
      <ClimateStatGrid items={STATS} />

      <section>
        <SectionHead label="Зоны" title="Пульт зон VRF/VRV" />
        <ZoneTiles zones={ZONES} />
      </section>

      <section>
        <SectionHead label="Ведомость" title="Из чего складывается система" />
        <EquipmentSchedule columns={["Оборудование", "Что делает", "Что важно"]} rows={EQUIP} />
      </section>

      <section>
        <SectionHead label="Исходные" title="Что уточнить до подбора" />
        <TabbedList tabs={CLARIFY} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Ошибки VRF/VRV" />
        <CriticalCheckMatrix columns={["Ошибка", "Что происходит", "Как делаем иначе"]} rows={CRIT} />
      </section>

      <ServiceCTA
        title="Нужно разложить кондиционирование по зонам?"
        text="Отправьте план помещений и места наружных блоков — соберём логику VRF/VRV по зонам, трассам и управлению."
        button="Разобрать VRF/VRV"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
