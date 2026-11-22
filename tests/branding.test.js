import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { tStatic } from '../src/lib/i18n.js'

test('brand is consistent across all languages and installation surfaces', () => {
  const original = globalThis.localStorage
  try {
    for (const lang of ['tr', 'en', 'de', 'fr', 'ar']) {
      globalThis.localStorage = { getItem: () => lang }
      assert.equal(tStatic('appTitle'), 'Ruhi Tesbihat', lang)
      for (const key of ['versionLine', 'notifChannelName', 'permissionSettingsHint']) {
        assert.ok(tStatic(key).includes('Ruhi Tesbihat'), `${lang}: ${key}`)
      }
    }
  } finally {
    if (original === undefined) delete globalThis.localStorage
    else globalThis.localStorage = original
  }
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))
  assert.equal(manifest.name, 'Ruhi Tesbihat')
  assert.equal(manifest.short_name, 'Ruhi Tesbihat')
  const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'))
  assert.equal(config.appName, 'Ruhi Tesbihat')
  assert.equal(config.appId, 'com.matufekci.tesbihat')
  const android = readFileSync('android/app/src/main/res/values/strings.xml', 'utf8')
  assert.match(android, /<string name="app_name">Ruhi Tesbihat<\/string>/)
  assert.match(android, /<string name="title_activity_main">Ruhi Tesbihat<\/string>/)
  assert.match(readFileSync('index.html', 'utf8'), /<title>Ruhi Tesbihat/)
})
