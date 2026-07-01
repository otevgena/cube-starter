// src/pages/services/electrical/switchgear-vru.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import {
  DetailStatGrid, SectionHead, AnatomyGrid, MiniTabs, ServiceCTA, BG, INK,
} from "@/components/services/detailBlocks.jsx";

const STATS = [
  { label: "Узел", value: "ВРУ" },
  { label: "Защита", value: "автоматы" },
  { label: "Учёт", value: "приборы" },
  { label: "Маркир.", value: "100%" },
];

// главный блок — анатомия щита
const NODES = [
  { title: "Ввод", text: "Приём питания на щит. Проверяем: номинал, контакты, защиту ввода." },
  { title: "Коммутация", text: "Переключение и распределение. Проверяем: рубильники, схему, надёжность контактов." },
  { title: "Защита", text: "Отключение при перегрузке и КЗ. Проверяем: номиналы автоматов, селективность, УЗО." },
  { title: "Учёт", text: "Контроль потребления. Проверяем: приборы учёта, трансформаторы тока, подключение." },
  { title: "АВР", text: "Автоматический ввод резерва. Проверяем: логику переключения, время, источники." },
  { title: "Отходящие линии", text: "Питание потребителей и зон. Проверяем: сечения, защиту, маркировку." },
  { title: "Резерв", text: "Запас под развитие. Проверяем: свободные модули, место, ввод." },
  { title: "Маркировка", text: "Понятная эксплуатация. Проверяем: подписи линий, схему, бирки." },
];

// доп. блок — проверка щита на трёх стадиях
const CHECK = {
  pre: { label: "До сборки", items: ["Схема", "Номиналы", "Оборудование", "Место установки", "Запас модулей"] },
  post: { label: "После сборки", items: ["Затяжка соединений", "Соответствие схеме", "Маркировка", "Разделение линий", "Аккуратность коммутации"] },
  final: { label: "Перед сдачей", items: ["Измерения", "Фотофиксация", "Исполнительная схема", "Подписи линий", "Передача эксплуатации"] },
};

function CheckTabs() {
  const keys = Object.keys(CHECK);
  const [k, setK] = React.useState(keys[0]);
  return (
    <div>
      <MiniTabs items={keys.map((x) => ({ key: x, label: CHECK[x].label }))} value={k} onChange={setK} />
      <ul className="grid grid-cols-1 sm:grid-cols-2" style={{ margin: "18px 0 0", padding: 0, listStyle: "none", gap: 10 }}>
        {CHECK[k].items.map((it, i) => (
          <li key={i} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "12px 16px", border: `1px solid ${INK}`, borderRadius: 12, background: BG }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 15, lineHeight: "22px", fontWeight: 300, color: "#222" }}>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SwitchgearVruPage() {
  return (
    <ServiceDetailLayout
      active="/services/electrical/switchgear-vru"
      title={<>МОНТАЖ ЭЛЕКТРОЩИТОВ<br />И ВРУ</>}
      slogan={<>Соберём щиты и ВРУ с понятной логикой, защитой и маркировкой.<br />Чтобы эксплуатация не разбиралась в них заново.</>}
    >
      {/* показатели */}
      <DetailStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — анатомия щита */}
      <section>
        <SectionHead label="Состав" title="Анатомия щита" />
        <AnatomyGrid items={NODES} cols={2} />
      </section>

      {/* доп. блок — проверка щита */}
      <section>
        <SectionHead label="Контроль" title="Проверка щита" />
        <CheckTabs />
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Нужен щит, в котором разберётся эксплуатация?"
        text="Опишите объект и нагрузки — подберём состав щита, защиту и логику переключений."
        button="Подобрать состав щита"
      />
    </ServiceDetailLayout>
  );
}
