// src/components/blocks/HomeMain.jsx
import React from "react";

/** Главная карточка («Сегодня», дата, загруженность, титулы + ромб с изображением) */
export default function HomeMain() {
  const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const now = new Date();
  const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return (
    <section className="home-hero" aria-label="Главная">
      {/* опущено на 58px: c -74px → -16px */}
      <div className="about-hero-header" style={{ transform: "translateY(-16px)", willChange: "transform" }}>
        <div className="container-wide">
          {/* Сегодня • [дата] • Загруженность */}
          <div className="about-hero-meta">
            <span className="about-hero-today" style={{ fontWeight: 400 }}>Сегодня</span>
            <span className="about-hero-date">{dateStr}</span>
            <span className="about-hero-load" style={{ fontWeight: 400 }}>Загруженность 7.49 из 10</span>
          </div>

          {/* Заголовок по центру, 600 */}
          <h1 className="about-hero-title" style={{ textAlign: "center", fontWeight: 600 }}>
            CUBE-TECH
          </h1>

          {/* Директор + бейдж CUBE (9px / 1.55em) */}
          <div className="about-hero-sign">
            <img src="/about/director.png" alt="" className="about-hero-avatar" />
            <a className="about-hero-role" href="#director">Генеральный директор</a>
            <span
              className="about-hero-badge"
              aria-hidden="true"
              style={{
                fontSize: "9px",
                lineHeight: "1.55em",
                display: "inline-block",
                transform: "translate(-13px, 4px)", // ← левее на 14px и ниже на 4px
                willChange: "transform"
              }}
            >
              CUBE
            </span>
          </div>
        </div>

        {/* Ромб с главным изображением */}
        <div className="about-hero-diamond">
          <img src="/main/main.png" alt="Главное изображение" />
        </div>
      </div>
    </section>
  );
}
