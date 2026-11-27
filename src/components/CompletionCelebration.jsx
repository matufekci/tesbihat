import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const GOLD = '255, 218, 146'
const IVORY = '255, 247, 222'

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3
}

function rayDistance(cx, cy, angle, width, height) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const xEdge = dx > 0 ? (width - cx) / dx : dx < 0 ? -cx / dx : Infinity
  const yEdge = dy > 0 ? (height - cy) / dy : dy < 0 ? -cy / dy : Infinity
  return Math.min(xEdge, yEdge)
}

function makeSparks(width, height, cx, cy) {
  const sparks = []
  const total = 150
  for (let i = 0; i < total; i += 1) {
    const angle = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.035
    const edge = rayDistance(cx, cy, angle, width, height)
    sparks.push({
      angle,
      distance: edge * (0.88 + Math.random() * 0.22),
      delay: Math.random() * 100,
      duration: 1000 + Math.random() * 520,
      size: 1 + Math.random() * 2.5,
      tail: 12 + Math.random() * 28,
      color: Math.random() > 0.72 ? IVORY : GOLD,
    })
  }
  // A smaller, softer second wave gives the star-origin burst depth without obscuring the text.
  for (let i = 0; i < 58; i += 1) {
    const angle = (i / 58) * Math.PI * 2 + (Math.random() - 0.5) * 0.08
    const edge = rayDistance(cx, cy, angle, width, height)
    sparks.push({
      angle,
      distance: edge * (0.3 + Math.random() * 0.38),
      delay: 100 + Math.random() * 220,
      duration: 760 + Math.random() * 440,
      size: 0.8 + Math.random() * 1.6,
      tail: 8 + Math.random() * 18,
      color: Math.random() > 0.55 ? IVORY : GOLD,
    })
  }
  return sparks
}

export default function CompletionCelebration({ originRef }) {
  const canvasRef = useRef(null)
  const fallbackOriginRef = useRef(null)
  const activeOriginRef = originRef ?? fallbackOriginRef

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true, desynchronized: true })
    if (!canvas || !context) return undefined

    let motionPreference
    try { motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)') } catch { /* unsupported */ }
    let reducedMotion = motionPreference?.matches === true
    let width = 0
    let height = 0
    let originX = 0
    let originY = 0
    let sparks = []
    let frameId = 0
    let startTime = 0
    const duration = 1850
    const rings = [0, 145, 285]

    const updateOrigin = () => {
      const rect = activeOriginRef?.current?.getBoundingClientRect?.()
      if (rect && rect.width > 0 && rect.height > 0) {
        originX = rect.left + rect.width / 2
        originY = rect.top + rect.height / 2
      } else {
        originX = width / 2
        originY = height / 2
      }
      const layer = canvas.parentElement
      layer?.style.setProperty('--celebration-origin-x', `${originX}px`)
      layer?.style.setProperty('--celebration-origin-y', `${originY}px`)
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      updateOrigin()
      sparks = reducedMotion ? [] : makeSparks(width, height, originX, originY)
    }

    const draw = (time) => {
      if (!startTime) startTime = time
      const elapsed = time - startTime
      const cx = originX
      const cy = originY
      const maxRadius = Math.hypot(width, height) * 0.7
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      // Brief ignition begins on the completion star; three feathered rings follow it outward.
      const flash = Math.max(0, 1 - elapsed / 480)
      if (flash > 0) {
        const radius = 12 + (1 - flash) * Math.min(width, height) * 0.42
        const glow = context.createRadialGradient(cx, cy, 0, cx, cy, radius)
        glow.addColorStop(0, `rgba(${IVORY},${flash * 0.48})`)
        glow.addColorStop(0.12, `rgba(${GOLD},${flash * 0.22})`)
        glow.addColorStop(1, `rgba(${GOLD},0)`)
        context.fillStyle = glow
        context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }

      for (const delay of rings) {
        const progress = (elapsed - delay) / 1120
        if (progress <= 0 || progress >= 1) continue
        const eased = easeOutCubic(progress)
        const radius = 14 + maxRadius * eased
        const alpha = (1 - progress) * 0.22
        context.beginPath()
        context.arc(cx, cy, radius, 0, Math.PI * 2)
        context.lineWidth = 1.2 + (1 - progress) * 3.8
        context.strokeStyle = `rgba(${delay === 145 ? IVORY : GOLD},${alpha})`
        context.shadowColor = `rgba(${GOLD},${alpha})`
        context.shadowBlur = 16 * (1 - progress)
        context.stroke()
      }
      context.shadowBlur = 0

      for (const spark of sparks) {
        const age = elapsed - spark.delay
        if (age <= 0 || age >= spark.duration) continue
        const progress = age / spark.duration
        const travel = spark.distance * easeOutCubic(progress)
        const x = cx + Math.cos(spark.angle) * travel
        const y = cy + Math.sin(spark.angle) * travel
        const tail = spark.tail * (1 - progress * 0.62)
        const tailX = x - Math.cos(spark.angle) * tail
        const tailY = y - Math.sin(spark.angle) * tail
        const alpha = (1 - progress) ** 1.45
        const gradient = context.createLinearGradient(tailX, tailY, x, y)
        gradient.addColorStop(0, `rgba(${spark.color},0)`)
        gradient.addColorStop(0.72, `rgba(${spark.color},${alpha * 0.5})`)
        gradient.addColorStop(1, `rgba(${spark.color},${alpha})`)
        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(x, y)
        context.strokeStyle = gradient
        context.lineWidth = spark.size * (1 - progress * 0.35)
        context.lineCap = 'round'
        context.stroke()

        if (spark.size > 2.5 && progress < 0.72) {
          context.beginPath()
          context.arc(x, y, spark.size * 0.7, 0, Math.PI * 2)
          context.fillStyle = `rgba(${spark.color},${alpha * 0.72})`
          context.shadowColor = `rgba(${spark.color},${alpha})`
          context.shadowBlur = 7
          context.fill()
        }
      }
      context.shadowBlur = 0
      context.globalCompositeOperation = 'source-over'
      if (elapsed < duration && !document.hidden && !reducedMotion) frameId = window.requestAnimationFrame(draw)
    }

    const onMotionPreferenceChange = (event) => {
      reducedMotion = event.matches
      window.cancelAnimationFrame(frameId)
      context.clearRect(0, 0, width, height)
      if (!reducedMotion) {
        startTime = 0
        sparks = makeSparks(width, height, originX, originY)
        frameId = window.requestAnimationFrame(draw)
      }
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    if (motionPreference?.addEventListener) motionPreference.addEventListener('change', onMotionPreferenceChange)
    else motionPreference?.addListener?.(onMotionPreferenceChange)
    if (!reducedMotion) frameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      if (motionPreference?.removeEventListener) motionPreference.removeEventListener('change', onMotionPreferenceChange)
      else motionPreference?.removeListener?.(onMotionPreferenceChange)
      context.clearRect(0, 0, width, height)
    }
  }, [activeOriginRef])

  const overlay = (
    <div className="completion-celebration" aria-hidden="true">
      {!originRef && (
        <svg ref={fallbackOriginRef} className="completion-preview-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
          <path d="M12 2l2.6 6.2 6.7.3-5.2 4.3 1.8 6.4L12 16l-5.9 3.2 1.8-6.4-5.2-4.3 6.7-.3L12 2Z" fill="rgba(236,201,126,.18)"/>
        </svg>
      )}
      <canvas ref={canvasRef} />
    </div>
  )
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body)
}
