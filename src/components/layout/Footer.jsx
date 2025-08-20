import React from 'react'

export default function Footer(){
  return (
    <footer className="mt-24 border-t border-slate-200/60">
      <div className="container-wide py-10 flex items-center justify-between kub-text text-sm text-slate-600">
        <p>© {new Date().getFullYear()} КУБ. Все права защищены.</p>
        <p className="opacity-80">Сделано с аккуратностью</p>
      </div>
    </footer>
  )
}