import React, { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLang } from '../lib/i18n.js'
import LangChips from './LangChips.jsx'

const splashEmblem = `${import.meta.env.BASE_URL}icons/splash-emblem.png`

// Açılış: ilk çalıştırmada dil, izin ve tema adımları, sonra marka animasyonu.
// Onboarding modunda otomatik kapanmaz — kullanıcı "Başla" düğmesiyle geçer.
export default function Splash({ onDone, onboard = false, theme = 'dark', themeChoice = theme, onThemeChange, onRequestLocation, onRequestNotification, onOpenAppSettings, canOpenAppSettings = false }) {
  const { t } = useLang()
  const [leaving, setLeaving] = useState(false)
  const [emblemReady, setEmblemReady] = useState(false)
  const onDoneRef = useRef(onDone)
  const [permissionState, setPermissionState] = useState({ location: 'idle', notification: 'idle' })
  const [step, setStep] = useState(0)
  const requestsStarted = useRef(false)
  const requestGeneration = useRef(0)
  useEffect(() => () => { requestGeneration.current += 1 }, [])

  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  const requestPermission = async (kind, request, generation = requestGeneration.current) => {
    setPermissionState((state) => ({ ...state, [kind]: 'pending' }))
    let result = 'denied'
    try { result = await request?.() } catch { /* The user can retry or continue. */ }
    if (generation === requestGeneration.current) {
      setPermissionState((state) => ({ ...state, [kind]: result === 'granted' ? 'granted' : 'denied' }))
    }
  }
  const enterPermissions = () => {
    // Paint the explanation before a native prompt appears. Start notifications
    // directly from the click because browsers may require a user gesture.
    flushSync(() => setStep(1))
    if (requestsStarted.current) return
    requestsStarted.current = true
    const generation = requestGeneration.current
    void (async () => {
      await requestPermission('notification', onRequestNotification, generation)
      if (generation === requestGeneration.current) await requestPermission('location', onRequestLocation, generation)
    })()
  }
  const nextFromPermissions = () => {
    requestGeneration.current += 1
    setPermissionState((state) => ({
      location: state.location === 'pending' ? 'idle' : state.location,
      notification: state.notification === 'pending' ? 'idle' : state.notification,
    }))
    setStep(2)
  }
  const permissionBusy = Object.values(permissionState).includes('pending')

  const needsSettings = permissionState.location === 'denied' || permissionState.notification === 'denied'

  useEffect(() => {
    if (onboard || !emblemReady) return undefined
    // Let the emblem and title animations complete before fading out. The
    // underlying screen must not receive the tap that dismisses the splash.
    let finishTimer
    const exitTimer = setTimeout(() => {
      setLeaving(true)
      finishTimer = setTimeout(() => onDoneRef.current?.(), 550)
    }, 2200)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(finishTimer)
    }
  }, [onboard, emblemReady])

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}${onboard ? ' is-onboard' : ''}`} data-theme={theme} aria-hidden={!onboard ? 'true' : undefined}>
      <div className="splash-emblem" aria-hidden="true">
        <span className="splash-emblem-orbit splash-emblem-orbit-outer" />
        <span className="splash-emblem-orbit splash-emblem-orbit-inner" />
        <img className="splash-star" src={splashEmblem} width="184" height="184" alt="" onLoad={() => setEmblemReady(true)} onError={() => setEmblemReady(true)} />
      </div>
      <div className="splash-eyebrow">{t('eyebrow')}</div>
      <h1 className="splash-title" dir="ltr">{t('appTitle')}</h1>
      <div className="splash-divider"><span /><i>◆</i><span /></div>
      <div className="splash-ar" lang="ar" dir="rtl">أذكار السيد محمد روحي القادري</div>

      {onboard ? (
        <div className="splash-onboard">
          <div className="welcome-progress" aria-label={t('onboardProgress', { current: step + 1, total: 3 })}>
            {[t('languageGroup'), t('permissionTitle'), t('themeLabel')].map((label, index) => (
              <div key={label} className={`welcome-progress-step${step === index ? ' active' : ''}${step > index ? ' complete' : ''}`} aria-current={step === index ? 'step' : undefined}>
                <span>{index + 1}</span><small>{label}</small>
              </div>
            ))}
          </div>
          {step === 0 && <section className="welcome-step" aria-labelledby="welcome-heading">
            <h2 id="welcome-heading" className="welcome-heading">{t('onboardLanguageTitle')}</h2>
            <p className="welcome-copy">{t('onboardLanguageSub')}</p>
            <LangChips large />
            <p className="welcome-disclosure">{t('onboardPermissionNotice')}</p>
          </section>}
          {step === 1 && <section className="welcome-step" aria-labelledby="welcome-heading">
            <h2 id="welcome-heading" className="welcome-heading">{t('onboardPermissionTitle')}</h2>
            <p className="welcome-copy">{t('permissionIntro')}</p>
            <div className="welcome-benefits">
              <div className="welcome-benefit">
                <div className="welcome-benefit-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M24 42s-13-11.4-13-23a13 13 0 0 1 26 0C37 30.6 24 42 24 42Z"/><circle cx="24" cy="19" r="5"/><path d="M14 37c-5 1.1-8 2.9-8 5 0 3.3 8 5 18 5s18-1.7 18-5c0-2.1-3-3.9-8-5"/></svg></div>
                <div className="welcome-benefit-text"><strong>{t('locationPermission')}</strong><span>{t('onboardLocationBenefit')}</span></div>
                <button type="button" className={`welcome-permission-btn${permissionState.location === 'granted' ? ' granted' : ''}`} disabled={permissionBusy || permissionState.location === 'granted'} onClick={() => requestPermission('location', onRequestLocation)}>{permissionState.location === 'pending' ? t('permissionPending') : permissionState.location === 'granted' ? t('permissionGranted') : t('permissionEnable')}</button>
              </div>
              <div className="welcome-benefit">
                <div className="welcome-benefit-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 35h26l-3-5V21c0-6-4-10-10-10s-10 4-10 10v9l-3 5ZM20 39a4 4 0 0 0 8 0M24 7v4M36 12l3-3M12 12 9 9"/><path d="m20 24 3 3 6-7"/></svg></div>
                <div className="welcome-benefit-text"><strong>{t('notificationPermissionLabel')}</strong><span>{t('onboardNotificationBenefit')}</span></div>
                <button type="button" className={`welcome-permission-btn${permissionState.notification === 'granted' ? ' granted' : ''}`} disabled={permissionBusy || permissionState.notification === 'granted'} onClick={() => requestPermission('notification', onRequestNotification)}>{permissionState.notification === 'pending' ? t('permissionPending') : permissionState.notification === 'granted' ? t('permissionGranted') : t('permissionEnable')}</button>
              </div>
            </div>
            {needsSettings && <div className="welcome-permission-help" role="status">
              <p className="welcome-permission-hint">{t(canOpenAppSettings ? 'permissionSettingsHint' : 'permissionSettingsHintWeb')}</p>
              {canOpenAppSettings && <button type="button" className="welcome-settings-btn" onClick={onOpenAppSettings}>{t('openDeviceSettings')}</button>}
            </div>}
            <p className="welcome-permission-optional">{t('permissionOptional')}</p>
          </section>}
          {step === 2 && <section className="welcome-step" aria-labelledby="welcome-heading">
            <h2 id="welcome-heading" className="welcome-heading">{t('onboardThemeTitle')}</h2>
            <p className="welcome-copy">{t('onboardThemeSub')}</p>
          <div className="splash-theme" role="group" aria-label={t('themeLabel')}>
            <button type="button" className={`theme-chip${themeChoice === 'system' ? ' active' : ''}`} aria-pressed={themeChoice === 'system'} onClick={() => onThemeChange?.('system')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              {t('themeSystem')}
            </button>
            <button type="button" className={`theme-chip${themeChoice === 'dark' ? ' active' : ''}`} aria-pressed={themeChoice === 'dark'} onClick={() => onThemeChange?.('dark')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
              {t('themeDark')}
            </button>
            <button type="button" className={`theme-chip${themeChoice === 'light' ? ' active' : ''}`} aria-pressed={themeChoice === 'light'} onClick={() => onThemeChange?.('light')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
              {t('themeLight')}
            </button>
            <button type="button" className={`theme-chip${themeChoice === 'amoled' ? ' active' : ''}`} aria-pressed={themeChoice === 'amoled'} onClick={() => onThemeChange?.('amoled')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
              {t('themeAmoled')}
            </button>
            <button type="button" className={`theme-chip${themeChoice === 'rose' ? ' active' : ''}`} aria-pressed={themeChoice === 'rose'} onClick={() => onThemeChange?.('rose')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z"/></svg>
              {t('themeRose')}
            </button>
          </div>
          </section>}
          <div className="welcome-navigation">
            {step > 0 && <button type="button" className="welcome-back" onClick={() => setStep(step - 1)}>{t('back')}</button>}
            <button type="button" className="splash-continue" onClick={step === 0 ? enterPermissions : step === 1 ? nextFromPermissions : onDone}>
              {step === 2 ? t('continueBtn') : t('onboardNext')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="splash-bar"><span /></div>
          <div className="splash-foot" dir="ltr">RUHİ TESBİHAT</div>
        </>
      )}
    </div>
  )
}
