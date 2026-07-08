import { defineConfig, devices } from '@playwright/test';

/** Local E2E against an already-running `npm run start` stack (frontend :8000). */
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	retries: 0,
	workers: 2,
	timeout: 90000,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'https://localhost:8000',
		ignoreHTTPSErrors: true,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
