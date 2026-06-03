import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts', './tests/backend/setup.js'],
		globals: true,
		// Keep vitest's own unit scope clean: skip the vendored sample app
		// (se-ai-demo-banking-digital-assistant-main) and Playwright e2e specs,
		// which are not part of the oauthPlayground unit suite.
		exclude: [
			...configDefaults.exclude,
			'se-ai-demo-banking-digital-assistant-main/**',
			'e2e/**',
			'tests/e2e/**',
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.stories.{ts,tsx}', '**/index.ts'],
			thresholds: {
				global: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70,
				},
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@components': path.resolve(__dirname, './src/components'),
			'@services': path.resolve(__dirname, './src/services'),
			'@utils': path.resolve(__dirname, './src/utils'),
			'@hooks': path.resolve(__dirname, './src/hooks'),
			'@types': path.resolve(__dirname, './src/types'),
		},
	},
});
