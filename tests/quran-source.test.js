import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { DIYANET_ARABIC } from '../src/data/diyanet-arabic.js'
import { QURAN, BASMALA, diyanetAyah } from '../src/data/quran.js'
import { getStepsFor } from '../src/data/vird.js'

const digest = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

test('selected Diyanet transcription and unchanged Turkish meanings are intact', () => {
  assert.equal(digest(DIYANET_ARABIC), '3a99728f2b8cc31eb6db85071b1de74051184f101ddba8c661c0d90ca54389a2')
  const meanings = Object.fromEntries(Object.entries(QURAN).map(([s, verses]) => [s, verses.map(([n, , tr]) => [n, tr])]))
  assert.equal(digest(meanings), 'da1bc9c8d6599ea63adfd4c87512ab3320b435669590eaed4d6a25c551cc796a')
  for (const [sura, verses] of Object.entries(QURAN)) {
    for (const [n, text] of verses) assert.equal(text, diyanetAyah(sura, n), `${sura}:${n}`)
  }
  assert.equal(BASMALA, diyanetAyah(1, 1))
  assert.match(diyanetAyah(1, 2), /^اَلْحَمْدُ/)
  assert.ok(diyanetAyah(1, 2).includes('\u0656'))
  for (const [s, n, fragment] of [[11, 56, 'اٰخِذٌ'], [9, 129, 'حَسْبِیَ']]) {
    assert.notEqual(diyanetAyah(s, n).indexOf(fragment), -1, `${s}:${n} excerpt`)
  }
  const steps = getStepsFor('sabah', 'tr')
  assert.ok(steps.find((step) => step.id === 'euzu-besmele-kursi').arabic.includes(diyanetAyah(2, 255)))
})
