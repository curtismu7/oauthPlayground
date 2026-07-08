/**
 * @file errorHandlerV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for ErrorHandlerV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { vi } from 'vitest';
import { ErrorHandlerV8 } from '../errorHandlerV8';

// Mock toast manager
vi.mock('../../../utils/v4ToastMessages', () => ({
	v4ToastManager: {
		showError: vi.fn(),
		showWarning: vi.fn(),
		showInfo: vi.fn(),
	},
}));

describe('ErrorHandlerV8', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('categorizeError', () => {
		it('should categorize invalid_grant error', () => {
			const error = new Error('invalid_grant: Authorization code expired');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('auth');
			expect(category.code).toBe('INVALID_GRANT');
			expect(category.userMessage).toContain('invalid or expired');
		});

		it('should categorize access_denied error', () => {
			const error = new Error('access_denied: User denied consent');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('auth');
			expect(category.code).toBe('ACCESS_DENIED');
			expect(category.userMessage).toContain('denied access');
		});

		it('should categorize invalid_client error', () => {
			const error = new Error('invalid_client: Client authentication failed');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('auth');
			expect(category.code).toBe('INVALID_CLIENT');
			expect(category.userMessage).toContain('authentication failed');
		});

		it('should categorize network error', () => {
			const error = new Error('Network request failed');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('network');
			expect(category.code).toBe('NETWORK_ERROR');
			expect(category.userMessage).toContain('Network request failed');
		});

		it('should categorize CORS error', () => {
			const error = new Error('CORS policy blocked the request');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('network');
			expect(category.code).toBe('CORS_ERROR');
			expect(category.userMessage).toContain('Cross-origin');
		});

		it('should categorize redirect URI mismatch error', () => {
			const error = new Error('redirect_uri mismatch');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('config');
			expect(category.code).toBe('REDIRECT_URI_MISMATCH');
			expect(category.userMessage).toContain('not registered');
		});

		it('should categorize validation error', () => {
			const error = new Error('Required field is missing');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('validation');
			expect(category.code).toBe('REQUIRED_FIELD_MISSING');
		});

		it('should categorize unknown error', () => {
			const error = new Error('Something completely unexpected happened');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('unknown');
			expect(category.code).toBe('UNKNOWN_ERROR');
			expect(category.userMessage).toContain('unexpected error');
		});
	});

	describe('getUserMessage', () => {
		it('should return user-friendly message for invalid_grant', () => {
			const error = new Error('invalid_grant');
			const message = ErrorHandlerV8.getUserMessage(error);

			expect(message).toContain('invalid or expired');
			expect(message).not.toContain('invalid_grant');
		});

		it('should return user-friendly message for network error', () => {
			const error = new Error('fetch failed');
			const message = ErrorHandlerV8.getUserMessage(error);

			expect(message).toContain('Network request failed');
		});

		it('should handle string errors', () => {
			const message = ErrorHandlerV8.getUserMessage('access_denied');

			expect(message).toContain('denied access');
		});
	});

	describe('getTechnicalMessage', () => {
		it('should return technical message', () => {
			const error = new Error('invalid_grant');
			const message = ErrorHandlerV8.getTechnicalMessage(error);

			expect(message).toContain('Token endpoint');
		});
	});

	describe('getRecoverySuggestions', () => {
		it('should return recovery suggestions for invalid_grant', () => {
			const error = new Error('invalid_grant');
			const suggestions = ErrorHandlerV8.getRecoverySuggestions(error);

			expect(suggestions.length).toBeGreaterThan(0);
			expect(suggestions.some((s) => s.includes('expire'))).toBe(true);
		});

		it('should return recovery suggestions for access_denied', () => {
			const error = new Error('access_denied');
			const suggestions = ErrorHandlerV8.getRecoverySuggestions(error);

			expect(suggestions.length).toBeGreaterThan(0);
			expect(suggestions.some((s) => s.includes('permission'))).toBe(true);
		});

		it('should return recovery suggestions for network error', () => {
			const error = new Error('Network request failed');
			const suggestions = ErrorHandlerV8.getRecoverySuggestions(error);

			expect(suggestions.length).toBeGreaterThan(0);
			expect(suggestions.some((s) => s.includes('internet'))).toBe(true);
		});
	});

	describe('isRecoverable', () => {
		it('should return true for network errors', () => {
			const error = new Error('Network request failed');
			expect(ErrorHandlerV8.isRecoverable(error)).toBe(true);
		});

		it('should return true for access_denied', () => {
			const error = new Error('access_denied');
			expect(ErrorHandlerV8.isRecoverable(error)).toBe(true);
		});

		it('should return true for invalid_grant', () => {
			const error = new Error('invalid_grant');
			expect(ErrorHandlerV8.isRecoverable(error)).toBe(true);
		});

		it('should return true for validation errors', () => {
			const error = new Error('Required field is missing');
			expect(ErrorHandlerV8.isRecoverable(error)).toBe(true);
		});

		it('should return false for config errors', () => {
			const error = new Error('redirect_uri mismatch');
			expect(ErrorHandlerV8.isRecoverable(error)).toBe(false);
		});

		it('should return false for invalid_client', () => {
			const error = new Error('invalid_client');
			expect(ErrorHandlerV8.isRecoverable(error)).toBe(false);
		});
	});

	describe('getSeverity', () => {
		it('should return error severity for auth errors', () => {
			const error = new Error('invalid_grant');
			expect(ErrorHandlerV8.getSeverity(error)).toBe('error');
		});

		it('should return error severity for network errors', () => {
			const error = new Error('Network request failed');
			expect(ErrorHandlerV8.getSeverity(error)).toBe('error');
		});
	});

	describe('getType', () => {
		it('should return auth type for OAuth errors', () => {
			const error = new Error('invalid_grant');
			expect(ErrorHandlerV8.getType(error)).toBe('auth');
		});

		it('should return network type for network errors', () => {
			const error = new Error('fetch failed');
			expect(ErrorHandlerV8.getType(error)).toBe('network');
		});

		it('should return validation type for validation errors', () => {
			const error = new Error('Required field missing');
			expect(ErrorHandlerV8.getType(error)).toBe('validation');
		});

		it('should return config type for config errors', () => {
			const error = new Error('redirect_uri mismatch');
			expect(ErrorHandlerV8.getType(error)).toBe('config');
		});
	});

	describe('getCode', () => {
		it('should return error code', () => {
			const error = new Error('invalid_grant');
			expect(ErrorHandlerV8.getCode(error)).toBe('INVALID_GRANT');
		});

		it('should return undefined for unknown errors', () => {
			const error = new Error('Something weird');
			expect(ErrorHandlerV8.getCode(error)).toBe('UNKNOWN_ERROR');
		});
	});

	describe('formatError', () => {
		it('should format error with recovery suggestions', () => {
			const error = new Error('invalid_grant');
			const formatted = ErrorHandlerV8.formatError(error, true);

			expect(formatted).toContain('invalid or expired');
			expect(formatted).toContain('What you can do:');
			expect(formatted).toContain('1.');
		});

		it('should format error without recovery suggestions', () => {
			const error = new Error('invalid_grant');
			const formatted = ErrorHandlerV8.formatError(error, false);

			expect(formatted).toContain('invalid or expired');
			expect(formatted).not.toContain('What you can do:');
		});

		it('should include learn more URL if available', () => {
			const error = new Error('invalid_grant');
			const formatted = ErrorHandlerV8.formatError(error, true);

			expect(formatted).toContain('Learn more:');
		});
	});

	describe('fromOAuthError', () => {
		it('should create error from OAuth error response', () => {
			const errorResponse = {
				error: 'invalid_grant',
				error_description: 'Authorization code expired',
				error_uri: 'https://example.com/docs/errors',
			};

			const error = ErrorHandlerV8.fromOAuthError(errorResponse);

			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe('Authorization code expired');
			expect(error.name).toBe('invalid_grant');
		});

		it('should use error code as message if description is missing', () => {
			const errorResponse = {
				error: 'access_denied',
			};

			const error = ErrorHandlerV8.fromOAuthError(errorResponse);

			expect(error.message).toBe('access_denied');
			expect(error.name).toBe('access_denied');
		});
	});

	describe('handleCallbackError', () => {
		it('should handle callback error', () => {
			const params = {
				error: 'access_denied',
				error_description: 'User denied consent',
			};

			const context = {
				flowType: 'authorization_code',
				step: 'callback',
				action: 'handle_callback',
			};

			// Should not throw
			expect(() => {
				ErrorHandlerV8.handleCallbackError(params, context);
			}).not.toThrow();
		});

		it('should do nothing if no error in params', () => {
			const params = {};
			const context = {
				flowType: 'authorization_code',
				step: 'callback',
				action: 'handle_callback',
			};

			// Should not throw
			expect(() => {
				ErrorHandlerV8.handleCallbackError(params, context);
			}).not.toThrow();
		});
	});

	describe('handleValidationErrors', () => {
		it('should handle multiple validation errors', () => {
			const errors = [
				{ field: 'clientId', message: 'Client ID is required' },
				{ field: 'redirectUri', message: 'Redirect URI is required' },
			];

			const context = {
				flowType: 'authorization_code',
				step: 'config',
				action: 'validate_credentials',
			};

			// Should not throw
			expect(() => {
				ErrorHandlerV8.handleValidationErrors(errors, context);
			}).not.toThrow();
		});
	});

	describe('error pattern matching', () => {
		it('should match invalid_scope error', () => {
			const error = new Error('invalid_scope: Scope not available');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('auth');
			expect(category.code).toBe('INVALID_SCOPE');
		});

		it('should match unauthorized_client error', () => {
			const error = new Error('unauthorized_client');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('auth');
			expect(category.code).toBe('UNAUTHORIZED_CLIENT');
		});

		it('should match unsupported_grant_type error', () => {
			const error = new Error('unsupported_grant_type');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('auth');
			expect(category.code).toBe('UNSUPPORTED_GRANT_TYPE');
		});

		it('should match invalid_request error', () => {
			const error = new Error('invalid_request: Missing parameter');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('validation');
			expect(category.code).toBe('INVALID_REQUEST');
		});

		it('should match ECONNREFUSED error', () => {
			const error = new Error('ECONNREFUSED: Connection refused');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('network');
			expect(category.code).toBe('NETWORK_ERROR');
		});

		it('should match ETIMEDOUT error', () => {
			const error = new Error('ETIMEDOUT: Request timed out');
			const category = ErrorHandlerV8.categorizeError(error);

			expect(category.type).toBe('network');
			expect(category.code).toBe('NETWORK_ERROR');
		});
	});

	describe('recovery suggestions', () => {
		it('should provide specific suggestions for each error type', () => {
			const errors = [
				'invalid_grant',
				'access_denied',
				'invalid_client',
				'invalid_scope',
				'Network request failed',
				'redirect_uri mismatch',
			];

			errors.forEach((errorMsg) => {
				const error = new Error(errorMsg);
				const suggestions = ErrorHandlerV8.getRecoverySuggestions(error);

				expect(suggestions.length).toBeGreaterThan(0);
				expect(suggestions.every((s) => typeof s === 'string')).toBe(true);
				expect(suggestions.every((s) => s.length > 0)).toBe(true);
			});
		});
	});
});
