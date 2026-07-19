// src/data/projects.js
// Витринные проекты (тёмные карточки на главной «ПРОЕКТЫ» + страница «Смотреть работы»).
// Пока — фронтовое хранилище в localStorage поверх сида DEFAULT_PROJECTS (как правки
// шаблонов). Добавленные админом проекты кладутся В НАЧАЛО (newest-first): на главной
// показываются два самых свежих — новый слева, предыдущий справа, третий уходит на
// страницу «Смотреть работы», где видны все.
//
// Изображения у сид-проектов — статические пути (/projects/...); у добавленных из
// админки — data:URL (base64, ужатые перед сохранением). Бэкенд-хранилище — позже.

const LS_KEY = "cube:showcase:projects";

export const DEFAULT_PROJECTS = [
  {
    id: "seed-nng",
    logo: "/projects/rmm/nng_logo.png",
    shots: ["/projects/rmm/2-1200.jpg", "/projects/rmm/3-1200.jpg"],
    location: "Ноябрьск",
    objectTitle: "Учебный центр",
    customer: "Газпром нефть",
    servicesLabel: "5 Услуг",
    days: 94,
    name: "Газпромнефть",
    client: "Учебный центр",
    year: "2025",
    services: "СКС, ОПС, ЭО",
    badge: "ННГ",
    seed: true,
  },
  {
    id: "seed-frank",
    logo: "/projects/Frank/frank_logo.png",
    shots: ["/projects/Frank/1-1200.jpg", "/projects/Frank/2-1200.jpg"],
    location: "Тюмень",
    objectTitle: "FRANK by БАСТА",
    customer: "frankmeat",
    servicesLabel: "3 услуги",
    days: 76,
    name: "frankmeat",
    client: "FRANK by БАСТА",
    year: "2025",
    services: "СКС, ОПС, ЭО",
    badge: "ФББ",
    seed: true,
  },
];

let _seq = 0;
function uid() { _seq += 1; return `prj-${Date.now().toString(36)}-${_seq}`; }

function lsGet(fallback) {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function lsSet(val) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(val)); } catch (e) {
    // localStorage переполнен (крупные картинки) — сообщим вызвавшему.
    throw e;
  }
}

function fire() { try { window.dispatchEvent(new CustomEvent("projects:changed")); } catch {} }

// Нормализация записи проекта (безопасные значения по умолчанию).
function norm(p = {}) {
  const shots = Array.isArray(p.shots) ? p.shots.filter(Boolean) : [];
  return {
    id: p.id || uid(),
    logo: p.logo || "",
    shots,
    location: String(p.location || "").trim(),
    objectTitle: String(p.objectTitle || p.client || "").trim(),
    customer: String(p.customer || p.name || "").trim(),
    servicesLabel: String(p.servicesLabel || "").trim(),
    days: Number.isFinite(+p.days) ? +p.days : 0,
    name: String(p.name || "").trim(),
    client: String(p.client || p.objectTitle || "").trim(),
    year: String(p.year || "").trim(),
    services: String(p.services || "").trim(),
    badge: String(p.badge || "").trim(),
    seed: !!p.seed,
  };
}

// Полный список (newest-first). Первый заход — сидим дефолтами.
export function getProjects() {
  let raw = lsGet(null);
  if (!Array.isArray(raw)) { raw = DEFAULT_PROJECTS.map(norm); lsSet(raw); return raw; }
  return raw.map(norm);
}

// Два самых свежих — для главной (слева = [0], справа = [1]).
export function getFeaturedProjects() { return getProjects().slice(0, 2); }

export function addProject(data) {
  const item = norm({ ...data, id: uid(), seed: false });
  lsSet([item, ...getProjects()]); // в начало → новый слева на главной
  fire();
  return item;
}

export function updateProject(id, patch) {
  const list = getProjects().map((p) => (p.id === id ? norm({ ...p, ...patch }) : p));
  lsSet(list); fire();
}

export function removeProject(id) {
  lsSet(getProjects().filter((p) => p.id !== id)); fire();
}

// Перестановка (для управления порядком на главной: кто слева/справа).
export function moveProject(from, to) {
  const list = getProjects();
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return;
  const [m] = list.splice(from, 1); list.splice(to, 0, m);
  lsSet(list); fire();
}

// Вернуть к заводскому набору (только сид-проекты).
export function resetProjects() { lsSet(DEFAULT_PROJECTS.map(norm)); fire(); }
