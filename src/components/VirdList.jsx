import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getStepsFor, COMMON_STEPS, NAMAZ_META } from '../data/vird.js'
import { minutesOf, nowMinutes } from '../lib/prayer.js'
import { loadDay, saveDay, resetVakit, todayKey } from '../lib/store.js'

const VAKIT_ORDER = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']
const VAKIT_LABEL = { sabah: 'Sabah', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' }

const VAKIT_ICON = {
  sabah: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9V3m0 0L9.5 5.5M12 3l2.5 2.5"/><path d="M4 18h16"/><path d="M7 18a5 5 0 0 1 10 0"/></svg>),
  ogle: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>),
  ikindi: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="4"/><path d="M12 5.5V3M5 13H2.5M21.5 13H19M6.4 7.4 4.9 5.9M17.6 7.4l1.5-1.5"/><path d="M3 19h18"/></svg>),
  aksam: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V9m0 0-2.5 2.5M12 9l2.5 2.5"/><path d="M4 18h16"/><path d="M7 18a5 5 0 0 1 10 0"/></svg>),
  yatsi: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/><path d="M17 3l.5 1.4L19 5l-1.5.6L17 7l-.5-1.4L15 5l1.5-.6L17 3Z"/></svg>),
}

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

const effTarget = (step, laIlaheTarget) => (step.id === 'la-ilahe' ? laIlaheTarget : step.target ?? 1)
const vibrate = (p) => { try { navigator.vibrate?.(p) } catch { /* yoksay */ } }

function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    ;[523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t0 = ctx.currentTime + i * 0.15
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0)
      o.connect(g).connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 1.1)
    })
  } catch { /* sessiz devam */ }
}

export default function VirdList({ now, timesData, settings, doneTodaySize, streak, onCompleteVird, onUpdateSettings, onToast }) {
  const nowMin = nowMinutes(now)
  const minuteStamp = Math.floor(nowMin)
  const detected = useMemo(() => detectVakit(timesData?.timings, minuteStamp), [timesData, minuteStamp])
  const [pinned, setPinned] = useState(null)
  const vakit = pinned ?? detected ?? 'aksam'
  const auto = pinned == null

  const [day, setDay] = useState(() => loadDay())
  const dayKey = todayKey(now)
  useEffect(() => { setDay(loadDay()) }, [dayKey])

  const steps = useMemo(() => getStepsFor(vakit), [vakit])
  const commonSteps = steps.slice(0, COMMON_STEPS.length)
  const extraSteps = steps.slice(COMMON_STEPS.length, -1)
  const closingStep = steps[steps.length - 1]

  const counts = day.counts[vakit] ?? {}
  const eff = (s) => effTarget(s, settings.laIlaheTarget)
  const totalUnits = steps.reduce((acc, s) => acc + eff(s), 0)
  const doneUnits = steps.reduce((acc, s) => acc + Math.min(counts[s.id] ?? 0, eff(s)), 0)
  const pct = totalUnits ? doneUnits / totalUnits : 0
  const doneSteps = steps.filter((s) => (counts[s.id] ?? 0) >= eff(s)).length
  const allDone = steps.length > 0 && doneSteps === steps.length

  // Tamamlanınca: kaydet + istatistik + chime (vakit başına bir kez)
  const firedFor = useRef(null)
  useEffect(() => {
    if (allDone && !day.completed[vakit] && firedFor.current !== `${dayKey}:${vakit}`) {
      firedFor.current = `${dayKey}:${vakit}`
      setDay((prev) => {
        if (prev.completed[vakit]) return prev
        const nd = { ...prev, completed: { ...prev.completed, [vakit]: true } }
        saveDay(nd)
        return nd
      })
      onCompleteVird?.(vakit)
      chime()
      vibrate([40, 80, 40])
    }
  }, [allDone, vakit, day.completed, dayKey, onCompleteVird])

  const tap = (step) => {
    vibrate(8)
    setDay((prev) => {
      const cur = prev.counts[vakit]?.[step.id] ?? 0
      const max = eff(step)
      const nxt = Math.min(max, cur + 1)
      if (nxt === cur) return prev
      const countsForVakit = { ...(prev.counts[vakit] ?? {}), [step.id]: nxt }
      const nd = { ...prev, counts: { ...prev.counts, [vakit]: countsForVakit } }
      saveDay(nd)
      return nd
    })
  }
  const undo = (step, e) => {
    e?.stopPropagation?.()
    vibrate(5)
    setDay((prev) => {
      const cur = prev.counts[vakit]?.[step.id] ?? 0
      if (cur <= 0) return prev
      const countsForVakit = { ...(prev.counts[vakit] ?? {}), [step.id]: cur - 1 }
      const nd = { ...prev, counts: { ...prev.counts, [vakit]: countsForVakit } }
      saveDay(nd)
      return nd
    })
  }
  const resetCurrent = () => {
    setDay((prev) => resetVakit(prev, vakit))
    onToast?.(`${VAKIT_LABEL[vakit]} sayaçları sıfırlandı`)
  }

  const greg = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const R = 34
  const C = 2 * Math.PI * R
  const meta = NAMAZ_META[vakit]

  return (
    <main className="screen vird-screen">
      <header className="topbar">
        <div className="greet">Tesbihat<strong>Namaz Sonrası Zikir</strong></div>
        <div className="hijri">
          <b>{todayKey(now).split('-').reverse().join('.')}</b>
          <span style={{ display: 'block', textTransform: 'capitalize' }}>{greg}</span>
        </div>
      </header>

      {/* vakit kahramanı + ilerleme halkası */}
      <section className="vakit-hero" aria-label="Seçili vakit">
        <div className="vakit-hero-l">
          <div className="vh-kicker">{auto ? 'ŞİMDİ' : 'SEÇİLEN'}</div>
          <h1 className="vh-name">{VAKIT_LABEL[vakit]}</h1>
          <div className="vh-sub">{meta?.sonrasi}</div>
        </div>
        <div className="vakit-ring" role="img" aria-label={`%${Math.round(pct * 100)} tamamlandı`}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(217,179,108,.15)" strokeWidth="7" />
            <circle cx="44" cy="44" r={R} fill="none" stroke="url(#vgold)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 44 44)"
                    style={{ transition: 'stroke-dashoffset .35s ease' }} />
            <defs>
              <linearGradient id="vgold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ecc97e" /><stop offset=".55" stopColor="#d9b36c" /><stop offset="1" stopColor="#a87f3d" />
              </linearGradient>
            </defs>
          </svg>
          <div className="vakit-ring-num"><b>{doneSteps}</b><span>/ {steps.length}</span></div>
        </div>
      </section>

      {/* vakit seçim çipleri */}
      <div className="vakit-chips" role="group" aria-label="Vakit seç">
        {!auto && (
          <button className="chip chip-auto" onClick={() => setPinned(null)} title="Vakti saate bırak">Otomatik</button>
        )}
        {VAKIT_ORDER.map((v) => (
          <button key={v} className={`chip ${v === vakit ? 'active' : ''}`} onClick={() => setPinned(v === detected && auto ? null : v)}>
            {VAKIT_LABEL[v]}
          </button>
        ))}
      </div>

      {/* liste: ortak */}
      <h2 className="sec-head"><span>Ortak — Her Namazdan Sonra</span>
        <button className="mini-reset" onClick={resetCurrent} title="Bu vaktin sayaçlarını sıfırla" aria-label="Sayaçları sıfırla">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.3L3 8"/><path d="M3 3v5h5"/></svg>
          Sıfırla
        </button>
      </h2>
      {commonSteps.map((s) => (
        <ZRow key={s.id} step={s} count={counts[s.id] ?? 0} target={eff(s)} onTap={tap} onUndo={undo}
              laIlaheTarget={settings.laIlaheTarget} onLaChange={(n) => onUpdateSettings?.({ laIlaheTarget: n })} />
      ))}

      {extraSteps.length > 0 && <h2 className="sec-head"><span>{VAKIT_LABEL[vakit]}’a Özel</span></h2>}
      {extraSteps.map((s) => (
        <ZRow key={s.id} step={s} count={counts[s.id] ?? 0} target={eff(s)} onTap={tap} onUndo={undo} />
      ))}

      <h2 className="sec-head"><span>Kapanış</span></h2>
      <ZRow step={closingStep} count={counts[closingStep.id] ?? 0} target={eff(closingStep)} onTap={tap} onUndo={undo} />

      {/* tamamlandı bandı */}
      {allDone && (
        <div className="complete-banner" role="status">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l2.5 6 6.5.3-5 4.2 1.7 6.2L12 15.4 6.3 18.7 8 12.5 3 8.3 9.5 8 12 2Z" fill="rgba(236,201,126,.2)"/>
          </svg>
          <div>
            <b>Mâşallah — {VAKIT_LABEL[vakit]} virdi tamamlandı.</b>
            <span>Fâtiha’nı okuyup ruhlara hediye ettin. Allah kabul eylesin.</span>
          </div>
        </div>
      )}

      <p className="day-summary">Bugün <b>{doneTodaySize}/5</b> vakit tamamlandı · Seri <b>{streak}</b> gün</p>
    </main>
  )
}

