// src/pages/services/construction/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "general", title: "Общестроительные и отделочные работы", dir: "Общестрой / Отделка", href: "/services/construction/general-finishing" },
  { key: "monolith", title: "Монолитные и бетонные работы", dir: "Монолит / ЖБ", href: "/services/construction/monolith-concrete" },
  { key: "foundation", title: "Фундамент и земляные работы", dir: "Фундаменты / Земляные", href: "/services/construction/foundation-earthworks" },
  { key: "roof", title: "Кровля и фасад", dir: "Кровля / Фасады", href: "/services/construction/roof-facade" },
  { key: "partitions", title: "Внутренние перегородки и проёмы", dir: "Перегородки / Проёмы", href: "/services/construction/partitions-openings" },
  { key: "strengthening", title: "Усиление конструкций", dir: "Усиление конструкций", href: "/services/construction/structural-strengthening" },
  { key: "contracting", title: "Генподряд и технадзор", dir: "Генподряд / Технадзор", href: "/services/construction/general-contracting-supervision" },
  { key: "commissioning", title: "Пуско-наладка инженерных систем", dir: "ПНР", href: "/services/construction/commissioning" },
];

const METRICS = [
  { key: "build", label: "Строительно-монтажные работы", sharePct: 50, score10: 5.0 },
  { key: "design", label: "Проектирование", sharePct: 10, score10: 1.0 },
  { key: "finish", label: "Отделочные работы", sharePct: 20, score10: 2.0 },
  { key: "quality", label: "Контроль качества", sharePct: 12, score10: 1.2 },
  { key: "service", label: "Сервис", sharePct: 8, score10: 0.8 },
];

export default function ConstructionServicesPage() {
  return (
    <ServiceCategoryPage
      title="ОБЩЕСТРОЙ"
      slogan={<>Архитектура начинается там,<br />где встречаются мысль и кирпич.</>}
      intro={[
        "Общестрой — это фундамент, который определяет срок службы здания. Мы создаём надёжную базу, где каждая деталь продумана.",
        "Все услуги собраны в одном месте — выберите решение под свою задачу.",
      ]}
      lines={LINES}
      metrics={METRICS}
      score={2.9}
      graphHeading="Как распределяется наша работа"
    />
  );
}
