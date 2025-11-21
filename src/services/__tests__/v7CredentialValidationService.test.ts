// src/services/__tests__/v7CredentialValidationService.test.ts
/**
 * Unit Tests for V7 Credential Validation Service
 *
 * Comprehensive test suite covering all functionality of the V7 credential
 * validation service, including edge cases and error scenarios.
 *
 * @version 1.0.0
 * @author OAuth Playground Team
 * @since 2024-01-01
 */

import { act, renderHook } from '@testing-library/react';
// Mock dependencies
import { vi } from 'vitest';
import {
	V7_FLOW_CONFIGS,
	V7CredentialValidationService,
	type V7CredentialValues,
} from '../v7CredentialValidationService';

vi.mock('../credentialGuardService', () => ({
	CredentialGuardService: {
		checkMissingFields: vi.fn(() => ({
			canProceed: true,
			missingFields: [],
			message: 'All required fields are present',
		})),
	},
}));

vi.mock('../modalPresentationService', () => ({
	__esModule: true,
	default: vi.fn(() => {
		const React = require('react');
		return React.createElement('div', { 'data-testid': 'modal' }, 'Modal');
	}),
}));

vi.mock('../../utils/v4ToastMessages', () => ({
	v4ToastManager: {
		showError: vi.fn(),
		showSuccess: vi.fn(),
	},
}));

