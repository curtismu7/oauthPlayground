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
import { FiAlertCircle, FiArrowRight, FiCheck } from 'react-icons/fi';
import { Button } from '@/v8/components/Button';
import { FormInput } from '@/v8/components/FormInput';
import { LoadingSpinner } from '@/v8/components/LoadingSpinner';
import { PageTransition } from '@/v8/components/PageTransition';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import { useGlobalMFA } from '@/v8/contexts/GlobalMFAContext';
import { borderRadius, colors, spacing, typography } from '@/v8/design/tokens';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { useFormValidation } from '@/v8/hooks/useFormValidation';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

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
	registrationFlowType = 'admin',
}) => {
	console.log(`${MODULE_TAG} Rendering for:`, deviceType, 'Flow type:', registrationFlowType);

	// Global MFA state
	const {
		environmentId,
		workerTokenStatus,
		isConfigured,
		isLoading: globalLoading,
	} = useGlobalMFA();

	// Debug logging
	console.log(`${MODULE_TAG} Global state:`, {
		environmentId,
		workerTokenStatus,
		isConfigured,
		globalLoading,
	});

	// Form validation - initialize with credentials.username
	const { values, errors, touched, handleChange, handleBlur, validateAll, setValues } =
		useFormValidation(
			{
				username: credentials.username || '',
				flowType: registrationFlowType === 'user' ? 'user' : 'admin-activation',
			},
			{
				username: {
					required: true,
					minLength: 3,
				},
			}
		);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedFlowType, setSelectedFlowType] = useState<
		'admin-active' | 'admin-activation' | 'user'
	>(registrationFlowType === 'user' ? 'user' : 'admin-activation');

	// Update form when credentials change
	useEffect(() => {
		if (credentials.username && values.username !== credentials.username) {
			setValues({ username: credentials.username });
		}
	}, [credentials.username, values.username, setValues]);

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
		console.log(
			`${MODULE_TAG} Continuing for device type:`,
			deviceType,
			'Flow type:',
			selectedFlowType
		);

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
			const updatedCredentials = {
				...credentials,
				environmentId: environmentId!,
				username: values.username.trim(),
				tokenType: 'worker' as const,
				deviceType,
			};

			setCredentials(updatedCredentials);

			/**
			 * CRITICAL: MFA OTP and TOTP devices MUST always register directly
			 *
			 * Flow Types:
			 * 1. Admin Active (admin-active): Register → Skip activation → Success
			 * 2. Admin Activation Required (admin-activation): Register → OTP activation → Success
			 * 3. User Flow (user): Register → PingOne login → OTP activation → Success
			 *
			 * NEVER skip activation for ACTIVATION_REQUIRED or user flow!
			 */
			const DIRECT_REGISTRATION_DEVICES = ['EMAIL', 'SMS', 'WHATSAPP', 'TOTP'];

			if (DIRECT_REGISTRATION_DEVICES.includes(deviceType)) {
				console.log(
					`${MODULE_TAG} Registering ${deviceType} device directly with flow type: ${selectedFlowType}`
				);

				// Map device type to field name
				const fieldMap: Record<string, string> = {
					EMAIL: 'email',
					SMS: 'phone',
					WHATSAPP: 'phone',
					TOTP: 'deviceName', // TOTP doesn't need contact field
				};

				const fieldName = fieldMap[deviceType];
				const fieldValue = deviceType === 'TOTP' ? deviceType : values.username.trim();

				// Determine device status based on flow type
				// CRITICAL: Only admin-active flow creates ACTIVE devices
				const deviceStatus = selectedFlowType === 'admin-active' ? 'ACTIVE' : 'ACTIVATION_REQUIRED';

				// Prepare registration parameters
				const registrationParams: Record<string, unknown> = {
					environmentId: environmentId!,
					username: values.username.trim(),
					deviceType,
					[fieldName]: fieldValue,
					deviceName: deviceType,
					nickname: 'MyKnickName',
					tokenType: 'worker' as const,
					// Only admin flows set status, user flow doesn't include it
					...(selectedFlowType !== 'user' && { status: deviceStatus }),
				};

				console.log(`${MODULE_TAG} Registration params:`, registrationParams);

				// Call MFA Service to register device
				const result = await MFAServiceV8.registerDevice(registrationParams);
				console.log(`${MODULE_TAG} Device registered with status:`, result.status);

				// CRITICAL VALIDATION: Ensure activation flow is followed correctly
				if (result.status === 'ACTIVATION_REQUIRED' && selectedFlowType === 'admin-active') {
					console.error(`${MODULE_TAG} ERROR: Expected ACTIVE but got ACTIVATION_REQUIRED`);
					throw new Error('Device registration flow mismatch - expected ACTIVE device');
				}

				// Update credentials with device info
				setCredentials((prev) => ({
					...prev,
					deviceId: result.deviceId,
					deviceStatus: result.status,
				}));

				// Mark step complete
				nav.markStepComplete();

				/**
				 * ROUTING LOGIC - CRITICAL:
				 * - ACTIVE devices: Skip activation → Go to success (Step 2)
				 * - ACTIVATION_REQUIRED: MUST go to activation step (Step 1) for OTP entry
				 * - User flow: MUST go to activation (Step 1) even if device shows as ACTIVE
				 */
				if (result.status === 'ACTIVE' && selectedFlowType === 'admin-active') {
					console.log(`${MODULE_TAG} Admin Active flow: Skipping activation, going to success`);
					toastV8.success(
						`${config.displayName} device registered successfully! Device is ready to use.`
					);
					nav.goToStep(2); // Skip activation, go to success
				} else {
					// ACTIVATION_REQUIRED or User Flow - MUST go through activation
					console.log(`${MODULE_TAG} Activation required: Going to activation step`);
					toastV8.success(
						`${config.displayName} device registered! ${result.status === 'ACTIVATION_REQUIRED' ? 'OTP has been sent automatically.' : 'Please complete activation.'}`
					);
					nav.goToNext(); // Go to activation step
				}
			} else {
				// For FIDO2, MOBILE - go to device selection/registration form
				console.log(`${MODULE_TAG} Navigating to device selection for ${deviceType}`);

				// Mark step complete
				nav.markStepComplete();

				// Navigate to next step (device selection/registration form)
				nav.goToNext();

				toastV8.success('Configuration saved');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error:`, error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
			toastV8.error(errorMessage);
			nav.setValidationErrors([errorMessage]);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		validateAll,
		isConfigured,
		environmentId,
		values,
		deviceType,
		selectedFlowType,
		credentials,
		setCredentials,
		nav,
		config,
	]);

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
						<FiAlertCircle
							size={48}
							color={colors.warning[500]}
							style={{ marginBottom: spacing.md }}
						/>
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
							<p
								style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.success[700] }}
							>
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

					{/* Flow Type Selection */}
					<div style={{ marginTop: spacing.lg }}>
						<p
							style={{
								display: 'block',
								marginBottom: spacing.sm,
								fontWeight: typography.fontWeight.semibold,
								color: colors.neutral[700],
								fontSize: typography.fontSize.sm,
								margin: `0 0 ${spacing.sm} 0`,
							}}
						>
							Registration Flow Type
						</p>
						<div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: spacing.md,
									border: `2px solid ${selectedFlowType === 'admin-active' ? colors.primary[500] : colors.neutral[300]}`,
									borderRadius: borderRadius.md,
									cursor: 'pointer',
									background: selectedFlowType === 'admin-active' ? colors.primary[50] : 'white',
								}}
							>
								<input
									type="radio"
									name="flowType"
									value="admin-active"
									checked={selectedFlowType === 'admin-active'}
									onChange={() => setSelectedFlowType('admin-active')}
									style={{ marginRight: spacing.sm }}
								/>
								<div>
									<strong>Admin - Active</strong>
									<div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
										Device ready immediately (no activation required)
									</div>
								</div>
							</label>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: spacing.md,
									border: `2px solid ${selectedFlowType === 'admin-activation' ? colors.primary[500] : colors.neutral[300]}`,
									borderRadius: borderRadius.md,
									cursor: 'pointer',
									background:
										selectedFlowType === 'admin-activation' ? colors.primary[50] : 'white',
								}}
							>
								<input
									type="radio"
									name="flowType"
									value="admin-activation"
									checked={selectedFlowType === 'admin-activation'}
									onChange={() => setSelectedFlowType('admin-activation')}
									style={{ marginRight: spacing.sm }}
								/>
								<div>
									<strong>Admin - Activation Required</strong>
									<div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
										Requires OTP activation after registration
									</div>
								</div>
							</label>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: spacing.md,
									border: `2px solid ${selectedFlowType === 'user' ? colors.primary[500] : colors.neutral[300]}`,
									borderRadius: borderRadius.md,
									cursor: 'pointer',
									background: selectedFlowType === 'user' ? colors.primary[50] : 'white',
								}}
							>
								<input
									type="radio"
									name="flowType"
									value="user"
									checked={selectedFlowType === 'user'}
									onChange={() => setSelectedFlowType('user')}
									style={{ marginRight: spacing.sm }}
								/>
								<div>
									<strong>User Flow</strong>
									<div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
										Requires PingOne login + OTP activation
									</div>
								</div>
							</label>
						</div>
					</div>
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
						{['EMAIL', 'SMS', 'WHATSAPP', 'TOTP'].includes(deviceType)
							? `Register ${config.displayName} →`
							: 'Continue to Device Selection →'}
					</Button>
				</div>
			</div>
		</PageTransition>
	);
};

export default UnifiedConfigurationStepModern;
