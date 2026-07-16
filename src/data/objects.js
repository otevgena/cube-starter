// src/data/objects.js
// Цифровой паспорт объекта. Два режима хранения (см. секцию «Стор» ниже):
//   • API      — источник истины бэкенд (api.cube-tech.ru): объект пишется целиком
//                через POST/PUT/DELETE, список подтягивается через GET /objects;
//   • localStorage — офлайн-моки с сидом DEFAULT_OBJECTS (как было раньше).
// Публичные функции остаются СИНХРОННЫМИ (UI не переписывался): мутации меняют
// in-memory кэш сразу, а запись на бэкенд идёт фоном (write-through).
// Переключатель: localStorage['objects:api'] = '0' → вернуться к localStorage.
import { api } from "@/lib/auth.js";

/* ===================== Справочники / статусы ===================== */
export const OBJECT_STATUSES = [
  { code: "draft",            label: "Черновик",           tone: "#8a8a8a" },
  { code: "in_progress",      label: "В работе",           tone: "#2b6cb0" },
  { code: "waiting_customer", label: "Ожидает заказчика",  tone: "#c05621" },
  { code: "done",             label: "Завершён",           tone: "#2f855a" },
  { code: "archived",         label: "Архив",              tone: "#718096" },
];
export const ATTENTION_STATUSES = [
  { code: "on_track", label: "Всё идёт по плану", tone: "#2f855a" },
  { code: "waiting",  label: "Ожидаем заказчика", tone: "#c05621" },
  { code: "delay",    label: "Есть задержка",     tone: "#b7791f" },
  { code: "urgent",   label: "Требует срочно",    tone: "#e5484d" },
];
export const STAGE_STATUSES = [
  { code: "not_started",      label: "Не начат",          tone: "#cfcfcf" },
  { code: "in_progress",      label: "В работе",          tone: "#FA5D29" },
  { code: "done",             label: "Завершён",          tone: "#2f855a" },
  { code: "paused",           label: "На паузе",          tone: "#b7791f" },
  { code: "waiting_customer", label: "Ожидает заказчика", tone: "#c05621" },
];
export const DOC_CATEGORIES = ["Договоры", "Отчёты", "Сметы", "Исполнительная", "Схемы", "Акты", "Фото", "Прочее"];
export const DOC_STATUSES = [
  { code: "draft",     label: "Черновик",   tone: "#8a8a8a" },
  { code: "published", label: "Опубликован", tone: "#2f855a" },
  { code: "hidden",    label: "Скрыт",      tone: "#c05621" },
  { code: "archived",  label: "Архив",      tone: "#718096" },
];
export const ACTION_TYPES = ["Согласовать", "Предоставить данные", "Подписать документ", "Проверить", "Оплатить", "Прочее"];
export const ACTION_STATUSES = [
  { code: "waiting",  label: "Ожидает",   tone: "#c05621" },
  { code: "done",     label: "Выполнено", tone: "#2f855a" },
  { code: "overdue",  label: "Просрочено", tone: "#e5484d" },
];
export const STAGE_PRESETS = [
  "Обследование объекта", "Проектирование", "Согласование сметы",
  "Поставка оборудования и материалов", "Монтажные работы", "Пусконаладочные работы",
  "Скрытые работы (акты)", "Испытания и замеры", "Сдача-приёмка", "Гарантийное обслуживание",
];

// Шаблоны объектов: типовые этапы + акцент на категории документов
// Типы работ (услуги). Каждый задаёт: prefix — сокращение для ID объекта,
// stages — типовые этапы, которые подтянутся при создании (их можно убрать/добавить).
// Соответствуют разделам «Услуги»; список расширяется (шаблоны — в админке).
export const OBJECT_TEMPLATES = [
  { code: "electrical", prefix: "ELM", label: "Электромонтаж",
    stages: ["Обследование и замеры", "Проект и схема", "Согласование сметы", "Монтажные работы", "Пусконаладка", "Измерения и сдача"] },
  { code: "hvac",       prefix: "OVK", label: "ОВиК — вентиляция и отопление",
    stages: ["Обследование объекта", "Проектирование", "Согласование сметы", "Монтаж систем", "Пусконаладка и балансировка", "Сдача-приёмка"] },
  { code: "lowcurrent", prefix: "SLT", label: "Слаботочные системы",
    stages: ["Обследование", "Проект СС", "Монтаж СКС и оборудования", "Настройка и программирование", "Сдача-приёмка"] },
  { code: "design",     prefix: "PRO", label: "Проектирование",
    stages: ["Техническое задание", "Сбор исходных данных", "Проектирование", "Согласование", "Выпуск документации"] },
  { code: "survey",     prefix: "OBS", label: "Обследование",
    stages: ["Выезд и обследование", "Обработка данных", "Отчёт по обследованию", "Согласование с заказчиком"] },
  { code: "asbuilt",    prefix: "EXE", label: "Исполнительная документация",
    stages: ["Сбор исходных данных", "Подготовка исполнительной", "Проверка комплекта", "Сдача заказчику"] },
  { code: "facade",     prefix: "FAS", label: "Фасадные работы",
    stages: ["Обследование объекта", "Проектирование", "Согласование сметы", "Монтажные работы", "Сдача-приёмка"] },
  { code: "free",       prefix: "OBJ", label: "Свободный объект", stages: [] },
];

