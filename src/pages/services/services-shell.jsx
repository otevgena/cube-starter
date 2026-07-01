// src/pages/services/services-shell.jsx
// Общий шелл для страниц-категорий услуг (electrical / lowcurrent / ventilation / design / construction).
// Все страницы делят одну структуру: вкладки + заголовок + слоган + вступление + таблица услуг + график.
// Различаются только данными → страницы стали тонкими конфигами.
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";
import { Capsule } from "@/components/services/detailBlocks.jsx";

const GUTTER = 80;
const TEXT_SHIFT = 28;
const HEADER_H = 72;
const ROW_H = 104;
const UI = "'Inter Tight','Inter',system-ui";

function formatRuDate(d = new Date()) {
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = d.getFullYear();
  return `${mm} ${dd}, ${yy}`;
}

/* пунктирная линия (как в таблице проектов) */
function DottedLine() {
  return (
    <div
      className="h-px w-full"
      style={{ backgroundImage: "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)" }}
    />
  );
}

/* кнопка «Подробнее» — та же капсула, что «Оставить заявку»: контур → чёрная заливка на hover */
function CellButtonLink({ to }) {
  return <Capsule to={to}>Подробнее</Capsule>;
}

/* таблица услуг */
function ServiceTable({ lines }) {
  const cell = {
    marginLeft: TEXT_SHIFT, fontSize: 18, color: "#111", fontWeight: 400,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  };
  return (
    <div className="mx-[80px] mt-[120px]">
      {/* шапка */}
      <div className="grid items-center" style={{ gridTemplateColumns: "2fr 1fr 144px", columnGap: 18, height: HEADER_H }}>
        <span style={{ marginLeft: TEXT_SHIFT, fontSize: 14, color: "#222" }}>Услуга</span>
        <span style={{ marginLeft: TEXT_SHIFT, fontSize: 14, color: "#222" }}>Направление</span>
        <div />
      </div>
      <DottedLine />
      {/* строки */}
      {lines.map((it) => (
        <React.Fragment key={it.key}>
          <div className="grid items-center" style={{ gridTemplateColumns: "2fr 1fr 144px", columnGap: 18, height: ROW_H }}>
            <div className="min-w-0" style={cell} title={it.title}>{it.title}</div>
            <div className="min-w-0" style={cell} title={it.dir}>{it.dir}</div>
            <div className="flex items-center justify-end">
              <CellButtonLink to={it.href} />
            </div>
          </div>
          <DottedLine />
        </React.Fragment>
      ))}
    </div>
  );
}

