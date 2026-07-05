

/**
 * Check if analytics server is available (always returns false - disabled)
 */
export async function isAnalyticsServerAvailable(): Promise<boolean> {
	// Analytics is completely disabled
	return false;
}

/**
 * Safely send analytics data only if server is available (always disabled)
 */
export async function safeAnalyticsFetch(_data: Record<string, unknown>): Promise<void> {
	// Analytics is completely disabled - no fetch calls made
	return;
}

/**
 * Reset cache (useful for testing or manual refresh)
 */
export function resetAnalyticsServerCache(): void {
}
