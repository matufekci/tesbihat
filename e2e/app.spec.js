import { test, expect } from '@playwright/test'

async function ready(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('tesbihat.settings')) localStorage.setItem('tesbihat.settings', JSON.stringify({ onboarded: true, permissionsSetup: true }))
  })
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.splash')).toHaveCount(0, { timeout: 15000 })
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
  await expect(page.getByRole('button', { name: 'Tesbihata Başla' })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await expect(page.getByRole('button', { name: 'Adım listesini aç' })).toContainText('3/')
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
  await page.getByRole('button', { name: 'Tesbihata Başla' }).click()
  await expect(page.getByRole('button', { name: 'Say', exact: true })).toContainText('1')
})

test('first launch works on a compact screen and language switches to RTL', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('./')
  await expect(page.getByText('Başlamadan önce')).toBeVisible()
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
  await page.goto('./')
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
  await page.goto('./')
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
  for (let i = 1; i < 5; i++) await groups.nth(i).locator('summary').click()
  await expect(page.getByRole('button', { name: /^(Test et|Önizle)$/ })).toHaveCount(0)
  await expect(page.locator('#reminder')).toBeVisible()
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
