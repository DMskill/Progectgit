import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests-e2e',
    timeout: 30_000,
    retries: 0,
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3100',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    reporter: [['list']],
    webServer: {
        command: 'cross-env NEXT_PUBLIC_E2E=1 npm run dev -- -p 3100',
        url: 'http://localhost:3100',
        reuseExistingServer: true,
        timeout: 120_000,
    },
}); 