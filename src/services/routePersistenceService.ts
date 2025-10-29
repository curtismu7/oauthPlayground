// src/services/routePersistenceService.ts
// Service to remember the last visited route and restore it on app reload

const LAST_ROUTE_KEY = 'oauth_playground_last_route';
const LAST_ROUTE_TIMESTAMP_KEY = 'oauth_playground_last_route_timestamp';
const ROUTE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Routes that should NOT be remembered (callbacks, error pages, etc.)
 */
const EXCLUDED_ROUTES = [
	'/login',
	'/callback',
	'/authz-callback',
	'/oauth-v3-callback',
	'/hybrid-callback',
	'/implicit-callback',
	'/oauth-implicit-callback',
	'/oidc-implicit-callback',
	'/implicit-callback-v3',
	'/worker-token-callback',
	'/device-code-status',
	'/logout-callback',
	'/authz-logout-callback',
	'/implicit-logout-callback',
	'/hybrid-logout-callback',
	'/device-logout-callback',
	'/worker-token-logout-callback',
	'/p1auth-logout-callback',
	'/dashboard-logout-callback',
	'/dashboard-callback',
	'/oauth-callback',
	'/oidc-callback',
	'/mfa-callback',
	'/p1-callback',
	'/p1auth-callback',
	'/pingone-authentication/result', // Don't remember the result page, remember the auth page instead
];

/**
 * Default route to use if no route is saved or route is expired
 */
const DEFAULT_ROUTE = '/dashboard';

export class RoutePersistenceService {
	/**
	 * Save the current route to localStorage
	 */
	static saveCurrentRoute(path: string): void {
		// Don't save excluded routes
		if (this.isExcludedRoute(path)) {
			console.log(`🚫 [RoutePersistence] Not saving excluded route: ${path}`);
			return;
		}

		// Don't save the root path
		if (path === '/' || path === '') {
			console.log(`🚫 [RoutePersistence] Not saving root path`);
			return;
		}

		try {
			localStorage.setItem(LAST_ROUTE_KEY, path);
			localStorage.setItem(LAST_ROUTE_TIMESTAMP_KEY, Date.now().toString());
			console.log(`💾 [RoutePersistence] Saved route: ${path}`);
		} catch (error) {
			console.warn('[RoutePersistence] Failed to save route:', error);
		}
	}

	/**
	 * Get the last saved route, or default if none/expired
	 */
	static getLastRoute(): string {
		try {
			const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
			const timestamp = localStorage.getItem(LAST_ROUTE_TIMESTAMP_KEY);

			if (!savedRoute || !timestamp) {
				console.log(`📍 [RoutePersistence] No saved route, using default: ${DEFAULT_ROUTE}`);
				return DEFAULT_ROUTE;
			}

			// Check if route is expired
			const age = Date.now() - parseInt(timestamp, 10);
			if (age > ROUTE_EXPIRY_MS) {
				console.log(`⏰ [RoutePersistence] Saved route expired, using default: ${DEFAULT_ROUTE}`);
				this.clearSavedRoute();
				return DEFAULT_ROUTE;
			}

			console.log(`✅ [RoutePersistence] Restoring last route: ${savedRoute}`);
			return savedRoute;
		} catch (error) {
			console.warn('[RoutePersistence] Failed to get last route:', error);
			return DEFAULT_ROUTE;
		}
	}

	/**
	 * Clear the saved route
	 */
	static clearSavedRoute(): void {
		try {
			localStorage.removeItem(LAST_ROUTE_KEY);
			localStorage.removeItem(LAST_ROUTE_TIMESTAMP_KEY);
			console.log(`🗑️ [RoutePersistence] Cleared saved route`);
		} catch (error) {
			console.warn('[RoutePersistence] Failed to clear saved route:', error);
		}
	}

	/**
	 * Check if a route should be excluded from saving
	 */
	private static isExcludedRoute(path: string): boolean {
		return EXCLUDED_ROUTES.some((excluded) => path.startsWith(excluded));
	}

	/**
	 * Get route age in milliseconds
	 */
	static getRouteAge(): number | null {
		try {
			const timestamp = localStorage.getItem(LAST_ROUTE_TIMESTAMP_KEY);
			if (!timestamp) return null;
			return Date.now() - parseInt(timestamp, 10);
		} catch (error) {
			return null;
		}
	}

	/**
	 * Check if there's a valid saved route
	 */
	static hasSavedRoute(): boolean {
		const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
		const timestamp = localStorage.getItem(LAST_ROUTE_TIMESTAMP_KEY);
		
		if (!savedRoute || !timestamp) return false;
		
		const age = Date.now() - parseInt(timestamp, 10);
		return age < ROUTE_EXPIRY_MS;
	}
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).RoutePersistenceService = RoutePersistenceService;
	console.log('🔧 RoutePersistenceService available globally as window.RoutePersistenceService');
	console.log('🔧 Available commands:');
	console.log('  - RoutePersistenceService.getLastRoute()');
	console.log('  - RoutePersistenceService.saveCurrentRoute(path)');
	console.log('  - RoutePersistenceService.clearSavedRoute()');
	console.log('  - RoutePersistenceService.hasSavedRoute()');
	console.log('  - RoutePersistenceService.getRouteAge()');
}

export default RoutePersistenceService;


