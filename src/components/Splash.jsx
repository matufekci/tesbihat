import React, { useEffect, useState } from 'react'
import { useLang } from '../lib/i18n.js'

// Ultra profesyonel animasyonlu açılış — 2.2s sonra kaybolur, dokununca atlanır
export default function Splash({ onDone }) {
  const { t } = useLang()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2200)
    const t2 = setTimeout(onDone, 2750)
    const skip = () => setLeaving(true)
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      <svg className="splash-star" viewBox="0 0 200 200" width="150" height="150">
        <defs>
          <linearGradient id="spGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e5ac" />
            <stop offset=".45" stopColor="#d9b36c" />
            <stop offset="1" stopColor="#7d5e23" />
          </linearGradient>
          <radialGradient id="spCore" cx=".5" cy=".4" r=".8">
            <stop offset="0" stopColor="#174a3a" />
            <stop offset="1" stopColor="#081f18" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="88" fill="url(#spCore)" stroke="url(#spGold)" strokeWidth="2.6" />
        <circle className="splash-ring" cx="100" cy="100" r="72" fill="none" stroke="url(#spGold)" strokeWidth="1.1" strokeDasharray="4 9" />
        <g stroke="url(#spGold)" strokeWidth="2.4" fill="rgba(217,179,108,.07)" strokeLinejoin="round">
          <rect x="59" y="59" width="82" height="82" rx="7" />
          <rect x="59" y="59" width="82" height="82" rx="7" transform="rotate(45 100 100)" />
        </g>
        <text x="100" y="126" textAnchor="middle" fontFamily="'Scheherazade New', serif" fontSize="50" fontWeight="700" fill="url(#spGold)">ت</text>
      </svg>
      <div className="splash-eyebrow">{t('eyebrow')}</div>
      <h1 className="splash-title">{t('appTitle')}</h1>
      <div className="splash-divider"><span /><i>◆</i><span /></div>
      <div className="splash-ar" lang="ar" dir="rtl">أذكار السيد محمد روحي القادري</div>
      <div className="splash-bar"><span /></div>
      <div className="splash-foot">TESBİHAT</div>
    </div>
  )
}
