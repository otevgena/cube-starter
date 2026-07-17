import React from "react";
import QRCode from "qrcode";
import ObjectsSection, { EmployeesModule, TemplatesModule, CreateObjectForm, UnderSelect, UnderInput, FLabel, PrimaryBtn } from "@/pages/account/objects/ObjectsSection.jsx";
import { AccessSheetModal } from "@/components/documents/AccessSheet.jsx";
import { BTN as MBTN, inputCls, ErrorSlot as MErrorSlot, FancyCheckbox, Label as MLabel, FormShell } from "@/components/common/Modals.jsx";
import Spinner, { CenterSpinner } from "@/components/common/Spinner.jsx";
import * as DB from "@/data/objects.js";

/* ===== API helpers ===== */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "https://api.cube-tech.ru";
const api = (p) => `${API_BASE}${p}`;

async function apiRefresh(timeoutMs = 1200) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(api("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.accessToken || null;
  } catch {
    clearTimeout(to);
    return null;
  }
}

async function apiMe(token) {
  try {
    const r = await fetch(api("/auth/me"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j?.user || null;
  } catch {
    return null;
  }
}

/* --- профиль пользователя (PUT/PATCH) --- */
async function apiUpdateProfile(token, data) {
  const payload = JSON.stringify(data);
  const common = {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload,
  };
  const tryOne = async (url, method) => {
    try {
      const r = await fetch(api(url), { ...common, method });
      if (!r.ok) return null;
      const j = await r.json().catch(() => null);
      return j || { ok: true };
    } catch {
      return null;
    }
  };
  return await tryOne("/profile", "PATCH");
}

/* --- смена пароля --- */
async function apiChangePassword(token, currentPassword, newPassword) {
  try {
    const r = await fetch(api("/auth/change-password"), {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, accessToken: j && j.accessToken };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* --- первый вход по временному паролю: задать свой пароль (+ опц. почта) --- */
async function apiSetInitialPassword(token, newPassword, notificationEmail) {
  try {
    const payload = { newPassword };
    if (notificationEmail) payload.notificationEmail = notificationEmail;
    const r = await fetch(api("/auth/set-initial-password"), {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, accessToken: j && j.accessToken, emailSet: !!(j && j.emailSet) };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* --- смена почты --- */
async function apiChangeEmail(token, newEmail, password) {
  try {
    const r = await fetch(api("/auth/change-email"), {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newEmail, password }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, accessToken: j && j.accessToken, email: j && j.email };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* --- выйти на всех устройствах --- */
async function apiLogoutAll(token) {
  try {
    const r = await fetch(api("/auth/logout-all"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, accessToken: j && j.accessToken };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* --- активные сессии --- */
async function apiGetSessions(token) {
  try {
    const r = await fetch(api("/auth/sessions"), {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, sessions: (j && j.sessions) || [] };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}
async function apiRevokeSession(token, sid) {
  try {
    const r = await fetch(api("/auth/revoke-session"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sid }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* --- 2FA (TOTP) --- */
async function apiTwofaSetup(token) {
  try {
    const r = await fetch(api("/auth/2fa-setup"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, secret: j && j.secret, otpauthUri: j && j.otpauthUri };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}
async function apiTwofaEnable(token, code) {
  try {
    const r = await fetch(api("/auth/2fa-enable"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, backupCodes: (j && j.backupCodes) || [] };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}
async function apiTwofaDisable(token, password) {
  try {
    const r = await fetch(api("/auth/2fa-disable"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* запрос письма с подтверждением почты */
async function apiRequestVerify(token) {
  try {
    const r = await fetch(api("/auth/request-verify"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true, alreadyVerified: !!(j && j.alreadyVerified) };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* user-agent → человекочитаемое «Устройство · Браузер» */
function describeUserAgent(ua) {
  const s = String(ua || "");
  if (!s) return "Неизвестное устройство";
  let os = "";
  if (/Windows/i.test(s)) os = "Windows";
  else if (/iPhone|iPad|iOS/i.test(s)) os = "iOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/Linux/i.test(s)) os = "Linux";
  let br = "";
  if (/Edg\//i.test(s)) br = "Edge";
  else if (/OPR\/|Opera/i.test(s)) br = "Opera";
  else if (/YaBrowser/i.test(s)) br = "Яндекс.Браузер";
  else if (/Chrome\//i.test(s)) br = "Chrome";
  else if (/Firefox\//i.test(s)) br = "Firefox";
  else if (/Safari\//i.test(s)) br = "Safari";
  else if (/curl/i.test(s)) br = "curl";
  const label = [os, br].filter(Boolean).join(" · ");
  return label || s.slice(0, 40);
}

/* краткая дата активности */
function formatSessionTime(ms) {
  const t = Number(ms) || 0;
  if (!t) return "";
  try {
    return new Date(t).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

/* --- удаление аккаунта --- */
async function apiDeleteAccount(token, password) {
  try {
    const r = await fetch(api("/auth/delete-account"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (j && j.error) || `HTTP ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || "network error" };
  }
}

/* Единая политика пароля (совпадает с backend): ≥6 символов, ≥1 заглавная, ≥1 спецсимвол. */
function passwordPolicyError(pwd) {
  const s = String(pwd || "");
  if (s.length < 6) return "Минимум 6 символов.";
  if (!/[A-ZА-ЯЁ]/.test(s)) return "Нужна заглавная буква.";
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(s)) return "Нужен спецсимвол.";
  return null;
}
const PWD_ERR_MAP = {
  "password too short": "Минимум 6 символов.",
  "password needs uppercase": "Нужна заглавная буква.",
  "password needs symbol": "Нужен спецсимвол.",
  "invalid current password": "Неверный текущий пароль.",
  "new password must differ from current": "Новый пароль совпадает с текущим.",
};

/* --- админ: чтение списка пользователей (сначала /users?admin=1) --- */
async function apiAdminListUsers(token, { limit = 50, offset = 0, q = "", group } = {}) {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(q ? { q } : {}),
    ...(group ? { group } : {}),
  }).toString();

  const optsFor = (tk) => ({
    method: "GET",
    headers: { Authorization: `Bearer ${tk}` },
    credentials: "include",
    cache: "no-store",
  });
  let tk = token;
  const tryOne = async (url) => {
    try {
      let r = await fetch(api(url), optsFor(tk));
      if (r.status === 401) {
        // токен протух — обновляем и повторяем, иначе список «молча» пуст
        const fresh = await apiRefresh(1500);
        if (fresh) { tk = fresh; try { sessionStorage.setItem("auth:accessToken", fresh); } catch {} r = await fetch(api(url), optsFor(tk)); }
      }
      if (!r.ok) return null;
      return await r.json().catch(() => null);
    } catch { return null; }
  };

  const raw = (await tryOne(`/admin/users?${qs}`)) || { users: [], total: 0 };

  const users = Array.isArray(raw?.users) ? raw.users : Array.isArray(raw) ? raw : [];
  const total = Number(raw?.total ?? users.length ?? 0);
  const filtered = group ? users.filter(u => String(u.group||"").toLowerCase() === group) : users;
  return { users: filtered, total: group ? filtered.length : total };
}

/* --- админ: обновление роли/группы (без 404) --- */
async function apiAdminUpdateUser(token, userId, patch) {
  const id = userId ?? patch?.id;
  if (!id) return null;

  const common = {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const tryJSON = async (url, method, bodyObj) => {
    try {
      const r = await fetch(api(url), { ...common, method, body: JSON.stringify(bodyObj) });
      if (!r.ok) return null;
      return (await r.json().catch(() => null)) || { ok: true };
    } catch {
      return null;
    }
  };

  return await tryJSON(`/admin/users/${encodeURIComponent(id)}`, "PATCH", patch);
}

/* --- админ: создание новой учётной записи --- */
async function apiAdminCreateUser(token, { email, login, password, name, group, role, org, inn, kpp, legalAddress } = {}) {
  try {
    const r = await fetch(api("/admin/users"), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, login, password, name, group, role, org, inn, kpp, legalAddress }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (data && data.error) || `http_${r.status}` };
    return { ok: true, user: (data && data.user) || null };
  } catch {
    return { ok: false, error: "network" };
  }
}

/* --- админ: удаление учётной записи --- */
async function apiAdminDeleteUser(token, userId) {
  const id = userId;
  if (!id) return { ok: false };
  const doCall = async (tk) => fetch(api(`/admin/users/${encodeURIComponent(id)}`), {
    method: "DELETE",
    credentials: "include",
    headers: { Authorization: `Bearer ${tk}` },
  });
  try {
    let tk = "";
    try { tk = sessionStorage.getItem("auth:accessToken") || token || ""; } catch { tk = token || ""; }
    let r = await doCall(tk);
    if (r.status === 401) {
      const fresh = await apiRefresh(1500);
      if (fresh) { tk = fresh; try { sessionStorage.setItem("auth:accessToken", fresh); } catch {} r = await doCall(tk); }
    }
    if (!r.ok) return { ok: false, error: `http_${r.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  }
}

/* --- админ: полные данные одной учётки (если бэкенд отдаёт) --- */
async function apiAdminGetUser(token, userId) {
  if (!userId) return null;
  const doCall = async (tk) => fetch(api(`/admin/users/${encodeURIComponent(userId)}`), {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${tk}` },
    cache: "no-store",
  });
  try {
    let tk = "";
    try { tk = sessionStorage.getItem("auth:accessToken") || token || ""; } catch { tk = token || ""; }
    let r = await doCall(tk);
    if (r.status === 401) {
      const fresh = await apiRefresh(1500);
      if (fresh) { tk = fresh; try { sessionStorage.setItem("auth:accessToken", fresh); } catch {} r = await doCall(tk); }
    }
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch {
    return null;
  }
}

/* Генератор временного пароля (админ заводит учётку заказчику).
   Читаемый и легко диктуется: без похожих символов (0/O, 1/l/I) и без спецсимволов.
   Формат «Xxxx-9999» — заглавная + 3 строчные, дефис, 4 цифры (напр. «Rasp-8472»).
   Пароль временный: при первом входе заказчику предложат сменить его на свой. */
function genPassword() {
  const up = "ABCDEFGHJKMNPQRSTUVWXYZ", lo = "abcdefghijkmnpqrstuvwxyz", dg = "23456789";
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const letters = pick(up) + pick(lo) + pick(lo) + pick(lo);
  const digits = pick(dg) + pick(dg) + pick(dg) + pick(dg);
  return `${letters}-${digits}`;
}

/* ===== UI ===== */
const UI = "'Inter Tight','Inter',system-ui";
const TEXT = "#111";
const PH = "#A7A7A7";
const UNDERLINE = "#d7d7d7";
const UNDERLINE_FOCUS = "#8d8d8d";
const ERR = "#fa5d29";

// Автоподстановка организации по ИНН через НАШ серверный прокси /profile/dadata.
// Токен DaData больше НЕ на клиенте — он лежит на сервере (Lockbox) и подставляется
// в функции profile. Прокси требует авторизации (Bearer accessToken).
async function dadataProxy(mode, query, count) {
  let token = "";
  try { token = sessionStorage.getItem("auth:accessToken") || ""; } catch {}
  const call = (tk) => fetch(api("/profile/dadata"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
    body: JSON.stringify({ mode, query, count }),
  });
  try {
    if (!token) { token = (await apiRefresh(1500)) || ""; if (token) { try { sessionStorage.setItem("auth:accessToken", token); } catch {} } }
    if (!token) return [];
    let r = await call(token);
    if (r.status === 401) {
      // токен протух в середине сессии — обновляем и повторяем
      const fresh = await apiRefresh(1500);
      if (fresh) { token = fresh; try { sessionStorage.setItem("auth:accessToken", token); } catch {} r = await call(token); }
    }
    if (!r.ok) return [];
    const j = await r.json().catch(() => null);
    return (j && j.suggestions) || [];
  } catch { return []; }
}
async function lookupOrgByInn(inn) {
  const q = String(inn || "").replace(/\D/g, "");
  if (!(q.length === 10 || q.length === 12)) return null;
  const list = await dadataProxy("find", q);
  const s = list && list[0];
  if (!s) return null;
  return { name: s.value, kpp: (s.data && s.data.kpp) || "", address: (s.data && s.data.address && s.data.address.value) || "" };
}
// Подсказки организаций (автокомплит) по названию или ИНН
async function suggestOrg(q) {
  const query = String(q || "").trim();
  if (query.length < 3) return [];
  const list = await dadataProxy("suggest", query, 6);
  return list.map((s) => ({
    name: s.value,
    inn: (s.data && s.data.inn) || "",
    kpp: (s.data && s.data.kpp) || "",
    address: (s.data && s.data.address && s.data.address.value) || "",
  }));
}
const FIELD_H = 48;

/* Подчёркнутый поиск — один в один как в разделе «Сотрудники» */
function UnderSearch({ value, onChange, placeholder }) {
  const [foc, setFoc] = React.useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, width: "100%", maxWidth: 460, boxShadow: `inset 0 -1px 0 0 ${foc ? UNDERLINE_FOCUS : UNDERLINE}`, transition: "box-shadow .18s ease" }}>
      <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0, color: foc ? TEXT : "#b1b1b1", transition: "color .18s ease" }}><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} placeholder={placeholder}
        style={{ border: 0, background: "transparent", outline: "none", width: "100%", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT }} />
    </div>
  );
}

function ErrorSlot({ text }) {
  return (
    <div style={{ minHeight: 18, paddingTop: 6 }}>
      {!!text && (
        <span style={{ color: ERR, fontSize: 11, lineHeight: "11px", fontWeight: 300 }}>
          {text}
        </span>
      )}
    </div>
  );
}
function Field({ label, required, children, error, dim = false }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: dim ? PH : TEXT,
          fontWeight: 300,
          marginBottom: 6,
        }}
      >
        {label}
        {required ? " (*)" : ""}
      </div>
      {children}
      <ErrorSlot text={error} />
    </div>
  );
}
function baseFieldStyle(error) {
  return {
    width: "100%",
    height: FIELD_H,
    border: "none",
    outline: "none",
    borderRadius: 0,
    background: "#fff",
    color: TEXT,
    padding: "0 12px",
    fontFamily: UI,
    fontSize: 14,
    fontWeight: 300,
    boxShadow: error
      ? `inset 0 -1px 0 0 ${ERR}`
      : `inset 0 -1px 0 0 ${UNDERLINE}`,
    transition: "box-shadow .18s ease",
  };
}
function Input({ value, onChange, placeholder, error, type = "text", readOnly = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => { if (!readOnly) onChange?.(e.target.value); }}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      className="with-ph"
      style={{ ...baseFieldStyle(error), ...(readOnly ? { cursor: "default", color: "#6b6b6b", caretColor: "transparent" } : null) }}
      onFocus={(e) => { if (!readOnly) e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = error
          ? `inset 0 -1px 0 0 ${ERR}`
          : `inset 0 -1px 0 0 ${UNDERLINE}`;
      }}
    />
  );
}
function Textarea({ value, onChange, rows = 5, error, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="with-ph"
      style={{
        ...baseFieldStyle(error),
        minHeight: 93,
        padding: 12,
        height: "auto",
        resize: "vertical",
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 0 ${UNDERLINE_FOCUS}`; }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = error
          ? `inset 0 -1px 0 0 ${ERR}`
          : `inset 0 -1px 0 0 ${UNDERLINE}`;
      }}
    />
  );
}

/* чекбокс */
function Square({ checked }) {
  const size = 18, inner = 10;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        border: "1px solid #cfcfcf",
        borderRadius: 4,
        background: "transparent",
      }}
    >
      <span
        style={{
          width: inner,
          height: inner,
          borderRadius: 3,
          background: TEXT,
          transform: checked ? "scale(1)" : "scale(0)",
          transition: "transform 140ms ease-out",
        }}
      />
    </span>
  );
}

/* замочек */
const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 6 }}>
    <path
      d="M7 10V8a5 5 0 0110 0v2M6 10h12v10H6z"
      fill="none"
      stroke="#8a8a8a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ===== Группы (серверные коды ↔ русские подписи) ===== */
const GROUPS = [
  { code: "customer",   label: "Заказчик" },
  { code: "user",       label: "Пользователь" },
  { code: "performer",  label: "Исполнитель" },
  { code: "contractor", label: "Подрядчик" },
  { code: "designer",   label: "Проектировщик" },
  { code: "other",      label: "Другое" },
  { code: "supplier",   label: "Поставщик", locked: true },
  { code: "partner",    label: "Партнёр",   locked: true },
];
const labelByCode = (code) => GROUPS.find(g => g.code === code)?.label || "";
const isLockedCode = (code) => !!GROUPS.find(g => g.code === code)?.locked;
const toCode = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (GROUPS.some(g => g.code === s)) return s;
  const found = GROUPS.find(g => g.label.toLowerCase() === s);
  return found?.code || "user";
};

/* селект групп (используем и в админке) */
function GroupSelect({ value, onChange, error, canPickLocked = false }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="with-ph"
        style={{
          ...baseFieldStyle(error),
          display: "grid",
          gridTemplateColumns: "1fr 24px",
          alignItems: "center",
          textAlign: "left",
          cursor: "pointer",
        }}
        aria-expanded={open}
      >
        <span style={{ color: value ? TEXT : PH }}>
          {value ? labelByCode(value) : "Выберите вариант"}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
          {open ? (
            <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" />
          ) : (
            <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
          )}
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: FIELD_H,
            background: "#fff",
            boxShadow: "0 14px 40px rgba(0,0,0,.08)",
            zIndex: 5,
          }}
          role="listbox"
        >
          {GROUPS.map((g) => {
            const disabled = g.locked && !canPickLocked && value !== g.code;
            return (
              <button
                key={g.code}
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) { onChange(g.code); setOpen(false); } }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "none",
                  background: "#fff",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontFamily: UI,
                  fontSize: 16,
                  fontWeight: 300,
                  color: disabled ? "#b7b7b7" : TEXT,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "#fff"; }}
                role="option"
                aria-selected={value === g.code}
              >
                {g.locked ? <Lock /> : null}
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* селект ролей доступа (admin/manager/user) — стиль как у GroupSelect */
function AccessRoleSelect({ value, onChange }) {
  const OPTIONS = [
    { code: "user", label: "User" },
    { code: "manager", label: "Manager" },
    { code: "admin", label: "Admin" },
  ];
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const current = OPTIONS.find(o => o.code === value) ? value : "user";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="with-ph"
        style={{
          ...baseFieldStyle(false),
          display: "grid",
          gridTemplateColumns: "1fr 24px",
          alignItems: "center",
          textAlign: "left",
          cursor: "pointer",
        }}
        aria-expanded={open}
      >
        <span style={{ color: TEXT }}>
          {OPTIONS.find(o => o.code === current)?.label || "User"}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
          {open ? (
            <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" />
          ) : (
            <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
          )}
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0, right: 0, top: FIELD_H,
            background: "#fff",
            boxShadow: "0 14px 40px rgba(0,0,0,.08)",
            zIndex: 5,
          }}
          role="listbox"
        >
          {OPTIONS.map(o => (
            <button
              key={o.code}
              type="button"
              onClick={() => { onChange?.(o.code); setOpen(false); }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                border: "none",
                background: "#fff",
                cursor: "pointer",
                fontFamily: UI, fontSize: 16, fontWeight: 300, color: TEXT,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              role="option"
              aria-selected={current === o.code}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* города */
const fallbackCities = [
  "Москва","Санкт-Петербург","Новосибирск","Екатеринбург","Казань",
  "Нижний Новгород","Челябинск","Самара","Омск","Ростов-на-Дону",
  "Уфа","Красноярск","Пермь","Воронеж","Волгоград",
];
function CitySelect({ value, onChange, error, offset = 0 }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cities, setCities] = React.useState(fallbackCities);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    const url = `${(import.meta?.env?.BASE_URL || "/")}data/cities-ru.json`;
    fetch(url, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((arr) => { if (!cancelled) setCities(Array.isArray(arr) ? arr : Array.isArray(arr?.cities) ? arr.cities : fallbackCities); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const Arrow = ({ up }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
      {up ? <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" />
          : <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => String(c).toLowerCase().includes(q));
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
    borderRadius: 0,
    boxShadow: open
      ? "none"
      : error
      ? `inset 0 -1px 0 0 ${ERR}`
      : `inset 0 -1px 0 0 ${UNDERLINE}`,
  };

  return (
    <Field label="Город" required error={error}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="with-ph"
          style={inputStyle}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span style={{ color: value ? TEXT : PH }}>{value || "Выберите город"}</span>
          <Arrow up={open} />
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
              boxShadow: "0 14px 40px rgba(0,0,0,.08)",
              overflow: "hidden",
            }}
            role="listbox"
          >
            <div style={{ padding: 10, borderBottom: `1px solid ${UNDERLINE}` }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="with-ph"
                placeholder="Поиск города…"
                style={{
                  width: "100%",
                  height: 38,
                  border: "none",
                  outline: "none",
                  background: "#fff",
                  padding: "0 10px",
                  fontFamily: UI,
                  fontSize: 14,
                  fontWeight: 300,
                  color: TEXT,
                }}
              />
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 14, fontWeight: 300, color: "#6b7280" }}>
                  Не найдено
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      border: "none",
                      background: "#fff",
                      cursor: "pointer",
                      fontFamily: UI,
                      fontSize: 16,
                      fontWeight: 300,
                      color: TEXT,
                      transition: "background-color .12s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                    role="option"
                    aria-selected={value === c}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

/* аватар */
function AvatarPicker({ fileName, onPick, error }) {
  const inputRef = React.useRef(null);
  const open = () => inputRef.current?.click();
  const label = fileName || "Файл не выбран";
  const onChange = (e) => {
    const f = e.target.files?.[0] || null;
    e.target.value = "";
    if (!f) return;
    if (f.size > 400 * 1024) { alert("Макс. размер 400 КБ"); return; }
    onPick?.(f);
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
      <div
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
        style={{
          width: 200, height: 200, border: `1px dashed ${UNDERLINE}`, borderRadius: 10,
          display: "block", padding: 14, cursor: "pointer", background: "#fff",
          boxShadow: error ? `inset 0 0 0 1px ${ERR}` : "none",
        }}
        title="Перетащите или выберите файл"
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "center", transform: "translateY(-5px)" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z"
              fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 14V8m0 0l-3 3m3-3l3 3"
              fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: "center", color: "#222", fontFamily: UI, transform: "translateY(-10px)" }}>
          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 300 }}>
            {label}
            <br />
            Перетащите изображение или выберите файл в списке.
          </div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: "18px", fontWeight: 600 }}>
            Рекомендуемый размер: 400×400 пикселей. Макс. 400 КБ.
          </div>
        </div>
      </div>
      <ErrorSlot text={error} />
    </>
  );
}

/* утиль: файл → dataURL */
const fileToDataURL = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/* ширины/сетка */
const LEFT_COL = 360;
const MID_COL = 714;
const GAP_COL = 78;
const RIGHT_COL = 277;
const PAGE_PAD = 52;
/* раньше было 64 — теперь доводим пунктир и правые блоки ровно до 52 px от края */
const LINE_RIGHT_INSET = 52;
/* ДОБАВКА: расширяем пунктир ТОЛЬКО справа на +64px */
const DOTS_RIGHT_EXTRA = 64;

/* === надежное отслеживание текущего pathname === */
function useLocationPathname() {
  const [pathname, setPathname] = React.useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onPop = () => setPathname(window.location.pathname);

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    try {
      window.history.pushState = function (...args) {
        const ret = origPush.apply(this, args);
        window.dispatchEvent(new Event("locationchange"));
        window.dispatchEvent(new PopStateEvent("popstate"));
        return ret;
      };
      window.history.replaceState = function (...args) {
        const ret = origReplace.apply(this, args);
        window.dispatchEvent(new Event("locationchange"));
        window.dispatchEvent(new PopStateEvent("popstate"));
        return ret;
      };
    } catch {}

    const onLoc = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", onPop);
    window.addEventListener("locationchange", onLoc);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("locationchange", onLoc);
      try {
        window.history.pushState = origPush;
        window.history.replaceState = origReplace;
      } catch {}
    };
  }, []);

  return pathname;
}

/* ===== Секция настроек: 3 колонки (заголовок слева / поля центр / кнопка справа) =====
   Повторяет колонки страницы [360 714 78 277] и рисует тонкий разделитель сверху. */
function SettingsRow({ title, desc, action, children, danger = false, first = false }) {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[360px_714px_78px_277px]"
      style={{
        columnGap: 0,
        alignItems: "start",
        borderTop: first ? "none" : "1px solid #e9e9e9",
        paddingTop: first ? 0 : 44,
        paddingBottom: 44,
      }}
    >
      {/* ЛЕВО — заголовок + описание */}
      <div className="lg:pr-10">
        <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: danger ? "#e2571f" : TEXT }}>
          {title}
        </div>
        {desc ? (
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 300, lineHeight: 1.55, color: "#6f6f6f", maxWidth: 300 }}>
            {desc}
          </div>
        ) : null}
      </div>

      {/* ЦЕНТР — поля / контент */}
      <div className="mt-5 lg:mt-0" style={{ maxWidth: MID_COL }}>
        {children}
      </div>

      {/* ПРОМЕЖУТОК */}
      <div className="hidden lg:block" />

      {/* ПРАВО — основная кнопка секции */}
      <div className="mt-5 lg:mt-0">{action}</div>
    </div>
  );
}

/* Чёрная кнопка действия секции (правая колонка), стиль как у «Сохранить изменения». */
function SectionButton({ onClick, disabled, children, variant = "solid" }) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full lg:w-[277px]"
      style={{
        height: 72,
        borderRadius: 12,
        background: solid ? "#111" : "#fff",
        color: solid ? "#fff" : TEXT,
        border: solid ? "none" : "1px solid #d9d9d9",
        fontFamily: UI,
        fontSize: 18,
        fontWeight: 300,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.85 : 1,
        transition: "background-color .15s ease, border-color .15s ease",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (solid) e.currentTarget.style.backgroundColor = "#262626";
        else e.currentTarget.style.borderColor = "#000";
      }}
      onMouseLeave={(e) => {
        if (solid) e.currentTarget.style.backgroundColor = "#111";
        else e.currentTarget.style.borderColor = "#d9d9d9";
      }}
    >
      {children}
    </button>
  );
}

/* Спиннер на месте кнопки секции: занимает тот же бокс (72×277) и центрирует наш круглишок. */
function SectionBusy() {
  return (
    <div className="w-full lg:w-[277px]" style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={30} />
    </div>
  );
}

/* Иконка «корзина» (удаление аккаунта). */
function TrashIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/* Иконка «щит» (двухфакторная аутентификация). */
function ShieldIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6l7-3z" />
      <path d="M9.2 12l1.9 1.9L15 10" />
    </svg>
  );
}

/* Инлайн-действие «подпись + иконка + ссылка» с выезжающим подчёркиванием
   (как у «Генеральный директор» на главной: серая полоска + заполняющаяся тёмная при наведении). */
function IconLink({ onClick, disabled, icon, children, prompt, danger = false }) {
  const color = danger ? "#e2571f" : TEXT;
  const bar = danger ? "#e2571f" : "#111";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {prompt ? (
        <span style={{ fontSize: 15, fontWeight: 300, color: "#4a4a4a" }}>{prompt}</span>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          background: "transparent",
          border: "none",
          padding: 0,
          color,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ display: "inline-flex" }}>{icon}</span>
        <span className="relative" style={{ fontSize: 15, fontWeight: 600, paddingBottom: 4 }}>
          {children}
          <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "#d7d7d7" }} />
          <span className="absolute bottom-0 left-0 h-0.5 w-0 transition-[width] duration-300 group-hover:w-full" style={{ background: bar }} />
        </span>
      </button>
    </div>
  );
}

/* ===== Верхняя полоска вкладок ===== */
function TabsBar({ active, isAdmin, onNavigate, lineWidth, isDesktop = false }) {
  const wrapRef = React.useRef(null);
  const tabRefs = React.useRef(new Map());
  const [underline, setUnderline] = React.useState({ left: 0, width: 56 });
  // Анимацию включаем только после первичной раскладки, иначе при заходе
  // из поповера полоска «проезжает» через соседние вкладки.
  const [animate, setAnimate] = React.useState(false);
  // Полоску не показываем, пока не измерили её реальную позицию —
  // иначе виден кадр под «Профиль» (left:0), что выглядит как рывок.
  const [measured, setMeasured] = React.useState(false);

  const TABS_DEF = React.useMemo(() => {
    return [
      { code: "profile",  label: "Профиль",  adminOnly: false, locked: false },
      { code: "objects",  label: "Объекты",  adminOnly: false, locked: false },
      { code: "partner",  label: "Партнёр",  adminOnly: false, locked: !isAdmin },
      { code: "supplier", label: "Поставщик",adminOnly: false, locked: !isAdmin },
      { code: "personal", label: "Настройки", adminOnly: false, locked: false }, // ← Переименовано
      { code: "admin",    label: "Администратор", adminOnly: true, locked: false },
    ].filter(t => (t.adminOnly ? isAdmin : true));
  }, [isAdmin]);

  const measure = React.useCallback(() => {
    const el = tabRefs.current.get(active);
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const rTab = el.getBoundingClientRect();
    const rWrap = wrap.getBoundingClientRect();
    setUnderline({
      left: Math.max(0, rTab.left - rWrap.left),
      width: Math.max(24, rTab.width),
    });
    setMeasured(true);
  }, [active]);

  React.useEffect(() => {
    // Прокрутить активную вкладку в зону видимости (важно при переходе из поповера)
    try {
      const el = tabRefs.current.get(active);
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    } catch {}

    // Многократный замер: layout/шрифты могут «доехать» уже после mount,
    // из-за чего подчёркивание вставало криво при SPA-переходе.
    measure();
    const raf = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });
    const t = setTimeout(measure, 260);

    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (!cancelled) measure(); }).catch(() => {});
    }

    const onResize = () => measure();
    const wrap = wrapRef.current;
    window.addEventListener("resize", onResize);
    wrap?.addEventListener("scroll", measure, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      wrap?.removeEventListener("scroll", measure);
    };
  }, [measure, active]);

  // Включаем плавность лишь после того, как первичная раскладка устаканилась.
  React.useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 340);
    return () => clearTimeout(t);
  }, []);

  const toPath = (code) => {
    switch (code) {
      case "profile":  return "/account/profile";
      case "objects":  return "/account/objects";
      case "partner":  return "/account/partner";
      case "supplier": return "/account/supplier";
      case "personal": return "/account/personal";
      case "admin":    return "/account/admin";
      default:          return "/account/profile";
    }
  };

  const onClickTab = (e, tab) => {
    e.preventDefault();
    if (tab.locked) return;
    try {
      window.history.pushState({}, "", toPath(tab.code));
      onNavigate?.(tab.code);
    } catch {}
  };

  return (
    <div className="relative mt-[46px] pb-[18px] lg:-mt-[35px]">
      <div
        ref={wrapRef}
        className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, overflowX: "auto" }}
      >
        {TABS_DEF.map((t) => {
          const isActive = t.code === active;
          const refCb = (el) => { if (el) tabRefs.current.set(t.code, el); };
          const color = isActive ? TEXT : "#777";
          const weight = isActive ? 600 : 300;
          return (
            <a
              key={t.code}
              href={toPath(t.code)}
              ref={refCb}
              onClick={(e) => onClickTab(e, t)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                whiteSpace: "nowrap",
                textDecoration: "none",
                color,
                fontWeight: weight,
                cursor: t.locked ? "not-allowed" : "pointer",
              }}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={t.locked || undefined}
              title={t.locked ? "Недоступно" : undefined}
            >
              {!isAdmin && (t.code === "partner" || t.code === "supplier") ? <Lock /> : null}
              {t.label}
            </a>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 10,
          position: "relative",
          width: typeof lineWidth === "number" ? `${lineWidth}px` : "100%",
          maxWidth: isDesktop ? "none" : "100%",
          height: 1,
          backgroundImage:
            "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: underline.left,
            top: -1,
            width: underline.width,
            height: 2,
            background: "#000",
            opacity: measured ? 1 : 0,
            transition: animate ? "left .18s ease, width .18s ease" : "none",
          }}
        />
      </div>
    </div>
  );
}

/* ===== Админ-панель ===== */
function AdminPanel({ token }) {
  return <AdminPanelCore token={token} />;
}
function AdminPanelFiltered({ token, group }) {
  return <AdminPanelCore token={token} filterGroup={group} />;
}

/* ===== Список учётных записей — в стиле раздела «Сотрудники» ===== */
const ACCT_DOTTED = "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)";
function AcctDotted() {
  return <div style={{ height: 1, width: "100%", backgroundImage: ACCT_DOTTED }} />;
}
const ROLE_LABEL = { user: "User", manager: "Manager", admin: "Admin" };
// Капсула-действие (контур → заливка на hover), как FillBtn в «Объектах».
function AcctAction({ children, onClick, accent }) {
  const [h, setH] = React.useState(false);
  const c = accent ? "#fa5d29" : "#111";
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ height: 42, padding: "0 18px", borderRadius: 12, border: `1px solid ${c}`, background: h ? c : "transparent", color: h ? "#fff" : c, fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: "pointer", transition: "background-color .16s ease, color .16s ease", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}
function AcctRow({ u, onOpen, onDelete }) {
  const [h, setH] = React.useState(false);
  const roleLabel = ROLE_LABEL[String(u.role || "user").toLowerCase()] || "User";
  return (
    <>
      <div onClick={onOpen} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 8px", margin: "0 -8px", cursor: "pointer", background: h ? "rgba(0,0,0,.02)" : "transparent", transition: "background-color .14s ease" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{u.name || "Без имени"}</div>
          <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: "#777" }}>{u.email || "—"}{u.phone ? <span> · {u.phone}</span> : null}</div>
          <div style={{ marginTop: 8, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 400, color: "#888", lineHeight: 1.5 }}>
            Группа: {labelByCode(toCode(u.group)) || "—"}{" · "}Роль: {roleLabel}{u.inn ? ` · ИНН ${u.inn}` : ""}
          </div>
        </div>
        <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <AcctAction onClick={onOpen}>Открыть</AcctAction>
          <AcctAction accent onClick={onDelete}>Удалить</AcctAction>
        </div>
      </div>
      <AcctDotted />
    </>
  );
}

/* Карточка одной учётки: просмотр данных (ИНН, организация), смена группы/роли, удаление. */
function AccountDetail({ token, user, onBack, onChanged, onDeleted }) {
  const id = user.id ?? user._id ?? user.userId ?? user.email;
  const [full, setFull] = React.useState(user);
  const [name, setName] = React.useState(user.name || "");
  const [phone, setPhone] = React.useState(user.phone || "");
  const [group, setGroup] = React.useState(toCode(user.group || "user"));
  const [role, setRole] = React.useState(String(user.role || "user").toLowerCase());
  const [org, setOrg] = React.useState(user.org || "");
  const [inn, setInn] = React.useState(user.inn || "");
  const [kpp, setKpp] = React.useState(user.kpp || "");
  const [legalAddress, setLegalAddress] = React.useState(user.legalAddress || user.orgAddress || "");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [innBusy, setInnBusy] = React.useState(false);

  // Ввод ИНН → как только 10/12 цифр, подтягиваем организацию/КПП/адрес из DaData.
  const onInnChange = async (v) => {
    setInn(v);
    const digits = String(v).replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 12) {
      setInnBusy(true);
      const c = await lookupOrgByInn(digits);
      setInnBusy(false);
      if (c) { if (c.name) setOrg(c.name); if (c.kpp) setKpp(c.kpp); if (c.address) setLegalAddress(c.address); }
    }
  };

  // Пытаемся подтянуть полные данные (если бэкенд отдаёт GET /admin/users/:id).
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const d = await apiAdminGetUser(token, id);
      if (!alive || !d) return;
      const u = d.user || d;
      if (!u || typeof u !== "object") return;
      setFull((prev) => ({ ...prev, ...u }));
      if (u.name != null) setName(u.name);
      if (u.phone != null) setPhone(String(u.phone));
      if (u.group != null) setGroup(toCode(u.group));
      if (u.role != null) setRole(String(u.role).toLowerCase());
      if (u.org != null) setOrg(u.org);
      if (u.inn != null) setInn(String(u.inn));
      if (u.kpp != null) setKpp(String(u.kpp));
      const addr = u.legalAddress ?? u.orgAddress;
      if (addr != null) setLegalAddress(addr);
    })();
    return () => { alive = false; };
  }, [token, id]);

  const save = async () => {
    const patch = {};
    if (name !== (full.name || "")) patch.name = name;
    if (phone !== (full.phone || "")) patch.phone = phone;
    if (toCode(group) !== toCode(full.group)) patch.group = toCode(group);
    if (role !== String(full.role || "user").toLowerCase()) patch.role = role;
    if (org !== (full.org || "")) patch.org = org;
    if (inn !== (full.inn || "")) patch.inn = inn;
    if (kpp !== (full.kpp || "")) patch.kpp = kpp;
    if (legalAddress !== (full.legalAddress || full.orgAddress || "")) patch.legalAddress = legalAddress;
    if (!Object.keys(patch).length) { setSaved(true); setTimeout(() => setSaved(false), 1500); return; }
    setBusy(true);
    const res = await apiAdminUpdateUser(token, id, patch);
    setBusy(false);
    if (!res) { window.showDockToast?.("Не удалось сохранить (проверьте доступ)"); return; }
    setFull((prev) => ({ ...prev, ...patch }));
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    onChanged?.();
  };

  const doDelete = async () => {
    setDeleting(true);
    const res = await apiAdminDeleteUser(token, id);
    setDeleting(false);
    if (!res || res.ok === false) { window.showDockToast?.("Не удалось удалить (проверьте доступ)"); return; }
    window.showDockToast?.("Учётная запись удалена");
    onDeleted?.();
  };

  const secLbl = { fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300, marginBottom: 12 };
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={onBack} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К учётным записям</button>
      <div style={{ marginTop: 14, fontSize: 22, fontWeight: 600, color: TEXT }}>{name || user.name || "Учётная запись"}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>{user.email || "без e-mail"}</div>

      <div style={{ marginTop: 26, maxWidth: 560, display: "grid", gap: 18 }}>
        <div>
          <div style={secLbl}>Доступ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Группа"><GroupSelect value={group} onChange={setGroup} canPickLocked /></Field>
            <Field label="Роль доступа"><AccessRoleSelect value={role} onChange={setRole} /></Field>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
          <div style={secLbl}>Контакт</div>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Имя или название"><Input value={name} onChange={setName} placeholder="—" /></Field>
            <Field label="Телефон"><Input value={phone} onChange={setPhone} placeholder="—" /></Field>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
          <div style={secLbl}>Организация</div>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Организация"><Input value={org} onChange={setOrg} placeholder="—" /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label={innBusy ? "ИНН — подтягиваем…" : "ИНН"}><Input value={inn} onChange={onInnChange} placeholder="Введите ИНН — данные подтянутся" /></Field>
              <Field label="КПП"><Input value={kpp} onChange={setKpp} placeholder="—" /></Field>
            </div>
            <Field label="Юридический адрес"><Input value={legalAddress} onChange={setLegalAddress} placeholder="—" /></Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <DarkTextBtn onClick={save} disabled={busy}>{busy ? "Сохраняем…" : "Сохранить изменения"}</DarkTextBtn>
          {saved && <span style={{ fontSize: 13, color: "#3a8a3a" }}>Сохранено ✓</span>}
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 16, marginTop: 4 }}>
          <div style={secLbl}>Опасная зона</div>
          {!confirmDel ? (
            <IconLink onClick={() => setConfirmDel(true)} icon={<TrashIcon />} prompt="Удалить эту учётную запись?" danger>Удалить учётную запись</IconLink>
          ) : (
            <div className="animate-svcfade" style={{ border: "1px solid #e3b4ae", background: "#fdf7f6", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Удалить учётную запись «{user.name || user.email}»?</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 300, color: "#777" }}>Пользователь потеряет доступ в личный кабинет. Действие необратимо.</div>
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button type="button" onClick={doDelete} disabled={deleting} style={{ height: 44, padding: "0 18px", borderRadius: 10, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400 }}>{deleting ? "Удаляем…" : "Удалить навсегда"}</button>
                <button type="button" onClick={() => setConfirmDel(false)} style={{ height: 44, padding: "0 18px", borderRadius: 10, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, color: TEXT }}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 58 }} />
    </div>
  );
}

