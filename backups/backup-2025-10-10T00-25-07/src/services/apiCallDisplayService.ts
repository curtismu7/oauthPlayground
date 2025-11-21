// src/services/apiCallDisplayService.ts

export interface ApiCallData {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
	url: string;
	headers?: Record<string, string>;
	body?: string | object | null;
	response?: {
		status: number;
		statusText: string;
		headers?: Record<string, string>;
		data?: unknown;
		error?: string;
	};
	timestamp?: Date;
	duration?: number; // in milliseconds
}

export interface CurlCommandOptions {
	includeHeaders?: boolean;
	includeBody?: boolean;
	prettyPrint?: boolean;
	verbose?: boolean;
	insecure?: boolean; // for HTTPS with self-signed certificates
}

export interface ApiCallDisplayResult {
	formattedCall: string;
	curlCommand: string;
	responseSummary: string;
	timingInfo?: string;
}

export class ApiCallDisplayService {
	/**
	 * Format an API call for display with curl command and response summary
	 */
	static formatApiCall(
		apiCall: ApiCallData,
		options: CurlCommandOptions = {}
	): ApiCallDisplayResult {
		const {
			includeHeaders = true,
			includeBody = true,
			prettyPrint = true,
			verbose = false,
			insecure = false,
		} = options;

		const formattedCall = ApiCallDisplayService.formatApiCallText(apiCall, prettyPrint);
		const curlCommand = ApiCallDisplayService.generateCurlCommand(apiCall, {
			includeHeaders,
			includeBody,
			verbose,
			insecure,
		});
		const responseSummary = ApiCallDisplayService.formatResponseSummary(apiCall);
		const timingInfo = apiCall.duration
			? ApiCallDisplayService.formatTimingInfo(apiCall.duration)
			: undefined;

		return {
			formattedCall,
			curlCommand,
			responseSummary,
			timingInfo,
		};
	}

	/**
	 * Generate a curl command for the API call
	 */
	static generateCurlCommand(apiCall: ApiCallData, options: CurlCommandOptions = {}): string {
		const {
			includeHeaders = true,
			includeBody = true,
			verbose = false,
			insecure = false,
		} = options;

		let curlCommand = 'curl';

		// Add verbose flag if requested
		if (verbose) {
			curlCommand += ' -v';
		}

		// Add insecure flag for self-signed certificates
		if (insecure) {
			curlCommand += ' -k';
		}

		// Add method (curl defaults to GET, so only add for non-GET)
		if (apiCall.method !== 'GET') {
			curlCommand += ` -X ${apiCall.method}`;
		}

		// Add headers
		if (includeHeaders && apiCall.headers) {
			Object.entries(apiCall.headers).forEach(([key, value]) => {
				curlCommand += ` -H "${key}: ${value}"`;
			});
		}

		// Add body data
		if (includeBody && apiCall.body) {
			let bodyData = '';

			if (typeof apiCall.body === 'string') {
				bodyData = apiCall.body;
			} else if (typeof apiCall.body === 'object') {
				bodyData = JSON.stringify(apiCall.body);
				// Ensure Content-Type is set for JSON
				if (!apiCall.headers?.['Content-Type']) {
					curlCommand += ` -H "Content-Type: application/json"`;
				}
			}

			if (bodyData) {
				// Escape quotes in body data
				const escapedBody = bodyData.replace(/"/g, '\\"');
				curlCommand += ` -d "${escapedBody}"`;
			}
		}

		// Add URL (must be last)
		curlCommand += ` "${apiCall.url}"`;

		return curlCommand;
	}

	/**
	 * Format API call as readable text
	 */
	static formatApiCallText(apiCall: ApiCallData, prettyPrint: boolean = true): string {
		let result = `${apiCall.method} ${apiCall.url}`;

		if (apiCall.headers && Object.keys(apiCall.headers).length > 0) {
			result += '\nHeaders:';
			Object.entries(apiCall.headers).forEach(([key, value]) => {
				result += `\n  ${key}: ${value}`;
			});
		}

		if (apiCall.body) {
			result += '\nBody:';
			if (typeof apiCall.body === 'string') {
				result += `\n  ${apiCall.body}`;
			} else if (typeof apiCall.body === 'object') {
				if (prettyPrint) {
					result += `\n  ${JSON.stringify(apiCall.body, null, 2)}`;
				} else {
					result += `\n  ${JSON.stringify(apiCall.body)}`;
				}
			}
		}

		return result;
	}

	/**
	 * Format response summary
	 */
	static formatResponseSummary(apiCall: ApiCallData): string {
		if (!apiCall.response) {
			return 'No response received';
		}

		const { status, statusText, data, error } = apiCall.response;
		let summary = `HTTP ${status} ${statusText}`;

		if (error) {
			summary += `\nError: ${error}`;
		} else if (data) {
			summary += '\nResponse:';
			if (typeof data === 'string') {
				summary += `\n  ${data}`;
			} else if (typeof data === 'object') {
				try {
					summary += `\n  ${JSON.stringify(data, null, 2)}`;
				} catch {
					summary += `\n  ${String(data)}`;
				}
			} else {
				summary += `\n  ${String(data)}`;
			}
		}

		return summary;
	}

	/**
	 * Format timing information
	 */
	static formatTimingInfo(duration: number): string {
		if (duration < 1000) {
			return `Duration: ${duration}ms`;
		} else {
			const seconds = (duration / 1000).toFixed(2);
			return `Duration: ${seconds}s`;
		}
	}

	/**
	 * Create a complete display string with all API call information
	 */
	static createFullDisplay(apiCall: ApiCallData, options: CurlCommandOptions = {}): string {
		const result = ApiCallDisplayService.formatApiCall(apiCall, options);

		let display = '🚀 API Call Details\n';
		display += '='.repeat(50) + '\n\n';

		display += '📤 Request:\n';
		display += result.formattedCall + '\n\n';

		display += '💻 cURL Command:\n';
		display += result.curlCommand + '\n\n';

		display += '📥 Response:\n';
		display += result.responseSummary + '\n';

		if (result.timingInfo) {
			display += '\n⏱️  ' + result.timingInfo + '\n';
		}

		return display;
	}

	/**
	 * Create a compact display string for API call results
	 */
	static createCompactDisplay(apiCall: ApiCallData): string {
		const status = apiCall.response?.status || 'Unknown';
		const method = apiCall.method;
		const url = apiCall.url;
		const duration = apiCall.duration
			? ` (${ApiCallDisplayService.formatTimingInfo(apiCall.duration)})`
			: '';

		return `${method} ${url} → ${status}${duration}`;
	}

	/**
	 * Validate API call data structure
	 */
	static validateApiCall(apiCall: ApiCallData): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!apiCall.method || typeof apiCall.method !== 'string') {
			errors.push('Method is required');
		}

