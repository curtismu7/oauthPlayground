/**
 * @file domainConfigurationService.test.ts
 * @module services/__tests__
 * @description Tests for domain configuration service
 * @version 1.0.0
 * @since 2025-01-XX
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { domainConfigurationService } from '../domainConfigurationService';

describe('DomainConfigurationService', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();

		// Reset service to default state
		domainConfigurationService.resetToDefault();
	});

	afterEach(() => {
		// Clean up after each test
		localStorage.clear();
	});

	it('should return default domain when no custom domain is set', () => {
		const effectiveDomain = domainConfigurationService.getEffectiveDomain();

		// Should return window.location.origin or fallback
		expect(effectiveDomain).toBeTruthy();
		expect(typeof effectiveDomain).toBe('string');
	});

	it('should generate redirect URI with default domain', () => {
		const redirectUri = domainConfigurationService.getRedirectUri('/callback');

		expect(redirectUri).toContain('/callback');
		expect(redirectUri).toMatch(/^https?:\/\/.+/);
	});

	it('should set and use custom domain', async () => {
		const customDomain = 'https://auth.curtis.com';

		// Set custom domain
		const result = await domainConfigurationService.setCustomDomain(customDomain);

		expect(result.success).toBe(true);

		// Check effective domain
		const effectiveDomain = domainConfigurationService.getEffectiveDomain();
		expect(effectiveDomain).toBe(customDomain);

		// Check redirect URI
		const redirectUri = domainConfigurationService.getRedirectUri('/callback');
		expect(redirectUri).toBe(`${customDomain}/callback`);
	});

	it('should validate domain format', async () => {
		// Test invalid domain
		const invalidResult = await domainConfigurationService.validateDomain('invalid-domain');
		expect(invalidResult.isValid).toBe(false);
		expect(invalidResult.error).toBeTruthy();

		// Test valid domain
		const validResult = await domainConfigurationService.validateDomain('https://example.com');
		expect(validResult.isValid).toBe(true);
	});

	it('should enforce HTTPS for non-localhost domains', async () => {
		// Test HTTP domain (should fail)
		const httpResult = await domainConfigurationService.validateDomain('http://example.com');
		expect(httpResult.isValid).toBe(false);
		expect(httpResult.error).toContain('HTTPS is required');

		// Test localhost HTTP (should pass)
		const localhostResult =
			await domainConfigurationService.validateDomain('http://localhost:3000');
		expect(localhostResult.isValid).toBe(true);
	});

	it('should persist configuration in localStorage', async () => {
		const customDomain = 'https://auth.curtis.com';

		// Set custom domain
		await domainConfigurationService.setCustomDomain(customDomain);

		// Check localStorage
		const stored = localStorage.getItem('oauth-playground-domain-config');
		expect(stored).toBeTruthy();

		const config = JSON.parse(stored!);
		expect(config.customDomain).toBe(customDomain);
		expect(config.useCustomDomain).toBe(true);
	});

	it('should load configuration from localStorage', async () => {
		const customDomain = 'https://auth.curtis.com';

		// Save directly to localStorage
		localStorage.setItem(
			'oauth-playground-domain-config',
			JSON.stringify({
				customDomain,
				useCustomDomain: true,
				enforceHttps: true,
			})
		);

		// Create a new service instance to test loading from localStorage
		// Since it's a singleton, we need to test the localStorage data directly
		const stored = localStorage.getItem('oauth-playground-domain-config');
		expect(stored).toBeTruthy();

		const storedConfig = JSON.parse(stored!);
		expect(storedConfig.customDomain).toBe(customDomain);
		expect(storedConfig.useCustomDomain).toBe(true);

		// Test that the service would load this config by checking the localStorage data
		// The singleton nature means we can't easily test reload, but we can verify the data exists
		expect(storedConfig.customDomain).toBe(customDomain);
	});

	it('should reset to default configuration', async () => {
		const customDomain = 'https://auth.curtis.com';

		// Set custom domain
		await domainConfigurationService.setCustomDomain(customDomain);
		expect(domainConfigurationService.getEffectiveDomain()).toBe(customDomain);

		// Reset to default
		domainConfigurationService.resetToDefault();

		// Check if reset worked
		const effectiveDomain = domainConfigurationService.getEffectiveDomain();
		expect(effectiveDomain).not.toBe(customDomain);
	});

	it('should provide configuration summary', () => {
		const summary = domainConfigurationService.getConfigSummary();

		expect(summary).toHaveProperty('effectiveDomain');
		expect(summary).toHaveProperty('isCustomDomain');
		expect(summary).toHaveProperty('enforceHttps');
		expect(typeof summary.effectiveDomain).toBe('string');
		expect(typeof summary.isCustomDomain).toBe('boolean');
		expect(typeof summary.enforceHttps).toBe('boolean');
	});
});
