import { test, expect } from '@playwright/test';
import { OAuthTestUtils, MockOAuthServer } from '../../utils/test-helpers';
import {
  AuthorizationCodeFlowPage
} from '../../fixtures/page-objects';

test.describe('PingOne Specific Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock OAuth server responses
    await MockOAuthServer.setupMockResponses(page);

    // Configure test environment
    await OAuthTestUtils.configurePingOne(page, {
      environmentId: 'test-env-123',
      clientId: 'test-client-123',
      clientSecret: 'test-secret-123',
      redirectUri: 'http://localhost:3000/callback'
    });
  });

  test('PingOne PAR Flow', async ({ page }) => {
    const flowPage = new AuthorizationCodeFlowPage(page);

    await OAuthTestUtils.startOAuthFlow(page, 'pingone-par-v5');

    await flowPage.setScope('openid profile email');
    await flowPage.setState('par-test-state');

    await flowPage.startFlow();

    // PAR flow should first make a PAR request
    await page.waitForSelector('[data-testid="par-request-id"]');

    const requestId = await page.locator('[data-testid="par-request-id"]').textContent();
    expect(requestId).toBeTruthy();

    // Then redirect to authorization
    const authUrl = await flowPage.getAuthorizationUrl();
    expect(authUrl).toContain('request_uri');
    expect(authUrl).toContain(requestId);

    await page.waitForURL(/.*callback.*/);

    // Verify tokens
    await OAuthTestUtils.verifyTokenResponse(page);
    await OAuthTestUtils.verifyOIDCTokens(page);
  });

  test('PingOne Worker Token Flow', async ({ page }) => {
    await OAuthTestUtils.startOAuthFlow(page, 'worker-token-v5');

    // Worker token flow should directly request token
    await page.click('button:has-text("Get Worker Token"), [data-testid="get-worker-token"]');

    // Should receive access token
    await page.waitForSelector('[data-testid="access-token"]');

    const accessToken = await page.locator('[data-testid="access-token"]').textContent();
    expect(accessToken).toBeTruthy();
    expect(accessToken?.length).toBeGreaterThan(10);
  });

  test('PingOne CIBA Flow', async ({ page }) => {
    await OAuthTestUtils.startOAuthFlow(page, 'ciba-v6');

    // Enter user identifier for CIBA
    await page.fill('[name*="identifier"], [placeholder*="identifier"]', 'testuser@example.com');

    // Set binding message
    await page.fill('[name*="binding"], [placeholder*="binding"]', 'Test authentication request');

    // Start CIBA flow
    await page.click('button:has-text("Start CIBA"), [data-testid="start-ciba"]');

    // Should receive auth request ID
    await page.waitForSelector('[data-testid="auth-req-id"]');

    const authReqId = await page.locator('[data-testid="auth-req-id"]').textContent();
    expect(authReqId).toBeTruthy();

    // Poll for token
    await page.click('button:has-text("Poll Token"), [data-testid="poll-token"]');

    // Should eventually receive tokens
    await OAuthTestUtils.verifyTokenResponse(page);
    await OAuthTestUtils.verifyOIDCTokens(page);
  });

  test('PingOne Redirectless Flow', async ({ page }) => {
    await OAuthTestUtils.startOAuthFlow(page, 'redirectless-flow-v5');

    // Redirectless flow should handle authentication internally
    await page.click('button:has-text("Start Flow"), [data-testid="start-flow"]');

    // Should receive tokens without browser redirects
    await OAuthTestUtils.verifyTokenResponse(page);
    await OAuthTestUtils.verifyOIDCTokens(page);
  });

  test('PingOne MFA Test', async ({ page }) => {
    await page.goto('/mfa-test');

    // Should load MFA test interface
    await page.waitForSelector('[data-testid="mfa-test-form"]');

    // Enter test credentials
    await page.fill('[name*="username"]', 'testuser');
    await page.fill('[name*="password"]', 'testpass');

    // Start MFA flow
    await page.click('button:has-text("Start MFA"), [data-testid="start-mfa"]');

    // Should prompt for MFA
    await page.waitForSelector('[data-testid="mfa-challenge"]');

    // Enter MFA code (mock)
    await page.fill('[name*="mfa-code"]', '123456');

    // Complete MFA
    await page.click('button:has-text("Verify"), [data-testid="verify-mfa"]');

    // Should receive tokens
    await OAuthTestUtils.verifyTokenResponse(page);
  });

  test('PingOne RAR Flow', async ({ page }) => {
    const flowPage = new AuthorizationCodeFlowPage(page);

    await OAuthTestUtils.startOAuthFlow(page, 'rar-v5');

    // Configure RAR request
    await page.fill('[name*="resource"], [placeholder*="resource"]', 'https://api.example.com/user');
    await page.fill('[name*="actions"], [placeholder*="actions"]', 'read,write');
    await page.fill('[name*="locations"], [placeholder*="locations"]', 'https://api.example.com');

    await flowPage.setScope('openid profile');

    await flowPage.startFlow();

    // Should make RAR-augmented authorization request
    const authUrl = await flowPage.getAuthorizationUrl();
    expect(authUrl).toContain('authorization_details');

    await page.waitForURL(/.*callback.*/);

    // Verify tokens with RAR claims
    await OAuthTestUtils.verifyTokenResponse(page);
    await OAuthTestUtils.verifyOIDCTokens(page);
  });
});