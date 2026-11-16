import React from 'react'
import { COMMON_STEPS, CLOSING_STEP, NAMAZ_META, NAMAZ_IDS, getStepsFor } from '../data/vird.js'

function StepCard({ step }) {
  const arabicLong = step.arabic && (Array.isArray(step.arabic) ? step.arabic.join('').length : step.arabic.length) > 220
  return (
    <article className="reader-card">
      <h4>
        {step.title}{' '}
        {step.target ? <span className="r-count">· {step.target}×</span> : null}
        {step.optional ? <span className="r-count"> · isteğe bağlı</span> : null}
      </h4>
      {step.arabic && (
        <div className={`arabic ${arabicLong ? 'small' : ''}`} lang="ar">
          {Array.isArray(step.arabic)
            ? step.arabic.map((line, i) => <div key={i} style={{ marginBottom: 6 }}>{line}</div>)
            : step.arabic}
        </div>
      )}
      {step.latin && <p className="latin" style={{ fontSize: 12.5 }}>{step.latin}</p>}
      {step.meaning && <p className="meaning" style={{ fontSize: 12.5 }}>{step.meaning}</p>}
      {step.note && <div className="note" style={{ marginTop: 10 }}>{step.note}</div>}
    </article>
  )
}

export default function Reader() {
  return (
    <main className="screen">
      <header className="topbar" style={{ padding: '12px 4px 4px' }}>
        <div className="greet">Kaynak Metin<strong>Tesbihat-ı Kadiriye</strong></div>
      </header>

      <p className="note" style={{ maxWidth: 'none' }}>
        <b>Seyyid Muhammed Ruhi el-Kadiri — Namaz Sonrası Tesbihatı.</b><br />
        Bu liste, “Seyyid Muhammed Ruhi El-Kadiri Hz. Namaz Sonrası Tesbihatı DİKEY” başlıklı
        kaynağın birebir dökümüdür. Dinî hüküm değildir; uygulamadan önce ilim ehline danışın.
      </p>

      <section className="reader-section">
        <h3><span aria-hidden="true">✦</span> Ortak Bölüm — Her Namazdan Sonra</h3>
        {COMMON_STEPS.map((s) => <StepCard key={s.id} step={s} />)}
      </section>

      <section className="reader-section">
        <h3><span aria-hidden="true">✦</span> Namazlara Özel Katman</h3>
        {NAMAZ_IDS.map((id) => {
          const layer = getStepsFor(id).slice(COMMON_STEPS.length, -1)
          return (
            <div key={id} style={{ marginBottom: 6 }}>
              <h4 style={{ fontSize: 13, color: 'var(--gold-bright)', margin: '12px 4px 8px', letterSpacing: '.04em' }}>
                {NAMAZ_META[id].sonrasi}
              </h4>
              {layer.map((s) => <StepCard key={s.id} step={s} />)}
            </div>
          )
        })}
      </section>

      <section className="reader-section">
        <h3><span aria-hidden="true">✦</span> Kapanış — Her Namaz Sonrası</h3>
        <StepCard step={CLOSING_STEP} />
      </section>

      <p className="source-line" style={{ marginTop: 18 }}>
        Sesli tilavet ve hâfız hattı yakında eklenecektir inşallah.
      </p>
    </main>
  )
}
