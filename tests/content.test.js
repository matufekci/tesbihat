import test from 'node:test'
import assert from 'node:assert/strict'
import { NAMAZ_IDS, getStepsFor } from '../src/data/vird.js'
import { QURAN } from '../src/data/quran.js'

test('all prayer flows and languages have consistent unique steps and available verses', () => {
  for (const prayer of NAMAZ_IDS) {
    const baseIds = getStepsFor(prayer, 'tr').map((step) => step.id)
    assert.ok(baseIds.length > 0)
    assert.equal(new Set(baseIds).size, baseIds.length, prayer)
    for (const lang of ['tr', 'en', 'de', 'fr', 'ar']) {
      const steps = getStepsFor(prayer, lang)
      assert.deepEqual(steps.map((step) => step.id), baseIds, `${prayer}/${lang}`)
      for (const step of steps) {
        assert.ok(step.title, `${prayer}/${lang}/${step.id}`)
        if (step.type === 'counter') assert.ok(Number.isFinite(step.target) && step.target > 0, step.id)
        if (step.quran) {
          const verses = QURAN[String(step.quran.sura)] || []
          assert.ok(verses.some(([n]) => n >= (step.quran.from ?? 1) && n <= (step.quran.to ?? Infinity)), step.id)
        }
      }
    }
  }
})
