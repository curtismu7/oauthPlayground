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
export function computeDeviceStatus(
	resultStatus: string | undefined,
	deviceType: string,
	tokenType: string,
	credentialsDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED'
) {
	const status = resultStatus || '';

	// For admin flows, check if deviceStatus was explicitly set in credentials
	// This handles the admin-active vs admin-activation selection
	if (credentialsDeviceStatus && tokenType === 'worker') {
		return credentialsDeviceStatus;
	}

	// Default behavior based on device type and registration result
	switch (deviceType) {
		case 'FIDO2':
			// FIDO2 devices are always active after registration
			return 'ACTIVE';
		case 'TOTP':
		case 'SMS':
		case 'EMAIL':
		case 'WHATSAPP':
		case 'MOBILE':
			// These devices typically require activation
			return status === 'ACTIVE' ? 'ACTIVE' : 'ACTIVATION_REQUIRED';
		default:
			return 'ACTIVATION_REQUIRED';
	}
}

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedRegistrationStepProps extends MFAFlowBaseRenderProps {
	/** Device configuration */
	config: DeviceFlowConfig;
	/** Flow controller */
	controller: MFAFlowController;
	/** Device field values */
	deviceFields: Record<string, string>;
	/** Set device field values */
	setDeviceFields: (fields: Record<string, string>) => void;
	/** Validation errors */
	errors: Record<string, string>;
	/** Validate function */
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
	mfaState: _mfaState,
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

	// State for registration result
	const [_registrationResult, setRegistrationResult] = useState<unknown>(null);
	const [registrationError, setRegistrationError] = useState<string | null>(null);

	// Check if form is valid for registration
	const isFormValid = React.useMemo(() => {
		// For user flows, don't require worker token - user token is sufficient
		const tokenType = credentials.tokenType || 'worker';
		const requiresWorkerToken = tokenType === 'worker';

		// Check token validity based on token type
		if (requiresWorkerToken && !tokenStatus.isValid) {
			console.log(`${MODULE_TAG} Worker token required but not valid for ${config.deviceType}`);
			return false;
		}

		// Check if all required fields are filled
		const requiredFields = config.requiredFields || [];
		const fieldsValid = requiredFields.every((field) => {
			const value = deviceFields[field];
			return value && value.trim() !== '';
		});

		console.log(`${MODULE_TAG} Form validation:`, {
			tokenType,
			requiresWorkerToken,
			tokenValid: tokenStatus.isValid,
			fieldsValid,
			requiredFieldCount: requiredFields.length,
			deviceFields,
		});

		return fieldsValid;
	}, [tokenStatus.isValid, config.requiredFields, deviceFields, credentials, config.deviceType]);

	// Handle device registration
	const handleRegisterDevice = useCallback(async () => {
		console.log(`${MODULE_TAG} Starting device registration for ${config.deviceType}`);

		try {
			setIsLoading(true);
			setRegistrationError(null);

			// Validate form
			if (!validate()) {
				console.warn(`${MODULE_TAG} Validation failed`);
				return;
			}

			// Call controller to register device
			const result = await controller.registerDevice(config.deviceType, deviceFields);

			console.log(`${MODULE_TAG} Registration successful:`, result);
			setRegistrationResult(result);

			// Update MFA state with registration result
			setMfaState((prev) => ({
				...prev,
				registrationResult: result,
				deviceId: result.deviceId,
				deviceStatus: computeDeviceStatus(
					result.status,
					config.deviceType,
					credentials.tokenType,
					credentials.deviceStatus
				),
			}));

			// Show success message
			toastV8.success(`${config.displayName} device registered successfully!`);

			// Navigate to next step (activation)
			nav.next();
		} catch (error) {
			console.error(`${MODULE_TAG} Registration failed:`, error);
			const errorMessage = error instanceof Error ? error.message : 'Registration failed';
			setRegistrationError(errorMessage);
			toastV8.error(`Registration failed: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, [
		config.deviceType,
		config.displayName,
		deviceFields,
		controller,
		validate,
		setIsLoading,
		setMfaState,
		nav,
		credentials.tokenType,
		credentials.deviceStatus,
	]);

	// Handle field changes
	const handleFieldChange = useCallback(
		(field: string, value: string) => {
			const newFields = { ...deviceFields, [field]: value };
			setDeviceFields(newFields);

			// Clear error for this field
			if (errors[field]) {
				setCredentials((prev) => ({
					...prev,
					errors: {
						...prev.errors,
						[field]: undefined,
					},
				}));
			}
		},
		[deviceFields, setDeviceFields, errors, setCredentials]
	);

	// Handle field touch (for validation)
	const handleFieldTouch = useCallback(
		(field: string) => {
			touchField?.(field);
		},
		[touchField]
	);

	// Render device-specific component
	const renderDeviceComponent = () => {
		const DeviceComponent = DeviceComponentRegistry[config.deviceType];

		if (DeviceComponent) {
			const props: DeviceComponentProps = {
				config,
				values: deviceFields,
				onChange: handleFieldChange,
				errors,
				onTouch: handleFieldTouch,
				disabled: isLoading,
			};

			return <DeviceComponent {...props} />;
		}

		// Default to dynamic form renderer
		return (
			<DynamicFormRenderer
				config={config}
				values={deviceFields}
				onChange={handleFieldChange}
				errors={errors}
				onTouch={handleFieldTouch}
				disabled={isLoading}
			/>
		);
	};

	return (
		<div className="unified-registration-step">
			{/* Header */}
			<div style={{ marginBottom: '24px' }}>
				<h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
					Register {config.displayName} Device
				</h2>
				<p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>{config.description}</p>
			</div>

			{/* Registration Error */}
			{registrationError && (
				<div
					className="registration-error"
					role="alert"
					style={{
						padding: '12px',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '6px',
						marginBottom: '16px',
						color: '#dc2626',
						fontSize: '14px',
					}}
				>
					<strong>Registration Failed:</strong> {registrationError}
				</div>
			)}

			{/* Registration Info */}
			<div
				style={{
					padding: '12px 16px',
					background: '#eff6ff',
					border: '1px solid #bfdbfe',
					borderRadius: '6px',
					marginBottom: '16px',
					fontSize: '14px',
					color: '#1e40af',
				}}
			>
				{config.deviceType === 'FIDO2' ? (
					<>
						ℹ️ Clicking "Next Step" will create your {config.displayName} device, then you'll
						complete biometric authentication.
					</>
				) : (
					<>
						ℹ️ Clicking "Next Step" will register your {config.displayName} device and send the
						activation code.
					</>
				)}
			</div>

			{/* Device Component */}
			<div style={{ marginBottom: '24px' }}>{renderDeviceComponent()}</div>

			{/* Navigation Buttons */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<button
					type="button"
					onClick={() => nav.previous()}
					disabled={isLoading}
					style={{
						padding: '10px 16px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						background: '#f9fafb',
						color: '#374151',
						cursor: isLoading ? 'not-allowed' : 'pointer',
						opacity: isLoading ? 0.6 : 1,
					}}
				>
					← Previous
				</button>

				<button
					type="button"
					onClick={handleRegisterDevice}
					disabled={isLoading || !isFormValid}
					style={{
						padding: '10px 16px',
						border: 'none',
						borderRadius: '6px',
						background: isFormValid && !isLoading ? '#3b82f6' : '#9ca3af',
						color: 'white',
						cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed',
						opacity: isFormValid && !isLoading ? 1 : 0.6,
					}}
				>
					{isLoading ? 'Registering...' : 'Next Step ▶'}
				</button>
			</div>

			{/* Token Warning */}
			{!tokenStatus.isValid && (
				<div
					className="token-warning"
					role="alert"
					style={{
						padding: '12px',
						background: '#fef3c7',
						border: '1px solid #fde68a',
						borderRadius: '6px',
						marginTop: '16px',
						color: '#d97706',
						fontSize: '14px',
					}}
				>
					⚠️ Worker token is invalid or expired. Please refresh your token before continuing.
				</div>
			)}
		</div>
	);
};

export default UnifiedRegistrationStep;
