/**
 * @file mfaFlows.e2e.test.ts
 * @module apps/mfa/e2e
 * @description End-to-end tests for MFA flows
 * @version 8.0.0
 * @since 2026-02-20
 */

import { expect, test } from '@playwright/test';

// Mock API responses
const mockDeviceRegistrationResponse = {
	id: 'device-123',
	user: { id: 'user-123' },
	status: 'ACTIVE',
	type: 'SMS',
	phone: '+1234567890',
	nickname: 'My Phone',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const mockAuthenticationResponse = {
	id: 'auth-123',
	status: 'PENDING',
	device: {
		id: 'device-123',
		type: 'SMS',
	},
	challenge: {
		id: 'challenge-123',
		type: 'OTP',
		expiresAt: Date.now() + 15 * 60 * 1000,
	},
};

const mockOTPValidationResponse = {
	isValid: true,
	deviceAuthenticationId: 'auth-123',
	status: 'COMPLETED',
};

test.describe('MFA Registration Flow E2E', () => {
	test.beforeEach(async ({ page }) => {
		// Setup mock API responses
		await page.route('**/environments/*/users/*/devices', (route) => {
			if (route.request().method() === 'POST') {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(mockDeviceRegistrationResponse),
				});
			}
		});

		await page.route('**/environments/*/users/*/devices/validate', (route) => {
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					isValid: true,
					deviceId: 'device-123',
					status: 'VALIDATED',
				}),
			});
		});

		// Navigate to MFA registration page
		await page.goto('/mfa/register');
	});

	test('should complete full registration flow', async ({ page }) => {
		// Step 1: Device Type Selection
		await expect(page.locator('h1')).toContainText('Device Registration');
		await expect(page.locator('[data-testid="device-type-selection"]')).toBeVisible();

		// Select SMS device type
		await page.locator('[data-testid="device-type-sms"]').click();
		await page.locator('[data-testid="next-step"]').click();

		// Step 2: User Verification
		await expect(page.locator('[data-testid="user-verification"]')).toBeVisible();
		await expect(page.locator('[data-testid="username-input"]')).toHaveValue('test@example.com');
		await page.locator('[data-testid="next-step"]').click();

		// Step 3: Device Configuration
		await expect(page.locator('[data-testid="device-configuration"]')).toBeVisible();
		await page.locator('[data-testid="phone-input"]').fill('+1234567890');
		await page.locator('[data-testid="device-name-input"]').fill('My Phone');
		await page.locator('[data-testid="register-device"]').click();

		// Wait for registration to complete
		await expect(page.locator('[data-testid="registration-complete"]')).toBeVisible();
		await expect(page.locator('text=Device registered successfully!')).toBeVisible();

		// Verify progress bar shows completion
		await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
			'aria-valuenow',
			'100'
		);
	});

	test('should handle registration errors gracefully', async ({ page }) => {
		// Mock registration failure
		await page.route('**/environments/*/users/*/devices', (route) => {
			return route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({
					error: 'Device registration failed',
					message: 'Invalid phone number format',
				}),
			});
		});

		// Navigate through steps
		await page.locator('[data-testid="device-type-sms"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="phone-input"]').fill('invalid-phone');
		await page.locator('[data-testid="register-device"]').click();

		// Verify error handling
		await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
		await expect(page.locator('text=Failed to register device')).toBeVisible();
		await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
	});

	test('should handle state persistence across page refresh', async ({ page }) => {
		// Navigate to device configuration step
		await page.locator('[data-testid="device-type-sms"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="phone-input"]').fill('+1234567890');

		// Refresh page
		await page.reload();

		// Verify state is preserved
		await expect(page.locator('[data-testid="device-configuration"]')).toBeVisible();
		await expect(page.locator('[data-testid="phone-input"]')).toHaveValue('+1234567890');
		await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
			'aria-valuenow',
			'40'
		);
	});

	test('should validate required fields', async ({ page }) => {
		// Navigate to device configuration step
		await page.locator('[data-testid="device-type-sms"]').click();
		await page.locator('[data-testid="next-step"]').click();

		// Try to proceed without phone number
		await page.locator('[data-testid="next-step"]').click();

		// Verify validation error
		await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
		await expect(page.locator('text=Please provide phone number')).toBeVisible();
	});
});

