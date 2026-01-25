import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import packageJson from './package.json';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '');
	const appVersion =
		env.PINGONE_APP_VERSION || env.VITE_APP_VERSION || packageJson.version || '0.0.0-dev';

	return {
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
			},
		},
		plugins: [
			react(),
			basicSsl(), // Re-enable HTTPS for development
			VitePWA({
				registerType: 'autoUpdate',
				devOptions: {
					enabled: false, // Disable service worker in development to prevent caching issues
					type: 'module',
				},
				strategies: 'generateSW',
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (increased from default 2 MB)
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
			https: {}, // Re-enable HTTPS in development
			// In production, Vercel will handle HTTPS
			// In development, basic-ssl plugin provides self-signed certificates
			hmr: {
				port: 3000,
				host: 'localhost',
				protocol: 'wss',
				clientPort: 3000,
			},
			logLevel: 'warn', // Reduce Vite connection logs (suppresses "connecting..." and "connected" messages)
			// Force HTTPS redirect
			setupMiddlewares: (middlewares, devServer) => {
				middlewares.unshift((req, res, next) => {
					if (req.headers['x-forwarded-proto'] === 'http' || req.url.startsWith('http://')) {
						res.writeHead(301, { Location: `https://localhost:3000${req.url}` });
						res.end();
						return;
					}
					next();
				});
				return middlewares;
			},
			proxy: {
				'/api': {
					target: 'http://localhost:3001', // Backend server (HTTP)
					changeOrigin: true,
					secure: false, // Allow self-signed certificates and HTTP backend
					timeout: 3000, // Shorter timeout for health checks
					proxyTimeout: 3000,
					rewrite: (path) => {
						// Map /api/token to /api/token-exchange
						if (path === '/api/token') {
							return '/api/token-exchange';
						}
						return path;
					},
					configure: (proxy, options) => {
						// Add error handling
						proxy.on('error', (err) => {
							console.log('Proxy error:', err.message);
						});

						// Add connection handling
						proxy.on('proxyReq', (proxyReq) => {
							proxyReq.setTimeout(3000);
						});

						proxy.on('proxyRes', (proxyRes) => {
							proxyRes.setTimeout(3000);
						});
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
						// Vendor chunks
						if (id.includes('node_modules')) {
							if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
								return 'react-vendor';
							}
							if (id.includes('styled-components')) {
								return 'styled-vendor';
							}
							if (id.includes('react-icons')) {
								return 'icons-vendor';
							}
							return 'vendor';
						}

						// OAuth flow chunks - group by functionality
						if (id.includes('src/pages/flows/')) {
							return 'oauth-flows';
						}

						// Utility chunks
						if (id.includes('src/utils/')) {
							return 'utils';
						}

						// Component chunks
						if (id.includes('src/components/')) {
							return 'components';
						}
					},
				},
			},
			chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
			target: 'esnext',
			minify: 'terser',
			terserOptions: {
				compress: {
					drop_console: mode === 'production',
					drop_debugger: mode === 'production',
				},
			},
		},
	};
});