/* ===================== Шаблоны объектов (управление в админке) =====================
   OBJECT_TEMPLATES — базовый список. Админ может добавлять свои шаблоны, править
   базовые (название / префикс / этапы) и скрывать ненужные. Правки — оверлеем в
   localStorage, чтобы не терять дефолты (аналогично сотрудникам). */
const LS_TPL_ADD = "cube:templates:added";    // [{code,label,prefix,stages}]
const LS_TPL_EDIT = "cube:templates:edited";  // { [code]: {label?,prefix?,stages?} }
const LS_TPL_HIDE = "cube:templates:hidden";  // [code] — скрытые базовые

export function normalizePrefix(s = "") {
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}
function cleanTplPatch(patch = {}) {
  const c = {};
  if (patch.label != null) c.label = String(patch.label).trim();
  if (patch.prefix != null) c.prefix = normalizePrefix(patch.prefix);
  if (patch.stages != null) c.stages = (Array.isArray(patch.stages) ? patch.stages : []).map((s) => String(s).trim()).filter(Boolean);
  return c;
}
// Полный список типов работ с учётом правок админа. Базовые помечены base:true.
export function getTemplates() {
  const hidden = new Set(lsGet(LS_TPL_HIDE, []));
  const edits = lsGet(LS_TPL_EDIT, {});
  const added = lsGet(LS_TPL_ADD, []);
  const base = OBJECT_TEMPLATES.filter((t) => !hidden.has(t.code)).map((t) => ({ ...t, ...(edits[t.code] || {}), base: true }));
  const custom = added.map((t) => ({ ...t, ...(edits[t.code] || {}), base: false }));
  return [...base, ...custom];
}
export function templateByCode(code) { return getTemplates().find((t) => t.code === code) || null; }
// true, если базовый шаблон изменён относительно дефолта (для кнопки «Сбросить»)
export function isTemplateModified(code) {
  const edits = lsGet(LS_TPL_EDIT, {}); const hidden = new Set(lsGet(LS_TPL_HIDE, []));
  return !!edits[code] || hidden.has(code);
}
export function addTemplate({ label, prefix, stages = [] } = {}) {
  const list = lsGet(LS_TPL_ADD, []);
  const tpl = { code: uid("tpl"), label: String(label || "").trim() || "Новый шаблон", prefix: normalizePrefix(prefix) || "OBJ", stages: (Array.isArray(stages) ? stages : []).map((s) => String(s).trim()).filter(Boolean) };
  list.push(tpl); lsSet(LS_TPL_ADD, list);
  return tpl;
}
export function updateTemplate(code, patch) {
  const clean = cleanTplPatch(patch);
  const added = lsGet(LS_TPL_ADD, []);
  const idx = added.findIndex((t) => t.code === code);
  if (idx >= 0) { added[idx] = { ...added[idx], ...clean }; lsSet(LS_TPL_ADD, added); return; }
  const edits = lsGet(LS_TPL_EDIT, {}); edits[code] = { ...(edits[code] || {}), ...clean }; lsSet(LS_TPL_EDIT, edits);
}
export function removeTemplate(code) {
  const added = lsGet(LS_TPL_ADD, []);
  if (added.some((t) => t.code === code)) {
    lsSet(LS_TPL_ADD, added.filter((t) => t.code !== code));
    const edits = lsGet(LS_TPL_EDIT, {}); if (edits[code]) { delete edits[code]; lsSet(LS_TPL_EDIT, edits); }
    return;
  }
  const hidden = lsGet(LS_TPL_HIDE, []); if (!hidden.includes(code)) { hidden.push(code); lsSet(LS_TPL_HIDE, hidden); }
}
// Сброс базового шаблона к заводскому виду (снимает правки и разблокирует)
export function resetTemplate(code) {
  const edits = lsGet(LS_TPL_EDIT, {}); if (edits[code]) { delete edits[code]; lsSet(LS_TPL_EDIT, edits); }
  const hidden = lsGet(LS_TPL_HIDE, []); if (hidden.includes(code)) lsSet(LS_TPL_HIDE, hidden.filter((c) => c !== code));
}

export const EVENT_BADGES = {
  object_created:  "Объект",
  status_changed:  "Статус",
  stage_added:     "Этап",
  stage_status:    "Этап",
  doc_added:       "Документ",
  doc_published:   "Документ",
  doc_version:     "Версия",
  doc_hidden:      "Документ",
  notify:          "Уведомление",
  customer_open:   "Заказчик",
  customer_download:"Заказчик",
  action_added:    "Задача",
  generic:         "Событие",
};

export function labelOf(list, code) { return (list.find((x) => x.code === code) || {}).label || code; }
export function toneOf(list, code) { return (list.find((x) => x.code === code) || {}).tone || "#8a8a8a"; }
export function extOf(nameOrExt = "") {
  const s = String(nameOrExt).toLowerCase();
  const m = s.match(/\.([a-z0-9]+)$/);
  return (m ? m[1] : s).replace(/[^a-z0-9]/g, "");
}

/* ===================== Сотрудники ===================== */
export const EMPLOYEES_BASE = [
  // Попов = супер-админ info@cube-tech.ru (учётка уже привязана, все права).
  { id: "popov",        fio: "Попов Евгений Александрович",       position: "Генеральный директор", email: "info@cube-tech.ru", caps: { objects: true, docs: true, messages: true, create: true, employees: true } },
  { id: "ilyukhin",     fio: "Илюхин Александр Михайлович",        position: "Коммерческий директор" },
  { id: "blyakharskiy", fio: "Бляхарский Валентин Владиславович",  position: "Директор по развитию" },
  { id: "kulyutnikov",  fio: "Кулютников Дмитрий Сергеевич",       position: "Руководитель производственных работ" },
];
const LS_EMP_ADD = "cube:employees:added";
const LS_EMP_HIDE = "cube:employees:hidden";
const LS_EMP_EDIT = "cube:employees:edited";  // { [id]: {fio?,position?,caps?} }

