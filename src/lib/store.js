// Kalıcı depolama (localStorage) — ayarlar, istatistikler
// Vird sayaçları: (tarih, vakit) anahtarına bağlı; gün/vakit değişince sıfırdan başlar.
const SETTINGS_KEY = 'tesbihat.settings'
const STATS_KEY = 'tesbihat.stats'
const NOTIFIED_KEY = 'tesbihat.notified'
const DAY_KEY = 'tesbihat.day'

export const DEFAULT_SETTINGS = {
  cityId: 'diyarbakir',
  custom: null,
  theme: 'dark',
  notifEnabled: false,
  reminderMin: 15,
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

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── İstatistikler (seri / toplam) ───────────────────────────────────────────
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

// ── Vird sayaçları: (bugün, vakit) başına ───────────────────────────────────
function freshDay() { return { date: todayKey(), counts: {}, completed: {} } }

export function loadDay() {
  try {
    const raw = JSON.parse(localStorage.getItem(DAY_KEY) || 'null')
    if (!raw || raw.date !== todayKey()) return freshDay() // gün değişti → her şey sıfır
    return { date: raw.date, counts: raw.counts ?? {}, completed: raw.completed ?? {} }
  } catch { return freshDay() }
}
export function saveDay(day) {
  try { localStorage.setItem(DAY_KEY, JSON.stringify(day)) } catch { /* kota */ }
}
/** Bir vaktin sayaçlarını sıfırlar (completed kaydını da siler). */
export function resetVakit(day, vakit) {
  const counts = { ...day.counts }
  delete counts[vakit]
  const completed = { ...day.completed }
  delete completed[vakit]
  const nd = { ...day, counts, completed }
  saveDay(nd)
  return nd
}

// ── Bildirim gönderim kayıtları ──────────────────────────────────────────────
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
