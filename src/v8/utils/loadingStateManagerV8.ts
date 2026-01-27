/**
 * @file loadingStateManagerV8.ts
 * @module v8/utils
 * @description Unified Loading State Management for V8 flows
 * @version 8.0.0
 * @since 2026-01-19
 *
 * Provides centralized loading state management with:
 * - Consistent loading patterns across flows
 * - Operation-specific loading states
 * - Automatic cleanup and error handling
 * - TypeScript support with proper typing
 */

import React, { useCallback, useRef, useState } from 'react';

export type LoadingOperation =
	| 'authenticate'
	| 'register-device'
	| 'load-devices'
	| 'send-otp'
	| 'validate-otp'
	| 'load-policies'
	| 'save-credentials'
	| 'load-credentials'
	| 'token-exchange'
	| 'authorization'
	| 'discovery'
	| 'device-selection'
	| 'flow-initialization'
	| 'custom';

export interface LoadingState {
	isLoading: boolean;
	operation: LoadingOperation | null;
	message?: string;
	progress?: number;
	startTime?: number;
}

export interface LoadingManagerOptions {
	/** Enable automatic timeout (default: 30000ms) */
	timeoutMs?: number;
	/** Custom timeout message */
	timeoutMessage?: string;
	/** Enable progress tracking */
	enableProgress?: boolean;
	/** Operation-specific messages */
	messages?: Partial<Record<LoadingOperation, string>>;
}

/**
 * Loading State Manager Hook
 *
 * Provides unified loading state management for flows with operation-specific
 * tracking, automatic timeouts, and consistent patterns.
 *
 * @example
 * ```typescript
 * const { loadingState, startLoading, stopLoading, withLoading } = useLoadingStateManager({
 *   messages: {
 *     'authenticate': 'Authenticating...',
 *     'register-device': 'Registering device...',
 *   }
 * });
 *
 * // Start loading
 * startLoading('authenticate', 'Verifying credentials');
 *
 * // Stop loading
 * stopLoading();
 *
 * // Wrap async operation
 * await withLoading('register-device', async () => {
 *   await registerDevice(params);
 * });
 * ```
 */
