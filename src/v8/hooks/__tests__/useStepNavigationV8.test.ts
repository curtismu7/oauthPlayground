/**
 * @file useStepNavigationV8.test.ts
 * @module v8/hooks/__tests__
 * @description Tests for useStepNavigationV8 hook
 * @version 8.0.0
 * @since 2024-11-16
 */

import { act, renderHook } from '@testing-library/react';
import useStepNavigationV8 from '../useStepNavigationV8';

describe('useStepNavigationV8', () => {
	describe('Initial State', () => {
		it('should initialize with first step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			expect(result.current.currentStep).toBe(0);
			expect(result.current.completedSteps).toEqual([]);
			expect(result.current.validationErrors).toEqual([]);
			expect(result.current.validationWarnings).toEqual([]);
		});

		it('should initialize with custom initial step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4, { initialStep: 2 }));

			expect(result.current.currentStep).toBe(2);
		});

		it('should allow going to next step initially', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			expect(result.current.canGoNext).toBe(true);
		});

		it('should not allow going to previous step initially', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			expect(result.current.canGoPrevious).toBe(false);
		});
	});

	describe('Step Navigation', () => {
		it('should go to next step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToNext();
			});

			expect(result.current.currentStep).toBe(1);
		});

		it('should go to previous step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4, { initialStep: 1 }));

			act(() => {
				result.current.goToPrevious();
			});

			expect(result.current.currentStep).toBe(0);
		});

		it('should go to specific step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(2);
			});

			expect(result.current.currentStep).toBe(2);
		});

		it('should not go beyond last step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4, { initialStep: 3 }));

			act(() => {
				result.current.goToNext();
			});

			expect(result.current.currentStep).toBe(3);
		});

		it('should not go before first step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToPrevious();
			});

			expect(result.current.currentStep).toBe(0);
		});

		it('should not go to invalid step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(10);
			});

			expect(result.current.currentStep).toBe(0);
		});
	});

	describe('Step Completion', () => {
		it('should mark step as completed', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.markStepComplete();
			});

			expect(result.current.completedSteps).toContain(0);
		});

		it('should mark step as completed when moving forward', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(1);
			});

			expect(result.current.completedSteps).toContain(0);
		});

		it('should not duplicate completed steps', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.markStepComplete();
				result.current.markStepComplete();
			});

			expect(result.current.completedSteps.filter((s) => s === 0)).toHaveLength(1);
		});

		it('should track multiple completed steps', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(1);
				result.current.goToStep(2);
				result.current.goToStep(3);
			});

			expect(result.current.completedSteps).toEqual([0, 1, 2]);
		});
	});

	describe('Validation Errors', () => {
		it('should set validation errors', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Error 1', 'Error 2']);
			});

			expect(result.current.validationErrors).toEqual(['Error 1', 'Error 2']);
		});

		it('should prevent going to next step with errors', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Error']);
			});

			expect(result.current.canGoNext).toBe(false);
		});

		it('should allow going to next step without errors', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors([]);
			});

			expect(result.current.canGoNext).toBe(true);
		});

		it('should clear errors when moving to next step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Error']);
				result.current.setValidationErrors([]);
				result.current.goToNext();
			});

			expect(result.current.currentStep).toBe(1);
			expect(result.current.validationErrors).toEqual([]);
		});

		it('should not go to next step if errors are set', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Error']);
				result.current.goToNext();
			});

			expect(result.current.currentStep).toBe(0);
		});
	});

	describe('Validation Warnings', () => {
		it('should set validation warnings', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationWarnings(['Warning 1', 'Warning 2']);
			});

			expect(result.current.validationWarnings).toEqual(['Warning 1', 'Warning 2']);
		});

		it('should allow going to next step with warnings', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationWarnings(['Warning']);
				result.current.goToNext();
			});

			expect(result.current.currentStep).toBe(1);
		});
	});

	describe('Reset', () => {
		it('should reset to initial step', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(2);
				result.current.reset();
			});

			expect(result.current.currentStep).toBe(0);
		});

		it('should clear completed steps on reset', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(2);
				result.current.reset();
			});

			expect(result.current.completedSteps).toEqual([]);
		});

		it('should clear validation errors on reset', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Error']);
				result.current.reset();
			});

			expect(result.current.validationErrors).toEqual([]);
		});

		it('should clear validation warnings on reset', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationWarnings(['Warning']);
				result.current.reset();
			});

			expect(result.current.validationWarnings).toEqual([]);
		});
	});

	describe('Error Message Formatting', () => {
		it('should return empty string with no errors', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			expect(result.current.getErrorMessage()).toBe('');
		});

		it('should return single error message', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Environment ID is required']);
			});

			expect(result.current.getErrorMessage()).toBe('Environment ID is required');
		});

		it('should format multiple errors with bullets', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.setValidationErrors(['Environment ID is required', 'Client ID is required']);
			});

			const message = result.current.getErrorMessage();
			expect(message).toContain('Missing required fields:');
			expect(message).toContain('• Environment ID is required');
			expect(message).toContain('• Client ID is required');
		});
	});

	describe('Callbacks', () => {
		it('should call onStepChange when step changes', () => {
			const onStepChange = jest.fn();
			const { result } = renderHook(() => useStepNavigationV8(4, { onStepChange }));

			act(() => {
				result.current.goToStep(1);
			});

			expect(onStepChange).toHaveBeenCalledWith(1);
		});

		it('should call onValidationChange when errors change', () => {
			const onValidationChange = jest.fn();
			const { result } = renderHook(() => useStepNavigationV8(4, { onValidationChange }));

			act(() => {
				result.current.setValidationErrors(['Error']);
			});

			expect(onValidationChange).toHaveBeenCalledWith(['Error']);
		});

		it('should call onStepChange on reset', () => {
			const onStepChange = jest.fn();
			const { result } = renderHook(() => useStepNavigationV8(4, { initialStep: 2, onStepChange }));

			act(() => {
				result.current.reset();
			});

			expect(onStepChange).toHaveBeenCalledWith(0);
		});
	});

	describe('Edge Cases', () => {
		it('should handle single step flow', () => {
			const { result } = renderHook(() => useStepNavigationV8(1));

			expect(result.current.currentStep).toBe(0);
			expect(result.current.canGoNext).toBe(true);
		});

		it('should handle many steps', () => {
			const { result } = renderHook(() => useStepNavigationV8(100));

			act(() => {
				result.current.goToStep(50);
			});

			expect(result.current.currentStep).toBe(50);
		});

		it('should handle rapid step changes', () => {
			const { result } = renderHook(() => useStepNavigationV8(4));

			act(() => {
				result.current.goToStep(1);
				result.current.goToStep(2);
				result.current.goToStep(3);
				result.current.goToPrevious();
			});

			expect(result.current.currentStep).toBe(2);
		});
	});
});