/* Права «полуадмина». Сотрудник = учётная запись + набор галочек-возможностей.
   Проверка прав пока клиентская (демо); серверная — при переносе на бэкенд. */
export const EMP_CAPS = [
  { key: "objects",   label: "Управлять объектами",     hint: "Редактировать закреплённые объекты: этапы, статусы, поля." },
  { key: "docs",      label: "Документы",               hint: "Загружать, публиковать и скрывать документы объекта." },
  { key: "messages",  label: "Переписка с заказчиком",  hint: "Отвечать на сообщения заказчика по объекту." },
  { key: "create",    label: "Создавать объекты",       hint: "Заводить новые объекты." },
  { key: "employees", label: "Управлять сотрудниками",  hint: "Добавлять сотрудников и выдавать им права." },
];
export const EMP_CAP_KEYS = EMP_CAPS.map((c) => c.key);
export function normalizeCaps(caps = {}) { const c = {}; EMP_CAP_KEYS.forEach((k) => (c[k] = !!(caps && caps[k]))); return c; }
function applyEmpEdit(e, edits, base) {
  const ed = edits[e.id] || {};
  return { ...e, ...ed, email: (ed.email != null ? ed.email : e.email) || "", caps: normalizeCaps({ ...(e.caps || {}), ...(ed.caps || {}) }), base };
}
export function getEmployees() {
  const hidden = new Set(lsGet(LS_EMP_HIDE, []));
  const edits = lsGet(LS_EMP_EDIT, {});
  const added = lsGet(LS_EMP_ADD, []);
  return [
    ...EMPLOYEES_BASE.filter((e) => !hidden.has(e.id)).map((e) => applyEmpEdit(e, edits, true)),
    ...added.map((e) => applyEmpEdit(e, edits, false)),
  ];
}
// Старый путь (свободный ФИО) — оставлен для совместимости.
export function addEmployee({ fio, position }) {
  const list = lsGet(LS_EMP_ADD, []); const emp = { id: uid("emp"), fio, position, email: "", caps: normalizeCaps() }; list.push(emp); lsSet(LS_EMP_ADD, list); return emp;
}
// Новый путь: сотрудник заводится из существующей учётной записи.
export function addEmployeeFromAccount(account, { position = "", caps = {} } = {}) {
  const email = String((account && account.email) || "").trim().toLowerCase();
  const list = lsGet(LS_EMP_ADD, []);
  const emp = { id: uid("emp"), email, fio: (account && account.name) || email, position: String(position || "").trim(), caps: normalizeCaps(caps) };
  list.push(emp); lsSet(LS_EMP_ADD, list); return emp;
}
export function updateEmployee(id, patch = {}) {
  const clean = {};
  if (patch.fio != null) clean.fio = String(patch.fio).trim();
  if (patch.position != null) clean.position = String(patch.position).trim();
  if (patch.email != null) clean.email = String(patch.email).trim().toLowerCase();
  if (patch.caps != null) clean.caps = normalizeCaps(patch.caps);
  const added = lsGet(LS_EMP_ADD, []);
  const idx = added.findIndex((e) => e.id === id);
  if (idx >= 0) { added[idx] = { ...added[idx], ...clean, caps: clean.caps || normalizeCaps(added[idx].caps) }; lsSet(LS_EMP_ADD, added); return; }
  const edits = lsGet(LS_EMP_EDIT, {}); edits[id] = { ...(edits[id] || {}), ...clean }; lsSet(LS_EMP_EDIT, edits);
}
export function removeEmployee(id) {
  const added = lsGet(LS_EMP_ADD, []);
  if (added.some((e) => e.id === id)) {
    lsSet(LS_EMP_ADD, added.filter((e) => e.id !== id));
    const edits = lsGet(LS_EMP_EDIT, {}); if (edits[id]) { delete edits[id]; lsSet(LS_EMP_EDIT, edits); }
    return;
  }
  const hidden = lsGet(LS_EMP_HIDE, []); if (!hidden.includes(id)) { hidden.push(id); lsSet(LS_EMP_HIDE, hidden); }
}
export function employeeById(id) { return getEmployees().find((e) => e.id === id) || null; }
export function employeeByEmail(email) {
  const e = String(email || "").trim().toLowerCase(); if (!e) return null;
  return getEmployees().find((x) => (x.email || "").toLowerCase() === e) || null;
}
// Права сотрудника по e-mail (для проверок в UI). null — не сотрудник.
export function capsForEmail(email) { const emp = employeeByEmail(email); return emp ? emp.caps : null; }
// совместимость со старым кодом
export const EMPLOYEES = EMPLOYEES_BASE;

/* ===================== Переписка по объекту (демо, localStorage) =====================
   Тред «заказчик ↔ ответственный». Пока хранится локально; при переносе на бэкенд —
   в документе объекта (cube-objects) + письмо ответственному через Postbox. */