function AdminPanelCore({ token, filterGroup }) {
  const [list, setList] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [reload, setReload] = React.useState(0);
  const [openUser, setOpenUser] = React.useState(null);
  const getKey = (u) => String(u.id ?? u._id ?? u.userId ?? u.email ?? "");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) return;
      setLoading(true);
      const j = await apiAdminListUsers(token, { limit: 200, offset: 0, q, group: filterGroup });
      if (!alive) return;
      const users = Array.isArray(j?.users) ? j.users : Array.isArray(j) ? j : [];
      setList(users);
      setTotal(Number(j?.total || users.length || 0));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [token, q, filterGroup, reload]);

  const del = async (u) => {
    if (!window.confirm(`Удалить учётную запись «${u.name || u.email}»? Действие необратимо.`)) return;
    const id = u.id ?? u._id ?? u.userId ?? u.email;
    const res = await apiAdminDeleteUser(token, id);
    if (!res || res.ok === false) { window.showDockToast?.("Не удалось удалить (проверьте доступ)"); return; }
    window.showDockToast?.("Учётная запись удалена");
    setReload((v) => v + 1);
  };

  if (openUser) {
    return (
      <AccountDetail
        token={token}
        user={openUser}
        onBack={() => setOpenUser(null)}
        onChanged={() => setReload((v) => v + 1)}
        onDeleted={() => { setOpenUser(null); setReload((v) => v + 1); }}
      />
    );
  }

  const title = filterGroup ? `Участники группы: ${labelByCode(filterGroup)}` : "Зарегистрированные учётные записи";
  return (
    <div style={{ fontFamily: UI }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>Нажмите на запись — посмотреть данные (ИНН, организация), изменить группу/роль или удалить.</div>

      <div style={{ marginTop: 20 }}>
        <UnderSearch value={q} onChange={setQ} placeholder="Поиск по имени, e-mail или телефону…" />
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 12, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>
          <span>Учётные записи</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>Всего: {String(total).padStart(2, "0")}</span>
        </div>
        <AcctDotted />
        {loading ? (
          <CenterSpinner minHeight={160} label="Загружаем учётные записи…" />
        ) : list.length === 0 ? (
          <div style={{ padding: "28px 8px", color: "#777", fontSize: 14, fontWeight: 300 }}>{q ? "Ничего не найдено." : "Нет данных."}</div>
        ) : (
          list.map((u) => (
            <AcctRow key={getKey(u)} u={u} onOpen={() => setOpenUser(u)} onDelete={() => del(u)} />
          ))
        )}
      </div>

      <div style={{ height: 58 }} />
    </div>
  );
}


