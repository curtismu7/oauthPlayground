// src/v8/services/tokenExchangeConfigServiceV8.ts
// Token Exchange Phase 1 - Admin Configuration Service

import {
	AdminTokenExchangeConfig,
	TokenExchangeError,
	TokenExchangeErrorType,
} from '../types/tokenExchangeTypesV8';

/**
 * Token Exchange Configuration Service V8
 *
 * Handles admin enablement and configuration for Token Exchange Phase 1
 * Following SWE-15 principles: Single Responsibility, Dependency Inversion
 */
export class TokenExchangeConfigServiceV8 {
	private static readonly MODULE_TAG = '[TokenExchangeConfigV8]';

	/**
	 * Check if Token Exchange is enabled for the environment
	 * CRITICAL: Must be called before any token exchange processing
	 */
	static async isEnabled(environmentId: string): Promise<boolean> {
		try {
			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Checking Token Exchange enablement for environment: ${environmentId}`
			);

			const config = await TokenExchangeConfigServiceV8.getAdminConfig(environmentId);

			if (!config.enabled) {
				console.warn(
					`${TokenExchangeConfigServiceV8.MODULE_TAG} Token Exchange is disabled for environment: ${environmentId}`
				);
				return false;
			}

			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Token Exchange is enabled for environment: ${environmentId}`
			);
			return true;
		} catch (error) {
			console.error(`${TokenExchangeConfigServiceV8.MODULE_TAG} Error checking enablement:`, error);
			// Default to disabled for safety
			return false;
		}
	}

	/**
	 * Get admin configuration for Token Exchange
	 */
	static async getAdminConfig(environmentId: string): Promise<AdminTokenExchangeConfig> {
		try {
			// TODO: Implement actual admin config retrieval from PingOne admin API
			// For now, return default disabled config
			const defaultConfig: AdminTokenExchangeConfig = {
				enabled: false,
				allowedScopes: ['read', 'write', 'admin'],
				maxTokenLifetime: 3600, // 1 hour
				allowedAudiences: [],
				requireSameEnvironment: true,
				lastUpdated: Date.now(),
				updatedBy: 'system',
			};

			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Retrieved admin config for environment: ${environmentId}`
			);
			return defaultConfig;
		} catch (error) {
			console.error(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Error getting admin config:`,
				error
			);
			throw new TokenExchangeError(
				TokenExchangeErrorType.SERVER_ERROR,
				`Failed to retrieve admin configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Enable Token Exchange for an environment (Admin only)
	 */
	static async enableTokenExchange(
		environmentId: string,
		adminUserId: string,
		config?: Partial<AdminTokenExchangeConfig>
	): Promise<void> {
		try {
			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Enabling Token Exchange for environment: ${environmentId} by admin: ${adminUserId}`
			);

			// TODO: Implement actual admin API call to PingOne
			// For now, just log the action
			const updatedConfig: AdminTokenExchangeConfig = {
				enabled: true,
				allowedScopes: config?.allowedScopes || ['read', 'write', 'admin'],
				maxTokenLifetime: config?.maxTokenLifetime || 3600,
				allowedAudiences: config?.allowedAudiences || [],
				requireSameEnvironment: config?.requireSameEnvironment ?? true,
				lastUpdated: Date.now(),
				updatedBy: adminUserId,
			};

			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Token Exchange enabled successfully:`,
				updatedConfig
			);
		} catch (error) {
			console.error(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Error enabling Token Exchange:`,
				error
			);
			throw new TokenExchangeError(
				TokenExchangeErrorType.SERVER_ERROR,
				`Failed to enable Token Exchange: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Disable Token Exchange for an environment (Admin only)
	 */
	static async disableTokenExchange(environmentId: string, adminUserId: string): Promise<void> {
		try {
			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Disabling Token Exchange for environment: ${environmentId} by admin: ${adminUserId}`
			);

			// TODO: Implement actual admin API call to PingOne
			// For now, just log the action
			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Token Exchange disabled successfully`
			);
		} catch (error) {
			console.error(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} Error disabling Token Exchange:`,
				error
			);
			throw new TokenExchangeError(
				TokenExchangeErrorType.SERVER_ERROR,
				`Failed to disable Token Exchange: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate requested scopes against admin configuration
	 */
	static async validateScopes(environmentId: string, requestedScopes: string[]): Promise<boolean> {
		try {
			const config = await TokenExchangeConfigServiceV8.getAdminConfig(environmentId);

			// Check if all requested scopes are allowed
			const invalidScopes = requestedScopes.filter(
				(scope) => !config.allowedScopes.includes(scope)
			);

			if (invalidScopes.length > 0) {
				console.warn(
					`${TokenExchangeConfigServiceV8.MODULE_TAG} Invalid scopes requested:`,
					invalidScopes
				);
				return false;
			}

			console.log(
				`${TokenExchangeConfigServiceV8.MODULE_TAG} All scopes validated successfully:`,
				requestedScopes
			);
			return true;
		} catch (error) {
			console.error(`${TokenExchangeConfigServiceV8.MODULE_TAG} Error validating scopes:`, error);
			return false;
		}
	}
}
