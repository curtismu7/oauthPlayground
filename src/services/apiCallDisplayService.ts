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
	duration?: number;
}

export interface CurlCommandOptions {
	includeHeaders?: boolean;
	includeBody?: boolean;
	prettyPrint?: boolean;
	verbose?: boolean;
	insecure?: boolean;
}

export interface ApiCallDisplayResult {
	formattedCall: string;
	curlCommand: string;
	responseSummary: string;
	timingInfo?: string;
}

const sanitizeObject = (obj: unknown, sensitiveFields: string[]): unknown => {
	if (typeof obj !== 'object' || obj === null) {
		return obj;
	}

	const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

	Object.keys(sanitized).forEach((key) => {
		if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
			(sanitized as Record<string, unknown>)[key] = '***REDACTED***';
		} else if (typeof (sanitized as Record<string, unknown>)[key] === 'object') {
			(sanitized as Record<string, unknown>)[key] = sanitizeObject(
				(sanitized as Record<string, unknown>)[key],
				sensitiveFields
			);
		}
	});

	return sanitized;
};

const formatApiCallText = (apiCall: ApiCallData, prettyPrint: boolean = true): string => {
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
			result += `\n  ${JSON.stringify(apiCall.body, null, prettyPrint ? 2 : undefined)}`;
		}
	}

	return result;
};

const formatResponseSummary = (apiCall: ApiCallData): string => {
	if (!apiCall.response) {
		return 'No response received';
	}

	const { status, statusText, data, error } = apiCall.response;
	let summary = `HTTP ${status} ${statusText}`;

	if (error) {
		summary += `\nError: ${error}`;
	} else if (data !== undefined) {
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
};

const formatTimingInfo = (duration: number): string => {
	if (duration < 1000) {
		return `Duration: ${duration}ms`;
	}
	return `Duration: ${(duration / 1000).toFixed(2)}s`;
};

export const generateCurlCommand = (
	apiCall: ApiCallData,
	options: CurlCommandOptions = {}
): string => {
	const { includeHeaders = true, includeBody = true, verbose = false, insecure = false } = options;

	let curlCommand = 'curl';

	if (verbose) {
		curlCommand += ' -v';
	}

	if (insecure) {
		curlCommand += ' -k';
	}

	if (apiCall.method !== 'GET') {
		curlCommand += ` -X ${apiCall.method}`;
	}

	if (includeHeaders && apiCall.headers) {
		Object.entries(apiCall.headers).forEach(([key, value]) => {
			curlCommand += ` -H "${key}: ${value}"`;
		});
	}

	if (includeBody && apiCall.body) {
		let bodyData = '';

		if (typeof apiCall.body === 'string') {
			bodyData = apiCall.body;
		} else if (typeof apiCall.body === 'object') {
			bodyData = JSON.stringify(apiCall.body);
			if (!apiCall.headers?.['Content-Type']) {
				curlCommand += ' -H "Content-Type: application/json"';
			}
		}

		if (bodyData) {
			const escapedBody = bodyData.replace(/"/g, '\\"');
			curlCommand += ` -d "${escapedBody}"`;
		}
	}

	curlCommand += ` "${apiCall.url}"`;
	return curlCommand;
};

export const formatApiCall = (
	apiCall: ApiCallData,
	options: CurlCommandOptions = {}
): ApiCallDisplayResult => {
	const {
		includeHeaders = true,
		includeBody = true,
		prettyPrint = true,
		verbose = false,
		insecure = false,
	} = options;

	const formattedCall = formatApiCallText(apiCall, prettyPrint);
	const curlCommand = generateCurlCommand(apiCall, {
		includeHeaders,
		includeBody,
		verbose,
		insecure,
	});
	const responseSummary = formatResponseSummary(apiCall);
	const timingInfo = apiCall.duration ? formatTimingInfo(apiCall.duration) : undefined;

	return {
		formattedCall,
		curlCommand,
		responseSummary,
		timingInfo,
	};
};

export const createFullDisplay = (
	apiCall: ApiCallData,
	options: CurlCommandOptions = {}
): string => {
	const result = formatApiCall(apiCall, options);

	let display = '🚀 API Call Details\n';
	display += `${'='.repeat(50)}\n\n`;
	display += '📤 Request:\n';
	display += `${result.formattedCall}\n\n`;
	display += '💻 cURL Command:\n';
	display += `${result.curlCommand}\n\n`;
	display += '📥 Response:\n';
	display += `${result.responseSummary}\n`;

	if (result.timingInfo) {
		display += `\n⏱️  ${result.timingInfo}\n`;
	}

	return display;
};

export const createCompactDisplay = (apiCall: ApiCallData): string => {
	const status = apiCall.response?.status ?? 'Unknown';
	const duration = apiCall.duration ? ` (${formatTimingInfo(apiCall.duration)})` : '';
	return `${apiCall.method} ${apiCall.url} → ${status}${duration}`;
};

export const validateApiCall = (
	apiCall: ApiCallData
): {
	isValid: boolean;
	errors: string[];
} => {
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

	const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
	if (!validMethods.includes(apiCall.method)) {
		errors.push('Invalid HTTP method');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

export const sanitizeApiCall = (
	apiCall: ApiCallData,
	sensitiveFields: string[] = ['authorization', 'password', 'secret', 'token']
): ApiCallData => {
	const sanitized: ApiCallData = { ...apiCall };

	if (sanitized.headers) {
		sanitized.headers = { ...sanitized.headers };
		Object.keys(sanitized.headers).forEach((key) => {
			if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
				sanitized.headers![key] = '***REDACTED***';
			}
		});
	}

	if (sanitized.body && typeof sanitized.body === 'object') {
		sanitized.body = sanitizeObject(sanitized.body, sensitiveFields) as object;
	}

	if (sanitized.response?.data && typeof sanitized.response.data === 'object') {
		sanitized.response.data = sanitizeObject(sanitized.response.data, sensitiveFields);
	}

	return sanitized;
};

export const ApiCallDisplayService = {
	formatApiCall,
	generateCurlCommand,
	formatApiCallText,
	formatResponseSummary,
	formatTimingInfo,
	createFullDisplay,
	createCompactDisplay,
	validateApiCall,
	sanitizeApiCall,
};

export const apiCallDisplayService = ApiCallDisplayService;

export default ApiCallDisplayService;