/* ===== Страница ===== */
/* ===== Панель администратора: лончер модулей + раздел «Учётные записи» ===== */
function adminNav(to) {
  try { window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); }
  catch { window.location.href = to; }
}
/* Иконки для карточек администратора — крупные, тёмные, без подложки (как на awwwards) */
const AdminIcon = {
  employees: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 6.2a3 3 0 010 5.6" /><path d="M17.5 14c2.3.5 4 2.4 4 4.9" />
    </svg>
  ),
  accounts: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.4" /><path d="M3 9.5h18" /><circle cx="7.5" cy="14" r="1.4" /><path d="M11 14h6" />
    </svg>
  ),
  create: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="8" r="3.2" /><path d="M4 19c0-3 2.7-5 6-5" /><path d="M18 13.5v6M15 16.5h6" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="2.4" /><path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
};

function AdminLauncher() {
  const cards = [
    { key: "employees", title: "Сотрудники", sub: "Список сотрудников компании: добавление и удаление.", to: "/account/admin/employees", icon: AdminIcon.employees },
    { key: "accounts", title: "Учётные записи", sub: "Зарегистрированные пользователи, роли и группы доступа.", to: "/account/admin/accounts", icon: AdminIcon.accounts },
    { key: "create", title: "Создать учётную запись", sub: "Завести нового пользователя-заказчика вручную.", to: "/account/admin/create-account", icon: AdminIcon.create },
    { key: "templates", title: "Шаблоны объектов", sub: "Типы работ: префикс для № объекта и типовые этапы.", to: "/account/admin/templates", icon: AdminIcon.templates },
  ];
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT }}>Администратор</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>Выберите раздел.</div>
      <div style={{ marginTop: 24, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {cards.map((c) => (
          <a key={c.to} href={c.to} onClick={(e) => { e.preventDefault(); adminNav(c.to); }}
            style={{ display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit", border: "none", borderRadius: 12, padding: 30, background: "#e9e9e9", minHeight: 210, transition: "background-color .18s ease, box-shadow .18s ease, transform .18s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#e9e9e9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
            <span style={{ color: TEXT, display: "inline-flex" }}>{c.icon}</span>
            <div style={{ marginTop: "auto", paddingTop: 28 }}>
              <div style={{ fontSize: 14, lineHeight: "19.6px", fontWeight: 600, color: "#222222" }}>{c.title}</div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: "19.6px", fontWeight: 300, color: "#222222" }}>{c.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
function AdminAccounts({ token }) {
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={() => adminNav("/account/admin")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К модулям</button>
      <div style={{ marginTop: 14 }}><AdminPanel token={token} /></div>
    </div>
  );
}

/* Создание учётной записи вручную (админ заводит заказчика).
   Два способа входа: по e-mail ИЛИ по логину (заказчик потом сам добавит и подтвердит почту).
   Опционально — подтянуть организацию по ИНН (DaData), эти данные позже попадут в объект. */
function AdminCreateAccount({ token }) {
  const [mode, setMode] = React.useState("email");   // "email" | "login"
  const [email, setEmail] = React.useState("");
  const [login, setLogin] = React.useState("");
  const [name, setName] = React.useState("");
  const [group, setGroup] = React.useState("customer");
  const [pwd, setPwd] = React.useState(() => genPassword());
  // организация (необязательно)
  const [orgOn, setOrgOn] = React.useState(false);
  const [org, setOrg] = React.useState("");
  const [inn, setInn] = React.useState("");
  const [kpp, setKpp] = React.useState("");
  const [legalAddress, setLegalAddress] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(null); // { loginLabel, password, byLogin, email }
  const [copied, setCopied] = React.useState(false);

  const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
  const loginOk = (l) => /^[a-zA-Z0-9._-]{3,32}$/.test(String(l).trim());
  const fillOrg = (c) => { setOrg(c.name || ""); setInn(c.inn || ""); setKpp(c.kpp || ""); setLegalAddress(c.address || ""); };
  const [innBusy, setInnBusy] = React.useState(false);
  // Ввод ИНН напрямую → как только набрано 10/12 цифр, подтягиваем организацию.
  const onInnChange = async (v) => {
    setInn(v);
    const digits = String(v).replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 12) {
      setInnBusy(true);
      const c = await lookupOrgByInn(digits);
      setInnBusy(false);
      if (c) { setOrg(c.name || ""); setKpp(c.kpp || ""); setLegalAddress(c.address || ""); }
    }
  };

  const submit = async () => {
    const errs = {};
    const em = email.trim().toLowerCase();
    const lg = login.trim();
    if (mode === "email") {
      if (!emailOk(em)) errs.email = "Укажите корректный e-mail.";
    } else {
      if (!loginOk(lg)) errs.login = "Логин: 3–32 символа, латиница/цифры/._-";
      if (em && !emailOk(em)) errs.email = "E-mail указан неверно (можно оставить пустым).";
    }
    if (!name.trim()) errs.name = "Укажите имя или название.";
    if (!pwd || pwd.length < 8) errs.pwd = "Пароль слишком короткий.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const res = await apiAdminCreateUser(token, {
      email: mode === "email" ? em : (em || undefined),
      login: mode === "login" ? lg : undefined,
      password: pwd, name: name.trim(), group, role: "customer",
      org: orgOn ? org.trim() : undefined,
      inn: orgOn ? inn.trim() : undefined,
      kpp: orgOn ? kpp.trim() : undefined,
      legalAddress: orgOn ? legalAddress.trim() : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const dup = res.error === "email already registered" || res.error === "login already registered";
      let msg = "Не удалось создать учётную запись.";
      if (res.error === "email already registered") msg = "Такой e-mail уже зарегистрирован.";
      else if (res.error === "login already registered") msg = "Такой логин уже занят.";
      setErrors({
        email: res.error === "email already registered" ? msg : undefined,
        login: res.error === "login already registered" ? msg : undefined,
        form: dup ? undefined : msg,
      });
      return;
    }
    setDone({ loginLabel: mode === "login" ? lg : em, password: pwd, byLogin: mode === "login", email: em || "", id: res.user?.id || "", login: res.user?.login || "" });
  };

  const copyCreds = async () => {
    try {
      await navigator.clipboard.writeText(`Личный кабинет cube-tech.ru\nЛогин: ${done.loginLabel}\nПароль: ${done.password}`);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard недоступен */ }
  };

  const reset = () => { setMode("email"); setEmail(""); setLogin(""); setName(""); setGroup("customer"); setPwd(genPassword()); setOrgOn(false); setOrg(""); setInn(""); setKpp(""); setLegalAddress(""); setErrors({}); setDone(null); };

  const seg = (active) => ({ flex: 1, height: 40, borderRadius: 8, border: "none", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: active ? 500 : 300, background: active ? "#111" : "transparent", color: active ? "#fff" : "#555", transition: "background-color .15s ease, color .15s ease" });

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={() => adminNav("/account/admin")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К модулям</button>
      <div style={{ marginTop: 14, fontSize: 22, fontWeight: 600, color: TEXT }}>Создать учётную запись</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>Новый пользователь сможет входить по этим данным. Пароль показывается один раз — передайте его заказчику.</div>

      {done ? (
        <div className="animate-svcfade">
          <div style={{ marginTop: 22, maxWidth: 520, border: "1px solid #e6e6e6", borderRadius: 14, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>Учётная запись создана</div>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}><span style={{ color: "#888" }}>Логин</span><span style={{ color: TEXT, fontWeight: 500 }}>{done.loginLabel}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}><span style={{ color: "#888" }}>Пароль</span><span style={{ color: TEXT, fontWeight: 500, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>{done.password}</span></div>
            </div>
            {done.byLogin ? <div style={{ marginTop: 12, fontSize: 13, fontWeight: 300, color: "#888", lineHeight: 1.5 }}>Учётная запись создана по логину. При первом входе заказчик добавит и подтвердит свою почту.</div> : null}
            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <DarkTextBtn onClick={copyCreds}>{copied ? "Скопировано ✓" : "Скопировать данные"}</DarkTextBtn>
              <button type="button" onClick={reset} style={{ height: 44, padding: "0 18px", borderRadius: 10, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, color: TEXT }}>Создать ещё</button>
            </div>
          </div>

          {/* Лист доступа — отдельная широкая секция: объект выбирается из списка или создаётся тут же (с этапами) */}
          <div style={{ marginTop: 30, maxWidth: 760, borderTop: "1px solid #ececec", paddingTop: 26 }}>
            <AccessSheetBuilder account={{ id: done.id || "", name: name || done.loginLabel, loginLabel: done.loginLabel, password: done.password, email: (done.email || "").trim().toLowerCase() }} />
          </div>

          {/* Выход после того, как всё готово. Обе кнопки — спокойные (outline), чтобы
              «Готово» не перетягивало случайный клик до создания объекта. */}
          <div style={{ marginTop: 30, maxWidth: 760, borderTop: "1px solid #ececec", paddingTop: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 300, color: "#999", marginBottom: 12, lineHeight: 1.5 }}>
              Сначала сформируйте лист доступа выше — а когда закончите, вернитесь к модулям или заведите ещё одну учётку.
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={() => adminNav("/account/admin")}
                style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400, color: TEXT, transition: "background-color .15s ease, border-color .15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; e.currentTarget.style.borderColor = "#c4c4c4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#d9d9d9"; }}>
                Готово — к модулям
              </button>
              <button type="button" onClick={reset}
                style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400, color: TEXT, transition: "background-color .15s ease, border-color .15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; e.currentTarget.style.borderColor = "#c4c4c4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = "#d9d9d9"; }}>
                Создать ещё учётку
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 22, maxWidth: 520, display: "grid", gap: 18 }}>
          {/* способ входа */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 300, color: "#777", marginBottom: 8 }}>Способ входа</div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "#f3f3f3", borderRadius: 10 }}>
              <button type="button" onClick={() => setMode("email")} style={seg(mode === "email")}>По e-mail</button>
              <button type="button" onClick={() => setMode("login")} style={seg(mode === "login")}>По логину</button>
            </div>
          </div>

          {mode === "email" ? (
            <Field label="E-mail (логин)" required error={errors.email}>
              <Input value={email} onChange={setEmail} placeholder="client@example.ru" error={errors.email} type="email" />
            </Field>
          ) : (
            <>
              <Field label="Логин" required error={errors.login}>
                <Input value={login} onChange={setLogin} placeholder="client-romashka" error={errors.login} />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <Input value={email} onChange={setEmail} placeholder="можно оставить пустым — заказчик добавит сам" error={errors.email} type="email" />
              </Field>
            </>
          )}

          <Field label="Имя или название" required error={errors.name}>
            <Input value={name} onChange={setName} placeholder="ООО «Ромашка» / Иван Петров" error={errors.name} />
          </Field>
          <Field label="Группа" error={errors.group}>
            <GroupSelect value={group} onChange={setGroup} error={errors.group} />
          </Field>

          {/* организация — необязательно */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setOrgOn((v) => !v)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }} aria-pressed={orgOn}>
                <Square checked={orgOn} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>Подтянуть организацию по ИНН <span style={{ color: "#999" }}>— необязательно</span></span>
            </div>
            {orgOn && (
              <div className="animate-svcfade" style={{ marginTop: 14, display: "grid", gap: 14 }}>
                <Field label="Организация / ИНН">
                  <OrgSuggest value={org} onChange={setOrg} onPick={fillOrg} placeholder="Название или ИНН — выберите из подсказок" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label={innBusy ? "ИНН — подтягиваем…" : "ИНН"}><Input value={inn} onChange={onInnChange} placeholder="Введите ИНН — данные подтянутся" /></Field>
                  <Field label="КПП"><Input value={kpp} onChange={setKpp} placeholder="—" /></Field>
                </div>
                <Field label="Юридический адрес"><Input value={legalAddress} onChange={setLegalAddress} placeholder="—" /></Field>
                <div style={{ fontSize: 12, fontWeight: 300, color: "#999", lineHeight: 1.5 }}>Эти данные подставятся в объект, когда вы выберете этого заказчика.</div>
              </div>
            )}
          </div>

          <Field label="Пароль" required error={errors.pwd}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}><Input value={pwd} onChange={setPwd} error={errors.pwd} /></div>
              <button type="button" onClick={() => setPwd(genPassword())} title="Сгенерировать новый"
                style={{ height: FIELD_H, padding: "0 18px", borderRadius: 10, border: "none", background: "#111", color: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, whiteSpace: "nowrap", transition: "background-color .15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#262626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#111"; }}>↻ Другой</button>
            </div>
          </Field>
          {errors.form ? <div style={{ fontSize: 13, color: ERR }}>{errors.form}</div> : null}
          <div>{busy ? <RowSpinner label="Создаём учётную запись…" minHeight={48} /> : <DarkTextBtn onClick={submit}>Создать учётную запись</DarkTextBtn>}</div>
        </div>
      )}
    </div>
  );
}

