// src/pages/services/electrical/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "grid-connect", title: "Подключение объектов к электросетям", dir: "Внешние сети", href: "/services/electrical/power-connection" },
  { key: "power-upgrade", title: "Увеличение мощности и модернизация сетей", dir: "Распред. сети", href: "/services/electrical/power-upgrade" },
  { key: "indoor", title: "Внутренние электромонтажные работы", dir: "Внутренние сети", href: "/services/electrical/indoor" },
  { key: "outdoor", title: "Наружные электросети и уличное освещение", dir: "Наружные сети", href: "/services/electrical#outdoor" },
  { key: "switchgear", title: "Монтаж электрощитов и ВРУ", dir: "Щитовое", href: "/services/electrical#switchgear" },
  { key: "earthing", title: "Системы заземления и молниезащиты", dir: "Безопасность", href: "/services/electrical#earthing" },
  { key: "automation", title: "Автоматизация и учёт электроэнергии", dir: "Автоматизация", href: "/services/electrical#automation" },
  { key: "backup", title: "Резервное электроснабжение", dir: "Надёжность", href: "/services/electrical#backup" },
];

const METRICS = [
  { key: "montage", label: "Монтаж", sharePct: 40, score10: 4.0 },
  { key: "design", label: "Проектирование", sharePct: 25, score10: 2.5 },
  { key: "auto", label: "Автоматизация", sharePct: 15, score10: 1.5 },
  { key: "qa", label: "Контроль качества", sharePct: 12, score10: 1.2 },
  { key: "service", label: "Сервис", sharePct: 8, score10: 0.8 },
];

export default function ElectricalServicesPage() {
  return (
    <ServiceCategoryPage
      title="ЭЛЕКТРОМОНТАЖ"
      slogan={<>Энергия проектов рождается<br />из точности каждого соединения.</>}
      intro={[
        "Мы делаем электромонтаж прозрачным и удобным:",
        "все услуги собраны в одном месте. Выберите нужный раздел и найдите решение под свою задачу.",
      ]}
      lines={LINES}
      metrics={METRICS}
      score={2.0}
    />
  );
}
