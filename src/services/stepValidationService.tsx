// src/services/stepValidationService.tsx
import React, { useCallback, useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface ValidationRule {
	field: string;
	value: string | number | boolean | null | undefined;
	required: boolean;
	label: string;
}

export interface StepValidationConfig {
	stepIndex: number;
	stepName: string;
	rules: ValidationRule[];
	onValidationPass?: () => void;
	onValidationFail?: (missingFields: string[]) => void;
}

export interface StepValidationProps {
	config: StepValidationConfig;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

// Validation Modal Component
export const StepValidationModal: React.FC<StepValidationProps> = ({
	config,
	isOpen,
	onClose,
	onConfirm,
}) => {
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	const validateStep = useCallback(() => {
		const missingFields: string[] = [];

		config.rules.forEach((rule) => {
			if (rule.required) {
				const value = rule.value;
				const isEmpty = !value || (typeof value === 'string' && !value.trim());
				if (isEmpty) {
					missingFields.push(rule.label);
				}
			}
		});

		return missingFields;
	}, [config.rules]);

	const handleValidation = useCallback(() => {
		const missingFields = validateStep();

		if (missingFields.length > 0) {
			// Show toast message
			v4ToastManager.showError(`Missing required fields: ${missingFields.join(', ')}`);

			// Set validation errors for modal
			setValidationErrors(missingFields);

			// Call validation fail callback
			config.onValidationFail?.(missingFields);

			return false; // Validation failed
		}

		// Call validation pass callback
		config.onValidationPass?.();
		return true; // Validation passed
	}, [validateStep, config]);

	const handleConfirm = useCallback(() => {
		const isValid = handleValidation();
		if (isValid) {
			onConfirm();
		}
		// If validation fails, stay on current step (modal closes but no navigation)
		onClose();
	}, [handleValidation, onConfirm, onClose]);

	return (
		<ConfirmationModal
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={handleConfirm}
			title={`${config.stepName} - Required Fields Missing`}
			message={
				validationErrors.length > 0
					? `The following required fields must be completed before proceeding:\n\n• ${validationErrors.join('\n• ')}\n\nPlease fill in these fields and try again.`
					: `Please complete all required fields for ${config.stepName}.`
			}
			confirmText="OK"
			variant="danger"
		/>
	);
};

// Hook for step validation
export const useStepValidation = () => {
	const [showValidationModal, setShowValidationModal] = useState(false);
	const [validationConfig, setValidationConfig] = useState<StepValidationConfig | null>(null);

	const validateAndProceed = useCallback((config: StepValidationConfig, onProceed: () => void) => {
		// Check if validation passes immediately
		const missingFields: string[] = [];

		config.rules.forEach((rule) => {
			if (rule.required) {
				const value = rule.value;
				const isEmpty = !value || (typeof value === 'string' && !value.trim());
				if (isEmpty) {
					missingFields.push(rule.label);
				}
			}
		});

		if (missingFields.length > 0) {
			// Show validation modal
			setValidationConfig({
				...config,
				onValidationPass: onProceed,
				onValidationFail: (errors) => {
					// User stays on current step
					console.log('Validation failed:', errors);
				},
			});
			setShowValidationModal(true);
			return false; // Validation failed, don't proceed
		} else {
			// Validation passed, proceed immediately
			onProceed();
			return true; // Validation passed
		}
	}, []);

	const closeValidationModal = useCallback(() => {
		setShowValidationModal(false);
		setValidationConfig(null);
	}, []);

	return {
		showValidationModal,
		validationConfig,
		validateAndProceed,
		closeValidationModal,
		StepValidationModal: validationConfig ? (
			<StepValidationModal
				config={validationConfig}
				isOpen={showValidationModal}
				onClose={closeValidationModal}
				onConfirm={() => {
					// This will be handled by the modal's handleConfirm
					closeValidationModal();
				}}
			/>
		) : null,
	};
};

// Service for creating common validation rules
export const StepValidationService = {
	// Create validation rules for Step 0 (Credentials)
	createStep0ValidationRules: (credentials: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		redirectUri?: string;
	}) => [
		{
			field: 'environmentId',
			value: credentials.environmentId,
			required: true,
			label: 'Environment ID',
		},
		{
			field: 'clientId',
			value: credentials.clientId,
			required: true,
			label: 'Client ID',
		},
		{
			field: 'clientSecret',
			value: credentials.clientSecret,
			required: true,
			label: 'Client Secret',
		},
		{
			field: 'redirectUri',
			value: credentials.redirectUri,
			required: true,
			label: 'Redirect URI',
		},
	],

	// Create validation rules for PKCE step
	createPKCEValidationRules: (pkceCodes: { codeVerifier?: string; codeChallenge?: string }) => [
		{
			field: 'codeVerifier',
			value: pkceCodes.codeVerifier,
			required: true,
			label: 'PKCE Code Verifier',
		},
		{
			field: 'codeChallenge',
			value: pkceCodes.codeChallenge,
			required: true,
			label: 'PKCE Code Challenge',
		},
	],

	// Create validation rules for authorization step
	createAuthorizationValidationRules: (authUrl: string, codeVerifier: string) => [
		{
			field: 'authUrl',
			value: authUrl,
			required: true,
			label: 'Authorization URL',
		},
		{
			field: 'codeVerifier',
			value: codeVerifier,
			required: true,
			label: 'PKCE Code Verifier',
		},
	],

	createTokenValidationRules: (tokens: {
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
	}) => [
		{
			field: 'accessToken',
			value: tokens?.access_token,
			required: true,
			label: 'Access Token',
		},
	],
};

export default StepValidationService;
