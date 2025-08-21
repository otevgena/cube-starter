import React from 'react'
import Header from '@/components/layout/Header.jsx'
import Services from '@/components/blocks/Services.jsx'
import About from '@/components/blocks/About.jsx'
import Projects from '@/components/blocks/Projects.jsx'
import Contact from '@/components/blocks/Contact.jsx'
import Footer from '@/components/layout/Footer.jsx'
import StickyDock from "@/components/common/StickyDock";

// ...внутри return вашего App:
<>
  {/* ...весь ваш контент/маршруты... */}
  <StickyDock />
</>

export default function App(){
  return (
    <div className="min-h-dvh">
      <Header />
      {/* Главная: Services → About → Projects → Contact (герой убран) */}
      <main>
        <Services />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
