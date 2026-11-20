import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4188/',
    browserName: 'chromium',
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } } : {}),
  },
  webServer: { command: 'npm run build && npm run preview -- --port 4188', port: 4188, reuseExistingServer: false, timeout: 120000 },
})
