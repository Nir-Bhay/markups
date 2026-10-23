import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT || 4173);
const HOST = '127.0.0.1';
const baseURL = `http://${HOST}:${PORT}`;
const builtPreview = process.env.PLAYWRIGHT_BUILT === '1';
const entryLabel = process.env.MARKUPS_ENTRY === 'modular' ? 'modular' : 'production';

export default defineConfig({
    testDir: './tests/e2e',
    // These two white-box regressions import /src and must run on Vite dev.
    // CI runs them separately; built-output checks must never expose source files.
    testIgnore: [
        ...(builtPreview ? ['**/image-ir-update.spec.js', '**/video-customize.spec.js'] : []),
        ...(entryLabel === 'production' ? ['**/modular-smoke.spec.js'] : [])
    ],
    timeout: 60_000,
    expect: {
        timeout: 8_000
    },
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : [['list']],
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    webServer: {
        command: `${builtPreview ? 'vite preview' : 'vite'} --host ${HOST} --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI && !builtPreview,
        timeout: 60_000,
        env: {
            ...process.env,
            MARKUPS_ENTRY: process.env.MARKUPS_ENTRY || ''
        }
    },
    projects: [
        {
            name: `chromium-${entryLabel}`,
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
