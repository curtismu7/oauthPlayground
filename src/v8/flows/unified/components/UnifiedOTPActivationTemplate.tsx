/**
 * @file UnifiedOTPActivationTemplate.tsx
 * @module v8/flows/unified/components
 * @description Reusable OTP activation template for all OTP-based device types
 * @version 9.2.4
 * @since 2026-01-30
 *
 * Purpose: Create a reusable, template-based OTP activation component that can be used
 * by SMS, Email, WhatsApp, Voice, and TOTP device types. This ensures consistent UX
 * and behavior across all OTP flows while allowing for device-specific customizations.
 *
 * Features:
 * - 6-digit OTP input with validation
 * - Resend OTP functionality with cooldown
 * - Device-specific messaging and instructions
 * - Auto-advance on success
 * - Error handling and retry logic
 * - Accessibility support
 *
 * @example
 * <UnifiedOTPActivationTemplate
 *   deviceType="SMS"
 *   deviceDisplayName="SMS OTP"
 *   instructions="Enter the 6-digit code sent to your phone"
 *   onValidateOtp={handleValidateOtp}
 *   onResendOtp={handleResendOtp}
 *   isLoading={isLoading}
 *   otpError={otpError}
 *   canResend={canResend}
 *   resendCooldown={resendCooldown}
 * />
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/v8/components/Button';
import { colors, spacing } from '@/v8/styles/designTokens';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 UNIFIED-OTP-TEMPLATE]';

// ============================================================================
// TYPES
// ============================================================================

export type OTPDeviceType = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'VOICE' | 'TOTP';

export interface UnifiedOTPActivationTemplateProps {
	/** Device type for customization */
	deviceType: OTPDeviceType;
	/** Display name for the device */
	deviceDisplayName: string;
	/** Instructions for the user */
	instructions: string;
	/** Additional context or help text */
	contextText?: string;
	/** Callback when OTP is submitted */
	onValidateOtp: (otp: string) => Promise<void>;
	/** Callback when resend is requested */
	onResendOtp: () => Promise<void>;
	/** Loading state */
	isLoading: boolean;
	/** Current OTP error message */
	otpError: string | null;
	/** Whether resend is allowed */
	canResend: boolean;
	/** Resend cooldown in seconds */
	resendCooldown: number;
	/** Current OTP value */
	otp: string;
	/** OTP change handler */
	onOtpChange: (value: string) => void;
	/** Validation attempts count */
	validationAttempts: number;
	/** Maximum allowed attempts */
	maxAttempts?: number;
}

// ============================================================================
// DEVICE-SPECIFIC CONFIGURATIONS
// ============================================================================

