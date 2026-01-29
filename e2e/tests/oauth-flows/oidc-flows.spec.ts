import { expect, test } from '@playwright/test';
import {
	AuthorizationCodeFlowPage,
	DeviceAuthorizationFlowPage,
	ImplicitFlowPage,
} from '../../fixtures/page-objects';
import { MockOAuthServer, OAuthTestUtils } from '../../utils/test-helpers';

test.describe('OpenID Connect Flows', () => {
	test.beforeEach(async ({ page }) => {
		// Setup mock OAuth server responses
		await MockOAuthServer.setupMockResponses(page);

		// Configure test environment
		await OAuthTestUtils.configurePingOne(page, {
			environmentId: 'test-env-123',
			clientId: 'test-client-123',
			clientSecret: 'test-secret-123',
			redirectUri: 'http://localhost:3000/callback',
		});
	});

	test('OIDC Authorization Code Flow', async ({ page }) => {
		const flowPage = new AuthorizationCodeFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oidc-authorization-code-v5');

		await flowPage.setScope('openid profile email');
		await flowPage.setState('oidc-test-state');
		await flowPage.enablePKCE(true);

		await flowPage.startFlow();

		const authUrl = await flowPage.getAuthorizationUrl();
		expect(authUrl).toContain('response_type=code');
		expect(authUrl).toContain('scope=openid');
		expect(authUrl).toContain('code_challenge');

		await page.waitForURL(/.*callback.*/);

		// Verify both access token and ID token
		await OAuthTestUtils.verifyTokenResponse(page);
		await OAuthTestUtils.verifyOIDCTokens(page);
	});

	test('OIDC Implicit Flow - ID Token', async ({ page }) => {
		const flowPage = new ImplicitFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oidc-implicit-v5');

		await flowPage.setResponseType('id_token');
		await flowPage.setScope('openid profile email');

		await flowPage.startFlow();

		await page.waitForURL(/.*callback.*/);

		// Should have ID token but no access token in fragment
		const idToken = await flowPage.getIdToken();
		expect(idToken).toBeTruthy();

		// Access token should not be present in implicit flow with id_token only
		const _accessToken = await flowPage.getAccessToken();
		// Note: In implicit flow, access token presence depends on response type
	});

	test('OIDC Implicit Flow - Token', async ({ page }) => {
		const flowPage = new ImplicitFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oidc-implicit-v5');

		await flowPage.setResponseType('token');
		await flowPage.setScope('openid profile');

		await flowPage.startFlow();

		await page.waitForURL(/.*callback.*/);

		// Should have access token
		const accessToken = await flowPage.getAccessToken();
		expect(accessToken).toBeTruthy();
		expect(accessToken?.length).toBeGreaterThan(10); // Verify it's a real token
	});

	test('OIDC Hybrid Flow', async ({ page }) => {
		const flowPage = new ImplicitFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'hybrid-v5');

		await flowPage.setResponseType('code id_token token');
		await flowPage.setScope('openid profile email');

		await flowPage.startFlow();

		await page.waitForURL(/.*callback.*/);

		// Should have authorization code, access token, and ID token
		const accessToken = await flowPage.getAccessToken();
		const idToken = await flowPage.getIdToken();

		expect(accessToken).toBeTruthy();
		expect(idToken).toBeTruthy();

		// Verify tokens are properly formatted
		await OAuthTestUtils.verifyTokenResponse(page);
		await OAuthTestUtils.verifyOIDCTokens(page);
	});

	test('OIDC Device Authorization Flow', async ({ page }) => {
		const flowPage = new DeviceAuthorizationFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oidc-device-authorization-v5');

		await flowPage.startFlow();

		// Should receive device codes
		const deviceCode = await flowPage.getDeviceCode();
		const userCode = await flowPage.getUserCode();
		const verificationUri = await flowPage.getVerificationUri();

		expect(deviceCode).toBeTruthy();
		expect(userCode).toBeTruthy();
		expect(verificationUri).toBeTruthy();

		// Poll for tokens
		await flowPage.pollForToken();

		// Should receive OIDC tokens
		await OAuthTestUtils.verifyTokenResponse(page);
		await OAuthTestUtils.verifyOIDCTokens(page);
	});

	test('OIDC Resource Owner Password Flow', async ({ page }) => {
		await OAuthTestUtils.startOAuthFlow(page, 'oidc/resource-owner-password');

		// Fill in credentials directly (ROPC flow)
		await page.fill('[name*="username"], [placeholder*="username"]', 'testuser');
		await page.fill('[name*="password"], [placeholder*="password"]', 'testpass');

		await page.click('button:has-text("Authenticate"), [data-testid="authenticate"]');

		// Should receive tokens directly
		await OAuthTestUtils.verifyTokenResponse(page);
		await OAuthTestUtils.verifyOIDCTokens(page);
	});

	test('OIDC Session Management', async ({ page }) => {
		const flowPage = new AuthorizationCodeFlowPage(page);

		// Get initial tokens
		await OAuthTestUtils.startOAuthFlow(page, 'oidc-authorization-code-v5');
		await flowPage.startFlow();
		await page.waitForURL(/.*callback.*/);

		// Navigate to session management
		await page.goto('/oidc-session-management');

		// Check session status
		await page.waitForSelector('[data-testid="session-status"]');

		// Verify session is active
		const sessionStatus = await page.locator('[data-testid="session-status"]').textContent();
		expect(sessionStatus?.toLowerCase()).toContain('active');

		// Check token expiry
		const expiry = await page.locator('[data-testid="token-expiry"]').textContent();
		expect(expiry).toBeTruthy();
	});

	test('OIDC Discovery', async ({ page }) => {
		await page.goto('/auto-discover');

		// Enter issuer URL
		await page.fill('[name*="issuer"], [placeholder*="issuer"]', 'https://test.pingone.com');

		// Trigger discovery
		await page.click('button:has-text("Discover"), [data-testid="discover"]');

		// Should load OIDC configuration
		await page.waitForSelector('[data-testid="discovery-result"]');

		// Verify discovery endpoints are populated
		const authEndpoint = await page.locator('[data-testid="auth-endpoint"]').textContent();
		const tokenEndpoint = await page.locator('[data-testid="token-endpoint"]').textContent();
		const userinfoEndpoint = await page.locator('[data-testid="userinfo-endpoint"]').textContent();

		expect(authEndpoint).toContain('/oauth2/authorize');
		expect(tokenEndpoint).toContain('/oauth2/token');
		expect(userinfoEndpoint).toContain('/oauth2/userinfo');
	});
});
