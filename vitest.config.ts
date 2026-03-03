/// <reference types="vitest" />

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@/v8': path.resolve(__dirname, './src/v8'),
			'@/v8/components': path.resolve(__dirname, './src/v8/components'),
			'@/v8/services': path.resolve(__dirname, './src/v8/services'),
			'@/v8/hooks': path.resolve(__dirname, './src/v8/hooks'),
			'@/v8/flows': path.resolve(__dirname, './src/v8/flows'),
			'@/v8/types': path.resolve(__dirname, './src/v8/types'),
			'@/v8/utils': path.resolve(__dirname, './src/v8/utils'),
			'@icons': path.resolve(__dirname, './src/icons/index.ts'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
	},
});
