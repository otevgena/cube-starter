import React, { useEffect, useState } from 'react'
import Header from '@/components/layout/Header.jsx'
import Services from '@/components/blocks/Services.jsx'
import About from '@/components/blocks/About.jsx'
import Projects from '@/components/blocks/Projects.jsx'
import Contact from '@/components/blocks/Contact.jsx'
import Footer from '@/components/layout/Footer.jsx'
import StickyDock from "@/components/common/StickyDock";
import Preloader from "@/components/common/Preloader";

export default function App(){
  const [loading, setLoading] = useState(true);

  // помечаем главную классом на body (как раньше)
  useEffect(() => {
    const isHome = (window.location.pathname || "/") === "/";
    document.body.classList.toggle("home", isHome);
  }, []);

  // показываем прелоадер 2 секунды
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="min-h-dvh">
      <Header />
      <main>
        <Services />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <StickyDock />

      {/* Оверлей прелоадера поверх всего */}
      {loading && <Preloader />}
    </div>
  )
}
