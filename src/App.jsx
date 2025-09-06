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

// ✅ НОВОЕ: главная карточка вынесена в отдельный блок
import HomeMain from '@/components/blocks/HomeMain.jsx'

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

  return (
    <div className="min-h-dvh">
      <Header />

      <main>
        {path === 'pages/projects' ? (
          <ProjectsPage />
        ) : (
          <>
            <HomeMain />
            <Services />
            <About />
            <Projects />
            <Contact />
          </>
        )}
      </main>

      <Footer />
      <StickyDock />

      {/* Оверлей прелоадера поверх всего; снимем его, когда прогрев завершён */}
      {loading && <Preloader onReady={() => setLoading(false)} minMs={1200} />}
    </div>
  )
}
