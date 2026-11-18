import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getStepsFor, COMMON_STEPS, getRizikDuasi } from '../data/vird.js'
import { minutesOf, nowMinutes } from '../lib/prayer.js'
import { todayKey, loadVakitProgress, saveVakitProgress, resetVakitProgress } from '../lib/store.js'
import QuranBlock from './QuranBlock.jsx'
import MeaningDisclosure from './MeaningDisclosure.jsx'
import { QURAN } from '../data/quran.js'
import { CITIES } from '../data/cities.js'
import { useLang } from '../lib/i18n.js'
import { mealsOf } from '../data/meals.js'

function ayahText(sura, n) {
  return (QURAN[String(sura)] ?? []).find(([m]) => m === n)?.[1] ?? ''
}

function EndNote({ note }) {
  if (!note) return null
  return (
    <div className="rizik-endnote" role="note">
      <p className="ren-line">{note.text}</p>
      {note.ayahs?.map((n) => (
        <p key={n} className="ren-ayah" lang="ar" dir="rtl"><span className="ren-num">{n}</span> {ayahText(56, n)}</p>
      ))}
      <p className="ren-line">{note.tail}</p>
    </div>
  )
}

function MeaningBlock({ meaning }) {
  const { t } = useLang()
  if (!meaning) return null
  return (
    <MeaningDisclosure label={t('meaningToggle')}>
      {Array.isArray(meaning) ? meaning.map((l, i) => <p key={i}>{l}</p>) : <p>{meaning}</p>}
    </MeaningDisclosure>
  )
}

const VAKIT_ORDER = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']
const LA_ILAHE_OPTIONS = [20, 100, 200]

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

function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    ;[523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t0 = ctx.currentTime + i * 0.14
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9)
      o.connect(g).connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 1)
    })
  } catch { /* ses yoksa sessiz devam */ }
}
const vibrate = (p) => { try { navigator.vibrate?.(p) } catch { /* yoksay */ } }

const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

