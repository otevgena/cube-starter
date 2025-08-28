// src/components/about/About.jsx
import React from "react";

export default function About() {
  const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const [now, setNow] = React.useState(new Date());

  // Нижние блоки
  const [imgHover, setImgHover] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [imgHover2, setImgHover2] = React.useState(false);
  const [expandedProc, setExpandedProc] = React.useState(false);

  // Анимация винта (screw.svg) у «С» в «О НАС»
  const learnMoreRef = React.useRef(null);
  const screwWrapRef = React.useRef(null);
  const [screwMarkup, setScrewMarkup] = React.useState("");
  const [showScrew, setShowScrew] = React.useState(false);

  // Обновление даты раз в сутки
  React.useEffect(() => {
    const t = new Date();
    const msUntilMidnight =
      new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 0, 0, 0) - t;
    const id = setTimeout(() => setNow(new Date()), msUntilMidnight);
    return () => clearTimeout(id);
  }, [now]);

  // Загружаем SVG как текст
  React.useEffect(() => {
    fetch("/about/screw.svg")
      .then((r) => r.text())
      .then((txt) => {
        setScrewMarkup(txt);
        setShowScrew(true);
      })
      .catch(() => setScrewMarkup(""));
  }, []);

  // Функция однократного воспроизведения анимации
  const replayScrew = React.useCallback(() => {
    const holder = screwWrapRef.current;
    if (!holder) return;

    holder.classList.remove("paused");
    const svg = holder.querySelector("svg");

    try {
      if (svg && typeof svg.unpauseAnimations === "function" && typeof svg.setCurrentTime === "function") {
        svg.unpauseAnimations();
        svg.setCurrentTime(0);
      } else {
        const html = screwMarkup;
        holder.innerHTML = "";
        // eslint-disable-next-line no-unused-expressions
        holder.offsetWidth; // reflow
        holder.innerHTML = html;
      }
    } catch {}

    window.clearTimeout(holder.__stopTimer);
    holder.__stopTimer = window.setTimeout(() => {
      try {
        const svgNow = holder.querySelector("svg");
        if (svgNow && typeof svgNow.pauseAnimations === "function") {
          svgNow.pauseAnimations();
        }
      } catch {}
      holder.classList.add("paused");
    }, 2000);
  }, [screwMarkup]);

  // Триггер при скролле
  React.useEffect(() => {
    if (!learnMoreRef.current) return;
    const target = learnMoreRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) replayScrew();
        });
      },
      { threshold: 0.6 }
    );

    io.observe(target);
    return () => io.disconnect();
  }, [replayScrew]);

  const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Клик по текстовой области «Бюрократия» (кроме ссылки «Узнать больше»)
  const handleProcTextClick = (e) => {
    if (e.target.closest && e.target.closest("a")) return; // не дублируем клик по ссылке
    setExpandedProc((v) => !v);
  };

  return (
    <section className="about-hero" aria-label="О нас">
      {/* HEADER поднят на -74px */}
      <div className="about-hero-header" style={{ transform: "translateY(-74px)", willChange: "transform" }}>
        <div className="container-wide">
          {/* Сегодня • [дата] • Загруженность */}
          <div className="about-hero-meta">
            <span className="about-hero-today">Сегодня</span>
            <span className="about-hero-date">{dateStr}</span>
            <span className="about-hero-load">Загруженность <b>7.49</b> из 10</span>
          </div>

          {/* Заголовок */}
          <h1 className="about-hero-title">CUBE-TECH</h1>

          {/* Директор */}
          <div className="about-hero-sign">
            <img src="/about/director.png" alt="" className="about-hero-avatar" />
            <a className="about-hero-role" href="#director">Генеральный директор</a>
            <span className="about-hero-badge" aria-hidden="true">CUBE</span>
          </div>
        </div>

        {/* «Ромб» с изображением */}
        <div className="about-hero-diamond">
          <img src="/about/about.png" alt="О компании" />
        </div>

        {/* === ОБЁРТКА: всё ниже смещено на 30px === */}
        <div className="about-hero-flow" style={{ marginTop: "30px" }}>
          {/* "Обзор" по центру */}
          <div
            className="about-hero-overview"
            style={{
              textAlign: "center",
              fontFamily: "'Inter Tight','Inter',system-ui",
              fontSize: "14px",
              lineHeight: "28px",
              fontWeight: 300,
              color: "#222222",
              margin: 0
            }}
          >
            Обзор
          </div>

          {/* Блок ниже ромба: позиционирование для винта */}
          <div
            ref={learnMoreRef}
            className="about-hero-more"
            onMouseEnter={replayScrew}
            style={{ textAlign: "center", fontFamily: "'Inter Tight','Inter',system-ui", position: "relative" }}
          >
            <h2 className="about-hero-title" style={{ margin: 0, textTransform: "uppercase" }}>
              УЗНАТЬ БОЛЬШЕ
            </h2>

            {/* «О НАС» — кладём винт на «С» */}
            <h2 className="about-hero-title" style={{ margin: 0, textTransform: "uppercase" }}>
              О НА
              <span style={{ position: "relative", display: "inline-block" }}>
                С
                {showScrew && !!screwMarkup && (
                  <>
                    <style>
                      {`
                        .screw-wrap.paused svg * { animation-play-state: paused !important; }
                        .screw-wrap svg { width: 60px !important; height: 60px !important; }
                      `}
                    </style>
                    <span
                      ref={screwWrapRef}
                      className="screw-wrap"
                      style={{
                        position: "absolute",
                        left: "calc(50% + 33px)",
                        top: "calc(100% - 74px)",
                        transform: "translate(-50%, -8%)",
                        width: "60px",
                        height: "60px",
                        pointerEvents: "none",
                        userSelect: "none",
                        display: "block",
                      }}
                      dangerouslySetInnerHTML={{ __html: screwMarkup }}
                    />
                  </>
                )}
              </span>
            </h2>

            <p
              className="about-hero-more-sub"
              style={{
                marginTop: "15px",
                fontSize: "20.9859px",
                lineHeight: "28px",
                fontWeight: 300,
                color: "#222222",
              }}
            >
              Наши проекты, опыт, решения.
            </p>
          </div>

          {/* Доп. изображение */}
          <div className="about-hero-more-image" style={{ marginTop: "82px" }}>
            <img
              src="/about/about1.png"
              alt="Дополнительное изображение о компании"
              style={{
                display: "block",
                marginLeft: "80px",
                height: "auto",
                borderRadius: "14px",
              }}
              loading="lazy"
            />
          </div>

          {/* Текстовый блок под изображением */}
          <div
            className="about-hero-desc"
            style={{
              marginTop: "220px",
              marginLeft: "80px",
              fontFamily: "'Inter Tight','Inter',system-ui",
              color: "#222222",
              textAlign: "left",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "39.9155px",
                lineHeight: "51.8901px",
                fontWeight: 600,
              }}
            >
              Признание и опыт, отмечающие вклад нашей команды в развитие инженерных систем.
            </p>
            <p
              style={{
                marginTop: "42px",
                marginBottom: 0,
                fontSize: "39.9155px",
                lineHeight: "51.8901px",
                fontWeight: 300,
              }}
            >
              Пространство профессионалов, где инженеры и проектировщики делятся опытом, знаниями и техническими решениями, чтобы создавать надёжные и эффективные объекты.
            </p>
            <p
              style={{
                marginTop: "42px",
                marginBottom: 0,
                fontSize: "39.9155px",
                lineHeight: "51.8901px",
                fontWeight: 300,
              }}
            >
              Наши ценности: <span style={{ fontWeight: 300 }}>"</span>
              <span style={{ fontWeight: 600 }}>Всегда задаём вопросы</span>
              <span style={{ fontWeight: 300 }}>"</span>, <span style={{ fontWeight: 300 }}>"</span>
              <span style={{ fontWeight: 600 }}>Всегда развиваемся</span>
              <span style={{ fontWeight: 300 }}>"</span>.
            </p>
          </div>
        </div>
      </div>

      {/* === БЛОК «Команда», опущен на 172px === */}
      <div
        className="about-team"
        style={{
          marginTop: "172px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "start",
          transform: expanded ? "translateY(-16px)" : "translateY(0)",
          transition: "transform 220ms ease",
          overflow: "visible",
        }}
      >
        {/* Лево: текст */}
        <div
          style={{
            marginLeft: "80px",
            marginTop: "221px",
            fontFamily: "'Inter Tight','Inter',system-ui",
            color: "#111",
            textAlign: "left",
            maxWidth: "760px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              lineHeight: "28px",
              fontWeight: 300,
              color: "#222222",
              margin: 0,
            }}
          >
            Команда
          </div>

          {/* Заголовок 43px */}
          <h2
            style={{
              marginTop: "14px",
              marginBottom: 0,
              fontSize: "43px",
              lineHeight: "51.8901px",
              fontWeight: 600,
            }}
          >
            Почему
          </h2>
          <h2
            style={{
              margin: 0,
              fontSize: "43px",
              lineHeight: "51.8901px",
              fontWeight: 600,
            }}
          >
            компания &quot;<span style={{ fontWeight: 600 }}>КУБ</span>&quot;?
          </h2>

          {/* Абзац */}
          <p
            style={{
              marginTop: "47px",
              fontSize: "20.9859px",
              lineHeight: "28px",
              fontWeight: 300,
              color: "#222222",
              marginBottom: 0,
              maxWidth: "760px",
            }}
          >
            В компании &quot;<span style={{ fontWeight: 600 }}>КУБ</span>&quot; мы собрали команду специалистов
            <br />
            с большим опытом работы в проектировании и монтаже
            <br />
            инженерных систем. Каждый проект проходит детальную
            <br />
            проработку и контроль качества, чтобы результат был
            <br />
            надёжным, безопасным и соответствовал современным
            <br />
            требованиям и нормативам.
          </p>

          {/* Узнать больше */}
          <div
            style={{
              marginTop: "47px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              verticalAlign: "middle",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
              setExpanded((v) => !v);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
              <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <a href="#more" className="about-hero-role" style={{ lineHeight: "24px", fontSize: "16px" }}>
              Узнать больше
            </a>
          </div>

          {/* Раскрывающийся текст */}
          <div
            style={{
              overflow: "hidden",
              transition: "max-height 260ms ease, opacity 260ms ease",
              maxHeight: expanded ? "1000px" : "0px",
              opacity: expanded ? 1 : 0,
            }}
          >
            <p
              style={{
                marginTop: "24px",
                fontSize: "20.9859px",
                lineHeight: "28px",
                fontWeight: 300,
                color: "#222222",
                marginBottom: 0,
              }}
            >
              Мы берём на себя полный цикл работ — от обследования объекта
              <br />
              и разработки проектной документации до поставки оборудования,
              <br />
              монтажа, пусконаладки и сдачи в эксплуатацию.
              <br />
              Работа ведётся в соответствии с действующими нормами
              <br />
              и стандартами (СП, ГОСТ, ПУЭ, ПТЭЭП).
              <br />
              За каждым проектом закрепляется ответственный инженер,
              <br />
              ведём прозрачный календарный план и смету,
              <br />
              регулярно предоставляем отчёты.
              <br />
              Гарантируем соблюдение сроков и бюджета,
              <br />
              предоставляем гарантию и сервисное обслуживание.
              <br />
              Подбираем решения под задачи и бюджет заказчика,
              <br />
              уделяя внимание энергоэффективности
              <br />
              и удобству эксплуатации.
            </p>
          </div>
        </div>

        {/* Право: картинка */}
        <div style={{ marginRight: "80px" }}>
          <img
            src="/about/about2.png"
            alt="Команда КУБ"
            onMouseEnter={() => setImgHover(true)}
            onMouseLeave={() => setImgHover(false)}
            style={{
              display: "block",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "760px",
              height: "auto",
              transition: "filter 200ms ease",
              filter: imgHover ? "brightness(0.82)" : "none",
            }}
            loading="lazy"
          />
        </div>
      </div>

      {/* === БЛОК «Бюрократия» — картинка слева, текст справа === */}
      <div
        className="about-process"
        style={{
          marginTop: "220px",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "start",
          columnGap: "94px",
          overflow: "visible",
        }}
      >
        {/* ЛЕВО: картинка (точно 693×1039) */}
        <div style={{ marginLeft: "80px" }}>
          <img
            src="/about/about3.png"
            alt="Как делаем «под ключ» без лишней бюрократии"
            onMouseEnter={() => setImgHover2(true)}
            onMouseLeave={() => setImgHover2(false)}
            style={{
              display: "block",
              borderRadius: "14px",
              width: "693px",
              height: "1039px",
              transition: "filter 200ms ease",
              objectFit: "cover",
              filter: imgHover2 ? "brightness(0.82)" : "none",
            }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* ПРАВО: текст (КЛИКАБЕЛЬНО как раньше) */}
        <div
          onClick={handleProcTextClick}
          style={{
            marginRight: "80px",
            marginTop: "221px",
            fontFamily: "'Inter Tight','Inter',system-ui",
            color: "#111",
            textAlign: "left",
            maxWidth: "760px",
            cursor: "pointer",
          }}
          title="Нажмите, чтобы раскрыть подробности"
        >
          <div
            style={{
              fontSize: "14px",
              lineHeight: "28px",
              fontWeight: 300,
              color: "#222222",
              margin: 0,
              cursor: "inherit",
            }}
          >
            Бюрократия
          </div>

          <h2
            style={{
              marginTop: "14px",
              marginBottom: 0,
              fontSize: "43px",
              lineHeight: "51.8901px",
              fontWeight: 600,
              cursor: "inherit",
            }}
          >
            Как делаем «под ключ» без лишней бюрократии?
          </h2>

          {/* Абзац — весь текст на месте */}
          <p
            style={{
              marginTop: "47px",
              fontSize: "20.9859px",
              lineHeight: "28px",
              fontWeight: 300,
              color: "#222222",
              marginBottom: 0,
              maxWidth: "760px",
              cursor: "inherit",
            }}
          >
            Только нужные бумаги и понятные шаги.
            <br />
            Площадка и офис работают синхронно: статус и бюджет видны в один клик.
            <br />
            Сначала показываем «как есть», потом идём по согласованному плану.
            <br />
            Итог — готовая система и простая эксплуатация.
          </p>

          {/* Узнать больше (остаётся отдельной ссылкой) */}
          <div
            style={{
              marginTop: "47px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              verticalAlign: "middle",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
              setExpandedProc((v) => !v);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
              <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d="M11 6l6 6-6 6"
                fill="none"
                stroke="#222"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <a href="#more" className="about-hero-role" style={{ lineHeight: "24px", fontSize: "16px" }}>
              Узнать больше
            </a>
          </div>

          {/* Раскрывающийся текст */}
          <div
            style={{
              overflow: "hidden",
              transition: "max-height 260ms ease, opacity 260ms ease",
              maxHeight: expandedProc ? "1000px" : "0px",
              opacity: expandedProc ? 1 : 0,
            }}
          >
            <p
              style={{
                marginTop: "24px",
                fontSize: "20.9859px",
                lineHeight: "28px",
                fontWeight: 300,
                color: "#222222",
                marginBottom: 0,
                cursor: "inherit",
              }}
            >
              — Покажем на схемах, что где стоит и сколько нужно.
              <br />
              — Дадим план по датам: когда и что делаем, что привозим.
              <br />
              — Сделаем фото скрытых зон до закрытия — чтобы всё было видно.
              <br />
              — Передадим отчёты о проверках: работает и безопасно.
              <br />
              — Оставим короткую инструкцию по обслуживанию: что делать и как часто.
            </p>
          </div>
        </div>

        {/* ↓↓↓ Центр страницы: строка на ширину сетки, под всей секцией, через 108px */}
        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: "108px",
            marginLeft: "80px",
            marginRight: "80px",
            textAlign: "center",
            fontFamily: "'Inter Tight','Inter',system-ui",
            fontSize: "16px",
            lineHeight: "24px",
            fontWeight: 300,
            color: "#222",
          }}
        >
          <span>Кто отвечает за </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", verticalAlign: "middle" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
              <path d="M4 12h13" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 6l6 6-6 6" fill="none" stroke="#222" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <a
              href="#result"
              className="about-hero-role"
              style={{ fontSize: "16px", lineHeight: "24px", fontWeight: 600, textDecoration: "underline" }}
            >
              Результат
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
