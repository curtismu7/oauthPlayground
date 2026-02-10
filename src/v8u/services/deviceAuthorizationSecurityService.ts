/**
 * @file deviceAuthorizationSecurityService.ts
 * @module v8u/services
 * @description Security service for device authorization flow
 * @version 8.0.0
 * @since 2026-02-10
 * 
 * This service provides security validation and rate limiting for the device authorization flow
 * to prevent abuse and ensure compliance with security best practices.
 */

const MODULE_TAG = '[🔒 DEVICE-AUTH-SECURITY]';

interface SecurityMetrics {
	requestCount: number;
	lastRequestTime: number;
	pollingCount: number;
	lastPollingTime: number;
	blockedAttempts: number;
}

interface ValidationResult {
	allowed: boolean;
	reason?: string;
	metrics: SecurityMetrics;
}

/**
 * Device Authorization Security Service
 * 
 * Provides security validation and rate limiting for device authorization requests
 * and polling attempts to prevent abuse and ensure compliance.
 */
export class DeviceAuthorizationSecurityService {
	private static readonly STORAGE_KEYS = {
		requestCount: 'v8u_device_auth_request_count',
		lastRequestTime: 'v8u_device_auth_last_request',
		pollingCount: 'v8u_device_polling_count',
		lastPollingTime: 'v8u_device_last_polling',
		blockedAttempts: 'v8u_device_blocked_attempts',
	} as const;

	private static readonly LIMITS = {
		maxRequestsPerMinute: 3,
		maxRequestsPerHour: 20,
		maxPollingPerHour: 60,
		maxScopes: 10,
		maxScopeLength: 100,
		requestTimeoutMs: 30000,
	} as const;

	private static readonly SCOPE_PATTERN = /^[a-zA-Z0-9._:-]+$/;

	/**
	 * Validate device authorization request
	 * 
	 * @param credentials - The credentials to validate
	 * @returns Validation result with security metrics
	 */
	static validateDeviceAuthRequest(credentials: {
		environmentId?: string;
		clientId?: string;
		scopes?: string;
	}): ValidationResult {
		const now = Date.now();
		const metrics = this.getSecurityMetrics();

		// Check rate limits
		if (!this.checkRateLimits(metrics, now)) {
			return {
				allowed: false,
				reason: 'Rate limit exceeded. Please wait before making another request.',
				metrics,
			};
		}

		// Validate required fields
		if (!credentials.environmentId?.trim()) {
			return {
				allowed: false,
				reason: 'Environment ID is required.',
				metrics,
			};
		}

		if (!credentials.clientId?.trim()) {
			return {
				allowed: false,
				reason: 'Client ID is required.',
				metrics,
			};
		}

		if (!credentials.scopes?.trim()) {
			return {
				allowed: false,
				reason: 'At least one scope is required.',
				metrics,
			};
		}

		// Validate scopes
		const scopeValidation = this.validateScopes(credentials.scopes);
		if (!scopeValidation.valid) {
			return {
				allowed: false,
				reason: scopeValidation.reason,
				metrics,
			};
		}

		// Update metrics for successful validation
		this.updateMetrics(metrics, now, 'request');

		return {
			allowed: true,
			metrics: this.getSecurityMetrics(),
		};
	}

	/**
	 * Validate polling request
	 * 
	 * @returns Validation result with security metrics
	 */
	static validatePollingRequest(): ValidationResult {
		const now = Date.now();
		const metrics = this.getSecurityMetrics();

		// Check polling rate limits
		if (metrics.pollingCount >= this.LIMITS.maxPollingPerHour && 
			now - metrics.lastPollingTime < 3600000) {
			return {
				allowed: false,
				reason: 'Polling rate limit exceeded. Please wait before polling again.',
				metrics,
			};
		}

		// Update metrics for successful validation
		this.updateMetrics(metrics, now, 'polling');

		return {
			allowed: true,
			metrics: this.getSecurityMetrics(),
		};
	}

	/**
	 * Validate scope format and content
	 * 
	 * @param scopes - Space-separated scopes string
	 * @returns Validation result
	 */
	private static validateScopes(scopes: string): { valid: boolean; reason?: string } {
		const scopeList = scopes.trim().split(/\s+/).filter(s => s.length > 0);

		// Check number of scopes
		if (scopeList.length > this.LIMITS.maxScopes) {
			return {
				valid: false,
				reason: `Too many scopes requested. Maximum ${this.LIMITS.maxScopes} scopes allowed.`,
			};
		}

		// Check each scope format
		const invalidScopes = scopeList.filter(scope => 
			!this.SCOPE_PATTERN.test(scope) || 
			scope.length > this.LIMITS.maxScopeLength
		);

		if (invalidScopes.length > 0) {
			return {
				valid: false,
				reason: `Invalid scope format detected: ${invalidScopes.join(', ')}`,
			};
		}

		return { valid: true };
	}

