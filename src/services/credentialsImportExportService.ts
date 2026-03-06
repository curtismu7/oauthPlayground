// src/services/credentialsImportExportService.ts
/**
 * Standardized Credentials Import/Export Service
 * Provides consistent import/export functionality for all credential flows
 * @version 9.0.0
 * @since 2026-03-06
 */

import { modernMessaging } from '@/services/v9/V9ModernMessagingService';

export interface CredentialsConfiguration {
	_meta: {
		flowType: string;
		exportedAt: string;
		version: string;
		appName?: string;
		description?: string;
	};
	credentials: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		redirectUri?: string;
		scopes?: string | string[];
		authorizationEndpoint?: string;
		tokenEndpoint?: string;
		userinfoEndpoint?: string;
		discoveryEndpoint?: string;
		issuer?: string;
		jwksUri?: string;
		revocationEndpoint?: string;
		introspectionEndpoint?: string;
		deviceAuthorizationEndpoint?: string;
		parEndpoint?: string;
		clientAuthMethod?: string;
		grantTypes?: string[];
		responseTypes?: string[];
		[key: string]: any; // Allow additional flow-specific fields
	};
}

export interface ImportExportOptions {
	flowType: string;
	appName?: string;
	description?: string;
	onImportSuccess?: (credentials: any) => void;
	onImportError?: (error: string) => void;
	onExportSuccess?: () => void;
	onExportError?: (error: string) => void;
}

class CredentialsImportExportService {
	private readonly VERSION = '9.0.0';
	private readonly MODULE_TAG = '[🔐 CREDENTIALS-IMPORT-EXPORT]';

