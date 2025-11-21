// tests/backend/password-reset.test.js
// Backend tests for password reset API endpoints

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

describe('Password Reset API Endpoints', () => {
	const mockEnvironmentId = 'test-env-123';
	const mockUserId = 'test-user-456';
	const mockWorkerToken = 'test-worker-token-789';
	const mockAccessToken = 'test-access-token-101';
	const mockRecoveryCode = '123456';
	const mockOldPassword = 'OldPassw0rd!';
	const mockNewPassword = 'N3wPassw0rd!?';

	beforeEach(() => {
		// Reset fetch mock before each test
		// The mock is set up in setup.js, but we need to ensure it's still a jest mock
		if (global.fetch && typeof global.fetch.mockClear === 'function') {
			global.fetch.mockClear();
		}
		// Ensure both global and globalThis point to the same mock
		globalThis.fetch = global.fetch;
	});

	describe('POST /api/pingone/password/send-recovery-code', () => {
		it('should reject requests without environmentId', async () => {
			const response = await request(app)
				.post('/api/pingone/password/send-recovery-code')
				.send({
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should reject requests without userId', async () => {
			const response = await request(app)
				.post('/api/pingone/password/send-recovery-code')
				.send({
					environmentId: mockEnvironmentId,
					workerToken: mockWorkerToken,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should reject requests without workerToken', async () => {
			const response = await request(app)
				.post('/api/pingone/password/send-recovery-code')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should send recovery code successfully', async () => {
			// Ensure mock is set up
			globalThis.fetch = global.fetch;

			// Mock successful PingOne response (204 No Content or 200 OK)
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/send-recovery-code')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Recovery code sent successfully');

			// Verify fetch was called with correct parameters
			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password/recovery`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockWorkerToken}`,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					}),
				})
			);
		});

		it('should handle PingOne API error', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: () =>
					Promise.resolve({
						error: 'user_not_found',
						error_description: 'User does not exist',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/send-recovery-code')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(404);

			expect(response.body.error).toBe('user_not_found');
			expect(response.body.error_description).toBe('User does not exist');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Network error'));

			const response = await request(app)
				.post('/api/pingone/password/send-recovery-code')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
			expect(response.body.error_description).toBe('Internal server error');
		});
	});

	describe('POST /api/pingone/password/recover', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.post('/api/pingone/password/recover')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should recover password successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						id: 'txn-123',
						success: true,
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/recover')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					recoveryCode: mockRecoveryCode,
					newPassword: mockNewPassword,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password recovered successfully');
			expect(response.body.transactionId).toBe('txn-123');

			// Verify fetch was called with correct parameters
			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockWorkerToken}`,
						'Content-Type': 'application/vnd.pingidentity.password.recover+json',
						Accept: 'application/json',
					}),
					body: JSON.stringify({
						recoveryCode: mockRecoveryCode,
						newPassword: mockNewPassword,
					}),
				})
			);
		});

		it('should handle invalid recovery code', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						error: 'invalid_recovery_code',
						error_description: 'Recovery code is invalid or expired',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/recover')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					recoveryCode: mockRecoveryCode,
					newPassword: mockNewPassword,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_recovery_code');
			expect(response.body.error_description).toBe('Recovery code is invalid or expired');
		});

		it('should handle password policy violations', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						error: 'password_policy_violation',
						error_description: 'Password does not meet policy requirements',
						message: 'Password must be at least 8 characters',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/recover')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					recoveryCode: mockRecoveryCode,
					newPassword: 'weak',
				})
				.expect(400);

			expect(response.body.error).toBe('password_policy_violation');
			expect(response.body.error_description).toBe('Password must be at least 8 characters');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Connection timeout'));

			const response = await request(app)
				.post('/api/pingone/password/recover')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					recoveryCode: mockRecoveryCode,
					newPassword: mockNewPassword,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
			expect(response.body.error_description).toBe('Internal server error');
		});
	});

	describe('POST /api/pingone/password/force-change', () => {
		it('should reject requests without environmentId', async () => {
			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should reject requests without userId', async () => {
			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					environmentId: mockEnvironmentId,
					workerToken: mockWorkerToken,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should reject requests without workerToken', async () => {
			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should force password change successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						id: 'txn-456',
						success: true,
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe(
				'User will be required to change password on next sign-on'
			);
			expect(response.body.transactionId).toBe('txn-456');

			// Verify fetch was called with correct parameters
			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockWorkerToken}`,
						'Content-Type': 'application/vnd.pingidentity.password.forceChange+json',
						Accept: 'application/json',
					}),
					body: JSON.stringify({
						forceChange: true,
					}),
				})
			);
		});

		it('should handle unauthorized access', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 403,
				json: () =>
					Promise.resolve({
						error: 'insufficient_privileges',
						error_description: 'Worker token does not have required permissions',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(403);

			expect(response.body.error).toBe('insufficient_privileges');
			expect(response.body.error_description).toBe(
				'Worker token does not have required permissions'
			);
		});

		it('should handle user not found', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: () =>
					Promise.resolve({
						error: 'user_not_found',
						error_description: 'User does not exist',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(404);

			expect(response.body.error).toBe('user_not_found');
			expect(response.body.error_description).toBe('User does not exist');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Failed to connect'));

			const response = await request(app)
				.post('/api/pingone/password/force-change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
			expect(response.body.error_description).toBe('Internal server error');
		});
	});

	describe('POST /api/pingone/password/change', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should change password successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						id: 'txn-789',
						success: true,
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					accessToken: mockAccessToken,
					oldPassword: mockOldPassword,
					newPassword: mockNewPassword,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password changed successfully');
			expect(response.body.transactionId).toBe('txn-789');

			// Verify fetch was called with correct parameters
			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockAccessToken}`,
						'Content-Type': 'application/vnd.pingidentity.password.change+json',
						Accept: 'application/json',
					}),
					body: JSON.stringify({
						oldPassword: mockOldPassword,
						newPassword: mockNewPassword,
					}),
				})
			);
		});

		it('should handle incorrect old password', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: () =>
					Promise.resolve({
						error: 'invalid_credentials',
						error_description: 'Current password is incorrect',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					accessToken: mockAccessToken,
					oldPassword: 'wrong-password',
					newPassword: mockNewPassword,
				})
				.expect(401);

			expect(response.body.error).toBe('invalid_credentials');
			expect(response.body.error_description).toBe('Current password is incorrect');
		});

		it('should handle invalid access token', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: () =>
					Promise.resolve({
						error: 'invalid_token',
						error_description: 'Access token is invalid or expired',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					accessToken: 'invalid-token',
					oldPassword: mockOldPassword,
					newPassword: mockNewPassword,
				})
				.expect(401);

			expect(response.body.error).toBe('invalid_token');
			expect(response.body.error_description).toBe('Access token is invalid or expired');
		});

		it('should handle password policy violations', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						error: 'password_policy_violation',
						error_description: 'New password does not meet complexity requirements',
						message: 'Password must contain uppercase, lowercase, number, and special character',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					accessToken: mockAccessToken,
					oldPassword: mockOldPassword,
					newPassword: 'weak',
				})
				.expect(400);

			expect(response.body.error).toBe('password_policy_violation');
			expect(response.body.error_description).toBe(
				'Password must contain uppercase, lowercase, number, and special character'
			);
		});

		it('should handle password reuse error', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						error: 'password_reuse',
						error_description: 'New password must be different from current password',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					accessToken: mockAccessToken,
					oldPassword: mockOldPassword,
					newPassword: mockOldPassword,
				})
				.expect(400);

			expect(response.body.error).toBe('password_reuse');
			expect(response.body.error_description).toBe(
				'New password must be different from current password'
			);
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Request timeout'));

			const response = await request(app)
				.post('/api/pingone/password/change')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					accessToken: mockAccessToken,
					oldPassword: mockOldPassword,
					newPassword: mockNewPassword,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
			expect(response.body.error_description).toBe('Internal server error');
		});
	});
});
