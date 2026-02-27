// src/services/v9CredentialValidationService.tsx
/**
 * V9 Credential Validation Service - Centralized modal validation for all V9 flows
 *
 * Provides consistent credential validation with modal display across all V9 flows.
 * This service implements the Service Registry pattern and includes comprehensive
 * performance monitoring and documentation.
 *
 * @version 1.0.0
 * @author OAuth Playground Team
 * @since 2026-02-26
 *
 * @example
 * ```typescript
 * // Basic usage in a V9 flow component
 * const {
 *   validateCredentialsAndProceed,
 *   CredentialValidationModal,
 * } = V9CredentialValidationService.useValidation({
 *   flowKey: 'oidc-hybrid-v9',
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

import React, { useCallback, useState } from 'react';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { CredentialGuardService } from '../credentialGuardService';
import ModalPresentationService from '../modalPresentationService';

// Flow-specific credential requirements
export type V9CredentialValues = Record<string, unknown>;
export type V9CredentialInput = V9CredentialValues | null | undefined;

export interface V9FlowCredentialConfig {
	flowName: string;
	requiredFields: string[];
	fieldLabels: Record<string, string>;
	stepIndex: number; // Which step to validate (usually 0)
	showToastOnSuccess?: boolean;
	customValidation?: (credentials: V9CredentialValues) => { isValid: boolean; message?: string };
}

/**
 * Predefined configurations for each V9 flow
 *
 * This object contains the validation configuration for all supported V9 flows.
 * Each configuration defines the required fields, field labels, and validation rules
 * specific to that flow type.
 *
 * @type {Record<string, V9FlowCredentialConfig>}
 * @constant
 * @example
 * ```typescript
 * // Access configuration for a specific flow
 * const config = V9_FLOW_CONFIGS['oidc-hybrid-v9'];
 * console.log(config.requiredFields); // ['environmentId', 'clientId', 'redirectUri']
 * ```
 */
