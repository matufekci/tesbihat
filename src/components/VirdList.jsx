import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getStepsFor, COMMON_STEPS, getRizikDuasi } from '../data/vird.js'
import { minutesOf, nowMinutes } from '../lib/prayer.js'
import { todayKey, loadVakitProgress, saveVakitProgress, resetVakitProgress, loadActiveVakit, saveActiveVakit, clearActiveVakit, reminderSettings } from '../lib/store.js'
import QuranBlock from './QuranBlock.jsx'
import CompletionCelebration from './CompletionCelebration.jsx'
import MeaningDisclosure from './MeaningDisclosure.jsx'
import AppIcon from './AppIcon.jsx'
import { QURAN, diyanetAyah } from '../data/quran.js'
import { CITIES } from '../data/cities.js'
import { useLang } from '../lib/i18n.js'
import { mealsOf } from '../data/meals.js'

function ayahText(sura, n) {
  return (QURAN[String(sura)] ?? []).find(([m]) => m === n)?.[1] ?? ''
}

// Highlight only the four changing words in this salawat; retain the exact text.
const SALAVAT_ARABIC_WORDS = ['سَيِّدِنَا', 'حَبِيبِنَا', 'أَسْعَدِنَا', 'شَفِيعِنَا']
const SALAVAT_LATIN_WORDS = ['seyyidinâ', 'habîbinâ', 'es’adinâ', 'şefî’inâ']
function highlightSalavat(text, words) {
  const pieces = []
  let cursor = 0
  while (cursor < text.length) {
    const matches = words.map((word) => ({ word, index: text.indexOf(word, cursor) })).filter((match) => match.index !== -1)
    if (!matches.length) { pieces.push(text.slice(cursor)); break }
    matches.sort((a, b) => a.index - b.index)
    const { word, index } = matches[0]
    pieces.push(text.slice(cursor, index), <strong key={index} className="salavat-emphasis">{word}</strong>)
    cursor = index + word.length
  }
  return pieces
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

function MeaningBlock({ meaning, meaningLanguage }) {
  const { t } = useLang()
  if (!meaning) return null
  return (
    <MeaningDisclosure label={meaningLanguage === 'tr' ? 'Türkçe Anlamı' : t('meaningToggle')}>
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

function chime(enabled = true) {
  if (!enabled) return
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
      if (i === 2) o.onended = () => { ctx.close().catch(() => {}) }
    })
  } catch { /* ses yoksa sessiz devam */ }
}
const vibrate = (p, enabled = true) => { if (!enabled) return; try { navigator.vibrate?.(p) } catch { /* yoksay */ } }

const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

