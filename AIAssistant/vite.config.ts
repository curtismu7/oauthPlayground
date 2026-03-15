import path from 'node:path';
import fs from 'node:fs';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';

/**
 * SPA fallback: serve index.html for client routes (e.g. /, /configuration, /callback) so direct GET doesn't 404.
 */
function spaFallbackPlugin(): Plugin {
	return {
		name: 'spa-fallback',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url ?? '';
				const pathname = url.split('?')[0];
				if (
					req.method === 'GET' &&
					!pathname.startsWith('/api') &&
					!pathname.startsWith('/@') &&
					!pathname.includes('.')
				) {
					req.url = '/index.html';
				}
				next();
			});
		},
	};
}

/**
 * Vite config for the standalone AI Assistant app.
 *
 * Run from the repo root:
 *   npx vite --root AIAssistant --port 3002
 * or via the npm script:
 *   npm run assistant
 *
 * Proxies all /api/* requests to the existing server.js backend (port 3001).
 * The OAuth callback redirect_uri should point to https://api.pingdemo.com:3002/callback.
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	const certPath = process.env.SSL_CERT_PATH;
	const keyPath = process.env.SSL_KEY_PATH;
	const useCustomHttps =
		certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath);
	const httpsOptions = useCustomHttps
		? { key: fs.readFileSync(keyPath!), cert: fs.readFileSync(certPath!) }
		: undefined;

	const backendUrl = env.BACKEND_URL || env.VITE_BACKEND_URL || 'https://localhost:3001';

	return {
		appType: 'spa',
		// Point Vite root at the AIAssistant directory (this file's location)
		root: path.resolve(__dirname),
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		plugins: [
			react(),
			spaFallbackPlugin(),
			...(useCustomHttps ? [] : [basicSsl()]),
		],
		server: {
			port: 3002,
			host: true,
			https: httpsOptions,
			proxy: {
				'/api': {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
					timeout: 30000,
				},
			},
		},
		define: {
			global: 'globalThis',
		},
	};
});
