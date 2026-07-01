// src/pages/services/construction/general-contracting-supervision.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { BuildStatGrid, SiteControlBoard, ToleranceMatrix, TabbedList, DefectRiskTable, AcceptancePackage } from "@/components/services/constructionBlocks.jsx";

const BACK = { backTo: "/services/construction", backLabel: "Вернуться к общестрою" };

const STATS = [
  { label: "ГП", value: "коорд." },
  { label: "Технадзор", value: "контроль" },
  { label: "Акты", value: "фиксация" },
  { label: "Узлы", value: "статус" },
];

const PANELS = [
  { title: "Подрядчики", items: ["Кто на объекте и за что отвечает", "Зоны ответственности", "Разделение потоков работ"] },
  { title: "График", items: ["Какие зоны и этапы идут сейчас", "Очередность работ", "Узкие места сроков"] },
  { title: "Замечания", items: ["Что открыто, что в работе, что закрыто", "Срок закрытия", "Ответственный"] },
  { title: "Узлы", items: ["Критические места контроля", "Скрытые работы", "Проверка до закрытия"] },
  { title: "Акты", items: ["Что должно быть зафиксировано", "Исполнительная документация", "Закрытие этапов"] },
  { title: "Статусы", items: ["Что готово", "Где узкое место", "Следующее действие"] },
];

const TOLERANCE = [
  ["Этап работ", "Соответствие очередности", "Смежники мешают друг другу", "Согласованный ход работ"],
  ["Критический узел", "Качество исполнения", "Дефект уходит дальше по цепочке", "Узел закрыт"],
  ["Замечание", "Факт и срок закрытия", "Замечание теряется", "Статус обновлён"],
  ["Акт", "Корректность фиксации", "Работы закрываются без подтверждения", "Документальная база"],
  ["Подрядчик", "Зону ответственности", "Нет владельца задачи", "Понятный контур управления"],
];

const MODES = [
  { key: "coord", label: "Координация", items: ["Распределение зон", "Очередность", "Синхронизация подрядчиков"] },
  { key: "supervision", label: "Технадзор", items: ["Контроль качества", "Скрытые работы", "Замечания и предписания"] },
  { key: "asbuilt", label: "Исполнительная", items: ["Фиксация фактического исполнения", "Схемы и акты", "Соответствие проекту"] },
  { key: "acceptance", label: "Приёмка", items: ["Проверка узлов", "Закрытие этапов", "Готовность к сдаче"] },
  { key: "status", label: "Статус объекта", items: ["Что готово", "Что в работе", "Что тормозит"] },
];

const DEFECTS = [
  ["Нет центра управления", "Стройка живёт фрагментами", "Собираем единый контур"],
  ["Замечания не фиксируются", "Проблемы повторяются", "Ведём статус"],
  ["Акты отстают", "Невозможно закрыть этап", "Синхронизируем документы"],
  ["Подрядчики не разделены по зонам", "Конфликты на объекте", "Фиксируем ответственность"],
  ["Узлы не выделены", "Критика всплывает поздно", "Заранее поднимаем контроль"],
];

const ACCEPTANCE = [
  { title: "Статус", text: "Единая картина готовности объекта." },
  { title: "Замечания", text: "Ведётся реестр открытых и закрытых пунктов." },
  { title: "Акты", text: "Этапы закрыты документально." },
  { title: "Готовность", text: "Объект управляется по системе." },
];

export default function GeneralContractingSupervisionPage() {
  return (
    <ServiceDetailLayout
      active="/services/construction/general-contracting-supervision"
      title={<>ГЕНПОДРЯД<br />И ТЕХНАДЗОР</>}
      slogan={<>Соберём объект в единый контур управления: подрядчики, замечания, акты, сроки и контроль узлов.<br />Чтобы стройка шла по системе, а не по потоку несвязанных решений.</>}
    >
      {/* SIGNATURE — штаб объекта */}
      <section>
        <SectionHead label="Штаб" title="Штаб объекта" />
        <SiteControlBoard panels={PANELS} />
      </section>

      <BuildStatGrid items={STATS} />

      <section>
        <SectionHead label="Контроль" title="Точки контроля объекта" />
        <ToleranceMatrix columns={["Узел", "Что проверяем", "Риск", "Результат"]} rows={TOLERANCE} />
      </section>

      <section>
        <SectionHead label="Режим" title="Режим управления" />
        <TabbedList tabs={MODES} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Что разваливает управление объектом" />
        <DefectRiskTable columns={["Проблема", "Что происходит", "Как закрываем"]} rows={DEFECTS} />
      </section>

      <section>
        <SectionHead label="Сдача" title="Что должно быть на выходе" />
        <AcceptancePackage items={ACCEPTANCE} />
      </section>

      <ServiceCTA
        title="Нужно собрать стройку в управляемый контур?"
        text="Опишите объект и текущую стадию — разложим координацию, технадзор, замечания и документы."
        button="Разобрать генподряд и технадзор"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
