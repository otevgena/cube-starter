// src/pages/services/ventilation/hvac-automation.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ScenarioSwitcher, BeforeAfterGrid, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ClimateStatGrid, SignalRouteBoard, CriticalCheckMatrix } from "@/components/services/climateBlocks.jsx";

const BACK = { backTo: "/services/ventilation", backLabel: "Вернуться к климат-системам" };

const STATS = [
  { label: "Датчики", value: "сигналы" },
  { label: "Шкафы", value: "управление" },
  { label: "Сценарии", value: "режимы" },
  { label: "BMS", value: "опция" },
];

const SIGNALS = [
  { sensor: "Температура", action: "Нагрев / охлаждение", where: "Зоны климата и контуры", check: "Место установки датчика" },
  { sensor: "CO₂", action: "Усиление вентиляции", where: "Переговорные и офисы", check: "Корректность показаний" },
  { sensor: "Давление", action: "Контроль фильтра / вентилятора", where: "Приточные установки", check: "Пороги срабатывания" },
  { sensor: "Протечка", action: "Отключение / уведомление", where: "Дренаж и техзоны", check: "Сценарий реакции" },
  { sensor: "Состояние клапана", action: "Подтверждение положения", where: "Вентиляция", check: "Факт выполнения команды" },
  { sensor: "Авария оборудования", action: "Журнал и уведомление", where: "Диспетчеризация", check: "Читаемый статус" },
];

const FIELDS = [
  { key: "happens", label: "Что происходит" },
  { key: "systems", label: "Какие системы" },
  { key: "check", label: "Что проверить" },
];
const SCEN = [
  { key: "day", label: "День", happens: "Рабочие режимы по расписанию и нагрузке.", systems: "Вентиляция, холод, тепло.", check: "Комфорт и реакцию на нагрузку." },
  { key: "night", label: "Ночь", happens: "Снижение режимов и дежурное поддержание.", systems: "Вентиляция, отопление.", check: "Экономию и минимальные режимы." },
  { key: "alarm", label: "Авария", happens: "Отработка нештатной ситуации по приоритету.", systems: "Все связанные системы.", check: "Сигналы, отключения, оповещение." },
  { key: "season", label: "Сезон", happens: "Переключение лето/зима, нагрев/холод.", systems: "Тепло, холод, насосы.", check: "Готовность к смене режима." },
  { key: "manual", label: "Ручной режим", happens: "Управление эксплуатацией вручную.", systems: "Выбранные узлы.", check: "Безопасный выход из ручного режима." },
];

const BEFORE = { items: ["Оборудование включают вручную", "Аварии видят поздно", "Статусы разрознены", "Режимы зависят от персонала", "Нет истории"] };
const AFTER = { items: ["Режимы работают по сценарию", "Аварии фиксируются", "Статусы видны", "Оборудование связано логикой", "Есть база для диспетчеризации"] };

const CRIT = [
  ["Датчик стоит не там", "Система получает неверный параметр", "Проверяем место установки"],
  ["Нет обратной связи", "Команда ушла, но статус неизвестен", "Закладываем подтверждения"],
  ["Сценарий описан общо", "Эксплуатация действует вручную", "Фиксируем условия"],
  ["Шкаф не подписан", "Обслуживание затруднено", "Маркируем цепи"],
  ["Нет журнала аварий", "Причины теряются", "Выводим события"],
];

export default function HvacAutomationPage() {
  return (
    <ServiceDetailLayout
      active="/services/ventilation/hvac-automation"
      title={<>АВТОМАТИКА<br />ОВиК</>}
      slogan={<>Свяжем датчики, шкафы, приводы и сценарии управления.<br />Чтобы климатические системы работали по логике объекта, а не вручную.</>}
    >
      <ClimateStatGrid items={STATS} />

      <section>
        <SectionHead label="Сигналы" title="Маршруты сигналов ОВиК" />
        <SignalRouteBoard rows={SIGNALS} />
      </section>

      <section>
        <SectionHead label="Сценарии" title="Сценарии управления" />
        <ScenarioSwitcher scenarios={SCEN} fields={FIELDS} />
      </section>

      <section>
        <SectionHead label="Эффект" title="До / после автоматики" />
        <BeforeAfterGrid before={BEFORE} after={AFTER} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Ошибки автоматики" />
        <CriticalCheckMatrix columns={["Ошибка", "Что происходит", "Как делаем иначе"]} rows={CRIT} />
      </section>

      <ServiceCTA
        title="Нужно связать климатические системы логикой управления?"
        text="Опишите оборудование, датчики и режимы объекта — соберём понятную структуру автоматики ОВиК."
        button="Разобрать автоматику"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
