import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NAMAZ_IDS, getStepsFor } from '../src/data/vird.js'
import { QURAN } from '../src/data/quran.js'

const readings = JSON.parse(readFileSync(new URL('../src/data/quran-transliteration.json', import.meta.url), 'utf8'))
const ranges = { 2: [285, 286], 36: [1, 83], 56: [1, 96], 59: [20, 24], 67: [1, 30], 71: [1, 28], 78: [1, 40] }

test('each required Quran passage has one nonempty numbered reading per Arabic verse', () => {
  for (const [sura, [from, to]] of Object.entries(ranges)) {
    const rows = readings[sura]
    assert.deepEqual(Object.keys(rows).map(Number), Array.from({ length: to - from + 1 }, (_, i) => from + i), sura)
    for (let n = from; n <= to; n++) {
      assert.ok(QURAN[sura].some(([verse]) => verse === n), `${sura}:${n} Arabic`)
      assert.ok(typeof rows[n] === 'string' && rows[n].trim().length > 1, `${sura}:${n} reading`)
    }
  }
  for (const prayer of NAMAZ_IDS) {
    for (const step of getStepsFor(prayer)) {
      if (step.quran && step.quran.sura !== 1) assert.ok(readings[step.quran.sura], `${prayer}/${step.id}`)
    }
  }
})

test('selected verse boundaries and the Vâkıa prayer point are retained', () => {
  assert.match(readings['36']['58'], /^Selamun/i)
  assert.match(readings['56']['74'], /sebbih/i)
  assert.match(readings['56']['76'], /kasem/i)
  assert.match(readings['59']['20'], /^La yestevi/i)
  assert.match(readings['2']['285'], /^Amener/i)
  assert.match(readings['2']['286'], /^La yukellif/i)
})
