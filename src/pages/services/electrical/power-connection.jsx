// src/pages/services/electrical/power-connection.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import {
  DetailStatGrid, TagRow, SectionHead, RoadmapRail, MatrixTable, MiniTabs, ServiceCTA,
} from "@/components/services/detailBlocks.jsx";

const STATS = [
  { label: "Типовой срок", value: "30–90 дн." },
  { label: "Диапазон", value: "до 150+ кВт" },
  { label: "Документы", value: "ТУ · ТП · акт" },
  { label: "Нормы", value: "ПУЭ · ГОСТ" },
];

const INCLUDES = ["Технические условия", "Договор ТП", "Проект ВЛ/КЛ", "Узел учёта", "Пусконаладка", "Приёмка", "Ростехнадзор"];

const STAGES = [
  { title: "Заявка и исходные данные", text: "Характеристики объекта, требуемая мощность, категория надёжности электроснабжения." },
  { title: "Технические условия (ТУ)", text: "Точка подключения, требования к учёту, защите и сечению от сетевой организации." },
  { title: "Договор ТП", text: "Сроки, мощность и обязательства сторон, плата за технологическое присоединение." },
  { title: "Проект ВЛ/КЛ", text: "Трасса внешних сетей, пересечения, охранные зоны, узел учёта." },
  { title: "СМР и ввод в здание", text: "Земляные и кабельные работы, прокладка ВЛ/КЛ, ввод и герметизация." },
  { title: "Щит учёта и пусконаладка", text: "Монтаж щита, измерения изоляции и петли «фаза-ноль», пусконаладка." },
  { title: "Приёмка и Ростехнадзор", text: "Сдача сетевой организации, при необходимости — допуск Ростехнадзора." },
  { title: "Ввод мощности", text: "Фактическая подача мощности и акт о технологическом присоединении." },
];

const CATEGORIES = [
  ["до 15 кВт", "Частный дом, небольшой объект", "Упрощённая процедура", "30–45 дн."],
  ["15–150 кВт", "Коммерция, производство, СНТ", "ТУ, проект, узел учёта", "45–75 дн."],
  ["150+ кВт", "Крупный объект, I/II категория", "ПС/РУ, резерв питания", "75–120 дн."],
];

const DOCS = {
  tu: { label: "ТУ", text: "Технические условия: точка подключения, выделенная мощность, требования к учёту, защите и сечению." },
  dog: { label: "Договор ТП", text: "Договор технологического присоединения: сроки, мощность, обязательства сторон, плата за присоединение." },
  proj: { label: "Проект ВЛ/КЛ", text: "Проект внешних сетей: трасса, сечения, пересечения, охранные зоны и узел учёта." },
  akt: { label: "Акт ТП", text: "Акт о технологическом присоединении и подтверждение фактической подачи мощности." },
};

function Documents() {
  const keys = Object.keys(DOCS);
  const [k, setK] = React.useState(keys[0]);
  return (
    <div>
      <MiniTabs items={keys.map((x) => ({ key: x, label: DOCS[x].label }))} value={k} onChange={setK} />
      <div style={{ marginTop: 16, maxWidth: 760, fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#333" }}>{DOCS[k].text}</div>
    </div>
  );
}

export default function PowerConnectionPage() {
  return (
    <ServiceDetailLayout
      active="/services/electrical/power-connection"
      title={<>ПОДКЛЮЧЕНИЕ ОБЪЕКТОВ<br />К ЭЛЕКТРОСЕТЯМ</>}
      slogan={<>Подготовим техусловия, проект и фактическое подключение «под ключ».<br />Без беготни по инстанциям.</>}
    >
      {/* показатели */}
      <DetailStatGrid items={STATS} />

      {/* что входит — теги по центру (отдельным «дыхательным» блоком) */}
      <div style={{ padding: "48px 0" }}>
        <TagRow label="Услуга включает" tags={INCLUDES} />
      </div>

      {/* главный блок — дорожная карта */}
      <section>
        <SectionHead label="Этапы" title="Дорожная карта присоединения" />
        <RoadmapRail steps={STAGES} />
      </section>

      {/* категории — таблица с подсветкой последней колонки */}
      <section>
        <SectionHead label="Сравнение" title="Категории присоединения" />
        <MatrixTable columns={["Категория", "Объекты", "Особенности", "Срок"]} rows={CATEGORIES} highlightLast />
      </section>

      {/* документы — лёгкий интерактив */}
      <section>
        <SectionHead label="Результат" title="Какие документы вы получаете" />
        <Documents />
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Оценим подключение по вашему адресу"
        text="Пришлите адрес и требуемую мощность — вернёмся с ТУ, сроками и чек-листом документов."
      />
    </ServiceDetailLayout>
  );
}
