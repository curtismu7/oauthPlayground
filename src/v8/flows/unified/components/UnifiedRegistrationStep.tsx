/**
 * @file UnifiedRegistrationStep.tsx
 * @module v8/flows/unified/components
 * @description Step 2: Device Registration - Unified registration for all device types
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Handle device registration for all 6 device types using either:
 * - DynamicFormRenderer (for SMS, Email, WhatsApp)
 * - Custom components (for TOTP, FIDO2, Mobile)
 *
 * Flow:
 * 1. Render appropriate UI based on device type
 * 2. Collect and validate device-specific information
 * 3. Call controller.registerDevice()
 * 4. Update mfaState with registration result
 * 5. Navigate to activation step
 *
 * @example
 * <UnifiedRegistrationStep
 *   {...mfaFlowBaseProps}
 *   config={config}
 *   controller={controller}
 *   deviceFields={deviceFields}
 *   setDeviceFields={setDeviceFields}
 *   errors={errors}
 *   validate={validate}
 * />
 */

import React, { useCallback, useState } from 'react';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowController } from '@/v8/flows/controllers/MFAFlowController';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { type DeviceComponentProps, DeviceComponentRegistry } from './DeviceComponentRegistry';
import { DynamicFormRenderer } from './DynamicFormRenderer';

const MODULE_TAG = '[📝 UNIFIED-REGISTRATION-STEP]';

