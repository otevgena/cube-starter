// src/components/layout/Header.jsx
// Чистая шапка (clean-rebuild). Логика авторизации сохранена, разметка на Tailwind
// с токенами — без !important и пиксельных сдвигов.
// «Услуги» раскрываются ВНУТРИ той же карточки (шапка не дублируется → ничего не
// сдвигается). Вокруг — тёмный фон, сверху зазор (awwwards-стиль).
import React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Menu, X } from "lucide-react";
import { search } from "@/data/search-index";

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

/* ---- non-blocking refresh with timeout ---- */
async function apiRefresh(timeoutMs = 1200) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(api("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.accessToken || null;
  } catch {
    clearTimeout(to);
    return null;
  }
}

async function apiMe(token) {
  try {
    const r = await fetch(api("/auth/me"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.user || null;
  } catch {
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
      { label: "Подключение объектов к электросетям", tag: "ТУ" },
      { label: "Увеличение мощности и модернизация сетей", tag: "кВт" },
      { label: "Внутренние электромонтажные работы", tag: "0,4 кВ" },
      { label: "Наружные электросети и уличное освещение", tag: "10 кВ" },
      { label: "Монтаж электрощитов и ВРУ", tag: "ВРУ" },
      { label: "Системы заземления и молниезащиты", tag: "Rз" },
      { label: "Автоматизация и учёт электроэнергии", tag: "АСКУЭ" },
      { label: "Резервное электроснабжение", tag: "ДГУ" },
    ],
  },
  {
    key: "lowcurrent",
    label: "Слаботочные системы",
    href: "/services/lowcurrent",
    icon: "/lowcurrent.png",
    items: [
      { label: "СКС и структурированные кабельные сети", tag: "СКС" },
      { label: "Видеонаблюдение (CCTV)", tag: "CCTV" },
      { label: "Охранно-пожарная сигнализация", tag: "ОПС" },
      { label: "Системы контроля и управления доступом", tag: "СКУД" },
      { label: "Домофония и интерком", tag: "IP" },
      { label: "Серверные, кроссовые и шкафы", tag: "19\"" },
      { label: "ЛВС и активное сетевое оборудование", tag: "LAN" },
      { label: "Системы оповещения и звука", tag: "СОУЭ" },
    ],
  },
  {
    key: "ventilation",
    label: "Климат-системы",
    href: "/services/ventilation",
    icon: "/climat.png",
    items: [
      { label: "Проектирование и монтаж вентиляции", tag: "ОВ" },
      { label: "Системы кондиционирования (VRF/VRV)", tag: "VRF" },
      { label: "Чиллер-фанкойл системы", tag: "FCU" },
      { label: "Системы отопления и теплоснабжения", tag: "ИТП" },
      { label: "Автоматика ОВиК", tag: "BMS" },
      { label: "Паспортизация и балансировка систем", tag: "ПНР" },
      { label: "Воздуховоды, шумоглушение, КИПиА", tag: "КИП" },
      { label: "Сервис и регламентное обслуживание", tag: "ТО" },
    ],
  },
  {
    key: "design",
    label: "Проектирование",
    href: "/services/design",
    icon: "/design.png",
    items: [
      { label: "Проект электроснабжения (ЭОМ)", tag: "ЭОМ" },
      { label: "Проект ОВ и ВК", tag: "ОВ/ВК" },
      { label: "Проект СС (слаботочные системы)", tag: "СС" },
      { label: "АСУ ТП и разделы автоматики", tag: "АСУ" },
      { label: "Молниезащита и заземление", tag: "МЗ" },
      { label: "Сметная документация", tag: "СД" },
      { label: "Авторский надзор", tag: "АН" },
      { label: "Согласования в сетевых организациях", tag: "СО" },
    ],
  },
  {
    key: "construction",
    label: "Общестрой",
    href: "/services/construction",
    icon: "/construction.png",
    items: [
      { label: "Общестроительные и отделочные работы", tag: "СМР" },
      { label: "Монолитные и бетонные работы", tag: "ЖБ" },
      { label: "Фундамент и земляные работы", tag: "ЗР" },
      { label: "Кровля и фасад", tag: "КФ" },
      { label: "Внутренние перегородки и проёмы", tag: "ГКЛ" },
      { label: "Усиление конструкций", tag: "УК" },
      { label: "Генподряд и технадзор", tag: "ГП" },
      { label: "Пуско-наладка инженерных систем", tag: "ПНР" },
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

/* ===== Переиспользуемые куски ===== */
function SearchField({ className = "", white = false, value, onChange, onFocus, autoFocus = false, readOnly = false }) {
  return (
    <label
      className={`flex h-[42px] items-center gap-2 rounded-lg px-4 ${
        white ? "bg-white" : "bg-field"
      } ${className}`}
    >
      <Search size={18} className="shrink-0 text-neutral-500" />
      <input
        type="text"
        placeholder="Поиск"
        aria-label="Поиск"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        autoFocus={autoFocus}
        readOnly={readOnly}
        className="w-full min-w-0 bg-transparent text-sm leading-[28px] text-ink outline-none placeholder:text-neutral-500"
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
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm leading-[28px] text-ink transition-colors hover:bg-white"
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
  if (!authReady) return <div className="h-8 w-[120px]" />;
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
            <a key={l.href} href={l.href} className={`flex items-center gap-2 ${NAV_LINK_CLASS}`}>
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
                          href={cat.href}
                          onClick={onClose}
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
  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin" || user?.group === "admin");
  const grp = String(user?.group || user?.role || "").toLowerCase();
  const navItems = [
    { label: "Профиль", href: "/account/profile", locked: false },
    { label: "Партнёр", href: "/account/partner", locked: !(isAdmin || grp === "partner") },
    { label: "Поставщик", href: "/account/supplier", locked: !(isAdmin || grp === "supplier") },
    { label: "Настройки", href: "/account/personal", locked: false },
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
        src="/profile/profile.png"
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
                className="block rounded-lg px-2 py-1.5 hover:bg-white/10"
              >
                {it.label}
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
  const [activeCat, setActiveCat] = React.useState(0);
  const [query, setQuery] = React.useState("");

  // при закрытии панели сбрасываем поисковый запрос
  React.useEffect(() => { if (!servicesOpen) setQuery(""); }, [servicesOpen]);

  // === auth state (без мигания) ===
  const initialUser = (typeof window !== "undefined") ? readCachedUser() : null;
  const [user, setUser] = React.useState(initialUser);
  const [authReady, setAuthReady] = React.useState(false);
  const accessRef = React.useRef(null);
  const bootRef = React.useRef(false);

  React.useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    const bootstrap = async () => {
      try {
        const t0 = sessionStorage.getItem("auth:accessToken");
        if (t0) accessRef.current = t0;

        if (!accessRef.current) {
          const t = await apiRefresh(900);
          if (t) {
            accessRef.current = t;
            try { sessionStorage.setItem("auth:accessToken", t); } catch {}
          }
        }

        if (accessRef.current) {
          const u = await apiMe(accessRef.current);
          if (u) {
            setUser(u);
            writeCachedUser(u);
            setAuthReady(true);
            return;
          }
          const t2 = await apiRefresh(900);
          if (t2) {
            accessRef.current = t2;
            try { sessionStorage.setItem("auth:accessToken", t2); } catch {}
            const u2 = await apiMe(t2);
            if (u2) {
              setUser(u2);
              writeCachedUser(u2);
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
      const t = await apiRefresh(800);
      if (t) {
        accessRef.current = t;
        try { sessionStorage.setItem("auth:accessToken", t); } catch {}
        const u = await apiMe(t);
        if (u) { setUser(u); writeCachedUser(u); }
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []); // eslint-disable-line

  React.useEffect(() => {
    const onAuth = (e) => {
      const newUser = e?.detail?.user || null;
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
      if (key === "escape") setServicesOpen(false);
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
    <header className="relative z-40 pt-3 font-tight">
      {/* Реальная шапка (всегда на месте; при открытой панели её ровно накрывает карточка) */}
      <div className="mx-auto max-w-[1700px] px-6 lg:px-10">
        <HeaderBar {...barProps} />
      </div>

      {/* Панель «Услуги» — портал в body, поверх всего, карточка ложится ровно над шапкой */}
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
    </header>
  );
}

