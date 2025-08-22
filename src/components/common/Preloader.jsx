import React, { useEffect } from "react";

export default function Preloader() {
  // на время прелоадера блокируем скролл страницы
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="preloader" role="status" aria-label="Загрузка">
      <div className="preloader__spinner">
        {/* 8 точек по кругу */}
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ ["--i"]: i }} />
        ))}
      </div>
    </div>
  );
}
