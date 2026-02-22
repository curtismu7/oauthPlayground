/**
 * @file mfaErrorHandler.test.ts
 * @module apps/mfa/services/shared
 * @description Unit tests for MFA Error Handler
 * @version 8.0.0
 * @since 2026-02-20
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
	CallbackValidationError,
	NetworkError,
	StateCorruptionError,
} from '@/apps/mfa/types/mfaFlowTypes';
import { ErrorSeverity, MFAError, MFAErrorHandler, RecoveryStrategy } from './mfaErrorHandler';

// Mock toast notifications
jest.mock('@/v8/utils/toastNotificationsV8', () => ({
	toastV8: {
		error: jest.fn(),
		warning: jest.fn(),
		info: jest.fn(),
		success: jest.fn(),
	},
}));

describe('MFAErrorHandler', () => {
	const mockContext = {
		flowType: 'registration' as const,
		currentStep: 1,
		stepName: 'Device Type Selection',
		timestamp: Date.now(),
		userId: 'test-user',
		environmentId: 'test-env',
		deviceType: 'SMS',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('handleError', () => {
		it('should handle generic errors and create MFAError', () => {
			const error = new Error('Test error');
			const result = MFAErrorHandler.handleError(error, mockContext);

			expect(result).toBeInstanceOf(MFAError);
			expect(result.message).toBe('Test error');
			expect(result.context).toEqual(mockContext);
			expect(result.severity).toBe(ErrorSeverity.MEDIUM);
		});

		it('should determine severity based on error type', () => {
			const stateError = new StateCorruptionError('State corrupted');
			const result = MFAErrorHandler.handleError(stateError, mockContext);

			expect(result.severity).toBe(ErrorSeverity.HIGH);
			expect(result.recoveryOptions.strategy).toBe(RecoveryStrategy.RESTART_FLOW);
		});

		it('should log error for monitoring', () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			const error = new Error('Test error');

			MFAErrorHandler.handleError(error, mockContext);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('[🛡️ MFA-ERROR-HANDLER] Error logged:'),
				expect.objectContaining({
					severity: ErrorSeverity.MEDIUM,
					flowType: 'registration',
					message: 'Test error',
				})
			);

			consoleSpy.mockRestore();
		});
	});

	describe('handleNetworkError', () => {
		it('should handle network errors with retry strategy', () => {
			const error = new NetworkError('Network failed');
			const result = MFAErrorHandler.handleNetworkError(error, mockContext, 0);

			expect(result.recoveryOptions.strategy).toBe(RecoveryStrategy.RETRY);
			expect(result.recoveryOptions.maxRetries).toBe(3);
			expect(result.recoveryOptions.retryDelay).toBe(1000);
		});

		it('should switch to manual intervention after max retries', () => {
			const error = new NetworkError('Network failed');
			const result = MFAErrorHandler.handleNetworkError(error, mockContext, 3);

			expect(result.recoveryOptions.strategy).toBe(RecoveryStrategy.MANUAL_INTERVENTION);
		});

		it('should calculate retry delay with exponential backoff', () => {
			const error = new NetworkError('Network failed');
			const result1 = MFAErrorHandler.handleNetworkError(error, mockContext, 1);
			const result2 = MFAErrorHandler.handleNetworkError(error, mockContext, 2);

			expect(result2.recoveryOptions.retryDelay).toBeGreaterThan(
				result1.recoveryOptions.retryDelay
			);
		});
	});

	describe('handleStateCorruptionError', () => {
		it('should handle state corruption with restart strategy', () => {
			const error = new StateCorruptionError('State corrupted');
			const result = MFAErrorHandler.handleStateCorruptionError(error, mockContext);

			expect(result.recoveryOptions.strategy).toBe(RecoveryStrategy.RESTART_FLOW);
			expect(result.severity).toBe(ErrorSeverity.HIGH);
		});

		it('should clear corrupted state', () => {
			const error = new StateCorruptionError('State corrupted');
			const clearStateSpy = jest.spyOn(MFAErrorHandler as any, 'clearCorruptedState');

			MFAErrorHandler.handleStateCorruptionError(error, mockContext);

			expect(clearStateSpy).toHaveBeenCalledWith('registration');
		});
	});

	describe('handleValidationError', () => {
		it('should handle validation errors with manual intervention', () => {
			const error = new CallbackValidationError('Validation failed');
			const validationDetails = { field: 'phone', message: 'Invalid format' };
			const result = MFAErrorHandler.handleValidationError(error, mockContext, validationDetails);

			expect(result.recoveryOptions.strategy).toBe(RecoveryStrategy.MANUAL_INTERVENTION);
			expect(result.context.additionalData?.validationErrors).toEqual(validationDetails);
		});
	});

	describe('createUserFriendlyMessage', () => {
		it('should create user-friendly messages', () => {
			const error = new MFAError('Technical error details', mockContext, ErrorSeverity.HIGH);

			const message = MFAErrorHandler.createUserFriendlyMessage(error);

			expect(message).toContain('Registration error');
			expect(message).toContain('Device Type Selection');
			expect(message).toContain('SMS');
			expect(message).toContain('requires restarting the process');
		});
	});

	describe('isRecoverable', () => {
		it('should determine if error is recoverable', () => {
			const recoverableError = new MFAError('Test error', mockContext, ErrorSeverity.MEDIUM, {
				strategy: RecoveryStrategy.RETRY,
			});

			const nonRecoverableError = new MFAError('Test error', mockContext, ErrorSeverity.LOW, {
				strategy: RecoveryStrategy.IGNORE,
			});

			expect(MFAErrorHandler.isRecoverable(recoverableError)).toBe(true);
			expect(MFAErrorHandler.isRecoverable(nonRecoverableError)).toBe(false);
		});
	});

	describe('getRecoveryActions', () => {
		it('should return available recovery actions', () => {
			const error = new MFAError('Test error', mockContext, ErrorSeverity.HIGH, {
				strategy: RecoveryStrategy.RESTART_FLOW,
			});

			const actions = MFAErrorHandler.getRecoveryActions(error);

			expect(actions).toHaveLength(1);
			expect(actions[0].label).toBe('Restart Flow');
			expect(actions[0].available).toBe(true);
			expect(typeof actions[0].action).toBe('function');
		});
	});

	describe('getErrorTrackingId', () => {
		it('should generate unique error tracking ID', () => {
			const error = new MFAError('Test error', mockContext, ErrorSeverity.MEDIUM);

			const trackingId = MFAErrorHandler.getErrorTrackingId(error);

			expect(trackingId).toMatch(/^\d+-[a-z0-9]{8}$/);
		});
	});

	describe('shouldReportToMonitoring', () => {
		it('should report high and critical severity errors', () => {
			const highError = new MFAError('High error', mockContext, ErrorSeverity.HIGH);
			const criticalError = new MFAError('Critical error', mockContext, ErrorSeverity.CRITICAL);
			const mediumError = new MFAError('Medium error', mockContext, ErrorSeverity.MEDIUM);

			expect(MFAErrorHandler.shouldReportToMonitoring(highError)).toBe(true);
			expect(MFAErrorHandler.shouldReportToMonitoring(criticalError)).toBe(true);
			expect(MFAErrorHandler.shouldReportToMonitoring(mediumError)).toBe(false);
		});
	});
});

describe('MFAError', () => {
	const mockContext = {
		flowType: 'registration' as const,
		currentStep: 1,
		stepName: 'Test Step',
		timestamp: Date.now(),
	};

	it('should create MFAError with all properties', () => {
		const originalError = new Error('Original error');
		const error = new MFAError(
			'Enhanced error message',
			mockContext,
			ErrorSeverity.HIGH,
			{ strategy: RecoveryStrategy.RESTART_FLOW },
			originalError
		);

		expect(error.message).toBe('Enhanced error message');
		expect(error.context).toEqual(mockContext);
		expect(error.severity).toBe(ErrorSeverity.HIGH);
		expect(error.recoveryOptions.strategy).toBe(RecoveryStrategy.RESTART_FLOW);
		expect(error.originalError).toBe(originalError);
		expect(error.name).toBe('MFAError');
	});

	it('should use original error as fallback if none provided', () => {
		const error = new MFAError('Test error', mockContext);

		expect(error.originalError).toBe(error);
	});
});