const LS_MSGS = "cube:objmsgs";          // { [objId]: [ {id, from, author, text, at, read} ] }
const LS_MSGS_OUTBOX = "cube:objmsgs:outbox"; // демо-«отправленные письма» ответственному
export function getMessages(objId) { const all = lsGet(LS_MSGS, {}); return Array.isArray(all[objId]) ? all[objId] : []; }
// from: 'customer' | 'staff'. Возвращает { msg, mailedTo } — кому «ушло письмо» (демо).
export function addMessage(objId, { from = "customer", author = "", text = "" } = {}) {
  const body = String(text || "").trim(); if (!body) return null;
  const all = lsGet(LS_MSGS, {});
  const list = Array.isArray(all[objId]) ? all[objId] : [];
  const msg = { id: uid("msg"), from, author, text: body, at: nowIso() };
  list.push(msg); all[objId] = list; lsSet(LS_MSGS, all);
  let mailedTo = "";
  if (from === "customer") {
    // письмо уходит ответственному за объект (fallback — супер-админ)
    const o = getObject(objId);
    mailedTo = (o && o.responsibleEmail) || (o && emailOfResponsible(o)) || "info@cube-tech.ru";
    const ob = lsGet(LS_MSGS_OUTBOX, []); ob.push({ id: uid("mail"), objId, to: mailedTo, at: nowIso(), preview: body.slice(0, 120) }); lsSet(LS_MSGS_OUTBOX, ob);
  }
  try { window.dispatchEvent(new CustomEvent("objects:changed")); } catch {}
  return { msg, mailedTo };
}
// e-mail ответственного: сперва из объекта, иначе ищем сотрудника по ФИО.
function emailOfResponsible(o) {
  if (!o) return "";
  if (o.responsibleEmail) return o.responsibleEmail;
  const emp = getEmployees().find((e) => e.fio && e.fio === o.responsibleName);
  return (emp && emp.email) || "";
}
// Состояние треда: 'empty' | 'awaiting' (ждём ответа сотрудника) | 'answered'.
export function threadStatus(objId) {
  const list = getMessages(objId); if (!list.length) return "empty";
  return list[list.length - 1].from === "customer" ? "awaiting" : "answered";
}
export function outboxForObject(objId) { return lsGet(LS_MSGS_OUTBOX, []).filter((m) => m.objId === objId); }

/* ===================== Утилиты ===================== */
function lsGet(key, fallback) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
let _seq = 0;
function uid(p = "id") { _seq += 1; return `${p}-${Date.now().toString(36)}-${_seq}`; }
function today() { const d = new Date(); return d.toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }
export function docUrl(objId, file) { return `/objects/${encodeURIComponent(objId)}/documents/${encodeURIComponent(file)}`; }

