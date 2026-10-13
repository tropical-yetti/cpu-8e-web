// Testes de ponta a ponta: abrem o site num navegador de verdade.
// SPDX-License-Identifier: GPL-3.0-or-later
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/cpu-8e-web/',
    locale: 'pt-BR',
    // Permite usar um Chromium já instalado (CHROMIUM_PATH) em vez do baixado pelo Playwright.
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] }
      : {},
  },
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/cpu-8e-web/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
