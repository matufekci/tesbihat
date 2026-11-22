import test from 'node:test'
import assert from 'node:assert/strict'
import { getStepsFor } from '../src/data/vird.js'

test('morning and evening Hizb use the same PDF-based text and repetition instructions', () => {
  const dua = (prayer, lang = 'tr') => getStepsFor(prayer, lang).find((step) => step.id === 'dua')
  const morning = dua('sabah')
  const evening = dua('aksam')
  assert.deepEqual(morning.arabic, evening.arabic)
  assert.deepEqual(morning.latin, evening.latin)
  assert.deepEqual(morning.meaning, evening.meaning)
  const arabic = morning.arabic.join('\n')
  assert.match(arabic, /أَلْفَ أَلْفَ لَا حَوْلَ/)
  assert.match(arabic, /وَسُلْطَانٍ/)
  assert.match(arabic, /\[فَإِنْ تَوَلَّوْا فَقُلْ.*\(٧\)\]/)
  assert.match(arabic, /\[خَبَّأْتُ.*قُدْرَةِ الْخَالِقِ \(٣\)\]/)
  assert.doesNotMatch(arabic, /جَلَّ جَلَالُهُ|أَمَانَتِكَ/)
  assert.match(morning.latin.join(' '), /Fe in tevellev fekul/)
  assert.match(morning.meaning.join(' '), /üçer defa üfler/)
  for (const lang of ['en', 'de', 'fr', 'ar']) {
    assert.equal(dua('sabah', lang).meaningLanguage, 'tr')
    assert.deepEqual(dua('sabah', lang).meaning, morning.meaning)
  }
  assert.equal(dua('ogle').arabic, undefined)
})