/* ===================== Сид данных ===================== */
const DEFAULT_OBJECTS = [
  {
    id: "TSS-02-2026",
    title: "Фасад — Ноябрьск",
    customerName: "ООО «ТСС»",
    inn: "8905067550",
    kpp: "890501001",
    city: "Ноябрьск",
    address: "г. Ноябрьск",
    contractNumber: "ТСС-ИД-01.01-ИД",
    status: "in_progress",
    progress: 35,
    currentStageId: "s2",
    responsibleName: "Кулютников Дмитрий Сергеевич",
    responsibleRole: "Руководитель производственных работ",
    responsiblePhone: "+7 (912) 911-20-00",
    responsibleEmail: "info@cube-tech.ru",
    plannedFinishDate: "2026-09-30",
    lastUpdatedAt: "2026-07-08",
    internalNote: "Ждём от заказчика утверждённую смету, затем запускаем монтаж.",
    now: {
      doingNow: "Готовим рабочую документацию и уточняем смету по фасаду.",
      nextStep: "Согласование сметы с заказчиком и старт монтажа.",
      nextDeadline: "2026-07-20",
      customerNeeds: "Согласовать смету и подтвердить дату выезда бригады.",
      attention: "waiting",
    },
    ownerEmail: "user@cube.ru", // совместимость (владелец)
    stages: [
      { id: "s1", title: "Обследование объекта", description: "Выезд, замеры, фотофиксация.", status: "done", progress: 100, plannedStartDate: "2026-06-01", plannedFinishDate: "2026-06-10", actualFinishDate: "2026-06-09", publicComment: "Обследование завершено.", internalComment: "", visibleToCustomer: true, order: 0 },
      { id: "s2", title: "Проектирование и смета", description: "Рабочая документация, смета.", status: "in_progress", progress: 50, plannedStartDate: "2026-06-11", plannedFinishDate: "2026-07-20", actualFinishDate: "", publicComment: "Готовим смету, скоро направим на согласование.", internalComment: "Уточнить объёмы по утеплителю.", visibleToCustomer: true, order: 1 },
      { id: "s3", title: "Монтажные работы", description: "Монтаж фасадной системы.", status: "not_started", progress: 0, plannedStartDate: "2026-07-25", plannedFinishDate: "2026-09-15", actualFinishDate: "", publicComment: "", internalComment: "", visibleToCustomer: true, order: 2 },
      { id: "s4", title: "Сдача-приёмка", description: "Испытания, акты, сдача.", status: "not_started", progress: 0, plannedStartDate: "2026-09-16", plannedFinishDate: "2026-09-30", actualFinishDate: "", publicComment: "", internalComment: "", visibleToCustomer: true, order: 3 },
    ],
    documents: [
      { id: "d-kp", title: "Коммерческое предложение — фасад", category: "Договоры", file: "KP_TSS_Noyabrsk_fasad.docx", type: "docx", size: 34915, status: "published", version: 1, isActual: true, stageId: "s1", uploadedBy: "Администратор", uploadedAt: "2026-06-05", publicDescription: "Коммерческое предложение по фасадным работам.", internalComment: "", isNewForCustomer: true, visibleToCustomer: true, versions: [] },
      { id: "d-smeta", title: "Сметный расчёт (фасад)", category: "Сметы", file: "Smetnyy_raschet_TSS_Noyabrsk_fasad_UPDATED.xlsx", type: "xlsx", size: 21497, status: "published", version: 2, isActual: true, stageId: "s2", uploadedBy: "Администратор", uploadedAt: "2026-07-02", publicDescription: "Актуальный сметный расчёт.", internalComment: "Обновлено после уточнения объёмов.", isNewForCustomer: true, visibleToCustomer: true,
        versions: [{ version: 1, file: "Копия Smetnyy_raschet_TSS_Noyabrsk_fasad_UPDATED.xlsx", uploadedAt: "2026-06-20", uploadedBy: "Администратор" }] },
      { id: "d-tz", title: "Техническое задание (ДВ)", category: "Прочее", file: "Копия TZ_DV_TSS_Noyabrsk_fasad_UPDATED.xlsx", type: "xlsx", size: 30796, status: "draft", version: 1, isActual: true, stageId: "s2", uploadedBy: "Администратор", uploadedAt: "2026-07-06", publicDescription: "", internalComment: "Черновик, не показывать заказчику.", isNewForCustomer: false, visibleToCustomer: true, versions: [] },
    ],
    customerRequiredActions: [
      { id: "a1", title: "Согласовать коммерческое предложение", description: "Проверьте КП и подтвердите согласие.", type: "Согласовать", status: "done", dueDate: "2026-06-15", visibleToCustomer: true },
      { id: "a2", title: "Согласовать смету", description: "Проверьте актуальную смету по фасаду.", type: "Согласовать", status: "waiting", dueDate: "2026-07-20", visibleToCustomer: true },
      { id: "a3", title: "Подтвердить дату выезда бригады", description: "Уточните удобную дату старта монтажа.", type: "Проверить", status: "waiting", dueDate: "2026-07-22", visibleToCustomer: true },
    ],
    customerUsers: [
      { id: "u1", email: "user@cube.ru", login: "user@cube.ru", role: "Заказчик", accessStatus: "active", lastLoginAt: "2026-07-07 18:20" },
    ],
    events: [
      { id: "e1", type: "object_created", title: "Объект создан", description: "TSS-02-2026 — Фасад, Ноябрьск.", createdAt: "2026-06-01 10:00", author: "Администратор", visibility: "internal" },
      { id: "e2", type: "doc_published", title: "Опубликован документ", description: "Коммерческое предложение — фасад.", createdAt: "2026-06-05 12:30", author: "Администратор", visibility: "public" },
      { id: "e3", type: "stage_status", title: "Этап завершён", description: "Обследование объекта → завершён.", createdAt: "2026-06-09 17:00", author: "Администратор", visibility: "public" },
      { id: "e4", type: "doc_version", title: "Новая версия документа", description: "Сметный расчёт (фасад) — версия 2.", createdAt: "2026-07-02 11:10", author: "Администратор", visibility: "public" },
      { id: "e5", type: "customer_open", title: "Заказчик открыл объект", description: "user@cube.ru.", createdAt: "2026-07-07 18:20", author: "user@cube.ru", visibility: "internal" },
    ],
  },
];

/* ===================== Стор ===================== */
const STORE_KEY = "cube:objects:store:v2";

// Режим: по умолчанию API включён (бэкенд живой). Выключить (вернуться к
// localStorage-мокам с сидом DEFAULT_OBJECTS): localStorage['objects:api'] = '0'.
function apiEnabled() {
  try { if (localStorage.getItem("objects:api") === "0") return false; } catch {}
  return true;
}
// Публичный флаг режима (для UI: presigned-загрузка vs base64 в localStorage-режиме).
export function usesApi() { return apiEnabled(); }

/* --- localStorage-режим (как было) --- */
function loadStoreLS() {
  const s = lsGet(STORE_KEY, null);
  if (s && Array.isArray(s.objects)) return s;
  const seed = { objects: JSON.parse(JSON.stringify(DEFAULT_OBJECTS)) };
  lsSet(STORE_KEY, seed);
  return seed;
}
function saveStoreLS(store) { lsSet(STORE_KEY, store); }

/* --- API-режим: in-memory кэш + фоновая гидрация + сквозная запись --- */
const _mem = { objects: [] };
let _hydrated = false;
let _hydrating = null;

function emitChanged() { try { window.dispatchEvent(new CustomEvent("objects:changed")); } catch {} }

// Подтянуть объекты с бэкенда в кэш. Вызывается фоном (не блокирует UI); при успехе
// шлёт событие objects:changed, на которое подписан ObjectsSection и перерисовывается.
export async function hydrateObjects({ force = false } = {}) {
  if (!apiEnabled()) return;
  if (_hydrating) return _hydrating;
  if (_hydrated && !force) return;
  _hydrating = (async () => {
    try {
      const data = await api("/objects", { method: "GET" });
      _mem.objects = Array.isArray(data && data.objects) ? data.objects : [];
      emitChanged();
    } catch {
      // не залогинен / бэкенд недоступен — оставляем текущий кэш
    } finally {
      _hydrated = true;   // больше не триггерим из loadStore; повтор — только force
      _hydrating = null;
    }
  })();
  return _hydrating;
}

