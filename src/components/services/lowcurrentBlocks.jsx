// src/components/services/lowcurrentBlocks.jsx
// Signature-блоки для тела детальных страниц «Слаботочные системы».
// Слаботочка ≠ электромонтаж: сигналы, порты, зоны, роли, события, маршруты данных.
// Только inline-стили + токены проекта; Tailwind-классы — лишь для адаптивных сеток.
import React from "react";
import { UI, BG, INK, MUTED, DottedDivider, DetailStatGrid, MiniTabs, gridFillers } from "@/components/services/detailBlocks.jsx";

const gridBox = { border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden", gap: 1, background: INK };
const cell = { background: BG, padding: 16 };
const cardCss = { border: `1px solid ${INK}`, borderRadius: 12, background: BG, padding: 16 };
const tagCss = { display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid #cfcfcf", fontSize: 13, fontWeight: 600, color: INK, whiteSpace: "nowrap" };
const lblCss = { fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 };
const valCss = { marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" };
const mutedStatus = (s) => s === "запрещён" || s === "не требуется";

function Field({ label, value }) {
  return (
    <div>
      <div style={lblCss}>{label}</div>
      <div style={valCss}>{value}</div>
    </div>
  );
}
function Bullets({ items = [] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
      {items.map((x, i) => (
        <li key={i} style={{ fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222", marginBottom: 6 }}>{x}</li>
      ))}
    </ul>
  );
}
function FlowArrow() {
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
      <span className="lg:hidden" style={{ fontSize: 18, lineHeight: 1 }}>↓</span>
      <span className="hidden lg:inline" style={{ fontSize: 18, lineHeight: 1 }}>→</span>
    </div>
  );
}
function VConnector() {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", color: "#999" }}>
      <div style={{ width: 1, height: 16, backgroundImage: "repeating-linear-gradient(to bottom, #000 0 1px, rgba(0,0,0,0) 1px 6px)" }} />
      <span style={{ fontSize: 12, lineHeight: 1, marginTop: 2 }}>▼</span>
    </div>
  );
}

/* ===== 1. SignalStatGrid — те же 4 ячейки, но язык про сигналы (обёртка над DetailStatGrid) ===== */
export function SignalStatGrid(props) {
  return <DetailStatGrid {...props} />;
}

/* ===== PatchPanel (СКС) — карта портов: занят / свободен / резерв ===== */
function Legend({ swatch, text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, ...swatch }} />{text}
    </span>
  );
}
export function PatchPanel({ ports = [] }) {
  return (
    <div style={cardCss}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ports.map((p, i) => {
          const used = p.state === "used";
          const reserve = p.state === "reserve";
          return (
            <div key={i} title={p.label || ""} style={{
              width: 34, height: 34, borderRadius: 6,
              border: `1px ${reserve ? "dashed" : "solid"} ${used ? INK : "#cfcfcf"}`,
              background: used ? INK : "transparent",
              color: used ? "#fff" : "#888",
              display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums",
            }}>{p.n}</div>
          );
        })}
      </div>
      <div style={{ margin: "14px 0 12px" }}><DottedDivider /></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 12, color: "#555" }}>
        <Legend swatch={{ background: INK }} text="Занят" />
        <Legend swatch={{ border: "1px solid #cfcfcf" }} text="Свободен" />
        <Legend swatch={{ border: "1px dashed #cfcfcf" }} text="Резерв" />
      </div>
    </div>
  );
}

