// src/App.jsx
import React, { useEffect } from "react";
import Header from "@/components/layout/Header.jsx";
import Services from "@/components/blocks/Services.jsx";
import About from "@/components/blocks/About.jsx";
import Projects from "@/components/blocks/Projects.jsx";
import Contact from "@/components/blocks/Contact.jsx";
import Footer from "@/components/layout/Footer.jsx";
import StickyDock from "@/components/common/StickyDock";

export default function App() {
  // Класс на body, чтобы (при желании) скрывать секцию «Услуги» только на главной через CSS
  useEffect(() => {
    const isHome = (window.location.pathname || "/") === "/";
    document.body.classList.toggle("home", isHome);
  }, []);

  return (
    <div className="min-h-dvh">
      <Header />

      <main>
        {/* Раздел «Услуги» остаётся в дереве; если нужно скрыть на главной — делаем это CSS-ом по body.home */}
        <Services />
        <About />
        <Projects />
        <Contact />
      </main>

      <Footer />

      {/* Нижняя постоянная панель */}
      <StickyDock />
    </div>
  );
}
