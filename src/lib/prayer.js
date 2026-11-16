// Namaz vakitleri: önce Aladhan API (Diyanet hesabı, method=13), düşerse çevrimdışı astronomik hesap.

const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI
const pad = (n) => String(n).padStart(2, '0')
const fmtHM = (mins) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

// ── NOAA tabanlı çevrimdışı hesap ───────────────────────────────────────────
function solarParams(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const doy = Math.floor((date - start) / 86400000)
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60
  const g = (2 * Math.PI / 365) * (doy - 1 + (hour - 12) / 24)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  return { eqTime, decl }
}

function hourAngleDeg(lat, declRad, altitudeDeg) {
  const latR = toRad(lat)
  const alt = toRad(altitudeDeg)
  const cosH = (Math.sin(alt) - Math.sin(latR) * Math.sin(declRad)) / (Math.cos(latR) * Math.cos(declRad))
  if (cosH > 1 || cosH < -1) return null
  return toDeg(Math.acos(cosH))
}

function asrHourAngleDeg(lat, declRad, factor) {
  // Hanefî/Diyanet: gölge boyunun ikisinin bir nesne boyuna eklenmesi (iki gölge)
  const latR = toRad(lat)
  const alt = Math.atan(1 / (factor + Math.tan(Math.abs(latR - declRad))))
  return hourAngleDeg(lat, declRad, toDeg(alt))
}

export function offlineTimes(date, lat, lng) {
  const tzOff = -date.getTimezoneOffset() / 60 // yerel saat dilimi (saat)
  const anchor = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0))
  const { eqTime, decl } = solarParams(anchor)
  const noon = 720 - 4 * lng - eqTime + tzOff * 60
  const fajrHA = hourAngleDeg(lat, decl, -18)
  const sunHA = hourAngleDeg(lat, decl, -0.833)
  const asrHA = asrHourAngleDeg(lat, decl, 2)
  const ishaHA = hourAngleDeg(lat, decl, -17)
  const t = {
    Imsak: fajrHA != null ? noon - fajrHA * 4 : null,
    Sunrise: sunHA != null ? noon - sunHA * 4 : null,
    Dhuhr: noon,
    Asr: asrHA != null ? noon + asrHA * 4 : null,
    Maghrib: sunHA != null ? noon + sunHA * 4 : null,
    Isha: ishaHA != null ? noon + ishaHA * 4 : null,
  }
  const out = {}
  for (const k of Object.keys(t)) out[k] = t[k] != null ? fmtHM(t[k]) : null
  out.Sunset = out.Maghrib
  out.Imsak = out.Imsak // Diyanet: imsak = fecr-i sâdık
  return out
}

const HIJRI_TR = ['Muharrem','Safer','Rebîülevvel','Rebîülâhir','Cemâziyelevvel','Cemâziyelâhir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce']

export function hijriFromIntl(date) {
  try {
    const fmt = new Intl.DateTimeFormat('tr-TR-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' })
    const parts = fmt.formatToParts(date)
    const get = (t) => parts.find((p) => p.type === t)?.value
    const month = parseInt(get('month'), 10)
    return `${get('day')} ${HIJRI_TR[(month - 1) % 12]} ${get('year')}`
  } catch {
    return ''
  }
}

function cleanTime(s) {
  const m = String(s ?? '').match(/\d{1,2}:\d{2}/)
  return m ? m[0].padStart(5, '0') : null
}

/** Bugünün vakitlerini döner: { timings:{Imsak,Sunrise,Dhuhr,Asr,Maghrib,Isha}, hijri, source } */
export async function fetchTimes({ lat, lng, date = new Date() }) {
  const dd = pad(date.getDate())
  const mm = pad(date.getMonth() + 1)
  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=13`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const t = json?.data?.timings ?? {}
    const timings = {
      Imsak: cleanTime(t.Imsak) ?? cleanTime(t.Fajr),
      Sunrise: cleanTime(t.Sunrise),
      Dhuhr: cleanTime(t.Dhuhr),
      Asr: cleanTime(t.Asr),
      Maghrib: cleanTime(t.Maghrib),
      Isha: cleanTime(t.Isha),
    }
    if (Object.values(timings).some((v) => !v)) throw new Error('Eksik veri')
    const h = json?.data?.date?.hijri
    const hijri = h ? `${h.day} ${HIJRI_TR[(parseInt(h.month?.number, 10) || 1) - 1]} ${h.year}` : hijriFromIntl(date)
    return { timings, hijri, source: 'aladhan' }
  } catch (e) {
    return { timings: offlineTimes(date, lat, lng), hijri: hijriFromIntl(date), source: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

export function minutesOf(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function nowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}

/** Vakit listesinden "şu anki/gelecek" namazı döner: { current, next, nextInMin, dayIndex } */
export function prayerState(timings, date = new Date()) {
  const order = [
    { id: 'sabah', vakit: 'Sunrise', label: 'sabah', adhan: 'Imsak' },
    { id: 'ogle', vakit: 'Dhuhr', label: 'öğle', adhan: 'Dhuhr' },
    { id: 'ikindi', vakit: 'Asr', label: 'ikindi', adhan: 'Asr' },
    { id: 'aksam', vakit: 'Maghrib', label: 'akşam', adhan: 'Maghrib' },
    { id: 'yatsi', vakit: 'Isha', label: 'yatsı', adhan: 'Isha' },
  ]
  const now = nowMinutes(date)
  const items = order.map((p) => ({ ...p, at: minutesOf(timings[p.adhan]) }))
  let current = null
  let next = null
  for (const item of items) {
    if (item.at != null && item.at <= now) current = item
    if (item.at != null && item.at > now) { next = item; break }
  }
  if (!next) {
    // ertesi günün sabahına: yaklaşık 24s - now + imsak
    const imsak = minutesOf(timings.Imsak)
    next = { ...items[0], at: imsak != null ? imsak + 1440 : null, tomorrow: true }
  }
  const nextInMin = next?.at != null ? next.at - now : null
  return { current, next, nextInMin }
}

