import path from 'node:path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import packageJson from './package.json';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '');
	const appVersion =
		env.PINGONE_APP_VERSION || env.VITE_APP_VERSION || packageJson.version || '0.0.0-dev';

	// ALWAYS USE api.pingdemo.com - Override any localhost configuration
	const forcedDomain = 'https://api.pingdemo.com';

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
			__PINGONE_REDIRECT_URI__: JSON.stringify(`${forcedDomain}/authz-callback`),
			__PINGONE_LOGOUT_REDIRECT_URI__: JSON.stringify(forcedDomain),
			__PINGONE_API_URL__: JSON.stringify(env.PINGONE_API_URL || forcedDomain),
			__PINGONE_APP_TITLE__: JSON.stringify(env.PINGONE_APP_TITLE),
			__PINGONE_APP_DESCRIPTION__: JSON.stringify(env.PINGONE_APP_DESCRIPTION),
			__PINGONE_APP_VERSION__: JSON.stringify(appVersion),
			__PINGONE_APP_DEFAULT_THEME__: JSON.stringify(env.PINGONE_APP_DEFAULT_THEME),
			__PINGONE_DEV_SERVER_PORT__: JSON.stringify(env.PINGONE_DEV_SERVER_PORT),
			__PINGONE_DEV_SERVER_HTTPS__: JSON.stringify(env.PINGONE_DEV_SERVER_HTTPS),
			__PINGONE_FEATURE_DEBUG_MODE__: JSON.stringify(env.PINGONE_FEATURE_DEBUG_MODE),
			__PINGONE_FEATURE_ANALYTICS__: JSON.stringify(env.PINGONE_FEATURE_ANALYTICS),
			// VITE-prefixed environment variables (standard Vite convention)
			VITE_PINGONE_ENVIRONMENT_ID: JSON.stringify(env.PINGONE_ENVIRONMENT_ID),
			VITE_PINGONE_CLIENT_ID: JSON.stringify(env.PINGONE_CLIENT_ID),
			VITE_PINGONE_CLIENT_SECRET: JSON.stringify(env.PINGONE_CLIENT_SECRET),
			VITE_PINGONE_REDIRECT_URI: JSON.stringify(`${forcedDomain}/protect-portal-callback`),
			VITE_PINGONE_LOGOUT_REDIRECT_URI: JSON.stringify(forcedDomain),
			VITE_PINGONE_API_URL: JSON.stringify(env.PINGONE_API_URL || forcedDomain),
			VITE_PINGONE_APP_TITLE: JSON.stringify(env.PINGONE_APP_TITLE),
			VITE_PINGONE_APP_DESCRIPTION: JSON.stringify(env.PINGONE_APP_DESCRIPTION),
			VITE_PINGONE_APP_VERSION: JSON.stringify(appVersion),
			VITE_PINGONE_APP_DEFAULT_THEME: JSON.stringify(env.PINGONE_APP_DEFAULT_THEME),
			VITE_PINGONE_DEV_SERVER_PORT: JSON.stringify(env.PINGONE_DEV_SERVER_PORT),
			VITE_PINGONE_DEV_SERVER_HTTPS__: JSON.stringify(env.PINGONE_DEV_SERVER_HTTPS),
			VITE_PINGONE_FEATURE_DEBUG_MODE: JSON.stringify(env.PINGONE_FEATURE_DEBUG_MODE),
			VITE_PINGONE_FEATURE_ANALYTICS: JSON.stringify(env.PINGONE_FEATURE_ANALYTICS),
			// Domain configuration - ALWAYS USE api.pingdemo.com
			__PINGONE_APP_DOMAIN__: JSON.stringify(forcedDomain),
			VITE_APP_DOMAIN: JSON.stringify(forcedDomain),
			VITE_BACKEND_URL: JSON.stringify(`${forcedDomain}:3001`),
			VITE_FRONTEND_URL: JSON.stringify(`${forcedDomain}:3000`),
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
			basicSsl(), // HTTPS for development with custom domain
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
			// https: true, // Remove this - basicSsl plugin handles HTTPS
			// In production, Vercel will handle HTTPS
			hmr: {
				port: 3000,
				host: 'localhost', // Use localhost for HMR to avoid WebSocket issues
				protocol: 'wss', // Use secure WebSocket for HTTPS
				clientPort: 3000,
			},
			logLevel: 'warn', // Reduce Vite connection logs (suppresses "connecting..." and "connected" messages)
			// Disable certificate verification for localhost development
			host: '0.0.0.0', // Bind to all interfaces
			proxy: {
				'/api': {
					target: 'https://api.pingdemo.com:3001', // Backend server (HTTPS)
					changeOrigin: true,
					secure: false, // Allow self-signed certificates and HTTPS->HTTPS proxy
					timeout: 10000, // Increased timeout for health checks
					proxyTimeout: 10000,
					rewrite: (path) => {
						// Map /api/token to /api/token-exchange
						if (path === '/api/token') {
							return '/api/token-exchange';
						}
						return path;
					},
					configure: (proxy) => {
						// Add error handling
						proxy.on('error', (err) => {
							console.log('Proxy error:', err.message);
						});

						// Add connection handling
						proxy.on('proxyReq', (proxyReq) => {
							proxyReq.setTimeout(10000);
						});

						proxy.on('proxyRes', (proxyRes) => {
							proxyRes.setTimeout(10000);
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
						const normalizedId = id.replace(/\\/g, '/');
						const lowerId = normalizedId.toLowerCase();
						// Vendor chunks
						if (normalizedId.includes('node_modules')) {
							if (
								normalizedId.includes('react') ||
								normalizedId.includes('react-dom') ||
								normalizedId.includes('react-router')
							) {
								return 'react-vendor';
							}
							if (normalizedId.includes('styled-components')) {
								return 'styled-vendor';
							}
							if (normalizedId.includes('react-icons')) {
								return 'icons-vendor';
							}
							return 'vendor';
						}

						// OAuth flow chunks - group by functionality
						if (lowerId.includes('/src/pages/flows/')) {
							if (
								lowerId.includes('authorizationcode') ||
								lowerId.includes('authcode') ||
								lowerId.includes('pkce') ||
								lowerId.includes('hybrid')
							) {
								return 'oauth-flows-authcode';
							}
							if (lowerId.includes('implicit')) {
								return 'oauth-flows-implicit';
							}
							if (lowerId.includes('device') || lowerId.includes('ciba')) {
								return 'oauth-flows-device';
							}
							if (lowerId.includes('token') || lowerId.includes('ropc')) {
								return 'oauth-flows-token';
							}
							if (lowerId.includes('par') || lowerId.includes('rar')) {
								return 'oauth-flows-par';
							}
							if (lowerId.includes('jwt') || lowerId.includes('saml')) {
								return 'oauth-flows-jwt';
							}
							if (lowerId.includes('userinfo') || lowerId.includes('user-info')) {
								return 'oauth-flows-userinfo';
							}
							return 'oauth-flows';
						}

						// V8/V8U flows
						if (lowerId.includes('/src/v8/flows/')) {
							return 'v8-flows';
						}
						if (lowerId.includes('/src/v8u/flows/')) {
							return 'v8u-flows';
						}

						// V8/V8U components
						if (lowerId.includes('/src/v8/components/')) {
							return 'v8-components';
						}
						if (lowerId.includes('/src/v8u/components/')) {
							return 'v8u-components';
						}

						// Services and hooks
						if (lowerId.includes('/src/v8/services/')) {
							return 'v8-services';
						}
						if (lowerId.includes('/src/v8u/services/')) {
							return 'v8u-services';
						}
						if (lowerId.includes('/src/v8/hooks/')) {
							return 'v8-hooks';
						}

						// Utility chunks
						if (lowerId.includes('/src/utils/')) {
							return 'utils';
						}
						if (lowerId.includes('/src/v8/utils/')) {
							return 'v8-utils';
						}

						// Page and component chunks
						if (lowerId.includes('/src/pages/test/')) {
							return 'pages-test';
						}
						if (lowerId.includes('/src/pages/docs/')) {
							return 'pages-docs';
						}
						if (lowerId.includes('/src/pages/user-guides/')) {
							return 'pages-guides';
						}
						if (lowerId.includes('/src/pages/learn/')) {
							return 'pages-learn';
						}
						if (lowerId.includes('/src/pages/security/')) {
							return 'pages-security';
						}
						if (lowerId.includes('/src/pages/ai')) {
							return 'pages-ai';
						}
						if (lowerId.includes('/src/pages/pingone')) {
							return 'pages-pingone';
						}
						if (lowerId.includes('/src/pages/oauth') || lowerId.includes('/src/pages/oidc')) {
							return 'pages-oauth';
						}
						if (
							lowerId.includes('/src/pages/token') ||
							lowerId.includes('/src/pages/jwt') ||
							lowerId.includes('/src/pages/jwks')
						) {
							return 'pages-token';
						}
						if (lowerId.includes('/src/pages/')) {
							return 'pages';
						}
						if (lowerId.includes('/src/components/device/')) {
							return 'components-device';
						}
						if (lowerId.includes('/src/components/flow/')) {
							return 'components-flow';
						}
						if (lowerId.includes('/src/components/mfa/')) {
							return 'components-mfa';
						}
						if (lowerId.includes('/src/components/token/')) {
							return 'components-token';
						}
						if (lowerId.includes('/src/components/worker/')) {
							return 'components-worker';
						}
						if (lowerId.includes('/src/components/sidebar/')) {
							return 'components-sidebar';
						}
						if (lowerId.includes('/src/components/layout/')) {
							return 'components-layout';
						}
						if (lowerId.includes('/src/components/ui/')) {
							return 'components-ui';
						}
						if (lowerId.includes('/src/components/display/')) {
							return 'components-display';
						}
						if (lowerId.includes('/src/components/password-reset/')) {
							return 'components-password-reset';
						}
						if (lowerId.includes('/src/components/steps/')) {
							return 'components-steps';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('credential') ||
								lowerId.includes('credentials') ||
								lowerId.includes('config'))
						) {
							return 'components-credentials';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('flow') || lowerId.includes('sequence') || lowerId.includes('step'))
						) {
							return 'components-flow-core';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('authorize') || lowerId.includes('authorization'))
						) {
							return 'components-oauth-authorize';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('par') || lowerId.includes('rar'))
						) {
							return 'components-oauth-par';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('token') || lowerId.includes('jwt') || lowerId.includes('jwks'))
						) {
							return 'components-token';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('client') || lowerId.includes('config'))
						) {
							return 'components-oauth-client';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('discovery') || lowerId.includes('metadata'))
						) {
							return 'components-oauth-discovery';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('oauth') || lowerId.includes('oidc'))
						) {
							return 'components-oauth';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('token') || lowerId.includes('jwt') || lowerId.includes('jwks'))
						) {
							return 'components-token';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('pingone') || lowerId.includes('mfa') || lowerId.includes('worker'))
						) {
							return 'components-pingone';
						}
						if (
							lowerId.includes('/src/components/') &&
							(lowerId.includes('security') ||
								lowerId.includes('audit') ||
								lowerId.includes('analytics'))
						) {
							return 'components-security';
						}
						if (lowerId.includes('/src/components/')) {
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
