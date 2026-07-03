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

/* планшетный диапазон 768–1023 (график ПК показываем с md, но подписи ужимаем) */
function useIsTablet() {
  const [v, setV] = React.useState(false);
  React.useEffect(() => {
    let mq;
    try { mq = window.matchMedia("(min-width:768px) and (max-width:1023px)"); } catch { return; }
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on); };
  }, []);
  return v;
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
    <div className="mx-4 mt-16 lg:mx-[80px] lg:mt-[120px]">
      {/* мобилка: реестр услуг — номер · название · направление · стрелка, разделённые пунктиром */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between pb-3 text-[12px] uppercase tracking-[0.08em] text-neutral-400">
          <span>Услуги</span>
          <span className="tabular-nums">{String(lines.length).padStart(2, "0")}</span>
        </div>
        <DottedLine />
        {lines.map((it, i) => (
          <SpaLink key={it.key} to={it.href} className="group block transition-colors active:bg-black/[0.03]">
            <div className="flex items-start gap-4 py-[18px]">
              <span className="w-6 shrink-0 pt-0.5 text-[13px] font-semibold leading-[21px] tabular-nums text-neutral-400 transition-colors group-active:text-[#111]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] leading-[21px] text-[#111]">{it.title}</div>
                <div className="mt-1.5 text-[11px] uppercase tracking-[0.06em] text-neutral-400">{it.dir}</div>
              </div>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="mt-0.5 shrink-0 text-[#111] transition-transform duration-200 group-active:translate-x-1">
                <path d="M4 12h13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M11 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <DottedLine />
          </SpaLink>
        ))}
      </div>

      {/* десктоп: таблица */}
      <div className="hidden lg:block">
        <div className="grid items-center" style={{ gridTemplateColumns: "2fr 1fr 144px", columnGap: 18, height: HEADER_H }}>
          <span style={{ marginLeft: TEXT_SHIFT, fontSize: 14, color: "#222" }}>Услуга</span>
          <span style={{ marginLeft: TEXT_SHIFT, fontSize: 14, color: "#222" }}>Направление</span>
          <div />
        </div>
        <DottedLine />
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
    </div>
  );
}

