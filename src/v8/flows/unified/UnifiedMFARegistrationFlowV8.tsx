/**
 * @file UnifiedMFARegistrationFlowV8.tsx
 * @module v8/flows/unified
 * @description Unified MFA Registration Flow - Single component for all 6 device types
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Replace 6 device-specific flow components (SMS, Email, Mobile, WhatsApp, TOTP, FIDO2)
 * with a single configurable component using deviceFlowConfigs for device-specific behavior.
 *
 * Architecture:
 * - Configuration-driven using deviceFlowConfigs.ts
 * - Dynamic form rendering for simple devices (SMS, Email, WhatsApp)
 * - Custom components for complex devices (TOTP, FIDO2, Mobile)
 * - Integrates with MFACredentialContext and MFATokenManagerV8
 * - Uses existing MFAFlowBaseV8 for 5-step framework
 *
 * @example
 * <UnifiedMFARegistrationFlowV8
 *   deviceType="SMS"
 *   onSuccess={(result) => console.log('Device registered:', result.deviceId)}
 * />
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDeviceConfig } from '@/v8/config/deviceFlowConfigs';
import type { DeviceConfigKey, DeviceRegistrationResult } from '@/v8/config/deviceFlowConfigTypes';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { MFATokenManagerV8 } from '@/v8/services/mfaTokenManagerV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { MFACredentials, MFAState } from '../shared/MFATypes';
import { UnifiedActivationStep } from './components/UnifiedActivationStep';
import { UnifiedConfigurationStep } from './components/UnifiedConfigurationStep';
import { UnifiedDeviceSelectionStep } from './components/UnifiedDeviceSelectionStep';
import { UnifiedRegistrationStep } from './components/UnifiedRegistrationStep';
import { UnifiedSuccessStep } from './components/UnifiedSuccessStep';
import './UnifiedMFAFlow.css';

const MODULE_TAG = '[🔄 UNIFIED-MFA-FLOW-V8]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedMFARegistrationFlowV8Props {
	/** Device type to render (optional - can be provided via navigation state) */
	deviceType?: DeviceConfigKey;

	/** Optional initial credentials (for pre-filled forms) */
	initialCredentials?: Partial<MFACredentials>;

	/** Optional callback when registration succeeds */
	onSuccess?: (result: DeviceRegistrationResult) => void;

	/** Optional callback when user cancels flow */
	onCancel?: () => void;

	/** Optional initial step (defaults to 0) */
	initialStep?: number;

	/** Optional: Skip configuration step if already configured */
	skipConfiguration?: boolean;

	/** Optional: Force specific registration flow type */
	registrationFlowType?: 'admin' | 'user';
}

// ============================================================================
// DEVICE TYPE SELECTION SCREEN
// ============================================================================

const DEVICE_TYPES: { key: DeviceConfigKey; icon: string; name: string; description: string }[] = [
	{
		key: 'SMS',
		icon: '📱',
		name: 'SMS',
		description: 'Receive OTP codes via text message',
	},
	{
		key: 'Email',
		icon: '✉️',
		name: 'Email',
		description: 'Receive OTP codes via email',
	},
	{
		key: 'TOTP',
		icon: '🔐',
		name: 'Authenticator App (TOTP)',
		description: 'Use Google Authenticator, Authy, or similar',
	},
	{
		key: 'MobileApplication',
		icon: '📲',
		name: 'Mobile Push',
		description: 'Receive push notifications on your phone',
	},
	{
		key: 'WhatsApp',
		icon: '💬',
		name: 'WhatsApp',
		description: 'Receive OTP codes via WhatsApp',
	},
	{
		key: 'FIDO2',
		icon: '🔑',
		name: 'Security Key (FIDO2)',
		description: 'Use a hardware security key or passkey',
	},
];

interface DeviceTypeSelectionScreenProps {
	onSelectDeviceType: (deviceType: DeviceConfigKey) => void;
}