/* Лист доступа: админ ВЫБИРАЕТ объект заказчика из списка ИЛИ создаёт новый прямо здесь.
   Данные объекта (№, наименование, адрес, ссылка QR) подтягиваются автоматически —
   вручную вбивать ничего не нужно. Объект при создании привязывается к учётке. */
const CUBE_SITE = "https://cube-tech.ru";
const objectUrlFor = (id) => `${CUBE_SITE}/account/objects/${encodeURIComponent(id)}`;

function AccessSheetBuilder({ account }) {
  const email = account.email || "";
  const accountId = account.id || "";
  const [mode, setMode] = React.useState("select"); // "select" | "create"
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    try { DB.hydrateObjects && DB.hydrateObjects(); } catch {}
    const on = () => setTick((t) => t + 1);
    window.addEventListener("objects:changed", on);
    return () => window.removeEventListener("objects:changed", on);
  }, []);

  // Объекты этой учётки — по e-mail ИЛИ по id учётки (для входа по логину без почты).
  // Совсем без привязки — все объекты (админ выберет вручную).
  const objects = React.useMemo(() => {
    try {
      const list = (email || accountId) ? DB.listObjectsForCustomer(email, accountId) : DB.listObjects();
      return Array.isArray(list) ? list : [];
    } catch { return []; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, accountId, tick]);

  const [selId, setSelId] = React.useState("");
  const [createdId, setCreatedId] = React.useState("");

  // Договор (общие поля листа)
  const [contractNumber, setContractNumber] = React.useState("");
  const [contractDate, setContractDate] = React.useState("");
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Актуальный объект (полные данные из хранилища).
  const activeObj = React.useMemo(() => {
    const id = mode === "create" ? createdId : selId;
    if (!id) return null;
    try { return (DB.getObject && DB.getObject(id)) || objects.find((o) => o.id === id) || null; }
    catch { return objects.find((o) => o.id === id) || null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, createdId, selId, objects, tick]);

  const objAddr = activeObj ? (activeObj.address || activeObj.city || "") : "";
  const sheetData = activeObj ? {
    customerName: account.name,
    accountName: account.name,
    login: account.loginLabel,
    temporaryPassword: account.password,
    objectNumber: activeObj.id,
    objectTitle: activeObj.title,
    objectAddress: objAddr,
    objectUrl: objectUrlFor(activeObj.id),
    contractNumber: contractNumber || activeObj.contractNumber || "",
    contractDate,
  } : null;

  const seg = (active) => ({ flex: 1, height: 40, borderRadius: 8, border: "none", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: active ? 500 : 300, background: active ? "#111" : "transparent", color: active ? "#fff" : "#555", transition: "background-color .15s ease, color .15s ease" });

  return (
    <div style={{ fontFamily: UI }}>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: TEXT, fontWeight: 300 }}>Лист доступа <span style={{ textTransform: "none", fontWeight: 400, color: "#999" }}>— для передачи заказчику</span></div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>Выберите объект заказчика или создайте новый — данные подставятся в лист автоматически.</div>

      {/* Выбрать существующий объект или создать новый */}
      <div style={{ marginTop: 18, display: "flex", gap: 4, padding: 4, background: "#f3f3f3", borderRadius: 10, maxWidth: 340 }}>
        <button type="button" onClick={() => setMode("select")} style={seg(mode === "select")}>Выбрать объект</button>
        <button type="button" onClick={() => setMode("create")} style={seg(mode === "create")}>Создать объект</button>
      </div>

      <div style={{ marginTop: 22 }}>
        {mode === "select" ? (
          objects.length ? (
            <div style={{ maxWidth: 460 }}>
              <FLabel>Объект</FLabel>
              <UnderSelect
                value={selId}
                onChange={setSelId}
                placeholder="— выберите объект —"
                options={objects.map((o) => ({ value: o.id, label: `${o.id} — ${o.title || "без названия"}` }))}
              />
            </div>
          ) : (
            <div style={{ maxWidth: 520, fontSize: 14, fontWeight: 300, color: "#777", lineHeight: 1.5, background: "#fafafa", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px" }}>
              У этой учётки пока нет объектов. Переключитесь на «Создать объект» — он сразу привяжется к заказчику.
            </div>
          )
        ) : createdId ? (
          <div style={{ maxWidth: 520, fontSize: 14, fontWeight: 400, color: "#2f855a", background: "#f2faf4", border: "1px solid #d5ecdc", borderRadius: 12, padding: "14px 16px" }}>
            Объект <b>{createdId}</b> создан и привязан к учётке. Ниже заполните договор и сформируйте лист.
          </div>
        ) : (
          // Полноценная форма создания объекта — та же, что в разделе «Объекты» (тип работ, ответственный, этапы).
          <CreateObjectForm
            embedded
            fixedCustomer={{ name: account.name, email, id: accountId }}
            submitLabel="Создать объект"
            onCreated={(id) => { setCreatedId(id); setTick((t) => t + 1); }}
          />
        )}
      </div>

      {/* Договор + сводка выбранного объекта */}
      {activeObj ? (
        <div style={{ marginTop: 24, maxWidth: 460 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div><FLabel>Договор №</FLabel><UnderInput value={contractNumber} onChange={setContractNumber} placeholder="—" /></div>
            <div><FLabel>Дата договора</FLabel><UnderInput value={contractDate} onChange={setContractDate} placeholder="дд.мм.гггг" /></div>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 300, color: "#999", lineHeight: 1.5 }}>
            Объект <b style={{ fontWeight: 500, color: "#666" }}>{activeObj.id}</b>{objAddr ? ` · ${objAddr}` : ""} · ссылка QR: {objectUrlFor(activeObj.id)}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 22 }}>
        <PrimaryBtn onClick={() => setSheetOpen(true)} disabled={!activeObj}>Сформировать лист доступа</PrimaryBtn>
      </div>

      {sheetOpen && sheetData ? (
        <AccessSheetModal data={sheetData} onClose={() => setSheetOpen(false)} />
      ) : null}
    </div>
  );
}

/* Тёмная кнопка с единым hover (как «Ищу работу») — компактная, для форм */
function DarkTextBtn({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "none", background: "#111", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.85 : 1, fontFamily: UI, fontSize: 15, fontWeight: 300, transition: "background-color .15s ease" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#262626"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#111"; }}>
      {children}
    </button>
  );
}

/* Кнопка с ховер-эффектом на inline-стилях: hoverStyle накладывается при наведении.
   Удобно для тёмных/светлых/красных кнопок с произвольной геометрией. */
function HoverBtn({ children, onClick, disabled, style, hoverStyle, type = "button" }) {
  const base = { transition: "background-color .15s ease, border-color .15s ease, color .15s ease", cursor: disabled ? "not-allowed" : "pointer", ...style };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={base}
      onMouseEnter={(e) => { if (!disabled && hoverStyle) Object.assign(e.currentTarget.style, hoverStyle); }}
      onMouseLeave={(e) => { if (hoverStyle) Object.keys(hoverStyle).forEach((k) => { e.currentTarget.style[k] = base[k] != null ? base[k] : ""; }); }}>
      {children}
    </button>
  );
}

