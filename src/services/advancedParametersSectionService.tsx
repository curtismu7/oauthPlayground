// src/services/advancedParametersSectionService.tsx
import React from 'react';
import { AdvancedParametersSection } from '../components/AdvancedParametersSection';
import { ClaimsRequestStructure } from '../components/ClaimsRequestBuilder';

/**
 * Advanced Parameters Section Service
 * Provides a centralized way to add advanced OAuth/OIDC parameters section to flows
 * Replaces the old AdvancedParametersNavigation component (which redirected to a separate page)
 * 
 * NOTE: This is different from advancedParametersService.ts which enhances authorization URLs
 */

export interface AdvancedParametersConfig {
	flowType: string;
	onClaimsChange?: (claims: ClaimsRequestStructure | null) => void;
	onResourcesChange?: (resources: string[]) => void;
	onPromptChange?: (prompts: string[]) => void;
	onDisplayChange?: (display: string) => void;
	onAudienceChange?: (audience: string) => void;
	initialClaims?: ClaimsRequestStructure | null;
	initialResources?: string[];
	initialPrompts?: string[];
	initialDisplay?: string;
	initialAudience?: string;
	defaultCollapsed?: boolean;
}

class AdvancedParametersSectionServiceClass {
	/**
	 * Get the Advanced Parameters section for a flow
	 * This is a collapsible section that contains all advanced OAuth/OIDC parameters
	 * 
	 * @param config - Configuration for the advanced parameters section
	 * @returns JSX element containing the advanced parameters section
	 * 
	 * @example
	 * ```tsx
	 * {AdvancedParametersService.getSection({
	 *   flowType: 'oauth-authorization-code',
	 *   defaultCollapsed: true
	 * })}
	 * ```
	 */
	getSection(config: AdvancedParametersConfig): JSX.Element {
		return (
			<AdvancedParametersSection
				flowType={config.flowType}
				onClaimsChange={config.onClaimsChange}
				onResourcesChange={config.onResourcesChange}
				onPromptChange={config.onPromptChange}
				onDisplayChange={config.onDisplayChange}
				onAudienceChange={config.onAudienceChange}
				initialClaims={config.initialClaims}
				initialResources={config.initialResources}
				initialPrompts={config.initialPrompts}
				initialDisplay={config.initialDisplay}
				initialAudience={config.initialAudience}
				defaultCollapsed={config.defaultCollapsed ?? true}
			/>
		);
	}

	/**
	 * Simplified version with just flow type
	 * Useful for flows that don't need to handle advanced parameters in their state
	 * 
	 * @param flowType - The flow type (e.g., 'oauth-authorization-code', 'oidc-authorization-code')
	 * @param defaultCollapsed - Whether the section starts collapsed (default: true)
	 * @returns JSX element containing the advanced parameters section
	 * 
	 * @example
	 * ```tsx
	 * {AdvancedParametersService.getSimpleSection('oauth-authorization-code')}
	 * ```
	 */
	getSimpleSection(flowType: string, defaultCollapsed: boolean = true): JSX.Element {
		return this.getSection({
			flowType,
			defaultCollapsed
		});
	}
}

// Create singleton instance
const AdvancedParametersSectionServiceInstance = new AdvancedParametersSectionServiceClass();

// Export as named export
export const AdvancedParametersSectionService = AdvancedParametersSectionServiceInstance;

// Default export for convenience  
export default AdvancedParametersSectionServiceInstance;

