// src/components/layout/Header.jsx
// Чистая шапка (clean-rebuild). Логика авторизации сохранена, разметка на Tailwind
// с токенами — без !important и пиксельных сдвигов.
// «Услуги» раскрываются ВНУТРИ той же карточки (шапка не дублируется → ничего не
// сдвигается). Вокруг — тёмный фон, сверху зазор (awwwards-стиль).
import React from "react";
import { ChevronDown, Search, Menu, X } from "lucide-react";

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
      "Подключение объектов к электросетям",
      "Увеличение мощности и модернизация сетей",
      "Внутренние электромонтажные работы",
      "Наружные электросети и уличное освещение",
      "Монтаж электрощитов и ВРУ",
      "Системы заземления и молниезащиты",
      "Автоматизация и учёт электроэнергии",
      "Резервное электроснабжение",
    ],
  },
  {
    key: "lowcurrent",
    label: "Слаботочные системы",
    href: "/services/lowcurrent",
    icon: "/lowcurrent.png",
    items: [
      "СКС и структурированные кабельные сети",
      "Видеонаблюдение (CCTV)",
      "Охранно-пожарная сигнализация",
      "Системы контроля и управления доступом",
      "Домофония и интерком",
      "Серверные, кроссовые и шкафы",
      "ЛВС и активное сетевое оборудование",
      "Системы оповещения и звука",
    ],
  },
  {
    key: "ventilation",
    label: "Климат-системы",
    href: "/services/ventilation",
    icon: "/climat.png",
    items: [
      "Проектирование и монтаж вентиляции",
      "Системы кондиционирования (VRF/VRV)",
      "Чиллер-фанкойл системы",
      "Системы отопления и теплоснабжения",
      "Автоматика ОВиК",
      "Паспортизация и балансировка систем",
      "Воздуховоды, шумоглушение, КИПиА",
      "Сервис и регламентное обслуживание",
    ],
  },
  {
    key: "design",
    label: "Проектирование",
    href: "/services/design",
    icon: "/design.png",
    items: [
      "Проект электроснабжения (ЭОМ)",
      "Проект ОВ и ВК",
      "Проект СС (слаботочные системы)",
      "АСУ ТП и разделы автоматики",
      "Молниезащита и заземление",
      "Сметная документация",
      "Авторский надзор",
      "Согласования в сетевых организациях",
    ],
  },
  {
    key: "construction",
    label: "Общестрой",
    href: "/services/construction",
    icon: "/construction.png",
    items: [
      "Общестроительные и отделочные работы",
      "Монолитные и бетонные работы",
      "Фундамент и земляные работы",
      "Кровля и фасад",
      "Внутренние перегородки и проёмы",
      "Усиление конструкций",
      "Генподряд и технадзор",
      "Пуско-наладка инженерных систем",
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
function SearchField({ className = "" }) {
  return (
    <label className={`flex h-[42px] items-center gap-2 rounded-lg bg-field px-4 ${className}`}>
      <Search size={18} className="shrink-0 text-neutral-500" />
      <input
        type="text"
        placeholder="Поиск"
        aria-label="Поиск"
        className="w-full min-w-0 bg-transparent text-sm leading-[28px] text-ink outline-none placeholder:text-neutral-500"
      />
    </label>
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
        className="inline-flex h-[42px] items-center rounded-lg border border-dark px-4 text-sm font-semibold leading-[28px] text-ink transition-colors hover:bg-dark hover:text-white"
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
          className="absolute right-0 top-[calc(100%+10px)] z-[80] w-44 rounded-2xl bg-dark p-3 text-sm font-light text-white shadow-2xl"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <div className="px-2 pb-3 pt-2">
            <div className="mb-1 opacity-70">В аккаунте</div>
            <div className="truncate font-normal" title={user?.name || user?.email || "Пользователь"}>
              {user?.name || user?.email || "Пользователь"}
            </div>
          </div>
          <div className="my-1.5 h-px bg-white/15" />
          <a href="/account" className="block rounded-lg px-2 py-2.5 hover:bg-white/10">Профиль</a>
          <a href="/collections" className="block rounded-lg px-2 py-2.5 opacity-85 hover:bg-white/10">Коллекции</a>
          <a href="/notifications" className="block rounded-lg px-2 py-2.5 opacity-85 hover:bg-white/10">Уведомления</a>
          <div className="my-2.5 h-px bg-white/15" />
          <a href="/dashboard" className="block rounded-lg px-2 py-2.5 hover:bg-white/10">Панель</a>
          <div className="my-2.5 h-px bg-white/15" />
          <button type="button" onClick={onLogout} className="w-full rounded-lg px-2 py-2.5 text-left font-normal hover:bg-white/10">
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
  React.useEffect(() => {
    if (!servicesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [servicesOpen]);

  const cat = SERVICE_CATEGORIES[activeCat];

  return (
    <header className="relative z-50 pt-3 font-tight">
      {/* тёмный фон вокруг карточки (только при открытой панели) */}
      {servicesOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setServicesOpen(false)} />
      )}

      {/* КАРТОЧКА: шапка + раскрытый список — единый блок, поэтому ничего не сдвигается */}
      <div
        className={`relative z-50 mx-auto max-w-[1700px] bg-page px-6 lg:px-10 ${
          servicesOpen ? "rounded-2xl shadow-2xl" : ""
        }`}
      >
        {/* строка шапки */}
        <div className="flex h-header items-center gap-5">
          {/* Логотип */}
          <a href="/" className="relative -top-1 mr-4 shrink-0 text-[30px] font-bold leading-none text-ink">
            c.
          </a>

          {/* Навигация (desktop) */}
          <nav className="hidden items-center gap-6 lg:flex">
            <button
              type="button"
              onClick={() => setServicesOpen((v) => !v)}
              aria-expanded={servicesOpen}
              className={`flex items-center gap-1 ${NAV_LINK_CLASS}`}
            >
              Услуги
              <ChevronDown size={16} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            {NAV_LINKS.map((l) => (
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

          {/* Поиск (растягивается) */}
          <div className="hidden flex-1 md:flex">
            <SearchField className="w-full max-w-[980px]" />
          </div>

          {/* Действия (desktop) */}
          <div className="ml-auto hidden items-center gap-4 md:flex">
            <AuthControls user={user} authReady={authReady} onLogout={handleLogout} />
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

        {/* Раскрытый список услуг (внутри той же карточки) */}
        {servicesOpen && (
          <div className="mt-1 grid gap-x-8 gap-y-1 border-t border-black/5 pb-6 pt-4 md:grid-cols-[260px_1fr]">
            {/* категории */}
            <ul className="flex flex-col gap-1">
              {SERVICE_CATEGORIES.map((c, i) => (
                <li key={c.key}>
                  <a
                    href={c.href}
                    onMouseEnter={() => setActiveCat(i)}
                    onFocus={() => setActiveCat(i)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm leading-[28px] transition-colors ${
                      activeCat === i ? "bg-white font-medium ring-1 ring-black/5" : "text-ink hover:bg-white"
                    }`}
                  >
                    <img src={c.icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
                    <span>{c.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* услуги активной категории — в один столбец */}
            <ul className="flex flex-col gap-1">
              {cat.items.map((it) => (
                <li key={it}>
                  <a
                    href={cat.href}
                    onClick={() => setServicesOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm leading-[28px] text-ink transition-colors hover:bg-white"
                  >
                    {it}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
