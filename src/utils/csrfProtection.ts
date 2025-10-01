import { logger } from './logger';
import { errorHandler } from './errorHandler';

// CSRF token interface
export interface CSRFToken {
	token: string;
	timestamp: number;
	expiresAt: number;
}

// CSRF protection configuration
export interface CSRFConfig {
	tokenLength: number;
	tokenLifetime: number; // in milliseconds
	headerName: string;
	cookieName: string;
	enableCookie: boolean;
	enableHeader: boolean;
	enableMetaTag: boolean;
}

// Default CSRF configuration
const defaultConfig: CSRFConfig = {
	tokenLength: 32,
	tokenLifetime: 30 * 60 * 1000, // 30 minutes
	headerName: 'X-CSRF-Token',
	cookieName: 'csrf-token',
	enableCookie: true,
	enableHeader: true,
	enableMetaTag: true,
};

// CSRF protection class
export class CSRFProtection {
	private config: CSRFConfig;
	private tokens: Map<string, CSRFToken> = new Map();
	private currentToken: string | null = null;

	constructor(config: Partial<CSRFConfig> = {}) {
		this.config = { ...defaultConfig, ...config };
		this.initialize();
	}

	// Initialize CSRF protection
	private initialize(): void {
		// Load existing token from cookie if enabled
		if (this.config.enableCookie) {
			this.loadTokenFromCookie();
		}

		// Generate new token if none exists
		if (!this.currentToken) {
			this.generateToken();
		}

		// Set up token refresh interval
		this.setupTokenRefresh();

		logger.info('[CSRF] CSRF protection initialized');
	}

	// Generate a new CSRF token
	generateToken(): string {
		const token = this.generateRandomToken();
		const now = Date.now();
		const expiresAt = now + this.config.tokenLifetime;

		const csrfToken: CSRFToken = {
			token,
			timestamp: now,
			expiresAt,
		};

		// Store token
		this.tokens.set(token, csrfToken);
		this.currentToken = token;

		// Set cookie if enabled
		if (this.config.enableCookie) {
			this.setCookie(token, expiresAt);
		}

		// Update meta tag if enabled
		if (this.config.enableMetaTag) {
			this.updateMetaTag(token);
		}

		logger.info('[CSRF] New CSRF token generated');
		return token;
	}

	// Get current CSRF token
	getToken(): string | null {
		if (!this.currentToken || !this.isTokenValid(this.currentToken)) {
			this.generateToken();
		}
		return this.currentToken;
	}

	// Validate CSRF token
	validateToken(token: string): boolean {
		if (!token) {
			logger.warn('[CSRF] No token provided for validation');
			return false;
		}

		const csrfToken = this.tokens.get(token);
		if (!csrfToken) {
			logger.warn('[CSRF] Invalid token provided for validation');
			return false;
		}

		if (!this.isTokenValid(token)) {
			logger.warn('[CSRF] Expired token provided for validation');
			this.tokens.delete(token);
			return false;
		}

		logger.info('[CSRF] Token validation successful');
		return true;
	}

	// Validate token from request
	validateRequest(request: Request | any): boolean {
		let token: string | null = null;

		// Try to get token from header
		if (this.config.enableHeader && request.headers) {
			token =
				request.headers[this.config.headerName.toLowerCase()] ||
				request.headers[this.config.headerName];
		}

		// Try to get token from form data
		if (!token && request.body) {
			token = request.body._csrf || request.body.csrf_token;
		}

		// Try to get token from query parameters
		if (!token && request.query) {
			token = request.query._csrf || request.query.csrf_token;
		}

		// Try to get token from cookie
		if (!token && this.config.enableCookie) {
			token = this.getTokenFromCookie();
		}

		return this.validateToken(token || '');
	}

	// Check if token is valid
	private isTokenValid(token: string): boolean {
		const csrfToken = this.tokens.get(token);
		if (!csrfToken) return false;

		const now = Date.now();
		return now < csrfToken.expiresAt;
	}