		if (!apiCall.url) {
			errors.push('URL is required');
		} else {
			try {
				new URL(apiCall.url);
			} catch {
				errors.push('URL must be a valid URL');
			}
		}

		if (
			apiCall.method !== 'GET' &&
			apiCall.method !== 'POST' &&
			apiCall.method !== 'PUT' &&
			apiCall.method !== 'DELETE' &&
			apiCall.method !== 'PATCH' &&
			apiCall.method !== 'HEAD' &&
			apiCall.method !== 'OPTIONS'
		) {
			errors.push('Invalid HTTP method');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Sanitize sensitive data from API call for display
	 */
	static sanitizeApiCall(
		apiCall: ApiCallData,
		sensitiveFields: string[] = ['authorization', 'password', 'secret', 'token']
	): ApiCallData {
		const sanitized = { ...apiCall };

		// Sanitize headers
		if (sanitized.headers) {
			sanitized.headers = { ...sanitized.headers };
			Object.keys(sanitized.headers).forEach((key) => {
				if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
					sanitized.headers![key] = '***REDACTED***';
				}
			});
		}

		// Sanitize body if it's an object
		if (sanitized.body && typeof sanitized.body === 'object') {
			sanitized.body = ApiCallDisplayService.sanitizeObject(
				sanitized.body,
				sensitiveFields
			) as object;
		}

		// Sanitize response data
		if (sanitized.response?.data && typeof sanitized.response.data === 'object') {
			sanitized.response.data = ApiCallDisplayService.sanitizeObject(
				sanitized.response.data,
				sensitiveFields
			);
		}

		return sanitized;
	}

	/**
	 * Helper method to sanitize objects recursively
	 */
	private static sanitizeObject(obj: unknown, sensitiveFields: string[]): unknown {
		if (typeof obj !== 'object' || obj === null) {
			return obj;
		}

		const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

		Object.keys(sanitized).forEach((key) => {
			if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
				(sanitized as Record<string, unknown>)[key] = '***REDACTED***';
			} else if (typeof (sanitized as Record<string, unknown>)[key] === 'object') {
				(sanitized as Record<string, unknown>)[key] = ApiCallDisplayService.sanitizeObject(
					(sanitized as Record<string, unknown>)[key],
					sensitiveFields
				);
			}
		});

		return sanitized;
	}
}

// Export singleton instance
export const apiCallDisplayService = new ApiCallDisplayService();

// Export utility functions for backward compatibility
export const formatApiCall = (apiCall: ApiCallData, options?: CurlCommandOptions) =>
	ApiCallDisplayService.formatApiCall(apiCall, options);

export const generateCurlCommand = (apiCall: ApiCallData, options?: CurlCommandOptions) =>
	ApiCallDisplayService.generateCurlCommand(apiCall, options);

export const createFullDisplay = (apiCall: ApiCallData, options?: CurlCommandOptions) =>
	ApiCallDisplayService.createFullDisplay(apiCall, options);

export const createCompactDisplay = (apiCall: ApiCallData) =>
	ApiCallDisplayService.createCompactDisplay(apiCall);
