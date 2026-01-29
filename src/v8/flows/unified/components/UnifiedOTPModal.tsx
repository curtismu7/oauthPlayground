/**
 * @file UnifiedOTPModal.tsx
 * @module v8/flows/unified/components
 * @description Reusable OTP input modal for all OTP-based device activations
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Provide a consistent OTP input modal across all OTP-based devices
 * (SMS, Email, WhatsApp, TOTP). Can be used standalone or embedded in steps.
 *
 * Features:
 * - 6-digit OTP input with auto-focus
 * - Resend OTP button with cooldown timer
 * - Validation attempts tracking
 * - Error messages and loading states
 * - Keyboard shortcuts (Enter to submit)
 * - Accessibility features
 *
 * @example
 * <UnifiedOTPModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   onValidate={handleValidateOtp}
 *   onResend={handleResendOtp}
 *   deviceType="SMS"
 *   isLoading={isValidating}
 *   error={otpError}
 * />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';

const MODULE_TAG = '[🔢 UNIFIED-OTP-MODAL]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedOTPModalProps {
	/** Whether modal is open */
	isOpen: boolean;

	/** Close modal callback */
	onClose: () => void;

	/** Validate OTP callback (returns true if valid) */
	onValidate: (otp: string) => Promise<boolean>;

	/** Resend OTP callback (optional, not needed for TOTP) */
	onResend?: () => Promise<void>;

	/** Device type for display messages */
	deviceType: DeviceConfigKey;

	/** Display name for the device (e.g., "SMS", "Email") */
	deviceDisplayName?: string;

	/** Loading state during validation */
	isLoading?: boolean;

	/** Error message to display */
	error?: string | null;

	/** Initial cooldown seconds for resend (default: 60) */
	resendCooldownSeconds?: number;

	/** Maximum validation attempts before warning (default: 3) */
	maxAttempts?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified OTP Modal
 *
 * Reusable modal for OTP input and validation across all OTP-based devices.
 */
