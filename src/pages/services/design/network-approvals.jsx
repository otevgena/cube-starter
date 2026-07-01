// src/pages/services/design/network-approvals.jsx
import React from "react";
import { ServiceDetailLayout } from "./_shell.jsx";
import { SectionHead, ServiceCTA } from "@/components/services/detailBlocks.jsx";
import { ProjectStatGrid, ApprovalPipelineBoard, CommentResolutionBoard, TabbedList, VersionStrip, ProjectRiskMatrix } from "@/components/services/designBlocks.jsx";

const BACK = { backTo: "/services/design", backLabel: "Вернуться к проектированию" };

const STATS = [
  { label: "Пакет", value: "документы" },
  { label: "ТУ", value: "условия" },
  { label: "Замеч.", value: "трекер" },
  { label: "Статус", value: "контроль" },
];

const PIPELINE = [
  { title: "Исходные данные", status: "Пакет", inside: "Документы, планы, параметры.", check: "Полноту и актуальность." },
  { title: "Пакет", status: "Версия", inside: "Состав передачи по задаче.", check: "Соответствие требованиям." },
  { title: "Передано", status: "В работе", inside: "Комплект по маршруту.", check: "Формат и адресата." },
  { title: "Замечания", status: "Открыто", inside: "Комментарии организации.", check: "Что относится к проекту." },
  { title: "Корректировка", status: "Правка", inside: "Изменения и пояснения.", check: "Чтобы не сломать смежные листы." },
  { title: "Повторная передача", status: "Передано", inside: "Обновлённый комплект.", check: "Что замечания закрыты." },
  { title: "Статус", status: "Контроль", inside: "Текущее состояние маршрута.", check: "Следующее действие." },
];

const COMMENTS = [
  ["Не хватает исходных данных", "Организация", "Добавить документ", "Запросить у заказчика", "В работе"],
  ["Требуется уточнение схемы", "Технический специалист", "Обновить лист", "Корректировка", "На проверке"],
  ["Противоречие в параметрах", "Пакет", "Сверить данные", "Уточнить исходные", "Открыто"],
  ["Нет приложения", "Комплект", "Приложить файл", "Добавить в пакет", "Решено"],
  ["Нужна новая версия", "Замечания", "Выпустить комплект", "Обновить пакет", "Передано"],
];

const PACKET = [
  { key: "input", label: "Исходные данные", items: ["Реквизиты объекта", "Параметры подключения", "Планы", "Документы заказчика"] },
  { key: "sheets", label: "Проектные листы", items: ["Схемы", "Планы", "Пояснения", "Спецификации"] },
  { key: "letters", label: "Письма", items: ["Сопроводительное письмо", "Запрос", "Ответ на замечания", "Передача версии"] },
  { key: "comments", label: "Замечания", items: ["Текст замечания", "Источник", "Ответственный", "Статус"] },
  { key: "versions", label: "Версии", items: ["Номер выпуска", "Дата", "Что изменено", "Кому передано"] },
];

const VERSIONS = [
  { v: "v01", label: "Пакет" },
  { label: "Замечания" },
  { v: "v02", label: "Корректировка" },
  { label: "Передано" },
  { label: "Статус" },
];

const RISKS = [
  ["Неполный пакет", "Документы возвращают", "Проверяем состав до передачи"],
  ["Нет статуса", "Непонятно, где документ", "Ведём трекер"],
  ["Замечания без ответственного", "Правки зависают", "Фиксируем действие"],
  ["Меняется версия проекта", "Переданы разные данные", "Ведём версии"],
  ["Нет пояснений", "Вопрос трактуется по-разному", "Готовим ответ"],
];

export default function NetworkApprovalsPage() {
  return (
    <ServiceDetailLayout
      active="/services/design/network-approvals"
      title={<>СОГЛАСОВАНИЯ<br />В СЕТЕВЫХ ОРГАНИЗАЦИЯХ</>}
      slogan={<>Разложим документы, замечания и версии по маршруту согласования.<br />Без обещаний «волшебного согласования», но с понятным контролем статуса.</>}
    >
      {/* SIGNATURE — документальный коридор */}
      <section>
        <SectionHead label="Коридор" title="Документальный коридор" />
        <ApprovalPipelineBoard stages={PIPELINE} />
      </section>

      <ProjectStatGrid items={STATS} />

      <section>
        <SectionHead label="Замечания" title="Журнал замечаний" />
        <CommentResolutionBoard columns={["Замечание", "Источник", "Что требуется", "Действие", "Статус"]} rows={COMMENTS} />
      </section>

      <section>
        <SectionHead label="Пакет" title="Состав пакета" />
        <TabbedList tabs={PACKET} />
      </section>

      <section>
        <SectionHead label="Версии" title="Как двигается пакет" />
        <VersionStrip items={VERSIONS} />
      </section>

      <section>
        <SectionHead label="Внимание" title="Где согласования буксуют" />
        <ProjectRiskMatrix columns={["Причина", "Что ломается", "Как закрываем"]} rows={RISKS} />
      </section>

      <ServiceCTA
        title="Нужно провести документы по техническому маршруту?"
        text="Отправьте задачу, текущий пакет и замечания — разложим маршрут, версии и следующие действия."
        button="Разобрать согласования"
        {...BACK}
      />
    </ServiceDetailLayout>
  );
}
