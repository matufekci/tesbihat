import { test, expect } from '@playwright/test'

async function ready(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('tesbihat.settings')) localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true }))
  })
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.splash')).toHaveCount(0, { timeout: 15000 })
}

async function prepareOnboarding(page, { granted = false } = {}) {
  await page.addInitScript(({ granted }) => {
    window.permissionCalls = []
    Object.defineProperty(window, 'Notification', { configurable: true, value: {
      permission: 'default',
      requestPermission: async () => { window.permissionCalls.push('notification'); return granted ? 'granted' : 'denied' },
    } })
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: (success, failure) => {
        window.permissionCalls.push('location')
        if (granted) success({ coords: { latitude: 37.9, longitude: 40.2 } })
        else failure({ code: 1 })
      },
    } })
  }, { granted })
}

async function enterThemeStep(page) {
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.permissionCalls)).toEqual(['notification', 'location'])
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
}

test('settings and step navigation survive reload', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await ready(page)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Ses ve Titreşim' }).click()
  const sound = page.locator('#sound-switch')
  const vibration = page.locator('#vibration-switch')
  await sound.click(); await vibration.click()
  await expect(sound).toHaveAttribute('aria-checked', 'false')
  await expect(vibration).toHaveAttribute('aria-checked', 'false')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Ayarlar', exact: true })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Ses ve Titreşim' }).click()
  await expect(sound).toHaveAttribute('aria-checked', 'false')
  await expect(vibration).toHaveAttribute('aria-checked', 'false')
  await page.getByRole('button', { name: 'Geri' }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  const list = page.getByRole('dialog', { name: 'Adım Listesi' })
  await expect(list).toBeVisible()
  await list.locator('li').nth(2).locator('button').click()
  await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toContainText('3/')
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.keyboard.press('Escape')
  await expect(list).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toBeFocused()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toContainText('3/', { timeout: 15000 })
  expect(errors).toEqual([])
})

test('installed shell opens offline after first visit', async ({ page, context }) => {
  await ready(page)
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await expect(page.getByRole('dialog', { name: 'Adım Listesi' })).toBeVisible()
})

test('counter keeps its value and disabled vibration is respected', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => { window.vibrationCalls = (window.vibrationCalls || 0) + 1; return true } })
  })
  await ready(page)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Ses ve Titreşim' }).click()
  await page.locator('#vibration-switch').click()
  await page.getByRole('button', { name: 'Geri', exact: true }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.getByRole('dialog', { name: 'Adım Listesi' }).locator('button').filter({ hasText: /0\/\d+/ }).first().click()
  const counter = page.getByRole('button', { name: 'Say', exact: true })
  await counter.click()
  await expect(counter).toContainText('1')
  expect(await page.evaluate(() => window.vibrationCalls || 0)).toBe(0)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('1', { timeout: 15000 })
})

test('first launch works on a compact screen and language switches to RTL', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await prepareOnboarding(page)
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Dilini seç' })).toBeVisible()
  await enterThemeStep(page)
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Dil Seçimi' }).click()
  await page.getByRole('button', { name: /العربية/ }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('date header remains readable without overflow on compact and wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await ready(page)
  for (const width of [320, 390, 1024]) {
    await page.setViewportSize({ width, height: 720 })
    const header = page.locator('.date-row')
    await expect(header).toHaveCSS('font-size', '14px')
    const fits = await header.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return [...element.children].every((child) => {
        const box = child.getBoundingClientRect()
        return box.left >= rect.left && box.right <= rect.right && child.scrollWidth <= child.clientWidth
      })
    })
    expect(fits).toBe(true)
  }
})

test('rose theme can be selected, persists and is readable in the prayer flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ready(page)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Görünüm' }).click()
  await page.getByRole('button', { name: 'Gül Kurusu' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'rose')
  await expect(page.getByRole('button', { name: 'Gül Kurusu' })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'rose')
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await expect(page.locator('.flow-overlay')).toBeVisible()
  await expect(page.locator('.g-title')).toHaveCSS('color', 'rgb(53, 35, 42)')
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await expect(page.getByRole('dialog', { name: 'Adım Listesi' })).toBeVisible()
})

test('rose theme can be chosen during onboarding', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await prepareOnboarding(page)
  await page.goto('./')
  await enterThemeStep(page)
  await page.getByRole('button', { name: 'Gül Kurusu' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'rose')
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'rose')
})

test('long surahs grow to the same size as short Arabic prayers', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await ready(page)
  for (const [prayer, title] of [['Sabah', 'Yâsîn Suresi'], ['Akşam', 'Vâkıa Suresi']]) {
    await page.locator('.bottom-vakit-chips').getByRole('button', { name: prayer, exact: true }).click()
    await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
    await page.getByRole('button', { name: 'Adım listesini aç' }).click()
    await page.getByRole('dialog', { name: 'Adım Listesi' }).getByRole('button', { name: new RegExp(title) }).click()
    const text = page.locator('.quran-text')
    await expect(text).toHaveCSS('font-size', '26px')
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Yazıyı büyüt' }).click()
    await expect(text).toHaveCSS('font-size', '41.6px')
    expect(await text.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.getByRole('button', { name: 'Kapat', exact: true }).click()
    await page.evaluate(() => localStorage.removeItem('tesbihat.fontScale'))
  }
})

