// src/pages/services/electrical/backup-power.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import {
  DetailStatGrid, SectionHead, MatrixTable, MiniTabs, ServiceCTA, BG, INK, MUTED,
} from "@/components/services/detailBlocks.jsx";

const STATS = [
  { label: "Резерв", value: "ДГУ" },
  { label: "АВР", value: "опция" },
  { label: "ИБП", value: "опция" },
  { label: "Нагрузки", value: "приоритет" },
];

// главный блок — таблица режимов питания
const MODES = [
  ["Основное питание", "Все нагрузки объекта", "Штатный режим", "Качество ввода, баланс фаз"],
  ["ИБП", "Серверная, связь, охрана", "Мгновенно при пропадании", "Время автономии, ёмкость"],
  ["ДГУ", "Критичные и важные линии", "При длительном отключении", "Запуск, топливо, обслуживание"],
  ["АВР", "Переключение между вводами", "При потере основного ввода", "Логику, время, источники"],
  ["Ручной резерв", "Отдельные линии", "По решению эксплуатации", "Понятную схему, маркировку"],
  ["Критичные линии", "Серверная, охрана, инженерия", "Всегда в приоритете", "Выделение, резерв, защиту"],
];

// доп. блок — критичные нагрузки по типам
const LOADS = {
  server: {
    label: "Серверная",
    cant: "Серверы, СХД, сетевое оборудование, охлаждение стойки.",
    lines: "Отдельные линии на ИБП и резерв.",
    check: "Время автономии, тепловыделение, заземление.",
  },
  security: {
    label: "Охрана и связь",
    cant: "Видеонаблюдение, СКУД, связь, пожарную сигнализацию.",
    lines: "Выделенные линии с резервом и ИБП.",
    check: "Автономность, приоритет, целостность контура.",
  },
  engineering: {
    label: "Инженерия",
    cant: "Насосы, вентиляцию критичных зон, автоматику.",
    lines: "Силовые линии с приоритетом и АВР.",
    check: "Пусковые токи, резерв, логику включения.",
  },
  production: {
    label: "Производство",
    cant: "Линии непрерывного цикла, управляющие контроллеры.",
    lines: "Отдельные группы под критичное оборудование.",
    check: "Последствия остановки, пусковые режимы, резерв.",
  },
  cold: {
    label: "Холод/технология",
    cant: "Холодильные камеры, технологическое охлаждение.",
    lines: "Приоритетные линии с резервным питанием.",
    check: "Допустимое время простоя, мощность, автоматику.",
  },
};

const LOAD_FIELDS = [
  { key: "cant", label: "Что нельзя отключать" },
  { key: "lines", label: "Какие линии выделить" },
  { key: "check", label: "Что проверить перед подключением" },
];

function LoadTabs() {
  const keys = Object.keys(LOADS);
  const [k, setK] = React.useState(keys[0]);
  const cur = LOADS[k];
  return (
    <div>
      <MiniTabs items={keys.map((x) => ({ key: x, label: LOADS[x].label }))} value={k} onChange={setK} />
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginTop: 18, gap: 12 }}>
        {LOAD_FIELDS.map((f) => (
          <div key={f.key} style={{ padding: 16, border: `1px solid ${INK}`, borderRadius: 12, background: BG }}>
            <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400, marginBottom: 8 }}>{f.label}</div>
            <div style={{ fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222" }}>{cur[f.key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BackupPowerPage() {
  return (
    <ServiceDetailLayout
      active="/services/electrical/backup-power"
      title={<>РЕЗЕРВНОЕ<br />ЭЛЕКТРОСНАБЖЕНИЕ</>}
      slogan={<>Разделим нагрузки по приоритету и подготовим резервное питание.<br />Чтобы критичные системы не зависели от одного ввода.</>}
    >
      {/* показатели */}
      <DetailStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — режимы питания */}
      <section>
        <SectionHead label="Режимы" title="Режимы питания и приоритеты" />
        <MatrixTable columns={["Режим питания", "Что питает", "Когда включается", "Что важно"]} rows={MODES} highlightLast />
      </section>

      {/* доп. блок — критичные нагрузки */}
      <section>
        <SectionHead label="Нагрузки" title="Критичные нагрузки" />
        <LoadTabs />
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Нужно защитить критичные системы?"
        text="Перечислите критичные нагрузки — поможем разделить их по приоритету и подобрать резерв."
        button="Определить критичные нагрузки"
      />
    </ServiceDetailLayout>
  );
}
