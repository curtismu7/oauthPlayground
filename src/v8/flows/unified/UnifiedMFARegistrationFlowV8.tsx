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
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import type { MFAFeatureFlag } from '@/v8/services/mfaFeatureFlagsV8';
import { MFAFeatureFlagsV8 } from '@/v8/services/mfaFeatureFlagsV8';
import { MFATokenManagerV8 } from '@/v8/services/mfaTokenManagerV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { MFACredentials, MFAState } from '../shared/MFATypes';
import { UnifiedActivationStep } from './components/UnifiedActivationStep';
import { UnifiedConfigurationStepModern as UnifiedConfigurationStep } from './components/UnifiedConfigurationStep.modern';
import { UnifiedDeviceSelectionStepModern as UnifiedDeviceSelectionStep } from './components/UnifiedDeviceSelectionStep.modern';
import { UnifiedRegistrationStep } from './components/UnifiedRegistrationStep';
import { UnifiedSuccessStep } from './components/UnifiedSuccessStep';
import { UnifiedDeviceRegistrationForm } from './components/UnifiedDeviceRegistrationForm';
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
// MFA FLOW SELECTION SCREEN
// ============================================================================

type FlowMode = 'registration' | 'authentication';

/** Map device types to their feature flags */
const DEVICE_FLAG_MAP: Record<DeviceConfigKey, MFAFeatureFlag> = {
	SMS: 'mfa_unified_sms',
	EMAIL: 'mfa_unified_email',
	MOBILE: 'mfa_unified_mobile',
	WHATSAPP: 'mfa_unified_whatsapp',
	TOTP: 'mfa_unified_totp',
	FIDO2: 'mfa_unified_fido2',
};

const DEVICE_TYPES: { key: DeviceConfigKey; icon: string; name: string; description: string }[] = [
	{ key: 'SMS', icon: '📱', name: 'SMS', description: 'Receive OTP codes via text message' },
	{ key: 'EMAIL', icon: '✉️', name: 'Email', description: 'Receive OTP codes via email' },
	{ key: 'TOTP', icon: '🔐', name: 'Authenticator App (TOTP)', description: 'Use Google Authenticator, Authy, or similar' },
	{ key: 'MOBILE', icon: '📲', name: 'Mobile Push', description: 'Receive push notifications on your phone' },
	{ key: 'WHATSAPP', icon: '💬', name: 'WhatsApp', description: 'Receive OTP codes via WhatsApp' },
	{ key: 'FIDO2', icon: '🔑', name: 'Security Key (FIDO2)', description: 'Use a hardware security key or passkey' },
];

/** Check if a device type is enabled via feature flags */
const isDeviceEnabled = (deviceKey: DeviceConfigKey): boolean => {
	const flag = DEVICE_FLAG_MAP[deviceKey];
	return MFAFeatureFlagsV8.isEnabled(flag);
};

interface DeviceTypeSelectionScreenProps {
	onSelectDeviceType: (deviceType: DeviceConfigKey) => void;
}

