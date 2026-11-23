import React, { useState } from 'react'
import { CITIES } from '../data/cities.js'
import { useLang } from '../lib/i18n.js'
import LangChips from './LangChips.jsx'
import ThemeSelector from './ThemeSelector.jsx'
import AppIcon from './AppIcon.jsx'

const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]
const APP_VERSION = '1.21.2'

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

export default function Settings({ settings, setSettings, onToggleNotif, onToast }) {
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
    <main className="screen settings-screen">
      <header className="topbar">
        <div className="greet">{t('preferences')}<strong>{t('settingsHeading')}</strong></div>
      </header>

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
        {settings.notifEnabled && (
          <>
            <div className="set-row">
              <div className="grow">
                <label htmlFor="reminder">{t('reminderLabel')}</label>
                <div className="settings-control">
                  <select id="reminder" value={settings.reminderMin} onChange={(e) => set({ reminderMin: parseInt(e.target.value, 10) })}>
                    {REMINDER_OPTIONS.map((m) => <option key={m} value={m}>{t('reminderOption', { m })}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
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

      <p className="source-line settings-source-line">
        {t('versionLine', { v: APP_VERSION })}<br />
        {t('sourceLine')}
      </p>
    </main>
  )
}