export default function VirdList({ now, timesData, settings, setSettings, onToggleNotif, onToast }) {
  const { t, lang } = useLang()
  const vlabel = (id) => t('vakit' + id.charAt(0).toUpperCase() + id.slice(1))
  const minuteStamp = Math.floor(nowMinutes(now))
  const detected = useMemo(() => detectVakit(timesData?.timings, minuteStamp), [timesData, minuteStamp])
  const [pinned, setPinned] = useState(null)
  const [started, setStarted] = useState(false)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const vakit = pinned ?? detected ?? 'aksam'
  const auto = pinned == null

  const pickCity = (cityId) => setSettings?.((s) => ({ ...s, cityId, custom: null }))
  const useGps = () => {
    setGpsError('')
    if (!('geolocation' in navigator)) { setGpsError(t('gpsUnsupported')); return }
    setGpsBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setSettings?.((s) => ({ ...s, custom: { id: 'custom', name: `${t('currentLocation')} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, lat: latitude, lng: longitude } }))
        setGpsBusy(false)
        onToast?.(t('gpsOk'))
      },
      (err) => {
        setGpsBusy(false)
        setGpsError(err?.code === 1 ? t('gpsDenied') : t('gpsFailed'))
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 }
    )
  }

  return (
    <>
    <main className="screen vird-screen start-screen">
      {/* Kompakt vakit satırı */}
      <div className="vakit-line" aria-label={t('vakitLineAria')}>
        <span className="vl-name">{vlabel(vakit)}</span>
        <span className="vl-sep">·</span>
        <span className="vl-sub">{t('vakitLine', { vakit: vlabel(vakit) })}</span>
        {!auto && <span className="vl-picked">{t('picked')}</span>}
      </div>

      <div className="vakit-chips" role="group" aria-label={t('vakitPick')}>
        {!auto && (
          <button className="chip chip-auto" onClick={() => setPinned(null)}>{t('autoChip')}</button>
        )}
        {VAKIT_ORDER.map((v) => (
          <button key={v} className={`chip ${v === vakit ? 'active' : ''}`} onClick={() => setPinned(v)}>
            {vlabel(v)}
          </button>
        ))}
      </div>

      <div className="start-wrap">
        <div className="start-orn" aria-hidden="true"><span /><i>◆</i><span /></div>
        <p className="start-verse" lang="ar" dir="rtl">فَإِذَا قَضَيْتُمُ الصَّلَاةَ فَاذْكُرُوا اللَّهَ</p>
        <p className="start-verse-tr">{t('startVerseTr')}</p>
        <button className="start-cta" onClick={() => setStarted(true)}>{t('startCta')}</button>
        <p className="start-hint">{t('startHint', { vakit: vlabel(vakit) })}</p>
      </div>

      {/* Hızlı ayarlar — ilk açılışta gerekenleri burada seç, Ayarlar'a dönmeye gerek kalmasın */}
      {settings && (
        <section className="quick-card" aria-label={t('quickSettings')}>
          <div className="quick-head">{t('quickSettings')}</div>
          <div className="quick-row">
            <label className="quick-label" htmlFor="quick-city">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.6 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.3"/></svg>
              {t('locationGroup')}
            </label>
            <div className="quick-controls">
              <select id="quick-city" className="quick-select" value={settings.custom ? 'custom' : settings.cityId} onChange={(e) => e.target.value !== 'custom' && pickCity(e.target.value)}>
                {settings.custom && <option value="custom">{settings.custom.name}</option>}
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" className="quick-gps" onClick={useGps} disabled={gpsBusy} aria-label={gpsBusy ? t('gpsBusy') : t('gpsButton')} title={gpsBusy ? t('gpsBusy') : t('gpsButton')}>
                {gpsBusy
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="2.6"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/></svg>}
              </button>
            </div>
          </div>
          {gpsError && <div className="gps-error quick-error">{gpsError}</div>}
          <div className="quick-row">
            <label className="quick-label" htmlFor="quick-notif">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/></svg>
              {t('notifLabel')}
            </label>
            <div className="quick-controls">
              {settings.notifEnabled && (
                <select className="quick-select quick-min" aria-label={t('reminderLabel')} value={settings.reminderMin} onChange={(e) => setSettings?.((s) => ({ ...s, reminderMin: parseInt(e.target.value, 10) }))}>
                  {REMINDER_OPTIONS.map((m) => <option key={m} value={m}>{t('reminderOption', { m })}</option>)}
                </select>
              )}
              <button id="quick-notif" type="button" className="switch" role="switch" aria-checked={settings.notifEnabled} aria-label={t('notifSwitchAria')} onClick={() => onToggleNotif?.(!settings.notifEnabled)} />
            </div>
          </div>
        </section>
      )}
    </main>

    {started && (
      <div className="flow-overlay" role="dialog" aria-modal="true" aria-label={t('appTitle')}>
        <VirdFlow key={`${todayKey()}-${vakit}`} vakit={vakit} onClose={() => setStarted(false)} />
      </div>
    )}
    </>
  )
}

function quranMeanings({ sura, from, to }, lang) {
  const all = QURAN[String(sura)] ?? []
  if (!all.length) return []
  const last = all[all.length - 1][0]
  const lo = from ?? 1
  const hi = to ?? last
  const override = (mealsOf(lang, sura)) ?? {}
  return all.filter(([n]) => n >= lo && n <= hi).map(([n, , tr]) => [n, override[n] ?? tr])
}

function VirdFlow({ vakit, onClose }) {
  const { t, lang } = useLang()
  const vlabel = (id) => t('vakit' + id.charAt(0).toUpperCase() + id.slice(1))
  const steps = useMemo(() => getStepsFor(vakit, lang), [vakit, lang])
  const [state, setState] = useState(() => loadVakitProgress(vakit))
  const [laTarget, setLaTarget] = useState(20)
  const [extraWindow, setExtraWindow] = useState(null)
  const [fontScale, setFontScale] = useState(() => {
    try { const v = parseFloat(localStorage.getItem('tesbihat.fontScale')); return Number.isFinite(v) ? v : 1 } catch { return 1 }
  })
  const advancing = useRef(false)

  const bumpFont = (delta) => setFontScale((s) => {
    const next = Math.min(1.6, Math.max(0.75, Math.round((s + delta) * 20) / 20))
    try { localStorage.setItem('tesbihat.fontScale', String(next)) } catch { /* yoksay */ }
    return next
  })

  useEffect(() => { saveVakitProgress(vakit, state) }, [vakit, state])

  const idx = Math.min(state.idx, steps.length - 1)
  const step = steps[idx]
  const isLast = idx === steps.length - 1
  const effectiveTarget = (s) => (s.id === 'la-ilahe' ? laTarget : s.target ?? 1)
  const isCounter = step?.type === 'counter'
  const count = state.counts?.[step.id] ?? 0
  const target = step ? effectiveTarget(step) : 1
  const pct = state.done ? 100 : Math.round((idx / steps.length) * 100)

  const sectionOf = (i) => (i < COMMON_STEPS.length ? t('sectionCommon') : i === steps.length - 1 ? t('sectionClosing') : t('specialSection', { vakit: vlabel(vakit) }))

  const goNext = () => {
    if (advancing.current) return
    advancing.current = true
    setTimeout(() => { advancing.current = false }, 150)
    setState((s) => {
      if (s.idx + 1 >= steps.length) {
        chime()
        vibrate([40, 80, 40, 80, 160])
        return { ...s, idx: steps.length - 1, done: true }
      }
      return { ...s, idx: s.idx + 1 }
    })
  }
  const goBack = () => setState((s) => (s.idx > 0 ? { ...s, idx: s.idx - 1, done: false } : s))

  const tapCounter = () => {
    if (!isCounter) return
    vibrate(10)
    setState((s) => {
      const c = (s.counts?.[step.id] ?? 0) + 1
      const reached = c >= target
      if (reached) { chime(); vibrate([25, 45, 25]) }
      const next = { ...s, counts: { ...s.counts, [step.id]: c } }
      if (reached) {
        if (s.idx + 1 >= steps.length) return { ...next, done: true }
        return { ...next, idx: s.idx + 1 }
      }
      return next
    })
  }

  const reset = () => {
    resetVakitProgress(vakit)
    setState({ idx: 0, counts: {}, done: false })
    setLaTarget(20)
  }

  const ring = 2 * Math.PI * 62
  const offset = isCounter ? ring * (1 - Math.min(1, count / target)) : 0
  const arabicLong = step?.arabic && (Array.isArray(step.arabic) ? step.arabic.join('').length : step.arabic.length) > 200

  if (state.done) {
    return (
      <div className="flow">
        <div className="done-wrap">
          <svg className="done-star" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l2.6 6.2 6.7.3-5.2 4.3 1.8 6.4L12 16l-5.9 3.2 1.8-6.4-5.2-4.3 6.7-.3L12 2Z" fill="rgba(236,201,126,.18)"/>
          </svg>
          <h1 className="done-title">{t('doneTitle')}</h1>
          <p className="done-sub">{t('doneSub')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ maxWidth: 160 }} onClick={onClose}>{t('close')}</button>
            <button className="btn btn-primary" style={{ maxWidth: 200 }} onClick={reset}>{t('restart')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flow">
      <div className="guided-top inflow">
        <button className="icon-btn" onClick={goBack} aria-label={t('back')} disabled={idx === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="g-progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
        <div className="g-step-label">{idx + 1}/{steps.length}</div>
        <button className="font-btn" onClick={() => bumpFont(-0.15)} aria-label={t('fontSmall')} title={t('fontSmall')}>A−</button>
        <button className="font-btn" onClick={() => bumpFont(0.15)} aria-label={t('fontLarge')} title={t('fontLarge')}>A+</button>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')} title={t('close')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <div className="guided-body inflow" key={idx} style={{ '--qs': fontScale }}>
        <div className="g-section">{sectionOf(idx)}</div>
        <h2 className="g-title">{step.title}</h2>
        {step.optional && <div className="g-optional">{t('optionalBadge')}</div>}
        {step.note && <div className="note">{step.note}</div>}

        {step.arabic && (
          <div className={`arabic ${arabicLong ? 'small' : ''}`} lang="ar" dir="rtl">
            {Array.isArray(step.arabic)
              ? step.arabic.map((line, i) => <div key={i} style={{ marginBottom: 8 }}>{line}</div>)
              : step.arabic}
          </div>
        )}
        {step.quran && (
          <QuranBlock
            {...step.quran}
            hotAyat={step.hotAyat}
            hotLabel={step.hotStep ? t('rizikCta') : undefined}
            highlightAyat={step.highlightAyat}
            onHotAyat={step.hotStep ? () => setExtraWindow(step.hotStep) : undefined}
          />
        )}
        {step.latin && (Array.isArray(step.latin)
          ? step.latin.map((l, i) => <p key={i} className="latin">{l}</p>)
          : <p className="latin">{step.latin}</p>)}
        {step.quran
          ? (step.quran.sura !== 36 && step.quran.sura !== 56 && (
              <MeaningDisclosure label={t('meaningToggle')}>
                {quranMeanings(step.quran, lang).map(([n, tr]) => <p key={n}><b>{n}.</b> {tr}</p>)}
              </MeaningDisclosure>
            ))
          : <MeaningBlock meaning={step.meaning} />}
        {step.endNote && <EndNote note={step.endNote} />}

        {isCounter && step.id === 'la-ilahe' && (
          <div className="target-chips in-body" role="group" aria-label={t('laTarget')}>
            {LA_ILAHE_OPTIONS.map((t) => (
              <button key={t} className={`chip ${laTarget === t ? 'active' : ''}`} onClick={() => { setLaTarget(t); setState((s) => ({ ...s, counts: { ...s.counts, [step.id]: 0 } })) }}>{t}×</button>
            ))}
          </div>
        )}
      </div>

      {extraWindow && (() => {
        const w = extraWindow === 'rizik-duasi' ? getRizikDuasi(lang) : steps.find((x) => x.id === extraWindow)
        if (!w) return null
        return (
          <div className="extra-window" role="dialog" aria-modal="true" aria-label={w.title}>
            <div className="extra-top">
              <button className="font-btn" onClick={() => bumpFont(-0.15)} aria-label={t('fontSmall')} title={t('fontSmall')}>A−</button>
              <button className="font-btn" onClick={() => bumpFont(0.15)} aria-label={t('fontLarge')} title={t('fontLarge')}>A+</button>
              <button className="icon-btn" onClick={() => setExtraWindow(null)} aria-label={t('close')} title={t('close')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
            <div className="extra-body" style={{ '--qs': fontScale }}>
              <h2 className="g-title">{w.title}</h2>
              {w.arabic && (
                <div className="arabic small" lang="ar" dir="rtl">
                  {Array.isArray(w.arabic) ? w.arabic.map((line, i) => <div key={i} style={{ marginBottom: 8 }}>{line}</div>) : w.arabic}
                </div>
              )}
              {w.latin && (Array.isArray(w.latin) ? w.latin.map((l, i) => <p key={i} className="latin">{l}</p>) : <p className="latin">{w.latin}</p>)}
              <MeaningBlock meaning={w.meaning} />
              {w.endNote && <EndNote note={w.endNote} />}
            </div>
            <div className="flow-dock">
              <button className="done-ring" onClick={() => setExtraWindow(null)} aria-label={t('rizikContinueAria')}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>
              </button>
            </div>
          </div>
        )
      })()}

      {/* Alt sabit alan: yalnız yuvarlak halka */}
      <div className="flow-dock">
        {isCounter ? (
          <button className="counter-ring" onClick={tapCounter} aria-label={t('count')} autoFocus>
            <svg width="148" height="148" viewBox="0 0 148 148">
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ecc97e" />
                  <stop offset="55%" stopColor="#d9b36c" />
                  <stop offset="100%" stopColor="#a87f3d" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="74" cy="74" r="62" strokeWidth="10" fill="none" />
              <circle className="ring-fg" cx="74" cy="74" r="62" strokeWidth="10" fill="none"
                      stroke="url(#goldGrad)" strokeDasharray={ring} strokeDashoffset={offset} />
            </svg>
            <span className="counter-num">
              <b>{count}</b>
              <span>/ {target}</span>
            </span>
          </button>
        ) : (
          <button className="done-ring" onClick={goNext} autoFocus aria-label={isLast ? t('doneLastAria') : t('readDoneAria')}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}
