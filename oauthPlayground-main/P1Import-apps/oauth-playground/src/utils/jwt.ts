import { Buffer } from 'buffer';

/**
 * JWT (JSON Web Token) utility functions
 * Note: This is a client-side implementation and doesn't validate token signatures
 * For production, verify tokens on the server-side or use a library like jose
 */

/**
 * Decode a JWT token without validation
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} The decoded token payload or null if invalid
 */
export const decodeJwt = (token) => {
	if (!token) return null;

	try {
		// Split the token into parts
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid token format');
		}

		// Decode the payload (middle part)
		const payload = parts[1];
		const decoded = Buffer.from(payload, 'base64').toString('utf-8');

		return JSON.parse(decoded);
	} catch (error) {
		console.error('Error decoding JWT:', error);
		return null;
	}
};

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @param {number} [leeway=0] - Time in seconds to account for clock skew
 * @returns {boolean} True if the token is expired or invalid
 */
export const isTokenExpired = (token, leeway = 0) => {
	const payload = decodeJwt(token);
	if (!payload || !payload.exp) return true;

	const now = Math.floor(Date.now() / 1000);
	return payload.exp - leeway <= now;
};

/**
 * Get the expiration time of a JWT token
 * @param {string} token - The JWT token
 * @returns {number|null} Expiration time as a Unix timestamp (in seconds) or null if invalid
 */
export const getTokenExpiration = (token) => {
	const payload = decodeJwt(token);
	return payload?.exp || null;
};

/**
 * Get the time remaining until a JWT token expires
 * @param {string} token - The JWT token
 * @param {number} [leeway=0] - Time in seconds to account for clock skew
 * @returns {number|null} Time remaining in seconds (can be negative) or null if invalid
 */
export const getTimeRemaining = (token, leeway = 0) => {
	const exp = getTokenExpiration(token);
	if (exp === null) return null;

	const now = Math.floor(Date.now() / 1000);
	return exp - leeway - now;
};

/**
 * Format a JWT token for display
 * @param {string} token - The JWT token
 * @returns {Object} Formatted token with header, payload, and signature
 */
export const formatJwt = (token) => {
	if (!token) return null;

	try {
		const [header, payload, signature] = token.split('.');

		const formatPart = (part) => {
			try {
				const decoded = Buffer.from(part, 'base64').toString('utf-8');
				return JSON.parse(decoded);
			} catch (e) {
				return part;
			}
		};

		return {
			raw: token,
			header: formatPart(header),
			payload: formatPart(payload),
			signature: signature,
		};
	} catch (error) {
		console.error('Error formatting JWT:', error);
		return { raw: token, error: 'Invalid token format' };
	}
};

/**
 * Parse a JWT token and return its claims
 * @param {string} token - The JWT token
 * @returns {Object} Token claims
 */
export const getTokenClaims = (token) => {
	const payload = decodeJwt(token);
	if (!payload) return {};

	// Standard claims (https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims)
	const standardClaims = [
		'iss',
		'sub',
		'aud',
		'exp',
		'nbf',
		'iat',
		'jti',
		'auth_time',
		'nonce',
		'acr',
		'amr',
		'azp',
		'at_hash',
		'c_hash',
	];

	const claims = {};
	const customClaims = {};

	// Separate standard and custom claims
	Object.entries(payload).forEach(([key, value]) => {
		if (standardClaims.includes(key)) {
			claims[key] = value;
		} else {
			customClaims[key] = value;
		}
	});

	return {
		...claims,
		custom: customClaims,
	};
};

/**
 * Check if a JWT token has a specific scope
 * @param {string} token - The JWT token
 * @param {string|string[]} scope - The scope(s) to check for
 * @returns {boolean} True if the token has all the specified scopes
 */
export const hasScope = (token, scope) => {
	const payload = decodeJwt(token);
	if (!payload?.scope) return false;

	const tokenScopes = payload.scope.split(' ');
	const requiredScopes = Array.isArray(scope) ? scope : [scope];

	return requiredScopes.every((s) => tokenScopes.includes(s));
};

/**
 * Get the expiration date of a JWT token as a Date object
 * @param {string} token - The JWT token
 * @returns {Date|null} Expiration date or null if invalid
 */
export const getTokenExpirationDate = (token) => {
	const exp = getTokenExpiration(token);
	return exp ? new Date(exp * 1000) : null;
};

/**
 * Get the time until a JWT token expires in a human-readable format
 * @param {string} token - The JWT token
 * @param {number} [leeway=0] - Time in seconds to account for clock skew
 * @returns {string} Time remaining (e.g., "2h 30m")
 */
export const getTimeRemainingFormatted = (token, leeway = 0) => {
	const seconds = getTimeRemaining(token, leeway);
	if (seconds === null) return 'Invalid token';

	const absSeconds = Math.abs(seconds);
	const days = Math.floor(absSeconds / 86400);
	const hours = Math.floor((absSeconds % 86400) / 3600);
	const minutes = Math.floor((absSeconds % 3600) / 60);
	const remainingSeconds = Math.floor(absSeconds % 60);

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (seconds < 60 || parts.length === 0) parts.push(`${remainingSeconds}s`);

	const sign = seconds < 0 ? '-' : '';
	return sign + parts.join(' ');
};

/**
 * Check if a JWT token is valid (not expired and has required claims)
 * @param {string} token - The JWT token
 * @param {Object} [options] - Validation options
 * @param {string|string[]} [options.requiredClaims] - Required claims that must be present
 * @param {string|string[]} [options.requiredScopes] - Required scopes that must be present
 * @param {number} [options.leeway=0] - Time in seconds to account for clock skew
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateToken = (token, options = {}) => {
	const { requiredClaims = [], requiredScopes = [], leeway = 0 } = options;

	if (!token) {
		return { valid: false, error: 'No token provided' };
	}

	const payload = decodeJwt(token);
	if (!payload) {
		return { valid: false, error: 'Invalid token format' };
	}

	// Check expiration
	if (payload.exp && isTokenExpired(token, leeway)) {
		return {
			valid: false,
			error: `Token expired ${getTimeRemainingFormatted(token, leeway)} ago`,
		};
	}

	// Check not before time
	if (payload.nbf) {
		const now = Math.floor(Date.now() / 1000);
		if (payload.nbf > now + leeway) {
			return {
				valid: false,
				error: `Token not valid until ${new Date(payload.nbf * 1000).toISOString()}`,
			};
		}
	}

	// Check required claims
	const missingClaims = [].concat(requiredClaims).filter((claim) => !(claim in payload));
	if (missingClaims.length > 0) {
		return {
			valid: false,
			error: `Missing required claims: ${missingClaims.join(', ')}`,
		};
	}

	// Check required scopes
	if (requiredScopes.length > 0) {
		const missingScopes = [].concat(requiredScopes).filter((scope) => !hasScope(token, scope));
		if (missingScopes.length > 0) {
			return {
				valid: false,
				error: `Missing required scopes: ${missingScopes.join(', ')}`,
			};
		}
	}

	return { valid: true };
};

export default {
	decodeJwt,
	isTokenExpired,
	getTokenExpiration,
	getTimeRemaining,
	formatJwt,
	getTokenClaims,
	hasScope,
	getTokenExpirationDate,
	getTimeRemainingFormatted,
	validateToken,
};
