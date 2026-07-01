// src/pages/services/lowcurrent/server-cross.jsx
import React from "react";
import { SectionHead, BeforeAfterGrid, MatrixTable, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SignalStatGrid, RackElevation, PortPassportTable } from "@/components/services/lowcurrentBlocks.jsx";

const BACK = { backTo: "/services/lowcurrent", backLabel: "Вернуться к слаботочным системам" };

const STATS = [
  { label: "Стойка", value: "19”" },
  { label: "Кросс", value: "ODF" },
  { label: "Питание", value: "PDU" },
  { label: "Маркир.", value: "100%" },
];

// главный блок — стойка как узел системы
const ZONES = [
  { zone: "Верхняя зона", holds: "Кабельный ввод, органайзеры, запас кабеля.", check: "Ввод, радиусы, запас.", ops: "Доступ к вводу и запасу." },
  { zone: "Коммутация", holds: "Патч-панели, ODF, маркировка портов.", check: "Кроссировку, маркировку, органайзеры.", ops: "Читаемую кроссировку." },
  { zone: "Активное оборудование", holds: "Коммутаторы, маршрутизатор/ядро, PoE при необходимости.", check: "Подключение, питание, охлаждение.", ops: "Понятные связи порт–оборудование." },
  { zone: "Питание", holds: "PDU, ИБП, отдельные группы питания.", check: "Нагрузку, резерв, разделение.", ops: "Разделённое и отмеченное питание." },
  { zone: "Сервисная зона", holds: "Резерв, доступ, документацию.", check: "Свободные юниты, доступ, паспорт.", ops: "Запас под расширение и паспорт узла." },
];

const BEFORE = { items: ["Патч-корды без логики", "Линии не подписаны", "Непонятно, где чей порт", "Питание подключено случайно", "Нет места для расширения"] };
const AFTER = { items: ["Порты подписаны", "Кроссировка читается", "Питание отделено", "Есть резерв", "Передан паспорт узла"] };

const PASSPORT = [
  ["Патч-панель", "Рабочие места", "PP-01", "Подписана"],
  ["ODF", "Оптика", "ODF-01", "Волокна учтены"],
  ["Коммутатор", "Доступ", "SW-01", "Порты привязаны"],
  ["PDU", "Питание", "PDU-A", "Нагрузка разделена"],
  ["ИБП", "Резерв", "UPS-01", "Подключение проверено"],
];

const ERRORS = [
  ["Нет органайзеров", "Кросс быстро превращается в хаос", "Закладываем кабель-менеджмент"],
  ["Оборудование без резерва", "Нечем расширяться", "Оставляем свободные юниты"],
  ["Питание в одной точке", "Риск отключения всего узла", "Разделяем питание"],
  ["Нет маркировки", "Поиск линии занимает время", "Подписываем порты"],
  ["Нет паспорта", "Узел нельзя обслуживать системно", "Передаём структуру"],
];

export default function ServerCrossPage() {
  return (
    <ServiceDetailLayout
      active="/services/lowcurrent/server-cross"
      title={<>СЕРВЕРНЫЕ, КРОССОВЫЕ<br />И ШКАФЫ</>}
      slogan={<>Приведём стойки, кроссы, питание и маркировку к понятной схеме.<br />Чтобы эксплуатация видела систему, а не клубок патч-кордов.</>}
    >
      <SignalStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — стойка как узел */}
      <section>
        <SectionHead label="Стойка" title="Стойка как узел системы" />
        <RackElevation zones={ZONES} />
      </section>

      {/* до / после кросса */}
      <section>
        <SectionHead label="Эффект" title="До / после кросса" />
        <BeforeAfterGrid before={BEFORE} after={AFTER} />
      </section>

      {/* маркировка узла */}
      <section>
        <SectionHead label="Паспорт" title="Маркировка узла" />
        <PortPassportTable columns={["Узел", "Назначение", "Маркировка", "Проверка"]} rows={PASSPORT} />
      </section>

      {/* ошибки серверных узлов */}
      <section>
        <SectionHead label="Внимание" title="Ошибки серверных узлов" />
        <MatrixTable columns={["Ошибка", "Что происходит", "Как делаем иначе"]} rows={ERRORS} highlightLast />
      </section>

      <ServiceCTA
        title="Нужно привести шкаф или серверную в порядок?"
        text="Отправьте фото стойки или список оборудования — предложим структуру кросса, питания и маркировки."
        button="Спланировать серверный узел"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
