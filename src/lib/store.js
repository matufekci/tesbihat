// Kalıcı depolama (localStorage) — yalnızca kullanıcı ayarları
const SETTINGS_KEY = 'tesbihat.settings'

export const DEFAULT_SETTINGS = {
  cityId: 'diyarbakir',
  custom: null,
  theme: 'dark',
  notifEnabled: false,
  reminderMin: 15,
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
