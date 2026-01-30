/**
 * @file UnifiedActivationStep.tsx
 * @module v8/flows/unified/components
 * @description Step 3: Device Activation - Unified activation for all device types
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Handle device activation for all 6 device types using different methods:
 * - SMS, Email, WhatsApp, TOTP: OTP input and validation
 * - FIDO2: Already activated during registration (show success)
 * - Mobile: Show pairing status and completion
 *
 * Flow:
 * 1. Check device type and status
 * 2. Display appropriate activation UI
 * 3. Handle OTP validation or pairing completion
 * 4. Update mfaState with activation result
 * 5. Navigate to success step
 *
 * @example
 * <UnifiedActivationStep
 *   {...mfaFlowBaseProps}
 *   config={config}
 *   controller={controller}
 * />
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 UNIFIED-ACTIVATION-STEP]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedActivationStepProps extends MFAFlowBaseRenderProps {
	/** Device flow configuration */
	config: DeviceFlowConfig;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified Activation Step (Step 3)
 *
 * Handles device activation for all device types with appropriate UI:
 * - OTP input for SMS, Email, WhatsApp, TOTP
 * - Success message for FIDO2 (already activated)
 * - Pairing status for Mobile
 */
export const UnifiedActivationStep: React.FC<UnifiedActivationStepProps> = ({
	credentials,
	setCredentials,
	mfaState,
	setMfaState,
	tokenStatus,
	isLoading,
	setIsLoading,
	nav,
	config,
}) => {
	console.log(`${MODULE_TAG} Rendering activation step for:`, config.deviceType);
	console.log(`${MODULE_TAG} Device status:`, mfaState.deviceStatus);

	// ========================================================================
	// LOCAL STATE
	// ========================================================================

	const [otp, setOtp] = useState('');
	const [otpError, setOtpError] = useState<string | null>(null);
	const [validationAttempts, setValidationAttempts] = useState(0);
	const [canResend, setCanResend] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	// ========================================================================
	// EFFECTS
	// ========================================================================

	/**
	 * Start resend cooldown timer (60 seconds)
	 */
	useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => {
				setResendCooldown(resendCooldown - 1);
			}, 1000);
			return () => clearTimeout(timer);
		} else {
			setCanResend(true);
		}
	}, [resendCooldown]);

	/**
	 * Check if device is already activated
	 */
	useEffect(() => {
		if (mfaState.deviceStatus === 'ACTIVE') {
			console.log(`${MODULE_TAG} Device already activated, proceeding to success`);
			nav.markStepComplete();
			setTimeout(() => nav.goToNext(), 1500); // Auto-advance after 1.5s
		}
	}, [mfaState.deviceStatus, nav]);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	/**
	 * Handle OTP input change
	 */
	const handleOtpChange = useCallback((value: string) => {
		// Only allow digits and limit to 6 characters
		const sanitized = value.replace(/\D/g, '').slice(0, 6);
		setOtp(sanitized);
		setOtpError(null);
	}, []);

	/**
	 * Handle OTP validation
	 */
	const handleValidateOtp = useCallback(async () => {
		console.log(`${MODULE_TAG} Validating OTP:`, otp);

		if (!otp || otp.length !== 6) {
			setOtpError('Please enter a valid 6-digit code');
			return;
		}

		setIsLoading(true);

		try {
			console.log(`${MODULE_TAG} Validating OTP via API`);

			// Validate OTP via MFAServiceV8
			const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');
			const workerToken = await MFAServiceV8.getWorkerToken();
			const cleanToken = workerToken.trim().replace(/^Bearer\s+/i, '');

			const result = await MFAServiceV8.validateOTP({
				environmentId: credentials.environmentId,
				deviceAuthId: mfaState.deviceId,
				otp,
				workerToken: cleanToken,
				otpCheckUrl: mfaState.otpCheckUrl,
			});

			if (!result.valid) {
				throw new Error(result.message || 'Invalid OTP code');
			}
			console.log(`${MODULE_TAG} OTP validation successful:`, result);

			// Update MFA state with activation result
			setMfaState((prev) => ({
				...prev,
				deviceStatus: 'ACTIVE',
				activatedAt: new Date().toISOString(),
			}));

			// Show success toast
			toastV8.success(`${config.displayName} device activated successfully`);

			// Mark step as complete
			nav.markStepComplete();

			// Navigate to success step
			nav.goToNext();

			// Increment validation attempts
			setValidationAttempts((prev) => prev + 1);
		} catch (error: any) {
			console.error(`${MODULE_TAG} OTP validation failed:`, error);

			// Increment validation attempts
			setValidationAttempts((prev) => prev + 1);

			const errorMessage = error.message || 'Invalid OTP code';
			setOtpError(errorMessage);

			// Set validation errors in nav
			nav.setValidationErrors([errorMessage]);

			// Show error toast
			toastV8.error(errorMessage);

			// Clear OTP input after failed attempt
			setOtp('');
		} finally {
			setIsLoading(false);
		}
	}, [otp, mfaState, credentials, config, nav, setMfaState, setIsLoading]);

	/**
	 * Handle resend OTP
	 */
	const handleResendOtp = useCallback(async () => {
		console.log(`${MODULE_TAG} Resending OTP for device:`, mfaState.deviceId);

		setIsLoading(true);
		setCanResend(false);
		setResendCooldown(60); // 60 second cooldown

		try {
			// Send OTP via MFAServiceV8
			const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');
			const { deviceAuthId, otpCheckUrl } = await MFAServiceV8.sendOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId: mfaState.deviceId,
			});

			console.log(`${MODULE_TAG} OTP resent successfully`, {
				hasOtpCheckUrl: !!otpCheckUrl,
				deviceAuthId,
			});

			console.log(`${MODULE_TAG} OTP resent successfully`);

			// Show success toast
			toastV8.success(`New ${config.displayName} OTP sent`);

			// Clear previous OTP and error
			setOtp('');
			setOtpError(null);
		} catch (error: any) {
			console.error(`${MODULE_TAG} Resend OTP failed:`, error);

			const errorMessage = error.message || 'Failed to resend OTP';
			setOtpError(errorMessage);

			// Show error toast
			toastV8.error(errorMessage);

			// Reset cooldown on error
			setCanResend(true);
			setResendCooldown(0);
		} finally {
			setIsLoading(false);
		}
	}, [mfaState.deviceId, credentials.environmentId, config.displayName]);

	// ========================================================================
	// RENDER LOGIC
	// ========================================================================

	/**
	 * Render activation UI based on device type and status
	 */
	const renderActivationUI = () => {
		// FIDO2: Already activated during registration
		if (config.deviceType === 'FIDO2') {
			return (
				<div className="activation-success">
					<div className="success-icon">✓</div>
					<h3>Security Key Registered</h3>
					<p>Your FIDO2 security key has been successfully registered and is ready to use.</p>
				</div>
			);
		}

		// Mobile: Show pairing status
		if (config.deviceType === 'MOBILE') {
			return (
				<div className="mobile-pairing-status">
					<h3>Pairing Your Mobile Device</h3>
					<p>
						Please scan the QR code displayed in the previous step using the PingOne Mobile app to
						complete pairing.
					</p>
					<div className="pairing-status-indicator">
						{mfaState.deviceStatus === 'ACTIVE' ? (
							<>
								<div className="status-icon success">✓</div>
								<p className="status-text">Device paired successfully! Redirecting...</p>
							</>
						) : (
							<>
								<div className="status-icon pending">⏳</div>
								<p className="status-text">Waiting for pairing...</p>
							</>
						)}
					</div>
				</div>
			);
		}

		// SMS, Email, WhatsApp, TOTP: Show OTP input
		if (config.requiresOTP) {
			return (
				<div className="otp-activation">
					<h3>Verify Your Device</h3>
					<p className="instruction-text">
						{config.deviceType === 'TOTP'
							? 'Enter the 6-digit code from your authenticator app.'
							: `Enter the 6-digit code sent to your ${config.displayName}.`}
					</p>

					{/* OTP Input */}
					<div className="otp-input-container">
						<label htmlFor="otp-input" className="otp-label">
							One-Time Password
						</label>
						<input
							id="otp-input"
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={6}
							value={otp}
							onChange={(e) => handleOtpChange(e.target.value)}
							onKeyPress={(e) => {
								if (e.key === 'Enter' && otp.length === 6) {
									handleValidateOtp();
								}
							}}
							disabled={isLoading}
							placeholder="000000"
							className={`otp-input ${otpError ? 'input-error' : ''}`}
							aria-invalid={!!otpError}
							aria-describedby={otpError ? 'otp-error' : undefined}
						/>

						{otpError && (
							<span id="otp-error" className="error-message" role="alert">
								{otpError}
							</span>
						)}

						{validationAttempts > 0 && (
							<p className="validation-attempts">Validation attempts: {validationAttempts}</p>
						)}
					</div>

					{/* Resend OTP Button (not for TOTP) */}
					{config.deviceType !== 'TOTP' && (
						<div className="resend-section">
							<button
								type="button"
								onClick={handleResendOtp}
								disabled={!canResend || isLoading}
								className="button-link"
							>
								{canResend ? 'Resend Code' : `Resend available in ${resendCooldown}s`}
							</button>
						</div>
					)}
				</div>
			);
		}

		// Default: Device is already active
		return (
			<div className="activation-success">
				<div className="success-icon">✓</div>
				<h3>Device Activated</h3>
				<p>Your {config.displayName} device is already active and ready to use.</p>
			</div>
		);
	};

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="unified-activation-step">
			{/* Step Header */}
			<div className="step-header">
				<h2>Activate {config.displayName} Device</h2>
				<p className="step-description">Complete the activation process.</p>
			</div>

			{/* Activation UI */}
			<div className="activation-ui">{renderActivationUI()}</div>

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

				{config.requiresOTP && otp.length === 6 && (
					<button
						type="button"
						onClick={handleValidateOtp}
						disabled={isLoading || !tokenStatus.isValid}
						className="button-primary"
					>
						{isLoading ? 'Validating...' : 'Verify Code'}
					</button>
				)}

				{!config.requiresOTP && mfaState.deviceStatus === 'ACTIVE' && (
					<button
						type="button"
						onClick={() => nav.goToNext()}
						disabled={isLoading}
						className="button-primary"
					>
						Continue →
					</button>
				)}
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

export default UnifiedActivationStep;
