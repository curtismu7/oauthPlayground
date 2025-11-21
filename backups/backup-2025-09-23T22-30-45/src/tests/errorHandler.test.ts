import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ErrorCategory,
	ErrorHandler,
	ErrorSeverity,
	errorHandler,
	handleAsyncError,
	handleSyncError,
	withAsyncErrorHandling,
	withErrorHandling,
} from '../utils/errorHandler';

// Mock the logger
vi.mock('../utils/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		success: vi.fn(),
	},
}));

describe('ErrorHandler', () => {
	let handler: ErrorHandler;

	beforeEach(() => {
		handler = new ErrorHandler();
		vi.clearAllMocks();
	});

	describe('handleError', () => {
		it('should handle HTTP error responses', () => {
			const error = {
				response: {
					status: 400,
					data: {
						error: 'invalid_request',
						error_description: 'Invalid request parameters',
					},
				},
			};

			const result = handler.handleError(error, 'test context');

			expect(result.code).toBe('HTTP_400');
			expect(result.message).toBe('invalid_request');
			expect(result.description).toBe('Invalid request parameters');
			expect(result.context).toBe('test context');
		});

		it('should handle network errors', () => {
			const error = {
				request: {},
				message: 'Network Error',
			};

			const result = handler.handleError(error, 'test context');

			expect(result.code).toBe('NETWORK_ERROR');
			expect(result.message).toBe('Network Error');
			expect(result.description).toBe(
				'Unable to connect to the server. Please check your internet connection.'
			);
		});

		it('should handle generic errors', () => {
			const error = new Error('Something went wrong');

			const result = handler.handleError(error, 'test context');

			expect(result.code).toBe('GENERIC_ERROR');
			expect(result.message).toBe('Something went wrong');
			expect(result.description).toBe('An unexpected error occurred');
		});

		it('should handle string errors', () => {
			const result = handler.handleError('String error', 'test context');

			expect(result.code).toBe('UNKNOWN_ERROR');
			expect(result.message).toBe('String error');
			expect(result.description).toBe('An error occurred');
		});

		it('should include user and session information', () => {
			const error = new Error('Test error');
			const result = handler.handleError(error, 'test context', 'user123', 'session456');

			expect(result.userId).toBe('user123');
			expect(result.sessionId).toBe('session456');
		});
	});

	describe('getUserFriendlyMessage', () => {
		it('should return user-friendly message for known error codes', () => {
			const error = { code: 'NETWORK_ERROR', message: 'Network Error' } as any;
			const message = handler.getUserFriendlyMessage(error);

			expect(message).toBe(
				'Unable to connect to the server. Please check your internet connection and try again.'
			);
		});

		it('should return original message for unknown error codes', () => {
			const error = { code: 'UNKNOWN_CODE', message: 'Original message' } as any;
			const message = handler.getUserFriendlyMessage(error);

			expect(message).toBe('Original message');
		});
	});

	describe('getErrorSeverity', () => {
		it('should return correct severity for different error types', () => {
			const networkError = { code: 'NETWORK_ERROR' } as any;
			const securityError = { code: 'SECURITY_ERROR' } as any;
			const validationError = { code: 'VALIDATION_ERROR' } as any;

			expect(handler.getErrorSeverity(networkError)).toBe(ErrorSeverity.MEDIUM);
			expect(handler.getErrorSeverity(securityError)).toBe(ErrorSeverity.CRITICAL);
			expect(handler.getErrorSeverity(validationError)).toBe(ErrorSeverity.LOW);
		});
	});

	describe('getErrorCategory', () => {
		it('should return correct category for different error types', () => {
			const networkError = { code: 'NETWORK_ERROR' } as any;
			const oauthError = { code: 'OAUTH_INVALID_CLIENT' } as any;
			const tokenError = { code: 'TOKEN_INVALID' } as any;

			expect(handler.getErrorCategory(networkError)).toBe(ErrorCategory.NETWORK);
			expect(handler.getErrorCategory(oauthError)).toBe(ErrorCategory.OAUTH);
			expect(handler.getErrorCategory(tokenError)).toBe(ErrorCategory.TOKEN);
		});
	});

	describe('retry', () => {
		it('should retry function on failure', async () => {
			let attempts = 0;
			const failingFunction = async () => {
				attempts++;
				if (attempts < 3) {
					throw new Error('Temporary failure');
				}
				return 'success';
			};

			const result = await handler.retry(failingFunction, 'test context', 3, 10);

			expect(result).toBe('success');
			expect(attempts).toBe(3);
		});

		it('should throw error after max retries', async () => {
			const failingFunction = async () => {
				throw new Error('Permanent failure');
			};

			await expect(handler.retry(failingFunction, 'test context', 2, 10)).rejects.toThrow(
				'Permanent failure'
			);
		});
	});

	describe('error history', () => {
		it('should track error history', () => {
			const error1 = new Error('Error 1');
			const error2 = new Error('Error 2');

			handler.handleError(error1, 'context1');
			handler.handleError(error2, 'context2');

			const history = handler.getErrorHistory();
			expect(history).toHaveLength(2);
			expect(history[0].message).toBe('Error 2');
			expect(history[1].message).toBe('Error 1');
		});

		it('should limit error history size', () => {
			// Add more errors than max history size
			for (let i = 0; i < 150; i++) {
				handler.handleError(new Error(`Error ${i}`), 'context');
			}

			const history = handler.getErrorHistory();
			expect(history).toHaveLength(100); // maxHistorySize
		});

		it('should clear error history', () => {
			handler.handleError(new Error('Test error'), 'context');
			expect(handler.getErrorHistory()).toHaveLength(1);

			handler.clearErrorHistory();
			expect(handler.getErrorHistory()).toHaveLength(0);
		});
	});

	describe('error statistics', () => {
		it('should provide error statistics', () => {
			handler.handleError(new Error('Network error'), 'context');
			handler.handleError(new Error('Validation error'), 'context');
			handler.handleError(new Error('Security error'), 'context');

			const stats = handler.getErrorStatistics();

			expect(stats.total).toBe(3);
			expect(stats.byCategory[ErrorCategory.NETWORK]).toBe(1);
			expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1);
			expect(stats.byCategory[ErrorCategory.SECURITY]).toBe(1);
		});
	});
});

