/**
 * @file ApiDisplayService.ts
 * @module protect-app/services
 * @description API call tracking service for Protect Portal
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Services:
 * - Track all Protect Portal API calls
 * - Filter by Protect-specific endpoints
 * - Provide real-time API monitoring
 * - Support toggle functionality
 */

const MODULE_TAG = '[🔍 PROTECT-API-DISPLAY]';

export interface ProtectApiCall {
	id: string;
	method: string;
	url: string;
	headers?: Record<string, string>;
	body?: unknown;
	response?: {
		status: number;
		data?: unknown;
	};
	timestamp: number;
	actualPingOneUrl?: string;
	isProxy?: boolean;
	apiType: {
		icon: string;
		label: string;
		category: 'auth' | 'risk' | 'user' | 'admin' | 'system';
	};
}

export interface ApiDisplayConfig {
	enabled: boolean;
	maxCalls: number;
	filterCategories: string[];
}

// Internal state
let apiCalls: ProtectApiCall[] = [];
let config: ApiDisplayConfig = {
	enabled: false,
	maxCalls: 50,
	filterCategories: ['auth', 'risk', 'user', 'admin', 'system'],
};

/**
 * Track an API call
 */
export const trackCall = (call: Omit<ProtectApiCall, 'apiType'>): void => {
	if (!config.enabled) return;

	const apiType = determineApiType(call);
	const protectCall: ProtectApiCall = {
		...call,
		apiType,
	};

	apiCalls.unshift(protectCall);

	// Keep only the most recent calls
	if (apiCalls.length > config.maxCalls) {
		apiCalls = apiCalls.slice(0, config.maxCalls);
	}

	console.log(`${MODULE_TAG} API call tracked:`, apiType.label, call.method, call.url);
};

/**
 * Determine API type based on URL and method
 */
const determineApiType = (call: Omit<ProtectApiCall, 'apiType'>): ProtectApiCall['apiType'] => {
	const url = call.url.toLowerCase();

	// Risk evaluation APIs
	if (url.includes('risk-evaluation') || url.includes('risk-score')) {
		return {
			icon: '🔍',
			label: 'Risk Evaluation',
			category: 'risk',
		};
	}

	// Authentication APIs
	if (url.includes('authorize') || url.includes('token') || url.includes('login')) {
		return {
			icon: '🔐',
			label: 'Authentication',
			category: 'auth',
		};
	}

	// User management APIs
	if (url.includes('user') || url.includes('profile')) {
		return {
			icon: '👤',
			label: 'User Management',
			category: 'user',
		};
	}

	// Admin APIs
	if (url.includes('admin') || url.includes('settings')) {
		return {
			icon: '⚙️',
			label: 'Administration',
			category: 'admin',
		};
	}

	// System APIs
	if (url.includes('health') || url.includes('status') || url.includes('config')) {
		return {
			icon: '🔧',
			label: 'System',
			category: 'system',
		};
	}

	// Default
	return {
		icon: '📡',
		label: 'API Call',
		category: 'system',
	};
};

/**
 * Get all tracked API calls
 */
export const getApiCalls = (): ProtectApiCall[] => {
	return apiCalls;
};

/**
 * Get API calls filtered by category
 */
export const getApiCallsByCategory = (category: string): ProtectApiCall[] => {
	return apiCalls.filter((call) => call.apiType.category === category);
};

/**
 * Clear all tracked calls
 */
export const clearCalls = (): void => {
	apiCalls = [];
	console.log(`${MODULE_TAG} All API calls cleared`);
};

/**
 * Enable/disable API display
 */
export const setEnabled = (enabled: boolean): void => {
	config.enabled = enabled;
	console.log(`${MODULE_TAG} API display ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Get current configuration
 */
export const getConfig = (): ApiDisplayConfig => {
	return { ...config };
};

/**
 * Update configuration
 */
export const updateConfig = (updates: Partial<ApiDisplayConfig>): void => {
	config = { ...config, ...updates };
	console.log(`${MODULE_TAG} Configuration updated:`, updates);
};

/**
 * Get call statistics
 */
export const getStatistics = () => {
	const stats = apiCalls.reduce(
		(acc, call) => {
			const category = call.apiType.category;
			acc[category] = (acc[category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	return {
		totalCalls: apiCalls.length,
		byCategory: stats,
		enabled: config.enabled,
	};
};

// Export as default object for backward compatibility
const ApiDisplayService = {
	trackCall,
	getApiCalls,
	getApiCallsByCategory,
	clearCalls,
	setEnabled,
	getConfig,
	updateConfig,
	getStatistics,
};

export default ApiDisplayService;
