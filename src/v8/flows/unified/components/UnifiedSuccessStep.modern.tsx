/**
 * @file UnifiedSuccessStep.modern.tsx
 * @module v8/flows/unified/components
 * @description MODERNIZED Step 4: Success - Design system UI, 0 className-based styling
 * @version 9.2.0
 * @since 2026-01-29
 *
 * Key Changes from UnifiedSuccessStep.tsx:
 * - Uses design system Button component (no raw <button type="button"> elements)
 * - Uses design tokens for all colors, spacing, typography
 * - Uses PageTransition wrapper
 * - Modern success card with animated checkmark area
 * - Device details displayed in a clean token-styled card
 * - Next-steps section styled with tokens
 * - All logic preserved unchanged
 */

import { FiCheck, FiExternalLink, FiPlus } from '@icons';
import React, { useCallback, useEffect } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { Button } from '@/v8/components/Button';
import { PageTransition } from '@/v8/components/PageTransition';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import { borderRadius, colors, spacing, typography } from '@/v8/design/tokens';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';

import { logger } from '../../../../utils/logger';

const MODULE_TAG = '[✅ UNIFIED-SUCCESS-MODERN]';

// ============================================================================
// PROPS
// ============================================================================

export interface UnifiedSuccessStepModernProps extends MFAFlowBaseRenderProps {
	config: DeviceFlowConfig;
	onComplete?: () => void;
	onRegisterAnother?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getContactInfo = (
	config: DeviceFlowConfig,
	credentials: MFAFlowBaseRenderProps['credentials']
): string | null => {
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

const getNextStepNote = (deviceType: string): string => {
	switch (deviceType) {
		case 'SMS':
			return "You'll receive a one-time code via SMS each time you need to authenticate.";
		case 'EMAIL':
			return "You'll receive a one-time code via email each time you need to authenticate.";
		case 'WHATSAPP':
			return "You'll receive a one-time code via WhatsApp each time you need to authenticate.";
		case 'TOTP':
			return 'Open your authenticator app and enter the code shown when you need to authenticate.';
		case 'FIDO2':
			return 'Use your security key or biometric when prompted during authentication.';
		case 'MOBILE':
			return 'Approve authentication requests in the PingOne Mobile app when prompted.';
		default:
			return '';
	}
};

// ============================================================================
// COMPONENT
// ============================================================================

export const UnifiedSuccessStepModern: React.FC<UnifiedSuccessStepModernProps> = ({
	credentials,
	mfaState,
	tokenStatus,
	nav,
	config,
	onComplete,
	onRegisterAnother,
}) => {
	logger.info(`${MODULE_TAG} Rendering for:`, config.deviceType);

	// -------------------------------------------------------------------------
	// Effects
	// -------------------------------------------------------------------------

	useEffect(() => {
		nav.markStepComplete();

		if (
			typeof window !== 'undefined' &&
			(window as unknown as { gtag?: (e: string, t: string, d: object) => void }).gtag
		) {
			(window as unknown as { gtag: (e: string, t: string, d: object) => void }).gtag(
				'event',
				'mfa_registration_success',
				{
					device_type: config.deviceType,
					device_id: mfaState.deviceId,
					flow_version: 'v9-unified-modern',
				}
			);
		}

		onComplete?.();
	}, [config.deviceType, mfaState.deviceId, nav.markStepComplete, onComplete]);

	// -------------------------------------------------------------------------
	// Handlers
	// -------------------------------------------------------------------------

	const handleRegisterAnother = useCallback(() => {
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Starting new device registration',
			duration: 3000,
		});
		if (onRegisterAnother) {
			onRegisterAnother();
		} else {
			window.location.href = '/v8/unified-mfa';
		}
	}, [onRegisterAnother]);

	// -------------------------------------------------------------------------
	// Derived values
	// -------------------------------------------------------------------------

