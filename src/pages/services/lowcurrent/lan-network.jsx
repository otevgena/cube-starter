// src/pages/services/lowcurrent/lan-network.jsx
import React from "react";
import { SectionHead, ScenarioSwitcher, MatrixTable, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SignalStatGrid, NetworkCoreMap, EventFlow } from "@/components/services/lowcurrentBlocks.jsx";

const BACK = { backTo: "/services/lowcurrent", backLabel: "Вернуться к слаботочным системам" };

const STATS = [
  { label: "Ядро", value: "сеть" },
  { label: "PoE", value: "питание" },
  { label: "Wi-Fi", value: "зоны" },
  { label: "VLAN", value: "опция" },
];

// главный блок — карта сети
const NODES = [
  { title: "Провайдер / ввод", role: "Внешний канал в объект.", check: "Ввод, резерв канала.", mistake: "Нет резервного канала." },
  { title: "Шлюз / маршрутизатор", role: "Выход в интернет и правила сети.", check: "Маршрутизацию, безопасность, резерв.", mistake: "Слабая защита периметра." },
  { title: "Ядро сети", role: "Связность всех узлов.", check: "Пропускную способность, отказоустойчивость.", mistake: "Узкое место в ядре." },
  { title: "Коммутаторы доступа", role: "Подключение устройств.", check: "Порты, PoE, сегментацию.", mistake: "Всё в одном сегменте." },
  { title: "Конечные устройства", role: "Рабочие места и системы.", check: "Назначение, нагрузку, доступ.", mistake: "Камеры и офис в одной сети." },
];
const ENDPOINTS = ["Рабочие места", "Wi-Fi точки", "Камеры", "СКУД", "Серверы", "Инженерные системы"];

const FIELDS = [
  { key: "connect", label: "Что подключается" },
  { key: "risk", label: "Риск" },
  { key: "split", label: "Что отделить" },
  { key: "check", label: "Что проверить" },
];
const SEGMENTS = [
  { key: "work", label: "Рабочие места", connect: "Компьютеры, телефония, принтеры.", risk: "Всё в одной сети.", split: "Гостевой Wi-Fi и камеры.", check: "Порты и скорость." },
  { key: "wifi", label: "Wi-Fi", connect: "Точки доступа, гостевая сеть.", risk: "Слабое покрытие.", split: "Гостевой доступ.", check: "Зоны и нагрузку." },
  { key: "cctv", label: "CCTV", connect: "Камеры, архив.", risk: "Видеопоток забивает сеть.", split: "Камеры и архив.", check: "PoE и пропускную способность." },
  { key: "skud", label: "СКУД", connect: "Контроллеры, события.", risk: "Потеря связи с дверями.", split: "Контрольные устройства.", check: "Питание и доступность." },
  { key: "eng", label: "Инженерия", connect: "BMS, счётчики, контроллеры.", risk: "Смешение с офисной сетью.", split: "Инженерный сегмент.", check: "Стабильность и доступ." },
];

const EQUIP = [
  ["Маршрутизатор", "Выход и правила сети", "Безопасность и резерв"],
  ["Коммутатор ядра", "Связность узлов", "Пропускную способность"],
  ["Коммутатор PoE", "Камеры и точки доступа", "Бюджет питания"],
  ["Wi-Fi AP", "Покрытие", "Размещение и нагрузку"],
  ["Сервер / NVR", "Сервисы и архив", "Скорость и доступ"],
];

const FLOW = [
  { title: "Устройство", happens: "Создаёт трафик." },
  { title: "Коммутатор доступа", happens: "Подключает устройство." },
  { title: "Ядро", happens: "Передаёт между сегментами." },
  { title: "Сервер / интернет", happens: "Обрабатывает или выпускает наружу." },
  { title: "Журнал / мониторинг", happens: "Фиксирует и отслеживает." },
];

export default function LanNetworkPage() {
  return (
    <ServiceDetailLayout
      active="/services/lowcurrent/lan-network"
      title={<>ЛВС И АКТИВНОЕ<br />СЕТЕВОЕ ОБОРУДОВАНИЕ</>}
      slogan={<>Соберём сеть с ядром, доступом, PoE и Wi-Fi.<br />Чтобы камеры, рабочие места и инженерия не мешали друг другу.</>}
    >
      <SignalStatGrid items={STATS} />

      {/* ГЛАВНЫЙ БЛОК — карта сети */}
      <section>
        <SectionHead label="Топология" title="Карта сети" />
        <NetworkCoreMap nodes={NODES} endpoints={ENDPOINTS} />
      </section>

      {/* сегменты сети */}
      <section>
        <SectionHead label="Сегменты" title="Сегменты сети" />
        <ScenarioSwitcher scenarios={SEGMENTS} fields={FIELDS} />
      </section>

      {/* оборудование */}
      <section>
        <SectionHead label="Оборудование" title="Оборудование, задача и что важно" />
        <MatrixTable columns={["Оборудование", "Задача", "Что важно"]} rows={EQUIP} highlightLast />
      </section>

      {/* как проходит трафик */}
      <section>
        <SectionHead label="Трафик" title="Как проходит трафик" />
        <EventFlow steps={FLOW} />
      </section>

      <ServiceCTA
        title="Нужно собрать сеть без конфликтов между системами?"
        text="Опишите рабочие места, камеры, Wi-Fi и серверы — соберём понятную сетевую схему."
        button="Разобрать сетевую схему"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
