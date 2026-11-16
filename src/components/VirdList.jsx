import React, { useMemo, useState } from 'react'
import { getStepsFor, COMMON_STEPS, NAMAZ_META } from '../data/vird.js'
import { minutesOf, nowMinutes } from '../lib/prayer.js'

const VAKIT_ORDER = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']
const VAKIT_LABEL = { sabah: 'Sabah', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' }

function detectVakit(timings, nowMin) {
  if (!timings) return null
  const imsak = minutesOf(timings.Imsak)
  const dhuhr = minutesOf(timings.Dhuhr)
  const asr = minutesOf(timings.Asr)
  const maghrib = minutesOf(timings.Maghrib)
  const isha = minutesOf(timings.Isha)
  if ([imsak, dhuhr, asr, maghrib, isha].some((v) => v == null)) return null
  if (nowMin < imsak) return 'yatsi'
  if (nowMin < dhuhr) return 'sabah'
  if (nowMin < asr) return 'ogle'
  if (nowMin < maghrib) return 'ikindi'
  if (nowMin < isha) return 'aksam'
  return 'yatsi'
}

export default function VirdList({ now, timesData }) {
  const nowMin = nowMinutes(now)
  const minuteStamp = Math.floor(nowMin)
  const detected = useMemo(() => detectVakit(timesData?.timings, minuteStamp), [timesData, minuteStamp])
  const [pinned, setPinned] = useState(null)
  const vakit = pinned ?? detected ?? 'aksam'
  const auto = pinned == null

  const steps = useMemo(() => getStepsFor(vakit), [vakit])
  const commonSteps = steps.slice(0, COMMON_STEPS.length)
  const extraSteps = steps.slice(COMMON_STEPS.length, -1)
  const closingStep = steps[steps.length - 1]

  const greg = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const meta = NAMAZ_META[vakit]

  return (
    <main className="screen vird-screen">
      <header className="topbar">
        <div className="greet">Tesbihat<strong>Namaz Sonrası Zikir</strong></div>
        <div className="hijri">
          <b>{timesData?.hijri || ''}</b>
          <span style={{ display: 'block', textTransform: 'capitalize' }}>{greg}</span>
        </div>
      </header>

      {/* vakit kahramanı — açılışta doğrudan bu ekran gelir */}
      <section className="vakit-hero" aria-label="İçinde bulunulan vakit">
        <div className="vakit-hero-l">
          <div className="vh-kicker">{auto ? 'ŞİMDİ' : 'SEÇİLEN'}</div>
          <h1 className="vh-name">{VAKIT_LABEL[vakit]}</h1>
          <div className="vh-sub">{meta?.sonrasi}</div>
        </div>
        <svg className="vakit-ornament" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M36 6 66 36 36 66 6 36Z" stroke="url(#og)" strokeWidth="1.6" opacity=".9"/>
          <path d="M36 16 56 36 36 56 16 36Z" stroke="url(#og)" strokeWidth="1.1" opacity=".6"/>
          <circle cx="36" cy="36" r="7.5" fill="url(#og)" opacity=".95"/>
          <circle cx="36" cy="36" r="3" fill="var(--bg-1)"/>
          <defs>
            <linearGradient id="og" x1="10" y1="10" x2="62" y2="62">
              <stop offset="0" stopColor="#ecc97e"/><stop offset=".55" stopColor="#d9b36c"/><stop offset="1" stopColor="#a87f3d"/>
            </linearGradient>
          </defs>
        </svg>
      </section>

      {/* vakit çipleri */}
      <div className="vakit-chips" role="group" aria-label="Vakit seç">
        {!auto && (
          <button className="chip chip-auto" onClick={() => setPinned(null)}>Otomatik</button>
        )}
        {VAKIT_ORDER.map((v) => (
          <button key={v} className={`chip ${v === vakit ? 'active' : ''}`} onClick={() => setPinned(v === detected ? (auto ? null : v) : v)}>
            {VAKIT_LABEL[v]}
          </button>
        ))}
      </div>

      <h2 className="sec-head"><span>Ortak — Her Namazdan Sonra</span></h2>
      {commonSteps.map((s) => <KRow key={s.id} step={s} />)}

      {extraSteps.length > 0 && <h2 className="sec-head"><span>{VAKIT_LABEL[vakit]}’a Özel</span></h2>}
      {extraSteps.map((s) => <KRow key={s.id} step={s} />)}

      <h2 className="sec-head"><span>Kapanış</span></h2>
      <KRow step={closingStep} />

      <p className="day-summary">Allah kabul eylesin.</p>
    </main>
  )
}

function KRow({ step }) {
  const arabicLong = step.arabic && (Array.isArray(step.arabic) ? step.arabic.join('').length : step.arabic.length) > 220
  return (
    <article className="krow">
      <div className="krow-title">
        {step.title}
        {step.target ? <span className="krow-tag">{step.target} defa</span> : null}
        {step.optional ? <span className="krow-tag">isteğe bağlı</span> : null}
      </div>
      {step.arabic && (
        <div className={`arabic zrow-ar ${arabicLong ? 'small' : ''}`} lang="ar" dir="rtl">
          {Array.isArray(step.arabic)
            ? step.arabic.map((line, i) => <div key={i}>{line}</div>)
            : step.arabic}
        </div>
      )}
      {step.latin && <p className="latin zrow-latin">{step.latin}</p>}
      {step.meaning && <p className="meaning zrow-meaning">{step.meaning}</p>}
      {step.note && <div className="note zrow-note">{step.note}</div>}
    </article>
  )
}
