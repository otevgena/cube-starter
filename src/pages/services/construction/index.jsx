// src/pages/services/construction/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "general", title: "Общестроительные и отделочные работы", dir: "Общестрой / Отделка", href: "/services/construction#general" },
  { key: "monolith", title: "Монолитные и железобетонные работы", dir: "Монолит / ЖБ", href: "/services/construction#monolith" },
  { key: "foundation", title: "Фундаменты и земляные работы", dir: "Фундаменты / Земляные", href: "/services/construction#foundation" },
  { key: "roof", title: "Кровельные и фасадные работы", dir: "Кровля / Фасады", href: "/services/construction#roof" },
  { key: "partitions", title: "Внутренние перегородки и проёмы", dir: "Перегородки / Проёмы", href: "/services/construction#partitions" },
  { key: "strengthening", title: "Усиление строительных конструкций", dir: "Усиление конструкций", href: "/services/construction#strengthening" },
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