/* Небольшой брендовый спиннер по центру строки — заменяет ряд кнопок, пока идёт запрос. */
function RowSpinner({ label, minHeight = 46, color = "#7a7a7a" }) {
  return (
    <div style={{ minHeight, display: "flex", alignItems: "center", gap: 12 }}>
      <Spinner size={24} color={color} />
      {label ? <span style={{ fontSize: 13, fontWeight: 300, color: "#8a8a8a" }}>{label}</span> : null}
    </div>
  );
}

/* Первый вход по временному паролю — мягкое приглашение задать свой пароль.
   Заказчик может закрыть окно («Позже») и спокойно войти; напомним при следующем входе. */
function FirstLoginModal({ token, hasEmail, onSaved, onLater }) {
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [errs, setErrs] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    const next = {};
    const pErr = passwordPolicyError(pwd);
    if (pErr) next.pwd = pErr;
    if (pwd2 !== pwd) next.pwd2 = "Пароли не совпадают.";
    const em = String(email || "").trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) next.email = "Некорректная почта.";
    setErrs(next);
    if (Object.keys(next).length) return;
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }

    try {
      setBusy(true);
      const resp = await apiSetInitialPassword(token, pwd, em || undefined);
      if (!resp.ok) {
        const map = {
          "password already set": "Пароль уже задан.",
          "invalid email": "Некорректная почта.",
          "email already in use": "Эта почта уже занята.",
          ...PWD_ERR_MAP,
        };
        const msg = map[resp.error] || "Не удалось сохранить.";
        if (resp.error === "email already in use" || resp.error === "invalid email") setErrs({ email: msg });
        else setErrs({ pwd: msg });
        window.showDockToast?.(msg);
        return;
      }
      window.showDockToast?.(resp.emailSet ? "Пароль задан, почта сохранена" : "Пароль задан");
      onSaved?.(resp.accessToken, resp.emailSet, em);
    } catch {
      window.showDockToast?.("Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  const clr = (k) => { if (errs[k]) setErrs((s) => ({ ...s, [k]: "" })); };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] animate-svcfade bg-black/55 font-tight md:flex md:items-center md:justify-center md:p-6"
      onClick={onLater}>
      <div
        className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-white text-[#111] md:h-auto md:max-h-[calc(100dvh-48px)] md:w-[var(--mw)] md:overflow-hidden md:rounded-[10px] md:border md:border-[#dcdcdc] md:shadow-[0_16px_48px_rgba(0,0,0,.35)]"
        style={{ ["--mw"]: "min(980px, calc(100vw - 48px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <FormShell
          welcome="Добро пожаловать!"
          title="Задайте свой пароль"
          bottom="Вы вошли по временному паролю. Придумайте собственный — так в личный кабинет сможете входить только вы."
        >
          {busy ? <CenterSpinner minHeight={320} label="Сохраняем пароль…" /> : (
          <form className="flex flex-col gap-[14px] self-start sm:grid sm:grid-cols-2 sm:gap-x-[18px] sm:gap-y-[14px]"
            onSubmit={(e) => { e.preventDefault(); if (!busy) submit(); }} noValidate>
            <div className="col-span-2 flex flex-col">
              <MLabel>НОВЫЙ ПАРОЛЬ (*)</MLabel>
              <input className={inputCls(errs.pwd)} type={show ? "text" : "password"} value={pwd} autoFocus
                onChange={(e) => { setPwd(e.target.value); clr("pwd"); }} placeholder="Минимум 6 символов, заглавная и спецсимвол" />
              <MErrorSlot text={errs.pwd} />
            </div>

            <div className="col-span-2 flex flex-col">
              <MLabel>ПОВТОР ПАРОЛЯ (*)</MLabel>
              <input className={inputCls(errs.pwd2)} type={show ? "text" : "password"} value={pwd2}
                onChange={(e) => { setPwd2(e.target.value); clr("pwd2"); }} placeholder="Ещё раз" />
              <MErrorSlot text={errs.pwd2} />
            </div>

            <div className="col-span-2 flex items-center gap-2.5 text-sm font-light text-[#111]">
              <FancyCheckbox checked={show} onChange={setShow} ariaLabel="Показать пароль" />
              <span>Показать пароль</span>
            </div>

            {!hasEmail ? (
              <div className="col-span-2 flex flex-col">
                <MLabel>E-MAIL ДЛЯ УВЕДОМЛЕНИЙ — НЕОБЯЗАТЕЛЬНО</MLabel>
                <input className={inputCls(errs.email)} type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); clr("email"); }} placeholder="имя@домен.ру" />
                {errs.email ? <MErrorSlot text={errs.email} /> : (
                  <p className="mt-1.5 text-[11px] font-light leading-none text-[#a7a7a7]">Можно добавить позже в настройках.</p>
                )}
              </div>
            ) : null}

            <div className="col-span-2 mt-2">
              <button type="submit" className={`${MBTN} w-full`} disabled={busy}>
                Сохранить и войти
              </button>
            </div>
            <div className="col-span-2 -mt-1 text-center">
              <button type="button" onClick={onLater} disabled={busy}
                className="text-sm font-light text-[#9a9a9a] transition-colors hover:text-[#555] disabled:opacity-60">
                Пропустить и войти по временному
              </button>
            </div>
          </form>
          )}
        </FormShell>
      </div>
    </div>
  );
}