	// Generate random token
	private generateRandomToken(): string {
		const array = new Uint8Array(this.config.tokenLength);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	// Set CSRF token cookie
	private setCookie(token: string, expiresAt: number): void {
		const expires = new Date(expiresAt).toUTCString();
		document.cookie = `${this.config.cookieName}=${token}; expires=${expires}; path=/; SameSite=Strict; Secure`;
	}

	// Get CSRF token from cookie
	private getTokenFromCookie(): string | null {
		const cookies = document.cookie.split(';');
		for (const cookie of cookies) {
			const [name, value] = cookie.trim().split('=');
			if (name === this.config.cookieName) {
				return value;
			}
		}
		return null;
	}

	// Load token from cookie
	private loadTokenFromCookie(): void {
		const token = this.getTokenFromCookie();
		if (token && this.validateToken(token)) {
			this.currentToken = token;
			logger.info('[CSRF] Token loaded from cookie');
		}
	}

	// Update meta tag with CSRF token
	private updateMetaTag(token: string): void {
		let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;

		if (!metaTag) {
			metaTag = document.createElement('meta');
			metaTag.name = 'csrf-token';
			document.head.appendChild(metaTag);
		}

		metaTag.content = token;
	}

	// Set up token refresh
	private setupTokenRefresh(): void {
		// Refresh token every 15 minutes
		setInterval(
			() => {
				this.cleanupExpiredTokens();

				if (!this.currentToken || !this.isTokenValid(this.currentToken)) {
					this.generateToken();
				}
			},
			15 * 60 * 1000
		);
	}

	// Clean up expired tokens
	private cleanupExpiredTokens(): void {
		const now = Date.now();
		let cleanedCount = 0;

		for (const [token, csrfToken] of this.tokens.entries()) {
			if (now >= csrfToken.expiresAt) {
				this.tokens.delete(token);
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			logger.info(`[CSRF] Cleaned up ${cleanedCount} expired tokens`);
		}
	}

	// Get CSRF token for forms
	getFormToken(): string {
		return this.getToken() || '';
	}

	// Get CSRF token for headers
	getHeaderToken(): string {
		return this.getToken() || '';
	}

	// Get CSRF configuration
	getConfig(): CSRFConfig {
		return { ...this.config };
	}

	// Update configuration
	updateConfig(newConfig: Partial<CSRFConfig>): void {
		this.config = { ...this.config, ...newConfig };
		logger.info('[CSRF] Configuration updated');
	}

	// Clear all tokens
	clearTokens(): void {
		this.tokens.clear();
		this.currentToken = null;

		// Clear cookie
		if (this.config.enableCookie) {
			document.cookie = `${this.config.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
		}

		logger.info('[CSRF] All tokens cleared');
	}

	// Get token statistics
	getTokenStats(): {
		totalTokens: number;
		activeTokens: number;
		expiredTokens: number;
		currentToken: string | null;
		currentTokenExpiresAt: number | null;
	} {
		const now = Date.now();
		let activeTokens = 0;
		let expiredTokens = 0;

		for (const csrfToken of this.tokens.values()) {
			if (now < csrfToken.expiresAt) {
				activeTokens++;
			} else {
				expiredTokens++;
			}
		}

		const currentTokenData = this.currentToken ? this.tokens.get(this.currentToken) : null;

		return {
			totalTokens: this.tokens.size,
			activeTokens,
			expiredTokens,
			currentToken: this.currentToken,
			currentTokenExpiresAt: currentTokenData?.expiresAt || null,
		};
	}
}

// Create global CSRF protection instance
export const csrfProtection = new CSRFProtection();

// Utility functions for CSRF protection
export const getCSRFToken = (): string => {
	return csrfProtection.getToken() || '';
};

export const validateCSRFToken = (token: string): boolean => {
	return csrfProtection.validateToken(token);
};

export const validateCSRFRequest = (request: Request | any): boolean => {
	return csrfProtection.validateRequest(request);
};

// React hooks and HOCs are available in src/hooks/useCSRFProtection.tsx

// CSRF middleware for API requests
export const csrfMiddleware = async (request: Request): Promise<Request> => {
	const token = csrfProtection.getToken();

	if (token) {
		request.headers.set(csrfProtection.getConfig().headerName, token);
	}

	return request;
};

// CSRF validation middleware
export const csrfValidationMiddleware = (request: Request): boolean => {
	try {
		return csrfProtection.validateRequest(request);
	} catch (error) {
		errorHandler.handleError(error, 'CSRF validation');
		return false;
	}
};

export default csrfProtection;
