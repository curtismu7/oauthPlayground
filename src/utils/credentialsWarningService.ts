// src/utils/credentialsWarningService.ts
// Service to show warning toasts when flows start without credentials

import React from 'react';
import { v4ToastManager } from './v4ToastMessages';

export interface CredentialsCheck {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
}

export interface CredentialsWarningOptions {
	flowName: string;
	requiredFields?: string[];
	showToast?: boolean;
}

/**
 * Check if credentials are missing and show warning toast
 */
export function checkCredentialsAndWarn(
	credentials: CredentialsCheck | null | undefined,
	options: CredentialsWarningOptions
): boolean {
	const { flowName, requiredFields = ['environmentId', 'clientId'], showToast = true } = options;
	const normalizedCredentials = credentials ?? {};

	// Check if any required fields are missing
	const missingFields: string[] = [];

	requiredFields.forEach((field) => {
		const value = normalizedCredentials[field as keyof CredentialsCheck];
		if (!value || value.trim() === '') {
			missingFields.push(field);
		}
	});

	// If credentials are missing, show warning toast
	if (missingFields.length > 0 && showToast) {
		const missingFieldsText = missingFields
			.map((field) => field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'))
			.join(', ');

		v4ToastManager.showWarning(
			`⚠️ ${flowName}: Please fill in your credentials (${missingFieldsText}) to continue`
		);

		console.warn(`[CredentialsWarning] ${flowName} started without credentials:`, {
			missingFields,
			credentials: {
				hasEnvironmentId: !!normalizedCredentials.environmentId,
				hasClientId: !!normalizedCredentials.clientId,
				hasClientSecret: !!normalizedCredentials.clientSecret,
				hasRedirectUri: !!normalizedCredentials.redirectUri,
			},
		});

		return false; // Credentials are missing
	}

	return true; // Credentials are present
}

/**
 * Check credentials on flow mount and show warning if missing
 */
export function useCredentialsWarning(
	credentials: CredentialsCheck | null | undefined,
	flowName: string,
	requiredFields?: string[]
) {
	// Only show warning once per flow mount
	const hasShownWarning = React.useRef(false);

	React.useEffect(() => {
		if (!hasShownWarning.current) {
			const options: CredentialsWarningOptions = requiredFields
				? { flowName, requiredFields, showToast: true }
				: { flowName, showToast: true };
			checkCredentialsAndWarn(credentials, options);
			hasShownWarning.current = true;
		}
	}, [credentials, flowName, requiredFields]);
}

export default {
	checkCredentialsAndWarn,
	useCredentialsWarning,
};
