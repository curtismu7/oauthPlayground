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
 * - Integrates with MFACredentialContext and useWorkerToken hook
 * - Uses existing MFAFlowBaseV8 for 5-step framework
 *
 * @example
 * <UnifiedMFARegistrationFlowV8
 *   deviceType="SMS"
 *   onSuccess={(result) => console.log('Device registered:', result.deviceId)}
 * />
 */

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import type { SearchableDropdownOption } from '@/v8/components/SearchableDropdownV8';
import { SearchableDropdownV8 } from '@/v8/components/SearchableDropdownV8';
import { SQLiteStatsDisplayV8 } from '@/v8/components/SQLiteStatsDisplayV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { getDeviceConfig } from '@/v8/config/deviceFlowConfigs';
import type { DeviceConfigKey, DeviceRegistrationResult } from '@/v8/config/deviceFlowConfigTypes';
import { PING_IDENTITY_COLORS } from '@/v8/constants/pingIdentityColors';
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
import { APIDocsStepV8 } from '@/v8/flows/shared/APIDocsStepV8';
import { SuccessStepV8 } from '@/v8/flows/shared/SuccessStepV8';
import { UserLoginStepV8 } from '@/v8/flows/shared/UserLoginStepV8';
import { useMFAPolicies } from '@/v8/hooks/useMFAPolicies';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { useUserSearch } from '@/v8/hooks/useUserSearch';
import { useWorkerToken } from '@/v8/hooks/useWorkerToken';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import { MfaAuthenticationServiceV8 } from '@/v8/services/mfaAuthenticationServiceV8';
import { type MFAFeatureFlag, MFAFeatureFlagsV8 } from '@/v8/services/mfaFeatureFlagsV8';
import MFAServiceV8_Legacy, { type RegisterDeviceParams } from '@/v8/services/mfaServiceV8_Legacy';
import {
	checkPingOneAuthentication,
	shouldRedirectToPingOne,
} from '@/v8/services/pingOneAuthenticationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { UnifiedOAuthCredentialsServiceV8U } from '@/v8u/services/unifiedOAuthCredentialsServiceV8U';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { DeviceAuthenticationPolicy, MFACredentials, MFAState } from '../shared/MFATypes';
import { UnifiedActivationStep } from './components/UnifiedActivationStep';
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
	registrationFlowType?: 'admin-active' | 'admin-activation' | 'user';
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
	{
		key: 'TOTP',
		icon: '🔐',
		name: 'Authenticator App (TOTP)',
		description: 'Use Google Authenticator, Authy, or similar',
	},
	{
		key: 'MOBILE',
		icon: '📲',
		name: 'Mobile Push',
		description: 'Receive push notifications on your phone',
	},
	{ key: 'WHATSAPP', icon: '💬', name: 'WhatsApp', description: 'Receive OTP codes via WhatsApp' },
	{
		key: 'FIDO2',
		icon: '🔑',
		name: 'Security Key (FIDO2)',
		description: 'Use a hardware security key or passkey',
	},
];

/** Check if a device type is enabled via feature flags */
const isDeviceEnabled = (deviceKey: DeviceConfigKey): boolean => {
	const flag = DEVICE_FLAG_MAP[deviceKey];
	return MFAFeatureFlagsV8.isEnabled(flag);
};

interface DeviceTypeSelectionScreenProps {
	onSelectDeviceType: (deviceType: DeviceConfigKey) => void;
	userToken?: string | null;
	setUserToken: (token: string | null) => void;
	registrationFlowType?: 'admin-active' | 'admin-activation' | 'user';
}

