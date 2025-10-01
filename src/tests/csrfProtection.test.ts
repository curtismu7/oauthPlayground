import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	CSRFProtection,
	csrfMiddleware,
	csrfProtection,
	csrfValidationMiddleware,
	getCSRFToken,
	validateCSRFRequest,
	validateCSRFToken,
} from '../utils/csrfProtection';

// Mock the logger
vi.mock('../utils/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		success: vi.fn(),
	},
}));

// Mock the error handler
vi.mock('../utils/errorHandler', () => ({
	errorHandler: {
		handleError: vi.fn(),
	},
}));

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
	value: {
		getRandomValues: vi.fn((array) => {
			for (let i = 0; i < array.length; i++) {
				array[i] = Math.floor(Math.random() * 256);
			}
			return array;
		}),
	},
});

// Mock document.cookie
const mockCookies: { [key: string]: string } = {};
Object.defineProperty(document, 'cookie', {
	get: () => {
		return Object.entries(mockCookies)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ');
	},
	set: (cookieString: string) => {
		const [keyValue] = cookieString.split(';');
		const [key, value] = keyValue.split('=');
		if (key && value) {
			mockCookies[key.trim()] = value.trim();
		}
	},
});

// Mock document.head
const mockMetaTags: { [key: string]: HTMLMetaElement } = {};
Object.defineProperty(document, 'head', {
	value: {
		appendChild: vi.fn(),
		querySelector: vi.fn((selector: string) => {
			if (selector === 'meta[name="csrf-token"]') {
				return mockMetaTags['csrf-token'] || null;
			}
			return null;
		}),
	},
});

// Mock document.createElement
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
	if (tagName === 'meta') {
		const meta = originalCreateElement.call(document, tagName) as HTMLMetaElement;
		meta.name = '';
		meta.content = '';
		return meta;
	}
	return originalCreateElement.call(document, tagName);
});

