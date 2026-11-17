import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/scheherazade-new/arabic-400.css'
import '@fontsource/scheherazade-new/arabic-600.css'
import '@fontsource/scheherazade-new/arabic-700.css'
import './styles.css'
import App from './App.jsx'
import { LanguageProvider } from './lib/i18n.js'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline shell yoksa sorun değil */ })
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
)
