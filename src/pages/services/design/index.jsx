// src/pages/services/design/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "power", title: "Проектирование электроснабжения (ЭОМ)", dir: "Электроснабжение (ЭОМ)", href: "/services/design#power" },
  { key: "hvac", title: "Проектирование отопления, вентиляции и водоснабжения (ОВ, ВК)", dir: "ОВ / ВК", href: "/services/design#hvac" },
  { key: "lowcurrent", title: "Проектирование слаботочных систем (СКС, ОПС, СКУД, видеонаблюдение и др.)", dir: "Слаботочные", href: "/services/design#lowcurrent" },
  { key: "automation", title: "Проектирование систем автоматики и АСУ ТП", dir: "Автоматика / АСУ ТП", href: "/services/design#automation" },
  { key: "lightning", title: "Молниезащита и системы заземления", dir: "Молниезащита", href: "/services/design#lightning" },
  { key: "estimate", title: "Разработка сметной документации", dir: "Сметы", href: "/services/design#estimate" },
  { key: "supervision", title: "Авторский надзор за проектом", dir: "Авторский надзор", href: "/services/design#supervision" },
  { key: "approvals", title: "Согласования в ресурсоснабжающих и сетевых организациях", dir: "Согласования", href: "/services/design#approvals" },
];

const METRICS = [
  { key: "docs", label: "Разработка проектной документации", sharePct: 45, score10: 4.5 },
  { key: "calc", label: "Технические решения и расчёты", sharePct: 25, score10: 2.5 },
  { key: "expert", label: "Согласования и экспертизы", sharePct: 15, score10: 1.5 },
  { key: "author", label: "Авторский надзор", sharePct: 10, score10: 1.0 },
  { key: "support", label: "Сопровождение проекта", sharePct: 5, score10: 0.5 },
];

export default function DesignServicesPage() {
  return (
    <ServiceCategoryPage
      title="ПРОЕКТИРОВАНИЕ"
      slogan={<>Любая инженерная система начинается с идеи,<br />воплощённой в проекте.</>}
      intro={[
        "Мы делаем проектирование понятным и доступным: от идеи до согласований.",
        "Все инженерные разделы — в одном месте, чтобы вы получили комплексное решение под вашу задачу.",
      ]}
      lines={LINES}
      metrics={METRICS}
      score={1.5}
      graphHeading="Как распределяется наша работа"
    />
  );
}
