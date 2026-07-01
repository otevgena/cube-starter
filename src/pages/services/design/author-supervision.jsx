// src/pages/services/design/author-supervision.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, FieldIssueBoard, SupervisionLog, TabbedList, ProjectRiskMatrix } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "Надзор", value: "АН" },
  { label: "Замеч.", value: "журнал" },
  { label: "Статус", value: "контроль" },
  { label: "Выезды", value: "объект" },
];

const BOARD = [
  { title: "Обнаружено", cards: [{ name: "Трасса ушла от проекта", ref: "щитовая" }, { name: "Заменено оборудование", ref: "спецификация" }] },
  { title: "Требует решения", cards: [{ name: "Конфликт со смежниками", ref: "потолок" }, { name: "Нет доступа к узлу", ref: "трасса" }] },
  { title: "Корректировка", cards: [{ name: "Нужен новый лист", ref: "серверная" }] },
  { title: "Принято", cards: [{ name: "Обновлена привязка шкафа", ref: "серверная" }] },
  { title: "Закрыто", cards: [{ name: "Спецификация приведена к факту", ref: "выпуск" }] },
];

const LOG = [
  ["01 · щитовая", "Трасса ушла от проекта", "Согласовать корректировку", "В работе"],
  ["02 · потолок", "Конфликт с вентиляцией", "Проверить смежный лист", "На проверке"],
  ["03 · серверная", "Изменилось место шкафа", "Обновить привязку", "Решено"],
  ["04 · трасса", "Нет доступа к узлу", "Предложить новый маршрут", "Замечание"],
  ["05 · спецификация", "Заменено оборудование", "Проверить аналог", "На согласовании"],
];

const TABS = [
  { key: "sheets", label: "По листам", items: ["Несоответствие чертежу", "Устаревший выпуск", "Нет привязки"] },
  { key: "nodes", label: "По узлам", items: ["Узел невозможно выполнить", "Не хватает доступа", "Требуется детализация"] },
  { key: "adjacent", label: "По смежникам", items: ["Конфликт трасс", "Изменение архитектуры", "Совместное решение"] },
  { key: "swaps", label: "По заменам", items: ["Оборудование заменено", "Параметры отличаются", "Нужен аналог"] },
  { key: "fact", label: "По факту", items: ["Скрытые условия", "Ограничение объекта", "Исполнительное решение"] },
];

const RISKS = [
  ["Замечания в мессенджерах", "Решения теряются", "Ведём журнал"],
  ["Нет привязки к листу", "Непонятно, что менять", "Фиксируем лист и узел"],
  ["Замены без проверки", "Система расходится с проектом", "Проверяем параметры"],
  ["Смежники меняют трассы", "Появляются конфликты", "Согласуем корректировку"],
  ["Статус не ведётся", "Замечание зависает", "Обновляем состояние"],
];

export default function AuthorSupervisionPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/author-supervision"
      title={<>АВТОРСКИЙ<br />НАДЗОР</>}
      slogan={<>Переведём вопросы объекта в журнал замечаний, решений и статусов.<br />Чтобы проект не превращался в устные договорённости на площадке.</>}
    >
      <ProjectStatGrid items={STATS} />

      {/* SIGNATURE — доска полевых отклонений */}
      <section>
        <SectionHead label="Доска" title="Доска полевых отклонений" />
        <FieldIssueBoard columns={BOARD} />
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 300, color: "#777" }}>Пример интерфейса доски, не реальные данные объекта.</div>
      </section>

      <section>
        <SectionHead label="Журнал" title="Журнал авторского надзора" />
        <SupervisionLog columns={["Узел / лист", "Замечание", "Решение", "Статус"]} rows={LOG} />
      </section>

      <section>
        <SectionHead label="Типы" title="Типы замечаний" />
        <TabbedList tabs={TABS} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Что ломает авторский надзор" />
        <ProjectRiskMatrix columns={["Проблема", "Что ломается", "Как закрываем"]} rows={RISKS} />
      </section>

      <ServiceCTA
        title="Нужно контролировать проект на объекте?"
        text="Отправьте проект и текущие вопросы монтажа — поможем вести замечания, решения и статусы."
        button="Организовать авторский надзор"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