	const contactInfo = getContactInfo(config, credentials);
	const deviceName = credentials.deviceName || credentials.nickname || `My ${config.displayName}`;
	const nextStepNote = getNextStepNote(config.deviceType);
	const isActive = mfaState.deviceStatus === 'ACTIVE';

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	return (
		<PageTransition>
			<div style={{ maxWidth: '720px', margin: '0 auto', padding: spacing.xl }}>
				{/* Success Hero */}
				<div
					style={{
						background: `linear-gradient(135deg, ${colors.success[500]} 0%, ${colors.success[700]} 100%)`,
						borderRadius: borderRadius.xl,
						padding: spacing['2xl'],
						marginBottom: spacing.xl,
						textAlign: 'center',
						boxShadow: `0 4px 20px ${colors.success[500]}44`,
					}}
				>
					{/* Checkmark circle */}
					<div
						style={{
							width: '72px',
							height: '72px',
							borderRadius: '50%',
							background: 'rgba(255, 255, 255, 0.2)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							margin: `0 auto ${spacing.lg}`,
							border: '3px solid rgba(255, 255, 255, 0.5)',
						}}
					>
						<FiCheck size={36} color="white" strokeWidth={3} />
					</div>

					<div style={{ fontSize: '40px', marginBottom: spacing.sm }}>{config.icon}</div>

					<h2
						style={{
							margin: `0 0 ${spacing.sm} 0`,
							fontSize: typography.fontSize['3xl'],
							fontWeight: typography.fontWeight.bold,
							color: 'white',
						}}
					>
						Device Registered!
					</h2>
					<p
						style={{
							margin: 0,
							color: 'rgba(255, 255, 255, 0.9)',
							fontSize: typography.fontSize.base,
						}}
					>
						Your {config.displayName} device is now active and ready for multi-factor
						authentication.
					</p>
				</div>

				{/* Device Details Card */}
				<div
					style={{
						background: 'white',
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						marginBottom: spacing.xl,
						border: `1px solid ${colors.neutral[200]}`,
						boxShadow: `0 1px 3px ${colors.neutral[200]}`,
					}}
				>
					<h3
						style={{
							margin: `0 0 ${spacing.lg} 0`,
							fontSize: typography.fontSize.lg,
							fontWeight: typography.fontWeight.semibold,
							color: colors.neutral[900],
						}}
					>
						Device Details
					</h3>

					{/* Detail rows */}
					{(
						[
							['Device Type', `${config.icon} ${config.displayName}`],
							deviceName ? ['Device Name', deviceName] : null,
							mfaState.deviceId ? ['Device ID', mfaState.deviceId] : null,
							['Status', mfaState.deviceStatus || 'ACTIVE'],
							contactInfo ? ['Contact', contactInfo] : null,
							credentials.environmentId ? ['Environment', credentials.environmentId] : null,
							credentials.username ? ['Username', credentials.username] : null,
						] as ([string, string] | null)[]
					)
						.filter(Boolean)
						.map(([label, value]) => (
							<div
								key={label}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: `${spacing.sm} 0`,
									borderBottom: `1px solid ${colors.neutral[100]}`,
									gap: spacing.md,
								}}
							>
								<span
									style={{
										fontSize: typography.fontSize.sm,
										color: colors.neutral[500],
										fontWeight: typography.fontWeight.medium,
										flexShrink: 0,
									}}
								>
									{label}
								</span>
								<span
									style={{
										fontSize: typography.fontSize.sm,
										color:
											label === 'Status'
												? isActive
													? colors.success[700]
													: colors.warning[700]
												: colors.neutral[900],
										fontWeight:
											label === 'Status'
												? typography.fontWeight.semibold
												: typography.fontWeight.normal,
										fontFamily:
											label === 'Device ID' || label === 'Environment' ? 'monospace' : 'inherit',
										textAlign: 'right',
										wordBreak: 'break-all',
									}}
								>
									{label === 'Status' ? (isActive ? '✓ Active' : '⏳ Activation Required') : value}
								</span>
							</div>
						))}
				</div>

				{/* Next Steps */}
				<div
					style={{
						background: colors.primary[50],
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						marginBottom: spacing.xl,
						border: `1px solid ${colors.primary[100]}`,
					}}
				>
					<h4
						style={{
							margin: `0 0 ${spacing.md} 0`,
							fontSize: typography.fontSize.base,
							fontWeight: typography.fontWeight.semibold,
							color: colors.primary[900],
						}}
					>
						What's Next?
					</h4>
					<ul
						style={{
							margin: 0,
							paddingLeft: spacing.xl,
							color: colors.primary[800],
							fontSize: typography.fontSize.sm,
						}}
					>
						<li style={{ marginBottom: spacing.sm }}>
							Your {config.displayName} device will be used for multi-factor authentication when you
							sign in.
						</li>
						{nextStepNote && <li style={{ marginBottom: spacing.sm }}>{nextStepNote}</li>}
						<li>You can register additional devices for backup authentication methods.</li>
					</ul>
				</div>

				{/* Action Buttons */}
				<div
					style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' }}
				>
					<Button
						variant="secondary"
						size="md"
						onClick={handleRegisterAnother}
						leftIcon={<FiPlus size={16} />}
					>
						Register Another Device
					</Button>

					<a
						href="https://apidocs.pingidentity.com/pingone/platform/v1/api/"
						target="_blank"
						rel="noopener noreferrer"
						style={{ textDecoration: 'none' }}
					>
						<Button variant="outline" size="md" rightIcon={<FiExternalLink size={14} />}>
							View API Docs
						</Button>
					</a>

					<Button
						variant="primary"
						size="md"
						onClick={() => {
							modernMessaging.showFooterMessage({
								type: 'info',
								message: 'Registration complete!',
								duration: 3000,
							});
						}}
					>
						Finish
					</Button>
				</div>

				{/* Token expiry info */}
				{tokenStatus.isValid && (
					<p
						style={{
							textAlign: 'center',
							marginTop: spacing.xl,
							fontSize: typography.fontSize.xs,
							color: colors.success[600],
						}}
					>
						<FiCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
						Worker token valid — expires{' '}
						{tokenStatus.expiresAt ? new Date(tokenStatus.expiresAt).toLocaleString() : 'soon'}
					</p>
				)}
			</div>
		</PageTransition>
	);
};

export default UnifiedSuccessStepModern;
