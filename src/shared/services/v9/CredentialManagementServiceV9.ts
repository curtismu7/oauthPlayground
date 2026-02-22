/**
 * @file CredentialManagementServiceV9.ts
 * @module shared/services/v9
 * @description V9 unified credential management service
 * @version 9.0.0
 * @since 2026-02-20
 *
 * Consolidates credential management from:
 * - CredentialsServiceV8
 * - EnvironmentIdServiceV8
 * - SharedCredentialsServiceV8
 *
 * Provides unified credential handling across all apps and flows.
 */

export interface V9Credentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	loginHint?: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	[key: string]: unknown;
}

export interface V9CredentialConfig {
	credentials: V9Credentials;
	isValid: boolean;
	lastUpdated: number;
	source: 'oauth' | 'mfa' | 'flows' | 'unified';
}

const STORAGE_KEY = 'v9_credentials';

/**
 * V9 Credential Management Service
 *
 * Consolidates credential management functionality from multiple V8 services
 * into a single, unified service for better maintainability and consistency.
 */
export const CredentialManagementServiceV9 = {
	/**
	 * Get credentials for a specific app/source
	 */
	getCredentials(source: string): V9Credentials | null {
		try {
			const stored = localStorage.getItem(`${STORAGE_KEY}_${source}`);
			return stored ? JSON.parse(stored) : null;
		} catch (error) {
			console.error(`[V9-CREDENTIALS] Error getting credentials for ${source}:`, error);
			return null;
		}
	},

	/**
	 * Set credentials for a specific app/source
	 */
	setCredentials(source: string, credentials: V9Credentials): void {
		try {
			localStorage.setItem(`${STORAGE_KEY}_${source}`, JSON.stringify(credentials));
			console.log(`[V9-CREDENTIALS] ✅ Set credentials for ${source}`);
		} catch (error) {
			console.error(`[V9-CREDENTIALS] Error setting credentials for ${source}:`, error);
		}
	},

	/**
	 * Get environment ID from any available source
	 */
	getEnvironmentId(): string {
		// Try to get from all sources in order of preference
		const sources = ['oauth', 'mfa', 'flows', 'unified'];

		for (const source of sources) {
			const credentials = this.getCredentials(source);
			if (credentials?.environmentId) {
				return credentials.environmentId;
			}
		}

		return '';
	},

	/**
	 * Set environment ID across all sources
	 */
	setEnvironmentId(environmentId: string): void {
		const sources = ['oauth', 'mfa', 'flows', 'unified'];

		for (const source of sources) {
			const credentials = this.getCredentials(source) || ({} as V9Credentials);
			credentials.environmentId = environmentId;
			this.setCredentials(source, credentials);
		}
	},

	/**
	 * Validate credentials
	 */
	validateCredentials(credentials: V9Credentials): boolean {
		return !!(
			credentials.environmentId &&
			credentials.clientId &&
			credentials.environmentId.trim() !== '' &&
			credentials.clientId.trim() !== ''
		);
	},

	/**
	 * Get credential configuration status
	 */
	getConfigStatus(): V9CredentialConfig[] {
		const configs: V9CredentialConfig[] = [];
		const sources = ['oauth', 'mfa', 'flows', 'unified'];

		for (const source of sources) {
			const credentials = this.getCredentials(source);
			configs.push({
				credentials: credentials || ({} as V9Credentials),
				isValid: credentials ? this.validateCredentials(credentials) : false,
				lastUpdated: Date.now(),
				source: source as 'oauth' | 'mfa' | 'flows' | 'unified',
			});
		}

		return configs;
	},

	/**
	 * Clear credentials for a specific source
	 */
	clearCredentials(source: string): void {
		try {
			localStorage.removeItem(`${STORAGE_KEY}_${source}`);
			console.log(`[V9-CREDENTIALS] 🗑️ Cleared credentials for ${source}`);
		} catch (error) {
			console.error(`[V9-CREDENTIALS] Error clearing credentials for ${source}:`, error);
		}
	},

	/**
	 * Clear all credentials
	 */
	clearAllCredentials(): void {
		const sources = ['oauth', 'mfa', 'flows', 'unified'];

		for (const source of sources) {
			this.clearCredentials(source);
		}

		console.log('[V9-CREDENTIALS] 🗑️ Cleared all credentials');
	},

	/**
	 * Export credentials for backup/migration
	 */
	exportCredentials(): Record<string, V9Credentials> {
		const exportData: Record<string, V9Credentials> = {};
		const sources = ['oauth', 'mfa', 'flows', 'unified'];

		for (const source of sources) {
			const credentials = this.getCredentials(source);
			if (credentials) {
				exportData[source] = credentials;
			}
		}

		return exportData;
	},

	/**
	 * Import credentials from backup/migration
	 */
	importCredentials(credentials: Record<string, V9Credentials>): void {
		for (const [source, creds] of Object.entries(credentials)) {
			this.setCredentials(source, creds);
		}

		console.log('[V9-CREDENTIALS] 📥 Imported credentials from backup');
	},
};

export default CredentialManagementServiceV9;