const DeviceTypeSelectionScreen: React.FC<DeviceTypeSelectionScreenProps> = ({
	onSelectDeviceType,
}) => {
	return (
		<div
			style={{
				maxWidth: '900px',
				margin: '0 auto',
				padding: '24px',
			}}
		>
			{/* Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
					borderRadius: '12px',
					padding: '28px 32px',
					marginBottom: '28px',
					boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
				}}
			>
				<h1
					style={{
						margin: '0 0 8px 0',
						fontSize: '26px',
						fontWeight: '700',
						color: '#ffffff',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					🔐 MFA Device Registration
				</h1>
				<p
					style={{
						margin: 0,
						fontSize: '15px',
						color: 'rgba(255, 255, 255, 0.9)',
						lineHeight: '1.5',
					}}
				>
					Select the type of MFA device you want to register for your account.
				</p>
			</div>

			{/* Device Type Grid */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
					gap: '16px',
				}}
			>
				{DEVICE_TYPES.map((device) => (
					<button
						key={device.key}
						type="button"
						onClick={() => onSelectDeviceType(device.key)}
						style={{
							padding: '20px',
							background: '#ffffff',
							border: '2px solid #e5e7eb',
							borderRadius: '12px',
							cursor: 'pointer',
							textAlign: 'left',
							transition: 'all 0.2s ease',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#8b5cf6';
							e.currentTarget.style.background = '#faf5ff';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
							e.currentTarget.style.transform = 'translateY(-2px)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#e5e7eb';
							e.currentTarget.style.background = '#ffffff';
							e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
							<span style={{ fontSize: '32px', lineHeight: 1 }}>{device.icon}</span>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										margin: '0 0 6px 0',
										fontSize: '16px',
										fontWeight: '600',
										color: '#1f2937',
									}}
								>
									{device.name}
								</h3>
								<p
									style={{
										margin: 0,
										fontSize: '13px',
										color: '#6b7280',
										lineHeight: '1.5',
									}}
								>
									{device.description}
								</p>
							</div>
						</div>
					</button>
				))}
			</div>
		</div>
	);
};

// ============================================================================
// MAIN COMPONENT (WRAPPER)
// ============================================================================

/**
 * Unified MFA Registration Flow - Wrapper Component
 *
 * Wraps the content with MFACredentialProvider to provide global credential state
 */
export const UnifiedMFARegistrationFlowV8: React.FC<UnifiedMFARegistrationFlowV8Props> = (
	props
) => {
	const location = useLocation();

	// Get device type from props or location state (can be undefined)
	const initialDeviceType =
		props.deviceType || (location.state as { deviceType?: DeviceConfigKey })?.deviceType;

	// State for selected device type (allows user to select if not provided)
	const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceConfigKey | undefined>(
		initialDeviceType
	);

	console.log(`${MODULE_TAG} Initializing unified flow for device type:`, selectedDeviceType);

	// If no device type selected, show device type selection screen
	if (!selectedDeviceType) {
		return (
			<MFACredentialProvider>
				<DeviceTypeSelectionScreen onSelectDeviceType={setSelectedDeviceType} />
			</MFACredentialProvider>
		);
	}

	return (
		<MFACredentialProvider>
			<UnifiedMFARegistrationFlowContent {...props} deviceType={selectedDeviceType} />
		</MFACredentialProvider>
	);
};

// ============================================================================
// CONTENT COMPONENT (MAIN LOGIC)
// ============================================================================

/**
 * Unified MFA Registration Flow - Content Component
 *
 * Contains the actual flow logic and integrates with:
 * - MFACredentialContext (global credential state)
 * - MFATokenManagerV8 (token status and auto-refresh)
 * - deviceFlowConfigs (device-specific configuration)
 * - MFAFlowBaseV8 (5-step framework)
 */
const UnifiedMFARegistrationFlowContent: React.FC<
	Required<Pick<UnifiedMFARegistrationFlowV8Props, 'deviceType'>> &
		Omit<UnifiedMFARegistrationFlowV8Props, 'deviceType'>
