import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getStepsFor, NAMAZ_META } from '../data/vird.js'

function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t0 = ctx.currentTime + i * 0.14
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9)
      o.connect(g).connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 1)
    })
  } catch { /* ses yoksa sessiz devam */ }
}

const vibrate = (p) => { try { navigator.vibrate?.(p) } catch { /* yoksay */ } }

export default function Guided({ prayerId, onClose, onComplete }) {
  const meta = NAMAZ_META[prayerId]
  const steps = useMemo(() => getStepsFor(prayerId), [prayerId])
  const [idx, setIdx] = useState(0)
  const [counts, setCounts] = useState({})
  const [laTarget, setLaTarget] = useState(20)
  const [done, setDone] = useState(false)
  const advancing = useRef(false)
  const finished = useRef(false)

  const step = steps[Math.min(idx, steps.length - 1)]
  const effectiveTarget = (s) => (s.id === 'la-ilahe' ? laTarget : s.target ?? 1)
  const isCounter = step?.type === 'counter'
  const count = counts[step?.id] ?? 0
  const target = effectiveTarget(step)
  const pct = done ? 100 : Math.round((idx / steps.length) * 100)

  const advance = () => {
    if (advancing.current) return
    advancing.current = true
    if (idx + 1 >= steps.length) {
      if (!finished.current) {
        finished.current = true
        onComplete?.(prayerId)
      }
      chime()
      vibrate([40, 80, 40, 80, 160])
      setDone(true)
    } else {
      setIdx((i) => i + 1)
    }
    setTimeout(() => { advancing.current = false }, 120)
  }
  const back = () => { if (idx > 0) { setIdx((i) => i - 1) } else onClose() }

  const tapCounter = () => {
    if (!isCounter) return
    vibrate(10)
    const next = count + 1
    setCounts((c) => ({ ...c, [step.id]: next }))
    if (next >= target) {
      chime()
      vibrate([25, 45, 25])
      advance()
    }
  }

  const ring = 2 * Math.PI * 62
  const offset = isCounter ? ring * (1 - Math.min(1, count / target)) : 0
  const arabicLong = step?.arabic && (Array.isArray(step.arabic) ? step.arabic.join('').length : step.arabic.length) > 200

  if (done) {
    return (
      <div className="guided" role="dialog" aria-label="Tesbihat tamamlandı">
        <div className="done-wrap">
          <svg className="done-star" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l2.6 6.2 6.7.3-5.2 4.3 1.8 6.4L12 16l-5.9 3.2 1.8-6.4-5.2-4.3 6.7-.3L12 2Z" fill="rgba(236,201,126,.18)"/>
          </svg>
          <div className="g-section">{meta?.sonrasi}</div>
          <h1 className="done-title">Vird Tamamlandı</h1>
          <p className="done-sub">
            Allah kabul eylesin, tamamına erdirsin inşallah. Fâtiha’nı Hz. Peygamber’e ﷺ,
            Ehl-i Beyt’ine, Sahabe’ye, Kadiri silsilesine, Şeyh Abdülkadir Geylânî’ye (k.s.)
            ve bütün mümin ve müminâtın ruhlarına hediye ettin.
          </p>
          <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={onClose}>Kapat</button>
        </div>
      </div>
    )
  }

  return (
    <div className="guided" role="dialog" aria-label={`${meta?.name} virdi`}>
      <div className="guided-top">
        <button className="icon-btn" onClick={back} aria-label="Geri">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="g-progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
        <div className="g-step-label">{idx + 1}/{steps.length}</div>
        <button className="icon-btn" onClick={onClose} aria-label="Kapat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <div className="guided-body" key={idx}>
        <div className="g-section">{meta?.sonrasi}{step.optional ? ' · İsteğe Bağlı' : ''}</div>
        <h2 className="g-title">{step.title}</h2>
        {step.optional && <div className="g-optional">İsteğe bağlı adım</div>}

        {step.arabic && (
          <div className={`arabic ${arabicLong ? 'small' : ''}`} lang="ar">
            {Array.isArray(step.arabic)
              ? step.arabic.map((line, i) => <div key={i} style={{ marginBottom: 8 }}>{line}</div>)
              : step.arabic}
          </div>
        )}
        {step.latin && <p className="latin">{step.latin}</p>}
        {step.meaning && <p className="meaning">{step.meaning}</p>}
        {step.note && <div className="note">{step.note}</div>}

        {isCounter ? (
          <div className="counter-zone">
            <button className="counter-ring" onClick={tapCounter} aria-label="Say">
              <svg width="148" height="148" viewBox="0 0 148 148">
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ecc97e" />
                    <stop offset="55%" stopColor="#d9b36c" />
                    <stop offset="100%" stopColor="#a87f3d" />
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="74" cy="74" r="62" strokeWidth="10" fill="none" />
                <circle className="ring-fg" cx="74" cy="74" r="62" strokeWidth="10" fill="none"
                        stroke="url(#goldGrad)" strokeDasharray={ring} strokeDashoffset={offset} />
              </svg>
              <span className="counter-num">
                <b>{count}</b>
                <span>/ {target}</span>
              </span>
            </button>
            {step.targetOptions && (
              <div className="target-chips" role="group" aria-label="Hedef adet">
                {step.targetOptions.map((t) => (
                  <button key={t} className={`chip ${laTarget === t ? 'active' : ''}`} onClick={() => { setLaTarget(t); setCounts((c) => ({ ...c, [step.id]: 0 })) }}>{t}×</button>
                ))}
              </div>
            )}
            <div className="g-actions">
              <button className="btn-secondary" onClick={advance}>Atla</button>
              <button className="btn-gold" onClick={advance}>Tamam ✓</button>
            </div>
          </div>
        ) : (
          <div className="counter-zone">
            <div className="g-actions" style={{ marginTop: 8 }}>
              <button className="btn-secondary" onClick={advance}>Atla</button>
              <button className="btn-gold" onClick={advance} autoFocus>Okudum ✓ Devam</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
