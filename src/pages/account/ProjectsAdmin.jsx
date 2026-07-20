// src/pages/account/ProjectsAdmin.jsx
// Админ-модуль «Добавить проект»: управление витринными проектами, которые видны
// в блоке «ПРОЕКТЫ» на главной (два самых свежих) и на странице «Смотреть работы»
// (все). Данные — общий фронт-стор src/data/projects.js (localStorage; бэкенд позже).
//
// Стиль строго из существующего интерфейса:
//  • список проектов — как «Этапы»: перетаскивание за ⠿, подсветка ряда и действия
//    «Изменить/Удалить» проявляются при наведении курсора;
//  • загрузка изображений — как аватар в Профиле: пунктирная зона с иконкой и
//    подсказкой, приём drag-and-drop, ужатие в data:URL (localStorage не резиновый);
//  • у всех кнопок — hover-эффекты (капсула контур→заливка, морковная корзина);
//  • добавление/правка гейтятся правами projects.add / projects.manage.
import React from "react";
import { FLabel, UnderInput, PrimaryBtn } from "@/pages/account/objects/ObjectsSection.jsx";
import { ProjectCardResponsive } from "@/components/blocks/Projects.jsx";
import { getProjects, addProject, updateProject, removeProject, moveProject, resetProjects, uploadProjectImage } from "@/data/projects.js";
import { confirmDialog } from "@/components/common/Confirm.jsx";

const UI = "'Inter Tight','Inter',system-ui";
const TEXT = "#111";
const MUTED = "#777";
const CARROT = "#FA5D29";
const UNDER = "#e6e6e6";

function adminNav(to) {
  try { window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); }
  catch { window.location.href = to; }
}

const EMPTY = {
  logo: "", shots: [], location: "", objectTitle: "", customer: "",
  servicesLabel: "", days: "", name: "", client: "", year: "", services: "", badge: "",
};

/* ---- Капсула-действие: контур → заливка на hover (как AcctAction/FillBtn в кабинете). ---- */
function HoverCapsule({ children, onClick, accent, small, disabled }) {
  const [h, setH] = React.useState(false);
  const c = accent ? CARROT : "#111";
  const on = h && !disabled;
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ height: small ? 34 : 40, padding: small ? "0 14px" : "0 18px", borderRadius: small ? 10 : 12,
        border: `1px solid ${disabled ? "#dcdcdc" : c}`, background: on ? c : "transparent",
        color: disabled ? "#bbb" : on ? "#fff" : c, fontFamily: UI, fontSize: 13, fontWeight: 400,
        cursor: disabled ? "default" : "pointer", transition: "background-color .16s ease, color .16s ease, border-color .16s ease", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

/* ---- Морковная корзина этапа: серая → морковная на фоне #faf1ee. ---- */
function TrashBtn({ onClick, title = "Удалить" }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title}
      style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#b0b0b0", cursor: "pointer", flexShrink: 0, borderRadius: 8, transition: "color .12s, background-color .12s" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = CARROT; e.currentTarget.style.background = "#faf1ee"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#b0b0b0"; e.currentTarget.style.background = "transparent"; }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" /></svg>
    </button>
  );
}

/* Иконка «загрузить» — как в аватаре профиля (облако со стрелкой). */
function UploadIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14V8m0 0l-3 3m3-3l3 3" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Пунктирная зона загрузки — единый вид с аватаром в Профиле: иконка + подсказка,
   при наведении фон/рамка темнеют, поддержка drag-and-drop файлов. */
