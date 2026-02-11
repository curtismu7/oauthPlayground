/**
 * @file protectPortalAppConfig.ts
 * @module protect-portal/config
 * @description Protect Portal application configuration
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This configuration provides real PingOne credentials and settings
 * for the Protect Portal application.
 */

// ============================================================================
// PINGONE CONFIGURATION
// ============================================================================

export const PINGONE_CONFIG = {
	// Production environment (replace with real values)
	environmentId: import.meta.env.VITE_PINGONE_ENVIRONMENT_ID || 'your-environment-id',
	clientId: import.meta.env.VITE_PINGONE_CLIENT_ID || 'your-client-id',
	clientSecret: import.meta.env.VITE_PINGONE_CLIENT_SECRET || 'your-client-secret',
	redirectUri:
		import.meta.env.VITE_PINGONE_REDIRECT_URI || 'http://localhost:3000/protect-portal-callback',

	// Development fallbacks (for testing)
	development: {
		environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9', // Sample environment ID
		clientId: 'sample-client-id-1234',
		clientSecret: 'sample-client-secret-shhh',
		redirectUri: 'http://localhost:3000/protect-portal-callback',
	},
};

// ============================================================================
// PROTECT CONFIGURATION
// ============================================================================

export const PROTECT_CONFIG = {
	// Production environment (replace with real values)
	environmentId: import.meta.env.VITE_PROTECT_ENVIRONMENT_ID || 'your-protect-environment-id',
	workerToken: import.meta.env.VITE_PROTECT_WORKER_TOKEN || 'your-protect-worker-token',
	region: (import.meta.env.VITE_PROTECT_REGION || 'us') as 'us' | 'eu' | 'ap' | 'ca',

	// Development fallbacks (for testing)
	development: {
		environmentId: 'your-protect-environment-id',
		workerToken: 'your-protect-worker-token',
		region: 'us' as const,
	},
};

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export const getPortalAppConfig = () => {
	const isDevelopment = import.meta.env.DEV;

	return {
		pingone: isDevelopment ? PINGONE_CONFIG.development : PINGONE_CONFIG,
		protect: isDevelopment ? PROTECT_CONFIG.development : PROTECT_CONFIG,
		isDevelopment,
	};
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
	PINGONE_CONFIG,
	PROTECT_CONFIG,
	getPortalAppConfig,
};
