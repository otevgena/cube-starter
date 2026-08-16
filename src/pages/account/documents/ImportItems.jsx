// src/pages/account/documents/ImportItems.jsx
// Мастер «Загрузить товары из файла» в фирменном стиле КУБ.
// Файл читаем через ExcelJS СО СТИЛЯМИ (заливки/шрифты/рамки/объединения/ширины)
// и рисуем как оригинал. Разметка колонок по шагам: на шаге «Наименование»
// строки выбираются кликом (повторный клик — снять) и протягиванием мышью;
// дальше клик по одной ячейке размечает столбец. По «Готово» собираем позиции.
import React from "react";
import { createPortal } from "react-dom";
import { parseNum } from "@/data/documents.js";

const UI = "'Inter Tight','Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const TEXT = "#111", MUTED = "#777", LINE = "#e6e6e6", PAGE = "#f8f8f8", CARROT = "#FA5D29";
const SEL_BG = "#fdece6";      // мягкая морковная заливка выбранной ячейки
const MAP_BG = "#ededed";      // уже размеченный столбец — нейтральный серый

const STEPS = [
  { key: "name", label: "Наименование", hint: "Выберите наименования: кликайте по строкам (повторный клик снимает) или протяните мышью по нужным." },
  { key: "code", label: "Код товара", hint: "Кликните ячейку в столбце кода/артикула. Можно пропустить." },
  { key: "unit", label: "Ед. изм.", hint: "Кликните ячейку в столбце единиц измерения. Можно пропустить." },
  { key: "qty", label: "Количество", hint: "Кликните ячейку в столбце количества. Можно пропустить." },
  { key: "price", label: "Цена за единицу", hint: "Кликните ячейку в столбце цены. Можно пропустить." },
  { key: "vat", label: "Ставка НДС", hint: "Кликните ячейку со ставкой НДС. Можно пропустить." },
  { key: "sum", label: "Сумма", hint: "Кликните ячейку с суммой. Если задана — цена посчитается сама. Можно пропустить." },
];

/* ---- кнопки в стиле сайта (наведение через JS, как везде у нас) ---- */
function FillBtn({ children, onClick, disabled }) {
  const [h, setH] = React.useState(false); const on = h && !disabled;
  return <button type="button" onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid #111", background: on ? "#111" : "transparent", color: on ? "#fff" : "#111", fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1, transition: "background-color .16s ease, color .16s ease", whiteSpace: "nowrap" }}>{children}</button>;
}
function PrimaryBtn({ children, onClick, disabled }) {
  const [h, setH] = React.useState(false); const on = h && !disabled;
  return <button type="button" onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: disabled ? "#bdbdbd" : (on ? "#262626" : "#111"), color: "#fff", fontFamily: UI, fontSize: 14, fontWeight: 600, cursor: disabled ? "default" : "pointer", transition: "background-color .16s ease, box-shadow .16s ease, transform .16s ease", boxShadow: on ? "0 8px 22px rgba(0,0,0,.18)" : "none", transform: on ? "translateY(-1px)" : "none", whiteSpace: "nowrap" }}>{children}</button>;
}
function CloseTile({ onClick }) {
  const [h, setH] = React.useState(false);
  return <button type="button" aria-label="Закрыть" title="Закрыть" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 10, border: "none", background: h ? "#262626" : "#111", color: "#fff", cursor: "pointer", transition: "background-color .15s ease", flexShrink: 0 }}>
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  </button>;
}
function UploadIcon({ size = 18 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z" /><path d="M12 14V8m0 0l-3 3m3-3l3 3" /></svg>;
}

/* ---- стили ExcelJS → CSS ---- */
function argb(c) { if (!c) return null; if (c.argb) { const h = c.argb; return "#" + (h.length === 8 ? h.slice(2) : h); } return null; }
function cellCss(cell) {
  const st = { padding: "3px 7px", fontSize: 12, lineHeight: 1.3, fontFamily: "Arial,sans-serif", overflow: "hidden" };
  const f = cell.font || {};
  if (f.bold) st.fontWeight = 700; if (f.italic) st.fontStyle = "italic";
  if (f.size) st.fontSize = Math.max(10, Math.min(20, f.size));
  const fc = argb(f.color); if (fc && fc !== "#000000") st.color = fc;
  const fill = cell.fill;
  if (fill && fill.type === "pattern" && fill.pattern === "solid") { const bg = argb(fill.fgColor); if (bg && bg.toLowerCase() !== "#ffffff") st.background = bg; }
  const a = cell.alignment || {};
  st.textAlign = a.horizontal || "left";
  st.verticalAlign = a.vertical === "middle" ? "middle" : a.vertical === "bottom" ? "bottom" : "top";
  st.whiteSpace = a.wrapText ? "normal" : "nowrap";
  const b = cell.border || {};
  const bd = (s) => (b[s] && b[s].style ? "1px solid " + (argb(b[s].color) || "#c9c9c9") : "1px solid #f0f0f0");
  st.borderTop = bd("top"); st.borderLeft = bd("left"); st.borderBottom = bd("bottom"); st.borderRight = bd("right");
  return st;
}
function decode(ref) { const m = ref.match(/([A-Z]+)(\d+)/); let c = 0; for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64); return { c, r: +m[2] }; }

