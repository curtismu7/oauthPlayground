/**
 * @file apiDisplayService.test.ts
 * @module v8/services/__tests__
 * @description Tests for API Display Service V8
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDisplayService } from '../apiDisplayService';

describe('ApiDisplayService', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe('isVisible', () => {
		it('should return true by default', () => {
			expect(apiDisplayService.isVisible()).toBe(true);
		});
	});

	describe('show', () => {
		it('should set visibility to true', () => {
			apiDisplayService.hide();
			apiDisplayService.show();
			expect(apiDisplayService.isVisible()).toBe(true);
		});

		it('should save state to localStorage', () => {
			apiDisplayService.show();
			expect(localStorage.getItem('apiDisplay.visible')).toBe('true');
		});

		it('should notify listeners', () => {
			const listener = vi.fn();
			apiDisplayService.subscribe(listener);
			apiDisplayService.hide();
			apiDisplayService.show();
			expect(listener).toHaveBeenCalledWith(true);
		});
	});

	describe('hide', () => {
		it('should set visibility to false', () => {
			apiDisplayService.hide();
			expect(apiDisplayService.isVisible()).toBe(false);
		});

		it('should save state to localStorage', () => {
			apiDisplayService.hide();
			expect(localStorage.getItem('apiDisplay.visible')).toBe('false');
		});

		it('should notify listeners', () => {
			const listener = vi.fn();
			apiDisplayService.subscribe(listener);
			apiDisplayService.hide();
			expect(listener).toHaveBeenCalledWith(false);
		});
	});

	describe('toggle', () => {
		it('should toggle visibility from true to false', () => {
			apiDisplayService.show();
			apiDisplayService.toggle();
			expect(apiDisplayService.isVisible()).toBe(false);
		});

		it('should toggle visibility from false to true', () => {
			apiDisplayService.hide();
			apiDisplayService.toggle();
			expect(apiDisplayService.isVisible()).toBe(true);
		});

		it('should notify listeners', () => {
			const listener = vi.fn();
			apiDisplayService.subscribe(listener);
			apiDisplayService.toggle();
			expect(listener).toHaveBeenCalled();
		});
	});

	describe('subscribe', () => {
		it('should call listener when visibility changes', () => {
			const listener = vi.fn();
			apiDisplayService.subscribe(listener);
			apiDisplayService.toggle();
			expect(listener).toHaveBeenCalled();
		});

		it('should return unsubscribe function', () => {
			const listener = vi.fn();
			const unsubscribe = apiDisplayService.subscribe(listener);
			unsubscribe();
			apiDisplayService.toggle();
			expect(listener).not.toHaveBeenCalled();
		});

		it('should support multiple listeners', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			apiDisplayService.subscribe(listener1);
			apiDisplayService.subscribe(listener2);
			apiDisplayService.toggle();
			expect(listener1).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});
	});
});
