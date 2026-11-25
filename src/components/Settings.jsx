import React, { useEffect, useState, useCallback } from 'react'
import { CITIES } from '../data/cities.js'
import { useLang } from '../lib/i18n.js'
import LangChips from './LangChips.jsx'
import ThemeSelector from './ThemeSelector.jsx'
import AppIcon from './AppIcon.jsx'
import { PRAYER_IDS, reminderSettings } from '../lib/store.js'
import { minutesOf, nowMinutes } from '../lib/prayer.js'
import { reminderHealth, openReminderSystemSettings } from '../lib/notify.js'

const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]
const APP_VERSION = '1.22.0'

const LANGUAGE_TITLES = [
  ['tr', 'Dil Seçimi'], ['ar', 'اختيار اللغة'], ['de', 'Sprachauswahl'],
  ['fr', 'Choix de la langue'], ['en', 'Language selection'],
]

function SettingsGroup({ title, icon, children }) {
  return (
    <details className="settings-group">
      <summary className="settings-group-summary"><span className="settings-group-heading"><span className="settings-group-icon"><AppIcon name={icon} /></span><span className="settings-group-title">{title}</span></span><svg className="settings-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
      <div className="settings-group-content">{children}</div>
    </details>
  )
}

function LanguageTitle() {
  return LANGUAGE_TITLES.map(([lang, title], i) => (
    <React.Fragment key={lang}>{i > 0 && ' / '}<bdi lang={lang}>{title}</bdi></React.Fragment>
  ))
}