export default function ImportItemsModal({ file, onClose, onImport }) {
  const [model, setModel] = React.useState(null);
  const [fileName, setFileName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [step, setStep] = React.useState(0);
  const [rows, setRows] = React.useState([]);
  const [cols, setCols] = React.useState({ name: null, code: null, unit: null, qty: null, price: null, vat: null, sum: null });
  const drag = React.useRef({ on: false, anchor: null, moved: false, before: [] });

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    const onUp = () => {
      const d = drag.current; if (!d.on) return;
      if (step === 0 && !d.moved && d.anchor) {
        const set = new Set(d.before); const r = d.anchor.r;
        if (hasVal(r, d.anchor.c)) { set.has(r) ? set.delete(r) : set.add(r); setRows([...set].sort((a, b) => a - b)); }
      }
      d.on = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mouseup", onUp);
    document.body.classList.add("has-modal");
    const prev = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mouseup", onUp); document.body.classList.remove("has-modal"); document.documentElement.style.overflow = prev; };
  }); // без deps — читаем свежие step/rows

  React.useEffect(() => { if (file) parseFile(file); /* eslint-disable-next-line */ }, [file]);

  const parseFile = async (f) => {
    if (!f) return;
    setBusy(true); setErr("");
    try {
      const { default: ExcelJS } = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await f.arrayBuffer());
      const ws = wb.worksheets[0];
      const maxR = ws.rowCount, maxC = Math.max(1, ws.columnCount);
      const covered = new Set(); const span = {};
      for (const m of (ws.model.merges || [])) { const [a, b] = m.split(":"); const pa = decode(a), pb = decode(b); span[pa.r + "," + pa.c] = { rowspan: pb.r - pa.r + 1, colspan: pb.c - pa.c + 1 }; for (let r = pa.r; r <= pb.r; r++) for (let c = pa.c; c <= pb.c; c++) if (!(r === pa.r && c === pa.c)) covered.add(r + "," + c); }
      const grid = [];
      for (let r = 1; r <= maxR; r++) {
        const line = [];
        for (let c = 1; c <= maxC; c++) {
          if (covered.has(r + "," + c)) { line.push(null); continue; }
          const cell = ws.getCell(r, c); const sp = span[r + "," + c] || {};
          line.push({ text: cell.text != null ? String(cell.text) : "", css: cellCss(cell), colspan: sp.colspan || 1, rowspan: sp.rowspan || 1 });
        }
        grid.push(line);
      }
      const colPx = []; for (let c = 1; c <= maxC; c++) { const w = ws.getColumn(c).width; colPx.push(Math.max(24, Math.round((w || 8.43) * 7))); }
      setModel({ grid, colPx });
      setFileName(f.name); setStep(0); setRows([]); setCols({ name: null, unit: null, qty: null, price: null });
    } catch (e) { setErr("Не удалось прочитать файл. Поддерживаются .xlsx, .xls"); }
    finally { setBusy(false); }
  };

  const grid = model && model.grid;
  const stepKey = STEPS[step].key;
  const cellAt = (r, c) => (grid && grid[r] ? grid[r][c] : null);
  const hasVal = (r, c) => { const x = cellAt(r, c); return x && String(x.text).trim() !== ""; };
  const rangeRows = (r1, r2, c) => { const [a, b] = [Math.min(r1, r2), Math.max(r1, r2)]; const rr = []; for (let i = a; i <= b; i++) if (hasVal(i, c)) rr.push(i); return rr; };

  const onDown = (r, c, e) => {
    if (step === 0) { e.preventDefault(); drag.current = { on: true, anchor: { r, c }, moved: false, before: rows.slice() }; setCols((p) => ({ ...p, name: c })); }
    else setCols((p) => ({ ...p, [stepKey]: c }));
  };
  const onEnter = (r) => {
    const d = drag.current; if (step !== 0 || !d.on || !d.anchor) return;
    d.moved = true; const set = new Set(d.before); rangeRows(d.anchor.r, r, d.anchor.c).forEach((x) => set.add(x)); setRows([...set].sort((a, b) => a - b));
  };

  const selCss = (r, c) => {
    const base = cellAt(r, c)?.css || {};
    if (!rows.includes(r)) return base;
    if (c === cols[stepKey]) return { ...base, background: SEL_BG, boxShadow: `inset 0 0 0 2px ${CARROT}` };
    const mapped = ["name", "code", "unit", "qty", "price", "vat", "sum"].find((k) => k !== stepKey && cols[k] === c);
    if (mapped) return { ...base, background: MAP_BG, boxShadow: "inset 0 0 0 1px #cfcfcf" };
    return base;
  };

  const next = () => { if (step < STEPS.length - 1) setStep(step + 1); else finish(); };
  const resetStep = () => { if (step === 0) { setRows([]); setCols((p) => ({ ...p, name: null })); } else setCols((p) => ({ ...p, [stepKey]: null })); };

  const finish = () => {
    const txt = (r, c) => String(cellAt(r, c)?.text || "").trim();
    const items = rows.map((r) => {
      const name = txt(r, cols.name);
      const code = cols.code != null ? txt(r, cols.code) : "";
      const unit = cols.unit != null ? txt(r, cols.unit) : "";
      const qty = cols.qty != null ? parseNum(txt(r, cols.qty)) : "";
      let price = cols.price != null ? parseNum(txt(r, cols.price)) : "";
      let sum = cols.sum != null ? parseNum(txt(r, cols.sum)) : "";
      if (!price && sum && qty) price = Math.round((sum / qty) * 100) / 100; // цена из суммы, если цены нет
      if (!sum && qty && price) sum = Math.round(qty * price * 100) / 100;
      const it = { name, unit, qty: qty || "", price: price || "", sum: sum || "" };
      if (code) it.code = code;
      return it;
    }).filter((it) => it.name);
    onImport(items); onClose?.();
  };

  return createPortal(
    <div className="animate-svcfade" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column", padding: 16, fontFamily: UI }}>
      <div style={{ background: PAGE, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxWidth: 1280, width: "100%", margin: "0 auto", boxShadow: "0 30px 80px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${LINE}`, background: PAGE }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: TEXT }}>Загрузить товары из файла</div>
            {fileName && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 620 }}>{fileName}</div>}
          </div>
          <CloseTile onClick={onClose} />
        </div>

        {!model ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {busy ? <div style={{ color: MUTED, fontSize: 15 }}>Читаем файл…</div> : (
              <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "48px 72px", border: `1.5px dotted #c7c7c7`, borderRadius: 14, cursor: "pointer", color: MUTED, background: "#fff" }}>
                <span style={{ color: "#555" }}><UploadIcon size={30} /></span>
                <div style={{ fontSize: 15.5, fontWeight: 500, color: TEXT }}>Выберите файл Excel</div>
                <div style={{ fontSize: 12.5, color: "#a0a0a0" }}>Смета, прайс, список — .xlsx, .xls</div>
                {err && <div style={{ fontSize: 12.5, color: CARROT }}>{err}</div>}
                <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => parseFile(e.target.files?.[0])} />
              </label>
            )}
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 20px 0" }}>
              <div style={{ display: "inline-flex", gap: 4, background: "#ededed", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
                {STEPS.map((s, i) => {
                  const active = i === step;
                  return (
                    <button key={s.key} type="button" onClick={() => (i <= step || cols.name != null ? setStep(i) : null)}
                      style={{ border: "none", background: active ? "#111" : "transparent", color: active ? "#fff" : "#666", fontFamily: UI, fontSize: 12.5, fontWeight: active ? 600 : 400, padding: "7px 14px", borderRadius: 8, cursor: "pointer", transition: "background-color .15s ease, color .15s ease" }}>
                      <span style={{ opacity: .7, marginRight: 5 }}>{i + 1}</span>{s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: "12px 20px 4px" }}>
              <div style={{ background: "#efefef", borderRadius: 10, padding: "12px 16px", fontSize: 13.5, fontWeight: 300, color: "#444", lineHeight: 1.55 }}>
                {STEPS[step].hint}{step === 0 ? " Наименование — обязательный шаг." : ""}
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", margin: "6px 20px", border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff", userSelect: "none" }}>
              <table style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: 36 }} />{model.colPx.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={r}>
                      <td style={{ padding: "3px 7px", border: `1px solid ${LINE}`, fontSize: 11, color: "#bbb", background: "#fafafa", textAlign: "center", position: "sticky", left: 0 }}>{r + 1}</td>
                      {row.map((cell, c) => cell === null ? null : (
                        <td key={c} colSpan={cell.colspan} rowSpan={cell.rowspan} onMouseDown={(e) => onDown(r, c, e)} onMouseEnter={() => onEnter(r)} title={cell.text}
                          style={{ ...selCss(r, c), cursor: "pointer" }}>{cell.text}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "12px 20px", borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: PAGE }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: rows.length ? CARROT : "#9a9a9a" }}>Выбрано строк: {rows.length}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <FillBtn onClick={resetStep}>Сбросить</FillBtn>
                <FillBtn onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Назад</FillBtn>
                {step < STEPS.length - 1 ? <PrimaryBtn onClick={next} disabled={step === 0 && rows.length === 0}>Продолжить</PrimaryBtn> : <PrimaryBtn onClick={finish} disabled={!rows.length}>Загрузить {rows.length} поз.</PrimaryBtn>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
