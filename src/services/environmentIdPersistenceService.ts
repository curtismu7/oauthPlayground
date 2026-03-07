// Environment ID Persistence Service
// Manages saving/loading Environment ID to/from .env file

import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { logger } from '../utils/logger';

interface EnvironmentIdConfig {
	environmentId: string;
	lastUpdated: number;
	source: 'manual' | 'oidc_discovery' | 'env_file';
}

class EnvironmentIdPersistenceService {
	private readonly STORAGE_KEY = 'pingone_environment_id_persistence';
	private readonly ENV_VAR_NAME = 'REACT_APP_PINGONE_ENVIRONMENT_ID';

	// Safely read env vars in browser (Vite)
	private getEnvVar(name: string): string | undefined {
		try {
			// @ts-expect-error - import.meta is a Vite construct; guarded access
			const meta = import.meta as unknown as { env?: Record<string, string> };
			const env = meta?.env ? meta.env : undefined;
			if (env) {
				// Try exact name first
				if (env[name]) return String(env[name]);
				// Common alternates
				if (name === 'REACT_APP_PINGONE_ENVIRONMENT_ID') {
					if (env.VITE_PINGONE_ENVIRONMENT_ID) return String(env.VITE_PINGONE_ENVIRONMENT_ID);
				}
			}
		} catch {}
		return undefined;
	}

	/**
	 * Save Environment ID to localStorage and optionally to .env
	 */
	saveEnvironmentId(environmentId: string, source: 'manual' | 'oidc_discovery' = 'manual'): void {
		if (!environmentId || !environmentId.trim()) {
			logger.warn(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistence] Cannot save empty environment ID'
			);
			return;
		}

		const config: EnvironmentIdConfig = {
			environmentId: environmentId.trim(),
			lastUpdated: Date.now(),
			source,
		};

		// Save to localStorage
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
			logger.info(
				'EnvironmentIdPersistenceService',
				`🔧 [EnvironmentIdPersistence] Saved Environment ID: ${environmentId} (source: ${source})`
			);
		} catch (error) {
			logger.error(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistence] Failed to save to localStorage:',
				undefined,
				error as Error
			);
		}

		// In development, we can't directly write to .env, but we can provide instructions
		this.showEnvUpdateInstructions(environmentId);
	}

	/**
	 * Load Environment ID from localStorage or .env
	 */
	loadEnvironmentId(): string | null {
		// First try localStorage
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				const config: EnvironmentIdConfig = JSON.parse(stored);
				logger.info(
					'EnvironmentIdPersistenceService',
					`🔧 [EnvironmentIdPersistence] Loaded Environment ID from localStorage: ${config.environmentId}`
				);
				return config.environmentId;
			}
		} catch (error) {
			logger.error(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistence] Failed to load from localStorage:',
				undefined,
				error as Error
			);
		}

		// Fallback to environment variable (Vite/import.meta.env)
		const envId = this.getEnvVar(this.ENV_VAR_NAME);
		if (envId) {
			logger.info(
				'EnvironmentIdPersistenceService',
				`🔧 [EnvironmentIdPersistence] Loaded Environment ID from .env: ${envId}`
			);
			// Save to localStorage for consistency
			this.saveEnvironmentId(envId, 'env_file');
			return envId;
		}

		logger.info(
			'EnvironmentIdPersistenceService',
			'[EnvironmentIdPersistence] No Environment ID found'
		);
		return null;
	}

	/**
	 * Get the last saved Environment ID info
	 */
	getLastEnvironmentIdInfo(): EnvironmentIdConfig | null {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			logger.error(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistence] Failed to load info:',
				undefined,
				error as Error
			);
		}
		return null;
	}

	/**
	 * Check if Environment ID has changed and needs .env update
	 */
	hasEnvironmentIdChanged(newEnvironmentId: string): boolean {
		const current = this.loadEnvironmentId();
		return current !== newEnvironmentId;
	}

	/**
	 * Show instructions for updating .env file
	 */
	private showEnvUpdateInstructions(environmentId: string): void {
		const instructions = `
🔧 Environment ID Update Required

The Environment ID has been updated to: ${environmentId}

To persist this change, add or update this line in your .env file:

REACT_APP_PINGONE_ENVIRONMENT_ID=${environmentId}

After updating .env:
1. Restart the development server
2. The Environment ID will be automatically loaded on next startup
    `;

		logger.info('EnvironmentIdPersistenceService', instructions);

		// Show a toast notification
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Environment ID updated. Check console for .env update instructions.',
			duration: 4000,
		});
	}

	/**
	 * Generate .env content for the current Environment ID
	 */
	generateEnvContent(): string {
		logger.info(
			'EnvironmentIdPersistenceService',
			'[EnvironmentIdPersistenceService] Generating .env content'
		);
		const currentId = this.loadEnvironmentId();
		logger.info(
			'EnvironmentIdPersistenceService',
			'[EnvironmentIdPersistenceService] Current Environment ID:',
			{ arg0: currentId }
		);
		if (!currentId) {
			logger.info(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistenceService] No Environment ID found'
			);
			return '# No Environment ID found\n';
		}

		const content = `# PingOne Environment ID
# Last updated: ${new Date().toISOString()}
REACT_APP_PINGONE_ENVIRONMENT_ID=${currentId}
`;
		logger.info(
			'EnvironmentIdPersistenceService',
			'[EnvironmentIdPersistenceService] Generated .env content:',
			{ arg0: content }
		);
		return content;
	}

	/**
	 * Generate .env content with newline (for appending to existing .env)
	 */
	generateEnvContentWithNewline(): string {
		logger.info(
			'EnvironmentIdPersistenceService',
			'[EnvironmentIdPersistenceService] Generating .env content with newline'
		);
		const content = this.generateEnvContent();
		logger.info(
			'EnvironmentIdPersistenceService',
			'[EnvironmentIdPersistenceService] Generated .env content with newline:',
			{ arg0: content }
		);
		return `${content}\n`;
	}

	/**
	 * Clear stored Environment ID
	 */
	clearEnvironmentId(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			logger.info(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistence] Cleared Environment ID from localStorage'
			);
		} catch (error) {
			logger.error(
				'EnvironmentIdPersistenceService',
				'[EnvironmentIdPersistence] Failed to clear:',
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Get persistence status
	 */
	getPersistenceStatus(): {
		hasStoredId: boolean;
		hasEnvVar: boolean;
		lastUpdated: string | null;
		source: string | null;
	} {
		const info = this.getLastEnvironmentIdInfo();
		const envVar = this.getEnvVar(this.ENV_VAR_NAME);

		return {
			hasStoredId: !!info,
			hasEnvVar: !!envVar,
			lastUpdated: info ? new Date(info.lastUpdated).toISOString() : null,
			source: info?.source || null,
		};
	}
}

// Export singleton instance
export const environmentIdPersistenceService = new EnvironmentIdPersistenceService();

// Export for global access in development
if (typeof window !== 'undefined') {
	(window as Record<string, unknown>).environmentIdPersistenceService = environmentIdPersistenceService;
}
