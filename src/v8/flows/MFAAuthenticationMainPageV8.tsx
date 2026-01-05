/**
 * @file MFAAuthenticationMainPageV8.tsx
 * @module v8/flows
 * @description Unified MFA Authentication Main Page
 * @version 8.3.0
 * @since 2025-01-XX
 *
 * This is the single unified MFA Authentication page that merges:
 * - Main MFA Page functionality
 * - MFA Dashboard features
 * - Authentication flow management
 *
 * Features:
 * - Environment + Worker Token + MFA Policy control panel
 * - Username-based authentication
 * - Username-less FIDO2 authentication
 * - Device selection and challenge handling
 * - Dashboard features (device list, policy summary)
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiInfo,
	FiKey,
	FiLoader,
	FiMail,
	FiPhone,
	FiPlus,
	FiShield,
	FiTrash2,
	FiX,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { usePageScroll } from '@/hooks/usePageScroll';
import { pingOneLogoutService } from '@/services/pingOneLogoutService';
import { oauthStorage } from '@/utils/storage';
import { ConfirmModalV8 } from '@/v8/components/ConfirmModalV8';
import { DeviceFailureModalV8, UnavailableDevice } from '@/v8/components/DeviceFailureModalV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { UserSearchDropdownV8 } from '@/v8/components/UserSearchDropdownV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import type { DeviceAuthenticationPolicy, DeviceType } from '@/v8/flows/shared/MFATypes';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MfaAuthenticationServiceV8 } from '@/v8/services/mfaAuthenticationServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { WebAuthnAuthenticationServiceV8 } from '@/v8/services/webAuthnAuthenticationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { type Device, MFADeviceSelector } from './components/MFADeviceSelector';
import { MFAOTPInput } from './components/MFAOTPInput';

const MODULE_TAG = '[🔐 MFA-AUTHN-MAIN-V8]';
const FLOW_KEY = 'mfa-flow-v8';

// Ping Identity Logo Component
const PingIdentityLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: '20px',
		}}
	>
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: size,
				height: size,
				borderRadius: '8px',
				background: '#E31837',
				boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
				marginRight: '12px',
			}}
		>
			<svg
				width={Math.round(size * 0.75)}
				height={Math.round(size * 0.75)}
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path d="M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z" fill="#ffffff" />
				<path d="M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z" fill="#E31837" />
			</svg>
		</div>
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
			<span style={{ fontSize: '20px', fontWeight: '700', color: '#E31837', lineHeight: '1.2' }}>
				Ping
			</span>
			<span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', lineHeight: '1.2' }}>
				Identity.
			</span>
		</div>
	</div>
);

interface AuthenticationState {
	isLoading: boolean;
	authenticationId: string | null;
	status: string | null;
	nextStep: string | null;
	devices: Device[];
	showDeviceSelection: boolean;
	selectedDeviceId: string;
	userId: string | null;
	challengeId: string | null;
	publicKeyCredentialRequestOptions?: unknown; // For FIDO2 ASSERTION_REQUIRED, PingOne may provide this instead of challengeId
	_links: Record<string, { href: string }> | null;
	completionResult: {
		accessToken?: string;
		tokenType?: string;
		expiresIn?: number;
	} | null;
}

/**
 * Unified MFA Authentication Main Page
 * Single page that handles all MFA authentication flows
 */