function DropZone({ onFiles, busy, multiple, title, hint, height = 120 }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [drag, setDrag] = React.useState(false);
  const active = hover || drag;
  const handle = (files) => { const list = Array.from(files || []); if (list.length) onFiles(list); };
  return (
    <div
      onClick={() => inputRef.current?.click()}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer?.files); }}
      style={{ width: "100%", minHeight: height, border: `1px dashed ${active ? "#9a9a9a" : UNDER}`, borderRadius: 10,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 16,
        cursor: "pointer", background: active ? "#f4f4f4" : "#fafafa", transition: "background .12s ease, border-color .12s ease" }}>
      <UploadIcon />
      <div style={{ textAlign: "center", color: "#222", fontFamily: UI }}>
        <div style={{ fontSize: 13.5, lineHeight: "20px", fontWeight: 300 }}>{busy ? "Загрузка…" : title}</div>
        {hint ? <div style={{ marginTop: 4, fontSize: 12, lineHeight: "17px", fontWeight: 300, color: MUTED }}>{hint}</div> : null}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} style={{ display: "none" }}
        onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

// Загрузчик логотипа (одна круглая картинка) — превью + зона замены.
function LogoUploader({ value, onChange }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const pick = async (files) => {
    const file = files[0]; if (!file) return;
    setBusy(true); setErr("");
    try { onChange(await uploadProjectImage(file, { maxW: 240, maxH: 240, quality: 0.9 })); }
    catch (e) { setErr(e.message || "Ошибка загрузки"); }
    finally { setBusy(false); }
  };
  if (value) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "#fff", border: "1px solid #e6e6e6", flexShrink: 0 }}>
            <img src={value} alt="Логотип" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 7 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ display: "inline-flex" }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { pick(Array.from(e.target.files || [])); e.target.value = ""; }} />
              <span><HoverCapsule small onClick={(e) => e.currentTarget.previousSibling?.click?.()}>Заменить</HoverCapsule></span>
            </label>
            <HoverCapsule small accent onClick={() => onChange("")}>Убрать</HoverCapsule>
          </div>
        </div>
        {err && <div style={{ marginTop: 6, fontSize: 12, color: CARROT }}>{err}</div>}
      </div>
    );
  }
  return (
    <div>
      <DropZone onFiles={pick} busy={busy} title="Перетащите логотип или выберите файл" hint="PNG/JPG, квадратный. Ляжет в кружок на карточке." height={120} />
      {err && <div style={{ marginTop: 6, fontSize: 12, color: CARROT }}>{err}</div>}
    </div>
  );
}

