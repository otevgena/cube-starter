// src/components/layout/Header.jsx
// Чистая шапка (clean-rebuild). Логика авторизации сохранена, разметка на Tailwind
// с токенами — без !important и пиксельных сдвигов.
// «Услуги» раскрываются ВНУТРИ той же карточки (шапка не дублируется → ничего не
// сдвигается). Вокруг — тёмный фон, сверху зазор (awwwards-стиль).
import React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Menu, X, UserRound } from "lucide-react";
import { search } from "@/data/search-index";
import * as DB from "@/data/objects.js";
import { refreshOnce } from "@/lib/auth.js";

/* === API base === */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "https://api.cube-tech.ru";
const api = (p) => `${API_BASE}${p}`;

/* ---- helpers: cached user ---- */
const readCachedUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const s = sessionStorage.getItem("auth:lastUser");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};
const writeCachedUser = (u) => {
  if (typeof window === "undefined") return;
  try {
    if (u) sessionStorage.setItem("auth:lastUser", JSON.stringify(u));
    else sessionStorage.removeItem("auth:lastUser");
  } catch {}
};

// Бэкенд /auth/me пока не возвращает avatar — восстанавливаем его из
// localStorage, чтобы аватар в шапке не сбрасывался после refresh/bootstrap.
const withAvatar = (u) => {
  if (!u || u.avatar) return u;
  try {
    const a = localStorage.getItem("profile:avatar");
    return a ? { ...u, avatar: a } : u;
  } catch { return u; }
};

/* ---- refresh через общий single-flight (@/lib/auth.js) ----
   Никаких собственных fetch('/auth/refresh'): все вызовы должны идти через
   один refreshOnce, иначе Header/profile/admin ротируют одноразовый
   refresh-token наперегонки → 401 → logout → «сессия слетела». */
async function apiRefresh() {
  try { return await refreshOnce({ force: true }); }
  catch { return null; }
}

