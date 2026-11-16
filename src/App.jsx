import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CITIES } from './data/cities.js'
import { fetchTimes, prayerState, minutesOf } from './lib/prayer.js'
import {
  DEFAULT_SETTINGS, loadSettings, saveSettings, loadStats, saveStats,
  completeVird, todayDone, currentStreak,
} from './lib/store.js'
import { notificationPermission, scheduleReminders, cancelReminders } from './lib/notify.js'
import Home from './components/Home.jsx'
import Guided from './components/Guided.jsx'
import Reader from './components/Reader.jsx'
import Settings from './components/Settings.jsx'

const pad = (n) => String(n).padStart(2, '0')
export const fmtClock = (mins) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [tab, setTab] = useState('home')
  const [now, setNow] = useState(() => new Date())
  const [timesData, setTimesData] = useState(null) // { timings, hijri, source }
  const [stats, setStats] = useState(loadStats)
  const [guidedPrayer, setGuidedPrayer] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const deferredInstall = useRef(null)
  const [installReady, setInstallReady] = useState(false)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }, [])

  // tema
  useEffect(() => { document.documentElement.dataset.theme = settings.theme }, [settings.theme])
  useEffect(() => { saveSettings(settings) }, [settings])

  // saat tiklemesi
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // seçili konum
  const location = useMemo(() => {
    if (settings.custom) return settings.custom
    return CITIES.find((c) => c.id === settings.cityId) ?? CITIES.find((c) => c.id === 'diyarbakir')
  }, [settings.custom, settings.cityId])

  // vakitleri çek (konum / gün değişince)
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  useEffect(() => {
    let alive = true
    fetchTimes({ lat: location.lat, lng: location.lng, date: new Date() }).then((d) => {
      if (alive) setTimesData(d)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, dayKey])

  // bildirimleri zamanla
  useEffect(() => {
    if (!timesData?.timings || !settings.notifEnabled) return
    const today = new Date()
    const events = []
    const plan = [
      { prayerId: 'sabah', at: timesData.timings.Imsak, name: 'Sabah' },
      { prayerId: 'ogle', at: timesData.timings.Dhuhr, name: 'Öğle' },
      { prayerId: 'ikindi', at: timesData.timings.Asr, name: 'İkindi' },
      { prayerId: 'aksam', at: timesData.timings.Maghrib, name: 'Akşam' },
      { prayerId: 'yatsi', at: timesData.timings.Isha, name: 'Yatsı' },
    ]
    for (const p of plan) {
      const m = minutesOf(p.at)
      if (m == null) continue
      const adhan = new Date(today); adhan.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const remind = new Date(adhan.getTime() + settings.reminderMin * 60000)
      if (remind.getTime() > Date.now()) {
        events.push({ when: remind, prayerId: p.prayerId, body: `${p.name} namazı sonrası virdini yapma zamanı.` })
      }
    }
    scheduleReminders(events, {
      title: 'Tesbihat hatırlatması',
      body: (e) => e.body,
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesData, settings.notifEnabled, settings.reminderMin])

  // PWA kurulum olayı
  useEffect(() => {
    const h = (e) => { e.preventDefault(); deferredInstall.current = e; setInstallReady(true) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const installApp = useCallback(async () => {
    const p = deferredInstall.current
    if (!p) return
    p.prompt()
    try { await p.userChoice } catch { /* yoksay */ }
    deferredInstall.current = null
    setInstallReady(false)
  }, [])

  const toggleNotif = useCallback(async (on) => {
    if (!on) {
      setSettings((s) => ({ ...s, notifEnabled: false }))
      cancelReminders()
      showToast('Bildirimler kapatıldı')
      return
    }
    const perm = await notificationPermission()
    if (!perm.granted) {
      showToast('Bildirim izni verilmedi. Cihaz/tarayıcı ayarlarından izin verin.')
      return
    }
    setSettings((s) => ({ ...s, notifEnabled: true }))
    showToast('Ezan sonrası hatırlatmalar açıldı ✓')
  }, [showToast])

  const finishGuided = useCallback((prayerId) => {
    setStats(completeVird(prayerId))
  }, [])

  const resetStats = useCallback(() => {
    saveStats({ days: {}, total: 0 })
    setStats({ days: {}, total: 0 })
    showToast('İstatistikler sıfırlandı')
  }, [showToast])

  const doneToday = useMemo(() => todayDone(stats), [stats])
  const streak = useMemo(() => currentStreak(stats), [stats])
  const state = useMemo(() => (timesData ? prayerState(timesData.timings, now) : null), [timesData, now])

  return (
    <div className="app-frame">
      <div className="app">
        {tab === 'home' && (
          <Home
            now={now}
            timesData={timesData}
            state={state}
            locationName={location.name}
            doneToday={doneToday}
            streak={streak}
            totalVird={stats.total}
            notifEnabled={settings.notifEnabled}
            installReady={installReady}
            onInstall={installApp}
            onEnableNotif={() => toggleNotif(true)}
            onStart={(prayerId) => setGuidedPrayer(prayerId)}
            onGoSettings={() => setTab('settings')}
          />
        )}
        {tab === 'reader' && <Reader />}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            locationName={location.name}
            source={timesData?.source}
            onToggleNotif={toggleNotif}
            onResetStats={resetStats}
            onToast={showToast}
          />
        )}

        {/* alt navigasyon */}
        <nav className="navbar" aria-label="Ana gezinme">
          <button className={`nav-btn ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>
            Bugün
          </button>
          <button className={`nav-btn ${tab === 'reader' ? 'active' : ''}`} onClick={() => setTab('reader')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5v15"/><path d="M9 7.5h7M9 11h7"/></svg>
            Metin
          </button>
          <button className={`nav-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></svg>
            Ayarlar
          </button>
        </nav>

        {/* rehberli mod kaplama */}
        {guidedPrayer && (
          <Guided
            prayerId={guidedPrayer}
            onClose={() => setGuidedPrayer(null)}
            onComplete={finishGuided}
          />
        )}

        <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
      </div>
    </div>
  )
}