	/**
	 * Export credentials configuration as downloadable JSON file
	 */
	exportCredentials(
		credentials: Record<string, any>,
		options: ImportExportOptions
	): void {
		try {
			const config: CredentialsConfiguration = {
				_meta: {
					flowType: options.flowType,
					exportedAt: new Date().toISOString(),
					version: this.VERSION,
					...(options.appName && { appName: options.appName }),
					...(options.description && { description: options.description }),
				},
				credentials: this.sanitizeCredentials(credentials),
			};

			const jsonString = JSON.stringify(config, null, 2);
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = `${options.flowType}-credentials-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			console.log(`${this.MODULE_TAG} Credentials exported:`, options.flowType);
			
			if (options.onExportSuccess) {
				options.onExportSuccess();
			}

			modernMessaging.showFooterMessage({
				type: 'info',
				message: `${options.appName || options.flowType} credentials exported successfully`,
				duration: 3000,
			});
		} catch (error) {
			console.error(`${this.MODULE_TAG} Export failed:`, error);
			const errorMessage = 'Failed to export credentials';
			
			if (options.onExportError) {
				options.onExportError(errorMessage);
			}

			modernMessaging.showBanner({
				type: 'error',
				title: 'Export Error',
				message: errorMessage,
				dismissible: true,
			});
		}
	}

	/**
	 * Import credentials from uploaded JSON file
	 */
	async importCredentials(
		file: File,
		options: ImportExportOptions
	): Promise<any> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (event) => {
				try {
					const jsonString = event.target?.result as string;
					const config: CredentialsConfiguration = JSON.parse(jsonString);

					// Validate configuration structure
					if (!config._meta?.flowType || !config.credentials) {
						throw new Error('Invalid credentials file format');
					}

					// Validate flow type matches expected flow
					if (config._meta.flowType !== options.flowType) {
						throw new Error(`Invalid flow type. Expected: ${options.flowType}, Got: ${config._meta.flowType}`);
					}

					// Validate version compatibility
					if (!this.isVersionCompatible(config._meta.version)) {
						throw new Error(`Incompatible version. File version: ${config._meta.version}, Current: ${this.VERSION}`);
					}

					const sanitizedCredentials = this.sanitizeCredentials(config.credentials);

					console.log(`${this.MODULE_TAG} Credentials imported:`, config._meta.flowType);
					
					if (options.onImportSuccess) {
						options.onImportSuccess(sanitizedCredentials);
					}

					modernMessaging.showFooterMessage({
						type: 'info',
						message: `${options.appName || options.flowType} credentials imported successfully`,
						duration: 3000,
					});

					resolve(sanitizedCredentials);
				} catch (error) {
					console.error(`${this.MODULE_TAG} Import failed:`, error);
					const errorMessage = error instanceof Error ? error.message : 'Failed to import credentials';
					
					if (options.onImportError) {
						options.onImportError(errorMessage);
					}

					modernMessaging.showBanner({
						type: 'error',
						title: 'Import Error',
						message: errorMessage,
						dismissible: true,
					});

					reject(new Error(errorMessage));
				}
			};

			reader.onerror = () => {
				const errorMessage = 'Failed to read file';
				console.error(`${this.MODULE_TAG} File read error`);
				
				if (options.onImportError) {
					options.onImportError(errorMessage);
				}

				modernMessaging.showBanner({
					type: 'error',
					title: 'File Error',
					message: errorMessage,
					dismissible: true,
				});

				reject(new Error(errorMessage));
			};

			reader.readAsText(file);
		});
	}

	/**
	 * Create import handler function for React components
	 */
	createImportHandler(options: ImportExportOptions): (event: React.ChangeEvent<HTMLInputElement>) => void {
		return (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			this.importCredentials(file, options)
				.then((credentials) => {
					// Reset input to allow re-importing same file
					event.target.value = '';
				})
				.catch(() => {
					// Reset input on error
					event.target.value = '';
				});
		};
	}

	/**
	 * Create export handler function for React components
	 */
	createExportHandler(
		credentials: Record<string, any>,
		options: ImportExportOptions
	): () => void {
		return () => {
			this.exportCredentials(credentials, options);
		};
	}

	/**
	 * Validate imported credentials file (without importing)
	 */
	validateImportFile(file: File, expectedFlowType: string): Promise<ValidationResult> {
		return new Promise((resolve) => {
			const reader = new FileReader();

			reader.onload = (event) => {
				try {
					const jsonString = event.target?.result as string;
					const config: CredentialsConfiguration = JSON.parse(jsonString);

					// Basic structure validation
					if (!config._meta?.flowType || !config.credentials) {
						resolve({
							valid: false,
							errors: ['Invalid file format: missing required fields'],
						});
						return;
					}

					// Flow type validation
					if (config._meta.flowType !== expectedFlowType) {
						resolve({
							valid: false,
							errors: [`Invalid flow type. Expected: ${expectedFlowType}, Got: ${config._meta.flowType}`],
						});
						return;
					}

					// Version compatibility check
					if (!this.isVersionCompatible(config._meta.version)) {
						resolve({
							valid: false,
							errors: [`Incompatible version. File: ${config._meta.version}, Current: ${this.VERSION}`],
						});
						return;
					}

					// Credentials validation
					const credentialErrors = this.validateCredentials(config.credentials);
					
					resolve({
						valid: credentialErrors.length === 0,
						errors: credentialErrors,
						metadata: config._meta,
					});
				} catch (error) {
					resolve({
						valid: false,
						errors: ['Invalid JSON format'],
					});
				}
			};

			reader.onerror = () => {
				resolve({
					valid: false,
					errors: ['Failed to read file'],
				});
			};

			reader.readAsText(file);
		});
	}

	/**
	 * Private helper methods
	 */
	private sanitizeCredentials(credentials: Record<string, any>): Record<string, any> {
		// Remove sensitive or internal fields
		const { lastUpdated, ...sanitized } = credentials;
		return sanitized;
	}

	private isVersionCompatible(fileVersion: string): boolean {
		// Simple version compatibility check - allow same major version
		const fileMajor = fileVersion.split('.')[0];
		const currentMajor = this.VERSION.split('.')[0];
		return fileMajor === currentMajor;
	}

	private validateCredentials(credentials: Record<string, any>): string[] {
		const errors: string[] = [];

		// Check for at least one credential field
		if (!credentials.environmentId && !credentials.clientId && !credentials.clientSecret) {
			errors.push('At least one credential field (environmentId, clientId, or clientSecret) is required');
		}

		// Validate environmentId format if present
		if (credentials.environmentId && !this.isValidEnvironmentId(credentials.environmentId)) {
			errors.push('Invalid environmentId format');
		}

		// Validate clientId format if present
		if (credentials.clientId && !credentials.clientId.trim()) {
			errors.push('ClientId cannot be empty');
		}

		return errors;
	}

	private isValidEnvironmentId(environmentId: string): boolean {
		// Basic UUID format validation
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(environmentId);
	}
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	metadata?: CredentialsConfiguration['_meta'];
}

// Singleton instance
export const credentialsImportExportService = new CredentialsImportExportService();

export default credentialsImportExportService;
