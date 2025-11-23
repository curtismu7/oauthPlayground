/**
 * @file unifiedFlowOptionsServiceV8.ts
 * @module v8/services
 * @description Unified flow options service that combines spec version awareness with flow options
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Get flow options for spec version + flow type combination
 * - Determine field visibility per spec/flow
 * - Determine checkbox availability per spec/flow
 * - Generate compliance warnings
 *
 * @example
 * const options = UnifiedFlowOptionsServiceV8.getOptionsForFlow('oauth2.1', 'oauth-authz');
 * const visibility = UnifiedFlowOptionsServiceV8.getFieldVisibility('oidc', 'hybrid');
 */

import { type FlowOptions, FlowOptionsServiceV8 } from './flowOptionsServiceV8';
import { type FlowType, type SpecVersion, SpecVersionServiceV8 } from './specVersionServiceV8';

const MODULE_TAG = '[🔗 UNIFIED-FLOW-OPTIONS-V8]';

export interface FieldVisibility {
	showEnvironmentId: boolean;
	showClientId: boolean;
	showClientSecret: boolean;
	showRedirectUri: boolean;
	showPostLogoutRedirectUri: boolean;
	showScopes: boolean;
	showLoginHint: boolean;
	showResponseType: boolean;
	showAuthMethod: boolean;
	showIdToken: boolean;
	showUserInfo: boolean;
	showDevicePathId: boolean;
	showDeviceVerificationUri: boolean;
}

export interface CheckboxAvailability {
	showPKCE: boolean;
	pkceRequired: boolean;
	showRefreshToken: boolean;
	showRedirectless: boolean;
	redirectlessAvailable: boolean;
}

export class UnifiedFlowOptionsServiceV8 {
	/**
	 * Get flow options for a spec version and flow type combination
	 * @param specVersion - Spec version (oauth2.0, oauth2.1, oidc)
	 * @param flowType - Flow type
	 * @returns Flow options with spec-aware modifications
	 */
	static getOptionsForFlow(specVersion: SpecVersion, flowType: FlowType): FlowOptions {
		console.log(`${MODULE_TAG} Getting options for flow`, { specVersion, flowType });

		// Get base flow options
		const baseOptions = FlowOptionsServiceV8.getOptionsForFlow(`${flowType}-v8`);

		// Apply spec-specific modifications
		if (specVersion === 'oauth2.1') {
			if (flowType === 'oauth-authz') {
				// OAuth 2.1 requires PKCE
				baseOptions.pkceEnforcement = 'REQUIRED';
			}
		}

		if (specVersion === 'oidc') {
			// OIDC always supports ID tokens and post-logout redirect
			// These will be handled in field visibility
		}

		return baseOptions;
	}

	/**
	 * Get field visibility for a spec version and flow type
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @returns Field visibility configuration
	 */
	static getFieldVisibility(specVersion: SpecVersion, flowType: FlowType): FieldVisibility {
		console.log(`${MODULE_TAG} Getting field visibility`, { specVersion, flowType });

		// Start with defaults
		const visibility: FieldVisibility = {
			showEnvironmentId: true,
			showClientId: true,
			showClientSecret: true,
			showRedirectUri: true,
			showPostLogoutRedirectUri: false,
			showScopes: true,
			showLoginHint: true,
			showResponseType: true,
			showAuthMethod: true,
			showIdToken: false,
			showUserInfo: false,
			showDevicePathId: false,
			showDeviceVerificationUri: false,
		};

		// Get flow options to determine base visibility
		const flowOptions = FlowOptionsServiceV8.getOptionsForFlow(`${flowType}-v8`);

		// Apply flow-specific visibility
		visibility.showClientSecret =
			flowOptions.requiresClientSecret || !flowOptions.requiresClientSecret;
		visibility.showRedirectUri = flowOptions.requiresRedirectUri;
		visibility.showResponseType = flowOptions.responseTypes.length > 0;
		visibility.showLoginHint = flowOptions.supportsLoginHint;
		visibility.showPostLogoutRedirectUri = flowOptions.supportsPostLogoutRedirectUri;

		// Device-specific fields
		if (flowType === 'device-code') {
			visibility.showDevicePathId = true;
			visibility.showDeviceVerificationUri = true;
		}

		// Apply spec-specific visibility
		if (specVersion === 'oidc') {
			visibility.showPostLogoutRedirectUri = true;
			visibility.showIdToken = true;
			visibility.showUserInfo = true;
			// OIDC requires openid scope
		}

		return visibility;
	}