function ZRow({ step, count, target, onTap, onUndo, laIlaheTarget, onLaChange }) {
  const done = count >= target
  const remaining = Math.max(0, target - count)
  const arabicLong = step.arabic && (Array.isArray(step.arabic) ? step.arabic.join('').length : step.arabic.length) > 220
  const rr = 26
  const cc = 2 * Math.PI * rr
  const frac = target ? Math.min(1, count / target) : 0

  return (
    <div className={`zrow ${done ? 'done' : ''}`} role="button" tabIndex={0} aria-label={`${step.title} — saydır`}
         onClick={() => onTap(step)}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(step) } }}>
      <div className="zrow-main">
        <div className="zrow-title">
          {step.title}
          <span className="zrow-target">×{target}{step.optional ? ' · isteğe bağlı' : ''}</span>
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
        {step.targetOptions && (
          <div className="target-chips zrow-chips" onClick={(e) => e.stopPropagation()}>
            {step.targetOptions.map((t) => (
              <button key={t} className={`chip ${laIlaheTarget === t ? 'active' : ''}`} onClick={() => onLaChange?.(t)}>{t}×</button>
            ))}
          </div>
        )}
      </div>
      <div className="zcounter-wrap">
        <div className="zcounter" aria-hidden="true">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r={rr} fill="none" stroke="rgba(217,179,108,.14)" strokeWidth="6" />
            <circle cx="34" cy="34" r={rr} fill="none" stroke={done ? '#57c98a' : 'url(#zgold)'} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={cc} strokeDashoffset={cc * (1 - frac)} transform="rotate(-90 34 34)"
                    style={{ transition: 'stroke-dashoffset .2s ease' }} />
            <defs>
              <linearGradient id="zgold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ecc97e" /><stop offset="1" stopColor="#a87f3d" />
              </linearGradient>
            </defs>
          </svg>
          {done ? (
            <svg className="zcheck" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.2 5.2L20 6.5"/></svg>
          ) : (
            <span className="znum"><b>{remaining}</b></span>
          )}
        </div>
        {count > 0 && !done && (
          <button className="zundo" onClick={(e) => onUndo(step, e)} aria-label="Bir azalt">−1</button>
        )}
      </div>
    </div>
  )
}