// Список зарегистрированных учётных записей (для выбора заказчика при создании объекта).
// Возвращает [{ id, email, name, group, role, org }]. При ошибке/локальном режиме — [].
export async function listAccounts() {
  if (!apiEnabled()) return [];
  try {
    const data = await api("/admin/users", { method: "GET" });
    const users = Array.isArray(data && data.users) ? data.users : Array.isArray(data) ? data : [];
    return users.map((u) => ({
      id: u.id, email: u.email || "", name: u.name || "",
      group: u.group || u.user_group || "", role: u.role || "customer", org: u.org || "",
    }));
  } catch {
    return [];
  }
}

// Подтянуть организацию по ИНН через DaData-прокси (POST /profile/dadata).
// Возвращает { name, kpp, address } или null. Использует api() с авто-refresh на 401.
export async function lookupOrgByInn(inn) {
  const q = String(inn || "").replace(/\D/g, "");
  if (!(q.length === 10 || q.length === 12)) return null;
  try {
    const data = await api("/profile/dadata", { method: "POST", body: { mode: "find", query: q } });
    const s = data && data.suggestions && data.suggestions[0];
    if (!s) return null;
    return { name: s.value || "", kpp: (s.data && s.data.kpp) || "", address: (s.data && s.data.address && s.data.address.value) || "" };
  } catch {
    return null;
  }
}

/* --- Файлы (S3 через cube-files): presigned загрузка/скачивание --- */
// Загрузить файл в Object Storage напрямую (браузер → S3 по presigned PUT).
// Возвращает { key, type, size, name } для сохранения в метаданные документа.
export async function uploadFile({ objectId, docId, file }) {
  const { key, uploadUrl } = await api("/files/upload-url", {
    method: "POST",
    body: { objectId, docId, filename: file.name, contentType: file.type || "application/octet-stream" },
  });
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
    // presigned-URL самодостаточен — без cookie/Authorization
  });
  if (!put.ok) throw new Error(`S3 upload failed (${put.status})`);
  return { key, name: file.name, type: extOf(file.name), size: file.size };
}
// Получить временную ссылку на скачивание (проверка доступа — на бэкенде).
export async function downloadUrl(key, name) {
  const q = `key=${encodeURIComponent(key)}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
  const { url } = await api(`/files/download-url?${q}`, { method: "GET" });
  return url;
}
// Удалить файл из S3 (best-effort, при удалении документа).
export function deleteFile(key) {
  if (!key || !apiEnabled()) return;
  api(`/files?key=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(reportSyncErr);
}

// Фоновая запись изменений на бэкенд (write-through). Ошибки не роняют UI.
function reportSyncErr(e) { try { console.warn("[objects] sync error:", (e && e.message) || e); } catch {} }

// Пишем по каждому объекту СТРОГО по очереди (FIFO), чтобы create→edit→delete
// применялись на бэкенде в том же порядке, что и локально (иначе гонки затрут данные).
const _chains = new Map();
function enqueue(id, fn) {
  const prev = _chains.get(id) || Promise.resolve();
  const next = prev.then(fn, fn).catch(reportSyncErr); // выполняем даже если предыдущий шаг упал
  _chains.set(id, next);
  next.finally(() => { if (_chains.get(id) === next) _chains.delete(id); });
  return next;
}
function pushCreate(o) { enqueue(o.id, () => api("/objects", { method: "POST", body: o })); }
function pushPut(o)    { enqueue(o.id, () => api(`/objects/${encodeURIComponent(o.id)}`, { method: "PUT", body: o })); }
function pushDelete(id){ enqueue(id,   () => api(`/objects/${encodeURIComponent(id)}`, { method: "DELETE" })); }

/* --- общий слой --- */
function loadStore() {
  if (!apiEnabled()) return loadStoreLS();
  if (!_hydrated && !_hydrating) hydrateObjects(); // первый read стартует гидрацию
  return _mem;
}
function findObj(store, id) { return store.objects.find((o) => o.id === id) || null; }

// Все мутации проходят через withStore: в localStorage-режиме просто сохраняем стор,
// в API-режиме диффим объекты до/после и шлём POST (создан) / PUT (изменён) / DELETE (удалён).
function withStore(mut) {
  const store = loadStore();
  if (!apiEnabled()) { const r = mut(store); saveStoreLS(store); return r; }

  const beforeIds = new Set(store.objects.map((o) => o.id));
  const beforeHash = new Map(store.objects.map((o) => [o.id, JSON.stringify(o)]));
  const r = mut(store);
  const afterIds = new Set(store.objects.map((o) => o.id));
  for (const o of store.objects) {
    if (!beforeIds.has(o.id)) pushCreate(o);
    else if (beforeHash.get(o.id) !== JSON.stringify(o)) pushPut(o);
  }
  for (const id of beforeIds) { if (!afterIds.has(id)) pushDelete(id); }
  return r;
}

