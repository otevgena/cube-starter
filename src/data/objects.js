// src/data/objects.js
// Цифровой паспорт объекта. Два режима хранения (см. секцию «Стор» ниже):
//   • API      — источник истины бэкенд (api.cube-tech.ru): объект пишется целиком
//                через POST/PUT/DELETE, список подтягивается через GET /objects;
//   • localStorage — офлайн-моки с сидом DEFAULT_OBJECTS (как было раньше).
// Публичные функции остаются СИНХРОННЫМИ (UI не переписывался): мутации меняют
// in-memory кэш сразу, а запись на бэкенд идёт фоном (write-through).
// Переключатель: localStorage['objects:api'] = '0' → вернуться к localStorage.
import { api, auth } from "@/lib/auth.js";
import { effectivePerms, normalizeOverrides, isStaffRole } from "@/lib/perms.js";

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
  { code: "in_progress",      label: "В работе",          tone: "#2b6cb0" },
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
    // Этапы фасада — с описанием, что входит в каждый (заказчик видит описание,
    // когда этап «В работе»). Элемент этапа может быть строкой или {title,description}.
    stages: [
      { title: "Обследование и контрольные замеры", description: "Осмотр фасада, фотофиксация, замеры, определение границ и объёмов работ." },
      { title: "Согласование технического решения, ТЗ и сметы", description: "Утверждение состава фасадного узла, материалов, цвета профлиста, стоимости и сроков." },
      { title: "Подготовка объекта и монтаж лесов", description: "Передача фронта работ, организация опасной зоны, доставка материалов, установка и приёмка строительных лесов." },
      { title: "Демонтаж и подготовка основания", description: "Демонтаж профлиста, направляющих и повреждённых элементов, очистка стены, подготовка основания и локального проёма." },
      { title: "Подконструкция, утепление и скрытые работы", description: "Монтаж направляющих, минеральной ваты, мембран, крепежа, фотофиксация и оформление актов скрытых работ." },
      { title: "Монтаж профлиста, откосов и примыканий", description: "Обшивка фасада профлистом, закрытие проёма, устройство оконных откосов, доборных элементов и герметизация." },
      { title: "Контроль качества и сдача объекта", description: "Проверка выполненных работ, демонтаж лесов, уборка, исполнительная документация, фотоархив и итоговый акт." },
    ] },
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
// Этап шаблона: строка "Название" ИЛИ {title, description}. Строки без описания
// оставляем строками (компактно), объекты — сохраняем с описанием.
function normStages(arr) {
  return (Array.isArray(arr) ? arr : []).map((s) => {
    if (typeof s === "string") return s.trim();
    const title = String(s?.title || "").trim();
    const description = String(s?.description || "").trim();
    return description ? { title, description } : title;
  }).filter((s) => (typeof s === "string" ? s : s.title));
}
function cleanTplPatch(patch = {}) {
  const c = {};
  if (patch.label != null) c.label = String(patch.label).trim();
  if (patch.prefix != null) c.prefix = normalizePrefix(patch.prefix);
  if (patch.stages != null) c.stages = normStages(patch.stages);
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
  const tpl = { code: uid("tpl"), label: String(label || "").trim() || "Новый шаблон", prefix: normalizePrefix(prefix) || "OBJ", stages: normStages(stages) };
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

/* ===================== Типовые этапы (общая библиотека) =====================
   Плоский, курируемый админом список типовых этапов. Правится в «Шаблоны →
   Типовые этапы» и вставляется в любой объект/шаблон кнопкой «Добавить из типовых».
   Элемент — { id, title, description? }. Хранится в localStorage; при первом чтении
   сидим из STAGE_PRESETS (фронтовое хранилище, как и правки шаблонов). */
const LS_STAGE_LIB = "cube:stagelib";
function normLibStage(s) {
  if (typeof s === "string") return { id: uid("stg"), title: s.trim(), description: "" };
  return { id: s && s.id ? s.id : uid("stg"), title: String((s && s.title) || "").trim(), description: String((s && s.description) || "").trim() };
}
export function getStageLibrary() {
  let raw = lsGet(LS_STAGE_LIB, null);
  if (!Array.isArray(raw)) { raw = STAGE_PRESETS.map((s) => normLibStage(s)); lsSet(LS_STAGE_LIB, raw); }
  return raw.map(normLibStage).filter((s) => s.title);
}
export function setStageLibrary(arr) {
  const list = (Array.isArray(arr) ? arr : []).map(normLibStage).filter((s) => s.title);
  lsSet(LS_STAGE_LIB, list);
  return list;
}
export function addStageLib({ title, description = "" } = {}) {
  const item = normLibStage({ title, description });
  if (!item.title) return null;
  setStageLibrary([...getStageLibrary(), item]);
  return item;
}
export function updateStageLib(id, patch = {}) {
  setStageLibrary(getStageLibrary().map((s) => (s.id === id
    ? { ...s, ...(patch.title != null ? { title: String(patch.title).trim() } : {}), ...(patch.description != null ? { description: String(patch.description).trim() } : {}) }
    : s)));
}
export function removeStageLib(id) { setStageLibrary(getStageLibrary().filter((s) => s.id !== id)); }

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
// Сотрудник = учётная запись с «штатной» ролью (role ∈ STAFF_ROLES). Источник
// истины — бэкенд (/admin/users). Раньше жили в localStorage (cube:employees*);
// теперь роль+оверрайды хранятся на учётке, права считает сервер (perms.js).
//
// getEmployees()/employeeByEmail()/capsForEmail() остаются СИНХРОННЫМИ — их зовёт
// подбор ответственного при рендере. Поэтому держим синхронный кэш `_staff`,
// который гидрируется из /admin/users (только под админом; иначе []).

// Старый набор caps (для обратной совместимости с UI-подписями, если где-то остались).
export const EMP_CAPS = [
  { key: "objects",   label: "Управлять объектами",     hint: "Редактировать закреплённые объекты: этапы, статусы, поля." },
  { key: "docs",      label: "Документы",               hint: "Загружать, публиковать и скрывать документы объекта." },
  { key: "messages",  label: "Переписка с заказчиком",  hint: "Отвечать на сообщения заказчика по объекту." },
  { key: "create",    label: "Создавать объекты",       hint: "Заводить новые объекты." },
  { key: "employees", label: "Управлять сотрудниками",  hint: "Добавлять сотрудников и выдавать им права." },
];
export const EMP_CAP_KEYS = EMP_CAPS.map((c) => c.key);
export function normalizeCaps(caps = {}) { const c = {}; EMP_CAP_KEYS.forEach((k) => (c[k] = !!(caps && caps[k]))); return c; }

// Из набора прав выводим «старые» caps — чтобы прежние места UI не сломались.
function capsFromPerms(permSet) {
  const has = (p) => (permSet instanceof Set ? permSet.has(p) : false);
  return {
    objects:   has("objects.edit"),
    docs:      has("docs.upload") || has("docs.delete"),
    messages:  has("messages.reply"),
    create:    has("objects.create"),
    employees: has("staff.manage"),
  };
}

// Учётка → сотрудник (единый shape для UI: id/fio/position/email/role/perms/caps).
function mapAccountToEmp(u) {
  const role = u.role || "customer";
  const ov = normalizeOverrides(u.permOverrides);
  const permSet = Array.isArray(u.perms) ? new Set(u.perms) : effectivePerms(role, ov);
  const email = String(u.email || "").trim().toLowerCase();
  return {
    id: u.id, email,
    fio: u.name || u.email || "(без имени)",
    position: u.position || "",
    role, permOverrides: ov, perms: [...permSet],
    caps: capsFromPerms(permSet),
  };
}

let _staff = [];
let _staffHydrated = false;
let _staffHydrating = null;

// Подтянуть штатных сотрудников с бэкенда (учётки со штатной ролью).
export async function hydrateStaff(force = false) {
  if (!apiEnabled()) { _staff = []; _staffHydrated = true; return _staff; }
  if (_staffHydrated && !force) return _staff;
  if (_staffHydrating) return _staffHydrating;
  _staffHydrating = (async () => {
    try {
      const data = await api("/admin/users", { method: "GET" });
      const users = Array.isArray(data && data.users) ? data.users : Array.isArray(data) ? data : [];
      _staff = users.filter((u) => isStaffRole(u.role)).map(mapAccountToEmp);
      emitChanged();
    } catch {
      // не админ / бэкенд недоступен — оставляем текущий кэш
    } finally {
      _staffHydrated = true;
      _staffHydrating = null;
    }
    return _staff;
  })();
  return _staffHydrating;
}

export function getEmployees() {
  if (!_staffHydrated) hydrateStaff();   // ленивая гидрация; до ответа — текущий кэш
  return _staff.slice();
}
export function employeeById(id) { return _staff.find((e) => e.id === id) || null; }
export function employeeByEmail(email) {
  const e = String(email || "").trim().toLowerCase(); if (!e) return null;
  return _staff.find((x) => (x.email || "").toLowerCase() === e) || null;
}
// Права сотрудника по e-mail (для проверок в UI). null — не сотрудник.
export function capsForEmail(email) { const emp = employeeByEmail(email); return emp ? emp.caps : null; }

// Полные данные учётки (роль + точные оверрайды) — для карточки сотрудника.
export async function adminGetUser(id) {
  const data = await api(`/admin/users/${encodeURIComponent(id)}`, { method: "GET" });
  return (data && data.user) || null;
}

// Назначить/обновить сотрудника: PATCH роль+должность+оверрайды на учётке.
// patch: { role, position, permOverrides:{grant,revoke} }. Возвращает обновлённую учётку.
export async function saveStaff(id, { role, position, permOverrides } = {}) {
  const body = {};
  if (role !== undefined) body.role = role;
  if (position !== undefined) body.position = position;
  if (permOverrides !== undefined) body.permOverrides = permOverrides;
  const data = await api(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body });
  await hydrateStaff(true);
  return (data && data.user) || null;
}