// Загрузчик превью-снимков (несколько, карусель на карточке) — миниатюры с
// действиями по наведению + пунктирная зона добавления, как аватар.
function ShotsUploader({ value, onChange }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [hoverIdx, setHoverIdx] = React.useState(-1);
  const addFiles = async (files) => {
    if (!files.length) return;
    setBusy(true); setErr("");
    try {
      const urls = [];
      for (const f of files) { try { urls.push(await uploadProjectImage(f, { maxW: 1400, maxH: 1000, quality: 0.82 })); } catch (e) { setErr(e.message || "Ошибка"); } }
      if (urls.length) onChange([...(value || []), ...urls]);
    } finally { setBusy(false); }
  };
  const removeAt = (i) => onChange(value.filter((_, k) => k !== i));
  const move = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = value.slice(); const [m] = next.splice(from, 1); next.splice(to, 0, m); onChange(next);
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {(value || []).map((src, i) => {
          const hov = hoverIdx === i;
          return (
            <div key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(-1)}
              style={{ position: "relative", width: 132, height: 88, borderRadius: 8, overflow: "hidden", border: "1px solid #e6e6e6", background: "#fafafa" }}>
              <img src={src} alt={`Снимок ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {/* Действия проявляются при наведении на миниатюру */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(17,17,17,.28)", opacity: hov ? 1 : 0, transition: "opacity .15s ease", pointerEvents: hov ? "auto" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} title="Левее"
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", border: "none", borderRadius: 6, background: "rgba(255,255,255,.92)", color: i === 0 ? "#bbb" : TEXT, cursor: i === 0 ? "default" : "pointer" }}>‹</button>
                <button type="button" onClick={() => removeAt(i)} title="Удалить"
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", border: "none", borderRadius: 6, background: CARROT, color: "#fff", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>×</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} title="Правее"
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", border: "none", borderRadius: 6, background: "rgba(255,255,255,.92)", color: i === value.length - 1 ? "#bbb" : TEXT, cursor: i === value.length - 1 ? "default" : "pointer" }}>›</button>
              </div>
              <span style={{ position: "absolute", left: 5, top: 5, fontSize: 10, fontWeight: 600, color: "#fff", background: "rgba(17,17,17,.55)", borderRadius: 5, padding: "1px 6px" }}>{i + 1}</span>
            </div>
          );
        })}
        {/* Пунктирная зона-плитка «добавить» — в стиле аватара */}
        <div style={{ width: 132, height: 88 }}>
          <DropZone onFiles={addFiles} busy={busy} multiple title="+ Добавить" height={88} />
        </div>
      </div>
      {err && <div style={{ marginTop: 6, fontSize: 12, color: CARROT }}>{err}</div>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FLabel>{label}</FLabel>
      {children}
      {hint ? <div style={{ marginTop: 6, fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{hint}</div> : null}
    </div>
  );
}

// Форма создания/редактирования одного проекта. При editId != null — режим правки.
function ProjectForm({ editId, initial, onDone, onCancel }) {
  const [f, setF] = React.useState(() => ({ ...EMPTY, ...(initial || {}), days: initial?.days != null ? String(initial.days) : "" }));
  const [err, setErr] = React.useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const preview = React.useMemo(() => ({
    logo: f.logo, shots: f.shots, location: f.location || "Город", objectTitle: f.objectTitle || "Название объекта",
    customer: f.customer || f.name || "Заказчик", servicesLabel: f.servicesLabel || "—", days: Number(f.days) || 0,
    name: f.name, client: f.client, year: f.year, services: f.services, badge: f.badge, id: editId || "preview",
  }), [f, editId]);

  const save = () => {
    if (!f.objectTitle.trim() && !f.customer.trim()) { setErr("Укажите хотя бы название объекта или заказчика."); return; }
    // Название/заказчик заполняются один раз — дублируем их в поля таблицы (name/client),
    // чтобы карточка и строка на главной совпадали без повторного ввода.
    const payload = {
      ...f,
      days: Number(f.days) || 0,
      name: f.customer.trim(),
      client: f.objectTitle.trim(),
    };
    try {
      if (editId) updateProject(editId, payload);
      else addProject(payload);
      onDone();
    } catch (e) {
      setErr("Не удалось сохранить: слишком большие изображения. Уменьшите их количество или размер.");
    }
  };

  return (
    <div>
      <div className="pa-grid" style={{ display: "grid", gap: 28, gridTemplateColumns: "minmax(0,1fr)", alignItems: "start" }}>
        {/* левая колонка — поля */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Изображения</div>
          <Field label="Логотип заказчика"><LogoUploader value={f.logo} onChange={set("logo")} /></Field>
          <Field label="Снимки объекта (карусель)"><ShotsUploader value={f.shots} onChange={set("shots")} /></Field>

          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: "24px 0 4px" }}>Карточка и таблица</div>
          <div style={{ marginBottom: 14, fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
            Название и заказчик заполняются один раз — они идут и в карточку витрины, и в строку таблицы на главной.
          </div>
          <Field label="Город"><UnderInput value={f.location} onChange={set("location")} placeholder="Например: Ноябрьск" /></Field>
          <Field label="Название объекта" hint="Крупный заголовок на карточке и колонка «Название» в таблице.">
            <UnderInput value={f.objectTitle} onChange={set("objectTitle")} placeholder="Например: Учебный центр" />
          </Field>
          <Field label="Заказчик" hint="Подпись на карточке и колонка «Заказчик» в таблице (рядом с логотипом).">
            <UnderInput value={f.customer} onChange={set("customer")} placeholder="Например: Газпром нефть" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Год"><UnderInput value={f.year} onChange={set("year")} placeholder="2025" /></Field>
            <Field label="Дней"><UnderInput value={f.days} onChange={(v) => set("days")(v.replace(/[^\d]/g, ""))} placeholder="94" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Подпись услуг" hint="Мелко в углу карточки."><UnderInput value={f.servicesLabel} onChange={set("servicesLabel")} placeholder="Например: 5 услуг" /></Field>
            <Field label="Метка / сноска" hint="Надстрочная пометка у заказчика в таблице."><UnderInput value={f.badge} onChange={set("badge")} placeholder="ННГ" /></Field>
          </div>
          <Field label="Услуги" hint="Колонка «Услуги» в таблице на главной.">
            <UnderInput value={f.services} onChange={set("services")} placeholder="СКС, ОПС, ЭО" />
          </Field>

          {err && <div style={{ marginTop: 4, marginBottom: 12, fontSize: 13, color: CARROT }}>{err}</div>}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
            <PrimaryBtn onClick={save}>{editId ? "Сохранить" : "Добавить проект"}</PrimaryBtn>
            <HoverCapsule onClick={onCancel}>Отмена</HoverCapsule>
          </div>
        </div>

        {/* правая колонка — предпросмотр */}
        <div style={{ position: "sticky", top: 90 }}>
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, fontWeight: 300, marginBottom: 12 }}>Предпросмотр</div>
          <div style={{ maxWidth: 560 }}>
            <ProjectCardResponsive project={preview} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>Так карточка будет выглядеть на главной и на странице «Смотреть работы».</div>
        </div>
      </div>
      <style>{`@media (min-width: 1100px){ .pa-grid{ grid-template-columns: minmax(0,1.05fr) minmax(0,0.95fr) !important; } }`}</style>
    </div>
  );
}

export default function ProjectsAdmin({ backTo = "/account/admin", canAdd = true, canManage = true }) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  const [mode, setMode] = React.useState(null); // null=список, 'new', или id для правки
  const projects = getProjects();

  React.useEffect(() => {
    const on = () => force();
    window.addEventListener("projects:changed", on);
    return () => window.removeEventListener("projects:changed", on);
  }, []);

  const editing = mode && mode !== "new" ? projects.find((p) => p.id === mode) : null;

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <BackLink onClick={() => (mode ? setMode(null) : adminNav(backTo))}>{mode ? "← К списку проектов" : "← К модулям"}</BackLink>

      <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: TEXT }}>
            {mode === "new" ? "Новый проект" : editing ? "Редактировать проект" : "Добавить проект"}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED, maxWidth: 620, lineHeight: 1.5 }}>
            {mode
              ? "Заполните данные и изображения — справа виден живой предпросмотр карточки."
              : "Витрина работ: два самых свежих проекта показываются на главной, все — на странице «Смотреть работы». Новый проект встаёт слева на главной."}
          </div>
        </div>
        {!mode && canAdd && (
          <PrimaryBtn onClick={() => setMode("new")}>+ Новый проект</PrimaryBtn>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        {mode ? (
          <ProjectForm
            editId={editing ? editing.id : null}
            initial={editing || null}
            onDone={() => setMode(null)}
            onCancel={() => setMode(null)}
          />
        ) : (
          <ProjectsList projects={projects} canManage={canManage} onEdit={(id) => setMode(id)} />
        )}
      </div>
    </div>
  );
}

/* Ссылка «← …» с подсветкой на hover. */
function BackLink({ children, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: h ? TEXT : MUTED, transition: "color .14s ease" }}>
      {children}
    </button>
  );
}

// Список проектов: перетаскивание за ⠿ (как «Этапы»), ряд подсвечивается и
// действия «Изменить/Удалить» проявляются при наведении. Порядок = кто слева/справа.
function ProjectsList({ projects, onEdit, canManage }) {
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [hoverId, setHoverId] = React.useState(null);
  const dragFrom = React.useRef(null);
  const [dragId, setDragId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);

  const drop = (to) => { const from = dragFrom.current; dragFrom.current = null; setDragId(null); setOverId(null); if (from == null || from === to) return; moveProject(from, to); };

  if (!projects.length) {
    return <div style={{ fontSize: 14, color: MUTED }}>Пока нет проектов. Нажмите «+ Новый проект».</div>;
  }
  return (
    <div>
      <div style={{ border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
        {projects.map((p, i) => {
          const dragging = dragId === p.id;
          const over = overId === p.id && dragId !== p.id;
          const hov = hoverId === p.id;
          return (
            <div key={p.id}
              onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId(null)}
              onDragOver={(e) => { e.preventDefault(); if (overId !== p.id) setOverId(p.id); }}
              onDrop={(e) => { e.preventDefault(); drop(i); }}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderTop: i ? "1px dotted #ececec" : "none",
                background: over ? "#f4f7ff" : hov ? "rgba(0,0,0,.02)" : "transparent", opacity: dragging ? 0.4 : 1, transition: "background-color .12s ease" }}>
              {/* Ручка перетаскивания */}
              {canManage && (
                <span draggable onDragStart={() => { dragFrom.current = i; setDragId(p.id); }} onDragEnd={() => { dragFrom.current = null; setDragId(null); setOverId(null); }}
                  title="Перетащите" style={{ cursor: "grab", color: hov ? "#9a9a9a" : "#cdcdcd", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0, transition: "color .12s ease" }}>⠿</span>
              )}
              {/* мини-превью */}
              <div style={{ width: 96, height: 62, borderRadius: 8, overflow: "hidden", background: "#111", flexShrink: 0, position: "relative" }}>
                {p.shots?.[0] ? <img src={p.shots[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#666", fontSize: 11 }}>нет фото</div>}
                {p.logo && <div style={{ position: "absolute", left: 6, top: 6, width: 20, height: 20, borderRadius: "50%", background: "#fff", overflow: "hidden" }}><img src={p.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} /></div>}
              </div>
              {/* данные */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.objectTitle || p.client || "Без названия"}</span>
                  {i < 2 && <span style={{ fontSize: 11, color: "#0a7d33", background: "#e3f4e8", borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{i === 0 ? "На главной · слева" : "На главной · справа"}</span>}
                </div>
                <div style={{ marginTop: 3, fontSize: 13, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {[p.customer || p.name, p.location, p.year].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              {/* действия — проявляются при наведении на ряд */}
              {canManage && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, opacity: hov ? 1 : 0, transition: "opacity .14s ease", pointerEvents: hov ? "auto" : "none" }}>
                  <HoverCapsule small onClick={() => onEdit(p.id)}>Изменить</HoverCapsule>
                  <TrashBtn onClick={async () => { if (await confirmDialog({ title: "Удалить проект?", message: "Проект будет убран из витрины на сайте.", confirmText: "Удалить" })) removeProject(p.id); }} title="Удалить проект" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canManage && (
        <div style={{ marginTop: 16, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          Перетащите проект за <span style={{ color: "#9a9a9a" }}>⠿</span>, чтобы поменять порядок: первые два показываются на главной (слева и справа).
        </div>
      )}

      {canManage && (
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
          {confirmReset ? (
            <>
              <span style={{ fontSize: 13, color: MUTED }}>Вернуть заводской набор (два проекта)? Добавленные будут удалены.</span>
              <HoverCapsule small accent onClick={() => { resetProjects(); setConfirmReset(false); }}>Да, сбросить</HoverCapsule>
              <HoverCapsule small onClick={() => setConfirmReset(false)}>Отмена</HoverCapsule>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)}
              style={{ border: "none", background: "none", color: MUTED, fontFamily: UI, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }} onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}>
              Сбросить к заводскому набору
            </button>
          )}
        </div>
      )}
    </div>
  );
}
