import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { installDevAuth } from './lib/dev-auth.js'

// === ВРЕМЕННЫЙ dev-вход без бэкенда (моки /auth/*): ПО УМОЛЧАНИИ ВЫКЛЮЧЕН ===
// Теперь локально работает живой API (api.cube-tech.ru). Чтобы включить офлайн-моки
// (admin@cube.ru / 1234): в консоли `localStorage.setItem('dev-auth','1')` и перезагрузить,
// либо собрать с VITE_DEV_AUTH=1. Выключить обратно: `localStorage.removeItem('dev-auth')`.
{
  let devAuthOn = false;
  try { devAuthOn = localStorage.getItem('dev-auth') === '1'; } catch {}
  if (import.meta.env.DEV && (devAuthOn || import.meta.env.VITE_DEV_AUTH === '1')) {
    installDevAuth();
  }
}

// === метим главную страницу классом на <body> ===
function applyHomeClass() {
  const isHome = window.location.pathname === '/';
  document.body.classList.toggle('home', isHome);
}
applyHomeClass();
window.addEventListener('popstate', applyHomeClass);
// если в коде где-то делают pushState — перехватим
(function(history){
  const push = history.pushState;
  history.pushState = function(a, b, url){
    const ret = push.apply(history, arguments);
    try { applyHomeClass(); } catch {}
    return ret;
  };
})(window.history);

// === render ===
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
