import React, { useEffect, useState } from 'react'
import { useLang } from '../lib/i18n.js'
import splashEmblem from '../assets/tesbihat-splash-emblem.png'
import LangChips from './LangChips.jsx'

// Açılış: ilk çalıştırmada dil + tema seçimi (onboarding), sonra marka animasyonu.
// Onboarding modunda otomatik kapanmaz — kullanıcı "Başla" düğmesiyle geçer.
export default function Splash({ onDone, onboard = false, theme = 'dark', onThemeChange, onRequestLocation, onRequestNotification, onOpenAppSettings, canOpenAppSettings = false }) {
  const { t } = useLang()
  const [leaving, setLeaving] = useState(false)
  const [permissionState, setPermissionState] = useState({ location: 'idle', notification: 'idle' })

  const requestPermission = async (kind, request) => {
    setPermissionState((state) => ({ ...state, [kind]: 'pending' }))
    try {
      const result = await request?.()
      setPermissionState((state) => ({ ...state, [kind]: result === 'granted' ? 'granted' : 'denied' }))
    } catch {
      setPermissionState((state) => ({ ...state, [kind]: 'denied' }))
    }
  }
  const needsSettings = permissionState.location === 'denied' || permissionState.notification === 'denied'

  useEffect(() => {
    if (onboard) return undefined
    const t1 = setTimeout(() => setLeaving(true), 2200)
    const t2 = setTimeout(onDone, 2750)
    const skip = () => setLeaving(true)
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone, onboard])

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}${onboard ? ' is-onboard' : ''}`} data-theme={theme} aria-hidden={!onboard ? 'true' : undefined}>
      <div className="splash-emblem" aria-hidden="true">
        <span className="splash-emblem-orbit splash-emblem-orbit-outer" />
        <span className="splash-emblem-orbit splash-emblem-orbit-inner" />
        <img className="splash-star" src={splashEmblem} width="184" height="184" alt="" />
      </div>
      <div className="splash-eyebrow">{t('eyebrow')}</div>
      <h1 className="splash-title">{t('appTitle')}</h1>
      <div className="splash-divider"><span /><i>◆</i><span /></div>
      <div className="splash-ar" lang="ar" dir="rtl">أذكار السيد محمد روحي القادري</div>

      {onboard ? (
        <div className="splash-onboard">
          <p className="splash-onboard-title">{t('onboardTitle')}</p>
          <p className="splash-onboard-sub">{t('onboardSub')}</p>
          <LangChips large />
          <section className="welcome-permissions" aria-label={t('permissionTitle')}>
            <div className="welcome-permissions-title">{t('permissionTitle')}</div>
            <p className="welcome-permissions-intro">{t('permissionIntro')}</p>
            <div className="welcome-permission-row">
              <span className="welcome-permission-label">{t('locationPermission')}</span>
              <button type="button" className={`welcome-permission-btn${permissionState.location === 'granted' ? ' granted' : ''}`} disabled={permissionState.location === 'pending'} onClick={() => requestPermission('location', onRequestLocation)}>
                {permissionState.location === 'pending' ? '…' : permissionState.location === 'granted' ? t('permissionGranted') : t('permissionEnable')}
              </button>
            </div>
            <div className="welcome-permission-row">
              <span className="welcome-permission-label">{t('notificationPermissionLabel')}</span>
              <button type="button" className={`welcome-permission-btn${permissionState.notification === 'granted' ? ' granted' : ''}`} disabled={permissionState.notification === 'pending'} onClick={() => requestPermission('notification', onRequestNotification)}>
                {permissionState.notification === 'pending' ? '…' : permissionState.notification === 'granted' ? t('permissionGranted') : t('permissionEnable')}
              </button>
            </div>
            {needsSettings && <>
              <p className="welcome-permission-hint">{t(canOpenAppSettings ? 'permissionSettingsHint' : 'permissionSettingsHintWeb')}</p>
              {canOpenAppSettings && <button type="button" className="welcome-settings-btn" onClick={onOpenAppSettings}>{t('openDeviceSettings')}</button>}
            </>}
            <p className="welcome-permission-optional">{t('permissionOptional')}</p>
          </section>
          <div className="splash-theme" role="group" aria-label={t('themeLabel')}>
            <button type="button" className={`theme-chip${theme === 'dark' ? ' active' : ''}`} aria-pressed={theme === 'dark'} onClick={() => onThemeChange?.('dark')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
              {t('themeDark')}
            </button>
            <button type="button" className={`theme-chip${theme === 'light' ? ' active' : ''}`} aria-pressed={theme === 'light'} onClick={() => onThemeChange?.('light')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
              {t('themeLight')}
            </button>
            <button type="button" className={`theme-chip${theme === 'amoled' ? ' active' : ''}`} aria-pressed={theme === 'amoled'} onClick={() => onThemeChange?.('amoled')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
              {t('themeAmoled')}
            </button>
          </div>
          <button type="button" className="splash-continue" onClick={onDone}>
            {t('continueBtn')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      ) : (
        <>
          <div className="splash-bar"><span /></div>
          <div className="splash-foot">TESBİHAT</div>
        </>
      )}
    </div>
  )
}
