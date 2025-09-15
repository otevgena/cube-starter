// src/components/layout/Header.jsx
import React from "react";
import { ChevronDown, Search } from "lucide-react";

/* === API base === */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "https://api.cube-tech.ru";
const api = (p) => `${API_BASE}${p}`;

/* ---- non-blocking refresh with timeout ---- */
async function apiRefresh(timeoutMs = 1200) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(api("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      // без body и без Content-Type!
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

/* ===== Аватар + меню (с «мостиком» наведений) ===== */
function AvatarMenu({ user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const closeT = React.useRef(null);
  const CLOSE_DELAY = 200; // мс — мягкое закрытие

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
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <img
        src="/profile/profile.png"
        alt={user?.name || user?.email || "Profile"}
        width={32}
        height={32}
        style={{
          display: "block",
          width: 32,
          height: 32,
          borderRadius: "50%",
          objectFit: "cover",
          cursor: "pointer",
        }}
      />

      {/* Прозрачная «перемычка» — перекрывает зазор между аватаркой и меню */}
      {open && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            height: 10,           // тот самый зазор
            width: 180,           // чуть шире меню, чтобы поймать курсор
            zIndex: 79,
            background: "transparent",
          }}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        />
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 137,
            minHeight: 307,
            background: "#111",
            color: "#fff",
            borderRadius: 14,
            padding: 12,
            boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
            zIndex: 80,
            fontWeight: 300,
            fontSize: 14,
          }}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <div style={{ padding: "8px 8px 12px 8px" }}>
            <div style={{ opacity: 0.7, marginBottom: 4 }}>В аккаунте</div>
            <div
              style={{
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={user?.name || user?.email || "Пользователь"}
            >
              {user?.name || user?.email || "Пользователь"}
            </div>
          </div>

          <div style={{ height: 1, background: "#2a2a2a", margin: "6px 0" }} />

          <a
            href="/account"
            style={{
              padding: "10px 8px",
              borderRadius: 8,
              display: "block",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Профиль
          </a>
          <a
            href="/collections"
            style={{
              padding: "10px 8px",
              borderRadius: 8,
              display: "block",
              color: "#fff",
              textDecoration: "none",
              opacity: 0.85,
            }}
          >
            Коллекции
          </a>
          <a
            href="/notifications"
            style={{
              padding: "10px 8px",
              borderRadius: 8,
              display: "block",
              color: "#fff",
              textDecoration: "none",
              opacity: 0.85,
            }}
          >
            Уведомления
          </a>

          <div style={{ height: 1, background: "#2a2a2a", margin: "10px 0" }} />

          <a
            href="/dashboard"
            style={{
              padding: "10px 8px",
              borderRadius: 8,
              display: "block",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Панель
          </a>

          <div style={{ height: 1, background: "#2a2a2a", margin: "10px 0" }} />

          <button
            type="button"
            onClick={onLogout}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 8px",
              borderRadius: 8,
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 400,
            }}
          >
            Выход
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [activeLeft, setActiveLeft] = React.useState(0);
  const [activeRight, setActiveRight] = React.useState(0);

  // === auth state ===
  const [user, setUser] = React.useState(null);
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
          const t = await apiRefresh(1200);
          if (t) {
            accessRef.current = t;
            try { sessionStorage.setItem("auth:accessToken", t); } catch {}
          }
        }

        if (accessRef.current) {
          const u = await apiMe(accessRef.current);
          if (u) setUser(u);
          else {
            const t2 = await apiRefresh(1200);
            if (t2) {
              accessRef.current = t2;
              try { sessionStorage.setItem("auth:accessToken", t2); } catch {}
              const u2 = await apiMe(t2);
              if (u2) setUser(u2);
            }
          }
        }
      } catch {}
    };

    const start = () => bootstrap();
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(start, { timeout: 500 });
    } else {
      setTimeout(start, 0);
    }

    const onFocus = async () => {
      if (user) return;
      const t = await apiRefresh(800);
      if (t) {
        accessRef.current = t;
        try { sessionStorage.setItem("auth:accessToken", t); } catch {}
        const u = await apiMe(t);
        if (u) setUser(u);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []); // eslint-disable-line

  // внешнее событие из модалок — мгновенно перерисовываем хедер
  React.useEffect(() => {
    const onAuth = (e) => {
      const newUser = e?.detail?.user || null;
      const newToken = e?.detail?.accessToken || null;
      if (newToken) {
        accessRef.current = newToken;
        try { sessionStorage.setItem("auth:accessToken", newToken); } catch {}
      }
      setUser(newUser);
      if (!newUser) {
        try { sessionStorage.removeItem("auth:accessToken"); } catch {}
        accessRef.current = null;
      }
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
    accessRef.current = null;
    try { sessionStorage.removeItem("auth:accessToken"); } catch {}
  }

  // ==== UI перемещения/панели ====
  const actionsNodeRef = React.useRef(null);
  const actionsHomeRef = React.useRef(null);
  const panelActionsRef = React.useRef(null);
  const logoNodeRef = React.useRef(null);
  const logoHomeRef = React.useRef(null);
  const panelLogoRef = React.useRef(null);
  const [logoPlaceholderW, setLogoPlaceholderW] = React.useState(0);

  const VARS = {
    "--header-height": "64px",
    "--header-search-height": "42px",
    "--header-search-max": "560px",
    "--panel-right-gap": "0px",
    "--panel-top-shift": "0px",
    "--panel-bottom-gap": "0px",
    "--panel-left-extra": "0px",
    "--panel-search-max": "var(--header-search-max)",
    "--panel-search-left": "0px",
    "--panel-search-right": "0px",
  };

  React.useEffect(() => {
    const onKey = (e) => {
      const key = (e.key || "").toLowerCase();
      if (e.altKey && key === "s") { e.preventDefault(); setServicesOpen(v => !v); }
      if (key === "escape") setServicesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    window.openServicesPanel = () => setServicesOpen(true);
    window.closeServicesPanel = () => setServicesOpen(false);
    window.toggleServicesPanel = () => setServicesOpen(v => !v);
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

  React.useEffect(() => {
    if (!servicesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [servicesOpen]);

  React.useEffect(() => {
    const aNode = actionsNodeRef.current;
    const aHome = actionsHomeRef.current;
    const aPanel = panelActionsRef.current;
    const lNode = logoNodeRef.current;
    const lHome = logoHomeRef.current;
    const lPanel = panelLogoRef.current;
    if (servicesOpen) {
      if (lNode) {
        const w = lNode.getBoundingClientRect().width;
        setLogoPlaceholderW(Math.ceil(w));
      }
      if (aNode && aPanel) aPanel.appendChild(aNode);
      if (lNode && lPanel) lPanel.appendChild(lNode);
    } else {
      if (aNode && aHome) aHome.appendChild(aNode);
      if (lNode && lHome) lHome.appendChild(lNode);
      setLogoPlaceholderW(0);
    }
  }, [servicesOpen]);

  const dataRightByLeft = {
    0: [
      "Подключение объектов к электросетям|",
      "Увеличение мощности и модернизация сетей|",
      "Внутренние электромонтажные работы|",
      "Наружные электросети и уличное освещение|",
      "Монтаж электрощитов и ВРУ|",
      "Системы заземления и молниезащиты|",
      "Автоматизация и учёт электроэнергии|",
      "Резервное электроснабжение|",
    ],
    1: [
      "СКС и структурированные кабельные сети|",
      "Видеонаблюдение (CCTV)|",
      "Охранно-пожарная сигнализация|",
      "Системы контроля и управления доступом|",
      "Домофония и интерком|",
      "Серверные, кроссовые и шкафы|",
      "ЛВС и активное сетевое оборудование|",
      "Системы оповещения и звука|",
    ],
    2: [
      "Проектирование и монтаж вентиляции|",
      "Системы кондиционирования (VRF/VRV)|",
      "Чиллер-фанкойл системы|",
      "Системы отопления и теплоснабжения|",
      "Автоматика ОВиК|",
      "Паспортизация и балансировка систем|",
      "Воздуховоды, шумоглушение, КИПиА|",
      "Сервис и регламентное обслуживание|",
    ],
    3: [
      "Проект электроснабжения (ЭОМ)|",
      "Проект ОВ и ВК|",
      "Проект СС (слаботочные системы)|",
      "АСУ ТП и разделы автоматики|",
      "Молниезащита и заземление|",
      "Сметная документация|",
      "Авторский надзор|",
      "Согласования в сетевых организациях|",
    ],
    4: [
      "Общестроительные и отделочные работы|",
      "Монолитные и бетонные работы|",
      "Фундамент и земляные работы|",
      "Кровля и фасад|",
      "Внутренние перегородки и проёмы|",
      "Усиление конструкций|",
      "Генподряд и технадзор|",
      "Пуско-наладка инженерных систем|",
    ],
  };
  React.useEffect(() => { setActiveRight(0); }, [activeLeft]);

  const leftItems = [
    { img: "/electricity.png", label: "Электромонтаж" },
    { img: "/lowcurrent.png", label: "Слаботочные сис." },
    { img: "/climat.png", label: "Климат системы" },
    { img: "/design.png", label: "Проектирование" },
    { img: "/construction.png", label: "Общестрой" },
  ];
  const rightRows = dataRightByLeft[activeLeft];

  const HEADER_SEARCH_BG = "#f8f8f8";

  return (
    <header id="site-header-static" className="z-50" style={{ position: "relative", background: "transparent", ...VARS }}>
      <div className="container-header" style={{ height: "var(--header-height)" }}>
        <div className="header-row flex items-center gap-4">
          {/* ЛОГО */}
          <div className="logo-wrap" ref={logoHomeRef} style={{ display: "flex", alignItems: "center" }}>
            {servicesOpen && <div style={{ width: (logoPlaceholderW || 24), height: 1 }} />}
            <div
              ref={logoNodeRef}
              style={{ transform: servicesOpen ? "translateX(-90px)" : "none", transition: "transform .22s ease" }}
            >
              <a href="/" className="flex items-center gap-2">
                <span className="logo-c">c.</span>
              </a>
            </div>
          </div>

          {/* Навигация */}
          <nav className="hidden lg:flex items-center gap-6">
            <a
              href="#services"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); setServicesOpen(v => !v); }}
            >
              <span className="text-grad-452f2d">Услуги</span>
              <ChevronDown size={16} className="text-[#452f2d]" />
            </a>
            <a href="#about" className="nav-link"><span className="text-grad-452f2d">О нас</span></a>
            <a href="#projects" className="nav-link">
              <span className="text-grad-452f2d">Проекты</span>
              <span className="badge-new">New</span>
            </a>
            <a href="#contact" className="nav-link"><span className="text-grad-452f2d">Контакты</span></a>
            <a href="#reviews" className="nav-link"><span className="text-grad-452f2d">Отзывы</span></a>
          </nav>

          {/* Поиск */}
          <div className="flex-1 hidden md:flex justify-center">
            <div className="search-wrap w-full" style={{ maxWidth: "var(--header-search-max)", height: "var(--header-search-height)", borderRadius: 10, background: HEADER_SEARCH_BG }}>
              <Search size={18} className="text-[#4a4a4a]" />
              <input type="text" className="search-input" placeholder="Поиск" aria-label="Поиск" style={{ background: "transparent" }} />
            </div>
          </div>

          {/* Правый блок */}
          <div className="ml-auto hidden md:flex items-center gap-4" ref={actionsHomeRef}>
            <div ref={actionsNodeRef} className="flex items-center gap-4">
              {/* слева — auth: либо Вход/Регистрация, либо аватар */}
              {!user ? (
                <>
                  <a
                    href="/login"
                    className="nav-link"
                    onClick={(e) => { e.preventDefault(); window.openModal && window.openModal("login"); }}
                  >
                    <span className="text-grad-222">Вход</span>
                  </a>
                  <a
                    href="/register"
                    className="nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      if (typeof window.openModal === "function") {
                        window.openModal("register", { email: "" });
                      } else {
                        window.location.href = "/register";
                      }
                    }}
                  >
                    <span className="text-grad-222">Регистрация</span>
                  </a>
                </>
              ) : (
                <AvatarMenu user={user} onLogout={handleLogout} />
              )}

              {/* справа — действия ВСЕГДА видны */}
              <div className="actions-right flex items-center gap-4">
                <a href="/pro" className="btn-pro">Ищу работу</a>
                <a href="/submit" className="btn-submit">Оставить заявку</a>
              </div>
            </div>
          </div>

          {/* Мобилка */}
          <div className="ml-auto flex md:hidden items-center gap-2">
            <a href="/pro" className="btn-pro" style={{ height: "var(--header-search-height)" }}>Ищу работу</a>
          </div>
        </div>
      </div>

      {/* ===== слой панели ===== */}
      {servicesOpen && (
        <>
          <div
            className="services-overlay"
            style={{ position: "fixed", inset: 0, zIndex: 60, background: "linear-gradient(to right,#454545 0%,#454545 100%)" }}
            onClick={() => setServicesOpen(false)}
          />
          <div className="services-layer" style={{ position: "absolute", left: 0, right: 0, top: "calc(100% - 57px)", zIndex: 61 }} onClick={() => setServicesOpen(false)}>
            <div className="panel-gutter" style={{ padding: "0 52px", boxSizing: "border-box", width: "100%" }} onClick={(e) => e.stopPropagation()}>
              <div className="services-panel services-panel--extend-left" style={{ position: "relative", left: 0, top: 0, transform: "none", width: "100%", marginTop: "var(--panel-top-shift)", marginBottom: "var(--panel-bottom-gap)" }}>
                <div className="panel-bar flex items-center justify-between mb-3">
                  <div className="panel-bar-left flex items-center gap-2" ref={panelLogoRef} />
                  <div className="panel-bar-right flex items-center gap-4" ref={panelActionsRef} />
                </div>
                <div className="services-top">
                  <div className="services-search-holder" style={{ maxWidth: "var(--panel-search-max)", marginLeft: "var(--panel-search-left)", marginRight: "var(--panel-search-right)", width: "100%" }}>
                    <div className="search-wrap search-wrap--white" style={{ height: "var(--header-search-height)", borderRadius: 10, clipPath: "inset(0 16px 0 0 round 10px)" }}>
                      <Search size={18} className="text-[#4a4a4a]" />
                      <input type="text" className="search-input search-input--dark" placeholder="Поиск" aria-label="Поиск" style={{ background: "transparent" }} />
                    </div>
                  </div>
                </div>
                <div className="services-body">
                  <div className="svc-left">
                    {[
                      { img: "/electricity.png", label: "Электромонтаж" },
                      { img: "/lowcurrent.png", label: "Слаботочные сис." },
                      { img: "/climat.png", label: "Климат системы" },
                      { img: "/design.png", label: "Проектирование" },
                      { img: "/construction.png", label: "Общестрой" },
                    ].map((it, i) => (
                      <a key={it.label} className={`svc-left-item ${activeLeft === i ? "is-active" : ""}`} onClick={() => setActiveLeft(i)} role="button" tabIndex={0}>
                        <img src={it.img} alt="" width={16} height={16} className="svc-ico-img" loading="eager" />
                        <span>{it.label}</span>
                      </a>
                    ))}
                  </div>
                  <div className="svc-right">
                    {(
                      {
                        0: [
                          "Подключение объектов к электросетям|",
                          "Увеличение мощности и модернизация сетей|",
                          "Внутренние электромонтажные работы|",
                          "Наружные электросети и уличное освещение|",
                          "Монтаж электрощитов и ВРУ|",
                          "Системы заземления и молниезащиты|",
                          "Автоматизация и учёт электроэнергии|",
                          "Резервное электроснабжение|",
                        ],
                        1: [
                          "СКС и структурированные кабельные сети|",
                          "Видеонаблюдение (CCTV)|",
                          "Охранно-пожарная сигнализация|",
                          "Системы контроля и управления доступом|",
                          "Домофония и интерком|",
                          "Серверные, кроссовые и шкафы|",
                          "ЛВС и активное сетевое оборудование|",
                          "Системы оповещения и звука|",
                        ],
                        2: [
                          "Проектирование и монтаж вентиляции|",
                          "Системы кондиционирования (VRF/VRV)|",
                          "Чиллер-фанкойл системы|",
                          "Системы отопления и теплоснабжения|",
                          "Автоматика ОВиК|",
                          "Паспортизация и балансировка систем|",
                          "Воздуховоды, шумоглушение, КИПиА|",
                          "Сервис и регламентное обслуживание|",
                        ],
                        3: [
                          "Проект электроснабжения (ЭОМ)|",
                          "Проект ОВ и ВК|",
                          "Проект СС (слаботочные системы)|",
                          "АСУ ТП и разделы автоматики|",
                          "Молниезащита и заземление|",
                          "Сметная документация|",
                          "Авторский надзор|",
                          "Согласования в сетевых организациях|",
                        ],
                        4: [
                          "Общестроительные и отделочные работы|",
                          "Монолитные и бетонные работы|",
                          "Фундамент и земляные работы|",
                          "Кровля и фасад|",
                          "Внутренние перегородки и проёмы|",
                          "Усиление конструкций|",
                          "Генподряд и технадзор|",
                          "Пуско-наладка инженерных систем|",
                        ],
                      }[activeLeft]
                    ).map((row, i) => {
                      const [label, num = ""] = row.split("|");
                      return (
                        <div key={`${activeLeft}-${label}`} className={`svc-row ${activeRight === i ? "is-active" : ""}`} onClick={() => setActiveRight(i)} role="button" tabIndex={0}>
                          <span className="svc-label">{label}</span>
                          <span className="svc-num">{num}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
