// src/components/services/designBlocks.jsx
// «PROJECT OS» — signature-панели для тела детальных страниц «Проектирование».
// У каждой услуги свой уникальный первый блок (компилятор нагрузок, координационный разрез,
// атлас систем, логическая машина, защитная оболочка, воронка стоимости, доска отклонений,
// документальный коридор). Строгий Cube: монохром, 1px border, пунктир, без цвета/иконок/градиентов.
// Только inline-стили + токены проекта; Tailwind — лишь для адаптивных сеток. Тонкие связи — текстом «→».
import React, { useState } from "react";
import { UI, BG, INK, MUTED, DottedDivider, DetailStatGrid, MatrixTable, MiniTabs } from "@/components/services/detailBlocks.jsx";

const lblCss = { fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 };
const valCss = { marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" };
const cardCss = { border: `1px solid ${INK}`, borderRadius: 12, background: BG, padding: 16 };
const softCss = { border: `1px solid ${INK}`, borderRadius: 12, background: "#f1f1f1", padding: 16 };
const pad = (i) => String(i + 1).padStart(2, "0");

function Field({ label, value }) {
  return (
    <div>
      <div style={lblCss}>{label}</div>
      <div style={valCss}>{value}</div>
    </div>
  );
}
function DetailCard({ node, fields }) {
  if (!node) return null;
  return (
    <div style={{ marginTop: 12, ...softCss }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 10 }}>{node.title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 14 }}>
        {fields.map((f) => <Field key={f.key} label={f.label} value={node[f.key]} />)}
      </div>
    </div>
  );
}

/* ===== ProjectStatGrid — 4 инженерные ячейки ===== */
export function ProjectStatGrid(props) { return <DetailStatGrid {...props} />; }

/* ===== Широкая таблица: desktop — сетка, mobile — карточки ===== */
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
/* вторичные таблицы направления */
export function ConflictMatrix(props) { return <WideTable {...props} />; }
export function IOMatrix(props) { return <WideTable {...props} />; }
export function SupervisionLog(props) { return <WideTable {...props} />; }
export function CommentResolutionBoard(props) { return <WideTable {...props} />; }

/* ===== ProjectRiskMatrix — ошибка → что ломается → как проверяем ===== */
export function ProjectRiskMatrix({ columns = [], rows = [] }) {
  return <MatrixTable columns={columns} rows={rows} highlightLast />;
}

/* ===== DocumentStamp — маленький штамп статуса ===== */
export function DocumentStamp({ text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", border: `1px solid ${INK}`, borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: INK, whiteSpace: "nowrap", boxShadow: `inset 0 0 0 2px ${BG}, inset 0 0 0 3px ${INK}` }}>{text}</span>
  );
}

