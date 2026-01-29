/**
 * @file UnifiedSuccessStep.tsx
 * @module v8/flows/unified/components
 * @description Step 4: Success - Display registration success and device details
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Display success message after device registration and activation.
 * Shows device details, provides option to register another device.
 *
 * Flow:
 * 1. Display success message with device icon
 * 2. Show registered device details (ID, type, status, contact info)
 * 3. Provide "Register Another Device" button
 * 4. Call onSuccess callback if provided
 * 5. Log analytics event
 *
 * @example
 * <UnifiedSuccessStep
 *   {...mfaFlowBaseProps}
 *   config={config}
 *   onComplete={handleComplete}
 * />
 */

import React, { useCallback, useEffect } from 'react';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[✅ UNIFIED-SUCCESS-STEP]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedSuccessStepProps extends MFAFlowBaseRenderProps {
	/** Device flow configuration */
	config: DeviceFlowConfig;

	/** Callback when user wants to register another device */
	onComplete?: () => void;

	/** Callback for registering another device */
	onRegisterAnother?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified Success Step (Step 4)
 *
 * Displays registration success message and device details with option
 * to register another device.
 */
export const UnifiedSuccessStep: React.FC<UnifiedSuccessStepProps> = ({
	credentials,
	mfaState,
	tokenStatus,
	nav,
	config,
	onComplete,
	onRegisterAnother,
}) => {
	console.log(`${MODULE_TAG} Rendering success step for:`, config.deviceType);

	// ========================================================================
	// EFFECTS
	// ========================================================================

	/**
	 * Mark step as complete on mount and log analytics
	 */
	useEffect(() => {
		console.log(`${MODULE_TAG} Device registration complete:`, {
			deviceType: config.deviceType,
			deviceId: mfaState.deviceId,
			status: mfaState.deviceStatus,
		});

		// Mark step as complete
		nav.markStepComplete();

		// Log analytics event
		if (typeof window !== 'undefined' && (window as any).gtag) {
			(window as any).gtag('event', 'mfa_registration_success', {
				device_type: config.deviceType,
				device_id: mfaState.deviceId,
				flow_version: 'v8-unified',
			});
		}

		// Call onComplete callback
		if (onComplete) {
			onComplete();
		}
	}, [
		config.deviceType,
		mfaState.deviceId,
		mfaState.deviceStatus, // Mark step as complete
		nav.markStepComplete,
		onComplete,
	]); // Only run once on mount

	// ========================================================================
	// HANDLERS
	// ========================================================================

	/**
	 * Handle "Register Another Device" button click
	 */
	const handleRegisterAnother = useCallback(() => {
		console.log(`${MODULE_TAG} User wants to register another device`);

		toastV8.info('Starting new device registration');

		// Call callback if provided
		if (onRegisterAnother) {
			onRegisterAnother();
		} else {
			// Default: restart flow from device selection step
			nav.goToStep(1);
		}
	}, [onRegisterAnother, nav]);

	// ========================================================================
	// COMPUTED PROPERTIES
	// ========================================================================

	/**
	 * Get device contact information based on device type
	 */
	const getDeviceContactInfo = (): string | null => {
		switch (config.deviceType) {
			case 'SMS':
				return credentials.phoneNumber
					? `${credentials.countryCode} ${credentials.phoneNumber}`
					: null;
			case 'EMAIL':
				return credentials.email || null;
			case 'WHATSAPP':
				return credentials.phoneNumber
					? `${credentials.countryCode} ${credentials.phoneNumber}`
					: credentials.email || null;
			case 'TOTP':
				return 'Authenticator App';
			case 'FIDO2':
				return 'Security Key / Biometric';
			case 'MOBILE':
				return 'PingOne Mobile App';
			default:
				return null;
		}
	};

	const contactInfo = getDeviceContactInfo();

	/**
	 * Get device nickname if available
	 */
	const deviceName = credentials.deviceName || credentials.nickname || `My ${config.displayName}`;

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="unified-success-step">
			{/* Success Header */}
			<div className="success-header">
				<div className="success-icon">
					<span className="icon-large">{config.icon}</span>
					<span className="checkmark">✓</span>
				</div>
				<h2 className="success-title">Device Registered Successfully!</h2>
				<p className="success-subtitle">
					Your {config.displayName} device is now active and ready to use for multi-factor
					authentication.
				</p>
			</div>

			{/* Device Details Card */}
			<div className="device-details-card">
				<h3>Device Details</h3>

				<div className="detail-row">
					<span className="detail-label">Device Type:</span>
					<span className="detail-value">
						{config.icon} {config.displayName}
					</span>
				</div>

				{deviceName && (
					<div className="detail-row">
						<span className="detail-label">Device Name:</span>
						<span className="detail-value">{deviceName}</span>
					</div>
				)}

				{mfaState.deviceId && (
					<div className="detail-row">
						<span className="detail-label">Device ID:</span>
						<span className="detail-value device-id">{mfaState.deviceId}</span>
					</div>
				)}

				<div className="detail-row">
					<span className="detail-label">Status:</span>
					<span className="detail-value status-badge status-active">
						{mfaState.deviceStatus || 'ACTIVE'}
					</span>
				</div>

				{contactInfo && (
					<div className="detail-row">
						<span className="detail-label">Contact:</span>
						<span className="detail-value">{contactInfo}</span>
					</div>
				)}

				{credentials.environmentId && (
					<div className="detail-row">
						<span className="detail-label">Environment:</span>
						<span className="detail-value environment-id">{credentials.environmentId}</span>
					</div>
				)}

				{credentials.username && (
					<div className="detail-row">
						<span className="detail-label">Username:</span>
						<span className="detail-value">{credentials.username}</span>
					</div>
				)}
			</div>

			{/* Next Steps Information */}
			<div className="next-steps-info">
				<h4>What's Next?</h4>
				<ul>
					<li>
						Your {config.displayName} device will be used for multi-factor authentication when you
						sign in.
					</li>
					{config.deviceType === 'SMS' && (
						<li>You'll receive a one-time code via SMS each time you need to authenticate.</li>
					)}
					{config.deviceType === 'EMAIL' && (
						<li>You'll receive a one-time code via email each time you need to authenticate.</li>
					)}
					{config.deviceType === 'WHATSAPP' && (
						<li>You'll receive a one-time code via WhatsApp each time you need to authenticate.</li>
					)}
					{config.deviceType === 'TOTP' && (
						<li>
							Open your authenticator app and enter the code shown when you need to authenticate.
						</li>
					)}
					{config.deviceType === 'FIDO2' && (
						<li>Use your security key or biometric when prompted during authentication.</li>
					)}
					{config.deviceType === 'MOBILE' && (
						<li>Approve authentication requests in the PingOne Mobile app when prompted.</li>
					)}
					<li>You can register additional devices for backup authentication methods.</li>
				</ul>
			</div>

			{/* Action Buttons */}
			<div className="step-actions">
				<button type="button" onClick={handleRegisterAnother} className="button-secondary">
					← Register Another Device
				</button>

				<button
					type="button"
					onClick={() => {
						console.log(`${MODULE_TAG} User finished registration flow`);
						toastV8.success('Registration complete!');
					}}
					className="button-primary"
				>
					Finish
				</button>
			</div>

			{/* Token Status Info */}
			{tokenStatus.isValid && (
				<div className="token-info" role="status">
					<small>
						✓ Worker token is valid and will expire{' '}
						{tokenStatus.expiresAt ? new Date(tokenStatus.expiresAt).toLocaleString() : 'soon'}
					</small>
				</div>
			)}
		</div>
	);
};

export default UnifiedSuccessStep;