describe('CSRFProtection', () => {
	let protection: CSRFProtection;

	beforeEach(() => {
		protection = new CSRFProtection();
		vi.clearAllMocks();
		// Clear mock cookies
		Object.keys(mockCookies).forEach((key) => delete mockCookies[key]);
		// Clear mock meta tags
		Object.keys(mockMetaTags).forEach((key) => delete mockMetaTags[key]);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe('generateToken', () => {
		it('should generate a new token', () => {
			const token = protection.generateToken();
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
			expect(token.length).toBe(64); // 32 bytes * 2 (hex)
		});

		it('should set cookie when enabled', () => {
			const token = protection.generateToken();
			expect(mockCookies['csrf-token']).toBe(token);
		});

		it('should update meta tag when enabled', () => {
			const _token = protection.generateToken();
			// Meta tag should be created and updated
			expect(document.head.appendChild).toHaveBeenCalled();
		});
	});

	describe('getToken', () => {
		it('should return current token', () => {
			const token = protection.generateToken();
			const retrievedToken = protection.getToken();
			expect(retrievedToken).toBe(token);
		});

		it('should generate new token if none exists', () => {
			const token = protection.getToken();
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
		});

		it('should generate new token if current is invalid', () => {
			const token = protection.generateToken();
			// Manually expire the token
			const tokenData = (protection as any).tokens.get(token);
			if (tokenData) {
				tokenData.expiresAt = Date.now() - 1000;
			}

			const newToken = protection.getToken();
			expect(newToken).toBeDefined();
			expect(newToken).not.toBe(token);
		});
	});

	describe('validateToken', () => {
		it('should validate correct token', () => {
			const token = protection.generateToken();
			const isValid = protection.validateToken(token);
			expect(isValid).toBe(true);
		});

		it('should reject invalid token', () => {
			const isValid = protection.validateToken('invalid-token');
			expect(isValid).toBe(false);
		});

		it('should reject empty token', () => {
			const isValid = protection.validateToken('');
			expect(isValid).toBe(false);
		});

		it('should reject expired token', () => {
			const token = protection.generateToken();
			// Manually expire the token
			const tokenData = (protection as any).tokens.get(token);
			if (tokenData) {
				tokenData.expiresAt = Date.now() - 1000;
			}

			const isValid = protection.validateToken(token);
			expect(isValid).toBe(false);
		});
	});

	describe('validateRequest', () => {
		it('should validate request with header token', () => {
			const token = protection.generateToken();
			const request = {
				headers: {
					'x-csrf-token': token,
				},
			};

			const isValid = protection.validateRequest(request);
			expect(isValid).toBe(true);
		});

		it('should validate request with form data token', () => {
			const token = protection.generateToken();
			const request = {
				body: {
					_csrf: token,
				},
			};

			const isValid = protection.validateRequest(request);
			expect(isValid).toBe(true);
		});

		it('should validate request with query parameter token', () => {
			const token = protection.generateToken();
			const request = {
				query: {
					_csrf: token,
				},
			};

			const isValid = protection.validateRequest(request);
			expect(isValid).toBe(true);
		});

		it('should validate request with cookie token', () => {
			const token = protection.generateToken();
			// Set cookie manually
			mockCookies['csrf-token'] = token;

			const request = {};

			const isValid = protection.validateRequest(request);
			expect(isValid).toBe(true);
		});

		it('should reject request without token', () => {
			const request = {};

			const isValid = protection.validateRequest(request);
			expect(isValid).toBe(false);
		});

		it('should reject request with invalid token', () => {
			const request = {
				headers: {
					'x-csrf-token': 'invalid-token',
				},
			};

			const isValid = protection.validateRequest(request);
			expect(isValid).toBe(false);
		});
	});

	describe('token lifecycle', () => {
		it('should clean up expired tokens', () => {
			const token1 = protection.generateToken();
			const _token2 = protection.generateToken();

			// Manually expire first token
			const tokenData1 = (protection as any).tokens.get(token1);
			if (tokenData1) {
				tokenData1.expiresAt = Date.now() - 1000;
			}

			// Clean up expired tokens
			(protection as any).cleanupExpiredTokens();

			const stats = protection.getTokenStats();
			expect(stats.expiredTokens).toBe(1);
		});

		it('should provide token statistics', () => {
			protection.generateToken();
			protection.generateToken();

			const stats = protection.getTokenStats();
			expect(stats.totalTokens).toBe(2);
			expect(stats.activeTokens).toBe(2);
			expect(stats.expiredTokens).toBe(0);
			expect(stats.currentToken).toBeDefined();
		});
	});

	describe('configuration', () => {
		it('should use default configuration', () => {
			const config = protection.getConfig();
			expect(config.tokenLength).toBe(32);
			expect(config.tokenLifetime).toBe(30 * 60 * 1000);
			expect(config.headerName).toBe('X-CSRF-Token');
			expect(config.cookieName).toBe('csrf-token');
		});

		it('should update configuration', () => {
			protection.updateConfig({
				tokenLength: 16,
				headerName: 'Custom-CSRF-Token',
			});

			const config = protection.getConfig();
			expect(config.tokenLength).toBe(16);
			expect(config.headerName).toBe('Custom-CSRF-Token');
		});
	});

	describe('clearTokens', () => {
		it('should clear all tokens', () => {
			protection.generateToken();
			protection.generateToken();

			protection.clearTokens();

			const stats = protection.getTokenStats();
			expect(stats.totalTokens).toBe(0);
			expect(stats.currentToken).toBeNull();
		});
	});
});

describe('Utility Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.keys(mockCookies).forEach((key) => delete mockCookies[key]);
	});

	describe('getCSRFToken', () => {
		it('should return CSRF token', () => {
			const token = getCSRFToken();
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
		});
	});

	describe('validateCSRFToken', () => {
		it('should validate CSRF token', () => {
			const token = csrfProtection.generateToken();
			const isValid = validateCSRFToken(token);
			expect(isValid).toBe(true);
		});

		it('should reject invalid CSRF token', () => {
			const isValid = validateCSRFToken('invalid-token');
			expect(isValid).toBe(false);
		});
	});

	describe('validateCSRFRequest', () => {
		it('should validate CSRF request', () => {
			const token = csrfProtection.generateToken();
			const request = {
				headers: {
					'x-csrf-token': token,
				},
			};

			const isValid = validateCSRFRequest(request);
			expect(isValid).toBe(true);
		});
	});
});

describe('Middleware', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('csrfMiddleware', () => {
		it('should add CSRF token to request headers', async () => {
			const token = csrfProtection.generateToken();
			const request = new Request('https://example.com', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const modifiedRequest = await csrfMiddleware(request);
			expect(modifiedRequest.headers.get('X-CSRF-Token')).toBe(token);
		});
	});

	describe('csrfValidationMiddleware', () => {
		it('should validate CSRF request', () => {
			const token = csrfProtection.generateToken();
			const request = {
				headers: {
					'x-csrf-token': token,
				},
			};

			const isValid = csrfValidationMiddleware(request as any);
			expect(isValid).toBe(true);
		});

		it('should reject invalid CSRF request', () => {
			const request = {
				headers: {
					'x-csrf-token': 'invalid-token',
				},
			};

			const isValid = csrfValidationMiddleware(request as any);
			expect(isValid).toBe(false);
		});
	});
});

describe('Global CSRF Protection', () => {
	it('should be an instance of CSRFProtection', () => {
		expect(csrfProtection).toBeInstanceOf(CSRFProtection);
	});

	it('should have default configuration', () => {
		const config = csrfProtection.getConfig();
		expect(config.tokenLength).toBe(32);
		expect(config.tokenLifetime).toBe(30 * 60 * 1000);
	});
});
