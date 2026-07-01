// src/pages/services/lowcurrent/intercom.jsx
import React from "react";
import { SectionHead, ScenarioSwitcher, AnatomyGrid, MatrixTable, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SignalStatGrid, CallRouteBoard } from "@/components/services/lowcurrentBlocks.jsx";

const BACK = { backTo: "/services/lowcurrent", backLabel: "Вернуться к слаботочным системам" };

const STATS = [
  { label: "Вызов", value: "панель" },
  { label: "Связь", value: "IP" },
  { label: "Замок", value: "доступ" },
  { label: "Маршрут", value: "сценарий" },
];

// главный блок — маршрут вызова
const ROUTE = [
  { title: "Вызывная панель", happens: "Посетитель выбирает абонента или пост.", check: "Место установки, питание, связь, видимость.", mistake: "Панель стоит неудобно или не защищена от условий." },
  { title: "Абонент / пост", happens: "Вызов приходит на устройство, ресепшен или охрану.", check: "Список абонентов и маршрут.", mistake: "Вызовы уходят не туда." },
  { title: "Решение", happens: "Абонент принимает вызов и решает, открыть или отказать.", check: "Права и сценарии.", mistake: "Нет понятного сценария для курьеров и гостей." },
  { title: "Открытие замка", happens: "Система управляет электрозамком.", check: "Питание, тип замка, кнопку выхода.", mistake: "Замок выбран без учёта двери." },
  { title: "Событие", happens: "Система фиксирует вызов или открытие.", check: "Журнал, связь, доступ.", mistake: "Нет истории событий." },
];

const FIELDS = [
  { key: "who", label: "Кто вызывает" },
  { key: "where", label: "Куда приходит вызов" },
  { key: "decide", label: "Кто принимает решение" },
  { key: "open", label: "Что открывается" },
];
const SCENARIOS = [
  { key: "gate", label: "Калитка", who: "Посетитель или курьер.", where: "Пост охраны или абонент.", decide: "Охрана или абонент.", open: "Калитка." },
  { key: "reception", label: "Ресепшен", who: "Гость.", where: "Ресепшен.", decide: "Администратор.", open: "Дверь или турникет." },
  { key: "guard", label: "Пост охраны", who: "Посетитель.", where: "Пост охраны.", decide: "Охрана.", open: "Входная дверь или ворота." },
  { key: "courier", label: "Курьер", who: "Курьер.", where: "Ресепшен или пост.", decide: "Ответственный сотрудник.", open: "Дверь по сценарию." },
  { key: "tenants", label: "Арендаторы", who: "Посетитель арендатора.", where: "Абонент арендатора.", decide: "Арендатор.", open: "Дверь в зону арендатора." },
];

const NODES = [
  { title: "Вызывная панель", text: "Точка вызова на входе. Проверяем: место, питание, связь." },
  { title: "Абонентские устройства", text: "Приём вызова у абонента. Проверяем: список, маршрут." },
  { title: "Пост охраны", text: "Приём вызовов и контроль. Проверяем: переключение, журнал." },
  { title: "Контроллер", text: "Логика вызова и открытия. Проверяем: сценарии, связь." },
  { title: "Замок", text: "Открытие двери. Проверяем: тип под дверь, питание." },
  { title: "Кнопка выхода", text: "Выход изнутри. Проверяем: расположение, надёжность." },
  { title: "Питание", text: "Работа системы. Проверяем: резерв, линии." },
  { title: "Сеть", text: "Связь между узлами. Проверяем: канал, доступность." },
];

const RISKS = [
  ["Панель", "Неудобное место установки", "Проверяем маршрут посетителя"],
  ["Замок", "Не подходит к двери", "Подбираем под конструкцию"],
  ["Связь", "Вызовы пропадают", "Проверяем сеть и питание"],
  ["Абоненты", "Список неактуален", "Делаем понятную структуру"],
  ["Курьеры", "Нет отдельного сценария", "Задаём маршрут вызова"],
];

export default function IntercomPage() {
  return (
    <ServiceDetailLayout
      active="/services/lowcurrent/intercom"
      title={<>ДОМОФОНИЯ<br />И ИНТЕРКОМ</>}
      slogan={<>Настроим маршрут вызова: панель, абонент, пост охраны и замок.<br />Чтобы вход был понятным для посетителей и контролируемым для объекта.</>}
    >
      <SignalStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — маршрут вызова */}
      <section>
        <SectionHead label="Маршрут" title="Маршрут вызова" />
        <CallRouteBoard steps={ROUTE} />
      </section>

      {/* сценарии входа */}
      <section>
        <SectionHead label="Сценарии" title="Сценарии входа" />
        <ScenarioSwitcher scenarios={SCENARIOS} fields={FIELDS} />
      </section>

      {/* состав системы */}
      <section>
        <SectionHead label="Состав" title="Состав системы" />
        <AnatomyGrid items={NODES} cols={2} />
      </section>

      {/* что важно предусмотреть */}
      <section>
        <SectionHead label="Внимание" title="Что важно предусмотреть" />
        <MatrixTable columns={["Узел", "Риск", "Решение"]} rows={RISKS} highlightLast />
      </section>

      <ServiceCTA
        title="Нужно настроить вход и вызовы?"
        text="Опишите точки входа, посты и абонентов — соберём понятный сценарий домофонии."
        button="Подобрать сценарий вызова"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
