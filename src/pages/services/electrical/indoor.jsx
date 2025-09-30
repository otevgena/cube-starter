// src/pages/services/electrical/indoor.jsx
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

/* ===== TOKENS ===== */
const UI = "'Inter Tight','Inter',system-ui";
const GUTTER = 80;
const BLACK = "#000";
const TEXT  = "#111";
const MUTED = "#A7A7A7";
const CARD_BG = "#f8f8f8";
const CARD_BORDER = "#111";

/* ===== SMALL UI ===== */
function DottedLine({ width = "100%" }) {
  return (
    <div
      style={{
        width,
        height: 1,
        backgroundImage:
          "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
      }}
    />
  );
}
function CapsuleButton({ children, onClick, as = "button", href, style }) {
  const base = {
    display:"inline-flex", alignItems:"center", justifyContent:"center",
    height:40, padding:"0 14px", border:"1px solid #111",
    background: CARD_BG, borderRadius:12, color: BLACK, fontFamily: UI,
    fontSize:14, fontWeight:400, cursor:"pointer", transition:"all .16s ease",
    textDecoration:"none", userSelect:"none", ...style,
    gap: 8
  };
  const onEnter = e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; };
  const onLeave = e => { e.currentTarget.style.background = CARD_BG; e.currentTarget.style.color = BLACK; };

  if (as === "a") {
    return <a href={href} onClick={onClick} style={base} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</a>;
  }
  return <button type="button" onClick={onClick} style={base} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</button>;
}
function ToggleChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid #111",
        background: active ? "#111" : CARD_BG,
        color: active ? "#fff" : "#111",
        borderRadius: 999,
        height: 34,
        padding: "0 14px",
        fontFamily: UI,
        fontSize: 13,
        fontWeight: 300,
        cursor: "pointer",
        transition: "all .14s ease",
      }}
    >
      {children}
    </button>
  );
}
function Stepper({ value, onDec, onInc, unit }) {
  const btn = {
    width:32, height:32, border:"1px solid #111", background:CARD_BG,
    borderRadius:10, display:"inline-flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer", fontFamily:UI, fontSize:16, fontWeight:600, lineHeight:1,
  };
  return (
    <div style={{ display:"inline-flex", gap:8, alignItems:"center" }}>
      <button type="button" style={btn} onClick={onDec} aria-label="minus">−</button>
      <div style={{ minWidth:32, textAlign:"center", fontFamily:UI, fontSize:14 }}>
        {value}{unit ? ` ${unit}` : ""}
      </div>
      <button type="button" style={btn} onClick={onInc} aria-label="plus">+</button>
    </div>
  );
}
const KV = ({ label, value, strong }) => (
  <div style={{ display:"grid", rowGap:2 }}>
    <div style={{ color:"#6b7280", fontSize:12, letterSpacing:".06em", textTransform:"uppercase" }}>{label}</div>
    <div style={{ color:"#111", fontSize: strong ? 18 : 14, fontWeight: strong ? 600 : 300 }}>{value}</div>
  </div>
);
const Card = ({ title, children, footer19 }) => (
  <div style={{ border:`1px solid ${CARD_BORDER}`, background:CARD_BG, borderRadius:10, padding:18 }}>
    {!!title && <div style={{ fontSize:18, fontWeight:600, color:TEXT, marginBottom:8 }}>{title}</div>}
    <DottedLine />
    <div style={{ marginTop:12 }}>{children}</div>
    {footer19 ? <div style={{ height:19 }} /> : null}
  </div>
);

/* ===== ICONS ===== */
const IconReset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ display:"block" }}>
    <path d="M3 12a9 9 0 1 0 3-6.708" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M3 3v5h5" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ===== HELPERS ===== */
