/**
 * @file appDiscoveryServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for AppDiscoveryServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { AppDiscoveryServiceV8, DiscoveredApplication } from '../appDiscoveryServiceV8';
import { workerTokenServiceV8 } from '../workerTokenServiceV8';

describe('AppDiscoveryServiceV8', () => {
	beforeEach(async () => {
		localStorage.clear();
		// Clear worker token service state
		await workerTokenServiceV8.clearCredentials();
		// Setup test credentials (required for storing tokens)
		await workerTokenServiceV8.saveCredentials({
			environmentId: 'test-env-id',
			clientId: 'test-client-id',
			clientSecret: 'test-client-secret',
			scopes: ['api.read'],
		});
	});

	afterEach(async () => {
		localStorage.clear();
		await workerTokenServiceV8.clearCredentials();
	});

	const mockApp: DiscoveredApplication = {
		id: 'app-123',
		name: 'Test Application',
		type: 'WEB_APP',
		enabled: true,
		grantTypes: ['authorization_code', 'refresh_token'],
		responseTypes: ['code'],
		redirectUris: ['http://localhost:3000/callback'],
		tokenEndpointAuthMethod: 'client_secret_post',
		pkceRequired: true,
		accessTokenDuration: 3600,
		refreshTokenDuration: 604800,
		tokenFormat: 'JWT',
	};

	describe('worker token management', () => {
		it('should store and retrieve worker token', async () => {
			const token = 'test-worker-token-xyz';
			await AppDiscoveryServiceV8.storeWorkerToken(token);

			const retrieved = await AppDiscoveryServiceV8.getStoredWorkerToken();

			expect(retrieved).toBe(token);
		});

		it('should return null for non-existent token', async () => {
			const retrieved = await AppDiscoveryServiceV8.getStoredWorkerToken();

			expect(retrieved).toBeNull();
		});

		it('should clear worker token', async () => {
			await AppDiscoveryServiceV8.storeWorkerToken('test-token');
			await AppDiscoveryServiceV8.clearWorkerToken();

			const retrieved = await AppDiscoveryServiceV8.getStoredWorkerToken();

			expect(retrieved).toBeNull();
		});

		it('should validate worker token format', () => {
			expect(AppDiscoveryServiceV8.isValidWorkerToken('short')).toBe(false);
			expect(AppDiscoveryServiceV8.isValidWorkerToken('this-is-a-valid-worker-token-xyz')).toBe(
				true
			);
		});

		it('should get worker token expiry info', async () => {
			await AppDiscoveryServiceV8.storeWorkerToken('test-token');

			const expiryInfo = AppDiscoveryServiceV8.getWorkerTokenExpiryInfo();

			expect(expiryInfo).not.toBeNull();
			expect(expiryInfo?.isExpired).toBe(false);
			expect(expiryInfo?.expiresInHours).toBeGreaterThan(0);
		});

		it('should detect expired token', async () => {
			// Store token with past expiry directly in localStorage (bypassing service for test)
			const tokenInfo = {
				token: 'test-token',
				storedAt: Date.now() - 100000,
				expiresAt: Date.now() - 1000, // Expired 1 second ago
			};
			localStorage.setItem('v8:worker_token', JSON.stringify(tokenInfo));

			const retrieved = await AppDiscoveryServiceV8.getStoredWorkerToken();

			expect(retrieved).toBeNull();
		});
	});

	describe('app configuration', () => {
		it('should get app config for auto-fill', () => {
			const config = AppDiscoveryServiceV8.getAppConfig(mockApp);

			expect(config.clientId).toBe('app-123');
			expect(config.redirectUri).toBe('http://localhost:3000/callback');
			expect(config.grantType).toBe('authorization_code');
			expect(config.responseType).toBe('code');
			expect(config.tokenEndpointAuthMethod).toBe('client_secret_post');
			expect(config.usePkce).toBe(true);
			expect(config.scopes).toContain('openid');
		});

		it('should use first grant type if authorization_code not available', () => {
			const app = { ...mockApp, grantTypes: ['client_credentials'] };
			const config = AppDiscoveryServiceV8.getAppConfig(app);

			expect(config.grantType).toBe('client_credentials');
		});

		it('should use first response type if code not available', () => {
			const app = { ...mockApp, responseTypes: ['token'] };
			const config = AppDiscoveryServiceV8.getAppConfig(app);

			expect(config.responseType).toBe('token');
		});

		it('should use first redirect URI', () => {
			const app = {
				...mockApp,
				redirectUris: ['http://localhost:3000/callback', 'http://localhost:3000/other'],
			};
			const config = AppDiscoveryServiceV8.getAppConfig(app);

			expect(config.redirectUri).toBe('http://localhost:3000/callback');
		});

		it('should set PKCE based on app requirements', () => {
			const appWithPkce = { ...mockApp, pkceRequired: true };
			const configWithPkce = AppDiscoveryServiceV8.getAppConfig(appWithPkce);
			expect(configWithPkce.usePkce).toBe(true);

			const appWithoutPkce = { ...mockApp, pkceRequired: false, pkceEnforced: false };
			const configWithoutPkce = AppDiscoveryServiceV8.getAppConfig(appWithoutPkce);
			expect(configWithoutPkce.usePkce).toBe(false);
		});
	});

	describe('dropdown formatting', () => {
		it('should format applications for dropdown', () => {
			const apps = [mockApp, { ...mockApp, id: 'app-456', name: 'Another App' }];
			const options = AppDiscoveryServiceV8.formatForDropdown(apps);

			expect(options).toHaveLength(2);
			// Apps are sorted alphabetically, so "Another App" comes first
			expect(options[0].label).toBe('Another App');
			expect(options[1].label).toBe('Test Application');
			expect(options[0].description).toContain('WEB_APP');
		});

		it('should filter disabled applications', () => {
			const apps = [mockApp, { ...mockApp, id: 'app-456', enabled: false }];
			const options = AppDiscoveryServiceV8.formatForDropdown(apps);

			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('app-123');
		});

		it('should sort applications by name', () => {
			const apps = [
				{ ...mockApp, id: 'app-1', name: 'Zebra App' },
				{ ...mockApp, id: 'app-2', name: 'Alpha App' },
				{ ...mockApp, id: 'app-3', name: 'Beta App' },
			];
			const options = AppDiscoveryServiceV8.formatForDropdown(apps);

			expect(options[0].label).toBe('Alpha App');
			expect(options[1].label).toBe('Beta App');
			expect(options[2].label).toBe('Zebra App');
		});
	});

	describe('application lookup', () => {
		it('should find application by ID', () => {
			const apps = [mockApp, { ...mockApp, id: 'app-456', name: 'Another App' }];
			const found = AppDiscoveryServiceV8.getApplicationById(apps, 'app-123');

			expect(found).toEqual(mockApp);
		});

		it('should return null for non-existent application', () => {
			const apps = [mockApp];
			const found = AppDiscoveryServiceV8.getApplicationById(apps, 'non-existent');

			expect(found).toBeNull();
		});
	});

	describe('token expiry', () => {
		it('should calculate correct expiry hours', async () => {
			await AppDiscoveryServiceV8.storeWorkerToken('test-token');
			const expiryInfo = AppDiscoveryServiceV8.getWorkerTokenExpiryInfo();

			expect(expiryInfo?.expiresInHours).toBeGreaterThan(20);
			expect(expiryInfo?.expiresInHours).toBeLessThanOrEqual(24);
		});

		it('should return null for non-existent token expiry', () => {
			const expiryInfo = AppDiscoveryServiceV8.getWorkerTokenExpiryInfo();

			expect(expiryInfo).toBeNull();
		});
	});

	describe('app type handling', () => {
		it('should handle different app types', () => {
			const spaApp = { ...mockApp, type: 'SINGLE_PAGE_APP' as const };
			const nativeApp = { ...mockApp, type: 'NATIVE_APP' as const };
			const serviceApp = { ...mockApp, type: 'SERVICE' as const };

			const spaConfig = AppDiscoveryServiceV8.getAppConfig(spaApp);
			const nativeConfig = AppDiscoveryServiceV8.getAppConfig(nativeApp);
			const serviceConfig = AppDiscoveryServiceV8.getAppConfig(serviceApp);

			expect(spaConfig.scopes).toContain('openid');
			expect(nativeConfig.scopes).toContain('openid');
			expect(serviceConfig.scopes).toContain('openid');
		});
	});

	describe('default values', () => {
		it('should provide default values for missing fields', () => {
			const minimalApp: DiscoveredApplication = {
				id: 'app-minimal',
				name: 'Minimal App',
				type: 'WEB_APP',
				enabled: true,
				grantTypes: [],
				responseTypes: [],
				redirectUris: [],
				tokenEndpointAuthMethod: 'none',
			};

			const config = AppDiscoveryServiceV8.getAppConfig(minimalApp);

			expect(config.clientId).toBe('app-minimal');
			expect(config.redirectUri).toBe('');
			expect(config.grantType).toBe('authorization_code');
			expect(config.responseType).toBe('code');
			expect(config.accessTokenDuration).toBe(3600);
			expect(config.refreshTokenDuration).toBe(604800);
		});
	});
});
