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

		// Clear previous errors
		setRegistrationError(null);

		// Validate fields
		if (!validate()) {
			console.error(`${MODULE_TAG} Validation failed`);
			setRegistrationError('Please fix the errors above before continuing');
			nav.setValidationErrors(['Please fix the form errors']);
			return;
		}

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

			// Update MFA state with registration result
			setMfaState((prev) => ({
				...prev,
				deviceId: result.deviceId,
				deviceStatus: result.status,
				// TOTP-specific data
				qrCodeUrl: result.qrCode || result.qrCodeUrl,
				totpSecret: result.secret || result.totpSecret,
				// FIDO2-specific data
				publicKeyCredentialCreationOptions: result.publicKeyCredentialCreationOptions,
				// Mobile-specific data
				pairingKey: result.pairingKey,
				// Links for activation
				activationLinks: result._links,
			}));

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
					values={deviceFields}
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

			{/* Action Buttons */}
			<div className="step-actions">
				<button
					type="button"
					onClick={() => nav.goToPrevious()}
					disabled={isLoading}
					className="button-secondary"
				>
					← Previous
				</button>

				<button
					type="button"
					onClick={handleRegisterDevice}
					disabled={isLoading || !tokenStatus.isValid}
					className="button-primary"
				>
					{isLoading ? 'Registering...' : `Register ${config.displayName}`}
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
