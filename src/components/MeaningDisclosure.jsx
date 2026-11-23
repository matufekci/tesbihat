import React, { useState } from 'react'
import AppIcon from './AppIcon.jsx'

// Katlanabilir meal/anlam bölümü — altta durur, dileyen açar
export default function MeaningDisclosure({ label = 'Meaning', children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="meaning-wrap">
      <button className="meaning-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="meaning-toggle-label"><AppIcon name="book" size={17} />{label}</span>
        <svg className={open ? 'open' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <div className="meaning-panel">{children}</div>}
    </div>
  )
}
