import React from 'react'
import { useLang, LANGS } from '../lib/i18n.js'

const FLAGS = { tr: 'tr', ar: 'sa', de: 'de', fr: 'fr', en: 'gb' }

// Dil seçici — TR AR DE FR EN
export default function LangChips({ large = false }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className={`lang-chips${large ? ' large' : ''}`} role="group" aria-label={t('languageGroup')}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          className={`lang-chip${l.id === lang ? ' active' : ''}`}
          onClick={() => setLang(l.id)}
          lang={l.intl}
          title={l.name}
          aria-pressed={l.id === lang}
          aria-label={`${l.name} (${l.short})`}
        >
          <span className={`fi fi-${FLAGS[l.id]} lang-flag`} aria-hidden="true" />
          {l.short}
        </button>
      ))}
    </div>
  )
}
