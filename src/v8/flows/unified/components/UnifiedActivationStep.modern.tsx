/**
 * @file UnifiedActivationStep.modern.tsx
 * @module v8/flows/unified/components
 * @description MODERNIZED Step 3: Device Activation - Design system UI, 0 raw <button type="button"> elements
 * @version 9.2.0
 * @since 2026-01-29
 *
 * Key Changes from UnifiedActivationStep.tsx:
 * - Uses design system Button component throughout
 * - Uses design tokens for all colors, spacing, typography
 * - Uses PageTransition wrapper
 * - Modern header card with gradient
 * - TOTP QR section uses design tokens
 * - Token warning uses design tokens
 * - All logic (handlers, effects, resend cooldown) preserved unchanged
 */

import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useState } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { Button } from '@/v8/components/Button';
import { PageTransition } from '@/v8/components/PageTransition';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import { borderRadius, colors, spacing, typography } from '@/v8/design/tokens';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import {
	FiAlertCircle,
	FiArrowLeft,
	FiArrowRight,
	FiCheck,
	FiRefreshCw,
	FiSmartphone,
} from '../../../../icons';
import { logger } from '../../../../utils/logger';
import { UnifiedOTPActivationTemplate } from './UnifiedOTPActivationTemplate';

const MODULE_TAG = '[🔐 UNIFIED-ACTIVATION-MODERN]';

// ============================================================================
// PROPS
// ============================================================================

