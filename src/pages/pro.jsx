// src/pages/pro.jsx
import React from "react";

/* ====== BACKEND URL ====== */
const FALLBACK_URL = "https://functions.yandexcloud.net/d4emaopknkiq93o92km8?tag=%24latest&integration=raw";
const BACKEND_URL = (import.meta.env?.VITE_BACKEND_URL || FALLBACK_URL).trim();

/* ====== UI константы ====== */
const UI = "'Inter Tight','Inter',system-ui";
const BG = "#f8f8f8";
const CARD = "#ededed";
const BORDER = "#e5e5e5";
const BORDER_DARK = "#cfcfcf";
const TEXT = "#111";
const PH = "#A7A7A7";
const MUTED = "#6b7280";
const ERR = "#fa5d29";
const EDGE = 80;

const FIELD_H = 46;
const R = 0;

const UNDERLINE = "#d7d7d7";
const UNDERLINE_FOCUS = "#8d8d8d";

/* шаги */
const STEP_D = 18;
const STEP_FILL = 0.60;

/* валидаторы */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isPhoneLike = (v) => ((v || "").replace(/\D/g, "").length >= 10);

/* подсказка об ошибке */
function ErrorSlot({ text }) {
  return (
    <div style={{ minHeight: 18, paddingTop: 6 }}>
      {!!text && <span style={{ color: ERR, fontSize: 11, lineHeight: "11px", fontWeight: 300 }}>{text}</span>}
    </div>
  );
}

/* чекбокс */
function Square({ checked }) {
  const size = 18, inner = 10;
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, display: "inline-grid", placeItems: "center",
      border: `1px solid ${BORDER_DARK}`, borderRadius: 4, background: "transparent",
    }}>
      <span style={{
        width: inner, height: inner, borderRadius: 3, background: TEXT,
        transform: checked ? "scale(1)" : "scale(0)", transition: "transform 140ms ease-out",
      }}/>
    </span>
  );
}

/* чипы */
function Chip({ label, selected, onToggle }) {
  const base = "#f8f8f8";
  const hover = "#f2f2f2";
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        height: 40, padding: "0 14px",
        borderRadius: 10, border: "none",
        background: selected ? "#fff" : base,
        cursor: "pointer", userSelect: "none",
        transition: "background-color .12s ease, box-shadow .15s ease",
        fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT,
        whiteSpace: "nowrap"
      }}
      onMouseEnter={(e)=>{ if(!selected) e.currentTarget.style.background=hover; }}
      onMouseLeave={(e)=>{ if(!selected) e.currentTarget.style.background=base; }}
    >
      <Square checked={selected} />
      <span>{label}</span>
    </button>
  );
}

/* заголовок поля */
function Field({ label, required, children, error, dim=false }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase",
          color: dim ? PH : TEXT, fontWeight: 300, marginBottom: 6
        }}
      >
        {label}{required ? " (*)" : ""}
      </div>
      {children}
      <ErrorSlot text={error} />
    </div>
  );
}

/* стиль инпутов */
function baseFieldStyle(error) {
  return {
    width: "100%", height: FIELD_H,
    border: "none", borderRadius: R, outline: "none",
    background: "#fff", color: TEXT, padding: "0 12px",
    fontFamily: UI, fontSize: 14, fontWeight: 300,
    boxShadow: error ? `inset 0 -1px 0 0 ${ERR}` : `inset 0 -1px 0 0 ${UNDERLINE}`,
    transition: "box-shadow .18s ease, background-color .15s ease",
  };
}
function Input({ value, onChange, placeholder, error, type="text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      placeholder={placeholder}
      className="with-ph"
      style={baseFieldStyle(error)}
      onFocus={(e)=>{ e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e)=>{ e.currentTarget.style.boxShadow = error ? `inset 0 -1px 0 0 ${ERR}` : `inset 0 -1px 0 0 ${UNDERLINE}`; }}
    />
  );
}
function Textarea({ value, onChange, rows=5, error, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="with-ph"
      style={{ ...baseFieldStyle(error), minHeight: 120, padding: 12, height: "auto", resize: "vertical" }}
      onFocus={(e)=>{ e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e)=>{ e.currentTarget.style.boxShadow = error ? `inset 0 -1px 0 0 ${ERR}` : `inset 0 -1px 0 0 ${UNDERLINE}`; }}
    />
  );
}

/* индикатор шага */
function StepDot({ active }) {
  const inner = Math.round(STEP_D * STEP_FILL);
  return (
    <span aria-hidden="true" style={{
      width: STEP_D, height: STEP_D, borderRadius: 9999, position: "relative",
      border: `1px solid ${active ? TEXT : BORDER_DARK}`,
      background: active ? "#fff" : "transparent",
      display: "inline-block",
      transition: "border-color .15s ease, background-color .15s ease"
    }}>
      {active && <span aria-hidden="true" style={{
        width: inner, height: inner, borderRadius: 9999, background: TEXT,
        position: "absolute", inset: 0, margin: "auto",
        transition: "transform .15s ease"
      }}/>}
    </span>
  );
}

