import tzLookup from 'tz-lookup'

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
  // Standart (asr-ı evvel): Diyanet takvimleriyle karşılaştırılan yöntem.
  const latR = toRad(lat)
  const alt = Math.atan(1 / (factor + Math.tan(Math.abs(latR - declRad))))
  return hourAngleDeg(lat, declRad, toDeg(alt))
}

export function offlineTimes(date, lat, lng) {
  const localNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const tzOff = -localNoon.getTimezoneOffset() / 60 // that date’s noon, including DST
  const anchor = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0))
  const { eqTime, decl } = solarParams(anchor)
  const noon = 720 - 4 * lng - eqTime + tzOff * 60
  const fajrHA = hourAngleDeg(lat, decl, -18)
  const sunHA = hourAngleDeg(lat, decl, -0.833)
  const asrHA = asrHourAngleDeg(lat, decl, 1)
  const ishaHA = hourAngleDeg(lat, decl, -17)
  const t = {
    Imsak: fajrHA != null ? noon - fajrHA * 4 : null,
    Sunrise: sunHA != null ? noon - sunHA * 4 - 7 : null,
    Dhuhr: noon + 5,
    Asr: asrHA != null ? noon + asrHA * 4 + 4 : null,
    Maghrib: sunHA != null ? noon + sunHA * 4 + 7 : null,
    Isha: ishaHA != null ? noon + ishaHA * 4 : null,
  }
  // AlAdhan method 13 offsets, approximate; not an official calendar.
  const out = {}
  for (const k of Object.keys(t)) out[k] = t[k] != null ? fmtHM(t[k]) : null
  out.Sunset = out.Maghrib
  // Diyanet: imsak = fecr-i sâdık (Imsak zaten yukarıda hesaplandı)
  return out
}

const HIJRI_MONTHS = {
  tr: ['Muharrem','Safer','Rebîülevvel','Rebîülâhir','Cemâziyelevvel','Cemâziyelâhir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
  en: ['Muharram','Safar','Rabiʻ al-Awwal','Rabiʻ al-Thani','Jumada al-Ula','Jumada al-Akhira','Rajab','Shaʻban','Ramadan','Shawwal','Dhu al-Qaʻda','Dhu al-Hijja'],
  de: ['Muharram','Safar','Rabīʿ al-awwal','Rabīʿ ath-thānī','Dschumādā al-ūlā','Dschumādā ath-thāniya','Radschab','Schaʿbān','Ramadan','Schawwāl','Dhu l-Qaʿda','Dhu l-Hiddscha'],
  fr: ['Muharram','Safar','Rabîʿ al-awwal','Rabîʿ ath-thānī','Jumada al-oula','Jumada ath-thāniya','Rajab','Chaʿbāne','Ramadan','Chawwāl','Dhu l-Qaʿda','Dhu l-hijja'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الآخِر','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو الْقَعْدَة','ذُو الْحِجَّة'],
}
const HIJRI_INTL = { tr: 'tr-TR-u-ca-islamic', en: 'en-GB-u-ca-islamic', de: 'de-DE-u-ca-islamic', fr: 'fr-FR-u-ca-islamic', ar: 'ar-SA-u-ca-islamic-nu-latn' }
export function hijriMonthName(lang, idx) { return (HIJRI_MONTHS[lang] ?? HIJRI_MONTHS.tr)[idx] }

export function hijriFromIntl(date, lang = 'tr') {
  try {
    const LOCALE = HIJRI_INTL[lang] ?? HIJRI_INTL.tr
    const fmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'numeric', year: 'numeric' })
    const parts = fmt.formatToParts(date)
    const get = (t) => parts.find((p) => p.type === t)?.value
    const month = parseInt(get('month'), 10)
    return `${get('day')} ${hijriMonthName(lang, (month - 1) % 12)} ${get('year')}`
  } catch {
    return ''
  }
}

function cleanTime(s) {
  const m = String(s ?? '').match(/\d{1,2}:\d{2}/)
  const time = m ? m[0].padStart(5, '0') : null
  return time && minutesOf(time) != null ? time : null
}

/** Bugünün vakitlerini döner: { timings:{Imsak,Sunrise,Dhuhr,Asr,Maghrib,Isha}, hijri, source } */
export async function fetchTimes({ lat, lng, date = new Date(), lang = 'tr', offlineOnly = false, signal }) {
  if (offlineOnly) return { timings: offlineTimes(date, lat, lng), hijri: hijriFromIntl(date, lang), source: 'offline' }
  const dd = pad(date.getDate())
  const mm = pad(date.getMonth() + 1)
  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=13&school=0`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  const abort = () => ctrl.abort()
  if (signal?.aborted) ctrl.abort()
  else signal?.addEventListener('abort', abort, { once: true })
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const t = json?.data?.timings ?? {}
    const timings = {
      Imsak: cleanTime(t.Fajr),
      Sunrise: cleanTime(t.Sunrise),
      Dhuhr: cleanTime(t.Dhuhr),
      Asr: cleanTime(t.Asr),
      Maghrib: cleanTime(t.Maghrib),
      Isha: cleanTime(t.Isha),
    }
    if (Object.values(timings).some((v) => !v)) throw new Error('Eksik veri')
    const h = json?.data?.date?.hijri
    const hijri = h ? `${h.day} ${hijriMonthName(lang, (parseInt(h.month?.number, 10) || 1) - 1)} ${h.year}` : hijriFromIntl(date, lang)
    return { timings, hijri, source: 'aladhan' }
  } catch {
    return { timings: offlineTimes(date, lat, lng), hijri: hijriFromIntl(date, lang), source: 'offline' }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

export function minutesOf(hhmm) {
  if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h < 24 && m < 60 ? h * 60 + m : null
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


export function timeUntilVakitEnds(timings, tomorrowTimings, date) {
  if (!timings) return null
  const now = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
  const { Imsak, Sunrise, Dhuhr, Asr, Maghrib, Isha } = Object.fromEntries(
    ['Imsak', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((key) => [key, minutesOf(timings[key])])
  )
  if ([Imsak, Sunrise, Dhuhr, Asr, Maghrib, Isha].some((v) => v == null)) return null
  // Between sunrise and noon the morning prayer has ended; it is not a prayer window.
  if (now >= Sunrise && now < Dhuhr) return 'afterSunrise'
  let end
  if (now < Imsak) end = Imsak
  else if (now < Sunrise) end = Sunrise
  else if (now < Asr) end = Asr
  else if (now < Maghrib) end = Maghrib
  else if (now < Isha) end = Isha
  else {
    const next = minutesOf(tomorrowTimings?.Imsak)
    end = next == null ? null : next + 1440
  }
  if (end == null) return null
  const minutes = Math.max(0, Math.floor(end - now))
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}


// Offline polygon lookup is approximate near borders and cannot establish the user's physical location.
export function locationTimeZone(lat, lng) {
  try { return tzLookup(lat, lng) } catch { return null }
}