export default function Settings({ settings, setSettings, onToggleNotif, onToast, timesData, location, lastUpdate, timeZone, locationZone, tomorrowTimes, now, scheduleRevision }) {
  const { t } = useLang()
  const [gpsError, setGpsError] = useState('')
  const [gpsBusy, setGpsBusy] = useState(false)
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState(false)
  const refreshHealth = useCallback(async () => {
    try { setHealth(await reminderHealth()); setHealthError(false) }
    catch { setHealthError(true) }
  }, [])
  useEffect(() => {
    refreshHealth()
    const onVisible = () => { if (document.visibilityState === 'visible') refreshHealth() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshHealth, scheduleRevision])
  const selectedReminders = reminderSettings(settings)
  const prayerLabels = PRAYER_IDS.map((id) => t('vakit' + id.charAt(0).toUpperCase() + id.slice(1)))
  const prayerKeys = ['Imsak', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
  const nextIndex = prayerKeys.findIndex((key) => { const m = minutesOf(timesData?.timings?.[key]); return m != null && m > nowMinutes(now) })
  const nextKey = nextIndex === -1 ? 0 : nextIndex
  const nextTime = nextIndex === -1 ? tomorrowTimes?.Imsak : timesData?.timings?.[prayerKeys[nextKey]]
  const setPrayer = (id, patch) => setSettings((s) => ({ ...s, reminders: { ...reminderSettings(s), [id]: { ...reminderSettings(s)[id], ...patch } } }))

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }))

  const pickCity = (cityId) => set({ cityId, custom: null })

  const useGps = () => {
    setGpsError('')
    if (!('geolocation' in navigator)) { setGpsError(t('gpsUnsupported')); return }
    setGpsBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        set({ custom: { id: 'custom', name: `${t('currentLocation')} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, lat: latitude, lng: longitude } })
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
    <main className="screen settings-screen">
      <header className="topbar">
        <div className="greet">{t('preferences')}<strong>{t('settingsHeading')}</strong></div>
      </header>

      <details className="prayer-overview" open>
        <summary className="prayer-overview-summary">{t('overviewTitle')}</summary>
        <div className="settings-group-content">
          <p>{location?.name} · {timesData?.source === 'aladhan' ? t('sourceOnline') : t('sourceOffline')}</p>
          <div className="prayer-overview-grid">
            {PRAYER_IDS.map((id, i) => <div key={id}><span>{prayerLabels[i]}</span><strong>{timesData?.timings?.[prayerKeys[i]] ?? '—'}</strong></div>)}
          </div>
          <p>{t('nextPrayerLabel')}: {nextTime ? `${prayerLabels[nextKey]} ${nextTime}${nextIndex === -1 ? ` (${t('tomorrowApprox')})` : ''}` : t('timeUnavailable')}</p>
          <small>{t('timeUpdated', { time: lastUpdate })} · {t('deviceZone')}: {timeZone}</small><br />
          <small>{t('timeAccuracyHint')}</small>
          {locationZone && locationZone !== timeZone && <p className="zone-warning" role="alert">{t('zoneMismatch', { location: locationZone, device: timeZone })}</p>}
          {!locationZone && <p className="zone-warning">{t('zoneUnknown')}</p>}
        </div>
      </details>

      {/* Dil */}
      <SettingsGroup title={<LanguageTitle />} icon="language">
        <div className="set-row">
          <div className="grow">
            <small className="settings-description">{t('languageSmall')}</small>
            <LangChips large />
          </div>
        </div>
      </SettingsGroup>

      {/* Konum */}
      <SettingsGroup title={t('locationGroup')} icon="location">
        <div className="set-row">
          <div className="grow">
            <label htmlFor="city">{t('cityLabel')}</label>
            <small>{t('cityHint')}</small>
            <div className="settings-control">
              <select id="city" value={settings.custom ? 'custom' : settings.cityId} onChange={(e) => e.target.value !== 'custom' && pickCity(e.target.value)}>
                {settings.custom && <option value="custom">{settings.custom.name}</option>}
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="gps-btn" onClick={useGps} disabled={gpsBusy}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/></svg>
              {gpsBusy ? t('gpsBusy') : t('gpsButton')}
            </button>
            {gpsError && <div className="gps-error">{gpsError}</div>}
            <p className="hint">{t('travelHint')}</p>
            <div className="set-row">
              <div className="grow"><label htmlFor="offline-only">{t('offlineOnly')}</label><small>{t('offlineOnlyHint')}</small></div>
              <button id="offline-only" className="switch" role="switch" aria-checked={settings.offlineOnly} aria-label={t('offlineOnly')} onClick={() => set({ offlineOnly: !settings.offlineOnly })} />
            </div>
            <p className="hint">{t('privacyHint')}</p>
          </div>
        </div>
      </SettingsGroup>

      {/* Hatırlatmalar */}
      <SettingsGroup title={t('notifGroup')} icon="bell">
        <div className="set-row">
          <div className="grow">
            <label htmlFor="notif-switch">{t('notifLabel')}</label>
            <small>{t('notifSmall')}</small>
          </div>
          <button id="notif-switch" className="switch" role="switch" aria-checked={settings.notifEnabled} aria-label={t('notifSwitchAria')} onClick={() => onToggleNotif(!settings.notifEnabled)} />
        </div>
        {settings.notifEnabled && <div className="reminder-prayers">
          <p className="hint">{t('perPrayerHint')}</p>
          {PRAYER_IDS.map((id, i) => <div className="reminder-prayer" key={id}>
            <label htmlFor={`prayer-switch-${id}`}>{prayerLabels[i]}</label>
            <select aria-label={`${prayerLabels[i]} · ${t('reminderLabel')}`} disabled={!selectedReminders[id].enabled} value={selectedReminders[id].delay} onChange={(e) => setPrayer(id, { delay: Number(e.target.value) })}>
              {REMINDER_OPTIONS.map((m) => <option key={m} value={m}>{t('reminderOption', { m })}</option>)}
            </select>
            <button id={`prayer-switch-${id}`} className="switch" role="switch" aria-label={`${prayerLabels[i]} · ${t('notifLabel')}`} aria-checked={selectedReminders[id].enabled} onClick={() => setPrayer(id, { enabled: !selectedReminders[id].enabled })} />
          </div>)}
        </div>}
        <details className="reminder-health">
          <summary>{t('healthTitle')}</summary>
          {healthError || health?.unavailable ? <p role="status">{t('healthUnavailable')}</p> : !health ? <p>{t('healthLoading')}</p> : <div role="status">
            <p>{t('notificationPermissionLabel')}: {health.notificationsEnabled ? t('healthOn') : t('healthOff')}</p>
            {health.via === 'android' && <>
              <p>{t('channelStatus')}: {health.channelEnabled ? t('healthOn') : t('healthOff')}</p>
              <p>{t('exactStatus')}: {health.exactAllowed ? t('healthOn') : t('healthOff')}</p>
              <p>{t('batteryStatus')}: {health.batteryUnrestricted ? t('batteryUnrestricted') : t('batteryRestricted')}</p>
            </>}
            <p>{t('nextReminder')}: {settings.notifEnabled && health.nextAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(health.nextAt)) : t('noneScheduled')}</p>
            <p className="hint">{health.via === 'android' ? t('healthAndroidHint') : t('healthWebHint')}</p>
          </div>}
          <button type="button" className="gps-btn" onClick={refreshHealth}>{t('healthRefresh')}</button>
          {health?.via === 'android' && <div className="health-actions">
            <button type="button" className="gps-btn" onClick={() => openReminderSystemSettings('app').then((ok) => { if (!ok) onToast?.(t('healthUnavailable')) })}>{t('openDeviceSettings')}</button>
            <button type="button" className="gps-btn" onClick={() => openReminderSystemSettings('alarm').then((ok) => { if (!ok) onToast?.(t('healthUnavailable')) })}>{t('openAlarmSettings')}</button>
          </div>}
        </details>
        <p className="hint">{t('notifHint')}</p>
      </SettingsGroup>

      {/* Ses ve Titreşim */}
      <SettingsGroup title={t('soundGroup')} icon="sound">
        <div className="set-row">
          <div className="grow">
            <label htmlFor="sound-switch">{t('soundLabel')}</label>
            <small>{t('soundSmall')}</small>
          </div>
          <button id="sound-switch" className="switch" role="switch" aria-checked={settings.soundEnabled !== false} aria-label={t('soundSwitchAria')} onClick={() => set({ soundEnabled: settings.soundEnabled === false })} />
        </div>
        <div className="set-row">
          <div className="grow">
            <label htmlFor="vibration-switch">{t('vibrationLabel')}</label>
            <small>{t('vibrationSmall')}</small>
          </div>
          <button id="vibration-switch" className="switch" role="switch" aria-checked={settings.vibrationEnabled !== false} aria-label={t('vibrationSwitchAria')} onClick={() => set({ vibrationEnabled: settings.vibrationEnabled === false })} />
        </div>
      </SettingsGroup>

      {/* Görünüm */}
      <SettingsGroup title={t('appearanceGroup')} icon="appearance">
        <div className="set-row">
          <div className="grow">
            <label>{t('themeLabel')}</label>
            <ThemeSelector className="settings-theme-chips" value={settings.theme} onChange={(theme) => set({ theme })} />
          </div>
        </div>
      </SettingsGroup>

      <p className="source-line settings-source-line" role="status">
        {location?.name} · {timesData?.source === 'aladhan' ? t('sourceOnline') : t('sourceOffline')}<br />
        {t('timeUpdated', { time: lastUpdate })} · {timeZone}<br />
        {t('timeAccuracyHint')}
      </p>
      <p className="source-line settings-source-line">
        {t('versionLine', { v: APP_VERSION })}<br />
        {t('sourceLine')}
      </p>
    </main>
  )
}