function formatRuDate(d = new Date()) {
  const m = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return `${m[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
}
function rub(n){ try{ return n.toLocaleString("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}); }catch{ return `${n} ₽`; } }

/* ===== МОДУЛИ (только электрика) ===== */
const MODULES = {
  openSpaceArea: { key:"openSpaceArea", type:"area", label:"Опенспейс, м²",
    contrib:{ sockets:0.18, lights:0.09, three:0.00 },
    cost:{ per:1900 }, days:{ per:0.02 }
  },
  workplaces: { key:"workplaces", type:"count", label:"Рабочие места, шт",
    contrib:{ sockets:4, lights:0.0, three:0 },
    cost:{ per:12000 }, days:{ per:0.10 }
  },
  meetingRoom: { key:"meetingRoom", type:"count", label:"Переговорные, шт",
    contrib:{ sockets:6, lights:2, three:0 },
    cost:{ per:35000 }, days:{ per:0.50 }
  },
  cabinets: { key:"cabinets", type:"count", label:"Кабинеты, шт",
    contrib:{ sockets:6, lights:2, three:0 },
    cost:{ per:28000 }, days:{ per:0.40 }
  },
  serverRack: { key:"serverRack", type:"count", label:"Серверные стойки, шт",
    contrib:{ sockets:6, lights:1, three:0 },
    cost:{ per:45000 }, days:{ per:0.60 }
  },
  serverRoomTier: { key:"serverRoomTier", type:"enum", label:"Серверная (электрика)",
    options:[
      { k:"none", label:"Нет", kCost:0, kDays:0, note:null },
      { k:"base", label:"Базовая (стойка+ИБП)", kCost:120000, kDays:2, note:"ИБП, заземление" },
      { k:"adv",  label:"Комната (ИБП+климат)", kCost:220000, kDays:4, note:"ИБП, молниезащита, климат" },
    ]
  },

  retailHallArea: { key:"retailHallArea", type:"area", label:"Торговый зал, м²",
    contrib:{ sockets:0.12, lights:0.12, three:0.00 },
    cost:{ per:1400 }, days:{ per:0.015 }
  },
  cashDesks: { key:"cashDesks", type:"count", label:"Кассовые места, шт",
    contrib:{ sockets:6, lights:0, three:0 },
    cost:{ per:22000 }, days:{ per:0.25 }
  },
  kitchenArea: { key:"kitchenArea", type:"area", label:"Произв./кухня (HoReCa), м²",
    contrib:{ sockets:0.20, lights:0.10, three:0.04 },
    cost:{ per:2600 }, days:{ per:0.03 }
  },

  warehouseArea: { key:"warehouseArea", type:"area", label:"Склад, м²",
    contrib:{ sockets:0.03, lights:0.08, three:0.00 },
    cost:{ per:900 }, days:{ per:0.012 }
  },
  workshopArea: { key:"workshopArea", type:"area", label:"Производство/цех, м²",
    contrib:{ sockets:0.06, lights:0.12, three:0.02 },
    cost:{ per:1600 }, days:{ per:0.02 }
  },
  productionLines: { key:"productionLines", type:"count", label:"Линии/станки, шт",
    contrib:{ sockets:6, lights:0, three:2 },
    cost:{ per:90000 }, days:{ per:2.0 }
  },

  sanitary: { key:"sanitary", type:"count", label:"Санузлы/узлы воды, шт",
    contrib:{ sockets:1, lights:1, three:0 },
    cost:{ per:8000 }, days:{ per:0.1 }
  },
  emerLight: { key:"emerLight", type:"count", label:"Аварийное освещение, шт",
    contrib:{ sockets:0, lights:1, three:0 },
    cost:{ per:6000 }, days:{ per:0.05 }
  },
};

const SCENARIOS = [
  { key:"office", label:"Офис", modules:["openSpaceArea","workplaces","meetingRoom","cabinets","serverRack","serverRoomTier","sanitary","emerLight"] },
  { key:"retail", label:"Розница", modules:["retailHallArea","cashDesks","sanitary","emerLight","serverRoomTier"] },
  { key:"warehouse", label:"Склад", modules:["warehouseArea","sanitary","emerLight"] },
  { key:"production", label:"Производство", modules:["workshopArea","productionLines","sanitary","emerLight"] },
  { key:"horeca", label:"HoReCa", modules:["kitchenArea","retailHallArea","sanitary","emerLight"] },
  { key:"apartment", label:"Квартира", modules:["openSpaceArea","cabinets","sanitary","emerLight"] },
];

// уровни исполнения/освещенности
const GRADES = [
  { key:"eco", label:"Эконом",  costK:0.92, daysK:1.00 },
  { key:"std", label:"Стандарт",costK:1.00, daysK:1.05 },
  { key:"pro", label:"Премиум", costK:1.22, daysK:1.15 },
];
const LIGHT_LEVELS = [
  { key:"base",   label:"Базовая", lightsK:1.00, costK:1.00 },
  { key:"accent", label:"Акцентная", lightsK:1.15, costK:1.06 },
  { key:"bright", label:"Яркая", lightsK:1.30, costK:1.12 },
];

// бюджет — без сокращений
const BUDGET = [
  { key:"works", label:"Работы",       sharePct:48 },
  { key:"mats",  label:"Материалы",    sharePct:34 },
  { key:"tools", label:"Оснастка",     sharePct:8  },
  { key:"org",   label:"Организация",  sharePct:10 },
];

/* ===== PAGE ===== */
export default function IndoorWorksPage() {
  const today = formatRuDate();

  const [scenario, setScenario] = React.useState("office");
  const [vals, setVals] = React.useState({});
  const [grade, setGrade] = React.useState("std");
  const [light, setLight] = React.useState("base");

  React.useEffect(() => {
    const mods = visibleModules(scenario);
    setVals(v => {
      const next = { ...v };
      mods.forEach(m => {
        const def = MODULES[m];
        if (def.type === "enum") {
          if (next[m] == null) next[m] = "none";
        } else {
          if (next[m] == null) next[m] = 0;
        }
      });
      return next;
    });
  }, [scenario]);

  const calc = React.useMemo(() => {
    const mods = visibleModules(scenario);
    const g  = GRADES.find(x=>x.key===grade) || GRADES[1];
    const ll = LIGHT_LEVELS.find(x=>x.key===light) || LIGHT_LEVELS[0];

    let sockets=0, lights=0, three=0, cost=0, days=0;

    for (const key of mods) {
      const m = MODULES[key];
      const v = vals[key] ?? (m.type==="enum" ? "none" : 0);

      if (m.type === "enum") {
        const opt = m.options.find(o=>o.k===v);
        if (opt && v!=="none") {
          cost += opt.kCost;
          days += opt.kDays;
        }
        continue;
      }

      const n = Number(v) || 0;
      cost += m.cost.per * n;
      days += m.days.per * n;

      sockets += (m.contrib.sockets||0) * n;
      lights  += (m.contrib.lights||0)  * n;
      three   += (m.contrib.three||0)   * n;
    }

    // уровни
    lights *= ll.lightsK;
    cost   *= (g.costK * ll.costK);
    days   *= g.daysK;

    const res = {
      sockets: Math.ceil(sockets),
      lights:  Math.ceil(lights),
      three:   Math.ceil(three),
      cost:    Math.round(cost/1000)*1000,
      days:    Math.max(3, Math.ceil(days)),
    };

    res.recos = recommendations({ scenario, vals, totals: res });
    return res;
  }, [scenario, vals, grade, light]);

  function inc(k, step=1){ setVals(v => ({ ...v, [k]: Math.max(0, (Number(v[k])||0) + step) })); }
  function dec(k, step=1){ setVals(v => ({ ...v, [k]: Math.max(0, (Number(v[k])||0) - step) })); }
  function setEnum(k, val){ setVals(v => ({ ...v, [k]: val })); }

  function copySummary() {
    const mods = visibleModules(scenario);
    const lines = mods.map(k=>{
      const m = MODULES[k];
      const v = vals[k];
      if (m.type==="enum") return v && v!=="none" ? `• ${m.label}: ${m.options.find(o=>o.k===v)?.label}` : null;
      const n = Number(v)||0; if (!n) return null;
      return `• ${m.label}: ${n}${m.type==="area"?" м²":""}`;
    }).filter(Boolean);

    const txt = [
      `Внутренние электромонтажные — конфигурация (${SCЕНARIOS.find(s=>s.key===scenario)?.label || ""})`,
      ...lines,
      "",
      `Уровень: ${GRADES.find(g=>g.key===grade)?.label}; Освещённость: ${LIGHT_LEVELS.find(l=>l.key===light)?.label}`,
      `Итог: розеток ${calc.sockets}, световых точек ${calc.lights}, 3ф розеток ${calc.three}`,
      `≈ смета: ${rub(calc.cost)}, срок: от ${calc.days} дней`,
      ...(calc.recos.length?["","Рекомендации:",...calc.recos.map(r=>"— "+r)]:[])
    ].join("\n");
    navigator.clipboard?.writeText(txt).catch(()=>{});
    alert("Сводка скопирована в буфер обмена");
  }

  function resetAll() {
    const defScenario = "office";
    const mods = visibleModules(defScenario);
    const cleared = {};
    mods.forEach(k => {
      const d = MODULES[k];
      cleared[k] = d.type === "enum" ? "none" : 0;
    });
    setScenario(defScenario);
    setGrade("std");
    setLight("base");
    setVals(cleared);
  }

  return (
    <main style={{ fontFamily:UI, color:BLACK, background:"#f8f8f8" }}>
      <style>{`
        .electro-tabs{ text-align:center; margin-top:30px; }
        .electro-tabs a{
          color:${MUTED}; text-decoration:none; transition:color .16s ease;
          letter-spacing:normal; font-size:14px; line-height:28px; font-weight:300;
          text-transform:uppercase; padding:0 10px; display:inline-block; margin:0 4px 8px 4px; cursor:pointer;
        }
        .electro-tabs a:hover{ color:${BLACK}; }
        .electro-tabs a.is-active{ color:${BLACK}; }
        .electro-title{ margin:0; text-transform:uppercase; font-weight:600; text-align:center; }
        .electro-sub{ margin:0; text-align:center; font-size:21px; line-height:28px; font-weight:600; color:#222222; }
        .electro-tabs-wrap{ display:inline-flex; flex-wrap:wrap; max-width:1080px; justify-content:center; }
      `}</style>

      {/* Вкладки + заголовок + лид */}
      <div style={{ transform:"translateY(-61px)", willChange:"transform" }}>
        <div className="electro-tabs">
          <div className="electro-tabs-wrap">
            <SpaLink to="/services/electrical/power-connection">Подключение объектов к электросетям</SpaLink>
            <SpaLink to="/services/electrical/power-upgrade">Увеличение мощности и модернизация сетей</SpaLink>
            <SpaLink to="/services/electrical/indoor" className="is-active">Внутренние электромонтажные работы</SpaLink>
            <SpaLink to="/services/electrical#outdoor">Наружные электросети и уличное освещение</SpaLink>
            <SpaLink to="/services/electrical#switchgear">Монтаж электрощитов и ВРУ</SpaLink>
            <SpaLink to="/services/electrical#earthing">Системы заземления и молниезащиты</SpaLink>
            <SpaLink to="/services/electrical#automation">Автоматизация и учёт электроэнергии</SpaLink>
            <SpaLink to="/services/electrical#backup">Резервное электроснабжение</SpaLink>
          </div>
        </div>

        <div style={{ textAlign:"center", position:"relative", marginTop:2 }}>
          <h2 className="electro-title about-hero-title">
            <span style={{ display:"block" }}>ВНУТРЕННИЕ</span>
            <span style={{ display:"block" }}>ЭЛЕКТРОМОНТАЖНЫЕ РАБОТЫ</span>
          </h2>
        </div>

        <div style={{ background:"#f8f8f8", marginTop:12, marginBottom:0, padding:0 }}>
          <p className="electro-sub">
            Чистый монтаж без сюрпризов: аккуратные трассы, подписанные линии, понятная схема.
          </p>
        </div>
      </div>

      {/* апдейт */}
      <div style={{ marginTop:-61, marginLeft:GUTTER, marginRight:GUTTER, display:"flex", justifyContent:"flex-end" }}>
        <div style={{ fontSize:14, fontWeight:300, color:"#3b3b3b" }}>Обновление: {today}</div>
      </div>

      {/* ===== ГЛАВНЫЙ БЛОК ===== */}
      <section style={{ marginTop:64, marginLeft:GUTTER, marginRight:GUTTER, display:"grid", gridTemplateColumns:"1.25fr 1fr", gap:18 }}>
        {/* ЛЕВАЯ: сценарий и модули */}
        <Card title="Конфигуратор объектов">
          {/* сценарии */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {SCENARIOS.map(s => (
              <ToggleChip key={s.key} active={scenario===s.key} onClick={()=>setScenario(s.key)}>{s.label}</ToggleChip>
            ))}
          </div>

          {/* уровни */}
          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Card title="Уровень исполнения">
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {GRADES.map(g => <ToggleChip key={g.key} active={grade===g.key} onClick={()=>setGrade(g.key)}>{g.label}</ToggleChip>)}
              </div>
            </Card>
            <Card title="Освещённость">
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {LIGHT_LEVELS.map(l => <ToggleChip key={l.key} active={light===l.key} onClick={()=>setLight(l.key)}>{l.label}</ToggleChip>)}
              </div>
            </Card>
          </div>

          {/* модули */}
          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap:12 }}>
            {visibleModules(scenario).map(k => (
              <ModuleRow
                key={k}
                def={MODULES[k]}
                val={vals[k] ?? (MODULES[k].type==="enum" ? "none" : 0)}
                onInc={(step)=>inc(k, step)}
                onDec={(step)=>dec(k, step)}
                onEnum={(val)=>setEnum(k,val)}
              />
            ))}
          </div>
        </Card>

        {/* ПРАВАЯ: итог + БЮДЖЕТ + РЕКОС В ОДНОМ БЛОКЕ, низ = 19px */}
        <Card title="Итог" footer19>
          {/* KPI */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", columnGap:12, rowGap:8 }}>
            <KV label="Розетки" value={calc.sockets} />
            <KV label="Световые точки" value={calc.lights} />
            <KV label="3-ф розетки" value={calc.three} />
            <KV label="≈ Смета" value={rub(calc.cost)} strong />
            <KV label="Срок" value={`от ${calc.days} дней`} strong />
          </div>

          {/* Бюджет — чуть ниже KPI */}
          <div style={{ marginTop:16 }}>
            <BudgetGraph />
          </div>

          {/* Рекомендации + кнопки + CTA */}
          <div style={{ marginTop:12 }}>
            {!!calc.recos.length && (
              <ul style={{ margin:"0 0 10px 16px", padding:0, listStyle:"disc" }}>
                {calc.recos.map((r,i)=>(<li key={i} style={{ fontSize:14, lineHeight:"22px", fontWeight:300, color:"#111", marginBottom:4 }}>{r}</li>))}
              </ul>
            )}

            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <CapsuleButton onClick={copySummary}>Скопировать сводку</CapsuleButton>
              <CapsuleButton onClick={resetAll}>
                <IconReset /> Сбросить фильтр
              </CapsuleButton>
            </div>

            <div style={{ marginTop:12 }}>
              <button
                type="button"
                style={{
                  height:48, padding:"0 16px", borderRadius:10, border:`1px solid ${CARD_BORDER}`,
                  background: BLACK, color:"#fff", fontFamily:UI, fontSize:16, fontWeight:300, cursor:"pointer",
                }}
                onClick={()=>alert("Ок! Пришлите план/описание — соберём комплектацию и точную смету.")}
              >
                Собрать комплектацию по вашему плану
              </button>
              <div style={{ marginTop:8, fontSize:12, color:"#6b7280" }}>
                Сроки и смета уточняются после осмотра/проекта.
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Что делаем / Результат — без слаботочных */}
      <section style={{ marginTop:32, marginLeft:GUTTER, marginRight:GUTTER }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          <Card title="Что делаем">
            <ul style={{ margin:"12px 0 0 16px", padding:0, listStyle:"disc" }}>
              <li style={li}>силовые линии и группы, освещение;</li>
              <li style={li}>трассы, лотки/короба, штроба/скрытый монтаж;</li>
              <li style={li}>подрозетники/механизмы, маркировка;</li>
              <li style={li}>измерения изоляции/петли фаза-ноль.</li>
            </ul>
          </Card>
          <Card title="Результат и документы">
            <ul style={{ margin:"12px 0 0 16px", padding:0, listStyle:"disc" }}>
              <li style={li}>исполнительная документация;</li>
              <li style={li}>протоколы замеров;</li>
              <li style={li}>фотоотчёт.</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Низ — навигация/возврат */}
      <section style={{ marginTop:48, marginLeft:GUTTER, marginRight:GUTTER, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:"#3b3b3b", fontSize:14, fontWeight:300 }}>
          Страница услуги в составе раздела «Электромонтаж».
        </div>
        <CapsuleButton as="a" href="/services/electrical">
          ← Все услуги электромонтажа
        </CapsuleButton>
      </section>

      <div style={{ height:120 }} />
    </main>
  );
}

/* ===== БЮДЖЕТНЫЙ ГРАФИК — как в index.jsx, подписи для узких сегментов сдвинуты левее ===== */
function BudgetGraph() {
  const wrapRef = React.useRef(null);
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting);
        if (vis) setAnimate(true);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const labelLeft = (pct) => {
    if (pct <= 8)  return -22;  // очень узкий сегмент
    if (pct <= 10) return -14;
    if (pct <= 12) return -8;
    return 11;                  // стандарт как в index.jsx
  };

  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <div
        style={{
          position:"relative",
          height:48,
          display:"flex",
          alignItems:"stretch",
          border:"1px solid #e5e5e5",
          borderRadius:0,
          overflow:"visible",
          background:"#fff",
        }}
      >
        {/* левая верхняя пунктирная */}
        <div
          aria-hidden="true"
          style={{ position:"absolute", left:0, top:-58, height:58, width:0, borderLeft:"1px dashed rgba(0,0,0,.12)" }}
        />
        {BUDGET.map((m, idx) => (
          <div
            key={m.key}
            style={{
              position:"relative",
              flexBasis:`${m.sharePct}%`,
              flexGrow:0, flexShrink:0,
              background:"#f5f5f5",
              overflow:"visible",
            }}
          >
            {/* подпись сверху — может немного выходить за пределы узкого сегмента влево */}
            <div
              style={{
                position:"absolute",
                left: labelLeft(m.sharePct),
                top: -58,
                textAlign:"left",
                pointerEvents:"none",
                whiteSpace:"nowrap",
              }}
            >
              <div style={{ fontSize:14, lineHeight:"20px", fontWeight:300, color:"#222" }}>{m.label}</div>
              <div style={{ fontSize:14, lineHeight:"20px", fontWeight:600, color:"#222" }}>{m.sharePct}%</div>
            </div>

            {/* разделитель сверху */}
            {idx > 0 && (
              <div aria-hidden="true" style={{ position:"absolute", left:0, top:-58, height:58, width:0, borderLeft:"1px dashed rgba(0,0,0,.12)" }} />
            )}

            {/* внутренняя заливка — ровно по проценту */}
            <div
              aria-hidden="true"
              style={{
                position:"absolute", left:0, top:0, bottom:0,
                width: animate ? `${m.sharePct}%` : "0%",
                background:"#ededed",
                transition:`width 900ms ${150 + idx * 120}ms ease`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== MODULE ROW RENDERER ===== */
function ModuleRow({ def, val, onInc, onDec, onEnum }) {
  const inner = { border:`1px solid ${CARD_BORDER}`, background:"#fff", borderRadius:10, padding:12, display:"grid", rowGap:8 };
  if (def.type === "enum") {
    return (
      <div style={inner}>
        <div style={{ fontSize:14, fontWeight:600 }}>{def.label}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {def.options.map(o => (
            <ToggleChip key={o.k} active={val===o.k} onClick={()=>onEnum(o.k)}>{o.label}</ToggleChip>
          ))}
        </div>
      </div>
    );
  }

  const unit = def.type === "area" ? "м²" : undefined;
  const step = def.type === "area" ? 10 : 1;

  return (
    <div style={inner}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div style={{ fontSize:14, fontWeight:600 }}>{def.label}</div>
        <Stepper
          value={val||0}
          unit={unit}
          onDec={()=>onDec(step)}
          onInc={()=>onInc(step)}
        />
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", color:"#333", fontSize:12 }}>
        <span>
          Норматив: роз. {fmt(def.contrib.sockets)} / свет {fmt(def.contrib.lights)}
          {def.contrib.three ? ` / 3ф ${fmt(def.contrib.three)}` : ""} {(def.type==="area") ? "· на 1 м²" : "· на 1 шт"}
        </span>
        <span>{rub(def.cost.per)} · {def.days.per} дн/ед.</span>
      </div>
    </div>
  );
}

/* ===== UTILS (page) ===== */
const li = { fontSize:16, lineHeight:"26px", fontWeight:300, color:BLACK, marginBottom:8 };
function fmt(n){ return (Math.round(n*100)/100).toString().replace(".", ","); }
function visibleModules(scenarioKey){
  return SCENARIOS.find(s=>s.key===scenarioKey)?.modules || [];
}
function recommendations({ scenario, vals, totals }){
  const rec = [];
  if ((vals.serverRoomTier && vals.serverRoomTier!=="none") || (vals.serverRack||0) > 0) {
    rec.push("ИБП + отдельная группа и заземление для серверной");
  }
  if ((totals.three||0) >= 4 || (vals.productionLines||0) > 0) {
    rec.push("Проверка ТКЗ и селективности защит при пусковых токах");
  }
  if ((vals.warehouseArea||0) >= 300) {
    rec.push("Аварийное освещение и эвакуационные указатели на складе");
  }
  if ((vals.retailHallArea||0) >= 150 || (vals.cashDesks||0) > 0) {
    rec.push("Отдельные контуры для касс/терминалов + ИБП");
  }
  if ((vals.openSpaceArea||0) >= 250 || (vals.workplaces||0) >= 60) {
    rec.push("Разделение линий и отдельный этажный щит для перегрузоустойчивости");
  }
  if ((vals.kitchenArea||0) > 0) {
    rec.push("УЗО 30 мА для мокрых зон и теплового оборудования");
  }
  rec.push("Фотоотчёт, исполнительная, протоколы замеров в комплекте");
  return rec;
}
