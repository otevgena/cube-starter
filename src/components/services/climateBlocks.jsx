// src/components/services/climateBlocks.jsx
// Климат-системы как «инженерный паспорт системы»: строгие таблицы/регистры + у каждой услуги
// свой сдержанный signature-блок (баланс-бары, плитки зон, контурная лента, маршруты сигналов,
// схема трассы). Монохром, прямоугольники, тонкие border, пунктир — стиль Cube. Без воронок/колец/кругов.
// Только inline-стили + токены проекта; Tailwind-классы — лишь для адаптивных сеток.
import React, { useState } from "react";
import { UI, BG, INK, MUTED, DottedDivider, DetailStatGrid, MatrixTable, MiniTabs } from "@/components/services/detailBlocks.jsx";

const cardCss = { border: `1px solid ${INK}`, borderRadius: 12, background: BG, padding: 16 };
const cell = { background: BG, padding: 16 };
const gridBox = { border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden", gap: 1, background: INK };
const lblCss = { fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 };
const numCss = { fontSize: 18, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" };
const tagCss = { display: "inline-flex", alignItems: "center", height: 26, padding: "0 10px", borderRadius: 999, border: "1px solid #cfcfcf", fontSize: 12, fontWeight: 600, color: INK, whiteSpace: "nowrap" };
const chip = { display: "inline-flex", alignItems: "center", height: 34, padding: "0 14px", borderRadius: 10, border: `1px solid ${INK}`, background: BG, fontSize: 13, fontWeight: 600, color: INK, whiteSpace: "nowrap" };
const chipDark = { ...chip, background: INK, color: "#fff" };
const pad = (i) => String(i + 1).padStart(2, "0");

function Field({ label, value }) {
  return (
    <div>
      <div style={lblCss}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{value}</div>
    </div>
  );
}

/* ===== ClimateStatGrid ===== */
export function ClimateStatGrid(props) { return <DetailStatGrid {...props} />; }

/* ===== Базовая широкая таблица: desktop — сетка, mobile — карточки ===== */
function WideTable({ columns = [], rows = [] }) {
  const n = columns.length;
  const grid = `minmax(96px, 1.2fr) repeat(${n - 1}, minmax(0, 1fr))`;
  return (
    <div style={cardCss}>
      <div className="hidden md:block">
        <div style={{ display: "grid", gridTemplateColumns: grid, columnGap: 12, ...lblCss, paddingBottom: 10 }}>
          {columns.map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <DottedDivider />
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: grid, columnGap: 12, alignItems: "start", padding: "13px 0", fontSize: 13.5, lineHeight: "19px", fontWeight: 300, color: "#222" }}>
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
export function SystemRegister(props) { return <WideTable {...props} />; }
export function ZoneBalanceTable(props) { return <WideTable {...props} />; }
export function EquipmentSchedule(props) { return <WideTable {...props} />; }
export function MeasurementProtocol(props) { return <WideTable {...props} />; }
export function ServiceJournal(props) { return <WideTable {...props} />; }

/* ===== CriticalCheckMatrix — проблема → что происходит → как закрываем ===== */
export function CriticalCheckMatrix({ columns = [], rows = [] }) {
  return <MatrixTable columns={columns} rows={rows} highlightLast />;
}

/* ===== ResultPackage — итог: 3–4 колонки ===== */
export function ResultPackage({ items = [] }) {
  const cls = items.length >= 4 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid grid-cols-1 sm:grid-cols-3";
  return (
    <div className={cls} style={gridBox}>
      {items.map((it, i) => (
        <div key={i} style={cell}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{it.title}</div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#333" }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ===== SIGNATURE 1 — AirBalanceBoard (вентиляция): приток/вытяжка как баланс-бар ===== */
export function AirBalanceBoard({ zones = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
      {zones.map((z, i) => (
        <div key={i} style={cardCss}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{z.zone}</span>
            <span style={lblCss}>{pad(i)}</span>
          </div>
          <div style={{ marginTop: 12, display: "flex", height: 36, border: `1px solid ${INK}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ flex: 1, background: INK, color: "#fff", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 12, fontWeight: 600, minWidth: 0 }}>
              <span>Приток</span><span style={{ marginLeft: "auto", fontWeight: 300, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.supply}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 12, fontWeight: 600, color: INK, borderLeft: `1px solid ${INK}`, minWidth: 0 }}>
              <span style={{ fontWeight: 300, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.exhaust}</span><span style={{ marginLeft: "auto" }}>Вытяжка</span>
            </div>
          </div>
          <div style={{ margin: "12px 0" }}><DottedDivider /></div>
          <div style={{ display: "grid", rowGap: 8 }}>
            <Field label="Что проверяем" value={z.check} />
            <Field label="Частая ошибка" value={z.mistake} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== SIGNATURE 2 — ZoneTiles (VRF/VRV): плитки зон с типом блока ===== */
export function ZoneTiles({ zones = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={gridBox}>
      {zones.map((z, i) => (
        <div key={i} style={cell}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{z.zone}</span>
            <span style={tagCss}>{z.unit}</span>
          </div>
          <div style={{ margin: "10px 0" }}><DottedDivider /></div>
          <div style={{ display: "grid", rowGap: 8 }}>
            <Field label="Управление" value={z.control} />
            <Field label="Что важно" value={z.important} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== SIGNATURE 3 — NodeChainRail (чиллер): пронумерованный контур узлов ===== */
export function NodeChainRail({ nodes = [], loopNote }) {
  const F = [{ key: "fn", label: "Функция" }, { key: "check", label: "Проверяем" }, { key: "risk", label: "Риск" }];
  return (
    <div style={{ ...cardCss, padding: "4px 16px 16px" }}>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, padding: "16px 0", alignItems: "start" }}>
            <span style={numCss}>{pad(i)}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 8 }}>{n.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
                {F.map((f) => <Field key={f.key} label={f.label} value={n[f.key]} />)}
              </div>
            </div>
          </div>
          {i < nodes.length - 1 && <DottedDivider />}
        </React.Fragment>
      ))}
      {loopNote && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e3e3e3", fontSize: 12, color: "#777" }}>↺ {loopNote}</div>
      )}
    </div>
  );
}

/* ===== SIGNATURE 4 — SignalRouteBoard (автоматика): датчик → контроллер → действие ===== */
export function SignalRouteBoard({ rows = [] }) {
  const Arrow = () => <span aria-hidden="true" style={{ color: "#999", fontSize: 14 }}>→</span>;
  return (
    <div style={{ ...cardCss, padding: "4px 16px 16px" }}>
      {rows.map((r, i) => (
        <React.Fragment key={i}>
          <div style={{ padding: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={chip}>{r.sensor}</span>
              <Arrow />
              <span style={chip}>Контроллер</span>
              <Arrow />
              <span style={chipDark}>{r.action}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginTop: 12 }}>
              <Field label="Где используется" value={r.where} />
              <Field label="Что проверяем" value={r.check} />
            </div>
          </div>
          {i < rows.length - 1 && <DottedDivider />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== SIGNATURE 5 — DuctRunStrip (воздуховоды): схема трассы сегментами ===== */
export function DuctRunStrip({ segments = [] }) {
  return (
    <div>
      <div className="hidden md:block">
        <div style={{ display: "flex", border: `1px solid ${INK}`, borderRadius: 10, overflow: "hidden" }}>
          {segments.map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 12px", borderLeft: i ? "1px solid #d7d7d7" : "none", background: BG }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", fontVariantNumeric: "tabular-nums" }}>{pad(i)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginTop: 3, lineHeight: "16px" }}>{s.title}</div>
              <div style={{ fontSize: 11.5, color: "#666", marginTop: 4, lineHeight: "15px" }}>{s.note}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: "#999", textAlign: "center" }}>магистраль → решётка → датчик</div>
      </div>
      <div className="md:hidden" style={{ display: "grid", rowGap: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, border: "1px solid #e3e3e3", borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#999" }}>{pad(i)}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{s.title}</div>
              <div style={{ fontSize: 12.5, color: "#555", marginTop: 3 }}>{s.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== TabbedList — лёгкие табы с маркированным списком ===== */
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
