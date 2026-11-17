import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CITIES } from './data/cities.js'
import { fetchTimes, offlineTimes, hijriFromIntl, minutesOf } from './lib/prayer.js'
import { loadSettings, saveSettings } from './lib/store.js'
import { notificationPermission, scheduleReminders, cancelReminders } from './lib/notify.js'
import VirdList from './components/VirdList.jsx'
import Settings from './components/Settings.jsx'

function initialTimes(settings) {
  // Açılışın ilk anında doğru vakti göstermek için çevrimdışı hesap hemen uygulanır;
  // API varsa anında onunla tazelenir.
  const loc = settings.custom ?? CITIES.find((c) => c.id === settings.cityId) ?? CITIES.find((c) => c.id === 'diyarbakir')
  const d = new Date()
  return { timings: offlineTimes(d, loc.lat, loc.lng), hijri: hijriFromIntl(d), source: 'offline' }
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [tab, setTab] = useState('vird')
  const [now, setNow] = useState(() => new Date())
  const [timesData, setTimesData] = useState(() => initialTimes(loadSettings()))
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const deferredInstall = useRef(null)
  const [installReady, setInstallReady] = useState(false)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  useEffect(() => { document.documentElement.dataset.theme = settings.theme }, [settings.theme])
  useEffect(() => { saveSettings(settings) }, [settings])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const location = useMemo(() => {
    if (settings.custom) return settings.custom
    return CITIES.find((c) => c.id === settings.cityId) ?? CITIES.find((c) => c.id === 'diyarbakir')
  }, [settings.custom, settings.cityId])

  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  useEffect(() => {
    let alive = true
    fetchTimes({ lat: location.lat, lng: location.lng, date: new Date() }).then((d) => {
      if (alive) setTimesData(d)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, dayKey])

  // Ezan sonrası hatırlatmalar
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
        events.push({ when: remind, prayerId: p.prayerId, body: `${p.name} namazı sonrası zikrini hatırla.` })
      }
    }
    scheduleReminders(events, { title: 'Tesbihat hatırlatması', body: (e) => e.body }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesData, settings.notifEnabled, settings.reminderMin])

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
      showToast('Hatırlatmalar kapatıldı')
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

  return (
    <div className="app-frame">
      <div className="app">
        <div className="app-title" aria-label="Uygulama başlığı">
          <div className="app-title-eyebrow">Seyyid Muhammed Ruhi El-Kadiri Hz.</div>
          <h1 className="app-title-main">Namaz Sonrası Tesbihatı</h1>
          <div className="app-title-ar" lang="ar" dir="rtl">أذكار السيد محمد روحي القادري بعد الصلوات الخمس</div>
          <button className="gear-btn" onClick={() => setTab(tab === 'settings' ? 'vird' : 'settings')} aria-label={tab === 'settings' ? 'Ayarları kapat' : 'Ayarlar'} title={tab === 'settings' ? 'Geri' : 'Ayarlar'}>
            {tab === 'settings' ? (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            ) : (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06-.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></svg>
            )}
          </button>
        </div>
        {tab === 'vird' && <VirdList now={now} timesData={timesData} />}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            locationName={location.name}
            source={timesData?.source}
            onToggleNotif={toggleNotif}
            onToast={showToast}
          />
        )}


        {installReady && (
          <button className="notify-nudge install" style={{ position: 'absolute', bottom: 14, left: 22, right: 22, zIndex: 35, background: 'var(--card-solid)' }} onClick={installApp}>
            Ana ekrana ekle — uygulama gibi aç
          </button>
        )}

        <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
      </div>
    </div>
  )
}