async function apiMe(token, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(api("/auth/me"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.user || null;
  } catch {
    clearTimeout(to);
    return null;
  }
}

/* ===== Категории услуг ===== */
const SERVICE_CATEGORIES = [
  {
    key: "electrical",
    label: "Электромонтаж",
    href: "/services/electrical",
    icon: "/electricity.png",
    items: [
      { label: "Подключение объектов к электросетям", tag: "ТУ", href: "/services/electrical/power-connection" },
      { label: "Увеличение мощности и модернизация сетей", tag: "кВт", href: "/services/electrical/power-upgrade" },
      { label: "Внутренние электромонтажные работы", tag: "0,4 кВ", href: "/services/electrical/indoor" },
      { label: "Наружные электросети и уличное освещение", tag: "10 кВ", href: "/services/electrical/outdoor-networks" },
      { label: "Монтаж электрощитов и ВРУ", tag: "ВРУ", href: "/services/electrical/switchgear-vru" },
      { label: "Системы заземления и молниезащиты", tag: "Rз", href: "/services/electrical/earthing-lightning" },
      { label: "Автоматизация и учёт электроэнергии", tag: "АСКУЭ", href: "/services/electrical/energy-metering-automation" },
      { label: "Резервное электроснабжение", tag: "ДГУ", href: "/services/electrical/backup-power" },
    ],
  },
  {
    key: "lowcurrent",
    label: "Слаботочные системы",
    href: "/services/lowcurrent",
    icon: "/lowcurrent.png",
    items: [
      { label: "СКС и структурированные кабельные сети", tag: "СКС", href: "/services/lowcurrent/sks" },
      { label: "Видеонаблюдение (CCTV)", tag: "CCTV", href: "/services/lowcurrent/cctv" },
      { label: "Охранно-пожарная сигнализация", tag: "ОПС", href: "/services/lowcurrent/ops" },
      { label: "Системы контроля и управления доступом", tag: "СКУД", href: "/services/lowcurrent/skud" },
      { label: "Домофония и интерком", tag: "IP", href: "/services/lowcurrent/intercom" },
      { label: "Серверные, кроссовые и шкафы", tag: "19\"", href: "/services/lowcurrent/server-cross" },
      { label: "ЛВС и активное сетевое оборудование", tag: "LAN", href: "/services/lowcurrent/lan-network" },
      { label: "Системы оповещения и звука", tag: "СОУЭ", href: "/services/lowcurrent/public-address" },
    ],
  },
  {
    key: "ventilation",
    label: "Климат-системы",
    href: "/services/ventilation",
    icon: "/climat.png",
    items: [
      { label: "Проектирование и монтаж вентиляции", tag: "ОВ", href: "/services/ventilation/ventilation-design-install" },
      { label: "Системы кондиционирования (VRF/VRV)", tag: "VRF", href: "/services/ventilation/conditioning-vrf-vrv" },
      { label: "Чиллер-фанкойл системы", tag: "FCU", href: "/services/ventilation/chiller-fancoil" },
      { label: "Системы отопления и теплоснабжения", tag: "ИТП", href: "/services/ventilation/heating-heat-supply" },
      { label: "Автоматика ОВиК", tag: "BMS", href: "/services/ventilation/hvac-automation" },
      { label: "Паспортизация и балансировка систем", tag: "ПНР", href: "/services/ventilation/passport-balancing" },
      { label: "Воздуховоды, шумоглушение, КИПиА", tag: "КИП", href: "/services/ventilation/ducts-silencers-kipia" },
      { label: "Сервис и регламентное обслуживание", tag: "ТО", href: "/services/ventilation/service-maintenance" },
    ],
  },
  {
    key: "design",
    label: "Проектирование",
    href: "/services/design",
    icon: "/design.png",
    items: [
      { label: "Проект электроснабжения (ЭОМ)", tag: "ЭОМ", href: "/services/design/power-eom" },
      { label: "Проект ОВ и ВК", tag: "ОВ/ВК", href: "/services/design/hvac-vk" },
      { label: "Проект СС (слаботочные системы)", tag: "СС", href: "/services/design/lowcurrent-ss" },
      { label: "АСУ ТП и разделы автоматики", tag: "АСУ", href: "/services/design/automation-asutp" },
      { label: "Молниезащита и заземление", tag: "МЗ", href: "/services/design/lightning-earthing" },
      { label: "Сметная документация", tag: "СД", href: "/services/design/estimate-documentation" },
      { label: "Авторский надзор", tag: "АН", href: "/services/design/author-supervision" },
      { label: "Согласования в сетевых организациях", tag: "СО", href: "/services/design/network-approvals" },
    ],
  },
  {
    key: "construction",
    label: "Общестрой",
    href: "/services/construction",
    icon: "/construction.png",
    items: [
      { label: "Общестроительные и отделочные работы", tag: "СМР", href: "/services/construction/general-finishing" },
      { label: "Монолитные и бетонные работы", tag: "ЖБ", href: "/services/construction/monolith-concrete" },
      { label: "Фундамент и земляные работы", tag: "ЗР", href: "/services/construction/foundation-earthworks" },
      { label: "Кровля и фасад", tag: "КФ", href: "/services/construction/roof-facade" },
      { label: "Внутренние перегородки и проёмы", tag: "ГКЛ", href: "/services/construction/partitions-openings" },
      { label: "Усиление конструкций", tag: "УК", href: "/services/construction/structural-strengthening" },
      { label: "Генподряд и технадзор", tag: "ГП", href: "/services/construction/general-contracting-supervision" },
      { label: "Пуско-наладка инженерных систем", tag: "ПНР", href: "/services/construction/commissioning" },
    ],
  },
];

/* ===== Ссылки навигации ===== */
const NAV_LINKS = [
  { href: "#about", label: "О нас" },
  { href: "#projects", label: "Проекты", badge: "New" },
  { href: "#contact", label: "Контакты" },
  { href: "#reviews", label: "Отзывы" },
];

const NAV_LINK_CLASS =
  "text-sm font-medium leading-[28px] text-ink transition-opacity hover:opacity-70";

/* поисковая «пилюля» мобильной шапки (как у awwwards: почти белая #fdfdfd + тонкая рамка) */
const MOBILE_SEARCH_PILL = "flex h-[42px] min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-[#e9e9e9] pl-4 pr-4";
const MOBILE_SEARCH_TEXT = "text-[14px] font-light leading-[28px]";

/* SPA-переход без полной перезагрузки */
function spaNavigate(to) {
  try {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.location.href = to;
  }
}
/* клик по «О нас / Проекты / …»: на главной — скроллим сразу; не на главной —
   передаём цель через флаг и уходим на главную (App сам доскроллит после монтажа) */
function onNavClick(hash) {
  return (e) => {
    if (e) e.preventDefault();
    const id = (hash || "").replace(/^#/, "");
    const onHome = window.location.pathname === "/" || window.location.pathname === "";
    if (onHome) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      try { sessionStorage.setItem("cube:scrollTo", id); } catch {}
      spaNavigate("/");
    }
  };
}
/* клик по ссылке услуги/направления → SPA-переход + закрыть панель */
function onServiceClick(to, close) {
  return (e) => {
    if (e) e.preventDefault();
    spaNavigate(to);
    if (close) close();
  };
}
/* клик по логотипу «c.»: на главной — плавно вверх; иначе — на главную */
function onLogoClick(close) {
  return (e) => {
    if (e) e.preventDefault();
    const onHome = window.location.pathname === "/" || window.location.pathname === "";
    if (close) close();
    if (onHome) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), close ? 90 : 0);
    } else {
      spaNavigate("/");
    }
  };
}

/* ===== Переиспользуемые куски ===== */
function SearchField({ className = "", white = false, value, onChange, onFocus, autoFocus = false, readOnly = false }) {
  return (
    <label
      className={`flex h-[42px] items-center gap-2 rounded-lg px-4 ${
        white ? "bg-white" : "bg-field"
      } ${className}`}
    >
      <Search size={18} strokeWidth={2} className="shrink-0 text-[#222222]" />
      <input
        type="text"
        placeholder="Поиск"
        aria-label="Поиск"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        autoFocus={autoFocus}
        readOnly={readOnly}
        className="w-full min-w-0 bg-transparent text-[14px] font-light leading-[28px] text-[#222222] outline-none placeholder:text-[#222222]"
      />
    </label>
  );
}

