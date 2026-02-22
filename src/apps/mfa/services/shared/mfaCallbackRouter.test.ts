/**
 * @file mfaCallbackRouter.test.ts
 * @module apps/mfa/services/shared
 * @description Unit tests for MFA Callback Router
 * @version 8.0.0
 * @since 2026-02-20
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthenticationCallbackHandler } from '@/apps/mfa/services/authentication/authenticationCallbackHandler';
import { RegistrationCallbackHandler } from '@/apps/mfa/services/registration/registrationCallbackHandler';
import type { CallbackRoutingResult, MFACallbackData } from '@/apps/mfa/types/mfaFlowTypes';
import { MFACallbackRouter } from './mfaCallbackRouter';

// Mock the callback handlers
jest.mock('@/apps/mfa/services/registration/registrationCallbackHandler');
jest.mock('@/apps/mfa/services/authentication/authenticationCallbackHandler');

describe('MFACallbackRouter', () => {
	const mockRegistrationHandler = RegistrationCallbackHandler as jest.Mocked<
		typeof RegistrationCallbackHandler
	>;
	const mockAuthenticationHandler = AuthenticationCallbackHandler as jest.Mocked<
		typeof AuthenticationCallbackHandler
	>;

	beforeEach(() => {
		jest.clearAllMocks();
		MFACallbackRouter.clearHandlers();
	});

	describe('registerCallbackHandler', () => {
		it('should register registration callback handler', () => {
			const handler = jest.fn();

			MFACallbackRouter.registerCallbackHandler('registration', handler);

			expect(() =>
				MFACallbackRouter.registerCallbackHandler('registration', handler)
			).not.toThrow();
		});

		it('should register authentication callback handler', () => {
			const handler = jest.fn();

			MFACallbackRouter.registerCallbackHandler('authentication', handler);

			expect(() =>
				MFACallbackRouter.registerCallbackHandler('authentication', handler)
			).not.toThrow();
		});

		it('should throw error for invalid flow type', () => {
			const handler = jest.fn();

			expect(() => {
				MFACallbackRouter.registerCallbackHandler('invalid' as any, handler);
			}).toThrow('Invalid flow type: invalid');
		});
	});

	describe('unregisterCallbackHandler', () => {
		it('should unregister callback handler', () => {
			const handler = jest.fn();

			MFACallbackRouter.registerCallbackHandler('registration', handler);
			MFACallbackRouter.unregisterCallbackHandler('registration');

			expect(() => MFACallbackRouter.unregisterCallbackHandler('registration')).not.toThrow();
		});

		it('should handle unregistering non-existent handler', () => {
			expect(() => {
				MFACallbackRouter.unregisterCallbackHandler('registration');
			}).not.toThrow();
		});
	});

	describe('detectFlowType', () => {
		it('should detect registration flow from URL', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/register/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const flowType = MFACallbackRouter.detectFlowType(callbackData);
			expect(flowType).toBe('registration');
		});

		it('should detect authentication flow from URL', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/auth/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const flowType = MFACallbackRouter.detectFlowType(callbackData);
			expect(flowType).toBe('authentication');
		});

		it('should detect flow type from headers', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/callback',
				method: 'POST',
				headers: {
					'X-Flow-Type': 'registration',
				},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const flowType = MFACallbackRouter.detectFlowType(callbackData);
			expect(flowType).toBe('registration');
		});

		it('should detect flow type from data', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/callback',
				method: 'POST',
				headers: {},
				data: {
					flowType: 'authentication',
				},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const flowType = MFACallbackRouter.detectFlowType(callbackData);
			expect(flowType).toBe('authentication');
		});

		it('should return unknown for undetectable flow', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const flowType = MFACallbackRouter.detectFlowType(callbackData);
			expect(flowType).toBe('unknown');
		});
	});

	describe('extractCallbackData', () => {
		it('should extract data from URL parameters', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback?code=123&state=test',
				method: 'GET',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const extractedData = MFACallbackRouter.extractCallbackData(callbackData);
			expect(extractedData).toEqual({
				code: '123',
				state: 'test',
			});
		});

		it('should extract data from request body', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback',
				method: 'POST',
				headers: {},
				data: {
					challengeId: 'abc123',
					response: 'test-response',
				},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const extractedData = MFACallbackRouter.extractCallbackData(callbackData);
			expect(extractedData).toEqual({
				challengeId: 'abc123',
				response: 'test-response',
			});
		});

		it('should handle empty data', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback',
				method: 'GET',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const extractedData = MFACallbackRouter.extractCallbackData(callbackData);
			expect(extractedData).toEqual({});
		});
	});

	describe('routeCallback', () => {
		it('should route registration callback to registration handler', async () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/register/callback',
				method: 'POST',
				headers: {},
				data: {
					flowType: 'registration',
				},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const mockResult: CallbackRoutingResult = {
				success: true,
				flowType: 'registration',
				targetStep: 1,
				flowState: {} as any,
				navigationAction: 'forward',
			};

			mockRegistrationHandler.process.mockResolvedValue(mockResult);

			const result = await MFACallbackRouter.routeCallback(callbackData);

			expect(result).toEqual(mockResult);
			expect(mockRegistrationHandler.process).toHaveBeenCalledWith(
				callbackData,
				expect.any(Object) // flowState
			);
		});

		it('should route authentication callback to authentication handler', async () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/auth/callback',
				method: 'POST',
				headers: {},
				data: {
					flowType: 'authentication',
				},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const mockResult: CallbackRoutingResult = {
				success: true,
				flowType: 'authentication',
				targetStep: 2,
				flowState: {} as any,
				navigationAction: 'forward',
			};

			mockAuthenticationHandler.process.mockResolvedValue(mockResult);

			const result = await MFACallbackRouter.routeCallback(callbackData);

			expect(result).toEqual(mockResult);
			expect(mockAuthenticationHandler.process).toHaveBeenCalledWith(
				callbackData,
				expect.any(Object) // flowState
			);
		});

		it('should handle unknown flow type', async () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			const result = await MFACallbackRouter.routeCallback(callbackData);

			expect(result.success).toBe(false);
			expect(result.error?.type).toBe('validation');
			expect(result.error?.message).toContain('Unable to determine flow type');
		});

		it('should handle missing handler', async () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/register/callback',
				method: 'POST',
				headers: {},
				data: {
					flowType: 'registration',
				},
				state: 'test-state',
				timestamp: Date.now(),
			};

			// Don't register any handlers
			const result = await MFACallbackRouter.routeCallback(callbackData);

			expect(result.success).toBe(false);
			expect(result.error?.type).toBe('validation');
			expect(result.error?.message).toContain('No handler registered');
		});

		it('should handle handler errors', async () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/mfa/register/callback',
				method: 'POST',
				headers: {},
				data: {
					flowType: 'registration',
				},
				state: 'test-state',
				timestamp: Date.now(),
			};

			mockRegistrationHandler.process.mockRejectedValue(new Error('Handler error'));

			const result = await MFACallbackRouter.routeCallback(callbackData);

			expect(result.success).toBe(false);
			expect(result.error?.type).toBe('network');
			expect(result.error?.message).toContain('Failed to process callback');
		});
	});

	describe('validateCallback', () => {
		it('should validate valid callback', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			};

			expect(() => MFACallbackRouter.validateCallback(callbackData)).not.toThrow();
		});

		it('should reject callback without URL', () => {
			const callbackData = {
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now(),
			} as MFACallbackData;

			expect(() => MFACallbackRouter.validateCallback(callbackData)).toThrow(
				'Invalid callback data: missing required fields'
			);
		});

		it('should reject callback without timestamp', () => {
			const callbackData = {
				url: 'https://example.com/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
			} as MFACallbackData;

			expect(() => MFACallbackRouter.validateCallback(callbackData)).toThrow(
				'Invalid callback data: missing required fields'
			);
		});

		it('should reject old callbacks', () => {
			const callbackData: MFACallbackData = {
				url: 'https://example.com/callback',
				method: 'POST',
				headers: {},
				data: {},
				state: 'test-state',
				timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
			};

			expect(() => MFACallbackRouter.validateCallback(callbackData)).toThrow(
				'Invalid callback data: callback timestamp is too old'
			);
		});
	});

	describe('clearHandlers', () => {
		it('should clear all registered handlers', () => {
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			MFACallbackRouter.registerCallbackHandler('registration', handler1);
			MFACallbackRouter.registerCallbackHandler('authentication', handler2);
			MFACallbackRouter.clearHandlers();

			// Should not throw when trying to unregister after clearing
			expect(() => MFACallbackRouter.unregisterCallbackHandler('registration')).not.toThrow();
			expect(() => MFACallbackRouter.unregisterCallbackHandler('authentication')).not.toThrow();
		});
	});

	describe('getRegisteredHandlers', () => {
		it('should return list of registered flow types', () => {
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			MFACallbackRouter.registerCallbackHandler('registration', handler1);
			MFACallbackRouter.registerCallbackHandler('authentication', handler2);

			const handlers = MFACallbackRouter.getRegisteredHandlers();

			expect(handlers).toContain('registration');
			expect(handlers).toContain('authentication');
			expect(handlers).toHaveLength(2);
		});

		it('should return empty array when no handlers registered', () => {
			const handlers = MFACallbackRouter.getRegisteredHandlers();
			expect(handlers).toEqual([]);
		});
	});
});