/* Автокомплит организации (DaData suggest): ввод названия/ИНН → выпадающий список */
function OrgSuggest({ value, onChange, onPick, placeholder }) {
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const tRef = React.useRef(null);
  React.useEffect(() => {
    const f = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const runQuery = (q) => {
    clearTimeout(tRef.current);
    tRef.current = setTimeout(async () => { const r = await suggestOrg(q); setItems(r); setOpen(r.length > 0); }, 220);
  };
  const handleChange = (v) => { onChange(v); if (String(v).trim().length >= 3) runQuery(v); else { setItems([]); setOpen(false); } };
  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <Input value={value} onChange={handleChange} placeholder={placeholder} />
      {open && (
        <div className="animate-svcfade" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, boxShadow: "0 14px 40px rgba(0,0,0,.14)", padding: 6, maxHeight: 300, overflowY: "auto" }}>
          {items.map((it, i) => (
            <button key={i} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(it); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "8px 10px", borderRadius: 7, fontFamily: UI }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontSize: 14, color: TEXT }}>{it.name}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>ИНН {it.inn || "—"}{it.address ? ` · ${it.address}` : ""}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountProfilePage() {
  const [token, setToken] = React.useState(null);
  const [userEmail, setUserEmail] = React.useState("");
  const [userId, setUserId] = React.useState("");   // id учётки (claims.sub) — доступ к объектам по логину без почты
  // Кэшируем флаг админа, чтобы вкладка «Администратор» не «доезжала»
  // после ответа apiMe (иначе виден рывок таб-бара при заходе из поповера).
  const [isAdmin, setIsAdmin] = React.useState(() => {
    try { return sessionStorage.getItem("auth:isAdmin") === "1"; } catch { return false; }
  });
  // Пока тянем /me — показываем спиннер, чтобы не мелькали пустые поля профиля.
  const [booting, setBooting] = React.useState(true);

  /* поля */
  const [username, setUsername] = React.useState("");
  const [display, setDisplay] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [groupCode, setGroupCode] = React.useState("");
  const [city, setCity] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [inn, setInn] = React.useState("");
  const [kpp, setKpp] = React.useState("");
  const [legalAddress, setLegalAddress] = React.useState("");
  const [avatar, setAvatar] = React.useState(null);
  const [emailOptIn, setEmailOptIn] = React.useState(false);

  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const fillOrg = (c) => { setOrg(c.name || ""); setInn(c.inn || ""); setKpp(c.kpp || ""); setLegalAddress(c.address || ""); };

  /* смена пароля (вкладка «Настройки») */
  const [curPwd, setCurPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [newPwd2, setNewPwd2] = React.useState("");
  const [pwdErrors, setPwdErrors] = React.useState({});
  const [pwdSaving, setPwdSaving] = React.useState(false);

  /* смена почты (вкладка «Настройки») */
  const [newEmail, setNewEmail] = React.useState("");
  const [emailPwd, setEmailPwd] = React.useState("");
  const [emailErrors, setEmailErrors] = React.useState({});
  const [emailSaving, setEmailSaving] = React.useState(false);

  /* активные сессии */
  const [sessions, setSessions] = React.useState([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);
  const [revokingSid, setRevokingSid] = React.useState("");

  /* безопасность / опасная зона */
  const [logoutAllBusy, setLogoutAllBusy] = React.useState(false);
  const [delOpen, setDelOpen] = React.useState(false);
  const [delPwd, setDelPwd] = React.useState("");
  const [delError, setDelError] = React.useState("");
  const [delBusy, setDelBusy] = React.useState(false);

  /* двухфакторная аутентификация (2FA) */
  const [twoFA, setTwoFA] = React.useState(false);            // включена ли 2FA у пользователя
  const [twoFAStage, setTwoFAStage] = React.useState("idle"); // idle | setup (мастер подключения)
  const [twoFASecret, setTwoFASecret] = React.useState("");
  const [twoFAQr, setTwoFAQr] = React.useState("");           // data-URL QR-кода
  const [twoFACode, setTwoFACode] = React.useState("");
  const [twoFAError, setTwoFAError] = React.useState("");
  const [twoFABusy, setTwoFABusy] = React.useState(false);
  const [backupCodes, setBackupCodes] = React.useState(null); // массив кодов, показываем один раз
  const [disable2FAOpen, setDisable2FAOpen] = React.useState(false);
  const [disable2FAPwd, setDisable2FAPwd] = React.useState("");
  const [disable2FAError, setDisable2FAError] = React.useState("");
  const [disable2FABusy, setDisable2FABusy] = React.useState(false);

  /* подтверждение почты */
  const [emailVerified, setEmailVerified] = React.useState(true); // не мигаем «не подтверждено» до ответа /me
  const [verifyBusy, setVerifyBusy] = React.useState(false);
  const [verifySent, setVerifySent] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState("");
  // Бейдж «подтверждена» рядом с почтой: показываем на пару секунд и плавно убираем,
  // чтобы не «светился» постоянно.
  const [vbadgeShow, setVbadgeShow] = React.useState(false);   // управляет прозрачностью
  const [vbadgeMount, setVbadgeMount] = React.useState(false); // управляет наличием в DOM
  React.useEffect(() => {
    if (!emailVerified || !userEmail) { setVbadgeShow(false); setVbadgeMount(false); return; }
    setVbadgeMount(true);
    const rif = requestAnimationFrame(() => setVbadgeShow(true)); // плавное появление
    const tHide = setTimeout(() => setVbadgeShow(false), 3200);   // начать исчезновение
    const tOff = setTimeout(() => setVbadgeMount(false), 3800);   // убрать из DOM после анимации
    return () => { cancelAnimationFrame(rif); clearTimeout(tHide); clearTimeout(tOff); };
  }, [emailVerified, userEmail]);

  /* первый вход по временному паролю: мягкое приглашение задать свой пароль */
  const [mustChange, setMustChange] = React.useState(false); // сервер: must_change_password
  const [onboardOpen, setOnboardOpen] = React.useState(false);

  /* вкладка из URL */
  const pathname = useLocationPathname();
  const tab = React.useMemo(() => {
    if (/\/account\/objects(\/|$)/.test(pathname))  return "objects";
    if (/\/account\/partner(\/|$)/.test(pathname))  return "partner";
    if (/\/account\/supplier(\/|$)/.test(pathname)) return "supplier";
    if (/\/account\/personal(\/|$)/.test(pathname)) return "personal";
    if (/\/account\/admin(\/|$)/.test(pathname))    return "admin";
    return "profile";
  }, [pathname]);
  const adminModule = React.useMemo(() => {
    if (/\/account\/admin\/employees/.test(pathname)) return "employees";
    if (/\/account\/admin\/accounts/.test(pathname))  return "accounts";
    if (/\/account\/admin\/create-account/.test(pathname)) return "create-account";
    if (/\/account\/admin\/templates/.test(pathname)) return "templates";
    return null;
  }, [pathname]);

  // внутри подпунктов админки (сотрудники / учётки / создание) прячем стикидок,
  // чтобы не мешал работе со списками (без блокировки скролла страницы)
  React.useEffect(() => {
    const hide = tab === "admin" && !!adminModule;
    document.body.classList.toggle("dock-off", hide);
    return () => document.body.classList.remove("dock-off");
  }, [tab, adminModule]);

  /* подхватываем юзера */
  React.useEffect(() => {
    (async () => {
      try {
      let t = sessionStorage.getItem("auth:accessToken");
      if (!t) t = await apiRefresh(1200);
      if (!t) return;

      // Проверяем токен. Если протух (apiMe пустой) — обновляем и берём свежий,
      // иначе админ-список (/admin/users) и DaData-прокси получают 401 и «молча»
      // возвращают пусто: список учёток не грузится, ИНН не подтягивается.
      let u = await apiMe(t);
      if (!u) {
        const fresh = await apiRefresh(1500);
        if (fresh) { t = fresh; u = await apiMe(t); }
      }
      setToken(t);
      sessionStorage.setItem("auth:accessToken", t);
      if (!u) return;

      const email = String(u.email || "");
      setUserEmail(email);
      setUserId(String(u.id || ""));

      // Хэндл (cube-tech.ru/<...>) привязан к личности и не редактируется пользователем:
      // учётка по логину → сам логин (tss); учётка по почте → часть до «@».
      const fromEmail = email.includes("@") ? email.split("@")[0] : "";
      const handle = String(u.login || "").trim() || fromEmail;
      setUsername(handle);
      setDisplay((prev) => (prev || u.name || ""));

      setPhone(String(u.phone || ""));
      setGroupCode(toCode(u.group || u.role || "user"));
      const admin = Boolean(u.isAdmin || u.role === "admin" || u.group === "admin");
      setIsAdmin(admin);
      try { sessionStorage.setItem("auth:isAdmin", admin ? "1" : "0"); } catch {}
      setCity(String(u.city || ""));
      setAbout(String(u.about || ""));
      setOrg(String(u.org || u.organization || ""));
      setInn(String(u.inn || ""));
      setKpp(String(u.kpp || ""));
      setLegalAddress(String(u.legalAddress || u.orgAddress || ""));
      setEmailOptIn(Boolean(u.emailOptIn));
      setTwoFA(Boolean(u.twoFactorEnabled));
      setEmailVerified(Boolean(u.emailVerified));
      const mc = Boolean(u.mustChangePassword);
      setMustChange(mc);
      if (mc) setOnboardOpen(true); // мягкое приглашение — заказчик может закрыть и зайти
      } finally {
        setBooting(false); // сняли спиннер загрузки профиля (в т.ч. если сессии нет)
      }
    })();
  }, []);

  /* CSS плейсхолдера */
  React.useEffect(() => {
    const css = document.createElement("style");
    css.textContent = `.with-ph::placeholder{color:${PH};opacity:1}`;
    document.head.appendChild(css);
    return () => css.remove();
  }, []);

  /* якоря для выравнивания */
  const gridRef = React.useRef(null);
  const displayAnchorRef = React.useRef(null);
  const formTopAnchorRef = React.useRef(null);
  const leftStartRef = React.useRef(null);
  const [asideShift, setAsideShift] = React.useState(0);
  const [leftShift, setLeftShift] = React.useState(0);
  const [isDesktop, setIsDesktop] = React.useState(() => { try { return window.matchMedia("(min-width: 1024px)").matches; } catch { return true; } });
  React.useEffect(() => {
    let mql; try { mql = window.matchMedia("(min-width: 1024px)"); } catch { return; }
    const on = () => setIsDesktop(mql.matches);
    on();
    try { mql.addEventListener("change", on); } catch { mql.addListener(on); }
    return () => { try { mql.removeEventListener("change", on); } catch { mql.removeListener(on); } };
  }, []);

  React.useEffect(() => {
    const calc = () => {
      if (!gridRef.current) return;
      const g = gridRef.current.getBoundingClientRect();
      if (displayAnchorRef.current) {
        const a = displayAnchorRef.current.getBoundingClientRect();
        setAsideShift(Math.max(0, a.top - g.top));
      }
      if (leftStartRef.current && formTopAnchorRef.current) {
        const l = leftStartRef.current.getBoundingClientRect();
        const f = formTopAnchorRef.current.getBoundingClientRect();
        setLeftShift(Math.max(0, f.top - l.top));
      }
    };
    calc();
    // повторный расчёт после раскладки (шрифты/переключение вкладки), чтобы кнопка не «прыгала»
    const raf = requestAnimationFrame(calc);
    window.addEventListener("resize", calc);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", calc); };
  }, [tab, isDesktop]);

  // расширяем пунктир под вкладками на +64 справа
  // пунктир под вкладками доводим ровно до правого края кнопки «Сохранить изменения» (конец col4)
  const tabsLineWidth = MID_COL + GAP_COL + RIGHT_COL;

  async function handleChangePassword() {
    const next = {};
    if (!curPwd) next.curPwd = "Введите текущий пароль.";
    if (!newPwd) next.newPwd = "Введите новый пароль.";
    else {
      const pErr = passwordPolicyError(newPwd);
      if (pErr) next.newPwd = pErr;
    }
    if (newPwd && newPwd === curPwd) next.newPwd = "Новый пароль совпадает с текущим.";
    if (newPwd2 !== newPwd) next.newPwd2 = "Пароли не совпадают.";
    setPwdErrors(next);
    if (Object.keys(next).length) return;

    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }

    try {
      setPwdSaving(true);
      const resp = await apiChangePassword(token, curPwd, newPwd);
      if (!resp.ok) {
        const msg = PWD_ERR_MAP[resp.error] || "Не удалось сменить пароль.";
        if (resp.error === "invalid current password") setPwdErrors({ curPwd: msg });
        else setPwdErrors({ newPwd: msg });
        window.showDockToast?.(msg);
        return;
      }
      // сервер выдал свежий access-token (остальные сессии разлогинены)
      if (resp.accessToken) {
        setToken(resp.accessToken);
        try { sessionStorage.setItem("auth:accessToken", resp.accessToken); } catch {}
      }
      setCurPwd(""); setNewPwd(""); setNewPwd2(""); setPwdErrors({});
      window.showDockToast?.("Пароль изменён");
    } catch {
      window.showDockToast?.("Не удалось сменить пароль");
    } finally {
      setPwdSaving(false);
    }
  }

  async function handleChangeEmail() {
    const next = {};
    const em = String(newEmail || "").trim();
    if (!em) next.newEmail = "Введите новую почту.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) next.newEmail = "Некорректная почта.";
    else if (em.toLowerCase() === String(userEmail || "").toLowerCase()) next.newEmail = "Совпадает с текущей почтой.";
    if (!emailPwd) next.emailPwd = "Введите текущий пароль.";
    setEmailErrors(next);
    if (Object.keys(next).length) return;

    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }

    try {
      setEmailSaving(true);
      const resp = await apiChangeEmail(token, em, emailPwd);
      if (!resp.ok) {
        const map = {
          "invalid current password": "Неверный пароль.",
          "invalid email": "Некорректная почта.",
          "email already in use": "Эта почта уже занята.",
          "new email matches current": "Совпадает с текущей почтой.",
        };
        const msg = map[resp.error] || "Не удалось сменить почту.";
        if (resp.error === "invalid current password") setEmailErrors({ emailPwd: msg });
        else setEmailErrors({ newEmail: msg });
        window.showDockToast?.(msg);
        return;
      }
      if (resp.accessToken) {
        setToken(resp.accessToken);
        try { sessionStorage.setItem("auth:accessToken", resp.accessToken); } catch {}
      }
      if (resp.email) setUserEmail(resp.email);
      setNewEmail(""); setEmailPwd(""); setEmailErrors({});
      window.showDockToast?.("Почта изменена");
    } catch {
      window.showDockToast?.("Не удалось сменить почту");
    } finally {
      setEmailSaving(false);
    }
  }

  async function loadSessions() {
    if (!token) return;
    try {
      setSessionsLoading(true);
      const resp = await apiGetSessions(token);
      if (resp.ok) setSessions(resp.sessions || []);
    } catch {
      /* тихо */
    } finally {
      setSessionsLoading(false);
    }
  }

  // подгружаем сессии при открытии вкладки «Настройки»
  React.useEffect(() => {
    if (tab === "personal" && token) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  async function handleRevokeSession(sid) {
    if (!sid || !token) return;
    try {
      setRevokingSid(sid);
      const resp = await apiRevokeSession(token, sid);
      if (!resp.ok) {
        const msg = resp.error === "cannot revoke current session" ? "Это текущая сессия."
          : resp.error === "session not found" ? "Сессия уже завершена."
          : "Не удалось отозвать сессию.";
        window.showDockToast?.(msg);
        if (resp.error === "session not found") loadSessions();
        return;
      }
      setSessions((prev) => prev.filter((s) => s.sid !== sid));
      window.showDockToast?.("Сессия отозвана");
    } catch {
      window.showDockToast?.("Не удалось отозвать сессию");
    } finally {
      setRevokingSid("");
    }
  }

  async function handleLogoutAll() {
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
    try {
      setLogoutAllBusy(true);
      const resp = await apiLogoutAll(token);
      if (!resp.ok) { window.showDockToast?.("Не удалось выйти на устройствах"); return; }
      if (resp.accessToken) {
        setToken(resp.accessToken);
        try { sessionStorage.setItem("auth:accessToken", resp.accessToken); } catch {}
      }
      window.showDockToast?.("Вы вышли на других устройствах");
      loadSessions();
    } catch {
      window.showDockToast?.("Не удалось выйти на устройствах");
    } finally {
      setLogoutAllBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (!delPwd) { setDelError("Введите пароль для подтверждения."); return; }
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
    try {
      setDelBusy(true);
      const resp = await apiDeleteAccount(token, delPwd);
      if (!resp.ok) {
        const msg = resp.error === "invalid current password" ? "Неверный пароль."
          : resp.error === "admin account cannot be self-deleted" ? "Аккаунт администратора нельзя удалить."
          : "Не удалось удалить аккаунт.";
        setDelError(msg);
        window.showDockToast?.(msg);
        return;
      }
      // аккаунт удалён — завершаем сессию и уводим на главную
      try { sessionStorage.removeItem("auth:accessToken"); } catch {}
      window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: null, accessToken: null } }));
      window.showDockToast?.("Аккаунт удалён");
      try { window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }
      catch { window.location.href = "/"; }
    } catch {
      window.showDockToast?.("Не удалось удалить аккаунт");
    } finally {
      setDelBusy(false);
    }
  }

  /* ── 2FA: шаг 1 — запросить секрет и показать QR ── */
  async function handleStart2FA() {
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
    try {
      setTwoFABusy(true);
      setTwoFAError("");
      const resp = await apiTwofaSetup(token);
      if (!resp.ok) {
        window.showDockToast?.(resp.error === "2fa already enabled" ? "2FA уже включена" : "Не удалось начать подключение");
        return;
      }
      setTwoFASecret(resp.secret || "");
      let qr = "";
      try { qr = await QRCode.toDataURL(resp.otpauthUri || "", { margin: 1, width: 220, color: { dark: "#111111ff", light: "#00000000" } }); } catch { qr = ""; }
      setTwoFAQr(qr);
      setTwoFACode("");
      setBackupCodes(null);
      setTwoFAStage("setup");
    } catch {
      window.showDockToast?.("Не удалось начать подключение");
    } finally {
      setTwoFABusy(false);
    }
  }

  /* ── 2FA: шаг 2 — подтвердить кодом, включить, получить резервные коды ── */
  async function handleEnable2FA() {
    const code = String(twoFACode || "").trim();
    if (!/^\d{6}$/.test(code)) { setTwoFAError("Введите 6-значный код из приложения."); return; }
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
    try {
      setTwoFABusy(true);
      setTwoFAError("");
      const resp = await apiTwofaEnable(token, code);
      if (!resp.ok) {
        setTwoFAError(resp.error === "invalid code" ? "Неверный код. Проверьте время на устройстве." : "Не удалось включить 2FA.");
        return;
      }
      setTwoFA(true);
      setBackupCodes(resp.backupCodes || []);   // остаёмся в мастере, показываем коды
      setTwoFASecret(""); setTwoFAQr(""); setTwoFACode("");
      window.showDockToast?.("Двухфакторка включена");
    } catch {
      setTwoFAError("Не удалось включить 2FA.");
    } finally {
      setTwoFABusy(false);
    }
  }

  function close2FASetup() {
    setTwoFAStage("idle");
    setTwoFASecret(""); setTwoFAQr(""); setTwoFACode(""); setTwoFAError(""); setBackupCodes(null);
  }

  /* ── 2FA: отключение (пароль) ── */
  async function handleDisable2FA() {
    if (!disable2FAPwd) { setDisable2FAError("Введите пароль для подтверждения."); return; }
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
    try {
      setDisable2FABusy(true);
      setDisable2FAError("");
      const resp = await apiTwofaDisable(token, disable2FAPwd);
      if (!resp.ok) {
        setDisable2FAError(resp.error === "invalid current password" ? "Неверный пароль." : "Не удалось отключить 2FA.");
        return;
      }
      setTwoFA(false);
      setDisable2FAOpen(false); setDisable2FAPwd(""); setDisable2FAError("");
      window.showDockToast?.("Двухфакторка отключена");
    } catch {
      setDisable2FAError("Не удалось отключить 2FA.");
    } finally {
      setDisable2FABusy(false);
    }
  }

  /* ── Подтверждение почты: запросить письмо со ссылкой ── */
  async function handleRequestVerify() {
    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
    try {
      setVerifyBusy(true);
      setVerifyError("");
      const resp = await apiRequestVerify(token);
      if (!resp.ok) { setVerifyError("Не удалось отправить письмо. Попробуйте позже."); return; }
      if (resp.alreadyVerified) { setEmailVerified(true); return; }
      setVerifySent(true);
      window.showDockToast?.("Письмо отправлено");
    } catch {
      setVerifyError("Не удалось отправить письмо. Попробуйте позже.");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleSave() {
    // На вкладке «Настройки» сохраняем только настройки уведомлений — без строгой
    // валидации профильных полей (их тут нет; они на вкладке «Профиль»).
    if (tab === "personal") {
      if (!token) { window.showDockToast?.("Нужна авторизация"); return; }
      try {
        setSaving(true);
        const resp = await apiUpdateProfile(token, { emailOptIn });
        if (!resp) throw new Error("save_failed");
        window.showDockToast?.("Сохранено");
      } catch {
        window.showDockToast?.("Не удалось сохранить");
      } finally {
        setSaving(false);
      }
      return;
    }

    const next = {};
    if (!display.trim()) next.display = "Укажите отображаемое имя.";
    if (!city.trim()) next.city = "Выберите город.";
    if (!groupCode) next.groupCode = "Выберите вариант.";
    if (isLockedCode(groupCode) && !isAdmin) next.groupCode = "Недостаточно прав для выбора этой группы.";
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!token) { window.showDockToast?.("Нужна авторизация"); return; }

    try {
      setSaving(true);
      const avatarDataUrl = avatar ? await fileToDataURL(avatar) : undefined;

      const resp = await apiUpdateProfile(token, {
        username: username.trim(),
        name: display.trim(),
        phone: phone.trim(),
        group: groupCode,
        city,
        about,
        org: org.trim(),
        inn: inn.trim(),
        kpp: kpp.trim(),
        legalAddress: legalAddress.trim(),
        emailOptIn,
        ...(avatarDataUrl ? { avatar: avatarDataUrl } : {}),
      });

      if (!resp) throw new Error("save_failed");

      const updatedUser = resp.user || { name: display.trim(), email: userEmail, group: groupCode };
      if (typeof window.setHeaderUser === "function") {
        window.setHeaderUser(updatedUser, token);
      } else {
        window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: updatedUser, accessToken: token } }));
      }

      window.showDockToast?.("Сохранено");
    } catch (e) {
      window.showDockToast?.("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  const INFO_UP = 37;

  const crumbLabel = {
    profile:  "Профиль",
    partner:  "Партнёр",
    supplier: "Поставщик",
    personal: "Настройки", // ← Переименовано
    admin:    "Администратор",
  }[tab] || "Профиль";

  // Левый заголовок раздела — меняется при переключении вкладок.
  const asideHeading = {
    profile:  { title: "Ваш профиль",   desc: "Добавьте здесь дополнительную информацию о себе." },
    objects:  { title: "Ваши объекты",  desc: "Проекты, документы и материалы по вашим объектам." },
    partner:  { title: "Раздел: Партнёр",  desc: "Информация и материалы для партнёров КУБ." },
    supplier: { title: "Раздел: Поставщик", desc: "Информация и материалы для поставщиков КУБ." },
    admin:    { title: "Роли и группы", desc: "Управляйте ролями (доступ) и группами (кто вы?) прямо тут." },
  }[tab] || { title: "Ваш профиль", desc: "Добавьте здесь дополнительную информацию о себе." };

  // Первичная загрузка профиля — брендовый спиннер вместо мигающих пустых полей.
  if (booting) {
    return (
      <main className="lg:min-h-[100dvh]" style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8" }}>
        <CenterSpinner minHeight="70vh" size={36} label="Загружаем профиль…" />
      </main>
    );
  }

  return (
    <main className="lg:min-h-[100dvh]" style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8" }}>
      {onboardOpen ? (
        <FirstLoginModal
          token={token}
          hasEmail={String(userEmail || "").includes("@")}
          onLater={() => setOnboardOpen(false)}
          onSaved={(newToken, emailSet, emailValue) => {
            if (newToken) {
              setToken(newToken);
              try { sessionStorage.setItem("auth:accessToken", newToken); } catch {}
            }
            if (emailSet && emailValue) {
              setUserEmail(emailValue);
              setEmailOptIn(true);
              setEmailVerified(false);
            }
            setMustChange(false);
            setOnboardOpen(false);
          }}
        />
      ) : null}
      <div className="-mt-10 px-4 pt-4 lg:mt-0 lg:px-[52px] lg:pt-[72px]">
        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-[360px_714px_78px_277px]"
          style={{
            columnGap: 0,
            alignItems: "start",
            position: "relative",
          }}
        >
          {/* ЛЕВО — крошка + описание */}
          <aside>
            <div style={{ marginTop: isDesktop ? -35 : 0 }}>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35", marginBottom: 7 }}>Профиль</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#333" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#111" }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="9.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                  <rect x="13.2" y="8" width="1.6" height="8" rx="0.8" fill="currentColor" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 300 }}>{">"}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{crumbLabel}</span>
              </div>
            </div>

            <div ref={leftStartRef} />

            {tab !== "personal" && (
              <div className="hidden lg:block animate-svcfade" key={tab} style={{ marginTop: isDesktop ? leftShift : 0 }}>
                <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35" }}>
                  {asideHeading.title}
                </div>
                <div style={{ marginTop: 7, fontSize: 14, fontWeight: 300, color: "#222", lineHeight: 1.5, maxWidth: 300 }}>
                  {asideHeading.desc}
                </div>
              </div>
            )}
          </aside>

          {/* ЦЕНТР — вкладки + контент */}
          <section>
            <TabsBar
              active={tab}
              isAdmin={isAdmin}
              onNavigate={() => {}}
              lineWidth={tabsLineWidth}
              isDesktop={isDesktop}
            />

            {/* Save — мобилка: под табами (как awwwards) */}
            {!(tab === "personal" || tab === "objects" || tab === "admin" || (isAdmin && (tab === "partner" || tab === "supplier"))) && (
              <div className="mb-7 mt-2 lg:hidden">
                {saving ? (
                  <div className="w-full" style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={24} /></div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full"
                    style={{ height: 48, borderRadius: 10, background: "#000", color: "#fff", border: "none", fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: "pointer" }}
                  >
                    Сохранить изменения
                  </button>
                )}
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 300, color: "#222" }}>
                  Если вы внесли какие-либо изменения, не забудьте сохранить их, прежде чем покинуть эту страницу.
                </div>
              </div>
            )}

            {/* Заголовок раздела — мобилка (под табами, как awwwards; fade при переключении) */}
            {tab !== "personal" && (
              <div key={tab} className="mb-5 animate-svcfade lg:hidden">
                <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35" }}>
                  {asideHeading.title}
                </div>
                <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#222" }}>
                  {asideHeading.desc}
                </div>
              </div>
            )}

            {tab === "objects" ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : undefined}>
                <ObjectsSection pathname={pathname} userEmail={userEmail} userId={userId} isAdmin={isAdmin} />
              </div>
            ) : tab === "admin" && isAdmin ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : undefined}>
                {adminModule === "employees" ? (
                  <EmployeesModule backTo="/account/admin" />
                ) : adminModule === "accounts" ? (
                  <AdminAccounts token={token} />
                ) : adminModule === "create-account" ? (
                  <AdminCreateAccount token={token} />
                ) : adminModule === "templates" ? (
                  <TemplatesModule backTo="/account/admin" />
                ) : (
                  <AdminLauncher />
                )}
              </div>
            ) : tab === "partner" && isAdmin ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : undefined}>
                <AdminPanelFiltered token={token} group="partner" />
              </div>
            ) : tab === "supplier" && isAdmin ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : undefined}>
                <AdminPanelFiltered token={token} group="supplier" />
              </div>
            ) : (
              <>
                {tab === "personal" ? (
                  <div className="animate-svcfade" style={{ marginTop: 44, ...(isDesktop ? { marginLeft: -LEFT_COL, width: LEFT_COL + MID_COL + GAP_COL + RIGHT_COL } : {}) }}>

              {/* ——— Смена / добавление почты ——— */}
              <SettingsRow
                first
                title={userEmail ? "Смена почты" : "Добавление почты"}
                desc={userEmail ? "Укажите новый адрес и подтвердите текущим паролем." : "Добавьте адрес — на него будут приходить уведомления. Вход при этом остаётся по логину."}
                action={
                  emailSaving ? <SectionBusy /> : (
                    <SectionButton onClick={handleChangeEmail}>
                      {userEmail ? "Сменить почту" : "Добавить почту"}
                    </SectionButton>
                  )
                }
              >
                {userEmail && !emailVerified && (
                  <div className="animate-svcfade" style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, border: "1px solid #f0d9a8", background: "#fdf7ec", transition: "opacity .35s ease" }}>
                    {verifySent ? (
                      <div style={{ fontSize: 14, fontWeight: 300, color: "#222", lineHeight: 1.5 }}>
                        Письмо со ссылкой отправлено на <b style={{ fontWeight: 500 }}>{userEmail}</b>. Проверьте почту (ссылка действует 24 часа).
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Почта не подтверждена</div>
                        <div style={{ fontSize: 13, fontWeight: 300, color: "#7a6a45", marginTop: 3, lineHeight: 1.5 }}>
                          Подтвердите адрес <b style={{ fontWeight: 500 }}>{userEmail}</b>, чтобы обезопасить аккаунт и получать важные уведомления.
                        </div>
                        {verifyError && (<div style={{ fontSize: 12, fontWeight: 300, color: "#c0392b", marginTop: 6 }}>{verifyError}</div>)}
                        {verifyBusy ? (
                          <div style={{ marginTop: 10 }}><RowSpinner label="Отправляем письмо…" minHeight={38} /></div>
                        ) : (
                          <HoverBtn onClick={handleRequestVerify}
                            style={{ marginTop: 10, height: 38, padding: "0 16px", borderRadius: 8, border: "none", background: "#111", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: UI }}
                            hoverStyle={{ background: "#262626" }}>
                            Отправить письмо для подтверждения
                          </HoverBtn>
                        )}
                      </>
                    )}
                  </div>
                )}

                {userEmail ? (
                  <Field label="Текущая почта">
                    <div style={{ height: FIELD_H, display: "flex", alignItems: "center", padding: "0 12px", background: "#fff", boxShadow: `inset 0 -1px 0 0 ${UNDERLINE}`, color: TEXT, fontSize: 14, fontWeight: 300 }}>
                      {userEmail}
                      {vbadgeMount ? <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "#0a7d32", background: "#e7f6ec", borderRadius: 6, padding: "2px 7px", opacity: vbadgeShow ? 1 : 0, transition: "opacity .5s ease", pointerEvents: "none" }}>подтверждена</span> : null}
                    </div>
                  </Field>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5" style={{ marginTop: 12 }}>
                  <Field label={userEmail ? "Новая почта" : "Почта"} required error={emailErrors.newEmail}>
                    <Input type="email" value={newEmail} onChange={(v) => { setNewEmail(v); if (emailErrors.newEmail) setEmailErrors({ ...emailErrors, newEmail: "" }); }} placeholder="you@example.com" error={emailErrors.newEmail} />
                  </Field>
                  <Field label="Текущий пароль" required error={emailErrors.emailPwd}>
                    <Input type="password" value={emailPwd} onChange={(v) => { setEmailPwd(v); if (emailErrors.emailPwd) setEmailErrors({ ...emailErrors, emailPwd: "" }); }} placeholder="••••••••" error={emailErrors.emailPwd} />
                  </Field>
                </div>
              </SettingsRow>

              {/* ——— Смена пароля ——— */}
              <SettingsRow
                title="Смена пароля"
                desc="После смены другие сессии завершатся — текущая останется активной."
                action={
                  pwdSaving ? <SectionBusy /> : (
                    <SectionButton onClick={handleChangePassword}>
                      Сменить пароль
                    </SectionButton>
                  )
                }
              >
                <Field label="Текущий пароль" required error={pwdErrors.curPwd}>
                  <Input type="password" value={curPwd} onChange={(v) => { setCurPwd(v); if (pwdErrors.curPwd) setPwdErrors({ ...pwdErrors, curPwd: "" }); }} placeholder="••••••••" error={pwdErrors.curPwd} />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5" style={{ marginTop: 12 }}>
                  <Field label="Новый пароль" required error={pwdErrors.newPwd}>
                    <Input type="password" value={newPwd} onChange={(v) => { setNewPwd(v); if (pwdErrors.newPwd) setPwdErrors({ ...pwdErrors, newPwd: "" }); }} placeholder="Мин. 6, заглавная и символ" error={pwdErrors.newPwd} />
                  </Field>
                  <Field label="Повторите новый пароль" required error={pwdErrors.newPwd2}>
                    <Input type="password" value={newPwd2} onChange={(v) => { setNewPwd2(v); if (pwdErrors.newPwd2) setPwdErrors({ ...pwdErrors, newPwd2: "" }); }} placeholder="••••••••" error={pwdErrors.newPwd2} />
                  </Field>
                </div>
              </SettingsRow>

              {/* ——— Уведомления ——— */}
              <SettingsRow
                title="Уведомления"
                desc="Письма о продуктах и услугах КУБ."
                action={
                  saving ? <SectionBusy /> : (
                    <SectionButton onClick={handleSave}>
                      Сохранить
                    </SectionButton>
                  )
                }
              >
                <div style={{ fontSize: 14, fontWeight: 300, color: "#222", lineHeight: 1.55 }}>
                  КУБ может информировать меня о продуктах и услугах, отправляя персонализированные письма. Подробнее см. в нашей{" "}
                  <a href="https://cube-tech.ru/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: TEXT, textDecoration: "none" }}>Политике конфиденциальности</a>.
                </div>
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <button type="button" onClick={() => setEmailOptIn((v) => !v)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }} aria-pressed={emailOptIn}>
                    <Square checked={emailOptIn} />
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>Свяжитесь со мной по электронной почте.</div>
                </div>
              </SettingsRow>

              {/* ——— Безопасность (сессии) ——— */}
              <SettingsRow
                title="Безопасность"
                desc="Устройства и браузеры, где выполнен вход в аккаунт."
                action={
                  logoutAllBusy ? <SectionBusy /> : (
                    <SectionButton onClick={handleLogoutAll}>
                      Выйти везде
                    </SectionButton>
                  )
                }
              >
                {sessionsLoading && sessions.length === 0 ? (
                  <div style={{ fontSize: 14, fontWeight: 300, color: "#999" }}>Загрузка сессий…</div>
                ) : sessions.length === 0 ? (
                  <div style={{ fontSize: 14, fontWeight: 300, color: "#999" }}>Активных сессий не найдено.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sessions.map((s) => (
                      <div key={s.sid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 12, border: s.current ? "1px solid #000" : "1px solid #e6e6e6", background: s.current ? "#fafafa" : "#fff" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: TEXT, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {describeUserAgent(s.userAgent)}
                            {s.current && (<span style={{ fontSize: 11, fontWeight: 500, color: "#0a7d32", background: "#e7f6ec", borderRadius: 6, padding: "2px 7px" }}>текущая</span>)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 300, color: "#888", marginTop: 3 }}>
                            {[s.ip, formatSessionTime(s.lastSeen)].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        {!s.current && (
                          <button type="button" onClick={() => handleRevokeSession(s.sid)} disabled={revokingSid === s.sid} style={{ flexShrink: 0, height: 36, padding: "0 14px", borderRadius: 9, background: "#fff", color: "#c0392b", border: "1px solid #e3b4ae", fontFamily: UI, fontSize: 13, fontWeight: 300, cursor: revokingSid === s.sid ? "not-allowed" : "pointer", opacity: revokingSid === s.sid ? 0.6 : 1 }}>
                            {revokingSid === s.sid ? "…" : "Отозвать"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SettingsRow>

              {/* ——— Двухфакторная аутентификация ——— */}
              <SettingsRow
                title="Двухфакторная аутентификация"
                desc="Код из приложения-аутентификатора (Google Authenticator, Яндекс.Ключ) при каждом входе."
                action={null}
              >
                {backupCodes ? (
                  <div style={{ padding: 16, borderRadius: 12, border: "1px solid #d9d9d9", background: "#fafafa" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Сохраните резервные коды</div>
                    <div style={{ fontSize: 13, fontWeight: 300, color: "#777", marginBottom: 12 }}>
                      Каждый код одноразовый — используйте их, если потеряете доступ к приложению. Больше мы их не покажем.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontFamily: "monospace", fontSize: 15, color: TEXT }}>
                      {backupCodes.map((c) => (
                        <div key={c} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #eee", letterSpacing: 1, textAlign: "center" }}>{c}</div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                      <HoverBtn onClick={() => { try { navigator.clipboard?.writeText(backupCodes.join("\n")); window.showDockToast?.("Коды скопированы"); } catch {} }}
                        style={{ height: 42, padding: "0 18px", borderRadius: 10, background: "#fff", color: TEXT, border: "1px solid #d9d9d9", fontFamily: UI, fontSize: 14, fontWeight: 300 }}
                        hoverStyle={{ background: "#f5f5f5", borderColor: "#c4c4c4" }}>Скопировать</HoverBtn>
                      <HoverBtn onClick={close2FASetup}
                        style={{ height: 42, padding: "0 18px", borderRadius: 10, background: TEXT, color: "#fff", border: "none", fontFamily: UI, fontSize: 14, fontWeight: 300 }}
                        hoverStyle={{ background: "#262626" }}>Готово</HoverBtn>
                    </div>
                  </div>
                ) : twoFAStage === "setup" ? (
                  <div style={{ padding: 16, borderRadius: 12, border: "1px solid #d9d9d9", background: "#fafafa" }}>
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
                      {twoFAQr ? (
                        <img src={twoFAQr} alt="QR для аутентификатора" width={180} height={180} style={{ flexShrink: 0, borderRadius: 8, background: "transparent", marginTop: 22 }} />
                      ) : null}
                      <div style={{ flex: "1 1 220px", minWidth: 220 }}>
                        <div style={{ fontSize: 14, fontWeight: 400, color: TEXT, marginBottom: 8 }}>1. Отсканируйте QR-код в приложении или введите ключ вручную:</div>
                        <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #eee", fontFamily: "monospace", fontSize: 14, color: TEXT, wordBreak: "break-all", letterSpacing: 1 }}>{twoFASecret}</div>
                        <div style={{ marginTop: 14, fontSize: 14, fontWeight: 400, color: TEXT, marginBottom: 8 }}>2. Введите 6-значный код из приложения:</div>
                        <Field label="Код из приложения" required error={twoFAError}>
                          <Input value={twoFACode} onChange={(v) => { setTwoFACode(v.replace(/\D/g, "").slice(0, 6)); if (twoFAError) setTwoFAError(""); }} placeholder="123456" error={twoFAError} />
                        </Field>
                        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          {twoFABusy ? <RowSpinner label="Включаем 2FA…" minHeight={46} /> : (
                            <>
                              <HoverBtn onClick={handleEnable2FA}
                                style={{ height: 46, padding: "0 20px", borderRadius: 10, background: TEXT, color: "#fff", border: "none", fontFamily: UI, fontSize: 15, fontWeight: 300 }}
                                hoverStyle={{ background: "#262626" }}>Включить</HoverBtn>
                              <HoverBtn onClick={close2FASetup}
                                style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#fff", color: TEXT, border: "1px solid #d9d9d9", fontFamily: UI, fontSize: 15, fontWeight: 300 }}
                                hoverStyle={{ background: "#f5f5f5", borderColor: "#c4c4c4" }}>Отмена</HoverBtn>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : twoFA ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: disable2FAOpen ? 14 : 0 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", height: 26, padding: "0 12px", borderRadius: 999, background: "#e8f6ec", color: "#1e874b", fontFamily: UI, fontSize: 13, fontWeight: 400 }}>Включена</span>
                      {!disable2FAOpen && (
                        <IconLink
                          danger
                          icon={<ShieldIcon color="#e2571f" />}
                          onClick={() => { setDisable2FAOpen(true); setDisable2FAError(""); setDisable2FAPwd(""); }}
                        >
                          Отключить 2FA
                        </IconLink>
                      )}
                    </div>
                    {disable2FAOpen && (
                      <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e3b4ae", background: "#fdf7f6" }}>
                        <div style={{ fontSize: 14, fontWeight: 400, color: TEXT, marginBottom: 10 }}>Для отключения введите текущий пароль.</div>
                        <Field label="Пароль" required error={disable2FAError}>
                          <Input type="password" value={disable2FAPwd} onChange={(v) => { setDisable2FAPwd(v); if (disable2FAError) setDisable2FAError(""); }} placeholder="••••••••" error={disable2FAError} />
                        </Field>
                        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          {disable2FABusy ? <RowSpinner label="Отключаем 2FA…" minHeight={46} color="#c0392b" /> : (
                            <>
                              <HoverBtn onClick={handleDisable2FA}
                                style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#c0392b", color: "#fff", border: "none", fontFamily: UI, fontSize: 15, fontWeight: 300 }}
                                hoverStyle={{ background: "#a93125" }}>Отключить</HoverBtn>
                              <HoverBtn onClick={() => { setDisable2FAOpen(false); setDisable2FAPwd(""); setDisable2FAError(""); }}
                                style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#fff", color: TEXT, border: "1px solid #d9d9d9", fontFamily: UI, fontSize: 15, fontWeight: 300 }}
                                hoverStyle={{ background: "#f5f5f5", borderColor: "#c4c4c4" }}>Отмена</HoverBtn>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : twoFABusy ? (
                  <RowSpinner label="Готовим подключение…" minHeight={46} />
                ) : (
                  <IconLink
                    prompt="Сейчас не подключена — рекомендуем включить."
                    icon={<ShieldIcon color={TEXT} />}
                    onClick={handleStart2FA}
                  >
                    Подключить 2FA
                  </IconLink>
                )}
              </SettingsRow>

              {/* ——— Опасная зона ——— */}
              <SettingsRow
                danger
                title="Опасная зона"
                desc="Мы будем скучать, но если вы хотите навсегда удалить аккаунт и все его данные — вам сюда."
                action={null}
              >
                {!delOpen ? (
                  <IconLink
                    prompt="Хотите удалить аккаунт?"
                    icon={<TrashIcon color={TEXT} />}
                    onClick={() => { setDelOpen(true); setDelError(""); }}
                  >
                    Удалить аккаунт
                  </IconLink>
                ) : (
                  <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e3b4ae", background: "#fdf7f6", maxWidth: 480 }}>
                    <div style={{ fontSize: 14, fontWeight: 400, color: TEXT, marginBottom: 10 }}>Для подтверждения введите текущий пароль.</div>
                    <Field label="Пароль" required error={delError}>
                      <Input type="password" value={delPwd} onChange={(v) => { setDelPwd(v); if (delError) setDelError(""); }} placeholder="••••••••" error={delError} />
                    </Field>
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={handleDeleteAccount} disabled={delBusy} style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#c0392b", color: "#fff", border: "none", fontFamily: UI, fontSize: 15, fontWeight: 300, cursor: delBusy ? "not-allowed" : "pointer", opacity: delBusy ? 0.85 : 1 }}>{delBusy ? "Удаляем…" : "Удалить навсегда"}</button>
                      <button type="button" onClick={() => { setDelOpen(false); setDelPwd(""); setDelError(""); }} disabled={delBusy} style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#fff", color: TEXT, border: "1px solid #d9d9d9", fontFamily: UI, fontSize: 15, fontWeight: 300, cursor: "pointer" }}>Отмена</button>
                    </div>
                  </div>
                )}
              </SettingsRow>

              <div className="h-0 lg:h-[120px]" />
                  </div>
                ) : (
                  <div style={{ marginTop: 44 }}>
                    <div ref={formTopAnchorRef} />
                    <form onSubmit={(e) => e.preventDefault()}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                        <div>
                          <Field label="Имя пользователя">
                            <div
                              title="Привязано к логину — изменить нельзя"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                height: FIELD_H,
                                background: "#fff",
                                boxShadow: `inset 0 -1px 0 0 ${UNDERLINE}`,
                                cursor: "default",
                              }}
                            >
                              <span
                                style={{
                                  color: PH,
                                  fontFamily: UI,
                                  fontSize: 14,
                                  fontWeight: 300,
                                  whiteSpace: "nowrap",
                                  paddingLeft: 12,
                                  userSelect: "text",
                                }}
                              >
                                cube-tech.ru/
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  color: TEXT,
                                  fontFamily: UI,
                                  fontSize: 14,
                                  fontWeight: 400,
                                  padding: "0 12px 0 2px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  userSelect: "text",
                                }}
                              >
                                {username || "—"}
                              </span>
                            </div>
                          </Field>
                          <p className="mt-1.5 text-[11px] font-light leading-none text-[#a7a7a7]">Формируется из логина автоматически и не редактируется.</p>
                        </div>

                        <div ref={displayAnchorRef}>
                          <Field label="Отображаемое имя" required error={errors.display}>
                            <Input
                              value={display}
                              onChange={(v) => { setDisplay(v); if (errors.display) setErrors({ ...errors, display: "" }); }}
                              placeholder="Фамилия Имя Отчество"
                              error={errors.display}
                            />
                          </Field>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5" style={{ marginTop: 12 }}>
                        <div>
                          <Field label="Телефон" error={errors.phone}>
                            <Input
                              value={phone}
                              onChange={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                              placeholder="+7 (900) 000-00-00"
                              error={errors.phone}
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Кто вы?" required error={errors.groupCode}>
                            <GroupSelect
                              value={groupCode}
                              onChange={(code) => { setGroupCode(code); if (errors.groupCode) setErrors({ ...errors, groupCode: "" }); }}
                              error={errors.groupCode}
                              canPickLocked={isAdmin || isLockedCode(groupCode)}
                            />
                          </Field>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <Field label="Организация">
                          <OrgSuggest value={org} onChange={setOrg} onPick={fillOrg} placeholder="Название или ИНН — начните вводить" />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5" style={{ marginTop: 12 }}>
                        <div>
                          <Field label="ИНН">
                            <Input value={inn} readOnly placeholder="Подтянется по организации" />
                          </Field>
                        </div>
                        <div>
                          <Field label="КПП">
                            <Input value={kpp} readOnly placeholder="Подтянется по организации" />
                          </Field>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <Field label="Юридический адрес">
                          <Input value={legalAddress} readOnly placeholder="Подтянется по организации" />
                        </Field>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <CitySelect
                          value={city}
                          onChange={(v) => { setCity(v); if (errors.city) setErrors({ ...errors, city: "" }); }}
                          error={errors.city}
                          offset={0}
                        />
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <Field label="Коротко о себе">
                          <Textarea value={about} onChange={setAbout} placeholder="Пара предложений о себе…" />
                        </Field>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <Field label="Аватар">
                          <AvatarPicker fileName={avatar?.name} onPick={(f) => setAvatar(f)} error={errors.avatar} />
                        </Field>
                      </div>

                      <div style={{ marginTop: 28 - INFO_UP, fontSize: 14, fontWeight: 300, color: "#222" }}>
                        КУБ может информировать меня о продуктах и услугах, отправляя персонализированные письма.{" "}
                        <br className="hidden md:inline lg:hidden" />
                        Подробнее см. в нашей{" "}
                        <a href="https://cube-tech.ru/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: TEXT, textDecoration: "none" }}>
                          Политике конфиденциальности
                        </a>.
                      </div>

                      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setEmailOptIn((v) => !v)}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                          aria-pressed={emailOptIn}
                        >
                          <Square checked={emailOptIn} />
                        </button>
                        <div style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>
                          Свяжитесь со мной по электронной почте.
                        </div>
                      </div>
                    </form>

                    <div className="h-0 lg:h-[200px]" />
                  </div>
                )}
              </>
            )}
          </section>

          {/* промежуток */}
          <div />

          {/* ПРАВАЯ кнопка — только на вкладках профиля/личной информации */}
          {tab === "personal" || tab === "objects" || tab === "admin" || (isAdmin && (tab === "partner" || tab === "supplier")) ? (
            <div />
          ) : (
            <aside className="hidden lg:block lg:sticky lg:top-6" style={{ marginTop: isDesktop ? Math.max(0, asideShift) : 0 }}>
              {saving ? (
                <div className="w-full lg:w-[277px]" style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={30} /></div>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full lg:w-[277px]"
                  style={{
                    height: 72,
                    borderRadius: 10,
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    fontFamily: UI,
                    fontSize: 18,
                    fontWeight: 300,
                    cursor: "pointer",
                    transition: "filter .15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.92)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  Сохранить изменения
                </button>
              )}
              <div className="lg:max-w-[277px]" style={{ marginTop: 14, fontSize: 14, fontWeight: 300, color: "#222" }}>
                Если вы внесли какие-либо изменения, не забудьте сохранить их, прежде чем покинуть эту страницу.
              </div>
            </aside>
          )}

        </div>
      </div>
    </main>
  );
}
