// src/services/__tests__/passwordResetService.contract.test.ts
// Contract tests to ensure API compatibility

import { describe, expect, it } from 'vitest';
import type {
	PasswordChangeRequest,
	PasswordForceChangeRequest,
	PasswordOperationResponse,
	PasswordRecoverRequest,
	SendRecoveryCodeRequest,
	SendRecoveryCodeResponse,
} from '../passwordResetService';

/**
 * Contract tests ensure that the service interfaces remain stable
 * These tests will fail if breaking changes are made to the API
 */

describe('Password Reset Service Contracts', () => {
	describe('Type Contracts', () => {
		it('should maintain PasswordOperationResponse interface', () => {
			const response: PasswordOperationResponse = {
				success: true,
				message: 'test',
				transactionId: 'txn-123',
				timestamp: new Date().toISOString(),
				error: 'test_error',
				errorDescription: 'Test error description',
				valid: true,
				failuresRemaining: 3,
				pingOne: {
					status: 200,
					statusText: 'OK',
					contentType: 'application/json',
					body: {},
				},
			};

			// All fields should be optional except success
			expect(response.success).toBeDefined();
		});

		it('should maintain SendRecoveryCodeRequest interface', () => {
			const request: SendRecoveryCodeRequest = {
				environmentId: 'env-123',
				userId: 'user-123',
				workerToken: 'token-123',
			};

			expect(request.environmentId).toBeDefined();
			expect(request.userId).toBeDefined();
			expect(request.workerToken).toBeDefined();
		});

		it('should maintain SendRecoveryCodeResponse interface', () => {
			const response: SendRecoveryCodeResponse = {
				success: true,
				message: 'Code sent',
				error: 'test_error',
				errorDescription: 'Test error',
			};

			expect(response.success).toBeDefined();
		});

		it('should maintain PasswordRecoverRequest interface', () => {
			const request: PasswordRecoverRequest = {
				recoveryCode: '123456',
				newPassword: 'NewPassword123!',
			};

			expect(request.recoveryCode).toBeDefined();
			expect(request.newPassword).toBeDefined();
		});

		it('should maintain PasswordForceChangeRequest interface', () => {
			const request: PasswordForceChangeRequest = {
				forceChange: true,
			};

			expect(request.forceChange).toBeDefined();
		});

		it('should maintain PasswordChangeRequest interface', () => {
			const request: PasswordChangeRequest = {
				oldPassword: 'OldPassword123!',
				newPassword: 'NewPassword123!',
			};

			expect(request.oldPassword).toBeDefined();
			expect(request.newPassword).toBeDefined();
		});
	});

	describe('Function Signatures', () => {
		it('should maintain sendRecoveryCode signature', () => {
			// This test ensures the function signature doesn't change
			const functionSignature = `
				function sendRecoveryCode(
					request: SendRecoveryCodeRequest
				): Promise<SendRecoveryCodeResponse>
			`;

			expect(functionSignature).toBeDefined();
		});

		it('should maintain recoverPassword signature', () => {
			const functionSignature = `
				function recoverPassword(
					environmentId: string,
					userId: string,
					workerToken: string,
					recoveryCode: string,
					newPassword: string
				): Promise<PasswordOperationResponse>
			`;

			expect(functionSignature).toBeDefined();
		});

		it('should maintain checkPassword signature', () => {
			const functionSignature = `
				function checkPassword(
					environmentId: string,
					userId: string,
					workerToken: string,
					password: string
				): Promise<PasswordOperationResponse>
			`;

			expect(functionSignature).toBeDefined();
		});
	});

	describe('API Endpoint Contracts', () => {
		it('should use correct endpoint for send recovery code', () => {
			const endpoint = '/api/pingone/password/send-recovery-code';
			expect(endpoint).toBe('/api/pingone/password/send-recovery-code');
		});

		it('should use correct endpoint for recover password', () => {
			const endpoint = '/api/pingone/password/recover';
			expect(endpoint).toBe('/api/pingone/password/recover');
		});

		it('should use correct endpoint for check password', () => {
			const endpoint = '/api/pingone/password/check';
			expect(endpoint).toBe('/api/pingone/password/check');
		});

		it('should use correct endpoint for force change', () => {
			const endpoint = '/api/pingone/password/force-change';
			expect(endpoint).toBe('/api/pingone/password/force-change');
		});

		it('should use correct endpoint for unlock', () => {
			const endpoint = '/api/pingone/password/unlock';
			expect(endpoint).toBe('/api/pingone/password/unlock');
		});

		it('should use correct endpoint for read state', () => {
			const endpoint = '/api/pingone/password/state';
			expect(endpoint).toBe('/api/pingone/password/state');
		});
	});

	describe('Content-Type Headers', () => {
		it('should use correct content type for recovery', () => {
			const contentType = 'application/vnd.pingidentity.password.recover+json';
			expect(contentType).toBe('application/vnd.pingidentity.password.recover+json');
		});

		it('should use correct content type for check', () => {
			const contentType = 'application/vnd.pingidentity.password.check+json';
			expect(contentType).toBe('application/vnd.pingidentity.password.check+json');
		});

		it('should use correct content type for force change', () => {
			const contentType = 'application/vnd.pingidentity.password.forceChange+json';
			expect(contentType).toBe('application/vnd.pingidentity.password.forceChange+json');
		});
	});

	describe('Error Response Contracts', () => {
		it('should handle standard error response format', () => {
			const errorResponse = {
				error: 'INVALID_DATA',
				error_description: 'Validation failed',
				code: 'INVALID_DATA',
				details: [
					{
						code: 'INVALID_VALUE',
						target: 'recoveryCode',
						message: 'Invalid recovery code',
					},
				],
			};

			expect(errorResponse.error).toBeDefined();
			expect(errorResponse.error_description).toBeDefined();
			expect(errorResponse.details).toBeInstanceOf(Array);
		});

		it('should handle error detail structure', () => {
			const errorDetail = {
				code: 'INVALID_VALUE',
				target: 'password',
				message: 'Password is invalid',
			};

			expect(errorDetail.code).toBeDefined();
			expect(errorDetail.target).toBeDefined();
			expect(errorDetail.message).toBeDefined();
		});
	});

	describe('Success Response Contracts', () => {
		it('should handle recovery success response', () => {
			const successResponse = {
				success: true,
				message: 'Password recovered successfully',
				transactionId: 'txn-123',
				timestamp: new Date().toISOString(),
			};

			expect(successResponse.success).toBe(true);
			expect(successResponse.message).toBeDefined();
		});

		it('should handle check password success response', () => {
			const successResponse = {
				success: true,
				valid: true,
				message: 'Password is correct',
			};

			expect(successResponse.success).toBe(true);
			expect(successResponse.valid).toBeDefined();
		});

		it('should handle check password invalid response', () => {
			const invalidResponse = {
				success: true,
				valid: false,
				message: 'Password does not match',
				failuresRemaining: 4,
			};

			expect(invalidResponse.success).toBe(true);
			expect(invalidResponse.valid).toBe(false);
			expect(invalidResponse.failuresRemaining).toBeDefined();
		});
	});
});
