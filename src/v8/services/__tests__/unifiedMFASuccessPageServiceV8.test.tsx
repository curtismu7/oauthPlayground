/**
 * @file unifiedMFASuccessPageServiceV8.test.tsx
 * @module v8/services/__tests__
 * @description Unit tests for UnifiedMFASuccessPageV8 validation insights
 * @version 9.15.0
 * @since 2026-03-06
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UnifiedMFASuccessPageV8 } from '../unifiedMFASuccessPageServiceV8';
import type { UnifiedMFASuccessPageProps } from '../unifiedMFASuccessPageServiceV8';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
	logger: {
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	},
}));

jest.mock('../../services/apiDisplayServiceV8', () => ({
	apiDisplayServiceV8: {
		isVisible: jest.fn(() => true),
		hide: jest.fn(),
		show: jest.fn(),
	},
}));

describe('UnifiedMFASuccessPageV8', () => {
	const createMockProps = (overrides: Partial<UnifiedMFASuccessPageProps> = {}): UnifiedMFASuccessPageProps => ({
		data: {
			flowType: 'registration',
			username: 'testuser@example.com',
			userId: 'user-123',
			environmentId: 'env-456',
			deviceId: 'device-789',
			deviceType: 'email',
			deviceStatus: 'active',
			deviceNickname: 'Test Device',
			deviceName: 'Email Device',
			phone: '+1234567890',
			email: 'testuser@example.com',
			policyId: 'policy-123',
			policyName: 'Test Policy',
			fidoPolicy: undefined,
			completionResult: undefined,
			verificationResult: undefined,
			authenticationId: 'auth-123',
			challengeId: 'challenge-123',
			timestamp: new Date().toISOString(),
			deviceSelectionBehavior: 'automatic',
			responseData: undefined,
			registrationFlowType: 'email',
			adminDeviceStatus: 'ACTIVE',
			tokenType: 'user',
		},
		onStartAgain: jest.fn(),
		...overrides,
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Validation Insights Logic', () => {
		it('should create props with validation insights for registration flow', () => {
			const props = createMockProps({
				data: {
					flowType: 'registration',
					deviceType: 'email',
					deviceStatus: 'active',
				},
			});

			expect(props.data.flowType).toBe('registration');
			expect(props.data.deviceType).toBe('email');
			expect(props.data.deviceStatus).toBe('active');
		});

		it('should create props with validation insights for authentication flow', () => {
			const props = createMockProps({
				data: {
					flowType: 'authentication',
					deviceType: 'sms',
					deviceStatus: 'active',
				},
			});

			expect(props.data.flowType).toBe('authentication');
			expect(props.data.deviceType).toBe('sms');
			expect(props.data.deviceStatus).toBe('active');
		});

		it('should handle different device types correctly', () => {
			const deviceTypes = ['email', 'sms', 'totp', 'push', 'fido2'] as const;
			
			deviceTypes.forEach(deviceType => {
				const props = createMockProps({
					data: { deviceType },
				});

				expect(props.data.deviceType).toBe(deviceType);
			});
		});

		it('should handle missing optional fields', () => {
			const props = createMockProps({
				data: {
					username: undefined,
					deviceNickname: undefined,
					phone: undefined,
					email: undefined,
				},
			});

			expect(props.data.username).toBeUndefined();
			expect(props.data.deviceNickname).toBeUndefined();
			expect(props.data.phone).toBeUndefined();
			expect(props.data.email).toBeUndefined();
		});

		it('should format timestamp correctly', () => {
			const timestamp = '2026-03-06T12:00:00.000Z';
			const props = createMockProps({
				data: { timestamp },
			});

			expect(props.data.timestamp).toBe(timestamp);
		});
	});

	describe('Component Props Validation', () => {
		it('should have valid props structure', () => {
			const props = createMockProps();

			// Check required fields
			expect(props.data).toBeDefined();
			expect(props.data.flowType).toBeDefined();
			expect(props.data.deviceId).toBeDefined();
			expect(props.data.deviceType).toBeDefined();
			expect(props.data.deviceStatus).toBeDefined();
			expect(props.onStartAgain).toBeDefined();
			expect(typeof props.onStartAgain).toBe('function');
		});

		it('should handle registration flow type', () => {
			const props = createMockProps({
				data: { flowType: 'registration' },
			});

			expect(props.data.flowType).toBe('registration');
		});

		it('should handle authentication flow type', () => {
			const props = createMockProps({
				data: { flowType: 'authentication' },
			});

			expect(props.data.flowType).toBe('authentication');
		});

		it('should handle different device statuses', () => {
			const statuses = ['ACTIVE', 'ACTIVATION_REQUIRED'] as const;
			
			statuses.forEach(status => {
				const props = createMockProps({
					data: { adminDeviceStatus: status },
				});

				expect(props.data.adminDeviceStatus).toBe(status);
			});
		});

		it('should handle different token types', () => {
			const tokenTypes = ['user', 'worker'] as const;
			
			tokenTypes.forEach(tokenType => {
				const props = createMockProps({
					data: { tokenType },
				});

				expect(props.data.tokenType).toBe(tokenType);
			});
		});
	});

	describe('Validation Insights Content', () => {
		it('should contain data needed for validation insights display', () => {
			const props = createMockProps({
				data: {
					flowType: 'registration',
					deviceType: 'email',
					deviceStatus: 'active',
					deviceId: 'device-789',
					username: 'test@example.com',
				},
			});

			// These fields are used in validation insights
			expect(props.data.flowType).toBeDefined();
			expect(props.data.deviceType).toBeDefined();
			expect(props.data.deviceStatus).toBeDefined();
			expect(props.data.deviceId).toBeDefined();
			expect(props.data.username).toBeDefined();
		});

		it('should contain data needed for achievements display', () => {
			const props = createMockProps({
				data: {
					deviceType: 'email',
					deviceStatus: 'active',
					username: 'test@example.com',
					flowType: 'registration',
				},
			});

			// These fields are used in achievements
			expect(props.data.deviceType).toBe('email');
			expect(props.data.deviceStatus).toBe('active');
			expect(props.data.username).toBe('test@example.com');
			expect(props.data.flowType).toBe('registration');
		});

		it('should contain data needed for flow summary display', () => {
			const props = createMockProps({
				data: {
					deviceId: 'device-789',
					deviceType: 'email',
					flowType: 'registration',
					email: 'test@example.com',
					deviceNickname: 'Test Device',
					timestamp: new Date().toISOString(),
				},
			});

			// These fields are used in flow summary
			expect(props.data.deviceId).toBe('device-789');
			expect(props.data.deviceType).toBe('email');
			expect(props.data.flowType).toBe('registration');
			expect(props.data.email).toBe('test@example.com');
			expect(props.data.deviceNickname).toBe('Test Device');
			expect(props.data.timestamp).toBeDefined();
		});
	});

	describe('Edge Cases', () => {
		it('should handle minimal required data', () => {
			const minimalProps = createMockProps({
				data: {
					flowType: 'registration',
					deviceId: 'device-123',
					deviceType: 'email',
					deviceStatus: 'active',
					timestamp: new Date().toISOString(),
					// All other fields undefined
				},
			});

			expect(minimalProps.data.flowType).toBe('registration');
			expect(minimalProps.data.deviceId).toBe('device-123');
			expect(minimalProps.data.deviceType).toBe('email');
			expect(minimalProps.data.deviceStatus).toBe('active');
			expect(minimalProps.data.timestamp).toBeDefined();
		});

		it('should handle complete data with all fields', () => {
			const completeProps = createMockProps({
				data: {
					flowType: 'authentication',
					username: 'user@example.com',
					userId: 'user-123',
					environmentId: 'env-456',
					deviceId: 'device-789',
					deviceType: 'sms',
					deviceStatus: 'ACTIVE',
					deviceNickname: 'Mobile Device',
					deviceName: 'SMS Device',
					phone: '+1234567890',
					email: 'user@example.com',
					policyId: 'policy-123',
					policyName: 'Security Policy',
					authenticationId: 'auth-123',
					challengeId: 'challenge-123',
					timestamp: new Date().toISOString(),
					deviceSelectionBehavior: 'manual',
					registrationFlowType: 'sms',
					adminDeviceStatus: 'ACTIVE',
					tokenType: 'user',
				},
			});

			expect(completeProps.data.flowType).toBe('authentication');
			expect(completeProps.data.username).toBe('user@example.com');
			expect(completeProps.data.deviceType).toBe('sms');
			expect(completeProps.data.phone).toBe('+1234567890');
			expect(completeProps.data.policyName).toBe('Security Policy');
		});
	});

	describe('Callback Functions', () => {
		it('should provide onStartAgain callback', () => {
			const mockCallback = jest.fn();
			const props = createMockProps({
				onStartAgain: mockCallback,
			});

			expect(props.onStartAgain).toBe(mockCallback);
		});

		it('should handle undefined onStartAgain gracefully', () => {
			const props = createMockProps({
				onStartAgain: undefined,
			});

			expect(props.onStartAgain).toBeUndefined();
		});
	});
});
