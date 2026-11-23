import React from 'react'
import { useLang } from '../lib/i18n.js'

// Shared by onboarding and settings so appearance and choices stay identical.
export default function ThemeSelector({ value, onChange, className }) {
  const { t } = useLang()
  return (
    <div className={className} role="group" aria-label={t('themeLabel')}>
      <button type="button" className={`theme-chip${value === 'system' ? ' active' : ''}`} aria-pressed={value === 'system'} onClick={() => onChange?.('system')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        {t('themeSystem')}
      </button>
      <button type="button" className={`theme-chip${value === 'dark' ? ' active' : ''}`} aria-pressed={value === 'dark'} onClick={() => onChange?.('dark')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        {t('themeDark')}
      </button>
      <button type="button" className={`theme-chip${value === 'light' ? ' active' : ''}`} aria-pressed={value === 'light'} onClick={() => onChange?.('light')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
        {t('themeLight')}
      </button>
      <button type="button" className={`theme-chip${value === 'amoled' ? ' active' : ''}`} aria-pressed={value === 'amoled'} onClick={() => onChange?.('amoled')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
        {t('themeAmoled')}
      </button>
      <button type="button" className={`theme-chip${value === 'rose' ? ' active' : ''}`} aria-pressed={value === 'rose'} onClick={() => onChange?.('rose')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z"/></svg>
        {t('themeRose')}
      </button>
    </div>
  )
}
