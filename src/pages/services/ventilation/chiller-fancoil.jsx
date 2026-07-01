// src/pages/services/ventilation/chiller-fancoil.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, BeforeAfterGrid, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ClimateStatGrid, NodeChainRail, CriticalCheckMatrix } from "@/components/services/climateBlocks.jsx";

const BACK = { backTo: "/services/ventilation", backLabel: "Вернуться к климат-системам" };

const STATS = [
  { label: "Чиллер", value: "холод" },
  { label: "Контур", value: "вода" },
  { label: "Насосы", value: "группа" },
  { label: "Фанкойлы", value: "зоны" },
];

const LOOP = [
  { title: "Чиллер", fn: "Подготовка холодоносителя.", check: "Место, доступ, шум.", risk: "Нет сервисного пространства." },
  { title: "Насосная группа", fn: "Движение по контуру.", check: "Насосы, резерв, арматуру.", risk: "Нет регулирования." },
  { title: "Трубопроводы", fn: "Доставка до зон.", check: "Изоляцию, трассы, опоры.", risk: "Конденсат и потери." },
  { title: "Фанкойлы", fn: "Охлаждение помещений.", check: "Поток, шум, доступ.", risk: "Нельзя обслужить после отделки." },
  { title: "Дренаж", fn: "Отвод конденсата.", check: "Уклоны, насосы, ревизии.", risk: "Протечки." },
  { title: "Автоматика", fn: "Режимы и клапаны.", check: "Датчики, сценарии.", risk: "Гидравлика и управление отдельно." },
];

const FIT = [
  ["Большой объект", "Систему можно масштабировать", "Контуры и насосы"],
  ["Много помещений", "Фанкойлы работают локально", "Управление по зонам"],
  ["Ограничения по фреону", "Внутри здания меньше фреона", "Гидравлический контур"],
  ["Нужна диспетчеризация", "Удобно связывать с автоматикой", "Сигналы и статусы"],
  ["Нужен централизованный сервис", "Основные узлы собраны понятно", "Доступ к оборудованию"],
];

const BEFORE = { items: ["Контур собран без логики", "Насосы без резерва", "Дренаж вспоминают поздно", "Фанкойлы недоступны", "Нет понятной схемы управления"] };
const AFTER = { items: ["Контур читается", "Насосная группа обслуживается", "Фанкойлы доступны", "Дренаж учтён", "Автоматика связана с режимами"] };

export default function ChillerFancoilPage() {
  return (
    <ServiceDetailLayout
      active="/services/ventilation/chiller-fancoil"
      title={<>ЧИЛЛЕР-ФАНКОЙЛ<br />СИСТЕМЫ</>}
      slogan={<>Соберём контур холода: чиллер, насосы, трубопроводы, фанкойлы и автоматику.<br />Чтобы система масштабировалась по зонам и оставалась обслуживаемой.</>}
    >
      <ClimateStatGrid items={STATS} />

      <section>
        <SectionHead label="Контур" title="Гидравлический контур" />
        <NodeChainRail nodes={LOOP} loopNote="Замкнутый контур: обратка возвращается к чиллеру." />
      </section>

      <section>
        <SectionHead label="Применимость" title="Когда чиллер-фанкойл уместен" />
        <CriticalCheckMatrix columns={["Ситуация", "Почему подходит", "Что проверить"]} rows={FIT} />
      </section>

      <section>
        <SectionHead label="Эффект" title="До / после нормальной схемы" />
        <BeforeAfterGrid before={BEFORE} after={AFTER} />
      </section>

      <ServiceCTA
        title="Нужно собрать чиллер-фанкойл без хаоса в контурах?"
        text="Отправьте план объекта и зоны охлаждения — разложим оборудование, контуры, фанкойлы и автоматику."
        button="Разобрать чиллер-фанкойл"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
