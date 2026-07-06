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

// ⬇️ Детальные страницы услуг (Электромонтаж)
import PowerConnectionPage from '@/pages/services/electrical/power-connection.jsx'
import PowerUpgradePage from '@/pages/services/electrical/power-upgrade.jsx' // NEW
import IndoorWorksPage from '@/pages/services/electrical/indoor.jsx';
import OutdoorNetworksPage from '@/pages/services/electrical/outdoor-networks.jsx'
import SwitchgearVruPage from '@/pages/services/electrical/switchgear-vru.jsx'
import EarthingLightningPage from '@/pages/services/electrical/earthing-lightning.jsx'
import EnergyMeteringAutomationPage from '@/pages/services/electrical/energy-metering-automation.jsx'
import BackupPowerPage from '@/pages/services/electrical/backup-power.jsx'

// ⬇️ Детальные страницы услуг (Слаботочные системы)
import SksPage from '@/pages/services/lowcurrent/sks.jsx'
import CctvPage from '@/pages/services/lowcurrent/cctv.jsx'
import OpsPage from '@/pages/services/lowcurrent/ops.jsx'
import SkudPage from '@/pages/services/lowcurrent/skud.jsx'
import IntercomPage from '@/pages/services/lowcurrent/intercom.jsx'
import ServerCrossPage from '@/pages/services/lowcurrent/server-cross.jsx'
import LanNetworkPage from '@/pages/services/lowcurrent/lan-network.jsx'
import PublicAddressPage from '@/pages/services/lowcurrent/public-address.jsx'

// ⬇️ Детальные страницы услуг (Климат-системы)
import VentilationDesignInstallPage from '@/pages/services/ventilation/ventilation-design-install.jsx'
import ConditioningVrfVrvPage from '@/pages/services/ventilation/conditioning-vrf-vrv.jsx'
import ChillerFancoilPage from '@/pages/services/ventilation/chiller-fancoil.jsx'
import HeatingHeatSupplyPage from '@/pages/services/ventilation/heating-heat-supply.jsx'
import HvacAutomationPage from '@/pages/services/ventilation/hvac-automation.jsx'
import PassportBalancingPage from '@/pages/services/ventilation/passport-balancing.jsx'
import DuctsSilencersKipiaPage from '@/pages/services/ventilation/ducts-silencers-kipia.jsx'
import ServiceMaintenancePage from '@/pages/services/ventilation/service-maintenance.jsx'

// ⬇️ Детальные страницы услуг (Проектирование)
import PowerEomPage from '@/pages/services/design/power-eom.jsx'
import HvacVkPage from '@/pages/services/design/hvac-vk.jsx'
import LowcurrentSsPage from '@/pages/services/design/lowcurrent-ss.jsx'
import AutomationAsutpPage from '@/pages/services/design/automation-asutp.jsx'
import LightningEarthingDesignPage from '@/pages/services/design/lightning-earthing.jsx'
import EstimateDocumentationPage from '@/pages/services/design/estimate-documentation.jsx'
import AuthorSupervisionPage from '@/pages/services/design/author-supervision.jsx'
import NetworkApprovalsPage from '@/pages/services/design/network-approvals.jsx'

