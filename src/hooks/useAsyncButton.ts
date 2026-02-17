/**
 * @file useAsyncButton.ts
 * @module hooks
 * @description Hook to automatically add loading state to async button operations
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

interface UseAsyncButtonOptions {
	loadingText?: string;
	spinnerSize?: number;
	spinnerPosition?: 'left' | 'right' | 'center';
	onSuccess?: (result: any) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
}

interface AsyncButtonState {
	isLoading: boolean;
	error: Error | null;
	execute: (asyncFn: () => Promise<any>) => Promise<any>;
}

export const useAsyncButton = (options: UseAsyncButtonOptions = {}): AsyncButtonState => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const execute = useCallback(
		async (asyncFn: () => Promise<any>) => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await asyncFn();
				options.onSuccess?.(result);
				return result;
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Unknown error');
				setError(error);
				options.onError?.(error);
				throw error;
			} finally {
				setIsLoading(false);
				options.onComplete?.();
			}
		},
		[options]
	);

	return {
		isLoading,
		error,
		execute,
	};
};

/**
 * Higher-order component that wraps any async function with loading state
 */
export const withAsyncButton = (
	asyncFn: () => Promise<any>,
	options: UseAsyncButtonOptions = {}
) => {
	const { isLoading, execute } = useAsyncButton(options);

	return {
		isLoading,
		execute: () => execute(asyncFn),
	};
};
