// src/services/__tests__/errorHandlingService.test.ts
// Tests for the ErrorHandlingService

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHandlingService, ErrorSeverity, ErrorType } from '../errorHandlingService';

// Mock console methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorHandlingService', () => {
	beforeEach(() => {
		// Clear error store before each test
		ErrorHandlingService.clearErrorStore();
		consoleSpy.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Error Classification', () => {
		it('should classify network errors', () => {
			const networkError = new Error('Network request failed');
			const type = ErrorHandlingService.classifyError(networkError);
			expect(type).toBe(ErrorType.NETWORK);
		});

		it('should classify authentication errors', () => {
			const authError = new Error('invalid_client: Invalid client credentials');
			const type = ErrorHandlingService.classifyError(authError);
			expect(type).toBe(ErrorType.AUTHENTICATION);
		});

		it('should classify validation errors', () => {
			const validationError = new Error('invalid_request: Missing required parameter');
			const type = ErrorHandlingService.classifyError(validationError);
			expect(type).toBe(ErrorType.VALIDATION);
		});

		it('should classify timeout errors', () => {
			const timeoutError = new Error('Request timeout occurred');
			const type = ErrorHandlingService.classifyError(timeoutError);
			expect(type).toBe(ErrorType.TIMEOUT);
		});

		it('should classify server errors', () => {
			const serverError = { status: 500, message: 'Internal server error' };
			const type = ErrorHandlingService.classifyError(serverError);
			expect(type).toBe(ErrorType.SERVER_ERROR);
		});

		it('should classify rate limit errors', () => {
			const rateLimitError = { status: 429, message: 'Too many requests' };
			const type = ErrorHandlingService.classifyError(rateLimitError);
			expect(type).toBe(ErrorType.RATE_LIMIT);
		});
	});

	describe('Error Severity Determination', () => {
		it('should assign critical severity to server errors', () => {
			const severity = ErrorHandlingService.determineSeverity(ErrorType.SERVER_ERROR);
			expect(severity).toBe(ErrorSeverity.CRITICAL);
		});

		it('should assign high severity to authentication errors', () => {
			const severity = ErrorHandlingService.determineSeverity(ErrorType.AUTHENTICATION);
			expect(severity).toBe(ErrorSeverity.HIGH);
		});

		it('should assign medium severity to network errors', () => {
			const severity = ErrorHandlingService.determineSeverity(ErrorType.NETWORK);
			expect(severity).toBe(ErrorSeverity.MEDIUM);
		});

		it('should assign low severity to validation errors', () => {
			const severity = ErrorHandlingService.determineSeverity(ErrorType.VALIDATION);
			expect(severity).toBe(ErrorSeverity.LOW);
		});
	});

	describe('User-Friendly Messages', () => {
		it('should provide user-friendly network error message', () => {
			const message = ErrorHandlingService.getUserFriendlyMessage(ErrorType.NETWORK);
			expect(message).toContain('connect to the authentication service');
		});

		it('should provide user-friendly authentication error message', () => {
			const message = ErrorHandlingService.getUserFriendlyMessage(ErrorType.AUTHENTICATION);
			expect(message).toContain('Authentication failed');
		});

		it('should provide user-friendly validation error message', () => {
			const message = ErrorHandlingService.getUserFriendlyMessage(ErrorType.VALIDATION);
			expect(message).toContain('information provided is not valid');
		});
	});

	describe('Recovery Options', () => {
		it('should provide retry option for network errors', () => {
			const options = ErrorHandlingService.generateRecoveryOptions({
				type: ErrorType.NETWORK,
				severity: ErrorSeverity.MEDIUM,
				originalError: new Error('Network failed'),
				flowId: 'test-flow',
				userMessage: 'Network error',
				technicalMessage: 'Connection failed',
				timestamp: new Date(),
			});

			expect(options.length).toBeGreaterThan(0);
			expect(options.some((opt) => opt.id === 'retry')).toBe(true);
		});

		it('should provide credential verification for auth errors', () => {
			const options = ErrorHandlingService.generateRecoveryOptions({
				type: ErrorType.AUTHENTICATION,
				severity: ErrorSeverity.HIGH,
				originalError: new Error('Invalid client'),
				flowId: 'test-flow',
				userMessage: 'Auth failed',
				technicalMessage: 'Invalid credentials',
				timestamp: new Date(),
			});

			expect(options.some((opt) => opt.id === 'check-credentials')).toBe(true);
		});

		it('should determine retry eligibility', () => {
			expect(ErrorHandlingService.shouldRetry(ErrorType.NETWORK)).toBe(true);
			expect(ErrorHandlingService.shouldRetry(ErrorType.AUTHENTICATION)).toBe(false);
			expect(ErrorHandlingService.shouldRetry(ErrorType.SERVER_ERROR)).toBe(true);
		});

		it('should determine support contact eligibility', () => {
			expect(ErrorHandlingService.shouldContactSupport(ErrorType.SERVER_ERROR)).toBe(true);
			expect(ErrorHandlingService.shouldContactSupport(ErrorType.NETWORK)).toBe(false);
			expect(ErrorHandlingService.shouldContactSupport(ErrorType.UNKNOWN)).toBe(true);
		});
	});

	describe('Complete Error Handling Flow', () => {
		it('should handle network error comprehensively', () => {
			const networkError = new Error('Failed to fetch');
			const context = {
				flowId: 'test-flow',
				stepId: 'token-request',
				metadata: { url: 'https://example.com' },
			};

			const response = ErrorHandlingService.handleFlowError(networkError, context);

			expect(response.type).toBe(ErrorType.NETWORK);
			expect(response.severity).toBe(ErrorSeverity.MEDIUM);
			expect(response.shouldRetry).toBe(true);
			expect(response.contactSupport).toBe(false);
			expect(response.recoveryOptions.length).toBeGreaterThan(0);
			expect(response.correlationId).toBeDefined();
		});

		it('should handle authentication error comprehensively', () => {
			const authError = new Error('invalid_client: Bad credentials');
			const context = {
				flowId: 'oauth-flow',
				stepId: 'auth-step',
			};

			const response = ErrorHandlingService.handleFlowError(authError, context);

			expect(response.type).toBe(ErrorType.AUTHENTICATION);
			expect(response.severity).toBe(ErrorSeverity.HIGH);
			expect(response.shouldRetry).toBe(false);
			expect(response.contactSupport).toBe(false);
			expect(response.recoveryOptions.some((opt) => opt.id === 'check-credentials')).toBe(true);
		});

		it('should handle server error comprehensively', () => {
			const serverError = { status: 500, message: 'Internal server error' };
			const context = {
				flowId: 'api-flow',
			};

			const response = ErrorHandlingService.handleFlowError(serverError, context);

			expect(response.type).toBe(ErrorType.SERVER_ERROR);
			expect(response.severity).toBe(ErrorSeverity.CRITICAL);
			expect(response.shouldRetry).toBe(true);
			expect(response.contactSupport).toBe(true);
		});
	});

	describe('Error Analytics', () => {
		it('should track error analytics', () => {
			// First error
			ErrorHandlingService.handleFlowError(new Error('Network failed'), {
				flowId: 'test-flow',
			});

			// Second error of same type
			ErrorHandlingService.handleFlowError(new Error('Connection timeout'), {
				flowId: 'test-flow',
			});

			const analytics = ErrorHandlingService.getErrorAnalytics();
			const networkAnalytics = analytics.find((a) => a.errorType === ErrorType.NETWORK);

			expect(networkAnalytics).toBeDefined();
			expect(networkAnalytics!.frequency).toBe(2);
		});

		it('should provide recent error history', () => {
			ErrorHandlingService.handleFlowError(new Error('Test error 1'), {
				flowId: 'flow-1',
			});

			ErrorHandlingService.handleFlowError(new Error('Test error 2'), {
				flowId: 'flow-2',
			});

			const recentErrors = ErrorHandlingService.getRecentErrors(5);
			expect(recentErrors.length).toBe(2);
			expect(recentErrors[0].flowId).toBe('flow-2'); // Most recent first
			expect(recentErrors[1].flowId).toBe('flow-1');
		});
	});

	describe('Logging and Reporting', () => {
		it('should log errors with proper format', () => {
			const testError = new Error('Test error message');

			ErrorHandlingService.handleFlowError(testError, {
				flowId: 'test-flow',
				stepId: 'test-step',
			});

			expect(consoleSpy).toHaveBeenCalled();
			const logCall = consoleSpy.mock.calls[0][1]; // Second argument to console.error
			expect(logCall).toHaveProperty('level');
			expect(logCall).toHaveProperty('errorType');
			expect(logCall).toHaveProperty('severity');
			expect(logCall).toHaveProperty('flowId', 'test-flow');
			expect(logCall).toHaveProperty('stepId', 'test-step');
		});
	});
});
