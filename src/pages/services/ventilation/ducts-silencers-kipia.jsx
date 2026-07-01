// src/pages/services/ventilation/ducts-silencers-kipia.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ClimateStatGrid, DuctRunStrip, SystemRegister, CriticalCheckMatrix, ResultPackage, TabbedList } from "@/components/services/climateBlocks.jsx";

const BACK = { backTo: "/services/ventilation", backLabel: "Вернуться к климат-системам" };

const STATS = [
  { label: "Трасса", value: "воздух" },
  { label: "Шум", value: "контроль" },
  { label: "Клапаны", value: "узлы" },
  { label: "КИП", value: "точки" },
];

const SEGMENTS = [
  { title: "Магистраль", note: "Основной расход" },
  { title: "Поворот", note: "Смена направления" },
  { title: "Клапан", note: "Регулировка ветки" },
  { title: "Шумоглушитель", note: "Снижение шума" },
  { title: "Решётка", note: "Раздача в зоне" },
  { title: "Датчик / КИП", note: "Контроль параметра" },
];

const ROUTE = [
  ["Магистраль", "Воздуховод", "Сечение, крепления, герметичность", "Сопротивление и шум", "Нужен доступ к участкам"],
  ["Поворот", "Фасонный элемент", "Геометрию и скорость", "Лишний шум", "Без сложной разборки"],
  ["Клапан", "Регулировка потока", "Маркировку и положение", "Нельзя настроить", "Нужен люк"],
  ["Шумоглушитель", "Снижение шума", "Место установки и сопротивление", "Шум остаётся в зоне", "Нужен доступ"],
  ["Решётка", "Подача или удаление", "Направление и скорость", "Дует в людей", "Доступ для регулировки"],
  ["Датчик / КИП", "Контроль параметра", "Место и связь с автоматикой", "Неверные показания", "Доступ для обслуживания"],
];

const ALONG = [
  { key: "geom", label: "Геометрия", items: ["Сечение", "Повороты", "Отводы", "Проходки"] },
  { key: "tight", label: "Герметичность", items: ["Соединения", "Фланцы", "Уплотнения", "Проверка узлов"] },
  { key: "noise", label: "Шум", items: ["Скорость воздуха", "Источник шума", "Шумоглушитель", "Крепления"] },
  { key: "access", label: "Доступ", items: ["Клапаны", "Ревизии", "Датчики", "Обслуживание"] },
  { key: "kipia", label: "КИПиА", items: ["Датчики", "Исполнительные механизмы", "Кабели", "Связь с автоматикой"] },
];

const CRIT = [
  ["Много поворотов", "Растут сопротивление и шум", "Упрощаем маршрут"],
  ["Клапан спрятан", "Ветку нельзя настроить", "Оставляем люк"],
  ["Нет шумоглушения", "Жалобы появляются после запуска", "Проверяем источник шума"],
  ["Датчик стоит не там", "Автоматика получает неверный сигнал", "Выбираем место установки"],
  ["Нет маркировки", "Эксплуатация не понимает ветки", "Подписываем узлы"],
];

const RESULT = [
  { title: "Трасса", text: "Воздуховоды, крепления, проходки." },
  { title: "Узлы", text: "Клапаны, решётки, шумоглушители." },
  { title: "Контроль", text: "Датчики и КИП, связь с автоматикой." },
  { title: "Доступ", text: "Люки, ревизии, маркировка." },
];

export default function DuctsSilencersKipiaPage() {
  return (
    <ServiceDetailLayout
      active="/services/ventilation/ducts-silencers-kipia"
      title={<>ВОЗДУХОВОДЫ, ШУМОГЛУШЕНИЕ,<br />КИПиА</>}
      slogan={<>Соберём трассы, шумоглушители, клапаны и точки контроля.<br />Чтобы воздух шёл по маршруту, а узлы оставались доступными.</>}
    >
      <ClimateStatGrid items={STATS} />

      <section>
        <SectionHead label="Трасса" title="Схема трассы" />
        <DuctRunStrip segments={SEGMENTS} />
      </section>

      <section>
        <SectionHead label="Узлы" title="Регистр трассы" />
        <SystemRegister columns={["Участок", "Узел", "Что проверяем", "Риск", "Доступ"]} rows={ROUTE} />
      </section>

      <section>
        <SectionHead label="Трасса" title="Что важно по трассе" />
        <TabbedList tabs={ALONG} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Ошибки трассы" />
        <CriticalCheckMatrix columns={["Ошибка", "Что происходит", "Как делаем иначе"]} rows={CRIT} />
      </section>

      <section>
        <SectionHead label="Результат" title="Что остаётся после работ" />
        <ResultPackage items={RESULT} />
      </section>

      <ServiceCTA
        title="Нужно собрать трассу без скрытых проблем?"
        text="Отправьте план потолков или схему вентиляции — разберём трассы, клапаны, шум и точки контроля."
        button="Разобрать трассу"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
