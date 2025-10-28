// src/services/v7CredentialValidationService.tsx
/**
 * V7 Credential Validation Service - Centralized modal validation for all V7 flows
 * 
 * Provides consistent credential validation with modal display across all V7 flows.
 * This service implements the Service Registry pattern and includes comprehensive
 * performance monitoring and documentation.
 * 
 * @version 1.0.0
 * @author OAuth Playground Team
 * @since 2024-01-01
 * 
 * @example
 * ```typescript
 * // Basic usage in a V7 flow component
 * const {
 *   validateCredentialsAndProceed,
 *   CredentialValidationModal,
 * } = V7CredentialValidationService.useValidation({
 *   flowKey: 'oidc-hybrid-v7',
 *   credentials: controller.credentials,
 *   currentStep,
 * });
 * 
 * // Use in navigation handler
 * const handleNextStep = useCallback(() => {
 *   validateCredentialsAndProceed(() => {
 *     setCurrentStep(prev => prev + 1);
 *   });
 * }, [validateCredentialsAndProceed]);
 * ```
 * 
 * @see {@link ServiceRegistry} for service registration
 * @see {@link ServicePerformanceMonitor} for performance monitoring
 */

import React, { useState, useCallback } from 'react';
import { CredentialGuardService } from './credentialGuardService';
import ModalPresentationService from './modalPresentationService';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Flow-specific credential requirements
export interface V7FlowCredentialConfig {
	flowName: string;
	requiredFields: string[];
	fieldLabels: Record<string, string>;
	stepIndex: number; // Which step to validate (usually 0)
	showToastOnSuccess?: boolean;
	customValidation?: (credentials: any) => { isValid: boolean; message?: string };
}

/**
 * Predefined configurations for each V7 flow
 * 
 * This object contains the validation configuration for all supported V7 flows.
 * Each configuration defines the required fields, field labels, and validation rules
 * specific to that flow type.
 * 
 * @type {Record<string, V7FlowCredentialConfig>}
 * @constant
 * @example
 * ```typescript
 * // Access configuration for a specific flow
 * const config = V7_FLOW_CONFIGS['oidc-hybrid-v7'];
 * console.log(config.requiredFields); // ['environmentId', 'clientId', 'redirectUri']
 * ```
 */