export const MFAAuthenticationMainPageV8: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const authContext = useAuth();
	const [isClearingTokens, setIsClearingTokens] = useState(false);
	const [showClearTokensModal, setShowClearTokensModal] = useState(false);
	usePageScroll({ pageName: 'MFA Authentication', force: true });

	// Check for OAuth callback code and redirect to the correct flow page
	useEffect(() => {
		const code = searchParams.get('code');
		const hasUserLoginState = sessionStorage.getItem('user_login_state_v8');

		// If we have a code and user login state, this is a callback from user login
		if (code && hasUserLoginState) {
			// Check if CallbackHandlerV8U attempted to redirect but failed
			const redirectIntent = sessionStorage.getItem('mfa_redirect_intent');
			if (redirectIntent) {
				sessionStorage.removeItem('mfa_redirect_intent');
				// Attempt the redirect that CallbackHandlerV8U tried to do
				window.location.replace(redirectIntent);
				return;
			}

			// Check if we have a stored return path
			const returnToMfaFlow = sessionStorage.getItem('user_login_return_to_mfa');

			if (returnToMfaFlow) {
				try {
					// Path is stored as a plain string (no JSON parsing needed)
					const mfaPath = returnToMfaFlow.trim();

					// Validate that the path looks correct
					if (!mfaPath.startsWith('/v8/mfa')) {
						console.error(
							`${MODULE_TAG} ❌ Invalid return path (doesn't start with /v8/mfa): ${mfaPath}`
						);
						throw new Error(`Invalid return path: ${mfaPath}`);
					}

					// Preserve callback parameters in the URL when redirecting
					const callbackParams = new URLSearchParams(window.location.search);
					const redirectUrl = callbackParams.toString()
						? `${mfaPath}?${callbackParams.toString()}`
						: mfaPath;

					// Redirect to the flow page with callback params
					// Clean up the return path marker AFTER setting up redirect
					// This ensures the path is available even if there's a race condition
					sessionStorage.removeItem('user_login_return_to_mfa');

					window.location.replace(redirectUrl);
					return;
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to parse return path:`, error);
				}
			}

			// If no return path, stay on the MFA hub page
			// Don't redirect based on stored.deviceType as it might be from a different flow
			console.warn(
				`${MODULE_TAG} OAuth callback detected but no return path found. Staying on MFA hub page.`
			);
		}
	}, [searchParams]);

	// Control Panel State
	const [credentials, setCredentials] = useState(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		return {
			environmentId: stored.environmentId || '',
			username: stored.username || '',
			deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
		};
	});

	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// MFA Policy State
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);

	// Authentication State
	const [authState, setAuthState] = useState<AuthenticationState>({
		isLoading: false,
		authenticationId: null,
		status: null,
		nextStep: null,
		devices: [],
		showDeviceSelection: false,
		selectedDeviceId: '',
		userId: null,
		challengeId: null,
		_links: null,
		completionResult: null,
	});

	// Username input state
	const [usernameInput, setUsernameInput] = useState(credentials.username || '');
	const [showUsernameDecisionModal, setShowUsernameDecisionModal] = useState(false);
	const [isPasskeyRegistrationMode, setIsPasskeyRegistrationMode] = useState(false);

	// Modals
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
	const [showOTPModal, setShowOTPModal] = useState(false);
	const [showFIDO2Modal, setShowFIDO2Modal] = useState(false);
	const [showPushModal, setShowPushModal] = useState(false);
	const [showRegistrationModal, setShowRegistrationModal] = useState(false);
	const [showPolicyInfoModal, setShowPolicyInfoModal] = useState(false);
	const [showDeviceSelectionInfoModal, setShowDeviceSelectionInfoModal] = useState(false);
	const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

	// Device failure modal state
	const [showDeviceFailureModal, setShowDeviceFailureModal] = useState(false);
	const [deviceFailureError, setDeviceFailureError] = useState<string>('');
	const [unavailableDevices, setUnavailableDevices] = useState<UnavailableDevice[]>([]);

	// OTP state
	const [otpCode, setOtpCode] = useState('');
	const [isValidatingOTP, setIsValidatingOTP] = useState(false);
	const [otpError, setOtpError] = useState<string | null>(null);

	// API Display visibility state (for padding adjustment)
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(apiDisplayServiceV8.isVisible());

	// FIDO2 state
	const [isAuthenticatingFIDO2, setIsAuthenticatingFIDO2] = useState(false);
	const [fido2Error, setFido2Error] = useState<string | null>(null);

	// Device list state (for dashboard)
	const [userDevices, setUserDevices] = useState<Array<Record<string, unknown>>>([]);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);
	const [devicesError, setDevicesError] = useState<string | null>(null);

	// Generate IDs
	const policySelectId = useId();
	const usernameInputId = useId();

	// Ensure modal is closed on mount - only show when explicitly triggered by button
	useEffect(() => {
		setShowUsernameDecisionModal(false);
	}, []);

	// Helper function to handle NO_USABLE_DEVICES errors
	const handleDeviceFailureError = useCallback((error: unknown) => {
		// Check if error has NO_USABLE_DEVICES error code
		if (
			error instanceof Error &&
			(error as Error & { errorCode?: string }).errorCode === 'NO_USABLE_DEVICES'
		) {
			const errorWithDevices = error as Error & {
				errorCode?: string;
				unavailableDevices?: Array<{ id: string }>;
			};
			const unavailableDevices: UnavailableDevice[] = (
				errorWithDevices.unavailableDevices || []
			).map((d) => ({
				id: d.id,
				// Additional device info could be fetched here if needed
			}));

			setDeviceFailureError(error.message || 'No usable devices found for authentication');
			setUnavailableDevices(unavailableDevices);
			setShowDeviceFailureModal(true);
			return true; // Indicates error was handled
		}

		// Check if error response contains NO_USABLE_DEVICES
		if (
			error &&
			typeof error === 'object' &&
			'errorCode' in error &&
			error.errorCode === 'NO_USABLE_DEVICES'
		) {
			const errorObj = error as {
				errorCode: string;
				message?: string;
				unavailableDevices?: Array<{ id: string }>;
			};
			const unavailableDevices: UnavailableDevice[] = (errorObj.unavailableDevices || []).map(
				(d) => ({
					id: d.id,
				})
			);

			setDeviceFailureError(errorObj.message || 'No usable devices found for authentication');
			setUnavailableDevices(unavailableDevices);
			setShowDeviceFailureModal(true);
			return true;
		}

		return false; // Error was not handled
	}, []);

	// Clear auth state when username changes to prevent showing wrong user's data
	useEffect(() => {
		// Reset auth state when username changes to ensure we're working with the correct user
		setAuthState({
			isLoading: false,
			authenticationId: null,
			status: '',
			nextStep: '',
			devices: [],
			showDeviceSelection: false,
			selectedDeviceId: '',
			userId: '',
			challengeId: null,
			_links: {},
			completionResult: null,
		});
		setUserDevices([]);
	}, [usernameInput]);

	// Update token status
	useEffect(() => {
		const handleTokenUpdate = () => {
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('storage', handleTokenUpdate);
		const interval = setInterval(handleTokenUpdate, 5000);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('storage', handleTokenUpdate);
			clearInterval(interval);
		};
	}, []);

	// Subscribe to API display visibility changes
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	// Poll Push authentication status
	useEffect(() => {
		if (!showPushModal || !authState._links?.['challenge.poll']?.href) {
			return;
		}

		const pollInterval = setInterval(async () => {
			try {
				const result = await MfaAuthenticationServiceV8.pollAuthenticationStatus(
					authState._links!['challenge.poll']!.href
				);

				if (result.status === 'COMPLETED') {
					clearInterval(pollInterval);

					// Complete authentication to get access token if complete link is available
					let completionResult = null;
					const updatedLinks = (result._links as Record<string, { href: string }>) || {};
					if (updatedLinks['complete']?.href || authState._links?.['complete']?.href) {
						try {
							completionResult = await MfaAuthenticationServiceV8.completeAuthentication(
								updatedLinks['complete']?.href || authState._links!['complete']!.href
							);
						} catch (completeError) {
							console.warn(`${MODULE_TAG} Failed to complete push authentication:`, completeError);
							// Continue even if completion fails - authentication was successful
						}
					}

					setShowPushModal(false);

					// Get selected device details
					const selectedDevice = authState.devices.find((d) => d.id === authState.selectedDeviceId);
					const selectedPolicy = deviceAuthPolicies.find(
						(p) => p.id === credentials.deviceAuthenticationPolicyId
					);
					const policyName = selectedPolicy?.name;
					const deviceSelectionBehavior = selectedPolicy?.authentication?.deviceSelection as
						| string
						| undefined;

					// Navigate to success page with completion result
					navigate('/v8/mfa/authentication/success', {
						state: {
							completionResult: completionResult
								? {
										...completionResult, // Include all fields from completion result
									}
								: null,
							username: usernameInput.trim(),
							userId: authState.userId,
							environmentId: credentials.environmentId,
							deviceType: selectedDevice?.type || 'PUSH',
							deviceId: authState.selectedDeviceId,
							deviceDetails: selectedDevice
								? {
										id: selectedDevice.id,
										type: selectedDevice.type,
										nickname: selectedDevice.nickname,
										name: selectedDevice.name,
										phone: selectedDevice.phone,
										email: selectedDevice.email,
										status: selectedDevice.status,
									}
								: null,
							policyId: credentials.deviceAuthenticationPolicyId,
							policyName: policyName,
							authenticationId: authState.authenticationId,
							challengeId: authState.challengeId,
							timestamp: new Date().toISOString(),
							deviceSelectionBehavior: deviceSelectionBehavior,
						},
					});
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Push polling error:`, error);
				// Continue polling on error
			}
		}, 2000); // Poll every 2 seconds

		return () => clearInterval(pollInterval);
	}, [showPushModal, authState._links]);

	// Track last loaded username/environment to prevent unnecessary reloads
	const lastLoadedDevicesRef = useRef<{ username: string; environmentId: string } | null>(null);

	// Load user devices for dashboard - debounced to prevent blinking while typing
	useEffect(() => {
		const loadUserDevices = async () => {
			if (!credentials.environmentId || !usernameInput.trim() || !tokenStatus.isValid) {
				setUserDevices([]);
				lastLoadedDevicesRef.current = null;
				return;
			}

			const currentUsername = usernameInput.trim();
			const currentEnvId = credentials.environmentId;

			// Skip if we already loaded devices for this exact username/environment combination
			const lastLoaded = lastLoadedDevicesRef.current;
			if (
				lastLoaded &&
				lastLoaded.username === currentUsername &&
				lastLoaded.environmentId === currentEnvId
			) {
				// Already loaded for this user/environment, skip to prevent repeated user lookups
				return;
			}

			setIsLoadingDevices(true);
			setDevicesError(null);

			try {
				const devices = await MFAServiceV8.getAllDevices({
					environmentId: currentEnvId,
					username: currentUsername,
				});
				// Only set devices if username hasn't changed (prevent race condition)
				if (usernameInput.trim() === currentUsername) {
					setUserDevices(devices);
					// Mark as loaded for this username/environment
					lastLoadedDevicesRef.current = {
						username: currentUsername,
						environmentId: currentEnvId,
					};
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';

				// Check if this is a server connection error
				const isServerError =
					errorMessage.toLowerCase().includes('failed to connect') ||
					errorMessage.toLowerCase().includes('server is running') ||
					errorMessage.toLowerCase().includes('network error') ||
					errorMessage.toLowerCase().includes('connection refused') ||
					errorMessage.toLowerCase().includes('econnrefused');

				if (isServerError) {
					setDevicesError(
						'⚠️ Backend server is not running or unreachable. Please ensure the server is running on port 3001 and try again.'
					);
				} else {
					setDevicesError(errorMessage);
				}

				console.error(`${MODULE_TAG} Failed to load user devices:`, error);
			} finally {
				setIsLoadingDevices(false);
			}
		};

		// Debounce device loading to prevent blinking while typing
		const timeoutId = setTimeout(() => {
			void loadUserDevices();
		}, 500); // Wait 500ms after user stops typing

		return () => clearTimeout(timeoutId);
	}, [credentials.environmentId, usernameInput, tokenStatus.isValid]);

	// Also load devices when device selection modal opens
	useEffect(() => {
		if (
			showDeviceSelectionModal &&
			credentials.environmentId &&
			usernameInput.trim() &&
			tokenStatus.isValid
		) {
			const loadUserDevices = async () => {
				const currentUsername = usernameInput.trim();
				try {
					// Clear devices first to ensure we're loading for the correct user
					setUserDevices([]);
					const devices = await MFAServiceV8.getAllDevices({
						environmentId: credentials.environmentId,
						username: currentUsername,
					});
					// Only set devices if username hasn't changed (prevent race condition)
					if (usernameInput.trim() === currentUsername) {
						setUserDevices(devices);
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';

					// Check if this is a server connection error
					const isServerError =
						errorMessage.toLowerCase().includes('failed to connect') ||
						errorMessage.toLowerCase().includes('server is running') ||
						errorMessage.toLowerCase().includes('network error') ||
						errorMessage.toLowerCase().includes('connection refused') ||
						errorMessage.toLowerCase().includes('econnrefused');

					if (isServerError) {
						console.error(`${MODULE_TAG} Backend server is not running or unreachable`);
						// Could show a toast here if needed
					} else {
						console.error(`${MODULE_TAG} Failed to load user devices for modal:`, error);
					}
				}
			};
			void loadUserDevices();
		}
	}, [showDeviceSelectionModal, credentials.environmentId, usernameInput, tokenStatus.isValid]);

	// Track last fetched environment to prevent duplicate calls
	const lastFetchedPolicyEnvIdRef = useRef<string | null>(null);
	const isFetchingPoliciesRef = useRef(false);

	// Load MFA Policies
	const loadPolicies = useCallback(async (): Promise<DeviceAuthenticationPolicy[]> => {
		const envId = credentials.environmentId?.trim();

		if (!envId || !tokenStatus.isValid) {
			return [];
		}

		// Prevent duplicate calls - if we're already fetching or already fetched for this env, skip
		if (isFetchingPoliciesRef.current || lastFetchedPolicyEnvIdRef.current === envId) {
			return deviceAuthPolicies;
		}

		isFetchingPoliciesRef.current = true;
		setIsLoadingPolicies(true);
		setPoliciesError(null);

		try {
			const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(envId);
			lastFetchedPolicyEnvIdRef.current = envId;
			setDeviceAuthPolicies(policies);

			// Auto-select if only one policy
			if (!credentials.deviceAuthenticationPolicyId && policies.length === 1) {
				const updatedCredentials = {
					...credentials,
					deviceAuthenticationPolicyId: policies[0].id,
				};
				setCredentials(updatedCredentials);
				const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
					flowKey: FLOW_KEY,
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				CredentialsServiceV8.saveCredentials(FLOW_KEY, {
					...stored,
					deviceAuthenticationPolicyId: policies[0].id,
				});
			}

			return policies;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load policies';

			// Check if this is a server connection error
			const isServerError =
				errorMessage.toLowerCase().includes('failed to connect') ||
				errorMessage.toLowerCase().includes('server is running') ||
				errorMessage.toLowerCase().includes('network error') ||
				errorMessage.toLowerCase().includes('connection refused') ||
				errorMessage.toLowerCase().includes('econnrefused');

			if (isServerError) {
				setPoliciesError(
					'⚠️ Backend server is not running or unreachable. Please ensure the server is running on port 3001 and try again.'
				);
			} else {
				setPoliciesError(errorMessage);
			}

			console.error(`${MODULE_TAG} Failed to load policies:`, error);
			return [];
		} finally {
			isFetchingPoliciesRef.current = false;
			setIsLoadingPolicies(false);
		}
	}, [
		credentials.environmentId,
		credentials.deviceAuthenticationPolicyId,
		tokenStatus.isValid,
		deviceAuthPolicies,
	]);

	// Load policies when environment or token changes (but not when callback changes)
	useEffect(() => {
		const envId = credentials.environmentId?.trim();

		// Only fetch if environment changed or we haven't fetched yet
		if (envId && tokenStatus.isValid && lastFetchedPolicyEnvIdRef.current !== envId) {
			void loadPolicies();
		}
	}, [credentials.environmentId, tokenStatus.isValid, loadPolicies]);

	// Extract allowed device types from policy (shared function)
	const extractAllowedDeviceTypes = useCallback(
		(policy: DeviceAuthenticationPolicy): DeviceType[] => {
			const allowed: DeviceType[] = [];

			// Check for allowedDeviceTypes in deviceSelection
			if (policy.authentication?.deviceSelection) {
				const deviceSelection = policy.authentication.deviceSelection;
				if (typeof deviceSelection === 'object' && deviceSelection !== null) {
					const allowedTypes = (deviceSelection as { allowedDeviceTypes?: string[] })
						.allowedDeviceTypes;
					if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
						allowed.push(...(allowedTypes as DeviceType[]));
					}
				}
			}

			// Check for deviceAuthentication.required
			if (policy.authentication?.deviceAuthentication) {
				const deviceAuth = policy.authentication.deviceAuthentication;
				if (typeof deviceAuth === 'object' && deviceAuth !== null) {
					const required = (deviceAuth as { required?: string[] }).required;
					if (Array.isArray(required) && required.length > 0) {
						allowed.push(...(required as DeviceType[]));
					}
					// Also check optional device types
					const optional = (deviceAuth as { optional?: string[] }).optional;
					if (Array.isArray(optional) && optional.length > 0) {
						allowed.push(...(optional as DeviceType[]));
					}
				}
			}

			// Remove duplicates
			const uniqueAllowed = [...new Set(allowed)];

			// If no explicit restrictions found, default to all common device types
			// This means the policy allows all devices (no restrictions)
			if (uniqueAllowed.length === 0) {
				return ['FIDO2', 'TOTP', 'SMS', 'EMAIL', 'VOICE', 'MOBILE', 'WHATSAPP'] as DeviceType[];
			}

			return uniqueAllowed;
		},
		[]
	);

	// Handle MFA Policy Selection
	const handlePolicySelect = useCallback(
		async (policyId: string) => {
			// Update credentials first
			const updatedCredentials = {
				...credentials,
				deviceAuthenticationPolicyId: policyId,
			};
			setCredentials(updatedCredentials);
			const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
				flowKey: FLOW_KEY,
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			CredentialsServiceV8.saveCredentials(FLOW_KEY, {
				...stored,
				deviceAuthenticationPolicyId: policyId,
			});

			// Reload policies to get the latest data (including updated default flags)
			const reloadedPolicies = await loadPolicies();

			// Get the updated policy from the reloaded list
			const updatedPolicy = reloadedPolicies.find((p) => p.id === policyId);
			if (updatedPolicy) {
				// Extract and log allowed device types for both authentication and registration
				const allowedTypes = extractAllowedDeviceTypes(updatedPolicy);

				toastV8.success(
					`Selected policy: ${updatedPolicy.name} (${allowedTypes.length} device type${allowedTypes.length !== 1 ? 's' : ''} allowed)`
				);
			}
		},
		[credentials, extractAllowedDeviceTypes, loadPolicies]
	);

	// Handle Username-less FIDO2 Authentication
	const handleUsernamelessFIDO2 = useCallback(async () => {
		if (!tokenStatus.isValid) {
			toastV8.error('Please configure worker token first');
			return;
		}

		if (!credentials.environmentId) {
			toastV8.error('Please configure environment ID first');
			return;
		}

		if (!credentials.deviceAuthenticationPolicyId) {
			toastV8.error('Please select an MFA Policy first');
			return;
		}

		setAuthState((prev) => ({ ...prev, isLoading: true }));

		try {
			// Import passkey service
			const { PasskeyServiceV8 } = await import('@/v8/services/passkeyServiceV8');

			// Step 1: Try authentication first (discoverable credentials)
			const authResult = await PasskeyServiceV8.authenticateUsernameless({
				environmentId: credentials.environmentId,
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
			});

			if (authResult.success) {
				// Authentication successful!
				toastV8.success(
					`Authenticated successfully as ${authResult.username || authResult.userId}`
				);

				// Update auth state with successful authentication
				setAuthState((prev) => ({
					...prev,
					isLoading: false,
					status: 'COMPLETED',
					nextStep: 'AUTHENTICATION_COMPLETE',
				}));

				// Optionally navigate to success page or update UI
				// For now, we'll just show success message
				return;
			}

			// Step 2: Check for NO_USABLE_DEVICES error
			if (authResult.errorCode === 'NO_USABLE_DEVICES') {
				setDeviceFailureError(authResult.error || 'No usable devices found for authentication');
				setUnavailableDevices((authResult.unavailableDevices || []).map((d) => ({ id: d.id })));
				setShowDeviceFailureModal(true);
				return;
			}

			// Step 3: If authentication failed and requires registration, show registration modal
			if (authResult.requiresRegistration) {
				// Show username input modal for registration
				// Registration requires username because PingOne needs to identify/create the user
				setIsPasskeyRegistrationMode(true);
				setShowUsernameDecisionModal(true);
				toastV8.info('No passkey found. Please enter your username to register a new passkey.');
				return;
			}

			// Other error - show error message
			toastV8.error(authResult.error || 'Authentication failed');
		} catch (error) {
			console.error(`${MODULE_TAG} Usernameless FIDO2 failed:`, error);

			// Check for NO_USABLE_DEVICES error
			if (handleDeviceFailureError(error)) {
				// Error was handled by modal, just update loading state
				setAuthState((prev) => ({ ...prev, isLoading: false }));
				return;
			}

			toastV8.error(error instanceof Error ? error.message : 'Usernameless authentication failed');
		} finally {
			setAuthState((prev) => ({ ...prev, isLoading: false }));
		}
	}, [
		tokenStatus.isValid,
		credentials.environmentId,
		credentials.deviceAuthenticationPolicyId,
		handleDeviceFailureError,
	]);

	// Handle Start MFA (Username-based)
	const handleStartMFA = useCallback(async () => {
		if (!tokenStatus.isValid) {
			toastV8.error('Please configure worker token first');
			return;
		}

		if (!credentials.environmentId) {
			toastV8.error('Please configure environment ID first');
			return;
		}

		if (!credentials.deviceAuthenticationPolicyId) {
			toastV8.error('Please select an MFA Policy first');
			return;
		}

		// If username is empty, show decision modal
		if (!usernameInput.trim()) {
			setShowUsernameDecisionModal(true);
			return;
		}

		// Reset auth state to clear any previous authentication session
		// This ensures we start fresh when restarting the flow
		setAuthState({
			isLoading: true,
			authenticationId: null,
			status: null,
			nextStep: null,
			devices: [],
			showDeviceSelection: false,
			selectedDeviceId: '',
			userId: null,
			challengeId: null,
			publicKeyCredentialRequestOptions: undefined,
			_links: null,
			completionResult: null,
		});

		try {
			// 1. Lookup user
			const user = await MFAServiceV8.lookupUserByUsername(
				credentials.environmentId,
				usernameInput.trim()
			);

			// 2. Initialize MFA Authentication (this returns the devices available for this auth session)
			const response = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
				environmentId: credentials.environmentId,
				username: usernameInput.trim(),
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
				region: credentials.region,
				customDomain: credentials.customDomain,
			});

			// Extract _links for flow coordination
			const links = (response._links as Record<string, { href: string }>) || {};

			// Parse response
			const status = response.status || '';
			const nextStep = response.nextStep || '';

			// Use devices from authentication response - these are the devices available for this session
			// Fallback to empty array if no devices in response
			const rawDevices = response.devices || [];

			// Filter devices to ensure they belong to the correct user
			// PingOne should already filter by user, but we'll double-check
			const userDevices = rawDevices.filter((d: Record<string, unknown>) => {
				const deviceUserId = d.user?.id || d.userId;
				const matches = !deviceUserId || deviceUserId === user.id;
				if (!matches) {
					console.warn(`${MODULE_TAG} ⚠️ Device belongs to different user, filtering out:`, {
						deviceId: d.id,
						deviceType: d.type,
						deviceUserId,
						expectedUserId: user.id,
						expectedUsername: usernameInput.trim(),
					});
				}
				return matches;
			});

			let authDevices: Device[] = userDevices.map((d: Record<string, unknown>) => {
				const device: Device = {
					id: (d.id as string) || '',
					type: (d.type as string) || '',
					nickname: (d.nickname as string) || (d.name as string) || (d.type as string),
				};
				if (d.phone) device.phone = d.phone as string;
				if (d.email) device.email = d.email as string;
				if (d.status) device.status = d.status as string;
				return device;
			});

			// Check for session cookies - if present, prefer FIDO2 platform devices even if not default
			// Per PingOne MFA API: "If the user is paired with a FIDO2 platform device and a session
			// token cookie exists on the browser, the FIDO2 platform device is used for authentication
			// even if it is not the default device."
			const { shouldPreferFIDO2PlatformDevice } = await import(
				'@/v8/services/fido2SessionCookieServiceV8'
			);
			const platformPreference = shouldPreferFIDO2PlatformDevice();

			if (platformPreference.prefer && authDevices.length > 0) {
				// Reorder devices to prioritize FIDO2 devices when session cookie exists
				const fido2Devices = authDevices.filter((d) => d.type === 'FIDO2');
				const otherDevices = authDevices.filter((d) => d.type !== 'FIDO2');

				if (fido2Devices.length > 0) {
					authDevices = [...fido2Devices, ...otherDevices];
				}
			}

			// Get the selected policy to check device selection behavior
			const selectedPolicy = deviceAuthPolicies.find(
				(p) => p.id === credentials.deviceAuthenticationPolicyId
			);
			const deviceSelectionBehavior = selectedPolicy?.authentication?.deviceSelection as
				| string
				| undefined;

			// Determine next action based on status/nextStep
			const needsDeviceSelection =
				status === 'DEVICE_SELECTION_REQUIRED' ||
				nextStep === 'DEVICE_SELECTION_REQUIRED' ||
				nextStep === 'SELECTION_REQUIRED' ||
				// For ALWAYS_DISPLAY_DEVICES policy, always show device selection if devices are available
				(authDevices.length > 0 && deviceSelectionBehavior === 'ALWAYS_DISPLAY_DEVICES');

			const needsOTP = status === 'OTP_REQUIRED' || nextStep === 'OTP_REQUIRED';
			const needsAssertion = status === 'ASSERTION_REQUIRED' || nextStep === 'ASSERTION_REQUIRED';
			const needsPush =
				status === 'PUSH_CONFIRMATION_REQUIRED' || nextStep === 'PUSH_CONFIRMATION_REQUIRED';

			// Validate that we got an authenticationId from the response
			if (!response.id) {
				console.error(`${MODULE_TAG} Authentication initialized but no ID in response:`, response);
				toastV8.error(
					'Failed to initialize authentication: No authentication ID received from PingOne'
				);
				setAuthState((prev) => ({ ...prev, isLoading: false }));
				return;
			}

			setAuthState({
				isLoading: false,
				authenticationId: response.id,
				status,
				nextStep,
				devices: authDevices,
				showDeviceSelection: needsDeviceSelection,
				selectedDeviceId: '',
				userId: String(user.id || ''),
				challengeId: (response.challengeId as string) || null,
				publicKeyCredentialRequestOptions: (
					response as { publicKeyCredentialRequestOptions?: unknown }
				).publicKeyCredentialRequestOptions,
				_links: links,
				completionResult: null,
			});

			// Show appropriate modal
			if (needsDeviceSelection) {
				setShowDeviceSelectionModal(true);
				toastV8.success('Please select a device to continue');
			} else if (needsOTP) {
				setShowOTPModal(true);
				toastV8.success('OTP has been sent. Please check your device.');
			} else if (needsAssertion) {
				setShowFIDO2Modal(true);
				toastV8.success('Please complete WebAuthn authentication.');
			} else if (needsPush) {
				setShowPushModal(true);
				toastV8.success('Please approve the sign-in on your phone.');
			} else if (status === 'COMPLETED') {
				toastV8.success('Authentication completed successfully!');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to start authentication:`, error);

			// Check for NO_USABLE_DEVICES error
			if (handleDeviceFailureError(error)) {
				// Error was handled by modal, just update loading state
				setAuthState((prev) => ({ ...prev, isLoading: false }));
				return;
			}

			toastV8.error(error instanceof Error ? error.message : 'Failed to start authentication');
			setAuthState((prev) => ({ ...prev, isLoading: false }));
		}
	}, [
		tokenStatus.isValid,
		credentials.environmentId,
		credentials.deviceAuthenticationPolicyId,
		usernameInput,
		handleDeviceFailureError,
	]);

	// Clear all tokens (worker and user tokens) and end PingOne session
	const handleClearTokens = useCallback(async () => {
		setShowClearTokensModal(false);
		setIsClearingTokens(true);
		try {
			// End PingOne session first (if we have an ID token)
			const tokens = oauthStorage.getTokens();
			const idToken = tokens?.id_token || authContext.tokens?.id_token;

			// Try to get environment ID from various sources
			let environmentId: string | undefined;
			if (authContext.config?.pingone?.environmentId) {
				environmentId = authContext.config.pingone.environmentId;
			} else if (credentials.environmentId) {
				environmentId = credentials.environmentId;
			}

			if (idToken && environmentId) {
				try {
					const logoutResult = await pingOneLogoutService.logout({
						idToken,
						environmentId,
						autoOpen: true,
						openIn: 'new-tab',
						clearClientStorage: false, // We'll clear storage ourselves below
					});

					if (logoutResult.success) {
						toastV8.info('PingOne session logout initiated in a new tab');
					} else {
						console.warn('[MFA-AUTHN-MAIN-V8] PingOne logout failed:', logoutResult.error);
					}
				} catch (error) {
					console.warn('[MFA-AUTHN-MAIN-V8] Could not end PingOne session:', error);
				}
			}

			// Call auth context logout to clear local session state
			try {
				authContext.logout();
			} catch (error) {
				console.warn('[MFA-AUTHN-MAIN-V8] Could not call auth context logout:', error);
			}

			// Clear worker token
			await workerTokenServiceV8.clearCredentials();

			// Clear OAuth tokens from auth context
			try {
				oauthStorage.clearTokens();
				oauthStorage.clearUserInfo();
			} catch (error) {
				console.warn('[MFA-AUTHN-MAIN-V8] Could not clear OAuth tokens:', error);
			}

			// Clear user tokens from MFA flow credentials
			try {
				if (credentials.userToken) {
					setCredentials((prev) => ({
						...prev,
						userToken: undefined,
						tokenType: undefined,
					}));
				}
			} catch (error) {
				console.warn('[MFA-AUTHN-MAIN-V8] Could not clear user token from credentials:', error);
			}

			toastV8.success('All tokens cleared successfully!');
		} catch (error) {
			console.error('[MFA-AUTHN-MAIN-V8] Failed to clear tokens:', error);
			toastV8.error('Failed to clear tokens. Please try again.');
		} finally {
			setIsClearingTokens(false);
		}
	}, [authContext, credentials.environmentId, credentials.userToken, setCredentials]);

	return (
		<div
			style={{
				padding: '32px 20px',
				paddingBottom: isApiDisplayVisible ? '450px' : '32px', // Add extra padding when API display is visible
				maxWidth: '1400px',
				margin: '0 auto',
				minHeight: '100vh',
				transition: 'padding-bottom 0.3s ease',
			}}
		>
			{/* Navigation Bar */}
			<MFANavigationV8 currentPage="hub" showBackToMain={true} />

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			{/* Page Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
					borderRadius: '12px',
					padding: '32px',
					marginBottom: '32px',
					color: 'white',
					boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
				}}
			>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: 'white' }}>
					🔐 MFA Authentication
				</h1>
				<p style={{ margin: 0, fontSize: '16px', color: 'white', opacity: 0.9 }}>
					Unified authentication flow for all MFA device types
				</p>
			</div>

			{/* 1. Authentication & Registration */}
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '32px',
					marginBottom: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					border: '1px solid #e5e7eb',
				}}
			>
				<h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
					Authentication & Registration
				</h2>

				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
					{/* Primary Button: Start MFA */}
					<button
						type="button"
						onClick={handleStartMFA}
						disabled={
							authState.isLoading ||
							!tokenStatus.isValid ||
							!credentials.environmentId ||
							!credentials.deviceAuthenticationPolicyId
						}
						style={{
							padding: '10px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								tokenStatus.isValid &&
								credentials.environmentId &&
								credentials.deviceAuthenticationPolicyId
									? '#3b82f6'
									: '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								tokenStatus.isValid &&
								credentials.environmentId &&
								credentials.deviceAuthenticationPolicyId
									? 'pointer'
									: 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						{authState.isLoading ? (
							<>
								<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
								Starting...
							</>
						) : (
							<>
								<FiShield />
								Start Authentication
							</>
						)}
					</button>

					{/* Registration Button */}
					<button
						type="button"
						onClick={() => setShowRegistrationModal(true)}
						disabled={
							!tokenStatus.isValid ||
							!credentials.environmentId ||
							!credentials.deviceAuthenticationPolicyId
						}
						style={{
							padding: '10px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								tokenStatus.isValid &&
								credentials.environmentId &&
								credentials.deviceAuthenticationPolicyId
									? '#10b981'
									: '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								tokenStatus.isValid &&
								credentials.environmentId &&
								credentials.deviceAuthenticationPolicyId
									? 'pointer'
									: 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiPlus />
						Register Device
					</button>

					{/* Secondary Button: Username-less FIDO2 */}
					<button
						type="button"
						onClick={handleUsernamelessFIDO2}
						disabled={authState.isLoading || !tokenStatus.isValid || !credentials.environmentId}
						style={{
							padding: '10px 24px',
							border: '2px solid #3b82f6',
							borderRadius: '6px',
							background: 'white',
							color: '#3b82f6',
							fontSize: '16px',
							fontWeight: '600',
							cursor: tokenStatus.isValid && credentials.environmentId ? 'pointer' : 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiKey />
						Use Passkey / FaceID (username-less)
					</button>

					{/* Clear Tokens & Session Button */}
					<button
						type="button"
						onClick={() => setShowClearTokensModal(true)}
						disabled={isClearingTokens}
						style={{
							padding: '10px 24px',
							border: 'none',
							borderRadius: '6px',
							background: isClearingTokens ? '#9ca3af' : '#ef4444',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor: isClearingTokens ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							opacity: isClearingTokens ? 0.6 : 1,
							transition: 'all 0.2s ease',
						}}
					>
						{isClearingTokens ? (
							<>
								<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
								Clearing...
							</>
						) : (
							<>
								<FiTrash2 />
								Clear Tokens & Session
							</>
						)}
					</button>
				</div>
			</div>

			{/* Clear Tokens Confirmation Modal */}
			<ConfirmModalV8
				isOpen={showClearTokensModal}
				title="Clear Tokens & End PingOne Session"
				message="Are you sure you want to clear all tokens and end your PingOne session?\n\nThis will:\n• Clear worker tokens\n• Clear user tokens (OAuth access tokens)\n• End your PingOne session (logout)\n• Clear all stored authentication data\n\nYou will need to log in again to continue."
				confirmText="Clear & Logout"
				cancelText="Cancel"
				variant="danger"
				onConfirm={handleClearTokens}
				onCancel={() => setShowClearTokensModal(false)}
			/>

			{/* 2. Control Panel: Environment + Worker Token + MFA Policy */}
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					border: '1px solid #e5e7eb',
				}}
			>
				<h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
					Control Panel
				</h2>

				{/* Worker Token - First Row (Top Priority) */}
				<div style={{ marginBottom: '20px' }}>
					<label
						style={{
							display: 'block',
							marginBottom: '8px',
							fontSize: '14px',
							fontWeight: '500',
							color: '#374151',
						}}
					>
						Worker Token
					</label>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<button
							type="button"
							onClick={() => setShowWorkerTokenModal(true)}
							style={{
								padding: '8px 16px',
								border: 'none',
								borderRadius: '6px',
								background:
									tokenStatus.status === 'expiring-soon'
										? '#f59e0b'
										: tokenStatus.isValid
											? '#10b981'
											: '#dc2626',
								color: 'white',
								fontSize: '14px',
								fontWeight: '500',
								cursor: 'pointer',
								whiteSpace: 'nowrap',
							}}
						>
							Get Worker Token
						</button>
						<div
							style={{
								flex: 1,
								padding: '8px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								background: tokenStatus.isValid ? '#f0fdf4' : '#fef2f2',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontSize: '14px',
							}}
						>
							{tokenStatus.isValid ? (
								<>
									{tokenStatus.status === 'expiring-soon' ? (
										<FiAlertCircle color="#f59e0b" />
									) : (
										<FiCheck color="#10b981" />
									)}
									<span
										style={{
											color: tokenStatus.status === 'expiring-soon' ? '#f59e0b' : '#059669',
										}}
									>
										{tokenStatus.message || 'Worker token configured'}
									</span>
								</>
							) : (
								<>
									<FiAlertCircle color="#dc2626" />
									<span style={{ color: '#dc2626' }}>
										{tokenStatus.message || 'Worker token missing'}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
					{/* Environment ID */}
					<div>
						<label
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '500',
								color: '#374151',
							}}
						>
							Environment ID
						</label>
						<input
							type="text"
							value={credentials.environmentId}
							onChange={(e) => {
								const updated = { ...credentials, environmentId: e.target.value };
								setCredentials(updated);
								const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
									flowKey: FLOW_KEY,
									flowType: 'oidc',
									includeClientSecret: false,
									includeRedirectUri: false,
									includeLogoutUri: false,
									includeScopes: false,
								});
								CredentialsServiceV8.saveCredentials(FLOW_KEY, {
									...stored,
									environmentId: e.target.value,
								});
							}}
							placeholder="Enter environment ID"
							style={{
								width: '100%',
								padding: '8px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
					</div>

					{/* Username */}
					<div>
						<label
							htmlFor={usernameInputId}
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '500',
								color: '#374151',
							}}
						>
							Username
						</label>
						<input
							id={usernameInputId}
							type="text"
							value={usernameInput}
							onChange={(e) => {
								const newUsername = e.target.value;
								setUsernameInput(newUsername);
								setCredentials((prev) => ({ ...prev, username: newUsername }));
								const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
									flowKey: FLOW_KEY,
									flowType: 'oidc',
									includeClientSecret: false,
									includeRedirectUri: false,
									includeLogoutUri: false,
									includeScopes: false,
								});
								CredentialsServiceV8.saveCredentials(FLOW_KEY, {
									...stored,
									username: newUsername,
								});
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleStartMFA();
								}
							}}
							placeholder="Enter username (e.g., user@example.com)"
							style={{
								width: '100%',
								padding: '8px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
					</div>
				</div>

				{/* MFA Policy Selection - Second Row */}
				<div style={{ marginTop: '20px' }}>
					<label
						htmlFor={policySelectId}
						style={{
							display: 'block',
							marginBottom: '8px',
							fontSize: '14px',
							fontWeight: '500',
							color: '#374151',
						}}
					>
						Device Authentication Policy
					</label>
					{isLoadingPolicies ? (
						<div style={{ padding: '8px 12px', color: '#6b7280', fontSize: '14px' }}>
							<FiLoader style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />{' '}
							Loading policies...
						</div>
					) : policiesError ? (
						<div style={{ padding: '8px 12px', color: '#dc2626', fontSize: '14px' }}>
							<FiAlertCircle /> {policiesError}
						</div>
					) : (
						<select
							id={policySelectId}
							value={credentials.deviceAuthenticationPolicyId}
							onChange={(e) => handlePolicySelect(e.target.value)}
							disabled={!tokenStatus.isValid || deviceAuthPolicies.length === 0}
							style={{
								width: '100%',
								padding: '8px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
								cursor:
									tokenStatus.isValid && deviceAuthPolicies.length > 0 ? 'pointer' : 'not-allowed',
								opacity: !tokenStatus.isValid || deviceAuthPolicies.length === 0 ? 0.6 : 1,
							}}
						>
							<option value="">
								{!tokenStatus.isValid
									? 'Get Worker Token first to load policies'
									: deviceAuthPolicies.length === 0
										? 'No policies available'
										: 'Choose a policy...'}
							</option>
							{deviceAuthPolicies.map((policy) => (
								<option key={policy.id} value={policy.id}>
									{policy.name} {policy.default ? '(DEFAULT)' : ''}
								</option>
							))}
						</select>
					)}
				</div>
			</div>

			{/* 3. Dashboard Features (Merged) */}
			{/* Policy Summary */}
			{credentials.deviceAuthenticationPolicyId && deviceAuthPolicies.length > 0 && (
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						border: '1px solid #e5e7eb',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
						<h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
							Active Device Authentication Policy
						</h2>
						<button
							type="button"
							onClick={() => setShowPolicyInfoModal(true)}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '4px',
								padding: '4px 8px',
								borderRadius: '4px',
								background: '#eff6ff',
								color: '#1e40af',
								fontSize: '12px',
								fontWeight: '500',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								verticalAlign: 'middle',
								marginLeft: '6px',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#dbeafe';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#eff6ff';
							}}
						>
							<FiInfo size={14} />
							<span>What is this?</span>
						</button>
					</div>
					{(() => {
						const selectedPolicy = deviceAuthPolicies.find(
							(p) => p.id === credentials.deviceAuthenticationPolicyId
						);
						if (!selectedPolicy) return null;

						const deviceSelection = selectedPolicy.authentication?.deviceSelection as
							| string
							| undefined;
						const status = selectedPolicy.status as string | undefined;

						return (
							<div>
								{/* Policy Name and Status */}
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										marginBottom: '16px',
										flexWrap: 'wrap',
									}}
								>
									<FiShield style={{ color: '#3b82f6', fontSize: '20px' }} />
									<span
										style={{
											background: '#dcfce7',
											color: '#166534',
											padding: '4px 12px',
											borderRadius: '20px',
											fontSize: '14px',
											fontWeight: '600',
										}}
									>
										{selectedPolicy.name}
									</span>
									{status && (
										<span
											style={{
												background: status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
												color: status === 'ACTIVE' ? '#166534' : '#92400e',
												padding: '4px 12px',
												borderRadius: '20px',
												fontSize: '12px',
												fontWeight: '500',
											}}
										>
											{status}
										</span>
									)}
								</div>

								{/* Policy Description */}
								{selectedPolicy.description && (
									<p
										style={{
											margin: '0 0 20px 0',
											fontSize: '14px',
											color: '#6b7280',
											lineHeight: '1.6',
										}}
									>
										{selectedPolicy.description}
									</p>
								)}

								{/* Policy Details Grid */}
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
										gap: '16px',
										marginTop: '20px',
										padding: '16px',
										background: '#f9fafb',
										borderRadius: '8px',
										border: '1px solid #e5e7eb',
									}}
								>
									{/* Policy ID */}
									<div>
										<div
											style={{
												fontSize: '12px',
												color: '#6b7280',
												marginBottom: '4px',
												fontWeight: '500',
											}}
										>
											Policy ID
										</div>
										<div
											style={{
												fontSize: '13px',
												color: '#1f2937',
												fontFamily: 'monospace',
												wordBreak: 'break-all',
											}}
										>
											{selectedPolicy.id}
										</div>
									</div>

									{/* Device Selection Behavior */}
									{deviceSelection && (
										<div>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													marginBottom: '4px',
												}}
											>
												<div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
													Device Selection
												</div>
												<button
													type="button"
													onClick={() => setShowDeviceSelectionInfoModal(true)}
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														gap: '4px',
														padding: '4px 8px',
														borderRadius: '4px',
														background: '#eff6ff',
														color: '#1e40af',
														fontSize: '12px',
														fontWeight: '500',
														cursor: 'pointer',
														transition: 'all 0.2s ease',
														verticalAlign: 'middle',
														marginLeft: '6px',
													}}
													onMouseEnter={(e) => {
														e.currentTarget.style.background = '#dbeafe';
													}}
													onMouseLeave={(e) => {
														e.currentTarget.style.background = '#eff6ff';
													}}
												>
													<FiInfo size={14} />
													<span>What is this?</span>
												</button>
											</div>
											<div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
												{deviceSelection.replace(/_/g, ' ')}
											</div>
										</div>
									)}

									{/* Status */}
									{status && (
										<div>
											<div
												style={{
													fontSize: '12px',
													color: '#6b7280',
													marginBottom: '4px',
													fontWeight: '500',
												}}
											>
												Status
											</div>
											<div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
												{status}
											</div>
										</div>
									)}

									{/* Important Policy Settings - Highlighted */}
									{(selectedPolicy.skipUserLockVerification !== undefined ||
										selectedPolicy.pairingDisabled !== undefined ||
										selectedPolicy.promptForNicknameOnPairing !== undefined) && (
										<div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
											<div
												style={{
													fontSize: '13px',
													color: '#1f2937',
													marginBottom: '12px',
													fontWeight: '600',
												}}
											>
												Important Policy Settings
											</div>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
												{/* Skip User Lock Verification */}
												{selectedPolicy.skipUserLockVerification !== undefined && (
													<div
														style={{
															background: selectedPolicy.skipUserLockVerification
																? '#fef3c7'
																: '#dcfce7',
															border: `2px solid ${selectedPolicy.skipUserLockVerification ? '#f59e0b' : '#10b981'}`,
															borderRadius: '8px',
															padding: '16px',
														}}
													>
														<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
															<div style={{ flex: 1 }}>
																<div
																	style={{
																		display: 'flex',
																		alignItems: 'center',
																		gap: '8px',
																		marginBottom: '8px',
																	}}
																>
																	<span
																		style={{
																			fontSize: '14px',
																			fontWeight: '600',
																			color: '#1f2937',
																		}}
																	>
																		{selectedPolicy.skipUserLockVerification
																			? '⚠️ Skip User Lock Verification'
																			: '✓ User Lock Verification Enabled'}
																	</span>
																	<MFAInfoButtonV8
																		contentKey="policy.skipUserLockVerification"
																		displayMode="tooltip"
																	/>
																</div>
																<div
																	style={{
																		fontSize: '13px',
																		color: '#374151',
																		lineHeight: '1.5',
																		marginBottom: '8px',
																	}}
																>
																	{selectedPolicy.skipUserLockVerification ? (
																		<>
																			<strong style={{ color: '#92400e' }}>Action:</strong> We will{' '}
																			<strong>skip</strong> checking if the user account is locked
																			before authentication. Locked accounts may be able to
																			authenticate.
																		</>
																	) : (
																		<>
																			<strong style={{ color: '#166534' }}>Action:</strong> We will{' '}
																			<strong>check</strong> the user's lock status before
																			authentication. If the account is locked, authentication will
																			be blocked.
																		</>
																	)}
																</div>
																<div
																	style={{
																		fontSize: '12px',
																		color: '#6b7280',
																		fontStyle: 'italic',
																	}}
																>
																	Value:{' '}
																	{selectedPolicy.skipUserLockVerification
																		? 'true (enabled)'
																		: 'false (disabled)'}
																</div>
															</div>
														</div>
													</div>
												)}

												{/* Pairing Disabled */}
												{selectedPolicy.pairingDisabled !== undefined && (
													<div
														style={{
															background: selectedPolicy.pairingDisabled ? '#fee2e2' : '#dcfce7',
															border: `2px solid ${selectedPolicy.pairingDisabled ? '#ef4444' : '#10b981'}`,
															borderRadius: '8px',
															padding: '16px',
														}}
													>
														<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
															<div style={{ flex: 1 }}>
																<div
																	style={{
																		display: 'flex',
																		alignItems: 'center',
																		gap: '8px',
																		marginBottom: '8px',
																	}}
																>
																	<span
																		style={{
																			fontSize: '14px',
																			fontWeight: '600',
																			color: '#1f2937',
																		}}
																	>
																		{selectedPolicy.pairingDisabled
																			? '🚫 Device Pairing Disabled'
																			: '✓ Device Pairing Enabled'}
																	</span>
																	<MFAInfoButtonV8
																		contentKey="policy.pairingDisabled"
																		displayMode="tooltip"
																	/>
																</div>
																<div
																	style={{
																		fontSize: '13px',
																		color: '#374151',
																		lineHeight: '1.5',
																		marginBottom: '8px',
																	}}
																>
																	{selectedPolicy.pairingDisabled ? (
																		<>
																			<strong style={{ color: '#991b1b' }}>Action:</strong> Device
																			pairing/registration is <strong>disabled</strong>. Users
																			cannot register new MFA devices with this policy.
																		</>
																	) : (
																		<>
																			<strong style={{ color: '#166534' }}>Action:</strong> Device
																			pairing/registration is <strong>enabled</strong>. Users can
																			register new MFA devices.
																		</>
																	)}
																</div>
																<div
																	style={{
																		fontSize: '12px',
																		color: '#6b7280',
																		fontStyle: 'italic',
																	}}
																>
																	Value:{' '}
																	{selectedPolicy.pairingDisabled
																		? 'true (disabled)'
																		: 'false (enabled)'}
																</div>
															</div>
														</div>
													</div>
												)}

												{/* Prompt for Nickname on Pairing */}
												{selectedPolicy.promptForNicknameOnPairing !== undefined && (
													<div
														style={{
															background: selectedPolicy.promptForNicknameOnPairing
																? '#eff6ff'
																: '#f3f4f6',
															border: `2px solid ${selectedPolicy.promptForNicknameOnPairing ? '#3b82f6' : '#9ca3af'}`,
															borderRadius: '8px',
															padding: '16px',
														}}
													>
														<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
															<div style={{ flex: 1 }}>
																<div
																	style={{
																		display: 'flex',
																		alignItems: 'center',
																		gap: '8px',
																		marginBottom: '8px',
																	}}
																>
																	<span
																		style={{
																			fontSize: '14px',
																			fontWeight: '600',
																			color: '#1f2937',
																		}}
																	>
																		{selectedPolicy.promptForNicknameOnPairing
																			? '✏️ Prompt for Nickname'
																			: '✓ Auto Nickname'}
																	</span>
																	<MFAInfoButtonV8
																		contentKey="policy.promptForNicknameOnPairing"
																		displayMode="tooltip"
																	/>
																</div>
																<div
																	style={{
																		fontSize: '13px',
																		color: '#374151',
																		lineHeight: '1.5',
																		marginBottom: '8px',
																	}}
																>
																	{selectedPolicy.promptForNicknameOnPairing ? (
																		<>
																			<strong style={{ color: '#1e40af' }}>Action:</strong> After
																			successful device pairing, we will{' '}
																			<strong>prompt the user</strong> to enter a custom nickname
																			for their device.
																		</>
																	) : (
																		<>
																			<strong style={{ color: '#4b5563' }}>Action:</strong> Device
																			nickname will be set <strong>automatically</strong> without
																			prompting the user.
																		</>
																	)}
																</div>
																<div
																	style={{
																		fontSize: '12px',
																		color: '#6b7280',
																		fontStyle: 'italic',
																	}}
																>
																	Value:{' '}
																	{selectedPolicy.promptForNicknameOnPairing
																		? 'true (prompt enabled)'
																		: 'false (auto nickname)'}
																</div>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Additional Policy Properties */}
									{selectedPolicy.authentication &&
										Object.keys(selectedPolicy.authentication).length > 0 && (
											<div style={{ gridColumn: '1 / -1' }}>
												<div
													style={{
														fontSize: '12px',
														color: '#6b7280',
														marginBottom: '8px',
														fontWeight: '500',
													}}
												>
													Authentication Settings
												</div>
												<div
													style={{
														background: 'white',
														padding: '12px',
														borderRadius: '6px',
														border: '1px solid #e5e7eb',
													}}
												>
													<pre
														style={{
															margin: 0,
															fontSize: '12px',
															color: '#1f2937',
															fontFamily: 'monospace',
															whiteSpace: 'pre-wrap',
															wordBreak: 'break-word',
														}}
													>
														{JSON.stringify(selectedPolicy.authentication, null, 2)}
													</pre>
												</div>
											</div>
										)}
								</div>
							</div>
						);
					})()}
				</div>
			)}

			{/* Authentication Session Details */}
			{(authState.authenticationId || authState.userId || authState.selectedDeviceId) && (
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						border: '1px solid #e5e7eb',
					}}
				>
					<h2
						style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}
					>
						Authentication Session Details
					</h2>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							gap: '20px',
						}}
					>
						{/* User ID */}
						{authState.userId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									User ID
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{authState.userId}
								</div>
							</div>
						)}

						{/* Username */}
						{usernameInput.trim() && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Username
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{usernameInput.trim()}
								</div>
							</div>
						)}

						{/* Authentication ID */}
						{authState.authenticationId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Authentication ID
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{authState.authenticationId}
								</div>
							</div>
						)}

						{/* Status */}
						{authState.status && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
									}}
								>
									Status
									{(() => {
										// Map status to education content key
										const statusKeyMap: Record<string, string> = {
											OTP_REQUIRED: 'flow.otp_required',
											DEVICE_SELECTION_REQUIRED: 'flow.device_selection_required',
											ASSERTION_REQUIRED: 'flow.assertion_required',
											PUSH_CONFIRMATION_REQUIRED: 'flow.push_confirmation_required',
											PUSH_CONFIRMATION_TIMED_OUT: 'flow.push_confirmation_timed_out',
										};
										const contentKey = statusKeyMap[authState.status];
										if (contentKey) {
											return <MFAInfoButtonV8 contentKey={contentKey} displayMode="tooltip" />;
										}
										return null;
									})()}
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										padding: '8px 12px',
										background: authState.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
										borderRadius: '6px',
										border: `1px solid ${authState.status === 'COMPLETED' ? '#86efac' : '#fbbf24'}`,
										fontWeight: '500',
									}}
								>
									{authState.status.replace(/_/g, ' ')}
								</div>
							</div>
						)}

						{/* Next Step */}
						{authState.nextStep && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
									}}
								>
									Next Step
									{(() => {
										// Map nextStep to education content key
										const stepKeyMap: Record<string, string> = {
											OTP_REQUIRED: 'flow.otp_required',
											DEVICE_SELECTION_REQUIRED: 'flow.device_selection_required',
											SELECTION_REQUIRED: 'flow.device_selection_required',
											ASSERTION_REQUIRED: 'flow.assertion_required',
											PUSH_CONFIRMATION_REQUIRED: 'flow.push_confirmation_required',
											PUSH_CONFIRMATION_TIMED_OUT: 'flow.push_confirmation_timed_out',
										};
										const contentKey = stepKeyMap[authState.nextStep];
										if (contentKey) {
											return <MFAInfoButtonV8 contentKey={contentKey} displayMode="tooltip" />;
										}
										return null;
									})()}
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#eff6ff',
										borderRadius: '6px',
										border: '1px solid #93c5fd',
										fontWeight: '500',
									}}
								>
									{authState.nextStep.replace(/_/g, ' ')}
								</div>
							</div>
						)}

						{/* Policy Used */}
						{credentials.deviceAuthenticationPolicyId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Policy Used
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{deviceAuthPolicies.find((p) => p.id === credentials.deviceAuthenticationPolicyId)
										?.name || credentials.deviceAuthenticationPolicyId}
								</div>
							</div>
						)}
					</div>

					{/* Selected Device Details */}
					{authState.selectedDeviceId && authState.devices.length > 0 && (
						<div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
							<h3
								style={{
									margin: '0 0 16px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								Selected Device
							</h3>
							{(() => {
								const selectedDevice = authState.devices.find(
									(d) => d.id === authState.selectedDeviceId
								);
								if (!selectedDevice) return null;

								return (
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
											gap: '16px',
											padding: '16px',
											background: '#f9fafb',
											borderRadius: '8px',
											border: '1px solid #e5e7eb',
										}}
									>
										<div>
											<div
												style={{
													fontSize: '12px',
													color: '#6b7280',
													marginBottom: '4px',
													fontWeight: '500',
												}}
											>
												Device ID
											</div>
											<div
												style={{
													fontSize: '13px',
													color: '#1f2937',
													fontFamily: 'monospace',
													wordBreak: 'break-all',
												}}
											>
												{selectedDevice.id}
											</div>
										</div>
										<div>
											<div
												style={{
													fontSize: '12px',
													color: '#6b7280',
													marginBottom: '4px',
													fontWeight: '500',
												}}
											>
												Device Type
											</div>
											<div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
												{selectedDevice.type}
											</div>
										</div>
										<div>
											<div
												style={{
													fontSize: '12px',
													color: '#6b7280',
													marginBottom: '4px',
													fontWeight: '500',
												}}
											>
												Device Name
											</div>
											<div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
												{selectedDevice.nickname || selectedDevice.name || 'Unnamed'}
											</div>
										</div>
										{selectedDevice.phone && (
											<div>
												<div
													style={{
														fontSize: '12px',
														color: '#6b7280',
														marginBottom: '4px',
														fontWeight: '500',
													}}
												>
													Phone
												</div>
												<div style={{ fontSize: '13px', color: '#1f2937' }}>
													{selectedDevice.phone}
												</div>
											</div>
										)}
										{selectedDevice.email && (
											<div>
												<div
													style={{
														fontSize: '12px',
														color: '#6b7280',
														marginBottom: '4px',
														fontWeight: '500',
													}}
												>
													Email
												</div>
												<div style={{ fontSize: '13px', color: '#1f2937' }}>
													{selectedDevice.email}
												</div>
											</div>
										)}
										{selectedDevice.status && (
											<div>
												<div
													style={{
														fontSize: '12px',
														color: '#6b7280',
														marginBottom: '4px',
														fontWeight: '500',
													}}
												>
													Status
												</div>
												<div
													style={{
														fontSize: '13px',
														color: selectedDevice.status === 'ACTIVE' ? '#166534' : '#92400e',
														fontWeight: '500',
													}}
												>
													{selectedDevice.status}
												</div>
											</div>
										)}
									</div>
								);
							})()}
						</div>
					)}

					{/* Challenge ID (if available) */}
					{authState.challengeId && (
						<div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
							<div
								style={{
									fontSize: '12px',
									color: '#6b7280',
									marginBottom: '6px',
									fontWeight: '500',
								}}
							>
								Challenge ID
							</div>
							<div
								style={{
									fontSize: '13px',
									color: '#1f2937',
									fontFamily: 'monospace',
									wordBreak: 'break-all',
									padding: '8px 12px',
									background: '#f9fafb',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								{authState.challengeId}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Device List */}
			{usernameInput.trim() && credentials.environmentId && tokenStatus.isValid && (
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						border: '1px solid #e5e7eb',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '20px',
						}}
					>
						<h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
							User Devices
						</h2>
						<button
							type="button"
							onClick={async () => {
								if (!credentials.environmentId || !usernameInput.trim() || !tokenStatus.isValid)
									return;
								setIsLoadingDevices(true);
								setDevicesError(null);
								try {
									const devices = await MFAServiceV8.getAllDevices({
										environmentId: credentials.environmentId,
										username: usernameInput.trim(),
									});
									setUserDevices(devices);
									toastV8.success('Devices refreshed');
								} catch (error) {
									console.error(`${MODULE_TAG} Failed to refresh devices:`, error);
									setDevicesError(
										error instanceof Error ? error.message : 'Failed to load devices'
									);
									toastV8.error('Failed to refresh devices');
								} finally {
									setIsLoadingDevices(false);
								}
							}}
							disabled={isLoadingDevices}
							style={{
								padding: '6px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								background: 'white',
								color: '#6b7280',
								fontSize: '14px',
								cursor: isLoadingDevices ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}
						>
							<FiLoader
								style={{ animation: isLoadingDevices ? 'spin 1s linear infinite' : 'none' }}
							/>
							Refresh
						</button>
					</div>

					{devicesError && (
						<div
							style={{
								padding: '12px',
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '6px',
								color: '#991b1b',
								fontSize: '14px',
								marginBottom: '16px',
							}}
						>
							{devicesError}
						</div>
					)}

					{isLoadingDevices ? (
						<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
							<FiLoader
								style={{
									animation: 'spin 1s linear infinite',
									fontSize: '24px',
									marginBottom: '12px',
								}}
							/>
							<p>Loading devices...</p>
						</div>
					) : userDevices.length > 0 ? (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
								gap: '16px',
							}}
						>
							{userDevices.map((device) => (
								<button
									key={device.id as string}
									type="button"
									onClick={async () => {
										// Start authentication with this specific device (for all device types)
										if (!tokenStatus.isValid) {
											toastV8.error('Please configure worker token first');
											return;
										}

										if (!credentials.environmentId) {
											toastV8.error('Please configure environment ID first');
											return;
										}

										if (!credentials.deviceAuthenticationPolicyId) {
											toastV8.error('Please select an MFA Policy first');
											return;
										}

										if (!usernameInput.trim()) {
											toastV8.error('Please enter a username first');
											return;
										}

										try {
											setAuthState((prev) => ({ ...prev, isLoading: true }));

											// Initialize device authentication with the specific device
											const response =
												await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
													environmentId: credentials.environmentId,
													username: usernameInput.trim(),
													deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
													deviceId: device.id as string,
													region: credentials.region,
													customDomain: credentials.customDomain,
												});

											const status = response.status || '';
											const nextStep = response.nextStep || '';
											const authDevices = (response.devices as Device[]) || [];
											const needsDeviceSelection =
												status === 'DEVICE_SELECTION_REQUIRED' || nextStep === 'SELECTION_REQUIRED';
											const links = (response._links as Record<string, { href: string }>) || {};
											const needsAssertion =
												status === 'ASSERTION_REQUIRED' || nextStep === 'ASSERTION_REQUIRED';
											const needsPush =
												status === 'PUSH_CONFIRMATION_REQUIRED' ||
												nextStep === 'PUSH_CONFIRMATION_REQUIRED';

											// Extract publicKeyCredentialRequestOptions if ASSERTION_REQUIRED (for FIDO2)
											// Per PingOne MFA API: ASSERTION_REQUIRED response includes publicKeyCredentialRequestOptions
											const publicKeyOptions = (
												response as { publicKeyCredentialRequestOptions?: unknown }
											).publicKeyCredentialRequestOptions;

											// Lookup user to get userId
											const user = await MFAServiceV8.lookupUserByUsername(
												credentials.environmentId,
												usernameInput.trim()
											);

											setAuthState({
												isLoading: false,
												authenticationId: response.id || null,
												status,
												nextStep,
												devices: authDevices,
												showDeviceSelection: needsDeviceSelection,
												selectedDeviceId: device.id as string,
												userId: String(user.id || ''),
												challengeId: (response.challengeId as string) || null,
												publicKeyCredentialRequestOptions: publicKeyOptions,
												_links: links,
												completionResult: null,
											});

											// Handle next step based on device type and response
											if (status === 'OTP_REQUIRED' || nextStep === 'OTP_REQUIRED') {
												setShowOTPModal(true);
												toastV8.success('OTP has been sent. Please check your device.');
											} else if (needsAssertion) {
												const deviceType = (device.type as string)?.toUpperCase() || '';
												if (deviceType === 'FIDO2') {
													// Verify we have either challengeId or publicKeyCredentialRequestOptions
													const hasChallengeId = !!(response.challengeId as string);
													const hasPublicKeyOptions = !!publicKeyOptions;

													if (!hasChallengeId && !hasPublicKeyOptions) {
														console.error(
															`${MODULE_TAG} Missing challengeId and publicKeyCredentialRequestOptions for FIDO2 ASSERTION_REQUIRED from initializeDeviceAuthentication`,
															{
																response,
																_links: links,
															}
														);
														toastV8.error(
															'PingOne did not provide a WebAuthn challenge for this FIDO2 authentication. Please try again or use another factor.'
														);
													} else {
														setShowFIDO2Modal(true);
														toastV8.success('Please complete WebAuthn authentication.');
													}
												} else {
													toastV8.error(
														`ASSERTION_REQUIRED only applies to FIDO2 devices, but selected device is ${deviceType}`
													);
												}
											} else if (needsPush) {
												setShowPushModal(true);
												toastV8.success('Please approve the sign-in on your phone.');
												// Polling is handled by useEffect when showPushModal is true
											} else if (status === 'COMPLETED') {
												toastV8.success('Authentication completed successfully!');
											} else if (needsDeviceSelection) {
												setShowDeviceSelectionModal(true);
												toastV8.success('Please select a device to continue');
											} else {
												toastV8.success('Authentication started successfully');
											}
										} catch (error) {
											console.error(
												`${MODULE_TAG} Failed to start authentication with device:`,
												error
											);
											toastV8.error(
												error instanceof Error ? error.message : 'Failed to start authentication'
											);
											setAuthState((prev) => ({ ...prev, isLoading: false }));
										}
									}}
									style={{
										padding: '16px',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										background: '#f9fafb',
										cursor: 'pointer',
										transition: 'all 0.2s',
										textAlign: 'left',
										width: '100%',
									}}
									onMouseOver={(e) => {
										e.currentTarget.style.background = '#f3f4f6';
										e.currentTarget.style.borderColor = '#3b82f6';
										e.currentTarget.style.transform = 'translateY(-2px)';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.background = '#f9fafb';
										e.currentTarget.style.borderColor = '#e5e7eb';
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = 'none';
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											marginBottom: '12px',
										}}
									>
										<div
											style={{
												width: '40px',
												height: '40px',
												borderRadius: '8px',
												background: '#3b82f6',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: 'white',
												fontSize: '20px',
											}}
										>
											{device.type === 'SMS' || device.type === 'VOICE' ? (
												<FiPhone color="white" />
											) : device.type === 'EMAIL' ? (
												<FiMail color="white" />
											) : device.type === 'FIDO2' ? (
												<FiKey color="white" />
											) : (
												<FiShield color="white" />
											)}
										</div>
										<div style={{ flex: 1 }}>
											<div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
												{String(device.nickname || device.name || device.type || 'Unknown Device')}
											</div>
											<div style={{ fontSize: '12px', color: '#6b7280' }}>
												{String(device.type || 'Unknown')}
											</div>
										</div>
									</div>
									<div style={{ fontSize: '12px', color: '#6b7280' }}>
										Status: <strong style={{ color: '#1f2937' }}>{device.status as string}</strong>
									</div>
								</button>
							))}
						</div>
					) : (
						<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
							<FiShield style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }} />
							<p>No devices found for this user</p>
						</div>
					)}
				</div>
			)}

			{/* Authentication Status */}
			{authState.authenticationId && (
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						border: '1px solid #e5e7eb',
					}}
				>
					<h2
						style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}
					>
						Authentication Status
					</h2>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '16px',
						}}
					>
						<div>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>Status</span>
							<div
								style={{
									fontSize: '16px',
									fontWeight: '500',
									color: authState.status === 'COMPLETED' ? '#10b981' : '#1f2937',
								}}
							>
								{authState.status || 'Unknown'}
							</div>
						</div>
						<div>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>Next Step</span>
							<div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
								{authState.nextStep || 'None'}
							</div>
						</div>
						<div>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>Devices Available</span>
							<div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
								{authState.devices.length}
							</div>
						</div>
					</div>

					{/* Success Section - Show when authentication is completed */}
					{authState.status === 'COMPLETED' && (
						<div
							style={{
								marginTop: '24px',
								padding: '28px',
								background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
								border: '2px solid #86efac',
								borderRadius: '12px',
								boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
							}}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}
							>
								<div
									style={{
										width: '48px',
										height: '48px',
										borderRadius: '12px',
										background: '#10b981',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FiCheck style={{ color: 'white', fontSize: '24px' }} />
								</div>
								<div>
									<h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#166534' }}>
										Authentication Successful!
									</h3>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#15803d' }}>
										Your authentication has been completed successfully.
									</p>
								</div>
							</div>
							{authState.completionResult ? (
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
										gap: '16px',
									}}
								>
									{authState.completionResult.accessToken && (
										<div
											style={{
												background: 'white',
												padding: '16px',
												borderRadius: '8px',
												border: '1px solid #bbf7d0',
											}}
										>
											<span
												style={{
													fontSize: '12px',
													color: '#166534',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												Access Token
											</span>
											<div
												style={{
													fontSize: '13px',
													color: '#1f2937',
													fontFamily: 'monospace',
													background: '#f9fafb',
													padding: '10px',
													borderRadius: '6px',
													wordBreak: 'break-all',
													marginTop: '8px',
													border: '1px solid #e5e7eb',
												}}
											>
												{authState.completionResult.accessToken.substring(0, 60)}...
											</div>
										</div>
									)}
									{authState.completionResult.tokenType && (
										<div
											style={{
												background: 'white',
												padding: '16px',
												borderRadius: '8px',
												border: '1px solid #bbf7d0',
											}}
										>
											<span
												style={{
													fontSize: '12px',
													color: '#166534',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												Token Type
											</span>
											<div
												style={{
													fontSize: '16px',
													color: '#1f2937',
													fontWeight: '500',
													marginTop: '8px',
												}}
											>
												{authState.completionResult.tokenType}
											</div>
										</div>
									)}
									{authState.completionResult.expiresIn && (
										<div
											style={{
												background: 'white',
												padding: '16px',
												borderRadius: '8px',
												border: '1px solid #bbf7d0',
											}}
										>
											<span
												style={{
													fontSize: '12px',
													color: '#166534',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												Expires In
											</span>
											<div
												style={{
													fontSize: '16px',
													color: '#1f2937',
													fontWeight: '500',
													marginTop: '8px',
												}}
											>
												{authState.completionResult.expiresIn} seconds
											</div>
										</div>
									)}
								</div>
							) : (
								<div
									style={{
										background: 'white',
										padding: '16px',
										borderRadius: '8px',
										border: '1px solid #bbf7d0',
										textAlign: 'center',
									}}
								>
									<p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
										Authentication completed successfully. No additional token information
										available.
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Modals */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						// Refresh token status when modal closes
						setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
					}}
				/>
			)}

			{/* Username Decision Modal */}
			{showUsernameDecisionModal && (
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
						zIndex: 1000,
					}}
					onClick={() => {
						// Navigate back to main page when clicking outside
						navigate('/v8/mfa-hub');
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '500px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #E31837 0%, #C4122E 100%)',
								padding: '32px 32px 24px 32px',
								textAlign: 'center',
							}}
						>
							<PingIdentityLogo size={48} />
							<h3
								style={{
									margin: '0',
									fontSize: '22px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								{isPasskeyRegistrationMode
									? 'Register a new passkey'
									: 'Use passkey or enter username?'}
							</h3>
						</div>
						<div style={{ padding: '32px' }}>
							<div
								style={{
									display: 'flex',
									gap: '12px',
									flexDirection: 'column',
									marginBottom: '16px',
								}}
							>
								<button
									type="button"
									onClick={() => {
										setShowUsernameDecisionModal(false);
										setIsPasskeyRegistrationMode(false);
										handleUsernamelessFIDO2();
									}}
									style={{
										padding: '12px 24px',
										border: 'none',
										borderRadius: '6px',
										background: '#3b82f6',
										color: 'white',
										fontSize: '16px',
										fontWeight: '600',
										cursor: 'pointer',
									}}
								>
									Use passkey (username-less)
								</button>
								<div>
									<label
										htmlFor={`${usernameInputId}-modal`}
										style={{
											display: 'block',
											marginBottom: '8px',
											fontSize: '14px',
											fontWeight: '500',
										}}
									>
										Select username
									</label>
									<UserSearchDropdownV8
										id={`${usernameInputId}-modal`}
										environmentId={credentials.environmentId}
										value={usernameInput}
										onChange={(newUsername) => {
											setUsernameInput(newUsername);
											setCredentials((prev) => ({ ...prev, username: newUsername }));
											// Save to storage immediately so it syncs to main UI
											const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
												flowKey: FLOW_KEY,
												flowType: 'oidc',
												includeClientSecret: false,
												includeRedirectUri: false,
												includeLogoutUri: false,
												includeScopes: false,
											});
											CredentialsServiceV8.saveCredentials(FLOW_KEY, {
												...stored,
												username: newUsername,
											});
										}}
										placeholder="Search for a user..."
										disabled={!credentials.environmentId}
									/>
									<button
										type="button"
										onClick={async () => {
											if (!usernameInput.trim()) {
												toastV8.warning('Please enter a username');
												return;
											}

											if (isPasskeyRegistrationMode) {
												// Register passkey
												setShowUsernameDecisionModal(false);
												setAuthState((prev) => ({ ...prev, isLoading: true }));

												try {
													const { PasskeyServiceV8 } = await import(
														'@/v8/services/passkeyServiceV8'
													);
													const result = await PasskeyServiceV8.registerPasskey({
														environmentId: credentials.environmentId,
														username: usernameInput.trim(),
														deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
														deviceName: 'My Passkey',
													});

													if (result.success) {
														toastV8.success(
															'Passkey registered successfully! You can now use it for username-less authentication.'
														);
														setIsPasskeyRegistrationMode(false);
														// Optionally, immediately try authentication with the new passkey
														// For now, just show success
													} else {
														// Check for NO_USABLE_DEVICES error
														if (result.errorCode === 'NO_USABLE_DEVICES') {
															setDeviceFailureError(result.error || 'No usable devices found');
															setUnavailableDevices(result.unavailableDevices || []);
															setShowDeviceFailureModal(true);
														} else {
															toastV8.error(result.error || 'Failed to register passkey');
														}
													}
												} catch (error) {
													console.error(`${MODULE_TAG} Passkey registration error:`, error);

													// Check for NO_USABLE_DEVICES error
													if (handleDeviceFailureError(error)) {
														setAuthState((prev) => ({ ...prev, isLoading: false }));
														return;
													}

													toastV8.error(
														error instanceof Error ? error.message : 'Failed to register passkey'
													);
												} finally {
													setAuthState((prev) => ({ ...prev, isLoading: false }));
												}
											} else {
												// Regular MFA flow
												setShowUsernameDecisionModal(false);
												handleStartMFA();
											}
										}}
										disabled={!usernameInput.trim() || authState.isLoading}
										style={{
											width: '100%',
											padding: '10px 24px',
											border: '2px solid #3b82f6',
											borderRadius: '6px',
											background:
												usernameInput.trim() && !authState.isLoading ? 'white' : '#f3f4f6',
											color: usernameInput.trim() && !authState.isLoading ? '#3b82f6' : '#9ca3af',
											fontSize: '16px',
											fontWeight: '600',
											cursor:
												usernameInput.trim() && !authState.isLoading ? 'pointer' : 'not-allowed',
										}}
									>
										{isPasskeyRegistrationMode
											? authState.isLoading
												? 'Registering...'
												: 'Register Passkey'
											: 'Continue with username'}
									</button>
								</div>
							</div>
							<button
								type="button"
								onClick={() => {
									setShowUsernameDecisionModal(false);
									setIsPasskeyRegistrationMode(false);
									navigate('/v8/mfa-hub');
								}}
								style={{
									width: '100%',
									padding: '12px 24px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									background: 'white',
									color: '#6b7280',
									fontSize: '16px',
									fontWeight: '500',
									cursor: 'pointer',
									marginTop: '16px',
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Device Selection Modal */}
			{showDeviceSelectionModal && (
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
						zIndex: 1000,
					}}
					onClick={() => setShowDeviceSelectionModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '600px',
							width: '90%',
							maxHeight: '80vh',
							overflow: 'hidden',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							display: 'flex',
							flexDirection: 'column',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
								padding: '32px 32px 24px 32px',
								textAlign: 'center',
								position: 'relative',
							}}
						>
							<button
								type="button"
								onClick={() => setShowDeviceSelectionModal(false)}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={18} />
							</button>
							<PingIdentityLogo size={48} />
							<h3
								style={{
									margin: '0',
									fontSize: '22px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								Choose how to verify
							</h3>
							{usernameInput.trim() && (
								<p
									style={{
										margin: '8px 0 0 0',
										fontSize: '14px',
										fontWeight: '400',
										color: 'rgba(255, 255, 255, 0.9)',
										textAlign: 'center',
									}}
								>
									For user: <strong>{usernameInput.trim()}</strong>
								</p>
							)}
							{authState.userId && (
								<p
									style={{
										margin: '4px 0 0 0',
										fontSize: '12px',
										fontWeight: '400',
										color: 'rgba(255, 255, 255, 0.85)',
										textAlign: 'center',
									}}
								>
									User ID: <strong>{authState.userId}</strong>
								</p>
							)}
						</div>
						<div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
							{/* Search Input */}
							<div style={{ marginBottom: '16px' }}>
								<div style={{ position: 'relative' }}>
									<input
										type="text"
										placeholder="Search devices by name, phone, email, or type..."
										value={deviceSearchQuery}
										onChange={(e) => setDeviceSearchQuery(e.target.value)}
										style={{
											width: '100%',
											padding: '10px 16px 10px 40px',
											border: '1px solid #d1d5db',
											borderRadius: '8px',
											fontSize: '14px',
											outline: 'none',
											transition: 'border-color 0.2s',
										}}
										onFocus={(e) => {
											e.currentTarget.style.borderColor = '#10b981';
										}}
										onBlur={(e) => {
											e.currentTarget.style.borderColor = '#d1d5db';
										}}
									/>
									<span
										style={{
											position: 'absolute',
											left: '12px',
											top: '50%',
											transform: 'translateY(-50%)',
											color: '#6b7280',
											fontSize: '18px',
										}}
									>
										🔍
									</span>
									{deviceSearchQuery && (
										<button
											type="button"
											onClick={() => setDeviceSearchQuery('')}
											style={{
												position: 'absolute',
												right: '8px',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'transparent',
												border: 'none',
												cursor: 'pointer',
												color: '#6b7280',
												padding: '4px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.color = '#1f2937';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.color = '#6b7280';
											}}
										>
											<FiX size={16} />
										</button>
									)}
								</div>
							</div>

							{(() => {
								// Merge devices from authState and userDevices, deduplicating by ID

								const authDevicesMap = new Map(authState.devices.map((d) => [d.id, d]));
								const userDevicesMap = new Map(
									userDevices
										.map(
											(d: Record<string, unknown>) =>
												({
													id: (d.id as string) || '',
													type: (d.type as string) || '',
													nickname:
														(d.nickname as string) || (d.name as string) || (d.type as string),
													phone: d.phone as string | undefined,
													email: d.email as string | undefined,
													status: d.status as string | undefined,
												}) as Device
										)
										.map((d) => [d.id, d])
								);

								// Merge maps, with authState devices taking precedence
								const allDevicesMap = new Map([...userDevicesMap, ...authDevicesMap]);
								let allDevices = Array.from(allDevicesMap.values());

								// Filter devices based on search query
								if (deviceSearchQuery.trim()) {
									const query = deviceSearchQuery.toLowerCase().trim();
									allDevices = allDevices.filter((device) => {
										const name = (device.nickname || device.name || '').toLowerCase();
										const phone = (device.phone || '').toLowerCase();
										const email = (device.email || '').toLowerCase();
										const type = (device.type || '').toLowerCase();
										const status = (device.status || '').toLowerCase();

										return (
											name.includes(query) ||
											phone.includes(query) ||
											email.includes(query) ||
											type.includes(query) ||
											status.includes(query)
										);
									});
								}

								if (allDevices.length === 0) {
									if (deviceSearchQuery.trim()) {
										return (
											<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
												<FiShield
													style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}
												/>
												<p
													style={{
														fontSize: '16px',
														fontWeight: '500',
														marginBottom: '8px',
														color: '#1f2937',
													}}
												>
													No devices found
												</p>
												<p style={{ fontSize: '14px', marginBottom: '24px' }}>
													No devices match your search: <strong>"{deviceSearchQuery}"</strong>
												</p>
												<button
													type="button"
													onClick={() => setDeviceSearchQuery('')}
													style={{
														padding: '10px 20px',
														border: '1px solid #d1d5db',
														borderRadius: '8px',
														background: 'white',
														color: '#6b7280',
														fontSize: '14px',
														fontWeight: '500',
														cursor: 'pointer',
														transition: 'all 0.2s',
													}}
													onMouseEnter={(e) => {
														e.currentTarget.style.borderColor = '#10b981';
														e.currentTarget.style.color = '#10b981';
													}}
													onMouseLeave={(e) => {
														e.currentTarget.style.borderColor = '#d1d5db';
														e.currentTarget.style.color = '#6b7280';
													}}
												>
													Clear Search
												</button>
											</div>
										);
									}
									return (
										<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
											<FiShield style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }} />
											<p
												style={{
													fontSize: '16px',
													fontWeight: '500',
													marginBottom: '8px',
													color: '#1f2937',
												}}
											>
												No devices available
											</p>
											<p style={{ fontSize: '14px', marginBottom: '24px' }}>
												Please register a device first
											</p>
											<button
												type="button"
												onClick={() => {
													setShowDeviceSelectionModal(false);
													setShowRegistrationModal(true);
												}}
												style={{
													padding: '12px 24px',
													border: 'none',
													borderRadius: '8px',
													background: '#10b981',
													color: 'white',
													fontSize: '16px',
													fontWeight: '600',
													cursor: 'pointer',
													display: 'inline-flex',
													alignItems: 'center',
													gap: '8px',
													transition: 'all 0.2s',
												}}
												onMouseOver={(e) => {
													e.currentTarget.style.background = '#059669';
												}}
												onMouseOut={(e) => {
													e.currentTarget.style.background = '#10b981';
												}}
											>
												<FiPlus />
												Register New Device
											</button>
										</div>
									);
								}

								// Separate devices by status: ACTIVE vs ACTIVATION_REQUIRED
								const activeDevices = allDevices.filter((d) => {
									const status = (d.status as string)?.toUpperCase();
									return status === 'ACTIVE' || !status || status === '';
								});
								const activationRequiredDevices = allDevices.filter((d) => {
									const status = (d.status as string)?.toUpperCase();
									return status === 'ACTIVATION_REQUIRED';
								});

								return (
									<div>
										{/* Active Devices Section */}
										{activeDevices.length > 0 && (
											<div
												style={{
													margin: '0 0 20px 0',
													padding: '16px',
													border: '2px solid #10b981',
													borderRadius: '8px',
													background: '#f0fdf4',
												}}
											>
												{/* Header */}
												<div
													style={{
														marginBottom: '12px',
														padding: '10px 12px',
														background: '#10b981',
														borderRadius: '6px',
													}}
												>
													<div
														style={{
															fontSize: '15px',
															fontWeight: '700',
															color: 'white',
															marginBottom: '4px',
														}}
													>
														✅ Active Devices ({activeDevices.length})
													</div>
													<div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
														These devices are ready to use for authentication. They appear in
														PingOne Console.
													</div>
												</div>
												{/* Device List */}
												<MFADeviceSelector
													devices={activeDevices}
													loading={false}
													selectedDeviceId={authState.selectedDeviceId}
													deviceType={'SMS' as DeviceType}
													onSelectDevice={async (deviceId) => {
														// Validate deviceId
														if (!deviceId || deviceId.trim() === '') {
															console.error(`${MODULE_TAG} Invalid deviceId:`, deviceId);
															toastV8.error('Device ID is missing or invalid');
															return;
														}

														// Find the selected device to determine its type (check both allDevices and authState.devices)
														const selectedDevice =
															allDevices.find((d) => d.id === deviceId) ||
															authState.devices.find((d) => d.id === deviceId);
														if (!selectedDevice) {
															console.error(
																`${MODULE_TAG} Selected device not found in devices list:`,
																{
																	deviceId,
																	availableDeviceIds: allDevices.map((d) => d.id),
																	authStateDeviceIds: authState.devices.map((d) => d.id),
																}
															);
															toastV8.error('Selected device not found');
															return;
														}

														const deviceType =
															(selectedDevice.type as string)?.toUpperCase() || 'UNKNOWN';

														// Validate required fields
														if (!authState.authenticationId) {
															console.error(`${MODULE_TAG} Missing authenticationId`);
															toastV8.error(
																'Authentication session not found. Please start authentication again.'
															);
															return;
														}

														if (!usernameInput.trim()) {
															console.error(`${MODULE_TAG} Missing username`);
															toastV8.error('Username is required');
															return;
														}

														// Select device using MfaAuthenticationServiceV8
														try {
															setAuthState((prev) => ({ ...prev, isLoading: true }));

															// Lookup userId if not already set
															const userId = authState.userId;
															if (!userId && usernameInput.trim()) {
																const user = await MFAServiceV8.lookupUserByUsername(
																	credentials.environmentId,
																	usernameInput.trim()
																);
																const newUserId = String(user.id || '');
																setAuthState((prev) => ({ ...prev, userId: newUserId }));
																userId = newUserId;
															}

															if (!userId) {
																throw new Error(
																	'Unable to determine userId. Please check your username and try again.'
																);
															}

															const data =
																await MfaAuthenticationServiceV8.selectDeviceForAuthentication({
																	environmentId: credentials.environmentId,
																	username: usernameInput.trim(),
																	userId,
																	authenticationId: authState.authenticationId,
																	deviceId: deviceId.trim(),
																	region: credentials.region,
																	customDomain: credentials.customDomain,
																});

															// Extract challengeId from response - it might be in data.challengeId or in _links
															// According to PingOne MFA API, challengeId can be:
															// 1. Directly in the response: data.challengeId
															// 2. In _links['challenge.poll'].href: /.../challenges/{challengeId}/poll
															// 3. In _links['challenge.check'].href: /.../challenges/{challengeId}/check
															// 4. In _links['assertion.check'].href: /.../deviceAuthentications/{authId} (no challengeId in URL)
															// 5. For FIDO2 ASSERTION_REQUIRED: may be in publicKeyCredentialRequestOptions (but we still need challengeId)
															let challengeId: string | null = (data.challengeId as string) || null;

															// For FIDO2, check if publicKeyCredentialRequestOptions is provided
															// This contains the WebAuthn challenge, but we still need challengeId to identify it
															const hasPublicKeyOptions = !!(
																data as { publicKeyCredentialRequestOptions?: unknown }
															).publicKeyCredentialRequestOptions;

															// Check if challengeId is in _links (e.g., challenge.poll or challenge.check)
															if (!challengeId && data._links) {
																const links = data._links as Record<string, { href: string }>;
																// Extract challengeId from challenge.poll or challenge.check URLs if present
																const challengePollUrl =
																	links['challenge.poll']?.href || links['challenge.check']?.href;
																if (challengePollUrl) {
																	// Try to extract challengeId from URL (format: /.../challenges/{challengeId}/poll or /.../challenges/{challengeId}/check)
																	const challengeMatch =
																		challengePollUrl.match(/\/challenges\/([^/]+)/);
																	if (challengeMatch && challengeMatch[1]) {
																		challengeId = challengeMatch[1];
																	} else {
																		console.warn(
																			`${MODULE_TAG} ⚠️ challenge.poll/challenge.check URL found but couldn't extract challengeId:`,
																			challengePollUrl
																		);
																	}
																}

																// For FIDO2 ASSERTION_REQUIRED, if we have assertion.check link but no challengeId,
																// we might need to use the authenticationId as a fallback or extract from the link
																if (!challengeId && links['assertion.check']?.href) {
																	// The assertion.check link format is: /.../deviceAuthentications/{authId}
																	// We'll need to read the auth details to get challengeId
																}
															}

															// Read the device authentication again to get the latest state including challengeId
															// Note: This may fail with 403, but we should still have challengeId from the selectDeviceForAuthentication response
															let authDetails: Record<string, unknown> | null = null;

															try {
																// Use userId if available, otherwise use username
																const userIdOrUsername = authState.userId || usernameInput.trim();
																authDetails =
																	await MfaAuthenticationServiceV8.readDeviceAuthentication(
																		credentials.environmentId,
																		userIdOrUsername,
																		authState.authenticationId,
																		{ isUserId: !!authState.userId }
																	);
																// Use challengeId from authDetails if available, otherwise keep existing
																if (authDetails.challengeId) {
																	challengeId = authDetails.challengeId as string;
																}
															} catch (readError) {
																console.warn(
																	`${MODULE_TAG} Failed to read device authentication after selection (will use challengeId from selection response):`,
																	readError
																);
																// Even if read fails, we should have challengeId from the selectDeviceForAuthentication response
															}

															// Ensure challengeId is set - it's critical for FIDO2 authentication
															if (!challengeId) {
																// Only log as warning if we're actually in a FIDO2 flow
																// For username-less passkey flow, challengeId is not needed (it uses WebAuthn directly)
																const isFIDO2Flow =
																	deviceId &&
																	authState.devices.find((d) => d.id === deviceId)?.type ===
																		'FIDO2';

																if (isFIDO2Flow) {
																	console.warn(
																		`${MODULE_TAG} ⚠️ WARNING: challengeId is missing after device selection for FIDO2!`,
																		{
																			data,
																			authDetails,
																			_links: data._links,
																			challengeIdFromData: data.challengeId,
																			hasPublicKeyOptions: !!(
																				data as { publicKeyCredentialRequestOptions?: unknown }
																			).publicKeyCredentialRequestOptions,
																			allDataKeys: Object.keys(data),
																		}
																	);

																	// Try to extract from _links as a last resort
																	if (data._links) {
																		const links = data._links as Record<string, { href: string }>;
																		const challengePollUrl =
																			links['challenge.poll']?.href ||
																			links['challenge.check']?.href;
																		if (challengePollUrl) {
																			const challengeMatch =
																				challengePollUrl.match(/\/challenges\/([^/]+)/);
																			if (challengeMatch && challengeMatch[1]) {
																				challengeId = challengeMatch[1];
																			}
																		}
																	}

																	// If we still don't have challengeId but have publicKeyCredentialRequestOptions,
																	// we can still proceed - the FIDO2 modal will need to handle this case
																	// by using the challenge from publicKeyCredentialRequestOptions directly
																	if (
																		!challengeId &&
																		(data as { publicKeyCredentialRequestOptions?: unknown })
																			.publicKeyCredentialRequestOptions
																	) {
																	}
																}
															}

															// Update auth state with response
															const status = (authDetails?.status as string) || data.status || '';
															const nextStep =
																(authDetails?.nextStep as string) || data.nextStep || '';
															const links = (data._links as Record<string, { href: string }>) || {};

															// If PingOne already considers the authentication completed, don't open the FIDO2 modal
															if (
																status === 'COMPLETED' ||
																nextStep === 'COMPLETED' ||
																nextStep === 'AUTHENTICATION_COMPLETE'
															) {
																setAuthState((prev) => ({
																	...prev,
																	isLoading: false,
																	status,
																	nextStep,
																	selectedDeviceId: deviceId,
																	challengeId: null,
																	_links: { ...prev._links, ...links },
																}));
																setShowDeviceSelectionModal(false);
																toastV8.success('Authentication completed successfully!');
																return;
															}

															// Extract publicKeyCredentialRequestOptions if available
															const publicKeyOptions =
																(data as { publicKeyCredentialRequestOptions?: unknown })
																	.publicKeyCredentialRequestOptions ||
																(
																	authDetails as {
																		publicKeyCredentialRequestOptions?: unknown;
																	} | null
																)?.publicKeyCredentialRequestOptions;

															setAuthState((prev) => ({
																...prev,
																isLoading: false,
																status,
																nextStep,
																selectedDeviceId: deviceId,
																challengeId,
																publicKeyCredentialRequestOptions:
																	publicKeyOptions || prev.publicKeyCredentialRequestOptions,
																_links: { ...prev._links, ...links },
															}));

															setShowDeviceSelectionModal(false);

															// Handle next step based on device type and response
															if (status === 'OTP_REQUIRED' || nextStep === 'OTP_REQUIRED') {
																setShowOTPModal(true);
																toastV8.success('OTP has been sent. Please check your device.');
															} else if (
																status === 'ASSERTION_REQUIRED' ||
																nextStep === 'ASSERTION_REQUIRED'
															) {
																if (deviceType === 'FIDO2') {
																	// Check if we have challengeId or publicKeyCredentialRequestOptions
																	const publicKeyOptions =
																		(data as { publicKeyCredentialRequestOptions?: unknown })
																			.publicKeyCredentialRequestOptions ||
																		(
																			authDetails as {
																				publicKeyCredentialRequestOptions?: unknown;
																			} | null
																		)?.publicKeyCredentialRequestOptions;

																	if (!challengeId && !publicKeyOptions) {
																		console.error(
																			`${MODULE_TAG} Missing challengeId and publicKeyCredentialRequestOptions for FIDO2 ASSERTION_REQUIRED after device selection`,
																			{
																				data,
																				authDetails,
																				_links: data._links,
																			}
																		);
																		toastV8.error(
																			'PingOne did not provide a WebAuthn challenge for this FIDO2 authentication. Please try again or use another factor.'
																		);
																	} else {
																		// Store publicKeyCredentialRequestOptions in auth state if available
																		if (publicKeyOptions) {
																			setAuthState((prev) => ({
																				...prev,
																				publicKeyCredentialRequestOptions: publicKeyOptions,
																			}));
																		}
																		setShowFIDO2Modal(true);
																		toastV8.success('Please complete WebAuthn authentication.');
																	}
																} else {
																	toastV8.error(
																		`ASSERTION_REQUIRED only applies to FIDO2 devices, but selected device is ${deviceType}`
																	);
																}
															} else if (
																status === 'PUSH_CONFIRMATION_REQUIRED' ||
																nextStep === 'PUSH_CONFIRMATION_REQUIRED'
															) {
																setShowPushModal(true);
																toastV8.success('Please approve the sign-in on your phone.');
															} else if (status === 'COMPLETED') {
																toastV8.success('Authentication completed successfully!');
															} else {
																toastV8.success('Device selected successfully');
															}
														} catch (error) {
															console.error(`${MODULE_TAG} Failed to select device:`, error);
															toastV8.error(
																error instanceof Error ? error.message : 'Failed to select device'
															);
															setAuthState((prev) => ({ ...prev, isLoading: false }));
														}
													}}
													onSelectNew={() => {
														setShowDeviceSelectionModal(false);
														// Open registration modal to allow user to choose device type
														setShowRegistrationModal(true);
													}}
												/>
											</div>
										)}
										{/* Activation Required Devices Section */}
										{activationRequiredDevices.length > 0 && (
											<div
												style={{
													margin: '0',
													padding: '16px',
													border: '2px solid #f59e0b',
													borderRadius: '8px',
													background: '#fef3c7',
												}}
											>
												{/* Header */}
												<div
													style={{
														marginBottom: '12px',
														padding: '10px 12px',
														background: '#f59e0b',
														borderRadius: '6px',
													}}
												>
													<div
														style={{
															fontSize: '15px',
															fontWeight: '700',
															color: 'white',
															marginBottom: '4px',
														}}
													>
														⚠️ Devices Still in ACTIVATION_REQUIRED (
														{activationRequiredDevices.length})
													</div>
													<div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
														These devices need activation before they can be used for
														authentication. They are NOT shown in PingOne Console.
													</div>
												</div>
												{/* Device List */}
												<MFADeviceSelector
													devices={activationRequiredDevices}
													loading={false}
													selectedDeviceId={authState.selectedDeviceId}
													deviceType={'SMS' as DeviceType}
													onSelectDevice={async (deviceId) => {
														// Same handler as active devices

														// Validate deviceId
														if (!deviceId || deviceId.trim() === '') {
															console.error(`${MODULE_TAG} Invalid deviceId:`, deviceId);
															toastV8.error('Device ID is missing or invalid');
															return;
														}

														// Find the selected device to determine its type
														const selectedDevice =
															allDevices.find((d) => d.id === deviceId) ||
															authState.devices.find((d) => d.id === deviceId);
														if (!selectedDevice) {
															console.error(
																`${MODULE_TAG} Selected device not found in devices list:`,
																{
																	deviceId,
																	availableDeviceIds: allDevices.map((d) => d.id),
																	authStateDeviceIds: authState.devices.map((d) => d.id),
																}
															);
															toastV8.error('Selected device not found');
															return;
														}

														const deviceType =
															(selectedDevice.type as string)?.toUpperCase() || 'UNKNOWN';

														// Validate required fields
														if (!authState.authenticationId) {
															console.error(`${MODULE_TAG} Missing authenticationId`);
															toastV8.error(
																'Authentication session not found. Please start authentication again.'
															);
															return;
														}

														if (!usernameInput.trim()) {
															console.error(`${MODULE_TAG} Missing username`);
															toastV8.error('Username is required');
															return;
														}

														// Note: Activation required devices cannot be used for authentication
														toastV8.warning(
															'This device requires activation before it can be used for authentication. Please activate it first.'
														);
														setShowDeviceSelectionModal(false);
													}}
													onSelectNew={() => {
														setShowDeviceSelectionModal(false);
														setShowRegistrationModal(true);
													}}
												/>
											</div>
										)}
									</div>
								);
							})()}
						</div>
					</div>
				</div>
			)}

			{/* OTP Modal */}
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
						zIndex: 1000,
					}}
					onClick={() => setShowOTPModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '450px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								padding: '32px 32px 24px 32px',
								textAlign: 'center',
								position: 'relative',
							}}
						>
							<button
								type="button"
								onClick={() => {
									setShowOTPModal(false);
									setOtpCode('');
									setOtpError(null);
								}}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={18} />
							</button>
							<PingIdentityLogo size={48} />
							<h3
								style={{
									margin: '0',
									fontSize: '22px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								Enter verification code
							</h3>
						</div>
						<div style={{ padding: '32px', textAlign: 'center' }}>
							{(() => {
								// Try to find device in authState.devices first, then fallback to userDevices
								const selectedDevice = authState.devices.find(
									(d) => d.id === authState.selectedDeviceId
								);
								if (!selectedDevice && authState.selectedDeviceId) {
									selectedDevice = userDevices.find(
										(d) => (d.id as string) === authState.selectedDeviceId
									) as Device | undefined;
								}

								return (
									<>
										<p
											style={{
												margin: '0 0 8px 0',
												color: '#6b7280',
												fontSize: '15px',
												lineHeight: '1.5',
											}}
										>
											Enter the verification code sent to your device.
										</p>
										{selectedDevice && (selectedDevice.phone || selectedDevice.email) && (
											<p
												style={{
													margin: '0 0 16px 0',
													color: '#374151',
													fontSize: '14px',
													fontWeight: '500',
													lineHeight: '1.5',
												}}
											>
												{selectedDevice.phone
													? `📱 Phone: ${selectedDevice.phone}`
													: `📧 Email: ${selectedDevice.email}`}
											</p>
										)}
									</>
								);
							})()}

							{otpError && (
								<div
									style={{
										padding: '12px',
										background: '#fef2f2',
										border: '1px solid #fecaca',
										borderRadius: '6px',
										color: '#991b1b',
										fontSize: '14px',
										marginBottom: '16px',
										textAlign: 'center',
									}}
								>
									{otpError}
								</div>
							)}

							<div
								style={{
									marginBottom: '24px',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '16px',
								}}
							>
								<MFAOTPInput
									value={otpCode}
									onChange={(value) => {
										setOtpCode(value);
										setOtpError(null);
									}}
									disabled={isValidatingOTP}
									placeholder="123456"
									maxLength={6}
								/>
								{(() => {
									// Try to find device in authState.devices first, then fallback to userDevices
									const selectedDevice = authState.devices.find(
										(d) => d.id === authState.selectedDeviceId
									);
									if (!selectedDevice && authState.selectedDeviceId) {
										selectedDevice = userDevices.find(
											(d) => (d.id as string) === authState.selectedDeviceId
										) as Device | undefined;
									}
									if (!selectedDevice || (!selectedDevice.phone && !selectedDevice.email))
										return null;

									return (
										<p
											style={{
												margin: '0',
												color: '#6b7280',
												fontSize: '14px',
												lineHeight: '1.5',
												textAlign: 'center',
												width: '100%',
											}}
										>
											Enter the 6-digit code from{' '}
											{selectedDevice.phone ? `your phone` : `your email`}
										</p>
									);
								})()}
							</div>

							<div style={{ display: 'flex', gap: '12px' }}>
								<button
									type="button"
									onClick={async () => {
										if (otpCode.length !== 6) {
											setOtpError('Please enter a 6-digit code');
											return;
										}

										if (!authState.authenticationId) {
											setOtpError('Authentication session not found');
											return;
										}

										setIsValidatingOTP(true);
										setOtpError(null);

										try {
											const otpCheckUrl = authState._links?.['otp.check']?.href;
											if (!otpCheckUrl) {
												throw new Error('OTP check URL not available');
											}
											const result = await MfaAuthenticationServiceV8.validateOTP({
												environmentId: credentials.environmentId,
												username: usernameInput.trim(),
												authenticationId: authState.authenticationId,
												otp: otpCode,
												otpCheckUrl,
											});

											if (result.valid) {
												// Update auth state with new links from OTP validation response
												const newLinks = (result._links as Record<string, { href: string }>) || {};
												const updatedLinks = { ...authState._links, ...newLinks };

												// Complete authentication to get access token if complete link is available
												let completionResult = null;
												if (updatedLinks['complete']?.href) {
													try {
														completionResult =
															await MfaAuthenticationServiceV8.completeAuthentication(
																updatedLinks['complete'].href
															);
													} catch (completeError) {
														console.warn(
															`${MODULE_TAG} Failed to complete authentication:`,
															completeError
														);
														// Continue even if completion fails - OTP was validated successfully
													}
												}

												setShowOTPModal(false);
												setOtpCode('');
												setOtpError(null);

												// Get selected device details
												const selectedDevice = authState.devices.find(
													(d) => d.id === authState.selectedDeviceId
												);
												const selectedPolicy = deviceAuthPolicies.find(
													(p) => p.id === credentials.deviceAuthenticationPolicyId
												);
												const policyName = selectedPolicy?.name;
												const deviceSelectionBehavior = selectedPolicy?.authentication
													?.deviceSelection as string | undefined;

												// Navigate to success page with completion result
												navigate('/v8/mfa/authentication/success', {
													state: {
														completionResult: completionResult
															? {
																	...completionResult, // Include all fields from completion result
																}
															: null,
														username: usernameInput.trim(),
														userId: authState.userId,
														environmentId: credentials.environmentId,
														deviceType: selectedDevice?.type || 'OTP',
														deviceId: authState.selectedDeviceId,
														deviceDetails: selectedDevice
															? {
																	id: selectedDevice.id,
																	type: selectedDevice.type,
																	nickname: selectedDevice.nickname,
																	name: selectedDevice.name,
																	phone: selectedDevice.phone,
																	email: selectedDevice.email,
																	status: selectedDevice.status,
																}
															: null,
														policyId: credentials.deviceAuthenticationPolicyId,
														policyName: policyName,
														authenticationId: authState.authenticationId,
														challengeId: authState.challengeId,
														timestamp: new Date().toISOString(),
														deviceSelectionBehavior: deviceSelectionBehavior,
													},
												});
											} else {
												setOtpError(
													result.message || 'Invalid verification code. Please try again.'
												);
												setOtpCode('');
											}
										} catch (error) {
											console.error(`${MODULE_TAG} OTP validation failed:`, error);
											setOtpError(
												error instanceof Error ? error.message : 'Failed to validate code'
											);
											setOtpCode('');
										} finally {
											setIsValidatingOTP(false);
										}
									}}
									disabled={isValidatingOTP || otpCode.length !== 6}
									style={{
										flex: 1,
										padding: '10px 24px',
										border: 'none',
										borderRadius: '6px',
										background: isValidatingOTP || otpCode.length !== 6 ? '#9ca3af' : '#3b82f6',
										color: 'white',
										fontSize: '16px',
										fontWeight: '600',
										cursor: isValidatingOTP || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px',
									}}
								>
									{isValidatingOTP ? (
										<>
											<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
											Validating...
										</>
									) : (
										'Verify Code'
									)}
								</button>
								<button
									type="button"
									onClick={async () => {
										// Resend OTP by re-selecting the device
										// According to cursor-optimized.md: Only use verified endpoints
										// Re-selecting device triggers a new OTP via selectDeviceForAuthentication endpoint
										if (!authState.authenticationId || !authState.selectedDeviceId) {
											setOtpError('Authentication session or device not found');
											return;
										}

										setIsValidatingOTP(true);
										setOtpError(null);
										setOtpCode(''); // Clear existing code

										try {
											// Get userId if not already available
											const userId = authState.userId;
											if (!userId) {
												const user = await MFAServiceV8.lookupUserByUsername(
													credentials.environmentId,
													usernameInput.trim()
												);
												userId = user.id as string;
												setAuthState((prev) => ({ ...prev, userId }));
											}

											// Re-select device to trigger new OTP
											// According to cursor-optimized.md: Only use verified endpoints
											// Re-selecting device triggers a new OTP via selectDeviceForAuthentication endpoint
											const data = await MfaAuthenticationServiceV8.selectDeviceForAuthentication(
												{
													environmentId: credentials.environmentId,
													username: usernameInput.trim(),
													userId,
													authenticationId: authState.authenticationId,
													deviceId: authState.selectedDeviceId,
													region: credentials.region,
													customDomain: credentials.customDomain,
												},
												{ stepName: 'mfa-Resend OTP Code' } // Custom step name for API display
											);

											// Read device authentication to get updated state
											let authDetails: Record<string, unknown> | null = null;
											try {
												authDetails = await MfaAuthenticationServiceV8.readDeviceAuthentication(
													credentials.environmentId,
													userId || usernameInput.trim(),
													authState.authenticationId,
													{ isUserId: !!userId }
												);
											} catch (readError) {
												console.warn(
													`${MODULE_TAG} Failed to read device authentication after resend:`,
													readError
												);
											}

											// Update auth state with new links
											const status = (authDetails?.status as string) || data.status || '';
											const nextStep = (authDetails?.nextStep as string) || data.nextStep || '';
											const links = (data._links as Record<string, { href: string }>) || {};

											setAuthState((prev) => ({
												...prev,
												status,
												nextStep,
												_links: { ...prev._links, ...links },
											}));

											toastV8.success(
												'New verification code has been sent. Please check your device.'
											);
										} catch (error) {
											console.error(`${MODULE_TAG} Failed to resend OTP:`, error);
											const errorMessage =
												error instanceof Error ? error.message : 'Failed to resend code';
											setOtpError(errorMessage);
											toastV8.error(`Failed to resend code: ${errorMessage}`);
										} finally {
											setIsValidatingOTP(false);
										}
									}}
									disabled={
										isValidatingOTP || !authState.authenticationId || !authState.selectedDeviceId
									}
									style={{
										padding: '10px 24px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										background:
											isValidatingOTP || !authState.authenticationId || !authState.selectedDeviceId
												? '#f3f4f6'
												: 'white',
										color:
											isValidatingOTP || !authState.authenticationId || !authState.selectedDeviceId
												? '#9ca3af'
												: '#374151',
										fontSize: '16px',
										fontWeight: '500',
										cursor:
											isValidatingOTP || !authState.authenticationId || !authState.selectedDeviceId
												? 'not-allowed'
												: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px',
									}}
								>
									{isValidatingOTP ? (
										<>
											<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
											Sending...
										</>
									) : (
										<>🔄 Resend Code</>
									)}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowOTPModal(false);
										setOtpCode('');
										setOtpError(null);
									}}
									style={{
										padding: '10px 24px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										background: 'white',
										color: '#6b7280',
										fontSize: '16px',
										fontWeight: '500',
										cursor: 'pointer',
									}}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* FIDO2 Modal */}
			{showFIDO2Modal && (
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
						zIndex: 1000,
					}}
					onClick={() => setShowFIDO2Modal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '500px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
								padding: '32px 32px 24px 32px',
								textAlign: 'center',
								position: 'relative',
							}}
						>
							<button
								type="button"
								onClick={() => {
									setShowFIDO2Modal(false);
									setFido2Error(null);
								}}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={18} />
							</button>
							<PingIdentityLogo size={48} />
							<h3
								style={{
									margin: '0',
									fontSize: '22px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								{typeof navigator !== 'undefined' &&
								navigator.platform.toLowerCase().includes('mac')
									? 'Use your Passkey'
									: 'Use your security key'}
							</h3>
						</div>
						<div style={{ padding: '32px' }}>
							<p
								style={{
									margin: '0 0 24px 0',
									color: '#6b7280',
									fontSize: '15px',
									lineHeight: '1.5',
									textAlign: 'center',
								}}
							>
								{typeof navigator !== 'undefined' &&
								navigator.platform.toLowerCase().includes('mac')
									? 'Please use your Passkey (Touch ID or Face ID) to complete authentication.'
									: 'Please use your security key, Touch ID, Face ID, or Windows Hello to complete authentication.'}
							</p>

							{fido2Error && (
								<div
									style={{
										padding: '12px',
										background: '#fef2f2',
										border: '1px solid #fecaca',
										borderRadius: '6px',
										color: '#991b1b',
										fontSize: '14px',
										marginBottom: '16px',
									}}
								>
									{fido2Error}
								</div>
							)}

							{!WebAuthnAuthenticationServiceV8.isWebAuthnSupported() && (
								<div
									style={{
										padding: '12px',
										background: '#fef2f2',
										border: '1px solid #fecaca',
										borderRadius: '6px',
										color: '#991b1b',
										fontSize: '14px',
										marginBottom: '16px',
									}}
								>
									WebAuthn is not supported in this browser. Please use a modern browser.
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px' }}>
								<button
									type="button"
									onClick={async () => {
										// This modal is for username-based FIDO2 authentication
										// It requires either challengeId OR publicKeyCredentialRequestOptions
										if (!authState.authenticationId) {
											console.error(`${MODULE_TAG} ❌ Missing authenticationId`);
											setFido2Error(
												'Authentication session not found. Please try selecting the device again.'
											);
											return;
										}

										// Check if we have either challengeId or publicKeyCredentialRequestOptions
										const hasChallengeId = !!authState.challengeId;
										const hasPublicKeyOptions = !!authState.publicKeyCredentialRequestOptions;

										if (!hasChallengeId && !hasPublicKeyOptions) {
											console.error(
												`${MODULE_TAG} ❌ Missing both challengeId and publicKeyCredentialRequestOptions`
											);
											setFido2Error(
												'WebAuthn challenge not found. Please try selecting the device again.'
											);
											return;
										}

										if (!WebAuthnAuthenticationServiceV8.isWebAuthnSupported()) {
											console.error(`${MODULE_TAG} ❌ WebAuthn not supported`);
											setFido2Error('WebAuthn is not supported in this browser');
											return;
										}

										setIsAuthenticatingFIDO2(true);
										setFido2Error(null);

										try {
											// Check for session cookies and native app context to prefer FIDO2 platform devices
											// Per PingOne MFA API:
											// 1. If session cookie exists, use FIDO2 platform device even if not default
											// 2. If native app with device authorization, use native device
											const {
												shouldPreferFIDO2PlatformDevice,
												getAuthenticatorSelectionPreferences,
											} = await import('@/v8/services/fido2SessionCookieServiceV8');
											const platformPreference = shouldPreferFIDO2PlatformDevice();
											const authenticatorPrefs = getAuthenticatorSelectionPreferences();

											// Detect if we're on macOS to prefer Passkeys (platform authenticators)
											const isMac =
												typeof navigator !== 'undefined' &&
												navigator.platform.toLowerCase().includes('mac');

											// Perform WebAuthn authentication
											// If publicKeyCredentialRequestOptions is available, use it directly (preferred)
											// Otherwise, fall back to challengeId
											const webAuthnParams: Parameters<
												typeof WebAuthnAuthenticationServiceV8.authenticateWithWebAuthn
											>[0] = {
												rpId: window.location.hostname,
												userName: usernameInput.trim(),
												userVerification: 'preferred',
											};

											// Use publicKeyCredentialRequestOptions if available (from PingOne response)
											if (hasPublicKeyOptions) {
												// Parse if it's a string, otherwise use as-is
												let publicKeyOptions: PublicKeyCredentialRequestOptions;
												if (typeof authState.publicKeyCredentialRequestOptions === 'string') {
													try {
														publicKeyOptions = JSON.parse(
															authState.publicKeyCredentialRequestOptions
														) as PublicKeyCredentialRequestOptions;
													} catch (parseError) {
														console.error(
															`${MODULE_TAG} Failed to parse publicKeyCredentialRequestOptions:`,
															parseError
														);
														throw new Error('Invalid publicKeyCredentialRequestOptions format');
													}
												} else {
													publicKeyOptions =
														authState.publicKeyCredentialRequestOptions as PublicKeyCredentialRequestOptions;
												}

												webAuthnParams.publicKeyOptions = publicKeyOptions;
											} else if (hasChallengeId) {
												// Fallback to challengeId
												webAuthnParams.challengeId = authState.challengeId!;
											}

											// Prefer platform authenticators if:
											// 1. Session cookie exists (FIDO2 platform device should be used even if not default)
											// 2. Native app with device authorization enabled
											// 3. macOS (Passkeys)
											if (platformPreference.prefer || isMac) {
												webAuthnParams.authenticatorSelection = {
													authenticatorAttachment: 'platform',
													userVerification: 'preferred',
												};
											}

											const webAuthnResult =
												await WebAuthnAuthenticationServiceV8.authenticateWithWebAuthn(
													webAuthnParams
												);

											if (!webAuthnResult.success) {
												throw new Error(webAuthnResult.error || 'WebAuthn authentication failed');
											}

											// Send assertion result to PingOne using check-assertion endpoint
											// Build assertion object according to PingOne API spec
											if (!authState.authenticationId) {
												throw new Error('Missing authentication ID for assertion check');
											}

											const assertion = {
												id: webAuthnResult.credentialId || '',
												rawId: webAuthnResult.rawId || webAuthnResult.credentialId || '',
												type: 'public-key',
												response: {
													clientDataJSON: webAuthnResult.clientDataJSON || '',
													authenticatorData: webAuthnResult.authenticatorData || '',
													signature: webAuthnResult.signature || '',
													...(webAuthnResult.userHandle && {
														userHandle: webAuthnResult.userHandle,
													}),
												},
											};

											// Call check-assertion endpoint
											// Pass environmentId from credentials to avoid loading from storage
											const assertionResult = await MfaAuthenticationServiceV8.checkFIDO2Assertion(
												authState.authenticationId,
												assertion,
												credentials.environmentId,
												credentials.region, // Pass region from credentials
												credentials.customDomain, // Pass custom domain from credentials
												window.location.origin // Pass origin for PingOne API
											);

											// Check if PingOne returned new publicKeyCredentialRequestOptions in the assertion check response
											// This can happen if the assertion needs to be retried with different options
											const newPublicKeyOptions = (
												assertionResult as { publicKeyCredentialRequestOptions?: unknown }
											).publicKeyCredentialRequestOptions;
											if (newPublicKeyOptions) {
												console.log(
													`${MODULE_TAG} PingOne returned new publicKeyCredentialRequestOptions from assertion check response`
												);
												// Update auth state with new options for potential retry
												setAuthState((prev) => ({
													...prev,
													publicKeyCredentialRequestOptions: newPublicKeyOptions,
												}));
											}

											// After sending assertion, check status and complete authentication
											// The assertion result may have a poll link or complete link
											const assertionLinks =
												(assertionResult._links as Record<string, { href: string }>) || {};

											// Try to complete authentication if complete link is available
											let completionResult = null;
											if (
												assertionLinks['complete']?.href ||
												authState._links?.['complete']?.href
											) {
												try {
													completionResult =
														await MfaAuthenticationServiceV8.completeAuthentication(
															assertionLinks['complete']?.href ||
																authState._links!['complete']!.href
														);
												} catch (completeError) {
													console.warn(
														`${MODULE_TAG} Failed to complete FIDO2 authentication:`,
														completeError
													);
													// Continue even if completion fails - authentication was successful
												}
											}

											// If status is COMPLETED or we have a completion result, navigate to success
											if (assertionResult.status === 'COMPLETED' || completionResult) {
												setShowFIDO2Modal(false);
												setFido2Error(null);

												// Get selected device details
												const selectedDevice = authState.devices.find(
													(d) => d.id === authState.selectedDeviceId
												);
												const selectedPolicy = deviceAuthPolicies.find(
													(p) => p.id === credentials.deviceAuthenticationPolicyId
												);
												const policyName = selectedPolicy?.name;
												const deviceSelectionBehavior = selectedPolicy?.authentication
													?.deviceSelection as string | undefined;

												// Navigate to success page with completion result
												navigate('/v8/mfa/authentication/success', {
													state: {
														completionResult: completionResult
															? {
																	...completionResult, // Include all fields from completion result
																}
															: null,
														username: usernameInput.trim(),
														userId: authState.userId,
														environmentId: credentials.environmentId,
														deviceType: selectedDevice?.type || 'FIDO2',
														deviceId: authState.selectedDeviceId,
														deviceDetails: selectedDevice
															? {
																	id: selectedDevice.id,
																	type: selectedDevice.type,
																	nickname: selectedDevice.nickname,
																	name: selectedDevice.name,
																	phone: selectedDevice.phone,
																	email: selectedDevice.email,
																	status: selectedDevice.status,
																}
															: null,
														policyId: credentials.deviceAuthenticationPolicyId,
														policyName: policyName,
														authenticationId: authState.authenticationId,
														challengeId: authState.challengeId,
														timestamp: new Date().toISOString(),
														deviceSelectionBehavior: deviceSelectionBehavior,
													},
												});
											} else {
												// If assertion check didn't complete, try polling if poll link is available
												if (
													assertionLinks['challenge.poll']?.href ||
													authState._links?.['challenge.poll']?.href
												) {
													const pollResult =
														await MfaAuthenticationServiceV8.pollAuthenticationStatus(
															assertionLinks['challenge.poll']?.href ||
																authState._links!['challenge.poll']!.href
														);

													if (pollResult.status === 'COMPLETED') {
														// Complete authentication to get access token if complete link is available
														let pollCompletionResult = null;
														const pollLinks =
															(pollResult._links as Record<string, { href: string }>) || {};
														if (
															pollLinks['complete']?.href ||
															authState._links?.['complete']?.href
														) {
															try {
																pollCompletionResult =
																	await MfaAuthenticationServiceV8.completeAuthentication(
																		pollLinks['complete']?.href ||
																			authState._links!['complete']!.href
																	);
															} catch (completeError) {
																console.warn(
																	`${MODULE_TAG} Failed to complete FIDO2 authentication (via poll):`,
																	completeError
																);
															}
														}

														setShowFIDO2Modal(false);
														setFido2Error(null);

														// Get selected device details
														const selectedDevice = authState.devices.find(
															(d) => d.id === authState.selectedDeviceId
														);
														const selectedPolicy = deviceAuthPolicies.find(
															(p) => p.id === credentials.deviceAuthenticationPolicyId
														);
														const policyName = selectedPolicy?.name;
														const deviceSelectionBehavior = selectedPolicy?.authentication
															?.deviceSelection as string | undefined;

														// Navigate to success page
														navigate('/v8/mfa/authentication/success', {
															state: {
																completionResult: pollCompletionResult
																	? {
																			...pollCompletionResult,
																		}
																	: null,
																username: usernameInput.trim(),
																userId: authState.userId,
																environmentId: credentials.environmentId,
																deviceType: selectedDevice?.type || 'FIDO2',
																deviceId: authState.selectedDeviceId,
																deviceDetails: selectedDevice
																	? {
																			id: selectedDevice.id,
																			type: selectedDevice.type,
																			nickname: selectedDevice.nickname,
																			name: selectedDevice.name,
																			phone: selectedDevice.phone,
																			email: selectedDevice.email,
																			status: selectedDevice.status,
																		}
																	: null,
																policyId: credentials.deviceAuthenticationPolicyId,
																policyName: policyName,
																authenticationId: authState.authenticationId,
																challengeId: authState.challengeId,
																timestamp: new Date().toISOString(),
																deviceSelectionBehavior: deviceSelectionBehavior,
															},
														});
													} else {
														setFido2Error('Authentication is still pending. Please try again.');
													}
												} else {
													// If no poll URL and assertion didn't complete, show error
													setFido2Error(
														'Authentication completed but status is unclear. Please try again.'
													);
												}
											}
										} catch (error) {
											console.error(`${MODULE_TAG} FIDO2 authentication failed:`, error);
											setFido2Error(
												error instanceof Error
													? error.message
													: 'Failed to complete WebAuthn authentication'
											);
										} finally {
											setIsAuthenticatingFIDO2(false);
										}
									}}
									disabled={
										isAuthenticatingFIDO2 ||
										!WebAuthnAuthenticationServiceV8.isWebAuthnSupported() ||
										(!authState.challengeId && !authState.publicKeyCredentialRequestOptions)
									}
									title={
										!authState.challengeId && !authState.publicKeyCredentialRequestOptions
											? 'WebAuthn challenge not found. Please try selecting the device again.'
											: !WebAuthnAuthenticationServiceV8.isWebAuthnSupported()
												? 'WebAuthn is not supported in this browser'
												: isAuthenticatingFIDO2
													? 'Authenticating...'
													: 'Click to authenticate with your Passkey or security key'
									}
									style={{
										flex: 1,
										padding: '10px 24px',
										border: 'none',
										borderRadius: '6px',
										background:
											isAuthenticatingFIDO2 ||
											(!authState.challengeId && !authState.publicKeyCredentialRequestOptions)
												? '#9ca3af'
												: '#3b82f6',
										color: 'white',
										fontSize: '16px',
										fontWeight: '600',
										cursor:
											isAuthenticatingFIDO2 ||
											(!authState.challengeId && !authState.publicKeyCredentialRequestOptions)
												? 'not-allowed'
												: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px',
										transition: 'background 0.2s ease',
									}}
								>
									{isAuthenticatingFIDO2 ? (
										<>
											<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
											Authenticating...
										</>
									) : (
										<>
											<FiKey />
											{typeof navigator !== 'undefined' &&
											navigator.platform.toLowerCase().includes('mac')
												? 'Authenticate with Passkey'
												: 'Authenticate with Security Key'}
										</>
									)}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowFIDO2Modal(false);
										setFido2Error(null);
									}}
									style={{
										padding: '10px 24px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										background: 'white',
										color: '#6b7280',
										fontSize: '16px',
										fontWeight: '500',
										cursor: 'pointer',
									}}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Push Modal */}
			{showPushModal && (
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
						zIndex: 1000,
					}}
					onClick={() => setShowPushModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '500px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
								padding: '32px 32px 24px 32px',
								textAlign: 'center',
								position: 'relative',
							}}
						>
							<button
								type="button"
								onClick={() => setShowPushModal(false)}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={18} />
							</button>
							<PingIdentityLogo size={48} />
							<h3
								style={{
									margin: '0',
									fontSize: '22px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								Approve sign-in on your phone
							</h3>
						</div>
						<div style={{ padding: '32px' }}>
							<div style={{ textAlign: 'center', marginBottom: '24px' }}>
								<div
									style={{
										width: '80px',
										height: '80px',
										borderRadius: '50%',
										background: '#eff6ff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										margin: '0 auto 16px',
										fontSize: '40px',
									}}
								>
									📱
								</div>
								<p
									style={{
										margin: '0 0 8px 0',
										fontSize: '16px',
										fontWeight: '500',
										color: '#1f2937',
									}}
								>
									Push notification sent
								</p>
								<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
									Please check your mobile device and approve the sign-in request.
								</p>
							</div>

							<div
								style={{
									padding: '12px',
									background: '#f0fdf4',
									border: '1px solid #bbf7d0',
									borderRadius: '6px',
									marginBottom: '20px',
									fontSize: '14px',
									color: '#166534',
								}}
							>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
								>
									<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
									<strong>Waiting for approval...</strong>
								</div>
								<p style={{ margin: 0, fontSize: '13px' }}>
									We're checking your device for approval. This modal will close automatically when
									you approve.
								</p>
							</div>

							<button
								type="button"
								onClick={() => setShowPushModal(false)}
								style={{
									width: '100%',
									padding: '12px 24px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									background: 'white',
									color: '#6b7280',
									fontSize: '16px',
									fontWeight: '500',
									cursor: 'pointer',
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Device Registration Modal */}
			{showRegistrationModal && (
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
						padding: '20px',
					}}
					onClick={() => setShowRegistrationModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '600px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								padding: '32px 32px 24px 32px',
								textAlign: 'center',
								position: 'relative',
							}}
						>
							<button
								type="button"
								onClick={() => setShowRegistrationModal(false)}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={18} />
							</button>
							<FiShield size={48} color="white" />
							<h3
								style={{
									margin: '16px 0 0 0',
									fontSize: '22px',
									fontWeight: '700',
									color: 'white',
								}}
							>
								Register New Device
							</h3>
							<p
								style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}
							>
								Select a device type allowed by your MFA Policy
							</p>
						</div>
						<div style={{ padding: '32px' }}>
							{(() => {
								const selectedPolicy = deviceAuthPolicies.find(
									(p) => p.id === credentials.deviceAuthenticationPolicyId
								);
								if (!selectedPolicy) {
									return (
										<div style={{ textAlign: 'center', padding: '40px 20px' }}>
											<FiAlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
											<p style={{ margin: 0, fontSize: '16px', color: '#6b7280' }}>
												Please select an MFA Policy first to see allowed device types.
											</p>
										</div>
									);
								}

								// Extract allowed device types from policy (using shared function)
								const allowedDeviceTypes = extractAllowedDeviceTypes(selectedPolicy);
								const deviceIcons: Partial<Record<DeviceType, string>> = {
									FIDO2: '🔑',
									TOTP: '🔐',
									SMS: '📱',
									EMAIL: '📧',
									VOICE: '📞',
									MOBILE: '📲',
									TEL: '📞',
									WHATSAPP: '💬',
								};

								const deviceNames: Partial<Record<DeviceType, string>> = {
									FIDO2: 'FIDO2 / Passkey',
									TOTP: 'TOTP / Authenticator App',
									SMS: 'SMS',
									EMAIL: 'Email',
									VOICE: 'Voice Call',
									MOBILE: 'Mobile App',
									TEL: 'Telephone',
									WHATSAPP: 'WhatsApp',
								};

								// If no device types are allowed, show a message
								if (allowedDeviceTypes.length === 0) {
									return (
										<>
											<div style={{ textAlign: 'center', padding: '40px 20px' }}>
												<FiAlertCircle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
												<p
													style={{
														margin: '0 0 8px 0',
														fontSize: '16px',
														fontWeight: '600',
														color: '#1f2937',
													}}
												>
													No Device Types Allowed
												</p>
												<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
													The selected policy <strong>{selectedPolicy.name}</strong> does not
													specify any allowed device types for registration.
												</p>
												<p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
													Please configure the policy to allow specific device types, or select a
													different policy.
												</p>
											</div>
											<button
												type="button"
												onClick={() => setShowRegistrationModal(false)}
												style={{
													width: '100%',
													marginTop: '24px',
													padding: '12px 24px',
													border: '1px solid #d1d5db',
													borderRadius: '8px',
													background: 'white',
													color: '#6b7280',
													fontSize: '16px',
													fontWeight: '500',
													cursor: 'pointer',
												}}
											>
												Close
											</button>
										</>
									);
								}

								return (
									<>
										<div style={{ marginBottom: '24px' }}>
											<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
												<strong>Policy:</strong> {selectedPolicy.name}
											</p>
											<p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
												The following device types are allowed for registration based on your
												selected MFA Policy:
											</p>
										</div>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
												gap: '12px',
												marginBottom: '24px',
											}}
										>
											{allowedDeviceTypes.map((deviceType) => {
												const isFIDO2 = deviceType === 'FIDO2';

												return (
													<button
														key={deviceType}
														type="button"
														onClick={() => {
															setShowRegistrationModal(false);
															// Navigate to registration with the selected policy
															// The registration flow will use credentials.deviceAuthenticationPolicyId
															navigate(`/v8/mfa/register/${deviceType.toLowerCase()}`, {
																state: {
																	deviceAuthenticationPolicyId:
																		credentials.deviceAuthenticationPolicyId,
																	policyName: selectedPolicy.name,
																},
															});
														}}
														style={{
															padding: isFIDO2 ? '24px' : '16px',
															border: '2px solid #e5e7eb',
															borderRadius: '12px',
															background: 'white',
															color: '#1f2937',
															cursor: 'pointer',
															transition: 'all 0.2s',
															display: 'flex',
															flexDirection: 'column',
															alignItems: 'center',
															gap: '8px',
															transform: isFIDO2 ? 'scale(1.1)' : 'scale(1)',
															boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.borderColor = '#3b82f6';
															e.currentTarget.style.background = '#f8fafc';
															e.currentTarget.style.transform = isFIDO2
																? 'scale(1.15)'
																: 'scale(1.05)';
															e.currentTarget.style.boxShadow =
																'0 4px 12px rgba(59, 130, 246, 0.2)';
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.borderColor = '#e5e7eb';
															e.currentTarget.style.background = 'white';
															e.currentTarget.style.transform = isFIDO2 ? 'scale(1.1)' : 'scale(1)';
															e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
														}}
													>
														<span style={{ fontSize: isFIDO2 ? '40px' : '32px' }}>
															{deviceIcons[deviceType] || '📱'}
														</span>
														<span
															style={{
																fontSize: isFIDO2 ? '15px' : '13px',
																fontWeight: '600',
																color: '#1f2937',
																textAlign: 'center',
															}}
														>
															{deviceNames[deviceType] || deviceType}
														</span>
													</button>
												);
											})}
										</div>
										<button
											type="button"
											onClick={() => setShowRegistrationModal(false)}
											style={{
												width: '100%',
												marginTop: '24px',
												padding: '12px 24px',
												border: '2px solid #3b82f6',
												borderRadius: '8px',
												background: '#3b82f6',
												color: 'white',
												fontSize: '16px',
												fontWeight: '500',
												cursor: 'pointer',
												transition: 'all 0.2s',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#2563eb';
												e.currentTarget.style.borderColor = '#2563eb';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#3b82f6';
												e.currentTarget.style.borderColor = '#3b82f6';
											}}
										>
											Cancel
										</button>
									</>
								);
							})()}
						</div>
					</div>
				</div>
			)}

			{/* Device Selection Info Modal */}
			{showDeviceSelectionInfoModal && (
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
						padding: '20px',
					}}
					onClick={() => setShowDeviceSelectionInfoModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '32px',
							maxWidth: '700px',
							width: '100%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							maxHeight: '90vh',
							overflowY: 'auto',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: '24px',
							}}
						>
							<h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
								Device Selection Behavior
							</h2>
							<button
								type="button"
								onClick={() => setShowDeviceSelectionInfoModal(false)}
								style={{
									background: 'rgba(0, 0, 0, 0.1)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: '#6b7280',
								}}
							>
								<FiX size={20} />
							</button>
						</div>

						<div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
							<p style={{ margin: '0 0 20px 0' }}>
								The <strong>Device Selection</strong> setting controls how users interact with their
								MFA devices during authentication. This setting determines whether devices are
								automatically selected or if users are prompted to choose.
							</p>

							<h3
								style={{
									margin: '24px 0 12px 0',
									fontSize: '18px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								Available Options:
							</h3>

							{/* DEFAULT_TO_FIRST */}
							<div
								style={{
									padding: '16px',
									background: '#f0fdf4',
									border: '1px solid #bbf7d0',
									borderRadius: '8px',
									marginBottom: '16px',
								}}
							>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
								>
									<span
										style={{
											padding: '4px 12px',
											background: '#10b981',
											color: 'white',
											borderRadius: '12px',
											fontSize: '12px',
											fontWeight: '600',
										}}
									>
										DEFAULT_TO_FIRST
									</span>
								</div>
								<p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#166534' }}>
									Automatic Device Selection
								</p>
								<p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
									<strong>User Experience:</strong> The system automatically selects the first
									available device for authentication. Users do not see a device selection screen.
								</p>
								<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#166534' }}>
									<strong>When to Use:</strong> Best for single-device users or when you want the
									fastest authentication experience. Users with multiple devices will always use
									their first device.
								</p>
							</div>

							{/* PROMPT_TO_SELECT_DEVICE */}
							<div
								style={{
									padding: '16px',
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '8px',
									marginBottom: '16px',
								}}
							>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
								>
									<span
										style={{
											padding: '4px 12px',
											background: '#3b82f6',
											color: 'white',
											borderRadius: '12px',
											fontSize: '12px',
											fontWeight: '600',
										}}
									>
										PROMPT_TO_SELECT_DEVICE
									</span>
								</div>
								<p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1e40af' }}>
									Smart Device Selection
								</p>
								<p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
									<strong>User Experience:</strong> If the user has only one device, it is
									automatically selected. If the user has multiple devices, they are shown a device
									selection screen to choose which device to use.
								</p>
								<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#1e40af' }}>
									<strong>When to Use:</strong> Ideal for most scenarios. Provides convenience for
									single-device users while giving choice to users with multiple devices.
								</p>
							</div>

							{/* ALWAYS_DISPLAY_DEVICES */}
							<div
								style={{
									padding: '16px',
									background: '#fef3c7',
									border: '1px solid #fde68a',
									borderRadius: '8px',
									marginBottom: '16px',
								}}
							>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
								>
									<span
										style={{
											padding: '4px 12px',
											background: '#f59e0b',
											color: 'white',
											borderRadius: '12px',
											fontSize: '12px',
											fontWeight: '600',
										}}
									>
										ALWAYS_DISPLAY_DEVICES
									</span>
								</div>
								<p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#92400e' }}>
									Always Show Device Selection
								</p>
								<p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
									<strong>User Experience:</strong> Users always see a device selection screen, even
									if they only have one device. This gives users full visibility and control over
									which device is used.
								</p>
								<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#92400e' }}>
									<strong>When to Use:</strong> Best for security-conscious environments or when you
									want users to explicitly confirm their device choice. Also useful for testing and
									debugging device selection flows.
								</p>
							</div>

							<div
								style={{
									padding: '16px',
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									marginTop: '24px',
								}}
							>
								<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
									<strong>💡 Tip:</strong> The device selection behavior is set in your Device
									Authentication Policy. Changing this setting affects all users who authenticate
									using that policy.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Device Authentication Policy Info Modal */}
			{showPolicyInfoModal && (
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
						padding: '20px',
					}}
					onClick={() => setShowPolicyInfoModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '32px',
							maxWidth: '700px',
							width: '100%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							maxHeight: '90vh',
							overflowY: 'auto',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: '24px',
							}}
						>
							<h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
								What is a Device Authentication Policy?
							</h2>
							<button
								type="button"
								onClick={() => setShowPolicyInfoModal(false)}
								style={{
									background: 'rgba(0, 0, 0, 0.1)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: '#6b7280',
								}}
							>
								<FiX size={20} />
							</button>
						</div>

						<div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
							<p style={{ margin: '0 0 20px 0' }}>
								A <strong>Device Authentication Policy</strong> is a configuration that controls how
								multi-factor authentication (MFA) works for your users. It determines which device
								types are allowed, how devices are selected during authentication, and what
								authentication methods are required.
							</p>

							<h3
								style={{
									margin: '24px 0 12px 0',
									fontSize: '18px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								Key Features:
							</h3>
							<ul style={{ margin: '0 0 20px 0', paddingLeft: '24px' }}>
								<li style={{ marginBottom: '8px' }}>
									<strong>Device Selection Behavior:</strong> Controls how users select devices
									during authentication (e.g., automatically select first device, prompt user to
									choose, always display all devices).
								</li>
								<li style={{ marginBottom: '8px' }}>
									<strong>Allowed Device Types:</strong> Specifies which device types (SMS, EMAIL,
									FIDO2, TOTP, etc.) can be used for authentication and registration.
								</li>
								<li style={{ marginBottom: '8px' }}>
									<strong>Authentication Requirements:</strong> Defines which device types are
									required, optional, or excluded from the authentication flow.
								</li>
								<li style={{ marginBottom: '8px' }}>
									<strong>Challenge Configuration:</strong> Sets up OTP requirements, challenge
									timeouts, retry limits, and other security parameters.
								</li>
							</ul>

							<h3
								style={{
									margin: '24px 0 12px 0',
									fontSize: '18px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								How It Works:
							</h3>
							<ol style={{ margin: '0 0 20px 0', paddingLeft: '24px' }}>
								<li style={{ marginBottom: '8px' }}>
									When you select a policy, it applies to{' '}
									<strong>both authentication and device registration</strong> flows.
								</li>
								<li style={{ marginBottom: '8px' }}>
									The policy determines which device types users can register and use for
									authentication.
								</li>
								<li style={{ marginBottom: '8px' }}>
									During authentication, the policy controls how devices are presented and selected.
								</li>
								<li style={{ marginBottom: '8px' }}>
									The policy enforces security requirements like OTP length, challenge timeouts, and
									retry limits.
								</li>
							</ol>

							<div
								style={{
									padding: '16px',
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '8px',
									marginTop: '24px',
								}}
							>
								<p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
									<strong>💡 Tip:</strong> The policy you select here will be used for all
									authentication attempts and device registrations. Make sure the policy allows the
									device types you want to test.
								</p>
							</div>

							<button
								type="button"
								onClick={() => setShowPolicyInfoModal(false)}
								style={{
									width: '100%',
									marginTop: '24px',
									padding: '12px 24px',
									border: 'none',
									borderRadius: '8px',
									background: '#3b82f6',
									color: 'white',
									fontSize: '16px',
									fontWeight: '500',
									cursor: 'pointer',
								}}
							>
								Got it
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Device Failure Modal */}
			<DeviceFailureModalV8
				isOpen={showDeviceFailureModal}
				onClose={() => {
					setShowDeviceFailureModal(false);
					setDeviceFailureError('');
					setUnavailableDevices([]);
				}}
				errorMessage={deviceFailureError}
				unavailableDevices={unavailableDevices}
				onUnlockDevice={async (deviceId: string) => {
					try {
						// Get user ID from auth state or credentials
						const userId = authState.userId || '';
						if (!userId) {
							toastV8.error('User ID not found. Please start authentication again.');
							return;
						}

						await MFAServiceV8.unlockDevice(credentials.environmentId, userId, deviceId);
						toastV8.success('Device unlocked successfully!');

						// Close modal and retry
						setShowDeviceFailureModal(false);
						setDeviceFailureError('');
						setUnavailableDevices([]);

						// Retry authentication if we have a username
						if (usernameInput.trim()) {
							handleStartMFA();
						}
					} catch (error) {
						console.error(`${MODULE_TAG} Failed to unlock device:`, error);
						toastV8.error(error instanceof Error ? error.message : 'Failed to unlock device');
					}
				}}
				onTryAnotherDevice={() => {
					setShowDeviceFailureModal(false);
					setDeviceFailureError('');
					setUnavailableDevices([]);
					// Show device selection modal
					setShowDeviceSelectionModal(true);
				}}
				onRetry={() => {
					setShowDeviceFailureModal(false);
					setDeviceFailureError('');
					setUnavailableDevices([]);
					// Retry the last action
					if (usernameInput.trim()) {
						handleStartMFA();
					} else {
						handleUsernamelessFIDO2();
					}
				}}
			/>
		</div>
	);
};