/* города — кастомный селект */
const fallbackCities = ["Москва","Санкт-Петербург","Новосибирск","Екатеринбург","Казань","Нижний Новгород","Челябинск","Самара","Омск","Ростов-на-Дону","Уфа","Красноярск","Пермь","Воронеж","Волгоград"];

function CitySelect({ value, onChange, error, offset = 0 }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cities, setCities] = React.useState(fallbackCities);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    const url = `${(import.meta?.env?.BASE_URL || "/")}data/cities-ru.json`;
    fetch(url, { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(arr => { if (!cancelled) setCities(Array.isArray(arr) ? arr : (Array.isArray(arr?.cities) ? arr.cities : fallbackCities)); })
      .catch(()=>{});
    return () => { cancelled = true; };
  }, []);

  const Arrow = ({ up }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
      {up
        ? <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter"/>
        : <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter"/>}
    </svg>
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(c => String(c).toLowerCase().includes(q));
  }, [query, cities]);

  React.useEffect(() => {
    const onDocClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const inputStyle = {
    ...baseFieldStyle(error),
    display: "grid",
    gridTemplateColumns: "1fr 24px",
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
    outline: "none",
    borderRadius: 0,
    boxShadow: open ? "none" : (error ? `inset 0 -1px 0 0 ${ERR}` : `inset 0 -1px 0 0 ${UNDERLINE}`),
  };

  return (
    <Field label="Город" required error={error}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="with-ph"
          style={inputStyle}
          aria-haspopup="listbox"
          aria-expanded={open}
          onKeyDown={(e)=>{
            if (e.key === "ArrowDown") { setOpen(true); e.preventDefault(); }
            if (e.key === "Escape") { setOpen(false); }
          }}
        >
          <span style={{ color: value ? TEXT : PH }}>{value || "Выберите город"}</span>
          <Arrow up={open}/>
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: FIELD_H + (offset || 0),
              zIndex: 70,
              background: "#fff",
              border: "none",
              borderRadius: 0,
              boxShadow: "0 14px 40px rgba(0,0,0,.08)",
              overflow: "hidden"
            }}
            role="listbox"
          >
            <div style={{ padding: 10, borderBottom: `1px solid ${UNDERLINE}` }}>
              <input
                autoFocus
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                className="with-ph"
                placeholder="Поиск города…"
                style={{
                  width: "100%", height: 38, border: "none", outline: "none",
                  background: "#fff", padding: "0 10px",
                  fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT,
                }}
                onKeyDown={(e)=>{ if(e.key==="Escape"){ setOpen(false);} }}
              />
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 14, fontWeight: 300, color: MUTED }}>Не найдено</div>
              ) : filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "12px 14px",
                    border: "none", background: "#fff", cursor: "pointer",
                    fontFamily: UI, fontSize: 16, fontWeight: 300, color: TEXT,
                    transition: "background-color .12s ease",
                  }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background = BG; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background = "#fff"; }}
                  role="option"
                  aria-selected={value === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

/* ====== СПИННЕР (круг точек) ====== */
function DotsCircle() {
  const size = 20, dot = 3, r = 8, cx = size/2, cy = size/2;
  const items = new Array(8).fill(0).map((_,i) => {
    const a = (i/8) * 2 * Math.PI;
    return {
      left: cx + r * Math.cos(a) - dot/2,
      top:  cy + r * Math.sin(a) - dot/2,
      delay: i * 0.1
    };
  });
  return (
    <span aria-hidden="true" style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
      <style>{`
        @keyframes dcFade { 0% { opacity: .25 } 50% { opacity: 1 } 100% { opacity: .25 } }
      `}</style>
      {items.map((p,i)=>(
        <span key={i} style={{
          position: "absolute",
          left: p.left, top: p.top,
          width: dot, height: dot, borderRadius: 9999, background: TEXT,
          animation: "dcFade 1s linear infinite",
          animationDelay: `${p.delay}s`
        }}/>
      ))}
    </span>
  );
}

/* ====== Privacy link (новая вкладка) ====== */
function PrivacyLink() {
  return (
    <a
      href="/legal/privacy"
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: TEXT, textDecoration: "none", fontWeight: 600 }}
    >
      Политикой конфиденциальности
    </a>
  );
}

