// Smart polling utilities for device code flow

import {
	DeviceTokenError,
	DeviceTokenResponse,
	getNextPollingInterval,
	isDeviceTokenError,
	isPollingFailure,
	shouldContinuePolling,
} from './deviceCode';
import { logger } from './logger';

export interface PollingOptions {
	interval: number;
	maxAttempts?: number;
	maxDuration?: number;
	onProgress?: (attempt: number, totalAttempts: number, status: string) => void;
	onSuccess?: (response: DeviceTokenResponse) => void;
	onError?: (error: Error) => void;
	onSlowDown?: (newInterval: number) => void;
}

export interface PollingResult {
	success: boolean;
	response?: DeviceTokenResponse;
	error?: Error;
	attempts: number;
	duration: number;
	reason: 'success' | 'timeout' | 'max-attempts' | 'failure' | 'cancelled';
}

/**
 * Create a smart poller for device code flow
 */
export function createSmartPoller(
	pollFn: () => Promise<DeviceTokenResponse>,
	options: PollingOptions
): {
	start: () => Promise<PollingResult>;
	stop: () => void;
	isRunning: () => boolean;
} {
	let isRunning = false;
	let timeoutId: NodeJS.Timeout | null = null;
	let startTime: number = 0;
	let attempts = 0;
	let currentInterval = options.interval;
	let cancelled = false;

	const stop = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		isRunning = false;
		cancelled = true;
		logger.info('POLLING', 'Polling stopped by user');
	};

	const isRunningFn = () => isRunning;

	const start = async (): Promise<PollingResult> => {
		if (isRunning) {
			throw new Error('Poller is already running');
		}

		isRunning = true;
		startTime = Date.now();
		attempts = 0;
		currentInterval = options.interval;
		cancelled = false;

		logger.info('POLLING', 'Smart poller started', {
			interval: currentInterval,
			maxAttempts: options.maxAttempts,
			maxDuration: options.maxDuration,
		});

		return new Promise((resolve) => {
			const poll = async () => {
				if (!isRunning || cancelled) {
					resolve({
						success: false,
						attempts,
						duration: Date.now() - startTime,
						reason: cancelled ? 'cancelled' : 'timeout',
					});
					return;
				}

				attempts++;
				const currentDuration = Date.now() - startTime;

				// Check max attempts
				if (options.maxAttempts && attempts > options.maxAttempts) {
					logger.warn('POLLING', 'Max attempts reached', {
						attempts,
						maxAttempts: options.maxAttempts,
					});
					isRunning = false;
					resolve({
						success: false,
						attempts,
						duration: currentDuration,
						reason: 'max-attempts',
					});
					return;
				}

				// Check max duration
				if (options.maxDuration && currentDuration > options.maxDuration) {
					logger.warn('POLLING', 'Max duration reached', {
						duration: currentDuration,
						maxDuration: options.maxDuration,
					});
					isRunning = false;
					resolve({
						success: false,
						attempts,
						duration: currentDuration,
						reason: 'timeout',
					});
					return;
				}

				try {
					logger.info('POLLING', 'Polling attempt', {
						attempt: attempts,
						interval: currentInterval,
					});

					if (options.onProgress) {
						options.onProgress(attempts, options.maxAttempts || Infinity, 'polling');
					}

					const response = await pollFn();

					if (isDeviceTokenError(response)) {
						const error = response as DeviceTokenError;

						if (shouldContinuePolling(error)) {
							// Continue polling
							if (options.onProgress) {
								options.onProgress(attempts, options.maxAttempts || Infinity, error.error);
							}

							// Adjust interval if slow_down
							if (error.error === 'slow_down') {
								currentInterval = getNextPollingInterval(error, currentInterval);
								if (options.onSlowDown) {
									options.onSlowDown(currentInterval);
								}
								logger.info('POLLING', 'Slow down received, adjusting interval', {
									newInterval: currentInterval,
								});
							}

							// Schedule next poll
							timeoutId = setTimeout(poll, currentInterval);
						} else if (isPollingFailure(error)) {
							// Stop polling due to failure
							logger.error('POLLING', 'Polling failed', {
								error: error.error,
								description: error.error_description,
							});
							isRunning = false;
							resolve({
								success: false,
								attempts,
								duration: currentDuration,
								reason: 'failure',
								error: new Error(error.error_description || error.error),
							});
						} else {
							// Unknown error, stop polling
							logger.error('POLLING', 'Unknown polling error', { error: error.error });
							isRunning = false;
							resolve({
								success: false,
								attempts,
								duration: currentDuration,
								reason: 'failure',
								error: new Error(error.error_description || error.error),
							});
						}
					} else {
						// Success!
						logger.success('POLLING', 'Polling completed successfully', {
							attempts,
							duration: currentDuration,
						});
						isRunning = false;

						if (options.onSuccess) {
							options.onSuccess(response);
						}

						resolve({
							success: true,
							response,
							attempts,
							duration: currentDuration,
							reason: 'success',
						});
					}
				} catch (error) {
					logger.error('POLLING', 'Polling attempt failed', error);

					if (options.onError) {
						options.onError(error as Error);
					}

					// On network errors, continue polling with exponential backoff
					currentInterval = Math.min(currentInterval * 1.5, 30000); // Cap at 30 seconds
					timeoutId = setTimeout(poll, currentInterval);
				}
			};

			// Start first poll immediately
			poll();
		});
	};

	return { start, stop, isRunning: isRunningFn };
}

/**
 * Handle standard device flow polling responses
 */
export function handlePollingResponse(response: DeviceTokenResponse): {
	shouldContinue: boolean;
	shouldStop: boolean;
	isSuccess: boolean;
	nextInterval?: number;
	error?: Error;
} {
	if (isDeviceTokenError(response)) {
		const error = response as DeviceTokenError;

		if (shouldContinuePolling(error)) {
			return {
				shouldContinue: true,
				shouldStop: false,
				isSuccess: false,
				nextInterval: error.error === 'slow_down' ? getNextPollingInterval(error, 5000) : undefined,
			};
		} else if (isPollingFailure(error)) {
			return {
				shouldContinue: false,
				shouldStop: true,
				isSuccess: false,
				error: new Error(error.error_description || error.error),
			};
		}
	}

	// Success case
	return {
		shouldContinue: false,
		shouldStop: true,
		isSuccess: true,
	};
}

/**
 * Format polling status for display
 */
export function formatPollingStatus(status: string, attempt: number): string {
	switch (status) {
		case 'authorization_pending':
			return `Waiting for authorization... (attempt ${attempt})`;
		case 'slow_down':
			return `Please wait, slowing down polling... (attempt ${attempt})`;
		case 'polling':
			return `Checking for authorization... (attempt ${attempt})`;
		default:
			return `Status: ${status} (attempt ${attempt})`;
	}
}

/**
 * Calculate remaining time for user code expiry
 */
export function calculateRemainingTime(expiresIn: number, startTime: number): number {
	const elapsed = Date.now() - startTime;
	return Math.max(0, expiresIn * 1000 - elapsed);
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
	const minutes = Math.floor(milliseconds / 60000);
	const seconds = Math.floor((milliseconds % 60000) / 1000);

	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}
