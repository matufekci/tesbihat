import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CITIES } from './data/cities.js'
import { fetchTimes, offlineTimes, hijriFromIntl, minutesOf } from './lib/prayer.js'
import { loadSettings, saveSettings, todayKey } from './lib/store.js'
import { notificationPermission, scheduleReminders, cancelReminders } from './lib/notify.js'
import VirdList from './components/VirdList.jsx'
import Splash from './components/Splash.jsx'
import { useLang, langById } from './lib/i18n.js'
import Settings from './components/Settings.jsx'

function initialTimes(settings) {
  // Açılışın ilk anında doğru vakti göstermek için çevrimdışı hesap hemen uygulanır;
  // API varsa anında onunla tazelenir.
  const loc = settings.custom ?? CITIES.find((c) => c.id === settings.cityId) ?? CITIES.find((c) => c.id === 'diyarbakir')
  const d = new Date()
  return { timings: offlineTimes(d, loc.lat, loc.lng), hijri: '', source: 'offline', locationKey: `${loc.lat},${loc.lng}`, dateKey: todayKey(d) }
}

function timeUntilVakitEnds(timings, date) {
  if (!timings) return '00.00'
  const boundaries = ['Imsak', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    .map((key) => minutesOf(timings[key]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (!boundaries.length) return '00.00'
  const nowSeconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
  let nextBoundary = boundaries.find((minute) => minute * 60 > nowSeconds)
  if (nextBoundary == null) nextBoundary = boundaries[0] + 1440
  const remainingMinutes = Math.max(0, Math.floor((nextBoundary * 60 - nowSeconds) / 60))
  const hours = String(Math.floor(remainingMinutes / 60)).padStart(2, '0')
  const minutes = String(remainingMinutes % 60).padStart(2, '0')
  return `${hours}.${minutes}`
}

export default function App() {
  const { t, lang } = useLang()
  const [settings, setSettings] = useState(loadSettings)
  const [systemTheme, setSystemTheme] = useState(() => {
    try {
      const preference = window.matchMedia?.('(prefers-color-scheme: dark)')
      return preference ? (preference.matches ? 'dark' : 'light') : 'dark'
    } catch { return 'dark' }
  })
  const resolvedTheme = settings.theme === 'system' ? systemTheme : settings.theme
  const [tab, setTab] = useState('vird')
  const [now, setNow] = useState(() => new Date())
  const [timesData, setTimesData] = useState(() => initialTimes(loadSettings()))
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const deferredInstall = useRef(null)
  const [installReady, setInstallReady] = useState(false)
  const [splash, setSplash] = useState(true)
  const completeOnboarding = useCallback(() => {
    setSettings((s) => ({ ...s, onboarded: true, permissionsSetup: true }))
    setSplash(false)
  }, [])

  const requestWelcomeLocation = useCallback(() => new Promise((resolve) => {
    if (!navigator.geolocation) { resolve('denied'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSettings((s) => ({ ...s, custom: { id: 'custom', name: `${t('currentLocation')} (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`, lat: coords.latitude, lng: coords.longitude } }))
        resolve('granted')
      },
      () => resolve('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }), [t])

  const requestWelcomeNotification = useCallback(async () => {
    const permission = await notificationPermission()
    if (!permission.granted) return 'denied'
    setSettings((s) => ({ ...s, notifEnabled: true }))
    return 'granted'
  }, [])

  const openAppSettings = useCallback(async () => {
    try {
      const launcher = window.Capacitor?.Plugins?.SettingsLauncher
      if (!launcher?.openAppSettings) return false
      await launcher.openAppSettings()
      return true
    } catch { return false }
  }, [])
  const canOpenAppSettings = window.Capacitor?.isNativePlatform?.() === true

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  useEffect(() => {
    let preference
    try { preference = window.matchMedia?.('(prefers-color-scheme: dark)') } catch { return undefined }
    if (!preference) return undefined
    const syncTheme = () => setSystemTheme(preference.matches ? 'dark' : 'light')
    syncTheme()
    if (preference.addEventListener) {
      preference.addEventListener('change', syncTheme)
      return () => preference.removeEventListener('change', syncTheme)
    }
    preference.addListener?.(syncTheme)
    return () => preference.removeListener?.(syncTheme)
  }, [])
  useLayoutEffect(() => { document.documentElement.dataset.theme = resolvedTheme }, [resolvedTheme])
  useEffect(() => { saveSettings(settings) }, [settings])

  useEffect(() => {
    let timer
    const scheduleMinuteTick = () => {
      const delay = 60000 - (Date.now() % 60000)
      timer = setTimeout(() => {
        setNow(new Date())
        scheduleMinuteTick()
      }, delay)
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') setNow(new Date())
    }
    scheduleMinuteTick()
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  const greg = new Intl.DateTimeFormat(langById(lang).intl, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const hijri = hijriFromIntl(now, lang)

  const location = useMemo(() => {
    if (settings.custom) return settings.custom
    return CITIES.find((c) => c.id === settings.cityId) ?? CITIES.find((c) => c.id === 'diyarbakir')
  }, [settings.custom, settings.cityId])

  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  useEffect(() => {
    let alive = true
    const requestDate = new Date()
    fetchTimes({ lat: location.lat, lng: location.lng, date: requestDate, lang }).then((d) => {
      if (alive) setTimesData({ ...d, locationKey: `${location.lat},${location.lng}`, dateKey: todayKey(requestDate) })
    })
    return () => { alive = false }
  }, [location.lat, location.lng, dayKey, lang])

  // Ezan sonrası hatırlatmalar
  useEffect(() => {
    const today = new Date()
    if (!timesData?.timings || !settings.notifEnabled || timesData.locationKey !== `${location.lat},${location.lng}` || timesData.dateKey !== todayKey(today)) return
    const events = []
    const plan = [
      { prayerId: 'sabah', at: timesData.timings.Imsak, vakitKey: 'vakitSabah' },
      { prayerId: 'ogle', at: timesData.timings.Dhuhr, vakitKey: 'vakitOgle' },
      { prayerId: 'ikindi', at: timesData.timings.Asr, vakitKey: 'vakitIkindi' },
      { prayerId: 'aksam', at: timesData.timings.Maghrib, vakitKey: 'vakitAksam' },
      { prayerId: 'yatsi', at: timesData.timings.Isha, vakitKey: 'vakitYatsi' },
    ]
    for (const p of plan) {
      const m = minutesOf(p.at)
      if (m == null) continue
      const adhan = new Date(today); adhan.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const remind = new Date(adhan.getTime() + settings.reminderMin * 60000)
      if (remind.getTime() > Date.now()) {
        events.push({ when: remind, prayerId: p.prayerId, body: t('notifBody', { vakit: t(p.vakitKey) }) })
      }
    }
    const nativePlan = {
      latitude: location.lat, longitude: location.lng, delay: settings.reminderMin, date: todayKey(today),
      minutes: plan.map((p) => minutesOf(p.at)),
      bodies: plan.map((p) => t('notifBody', { vakit: t(p.vakitKey) })),
    }
    scheduleReminders(events, { title: t('notifTitle'), body: (e) => e.body, nativePlan })
      .catch(() => showToast(t('notifScheduleFailed')))
  }, [timesData, settings.notifEnabled, settings.reminderMin, location.lat, location.lng, t, showToast])

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
      try {
        await cancelReminders()
        showToast(t('notifOffToast'))
      } catch {
        setSettings((s) => ({ ...s, notifEnabled: true }))
        showToast(t('notifScheduleFailed'))
      }
      return
    }
    const perm = await notificationPermission()
    if (!perm.granted) {
      showToast(t('notifDeniedToast'))
      return
    }
    setSettings((s) => ({ ...s, notifEnabled: true }))
    showToast(t('notifOnToast'))
  }, [showToast, t])

  return (
    <div className="app-frame">
      <div className="app">
        {splash && (
          <Splash
            onDone={settings.onboarded && settings.permissionsSetup ? () => setSplash(false) : completeOnboarding}
            onboard={!settings.onboarded || !settings.permissionsSetup}
            theme={resolvedTheme}
            themeChoice={settings.theme}
            onThemeChange={(th) => setSettings((s) => ({ ...s, theme: th }))}
            onRequestLocation={requestWelcomeLocation}
            onRequestNotification={requestWelcomeNotification}
            onOpenAppSettings={openAppSettings}
            canOpenAppSettings={canOpenAppSettings}
          />
        )}
        <div className="date-row">
          <b className="date-hijri">{hijri}</b>
          <span className="date-countdown">{t('timeUntilPrayerEnd', { time: timeUntilVakitEnds(timesData?.timings, now) })}</span>
          <span className="date-gregorian">{greg}</span>
        </div>
        <div className="app-title">
          <div className="app-title-eyebrow">{t('eyebrow')}</div>
          <h1 className="app-title-main" dir="ltr">{t('appTitle')}</h1>
          <div className="app-title-ar" lang="ar" dir="rtl">أذكار السيد محمد روحي القادري بعد الصلوات الخمس</div>
          <button className="gear-btn" onClick={() => setTab(tab === 'settings' ? 'vird' : 'settings')} aria-label={tab === 'settings' ? t('back') : t('settingsHeading')} title={tab === 'settings' ? t('back') : t('settingsHeading')}>
            {tab === 'settings' ? (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            ) : (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06-.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></svg>
            )}
          </button>
        </div>
        {tab === 'vird' && <VirdList now={now} timesData={timesData} settings={settings} setSettings={setSettings} onToggleNotif={toggleNotif} onToast={showToast} />}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            onToggleNotif={toggleNotif}
            onToast={showToast}
          />
        )}


        {installReady && (
          <button className="notify-nudge install install-prompt" onClick={installApp}>
            {t('installBanner')}
          </button>
        )}

        <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
      </div>
    </div>
  )
}
