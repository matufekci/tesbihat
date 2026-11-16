import React, { useMemo } from 'react'
import { minutesOf, nowMinutes } from '../lib/prayer.js'

const pad = (n) => String(n).padStart(2, '0')
const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase('tr') + s.slice(1) : s)

const ICONS = {
  imsak: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6Z"/><path d="M17 3l.5 1.4L19 5l-1.5.6L17 7l-.5-1.4L15 5l1.5-.6L17 3Z"/></svg>
  ),
  gunes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9V3m0 0L9.5 5.5M12 3l2.5 2.5"/><path d="M4 18h16"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M3 12h2m14 0h2"/></svg>
  ),
  ogle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
  ),
  ikindi: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="4"/><path d="M12 5.5V3M5 13H2.5M21.5 13H19M6.4 7.4 4.9 5.9M17.6 7.4l1.5-1.5"/><path d="M3 19h18"/></svg>
  ),
  aksam: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V9m0 0-2.5 2.5M12 9l2.5 2.5"/><path d="M4 18h16"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M3 12h2m14 0h2"/></svg>
  ),
  yatsi: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>
  ),
}

const VIRD_KEY = { imsak: 'sabah', ogle: 'ogle', ikindi: 'ikindi', aksam: 'aksam', yatsi: 'yatsi' }
const ROW_DEFS = [
  { id: 'imsak', name: 'İmsak', clockKey: 'Imsak', sub: 'Sabah ezanı · vird: Sabah' },
  { id: 'gunes', name: 'Güneş', clockKey: 'Sunrise', sub: 'Sabah namazı vakti biter' },
  { id: 'ogle', name: 'Öğle', clockKey: 'Dhuhr', sub: 'Öğle ezanı · vird: Öğle' },
  { id: 'ikindi', name: 'İkindi', clockKey: 'Asr', sub: 'İkindi ezanı · vird: İkindi' },
  { id: 'aksam', name: 'Akşam', clockKey: 'Maghrib', sub: 'Akşam ezanı · vird: Akşam' },
  { id: 'yatsi', name: 'Yatsı', clockKey: 'Isha', sub: 'Yatsı ezanı · vird: Yatsı' },
]

const HIJRI_FALLBACK_NOTE = ''