const DEVICE_CONFIGS = {
	SMS: {
		icon: '📱',
		color: colors.primary,
		instructions: 'Enter the 6-digit code sent to your mobile phone via SMS',
		contextText:
			"Enhanced SMS with database persistence. Codes expire after 10 minutes. Check your signal if you don't receive the code.",
		resendText: 'Resend SMS',
	},
	EMAIL: {
		icon: '📧',
		color: colors.success,
		instructions: 'Enter the 6-digit code sent to your email address',
		contextText: "Check your spam folder if you don't see the email in your inbox.",
		resendText: 'Resend Email',
	},
	WHATSAPP: {
		icon: '💬',
		color: colors.success,
		instructions: 'Enter the 6-digit code sent via WhatsApp',
		contextText: 'Make sure WhatsApp is installed and you have internet connectivity.',
		resendText: 'Resend WhatsApp',
	},
	VOICE: {
		icon: '📞',
		color: colors.warning,
		instructions: 'Enter the 6-digit code from the voice call',
		contextText: 'Listen carefully and have a pen ready. The code will be read twice.',
		resendText: 'Call Again',
	},
	TOTP: {
		icon: '🔐',
		color: colors.info,
		instructions: 'Enter the current 6-digit code from your authenticator app',
		contextText: 'Codes refresh every 30 seconds. Wait for a new code if time is running out.',
		resendText: 'Show QR Code Again',
	},
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Unified OTP Activation Template
 *
 * Provides a consistent, reusable OTP activation interface for all device types.
 * Handles OTP input, validation, resend functionality, and device-specific messaging.
 */
export const UnifiedOTPActivationTemplate: React.FC<UnifiedOTPActivationTemplateProps> = ({
	deviceType,
	deviceDisplayName,
	instructions,
	contextText,
	onValidateOtp,
	onResendOtp,
	isLoading,
	otpError,
	canResend,
	resendCooldown,
	otp,
	onOtpChange,
	validationAttempts,
	maxAttempts = 3,
}) => {
	const config = DEVICE_CONFIGS[deviceType];

	// ========================================================================
	// LOCAL STATE
	// ========================================================================

	const [focused, setFocused] = useState(false);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	/**
	 * Handle OTP input change with validation
	 */
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			// Only allow digits and limit to 6 characters
			const sanitized = value.replace(/\D/g, '').slice(0, 6);
			onOtpChange(sanitized);
		},
		[onOtpChange]
	);

	/**
	 * Handle form submission
	 */
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!otp || otp.length !== 6) {
				toastV8.error('Please enter a valid 6-digit code');
				return;
			}

			if (validationAttempts >= maxAttempts) {
				toastV8.error('Maximum attempts reached. Please start over.');
				return;
			}

			try {
				await onValidateOtp(otp);
			} catch (error) {
				console.error(`${MODULE_TAG} OTP validation failed:`, error);
				// Error handling is managed by parent component
			}
		},
		[otp, validationAttempts, maxAttempts, onValidateOtp]
	);

	/**
	 * Handle resend OTP
	 */
	const handleResend = useCallback(async () => {
		if (!canResend || isLoading) return;

		try {
			await onResendOtp();
			toastV8.success(`${deviceDisplayName} code resent successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Resend failed:`, error);
			toastV8.error('Failed to resend code. Please try again.');
		}
	}, [canResend, isLoading, onResendOtp, deviceDisplayName]);

	/**
	 * Handle paste event for OTP
	 */
	const handlePaste = useCallback(
		(e: React.ClipboardEvent) => {
			e.preventDefault();
			const pastedData = e.clipboardData.getData('text');
			const sanitized = pastedData.replace(/\D/g, '').slice(0, 6);
			onOtpChange(sanitized);
		},
		[onOtpChange]
	);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div style={{ maxWidth: '500px', margin: '0 auto', padding: spacing[6] }}>
			{/* Header */}
			<div style={{ textAlign: 'center', marginBottom: spacing[8] }}>
				<div
					style={{
						fontSize: '48px',
						marginBottom: spacing[4],
						opacity: focused ? 1 : 0.8,
						transition: 'opacity 0.2s ease',
					}}
				>
					{config.icon}
				</div>
				<h2
					style={{
						margin: 0,
						fontSize: '24px',
						fontWeight: '700',
						color: colors.gray[900],
						marginBottom: spacing[3],
					}}
				>
					Verify {deviceDisplayName}
				</h2>
				<p
					style={{
						margin: 0,
						fontSize: '16px',
						color: colors.gray[600],
						lineHeight: 1.5,
						marginBottom: spacing[4],
					}}
				>
					{instructions}
				</p>
				{contextText && (
					<p
						style={{
							margin: 0,
							fontSize: '14px',
							color: colors.gray[500],
							lineHeight: 1.4,
							fontStyle: 'italic',
						}}
					>
						💡 {contextText}
					</p>
				)}
			</div>

			{/* OTP Input Form */}
			<form onSubmit={handleSubmit}>
				{/* OTP Input */}
				<div style={{ marginBottom: spacing[6] }}>
					<label
						htmlFor="otp-input"
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: colors.gray[700],
							marginBottom: spacing[3],
						}}
						htmlFor="verificationcode"
					>
						Verification Code
					</label>
					<input
						id="otp-input"
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={6}
						value={otp}
						onChange={handleInputChange}
						onPaste={handlePaste}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						disabled={isLoading}
						style={{
							width: '100%',
							padding: spacing[4],
							fontSize: '24px',
							fontWeight: '600',
							textAlign: 'center',
							letterSpacing: '8px',
							border: `2px solid ${otpError ? '#ef4444' : focused ? config.color : '#d1d5db'}`,
							borderRadius: '12px',
							outline: 'none',
							transition: 'all 0.2s ease',
							background: '#ffffff',
							color: '#111827',
						}}
						placeholder="000000"
						aria-label="6-digit verification code"
						aria-describedby={otpError ? 'otp-error' : undefined}
					/>
					{otpError && (
						<div
							id="otp-error"
							style={{
								marginTop: spacing[2],
								padding: `${spacing[2]} ${spacing[3]}`,
								background: '#fef2f2',
								border: `1px solid #fecaca`,
								borderRadius: '6px',
								color: '#ef4444',
								fontSize: '14px',
							}}
							role="alert"
						>
							⚠️ {otpError}
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[4] }}>
					<Button
						type="submit"
						variant="primary"
						disabled={isLoading || otp.length !== 6}
						loading={isLoading}
						style={{
							flex: 1,
							padding: spacing[4],
							fontSize: '16px',
							fontWeight: '600',
						}}
					>
						{isLoading ? 'Verifying...' : 'Verify Code'}
					</Button>

					<Button
						type="button"
						variant="secondary"
						disabled={!canResend || isLoading}
						onClick={handleResend}
						style={{
							padding: spacing[4],
							fontSize: '14px',
							minWidth: '120px',
						}}
					>
						{canResend ? config.resendText : `${resendCooldown}s`}
					</Button>
				</div>

				{/* Attempts Warning */}
				{validationAttempts > 0 && (
					<div
						style={{
							textAlign: 'center',
							fontSize: '14px',
							color: validationAttempts >= maxAttempts - 1 ? '#f59e0b' : '#6b7280',
						}}
					>
						Attempts remaining: {maxAttempts - validationAttempts} of {maxAttempts}
					</div>
				)}
			</form>

			{/* Help Section */}
			<div
				style={{
					marginTop: spacing[8],
					padding: spacing[4],
					background: colors.gray[50],
					borderRadius: '8px',
					border: `1px solid ${colors.gray[200]}`,
				}}
			>
				<h3
					style={{
						margin: `0 0 ${spacing[3]}`,
						fontSize: '16px',
						fontWeight: '600',
						color: colors.gray[800],
					}}
				>
					Need Help?
				</h3>
				<ul
					style={{
						margin: 0,
						paddingLeft: spacing[4],
						fontSize: '14px',
						color: colors.gray[600],
						lineHeight: 1.5,
					}}
				>
					<li style={{ marginBottom: spacing[2] }}>
						Make sure you have a stable internet connection
					</li>
					<li style={{ marginBottom: spacing[2] }}>
						Check that your {deviceDisplayName.toLowerCase()} is properly configured
					</li>
					<li style={{ marginBottom: spacing[2] }}>
						Codes are time-sensitive and expire after a few minutes
					</li>
					<li>Contact support if you continue to experience issues</li>
				</ul>
			</div>
		</div>
	);
};

export default UnifiedOTPActivationTemplate;