/* ===================== Публичный API объектов ===================== */
export function listObjects() { return loadStore().objects.slice(); }
export function getObject(id) {
  const o = findObj(loadStore(), id);
  return o ? JSON.parse(JSON.stringify(o)) : null;
}
export function updateObject(id, patch, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return null;
    if (patch.status && patch.status !== o.status) {
      pushEvent(o, { type: "status_changed", title: "Изменён статус объекта", description: `${labelOf(OBJECT_STATUSES, o.status)} → ${labelOf(OBJECT_STATUSES, patch.status)}`, author, visibility: "public" });
    }
    Object.assign(o, patch, { lastUpdatedAt: today() });
    return JSON.parse(JSON.stringify(o));
  });
}
export function createObject({ title = "Новый объект", templateCode = "free", customerName = "", customerEmail = "", city = "", responsibleName = "", responsibleRole = "", responsibleEmail = "", stages: stageNames = null, author = "Администратор" } = {}) {
  return withStore((store) => {
    // Учитываем правки админа (getTemplates), с откатом на базовый список.
    const tpl = templateByCode(templateCode) || OBJECT_TEMPLATES.find((t) => t.code === templateCode) || OBJECT_TEMPLATES[OBJECT_TEMPLATES.length - 1];
    // Технический ID с префиксом по типу работ: ELM-…, OVK-…, PRO-… (не полностью случайный).
    const id = uid(tpl.prefix || "OBJ").toUpperCase();
    const names = Array.isArray(stageNames) ? stageNames.map((s) => String(s).trim()).filter(Boolean) : (tpl.stages || []);
    const stages = names.map((name, i) => ({ id: uid("s"), title: name, description: "", status: i === 0 ? "in_progress" : "not_started", progress: 0, plannedStartDate: "", plannedFinishDate: "", actualFinishDate: "", publicComment: "", internalComment: "", visibleToCustomer: true, order: i }));
    const email = String(customerEmail || "").trim().toLowerCase();
    // Выбранная учётка-заказчик получает доступ: пишем ownerEmail + запись в customerUsers.
    const customerUsers = email ? [{ id: uid("cu"), email, name: customerName || email, addedAt: today() }] : [];
    const obj = {
      id, title, customerName, customerEmail: email, inn: "", kpp: "", city, address: "", contractNumber: "",
      status: "draft", progress: 0, currentStageId: stages[0]?.id || "",
      responsibleName, responsibleRole, responsiblePhone: "", responsibleEmail: String(responsibleEmail || "").trim().toLowerCase(),
      plannedFinishDate: "", lastUpdatedAt: today(), internalNote: "",
      now: { doingNow: "", nextStep: "", nextDeadline: "", customerNeeds: "", attention: "on_track" },
      ownerEmail: email, stages, documents: [], customerRequiredActions: [], customerUsers,
      events: [],
      templateCode,
    };
    pushEvent(obj, { type: "object_created", title: "Объект создан", description: `${id} — ${title}${tpl.code !== "free" ? ` (шаблон: ${tpl.label})` : ""}.`, author, visibility: "internal" });
    store.objects.unshift(obj);
    return JSON.parse(JSON.stringify(obj));
  });
}

export function deleteObject(id) {
  return withStore((store) => { const i = store.objects.findIndex((o) => o.id === id); if (i >= 0) store.objects.splice(i, 1); });
}

/* ---- Этапы ---- */
export function addStage(id, stage, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    const s = { id: uid("s"), title: stage.title || "Новый этап", description: stage.description || "", status: stage.status || "not_started", progress: stage.progress || 0, plannedStartDate: stage.plannedStartDate || "", plannedFinishDate: stage.plannedFinishDate || "", actualFinishDate: "", publicComment: "", internalComment: "", visibleToCustomer: stage.visibleToCustomer !== false, order: o.stages.length };
    o.stages.push(s);
    pushEvent(o, { type: "stage_added", title: "Добавлен этап", description: s.title, author, visibility: "internal" });
    touch(o);
  });
}
export function updateStage(id, stageId, patch, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    const s = o.stages.find((x) => x.id === stageId); if (!s) return;
    if (patch.status && patch.status !== s.status) {
      pushEvent(o, { type: "stage_status", title: "Изменён статус этапа", description: `${s.title}: ${labelOf(STAGE_STATUSES, s.status)} → ${labelOf(STAGE_STATUSES, patch.status)}`, author, visibility: "public" });
      if (patch.status === "done" && !s.actualFinishDate && !patch.actualFinishDate) patch.actualFinishDate = today();
    }
    Object.assign(s, patch); touch(o);
  });
}
export function removeStage(id, stageId) {
  return withStore((store) => { const o = findObj(store, id); if (!o) return; o.stages = o.stages.filter((s) => s.id !== stageId); o.stages.forEach((s, i) => (s.order = i)); touch(o); });
}
export function reorderStages(id, fromIdx, toIdx) {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= o.stages.length || toIdx >= o.stages.length) return;
    const [m] = o.stages.splice(fromIdx, 1); o.stages.splice(toIdx, 0, m); o.stages.forEach((s, i) => (s.order = i)); touch(o);
  });
}

