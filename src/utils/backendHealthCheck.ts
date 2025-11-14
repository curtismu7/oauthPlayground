// src/utils/backendHealthCheck.ts
// Utility to ensure backend is ready before making API calls

let backendReady = false;
let healthCheckPromise: Promise<boolean> | null = null;

/**
 * Check if the backend server is ready to accept requests
 * Uses exponential backoff retry logic
 */
export async function ensureBackendReady(maxAttempts = 5): Promise<boolean> {
	// If already checked and ready, return immediately
	if (backendReady) {
		return true;
	}

	// If a health check is already in progress, wait for it
	if (healthCheckPromise) {
		return healthCheckPromise;
	}

	// Start a new health check
	healthCheckPromise = (async () => {
		let attempt = 0;
		const initialDelay = 50;

		while (attempt < maxAttempts) {
			try {
				const response = await fetch('/api/health', {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});

				if (response.ok) {
					backendReady = true;
					console.log('[Backend Health Check] Backend is ready');
					return true;
				}

				// Non-200 response, retry
				const delay = initialDelay * Math.pow(2, attempt);
				console.warn(
					`[Backend Health Check] Backend not ready (status ${response.status}), retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`
				);
				await new Promise(resolve => setTimeout(resolve, delay));
				attempt++;
			} catch (error) {
				// Network error, retry
				const delay = initialDelay * Math.pow(2, attempt);
				console.warn(
					`[Backend Health Check] Backend not reachable, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`,
					error
				);
				await new Promise(resolve => setTimeout(resolve, delay));
				attempt++;
			}
		}

		console.error('[Backend Health Check] Backend failed to become ready after', maxAttempts, 'attempts');
		return false;
	})();

	const result = await healthCheckPromise;
	healthCheckPromise = null;
	return result;
}

/**
 * Reset the backend ready state (useful for testing or after server restart)
 */
export function resetBackendReadyState(): void {
	backendReady = false;
	healthCheckPromise = null;
}
