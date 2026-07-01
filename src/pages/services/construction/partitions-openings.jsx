// src/pages/services/construction/partitions-openings.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { BuildStatGrid, SpaceDividerBoard, ToleranceMatrix, TabbedList, DefectRiskTable, AcceptancePackage } from "@/components/services/constructionBlocks.jsx";

const BACK = { backTo: "/services/construction", backLabel: "Вернуться к общестрою" };

const STATS = [
  { label: "ГКЛ", value: "геом." },
  { label: "Проёмы", value: "узлы" },
  { label: "Примык.", value: "стык" },
  { label: "Усил.", value: "каркас" },
];

const STEPS = [
  { title: "Разметка", do: "Выносим оси перегородок и проёмов.", check: "Привязку и геометрию.", mistake: "Уходит планировка.", result: "Корректная ось." },
  { title: "Каркас / основание", do: "Ставим каркас или основание стены.", check: "Жёсткость и шаг.", mistake: "Вибрации и слабость.", result: "Стабильная база." },
  { title: "Заполнение", do: "Зашиваем и заполняем конструкцию.", check: "Слои и стыки.", mistake: "Пустоты и слабые места.", result: "Готовая плоскость." },
  { title: "Проёмы", do: "Формируем дверные и технологические проёмы.", check: "Размер и усиление.", mistake: "Дверь не садится как нужно.", result: "Готовый проём." },
  { title: "Усиления", do: "Усиливаем нагруженные узлы.", check: "Схему и привязку.", mistake: "Деформация узла.", result: "Надёжный узел." },
  { title: "Примыкания", do: "Прорабатываем стыки к потолку, полу, стенам.", check: "Компенсацию и стык.", mistake: "Трещины на примыканиях.", result: "Живой узел." },
];

const TOLERANCE = [
  ["Линия перегородки", "Привязку и геометрию", "Уходит планировка", "Корректная ось"],
  ["Каркас", "Жёсткость и шаг", "Вибрации и слабость", "Стабильная база"],
  ["Проём", "Размер и усиление", "Дверь не садится как нужно", "Готовый проём"],
  ["Примыкание к потолку", "Компенсацию и стык", "Трещины", "Живой узел"],
  ["Инженерные проходы", "Координацию", "Вскрытие узлов", "Узел без конфликтов"],
];

const TYPES = [
  { key: "gkl", label: "ГКЛ-перегородки", items: ["Металлокаркас", "Заполнение и звукоизоляция", "Аккуратные примыкания"] },
  { key: "masonry", label: "Кладочные", items: ["Разметка и перевязка", "Армирование рядов", "Крепление к конструкциям"] },
  { key: "doors", label: "Дверные проёмы", items: ["Точный размер", "Усиление стоек", "Готовность под коробку"] },
  { key: "reinforced", label: "Усиленные узлы", items: ["Нагруженные участки", "Схема усиления", "Контроль сопряжений"] },
  { key: "combo", label: "Комбинированные", items: ["Разные материалы", "Стыки систем", "Единая геометрия"] },
];

const DEFECTS = [
  ["Нет точной разметки", "Вся планировка уходит", "Фиксируем оси"],
  ["Слабый каркас", "Перегородка живёт своей жизнью", "Контролируем жёсткость"],
  ["Проём без усиления", "Деформация узла", "Собираем правильную схему"],
  ["Примыкания сделаны формально", "Трещины и отслоения", "Проверяем переходы"],
  ["Инженерия не учтена", "Перегородки вскрывают", "Координируем с системами"],
];

const ACCEPTANCE = [
  { title: "Геометрия", text: "Оси и плоскости соответствуют планировке." },
  { title: "Проёмы", text: "Размеры и усиления под установку." },
  { title: "Узлы", text: "Примыкания и сопряжения проверены." },
  { title: "Готовность", text: "Пространство готово под отделку." },
];

export default function PartitionsOpeningsPage() {
  return (
    <ServiceDetailLayout
      active="/services/construction/partitions-openings"
      title={<>ВНУТРЕННИЕ ПЕРЕГОРОДКИ<br />И ПРОЁМЫ</>}
      slogan={<>Соберём внутреннюю геометрию объекта: перегородки, проёмы, усиления и примыкания.<br />Чтобы пространство формировалось по логике помещения, а не по месту.</>}
    >
      {/* SIGNATURE — сборка внутреннего пространства */}
      <section>
        <SectionHead label="Сборка" title="Сборка внутреннего пространства" />
        <SpaceDividerBoard steps={STEPS} />
      </section>

      <BuildStatGrid items={STATS} />

      <section>
        <SectionHead label="Контроль" title="Ключевые узлы перегородок" />
        <ToleranceMatrix columns={["Узел", "Что проверяем", "Риск", "Результат"]} rows={TOLERANCE} />
      </section>

      <section>
        <SectionHead label="Конструкции" title="Тип конструкции" />
        <TabbedList tabs={TYPES} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Что ломает внутреннюю геометрию" />
        <DefectRiskTable columns={["Проблема", "Что происходит", "Как закрываем"]} rows={DEFECTS} />
      </section>

      <section>
        <SectionHead label="Готовность" title="Что должно быть готово" />
        <AcceptancePackage items={ACCEPTANCE} />
      </section>

      <ServiceCTA
        title="Нужно собрать перегородки и проёмы без переделок?"
        text="Отправьте планировку и задачу по пространству — разложим этапы, узлы и критические точки."
        button="Разобрать перегородки и проёмы"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