export const UnifiedOTPModal: React.FC<UnifiedOTPModalProps> = ({
	isOpen,
	onClose,
	onValidate,
	onResend,
	deviceType,
	deviceDisplayName,
	isLoading = false,
	error = null,
	resendCooldownSeconds = 60,
	maxAttempts = 3,
}) => {
	console.log(`${MODULE_TAG} Rendering OTP modal for device:`, deviceType);

	// ========================================================================
	// LOCAL STATE
	// ========================================================================

	const [otp, setOtp] = useState('');
	const [validationAttempts, setValidationAttempts] = useState(0);
	const [canResend, setCanResend] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	// Ref for OTP input auto-focus
	const otpInputRef = useRef<HTMLInputElement>(null);

	// ========================================================================
	// COMPUTED PROPERTIES
	// ========================================================================

	const displayName = deviceDisplayName || deviceType;
	const isTOTP = deviceType === 'TOTP';
	const showResendButton = !isTOTP && onResend;
	const isMaxAttemptsReached = validationAttempts >= maxAttempts;

	/**
	 * Get instruction text based on device type
	 */
	const getInstructionText = (): string => {
		switch (deviceType) {
			case 'TOTP':
				return 'Enter the 6-digit code from your authenticator app.';
			case 'SMS':
				return 'Enter the 6-digit code sent to your phone via SMS.';
			case 'EMAIL':
				return 'Enter the 6-digit code sent to your email address.';
			case 'WHATSAPP':
				return 'Enter the 6-digit code sent to your WhatsApp.';
			default:
				return `Enter the 6-digit code sent to your ${displayName}.`;
		}
	};

	// ========================================================================
	// EFFECTS
	// ========================================================================

	/**
	 * Auto-focus OTP input when modal opens
	 */
	useEffect(() => {
		if (isOpen && otpInputRef.current) {
			setTimeout(() => {
				otpInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	/**
	 * Handle resend cooldown timer
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
	 * Reset state when modal closes
	 */
	useEffect(() => {
		if (!isOpen) {
			setOtp('');
			setValidationAttempts(0);
		}
	}, [isOpen]);

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
	}, []);

	/**
	 * Handle OTP validation
	 */
	const handleValidate = useCallback(async () => {
		if (otp.length !== 6) {
			return;
		}

		console.log(`${MODULE_TAG} Validating OTP:`, otp);

		setValidationAttempts((prev) => prev + 1);

		const isValid = await onValidate(otp);

		if (isValid) {
			console.log(`${MODULE_TAG} OTP validation successful`);
			// Success - parent component will handle close
		} else {
			console.log(`${MODULE_TAG} OTP validation failed`);
			// Clear OTP for retry
			setOtp('');
			// Focus back to input
			setTimeout(() => {
				otpInputRef.current?.focus();
			}, 100);
		}
	}, [otp, onValidate]);

	/**
	 * Handle resend OTP
	 */
	const handleResend = useCallback(async () => {
		if (!onResend || !canResend) {
			return;
		}

		console.log(`${MODULE_TAG} Resending OTP`);

		setCanResend(false);
		setResendCooldown(resendCooldownSeconds);
		setOtp('');

		await onResend();
	}, [onResend, canResend, resendCooldownSeconds]);

	/**
	 * Handle keyboard shortcuts
	 */
	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && otp.length === 6 && !isLoading) {
				handleValidate();
			} else if (e.key === 'Escape') {
				onClose();
			}
		},
		[otp, isLoading, handleValidate, onClose]
	);

	// ========================================================================
	// RENDER
	// ========================================================================

	if (!isOpen) {
		return null;
	}

	return (
		<>
			{/* Modal Backdrop */}
			<div className="modal-backdrop" onClick={onClose} role="presentation" aria-hidden="true" />

			{/* Modal Container */}
			<div
				className="unified-otp-modal"
				role="dialog"
				aria-labelledby="otp-modal-title"
				aria-describedby="otp-modal-description"
				aria-modal="true"
			>
				{/* Modal Header */}
				<div className="modal-header">
					<h2 id="otp-modal-title">Verify {displayName} Device</h2>
					<button
						type="button"
						onClick={onClose}
						className="modal-close-button"
						aria-label="Close modal"
						disabled={isLoading}
					>
						×
					</button>
				</div>

				{/* Modal Body */}
				<div className="modal-body">
					{/* Instruction Text */}
					<p id="otp-modal-description" className="instruction-text">
						{getInstructionText()}
					</p>

					{/* OTP Input */}
					<div className="otp-input-container">
						<label htmlFor="otp-input" className="otp-label">
							One-Time Password
						</label>
						<input
							ref={otpInputRef}
							id="otp-input"
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							autoComplete="one-time-code"
							maxLength={6}
							value={otp}
							onChange={(e) => handleOtpChange(e.target.value)}
							onKeyPress={handleKeyPress}
							disabled={isLoading}
							placeholder="000000"
							className={`otp-input ${error ? 'input-error' : ''}`}
							aria-invalid={!!error}
							aria-describedby={error ? 'otp-error' : undefined}
						/>

						{/* Error Message */}
						{error && (
							<span id="otp-error" className="error-message" role="alert">
								{error}
							</span>
						)}

						{/* Validation Attempts Warning */}
						{validationAttempts > 0 && (
							<p className="validation-attempts">
								{isMaxAttemptsReached ? (
									<span className="warning-text">
										⚠️ Maximum attempts reached. Please request a new code.
									</span>
								) : (
									<span className="info-text">
										Validation attempts: {validationAttempts} / {maxAttempts}
									</span>
								)}
							</p>
						)}
					</div>

					{/* Resend OTP Section */}
					{showResendButton && (
						<div className="resend-section">
							<p className="resend-text">Didn't receive the code?</p>
							<button
								type="button"
								onClick={handleResend}
								disabled={!canResend || isLoading}
								className="button-link"
							>
								{canResend ? 'Resend Code' : `Resend available in ${resendCooldown}s`}
							</button>
						</div>
					)}

					{/* TOTP Tip */}
					{isTOTP && (
						<div className="totp-tip">
							<p className="tip-text">
								<strong>Tip:</strong> Open your authenticator app (Google Authenticator, Authy,
								etc.) and enter the current 6-digit code displayed for this account.
							</p>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="modal-footer">
					<button type="button" onClick={onClose} disabled={isLoading} className="button-secondary">
						Cancel
					</button>

					<button
						type="button"
						onClick={handleValidate}
						disabled={otp.length !== 6 || isLoading}
						className="button-primary"
					>
						{isLoading ? 'Validating...' : 'Verify Code'}
					</button>
				</div>
			</div>
		</>
	);
};

export default UnifiedOTPModal;
