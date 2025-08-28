// src/pages/projects.jsx
import React from "react";

export default function ProjectsPage() {
  const TOTAL = 26; // сколько проектов показываем

  return (
    <section className="about-hero" aria-label="Смотреть работы">
      {/* фон и поднятый header — как в About */}
      <div
        className="about-hero-header"
        style={{ transform: "translateY(-74px)", willChange: "transform" }}
      >
        <div className="container-wide">
          {/* Центровка, отступ 200px */}
          <div className="about-hero-flow" style={{ marginTop: "200px" }}>
            {/* маленький оверхедер */}
            <div
              className="about-hero-overview"
              style={{
                textAlign: "center",
                fontFamily: "'Inter Tight','Inter',system-ui",
                fontSize: "14px",
                lineHeight: "28px",
                fontWeight: 300,
                color: "#222222",
                margin: 0,
              }}
            >
              Каталог
            </div>

            {/* заголовок */}
            <h2
              className="about-hero-title"
              style={{
                margin: 0,
                marginTop: "25px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              СМОТРЕТЬ РАБОТЫ
            </h2>

            {/* сабтайтл — минимальный текст */}
            <p
              className="about-hero-more-sub"
              style={{
                marginTop: "15px",
                fontSize: "20.9859px",
                lineHeight: "28px",
                fontWeight: 300,
                color: "#222222",
                textAlign: "center",
              }}
            >
              Всего <b>{TOTAL}</b> проектов — скоро здесь появится список и фильтры.
            </p>
          </div>

          {/* простой плейсхолдер под список работ */}
          <div
            style={{
              marginTop: "82px",
              marginLeft: "80px",
              marginRight: "80px",
              fontFamily: "'Inter Tight','Inter',system-ui",
              color: "#222222",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                fontWeight: 300,
                opacity: 0.9,
              }}
            >
              Здесь будут карточки проектов, сортировка и поиск.
            </div>
          </div>

          {/* низ страницы для воздуха */}
          <div style={{ height: 160 }} />
        </div>
      </div>
    </section>
  );
}
