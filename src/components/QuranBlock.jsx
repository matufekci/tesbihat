import React from 'react'
import { QURAN, SURAH_NAMES, BASMALA } from '../data/quran.js'

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const arDigits = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d])

// Âyet imi: U+06DD (Arapça âyet sonu işareti) + âyet numarası — yönsüz tek işaret
export default function QuranBlock({ sura, from = 1, to }) {
  const all = QURAN[String(sura)] || []
  const max = to ?? (all.length ? all[all.length - 1][0] : 0)
  const ayats = all.filter(([n]) => n >= from && n <= max)
  if (!ayats.length) return null
  const isExcerpt = from !== 1 || max !== all[all.length - 1][0]
  const isFullSurah = !isExcerpt && sura !== 1
  const density = ayats.length > 70 ? 'xs' : ayats.length > 30 ? 'sm' : ''

  return (
    <div className={`quran-block ${density}`} role="region" aria-label="Kur'ân metni">
      {isFullSurah && <div className="quran-basmala" lang="ar" dir="rtl">{BASMALA}</div>}
      <p className="quran-text" lang="ar" dir="rtl">
        {ayats.map(([n, text]) => (
          <React.Fragment key={n}>
            {text}
            <span className="ayah-mark" aria-label={`Âyet ${n}`}> ۝{arDigits(n)} </span>
          </React.Fragment>
        ))}
      </p>
    </div>
  )
}