/* анимированный график долей */
function ActivityGraph({ metrics }) {
  const wrapRef = React.useRef(null);
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) setAnimate(true); },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tick = { position: "absolute", left: 0, top: -58, height: 58, width: 0, borderLeft: "1px dashed rgba(0,0,0,.12)" };

  return (
    <div ref={wrapRef} className="relative mx-[80px]">
      <div className="relative flex items-stretch overflow-visible border border-line bg-white" style={{ height: 48 }}>
        <div aria-hidden="true" style={tick} />
        {metrics.map((m, idx) => (
          <div key={m.key} className="relative" style={{ flex: `0 0 ${m.sharePct}%`, background: "#f5f5f5" }}>
            <div className="pointer-events-none absolute text-left" style={{ left: 11, top: -58 }}>
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{m.label}</div>
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "#222" }}>{m.sharePct}%</div>
            </div>
            {idx > 0 && <div aria-hidden="true" style={tick} />}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: animate ? `${(m.score10 / 10) * 100}%` : "0%",
                background: "#ededed",
                transition: `width 900ms ${150 + idx * 120}ms ease`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-[30px] flex">
        {metrics.map((m) => (
          <div key={m.key} style={{ flex: `0 0 ${m.sharePct}%` }}>
            <div style={{ fontSize: 14, lineHeight: "22px", fontWeight: 600, color: "#111" }}>
              {m.score10.toFixed(1)} <span style={{ fontWeight: 600, opacity: 0.9 }}>/ 10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* большой блок CUBE / ИНДЕКС со стрелкой, выровненной по «К» */
function CubeIndex({ score, dateText }) {
  const title = "CUBE / ИНДЕКС";
  const kPos = title.lastIndexOf("К");
  const before = kPos >= 0 ? title.slice(0, kPos) : title;
  const after = kPos >= 0 ? title.slice(kPos) : "";

  const wrapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const [offset, setOffset] = React.useState(0);

  React.useLayoutEffect(() => {
    const calc = () => {
      const wrap = wrapRef.current, mark = markerRef.current;
      if (!wrap || !mark) return;
      setOffset(Math.max(0, mark.getBoundingClientRect().left - wrap.getBoundingClientRect().left));
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", calc);
    return () => { ro.disconnect(); window.removeEventListener("resize", calc); };
  }, []);

  return (
    <div className="mx-[80px] flex items-end justify-between">
      <div>
        <div
          ref={wrapRef}
          className="relative whitespace-nowrap font-semibold uppercase"
          style={{ fontSize: 96, lineHeight: 1, color: "#222" }}
        >
          <span>{before}</span>
          <span ref={markerRef} style={{ display: "inline-block", width: 0 }} />
          <span>{after}</span>
        </div>

        <div className="relative mt-6">
          <div aria-hidden="true" className="absolute top-0" style={{ left: offset, transform: "translateX(calc(-100% - 16px))" }}>
            <span style={{ fontSize: 96, fontWeight: 600, lineHeight: 1 }}>→</span>
          </div>
          <div className="flex items-start whitespace-nowrap" style={{ marginLeft: offset, gap: 8, color: "#111" }}>
            <span style={{ fontSize: 96, fontWeight: 600, lineHeight: 1 }}>{Number(score).toFixed(1)}</span>
            <span style={{ fontSize: 28, fontWeight: 300, lineHeight: 1, transform: "translateY(-6px)" }}>/ 10</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 20, lineHeight: "28px", fontWeight: 300, color: "#3b3b3b" }}>
        Обновление: {dateText}
      </div>
    </div>
  );
}

/* вкладки-услуги */
function tabActive(href) {
  try {
    const [p, h] = href.split("#");
    const curPath = window.location.pathname || "/";
    const curHash = window.location.hash || "";
    if (h) return curPath === p && curHash === "#" + h;
    return curPath === p;
  } catch {
    return false;
  }
}

function Tab({ to, active, children }) {
  const onClick = (e) => {
    e.preventDefault();
    try {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
      const hash = to.includes("#") ? to.split("#")[1] : "";
      if (hash) {
        requestAnimationFrame(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch {}
  };
  return (
    <a
      href={to}
      onClick={onClick}
      className={`mx-1 mb-2 inline-block cursor-pointer px-2.5 text-sm font-light uppercase leading-7 transition-colors duration-150 ${
        active ? "text-black" : "text-[#a7a7a7] hover:text-black"
      }`}
    >
      {children}
    </a>
  );
}

/* ===== Главный конфиг-компонент категории ===== */
export function ServiceCategoryPage({ title, slogan, intro, lines, metrics, score, graphHeading = "Что мы делаем чаще всего" }) {
  const today = formatRuDate();

  return (
    <div className="bg-page font-tight text-black">
      {/* верхняя зона (приподнята на высоту шапки) */}
      <div className="-translate-y-[61px] will-change-transform">
        <nav className="mt-[30px] text-center">
          <div className="mx-auto inline-flex max-w-[1080px] flex-wrap justify-center">
            {lines.map((it) => (
              <Tab key={it.key} to={it.href} active={tabActive(it.href)}>
                {it.title}
              </Tab>
            ))}
          </div>
        </nav>

        <h1
          className="mt-0.5 text-center font-semibold uppercase leading-none"
          style={{ fontSize: "clamp(48px, 13.5vw, 137px)" }}
        >
          {title}
        </h1>

        <p className="mt-3 text-center text-[21px] font-semibold leading-7 text-ink">{slogan}</p>
      </div>

      {/* вступительный текст */}
      <div className="mx-[80px] mt-[150px] text-left text-[43px] font-semibold leading-[51px] text-ink">
        {intro.map((line, i) => (
          <p key={i} className="m-0">{line}</p>
        ))}
      </div>

      {/* таблица услуг */}
      <ServiceTable lines={lines} />

      {/* заголовки к графику */}
      <div className="mx-[80px] mt-[150px]">
        <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, color: "#222" }}>График</div>
        <div className="mt-[14px]" style={{ fontSize: 43, lineHeight: "51px", fontWeight: 600, color: "#111" }}>
          {graphHeading}
        </div>
      </div>

      {/* CUBE / ИНДЕКС */}
      <div className="mt-[150px]">
        <CubeIndex score={score} dateText={today} />
      </div>

      {/* график */}
      <div className="mt-[200px]">
        <ActivityGraph metrics={metrics} />
      </div>

      <div className="h-[160px]" />
    </div>
  );
}
