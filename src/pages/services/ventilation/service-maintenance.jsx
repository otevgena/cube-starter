// src/pages/services/ventilation/service-maintenance.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ScenarioSwitcher, BeforeAfterGrid, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ClimateStatGrid, ServiceJournal, CriticalCheckMatrix } from "@/components/services/climateBlocks.jsx";

const BACK = { backTo: "/services/ventilation", backLabel: "Вернуться к климат-системам" };

const STATS = [
  { label: "ТО", value: "регламент" },
  { label: "Фильтры", value: "замена" },
  { label: "Журнал", value: "фиксация" },
  { label: "Аварии", value: "реакция" },
];

const JOURNAL = [
  ["Ежемесячно", "Шум, вибрации, ошибки, доступ", "Замечания и состояние узлов", "Планируем действия"],
  ["Ежеквартально", "Фильтры, крепления, дренаж, клапаны", "Загрязнение и замены", "Обновляем журнал"],
  ["Сезонно", "Лето-зима, нагрев, холод, насосы", "Готовность к режиму", "Готовим систему к сезону"],
  ["По событию", "Аварию, узел, причину", "Событие и реакцию", "Устраняем причину"],
  ["После ремонта", "Восстановление, настройки, доступ", "Что заменено", "Подтверждаем работу"],
];

const FIELDS = [
  { key: "nodes", label: "Узлы" },
  { key: "check", label: "Что проверяем" },
  { key: "fix", label: "Что фиксируем" },
];
const WHAT = [
  { key: "vent", label: "Вентиляция", nodes: "Установки, вентиляторы, фильтры, клапаны.", check: "Расход, шум, состояние фильтров.", fix: "Замены и замечания." },
  { key: "cond", label: "Кондиционирование", nodes: "Блоки, теплообменники, трассы, дренаж.", check: "Работу блоков, дренаж, ошибки.", fix: "Загрязнение и сбои." },
  { key: "heat", label: "Отопление", nodes: "Насосы, арматура, контуры.", check: "Давление, баланс, режим.", fix: "Отклонения и настройки." },
  { key: "auto", label: "Автоматика", nodes: "Датчики, шкафы, сценарии.", check: "Сигналы, аварии, связь.", fix: "Сбои и статусы." },
  { key: "drain", label: "Дренаж", nodes: "Уклоны, насосы, ревизии.", check: "Засоры, протечки, работу насосов.", fix: "Очистку и замечания." },
];

const BEFORE = { title: "Без регламента", items: ["Фильтры меняют после жалоб", "Ошибки не фиксируются", "Сервис реагирует только на аварию", "Непонятно состояние узлов", "Сезон начинается с проблем"] };
const AFTER = { title: "С регламентом", items: ["Узлы проверяются заранее", "Замены фиксируются", "Аварии попадают в журнал", "Эксплуатация видит состояние", "Сезонная подготовка понятна"] };

const CRIT = [
  ["Дата обслуживания", "История работ", "Понятная хронология"],
  ["Состояние фильтров", "Контроль загрязнения", "Планирование замен"],
  ["Замечания", "Не потерять проблему", "Список действий"],
  ["Аварии", "Видеть повторения", "Поиск причины"],
  ["Замены", "Понимать ресурс", "Контроль оборудования"],
];

export default function ServiceMaintenancePage() {
  return (
    <ServiceDetailLayout
      active="/services/ventilation/service-maintenance"
      title={<>СЕРВИС И РЕГЛАМЕНТНОЕ<br />ОБСЛУЖИВАНИЕ</>}
      slogan={<>Соберём регламент под оборудование и режим объекта.<br />Чтобы фильтры, дренаж, автоматика и аварии не вспоминали о себе внезапно.</>}
    >
      <ClimateStatGrid items={STATS} />

      <section>
        <SectionHead label="Регламент" title="Регламент обслуживания" />
        <ServiceJournal columns={["Период", "Что проверяем", "Что фиксируем", "Что делаем дальше"]} rows={JOURNAL} />
      </section>

      <section>
        <SectionHead label="Объём" title="Что обслуживаем" />
        <ScenarioSwitcher scenarios={WHAT} fields={FIELDS} />
      </section>

      <section>
        <SectionHead label="Эффект" title="Без регламента / с регламентом" />
        <BeforeAfterGrid before={BEFORE} after={AFTER} />
      </section>

      <section>
        <SectionHead label="Журнал" title="Что фиксировать в журнале" />
        <CriticalCheckMatrix columns={["Запись", "Зачем", "Что даёт"]} rows={CRIT} />
      </section>

      <ServiceCTA
        title="Нужно перевести системы на регламент?"
        text="Отправьте список оборудования или фото узлов — соберём структуру обслуживания и контрольные точки."
        button="Составить регламент ТО"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
