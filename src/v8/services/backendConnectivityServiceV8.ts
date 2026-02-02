/**
 * @file backendConnectivityServiceV8.ts
 * @module v8/services
 * @description Service to monitor backend connectivity and show graceful error modal
 * @version 8.0.0
 */

const MODULE_TAG = '[🔌 BACKEND-CONNECTIVITY]';

interface BackendConnectivityState {
	isConnected: boolean;
	consecutiveFailures: number;
	lastCheckTime: number;
	modalShown: boolean;
}

class BackendConnectivityServiceV8 {
	private state: BackendConnectivityState = {
		isConnected: true,
		consecutiveFailures: 0,
		lastCheckTime: Date.now(),
		modalShown: false,
	};

	private readonly FAILURE_THRESHOLD = 2; // Show modal after 2 consecutive failures
	private readonly CHECK_COOLDOWN = 5000; // Don't check more than once per 5 seconds
	private listeners: Set<(isConnected: boolean) => void> = new Set();

	/**
	 * Check if an error is a backend connectivity issue
	 */
	isBackendConnectivityError(error: any): boolean {
		// Check for fetch network errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return true;
		}

		// Check for 500 errors from backend
		if (error?.response?.status === 500) {
			return true;
		}

		// Check for specific error messages
		const errorMsg = error?.message || String(error);
		if (
			errorMsg.includes('Failed to fetch') ||
			errorMsg.includes('NetworkError') ||
			errorMsg.includes('Failed to load resource') ||
			errorMsg.includes('500 (Internal Server Error)') ||
			errorMsg.includes('Backend returned an empty response')
		) {
			return true;
		}

		return false;
	}

	/**
	 * Record a failed API call
	 */
	recordFailure(): void {
		const now = Date.now();

		// Only count failures that happen within cooldown period
		if (now - this.state.lastCheckTime < this.CHECK_COOLDOWN) {
			this.state.consecutiveFailures++;
		} else {
			// Reset if enough time has passed
			this.state.consecutiveFailures = 1;
		}

		this.state.lastCheckTime = now;

		// Check if we should show the modal
		if (this.state.consecutiveFailures >= this.FAILURE_THRESHOLD && !this.state.modalShown) {
			this.state.isConnected = false;
			this.state.modalShown = true;
			this.notifyListeners(false);

			console.error(
				`${MODULE_TAG} Backend appears to be down (${this.state.consecutiveFailures} consecutive failures). Please restart the server.`
			);
		}
	}

	/**
	 * Record a successful API call
	 */
	recordSuccess(): void {
		const wasDisconnected = !this.state.isConnected;

		this.state.consecutiveFailures = 0;
		this.state.lastCheckTime = Date.now();
		this.state.isConnected = true;
		this.state.modalShown = false;

		if (wasDisconnected) {
			console.log(`${MODULE_TAG} Backend connection restored`);
			this.notifyListeners(true);
		}
	}

	/**
	 * Get current connectivity state
	 */
	getState(): BackendConnectivityState {
		return { ...this.state };
	}

	/**
	 * Reset the state (useful after user restarts server)
	 */
	reset(): void {
		this.state = {
			isConnected: true,
			consecutiveFailures: 0,
			lastCheckTime: Date.now(),
			modalShown: false,
		};
		this.notifyListeners(true);
	}

	/**
	 * Add a listener for connectivity changes
	 */
	addListener(callback: (isConnected: boolean) => void): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	/**
	 * Notify all listeners of connectivity change
	 */
	private notifyListeners(isConnected: boolean): void {
		this.listeners.forEach((callback) => {
			try {
				callback(isConnected);
			} catch (error) {
				console.error(`${MODULE_TAG} Error in connectivity listener:`, error);
			}
		});
	}

	/**
	 * Check if modal should be shown
	 */
	shouldShowModal(): boolean {
		return !this.state.isConnected && this.state.modalShown;
	}

	/**
	 * Dismiss the modal (but keep tracking failures)
	 */
	dismissModal(): void {
		this.state.modalShown = false;
	}
}

// Export singleton instance
export const backendConnectivityService = new BackendConnectivityServiceV8();
