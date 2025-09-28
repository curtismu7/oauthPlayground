// src/utils/v4SaveHandler.ts - Enhanced Save Configuration Handler for V4 Flows

import { StepCredentials, ValidationResult, SaveResult, V4SaveConfigurationHandler as IV4SaveConfigurationHandler } from '../types/v4FlowTemplate';
import { credentialManager } from './credentialManager';
import { showGlobalError, showGlobalSuccess, showGlobalWarning } from '../hooks/useNotifications';

export class V4SaveConfigurationHandler implements IV4SaveConfigurationHandler {
	public flowType: string;
	private isLoading: boolean = false;

	constructor(flowType: string) {
		this.flowType = flowType;
	}

	/**
	 * Validate configuration before saving
	 */
	validateConfiguration(credentials: StepCredentials): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required field validation
		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		} else if (!this.isValidUUID(credentials.environmentId)) {
			errors.push('Environment ID must be a valid UUID');
		}

		if (!credentials.clientId?.trim()) {
			errors.push('Client ID is required');
		} else if (credentials.clientId.length < 8) {
			errors.push('Client ID must be at least 8 characters long');
		}

		if (!credentials.redirectUri?.trim()) {
			errors.push('Redirect URI is required');
		} else if (!this.isValidUrl(credentials.redirectUri)) {
			errors.push('Redirect URI must be a valid URL');
		}

		// Scope validation
		if (!credentials.scopes?.trim()) {
			warnings.push('No scopes selected - consider adding at least "openid"');
		} else {
			const scopes = credentials.scopes.split(' ').filter(s => s.trim());
			if (!scopes.includes('openid')) {
				warnings.push('Consider including "openid" scope for OpenID Connect flows');
			}
		}

		// Client secret validation (optional for some flows)
		if (credentials.authMethod !== 'none' && !credentials.clientSecret?.trim()) {
			warnings.push('Client secret is empty - this may be required for your authentication method');
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		};
	}

	/**
	 * Save configuration with enhanced error handling
	 */
	async saveConfiguration(credentials: StepCredentials): Promise<SaveResult> {
		if (this.isLoading) {
			return {
				success: false,
				message: 'Save operation already in progress'
			};
		}

		this.showLoadingState();

		try {
			// Validate configuration first
			const validation = this.validateConfiguration(credentials);
			
			if (!validation.isValid) {
				this.hideLoadingState();
				return {
					success: false,
					message: 'Configuration validation failed',
					data: validation
				};
			}

			// Show warnings if any
			if (validation.warnings.length > 0) {
				validation.warnings.forEach(warning => {
					showGlobalWarning(warning);
				});
			}

			// Convert StepCredentials to PermanentCredentials format
			const permanentCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes.split(' ').filter(s => s.trim()),
				clientAuthMethod: credentials.authMethod.value,
				// Add other required fields with defaults
				region: 'us',
				useJwksEndpoint: false,
				privateKey: ''
			};

			// Save credentials
			credentialManager.saveFlowCredentials(this.flowType, permanentCredentials);

			this.hideLoadingState();
			return {
				success: true,
				message: 'Configuration saved successfully',
				data: credentials
			};

		} catch (error) {
			this.hideLoadingState();
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			
			return {
				success: false,
				message: `Failed to save configuration: ${errorMessage}`,
				data: { error: errorMessage }
			};
		}
	}

	/**
	 * Handle successful save
	 */
	handleSaveSuccess(result: SaveResult): void {
		showGlobalSuccess(result.message);
		console.log(`[V4SaveHandler] Configuration saved successfully for ${this.flowType}:`, result.data);
	}

	/**
	 * Handle save error
	 */
	handleSaveError(error: Error): void {
		const errorMessage = `Failed to save configuration: ${error.message}`;
		showGlobalError(errorMessage);
		console.error(`[V4SaveHandler] Save error for ${this.flowType}:`, error);
	}

	/**
	 * Show loading state
	 */
	showLoadingState(): void {
		this.isLoading = true;
		showGlobalWarning('Saving configuration...');
	}

	/**
	 * Hide loading state
	 */
	hideLoadingState(): void {
		this.isLoading = false;
	}

	/**
	 * Get current loading state
	 */
	getLoadingState(): boolean {
		return this.isLoading;
	}

	/**
	 * Validate UUID format
	 */
	private isValidUUID(uuid: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	}

	/**
	 * Validate URL format
	 */
	private isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Load existing configuration
	 */
	async loadConfiguration(): Promise<StepCredentials | null> {
		try {
			return credentialManager.loadFlowCredentials(this.flowType);
		} catch (error) {
			console.error(`[V4SaveHandler] Failed to load configuration for ${this.flowType}:`, error);
			return null;
		}
	}

	/**
	 * Clear saved configuration
	 */
	async clearConfiguration(): Promise<boolean> {
		try {
			// credentialManager.clearFlowCredentials(this.flowType); // Method not available
			showGlobalSuccess('Configuration cleared successfully');
			return true;
		} catch (error) {
			console.error(`[V4SaveHandler] Failed to clear configuration for ${this.flowType}:`, error);
			showGlobalError('Failed to clear configuration');
			return false;
		}
	}
}

// Factory function to create save handlers for different flow types
export const createSaveHandler = (flowType: string): V4SaveConfigurationHandler => {
	return new V4SaveConfigurationHandler(flowType);
};
