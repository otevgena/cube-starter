// src/components/services/detailBlocks.jsx
// Нейтральные блоки для ТЕЛА детальных страниц «Электромонтаж».
// НЕ шаблон страницы — каждая страница сама решает, какие блоки и в каком порядке.
// Только inline-стили + токены проекта (Tailwind-классы — лишь для адаптивной сетки).
import React from "react";
import SpaLink from "@/components/common/SpaLink.jsx";

/* ===== токены ===== */
export const UI = "'Inter Tight','Inter',system-ui";
export const BG = "#f8f8f8";
export const INK = "#111";
export const MUTED = "#6b7280";

/* ===== 2. DottedDivider ===== */
export function DottedDivider({ size = "100%", vertical = false }) {
  const grad = vertical
    ? "repeating-linear-gradient(to bottom, #000 0 1px, rgba(0,0,0,0) 1px 9px)"
    : "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)";
  return (
    <div aria-hidden="true" style={vertical ? { width: 1, height: size, backgroundImage: grad } : { width: size, height: 1, backgroundImage: grad }} />
  );
}

/* капсульная кнопка/ссылка: контур → чёрная заливка на hover */
export function Capsule({ to, onClick, children, as = "link" }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    height: 42, padding: "0 18px", borderRadius: 12, border: `1px solid ${INK}`,
    background: "transparent", color: INK, fontFamily: UI, fontSize: 14, fontWeight: 400,
    cursor: "pointer", textDecoration: "none", userSelect: "none", whiteSpace: "nowrap",
    transition: "background-color .16s ease, color .16s ease",
  };
  const enter = (e) => { e.currentTarget.style.background = INK; e.currentTarget.style.color = "#fff"; };
  const leave = (e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = INK; };
  if (as === "link") return <SpaLink to={to} style={base} onMouseEnter={enter} onMouseLeave={leave}>{children}</SpaLink>;
  return <button type="button" onClick={onClick} style={base} onMouseEnter={enter} onMouseLeave={leave}>{children}</button>;
}

/* ===== 3. CubeCard ===== */
export function CubeCard({ title, children, style }) {
  return (
    <div style={{ border: `1px solid ${INK}`, borderRadius: 12, background: BG, padding: 18, ...style }}>
      {title ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 600, color: INK, marginBottom: 10 }}>{title}</div>
          <DottedDivider />
          <div style={{ marginTop: 12 }}>{children}</div>
        </>
      ) : children}
    </div>
  );
}

/* контейнер сетки с 1px-разделителями (через gap+фон) */
const gridBox = { border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden", gap: 1, background: INK };
const cell = { background: BG, padding: 16 };

/* ===== SectionHead — редакторский лейбл секции (как «Learn from the Best» → «ACADEMY») ===== */
export function SectionHead({ label, title, center = false }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 16 }}>
      {label && <div style={{ fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 }}>{label}</div>}
      {title && <div style={{ marginTop: 6, fontSize: 28, lineHeight: 1.1, fontWeight: 600, color: INK }}>{title}</div>}
    </div>
  );
}

