// src/App.jsx
import React, { useEffect, useState } from 'react'
import Header from '@/components/layout/Header.jsx'
import Services from '@/components/blocks/Services.jsx'
import About from '@/components/blocks/About.jsx'
import Projects from '@/components/blocks/Projects.jsx'
import Contact from '@/components/blocks/Contact.jsx'
import Footer from '@/components/layout/Footer.jsx'
import StickyDock from "@/components/common/StickyDock";
import Preloader from "@/components/common/Preloader";

// ⚠️ новая страница
import ProjectsPage from '@/pages/projects.jsx'
// ✅ главная карточка вынесена в отдельный блок
import HomeMain from '@/components/blocks/HomeMain.jsx'
// ⬇️ Хост модалок
import ModalsHost from "@/components/common/Modals.jsx";

export default function App(){
  const [loading, setLoading] = useState(true);

  // Текущий путь без начального слэша: "" для "/"
  const [path, setPath] = useState(() =>
    (typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/+/, '')
      : '')
  );

  useEffect(() => {
    const isHome = path === '' || path === '/';
    document.body.classList.toggle('home', isHome);
    document.body.classList.toggle('projects', path === 'pages/projects');
    return () => {
      document.body.classList.remove('home');
      document.body.classList.remove('projects');
    };
  }, [path]);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.replace(/^\/+/, ''));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // === HERO-GUARD: выше секции services визуально ничего не подсвечивается ===
  // Никаких манипуляций с .dock__pill — только флаг на <body>.
  useEffect(() => {
    const servicesEl = document.getElementById('services');
    if (!servicesEl) return;

    const num = (attr, fallback) => {
      const v = servicesEl.getAttribute(attr);
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const headerOffset = num('data-header-offset', 16);
    const spyOffset    = num('data-spy-offset', 120);
    const heroSilence  = num('data-hero-silence', 80);

    const calc = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const rect = servicesEl.getBoundingClientRect();
      const topAbs = rect.top + scrollY;

      // Порог «тихой зоны»: до него — считаем, что ещё hero
      const silenceUntil = topAbs - headerOffset - Math.max(heroSilence, spyOffset);
      const inHero = scrollY < Math.max(0, silenceUntil);

      document.body.classList.toggle('hero-zone', inHero);
    };

    calc();
    window.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc);
      window.removeEventListener('resize', calc);
    };
  }, []);

  // Считываем БАЗОВЫЕ стили неактивной пилюли (рамка + цвет текста)
  // чтобы в hero-зоне выглядеть ровно как «неактивная».
  useEffect(() => {
    const dock = document.getElementById('dock-root');
    if (!dock) return;
    const pills = Array.from(dock.querySelectorAll('.dock__pill'));
    if (!pills.length) return;
    const sample = pills.find(p => !p.classList.contains('is-active')) || pills[0];
    const cs = window.getComputedStyle(sample);

    const baseBorder =
      cs.borderColor || cs.borderTopColor || cs.borderRightColor || cs.borderBottomColor || cs.borderLeftColor;
    if (baseBorder) {
      document.documentElement.style.setProperty('--kub-dock-pill-border-base', baseBorder);
    }

    const baseFg = cs.color || cs.getPropertyValue('color');
    if (baseFg) {
      document.documentElement.style.setProperty('--kub-dock-pill-fg-base', baseFg);
    }
  }, []);

  return (
    <div className="min-h-dvh">
      <Header />

      <main>
        {path === 'pages/projects' ? (
          <ProjectsPage />
        ) : (
          <>
            {/* Хиро-блок (без подсветки в доке) */}
            <section id="hero" aria-label="hero">
              <HomeMain />
            </section>

            {/* Якоря для скролл-спая (id совпадают со StickyDock) */}
            {/* Настройка по умолчанию:
                data-header-offset="16"  — компенсация фикс-хедера
                data-spy-offset="120"    — когда считать секцию «достигнутой» при скролле
                data-click-offset="16"   — на сколько «недокрутить» при клике
                Только для первой секции (services):
                data-hero-silence="80"   — «тихая зона» над услугами, где ничего не подсвечиваем
            */}
            <section
              id="services"
              data-section="services"
              aria-label="services"
              data-header-offset="30"
              data-spy-offset="120"
              data-click-offset="16"
              data-hero-silence="80"
            >
              <Services />
            </section>

            <section
              id="about"
              data-section="about"
              aria-label="about"
              data-header-offset="-150"
              data-spy-offset="120"
              data-click-offset="16"
            >
              <About />
            </section>

            <section
              id="projects"
              data-section="projects"
              aria-label="projects"
              data-header-offset="80"
              data-spy-offset="120"
              data-click-offset="16"
            >
              <Projects />
            </section>

            <section
              id="contact"
              data-section="contact"
              aria-label="contact"
              data-header-offset="-60"
              data-spy-offset="120"
              data-click-offset="16"
            >
              <Contact />
            </section>

            {/* Если появятся отзывы — просто раскомментируй и при желании настрой пороги */}
            {/*
            <section
              id="reviews"
              data-section="reviews"
              aria-label="reviews"
              data-header-offset="16"
              data-spy-offset="120"
              data-click-offset="16"
            >
              <Reviews />
            </section>
            */}
          </>
        )}
      </main>

      <Footer />
      <StickyDock />

      {/* Глобальный хост модалок */}
      <ModalsHost />

      {/* Оверлей прелоадера поверх всего; снимем его, когда прогрев завершён */}
      {loading && <Preloader onReady={() => setLoading(false)} minMs={1200} />}

      {/* === CSS-оверрайд: в hero-зоне активная пилюля выглядит как НЕактивная,
            рамка и текст — ровно базовых цветов, считанных сверху. === */}
      <style>{`
        body.hero-zone .dock__pill.is-active,
        body.hero-zone .dock__pill[aria-selected="true"] {
          background: transparent !important;
          box-shadow: none !important;
          color: var(--kub-dock-pill-fg-base, #e5e7eb) !important;
          border-color: var(--kub-dock-pill-border-base, #2a2a2a) !important;
          border-style: solid !important;
          border-width: 1px !important;
        }
      `}</style>
    </div>
  )
}
