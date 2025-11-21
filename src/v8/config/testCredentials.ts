/**
 * @file testCredentials.ts
 * @module v8/config
 * @description Test credentials for PingOne API testing
 * @version 8.0.0
 * @since 2024-11-16
 *
 * WARNING: These are test credentials for development only.
 * Never commit real credentials to version control.
 * Use environment variables in production.
 */

const MODULE_TAG = '[🔑 TEST-CREDENTIALS-V8]';

export const TEST_CREDENTIALS = {
	environmentId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
	workerToken: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a',

	// OAuth Application Credentials (to be configured in PingOne)
	// These should be set up in your PingOne environment
	oauthCredentials: {
		clientId: '', // Set this after creating OAuth app in PingOne
		clientSecret: '', // Set this after creating OAuth app in PingOne
		redirectUri: 'http://localhost:3000/authz-callback',
		implicitRedirectUri: 'http://localhost:3000/implicit-callback',
	},

	// Test configuration
	testConfig: {
		enableLogging: true,
		logLevel: 'debug',
		timeout: 30000,
		retries: 3,
	},
};

/**
 * Get test credentials
 * @returns Test credentials object
 */
export function getTestCredentials() {
	console.log(`${MODULE_TAG} Loading test credentials`);

	if (!TEST_CREDENTIALS.environmentId) {
		console.error(`${MODULE_TAG} Environment ID not configured`);
		throw new Error('Environment ID not configured');
	}

	if (!TEST_CREDENTIALS.workerToken) {
		console.error(`${MODULE_TAG} Worker token not configured`);
		throw new Error('Worker token not configured');
	}

	return TEST_CREDENTIALS;
}

/**
 * Check if OAuth credentials are configured
 * @returns True if OAuth credentials are configured
 */
export function isOAuthConfigured(): boolean {
	const { oauthCredentials } = TEST_CREDENTIALS;
	return !!(oauthCredentials.clientId && oauthCredentials.clientSecret);
}

/**
 * Get OAuth credentials
 * @returns OAuth credentials object
 */
export function getOAuthCredentials() {
	console.log(`${MODULE_TAG} Loading OAuth credentials`);

	if (!isOAuthConfigured()) {
		console.warn(`${MODULE_TAG} OAuth credentials not fully configured`);
		console.warn(`${MODULE_TAG} Please set clientId and clientSecret in testCredentials.ts`);
	}

	return TEST_CREDENTIALS.oauthCredentials;
}

/**
 * Validate test credentials
 * @returns Validation result
 */
export function validateTestCredentials(): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!TEST_CREDENTIALS.environmentId) {
		errors.push('Environment ID is required');
	}

	if (!TEST_CREDENTIALS.workerToken) {
		errors.push('Worker token is required');
	}

	// Check if environment ID is valid UUID format
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (TEST_CREDENTIALS.environmentId && !uuidRegex.test(TEST_CREDENTIALS.environmentId)) {
		errors.push('Environment ID is not a valid UUID');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Log test credentials status
 */
export function logCredentialsStatus() {
	console.log(`${MODULE_TAG} === Test Credentials Status ===`);
	console.log(
		`${MODULE_TAG} Environment ID: ${TEST_CREDENTIALS.environmentId ? '✅ Configured' : '❌ Missing'}`
	);
	console.log(
		`${MODULE_TAG} Worker Token: ${TEST_CREDENTIALS.workerToken ? '✅ Configured' : '❌ Missing'}`
	);
	console.log(
		`${MODULE_TAG} OAuth Client ID: ${TEST_CREDENTIALS.oauthCredentials.clientId ? '✅ Configured' : '⚠️ Not configured'}`
	);
	console.log(
		`${MODULE_TAG} OAuth Client Secret: ${TEST_CREDENTIALS.oauthCredentials.clientSecret ? '✅ Configured' : '⚠️ Not configured'}`
	);
	console.log(`${MODULE_TAG} Redirect URI: ${TEST_CREDENTIALS.oauthCredentials.redirectUri}`);
	console.log(
		`${MODULE_TAG} Implicit Redirect URI: ${TEST_CREDENTIALS.oauthCredentials.implicitRedirectUri}`
	);

	const validation = validateTestCredentials();
	if (validation.valid) {
		console.log(`${MODULE_TAG} ✅ All required credentials configured`);
	} else {
		console.warn(`${MODULE_TAG} ⚠️ Missing credentials:`, validation.errors);
	}
}

export default TEST_CREDENTIALS;
