// src/tests/apiCallDisplayService.test.ts

import { describe, expect, it } from 'vitest';
import {
	ApiCallDisplayService,
	type ApiCallData,
	type CurlCommandOptions,
} from '../services/apiCallDisplayService';

describe('ApiCallDisplayService', () => {
	const mockApiCall: ApiCallData = {
		method: 'POST',
		url: 'https://api.example.com/oauth/token',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=',
		},
		body: 'grant_type=authorization_code&code=abc123&redirect_uri=https://app.example.com/callback',
		response: {
			status: 200,
			statusText: 'OK',
			headers: {
				'Content-Type': 'application/json',
			},
			data: {
				access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: 'refresh_token_value',
			},
		},
		duration: 245,
	};

	describe('formatApiCall', () => {
		it('should format API call with all components', () => {
			const result = ApiCallDisplayService.formatApiCall(mockApiCall);

			expect(result.formattedCall).toContain('POST https://api.example.com/oauth/token');
			expect(result.formattedCall).toContain('Content-Type: application/x-www-form-urlencoded');
			expect(result.formattedCall).toContain('grant_type=authorization_code');
			expect(result.curlCommand).toContain('curl -X POST');
			expect(result.curlCommand).toContain('https://api.example.com/oauth/token');
			expect(result.responseSummary).toContain('HTTP 200 OK');
			expect(result.responseSummary).toContain('access_token');
			expect(result.timingInfo).toBe('Duration: 245ms');
		});

		it('should generate curl command with headers', () => {
			const result = ApiCallDisplayService.generateCurlCommand(mockApiCall);

			expect(result).toContain('curl -X POST');
			expect(result).toContain('-H "Content-Type: application/x-www-form-urlencoded"');
			expect(result).toContain('-H "Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="');
			expect(result).toContain('-d "grant_type=authorization_code&code=abc123&redirect_uri=https://app.example.com/callback"');
		});

		it('should handle GET requests without body', () => {
			const getCall: ApiCallData = {
				method: 'GET',
				url: 'https://api.example.com/user/profile',
				headers: {
					'Authorization': 'Bearer token123',
				},
			};

			const result = ApiCallDisplayService.generateCurlCommand(getCall);

			expect(result).toContain('curl');
			expect(result).not.toContain('-X GET'); // curl defaults to GET
			expect(result).toContain('-H "Authorization: Bearer token123"');
			expect(result).not.toContain('-d'); // no body
		});

		it('should handle JSON body', () => {
			const jsonCall: ApiCallData = {
				method: 'POST',
				url: 'https://api.example.com/data',
				headers: {
					'Authorization': 'Bearer token123',
				},
				body: { key: 'value', number: 42 },
			};

			const result = ApiCallDisplayService.generateCurlCommand(jsonCall);

			expect(result).toContain('-H "Content-Type: application/json"');
			expect(result).toContain('-d "{\\"key\\":\\"value\\",\\"number\\":42}"');
		});
	});

	describe('createFullDisplay', () => {
		it('should create comprehensive display string', () => {
			const result = ApiCallDisplayService.createFullDisplay(mockApiCall);

			expect(result).toContain('🚀 API Call Details');
			expect(result).toContain('📤 Request:');
			expect(result).toContain('💻 cURL Command:');
			expect(result).toContain('📥 Response:');
			expect(result).toContain('⏱️  Duration: 245ms');
		});
	});

	describe('createCompactDisplay', () => {
		it('should create compact display string', () => {
			const result = ApiCallDisplayService.createCompactDisplay(mockApiCall);

			expect(result).toBe('POST https://api.example.com/oauth/token → 200 (Duration: 245ms)');
		});

		it('should handle calls without duration', () => {
			const callWithoutDuration: ApiCallData = {
				method: 'GET',
				url: 'https://api.example.com/test',
				response: { status: 404, statusText: 'Not Found' },
			};

			const result = ApiCallDisplayService.createCompactDisplay(callWithoutDuration);

			expect(result).toBe('GET https://api.example.com/test → 404');
		});
	});

	describe('validateApiCall', () => {
		it('should validate correct API call', () => {
			const validation = ApiCallDisplayService.validateApiCall(mockApiCall);

			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it('should detect missing method', () => {
			const invalidCall: Partial<ApiCallData> = {
				url: 'https://api.example.com/test',
			};

			const validation = ApiCallDisplayService.validateApiCall(invalidCall as ApiCallData);

			expect(validation.isValid).toBe(false);
			expect(validation.errors).toContain('Method is required');
		});

		it('should detect invalid URL', () => {
			const invalidCall: ApiCallData = {
				method: 'GET',
				url: 'not-a-valid-url',
			};

			const validation = ApiCallDisplayService.validateApiCall(invalidCall);

			expect(validation.isValid).toBe(false);
			expect(validation.errors).toContain('URL must be a valid URL');
		});
	});

	describe('sanitizeApiCall', () => {
		it('should redact sensitive headers', () => {
			const sensitiveCall: ApiCallData = {
				method: 'POST',
				url: 'https://api.example.com/token',
				headers: {
					'Authorization': 'Bearer secret-token',
					'X-API-Secret': 'secret-key',
					'Content-Type': 'application/json',
				},
				body: {
					password: 'secret-password',
					accessToken: 'secret-token',
					normalField: 'normal-value',
				},
			};

			const sanitized = ApiCallDisplayService.sanitizeApiCall(sensitiveCall);

			expect(sanitized.headers?.['Authorization']).toBe('***REDACTED***');
			expect(sanitized.headers?.['X-API-Secret']).toBe('***REDACTED***');
			expect(sanitized.headers?.['Content-Type']).toBe('application/json');
			expect((sanitized.body as Record<string, unknown>).password).toBe('***REDACTED***');
			expect((sanitized.body as Record<string, unknown>).accessToken).toBe('***REDACTED***');
			expect((sanitized.body as Record<string, unknown>).normalField).toBe('normal-value');
		});

		it('should allow custom sensitive fields', () => {
			const call: ApiCallData = {
				method: 'POST',
				url: 'https://api.example.com/data',
				body: {
					sessionToken: 'abc123',
					userId: 'user456',
				},
			};

			const sanitized = ApiCallDisplayService.sanitizeApiCall(call, ['token']);

			expect((sanitized.body as Record<string, unknown>).sessionToken).toBe('***REDACTED***');
			expect((sanitized.body as Record<string, unknown>).userId).toBe('user456');
		});
	});

	describe('CurlCommandOptions', () => {
		it('should respect includeHeaders option', () => {
			const options: CurlCommandOptions = { includeHeaders: false };
			const result = ApiCallDisplayService.generateCurlCommand(mockApiCall, options);

			expect(result).not.toContain('-H');
		});

		it('should respect includeBody option', () => {
			const options: CurlCommandOptions = { includeBody: false };
			const result = ApiCallDisplayService.generateCurlCommand(mockApiCall, options);

			expect(result).not.toContain('-d');
		});

		it('should add verbose flag', () => {
			const options: CurlCommandOptions = { verbose: true };
			const result = ApiCallDisplayService.generateCurlCommand(mockApiCall, options);

			expect(result).toContain('curl -v');
		});

		it('should add insecure flag', () => {
			const options: CurlCommandOptions = { insecure: true };
			const result = ApiCallDisplayService.generateCurlCommand(mockApiCall, options);

			expect(result).toContain('curl -k');
		});
	});
});