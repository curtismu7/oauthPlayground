/**
 * @file apiDisplayServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for API Display Service V8
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDisplayServiceV8 } from '../apiDisplayServiceV8';

describe('ApiDisplayServiceV8', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe('isVisible', () => {
		it('should return true by default', () => {
			expect(apiDisplayServiceV8.isVisible()).toBe(true);
		});
	});

	describe('show', () => {
		it('should set visibility to true', () => {
			apiDisplayServiceV8.hide();
			apiDisplayServiceV8.show();
			expect(apiDisplayServiceV8.isVisible()).toBe(true);
		});

		it('should save state to localStorage', () => {
			apiDisplayServiceV8.show();
			expect(localStorage.getItem('apiDisplay.visible')).toBe('true');
		});

		it('should notify listeners', () => {
			const listener = vi.fn();
			apiDisplayServiceV8.subscribe(listener);
			apiDisplayServiceV8.hide();
			apiDisplayServiceV8.show();
			expect(listener).toHaveBeenCalledWith(true);
		});
	});

	describe('hide', () => {
		it('should set visibility to false', () => {
			apiDisplayServiceV8.hide();
			expect(apiDisplayServiceV8.isVisible()).toBe(false);
		});

		it('should save state to localStorage', () => {
			apiDisplayServiceV8.hide();
			expect(localStorage.getItem('apiDisplay.visible')).toBe('false');
		});

		it('should notify listeners', () => {
			const listener = vi.fn();
			apiDisplayServiceV8.subscribe(listener);
			apiDisplayServiceV8.hide();
			expect(listener).toHaveBeenCalledWith(false);
		});
	});

	describe('toggle', () => {
		it('should toggle visibility from true to false', () => {
			apiDisplayServiceV8.show();
			apiDisplayServiceV8.toggle();
			expect(apiDisplayServiceV8.isVisible()).toBe(false);
		});

		it('should toggle visibility from false to true', () => {
			apiDisplayServiceV8.hide();
			apiDisplayServiceV8.toggle();
			expect(apiDisplayServiceV8.isVisible()).toBe(true);
		});

		it('should notify listeners', () => {
			const listener = vi.fn();
			apiDisplayServiceV8.subscribe(listener);
			apiDisplayServiceV8.toggle();
			expect(listener).toHaveBeenCalled();
		});
	});

	describe('subscribe', () => {
		it('should call listener when visibility changes', () => {
			const listener = vi.fn();
			apiDisplayServiceV8.subscribe(listener);
			apiDisplayServiceV8.toggle();
			expect(listener).toHaveBeenCalled();
		});

		it('should return unsubscribe function', () => {
			const listener = vi.fn();
			const unsubscribe = apiDisplayServiceV8.subscribe(listener);
			unsubscribe();
			apiDisplayServiceV8.toggle();
			expect(listener).not.toHaveBeenCalled();
		});

		it('should support multiple listeners', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			apiDisplayServiceV8.subscribe(listener1);
			apiDisplayServiceV8.subscribe(listener2);
			apiDisplayServiceV8.toggle();
			expect(listener1).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});
	});
});
