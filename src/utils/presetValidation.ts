// src/utils/presetValidation.ts
// Validation utilities for configuration presets

import type {
	BuilderAppType,
	ConfigurationPreset,
	FormDataState,
} from '../services/presetManagerService';

export interface ValidationError {
	field: string;
	message: string;
	severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
}

/**
 * Validates a configuration preset for correctness and completeness
 */
export function validatePreset(preset: ConfigurationPreset): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	// Basic preset validation
	if (!preset.name?.trim()) {
		errors.push({
			field: 'name',
			message: 'Preset name is required',
			severity: 'error',
		});
	}

	if (!preset.description?.trim()) {
		warnings.push({
			field: 'description',
			message: 'Preset description is recommended for clarity',
			severity: 'warning',
		});
	}

	if (!preset.appType) {
		errors.push({
			field: 'appType',
			message: 'Application type is required',
			severity: 'error',
		});
	}

	// Configuration validation
	if (preset.configuration) {
		const configErrors = validateConfiguration(preset.configuration, preset.appType);
		errors.push(...configErrors.errors);
		warnings.push(...configErrors.warnings);
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validates a form configuration for a specific app type
 */
export function validateConfiguration(
	config: Partial<FormDataState>,
	appType: BuilderAppType
): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	// Grant type validation based on app type
	if (config.grantTypes) {
		const validGrantTypes = getValidGrantTypes(appType);
		const invalidGrants = config.grantTypes.filter((grant) => !validGrantTypes.includes(grant));

		if (invalidGrants.length > 0) {
			errors.push({
				field: 'grantTypes',
				message: `Invalid grant types for ${appType}: ${invalidGrants.join(', ')}`,
				severity: 'error',
			});
		}
	}

	// Response type validation
	if (config.responseTypes && appType !== 'WORKER' && appType !== 'SERVICE') {
		if (config.responseTypes.length === 0) {
			errors.push({
				field: 'responseTypes',
				message: 'At least one response type is required for interactive applications',
				severity: 'error',
			});
		}
	}

	// Redirect URI validation
	if (
		appType === 'OIDC_WEB_APP' ||
		appType === 'OIDC_NATIVE_APP' ||
		appType === 'SINGLE_PAGE_APP'
	) {
		if (!config.redirectUris || config.redirectUris.length === 0) {
			errors.push({
				field: 'redirectUris',
				message: 'At least one redirect URI is required for interactive applications',
				severity: 'error',
			});
		} else {
			// Validate redirect URI formats
			config.redirectUris.forEach((uri, index) => {
				if (!isValidRedirectUri(uri, appType)) {
					errors.push({
						field: `redirectUris[${index}]`,
						message: `Invalid redirect URI format: ${uri}`,
						severity: 'error',
					});
				}
			});
		}
	}

	// PKCE validation
	if (config.pkceEnforcement === 'REQUIRED' && appType === 'OIDC_WEB_APP') {
		warnings.push({
			field: 'pkceEnforcement',
			message: 'PKCE is recommended but not always required for web applications',
			severity: 'info',
		});
	}

	if (
		config.pkceEnforcement !== 'REQUIRED' &&
		(appType === 'SINGLE_PAGE_APP' || appType === 'OIDC_NATIVE_APP')
	) {
		errors.push({
			field: 'pkceEnforcement',
			message: 'PKCE should be required for SPAs and native applications',
			severity: 'error',
		});
	}

	// Token endpoint auth method validation
	if (config.tokenEndpointAuthMethod) {
		const validAuthMethods = getValidAuthMethods(appType);
		if (!validAuthMethods.includes(config.tokenEndpointAuthMethod)) {
			errors.push({
				field: 'tokenEndpointAuthMethod',
				message: `Invalid auth method ${config.tokenEndpointAuthMethod} for ${appType}`,
				severity: 'error',
			});
		}
	}

	// Token validity validation
	if (config.accessTokenValiditySeconds && config.accessTokenValiditySeconds < 300) {
		warnings.push({
			field: 'accessTokenValiditySeconds',
			message: 'Access token validity less than 5 minutes may cause usability issues',
			severity: 'warning',
		});
	}

	if (config.accessTokenValiditySeconds && config.accessTokenValiditySeconds > 86400) {
		warnings.push({
			field: 'accessTokenValiditySeconds',
			message: 'Access token validity greater than 24 hours may pose security risks',
			severity: 'warning',
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Gets valid grant types for a specific app type
 */
function getValidGrantTypes(appType: BuilderAppType): string[] {
	switch (appType) {
		case 'OIDC_WEB_APP':
			return ['authorization_code', 'implicit', 'refresh_token', 'client_credentials'];
		case 'OIDC_NATIVE_APP':
			return ['authorization_code', 'implicit', 'refresh_token'];
		case 'SINGLE_PAGE_APP':
			return ['authorization_code', 'implicit', 'refresh_token'];
		case 'WORKER':
			return ['client_credentials', 'authorization_code', 'implicit'];
		case 'SERVICE':
			return ['client_credentials', 'authorization_code'];
		default:
			return [];
	}
}

/**
 * Gets valid authentication methods for a specific app type
 */
function getValidAuthMethods(appType: BuilderAppType): string[] {
	switch (appType) {
		case 'OIDC_WEB_APP':
			return ['client_secret_basic', 'client_secret_post', 'none'];
		case 'OIDC_NATIVE_APP':
			return ['client_secret_basic', 'client_secret_post', 'none'];
		case 'SINGLE_PAGE_APP':
			return ['none'];
		case 'WORKER':
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		case 'SERVICE':
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		default:
			return [];
	}
}

/**
 * Validates redirect URI format for a specific app type
 */
function isValidRedirectUri(uri: string, appType: BuilderAppType): boolean {
	try {
		const url = new URL(uri);

		switch (appType) {
			case 'OIDC_WEB_APP':
				// Web apps should use HTTP/HTTPS
				return ['http:', 'https:'].includes(url.protocol);

			case 'OIDC_NATIVE_APP':
				// Native apps can use custom schemes or localhost
				return url.protocol !== 'javascript:' && url.protocol !== 'data:';

			case 'SINGLE_PAGE_APP':
				// SPAs should use HTTP/HTTPS
				return ['http:', 'https:'].includes(url.protocol);

			default:
				return true;
		}
	} catch {
		// If URL parsing fails, it's invalid
		return false;
	}
}

/**
 * Migrates old preset format to new format
 */
export function migratePreset(oldPreset: any): ConfigurationPreset | null {
	try {
		// Check if it's already in the new format
		if (oldPreset.id && oldPreset.metadata && oldPreset.configuration) {
			return oldPreset as ConfigurationPreset;
		}

		// Migrate from old format (if any legacy formats exist)
		const migrated: ConfigurationPreset = {
			id: oldPreset.id || `migrated-${Date.now()}`,
			name: oldPreset.name || 'Migrated Preset',
			description: oldPreset.description || 'Migrated from older format',
			category: oldPreset.category || 'custom',
			appType: oldPreset.appType || 'OIDC_WEB_APP',
			configuration: oldPreset.configuration || oldPreset,
			metadata: {
				createdAt: oldPreset.createdAt || new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				useCase: oldPreset.useCase || 'Migrated preset',
				securityLevel: oldPreset.securityLevel || 'basic',
				tags: oldPreset.tags || ['migrated'],
			},
		};

		return migrated;
	} catch (error) {
		console.error('[PresetValidation] Failed to migrate preset:', error);
		return null;
	}
}

/**
 * Sanitizes preset data to ensure it's safe for storage
 */
export function sanitizePreset(preset: ConfigurationPreset): ConfigurationPreset {
	return {
		...preset,
		name: preset.name?.trim() || 'Unnamed Preset',
		description: preset.description?.trim() || '',
		configuration: {
			...preset.configuration,
			// Ensure arrays are properly formatted
			redirectUris: Array.isArray(preset.configuration.redirectUris)
				? preset.configuration.redirectUris.filter((uri) => uri?.trim())
				: [],
			postLogoutRedirectUris: Array.isArray(preset.configuration.postLogoutRedirectUris)
				? preset.configuration.postLogoutRedirectUris.filter((uri) => uri?.trim())
				: [],
			grantTypes: Array.isArray(preset.configuration.grantTypes)
				? preset.configuration.grantTypes.filter((grant) => grant?.trim())
				: [],
			responseTypes: Array.isArray(preset.configuration.responseTypes)
				? preset.configuration.responseTypes.filter((type) => type?.trim())
				: [],
			scopes: Array.isArray(preset.configuration.scopes)
				? preset.configuration.scopes.filter((scope) => scope?.trim())
				: [],
			signoffUrls: Array.isArray(preset.configuration.signoffUrls)
				? preset.configuration.signoffUrls.filter((url) => url?.trim())
				: [],
		},
		metadata: {
			...preset.metadata,
			tags: Array.isArray(preset.metadata.tags)
				? preset.metadata.tags.filter((tag) => tag?.trim())
				: [],
		},
	};
}
