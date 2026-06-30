// src/pages/services/ventilation/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "vent-install", title: "Монтаж вентиляции", dir: "Вентиляция", href: "/services/ventilation#vent-install" },
  { key: "vrf", title: "Системы кондиционирования (VRF/VRV, чиллер-фанкойл)", dir: "Кондиционирование", href: "/services/ventilation#vrf" },
  { key: "heating", title: "Отопление и тепловые пункты", dir: "Отопление", href: "/services/ventilation#heating" },
  { key: "bms", title: "Автоматика и диспетчеризация инженерных систем", dir: "Автоматика", href: "/services/ventilation#bms" },
  { key: "smoke", title: "Дымоудаление и противодымная вентиляция", dir: "Безопасность", href: "/services/ventilation#smoke" },
  { key: "passport", title: "Паспортизация и балансировка систем", dir: "Сертификация", href: "/services/ventilation#passport" },
  { key: "ducts", title: "Монтаж воздуховодов и шумоглушителей", dir: "Воздуховоды", href: "/services/ventilation#ducts" },
  { key: "service", title: "Сервис и регламентное обслуживание", dir: "Сервис", href: "/services/ventilation#service" },
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
