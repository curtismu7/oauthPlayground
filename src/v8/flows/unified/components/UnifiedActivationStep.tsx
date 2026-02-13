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

import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useState } from 'react';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { UnifiedOTPActivationTemplate } from './UnifiedOTPActivationTemplate';

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
	 * Scroll to top when TOTP activation loads (so QR code is visible)
	 * Use multiple scroll targets and requestAnimationFrame for reliability
	 */
	useEffect(() => {
		if (config.deviceType === 'TOTP' && (mfaState.qrCodeUrl || mfaState.totpSecret)) {
			console.log('🔍 [TOTP DEBUG] Scrolling to top - QR code data available');

			const scrollToTop = () => {
				// Scroll main window
				window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
				document.documentElement.scrollTop = 0;
				document.body.scrollTop = 0;

				// Find and scroll the step header into view
				const stepHeader = document.querySelector('.step-header');
				if (stepHeader) {
					stepHeader.scrollIntoView({ behavior: 'instant', block: 'start' });
				}

				// Find and scroll the unified-activation-step container
				const activationStep = document.querySelector('.unified-activation-step');
				if (activationStep) {
					activationStep.scrollIntoView({ behavior: 'instant', block: 'start' });
				}

				// Scroll all scrollable parents
				const scrollableElements = document.querySelectorAll('[style*="overflow"]');
				scrollableElements.forEach((el) => {
					if (el instanceof HTMLElement) {
						el.scrollTop = 0;
					}
				});
			};

			// Multiple scroll attempts with increasing delays
			scrollToTop(); // Immediate
			requestAnimationFrame(scrollToTop); // After next paint
			setTimeout(scrollToTop, 10);
			setTimeout(scrollToTop, 50);
			setTimeout(scrollToTop, 100);
			setTimeout(scrollToTop, 200);
			setTimeout(scrollToTop, 300);
			setTimeout(scrollToTop, 500);
		}
	}, [config.deviceType, mfaState.qrCodeUrl, mfaState.totpSecret]); // Re-run when QR data arrives

	/**
	 * Check if device is already activated
	 * NOTE: Don't auto-advance for Admin Flow - user needs to see QR code or confirmation
	 */
	useEffect(() => {
		// Skip auto-advance for Admin Flow (user needs to manually click "Continue to Success")
		if (credentials.flowType === 'admin') {
			return;
		}

		if (mfaState.deviceStatus === 'ACTIVE') {
			console.log(`${MODULE_TAG} Device already activated, proceeding to success`);
			nav.markStepComplete();
			setTimeout(() => nav.goToNext(), 1500); // Auto-advance after 1.5s
		}
	}, [mfaState.deviceStatus, nav, credentials.flowType]);

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
	 * Handle OTP validation (device activation)
	 *
	 * IMPORTANT: For registration flows, we use activateDevice() not validateOTP()
	 * - activateDevice(): Used after device registration to activate with OTP
	 * - validateOTP(): Used for authentication flows with an existing active device
	 */
	const handleValidateOtp = useCallback(async () => {
		console.log(`${MODULE_TAG} Activating device with OTP:`, otp);

		if (!otp || otp.length !== 6) {
			setOtpError('Please enter a valid 6-digit code');
			return;
		}

		setIsLoading(true);

		try {
			console.log(`${MODULE_TAG} Activating device via activateDevice API`);

			// Activate device via MFAServiceV8.activateDevice()
			// This is the correct method for registration flows (not validateOTP)
			const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');

			const result = await MFAServiceV8.activateDevice({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId: mfaState.deviceId,
				otp,
				...(mfaState.deviceActivateUri && { deviceActivateUri: mfaState.deviceActivateUri }),
			});

			// Check if activation was successful
			// activateDevice returns the device object on success
			const activationResult = result as Record<string, unknown>;
			if (!result || activationResult.error) {
				throw new Error(
					String(activationResult.error || activationResult.message || 'Device activation failed')
				);
			}
			console.log(`${MODULE_TAG} Device activation successful:`, result);

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
		} catch (error: unknown) {
			console.error(`${MODULE_TAG} Device activation failed:`, error);

			// Increment validation attempts
			setValidationAttempts((prev) => prev + 1);

			const errorMessage = error instanceof Error ? error.message : 'Invalid OTP code';
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
	 * Handle resend OTP (resend pairing code for device activation)
	 *
	 * Uses resendPairingCode() which is the correct method for devices in ACTIVATION_REQUIRED state.
	 * This is different from authentication flows which use initializeDeviceAuthentication().
	 */
	const handleResendOtp = useCallback(async () => {
		console.log(`${MODULE_TAG} Resending pairing code for device:`, mfaState.deviceId);

		setIsLoading(true);
		setCanResend(false);
		setResendCooldown(60); // 60 second cooldown

		try {
			// Resend pairing code via MFAServiceV8.resendPairingCode()
			// This is the correct method for registration activation flows
			const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');
			await MFAServiceV8.resendPairingCode({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId: mfaState.deviceId,
			});

			console.log(`${MODULE_TAG} Pairing code resent successfully`);

			// Show success toast
			toastV8.success(`New ${config.displayName} verification code sent`);

			// Clear previous OTP and error
			setOtp('');
			setOtpError(null);
		} catch (error: unknown) {
			console.error(`${MODULE_TAG} Resend pairing code failed:`, error);

			const errorMessage =
				error instanceof Error ? error.message : 'Failed to resend verification code';
			setOtpError(errorMessage);

			// Show error toast
			toastV8.error(errorMessage);

			// Reset cooldown on error
			setCanResend(true);
			setResendCooldown(0);
		} finally {
			setIsLoading(false);
		}
	}, [
		mfaState.deviceId,
		credentials.environmentId,
		credentials.username,
		config.displayName,
		setIsLoading,
	]);

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

		// SMS, Email, WhatsApp, TOTP: Use the unified OTP template
		if (config.requiresOTP) {
			// ========== DEBUG: TOTP ACTIVATION STATE ==========
			if (config.deviceType === 'TOTP') {
				console.log('🔍 [TOTP DEBUG] Activation step rendering:', {
					qrCodeUrl: mfaState.qrCodeUrl,
					totpSecret: mfaState.totpSecret,
					showQr: mfaState.showQr,
					deviceStatus: mfaState.deviceStatus,
					hasQrData: !!(mfaState.qrCodeUrl || mfaState.totpSecret),
					fullMfaState: mfaState,
				});
			}
			// ================================================

			return (
				<>
					{/* TOTP: Show QR code and secret before OTP input */}
					{config.deviceType === 'TOTP' && (mfaState.qrCodeUrl || mfaState.totpSecret) && (
						<div
							className="totp-qr-section"
							style={{
								marginBottom: '24px',
								padding: '20px',
								background: '#f8f9fa',
								borderRadius: '8px',
								border: '1px solid #dee2e6',
							}}
						>
							<h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
								📱 Scan QR Code
							</h3>

							{mfaState.qrCodeUrl && (
								<div style={{ textAlign: 'center', marginBottom: '16px' }}>
									{/* Render QR code from keyUri using QRCodeSVG */}
									<div
										style={{
											display: 'inline-block',
											padding: '16px',
											background: 'white',
											border: '2px solid #dee2e6',
											borderRadius: '8px',
										}}
									>
										<QRCodeSVG
											value={mfaState.qrCodeUrl}
											size={200}
											level="M"
											includeMargin={false}
										/>
									</div>
									<p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
										Scan this code with your authenticator app
									</p>
								</div>
							)}

							{mfaState.totpSecret && (
								<details style={{ marginTop: '16px' }}>
									<summary style={{ cursor: 'pointer', fontWeight: 500, color: '#495057' }}>
										Can't scan? Enter manually
									</summary>
									<div
										style={{
											marginTop: '12px',
											padding: '12px',
											background: 'white',
											borderRadius: '4px',
											border: '1px solid #dee2e6',
										}}
									>
										<code
											style={{
												display: 'block',
												fontFamily: 'monospace',
												fontSize: '14px',
												wordBreak: 'break-all',
												color: '#212529',
											}}
										>
											{mfaState.totpSecret}
										</code>
										<button
											type="button"
											onClick={() => {
												navigator.clipboard.writeText(mfaState.totpSecret || '');
												toastV8.success('Secret copied to clipboard');
											}}
											style={{
												marginTop: '8px',
												padding: '6px 12px',
												background: '#007bff',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												fontSize: '13px',
												cursor: 'pointer',
											}}
										>
											📋 Copy Secret
										</button>
									</div>
								</details>
							)}

							<p
								style={{
									margin: '16px 0 0 0',
									fontSize: '13px',
									color: '#6c757d',
									fontStyle: 'italic',
								}}
							>
								✓ Supported: Google Authenticator, Microsoft Authenticator, Authy, 1Password, etc.
							</p>
						</div>
					)}

					{/* For Admin Flow with OTP devices, show skip button instead of OTP input */}
					{config.requiresOTP &&
					credentials.tokenType === 'worker' &&
					credentials.deviceStatus === 'ACTIVE' ? (
						<div style={{ marginTop: '24px', textAlign: 'center' }}>
							<p style={{ marginBottom: '16px', fontSize: '14px', color: '#6c757d' }}>
								✓ Your {config.displayName} device is registered and ready to use immediately.
							</p>
							<button
								type="button"
								onClick={() => {
									setMfaState((prev) => ({ ...prev, deviceStatus: 'ACTIVE' }));
									nav.markStepComplete();
									nav.goToNext();
								}}
								disabled={isLoading}
								style={{
									padding: '12px 24px',
									background: '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									fontSize: '16px',
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								Continue to Success →
							</button>
						</div>
					) : config.requiresOTP &&
						!(credentials.tokenType === 'worker' && credentials.deviceStatus === 'ACTIVE') ? (
						<UnifiedOTPActivationTemplate
							deviceType={config.deviceType}
							deviceDisplayName={config.displayName}
							instructions={
								config.deviceType === 'TOTP'
									? 'Enter the current 6-digit code from your authenticator app'
									: `Enter the 6-digit code sent to your ${config.displayName.toLowerCase()}`
							}
							contextText={
								config.deviceType === 'TOTP'
									? 'Codes refresh every 30 seconds. Wait for a new code if time is running out.'
									: config.deviceType === 'SMS'
										? "Codes expire after 10 minutes. Check your signal if you don't receive the code."
										: config.deviceType === 'EMAIL'
											? "Check your spam folder if you don't see the email in your inbox."
											: config.deviceType === 'WHATSAPP'
												? 'Make sure WhatsApp is installed and you have internet connectivity.'
												: 'Listen carefully and have a pen ready. The code will be read twice.'
							}
							onValidateOtp={async (_otpCode) => {
								await handleValidateOtp();
							}}
							onResendOtp={async () => {
								// For TOTP, the "resend" action should show the QR code again (navigate to registration/QR step)
								if (config.deviceType === 'TOTP') {
									try {
										nav.goToStep(0); // Show registration step where QR is displayed
										return;
									} catch (err) {
										console.error('[UNIFIED-ACTIVATION] Failed to navigate to QR step:', err);
									}
								}
								await handleResendOtp();
							}}
							isLoading={isLoading}
							otpError={otpError}
							canResend={canResend}
							resendCooldown={resendCooldown}
							otp={otp}
							onOtpChange={handleOtpChange}
							validationAttempts={validationAttempts}
							maxAttempts={3}
						/>
					) : null}
				</>
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
			<div
				className="step-actions"
				style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
			>
				<div style={{ display: 'flex', gap: '12px' }}>
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

				<button
					type="button"
					onClick={() => nav.goToStep(0)}
					disabled={isLoading}
					style={{
						padding: '8px 16px',
						background: '#6b7280',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						fontSize: '14px',
						cursor: isLoading ? 'not-allowed' : 'pointer',
						opacity: isLoading ? 0.5 : 1,
					}}
				>
					🔄 Restart Flow
				</button>
			</div>

			{/* Token Status Warning */}
			{!tokenStatus.isValid && (
				<div className="token-warning" role="alert">
					<div style={{ marginBottom: '12px' }}>
						⚠️ Worker token is invalid or expired. Please refresh your token before continuing.
					</div>
					<button
						type="button"
						onClick={() => {
							// Show worker token modal for refresh
							const event = new CustomEvent('showWorkerTokenModal', {
								detail: { reason: 'token_invalid' },
							});
							window.dispatchEvent(event);
						}}
						style={{
							background: '#8b5cf6',
							color: 'white',
							border: 'none',
							padding: '8px 16px',
							borderRadius: '6px',
							cursor: 'pointer',
							fontSize: '14px',
							fontWeight: '500',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#7c3aed';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#8b5cf6';
						}}
					>
						🔄 Refresh Worker Token
					</button>
				</div>
			)}
		</div>
	);
};

export default UnifiedActivationStep;
