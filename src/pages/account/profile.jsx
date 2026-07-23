import React from "react";
import QRCode from "qrcode";
import ObjectsSection, { EmployeesModule, TemplatesModule, CreateObjectForm, UnderSelect, UnderInput, FLabel, PrimaryBtn, FilterBar } from "@/pages/account/objects/ObjectsSection.jsx";
import { AccessSheetModal } from "@/components/documents/AccessSheet.jsx";
import { BTN as MBTN, inputCls, ErrorSlot as MErrorSlot, FancyCheckbox, Label as MLabel, FormShell } from "@/components/common/Modals.jsx";
import Spinner, { CenterSpinner } from "@/components/common/Spinner.jsx";
import { confirmDialog } from "@/components/common/Confirm.jsx";
import ProjectsAdmin from "@/pages/account/ProjectsAdmin.jsx";
import * as DB from "@/data/objects.js";
import { setMyAuth, can as permCan, ROLE_LABELS, PERMISSIONS, PERM_GROUP_LABELS, effectivePerms } from "@/lib/perms.js";
import { refreshOnce } from "@/lib/auth.js";

/* ===== API helpers ===== */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "https://api.cube-tech.ru";
const api = (p) => `${API_BASE}${p}`;

// Рефреш идёт ТОЛЬКО через общий single-flight из @/lib/auth.js.
// Иначе profile/Header/admin параллельно дёргают /auth/refresh и ротируют
// одноразовый refresh-token наперегонки → 401 → logout → «Нет данных».
async function apiRefresh() {
  try { return await refreshOnce({ force: true }); }
  catch { return null; }
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
        const fresh = await apiRefresh(8000);
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

/* --- админ: PATCH одной учётки с 401-retry, возвращает {ok, error, user} --- */
async function apiAdminPatchUser(token, userId, patch) {
  const id = userId;
  if (!id) return { ok: false, error: "no_id" };
  const doCall = async (tk) => fetch(api(`/admin/users/${encodeURIComponent(id)}`), {
    method: "PATCH",
    credentials: "include",
    headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  try {
    let tk = "";
    try { tk = sessionStorage.getItem("auth:accessToken") || token || ""; } catch { tk = token || ""; }
    let r = await doCall(tk);
    if (r.status === 401) {
      const fresh = await apiRefresh(8000);
      if (fresh) { tk = fresh; try { sessionStorage.setItem("auth:accessToken", fresh); } catch {} r = await doCall(tk); }
    }
    const data = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: (data && data.error) || `http_${r.status}` };
    return { ok: true, user: (data && data.user) || null };
  } catch {
    return { ok: false, error: "network" };
  }
}

/* --- админ: сброс пароля учётке (задаёт новый пароль; requireChange — потребовать
       смену при первом входе). Все сессии пользователя инвалидируются на бэке. --- */
async function apiAdminResetPassword(token, userId, newPassword, requireChange = false) {
  return apiAdminPatchUser(token, userId, { newPassword, requirePasswordChange: !!requireChange });
}

/* --- админ: ручное подтверждение/снятие подтверждения почты учётки --- */
async function apiAdminSetEmailVerified(token, userId, verified = true) {
  return apiAdminPatchUser(token, userId, { emailVerified: !!verified });
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
      const fresh = await apiRefresh(8000);
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
      const fresh = await apiRefresh(8000);
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
const MUTED = "#777";
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
    if (!token) { token = (await apiRefresh(8000)) || ""; if (token) { try { sessionStorage.setItem("auth:accessToken", token); } catch {} } }
    if (!token) return [];
    let r = await call(token);
    if (r.status === 401) {
      // токен протух в середине сессии — обновляем и повторяем
      const fresh = await apiRefresh(8000);
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
                  cursor: disabled ? "default" : "pointer",
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
                {/* Замок только тем, у кого нет прав назначить группу; у админа — чисто */}
                {disabled ? <Lock /> : null}
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* селект ролей доступа — каноничная модель RBAC (perms.js):
   admin/manager/executor/viewer/customer. Легаси-значения (user/пусто) → customer. */
const ACCESS_ROLE_OPTIONS = [
  { code: "admin",    label: ROLE_LABELS.admin },
  { code: "manager",  label: ROLE_LABELS.manager },
  { code: "executor", label: ROLE_LABELS.executor },
  { code: "viewer",   label: ROLE_LABELS.viewer },
  { code: "customer", label: ROLE_LABELS.customer },
];
const normRole = (v) => {
  const s = String(v || "").trim().toLowerCase();
  return ACCESS_ROLE_OPTIONS.some((o) => o.code === s) ? s : "customer";
};
function AccessRoleSelect({ value, onChange }) {
  const OPTIONS = ACCESS_ROLE_OPTIONS;
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const current = normRole(value);
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
          {OPTIONS.find(o => o.code === current)?.label || ROLE_LABELS.customer}
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

/* часовые пояса РФ (IANA ↔ подпись + смещение). Дефолт — Екатеринбург (UTC+5),
   он же пояс Ноябрьска/ЯНАО, где находится офис КУБ. */
const RU_TIMEZONES = [
  { tz: "Europe/Kaliningrad",  city: "Калининград",  utc: "+2" },
  { tz: "Europe/Moscow",       city: "Москва",       utc: "+3" },
  { tz: "Europe/Samara",       city: "Самара",       utc: "+4" },
  { tz: "Asia/Yekaterinburg",  city: "Екатеринбург", utc: "+5" },
  { tz: "Asia/Omsk",           city: "Омск",         utc: "+6" },
  { tz: "Asia/Krasnoyarsk",    city: "Красноярск",   utc: "+7" },
  { tz: "Asia/Irkutsk",        city: "Иркутск",      utc: "+8" },
  { tz: "Asia/Yakutsk",        city: "Якутск",       utc: "+9" },
  { tz: "Asia/Vladivostok",    city: "Владивосток",  utc: "+10" },
  { tz: "Asia/Magadan",        city: "Магадан",      utc: "+11" },
  { tz: "Asia/Kamchatka",      city: "Камчатка",     utc: "+12" },
];
const DEFAULT_TZ = "Asia/Yekaterinburg";
const tzLabel = (tz) => {
  const z = RU_TIMEZONES.find((z) => z.tz === tz);
  return z ? `${z.city} · UTC${z.utc}` : "";
};

function TimezoneSelect({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const current = RU_TIMEZONES.find((z) => z.tz === value) ? value : DEFAULT_TZ;
  return (
    <Field label="Часовой пояс">
      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="with-ph"
          style={{ ...baseFieldStyle(false), display: "grid", gridTemplateColumns: "1fr 24px", alignItems: "center", textAlign: "left", cursor: "pointer" }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span style={{ color: TEXT }}>{tzLabel(current)}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1" }}>
            {open ? <path d="M5 15L12 8l7 7" fill="none" stroke="currentColor" strokeWidth="2" />
                  : <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />}
          </svg>
        </button>
        {open && (
          <div
            style={{ position: "absolute", left: 0, right: 0, top: FIELD_H, zIndex: 70, background: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,.08)", maxHeight: 320, overflowY: "auto" }}
            role="listbox"
          >
            {RU_TIMEZONES.map((z) => (
              <button
                key={z.tz}
                type="button"
                onClick={() => { onChange(z.tz); setOpen(false); }}
                style={{ width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 16, fontWeight: 300, color: TEXT }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                role="option"
                aria-selected={current === z.tz}
              >
                {z.city} · UTC{z.utc}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

/* аватар */
function AvatarPicker({ fileName, onPick, error }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);
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
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
        style={{
          width: 200, height: 200,
          border: `1px dashed ${error ? ERR : hover ? "#9a9a9a" : UNDERLINE}`,
          borderRadius: 10,
          display: "block", padding: 14, cursor: "pointer",
          background: hover ? "#f4f4f4" : "#fafafa",
          transition: "background .12s ease, border-color .12s ease",
          boxShadow: error ? `inset 0 0 0 1px ${ERR}` : "none",
        }}
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
      className="grid grid-cols-1 xl:grid-cols-[360px_714px_78px_277px]"
      style={{
        columnGap: 0,
        alignItems: "start",
        borderTop: first ? "none" : "1px solid #e9e9e9",
        paddingTop: first ? 0 : 44,
        paddingBottom: 44,
      }}
    >
      {/* ЛЕВО — заголовок + описание */}
      <div className="xl:pr-10">
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
      <div className="mt-5 xl:mt-0" style={{ maxWidth: MID_COL }}>
        {children}
      </div>

      {/* ПРОМЕЖУТОК */}
      <div className="hidden xl:block" />

      {/* ПРАВО — основная кнопка секции */}
      <div className="mt-5 xl:mt-0">{action}</div>
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
      className="h-12 w-full rounded-lg text-sm xl:h-[72px] xl:w-[277px] xl:rounded-xl xl:text-[18px]"
      style={{
        background: solid ? "#1c1c1c" : "#fff",
        color: solid ? "#fff" : TEXT,
        border: solid ? "none" : "1px solid #d9d9d9",
        fontFamily: UI,
        fontWeight: 300,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.85 : 1,
        transition: "background-color .15s ease, border-color .15s ease",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (solid) e.currentTarget.style.backgroundColor = "#2a2a2a";
        else e.currentTarget.style.borderColor = "#000";
      }}
      onMouseLeave={(e) => {
        if (solid) e.currentTarget.style.backgroundColor = "#1c1c1c";
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
    <div className="h-12 w-full xl:h-[72px] xl:w-[277px]" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
function TabsBar({ active, isAdmin, canPartner, canSupplier, onNavigate, lineWidth, isDesktop = false }) {
  const wrapRef = React.useRef(null);
  const tabRefs = React.useRef(new Map());
  const [underline, setUnderline] = React.useState({ left: 0, width: 56 });
  // Анимацию включаем только после первичной раскладки, иначе при заходе
  // из поповера полоска «проезжает» через соседние вкладки.
  const [animate, setAnimate] = React.useState(false);
  // Полоску не показываем, пока не измерили её реальную позицию —
  // иначе виден кадр под «Профиль» (left:0), что выглядит как рывок.
  const [measured, setMeasured] = React.useState(false);

  // ===== Мобильные вкладки (карусель-центрирование) =====
  // Секции листаются горизонтально; вкладка, доехавшая до ЦЕНТРА, крупнеет и становится
  // текущей после остановки скролла. Переключение свайпом ИЛИ тапом (тап центрирует).
  const isMobile = !isDesktop;
  const vibrate = React.useCallback((ms) => {
    try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms); } catch {}
  }, []);
  const [focusCode, setFocusCode] = React.useState(active); // вкладка по центру (живая подсветка/рост при свайпе)
  React.useEffect(() => { setFocusCode(active); }, [active]);
  // focusCode держим ещё и в ref: measure() читает его БЕЗ пересоздания, иначе большой
  // эффект-центрирование (deps: measure) перезапускался на каждый тик свайпа и дёргал скролл.
  const focusCodeRef = React.useRef(active);
  React.useEffect(() => { focusCodeRef.current = focusCode; }, [focusCode]);
  const commitTimerRef = React.useRef(null);

  const TABS_DEF = React.useMemo(() => {
    const profile  = { code: "profile",  label: "Профиль",   locked: false };
    const objects  = { code: "objects",  label: "Объекты",   locked: false };
    const partner  = { code: "partner",  label: "Партнёр",   locked: !canPartner };
    const supplier = { code: "supplier", label: "Поставщик", locked: !canSupplier };
    const personal = { code: "personal", label: "Настройки", locked: false };
    const admin    = { code: "admin",    label: "Администратор", locked: false };
    const help     = { code: "help",     label: "Помощь",    locked: false };
    // Админ/сотрудник: привычный порядок + «Администратор».
    if (isAdmin) return [profile, objects, partner, supplier, personal, admin];
    // Заказчик: «Партнёр» и «Поставщик» (обычно недоступны) — в конец, чтобы не
    // мешали частым «Настройки»/«Помощь». Вместо «Администратора» — «Помощь».
    return [profile, objects, personal, help, partner, supplier];
  }, [isAdmin, canPartner, canSupplier]);

  // Код вкладки ближе всего к ЦЕНТРУ ряда. Заблокированные (Партнёр/Поставщик
  // у заказчика) пропускаем — на них свайпом/тапом не «встать».
  const centeredCode = React.useCallback(() => {
    const wrap = wrapRef.current; if (!wrap) return null;
    const rWrap = wrap.getBoundingClientRect();
    const cX = rWrap.left + rWrap.width / 2;
    let cur = null, best = Infinity;
    for (const t of TABS_DEF) {
      if (t.locked) continue;
      const el = tabRefs.current.get(t.code);
      if (!el || !el.isConnected) continue;
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - cX);
      if (d < best) { best = d; cur = t.code; }
    }
    return cur;
  }, [TABS_DEF]);

  const measure = React.useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Мобилка: активная вкладка всегда в ЦЕНТРЕ ряда → полоску тоже закрепляем по центру
    // (ширина = центральной/фокусной вкладки). Так при свайпе она не «ездит», а стоит под
    // крупной центральной надписью — ширина плавно подстраивается под новую вкладку.
    if (isMobile) {
      const el = tabRefs.current.get(focusCodeRef.current) || tabRefs.current.get(active);
      if (!el) return;
      const w = Math.max(24, el.getBoundingClientRect().width);
      const rWrap = wrap.getBoundingClientRect();
      setUnderline({ left: Math.max(0, rWrap.width / 2 - w / 2), width: w });
      setMeasured(true);
      return;
    }
    const el = tabRefs.current.get(active);
    if (!el) return;
    const rTab = el.getBoundingClientRect();
    const rWrap = wrap.getBoundingClientRect();
    setUnderline({
      left: Math.max(0, rTab.left - rWrap.left),
      width: Math.max(24, rTab.width),
    });
    setMeasured(true);
  }, [active, isMobile]);

  React.useEffect(() => {
    // Прокрутить активную вкладку в зону видимости (важно при переходе из поповера)
    try {
      const el = tabRefs.current.get(active);
      // Активную вкладку выводим в центр ряда (карусель).
      el?.scrollIntoView?.({ block: "nearest", inline: "center" });
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
      case "help":     return "/account/help";
      default:          return "/account/profile";
    }
  };

  const onClickTab = (e, tab) => {
    e.preventDefault();
    if (tab.locked) return;
    if (!isDesktop) { setFocusCode(tab.code); vibrate(10); } // мгновенная отдача + подсветка
    try {
      window.history.pushState({}, "", toPath(tab.code));
      onNavigate?.(tab.code);
    } catch {}
  };

  // Свайп: пока листаешь — центральная вкладка крупнеет/подсвечивается (тик-вибро при
  // смене); когда скролл остановился — переходим на неё (как при тапе).
  React.useEffect(() => {
    if (isDesktop) return;
    const wrap = wrapRef.current; if (!wrap) return;
    const onScroll = () => {
      const code = centeredCode();
      if (code) setFocusCode((prev) => { if (code !== prev) vibrate(5); return code; });
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = setTimeout(() => {
        const c = centeredCode();
        if (!c || c === active) return;
        const t = TABS_DEF.find((x) => x.code === c);
        if (!t || t.locked) return;
        try { window.history.pushState({}, "", toPath(c)); onNavigate?.(c); } catch {}
      }, 160);
    };
    wrap.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      wrap.removeEventListener("scroll", onScroll);
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, active, TABS_DEF, centeredCode, vibrate]);

  return (
    <div className="relative mt-[24px] pb-[18px] xl:-mt-[35px]">
      <div
        ref={wrapRef}
        className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          display: "flex", alignItems: "center", gap: isMobile ? 22 : 24, fontSize: 14, overflowX: "auto",
          ...(isMobile ? { WebkitOverflowScrolling: "touch", minHeight: 56, scrollSnapType: "x proximity" } : null),
        }}
      >
        {/* Начальная распорка: чтобы первая вкладка могла доехать до центра */}
        {isMobile ? <span aria-hidden style={{ flex: "0 0 calc(50% - 40px)" }} /> : null}
        {TABS_DEF.map((t) => {
          const isActive = t.code === active;
          const isLockedTab = isMobile && t.locked; // заказчику Партнёр/Поставщик недоступны — серые, не растут
          // Пока свайпаешь: центральная вкладка крупнеет и темнеет (карусель).
          const isFocused = isMobile && !isLockedTab && t.code === focusCode;
          const refCb = (el) => { if (el) tabRefs.current.set(t.code, el); else tabRefs.current.delete(t.code); };
          const color = isMobile
            ? (isLockedTab ? "#c2c2c2" : (isActive || isFocused) ? TEXT : "#9a9a9a")
            : (isActive ? TEXT : "#777");
          const weight = isMobile ? ((isActive || isFocused) && !isLockedTab ? 600 : 400) : (isActive ? 600 : 300);
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
                cursor: t.locked ? "default" : "pointer",
                ...(isMobile ? {
                  // вкладка по центру крупнеет до размера заголовка «Профиль» (22px); остальные 16px
                  fontSize: (isActive || isFocused) && !isLockedTab ? 22 : 16,
                  lineHeight: 1,
                  scrollSnapAlign: "center",
                  transition: "font-size .18s ease, color .18s ease",
                } : null),
              }}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={t.locked || undefined}
              title={t.locked ? "Недоступно" : undefined}
            >
              {t.locked && (t.code === "partner" || t.code === "supplier") ? <Lock /> : null}
              {t.label}
            </a>
          );
        })}
        {/* Хвостовая распорка: чтобы последняя вкладка тоже могла доехать до центра */}
        {isMobile ? <span aria-hidden style={{ flex: "0 0 calc(50% - 40px)" }} /> : null}
      </div>

      <div
        style={{
          marginTop: isMobile ? 0 : 10,
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
            display: "block", // мобилка: полоска закреплена по центру (как на ПК под активной вкладкой)
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
// Подписи ролей для списка учёток. Легаси user → «Заказчик» (см. normRole).
const ROLE_LABEL = { ...ROLE_LABELS, user: ROLE_LABELS.customer };
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
  const phone = useIsPhone();
  const roleLabel = ROLE_LABEL[String(u.role || "customer").toLowerCase()] || ROLE_LABELS.customer;
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
        <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: phone ? 2 : 8, flexShrink: 0 }}>
          {phone ? (
            <>
              <RefDocIconBtn title="Открыть" onClick={onOpen}>{RefMiniIcon.open}</RefDocIconBtn>
              <RefDocIconBtn title="Удалить" color="#fa5d29" onClick={onDelete}>{RefMiniIcon.trash}</RefDocIconBtn>
            </>
          ) : (
            <>
              <AcctAction onClick={onOpen}>Открыть</AcctAction>
              <AcctAction accent onClick={onDelete}>Удалить</AcctAction>
            </>
          )}
        </div>
      </div>
      <AcctDotted />
    </>
  );
}

/* Карточка одной учётки: просмотр данных (ИНН, организация), смена группы/роли, удаление. */
function AccountDetail({ token, user, onBack, onChanged, onDeleted }) {
  const narrow = useIsPhone();
  const id = user.id ?? user._id ?? user.userId ?? user.email;
  const [full, setFull] = React.useState(user);
  const [name, setName] = React.useState(user.name || "");
  const [phone, setPhone] = React.useState(user.phone || "");
  const [group, setGroup] = React.useState(toCode(user.group || "user"));
  const [role, setRole] = React.useState(normRole(user.role));
  const [org, setOrg] = React.useState(user.org || "");
  const [inn, setInn] = React.useState(user.inn || "");
  const [kpp, setKpp] = React.useState(user.kpp || "");
  const [legalAddress, setLegalAddress] = React.useState(user.legalAddress || user.orgAddress || "");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [innBusy, setInnBusy] = React.useState(false);
  // Безопасность: сброс пароля + ручное подтверждение почты
  const [newPass, setNewPass] = React.useState("");
  const [requireChange, setRequireChange] = React.useState(false);
  const [pwBusy, setPwBusy] = React.useState(false);
  const [pwErr, setPwErr] = React.useState("");
  const [pwDone, setPwDone] = React.useState(false);
  const [evBusy, setEvBusy] = React.useState(false);

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
      if (u.role != null) setRole(normRole(u.role));
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
    if (role !== normRole(full.role)) patch.role = role;
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

  // Перевод серверных ошибок пароля на русский (см. passwordPolicyError на бэке).
  const pwErrRu = (e) => ({
    "password too short": "Минимум 6 символов",
    "password needs uppercase": "Нужна заглавная буква",
    "password needs symbol": "Нужен спецсимвол",
  }[e] || "Не удалось сбросить пароль");

  const doResetPassword = async () => {
    setPwErr("");
    const np = newPass.trim();
    if (!np) { setPwErr("Введите новый пароль"); return; }
    setPwBusy(true);
    const res = await apiAdminResetPassword(token, id, np, requireChange);
    setPwBusy(false);
    if (!res || res.ok === false) { setPwErr(pwErrRu(res && res.error)); return; }
    setNewPass(""); setRequireChange(false);
    setPwDone(true); setTimeout(() => setPwDone(false), 2200);
    window.showDockToast?.("Пароль обновлён · сессии сброшены");
  };

  const doVerifyEmail = async (verified) => {
    setEvBusy(true);
    const res = await apiAdminSetEmailVerified(token, id, verified);
    setEvBusy(false);
    if (!res || res.ok === false) { window.showDockToast?.("Не удалось изменить статус почты"); return; }
    setFull((prev) => ({ ...prev, emailVerified: verified }));
    window.showDockToast?.(verified ? "Почта подтверждена" : "Подтверждение снято");
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
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 14 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 14 }}>
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

        <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
          <div style={secLbl}>Безопасность</div>

          {/* Подтверждение почты вручную — на случай недоставки письма (напр. mail.ru) */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ minWidth: 0, flex: "1 1 240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 400, color: TEXT }}>Почта</span>
                <span style={{
                  fontSize: 12, fontWeight: 400, padding: "2px 9px", borderRadius: 999,
                  background: full.emailVerified ? "#e9f5ec" : "#fbece7",
                  color: full.emailVerified ? "#2f855a" : "#c0392b",
                }}>{full.emailVerified ? "подтверждена" : "не подтверждена"}</span>
              </div>
              <div style={{ marginTop: 5, fontSize: 13, fontWeight: 300, color: "#888", lineHeight: 1.5 }}>
                {full.emailVerified
                  ? "Вход по e-mail разрешён."
                  : "Пока почта не подтверждена, вход по e-mail заблокирован. Если письмо не дошло — подтвердите вручную."}
              </div>
            </div>
            {full.emailVerified ? (
              <button type="button" onClick={() => doVerifyEmail(false)} disabled={evBusy}
                style={{ height: 42, padding: "0 16px", borderRadius: 12, border: "1px solid #d9d9d9", background: "#fff", color: "#777", fontFamily: UI, fontSize: 14, cursor: evBusy ? "default" : "pointer", whiteSpace: "nowrap" }}>
                {evBusy ? "…" : "Снять подтверждение"}
              </button>
            ) : (
              <button type="button" onClick={() => doVerifyEmail(true)} disabled={evBusy}
                style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid #2f855a", background: evBusy ? "#2f855a" : "transparent", color: evBusy ? "#fff" : "#2f855a", fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: evBusy ? "default" : "pointer", whiteSpace: "nowrap" }}>
                {evBusy ? "Подтверждаем…" : "Подтвердить почту"}
              </button>
            )}
          </div>

          {/* Сброс пароля админом */}
          <div style={{ fontSize: 14, fontWeight: 400, color: TEXT, marginBottom: 10 }}>Сброс пароля</div>
          <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
            <Field label="Новый пароль"><Input value={newPass} onChange={(v) => { setNewPass(v); setPwErr(""); }} placeholder="Задайте новый пароль" /></Field>
            {pwErr ? <div style={{ fontSize: 13, color: "#fa5d29", marginTop: -4 }}>{pwErr}</div> : null}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 300, color: "#555" }}>
              <input type="checkbox" checked={requireChange} onChange={(e) => setRequireChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#111", cursor: "pointer" }} />
              Потребовать смену пароля при первом входе
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <DarkTextBtn onClick={doResetPassword} disabled={pwBusy}>{pwBusy ? "Сбрасываем…" : "Сбросить пароль"}</DarkTextBtn>
              {pwDone && <span style={{ fontSize: 13, color: "#3a8a3a" }}>Готово ✓</span>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 300, color: "#999", lineHeight: 1.5 }}>
              Минимум 6 символов, заглавная буква и спецсимвол. После сброса пользователь выйдет из всех сессий.
            </div>
          </div>
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
    if (!await confirmDialog({ title: "Удалить учётную запись?", message: `Учётная запись «${u.name || u.email}» будет удалена. Действие необратимо.`, confirmText: "Удалить" })) return;
    const id = u.id ?? u._id ?? u.userId ?? u.email;
    const res = await apiAdminDeleteUser(token, id);
    if (!res || res.ok === false) { window.showDockToast?.("Не удалось удалить (проверьте доступ)"); return; }
    window.showDockToast?.("Учётная запись удалена");
    setReload((v) => v + 1);
  };

  if (openUser) {
    // key/animate-svcfade — плавный переход список ↔ карточка учётной записи (house-стиль)
    return (
      <div key="acc-detail" className="animate-svcfade">
        <AccountDetail
          token={token}
          user={openUser}
          onBack={() => setOpenUser(null)}
          onChanged={() => setReload((v) => v + 1)}
          onDeleted={() => { setOpenUser(null); setReload((v) => v + 1); }}
        />
      </div>
    );
  }

  const title = filterGroup ? `Участники группы: ${labelByCode(filterGroup)}` : "Зарегистрированные учётные записи";
  return (
    <div key="acc-list" className="animate-svcfade" style={{ fontFamily: UI }}>
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
  reference: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.3" /><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  files: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 7.2c0-1 .8-1.7 1.7-1.7h3.4l1.8 2.1h8.4c.9 0 1.7.8 1.7 1.7" /><path d="M3.5 9.4h17V17c0 1-.8 1.8-1.7 1.8H5.2c-.9 0-1.7-.8-1.7-1.8z" /><path d="M12 11.5v4M12 15.5l-1.8-1.8M12 15.5l1.8-1.8" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="13" rx="2" /><path d="M3.5 14l4.2-3.6 3.3 2.8 3-2.6 4.5 3.9" /><circle cx="8.5" cy="9" r="1.3" /><path d="M8 20.5h8" />
    </svg>
  ),
};

function AdminLauncher() {
  const cards = [
    { key: "employees", title: "Сотрудники", sub: "Список сотрудников компании: добавление и удаление.", to: "/account/admin/employees", icon: AdminIcon.employees, perm: "staff.view" },
    { key: "accounts", title: "Учётные записи", sub: "Зарегистрированные пользователи, роли и группы доступа.", to: "/account/admin/accounts", icon: AdminIcon.accounts, perm: "accounts.view" },
    { key: "create", title: "Создать учётную запись", sub: "Завести нового пользователя-заказчика вручную.", to: "/account/admin/create-account", icon: AdminIcon.create, perm: "accounts.manage" },
    { key: "files", title: "Файлы", sub: "Все файлы по всем объектам в одном списке: скачать по одному или архивом.", to: "/account/admin/files", icon: AdminIcon.files, perm: "files.view" },
    { key: "templates", title: "Шаблоны объектов", sub: "Типы работ: префикс для № объекта и типовые этапы.", to: "/account/admin/templates", icon: AdminIcon.templates, perm: "templates.view" },
    { key: "projects", title: "Добавить проект", sub: "Витрина работ на главной и странице «Смотреть работы»: изображения, данные и предпросмотр.", to: "/account/admin/projects", icon: AdminIcon.projects, perm: "projects.add" },
    { key: "reference", title: "Справка", sub: "Как устроен кабинет: все разделы, роли, группы и права.", to: "/account/admin/reference", icon: AdminIcon.reference, perm: null },
  ];
  const sorted = [...cards].sort((a, b) => {
    const aOk = !a.perm || permCan(a.perm);
    const bOk = !b.perm || permCan(b.perm);
    return (aOk === bOk) ? 0 : aOk ? -1 : 1;
  });
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT }}>Администратор</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>Выберите раздел.</div>
      <div style={{ marginTop: 24, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {sorted.map((c) => {
          const ok = !c.perm || permCan(c.perm);
          if (!ok) {
            return (
              <div key={c.to} style={{ display: "flex", flexDirection: "column", borderRadius: 12, padding: 30, background: "#e9e9e9", minHeight: 123, opacity: 0.45, userSelect: "none" }}>
                <span style={{ color: "#bbb", display: "inline-flex" }}>{c.icon}</span>
                <div style={{ marginTop: "auto", paddingTop: 28 }}>
                  <div style={{ fontSize: 14, lineHeight: "19.6px", fontWeight: 600, color: "#aaa" }}>{c.title}</div>
                  <div style={{ marginTop: 8, fontSize: 13, lineHeight: "19.6px", fontWeight: 300, color: "#bbb" }}>Нет доступа</div>
                </div>
              </div>
            );
          }
          return (
            <a key={c.to} href={c.to} onClick={(e) => { e.preventDefault(); adminNav(c.to); }}
              style={{ display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit", border: "none", borderRadius: 12, padding: 30, background: "#e9e9e9", minHeight: 123, transition: "background-color .18s ease, box-shadow .18s ease, transform .18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#e9e9e9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <span style={{ color: TEXT, display: "inline-flex" }}>{c.icon}</span>
              <div style={{ marginTop: "auto", paddingTop: 28 }}>
                <div style={{ fontSize: 14, lineHeight: "19.6px", fontWeight: 600, color: "#222222" }}>{c.title}</div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: "19.6px", fontWeight: 300, color: "#222222" }}>{c.sub}</div>
              </div>
            </a>
          );
        })}
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

/* ===== Справка: роли, группы и права (строится из каталога perms.js) ===== */
const REF_ROLES = ["admin", "manager", "executor", "viewer", "customer"];
const REF_ROLE_DESC = {
  admin:    "Полный доступ ко всему кабинету и настройкам.",
  manager:  "Ведёт все объекты, документы, переписку, партнёров и поставщиков.",
  executor: "Работает по своим объектам: правит, публикует, загружает документы, отвечает заказчику.",
  viewer:   "Только просмотр объектов, партнёров и поставщиков.",
  customer: "Клиент. Видит только свои объекты, штатных инструментов нет.",
};
/* Порядок категорий на лендинге справки (для обоих режимов). */
const REF_CAT_ORDER = ["Ваш объект", "Ведение объектов", "Уведомления", "Профиль и доступ", "Администрирование"];

/* aud: "customer" — режим заказчика, "team" — режим команды, "both" — в обоих. */
const REF_TOPICS = [
  // ===== Кабинет заказчика ===== (у заказчика есть только объект — вопросы и уведомления собраны в нём)
  { key: "obj-customer", aud: "customer", cat: "Ваш объект", title: "Ваш объект", sub: "Всё об объекте в одном месте: статус, этапы, документы, вопросы и уведомления по нему.", demo: true },
  // ===== Общее для всех =====
  { key: "notify",   aud: "team", cat: "Уведомления", title: "Уведомления", sub: "Как приходят оповещения: точка «новое», метка «New», пульс на кнопке дока и письмо на почту.", demo: true },
  { key: "profile",  aud: "both", cat: "Профиль и доступ", title: "Профиль", sub: "Данные о себе; по ИНН организация, КПП и адрес подтянутся автоматически.", demo: true },
  { key: "settings", aud: "both", cat: "Профиль и доступ", title: "Настройки и безопасность", sub: "Почта, пароль, уведомления, 2FA, сессии и удаление аккаунта.", demo: true },
  // ===== Кабинет команды =====
  { key: "objects",   aud: "team", cat: "Ведение объектов", title: "Объекты", sub: "Карточка объекта: статусы, этапы, документы, переписка, команда и публикация.", demo: true },
  { key: "admin",     aud: "team", cat: "Администрирование", title: "Администратор — обзор", sub: "Какие модули в разделе и зачем каждый." },
  { key: "employees", aud: "team", cat: "Администрирование", title: "Сотрудники", sub: "Штат компании: роли, права и назначение ответственных.", demo: true },
  { key: "accounts",  aud: "team", cat: "Администрирование", title: "Учётные записи", sub: "Все пользователи кабинета: роли и группы.", demo: true },
  { key: "create",    aud: "team", cat: "Администрирование", title: "Создать учётную запись", sub: "Завести пользователя вручную и выдать доступ.", demo: true },
  { key: "files",     aud: "team", cat: "Администрирование", title: "Файлы", sub: "Все документы по всем объектам в одном списке." },
  { key: "templates", aud: "team", cat: "Администрирование", title: "Шаблоны объектов", sub: "Типы работ: префикс номера и типовые этапы." },
  { key: "projects",  aud: "team", cat: "Администрирование", title: "Добавить проект (витрина)", sub: "Витрина работ на сайте: карточки с фото и данными, порядок и что видно на главной.", demo: true },
  { key: "partners",  aud: "team", cat: "Администрирование", title: "Партнёры и поставщики", sub: "Отдельные разделы; доступ открывается правами, а не группой." },
  { key: "roles",     aud: "team", cat: "Администрирование", title: "Роли, группы и права", sub: "Кто что умеет: роли-пресеты, группы контрагентов и матрица «право × роль».", interactive: true, demo: true },
];

/* Контент статей справки. Блоки: {h} заголовок, {p} абзац, {ul} список,
   {steps} шаги, {kv} пары «термин — значение», {note} выноска. */
const REF_ARTICLES = {
  objects: [
    { p: "Объект — это единица работы по конкретному заказчику (например «ООО «КРТ» — Фасад, Ноябрьск»). У него есть номер, статус, этапы работ, документы и переписка. Заказчик видит опубликованную версию, сотрудник — рабочую." },
    { h: "Список объектов" },
    { ul: [
      "Каждая строка: «Заказчик — Название», номер объекта (напр. KRT-02-2026), цветной статус, город и ответственный, счётчик документов.",
      "Красный кружок «новое» — по объекту есть новое сообщение от заказчика.",
      "Панель фильтров: поиск (название, заказчик, ИНН, № договора, ID) и фильтры по статусу, ответственному и городу, счётчик активных фильтров и «Сбросить фильтры».",
      "Кнопка «+ Создать объект» — вверху справа.",
    ] },
    { demo: "filter" },
    { h: "Создание объекта" },
    { steps: [
      "Выберите «Тип работ (шаблон)» — он задаёт префикс номера и типовые этапы.",
      "Назначьте ответственного из сотрудников (можно добавить соисполнителей).",
      "Укажите название и город — сверху видно превью «Название — Город».",
      "Выберите заказчика из учётных записей (поиск по имени, e-mail, организации).",
      "Сохраните — объект создаётся сразу, номер генерируется автоматически по префиксу шаблона.",
    ] },
    { h: "Команда объекта: ответственный и соисполнители" },
    { ul: [
      "Ответственный — главный по объекту сотрудник; именно он ведёт переписку с заказчиком и получает его вопросы.",
      "Соисполнители — сотрудники, которых подключают в помощь: объект появляется у них в списке «Объекты», они получают уведомления по нему и могут работать в рамках своих прав.",
      "Добавить или снять соисполнителя можно в карточке объекта в любой момент — доступ и уведомления подключаются сразу, публикации ждать не нужно.",
      "Кого именно уведомлять о событии — определяется участием: ответственный и соисполнители, а также заказчик по своим событиям.",
    ] },
    { h: "Страница редактирования объекта — все блоки" },
    { p: "Ниже — та же страница редактирования, что открывается по клику на объект: сверху панель публикации, затем блоки одним столбцом — «Основное» (заказчик, город, адрес, договор, ответственный, соисполнители), «Этапы работ», «Документы», «Коммуникация по объекту» и «Опасная зона». Раскрывающиеся элементы — селект статуса, «Соисполнители» (там же колокол уведомлений у каждого) и «Что входит в этап». Меняйте что угодно — сверху появится панель «Опубликовать изменения»." },
    { demo: "team" },
    { h: "Статусы объекта" },
    { kv: [
      ["Черновик", "объект в подготовке"],
      ["В работе", "идут работы"],
      ["Ожидает заказчика", "ждём действий или ответа клиента"],
      ["Завершён", "работы закрыты"],
      ["Архив", "объект убран в архив"],
    ] },
    { h: "Этапы работ" },
    { ul: [
      "Этапы можно переставлять (на компьютере — перетаскиванием за ручку ⠿, на телефоне — кнопками ↑/↓), переименовывать и менять статус: Не начат / В работе / Завершён / На паузе / Ожидает заказчика.",
      "В поле «Что входит в этап» перечисляются пункты — заказчик увидит их списком, когда этап «В работе».",
      "Типовые этапы подставляются из шаблона, можно добавить свои.",
    ] },
    { demo: "stages" },
    { h: "Что входит в этап — заполнение" },
    { p: "У каждого этапа есть название и список пунктов «Что входит». Пункты вы заполняете и для себя, и для заказчика: как только этап переходит «В работе», заказчик видит эти пункты списком в своей карточке — до этого детализация ему не показывается." },
    { demo: "stage-edit" },
    { h: "Документы" },
    { ul: [
      "Сгруппированы по категориям: Договоры, Отчёты, Сметы, Исполнительная, Схемы, Акты, Фото, Прочее.",
      "Загрузка — по кнопке «+ Добавить» в категории; файл уходит в защищённое хранилище.",
      "У каждого документа: «Открыть» (просмотр), «Скачать», «Показать/Скрыть» для заказчика, «Удалить». Хранится история версий. На телефоне эти действия — компактные иконки в строке документа.",
      "Заказчик видит только опубликованные и видимые документы; внутренние комментарии и черновики ему не показываются.",
    ] },
    { buttons: [
      { label: "Открыть", variant: "light", does: "Открывает документ во встроенном просмотрщике (PDF, изображения, Word, Excel) — без скачивания.", then: "Документ откроется в модальном окне поверх карточки." },
      { label: "Скачать", variant: "light", does: "Скачивает файл на устройство по защищённой ссылке.", then: "Начнётся загрузка оригинала файла." },
      { label: "Показать / Скрыть", variant: "light", does: "Управляет видимостью документа для заказчика.", then: "Скрытый документ виден только сотрудникам; заказчик его не увидит." },
    ] },
    { h: "Переписка по объекту" },
    { ul: [
      "Диалог «заказчик ↔ ответственный» ведётся внутри объекта. Запросы заказчика нумеруются (01, 02…), ответы CUBE идут под запросом.",
      "Статус треда: «Ожидает ответа» (оранжевый) — последнее слово за заказчиком; «Отвечено» (зелёный) — ответили.",
      "На каждое сообщение система отправляет письмо второй стороне.",
    ] },
    { demo: "messages" },
    { h: "Публикация: черновик и версия заказчика" },
    { p: "Все правки сотрудника копятся как черновик. Заказчик видит последний опубликованный снимок. Когда есть неопубликованные правки — сверху баннер «Есть неопубликованные изменения» с кнопками «Опубликовать» и «Сбросить»." },
    { demo: "publish" },
    { note: "Переписка и выданные доступы всегда «живые» — они не ждут публикации, иначе новое сообщение заказчика было бы не видно.", noteTitle: "Важно" },
    { h: "Кто что видит" },
    { ul: [
      "Администратор и менеджер — все объекты и все инструменты.",
      "Исполнитель — свои объекты (где он ответственный или соисполнитель).",
      "Заказчик — только опубликованную версию своих объектов, без штатных инструментов.",
    ] },
    { h: "Объект и витрина «Проекты»" },
    { note: "«Объект» — рабочая карточка заказа внутри кабинета: статусы, этапы, документы, переписка с заказчиком. Публичная витрина работ на сайте ведётся отдельно, в модуле «Добавить проект» (Администрирование). Когда объект завершён, его имеет смысл вынести в витрину отдельной карточкой — с фото и данными для главной и страницы «Смотреть работы».", noteTitle: "Не путать с проектами" },
    { link: { label: "Перейти в «Объекты»", to: "/account/objects", sub: "Открыть реальный раздел и применить то, что попробовали." } },
  ],
  profile: [
    { p: "На вкладке «Профиль» пользователь заполняет и редактирует свои данные. Часть полей подтягивается автоматически и доступна только для чтения." },
    { h: "Поля" },
    { kv: [
      ["Логин", "только чтение — берётся из адреса профиля, не меняется"],
      ["Отображаемое имя", "обязательное (ФИО)"],
      ["Телефон", "необязательно"],
      ["Кто вы? (группа)", "обязательно: Заказчик / Пользователь / Исполнитель / Подрядчик / Проектировщик / Другое (Партнёр и Поставщик может назначить только админ)"],
      ["Организация", "автоподсказка по названию или ИНН (DaData)"],
      ["ИНН / КПП / Юр. адрес", "только чтение — подтягиваются по организации"],
      ["Город", "обязательно, выбор из списка"],
      ["Часовой пояс", "для корректного времени в переписке"],
      ["О себе", "необязательно"],
      ["Аватар", "изображение до 400 КБ, рекомендуется 400×400"],
    ] },
    { h: "Организация по ИНН — автозаполнение" },
    { p: "Не нужно вводить реквизиты руками. Начните вводить ИНН (10 или 12 цифр) — название организации, КПП и юридический адрес подтянутся из DaData автоматически и станут доступны только для чтения. То же самое работает в поле «Организация»: печатаете название — появляются подсказки." },
    { demo: "profile-fill" },
    { h: "Сохранение" },
    { p: "Кнопка «Сохранить изменения» — справа на десктопе (под формой на мобильном). Имя, группа и город обязательны." },
    { note: "Согласие «Свяжитесь со мной по электронной почте» — необязательная подписка на письма КУБ." },
  ],
  settings: [
    { p: "Вкладка «Настройки» — управление доступом и безопасностью аккаунта. Каждый блок сохраняется своей кнопкой." },
    { h: "Смена / добавление почты" },
    { p: "Укажите новый адрес и подтвердите текущим паролем. Вход остаётся по логину — почта нужна для уведомлений. На новый адрес приходит письмо со ссылкой подтверждения (действует 24 часа), письмо можно запросить повторно." },
    { h: "Смена пароля" },
    { ul: [
      "Нужны текущий пароль, новый и его повтор.",
      "Требования: минимум 6 символов, хотя бы одна заглавная буква и хотя бы один спецсимвол.",
      "После смены остальные сессии завершаются, текущая остаётся активной.",
    ] },
    { h: "Уведомления" },
    { p: "Переключатель подписки на письма КУБ о продуктах и услугах." },
    { h: "Безопасность — сессии" },
    { ul: [
      "Список устройств и браузеров, где выполнен вход, с временем последней активности.",
      "«Выйти» завершает конкретную сессию; «Выйти на всех устройствах» — везде, кроме текущей.",
    ] },
    { h: "Двухфакторная аутентификация (2FA)" },
    { steps: [
      "Нажмите «Подключить 2FA» — появится QR-код.",
      "Отсканируйте его в приложении-аутентификаторе (Google Authenticator, Яндекс.Ключ).",
      "Введите 6-значный код из приложения для подтверждения.",
      "Сохраните резервные коды на случай потери телефона.",
    ] },
    { p: "Отключение — по кнопке «Отключить 2FA» с подтверждением паролем." },
    { h: "Кнопки настроек — что делают" },
    { buttons: [
      { label: "Сменить пароль", variant: "dark", does: "Меняет пароль после ввода текущего.", then: "Пароль обновится, остальные сессии выйдут, текущая останется." },
      { label: "Подключить 2FA", variant: "light", does: "Включает вход по коду из приложения-аутентификатора.", then: "Появится QR-код и поле для 6-значного кода, затем резервные коды." },
      { label: "Выйти на всех устройствах", variant: "light", does: "Завершает все сессии, кроме текущей.", then: "На других устройствах потребуется войти заново." },
    ] },
    { h: "Опасная зона" },
    { note: "«Удалить учётную запись» — двухшаговое подтверждение. Пользователь навсегда теряет доступ к кабинету.", noteTitle: "Необратимо" },
  ],
  partners: [
    { h: "Группа ≠ право" },
    { p: "«Партнёр» и «Поставщик» — это группы (классификация контрагента), они не дают доступа сами по себе. Один и тот же человек может быть в группе, а доступ к разделу открывается отдельным правом." },
    { h: "Как открывается доступ" },
    { ul: [
      "Вкладка «Партнёр» видна при праве partners.view.",
      "Вкладка «Поставщик» видна при праве suppliers.view.",
      "Без права вкладка показана с замком и некликабельна (курсор обычный).",
      "Права выдаются ролью-пресетом или галочками в карточке сотрудника.",
    ] },
    { h: "Что внутри" },
    { p: "Список учётных записей соответствующей группы: открыть карточку, отредактировать (при праве accounts.manage), найти по имени, e-mail или телефону." },
  ],
  admin: [
    { p: "Раздел «Администратор» виден только пользователям с ролью «Администратор» и собирает все инструменты управления кабинетом." },
    { h: "Модули" },
    { kv: [
      ["Сотрудники", "штат компании: роли, права, назначение ответственных"],
      ["Учётные записи", "все зарегистрированные пользователи, роли и группы"],
      ["Создать учётную запись", "завести пользователя вручную (заказчика или контрагента)"],
      ["Файлы", "все файлы по всем объектам в одном списке"],
      ["Шаблоны объектов", "типы работ: префикс номера и типовые этапы"],
      ["Добавить проект", "витрина работ на сайте: карточки для главной и страницы «Смотреть работы»"],
      ["Справка", "эта документация по разделам кабинета"],
    ] },
    { note: "Не путайте «Объекты» и «Добавить проект»: первое — рабочие карточки заказов внутри кабинета, второе — публичная витрина готовых работ на сайте.", noteTitle: "Объекты ≠ проекты" },
  ],
  employees: [
    { p: "Сотрудник — это учётная запись со штатной ролью (Администратор, Менеджер, Исполнитель, Наблюдатель). Только сотрудника можно назначить ответственным за объект." },
    { h: "Как добавить" },
    { steps: [
      "Нажмите «+ Добавить сотрудника».",
      "Выберите учётную запись (если нужной нет — сначала создайте её в «Создать учётную запись»).",
      "Выберите роль и укажите должность (например «Инженер ПТО»).",
      "При необходимости уточните права галочками.",
      "Нажмите «Добавить сотрудника».",
    ] },
    { h: "Роли" },
    { kv: [
      ["Администратор", "полный доступ; отдельные права не настраиваются"],
      ["Менеджер", "объекты, документы, переписка, партнёры и поставщики"],
      ["Исполнитель", "свои объекты: правка, публикация, загрузка документов, ответы заказчику"],
      ["Наблюдатель", "только просмотр"],
    ] },
    { h: "Права галочками" },
    { ul: [
      "Список прав берётся из общего каталога и сгруппирован по разделам.",
      "Выбор роли заполняет галочки по пресету; можно докрутить вручную.",
      "Ручное отличие от роли помечается: «+ вручную» (добавлено) или «− снято» (убрано).",
      "«Сбросить к роли» возвращает пресет роли.",
      "У «Администратора» галочки скрыты — у него доступ ко всему.",
    ] },
    { demo: "perm" },
    { h: "Убрать из штата" },
    { note: "«Убрать» понижает учётку до заказчика — сотрудник перестаёт быть штатным, но сама учётная запись сохраняется (не удаляется). В списке сотрудников «Права» и «Убрать» на компьютере — кнопки, на телефоне — иконки в строке (карандаш и корзина)." },
    { link: { label: "Открыть «Сотрудники»", to: "/account/admin/employees", sub: "Управление штатом и правами." } },
  ],
  accounts: [
    { p: "Полный список пользователей кабинета. Есть поиск по имени и e-mail и фильтр по группе." },
    { p: "Ниже — точная копия этого раздела. Можно искать, открывать запись, менять группу и роль, удалять — всё как в настоящем кабинете, но без записи в базу. Потренируйтесь на примере." },
    { demo: "accounts-list" },
    { h: "Две оси: роль и группа" },
    { ul: [
      "Роль доступа — набор прав (Администратор, Менеджер, Исполнитель, Наблюдатель, Заказчик).",
      "Группа — классификация контрагента (Заказчик, Пользователь, Исполнитель, Подрядчик, Проектировщик, Другое, Поставщик, Партнёр). На права не влияет.",
    ] },
    { h: "Карточка учётки" },
    { ul: [
      "Доступ: группа и роль.",
      "Контакты: имя, телефон.",
      "Организация: название, ИНН (с автоподстановкой), КПП, адрес.",
      "«Сохранить изменения»; удаление учётки — в «опасной зоне».",
    ] },
    { note: "В списке учётных записей действия «Открыть» и «Удалить» на компьютере — текстовые кнопки, на телефоне — иконки в строке.", noteTitle: "На телефоне" },
    { link: { label: "Открыть «Учётные записи»", to: "/account/admin/accounts", sub: "Все пользователи кабинета." } },
  ],
  create: [
    { p: "Здесь заводят пользователя вручную и выдают доступ. Ниже — точная копия этого экрана: заполните поля и нажмите «Создать учётную запись». В справке ничего не записывается в базу — можно спокойно потренироваться перед реальной выдачей доступа." },
    { demo: "create-account" },
    { h: "Два способа входа" },
    { ul: [
      "По e-mail — адрес становится логином.",
      "По логину — отдельный логин, e-mail можно добавить позже.",
    ] },
    { h: "Поля" },
    { kv: [
      ["Имя", "ФИО или название"],
      ["Группа", "тип контрагента"],
      ["Пароль", "генерируется автоматически (временный); при первом входе пользователь задаёт свой"],
      ["Организация / ИНН", "необязательно; по ИНН (10 или 12 цифр) подтянутся КПП, адрес и название"],
    ] },
    { h: "После создания" },
    { p: "Показывается лист доступа с логином и временным паролем — передайте его пользователю безопасным каналом." },
    { link: { label: "Открыть «Создать учётную запись»", to: "/account/admin/create-account", sub: "Завести пользователя вручную." } },
  ],
  files: [
    { p: "Чтобы не искать документы по каждому объекту вручную, все файлы собраны в один список, сгруппированный по объектам." },
    { h: "Как устроено" },
    { ul: [
      "Сначала список объектов, у которых есть загруженные файлы: «Заказчик — Название», номер, статус, ИНН, город, ответственный.",
      "Панель фильтров: поиск (объект, заказчик, ИНН, город, файл) и фильтры по статусу, ответственному и городу.",
      "Клик по объекту открывает таблицу его файлов: документ, файл, тип, размер, дата, статус. Колонки сортируются кликом по заголовку. На телефоне вместо таблицы — карточки файлов с кнопкой скачивания.",
    ] },
    { h: "Скачивание" },
    { ul: [
      "«Скачать» — по одному файлу.",
      "«Скачать архивом» / «Архивом» — все файлы объекта одним ZIP (собирается в браузере, с индикатором прогресса).",
    ] },
    { note: "Показаны только реально загруженные файлы (в защищённом хранилище). Демо-документы без загрузки в список не попадают." },
    { link: { label: "Открыть «Файлы»", to: "/account/admin/files", sub: "Все документы по объектам в одном списке." } },
  ],
  templates: [
    { h: "Что задаёт шаблон" },
    { ul: [
      "Префикс номера объекта (например ELM → ELM-A1B2C3).",
      "Типовые этапы, которые подставятся в новый объект.",
    ] },
    { h: "Базовые и свои" },
    { ul: [
      "Есть базовые типы: Электромонтаж, ОВиК, Слаботочные системы, Проектирование, Обследование, Исполнительная, Фасадные работы, Свободный объект.",
      "Базовый можно отредактировать или скрыть; изменённый — вернуть кнопкой «Сбросить».",
      "«+ Новый шаблон» — свой тип: название, префикс (латиница и цифры) и список этапов.",
    ] },
    { p: "При создании объекта выбранный шаблон подставляет префикс в номер и наполняет список этапов." },
  ],
  projects: [
    { p: "«Добавить проект» — это витрина работ на публичном сайте (не путать с рабочими «Объектами» в кабинете). Отсюда наполняется блок «Проекты» на главной и страница «Смотреть работы»: каждая работа — это тёмная карточка с логотипом заказчика, фото объекта, городом, названием и годом." },
    { note: "«Объекты» — рабочие карточки для ведения заказа внутри кабинета (статусы, этапы, документы, переписка). «Проекты» — публичная витрина уже сделанного для сайта. Когда объект завершён, его имеет смысл вынести в витрину отдельной карточкой здесь.", noteTitle: "Объекты и проекты — не одно и то же" },
    { h: "Что где показывается" },
    { ul: [
      "Первые два проекта из списка едут на главную: верхний — слева (он «новее»), второй — справа.",
      "Все остальные показываются на странице «Смотреть работы» одинаковыми карточками.",
      "Новый проект через «+ Новый проект» встаёт наверх списка → слева на главной; прежний левый сдвигается вправо.",
    ] },
    { demo: "projects" },
    { h: "Как добавить проект" },
    { steps: [
      "Нажмите «+ Новый проект» (кнопка вверху справа; видна тем, у кого есть право «Добавлять проекты»).",
      "Загрузите логотип заказчика и снимки объекта — перетащите файлы в пунктирную зону или выберите вручную (как аватар в профиле). Снимки — это карусель на карточке; порядок и удаление — по наведению на миниатюру.",
      "Заполните данные карточки: город, крупное название объекта, заказчик, подпись услуг и число дней.",
      "Справа сразу виден живой предпросмотр карточки — ровно так она встанет на сайте.",
      "Нажмите «Добавить проект» — он появится в списке первым и слева на главной.",
    ] },
    { h: "Порядок, правка и удаление" },
    { ul: [
      "Порядок меняется перестановкой строк — как этапы в объекте (на компьютере — перетаскиванием за ручку ⠿, на телефоне — кнопками ↑/↓).",
      "«Изменить» и «Удалить» доступны в строке проекта: на компьютере — при наведении, на телефоне — постоянными иконками.",
      "«Сбросить к заводскому набору» возвращает два стартовых проекта (добавленные удаляются).",
    ] },
    { h: "Кто может" },
    { kv: [
      ["Добавлять проекты в витрину", "право projects.add — показывает кнопку «+ Новый проект»"],
      ["Редактировать и удалять проекты", "право projects.manage — включает перетаскивание, «Изменить» и «Удалить»"],
    ] },
    { note: "Права выдаются галочками в карточке сотрудника (раздел «Проекты (витрина)») или пресетом роли. У «Администратора» и «Менеджера» оба права есть по умолчанию.", noteTitle: "Права" },
    { link: { label: "Открыть «Добавить проект»", to: "/account/admin/projects", sub: "Управление витриной работ на сайте." } },
  ],
  "obj-customer": [
    { p: "Когда команда КУБ ведёт ваш объект, он появляется у вас в разделе «Объекты». Вы видите опубликованную версию — то, что команда подготовила и открыла именно для вас: текущий статус, прогресс по этапам, документы и переписку. Здесь же — вопросы к команде и уведомления по объекту: у вас всё крутится вокруг объекта, поэтому и собрано в нём." },
    { h: "Карточка объекта" },
    { ul: [
      "Заголовок: «Ваша организация — Название», номер объекта и текущий статус цветной пилюлей.",
      "Справа в шапке — две иконки: «История изменений по объекту» (три соединённые точки) и «Подписка на e-mail-уведомления» (квадрат со стрелкой). Никакого колокольчика у вас нет.",
      "Прогресс по этапам: сколько выполнено и что идёт прямо сейчас.",
      "«Что входит в этап» — детализация текущего этапа появляется, когда он «В работе».",
      "Документы — только те, что команда открыла для вас: можно открыть в просмотрщике и скачать (на телефоне — иконки в строке документа).",
      "Реестр «Коммуникация по объекту» и кнопка «Задать вопрос».",
      "Панель-док снизу с номером, статусом, прогрессом и mint-кнопкой «Задать вопрос» (на компьютере; на телефоне дока нет — кнопка «Задать вопрос» остаётся в самой карточке).",
    ] },
    { demo: "customer-object" },
    { h: "История изменений и статусы" },
    { p: "Иконка «История изменений» (три соединённые точки) в шапке объекта раскрывает ленту всего, что происходило: смены статуса объекта и этапов, открытые документы, ответы команды. Смены статуса отмечены отдельно — по ним видно, как объект двигался: «Черновик → В работе», этап «Не начат → В работе» и т. д." },
    { kv: [
      ["Статус объекта", "общее состояние: Черновик · В работе · Ожидает заказчика · Завершён · Архив."],
      ["Статус этапа", "у каждого этапа свой: Не начат · В работе · Завершён · На паузе · Ожидает заказчика."],
      ["Отметка в истории", "смена статуса подсвечивается — это ключевые события по объекту."],
    ] },
    { h: "Как задать вопрос" },
    { p: "Все вопросы задаются прямо в карточке объекта — не нужно писать на почту или искать контакты. Переписка привязана к объекту, поэтому команда сразу видит, о чём речь." },
    { steps: [
      "Нажмите «Задать вопрос» — внизу карточки или на mint-кнопке в доке.",
      "Напишите вопрос, при необходимости приложите файл кнопкой «Прикрепить файл».",
      "Отправьте — запросу присвоится номер (01, 02…), статус треда станет «Ожидает ответа».",
      "Когда команда ответит, ответ CUBE встанет под вашим запросом, статус сменится на «Отвечено», а вам придут уведомление и письмо на почту.",
    ] },
    { demo: "messages" },
    { h: "Как вы узнаёте об изменениях" },
    { p: "Не нужно постоянно проверять объект вручную — кабинет сам показывает, что нового. Сигналы одинаковые везде в кабинете:" },
    { ul: [
      "Морковная точка «новое» рядом с объектом в списке — по нему есть что посмотреть.",
      "Метка «New» на свежем документе, который команда только что открыла вам.",
      "Пульсирующая точка на mint-кнопке в доке снизу (на компьютере) — есть новое по этому объекту.",
      "Точка у иконки учётной записи в шапке сайта и у пункта «Объекты» в её меню.",
      "Письмо на электронную почту (если она указана в профиле). Иконка «Подписка на e-mail» (квадрат со стрелкой) в шапке объекта включает или выключает письма именно по нему.",
    ] },
    { demo: "notify" },
    { h: "Что видно, а что нет" },
    { ul: [
      "Вы видите только опубликованную версию. Пока команда готовит правки, у вас остаётся прежнее состояние — без «полуготовых» данных.",
      "Внутренние документы и черновики команды вам не показываются.",
      "А вот переписка и ответы приходят сразу — они не ждут публикации.",
    ] },
    { note: "На каждое сообщение система отправляет письмо второй стороне — ответ не потеряется, даже если вы не в кабинете.", noteTitle: "Важно" },
    { link: { label: "Перейти в «Объекты»", to: "/account/objects", sub: "Открыть свои объекты." } },
  ],
  notify: [
    { p: "Кабинет сам сообщает о важном — не нужно постоянно проверять объекты вручную. Оповещения приходят и заказчику, и команде, каждому о своём. Все сигналы завязаны на объект." },
    { h: "Где появляются уведомления" },
    { ul: [
      "Морковная точка «новое» рядом с объектом в списке — по нему есть новое.",
      "Метка «New» на свежих документах.",
      "Пульсирующая морковная точка на mint-кнопке в доке объекта (панель снизу на компьютере).",
      "Точка у иконки учётной записи в шапке сайта и у пункта «Объекты» в её меню.",
      "Письмо на электронную почту (если указана в профиле). У заказчика письма по объекту включает иконка «Подписка на e-mail» в шапке объекта; у сотрудника — колокол рядом с его именем в списке соисполнителей (в редакторе объекта).",
    ] },
    { note: "Отдельного «центра уведомлений» с колокольчиком-счётчиком нет — сигналы живут прямо на объектах, документах, в доке и у иконки учётной записи.", noteTitle: "Как это устроено" },
    { demo: "notify" },
    { h: "О чём приходят уведомления" },
    { kv: [
      ["Заказчику", "новый статус объекта, ответ на вопрос, новый открытый документ, запрос действия"],
      ["Команде", "новый вопрос от заказчика, подтверждение этапа заказчиком, загрузка документа исполнителем"],
    ] },
    { note: "Метки гаснут, когда вы открыли объект и просмотрели новое. «Прочитать всё» сбрасывает их сразу." },
  ],
};

/* Наш брендовый чекбокс (как «ознакомлен с политикой» в Contact.jsx): рамка + чёрный квадрат. */
function RefCheck({ on }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", height: 18, width: 18, borderRadius: 4, border: "1px solid #d9d9d9" }}>
      <span style={{ height: 10, width: 10, borderRadius: 3, background: "#111", transition: "transform .15s ease", transform: on ? "scale(1)" : "scale(0)" }} />
    </span>
  );
}
function ReferenceRoles({ onBack }) {
  const phone = useIsPhone();
  const [refTab, setRefTab] = React.useState("roles"); // roles | matrix | groups
  const [mRole, setMRole] = React.useState(0); // выбранная роль в мобильной матрице
  const roleSets = React.useMemo(() => REF_ROLES.map((r) => effectivePerms(r, null)), []);
  const secLbl = { fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 };

  const TabBtn = ({ id, children }) => (
    <button type="button" onClick={() => setRefTab(id)}
      style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 14,
        fontWeight: refTab === id ? 600 : 300, color: refTab === id ? TEXT : "#888",
        padding: "0 0 8px", borderBottom: refTab === id ? `2px solid ${TEXT}` : "2px solid transparent" }}>
      {children}
    </button>
  );
  const cell = (has) => (
    <td style={{ textAlign: "center", padding: "9px 6px", borderTop: "1px solid #eee" }}>
      <span style={{ display: "inline-flex" }}><RefCheck on={has} /></span>
    </td>
  );

  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={onBack} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К справке</button>
      <div style={{ marginTop: 14, fontSize: 22, fontWeight: 600, color: TEXT }}>Роли, группы и права</div>

      {/* Две оси — вводная */}
      <div style={{ marginTop: 12, maxWidth: 720, fontSize: 14, fontWeight: 300, lineHeight: 1.6, color: "#333" }}>
        Доступ описывают <b>две независимые оси</b>. <b>Роль</b> — что человек умеет в кабинете (набор прав);
        поле «Роль доступа». <b>Группа</b> — кто он как контрагент (Заказчик, Партнёр, Поставщик…); поле «Группа»,
        на права не влияет. Ещё есть <b>область</b>: право говорит «умеет править объекты», а какие именно —
        определяется участием (ответственный / соисполнитель). Администратор и Менеджер видят все объекты,
        Исполнитель — только свои.
      </div>

      {/* Табы */}
      <div style={{ marginTop: 22, display: "flex", gap: phone ? 16 : 20, borderBottom: "1px solid #eee" }}>
        <TabBtn id="roles">Роли</TabBtn>
        <TabBtn id="matrix">Права по ролям</TabBtn>
        <TabBtn id="groups">Группы</TabBtn>
      </div>

      {/* Роли */}
      {refTab === "roles" && (
        <div className="animate-svcfade" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
          {REF_ROLES.map((r) => (
            <div key={r} style={{ display: "flex", flexDirection: phone ? "column" : "row", gap: phone ? 2 : 14, alignItems: phone ? "stretch" : "baseline" }}>
              <div style={{ minWidth: phone ? 0 : 132, fontSize: 15, fontWeight: 500, color: TEXT }}>{ROLE_LABELS[r]}</div>
              <div style={{ fontSize: 14, fontWeight: 300, color: "#333" }}>{REF_ROLE_DESC[r]}</div>
            </div>
          ))}
          <div style={{ fontSize: 13, fontWeight: 300, color: "#888", marginTop: 4 }}>
            «Заказчик» — это «убрать из штата»: сотрудником он не считается.
          </div>
        </div>
      )}

      {/* Матрица прав × роли */}
      {refTab === "matrix" && (phone ? (
        /* Телефон: широкую таблицу не показываем — выбираем роль, ниже её права по группам */
        <div className="animate-svcfade" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REF_ROLES.map((r, i) => (
              <button key={r} type="button" onClick={() => setMRole(i)}
                style={{ border: mRole === i ? "1px solid " + TEXT : "1px solid #e0e0e0", background: mRole === i ? TEXT : "#fff",
                  color: mRole === i ? "#fff" : "#333", borderRadius: 999, padding: "7px 14px", fontFamily: UI, fontSize: 13,
                  fontWeight: mRole === i ? 600 : 300, cursor: "pointer" }}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            {Object.keys(PERMISSIONS).map((ns) => (
              <div key={ns} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: "#999", fontWeight: 600, marginBottom: 4 }}>
                  {PERM_GROUP_LABELS[ns] || ns}
                </div>
                {PERMISSIONS[ns].map(([perm, label]) => {
                  const has = roleSets[mRole].has(perm);
                  return (
                    <div key={perm} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #f0f0f0" }}>
                      <span style={{ display: "inline-flex", flexShrink: 0 }}><RefCheck on={has} /></span>
                      <span style={{ fontSize: 14, fontWeight: 300, color: has ? "#333" : "#bbb" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 300, color: "#888", marginTop: 4 }}>
            Пресеты можно докручивать поштучно в модуле «Сотрудники» (галочки поверх роли).
          </div>
        </div>
      ) : (
        <div className="animate-svcfade" style={{ marginTop: 18, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 760, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...secLbl, textAlign: "left", padding: "0 6px 10px" }}>Право</th>
                {REF_ROLES.map((r) => (
                  <th key={r} style={{ ...secLbl, textAlign: "center", padding: "0 6px 10px", width: 96 }}>{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(PERMISSIONS).map((ns) => (
                <React.Fragment key={ns}>
                  <tr>
                    <td colSpan={1 + REF_ROLES.length} style={{ padding: "14px 6px 4px", fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: "#999", fontWeight: 600 }}>
                      {PERM_GROUP_LABELS[ns] || ns}
                    </td>
                  </tr>
                  {PERMISSIONS[ns].map(([perm, label]) => (
                    <tr key={perm}>
                      <td style={{ padding: "9px 6px", borderTop: "1px solid #eee", fontWeight: 300, color: "#333" }}>{label}</td>
                      {roleSets.map((set, i) => (
                        <React.Fragment key={REF_ROLES[i]}>{cell(set.has(perm))}</React.Fragment>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 13, fontWeight: 300, color: "#888", marginTop: 12 }}>
            Пресеты можно докручивать поштучно в модуле «Сотрудники» (галочки поверх роли).
          </div>
        </div>
      ))}

      {/* Группы */}
      {refTab === "groups" && (
        <div className="animate-svcfade" style={{ marginTop: 18, maxWidth: 720 }}>
          <div style={{ fontSize: 14, fontWeight: 300, color: "#333", marginBottom: 14, lineHeight: 1.6 }}>
            Группа не даёт прав — это классификация контрагента. Разделы «Партнёры» и «Поставщики»
            в кабинете открываются <b>правами</b> (partners.view / suppliers.view), а не группой.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GROUPS.map((g) => (
              <span key={g.code} style={{ fontSize: 13, fontWeight: 300, color: "#222", border: "1px solid #e0e0e0", borderRadius: 999, padding: "6px 14px" }}>{g.label}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 58 }} />
    </div>
  );
}

function AdminReference({ customer = false }) {
  const [topicKey, setTopicKey] = React.useState(null); // null = список разделов справки
  // Заказчик (вкладка «Помощь») сразу попадает в «Кабинет заказчика» и режимы не
  // переключает — ему видна только своя справка. Команда/админ заходит в режиме «team».
  const [mode, setMode] = React.useState(customer ? "customer" : "team");

  const topic = topicKey ? REF_TOPICS.find((t) => t.key === topicKey) : null;
  // key+animate-svcfade — плавный переход список тем ↔ статья ↔ интерактив (house-стиль)
  if (topic && topic.interactive) return <div key={`ref-${topicKey}`} className="animate-svcfade"><ReferenceRoles onBack={() => setTopicKey(null)} /></div>;
  if (topic) return <div key={`ref-${topicKey}`} className="animate-svcfade"><ReferenceArticle topic={{ ...topic, body: REF_ARTICLES[topic.key] || [] }} onBack={() => setTopicKey(null)} /></div>;

  // Лендинг справки — темы выбранного режима, сгруппированные по категориям.
  const visible = REF_TOPICS.filter((t) => t.aud === "both" || t.aud === mode);
  const cats = [];
  for (const t of visible) { const c = cats.find((x) => x.cat === t.cat); if (c) c.items.push(t); else cats.push({ cat: t.cat, items: [t] }); }
  cats.sort((a, b) => REF_CAT_ORDER.indexOf(a.cat) - REF_CAT_ORDER.indexOf(b.cat));

  return (
    // Справка = единая читаемая колонка. Статьи внутри уже кэпятся maxWidth:760 (стр. ~2751);
    // лендинг тем раньше был во всю ширину — на iPad Pro (широкая одноколоночная раскладка ЛК)
    // строки-темы растягивались, а статьи — нет, из-за чего справка выглядела «не чётко».
    // Единый maxWidth:760 держит и лендинг, и статьи одной аккуратной колонкой (телефон/iPad Air
    // <760 — no-op, ширину не режет). Колонка левоприжата к краю шапки, как и формы ЛК.
    <div key="ref-landing" className="animate-svcfade" style={{ fontFamily: UI, marginTop: 8, maxWidth: 760 }}>
      <RefKeyframes />
      {customer ? null : (
        <button type="button" onClick={() => adminNav("/account/admin")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К модулям</button>
      )}
      <div style={{ marginTop: customer ? 0 : 14, fontSize: 22, fontWeight: 600, color: TEXT }}>Справка</div>
      {customer ? (
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777", maxWidth: 660, lineHeight: 1.6 }}>Как всё устроено в вашем кабинете. Темы с меткой «интерактивно» — живые макеты: кнопки, статусы, уведомления и переписку можно нажимать прямо здесь и видеть, что произойдёт.</div>
      ) : (
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777", maxWidth: 660, lineHeight: 1.6 }}>Два режима: как всё выглядит и работает у <b style={{ fontWeight: 500, color: "#444" }}>заказчика</b> и какие инструменты есть у <b style={{ fontWeight: 500, color: "#444" }}>команды</b>. Темы с меткой «интерактивно» — живые макеты: кнопки, статусы, уведомления и переписку можно нажимать прямо здесь и видеть, что произойдёт.</div>
      )}

      {customer ? null : (
        <div style={{ marginTop: 22, display: "flex", gap: 24, borderBottom: "1px solid #eee" }}>
          {[{ v: "customer", label: "Кабинет заказчика" }, { v: "team", label: "Кабинет команды" }].map((o) => (
            <button key={o.v} type="button" onClick={() => setMode(o.v)}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 15,
                fontWeight: mode === o.v ? 600 : 300, color: mode === o.v ? TEXT : "#888",
                padding: "0 0 10px", borderBottom: mode === o.v ? `2px solid ${TEXT}` : "2px solid transparent" }}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {cats.map((group) => (
        <div key={group.cat} style={{ marginTop: 30 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#999" }}>{group.cat}</div>
          <div style={{ marginTop: 12, borderTop: "1px dotted #ddd" }} />
          {group.items.map((t) => (
            <RefTopicRow key={t.key} title={t.title} sub={t.sub} badge={t.demo} onOpen={() => setTopicKey(t.key)} />
          ))}
        </div>
      ))}
      <div style={{ height: 58 }} />
    </div>
  );
}

/* Строка-раздел справки: наведение подсвечивает, стрелка справа. */
function RefTopicRow({ title, sub, onOpen, badge }) {
  const [h, setH] = React.useState(false);
  return (
    <>
      <div onClick={onOpen} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 8px", margin: "0 -8px", cursor: "pointer", background: h ? "rgba(0,0,0,.02)" : "transparent", transition: "background-color .14s ease" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{title}</div>
            {badge ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: ".03em", color: "#111", background: "#eee9df", borderRadius: 999, padding: "3px 9px" }}>
                <span className="ref-live" style={{ background: "#c0651f" }} />интерактивно
              </span>
            ) : null}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 300, color: "#777" }}>{sub}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1", flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ borderTop: "1px dotted #ddd" }} />
    </>
  );
}

/* Хук «это телефон» (matchMedia max-width:640) — тот же брейкпоинт, на котором
   в разделе «Объекты» включается мобильная раскладка (карточки этапов, иконки). */
function useIsPhone() {
  const [phone, setPhone] = React.useState(() => { try { return window.matchMedia("(max-width: 640px)").matches; } catch { return false; } });
  React.useEffect(() => {
    let mql; try { mql = window.matchMedia("(max-width: 640px)"); } catch { return; }
    const on = () => setPhone(mql.matches); on();
    mql.addEventListener ? mql.addEventListener("change", on) : mql.addListener(on);
    return () => { mql.removeEventListener ? mql.removeEventListener("change", on) : mql.removeListener(on); };
  }, []);
  return phone;
}

/* Хук «планшет и уже» (matchMedia max-width:1279) — тот же порог, на котором
   сам личный кабинет (isDesktop, ≥1280) переключается с фиксированной 3-колоночной
   раскладки на текучую. Модули админки (Файлы, Витрина) и их демо в справке
   на планшете (iPad Air 820, iPad Pro portrait 1024, 11" landscape 1194) должны
   отдавать мобильную раскладку, а не десктопную таблицу/строку. */
function useIsTabletDown() {
  const [v, setV] = React.useState(() => { try { return window.matchMedia("(max-width: 1279px)").matches; } catch { return false; } });
  React.useEffect(() => {
    let mql; try { mql = window.matchMedia("(max-width: 1279px)"); } catch { return; }
    const on = () => setV(mql.matches); on();
    mql.addEventListener ? mql.addEventListener("change", on) : mql.addListener(on);
    return () => { mql.removeEventListener ? mql.removeEventListener("change", on) : mql.removeListener(on); };
  }, []);
  return v;
}

/* Мини-иконки — точь-в-точь как действия в карточке объекта на телефоне. */
const RefMiniIcon = {
  open: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-8 8" /><path d="M3 21l8-8" /></svg>,
  download: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9m3.8-1.9A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2m-6.7-1.1a3 3 0 1 1-4.2-4.2" /><path d="M1 1l22 22" /></svg>,
  trash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>,
  arrowUp: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>,
  arrowDown: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}><path d="M6 15l6-6 6 6" /></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
};

/* Иконочная кнопка действия над документом (мобилка) — как DocIconBtn в объекте:
   мягкий серый значок без рамки, скруглённый ховер-фон. */
function RefDocIconBtn({ onClick, title, children, color = "#666", disabled = false }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} disabled={disabled}
      style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9, border: "none", background: h && !disabled ? "#f1f1f1" : "transparent", color: disabled ? "#d0d0d0" : color, cursor: disabled ? "default" : "pointer", padding: 0, transition: "background-color .15s ease" }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </button>
  );
}

/* Колонка перестановки для мобильных демо-этапов — точь-в-точь ReorderCol в объекте:
   две КРУПНЫЕ кнопки ↑/↓ во всю высоту карточки (на тач ⠿-перетаскивание не работает). */
function RefReorderBtn({ dir, disabled, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      aria-label={dir === "up" ? "Поднять этап" : "Опустить этап"}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ flex: 1, width: 44, minHeight: 34, border: "none", borderRadius: 10, padding: 0,
        background: disabled ? "#f7f7f7" : h ? "#e9e9e9" : "#f1f1f1",
        color: disabled ? "#d2d2d2" : "#555", cursor: disabled ? "default" : "pointer",
        display: "grid", placeItems: "center", transition: "background-color .15s ease" }}>
      {dir === "up" ? RefMiniIcon.arrowUp : RefMiniIcon.arrowDown}
    </button>
  );
}
function RefReorderCol({ onUp, onDown, upDisabled, downDisabled }) {
  return (
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
      <RefReorderBtn dir="up" disabled={upDisabled} onClick={onUp} />
      <RefReorderBtn dir="down" disabled={downDisabled} onClick={onDown} />
    </div>
  );
}

/* ===== Справка: рендерер статьи из блоков (данные в REF_ARTICLES) ===== */
function RefBlock({ b }) {
  const phone = useIsPhone();
  if (b.h) return <div style={{ marginTop: 28, fontSize: 16, fontWeight: 600, color: TEXT }}>{b.h}</div>;
  if (b.p != null) return <p style={{ marginTop: 12, fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: "#333" }}>{b.p}</p>;
  if (b.ul) return (
    <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
      {b.ul.map((it, i) => (
        <li key={i} style={{ position: "relative", paddingLeft: 20, fontSize: 14, fontWeight: 300, lineHeight: 1.6, color: "#333" }}>
          <span style={{ position: "absolute", left: 3, top: 9, width: 5, height: 5, borderRadius: 2, background: "#111" }} />
          {it}
        </li>
      ))}
    </ul>
  );
  if (b.steps) return (
    <ol style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
      {b.steps.map((it, i) => (
        <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, fontWeight: 300, lineHeight: 1.6, color: "#333" }}>
          <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 7, background: "#111", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: UI, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ display: "block", transform: "translateY(-0.5px)" }}>{i + 1}</span>
          </span>
          <span style={{ paddingTop: 1 }}>{it}</span>
        </li>
      ))}
    </ol>
  );
  if (b.kv) return (
    <div style={{ marginTop: 14 }}>
      {b.kv.map(([k, v], i) => (
        <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: phone ? "1px 0" : "2px 16px", padding: "10px 0", borderTop: i ? "1px dotted #e4e4e4" : "1px dotted #e4e4e4", fontSize: 14, lineHeight: 1.55 }}>
          <span style={{ flexShrink: 0, width: phone ? "100%" : 200, color: TEXT, fontWeight: 500 }}>{k}</span>
          <span style={{ flex: 1, minWidth: phone ? "100%" : 220, color: "#444", fontWeight: 300 }}>{v}</span>
        </div>
      ))}
    </div>
  );
  if (b.note) return (
    <div style={{ marginTop: 16, padding: "13px 16px", background: "#f4f4f4", borderRadius: 10, fontSize: 13.5, fontWeight: 300, lineHeight: 1.65, color: "#333" }}>
      {b.noteTitle ? <span style={{ fontWeight: 600, color: TEXT }}>{b.noteTitle}. </span> : null}{b.note}
    </div>
  );
  if (b.buttons) return <RefButtonGallery items={b.buttons} />;
  if (b.demo) return <RefDemo kind={b.demo} />;
  if (b.link) return <RefLink label={b.link.label} to={b.link.to} sub={b.link.sub} />;
  return null;
}

function ReferenceArticle({ topic, onBack }) {
  return (
    <div style={{ fontFamily: UI, marginTop: 8 }}>
      <RefKeyframes />
      <button type="button" onClick={onBack} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К справке</button>
      <div style={{ marginTop: 14, fontSize: 22, fontWeight: 600, color: TEXT }}>{topic.title}</div>
      {topic.sub ? <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777", maxWidth: 760, lineHeight: 1.6 }}>{topic.sub}</div> : null}
      <div style={{ maxWidth: 760 }}>
        {(topic.body || []).map((b, i) => <RefBlock key={i} b={b} />)}
      </div>
      <div style={{ height: 58 }} />
    </div>
  );
}

/* ===== Справка: интерактивные блоки (живые макеты в нашем стиле) ===== */
function RefKeyframes() {
  return (
    <style>{`
      @keyframes refPulse { 0%{box-shadow:0 0 0 0 rgba(17,17,17,.32)} 70%{box-shadow:0 0 0 9px rgba(17,17,17,0)} 100%{box-shadow:0 0 0 0 rgba(17,17,17,0)} }
      @keyframes refPop { from{opacity:0; transform:translateY(4px)} to{opacity:1; transform:none} }
      @keyframes refBlink { 0%,100%{opacity:1} 50%{opacity:.35} }
      @keyframes cubeNewPulse { 0%{box-shadow:0 0 0 0 rgba(250,93,41,.5)} 70%{box-shadow:0 0 0 6px rgba(250,93,41,0)} 100%{box-shadow:0 0 0 0 rgba(250,93,41,0)} }
      @keyframes cubeNewPop { from{opacity:0; transform:scale(.6)} to{opacity:1; transform:scale(1)} }
      @keyframes refDockBadge { 0%{box-shadow:0 0 0 0 rgba(250,93,41,.5)} 70%{box-shadow:0 0 0 6px rgba(250,93,41,0)} 100%{box-shadow:0 0 0 0 rgba(250,93,41,0)} }
      @keyframes refSlideR { from{opacity:0; transform:translateX(28px)} to{opacity:1; transform:translateX(0)} }
      @keyframes refHintBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      @keyframes refArrowNudge { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
      @keyframes refArrowNudgeL { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-4px)} }
      .ref-pop { animation: refPop .22s ease both; }
      .ref-drawer { animation: refSlideR .28s cubic-bezier(.2,.8,.2,1) both; }
      .ref-live { width:7px; height:7px; border-radius:2px; background:#111; display:inline-block; animation: refBlink 1.4s ease-in-out infinite; }
      .ref-coach { border-radius:9px; animation: refPulse 1.6s ease-out infinite; }
      .ref-hint { animation: refHintBob 1.5s ease-in-out infinite; }
      .ref-hint-arrow { animation: refArrowNudge 1.2s ease-in-out infinite; }
      .ref-hint-arrow-l { animation: refArrowNudgeL 1.2s ease-in-out infinite; }
    `}</style>
  );
}

/* Наша статус-пилюля (как в объектах): точка + подпись. */
function RefPill({ code }) {
  const s = (DB.OBJECT_STATUSES || []).find((x) => x.code === code) || { label: code, tone: "#999" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0, whiteSpace: "nowrap", fontSize: 12.5, fontWeight: 400, color: "#333" }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: s.tone, flexShrink: 0 }} />{s.label}
    </span>
  );
}

/* Рамка «Попробуйте» — пунктир, лейбл с живой точкой, кнопка сброса. */
function DemoFrame({ label, hint, onReset, children }) {
  const phone = useIsPhone();
  return (
    <div style={{ marginTop: 18, border: "1px dashed #d6d6d6", borderRadius: 14, background: "#fafafa", padding: phone ? 12 : 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#111" }}>
            <span className="ref-live" /> Попробуйте
          </span>
          {/* на десктопе подпись раздела идёт в ту же строку; на телефоне — отдельной строкой ниже, чтобы не переносилась посреди фразы */}
          {label && !phone ? <span style={{ fontSize: 13, fontWeight: 300, color: "#888" }}>· {label}</span> : null}
          {onReset ? (
            <button type="button" onClick={onReset} style={{ marginLeft: "auto", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 12.5, fontWeight: 300, color: "#888" }}>
              Сбросить
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 11a8 8 0 1 0-2 5.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M20 5v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : null}
        </div>
        {label && phone ? <div style={{ marginTop: 6, fontSize: 13, fontWeight: 300, color: "#888" }}>{label}</div> : null}
      </div>
      {children}
      {hint ? <div style={{ marginTop: 14, fontSize: 12, fontWeight: 300, color: "#a0a0a0", lineHeight: 1.5 }}>{hint}</div> : null}
    </div>
  );
}

/* Ссылка-кнопка на реальный раздел кабинета. */
function RefLink({ label, to, sub }) {
  return (
    <div style={{ marginTop: 16 }}>
      <FileHoverBtn variant="dark" onClick={() => adminNav(to)} style={{ height: 40, padding: "0 18px" }}>
        {label}
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </FileHoverBtn>
      {sub ? <div style={{ marginTop: 8, fontSize: 12, fontWeight: 300, color: "#a0a0a0" }}>{sub}</div> : null}
    </div>
  );
}

/* Галерея кнопок: показываем реальную кнопку, что делает и что произойдёт по клику. */
function RefButtonGallery({ items }) {
  return (
    <div style={{ marginTop: 16, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
      {items.map((b, i) => <RefGalleryItem key={i} b={b} />)}
    </div>
  );
}
function RefGalleryItem({ b }) {
  const [clicked, setClicked] = React.useState(false);
  return (
    <div style={{ border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <FileHoverBtn variant={b.variant || "light"} onClick={() => setClicked(true)} style={{ alignSelf: "flex-start" }}>{b.label}</FileHoverBtn>
      <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.5, color: "#444" }}>{b.does}</div>
      <div style={{ minHeight: 34, paddingTop: 10, borderTop: "1px dotted #ececec" }}>
        {clicked ? (
          <div key="r" className="ref-pop" style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, fontWeight: 300, lineHeight: 1.45, color: "#111" }}>
            <span style={{ flexShrink: 0, marginTop: 2, width: 15, height: 15, borderRadius: 4, background: "#111", display: "inline-grid", placeItems: "center" }}>
              <svg viewBox="0 0 24 24" width="10" height="10"><path d="M5 12l4 4L19 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            {b.then}
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 300, color: "#bcbcbc" }}>Нажмите кнопку выше ↑</div>
        )}
      </div>
    </div>
  );
}

/* Диспетчер именованных демо. */
/* Локальный «справочник» ИНН для демо-подстановки организации (без сети). */
const _REF_INN = {
  "7707083893": { org: "ПАО Сбербанк", kpp: "773601001", addr: "117312, г. Москва, ул. Вавилова, 19" },
  "7736050003": { org: "ПАО «Газпром»", kpp: "997250001", addr: "190900, г. Санкт-Петербург, наб. р. Мойки, 30" },
};
const _SHEET_ORANGE = "#F1571F";

/* ── Демо «Создать учётную запись» — точная копия экрана AdminCreateAccount:
   те же поля (способ входа, e-mail/логин, имя, группа, орг по ИНН, пароль + «↻ Другой»),
   та же кнопка. Без записи в базу и без навигации. После создания — те же логин/пароль
   и «Лист доступа» с QR (иллюстрация того, что печатают и отдают заказчику). ── */
function CreateAccountDemo() {
  const phone = useIsPhone();
  const narrow = useIsTabletDown(); // на планшете форму центрируем — как в реальном модуле
  const [mode, setMode] = React.useState("email");
  const [email, setEmail] = React.useState("");
  const [login, setLogin] = React.useState("");
  const [name, setName] = React.useState("");
  const [group, setGroup] = React.useState("customer");
  const [pwd, setPwd] = React.useState(() => genPassword());
  const [orgOn, setOrgOn] = React.useState(false);
  const [org, setOrg] = React.useState("");
  const [inn, setInn] = React.useState("");
  const [kpp, setKpp] = React.useState("");
  const [legalAddress, setLegalAddress] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [done, setDone] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);

  const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
  const loginOk = (l) => /^[a-zA-Z0-9._-]{3,32}$/.test(String(l).trim());
  const onInnChange = (v) => {
    setInn(v);
    const digits = String(v).replace(/\D/g, "");
    const m = _REF_INN[digits];
    if (m) { setOrg(m.org); setKpp(m.kpp); setLegalAddress(m.addr); }
    else if (digits.length === 10 || digits.length === 12) { setOrg("ООО «Ромашка»"); setKpp(digits.slice(0, 4) + "01001"); setLegalAddress("625000, г. Тюмень, ул. Республики, 1"); }
  };
  const submit = () => {
    const errs = {};
    const em = email.trim().toLowerCase();
    const lg = login.trim();
    if (mode === "email") { if (!emailOk(em)) errs.email = "Укажите корректный e-mail."; }
    else { if (!loginOk(lg)) errs.login = "Логин: 3–32 символа, латиница/цифры/._-"; if (em && !emailOk(em)) errs.email = "E-mail указан неверно (можно оставить пустым)."; }
    if (!name.trim()) errs.name = "Укажите имя или название.";
    if (!pwd || pwd.length < 8) errs.pwd = "Пароль слишком короткий.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setDone({ loginLabel: mode === "login" ? lg : em, password: pwd, byLogin: mode === "login" });
  };
  const copyCreds = async () => {
    try { await navigator.clipboard.writeText(`Личный кабинет cube-tech.ru\nЛогин: ${done.loginLabel}\nПароль: ${done.password}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const reset = () => { setMode("email"); setEmail(""); setLogin(""); setName(""); setGroup("customer"); setPwd(genPassword()); setOrgOn(false); setOrg(""); setInn(""); setKpp(""); setLegalAddress(""); setErrors({}); setDone(null); setCopied(false); setSheet(false); };
  const seg = (active) => ({ flex: 1, height: 40, borderRadius: 8, border: "none", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: active ? 500 : 300, background: active ? "#111" : "transparent", color: active ? "#fff" : "#555", transition: "background-color .15s ease, color .15s ease" });

  // Пошаговая подсказка: ведём стрелками до формирования QR. Активный шаг зависит от
  // того, что уже заполнено, — стрелка сама переходит к следующему полю/кнопке.
  const idFilled = mode === "email" ? emailOk(email) : loginOk(login);
  const nameFilled = !!name.trim();
  const step = !idFilled ? "id" : !nameFilled ? "name" : "submit";

  return (
    <DemoFrame label="создать учётную запись" onReset={reset}
      hint="Это точная копия экрана «Администратор → Создать учётную запись» — те же поля и кнопки, но без записи в базу. Заполните e-mail (или логин), имя и группу; пароль сгенерируется сам, «↻ Другой» — новый. Нажмите «Создать учётную запись» — покажем логин и пароль (их видно один раз) и «Лист доступа» с QR-кодом, который печатают и отдают заказчику.">
      {done ? (
        <div className="animate-svcfade">
          <div style={{ border: "1px solid #e6e6e6", borderRadius: 14, padding: 20, background: "#fff" }}>
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

          {/* Лист доступа — как на реальном экране: выбираете объект и формируете лист с QR */}
          <div style={{ marginTop: 22, borderTop: "1px solid #ececec", paddingTop: 20 }}>
            <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>Лист доступа</div>
            <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 300, color: "#666", lineHeight: 1.6 }}>Последний шаг — распечатать «Лист доступа» и отдать заказчику. Выберите объект и нажмите «Сформировать лист доступа»: логин, пароль и QR-код попадут на печатную страницу.</div>
            <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 300, color: "#888" }}>Объект:</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: TEXT, boxShadow: "inset 0 -1px 0 0 #d7d7d7", paddingBottom: 2 }}>KRT-02-2026 · Фасад, Ноябрьск</span>
              {!sheet ? <RefHintRight style={{ marginRight: 2 }}>шаг 4 — сформируйте QR</RefHintRight> : null}
              {!sheet ? <DarkTextBtn onClick={() => setSheet(true)}>Сформировать лист доступа</DarkTextBtn> : null}
            </div>
            {sheet ? <RefAccessSheet loginLabel={done.loginLabel} password={done.password} name={name || done.loginLabel} /> : null}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18, maxWidth: 520, ...(narrow ? { marginLeft: "auto", marginRight: "auto" } : null) }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 300, color: "#777", marginBottom: 8 }}>Способ входа</div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "#f3f3f3", borderRadius: 10 }}>
              <button type="button" onClick={() => setMode("email")} style={seg(mode === "email")}>По e-mail</button>
              <button type="button" onClick={() => setMode("login")} style={seg(mode === "login")}>По логину</button>
            </div>
          </div>
          {mode === "email" ? (
            <Field label={<RefStepLabel text="E-mail (логин)" hint={step === "id"} tip="шаг 1 — впишите e-mail" />} required error={errors.email}>
              <Input value={email} onChange={setEmail} placeholder="client@example.ru" error={errors.email} type="email" />
            </Field>
          ) : (
            <>
              <Field label={<RefStepLabel text="Логин" hint={step === "id"} tip="шаг 1 — впишите логин" />} required error={errors.login}><Input value={login} onChange={setLogin} placeholder="client-romashka" error={errors.login} /></Field>
              <Field label="E-mail" error={errors.email}><Input value={email} onChange={setEmail} placeholder="можно оставить пустым — заказчик добавит сам" error={errors.email} type="email" /></Field>
            </>
          )}
          <Field label={<RefStepLabel text="Имя или название" hint={step === "name"} tip="шаг 2 — имя или название" />} required error={errors.name}><Input value={name} onChange={setName} placeholder="ООО «Ромашка» / Иван Петров" error={errors.name} /></Field>
          <Field label="Группа" error={errors.group}><GroupSelect value={group} onChange={setGroup} error={errors.group} /></Field>
          <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setOrgOn((v) => !v)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }} aria-pressed={orgOn}><Square checked={orgOn} /></button>
              <span style={{ fontSize: 14, fontWeight: 300, color: "#222" }}>Подтянуть организацию по ИНН <span style={{ color: "#999" }}>— необязательно</span></span>
            </div>
            {orgOn ? (
              <div className="animate-svcfade" style={{ marginTop: 14, display: "grid", gap: 14 }}>
                <Field label="Организация"><Input value={org} onChange={setOrg} placeholder="Название организации" /></Field>
                <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 1fr", gap: phone ? 14 : 12 }}>
                  <Field label="ИНН"><Input value={inn} onChange={onInnChange} placeholder="Введите ИНН — данные подтянутся" /></Field>
                  <Field label="КПП"><Input value={kpp} onChange={setKpp} placeholder="—" /></Field>
                </div>
                <Field label="Юридический адрес"><Input value={legalAddress} onChange={setLegalAddress} placeholder="—" /></Field>
                <div style={{ fontSize: 12, fontWeight: 300, color: "#999", lineHeight: 1.5 }}>Эти данные подставятся в объект, когда вы выберете этого заказчика.</div>
              </div>
            ) : null}
          </div>
          <Field label="Пароль" required error={errors.pwd}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}><Input value={pwd} onChange={setPwd} error={errors.pwd} /></div>
              <button type="button" onClick={() => setPwd(genPassword())} title="Сгенерировать новый"
                style={{ height: FIELD_H, padding: "0 18px", borderRadius: 10, border: "none", background: "#1c1c1c", color: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, whiteSpace: "nowrap" }}>↻ Другой</button>
            </div>
          </Field>
          {errors.form ? <div style={{ fontSize: 13, color: ERR }}>{errors.form}</div> : null}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {step === "submit" ? <RefHintRight style={{ marginRight: 2 }}>шаг 3 — нажмите</RefHintRight> : null}
            <DarkTextBtn onClick={submit}>Создать учётную запись</DarkTextBtn>
          </div>
        </div>
      )}
    </DemoFrame>
  );
}

/* Мини-превью печатного «Листа доступа» (КУБ-ЛК-01): как выглядит страница с QR,
   которую отдают заказчику. Реальный лист формируется компонентом AccessSheet.jsx. */
function RefAccessSheet({ loginLabel, password, name }) {
  const phone = useIsPhone();
  const infoLbl = { fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#888", flexShrink: 0, width: phone ? 92 : 110 };
  const InfoRow = ({ label, value, accent }) => (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: "1px solid #eee" }}>
      <span style={infoLbl}>{label}</span>
      <span style={{ minWidth: 0, fontSize: 13, fontWeight: accent ? 700 : 400, color: accent ? _SHEET_ORANGE : TEXT, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
  return (
    <div className="ref-pop" style={{ marginTop: 16, border: "1px solid #ececec", borderRadius: 14, overflow: "hidden", background: "#fff", maxWidth: 480 }}>
      {/* Шапка как в реальном листе: марка «C.» + «Документ для заказчика» слева, реквизиты ООО «КУБ» справа */}
      <div style={{ padding: phone ? "14px 16px 0" : "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, letterSpacing: "-.02em", color: "#111", flexShrink: 0 }}>C<span style={{ color: "#111" }}>.</span></span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#8a8a8a" }}>Документ<br />для заказчика</span>
          </div>
          <div style={{ textAlign: "right", lineHeight: 1.45 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT }}>ООО «КУБ»</div>
            <div style={{ fontSize: 9.5, color: "#999" }}>ИНН 8905070217</div>
            {!phone ? <div style={{ fontSize: 9.5, color: "#999" }}>info@cube-tech.ru</div> : null}
            <div style={{ fontSize: 9.5, color: "#999" }}>cube-tech.ru</div>
          </div>
        </div>
        <div style={{ height: 2.5, background: _SHEET_ORANGE, borderRadius: 2, marginTop: 12 }} />
      </div>

      {/* Центрованный заголовок */}
      <div style={{ textAlign: "center", padding: "14px 16px 0" }}>
        <div style={{ fontSize: phone ? 20 : 23, fontWeight: 800, letterSpacing: ".01em", lineHeight: 1, color: TEXT }}>ЛИСТ ДОСТУПА</div>
        <div style={{ fontSize: phone ? 12 : 13, fontWeight: 700, color: "#3a3a3a", marginTop: 3 }}>К ЛИЧНОМУ КАБИНЕТУ ОБЪЕКТА</div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9a9a", marginTop: 6 }}>QR-код · Учётная запись · Документы</div>
      </div>

      {/* Данные объекта */}
      <div style={{ padding: phone ? "14px 16px 0" : "16px 20px 0" }}>
        <InfoRow label="Заказчик" value={name} />
        <InfoRow label="Объект №" value="KRT-02-2026" accent />
        <InfoRow label="Наименование" value="Фасад" />
        <InfoRow label="Адрес" value="Ноябрьск" />
      </div>

      {/* Данные для входа + QR */}
      <div style={{ padding: phone ? "16px 16px 0" : "18px 20px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".01em", color: TEXT }}>ДАННЫЕ ДЛЯ ВХОДА</div>
        <div style={{ marginTop: 10, display: "flex", gap: 16, alignItems: "flex-start", flexDirection: phone ? "column" : "row" }}>
          <div style={{ flex: 1, minWidth: 0, width: phone ? "100%" : undefined, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}><span style={{ color: "#888" }}>Имя учётной записи</span><span style={{ color: TEXT, fontWeight: 500, wordBreak: "break-word", textAlign: "right" }}>{name}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}><span style={{ color: "#888" }}>Логин</span><span style={{ color: TEXT, fontWeight: 700, fontFamily: "ui-monospace,Menlo,monospace", wordBreak: "break-word", textAlign: "right" }}>{loginLabel}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, background: "#fff3ee", borderRadius: 6, padding: "6px 10px" }}><span style={{ color: "#888" }}>Временный пароль</span><span style={{ color: _SHEET_ORANGE, fontWeight: 700, fontFamily: "ui-monospace,Menlo,monospace" }}>{password}</span></div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0, alignSelf: phone ? "center" : "flex-start" }}>
            <RefQR />
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 400, color: "#999" }}>Наведите камеру<br />на QR-код</div>
          </div>
        </div>
      </div>

      {/* Как войти */}
      <div style={{ padding: phone ? "16px 16px 0" : "18px 20px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".01em", color: TEXT, marginBottom: 8 }}>КАК ВОЙТИ</div>
        <div style={{ display: "grid", gap: 6 }}>
          {[["01", "Отсканируйте QR-код камерой телефона."], ["02", "Войдите по логину и временному паролю."], ["03", "Откроется ваш объект — статус, этапы и документы."]].map(([n, t]) => (
            <div key={n} style={{ display: "flex", gap: 10, fontSize: 12.5, fontWeight: 300, color: "#555" }}>
              <span style={{ fontWeight: 700, color: _SHEET_ORANGE, flexShrink: 0 }}>{n}</span>{t}
            </div>
          ))}
        </div>
      </div>

      {/* Важно + подвал */}
      <div style={{ margin: phone ? "16px 16px 0" : "18px 20px 0", background: "#f6f6f6", borderLeft: `3px solid ${_SHEET_ORANGE}`, padding: "10px 12px" }}>
        <div style={{ fontSize: 11, lineHeight: 1.45, color: "#333" }}><span style={{ color: _SHEET_ORANGE, fontWeight: 700 }}>ВАЖНО. </span>QR-код ведёт только на страницу объекта и не содержит пароль. Не пересылайте документ третьим лицам.</div>
      </div>
      <div style={{ marginTop: 14, borderTop: "1px solid #eee", padding: "8px 16px", display: "flex", justifyContent: "space-between", fontSize: 8.5, letterSpacing: ".08em", textTransform: "uppercase", color: "#b0b0b0" }}>
        <span>Форма КУБ-ЛК-01</span><span>Лист 1 из 1</span>
      </div>
    </div>
  );
}
/* Иллюстрация QR-кода (фиксированный узор, без генерации) — только для наглядности. */
function RefQR() {
  const P = ["111111100111", "100000101101", "101110100011", "101110101110", "101110100101", "100000100011", "111111101010", "000000001100", "110101110111", "011010100010", "101101011101", "100110101011"];
  const c = 7;
  return (
    <svg width={12 * c} height={12 * c} viewBox={`0 0 ${12 * c} ${12 * c}`} style={{ border: "1px solid #eee", borderRadius: 6 }} aria-hidden="true">
      <rect width={12 * c} height={12 * c} fill="#fff" />
      {P.flatMap((row, y) => row.split("").map((v, x) => (v === "1" ? <rect key={x + "-" + y} x={x * c} y={y * c} width={c} height={c} fill="#111" /> : null)))}
    </svg>
  );
}

/* ── Демо «Учётные записи» — точная копия раздела администратора: поиск, строки
   (имя, e-mail, «Группа · Роль»), «Открыть»/«Удалить». Открытие — карточка с теми же
   полями (группа/роль, контакт, организация, сохранить, удалить). Без сети. ── */
const _REF_USERS = [
  { id: "u1", name: "ООО «КРТ»", email: "krt@example.ru", phone: "", group: "customer", role: "customer", org: "ООО «КРТ»", inn: "7701234567", kpp: "770101001", legalAddress: "г. Москва, ул. Тверская, 1" },
  { id: "u2", name: "Иван Петров", email: "i.petrov@mail.ru", phone: "+7 900 120-45-67", group: "customer", role: "customer", org: "", inn: "", kpp: "", legalAddress: "" },
  { id: "u3", name: "Строймонтаж-Групп", email: "info@strm-group.ru", phone: "", group: "contractor", role: "viewer", org: "ООО «Строймонтаж-Групп»", inn: "5407891234", kpp: "540701001", legalAddress: "г. Новосибирск, Красный пр., 20" },
  { id: "u4", name: "Анна Сидорова", email: "sidorova@cube-tech.ru", phone: "+7 902 333-11-22", group: "user", role: "executor", org: "", inn: "", kpp: "", legalAddress: "" },
];
function AccountsListDemo() {
  const phone = useIsPhone();
  const [users, setUsers] = React.useState(_REF_USERS);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(null);
  const reset = () => { setUsers(_REF_USERS); setQ(""); setOpen(null); };
  const ql = q.trim().toLowerCase();
  const filtered = users.filter((u) => !ql || [u.name, u.email, u.phone].some((f) => String(f || "").toLowerCase().includes(ql)));
  const delNow = (u) => { setUsers((p) => p.filter((x) => x.id !== u.id)); setOpen(null); };
  // Из списка удаление — через тот же модальный confirmDialog, что и в боевом разделе.
  const delFromList = async (u) => { if (await confirmDialog({ title: "Удалить учётную запись?", message: `Учётная запись «${u.name || u.email}» будет удалена. Действие необратимо.`, confirmText: "Удалить" })) delNow(u); };

  return (
    <DemoFrame label="учётные записи" onReset={reset}
      hint="Это точная копия раздела «Администратор → Учётные записи». Здесь виден каждый пользователь кабинета: имя, e-mail, группа и роль. Поиск сверху фильтрует список. «Открыть» — карточка с данными, где можно сменить группу или роль доступа. «Удалить» — убирает доступ (в справке трогается только этот пример).">
      {open ? (
        <RefAccountDetail user={open} onBack={() => setOpen(null)} onDelete={() => delNow(open)} />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 14, padding: phone ? "14px 13px" : "18px 20px" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: TEXT }}>Зарегистрированные учётные записи</div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 300, color: "#777" }}>Нажмите на запись — посмотреть данные, изменить группу/роль или удалить.</div>
          <div style={{ marginTop: 16 }}><UnderSearch value={q} onChange={setQ} placeholder="Поиск по имени, e-mail или телефону…" /></div>
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 12, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>
              <span>Учётные записи</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>Всего: {String(filtered.length).padStart(2, "0")}</span>
            </div>
            <AcctDotted />
            {filtered.length === 0 ? (
              <div style={{ padding: "24px 8px", color: "#777", fontSize: 14, fontWeight: 300 }}>Ничего не найдено.</div>
            ) : filtered.map((u, i) => (
              <RefAcctRow key={u.id} u={u} onOpen={() => setOpen(u)} onDelete={() => delFromList(u)} hint={i === 0} />
            ))}
          </div>
        </div>
      )}
    </DemoFrame>
  );
}
function RefAcctRow({ u, onOpen, onDelete, hint }) {
  const [h, setH] = React.useState(false);
  const phone = useIsPhone();
  const roleLabel = ROLE_LABEL[String(u.role || "customer").toLowerCase()] || ROLE_LABELS.customer;
  return (
    <>
      <div onClick={onOpen} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 8px", margin: "0 -8px", cursor: "pointer", background: h ? "rgba(0,0,0,.02)" : "transparent", transition: "background-color .14s ease" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{u.name || "Без имени"}</div>
          <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: "#777" }}>{u.email || "—"}{u.phone ? <span> · {u.phone}</span> : null}</div>
          <div style={{ marginTop: 8, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 400, color: "#888", lineHeight: 1.5 }}>
            Группа: {labelByCode(toCode(u.group)) || "—"}{" · "}Роль: {roleLabel}{u.inn ? ` · ИНН ${u.inn}` : ""}
          </div>
        </div>
        <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: phone ? 2 : 8, flexShrink: 0 }}>
          {hint ? <RefHintRight style={{ marginRight: 2 }}>{phone ? "нажмите" : "нажмите — открыть"}</RefHintRight> : null}
          {phone ? (
            <>
              <RefDocIconBtn title="Открыть" onClick={onOpen}>{RefMiniIcon.open}</RefDocIconBtn>
              <RefDocIconBtn title="Удалить" color="#fa5d29" onClick={onDelete}>{RefMiniIcon.trash}</RefDocIconBtn>
            </>
          ) : (
            <>
              <AcctAction onClick={onOpen}>Открыть</AcctAction>
              <AcctAction accent onClick={onDelete}>Удалить</AcctAction>
            </>
          )}
        </div>
      </div>
      <AcctDotted />
    </>
  );
}
function RefAccountDetail({ user, onBack, onDelete }) {
  const narrow = useIsPhone();
  const [name, setName] = React.useState(user.name || "");
  const [phone, setPhone] = React.useState(user.phone || "");
  const [group, setGroup] = React.useState(toCode(user.group || "user"));
  const [role, setRole] = React.useState(normRole(user.role));
  const [org, setOrg] = React.useState(user.org || "");
  const [inn, setInn] = React.useState(user.inn || "");
  const [kpp, setKpp] = React.useState(user.kpp || "");
  const [legalAddress, setLegalAddress] = React.useState(user.legalAddress || "");
  const [saved, setSaved] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const onInnChange = (v) => { setInn(v); const d = String(v).replace(/\D/g, ""); const m = _REF_INN[d]; if (m) { setOrg(m.org); setKpp(m.kpp); setLegalAddress(m.addr); } };
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const secLbl = { fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300, marginBottom: 12 };
  return (
    <div style={{ fontFamily: UI }}>
      <button type="button" onClick={onBack} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К учётным записям</button>
      <div style={{ marginTop: 12, fontSize: 20, fontWeight: 600, color: TEXT }}>{name || user.name || "Учётная запись"}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>{user.email || "без e-mail"}</div>
      <div style={{ marginTop: 22, maxWidth: 560, display: "grid", gap: 18 }}>
        <div>
          <div style={secLbl}>Доступ</div>
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 14 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 14 }}>
              <Field label="ИНН"><Input value={inn} onChange={onInnChange} placeholder="Введите ИНН — данные подтянутся" /></Field>
              <Field label="КПП"><Input value={kpp} onChange={setKpp} placeholder="—" /></Field>
            </div>
            <Field label="Юридический адрес"><Input value={legalAddress} onChange={setLegalAddress} placeholder="—" /></Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <DarkTextBtn onClick={save}>Сохранить изменения</DarkTextBtn>
          {saved ? <span style={{ fontSize: 13, color: "#3a8a3a" }}>Сохранено ✓</span> : null}
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
                <button type="button" onClick={onDelete} style={{ height: 44, padding: "0 18px", borderRadius: 10, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400 }}>Удалить навсегда</button>
                <button type="button" onClick={() => setConfirmDel(false)} style={{ height: 44, padding: "0 18px", borderRadius: 10, border: "1px solid #d9d9d9", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, color: TEXT }}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RefDemo({ kind }) {
  if (kind === "publish") return <PublishDemo />;
  if (kind === "filter") return <FilterDemo />;
  if (kind === "stages") return <StagesDemo />;
  if (kind === "projects") return <ProjectsAdminDemo />;
  if (kind === "perm") return <PermDemo />;
  if (kind === "messages") return <MessagesDemo />;
  if (kind === "notify") return <NotifyDemo />;
  if (kind === "profile-fill") return <ProfileFillDemo />;
  if (kind === "team") return <TeamDemo />;
  if (kind === "stage-edit") return <StageEditDemo />;
  if (kind === "customer-object") return <CustomerObjectDemo />;
  if (kind === "create-account") return <CreateAccountDemo />;
  if (kind === "accounts-list") return <AccountsListDemo />;
  return null;
}

/* Демо: черновик сотрудника vs опубликованная версия заказчика. */
const _PUB_CYCLE = ["draft", "in_progress", "waiting_customer", "done"];
function PublishDemo() {
  const [pub, setPub] = React.useState("draft");
  const [draft, setDraft] = React.useState("draft");
  const [view, setView] = React.useState("staff");
  const [touched, setTouched] = React.useState(false);
  const dirty = pub !== draft;
  const cycle = () => { const i = _PUB_CYCLE.indexOf(draft); setDraft(_PUB_CYCLE[(i + 1) % _PUB_CYCLE.length]); setTouched(true); };
  const reset = () => { setPub("draft"); setDraft("draft"); setView("staff"); setTouched(false); };

  const seg = (v, label) => (
    <button type="button" onClick={() => setView(v)}
      style={{ border: "none", background: view === v ? "#111" : "transparent", color: view === v ? "#fff" : "#666", fontFamily: UI, fontSize: 12.5, fontWeight: 400, padding: "7px 14px", borderRadius: 8, cursor: "pointer", transition: "background-color .15s ease, color .15s ease" }}>
      {label}
    </button>
  );

  return (
    <DemoFrame label="публикация" onReset={reset}
      hint="Сотрудник меняет статус — заказчик видит прежнюю версию, пока вы не нажмёте «Опубликовать». «Сбросить» откатывает черновик к опубликованному.">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* баннер публикации */}
        {dirty ? (
          <div key="dirty" className="ref-pop" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff5ec", border: "1px solid #f6d9bf", color: "#b5560f", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 400 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#dd7a1f" }} />Есть неопубликованные изменения
          </div>
        ) : (
          <div key="clean" className="ref-pop" style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "#2f855a", fontSize: 13, fontWeight: 400 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#2f855a" }} />Опубликовано
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className={!touched ? "ref-coach" : undefined} style={{ borderRadius: 9 }}>
            <FileHoverBtn onClick={cycle}>Изменить статус</FileHoverBtn>
          </span>
          <FileHoverBtn variant="dark" disabled={!dirty} onClick={() => setPub(draft)}>Опубликовать</FileHoverBtn>
          <FileHoverBtn disabled={!dirty} onClick={() => setDraft(pub)}>Сбросить</FileHoverBtn>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "inline-flex", gap: 4, background: "#ededed", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
        {seg("staff", "Глазами сотрудника")}
        {seg("customer", "Глазами заказчика")}
      </div>

      <div style={{ marginTop: 14, border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 300, color: "#999" }}>ООО «КРТ» — Фасад, Ноябрьск</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>Статус:</span>
          <RefPill code={view === "staff" ? draft : pub} />
          {view === "staff" && dirty ? <span style={{ fontSize: 11.5, fontWeight: 400, color: "#dd7a1f" }}>· черновик, ещё не опубликован</span> : null}
          {view === "customer" && dirty ? <span style={{ fontSize: 11.5, fontWeight: 400, color: "#999" }}>· заказчик видит прошлую версию</span> : null}
        </div>
      </div>
    </DemoFrame>
  );
}

/* Демо: живой фильтр по объектам (та же панель, что в кабинете). */
const _FILTER_ROWS = [
  { id: "KRT-02-2026", name: "ООО «КРТ» — Фасад, Ноябрьск", status: "in_progress", resp: "Иванов И.", city: "Ноябрьск" },
  { id: "AKB-01-2026", name: "АО «АКБ» — Слаботочка, Тюмень", status: "waiting_customer", resp: "Петров П.", city: "Тюмень" },
  { id: "MSK-07-2026", name: "ООО «Меркурий» — ОВиК, Москва", status: "done", resp: "Иванов И.", city: "Москва" },
  { id: "SPB-03-2026", name: "ООО «Нева» — Проект, Санкт-Петербург", status: "draft", resp: "Сидорова А.", city: "Санкт-Петербург" },
  { id: "TMN-05-2026", name: "ИП Ковалёв — Обследование, Тюмень", status: "in_progress", resp: "Петров П.", city: "Тюмень" },
];
function FilterDemo() {
  const [q, setQ] = React.useState("");
  const [fStatus, setFStatus] = React.useState("");
  const [fResp, setFResp] = React.useState("");
  const [fCity, setFCity] = React.useState("");
  const resps = [...new Set(_FILTER_ROWS.map((r) => r.resp))];
  const cities = [...new Set(_FILTER_ROWS.map((r) => r.city))];
  const s = q.trim().toLowerCase();
  const rows = _FILTER_ROWS.filter((r) =>
    (!s || `${r.name} ${r.id}`.toLowerCase().includes(s)) &&
    (!fStatus || r.status === fStatus) && (!fResp || r.resp === fResp) && (!fCity || r.city === fCity));
  const activeCount = [s, fStatus, fResp, fCity].filter(Boolean).length;
  const reset = () => { setQ(""); setFStatus(""); setFResp(""); setFCity(""); };
  return (
    <DemoFrame label="фильтры" hint="Печатайте в поиске или выбирайте фильтры — список объектов сузится сразу. Счётчик показывает число активных условий.">
      <FilterBar
        search={{ value: q, onChange: setQ, placeholder: "Поиск по объектам…" }}
        filters={[
          { value: fStatus, onChange: setFStatus, width: 170, placeholder: "Статус", options: [{ value: "", label: "Все статусы" }, ...(DB.OBJECT_STATUSES || []).map((x) => ({ value: x.code, label: x.label, dotColor: x.tone }))] },
          { value: fResp, onChange: setFResp, width: 180, placeholder: "Ответственный", options: [{ value: "", label: "Все ответственные" }, ...resps.map((r) => ({ value: r, label: r }))] },
          { value: fCity, onChange: setFCity, width: 150, placeholder: "Город", options: [{ value: "", label: "Все города" }, ...cities.map((c) => ({ value: c, label: c }))] },
        ]}
        activeCount={activeCount} onReset={reset}
      />
      <div style={{ marginTop: 14, border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
        {rows.length ? rows.map((r, i) => (
          <div key={r.id} className="ref-pop" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? "1px dotted #ececec" : "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 400, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 300, color: "#aaa" }}>{r.id} · {r.resp} · {r.city}</div>
            </div>
            <RefPill code={r.status} />
          </div>
        )) : (
          <div style={{ padding: "18px 16px", fontSize: 13, fontWeight: 300, color: "#aaa" }}>Ничего не найдено — смягчите фильтры.</div>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 300, color: "#aaa" }}>Показано {rows.length} из {_FILTER_ROWS.length}.</div>
    </DemoFrame>
  );
}

/* Демо: этапы — клик по этапу меняет статус, прогресс пересчитывается. */
const _STAGE_CYCLE = [
  { code: "not_started", label: "Не начат", tone: "#cfcfcf" },
  { code: "in_progress", label: "В работе", tone: "#2b6cb0" },
  { code: "done", label: "Завершён", tone: "#2f855a" },
];
function StagesDemo() {
  const START = ["done", "in_progress", "not_started", "not_started"];
  const NAMES = ["Выезд и обследование", "Обработка данных", "Отчёт по обследованию", "Согласование с заказчиком"];
  const [st, setSt] = React.useState(START);
  const bump = (i) => setSt((prev) => prev.map((c, j) => { if (j !== i) return c; const k = _STAGE_CYCLE.findIndex((x) => x.code === c); return _STAGE_CYCLE[(k + 1) % _STAGE_CYCLE.length].code; }));
  const doneN = st.filter((c) => c === "done").length;
  const pct = Math.round((doneN / st.length) * 100);
  return (
    <DemoFrame label="этапы" onReset={() => setSt(START)}
      hint="Кликните по этапу — статус переключится (Не начат → В работе → Завершён), а прогресс сверху пересчитается.">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#e6e6e6", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#111", borderRadius: 999, transition: "width .3s ease" }} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: TEXT }}>{pct}%</span>
      </div>
      <div style={{ marginTop: 14, border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
        {st.map((code, i) => {
          const s = _STAGE_CYCLE.find((x) => x.code === code);
          return (
            <button key={i} type="button" onClick={() => bump(i)}
              style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", border: "none", borderTop: i ? "1px dotted #ececec" : "none", background: "transparent", cursor: "pointer", fontFamily: UI }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,.02)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <span style={{ flexShrink: 0, width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
              <span style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: code === "not_started" ? "#fff" : s.tone, border: `2px solid ${code === "not_started" ? "#d0d0d0" : s.tone}` }} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 400, color: TEXT }}>{NAMES[i]}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 400, color: "#444" }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: s.tone, transition: "background-color .2s ease" }} />{s.label}
              </span>
            </button>
          );
        })}
      </div>
    </DemoFrame>
  );
}

/* Демо: витрина проектов — перетаскивание меняет, кто попадёт на главную.
   Тащим строку за ⠿ (как этапы объекта); первые два едут на главную (слева/справа),
   остальные — на страницу «Смотреть работы». Наглядно показываем ротацию. */
const _PRJ_SEED = [
  { id: "p1", obj: "Учебный центр", cust: "Газпром нефть", city: "Ноябрьск", year: "2025" },
  { id: "p2", obj: "Мясокомбинат ФББ", cust: "Frank by Мираторг", city: "Наро-Фоминск", year: "2024" },
  { id: "p3", obj: "Склад-холодильник", cust: "ООО «Норд»", city: "Тюмень", year: "2024" },
  { id: "p4", obj: "Офис продаж", cust: "АО «Меркурий»", city: "Москва", year: "2023" },
];
function ProjectsAdminDemo() {
  // Порог 1023 (как у реальной «Витрины»): на iPad Air демо отдаёт мобильную строку.
  const phone = useIsTabletDown();
  const [list, setList] = React.useState(_PRJ_SEED);
  const [touched, setTouched] = React.useState(false);
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= list.length) return; setList((prev) => { const n = prev.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; }); setTouched(true); };
  const remove = (id) => { setList((prev) => prev.filter((p) => p.id !== id)); setTouched(true); setNote(""); };
  const [note, setNote] = React.useState(""); // «Изменить» в демо формы не открывает — поясняем строкой
  const [hoverId, setHoverId] = React.useState(null);
  const dragFrom = React.useRef(null);
  const [dragId, setDragId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);
  const drop = (to) => {
    const from = dragFrom.current; dragFrom.current = null; setDragId(null); setOverId(null);
    if (from == null || from === to) return;
    setList((prev) => { const n = prev.slice(); const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    setTouched(true);
  };
  const reset = () => { setList(_PRJ_SEED); setTouched(false); setNote(""); };
  const homeLeft = list[0], homeRight = list[1];

  const HomeCard = ({ p, side }) => (
    <div className="ref-pop" style={{ flex: 1, minWidth: 0, background: "#111", borderRadius: 12, padding: "16px 16px 18px", color: "#fff" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: side === "left" ? "#7ee0a0" : "#9fb8ff" }}>{side === "left" ? "Слева · новее" : "Справа"}</div>
      {p ? (
        <>
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.obj}</div>
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,.72)" }}>{p.cust} · {p.city} · {p.year}</div>
        </>
      ) : (
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,.5)" }}>— пусто —</div>
      )}
    </div>
  );

  return (
    <DemoFrame label="порядок витрины" onReset={reset}
      hint={phone
        ? "Меняйте порядок кнопками ↑/↓ справа — ровно как этапы в объекте. Первые два всегда показываются на главной: верхний — слева и «новее», второй — справа. Остальные уходят на страницу «Смотреть работы»."
        : "Тащите проект за ⠿ вверх или вниз — ровно как этапы в объекте. Первые два всегда показываются на главной: верхний — слева и «новее», второй — справа. Остальные уходят на страницу «Смотреть работы». Действия «Изменить/Удалить» в кабинете появляются при наведении на строку."}>
      {/* Мини-витрина главной — на телефоне карточки в столбик */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>Блок «Проекты» на главной</div>
      <div style={{ display: "flex", flexDirection: phone ? "column" : "row", gap: 12 }}>
        <HomeCard p={homeLeft} side="left" />
        <HomeCard p={homeRight} side="right" />
      </div>

      {/* Список-редактор — строки точь-в-точь как в кабинете (превью + порядок + действия) */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#999", margin: "18px 0 8px" }}>Список проектов ({phone ? "кнопки ↑/↓" : "тащите за ⠿"} — порядок решает, кто где)</div>
      <div style={{ border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
        {list.length === 0 ? <div style={{ padding: "16px 14px", fontSize: 14, fontWeight: 300, color: "#aaa" }}>Пока нет проектов. Нажмите «+ Новый проект».</div> : null}
        {list.map((p, i) => {
          const onHome = i < 2;
          const dragging = dragId === p.id;
          const over = overId === p.id && dragId !== p.id;
          const hov = hoverId === p.id;
          return (
            <div key={p.id} className="ref-pop"
              onMouseEnter={phone ? undefined : () => setHoverId(p.id)} onMouseLeave={phone ? undefined : () => setHoverId(null)}
              onDragOver={phone ? undefined : (e) => { e.preventDefault(); if (overId !== p.id) setOverId(p.id); }}
              onDrop={phone ? undefined : (e) => { e.preventDefault(); drop(i); }}
              style={{ display: "flex", alignItems: "center", gap: phone ? 10 : 14, padding: phone ? "12px 12px" : "12px 14px", borderTop: i ? "1px dotted #ececec" : "none", background: over ? "#f4f7ff" : hov ? "rgba(0,0,0,.02)" : onHome ? "rgba(46,139,87,.05)" : "transparent", opacity: dragging ? 0.4 : 1, transition: "background-color .12s ease" }}>
              {!phone ? (
                <span draggable
                  onDragStart={() => { dragFrom.current = i; setDragId(p.id); }}
                  onDragEnd={() => { dragFrom.current = null; setDragId(null); setOverId(null); }}
                  title="Перетащите" style={{ cursor: "grab", color: hov ? "#9a9a9a" : "#cdcdcd", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0, transition: "color .12s ease" }}>⠿</span>
              ) : null}
              {/* мини-превью карточки (в кабинете тут фото/логотип объекта) */}
              <div style={{ width: phone ? 66 : 96, height: phone ? 46 : 62, borderRadius: 8, overflow: "hidden", background: "#111", flexShrink: 0, display: "grid", placeItems: "center", color: "#666", fontSize: 11 }}>нет фото</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: phone ? "wrap" : "nowrap" }}>
                  <span style={{ fontSize: phone ? 14 : 15, fontWeight: 600, color: TEXT, minWidth: 0, whiteSpace: phone ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.obj}</span>
                  {onHome && <span style={{ fontSize: 11, color: "#0a7d33", background: "#e3f4e8", borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{i === 0 ? (phone ? "слева" : "На главной · слева") : (phone ? "справа" : "На главной · справа")}</span>}
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 300, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.cust} · {p.city} · {p.year}</div>
              </div>
              {/* действия: телефон — всегда видимые иконки ↑ ↓ ✎ 🗑; десктоп — «Изменить»+корзина при наведении */}
              {phone ? (
                <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <RefDocIconBtn title="Выше" disabled={i === 0} onClick={() => move(i, -1)}>{RefMiniIcon.arrowUp}</RefDocIconBtn>
                  <RefDocIconBtn title="Ниже" disabled={i === list.length - 1} onClick={() => move(i, 1)}>{RefMiniIcon.arrowDown}</RefDocIconBtn>
                  <RefDocIconBtn title="Изменить" onClick={() => setNote("«Изменить» в кабинете открывает форму карточки — фото, логотип, заказчик, город, год.")}>{RefMiniIcon.edit}</RefDocIconBtn>
                  <RefDocIconBtn title="Удалить проект" color="#fa5d29" onClick={() => remove(p.id)}>{RefMiniIcon.trash}</RefDocIconBtn>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, opacity: hov ? 1 : 0, transition: "opacity .14s ease", pointerEvents: hov ? "auto" : "none" }}>
                  <RefDocIconBtn title="Изменить" onClick={() => setNote("«Изменить» в кабинете открывает форму карточки — фото, логотип, заказчик, город, год.")}>{RefMiniIcon.edit}</RefDocIconBtn>
                  <RefDocIconBtn title="Удалить проект" color="#fa5d29" onClick={() => remove(p.id)}>{RefMiniIcon.trash}</RefDocIconBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {note ? <div className="ref-pop" style={{ marginTop: 10, fontSize: 12.5, fontWeight: 400, color: "#dd7a1f" }}>{note}</div> : null}
      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 300, color: "#a0a0a0", lineHeight: 1.5 }}>
        Новый проект через «+ Новый проект» встаёт наверх списка — то есть слева на главной, а тот, что был слева, сдвигается вправо.
      </div>
    </DemoFrame>
  );
}

/* Демо: права — роль заполняет галочки, ручная правка помечается «+вручную/−снято». */
const _PERM_CAT = [
  { ns: "Объекты", perms: [["objects.view", "Видеть объекты"], ["objects.create", "Создавать объекты"], ["objects.edit", "Редактировать объекты"], ["objects.publish", "Публиковать изменения"]] },
  { ns: "Документы", perms: [["docs.upload", "Загружать документы"], ["docs.delete", "Удалять документы"]] },
  { ns: "Переписка", perms: [["messages.reply", "Отвечать заказчику"]] },
  { ns: "Сотрудники", perms: [["staff.view", "Видеть сотрудников"], ["staff.manage", "Управлять сотрудниками"]] },
];
const _PERM_ROLES = {
  manager: { label: "Менеджер", set: ["objects.view", "objects.create", "objects.edit", "objects.publish", "docs.upload", "docs.delete", "messages.reply", "staff.view"] },
  executor: { label: "Исполнитель", set: ["objects.view", "objects.edit", "objects.publish", "docs.upload", "messages.reply"] },
  viewer: { label: "Наблюдатель", set: ["objects.view"] },
};
function PermDemo() {
  const [role, setRole] = React.useState("executor");
  const preset = new Set(_PERM_ROLES[role].set);
  const [sel, setSel] = React.useState(() => new Set(_PERM_ROLES["executor"].set));
  const pickRole = (r) => { setRole(r); setSel(new Set(_PERM_ROLES[r].set)); };
  const toggle = (p) => setSel((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const reset = () => setSel(new Set(preset));
  const overridden = [..._PERM_CAT.flatMap((g) => g.perms.map((p) => p[0]))].some((p) => preset.has(p) !== sel.has(p));
  return (
    <DemoFrame label="права сотрудника" onReset={reset}
      hint="Выберите роль — галочки заполнятся пресетом. Отметьте что-то вручную — появится пометка «+вручную» или «−снято». «Сбросить» вернёт к роли.">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.keys(_PERM_ROLES).map((r) => (
          <button key={r} type="button" onClick={() => pickRole(r)}
            style={{ border: "1px solid " + (role === r ? "#111" : "#e0e0e0"), background: role === r ? "#111" : "#fff", color: role === r ? "#fff" : "#444", fontFamily: UI, fontSize: 13, fontWeight: 400, padding: "8px 16px", borderRadius: 999, cursor: "pointer", transition: "all .15s ease" }}>
            {_PERM_ROLES[r].label}
          </button>
        ))}
        {overridden ? <span className="ref-pop" style={{ alignSelf: "center", fontSize: 12, fontWeight: 400, color: "#dd7a1f" }}>· есть ручные правки поверх роли</span> : null}
      </div>
      <div style={{ marginTop: 14, border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", padding: "6px 16px" }}>
        {_PERM_CAT.map((g, gi) => (
          <div key={g.ns} style={{ borderTop: gi ? "1px dotted #ececec" : "none", padding: "12px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>{g.ns}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {g.perms.map(([p, label]) => {
                const on = sel.has(p), base = preset.has(p);
                const mark = on && !base ? "+ вручную" : !on && base ? "− снято" : "";
                return (
                  <button key={p} type="button" onClick={() => toggle(p)}
                    style={{ display: "flex", alignItems: "center", gap: 10, border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: UI, textAlign: "left" }}>
                    <RefCheck on={on} />
                    <span style={{ fontSize: 13.5, fontWeight: 300, color: on ? TEXT : "#999" }}>{label}</span>
                    {mark ? <span style={{ fontSize: 11.5, fontWeight: 500, color: "#dd7a1f" }}>{mark}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

/* Демо: переписка — запрос заказчика → «Ожидает ответа», ответ CUBE → «Отвечено». */
const _MSG_ASK = [
  { text: "Когда будет готов отчёт по обследованию фасада?", date: "сегодня, 15:10" },
  { text: "Можно добавить в смету замену отливов?", date: "сегодня, 16:02" },
];
const _MSG_REPLY = [
  { text: "Отчёт готовим — пришлём до пятницы, уведомление придёт на почту.", date: "сегодня, 15:41" },
  { text: "Да, включим отдельной позицией. Обновлённую смету откроем в объекте.", date: "сегодня, 16:20" },
];
function MessagesDemo() {
  const [threads, setThreads] = React.useState([]);
  const last = threads[threads.length - 1];
  const canAsk = !last || !!last.reply;      // заказчик пишет новый запрос, когда предыдущий закрыт
  const canReply = !!last && !last.reply;
  const ask = () => setThreads((p) => { const q = _MSG_ASK[p.length % _MSG_ASK.length]; return [...p, { n: p.length + 1, author: "Вы (заказчик)", date: q.date, text: q.text, reply: null }]; });
  const reply = () => setThreads((p) => { if (!p.length || p[p.length - 1].reply) return p; const r = _MSG_REPLY[(p.length - 1) % _MSG_REPLY.length]; const n = [...p]; n[n.length - 1] = { ...n[n.length - 1], reply: { author: "Команда CUBE", date: r.date, text: r.text } }; return n; });
  const reset = () => setThreads([]);
  return (
    <DemoFrame label="коммуникация по объекту" onReset={reset}
      hint="«Заказчик пишет» добавляет пронумерованный запрос — статус треда «Ожидает ответа». «Ответить от CUBE» — ответ встаёт под запросом с левой чертой, статус «Отвечено». Ровно так это выглядит в карточке объекта.">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <FileHoverBtn disabled={!canAsk} onClick={ask}>Заказчик пишет</FileHoverBtn>
        <FileHoverBtn variant="dark" disabled={!canReply} onClick={reply}>Ответить от CUBE</FileHoverBtn>
      </div>
      <RefChat threads={threads} />
    </DemoFrame>
  );
}

/* Сегментированный переключатель для демо (одна из опций активна). */
function DemoSeg({ value, onChange, options }) {
  return (
    <div style={{ display: "inline-flex", gap: 4, background: "#ededed", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          style={{ border: "none", background: value === o.v ? "#111" : "transparent", color: value === o.v ? "#fff" : "#666", fontFamily: UI, fontSize: 12.5, fontWeight: 400, padding: "7px 14px", borderRadius: 8, cursor: "pointer", transition: "background-color .15s ease, color .15s ease" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ===== Реальные сигналы UI (1:1 с ObjectsSection/StickyDock), для демо справки ===== */
const REF_CARROT = "#FA5D29";

/* Пульсирующая точка «новое» (ObjectsSection NewBadge). */
function NewBadge({ size = 8 }) {
  return <span aria-hidden="true" title="Есть новое" style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: REF_CARROT, flexShrink: 0, animation: "cubeNewPulse 1.8s ease-out infinite" }} />;
}
/* Пилюля «New» на свежем документе (ObjectsSection NewPill). */
function NewPill() {
  return <span aria-label="Есть новое" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, padding: "2px 6px", borderRadius: 5, background: REF_CARROT, color: "#fff", fontSize: 10, fontWeight: 600, lineHeight: 1, letterSpacing: ".01em", animation: "cubeNewPop .32s cubic-bezier(.2,.8,.2,1) both" }}>New</span>;
}
/* Колокол «подписка на уведомления по объекту» (ObjectsSection BellToggle): морковный — вкл, серый с зачёркиванием — выкл. */
function BellToggle({ on, onToggle }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onToggle} title={on ? "Получаете уведомления по объекту" : "Уведомления по объекту выключены"}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 30, height: 30, display: "grid", placeItems: "center", border: "none", background: h ? "#f5f5f5" : "transparent", color: on ? REF_CARROT : "#cbcbcb", cursor: "pointer", borderRadius: 8, flexShrink: 0, transition: "color .15s, background-color .15s" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        {!on && <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" />}
      </svg>
    </button>
  );
}

/* Реальные иконки в шапке объекта у заказчика (ObjectsSection): «История изменений» и «Подписка на e-mail». */
function RefTrackIcon({ size = 21 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="6" r="2.6" /><circle cx="18" cy="18" r="2.6" />
      <path d="M8.35 10.5L16 7.5M8.35 13.5L16 16.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function RefExtIcon({ size = 21 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" /><path d="M20 4l-8 8" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
    </svg>
  );
}
/* Круглая иконка-кнопка 40×40 из шапки объекта (iconBtnStyle). */
function RefObjIconBtn({ onClick, title, active, children }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "none", background: (h && !active) ? "#efefee" : "transparent", color: active ? REF_CARROT : TEXT, cursor: "pointer", padding: 0, transition: "color .15s ease, background-color .15s ease" }}>
      {children}
    </button>
  );
}

/* Реальный StickyDock объекта: плитка-назад, графитовый инфо-блок (статус + прогресс),
   mint-кнопка «Задать вопрос»/«Запросы» с пульсирующей морковной точкой-индикатором. */
function RefDock({ id = "KRT-02-2026", statusLabel = "В работе", statusTone = "#4a90d9", progress = 25, cta = "Задать вопрос", badge = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(58,58,58,.94)", backdropFilter: "saturate(115%) blur(6px)", WebkitBackdropFilter: "saturate(115%) blur(6px)", borderRadius: 12, padding: 6, boxShadow: "0 16px 34px rgba(0,0,0,.22)" }}>
      <div style={{ width: 60, height: 60, flexShrink: 0, background: "#1B1B1B", borderRadius: 8, border: "1px solid rgba(255,255,255,.06)", display: "grid", placeItems: "center" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><g transform="rotate(-90 12 12)"><path d="M6 11l6-6 6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></g></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0, background: "#3E3E3E", color: "#e8e8e8", borderRadius: 10, padding: "0 16px", height: 60, display: "flex", flexDirection: "column", justifyContent: "center", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, lineHeight: 1 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: statusTone, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: "#fff" }}>№{id}</span>
          <span style={{ fontWeight: 300, color: "#c5c5c5" }}>· {statusLabel}</span>
        </div>
        {progress != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 999, background: "rgba(255,255,255,.16)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#aceec4", borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#cfcfcf" }}>{progress}%</span>
          </div>
        ) : (
          <div style={{ fontSize: 11, fontWeight: 300, color: "#9a9a9a" }}>Этапы не заданы</div>
        )}
      </div>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#aceec4", color: "#111", height: 60, borderRadius: 8, padding: "0 20px", minWidth: 132, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{cta}</div>
        {badge ? <span aria-hidden="true" style={{ position: "absolute", top: 9, right: 11, width: 7, height: 7, borderRadius: 999, background: REF_CARROT, animation: "refDockBadge 1.6s ease-out infinite" }} /> : null}
      </div>
    </div>
  );
}

/* Пунктирная рамка реестра (SVG dash "1 8", rx 12) — как контейнер чата в объекте. */
function RefDottedBox({ children, pad = "20px 22px" }) {
  return (
    <div style={{ position: "relative", padding: pad }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
        <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="1 8" />
      </svg>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
/* Пунктирный разделитель между запросами (как DottedLine в объекте). */
function RefDottedLine() {
  return <div aria-hidden="true" style={{ height: 1, margin: "18px 0", background: "repeating-linear-gradient(to right, #000 0 1px, rgba(0,0,0,0) 1px 9px)" }} />;
}
/* Пилюля статуса треда «Коммуникация по объекту» (ObjectsSection). */
function RefThreadBadge({ status }) {
  if (status === "awaiting") return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: REF_CARROT, border: `1px solid ${REF_CARROT}`, borderRadius: 6, padding: "3px 8px" }}>Ожидает ответа</span>;
  if (status === "answered") return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#2f7d32", border: "1px solid #cfe6cf", borderRadius: 6, padding: "3px 8px" }}>Отвечено</span>;
  return null;
}

/* Реестр «Коммуникация по объекту» 1:1: заголовок + счётчик + пилюля статуса,
   пунктирная рамка, группы «01 ЗАКАЗЧИК» / «ОТВЕТ CUBE» (ответ с левым бордером). */
function RefChat({ threads }) {
  const custNo = threads.length;
  const last = threads[threads.length - 1];
  const status = !last ? "empty" : last.reply ? "answered" : "awaiting";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#777" }}>Коммуникация по объекту</span>
        {custNo ? <span style={{ fontSize: 12, fontWeight: 700, color: "#bdbdbd" }}>{String(custNo).padStart(2, "0")}</span> : null}
        <span style={{ marginLeft: "auto" }}><RefThreadBadge status={status} /></span>
      </div>
      <RefDottedBox>
        {!threads.length ? (
          <div style={{ fontSize: 13, fontWeight: 300, color: "#aaa" }}>Пока сообщений нет. Первый запрос заказчика появится здесь.</div>
        ) : threads.map((t, i) => (
          <React.Fragment key={i}>
            {i ? <RefDottedLine /> : null}
            <div className="ref-pop">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#bdbdbd" }}>{String(t.n).padStart(2, "0")}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#111" }}>Заказчик</span>
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: "#777" }}>{t.author} · {t.date}</div>
              <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: "#111", whiteSpace: "pre-wrap" }}>{t.text}</div>
              {t.reply ? (
                <div className="ref-pop" style={{ marginTop: 14, marginLeft: 2, paddingLeft: 20, borderLeft: "2px solid #111" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#111" }}>Ответ CUBE</div>
                  <div style={{ marginTop: 3, fontSize: 12, color: "#777" }}>{t.reply.author} · {t.reply.date}</div>
                  <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: "#111", whiteSpace: "pre-wrap" }}>{t.reply.text}</div>
                </div>
              ) : null}
            </div>
          </React.Fragment>
        ))}
      </RefDottedBox>
    </div>
  );
}

/* Демо: уведомления — реальные сигналы кабинета (точка «новое», «New» на документе,
   пульсирующая точка на mint-кнопке дока, письмо на почту). Без выдуманного «центра». */
const _NOTIFY_EVENTS = {
  customer: [
    { k: "status", title: "Статус объекта обновлён", text: "«Фасад, Ноябрьск» → В работе", doc: false },
    { k: "reply", title: "Ответ на ваш вопрос", text: "Команда CUBE ответила на запрос 01", doc: false },
    { k: "doc", title: "Новый документ", text: "«Смета (предварительная).xlsx» открыта для вас", doc: true },
  ],
  team: [
    { k: "ask", title: "Новый вопрос от заказчика", text: "«Когда будет готов отчёт?»", doc: false },
    { k: "confirm", title: "Заказчик подтвердил этап", text: "«Обследование» принято заказчиком", doc: false },
    { k: "doc", title: "Загружен документ", text: "Исполнитель добавил «Акт.pdf»", doc: true },
  ],
};
const _NOTIFY_MAIL = { customer: "zakazchik@krt.ru", team: "ivanov@cube-tech.ru" };
function NotifyDemo() {
  const phone = useIsPhone();
  const [side, setSide] = React.useState("customer");
  const [list, setList] = React.useState([]);   // сработавшие события (новейшее — первым)
  const [idx, setIdx] = React.useState(0);       // какое событие смоделировать следующим
  const [sub, setSub] = React.useState(true);    // подписка на письма по объекту
  const [menu, setMenu] = React.useState(false); // меню учётной записи в шапке раскрыто
  const events = _NOTIFY_EVENTS[side];
  const last = list[0];
  const hasNew = list.length > 0;
  const docNew = list.some((e) => e.doc);
  const fire = (e) => setList((p) => [{ ...e, id: p.length + 1 }, ...p].slice(0, 6));
  const nextEvent = () => { fire(events[idx % events.length]); setIdx((i) => i + 1); };
  const clear = () => setList([]);
  const switchSide = (s) => { setSide(s); setList([]); setIdx(0); };
  const reset = () => { setSide("customer"); setList([]); setIdx(0); setSub(true); setMenu(false); };
  const isCustomer = side === "customer";

  return (
    <DemoFrame label="уведомления" onReset={reset}
      hint={phone
        ? "Отдельного «центра уведомлений» с колокольчиком у нас нет. Нажмите «Смоделировать событие» — и увидите все три места, куда придёт сигнал: (1) сверху в шапке у иконки учётной записи, (2) на самом объекте — точка «новое» у объекта и метка «New» у документа, (3) письмом на почту. «Прочитать всё» гасит метки."
        : "Отдельного «центра уведомлений» с колокольчиком у нас нет. Нажмите «Смоделировать событие» — и увидите все три места, куда придёт сигнал: (1) сверху в шапке у иконки учётной записи, (2) на самом объекте — точка «новое», метка «New» у документа и пульсирующая точка на mint-кнопке дока, (3) письмом на почту. «Прочитать всё» гасит метки."}>
      <DemoSeg value={side} onChange={switchSide}
        options={[{ v: "customer", label: "Заказчику приходит" }, { v: "team", label: "Команде приходит" }]} />

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <FileHoverBtn onClick={nextEvent}>Смоделировать событие</FileHoverBtn>
        <FileHoverBtn variant="dark" disabled={!hasNew} onClick={clear}>Прочитать всё</FileHoverBtn>
      </div>
      {/* Отдельная строка фиксированной высоты — чтобы появление «последнего» не сдвигало всё ниже. */}
      <div style={{ marginTop: 8, minHeight: 17, fontSize: 12, fontWeight: 300, lineHeight: "17px", color: "#888" }}>
        {last
          ? <span key={last.id} className="ref-pop">последнее событие: «{last.title}»</span>
          : <span style={{ color: "#c4c4c4" }}>Нажмите «Смоделировать событие» — увидите, где загорятся метки.</span>}
      </div>

      {/* ── МЕСТО 1: шапка сайта — иконка учётной записи справа сверху ── */}
      <div style={{ marginTop: 16, position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, background: "#fff", border: "1px solid #ececec", borderRadius: 12, padding: "10px 14px" }}>
        <span style={{ marginRight: "auto", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#c4c4c4" }}>Шапка сайта</span>
        <span style={{ fontSize: 12.5, fontWeight: 300, color: "#888" }}>{isCustomer ? "ООО «КРТ»" : "Иванов И."}</span>
        {/* аватар + точка «новое» поверх него */}
        <button type="button" onClick={() => setMenu((v) => !v)} title="Меню учётной записи"
          style={{ position: "relative", width: 34, height: 34, borderRadius: 999, border: "none", padding: 0, background: "#1c1c1c", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          {isCustomer ? "Т" : "И"}
          {hasNew ? <span aria-hidden="true" style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 999, background: REF_CARROT, border: "2px solid #fff", animation: "cubeNewPulse 1.8s ease-out infinite" }} /> : null}
        </button>
        {/* выпадающее меню учётной записи: у пункта «Объекты» — пульсирующая морковная точка */}
        {menu ? (
          <div className="ref-pop" style={{ position: "absolute", top: "calc(100% + 6px)", right: 12, zIndex: 40, minWidth: 190, background: "#fff", border: "1px solid #ececec", borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.10)", padding: 6 }}>
            {[{ t: "Объекты", dot: hasNew }, { t: "Профиль", dot: false }, { t: "Выйти", dot: false }].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 400, color: m.t === "Выйти" ? "#999" : TEXT }}>
                <span style={{ flex: 1 }}>{m.t}</span>
                {m.dot ? <span className="relative" style={{ display: "inline-flex", width: 8, height: 8 }}><span style={{ position: "absolute", inset: 0, borderRadius: 999, background: REF_CARROT, animation: "cubeNewPulse 1.8s ease-out infinite" }} /><span style={{ position: "relative", width: 8, height: 8, borderRadius: 999, background: REF_CARROT }} /></span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 300, color: "#a8a8a8" }}>При новом событии у иконки учётной записи загорается точка, а в меню — точка у пункта «Объекты». {menu ? "" : "Нажмите на аватар, чтобы раскрыть меню."}</div>

      <div style={{ marginTop: 12, border: "1px dotted #dcdcdc", borderRadius: 14, background: "#f4f4f4", padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#c4c4c4", marginBottom: 10 }}>Место 2 · на самом объекте</div>
        {/* Строка объекта — 1:1 со списком объектов: сверху № + статус-пилюля, ниже крупное
            название с точкой «новое», справа — иконка подписки на e-mail (та же, что в шапке объекта). */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "12px 12px 12px 14px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#a0a0a0" }}>№ KRT-02-2026</span>
              <RefPill code="in_progress" />
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ minWidth: 0, fontSize: 15, fontWeight: 500, color: TEXT, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ООО «КРТ» — Фасад, Ноябрьск</span>
              {hasNew ? <NewBadge /> : null}
            </div>
            <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 300, color: "#a0a0a0" }}>Ноябрьск · 2 док.</div>
          </div>
          <RefObjIconBtn title={sub ? "Уведомления на e-mail включены — нажмите, чтобы отключить" : "Получать уведомления об изменениях на e-mail"} active={sub} onClick={() => setSub((v) => !v)}>
            <RefExtIcon size={19} />
          </RefObjIconBtn>
        </div>
        {/* Явная подсказка «куда что нажать» — метки не всегда очевидны. */}
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 300, lineHeight: 1.55, color: "#a0a0a0" }}>
          {hasNew
            ? <>Морковная точка • у названия — по объекту есть непрочитанное. Значок <span style={{ color: sub ? REF_CARROT : "#8a8a8a", fontWeight: 400 }}>↗ справа</span> — подписка на письма по объекту: сейчас <b style={{ fontWeight: 500, color: sub ? "#2f855a" : "#999" }}>{sub ? "включена" : "выключена"}</b>, нажмите, чтобы переключить.</>
            : <>Пока событий нет — меток тоже. Значок <span style={{ color: sub ? REF_CARROT : "#8a8a8a", fontWeight: 400 }}>↗ справа</span> включает письма по объекту (сейчас <b style={{ fontWeight: 500, color: sub ? "#2f855a" : "#999" }}>{sub ? "включены" : "выключены"}</b>).</>}
        </div>

        {/* документы: у свежего — метка «New» */}
        <div style={{ marginTop: 10, background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 400, color: "#999", marginBottom: 8 }}>Документы объекта</div>
          {[{ name: "Смета (предварительная).xlsx", fresh: true }, { name: "Договор №2026-14.pdf", fresh: false }].map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: i ? "1px dotted #f2f2f2" : "none" }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 300, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
              {docNew && d.fresh ? <NewPill /> : null}
            </div>
          ))}
        </div>

        {/* реальный StickyDock снизу: точка «новое» пульсирует на mint-кнопке.
            На телефоне дока нет (скрыт ниже 1024px) — сигналы остаются на объекте и документе. */}
        {!phone ? (
          <div style={{ marginTop: 14 }}>
            <RefDock progress={25} cta={isCustomer ? "Задать вопрос" : "Запросы"} badge={hasNew} />
          </div>
        ) : null}
      </div>

      {/* ── МЕСТО 3: письмо на почту (если подписка включена) ── */}
      <div style={{ marginTop: 12, border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", padding: "12px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#c4c4c4", marginBottom: 6 }}>Место 3 · на почту</div>
        {last ? (
          <div key={last.id + String(sub)} className="ref-pop" style={{ fontSize: 12.5, fontWeight: 300, color: sub ? "#2f855a" : "#999" }}>
            {sub
              ? `Письмо ушло на почту: ${_NOTIFY_MAIL[side]} — «${last.title}»`
              : "Подписка на e-mail по этому объекту выключена — но метки в кабинете остаются."}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, fontWeight: 300, color: "#aaa" }}>Нажмите событие выше — сюда придёт письмо (если подписка включена).</div>
        )}
      </div>
    </DemoFrame>
  );
}

/* Демо: профиль — ввод ИНН подтягивает организацию, КПП и адрес (только чтение). */
const _INN_DB = {
  "7707083893": { org: "ПАО Сбербанк", kpp: "773601001", addr: "117312, г. Москва, ул. Вавилова, 19" },
  "7736050003": { org: "ПАО «Газпром»", kpp: "997250001", addr: "190900, г. Санкт-Петербург, наб. р. Мойки, 30" },
};
function ProfileFillDemo() {
  const phone = useIsPhone();
  const [inn, setInn] = React.useState("");
  const digits = inn.replace(/\D/g, "");
  const found = _INN_DB[digits] || ((digits.length === 10 || digits.length === 12)
    ? { org: "ООО «Ромашка»", kpp: digits.slice(0, 4) + "01001", addr: "625000, г. Тюмень, ул. Республики, 1" }
    : null);
  const reset = () => setInn("");

  const under = { border: "none", borderBottom: "1px solid #d9d9d9", outline: "none", background: "transparent", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, padding: "7px 0", width: "100%" };
  const lbl = { fontSize: 11.5, fontWeight: 400, letterSpacing: ".02em", color: "#999" };
  const ReadField = ({ label, value, i }) => (
    <div style={{ minWidth: 0 }}>
      <div style={lbl}>{label}</div>
      <div key={value} className={value ? "ref-pop" : undefined} style={{ animationDelay: value ? `${i * 0.07}s` : undefined, display: "flex", alignItems: phone ? "flex-start" : "center", gap: 8, borderBottom: "1px solid #ededed", padding: "7px 0", minHeight: 34 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: value ? 400 : 300, color: value ? TEXT : "#c4c4c4", overflow: phone ? "visible" : "hidden", textOverflow: phone ? "clip" : "ellipsis", whiteSpace: phone ? "normal" : "nowrap", wordBreak: phone ? "break-word" : "normal", lineHeight: phone ? 1.4 : undefined }}>{value || "подтянется автоматически"}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, marginTop: phone ? 3 : 0 }}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      </div>
    </div>
  );

  return (
    <DemoFrame label="профиль · автозаполнение по ИНН" onReset={reset}
      hint="Введите ИНН (10 или 12 цифр) — организация, КПП и юридический адрес подставятся из DaData и станут доступны только для чтения (значок замка). Руками их вводить не нужно.">
      <div style={{ display: "flex", flexDirection: phone ? "column" : "row", alignItems: phone ? "stretch" : "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ alignSelf: phone ? "flex-start" : "center", fontSize: 12, fontWeight: 300, color: "#999" }}>Примеры:</span>
        {Object.entries(_INN_DB).map(([k, v]) => (
          <button key={k} type="button" onClick={() => setInn(k)}
            style={{ border: "1px solid #e0e0e0", background: "#fff", color: "#444", fontFamily: UI, fontSize: 12.5, fontWeight: 400, padding: phone ? "11px 14px" : "6px 12px", borderRadius: phone ? 10 : 999, cursor: "pointer", textAlign: "left", width: phone ? "100%" : "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {phone ? <span style={{ fontWeight: 600, color: TEXT }}>{k}</span> : `${k} · ${v.org}`}
            {phone ? <span style={{ color: "#999" }}>· {v.org}</span> : null}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: phone ? "100%" : 260 }}>
        <div style={lbl}>ИНН</div>
        <input value={inn} onChange={(e) => setInn(e.target.value)} inputMode="numeric" placeholder="10 или 12 цифр" style={under} />
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 16, gridTemplateColumns: phone ? "1fr" : "1fr 1fr" }}>
        <div style={{ gridColumn: "1 / -1" }}><ReadField label="Организация" value={found ? found.org : ""} i={0} /></div>
        <ReadField label="КПП" value={found ? found.kpp : ""} i={1} />
        <ReadField label="Юридический адрес" value={found ? found.addr : ""} i={2} />
      </div>

      <div style={{ marginTop: 14 }}>
        {found ? (
          <span key="ok" className="ref-pop" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 400, color: "#2f855a" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#2f855a" }} />Организация найдена — реквизиты подставлены
          </span>
        ) : (
          <span style={{ fontSize: 12.5, fontWeight: 300, color: "#aaa" }}>Введите ИНН или выберите пример выше ↑</span>
        )}
      </div>
    </DemoFrame>
  );
}

/* ===== Реальный редактор объекта (демо 1:1) — виджеты и данные ===== */
const refSecLabel = { fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#777" };
const refFieldLabel = { fontSize: 11.5, fontWeight: 400, letterSpacing: ".02em", color: "#999", marginBottom: 2 };
function RefSectionRule() { return <div style={{ marginTop: 30, marginBottom: 22, borderTop: "1px solid #e6e6e6" }} />; }
function RefChevron({ open, color = "#b1b1b1" }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" style={{ color, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease", flexShrink: 0 }} aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
/* Чёрный квадрат-чекбокс редактора (CheckMark). */
function RefCheckMark({ on, disabled }) {
  return (
    <span style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid #d9d9d9", display: "grid", placeItems: "center", flexShrink: 0, background: "#fff" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: disabled ? "#c2c2c2" : "#111", transform: on ? "scale(1)" : "scale(0)", transition: "transform .15s ease" }} />
    </span>
  );
}
/* Подчёркнутый селект редактора (UnderSelect): линия снизу, шеврон, точка статуса. */
const refUnderField = (open) => ({ height: 46, display: "grid", gridTemplateColumns: "1fr 24px", alignItems: "center", background: "transparent", border: "none", boxShadow: `inset 0 -1px 0 0 ${open ? "#111" : "#e6e6e6"}`, cursor: "pointer", padding: 0, width: "100%", textAlign: "left" });
function RefUnderSelect({ value, options, onChange, placeholder = "— не назначен —", width, noDot }) {
  const [open, setOpen] = React.useState(false);
  const cur = options.find((o) => o.v === value);
  return (
    <div style={{ position: "relative", width: width || "100%" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={refUnderField(open)}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, fontFamily: UI, fontSize: 15, fontWeight: 300, color: cur ? TEXT : "#b4b4b4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {!noDot && cur && cur.tone ? <span style={{ width: 9, height: 9, borderRadius: 999, background: cur.tone, flexShrink: 0 }} /> : null}
          {cur ? cur.label : placeholder}
        </span>
        <RefChevron open={open} />
      </button>
      {open ? (
        <div className="ref-pop" style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 60, background: "#fff", border: "1px solid #ececec", borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.08)", maxHeight: 260, overflowY: "auto", padding: 6 }}>
          {options.map((o) => (
            <div key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 400, color: TEXT, background: o.v === value ? "#f6f6f6" : "transparent" }}
              onMouseEnter={(e) => { if (o.v !== value) e.currentTarget.style.background = "#f8f8f8"; }}
              onMouseLeave={(e) => { if (o.v !== value) e.currentTarget.style.background = "transparent"; }}>
              {o.tone ? <span style={{ width: 9, height: 9, borderRadius: 999, background: o.tone, flexShrink: 0 }} /> : null}
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
/* Учётные записи для примера (Заказчик выбирается из них — как в реальном редакторе). */
const _REF_ACCOUNTS = [
  { id: "krt", name: "ООО «КРТ»", email: "krt@example.ru", org: "ООО «КРТ»" },
  { id: "stm", name: "Строймонтаж-Групп", email: "info@strm-group.ru", org: "ООО «Строймонтаж-Групп»" },
  { id: "pvz", name: "Пётр Возняк", email: "voznyak@mail.ru", org: "ИП Возняк П. А." },
  { id: "gpk", name: "Городская проектная контора", email: "office@gpk-nsk.ru", org: "АО «ГПК»" },
];
/* Пикер заказчика из учётных записей (StageItemsField-стиль): подчёркнутый триггер (имя/e-mail),
   выпадающий список с поиском; строка = имя (15/300) + «e-mail · организация» (12/#888).
   1-в-1 с реальным UnderAccountPicker из редактора объекта. */
function RefAccountPicker({ accounts, value, onPick, hint }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ql = q.trim().toLowerCase();
  const filtered = accounts.filter((a) => !ql || [a.name, a.email, a.org].some((f) => String(f || "").toLowerCase().includes(ql)));
  const display = value ? (value.name || value.email) : "";
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={refUnderField(open)}>
        <span style={{ minWidth: 0, display: "inline-flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <span style={{ minWidth: 0, fontFamily: UI, fontSize: 15, fontWeight: 300, color: display ? TEXT : "#b4b4b4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display || "Выберите учётную запись"}</span>
        </span>
        <RefChevron open={open} />
      </button>
      {/* Подсказка-«коуч» поверх поля справа — не режется границей блока (overflow не давит) */}
      {hint && !open ? (
        <span style={{ position: "absolute", right: 30, top: "50%", transform: "translateY(-50%)", zIndex: 5, pointerEvents: "none" }}>
          <RefHintChip style={{ padding: "2px 8px", fontSize: 10 }}>нажмите — выбрать</RefHintChip>
        </span>
      ) : null}
      {open ? (
        <div className="ref-pop" style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 60, background: "#fff", border: "1px solid #ececec", borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.08)", maxHeight: 300, overflowY: "auto", padding: 6 }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени, e-mail…"
            style={{ width: "100%", height: 40, border: "none", outline: "none", background: "#fafafa", padding: "0 12px", fontFamily: UI, fontSize: 14, fontWeight: 300, color: TEXT, marginBottom: 6, borderRadius: 8 }} />
          {filtered.length === 0 ? (
            <div style={{ padding: 10, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>Ничего не найдено.</div>
          ) : filtered.map((a) => {
            const active = value && value.id === a.id;
            return (
              <button key={a.id} type="button" onClick={() => { onPick(a); setOpen(false); setQ(""); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderRadius: 8, background: active ? "#f3f3f3" : "transparent", cursor: "pointer", fontFamily: UI }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = active ? "#f3f3f3" : "transparent"; }}>
                <div style={{ fontSize: 15, fontWeight: 300, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name || a.email}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.email}{a.org ? ` · ${a.org}` : ""}</div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
/* Кнопка «+ Добавить» редактора (FillBtn): контур, при наведении заливается. */
function RefFillBtn({ onClick, children }) {
  const [h, setH] = React.useState(false);
  return <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid #111", background: h ? "#111" : "transparent", color: h ? "#fff" : "#111", fontFamily: UI, fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0, transition: "background-color .15s, color .15s" }}>{children}</button>;
}
/* Иконка-корзина этапа: при наведении морковная на фоне #faf1ee. */
function RefTrashBtn({ onClick }) {
  return <button type="button" onClick={onClick} title="Удалить"
    style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#b0b0b0", cursor: "pointer", flexShrink: 0, borderRadius: 8, transition: "color .12s, background-color .12s" }}
    onMouseEnter={(e) => { e.currentTarget.style.color = REF_CARROT; e.currentTarget.style.background = "#faf1ee"; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = "#b0b0b0"; e.currentTarget.style.background = "transparent"; }}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" /></svg>
  </button>;
}

const _ED_STAFF = [
  { id: "iv", fio: "Иванов И. С.", position: "Менеджер проектов" },
  { id: "pe", fio: "Петров П. А.", position: "Инженер-обследователь" },
  { id: "si", fio: "Сидорова А. В.", position: "Инженер-проектировщик" },
  { id: "ko", fio: "Ковалёв Д. М.", position: "Сметчик" },
];
const _OBJ_STATUS_OPTS = [
  { v: "draft", label: "Черновик", tone: "#8a8a8a" },
  { v: "in_progress", label: "В работе", tone: "#2b6cb0" },
  { v: "waiting_customer", label: "Ожидает заказчика", tone: "#c05621" },
  { v: "done", label: "Завершён", tone: "#2f855a" },
  { v: "archived", label: "Архив", tone: "#718096" },
];
const _STAGE_STATUS_OPTS = [
  { v: "not_started", label: "Не начат", tone: "#cfcfcf" },
  { v: "in_progress", label: "В работе", tone: "#2b6cb0" },
  { v: "done", label: "Завершён", tone: "#2f855a" },
  { v: "paused", label: "На паузе", tone: "#b7791f" },
  { v: "waiting_customer", label: "Ожидает заказчика", tone: "#c05621" },
];
const _stageToneOf = (v) => (_STAGE_STATUS_OPTS.find((o) => o.v === v) || {}).tone || "#cfcfcf";
const _stageLabelOf = (v) => (_STAGE_STATUS_OPTS.find((o) => o.v === v) || {}).label || "";
/* Бейдж статуса этапа для редактора — как <Badge> в объекте (свёрнутая карточка на телефоне). */
function RefStageStatusBadge({ status }) {
  const tone = _stageToneOf(status);
  return <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 9px", borderRadius: 999, background: `${tone}1a`, color: tone, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{_stageLabelOf(status)}</span>;
}
/* Крупная стрелка ↑/↓ для перестановки этапа в раскрытой карточке — как StepArrow в объекте. */
function RefStepArrow({ dir, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} aria-label={dir === "down" ? "Опустить этап ниже" : "Поднять этап выше"}
      style={{ width: 44, height: 40, display: "grid", placeItems: "center", border: "none", background: "transparent", color: disabled ? "#d0d0d0" : "#5a5a5a", cursor: disabled ? "default" : "pointer", padding: 0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === "down" ? "rotate(180deg)" : "none" }}><path d="M6 15l6-6 6 6" /></svg>
    </button>
  );
}
const _respOpts = _ED_STAFF.map((s) => ({ v: s.id, label: `${s.fio} · ${s.position}` }));

/* Соисполнители (CoExecutorsField): подчёркнутый триггер + выпадающий список;
   ответственный закреплён сверху (заблокирован), у выбранных — колокол уведомлений. */
function RefCoExecutors({ staff, respId, selected, onToggle, hint }) {
  const [open, setOpen] = React.useState(false);
  const chosen = staff.filter((s) => selected.has(s.id) && s.id !== respId);
  const label = chosen.length ? chosen.map((s) => s.fio).join(", ") : "— выбрать соисполнителей —";
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={refUnderField(open)}>
        <span style={{ minWidth: 0, display: "inline-flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <span style={{ minWidth: 0, fontFamily: UI, fontSize: 15, fontWeight: 300, color: chosen.length ? TEXT : "#b4b4b4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        </span>
        <RefChevron open={open} />
      </button>
      {/* Подсказка-«коуч» поверх поля справа — не режется границей блока */}
      {hint && !open ? (
        <span style={{ position: "absolute", right: 30, top: "50%", transform: "translateY(-50%)", zIndex: 5, pointerEvents: "none" }}>
          <RefHintChip style={{ padding: "2px 8px", fontSize: 10 }}>нажмите — выбрать</RefHintChip>
        </span>
      ) : null}
      {open ? (
        <div className="ref-pop" style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 60, background: "#fff", border: "1px solid #ececec", borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.08)", maxHeight: 320, overflowY: "auto" }}>
          {/* закреплённый ответственный */}
          {respId ? (() => { const r = staff.find((s) => s.id === respId); return r ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
              <RefCheckMark on disabled />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: "#555" }}>{r.fio} · {r.position}</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#aaa" }}>ответственный</span>
              <BellToggle on onToggle={() => {}} />
            </div>
          ) : null; })() : null}
          {/* остальные сотрудники — с галочкой и колоколом при выборе */}
          {staff.filter((s) => s.id !== respId).map((s) => {
            const on = selected.has(s.id);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", background: on ? "#fbfbfb" : "transparent", borderBottom: "1px solid #f6f6f6" }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#f8f8f8"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                <span onClick={() => onToggle(s.id)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <RefCheckMark on={on} />
                  <span style={{ fontSize: 14, fontWeight: 400, color: TEXT }}>{s.fio} · {s.position}</span>
                </span>
                {on ? <BellToggle on onToggle={() => {}} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* «Что входит в этап» (StageItemsField) — единственный раскрывающийся блок редактора. */
function RefStageItems({ items, onAdd, onRemove, hint }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const n = items.length;
  const add = () => { const t = draft.trim(); if (!t) return; onAdd(t); setDraft(""); };
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 30, padding: "0 4px", border: "none", background: "transparent", cursor: "pointer", fontFamily: UI, fontSize: 13, fontWeight: 400, color: n ? "#555" : "#999" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
        {n ? `Что входит · ${n}` : "Что входит в этап"}
        <RefChevron open={open} />
      </button>
      {hint && !open ? <RefHintLeft>нажмите — пункты этапа</RefHintLeft> : null}
      {open ? (
        <div className="ref-pop" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 70, width: "min(400px, 86vw)", background: "#fff", border: "1px solid #e6e6e6", borderRadius: 12, boxShadow: "0 16px 44px rgba(0,0,0,.16)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={refSecLabel}>Что входит в этап</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>{String(n).padStart(2, "0")}</span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#999", flexShrink: 0 }}>—</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 300, color: "#333" }}>{it}</span>
                <button type="button" onClick={() => onRemove(i)} title="Удалить пункт"
                  style={{ width: 26, height: 26, display: "grid", placeItems: "center", border: "none", background: "transparent", color: "#c0c0c0", cursor: "pointer", borderRadius: 7, flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = REF_CARROT; e.currentTarget.style.background = "#faf1ee"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#c0c0c0"; e.currentTarget.style.background = "transparent"; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))}
            {n === 0 ? <div style={{ fontSize: 13, fontWeight: 300, color: "#bbb", padding: "2px 0 4px" }}>Пунктов пока нет — добавьте ниже.</div> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ color: "#cfcfcf", flexShrink: 0 }}>+</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
              placeholder="Добавить пункт и нажать Enter…"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", boxShadow: "inset 0 -1px 0 0 #e6e6e6", fontFamily: UI, fontSize: 13.5, fontWeight: 300, color: TEXT, padding: "6px 0" }} />
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a8a8a8" }}>Каждый пункт — отдельной строкой. Заказчику покажем списком через тире, когда этап «В работе».</div>
        </div>
      ) : null}
    </div>
  );
}

let _refStageSeq = 100;
let _refDocSeq = 200;
/* Категории документов — как в реальном редакторе (DOC_CATEGORIES). В демо показываем
   репрезентативные: с документами (Договоры, Сметы) и пустую (Акты — «Нет документов»). */
const _DOC_CATS = ["Договоры", "Сметы", "Акты"];
const _INIT_DOCS = [
  { id: 1, cat: "Договоры", name: "Договор №2026-14.pdf", ext: "pdf", hidden: false },
  { id: 2, cat: "Сметы", name: "Смета (предварительная).xlsx", ext: "xlsx", hidden: false },
];
/* Имена «загружаемых» документов по категориям — по кругу, чтобы «+ Добавить» показывал результат. */
const _NEW_DOCS_BY_CAT = {
  "Договоры": [{ name: "Дополнительное соглашение №1.pdf", ext: "pdf" }, { name: "Договор подряда (скан).pdf", ext: "pdf" }],
  "Сметы": [{ name: "Ведомость объёмов.xlsx", ext: "xlsx" }, { name: "Смета (итоговая).xlsx", ext: "xlsx" }],
  "Акты": [{ name: "Акт выполненных работ.pdf", ext: "pdf" }, { name: "Акт скрытых работ.pdf", ext: "pdf" }],
};
/* Цвета плашек расширений — как ExtBadge в объекте (EXT_COLORS). */
const _REF_EXT_COLORS = { pdf: "#c0392b", xlsx: "#217346", xls: "#217346", doc: "#2b579a", docx: "#2b579a", dwg: "#6b46c1", jpg: "#0e7490", jpeg: "#0e7490", png: "#0e7490" };
function RefExtBadge({ ext }) {
  const e = String(ext || "").toLowerCase();
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 46, height: 22, padding: "0 8px", borderRadius: 6, background: _REF_EXT_COLORS[e] || "#5b6472", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>{e || "файл"}</span>;
}
/* Типовые этапы для нижнего аддера «Добавить из типовых» — как getStageLibrary() в объекте. */
const _REF_STAGE_LIB = [
  { id: "l1", title: "Договор и аванс" },
  { id: "l2", title: "Обследование фасада" },
  { id: "l3", title: "Проектирование" },
  { id: "l4", title: "Монтажные работы" },
  { id: "l5", title: "Сдача и отчёт" },
];
/* «Опасная зона» редактора объекта 1-в-1 с боевым ObjectDangerZone: в покое — приглушённая
   строка + морковная ссылка-«корзина» «Удалить объект» (НЕ розовая плашка). По клику
   раскрывается розовый бокс подтверждения: ввести номер объекта → «Удалить навсегда»/«Отмена». */
function RefDangerZone({ objId, objTitle }) {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState("");
  const [h, setH] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const ok = v.trim().toLowerCase() === String(objId).toLowerCase();
  return (
    <div>
      <div style={refSecLabel}>Опасная зона</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: MUTED, maxWidth: 560, lineHeight: 1.5 }}>
        Если хотите навсегда удалить объект{objTitle ? <> «<b style={{ fontWeight: 500, color: "#444" }}>{objTitle}</b>»</> : null} со всеми этапами и документами — вам сюда.
      </div>
      <div style={{ marginTop: 16 }}>
        {done ? (
          <div style={{ fontSize: 13, fontWeight: 300, color: MUTED }}>Это демонстрация — здесь объект удалять не будем. «Сбросить» вернёт всё как было.</div>
        ) : !open ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 300, color: "#4a4a4a" }}>Хотите удалить объект?</span>
            <button type="button" onClick={() => { setOpen(true); setV(""); }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "transparent", border: "none", padding: 0, color: REF_CARROT, cursor: "pointer" }}>
              <span style={{ display: "inline-flex" }}>{RefMiniIcon.trash}</span>
              <span style={{ position: "relative", fontSize: 15, fontWeight: 600, paddingBottom: 4 }}>
                Удалить объект
                <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "#d7d7d7" }} />
                <span style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: h ? "100%" : 0, background: REF_CARROT, transition: "width .3s ease" }} />
              </span>
            </button>
          </div>
        ) : (
          <div className="ref-pop" style={{ padding: 16, borderRadius: 12, border: "1px solid #e3b4ae", background: "#fdf7f6", maxWidth: 480 }}>
            <div style={{ fontSize: 14, fontWeight: 300, color: TEXT, marginBottom: 10 }}>Чтобы подтвердить, введите номер объекта <b style={{ fontWeight: 600 }}>{objId}</b>.</div>
            <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && ok) setDone(true); }} placeholder={objId}
              style={{ width: "100%", height: 46, border: "none", outline: "none", borderRadius: 0, background: "#fff", color: TEXT, padding: "0 12px", fontFamily: UI, fontSize: 15, fontWeight: 300, boxShadow: "inset 0 -1px 0 0 #e6e6e6" }} />
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => { if (ok) setDone(true); }} disabled={!ok}
                style={{ height: 46, padding: "0 20px", borderRadius: 10, background: ok ? "#c0392b" : "#e2b6b0", color: "#fff", border: "none", fontFamily: UI, fontSize: 15, fontWeight: 300, cursor: ok ? "pointer" : "not-allowed" }}>Удалить навсегда</button>
              <button type="button" onClick={() => { setOpen(false); setV(""); }}
                style={{ height: 46, padding: "0 20px", borderRadius: 10, background: "#fff", color: TEXT, border: "1px solid #d9d9d9", fontFamily: UI, fontSize: 15, fontWeight: 300, cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function TeamDemo() {
  const phone = useIsPhone();
  const [dirty, setDirty] = React.useState(false);
  const [objStatus, setObjStatus] = React.useState("in_progress");
  const [resp, setResp] = React.useState("iv");
  const [co, setCo] = React.useState(() => new Set(["pe"]));
  const [customer, setCustomer] = React.useState(_REF_ACCOUNTS[0]);
  const [preview, setPreview] = React.useState(false);
  const [docs, setDocs] = React.useState(_INIT_DOCS);
  const [stages, setStages] = React.useState(() => ([
    { id: 1, title: "Договор и аванс", status: "done", items: [] },
    { id: 2, title: "Обследование фасада", status: "in_progress", items: ["Выезд на объект", "Фотофиксация дефектов"] },
    { id: 3, title: "Отчёт и смета", status: "not_started", items: [] },
  ]));
  const [stageName, setStageName] = React.useState("");
  const [openStage, setOpenStage] = React.useState(null); // раскрытый этап на телефоне (аккордеон) — как в реальном редакторе
  const touch = () => setDirty(true);
  const addDoc = (cat) => { setDocs((prev) => { _refDocSeq += 1; const pool = _NEW_DOCS_BY_CAT[cat] || _NEW_DOCS_BY_CAT["Договоры"]; const pick = pool[prev.filter((d) => d.cat === cat).length % pool.length]; return [...prev, { id: _refDocSeq, cat, name: pick.name, ext: pick.ext, hidden: false, fresh: true }]; }); touch(); };
  const delDoc = (docId) => { setDocs((prev) => prev.filter((d) => d.id !== docId)); touch(); };
  const toggleDocHidden = (docId) => { setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, hidden: !d.hidden } : d))); touch(); };
  const pickResp = (id) => { setResp(id); setCo((prev) => { const n = new Set(prev); n.delete(id); return n; }); touch(); };
  const toggleCo = (id) => { if (id === resp) return; setCo((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); touch(); };
  const setStage = (id, patch) => { setStages((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s))); touch(); };
  const addStageTitle = (title) => { const t = String(title || "").trim(); if (!t) return; _refStageSeq += 1; setStages((p) => [...p, { id: _refStageSeq, title: t, status: "not_started", items: [] }]); touch(); };
  const delStage = (id) => { setStages((p) => p.filter((s) => s.id !== id)); touch(); };
  const moveStage = (i, dir) => { setStages((p) => { const j = i + dir; if (j < 0 || j >= p.length) return p; const n = p.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; }); touch(); };
  const publish = () => setDirty(false);
  const reset = () => {
    setDirty(false); setObjStatus("in_progress"); setResp("iv"); setCo(new Set(["pe"])); setCustomer(_REF_ACCOUNTS[0]); setPreview(false); setDocs(_INIT_DOCS); setStageName(""); setOpenStage(null);
    setStages([
      { id: 1, title: "Договор и аванс", status: "done", items: [] },
      { id: 2, title: "Обследование фасада", status: "in_progress", items: ["Выезд на объект", "Фотофиксация дефектов"] },
      { id: 3, title: "Отчёт и смета", status: "not_started", items: [] },
    ]);
  };
  const under = { border: "none", outline: "none", background: "transparent", boxShadow: "inset 0 -1px 0 0 #e6e6e6", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "10px 2px", width: "100%" };
  const _docThread = [{ n: 1, author: "ООО «КРТ»", date: "17 июля, 15:41", text: "Когда будет готов отчёт по фасаду?", reply: { author: "CUBE", date: "17 июля, 16:20", text: "Отчёт готовим, ориентир — до конца недели." } }];

  return (
    <DemoFrame label="страница редактирования объекта" onReset={reset}
      hint="Так выглядит редактор объекта у команды — блок за блоком, как в реальном интерфейсе. Разделы идут одним столбцом (Основное → Этапы → Документы → Коммуникация → Опасная зона). Этапы добавляют снизу — «из типовых» или своим названием. Документы сгруппированы по категориям: у каждой свой «+ Добавить», а в строке — плашка расширения и действия «Открыть · Скачать · Показать/Скрыть · Удалить». Меняйте что угодно — сверху появится панель «Опубликовать изменения».">
      <div style={{ border: "1px solid #ececec", borderRadius: 14, background: "#fff", padding: phone ? "14px 13px 18px" : "18px 20px 22px" }}>

        {/* верхняя навигация редактора */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 400, color: "#888" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            К объектам
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {!preview && !dirty && !phone ? <RefHintRight style={{ marginRight: 2 }}>нажмите — предпросмотр</RefHintRight> : null}
            <RefFillBtn onClick={() => setPreview((v) => !v)}>{preview ? (phone ? "Скрыть" : "Скрыть предпросмотр") : (phone ? "Предпросмотр" : "Предпросмотр как заказчик")}</RefFillBtn>
          </span>
        </div>
        <div style={{ marginBottom: 12, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a0a0a0" }}>
          «← К объектам» — выход без потери черновика. «Предпросмотр как заказчик» — показывает, как объект видит заказчик: скрытые документы и незаполненные этапы ему не показываются.
        </div>

        {/* живой предпросмотр «как у заказчика» — та же карточка, что видит заказчик */}
        {preview ? (
          <div className="ref-pop" style={{ marginBottom: 16, border: "1.5px dotted #c7c7c7", borderRadius: 14, background: "#f8f8f8", padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: REF_CARROT }}>Предпросмотр как заказчик</span>
              <span style={{ fontSize: 11.5, fontWeight: 300, color: "#999" }}>· {customer ? (customer.name || customer.email) : "заказчик"}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>ООО «КРТ» — Фасад, Ноябрьск</div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 300, color: "#aaa" }}>KRT-02-2026</span>
              <RefPill code={objStatus} />
            </div>
            <div style={{ marginTop: 14 }}>
              {stages.filter((s) => s.title.trim()).map((s, i) => (
                <RefCustomerStage key={s.id} s={{ name: s.title, status: s.status, items: s.items }} i={i} phone={phone} />
              ))}
              {!stages.some((s) => s.title.trim()) ? <div style={{ fontSize: 13, fontWeight: 300, color: "#aaa" }}>Этапы ещё не заполнены — заказчику пока показывать нечего.</div> : null}
            </div>
          </div>
        ) : null}

        {/* панель публикации (PublishBar) — активна при изменениях */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 12, background: dirty ? "#fff7f3" : "#f7f7f7", border: "1px solid " + (dirty ? "#f3d8c9" : "#eee") }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 400, color: dirty ? "#b5502a" : "#8a8a8a" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: dirty ? REF_CARROT : "#cfcfcf" }} />
            {dirty ? "Есть неопубликованные изменения" : "Опубликовано — заказчик видит актуальную версию"}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={reset} disabled={!dirty}
              style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid #e6e6e6", background: "#fff", color: dirty ? TEXT : "#bbb", fontFamily: UI, fontSize: 13, fontWeight: 400, cursor: dirty ? "pointer" : "default" }}>Сбросить</button>
            <button type="button" onClick={publish} disabled={!dirty}
              style={{ height: 40, padding: "0 18px", borderRadius: 10, border: "none", background: dirty ? "#111" : "#d7d7d7", color: "#fff", fontFamily: UI, fontSize: 13, fontWeight: 500, cursor: dirty ? "pointer" : "default" }}>Опубликовать изменения</button>
          </span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a0a0a0" }}>
          Пока есть неопубликованные правки — панель морковная. «Опубликовать изменения» отдаёт их заказчику, «Сбросить» откатывает к последней опубликованной версии. Заказчик всегда видит только опубликованное.
        </div>

        {/* заголовок объекта: № + название + статус */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 220px", gap: phone ? 14 : 20, alignItems: phone ? "stretch" : "end" }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 300, color: "#aaa", marginBottom: 4 }}>№ KRT-02-2026</div>
            <input defaultValue="ООО «КРТ» — Фасад, Ноябрьск" onChange={touch} style={{ ...under, fontSize: 20, fontWeight: 400 }} />
          </div>
          <div>
            <div style={refFieldLabel}>Статус</div>
            <RefUnderSelect value={objStatus} options={_OBJ_STATUS_OPTS} onChange={(v) => { setObjStatus(v); touch(); }} />
          </div>
        </div>

        {/* ── ОСНОВНОЕ ── */}
        <div style={{ marginTop: 26 }}>
          <div style={refSecLabel}>Основное</div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 1fr", gap: phone ? "14px 0" : "16px 24px" }}>
            <div>
              <div style={refFieldLabel}>Заказчик — из учётных записей</div>
              <RefAccountPicker accounts={_REF_ACCOUNTS} value={customer} onPick={(a) => { setCustomer(a); touch(); }} hint={!dirty} />
            </div>
            <div><div style={refFieldLabel}>Город</div><input defaultValue="Ноябрьск" onChange={touch} style={under} /></div>
            <div><div style={refFieldLabel}>Адрес</div><input defaultValue="ул. Ленина, 12" onChange={touch} style={under} /></div>
            <div><div style={refFieldLabel}>Договор</div><input defaultValue="№ 2026-14 от 04.07.2026" onChange={touch} style={under} /></div>
            <div><div style={refFieldLabel}>Ответственный</div><RefUnderSelect value={resp} options={_respOpts} onChange={pickResp} placeholder="— не назначен —" /></div>
            <div>
              <div style={refFieldLabel}>Соисполнители</div>
              <RefCoExecutors staff={_ED_STAFF} respId={resp} selected={co} onToggle={toggleCo} hint={!dirty} />
            </div>
          </div>
        </div>

        <RefSectionRule />

        {/* ── ЭТАПЫ РАБОТ ── */}
        <div style={refSecLabel}>Этапы работ</div>
        <div style={{ marginTop: 12 }}>
          {stages.map((s, i) => (
            phone ? (
              /* Телефон: этап — карточка-аккордеон, как в реальном редакторе. Свёрнуто:
                 № • точка • название • бейдж статуса • шеврон. Тап — раскрыть редактор
                 (название, статус, «что входит», пунктир, корзина + крупные ↑/↓). */
              (() => {
                const open = openStage === s.id;
                return (
                  <div key={s.id} style={{ borderRadius: 12, background: "#fff", padding: open ? "6px 6px 12px" : 6, marginBottom: 10, transition: "background-color .16s ease" }}>
                    <button type="button" onClick={() => setOpenStage(open ? null : s.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, border: "none", background: "transparent", cursor: "pointer", padding: "8px 6px", textAlign: "left", fontFamily: UI }}>
                      <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: s.status === "not_started" ? "#fff" : _stageToneOf(s.status), border: `2px solid ${_stageToneOf(s.status)}`, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 400, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || "Без названия"}</span>
                      <RefStageStatusBadge status={s.status} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    {open && (
                      <div className="animate-svcfade" style={{ padding: "2px 6px 0" }}>
                        <input value={s.title} onChange={(e) => setStage(s.id, { title: e.target.value })} placeholder="Название этапа"
                          style={{ width: "100%", height: 40, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
                        <div style={{ marginTop: 6 }}><RefUnderSelect noDot value={s.status} options={_STAGE_STATUS_OPTS} onChange={(v) => setStage(s.id, { status: v })} /></div>
                        <div style={{ marginTop: 10 }}>
                          <RefStageItems items={s.items} hint={s.status === "in_progress"}
                            onAdd={(t) => setStage(s.id, { items: [...s.items, t] })}
                            onRemove={(idx) => setStage(s.id, { items: s.items.filter((_, j) => j !== idx) })} />
                        </div>
                        <div aria-hidden="true" style={{ height: 1, margin: "12px 0 6px", backgroundImage: "repeating-linear-gradient(to right,#d3d3d3 0 1.5px,rgba(0,0,0,0) 1.5px 9px)" }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <RefTrashBtn onClick={() => delStage(s.id)} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <RefStepArrow dir="up" disabled={i === 0} onClick={() => moveStage(i, -1)} />
                            <RefStepArrow dir="down" disabled={i === stages.length - 1} onClick={() => moveStage(i, 1)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div key={s.id} style={{ padding: "10px 4px", boxShadow: "inset 0 -1px 0 0 #e6e6e6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span title="Перетащите" style={{ cursor: "grab", color: "#c4c4c4", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0 }}>⠿</span>
                  <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: s.status === "not_started" ? "#fff" : _stageToneOf(s.status), border: `2px solid ${_stageToneOf(s.status)}`, flexShrink: 0 }} />
                  <input value={s.title} onChange={(e) => setStage(s.id, { title: e.target.value })} placeholder="Название этапа"
                    style={{ flex: 1, minWidth: 0, height: 40, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
                  <div style={{ width: 190, flexShrink: 0 }}><RefUnderSelect noDot value={s.status} options={_STAGE_STATUS_OPTS} onChange={(v) => setStage(s.id, { status: v })} /></div>
                  <RefTrashBtn onClick={() => delStage(s.id)} />
                </div>
                <div style={{ paddingLeft: 52, marginTop: 2 }}>
                  <RefStageItems items={s.items} hint={s.status === "in_progress"}
                    onAdd={(t) => setStage(s.id, { items: [...s.items, t] })}
                    onRemove={(idx) => setStage(s.id, { items: s.items.filter((_, j) => j !== idx) })} />
                </div>
              </div>
            )
          ))}
          {!stages.length ? <div style={{ padding: "10px 4px", fontSize: 13, fontWeight: 300, color: MUTED }}>Этапы не заданы.</div> : null}
        </div>

        {/* Аддер этапов — как в реальном редакторе: «Добавить из типовых» (селект) + «или» + «Своё название».
            На телефоне — стек с разделителем-пунктиром и кнопкой во всю ширину. */}
        {phone ? (
          <div style={{ marginTop: 18 }}>
            <div style={refFieldLabel}>Добавить из типовых</div>
            <RefUnderSelect value="" placeholder="Выберите этап…" options={_REF_STAGE_LIB.map((p) => ({ value: p.id, label: p.title }))} onChange={(v) => { const p = _REF_STAGE_LIB.find((x) => x.id === v); if (p) addStageTitle(p.title); }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
              <span aria-hidden="true" style={{ flex: 1, height: 1, backgroundImage: "repeating-linear-gradient(to right,#d3d3d3 0 1.5px,rgba(0,0,0,0) 1.5px 9px)" }} />
              <span style={{ color: MUTED, fontSize: 13 }}>или</span>
              <span aria-hidden="true" style={{ flex: 1, height: 1, backgroundImage: "repeating-linear-gradient(to right,#d3d3d3 0 1.5px,rgba(0,0,0,0) 1.5px 9px)" }} />
            </div>
            <div style={refFieldLabel}>Своё название</div>
            <input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Например: Монтаж" style={{ ...under }} />
            <div style={{ marginTop: 14 }}>
              <button type="button" onClick={() => { addStageTitle(stageName); setStageName(""); }}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid #111", background: "transparent", color: "#111", fontFamily: UI, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>+ Добавить</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 18, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", minWidth: 220 }}>
              <div style={refFieldLabel}>Добавить из типовых</div>
              <RefUnderSelect value="" placeholder="Выберите этап…" options={_REF_STAGE_LIB.map((p) => ({ value: p.id, label: p.title }))} onChange={(v) => { const p = _REF_STAGE_LIB.find((x) => x.id === v); if (p) addStageTitle(p.title); }} />
            </div>
            <span style={{ color: MUTED, fontSize: 13, paddingBottom: 10 }}>или</span>
            <div style={{ flex: "1 1 240px", minWidth: 220 }}>
              <div style={refFieldLabel}>Своё название</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Например: Монтаж" style={{ ...under }} />
                <RefFillBtn onClick={() => { addStageTitle(stageName); setStageName(""); }}>+ Добавить</RefFillBtn>
              </div>
            </div>
          </div>
        )}

        <RefSectionRule />

        {/* ── ДОКУМЕНТЫ ── (как в реальном редакторе: сгруппированы по категориям, у каждой
             свой счётчик и «+ Добавить»; в строке документа — плашка расширения и действия
             Открыть · Скачать · Показать/Скрыть · Удалить. На телефоне действия — иконки.) */}
        <div style={refSecLabel}>Документы <span style={{ textTransform: "none", fontWeight: 400, color: MUTED }}>— скрытые заказчик не видит</span></div>
        <div style={{ marginTop: 14 }}>
          <div aria-hidden="true" style={{ height: 1, backgroundImage: "repeating-linear-gradient(to right,#dcdcdc 0 3px,rgba(0,0,0,0) 3px 9px)" }} />
          {_DOC_CATS.map((cat, ci) => {
            const catDocs = docs.filter((d) => d.cat === cat);
            return (
              <React.Fragment key={cat}>
                <div style={{ padding: phone ? "14px 0" : "16px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: catDocs.length ? 10 : 0 }}>
                    <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#a7a7a7", fontWeight: 300 }}>{cat}<span style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>{String(catDocs.length).padStart(2, "0")}</span></div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {!dirty && ci === 0 ? <RefHintRight style={{ marginRight: 2 }}>{phone ? "нажмите" : "нажмите — добавить документ"}</RefHintRight> : null}
                      <RefFillBtn onClick={() => addDoc(cat)}>+ Добавить</RefFillBtn>
                    </span>
                  </div>
                  {catDocs.length === 0 ? (
                    <div style={{ fontSize: 13, fontWeight: 300, color: MUTED }}>Нет документов</div>
                  ) : (
                    <div style={{ border: "1px solid #e6e6e6", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                      {catDocs.map((d, i) => (
                        <div key={d.id} className={d.fresh ? "ref-pop" : undefined} style={{ display: "flex", alignItems: "center", gap: phone ? 8 : 12, padding: phone ? "10px 12px" : "12px 14px", borderTop: i ? "1px solid #f0f0f0" : "none", background: d.hidden ? "#fbfbfb" : "#fff" }}>
                          <RefExtBadge ext={d.ext} />
                          <div style={{ flex: 1, minWidth: 0, fontSize: phone ? 14 : 14, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.name}
                            {d.hidden ? <span style={{ marginLeft: 8, fontSize: 11, color: "#c05621" }}>· скрыто</span> : null}
                            {d.fresh && !d.hidden ? <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "#0a7d33" }}>загружен</span> : null}
                          </div>
                          {phone ? (
                            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                              <RefDocIconBtn title="Открыть">{RefMiniIcon.open}</RefDocIconBtn>
                              <RefDocIconBtn title="Скачать">{RefMiniIcon.download}</RefDocIconBtn>
                              <RefDocIconBtn onClick={() => toggleDocHidden(d.id)} title={d.hidden ? "Показать заказчику" : "Скрыть от заказчика"}>{d.hidden ? RefMiniIcon.eyeOff : RefMiniIcon.eye}</RefDocIconBtn>
                              <RefDocIconBtn color={REF_CARROT} onClick={() => delDoc(d.id)} title="Удалить">{RefMiniIcon.trash}</RefDocIconBtn>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <FileHoverBtn>Открыть</FileHoverBtn>
                              <FileHoverBtn>Скачать</FileHoverBtn>
                              <FileHoverBtn onClick={() => toggleDocHidden(d.id)}>{d.hidden ? "Показать" : "Скрыть"}</FileHoverBtn>
                              <RefTrashBtn onClick={() => delDoc(d.id)} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div aria-hidden="true" style={{ height: 1, backgroundImage: "repeating-linear-gradient(to right,#dcdcdc 0 3px,rgba(0,0,0,0) 3px 9px)" }} />
              </React.Fragment>
            );
          })}
        </div>

        <RefSectionRule />

        {/* ── КОММУНИКАЦИЯ ПО ОБЪЕКТУ ── */}
        <RefChat threads={_docThread} />

        <RefSectionRule />

        {/* ── ОПАСНАЯ ЗОНА ── (как боевой ObjectDangerZone: ссылка-«корзина», затем ввод № для подтверждения) */}
        <RefDangerZone objId="KRT-02-2026" objTitle="ООО «КРТ» — Фасад, Ноябрьск" />
      </div>

      {/* панель-док снизу — тот же StickyDock, что видит команда на реальном экране объекта:
          живой статус, прогресс по этапам и кнопка «Запросы» (переписка по объекту).
          На телефоне дока нет (он скрыт ниже 1024px) — поэтому и в справке его не показываем. */}
      {!phone ? (
        <>
          <div style={{ marginTop: 14 }}>
            <RefDock
              id="KRT-02-2026"
              statusLabel={(_OBJ_STATUS_OPTS.find((o) => o.v === objStatus) || {}).label || "—"}
              statusTone={(_OBJ_STATUS_OPTS.find((o) => o.v === objStatus) || {}).tone || "#8a8a8a"}
              progress={stages.length ? Math.round((stages.filter((s) => s.status === "done").length / stages.length) * 100) : null}
              cta="Запросы"
              badge={_docThread.some((t) => !t.reply)}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a0a0a0" }}>
            Док закреплён снизу экрана: слева — плитка возврата к списку, по центру — №, статус и прогресс объекта (обновляются, когда меняете статусы этапов выше), справа — mint-кнопка «Запросы» с переходом в переписку. Морковная точка на ней загорается, когда есть неотвеченный вопрос заказчика.
          </div>
        </>
      ) : null}
    </DemoFrame>
  );
}

/* Демо: заполнение этапа — 1-в-1 с реальным редактором (строка этапа + «Что входит»);
   заказчик видит пункты, когда этап «В работе». Никаких выдуманных кнопок — только то,
   что реально есть в редакторе объекта (RefUnderSelect, RefStageItems, RefCustomerStage). */
function StageEditDemo() {
  const phone = useIsPhone();
  const [view, setView] = React.useState("team");
  const [name, setName] = React.useState("Обследование фасада");
  const [items, setItems] = React.useState(["Выезд на объект", "Фотофиксация дефектов"]);
  const [status, setStatus] = React.useState("in_progress");
  const reset = () => { setView("team"); setName("Обследование фасада"); setItems(["Выезд на объект", "Фотофиксация дефектов"]); setStatus("in_progress"); };

  return (
    <DemoFrame label="этап · что входит" onReset={reset}
      hint={phone
        ? "«Глазами команды» — как заполняют этап: название сверху, статус строкой ниже, а «Что входит в этап» раскрывается по нажатию. Переключитесь на «Глазами заказчика» — пункты видны только когда этап «В работе», и раскрываются по нажатию на название."
        : "Слева — как команда заполняет этап в редакторе объекта: название и статус в одной строке, а «Что входит в этап» раскрывается по нажатию. Переключитесь на «Глазами заказчика» — пункты видны только когда этап «В работе», и раскрываются по наведению."}>
      <DemoSeg value={view} onChange={setView}
        options={[{ v: "team", label: "Глазами команды" }, { v: "customer", label: "Глазами заказчика" }]} />

      {view === "team" ? (
        <div style={{ marginTop: 14, border: "1px solid #ececec", borderRadius: 14, background: "#fff", padding: phone ? "14px 13px 16px" : "18px 20px 20px" }}>
          <div style={refSecLabel}>Этапы работ</div>
          <div style={{ marginTop: 12 }}>
            {phone ? (
              /* Телефон: название и статус — на отдельных строках (в одну не влезают), без ⠿ */
              <div style={{ border: "1px solid #ececec", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>1</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название этапа"
                    style={{ flex: 1, minWidth: 0, height: 36, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: status === "not_started" ? "#fff" : _stageToneOf(status), border: `2px solid ${_stageToneOf(status)}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}><RefUnderSelect value={status} options={_STAGE_STATUS_OPTS} onChange={setStatus} /></div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <RefStageItems items={items} hint={status === "in_progress"}
                    onAdd={(t) => setItems((p) => [...p, t])}
                    onRemove={(idx) => setItems((p) => p.filter((_, j) => j !== idx))} />
                </div>
              </div>
            ) : (
              <div style={{ padding: "10px 4px", boxShadow: "inset 0 -1px 0 0 #e6e6e6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span title="Перетащите" style={{ cursor: "grab", color: "#c4c4c4", fontSize: 16, lineHeight: 1, userSelect: "none", flexShrink: 0 }}>⠿</span>
                  <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#b0b0b0", flexShrink: 0 }}>1</span>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: status === "not_started" ? "#fff" : _stageToneOf(status), border: `2px solid ${_stageToneOf(status)}`, flexShrink: 0 }} />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название этапа"
                    style={{ flex: 1, minWidth: 0, height: 40, border: "none", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 300, color: TEXT, padding: "0 2px" }} />
                  <div style={{ width: 190, flexShrink: 0 }}><RefUnderSelect value={status} options={_STAGE_STATUS_OPTS} onChange={setStatus} /></div>
                </div>
                <div style={{ paddingLeft: 52, marginTop: 2 }}>
                  <RefStageItems items={items} hint={status === "in_progress"}
                    onAdd={(t) => setItems((p) => [...p, t])}
                    onRemove={(idx) => setItems((p) => p.filter((_, j) => j !== idx))} />
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a0a0a0" }}>
            {phone
              ? "Название сверху, статус — строкой ниже. «Что входит в этап» раскрывается по нажатию: каждый пункт — отдельной строкой. Заказчику покажем эти пункты списком через тире, когда этап «В работе»."
              : "Название и статус — в одной строке. «Что входит в этап» раскрывается по нажатию: каждый пункт — отдельной строкой. Заказчику покажем эти пункты списком через тире, когда этап «В работе»."}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", padding: phone ? "6px 13px 14px" : "6px 18px 16px" }}>
          <RefCustomerStage s={{ name: name || "Этап", status, items }} i={0} phone={phone} />
          <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 300, lineHeight: 1.5, color: "#a0a0a0" }}>
            {phone
              ? "У заказчика пункты «что входит» видны, только когда этап «В работе». Нажмите на название — детализация раскроется блоком в нашем стиле."
              : "У заказчика пункты «что входит» видны, только когда этап «В работе». Наведите на название — детализация раскроется блоком в нашем стиле."}
          </div>
        </div>
      )}
    </DemoFrame>
  );
}

/* Демо: объект глазами заказчика — статус, прогресс, этапы, документы, «Задать вопрос». */
const _CO_STAGES = [
  { name: "Договор и аванс", status: "done" },
  { name: "Обследование фасада", status: "in_progress", items: ["Выезд на объект", "Фотофиксация дефектов", "Обмерочные работы"] },
  { name: "Отчёт и смета", status: "not_started" },
  { name: "Согласование с заказчиком", status: "not_started" },
];
const _CO_TONE = { done: "#2f855a", in_progress: "#2b6cb0", not_started: "#cfcfcf" };
const _CO_LBL = { done: "Завершён", in_progress: "В работе", not_started: "Не начат" };
/* Лог изменений по объекту — 1:1 с реальной панелью «История изменений» (ChangeLogButton
   в ObjectsSection): заголовок + описание + автор·дата. Без «акцентов»-пилюль. */
const _CO_LOG = [
  { title: "Статус объекта изменён", description: "Черновик → В работе", author: "Пётр Смирнов", date: "12 июля, 10:20" },
  { title: "Открыт документ", description: "«Договор №2026-14.pdf» стал доступен вам", author: "Пётр Смирнов", date: "12 июля, 10:22" },
  { title: "Этап «Обследование фасада»", description: "Не начат → В работе", author: "Пётр Смирнов", date: "15 июля, 09:05" },
  { title: "Ответ команды на запрос 01", description: "Ответили на ваш вопрос по срокам отчёта", author: "Пётр Смирнов", date: "17 июля, 15:41" },
];
/* Маленькая подсказка-«коуч»: пульсирующая морковная точка + текст (что нажать / навести). */
function RefHintChip({ children, style }) {
  return (
    <span className="ref-hint" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 999, background: "#fff4ef", border: `1px solid ${REF_CARROT}44`, fontSize: 11, fontWeight: 500, color: REF_CARROT, whiteSpace: "nowrap", ...style }}>
      <span style={{ position: "relative", width: 7, height: 7, flexShrink: 0 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: REF_CARROT, animation: "cubeNewPulse 1.8s ease-out infinite" }} />
        <span style={{ position: "relative", display: "block", width: 7, height: 7, borderRadius: 999, background: REF_CARROT }} />
      </span>
      {children}
    </span>
  );
}

/* Маленькая «наведите» с левой стрелкой — указывает на элемент, стоящий СЛЕВА от неё.
   Пульсация текста + подрагивание стрелки влево (к тому, на что наводить). */
function RefHintLeft({ children, style }) {
  return (
    <span className="ref-hint" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: REF_CARROT, whiteSpace: "nowrap", ...style }}>
      <svg className="ref-hint-arrow-l" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
      {children}
    </span>
  );
}
/* Подпись поля с пошаговой подсказкой-чипом (для пошагового обучения в демо-формах).
   Передаётся как `label` в <Field/>; чип появляется, только когда это текущий шаг. */
function RefStepLabel({ text, hint, tip }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {text}
      {hint ? <RefHintChip style={{ padding: "2px 8px", fontSize: 10 }}>{tip}</RefHintChip> : null}
    </span>
  );
}
/* То же, но стрелка СПРАВА — указывает на элемент, стоящий СПРАВА от подсказки. */
function RefHintRight({ children, style }) {
  return (
    <span className="ref-hint" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: REF_CARROT, whiteSpace: "nowrap", ...style }}>
      {children}
      <svg className="ref-hint-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  );
}

/* Этап глазами заказчика: пункты «что входит» появляются ТОЛЬКО при наведении
   (как в реальном кабинете) — всплывающей панелью поверх, а не списком вниз.
   Пока курсор не навёл — рядом с названием пульсирует «← наведите». Название
   текущего этапа («В работе») чуть жирнее, как в боевом кабинете. */
/* Пилюля-статус этапа как у заказчика (реальный Badge: скруглённая плашка tone+фон). */
function RefStageBadge({ status }) {
  const tone = _CO_TONE[status];
  return <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 9px", borderRadius: 999, background: `${tone}1a`, color: tone, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{_CO_LBL[status]}</span>;
}
/* Этап глазами заказчика 1-в-1 с боевым CustomerStages: точка + название + пилюля-статус
   СРАЗУ после названия (не отдельным столбцом справа). Детализация «что входит»
   раскрывается по наведению — блоком в нашем стиле (заливка #f8f8f8, пунктир #c7c7c7),
   а не белой карточкой с тенью. */
function RefCustomerStage({ s, i, phone }) {
  const [hov, setHov] = React.useState(false);
  const active = s.status === "in_progress" && Array.isArray(s.items) && s.items.length > 0;
  const tone = _CO_TONE[s.status];
  // На телефоне «что входит» раскрывается по ТАПу и разворачивается вниз внутри
  // карточки (не всплывающей панелью поверх — иначе уезжает за край экрана).
  const open = active && hov;
  const rowProps = phone
    ? { onClick: () => active && setHov((v) => !v) }
    : { onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false) };
  const items = active ? (
    <div className="ref-pop" style={{ ...(phone
      ? { marginTop: 10, marginLeft: 24 }
      : { position: "absolute", top: "calc(100% - 2px)", left: 24, zIndex: 8, minWidth: 240, maxWidth: 340 }),
      background: "#f8f8f8", border: "1.5px dotted #c7c7c7", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED }}>Что входит в этап</div>
      <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
        {s.items.map((it, j) => (
          <div key={j} style={{ display: "flex", gap: 9, fontSize: 14.5, fontWeight: 300, lineHeight: 1.5, color: "#333" }}>
            <span style={{ color: MUTED, flexShrink: 0 }}>—</span>
            <span style={{ wordBreak: "break-word" }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;
  return (
    <div {...rowProps}
      style={{ position: "relative", padding: "11px 0", borderTop: i ? "1px dotted #f0f0f0" : "none", cursor: (phone && active) ? "pointer" : "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, flexShrink: 0, background: s.status === "not_started" ? "#fff" : tone, border: `2px solid ${s.status === "not_started" ? "#d0d0d0" : tone}` }} />
        <span style={{ minWidth: 0, fontSize: 14.5, fontWeight: active ? 600 : 400, color: s.status === "not_started" ? MUTED : TEXT, cursor: active ? "pointer" : "default" }}>{s.name}</span>
        <RefStageBadge status={s.status} />
        {/* Подсказка: на ПК «← наведите», на телефоне — шеврон-раскрытие справа. */}
        {active && !phone && !hov ? <RefHintLeft>наведите — что входит</RefHintLeft> : null}
        {active && phone ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={REF_CARROT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ marginLeft: "auto", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}><path d="M6 9l6 6 6-6" /></svg>
        ) : null}
      </div>
      {open ? items : null}
    </div>
  );
}

/* Ответственный + соисполнители глазами заказчика: имя с пунктирным подчёркиванием
   и «+N», по наведению — всплывающая панель «Соисполнители» (как RespHover в объекте).
   Пока не навёл — пульсирует «← наведите». */
const _CO_RESP = { name: "Пётр Смирнов", co: ["Анна Сидорова", "Игорь Кузнецов"] };
function RefRespHover({ phone }) {
  const [hov, setHov] = React.useState(false);
  const r = _CO_RESP;
  // На телефоне соисполнители раскрываются по ТАПу; длинная подпись «← наведите»
  // заменена коротким шевроном, чтобы ничего не уезжало за край.
  const wrapProps = phone
    ? { onClick: () => setHov((v) => !v) }
    : { onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false) };
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }} {...wrapProps}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color: TEXT, boxShadow: "inset 0 -1px 0 0 #d7d7d7", paddingBottom: 1, cursor: phone ? "pointer" : "default" }}>
        {r.name}
        {r.co.length ? <span style={{ fontSize: 11, fontWeight: 600, color: "#b3b3b3" }}>+{r.co.length}</span> : null}
        {phone && r.co.length ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={REF_CARROT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ transform: hov ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}><path d="M6 9l6 6 6-6" /></svg>
        ) : null}
      </span>
      {!phone && !hov ? <RefHintLeft>наведите — соисполнители</RefHintLeft> : null}
      {hov ? (
        <div className="ref-pop" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 9, minWidth: 220, maxWidth: "min(280px, 76vw)", background: "#f8f8f8", border: "1.5px dotted #c7c7c7", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>Соисполнители</div>
          <div style={{ display: "grid", gap: 6 }}>
            {r.co.map((c, j) => (
              <div key={j} style={{ display: "flex", gap: 9, fontSize: 14.5, fontWeight: 300, lineHeight: 1.5, color: "#333" }}>
                <span style={{ color: MUTED, flexShrink: 0 }}>—</span>
                <span style={{ wordBreak: "break-word" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </span>
  );
}

function CustomerObjectDemo() {
  const phone = useIsPhone();
  const [threads, setThreads] = React.useState([]);
  const [compose, setCompose] = React.useState(false);
  const [text, setText] = React.useState("");
  const [docNote, setDocNote] = React.useState("");
  const [sub, setSub] = React.useState(false);
  const [logOpen, setLogOpen] = React.useState(false);
  const doneN = _CO_STAGES.filter((s) => s.status === "done").length;
  const pct = Math.round((doneN / _CO_STAGES.length) * 100);
  const awaiting = threads.length > 0 && !threads[threads.length - 1].reply;
  const send = () => { const t = text.trim() || "Уточните, пожалуйста, сроки по отчёту."; setThreads((p) => [...p, { n: p.length + 1, author: "Вы (заказчик)", date: "сегодня, 15:10", text: t, reply: null }]); setText(""); setCompose(false); };
  const reset = () => { setThreads([]); setCompose(false); setText(""); setDocNote(""); setSub(false); setLogOpen(false); };
  const under = { border: "none", borderBottom: "1px solid #e6e6e6", outline: "none", background: "transparent", fontFamily: UI, fontSize: 15, fontWeight: 400, color: TEXT, padding: "10px 2px", width: "100%", resize: "none" };

  return (
    <DemoFrame label="объект глазами заказчика" onReset={reset}
      hint={phone
        ? "Так объект выглядит у заказчика на телефоне: статус, прогресс, детализация текущего этапа (по тапу) и открытые документы. Нажмите «Задать вопрос» — запрос встанет в реестр «Коммуникация по объекту» со статусом «Ожидает ответа»."
        : "Так объект выглядит у заказчика: статус, прогресс, детализация текущего этапа, открытые документы и панель-док снизу. Нажмите «Задать вопрос» — запрос встанет в реестр «Коммуникация по объекту» со статусом «Ожидает ответа»."}>
      <div style={{ position: "relative", overflow: "hidden", border: "1px dotted #dcdcdc", borderRadius: 12, background: "#fff", padding: phone ? 13 : 18 }}>
        {/* шапка — те самые две иконки, что стоят в шапке объекта у заказчика */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 500, color: TEXT }}>ООО «КРТ» — Фасад, Ноябрьск</div>
            <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, fontWeight: 300, color: "#aaa" }}>KRT-02-2026</span>
              <RefPill code="in_progress" />
            </div>
          </div>
          {/* иконки шапки + подсказка «нажмите» — единый блок c выравниванием по центру, чтобы подсказка стояла ровно напротив иконок */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!logOpen ? (
              <span className="ref-hint" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: REF_CARROT, whiteSpace: "nowrap" }}>
                нажмите
                <svg className="ref-hint-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            ) : null}
            <RefObjIconBtn title="История изменений по объекту" active={logOpen} onClick={() => setLogOpen((v) => !v)}>
              <RefTrackIcon />
            </RefObjIconBtn>
            <RefObjIconBtn title={sub ? "Уведомления на e-mail включены" : "Подписка на e-mail-уведомления"} active={sub} onClick={() => setSub((v) => !v)}>
              <RefExtIcon />
            </RefObjIconBtn>
          </div>
        </div>
        {/* ответственный по объекту + соисполнители — на всю ширину карточки, чтобы имя не переносилось на узких экранах (iPhone SE) */}
        <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, fontWeight: 300, color: "#999" }}>Ответственный:</span>
          <RefRespHover phone={phone} />
        </div>

        {/* легенда: что делает каждая иконка в шапке объекта */}
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 300, color: "#999" }}>
            <span style={{ color: "#888", display: "inline-flex" }}><RefTrackIcon size={15} /></span>
            История изменений — что и когда менялось по объекту
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 300, color: "#999" }}>
            <span style={{ color: sub ? REF_CARROT : "#888", display: "inline-flex" }}><RefExtIcon size={15} /></span>
            Подписка на e-mail — присылать уведомления на почту ({sub ? "включена" : "выключена"})
          </span>
        </div>

        {/* панель «История изменений» — выезжает СПРАВА внутри карточки (как в реальном кабинете) */}
        {logOpen ? (
          <>
            <div onClick={() => setLogOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.05)", zIndex: 5, borderRadius: 12 }} />
            <div className="ref-drawer" style={{ position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 6, width: "min(360px, 90%)", background: "#f4f4f3", borderLeft: "1px solid #ececec", boxShadow: "-18px 0 44px rgba(0,0,0,.12)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 18px 14px", borderBottom: "1px solid #ececec" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#999" }}>История изменений</div>
                  <div style={{ marginTop: 3, fontSize: 17, fontWeight: 600, color: TEXT }}>Что менялось по объекту</div>
                </div>
                <button type="button" onClick={() => setLogOpen(false)} title="Закрыть" aria-label="Закрыть"
                  style={{ flexShrink: 0, border: "none", background: "none", cursor: "pointer", fontSize: 24, lineHeight: 1, color: "#999", padding: 2 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#555"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#999"; }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {_CO_LOG.map((l, i) => (
                    <div key={i} style={{ position: "relative", paddingLeft: 22 }}>
                      <span style={{ position: "absolute", left: 3, top: 4, width: 9, height: 9, borderRadius: 999, background: "transparent", border: "1.5px solid #b3b3b3", zIndex: 1 }} />
                      {i < _CO_LOG.length - 1 ? <span style={{ position: "absolute", left: 7, top: 16, bottom: -18, width: 1, backgroundImage: "repeating-linear-gradient(to bottom, #c4c4c4 0 1px, rgba(0,0,0,0) 1px 6px)" }} /> : null}
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{l.title}</div>
                      {l.description ? <div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 300, lineHeight: 1.45, color: "#444", wordBreak: "break-word" }}>{l.description}</div> : null}
                      <div style={{ marginTop: 4, fontSize: 12, color: "#999" }}>{l.author}{l.author && l.date ? " · " : ""}{l.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* прогресс */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#e6e6e6", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#111", borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: TEXT }}>{pct}%</span>
        </div>

        {/* этапы (только чтение). Детализация текущего этапа раскрывается по наведению. */}
        <div style={{ marginTop: 14, borderTop: "1px dotted #ececec" }}>
          {_CO_STAGES.map((s, i) => <RefCustomerStage key={i} s={s} i={i} phone={phone} />)}
        </div>

        {/* документы (только открытые) — у свежего метка «New» */}
        <div style={{ marginTop: 12, borderTop: "1px dotted #ececec", paddingTop: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 400, color: "#999", marginBottom: 8 }}>Документы, открытые вам</div>
          {[{ name: "Смета (предварительная).xlsx", fresh: true }, { name: "Договор №2026-14.pdf", fresh: false }].map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px dotted #f4f4f4" : "none" }}>
              <span style={{ minWidth: 0, fontSize: 13, fontWeight: 300, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
              {d.fresh ? <NewPill /> : null}
              {phone ? (
                <span style={{ marginLeft: "auto", display: "flex", gap: 2, flexShrink: 0 }}>
                  <RefDocIconBtn title="Открыть" onClick={() => setDocNote("Документ открылся во встроенном просмотрщике на весь экран (демо).")}>{RefMiniIcon.open}</RefDocIconBtn>
                  <RefDocIconBtn title="Скачать" onClick={() => setDocNote("Файл скачивается по защищённой ссылке (демо).")}>{RefMiniIcon.download}</RefDocIconBtn>
                </span>
              ) : (
                <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <FileHoverBtn onClick={() => setDocNote("Документ открылся во встроенном просмотрщике (демо).")}>Открыть</FileHoverBtn>
                  <FileHoverBtn onClick={() => setDocNote("Файл скачивается по защищённой ссылке (демо).")}>Скачать</FileHoverBtn>
                </span>
              )}
            </div>
          ))}
          {docNote ? <div key={docNote} className="ref-pop" style={{ marginTop: 8, fontSize: 12, fontWeight: 300, color: "#2f855a" }}>{docNote}</div> : null}
        </div>

        {/* вопросы — реальный реестр «Коммуникация по объекту» */}
        <div style={{ marginTop: 14, borderTop: "1px dotted #ececec", paddingTop: 16 }}>
          <RefChat threads={threads} />

          <div style={{ marginTop: 16 }}>
            {compose ? (
              <div className="ref-pop">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
                  placeholder="Напишите вопрос команде…" autoFocus style={{ ...under, height: 96 }} />
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={send}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, height: 52, minWidth: phone ? 0 : 210, width: phone ? "100%" : undefined, borderRadius: 10, border: "none", background: "#1c1c1c", color: "#fff", fontFamily: UI, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".02em", cursor: "pointer" }}>
                    Отправить
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                  <button type="button"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 10, border: "1px solid #e6e6e6", background: "#f8f8f8", color: TEXT, fontFamily: UI, fontSize: 13, fontWeight: 400, padding: "0 18px", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 18a5 5 0 010-10 6 6 0 0111.7 1.7A4 4 0 1119 18H7z" /><path d="M12 14V8m0 0l-3 3m3-3l3 3" /></svg>
                    Прикрепить файл
                  </button>
                  <button type="button" onClick={() => { setCompose(false); setText(""); }}
                    style={{ height: 52, borderRadius: 10, border: "1px solid #e6e6e6", background: "#f8f8f8", color: TEXT, fontFamily: UI, fontSize: 13, fontWeight: 400, padding: "0 18px", cursor: "pointer" }}>Отмена</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setCompose(true)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 52, minWidth: phone ? 0 : 240, width: phone ? "100%" : undefined, borderRadius: 10, border: "none", background: "#1c1c1c", color: "#fff", fontFamily: UI, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".02em", cursor: "pointer" }}>
                Задать вопрос
              </button>
            )}
          </div>
        </div>
      </div>

      {/* панель-док снизу — только на компьютере; на телефоне дока нет,
          «Задать вопрос» доступно прямо в карточке выше */}
      {!phone ? (
        <div style={{ marginTop: 14 }}>
          <RefDock progress={pct} cta="Задать вопрос" badge={awaiting} />
        </div>
      ) : null}
    </DemoFrame>
  );
}