// ⬇️ Детальные страницы услуг (Общестрой)
import GeneralFinishingPage from '@/pages/services/construction/general-finishing.jsx'
import MonolithConcretePage from '@/pages/services/construction/monolith-concrete.jsx'
import FoundationEarthworksPage from '@/pages/services/construction/foundation-earthworks.jsx'
import RoofFacadePage from '@/pages/services/construction/roof-facade.jsx'
import PartitionsOpeningsPage from '@/pages/services/construction/partitions-openings.jsx'
import StructuralStrengtheningPage from '@/pages/services/construction/structural-strengthening.jsx'
import GeneralContractingSupervisionPage from '@/pages/services/construction/general-contracting-supervision.jsx'
import CommissioningPage from '@/pages/services/construction/commissioning.jsx'

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
    // управляем прокруткой сами (иначе браузер может восстанавливать позицию и мешать доскроллу к секции)
    try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual' } catch {}
    const onPop = () => setPath(window.location.pathname.replace(/^\/+/, ''))
    window.addEventListener('popstate', onPop)
    window.addEventListener('locationchange', onPop) // на случай патча history
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('locationchange', onPop)
    }
  }, [])

  // === Гард: страницы аккаунта только для авторизованных ===
  useEffect(() => {
    if (!path.startsWith('account')) return
    let authed = false
    try { authed = !!sessionStorage.getItem('auth:lastUser') } catch {}
    if (!authed) {
      window.history.replaceState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
      setTimeout(() => { try { window.openModal?.('login') } catch {} }, 50)
    }
  }, [path])

  // === Выход: уводим с приватных страниц аккаунта на главную ===
  useEffect(() => {
    const onAuth = (e) => {
      const u = e?.detail?.user
      if (!u && (window.location.pathname || '').startsWith('/account')) {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
    window.addEventListener('auth:changed', onAuth)
    return () => window.removeEventListener('auth:changed', onAuth)
  }, [])

  // ——— ПРОКРУТКА (наверх или к секции по флагу) + ТИТУЛ ———
  useEffect(() => {
    let scrollTimer = null
    const corrTimers = []
    try {
      const onHome = path === '' || path === '/'
      let target = null
      try { target = sessionStorage.getItem('cube:scrollTo') } catch {}
      if (onHome && target) {
        // пришли на главную с «О нас / Проекты…» — доскроллим к секции (не наверх).
        // Скролл может быть заблокирован прелоадером (no-scroll) — ждём снятия и
        // самокорректируемся, пока секция не встанет к верху (устойчиво к сдвигам лейаута).
        try { sessionStorage.removeItem('cube:scrollTo') } catch {}
        const blocked = () => {
          try { const c = document.documentElement.classList; return c.contains('no-scroll') || c.contains('preloader-active') }
          catch { return false }
        }
        // ориентир как в стик-доке: верх секции + верхний паддинг её первого ребёнка − 8px «воздуха»
        const destFor = (el) => {
          const child = el.firstElementChild
          let padTop = 0
          try { padTop = child ? (parseFloat(getComputedStyle(child).paddingTop) || 0) : 0 } catch {}
          return Math.max(0, Math.round(window.scrollY + el.getBoundingClientRect().top + padTop - 8))
        }
        const scrollToSec = (smooth) => {
          const el = document.getElementById(target)
          if (el) window.scrollTo({ top: destFor(el), behavior: smooth ? 'smooth' : 'auto' })
        }
        // ждём появления секции и снятия блокировки (прелоадер), затем плавный скролл + поправки на сдвиг лейаута
        let ticks = 0
        scrollTimer = setInterval(() => {
          ticks++
          const el = document.getElementById(target)
          if (!el || blocked()) { if (ticks > 80) { clearInterval(scrollTimer); scrollTimer = null } return }
          clearInterval(scrollTimer); scrollTimer = null
          scrollToSec(true)
          corrTimers.push(setTimeout(() => scrollToSec(false), 420))
          corrTimers.push(setTimeout(() => scrollToSec(false), 900))
        }, 90)
      } else {
        requestAnimationFrame(() => {
          window.scrollTo(0, 0)
          requestAnimationFrame(() => window.scrollTo(0, 0))
        })
      }
      document.body.classList.remove('hero-zone')
    } catch {}

    const titles = {
      '': 'КУБ — Комплексные услуги бизнесу',
      '/': 'КУБ — Комплексные услуги бизнесу',
      'pages/projects': 'Проекты — CUBE',
      'legal/terms': 'Правовые положения — CUBE',
      'legal/cookies': 'Политика cookie — CUBE',
      'legal/privacy': 'Политика конфиденциальности — CUBE',
      'services/electrical': 'Электромонтаж — CUBE',
      'services/lowcurrent': 'Слаботочные системы — CUBE',
      'services/ventilation': 'Климат-системы — CUBE',
      'services/design': 'Проектирование — CUBE',
      'services/construction': 'Общестрой — CUBE',
      // Детальные страницы услуг
      'services/electrical/power-connection': 'Подключение объектов к электросетям — CUBE',
      'services/electrical/power-upgrade': 'Увеличение мощности и модернизация сетей — CUBE', // NEW
      'services/electrical/indoor': 'Внутренние электромонтажные работы — CUBE',
      'services/electrical/outdoor-networks': 'Наружные электросети и уличное освещение — CUBE',
      'services/electrical/switchgear-vru': 'Монтаж электрощитов и ВРУ — CUBE',
      'services/electrical/earthing-lightning': 'Системы заземления и молниезащиты — CUBE',
      'services/electrical/energy-metering-automation': 'Автоматизация и учёт электроэнергии — CUBE',
      'services/electrical/backup-power': 'Резервное электроснабжение — CUBE',
      'services/lowcurrent/sks': 'СКС и структурированные кабельные сети — CUBE',
      'services/lowcurrent/cctv': 'Видеонаблюдение CCTV — CUBE',
      'services/lowcurrent/ops': 'Охранно-пожарная сигнализация — CUBE',
      'services/lowcurrent/skud': 'Системы контроля и управления доступом — CUBE',
      'services/lowcurrent/intercom': 'Домофония и интерком — CUBE',
      'services/lowcurrent/server-cross': 'Серверные, кроссовые и шкафы — CUBE',
      'services/lowcurrent/lan-network': 'ЛВС и активное сетевое оборудование — CUBE',
      'services/lowcurrent/public-address': 'Системы оповещения и звука — CUBE',
      'services/ventilation/ventilation-design-install': 'Проектирование и монтаж вентиляции — CUBE',
      'services/ventilation/conditioning-vrf-vrv': 'Системы кондиционирования VRF/VRV — CUBE',
      'services/ventilation/chiller-fancoil': 'Чиллер-фанкойл системы — CUBE',
      'services/ventilation/heating-heat-supply': 'Системы отопления и теплоснабжения — CUBE',
      'services/ventilation/hvac-automation': 'Автоматика ОВиК — CUBE',
      'services/ventilation/passport-balancing': 'Паспортизация и балансировка систем — CUBE',
      'services/ventilation/ducts-silencers-kipia': 'Воздуховоды, шумоглушение, КИПиА — CUBE',
      'services/ventilation/service-maintenance': 'Сервис и регламентное обслуживание — CUBE',
      'services/design/power-eom': 'Проект электроснабжения ЭОМ — CUBE',
      'services/design/hvac-vk': 'Проект ОВ и ВК — CUBE',
      'services/design/lowcurrent-ss': 'Проект СС слаботочные системы — CUBE',
      'services/design/automation-asutp': 'АСУ ТП и разделы автоматики — CUBE',
      'services/design/lightning-earthing': 'Молниезащита и заземление — CUBE',
      'services/design/estimate-documentation': 'Сметная документация — CUBE',
      'services/design/author-supervision': 'Авторский надзор — CUBE',
      'services/design/network-approvals': 'Согласования в сетевых организациях — CUBE',
      'services/construction/general-finishing': 'Общестроительные и отделочные работы — CUBE',
      'services/construction/monolith-concrete': 'Монолитные и бетонные работы — CUBE',
      'services/construction/foundation-earthworks': 'Фундамент и земляные работы — CUBE',
      'services/construction/roof-facade': 'Кровля и фасад — CUBE',
      'services/construction/partitions-openings': 'Внутренние перегородки и проёмы — CUBE',
      'services/construction/structural-strengthening': 'Усиление конструкций — CUBE',
      'services/construction/general-contracting-supervision': 'Генподряд и технадзор — CUBE',
      'services/construction/commissioning': 'Пуско-наладка инженерных систем — CUBE',
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
    // preventScroll — иначе фокус на <main> сам прокручивает страницу наверх и ломает доскролл к секции
    if (m && typeof m.focus === 'function') { try { m.focus({ preventScroll: true }) } catch { m.focus() } }

    return () => {
      if (scrollTimer) { clearInterval(scrollTimer); scrollTimer = null }
      corrTimers.forEach(clearTimeout)
    }
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

  // Появление секций/блоков при скролле (прогрессивно; уважает prefers-reduced-motion)
  React.useLayoutEffect(() => {
    let reduce = false
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
    if (reduce) return
    // Контейнеры с последовательным появлением детей (секции страниц услуг и т.п.):
    // размечаем прямых детей как reveal с лёгким каскадом. Секции, которые содержат
    // собственные reveal-элементы (напр. карточки EventFlow), НЕ трогаем — пусть
    // их внутренние элементы каскадят сами, без двойной анимации.
    document.querySelectorAll('[data-reveal-seq]').forEach((box) => {
      Array.from(box.children).forEach((child) => {
        // Секции с собственными reveal (карточки EventFlow) не трогаем — они каскадят сами
        if (child.querySelector && child.querySelector('[data-reveal]')) return
        // Каждая секция появляется по мере доскролла (без общего индекс-делэя,
        // иначе нижние секции «залипали» бы на несколько сот мс)
        if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '')
      })
    })

    const els = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!els.length) return

    const vh = window.innerHeight || 800
    let io = null
    try {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target) }
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' })

      els.forEach((el) => {
        el.classList.add('reveal-on')
        const r = el.getBoundingClientRect()
        // Уже видно при заходе → показываем сразу (без пустоты и без каскада)
        if (r.top < vh * 0.92 && r.bottom > 0) {
          el.style.setProperty('--rd', '0ms')
          el.classList.add('is-visible')
        } else {
          io.observe(el)
        }
      })
    } catch {
      els.forEach((el) => el.classList.add('reveal-on', 'is-visible'))
    }
    return () => { if (io) io.disconnect() }
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

    // Детальные страницы услуг Электромонтажа
    if (path === 'services/electrical/power-connection') return <PowerConnectionPage />
    if (path === 'services/electrical/power-upgrade')    return <PowerUpgradePage /> // NEW
    if (path === 'services/electrical/indoor') return <IndoorWorksPage />;
    if (path === 'services/electrical/outdoor-networks') return <OutdoorNetworksPage />
    if (path === 'services/electrical/switchgear-vru')   return <SwitchgearVruPage />
    if (path === 'services/electrical/earthing-lightning') return <EarthingLightningPage />
    if (path === 'services/electrical/energy-metering-automation') return <EnergyMeteringAutomationPage />
    if (path === 'services/electrical/backup-power')     return <BackupPowerPage />

    // Детальные страницы услуг «Слаботочные системы»
    if (path === 'services/lowcurrent/sks')           return <SksPage />
    if (path === 'services/lowcurrent/cctv')          return <CctvPage />
    if (path === 'services/lowcurrent/ops')           return <OpsPage />
    if (path === 'services/lowcurrent/skud')          return <SkudPage />
    if (path === 'services/lowcurrent/intercom')      return <IntercomPage />
    if (path === 'services/lowcurrent/server-cross')  return <ServerCrossPage />
    if (path === 'services/lowcurrent/lan-network')   return <LanNetworkPage />
    if (path === 'services/lowcurrent/public-address') return <PublicAddressPage />

    // Детальные страницы услуг «Климат-системы»
    if (path === 'services/ventilation/ventilation-design-install') return <VentilationDesignInstallPage />
    if (path === 'services/ventilation/conditioning-vrf-vrv') return <ConditioningVrfVrvPage />
    if (path === 'services/ventilation/chiller-fancoil') return <ChillerFancoilPage />
    if (path === 'services/ventilation/heating-heat-supply') return <HeatingHeatSupplyPage />
    if (path === 'services/ventilation/hvac-automation') return <HvacAutomationPage />
    if (path === 'services/ventilation/passport-balancing') return <PassportBalancingPage />
    if (path === 'services/ventilation/ducts-silencers-kipia') return <DuctsSilencersKipiaPage />
    if (path === 'services/ventilation/service-maintenance') return <ServiceMaintenancePage />

    // Детальные страницы услуг «Проектирование»
    if (path === 'services/design/power-eom') return <PowerEomPage />
    if (path === 'services/design/hvac-vk') return <HvacVkPage />
    if (path === 'services/design/lowcurrent-ss') return <LowcurrentSsPage />
    if (path === 'services/design/automation-asutp') return <AutomationAsutpPage />
    if (path === 'services/design/lightning-earthing') return <LightningEarthingDesignPage />
    if (path === 'services/design/estimate-documentation') return <EstimateDocumentationPage />
    if (path === 'services/design/author-supervision') return <AuthorSupervisionPage />
    if (path === 'services/design/network-approvals') return <NetworkApprovalsPage />

    // Детальные страницы услуг «Общестрой»
    if (path === 'services/construction/general-finishing') return <GeneralFinishingPage />
    if (path === 'services/construction/monolith-concrete') return <MonolithConcretePage />
    if (path === 'services/construction/foundation-earthworks') return <FoundationEarthworksPage />
    if (path === 'services/construction/roof-facade') return <RoofFacadePage />
    if (path === 'services/construction/partitions-openings') return <PartitionsOpeningsPage />
    if (path === 'services/construction/structural-strengthening') return <StructuralStrengtheningPage />
    if (path === 'services/construction/general-contracting-supervision') return <GeneralContractingSupervisionPage />
    if (path === 'services/construction/commissioning') return <CommissioningPage />

    if (path === 'contact')               return <ContactPage />
    if (path === 'pro')                   return <ProJobsPage />

    // ====== АККАУНТ ======
    if (
      path === 'account' ||
      path === 'account/profile' ||
      path === 'account/personal' ||
      path === 'account/partner' ||
      path === 'account/supplier' ||
      path === 'account/admin' ||
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
          data-reveal
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
          data-reveal
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
          data-reveal
          data-section="contact"
          aria-label="contact"
          data-header-offset="-60"
          data-spy-offset="120"
          data-click-offset="16"
        >
          <Contact topClass="pt-14 lg:pt-[96px] xl:pt-14" />
        </section>

        <section
          id="reviews"
          data-reveal
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
        <div key={path.startsWith('account') ? 'account' : path} className="animate-pagein">
          {renderRoute()}
        </div>
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
