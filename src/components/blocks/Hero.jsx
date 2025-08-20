import React from 'react'

export default function Hero(){
  return (
    <section id="hero" className="h-[78vh] md:h-[84vh] bg-white relative">
      <div className="container-wide h-full grid place-items-center">
        <div className="text-center">
          <h1 className="kub-h2 text-4xl sm:text-5xl md:text-6xl leading-tight">
            Инженерные системы под ключ
          </h1>
          <p className="kub-text mt-4 text-lg text-slate-600">
            Проектирование, монтаж, сервис. ПУЭ, ГОСТ, СНиП — на 100%.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a href="#contact" className="btn-gold">Получить консультацию</a>
            <a href="#services" className="btn">Наши услуги</a>
          </div>
        </div>
      </div>
    </section>
  )
}