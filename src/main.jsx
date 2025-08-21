import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// основной root
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// отдельный root для нижней панели — всегда на всех страницах
import StickyDock from "./components/common/StickyDock.jsx";

const dockRoot = document.getElementById("dock-root") || (() => {
  const el = document.createElement("div");
  el.id = "dock-root";
  document.body.appendChild(el);
  return el;
})();

ReactDOM.createRoot(dockRoot).render(
  <React.StrictMode>
    <StickyDock />
  </React.StrictMode>
);