/* ===== VersionStrip — версии: v01 → v02 → выпуск ===== */
export function VersionStrip({ items = [] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 14px", border: `1px solid ${INK}`, borderRadius: 10, background: BG }}>
            {it.v && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: INK, borderRadius: 5, padding: "2px 6px", fontVariantNumeric: "tabular-nums" }}>{it.v}</span>}
            <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{it.label}</span>
          </div>
          {i < items.length - 1 && <span aria-hidden="true" style={{ color: "#999" }}>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== ChainStrip — цепочка чипов с → (маршрут точка→спецификация, реестр листов и т.п.) ===== */
export function ChainStrip({ items = [] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {items.map((t, i) => (
        <React.Fragment key={i}>
          <span style={{ display: "inline-flex", alignItems: "center", height: 42, padding: "0 16px", border: `1px solid ${INK}`, borderRadius: 10, background: BG, fontSize: 13, fontWeight: 600, color: INK }}>{t}</span>
          {i < items.length - 1 && <span aria-hidden="true" style={{ color: "#999" }}>→</span>}
        </React.Fragment>
      ))}
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

/* ===== 1. LoadCompilerBoard (ЭОМ) — компилятор нагрузок: вход → логика → выход + след ===== */
export function LoadCompilerBoard({ inputs = [], logic = [], outputs = [], traces = [] }) {
  const [a, setA] = useState(0);
  const Zone = ({ title, items, selectable }) => (
    <div style={cardCss}>
      <div style={{ ...lblCss, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", rowGap: 8 }}>
        {items.map((it, i) => selectable ? (
          <button key={i} type="button" onMouseEnter={() => setA(i)} onClick={() => setA(i)}
            style={{ textAlign: "left", padding: "10px 12px", border: `1px solid ${i === a ? INK : "#d7d7d7"}`, borderRadius: 8, background: i === a ? INK : BG, color: i === a ? "#fff" : INK, fontSize: 14, fontWeight: i === a ? 600 : 400, cursor: "pointer", transition: "background-color .14s ease, color .14s ease" }}>{it}</button>
        ) : (
          <div key={i} style={{ padding: "10px 12px", border: "1px solid #e3e3e3", borderRadius: 8, fontSize: 14, color: "#222" }}>{it}</div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
        <Zone title="Входные нагрузки →" items={inputs} selectable />
        <Zone title="Логика распределения →" items={logic} />
        <Zone title="Выход проекта" items={outputs} />
      </div>
      <div style={{ marginTop: 12, ...softCss }}>
        <div style={{ ...lblCss, marginBottom: 8 }}>Проектный след</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: INK, lineHeight: "24px" }}>{traces[a]}</div>
      </div>
    </div>
  );
}

/* ===== 2. CoordinationXrayBoard (ОВ/ВК) — координационный разрез (слои-аккордеон) ===== */
export function CoordinationXrayBoard({ layers = [] }) {
  const [a, setA] = useState(0);
  const F = [{ key: "check", label: "Проверяем" }, { key: "conflict", label: "Конфликт" }, { key: "result", label: "Результат" }];
  return (
    <div style={{ border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden", background: BG }}>
      {layers.map((l, i) => {
        const on = i === a;
        return (
          <div key={i} style={{ borderTop: i ? "1px solid #e3e3e3" : "none" }}>
            <button type="button" onClick={() => setA(on ? -1 : i)}
              style={{ width: "100%", display: "grid", gridTemplateColumns: "48px 1fr 22px", gap: 12, alignItems: "center", padding: "14px 16px", background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pad(i)}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</span>
              <span style={{ fontSize: 16, opacity: 0.7, textAlign: "right" }}>{on ? "–" : "+"}</span>
            </button>
            {on && (
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 14, padding: "14px 16px" }}>
                {F.map((f) => <Field key={f.key} label={f.label} value={l[f.key]} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== 3. LowcurrentAtlasBoard (СС) — атлас: слева системы, справа паспорт ===== */
export function LowcurrentAtlasBoard({ systems = [] }) {
  const [a, setA] = useState(0);
  const cur = systems[a] || {};
  const rows = [["Точки", "points"], ["Трассы", "routes"], ["Узлы", "nodes"], ["Листы", "sheets"], ["Спецификация", "spec"], ["Главный риск", "risk"]];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
      <div style={{ display: "grid", rowGap: 8, alignContent: "start" }}>
        {systems.map((s, i) => (
          <button key={i} type="button" onClick={() => setA(i)}
            style={{ textAlign: "left", padding: "12px 14px", border: `1px solid ${i === a ? INK : "#d7d7d7"}`, borderRadius: 10, background: i === a ? INK : BG, color: i === a ? "#fff" : INK, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background-color .14s ease, color .14s ease" }}>{s.name}</button>
        ))}
      </div>
      <div className="md:col-span-2" style={{ ...cardCss }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: INK }}>{cur.name}</span>
          <span style={lblCss}>Паспорт системы</span>
        </div>
        <div style={{ margin: "12px 0" }}><DottedDivider /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
          {rows.map(([label, key]) => <Field key={key} label={label} value={cur[key]} />)}
        </div>
      </div>
    </div>
  );
}

/* ===== 4. LogicMachineBoard (АСУ ТП) — сигналы / алгоритм / действия + сценарии ===== */
export function LogicMachineBoard({ signals = [], scenarios = [] }) {
  const [m, setM] = useState(scenarios[0]?.key);
  const cur = scenarios.find((s) => s.key === m) || scenarios[0] || {};
  const Col = ({ title, items, accent }) => (
    <div style={{ ...cardCss, ...(accent ? { background: "#f1f1f1" } : null) }}>
      <div style={{ ...lblCss, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", rowGap: 8 }}>
        {(items || []).map((x, i) => <div key={i} style={{ fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{x}</div>)}
      </div>
    </div>
  );
  return (
    <div>
      <MiniTabs items={scenarios.map((s) => ({ key: s.key, label: s.label }))} value={m} onChange={setM} />
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12, marginTop: 14 }}>
        <Col title="Сигналы →" items={signals} />
        <Col title="Алгоритм →" items={cur.logic} accent />
        <Col title="Действия" items={cur.actions} />
      </div>
    </div>
  );
}

/* ===== 5. ProtectionEnvelopeBoard (молниезащита) — защитная оболочка вокруг объекта ===== */
export function ProtectionEnvelopeBoard({ elements = [] }) {
  // порядок: 0 Зоны защиты, 1 Молниеприёмники, 2 Токоотводы, 3 Контур заземления, 4 ГЗШ, 5 Узлы, 6 Спецификация
  const [a, setA] = useState(1);
  const B = ({ idx }) => {
    const on = idx === a; const el = elements[idx] || {};
    return (
      <button type="button" onMouseEnter={() => setA(idx)} onClick={() => setA(idx)}
        style={{ width: "100%", padding: "12px 10px", border: `1px solid ${on ? INK : "#d7d7d7"}`, borderRadius: 8, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", textAlign: "center", transition: "background-color .14s ease, color .14s ease" }}>
        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, display: "block", fontVariantNumeric: "tabular-nums" }}>{pad(idx)}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{el.title}</span>
      </button>
    );
  };
  return (
    <div>
      <div style={{ border: `1px solid ${INK}`, borderRadius: 12, padding: 16, background: BG, display: "grid", rowGap: 10 }}>
        <B idx={0} />
        <B idx={1} />
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10, alignItems: "stretch" }}>
          <B idx={2} />
          <div style={{ display: "grid", placeItems: "center", border: `1px dashed ${INK}`, borderRadius: 8, padding: "18px 12px", fontSize: 13, fontWeight: 600, color: INK }}>Объект</div>
          <B idx={2} />
        </div>
        <B idx={3} />
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10 }}>
          <B idx={4} />
          <B idx={5} />
          <B idx={6} />
        </div>
      </div>
      <DetailCard node={elements[a]} fields={[{ key: "design", label: "Проектируем" }, { key: "check", label: "Проверяем" }, { key: "sheet", label: "Лист / результат" }]} />
    </div>
  );
}

/* ===== 6. CostFunnelBoard (сметы) — строгая воронка стоимости ===== */
export function CostFunnelBoard({ levels = [] }) {
  const [a, setA] = useState(0);
  const n = levels.length;
  return (
    <div>
      <div style={{ display: "grid", rowGap: 8, justifyItems: "center" }}>
        {levels.map((l, i) => {
          const w = Math.round(100 - (i * (100 - 56)) / (n - 1));
          const on = i === a;
          return (
            <button key={i} type="button" onMouseEnter={() => setA(i)} onClick={() => setA(i)}
              style={{ width: `${w}%`, minWidth: 210, maxWidth: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `1px solid ${INK}`, borderRadius: 8, background: on ? INK : BG, color: on ? "#fff" : INK, cursor: "pointer", transition: "background-color .14s ease, color .14s ease" }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pad(i)}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{l.title}</span>
            </button>
          );
        })}
      </div>
      <DetailCard node={levels[a]} fields={[{ key: "has", label: "Что входит" }, { key: "check", label: "Проверяем" }, { key: "err", label: "Ошибка" }]} />
    </div>
  );
}

/* ===== 7. FieldIssueBoard (авторский надзор) — доска отклонений (монохром, не Trello) ===== */
export function FieldIssueBoard({ columns = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 10 }}>
      {columns.map((c, i) => (
        <div key={i} style={{ border: `1px solid ${INK}`, borderRadius: 10, background: BG, overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${INK}`, background: "#efefef", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#999", fontVariantNumeric: "tabular-nums" }}>{pad(i)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: INK }}>{c.title}</span>
          </div>
          <div style={{ padding: 10, display: "grid", rowGap: 8 }}>
            {(c.cards || []).map((cd, j) => (
              <div key={j} style={{ border: "1px solid #e3e3e3", borderRadius: 8, padding: "10px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: "17px" }}>{cd.name}</div>
                {cd.ref && <div style={{ marginTop: 4, fontSize: 11.5, color: "#777" }}>{cd.ref}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== 8. ApprovalPipelineBoard (согласования) — документальный коридор из ячеек-папок ===== */
export function ApprovalPipelineBoard({ stages = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 10 }}>
      {stages.map((s, i) => (
        <div key={i} style={{ border: `1px solid ${INK}`, borderRadius: 10, background: BG, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: INK }}>{pad(i)}</span>
            <DocumentStamp text={s.status} />
          </div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: INK }}>{s.title}</div>
          <div style={{ margin: "10px 0" }}><DottedDivider /></div>
          <div style={{ display: "grid", rowGap: 8 }}>
            <Field label="Что внутри" value={s.inside} />
            <Field label="Проверяем" value={s.check} />
          </div>
        </div>
      ))}
    </div>
  );
}
