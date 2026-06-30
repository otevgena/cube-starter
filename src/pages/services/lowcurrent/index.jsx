// src/pages/services/lowcurrent/index.jsx
import React from "react";
import { ServiceCategoryPage } from "../services-shell.jsx";

const LINES = [
  { key: "sks", title: "Структурированные кабельные системы", dir: "СКС", href: "/services/lowcurrent#sks" },
  { key: "cctv", title: "Системы видеонаблюдения", dir: "CCTV", href: "/services/lowcurrent#cctv" },
  { key: "ops", title: "Системы охранно-пожарной сигнализации", dir: "ОПС", href: "/services/lowcurrent#ops" },
  { key: "skud", title: "Системы контроля и управления доступом", dir: "СКУД", href: "/services/lowcurrent#skud" },
  { key: "intercom", title: "Домофонные системы и интерком", dir: "Домофония", href: "/services/lowcurrent#intercom" },
  { key: "server", title: "Организация серверных и кроссовых узлов", dir: "Серверные", href: "/services/lowcurrent#server" },
  { key: "lan", title: "Локально-вычислительные сети и сетевое оборудование", dir: "ЛВС/Сеть", href: "/services/lowcurrent#lan" },
  { key: "pa", title: "Системы оповещения и звукового вещания", dir: "Оповещение", href: "/services/lowcurrent#pa" },
];

const METRICS = [
  { key: "montage", label: "Монтаж", sharePct: 45, score10: 4.5 },
  { key: "design", label: "Проектирование", sharePct: 25, score10: 2.5 },
  { key: "qa", label: "Контроль качества", sharePct: 10, score10: 1.0 },
  { key: "service", label: "Сервис", sharePct: 20, score10: 2.0 },
];

export default function LowCurrentServicesPage() {
  return (
    <ServiceCategoryPage
      title={<>СЛАБОТОЧНЫЕ<br />СИСТЕМЫ</>}
      slogan={
        <>
          Безопасность, как и доверие,<br />
          рождается не в момент тревоги,<br />
          а в тишине, где всё под контролем.
        </>
      }
      intro={[
        "Мы делаем слаботочные системы понятными и масштабируемыми:",
        "все направления собраны в одном месте. Выберите нужный раздел и найдите решение под свою задачу.",
      ]}
      lines={LINES}
      metrics={METRICS}
      score={2.6}
    />
  );
}
