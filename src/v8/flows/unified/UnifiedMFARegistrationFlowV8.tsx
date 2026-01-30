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
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { useMFAPolicies } from '@/v8/hooks/useMFAPolicies';
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
	const [tokenIsValid, setTokenIsValid] = useState(false);

	// Load Environment ID and username from global services on mount
	useEffect(() => {
		// Initialize the service first to load from localStorage
		globalEnvironmentService.initialize();
		const savedEnvId = globalEnvironmentService.getEnvironmentId();
		if (savedEnvId) {
			setEnvironmentId(savedEnvId);
		}

		// Load username from localStorage
		const savedUsername = localStorage.getItem('mfa_unified_username');
		if (savedUsername) {
			setUsername(savedUsername);
		}

		// Check worker token status
		const tokenManager = MFATokenManagerV8.getInstance();
		const tokenState = tokenManager.getTokenState();
		setTokenIsValid(tokenState.isValid);
	}, []);

	// Use MFA policies hook
	const {
		policies,
		selectedPolicy,
		isLoading: isPoliciesLoading,
		error: policiesError,
		selectPolicy,
		defaultPolicy,
	} = useMFAPolicies({
		environmentId,
		tokenIsValid,
		autoLoad: true,
		autoSelectSingle: true,
	});

	// Auto-select default policy when policies load
	useEffect(() => {
		if (defaultPolicy && !selectedPolicy) {
			selectPolicy(defaultPolicy.id);
		}
	}, [defaultPolicy, selectedPolicy, selectPolicy]);

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

					{/* MFA Policy Dropdown */}
					<div style={{ marginBottom: '20px' }}>
						<label
							htmlFor="mfa-policy"
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
						>
							MFA Policy
						</label>
						{isPoliciesLoading ? (
							<div style={{ padding: '10px', color: '#6b7280', fontSize: '14px' }}>
								Loading policies...
							</div>
						) : policiesError ? (
							<div style={{ padding: '10px', color: '#ef4444', fontSize: '14px' }}>
								Error loading policies: {policiesError}
							</div>
						) : policies.length === 0 ? (
							<div style={{ padding: '10px', color: '#6b7280', fontSize: '14px' }}>
								No MFA policies found. Please check your environment ID and worker token.
							</div>
						) : (
							<select
								id="mfa-policy"
								value={selectedPolicy?.id || ''}
								onChange={(e) => selectPolicy(e.target.value)}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									boxSizing: 'border-box',
									backgroundColor: 'white',
									cursor: 'pointer',
								}}
							>
								<option value="">Select an MFA policy...</option>
								{policies.map((policy) => (
									<option key={policy.id} value={policy.id}>
										{policy.name} {policy.default ? '(Default)' : ''}
									</option>
								))}
							</select>
						)}
						<span
							style={{
								display: 'block',
								marginTop: '6px',
								fontSize: '12px',
								color: '#6b7280',
							}}
						>
							Select the MFA policy to use for device registration
						</span>

						{/* Policy Summary - Collapsible */}
						{selectedPolicy && (
							<details
								style={{
									marginTop: '12px',
									padding: '12px',
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
								}}
							>
								<summary
									style={{
										cursor: 'pointer',
										fontWeight: '600',
										fontSize: '13px',
										color: '#374151',
										userSelect: 'none',
									}}
								>
									📋 Policy Details
								</summary>
								<div style={{ marginTop: '12px', fontSize: '13px', color: '#4b5563' }}>
									<div style={{ marginBottom: '8px' }}>
										<strong>Policy Name:</strong> {selectedPolicy.name}
									</div>
									{selectedPolicy.default && (
										<div style={{ marginBottom: '8px', color: '#059669' }}>
											<strong>✓ Default Policy</strong>
										</div>
									)}
									<div style={{ marginBottom: '8px' }}>
										<strong>Enabled Devices:</strong>
									</div>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
										{selectedPolicy.sms?.enabled && (
											<span
												style={{
													padding: '4px 8px',
													background: '#dbeafe',
													color: '#1e40af',
													borderRadius: '4px',
													fontSize: '12px',
												}}
											>
												📱 SMS
											</span>
										)}
										{selectedPolicy.email?.enabled && (
											<span
												style={{
													padding: '4px 8px',
													background: '#dbeafe',
													color: '#1e40af',
													borderRadius: '4px',
													fontSize: '12px',
												}}
											>
												✉️ Email
											</span>
										)}
										{selectedPolicy.totp?.enabled && (
											<span
												style={{
													padding: '4px 8px',
													background: '#dbeafe',
													color: '#1e40af',
													borderRadius: '4px',
													fontSize: '12px',
												}}
											>
												🔐 TOTP
											</span>
										)}
										{selectedPolicy.fido2?.enabled && (
											<span
												style={{
													padding: '4px 8px',
													background: '#dbeafe',
													color: '#1e40af',
													borderRadius: '4px',
													fontSize: '12px',
												}}
											>
												🔑 FIDO2
											</span>
										)}
										{selectedPolicy.mobile?.enabled && (
											<span
												style={{
													padding: '4px 8px',
													background: '#dbeafe',
													color: '#1e40af',
													borderRadius: '4px',
													fontSize: '12px',
												}}
											>
												📲 Mobile
											</span>
										)}
										{selectedPolicy.voice?.enabled && (
											<span
												style={{
													padding: '4px 8px',
													background: '#dbeafe',
													color: '#1e40af',
													borderRadius: '4px',
													fontSize: '12px',
												}}
											>
												📞 Voice
											</span>
										)}
									</div>
								</div>
							</details>
						)}
					</div>

					{/* Worker Token Status */}
					<div style={{ marginTop: '24px', marginBottom: '20px' }}>
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
		<GlobalMFAProvider>
			<MFACredentialProvider>
				<UnifiedMFARegistrationFlowContent {...props} deviceType={selectedDeviceType} />
			</MFACredentialProvider>
		</GlobalMFAProvider>
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
		return getDeviceConfig(deviceType);
	}, [deviceType]);

	// ========================================================================
	// TOKEN MANAGEMENT
	// ========================================================================

	// Initialize token manager (singleton)
	const tokenManager = useMemo(() => MFATokenManagerV8.getInstance(), []);

	// Token status state
	const [_tokenStatus, setTokenStatus] = useState<TokenStatusInfo>(tokenManager.getTokenState());

	// Subscribe to token updates
	useEffect(() => {
		const unsubscribe = tokenManager.subscribe((state) => {
			setTokenStatus(state);
		});

		// Start auto-refresh
		tokenManager.startAutoRefresh();

		return () => {
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
	 * Render Step 0: Registration (skip device selection)
	 */
	const renderStep0 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<UnifiedDeviceRegistrationForm
					onSubmit={(deviceType, fields, flowType) => {
						console.log('[UNIFIED-FLOW] Device registration submitted', { deviceType, fields, flowType });
						// Store flow type
						localStorage.setItem('mfa_registration_flow_type', flowType);
						// Navigate to next step
						props.nav.goToNext();
					}}
					onCancel={() => {
						console.log('[UNIFIED-FLOW] Registration cancelled');
					}}
					isLoading={props.isLoading}
				/>
			);
		},
		[]
	);

	/**
	 * Render Step 1: Activation
	 */
	const renderStep1 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return <UnifiedActivationStep {...props} config={config} />;
		},
		[config]
	);

	/**
	 * Render Step 2: Success
	 */
	const renderStep2 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<UnifiedSuccessStep
					{...props}
					config={config}
				/>
			);
		},
		[config]
	);

	/**
	 * Render Step 3: Not used
	 */
	const renderStep3 = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			return null;
		},
		[]
	);

	/**
	 * Render Step 4: Not used
	 */
	const renderStep4 = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			return null;
		},
		[]
	);

	// ========================================================================
	// STEP LABELS
	// ========================================================================

	const stepLabels = useMemo(
		() => [
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
		<>
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
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</>
	);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedMFARegistrationFlowV8;