> = ({
	deviceType,
	initialCredentials,
	onSuccess,
	onCancel,
	initialStep = 0,
	skipConfiguration = false,
	registrationFlowType,
}) => {
	// ========================================================================
	// CONFIGURATION
	// ========================================================================

	// Load device-specific configuration
	const config = useMemo(() => {
		console.log(`${MODULE_TAG} Loading config for device type:`, deviceType);
		return getDeviceConfig(deviceType);
	}, [deviceType]);

	console.log(`${MODULE_TAG} Device config loaded:`, {
		displayName: config.displayName,
		requiredFields: config.requiredFields,
		supportsQRCode: config.supportsQRCode,
		requiresOTP: config.requiresOTP,
	});

	// ========================================================================
	// TOKEN MANAGEMENT
	// ========================================================================

	// Initialize token manager (singleton)
	const tokenManager = useMemo(() => MFATokenManagerV8.getInstance(), []);

	// Token status state
	const [_tokenStatus, setTokenStatus] = useState<TokenStatusInfo>(tokenManager.getTokenState());

	// Subscribe to token updates
	useEffect(() => {
		console.log(`${MODULE_TAG} Subscribing to token manager updates`);

		const unsubscribe = tokenManager.subscribe((state) => {
			console.log(`${MODULE_TAG} Token state updated:`, state);
			setTokenStatus(state);
		});

		// Start auto-refresh
		tokenManager.startAutoRefresh();

		return () => {
			console.log(`${MODULE_TAG} Unsubscribing from token manager`);
			unsubscribe();
			tokenManager.stopAutoRefresh();
		};
	}, [tokenManager]);

	// ========================================================================
	// STATE MANAGEMENT
	// ========================================================================

	// MFA state (device-specific data)
	const [_mfaState, _setMfaState] = useState<MFAState>({
		deviceId: '',
		otpCode: '',
		deviceStatus: '',
		verificationResult: null,
	});

	// Loading state
	const [_isLoading, _setIsLoading] = useState(false);

	// ========================================================================
	// STEP NAVIGATION
	// ========================================================================

	// Initialize step navigation (5 steps)
	const nav = useStepNavigationV8(5, {
		initialStep,
		onStepChange: (step) => {
			console.log(`${MODULE_TAG} Step changed to:`, step);
		},
	});

	// Skip to registration step if configured
	useEffect(() => {
		if (skipConfiguration && nav.currentStep === 0) {
			console.log(`${MODULE_TAG} Skipping configuration, going to step 2`);
			nav.goToStep(2);
		}
	}, [skipConfiguration, nav]);

	// ========================================================================
	// STEP VALIDATION
	// ========================================================================

	/**
	 * Validate Step 0 (Configuration)
	 */
	const validateStep0 = useCallback(
		(
			credentials: MFACredentials,
			token: TokenStatusInfo,
			navigation: ReturnType<typeof useStepNavigationV8>
		) => {
			console.log(`${MODULE_TAG} Validating step 0`, {
				tokenValid: token.isValid,
				environmentId: credentials.environmentId,
				username: credentials.username,
			});

			// Check token validity
			if (!token.isValid) {
				navigation.setValidationErrors(['Invalid or expired worker token']);
				return false;
			}

			// Check required configuration
			if (!credentials.environmentId || !credentials.clientId || !credentials.username) {
				navigation.setValidationErrors(['Environment ID, Client ID, and Username are required']);
				return false;
			}

			return true;
		},
		[]
	);

	// ========================================================================
	// STEP RENDERERS
	// ========================================================================

	/**
	 * Render Step 0: Configuration
	 */
	const renderStep0 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<UnifiedConfigurationStep
					{...props}
					deviceType={deviceType}
					config={config}
					registrationFlowType={registrationFlowType}
				/>
			);
		},
		[config, deviceType, registrationFlowType]
	);

	/**
	 * Render Step 1: Device Selection
	 */
	const renderStep1 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return <UnifiedDeviceSelectionStep {...props} deviceType={deviceType} config={config} />;
		},
		[config, deviceType]
	);

	/**
	 * Render Step 2: Device Registration
	 */
	const renderStep2 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return <UnifiedRegistrationStep {...props} deviceType={deviceType} config={config} />;
		},
		[config, deviceType]
	);

	/**
	 * Render Step 3: Activation
	 */
	const renderStep3 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return <UnifiedActivationStep {...props} deviceType={deviceType} config={config} />;
		},
		[config, deviceType]
	);

	/**
	 * Render Step 4: Success
	 */
	const renderStep4 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<UnifiedSuccessStep
					{...props}
					deviceType={deviceType}
					config={config}
					onSuccess={onSuccess}
				/>
			);
		},
		[config, deviceType, onSuccess]
	);

	// ========================================================================
	// STEP LABELS
	// ========================================================================

	const stepLabels = useMemo(
		() => [
			'Configure',
			'Select Device',
			`Register ${config.displayName}`,
			config.requiresOTP ? 'Activate (OTP)' : 'Activate',
			'Success',
		],
		[config]
	);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<MFAFlowBaseV8
			deviceType={deviceType}
			renderStep0={renderStep0}
			renderStep1={renderStep1}
			renderStep2={renderStep2}
			renderStep3={renderStep3}
			renderStep4={renderStep4}
			validateStep0={validateStep0}
			stepLabels={stepLabels}
		/>
	);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedMFARegistrationFlowV8;
