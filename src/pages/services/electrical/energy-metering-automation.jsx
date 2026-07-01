// src/pages/services/electrical/energy-metering-automation.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import {
  DetailStatGrid, SectionHead, BeforeAfterGrid, MatrixTable, ServiceCTA,
} from "@/components/services/detailBlocks.jsx";

const STATS = [
  { label: "Учёт", value: "АСКУЭ" },
  { label: "Данные", value: "онлайн" },
  { label: "Потребление", value: "по зонам" },
  { label: "Архив", value: "события" },
];

// главный блок — до / после автоматизации
const BEFORE = {
  title: "Ручной учёт",
  items: [
    "Показания снимаются вручную",
    "Сложно найти перерасход",
    "Нет истории по зонам",
    "Ошибки появляются поздно",
    "Данные разрознены",
  ],
};
const AFTER = {
  title: "Автоматизированный учёт",
  items: [
    "Данные собираются централизованно",
    "Видно потребление по зонам",
    "События фиксируются",
    "Проще анализировать пики",
    "Есть база для оптимизации",
  ],
};

const SOURCES = [
  ["Счётчик", "Потребление", "Учёт и отчётность"],
  ["Шкаф учёта", "Состояние линий", "Контроль эксплуатации"],
  ["Трансформаторы тока", "Фактическая нагрузка", "Анализ мощности"],
  ["Контроллер", "События и сигналы", "Диспетчеризация"],
  ["Интерфейс связи", "Данные", "Удалённый доступ"],
];

export default function EnergyMeteringAutomationPage() {
  return (
    <ServiceDetailLayout
      active="/services/electrical/energy-metering-automation"
      title={<>АВТОМАТИЗАЦИЯ И УЧЁТ<br />ЭЛЕКТРОЭНЕРГИИ</>}
      slogan={<>Соберём учёт и передачу данных так, чтобы потребление было видно по зонам.<br />Без ручного сбора показаний и спорных цифр.</>}
    >
      {/* показатели */}
      <DetailStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — путь данных от счётчика до контроля */}
      <section>
        <SectionHead label="Данные" title="Путь данных: от счётчика до контроля" />
        <MatrixTable columns={["Источник данных", "Что передаёт", "Где используется"]} rows={SOURCES} highlightLast />
      </section>

      {/* эффект — до / после автоматизации */}
      <section>
        <SectionHead label="Эффект" title="До и после автоматизации" />
        <BeforeAfterGrid before={BEFORE} after={AFTER} />
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Хотите видеть потребление по зонам?"
        text="Опишите объект и точки учёта — предложим схему сбора, передачи и хранения данных."
        button="Обсудить автоматизацию учёта"
      />
    </ServiceDetailLayout>
  );
}