describe('Utility Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleAsyncError', () => {
		it('should handle async function errors', async () => {
			const asyncFunction = async () => {
				throw new Error('Async error');
			};

			await expect(handleAsyncError(asyncFunction, 'test context')).rejects.toThrow('Async error');
		});

		it('should return result for successful async function', async () => {
			const asyncFunction = async () => {
				return 'success';
			};

			const result = await handleAsyncError(asyncFunction, 'test context');
			expect(result).toBe('success');
		});
	});

	describe('handleSyncError', () => {
		it('should handle sync function errors', () => {
			const syncFunction = () => {
				throw new Error('Sync error');
			};

			expect(() => handleSyncError(syncFunction, 'test context')).toThrow('Sync error');
		});

		it('should return result for successful sync function', () => {
			const syncFunction = () => {
				return 'success';
			};

			const result = handleSyncError(syncFunction, 'test context');
			expect(result).toBe('success');
		});
	});

	describe('withErrorHandling', () => {
		it('should wrap function with error handling', () => {
			const originalFunction = (a: number, b: number) => {
				if (a === 0) throw new Error('Division by zero');
				return a / b;
			};

			const wrappedFunction = withErrorHandling(originalFunction, 'division');

			expect(wrappedFunction(10, 2)).toBe(5);
			expect(() => wrappedFunction(0, 2)).toThrow('Division by zero');
		});
	});

	describe('withAsyncErrorHandling', () => {
		it('should wrap async function with error handling', async () => {
			const originalFunction = async (a: number, b: number) => {
				if (a === 0) throw new Error('Division by zero');
				return a / b;
			};

			const wrappedFunction = withAsyncErrorHandling(originalFunction, 'async division');

			expect(await wrappedFunction(10, 2)).toBe(5);
			await expect(wrappedFunction(0, 2)).rejects.toThrow('Division by zero');
		});
	});
});

describe('Global Error Handler', () => {
	it('should be an instance of ErrorHandler', () => {
		expect(errorHandler).toBeInstanceOf(ErrorHandler);
	});

	it('should have default configuration', () => {
		const config = errorHandler.getConfig();

		expect(config.enableLogging).toBe(true);
		expect(config.enableReporting).toBe(true);
		expect(config.enableUserNotification).toBe(true);
		expect(config.maxRetries).toBe(3);
		expect(config.retryDelay).toBe(1000);
	});
});
