import fs from 'node:fs';
import path from 'node:path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import packageJson from './package.json';

/** SPA fallback: serve index.html for client routes (e.g. /api-status) so direct GET doesn't 404. */
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
					!pathname.startsWith('/pingone-auth') &&
					!pathname.startsWith('/pingone-api') &&
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

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '');
	// Use custom domain cert from run.sh/run-config-ssl.js when set (SSL_CERT_PATH / SSL_KEY_PATH)
	const certPath = process.env.SSL_CERT_PATH;
	const keyPath = process.env.SSL_KEY_PATH;
	const useCustomHttps = certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath);
	const httpsOptions = useCustomHttps
		? { key: fs.readFileSync(keyPath!), cert: fs.readFileSync(certPath!) }
		: undefined;

	const appVersion =
		env.PINGONE_APP_VERSION || env.VITE_APP_VERSION || packageJson.version || '0.0.0-dev';

	return {
		appType: 'spa',
		define: {
			// Polyfill for global object in browser environment
			global: 'globalThis',
			// Ensure React is available globally for vendor bundles
			// Use simple string literals that Vite can handle
			React: 'window.React',
			__PINGONE_ENVIRONMENT_ID__: JSON.stringify(env.PINGONE_ENVIRONMENT_ID),
			__PINGONE_CLIENT_ID__: JSON.stringify(env.PINGONE_CLIENT_ID),
			__PINGONE_CLIENT_SECRET__: JSON.stringify(env.PINGONE_CLIENT_SECRET),
			__PINGONE_REDIRECT_URI__: JSON.stringify(env.PINGONE_REDIRECT_URI),
			__PINGONE_LOGOUT_REDIRECT_URI__: JSON.stringify(env.PINGONE_LOGOUT_REDIRECT_URI),
			__PINGONE_API_URL__: JSON.stringify(env.PINGONE_API_URL),
			__PINGONE_APP_TITLE__: JSON.stringify(env.PINGONE_APP_TITLE),
			__PINGONE_APP_DESCRIPTION__: JSON.stringify(env.PINGONE_APP_DESCRIPTION),
			__PINGONE_APP_VERSION__: JSON.stringify(appVersion),
			__PINGONE_APP_DEFAULT_THEME__: JSON.stringify(env.PINGONE_APP_DEFAULT_THEME),
			__PINGONE_DEV_SERVER_PORT__: JSON.stringify(env.PINGONE_DEV_SERVER_PORT),
			__PINGONE_DEV_SERVER_HTTPS__: JSON.stringify(env.PINGONE_DEV_SERVER_HTTPS),
			__PINGONE_FEATURE_DEBUG_MODE__: JSON.stringify(env.PINGONE_FEATURE_DEBUG_MODE),
			__PINGONE_FEATURE_ANALYTICS__: JSON.stringify(env.PINGONE_FEATURE_ANALYTICS),
		},
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
		plugins: [
			react(),
			spaFallbackPlugin(),
			// Custom cert (SSL_CERT_PATH/SSL_KEY_PATH) when set by run.sh; else basicSsl for dev HTTPS
			...(useCustomHttps ? [] : [basicSsl()]),
			VitePWA({
				registerType: 'autoUpdate',
				devOptions: {
					enabled: false, // Disable service worker in development to prevent caching issues
					type: 'module',
				},
				strategies: 'generateSW',
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
					maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB (increased to handle current bundle size)
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/api\./,
							handler: 'NetworkFirst',
							options: {
								cacheName: 'api-cache',
								expiration: {
									maxEntries: 100,
									maxAgeSeconds: 60 * 60 * 24, // 24 hours
								},
							},
						},
						{
							urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
							handler: 'CacheFirst',
							options: {
								cacheName: 'images-cache',
								expiration: {
									maxEntries: 100,
									maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
								},
							},
						},
					],
					// Skip waiting for service worker to avoid 401 errors
					skipWaiting: true,
					clientsClaim: true,
					// Don't cache the manifest to avoid 401 errors
					navigateFallback: null,
					navigateFallbackAllowlist: [/^\/$/],
				},
				manifest: {
					name: 'OAuth Playground',
					short_name: 'OAuth Playground',
					description: 'Interactive playground for OAuth 2.0 and OpenID Connect',
					theme_color: '#3b82f6',
					background_color: '#ffffff',
					display: 'standalone',
					start_url: '/',
					scope: '/',
					icons: [
						{
							src: '/favicon.ico',
							sizes: 'any',
							type: 'image/x-icon',
						},
					],
				},
				// Add injectManifest configuration to handle manifest properly
				injectManifest: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				},
			}),
		],
		server: {
			port: 3000,
			open: true,
			// Use custom cert (run-config-ssl) when SSL_CERT_PATH/SSL_KEY_PATH set; else basicSsl plugin
			...(httpsOptions && { https: httpsOptions }),
			// In production, Vercel will handle HTTPS
			// With custom domain + self-signed cert, browser often rejects wss:// so HMR fails.
			// Disable HMR when VITE_HMR_HOST is set OR when using a custom HTTPS cert (custom domain)
			// to avoid "WebSocket connection to wss://api.pingdemo.com:3000 failed" console errors.
			// The app works fine without HMR; hot reload only available on localhost without custom cert.
			hmr:
				env.VITE_HMR_HOST || httpsOptions
					? false
					: { port: 3000, host: 'localhost', clientPort: 3000 },
			logLevel: 'warn', // Reduce Vite connection logs (suppresses "connecting..." and "connected" messages)
			// Disable certificate verification for localhost development
			proxy: {
				'/api': {
					target: 'http://localhost:3001', // Backend server (HTTP) - changed from HTTPS
					changeOrigin: true,
					secure: false, // Allow self-signed certificates and HTTP->HTTP proxy
					timeout: 30000, // Long enough for /api/environments (PingOne upstream can be slow)
					proxyTimeout: 30000,
					rewrite: (path) => {
						// Map /api/token to /api/token-exchange
						if (path === '/api/token') {
							return '/api/token-exchange';
						}
						return path;
					},
					configure: (proxy, _options) => {
						// Add error handling
						proxy.on('error', (err) => {
							console.log('Proxy error:', err.message);
						});

						// Add connection handling
						proxy.on('proxyReq', (proxyReq) => {
							proxyReq.setTimeout(30000);
						});

						proxy.on('proxyRes', (proxyRes) => {
							proxyRes.setTimeout(30000);
						});
					},
					// Add bypass for when backend is down
					bypass: function (req, res, _proxyOptions) {
						// Return mock response for health checks when backend is down
						if (req.url === '/api/health') {
							res.writeHead(200, { 'Content-Type': 'application/json' });
							res.end(
								JSON.stringify({
									status: 'ok',
									backend: 'mock',
									message: 'Backend server not running - using mock response',
								})
							);
							return false;
						}
						return null;
					},
				},
				// Proxy for PingOne Auth APIs to avoid CORS issues
				'/pingone-auth': {
					target: 'https://auth.pingone.com',
					changeOrigin: true,
					secure: true,
					timeout: 10000,
					proxyTimeout: 10000,
					rewrite: (path) => {
						// Remove /pingone-auth prefix and forward to actual PingOne endpoint
						return path.replace(/^\/pingone-auth/, '');
					},
					configure: (proxy) => {
						proxy.on('error', (err) => {
							console.log('PingOne Auth proxy error:', err.message);
						});
					},
				},
				// Proxy for PingOne API to avoid CORS issues
				'/pingone-api': {
					target: 'https://api.pingone.com',
					changeOrigin: true,
					secure: true,
					timeout: 10000,
					proxyTimeout: 10000,
					rewrite: (path) => {
						// Remove /pingone-api prefix and forward to actual PingOne API endpoint
						return path.replace(/^\/pingone-api/, '');
					},
					configure: (proxy) => {
						proxy.on('error', (err) => {
							console.log('PingOne API proxy error:', err.message);
						});
					},
				},
			},
		},
		build: {
			outDir: 'dist',
			sourcemap: true,
			rollupOptions: {
				output: {
					manualChunks: (id) => {
						const normalizedId = id.replace(/\\/g, '/');

						// Simple vendor separation only
						if (normalizedId.includes('node_modules')) {
							if (normalizedId.includes('react') || normalizedId.includes('react-dom')) {
								return 'react';
							}
							if (normalizedId.includes('react-router')) {
								return 'router';
							}
							if (normalizedId.includes('styled-components')) {
								return 'styled';
							}
							return 'vendor';
						}

						// No other chunking to avoid circular dependencies
						// Let Vite handle natural chunking
						return undefined;
					},
				},
			},
			chunkSizeWarningLimit: 500, // Reduce to 500KB to encourage smaller chunks
			target: 'esnext',
			minify: 'terser',
			terserOptions: {
				compress: {
					drop_console: mode === 'production',
					drop_debugger: mode === 'production',
					// Additional optimizations
					pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
				},
				mangle: {
					safari10: true,
				},
			},
			// Enable CSS code splitting
			cssCodeSplit: true,
		},
	};
});
