// src/services/displayParameterService.tsx
// Service wrapper for Display Parameter - Makes it easy to integrate into any flow
import React from 'react';
import DisplayParameterSelector, { DisplayMode } from '../components/DisplayParameterSelector';

export { DisplayMode };
export type { DisplayMode as DisplayModeType };

/**
 * Display Parameter Service
 *
 * Provides a service layer for the OIDC display parameter.
 * The display parameter specifies how the Authorization Server should
 * present the authentication UI to the end-user.
 *
 * **OIDC Core 1.0 Section 3.1.2.1**
 *
 * @applicability OIDC flows only (Authorization Code, Implicit, Hybrid)
 * @notApplicable OAuth-only flows, Device flows (no redirect UI)
 */
export class DisplayParameterService {
	/**
	 * Get the display parameter selector component
	 */
	static getSelector(props: {
		value: DisplayMode;
		onChange: (value: DisplayMode) => void;
		disabled?: boolean;
	}): React.ReactElement {
		return <DisplayParameterSelector {...props} />;
	}

	/**
	 * Validate display mode value
	 */
	static isValidDisplayMode(value: string): value is DisplayMode {
		return ['page', 'popup', 'touch', 'wap'].includes(value);
	}

	/**
	 * Get default display mode
	 */
	static getDefaultMode(): DisplayMode {
		return 'page';
	}

	/**
	 * Determine if display parameter should be shown for a flow type
	 */
	static shouldShowForFlow(flowType: string): boolean {
		// Only show for OIDC flows with browser redirects
		const oidcFlows = ['oidc-authorization-code', 'oidc-implicit', 'oidc-hybrid'];

		return oidcFlows.some((flow) => flowType.includes(flow));
	}

	/**
	 * Add display parameter to URL if not default
	 */
	static addToParams(params: URLSearchParams, displayMode: DisplayMode): void {
		if (displayMode && displayMode !== 'page') {
			params.set('display', displayMode);
		}
	}
}

export default DisplayParameterService;
