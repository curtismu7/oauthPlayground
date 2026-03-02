/**
 * @file V9ModernMessagingService.test.ts
 * @module services/v9/__tests__
 * @description Tests for V9 Modern Messaging Service
 * @version 9.0.0
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	modernMessaging,
	useModernMessaging,
	V9ModernMessagingService,
} from '../V9ModernMessagingService';

describe('V9ModernMessagingService', () => {
	let service: V9ModernMessagingService;

	beforeEach(() => {
		service = V9ModernMessagingService.getInstance();
		service.clearAll();
	});

	afterEach(() => {
		service.clearAll();
	});

	describe('Singleton Pattern', () => {
		it('should return the same instance', () => {
			const instance1 = V9ModernMessagingService.getInstance();
			const instance2 = V9ModernMessagingService.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe('Wait Screen Management', () => {
		it('should show and hide wait screen', () => {
			service.showWaitScreen({
				message: 'Please wait',
			});

			const state = service.getCurrentState();
			expect(state.waitScreen).toEqual({
				message: 'Please wait',
			});

			service.hideWaitScreen();
			const clearedState = service.getCurrentState();
			expect(clearedState.waitScreen).toBeUndefined();
		});
	});

	describe('Banner Management', () => {
		it('should show and hide banner', () => {
			service.showBanner({
				type: 'warning',
				title: 'Warning',
				message: 'This is a warning',
				dismissible: true,
			});

			const state = service.getCurrentState();
			expect(state.banner).toEqual({
				type: 'warning',
				title: 'Warning',
				message: 'This is a warning',
				dismissible: true,
			});

			service.hideBanner();
			const clearedState = service.getCurrentState();
			expect(clearedState.banner).toBeUndefined();
		});
	});

	describe('Critical Error Management', () => {
		it('should show and hide critical error', () => {
			service.showCriticalError({
				title: 'Critical Error',
				message: 'Something went wrong',
				contactSupport: true,
			});

			const state = service.getCurrentState();
			expect(state.criticalError).toEqual({
				title: 'Critical Error',
				message: 'Something went wrong',
				contactSupport: true,
			});

			service.hideCriticalError();
			const clearedState = service.getCurrentState();
			expect(clearedState.criticalError).toBeUndefined();
		});
	});

	describe('Footer Message Management', () => {
		it('should show and hide footer message', () => {
			service.showFooterMessage({
				type: 'info',
				message: 'Operation completed',
				duration: 3000,
			});

			const state = service.getCurrentState();
			expect(state.footerMessage).toEqual({
				type: 'info',
				message: 'Operation completed',
				duration: 3000,
			});

			service.hideFooterMessage();
			const clearedState = service.getCurrentState();
			expect(clearedState.footerMessage).toBeUndefined();
		});
	});

	describe('Clear All Messages', () => {
		it('should clear all message types', () => {
			// Set all message types
			service.showWaitScreen({ message: 'Wait' });
			service.showBanner({
				type: 'info',
				title: 'Info',
				message: 'Info message',
				dismissible: true,
			});
			service.showCriticalError({
				title: 'Error',
				message: 'Error message',
				contactSupport: false,
			});
			service.showFooterMessage({ type: 'status', message: 'Success', duration: 2000 });

			// Verify all are set
			let state = service.getCurrentState();
			expect(state.waitScreen).toBeDefined();
			expect(state.banner).toBeDefined();
			expect(state.criticalError).toBeDefined();
			expect(state.footerMessage).toBeDefined();

			// Clear all
			service.clearAll();

			// Verify all are cleared
			state = service.getCurrentState();
			expect(state.waitScreen).toBeUndefined();
			expect(state.banner).toBeUndefined();
			expect(state.criticalError).toBeUndefined();
			expect(state.footerMessage).toBeUndefined();
		});
	});

	describe('Subscription Pattern', () => {
		it('should notify subscribers of state changes', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			const unsubscribe1 = service.subscribe(listener1);
			const unsubscribe2 = service.subscribe(listener2);

			// Trigger state change
			service.showBanner({
				type: 'warning',
				title: 'Test',
				message: 'Test message',
				dismissible: true,
			});

			expect(listener1).toHaveBeenCalledWith(
				expect.objectContaining({
					banner: expect.objectContaining({
						title: 'Test',
						message: 'Test message',
					}),
				})
			);

			expect(listener2).toHaveBeenCalledWith(
				expect.objectContaining({
					banner: expect.objectContaining({
						title: 'Test',
						message: 'Test message',
					}),
				})
			);

			// Cleanup
			unsubscribe1();
			unsubscribe2();
		});

		it('should handle unsubscribe correctly', () => {
			const listener = vi.fn();
			const unsubscribe = service.subscribe(listener);

			// Trigger state change to verify listener is working
			service.showBanner({
				type: 'info',
				title: 'Test',
				message: 'Test message',
				dismissible: true,
			});

			// Verify listener was called
			expect(listener).toHaveBeenCalledTimes(1);

			// Now unsubscribe
			unsubscribe();

			// Trigger another state change
			service.showBanner({
				type: 'warning',
				title: 'Test 2',
				message: 'Test message 2',
				dismissible: true,
			});

			// Listener should not be called after unsubscribe (still only called once)
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});
});

describe('useModernMessaging Hook', () => {
	it('should provide message state and messaging service', () => {
		const { result } = renderHook(() => useModernMessaging());

		expect(result.current).toHaveLength(2);
		const [messageState, messaging] = result.current;

		expect(messageState).toBeDefined();
		expect(messaging).toBe(modernMessaging);
	});

	it('should update message state when service changes', async () => {
		const { result } = renderHook(() => useModernMessaging());

		// Initially no messages
		expect(result.current[0]).toEqual({});

		// Show a banner
		act(() => {
			result.current[1].showBanner({
				type: 'warning',
				title: 'Test Banner',
				message: 'Test message',
				dismissible: true,
			});
		});

		// State should be updated
		expect(result.current[0]).toEqual(
			expect.objectContaining({
				banner: expect.objectContaining({
					title: 'Test Banner',
					message: 'Test message',
				}),
			})
		);
	});

	it('should cleanup subscription on unmount', () => {
		const { result, unmount } = renderHook(() => useModernMessaging());

		// Get the messaging service
		const messaging = result.current[1];

		// Spy on the subscribe method to track calls
		const subscribeSpy = vi.spyOn(messaging, 'subscribe');

		// Unmount the hook
		unmount();

		// Verify subscribe was called during hook mount
		expect(subscribeSpy).toHaveBeenCalled();

		// Verify the spy was called exactly once (during mount, not during unmount)
		expect(subscribeSpy).toHaveBeenCalledTimes(1);
	});
});

describe('Modern Messaging Integration', () => {
	it('should handle multiple message types simultaneously', () => {
		const { result } = renderHook(() => useModernMessaging());
		const messaging = result.current[1];

		// Set multiple message types
		act(() => {
			messaging.showWaitScreen({
				message: 'Please wait...',
			});
			messaging.showFooterMessage({
				type: 'info',
				message: 'Background operation in progress',
				duration: 0,
			});
		});

		const state = result.current[0];
		expect(state.waitScreen).toEqual({
			message: 'Please wait...',
		});
		expect(state.footerMessage).toEqual({
			type: 'info',
			message: 'Background operation in progress',
			duration: 0,
		});
	});

	it('should handle message replacement correctly', () => {
		const { result } = renderHook(() => useModernMessaging());
		const messaging = result.current[1];

		// Show initial banner
		act(() => {
			messaging.showBanner({
				type: 'warning',
				title: 'First Warning',
				message: 'First message',
				dismissible: true,
			});
		});

		expect(result.current[0].banner?.title).toBe('First Warning');

		// Replace with different banner
		act(() => {
			messaging.showBanner({
				type: 'error',
				title: 'Second Warning',
				message: 'Second message',
				dismissible: false,
			});
		});

		expect(result.current[0].banner?.title).toBe('Second Warning');
		expect(result.current[0].banner?.type).toBe('error');
	});
});
