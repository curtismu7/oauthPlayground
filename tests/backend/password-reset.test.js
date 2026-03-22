// tests/backend/password-reset.test.js
// Backend tests for password reset API endpoints

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
			expect(response.body.error_description).toBe('Password does not meet policy requirements');
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
				'New password does not meet complexity requirements'
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

	describe('POST /api/pingone/password/check', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.post('/api/pingone/password/check')
				.send({ environmentId: mockEnvironmentId, userId: mockUserId })
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should check password successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ valid: true }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/check')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					password: mockOldPassword,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password check successful');
			expect(response.body.valid).toBe(true);

			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password/check`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockWorkerToken}`,
						'Content-Type': 'application/vnd.pingidentity.password.check+json',
					}),
					body: JSON.stringify({ password: mockOldPassword }),
				})
			);
		});

		it('should return false when password is invalid', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						error: 'password_invalid',
						error_description: 'Password is incorrect',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/check')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					password: 'WrongPassword!',
				})
				.expect(400);

			expect(response.body.error).toBe('password_invalid');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

			const response = await request(app)
				.post('/api/pingone/password/check')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					password: mockOldPassword,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
		});
	});

	describe('PUT /api/pingone/password/set', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.put('/api/pingone/password/set')
				.send({ environmentId: mockEnvironmentId, userId: mockUserId })
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should set password successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-set-123' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password set successfully');
			expect(response.body.transactionId).toBe('txn-set-123');

			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password`,
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						'Content-Type': 'application/vnd.pingidentity.password.set+json',
					}),
				})
			);
		});

		it('should include forceChange and bypassPasswordPolicy when provided', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-456' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			await request(app)
				.put('/api/pingone/password/set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
					forceChange: true,
					bypassPasswordPolicy: true,
				})
				.expect(200);

			const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
			expect(callBody.forceChange).toBe(true);
			expect(callBody.bypassPasswordPolicy).toBe(true);
		});

		it('should handle password policy violations', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: () =>
					Promise.resolve({
						error: 'password_policy_violation',
						error_description: 'Password does not meet policy requirements',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: 'weak',
				})
				.expect(422);

			expect(response.body.error).toBe('password_policy_violation');
		});
	});

	describe('PUT /api/pingone/password/set-value', () => {
		it('should reject requests without passwordValue', async () => {
			const response = await request(app)
				.put('/api/pingone/password/set-value')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
		});

		it('should set password value successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-sv-123' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/set-value')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					passwordValue: mockNewPassword,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password value set successfully');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

			const response = await request(app)
				.put('/api/pingone/password/set-value')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					passwordValue: mockNewPassword,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
		});
	});

	describe('PUT /api/pingone/password/ldap-gateway', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.put('/api/pingone/password/ldap-gateway')
				.send({ environmentId: mockEnvironmentId, userId: mockUserId })
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
		});

		it('should set password via LDAP gateway successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-ldap-123' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/ldap-gateway')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
					ldapGatewayId: 'gateway-abc-123',
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password set successfully via LDAP Gateway');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/vnd.pingidentity.password.ldapGateway+json',
					}),
				})
			);
		});

		it('should include ldapGatewayId in request body when provided', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-ldap-456' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			await request(app)
				.put('/api/pingone/password/ldap-gateway')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
					ldapGatewayId: 'my-gateway-id',
				})
				.expect(200);

			const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
			expect(callBody.ldapGatewayId).toBe('my-gateway-id');
		});

		it('should handle unauthorized LDAP gateway', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: () =>
					Promise.resolve({
						error: 'unauthorized',
						error_description: 'Invalid gateway credentials',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/ldap-gateway')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
				})
				.expect(401);

			expect(response.body.error).toBe('unauthorized');
		});
	});

	describe('POST /api/pingone/password/unlock', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.post('/api/pingone/password/unlock')
				.send({ environmentId: mockEnvironmentId })
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required parameters');
		});

		it('should unlock password successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/unlock')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Password unlocked successfully');

			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/vnd.pingidentity.password.unlock+json',
						Authorization: `Bearer ${mockWorkerToken}`,
					}),
				})
			);
		});

		it('should handle already unlocked account', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						error: 'account_not_locked',
						error_description: 'Account is not currently locked',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/unlock')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(400);

			expect(response.body.error).toBe('account_not_locked');
		});

		it('should handle user not found', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: () =>
					Promise.resolve({ error: 'user_not_found', error_description: 'User does not exist' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.post('/api/pingone/password/unlock')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(404);

			expect(response.body.error).toBe('user_not_found');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Service unavailable'));

			const response = await request(app)
				.post('/api/pingone/password/unlock')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
		});
	});

	describe('GET /api/pingone/password/state', () => {
		it('should reject requests without required query parameters', async () => {
			const response = await request(app)
				.get('/api/pingone/password/state')
				.query({ environmentId: mockEnvironmentId })
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
			expect(response.body.error_description).toContain('Missing required query parameters');
		});

		it('should return password state successfully', async () => {
			const mockPasswordState = {
				status: 'OK',
				locked: false,
				expired: false,
				mustChange: false,
				lastChanged: '2025-01-15T10:30:00Z',
			};

			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve(mockPasswordState),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.get('/api/pingone/password/state')
				.query({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.passwordState).toEqual(mockPasswordState);
			expect(response.body.passwordState.locked).toBe(false);

			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.pingone.com/v1/environments/${mockEnvironmentId}/users/${mockUserId}/password`,
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockWorkerToken}`,
						Accept: 'application/json',
					}),
				})
			);
		});

		it('should return locked password state', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						status: 'LOCKED',
						locked: true,
						lockedAt: '2025-01-20T08:00:00Z',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.get('/api/pingone/password/state')
				.query({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(200);

			expect(response.body.passwordState.locked).toBe(true);
			expect(response.body.passwordState.status).toBe('LOCKED');
		});

		it('should handle unauthorized access', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: () =>
					Promise.resolve({ error: 'unauthorized', error_description: 'Invalid worker token' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.get('/api/pingone/password/state')
				.query({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: 'invalid-token',
				})
				.expect(401);

			expect(response.body.error).toBe('unauthorized');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

			const response = await request(app)
				.get('/api/pingone/password/state')
				.query({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
		});
	});

	describe('PUT /api/pingone/password/admin-set', () => {
		it('should reject requests without required parameters', async () => {
			const response = await request(app)
				.put('/api/pingone/password/admin-set')
				.send({ environmentId: mockEnvironmentId, userId: mockUserId })
				.expect(400);

			expect(response.body.error).toBe('invalid_request');
		});

		it('should admin-set password successfully', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-admin-123' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/admin-set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.transactionId).toBe('txn-admin-123');
		});

		it('should forward forceChange flag to PingOne', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 'txn-admin-456' }),
				headers: new Map([['content-type', 'application/json']]),
			});

			await request(app)
				.put('/api/pingone/password/admin-set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
					forceChange: true,
				})
				.expect(200);

			const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
			expect(callBody.forceChange).toBe(true);
		});

		it('should handle password policy violations', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: () =>
					Promise.resolve({
						error: 'password_policy_violation',
						error_description: 'Password does not meet complexity requirements',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/admin-set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: 'simple',
				})
				.expect(422);

			expect(response.body.error).toBe('password_policy_violation');
		});

		it('should handle unauthorized access', async () => {
			global.fetch.mockResolvedValueOnce({
				ok: false,
				status: 403,
				json: () =>
					Promise.resolve({
						error: 'insufficient_scope',
						error_description: 'Worker token lacks admin scope',
					}),
				headers: new Map([['content-type', 'application/json']]),
			});

			const response = await request(app)
				.put('/api/pingone/password/admin-set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
				})
				.expect(403);

			expect(response.body.error).toBe('insufficient_scope');
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce(new Error('Connection reset'));

			const response = await request(app)
				.put('/api/pingone/password/admin-set')
				.send({
					environmentId: mockEnvironmentId,
					userId: mockUserId,
					workerToken: mockWorkerToken,
					newPassword: mockNewPassword,
				})
				.expect(500);

			expect(response.body.error).toBe('server_error');
		});
	});
});
