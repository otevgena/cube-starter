// src/lib/api.js
export const API_BASE =
  window.__API_BASE__ ||
  import.meta.env.VITE_API_BASE ||
  'https://api.cube-tech.ru';

export async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',                 // <-- важно для куки
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  if (res.status === 204) return null;

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const getJson  = (p)        => apiFetch(p);
export const postJson = (p, body)  => apiFetch(p, { method: 'POST', body: JSON.stringify(body) });
