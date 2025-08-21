import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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