test.describe('MFA Authentication Flow E2E', () => {
	test.beforeEach(async ({ page }) => {
		// Setup mock API responses
		await page.route('**/mfa/v1/environments/*/deviceAuthentications', (route) => {
			if (route.request().method() === 'POST') {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(mockAuthenticationResponse),
				});
			}
		});

		await page.route('**/deviceAuthentications/*/otp.check', (route) => {
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockOTPValidationResponse),
			});
		});

		// Navigate to MFA authentication page
		await page.goto('/mfa/authenticate');
	});

	test('should complete full authentication flow', async ({ page }) => {
		// Step 1: Device Selection
		await expect(page.locator('h1')).toContainText('Device Authentication');
		await expect(page.locator('[data-testid="device-selection"]')).toBeVisible();

		// Select a device
		await page.locator('[data-testid="device-1"]').click();
		await page.locator('[data-testid="send-challenge"]').click();

		// Step 2: Challenge Initiation
		await expect(page.locator('[data-testid="challenge-initiation"]')).toBeVisible();
		await expect(page.locator('text=Secure authentication session active')).toBeVisible();
		await page.locator('[data-testid="next-step"]').click();

		// Step 3: Challenge Response
		await expect(page.locator('[data-testid="challenge-response"]')).toBeVisible();
		await page.locator('[data-testid="otp-input"]').fill('123456');
		await page.locator('[data-testid="validate-code"]').click();

		// Wait for authentication to complete
		await expect(page.locator('[data-testid="authentication-complete"]')).toBeVisible();
		await expect(page.locator('text=Authentication completed successfully!')).toBeVisible();

		// Verify progress bar shows completion
		await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
			'aria-valuenow',
			'100'
		);
	});

	test('should handle authentication errors gracefully', async ({ page }) => {
		// Mock OTP validation failure
		await page.route('**/deviceAuthentications/*/otp.check', (route) => {
			return route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({
					isValid: false,
					deviceAuthenticationId: 'auth-123',
					status: 'FAILED',
					error: 'Invalid OTP code',
				}),
			});
		});

		// Navigate through steps
		await page.locator('[data-testid="device-1"]').click();
		await page.locator('[data-testid="send-challenge"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="otp-input"]').fill('000000');
		await page.locator('[data-testid="validate-code"]').click();

		// Verify error handling
		await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
		await expect(page.locator('text=Invalid OTP code')).toBeVisible();
		await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
	});

	test('should handle session expiration', async ({ page }) => {
		// Mock session expiration
		await page.route('**/deviceAuthentications/*/otp.check', (route) => {
			return route.fulfill({
				status: 401,
				contentType: 'application/json',
				body: JSON.stringify({
					error: 'Session expired',
					message: 'Authentication session has expired',
				}),
			});
		});

		// Navigate through steps
		await page.locator('[data-testid="device-1"]').click();
		await page.locator('[data-testid="send-challenge"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="otp-input"]').fill('123456');
		await page.locator('[data-testid="validate-code"]').click();

		// Verify session expiration handling
		await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
		await expect(page.locator('text=Authentication session has expired')).toBeVisible();
		await expect(page.locator('[data-testid="restart-flow"]').toBeVisible();
	});

	test('should display security metrics', async ({ page }) => {
		// Navigate to challenge initiation step
		await page.locator('[data-testid="device-1"]').click();
		await page.locator('[data-testid="send-challenge"]').click();

		// Verify security metrics display
		await expect(page.locator('[data-testid="security-metrics"]')).toBeVisible();
		await expect(page.locator('[data-testid="state-age"]')).toBeVisible();
		await expect(page.locator('[data-testid="risk-level"]')).toBeVisible();
		await expect(page.locator('[data-testid="attempts-remaining"]')).toBeVisible();
	});

	test('should handle OTP retry limits', async ({ page }) => {
		// Mock OTP validation with retry tracking
		let attemptCount = 0;
		await page.route('**/deviceAuthentications/*/otp.check', (route) => {
			attemptCount++;
			return route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({
					isValid: false,
					deviceAuthenticationId: 'auth-123',
					status: 'FAILED',
					attemptsRemaining: Math.max(0, 3 - attemptCount),
				}),
			});
		});

		// Navigate through steps
		await page.locator('[data-testid="device-1"]').click();
		await page.locator('[data-testid="send-challenge"]').click();
		await page.locator('[data-testid="next-step"]').click();

		// Try OTP multiple times
		for (let i = 0; i < 4; i++) {
			await page.locator('[data-testid="otp-input"]').fill('000000');
			await page.locator('[data-testid="validate-code"]').click();

			if (i < 3) {
				// Should show retry option
				await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
				await expect(page.locator(`[data-testid="attempts-remaining"]`)).toContainText(`${3 - i}`);
			} else {
				// Should show max attempts reached
				await expect(page.locator('[data-testid="max-attempts-reached"]')).toBeVisible();
				await expect(page.locator('[data-testid="restart-flow"]')).toBeVisible();
				break;
			}
		}
	});
});

