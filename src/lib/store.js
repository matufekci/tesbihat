// Kalıcı depolama: kullanıcı ayarları + bugünün vakit ilerlemeleri (gün değişince sıfırlanır)
import { CITIES } from '../data/cities.js'

const SETTINGS_KEY = 'tesbihat.settings'
const DAY_KEY = 'tesbihat.day'
const VALID_THEMES = new Set(['dark', 'light', 'amoled', 'system', 'rose'])
const VALID_REMINDERS = new Set([5, 10, 15, 20, 30, 45, 60])
const VALID_VAKITS = new Set(['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'])
const VALID_CITY_IDS = new Set(CITIES.map((city) => city.id))
const MAX_PROGRESS_INDEX = 10000
const MAX_COUNT = 1000000

export const DEFAULT_SETTINGS = Object.freeze({
  cityId: 'diyarbakir',
  custom: null,
  theme: 'dark',
  notifEnabled: false,
  reminderMin: 15,
  soundEnabled: true,
  vibrationEnabled: true,
  onboarded: false,
  permissionsSetup: false,
})

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const defaultSettings = () => ({ ...DEFAULT_SETTINGS })

function sanitizeCustomLocation(value) {
  if (!isRecord(value) || value.id !== 'custom') return null
  const lat = value.lat
  const lng = value.lng
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 120) : ''
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { id: 'custom', name, lat, lng }
}

function sanitizeSettings(value) {
  if (!isRecord(value)) return defaultSettings()
  return {
    cityId: typeof value.cityId === 'string' && VALID_CITY_IDS.has(value.cityId) ? value.cityId : DEFAULT_SETTINGS.cityId,
    custom: sanitizeCustomLocation(value.custom),
    theme: VALID_THEMES.has(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
    notifEnabled: typeof value.notifEnabled === 'boolean' ? value.notifEnabled : DEFAULT_SETTINGS.notifEnabled,
    reminderMin: VALID_REMINDERS.has(value.reminderMin) ? value.reminderMin : DEFAULT_SETTINGS.reminderMin,
    soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    vibrationEnabled: typeof value.vibrationEnabled === 'boolean' ? value.vibrationEnabled : DEFAULT_SETTINGS.vibrationEnabled,
    onboarded: typeof value.onboarded === 'boolean' ? value.onboarded : DEFAULT_SETTINGS.onboarded,
    permissionsSetup: typeof value.permissionsSetup === 'boolean' ? value.permissionsSetup : DEFAULT_SETTINGS.permissionsSetup,
  }
}

export function loadSettings() {
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'))
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings) {
  try {
    const safeSettings = sanitizeSettings(settings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(safeSettings))
    return true
  } catch {
    return false
  }
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function readDay() {
  const date = todayKey()
  try {
    const stored = JSON.parse(localStorage.getItem(DAY_KEY) || 'null')
    if (isRecord(stored) && stored.date === date && isRecord(stored.vakits)) {
      return { date, vakits: stored.vakits }
    }
  } catch { /* bozuk/eski veri bu güne taşınmaz */ }
  return { date, vakits: {} }
}

function sanitizeProgress(value) {
  if (!isRecord(value)) return { idx: 0, counts: {}, done: false }
  const idx = Number.isSafeInteger(value.idx) && value.idx >= 0
    ? Math.min(value.idx, MAX_PROGRESS_INDEX)
    : 0
  const counts = {}
  if (isRecord(value.counts)) {
    for (const [key, count] of Object.entries(value.counts)) {
      if (key.length > 80 || ['__proto__', 'constructor', 'prototype'].includes(key)) continue
      if (Number.isSafeInteger(count) && count >= 0 && count <= MAX_COUNT) counts[key] = count
    }
  }
  return { idx, counts, done: value.done === true }
}

export function loadVakitProgress(vakit) {
  if (!VALID_VAKITS.has(vakit)) return { idx: 0, counts: {}, done: false }
  const progress = readDay().vakits[vakit]
  return sanitizeProgress(progress)
}

export function saveVakitProgress(vakit, progress) {
  if (!VALID_VAKITS.has(vakit)) return false
  try {
    const day = readDay()
    day.vakits[vakit] = sanitizeProgress(progress)
    localStorage.setItem(DAY_KEY, JSON.stringify(day))
    return true
  } catch {
    return false
  }
}

export function resetVakitProgress(vakit) {
  if (!VALID_VAKITS.has(vakit)) return false
  try {
    const day = readDay()
    delete day.vakits[vakit]
    localStorage.setItem(DAY_KEY, JSON.stringify(day))
    return true
  } catch {
    return false
  }
}
