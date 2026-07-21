// src/lib/metrika.js
// Яндекс Метрика с учётом согласия на cookie.
// Тег грузится ТОЛЬКО после явного «Принять» в куки-баннере (см. CookieConsent.jsx).
// До согласия — ничего не подключается, аналитические cookie не ставятся.
//
// API:
//   getConsent()   -> "granted" | "denied" | null
//   hasDecision()  -> сделан ли выбор (баннер больше не показывать)
//   grantConsent() -> запомнить согласие + сразу подключить Метрику
//   denyConsent()  -> запомнить отказ (Метрику не грузим)
//   loadMetrika()  -> подключить тег, если согласие уже дано (для вернувшихся)
//   trackHit(url)  -> отправить просмотр страницы (SPA: при смене маршрута)

export const COUNTER_ID = 110873832;

// ГЛАВНЫЙ ВЫКЛЮЧАТЕЛЬ. Пока false — ни баннера, ни Метрики (код на месте, готов к включению).
// Чтобы включить позже: поставить true, собрать и задеплоить.
export const METRIKA_ENABLED = false;

const CONSENT_KEY = "cube:cookie-consent"; // "granted" | "denied"
export const CONSENT_EVENT = "cube:cookie-consent-changed";

export function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

export function hasDecision() {
  const v = getConsent();
  return v === "granted" || v === "denied";
}

function emit() {
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { consent: getConsent() } }));
  } catch {}
}

export function grantConsent() {
  try { localStorage.setItem(CONSENT_KEY, "granted"); } catch {}
  loadMetrika();
  emit();
}

export function denyConsent() {
  try { localStorage.setItem(CONSENT_KEY, "denied"); } catch {}
  emit();
}

let _loaded = false;

// Подключение счётчика. Идемпотентно и только при согласии.
export function loadMetrika() {
  if (!METRIKA_ENABLED) return;
  if (_loaded) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (getConsent() !== "granted") return;
  _loaded = true;

  // Стандартный инициализатор Метрики (без ecommerce/ssr — это клиентский SPA).
  (function (m, e, t, r, i) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < e.scripts.length; j++) { if (e.scripts[j].src === r) { return; } }
    var k = e.createElement(t), a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=" + COUNTER_ID, "ym");

  try {
    window.ym(COUNTER_ID, "init", {
      webvisor: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
    });
  } catch {}
}

// Отправить просмотр страницы вручную (для SPA — при смене маршрута).
export function trackHit(url) {
  if (!METRIKA_ENABLED) return;
  if (getConsent() !== "granted") return;
  try {
    if (typeof window.ym === "function") {
      const u = url || (location.pathname + location.search);
      window.ym(COUNTER_ID, "hit", u);
    }
  } catch {}
}