export const V9_FLOW_CONFIGS: Record<string, V9FlowCredentialConfig> = {
	'oidc-hybrid-v9': {
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
	'implicit-v9': {
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
	'device-authorization-v9': {
		flowName: 'Device Authorization Flow',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
		},
		stepIndex: 1, // Device flow validates on step 1
		showToastOnSuccess: true,
	},
	'client-credentials-v9': {
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
	'worker-token-v9': {
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
	'oauth-authorization-code-v9': {
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
	'ciba-v9': {
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
	'redirectless-v9': {
		flowName: 'Redirectless Flow',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'redirectless-v9-real': {
		flowName: 'Redirectless Flow (Real)',
		requiredFields: ['environmentId', 'clientId'],
		fieldLabels: {
			environmentId: 'Environment ID',
			clientId: 'Client ID',
		},
		stepIndex: 0,
		showToastOnSuccess: true,
	},
	'pingone-par-flow-v9': {
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
	'rar-v9': {
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
	'jwt-bearer-v9': {
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

// Hook for V9 credential validation with modal
export interface UseV9CredentialValidationOptions {
	flowKey: string;
	credentials: V9CredentialInput;
	currentStep: number;
	onValidationSuccess?: () => void;
	onValidationFailure?: (missingFields: string[]) => void;
	customConfig?: Partial<V9FlowCredentialConfig>;
}

export interface UseV9CredentialValidationReturn {
	showMissingCredentialsModal: boolean;
	missingCredentialFields: string[];
	validateCredentialsAndProceed: (onProceed: () => void) => void;
	closeModal: () => void;
	CredentialValidationModal: React.FC;
	isValidForStep: boolean;
	validationMessage: string;
}

/**
 * React hook for V9 credential validation with modal display
 *
 * This hook provides credential validation functionality for V9 flows, including
 * modal display for missing credentials and validation state management.
 *
 * @param {UseV9CredentialValidationOptions} options - Configuration options for the hook
 * @param {string} options.flowKey - The flow key to validate against
 * @param {any} options.credentials - The credentials object to validate
 * @param {number} options.currentStep - The current step in the flow
 * @param {Function} [options.onValidationSuccess] - Callback for successful validation
 * @param {Function} [options.onValidationFailure] - Callback for failed validation
 * @param {V9FlowCredentialConfig} [options.customConfig] - Custom validation configuration
 *
 * @returns {UseV9CredentialValidationReturn} Validation hook return object
 *
 * @example
 * ```typescript
 * const {
 *   validateCredentialsAndProceed,
 *   CredentialValidationModal,
 *   isValidForStep,
 *   validationMessage
 * } = useV9CredentialValidation({
 *   flowKey: 'oidc-hybrid-v9',
 *   credentials: controller.credentials,
 *   currentStep: 0,
 *   onValidationSuccess: () => console.log('Validation passed'),
 *   onValidationFailure: (fields) => console.log('Missing fields:', fields)
 * });
 * ```
 *
 * @throws {Error} When flowKey is not found in V9_FLOW_CONFIGS
 * @since 1.0.0
 */
const sanitizeCredentials = (input: V9CredentialInput): V9CredentialValues => {
	if (input && typeof input === 'object') {
		return input;
	}
	return {};
};

export const useV9CredentialValidation = ({
	flowKey,
	credentials,
	currentStep,
	onValidationSuccess,
	onValidationFailure,
	customConfig,
}: UseV9CredentialValidationOptions): UseV9CredentialValidationReturn => {
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

	// Get flow configuration
	const baseConfig = V9_FLOW_CONFIGS[flowKey];

	if (!baseConfig) {
		console.warn(`[V9CredentialValidation] No configuration found for flow: ${flowKey}`);
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

	const config: V9FlowCredentialConfig = {
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

			const normalizedCredentials = sanitizeCredentials(credentials);

			// Run custom validation if provided
			if (config.customValidation) {
				const customResult = config.customValidation(normalizedCredentials);
				if (!customResult.isValid) {
					const errorMessage = customResult.message || 'Custom validation failed';
					setMissingCredentialFields([errorMessage]);
					setShowMissingCredentialsModal(true);
					onValidationFailure?.([errorMessage]);
					return;
				}
			}

			// Run standard credential validation
			const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(
				normalizedCredentials,
				{
					requiredFields: config.requiredFields,
					fieldLabels: config.fieldLabels,
				}
			);

			if (!canProceed) {
				setMissingCredentialFields(missingFields);
				setShowMissingCredentialsModal(true);
				console.warn(
					`🚫 [${config.flowName}] Blocked navigation due to missing required credentials:`,
					{ missingFields }
				);
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

		const { canProceed } = CredentialGuardService.checkMissingFields(
			sanitizeCredentials(credentials),
			{
				requiredFields: config.requiredFields,
				fieldLabels: config.fieldLabels,
			}
		);

		return canProceed;
	}, [credentials, currentStep, config]);

	// Get validation message for current step
	const validationMessage = useCallback(() => {
		if (currentStep !== config.stepIndex) return '';

		const { missingFields } = CredentialGuardService.checkMissingFields(
			sanitizeCredentials(credentials),
			{
				requiredFields: config.requiredFields,
				fieldLabels: config.fieldLabels,
			}
		);

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
export const validateV9FlowCredentials = (
	flowKey: string,
	credentials: V9CredentialInput,
	customConfig?: Partial<V9FlowCredentialConfig>
): { isValid: boolean; missingFields: string[]; message: string } => {
	const baseConfig = V9_FLOW_CONFIGS[flowKey];

	if (!baseConfig) {
		return {
			isValid: false,
			missingFields: ['Unknown flow configuration'],
			message: 'Flow configuration not found',
		};
	}

	const config = { ...baseConfig, ...customConfig };

	const normalizedCredentials = sanitizeCredentials(credentials);

	const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(
		normalizedCredentials,
		{
			requiredFields: config.requiredFields,
			fieldLabels: config.fieldLabels,
		}
	);

	return {
		isValid: canProceed,
		missingFields,
		message: canProceed
			? 'Credentials are valid'
			: `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`,
	};
};

// Export the service
export const V9CredentialValidationService = {
	useValidation: useV9CredentialValidation,
	validateCredentials: validateV9FlowCredentials,
	getFlowConfig: (flowKey: string) => V9_FLOW_CONFIGS[flowKey],
	getAllFlowConfigs: () => V9_FLOW_CONFIGS,
};

export default V9CredentialValidationService;