	/**
	 * Check rate limits against current metrics
	 * 
	 * @param metrics - Current security metrics
	 * @param now - Current timestamp
	 * @returns Whether the request is allowed
	 */
	private static checkRateLimits(metrics: SecurityMetrics, now: number): boolean {
		// Check per-minute limit
		if (now - metrics.lastRequestTime < 60000 && metrics.requestCount >= this.LIMITS.maxRequestsPerMinute) {
			return false;
		}

		// Check per-hour limit
		if (now - metrics.lastRequestTime < 3600000 && metrics.requestCount >= this.LIMITS.maxRequestsPerHour) {
			return false;
		}

		return true;
	}

	/**
	 * Get current security metrics from sessionStorage
	 * 
	 * @returns Current security metrics
	 */
	private static getSecurityMetrics(): SecurityMetrics {
		return {
			requestCount: parseInt(sessionStorage.getItem(this.STORAGE_KEYS.requestCount) || '0'),
			lastRequestTime: parseInt(sessionStorage.getItem(this.STORAGE_KEYS.lastRequestTime) || '0'),
			pollingCount: parseInt(sessionStorage.getItem(this.STORAGE_KEYS.pollingCount) || '0'),
			lastPollingTime: parseInt(sessionStorage.getItem(this.STORAGE_KEYS.lastPollingTime) || '0'),
			blockedAttempts: parseInt(sessionStorage.getItem(this.STORAGE_KEYS.blockedAttempts) || '0'),
		};
	}

	/**
	 * Update security metrics after a successful validation
	 * 
	 * @param metrics - Current metrics
	 * @param now - Current timestamp
	 * @param type - Type of operation ('request' or 'polling')
	 */
	private static updateMetrics(metrics: SecurityMetrics, now: number, type: 'request' | 'polling'): void {
		if (type === 'request') {
			// Update request metrics
			if (now - metrics.lastRequestTime < 60000) {
				// Within the same minute
				sessionStorage.setItem(this.STORAGE_KEYS.requestCount, (metrics.requestCount + 1).toString());
			} else if (now - metrics.lastRequestTime < 3600000) {
				// Within the same hour but different minute
				sessionStorage.setItem(this.STORAGE_KEYS.requestCount, '1');
			} else {
				// New hour
				sessionStorage.setItem(this.STORAGE_KEYS.requestCount, '1');
			}
			sessionStorage.setItem(this.STORAGE_KEYS.lastRequestTime, now.toString());
		} else {
			// Update polling metrics
			if (now - metrics.lastPollingTime < 3600000) {
				// Within the same hour
				sessionStorage.setItem(this.STORAGE_KEYS.pollingCount, (metrics.pollingCount + 1).toString());
			} else {
				// New hour
				sessionStorage.setItem(this.STORAGE_KEYS.pollingCount, '1');
			}
			sessionStorage.setItem(this.STORAGE_KEYS.lastPollingTime, now.toString());
		}
	}

	/**
	 * Record a blocked attempt
	 */
	static recordBlockedAttempt(): void {
		const blockedAttempts = parseInt(sessionStorage.getItem(this.STORAGE_KEYS.blockedAttempts) || '0');
		sessionStorage.setItem(this.STORAGE_KEYS.blockedAttempts, (blockedAttempts + 1).toString());
		
		console.warn(`${MODULE_TAG} Blocked attempt recorded. Total blocked attempts: ${blockedAttempts + 1}`);
	}

	/**
	 * Clear security metrics (for testing or reset)
	 */
	static clearMetrics(): void {
		Object.values(this.STORAGE_KEYS).forEach(key => {
			sessionStorage.removeItem(key);
		});
		console.log(`${MODULE_TAG} Security metrics cleared`);
	}

	/**
	 * Get security summary for monitoring
	 * 
	 * @returns Security summary
	 */
	static getSecuritySummary(): {
		metrics: SecurityMetrics;
		limits: typeof DeviceAuthorizationSecurityService.LIMITS;
		status: 'healthy' | 'warning' | 'critical';
	} {
		const metrics = this.getSecurityMetrics();
		const now = Date.now();

		let status: 'healthy' | 'warning' | 'critical' = 'healthy';

		// Check if we're approaching limits
		const requestsPerMinute = now - metrics.lastRequestTime < 60000 ? metrics.requestCount : 0;
		const requestsPerHour = now - metrics.lastRequestTime < 3600000 ? metrics.requestCount : 0;
		const pollingPerHour = now - metrics.lastPollingTime < 3600000 ? metrics.pollingCount : 0;

		if (
			requestsPerMinute >= this.LIMITS.maxRequestsPerMinute * 0.8 ||
			requestsPerHour >= this.LIMITS.maxRequestsPerHour * 0.8 ||
			pollingPerHour >= this.LIMITS.maxPollingPerHour * 0.8
		) {
			status = 'warning';
		}

		if (metrics.blockedAttempts > 10) {
			status = 'critical';
		}

		return {
			metrics,
			limits: this.LIMITS,
			status,
		};
	}
}

export default DeviceAuthorizationSecurityService;