test.describe('MFA Flow Integration E2E', () => {
	test('should handle flow switching', async ({ page }) => {
		// Start with registration
		await page.goto('/mfa/register');
		await page.locator('[data-testid="device-type-sms"]').click();

		// Switch to authentication in the middle of registration
		await page.goto('/mfa/authenticate');

		// Verify authentication flow starts fresh
		await expect(page.locator('[data-testid="device-selection"]')).toBeVisible();
		await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
			'aria-valuenow',
			'25'
		);
	});

	test('should handle concurrent flows', async ({ context }) => {
		// Open two pages for concurrent flows
		const page1 = await context.newPage();
		const page2 = await context.newPage();

		// Start registration on page 1
		await page1.goto('/mfa/register');
		await page1.locator('[data-testid="device-type-sms"]').click();

		// Start authentication on page 2
		await page2.goto('/mfa/authenticate');
		await page2.locator('[data-testid="device-1"]').click();

		// Verify both flows work independently
		await expect(page1.locator('[data-testid="user-verification"]')).toBeVisible();
		await expect(page2.locator('[data-testid="send-challenge"]')).toBeVisible();

		// Verify different storage is used
		const regState = await page1.evaluate(() => localStorage.getItem('mfa_reg_state'));
		const authState = await page2.evaluate(() => sessionStorage.getItem('mfa_auth_state'));

		expect(regState).not.toBeNull();
		expect(authState).not.toBeNull();
		expect(regState).not.toBe(authState);

		await page1.close();
		await page2.close();
	});

	test('should handle browser back navigation', async ({ page }) => {
		// Navigate through registration flow
		await page.goto('/mfa/register');
		await page.locator('[data-testid="device-type-sms"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="phone-input"]').fill('+1234567890');

		// Use browser back button
		await page.goBack();

		// Verify previous step is restored
		await expect(page.locator('[data-testid="user-verification"]')).toBeVisible();
		await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
			'aria-valuenow',
			'40'
		);
	});

	test('should handle browser refresh during flow', async ({ page }) => {
		// Navigate through authentication flow
		await page.goto('/mfa/authenticate');
		await page.locator('[data-testid="device-1"]').click();
		await page.locator('[data-testid="send-challenge"]').click();

		// Refresh page
		await page.reload();

		// Verify flow state is preserved
		await expect(page.locator('[data-testid="challenge-initiation"]')).toBeVisible();
		await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
			'aria-valuenow',
			'50'
		);
	});

	test('should handle network connectivity issues', async ({ page }) => {
		// Simulate network offline
		await page.context.setOffline(true);

		// Try to start registration
		await page.goto('/mfa/register');
		await page.locator('[data-testid="device-type-sms"]').click();
		await page.locator('[data-testid="next-step"]').click();
		await page.locator('[data-testid="register-device"]').click();

		// Verify network error handling
		await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
		await expect(page.locator('text=Network error occurred')).toBeVisible();
		await expect(page.locator('[data-testid="retry-when-online"]')).toBeVisible();

		// Restore network
		await page.context.setOffline(false);

		// Verify retry works
		await page.locator('[data-testid="retry-when-online"]').click();
		await expect(page.locator('[data-testid="registration-complete"]')).toBeVisible();
	});
});

test.describe('MFA Error Boundary E2E', () => {
	test('should catch and handle component errors', async ({ page }) => {
		// Inject error into component
		await page.addInitScript(() => {
			window.__TEST_ERROR__ = true;
		});

		// Navigate to MFA page
		await page.goto('/mfa/register');

		// Verify error boundary catches the error
		await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
		await expect(page.locator('text=Error Occurred')).toBeVisible();
		await expect(page.locator('[data-testid="restart-flow"]')).toBeVisible();
	});

	test('should provide recovery options', async ({ page }) => {
		// Trigger error scenario
		await page.goto('/mfa/register');
		await page.evaluate(() => {
			throw new Error('Test error for recovery');
		});

		// Verify recovery options are available
		await expect(page.locator('[data-testid="recovery-actions"]')).toBeVisible();
		await expect(page.locator('[data-testid="restart-flow"]')).toBeVisible();
		await expect(page.locator('[data-testid="get-help"]')).toBeVisible();

		// Test restart flow
		await page.locator('[data-testid="restart-flow"]').click();
		await expect(page.locator('[data-testid="device-type-selection"]')).toBeVisible();
	});
});

test.describe('MFA Performance E2E', () => {
	test('should load registration flow within performance budget', async ({ page }) => {
		const startTime = Date.now();

		await page.goto('/mfa/register');
		await page.locator('[data-testid="device-type-selection"]').waitFor({ state: 'visible' });

		const loadTime = Date.now() - startTime;

		// Should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);
	});

	test('should handle large device lists efficiently', async ({ page }) => {
		// Mock large device list
		await page.route('**/devices', (route) => {
			const devices = Array.from({ length: 100 }, (_, i) => ({
				id: `device-${i}`,
				type: 'SMS',
				name: `Device ${i}`,
				status: 'ACTIVE',
			}));

			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ devices }),
			});
		});

		await page.goto('/mfa/authenticate');

		// Should render large list without performance issues
		const startTime = Date.now();
		await page.locator('[data-testid="device-list"]').waitFor({ state: 'visible' });
		const renderTime = Date.now() - startTime;

		expect(renderTime).toBeLessThan(1000);
		expect(page.locator('[data-testid="device-item"]')).toHaveCount(100);
	});
});
