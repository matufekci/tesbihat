import React, { useState } from 'react'
import { CITIES } from '../data/cities.js'
import { notifyNow } from '../lib/notify.js'
import { useLang } from '../lib/i18n.js'
import LangChips from './LangChips.jsx'

const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]
const APP_VERSION = '1.19.5'

export default function Settings({ settings, setSettings, locationName, source, onToggleNotif, onToast }) {
  const { t } = useLang()
  const [gpsError, setGpsError] = useState('')
  const [gpsBusy, setGpsBusy] = useState(false)

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
    <main className="screen">
      <header className="topbar" style={{ padding: '12px 4px 4px' }}>
        <div className="greet">{t('preferences')}<strong>{t('settingsHeading')}</strong></div>
        <span className="badge-source">{source === 'offline' ? t('sourceOffline') : t('sourceOnline')}</span>
      </header>

      {/* Dil */}
      <section className="settings-group">
        <h3>{t('languageGroup')}</h3>
        <div className="set-row">
          <div className="grow">
            <small style={{ display: 'block', marginBottom: 10 }}>{t('languageSmall')}</small>
            <LangChips large />
          </div>
        </div>
      </section>

      {/* Konum */}
      <section className="settings-group">
        <h3>{t('locationGroup')}</h3>
        <div className="set-row">
          <div className="grow">
            <label htmlFor="city">{t('cityLabel')}</label>
            <small>{t('cityHint')}</small>
            <div style={{ marginTop: 8 }}>
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
          </div>
        </div>
      </section>

      {/* Hatırlatmalar */}
      <section className="settings-group">
        <h3>{t('notifGroup')}</h3>
        <div className="set-row">
          <div className="grow">
            <label htmlFor="notif-switch">{t('notifLabel')}</label>
            <small>{t('notifSmall')}</small>
          </div>
          <button id="notif-switch" className="switch" role="switch" aria-checked={settings.notifEnabled} aria-label={t('notifSwitchAria')} onClick={() => onToggleNotif(!settings.notifEnabled)} />
        </div>
        {settings.notifEnabled && (
          <>
            <div className="set-row">
              <div className="grow">
                <label htmlFor="reminder">{t('reminderLabel')}</label>
                <div style={{ marginTop: 8 }}>
                  <select id="reminder" value={settings.reminderMin} onChange={(e) => set({ reminderMin: parseInt(e.target.value, 10) })}>
                    {REMINDER_OPTIONS.map((m) => <option key={m} value={m}>{t('reminderOption', { m })}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="set-row">
              <div className="grow">
                <label>{t('testLabel')}</label>
                <small>{t('testSmall')}</small>
              </div>
              <button className="btn-ghost" onClick={() => notifyNow(t('testNotifTitle'), t('testNotifBody'))}>{t('testButton')}</button>
            </div>
          </>
        )}
        <p className="hint">{t('notifHint')}</p>
      </section>

      {/* Görünüm */}
      <section className="settings-group">
        <h3>{t('appearanceGroup')}</h3>
        <div className="set-row">
          <div className="grow">
            <label>{t('themeLabel')}</label>
            <div className="target-chips" style={{ marginTop: 8 }}>
              <button className={`chip ${settings.theme === 'dark' ? 'active' : ''}`} onClick={() => set({ theme: 'dark' })}>{t('themeDark')}</button>
              <button className={`chip ${settings.theme === 'light' ? 'active' : ''}`} onClick={() => set({ theme: 'light' })}>{t('themeLight')}</button>
            </div>
          </div>
        </div>
      </section>

      <p className="source-line" style={{ marginTop: 20 }}>
        {t('versionLine', { v: APP_VERSION })}<br />
        {t('sourceLine')}
      </p>
    </main>
  )
}
