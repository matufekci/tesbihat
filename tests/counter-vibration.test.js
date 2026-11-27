import test from 'node:test'
import assert from 'node:assert/strict'
import { counterVibration } from '../src/lib/counter-vibration.js'

test('counter gives progressively longer pulses on the last three taps', () => {
  assert.deepEqual([29, 30, 31, 32].map(count => counterVibration(count, 33)), [10, 20, 45, 90])
  assert.deepEqual([0, 1, 2].map(count => counterVibration(count, 3)), [20, 45, 90])
  assert.deepEqual([0, 1].map(count => counterVibration(count, 2)), [45, 90])
  assert.deepEqual(counterVibration(0, 1), [25, 45, 25])
})