export interface UnifiedActivationStepModernProps extends MFAFlowBaseRenderProps {
	config: DeviceFlowConfig;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UnifiedActivationStepModern: React.FC<UnifiedActivationStepModernProps> = ({
	credentials,
	mfaState,
	setMfaState,
	tokenStatus,
	isLoading,
	setIsLoading,
	nav,
	config,
}) => {
	logger.info(`${MODULE_TAG} Rendering for:`, config.deviceType);
	logger.info(`${MODULE_TAG} Device status:`, mfaState.deviceStatus);

	// -------------------------------------------------------------------------
	// Local state
	// -------------------------------------------------------------------------

	const [otp, setOtp] = useState('');
	const [otpError, setOtpError] = useState<string | null>(null);
	const [validationAttempts, setValidationAttempts] = useState(0);
	const [canResend, setCanResend] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	// -------------------------------------------------------------------------
	// Effects (identical logic to legacy version)
	// -------------------------------------------------------------------------

	useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
			return () => clearTimeout(timer);
		}
		setCanResend(true);
	}, [resendCooldown]);

	useEffect(() => {
		if (config.deviceType === 'TOTP' && (mfaState.qrCodeUrl || mfaState.totpSecret)) {
			const scrollToTop = () => {
				window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
				document.documentElement.scrollTop = 0;
				document.body.scrollTop = 0;
				document
					.querySelector('.step-header')
					?.scrollIntoView({ behavior: 'instant', block: 'start' });
				document
					.querySelector('.unified-activation-step')
					?.scrollIntoView({ behavior: 'instant', block: 'start' });
				document.querySelectorAll('[style*="overflow"]').forEach((el) => {
					if (el instanceof HTMLElement) el.scrollTop = 0;
				});
			};
			scrollToTop();
			requestAnimationFrame(scrollToTop);
			[10, 50, 100, 200, 300, 500].forEach((ms) => {
				setTimeout(scrollToTop, ms);
			});
		}
	}, [config.deviceType, mfaState.qrCodeUrl, mfaState.totpSecret]);

	useEffect(() => {
		if (credentials.flowType === 'admin') return;
		if (mfaState.deviceStatus === 'ACTIVE') {
			logger.info(`${MODULE_TAG} Device already activated, proceeding to success`);
			nav.markStepComplete();
			setTimeout(() => nav.goToNext(), 1500);
		}
	}, [mfaState.deviceStatus, nav, credentials.flowType]);

	// -------------------------------------------------------------------------
	// Handlers (identical logic to legacy version)
	// -------------------------------------------------------------------------

	const handleOtpChange = useCallback((value: string) => {
		const sanitized = value.replace(/\D/g, '').slice(0, 6);
		setOtp(sanitized);
		setOtpError(null);
	}, []);

	const handleValidateOtp = useCallback(async () => {
		if (!otp || otp.length !== 6) {
			setOtpError('Please enter a valid 6-digit code');
			return;
		}
		setIsLoading(true);
		try {
			const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');
			const result = await MFAServiceV8.activateDevice({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId: mfaState.deviceId,
				otp,
				...(mfaState.deviceActivateUri && { deviceActivateUri: mfaState.deviceActivateUri }),
			});

			const activationResult = result as Record<string, unknown>;
			if (!result || activationResult.error) {
				throw new Error(
					String(activationResult.error || activationResult.message || 'Device activation failed')
				);
			}

			setMfaState((prev) => ({
				...prev,
				deviceStatus: 'ACTIVE',
				activatedAt: new Date().toISOString(),
			}));

			modernMessaging.showFooterMessage({
				type: 'info',
				message: `${config.displayName} device activated successfully`,
				duration: 3000,
			});

			nav.markStepComplete();
			nav.goToNext();
			setValidationAttempts((prev) => prev + 1);
		} catch (error: unknown) {
			setValidationAttempts((prev) => prev + 1);
			const msg = error instanceof Error ? error.message : 'Invalid OTP code';
			setOtpError(msg);
			nav.setValidationErrors([msg]);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Activation Failed',
				message: msg,
				dismissible: true,
			});
			setOtp('');
		} finally {
			setIsLoading(false);
		}
	}, [otp, mfaState, credentials, config, nav, setMfaState, setIsLoading]);

	const handleResendOtp = useCallback(async () => {
		setIsLoading(true);
		setCanResend(false);
		setResendCooldown(60);
		try {
			const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');
			await MFAServiceV8.resendPairingCode({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId: mfaState.deviceId,
			});
			modernMessaging.showFooterMessage({
				type: 'info',
				message: `New ${config.displayName} verification code sent`,
				duration: 3000,
			});
			setOtp('');
			setOtpError(null);
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : 'Failed to resend verification code';
			setOtpError(msg);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: msg,
				dismissible: true,
			});
			setCanResend(true);
			setResendCooldown(0);
		} finally {
			setIsLoading(false);
		}
	}, [mfaState.deviceId, credentials, config.displayName, setIsLoading]);

	// -------------------------------------------------------------------------
	// Render helpers
	// -------------------------------------------------------------------------

	const renderFIDO2Success = () => (
		<div
			style={{
				textAlign: 'center',
				padding: spacing['2xl'],
				background: colors.success[50],
				borderRadius: borderRadius.xl,
				border: `1px solid ${colors.success[200]}`,
			}}
		>
			<div
				style={{
					width: '64px',
					height: '64px',
					borderRadius: '50%',
					background: colors.success[500],
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					margin: `0 auto ${spacing.lg}`,
				}}
			>
				<FiCheck size={32} color="white" />
			</div>
			<h3
				style={{
					margin: `0 0 ${spacing.md} 0`,
					fontSize: typography.fontSize['2xl'],
					fontWeight: typography.fontWeight.bold,
					color: colors.success[800],
				}}
			>
				Security Key Registered
			</h3>
			<p style={{ margin: 0, color: colors.success[700] }}>
				Your FIDO2 security key has been successfully registered and is ready to use.
			</p>
		</div>
	);

	const renderMobilePairing = () => (
		<div
			style={{
				padding: spacing.xl,
				background: colors.primary[50],
				borderRadius: borderRadius.xl,
				border: `1px solid ${colors.primary[200]}`,
				textAlign: 'center',
			}}
		>
			<FiSmartphone size={48} color={colors.primary[500]} style={{ marginBottom: spacing.md }} />
			<h3
				style={{
					margin: `0 0 ${spacing.md} 0`,
					fontSize: typography.fontSize.xl,
					fontWeight: typography.fontWeight.semibold,
					color: colors.primary[800],
				}}
			>
				Pairing Your Mobile Device
			</h3>
			<p style={{ margin: `0 0 ${spacing.lg} 0`, color: colors.primary[700] }}>
				Please scan the QR code displayed in the previous step using the PingOne Mobile app to
				complete pairing.
			</p>
			{mfaState.deviceStatus === 'ACTIVE' ? (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: spacing.sm,
						color: colors.success[700],
						fontWeight: typography.fontWeight.semibold,
					}}
				>
					<FiCheck size={20} />
					Device paired successfully! Redirecting…
				</div>
			) : (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: spacing.sm,
						color: colors.primary[600],
					}}
				>
					<FiRefreshCw size={16} />
					Waiting for pairing…
				</div>
			)}
		</div>
	);

	const renderTotpQrSection = () => {
		if (!(mfaState.qrCodeUrl || mfaState.totpSecret)) return null;
		return (
			<div
				style={{
					marginBottom: spacing.xl,
					padding: spacing.xl,
					background: colors.neutral[50],
					borderRadius: borderRadius.xl,
					border: `1px solid ${colors.neutral[200]}`,
				}}
			>
				<h3
					style={{
						margin: `0 0 ${spacing.lg} 0`,
						fontSize: typography.fontSize.xl,
						fontWeight: typography.fontWeight.semibold,
						color: colors.neutral[900],
					}}
				>
					📱 Scan QR Code
				</h3>

				{mfaState.qrCodeUrl && (
					<div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
						<div
							style={{
								display: 'inline-block',
								padding: spacing.lg,
								background: 'white',
								border: `2px solid ${colors.neutral[200]}`,
								borderRadius: borderRadius.lg,
							}}
						>
							<QRCodeSVG value={mfaState.qrCodeUrl} size={200} level="M" includeMargin={false} />
						</div>
						<p
							style={{
								margin: `${spacing.md} 0 0 0`,
								fontSize: typography.fontSize.sm,
								color: colors.neutral[500],
							}}
						>
							Scan this code with your authenticator app
						</p>
					</div>
				)}

				{mfaState.totpSecret && (
					<details style={{ marginTop: spacing.md }}>
						<summary
							style={{
								cursor: 'pointer',
								fontWeight: typography.fontWeight.medium,
								color: colors.neutral[700],
							}}
						>
							Can't scan? Enter manually
						</summary>
						<div
							style={{
								marginTop: spacing.md,
								padding: spacing.md,
								background: 'white',
								borderRadius: borderRadius.md,
								border: `1px solid ${colors.neutral[200]}`,
							}}
						>
							<code
								style={{
									display: 'block',
									fontFamily: 'monospace',
									fontSize: typography.fontSize.sm,
									wordBreak: 'break-all',
									color: colors.neutral[900],
									marginBottom: spacing.md,
								}}
							>
								{mfaState.totpSecret}
							</code>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									navigator.clipboard.writeText(mfaState.totpSecret || '');
									modernMessaging.showFooterMessage({
										type: 'info',
										message: 'Secret copied to clipboard',
										duration: 3000,
									});
								}}
							>
								📋 Copy Secret
							</Button>
						</div>
					</details>
				)}

				<p
					style={{
						margin: `${spacing.lg} 0 0 0`,
						fontSize: typography.fontSize.xs,
						color: colors.neutral[500],
						fontStyle: 'italic',
					}}
				>
					Supported: Google Authenticator, Microsoft Authenticator, Authy, 1Password, and others.
				</p>
			</div>
		);
	};

	const renderAdminActiveBypass = () => (
		<div style={{ textAlign: 'center', padding: spacing.xl }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: spacing.sm,
					marginBottom: spacing.lg,
					color: colors.success[700],
					fontSize: typography.fontSize.sm,
				}}
			>
				<FiCheck size={16} />
				Your {config.displayName} device is registered and ready to use immediately.
			</div>
			<Button
				variant="primary"
				size="lg"
				onClick={() => {
					setMfaState((prev) => ({ ...prev, deviceStatus: 'ACTIVE' }));
					nav.markStepComplete();
					nav.goToNext();
				}}
				disabled={isLoading}
				rightIcon={<FiArrowRight size={16} />}
			>
				Continue to Success
			</Button>
		</div>
	);

	const renderOTPSection = () => {
		const isAdminActive =
			credentials.tokenType === 'worker' && credentials.deviceStatus === 'ACTIVE';

		return (
			<>
				{config.deviceType === 'TOTP' && renderTotpQrSection()}

				{isAdminActive ? (
					renderAdminActiveBypass()
				) : (
					<UnifiedOTPActivationTemplate
						deviceType={config.deviceType as 'SMS' | 'EMAIL' | 'WHATSAPP' | 'VOICE' | 'TOTP'}
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
						onValidateOtp={async () => {
							await handleValidateOtp();
						}}
						onResendOtp={async () => {
							if (config.deviceType === 'TOTP') {
								try {
									nav.goToStep(0);
								} catch (err) {
									logger.error(`${MODULE_TAG} Failed to navigate to QR step:`, err);
								}
								return;
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
				)}
			</>
		);
	};

	const renderActivationUI = () => {
		if (config.deviceType === 'FIDO2') return renderFIDO2Success();
		if (config.deviceType === 'MOBILE') return renderMobilePairing();
		if (config.requiresOTP) return renderOTPSection();
		return (
			<div
				style={{
					textAlign: 'center',
					padding: spacing['2xl'],
					background: colors.success[50],
					borderRadius: borderRadius.xl,
					border: `1px solid ${colors.success[200]}`,
				}}
			>
				<FiCheck size={32} color={colors.success[500]} style={{ marginBottom: spacing.md }} />
				<p style={{ margin: 0, color: colors.success[700] }}>
					Your {config.displayName} device is already active and ready to use.
				</p>
			</div>
		);
	};

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	return (
		<PageTransition>
			<div
				className="unified-activation-step"
				style={{ maxWidth: '720px', margin: '0 auto', padding: spacing.xl }}
			>
				{/* Header */}
				<div
					className="step-header"
					style={{
						background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						marginBottom: spacing.xl,
						boxShadow: `0 4px 12px ${colors.primary[500]}33`,
					}}
				>
					<h2
						style={{
							margin: `0 0 ${spacing.sm} 0`,
							fontSize: typography.fontSize['2xl'],
							fontWeight: typography.fontWeight.bold,
							color: 'white',
						}}
					>
						{config.icon} Activate {config.displayName}
					</h2>
					<p
						style={{
							margin: 0,
							color: 'rgba(255, 255, 255, 0.9)',
							fontSize: typography.fontSize.sm,
						}}
					>
						Complete the activation process.
					</p>
				</div>

				{/* Activation UI */}
				<div style={{ marginBottom: spacing.xl }}>{renderActivationUI()}</div>

				{/* Token warning */}
				{!tokenStatus.isValid && (
					<div
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							gap: spacing.md,
							padding: spacing.lg,
							background: colors.warning[50],
							border: `1px solid ${colors.warning[200]}`,
							borderRadius: borderRadius.lg,
							marginBottom: spacing.xl,
							color: colors.warning[800],
							fontSize: typography.fontSize.sm,
						}}
					>
						<FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
						<div style={{ flex: 1 }}>
							<div style={{ marginBottom: spacing.sm }}>
								Worker token is invalid or expired — please refresh your token before continuing.
							</div>
							<Button
								variant="secondary"
								size="sm"
								leftIcon={<FiRefreshCw size={14} />}
								onClick={() => {
									window.dispatchEvent(
										new CustomEvent('showWorkerTokenModal', { detail: { reason: 'token_invalid' } })
									);
								}}
							>
								Refresh Worker Token
							</Button>
						</div>
					</div>
				)}

				{/* Navigation */}
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
					<div style={{ display: 'flex', gap: spacing.md }}>
						<Button
							variant="secondary"
							size="md"
							onClick={() => nav.goToPrevious()}
							disabled={isLoading}
							leftIcon={<FiArrowLeft size={16} />}
						>
							Previous
						</Button>

						{config.requiresOTP && otp.length === 6 && (
							<Button
								variant="primary"
								size="md"
								onClick={handleValidateOtp}
								disabled={isLoading || !tokenStatus.isValid}
								loading={isLoading}
							>
								Verify Code
							</Button>
						)}

						{!config.requiresOTP && mfaState.deviceStatus === 'ACTIVE' && (
							<Button
								variant="primary"
								size="md"
								onClick={() => nav.goToNext()}
								disabled={isLoading}
								rightIcon={<FiArrowRight size={16} />}
							>
								Continue
							</Button>
						)}
					</div>

					<Button
						variant="ghost"
						size="md"
						onClick={() => nav.goToStep(0)}
						disabled={isLoading}
						leftIcon={<FiRefreshCw size={16} />}
					>
						Restart
					</Button>
				</div>
			</div>
		</PageTransition>
	);
};

export default UnifiedActivationStepModern;
