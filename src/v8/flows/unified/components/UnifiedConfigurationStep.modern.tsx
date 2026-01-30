/**
 * @file UnifiedConfigurationStep.modern.tsx
 * @module v8/flows/unified/components
 * @description MODERNIZED Step 0: Configuration - Uses global services, no redundant inputs
 * @version 9.2.0
 * @since 2026-01-29
 *
 * Key Changes:
 * - Uses GlobalMFAContext (no redundant Environment ID/Worker Token inputs)
 * - Modern UI with design system components
 * - All buttons functional with proper states
 * - Simplified configuration flow
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/v8/components/Button';
import { FormInput } from '@/v8/components/FormInput';
import { PageTransition } from '@/v8/components/PageTransition';
import { LoadingSpinner } from '@/v8/components/LoadingSpinner';
import { useGlobalMFA } from '@/v8/contexts/GlobalMFAContext';
import { useFormValidation } from '@/v8/hooks/useFormValidation';
import { colors, spacing, borderRadius, typography } from '@/v8/design/tokens';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { FiCheck, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

const MODULE_TAG = '[⚙️ UNIFIED-CONFIG-MODERN]';

export interface UnifiedConfigurationStepProps extends MFAFlowBaseRenderProps {
	config: DeviceFlowConfig;
	deviceType: string;
	registrationFlowType?: 'admin' | 'user';
}

export const UnifiedConfigurationStepModern: React.FC<UnifiedConfigurationStepProps> = ({
	credentials,
	setCredentials,
	nav,
	config,
	deviceType,
}) => {
	console.log(`${MODULE_TAG} Rendering for:`, deviceType);

	// Global MFA state
	const { environmentId, workerTokenStatus, isConfigured, isLoading: globalLoading } = useGlobalMFA();

	// Form validation
	const { values, errors, touched, handleChange, handleBlur, validateAll } = useFormValidation(
		{
			username: credentials.username || '',
			clientId: credentials.clientId || '',
		},
		{
			username: {
				required: true,
				minLength: 3,
			},
			clientId: {
				required: false,
			},
		}
	);

	const [isSubmitting, setIsSubmitting] = useState(false);

	// Auto-populate credentials from global state
	useEffect(() => {
		if (environmentId && !credentials.environmentId) {
			setCredentials((prev) => ({
				...prev,
				environmentId,
			}));
		}
	}, [environmentId, credentials.environmentId, setCredentials]);

	// Handle continue
	const handleContinue = useCallback(async () => {
		console.log(`${MODULE_TAG} Continuing to device selection`);

		// Validate form
		if (!validateAll()) {
			toastV8.error('Please fix the validation errors');
			return;
		}

		// Check global configuration
		if (!isConfigured) {
			toastV8.error('Please configure Environment ID and Worker Token first');
			nav.setValidationErrors(['Global configuration incomplete']);
			return;
		}

		setIsSubmitting(true);

		try {
			// Update credentials
			setCredentials((prev) => ({
				...prev,
				environmentId: environmentId!,
				username: values.username.trim(),
				clientId: values.clientId.trim() || prev.clientId,
				tokenType: 'worker',
				deviceType,
			}));

			// Mark step complete
			nav.markStepComplete();

			// Navigate to next step
			nav.goToNext();

			toastV8.success('Configuration saved');
		} catch (error) {
			console.error(`${MODULE_TAG} Error:`, error);
			toastV8.error('Failed to save configuration');
		} finally {
			setIsSubmitting(false);
		}
	}, [validateAll, isConfigured, environmentId, values, deviceType, setCredentials, nav]);

	// Loading state
	if (globalLoading) {
		return (
			<div style={{ padding: spacing['3xl'], textAlign: 'center' }}>
				<LoadingSpinner size="large" text="Loading global configuration..." />
			</div>
		);
	}

	// Not configured - show prompt
	if (!isConfigured) {
		return (
			<PageTransition>
				<div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing.xl }}>
					<div
						style={{
							background: colors.warning[50],
							border: `2px solid ${colors.warning[500]}`,
							borderRadius: borderRadius.lg,
							padding: spacing.xl,
							textAlign: 'center',
						}}
					>
						<FiAlertCircle size={48} color={colors.warning[500]} style={{ marginBottom: spacing.md }} />
						<h2 style={{ margin: `0 0 ${spacing.md} 0`, color: colors.warning[900] }}>
							Global Configuration Required
						</h2>
						<p style={{ margin: `0 0 ${spacing.lg} 0`, color: colors.warning[700] }}>
							Please configure your Environment ID and Worker Token before proceeding.
						</p>
						<Button
							variant="primary"
							size="lg"
							onClick={() => {
								// Navigate to settings or show configuration modal
								toastV8.info('Please configure global settings in the admin panel');
							}}
						>
							Configure Settings
						</Button>
					</div>
				</div>
			</PageTransition>
		);
	}

	// Configured - show simplified form
	return (
		<PageTransition>
			<div style={{ maxWidth: '800px', margin: '0 auto', padding: spacing.xl }}>
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
							fontSize: typography.fontSize['3xl'],
							fontWeight: typography.fontWeight.bold,
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							gap: spacing.md,
						}}
					>
						{config.icon} Configure {config.displayName}
					</h2>
					<p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
						Enter user details to begin registration
					</p>
				</div>

				{/* Global Config Status */}
				<div
					style={{
						background: colors.success[50],
						border: `1px solid ${colors.success[500]}`,
						borderRadius: borderRadius.lg,
						padding: spacing.lg,
						marginBottom: spacing.xl,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
						<FiCheck size={24} color={colors.success[500]} />
						<div style={{ flex: 1 }}>
							<h3 style={{ margin: `0 0 ${spacing.xs} 0`, color: colors.success[900] }}>
								Global Configuration Active
							</h3>
							<p style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.success[700] }}>
								Environment ID: <strong>{environmentId}</strong>
								<br />
								Worker Token: <strong>{workerTokenStatus?.tokenValid ? 'Valid' : 'Invalid'}</strong>
							</p>
						</div>
					</div>
				</div>

				{/* User Configuration Form */}
				<div
					style={{
						background: 'white',
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						border: `1px solid ${colors.neutral[200]}`,
					}}
				>
					<h3 style={{ margin: `0 0 ${spacing.lg} 0`, color: colors.neutral[900] }}>
						User Details
					</h3>

					<FormInput
						label="Username"
						name="username"
						type="text"
						value={values.username}
						error={errors.username}
						touched={touched.username}
						onChange={handleChange}
						onBlur={handleBlur}
						required
						placeholder="user@example.com"
						helpText="The user who will register this MFA device"
					/>

					<FormInput
						label="Client ID"
						name="clientId"
						type="text"
						value={values.clientId}
						error={errors.clientId}
						touched={touched.clientId}
						onChange={handleChange}
						onBlur={handleBlur}
						placeholder="Optional - uses default if not provided"
						helpText="OAuth client ID (optional)"
					/>
				</div>

				{/* Action Buttons */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: spacing.md,
						marginTop: spacing.xl,
						paddingTop: spacing.lg,
						borderTop: `1px solid ${colors.neutral[200]}`,
					}}
				>
					<Button
						variant="primary"
						size="lg"
						onClick={handleContinue}
						loading={isSubmitting}
						disabled={isSubmitting || !values.username.trim()}
						rightIcon={<FiArrowRight />}
						fullWidth
					>
						Continue to Device Selection
					</Button>
				</div>
			</div>
		</PageTransition>
	);
};

export default UnifiedConfigurationStepModern;
