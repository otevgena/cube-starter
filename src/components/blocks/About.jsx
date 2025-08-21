import React from "react";

export default function About() {
  // «Авг 21, 2025» — автообновление в полночь
  const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const t = new Date();
    const msUntilMidnight =
      new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 0, 0, 0) - t;
    const id = setTimeout(() => setNow(new Date()), msUntilMidnight);
    return () => clearTimeout(id);
  }, [now]);

  const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return (
    <section className="about-hero" aria-label="О нас">
      <div className="container-wide">
        {/* Сегодня • [дата] • Загруженность */}
        <div className="about-hero-meta">
          <span className="about-hero-today">Сегодня</span>
          <span className="about-hero-date">{dateStr}</span>
          <span className="about-hero-load">Загруженность <b>7.49</b> из 10</span>
        </div>

        {/* Заголовок */}
        <h1 className="about-hero-title">CUBE-TECH</h1>

        {/* Директор */}
        <div className="about-hero-sign">
          <img src="/about/director.png" alt="" className="about-hero-avatar" />
          <a className="about-hero-role" href="#director">Генеральный директор</a>
          <span className="about-hero-badge" aria-hidden="true">CUBE</span>
        </div>
      </div>

      {/* «Ромб» с изображением */}
      <div className="about-hero-diamond">
        <img src="/about/about.png" alt="О компании" />
      </div>
    </section>
  );
}
