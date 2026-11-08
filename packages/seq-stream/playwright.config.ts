import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  grepInvert: process.env.BIOSCRIPT_STRESS ? undefined : /@stress/,
  fullyParallel: true,
  timeout: 120000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['allure-playwright', { outputFolder: 'allure-results' }]],
  use: {
    baseURL: 'http://127.0.0.1:3111',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  webServer: {
    command: `"${process.execPath}" "${require.resolve('http-server/bin/http-server')}" -a 127.0.0.1 -p 3111 -c-1`,
    url: 'http://127.0.0.1:3111/e2e/test-page.html',
    timeout: 120000,
    reuseExistingServer: false,
  },
});
