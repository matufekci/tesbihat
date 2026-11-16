// Kalıcı depolama (localStorage) — ayarlar, istatistikler, bildirilenler
const SETTINGS_KEY = 'tesbihat.settings'
const STATS_KEY = 'tesbihat.stats'
const NOTIFIED_KEY = 'tesbihat.notified'

export const DEFAULT_SETTINGS = {
  cityId: 'diyarbakir',
  custom: null, // { name, lat, lng } — GPS kullanıldığında
  theme: 'dark', // 'dark' | 'light'
  notifEnabled: false,
  reminderMin: 15, // ezandan kaç dakika sonra hatırlat
  laIlaheTarget: 20,
}

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch { return { ...DEFAULT_SETTINGS } }
}
export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch { /* kota */ }
}

const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function loadStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    return { days: raw.days ?? {}, total: raw.total ?? 0 }
  } catch { return { days: {}, total: 0 } }
}
export function saveStats(s) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)) } catch { /* kota */ }
}
export function completeVird(prayerId) {
  const s = loadStats()
  const k = todayKey()
  const arr = new Set(s.days[k] ?? [])
  arr.add(prayerId)
  s.days[k] = [...arr]
  s.total = (s.total ?? 0) + 1
  // son 60 günü sakla
  const keys = Object.keys(s.days).sort()
  while (keys.length > 60) delete s.days[keys.shift()]
  saveStats(s)
  return s
}
export function todayDone(stats) {
  return new Set(stats.days[todayKey()] ?? [])
}
export function currentStreak(stats) {
  let streak = 0
  const d = new Date()
  for (;;) {
    const k = todayKey(d)
    if ((stats.days[k] ?? []).length > 0) { streak += 1; d.setDate(d.getDate() - 1) }
    else break
  }
  return streak
}

export function wasNotified(key) {
  try { return (JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')).includes(key) } catch { return false }
}
export function markNotified(key) {
  try {
    const arr = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')
    arr.push(key)
    while (arr.length > 200) arr.shift()
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr))
  } catch { /* yoksay */ }
}
