// src/data/projects.js
// Витринные проекты (тёмные карточки на главной «ПРОЕКТЫ» + страница «Смотреть работы»).
// Два режима хранения (см. «Стор»):
//   • API  — источник истины бэкенд (api.cube-tech.ru, функция cube-projects):
//            GET /projects ПУБЛИЧНЫЙ (витрину видят гости сайта), мутации — под
//            правом projects.add / projects.manage. Картинки — в публичном S3-бакете
//            cube-showcase (presigned upload), в БД только их URL.
//   • localStorage — офлайн-моки с сидом DEFAULT_PROJECTS (переключатель ниже).
//
// Публичные функции СИНХРОННЫЕ (потребители не переписывались): getProjects()/
// getFeaturedProjects() возвращают кэш, мутации меняют кэш сразу и пишут на бэкенд
// фоном (write-through). Компоненты подписаны на событие "projects:changed".
// Переключатель: localStorage['projects:api'] = '0' → вернуться к localStorage.
import { api } from "@/lib/auth.js";

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

/* ===================== Режим ===================== */
// По умолчанию API включён. Выключить (localStorage-моки): localStorage['projects:api']='0'.
function apiEnabled() {
  try { if (localStorage.getItem("projects:api") === "0") return false; } catch {}
  return true;
}
export function usesApi() { return apiEnabled(); }

/* ===================== localStorage-режим ===================== */
function lsGet(fallback) {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function lsSet(val) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(val)); } catch (e) { throw e; }
}
function lsList() {
  let raw = lsGet(null);
  if (!Array.isArray(raw)) { raw = DEFAULT_PROJECTS.map(norm); lsSet(raw); return raw; }
  return raw.map(norm);
}

/* ===================== API-режим: кэш + гидрация + write-through ===================== */
// Первичный кэш — сид-дефолты, чтобы витрина не мигала пустой до ответа сервера.
let _mem = DEFAULT_PROJECTS.map(norm);
let _hydrated = false;
let _hydrating = null;

function reportSyncErr(e) { try { console.warn("[projects] sync error:", (e && e.message) || e); } catch {} }

// Подтянуть витрину с бэкенда (публичный GET, без авторизации). Фоном; при успехе
// шлёт "projects:changed" — на него подписаны главная, страница работ и админка.
export async function hydrateProjects({ force = false } = {}) {
  if (!apiEnabled()) return;
  if (_hydrating) return _hydrating;
  if (_hydrated && !force) return;
  _hydrating = (async () => {
    try {
      const data = await api("/projects", { method: "GET", authRequired: false });
      const list = Array.isArray(data && data.projects) ? data.projects.map(norm) : [];
      _mem = list;
      fire();
    } catch (e) {
      reportSyncErr(e); // офлайн/ошибка — оставляем текущий кэш (сид-дефолты)
    } finally {
      _hydrated = true;
      _hydrating = null;
    }
  })();
  return _hydrating;
}

/* ===================== Публичный API ===================== */
// Полный список (порядок с сервера: слева/справа на главной = [0]/[1]).
export function getProjects() {
  if (!apiEnabled()) return lsList();
  if (!_hydrated && !_hydrating) hydrateProjects();
  return _mem.slice();
}

// Два самых свежих — для главной (слева = [0], справа = [1]).
export function getFeaturedProjects() { return getProjects().slice(0, 2); }

export function addProject(data) {
  const item = norm({ ...data, id: uid(), seed: false });
  if (!apiEnabled()) { lsSet([item, ...lsList()]); fire(); return item; }
  _mem = [item, ...(_hydrated ? _mem : [])]; // оптимистично — в начало
  fire();
  api("/projects", { method: "POST", body: item })
    .then((res) => {
      const srv = res && res.project;
      if (srv) { _mem = _mem.map((p) => (p.id === item.id ? norm(srv) : p)); fire(); }
    })
    .catch(reportSyncErr);
  return item;
}

export function updateProject(id, patch) {
  if (!apiEnabled()) {
    lsSet(lsList().map((p) => (p.id === id ? norm({ ...p, ...patch }) : p))); fire(); return;
  }
  let next = null;
  _mem = _mem.map((p) => (p.id === id ? (next = norm({ ...p, ...patch })) : p));
  fire();
  if (next) api(`/projects/${encodeURIComponent(id)}`, { method: "PUT", body: next }).catch(reportSyncErr);
}

export function removeProject(id) {
  if (!apiEnabled()) { lsSet(lsList().filter((p) => p.id !== id)); fire(); return; }
  _mem = _mem.filter((p) => p.id !== id);
  fire();
  api(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(reportSyncErr);
}

// Перестановка (порядок на главной: кто слева/справа).
export function moveProject(from, to) {
  if (!apiEnabled()) {
    const list = lsList();
    if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return;
    const [m] = list.splice(from, 1); list.splice(to, 0, m);
    lsSet(list); fire(); return;
  }
  if (from < 0 || from >= _mem.length || to < 0 || to >= _mem.length || from === to) return;
  const list = _mem.slice();
  const [m] = list.splice(from, 1); list.splice(to, 0, m);
  _mem = list;
  fire();
  api("/projects/reorder", { method: "POST", body: { ids: _mem.map((p) => p.id) } }).catch(reportSyncErr);
}

// Вернуть к заводскому набору (только сид-проекты). В API-режиме — не трогаем сервер,
// просто перечитываем витрину (сброс задуман для локального localStorage-режима).
export function resetProjects() {
  if (!apiEnabled()) { lsSet(DEFAULT_PROJECTS.map(norm)); fire(); return; }
  hydrateProjects({ force: true });
}

/* ===================== Загрузка картинки в S3 ===================== */
// Ужимаем картинку клиентом до разумного размера → Blob, грузим в публичный бакет
// cube-showcase по presigned PUT, возвращаем публичный URL. В localStorage-режиме
// (или без сети) — возвращаем data:URL (base64), чтобы локальная разработка работала.
function fileToScaledBlob(file, { maxW = 1400, maxH = 1400, quality = 0.82, mime = "image/jpeg" } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) { reject(new Error("Это не изображение")); return; }
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Не удалось прочитать файл"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Не удалось открыть изображение"));
      img.onload = () => {
        let { width: w, height: h } = img;
        const r = Math.min(1, maxW / w, maxH / h);
        w = Math.round(w * r); h = Math.round(h * r);
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d");
        if (mime === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = cv.toDataURL(mime, quality);
        if (cv.toBlob) cv.toBlob((b) => (b ? resolve({ blob: b, dataUrl }) : reject(new Error("Ошибка изображения"))), mime, quality);
        else { // старые браузеры без toBlob — из dataURL
          try {
            const bin = atob(dataUrl.split(",")[1]); const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            resolve({ blob: new Blob([u8], { type: mime }), dataUrl });
          } catch (e) { reject(e); }
        }
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

// Публичный хелпер для загрузчиков в админке. opts — размеры (лого меньше фото).
export async function uploadProjectImage(file, opts = {}) {
  const { blob, dataUrl } = await fileToScaledBlob(file, opts);
  if (!apiEnabled()) return dataUrl; // локальный режим — base64
  try {
    const filename = (file && file.name) || "image.jpg";
    const { uploadUrl, publicUrl } = await api("/projects/upload-url", {
      method: "POST",
      body: { filename, contentType: "image/jpeg" },
    });
    const put = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
    if (!put.ok) throw new Error(`S3 upload failed (${put.status})`);
    return publicUrl;
  } catch (e) {
    reportSyncErr(e);
    // фолбэк: не потеряем картинку — вернём base64 (сохранится в data проекта)
    return dataUrl;
  }
}
