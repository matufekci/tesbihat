// Kalıcı depolama: kullanıcı ayarları + bugünün vakit ilerlemeleri (gün değişince sıfırlanır)
const SETTINGS_KEY = 'tesbihat.settings'
const DAY_KEY = 'tesbihat.day'

export const DEFAULT_SETTINGS = {
  cityId: 'diyarbakir',
  custom: null,
  theme: 'dark',
  notifEnabled: false,
  reminderMin: 15,
  onboarded: false, // ilk açılışta dil+tema seçimi tamamlandı mı?
}

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    const merged = { ...DEFAULT_SETTINGS, ...stored }
    delete merged.laIlaheTarget // eski sürümlerden kalma alan
    return merged
  } catch { return { ...DEFAULT_SETTINGS } }
}
export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch { /* kota */ }
}

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function readDay() {
  try {
    const s = JSON.parse(localStorage.getItem(DAY_KEY))
    if (s && s.date === todayKey()) return s
  } catch { /* yoksay */ }
  return { date: todayKey(), vakits: {} }
}
export function loadVakitProgress(vakit) {
  const d = readDay()
  const p = d.vakits?.[vakit]
  if (!p) return { idx: 0, counts: {}, done: false }
  return { idx: p.idx | 0, counts: { ...(p.counts || {}) }, done: !!p.done }
}
export function saveVakitProgress(vakit, progress) {
  try {
    const d = readDay()
    d.vakits[vakit] = { idx: progress.idx | 0, counts: { ...(progress.counts || {}) }, done: !!progress.done }
    localStorage.setItem(DAY_KEY, JSON.stringify(d))
  } catch { /* kota */ }
}
export function resetVakitProgress(vakit) {
  try {
    const d = readDay()
    delete d.vakits[vakit]
    localStorage.setItem(DAY_KEY, JSON.stringify(d))
  } catch { /* kota */ }
}
