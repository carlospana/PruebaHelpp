import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

const isCI = !!process.env.CI;
const demoFailure = process.env.DEMO_FAILURE === '1';
const port = Number(process.env.APP_PORT ?? 4173);

export default defineConfig({
  testDir: './tests',
  // La demo de fallo controlado solo se carga cuando se pide explícitamente.
  testIgnore: demoFailure ? [] : ['**/demo/**'],
  fullyParallel: true,
  forbidOnly: isCI,
  // Reintentos: 0 en local para no ocultar fallos; 1 en CI únicamente para
  // DETECTAR intermitencia (Playwright marca el caso como "flaky", no como "passed").
  retries: isCI ? 1 : Number(process.env.RETRIES ?? 0),
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: demoFailure ? 'test-results-demo' : 'test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: demoFailure ? 'reports/html-demo-failure' : `reports/html-${env.name}`, open: 'never' }],
    ['json', { outputFile: demoFailure ? 'reports/results-demo-failure.json' : `reports/results-${env.name}.json` }],
    ['junit', { outputFile: demoFailure ? 'reports/junit-demo-failure.xml' : `reports/junit-${env.name}.xml` }],
  ],
  metadata: { ambiente: demoFailure ? `${env.name} (demo fallo controlado)` : env.name, baseURL: env.baseURL, build: env.expectedBuild },
  use: {
    baseURL: env.baseURL,
    headless: process.env.HEADLESS !== 'false',
    testIdAttribute: 'data-testid',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: env.startLocalServer
    ? {
        command: 'node scripts/serve.mjs',
        url: `http://127.0.0.1:${port}/health`,
        reuseExistingServer: !isCI,
        timeout: 15_000,
        env: { APP_PORT: String(port) },
      }
    : undefined,
});
