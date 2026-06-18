// tests/e2e/v2-authz-code-mock.spec.ts
//
// E2E tests for the V2 Authorization Code + PKCE flow at /v2/flows/authorization-code.
// Mock mode runs the full 5-step flow offline — no PingOne redirect or real credentials needed.

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const MOCK_ENV_ID = 'demo-env-00000000-0000-0000-0000-000000000001';
const MOCK_CLIENT_ID = 'demo-client-00000000-0000-0000-0000-000000000002';
const MOCK_CLIENT_SECRET = 'demo-secret-value';

// FieldGroup renders <label>text</label><input/> as adjacent siblings — no for/id association.
// Use the CSS adjacent sibling selector to locate inputs by their label text.
const fieldInput = (page: Page, labelText: string) =>
    page.locator(`label:text("${labelText}") + input`);

// The sidebar contains buttons "Mock Flows" and "Real PingOne API's & support" that partially
// match our pill text. Always use exact:true for these buttons to avoid strict-mode violations.
const modeBtn = (page: Page, name: 'Mock' | 'Real PingOne') =>
    page.getByRole('button', { name, exact: true });

// The sidebar also has a stray <h2>, so scope step headings to the flow's own heading level.
const stepHeading = (page: Page, text: string) =>
    page.getByRole('heading', { name: text, exact: true });

test.describe('Authorization Code + PKCE — V2 mock mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/v2/flows/authorization-code');
        await page.waitForLoadState('networkidle');
    });

    // ── Structural ───────────────────────────────────────────────────────────

    test('loads with correct title and 5-step rail', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Authorization Code');
        await expect(page.locator('ol > li')).toHaveCount(5);
        await expect(stepHeading(page, '1. Configure')).toBeVisible();
    });

    test('Real PingOne is the default mode', async ({ page }) => {
        await expect(modeBtn(page, 'Real PingOne')).toBeVisible();
        await expect(modeBtn(page, 'Mock')).toBeVisible();
    });

    test('Continue is disabled until all required fields are filled', async ({ page }) => {
        const continueBtn = page.getByRole('button', { name: 'Continue' });
        await expect(continueBtn).toBeDisabled();

        await fieldInput(page, 'Environment ID').fill(MOCK_ENV_ID);
        await fieldInput(page, 'Client ID').fill(MOCK_CLIENT_ID);
        await page.locator('input[type="password"]').fill(MOCK_CLIENT_SECRET);
        // Redirect URI is pre-filled from window.location.origin
        await expect(continueBtn).toBeEnabled();
    });

    test('spec pills toggle OAuth 2.0 / 2.1 without error', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'OAuth 2.1' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'OAuth 2.0' })).toBeVisible();
        await page.getByRole('button', { name: 'OAuth 2.0' }).click();
        await page.getByRole('button', { name: 'OAuth 2.1' }).click();
    });

    // ── Full flow ────────────────────────────────────────────────────────────

    test('completes all 5 steps in mock mode end-to-end', async ({ page }) => {
        // ── Step 1: Configure ───────────────────────────────────────────────
        await expect(stepHeading(page, '1. Configure')).toBeVisible();

        await modeBtn(page, 'Mock').click();

        await fieldInput(page, 'Environment ID').fill(MOCK_ENV_ID);
        await fieldInput(page, 'Client ID').fill(MOCK_CLIENT_ID);
        await page.locator('input[type="password"]').fill(MOCK_CLIENT_SECRET);

        await page.getByRole('button', { name: 'Continue' }).click();

        // ── Step 2: Generate PKCE ───────────────────────────────────────────
        await expect(stepHeading(page, '2. Generate PKCE')).toBeVisible();

        await page.getByRole('button', { name: 'Generate verifier + challenge' }).click();

        await expect(page.getByText('code_verifier', { exact: true })).toBeVisible();
        await expect(page.getByText('code_challenge (S256)', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: 'Continue' }).click();

        // ── Step 3: Authorize — mock issues code in-memory, auto-advances ───
        await expect(stepHeading(page, '3. Authorize')).toBeVisible();

        await page.getByRole('button', { name: 'Issue authorization code (mock)' }).click();

        // Mock mode calls engine.goTo(3) directly — no PingOne redirect
        await expect(stepHeading(page, '4. Exchange code for tokens')).toBeVisible({
            timeout: 8_000,
        });

        // ── Step 4: Exchange code for tokens ────────────────────────────────
        await page.getByRole('button', { name: 'Exchange code' }).click();

        await expect(page.getByText('Token Response')).toBeVisible({ timeout: 10_000 });

        const useTokensBtn = page.getByRole('button', { name: 'Use tokens' });
        await expect(useTokensBtn).toBeEnabled({ timeout: 8_000 });
        await useTokensBtn.click();

        // ── Step 5: Use the tokens ───────────────────────────────────────────
        await expect(stepHeading(page, '5. Use the tokens')).toBeVisible();

        await page.getByRole('button', { name: 'Call UserInfo' }).click();
        await expect(page.getByText('UserInfo', { exact: true })).toBeVisible({ timeout: 10_000 });

        await page.getByRole('button', { name: 'Introspect token' }).click();
        await expect(page.getByText('Introspection (RFC 7662)')).toBeVisible({ timeout: 10_000 });
    });

    // ── Step-level tests ─────────────────────────────────────────────────────

    test('step 2: PKCE generates verifier and S256 challenge', async ({ page }) => {
        await modeBtn(page, 'Mock').click();
        await fieldInput(page, 'Environment ID').fill(MOCK_ENV_ID);
        await fieldInput(page, 'Client ID').fill(MOCK_CLIENT_ID);
        await page.locator('input[type="password"]').fill(MOCK_CLIENT_SECRET);
        await page.getByRole('button', { name: 'Continue' }).click();

        await page.getByRole('button', { name: 'Generate verifier + challenge' }).click();

        await expect(page.getByText('code_verifier', { exact: true })).toBeVisible();
        await expect(page.getByText('code_challenge (S256)', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });

    test('step 3: authorize button label reflects mock mode', async ({ page }) => {
        await modeBtn(page, 'Mock').click();
        await fieldInput(page, 'Environment ID').fill(MOCK_ENV_ID);
        await fieldInput(page, 'Client ID').fill(MOCK_CLIENT_ID);
        await page.locator('input[type="password"]').fill(MOCK_CLIENT_SECRET);
        await page.getByRole('button', { name: 'Continue' }).click();

        await page.getByRole('button', { name: 'Generate verifier + challenge' }).click();
        await page.getByRole('button', { name: 'Continue' }).click();

        await expect(
            page.getByRole('button', { name: 'Issue authorization code (mock)' })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Authorize with PingOne/i })
        ).not.toBeVisible();
    });
});
