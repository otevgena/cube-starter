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
import Reviews from "@/components/blocks/Reviews.jsx"
import ProJobsPage from '@/pages/pro.jsx'

// ⚠️ новая страница (проекты)
import ProjectsPage from '@/pages/projects.jsx'
// ✅ главная карточка вынесена в отдельный блок
import HomeMain from '@/components/blocks/HomeMain.jsx'
// ⬇️ Хост модалок
import ModalsHost from "@/components/common/Modals.jsx"

// ⬇️ LEGAL-страницы
import TermsPage from '@/pages/legal/terms.jsx'
import CookiesPage from '@/pages/legal/cookies.jsx'
import PrivacyPage from '@/pages/legal/privacy.jsx'

// ⬇️ Страницы услуг
import ElectricalServicesPage from '@/pages/services/electrical/index.jsx'
import LowCurrentServicesPage from '@/pages/services/lowcurrent/index.jsx'
import VentilationServicesPage from '@/pages/services/ventilation/index.jsx'
import DesignServicesPage from '@/pages/services/design/index.jsx' // NEW
import ConstructionServicesPage from '@/pages/services/construction/index.jsx' // NEW

// ⬇️ Новая отдельная страница "Контакты"
import ContactPage from '@/pages/contact.jsx'

// ⬇️ Страница профиля (внутри — вкладки)
import AccountProfilePage from '@/pages/account/profile.jsx'

export default function App(){
  const [loading, setLoading] = useState(true)

  const [path, setPath] = useState(() =>
    (typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/+/, '')
      : '')
  )

  useEffect(() => {
    const isHome = path === '' || path === '/'
    document.body.classList.toggle('home', isHome)
    document.body.classList.toggle('projects', path === 'pages/projects')
    document.body.classList.toggle('legal', path.startsWith('legal/'))
    document.body.classList.toggle('service', path.startsWith('services/'))
    document.body.classList.toggle('contact', path === 'contact')
    document.body.classList.toggle('account', path.startsWith('account'))

    return () => {
      document.body.classList.remove('home')
      document.body.classList.remove('projects')
      document.body.classList.remove('legal')
      document.body.classList.remove('service')
      document.body.classList.remove('contact')
      document.body.classList.remove('account')
    }
  }, [path])

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.replace(/^\/+/, ''))
    window.addEventListener('popstate', onPop)
    window.addEventListener('locationchange', onPop) // на случай патча history
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('locationchange', onPop)
    }
  }, [])

  // ——— ПРОКРУТКА НАВЕРХ + ТИТУЛ ———
  useEffect(() => {
    try {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
        requestAnimationFrame(() => window.scrollTo(0, 0))
      })
      document.body.classList.remove('hero-zone')
    } catch {}

    const titles = {
      '': 'Главная — CUBE',
      '/': 'Главная — CUBE',
      'pages/projects': 'Проекты — CUBE',
      'legal/terms': 'Правовые положения — CUBE',
      'legal/cookies': 'Политика cookie — CUBE',
      'legal/privacy': 'Политика конфиденциальности — CUBE',
      'services/electrical': 'Электромонтаж — CUBE',
      'services/lowcurrent': 'Слаботочные системы — CUBE',
      'services/ventilation': 'Климат-системы — CUBE',
      'services/design': 'Проектирование — CUBE',
      'services/construction': 'Общестрой — CUBE',
      'contact': 'Контакты — CUBE',
      'pro': 'Вакансии — CUBE',
      'account': 'Профиль — CUBE',
      'account/profile': 'Профиль — CUBE',
      'account/personal': 'Личная информация — CUBE',
      'account/partner': 'Партнёр — CUBE',
      'account/supplier': 'Поставщик — CUBE',
      'account/admin': 'Администратор — CUBE',
    }
    document.title = titles[path] || 'CUBE'

    const m = document.querySelector('main')
    if (m && typeof m.focus === 'function') m.focus()
  }, [path])

  // === HERO-GUARD ===
  useEffect(() => {
    const servicesEl = document.getElementById('services')
    const off = () => { document.body.classList.remove('hero-zone') }
    if (!servicesEl) { off(); return }

    const num = (attr, fallback) => {
      const v = servicesEl.getAttribute(attr)
      const n = Number(v)
      return Number.isFinite(n) ? n : fallback
    }

    const headerOffset = num('data-header-offset', 16)
    const spyOffset    = num('data-spy-offset', 120)
    const heroSilence  = num('data-hero-silence', 80)

    const calc = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const rect = servicesEl.getBoundingClientRect()
      const topAbs = rect.top + scrollY
      const silenceUntil = topAbs - headerOffset - Math.max(heroSilence, spyOffset)
      const inHero = scrollY < Math.max(0, silenceUntil)
      document.body.classList.toggle('hero-zone', inHero)
    }

    calc()
    window.addEventListener('scroll', calc, { passive: true })
    window.addEventListener('resize', calc)
    return () => {
      window.removeEventListener('scroll', calc)
      window.removeEventListener('resize', calc)
      off()
    }
  }, [path])

  // Базовые стили дока
  useEffect(() => {
    const dock = document.getElementById('dock-root')
    if (!dock) return
    const pills = Array.from(dock.querySelectorAll('.dock__pill'))
    if (!pills.length) return
    const sample = pills.find(p => !p.classList.contains('is-active')) || pills[0]
    const cs = window.getComputedStyle(sample)

    const baseBorder =
      cs.borderColor || cs.borderTopColor || cs.borderRightColor || cs.borderBottomColor || cs.borderLeftColor
    if (baseBorder) {
      document.documentElement.style.setProperty('--kub-dock-pill-border-base', baseBorder)
    }

    const baseFg = cs.color || cs.getPropertyValue('color')
    if (baseFg) {
      document.documentElement.style.setProperty('--kub-dock-pill-fg-base', baseFg)
    }
  }, [])

  // Рендер по пути
  const renderRoute = () => {
    if (path === 'pages/projects')        return <ProjectsPage />
    if (path === 'legal/terms')           return <TermsPage />
    if (path === 'legal/cookies')         return <CookiesPage />
    if (path === 'legal/privacy')         return <PrivacyPage />
    if (path === 'services/electrical')   return <ElectricalServicesPage />
    if (path === 'services/lowcurrent')   return <LowCurrentServicesPage />
    if (path === 'services/ventilation')  return <VentilationServicesPage />
    if (path === 'services/design')       return <DesignServicesPage />
    if (path === 'services/construction') return <ConstructionServicesPage />
    if (path === 'contact')               return <ContactPage />
    if (path === 'pro')                   return <ProJobsPage />
    if (
      path === 'account' ||
      path.startsWith('account/')
    ) return <AccountProfilePage />

    // Главная
    return (
      <>
        <section id="hero" aria-label="hero">
          <HomeMain />
        </section>

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

        <section
          id="reviews"
          data-section="reviews"
          aria-label="reviews"
          data-header-offset="80"
          data-spy-offset="120"
          data-click-offset="16"
        >
          <Reviews />
        </section>
      </>
    )
  }

  return (
    <div className="min-h-dvh">
      <Header />
      <main tabIndex="-1" style={{ outline: 'none' }}>
        {renderRoute()}
      </main>
      <Footer />
      <StickyDock />
      <ModalsHost />
      {loading && <Preloader onReady={() => setLoading(false)} minMs={1200} />}
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
