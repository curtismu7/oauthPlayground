/**
 * @file stateManagers.integration.test.ts
 * @module apps/mfa/services
 * @description Integration tests for MFA state managers
 * @version 8.0.0
 * @since 2026-02-20
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthenticationStateManager } from './authentication/authenticationStateManager';
import { RegistrationStateManager } from './registration/registrationStateManager';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: jest.fn((key: string) => store[key] || null),
		setItem: jest.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: jest.fn((key: string) => {
			delete store[key];
		}),
		clear: jest.fn(() => {
			store = {};
		}),
	};
})();

const sessionStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: jest.fn((key: string) => store[key] || null),
		setItem: jest.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: jest.fn((key: string) => {
			delete store[key];
		}),
		clear: jest.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock,
});

describe('State Managers Integration', () => {
	beforeEach(() => {
		localStorageMock.clear();
		sessionStorageMock.clear();
		jest.clearAllMocks();
	});

	describe('RegistrationStateManager Integration', () => {
		const mockUserData = {
			userId: 'test-user',
			username: 'test@example.com',
			environmentId: 'test-env',
		};

		it('should persist and retrieve registration state', () => {
			const initialState = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);

			// Save state
			RegistrationStateManager.saveState(initialState);

			// Load state
			const loadedState = RegistrationStateManager.loadState();

			expect(loadedState).not.toBeNull();
			expect(loadedState?.flowType).toBe('registration');
			expect(loadedState?.deviceType).toBe('SMS');
			expect(loadedState?.userData).toEqual(mockUserData);
			expect(loadedState?.subFlowType).toBe('user_initiated');
		});

		it('should handle state updates across multiple operations', () => {
			const initialState = RegistrationStateManager.createInitialState(
				'EMAIL',
				mockUserData,
				'admin_initiated'
			);

			RegistrationStateManager.saveState(initialState);

			// Update step
			const updatedState1 = RegistrationStateManager.updateStep(initialState, 2);
			expect(updatedState1.currentStep).toBe(2);

			// Update device data
			const updatedState2 = RegistrationStateManager.updateDeviceData(updatedState1, {
				deviceId: 'device-123',
				type: 'EMAIL',
				status: 'ACTIVE',
			});
			expect(updatedState2.deviceData).toEqual({
				deviceId: 'device-123',
				type: 'EMAIL',
				status: 'ACTIVE',
			});

			// Update validation state
			const updatedState3 = RegistrationStateManager.updateValidationState(updatedState2, {
				isValid: true,
				errors: {},
				warnings: {},
				completedSteps: [0, 1, 2],
			});
			expect(updatedState3.validationState.isValid).toBe(true);

			// Verify persistence
			const finalState = RegistrationStateManager.loadState();
			expect(finalState?.currentStep).toBe(2);
			expect(finalState?.deviceData).toEqual({
				deviceId: 'device-123',
				type: 'EMAIL',
				status: 'ACTIVE',
			});
			expect(finalState?.validationState.isValid).toBe(true);
		});

		it('should handle state corruption detection', () => {
			// Save valid state
			const validState = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);
			RegistrationStateManager.saveState(validState);

			// Corrupt the stored state
			localStorageMock.setItem('mfa_reg_state', 'invalid-json');

			// Load should return null and clear corrupted state
			const loadedState = RegistrationStateManager.loadState();
			expect(loadedState).toBeNull();
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mfa_reg_state');
		});

		it('should handle state expiration', () => {
			const oldState = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);

			// Manually set old timestamp (more than 24 hours ago)
			oldState.metadata.lastActivity = Date.now() - 25 * 60 * 60 * 1000;
			localStorageMock.setItem('mfa_reg_state', JSON.stringify(oldState));

			// Load should return null due to expiration
			const loadedState = RegistrationStateManager.loadState();
			expect(loadedState).toBeNull();
		});

		it('should calculate progress correctly', () => {
			const state = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);

			// Test progress calculation
			expect(RegistrationStateManager.getProgressPercentage(state)).toBe(20); // 1/5 steps

			const updatedState = RegistrationStateManager.updateStep(state, 2);
			expect(RegistrationStateManager.getProgressPercentage(updatedState)).toBe(40); // 2/5 steps

			const finalState = RegistrationStateManager.updateStep(updatedState, 4);
			expect(RegistrationStateManager.getProgressPercentage(finalState)).toBe(80); // 4/5 steps
		});
	});

	describe('AuthenticationStateManager Integration', () => {
		const mockUserData = {
			userId: 'test-user',
			username: 'test@example.com',
			environmentId: 'test-env',
		};

		it('should persist and retrieve authentication state', () => {
			const initialState = AuthenticationStateManager.createInitialState('login', mockUserData);

			// Save state
			AuthenticationStateManager.saveState(initialState);

			// Load state
			const loadedState = AuthenticationStateManager.loadState();

			expect(loadedState).not.toBeNull();
			expect(loadedState?.flowType).toBe('authentication');
			expect(loadedState?.subFlowType).toBe('login');
			expect(loadedState?.userData).toEqual(mockUserData);
		});

		it('should handle authentication state updates', () => {
			const initialState = AuthenticationStateManager.createInitialState('step_up', mockUserData);

			AuthenticationStateManager.saveState(initialState);

			// Update step
			const updatedState1 = AuthenticationStateManager.updateStep(initialState, 1);
			expect(updatedState1.currentStep).toBe(1);

			// Update challenge data
			const updatedState2 = AuthenticationStateManager.updateChallengeData(updatedState1, {
				challengeId: 'challenge-123',
				challengeType: 'OTP',
				expiresAt: Date.now() + 15 * 60 * 1000,
				attemptsRemaining: 3,
			});
			expect(updatedState2.challengeData.challengeId).toBe('challenge-123');

			// Update selected device
			const updatedState3 = AuthenticationStateManager.updateSelectedDevice(updatedState2, {
				id: 'device-123',
				type: 'SMS',
				name: 'My Phone',
				status: 'ACTIVE',
				capabilities: ['OTP'],
			});
			expect(updatedState3.selectedDevice.id).toBe('device-123');

			// Verify persistence
			const finalState = AuthenticationStateManager.loadState();
			expect(finalState?.currentStep).toBe(1);
			expect(finalState?.challengeData.challengeId).toBe('challenge-123');
			expect(finalState?.selectedDevice.id).toBe('device-123');
		});

		it('should handle challenge expiration', () => {
			const state = AuthenticationStateManager.createInitialState('login', mockUserData);

			// Add expired challenge
			const expiredState = AuthenticationStateManager.updateChallengeData(state, {
				challengeId: 'expired-challenge',
				challengeType: 'OTP',
				expiresAt: Date.now() - 1000, // Expired 1 second ago
				attemptsRemaining: 3,
			});

			expect(AuthenticationStateManager.isChallengeExpired(expiredState)).toBe(true);

			// Add valid challenge
			const validState = AuthenticationStateManager.updateChallengeData(state, {
				challengeId: 'valid-challenge',
				challengeType: 'OTP',
				expiresAt: Date.now() + 15 * 60 * 1000, // Expires in 15 minutes
				attemptsRemaining: 3,
			});

			expect(AuthenticationStateManager.isChallengeExpired(validState)).toBe(false);
		});

		it('should calculate challenge time remaining', () => {
			const state = AuthenticationStateManager.createInitialState('login', mockUserData);

			// Add challenge with 5 minutes remaining
			const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
			const updatedState = AuthenticationStateManager.updateChallengeData(state, {
				challengeId: 'test-challenge',
				challengeType: 'OTP',
				expiresAt: fiveMinutesFromNow,
				attemptsRemaining: 3,
			});

			const timeRemaining = AuthenticationStateManager.getChallengeTimeRemaining(updatedState);
			expect(timeRemaining).toBeGreaterThan(4 * 60); // More than 4 minutes
			expect(timeRemaining).toBeLessThan(5 * 60 + 10); // Less than 5 minutes + buffer
		});

		it('should provide security metrics', () => {
			const state = AuthenticationStateManager.createInitialState('login', mockUserData);

			// Add challenge
			const updatedState = AuthenticationStateManager.updateChallengeData(state, {
				challengeId: 'test-challenge',
				challengeType: 'OTP',
				expiresAt: Date.now() + 10 * 60 * 1000,
				attemptsRemaining: 2,
			});

			const metrics = AuthenticationStateManager.getSecurityMetrics(updatedState);

			expect(metrics).toHaveProperty('stateAge');
			expect(metrics).toHaveProperty('challengeAge');
			expect(metrics).toHaveProperty('attemptsRemaining');
			expect(metrics).toHaveProperty('isExpired');
			expect(metrics).toHaveProperty('riskLevel');

			expect(metrics.attemptsRemaining).toBe(2);
			expect(metrics.isExpired).toBe(false);
			expect(['low', 'medium', 'high']).toContain(metrics.riskLevel);
		});

		it('should handle state expiration (15 minutes)', () => {
			const oldState = AuthenticationStateManager.createInitialState('login', mockUserData);

			// Manually set old timestamp (more than 15 minutes ago)
			oldState.metadata.lastActivity = Date.now() - 16 * 60 * 1000;
			sessionStorageMock.setItem('mfa_auth_state', JSON.stringify(oldState));

			// Load should return null due to expiration
			const loadedState = AuthenticationStateManager.loadState();
			expect(loadedState).toBeNull();
		});
	});

	describe('Cross-Flow State Isolation', () => {
		const mockUserData = {
			userId: 'test-user',
			username: 'test@example.com',
			environmentId: 'test-env',
		};

		it('should isolate registration and authentication states', () => {
			// Create registration state
			const regState = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);
			RegistrationStateManager.saveState(regState);

			// Create authentication state
			const authState = AuthenticationStateManager.createInitialState('login', mockUserData);
			AuthenticationStateManager.saveState(authState);

			// Verify both states exist independently
			const loadedRegState = RegistrationStateManager.loadState();
			const loadedAuthState = AuthenticationStateManager.loadState();

			expect(loadedRegState).not.toBeNull();
			expect(loadedAuthState).not.toBeNull();
			expect(loadedRegState?.flowType).toBe('registration');
			expect(loadedAuthState?.flowType).toBe('authentication');
		});

		it('should not interfere when clearing one state', () => {
			// Create both states
			const regState = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);
			RegistrationStateManager.saveState(regState);

			const authState = AuthenticationStateManager.createInitialState('login', mockUserData);
			AuthenticationStateManager.saveState(authState);

			// Clear registration state
			RegistrationStateManager.clearState();

			// Registration should be cleared, authentication should remain
			expect(RegistrationStateManager.loadState()).toBeNull();
			expect(AuthenticationStateManager.loadState()).not.toBeNull();
		});
	});

	describe('State Version Compatibility', () => {
		const mockUserData = {
			userId: 'test-user',
			username: 'test@example.com',
			environmentId: 'test-env',
		};

		it('should handle version mismatch gracefully', () => {
			const state = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);

			// Modify version to incompatible version
			state.metadata.version = '0.9.0';
			localStorageMock.setItem('mfa_reg_state', JSON.stringify(state));

			// Load should return null due to version mismatch
			const loadedState = RegistrationStateManager.loadState();
			expect(loadedState).toBeNull();
		});

		it('should handle missing metadata gracefully', () => {
			const state = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);

			// Remove metadata
			delete (state as any).metadata;
			localStorageMock.setItem('mfa_reg_state', JSON.stringify(state));

			// Load should return null due to missing metadata
			const loadedState = RegistrationStateManager.loadState();
			expect(loadedState).toBeNull();
		});
	});

	describe('Performance and Memory', () => {
		const mockUserData = {
			userId: 'test-user',
			username: 'test@example.com',
			environmentId: 'test-env',
		};

		it('should handle large state objects efficiently', () => {
			const state = RegistrationStateManager.createInitialState(
				'SMS',
				mockUserData,
				'user_initiated'
			);

			// Add large device data
			const largeDeviceData = {
				deviceId: 'device-123',
				type: 'SMS',
				status: 'ACTIVE',
				metadata: {
					// Simulate large metadata
					...Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`]).reduce(
						(acc, [k, v]) => ({ ...acc, [k]: v }),
						{}
					),
				},
			};

			const startTime = performance.now();

			// Multiple state operations
			for (let i = 0; i < 100; i++) {
				RegistrationStateManager.updateDeviceData(state, largeDeviceData);
				RegistrationStateManager.updateStep(state, i % 5);
				RegistrationStateManager.loadState();
			}

			const endTime = performance.now();

			// Should complete within reasonable time (less than 1 second)
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});
});
