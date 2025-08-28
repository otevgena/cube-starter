// src/components/layout/Header.jsx
import React from "react";
import { ChevronDown, Search } from "lucide-react";

export default function Header() {
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [activeLeft, setActiveLeft] = React.useState(0);
  const [activeRight, setActiveRight] = React.useState(0);

  // узлы для «телепорта» правого блока и логотипа
  const actionsNodeRef = React.useRef(null);
  const actionsHomeRef = React.useRef(null);
  const panelActionsRef = React.useRef(null);

  const logoNodeRef = React.useRef(null);
  const logoHomeRef = React.useRef(null);
  const panelLogoRef = React.useRef(null);

  // ширина плейсхолдера под логотип, чтобы меню не прыгало
  const [logoPlaceholderW, setLogoPlaceholderW] = React.useState(0);

  const VARS = {
    "--header-height": "64px",
    "--header-search-height": "42px",
    "--header-search-max": "560px",

    // Панель
    "--panel-right-gap": "0px",
    "--panel-top-shift": "0px",
    "--panel-bottom-gap": "0px",
    "--panel-left-extra": "0px",

    // Поиск в панели
    "--panel-search-max": "var(--header-search-max)",
    "--panel-search-left": "0px",
    "--panel-search-right": "0px",
  };

  // хоткеи
  React.useEffect(() => {
    const onKey = (e) => {
      const key = (e.key || "").toLowerCase();
      if (e.altKey && key === "s") { e.preventDefault(); setServicesOpen(v => !v); }
      if (key === "escape") setServicesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // хелперы
  React.useEffect(() => {
    window.openServicesPanel   = () => setServicesOpen(true);
    window.closeServicesPanel  = () => setServicesOpen(false);
    window.toggleServicesPanel = () => setServicesOpen(v => !v);
    return () => {
      delete window.openServicesPanel;
      delete window.closeServicesPanel;
      delete window.toggleServicesPanel;
    };
  }, []);

  // открыть по query/hash
  React.useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("open") === "services" || (window.location.hash || "").includes("open-services")) {
        setServicesOpen(true);
      }
    } catch {}
  }, []);

  // блокируем скролл под оверлеем
  React.useEffect(() => {
    if (!servicesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [servicesOpen]);

  // «телепорт» правого блока и логотипа (+ плейсхолдер под логотип)
  React.useEffect(() => {
    const aNode  = actionsNodeRef.current;
    const aHome  = actionsHomeRef.current;
    const aPanel = panelActionsRef.current;

    const lNode  = logoNodeRef.current;
    const lHome  = logoHomeRef.current;
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

  // данные панели
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
    { img: "/electricity.png",   label: "Электромонтаж" },
    { img: "/lowcurrent.png",    label: "Слаботочные сис." },
    { img: "/climat.png",        label: "Климат системы" },
    { img: "/design.png",        label: "Проектирование" },
    { img: "/construction.png",  label: "Общестрой" },
  ];
  const rightRows = dataRightByLeft[activeLeft];

  return (
    <header
      id="site-header-static"
      className="z-50"
      style={{ position: "relative", background: "transparent", ...VARS }}
    >
      {/* шапка всегда в DOM */}
      <div className="container-header" style={{ height: "var(--header-height)" }}>
        <div className="header-row flex items-center gap-4">
          {/* ЛОГО — переносимое ядро */}
          <div className="logo-wrap" ref={logoHomeRef} style={{ display: "flex", alignItems: "center" }}>
            {/* плейсхолдер сохраняет ширину места под логотип, пока он «в панели» */}
            {servicesOpen && <div style={{ width: `${logoPlaceholderW || 24}px`, height: 1 }} />}
            <div
              ref={logoNodeRef}
              // СМЕЩЕНИЕ ЛОГОТИПА: только при открытой панели уводим на 90px влево
              style={{
                transform: servicesOpen ? "translateX(-90px)" : "none",
                transition: "transform .22s ease",
              }}
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

          {/* Поиск в шапке */}
          <div className="flex-1 hidden md:flex justify-center">
            <div
              className="search-wrap w-full"
              style={{
                maxWidth: "var(--header-search-max)",
                height: "var(--header-search-height)",
                borderRadius: 10,
              }}
            >
              <Search size={18} className="text-[#4a4a4a]" />
              <input
                type="text"
                className="search-input"
                placeholder="Поиск"
                aria-label="Поиск"
              />
            </div>
          </div>

          {/* ПЕРЕНОСИМЫЙ правый блок */}
          <div className="ml-auto hidden md:flex items-center gap-4" ref={actionsHomeRef}>
            <div ref={actionsNodeRef} className="flex items-center gap-4">
              <a href="/login" className="nav-link"><span className="text-grad-222">Вход</span></a>
              <a href="/register" className="nav-link"><span className="text-grad-222">Регистрация</span></a>
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

      {/* ====== слой панели ====== */}
      {servicesOpen && (
        <>
          {/* затемнение всего фона */}
          <div
            className="services-overlay"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "linear-gradient(to right,#454545 0%,#454545 100%)",
            }}
            onClick={() => setServicesOpen(false)}
          />

          {/* панель: поднята на 57px, с гаттерами 52px */}
          <div
            className="services-layer"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% - 57px)",
              zIndex: 61,
            }}
            onClick={() => setServicesOpen(false)}
          >
            <div
              className="panel-gutter"
              style={{ padding: "0 52px", boxSizing: "border-box", width: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="services-panel services-panel--extend-left"
                style={{
                  position: "relative",
                  left: "0",
                  top: "0",
                  transform: "none",
                  width: "100%",
                  marginTop: "var(--panel-top-shift)",
                  marginBottom: "var(--panel-bottom-gap)",
                }}
              >
                {/* Верх панели: сюда «приезжают» логотип и правые кнопки */}
                <div className="panel-bar flex items-center justify-between mb-3">
                  <div className="panel-bar-left flex items-center gap-2" ref={panelLogoRef} />
                  <div className="panel-bar-right flex items-center gap-4" ref={panelActionsRef} />
                </div>

                {/* Поиск в панели — короче на 16px справа (только тут) */}
                <div className="services-top">
                  <div
                    className="services-search-holder"
                    style={{
                      maxWidth: "var(--panel-search-max)",
                      marginLeft: "var(--panel-search-left)",
                      marginRight: "var(--panel-search-right)",
                      width: "100%",
                    }}
                  >
                    <div
                      className="search-wrap search-wrap--white"
                      style={{
                        height: "var(--header-search-height)",
                        borderRadius: 10,
                        clipPath: "inset(0 16px 0 0 round 10px)", // уменьшаем справа на 16px
                      }}
                    >
                      <Search size={18} className="text-[#4a4a4a]" />
                      <input
                        type="text"
                        className="search-input search-input--dark"
                        placeholder="Поиск"
                        aria-label="Поиск"
                      />
                    </div>
                  </div>
                </div>

                {/* Тело панели */}
                <div className="services-body">
                  {/* ЛЕВАЯ */}
                  <div className="svc-left">
                    {leftItems.map((it, i) => (
                      <a
                        key={it.label}
                        className={`svc-left-item ${activeLeft === i ? "is-active" : ""}`}
                        onClick={() => setActiveLeft(i)}
                        role="button"
                        tabIndex={0}
                      >
                        <img
                          src={it.img}
                          alt=""
                          width={16}
                          height={16}
                          className="svc-ico-img"
                          loading="eager"
                        />
                        <span>{it.label}</span>
                      </a>
                    ))}
                  </div>

                  {/* ПРАВАЯ */}
                  <div className="svc-right">
                    {rightRows.map((row, i) => {
                      const [label, num = ""] = row.split("|");
                      return (
                        <div
                          key={`${activeLeft}-${label}`}
                          className={`svc-row ${activeRight === i ? "is-active" : ""}`}
                          onClick={() => setActiveRight(i)}
                          role="button"
                          tabIndex={0}
                        >
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
