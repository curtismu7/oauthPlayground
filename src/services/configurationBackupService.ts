// src/services/configurationBackupService.ts
/**
 * Configuration Backup Service
 * Allows users to export/import flow configurations as JSON files
 */

export interface FlowConfiguration {
	flowType: string;
	timestamp: string;
	version: string;
	credentials: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		redirectUri?: string;
		discoveryEndpoint?: string;
		issuer?: string;
		authorizationEndpoint?: string;
		tokenEndpoint?: string;
		userinfoEndpoint?: string;
		jwksUri?: string;
		revocationEndpoint?: string;
		introspectionEndpoint?: string;
		deviceAuthorizationEndpoint?: string;
		parEndpoint?: string;
		[key: string]: any; // Allow additional fields
	};
	metadata?: {
		appName?: string;
		description?: string;
		notes?: string;
	};
}

class ConfigurationBackupService {
	private readonly VERSION = '1.0.0';

	/**
	 * Export configuration to JSON file
	 */
	exportConfiguration(
		flowType: string,
		credentials: Record<string, any>,
		metadata?: { appName?: string; description?: string; notes?: string }
	): void {
		const config: FlowConfiguration = {
			flowType,
			timestamp: new Date().toISOString(),
			version: this.VERSION,
			credentials,
			...(metadata && { metadata }),
		};

		const jsonString = JSON.stringify(config, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `${flowType}-config-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		console.log('[CONFIG-BACKUP] Configuration exported:', flowType);
	}

	/**
	 * Import configuration from JSON file
	 */
	async importConfiguration(file: File): Promise<FlowConfiguration> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (event) => {
				try {
					const jsonString = event.target?.result as string;
					const config: FlowConfiguration = JSON.parse(jsonString);

					// Validate configuration structure
					if (!config.flowType || !config.credentials) {
						throw new Error('Invalid configuration file format');
					}

					console.log('[CONFIG-BACKUP] Configuration imported:', config.flowType);
					resolve(config);
				} catch (error) {
					console.error('[CONFIG-BACKUP] Import failed:', error);
					reject(new Error('Failed to parse configuration file. Please ensure it is a valid JSON file.'));
				}
			};

			reader.onerror = () => {
				reject(new Error('Failed to read file'));
			};

			reader.readAsText(file);
		});
	}

	/**
	 * Validate imported configuration
	 */
	validateConfiguration(config: FlowConfiguration): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!config.flowType) {
			errors.push('Missing flow type');
		}

		if (!config.credentials) {
			errors.push('Missing credentials');
		}

		if (!config.version) {
			errors.push('Missing version');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get a preview of the configuration (sanitized for display)
	 */
	getConfigurationPreview(config: FlowConfiguration): string {
		const preview = {
			flowType: config.flowType,
			timestamp: config.timestamp,
			hasEnvironmentId: !!config.credentials.environmentId,
			hasClientId: !!config.credentials.clientId,
			hasClientSecret: !!config.credentials.clientSecret,
			hasRedirectUri: !!config.credentials.redirectUri,
			credentialCount: Object.keys(config.credentials).length,
		};

		return JSON.stringify(preview, null, 2);
	}
}

export const configurationBackupService = new ConfigurationBackupService();
export default configurationBackupService;
