/**
 * @file UnifiedMFARegistrationFlowV8.tsx
 * @module v8/flows/unified
 * @description Unified MFA Registration Flow - Single component for all 6 device types
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Replace 6 device-specific flow components (SMS, Email, Mobile, WhatsApp, TOTP, FIDO2)
 * with a single configurable component using deviceFlowConfigs for device-specific behavior.
 *
 * Architecture:
 * - Configuration-driven using deviceFlowConfigs.ts
 * - Dynamic form rendering for simple devices (SMS, Email, WhatsApp)
 * - Custom components for complex devices (TOTP, FIDO2, Mobile)
 * - Integrates with MFACredentialContext and MFATokenManagerV8
 * - Uses existing MFAFlowBaseV8 for 5-step framework
 *
 * @example
 * <UnifiedMFARegistrationFlowV8
 *   deviceType="SMS"
 *   onSuccess={(result) => console.log('Device registered:', result.deviceId)}
 * />
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getDeviceConfig } from '@/v8/config/deviceFlowConfigs';
import type { DeviceConfigKey, DeviceRegistrationResult } from '@/v8/config/deviceFlowConfigTypes';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { MFATokenManagerV8 } from '@/v8/services/mfaTokenManagerV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { MFACredentials, MFAState } from '../shared/MFATypes';

const MODULE_TAG = '[🔄 UNIFIED-MFA-FLOW-V8]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedMFARegistrationFlowV8Props {
	/** Device type to render (required) */
	deviceType: DeviceConfigKey;

	/** Optional initial credentials (for pre-filled forms) */
	initialCredentials?: Partial<MFACredentials>;

	/** Optional callback when registration succeeds */
	onSuccess?: (result: DeviceRegistrationResult) => void;

	/** Optional callback when user cancels flow */
	onCancel?: () => void;

	/** Optional initial step (defaults to 0) */
	initialStep?: number;

	/** Optional: Skip configuration step if already configured */
	skipConfiguration?: boolean;

	/** Optional: Force specific registration flow type */
	registrationFlowType?: 'admin' | 'user';
}

// ============================================================================
// MAIN COMPONENT (WRAPPER)
// ============================================================================

/**
 * Unified MFA Registration Flow - Wrapper Component
 *
 * Wraps the content with MFACredentialProvider to provide global credential state
 */
export const UnifiedMFARegistrationFlowV8: React.FC<UnifiedMFARegistrationFlowV8Props> = (
	props
) => {
	console.log(`${MODULE_TAG} Initializing unified flow for device type:`, props.deviceType);

	return (
		<MFACredentialProvider>
			<UnifiedMFARegistrationFlowContent {...props} />
		</MFACredentialProvider>
	);
};

// ============================================================================
// CONTENT COMPONENT (MAIN LOGIC)
// ============================================================================

/**
 * Unified MFA Registration Flow - Content Component
 *
 * Contains the actual flow logic and integrates with:
 * - MFACredentialContext (global credential state)
 * - MFATokenManagerV8 (token status and auto-refresh)
 * - deviceFlowConfigs (device-specific configuration)
 * - MFAFlowBaseV8 (5-step framework)
 */