/* ===== 2. TopologyBoard (СКС, ЛВС) — цепочка узлов с подписанными полями ===== */
export function TopologyBoard({ nodes = [] }) {
  return (
    <div>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          <div style={cardCss}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: INK }}>{n.title}</span>
            </div>
            <div style={{ margin: "12px 0" }}><DottedDivider /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 14 }}>
              {(n.fields || []).map((f, fi) => <Field key={fi} label={f.label} value={f.value} />)}
            </div>
          </div>
          {i < nodes.length - 1 && <VConnector />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== 3. PortPassportTable (СКС, серверные) — инженерная таблица; на мобиле → карточки ===== */
export function PortPassportTable({ columns = [], rows = [] }) {
  const n = columns.length;
  const cols = `repeat(${n}, minmax(0, 1fr))`;
  return (
    <div style={cardCss}>
      {/* desktop / tablet */}
      <div className="hidden sm:block">
        <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: 14, ...lblCss, paddingBottom: 10 }}>
          {columns.map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <DottedDivider />
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: 14, alignItems: "center", padding: "12px 0", fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>
              {r.map((c, ci) => ci === 0
                ? <span key={ci} style={{ fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{c}</span>
                : <span key={ci}>{c}</span>)}
            </div>
            {ri < rows.length - 1 && <DottedDivider />}
          </React.Fragment>
        ))}
      </div>
      {/* mobile cards */}
      <div className="sm:hidden" style={{ display: "grid", rowGap: 12 }}>
        {rows.map((r, ri) => (
          <div key={ri} style={{ border: "1px solid #e3e3e3", borderRadius: 10, padding: 12 }}>
            {r.map((c, ci) => (
              <div key={ci} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
                <span style={lblCss}>{columns[ci]}</span>
                <span style={{ fontSize: 13, fontWeight: ci === 0 ? 700 : 300, color: "#222", textAlign: "right" }}>{c}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 4. CoverageBoard (CCTV) — инженерная сетка зон наблюдения ===== */
export function CoverageBoard({ zones = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={gridBox}>
      {zones.map((z, i) => (
        <div key={i} style={cell}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{z.zone}</div>
          <div style={{ margin: "10px 0" }}><DottedDivider /></div>
          <div style={{ display: "grid", rowGap: 8 }}>
            <Field label="Цель" value={z.goal} />
            <Field label="Обзор" value={z.view} />
            <Field label="Важно" value={z.care} />
            <Field label="Ошибка" value={z.mistake} />
          </div>
        </div>
      ))}
      {gridFillers(zones.length, 2, 3)}
    </div>
  );
}

/* ===== 5. SignalTabs / CameraScenarioTabs — табы с маркированным списком ===== */
export function SignalTabs({ tabs = [] }) {
  const [k, setK] = React.useState(tabs[0]?.key);
  const cur = tabs.find((t) => t.key === k) || tabs[0] || {};
  return (
    <div>
      <MiniTabs items={tabs.map((t) => ({ key: t.key, label: t.label }))} value={k} onChange={setK} />
      <div key={k} className="animate-svcfade" style={{ marginTop: 18, ...cardCss }}>
        <Bullets items={cur.items || []} />
      </div>
    </div>
  );
}
export const CameraScenarioTabs = SignalTabs;

/* ===== 6. DeviceLoopBoard (ОПС) — единый контур системы со стадиями ===== */
export function DeviceLoopBoard({ nodes = [] }) {
  return (
    <div style={cardCss}>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 14, padding: "14px 0", alignItems: "start" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 8 }}>{n.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
                <Field label="Отвечает" value={n.role} />
                <Field label="Проверяем" value={n.check} />
                <Field label="Дальше" value={n.next} />
              </div>
            </div>
          </div>
          {i < nodes.length - 1 && <DottedDivider />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== 7. AccessMatrix (СКУД) — роли × зоны, текстовые статусы; на мобиле → карточки ===== */
export function AccessMatrix({ zones = [], rows = [] }) {
  const n = zones.length;
  const cols = `minmax(108px, 1.3fr) repeat(${n}, minmax(0, 1fr))`;
  return (
    <div style={cardCss}>
      <div className="hidden lg:block">
        <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: 10, alignItems: "end" }}>
          <span style={lblCss}>Роль / Зона</span>
          {zones.map((z, i) => <span key={i} style={{ ...lblCss, textAlign: "center" }}>{z}</span>)}
        </div>
        <div style={{ margin: "10px 0" }}><DottedDivider /></div>
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: 10, alignItems: "center", padding: "12px 0" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{r.role}</span>
              {r.cells.map((c, ci) => (
                <span key={ci} style={{ textAlign: "center", fontSize: 12.5, color: mutedStatus(c) ? "#9a9a9a" : "#222" }}>{c}</span>
              ))}
            </div>
            {ri < rows.length - 1 && <DottedDivider />}
          </React.Fragment>
        ))}
      </div>
      {/* mobile + планшет — карточки (матрица тесная на узком) */}
      <div className="lg:hidden" style={{ display: "grid", rowGap: 12 }}>
        {rows.map((r, ri) => (
          <div key={ri} style={{ border: "1px solid #e3e3e3", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>{r.role}</div>
            {r.cells.map((c, ci) => (
              <div key={ci} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
                <span style={lblCss}>{zones[ci]}</span>
                <span style={{ fontSize: 13, color: mutedStatus(c) ? "#9a9a9a" : "#222" }}>{c}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 8. CallRouteBoard (Домофония) — таймлайн маршрута вызова ===== */
export function CallRouteBoard({ steps = [] }) {
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 30, height: 30, borderRadius: 999, border: `1px solid ${INK}`, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
            {i < steps.length - 1 && <div style={{ flex: 1, width: 1, minHeight: 18, marginTop: 4, backgroundImage: "repeating-linear-gradient(to bottom,#000 0 1px,rgba(0,0,0,0) 1px 6px)" }} />}
          </div>
          <div style={{ ...cardCss, marginBottom: i < steps.length - 1 ? 14 : 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 8 }}>{s.title}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
              <Field label="Происходит" value={s.happens} />
              <Field label="Проверяем" value={s.check} />
              <Field label="Ошибка" value={s.mistake} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== 9. RackElevation (Серверные) — монохромная стойка 19″ по зонам ===== */
export function RackElevation({ zones = [] }) {
  return (
    <div className="max-w-[760px] md:max-w-none lg:max-w-[760px]" style={{ border: `1px solid ${INK}`, borderRadius: 12, background: BG, overflow: "hidden" }}>
      <div style={{ padding: "8px 16px", ...lblCss, fontSize: 12, borderBottom: `1px solid ${INK}`, background: "#efefef" }}>Стойка 19″</div>
      {zones.map((z, i) => (
        <div key={i} style={{ borderBottom: i < zones.length - 1 ? "1px solid #e3e3e3" : "none", padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 10 }}>{z.zone}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
            <Field label="Размещается" value={z.holds} />
            <Field label="Проверяем" value={z.check} />
            <Field label="Эксплуатации" value={z.ops} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== 10. NetworkCoreMap (ЛВС) — топология ядра + конечные устройства ===== */
export function NetworkCoreMap({ nodes = [], endpoints = [] }) {
  return (
    <div>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(120px,210px)_1fr]" style={cardCss}>
            <div>
              <div style={lblCss}>Узел {String(i + 1).padStart(2, "0")}</div>
              <div style={{ marginTop: 4, fontSize: 17, fontWeight: 600, color: INK }}>{n.title}</div>
            </div>
            <div style={{ display: "grid", rowGap: 8 }}>
              <Field label="Отвечает" value={n.role} />
              <Field label="Проверяем" value={n.check} />
              <Field label="Ошибка" value={n.mistake} />
            </div>
          </div>
          {i < nodes.length - 1 && <VConnector />}
        </React.Fragment>
      ))}
      {endpoints.length > 0 && (
        <>
          <VConnector />
          <div style={cardCss}>
            <div style={{ ...lblCss, marginBottom: 10 }}>Конечные устройства</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {endpoints.map((e, i) => <span key={i} style={tagCss}>{e}</span>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ===== 11. SoundZoneMatrix (Оповещение) — зоны × сценарии, текстовые статусы; мобиле → карточки ===== */
export function SoundZoneMatrix({ columns = [], rows = [] }) {
  const n = columns.length;
  const grid = `minmax(96px, 1.1fr) repeat(${n - 1}, minmax(0, 1fr))`;
  return (
    <div style={cardCss}>
      <div className="hidden lg:block">
        <div style={{ display: "grid", gridTemplateColumns: grid, columnGap: 12, ...lblCss, paddingBottom: 10 }}>
          {columns.map((c, i) => <span key={i} style={i > 0 && i < n - 1 ? { textAlign: "center" } : undefined}>{c}</span>)}
        </div>
        <DottedDivider />
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: grid, columnGap: 12, alignItems: "center", padding: "12px 0", fontSize: 13.5, fontWeight: 300, color: "#222" }}>
              {r.map((c, ci) => ci === 0
                ? <span key={ci} style={{ fontWeight: 600, color: INK }}>{c}</span>
                : <span key={ci} style={ci < n - 1 ? { textAlign: "center", color: mutedStatus(c) ? "#9a9a9a" : "#222" } : undefined}>{c}</span>)}
            </div>
            {ri < rows.length - 1 && <DottedDivider />}
          </React.Fragment>
        ))}
      </div>
      {/* mobile + планшет — карточки (матрица тесная на узком) */}
      <div className="lg:hidden" style={{ display: "grid", rowGap: 12 }}>
        {rows.map((r, ri) => (
          <div key={ri} style={{ border: "1px solid #e3e3e3", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>{r[0]}</div>
            {r.slice(1).map((c, ci) => (
              <div key={ci} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
                <span style={lblCss}>{columns[ci + 1]}</span>
                <span style={{ fontSize: 13, color: mutedStatus(c) ? "#9a9a9a" : "#222", textAlign: "right" }}>{c}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 12. EventFlow — универсальная цепочка события: сигнал → обработка → действие → фиксация ===== */
export function EventFlow({ steps = [] }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch" style={{ gap: 10 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div data-reveal style={{ flex: 1, ...cardCss, ["--rd"]: `${i * 90}ms` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: INK }}>{s.title}</div>
            {s.happens && (
              <div style={{ marginTop: 8 }}>
                <div style={lblCss}>Происходит</div>
                <div style={{ fontSize: 13, lineHeight: "18px", fontWeight: 300, color: "#333" }}>{s.happens}</div>
              </div>
            )}
            {s.check && (
              <div style={{ marginTop: 6 }}>
                <div style={lblCss}>Проверяем</div>
                <div style={{ fontSize: 13, lineHeight: "18px", fontWeight: 300, color: "#333" }}>{s.check}</div>
              </div>
            )}
          </div>
          {i < steps.length - 1 && <FlowArrow />}
        </React.Fragment>
      ))}
    </div>
  );
}
