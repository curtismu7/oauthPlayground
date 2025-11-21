// src/services/__tests__/passwordResetService.test.ts
// Unit tests for password reset service

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackedFetch } from '../../utils/trackedFetch';
import {
	changePassword,
	forcePasswordChange,
	recoverPassword,
	sendRecoveryCode,
} from '../passwordResetService';

// Mock trackedFetch
vi.mock('../../utils/trackedFetch', () => ({
	trackedFetch: vi.fn(),
}));

// Mock apiCallTrackerService
vi.mock('../apiCallTrackerService', () => ({
	apiCallTrackerService: {
		trackApiCall: vi.fn(() => 'mock-call-id'),
		updateApiCallResponse: vi.fn(),
	},
}));

const mockTrackedFetch = trackedFetch as ReturnType<typeof vi.fn>;

describe('PasswordResetService', () => {
	const mockEnvironmentId = 'test-env-123';
	const mockUserId = 'test-user-456';
	const mockWorkerToken = 'test-worker-token-789';
	const mockAccessToken = 'test-access-token-101';
	const mockRecoveryCode = '123456';
	const mockOldPassword = 'OldPassw0rd!';
	const mockNewPassword = 'N3wPassw0rd!?';

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('sendRecoveryCode', () => {
		it('should send recovery code successfully', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: async () => ({
					success: true,
					message: 'Recovery code sent successfully',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await sendRecoveryCode({
				environmentId: mockEnvironmentId,
				userId: mockUserId,
				workerToken: mockWorkerToken,
			});

			expect(result.success).toBe(true);
			expect(result.message).toBe('Recovery code sent successfully');
			expect(mockTrackedFetch).toHaveBeenCalledWith(
				'/api/pingone/password/send-recovery-code',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: mockEnvironmentId,
						userId: mockUserId,
						workerToken: mockWorkerToken,
					}),
				})
			);
		});

		it('should handle API error response', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					error: 'invalid_request',
					error_description: 'User not found',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await sendRecoveryCode({
				environmentId: mockEnvironmentId,
				userId: mockUserId,
				workerToken: mockWorkerToken,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('invalid_request');
			expect(result.errorDescription).toBe('User not found');
		});

		it('should handle network errors', async () => {
			const networkError = new Error('Network request failed');
			mockTrackedFetch.mockRejectedValueOnce(networkError);

			const result = await sendRecoveryCode({
				environmentId: mockEnvironmentId,
				userId: mockUserId,
				workerToken: mockWorkerToken,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('network_error');
			expect(result.errorDescription).toBe('Network request failed');
		});

		it('should handle missing error description in response', async () => {
			const mockResponse = {
				ok: false,
				status: 500,
				json: async () => ({
					error: 'server_error',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await sendRecoveryCode({
				environmentId: mockEnvironmentId,
				userId: mockUserId,
				workerToken: mockWorkerToken,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('server_error');
			expect(result.errorDescription).toBe('Failed to send recovery code');
		});
	});

	describe('recoverPassword', () => {
		it('should recover password successfully', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: async () => ({
					success: true,
					message: 'Password recovered successfully',
					transactionId: 'txn-123',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await recoverPassword(
				mockEnvironmentId,
				mockUserId,
				mockWorkerToken,
				mockRecoveryCode,
				mockNewPassword
			);

			expect(result.success).toBe(true);
			expect(result.message).toBe('Password recovered successfully');
			expect(result.transactionId).toBe('txn-123');
			expect(result.timestamp).toBeDefined();
			expect(mockTrackedFetch).toHaveBeenCalledWith(
				'/api/pingone/password/recover',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: mockEnvironmentId,
						userId: mockUserId,
						workerToken: mockWorkerToken,
						recoveryCode: mockRecoveryCode,
						newPassword: mockNewPassword,
					}),
				})
			);
		});

		it('should handle invalid recovery code', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					error: 'invalid_recovery_code',
					error_description: 'Recovery code is invalid or expired',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await recoverPassword(
				mockEnvironmentId,
				mockUserId,
				mockWorkerToken,
				mockRecoveryCode,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('invalid_recovery_code');
			expect(result.errorDescription).toBe('Recovery code is invalid or expired');
		});

		it('should handle network errors', async () => {
			const networkError = new Error('Connection timeout');
			mockTrackedFetch.mockRejectedValueOnce(networkError);

			const result = await recoverPassword(
				mockEnvironmentId,
				mockUserId,
				mockWorkerToken,
				mockRecoveryCode,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('network_error');
			expect(result.errorDescription).toBe('Connection timeout');
		});

		it('should handle password policy violations', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					error: 'password_policy_violation',
					error_description: 'Password does not meet policy requirements',
					message: 'Password must be at least 8 characters',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await recoverPassword(
				mockEnvironmentId,
				mockUserId,
				mockWorkerToken,
				mockRecoveryCode,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('password_policy_violation');
			// Service prioritizes error_description over message
			expect(result.errorDescription).toBe('Password does not meet policy requirements');
		});
	});

	describe('forcePasswordChange', () => {
		it('should force password change successfully', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: async () => ({
					success: true,
					message: 'User will be required to change password on next sign-on',
					transactionId: 'txn-456',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await forcePasswordChange(mockEnvironmentId, mockUserId, mockWorkerToken);

			expect(result.success).toBe(true);
			expect(result.message).toBe('User will be required to change password on next sign-on');
			expect(result.transactionId).toBe('txn-456');
			expect(result.timestamp).toBeDefined();
			expect(mockTrackedFetch).toHaveBeenCalledWith(
				'/api/pingone/password/force-change',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: mockEnvironmentId,
						userId: mockUserId,
						workerToken: mockWorkerToken,
					}),
				})
			);
		});

		it('should handle unauthorized access', async () => {
			const mockResponse = {
				ok: false,
				status: 403,
				json: async () => ({
					error: 'insufficient_privileges',
					error_description: 'Worker token does not have required permissions',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await forcePasswordChange(mockEnvironmentId, mockUserId, mockWorkerToken);

			expect(result.success).toBe(false);
			expect(result.error).toBe('insufficient_privileges');
			expect(result.errorDescription).toBe('Worker token does not have required permissions');
		});

		it('should handle user not found', async () => {
			const mockResponse = {
				ok: false,
				status: 404,
				json: async () => ({
					error: 'user_not_found',
					error_description: 'User does not exist',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await forcePasswordChange(mockEnvironmentId, mockUserId, mockWorkerToken);

			expect(result.success).toBe(false);
			expect(result.error).toBe('user_not_found');
			expect(result.errorDescription).toBe('User does not exist');
		});

		it('should handle network errors', async () => {
			const networkError = new Error('Failed to connect');
			mockTrackedFetch.mockRejectedValueOnce(networkError);

			const result = await forcePasswordChange(mockEnvironmentId, mockUserId, mockWorkerToken);

			expect(result.success).toBe(false);
			expect(result.error).toBe('network_error');
			expect(result.errorDescription).toBe('Failed to connect');
		});
	});

	describe('changePassword', () => {
		it('should change password successfully', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				json: async () => ({
					success: true,
					message: 'Password changed successfully',
					transactionId: 'txn-789',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await changePassword(
				mockEnvironmentId,
				mockUserId,
				mockAccessToken,
				mockOldPassword,
				mockNewPassword
			);

			expect(result.success).toBe(true);
			expect(result.message).toBe('Password changed successfully');
			expect(result.transactionId).toBe('txn-789');
			expect(result.timestamp).toBeDefined();
			expect(mockTrackedFetch).toHaveBeenCalledWith(
				'/api/pingone/password/change',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: mockEnvironmentId,
						userId: mockUserId,
						accessToken: mockAccessToken,
						oldPassword: mockOldPassword,
						newPassword: mockNewPassword,
					}),
				})
			);
		});

		it('should handle incorrect old password', async () => {
			const mockResponse = {
				ok: false,
				status: 401,
				json: async () => ({
					error: 'invalid_credentials',
					error_description: 'Current password is incorrect',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await changePassword(
				mockEnvironmentId,
				mockUserId,
				mockAccessToken,
				mockOldPassword,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('invalid_credentials');
			expect(result.errorDescription).toBe('Current password is incorrect');
		});

		it('should handle invalid access token', async () => {
			const mockResponse = {
				ok: false,
				status: 401,
				json: async () => ({
					error: 'invalid_token',
					error_description: 'Access token is invalid or expired',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await changePassword(
				mockEnvironmentId,
				mockUserId,
				mockAccessToken,
				mockOldPassword,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('invalid_token');
			expect(result.errorDescription).toBe('Access token is invalid or expired');
		});

		it('should handle password policy violations', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					error: 'password_policy_violation',
					error_description: 'New password does not meet complexity requirements',
					message: 'Password must contain uppercase, lowercase, number, and special character',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await changePassword(
				mockEnvironmentId,
				mockUserId,
				mockAccessToken,
				mockOldPassword,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('password_policy_violation');
			// Service prioritizes error_description over message
			expect(result.errorDescription).toBe('New password does not meet complexity requirements');
		});

		it('should handle same password error', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: async () => ({
					error: 'password_reuse',
					error_description: 'New password must be different from current password',
				}),
			};

			mockTrackedFetch.mockResolvedValueOnce(mockResponse);

			const result = await changePassword(
				mockEnvironmentId,
				mockUserId,
				mockAccessToken,
				mockOldPassword,
				mockOldPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('password_reuse');
			expect(result.errorDescription).toBe('New password must be different from current password');
		});

		it('should handle network errors', async () => {
			const networkError = new Error('Request timeout');
			mockTrackedFetch.mockRejectedValueOnce(networkError);

			const result = await changePassword(
				mockEnvironmentId,
				mockUserId,
				mockAccessToken,
				mockOldPassword,
				mockNewPassword
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('network_error');
			expect(result.errorDescription).toBe('Request timeout');
		});
	});
});
