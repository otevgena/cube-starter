import React from "react";
import { ChevronDown, Search } from "lucide-react";

/** Хедер + MegaPanel "Услуги" */
export default function Header() {
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [activeLeft, setActiveLeft] = React.useState(0);   // слева: активный пункт
  const [activeRight, setActiveRight] = React.useState(0); // справа: активная строка

  // === РУЧКИ (строго по ТЗ) ===
  const VARS = {
    "--header-height": "54px",
    "--header-sticky-top": "0px",
    "--header-stack-offset-x": "0px",
    "--header-stack-offset-y": "0px",

    "--logo-offset-x": "0px",
    "--logo-offset-y": "0px",

    "--actions-offset-x": "0px",
    "--actions-offset-y": "0px",

    "--header-search-height": "42px",
    "--header-search-max": "554.508px",

    // Панель
    "--panel-left-extra": "74px",
    "--panel-right-gap": "-10px",
    "--panel-top-shift": "-65px",
    "--panel-bottom-gap": "0px",

    // Поиск в панели
    "--panel-search-max": "var(--header-search-max)",
    "--panel-search-left": "0px",
    "--panel-search-right": "0px",
  };

  /* Dev-хуки */
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
      const params = new URLSearchParams(window.location.search);
      const byQuery = params.get("open") === "services";
      const byHash = (window.location.hash || "").includes("open-services");
      if (byQuery || byHash) setServicesOpen(true);
    } catch {}
  }, []);

  React.useEffect(() => {
    if (!servicesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [servicesOpen]);

  // Содержимое вкладок справа — для каждой левой категории свой список
  const dataRightByLeft = {
    0: [ // Электромонтаж
      "Подключение объектов к электросетям|",
      "Увеличение мощности и модернизация сетей|",
      "Внутренние электромонтажные работы|",
      "Наружные электросети и уличное освещение|",
      "Монтаж электрощитов и ВРУ|",
      "Системы заземления и молниезащиты|",
      "Автоматизация и учёт электроэнергии|",
      "Резервное электроснабжение|",
    ],
    1: [ // Слаботочные сис.
      "СКС и структурированные кабельные сети|",
      "Видеонаблюдение (CCTV)|",
      "Охранно-пожарная сигнализация|",
      "Системы контроля и управления доступом|",
      "Домофония и интерком|",
      "Серверные, кроссовые и шкафы|",
      "ЛВС и активное сетевое оборудование|",
      "Системы оповещения и звука|",
    ],
    2: [ // Климат системы
      "Проектирование и монтаж вентиляции|",
      "Системы кондиционирования (VRF/VRV)|",
      "Чиллер-фанкойл системы|",
      "Системы отопления и теплоснабжения|",
      "Автоматика ОВиК|",
      "Паспортизация и балансировка систем|",
      "Воздуховоды, шумоглушение, КИПиА|",
      "Сервис и регламентное обслуживание|",
    ],
    3: [ // Проектирование
      "Проект электроснабжения (ЭОМ)|",
      "Проект ОВ и ВК|",
      "Проект СС (слаботочные системы)|",
      "АСУ ТП и разделы автоматики|",
      "Молниезащита и заземление|",
      "Сметная документация|",
      "Авторский надзор|",
      "Согласования в сетевых организациях|",
    ],
    4: [ // Общестрой
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

  // при переключении левой вкладки — сбрасываем активную строку справа
  React.useEffect(() => { setActiveRight(0); }, [activeLeft]);

  const leftItems = [
    { img: "/electricity.png", label: "Электромонтаж" },
    { img: "/lowcurrent.png",   label: "Слаботочные сис." },
    { img: "/climat.png",       label: "Климат системы" },
    { img: "/design.png",       label: "Проектирование" },
    { img: "/construction.png", label: "Общестрой" },
  ];

  const rightRows = dataRightByLeft[activeLeft];

  return (
    <header
      className="sticky z-50"
      style={{
        top: "var(--header-sticky-top)",
        background: "linear-gradient(to right,#e9e9e9 0%,#e9e9e9 100%)",
        ...VARS,
      }}
    >
      <div className="container-header" style={{ height: "var(--header-height)" }}>
        <div
          className="header-row flex items-center gap-4"
          style={{
            display: servicesOpen ? "none" : undefined,
            transform: "translate(var(--header-stack-offset-x), var(--header-stack-offset-y))",
            borderRadius: 8,
          }}
        >
          {/* ЛОГО "c." */}
          <div className="logo-wrap" style={{ transform: "translate(var(--logo-offset-x), var(--logo-offset-y))" }}>
            <a href="/" className="flex items-center gap-2">
              <span className="logo-c">c.</span>
            </a>
          </div>

          {/* Навигация */}
          <nav className="hidden lg:flex items-center gap-6">
            <a
              href="#services"
              className="nav-link"
              onClick={(e) => { e.preventDefault(); setServicesOpen((v) => !v); }}
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
                borderRadius: "8px 0 0 8px",
              }}
            >
              <Search size={18} className="text-[#4a4a4a]" />
              <input
                type="text"
                className="search-input"
                style={{ fontWeight: 300, color: "#222222", letterSpacing: "normal" }}
                placeholder="Поиск"
                aria-label="Поиск"
              />
            </div>
          </div>

          {/* Правый блок */}
          <div className="ml-auto hidden md:flex items-center gap-4">
            <a href="/login" className="nav-link"><span className="text-grad-222">Вход</span></a>
            <a href="/register" className="nav-link"><span className="text-grad-222">Регистрация</span></a>
            <div className="actions-right flex items-center gap-4" style={{ transform: "translate(var(--actions-offset-x), var(--actions-offset-y))" }}>
              <a href="/pro" className="btn-pro">Be Pro</a>
              <a href="/submit" className="btn-submit">Submit Website</a>
            </div>
          </div>

          {/* Мобилка */}
          <div className="ml-auto flex md:hidden items-center gap-2">
            <a href="/pro" className="btn-pro" style={{ height: "var(--header-search-height)" }}>Be Pro</a>
          </div>
        </div>
      </div>

      {/* ======= ПАНЕЛЬ ======= */}
      {servicesOpen && (
        <>
          <div
            className="services-overlay fixed inset-x-0 bottom-0 z-[60]"
            style={{ top: "var(--header-height)" }}
            onClick={() => setServicesOpen(false)}
          />

          <div className="fixed inset-x-0 z-[61]" style={{ top: "var(--header-height)" }}>
            <div className="container-header">
              <div
                className="services-panel services-panel--extend-left"
                style={{
                  width: "calc(100% - var(--panel-right-gap))",
                  marginTop: "var(--panel-top-shift)",
                  marginBottom: "var(--panel-bottom-gap)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Верх панели */}
                <div className="panel-bar flex items-center justify-between mb-3">
                  <div className="panel-bar-left flex items-center gap-2">
                    <a href="/" className="flex items-center gap-2">
                      <span className="logo-c">c.</span>
                    </a>
                  </div>
                  <div className="panel-bar-right flex items-center gap-4">
                    <a href="/login" className="nav-link"><span className="text-grad-222">Вход</span></a>
                    <a href="/register" className="nav-link"><span className="text-grad-222">Регистрация</span></a>
                    <a href="/pro" className="btn-pro" style={{ height: "var(--diamond)" }}>Be Pro</a>
                    <a href="/submit" className="btn-submit" style={{ height: "var(--diamond)" }}>Submit Website</a>
                  </div>
                </div>

                {/* Поиск (в панели) */}
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
                    <div className="search-wrap search-wrap--white" style={{ height: "var(--header-search-height)" }}>
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
                    {leftItems.map((it, i)=>(
                      <a
                        key={it.label}
                        className={`svc-left-item ${activeLeft===i ? "is-active" : ""}`}
                        onClick={()=>setActiveLeft(i)}
                        role="button" tabIndex={0}
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
                    {rightRows.map((row, i)=>{
                      const [label, num=""] = row.split("|");
                      return (
                        <div
                          key={`${activeLeft}-${label}`}
                          className={`svc-row ${activeRight===i ? "is-active" : ""}`}
                          onClick={()=>setActiveRight(i)}
                          role="button" tabIndex={0}
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