// Exported helper to determine final device status after registration
export function computeDeviceStatus(resultStatus: string | undefined, deviceType: string, tokenType: string) {
	let status = resultStatus || '';
	if (deviceType === 'TOTP') {
		// User flows must require activation
		if (tokenType === 'user') return 'ACTIVATION_REQUIRED';
		// For admin/worker flows, prefer returned status, but default to ACTIVATION_REQUIRED
		return status || 'ACTIVATION_REQUIRED';
	}
	return status || 'ACTIVE';
}

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedRegistrationStepProps extends MFAFlowBaseRenderProps {
	/** Device flow configuration */
	config: DeviceFlowConfig;

	/** Device controller */
	controller: MFAFlowController;

	/** Device-specific form field values */
	deviceFields: Record<string, string>;

	/** Update device fields */
	setDeviceFields: (
		fields: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
	) => void;

	/** Validation errors */
	errors: Record<string, string>;

	/** Validation function */
	validate: () => boolean;

	/** Touch field callback (for validation) */
	touchField?: (field: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified Registration Step (Step 2)
 *
 * Handles device registration for all device types using configuration-driven
 * rendering (DynamicFormRenderer) or custom components (TOTP, FIDO2, Mobile).
 */
export const UnifiedRegistrationStep: React.FC<UnifiedRegistrationStepProps> = ({
	credentials,
	setCredentials,
	mfaState,
	setMfaState,
	tokenStatus,
	isLoading,
	setIsLoading,
	nav,
	config,
	controller,
	deviceFields,
	setDeviceFields,
	errors,
	validate,
	touchField,
}) => {
	console.log(`${MODULE_TAG} Rendering registration step for:`, config.deviceType);
	
	// ========== DEBUG: FULL CONFIG CHECK ==========
	console.log('🔍 [REG-STEP DEBUG] Full config:', {
		deviceType: config.deviceType,
		displayName: config.displayName,
		requiresOTP: config.requiresOTP,
		configObject: config
	});
	// ==============================================
	
	// ========== DEBUG: COMPONENT MOUNT ==========
	React.useEffect(() => {
		console.log('🔍 [REG-STEP DEBUG] Component mounted/updated', {
			deviceType: config.deviceType,
			hasDeviceFields: !!deviceFields,
			fieldCount: Object.keys(deviceFields || {}).length,
			tokenValid: tokenStatus.isValid,
			isLoading
		});
	}, [config.deviceType, deviceFields, tokenStatus.isValid, isLoading]);
	// ===========================================

	// ========================================================================
	// LOCAL STATE
	// ========================================================================

	const [registrationError, setRegistrationError] = useState<string | null>(null);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	/**
	 * Handle field change
	 */
	const handleFieldChange = useCallback(
		(field: string, value: string) => {
			console.log(`${MODULE_TAG} Field changed:`, field, '=', value);
			setDeviceFields((prev) => ({ ...prev, [field]: value }));

			// Clear error for this field
			if (errors[field]) {
				setRegistrationError(null);
			}
		},
		[setDeviceFields, errors]
	);

	/**
	 * Handle device registration
	 */
	const handleRegisterDevice = useCallback(async () => {
		console.log(`${MODULE_TAG} Starting device registration`, {
			deviceType: config.deviceType,
			deviceFields,
		});
		
		// ========== DEBUG: REGISTRATION ENTRY ==========
		console.log('🔍 [REG DEBUG] handleRegisterDevice called', {
			deviceType: config.deviceType,
			fields: deviceFields,
			credentialsEnvId: credentials.environmentId,
			tokenIsValid: tokenStatus.isValid
		});
		// ===============================================

		// Clear previous errors
		setRegistrationError(null);

		// Validate fields
		if (!validate()) {
			console.error(`${MODULE_TAG} Validation failed`);
			console.log('🔍 [REG DEBUG] Validation failed, errors:', errors);
			setRegistrationError('Please fix the errors above before continuing');
			nav.setValidationErrors(['Please fix the form errors']);
			return;
		}
		
		console.log('🔍 [REG DEBUG] Validation passed, proceeding with registration');

		// Set loading state
		setIsLoading(true);

		try {
			// Merge device fields into credentials
			const updatedCredentials = {
				...credentials,
				deviceType: config.deviceType,
				...deviceFields,
			};

			// Update credentials
			setCredentials(updatedCredentials);

			console.log(`${MODULE_TAG} Calling controller.registerDevice`);

			// Call controller to register device
			const result = await controller.registerDevice(
				updatedCredentials,
				mfaState,
				tokenStatus,
				nav
			);

			console.log(`${MODULE_TAG} Device registered successfully:`, result);
		
		// ========== DEBUG: TOTP QR CODE DATA ==========
		if (config.deviceType === 'TOTP') {
			console.log('🔍 [TOTP DEBUG] Registration result:', {
				deviceId: result.deviceId,
				status: result.status,
				qrCode: result.qrCode,
				qrCodeUrl: result.qrCodeUrl,
				secret: result.secret,
				totpSecret: result.totpSecret,
				fullResult: result
			});
		}
		// ===============================================

		// Update MFA state with registration result
		setMfaState((prev) => {
			const newState = {
				...prev,
				deviceId: result.deviceId,
				deviceStatus: computeDeviceStatus(result.status, config.deviceType, tokenStatus.type),
				// TOTP-specific data (preserve QR/secret for user to scan)
				qrCodeUrl: result.qrCode || result.qrCodeUrl,
				totpSecret: result.secret || result.totpSecret,
				// If we have TOTP data, surface the QR/secret immediately
				showQr: config.deviceType === 'TOTP' && (result.qrCode || result.secret || result.totpSecret),
				// FIDO2-specific data
				publicKeyCredentialCreationOptions: result.publicKeyCredentialCreationOptions,
				// Mobile-specific data
				pairingKey: result.pairingKey,
				// Links for activation
				activationLinks: result._links,
			};
			
			// ========== DEBUG: TOTP MFA STATE UPDATE ==========
			if (config.deviceType === 'TOTP') {
				console.log('🔍 [TOTP DEBUG] Updated mfaState:', {
					qrCodeUrl: newState.qrCodeUrl,
					totpSecret: newState.totpSecret,
					showQr: newState.showQr,
					deviceStatus: newState.deviceStatus,
					fullState: newState
				});
			}
			// ================================================
			
			return newState;
		});
			// Show success toast
			toastV8.success(`${config.displayName} device registered successfully`);

			// Mark step as complete
			nav.markStepComplete();

			// Navigate to next step (activation)
			nav.goToNext();
		} catch (error: any) {
			console.error(`${MODULE_TAG} Device registration failed:`, error);

			const errorMessage = error.message || `Failed to register ${config.displayName} device`;

			setRegistrationError(errorMessage);
			nav.setValidationErrors([errorMessage]);

			// Show error toast
			toastV8.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [
		config,
		deviceFields,
		credentials,
		setCredentials,
		mfaState,
		setMfaState,
		tokenStatus,
		nav,
		controller,
		validate,
		setIsLoading,
	]);

	/**
	 * Handle registration success (for custom components)
	 */
	const handleRegistrationSuccess = useCallback(
		(data: any) => {
			console.log(`${MODULE_TAG} Custom component registration success:`, data);

			// Update MFA state
			setMfaState((prev) => ({
				...prev,
				...data,
			}));

			// Show success toast
			toastV8.success(`${config.displayName} registered successfully`);

			// Mark step as complete
			nav.markStepComplete();

			// Navigate to next step
			nav.goToNext();
		},
		[config, setMfaState, nav]
	);

	/**
	 * Handle registration error (for custom components)
	 */
	const handleRegistrationError = useCallback(
		(error: string) => {
			console.error(`${MODULE_TAG} Custom component registration error:`, error);

			setRegistrationError(error);
			nav.setValidationErrors([error]);

			// Show error toast
			toastV8.error(error);
		},
		[nav]
	);

	// ========================================================================
	// RENDER UI LOGIC
	// ========================================================================

	/**
	 * Render registration UI based on device type
	 */
	const renderRegistrationUI = () => {
		// Check if this device type has a custom component
		const CustomComponent = DeviceComponentRegistry[config.deviceType];
		
		// ========== DEBUG: REGISTRATION UI PATH ==========
		console.log('🔍 [REG-UI DEBUG] Rendering path:', {
			deviceType: config.deviceType,
			hasCustomComponent: !!CustomComponent,
			willUseDynamicForm: !CustomComponent,
			registryValue: CustomComponent
		});
		// ================================================

		if (CustomComponent) {
			// Use device-specific custom component (TOTP, FIDO2, Mobile)
			console.log(`${MODULE_TAG} Using custom component for:`, config.deviceType);

			const customComponentProps: DeviceComponentProps = {
				credentials,
				mfaState,
				setMfaState,
				onSuccess: handleRegistrationSuccess,
				onError: handleRegistrationError,
				controller,
				config,
			};

			return <CustomComponent {...customComponentProps} />;
		} else {
			// Use dynamic form renderer (SMS, Email, WhatsApp)
			console.log(`${MODULE_TAG} Using dynamic form renderer for:`, config.deviceType);

			return (
				<DynamicFormRenderer
					config={config}
					values={deviceFields || {}}
					onChange={handleFieldChange}
					errors={errors}
					onTouch={touchField}
					disabled={isLoading}
				/>
			);
		}
	};

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="unified-registration-step">
			{/* Step Header */}
			<div className="step-header">
				<h2>Register {config.displayName} Device</h2>
				<p className="step-description">{config.description}</p>
			</div>

			{/* Registration UI (dynamic form or custom component) */}
			<div className="registration-ui">{renderRegistrationUI()}</div>

			{/* Registration Error */}
			{registrationError && (
				<div className="registration-error" role="alert">
					<strong>Registration Failed:</strong> {registrationError}
				</div>
			)}

			{/* Registration Info */}
			<div style={{ 
				padding: '12px 16px', 
				background: '#eff6ff', 
				border: '1px solid #bfdbfe',
				borderRadius: '6px',
				marginBottom: '16px',
				fontSize: '14px',
				color: '#1e40af'
			}}>
			{config.deviceType === 'FIDO2' ? (
				<>ℹ️ Clicking "Next Step" will create your {config.displayName} device, then you'll complete biometric authentication.</>
			) : (
				<>ℹ️ Clicking "Next Step" will register your {config.displayName} device and send the activation code.</>
			)}
					← Previous
				</button>

				<button
					type="button"
					onClick={handleRegisterDevice}
					disabled={isLoading || !tokenStatus.isValid}
					className="button-primary"
				>
					{isLoading ? 'Registering...' : 'Next Step ▶'}
				</button>
			</div>

			{/* Token Status Warning */}
			{!tokenStatus.isValid && (
				<div className="token-warning" role="alert">
					⚠️ Worker token is invalid or expired. Please refresh your token before continuing.
				</div>
			)}
		</div>
	);
};

export default UnifiedRegistrationStep;