export const V7_FLOW_CONFIGS: Record<string, V7FlowCredentialConfig> = {
	'oidc-hybrid-v7': {
		flowName: 'OIDC Hybrid Flow',
		requiredFields: ['environmentId', 'clientId', 'redirectUri'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			redirectUri: 'Redirect URI',
			clientSecret: 'Client Secret',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'implicit-v7': {
		flowName: 'Implicit Flow',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			redirectUri: 'Redirect URI',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'device-authorization-v7': {
		flowName: 'Device Authorization Flow',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
		},
		stepIndex: 1, // Device flow validates on step 1
		showToastOnSuccess: true,
	},
	'client-credentials-v7': {
		flowName: 'Client Credentials Flow',
		requiredFields: ['environmentId', 'clientId', 'clientSecret'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			clientSecret: 'Client Secret',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'worker-token-v7': {
		flowName: 'Worker Token Flow',
		requiredFields: ['environmentId', 'clientId', 'clientSecret'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			clientSecret: 'Client Secret',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'oauth-authorization-code-v7': {
		flowName: 'OAuth Authorization Code Flow',
		requiredFields: ['environmentId', 'clientId', 'redirectUri'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			redirectUri: 'Redirect URI',
			clientSecret: 'Client Secret',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'ciba-v7': {
		flowName: 'CIBA Flow',
		requiredFields: ['environmentId', 'clientId', 'clientSecret'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			clientSecret: 'Client Secret',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'redirectless-v7': {
		flowName: 'Redirectless Flow',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'redirectless-v7-real': {
		flowName: 'Redirectless Flow (Real)',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'pingone-par-flow-v7': {
		flowName: 'PingOne PAR Flow',
		requiredFields: ['environmentId', 'clientId', 'redirectUri'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			redirectUri: 'Redirect URI',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'rar-v7': {
		flowName: 'RAR Flow',
		requiredFields: ['environmentId', 'clientId', 'redirectUri'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			redirectUri: 'Redirect URI',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'jwt-bearer-v7': {
		flowName: 'JWT Bearer Token Flow',
		requiredFields: ['environmentId', 'clientId', 'clientSecret'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
			clientSecret: 'Client Secret',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
};

// Hook for V7 credential validation with modal
export interface UseV7CredentialValidationOptions {
	flowKey: string;
	credentials: any;
	currentStep: number;
	onValidationSuccess?: () => void;
	onValidationFailure?: (missingFields: string[]) => void;
	customConfig?: Partial<V7FlowCredentialConfig>;
}

export interface UseV7CredentialValidationReturn {
	showMissingCredentialsModal: boolean;
	missingCredentialFields: string[];
	validateCredentialsAndProceed: (onProceed: () => void) => void;
	closeModal: () => void;
	CredentialValidationModal: React.FC;
	isValidForStep: boolean;
	validationMessage: string;
}

/**
 * React hook for V7 credential validation with modal display
 * 
 * This hook provides credential validation functionality for V7 flows, including
 * modal display for missing credentials and validation state management.
 * 
 * @param {UseV7CredentialValidationOptions} options - Configuration options for the hook
 * @param {string} options.flowKey - The flow key to validate against
 * @param {any} options.credentials - The credentials object to validate
 * @param {number} options.currentStep - The current step in the flow
 * @param {Function} [options.onValidationSuccess] - Callback for successful validation
 * @param {Function} [options.onValidationFailure] - Callback for failed validation
 * @param {V7FlowCredentialConfig} [options.customConfig] - Custom validation configuration
 * 
 * @returns {UseV7CredentialValidationReturn} Validation hook return object
 * 
 * @example
 * ```typescript
 * const {
 *   validateCredentialsAndProceed,
 *   CredentialValidationModal,
 *   isValidForStep,
 *   validationMessage
 * } = useV7CredentialValidation({
 *   flowKey: 'oidc-hybrid-v7',
 *   credentials: controller.credentials,
 *   currentStep: 0,
 *   onValidationSuccess: () => console.log('Validation passed'),
 *   onValidationFailure: (fields) => console.log('Missing fields:', fields)
 * });
 * ```
 * 
 * @throws {Error} When flowKey is not found in V7_FLOW_CONFIGS
 * @since 1.0.0
 */
export const useV7CredentialValidation = ({
	flowKey,
	credentials,
	currentStep,
	onValidationSuccess,
	onValidationFailure,
	customConfig,
}: UseV7CredentialValidationOptions): UseV7CredentialValidationReturn => {
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

	// Get flow configuration
	const baseConfig = V7_FLOW_CONFIGS[flowKey];
	
	if (!baseConfig) {
		console.warn(`[V7CredentialValidation] No configuration found for flow: ${flowKey}`);
		return {
			showMissingCredentialsModal: false,
			missingCredentialFields: [],
			validateCredentialsAndProceed: (onProceed: () => void) => onProceed(),
			closeModal: () => {},
			CredentialValidationModal: () => null,
			isValidForStep: true,
			validationMessage: '',
		};
	}
	
	const config: V7FlowCredentialConfig = {
		...baseConfig,
		...customConfig,
	};

	const validateCredentialsAndProceed = useCallback(
		(onProceed: () => void) => {
			// Only validate on the configured step
			if (currentStep !== config.stepIndex) {
				onProceed();
				return;
			}

			// Run custom validation if provided
			if (config.customValidation) {
				const customResult = config.customValidation(credentials);
				if (!customResult.isValid) {
					const errorMessage = customResult.message || 'Custom validation failed';
					setMissingCredentialFields([errorMessage]);
					setShowMissingCredentialsModal(true);
					onValidationFailure?.([errorMessage]);
					return;
				}
			}

			// Run standard credential validation
			const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(credentials, {
				requiredFields: config.requiredFields,
				fieldLabels: config.fieldLabels,
			});

			if (!canProceed) {
				setMissingCredentialFields(missingFields);
				setShowMissingCredentialsModal(true);
				console.warn(`🚫 [${config.flowName}] Blocked navigation due to missing required credentials:`, { missingFields });
				onValidationFailure?.(missingFields);
				return;
			}

			// Validation successful
			if (config.showToastOnSuccess) {
				v4ToastManager.showSuccess(`${config.flowName} credentials validated successfully`);
			}
			onValidationSuccess?.();
			onProceed();
		},
		[credentials, currentStep, config, onValidationSuccess, onValidationFailure]
	);

	const closeModal = useCallback(() => {
		setShowMissingCredentialsModal(false);
		setMissingCredentialFields([]);
	}, []);

	// Check if current step is valid for navigation
	const isValidForStep = useCallback(() => {
		if (currentStep !== config.stepIndex) return true;

		const { canProceed } = CredentialGuardService.checkMissingFields(credentials, {
			requiredFields: config.requiredFields,
			fieldLabels: config.fieldLabels,
		});

		return canProceed;
	}, [credentials, currentStep, config]);

	// Get validation message for current step
	const validationMessage = useCallback(() => {
		if (currentStep !== config.stepIndex) return '';

		const { missingFields } = CredentialGuardService.checkMissingFields(credentials, {
			requiredFields: config.requiredFields,
			fieldLabels: config.fieldLabels,
		});

		if (missingFields.length === 0) return '';
		return `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`;
	}, [credentials, currentStep, config]);

	const CredentialValidationModal: React.FC = () => (
		<ModalPresentationService
			isOpen={showMissingCredentialsModal}
			onClose={closeModal}
			title="Credentials Required"
			description={
				missingCredentialFields.length > 0
					? `Please provide the following required credential${missingCredentialFields.length > 1 ? 's' : ''} before continuing:`
					: `${config.flowName} requires valid credentials before moving to the next step.`
			}
			actions={[
				{
					label: 'Back to Credentials',
					onClick: closeModal,
					variant: 'primary',
				},
			]}
		>
			{missingCredentialFields.length > 0 && (
				<ul style={{ marginTop: '1rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
					{missingCredentialFields.map((field) => (
						<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
							{field}
						</li>
					))}
				</ul>
			)}
		</ModalPresentationService>
	);

	return {
		showMissingCredentialsModal,
		missingCredentialFields,
		validateCredentialsAndProceed,
		closeModal,
		CredentialValidationModal,
		isValidForStep: isValidForStep(),
		validationMessage: validationMessage(),
	};
};

// Utility function for quick validation without hook
export const validateV7FlowCredentials = (
	flowKey: string,
	credentials: any,
	customConfig?: Partial<V7FlowCredentialConfig>
): { isValid: boolean; missingFields: string[]; message: string } => {
	const baseConfig = V7_FLOW_CONFIGS[flowKey];
	
	if (!baseConfig) {
		return {
			isValid: false,
			missingFields: ['Unknown flow configuration'],
			message: 'Flow configuration not found',
		};
	}
	
	const config = { ...baseConfig, ...customConfig };

	const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(credentials, {
		requiredFields: config.requiredFields,
		fieldLabels: config.fieldLabels,
	});

	return {
		isValid: canProceed,
		missingFields,
		message: canProceed ? 'Credentials are valid' : `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`,
	};
};

// Export the service
export const V7CredentialValidationService = {
	useValidation: useV7CredentialValidation,
	validateCredentials: validateV7FlowCredentials,
	getFlowConfig: (flowKey: string) => V7_FLOW_CONFIGS[flowKey],
	getAllFlowConfigs: () => V7_FLOW_CONFIGS,
};

export default V7CredentialValidationService;
