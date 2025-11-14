import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAsyncEffect, useAsyncEffectWithState } from '../useAsyncEffect';

describe('useAsyncEffect', () => {
  it('should execute async effect successfully', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useAsyncEffect(mockEffect, []));

    await waitFor(() => {
      expect(mockEffect).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle errors with custom error handler', async () => {
    const mockError = new Error('Test error');
    const mockEffect = vi.fn().mockRejectedValue(mockError);
    const mockErrorHandler = vi.fn();

    renderHook(() => useAsyncEffect(mockEffect, [], mockErrorHandler));

    await waitFor(() => {
      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
    });
  });

  it('should handle errors with default console.error', async () => {
    const mockError = new Error('Test error');
    const mockEffect = vi.fn().mockRejectedValue(mockError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useAsyncEffect(mockEffect, []));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useAsyncEffect] Unhandled error:',
        mockError
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should cleanup and prevent state updates after unmount', async () => {
    const mockEffect = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    const mockErrorHandler = vi.fn();

    const { unmount } = renderHook(() => useAsyncEffect(mockEffect, [], mockErrorHandler));

    unmount();

    await waitFor(() => {
      expect(mockEffect).toHaveBeenCalledTimes(1);
    });

    // Error handler should not be called after unmount
    expect(mockErrorHandler).not.toHaveBeenCalled();
  });

  it('should re-run effect when dependencies change', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);
    let dep = 1;

    const { rerender } = renderHook(() => useAsyncEffect(mockEffect, [dep]));

    await waitFor(() => {
      expect(mockEffect).toHaveBeenCalledTimes(1);
    });

    dep = 2;
    rerender();

    await waitFor(() => {
      expect(mockEffect).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useAsyncEffectWithState', () => {
  it('should start with loading true', () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useAsyncEffectWithState(mockEffect, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should set loading to false after successful effect', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useAsyncEffectWithState(mockEffect, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(null);
  });

  it('should set error and loading false on failure', async () => {
    const mockError = new Error('Test error');
    const mockEffect = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useAsyncEffectWithState(mockEffect, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should reset state when dependencies change', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);
    let dep = 1;

    const { result, rerender } = renderHook(() => useAsyncEffectWithState(mockEffect, [dep]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    dep = 2;
    rerender();

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should not update state after unmount', async () => {
    const mockEffect = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result, unmount } = renderHook(() => useAsyncEffectWithState(mockEffect, []));

    expect(result.current.loading).toBe(true);

    unmount();

    // Should not throw or update state after unmount
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
});
