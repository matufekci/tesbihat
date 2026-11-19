import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, loadVakitProgress, saveVakitProgress, resetVakitProgress, todayKey } from '../src/lib/store.js'

class MemoryStorage {
  values = new Map()
  failWrites = false
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) {
    if (this.failWrites) throw new Error('quota exceeded')
    this.values.set(key, String(value))
  }
  removeItem(key) { this.values.delete(key) }
}

beforeEach(() => { globalThis.localStorage = new MemoryStorage() })

test('settings use safe defaults for missing and malformed stored data', () => {
  assert.deepEqual(loadSettings(), { ...DEFAULT_SETTINGS })
  localStorage.setItem('tesbihat.settings', '{not-json')
  assert.deepEqual(loadSettings(), { ...DEFAULT_SETTINGS })
})

test('settings discard invalid fields and validate custom coordinates', () => {
  localStorage.setItem('tesbihat.settings', JSON.stringify({
    cityId: 'not-a-city', theme: 'neon', notifEnabled: 'yes', reminderMin: 999,
    onboarded: true, permissionsSetup: true, custom: { id: 'custom', name: 'X', lat: 999, lng: 1 },
    laIlaheTarget: 200,
  }))
  assert.deepEqual(loadSettings(), {
    ...DEFAULT_SETTINGS,
    onboarded: true,
    permissionsSetup: true,
  })
})

test('valid settings round-trip without preserving obsolete fields', () => {
  const settings = { ...DEFAULT_SETTINGS, cityId: 'diyarbakir', theme: 'amoled', reminderMin: 30, custom: { id: 'custom', name: 'Konum', lat: 37.91, lng: 40.24 }, laIlaheTarget: 200 }
  assert.equal(saveSettings(settings), true)
  assert.deepEqual(loadSettings(), { ...DEFAULT_SETTINGS, theme: 'amoled', reminderMin: 30, custom: { id: 'custom', name: 'Konum', lat: 37.91, lng: 40.24 } })
})

test('daily progress round-trips, resets one prayer, and rejects invalid prayer ids', () => {
  assert.equal(saveVakitProgress('sabah', { idx: 3, counts: { tesbih: 17 }, done: false }), true)
  assert.deepEqual(loadVakitProgress('sabah'), { idx: 3, counts: { tesbih: 17 }, done: false })
  assert.equal(saveVakitProgress('unknown', { idx: 1 }), false)
  assert.deepEqual(loadVakitProgress('unknown'), { idx: 0, counts: {}, done: false })
  assert.equal(resetVakitProgress('sabah'), true)
  assert.deepEqual(loadVakitProgress('sabah'), { idx: 0, counts: {}, done: false })
})

test('corrupt progress is bounded and cannot produce invalid counters', () => {
  localStorage.setItem('tesbihat.day', JSON.stringify({
    date: todayKey(),
    vakits: { sabah: { idx: -1, counts: { good: 4, bad: -2, huge: 999999999, __proto__: 2 }, done: 1 } },
  }))
  assert.deepEqual(loadVakitProgress('sabah'), { idx: 0, counts: { good: 4 }, done: false })
  localStorage.setItem('tesbihat.day', JSON.stringify({ date: '2000-01-01', vakits: { sabah: { idx: 9, counts: {}, done: true } } }))
  assert.deepEqual(loadVakitProgress('sabah'), { idx: 0, counts: {}, done: false })
})

test('storage quota failures do not crash the app', () => {
  localStorage.failWrites = true
  assert.equal(saveSettings(DEFAULT_SETTINGS), false)
  assert.equal(saveVakitProgress('ogle', { idx: 1, counts: {}, done: false }), false)
  assert.equal(resetVakitProgress('ogle'), false)
})
