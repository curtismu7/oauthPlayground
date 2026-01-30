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
import { MFADocumentationPageV8 } from '@/v8/components/MFADocumentationPageV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { useMFAPolicies } from '@/v8/hooks/useMFAPolicies';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import type { MFAFeatureFlag } from '@/v8/services/mfaFeatureFlagsV8';
import { MFAFeatureFlagsV8 } from '@/v8/services/mfaFeatureFlagsV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { MFATokenManagerV8 } from '@/v8/services/mfaTokenManagerV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { MFACredentials, MFAState } from '../shared/MFATypes';
import { UnifiedActivationStep } from './components/UnifiedActivationStep';
import { UnifiedConfigurationStepModern as UnifiedConfigurationStep } from './components/UnifiedConfigurationStep.modern';
import { UnifiedDeviceSelectionStepModern as UnifiedDeviceSelectionStep } from './components/UnifiedDeviceSelectionStep.modern';
import { UnifiedRegistrationStep } from './components/UnifiedRegistrationStep';
import { UnifiedSuccessStep } from './components/UnifiedSuccessStep';
import { UnifiedDeviceRegistrationForm } from './components/UnifiedDeviceRegistrationForm';
import { UnifiedDeviceSelectionModal } from './components/UnifiedDeviceSelectionModal';
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
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);

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

	// Sync environment ID to global service and CredentialsServiceV8 when it changes
	useEffect(() => {
		if (environmentId) {
			globalEnvironmentService.setEnvironmentId(environmentId);
			localStorage.setItem('mfa_environmentId', environmentId);
			// Also save to CredentialsServiceV8 for MFAFlowBase to read
			const currentCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
				flowKey: 'mfa-flow-v8',
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
				...currentCreds,
				environmentId,
			});
		}
	}, [environmentId]);

	// Save username to localStorage and CredentialsServiceV8 when it changes
	// This ensures MFAFlowBase can read the username from its expected storage location
	useEffect(() => {
		if (username) {
			localStorage.setItem('mfa_unified_username', username);
			localStorage.setItem('mfa_username', username);
			// Also save to CredentialsServiceV8 for MFAFlowBase to read
			const currentCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
				flowKey: 'mfa-flow-v8',
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
				...currentCreds,
				username,
			});
		}
	}, [username]);

	// Handle device selection for authentication
	const handleDeviceSelectForAuthentication = (device: { id: string; type: string; deviceName?: string; nickname?: string }) => {
		console.log('🔓 Selected device for authentication:', device);
		// TODO: Implement actual authentication flow
		// This would typically involve:
		// 1. Initiating MFA challenge with the selected device
		// 2. Showing OTP input or waiting for push approval
		// 3. Completing the authentication flow
		toastV8.success(`Authentication initiated for ${device.deviceName || device.type} device`);
	};

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
						overflow: 'hidden',
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
					<div style={{ marginTop: '24px', marginBottom: '20px', paddingRight: '24px', overflow: 'hidden' }}>
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
	// For Authentication, show device selection modal
	if (flowMode === 'authentication') {
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
						Select which device to authenticate with for {username}
					</p>
				</div>

				{/* Authentication Instructions */}
				<div
					style={{
						background: '#ffffff',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '28px',
						border: '1px solid #e5e7eb',
					}}
				>
					<h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
						How Authentication Works
					</h2>
					<div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
						<ol style={{ margin: 0, paddingLeft: '20px' }}>
							<li style={{ marginBottom: '8px' }}>
								<strong>Device Selection:</strong> Choose from your registered MFA devices
							</li>
							<li style={{ marginBottom: '8px' }}>
								<strong>Challenge Initiation:</strong> We'll send a verification request to your selected device
							</li>
							<li style={{ marginBottom: '8px' }}>
								<strong>Verification:</strong> Enter the code or approve the request on your device
							</li>
							<li style={{ marginBottom: '0' }}>
								<strong>Completion:</strong> Authentication successful! You'll be redirected to the application
							</li>
						</ol>
					</div>
				</div>

				{/* Device Selection Button */}
				<div style={{ textAlign: 'center' }}>
					<button
						type="button"
						onClick={() => setShowDeviceSelectionModal(true)}
						style={{
							padding: '16px 32px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#2563eb';
							e.currentTarget.style.transform = 'translateY(-2px)';
							e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#3b82f6';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
						}}
					>
						📱 Select Authentication Device
					</button>
				</div>

				{/* Device Selection Modal */}
				<UnifiedDeviceSelectionModal
					isOpen={showDeviceSelectionModal}
					onClose={() => setShowDeviceSelectionModal(false)}
					onDeviceSelect={handleDeviceSelectForAuthentication}
					username={username}
					environmentId={environmentId}
				/>
			</div>
		);
	}

	// Registration flow - show device type selection cards
	return (
		<div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
			{/* Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
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
					➕ Register MFA Device
				</h1>
				<p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>
					Select a device type to register for {username || 'the user'}
				</p>
			</div>

			{/* Device Type Cards */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
				{DEVICE_TYPES.map((device) => {
					const enabled = isDeviceEnabled(device.key);
					return (
						<button
							key={device.key}
							type="button"
							onClick={() => enabled && onSelectDeviceType(device.key)}
							disabled={!enabled}
							style={{
								padding: '24px',
								background: enabled ? '#ffffff' : '#f9fafb',
								border: `2px solid ${enabled ? '#e5e7eb' : '#f3f4f6'}`,
								borderRadius: '12px',
								cursor: enabled ? 'pointer' : 'not-allowed',
								textAlign: 'left',
								opacity: enabled ? 1 : 0.5,
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								if (enabled) {
									e.currentTarget.style.borderColor = '#10b981';
									e.currentTarget.style.background = '#ecfdf5';
									e.currentTarget.style.transform = 'translateY(-2px)';
								}
							}}
							onMouseLeave={(e) => {
								if (enabled) {
									e.currentTarget.style.borderColor = '#e5e7eb';
									e.currentTarget.style.background = '#ffffff';
									e.currentTarget.style.transform = 'translateY(0)';
								}
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
								<span style={{ fontSize: '32px' }}>{device.icon}</span>
								<span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
									{device.name}
								</span>
							</div>
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
								{device.description}
							</p>
							{!enabled && (
								<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
									(Not enabled)
								</p>
							)}
						</button>
					);
				})}
			</div>
		</div>
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
	// USER FLOW OAUTH STATE
	// ========================================================================

	// State for User Login Modal (OAuth authentication for User Flow)
	const [showUserLoginModal, setShowUserLoginModal] = useState(false);
	const [userToken, setUserToken] = useState<string | null>(() => {
		// Check if we already have a user token from previous OAuth flow
		const savedCreds = CredentialsServiceV8.loadCredentials('user-login-v8', {
			flowKey: 'user-login-v8',
			flowType: 'oauth',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		return savedCreds?.userToken || null;
	});

	// Pending registration data while waiting for OAuth
	const [pendingRegistration, setPendingRegistration] = useState<{
		deviceType: DeviceConfigKey;
		fields: Record<string, string>;
		flowType: string;
		props: MFAFlowBaseRenderProps;
	} | null>(null);

	// Get environment ID for UserLoginModal
	const envIdForModal = useMemo(() => {
		return globalEnvironmentService.getEnvironmentId() || '';
	}, []);


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
	 * Handle user token received from OAuth flow
	 */
	const handleUserTokenReceived = useCallback((token: string) => {
		console.log('[UNIFIED-FLOW] User token received from OAuth', { tokenLength: token.length });
		setUserToken(token);

		// If we have pending registration, continue with it
		if (pendingRegistration) {
			toastV8.success('Authentication successful! Continuing with device registration...');
			setShowUserLoginModal(false);

			// Continue registration with the new token
			const { deviceType: pendingDeviceType, fields, flowType, props } = pendingRegistration;
			setPendingRegistration(null);

			// Re-call performRegistration with the token now available
			performRegistrationWithToken(props, pendingDeviceType, fields, flowType, token);
		}
	}, [pendingRegistration]);

	/**
	 * Perform device registration API call (with token already available)
	 */
	const performRegistrationWithToken = useCallback(
		async (
			props: MFAFlowBaseRenderProps,
			selectedDeviceType: DeviceConfigKey,
			fields: Record<string, string>,
			flowType: string,
			token?: string
		) => {
			console.log('[UNIFIED-FLOW] Performing registration with token', { selectedDeviceType, flowType, hasToken: !!token });

			try {
				props.setIsLoading(true);

				// Update credentials with device fields and user token if provided
				props.setCredentials((prev) => ({
					...prev,
					deviceType: selectedDeviceType,
					...fields,
					...(flowType === 'user' && token ? { userToken: token, tokenType: 'user' } : {}),
				}));

				// Register the device using proper API call
				// CRITICAL: Flow-specific device status
				// - Admin flow: ACTIVE (no OTP sent, device ready immediately)
				// - Admin ACTIVATION_REQUIRED: ACTIVATION_REQUIRED (sends OTP for admin to activate)
				// - User flow: ACTIVATION_REQUIRED (sends OTP for user to activate)
				let deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED';
				if (flowType === 'admin') {
					deviceStatus = 'ACTIVE';
				} else if (flowType === 'admin_activation_required') {
					deviceStatus = 'ACTIVATION_REQUIRED';
				} else {
					deviceStatus = 'ACTIVATION_REQUIRED'; // user flow
				}

				console.log('[UNIFIED-FLOW] Device status determined:', {
					flowType,
					deviceStatus,
					otpWillBeSent: deviceStatus === 'ACTIVATION_REQUIRED',
					reason: flowType === 'admin'
						? 'Admin flow - device activated immediately, no OTP needed'
						: flowType === 'admin_activation_required'
						? 'Admin ACTIVATION_REQUIRED flow - OTP sent for admin activation'
						: 'User flow - OTP required for activation'
				});

				// Use same parameter construction as working MFA flows
				const baseParams = {
					environmentId: props.credentials.environmentId,
					username: props.credentials.username,
					type: selectedDeviceType,
					// Per rightTOTP.md: Pass token type and user token if available
					tokenType: flowType === 'user' ? 'user' : 'worker',
					userToken: flowType === 'user' ? token : undefined,
					// CRITICAL: This status tells MFA whether to send OTP
					// ACTIVATION_REQUIRED = Send OTP to user
					// ACTIVE = Device is pre-activated, no OTP
					status: deviceStatus,
				};

				// Map form field names to API field names
				// Form uses 'deviceName' but API expects 'nickname' or 'name'
				const mappedFields: Record<string, string> = { ...fields };
				if (mappedFields.deviceName) {
					mappedFields.nickname = mappedFields.deviceName;
					mappedFields.name = mappedFields.deviceName;
					delete mappedFields.deviceName;
				}

				// Format phone number for SMS/WhatsApp devices
				// Form sends: { phoneNumber: '9725231586', countryCode: '+1' }
				// API expects: { phone: '+1.9725231586' }
				if (mappedFields.phoneNumber && mappedFields.countryCode) {
					const countryCode = mappedFields.countryCode.replace('+', ''); // Remove + for formatting
					const phoneNumber = mappedFields.phoneNumber.replace(/\D/g, ''); // Remove non-digits
					mappedFields.phone = `+${countryCode}.${phoneNumber}`;
					console.log('[UNIFIED-FLOW] Formatted phone:', mappedFields.phone);
					delete mappedFields.phoneNumber;
					delete mappedFields.countryCode;
				}

				// Include device-specific fields (phone, email, etc.)
				const deviceParams = {
					...baseParams,
					...mappedFields,
				};

				console.log('[UNIFIED-FLOW] Registering device with params:', deviceParams);

				const result = await MFAServiceV8.registerDevice(deviceParams);
				console.log('[UNIFIED-FLOW] Device registered:', result);

				// Clear stored registration data after successful use
				localStorage.removeItem('mfa_registration_flow_type');
				localStorage.removeItem('mfa_registration_fields');
				localStorage.removeItem('mfa_registration_device_type');

				// Update MFA state with device info
				const registrationResult = result as unknown as Record<string, unknown>;
				props.setMfaState((prev) => ({
					...prev,
					deviceId: result.deviceId,
					deviceStatus: result.status,
					// Store device.activate URI for activation if present
					...(registrationResult.deviceActivateUri
						? { deviceActivateUri: String(registrationResult.deviceActivateUri) }
						: {}),
				}));

				// Handle flow-specific logic based on device status
				if (result.status === 'ACTIVE') {
					// Admin flow with ACTIVE status - device is ready to use
					// Skip activation step and go directly to success (step 2)
					toastV8.success(`${config.displayName} device registered successfully! Device is ready to use.`);
					props.nav.markStepComplete(); // Mark registration as complete
					props.nav.goToStep(2); // Skip to success step
				} else if (result.status === 'ACTIVATION_REQUIRED') {
					// Device requires activation - PingOne automatically sends OTP
					// This applies to both admin_activation_required and user flow
					toastV8.success(`${config.displayName} device registered! OTP has been sent automatically.`);
					props.nav.goToNext(); // Go to activation step
				} else {
					// Unknown status, proceed to activation step by default
					props.nav.goToNext();
				}
			} catch (error) {
				console.error('[UNIFIED-FLOW] Registration failed:', error);
				toastV8.error(error instanceof Error ? error.message : 'Device registration failed');
			} finally {
				props.setIsLoading(false);
			}
		},
		[config.displayName]
	);

	/**
	 * Perform device registration API call
	 * Checks if User Flow needs OAuth first, otherwise proceeds with registration
	 */
	const performRegistration = useCallback(
		async (
			props: MFAFlowBaseRenderProps,
			selectedDeviceType: DeviceConfigKey,
			fields: Record<string, string>,
			flowType: string
		) => {
			console.log('[UNIFIED-FLOW] Device registration submitted', { selectedDeviceType, fields, flowType });

			// For User Flow, check if we need OAuth authentication first
			if (flowType === 'user' && !userToken) {
				console.log('[UNIFIED-FLOW] User flow selected but no token - showing OAuth modal');

				// Store pending registration data
				setPendingRegistration({
					deviceType: selectedDeviceType,
					fields,
					flowType,
					props,
				});

				// Show the user login modal
				setShowUserLoginModal(true);
				toastV8.info('User Flow requires PingOne authentication. Please log in to continue.');
				return;
			}

			// Proceed with registration (using existing token for user flow)
			await performRegistrationWithToken(props, selectedDeviceType, fields, flowType, userToken || undefined);
		},
		[userToken, performRegistrationWithToken]
	);

	/**
	 * Render Step 0: Registration form for SMS
	 */
	const renderStep0 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<UnifiedDeviceRegistrationForm
					initialDeviceType={deviceType}
					onSubmit={async (selectedDeviceType, fields, flowType) => {
						await performRegistration(props, selectedDeviceType, fields, flowType);
					}}
					onCancel={() => {
						console.log('[UNIFIED-FLOW] Registration cancelled');
					}}
					isLoading={props.isLoading}
				/>
			);
		},
		[deviceType, performRegistration]
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
	 * Render Step 2: API Documentation
	 */
	const renderStep2 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<MFADocumentationPageV8
					deviceType={deviceType}
					flowType="registration"
					credentials={{
						...(props.credentials.environmentId && { environmentId: props.credentials.environmentId }),
						...(props.credentials.username && { username: props.credentials.username }),
						...(props.credentials.deviceAuthenticationPolicyId && { deviceAuthenticationPolicyId: props.credentials.deviceAuthenticationPolicyId }),
					}}
					currentStep={2}
					totalSteps={4}
					registrationFlowType={props.credentials.tokenType === 'user' ? 'user' : 'admin'}
					tokenType={props.credentials.tokenType === 'user' ? 'user' : 'worker'}
					flowSpecificData={{
						...(props.credentials.environmentId && { environmentId: props.credentials.environmentId }),
						...(props.credentials.username && { username: props.credentials.username }),
						...(props.mfaState.deviceId && { deviceId: props.mfaState.deviceId }),
						...(props.credentials.deviceAuthenticationPolicyId && { policyId: props.credentials.deviceAuthenticationPolicyId }),
						...(props.mfaState.deviceStatus && { deviceStatus: props.mfaState.deviceStatus }),
						...(props.credentials.clientId && { clientId: props.credentials.clientId }),
					}}
				/>
			);
		},
		[deviceType]
	);

	/**
	 * Render Step 3: Success
	 */
	const renderStep3 = useCallback(
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
			'API Documentation',
			'Success',
		],
		[config]
	);

	// ========================================================================
	// CREDENTIAL VALIDATION
	// ========================================================================

	/**
	 * Always show Next button - let user click it to trigger login when needed
	 */
	const shouldHideNextButton = useCallback(
		(_props: MFAFlowBaseRenderProps) => {
			// Don't automatically open UserLoginModal - let user click Next button
			// Always show Next button so user can initiate login when needed
			return false; // Always show Next button
		},
		[]
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
				shouldHideNextButton={shouldHideNextButton}
			/>
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			{/* User Login Modal for User Flow OAuth */}
			<UserLoginModalV8
				isOpen={showUserLoginModal}
				onClose={() => {
					setShowUserLoginModal(false);
					setPendingRegistration(null);
				}}
				onTokenReceived={handleUserTokenReceived}
				environmentId={envIdForModal}
			/>
		</>
	);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedMFARegistrationFlowV8;
