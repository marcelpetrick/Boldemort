import { defineConfig, devices } from '@playwright/test';

const coverage = process.env.BOLD_COVERAGE === '1';
const baseURL = coverage
  ? 'http://127.0.0.1:4174/Boldemort/'
  : 'http://127.0.0.1:4173/Boldemort/';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  outputDir: coverage ? 'test-results/coverage' : 'test-results/browser',
  webServer: {
    command: 'node scripts/serve.mjs',
    url: baseURL,
    env: { PORT: coverage ? '4174' : '4173' },
    reuseExistingServer: !process.env.CI && !coverage,
  },
});
