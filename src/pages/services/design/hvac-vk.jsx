// src/pages/services/design/hvac-vk.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, CoordinationXrayBoard, ConflictMatrix, TabbedList, VersionStrip } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "Раздел", value: "ОВ/ВК" },
  { label: "Слои", value: "коорд." },
  { label: "Балансы", value: "расчёт" },
  { label: "Узлы", value: "доступ" },
];

const LAYERS = [
  { title: "Архитектура", check: "Планировки, высоты, шахты, помещения.", conflict: "Система не помещается в геометрию.", result: "Ограничения для инженерных листов." },
  { title: "Потолочное пространство", check: "Высоту, пересечения, доступ.", conflict: "Воздуховоды, трубы и кабели борются за уровень.", result: "Координационная логика прокладки." },
  { title: "Вентиляция", check: "Трассы, установки, решётки, шум.", conflict: "Пересечения с конструктивом и потолками.", result: "Планы и схемы ОВ." },
  { title: "Отопление", check: "Контуры, приборы, узлы.", conflict: "Приборы спорят с фасадом и мебелью.", result: "Планы и схемы отопления." },
  { title: "Водоснабжение", check: "Вводы, разводку, приборы.", conflict: "Нет места под трассы.", result: "Планы ВК." },
  { title: "Канализация", check: "Выпуски, стояки, уклоны.", conflict: "Нет отметок для уклонов.", result: "Планы и схемы ВК." },
  { title: "Доступ обслуживания", check: "Зоны сервиса узлов.", conflict: "Оборудование нельзя обслужить.", result: "Заложенные зоны доступа." },
];

const CONFLICTS = [
  ["Вентиляция", "Потолки и электрика", "Проверяем высоты и пересечения"],
  ["ВК", "Уклоны и шахты", "Проверяем отметки"],
  ["Отопление", "Фасад и мебель", "Проверяем размещение приборов"],
  ["Оборудование", "Сервисный доступ", "Оставляем зоны обслуживания"],
  ["Смежники", "Разные версии планов", "Ведём актуальный выпуск"],
];

const START = [
  { key: "rooms", label: "Помещения", items: ["Назначение зон", "Площади и высоты", "Режим работы", "Требования к воздуху / теплу / воде"] },
  { key: "equip", label: "Оборудование", items: ["Тепловыделения", "Сантехнические приборы", "Вентиляционные установки", "Климатические блоки"] },
  { key: "adjacent", label: "Смежники", items: ["Архитектура", "Конструктив", "Электрика", "Слаботочка"] },
  { key: "limits", label: "Ограничения", items: ["Высота потолков", "Шахты", "Фасад", "Доступ к обслуживанию"] },
];

const VERSIONS = [
  { v: "v01", label: "Исходные" },
  { v: "v02", label: "Координация" },
  { v: "v03", label: "Замечания" },
  { label: "Выпуск" },
];

export default function HvacVkPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/hvac-vk"
      title={<>ПРОЕКТ<br />ОВ И ВК</>}
      slogan={<>Сведём воздух, тепло, воду и канализацию в один координационный разрез.<br />Чтобы системы проходили через здание без конфликтов.</>}
    >
      <ProjectStatGrid items={STATS} />

      {/* SIGNATURE — координационный разрез */}
      <section>
        <SectionHead label="Разрез" title="Координационный разрез" />
        <CoordinationXrayBoard layers={LAYERS} />
      </section>

      <section>
        <SectionHead label="Конфликты" title="Где системы спорят" />
        <ConflictMatrix columns={["Система", "С чем конфликтует", "Как проверяем"]} rows={CONFLICTS} />
      </section>

      <section>
        <SectionHead label="Исходные" title="Что нужно для старта" />
        <TabbedList tabs={START} />
      </section>

      <section>
        <SectionHead label="Версии" title="Путь координации до выпуска" />
        <VersionStrip items={VERSIONS} />
      </section>

      <ServiceCTA
        title="Нужно свести ОВ и ВК без конфликтов со смежниками?"
        text="Отправьте планировки и ограничения объекта — соберём разрез систем, узлов и проектных листов."
        button="Собрать проект ОВ/ВК"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
