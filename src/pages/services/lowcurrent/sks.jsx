// src/pages/services/lowcurrent/sks.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, MatrixTable, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { SignalStatGrid, PatchPanel } from "@/components/services/lowcurrentBlocks.jsx";

const BACK = { backTo: "/services/lowcurrent", backLabel: "Вернуться к слаботочным системам" };

const STATS = [
  { label: "Линии", value: "медь/опт" },
  { label: "Категория", value: "Cat 5e–6A" },
  { label: "Кроссы", value: "патч-панель" },
  { label: "Маркир.", value: "100%" },
];

// главный блок — карта портов (иллюстративная патч-панель, не калькулятор)
const PORTS = Array.from({ length: 24 }, (_, i) => ({
  n: i + 1,
  state: i < 14 ? "used" : i < 20 ? "free" : "reserve",
}));

const MEDIA = [
  ["Медь Cat 5e–6A", "Рабочие места, СКС-розетки", "Длину линии, категорию, разделку"],
  ["Оптика", "Магистрали, между зданиями", "Затухание, сварку, кроссы"],
  ["Патч-панель", "Кроссовые узлы", "Порты, маркировку, органайзеры"],
  ["Кабельные трассы", "Лотки, короба, стояки", "Радиусы, разделение, запас"],
];

export default function SksPage() {
  return (
    <ServiceDetailLayout
      active="/services/lowcurrent/sks"
      title={<>СКС И СТРУКТУРИРОВАННЫЕ<br />КАБЕЛЬНЫЕ СЕТИ</>}
      slogan={<>Разведём порты, кроссы и шкафы так, чтобы сеть было легко обслуживать.<br />Без хаоса в патч-кордах и неподписанных линий.</>}
    >
      <SignalStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — карта портов */}
      <section>
        <SectionHead label="Порты" title="Карта портов" />
        <PatchPanel ports={PORTS} />
      </section>

      {/* среда передачи */}
      <section>
        <SectionHead label="Среда" title="Чем и где ведём линии" />
        <MatrixTable columns={["Среда передачи", "Где применяется", "Что проверяем"]} rows={MEDIA} highlightLast />
      </section>

      <ServiceCTA
        title="Нужно навести порядок в портах и кроссах?"
        text="Пришлите план объекта и рабочие места — предложим схему линий, кроссов и маркировки."
        button="Обсудить СКС"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
