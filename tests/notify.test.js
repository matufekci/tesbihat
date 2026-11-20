import test from 'node:test'
import assert from 'node:assert/strict'
import { cancelReminders, scheduleReminders } from '../src/lib/notify.js'

test('web reminder updates and cancellation serialize without leaving timers behind', async () => {
  globalThis.window = {}
  try {
    const future = new Date(Date.now() + 60000)
    const past = new Date(Date.now() - 60000)
    const scheduled = scheduleReminders([{ when: future, body: 'a' }, { when: past, body: 'b' }])
    const cancelled = cancelReminders()
    assert.equal((await scheduled).scheduled, 1)
    await cancelled
    assert.equal(window.__tesbihatTimers.length, 0)
    const empty = await scheduleReminders([{ when: past }])
    assert.equal(empty.scheduled, 0)
  } finally {
    await cancelReminders()
    delete globalThis.window
  }
})
