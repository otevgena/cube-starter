// src/data/documents.js
// Данные раздела «Документы» (счета + справочники организаций и контрагентов).
// Бэкенд — cube-documents (YDB), маршруты /documents, /orgs, /counterparties.
// Паттерн 1:1 с objects.js: публичные функции СИНХРОННЫ (мутируют кэш сразу),
// запись на бэкенд идёт фоном (write-through) с FIFO-очередью по id; UI слушает
// событие "<resource>:changed". Тумблер "<resource>:api=0" → офлайн на localStorage.
import { api, auth } from "@/lib/auth.js";
import { lookupOrgByInn } from "@/data/objects.js";

export { lookupOrgByInn };

/* ============================ фабрика store ============================ */
function makeStore(resource, { seed = [] } = {}) {
  const evt = `${resource}:changed`;
  const LS_KEY = `cube:${resource}:store:v1`;
  const API_TOGGLE = `${resource}:api`;

  function apiEnabled() {
    try { if (localStorage.getItem(API_TOGGLE) === "0") return false; } catch {}
    return true;
  }

  const _mem = { items: [] };
  let _hydrated = false, _hydrating = null;
  function emit() { try { window.dispatchEvent(new CustomEvent(evt)); } catch {} }

  function isLoading() { return apiEnabled() ? !_hydrated : false; }

  async function hydrate({ force = false } = {}) {
    if (!apiEnabled()) return;
    if (_hydrating) return _hydrating;
    if (_hydrated && !force) return;
    _hydrating = (async () => {
      const ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch {} }, 12000) : null;
      try {
        const data = await api(`/${resource}`, { method: "GET", signal: ctrl ? ctrl.signal : undefined });
        _mem.items = Array.isArray(data && data.items) ? data.items : [];
        emit();
      } catch (e) { /* не залогинен / офлайн — оставляем кэш */ }
      finally { if (timer) clearTimeout(timer); _hydrated = true; _hydrating = null; }
    })();
    return _hydrating;
  }

  /* --- localStorage fallback --- */
  function lsGet() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
  function lsSet(v) { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {} }
  function loadStoreLS() {
    const s = lsGet();
    if (s && Array.isArray(s.items)) return s;
    const init = { items: JSON.parse(JSON.stringify(seed)) };
    lsSet(init); return init;
  }

  function loadStore() {
    if (!apiEnabled()) return loadStoreLS();
    if (!_hydrated && !_hydrating) hydrate();
    return _mem;
  }
  function reportErr(e) { try { console.warn(`[${resource}] sync error:`, (e && e.message) || e); } catch {} }

  /* --- очередь записи по id (FIFO) --- */
  const _chains = new Map();
  function enqueue(id, fn) {
    const prev = _chains.get(id) || Promise.resolve();
    const next = prev.then(fn, fn).catch(reportErr);
    _chains.set(id, next);
    next.finally(() => { if (_chains.get(id) === next) _chains.delete(id); });
    return next;
  }
  function pushCreate(o) { enqueue(o.id, () => api(`/${resource}`, { method: "POST", body: o })); }
  function pushPut(o) { enqueue(o.id, () => api(`/${resource}/${encodeURIComponent(o.id)}`, { method: "PUT", body: o })); }
  function pushDelete(id) { enqueue(id, () => api(`/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" })); }

  function withStore(mut) {
    const store = loadStore();
    if (!apiEnabled()) { const r = mut(store); lsSet(store); return r; }
    const beforeIds = new Set(store.items.map((o) => o.id));
    const beforeHash = new Map(store.items.map((o) => [o.id, JSON.stringify(o)]));
    const r = mut(store);
    const afterIds = new Set(store.items.map((o) => o.id));
    let changed = false;
    for (const o of store.items) {
      if (!beforeIds.has(o.id)) { pushCreate(o); changed = true; }
      else if (beforeHash.get(o.id) !== JSON.stringify(o)) { pushPut(o); changed = true; }
    }
    for (const id of beforeIds) if (!afterIds.has(id)) { pushDelete(id); changed = true; }
    if (changed) emit();
    return r;
  }

  /* --- публичный API (синхронный) --- */
  function list() { return loadStore().items.slice(); }
  function get(id) { const o = loadStore().items.find((x) => x.id === id); return o ? JSON.parse(JSON.stringify(o)) : null; }
  function add(data) { return withStore((s) => { const o = { id: uid(resource), ...data }; s.items.unshift(o); return JSON.parse(JSON.stringify(o)); }); }
  function upsert(o) {
    return withStore((s) => {
      const i = s.items.findIndex((x) => x.id === o.id);
      if (i >= 0) s.items[i] = { ...o }; else s.items.unshift({ ...o });
      return JSON.parse(JSON.stringify(o));
    });
  }
  function update(id, patch) { return withStore((s) => { const o = s.items.find((x) => x.id === id); if (!o) return null; Object.assign(o, patch); return JSON.parse(JSON.stringify(o)); }); }
  function remove(id) { return withStore((s) => { const i = s.items.findIndex((x) => x.id === id); if (i >= 0) s.items.splice(i, 1); }); }

  /* --- сброс кэша при входе/выходе --- */
  try {
    let _last = auth.get();
    auth.subscribe((t) => { if (t === _last) return; _last = t; _mem.items = []; _hydrated = false; _hydrating = null; _chains.clear(); emit(); });
  } catch {}

  return { evt, list, get, add, upsert, update, remove, hydrate, isLoading, usesApi: apiEnabled };
}

let _seq = 0;
function uid(p = "id") { _seq += 1; return `${p}-${Date.now().toString(36)}-${_seq}`; }

/* ============================ сущности ============================ */
// Пред-заполнение первой организации (реквизиты из образца счёта заказчика).
// Подпись и печать НЕ храним в коде (публичный бандл) — грузятся в карточку.
export const KUB_ORG_SEED = {
  name: 'ООО "КУБ"',
  fullName: 'Общество с ограниченной ответственностью «КУБ»',
  address: "629805, Ямало-Ненецкий автономный округ, г. Ноябрьск, тер. Промузел Пелей, панель VIII, д. 2, офис 316",
  inn: "8905070217",
  kpp: "890501001",
  ogrn: "1258900002448",
  director: "Попов Евгений Александрович",
  accountant: "Попов Евгений Александрович",
  banks: [
    { id: "bank-kub-tbank", label: 'АО «ТБанк»', account: "40702810810001959650", bik: "044525974", bankName: 'АО "ТБанк", г. Москва', corrAccount: "30101810145250000974" },
  ],
  signatureDataUri: "",
  stampDataUri: "",
  logoDataUri: "",
  showStamp: true,
  showSignature: true,
};

const _docs = makeStore("documents");
const _orgs = makeStore("orgs");
const _cps  = makeStore("counterparties");

/* ---- Счета/документы ---- */
export const invoicesEvent = _docs.evt;
export function listDocuments() { return _docs.list(); }
export function getDocument(id) { return _docs.get(id); }
export function addDocument(data) { return _docs.add(data); }
export function saveDocument(o) { return _docs.upsert(o); }
export function updateDocument(id, patch) { return _docs.update(id, patch); }
export function deleteDocument(id) { return _docs.remove(id); }
export function hydrateDocuments(opts) { return _docs.hydrate(opts); }
export function isDocumentsLoading() { return _docs.isLoading(); }

/* ---- Организации (продавцы) ---- */
export const orgsEvent = _orgs.evt;
export function listOrgs() { return _orgs.list(); }
export function getOrg(id) { return _orgs.get(id); }
export function addOrg(data) { return _orgs.add(data); }
export function saveOrg(o) { return _orgs.upsert(o); }
export function updateOrg(id, patch) { return _orgs.update(id, patch); }
export function deleteOrg(id) { return _orgs.remove(id); }
export function hydrateOrgs(opts) { return _orgs.hydrate(opts); }
export function isOrgsLoading() { return _orgs.isLoading(); }

/* ---- Контрагенты (покупатели) ---- */
export const counterpartiesEvent = _cps.evt;
export function listCounterparties() { return _cps.list(); }
export function getCounterparty(id) { return _cps.get(id); }
export function addCounterparty(data) { return _cps.add(data); }
export function saveCounterparty(o) { return _cps.upsert(o); }
export function updateCounterparty(id, patch) { return _cps.update(id, patch); }
export function deleteCounterparty(id) { return _cps.remove(id); }
export function hydrateCounterparties(opts) { return _cps.hydrate(opts); }
export function isCounterpartiesLoading() { return _cps.isLoading(); }

/* ============================ DaData: банк по БИК ============================ */
// Подтянуть банк по БИК через тот же прокси (POST /profile/dadata, kind:'bank').
// Возвращает { bankName, corrAccount, swift } или null.
export async function lookupBankByBik(bik) {
  const q = String(bik || "").replace(/\D/g, "");
  if (q.length !== 9) return null;
  try {
    const data = await api("/profile/dadata", { method: "POST", body: { mode: "find", kind: "bank", query: q } });
    const s = data && data.suggestions && data.suggestions[0];
    if (!s) return null;
    const d = s.data || {};
    return {
      bankName: s.value || d.name?.payment || "",
      corrAccount: d.correspondent_account || "",
      swift: d.swift || "",
    };
  } catch { return null; }
}
// Подсказки контрагентов по названию/ИНН (для поля «Название ООО или ФИО»).
export async function suggestParty(query) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  try {
    const data = await api("/profile/dadata", { method: "POST", body: { mode: "suggest", kind: "party", query: q, count: 7 } });
    const arr = (data && data.suggestions) || [];
    return arr.map((s) => ({
      name: s.value || "",
      inn: (s.data && s.data.inn) || "",
      kpp: (s.data && s.data.kpp) || "",
      address: (s.data && s.data.address && s.data.address.value) || "",
    }));
  } catch { return []; }
}

/* ============================ ИИ-помощник (YandexGPT через бэкенд-прокси) ============================ */
// messages: [{role:'user'|'ai', text}], invoice: текущий черновик (или null).
// Возвращает { reply: string, invoice: {buyerName,buyerInn,basis,vatMode,vatRate,items[]} | null }.
export async function askAssistant(messages, invoice, image) {
  const body = { messages: messages || [], invoice: invoice || null };
  if (image && image.data) body.image = { mime: image.mime || "image/jpeg", data: image.data };
  const data = await api("/assistant", { method: "POST", body });
  return { reply: (data && data.reply) || "", invoice: (data && data.invoice) || null, payment: (data && data.payment) || null, action: (data && data.action) || null };
}

/* ============================ деньги, НДС, номера ============================ */
export const VAT_MODES = [
  { code: "included", label: "с НДС в том числе" },
  { code: "ontop",    label: "НДС сверху" },
  { code: "none",     label: "Без НДС" },
];
export const DEFAULT_VAT_RATE = 22; // ставка 2026 г. (образец заказчика — 22%)

// "41 198,50" | 41198.5 → число
export function parseNum(v) {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v || "").replace(/\s| /g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
// 41198.5 → "41 198,50"
export function fmtMoney(n) {
  const x = Math.round((Number(n) || 0) * 100) / 100;
  const [int, frac = ""] = Math.abs(x).toFixed(2).split(".");
  const grp = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${x < 0 ? "-" : ""}${grp},${frac}`;
}
export function itemSum(it) { return Math.round(parseNum(it.qty) * parseNum(it.price) * 100) / 100; }

// Итоги по позициям с учётом режима НДС.
export function computeTotals(items, vatMode = "included", vatRate = DEFAULT_VAT_RATE) {
  const subtotal = (items || []).reduce((a, it) => a + (it.sum != null ? parseNum(it.sum) : itemSum(it)), 0);
  const rate = Number(vatRate) || 0;
  let vat = 0, total = subtotal;
  if (vatMode === "included") { vat = subtotal - subtotal * 100 / (100 + rate); total = subtotal; }
  else if (vatMode === "ontop") { vat = subtotal * rate / 100; total = subtotal + vat; }
  else { vat = 0; total = subtotal; }
  const r2 = (x) => Math.round(x * 100) / 100;
  return { subtotal: r2(subtotal), vat: r2(vat), total: r2(total) };
}

// Следующий номер счёта: максимум числовых номеров + 1.
export function nextInvoiceNumber(docs) {
  const nums = (docs || []).map((d) => parseInt(String(d.number || "").replace(/\D/g, ""), 10)).filter((n) => isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1);
}

/* ---- Сумма прописью (рубли + копейки) ---- */
const _ONES = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять",
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать",
  "семнадцать", "восемнадцать", "девятнадцать"];
const _ONES_F = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const _TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const _HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
function _triad(n, female) {
  const out = [];
  out.push(_HUNDREDS[Math.floor(n / 100)]);
  const rem = n % 100;
  if (rem < 20) out.push((female ? _ONES_F : _ONES)[rem] || (rem >= 10 ? _ONES[rem] : ""));
  else { out.push(_TENS[Math.floor(rem / 10)]); out.push((female ? _ONES_F : _ONES)[rem % 10]); }
  return out.filter(Boolean).join(" ");
}
function _plural(n, forms) { // forms: [1, 2, 5]
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}
// 41198.5 → "Сорок одна тысяча сто девяносто восемь рублей 50 копеек"
export function rublesInWords(amount) {
  const total = Math.round((Number(amount) || 0) * 100);
  let rub = Math.floor(total / 100);
  const kop = total % 100;
  if (rub === 0) return `Ноль рублей ${String(kop).padStart(2, "0")} копеек`;
  const parts = [];
  const scales = [
    { d: 1e9, female: false, forms: ["миллиард", "миллиарда", "миллиардов"] },
    { d: 1e6, female: false, forms: ["миллион", "миллиона", "миллионов"] },
    { d: 1e3, female: true,  forms: ["тысяча", "тысячи", "тысяч"] },
  ];
  for (const sc of scales) {
    const q = Math.floor(rub / sc.d); rub %= sc.d;
    if (q > 0) { parts.push(_triad(q, sc.female)); parts.push(_plural(q, sc.forms)); }
  }
  const units = rub; // остаток < 1000 — рубли (мужской род)
  if (units > 0 || parts.length === 0) parts.push(_triad(units, false));
  const rubWord = _plural(units, ["рубль", "рубля", "рублей"]);
  const str = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const cap = str.charAt(0).toUpperCase() + str.slice(1);
  return `${cap} ${rubWord} ${String(kop).padStart(2, "0")} ${_plural(kop, ["копейка", "копейки", "копеек"])}`;
}