/* ====== UPLOAD FIELD (иконка + спиннер + «острый» крестик) ====== */
function UploadField({ onPicked, onClear, fileName, uploading }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const name = fileName || "Файл не выбран";
  const disabled = !!uploading;

  const openPicker = () => { if (!disabled) inputRef.current?.click(); };
  const onChange = (e) => {
    const f = e.target.files?.[0] || null;
    onPicked?.(f);
    e.target.value = ""; // позволяем выбрать тот же файл повторно
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={onChange}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={openPicker}
          onMouseEnter={()=>setHover(true)}
          onMouseLeave={()=>setHover(false)}
          style={{
            ...baseFieldStyle(false),
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: 10,
            width: "100%",
            boxShadow: hover && !disabled ? `inset 0 0 0 1px ${UNDERLINE_FOCUS}` : `inset 0 -1px 0 0 ${UNDERLINE}`,
            opacity: disabled ? .7 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          onFocus={(e)=>{ e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${UNDERLINE_FOCUS}`; }}
          onBlur={(e)=>{ e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE}`; }}
        >
          {/* иконка рядом с текстом */}
          <span aria-hidden="true" style={{ display:"inline-grid", placeItems:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14V8m0 0l-3 3m3-3l3 3" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>

          {/* текст */}
          <span
            className="with-ph"
            style={{
              fontFamily: UI, fontSize: 14, fontWeight: 300,
              color: name==="Файл не выбран" ? PH : TEXT,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
            }}
          >
            {name}
          </span>

          {/* справа — спиннер, если идёт загрузка */}
          <span style={{ display: "inline-grid", placeItems: "center", width: 24, height: 24 }}>
            {uploading ? <DotsCircle/> : null}
          </span>
        </button>

        {/* «острый» крестик — как стрелка в селекте, без hover-эффектов */}
        {(name !== "Файл не выбран" && !uploading) && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Убрать файл"
            title="Убрать файл"
            style={{
              position: "absolute", right: 8, top: 8,
              width: 24, height: 24,
              border: "none", background: "transparent",
              padding: 0, borderRadius: 0, cursor: "pointer"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
              <path d="M6 6l12 12M6 18L18 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter"/>
            </svg>
          </button>
        )}
      </div>

      <div style={{ marginTop: 6, fontSize: 12, lineHeight: "16px", fontWeight: 300, color: MUTED }}>
        PDF, DOCX — по возможности до 10 МБ
      </div>
    </>
  );
}

/* ——— страница ——— */
export default function ProJobsPage() {
  /* базовые */
  const [fio, setFio] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [city, setCity] = React.useState("");

  /* ролевая часть */
  const roles = [
    "Электромонтажник","Монтажник СКС / СКУД / CCTV","Инженер-проектировщик",
    "Инженер ПНР (пусконаладка)","Слесарь / разнорабочий","Бригадир / прораб",
    "Сервисный инженер","Другое"
  ];
  const [role, setRole] = React.useState("");
  const [employment, setEmployment] = React.useState("");

  /* опыт/навыки */
  const [exp, setExp] = React.useState("");
  const skills = [
    "Электромонтаж (ВРУ, щиты, кабельные линии)",
    "Слаботочные системы",
    "Вентиляция / дымоудаление (монтаж, обвязка)",
    "Кондиционирование",
    "Отопление / ИТП / БТП",
    "Водоснабжение и канализация (ХВС/ГВС, ВК)",
    "Автоматика / АСУ ТП / КИПиА",
    "Проектирование (ЭОМ / ОВ / ВК / СС)",
    "ПНР, балансировка, измерения",
    "Сервис и ТО",
    "Другое",
  ];
  const [skillset, setSkillset] = React.useState([]);
  const permits = ["Электробезопасность II","Электробезопасность III","Электробезопасность IV","Электробезопасность V","Работы на высоте","Стропальщик","ПТМ / ПТБ","Сварка","Пайка медных труб","ПНР / измерения","Нет / в процессе","Другое"];
  const [permset, setPermset] = React.useState([]);
  const tools = ["Есть ручной инструмент","Есть электроинструмент","Есть автомобиль","Нет"];
  const [toolset, setToolset] = React.useState([]);

  /* условия */
  const [start, setStart] = React.useState("");
  const [travel, setTravel] = React.useState("");
  const schedules = ["5/2","Смены 2/2","Ночные смены","Выходные по согласованию"];
  const [sched, setSched] = React.useState([]);

  const [payType, setPayType] = React.useState("");
  const [income, setIncome] = React.useState("");
  const [customIncome, setCustomIncome] = React.useState("");

  /* портфолио */
  const [link, setLink] = React.useState("");
  const [about, setAbout] = React.useState("");

  // файл: локальный, метаданные после загрузки и индикатор загрузки
  const [resumeFile, setResumeFile] = React.useState(null); // File|null (пока грузим)
  const [resumeMeta, setResumeMeta] = React.useState(null); // {name,type,size,diskPath,appId}|null
  const [uploadingResume, setUploadingResume] = React.useState(false);

  /* финал */
  const [agree, setAgree] = React.useState(false);
  const [preferred, setPreferred] = React.useState("");
  const [errors, setErrors] = React.useState({});

  /* отправка */
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState("");
  const [modal, setModal] = React.useState(false);

  /* мгновенно снимать ошибку по ключу */
  const clearError = React.useCallback((key) => {
    setErrors(prev => (prev?.[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  /* справочники */
  const expOptions = ["Без опыта","1–2 года","3–5 лет","6–9 лет","10+ лет"];
  const startOptions = ["Сегодня–завтра","В течение недели","В течение месяца","Обсудим"];
  const travelOptions = ["Готов к вахте","Готов к коротким командировкам","Только в городе","Обсудим"];
  const payOptions = ["Почасовая","За смену","Ежемесячная","Сдельная (за объект)"];
  const incomeShift = ["За смену: 3–4 тыс ₽","За смену: 4–6 тыс ₽","За смену: 6–8 тыс ₽","За смену: 8+ тыс ₽"];
  const incomeMonth = ["В месяц: до 60\u00A0000 ₽","В месяц: 60–90\u00A0000 ₽","В месяц: 90–130\u00A0000 ₽","В месяц: 130\u00A0000+ ₽","Укажу свой уровень"];

  /* фильтрация доходов по формату оплаты */
  const incomesByPay = React.useMemo(() => ({
    "За смену": incomeShift,
    "Ежемесячная": incomeMonth,
    "Почасовая": ["Укажу свой уровень"],
    "Сдельная (за объект)": ["Укажу свой уровень"]
  }), []);

  /* логика дохода */
  React.useEffect(() => {
    if (!payType) { setIncome(""); setCustomIncome(""); return; }
    if (payType === "Почасовая" || payType === "Сдельная (за объект)") {
      setIncome("Укажу свой уровень");
      clearError("income");
      return;
    }
    setIncome("");
    setCustomIncome("");
  }, [payType, clearError]);

  const toggleMulti = (arr, setArr, value) =>
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : arr.concat(value));

  const scrollToFirstError = (map) => {
    const keys = Object.keys(map).filter(k=>map[k]);
    if (!keys.length) return;
    document.querySelector(`[data-err-key="${keys[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* ==== форматирование message для письма ==== */
  function buildMessage() {
    const list = (arr) => (arr && arr.length ? arr.join(", ") : "—");
    const money = income === "Укажу свой уровень" ? (customIncome || "—") : (income || "—");
    const fileLabel = resumeMeta?.name || resumeFile?.name || "Файл не выбран";
    return [
      "АНКЕТА — «Работа в КУБ»",
      "",
      "— Контакты",
      `ФИО: ${fio || "—"}`,
      `Email: ${email || "—"}`,
      `Телефон: ${phone || "—"}`,
      `Город: ${city || "—"}`,
      "",
      "— Желаемая позиция",
      `Должность: ${role || "—"}`,
      `Формат занятости: ${employment || "—"}`,
      "",
      "— Опыт и навыки",
      `Опыт работы: ${exp || "—"}`,
      `Направления: ${list(skillset)}`,
      `Удостоверения/допуски: ${list(permset)}`,
      `Инструмент/транспорт: ${list(toolset)}`,
      "",
      "— Готовность к работе",
      `Старт: ${start || "—"}`,
      `Командировки/вахта: ${travel || "—"}`,
      `График: ${list(sched)}`,
      `Формат оплаты: ${payType || "—"}`,
      `Ожидаемый доход: ${money}`,
      "",
      "— Портфолио",
      `Ссылка: ${link || "—"}`,
      `Файл резюме: ${fileLabel}`,
      "",
      "— Дополнительно",
      `О себе: ${about || "—"}`,
      `Связаться: ${preferred || "—"}`,
      `Согласие: ${agree ? "Да" : "Нет"}`,
    ].join("\n");
  }

  /* ===== ХЕЛПЕРЫ ДЛЯ БЕКЕНДА ===== */
  const fixBackendUrl = React.useCallback(() => {
    try {
      let s = BACKEND_URL;
      if (s.includes("tag=$latest")) s = s.replace("tag=$latest", "tag=%24latest");
      if (/\btag=$(&|$)/.test(s)) s = s.replace("tag=$", "tag=%24");
      return s;
    } catch { return BACKEND_URL; }
  }, []);

  async function postJSON(payload) {
    const url = fixBackendUrl();
    const res = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    if (data && data.statusCode && typeof data.body === "string") {
      try { data = JSON.parse(data.body); } catch {}
    }
    return { res, data, raw: text };
  }

  async function prepareUploadOnServer(fileName, fileSize, fileType) {
    const { res, data } = await postJSON({ intent: "disk.prepareUpload", fileName, fileSize, fileType });
    if (!res.ok || !data || data.ok !== true) {
      const err = new Error("prepare_failed");
      err.stage = data?.stage || "prepare";
      err.code  = data?.code  || "unknown";
      err.status= data?.status|| res.status;
      throw err;
    }
    return { appId: data.appId, uploadUrl: data.uploadUrl, diskPath: data.diskPath };
  }

  async function putFileToDisk(uploadUrl, file) {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file?.type || "application/octet-stream" },
    });
    const ok = res.status === 201 || res.status === 202 || res.status === 200;
    if (!ok) {
      const err = new Error("upload_failed");
      err.status = res.status;
      throw err;
    }
  }

  /* ===== Валидация и мгновенная загрузка файла ===== */
  function validateFile(file) {
    if (!file) return "Файл не выбран.";
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) return "Слишком большой файл — до 10 МБ.";
    const name = (file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();
    const okExt  = /\.(pdf|docx?)$/.test(name);
    const okMime = /application\/pdf|application\/msword|officedocument\.wordprocessingml\.document/.test(type);
    if (!(okExt || okMime)) return "Допустимы только PDF, DOC, DOCX.";
    return "";
  }

  async function handlePickFile(file) {
    setErrors(prev => ({ ...prev, resume: "" }));

    const v = validateFile(file);
    if (v) {
      setErrors(prev => ({ ...prev, resume: v }));
      setResumeFile(null);
      setResumeMeta(null);
      return;
    }

    try {
      setUploadingResume(true);
      setResumeFile(file);
      const { appId, uploadUrl, diskPath } = await prepareUploadOnServer(file.name, file.size, file.type);
      await putFileToDisk(uploadUrl, file);
      setResumeMeta({ appId, diskPath, name: file.name, type: file.type || "", size: file.size || 0 });
      setResumeFile(null);
    } catch (e) {
      setErrors(prev => ({ ...prev, resume: "Не удалось загрузить файл. Попробуйте ещё раз." }));
    } finally {
      setUploadingResume(false);
    }
  }

  function handleClearFile() {
    if (uploadingResume) return;
    setResumeFile(null);
    setResumeMeta(null);
    setErrors(prev => ({ ...prev, resume: "" }));
  }

  /* ==== отправка ==== */
  const sendApplication = async () => {
    setSendError("");

    if (uploadingResume) {
      setSendError("Дождитесь окончания загрузки файла.");
      return;
    }

    try {
      setSending(true);

      const payload = {
        name: fio,
        email,
        phone,
        option: role ? `Новая анкета — ${role}` : "Новая анкета",
        message: buildMessage(),
        page: typeof window !== "undefined" ? window.location.href : "unknown",
        ...(resumeMeta?.appId ? { appId: resumeMeta.appId } : {}),
        ...(resumeMeta ? { file: {
          name: resumeMeta.name, type: resumeMeta.type, size: resumeMeta.size, diskPath: resumeMeta.diskPath
        }} : {}),
      };

      const { res, data } = await postJSON(payload);
      if (!res.ok || !(data && data.ok === true)) {
        throw new Error(`send_failed_${res.status}`);
      }

      setModal(true);
      setTimeout(() => setModal(false), 2000);
    } catch (e) {
      console.error("[pro] send error:", e);
      setSendError("Не удалось отправить анкету. Попробуйте ещё раз или напишите на info@cube-tech.ru");
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    const next = {};
    if (!fio.trim()) next.fio = "Укажите фамилию и имя.";
    if (!phone.trim() || !isPhoneLike(phone)) next.phone = "Укажите телефон в формате +7 (XXX) XXX-XX-XX.";
    if (!email.trim()) next.email = "Укажите e-mail.";
    else if (!isEmail(email)) next.email = "Неверный формат e-mail.";
    if (!city) next.city = "Выберите город.";
    if (!role) next.role = "Выберите должность.";
    if (!employment) next.employment = "Выберите формат занятости.";
    if (!exp) next.exp = "Укажите опыт работы.";
    if (skillset.length === 0) next.skillset = "Отметьте хотя бы одно направление.";
    if (!start) next.start = "Выберите дату начала.";
    if (!travel) next.travel = "Укажите готовность к командировкам/вахте.";
    if (sched.length === 0) next.sched = "Выберите хотя бы один вариант графика.";
    if (!payType) next.payType = "Выберите формат оплаты.";
    if (!income) next.income = "Выберите ожидаемый доход.";
    if (income === "Укажу свой уровень" && !String(customIncome).trim()) next.customIncome = "Укажите сумму.";
    if (!agree) next.agree = "Дайте согласие на обработку данных.";

    setErrors(next);
    scrollToFirstError(next);
    if (Object.values(next).some(Boolean)) return;

    sendApplication();
  };

  const clearAll = () => {
    setFio(""); setPhone(""); setEmail(""); setCity("");
    setRole(""); setEmployment(""); setExp(""); setSkillset([]); setPermset([]); setToolset([]);
    setStart(""); setTravel(""); setSched([]); setPayType(""); setIncome(""); setCustomIncome("");
    setLink(""); setAbout(""); setAgree(false); setPreferred(""); setResumeFile(null); setResumeMeta(null);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* «Нет» — взаимоисключающий */
  const toggleTool = (label) => {
    if (label === "Нет") { setToolset(toolset.includes("Нет") ? [] : ["Нет"]); return; }
    const next = toolset.includes(label)
      ? toolset.filter(v => v !== label)
      : [...toolset.filter(v => v !== "Нет"), label];
    setToolset(next);
  };

  /* ——— трекинг активной секции ——— */
  const sections = React.useMemo(() => ([
    { id: "contacts",  title: "Контактные данные" },
    { id: "role",      title: "Желаемая позиция" },
    { id: "skills",    title: "Опыт и навыки" },
    { id: "availability", title: "Готовность к работе" },
    { id: "portfolio", title: "Портфолио" },
  ]), []);
  const [activeId, setActiveId] = React.useState(sections[0].id);

  React.useEffect(() => {
    const ids = sections.map(s => s.id);
    const calc = () => {
      const anchor = window.scrollY + window.innerHeight * 0.35;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= anchor) current = id; else break;
      }
      setActiveId(current);
    };
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; calc(); }); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    calc();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [sections]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const resumeFileName = resumeMeta?.name || resumeFile?.name || "Файл не выбран";

  return (
    <main style={{ background: BG, minHeight: "100dvh", fontFamily: UI, color: TEXT }}>
      <style>{`.with-ph::placeholder{color:${PH};opacity:1;}`}</style>

      {/* Хиро */}
      <div style={{ paddingTop: 54, paddingBottom: 22, textAlign: "center" }}>
        <div style={{ transform: "translateY(-80px)" }}>
          <div style={{ fontSize: 14, lineHeight: "28px", fontWeight: 300, color: MUTED }}>Вакансии</div>
          <h1 className="about-hero-title" style={{ margin: 0, textTransform: "uppercase", fontWeight: 600 }}>
            РАБОТА В КУБ
          </h1>
          <div style={{ marginTop: 12, fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#222" }}>
            Мы — компания КУБ, занимаемся инженерными системами под ключ: электрика, слаботочка, ОВиК и многое другое.
            <br/>Проекты по всей России. Приглашаем монтажников, инженеров и студентов — на временную и постоянную работу.
          </div>
        </div>
        <div style={{ height: 80 }} />
        <div>
          <div style={{ marginTop: 22, fontSize: 21, lineHeight: "28px", fontWeight: 600, color: "#222" }}>
            Архитектура карьеры строится из реальных задач.
          </div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: "24px", fontWeight: 300, color: "#222" }}>
            Ниже — анкета. Заполните её, и мы свяжемся с вами.
          </div>
        </div>
      </div>

      {/* сетка */}
      <div style={{
        display: "grid", gridTemplateColumns: "240px minmax(640px, 1fr) 280px", gap: 20,
        width: `calc(100% - ${EDGE * 2}px)`, margin: "0 auto", paddingBottom: 60, alignItems: "start",
      }}>
        {/* Этапы */}
        <aside style={{ background: CARD, border: "none", borderRadius: 14, padding: 16, position: "sticky", top: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: TEXT, fontWeight: 300, marginBottom: 10 }}>Этапы</div>
          {sections.map((s) => {
            const active = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                style={{
                  display: "grid", gridTemplateColumns: "18px 1fr", alignItems: "center", gap: 10,
                  padding: "10px 6px", borderRadius: 8, width: "100%", textAlign: "left",
                  background: active ? "#f6f7f8" : "transparent",
                  border: "none", cursor: "pointer",
                }}
              >
                <StepDot active={active} />
                <span style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>{s.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Центр */}
        <section style={{ background: CARD, border: "none", borderRadius: 14, padding: 18 }}>
          {/* Контакты */}
          <div id="contacts" style={{ scrollMarginTop: 90, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Контактные данные</div>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div data-err-key="fio">
                <Field label="Как к вам обращаться?" required error={errors.fio}>
                  <Input
                    value={fio}
                    onChange={(v)=>{ setFio(v); clearError("fio"); }}
                    placeholder="ФИО"
                    error={errors.fio}
                  />
                </Field>
              </div>
              <div data-err-key="phone">
                <Field label="Телефон для связи" required error={errors.phone}>
                  <Input
                    value={phone}
                    onChange={(v)=>{ setPhone(v); clearError("phone"); }}
                    placeholder="+7 (900) 000-00-00"
                    error={errors.phone}
                  />
                </Field>
              </div>

              <div data-err-key="email">
                <Field label="Электронная почта" required error={errors.email}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(v)=>{ setEmail(v); clearError("email"); }}
                    placeholder="имя@домен.ру"
                    error={errors.email}
                  />
                </Field>
              </div>

              <div data-err-key="city">
                <CitySelect
                  value={city}
                  onChange={(v)=>{ setCity(v); clearError("city"); }}
                  error={errors.city}
                  offset={0}
                />
              </div>
            </div>
          </div>

          {/* Желаемая позиция */}
          <div id="role" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Желаемая позиция</div>

            <div data-err-key="role">
              <Field label="Должность" required error={errors.role}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {roles.map(r => (
                    <Chip
                      key={r}
                      label={r}
                      selected={role===r}
                      onToggle={()=>{ setRole(role===r ? "" : r); clearError("role"); }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div data-err-key="employment" style={{ marginTop: 8 }}>
              <Field label="Формат занятости" required error={errors.employment}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {["Проектная (временная)","Постоянная","Не имеет значения"].map(v => (
                    <Chip
                      key={v}
                      label={v}
                      selected={employment===v}
                      onToggle={()=>{ setEmployment(employment===v ? "" : v); clearError("employment"); }}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Опыт и навыки */}
          <div id="skills" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Опыт и навыки</div>

            <div data-err-key="exp">
              <Field label="Опыт работы" required error={errors.exp}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {expOptions.map(v => (
                    <Chip
                      key={v}
                      label={v}
                      selected={exp===v}
                      onToggle={()=>{ setExp(exp===v ? "" : v); clearError("exp"); }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div data-err-key="skillset" style={{ marginTop: 8 }}>
              <Field label="Основные направления работ" required error={errors.skillset}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {skills.map(s => (
                    <Chip
                      key={s}
                      label={s}
                      selected={skillset.includes(s)}
                      onToggle={()=>{ toggleMulti(skillset, setSkillset, s); clearError("skillset"); }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Удостоверения / допуски">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {permits.map(s => (
                    <Chip
                      key={s}
                      label={s}
                      selected={permset.includes(s)}
                      onToggle={()=>{ toggleMulti(permset, setPermset, s); }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Инструмент и транспорт">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {tools.map(s => (
                    <Chip key={s} label={s} selected={toolset.includes(s)} onToggle={()=>{ toggleTool(s); }} />
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Готовность к работе */}
          <div id="availability" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Готовность к работе</div>

            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div data-err-key="start">
                <Field label="Когда готовы приступить" required error={errors.start}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {startOptions.map(v => (
                      <Chip key={v} label={v} selected={start===v} onToggle={()=>{ setStart(start===v ? "" : v); clearError("start"); }} />
                    ))}
                  </div>
                </Field>
              </div>

              <div data-err-key="travel">
                <Field label="Готовность к командировкам / вахте" required error={errors.travel}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {travelOptions.map(v => (
                      <Chip key={v} label={v} selected={travel===v} onToggle={()=>{ setTravel(travel===v ? "" : v); clearError("travel"); }} />
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            <div data-err-key="sched" style={{ marginTop: 8 }}>
              <Field label="Предпочитаемый график" required error={errors.sched}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {schedules.map(v => (
                    <Chip key={v} label={v} selected={sched.includes(v)} onToggle={()=>{ toggleMulti(sched, setSched, v); clearError("sched"); }} />
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
              <div data-err-key="payType">
                <Field label="Формат оплаты" required error={errors.payType}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {payOptions.map(v => (
                      <Chip key={v} label={v} selected={payType===v} onToggle={()=>{ setPayType(payType===v ? "" : v); clearError("payType"); }} />
                    ))}
                  </div>
                </Field>
              </div>

              <div data-err-key="income">
                <Field label="Ожидаемый доход" required error={errors.income} dim={!payType}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {(incomesByPay[payType] || []).map(v => (
                      <Chip
                        key={v} label={v} selected={income===v}
                        onToggle={()=>{ setIncome(income===v ? "" : v); clearError("income"); if (v !== "Укажу свой уровень") { setCustomIncome(""); clearError("customIncome"); } }}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            {income === "Укажу свой уровень" && (
              <div data-err-key="customIncome" style={{ marginTop: 8 }}>
                <Field label="Ваш ожидаемый уровень дохода" required error={errors.customIncome}>
                  <Input
                    value={customIncome}
                    onChange={(v)=>{ setCustomIncome(v); clearError("customIncome"); }}
                    placeholder="Например: 6 000 ₽ за смену / 120 000 ₽ в месяц"
                    error={errors.customIncome}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Портфолио */}
          <div id="portfolio" style={{ scrollMarginTop: 90, marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Портфолио</div>

            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Field label="Ссылка на портфолио / резюме">
                  <Input value={link} onChange={setLink} placeholder="https://…" />
                </Field>
              </div>
              <div data-err-key="resume">
                <Field label="Резюме (файл)" error={errors.resume}>
                  <UploadField
                    onPicked={handlePickFile}
                    onClear={handleClearFile}
                    fileName={resumeFileName}
                    uploading={uploadingResume}
                  />
                </Field>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Коротко о себе">
                <Textarea value={about} onChange={setAbout} placeholder="Например: есть бригада; готов к ночным сменам; нужен аванс и т. п." />
              </Field>
            </div>
          </div>

          {/* Согласие и связь */}
          <div style={{ marginTop: 16, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div data-err-key="agree">
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={()=>{ setAgree(v=>!v); clearError("agree"); }}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                    aria-pressed={agree}
                  >
                    <Square checked={agree} />
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
                    Даю согласие на обработку персональных данных и подтверждаю ознакомление с{" "}
                    <PrivacyLink />.
                  </div>
                </div>
                <ErrorSlot text={errors.agree}/>
              </div>

              <div>
                <Field label="Предпочтительный способ связи">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {["Позвонить","Telegram","WhatsApp","Email","Без разницы"].map(v => (
                      <Chip key={v} label={v} selected={preferred===v} onToggle={()=>setPreferred(preferred===v ? "" : v)} />
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
            <button
              type="button"
              onClick={clearAll}
              style={{
                height: 48, padding: "0 18px",
                background: "transparent", borderRadius: 10,
                border: `1px solid ${BORDER_DARK}`,
                fontFamily: UI, fontSize: 14, fontWeight: 600, color: TEXT, cursor: "pointer",
              }}
              onMouseEnter={(e)=>{ e.currentTarget.style.background="#f6f6f6"; }}
              onMouseLeave={(e)=>{ e.currentTarget.style.background="transparent"; }}
              disabled={sending || uploadingResume}
            >
              Очистить форму
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "end" }}>
              <button
                type="button"
                onClick={onSubmit}
                style={{
                  height: 48, padding: "0 22px",
                  background: TEXT, color: "#fff", border: "none",
                  borderRadius: 10, fontFamily: UI, fontSize: 14, fontWeight: 600,
                  cursor: (sending || uploadingResume) ? "not-allowed" : "pointer",
                  transition: "filter .15s ease", opacity: (sending || uploadingResume) ? .88 : 1,
                }}
                onMouseEnter={(e)=>{ if(!(sending || uploadingResume)) e.currentTarget.style.filter="brightness(0.92)"; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.filter="none"; }}
                disabled={sending || uploadingResume}
                aria-busy={(sending || uploadingResume) ? "true" : "false"}
                title={uploadingResume ? "Идёт загрузка файла…" : undefined}
              >
                {sending ? "Отправка..." : (uploadingResume ? "Загрузка файла…" : "Отправить анкету")}
              </button>
              <ErrorSlot text={sendError}/>
            </div>
          </div>
        </section>

        {/* Правая заметка */}
        <aside style={{ background: CARD, border: "none", borderRadius: 14, padding: 16, position: "sticky", top: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Подсказка</div>
          <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
            Заполняйте только актуальные поля — чем точнее анкета, тем быстрее обратная связь.
            <br/><br/>Отклики рассматриваем в течение 1–2 рабочих дней. Если ответа нет, напишите на <strong>info@cube-tech.ru</strong>.
            <br/><br/>Мы не передаём ваши данные третьим лицам. Они используются только для связи по вакансии.
          </div>
        </aside>
      </div>

      {/* Тост */}
      {modal && (
        <div role="status" aria-live="assertive" style={{
          position: "fixed", inset: 0, zIndex: 2147483647, display: "grid", placeItems: "center", pointerEvents: "none",
        }}>
          <div style={{
            background: "#000", color: "#fff", borderRadius: 12, padding: "14px 18px",
            fontFamily: UI, fontSize: 16, lineHeight: "22px", fontWeight: 500,
            maxWidth: 560, textAlign: "center", boxShadow: "0 6px 30px rgba(0,0,0,.35)",
            display: "inline-flex", alignItems: "center", gap: 10,
            animation: "toastIn .18s ease-out both, toastOut .18s ease-in both 1.82s",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Ваша анкета принята!</span>
          </div>
          <style>{`
            @keyframes toastIn { from { opacity: 0; transform: translateY(4px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
            @keyframes toastOut { from { opacity: 1; transform: translateY(0) scale(1) } to { opacity: 0; transform: translateY(4px) scale(.98) } }
          `}</style>
        </div>
      )}
    </main>
  );
}
