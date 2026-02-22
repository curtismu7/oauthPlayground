/**
 * @file TOTPConfigurationPageV8.tsx
 * @module v8/flows/types
 * @description TOTP Configuration and Education Page
 * @version 8.0.0
 *
 * This page provides:
 * - TOTP education and information
 * - Device Authentication Policy selection
 * - Configuration before device registration
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowRight, FiBook, FiClock } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { sendAnalyticsLog } from '@/v8/utils/analyticsLoggerV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceAuthenticationPolicy, MFACredentials } from '../shared/MFATypes';

const _MODULE_TAG = '[🔐 TOTP-CONFIG-V8]';

export const TOTPConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Get auth context to check for user tokens from Authorization Code Flow
	const _authContext = useAuth();

	// Load saved credentials
	const [credentials, setCredentials] = useState<MFACredentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		// #region agent log
		sendAnalyticsLog({
			location: 'TOTPConfigurationPageV8.tsx:45',
			message: 'Initializing credentials from storage',
			data: {
				hasUserToken: !!stored.userToken,
				tokenType: stored.tokenType,
				userTokenLength: stored.userToken?.length,
			},
			timestamp: Date.now(),
			sessionId: 'debug-session',
			runId: 'run3',
			hypothesisId: 'F',
		});
		// #endregion

		// Get global environment ID if not in flow-specific storage
		const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		const environmentId = stored.environmentId || globalEnvId || '';

		return {
			environmentId: environmentId,
			clientId: stored.clientId || '',
			username: stored.username || '',
			deviceType: 'TOTP' as const,
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
			deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
			registrationPolicyId: stored.registrationPolicyId || '',
			tokenType: stored.tokenType || 'worker',
			userToken: stored.userToken || '',
		};
	});

	// Save environment ID globally when it changes
	useEffect(() => {
		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			console.log('[TOTP] Environment ID saved globally', {
				environmentId: credentials.environmentId,
			});
		}
	}, [credentials.environmentId]);

	// Token and modal state
	const [isProcessingCallback, setIsProcessingCallback] = useState(false);
	const isProcessingCallbackRef = React.useRef(false);

	// OAuth callback processing
	useEffect(() => {
		const code = searchParams.get('code');
		const error = searchParams.get('error');
		const storedState = sessionStorage.getItem('user_login_state_v8');
		const storedCodeVerifier = sessionStorage.getItem('user_login_code_verifier_v8');
		const storedCredentials = sessionStorage.getItem('user_login_credentials_temp_v8');

		const processCallback = async () => {
			if (!code || isProcessingCallbackRef.current) return;

			isProcessingCallbackRef.current = true;
			setIsProcessingCallback(true);

			try {
				if (!storedState || !storedCodeVerifier || !storedCredentials) {
					console.error('[🔐 TOTP-CONFIG-V8] Missing OAuth callback data');
					navigate('/v8/unified-mfa');
					return;
				}

				const credentials = JSON.parse(storedCredentials);

				// FOOLPROOF: Use the centralized redirect URI service for MFA flows
				// This ensures we always use the correct unified callback URI
				const correctRedirectUri = MFARedirectUriServiceV8.getRedirectUri('unified-mfa-v8');

				// Exchange authorization code for tokens
				const tokenResponse = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
					{
						environmentId: credentials.environmentId,
						clientId: credentials.clientId,
						clientSecret: credentials.clientSecret,
						redirectUri: correctRedirectUri,
						scopes: credentials.scopes,
						clientAuthMethod:
							credentials.clientAuthMethod ||
							credentials.tokenEndpointAuthMethod ||
							'client_secret_post',
					},
					code,
					storedCodeVerifier
				);

				// #region agent log
				sendAnalyticsLog({
					location: 'TOTPConfigurationPageV8.tsx:211',
					message: 'Token exchange successful',
					data: {
						hasAccessToken: !!tokenResponse?.access_token,
						accessTokenLength: tokenResponse?.access_token?.length,
					},
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run3',
					hypothesisId: 'F',
				});
				// #endregion

				// Clean up session storage and URL
				sessionStorage.removeItem('user_login_state_v8');
				sessionStorage.removeItem('user_login_code_verifier_v8');
				sessionStorage.removeItem('user_login_credentials_temp_v8');
				sessionStorage.removeItem('user_login_redirect_uri_v8');
				window.history.replaceState({}, document.title, window.location.pathname);

				console.log(`[🔐 TOTP-CONFIG-V8] ✅ OAuth token exchange successful`);
				setCredentials((prev) => ({
					...prev,
					userToken: 'oauth_completed',
					tokenType: 'user' as const,
				}));

				toastV8.success('Authentication successful! You can now proceed.');
			} catch (error) {
				console.error(`[🔐 TOTP-CONFIG-V8] Failed to exchange code for tokens`, error);
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Failed to exchange authorization code for tokens';
				if (errorMessage.includes('invalid_grant') || errorMessage.includes('expired')) {
					toastV8.error('Authorization code expired or already used. Please try logging in again.');
				} else {
					toastV8.error(errorMessage);
				}

				sessionStorage.removeItem('user_login_state_v8');
				sessionStorage.removeItem('user_login_code_verifier_v8');
				sessionStorage.removeItem('user_login_credentials_temp_v8');
				sessionStorage.removeItem('user_login_redirect_uri_v8');
			} finally {
				isProcessingCallbackRef.current = false;
				setIsProcessingCallback(false);
			}
		};

		if (code || error) {
			processCallback();
		}
	}, [searchParams, navigate]);

	// Handle device authentication policy selection
	const handlePolicySelect = useCallback((policy: DeviceAuthenticationPolicy) => {
		console.log(`[🔐 TOTP-CONFIG-V8] Selected device authentication policy:`, policy);
		setCredentials((prev) => ({
			...prev,
			deviceAuthenticationPolicyId: policy.id,
			registrationPolicyId: policy.registrationPolicyId || '',
		}));
	}, []);

	// Handle proceed to registration
	const handleProceedToRegistration = useCallback(() => {
		if (!credentials.environmentId || !credentials.clientId) {
			toastV8.error('Please configure environment settings first');
			return;
		}

		if (!credentials.deviceAuthenticationPolicyId) {
			toastV8.error('Please select a device authentication policy');
			return;
		}

		// Save credentials for the registration flow
		CredentialsServiceV8.saveCredentials('mfa-flow-v8', credentials);

		// Navigate to TOTP registration flow
		navigate('/v8/totp-flow');
	}, [credentials, navigate]);

	// Handle user login modal
	const handleUserLogin = useCallback(() => {
		// Save current credentials to session storage
		sessionStorage.setItem('user_login_credentials_temp_v8', JSON.stringify(credentials));
		sessionStorage.setItem('user_login_redirect_uri_v8', window.location.pathname);

		// Show user login modal
		// This would typically open the UserLoginModalV8 component
		// For now, navigate to the user login page
		navigate('/v8/user-login');
	}, [credentials, navigate]);

	return (
		<div className="min-h-screen bg-gray-50">
			<MFANavigationV8
				title="TOTP Configuration"
				subtitle="Configure Time-based One-Time Password (TOTP) settings"
				showBackButton
				onBackClick={() => navigate('/v8/unified-mfa')}
			/>

			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Education Section */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex items-center mb-4">
						<FiClock className="text-blue-600 text-2xl mr-3" />
						<h2 className="text-xl font-semibold text-gray-900">About TOTP</h2>
					</div>
					<div className="space-y-3 text-gray-700">
						<p>
							<strong>Time-based One-Time Password (TOTP)</strong> is a secure authentication method
							that generates temporary codes using a shared secret and the current time.
						</p>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h3 className="font-semibold text-blue-900 mb-2">How TOTP Works:</h3>
							<ul className="list-disc list-inside space-y-1 text-blue-800">
								<li>A secret key is shared between your app and the authenticator</li>
								<li>Both use the current time to generate a 6-8 digit code</li>
								<li>Codes change every 30 seconds</li>
								<li>No internet connection required after setup</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Configuration Section */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>

					{/* Environment Display */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="environmentid">
							Environment ID
						</label>
						<div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
							{credentials.environmentId || 'Not configured'}
						</div>
					</div>

					{/* Device Authentication Policy */}
					<div className="mb-6">
						<label
							className="block text-sm font-medium text-gray-700 mb-2"
							htmlFor="deviceauthenticationpolicy"
						>
							Device Authentication Policy
						</label>
						<DeviceAuthenticationPolicySelector
							environmentId={credentials.environmentId}
							selectedPolicyId={credentials.deviceAuthenticationPolicyId}
							onPolicySelect={handlePolicySelect}
						/>
					</div>

					{/* Token Status */}
					<div className="mb-6">
						<h3 className="text-lg font-medium text-gray-900 mb-3">Authentication Status</h3>
						<TokenStatusDisplay credentials={credentials} />
					</div>
				</div>

				{/* API Documentation */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex items-center mb-4">
						<FiBook className="text-green-600 text-2xl mr-3" />
						<h2 className="text-xl font-semibold text-gray-900">API Documentation</h2>
					</div>
					<SuperSimpleApiDisplayV8
						title="TOTP Configuration API"
						apiCalls={apiDisplayServiceV8.getTOTPConfigurationCalls()}
					/>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-between">
					<button
						type="button"
						onClick={() => navigate('/v8/unified-mfa')}
						className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Back to MFA Hub
					</button>

					<div className="space-x-4">
						{credentials.tokenType !== 'user' && (
							<button
								type="button"
								onClick={handleUserLogin}
								disabled={isProcessingCallback}
								className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
							>
								{isProcessingCallback ? 'Processing...' : 'User Login'}
							</button>
						)}

						<button
							type="button"
							onClick={handleProceedToRegistration}
							disabled={!credentials.deviceAuthenticationPolicyId || isProcessingCallback}
							className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
						>
							Proceed to Registration
							<FiArrowRight className="ml-2" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// Helper components (would typically be in separate files)
const DeviceAuthenticationPolicySelector: React.FC<{
	environmentId: string;
	selectedPolicyId: string;
	onPolicySelect: (policy: DeviceAuthenticationPolicy) => void;
}> = ({ environmentId, selectedPolicyId, onPolicySelect }) => {
	const [policies, setPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!environmentId) return;

		const loadPolicies = async () => {
			setLoading(true);
			try {
				const availablePolicies =
					await MFAConfigurationServiceV8.getDeviceAuthenticationPolicies(environmentId);
				setPolicies(availablePolicies);
			} catch (error) {
				console.error('Failed to load device authentication policies:', error);
				toastV8.error('Failed to load policies');
			} finally {
				setLoading(false);
			}
		};

		loadPolicies();
	}, [environmentId]);

	if (loading) {
		return <div className="text-gray-500">Loading policies...</div>;
	}

	if (policies.length === 0) {
		return <div className="text-gray-500">No policies available</div>;
	}

	return (
		<div className="space-y-2">
			{policies.map((policy) => (
				<label
					key={policy.id}
					className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
				>
					<input
						type="radio"
						name="device-auth-policy"
						value={policy.id}
						checked={selectedPolicyId === policy.id}
						onChange={() => onPolicySelect(policy)}
						className="mr-3"
					/>
					<div>
						<div className="font-medium text-gray-900">{policy.name}</div>
						<div className="text-sm text-gray-500">{policy.description}</div>
					</div>
				</label>
			))}
		</div>
	);
};

const TokenStatusDisplay: React.FC<{ credentials: MFACredentials }> = ({ credentials }) => {
	const hasValidToken = credentials.userToken && credentials.userToken !== 'oauth_completed';

	return (
		<div className="space-y-2">
			<div className="flex items-center">
				<div
					className={`w-3 h-3 rounded-full mr-2 ${hasValidToken ? 'bg-green-500' : 'bg-gray-300'}`}
				/>
				<span className="text-sm font-medium">
					{hasValidToken ? 'Authenticated' : 'Not Authenticated'}
				</span>
			</div>
			{hasValidToken && (
				<div className="text-sm text-gray-600">
					Token Type: {credentials.tokenType === 'user' ? 'User Token' : 'Worker Token'}
				</div>
			)}
		</div>
	);
};
