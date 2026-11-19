import test from 'node:test'
import assert from 'node:assert/strict'
import { offlineTimes, fetchTimes, minutesOf, prayerState } from '../src/lib/prayer.js'

const timings = { Imsak: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:30', Maghrib: '18:00', Isha: '19:30' }

test('offline prayer calculation returns parseable local times', () => {
  const result = offlineTimes(new Date(2026, 0, 15, 12), 37.91, 40.24)
  for (const key of ['Imsak', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    assert.match(result[key], /^\d{2}:\d{2}$/)
    assert.ok(minutesOf(result[key]) >= 0 && minutesOf(result[key]) < 1440)
  }
})

test('next-prayer countdown crosses to next-day Fajr without becoming negative', () => {
  const afternoon = prayerState(timings, new Date(2026, 0, 15, 14, 0))
  assert.equal(afternoon.next.id, 'ikindi')
  assert.equal(afternoon.nextInMin, 90)
  const night = prayerState(timings, new Date(2026, 0, 15, 20, 0))
  assert.equal(night.next.tomorrow, true)
  assert.equal(night.nextInMin, 540)
})

test('failed prayer-time network request safely falls back to offline calculation', async () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('offline') }
  try {
    const date = new Date(2026, 0, 15, 12)
    const result = await fetchTimes({ lat: 37.91, lng: 40.24, date, lang: 'tr' })
    assert.equal(result.source, 'offline')
    assert.match(result.timings.Imsak, /^\d{2}:\d{2}$/)
    assert.ok(result.hijri)
  } finally {
    globalThis.fetch = previousFetch
  }
})