/* ===== TagRow — капсулы-теги по центру (как «This element was built with…») ===== */
export function TagRow({ label, tags = [], center = true }) {
  return (
    <div style={{ textAlign: center ? "center" : "left" }}>
      {label && <div style={{ fontSize: 18, fontWeight: 400, color: INK, marginBottom: 22 }}>{label}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: center ? "center" : "flex-start" }}>
        {tags.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", height: 42, padding: "0 20px", borderRadius: 999, border: "1px solid #d7d7d7", fontSize: 15, fontWeight: 600, color: INK, whiteSpace: "nowrap" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ===== 1. DetailStatGrid — 4 ячейки (label/value), desktop 4, mobile 2x2 (как HM/SOTD/…) ===== */
export function DetailStatGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4" style={gridBox}>
      {items.slice(0, 4).map((it, i) => (
        <div key={i} style={{ ...cell, minHeight: 84, textAlign: "center" }}>
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 }}>{it.label}</div>
          <div style={{ marginTop: 8, fontSize: 22, lineHeight: "26px", fontWeight: 700, color: INK }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ===== 4. MiniTabs — капсульные табы (controlled) ===== */
export function MiniTabs({ items = [], value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange?.(it.key)}
            style={{
              height: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${active ? INK : "#cfcfcf"}`, background: active ? INK : "transparent",
              color: active ? "#fff" : "#333", fontFamily: UI, fontSize: 14, fontWeight: 300,
              transition: "border-color .14s ease, background-color .14s ease, color .14s ease",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ===== ScenarioSwitcher — табы сценариев + сетка секций под выбранный сценарий ===== */
export function ScenarioSwitcher({ scenarios = [], fields = [] }) {
  const [k, setK] = React.useState(scenarios[0]?.key);
  const cur = scenarios.find((s) => s.key === k) || scenarios[0] || {};
  return (
    <div>
      <MiniTabs items={scenarios.map((s) => ({ key: s.key, label: s.label }))} value={k} onChange={setK} />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ ...gridBox, marginTop: 18 }}>
        {fields.map((f) => (
          <div key={f.key} style={cell}>
            <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400, marginBottom: 8 }}>{f.label}</div>
            <div style={{ fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222" }}>{cur[f.key]}</div>
          </div>
        ))}
        {/* нечётное число полей в 2 колонки → пустая ячейка показывала бы чёрный фон контейнера */}
        {fields.length % 2 !== 0 && <div className="hidden md:block" aria-hidden="true" style={cell} />}
      </div>
    </div>
  );
}

/* ===== 5. MatrixTable — симптом→проверяем→решение / риск→как закрываем / режим→что питает→важно ===== */
export function MatrixTable({ columns = [], rows = [], highlightLast = false }) {
  const n = columns.length;
  const cols = `repeat(${n}, 1fr)`;
  const cellStyle = (ci) =>
    highlightLast && ci === n - 1 ? { fontWeight: 600, color: INK } : ci === 0 ? { fontWeight: 600, color: INK } : undefined;
  return (
    <div style={{ position: "relative" }}>
      {/* сплошная подсветка последней колонки (пунктир строк проходит поверх) */}
      {highlightLast && (
        <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, right: -10, width: `calc((100% - ${(n - 1) * 18}px) / ${n} + 20px)`, background: "#ededed", borderRadius: 8 }} />
      )}
      <div style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: 18, fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED, fontWeight: 400, paddingBottom: 10 }}>
          {columns.map((c, i) => <span key={i} style={highlightLast && i === n - 1 ? { textAlign: "left" } : undefined}>{c}</span>)}
        </div>
        <DottedDivider />
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: 18, alignItems: "start", padding: "14px 0", fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222" }}>
              {r.map((c, ci) => <span key={ci} style={cellStyle(ci)}>{c}</span>)}
            </div>
            {ri < rows.length - 1 && <DottedDivider />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ===== 6. RoadmapRail — шаги 01/02/03 (строгая лента, без цветных точек) ===== */
export function RoadmapRail({ steps = [] }) {
  return (
    <div>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 16, padding: "14px 0", alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{s.title}</div>
              {s.text && <div style={{ marginTop: 4, fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#333" }}>{s.text}</div>}
            </div>
          </div>
          {i < steps.length - 1 && <DottedDivider />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== 7. ZoneGrid — сетка зон объекта (наружка/территория/освещение) =====
   z.text — простой текст; z.rows: [{label, value}] — карточка с подписанными строками. */
export function ZoneGrid({ zones = [], cols = 3 }) {
  const cls = cols >= 3 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 sm:grid-cols-2";
  return (
    <div className={cls} style={gridBox}>
      {zones.map((z, i) => (
        <div key={i} style={cell}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{z.title}</div>
          {z.text && <div style={{ marginTop: 6, fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#333" }}>{z.text}</div>}
          {Array.isArray(z.rows) && z.rows.length > 0 && (
            <>
              <div style={{ marginTop: 10 }}><DottedDivider /></div>
              <div style={{ marginTop: 10, display: "grid", rowGap: 8 }}>
                {z.rows.map((r, ri) => (
                  <div key={ri}>
                    <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 }}>{r.label}</div>
                    <div style={{ marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ===== ProtectionMap — карта защитного контура: узел → функция + что проверяем ===== */
export function ProtectionMap({ nodes = [] }) {
  const filler = nodes.length % 2 !== 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={gridBox}>
      {nodes.map((n, i) => (
        <div key={i} style={{ ...cell, display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 8 }}>{n.title}</div>
            <DottedDivider />
            <div style={{ marginTop: 8, display: "grid", rowGap: 6 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 }}>Функция</div>
                <div style={{ marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{n.fn}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 400 }}>Проверяем</div>
                <div style={{ marginTop: 2, fontSize: 14, lineHeight: "20px", fontWeight: 300, color: "#222" }}>{n.check}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {filler && <div className="hidden md:block" aria-hidden="true" style={cell} />}
    </div>
  );
}

/* ===== 8. AnatomyGrid — состав узла/щита/системы ===== */
export function AnatomyGrid({ items = [], cols = 2 }) {
  const two = cols >= 2;
  const cls = two ? "grid grid-cols-1 md:grid-cols-2" : "grid grid-cols-1";
  // нечётное число в 2 колонки → пустая ячейка показывала бы чёрный фон контейнера; заполняем пустышкой
  const filler = two && items.length % 2 !== 0;
  return (
    <div className={cls} style={gridBox}>
      {items.map((it, i) => (
        <div key={i} style={{ ...cell, display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{it.title}</div>
            {it.text && <div style={{ marginTop: 4, fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#333" }}>{it.text}</div>}
          </div>
        </div>
      ))}
      {filler && <div className="hidden md:block" aria-hidden="true" style={cell} />}
    </div>
  );
}

/* ===== 9. BeforeAfterGrid — две колонки «до / после» ===== */
export function BeforeAfterGrid({ before, after }) {
  const col = (head, data) => (
    <div style={{ ...cell, padding: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 300, marginBottom: 8 }}>{head}</div>
      {data?.title && <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 10 }}>{data.title}</div>}
      <DottedDivider />
      <ul style={{ margin: "12px 0 0 16px", padding: 0, listStyle: "disc" }}>
        {(data?.items || []).map((x, i) => (
          <li key={i} style={{ fontSize: 14, lineHeight: "22px", fontWeight: 300, color: "#222", marginBottom: 6 }}>{x}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={gridBox}>
      {col("До", before)}
      {col("После", after)}
    </div>
  );
}

/* направление услуги (для предвыбора в форме контактов) по префиксу пути */
const CTA_DIR = {
  "/services/electrical": "Электромонтажные работы",
  "/services/lowcurrent": "Слаботочные системы",
  "/services/ventilation": "Вентиляция и кондиционирование",
  "/services/design": "Проектирование систем",
  "/services/construction": "Общестрой и отделка",
};

/* переход в контакты с предвыбором направления и темы (тема = заголовок страницы) */
export function goToContactWithService(to = "/contact") {
  try {
    const p = window.location.pathname || "";
    const dir = Object.keys(CTA_DIR).find((k) => p.startsWith(k));
    if (dir) sessionStorage.setItem("cube:help", CTA_DIR[dir]);
    const subj = (document.title || "").replace(/\s*—\s*CUBE\s*$/i, "").trim();
    if (subj) sessionStorage.setItem("cube:subject", subj);
  } catch {}
  try {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.location.href = to;
  }
}

/* ===== 10. ServiceCTA — техническая CTA: текст + кнопка + вторичная ссылка ===== */
export function ServiceCTA({ title, text, button = "Оставить заявку", to = "/contact", backTo = "/services/electrical", backLabel = "Вернуться к электромонтажу" }) {
  return (
    <CubeCard>
      <div style={{ fontSize: 20, fontWeight: 600, color: INK }}>{title}</div>
      {text && <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED, maxWidth: 720 }}>{text}</div>}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <Capsule as="button" onClick={() => goToContactWithService(to)}>{button}</Capsule>
        <SpaLink to={backTo} style={{ fontSize: 14, fontWeight: 600, color: INK, textDecoration: "underline", textUnderlineOffset: 2 }}>
          {backLabel}
        </SpaLink>
      </div>
    </CubeCard>
  );
}
