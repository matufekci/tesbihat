import React, { useState } from 'react'
import { CITIES } from '../data/cities.js'
import { notifyNow } from '../lib/notify.js'

const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

export default function Settings({ settings, setSettings, locationName, source, onToggleNotif, onToast }) {
  const [gpsError, setGpsError] = useState('')
  const [gpsBusy, setGpsBusy] = useState(false)

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }))

  const pickCity = (cityId) => set({ cityId, custom: null })

  const useGps = () => {
    setGpsError('')
    if (!('geolocation' in navigator)) { setGpsError('Bu cihaz/tarayıcı konum izni desteklemiyor.'); return }
    setGpsBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        set({ custom: { id: 'custom', name: `Mevcut Konum (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, lat: latitude, lng: longitude } })
        setGpsBusy(false)
        onToast?.('Konumunuz alındı ✓')
      },
      (err) => {
        setGpsBusy(false)
        setGpsError(err?.code === 1 ? 'Konum izni reddedildi. Tarayıcı/cihaz ayarlarından izin verin.' : 'Konum alınamadı. İlçe listesinden seçebilirsiniz.')
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 }
    )
  }

  return (
    <main className="screen">
      <header className="topbar" style={{ padding: '12px 4px 4px' }}>
        <div className="greet">Tercihler<strong>Ayarlar</strong></div>
        <span className="badge-source">{source === 'offline' ? 'Çevrimdışı hesap' : 'Vakitler · Diyanet metodu'}</span>
      </header>

      {/* Konum */}
      <section className="settings-group">
        <h3>Konum</h3>
        <div className="set-row">
          <div className="grow">
            <label htmlFor="city">İl / Şehir</label>
            <small>Açılışta hangi vaktin ekranının gösterileceğini belirler.</small>
            <div style={{ marginTop: 8 }}>
              <select id="city" value={settings.custom ? 'custom' : settings.cityId} onChange={(e) => e.target.value !== 'custom' && pickCity(e.target.value)}>
                {settings.custom && <option value="custom">{settings.custom.name}</option>}
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="gps-btn" onClick={useGps} disabled={gpsBusy}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/></svg>
              {gpsBusy ? 'Konum alınıyor…' : 'GPS ile konumumu kullan'}
            </button>
            {gpsError && <div className="gps-error">{gpsError}</div>}
          </div>
        </div>
      </section>

      {/* Hatırlatmalar */}
      <section className="settings-group">
        <h3>Ezan Sonrası Hatırlatma</h3>
        <div className="set-row">
          <div className="grow">
            <label htmlFor="notif-switch">Hatırlatma bildirimi</label>
            <small>Ezan vaktinden seçtiğiniz dakika sonra “Tesbihat zamanı” bildirimi gönderilir.</small>
          </div>
          <button id="notif-switch" className="switch" role="switch" aria-checked={settings.notifEnabled} aria-label="Bildirimleri aç/kapat" onClick={() => onToggleNotif(!settings.notifEnabled)} />
        </div>
        {settings.notifEnabled && (
          <>
            <div className="set-row">
              <div className="grow">
                <label htmlFor="reminder">Kaç dakika sonra hatırlat?</label>
                <div style={{ marginTop: 8 }}>
                  <select id="reminder" value={settings.reminderMin} onChange={(e) => set({ reminderMin: parseInt(e.target.value, 10) })}>
                    {REMINDER_OPTIONS.map((m) => <option key={m} value={m}>Ezan + {m} dakika</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="set-row">
              <div className="grow">
                <label>Test</label>
                <small>Bildirimin gerçekten düştüğünü görün.</small>
              </div>
              <button className="btn-ghost" onClick={() => notifyNow('Tesbihat', 'Test bildirimi — her şey çalışıyor ✓')}>Test et</button>
            </div>
          </>
        )}
        <p className="hint">
          Web sürümünde bildirimler yalnızca uygulama açıkken zamanlanır. APK sürümünde
          ezan vaktinde gerçek alarm olarak kurulur ve uygulama kapalıyken de çalışır.
        </p>
      </section>

      {/* Görünüm */}
      <section className="settings-group">
        <h3>Görünüm</h3>
        <div className="set-row">
          <div className="grow">
            <label>Tema</label>
            <div className="target-chips" style={{ marginTop: 8 }}>
              <button className={`chip ${settings.theme === 'dark' ? 'active' : ''}`} onClick={() => set({ theme: 'dark' })}>Koyu</button>
              <button className={`chip ${settings.theme === 'light' ? 'active' : ''}`} onClick={() => set({ theme: 'light' })}>Açık</button>
            </div>
          </div>
        </div>
      </section>

      <p className="source-line" style={{ marginTop: 20 }}>
        Tesbihat · Sürüm 1.9.0<br />
        Vakitler çevrimdışı hesap ile anlık belirlenir, internet varsa güncellenir.
      </p>
    </main>
  )
}
