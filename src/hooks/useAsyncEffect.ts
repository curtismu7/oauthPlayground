/**
 * Custom hook for handling async operations in useEffect
 *
 * This hook provides a safe way to run async operations in useEffect
 * with proper error handling and cleanup.
 *
 * @example
 * ```typescript
 * useAsyncEffect(async () => {
 *   const data = await fetchData();
 *   setData(data);
 * }, [dependency]);
 * ```
 */

import { DependencyList, useEffect } from 'react';

type AsyncEffectCallback = () => Promise<void>;
type CleanupFunction = () => void;

export function useAsyncEffect(
	effect: AsyncEffectCallback,
	deps: DependencyList,
	onError?: (error: Error) => void
): void {
	useEffect(() => {
		let cancelled = false;

		const runEffect = async () => {
			try {
				await effect();
			} catch (error) {
				if (!cancelled) {
					if (onError) {
						onError(error as Error);
					} else {
						console.error('[useAsyncEffect] Unhandled error:', error);
					}
				}
			}
		};

		void runEffect();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}

/**
 * Custom hook for handling async operations with loading state
 *
 * @example
 * ```typescript
 * const { loading, error } = useAsyncEffectWithState(async () => {
 *   const data = await fetchData();
 *   setData(data);
 * }, [dependency]);
 * ```
 */

import { useState } from 'react';

interface AsyncEffectState {
	loading: boolean;
	error: Error | null;
}

export function useAsyncEffectWithState(
	effect: AsyncEffectCallback,
	deps: DependencyList
): AsyncEffectState {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		const runEffect = async () => {
			try {
				await effect();
				if (!cancelled) {
					setLoading(false);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err as Error);
					setLoading(false);
				}
			}
		};

		void runEffect();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return { loading, error };
}