export default function VirdList({ now, timesData, settings, setSettings, onToggleNotif, onToast }) {
  const { t } = useLang()
  const vlabel = (id) => t('vakit' + id.charAt(0).toUpperCase() + id.slice(1))
  const minuteStamp = Math.floor(nowMinutes(now))
  const detected = useMemo(() => detectVakit(timesData?.timings, minuteStamp), [timesData, minuteStamp])
  const [pinned, setPinned] = useState(null)
  const [activeVakit, setActiveVakit] = useState(loadActiveVakit)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [quickExpanded, setQuickExpanded] = useState(false)
  const [sheetDragY, setSheetDragY] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const sheetGesture = useRef(null)
  const suppressHandleClick = useRef(false)
  const vakit = pinned ?? detected ?? 'aksam'
  const auto = pinned == null
  const startFlow = () => {
    const progress = loadVakitProgress(vakit)
    const laTarget = progress.laTarget ?? 20
    saveActiveVakit(vakit, progress, laTarget)
    setActiveVakit({ vakit, progress, laTarget })
  }
  const closeFlow = () => {
    clearActiveVakit()
    setActiveVakit(null)
  }

  const startSheetDrag = (event) => {
    if (event.button != null && event.button !== 0) return
    sheetGesture.current = { startY: event.clientY }
    setSheetDragging(true)
    suppressHandleClick.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveSheetDrag = (event) => {
    if (!sheetGesture.current) return
    const distance = event.clientY - sheetGesture.current.startY
    setSheetDragY(Math.max(-110, Math.min(110, distance)))
    // Expand/collapse while the finger is still moving, not only on pointer release.
    if (distance < -24) setQuickExpanded(true)
    else if (distance > 24) setQuickExpanded(false)
  }
  const finishSheetDrag = (event) => {
    if (!sheetGesture.current) return
    const distance = event.clientY - sheetGesture.current.startY
    sheetGesture.current = null
    setSheetDragging(false)
    setSheetDragY(0)
    if (Math.abs(distance) > 8) suppressHandleClick.current = true
    if (distance < -40) setQuickExpanded(true)
    else if (distance > 40) setQuickExpanded(false)
  }
  const cancelSheetDrag = () => {
    sheetGesture.current = null
    setSheetDragging(false)
    setSheetDragY(0)
  }
  const toggleSheet = (event) => {
    if (suppressHandleClick.current) {
      suppressHandleClick.current = false
      event.preventDefault()
      return
    }
    setQuickExpanded((expanded) => !expanded)
  }

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
    <main className={`screen vird-screen start-screen${quickExpanded ? ' sheet-expanded' : ''}`}>
      <div className="start-wrap">
        <div className="start-orn" aria-hidden="true"><span /><i>◆</i><span /></div>
        <p className="start-verse" lang="ar" dir="rtl">{diyanetAyah(4, 103)}</p>
        <p className="start-verse-tr">{t('startVerseTr')}</p>
        <div className="vakit-line" aria-label={t('vakitLineAria')}>
          <span className="vl-name">{vlabel(vakit)}</span>
        </div>
        <button className="start-cta" onClick={startFlow}><AppIcon name="beads" size={20} /><span>{t('startCta')}</span></button>
      </div>

      {settings && (
        <section
          className={`quick-sheet${quickExpanded ? ' is-expanded' : ''}${sheetDragging ? ' is-dragging' : ''}`}
          style={{ '--sheet-drag-y': `${sheetDragY}px` }}
          aria-label={t('quickSettings')}
        >
          <button
            type="button"
            className="quick-sheet-handle"
            aria-expanded={quickExpanded}
            aria-controls="quick-settings-panel"
            onClick={toggleSheet}
            onPointerDown={startSheetDrag}
            onPointerMove={moveSheetDrag}
            onPointerUp={finishSheetDrag}
            onPointerCancel={cancelSheetDrag}
          >
            <span className="quick-sheet-grabber" aria-hidden="true" />
            <span className="quick-sheet-headline">
              <span className="quick-sheet-label"><AppIcon name="sliders" size={15} />{t('quickSettings')}</span>
              <span className="quick-sheet-current">{vlabel(vakit)}</span>
              <svg className={quickExpanded ? 'open' : ''} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </button>

          <div className="vakit-chips bottom-vakit-chips" role="group" aria-label={t('vakitPick')}>
            {!auto && (
              <button type="button" className="chip chip-auto" aria-pressed={auto} onClick={() => setPinned(null)}>{t('autoChip')}</button>
            )}
            {VAKIT_ORDER.map((v) => (
              <button type="button" key={v} className={`chip ${v === vakit ? 'active' : ''}`} aria-pressed={v === vakit && !auto} onClick={() => setPinned(v)}>
                {vlabel(v)}
              </button>
            ))}
          </div>

          <div id="quick-settings-panel" className={`quick-sheet-settings${quickExpanded ? ' is-expanded' : ''}`} aria-hidden={!quickExpanded}>
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
                  <select className="quick-select quick-min" aria-label={t('reminderLabel')} value={settings.reminderMin} onChange={(e) => setSettings?.((s) => { const delay = parseInt(e.target.value, 10); return { ...s, reminderMin: delay, reminders: Object.fromEntries(Object.entries(reminderSettings(s)).map(([id, item]) => [id, { ...item, delay }])) } })}>
                    {REMINDER_OPTIONS.map((m) => <option key={m} value={m}>{t('reminderOption', { m })}</option>)}
                  </select>
                )}
                <button id="quick-notif" type="button" className="switch" role="switch" aria-checked={settings.notifEnabled} aria-label={t('notifSwitchAria')} onClick={() => onToggleNotif?.(!settings.notifEnabled)} />
              </div>
            </div>
          </div>
        </section>
      )}
    </main>

    {activeVakit && (
      <div className="flow-overlay" role="dialog" aria-modal="true" aria-label={t('appTitle')}>
        <VirdFlow vakit={activeVakit.vakit} initialProgress={activeVakit.progress} initialTarget={activeVakit.laTarget} dayKey={todayKey(now)} settings={settings} onClose={closeFlow} />
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

function VirdFlow({ vakit, initialProgress, initialTarget, dayKey, settings, onClose }) {
  const { t, lang } = useLang()
  const soundOn = settings?.soundEnabled !== false
  const vibrationOn = settings?.vibrationEnabled !== false
  const vlabel = (id) => t('vakit' + id.charAt(0).toUpperCase() + id.slice(1))
  const steps = useMemo(() => getStepsFor(vakit, lang), [vakit, lang])
  const [state, setState] = useState(() => initialProgress)
  const [celebrationId, setCelebrationId] = useState(0)
  const wasDone = useRef(state.done)
  const [laTarget, setLaTarget] = useState(initialTarget)
  const [extraWindow, setExtraWindow] = useState(null)
  const [stepListOpen, setStepListOpen] = useState(false)
  const [fontScale, setFontScale] = useState(() => {
    try { const v = parseFloat(localStorage.getItem('tesbihat.fontScale')); return Number.isFinite(v) ? v : 1 } catch { return 1 }
  })
  const [scrollCueVisible, setScrollCueVisible] = useState(false)
  const guidedBodyRef = useRef(null)
  const doneStarRef = useRef(null)
  const swipeStartRef = useRef(null)
  const stepListButtonRef = useRef(null)
  const advancing = useRef(false)

  const bumpFont = (delta) => setFontScale((s) => {
    const next = Math.min(1.6, Math.max(0.75, Math.round((s + delta) * 20) / 20))
    try { localStorage.setItem('tesbihat.fontScale', String(next)) } catch { /* yoksay */ }
    return next
  })

  useEffect(() => {
    saveVakitProgress(vakit, { ...state, laTarget })
    saveActiveVakit(vakit, state, laTarget)
  }, [vakit, state, dayKey, laTarget])

  const closeFlow = () => {
    saveVakitProgress(vakit, { ...state, laTarget })
    onClose()
  }

  useEffect(() => {
    if (state.done && !wasDone.current) setCelebrationId((id) => id + 1)
    wasDone.current = state.done
  }, [state.done])

  useEffect(() => {
    const node = guidedBodyRef.current
    if (!node) { setScrollCueVisible(false); return undefined }
    const updateCue = () => {
      setScrollCueVisible(node.scrollHeight > node.clientHeight + 20 && node.scrollTop + node.clientHeight < node.scrollHeight - 18)
    }
    updateCue()
    node.addEventListener('scroll', updateCue, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateCue) : null
    observer?.observe(node)
    if (node.firstElementChild) observer?.observe(node.firstElementChild)
    window.addEventListener('resize', updateCue)
    return () => {
      node.removeEventListener('scroll', updateCue)
      observer?.disconnect()
      window.removeEventListener('resize', updateCue)
    }
  }, [state.idx, fontScale, lang, extraWindow])

  const idx = Math.min(state.idx, steps.length - 1)
  const step = steps[idx]
  const isLast = idx === steps.length - 1
  const effectiveTarget = (s) => (s.id === 'la-ilahe' ? laTarget : s.target ?? 1)
  const isCounter = step?.type === 'counter'
  const count = state.counts?.[step.id] ?? 0
  const target = step ? effectiveTarget(step) : 1
  const pct = state.done ? 100 : Math.round((idx / steps.length) * 100)

  const sectionOf = (i) => {
    if (i < COMMON_STEPS.length) return t('sectionCommon')
    if (i === steps.length - 1) return t('sectionClosing')
    if (lang === 'tr') return t('specialSection' + vakit.charAt(0).toUpperCase() + vakit.slice(1))
    return t('specialSection', { vakit: vlabel(vakit) })
  }

  const goNext = () => {
    if (advancing.current) return
    advancing.current = true
    setTimeout(() => { advancing.current = false }, 150)
    if (idx + 1 >= steps.length) { chime(soundOn); vibrate([40, 80, 40, 80, 160], vibrationOn) }
    setState((s) => {
      if (s.idx + 1 >= steps.length) {
        return { ...s, idx: steps.length - 1, done: true }
      }
      return { ...s, idx: s.idx + 1 }
    })
  }
  const goBack = () => setState((s) => (s.idx > 0 ? { ...s, idx: s.idx - 1, done: false } : s))
  const closeStepList = () => {
    setStepListOpen(false)
    stepListButtonRef.current?.focus()
  }
  const handleStepListKeyDown = (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); closeStepList(); return }
    if (event.key !== 'Tab') return
    const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')]
    if (!buttons.length) return
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  const jumpToStep = (targetIdx) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, targetIdx))
    setState((s) => ({ ...s, idx: clamped, done: false }))
    closeStepList()
  }

  const startSwipe = (event) => {
    const touch = event.touches?.[0]
    if (!touch || event.touches.length !== 1 || event.target.closest('button, a, input, select, textarea, [role="button"], .extra-window, .step-list-overlay')) {
      swipeStartRef.current = null
      return
    }
    // Leave the OS/browser's edge-swipe navigation untouched.
    if (touch.clientX < 24 || touch.clientX > window.innerWidth - 24) {
      swipeStartRef.current = null
      return
    }
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }
  const endSwipe = (event) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    const touch = event.changedTouches?.[0]
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.25 || Date.now() - start.time > 900) return
    const nextOnRightwardSwipe = document.documentElement.dir === 'rtl'
    if ((dx > 0) === nextOnRightwardSwipe) goNext()
    else goBack()
  }
  const scrollDown = () => {
    const node = guidedBodyRef.current
    if (node) node.scrollBy({ top: Math.max(180, node.clientHeight * 0.72), behavior: 'smooth' })
  }

  const tapCounter = () => {
    if (!isCounter) return
    vibrate(10, vibrationOn)
    if (count + 1 >= target) { chime(soundOn); vibrate([25, 45, 25], vibrationOn) }
    setState((s) => {
      const c = (s.counts?.[step.id] ?? 0) + 1
      const reached = c >= target
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

  const ring = 2 * Math.PI * 45
  const offset = isCounter ? ring * (1 - Math.min(1, count / target)) : 0
  const arabicLong = step?.arabic && (Array.isArray(step.arabic) ? step.arabic.join('').length : step.arabic.length) > 200

  if (state.done) {
    return (
      <div className="flow">
        {celebrationId > 0 && <CompletionCelebration key={celebrationId} originRef={doneStarRef} />}
        <div className="done-wrap">
          <svg ref={doneStarRef} className="done-star" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l2.6 6.2 6.7.3-5.2 4.3 1.8 6.4L12 16l-5.9 3.2 1.8-6.4-5.2-4.3 6.7-.3L12 2Z" fill="rgba(236,201,126,.18)"/>
          </svg>
          <h1 className="done-title">{t('doneTitle')}</h1>
          <p className="done-sub">{t('doneSub')}</p>
          <div className="done-actions">
            <button className="btn-secondary" onClick={closeFlow}>{t('close')}</button>
            <button className="btn btn-primary" onClick={reset}>{t('restart')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flow" onTouchStart={startSwipe} onTouchEnd={endSwipe} onTouchCancel={() => { swipeStartRef.current = null }}>
      <div className="guided-top inflow">
        <button className="icon-btn" onClick={goBack} aria-label={t('back')} disabled={idx === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="g-progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
        <button className="icon-btn step-next-btn" onClick={goNext} aria-label={t('nextStep')} title={t('nextStep')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button ref={stepListButtonRef} className="g-step-label g-step-label-btn" onClick={() => setStepListOpen(true)} aria-label={t('stepListAria')} title={t('stepListAria')}><AppIcon name="list" size={15} /><span>{idx + 1}/{steps.length}</span></button>
        <button className="font-btn" onClick={() => bumpFont(-0.15)} aria-label={t('fontSmall')} title={t('fontSmall')}>A−</button>
        <button className="font-btn" onClick={() => bumpFont(0.15)} aria-label={t('fontLarge')} title={t('fontLarge')}>A+</button>
        <button className="icon-btn" onClick={closeFlow} aria-label={t('close')} title={t('close')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{isCounter ? `${t('count')} ${count} / ${target}` : step.title}</div>
      <div className="guided-body inflow" key={idx} ref={guidedBodyRef} style={{ '--qs': fontScale }}>
        <div className="g-section">{sectionOf(idx)}</div>
        <h2 className="g-title">{step.title}</h2>
        {step.optional && <div className="g-optional">{t('optionalBadge')}</div>}
        {step.note && <div className="note">{step.note}</div>}

        {step.arabic && (
          <div className={`arabic ${arabicLong ? 'small' : ''}`} lang="ar" dir="rtl">
            {Array.isArray(step.arabic)
              ? step.arabic.map((line, i) => <div key={i} style={{ marginBottom: 8 }}>{step.id === 'salavat' ? highlightSalavat(line, SALAVAT_ARABIC_WORDS) : line}</div>)
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
          : <p className="latin">{step.id === 'salavat' ? highlightSalavat(step.latin, SALAVAT_LATIN_WORDS) : step.latin}</p>)}
        {step.quran
          ? (step.quran.sura !== 36 && step.quran.sura !== 56 && (
              <MeaningDisclosure label={t('meaningToggle')}>
                {quranMeanings(step.quran, lang).map(([n, tr]) => <p key={n}><b>{n}.</b> {tr}</p>)}
              </MeaningDisclosure>
            ))
          : <MeaningBlock meaning={step.meaning} meaningLanguage={step.meaningLanguage} />}
        {step.endNote && <EndNote note={step.endNote} />}

        {isCounter && step.id === 'la-ilahe' && (
          <div className="target-chips in-body" role="group" aria-label={t('laTarget')}>
            {LA_ILAHE_OPTIONS.map((t) => (
              <button key={t} className={`chip ${laTarget === t ? 'active' : ''}`} onClick={() => { setLaTarget(t); setState((s) => ({ ...s, counts: { ...s.counts, [step.id]: 0 } })) }}>{t}×</button>
            ))}
          </div>
        )}
        <div className="flow-dock flow-dock-float">
          {scrollCueVisible && (
            <button type="button" className="scroll-down-btn" onClick={scrollDown} aria-label={t('scrollForMore')} title={t('scrollForMore')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          )}
          {isCounter ? (
            <button className="counter-ring" onClick={tapCounter} aria-label={t('count')} autoFocus>
              <svg width="92" height="92" viewBox="0 0 92 92">
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ecc97e" />
                    <stop offset="55%" stopColor="#d9b36c" />
                    <stop offset="100%" stopColor="#a87f3d" />
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="46" cy="46" r="45" strokeWidth="2" fill="none" />
                <circle className="ring-fg" cx="46" cy="46" r="45" strokeWidth="2" fill="none"
                        stroke="url(#goldGrad)" strokeDasharray={ring} strokeDashoffset={offset} />
              </svg>
              <span className="counter-num">
                <b>{count}</b>
                <span>/ {target}</span>
              </span>
            </button>
          ) : (
            <button className="done-ring" onClick={goNext} autoFocus aria-label={isLast ? t('doneLastAria') : t('readDoneAria')}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>
            </button>
          )}
        </div>
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
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>
              </button>
            </div>
          </div>
        )
      })()}

      {stepListOpen && (
        <div className="step-list-overlay" role="dialog" aria-modal="true" aria-label={t('stepList')} onKeyDown={handleStepListKeyDown}>
          <div className="step-list-panel">
            <div className="step-list-head">
              <h2><AppIcon name="list" size={18} />{t('stepList')}</h2>
              <button className="icon-btn" autoFocus onClick={closeStepList} aria-label={t('close')} title={t('close')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
            <ol className="step-list-items">
              {steps.map((s, i) => {
                const isCurrent = i === idx
                const sCount = state.counts?.[s.id] ?? 0
                const sTarget = s.id === 'la-ilahe' ? laTarget : s.target ?? 1
                const isCounterStep = s.type === 'counter'
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`step-list-item${isCurrent ? ' is-current' : ''}`}
                      onClick={() => jumpToStep(i)}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <span className="step-list-num">{i + 1}</span>
                      <span className="step-list-title">{s.title}</span>
                      <span className="step-list-meta">
                        {isCurrent ? t('stepCurrent') : isCounterStep ? `${sCount}/${sTarget}` : ''}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      )}

    </div>
  )
}
