import React from 'react'
import { QURAN, BASMALA } from '../data/quran.js'
import transliterations from '../data/quran-transliteration.json'
import { useLang } from '../lib/i18n.js'

const READING_SOURCES = { 2: 'bakara', 36: 'yasin', 56: 'vakia', 59: 'hasr', 67: 'mulk', 71: 'nuh', 78: 'nebe' }
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const arDigits = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d])

// Âyet imi: U+06DD (Arapça âyet sonu işareti) + âyet numarası — yönsüz tek işaret
export default function QuranBlock({ sura, from = 1, to, hotAyat, hotLabel, highlightAyat, onHotAyat }) {
  const { t } = useLang()
  const all = QURAN[String(sura)] || []
  const max = to ?? (all.length ? all[all.length - 1][0] : 0)
  const ayats = all.filter(([n]) => n >= from && n <= max)
  if (!ayats.length) return null
  const isExcerpt = from !== 1 || max !== all[all.length - 1][0]
  const isFullSurah = !isExcerpt && sura !== 1
  const density = ayats.length > 70 ? 'xs' : ayats.length > 30 ? 'sm' : ''
  const highlight = new Set(highlightAyat ?? [])
  const latin = transliterations[String(sura)]
  const interactive = hotAyat != null && typeof onHotAyat === 'function'

  return (
    <div className={`quran-block ${density}`} role="region" aria-label={t('quranAria')}>
      {isFullSurah && <div className="quran-basmala" lang="ar" dir="rtl">{BASMALA}</div>}
      <p className="quran-text" lang="ar" dir="rtl">
        {ayats.map(([n, text]) => {
          const mark = <span className="ayah-mark" aria-label={`${t('ayahLabel')} ${n}`}> ۝{arDigits(n)} </span>
          if (interactive && n === hotAyat) {
            return (
              <React.Fragment key={n}>
                <button type="button" className="ayah-hotspot" onClick={onHotAyat} aria-label={`${t('ayahLabel')} ${n} — ${hotLabel ?? t('openContinue')}`}>
                  <span className="ayah-hot-text">{text}</span>
                  {mark}
                  <span className="ayah-cta" dir="auto">🤲 {hotLabel ?? t('openContinue')}</span>
                </button>{' '}
              </React.Fragment>
            )
          }
          if (highlight.has(n)) {
            return (
              <React.Fragment key={n}>
                <span className="ayah-highlight">{text}{mark}</span>{' '}
              </React.Fragment>
            )
          }
          return <React.Fragment key={n}>{text}{mark} </React.Fragment>
        })}
      </p>
      {latin && (
        <section className="quran-reading" aria-label={t('latinReading')}>
          <h3>{t('latinReading')}</h3>
          <p className="quran-reading-note">{t('latinReadingNote')} {(sura === 56 || sura === 2 || sura === 36 || sura === 59) ? t('userReadingSource') : <a href={`https://www.namazzamani.net/kuranmeali/${READING_SOURCES[sura]}-suresi.htm`} target="_blank" rel="noreferrer">Namaz Zamanı</a>}{' (q/k)'}</p>
          {sura === 56 && <p className="quran-reading-note">{t('readingVariantsNote')}</p>}
          <p className="quran-reading-note">{t('qReadingNote')}</p>
          {isFullSurah && <p className="quran-reading-basmala" lang="tr" dir="ltr">Bismillâhirrahmânirrahîm.</p>}
          <ol className="quran-reading-verses" lang="tr" dir="ltr">
            {ayats.map(([n]) => (
              <li key={n} value={n}>
                <span className="quran-reading-number" aria-hidden="true">{n}.</span>
                <span>{latin[n]}</span>
                {interactive && n === hotAyat && <button type="button" className="quran-reading-hotspot" onClick={onHotAyat}>{hotLabel ?? t('openContinue')}</button>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
