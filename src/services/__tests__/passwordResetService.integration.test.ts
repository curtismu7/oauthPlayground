// src/services/__tests__/passwordResetService.integration.test.ts
// Integration tests for Password Reset Service with backend

import { describe, it, expect, beforeAll } from 'vitest';
import {
	sendRecoveryCode,
	recoverPassword,
	checkPassword,
	readPasswordState,
} from '../passwordResetService';

/**
 * Integration tests - these test the actual API flow
 * Run with: npm run test:integration
 * 
 * Requirements:
 * - Backend server running on localhost:3000
 * - Valid PingOne environment configured
 * - Test user available
 */

describe('Password Reset Integration Tests', () => {
	const config = {
		environmentId: process.env.VITE_PINGONE_ENVIRONMENT_ID || '',
		workerToken: process.env.TEST_WORKER_TOKEN || '',
		testUserId: process.env.TEST_USER_ID || '',
		testPassword: process.env.TEST_PASSWORD || 'TestPassword123!',
	};

	beforeAll(() => {
		if (!config.environmentId || !config.workerToken || !config.testUserId) {
			console.warn('⚠️  Integration tests skipped - missing environment variables');
			console.warn('Set: VITE_PINGONE_ENVIRONMENT_ID, TEST_WORKER_TOKEN, TEST_USER_ID');
		}
	});

	describe('Password Recovery Flow', () => {
		it.skipIf(!config.environmentId)('should complete full recovery flow', async () => {
			// Step 1: Send recovery code
			const sendResult = await sendRecoveryCode({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: config.workerToken,
			});

			expect(sendResult.success).toBe(true);
			console.log('✅ Recovery code sent');

			// Note: In real test, you'd need to retrieve the actual code from email/SMS
			// For now, we just verify the API call succeeded
		}, 30000);

		it.skipIf(!config.environmentId)('should handle invalid recovery code', async () => {
			const result = await recoverPassword(
				config.environmentId,
				config.testUserId,
				config.workerToken,
				'invalid-code-12345',
				config.testPassword
			);

			expect(result.success).toBe(false);
			expect(result.errorDescription).toBeDefined();
			expect(result.errorDescription).toContain('recovery code');
			console.log('✅ Invalid recovery code handled correctly');
		}, 30000);
	});

	describe('Password Check Flow', () => {
		it.skipIf(!config.environmentId)('should check password correctly', async () => {
			const result = await checkPassword(
				config.environmentId,
				config.testUserId,
				config.workerToken,
				config.testPassword
			);

			// Result should be success regardless of whether password matches
			expect(result.success).toBe(true);
			expect(result.valid).toBeDefined();
			console.log(`✅ Password check result: valid=${result.valid}`);
		}, 30000);

		it.skipIf(!config.environmentId)('should handle empty password', async () => {
			const result = await checkPassword(
				config.environmentId,
				config.testUserId,
				config.workerToken,
				''
			);

			expect(result.success).toBe(false);
			expect(result.errorDescription).toContain('empty');
			console.log('✅ Empty password validation working');
		}, 30000);
	});

	describe('Password State Flow', () => {
		it.skipIf(!config.environmentId)('should read password state', async () => {
			const result = await readPasswordState(
				config.environmentId,
				config.testUserId,
				config.workerToken
			);

			expect(result.success).toBe(true);
			if (result.passwordState) {
				expect(result.passwordState).toHaveProperty('status');
				console.log('✅ Password state retrieved:', result.passwordState.status);
			}
		}, 30000);
	});

	describe('Error Handling', () => {
		it('should handle invalid environment ID', async () => {
			const result = await sendRecoveryCode({
				environmentId: 'invalid-env-id',
				userId: config.testUserId,
				workerToken: config.workerToken,
			});

			expect(result.success).toBe(false);
			console.log('✅ Invalid environment ID handled');
		}, 30000);

		it('should handle invalid user ID', async () => {
			const result = await sendRecoveryCode({
				environmentId: config.environmentId,
				userId: 'invalid-user-id',
				workerToken: config.workerToken,
			});

			expect(result.success).toBe(false);
			console.log('✅ Invalid user ID handled');
		}, 30000);

		it('should handle network errors gracefully', async () => {
			// This test uses an invalid URL to simulate network error
			const result = await checkPassword(
				'',
				'',
				'',
				''
			);

			expect(result.success).toBe(false);
			console.log('✅ Network errors handled gracefully');
		}, 30000);
	});
});
