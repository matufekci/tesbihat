import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NAMAZ_IDS, getStepsFor } from '../src/data/vird.js'
import { QURAN } from '../src/data/quran.js'
import { DIYANET_ARABIC } from '../src/data/diyanet-arabic.js'

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
  assert.match(readings['36']['58'], /^Selâmun/i)
  assert.match(readings['56']['74'], /sebbih/i)
  assert.match(readings['56']['76'], /qasem/i)
  assert.match(readings['59']['20'], /^Lâ yestevî/i)
  assert.match(readings['2']['285'], /^Âmener/i)
  assert.match(readings['2']['286'], /^Lâ yukellif/i)
})


test('Namaz Zamanı readings retain representative verse boundaries', () => {
  assert.equal(readings['36']['1'], 'Yâ sîn.')
  assert.equal(readings['36']['83'], 'Fe subhânellezî bi yedihî melekûtu kulli şey’in ve ileyhi turceûn(turceûne).')
  assert.equal(readings['56']['1'], 'İzâ ve qaatil vâqıah(vâqıatu).')
  assert.equal(readings['56']['76'], 'Ve innehu le qasemun lev ta’lemûne azîm(azîmun).')
  assert.equal(readings['56']['96'], 'Fe sebbih bismi rabbikel azîm(azîmi).')
})


test('selected Quran reading corrections preserve Arabic word boundaries', () => {
  assert.match(readings['56']['6'], /munbessâ\(munbessen\)/)
  assert.match(readings['56']['83'], /hulqûm\(hulqûme\)/)
  assert.match(readings['36']['13'], /câehâl murselûn/)
  assert.match(readings['36']['80'], /ahdari nâren/)
  assert.match(readings['56']['47'], /ve ızâmen e innâ/)
  assert.match(readings['56']['60'], /mesbûqîn/)
  assert.match(readings['56']['64'], /tezreûnehû/)
  assert.match(readings['67']['30'], /bi mâin maîn/)
})

test('Nebe q/k pilot distinguishes selected ق and ك in both reading variants', () => {
  const rows = readings['78']
  assert.match(rows['8'], /halaqnâkum/)
  assert.match(rows['12'], /fevqakum/)
  assert.match(rows['17'], /kâne mîqâtâ\(mîqâten\)/)
  assert.match(rows['23'], /ahqâbâ\(ahqâben\)/)
  assert.match(rows['24'], /yezûqûne/)
  assert.match(rows['25'], /gassâqâ\(gassâqan\)/)
  assert.match(rows['26'], /vifâqâ\(vifâqan\)/)
  assert.match(rows['30'], /zûqû felen nezîdekum/)
  assert.match(rows['31'], /mutteqîne/)
  assert.match(rows['32'], /Hadâiqa/)
  assert.match(rows['34'], /dihâqâ\(dihâqan\)/)
  assert.match(rows['38'], /yeqûmur.*melâiketu.*yetekellemûne.*qâle/)
  assert.match(rows['39'], /haqq\(haqqu\)/)
  assert.match(rows['40'], /enzernâkum.*qarîbâ\(qarîben\).*qaddemet.*yeqûlul kâfiru/)
})


test('q groups match the number of Arabic qaf letters per verse', () => {
  for (const [sura, verses] of Object.entries(readings)) {
    for (const [n, reading] of Object.entries(verses)) {
      const base = reading.replace(/\([^()]*\)/g, '')
      const latinQ = (base.match(/q+/gi) || []).length
      const arabicQ = (DIYANET_ARABIC[sura][n].match(/ق/g) || []).length
      assert.equal(latinQ, arabicQ, `${sura}:${n} q count`)
    }
  }
})

test('selected qaf and kaf distinctions are retained in the same verse', () => {
  assert.match(readings['2']['285'], /kullun.*nuferriqu.*qâlû/)
  assert.match(readings['36']['7'], /Leqad haqqal qavlu.*ekserihim/)
  assert.match(readings['56']['16'], /Muttekiîne.*muteqâbilîn\(muteqâbilîne\)/)
  assert.match(readings['59']['23'], /elmelikul quddûsus.*mutekebbir/)
  assert.match(readings['67']['21'], /yerzuqukum in emseke rızqah\(rızqahu\)/)
  assert.match(readings['71']['14'], /qad halaqakum/)
})


test('q is consistent between the base word and its parenthesized reading', () => {
  for (const [sura, verses] of Object.entries(readings)) for (const [n, reading] of Object.entries(verses)) {
    for (const match of reading.matchAll(/([^\s(),]+)\(([^()]*)\)/g)) {
      const count = value => (value.match(/q+/gi) || []).length
      assert.equal(count(match[1]), count(match[2]), `${sura}:${n} ${match[0]}`)
    }
  }
})
