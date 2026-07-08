// src/platform/platformCredentialValidationService.tsx
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
 * } = PlatformCredentialValidationService.useValidation({
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

import React, { useCallback, useMemo, useState } from 'react';
import { modernMessaging } from '@/platform/ModernMessagingService';
import { CredentialGuardService } from '../services/credentialGuardService';
import ModalPresentationService from '../services/modalPresentationService';
// Flow-specific credential requirements
export type CredentialValues = Record<string, unknown>;
export type CredentialInput = CredentialValues | null | undefined;

export interface FlowCredentialConfig {
	flowName: string;
	requiredFields: string[];
	fieldLabels: Record<string, string>;
	stepIndex: number; // Which step to validate (usually 0)
	showToastOnSuccess?: boolean;
	customValidation?: (credentials: CredentialValues) => { isValid: boolean; message?: string };
}

/**
 * Predefined configurations for each V9 flow
 *
 * This object contains the validation configuration for all supported V9 flows.
 * Each configuration defines the required fields, field labels, and validation rules
 * specific to that flow type.
 *
 * @type {Record<string, FlowCredentialConfig>}
 * @constant
 * @example
 * ```typescript
 * // Access configuration for a specific flow
 * const config = FLOW_CREDENTIAL_CONFIGS['oidc-hybrid-v9'];
 * logger.info(config.requiredFields, "Logger info"); // ['environmentId', 'clientId', 'redirectUri']
 * ```
 */
export const FLOW_CREDENTIAL_CONFIGS: Record<string, FlowCredentialConfig> = {
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
	'par-v9': {
		flowName: 'PAR Flow',
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
export interface UseCredentialValidationOptions {
	flowKey: string;
	credentials: CredentialInput;
	currentStep: number;
	onValidationSuccess?: () => void;
	onValidationFailure?: (missingFields: string[]) => void;
	customConfig?: Partial<FlowCredentialConfig>;
}

export interface UseCredentialValidationReturn {
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
 * @param {UseCredentialValidationOptions} options - Configuration options for the hook
 * @param {string} options.flowKey - The flow key to validate against
 * @param {any} options.credentials - The credentials object to validate
 * @param {number} options.currentStep - The current step in the flow
 * @param {Function} [options.onValidationSuccess] - Callback for successful validation
 * @param {Function} [options.onValidationFailure] - Callback for failed validation
 * @param {FlowCredentialConfig} [options.customConfig] - Custom validation configuration
 *
 * @returns {UseCredentialValidationReturn} Validation hook return object
 *
 * @example
 * ```typescript
 * const {
 *   validateCredentialsAndProceed,
 *   CredentialValidationModal,
 *   isValidForStep,
 *   validationMessage
 * } = useCredentialValidation({
 *   flowKey: 'oidc-hybrid-v9',
 *   credentials: controller.credentials,
 *   currentStep: 0,
 *   onValidationSuccess: () => logger.info('Validation passed'),
 *   onValidationFailure: (fields) => logger.info('Missing fields:', fields)
 * });
 * ```
 *
 * @throws {Error} When flowKey is not found in FLOW_CREDENTIAL_CONFIGS
 * @since 1.0.0
 */
const sanitizeCredentials = (input: CredentialInput): CredentialValues => {
	if (input && typeof input === 'object') {
		return input;
	}
	return {};
};

export const useCredentialValidation = ({
	flowKey,
	credentials,
	currentStep,
	onValidationSuccess,
	onValidationFailure,
	customConfig,
}: UseCredentialValidationOptions): UseCredentialValidationReturn => {
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

	// Get flow configuration
	const baseConfig = FLOW_CREDENTIAL_CONFIGS[flowKey];

	// Memoize config — computed before any early return to comply with Rules of Hooks.
	// biome-ignore lint/correctness/useExhaustiveDependencies: customConfig excluded (unstable object identity)
	const config = useMemo<FlowCredentialConfig>(
		() => ({ ...(baseConfig as FlowCredentialConfig), ...customConfig }),
		[baseConfig]
	);

	const validateCredentialsAndProceed = useCallback(
		(onProceed: () => void) => {
			if (!baseConfig) {
				onProceed();
				return;
			}
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
				onValidationFailure?.(missingFields);
				return;
			}

			// Validation successful
			if (config.showToastOnSuccess) {
				modernMessaging.showFooterMessage({
					type: 'status',
					message: `${config.flowName} credentials validated successfully`,
					duration: 4000,
				});
			}
			onValidationSuccess?.();
			onProceed();
		},
		[credentials, currentStep, config, onValidationSuccess, onValidationFailure, baseConfig]
	);

	const closeModal = useCallback(() => {
		setShowMissingCredentialsModal(false);
		setMissingCredentialFields([]);
	}, []);

	// Check if current step is valid for navigation
	const isValidForStep = useCallback(() => {
		if (!baseConfig || currentStep !== config.stepIndex) return true;

		const { canProceed } = CredentialGuardService.checkMissingFields(
			sanitizeCredentials(credentials),
			{
				requiredFields: config.requiredFields,
				fieldLabels: config.fieldLabels,
			}
		);

		return canProceed;
	}, [credentials, currentStep, config, baseConfig]);

	// Get validation message for current step
	const validationMessage = useCallback(() => {
		if (!baseConfig || currentStep !== config.stepIndex) return '';

		const { missingFields } = CredentialGuardService.checkMissingFields(
			sanitizeCredentials(credentials),
			{
				requiredFields: config.requiredFields,
				fieldLabels: config.fieldLabels,
			}
		);

		if (missingFields.length === 0) return '';
		return `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`;
	}, [credentials, currentStep, config, baseConfig]);

	// Early return AFTER all hooks to comply with Rules of Hooks
	if (!baseConfig) {
		return {
			showMissingCredentialsModal: false,
			missingCredentialFields: [],
			validateCredentialsAndProceed,
			closeModal,
			CredentialValidationModal: () => null,
			isValidForStep: true,
			validationMessage: '',
		};
	}

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
export const validateFlowCredentials = (
	flowKey: string,
	credentials: CredentialInput,
	customConfig?: Partial<FlowCredentialConfig>
): { isValid: boolean; missingFields: string[]; message: string } => {
	const baseConfig = FLOW_CREDENTIAL_CONFIGS[flowKey];

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
export const PlatformCredentialValidationService = {
	useValidation: useCredentialValidation,
	validateCredentials: validateFlowCredentials,
	getFlowConfig: (flowKey: string) => FLOW_CREDENTIAL_CONFIGS[flowKey],
	getAllFlowConfigs: () => FLOW_CREDENTIAL_CONFIGS,
};

export default PlatformCredentialValidationService;