for (const theme of ['rose', 'light']) {
  test(`provision prayer end note is legible in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => {
      localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true, theme: value }))
    }, theme)
    await page.goto('./')
    await page.locator('.bottom-vakit-chips').getByRole('button', { name: 'Akşam', exact: true }).click()
    await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
    await page.getByRole('button', { name: 'Adım listesini aç' }).click()
    await page.getByRole('dialog', { name: 'Adım Listesi' }).getByRole('button', { name: /Vâkıa Suresi/ }).click()
    await page.getByRole('button', { name: /Rızık Duasını Oku/ }).click()
    const note = page.locator('.rizik-endnote')
    await expect(note).toBeVisible()
    await expect(note.locator('.ren-ayah')).toHaveCount(2)
    // Compare the computed foreground and solid background colors using WCAG contrast.
    for (const selector of ['.ren-line', '.ren-ayah', '.ren-num']) {
      const ratio = await note.locator(selector).first().evaluate((el, selector) => {
        const parse = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number)
        const luminance = (rgb) => rgb.map((c) => {
          c /= 255
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
        const style = window.getComputedStyle(el)
        const bg = selector === '.ren-line' ? window.getComputedStyle(el.parentElement).backgroundColor : style.backgroundColor
        const a = luminance(parse(style.color)), b = luminance(parse(bg))
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      }, selector)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
}

test('all theme options fit on onboarding and settings without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await prepareOnboarding(page)
  await page.goto('./')
  await enterThemeStep(page)
  const onboarding = page.locator('.splash-theme')
  await expect(onboarding.getByRole('button')).toHaveCount(5)
  const checkFits = async (group) => {
    const fits = await group.evaluate((container) => {
      const parent = container.getBoundingClientRect()
      return container.scrollWidth <= container.clientWidth && [...container.querySelectorAll('button')].every((button) => {
        const rect = button.getBoundingClientRect()
        return rect.left >= parent.left - 1 && rect.right <= parent.right + 1 && button.scrollWidth <= button.clientWidth
      })
    })
    expect(fits).toBe(true)
  }
  await checkFits(onboarding)
  await onboarding.getByRole('button', { name: 'Gül Kurusu' }).click()
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Görünüm' }).click()
  const settings = page.locator('.settings-theme-chips')
  await expect(settings.getByRole('button')).toHaveCount(5)
  await checkFits(settings)
  await expect(settings.getByRole('button', { name: 'Gül Kurusu' })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('summary').filter({ hasText: 'Dil Seçimi' }).click()
  await page.getByRole('button', { name: /العربية/ }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await checkFits(settings)
})

test('settings sections collapse and language heading is multilingual without test buttons', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true, notifEnabled: true })))
  await page.goto('./')
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  const groups = page.locator('.settings-screen details.settings-group')
  await expect(groups).toHaveCount(5)
  for (let i = 0; i < 5; i++) await expect(groups.nth(i)).not.toHaveAttribute('open', '')
  const language = groups.nth(0)
  const heading = language.locator('summary')
  for (const word of ['Dil Seçimi', 'اختيار اللغة', 'Sprachauswahl', 'Choix de la langue', 'Language selection']) await expect(heading).toContainText(word)
  await heading.focus()
  await page.keyboard.press('Enter')
  await expect(language).toHaveAttribute('open', '')
  await expect(language.getByRole('button', { name: /English/ })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(language).not.toHaveAttribute('open', '')
  for (let i = 1; i < 5; i++) await groups.nth(i).locator(':scope > summary').click()
  await expect(page.getByRole('button', { name: /^(Test et|Önizle)$/ })).toHaveCount(0)
  await expect(page.locator('#prayer-switch-sabah')).toBeVisible()
  await expect(page.locator('#sound-switch')).toBeVisible()
})

test('counter and check rings have matching size and stroke', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await ready(page)
  await expect(page.locator('.splash')).toHaveCount(0)
  await page.locator('.bottom-vakit-chips').getByRole('button', { name: 'Akşam', exact: true }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  const counter = page.locator('.counter-ring')
  const counterBox = await counter.boundingBox()
  const geometry = await counter.locator('.ring-bg').evaluate((circle) => ({
    radius: Number(circle.getAttribute('r')),
    strokeWidth: Number(circle.getAttribute('stroke-width')),
  }))
  await page.getByRole('button', { name: 'Sonraki adıma geç' }).click()
  const done = page.locator('.done-ring')
  await expect(done).toBeVisible()
  const doneBox = await done.boundingBox()
  expect(counterBox.width).toBe(doneBox.width)
  expect(counterBox.height).toBe(doneBox.height)
  expect(geometry.radius * 2 + geometry.strokeWidth).toBe(doneBox.width)
  expect(geometry.strokeWidth).toBe(parseFloat(await done.evaluate((el) => window.getComputedStyle(el).borderTopWidth)))
})

test('returning users see the splash emblem before the app opens', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true })))
  await page.clock.install()
  await page.goto('./')
  const splash = page.locator('.splash')
  await expect(splash).toBeVisible()
  const emblem = splash.locator('img.splash-star')
  await expect(emblem).toBeVisible()
  await expect.poll(() => emblem.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true)
  await page.clock.fastForward(1500)
  await expect(splash).not.toHaveClass(/is-leaving/)
  await page.clock.fastForward(700)
  await expect(splash).toHaveClass(/is-leaving/)
  await page.clock.fastForward(550)
  await expect(splash).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible()
})

test('animated startup appears before the application JavaScript is ready', async ({ page }) => {
  let releaseScript
  const scriptGate = new Promise((resolve) => { releaseScript = resolve })
  await page.route('**/assets/*.js', async (route) => {
    await scriptGate
    await route.continue()
  })
  await page.addInitScript(() => localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true })))
  await page.goto('./', { waitUntil: 'commit' })
  const startup = page.locator('.startup')
  await expect(startup).toBeVisible()
  const mark = startup.locator('img')
  await expect.poll(() => mark.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true)
  await expect(mark).toHaveCSS('animation-name', 'startup-reveal')
  expect(await page.locator('html').evaluate((el) => window.getComputedStyle(el).backgroundColor)).toBe('rgb(6, 15, 12)')
  releaseScript()
  await expect(page.locator('.splash img.splash-star')).toBeVisible()
  await expect(page.locator('.splash')).toHaveCount(0, { timeout: 15000 })
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible()
})

test('Ruhi Tesbihat brand is shown on startup and in the app', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true })))
  await page.goto('./')
  await expect(page.locator('.splash-title')).toHaveText('Ruhi Tesbihat')
  await expect(page.locator('.splash-foot')).toHaveText('RUHİ TESBİHAT')
  await expect(page.locator('.splash')).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('.app-title-main')).toHaveText('Ruhi Tesbihat')
  await expect(page).toHaveTitle(/Ruhi Tesbihat/)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await expect(page.getByText(/Ruhi Tesbihat · Sürüm/)).toBeVisible()
})

test('Turkish mushaf script is displayed in the Quran flow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await ready(page)
  await expect(page.locator('.start-verse')).toContainText('فَاِذَا قَضَیْتُمُ')
  await page.locator('.bottom-vakit-chips').getByRole('button', { name: 'Sabah', exact: true }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.getByRole('dialog', { name: 'Adım Listesi' }).getByRole('button', { name: /Fâtiha-i Şerîfe/ }).click()
  const text = page.locator('.quran-text')
  await expect(text).toContainText('اَلْحَمْدُ لِلّٰهِ')
  await expect(text).toContainText('الْعَالَمٖینَ')
  await expect(text).toHaveCSS('font-family', /Scheherazade New/)
  await expect(text).toHaveAttribute('dir', 'rtl')
  expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('Turkish prayer section headings use the correct suffix', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await ready(page)
  for (const [prayer, expected] of [['Sabah', 'Sabah’a Özel'], ['Öğle', 'Öğle’ye Özel'], ['İkindi', 'İkindi’ye Özel'], ['Akşam', 'Akşam’a Özel'], ['Yatsı', 'Yatsı’ya Özel']]) {
    await page.locator('.bottom-vakit-chips').getByRole('button', { name: prayer, exact: true }).click()
    await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
    await page.getByRole('button', { name: 'Adım listesini aç' }).click()
    await page.getByRole('dialog', { name: 'Adım Listesi' }).locator('li').nth(12).locator('button').click()
    await expect(page.locator('.g-section')).toHaveText(expected)
    await page.getByRole('button', { name: 'Kapat', exact: true }).click()
  }
})


test('onboarding requests permissions once in sequence and preserves selections', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await prepareOnboarding(page, { granted: true })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Dilini seç' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Başla', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Daha kişisel bir deneyim' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.permissionCalls)).toEqual(['notification', 'location'])
  await expect(page.getByRole('button', { name: 'İzin verildi ✓' })).toHaveCount(2)
  await page.getByRole('button', { name: 'Geri', exact: true }).click()
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  expect(await page.evaluate(() => window.permissionCalls)).toEqual(['notification', 'location'])
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await page.getByRole('button', { name: 'Gül Kurusu' }).click()
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible()
  const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('tesbihat.settings')))
  expect(settings.notifEnabled).toBe(true)
  expect(settings.custom.lat).toBe(37.9)
  expect(settings.theme).toBe('rose')
  await page.reload()
  await expect(page.locator('.splash.is-onboard')).toHaveCount(0)
})

test('permission prompts can be declined and onboarding remains optional', async ({ page }) => {
  await prepareOnboarding(page)
  await page.goto('./')
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.permissionCalls)).toEqual(['notification', 'location'])
  await expect(page.getByText('Bu adım isteğe bağlıdır. İzin vermeden de devam edebilirsiniz.')).toBeVisible()
  await expect(page.locator('.welcome-permission-help')).toBeVisible()
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible()
})

test('pending permissions do not trap the user or start a later prompt after skipping', async ({ page }) => {
  await page.addInitScript(() => {
    window.permissionCalls = []
    Object.defineProperty(window, 'Notification', { configurable: true, value: {
      permission: 'default', requestPermission: () => {
        window.permissionCalls.push('notification')
        return new Promise((resolve) => { window.resolvePermission = resolve })
      },
    } })
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: () => { window.permissionCalls.push('location') },
    } })
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await expect(page.getByText('İsteniyor…')).toBeVisible()
  await page.getByRole('button', { name: 'Devam et', exact: true }).click()
  await page.evaluate(() => window.resolvePermission('denied'))
  await expect(page.getByRole('heading', { name: 'Görünümünü seç' })).toBeVisible()
  expect(await page.evaluate(() => window.permissionCalls)).toEqual(['notification'])
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible()
})

test('Arabic onboarding has translated steps and usable compact navigation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await prepareOnboarding(page)
  await page.goto('./')
  await page.getByRole('button', { name: /العربية/ }).click()
  await expect(page.getByRole('heading', { name: 'اختر لغتك' })).toBeVisible()
  await page.getByRole('button', { name: 'متابعة', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'تجربة أكثر ملاءمة لك' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.permissionCalls)).toEqual(['notification', 'location'])
  const box = await page.getByRole('button', { name: 'متابعة', exact: true }).boundingBox()
  expect(box.y + box.height).toBeLessThanOrEqual(640)
  await page.getByRole('button', { name: 'متابعة', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'اختر المظهر' })).toBeVisible()
})

async function prepareClockAndPrayerTimes(page, time) {
  await page.clock.setFixedTime(new Date(time))
  await page.route('https://api.aladhan.com/**', (route) => route.fulfill({ json: { data: { timings: {
    Imsak: '04:50', Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30',
  } } } }))
  await ready(page)
}

async function beginCounting(page) {
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.getByRole('dialog', { name: 'Adım Listesi' }).locator('button').filter({ hasText: /0\/\d+/ }).first().click()
  await page.getByRole('button', { name: 'Say', exact: true }).click()
  await page.getByRole('button', { name: 'Say', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
}

async function changeClock(page, time) {
  await page.clock.setFixedTime(new Date(time))
  await page.evaluate(() => document.dispatchEvent(new window.Event('visibilitychange')))
}

test('active night dhikr survives midnight, reload and explicit close', async ({ page }) => {
  await prepareClockAndPrayerTimes(page, '2026-11-16T23:59:00Z')
  await expect(page.locator('.vl-name')).toHaveText('Yatsı')
  await beginCounting(page)
  const title = await page.locator('.g-title').innerText()
  const step = await page.getByRole('button', { name: 'Adım listesini aç' }).innerText()
  await changeClock(page, '2026-11-17T00:01:00Z')
  await expect(page.locator('.g-title')).toHaveText(title)
  await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toHaveText(step)
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2', { timeout: 15000 })
  await page.getByRole('button', { name: 'Kapat', exact: true }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
})

test('active noon dhikr stays on its prayer at afternoon time and reminder time', async ({ page }) => {
  await prepareClockAndPrayerTimes(page, '2026-11-16T14:59:00Z')
  await expect(page.locator('.vl-name')).toHaveText('Öğle')
  await beginCounting(page)
  const title = await page.locator('.g-title').innerText()
  const step = await page.getByRole('button', { name: 'Adım listesini aç' }).innerText()
  await changeClock(page, '2026-11-16T15:00:00Z')
  await expect(page.locator('.g-title')).toHaveText(title)
  await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toHaveText(step)
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
  await changeClock(page, '2026-11-16T15:15:00Z')
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2', { timeout: 15000 })
  await page.getByRole('button', { name: 'Kapat', exact: true }).click()
  await expect(page.locator('.vl-name')).toHaveText('İkindi')
  await page.locator('.bottom-vakit-chips').getByRole('button', { name: 'Öğle', exact: true }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
})


test('chosen counter target and count are preserved when resuming an active session', async ({ page }) => {
  await prepareClockAndPrayerTimes(page, '2026-11-16T23:58:00Z')
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.getByRole('dialog', { name: 'Adım Listesi' }).locator('li').filter({ hasText: 'Lâ ilâhe illallâh' }).first().locator('button').click()
  await page.locator('.target-chips').getByRole('button', { name: '100×' }).click()
  await page.getByRole('button', { name: 'Say', exact: true }).click()
  await changeClock(page, '2026-11-17T00:01:00Z')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('1', { timeout: 15000 })
  await expect(page.locator('.target-chips').getByRole('button', { name: '100×' })).toHaveClass(/active/)
  await page.getByRole('button', { name: 'Kapat', exact: true }).click()
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await expect(page.locator('.target-chips').getByRole('button', { name: '100×' })).toHaveClass(/active/)
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('1')
})

test('a scheduled afternoon reminder does not interrupt an active noon counter', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-16T15:14:30Z') })
  await page.addInitScript(() => {
    localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true, notifEnabled: true, reminderMin: 15, soundEnabled: false, vibrationEnabled: false }))
    window.reminderCalls = []
    Object.defineProperty(navigator.serviceWorker, 'getRegistration', { configurable: true, value: async () => ({
      showNotification: async (title, options) => { window.reminderCalls.push({ title, tag: options.tag }) },
    }) })
  })
  await page.route('https://api.aladhan.com/**', (route) => route.fulfill({ json: { data: { timings: {
    Imsak: '04:50', Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30',
  } } } }))
  await page.goto('./')
  await expect(page.locator('.splash')).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('.vl-name')).toHaveText('İkindi')
  await page.locator('.bottom-vakit-chips').getByRole('button', { name: 'Öğle', exact: true }).click()
  await beginCounting(page)
  await expect.poll(() => page.evaluate(() => window.__tesbihatTimers?.length ?? 0)).toBeGreaterThan(0)
  await page.clock.fastForward('00:00:40')
  await expect.poll(() => page.evaluate(() => window.reminderCalls.map((call) => call.tag))).toContain('tesbihat-ikindi')
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
})

for (const [before, after, startTime, endTime] of [
  ['Yatsı', 'Sabah', '2026-11-16T04:59:00Z', '2026-11-16T05:00:00Z'],
  ['Sabah', 'Öğle', '2026-11-16T11:59:00Z', '2026-11-16T12:00:00Z'],
  ['İkindi', 'Akşam', '2026-11-16T17:59:00Z', '2026-11-16T18:00:00Z'],
  ['Akşam', 'Yatsı', '2026-11-16T19:29:00Z', '2026-11-16T19:30:00Z'],
]) {
  test(`active ${before} dhikr continues when ${after} begins`, async ({ page }) => {
    await prepareClockAndPrayerTimes(page, startTime)
    await expect(page.locator('.vl-name')).toHaveText(before)
    await beginCounting(page)
    const title = await page.locator('.g-title').innerText()
    const step = await page.getByRole('button', { name: 'Adım listesini aç' }).innerText()
    await changeClock(page, endTime)
    await expect(page.locator('.g-title')).toHaveText(title)
    await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toHaveText(step)
    await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('2')
    await page.getByRole('button', { name: 'Kapat', exact: true }).click()
    await expect(page.locator('.vl-name')).toHaveText(after)
  })
}

test('salawat highlights only the four changing Arabic and Latin words', async ({ page }) => {
  await ready(page)
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.getByRole('dialog', { name: 'Adım Listesi' }).locator('li').filter({ hasText: 'Salâvat-ı Şerîfe' }).first().locator('button').click()
  const arabic = page.locator('.guided-body .arabic')
  const latin = page.locator('.guided-body .latin')
  await expect(arabic.locator('strong')).toHaveText(['سَيِّدِنَا', 'حَبِيبِنَا', 'أَسْعَدِنَا', 'شَفِيعِنَا'])
  await expect(latin.locator('strong')).toHaveText(['seyyidinâ', 'habîbinâ', 'es’adinâ', 'şefî’inâ'])
  for (const el of await arabic.locator('strong').all()) await expect(el).toHaveCSS('font-weight', '700')
  await expect(latin).toHaveText('Allâhümme salli ve sellim ve bârik ‘alâ … (seyyidinâ / habîbinâ / es’adinâ / şefî’inâ) Muhammedin ve ‘alâ âlihî ‘adede in’âmillâhi ve ifdâlih.')
})

test('settings theme choices match onboarding icons, styling and two-column layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await prepareOnboarding(page)
  await page.goto('./')
  await enterThemeStep(page)
  const onboarding = page.locator('.splash-theme')
  const labels = ['Sistem', 'Koyu', 'Açık', 'AMOLED', 'Gül Kurusu']
  const snapshots = {}
  const styles = (group) => group.locator('button').evaluateAll((buttons) => buttons.map((button) => {
    const style = window.getComputedStyle(button)
    const rect = button.getBoundingClientRect()
    return {
      icon: button.querySelector('svg')?.outerHTML,
      active: button.getAttribute('aria-pressed'),
      background: style.backgroundImage, backgroundColor: style.backgroundColor, shadow: style.boxShadow, color: style.color, border: style.borderColor,
      font: style.fontWeight, height: rect.height,
    }
  }))
  for (const label of labels) {
    await onboarding.getByRole('button', { name: label, exact: true }).click()
    await page.mouse.move(0, 0)
    await page.waitForTimeout(250) // let theme-colour transitions finish
    snapshots[label] = await styles(onboarding)
  }
  await page.getByRole('button', { name: 'Başla', exact: true }).click()
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Görünüm' }).click()
  const settings = page.locator('.settings-theme-chips')
  for (const label of labels) {
    await settings.getByRole('button', { name: label, exact: true }).click()
    await page.mouse.move(0, 0)
    await expect.poll(() => styles(settings)).toEqual(snapshots[label])
  }
  const positions = await settings.locator('button').evaluateAll((buttons) => buttons.map((button) => {
    const { left, top } = button.getBoundingClientRect()
    return { left, top }
  }))
  expect(positions[0].top).toBe(positions[1].top)
  expect(positions[2].top).toBe(positions[3].top)
  expect(positions[0].left).toBe(positions[4].left)
  await page.reload()
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Görünüm' }).click()
  await expect(settings.getByRole('button', { name: 'Gül Kurusu' })).toHaveAttribute('aria-pressed', 'true')
})

test('new decorative icons preserve settings, compact controls and reading interactions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await ready(page)
  const start = page.getByRole('button', { name: 'Tesbihata Başla', exact: true })
  await expect(start.locator('svg[aria-hidden="true"]')).toHaveCount(1)
  await expect(page.locator('.quick-sheet-label svg[aria-hidden="true"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  const groups = page.locator('.settings-group')
  await expect(groups).toHaveCount(5)
  await expect(groups.locator('.settings-group-icon svg[aria-hidden="true"]')).toHaveCount(5)
  const appearance = groups.filter({ hasText: 'Görünüm' })
  await appearance.locator('summary').click()
  await expect(appearance.locator('.settings-group-content')).toBeVisible()
  await expect(appearance.locator('.settings-group-icon svg')).toHaveCSS('transform', 'none')
  await appearance.getByRole('button', { name: 'Açık', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Geri', exact: true }).click()
  await start.click()
  const toolbar = page.locator('.guided-top.inflow')
  const layout = await toolbar.evaluate((el) => ({
    width: el.clientWidth, scrollWidth: el.scrollWidth,
    progressWidth: el.querySelector('.g-progress').getBoundingClientRect().width,
  }))
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width)
  expect(layout.progressWidth).toBeGreaterThanOrEqual(24)
  const stepList = page.getByRole('button', { name: 'Adım listesini aç' })
  await expect(stepList.locator('svg[aria-hidden="true"]')).toHaveCount(1)
  await stepList.click()
  await expect(page.getByRole('dialog', { name: 'Adım Listesi' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(stepList).toBeFocused()
  const meaning = page.getByRole('button', { name: 'Türkçe Anlamı' })
  await expect(meaning.locator('svg[aria-hidden="true"]')).toHaveCount(2)
  await meaning.click()
  await expect(meaning).toHaveAttribute('aria-expanded', 'true')
})

test('decorative settings icons and controls remain usable in RTL', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await ready(page)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Dil Seçimi' }).click()
  await page.getByRole('button', { name: /العربية/ }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  const summaries = page.locator('.settings-group-summary')
  await expect(summaries.locator('.settings-group-icon svg[aria-hidden="true"]')).toHaveCount(5)
  const fits = await summaries.evaluateAll((rows) => rows.every((row) => row.scrollWidth <= row.clientWidth))
  expect(fits).toBe(true)
})

test('Android reminder plan is configured, updated for location and cancelled', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'))
  await page.addInitScript(() => {
    localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true, notifEnabled: true, reminderMin: 15 }))
    window.reminderBridgeCalls = []
    window.CapacitorCustomPlatform = { name: 'android' }
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: { ReminderPlanner: {
        configure: async (plan) => { window.reminderBridgeCalls.push({ type: 'configure', plan }) },
        cancel: async () => { window.reminderBridgeCalls.push({ type: 'cancel' }) },
      } },
      PluginHeaders: [{ name: 'LocalNotifications', methods: [{ name: 'getPending', rtype: 'promise' }, { name: 'cancel', rtype: 'promise' }] }],
      nativePromise: async (plugin, method) => {
        window.reminderBridgeCalls.push({ type: `${plugin}.${method}` })
        return method === 'getPending' ? { notifications: [{ id: 7 }] } : {}
      },
    }
  })
  await page.route('https://api.aladhan.com/**', (route) => route.fulfill({ json: { data: { timings: {
    Imsak: '04:50', Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30',
  } } } }))
  await page.goto('./')
  await expect.poll(() => page.evaluate(() => window.reminderBridgeCalls.filter((call) => call.type === 'configure').at(-1)?.plan.minutes)).toEqual([300, 720, 900, 1080, 1170])
  let calls = await page.evaluate(() => window.reminderBridgeCalls)
  let plan = calls.filter((call) => call.type === 'configure').at(-1).plan
  expect(plan.date).toBe('2026-11-16')
  expect(plan.bodies).toHaveLength(5)
  expect(plan.delay).toBe(15)
  expect(calls.some((call) => call.type === 'LocalNotifications.cancel')).toBe(true)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('.settings-group > summary').filter({ hasText: 'Konum' }).click()
  const oldLat = plan.latitude
  await page.locator('#city').selectOption('istanbul')
  await expect.poll(() => page.evaluate(() => window.reminderBridgeCalls.filter((call) => call.type === 'configure').at(-1)?.plan.latitude)).not.toBe(oldLat)
  await expect.poll(() => page.evaluate(() => window.reminderBridgeCalls.filter((call) => call.type === 'configure').at(-1)?.plan.minutes)).toEqual([300, 720, 900, 1080, 1170])
  calls = await page.evaluate(() => window.reminderBridgeCalls)
  plan = calls.filter((call) => call.type === 'configure').at(-1).plan
  expect(plan.latitude).not.toBe(oldLat)
  await page.locator('summary').filter({ hasText: 'Ezan Sonrası Hatırlatma' }).click()
  await page.locator('#notif-switch').click()
  await expect.poll(() => page.evaluate(() => window.reminderBridgeCalls.some((call) => call.type === 'cancel'))).toBe(true)
})

test('sunrise ends the prayer countdown and source is in the collapsed overview', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T06:30:00Z'))
  await page.addInitScript(() => localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true })))
  await page.route('https://api.aladhan.com/**', (route) => route.fulfill({ json: { data: { timings: {
    Imsak: '04:50', Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30',
  } } } }))
  await page.goto('./')
  await expect(page.locator('.date-countdown')).toContainText('Sabah namazı vakti güneşle sona erdi')
  await expect(page.getByText('AlAdhan çevrimiçi hesap', { exact: false })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  const overview = page.locator('.prayer-overview')
  await expect(overview).not.toHaveAttribute('open', '')
  await expect(page.locator('.settings-group').filter({ hasText: 'Görünüm' }).locator('+ .prayer-overview')).toHaveCount(1)
  await overview.locator('summary').click()
  await expect(overview).toContainText('AlAdhan çevrimiçi hesap')
  await page.getByRole('button', { name: 'Geri', exact: true }).click()
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await expect(page.locator('.prayer-overview')).not.toHaveAttribute('open', '')
})

test('per-prayer settings persist, offline-only mode blocks requests, and health and time zone are visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'))
  await page.addInitScript(() => {
    if (!localStorage.getItem('tesbihat.settings')) localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true, notifEnabled: true }))
    window.reminderBridgeCalls = []
    window.CapacitorCustomPlatform = { name: 'android' }
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: { ReminderPlanner: {
        configure: async (plan) => { window.reminderBridgeCalls.push(plan) },
        cancel: async () => {},
        status: async () => ({ notificationsEnabled: true, channelEnabled: true, exactAllowed: false, batteryUnrestricted: false, nextAt: 1794834000000 }),
      } },
      PluginHeaders: [{ name: 'LocalNotifications', methods: [{ name: 'getPending', rtype: 'promise' }, { name: 'cancel', rtype: 'promise' }] }],
      nativePromise: async (_plugin, method) => method === 'getPending' ? { notifications: [] } : {},
    }
  })
  let requests = 0
  await page.route('https://api.aladhan.com/**', (route) => {
    requests++
    return route.fulfill({ json: { data: { timings: { Fajr: '05:00', Imsak: '04:50', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30' } } } })
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('.prayer-overview summary').click()
  await expect(page.locator('.prayer-overview')).toContainText('AlAdhan')
  await expect(page.locator('.prayer-overview')).toContainText('Diyarbakır')
  await expect(page.locator('.prayer-overview')).toContainText('Sonraki vakit')
  await expect(page.locator('.zone-warning')).toContainText('Europe/Istanbul')
  await page.locator('summary').filter({ hasText: 'Ezan Sonrası Hatırlatma' }).click()
  await page.locator('#prayer-switch-ogle').click()
  await page.getByRole('combobox', { name: 'Sabah · Kaç dakika sonra hatırlat?' }).selectOption('30')
  await expect.poll(() => page.evaluate(() => window.reminderBridgeCalls.at(-1)?.enabled)).toEqual([true, false, true, true, true])
  await expect.poll(() => page.evaluate(() => window.reminderBridgeCalls.at(-1)?.delays)).toEqual([30, 15, 15, 15, 15])
  await page.getByText('Bildirim sağlığı', { exact: true }).click()
  await expect(page.locator('.reminder-health')).toContainText('Kesin alarm izni: Kapalı')
  await expect(page.locator('.reminder-health')).toContainText('Sonraki planlanan hatırlatma')
  await page.locator('.settings-group > summary').filter({ hasText: 'Konum' }).click()
  await page.locator('#offline-only').click()
  await expect(page.locator('.prayer-overview')).toContainText('Çevrimdışı')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tesbihat.settings')).offlineOnly)).toBe(true)
  const before = requests
  await page.reload()
  await expect(page.locator('.time-source')).toHaveCount(0)
  await page.waitForTimeout(300)
  expect(requests).toBe(before)
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Ezan Sonrası Hatırlatma' }).click()
  await expect(page.locator('#prayer-switch-ogle')).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('combobox', { name: 'Sabah · Kaç dakika sonra hatırlat?' })).toHaveValue('30')
})

test('web reminders respect the saved prayer switches and individual delays', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T04:00:00Z'))
  await page.addInitScript(() => {
    localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true, notifEnabled: true,
      reminders: { sabah: { enabled: true, delay: 30 }, ogle: { enabled: false, delay: 15 }, ikindi: { enabled: false, delay: 15 }, aksam: { enabled: true, delay: 5 }, yatsi: { enabled: false, delay: 15 } } }))
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } })
  })
  await page.route('https://api.aladhan.com/**', (route) => route.fulfill({ json: { data: { timings: {
    Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30',
  } } } }))
  await page.goto('./')
  await expect.poll(() => page.evaluate(() => window.__tesbihatNextEvents)).toEqual([
    { prayerId: 'sabah', at: new Date('2026-11-16T05:30:00Z').getTime() },
    { prayerId: 'aksam', at: new Date('2026-11-16T18:05:00Z').getTime() },
  ])
})

test('first-run location disclosure precedes online prayer requests', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareOnboarding(page)
  let requests = 0
  await page.route('https://api.aladhan.com/**', (route) => { requests++; return route.abort() })
  await page.goto('./')
  await expect(page.locator('.welcome-disclosure')).toContainText('AlAdhan')
  await page.waitForTimeout(300)
  expect(requests).toBe(0)
})

test('all themes give settings cards and quick panel visible elevation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ready(page)
  await expect(page.locator('.quick-sheet')).not.toHaveCSS('box-shadow', 'none')
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click()
  const group = page.locator('.settings-group').filter({ hasText: 'Görünüm' })
  await group.locator('summary').click()
  for (const theme of ['Koyu', 'Açık', 'AMOLED', 'Gül Kurusu', 'Sistem']) {
    await group.getByRole('button', { name: theme, exact: true }).click()
    await expect(group).not.toHaveCSS('box-shadow', 'none')
    await expect(page.locator('.prayer-overview')).not.toHaveCSS('box-shadow', 'none')
  }
})


test('tahlil has a check confirmation instead of a counter and resumes correctly', async ({ page }) => {
  await ready(page)
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  const list = page.getByRole('dialog', { name: 'Adım Listesi' })
  const tahlil = list.locator('li').filter({ hasText: 'Tahlil' })
  await expect(tahlil.locator('.step-list-meta')).toBeEmpty()
  await tahlil.getByRole('button').click()
  await expect(page.locator('.g-title')).toHaveText('Tahlil')
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toHaveCount(0)
  await expect(page.locator('.counter-ring')).toHaveCount(0)
  const confirm = page.getByRole('button', { name: 'Okudum — Devam' })
  await expect(confirm).toHaveClass(/done-ring/)
  await expect(confirm.locator('svg path')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.g-title')).toHaveText('Tahlil', { timeout: 15000 })
  await page.getByRole('button', { name: 'Okudum — Devam' }).click()
  await expect(page.locator('.g-title')).toHaveText('Dua')
  await page.getByRole('button', { name: 'Geri', exact: true }).click()
  await expect(page.locator('.g-title')).toHaveText('Tahlil')
  await expect(page.getByRole('button', { name: 'Okudum — Devam' })).toBeVisible()
})


test('closing Fatiha displays the Latin reading without changing the Arabic or meaning', async ({ page }) => {
  await ready(page)
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await page.getByRole('button', { name: 'Adım listesini aç' }).click()
  await page.getByRole('dialog', { name: 'Adım Listesi' }).getByRole('button', { name: /Fâtiha-i Şerîfe/ }).click()
  await expect(page.locator('.quran-text')).toBeVisible()
  await expect(page.locator('.guided-body .latin')).toContainText('Bismillâhirrahmânirrahîm')
  await expect(page.locator('.guided-body .latin')).toContainText('leddâllîn')
  await page.getByRole('button', { name: 'Türkçe Anlamı' }).click()
  await expect(page.locator('.guided-body')).toContainText('Rahman ve Rahim olan Allah')
})
