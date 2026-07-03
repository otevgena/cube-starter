// src/components/services/constructionBlocks.jsx
// «BUILD OS / Строительный штаб» — signature-панели для тела детальных страниц «Общестрой».
// У каждой услуги свой первый блок (маршрут помещения, цикл монолита, разрез основания, оболочка,
// сборка пространства, стратегия усиления, штаб объекта, маршрут запуска). Строгий Cube:
// монохром, 1px border, пунктир, hover чёрный/белый, без цвета/иконок/градиентов.
// Только inline-стили + токены проекта; Tailwind — лишь для адаптивных сеток.
import React, { useState } from "react";
import { UI, BG, INK, MUTED, DottedDivider, DetailStatGrid, MatrixTable, MiniTabs, gridFillers } from "@/components/services/detailBlocks.jsx";

const lblCss = { fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 };
const valCss = { marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" };
const numCss = { fontSize: 18, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" };
const cardCss = { border: `1px solid ${INK}`, borderRadius: 12, background: BG, padding: 16 };
const softCss = { border: `1px solid ${INK}`, borderRadius: 12, background: "#f1f1f1", padding: 16 };
const gridBox = { border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden", gap: 1, background: INK };
const cell = { background: BG, padding: 16 };
const pad = (i) => String(i + 1).padStart(2, "0");

function Field({ label, value }) {
  return (
    <div>
      <div style={lblCss}>{label}</div>
      <div style={valCss}>{value}</div>
    </div>
  );
}
function DetailCard({ node, fields, cols = "grid-cols-1 sm:grid-cols-3" }) {
  if (!node) return null;
  return (
    <div style={{ marginTop: 12, ...softCss }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 10 }}>{node.title}</div>
      <div className={`grid ${cols}`} style={{ gap: 14 }}>
        {fields.map((f) => <Field key={f.key} label={f.label} value={node[f.key]} />)}
      </div>
    </div>
  );
}

/* ===== BuildStatGrid ===== */
export function BuildStatGrid(props) { return <DetailStatGrid {...props} />; }

/* ===== Широкая таблица (ToleranceMatrix): desktop — сетка, mobile — карточки ===== */
function WideTable({ columns = [], rows = [] }) {
  const n = columns.length;
  const grid = `minmax(92px, 1.2fr) repeat(${n - 1}, minmax(0, 1fr))`;
  return (
    <div style={cardCss}>
      <div className="hidden md:block">
        <div style={{ display: "grid", gridTemplateColumns: grid, columnGap: 12, ...lblCss, paddingBottom: 10 }}>
          {columns.map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <DottedDivider />
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: grid, columnGap: 12, alignItems: "start", padding: "12px 0", fontSize: 13.5, lineHeight: "19px", fontWeight: 300, color: "#222" }}>
              {r.map((c, ci) => ci === 0 ? <span key={ci} style={{ fontWeight: 600, color: INK }}>{c}</span> : <span key={ci}>{c}</span>)}
            </div>
            {ri < rows.length - 1 && <DottedDivider />}
          </React.Fragment>
        ))}
      </div>
      <div className="md:hidden" style={{ display: "grid", rowGap: 12 }}>
        {rows.map((r, ri) => (
          <div key={ri} style={{ border: "1px solid #e3e3e3", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>{r[0]}</div>
            {r.slice(1).map((c, ci) => (
              <div key={ci} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
                <span style={lblCss}>{columns[ci + 1]}</span>
                <span style={{ fontSize: 13, color: "#222", textAlign: "right" }}>{c}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export function ToleranceMatrix(props) { return <WideTable {...props} />; }

/* ===== DefectRiskTable — проблема → что происходит → как закрываем ===== */
export function DefectRiskTable({ columns = [], rows = [] }) {
  return <MatrixTable columns={columns} rows={rows} highlightLast />;
}

/* ===== AcceptancePackage — что остаётся после этапа (3–4 колонки) ===== */
export function AcceptancePackage({ items = [] }) {
  const cls = items.length >= 4 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid grid-cols-1 sm:grid-cols-3";
  return (
    <div className={cls} style={gridBox}>
      {items.map((it, i) => (
        <div key={i} style={cell}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{it.title}</div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#333" }}>{it.text}</div>
        </div>
      ))}
      {gridFillers(items.length, items.length >= 4 ? 2 : 3, items.length >= 4 ? 4 : 3)}
    </div>
  );
}

/* ===== TabbedList — табы с маркированным списком ===== */
export function TabbedList({ tabs = [] }) {
  const [k, setK] = useState(tabs[0]?.key);
  const cur = tabs.find((t) => t.key === k) || tabs[0] || {};
  return (
    <div>
      <MiniTabs items={tabs.map((t) => ({ key: t.key, label: t.label }))} value={k} onChange={setK} />
      <div style={{ marginTop: 18, ...cardCss }}>
        <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
          {(cur.items || []).map((x, i) => <li key={i} style={{ fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222", marginBottom: 6 }}>{x}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* ===== 1. FinishRouteBoard (отделка) — маршрут помещения: строка этапов + детали ===== */
export function FinishRouteBoard({ stages = [] }) {
  const [a, setA] = useState(0);
  const F = [{ key: "do", label: "Что делаем" }, { key: "check", label: "Проверяем" }, { key: "mistake", label: "Ошибка" }, { key: "result", label: "Результат" }];
  return (
    <div>
      <div className="hidden md:flex" style={{ border: `1px solid ${INK}`, borderRadius: 10, overflow: "hidden" }}>
        {stages.map((s, i) => { const on = i === a; return (
          <button key={i} type="button" onMouseEnter={() => setA(i)} onClick={() => setA(i)} style={{ flex: 1, padding: "14px 12px", borderLeft: i ? "1px solid #d7d7d7" : "none", background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{pad(i)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, lineHeight: "16px" }}>{s.title}</div>
          </button>
        ); })}
      </div>
      <div className="md:hidden" style={{ display: "grid", rowGap: 8 }}>
        {stages.map((s, i) => { const on = i === a; return (
          <button key={i} type="button" onClick={() => setA(i)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", border: `1px solid ${INK}`, borderRadius: 10, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{pad(i)}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</span>
          </button>
        ); })}
      </div>
      <DetailCard node={stages[a]} fields={F} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
    </div>
  );
}

/* ===== 2. ConcreteCycleBoard (монолит) — цикл монолита: сетка стадий + детали ===== */
export function ConcreteCycleBoard({ steps = [] }) {
  const [a, setA] = useState(0);
  const F = [{ key: "do", label: "Выполняем" }, { key: "check", label: "Проверяем" }, { key: "risk", label: "Риск" }, { key: "ready", label: "Готово для перехода" }];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 8 }}>
        {steps.map((s, i) => { const on = i === a; return (
          <button key={i} type="button" onMouseEnter={() => setA(i)} onClick={() => setA(i)} style={{ padding: "14px 12px", border: `1px solid ${on ? INK : "#d7d7d7"}`, borderRadius: 10, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "left", minHeight: 78 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{pad(i)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, lineHeight: "16px" }}>{s.title}</div>
          </button>
        ); })}
      </div>
      <DetailCard node={steps[a]} fields={F} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
    </div>
  );
}

/* ===== 3. GroundSectionBoard (фундамент) — разрез основания: слои-аккордеон сверху вниз ===== */
export function GroundSectionBoard({ layers = [] }) {
  const [a, setA] = useState(0);
  const F = [{ key: "do", label: "Что делаем" }, { key: "check", label: "Проверяем" }, { key: "risk", label: "Риск" }, { key: "next", label: "Следующий шаг" }];
  return (
    <div>
      <div style={{ ...lblCss, marginBottom: 8, textAlign: "right" }}>поверхность ↑ · глубина ↓</div>
      <div style={{ border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden", background: BG }}>
        {layers.map((l, i) => { const on = i === a; return (
          <div key={i} style={{ borderTop: i ? "1px solid #e3e3e3" : "none" }}>
            <button type="button" onClick={() => setA(on ? -1 : i)} style={{ width: "100%", display: "grid", gridTemplateColumns: "48px 1fr 22px", gap: 12, alignItems: "center", padding: "14px 16px", background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pad(i)}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</span>
              <span style={{ fontSize: 16, opacity: 0.7, textAlign: "right" }}>{on ? "–" : "+"}</span>
            </button>
            {on && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 14, padding: "14px 16px" }}>
                {F.map((f) => <Field key={f.key} label={f.label} value={l[f.key]} />)}
              </div>
            )}
          </div>
        ); })}
      </div>
    </div>
  );
}

/* ===== 4. EnvelopeBoard (кровля/фасад) — оболочка: две панели + общий детальный вывод ===== */
export function EnvelopeBoard({ roof = [], facade = [] }) {
  const all = [...roof, ...facade];
  const [a, setA] = useState(0);
  const F = [{ key: "check", label: "Проверяем" }, { key: "risk", label: "Риск" }, { key: "result", label: "Результат" }];
  const Panel = ({ title, items, offset }) => (
    <div style={cardCss}>
      <div style={{ ...lblCss, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", rowGap: 8 }}>
        {items.map((it, i) => { const idx = offset + i; const on = idx === a; return (
          <button key={i} type="button" onMouseEnter={() => setA(idx)} onClick={() => setA(idx)} style={{ textAlign: "left", padding: "10px 12px", border: `1px solid ${on ? INK : "#d7d7d7"}`, borderRadius: 8, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", fontSize: 14, fontWeight: on ? 600 : 400 }}>{it.title}</button>
        ); })}
      </div>
    </div>
  );
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        <Panel title="Кровельный пирог" items={roof} offset={0} />
        <Panel title="Фасадный слой" items={facade} offset={roof.length} />
      </div>
      <DetailCard node={all[a]} fields={F} />
    </div>
  );
}

/* ===== 5. SpaceDividerBoard (перегородки) — сборка пространства: вертикальный маршрут ===== */
export function SpaceDividerBoard({ steps = [] }) {
  const F = [{ key: "do", label: "Что делаем" }, { key: "check", label: "Проверяем" }, { key: "mistake", label: "Ошибка" }, { key: "result", label: "Результат" }];
  return (
    <div style={{ ...cardCss, padding: "4px 16px 16px" }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, padding: "16px 0", alignItems: "start" }}>
            <span style={numCss}>{pad(i)}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 10 }}>{s.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 14 }}>
                {F.map((f) => <Field key={f.key} label={f.label} value={s[f.key]} />)}
              </div>
            </div>
          </div>
          {i < steps.length - 1 && <DottedDivider />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== 6. ReinforcementStrategyBoard (усиление) — карта дефекта → метод усиления ===== */
export function ReinforcementStrategyBoard({ problems = [] }) {
  const [a, setA] = useState(0);
  const cur = problems[a] || {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
      <div style={cardCss}>
        <div style={{ ...lblCss, marginBottom: 10 }}>Что происходит →</div>
        <div style={{ display: "grid", rowGap: 8 }}>
          {problems.map((p, i) => { const on = i === a; return (
            <button key={i} type="button" onMouseEnter={() => setA(i)} onClick={() => setA(i)} style={{ textAlign: "left", padding: "12px 12px", border: `1px solid ${on ? INK : "#d7d7d7"}`, borderRadius: 8, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", fontSize: 14, fontWeight: on ? 600 : 400 }}>{p.problem}</button>
          ); })}
        </div>
      </div>
      <div style={softCss}>
        <div style={{ ...lblCss, marginBottom: 6 }}>Как усиливаем</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: INK }}>{cur.method}</div>
        <div style={{ margin: "12px 0" }}><DottedDivider /></div>
        <div style={{ display: "grid", rowGap: 10 }}>
          <Field label="Что проверяем" value={cur.check} />
          <Field label="Тип решения" value={cur.solution} />
          <Field label="Риск без фиксации" value={cur.risk} />
        </div>
      </div>
    </div>
  );
}

/* ===== 7. SiteControlBoard (генподряд) — штаб объекта: панели + раскрытие ===== */
export function SiteControlBoard({ panels = [] }) {
  const [a, setA] = useState(0);
  const cur = panels[a] || {};
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 8 }}>
        {panels.map((p, i) => { const on = i === a; return (
          <button key={i} type="button" onMouseEnter={() => setA(i)} onClick={() => setA(i)} style={{ padding: "14px 12px", border: `1px solid ${on ? INK : "#d7d7d7"}`, borderRadius: 10, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{pad(i)}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{p.title}</div>
          </button>
        ); })}
      </div>
      <div style={{ marginTop: 12, ...cardCss }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 10 }}>{cur.title}</div>
        <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
          {(cur.items || []).map((x, i) => <li key={i} style={{ fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222", marginBottom: 6 }}>{x}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* ===== 8. CommissioningBoard (ПНР) — маршрут запуска по системам ===== */
export function CommissioningBoard({ systems = [] }) {
  const [a, setA] = useState(0);
  const cur = systems[a] || {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
      <div style={{ display: "grid", rowGap: 8, alignContent: "start" }}>
        {systems.map((s, i) => { const on = i === a; return (
          <button key={i} type="button" onClick={() => setA(i)} style={{ textAlign: "left", padding: "12px 14px", border: `1px solid ${on ? INK : "#d7d7d7"}`, borderRadius: 10, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{s.name}</button>
        ); })}
      </div>
      <div className="md:col-span-2" style={cardCss}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: INK }}>{cur.name}</span>
          <span style={lblCss}>Маршрут запуска</span>
        </div>
        <div style={{ margin: "12px 0" }}><DottedDivider /></div>
        <div style={{ display: "grid", rowGap: 10 }}>
          {(cur.stages || []).map((st, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 12, alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{pad(i)}</span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{st.title}</span>
                {st.note && <span style={{ fontSize: 13, fontWeight: 300, color: "#555" }}> — {st.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