/* анимированный график долей */
function ActivityGraph({ metrics }) {
  const wrapRef = React.useRef(null);
  const [animate, setAnimate] = React.useState(false);
  const isTablet = useIsTablet();
  // На планшете расширяем ТОЛЬКО узкий сегмент с длинной подписью (иначе она наезжает на соседа),
  // а недостающую ширину забираем у самого широкого сегмента. Остальные сегменты не трогаем. ПК — по данным.
  const tShares = React.useMemo(() => {
    const orig = metrics.map((m) => m.sharePct);
    if (!isTablet) return orig;
    const longest = (s) => String(s).split(/[\s-]+/).reduce((a, w) => Math.max(a, w.length), 0);
    const BUMP = 17;
    const isBumped = (i) => orig[i] < 14 && longest(metrics[i].label) >= 11;
    const adj = orig.slice();
    let deficit = 0;
    orig.forEach((v, i) => { if (isBumped(i) && v < BUMP) { deficit += BUMP - v; adj[i] = BUMP; } });
    if (deficit > 0) {
      let maxI = -1;
      adj.forEach((v, i) => { if (!isBumped(i) && (maxI < 0 || v > adj[maxI])) maxI = i; });
      if (maxI >= 0) adj[maxI] = Math.max(6, adj[maxI] - deficit);
    }
    return adj;
  }, [metrics, isTablet]);

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
    <div ref={wrapRef} className="relative mx-4 lg:mx-[80px]">
      {/* мобилка: вертикальный список метрик */}
      <div className="md:hidden">
        {metrics.map((m, idx) => (
          <div key={m.key} className={idx > 0 ? "mt-4" : ""}>
            <div className="flex items-baseline justify-between">
              <span style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>{m.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{m.sharePct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#ededed]">
              <div
                className="h-full rounded-full bg-[#bdbdbd]"
                style={{ width: animate ? `${(m.score10 / 10) * 100}%` : "0%", transition: `width 900ms ${150 + idx * 120}ms ease` }}
              />
            </div>
            <div className="mt-1" style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{m.score10.toFixed(1)} / 10</div>
          </div>
        ))}
      </div>

      {/* десктоп + планшет: полосный график */}
      <div className="hidden md:block">
        <div className="relative flex items-stretch overflow-visible border border-line bg-white" style={{ height: 48 }}>
          <div aria-hidden="true" style={tick} />
          {metrics.map((m, idx) => (
            <div key={m.key} className="relative" style={{ flex: `0 0 ${tShares[idx]}%`, background: "#f5f5f5" }}>
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
          {metrics.map((m, idx) => (
            <div key={m.key} style={{ flex: `0 0 ${tShares[idx]}%` }}>
              <div style={{ fontSize: 14, lineHeight: "22px", fontWeight: 600, color: "#111", whiteSpace: isTablet ? "nowrap" : undefined }}>
                {m.score10.toFixed(1)} <span style={{ fontWeight: 600, opacity: 0.9 }}>/ 10</span>
              </div>
            </div>
          ))}
        </div>
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
    <>
      {/* мобилка: упрощённый блок */}
      <div className="mx-4 lg:hidden">
        <div className="font-semibold uppercase leading-none text-[#222]" style={{ fontSize: 38 }}>CUBE / ИНДЕКС</div>
        <div className="mt-4 flex items-end gap-2 text-[#111]">
          <span className="font-semibold leading-none" style={{ fontSize: 30 }}>→</span>
          <span className="font-semibold leading-none" style={{ fontSize: 56 }}>{Number(score).toFixed(1)}</span>
          <span className="font-light" style={{ fontSize: 18, lineHeight: 1, transform: "translateY(-4px)" }}>/ 10</span>
        </div>
        <div className="mt-4 text-[16px] font-light leading-6 text-[#3b3b3b]">Обновление: {dateText}</div>
      </div>

      {/* десктоп: полная композиция со стрелкой по «К» */}
      <div className="mx-[80px] hidden items-end justify-between lg:flex">
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
    </>
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
      <div className="-mt-12 will-change-transform lg:mt-0 lg:-translate-y-[61px]">
        <nav className="mt-[30px] hidden text-center lg:block">
          <div className="mx-auto inline-flex max-w-[1080px] flex-wrap justify-center">
            {lines.map((it) => (
              <Tab key={it.key} to={it.href} active={tabActive(it.href)}>
                {it.title}
              </Tab>
            ))}
          </div>
        </nav>

        <h1 className="mt-2 text-center font-semibold uppercase leading-none text-[clamp(28px,10vw,42px)] sm:text-[clamp(48px,13.5vw,137px)] md:text-[70px] lg:mt-0.5 lg:text-[clamp(48px,13.5vw,137px)]">
          {title}
        </h1>

        <p className="mx-4 mt-3 text-center text-[18px] font-semibold leading-6 text-ink lg:mx-0 lg:text-[21px] lg:leading-7">{slogan}</p>
      </div>

      {/* вступительный текст */}
      <div className="mx-4 mt-10 text-left text-[26px] font-semibold leading-[32px] text-ink md:text-[30px] md:leading-[38px] lg:mx-[80px] lg:mt-[150px] lg:text-[43px] lg:leading-[51px]">
        {intro.map((line, i) => (
          <p key={i} className="m-0">{line}</p>
        ))}
      </div>

      {/* таблица услуг */}
      <ServiceTable lines={lines} />

      {/* CTA (мобилка) — акцентная морковная кнопка после списка услуг */}
      <div className="mx-4 mt-7 lg:hidden">
        <SpaLink
          to="/contact"
          className="flex h-[54px] items-center justify-between gap-3 rounded-[10px] bg-carrot px-5 text-[15px] font-semibold text-black transition-colors active:bg-[#e8541f]"
        >
          <span>Оставить заявку</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="shrink-0">
            <path d="M4 12h13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SpaLink>
      </div>

      {/* заголовки к графику */}
      <div className="mx-4 mt-16 lg:mx-[80px] lg:mt-[150px]">
        <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, color: "#222" }}>График</div>
        <div className="mt-3.5 text-[26px] font-semibold leading-[32px] text-[#111] md:text-[30px] md:leading-[38px] lg:text-[43px] lg:leading-[51px]">
          {graphHeading}
        </div>
      </div>

      {/* CUBE / ИНДЕКС */}
      <div className="mt-14 lg:mt-[150px]">
        <CubeIndex score={score} dateText={today} />
      </div>

      {/* график */}
      <div className="mt-14 md:mt-[124px] lg:mt-[200px]">
        <ActivityGraph metrics={metrics} />
      </div>

      <div className="h-0 lg:h-[160px]" />
    </div>
  );
}
