// src/hooks/useAuthorizationUrlValidation.ts
// React hook for integrating authorization URL validation into flows

import { useCallback, useEffect, useState } from 'react';
import { authorizationUrlValidationModalService } from '../services/authorizationUrlValidationModalService';
import {
	authorizationUrlValidationService,
	type UrlValidationConfig,
	type UrlValidationResult,
} from '../services/authorizationUrlValidationService';

export interface UseAuthorizationUrlValidationOptions {
	flowType: 'authorization-code' | 'implicit' | 'hybrid' | 'device';
	requireOpenId?: boolean;
	requireState?: boolean;
	requireNonce?: boolean;
	requirePkce?: boolean;
	autoValidate?: boolean;
	showModalOnError?: boolean;
	showModalOnWarning?: boolean;
}

export interface UseAuthorizationUrlValidationReturn {
	validateUrl: (url: string) => UrlValidationResult;
	validateAndShowModal: (url: string, onProceed?: () => void, onFix?: () => void) => boolean;
	quickValidate: (url: string) => { isValid: boolean; issues: string[] };
	lastValidationResult: UrlValidationResult | null;
	isModalOpen: boolean;
	closeModal: () => void;
}

/**
 * Hook for validating authorization URLs with modal feedback
 */
export const useAuthorizationUrlValidation = (
	options: UseAuthorizationUrlValidationOptions
): UseAuthorizationUrlValidationReturn => {
	const [lastValidationResult, setLastValidationResult] = useState<UrlValidationResult | null>(
		null
	);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Create validation config from options
	const validationConfig: UrlValidationConfig = {
		flowType: options.flowType,
		requireOpenId: options.requireOpenId,
		requireState: options.requireState,
		requireNonce: options.requireNonce,
		requirePkce: options.requirePkce,
	};

	// Listen for modal state changes
	useEffect(() => {
		const handleModalUpdate = (event: CustomEvent) => {
			const modalState = event.detail;
			setIsModalOpen(modalState.isOpen);
		};

		window.addEventListener('urlValidationModalUpdate', handleModalUpdate as EventListener);

		return () => {
			window.removeEventListener('urlValidationModalUpdate', handleModalUpdate as EventListener);
		};
	}, []);

	/**
	 * Validate URL and return result
	 */
	const validateUrl = useCallback(
		(url: string): UrlValidationResult => {
			const result = authorizationUrlValidationService.validateAuthorizationUrl(
				url,
				validationConfig
			);
			setLastValidationResult(result);
			return result;
		},
		[validationConfig]
	);

	/**
	 * Validate URL and show modal if needed
	 */
	const validateAndShowModal = useCallback(
		(url: string, onProceed?: () => void, onFix?: () => void): boolean => {
			const result = validateUrl(url);

			// Determine if we should show the modal
			const shouldShowModal =
				(!result.isValid && options.showModalOnError !== false) ||
				(result.warnings.length > 0 && options.showModalOnWarning !== false);

			if (shouldShowModal) {
				authorizationUrlValidationModalService.showValidationModal(result, url, onProceed, onFix);
			}

			return result.isValid;
		},
		[validateUrl, options.showModalOnError, options.showModalOnWarning]
	);

	/**
	 * Quick validation for common issues
	 */
	const quickValidate = useCallback((url: string) => {
		return authorizationUrlValidationService.quickValidate(url);
	}, []);

	/**
	 * Close modal
	 */
	const closeModal = useCallback(() => {
		authorizationUrlValidationModalService.hideModal();
	}, []);

	return {
		validateUrl,
		validateAndShowModal,
		quickValidate,
		lastValidationResult,
		isModalOpen,
		closeModal,
	};
};

/**
 * Hook for validating authorization URLs before sending
 */
export const usePreSendUrlValidation = (options: UseAuthorizationUrlValidationOptions) => {
	const { validateAndShowModal } = useAuthorizationUrlValidation(options);

	/**
	 * Validate URL before sending and show modal if issues found
	 */
	const validateBeforeSend = useCallback(
		(url: string, onSend: () => void, onCancel?: () => void): boolean => {
			const isValid = validateAndShowModal(
				url,
				onSend, // Proceed with sending
				onCancel // Fix issues (cancel sending)
			);

			return isValid;
		},
		[validateAndShowModal]
	);

	return {
		validateBeforeSend,
	};
};

/**
 * Hook for validating URLs in real-time as user types
 */
export const useRealtimeUrlValidation = (options: UseAuthorizationUrlValidationOptions) => {
	const { validateUrl } = useAuthorizationUrlValidation(options);
	const [validationState, setValidationState] = useState<{
		isValid: boolean;
		errors: string[];
		warnings: string[];
		suggestions: string[];
	}>({
		isValid: true,
		errors: [],
		warnings: [],
		suggestions: [],
	});

	/**
	 * Validate URL in real-time
	 */
	const validateRealtime = useCallback(
		(url: string) => {
			if (!url || url.trim().length === 0) {
				setValidationState({
					isValid: true,
					errors: [],
					warnings: [],
					suggestions: [],
				});
				return;
			}

			const result = validateUrl(url);
			setValidationState({
				isValid: result.isValid,
				errors: result.errors,
				warnings: result.warnings,
				suggestions: result.suggestions,
			});
		},
		[validateUrl]
	);

	return {
		validationState,
		validateRealtime,
	};
};

// Global access for debugging
if (typeof window !== 'undefined') {
	(window as any).useAuthorizationUrlValidation = useAuthorizationUrlValidation;
	(window as any).usePreSendUrlValidation = usePreSendUrlValidation;
	(window as any).useRealtimeUrlValidation = useRealtimeUrlValidation;

	console.log('🔍 Authorization URL Validation Hooks loaded. Available hooks:');
	console.log('  - useAuthorizationUrlValidation(options) - Main validation hook');
	console.log('  - usePreSendUrlValidation(options) - Pre-send validation hook');
	console.log('  - useRealtimeUrlValidation(options) - Real-time validation hook');
}