	/**
	 * Get checkbox availability for a spec version and flow type
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @returns Checkbox availability configuration
	 */
	static getCheckboxAvailability(
		specVersion: SpecVersion,
		flowType: FlowType
	): CheckboxAvailability {
		console.log(`${MODULE_TAG} Getting checkbox availability`, { specVersion, flowType });

		const availability: CheckboxAvailability = {
			showPKCE: false,
			pkceRequired: false,
			showRefreshToken: false,
			showRedirectless: false,
			redirectlessAvailable: false,
		};

		const flowOptions = FlowOptionsServiceV8.getOptionsForFlow(`${flowType}-v8`);

		// PKCE checkbox
		if (flowType === 'oauth-authz' || flowType === 'hybrid') {
			availability.showPKCE = true;
			if (specVersion === 'oauth2.1' && flowType === 'oauth-authz') {
				availability.pkceRequired = true;
			}
		}

		// Refresh Token checkbox
		if (flowOptions.supportsRefreshToken) {
			availability.showRefreshToken = true;
		}

		// Redirectless checkbox - for flows that can work without redirect URI
		// Note: Device Code, Client Credentials, and ROPC flows inherently don't use redirects (not a "mode" option)
		// Redirectless mode is only relevant for Authorization Code flow where you can choose redirect vs redirectless
		// Implicit flow returns tokens in URL fragment, so it doesn't need redirectless mode
		if (flowType === 'oauth-authz') {
			availability.showRedirectless = true;
			availability.redirectlessAvailable = true;
		}

		return availability;
	}

	/**
	 * Get compliance errors (critical violations that block flow execution)
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @returns Array of error messages for critical violations
	 */
	static getComplianceErrors(specVersion: SpecVersion, flowType: FlowType): string[] {
		console.log(`${MODULE_TAG} Getting compliance errors`, { specVersion, flowType });

		const errors: string[] = [];

		// OAuth 2.1 critical violations (these should block execution)
		if (specVersion === 'oauth2.1') {
			if (flowType === 'implicit') {
				errors.push(
					'❌ CRITICAL: Implicit Flow is not allowed in OAuth 2.1. This flow violates OAuth 2.1 security requirements. Please use Authorization Code Flow with PKCE instead.'
				);
			}
			if (flowType === 'ropc') {
				errors.push(
					'❌ CRITICAL: Resource Owner Password Credentials is not allowed in OAuth 2.1. This flow violates OAuth 2.1 security requirements. Please use Authorization Code Flow instead.'
				);
			}
		}

		return errors;
	}

	/**
	 * Get compliance warnings for a spec version and flow type
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @returns Array of warning messages
	 */
	static getComplianceWarnings(specVersion: SpecVersion, flowType: FlowType): string[] {
		console.log(`${MODULE_TAG} Getting compliance warnings`, { specVersion, flowType });

		const warnings: string[] = [];

		// OIDC-specific warnings (non-critical)
		if (specVersion === 'oidc') {
			if (flowType === 'implicit') {
				warnings.push(
					'⚠️ Implicit Flow is not recommended for OIDC - use Authorization Code Flow or Hybrid Flow instead'
				);
			}
		}

		return warnings;
	}

	/**
	 * Get all available flows for a spec version with labels
	 * @param specVersion - Spec version
	 * @returns Array of available flows with labels
	 */
	static getAvailableFlowsWithLabels(
		specVersion: SpecVersion
	): Array<{ type: FlowType; label: string }> {
		const flows = SpecVersionServiceV8.getAvailableFlows(specVersion);
		return flows.map((flowType) => ({
			type: flowType,
			label: SpecVersionServiceV8.getFlowLabel(flowType),
		}));
	}

	/**
	 * Get all spec versions with labels
	 * @returns Array of spec versions with labels
	 */
	static getAllSpecVersionsWithLabels(): Array<{
		type: SpecVersion;
		label: string;
		description: string;
	}> {
		return SpecVersionServiceV8.getAllSpecVersions().map((specVersion) => ({
			type: specVersion,
			label: SpecVersionServiceV8.getSpecLabel(specVersion),
			description: SpecVersionServiceV8.getSpecDescription(specVersion),
		}));
	}
}

export default UnifiedFlowOptionsServiceV8;
