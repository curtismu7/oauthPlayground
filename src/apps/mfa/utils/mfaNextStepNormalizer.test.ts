/**
 * @file mfaNextStepNormalizer.test.ts
 * @description Unit tests for MFA nextStep normalizer
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	isNormalizedMfaNextStep,
	normalizeMfaNextStep,
	normalizeMfaResponse,
} from './mfaNextStepNormalizer';

describe('normalizeMfaNextStep', () => {
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleWarnSpy.mockRestore();
	});

	describe('COMPLETED mapping', () => {
		it('should pass through COMPLETED unchanged', () => {
			expect(normalizeMfaNextStep('COMPLETED')).toBe('COMPLETED');
		});

		it('should handle COMPLETED case-insensitively', () => {
			expect(normalizeMfaNextStep('completed')).toBe('COMPLETED');
			expect(normalizeMfaNextStep('Completed')).toBe('COMPLETED');
		});
	});

	describe('OTP_REQUIRED mapping', () => {
		it('should pass through OTP_REQUIRED unchanged', () => {
			expect(normalizeMfaNextStep('OTP_REQUIRED')).toBe('OTP_REQUIRED');
		});

		it('should map PASSCODE_REQUIRED to OTP_REQUIRED', () => {
			expect(normalizeMfaNextStep('PASSCODE_REQUIRED')).toBe('OTP_REQUIRED');
		});

		it('should map CODE_REQUIRED to OTP_REQUIRED', () => {
			expect(normalizeMfaNextStep('CODE_REQUIRED')).toBe('OTP_REQUIRED');
		});

		it('should map VERIFICATION_REQUIRED to OTP_REQUIRED', () => {
			expect(normalizeMfaNextStep('VERIFICATION_REQUIRED')).toBe('OTP_REQUIRED');
		});

		it('should handle OTP variants case-insensitively', () => {
			expect(normalizeMfaNextStep('passcode_required')).toBe('OTP_REQUIRED');
			expect(normalizeMfaNextStep('Passcode_Required')).toBe('OTP_REQUIRED');
		});
	});

	describe('SELECTION_REQUIRED mapping', () => {
		it('should pass through SELECTION_REQUIRED unchanged', () => {
			expect(normalizeMfaNextStep('SELECTION_REQUIRED')).toBe('SELECTION_REQUIRED');
		});

		it('should map DEVICE_SELECTION_REQUIRED to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep('DEVICE_SELECTION_REQUIRED')).toBe('SELECTION_REQUIRED');
		});

		it('should map CHOOSE_DEVICE to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep('CHOOSE_DEVICE')).toBe('SELECTION_REQUIRED');
		});

		it('should map SELECT_DEVICE to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep('SELECT_DEVICE')).toBe('SELECTION_REQUIRED');
		});

		it('should handle selection variants case-insensitively', () => {
			expect(normalizeMfaNextStep('device_selection_required')).toBe('SELECTION_REQUIRED');
			expect(normalizeMfaNextStep('Device_Selection_Required')).toBe('SELECTION_REQUIRED');
		});
	});

	describe('edge cases and unknown values', () => {
		it('should default null to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep(null)).toBe('SELECTION_REQUIRED');
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('null/undefined'));
		});

		it('should default undefined to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep(undefined)).toBe('SELECTION_REQUIRED');
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('null/undefined'));
		});

		it('should default empty string to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep('')).toBe('SELECTION_REQUIRED');
		});

		it('should default unknown values to SELECTION_REQUIRED', () => {
			expect(normalizeMfaNextStep('UNKNOWN_STATUS')).toBe('SELECTION_REQUIRED');
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Unknown MFA step value: "UNKNOWN_STATUS"')
			);
		});

		it('should warn about unknown values', () => {
			normalizeMfaNextStep('WEIRD_STATUS');
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('WEIRD_STATUS'));
		});

		it('should handle whitespace in input', () => {
			expect(normalizeMfaNextStep('  COMPLETED  ')).toBe('COMPLETED');
			expect(normalizeMfaNextStep('\tOTP_REQUIRED\n')).toBe('OTP_REQUIRED');
		});
	});
});

describe('isNormalizedMfaNextStep', () => {
	it('should return true for valid normalized steps', () => {
		expect(isNormalizedMfaNextStep('COMPLETED')).toBe(true);
		expect(isNormalizedMfaNextStep('OTP_REQUIRED')).toBe(true);
		expect(isNormalizedMfaNextStep('SELECTION_REQUIRED')).toBe(true);
	});

	it('should return false for invalid values', () => {
		expect(isNormalizedMfaNextStep('DEVICE_SELECTION_REQUIRED')).toBe(false);
		expect(isNormalizedMfaNextStep('PASSCODE_REQUIRED')).toBe(false);
		expect(isNormalizedMfaNextStep('unknown')).toBe(false);
		expect(isNormalizedMfaNextStep(null)).toBe(false);
		expect(isNormalizedMfaNextStep(undefined)).toBe(false);
		expect(isNormalizedMfaNextStep(123)).toBe(false);
		expect(isNormalizedMfaNextStep({})).toBe(false);
	});

	it('should be case-sensitive', () => {
		expect(isNormalizedMfaNextStep('completed')).toBe(false);
		expect(isNormalizedMfaNextStep('otp_required')).toBe(false);
	});
});

describe('normalizeMfaResponse', () => {
	it('should normalize response with nextStep field', () => {
		const response = {
			success: true,
			nextStep: 'DEVICE_SELECTION_REQUIRED',
			deviceId: '123',
		};

		const normalized = normalizeMfaResponse(response);

		expect(normalized).toEqual({
			success: true,
			nextStep: 'SELECTION_REQUIRED',
			deviceId: '123',
		});
	});

	it('should use status field if nextStep is missing', () => {
		const response = {
			success: true,
			status: 'PASSCODE_REQUIRED',
			deviceId: '456',
		};

		const normalized = normalizeMfaResponse(response);

		expect(normalized.nextStep).toBe('OTP_REQUIRED');
	});

	it('should prefer nextStep over status when both present', () => {
		const response = {
			success: true,
			nextStep: 'COMPLETED',
			status: 'DEVICE_SELECTION_REQUIRED',
		};

		const normalized = normalizeMfaResponse(response);

		expect(normalized.nextStep).toBe('COMPLETED');
	});

	it('should handle response with neither field', () => {
		const response = {
			success: true,
			data: 'some data',
		};

		const normalized = normalizeMfaResponse(response);

		expect(normalized.nextStep).toBe('SELECTION_REQUIRED');
	});

	it('should preserve all original response fields', () => {
		const response = {
			success: true,
			nextStep: 'DEVICE_SELECTION_REQUIRED',
			deviceId: '789',
			metadata: { key: 'value' },
			timestamp: '2026-01-31',
		};

		const normalized = normalizeMfaResponse(response);

		expect(normalized).toMatchObject({
			success: true,
			deviceId: '789',
			metadata: { key: 'value' },
			timestamp: '2026-01-31',
		});
		expect(normalized.nextStep).toBe('SELECTION_REQUIRED');
	});
});

describe('regression prevention', () => {
	it('should prevent UI from hitting default case with DEVICE_SELECTION_REQUIRED', () => {
		// This is the key regression scenario
		const step = normalizeMfaNextStep('DEVICE_SELECTION_REQUIRED');
		expect(step).toBe('SELECTION_REQUIRED');
	});

	it('should prevent UI from hitting default case with PASSCODE_REQUIRED', () => {
		// Another key regression scenario
		const step = normalizeMfaNextStep('PASSCODE_REQUIRED');
		expect(step).toBe('OTP_REQUIRED');
	});

	it('should always return a value the UI can handle', () => {
		const testCases = [
			'COMPLETED',
			'OTP_REQUIRED',
			'PASSCODE_REQUIRED',
			'SELECTION_REQUIRED',
			'DEVICE_SELECTION_REQUIRED',
			'UNKNOWN_VALUE',
			null,
			undefined,
			'',
		];

		testCases.forEach((testCase) => {
			const result = normalizeMfaNextStep(testCase);
			expect(['COMPLETED', 'OTP_REQUIRED', 'SELECTION_REQUIRED']).toContain(result);
		});
	});
});