// Убрать из сотрудников — понизить учётку до заказчика (не удаляя саму учётку),
// заодно очистив персональные оверрайды прав.
export async function removeStaff(id) {
  await api(`/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { role: "customer", permOverrides: { grant: [], revoke: [] } },
  });
  await hydrateStaff(true);
}

// Сброс кэша сотрудников при смене пользователя (вход/выход).
try {
  let _lastStaffTok = auth.get();
  auth.subscribe((t) => {
    if (t === _lastStaffTok) return;
    _lastStaffTok = t;
    _staff = []; _staffHydrated = false; _staffHydrating = null;
  });
} catch {}

/* ===================== Переписка по объекту (бэкенд) =====================
   Тред «заказчик ↔ ответственный» хранится ВНУТРИ объекта (o.messages[]) в
   cube-objects. Добавление идёт отдельным эндпоинтом POST /objects/{id}/messages
   (доступен и заказчику: он не может PUT-ить объект целиком). Бэкенд шлёт письмо
   второй стороне (customer→ответственному, staff→заказчику) через Postbox.
   В localStorage-режиме (objects:api=0) — тот же o.messages, но без сети/почты. */

// Сообщения читаем прямо из кэша объекта.
export function getMessages(objId) {
  const o = findObj(loadStore(), objId);
  return o && Array.isArray(o.messages) ? o.messages.slice() : [];
}
// Состояние треда: 'empty' | 'awaiting' (ждём ответа сотрудника) | 'answered'.
export function threadStatus(objId) {
  const o = findObj(loadStore(), objId);
  if (!o) return "empty";
  if (o.threadStatus) return o.threadStatus;
  const list = Array.isArray(o.messages) ? o.messages : [];
  if (!list.length) return "empty";
  return list[list.length - 1].from === "customer" ? "awaiting" : "answered";
}
// e-mail ответственного (для подсказки в UI; фактическую рассылку делает бэкенд).
function emailOfResponsible(o) {
  if (!o) return "";
  if (o.responsibleEmail) return String(o.responsibleEmail).trim();
  const emp = getEmployees().find((e) => e.fio && e.fio === o.responsibleName);
  return (emp && emp.email) || "";
}

// Загрузка вложения переписки в S3 (browser → presigned PUT, kind:'message').
// Возвращает { key, name, size, mime } для attachments сообщения.
export async function uploadMessageAttachment({ objectId, file }) {
  const { key, uploadUrl } = await api("/files/upload-url", {
    method: "POST",
    body: { objectId, kind: "message", filename: file.name, contentType: file.type || "application/octet-stream" },
  });
  const put = await fetch(uploadUrl, {
    method: "PUT", body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!put.ok) throw new Error(`S3 upload failed (${put.status})`);
  return { key, name: file.name, size: file.size, mime: file.type || "" };
}

// from: 'customer' | 'staff'. attachments: [{key,name,size,mime}].
// Оптимистично добавляет сообщение в кэш и шлёт на бэкенд; возвращает
// { msg, mailedTo, promise }. По ответу сервера согласует тред (id/время).
export function addMessage(objId, { from = "customer", author = "", text = "", attachments = [] } = {}) {
  const body = String(text || "").trim();
  const atts = Array.isArray(attachments) ? attachments : [];
  if (!body && !atts.length) return null;
  const store = loadStore();
  const o = findObj(store, objId);
  if (!o) return null;

  const tz = myTimezone();
  const msg = { id: uid("msg"), from, author, text: body, attachments: atts, tz, at: nowIso(), pending: apiEnabled() };
  o.messages = Array.isArray(o.messages) ? o.messages : [];
  o.messages.push(msg);
  o.threadStatus = from === "customer" ? "awaiting" : "answered";
  o.threadUpdatedAt = msg.at;
  const mailedTo = from === "customer" ? (emailOfResponsible(o) || "info@cube-tech.ru") : "";

  if (!apiEnabled()) { saveStoreLS(store); emitChanged(); return { msg, mailedTo }; }

  emitChanged(); // оптимистично показываем сообщение
  const promise = api(`/objects/${encodeURIComponent(objId)}/messages`, {
    method: "POST",
    body: { text: body, attachments: atts, tz },
  }).then((res) => {
    const cur = findObj(loadStore(), objId);
    if (cur) {
      const so = res && res.object;
      if (so && Array.isArray(so.messages)) {
        // сервер — источник истины по треду
        cur.messages = so.messages;
        cur.threadStatus = so.threadStatus || cur.threadStatus;
        cur.threadUpdatedAt = so.threadUpdatedAt || cur.threadUpdatedAt;
      } else if (res && res.message) {
        const i = cur.messages.findIndex((m) => m.id === msg.id);
        if (i >= 0) cur.messages[i] = res.message; else cur.messages.push(res.message);
      }
      emitChanged();
    }
    return res;
  }).catch((e) => {
    const cur = findObj(loadStore(), objId);
    if (cur) { const m = (cur.messages || []).find((x) => x.id === msg.id); if (m) { m.pending = false; m.failed = true; } emitChanged(); }
    reportSyncErr(e);
    throw e;
  });
  return { msg, mailedTo, promise };
}

/* --- Подписка на e-mail-уведомления по объекту (таблица object_subs на бэкенде) ---
   В localStorage-режиме (objects:api=0) — только локальный флаг, без сети/почты.
   Локальный кэш objects:subscribed держим и в API-режиме — чтобы кнопка мгновенно
   рисовала состояние до ответа сервера. */
const SUB_LS_KEY = "objects:subscribed";
function readSubLS() { return lsGet(SUB_LS_KEY, {}) || {}; }
function writeSubLS(map) { lsSet(SUB_LS_KEY, map); }
function setSubLS(objId, on) { const m = readSubLS(); if (on) m[objId] = true; else delete m[objId]; writeSubLS(m); }

// Локальное (мгновенное) состояние подписки — для первичной отрисовки кнопки.
export function isSubscribedLocal(objId) { return Boolean(readSubLS()[objId]); }

// Свериться с сервером (в API-режиме). Возвращает Promise<boolean>.
export async function getObjectSubscription(objId) {
  if (!apiEnabled()) return isSubscribedLocal(objId);
  try {
    const res = await api(`/objects/${encodeURIComponent(objId)}`, { method: "GET" });
    const on = Boolean(res && res.subscribed);
    setSubLS(objId, on);
    return on;
  } catch {
    return isSubscribedLocal(objId);
  }
}

// Включить/выключить подписку. Оптимистично пишем локальный кэш, затем на бэкенд.
// Возвращает Promise<boolean> — итоговое состояние (по ответу сервера).
export async function setObjectSubscription(objId, on) {
  const want = Boolean(on);
  setSubLS(objId, want);
  if (!apiEnabled()) return want;
  const res = await api(`/objects/${encodeURIComponent(objId)}/subscribe`, {
    method: "POST", body: { subscribed: want },
  });
  const server = Boolean(res && res.subscribed);
  setSubLS(objId, server);
  return server;
}

/* ===================== Утилиты ===================== */
function lsGet(key, fallback) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
let _seq = 0;
function uid(p = "id") { _seq += 1; return `${p}-${Date.now().toString(36)}-${_seq}`; }
function today() { const d = new Date(); return d.toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }
// Локальная отметка "YYYY-MM-DD HH:MM" (НЕ UTC) — чтобы событие отображалось
// в местном времени и parseTs (который трактует наивную строку как локальную)
// давал epoch, совпадающий с Date.now() из seen-логики.
function nowStampLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
// Часовой пояс автора для отметки времени в переписке: сперва выбранный в профиле
// (кэш profile:timezone), иначе — фактический пояс браузера.
function myTimezone() {
  try { const t = localStorage.getItem("profile:timezone"); if (t) return t; } catch {}
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; }
}
export function docUrl(objId, file) { return `/objects/${encodeURIComponent(objId)}/documents/${encodeURIComponent(file)}`; }

/* ===================== Маркеры «новое» (seen-state, v1 — localStorage) ===================== */
// Per-user отметки «видел объект» хранятся локально (без сервера). Логика:
// у объекта есть «сигнал новизны» — максимум времени последнего изменения
// (lastUpdatedAt), переписки (threadUpdatedAt / messages[].at) и событий ленты
// (events[].createdAt). Если сигнал новее отметки «видел» — показываем морковный
// бейдж «новое». Открытие объекта ставит отметку на текущий момент.
const SEEN_KEY = "objects:seen";
const SEEN_BASELINE_KEY = "objects:seenBaseline";

// Разбор разных форматов времени в epoch-мс: ISO, "YYYY-MM-DD HH:MM", "YYYY-MM-DD".
function parseTs(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

// Сигнал новизны объекта — максимум всех «времён изменения».
export function objectSignal(o) {
  if (!o) return 0;
  let max = 0;
  const bump = (v) => { const t = parseTs(v); if (t > max) max = t; };
  bump(o.lastUpdatedAt);
  bump(o.threadUpdatedAt);
  (o.events || []).forEach((e) => bump(e.ts || e.createdAt));
  (o.messages || []).forEach((m) => bump(m.at));
  return max;
}

function loadSeen() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") || {}; } catch { return {}; }
}
// Базовая линия первого визита: объекты, которые пользователь ещё ни разу не
// открывал, считаются «новыми» только если изменились ПОСЛЕ первого захода —
// иначе при первом входе бейджами покрылся бы весь список.
function seenBaseline() {
  try {
    let b = localStorage.getItem(SEEN_BASELINE_KEY);
    if (!b) { b = String(Date.now()); localStorage.setItem(SEEN_BASELINE_KEY, b); }
    return Number(b) || 0;
  } catch { return 0; }
}

export function isObjectUnseen(o) {
  if (!o) return false;
  const seen = loadSeen();
  const ref = o.id in seen ? seen[o.id] : seenBaseline();
  return objectSignal(o) > ref + 1000; // +1с допуск против дребезга
}

// Отметка «просмотрено» для объекта БЕЗ побочных эффектов — чтобы внутри
// детального вида решить, что показать (кружочек у статуса, New у документа):
// снимок ref делается ДО markObjectSeen на входе.
export function objectSeenRef(id) {
  if (!id) return 0;
  const seen = loadSeen();
  return id in seen ? (Number(seen[id]) || 0) : seenBaseline();
}
function evTs(e) { return (e && (e.ts || parseTs(e.createdAt))) || 0; }
// Есть ли непросмотренная (после ref) публичная смена статуса объекта/этапа.
export function hasUnseenStatus(o, ref) {
  if (!o) return false;
  return (o.events || []).some((e) =>
    e && e.visibility === "public" &&
    (e.type === "status_changed" || e.type === "stage_status") &&
    evTs(e) > (ref || 0) + 1000);
}

export function markObjectSeen(id) {
  if (!id) return;
  try {
    const seen = loadSeen();
    seen[id] = Date.now();
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    try { window.dispatchEvent(new Event("objects:seen")); } catch {}
  } catch {}
}

// Есть ли хоть один непросмотренный объект (для бейджа «новое» в меню аккаунта).
export function anyObjectUnseen(list) {
  const arr = Array.isArray(list) ? list : listObjects();
  return arr.some((o) => isObjectUnseen(o));
}

// Есть ли объект с непрочитанными сообщениями от другой стороны. Для сотрудника
// (mySide='staff') это единственный сигнал «новое»: собственные изменения по
// объекту (документы, смена статуса) администратора НЕ уведомляют — только
// сообщения заказчика. См. hasUnreadMessages.
export function anyUnreadMessages(list, mySide) {
  const arr = Array.isArray(list) ? list : listObjects();
  return arr.some((o) => hasUnreadMessages(o.id, mySide));
}

/* --- Маркеры «новое» на уровне сообщений переписки --- */
// Отдельный seen-state для треда объекта: точка у «Задать вопрос»/«Запросы» и у
// нового сообщения гаснет, когда собеседник долистал переписку (не при открытии
// самого объекта). Ключ хранит epoch последнего просмотренного сообщения.
const MSG_SEEN_KEY = "messages:seen";
function loadMsgSeen() {
  try { return JSON.parse(localStorage.getItem(MSG_SEEN_KEY) || "{}") || {}; } catch { return {}; }
}
function lastMsgTs(o) {
  let mx = 0;
  ((o && o.messages) || []).forEach((m) => { const t = parseTs(m.at); if (t > mx) mx = t; });
  return mx;
}
// Epoch отметки «видел переписку»: если тред ещё не смотрели — базовая линия
// первого визита (иначе вся СТАРАЯ переписка засветилась бы точками «новое»).
export function msgSeenAt(objId) {
  const s = loadMsgSeen();
  return objId in s ? (Number(s[objId]) || 0) : seenBaseline();
}
// Есть ли непрочитанные сообщения ОТ ДРУГОЙ стороны (mySide: 'customer'|'staff').
export function hasUnreadMessages(objId, mySide) {
  const o = getObject(objId);
  if (!o) return false;
  const other = mySide === "customer" ? "staff" : "customer";
  const seen = msgSeenAt(objId);
  return (o.messages || []).some((m) => m.from === other && parseTs(m.at) > seen + 1000);
}
// Epoch времени сообщения (для подсветки «новых» сообщений в панели переписки).
export function msgTs(m) { return m ? parseTs(m.at) : 0; }
// Отметить переписку просмотренной (гасит точку на «Запросы»/у сообщений).
export function markMessagesSeen(objId) {
  if (!objId) return;
  try {
    const o = getObject(objId);
    const ts = lastMsgTs(o) || Date.now();
    const s = loadMsgSeen();
    const fresh = (Number(s[objId]) || 0) < ts;
    if (fresh) {
      s[objId] = ts;
      localStorage.setItem(MSG_SEEN_KEY, JSON.stringify(s));
      try { window.dispatchEvent(new Event("messages:seen")); } catch {}
    }
    // Прочитанная переписка = объект просмотрен до времени последнего сообщения:
    // двигаем и объектную отметку вперёд, чтобы точка «новое» в списке/меню гасла
    // вместе с внутренней (но не перекрываем более поздние события — берём ts сообщений).
    const seen = loadSeen();
    if ((Number(seen[objId]) || 0) < ts) {
      seen[objId] = ts;
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
      try { window.dispatchEvent(new Event("objects:seen")); } catch {}
    }
  } catch {}
}

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

// Идёт ли первичная загрузка объектов с бэкенда. UI показывает спиннер, пока true,
// чтобы не мелькало «Пока нет объектов» до ответа сервера. В localStorage-режиме — всегда false.
export function isObjectsLoading() {
  if (!apiEnabled()) return false;
  return !_hydrated;
}

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
      const serverObjs = Array.isArray(data && data.objects) ? data.objects : [];
      const serverIds = new Set(serverObjs.map((o) => o.id));
      // Объект больше не «pending», только когда сервер РЕАЛЬНО вернул его в GET
      // (а не когда POST отдал 200): из-за read-after-write лага YDB следующий GET
      // может ещё не видеть свежую запись — тогда объект «мигает» и пропадает на 2–3 мин.
      for (const id of Array.from(_pendingCreates)) { if (serverIds.has(id)) _pendingCreates.delete(id); }
      // НЕ теряем только что созданные объекты, ещё не подтверждённые сервером: держим их в кэше.
      const pendingLocal = _mem.objects.filter((o) => _pendingCreates.has(o.id) && !serverIds.has(o.id));
      _mem.objects = [...pendingLocal, ...serverObjs];
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
// Получить временную ссылку на файл (проверка доступа — на бэкенде).
// inline=true — ссылка для просмотра в браузере (PDF/картинки/текст), иначе — скачивание.
export async function downloadUrl(key, name, { inline = false } = {}) {
  const q = `key=${encodeURIComponent(key)}${name ? `&name=${encodeURIComponent(name)}` : ""}${inline ? "&disposition=inline" : ""}`;
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
// Объекты, созданные локально, чей POST на бэк ещё не подтверждён — чтобы гидрация их не теряла.
const _pendingCreates = new Set();
function enqueue(id, fn) {
  const prev = _chains.get(id) || Promise.resolve();
  const next = prev.then(fn, fn).catch(reportSyncErr); // выполняем даже если предыдущий шаг упал
  _chains.set(id, next);
  next.finally(() => { if (_chains.get(id) === next) _chains.delete(id); });
  return next;
}
function pushCreate(o) {
  _pendingCreates.add(o.id);
  // «pending» снимаем НЕ по 200 POST, а когда объект реально вернётся в GET /objects
  // (см. hydrateObjects) — иначе read-after-write лаг YDB его «теряет» на пару минут.
  enqueue(o.id, () => api("/objects", { method: "POST", body: o }));
}
function pushPut(o)    { enqueue(o.id, () => api(`/objects/${encodeURIComponent(o.id)}`, { method: "PUT", body: o })); }
function pushDelete(id){ enqueue(id,   () => api(`/objects/${encodeURIComponent(id)}`, { method: "DELETE" })); }

// Сброс кэша при смене пользователя (вход/выход в той же вкладке). Иначе объекты
// (в т.ч. незавершённые pending-создания) предыдущей учётки «протекают» в список следующей.
try {
  let _lastToken = auth.get();
  auth.subscribe((t) => {
    if (t === _lastToken) return;
    _lastToken = t;
    _mem.objects = [];
    _pendingCreates.clear();
    _chains.clear();
    _hydrated = false;
    _hydrating = null;
    emitChanged();
  });
} catch {}

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
  let changed = false;
  for (const o of store.objects) {
    if (!beforeIds.has(o.id)) { pushCreate(o); changed = true; }
    else if (beforeHash.get(o.id) !== JSON.stringify(o)) { pushPut(o); changed = true; }
  }
  for (const id of beforeIds) { if (!afterIds.has(id)) { pushDelete(id); changed = true; } }
  // Локальная мутация видна сразу во всех открытых вьюхах (список объектов, лист доступа).
  if (changed) emitChanged();
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
// Синхронизировать имя заказчика в объекте с текущим отображаемым именем его
// учётки (имя учётки могло измениться после создания объекта). Правим и черновик,
// и опубликованный снимок — чтобы это не считалось «неопубликованным изменением»
// и заказчик сразу видел актуальное имя, без вспышки старого. Ничего не пишем,
// если имя уже совпадает.
export function syncCustomerName(id, name) {
  const nm = String(name || "").trim();
  if (!nm) return null;
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return null;
    if (o.customerName === nm && (!o.published || o.published.customerName === nm)) return null;
    o.customerName = nm;
    if (o.published && o.published.customerName !== undefined) o.published.customerName = nm;
    return JSON.parse(JSON.stringify(o));
  });
}
// Соисполнители: массив { id, fio, role, email, notify }. Приводим к строгой форме,
// notify по умолчанию true (получает уведомления по объекту).
export function normCoExecutors(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.map((c) => ({
    id: String(c?.id || "").trim(),
    fio: String(c?.fio || "").trim(),
    role: String(c?.role || "").trim(),
    email: String(c?.email || "").trim().toLowerCase(),
    notify: c?.notify !== false,
  })).filter((c) => c.fio && !seen.has(c.id || c.fio) && seen.add(c.id || c.fio));
}
/* ===================== Черновик / публикация ===================== */
// Заказчик видит НЕ «вживую», а последний опубликованный снимок этих полей.
// Всё остальное (доступы customerUsers/owner*, переписка messages, внутренние
// заметки, служебное) — всегда вживую: черновик их не касается, иначе сломается
// чат (заказчик не увидит только что отправленное сообщение) и выдача доступа.
const DRAFT_FIELDS = [
  "title", "status", "progress", "currentStageId", "plannedFinishDate",
  "customerName", "inn", "kpp", "city", "address", "contractNumber",
  "responsibleName", "responsibleRole", "responsibleEmail", "responsibleNotify", "coExecutors",
  "now", "stages", "documents", "customerRequiredActions", "events",
];
function pickDraft(o) {
  const out = {};
  for (const k of DRAFT_FIELDS) if (o[k] !== undefined) out[k] = o[k];
  return JSON.parse(JSON.stringify(out));
}
// Опубликовать: зафиксировать текущее состояние как видимое заказчику.
export function publishObject(id) {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return null;
    o.published = pickDraft(o);
    o.publishedAt = Date.now(); // момент публикации — от него считаем «новое» у заказчика
    o.lastUpdatedAt = today();
    return JSON.parse(JSON.stringify(o));
  });
}
// Сбросить черновик: вернуть редактируемые поля к последней публикации.
export function discardDraft(id) {
  return withStore((store) => {
    const o = findObj(store, id); if (!o || !o.published) return null;
    Object.assign(o, JSON.parse(JSON.stringify(o.published)));
    o.lastUpdatedAt = today();
    return JSON.parse(JSON.stringify(o));
  });
}
// Есть ли неопубликованные изменения (для баннера в редакторе).
export function hasUnpublished(id) {
  const o = findObj(loadStore(), id); if (!o || !o.published) return false;
  return JSON.stringify(pickDraft(o)) !== JSON.stringify(o.published);
}
// Легаси-объекты без снимка: при первом открытии редактора фиксируем базу =
// текущее состояние (то, что заказчик и так видит), дальше правки идут в черновик.
export function ensurePublishedBaseline(id) {
  return withStore((store) => {
    const o = findObj(store, id); if (!o || o.published) return;
    o.published = pickDraft(o);
    o.publishedAt = parseTs(o.lastUpdatedAt) || Date.now();
  });
}

export function createObject({ title = "Новый объект", templateCode = "free", customerName = "", customerEmail = "", customerId = "", city = "", responsibleName = "", responsibleRole = "", responsibleEmail = "", responsibleNotify = true, coExecutors = [], stages: stageNames = null, author = "Администратор" } = {}) {
  return withStore((store) => {
    // Учитываем правки админа (getTemplates), с откатом на базовый список.
    const tpl = templateByCode(templateCode) || OBJECT_TEMPLATES.find((t) => t.code === templateCode) || OBJECT_TEMPLATES[OBJECT_TEMPLATES.length - 1];
    // Технический ID с префиксом по типу работ: ELM-…, OVK-…, PRO-… (не полностью случайный).
    const id = uid(tpl.prefix || "OBJ").toUpperCase();
    // Этап шаблона может быть строкой ("Название") или объектом {title, description}.
    const src = Array.isArray(stageNames) ? stageNames : (tpl.stages || []);
    const norm = src
      .map((s) => (typeof s === "string" ? { title: s.trim(), description: "", status: "" } : { title: String(s?.title || "").trim(), description: String(s?.description || "").trim(), status: String(s?.status || "").trim() }))
      .filter((s) => s.title);
    // Статус берём из редактора, если задан; иначе по умолчанию первый этап — «в работе».
    const stages = norm.map((s, i) => ({ id: uid("s"), title: s.title, description: s.description, status: s.status || (i === 0 ? "in_progress" : "not_started"), progress: 0, plannedStartDate: "", plannedFinishDate: "", actualFinishDate: "", publicComment: "", internalComment: "", visibleToCustomer: true, order: i }));
    const email = String(customerEmail || "").trim().toLowerCase();
    const ownerUserId = String(customerId || "").trim();
    // Выбранная учётка-заказчик получает доступ: пишем ownerEmail + ownerUserId (id учётки,
    // чтобы заказчик БЕЗ почты — вход по логину — тоже видел объект) + запись в customerUsers.
    const customerUsers = (email || ownerUserId)
      ? [{ id: uid("cu"), accountId: ownerUserId, email, name: customerName || email || ownerUserId, addedAt: today() }]
      : [];
    const obj = {
      id, title, customerName, customerEmail: email, inn: "", kpp: "", city, address: "", contractNumber: "",
      status: "draft", progress: 0, currentStageId: stages[0]?.id || "",
      responsibleName, responsibleRole, responsiblePhone: "", responsibleEmail: String(responsibleEmail || "").trim().toLowerCase(),
      responsibleNotify: responsibleNotify !== false, coExecutors: normCoExecutors(coExecutors),
      plannedFinishDate: "", lastUpdatedAt: today(), internalNote: "",
      now: { doingNow: "", nextStep: "", nextDeadline: "", customerNeeds: "", attention: "on_track" },
      ownerEmail: email, ownerUserId, stages, documents: [], customerRequiredActions: [], customerUsers,
      events: [],
      templateCode,
    };
    pushEvent(obj, { type: "object_created", title: "Объект создан", description: `${id} — ${title}${tpl.code !== "free" ? ` (шаблон: ${tpl.label})` : ""}.`, author, visibility: "internal" });
    obj.published = pickDraft(obj); // стартовая база публикации = исходное состояние
    obj.publishedAt = Date.now();
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
      // Отметка времени смены статуса этапа — по ней заказчику подсвечиваем
      // морковную точку «обновилось» у конкретного этапа (гаснет при просмотре).
      patch.statusTs = Date.now();
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
    // Если документ создаётся сразу опубликованным (загрузка файла админом идёт
    // со status:"published") — событие ПУБЛИЧНОЕ, чтобы заказчик увидел его в
    // «Истории изменений» и сработал сигнал «новое». Черновик — внутреннее.
    const published = d.status === "published" && d.visibleToCustomer;
    if (published) {
      pushEvent(o, { type: "doc_published", title: "Добавлен документ", description: d.title, author, visibility: "public" });
      d.isNewForCustomer = true; d.publishedTs = Date.now();
    } else {
      pushEvent(o, { type: "doc_added", title: "Добавлен документ", description: d.title, author, visibility: "internal" });
    }
    touch(o); return d.id;
  });
}
export function updateDocument(id, docId, patch, author = "Администратор") {
  return withStore((store) => {
    const o = findObj(store, id); if (!o) return;
    const d = o.documents.find((x) => x.id === docId); if (!d) return;
    if (patch.status && patch.status !== d.status) {
      if (patch.status === "published") { pushEvent(o, { type: "doc_published", title: "Опубликован документ", description: d.title, author, visibility: "public" }); d.isNewForCustomer = true; d.publishedTs = Date.now(); }
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
    if (d.status === "published") d.publishedTs = Date.now();
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
function pushEvent(o, ev) { o.events = o.events || []; o.events.unshift({ id: uid("e"), ts: Date.now(), createdAt: nowStampLocal(), visibility: "internal", author: "Администратор", ...ev }); }
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
// draft=true — показать «вживую» (для предпросмотра админом своего черновика);
// иначе заказчику отдаём последний опубликованный снимок (o.published) поверх
// живых полей доступа/переписки. Легаси без снимка — как раньше, вживую.
export function getCustomerView(id, { draft = false } = {}) {
  const o = getObject(id); if (!o) return null;
  // lastUpdatedAt для заказчика = момент публикации (o.publishedAt), а не правки,
  // иначе сигнал «новое» зажигался бы у заказчика ещё на черновике.
  const base = (!draft && o.published) ? { ...o, ...o.published, lastUpdatedAt: o.publishedAt || o.lastUpdatedAt } : o;
  return {
    ...base,
    published: undefined,
    internalNote: undefined,
    stages: (base.stages || []).filter((s) => s.visibleToCustomer).map((s) => ({ ...s, internalComment: undefined })),
    documents: (base.documents || []).filter((d) => d.visibleToCustomer && d.status === "published").map((d) => ({ ...d, internalComment: undefined, versions: [] })),
    customerRequiredActions: (base.customerRequiredActions || []).filter((a) => a.visibleToCustomer),
    events: (base.events || []).filter((e) => e.visibility === "public"),
  };
}
export function listObjectsForCustomer(email, accountId = "") {
  const e = String(email || "").toLowerCase();
  const id = String(accountId || "");
  return listObjects().filter((o) => {
    const byEmail = e && (String(o.ownerEmail || "").toLowerCase() === e || (o.customerUsers || []).some((u) => String(u.email || "").toLowerCase() === e));
    const byId = id && (String(o.ownerUserId || "") === id || (o.customerUsers || []).some((u) => String(u.accountId || "") === id));
    return byEmail || byId;
  }).map((o) => (o.published ? { ...o, ...o.published, lastUpdatedAt: o.publishedAt || o.lastUpdatedAt, published: undefined } : o)); // список — опубликованные поля
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