/* ===== Файлы: сводный список всех документов по всем объектам ===== */
const _extOf = (s) => { const m = /\.([a-z0-9]+)$/i.exec(String(s || "")); return m ? m[1].toLowerCase() : ""; };
const _stripExt = (s) => String(s || "").replace(/\.[a-z0-9]+$/i, "");
const _dotExt = (s) => { const e = _extOf(s); return e ? "." + e : ""; };
const _safeName = (s) => String(s || "файл").replace(/[\\/:*?"<>|]+/g, "_").trim() || "файл";
const _fmtBytes = (n) => {
  const b = Number(n) || 0;
  if (b < 1024) return b + " Б";
  if (b < 1024 * 1024) return (b / 1024).toFixed(b < 10 * 1024 ? 1 : 0) + " КБ";
  return (b / 1024 / 1024).toFixed(1) + " МБ";
};
const _fmtDate = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? `${m[3]}.${m[2]}.${m[1]}` : (s || "—"); };

// Кнопка с фоном страницы (light) или тёмная (dark) + ховер-эффект.
function FileHoverBtn({ variant = "light", disabled, onClick, children, style }) {
  const [h, setH] = React.useState(false);
  const on = h && !disabled;
  const v = variant === "dark"
    ? { border: "none", background: on ? "#2b2b2b" : "#111", color: "#fff" }
    : { border: "1px solid " + (on ? "#c8c8c8" : "#e2e2e2"), background: on ? "#f2f2f2" : "#fff", color: TEXT };
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 34, padding: "0 14px", borderRadius: 9, fontFamily: UI, fontSize: 13, fontWeight: 300, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "background-color .15s ease, border-color .15s ease", ...v, ...style }}>
      {children}
    </button>
  );
}

