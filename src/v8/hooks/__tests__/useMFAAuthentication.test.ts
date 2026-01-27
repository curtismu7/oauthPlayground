/**
 * @file useMFAAuthentication.test.ts
 * @module v8/hooks/__tests__
 * @description Unit tests for useMFAAuthentication hook
 * @version 3.0.0
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMFAAuthentication } from '../useMFAAuthentication';

describe('useMFAAuthentication', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Initialization', () => {
		it('should initialize with default state', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.authState.isLoading).toBe(false);
			expect(result.current.authState.showDeviceSelection).toBe(false);
			expect(result.current.authState.selectedDeviceId).toBe('');
			expect(result.current.authState.userId).toBeNull();
			expect(result.current.authState.challengeId).toBeNull();
			expect(result.current.authState._links).toBeNull();
			expect(result.current.authState.completionResult).toBeNull();
		});

		it('should initialize all modal states as false', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.showOTPModal).toBe(false);
			expect(result.current.showFIDO2Modal).toBe(false);
			expect(result.current.showPushModal).toBe(false);
			expect(result.current.showEmailModal).toBe(false);
			expect(result.current.showRegistrationModal).toBe(false);
			expect(result.current.showUsernameDecisionModal).toBe(false);
		});

		it('should initialize passkey registration mode as false', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.isPasskeyRegistrationMode).toBe(false);
		});
	});

	describe('Authentication State Management', () => {
		it('should update auth state', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			const newState = {
				isLoading: true,
				showDeviceSelection: true,
				selectedDeviceId: 'device123',
				userId: 'user123',
				challengeId: 'challenge123',
				_links: { next: { href: '/next' } },
				completionResult: { accessToken: 'token123' },
			};

			act(() => {
				result.current.setAuthState(newState);
			});

			expect(result.current.authState).toEqual(newState);
		});

		it('should update auth state with function', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setAuthState((prev) => ({
					...prev,
					isLoading: true,
					userId: 'user123',
				}));
			});

			expect(result.current.authState.isLoading).toBe(true);
			expect(result.current.authState.userId).toBe('user123');
		});

		it('should reset auth state to initial values', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			// Set some state
			act(() => {
				result.current.setAuthState({
					isLoading: true,
					showDeviceSelection: true,
					selectedDeviceId: 'device123',
					userId: 'user123',
					challengeId: 'challenge123',
					_links: { next: { href: '/next' } },
					completionResult: { accessToken: 'token123' },
				});
			});

			expect(result.current.authState.userId).toBe('user123');

			// Reset
			act(() => {
				result.current.resetAuthState();
			});

			expect(result.current.authState.isLoading).toBe(false);
			expect(result.current.authState.userId).toBeNull();
			expect(result.current.authState.challengeId).toBeNull();
			expect(result.current.authState.completionResult).toBeNull();
		});
	});

	describe('Modal State Management', () => {
		it('should toggle OTP modal', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowOTPModal(true);
			});

			expect(result.current.showOTPModal).toBe(true);

			act(() => {
				result.current.setShowOTPModal(false);
			});

			expect(result.current.showOTPModal).toBe(false);
		});

		it('should toggle FIDO2 modal', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowFIDO2Modal(true);
			});

			expect(result.current.showFIDO2Modal).toBe(true);
		});

		it('should toggle Push modal', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowPushModal(true);
			});

			expect(result.current.showPushModal).toBe(true);
		});

		it('should toggle Email modal', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowEmailModal(true);
			});

			expect(result.current.showEmailModal).toBe(true);
		});

		it('should toggle Registration modal', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowRegistrationModal(true);
			});

			expect(result.current.showRegistrationModal).toBe(true);
		});

		it('should toggle Username Decision modal', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowUsernameDecisionModal(true);
			});

			expect(result.current.showUsernameDecisionModal).toBe(true);
		});

		it('should close all modals at once', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			// Open all modals
			act(() => {
				result.current.setShowOTPModal(true);
				result.current.setShowFIDO2Modal(true);
				result.current.setShowPushModal(true);
				result.current.setShowEmailModal(true);
				result.current.setShowRegistrationModal(true);
				result.current.setShowUsernameDecisionModal(true);
			});

			expect(result.current.showOTPModal).toBe(true);
			expect(result.current.showFIDO2Modal).toBe(true);
			expect(result.current.showPushModal).toBe(true);
			expect(result.current.showEmailModal).toBe(true);
			expect(result.current.showRegistrationModal).toBe(true);
			expect(result.current.showUsernameDecisionModal).toBe(true);

			// Close all
			act(() => {
				result.current.closeAllModals();
			});

			expect(result.current.showOTPModal).toBe(false);
			expect(result.current.showFIDO2Modal).toBe(false);
			expect(result.current.showPushModal).toBe(false);
			expect(result.current.showEmailModal).toBe(false);
			expect(result.current.showRegistrationModal).toBe(false);
			expect(result.current.showUsernameDecisionModal).toBe(false);
		});
	});

	describe('Passkey Registration Mode', () => {
		it('should toggle passkey registration mode', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.isPasskeyRegistrationMode).toBe(false);

			act(() => {
				result.current.setIsPasskeyRegistrationMode(true);
			});

			expect(result.current.isPasskeyRegistrationMode).toBe(true);

			act(() => {
				result.current.setIsPasskeyRegistrationMode(false);
			});

			expect(result.current.isPasskeyRegistrationMode).toBe(false);
		});
	});

	describe('Computed Values', () => {
		it('should compute isAuthenticating when loading', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.isAuthenticating).toBe(false);

			act(() => {
				result.current.setAuthState((prev) => ({
					...prev,
					isLoading: true,
				}));
			});

			expect(result.current.isAuthenticating).toBe(true);
		});

		it('should compute isAuthenticating when challenge exists', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.isAuthenticating).toBe(false);

			act(() => {
				result.current.setAuthState((prev) => ({
					...prev,
					challengeId: 'challenge123',
				}));
			});

			expect(result.current.isAuthenticating).toBe(true);
		});

		it('should compute hasActiveChallenge correctly', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			expect(result.current.hasActiveChallenge).toBe(false);

			act(() => {
				result.current.setAuthState((prev) => ({
					...prev,
					challengeId: 'challenge123',
				}));
			});

			expect(result.current.hasActiveChallenge).toBe(true);

			act(() => {
				result.current.setAuthState((prev) => ({
					...prev,
					challengeId: null,
				}));
			});

			expect(result.current.hasActiveChallenge).toBe(false);
		});
	});

	describe('Configuration', () => {
		it('should accept configuration parameters', () => {
			const config = {
				username: 'testuser',
				environmentId: 'env123',
				policyId: 'policy123',
			};

			const { result } = renderHook(() => useMFAAuthentication(config));

			// Config is stored but not directly exposed
			expect(result.current.authState).toBeDefined();
		});
	});

	describe('State Combinations', () => {
		it('should handle multiple state updates', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setAuthState((prev) => ({
					...prev,
					isLoading: true,
					userId: 'user123',
				}));
				result.current.setShowOTPModal(true);
				result.current.setIsPasskeyRegistrationMode(true);
			});

			expect(result.current.authState.isLoading).toBe(true);
			expect(result.current.authState.userId).toBe('user123');
			expect(result.current.showOTPModal).toBe(true);
			expect(result.current.isPasskeyRegistrationMode).toBe(true);
		});

		it('should maintain independent modal states', () => {
			const { result } = renderHook(() => useMFAAuthentication());

			act(() => {
				result.current.setShowOTPModal(true);
				result.current.setShowFIDO2Modal(true);
			});

			expect(result.current.showOTPModal).toBe(true);
			expect(result.current.showFIDO2Modal).toBe(true);
			expect(result.current.showPushModal).toBe(false);
			expect(result.current.showEmailModal).toBe(false);
		});
	});
});
