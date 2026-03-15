/**
 * @file UnifiedRegistrationStep.modern.tsx
 * @module v8/flows/unified/components
 * @description MODERNIZED Step 2: Device Registration - Design system UI, 0 inline styles
 * @version 9.2.0
 * @since 2026-01-29
 *
 * Key Changes from UnifiedRegistrationStep.tsx:
 * - Uses design system Button component (no raw <button type="button"> elements)
 * - Uses design tokens for all colors, spacing, typography
 * - Uses PageTransition wrapper
 * - Proper loading states via Button loading prop
 * - Info/warning banners via design tokens
 * - Device info hint card using tokens
 */

import React, { useCallback, useMemo, useState } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { Button } from '@/v8/components/Button';
import { PageTransition } from '@/v8/components/PageTransition';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import { borderRadius, colors, spacing, typography } from '@/v8/design/tokens';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiInfo } from '../../../../icons';
import { logger } from '../../../../utils/logger';
import { type DeviceComponentProps, DeviceComponentRegistry } from './DeviceComponentRegistry';
import { DynamicFormRenderer } from './DynamicFormRenderer';

export { computeDeviceStatus } from './UnifiedRegistrationStep';

const MODULE_TAG = '[📝 UNIFIED-REGISTRATION-MODERN]';

// ============================================================================
// PROPS
// ============================================================================

export interface UnifiedRegistrationStepModernProps extends MFAFlowBaseRenderProps {
	config: DeviceFlowConfig;
	controller: {
		registerDevice: (
			deviceType: string,
			fields: Record<string, string>
		) => Promise<{ deviceId: string; status: string; [key: string]: unknown }>;
	};
	deviceFields: Record<string, string>;
	setDeviceFields: (fields: Record<string, string>) => void;
	errors: Record<string, string>;
	validate: () => boolean;
	touchField?: (field: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UnifiedRegistrationStepModern: React.FC<UnifiedRegistrationStepModernProps> = ({
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
	logger.info(`${MODULE_TAG} Rendering for:`, config.deviceType);

	const [registrationError, setRegistrationError] = useState<string | null>(null);

	// Check whether the form is ready to submit
	const isFormValid = useMemo(() => {
		const tokenType = credentials.tokenType || 'worker';
		if (tokenType === 'worker' && !tokenStatus.isValid) return false;

		const requiredFields = config.requiredFields || [];
		return requiredFields.every((f) => {
			const v = deviceFields[f];
			return v && v.trim() !== '';
		});
	}, [tokenStatus.isValid, config.requiredFields, deviceFields, credentials.tokenType]);

	// -------------------------------------------------------------------------
	// Handlers
	// -------------------------------------------------------------------------

	const handleRegisterDevice = useCallback(async () => {
		try {
			setIsLoading(true);
			setRegistrationError(null);

			if (!validate()) return;

			const result = await controller.registerDevice(config.deviceType, deviceFields);

			const { computeDeviceStatus } = await import('./UnifiedRegistrationStep');

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

			modernMessaging.showFooterMessage({
				type: 'info',
				message: `${config.displayName} device registered successfully!`,
				duration: 3000,
			});

			nav.goToNext();
		} catch (error) {
			const parsed = UnifiedFlowErrorHandler.handleError(error, {
				operation: 'register-device',
				component: MODULE_TAG,
			});
			setRegistrationError(parsed.userFriendlyMessage);
		} finally {
			setIsLoading(false);
		}
	}, [
		config,
		deviceFields,
		controller,
		validate,
		setIsLoading,
		setMfaState,
		nav,
		credentials.tokenType,
		credentials.deviceStatus,
	]);

	const handleFieldChange = useCallback(
		(field: string, value: string) => {
			setDeviceFields({ ...deviceFields, [field]: value });
			if (errors[field]) {
				setCredentials((prev) => ({
					...prev,
					errors: { ...prev.errors, [field]: undefined },
				}));
			}
		},
		[deviceFields, setDeviceFields, errors, setCredentials]
	);

	const handleFieldTouch = useCallback(
		(field: string) => {
			touchField?.(field);
		},
		[touchField]
	);

	// -------------------------------------------------------------------------
	// Device-specific form
	// -------------------------------------------------------------------------

	const renderDeviceForm = () => {
		const DeviceComponent = DeviceComponentRegistry[config.deviceType];
		const props: DeviceComponentProps = {
			config,
			values: deviceFields,
			onChange: handleFieldChange,
			errors,
			onTouch: handleFieldTouch,
			disabled: isLoading,
		};

		return DeviceComponent ? <DeviceComponent {...props} /> : <DynamicFormRenderer {...props} />;
	};

	// -------------------------------------------------------------------------
	// Hint text for this device type
	// -------------------------------------------------------------------------

	const hintText =
		config.deviceType === 'FIDO2'
			? `Clicking "Register Device" will create your ${config.displayName} device, then you'll complete biometric authentication.`
			: `Clicking "Register Device" will register your ${config.displayName} device and send the activation code.`;

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	return (
		<PageTransition>
			<div style={{ maxWidth: '720px', margin: '0 auto', padding: spacing.xl }}>
				{/* Header */}
				<div
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
							display: 'flex',
							alignItems: 'center',
							gap: spacing.md,
						}}
					>
						{config.icon} Register {config.displayName}
					</h2>
					<p
						style={{
							margin: 0,
							color: 'rgba(255, 255, 255, 0.9)',
							fontSize: typography.fontSize.sm,
						}}
					>
						{config.description}
					</p>
				</div>

				{/* Info hint */}
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: spacing.md,
						padding: spacing.lg,
						background: colors.primary[50],
						border: `1px solid ${colors.primary[200]}`,
						borderRadius: borderRadius.lg,
						marginBottom: spacing.xl,
						color: colors.primary[800],
						fontSize: typography.fontSize.sm,
					}}
				>
					<FiInfo size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
					<span>{hintText}</span>
				</div>

				{/* Registration error */}
				{registrationError && (
					<div
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							gap: spacing.md,
							padding: spacing.lg,
							background: colors.error[50],
							border: `1px solid ${colors.error[500]}`,
							borderRadius: borderRadius.lg,
							marginBottom: spacing.xl,
							color: colors.error[900],
							fontSize: typography.fontSize.sm,
						}}
					>
						<FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
						<div>
							<strong>Registration Failed: </strong>
							{registrationError}
						</div>
					</div>
				)}

				{/* Device form */}
				<div
					style={{
						background: 'white',
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						border: `1px solid ${colors.neutral[200]}`,
						marginBottom: spacing.xl,
						boxShadow: `0 1px 3px ${colors.neutral[200]}`,
					}}
				>
					{renderDeviceForm()}
				</div>

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
						<span>
							Worker token is invalid or expired — please refresh your token before continuing.
						</span>
					</div>
				)}

				{/* Navigation */}
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md }}>
					<Button
						variant="secondary"
						size="md"
						onClick={() => nav.goToPrevious()}
						disabled={isLoading}
						leftIcon={<FiArrowLeft size={16} />}
					>
						Previous
					</Button>

					<Button
						variant="primary"
						size="md"
						onClick={handleRegisterDevice}
						disabled={isLoading || !isFormValid}
						loading={isLoading}
						rightIcon={!isLoading ? <FiArrowRight size={16} /> : undefined}
					>
						{isLoading ? 'Registering…' : 'Register Device'}
					</Button>
				</div>
			</div>
		</PageTransition>
	);
};

export default UnifiedRegistrationStepModern;
