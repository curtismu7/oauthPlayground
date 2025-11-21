import { expect, test } from '@playwright/test';
import {
	AuthorizationCodeFlowPage,
	ClientCredentialsFlowPage,
	DeviceAuthorizationFlowPage,
	ImplicitFlowPage,
} from '../../fixtures/page-objects';
import { MockOAuthServer, OAuthTestUtils } from '../../utils/test-helpers';

test.describe('OAuth 2.0 Flows', () => {
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

	test('Authorization Code Flow - Complete flow with PKCE', async ({ page }) => {
		const flowPage = new AuthorizationCodeFlowPage(page);

		// Navigate to Authorization Code flow
		await OAuthTestUtils.startOAuthFlow(page, 'oauth-authorization-code-v5');

		// Configure flow parameters
		await flowPage.setScope('openid profile email');
		await flowPage.setState('test-state-123');
		await flowPage.enablePKCE(true);

		// Start the flow
		await flowPage.startFlow();

		// Verify authorization URL is generated
		const authUrl = await flowPage.getAuthorizationUrl();
		expect(authUrl).toContain('response_type=code');
		expect(authUrl).toContain('code_challenge');

		// Complete the authorization (mock)
		await page.waitForURL(/.*callback.*/, { timeout: 10000 });

		// Verify tokens are received
		await OAuthTestUtils.verifyTokenResponse(page);
		await OAuthTestUtils.verifyOIDCTokens(page);
	});

	test('Authorization Code Flow - Without PKCE', async ({ page }) => {
		const flowPage = new AuthorizationCodeFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oauth-authorization-code-v5');

		await flowPage.setScope('openid profile');
		await flowPage.setState('test-state-456');
		await flowPage.enablePKCE(false);

		await flowPage.startFlow();

		const authUrl = await flowPage.getAuthorizationUrl();
		expect(authUrl).toContain('response_type=code');
		expect(authUrl).not.toContain('code_challenge');

		await page.waitForURL(/.*callback.*/);
		await OAuthTestUtils.verifyTokenResponse(page);
	});

	test('Implicit Flow - ID Token only', async ({ page }) => {
		const flowPage = new ImplicitFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oidc-implicit-v5');

		await flowPage.setResponseType('id_token');
		await flowPage.setScope('openid profile');

		await flowPage.startFlow();

		// Implicit flow redirects immediately with token in URL fragment
		await page.waitForURL(/.*callback.*/);

		// Verify ID token is present
		const idToken = await flowPage.getIdToken();
		expect(idToken).toBeTruthy();
	});

	test('Implicit Flow - Access Token only', async ({ page }) => {
		const flowPage = new ImplicitFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oauth-implicit-v5');

		await flowPage.setResponseType('token');
		await flowPage.setScope('profile email');

		await flowPage.startFlow();

		await page.waitForURL(/.*callback.*/);

		// Verify access token is present
		const accessToken = await flowPage.getAccessToken();
		expect(accessToken).toBeTruthy();
	});

	test('Implicit Flow - Hybrid flow', async ({ page }) => {
		const flowPage = new ImplicitFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'oidc-implicit-v5');

		await flowPage.setResponseType('code id_token');
		await flowPage.setScope('openid profile email');

		await flowPage.startFlow();

		await page.waitForURL(/.*callback.*/);

		// Verify both authorization code and ID token
		const idToken = await flowPage.getIdToken();
		expect(idToken).toBeTruthy();

		// Should also have authorization code for token exchange
		await OAuthTestUtils.verifyTokenResponse(page);
	});

	test('Client Credentials Flow', async ({ page }) => {
		const flowPage = new ClientCredentialsFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'client-credentials-v5');

		await flowPage.setScope('api:read api:write');
		await flowPage.setGrantType('client_credentials');

		await flowPage.startFlow();

		// Client credentials flow should directly return access token
		await OAuthTestUtils.verifyTokenResponse(page);

		// Should not have ID token (not applicable for client credentials)
		const idToken = await flowPage.getIdToken();
		expect(idToken).toBeFalsy();
	});

	test('Device Authorization Flow', async ({ page }) => {
		const flowPage = new DeviceAuthorizationFlowPage(page);

		await OAuthTestUtils.startOAuthFlow(page, 'device-authorization-v5');

		await flowPage.startFlow();

		// Should receive device code, user code, and verification URI
		const deviceCode = await flowPage.getDeviceCode();
		const userCode = await flowPage.getUserCode();
		const verificationUri = await flowPage.getVerificationUri();

		expect(deviceCode).toBeTruthy();
		expect(userCode).toBeTruthy();
		expect(verificationUri).toBeTruthy();

		// Simulate polling for token
		await flowPage.pollForToken();

		// Should eventually receive tokens
		await OAuthTestUtils.verifyTokenResponse(page);
	});

	test('Token Refresh', async ({ page }) => {
		const flowPage = new AuthorizationCodeFlowPage(page);

		// First get initial tokens
		await OAuthTestUtils.startOAuthFlow(page, 'oauth-authorization-code-v5');
		await flowPage.setScope('openid offline_access');
		await flowPage.startFlow();
		await page.waitForURL(/.*callback.*/);

		// Verify initial tokens
		const initialToken = await flowPage.getAccessToken();
		expect(initialToken).toBeTruthy();

		// Refresh token
		await flowPage.refreshToken();

		// Verify new token is different
		const refreshedToken = await flowPage.getAccessToken();
		expect(refreshedToken).toBeTruthy();
		expect(refreshedToken).not.toBe(initialToken);
	});

	test('Token Revocation', async ({ page }) => {
		const flowPage = new AuthorizationCodeFlowPage(page);

		// Get tokens first
		await OAuthTestUtils.startOAuthFlow(page, 'oauth-authorization-code-v5');
		await flowPage.startFlow();
		await page.waitForURL(/.*callback.*/);

		// Verify token exists
		const token = await flowPage.getAccessToken();
		expect(token).toBeTruthy();

		// Revoke token
		await flowPage.revokeToken();

		// Verify token is no longer valid (would need to test with actual API call)
		// For now, just verify the UI indicates revocation
		await page.waitForSelector('.revoked-message, [data-testid="token-revoked"]');
	});
});
