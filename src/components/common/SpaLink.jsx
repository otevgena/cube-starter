// src/components/common/SpaLink.jsx
import React from "react";

/**
 * Универсальная SPA-ссылка:
 *  - предотвращает полную перезагрузку
 *  - делает history.pushState(...)
 *  - диспатчит PopStateEvent, чтобы твой App.jsx отрисовал страницу
 */
export default function SpaLink({
  to,
  children,
  className,
  style,
  title,
  ariaLabel,
  onNavigated, // optional callback после смены пути
  ...rest       // прочие пропсы (onMouseEnter/onMouseLeave/onFocus…) должны доходить до <a>,
                // иначе hover-эффекты, навешенные снаружи (напр. капсула «Подробнее»), теряются
}) {
  const onClick = (e) => {
    e.preventDefault();
    try {
      if (window.location.pathname !== to) {
        window.history.pushState({}, "", to);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      onNavigated?.();
    } catch {}
  };

  return (
    <a
      href={to}
      onClick={onClick}
      className={className}
      style={style}
      title={title}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </a>
  );
}