const DeviceTypeSelectionScreen: React.FC<DeviceTypeSelectionScreenProps> = ({
	onSelectDeviceType,
}) => {
	const [flowMode, setFlowMode] = useState<FlowMode | null>(null);
	const [environmentId, setEnvironmentId] = useState('');
	const [username, setUsername] = useState('');
	const [selectedPolicyId, setSelectedPolicyId] = useState('');

	// Load Environment ID and username from global services on mount
	useEffect(() => {
		// Initialize the service first to load from localStorage
		globalEnvironmentService.initialize();
		const savedEnvId = globalEnvironmentService.getEnvironmentId();
		console.log('[DeviceTypeSelectionScreen] Loaded Environment ID:', savedEnvId);
		if (savedEnvId) {
			setEnvironmentId(savedEnvId);
		}

		// Load username from localStorage
		const savedUsername = localStorage.getItem('mfa_unified_username');
		console.log('[DeviceTypeSelectionScreen] Loaded username:', savedUsername);
		if (savedUsername) {
			setUsername(savedUsername);
		}
	}, []);

	// Sync environment ID to global service when it changes
	useEffect(() => {
		if (environmentId) {
			globalEnvironmentService.setEnvironmentId(environmentId);
		}
	}, [environmentId]);

	// Save username to localStorage when it changes
	useEffect(() => {
		if (username) {
			localStorage.setItem('mfa_unified_username', username);
			console.log('[DeviceTypeSelectionScreen] Saved username to localStorage:', username);
		}
	}, [username]);

	// Step 1: Choose Registration or Authentication
	if (!flowMode) {
		return (
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
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
					<h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700', color: '#ffffff' }}>
						🔐 MFA Unified Flow
					</h1>
					<p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.5' }}>
						Choose what you want to do with MFA devices.
					</p>
				</div>

				{/* Configuration Section */}
				<div
					style={{
						background: '#ffffff',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '28px',
						border: '1px solid #e5e7eb',
					}}
				>
					<h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
						Configuration
					</h2>

					{/* Environment ID */}
					<div style={{ marginBottom: '20px' }}>
						<label
							htmlFor="env-id"
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
						>
							Environment ID
						</label>
						<input
							id="env-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								boxSizing: 'border-box',
							}}
						/>
					</div>

					{/* Username */}
					<div style={{ marginBottom: '20px' }}>
						<label
							htmlFor="username"
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
						>
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="user@example.com"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								boxSizing: 'border-box',
							}}
						/>
					</div>

					{/* Worker Token Status */}
					<div style={{ marginBottom: '20px' }}>
						<WorkerTokenUIServiceV8
							mode="detailed"
							showRefresh={true}
							showStatusDisplay={true}
							statusSize="large"
							context="mfa"
							environmentId={environmentId}
							onEnvironmentIdUpdate={setEnvironmentId}
						/>
					</div>
				</div>

				{/* Flow Mode Selection */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
					{/* Registration Option */}
					<button
						type="button"
						onClick={() => setFlowMode('registration')}
						style={{
							padding: '32px 24px',
							background: '#ffffff',
							border: '2px solid #e5e7eb',
							borderRadius: '16px',
							cursor: 'pointer',
							textAlign: 'left',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#10b981';
							e.currentTarget.style.background = '#ecfdf5';
							e.currentTarget.style.transform = 'translateY(-4px)';
							e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#e5e7eb';
							e.currentTarget.style.background = '#ffffff';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = 'none';
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
							<span style={{ fontSize: '48px', lineHeight: 1 }}>➕</span>
							<div>
								<h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#047857' }}>
									Device Registration
								</h2>
								<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
									Register a new MFA device for a user. Create SMS, Email, TOTP, Mobile Push, WhatsApp, or FIDO2 devices.
								</p>
							</div>
						</div>
					</button>

					{/* Authentication Option */}
					<button
						type="button"
						onClick={() => setFlowMode('authentication')}
						style={{
							padding: '32px 24px',
							background: '#ffffff',
							border: '2px solid #e5e7eb',
							borderRadius: '16px',
							cursor: 'pointer',
							textAlign: 'left',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#3b82f6';
							e.currentTarget.style.background = '#eff6ff';
							e.currentTarget.style.transform = 'translateY(-4px)';
							e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#e5e7eb';
							e.currentTarget.style.background = '#ffffff';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = 'none';
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
							<span style={{ fontSize: '48px', lineHeight: 1 }}>🔓</span>
							<div>
								<h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#1d4ed8' }}>
									Device Authentication
								</h2>
								<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
									Authenticate using an existing MFA device. Verify user identity with OTP, push notification, or security key.
								</p>
							</div>
						</div>
					</button>
				</div>
			</div>
		);
	}

	// Step 2: Choose Device Type (for Registration)
	// For Authentication, we might want to redirect to a different flow
	if (flowMode === 'authentication') {
		// TODO: Redirect to authentication flow or show authentication device selection
		return (
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
				<div
					style={{
						background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
						borderRadius: '12px',
						padding: '28px 32px',
						marginBottom: '28px',
					}}
				>
					<button
						type="button"
						onClick={() => setFlowMode(null)}
						style={{
							background: 'rgba(255,255,255,0.2)',
							border: 'none',
							color: 'white',
							padding: '6px 12px',
							borderRadius: '6px',
							cursor: 'pointer',
							marginBottom: '12px',
							fontSize: '13px',
						}}
					>
						← Back
					</button>
					<h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700', color: '#ffffff' }}>
						🔓 Device Authentication
					</h1>
					<p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Authentication flow coming soon. For now, use the MFA Hub for authentication.
					</p>
				</div>
				<a
					href="/v8/mfa-hub"
					style={{
						display: 'inline-block',
						padding: '12px 24px',
						background: '#3b82f6',
						color: 'white',
						borderRadius: '8px',
						textDecoration: 'none',
						fontWeight: '600',
					}}
				>
					Go to MFA Hub →
				</a>
			</div>
		);
	}

	// Registration flow - show unified device registration form
	return (
		<UnifiedDeviceRegistrationForm
			onSubmit={(deviceType, fields, flowType) => {
				console.log(`${MODULE_TAG} Device registration submitted:`, { deviceType, fields, flowType });
				// Store flow type in local storage or pass to next step
				localStorage.setItem('mfa_registration_flow_type', flowType);
				onSelectDeviceType(deviceType);
			}}
			onCancel={() => setFlowMode(null)}
		/>
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
			<>
				<MFAHeaderV8
					title="MFA Unified Flow"
					description="Register or authenticate MFA devices"
					versionTag="V8"
					currentPage="registration"
					showBackToMain={true}
					headerColor="purple"
				/>
				<GlobalMFAProvider>
					<MFACredentialProvider>
						<DeviceTypeSelectionScreen onSelectDeviceType={setSelectedDeviceType} />
					</MFACredentialProvider>
				</GlobalMFAProvider>
			</>
		);
	}

	return (
		<>
			<MFAHeaderV8
				title="MFA Unified Flow"
				description="Register or authenticate MFA devices"
				versionTag="V8"
				currentPage="registration"
				showBackToMain={true}
				headerColor="purple"
			/>
			<GlobalMFAProvider>
				<MFACredentialProvider>
					<UnifiedMFARegistrationFlowContent {...props} deviceType={selectedDeviceType} />
				</MFACredentialProvider>
			</GlobalMFAProvider>
		</>
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
	 * Render Step 0: Configuration (SKIPPED - username already collected)
	 */
	const renderStep0 = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			// Skip this step - username is already collected in the initial form
			// The skip logic is handled by the useEffect at line 583-588
			return null;
		},
		[]
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
			'', // Skip configuration step (username already collected)
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