const DeviceTypeSelectionScreen: React.FC<DeviceTypeSelectionScreenProps> = ({
	onSelectDeviceType,
	userToken,
	setUserToken,
	registrationFlowType,
}) => {
	const [flowMode, setFlowMode] = useState<FlowMode | null>(null);
	const [environmentId, setEnvironmentId] = useState('');
	const [username, setUsername] = useState('');
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
	const [showOTPModal, setShowOTPModal] = useState(false);
	const [otpCode, setOtpCode] = useState('');
	const [authenticationId, setAuthenticationId] = useState<string | null>(null);
	const [selectedAuthDevice, setSelectedAuthDevice] = useState<{
		id: string;
		type: string;
		nickname?: string;
	} | null>(null);
	const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
	const [uploadedFileInfo, setUploadedFileInfo] = useState<{
		name: string;
		size: number;
		type: string;
		timestamp: number;
		base64Url?: string;
	} | null>(null);
	const [showAuthLoginModal, setShowAuthLoginModal] = useState(false);
	const authEnvIdForModal = useMemo(() => globalEnvironmentService.getEnvironmentId() || '', []);

	// Load uploaded logo from localStorage on mount
	useEffect(() => {
		try {
			const savedUpload = localStorage.getItem('custom-logo-upload');
			if (savedUpload) {
				const uploadData = JSON.parse(savedUpload);
				// Handle both old format (objectUrl) and new format (base64Url)
				if (uploadData.base64Url) {
					setUploadedFileInfo({
						name: uploadData.name,
						size: uploadData.size,
						type: uploadData.type,
						timestamp: uploadData.timestamp,
						base64Url: uploadData.base64Url,
					});
				} else if (uploadData.objectUrl) {
					// Old format - try to convert if possible, otherwise clear it
					console.warn('Old logo format detected - please re-upload your logo');
					localStorage.removeItem('custom-logo-upload');
				}
			}
		} catch (error) {
			console.error('Failed to load uploaded logo from localStorage:', error);
			// Clear corrupted data
			localStorage.removeItem('custom-logo-upload');
		}
	}, []);

	// Use worker token hook for token management
	const workerToken = useWorkerToken({
		refreshInterval: 5000,
		enableAutoRefresh: true,
	});

	// Extract environment ID from worker token when available
	useEffect(() => {
		const extractEnvironmentId = async () => {
			try {
				const token = await workerTokenServiceV8.getToken();
				if (token && !environmentId) {
					const parts = token.split('.');
					if (parts.length === 3) {
						const payload = JSON.parse(atob(parts[1]));
						if (payload.environmentId) {
							setEnvironmentId(payload.environmentId);
							console.log(
								`${MODULE_TAG} Environment ID extracted from worker token:`,
								payload.environmentId
							);
						}
					}
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to extract environment ID from worker token:`, error);
			}
		};

		extractEnvironmentId();
	}, [environmentId]);

	const hasWorkerToken = workerToken.tokenStatus.isValid;

	// Use user search hook for user fetching and search
	const {
		users,
		isLoading: isLoadingUsers,
		setSearchQuery,
	} = useUserSearch({
		environmentId,
		tokenValid: workerToken.tokenStatus.isValid || environmentId.trim() !== '', // Allow search when env ID exists
		maxPages: 100,
		useCache: true,
	});
	const tokenStatus = workerToken.tokenStatus;

	// Debug: Log users type to understand the issue
	useEffect(() => {
		console.log(`${MODULE_TAG} users type check:`, {
			users,
			isArray: Array.isArray(users),
			type: typeof users,
			constructor: users?.constructor?.name,
		});
	}, [users]);

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
		tokenIsValid: tokenStatus.isValid,
		autoLoad: true,
		autoSelectSingle: true,
	});

	const selectedPolicyRef = useRef<DeviceAuthenticationPolicy | null>(null);
	useEffect(() => {
		selectedPolicyRef.current = selectedPolicy ?? null;
	}, [selectedPolicy]);

	const isPolicyDeviceEnabled = useCallback(
		(policy: DeviceAuthenticationPolicy | null, key: string) => {
			const deviceConfig = policy?.[key] as { enabled?: boolean } | undefined;
			return !!deviceConfig?.enabled;
		},
		[]
	);

	const policyOptions: SearchableDropdownOption[] = useMemo(
		() =>
			policies.map((policy) => ({
				value: policy.id,
				label: policy.name,
				...(policy.default ? { secondaryLabel: '(Default)' } : {}),
			})),
		[policies]
	);

	const userOptions: SearchableDropdownOption[] = useMemo(
		() =>
			Array.from(
				new Map(
					(Array.isArray(users) ? users : []).map((user) => [
						user.username,
						{
							value: user.username,
							label: user.username,
							...(user.email ? { secondaryLabel: user.email } : {}),
						} as SearchableDropdownOption,
					])
				).values()
			),
		[users]
	);

	// Auto-select default policy when policies load
	useEffect(() => {
		if (defaultPolicy && !selectedPolicy) {
			selectPolicy(defaultPolicy.id);
		}
	}, [defaultPolicy, selectedPolicy, selectPolicy]);

	// Sync environment ID to global service and enhanced storage when it changes
	useEffect(() => {
		if (environmentId) {
			globalEnvironmentService.setEnvironmentId(environmentId);
			localStorage.setItem('mfa_environmentId', environmentId);

			// Save to enhanced storage with IndexedDB + SQLite backup
			const saveEnhancedStorage = async () => {
				let currentCreds = null;

				try {
					await UnifiedOAuthCredentialsServiceV8U.saveSharedCredentials(
						{
							environmentId,
						},
						{
							environmentId,
							enableBackup: !!environmentId,
							backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
						}
					);
					console.log('[UNIFIED-MFA] Environment ID saved to enhanced storage');
				} catch (error) {
					console.warn('[UNIFIED-MFA] Enhanced storage failed, using fallback', error);
					// Fallback to CredentialsServiceV8
					currentCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
						flowKey: 'mfa-flow-v8',
						flowType: 'oidc',
						includeClientSecret: false,
						includeEnvironmentId: true,
						includeLogoutUri: false,
						includeScopes: false,
					});
					CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
						...currentCreds,
						environmentId,
					});
				}

				// Dispatch credential update event for other components (like device management)
				window.dispatchEvent(
					new CustomEvent('mfaCredentialsUpdated', {
						detail: { environmentId, username: currentCreds?.username || username },
					})
				);
			};

			saveEnhancedStorage();
		}
	}, [environmentId, username]);

	// Save username to enhanced storage when it changes
	// This ensures MFAFlowBase can read the username from enhanced storage
	useEffect(() => {
		if (username) {
			localStorage.setItem('mfa_unified_username', username);
			localStorage.setItem('mfa_username', username);

			// Save to enhanced storage with IndexedDB + SQLite backup
			const saveEnhancedStorage = async () => {
				let currentCreds = null;

				try {
					await UnifiedOAuthCredentialsServiceV8U.saveSharedCredentials(
						{
							username,
							environmentId,
						},
						{
							environmentId,
							enableBackup: !!environmentId,
							backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
						}
					);
					console.log('[UNIFIED-MFA] Username saved to enhanced storage');
				} catch (error) {
					console.warn('[UNIFIED-MFA] Enhanced storage failed, using fallback', error);
					// Fallback to CredentialsServiceV8
					currentCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
						flowKey: 'mfa-flow-v8',
						flowType: 'oidc',
						includeClientSecret: false,
						includeEnvironmentId: true,
						includeLogoutUri: false,
						includeScopes: false,
					});
					CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
						...currentCreds,
						username,
					});
				}

				// Dispatch credential update event for other components (like device management)
				window.dispatchEvent(
					new CustomEvent('mfaCredentialsUpdated', {
						detail: { environmentId: currentCreds?.environmentId || environmentId, username },
					})
				);
			};

			saveEnhancedStorage();
		}
	}, [username, environmentId]);

	// Handle device selection for authentication
	const handleDeviceSelectForAuthentication = async (device: {
		id: string;
		type: string;
		deviceName?: string;
		nickname?: string;
	}) => {
		console.log(`${MODULE_TAG} Selected device for authentication:`, device);
		setShowDeviceSelectionModal(false);
		setSelectedAuthDevice(device);

		const policyId = selectedPolicy?.id;
		if (!policyId) {
			toastV8.error('Please select an MFA Policy first');
			return;
		}

		// Determine flow type and token
		// FIXED: Use registrationFlowType prop instead of incorrectly guessing based on userToken presence
		// Admin flows should use worker tokens, not require user tokens
		let flowType: 'admin' | 'user';

		if (registrationFlowType) {
			// Use explicitly specified flow type
			flowType = registrationFlowType.startsWith('admin') ? 'admin' : 'user';
		} else {
			// Default to admin flow unless explicitly set to user
			flowType = 'admin';
		}

		const effectiveUserToken = flowType === 'user' ? userToken : undefined;

		// For admin flow, check if we have a valid worker token before proceeding
		if (flowType === 'admin' && !hasWorkerToken) {
			toastV8.error(
				'Admin flow requires a valid worker token. Please generate a worker token first.'
			);
			return;
		}

		try {
			// Initialize authentication with appropriate token
			const response = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
				environmentId,
				username: username.trim(),
				deviceAuthenticationPolicyId: policyId,
				deviceId: device.id,
				region: 'na',
				...(effectiveUserToken && { userToken: effectiveUserToken }),
			});

			console.log(`${MODULE_TAG} Auth initialized - full response:`, response);
			setAuthenticationId(response.id);

			const status = (response.status || '').toUpperCase();
			const nextStep = (response.nextStep || '').toUpperCase();
			const links = response._links as Record<string, { href?: string }> | undefined;
			const hasOtpLink = !!(
				links &&
				(links.otp || links['otp.check'] || (links as Record<string, unknown>)['checkOtp'])
			);

			console.log(`${MODULE_TAG} Auth status:`, {
				status,
				nextStep,
				hasOtpLink,
				deviceType: device.type,
			});

			// Show appropriate UI based on response (normalize status/nextStep for PingOne variants)
			if (status === 'OTP_REQUIRED' || nextStep === 'OTP_REQUIRED' || hasOtpLink) {
				console.log(`${MODULE_TAG} Opening OTP modal for device:`, device.type);
				setShowOTPModal(true);
				toastV8.success(`Verification code sent to your ${device.type} device`);
			} else if (status === 'ASSERTION_REQUIRED' || nextStep === 'ASSERTION_REQUIRED') {
				console.log(`${MODULE_TAG} FIDO2 assertion required`);
				toastV8.info(
					'FIDO2 authentication required. Please use /v8/mfa-config for FIDO2 authentication.'
				);
				setFlowMode(null);
			} else if (
				status === 'PUSH_CONFIRMATION_REQUIRED' ||
				nextStep === 'PUSH_CONFIRMATION_REQUIRED'
			) {
				console.log(`${MODULE_TAG} Push confirmation required`);
				toastV8.success('Push notification sent! Please approve on your mobile device.');
				toastV8.info('Complete authentication at /v8/mfa-config for push polling.');
				setFlowMode(null);
			} else if (status === 'COMPLETED') {
				toastV8.success('Authentication completed successfully!');
				setFlowMode(null);
			} else if (
				status === 'DEVICE_SELECTION_REQUIRED' ||
				nextStep === 'SELECTION_REQUIRED' ||
				nextStep === 'DEVICE_SELECTION_REQUIRED'
			) {
				console.log(`${MODULE_TAG} Device selection required - showing modal again`);
				setShowDeviceSelectionModal(true);
			} else {
				console.warn(`${MODULE_TAG} Unexpected authentication status:`, {
					status,
					nextStep,
					response,
				});
				toastV8.info(`Authentication status: ${status || nextStep || 'UNKNOWN'}`);
				// Stay in authentication flow so user can try another device
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);

			// Enhanced error handling for NO_USABLE_DEVICES
			let errorMessage = 'Authentication failed: ';
			if (error instanceof Error) {
				const errorStr = error.message.toLowerCase();

				// Check for NO_USABLE_DEVICES or device availability errors
				if (
					errorStr.includes('no usable devices') ||
					errorStr.includes('too many') ||
					errorStr.includes('cooldown') ||
					errorStr.includes('blocked')
				) {
					errorMessage = '⚠️ Device Temporarily Unavailable\n\n';

					if (errorStr.includes('cooldown') || errorStr.includes('too many')) {
						errorMessage +=
							'Too many notifications have been sent to this device. It is temporarily in cooldown. ';
						errorMessage +=
							'Please wait a few minutes and try again, or select a different device.';
					} else if (errorStr.includes('blocked')) {
						errorMessage +=
							'This device has been blocked. Please contact your administrator or use a different device.';
					} else {
						errorMessage += error.message;
					}
				} else {
					errorMessage += error.message;
				}
			} else {
				errorMessage += 'Unknown error';
			}

			toastV8.error(errorMessage, { duration: 8000 });
			// Do NOT set flowMode(null) - keep user in authentication flow so they can retry or select another device
		}
	};

	// Handle OTP verification
	const handleVerifyOTP = async () => {
		if (!authenticationId || !selectedAuthDevice) {
			toastV8.error('Authentication session not found');
			return;
		}

		if (otpCode.length !== 6) {
			toastV8.error('Please enter a 6-digit code');
			return;
		}

		// Get worker token for API call
		const workerTokenForOTP = await workerTokenServiceV8.getToken();

		console.log(`${MODULE_TAG} OTP verification debug:`, {
			environmentId,
			username: username.trim(),
			authenticationId,
			otpCode,
			hasEnvironmentId: !!environmentId,
			envIdLength: environmentId?.length,
			hasWorkerToken: !!workerTokenForOTP,
			workerTokenLength: workerTokenForOTP?.length,
		});

		try {
			// Use backend proxy to avoid CORS issues
			const response = await fetch('/api/pingone/mfa/validate-otp-for-device', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					username: username.trim(),
					deviceAuthId: authenticationId,
					otp: otpCode,
					region: 'na',
					workerToken: workerTokenForOTP,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
			}

			const result = await response.json();

			if (result.status === 'COMPLETED' || result.status === 'completed') {
				toastV8.success('✅ Authentication completed successfully!');
				setShowOTPModal(false);
				setFlowMode(null);
				setOtpCode('');
			} else {
				toastV8.error('Invalid code. Please try again.');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} OTP verification failed:`, error);
			toastV8.error(
				`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	// Step 1: Choose Registration or Authentication
	if (!flowMode) {
		return (
			<>
				<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px' }}>
					{/* Header */}
					<div
						style={{
							background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
							borderRadius: '12px',
							padding: '16px 20px',
							marginBottom: '16px',
							boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
						}}
					>
						<h1
							style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700', color: '#ffffff' }}
						>
							🔐 MFA Unified Flow
						</h1>
						<p
							style={{
								margin: 0,
								fontSize: '15px',
								color: 'rgba(255, 255, 255, 0.9)',
								lineHeight: '1.5',
							}}
						>
							Choose what you want to do with MFA devices.
						</p>
					</div>

					{/* Configuration Section */}
					<div
						style={{
							background: '#ffffff',
							borderRadius: '12px',
							padding: '16px',
							marginBottom: '16px',
							border: '1px solid #e5e7eb',
							overflow: 'hidden',
						}}
					>
						<h2
							style={{
								margin: '0 0 12px 0',
								fontSize: '18px',
								fontWeight: '600',
								color: '#111827',
							}}
						>
							Configuration
						</h2>

						{/* Custom Logo URL */}
						<div style={{ marginBottom: '12px' }}>
							<label
								htmlFor="custom-logo-url"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: PING_IDENTITY_COLORS.neutral[800],
									marginBottom: '8px',
								}}
							>
								🎨 Custom Logo URL (Optional)
							</label>
							<p
								style={{
									margin: '0 0 8px 0',
									fontSize: '13px',
									color: PING_IDENTITY_COLORS.neutral[600],
								}}
							>
								Display a custom logo in the OTP verification modal
							</p>

							{/* URL Input */}
							<input
								id="custom-logo-url"
								type="url"
								value={customLogoUrl}
								onChange={(e) => setCustomLogoUrl(e.target.value)}
								placeholder="https://example.com/logo.png"
								style={{
									width: '100%',
									padding: '10px 14px',
									fontSize: '14px',
									border: `1px solid ${PING_IDENTITY_COLORS.neutral[300]}`,
									borderRadius: '6px',
									outline: 'none',
									transition: 'all 0.2s ease',
									boxSizing: 'border-box',
									marginBottom: '12px',
									background: '#ffffff',
									color: PING_IDENTITY_COLORS.neutral[900],
								}}
								onFocus={(e) => {
									e.currentTarget.style.borderColor = PING_IDENTITY_COLORS.primary[500];
									e.currentTarget.style.boxShadow = `0 0 0 3px ${PING_IDENTITY_COLORS.primary[200]}`;
								}}
								onBlur={(e) => {
									e.currentTarget.style.borderColor = PING_IDENTITY_COLORS.neutral[300];
									e.currentTarget.style.boxShadow = 'none';
								}}
							/>

							{/* File Upload Section */}
							<div style={{ marginBottom: '12px' }}>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
								>
									<span style={{ fontSize: '13px', color: PING_IDENTITY_COLORS.neutral[500] }}>
										OR
									</span>
								</div>
								<input
									type="file"
									id="custom-logo-upload"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file) return;

										// Validate file type (images only)
										if (!file.type.startsWith('image/')) {
											toastV8.error('Please select a logo file (JPG, PNG, etc.)');
											return;
										}

										// Validate file size (max 5MB)
										if (file.size > 5 * 1024 * 1024) {
											toastV8.error('File size must be less than 5MB');
											return;
										}

										// Convert file to base64 for persistence
										const reader = new FileReader();
										reader.onload = (event) => {
											const base64Url = event.target?.result as string;

											// Store file info in state
											const fileInfo = {
												name: file.name,
												size: file.size,
												type: file.type,
												timestamp: Date.now(),
												base64Url: base64Url,
											};

											console.log('🔍 [FILE-UPLOAD-DEBUG] File info created:', {
												name: fileInfo.name,
												size: fileInfo.size,
												type: fileInfo.type,
												hasBase64Url: !!fileInfo.base64Url,
												base64UrlLength: fileInfo.base64Url?.length,
											});

											setUploadedFileInfo(fileInfo);

											// Save to localStorage for persistence
											localStorage.setItem('custom-logo-upload', JSON.stringify(fileInfo));

											toastV8.success(`Logo uploaded: ${file.name}`);
										};
										reader.onerror = () => {
											toastV8.error('Failed to read uploaded file');
										};
										reader.readAsDataURL(file);
									}}
									style={{ display: 'none' }}
								/>
								<label
									htmlFor="custom-logo-upload"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '8px',
										padding: '8px 16px',
										background: PING_IDENTITY_COLORS.primary[500],
										color: 'white',
										border: `1px solid ${PING_IDENTITY_COLORS.primary[600]}`,
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '13px',
										fontWeight: '500',
										transition: 'all 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = PING_IDENTITY_COLORS.primary[600];
										e.currentTarget.style.borderColor = PING_IDENTITY_COLORS.primary[700];
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = PING_IDENTITY_COLORS.primary[500];
										e.currentTarget.style.borderColor = PING_IDENTITY_COLORS.primary[600];
									}}
								>
									📁 Upload Logo File
								</label>
								<span
									style={{
										fontSize: '12px',
										color: PING_IDENTITY_COLORS.neutral[500],
										marginLeft: '8px',
									}}
								>
									JPG, PNG, GIF (max 5MB)
								</span>
							</div>

							{(uploadedFileInfo || customLogoUrl) && (
								<div
									style={{
										marginTop: '12px',
										textAlign: 'center',
										padding: '12px',
										background: PING_IDENTITY_COLORS.neutral[50],
										border: `1px solid ${PING_IDENTITY_COLORS.neutral[200]}`,
										borderRadius: '6px',
									}}
								>
									<p
										style={{
											margin: '0 0 8px 0',
											fontSize: '12px',
											color: PING_IDENTITY_COLORS.neutral[600],
											fontWeight: '600',
										}}
									>
										Logo Preview:
									</p>
									{uploadedFileInfo ? (
										<>
											{(() => {
												console.log(
													'🔍 [RENDER-DEBUG] Rendering uploadedFileInfo:',
													uploadedFileInfo
												);
												return null;
											})() || ''}
											<img
												src={uploadedFileInfo.base64Url || ''}
												alt="Custom logo"
												style={{
													maxWidth: '80px',
													maxHeight: '80px',
													objectFit: 'contain',
													border: `1px solid ${PING_IDENTITY_COLORS.neutral[200]}`,
													borderRadius: '4px',
													background: 'white',
													padding: '4px',
												}}
												onError={() => {
													console.error('Failed to load uploaded logo');
												}}
											/>
											<div style={{ marginTop: '8px' }}>
												<p
													style={{
														margin: '0 0 8px 0',
														fontSize: '11px',
														color: PING_IDENTITY_COLORS.neutral[500],
														fontWeight: '500',
													}}
												>
													File: {uploadedFileInfo?.name || 'Unknown file'}
												</p>
												<p
													style={{
														margin: '0 0 8px 0',
														fontSize: '10px',
														color: PING_IDENTITY_COLORS.neutral[400],
													}}
												>
													Size:{' '}
													{uploadedFileInfo?.size
														? `${(uploadedFileInfo.size / 1024).toFixed(1)} KB`
														: 'Unknown size'}
												</p>
											</div>
										</>
									) : (
										<>
											{(() => {
												console.log(
													'🔍 [RENDER-DEBUG] Rendering URL case, customLogoUrl:',
													customLogoUrl
												);
												return null;
											})() || ''}
											<img
												src={customLogoUrl}
												alt="Custom logo"
												style={{
													maxWidth: '80px',
													maxHeight: '80px',
													objectFit: 'contain',
													border: `1px solid ${PING_IDENTITY_COLORS.neutral[200]}`,
													borderRadius: '4px',
													background: 'white',
													padding: '4px',
												}}
												onError={() => {
													console.error('Failed to load custom logo URL');
												}}
											/>
											<div style={{ marginTop: '8px' }}>
												<p
													style={{
														margin: '0 0 8px 0',
														fontSize: '11px',
														color: PING_IDENTITY_COLORS.neutral[500],
														fontWeight: '500',
													}}
												>
													URL: {customLogoUrl}
												</p>
											</div>
										</>
									)}
									<div style={{ marginTop: '8px' }}>
										<button
											type="button"
											onClick={() => {
												setCustomLogoUrl('');
												setUploadedFileInfo(null);
												// Clear uploaded file from localStorage
												localStorage.removeItem('custom-logo-upload');
											}}
											style={{
												padding: '4px 8px',
												fontSize: '11px',
												background: PING_IDENTITY_COLORS.accent.pingRed[500],
												color: 'white',
												border: `1px solid ${PING_IDENTITY_COLORS.accent.pingRed[600]}`,
												borderRadius: '4px',
												cursor: 'pointer',
												transition: 'all 0.2s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = PING_IDENTITY_COLORS.accent.pingRed[600];
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = PING_IDENTITY_COLORS.accent.pingRed[500];
											}}
										>
											Remove Logo
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Environment ID - Hide when worker token is available */}
						{!hasWorkerToken && (
							<div style={{ marginBottom: '12px' }}>
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
						)}

						{/* SQLite Database Stats */}
						{environmentId && (
							<div style={{ marginBottom: '12px' }}>
								<SQLiteStatsDisplayV8
									environmentId={environmentId}
									compact={false}
									refreshInterval={30}
									showRefreshButton={true}
								/>
							</div>
						)}

						{/* Username */}
						<div style={{ marginBottom: '12px' }}>
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
							{environmentId ? (
								<SearchableDropdownV8
									id="username"
									value={username}
									options={userOptions}
									onChange={setUsername}
									placeholder={
										tokenStatus.isValid
											? 'Type to search across 16,000+ users...'
											: 'Enter username or configure worker token for search...'
									}
									isLoading={isLoadingUsers}
									onSearchChange={setSearchQuery}
									disabled={!tokenStatus.isValid}
									style={{
										opacity: tokenStatus.isValid ? 1 : 0.6,
										borderColor: tokenStatus.isValid ? '#d1d5db' : '#fbbf24',
									}}
								/>
							) : (
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
							)}
						</div>

						{/* MFA Policy Dropdown */}
						<div style={{ marginBottom: '12px' }}>
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
								<SearchableDropdownV8
									id="mfa-policy"
									value={selectedPolicy?.id || ''}
									options={policyOptions}
									onChange={selectPolicy}
									placeholder="Select an MFA policy..."
									isLoading={isPoliciesLoading}
								/>
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
										<div
											style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}
										>
											{isPolicyDeviceEnabled(selectedPolicy, 'sms') && (
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
											{isPolicyDeviceEnabled(selectedPolicy, 'email') && (
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
											{isPolicyDeviceEnabled(selectedPolicy, 'totp') && (
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
											{isPolicyDeviceEnabled(selectedPolicy, 'fido2') && (
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
											{isPolicyDeviceEnabled(selectedPolicy, 'mobile') && (
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
											{isPolicyDeviceEnabled(selectedPolicy, 'voice') && (
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
						<div
							style={{
								marginTop: '16px',
								marginBottom: '24px',
								paddingRight: '16px',
								overflow: 'hidden',
							}}
						>
							<WorkerTokenUIServiceV8
								mode="detailed"
								showRefresh={true}
								showStatusDisplay={true}
								statusSize="large"
								context="mfa"
								environmentId={environmentId}
								onEnvironmentIdUpdate={setEnvironmentId}
							/>

							{/* User Token Status */}
							{userToken && (
								<div
									style={{
										marginTop: '16px',
										padding: '16px',
										background:
											'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))',
										border: '2px solid #10b981',
										borderRadius: '8px',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '8px',
										}}
									>
										<span style={{ fontSize: '20px' }}>👤</span>
										<strong style={{ color: '#047857', fontSize: '16px' }}>
											User Token Active
										</strong>
									</div>
									<div style={{ fontSize: '14px', color: '#059669', lineHeight: '1.5' }}>
										✓ User authentication token available
										<br />✓ Ready for User Flow device registration
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Flow Mode Selection */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '16px',
						}}
					>
						{/* Registration Option */}
						<button
							type="button"
							onClick={() => setFlowMode('registration')}
							style={{
								padding: '20px 16px',
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
									<h2
										style={{
											margin: '0 0 8px 0',
											fontSize: '20px',
											fontWeight: '700',
											color: '#047857',
										}}
									>
										Device Registration
									</h2>
									<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
										Register a new MFA device for a user. Create SMS, Email, TOTP, Mobile Push,
										WhatsApp, or FIDO2 devices.
									</p>
								</div>
							</div>
						</button>

						{/* Authentication Option */}
						<button
							type="button"
							onClick={() => {
								// CRITICAL FIX: Admin flows CAN authenticate devices without user login
								// Worker tokens are for API calls, NOT for authentication
								// Admin flow: Use worker token for API calls, no user auth needed for device authentication
								// User flow: Requires user token for both registration AND authentication

								if (registrationFlowType?.startsWith('admin')) {
									// Admin flow: Can authenticate devices directly with worker token
									setFlowMode('authentication');
									setShowDeviceSelectionModal(true);
									toastV8.info(
										'🔐 Admin Flow: Authenticating device using worker token for API calls.',
										{
											duration: 4000,
										}
									);
									return;
								}

								// User flow: Requires user token for authentication
								if (!userToken) {
									setShowAuthLoginModal(true);
									toastV8.info(
										'🔐 User Flow: Please complete user login before device authentication.',
										{
											duration: 5000,
										}
									);
									return;
								}
								setFlowMode('authentication');
								setShowDeviceSelectionModal(true);
							}}
							style={{
								padding: '20px 16px',
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
									<h2
										style={{
											margin: '0 0 8px 0',
											fontSize: '20px',
											fontWeight: '700',
											color: '#1d4ed8',
										}}
									>
										Device Authentication
									</h2>
									<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
										Authenticate using an existing MFA device. Verify user identity with OTP, push
										notification, or security key.
									</p>
								</div>
							</div>
						</button>
					</div>
				</div>
				{showAuthLoginModal && (
					<UserLoginModalV8
						isOpen={showAuthLoginModal}
						onClose={() => setShowAuthLoginModal(false)}
						onTokenReceived={(token) => {
							// FIXED: Respect registrationFlowType - admin flows should not use user login
							if (registrationFlowType?.startsWith('admin')) {
								toastV8.error('🔐 Admin flow selected. User login not allowed in admin flow.', {
									duration: 5000,
								});
								setShowAuthLoginModal(false);
								return;
							}

							setUserToken(token);
							setShowAuthLoginModal(false);
							setFlowMode('authentication');
							setShowDeviceSelectionModal(true);
						}}
						environmentId={authEnvIdForModal}
					/>
				)}
			</>
		);
	}

	// Authentication flow - dedicated view (device selection + OTP modals only; no registration grid)
	if (flowMode === 'authentication') {
		return (
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
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
						onClick={() => {
							setFlowMode(null);
							setShowDeviceSelectionModal(false);
							setShowOTPModal(false);
							setSelectedAuthDevice(null);
							setOtpCode('');
						}}
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
					<h1
						style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700', color: '#ffffff' }}
					>
						🔓 Device Authentication
					</h1>
					<p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>
						{selectedAuthDevice && !showOTPModal
							? `Authenticating with ${selectedAuthDevice.type} — enter the code when prompted.`
							: `Select an MFA device to authenticate for ${username || 'the user'}`}
					</p>
				</div>
				{!showDeviceSelectionModal && !showOTPModal && (
					<button
						type="button"
						onClick={() => setShowDeviceSelectionModal(true)}
						style={{
							padding: '14px 24px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '15px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Select MFA device
					</button>
				)}
				<UnifiedDeviceSelectionModal
					isOpen={showDeviceSelectionModal}
					onClose={() => {
						setShowDeviceSelectionModal(false);
						// Keep flowMode so user stays in auth flow; only clear if they click Back
					}}
					onDeviceSelect={handleDeviceSelectForAuthentication}
					username={username}
					environmentId={environmentId}
				/>
				{showOTPModal && (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							background: 'rgba(0, 0, 0, 0.6)',
							backdropFilter: 'blur(4px)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 9999,
							animation: 'fadeIn 0.2s ease-out',
						}}
					>
						<style>
							{`
							@keyframes fadeIn {
								from { opacity: 0; }
								to { opacity: 1; }
							}
							@keyframes slideUp {
								from { 
									opacity: 0;
									transform: translateY(20px); 
								}
								to { 
									opacity: 1;
									transform: translateY(0); 
								}
							}
							@keyframes pulse {
								0%, 100% { opacity: 1; }
								50% { opacity: 0.5; }
							}
						`}
						</style>
						<div
							style={{
								background: 'white',
								borderRadius: '24px',
								padding: '48px 40px',
								maxWidth: '480px',
								width: '90%',
								boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
								animation: 'slideUp 0.3s ease-out',
								position: 'relative',
							}}
						>
							{/* Logo Area */}
							<div style={{ textAlign: 'center', marginBottom: '32px' }}>
								{uploadedFileInfo || customLogoUrl ? (
									<div style={{ marginBottom: '20px' }}>
										<img
											src={uploadedFileInfo?.base64Url || customLogoUrl}
											alt="Organization logo"
											style={{
												maxWidth: '120px',
												maxHeight: '80px',
												margin: '0 auto',
												display: 'block',
												borderRadius: '12px',
												objectFit: 'contain',
											}}
											onError={(e) => {
												// Fallback to default icon if image fails to load
												e.currentTarget.style.display = 'none';
												const fallback = document.createElement('div');
												fallback.style.cssText = `
												width: 80px;
												height: 80px;
												margin: 0 auto 20px;
												background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
												borderRadius: 20px;
												display: flex;
												alignItems: center;
												justifyContent: center;
												fontSize: 36px;
												boxShadow: 0 10px 25px rgba(102, 126, 234, 0.3);
											`;
												fallback.textContent = '🔐';
												e.currentTarget.parentElement!.appendChild(fallback);
											}}
										/>
										{uploadedFileInfo && (
											<p
												style={{
													margin: '8px 0 0 0',
													fontSize: '11px',
													color: PING_IDENTITY_COLORS.neutral[500],
													fontWeight: '500',
												}}
											>
												{uploadedFileInfo.name}
											</p>
										)}
									</div>
								) : (
									<div
										style={{
											width: '80px',
											height: '80px',
											margin: '0 auto 20px',
											background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
											borderRadius: '20px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '36px',
											boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
										}}
									>
										🔐
									</div>
								)}
								<h2
									style={{
										margin: '0 0 8px 0',
										fontSize: '24px',
										fontWeight: '700',
										color: '#111827',
									}}
								>
									Verification Code
								</h2>
								<p style={{ margin: 0, fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
									Enter the 6-digit code sent to your <strong>{selectedAuthDevice?.type}</strong>{' '}
									device
								</p>
							</div>

							{/* OTP Input */}
							<div style={{ marginBottom: '24px' }}>
								<input
									type="text"
									value={otpCode}
									onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
									placeholder="• • • • • •"
									maxLength={6}
									style={{
										width: '100%',
										padding: '16px 20px',
										fontSize: '32px',
										fontWeight: '600',
										textAlign: 'center',
										letterSpacing: '12px',
										border: '2px solid #e5e7eb',
										borderRadius: '16px',
										outline: 'none',
										transition: 'all 0.2s ease',
										boxShadow: otpCode.length > 0 ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
									}}
									onFocus={(e) => {
										e.currentTarget.style.borderColor = '#3b82f6';
										e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
									}}
									onBlur={(e) => {
										e.currentTarget.style.borderColor = '#e5e7eb';
										e.currentTarget.style.boxShadow =
											otpCode.length > 0 ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none';
									}}
								/>
								{otpCode.length > 0 && otpCode.length < 6 && (
									<div
										style={{
											marginTop: '12px',
											fontSize: '13px',
											color: '#6b7280',
											textAlign: 'center',
											animation: 'pulse 2s ease-in-out infinite',
										}}
									>
										{6 - otpCode.length} more digit{6 - otpCode.length !== 1 ? 's' : ''} needed
									</div>
								)}
							</div>

							{/* Resend Code Button */}
							<div style={{ textAlign: 'center', marginBottom: '24px' }}>
								<button
									type="button"
									onClick={async () => {
										if (!selectedAuthDevice || !authenticationId) return;
										try {
											toastV8.info('Resending verification code...');
											// Re-initialize authentication to resend code
											const response =
												await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
													environmentId,
													username: username.trim(),
													deviceAuthenticationPolicyId: selectedPolicy?.id || '',
													deviceId: selectedAuthDevice.id,
													region: 'na',
												});
											if (response.status?.toUpperCase() === 'OTP_REQUIRED') {
												toastV8.success('New code sent to your device!');
												setAuthenticationId(response.id);
												setOtpCode('');
											}
										} catch (error) {
											toastV8.error('Failed to resend code');
											console.error('Resend error:', error);
										}
									}}
									style={{
										background: 'transparent',
										border: 'none',
										color: '#3b82f6',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
										padding: '8px 16px',
										borderRadius: '8px',
										transition: 'all 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#eff6ff';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'transparent';
									}}
								>
									↻ Resend Code
								</button>
							</div>

							{/* Action Buttons */}
							<div style={{ display: 'flex', gap: '12px' }}>
								<button
									type="button"
									onClick={() => {
										setShowOTPModal(false);
										setOtpCode('');
									}}
									style={{
										flex: 1,
										padding: '14px 24px',
										border: '2px solid #e5e7eb',
										borderRadius: '12px',
										background: 'white',
										fontSize: '15px',
										fontWeight: '600',
										color: '#6b7280',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = '#d1d5db';
										e.currentTarget.style.background = '#f9fafb';
										e.currentTarget.style.transform = 'translateY(-1px)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor = '#e5e7eb';
										e.currentTarget.style.background = 'white';
										e.currentTarget.style.transform = 'translateY(0)';
									}}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleVerifyOTP}
									disabled={otpCode.length !== 6}
									style={{
										flex: 1,
										padding: '14px 24px',
										border: 'none',
										borderRadius: '12px',
										background:
											otpCode.length === 6
												? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
												: '#d1d5db',
										color: 'white',
										fontSize: '15px',
										fontWeight: '600',
										cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed',
										transition: 'all 0.2s ease',
										boxShadow:
											otpCode.length === 6 ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
									}}
									onMouseEnter={(e) => {
										if (otpCode.length === 6) {
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
										}
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow =
											otpCode.length === 6 ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none';
									}}
								>
									✓ Verify Code
								</button>
							</div>

							{/* Help Text */}
							<div
								style={{
									marginTop: '24px',
									padding: '16px',
									background: '#f9fafb',
									borderRadius: '12px',
									fontSize: '13px',
									color: '#6b7280',
									textAlign: 'center',
									lineHeight: '1.6',
								}}
							>
								<strong style={{ color: '#111827' }}>Didn't receive the code?</strong>
								<br />
								Check your spam folder or click "Resend Code" above
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}

	// Registration flow - show device type selection cards
	return (
		<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
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

			{/* Restart Flow Button - Centered */}
			<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
				<button
					type="button"
					onClick={() => {
						const confirmed = window.confirm(
							'Are you sure you want to restart the flow? All progress will be lost.'
						);
						if (confirmed) {
							// Clear all storage
							sessionStorage.removeItem('mfa-flow-v8');
							sessionStorage.removeItem('mfa_oauth_callback_step');
							sessionStorage.removeItem('mfa_oauth_callback_timestamp');
							sessionStorage.removeItem('mfa_target_step_after_callback');
							localStorage.removeItem('mfa-flow-v8');

							// Reload the page to ensure complete reset
							window.location.reload();
						}
					}}
					style={{
						background: 'rgba(16, 185, 129, 0.1)',
						border: '1px solid #10b981',
						color: '#047857',
						padding: '10px 20px',
						borderRadius: '8px',
						cursor: 'pointer',
						fontSize: '14px',
						fontWeight: '500',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						transition: 'all 0.2s ease',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
						e.currentTarget.style.borderColor = '#047857';
						e.currentTarget.style.transform = 'translateY(-1px)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
						e.currentTarget.style.borderColor = '#10b981';
						e.currentTarget.style.transform = 'translateY(0)';
					}}
					title="Restart the flow from the beginning"
				>
					🔄 Restart Flow
				</button>
			</div>

			{/* Device Type Cards */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
					gap: '16px',
				}}
			>
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
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}
							>
								<span style={{ fontSize: '32px' }}>{device.icon}</span>
								<span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
									{device.name}
								</span>
							</div>
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{device.description}</p>
							{!enabled && (
								<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
									(Not enabled)
								</p>
							)}
						</button>
					);
				})}
			</div>

			{/* Device Selection Modal for Authentication */}
			<UnifiedDeviceSelectionModal
				isOpen={showDeviceSelectionModal}
				onClose={() => {
					setShowDeviceSelectionModal(false);
					setFlowMode(null);
				}}
				onDeviceSelect={handleDeviceSelectForAuthentication}
				username={username}
				environmentId={environmentId}
			/>

			{/* OTP Modal for Authentication */}
			{showOTPModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 9999,
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '12px',
							padding: '32px',
							maxWidth: '400px',
							width: '100%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						}}
					>
						<h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
							Enter Verification Code
						</h2>
						<p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
							Check your {selectedAuthDevice?.type} device for the code
						</p>
						<input
							type="text"
							value={otpCode}
							onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
							placeholder="000000"
							maxLength={6}
							style={{
								width: '100%',
								padding: '12px 16px',
								fontSize: '24px',
								textAlign: 'center',
								letterSpacing: '8px',
								border: '2px solid #e5e7eb',
								borderRadius: '8px',
								marginBottom: '20px',
							}}
						/>
						<div style={{ display: 'flex', gap: '12px' }}>
							<button
								type="button"
								onClick={() => {
									setShowOTPModal(false);
									setOtpCode('');
									setFlowMode(null);
								}}
								style={{
									flex: 1,
									padding: '12px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									background: 'white',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleVerifyOTP}
								disabled={otpCode.length !== 6}
								style={{
									flex: 1,
									padding: '12px',
									border: 'none',
									borderRadius: '8px',
									background: otpCode.length === 6 ? '#3b82f6' : '#9ca3af',
									color: 'white',
									fontSize: '14px',
									fontWeight: '600',
									cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed',
								}}
							>
								Verify
							</button>
						</div>
					</div>
				</div>
			)}
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

	// Get registration flow type from props, location state, or saved preference
	const getInitialRegistrationFlowType = ():
		| 'admin-active'
		| 'admin-activation'
		| 'user'
		| undefined => {
		// Priority 1: Explicit prop
		if (props.registrationFlowType) {
			return props.registrationFlowType;
		}

		// Priority 2: Location state (for navigation)
		const locationState = location.state as {
			registrationFlowType?: 'admin-active' | 'admin-activation' | 'user';
		};
		if (locationState?.registrationFlowType) {
			return locationState.registrationFlowType;
		}

		// Priority 3: Saved preference (for restart/reload)
		try {
			const saved = localStorage.getItem('unified_mfa_registration_flow_type');
			if (saved) {
				const parsed = JSON.parse(saved);
				// Validate that saved value is still valid
				if (['admin-active', 'admin-activation', 'user'].includes(parsed)) {
					return parsed;
				}
			}
		} catch (error) {
			console.warn('[UNIFIED-FLOW] Failed to load saved registration flow type:', error);
		}

		// Priority 4: Default to undefined (will use admin flow by default)
		return undefined;
	};

	// State for selected device type (allows user to select if not provided)
	const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceConfigKey | undefined>(
		initialDeviceType
	);

	// State for registration flow type with persistence
	const [registrationFlowType] = useState<'admin-active' | 'admin-activation' | 'user' | undefined>(
		getInitialRegistrationFlowType()
	);

	// Save registration flow type when it changes
	useEffect(() => {
		if (registrationFlowType) {
			try {
				localStorage.setItem(
					'unified_mfa_registration_flow_type',
					JSON.stringify(registrationFlowType)
				);
				console.log('[UNIFIED-FLOW] Saved registration flow type:', registrationFlowType);
			} catch (error) {
				console.warn('[UNIFIED-FLOW] Failed to save registration flow type:', error);
			}
		}
	}, [registrationFlowType]);

	// User token state for OAuth authentication (User Flow)
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
		return savedCreds?.accessToken || null;
	});

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
					headerColor="pingRed"
				/>
				<GlobalMFAProvider>
					<MFACredentialProvider>
						<DeviceTypeSelectionScreen
							onSelectDeviceType={setSelectedDeviceType}
							userToken={userToken}
							setUserToken={setUserToken}
							registrationFlowType={props.registrationFlowType || 'user'}
						/>
					</MFACredentialProvider>
				</GlobalMFAProvider>
				{/* API display (bottom of page) */}
				<div style={{ marginTop: '24px' }}>
					<SuperSimpleApiDisplayV8 flowFilter="mfa" reserveSpace />
				</div>
			</>
		);
	}

	return (
		<GlobalMFAProvider>
			<MFACredentialProvider>
				<UnifiedMFARegistrationFlowContent
					deviceType={selectedDeviceType}
					userToken={userToken}
					setUserToken={setUserToken}
					onCancel={props.onCancel}
				/>
			</MFACredentialProvider>
		</GlobalMFAProvider>
	);
};

// ============================================================================
// CONTENT COMPONENT (MAIN LOGIC)
// ============================================================================

/**
 * Props for the content component (internal use only)
 */
interface UnifiedMFARegistrationFlowContentProps {
	deviceType: DeviceConfigKey;
	onCancel?: (() => void) | undefined;
	userToken: string | null;
	setUserToken: (token: string | null) => void;
}

/**
 * Unified MFA Registration Flow - Content Component
 *
 * Contains the actual flow logic and integrates with:
 * - MFACredentialContext (global credential state)
 * - useWorkerToken hook (token status and auto-refresh)
 * - deviceFlowConfigs (device-specific configuration)
 * - MFAFlowBaseV8 (5-step framework)
 */
const UnifiedMFARegistrationFlowContent: React.FC<UnifiedMFARegistrationFlowContentProps> = ({
	deviceType,
	onCancel,
	userToken,
	setUserToken,
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
	const [showUserTokenSuccess, setShowUserTokenSuccess] = useState(false);
	const [userTokenForDisplay, setUserTokenForDisplay] = useState<string>('');
	const [usernameFromToken, setUsernameFromToken] = useState<string>('');
	const [showUsernameDropdown, setShowUsernameDropdown] = useState(false);
	const envIdForModal = useMemo(() => globalEnvironmentService.getEnvironmentId() || '', []);

	// Pending registration data while waiting for OAuth (use ref to avoid stale closure)
	const pendingRegistrationRef = useRef<{
		deviceType: DeviceConfigKey;
		fields: Record<string, string>;
		flowType: string;
		props: MFAFlowBaseRenderProps;
	} | null>(null);

	// Worker token state for validation in registration flow
	const _workerToken = useWorkerToken({
		refreshInterval: 5000,
		enableAutoRefresh: true,
	});

	// Detect OAuth callback and re-open modal if needed
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const hasStoredState = sessionStorage.getItem('user_login_state_v8');
		const stepParam = urlParams.get('step');
		const callbackStep = sessionStorage.getItem('mfa_oauth_callback_step');
		const callbackReturn = sessionStorage.getItem('mfa_oauth_callback_return');

		// FOOLPROOF: Handle callback step advancement after OAuth login
		if (callbackReturn === 'true' && (stepParam || callbackStep)) {
			const targetStep = parseInt(stepParam || callbackStep || '0', 10);
			console.log(`[UNIFIED-FLOW] 🔄 OAuth callback detected with step advancement: ${targetStep}`);

			// Clear callback markers
			sessionStorage.removeItem('mfa_oauth_callback_return');
			sessionStorage.removeItem('mfa_oauth_callback_step');
			sessionStorage.removeItem('mfa_oauth_callback_timestamp');

			// Store the target step for the MFAFlowBaseV8 to handle
			sessionStorage.setItem('mfa_target_step_after_callback', targetStep.toString());

			// Force a re-render to trigger step advancement
			window.location.hash = `#step=${targetStep}`;
		}

		// If we have OAuth callback params and stored state, re-open the modal to process callback
		// But only if we don't already have a user token (to prevent reopening after silent auth)
		if (code && hasStoredState && !showUserLoginModal && !userToken) {
			console.log('[UNIFIED-FLOW] OAuth callback detected - re-opening modal to process');
			setShowUserLoginModal(true);
		}
	}, [showUserLoginModal, userToken]);

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
			// Always check for valid worker token (required for MFA device operations)
			if (!token.isValid) {
				navigation.setValidationErrors(['Invalid or expired worker token']);
				return false;
			}

			// Check required configuration
			if (!credentials.environmentId || !credentials.username) {
				navigation.setValidationErrors(['Environment ID and Username are required']);
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
			console.log('[UNIFIED-FLOW] ===== PERFORM REGISTRATION WITH TOKEN =====');
			console.log('[UNIFIED-FLOW] Device:', selectedDeviceType);
			console.log('[UNIFIED-FLOW] Flow type:', flowType);
			console.log('[UNIFIED-FLOW] Token:', token ? `Present (${token.length} chars)` : 'Missing');
			console.log('[UNIFIED-FLOW] Fields:', fields);
			console.log('[UNIFIED-FLOW] Props.setIsLoading available:', typeof props.setIsLoading);
			console.log('[UNIFIED-FLOW] Props.setCredentials available:', typeof props.setCredentials);

			try {
				props.setIsLoading(true);

				// Update credentials with device fields and user token if provided
				props.setCredentials((prev) => ({
					...prev,
					deviceType: selectedDeviceType,
					flowType, // Store flowType so activation step knows if OTP is required
					...fields,
					...(flowType === 'user' && token
						? { userToken: token, tokenType: 'user' }
						: flowType !== 'user'
							? { tokenType: 'worker' }
							: {}),
				}));

				// Register the device using proper API call
				// CRITICAL: Flow-specific device status
				// - Admin flow: ACTIVE (no OTP sent, device ready immediately)
				// - Admin ACTIVATION_REQUIRED: ACTIVATION_REQUIRED (sends OTP for admin to activate)
				// - User flow: ACTIVATION_REQUIRED (sends OTP for user to activate)
				// - FIDO2: ACTIVE (WebAuthn verification happens during registration)
				let deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' | undefined;

				// Determine device status based on flow type (applies to all device types including FIDO2)
				if (flowType === 'admin-active') {
					deviceStatus = 'ACTIVE';
				} else if (flowType === 'admin-activation') {
					deviceStatus = 'ACTIVATION_REQUIRED';
				} else {
					deviceStatus = 'ACTIVATION_REQUIRED'; // user flow
				}

				// Special note for FIDO2: WebAuthn verification proves device works,
				// but we still respect the flow type for status determination
				if (selectedDeviceType === 'FIDO2') {
					console.log(
						'[UNIFIED-FLOW] FIDO2 device - status determined by flow type:',
						deviceStatus
					);
				}

				console.log('[UNIFIED-FLOW] Device status determined:', {
					flowType,
					deviceType: selectedDeviceType,
					deviceStatus,
					otpWillBeSent: deviceStatus === 'ACTIVATION_REQUIRED',
					reason:
						selectedDeviceType === 'FIDO2'
							? 'FIDO2 - ACTIVE after WebAuthn verification'
							: 'User flow - OTP required for activation',
				});

				// Use same parameter construction as working MFA flows
				type RegisterDeviceParamsWithToken = RegisterDeviceParams & {
					tokenType?: 'worker' | 'user';
					userToken?: string | undefined;
				};
				let baseParams: RegisterDeviceParamsWithToken = {
					environmentId: props.credentials.environmentId,
					username: props.credentials.username,
					type: selectedDeviceType,
				};
				// Per rightTOTP.md: Pass token type and user token if available
				if (flowType === 'user' && token) {
					baseParams = {
						...baseParams,
						tokenType: 'user',
						userToken: token,
					};
				} else {
					baseParams = {
						...baseParams,
						tokenType: 'worker',
					};
				}

				// Always include status for all device types
				// FIDO2: Set to ACTIVE since WebAuthn verification proves device works
				// Other devices: Set based on flow type (admin-active = ACTIVE, others = ACTIVATION_REQUIRED)
				if (deviceStatus !== undefined) {
					baseParams.status = deviceStatus;
				}

				console.log('[UNIFIED-FLOW] Registration base params:', {
					environmentId: baseParams.environmentId,
					username: baseParams.username,
					type: baseParams.type,
					tokenType: baseParams.tokenType,
					status: baseParams.status,
					flowType,
				});

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
				const deviceParams: RegisterDeviceParamsWithToken = {
					...baseParams,
					...mappedFields,
					// Include policy for TOTP devices (required for secret and keyUri to be returned)
					// Use props.credentials.deviceAuthenticationPolicyId which is set by the outer component's policy selection
					...(selectedDeviceType === 'TOTP' && props.credentials.deviceAuthenticationPolicyId
						? { policy: props.credentials.deviceAuthenticationPolicyId }
						: {}),
				};

				console.log('[UNIFIED-FLOW] Registering device with params:', deviceParams);

				const result = await MFAServiceV8_Legacy.registerDevice(deviceParams);
				console.log('[UNIFIED-FLOW] Device registered:', result);

				// Update MFA state with device info
				const registrationResult = result as unknown as Record<string, unknown>;

				// ========== DEBUG: TOTP QR CODE DATA ==========
				if (selectedDeviceType === 'TOTP') {
					console.log('🔍 [TOTP DEBUG] Registration result for TOTP:', {
						deviceId: result.deviceId,
						status: result.status,
						qrCode: registrationResult.qrCode,
						qrCodeUrl: registrationResult.qrCodeUrl,
						secret: registrationResult.secret,
						totpSecret: registrationResult.totpSecret,
						fullResult: result,
					});
				}
				// ===============================================

				// Clear stored registration data after successful use
				localStorage.removeItem('mfa_registration_flow_type');
				localStorage.removeItem('mfa_registration_fields');
				localStorage.removeItem('mfa_registration_device_type');

				props.setMfaState((prev) => {
					// TOTP: QR code will be rendered by QRCodeSVG component in UnifiedActivationStep
					// No need to generate QR code data URL here - just pass the keyUri
					const newState: MFAState = {
						...prev,
						deviceId: result.deviceId,
						deviceStatus: result.status,
						...(registrationResult.deviceActivateUri
							? { deviceActivateUri: String(registrationResult.deviceActivateUri) }
							: {}),
						...(selectedDeviceType === 'TOTP'
							? {
									totpSecret: String(registrationResult.secret || ''),
									keyUri: String(registrationResult.keyUri || ''),
									qrCodeUrl: String(registrationResult.keyUri || ''),
									showQr: !!(registrationResult.secret || registrationResult.keyUri),
								}
							: {}),
						...(selectedDeviceType === 'FIDO2' &&
						registrationResult.publicKeyCredentialCreationOptions
							? {
									publicKeyCredentialCreationOptions:
										registrationResult.publicKeyCredentialCreationOptions,
								}
							: {}),
						...(selectedDeviceType === 'MOBILE' && registrationResult.pairingKey
							? { pairingKey: String(registrationResult.pairingKey) }
							: {}),
					};

					// ========== DEBUG: TOTP MFA STATE UPDATE ==========
					if (selectedDeviceType === 'TOTP') {
						console.log('🔍 [TOTP DEBUG] Updated mfaState:', {
							qrCodeUrl: newState.qrCodeUrl,
							totpSecret: newState.totpSecret,
							showQr: newState.showQr,
							deviceStatus: newState.deviceStatus,
							fullState: newState,
						});
					}
					// ================================================

					return newState;
				});

				// FIDO2: Check if we already have credential data (from WebAuthn modal)
				// If credentialId and publicKey are present, registration is complete
				if (selectedDeviceType === 'FIDO2') {
					if (fields.credentialId && fields.publicKey) {
						// WebAuthn already completed via modal - device fully registered

						// Admin Flow: Show QR but skip OTP validation - device ready immediately
						// Admin ACTIVATION_REQUIRED & User Flow: Show QR and require OTP validation
						if (
							flowType === 'admin-active' ||
							flowType === 'admin-activation' ||
							result.status === 'ACTIVE'
						) {
							console.log(
								'[UNIFIED-FLOW] Admin flow or ACTIVE status - proceeding to show QR without OTP requirement'
							);
							toastV8.success(
								`${config.displayName} device registered successfully!${flowType === 'admin-active' || flowType === 'admin-activation' ? ' Device is ready to use.' : ''}`
							);
							// For Admin Flow, go to API docs page instead of OTP page
							// For User Flow, go to User Login step (Step 1)
							if (flowType === 'admin-active' || flowType === 'admin-activation') {
								// Navigate to device-specific API docs page
								const docsPath = `/v8/mfa/register/${config.deviceType}/docs`;
								window.location.href = docsPath;
							} else {
								props.nav.goToNext(); // User Flow - go to User Login
							}
						} else if (result.status === 'ACTIVATION_REQUIRED') {
							// Device requires activation - PingOne automatically sends OTP
							// This applies to both admin_activation_required and user flow
							toastV8.success(
								`${config.displayName} device registered! OTP has been sent automatically.`
							);
							// FOOLPROOF: Auto-advance to Step 4 (OTP Activation) after successful registration
							console.log(
								`${MODULE_TAG} Device requires OTP activation - auto-advancing to Step 4 (OTP Activation)`
							);
							// Add small delay to ensure toast is visible before navigation
							setTimeout(() => {
								props.nav.goToStep(4); // Go directly to OTP Activation step
							}, 1000);
						} else {
							// Unknown status, proceed with flow-specific navigation
							if (flowType === 'admin-active' || flowType === 'admin-activation') {
								// Navigate to device-specific API docs page
								const docsPath = `/v8/mfa/register/${config.deviceType}/docs`;
								window.location.href = docsPath;
							} else {
								props.nav.goToNext(); // User Flow - go to User Login
							}
						}
					}
				} // End of FIDO2 section

				// FOOLPROOF: Auto-advance for all non-FIDO2 devices after successful registration
				if (selectedDeviceType !== 'FIDO2') {
					console.log(
						`${MODULE_TAG} ${selectedDeviceType} device registered successfully - auto-advancing to next step`
					);

					// Determine next step based on device status and type
					if (result.status === 'ACTIVATION_REQUIRED') {
						// Device needs OTP activation - go to Step 4
						setTimeout(() => {
							props.nav.goToStep(4); // OTP Activation step
						}, 1000);
					} else if (selectedDeviceType === 'TOTP') {
						// TOTP shows QR code - go to Step 4 for activation
						setTimeout(() => {
							props.nav.goToStep(4); // OTP Activation step (shows QR code)
						}, 1000);
					} else {
						// Other devices (SMS, Email, etc.) - go to Step 4 for OTP or Step 5 for docs
						setTimeout(() => {
							if (result.status === 'ACTIVE') {
								// Device is already active - go to API docs
								props.nav.goToStep(5); // API Documentation
							} else {
								// Device needs activation - go to OTP step
								props.nav.goToStep(4); // OTP Activation step
							}
						}, 1000);
					}
				}
			} catch (error) {
				console.error('[UNIFIED-FLOW] Registration failed:', error);
				const errorMessage = error instanceof Error ? error.message : 'Device registration failed';

				// Check if error is due to too many devices
				if (errorMessage.includes('Too many devices')) {
					toastV8.error(
						`${errorMessage}\n\nℹ️ You can manage your devices at:\nhttps://localhost:3000/v8/delete-all-devices`,
						{ duration: 8000 }
					);
				} else {
					toastV8.error(errorMessage);
				}
			} finally {
				props.setIsLoading(false);
			}
		},
		[config.displayName, config.deviceType]
	);

	/**
	 * Handle user token received from OAuth flow
	 */
	const handleUserTokenReceived = useCallback(
		(token: string) => {
			console.log('[UNIFIED-FLOW] ===== USER TOKEN RECEIVED =====');
			console.log('[UNIFIED-FLOW] Token length:', token.length);
			console.log('[UNIFIED-FLOW] Current pending registration:', pendingRegistrationRef.current);

			setUserToken(token);
			setUserTokenForDisplay(token);

			// Decode JWT to extract username
			try {
				const base64Url = token.split('.')[1];
				const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
				const jsonPayload = decodeURIComponent(
					atob(base64)
						.split('')
						.map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
						.join('')
				);
				const payload = JSON.parse(jsonPayload);
				const username =
					payload.username || payload.preferred_username || payload.sub || 'Unknown User';
				setUsernameFromToken(username);
				console.log('[UNIFIED-FLOW] Extracted username:', username);
			} catch (error) {
				console.error('[UNIFIED-FLOW] Failed to decode JWT:', error);
				setUsernameFromToken('Unknown User');
			}

			// If we have pending registration, show success page first
			const pending = pendingRegistrationRef.current;
			if (pending) {
				console.log('[UNIFIED-FLOW] Found pending registration, showing success page first...');
				console.log('[UNIFIED-FLOW] Pending data:', {
					deviceType: pending.deviceType,
					flowType: pending.flowType,
					hasProps: !!pending.props,
					hasFields: !!pending.fields,
				});

				toastV8.success('✅ Authentication successful! Your user token is ready.', {
					duration: 4000,
				});

				// Close login modal and show success page
				setShowUserLoginModal(false);
				setShowUserTokenSuccess(true);
			} else {
				console.log('[UNIFIED-FLOW] WARNING: No pending registration found after OAuth!');
			}
		},
		[setUserToken]
	);

	/**
	 * Handle continue from user token success page
	 */
	const handleContinueAfterUserLogin = useCallback(() => {
		console.log(
			'[UNIFIED-FLOW] User clicked continue after login, proceeding with registration...'
		);

		const pending = pendingRegistrationRef.current;
		if (pending && userToken) {
			const { deviceType: pendingDeviceType, fields, flowType, props } = pending;
			pendingRegistrationRef.current = null;

			// Hide success page
			setShowUserTokenSuccess(false);

			// Continue with registration
			setTimeout(() => {
				console.log('[UNIFIED-FLOW] Now executing performRegistrationWithToken...');
				performRegistrationWithToken(props, pendingDeviceType, fields, flowType, userToken);
			}, 100);
		}
	}, [userToken, performRegistrationWithToken]);

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
			console.log('[UNIFIED-FLOW] ===== DEVICE REGISTRATION SUBMITTED =====');
			console.log('[UNIFIED-FLOW] Device:', selectedDeviceType);
			console.log('[UNIFIED-FLOW] Flow type:', flowType);
			console.log('[UNIFIED-FLOW] Current userToken:', userToken ? 'Present' : 'Missing');
			console.log('[UNIFIED-FLOW] Fields:', fields);

			// CRITICAL: Validate worker token before allowing any registration
			// FIXED: Do a FRESH check - React state (workerToken.tokenStatus) can be stale
			const freshTokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			if (!freshTokenStatus.isValid) {
				console.error('[UNIFIED-FLOW] Cannot proceed - no valid worker token (fresh check)');
				toastV8.error(
					'Worker token required for device registration. Please configure worker token credentials first.',
					{
						duration: 5000,
					}
				);
				return;
			}

			// For User Flow, always check PingOne authentication and redirect if needed
			if (flowType === 'user') {
				// Check current PingOne authentication status
				const authResult = checkPingOneAuthentication();
				console.log('[UNIFIED-FLOW] PingOne authentication result:', authResult);

				// Check if we should redirect to PingOne
				if (shouldRedirectToPingOne()) {
					console.log('[UNIFIED-FLOW] User flow requires PingOne authentication - redirecting...');
					console.log('[UNIFIED-FLOW] Storing pending registration...');

					// Store pending registration data
					pendingRegistrationRef.current = {
						deviceType: selectedDeviceType,
						fields,
						flowType,
						props,
					};

					console.log(
						'[UNIFIED-FLOW] Pending registration stored:',
						pendingRegistrationRef.current
					);

					// Store flow context for callback handler (Unified OAuth pattern)
					const flowContext = {
						returnPath: '/v8/unified-mfa',
						returnStep: 2, // Step 2: Device Selection
						flowType: 'registration' as const,
						timestamp: Date.now(),
					};
					sessionStorage.setItem('mfa_flow_callback_context', JSON.stringify(flowContext));
					console.log(`${MODULE_TAG} 🎯 Stored flow context for registration:`, {
						path: '/v8/unified-mfa',
						step: 2,
					});

					// Show the user login modal
					setShowUserLoginModal(true);
					toastV8.info(
						'🔐 User Flow requires PingOne authentication. Please complete the login to continue with device registration.',
						{ duration: 6000 }
					);
					return;
				} else {
					// User is already authenticated, show success message and proceed
					console.log(
						'[UNIFIED-FLOW] User already authenticated with PingOne, proceeding with registration'
					);
					toastV8.success(
						'✅ PingOne authentication detected! Proceeding with device registration.',
						{ duration: 4000 }
					);
				}
			}

			console.log(
				'[UNIFIED-FLOW] Proceeding directly with registration (token exists or admin flow)'
			);
			// Proceed with registration (using existing token for user flow)
			await performRegistrationWithToken(
				props,
				selectedDeviceType,
				fields,
				flowType,
				userToken || undefined
			);
		},
		[userToken, performRegistrationWithToken]
	);

	/**
	 * Render Step 0: Configuration (environment, user, policy)
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
						if (onCancel) onCancel();
					}}
					tokenStatus={props.tokenStatus}
					username={props.credentials.username}
				/>
			);
		},
		[deviceType, onCancel, performRegistration]
	);

	/**
	 * Render Step 1: User Login using Authorization Code Flow with PKCE
	 */
	const renderStep1 = useCallback((props: MFAFlowBaseRenderProps) => {
		return <UserLoginStepV8 renderProps={props} />;
	}, []);

	/**
	 * Render Step 2: Device Selection (option to call registration if want new device, or have no devices)
	 */
	const renderStep2 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return <UnifiedActivationStep {...props} config={config} />;
		},
		[config]
	);

	/**
	 * Render Step 3: Device-Specific Actions (OTP/QR Generation, FIDO, Mobile Push)
	 */
	const renderStep3 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			// This will be device-specific based on the device type
			// For now, return the activation step which handles device-specific logic
			return <UnifiedActivationStep {...props} config={config} />;
		},
		[config]
	);

	/**
	 * Render Step 4: OTP Validation / Confirmation
	 */
	const renderStep4 = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			// This will be device-specific validation
			return <UnifiedActivationStep {...props} config={config} />;
		},
		[config]
	);

	/**
	 * Render Step 5: Success screen with all user data and other valuable options
	 */
	const renderStep5 = useCallback((props: MFAFlowBaseRenderProps) => {
		return <SuccessStepV8 renderProps={props} />;
	}, []);

	/**
	 * Render Step 6: API Documentation
	 */
	const renderStep6 = useCallback((props: MFAFlowBaseRenderProps) => {
		return <APIDocsStepV8 renderProps={props} />;
	}, []);

	// Step labels for device authentication flow
	const stepLabels = useMemo(() => {
		if (deviceType === 'FIDO2') {
			return [
				'Configure',
				'User Login',
				'Device Selection',
				'Start FIDO in Browser',
				'Passkey confirmation',
				'Success',
				'API Docs',
			];
		} else if (deviceType === 'MOBILE') {
			return [
				'Configure',
				'User Login',
				'Device Selection',
				'Push to Mobile App',
				'User Confirms on Mobile',
				'Success',
				'API Docs',
			];
		} else {
			// SMS, Email, TOTP, WhatsApp
			return [
				'Configure',
				'User Login',
				'Device Selection',
				'Generate OTP/QR',
				'Validate OTP',
				'Success',
				'API Docs',
			];
		}
	}, [deviceType]);

	const shouldHideNextButton = useCallback((props: MFAFlowBaseRenderProps) => {
		if (props.nav.currentStep === 0) {
			return true; // Hide Next button on configuration step, use form submit
		}
		if (props.nav.currentStep === 1) {
			return true; // Hide Next button on user login step, use authentication button
		}
		if (props.nav.currentStep === 2) {
			// FIXED: Prevent advancement to step 3 without valid worker token
			const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			const tokenType = props.credentials.tokenType || 'worker';

			// For worker token flows: require valid token
			// For user token flows: require valid user token
			if (tokenType === 'worker' && !tokenStatus.isValid) {
				return true; // Hide Next button - worker token invalid
			}
			if (tokenType === 'user' && !props.credentials.userToken?.trim()) {
				return true; // Hide Next button - user token missing
			}
		}
		return false;
	}, []);

	return (
		<>
			<MFAFlowBaseV8
				deviceType={deviceType}
				renderStep0={renderStep0}
				renderStep1={renderStep1}
				renderStep2={renderStep2}
				renderStep3={renderStep3}
				renderStep4={renderStep4}
				renderStep5={renderStep5}
				renderStep6={renderStep6}
				validateStep0={validateStep0}
				stepLabels={stepLabels}
				shouldHideNextButton={shouldHideNextButton}
				flowType="registration"
			/>
			<div style={{ height: '300px' }} />
			<SuperSimpleApiDisplayV8 flowFilter="mfa" reserveSpace />

			{/* User Login Modal for User Flow OAuth */}
			<UserLoginModalV8
				isOpen={showUserLoginModal}
				onClose={() => {
					setShowUserLoginModal(false);
					pendingRegistrationRef.current = null;
				}}
				onTokenReceived={handleUserTokenReceived}
				environmentId={envIdForModal}
			/>

			{/* User Token Success Page - Show token after OAuth login */}
			{showUserTokenSuccess && userTokenForDisplay && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10000,
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '12px',
							padding: '32px',
							maxWidth: '600px',
							width: '90%',
							maxHeight: '80vh',
							overflow: 'auto',
							boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
						}}
					>
						{/* Success Header */}
						<div style={{ textAlign: 'center', marginBottom: '24px' }}>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: '64px',
									height: '64px',
									borderRadius: '50%',
									background: '#d1fae5',
									marginBottom: '16px',
								}}
							>
								<span style={{ fontSize: '32px' }}>✅</span>
							</div>
							<h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1f2937' }}>
								Authentication Successful!
							</h2>
							<p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
								Your user token has been obtained and is ready to use.
							</p>
						</div>

						{/* Username Dropdown */}
						{usernameFromToken && (
							<div
								style={{
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									padding: '16px',
									marginBottom: '16px',
								}}
							>
								<button
									type="button"
									onClick={() => setShowUsernameDropdown(!showUsernameDropdown)}
									style={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										background: 'transparent',
										border: 'none',
										padding: 0,
										cursor: 'pointer',
										marginBottom: showUsernameDropdown ? '12px' : 0,
									}}
								>
									<h3 style={{ margin: 0, fontSize: '16px', color: '#374151' }}>Username</h3>
									{showUsernameDropdown ? (
										<FiChevronUp size={20} color="#6b7280" />
									) : (
										<FiChevronDown size={20} color="#6b7280" />
									)}
								</button>
								{showUsernameDropdown && (
									<>
										<div
											style={{
												background: '#1f2937',
												color: '#f3f4f6',
												padding: '12px',
												borderRadius: '6px',
												fontFamily: 'monospace',
												fontSize: '14px',
												wordBreak: 'break-all',
												marginBottom: '12px',
											}}
										>
											{usernameFromToken}
										</div>
										<button
											type="button"
											onClick={() => {
												navigator.clipboard.writeText(usernameFromToken);
												toastV8.success('Username copied to clipboard!');
											}}
											style={{
												padding: '8px 16px',
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '14px',
												cursor: 'pointer',
												width: '100%',
											}}
										>
											📋 Copy Username
										</button>
									</>
								)}
							</div>
						)}

						{/* Token Display */}
						<div
							style={{
								background: '#f9fafb',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '16px',
								marginBottom: '24px',
							}}
						>
							<h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>
								User Access Token
							</h3>
							<div
								style={{
									background: '#1f2937',
									color: '#f3f4f6',
									padding: '12px',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontSize: '13px',
									wordBreak: 'break-all',
									marginBottom: '12px',
								}}
							>
								{userTokenForDisplay}
							</div>
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(userTokenForDisplay);
									toastV8.success('Token copied to clipboard!');
								}}
								style={{
									padding: '8px 16px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									cursor: 'pointer',
									width: '100%',
								}}
							>
								📋 Copy Token
							</button>
						</div>

						{/* Next Steps Info */}
						<div
							style={{
								background: '#eff6ff',
								border: '1px solid #bfdbfe',
								borderRadius: '8px',
								padding: '16px',
								marginBottom: '24px',
							}}
						>
							<p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
								<strong>Next:</strong> Click "Continue with Registration" to proceed with your{' '}
								{config.displayName} device registration using this user token.
							</p>
						</div>

						{/* Continue Button */}
						<button
							type="button"
							onClick={handleContinueAfterUserLogin}
							style={{
								width: '100%',
								padding: '14px 24px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '16px',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
							}}
						>
							Continue with Registration →
						</button>
					</div>
				</div>
			)}
		</>
	);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedMFARegistrationFlowV8;