/* подсветка совпадения в названии (наш «морковный» цвет) */
function Highlight({ text, query }) {
  const q = (query || "").trim();
  if (!q) return <>{text}</>;
  const norm = (s) => s.toLowerCase().replace(/ё/g, "е");
  const i = norm(text).indexOf(norm(q));
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-medium text-carrot">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

/* ===== Результаты поиска по сайту ===== */
function SearchResults({ query, onClose }) {
  const results = React.useMemo(() => search(query), [query]);
  if (results.length === 0) {
    return <div className="px-3 py-8 text-sm text-neutral-500">Ничего не найдено</div>;
  }
  return (
    <ul className="flex flex-col gap-0.5 pb-6 pt-1">
      {results.map((r) => (
        <li key={`${r.title}-${r.href}`}>
          <a
            href={r.href}
            onClick={(e) => { e.preventDefault(); spaNavigate(r.href); if (onClose) onClose(); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm leading-[28px] text-ink transition-colors hover:bg-white active:bg-[#ececec]"
          >
            <Search size={16} className="shrink-0 text-neutral-400" />
            <span className="truncate"><Highlight text={r.title} query={query} /></span>
            <span className="ml-auto shrink-0 text-[12px] text-neutral-400">
              {r.category}{r.marker ? ` · ${r.marker}` : ""}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ActionButtons() {
  return (
    <>
      <a
        href="/pro"
        className="inline-flex h-[42px] items-center rounded-lg bg-dark px-4 text-sm font-semibold leading-[28px] text-white transition-colors hover:bg-neutral-800"
      >
        Ищу работу
      </a>
      <a
        href="/contact"
        className="inline-flex h-[42px] items-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold leading-[28px] text-ink transition-colors hover:border-dark hover:bg-dark hover:text-white"
      >
        Оставить заявку
      </a>
    </>
  );
}

function AuthControls({ user, authReady, onLogout }) {
  if (user) return <AvatarMenu user={user} onLogout={onLogout} />;
  // Оптимистично показываем «Вход/Регистрация» СРАЗУ, не дожидаясь authReady.
  // Раньше здесь висела пустая заглушка h-8 w-[120px] до конца bootstrap
  // (refresh+me, до 3.5 c) — первый заход «думал», потом появлялись кнопки
  // (жалоба #1). Залогиненного вернувшегося пользователя уже покрывает user из
  // readCachedUser() → аватар без мигания; для гостя (у него нет сессии)
  // мигания нет вовсе. Если сессия жива, но кэша нет (новая вкладка) —
  // кратко мелькнут кнопки и сменятся аватаром: приемлемый размен ради
  // мгновенного отклика вместо секундной паузы.
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => window.openModal?.("login")} className={NAV_LINK_CLASS}>
        Вход
      </button>
      <button type="button" onClick={() => window.openModal?.("register", { email: "" })} className={NAV_LINK_CLASS}>
        Регистрация
      </button>
    </div>
  );
}

/* ===== Строка шапки (используется и в шапке, и в карточке панели) ===== */
function HeaderBar({ servicesOpen, setServicesOpen, user, authReady, onLogout, inPanel = false }) {
  return (
    <div className="flex h-header items-center gap-5">
      {/* Логотип */}
      <a href="/" className="relative -top-1 mr-8 shrink-0 text-[30px] font-bold leading-none text-ink">
        c.
      </a>

      {/* Навигация (desktop). В открытой панели — только «Услуги» (как на awwwards) */}
      <nav className="hidden items-center gap-5 lg:flex">
        <button
          type="button"
          onClick={() => setServicesOpen((v) => !v)}
          aria-expanded={servicesOpen}
          className={`flex items-center gap-1 outline-none ${NAV_LINK_CLASS}`}
        >
          Услуги
          <ChevronDown size={16} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
        </button>
        {!inPanel &&
          NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={onNavClick(l.href)} className={`flex items-center gap-2 ${NAV_LINK_CLASS}`}>
              {l.label}
              {l.badge && (
                <span className="rounded bg-dark px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                  {l.badge}
                </span>
              )}
            </a>
          ))}
      </nav>

      {/* Поиск — клик открывает панель с поиском по сайту */}
      <div className="hidden flex-1 md:flex">
        <SearchField className="w-full max-w-[980px]" readOnly onFocus={() => setServicesOpen(true)} />
      </div>

      {/* Действия (desktop) */}
      <div className="ml-auto hidden items-center gap-3 md:flex">
        <AuthControls user={user} authReady={authReady} onLogout={onLogout} />
        <ActionButtons />
      </div>

      {/* Бургер (узкие экраны; мобилка позже) */}
      <button
        type="button"
        onClick={() => setServicesOpen((v) => !v)}
        aria-label="Меню"
        aria-expanded={servicesOpen}
        className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
      >
        {servicesOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );
}

/* ===== Строка шапки для iPad Pro / узких ноутов (1024–1279) =====
   Стиль awwwards: бургер слева (полное меню) + логотип + поиск + правые кнопки как на ПК.
   Живёт только в диапазоне lg…xl — реальный десктоп (≥1280) её не видит. */
function TabletProBar({ onOpenMenu, onOpenSearch, user, authReady, onLogout }) {
  return (
    <div className="flex h-header items-center gap-3.5">
      {/* Бургер слева — открывает полноэкранное меню (О нас/Проекты/Контакты/Отзывы + услуги) */}
      <button type="button" onClick={onOpenMenu} aria-label="Меню" className="-ml-0.5 shrink-0 text-ink transition-opacity hover:opacity-70">
        <Menu size={22} strokeWidth={2} />
      </button>

      {/* Логотип */}
      <a href="/" onClick={onLogoClick()} className="relative -top-0.5 shrink-0 text-[30px] font-bold leading-none text-ink">
        c.
      </a>

      {/* Поиск — та же «пилюля», что и в открытом меню (без прыжка при открытии) */}
      <button type="button" onClick={onOpenSearch} className={`${MOBILE_SEARCH_PILL} text-left`}>
        <Search size={14} strokeWidth={2} className="shrink-0 text-[#222222]" />
        <span className={`truncate text-[#222222] ${MOBILE_SEARCH_TEXT}`}>Поиск</span>
      </button>

      {/* Правые кнопки — как на ПК, прижаты вправо */}
      <div className="flex shrink-0 items-center gap-3">
        <AuthControls user={user} authReady={authReady} onLogout={onLogout} />
        <ActionButtons />
      </div>
    </div>
  );
}

/* ===== Панель «Услуги» — портал в body; раскладка как у awwwards ===== */
function ServicesPanel({ activeCat, setActiveCat, barProps, onClose, query, setQuery }) {
  const cat = SERVICE_CATEGORIES[activeCat];
  const { user, authReady, onLogout } = barProps;
  return createPortal(
    <div className="fixed inset-0 z-[100] font-tight">
      {/* затемнение */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* карточка: прижата к верху вьюпорта (relative в потоке fixed-родителя — надёжнее absolute) */}
      <div className="relative pt-3">
        <div className="mx-auto max-w-[1700px] px-6 lg:px-10">
          <div className="-mx-5 rounded-lg bg-[#ededed] px-5 shadow-2xl">
            <div className="flex gap-5">
              {/* логотип — левый жёлоб */}
              <div className="flex h-header shrink-0 items-center">
                <a href="/" className="relative -top-1 mr-8 text-[30px] font-bold leading-none text-ink">
                  c.
                </a>
              </div>

              {/* поиск + тело: правый край колонки = конец поиска (под кнопками пусто) */}
              <div className="min-w-0 flex-1">
                <div className="flex h-header items-center">
                  <SearchField
                    className="w-full"
                    white
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {query.trim() ? (
                  <SearchResults query={query} onClose={onClose} />
                ) : (
                <div className="mt-1 grid grid-cols-[260px_1fr] gap-x-8 pb-6">
                  {/* категории */}
                  <ul className="flex flex-col gap-0.5">
                    {SERVICE_CATEGORIES.map((c, i) => (
                      <li key={c.key}>
                        <a
                          href={c.href}
                          onClick={onServiceClick(c.href, onClose)}
                          onMouseEnter={() => setActiveCat(i)}
                          onFocus={() => setActiveCat(i)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm leading-[28px] transition-colors ${
                            activeCat === i ? "bg-white font-medium shadow-sm" : "text-ink hover:bg-white"
                          }`}
                        >
                          <img src={c.icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
                          <span>{c.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>

                  {/* услуги активной категории — сокращение справа, плавное появление */}
                  <ul key={activeCat} className="flex flex-col gap-0.5 animate-svcfade">
                    {cat.items.map((it) => (
                      <li key={it.label}>
                        <a
                          href={it.href || cat.href}
                          onClick={onServiceClick(it.href || cat.href, onClose)}
                          className="flex items-center gap-4 rounded-lg px-3 py-1.5 text-sm leading-[28px] text-ink transition-colors hover:bg-white"
                        >
                          <span className="truncate">{it.label}</span>
                          <span className="ml-auto shrink-0 text-neutral-400">{it.tag}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </div>

              {/* действия — правый жёлоб */}
              <div className="hidden h-header shrink-0 items-center gap-3 md:flex">
                <AuthControls user={user} authReady={authReady} onLogout={onLogout} />
                <ActionButtons />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ===== Мобильная строка шапки: бургер · c. · поиск · аккаунт (компоновка как у awwwards) ===== */
function MobileBar({ onOpenMenu, onOpenSearch, onOpenAccount, user }) {
  return (
    <div className="flex h-header items-center gap-3.5">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Меню"
        className="-ml-0.5 shrink-0 text-ink"
      >
        <Menu size={22} strokeWidth={2} />
      </button>
      <a href="/" onClick={onLogoClick()} className="relative -top-0.5 shrink-0 text-[30px] font-bold leading-none text-ink">
        c.
      </a>
      <button type="button" onClick={onOpenSearch} className={`${MOBILE_SEARCH_PILL} text-left`}>
        <Search size={14} strokeWidth={2} className="shrink-0 text-[#222222]" />
        <span className={`truncate text-[#222222] ${MOBILE_SEARCH_TEXT}`}>Поиск</span>
      </button>
      {user ? (
        <button type="button" onClick={onOpenAccount} className="shrink-0" aria-label="Аккаунт">
          <img src="/profile/profile.png" alt="" className="h-[30px] w-[30px] rounded-full object-cover" />
        </button>
      ) : (
        <button type="button" onClick={onOpenAccount} aria-label="Аккаунт" className="-mr-0.5 shrink-0 text-ink" title="Аккаунт">
          <UserRound size={20} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ===== Всплывающее окно аккаунта (мобильное): тёмная панель под иконкой ===== */
function MobileAccountMenu({ onClose, user, onLogout }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin" || user?.role === "manager" || user?.group === "admin");
  const grp = String(user?.group || user?.role || "").toLowerCase();
  const go = (to) => {
    onClose();
    try { window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); }
    catch { window.location.href = to; }
  };

  // Есть ли непросмотренные изменения по объектам (для морковного бейджа «New»).
  const [tick, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    const on = () => force();
    window.addEventListener("objects:changed", on);
    window.addEventListener("objects:seen", on);
    window.addEventListener("messages:seen", on);
    return () => { window.removeEventListener("objects:changed", on); window.removeEventListener("objects:seen", on); window.removeEventListener("messages:seen", on); };
  }, []);
  const objectsUnseen = React.useMemo(() => {
    if (!user) return false;
    try {
      // Сотруднику вкладку подсвечивают только новые сообщения заказчика,
      // не его собственные правки по объектам (документы/статус).
      if (isAdmin) return DB.anyUnreadMessages(DB.listObjects(), "staff");
      const list = DB.listObjectsForCustomer(user?.email, user?.id || user?.accountId || "");
      return DB.anyObjectUnseen(list);
    } catch { return false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, tick]);

  const Item = ({ children, onClick, strong, right }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[15px] ${strong ? "font-medium" : "font-normal"} text-white active:bg-white/10`}
    >
      <span className="truncate">{children}</span>
      {right}
    </button>
  );
  const Divider = () => <div className="-mx-2 my-1.5 h-px bg-white/10" />;

  return createPortal(
    <div className="fixed inset-0 z-[95]" onClick={onClose}>
      <div
        className="absolute right-4 top-[60px] w-56 max-w-[calc(100vw-32px)] origin-top-right animate-svcfade overflow-hidden rounded-2xl bg-[#1c1c1c] p-2 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {user ? (
          <>
            <div className="px-3 pb-1 pt-2">
              <div className="text-[11px] uppercase tracking-wide text-white/50">В аккаунте</div>
              <div className="truncate text-[15px] font-medium">{user?.name || user?.email || "Пользователь"}</div>
            </div>
            <Divider />
            <Item onClick={() => go("/account/profile")}>Профиль</Item>
            <Item
              onClick={() => go("/account/objects")}
              right={objectsUnseen ? (
                <span className="relative flex h-2 w-2 shrink-0" title="Есть новое">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-carrot opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-carrot" />
                </span>
              ) : null}
            >
              Объекты
            </Item>
            {(isAdmin || grp === "partner") && <Item onClick={() => go("/account/partner")}>Партнёр</Item>}
            {(isAdmin || grp === "supplier") && <Item onClick={() => go("/account/supplier")}>Поставщик</Item>}
            <Item onClick={() => go("/account/personal")}>Настройки</Item>
            {!isAdmin && <Item onClick={() => go("/account/help")}>Помощь</Item>}
            {isAdmin && (
              <>
                <Divider />
                <Item strong onClick={() => go("/account/admin")}>Администратор</Item>
              </>
            )}
            <Divider />
            <Item onClick={() => { onClose(); onLogout(); }}>Выход</Item>
          </>
        ) : (
          <>
            <div className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wide text-white/50">Аккаунт</div>
            <Divider />
            <Item strong onClick={() => { onClose(); window.openModal?.("login"); }}>Вход</Item>
            <Item onClick={() => { onClose(); window.openModal?.("register", { email: "" }); }}>Регистрация</Item>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ===== Полноэкранное мобильное меню (услуги-аккордеон + навигация + действия) ===== */
function MobileMenu({ open, onClose, query, setQuery, user, authReady, onLogout, mode = "menu" }) {
  const [openIdx, setOpenIdx] = React.useState(-1);
  const [present, setPresent] = React.useState(open);
  const [shown, setShown] = React.useState(false);
  const searchMode = mode === "search";

  // плавные вход/выход: держим в DOM на время анимации закрытия
  React.useEffect(() => {
    let raf1, raf2, t;
    if (open) {
      setOpenIdx(-1);
      setPresent(true);
      raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setShown(true)); });
    } else {
      setShown(false);
      t = setTimeout(() => setPresent(false), 280);
    }
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(t); };
  }, [open]);

  // Клик по разделу (О нас / Проекты / Контакты / Отзывы) из открытого меню:
  // сначала закрываем меню (разблокируем скролл), затем плавно скроллим к секции
  // с учётом высоты sticky-шапки. Если не на главной — уходим на главную с флагом.
  const onMobileNav = (hash) => (e) => {
    if (e) e.preventDefault();
    const id = (hash || "").replace(/^#/, "");
    const onHome = window.location.pathname === "/" || window.location.pathname === "";
    onClose();
    if (onHome) {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const header = 64; // высота sticky-шапки
        const y = Math.max(0, window.scrollY + el.getBoundingClientRect().top - header - 8);
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 90);
    } else {
      try { sessionStorage.setItem("cube:scrollTo", id); } catch {}
      spaNavigate("/");
    }
  };

  if (!present) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[100] overflow-y-scroll bg-page font-tight [overflow-anchor:none] transition-opacity duration-[240ms] ease-out will-change-[opacity] ${shown ? "opacity-100" : "opacity-0"}`}>
      {/* верхняя строка меню — та же, что в шапке: бургер (закрывает) · c. · поиск · аккаунт */}
      <div className="sticky top-0 z-10 bg-page px-4 pt-0 lg:px-[52px] lg:pt-3">
        <div className="flex h-header items-center gap-3.5">
          <button type="button" onClick={onClose} aria-label="Закрыть меню" className="-ml-0.5 shrink-0 text-ink">
            <Menu size={22} strokeWidth={2} />
          </button>
          <a href="/" onClick={onLogoClick(onClose)} className="relative -top-0.5 shrink-0 text-[30px] font-bold leading-none text-ink">c.</a>
          <label className={MOBILE_SEARCH_PILL}>
            <Search size={14} strokeWidth={2} className="shrink-0 text-[#222222]" />
            <input
              autoFocus={searchMode}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск"
              aria-label="Поиск"
              className={`w-full min-w-0 bg-transparent text-[#222222] outline-none placeholder:text-[#222222] ${MOBILE_SEARCH_TEXT}`}
            />
          </label>
          {/* Мобилка (<1024) — иконка аккаунта */}
          <div className="lg:hidden">
            {user ? (
              <a href="/account/profile" onClick={onServiceClick("/account/profile", onClose)} className="shrink-0" aria-label="Профиль">
                <img src="/profile/profile.png" alt="" className="h-[30px] w-[30px] rounded-full object-cover" />
              </a>
            ) : (
              <button type="button" onClick={() => { window.openModal?.("login"); onClose(); }} aria-label="Аккаунт" className="-mr-0.5 shrink-0 text-ink">
                <UserRound size={20} strokeWidth={2} />
              </button>
            )}
          </div>
          {/* iPad Pro (1024–1279) — те же правые кнопки, что и в закрытой шапке (без прыжка) */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex" onClick={onClose}>
            <AuthControls user={user} authReady={authReady} onLogout={onLogout} />
            <ActionButtons />
          </div>
        </div>
      </div>

      {query.trim() ? (
        <div className="px-4 pb-10 lg:px-[52px]">
          <SearchResults query={query} onClose={onClose} />
        </div>
      ) : searchMode ? (
        <div className="px-4 pb-10 pt-5 text-[14px] leading-6 text-neutral-500 lg:px-[52px]">
          Начните вводить запрос — услуги, направления, страницы…
        </div>
      ) : (
        <div className="flex min-h-[calc(100dvh-64px)] flex-col pb-6">
          {/* Услуги — заголовок-плашка (тёмная #ececec) */}
          <div className="mt-1 flex min-h-[54px] items-center border-b border-[#d4d4d4] bg-[#ececec] px-4 text-[14px] font-semibold text-ink lg:px-[52px]">Услуги</div>

          {/* Строки-направления — белые, как пункты внутри них */}
          <ul className="flex flex-col border-b border-[#d4d4d4] bg-white">
            {SERVICE_CATEGORIES.map((c, i) => {
              const open = openIdx === i;
              return (
                <li key={c.key} className="border-b border-[#d4d4d4] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? -1 : i)}
                    aria-expanded={open}
                    className="flex min-h-[54px] w-full items-center justify-between gap-3 px-4 text-left text-[14px] font-medium text-ink active:bg-[#f2f2f2] lg:px-[52px]"
                  >
                    <span className="flex items-center gap-3">
                      <img src={c.icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
                      {c.label}
                    </span>
                    <ChevronDown size={18} className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <ul className="bg-white py-1">
                      {c.items.map((it) => (
                        <li key={it.label}>
                          <a href={it.href || c.href} onClick={onServiceClick(it.href || c.href, onClose)} className="flex items-center gap-3 py-2.5 pl-[52px] pr-5 text-[14px] text-ink lg:pl-[84px] lg:pr-[52px]">
                            <span className="min-w-0 flex-1">{it.label}</span>
                            <span className="shrink-0 text-neutral-400">{it.tag}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* Прочие разделы — серые (#ececec), цвет как в услугах */}
            {NAV_LINKS.map((l) => (
              <li key={l.href} className="border-b border-[#d4d4d4] last:border-b-0">
                <a
                  href={l.href}
                  onClick={onMobileNav(l.href)}
                  className="flex min-h-[54px] items-center justify-between gap-2 bg-[#ececec] px-4 text-[14px] font-medium text-ink active:bg-[#e2e2e2] lg:px-[52px]"
                >
                  <span>{l.label}</span>
                  {l.badge && <span className="rounded bg-dark px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">{l.badge}</span>}
                </a>
              </li>
            ))}
          </ul>

          {/* Оставить заявку / Ищу работу — точно такие же строки, как Отзывы/Контакты, просто чуть отделены */}
          <ul className="mt-2.5 flex flex-col border-y border-[#d4d4d4] bg-[#ececec]">
            <li className="border-b border-[#d4d4d4]">
              <a
                href="/contact"
                onClick={onServiceClick("/contact", onClose)}
                className="flex min-h-[54px] items-center justify-between gap-2 bg-carrot px-4 text-[14px] font-semibold text-black transition-colors active:bg-[#e8541f] lg:px-[52px]"
              >
                <span>Оставить заявку</span>
              </a>
            </li>
            <li>
              <a
                href="/pro"
                onClick={onServiceClick("/pro", onClose)}
                className="flex min-h-[54px] items-center justify-between gap-2 px-4 text-[14px] font-medium text-ink active:bg-[#e2e2e2] lg:px-[52px]"
              >
                <span>Ищу работу</span>
              </a>
            </li>
          </ul>

          {/* Контакты внизу — как в подвале главной */}
          <div className="mt-auto flex flex-col gap-1.5 px-4 pt-8 text-[14px] lg:px-[52px]">
            <div>
              <span className="font-semibold">Почта:</span>{" "}
              <a href="mailto:info@cube-tech.ru" className="font-normal hover:underline">info@cube-tech.ru</a>
            </div>
            <div>
              <span className="font-semibold">Телефон:</span>{" "}
              <a href="tel:+79129112000" className="font-normal hover:underline">+7 (912) 911-20-00</a>
            </div>
          </div>

        </div>
      )}
    </div>,
    document.body
  );
}

/* ===== Аватар + меню ===== */
function AvatarMenu({ user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const closeT = React.useRef(null);
  const CLOSE_DELAY = 200;

  const openNow = () => {
    if (closeT.current) { clearTimeout(closeT.current); closeT.current = null; }
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeT.current) clearTimeout(closeT.current);
    closeT.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  React.useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      if (closeT.current) clearTimeout(closeT.current);
    };
  }, []);

  // вкладки аккаунта по роли (Партнёр/Поставщик — только при доступе, Администратор — только админу)
  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin" || user?.role === "manager" || user?.group === "admin");
  const grp = String(user?.group || user?.role || "").toLowerCase();

  // пере-рендер при появлении/сбросе маркеров «новое» (данные объектов подгружаются async)
  const [tick, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    const on = () => force();
    window.addEventListener("objects:changed", on);
    window.addEventListener("objects:seen", on);
    window.addEventListener("messages:seen", on);
    return () => { window.removeEventListener("objects:changed", on); window.removeEventListener("objects:seen", on); window.removeEventListener("messages:seen", on); };
  }, []);
  const objectsUnseen = React.useMemo(() => {
    if (!user) return false;
    try {
      // Сотруднику вкладку подсвечивают только новые сообщения заказчика,
      // не его собственные правки по объектам (документы/статус).
      if (isAdmin) return DB.anyUnreadMessages(DB.listObjects(), "staff");
      const list = DB.listObjectsForCustomer(user?.email, user?.id || user?.accountId || "");
      return DB.anyObjectUnseen(list);
    } catch { return false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, open, tick]);
  const navItems = [
    { label: "Профиль", href: "/account/profile", locked: false },
    { label: "Объекты", href: "/account/objects", locked: false },
    { label: "Партнёр", href: "/account/partner", locked: !(isAdmin || grp === "partner") },
    { label: "Поставщик", href: "/account/supplier", locked: !(isAdmin || grp === "supplier") },
    { label: "Настройки", href: "/account/personal", locked: false },
    ...(!isAdmin ? [{ label: "Помощь", href: "/account/help", locked: false }] : []),
  ];
  const go = (e, to) => {
    if (e) e.preventDefault();
    setOpen(false);
    try { window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); }
    catch { window.location.href = to; }
  };

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={openNow} onMouseLeave={scheduleClose}>
      <img
        src={user?.avatar || "/profile/profile.png"}
        alt={user?.name || user?.email || "Profile"}
        width={32}
        height={32}
        className="block h-8 w-8 cursor-pointer rounded-full object-cover"
      />
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+10px)] z-[80] w-56 origin-top-left animate-svcfade rounded-2xl bg-dark p-2.5 text-sm font-light text-white shadow-2xl"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <div className="px-2 pb-1.5 pt-1">
            <div className="mb-0.5 text-xs opacity-60">В аккаунте</div>
            <div className="truncate font-normal" title={user?.name || user?.email || "Пользователь"}>
              {user?.name || user?.email || "Пользователь"}
            </div>
          </div>
          <div className="my-1.5 h-px bg-white/15" />
          {navItems.map((it) => (
            it.locked ? (
              <div
                key={it.href}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-2 py-1.5 text-white/35"
                title="Недоступно для вашего аккаунта"
              >
                <span>{it.label}</span>
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" className="opacity-80">
                  <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </div>
            ) : (
              <a
                key={it.href}
                href={it.href}
                onClick={(e) => go(e, it.href)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10"
              >
                <span>{it.label}</span>
                {it.href === "/account/objects" && objectsUnseen ? (
                  <span className="relative flex h-2 w-2 shrink-0" title="Есть новое">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-carrot opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-carrot" />
                  </span>
                ) : null}
              </a>
            )
          ))}
          {isAdmin && (
            <>
              <div className="my-1.5 h-px bg-white/15" />
              <a
                href="/account/admin"
                onClick={(e) => go(e, "/account/admin")}
                className="block rounded-lg px-2 py-1.5 hover:bg-white/10"
              >
                Администратор
              </a>
            </>
          )}
          <div className="my-1.5 h-px bg-white/15" />
          <button type="button" onClick={onLogout} className="w-full rounded-lg px-2 py-1.5 text-left font-normal hover:bg-white/10">
            Выход
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [mobileView, setMobileView] = React.useState(null); // null | 'menu' | 'search'
  const [acctOpen, setAcctOpen] = React.useState(false);
  const [activeCat, setActiveCat] = React.useState(0);
  const [query, setQuery] = React.useState("");

  // при закрытии панелей сбрасываем поисковый запрос
  React.useEffect(() => { if (!servicesOpen && !mobileView) setQuery(""); }, [servicesOpen, mobileView]);

  // лочим скролл body, когда открыто мобильное меню/поиск
  React.useEffect(() => {
    if (!mobileView) return;
    const root = document.documentElement;
    root.style.setProperty("overflow", "hidden", "important");
    return () => { root.style.removeProperty("overflow"); };
  }, [mobileView]);

  // === auth state (без мигания) ===
  const initialUser = (typeof window !== "undefined") ? withAvatar(readCachedUser()) : null;
  const [user, setUser] = React.useState(initialUser);
  const [authReady, setAuthReady] = React.useState(false);
  const accessRef = React.useRef(null);
  const bootRef = React.useRef(false);

  React.useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    // страховка: что бы ни случилось с сетью, показываем правую часть шапки
    // («Вход/Регистрация» либо аватар) максимум через 3.5 c — не оставляем пустую заглушку
    const safety = setTimeout(() => setAuthReady(true), 3500);

    const bootstrap = async () => {
      try {
        const t0 = sessionStorage.getItem("auth:accessToken");
        if (t0) accessRef.current = t0;

        if (!accessRef.current) {
          const t = await apiRefresh(8000);
          if (t) {
            accessRef.current = t;
            try { sessionStorage.setItem("auth:accessToken", t); } catch {}
          }
        }

        if (accessRef.current) {
          const u = await apiMe(accessRef.current);
          if (u) {
            const uu = withAvatar(u);
            setUser(uu);
            writeCachedUser(uu);
            setAuthReady(true);
            return;
          }
          const t2 = await apiRefresh(8000);
          if (t2) {
            accessRef.current = t2;
            try { sessionStorage.setItem("auth:accessToken", t2); } catch {}
            const u2 = await apiMe(t2);
            if (u2) {
              const uu2 = withAvatar(u2);
              setUser(uu2);
              writeCachedUser(uu2);
              setAuthReady(true);
              return;
            }
          }
        }

        setUser(null);
        writeCachedUser(null);
      } catch {} finally {
        setAuthReady(true);
      }
    };

    bootstrap();

    const onFocus = async () => {
      if (user) return;
      const t = await apiRefresh(8000);
      if (t) {
        accessRef.current = t;
        try { sessionStorage.setItem("auth:accessToken", t); } catch {}
        const u = await apiMe(t);
        if (u) { const uu = withAvatar(u); setUser(uu); writeCachedUser(uu); }
      }
    };
    window.addEventListener("focus", onFocus);
    return () => { clearTimeout(safety); window.removeEventListener("focus", onFocus); };
  }, []); // eslint-disable-line

  React.useEffect(() => {
    const onAuth = (e) => {
      const newUser = withAvatar(e?.detail?.user || null);
      const newToken = e?.detail?.accessToken || null;
      if (newToken) {
        accessRef.current = newToken;
        try { sessionStorage.setItem("auth:accessToken", newToken); } catch {}
      }
      setUser(newUser);
      writeCachedUser(newUser);
      if (!newUser) {
        try { sessionStorage.removeItem("auth:accessToken"); } catch {}
        accessRef.current = null;
      }
      setAuthReady(true);
    };
    window.addEventListener("auth:changed", onAuth);
    window.setHeaderUser = (u, token) =>
      window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: u, accessToken: token } }));
    return () => {
      window.removeEventListener("auth:changed", onAuth);
      delete window.setHeaderUser;
    };
  }, []);

  async function handleLogout() {
    try { await fetch(api("/auth/logout"), { method: "POST", credentials: "include" }); } catch {}
    setUser(null);
    writeCachedUser(null);
    accessRef.current = null;
    try { sessionStorage.removeItem("auth:accessToken"); } catch {}
    setAuthReady(true);
    // уведомляем подписчиков (док, гард в App) → они уведут с приватных страниц
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: null, accessToken: null } }));
  }

  // === Управление панелью услуг ===
  React.useEffect(() => {
    const onKey = (e) => {
      const key = (e.key || "").toLowerCase();
      if (e.altKey && key === "s") { e.preventDefault(); setServicesOpen((v) => !v); }
      if (key === "escape") { setServicesOpen(false); setMobileView(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    window.openServicesPanel = () => setServicesOpen(true);
    window.closeServicesPanel = () => setServicesOpen(false);
    window.toggleServicesPanel = () => setServicesOpen((v) => !v);
    return () => {
      delete window.openServicesPanel;
      delete window.closeServicesPanel;
      delete window.toggleServicesPanel;
    };
  }, []);

  React.useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("open") === "services" || (window.location.hash || "").includes("open-services")) {
        setServicesOpen(true);
      }
    } catch {}
  }, []);

  // блокируем прокрутку body при открытой панели
  // (scrollbar-gutter:stable в index.css не даёт фону «прыгать»)
  React.useEffect(() => {
    if (!servicesOpen) return;
    const root = document.documentElement;
    // важно !important: иначе html{overflow-y:scroll !important} из index.css перебьёт и скролл не залочится
    root.style.setProperty("overflow", "hidden", "important");
    return () => { root.style.removeProperty("overflow"); };
  }, [servicesOpen]);

  const barProps = { servicesOpen, setServicesOpen, user, authReady, onLogout: handleLogout };

  return (
    <header className="sticky top-0 z-40 bg-page pt-0 font-tight lg:relative lg:bg-transparent lg:pt-3">
      {/* Реальная шапка. Desktop — полная строка; мобильная (< lg) — компактная строка */}
      <div className="mx-auto max-w-[1700px] px-4 lg:px-[52px] xl:px-10">
        {/* Десктоп (≥1280) — полная строка с инлайновым меню. Не трогаем. */}
        <div className="hidden xl:block">
          <HeaderBar {...barProps} />
        </div>
        {/* iPad Pro / узкие ноуты (1024–1279) — бургер + правые кнопки как на ПК */}
        <div className="hidden lg:block xl:hidden">
          <TabletProBar
            onOpenMenu={() => setMobileView("menu")}
            onOpenSearch={() => setMobileView("search")}
            user={user}
            authReady={authReady}
            onLogout={handleLogout}
          />
        </div>
        {/* Мобилка / планшет (<1024) — компактная строка. Не трогаем. */}
        <div className="lg:hidden">
          <MobileBar onOpenMenu={() => setMobileView("menu")} onOpenSearch={() => setMobileView("search")} onOpenAccount={() => setAcctOpen(true)} user={user} />
        </div>
      </div>

      {/* Панель «Услуги» (desktop) — портал в body, карточка ложится ровно над шапкой */}
      {servicesOpen && (
        <ServicesPanel
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          barProps={barProps}
          onClose={() => setServicesOpen(false)}
          query={query}
          setQuery={setQuery}
        />
      )}

      {/* Полноэкранное мобильное меню / поиск */}
      <MobileMenu
        open={!!mobileView}
        mode={mobileView || "menu"}
        onClose={() => setMobileView(null)}
        query={query}
        setQuery={setQuery}
        user={user}
        authReady={authReady}
        onLogout={handleLogout}
      />

      {/* Всплывающее окно аккаунта (мобильное) */}
      {acctOpen && (
        <MobileAccountMenu
          onClose={() => setAcctOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </header>
  );
}

