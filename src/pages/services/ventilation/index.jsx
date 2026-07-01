// src/pages/services/ventilation/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "vent-install", title: "Проектирование и монтаж вентиляции", dir: "Вентиляция", href: "/services/ventilation/ventilation-design-install" },
  { key: "vrf", title: "Системы кондиционирования (VRF/VRV)", dir: "Кондиционирование", href: "/services/ventilation/conditioning-vrf-vrv" },
  { key: "chiller", title: "Чиллер-фанкойл системы", dir: "Холодоснабжение", href: "/services/ventilation/chiller-fancoil" },
  { key: "heating", title: "Системы отопления и теплоснабжения", dir: "Отопление", href: "/services/ventilation/heating-heat-supply" },
  { key: "automation", title: "Автоматика ОВиК", dir: "Автоматика", href: "/services/ventilation/hvac-automation" },
  { key: "passport", title: "Паспортизация и балансировка систем", dir: "Наладка", href: "/services/ventilation/passport-balancing" },
  { key: "ducts", title: "Воздуховоды, шумоглушение, КИПиА", dir: "Воздуховоды", href: "/services/ventilation/ducts-silencers-kipia" },
  { key: "service", title: "Сервис и регламентное обслуживание", dir: "Сервис", href: "/services/ventilation/service-maintenance" },
];

const METRICS = [
  { key: "design", label: "Проектирование", sharePct: 30, score10: 3.0 },
  { key: "vent", label: "Монтаж вентиляции", sharePct: 26, score10: 2.6 },
  { key: "ac", label: "Монтаж кондиционирования", sharePct: 20, score10: 2.0 },
  { key: "commission", label: "Пусконаладка", sharePct: 14, score10: 1.4 },
  { key: "qa", label: "Сервис", sharePct: 10, score10: 1.0 },
];

export default function VentilationServicesPage() {
  return (
    <ServiceCategoryPage
      title="КЛИМАТ-СИСТЕМЫ"
      slogan={<>Правильный климат —<br />это не роскошь,<br />а условие для жизни и работы.</>}
      intro={[
        "Мы превращаем воздух в часть комфорта:",
        "каждая услуга собрана здесь. Выберите нужный раздел и найдите то, что подходит именно вам.",
      ]}
      lines={LINES}
      metrics={METRICS}
      score={2.6}
    />
  );
}