describe('V7CredentialValidationService', () => {
	const mockCredentials = {
		environmentId: 'test-env-id',
		clientId: 'test-client-id',
		redirectUri: 'https://localhost:3000/callback',
		clientSecret: 'test-secret',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('V7_FLOW_CONFIGS', () => {
		it('should contain configurations for all supported flows', () => {
			const expectedFlows = [
				'oidc-hybrid-v7',
				'implicit-v7',
				'device-authorization-v7',
				'client-credentials-v7',
				'worker-token-v7',
				'oauth-authorization-code-v7',
				'ciba-v7',
				'redirectless-v7-real',
				'pingone-par-flow-v7',
				'rar-v7',
				'jwt-bearer-v7',
			];

			expectedFlows.forEach((flowKey) => {
				expect(V7_FLOW_CONFIGS[flowKey]).toBeDefined();
				expect(V7_FLOW_CONFIGS[flowKey].flowName).toBeDefined();
				expect(V7_FLOW_CONFIGS[flowKey].requiredFields).toBeInstanceOf(Array);
				expect(V7_FLOW_CONFIGS[flowKey].fieldLabels).toBeDefined();
				expect(V7_FLOW_CONFIGS[flowKey].stepIndex).toBeDefined();
			});
		});

		it('should have valid field labels for all required fields', () => {
			Object.entries(V7_FLOW_CONFIGS).forEach(([_flowKey, config]) => {
				config.requiredFields.forEach((field) => {
					expect(config.fieldLabels[field]).toBeDefined();
					expect(config.fieldLabels[field]).toBeTruthy();
				});
			});
		});
	});

	describe('useValidation hook', () => {
		it('should return validation functions and modal component', () => {
			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: mockCredentials,
					currentStep: 0,
				})
			);

			expect(result.current.validateCredentialsAndProceed).toBeInstanceOf(Function);
			expect(result.current.closeModal).toBeInstanceOf(Function);
			expect(result.current.CredentialValidationModal).toBeInstanceOf(Function);
			expect(typeof result.current.isValidForStep).toBe('boolean');
			expect(typeof result.current.validationMessage).toBe('string');
		});

		it('should handle unknown flow key gracefully', () => {
			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'unknown-flow',
					credentials: mockCredentials,
					currentStep: 0,
				})
			);

			expect(result.current.isValidForStep).toBe(true);
			expect(result.current.validationMessage).toBe('');
			expect(result.current.showMissingCredentialsModal).toBe(false);
		});

		it('should validate credentials correctly for valid input', () => {
			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: mockCredentials,
					currentStep: 0,
				})
			);

			expect(result.current.isValidForStep).toBe(true);
		});

		it('should detect missing required fields', () => {
			const incompleteCredentials = {
				environmentId: 'test-env-id',
				// Missing clientId and redirectUri
			};

			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: incompleteCredentials,
					currentStep: 0,
				})
			);

			expect(result.current.isValidForStep).toBe(false);
			expect(result.current.validationMessage).toContain('missing');
		});

		it('should handle validation success callback', () => {
			const onValidationSuccess = vi.fn();

			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: mockCredentials,
					currentStep: 0,
					onValidationSuccess,
				})
			);

			act(() => {
				result.current.validateCredentialsAndProceed(() => {
					// Simulate proceeding to next step
				});
			});

			expect(onValidationSuccess).toHaveBeenCalled();
		});

		it('should handle validation failure callback', () => {
			const onValidationFailure = vi.fn();
			const incompleteCredentials = { environmentId: 'test-env-id' };

			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: incompleteCredentials,
					currentStep: 0,
					onValidationFailure,
				})
			);

			act(() => {
				result.current.validateCredentialsAndProceed(() => {
					// This should not be called due to validation failure
				});
			});

			expect(onValidationFailure).toHaveBeenCalled();
		});

		it('should show modal when validation fails', () => {
			const incompleteCredentials = { environmentId: 'test-env-id' };

			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: incompleteCredentials,
					currentStep: 0,
				})
			);

			act(() => {
				result.current.validateCredentialsAndProceed(() => {
					// This should not be called
				});
			});

			expect(result.current.showMissingCredentialsModal).toBe(true);
			expect(result.current.missingCredentialFields.length).toBeGreaterThan(0);
		});

		it('should close modal when closeModal is called', () => {
			const incompleteCredentials = { environmentId: 'test-env-id' };

			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: incompleteCredentials,
					currentStep: 0,
				})
			);

			// First, trigger validation failure to show modal
			act(() => {
				result.current.validateCredentialsAndProceed(() => {});
			});

			expect(result.current.showMissingCredentialsModal).toBe(true);

			// Then close the modal
			act(() => {
				result.current.closeModal();
			});

			expect(result.current.showMissingCredentialsModal).toBe(false);
		});
	});

	describe('validateCredentials utility function', () => {
		it('should validate credentials correctly', () => {
			const result = V7CredentialValidationService.validateCredentials('oidc-hybrid-v7', {
				environmentId: 'test-env-id',
				clientId: 'test-client-id',
				redirectUri: 'https://localhost:3000/callback',
			});

			expect(result.isValid).toBe(true);
			expect(result.missingFields).toHaveLength(0);
		});

		it('should detect missing fields', () => {
			const result = V7CredentialValidationService.validateCredentials('oidc-hybrid-v7', {
				environmentId: 'test-env-id',
				// Missing clientId and redirectUri
			});

			expect(result.isValid).toBe(false);
			expect(result.missingFields).toContain('clientId');
			expect(result.missingFields).toContain('redirectUri');
		});

		it('should handle unknown flow key', () => {
			const result = V7CredentialValidationService.validateCredentials(
				'unknown-flow',
				mockCredentials
			);

			expect(result.isValid).toBe(false);
			expect(result.message).toContain('configuration not found');
		});

		it('should handle custom validation function', () => {
			const customConfig = {
				flowName: 'Test Flow',
				requiredFields: ['testField'],
				fieldLabels: { testField: 'Test Field' },
				stepIndex: 0,
				customValidation: (credentials: V7CredentialValues) => ({
					isValid: credentials.testField === 'valid',
					message: credentials.testField === 'valid' ? 'Valid' : 'Invalid value',
				}),
			};

			const result = V7CredentialValidationService.validateCredentials(
				'oidc-hybrid-v7',
				{ testField: 'valid' },
				customConfig
			);

			expect(result.isValid).toBe(true);
			expect(result.message).toBe('Valid');
		});
	});

	describe('getFlowConfig utility function', () => {
		it('should return correct configuration for known flow', () => {
			const config = V7CredentialValidationService.getFlowConfig('oidc-hybrid-v7');

			expect(config).toBeDefined();
			expect(config?.flowName).toBe('OIDC Hybrid Flow');
			expect(config?.requiredFields).toContain('environmentId');
		});

		it('should return undefined for unknown flow', () => {
			const config = V7CredentialValidationService.getFlowConfig('unknown-flow');

			expect(config).toBeUndefined();
		});
	});

	describe('getAllFlowConfigs utility function', () => {
		it('should return all flow configurations', () => {
			const configs = V7CredentialValidationService.getAllFlowConfigs();

			expect(configs).toBeDefined();
			expect(Object.keys(configs).length).toBeGreaterThan(0);
			expect(configs).toEqual(V7_FLOW_CONFIGS);
		});
	});

	describe('Edge cases and error handling', () => {
		it('should handle null credentials', () => {
			const result = V7CredentialValidationService.validateCredentials('oidc-hybrid-v7', null);

			expect(result.isValid).toBe(false);
			expect(result.missingFields.length).toBeGreaterThan(0);
		});

		it('should handle undefined credentials', () => {
			const result = V7CredentialValidationService.validateCredentials('oidc-hybrid-v7', undefined);

			expect(result.isValid).toBe(false);
			expect(result.missingFields.length).toBeGreaterThan(0);
		});

		it('should handle empty string values', () => {
			const result = V7CredentialValidationService.validateCredentials('oidc-hybrid-v7', {
				environmentId: '',
				clientId: '',
				redirectUri: '',
			});

			expect(result.isValid).toBe(false);
			expect(result.missingFields).toContain('environmentId');
			expect(result.missingFields).toContain('clientId');
			expect(result.missingFields).toContain('redirectUri');
		});

		it('should handle whitespace-only values', () => {
			const result = V7CredentialValidationService.validateCredentials('oidc-hybrid-v7', {
				environmentId: '   ',
				clientId: '\t',
				redirectUri: '\n',
			});

			expect(result.isValid).toBe(false);
			expect(result.missingFields).toContain('environmentId');
			expect(result.missingFields).toContain('clientId');
			expect(result.missingFields).toContain('redirectUri');
		});
	});

	describe('Performance and memory', () => {
		it('should not cause memory leaks with multiple hook instances', () => {
			const { unmount } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: mockCredentials,
					currentStep: 0,
				})
			);

			// This should not throw or cause memory issues
			expect(() => unmount()).not.toThrow();
		});

		it('should handle rapid validation calls efficiently', () => {
			const { result } = renderHook(() =>
				V7CredentialValidationService.useValidation({
					flowKey: 'oidc-hybrid-v7',
					credentials: mockCredentials,
					currentStep: 0,
				})
			);

			const startTime = performance.now();

			// Simulate rapid validation calls
			for (let i = 0; i < 100; i++) {
				act(() => {
					result.current.validateCredentialsAndProceed(() => {});
				});
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Should complete quickly (less than 100ms for 100 calls)
			expect(duration).toBeLessThan(100);
		});
	});
});