/* ---- Документы + версии ---- */
export function addDocument(id, doc, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    const d = { id: uid("d"), title: doc.title || doc.name || "Документ", category: doc.category || "Прочее", file: doc.file || "", type: doc.type || extOf(doc.name || doc.file || ""), size: doc.size || 0, status: doc.status || "draft", version: 1, isActual: true, stageId: doc.stageId || "", uploadedBy: author, uploadedAt: today(), publicDescription: doc.publicDescription || "", internalComment: doc.internalComment || "", isNewForCustomer: false, visibleToCustomer: doc.visibleToCustomer !== false, key: doc.key || "", url: doc.url || "", versions: [] };
    o.documents.push(d);
    pushEvent(o, { type: "doc_added", title: "Добавлен документ", description: d.title, author, visibility: "internal" });
    touch(o); return d.id;
  });
}
export function updateDocument(id, docId, patch, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    const d = o.documents.find((x) => x.id === docId); if (!d) return;
    if (patch.status && patch.status !== d.status) {
      if (patch.status === "published") { pushEvent(o, { type: "doc_published", title: "Опубликован документ", description: d.title, author, visibility: "public" }); d.isNewForCustomer = true; }
      if (patch.status === "hidden") pushEvent(o, { type: "doc_hidden", title: "Документ скрыт", description: d.title, author, visibility: "internal" });
    }
    Object.assign(d, patch); touch(o);
  });
}
export function addDocumentVersion(id, docId, ver, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    const d = o.documents.find((x) => x.id === docId); if (!d) return;
    d.versions = d.versions || [];
    d.versions.unshift({ version: d.version, file: d.file, key: d.key || "", url: d.url || "", uploadedAt: d.uploadedAt, uploadedBy: d.uploadedBy });
    d.version = (d.version || 1) + 1;
    d.file = ver.file || d.file; d.key = ver.key || d.key; d.url = ver.url || d.url; d.type = ver.type || d.type; d.size = ver.size || d.size;
    d.uploadedAt = today(); d.uploadedBy = author; d.isActual = true; d.isNewForCustomer = d.status === "published";
    pushEvent(o, { type: "doc_version", title: "Новая версия документа", description: `${d.title} — версия ${d.version}`, author, visibility: "public" });
    touch(o);
  });
}
export function removeDocument(id, docId) {
  return withStore((store) => { const o = findObj(store, id); if (!o) return; o.documents = o.documents.filter((d) => d.id !== docId); touch(o); });
}

/* ---- Действия заказчика ---- */
export function addAction(id, action, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    o.customerRequiredActions = o.customerRequiredActions || [];
    o.customerRequiredActions.push({ id: uid("a"), title: action.title || "Действие", description: action.description || "", type: action.type || "Прочее", status: action.status || "waiting", dueDate: action.dueDate || "", visibleToCustomer: action.visibleToCustomer !== false });
    pushEvent(o, { type: "action_added", title: "Добавлено действие для заказчика", description: action.title || "", author, visibility: "internal" });
    touch(o);
  });
}
export function updateAction(id, actionId, patch) {
  return withStore((store) => { const o = findObj(store, id); if (!o) return; const a = (o.customerRequiredActions || []).find((x) => x.id === actionId); if (!a) return; Object.assign(a, patch); touch(o); });
}
export function removeAction(id, actionId) {
  return withStore((store) => { const o = findObj(store, id); if (!o) return; o.customerRequiredActions = (o.customerRequiredActions || []).filter((a) => a.id !== actionId); touch(o); });
}

/* ---- События ---- */
function pushEvent(o, ev) { o.events = o.events || []; o.events.unshift({ id: uid("e"), createdAt: nowIso().slice(0, 16).replace("T", " "), visibility: "internal", author: "Администратор", ...ev }); }
export function addEvent(id, ev, author = "Администратор") {
  return withStore((store) => { const o = findObj(store, id); if (!o) return; pushEvent(o, { ...ev, author }); touch(o); });
}
function touch(o) { o.lastUpdatedAt = today(); }

/* ---- Уведомление заказчика (мок → событие) ---- */
export function notifyCustomer(id, { subject, text, docTitle } = {}, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    pushEvent(o, { type: "notify", title: "Заказчику отправлено уведомление", description: docTitle ? `Новый документ: ${docTitle}` : (subject || "Обновление по объекту"), author, visibility: "internal" });
    touch(o);
  });
}

/* ===================== Проекции для пользовательской части ===================== */
// Заказчик видит: опубликованные видимые документы (актуальные версии),
// видимые этапы, действия и публичные события. Черновики/скрытое/внутреннее — нет.
export function getCustomerView(id) {
  const o = getObject(id); if (!o) return null;
  return {
    ...o,
    internalNote: undefined,
    stages: (o.stages || []).filter((s) => s.visibleToCustomer).map((s) => ({ ...s, internalComment: undefined })),
    documents: (o.documents || []).filter((d) => d.visibleToCustomer && d.status === "published").map((d) => ({ ...d, internalComment: undefined, versions: [] })),
    customerRequiredActions: (o.customerRequiredActions || []).filter((a) => a.visibleToCustomer),
    events: (o.events || []).filter((e) => e.visibility === "public"),
  };
}
export function listObjectsForCustomer(email) {
  const e = String(email || "").toLowerCase();
  return listObjects().filter((o) => (o.customerUsers || []).some((u) => String(u.email || "").toLowerCase() === e) || String(o.ownerEmail || "").toLowerCase() === e);
}

/* ===================== Совместимость со старым кодом ===================== */
export function listOwners() {
  const map = new Map();
  listObjects().forEach((o) => {
    (o.customerUsers && o.customerUsers.length ? o.customerUsers.map((u) => u.email) : [o.ownerEmail]).forEach((email) => {
      const e = String(email || "").toLowerCase(); if (!e) return;
      if (!map.has(e)) map.set(e, { email: e, name: o.customerName || e, inn: o.inn || "", kpp: o.kpp || "", count: 0 });
      map.get(e).count += 1;
    });
  });
  return [...map.values()];
}
export function stageStatusLabel(code) { return labelOf(STAGE_STATUSES, code); }
export const DOCS_BASE_URL = "/objects";
