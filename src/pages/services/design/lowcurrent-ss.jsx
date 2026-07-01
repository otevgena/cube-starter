// src/pages/services/design/lowcurrent-ss.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, LowcurrentAtlasBoard, ChainStrip, ProjectRiskMatrix, TabbedList } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "Системы", value: "атлас" },
  { label: "Точки", value: "план" },
  { label: "Трассы", value: "кабель" },
  { label: "Шкафы", value: "узлы" },
];

const SYSTEMS = [
  { name: "СКС", points: "Рабочие места, розетки, порты.", routes: "Кабельные маршруты до кроссовой.", nodes: "Патч-панели, кроссы, органайзеры.", sheets: "План портов, структурная схема.", spec: "Кабель, патч-панели, шкаф.", risk: "Порты не совпадают с планом рабочих мест." },
  { name: "CCTV", points: "Камеры по зонам наблюдения.", routes: "Кабельные маршруты до шкафа / серверной.", nodes: "Архив, PoE, сеть.", sheets: "План камер, структурная схема.", spec: "Камеры, коммутаторы, архив.", risk: "Камера есть на плане, но не закрывает задачу зоны." },
  { name: "СКУД", points: "Двери, считыватели, замки.", routes: "Линии до контроллеров.", nodes: "Контроллеры, питание, сервер.", sheets: "План точек, схема, матрица доступа.", spec: "Контроллеры, считыватели, замки.", risk: "Нет ролей доступа — система непонятна эксплуатации." },
  { name: "ОПС", points: "Извещатели по зонам.", routes: "Шлейфы до прибора.", nodes: "Прибор, питание, оповещение.", sheets: "План зон, схемы, ведомость.", spec: "Извещатели, прибор, оповещатели.", risk: "Смешаны зоны — эксплуатация не читает систему." },
  { name: "Оповещение", points: "Громкоговорители по зонам.", routes: "Линии до усилителей.", nodes: "Усилитель, контроллер зон, шкаф.", sheets: "План зон, схемы.", spec: "Оборудование, линии, шкаф.", risk: "Одна зона на весь объект — звук не работает." },
  { name: "Серверная", points: "Стойки и оборудование.", routes: "Кроссировка и питание.", nodes: "Стойки, кроссы, ИБП.", sheets: "Схема узла, спецификация.", spec: "Стойки, коммутаторы, ИБП.", risk: "Узел собран без доступа для обслуживания." },
];

const ROUTE = ["Точка", "Линия", "Шкаф", "Лист", "Спецификация"];

const RISKS = [
  ["Системы проектируются отдельно", "Конфликты трасс и шкафов", "Собираем общий атлас"],
  ["Камера без задачи", "План есть, пользы мало", "Привязываем к зоне"],
  ["СКУД без ролей", "Доступ непонятен", "Фиксируем матрицу"],
  ["Нет кроссовой логики", "Шкафы перегружены", "Проектируем узлы"],
  ["Спецификация не связана с точками", "Закупка расходится", "Сверяем листы"],
];

const TABS = [
  { key: "points", label: "Точки", items: ["Расположение устройств", "Назначение зон", "Привязка к плану"] },
  { key: "routes", label: "Трассы", items: ["Маршруты линий", "Пересечения", "Запас и доступ"] },
  { key: "cabinets", label: "Шкафы", items: ["Кроссовые узлы", "Питание", "Свободные порты"] },
  { key: "matrix", label: "Матрицы", items: ["Роли доступа", "Зоны наблюдения", "Сценарии"] },
  { key: "spec", label: "Спецификация", items: ["Оборудование", "Кабель и материалы", "Связь с точками"] },
];

export default function LowcurrentSsPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/lowcurrent-ss"
      title={<>ПРОЕКТ СС<br />СЛАБОТОЧНЫЕ СИСТЕМЫ</>}
      slogan={<>Соберём камеры, доступ, порты, оповещение и шкафы в единый атлас систем.<br />Чтобы каждая точка имела трассу, узел и спецификацию.</>}
    >
      {/* SIGNATURE — атлас систем */}
      <section>
        <SectionHead label="Атлас" title="Атлас слаботочных систем" />
        <LowcurrentAtlasBoard systems={SYSTEMS} />
      </section>

      <ProjectStatGrid items={STATS} />

      <section>
        <SectionHead label="Маршрут" title="От точки до спецификации" />
        <ChainStrip items={ROUTE} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Что ломает проект СС" />
        <ProjectRiskMatrix columns={["Ошибка", "Что ломается", "Как проверяем"]} rows={RISKS} />
      </section>

      <section>
        <SectionHead label="Состав" title="Из чего складывается раздел" />
        <TabbedList tabs={TABS} />
      </section>

      <ServiceCTA
        title="Нужно собрать слаботочные системы в один проект?"
        text="Отправьте планировки и список систем — соберём атлас точек, трасс, шкафов и спецификаций."
        button="Собрать проект СС"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
