import test from 'node:test'
import assert from 'node:assert/strict'
import { offlineTimes, fetchTimes, minutesOf, prayerState, timeUntilVakitEnds } from '../src/lib/prayer.js'

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

test('invalid times are rejected instead of entering calculations', () => {
  for (const value of ['24:00', '12:60', 'noon', '', null, '10:30extra']) assert.equal(minutesOf(value), null)
  assert.equal(minutesOf('9:05'), 545)
})

test('malformed API prayer times fall back to offline calculations', async () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: { timings: { ...timings, Fajr: '99:99' } } }) })
  try {
    const result = await fetchTimes({ lat: 37.91, lng: 40.24, date: new Date(2026, 0, 15, 12) })
    assert.equal(result.source, 'offline')
    assert.notEqual(result.timings.Imsak, '99:99')
  } finally { globalThis.fetch = previousFetch }
})


test('online calculation uses Fajr instead of the API pre-Fajr Imsak and explicitly requests standard Asr', async () => {
  const previousFetch = globalThis.fetch
  let requested
  globalThis.fetch = async (url) => {
    requested = url
    return { ok: true, json: async () => ({ data: { timings: { ...timings, Imsak: '04:50', Fajr: '05:00' } } }) }
  }
  try {
    const result = await fetchTimes({ lat: 37.91, lng: 40.24, date: new Date(2026, 10, 16, 12) })
    assert.equal(result.source, 'aladhan')
    assert.equal(result.timings.Imsak, '05:00')
    assert.equal(new URL(requested).searchParams.get('school'), '0')
  } finally { globalThis.fetch = previousFetch }
})

test('prayer countdown ends at sunrise, indicates the gap and uses tomorrow for night', () => {
  const tomorrow = { ...timings, Imsak: '05:10' }
  const at = (h, m) => new Date(2026, 10, 16, h, m)
  assert.equal(timeUntilVakitEnds(timings, tomorrow, at(6, 20)), '00:10')
  assert.equal(timeUntilVakitEnds(timings, tomorrow, at(6, 30)), 'afterSunrise')
  assert.equal(timeUntilVakitEnds(timings, tomorrow, at(11, 59)), 'afterSunrise')
  assert.equal(timeUntilVakitEnds(timings, tomorrow, at(12, 0)), '03:30')
  assert.equal(timeUntilVakitEnds(timings, tomorrow, at(23, 0)), '06:10')
  assert.equal(timeUntilVakitEnds({ ...timings, Sunrise: null }, tomorrow, at(8, 0)), null)
})

test('offline method approximates published reference timetables in Istanbul time', () => {
  // Sources and limits: tests/PRAYER_VALIDATION.md. These examples are not a universal accuracy guarantee.
  const prior = process.env.TZ
  process.env.TZ = 'Europe/Istanbul'
  try {
    const cases = [
      [2026, 11, 16, 37.91, 40.24, ['05:29', '06:53', '12:09', '14:51', '17:14', '18:33']],
      [2026, 11, 16, 41.01, 28.98, ['06:17', '07:45', '12:54', '15:28', '17:52', '19:15']],
      [2026, 11, 16, 39.93, 32.86, ['06:01', '07:27', '12:38', '15:16', '17:39', '19:01']],
      [2026, 3, 21, 37.91, 40.24, ['04:54', '06:15', '12:31', '15:57', '18:38', '19:54']],
      [2026, 6, 21, 41.01, 28.98, ['03:24', '05:25', '13:11', '17:11', '20:47', '22:38']],
    ]
    const keys = ['Imsak', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    for (const [y, month, day, lat, lng, expected] of cases) {
      const got = offlineTimes(new Date(y, month - 1, day, 12), lat, lng)
      keys.forEach((key, i) => assert.ok(Math.abs(minutesOf(got[key]) - minutesOf(expected[i])) <= 2, `${y}-${month}-${day} ${lat} ${key}: ${got[key]} vs ${expected[i]}`))
    }
  } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior }
})