export default function Home({
  now, timesData, state, locationName, doneToday, streak, totalVird,
  notifEnabled, installReady, onInstall, onEnableNotif, onStart, onGoSettings,
}) {
  const hour = now.getHours()
  const greet = hour < 6 ? 'Hayırlı geceler' : hour < 12 ? 'Hayırlı sabahlar' : hour < 18 ? 'İyi günler' : hour < 22 ? 'İyi akşamlar' : 'Hayırlı geceler'
  const greg = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)

  const countdown = useMemo(() => {
    if (state?.nextInMin == null) return '--:--:--'
    const total = Math.max(0, state.nextInMin * 60)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = Math.floor(total % 60)
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }, [state])

  const dayProgress = useMemo(() => {
    if (!timesData?.timings || !state?.next) return 0
    const nowMin = nowMinutes(now)
    let prev = 0
    if (state.next.tomorrow) {
      prev = minutesOf(timesData.timings.Isha) ?? 0
    } else {
      const order = ['Imsak', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((k) => minutesOf(timesData.timings?.[k])).filter((v) => v != null)
      const before = order.filter((m) => m <= nowMin)
      prev = before.length ? before[before.length - 1] : 0
    }
    const span = (state.next.tomorrow ? state.next.at : state.next.at) - prev
    if (!(span > 0)) return 0
    return Math.min(1, Math.max(0, (nowMin - prev) / span))
  }, [timesData, state, now])

  const suggestion = useMemo(() => {
    if (!state) return { id: 'sabah', label: 'Sabah' }
    const nowMin = nowMinutes(now)
    if (state.current) {
      const since = nowMin - state.current.at
      if (since >= 0 && since <= 90) return { id: state.current.id, label: cap(state.current.label) }
    }
    const nxt = state.next
    const label = nxt ? cap(nxt.label) : 'Sabah'
    return { id: nxt?.id ?? 'sabah', label }
  }, [state, now])

  const nextLabel = state?.next ? cap(state.next.label) : '—'
  const nextClock = state?.next ? (() => {
    const src = state.next.id === 'sabah' ? (timesData?.timings?.Imsak) : state.next.id === 'ogle' ? timesData?.timings?.Dhuhr : state.next.id === 'ikindi' ? timesData?.timings?.Asr : state.next.id === 'aksam' ? timesData?.timings?.Maghrib : timesData?.timings?.Isha
    return src ?? '--:--'
  })() : '--:--'

  return (
    <>
      <header className="topbar">
        <div className="greet">Tesbihat<strong>Namaz Sonrası Virdi</strong></div>
        <div className="hijri">
          <b>{timesData?.hijri || HIJRI_FALLBACK_NOTE || '…'}</b>
          <span style={{ display: 'block' }}>{greg}</span>
        </div>
      </header>

      <main className="screen">
        <section className="hero" aria-label="Sonraki namaza geri sayım">
          <div className="hero-label">{greet}</div>
          <div className="hero-prayer">{nextLabel} {state?.next?.tomorrow ? '(yarın)' : ''}</div>
          <div className="hero-time">{locationName} · Ezan {nextClock}</div>
          <div className="countdown" aria-live="off">{countdown}<small>Sonraki ezana kalan</small></div>

          <div className="daybar" role="presentation">
            <div className="daybar-fill" style={{ width: `${Math.round(dayProgress * 100)}%` }} />
          </div>

          <button className="btn btn-primary" onClick={() => onStart(suggestion.id)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/></svg>
            {suggestion.label} Tesbihatını Başlat
          </button>
          {!notifEnabled && (
            <button className="notify-nudge" onClick={onEnableNotif}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/></svg>
              Ezan sonrası hatırlatması kapalı — <u>Aç</u>
            </button>
          )}
          {installReady && (
            <button className="notify-nudge install" onClick={onInstall}>Ana ekrana ekle — uygulama gibi aç</button>
          )}
        </section>

        <section className="times" aria-label="Bugünün vakitleri">
          <div className="times-title"><span>Bugünün Vakitleri</span><span className="dot-live">{timesData?.source === 'offline' ? 'ÇEVRİMDIŞI HESAP' : 'CANLI'}</span></div>
          {ROW_DEFS.map((row) => {
            const clock = timesData?.timings?.[row.clockKey] ?? '--:--'
            const at = minutesOf(clock)
            const nowMin = nowMinutes(now)
            const isNext = state?.next && !state.next.tomorrow && state.next.id === ({ imsak: 'sabah', gunes: 'gunes', ogle: 'ogle', ikindi: 'ikindi', aksam: 'aksam', yatsi: 'yatsi' }[row.id])
            const past = at != null && at <= nowMin
            const virdKey = VIRD_KEY[row.id]
            const dunDone = virdKey && doneToday?.has(virdKey)
            return (
              <div key={row.id} className={`time-row ${isNext ? 'next' : ''} ${past ? 'past' : ''}`}>
                <div className="t-ic">{ICONS[row.id]}</div>
                <div>
                  <div className="t-name">{row.name}{dunDone && <span className="t-done"> · vird ✓</span>}</div>
                  <div className="t-sub">{row.sub}</div>
                </div>
                <div className="t-clock">{clock}</div>
              </div>
            )
          })}
        </section>

        <section className="stats-strip" aria-label="İlerlemen">
          <div className="stat"><b>{doneToday?.size ?? 0}/5</b><span>Bugün tamamlanan</span></div>
          <div className="stat"><b>{streak}</b><span>Gün seri</span></div>
          <div className="stat"><b>{totalVird}</b><span>Toplam seans</span></div>
        </section>

        <p className="source-line">
          İçerik: <em>Seyyid Muhammed Ruhi el-Kadiri · Namaz Sonrası Tesbihatı</em> · Vakitler: Aladhan API (Diyanet metodu), çevrimdışı yedek hesap mevcuttur.
          <button className="linklike" onClick={onGoSettings}>Ayarlar →</button>
        </p>
      </main>
    </>
  )
}
