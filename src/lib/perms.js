// src/lib/perms.js
// Фронтовое зеркало серверной модели прав (server/functions/*/perms.js).
// Каталог + роли-пресеты + effectivePerms/can — синхронизировать с бэкендом 1:1.
//
// На фронте права нужны ТОЛЬКО для UX: рисуем чек-лист из каталога и прячем кнопки,
// которые сервер всё равно запретит. Настоящая защита — на бэкенде (can() в функциях).

/* 1) КАТАЛОГ ПРАВ: namespace → [[право, подпись], …]. Из него рисуется чек-лист. */
export const PERMISSIONS = {
  objects: [
    ["objects.view", "Видеть объекты"],
    ["objects.create", "Создавать объекты"],
    ["objects.edit", "Редактировать объекты"],
    ["objects.publish", "Публиковать изменения"],
    ["objects.delete", "Удалять объекты"],
  ],
  docs: [
    ["docs.upload", "Загружать документы"],
    ["docs.delete", "Удалять документы"],
  ],
  messages: [
    ["messages.reply", "Отвечать заказчику"],
  ],
  templates: [
    ["templates.view", "Видеть шаблоны объектов"],
    ["templates.manage", "Редактировать шаблоны и типовые этапы"],
  ],
  files: [
    ["files.view", "Видеть файлы по всем объектам"],
    ["files.download", "Скачивать файлы и архивы"],
  ],
  projects: [
    ["projects.add", "Добавлять проекты в витрину"],
    ["projects.manage", "Редактировать и удалять проекты"],
  ],
  staff: [
    ["staff.view", "Видеть сотрудников"],
    ["staff.manage", "Управлять сотрудниками и правами"],
  ],
  accounts: [
    ["accounts.view", "Видеть учётные записи"],
    ["accounts.manage", "Управлять учётными записями"],
  ],
  partners: [
    ["partners.view", "Раздел «Партнёры»"],
    ["partners.manage", "Управлять партнёрами"],
  ],
  suppliers: [
    ["suppliers.view", "Раздел «Поставщики»"],
    ["suppliers.manage", "Управлять поставщиками"],
  ],
};

// Человеческие подписи разделов каталога (для заголовков групп чек-листа).
export const PERM_GROUP_LABELS = {
  objects: "Объекты",
  docs: "Документы",
  messages: "Переписка",
  templates: "Шаблоны",
  files: "Файлы",
  projects: "Проекты (витрина)",
  staff: "Сотрудники",
  accounts: "Учётные записи",
  partners: "Партнёры",
  suppliers: "Поставщики",
};

export const ALL_PERMS = Object.values(PERMISSIONS).reduce((a, g) => a.concat(g.map(([p]) => p)), []);
const PERM_LABEL = Object.values(PERMISSIONS).reduce((m, g) => { g.forEach(([p, l]) => (m[p] = l)); return m; }, {});
export const permLabel = (p) => PERM_LABEL[p] || p;

/* 2) РОЛИ-ПРЕСЕТЫ. Токены: '*' = всё; 'ns.*' = весь раздел; иначе конкретное право. */
export const ROLE_PERMS = {
  admin: ["*"],
  manager: ["objects.*", "docs.*", "messages.reply", "templates.view", "files.view", "files.download", "accounts.view", "staff.view", "projects.*", "partners.*", "suppliers.*"],
  executor: ["objects.view", "objects.edit", "objects.publish", "docs.upload", "messages.reply", "partners.view", "suppliers.view"],
  viewer: ["objects.view", "partners.view", "suppliers.view"],
  customer: [],
};

// Роли-«сотрудники» (полу-админы). Заказчик (customer) сюда НЕ входит.
export const STAFF_ROLES = ["admin", "manager", "executor", "viewer"];
export const isStaffRole = (role) => STAFF_ROLES.indexOf(String(role || "")) !== -1;

// Человеческие подписи ролей (для селекта в карточке сотрудника).
export const ROLE_LABELS = {
  admin: "Администратор",
  manager: "Менеджер",
  executor: "Исполнитель",
  viewer: "Наблюдатель",
  customer: "Заказчик",
};

function tokenGrants(g, perm) {
  if (g === "*") return true;
  if (g === perm) return true;
  if (g.length > 2 && g.slice(-2) === ".*") return perm.indexOf(g.slice(0, -1)) === 0;
  return false;
}

export function normalizeOverrides(ov) {
  let o = ov;
  if (typeof o === "string") { try { o = JSON.parse(o); } catch { o = null; } }
  o = o && typeof o === "object" ? o : {};
  const clean = (arr) => (Array.isArray(arr) ? arr : []).map(String).filter((p) => ALL_PERMS.indexOf(p) !== -1);
  return { grant: clean(o.grant), revoke: clean(o.revoke) };
}

// Разворачиваем роль в Set конкретных прав, затем применяем оверрайды.
export function effectivePerms(role, overrides) {
  const base = ROLE_PERMS[String(role || "")] || [];
  const set = new Set();
  for (const p of ALL_PERMS) {
    for (const g of base) { if (tokenGrants(g, p)) { set.add(p); break; } }
  }
  const ov = normalizeOverrides(overrides);
  for (const p of ov.revoke) set.delete(p);
  for (const p of ov.grant) set.add(p);
  return set;
}

// Разница между эффективными правами и чистым пресетом роли → оверрайды {grant,revoke}.
// Нужно карточке сотрудника: галочки минус роль = что докрутили руками.
export function diffOverrides(role, permSet) {
  const roleSet = effectivePerms(role, null);
  const grant = [], revoke = [];
  for (const p of ALL_PERMS) {
    const has = permSet instanceof Set ? permSet.has(p) : (Array.isArray(permSet) ? permSet.indexOf(p) !== -1 : false);
    if (has && !roleSet.has(p)) grant.push(p);
    if (!has && roleSet.has(p)) revoke.push(p);
  }
  return { grant, revoke };
}

/* 3) Рантайм-права текущего пользователя. Кладём из /auth/me один раз, читаем откуда угодно.
   can(perm) — синхронная проверка для UX. Пустой набор до загрузки — кнопки просто скрыты. */
let _mySet = new Set();
let _myRole = "customer";

export function setMyAuth({ role, perms, permOverrides } = {}) {
  _myRole = String(role || "customer");
  if (Array.isArray(perms)) _mySet = new Set(perms.filter((p) => ALL_PERMS.indexOf(p) !== -1));
  else _mySet = effectivePerms(_myRole, permOverrides);
}
export function myRole() { return _myRole; }
export function myPerms() { return _mySet; }
export function can(perm) { return _mySet.has(perm); }
export function canAny(...list) { return list.some((p) => _mySet.has(p)); }
export function isStaff() { return isStaffRole(_myRole); }