const UnifiedMFARegistrationFlowContent: React.FC<UnifiedMFARegistrationFlowV8Props> = ({
	deviceType,
	initialCredentials,
	onSuccess,
	onCancel,
	initialStep = 0,
	skipConfiguration = false,
	registrationFlowType,
}) => {
	// ========================================================================
	// CONFIGURATION
	// ========================================================================

	// Load device-specific configuration
	const config = useMemo(() => {
		console.log(`${MODULE_TAG} Loading config for device type:`, deviceType);
		return getDeviceConfig(deviceType);
	}, [deviceType]);

	console.log(`${MODULE_TAG} Device config loaded:`, {
		displayName: config.displayName,
		requiredFields: config.requiredFields,
		supportsQRCode: config.supportsQRCode,
		requiresOTP: config.requiresOTP,
	});

	// ========================================================================
	// TOKEN MANAGEMENT
	// ========================================================================

	// Initialize token manager (singleton)
	const tokenManager = useMemo(() => MFATokenManagerV8.getInstance(), []);

	// Token status state
	const [_tokenStatus, setTokenStatus] = useState<TokenStatusInfo>(tokenManager.getTokenState());

	// Subscribe to token updates
	useEffect(() => {
		console.log(`${MODULE_TAG} Subscribing to token manager updates`);

		const unsubscribe = tokenManager.subscribe((state) => {
			console.log(`${MODULE_TAG} Token state updated:`, state);
			setTokenStatus(state);
		});

		// Start auto-refresh
		tokenManager.startAutoRefresh();

		return () => {
			console.log(`${MODULE_TAG} Unsubscribing from token manager`);
			unsubscribe();
			tokenManager.stopAutoRefresh();
		};
	}, [tokenManager]);

	// ========================================================================
	// STATE MANAGEMENT
	// ========================================================================

	// MFA state (device-specific data)
	const [_mfaState, _setMfaState] = useState<MFAState>({
		deviceId: '',
		otpCode: '',
		deviceStatus: '',
		verificationResult: null,
	});

	// Loading state
	const [_isLoading, _setIsLoading] = useState(false);

	// ========================================================================
	// STEP NAVIGATION
	// ========================================================================

	// Initialize step navigation (5 steps)
	const nav = useStepNavigationV8(5, {
		initialStep,
		onStepChange: (step) => {
			console.log(`${MODULE_TAG} Step changed to:`, step);
		},
	});

	// Skip to registration step if configured
	useEffect(() => {
		if (skipConfiguration && nav.currentStep === 0) {
			console.log(`${MODULE_TAG} Skipping configuration, going to step 2`);
			nav.goToStep(2);
		}
	}, [skipConfiguration, nav]);

	// ========================================================================
	// STEP VALIDATION
	// ========================================================================

	/**
	 * Validate Step 0 (Configuration)
	 */
	const validateStep0 = useCallback(
		(
			credentials: MFACredentials,
			token: TokenStatusInfo,
			navigation: ReturnType<typeof useStepNavigationV8>
		) => {
			console.log(`${MODULE_TAG} Validating step 0`, {
				tokenValid: token.isValid,
				environmentId: credentials.environmentId,
				username: credentials.username,
			});

			// Check token validity
			if (!token.isValid) {
				navigation.setValidationErrors(['Invalid or expired worker token']);
				return false;
			}

			// Check required configuration
			if (!credentials.environmentId || !credentials.clientId || !credentials.username) {
				navigation.setValidationErrors(['Environment ID, Client ID, and Username are required']);
				return false;
			}

			return true;
		},
		[]
	);

	// ========================================================================
	// STEP RENDERERS
	// ========================================================================

	/**
	 * Render Step 0: Configuration
	 */
	const renderStep0 = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			return (
				<div className="unified-configuration-step">
					<h2>Step 0: Configuration (Placeholder)</h2>
					<p>Device Type: {config.displayName}</p>
					<p>This step will be implemented in the next phase.</p>
				</div>
			);
		},
		[config]
	);

	/**
	 * Render Step 1: Device Selection
	 */
	const renderStep1 = useCallback((_props: MFAFlowBaseRenderProps) => {
		return (
			<div className="unified-device-selection-step">
				<h2>Step 1: Device Selection (Placeholder)</h2>
				<p>This step will be implemented in the next phase.</p>
			</div>
		);
	}, []);

	/**
	 * Render Step 2: Device Registration
	 */
	const renderStep2 = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			return (
				<div className="unified-registration-step">
					<h2>Step 2: {config.displayName} Registration (Placeholder)</h2>
					<p>Required fields: {config.requiredFields.join(', ')}</p>
					<p>This step will be implemented in the next phase.</p>
				</div>
			);
		},
		[config]
	);

	/**
	 * Render Step 3: Activation
	 */
	const renderStep3 = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			return (
				<div className="unified-activation-step">
					<h2>Step 3: Activation (Placeholder)</h2>
					<p>Requires OTP: {config.requiresOTP ? 'Yes' : 'No'}</p>
					<p>This step will be implemented in the next phase.</p>
				</div>
			);
		},
		[config]
	);

	/**
	 * Render Step 4: Success
	 */
	const renderStep4 = useCallback((_props: MFAFlowBaseRenderProps) => {
		return (
			<div className="unified-success-step">
				<h2>Step 4: Success (Placeholder)</h2>
				<p>This step will be implemented in the next phase.</p>
			</div>
		);
	}, []);

	// ========================================================================
	// STEP LABELS
	// ========================================================================

	const stepLabels = useMemo(
		() => [
			'Configure',
			'Select Device',
			`Register ${config.displayName}`,
			config.requiresOTP ? 'Activate (OTP)' : 'Activate',
			'Success',
		],
		[config]
	);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<MFAFlowBaseV8
			deviceType={deviceType}
			renderStep0={renderStep0}
			renderStep1={renderStep1}
			renderStep2={renderStep2}
			renderStep3={renderStep3}
			renderStep4={renderStep4}
			validateStep0={validateStep0}
			stepLabels={stepLabels}
		/>
	);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedMFARegistrationFlowV8;