function AdminFiles({ canDownload = true }) {
  // На планшете (iPad Air портрет) широкая таблица файлов не помещается —
  // отдаём тот же карточный список, что и на телефоне (порог 1023, как isDesktop ЛК).
  const phone = useIsTabletDown();
  const [objs, setObjs] = React.useState(() => { try { return DB.listObjects(); } catch { return []; } });
  const [q, setQ] = React.useState("");
  const [fStatus, setFStatus] = React.useState("");
  const [fResp, setFResp] = React.useState("");
  const [fCity, setFCity] = React.useState("");
  const [openId, setOpenId] = React.useState(null);       // null = список объектов; иначе — файлы объекта
  const [sort, setSort] = React.useState({ by: "date", dir: "desc" });
  const [busy, setBusy] = React.useState(false);          // сборка архива идёт
  const [prog, setProg] = React.useState({ done: 0, total: 0 });
  const [dlKey, setDlKey] = React.useState("");           // ключ файла, который сейчас качаем по одному

  React.useEffect(() => {
    try { DB.hydrateObjects && DB.hydrateObjects(); } catch {}
    const on = () => { try { setObjs(DB.listObjects()); } catch {} };
    window.addEventListener("objects:changed", on);
    return () => window.removeEventListener("objects:changed", on);
  }, []);

  // Объекты с реально загруженными файлами (есть S3-ключ) + мета для инфо/поиска.
  const cards = React.useMemo(() => {
    const out = [];
    for (const o of objs || []) {
      const files = (o.documents || []).filter((d) => d.key).map((d) => ({
        key: d.key,
        name: d.file || d.title || "файл",
        title: d.title || d.file || "Документ",
        category: d.category || "",
        type: d.type || _extOf(d.file || ""),
        size: d.size || 0,
        status: d.status || "",
        date: d.uploadedAt || "",
        by: d.uploadedBy || "",
        objId: o.id,
      }));
      if (!files.length) continue;
      out.push({
        id: o.id,
        title: o.title || o.id,
        customerName: o.customerName || "",
        inn: o.inn || "",
        kpp: o.kpp || "",
        city: o.city || "",
        address: o.address || "",
        contractNumber: o.contractNumber || "",
        responsibleName: o.responsibleName || "",
        status: o.status || "",
        files,
        size: files.reduce((a, f) => a + (f.size || 0), 0),
        haystack: `${o.title || ""} ${o.id} ${o.customerName || ""} ${o.inn || ""} ${o.kpp || ""} ${o.city || ""} ${o.address || ""} ${o.contractNumber || ""} ${o.responsibleName || ""} ${files.map((f) => `${f.title} ${f.name} ${f.category}`).join(" ")}`.toLowerCase(),
      });
    }
    return out;
  }, [objs]);

  const respOpts = React.useMemo(() => [...new Set(cards.map((c) => c.responsibleName).filter(Boolean))].sort(), [cards]);
  const cityOpts = React.useMemo(() => [...new Set(cards.map((c) => c.city).filter(Boolean))].sort(), [cards]);

  const groups = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    return cards.filter((c) =>
      (!s || c.haystack.includes(s)) &&
      (!fStatus || c.status === fStatus) &&
      (!fResp || c.responsibleName === fResp) &&
      (!fCity || c.city === fCity)
    );
  }, [cards, q, fStatus, fResp, fCity]);

  const activeCount = [q.trim(), fStatus, fResp, fCity].filter(Boolean).length;
  const resetFilters = () => { setQ(""); setFStatus(""); setFResp(""); setFCity(""); };
  const rows = cards.flatMap((c) => c.files); // для счётчика «всего файлов»

  const downloadOne = async (r) => {
    if (busy || dlKey) return;
    setDlKey(r.key);
    try {
      const url = await DB.downloadUrl(r.key, r.name, { inline: false });
      const a = document.createElement("a"); a.href = url; a.download = r.name; document.body.appendChild(a); a.click(); a.remove();
    } catch { window.showDockToast?.("Не удалось скачать файл", 3500, "error"); }
    finally { setDlKey(""); }
  };

  const downloadZip = async (list, zipName) => {
    if (busy || !list.length) return;
    setBusy(true); setProg({ done: 0, total: list.length });
    let ok = 0, fail = 0;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const used = new Set();
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        try {
          const url = await DB.downloadUrl(r.key, r.name, { inline: false });
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(String(resp.status));
          const blob = await resp.blob();
          const folder = _safeName(r.objId);
          let path = `${folder}/${_safeName(r.name)}`;
          let n = 2;
          while (used.has(path)) { path = `${folder}/${_safeName(_stripExt(r.name))} (${n})${_dotExt(r.name)}`; n++; }
          used.add(path);
          zip.file(path, blob);
          ok++;
        } catch { fail++; }
        setProg({ done: i + 1, total: list.length });
      }
      if (!ok) { window.showDockToast?.("Не удалось собрать архив (файлы недоступны)", 4000, "error"); return; }
      const out = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a"); a.href = url; a.download = zipName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      if (fail) window.showDockToast?.(`Готово. ${fail} файл(ов) пропущено из-за ошибки`, 4000, "error");
    } catch { window.showDockToast?.("Не удалось собрать архив", 3500, "error"); }
    finally { setBusy(false); setProg({ done: 0, total: 0 }); }
  };

  const openObj = React.useMemo(() => cards.find((c) => c.id === openId) || null, [cards, openId]);

  const sortedItems = React.useMemo(() => {
    if (!openObj) return [];
    const mul = sort.dir === "asc" ? 1 : -1;
    const keyOf = (r) => sort.by === "size" ? (r.size || 0)
      : sort.by === "file" ? String(r.name || "").toLowerCase()
      : String(r[sort.by] || "").toLowerCase();
    return openObj.files.slice().sort((a, b) => {
      const x = keyOf(a), y = keyOf(b);
      return (x < y ? -1 : x > y ? 1 : 0) * mul;
    });
  }, [openObj, sort]);

  // ── Файлы внутри объекта: таблица с точечной сеткой ──
  if (openId) {
    const items = sortedItems;
    const th = { textAlign: "left", padding: "9px 12px", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#999", fontWeight: 400, borderBottom: "1px dotted #c7c7c7", borderRight: "1px dotted #e6e6e6", whiteSpace: "nowrap" };
    const td = { padding: "11px 12px", fontSize: 13, color: TEXT, fontWeight: 300, borderBottom: "1px dotted #e2e2e2", borderRight: "1px dotted #ededed", verticalAlign: "middle" };
    const arrow = (key) => sort.by === key ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
    const toggleSort = (key) => setSort((s) => ({ by: key, dir: s.by === key && s.dir === "asc" ? "desc" : "asc" }));
    const SortTh = ({ k, label, extra }) => (
      <th style={{ ...th, cursor: "pointer", userSelect: "none", color: sort.by === k ? TEXT : "#999", ...extra }} onClick={() => toggleSort(k)} title="Сортировать">
        {label}{arrow(k)}
      </th>
    );
    return (
      <div key={`files-${openId}`} className="animate-svcfade" style={{ fontFamily: UI, marginTop: 8 }}>
        <button type="button" onClick={() => setOpenId(null)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К объектам</button>
        <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: TEXT }}>{openObj ? (openObj.customerName ? `${openObj.customerName} — ${openObj.title}` : openObj.title) : openId}</div>
            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 300, color: "#999" }}>{openId} · {items.length} файл(ов){openObj?.status ? ` · ${DB.labelOf(DB.OBJECT_STATUSES, openObj.status)}` : ""}</div>
          </div>
          {canDownload && (
            <FileHoverBtn variant="dark" disabled={busy || !items.length} onClick={() => downloadZip(items, `${_safeName(openId)}.zip`)} style={{ height: 40, padding: "0 18px" }}>
              {busy ? `Собираю архив… ${prog.done}/${prog.total}` : "Скачать архивом"}
            </FileHoverBtn>
          )}
        </div>

        {openObj && (openObj.inn || openObj.city || openObj.address || openObj.contractNumber || openObj.responsibleName) ? (
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 22px", fontSize: 13, fontFamily: UI }}>
            {openObj.inn ? <span style={{ color: "#888" }}>ИНН {openObj.inn}{openObj.kpp ? ` · КПП ${openObj.kpp}` : ""}</span> : null}
            {openObj.address ? <span style={{ color: "#888" }}>{openObj.address}</span> : null}
            {openObj.city ? <span style={{ color: "#888" }}>{openObj.city}</span> : null}
            {openObj.contractNumber ? <span style={{ color: "#888" }}>Договор {openObj.contractNumber}</span> : null}
            {openObj.responsibleName ? <span style={{ color: "#888" }}>Ответственный: {openObj.responsibleName}</span> : null}
          </div>
        ) : null}

        {!items.length ? (
          <div style={{ marginTop: 28, fontSize: 14, fontWeight: 300, color: "#999" }}>У объекта нет загруженных файлов.</div>
        ) : (
          phone ? (
          <div style={{ marginTop: 20 }}>
            <div style={{ borderTop: "1px dotted #ddd" }} />
            {items.map((r) => (
              <React.Fragment key={r.key}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 2px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: TEXT, lineHeight: 1.35, wordBreak: "break-word" }}>{r.title}</div>
                    {r.category ? <div style={{ marginTop: 2, fontSize: 12, color: "#aaa", fontWeight: 300 }}>{r.category}</div> : null}
                    <div style={{ marginTop: 4, fontSize: 12, color: "#888", fontWeight: 300, wordBreak: "break-word" }}>{r.name}</div>
                    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 10px", fontSize: 12, fontWeight: 300 }}>
                      {r.type ? <span style={{ color: "#888", textTransform: "uppercase" }}>{r.type}</span> : null}
                      {r.size ? <span style={{ color: "#888" }}>{_fmtBytes(r.size)}</span> : null}
                      <span style={{ color: "#888" }}>{_fmtDate(r.date)}</span>
                      <span style={{ color: r.status === "draft" ? "#b26a00" : "#2a7" }}>
                        {r.status === "draft" ? "черновик" : r.status === "published" ? "опубликован" : (r.status || "—")}
                      </span>
                    </div>
                  </div>
                  {canDownload && (
                    <FileHoverBtn disabled={!!dlKey || busy} onClick={() => downloadOne(r)} style={{ flexShrink: 0, height: 34, padding: "0 12px" }}>
                      {dlKey === r.key ? "…" : "Скачать"}
                    </FileHoverBtn>
                  )}
                </div>
                <div style={{ borderTop: "1px dotted #ddd" }} />
              </React.Fragment>
            ))}
          </div>
          ) : (
          <div style={{ marginTop: 22, overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", border: "1px dotted #c7c7c7", fontFamily: UI }}>
              <thead>
                <tr>
                  <SortTh k="title" label="Документ" />
                  <SortTh k="file" label="Файл" />
                  <SortTh k="type" label="Тип" extra={{ textAlign: "center", width: 70 }} />
                  <SortTh k="size" label="Размер" extra={{ textAlign: "right", width: 100 }} />
                  <SortTh k="date" label="Дата" extra={{ textAlign: "right", width: 110 }} />
                  <SortTh k="status" label="Статус" extra={{ width: 130 }} />
                  {canDownload && <th style={{ ...th, textAlign: "center", width: 120, borderRight: "none", cursor: "default" }}>Действие</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.key}>
                    <td style={{ ...td, fontWeight: 400, maxWidth: 320 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      {r.category ? <div style={{ marginTop: 2, fontSize: 11, color: "#aaa" }}>{r.category}</div> : null}
                    </td>
                    <td style={{ ...td, color: "#666", maxWidth: 280 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    </td>
                    <td style={{ ...td, textAlign: "center", color: "#888", textTransform: "uppercase" }}>{r.type || "—"}</td>
                    <td style={{ ...td, textAlign: "right", color: "#666", whiteSpace: "nowrap" }}>{r.size ? _fmtBytes(r.size) : "—"}</td>
                    <td style={{ ...td, textAlign: "right", color: "#666", whiteSpace: "nowrap" }} title={r.by ? `Загрузил: ${r.by}` : undefined}>{_fmtDate(r.date)}</td>
                    <td style={td}>
                      <span style={{ fontSize: 12, color: r.status === "draft" ? "#b26a00" : "#2a7", fontWeight: 300 }}>
                        {r.status === "draft" ? "черновик" : r.status === "published" ? "опубликован" : (r.status || "—")}
                      </span>
                    </td>
                    {canDownload && (
                      <td style={{ ...td, textAlign: "center", borderRight: "none" }}>
                        <FileHoverBtn disabled={!!dlKey || busy} onClick={() => downloadOne(r)} style={{ height: 30, padding: "0 12px" }}>
                          {dlKey === r.key ? "…" : "Скачать"}
                        </FileHoverBtn>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        )}
        <div style={{ height: 58 }} />
      </div>
    );
  }

  // ── Список объектов ──
  return (
    <div key="files-list" className="animate-svcfade" style={{ fontFamily: UI, marginTop: 8 }}>
      <button type="button" onClick={() => adminNav("/account/admin")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, color: "#777" }}>← К модулям</button>
      <div style={{ marginTop: 14, fontSize: 22, fontWeight: 600, color: TEXT }}>Файлы</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#777" }}>
        Выберите объект — внутри его файлы. Всего {rows.length} файл(ов) в {new Set(rows.map((r) => r.objId)).size} объект(ах).
      </div>

      <div style={{ marginTop: 20 }}>
        <FilterBar
          search={{ value: q, onChange: setQ, placeholder: "Поиск по объектам и файлам…" }}
          filters={[
            { value: fStatus, onChange: setFStatus, width: 170, placeholder: "Статус",
              options: [{ value: "", label: "Все статусы" }, ...DB.OBJECT_STATUSES.map((s) => ({ value: s.code, label: s.label, dotColor: s.tone }))] },
            { value: fResp, onChange: setFResp, width: 190, placeholder: "Ответственный",
              options: [{ value: "", label: "Все ответственные" }, ...respOpts.map((v) => ({ value: v, label: v }))] },
            { value: fCity, onChange: setFCity, width: 150, placeholder: "Город",
              options: [{ value: "", label: "Все города" }, ...cityOpts.map((v) => ({ value: v, label: v }))] },
          ]}
          activeCount={activeCount}
          onReset={resetFilters}
        />
      </div>

      {!groups.length ? (
        <div style={{ marginTop: 28, fontSize: 14, fontWeight: 300, color: "#999" }}>
          {rows.length ? "Ничего не найдено." : "Пока нет загруженных файлов по объектам."}
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <div style={{ borderTop: "1px dotted #ddd" }} />
          {groups.map((c) => {
            const meta = [
              c.inn ? `ИНН ${c.inn}${c.kpp ? " / КПП " + c.kpp : ""}` : "",
              c.city,
              c.contractNumber ? `Договор ${c.contractNumber}` : "",
              c.responsibleName ? `Отв.: ${c.responsibleName}` : "",
            ].filter(Boolean).join("  ·  ");
            return (
              <React.Fragment key={c.id}>
                <div onClick={() => setOpenId(c.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 8px", margin: "0 -8px", cursor: "pointer", transition: "background-color .14s ease" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.customerName ? <span>{c.customerName} <span style={{ color: "#bbb", fontWeight: 300 }}>—</span> {c.title}</span> : c.title}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, fontWeight: 300, color: "#999" }}>
                      {c.id} · {c.files.length} файл(ов){c.size ? ` · ${_fmtBytes(c.size)}` : ""}{c.status ? ` · ${DB.labelOf(DB.OBJECT_STATUSES, c.status)}` : ""}
                    </div>
                    {meta ? <div style={{ marginTop: 4, fontSize: 12, fontWeight: 300, color: "#b0b0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</div> : null}
                  </div>
                  {canDownload && (
                    <FileHoverBtn disabled={busy}
                      onClick={(e) => { e.stopPropagation(); downloadZip(c.files, `${_safeName(c.id)}.zip`); }}
                      style={{ flexShrink: 0 }}>Архивом</FileHoverBtn>
                  )}
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#b1b1b1", flexShrink: 0 }}>
                    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ borderTop: "1px dotted #ddd" }} />
              </React.Fragment>
            );
          })}
        </div>
      )}
      <div style={{ height: 58 }} />
    </div>
  );
}

/* Создание учётной записи вручную (админ заводит заказчика).
   Два способа входа: по e-mail ИЛИ по логину (заказчик потом сам добавит и подтвердит почту).
   Опционально — подтянуть организацию по ИНН (DaData), эти данные позже попадут в объект. */
function AdminCreateAccount({ token }) {
  // На планшете/телефоне форма узкая (maxWidth 520) — центрируем колонку, чтобы
  // не липла к левому краю широкого экрана iPad Air. На десктопе (в фикс-колонке ЛК)
  // оставляем как есть — слева.
  const narrow = useIsTabletDown();
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
    <div style={{ fontFamily: UI, marginTop: 8, ...(narrow && !done ? { maxWidth: 560, marginLeft: "auto", marginRight: "auto" } : null) }}>
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

          {/* Выход после того, как всё готово. Обе кнопки — спокойные (светлая плашка без
              контура), чтобы «Готово» не перетягивало случайный клик до создания объекта. */}
          <div style={{ marginTop: 30, maxWidth: 760, borderTop: "1px solid #ececec", paddingTop: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 300, color: "#999", marginBottom: 12, lineHeight: 1.5 }}>
              Сначала сформируйте лист доступа выше — а когда закончите, вернитесь к модулям или заведите ещё одну учётку.
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={() => adminNav("/account/admin")}
                style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "none", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400, color: TEXT, transition: "background-color .15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f2f2f1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}>
                Готово — к модулям
              </button>
              <button type="button" onClick={reset}
                style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "none", background: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 400, color: TEXT, transition: "background-color .15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f2f2f1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}>
                Создать ещё учётку
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-svcfade" style={{ marginTop: 22, maxWidth: 520, display: "grid", gap: 18 }}>
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
                style={{ height: FIELD_H, padding: "0 18px", borderRadius: 10, border: "none", background: "#1c1c1c", color: "#fff", cursor: "pointer", fontFamily: UI, fontSize: 14, fontWeight: 300, whiteSpace: "nowrap", transition: "background-color .15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2a2a2a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1c1c1c"; }}>↻ Другой</button>
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
  const phone = useIsPhone();
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
          <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 1fr", gap: 18 }}>
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
      style={{ height: 48, padding: "0 22px", borderRadius: 10, border: "none", background: "#1c1c1c", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.85 : 1, fontFamily: UI, fontSize: 15, fontWeight: 300, transition: "background-color .15s ease" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#2a2a2a"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1c1c1c"; }}>
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
  // Тик перерисовки после установки прав из /auth/me (can() — модульное состояние).
  const [, setMyPermsTick] = React.useState(0);
  // Пока тянем /me — показываем спиннер, чтобы не мелькали пустые поля профиля.
  const [booting, setBooting] = React.useState(true);

  /* поля */
  const [username, setUsername] = React.useState("");
  const [display, setDisplay] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [groupCode, setGroupCode] = React.useState("");
  const [city, setCity] = React.useState("");
  const [timezone, setTimezone] = React.useState(DEFAULT_TZ);
  const [about, setAbout] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [inn, setInn] = React.useState("");
  const [kpp, setKpp] = React.useState("");
  const [legalAddress, setLegalAddress] = React.useState("");
  const [avatar, setAvatar] = React.useState(null);
  const [emailOptIn, setEmailOptIn] = React.useState(false);

  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  // Снимок исходных значений профиля — по нему решаем, показывать ли «Сохранить»
  // (кнопка на мобилке возникает только при реальных изменениях).
  const [snapshot, setSnapshot] = React.useState(null);
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
    // Показываем «подтверждена» ОДИН раз — при первом визите после подтверждения.
    // Дальше не мигаем на каждом заходе: ставим флаг по адресу почты.
    const flagKey = `profile:vbadgeShown:${userEmail}`;
    try { if (localStorage.getItem(flagKey)) { setVbadgeShow(false); setVbadgeMount(false); return; } } catch {}
    try { localStorage.setItem(flagKey, "1"); } catch {}
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
    if (/\/account\/help(\/|$)/.test(pathname))     return "help";
    return "profile";
  }, [pathname]);
  const adminModule = React.useMemo(() => {
    if (/\/account\/admin\/employees/.test(pathname)) return "employees";
    if (/\/account\/admin\/accounts/.test(pathname))  return "accounts";
    if (/\/account\/admin\/create-account/.test(pathname)) return "create-account";
    if (/\/account\/admin\/files/.test(pathname)) return "files";
    if (/\/account\/admin\/templates/.test(pathname)) return "templates";
    if (/\/account\/admin\/projects/.test(pathname)) return "projects";
    if (/\/account\/admin\/reference/.test(pathname)) return "reference";
    return null;
  }, [pathname]);

  // внутри подпунктов админки (сотрудники / учётки / создание) прячем стикидок,
  // чтобы не мешал работе со списками (без блокировки скролла страницы)
  React.useEffect(() => {
    // Справка (у команды /account/admin/reference, у заказчика /account/help) содержит
    // свои демо-доки, поэтому реальный StickyDock там прячем — иначе на десктопе (≥1280,
    // где док виден) он наезжает на демонстрацию. На планшете (<1280) док и так скрыт
    // глобально CSS (StickyDock.jsx, @media max-width:1279) — отдельная логика не нужна.
    const hide = (tab === "admin" && !!adminModule) || tab === "help";
    document.body.classList.toggle("dock-off", hide);
    return () => document.body.classList.remove("dock-off");
  }, [tab, adminModule]);

  /* подхватываем юзера */
  React.useEffect(() => {
    (async () => {
      try {
      let t = sessionStorage.getItem("auth:accessToken");
      // 8 000 мс — как в auth.js: короткий таймаут обрывал запрос ПОСЛЕ ротации
      // rt-cookie на сервере, следующий refresh тоже падал → 401 на /objects и /adm.
      if (!t) t = await apiRefresh(8000);
      if (!t) return;

      // Проверяем токен. Если протух (apiMe пустой) — обновляем и берём свежий,
      // иначе админ-список (/admin/users) и DaData-прокси получают 401 и «молча»
      // возвращают пусто: список учёток не грузится, ИНН не подтягивается.
      let u = await apiMe(t);
      if (!u) {
        const fresh = await apiRefresh(8000);
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
      const admin = Boolean(u.isAdmin || u.role === "admin" || u.role === "manager" || u.group === "admin");
      setIsAdmin(admin);
      try { sessionStorage.setItem("auth:isAdmin", admin ? "1" : "0"); } catch {}
      // Реальные права из бэкенда → рантайм-хранилище (can()). Админ — всё; иначе набор от сервера.
      setMyAuth({ role: u.role, perms: u.perms, permOverrides: u.permOverrides });
      setMyPermsTick((n) => n + 1); // перерисовать зависимые от прав элементы
      setCity(String(u.city || ""));
      { const tz = RU_TIMEZONES.some((z) => z.tz === u.timezone) ? u.timezone : DEFAULT_TZ;
        setTimezone(tz);
        try { localStorage.setItem("profile:timezone", tz); } catch {} }
      setAbout(String(u.about || ""));
      setOrg(String(u.org || u.organization || ""));
      setInn(String(u.inn || ""));
      setKpp(String(u.kpp || ""));
      setLegalAddress(String(u.legalAddress || u.orgAddress || ""));
      // Снимок исходной формы — чтобы «Сохранить» показывалось только при изменениях.
      setSnapshot({
        display: String(u.name || ""),
        phone: String(u.phone || ""),
        city: String(u.city || ""),
        timezone: RU_TIMEZONES.some((z) => z.tz === u.timezone) ? u.timezone : DEFAULT_TZ,
        about: String(u.about || ""),
        org: String(u.org || u.organization || ""),
        inn: String(u.inn || ""),
        kpp: String(u.kpp || ""),
        legalAddress: String(u.legalAddress || u.orgAddress || ""),
        groupCode: toCode(u.group || u.role || "user"),
      });
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
  const contentTopRef = React.useRef(null);
  const [asideShift, setAsideShift] = React.useState(0);
  const [leftShift, setLeftShift] = React.useState(0);
  // Порог «десктопного» ЛК поднят 1024 → 1280: iPad Pro portrait (1024) и 11" landscape
  // (1194) не тянут фиксированную 3-колоночную сетку 1429px (она переполняет экран), поэтому
  // на них отдаём ту же плавную одноколоночную раскладку, что и на iPad Air. Настоящий десктоп
  // (≥1280: 1280/1366/1440/1920) остаётся байт-в-байт прежним. Согласовано с useIsTabletDown (≤1279).
  const [isDesktop, setIsDesktop] = React.useState(() => { try { return window.matchMedia("(min-width: 1280px)").matches; } catch { return true; } });
  React.useEffect(() => {
    let mql; try { mql = window.matchMedia("(min-width: 1280px)"); } catch { return; }
    const on = () => setIsDesktop(mql.matches);
    on();
    try { mql.addEventListener("change", on); } catch { mql.addListener(on); }
    return () => { try { mql.removeEventListener("change", on); } catch { mql.removeListener(on); } };
  }, []);

  // Один общий замер выравнивания. leftShift — отступ левого заголовка, чтобы он
  // встал вровень с верхом контента центральной колонки (под таб-баром). Значение
  // геометрически ОДИНАКОВО для всех вкладок (крошка слева и таб-бар по центру
  // от вкладки не зависят) — поэтому храним одно число. Клампим в 0, если refs ещё
  // не в DOM. setState тем же числом React гасит (Object.is) — цикла нет.
  const measure = React.useCallback(() => {
    if (!gridRef.current) return;
    const g = gridRef.current.getBoundingClientRect();
    if (displayAnchorRef.current) {
      const a = displayAnchorRef.current.getBoundingClientRect();
      setAsideShift(Math.max(0, a.top - g.top));
    }
    // На вкладке «Профиль» есть форма → якорь formTopAnchorRef, который лежит на 44px
    // ниже верха контента (внутри `<div marginTop:44>`) — за счёт этого левый заголовок
    // получает комфортный зазор от крошки. На остальных вкладках формы нет — берём верх
    // контента (contentTopRef), но он стоит вплотную под таб-баром, и заголовок липнет к
    // крошке. Чтобы отступ был ОДИНАКОВЫМ на всех вкладках, не-форменным добавляем те же
    // 44px, что даёт форма. (contentTopRef геометрически на одном уровне у всех вкладок.)
    const usingFallback = !formTopAnchorRef.current;
    const anchor = formTopAnchorRef.current || contentTopRef.current;
    if (leftStartRef.current && anchor) {
      const l = leftStartRef.current.getBoundingClientRect();
      const f = anchor.getBoundingClientRect();
      const base = usingFallback ? 44 : 0;
      setLeftShift(Math.max(0, f.top - l.top + base));
    }
  }, []);

  // Пересчёт после КАЖДОГО коммита. Раньше замер был привязан к [tab, isDesktop,
  // booting] и «застревал»: если тяжёлый контент вкладки (ObjectsSection, админка,
  // партнёр/поставщик) домонтировался/дозагружался ПОСЛЕ замера, никто не пересчитывал
  // — и левый заголовок этой вкладки оставался прижатым к крошке, пока не переключишь
  // раздел. Теперь любой ре-рендер (в т.ч. приход данных) заново выравнивает заголовок.
  React.useLayoutEffect(() => { measure(); });

  // Наблюдатели за рефлоу, которые НЕ вызывают ре-рендер профиля (загрузка данных в
  // дочернем компоненте меняет высоту секции, но не трогает наш стейт; веб-шрифты
  // Inter Tight; ресайз окна). ResizeObserver на сетке и на центральной секции ловит
  // именно дозагрузку тяжёлого контента вкладки. Переармируем при booting/tab/isDesktop.
  React.useEffect(() => {
    measure();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const t = setTimeout(measure, 250);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); } catch {}
    let ro;
    try {
      ro = new ResizeObserver(measure);
      if (gridRef.current) ro.observe(gridRef.current);
      const anchorEl = formTopAnchorRef.current || contentTopRef.current;
      const center = anchorEl && anchorEl.parentElement;
      if (center) ro.observe(center);
    } catch {}
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(t);
      try { ro && ro.disconnect(); } catch {}
      window.removeEventListener("resize", measure);
    };
  }, [measure, tab, isDesktop, booting]);

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

  // Повторные входы с одного браузера+IP схлопываем в одну карточку: показываем
  // самое свежее время и число входов; «Отозвать» гасит все токены группы разом.
  // (Сервер плодит по записи на каждый /auth/login — визуально это спам.)
  const groupedSessions = React.useMemo(() => {
    const map = new Map();
    for (const s of sessions) {
      const key = `${s.userAgent || ""}|${s.ip || ""}`;
      let g = map.get(key);
      if (!g) { g = { key, userAgent: s.userAgent, ip: s.ip, lastSeen: 0, current: false, sids: [], count: 0 }; map.set(key, g); }
      g.sids.push(s.sid);
      g.count += 1;
      if (s.current) g.current = true;
      if ((s.lastSeen || 0) > g.lastSeen) g.lastSeen = s.lastSeen || 0;
    }
    return [...map.values()].sort((a, b) => (Number(b.current) - Number(a.current)) || (b.lastSeen - a.lastSeen));
  }, [sessions]);

  async function handleRevokeGroup(g) {
    if (!g || !token || !g.sids.length) return;
    try {
      setRevokingSid(g.key);
      for (const sid of g.sids) { if (sid) { try { await apiRevokeSession(token, sid); } catch {} } }
      setSessions((prev) => prev.filter((s) => !g.sids.includes(s.sid)));
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
        timezone,
        about,
        org: org.trim(),
        inn: inn.trim(),
        kpp: kpp.trim(),
        legalAddress: legalAddress.trim(),
        emailOptIn,
        ...(avatarDataUrl ? { avatar: avatarDataUrl } : {}),
      });

      if (!resp) throw new Error("save_failed");

      try { localStorage.setItem("profile:timezone", timezone); } catch {}
      const updatedUser = {
        ...(resp.user || { name: display.trim(), email: userEmail, group: groupCode }),
        ...(avatarDataUrl ? { avatar: avatarDataUrl } : {}),
      };
      // Бэкенд /auth/me может не возвращать avatar — держим его локально,
      // чтобы шапка не сбрасывала аватар при следующем refresh/bootstrap.
      try {
        if (avatarDataUrl) localStorage.setItem("profile:avatar", avatarDataUrl);
      } catch {}
      if (typeof window.setHeaderUser === "function") {
        window.setHeaderUser(updatedUser, token);
      } else {
        window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: updatedUser, accessToken: token } }));
      }

      // Сброс «грязного» состояния — форма снова совпадает с сохранённым.
      setSnapshot({ display, phone, city, timezone, about, org, inn, kpp, legalAddress, groupCode });
      setAvatar(null);

      window.showDockToast?.("Сохранено");
    } catch (e) {
      window.showDockToast?.("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  const INFO_UP = 37;

  // Есть ли несохранённые изменения профиля (по снимку). Аватар: выбран новый файл → «грязно».
  const profileDirty = React.useMemo(() => {
    if (!snapshot) return false;
    if (avatar) return true;
    const s = snapshot;
    const eq = (a, b) => String(a ?? "").trim() === String(b ?? "").trim();
    return !(
      eq(display, s.display) && eq(phone, s.phone) && eq(city, s.city) &&
      eq(timezone, s.timezone) && eq(about, s.about) && eq(org, s.org) &&
      eq(inn, s.inn) && eq(kpp, s.kpp) && eq(legalAddress, s.legalAddress) &&
      eq(groupCode, s.groupCode)
    );
  }, [snapshot, avatar, display, phone, city, timezone, about, org, inn, kpp, legalAddress, groupCode]);

  const crumbLabel = {
    profile:  "Профиль",
    partner:  "Партнёр",
    supplier: "Поставщик",
    personal: "Настройки", // ← Переименовано
    admin:    "Администратор",
    help:     "Помощь",
  }[tab] || "Профиль";

  // Левый заголовок раздела — меняется при переключении вкладок.
  const asideHeading = {
    profile:  { title: "Ваш профиль",   desc: "Личные данные, контакты и реквизиты." },
    objects:  { title: "Ваши объекты",  desc: "Проекты, документы и материалы по вашим объектам." },
    personal: { title: "Настройки",     desc: "Безопасность, вход и уведомления." },
    partner:  { title: "Раздел: Партнёр",  desc: "Информация и материалы для партнёров КУБ." },
    supplier: { title: "Раздел: Поставщик", desc: "Информация и материалы для поставщиков КУБ." },
    admin:    { title: "Роли и группы", desc: "Управляйте ролями (доступ) и группами (кто вы?) прямо тут." },
    help:     { title: "Справка", desc: "Как всё устроено в вашем кабинете." },
  }[tab] || { title: "Ваш профиль", desc: "Личные данные, контакты и реквизиты." };

  // Доступ к разделам «Партнёр»/«Поставщик»: закрыт для заказчиков, открыт админам и
  // сотрудникам (у staff-ролей есть partners.view/suppliers.view). isAdmin — быстрый
  // путь до загрузки прав из /auth/me. Зависят от setMyPermsTick (перерисовка).
  const canPartner  = isAdmin || permCan("partners.view");
  const canSupplier = isAdmin || permCan("suppliers.view");

  // Первичная загрузка профиля — брендовый спиннер вместо мигающих пустых полей.
  if (booting) {
    return (
      <main className="xl:min-h-[100dvh]" style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8" }}>
        <CenterSpinner minHeight="70vh" size={36} label="Загружаем профиль…" />
      </main>
    );
  }

  return (
    <main className="xl:min-h-[100dvh]" style={{ fontFamily: UI, color: TEXT, background: "#f8f8f8" }}>
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
      {/* Горизонтальные отступы завязаны на ШАПКУ (Header.jsx: px-4 lg:px-[52px]).
          Ниже 1024 — px-4 (как у шапки на телефоне); планшет 1024–1279 — lg:px-[52px]
          (тот же 52px, что у шапки → левый/правый край контента ЛК совпадает с краями шапки;
          раньше тут был px-4 и всё «уезжало», плюс убрал центрирующий maxWidth 820, который
          оставлял пустые поля по бокам). ≥1280 — xl:px-[52px] (десктоп, фикс-сетка, без изменений). */}
      <div className="-mt-10 px-4 pt-4 lg:px-[52px] xl:mt-0 xl:px-[52px] xl:pt-[72px]">
        <div
          ref={gridRef}
          className="grid grid-cols-1 xl:grid-cols-[360px_714px_78px_277px]"
          style={{
            columnGap: 0,
            alignItems: "start",
            position: "relative",
          }}
        >
          {/* ЛЕВО — крошка + описание */}
          <aside>
            <div style={{ marginTop: isDesktop ? -35 : -8 }}>
              {/* Десктоп: постоянный заголовок «Профиль». */}
              <div className="hidden xl:block" style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35", marginBottom: 7 }}>Профиль</div>
              {/* Мобилка: на месте заголовка — динамический заголовок раздела (в т.ч. «Настройки»,
                  которых раньше в шапке не было). Экономит место внизу, плавно меняется при
                  переключении вкладок. */}
              {!(tab === "admin" && adminModule) ? (
                // minHeight фиксирует высоту шапки → при переключении разделов низ не «скачет».
                <div key={tab} className="xl:hidden animate-svcfade" style={{ marginBottom: 10, minHeight: 58 }}>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35" }}>{asideHeading.title}</div>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#222", lineHeight: 1.5 }}>{asideHeading.desc}</div>
                </div>
              ) : null}
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

            {tab !== "personal" && !(tab === "admin" && adminModule) && (
              <div className="hidden xl:block animate-svcfade" key={tab} style={{ marginTop: isDesktop ? leftShift : 0 }}>
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
              canPartner={canPartner}
              canSupplier={canSupplier}
              onNavigate={() => {}}
              lineWidth={tabsLineWidth}
              isDesktop={isDesktop}
            />

            {/* Верх контента центральной колонки — запасной якорь для выравнивания
                левого заголовка на вкладках БЕЗ формы (объекты/админка/партнёр/поставщик),
                где formTopAnchorRef не рендерится. Без него leftShift оставался 0 и заголовок
                слипался с крошкой при заходе по прямой ссылке — до переключения вкладок. */}
            <div ref={contentTopRef} style={{ height: 0 }} />

            {tab === "objects" ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : undefined}>
                <ObjectsSection pathname={pathname} userEmail={userEmail} userId={userId} isAdmin={isAdmin} />
              </div>
            ) : tab === "admin" && isAdmin ? (
              // key={adminModule} — при переходе между под-модулями админки (лаунчер ↔ учётки ↔
              // создание ↔ шаблоны ↔ проекты ↔ справка ↔ файлы) узел ремаунтится и house-анимация
              // svcfade проигрывается заново, а не «переключается топорно».
              <div key={`adm-${adminModule || "home"}`} className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : { marginTop: 8 }}>
                {adminModule === "employees" ? (
                  <EmployeesModule backTo="/account/admin" canManage={permCan("staff.manage")} />
                ) : adminModule === "accounts" ? (
                  <AdminAccounts token={token} />
                ) : adminModule === "create-account" ? (
                  permCan("accounts.manage") ? <AdminCreateAccount token={token} /> : <AdminLauncher />
                ) : adminModule === "templates" ? (
                  permCan("templates.view") ? <TemplatesModule backTo="/account/admin" canManage={permCan("templates.manage")} /> : <AdminLauncher />
                ) : adminModule === "projects" ? (
                  <ProjectsAdmin backTo="/account/admin" canAdd={isAdmin || permCan("projects.add")} canManage={isAdmin || permCan("projects.manage")} />
                ) : adminModule === "reference" ? (
                  <AdminReference />
                ) : adminModule === "files" ? (
                  permCan("files.view") ? <AdminFiles canDownload={permCan("files.download")} /> : <AdminLauncher />
                ) : (
                  <AdminLauncher />
                )}
              </div>
            ) : tab === "help" && !isAdmin ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : { marginTop: 8 }}>
                <AdminReference customer />
              </div>
            ) : tab === "partner" && canPartner ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : { marginTop: 8 }}>
                <AdminPanelFiltered token={token} group="partner" />
              </div>
            ) : tab === "supplier" && canSupplier ? (
              <div className="animate-svcfade" style={isDesktop ? { width: MID_COL + GAP_COL + RIGHT_COL } : { marginTop: 8 }}>
                <AdminPanelFiltered token={token} group="supplier" />
              </div>
            ) : (
              <>
                {tab === "personal" ? (
                  <div className="animate-svcfade" style={{ marginTop: isDesktop ? 44 : 8, ...(isDesktop ? { marginLeft: -LEFT_COL, width: LEFT_COL + MID_COL + GAP_COL + RIGHT_COL } : {}) }}>

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
                            style={{ marginTop: 10, height: 38, padding: "0 16px", borderRadius: 8, border: "none", background: "#1c1c1c", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: UI }}
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
                    {groupedSessions.map((g) => (
                      <div key={g.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 12, border: g.current ? "1px solid #000" : "1px solid #e6e6e6", background: g.current ? "#fafafa" : "#fff" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: TEXT, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {describeUserAgent(g.userAgent)}
                            {g.current && (<span style={{ fontSize: 11, fontWeight: 500, color: "#0a7d32", background: "#e7f6ec", borderRadius: 6, padding: "2px 7px" }}>текущая</span>)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 300, color: "#888", marginTop: 3 }}>
                            {[g.ip, formatSessionTime(g.lastSeen), g.count > 1 ? `${g.count} входов` : ""].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        {!g.current && (
                          <button type="button" onClick={() => handleRevokeGroup(g)} disabled={revokingSid === g.key} style={{ flexShrink: 0, height: 36, padding: "0 14px", borderRadius: 9, background: "#fff", color: "#c0392b", border: "1px solid #e3b4ae", fontFamily: UI, fontSize: 13, fontWeight: 300, cursor: revokingSid === g.key ? "not-allowed" : "pointer", opacity: revokingSid === g.key ? 0.6 : 1 }}>
                            {revokingSid === g.key ? "…" : "Отозвать"}
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

              <div className="h-0 xl:h-[120px]" />
                  </div>
                ) : (
                  <div style={{ marginTop: isDesktop ? 44 : 8 }}>
                    <div ref={formTopAnchorRef} />
                    {/* Save — мобилка: НАВЕРХУ (как у awwwards), сразу под вкладками, над заголовком
                        формы; статичная (не липкая), ВСЕГДА видна (не зависит от изменений); под
                        кнопкой — короткая подсказка. */}
                    <div className="mb-7 xl:hidden">
                      {saving ? (
                        <div className="w-full" style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f8f8", borderRadius: 8 }}><Spinner size={24} /></div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSave}
                          className="w-full"
                          style={{ height: 48, borderRadius: 8, background: "#1c1c1c", color: "#fff", border: "none", fontFamily: UI, fontSize: 14, fontWeight: 400, cursor: "pointer" }}
                        >
                          Сохранить изменения
                        </button>
                      )}
                      <div style={{ marginTop: 12, fontSize: 14, fontWeight: 300, color: "#222" }}>
                        Не забудьте сохранить изменения, прежде чем покинуть эту страницу.
                      </div>
                    </div>
                    {/* Мобилка: заголовок над формой — по размеру как верхний «Ваш профиль» (22px). */}
                    <div className="xl:hidden" style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: "1.35" }}>Личные данные</div>
                      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 300, color: "#222", lineHeight: 1.5 }}>Основная информация о вас и компании.</div>
                    </div>
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

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5" style={{ marginTop: 12 }}>
                        <CitySelect
                          value={city}
                          onChange={(v) => { setCity(v); if (errors.city) setErrors({ ...errors, city: "" }); }}
                          error={errors.city}
                          offset={0}
                        />
                        <TimezoneSelect value={timezone} onChange={setTimezone} />
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
                        <br className="hidden md:inline xl:hidden" />
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

                    <div className="h-10 xl:h-[200px]" />
                  </div>
                )}
              </>
            )}
          </section>

          {/* промежуток */}
          <div />

          {/* ПРАВАЯ кнопка — только на вкладках профиля/личной информации */}
          {tab === "personal" || tab === "objects" || tab === "admin" || tab === "help" || (isAdmin && (tab === "partner" || tab === "supplier")) ? (
            <div />
          ) : (
            <aside className="hidden xl:block xl:sticky xl:top-6" style={{ marginTop: isDesktop ? Math.max(0, asideShift) : 0 }}>
              {saving ? (
                <div className="w-full xl:w-[277px]" style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={30} /></div>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full xl:w-[277px]"
                  style={{
                    height: 72,
                    borderRadius: 10,
                    background: "#1c1c1c",
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
              <div className="xl:max-w-[277px]" style={{ marginTop: 14, fontSize: 14, fontWeight: 300, color: "#222" }}>
                Если вы внесли какие-либо изменения, не забудьте сохранить их, прежде чем покинуть эту страницу.
              </div>
            </aside>
          )}

        </div>
      </div>
    </main>
  );
}
