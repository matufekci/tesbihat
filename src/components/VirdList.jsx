import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getStepsFor, COMMON_STEPS, NAMAZ_META } from '../data/vird.js'
import { minutesOf, nowMinutes } from '../lib/prayer.js'
import { todayKey, loadVakitProgress, saveVakitProgress, resetVakitProgress } from '../lib/store.js'
import QuranBlock from './QuranBlock.jsx'
import MeaningDisclosure from './MeaningDisclosure.jsx'
import { QURAN } from '../data/quran.js'

const VAKIT_ORDER = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']
const VAKIT_LABEL = { sabah: 'Sabah', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' }
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

export default function VirdList({ now, timesData }) {
  const minuteStamp = Math.floor(nowMinutes(now))
  const detected = useMemo(() => detectVakit(timesData?.timings, minuteStamp), [timesData, minuteStamp])
  const [pinned, setPinned] = useState(null)
  const vakit = pinned ?? detected ?? 'aksam'
  const auto = pinned == null

  const greg = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const hijri = timesData?.hijri || ''

  return (
    <main className="screen vird-screen">
      <div className="date-row">
        <b>{hijri}</b>
        <span style={{ textTransform: 'capitalize' }}>{greg}</span>
      </div>

      {/* Açılışta doğrudan içinde bulunulan vaktin virdi gelir */}
      <section className="vakit-hero" aria-label="İçinde bulunulan vakit">
        <div className="vakit-hero-l">
          <div className="vh-kicker">{auto ? 'ŞİMDİ' : 'SEÇİLEN'}</div>
          <h1 className="vh-name">{VAKIT_LABEL[vakit]}</h1>
          <div className="vh-sub">{NAMAZ_META[vakit]?.sonrasi}</div>
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

      <div className="vakit-chips" role="group" aria-label="Vakit seç">
        {!auto && (
          <button className="chip chip-auto" onClick={() => setPinned(null)}>Otomatik</button>
        )}
        {VAKIT_ORDER.map((v) => (
          <button key={v} className={`chip ${v === vakit ? 'active' : ''}`} onClick={() => setPinned(v)}>
            {VAKIT_LABEL[v]}
          </button>
        ))}
      </div>

      <VirdFlow key={`${todayKey()}-${vakit}`} vakit={vakit} />
    </main>
  )
}

function quranMeanings({ sura, from, to }) {
  const all = QURAN[String(sura)] ?? []
  if (!all.length) return []
  const last = all[all.length - 1][0]
  const lo = from ?? 1
  const hi = to ?? last
  return all.filter(([n]) => n >= lo && n <= hi).map(([n, , tr]) => [n, tr])
}

function VirdFlow({ vakit }) {
  const steps = useMemo(() => getStepsFor(vakit), [vakit])
  const [state, setState] = useState(() => loadVakitProgress(vakit))
  const [laTarget, setLaTarget] = useState(20)
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

  const sectionOf = (i) => (i < COMMON_STEPS.length ? 'Ortak' : i === steps.length - 1 ? 'Kapanış' : `${VAKIT_LABEL[vakit]}’a Özel`)

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
          <h1 className="done-title">Vird Tamamlandı</h1>
          <p className="done-sub">Allah kabul eylesin.</p>
          <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={reset}>Baştan Başla</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flow">
      <div className="guided-top inflow">
        <button className="icon-btn" onClick={goBack} aria-label="Geri" disabled={idx === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="g-progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
        <div className="g-step-label">{idx + 1}/{steps.length}</div>
        <button className="font-btn" onClick={() => bumpFont(-0.15)} aria-label="Yazıyı küçült" title="Yazıyı küçült">A−</button>
        <button className="font-btn" onClick={() => bumpFont(0.15)} aria-label="Yazıyı büyüt" title="Yazıyı büyüt">A+</button>
      </div>

      <div className="guided-body inflow" key={idx} style={{ '--qs': fontScale }}>
        <div className="g-section">{sectionOf(idx)}</div>
        <h2 className="g-title">{step.title}</h2>
        {step.optional && <div className="g-optional">İsteğe bağlı</div>}

        {step.arabic && (
          <div className={`arabic ${arabicLong ? 'small' : ''}`} lang="ar" dir="rtl">
            {Array.isArray(step.arabic)
              ? step.arabic.map((line, i) => <div key={i} style={{ marginBottom: 8 }}>{line}</div>)
              : step.arabic}
          </div>
        )}
        {step.quran && <QuranBlock {...step.quran} />}
        {step.latin && <p className="latin">{step.latin}</p>}
        {step.note && <div className="note">{step.note}</div>}
        {step.quran
          ? (step.quran.sura !== 36 && step.quran.sura !== 56 && (
              <MeaningDisclosure>
                {quranMeanings(step.quran).map(([n, tr]) => <p key={n}><b>{n}.</b> {tr}</p>)}
              </MeaningDisclosure>
            ))
          : (step.meaning && (
              <MeaningDisclosure><p>{step.meaning}</p></MeaningDisclosure>
            ))}

        {isCounter ? (
          <div className="counter-zone">
            <button className="counter-ring" onClick={tapCounter} aria-label="Say">
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
            {step.id === 'la-ilahe' && (
              <div className="target-chips" role="group" aria-label="Hedef adet">
                {LA_ILAHE_OPTIONS.map((t) => (
                  <button key={t} className={`chip ${laTarget === t ? 'active' : ''}`} onClick={() => { setLaTarget(t); setState((s) => ({ ...s, counts: { ...s.counts, [step.id]: 0 } })) }}>{t}×</button>
                ))}
              </div>
            )}
            <div className="g-actions">
              <button className="btn-secondary" onClick={goNext}>Atla</button>
              <button className="btn-gold" onClick={goNext}>{isLast ? 'Bitir ✓' : 'Tamam ✓'}</button>
            </div>
          </div>
        ) : (
          <div className="counter-zone">
            <div className="g-actions" style={{ marginTop: 8 }}>
              <button className="btn-secondary" onClick={goNext}>Atla</button>
              <button className="btn-gold" onClick={goNext} autoFocus>{isLast ? 'Bitir ✓' : 'Okudum ✓ Devam'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
