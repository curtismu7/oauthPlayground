/**
 * @file flowTypeManager.ts
 * @module v8u/utils
 * @description Simplified flow type management utilities
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This module provides simplified utilities for managing flow type and spec version
 * compatibility, reducing complexity in the main UnifiedOAuthFlowV8U component.
 */

import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';

import { UnifiedFlowIntegrationV8U } from '../services/unifiedFlowIntegrationV8U';

const _MODULE_TAG = '[🔄 FLOW-TYPE-MANAGER-V8U]';

export interface FlowTypeCompatibility {
	isCompatible: boolean;
	compatibleSpecVersion?: SpecVersion;
	fallbackFlowType?: FlowType;
}

/**
 * Check if a flow type is compatible with a spec version
 * @param flowType - Flow type to check
 * @param specVersion - Spec version to check against
 * @returns Compatibility information
 */
export function checkFlowTypeCompatibility(
	flowType: FlowType,
	specVersion: SpecVersion
): FlowTypeCompatibility {
	const availableFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
	const isCompatible = availableFlows.includes(flowType);

	if (isCompatible) {
		return { isCompatible: true };
	}

	// Find a compatible spec version
	const allSpecVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
	const compatibleSpecVersion = allSpecVersions.find((spec) => {
		const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(spec);
		return flows.includes(flowType);
	});

	// Find a fallback flow type for the current spec version
	const fallbackFlowType = availableFlows[0] || 'oauth-authz';

	return {
		isCompatible: false,
		compatibleSpecVersion,
		fallbackFlowType,
	};
}

/**
 * Get the effective flow type for a spec version
 * If the requested flow is not available, returns a fallback
 * @param requestedFlowType - The flow type requested
 * @param specVersion - The current spec version
 * @returns The effective flow type (either requested or fallback)
 */
export function getEffectiveFlowType(
	requestedFlowType: FlowType,
	specVersion: SpecVersion
): FlowType {
	const compatibility = checkFlowTypeCompatibility(requestedFlowType, specVersion);

	if (compatibility.isCompatible) {
		return requestedFlowType;
	}

	logger.warn(`Flow type not available, using fallback`, {
		requested: requestedFlowType,
		specVersion,
		fallback: compatibility.fallbackFlowType,
	});

	return compatibility.fallbackFlowType || 'oauth-authz';
}

/**
 * Find a compatible spec version for a flow type
 * @param flowType - Flow type to find compatible spec for
 * @returns Compatible spec version, or undefined if none found
 */
export function findCompatibleSpecVersion(flowType: FlowType): SpecVersion | undefined {
	const allSpecVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
	return allSpecVersions.find((spec) => {
		const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(spec);
		return flows.includes(flowType);
	});
}

/**
 * Validate flow type and spec version combination
 * @param flowType - Flow type to validate
 * @param specVersion - Spec version to validate
 * @returns Validation result with suggestions
 */
export function validateFlowTypeSpecCombination(
	flowType: FlowType,
	specVersion: SpecVersion
): {
	valid: boolean;
	suggestedSpecVersion?: SpecVersion;
	suggestedFlowType?: FlowType;
	reason?: string;
} {
	const compatibility = checkFlowTypeCompatibility(flowType, specVersion);

	if (compatibility.isCompatible) {
		return { valid: true };
	}

	// Provide suggestions
	const suggestions: {
		suggestedSpecVersion?: SpecVersion;
		suggestedFlowType?: FlowType;
		reason?: string;
	} = {};

	if (compatibility.compatibleSpecVersion) {
		suggestions.suggestedSpecVersion = compatibility.compatibleSpecVersion;
		suggestions.reason = `${flowType} is not available in ${specVersion}. Consider switching to ${compatibility.compatibleSpecVersion}.`;
	} else if (compatibility.fallbackFlowType) {
		suggestions.suggestedFlowType = compatibility.fallbackFlowType;
		suggestions.reason = `${flowType} is not available in ${specVersion}. Consider using ${compatibility.fallbackFlowType} instead.`;
	} else {
		suggestions.reason = `${flowType} is not available in ${specVersion} and no alternatives found.`;
	}

	return {
		valid: false,
		...suggestions,
	};
}

/**
 * Get all available flow types for a spec version with labels
 * @param specVersion - Spec version
 * @returns Array of flow types with labels
 */
export function getAvailableFlowsWithLabels(specVersion: SpecVersion): Array<{
	type: FlowType;
	label: string;
}> {
	const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
	return flows.map((flowType) => ({
		type: flowType,
		label: SpecVersionServiceV8.getFlowLabel(flowType),
	}));
}

export default {
	checkFlowTypeCompatibility,
	getEffectiveFlowType,
	findCompatibleSpecVersion,
	validateFlowTypeSpecCombination,
	getAvailableFlowsWithLabels,
};