export const useLoadingStateManager = (options: LoadingManagerOptions = {}) => {
	const {
		timeoutMs = 30000,
		timeoutMessage = 'Operation timed out',
		enableProgress = false,
		messages = {},
	} = options;

	const [loadingState, setLoadingState] = useState<LoadingState>({
		isLoading: false,
		operation: null,
		message: undefined,
		progress: undefined,
		startTime: undefined,
	});

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const operationRef = useRef<LoadingOperation | null>(null);

	/**
	 * Clear any existing timeout
	 */
	const clearTimeout = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	/**
	 * Start loading for a specific operation
	 */
	const startLoading = useCallback(
		(operation: LoadingOperation, customMessage?: string, initialProgress?: number) => {
			// Clear any existing timeout
			clearTimeout();

			// Set timeout for this operation
			if (timeoutMs > 0) {
				timeoutRef.current = setTimeout(() => {
					setLoadingState((prev) => ({
						...prev,
						isLoading: false,
						operation: null,
						message: timeoutMessage,
					}));
					clearTimeout();
				}, timeoutMs);
			}

			// Update loading state
			operationRef.current = operation;
			setLoadingState({
				isLoading: true,
				operation,
				message: customMessage || messages[operation] || getDefaultMessage(operation),
				progress: enableProgress ? (initialProgress ?? 0) : undefined,
				startTime: Date.now(),
			});
		},
		[timeoutMs, timeoutMessage, enableProgress, messages, clearTimeout]
	);

	/**
	 * Stop loading
	 */
	const stopLoading = useCallback(
		(finalMessage?: string) => {
			clearTimeout();
			operationRef.current = null;
			setLoadingState((prev) => ({
				...prev,
				isLoading: false,
				operation: null,
				message: finalMessage,
				progress: undefined,
			}));
		},
		[clearTimeout]
	);

	/**
	 * Update loading progress (if enabled)
	 */
	const updateProgress = useCallback(
		(progress: number, message?: string) => {
			if (enableProgress && loadingState.isLoading) {
				setLoadingState((prev) => ({
					...prev,
					progress: Math.max(0, Math.min(100, progress)),
					message: message || prev.message,
				}));
			}
		},
		[enableProgress, loadingState.isLoading]
	);

	/**
	 * Update loading message
	 */
	const updateMessage = useCallback(
		(message: string) => {
			if (loadingState.isLoading) {
				setLoadingState((prev) => ({
					...prev,
					message,
				}));
			}
		},
		[loadingState.isLoading]
	);

	/**
	 * Wrap an async operation with loading state management
	 */
	const withLoading = useCallback(
		async <T>(
			operation: LoadingOperation,
			asyncFn: () => Promise<T>,
			customMessage?: string
		): Promise<T> => {
			try {
				startLoading(operation, customMessage);
				const result = await asyncFn();
				stopLoading();
				return result;
			} catch (error) {
				stopLoading(
					`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
				throw error;
			}
		},
		[startLoading, stopLoading]
	);

	/**
	 * Get loading duration in milliseconds
	 */
	const getDuration = useCallback(() => {
		if (!loadingState.startTime) return 0;
		return Date.now() - loadingState.startTime;
	}, [loadingState.startTime]);

	/**
	 * Check if currently loading a specific operation
	 */
	const isLoadingOperation = useCallback(
		(operation: LoadingOperation) => {
			return loadingState.isLoading && loadingState.operation === operation;
		},
		[loadingState]
	);

	/**
	 * Force stop loading (for cleanup)
	 */
	const forceStop = useCallback(() => {
		clearTimeout();
		operationRef.current = null;
		setLoadingState({
			isLoading: false,
			operation: null,
			message: undefined,
			progress: undefined,
			startTime: undefined,
		});
	}, [clearTimeout]);

	// Cleanup on unmount
	React.useEffect(() => {
		return forceStop;
	}, [forceStop]);

	return {
		// State
		loadingState,

		// Actions
		startLoading,
		stopLoading,
		updateProgress,
		updateMessage,
		withLoading,

		// Utilities
		getDuration,
		isLoadingOperation,
		forceStop,

		// Quick checks
		isLoading: loadingState.isLoading,
		currentOperation: loadingState.operation,
		currentMessage: loadingState.message,
		progress: loadingState.progress,
	};
};

/**
 * Get default message for operation
 */
function getDefaultMessage(operation: LoadingOperation): string {
	switch (operation) {
		case 'authenticate':
			return 'Authenticating...';
		case 'register-device':
			return 'Registering device...';
		case 'load-devices':
			return 'Loading devices...';
		case 'send-otp':
			return 'Sending verification code...';
		case 'validate-otp':
			return 'Verifying code...';
		case 'load-policies':
			return 'Loading policies...';
		case 'save-credentials':
			return 'Saving credentials...';
		case 'load-credentials':
			return 'Loading credentials...';
		case 'token-exchange':
			return 'Exchanging tokens...';
		case 'authorization':
			return 'Authorizing...';
		case 'discovery':
			return 'Discovering configuration...';
		case 'device-selection':
			return 'Preparing device selection...';
		case 'flow-initialization':
			return 'Initializing flow...';
		case 'custom':
			return 'Processing...';
		default:
			return 'Loading...';
	}
}

/**
 * Default loading state manager with common MFA configurations
 */
export const useMFALoadingStateManager = () => {
	return useLoadingStateManager({
		timeoutMs: 45000, // MFA operations can take longer
		messages: {
			authenticate: 'Verifying identity...',
			'register-device': 'Registering MFA device...',
			'load-devices': 'Loading your MFA devices...',
			'send-otp': 'Sending verification code...',
			'validate-otp': 'Verifying your code...',
			'load-policies': 'Loading authentication policies...',
		},
	});
};

/**
 * Default loading state manager with common Unified flow configurations
 */
export const useUnifiedFlowLoadingStateManager = () => {
	return useLoadingStateManager({
		timeoutMs: 30000,
		messages: {
			'save-credentials': 'Saving OAuth credentials...',
			'load-credentials': 'Loading OAuth credentials...',
			'token-exchange': 'Exchanging authorization code...',
			authorization: 'Authorizing with PingOne...',
			discovery: 'Discovering PingOne configuration...',
			'flow-initialization': 'Initializing OAuth flow...',
		},
	});
};

/**
 * Simple loading state for basic operations
 */
export const useSimpleLoadingState = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string>();

	const startLoading = useCallback((customMessage?: string) => {
		setIsLoading(true);
		setMessage(customMessage);
	}, []);

	const stopLoading = useCallback(() => {
		setIsLoading(false);
		setMessage(undefined);
	}, []);

	return {
		isLoading,
		message,
		startLoading,
		stopLoading,
	};
};
