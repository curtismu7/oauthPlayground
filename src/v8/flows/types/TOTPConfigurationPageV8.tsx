/**
 * @file TOTPConfigurationPageV8.tsx
 * @module v8/flows/types
 * @description TOTP Configuration and Education Page
 * @version 8.1.0
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
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';
import { UserLoginSectionV8 } from '@/v8/components/UserLoginSectionV8';
import type { DeviceAuthenticationPolicy, MFACredentials } from '../shared/MFATypes';

const _MODULE_TAG = '[⏱️ TOTP-CONFIG-V8]';

export const TOTPConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Get auth context to check for user tokens from Authorization Code Flow
	const authContext = useAuth();

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

		return {
			environmentId: stored.environmentId || '',
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

	// Token and modal state
	const [tokenStatus, setTokenStatus] = useState(
		WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()
	);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showUserLoginModal, setShowUserLoginModal] = useState(false);

	// Worker token settings - Load from config service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd || true;
		} catch {
			return true;
		}
	});
	const [showSettingsModal, setShowSettingsModal] = useState(false);

	// Registration flow type state
	const [registrationFlowType, setRegistrationFlowType] = useState<'admin' | 'user'>('user');
	const [adminDeviceStatus, setAdminDeviceStatus] = useState<'ACTIVE' | 'ACTIVATION_REQUIRED'>(
		'ACTIVE'
	);

	// Ref to prevent infinite loops in bidirectional sync
	const isSyncingRef = React.useRef(false);

	// Policy state
	const [deviceAuthPolicies, _setDeviceAuthPolicies] = useState([]);
	const [isLoadingPolicies, _setIsLoadingPolicies] = useState(false);
	const [policiesError, _setPoliciesError] = useState<string | null>(null);

	// API display visibility
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);

	const fetchDeviceAuthPolicies = useCallback(async () => {
		// This function is now passed to MFAConfigurationStepV8
		// The actual logic for fetching policies is in mfaServiceV8
	}, []);

	useEffect(() => {
		const checkToken = () => {
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());
		};
		const interval = setInterval(checkToken, 30000);
		checkToken();
		return () => clearInterval(interval);
	}, []);

	const handleUserTokenReceived = useCallback((token: string) => {
		setCredentials((prev) => ({ ...prev, userToken: token, tokenType: 'user' }));
		setShowUserLoginModal(false);
		toastV8.success('User token received and set!');
	}, []);

	// Auto-populate user token from auth context if available
	const hasAutoPopulatedRef = React.useRef(false);
	React.useEffect(() => {
		const authToken = authContext.tokens?.access_token;
		const isAuthenticated = authContext.isAuthenticated;

		if (isAuthenticated && authToken && !hasAutoPopulatedRef.current && !credentials.userToken) {
			hasAutoPopulatedRef.current = true;
			setCredentials((prev) => ({
				...prev,
				userToken: authToken,
				tokenType: 'user' as const,
			}));
			toastV8.success('User token automatically loaded from your recent login!');
		}

		if (!isAuthenticated || !authToken || (!credentials.userToken && hasAutoPopulatedRef.current)) {
			hasAutoPopulatedRef.current = false;
		}
	}, [authContext.tokens?.access_token, authContext.isAuthenticated, credentials.userToken]);

	// Process callback code directly if modal isn't open (fallback processing)
	const isProcessingCallbackRef = React.useRef(false);
	useEffect(() => {
		const code = searchParams.get('code');
		const error = searchParams.get('error');
		const state = searchParams.get('state');
		const hasUserLoginState = sessionStorage.getItem('user_login_state_v8');

		if (!hasUserLoginState) return;
		if (showUserLoginModal) return;
		if (isProcessingCallbackRef.current) return;

		const processCallback = async () => {
			if (error) {
				const errorDescription = searchParams.get('error_description') || '';
				toastV8.error(`Login failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
				sessionStorage.removeItem('user_login_state_v8');
				sessionStorage.removeItem('user_login_code_verifier_v8');
				sessionStorage.removeItem('user_login_credentials_temp_v8');
				sessionStorage.removeItem('user_login_redirect_uri_v8');
				window.history.replaceState({}, document.title, window.location.pathname);
				return;
			}

			if (code && state) {
				if (state !== hasUserLoginState) {
					console.warn(`[⏱️ TOTP-CONFIG-V8] State mismatch - possible CSRF attack`);
					toastV8.error('Security validation failed. Please try again.');
					window.history.replaceState({}, document.title, window.location.pathname);
					return;
				}

				isProcessingCallbackRef.current = true;

				try {
					const storedCodeVerifier = sessionStorage.getItem('user_login_code_verifier_v8');
					const storedCredentials = sessionStorage.getItem('user_login_credentials_temp_v8');

					if (!storedCodeVerifier || !storedCredentials) {
						toastV8.error('Missing PKCE verifier or credentials. Please try logging in again.');
						sessionStorage.removeItem('user_login_state_v8');
						sessionStorage.removeItem('user_login_code_verifier_v8');
						sessionStorage.removeItem('user_login_credentials_temp_v8');
						sessionStorage.removeItem('user_login_redirect_uri_v8');
						window.history.replaceState({}, document.title, window.location.pathname);
						return;
					}

					const credentials = JSON.parse(storedCredentials);

					// Fetch app config from PingOne to ensure correct token endpoint auth method
					let effectiveCredentials = credentials;
					if (credentials.clientId && credentials.environmentId) {
						try {
							const { workerTokenServiceV8 } = await import('@/v8/services/workerTokenServiceV8');
							const { ConfigCheckerServiceV8 } = await import(
								'@/v8/services/configCheckerServiceV8'
							);
							const workerToken = await workerTokenServiceV8.getToken();

							if (workerToken) {
								console.log(
									`[⏱️ TOTP-CONFIG-V8] 🔍 Fetching app config to ensure correct auth method...`
								);
								const appConfig = await ConfigCheckerServiceV8.fetchAppConfig(
									credentials.environmentId,
									credentials.clientId,
									workerToken
								);

								if (appConfig?.tokenEndpointAuthMethod) {
									const pingOneAuthMethod = appConfig.tokenEndpointAuthMethod;
									const currentAuthMethod =
										credentials.clientAuthMethod ||
										credentials.tokenEndpointAuthMethod ||
										'client_secret_post';

									if (currentAuthMethod !== pingOneAuthMethod) {
										console.log(`[⏱️ TOTP-CONFIG-V8] ✅ Updating clientAuthMethod from PingOne:`, {
											from: currentAuthMethod,
											to: pingOneAuthMethod,
										});
										effectiveCredentials = {
											...credentials,
											clientAuthMethod: pingOneAuthMethod as
												| 'client_secret_basic'
												| 'client_secret_post'
												| 'client_secret_jwt'
												| 'private_key_jwt'
												| 'none',
										};
									}
								}
							}
						} catch (configError) {
							console.warn(
								`[⏱️ TOTP-CONFIG-V8] ⚠️ Failed to fetch app config (continuing with stored auth method):`,
								configError
							);
							// Continue with stored credentials - don't fail token exchange
						}
					}

					const _tokenResponse = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
						{
							environmentId: effectiveCredentials.environmentId,
							clientId: effectiveCredentials.clientId,
							clientSecret: effectiveCredentials.clientSecret,
							redirectUri: effectiveCredentials.redirectUri,
							scopes: effectiveCredentials.scopes,
							clientAuthMethod:
								effectiveCredentials.clientAuthMethod ||
								effectiveCredentials.tokenEndpointAuthMethod ||
								'client_secret_post',
						},
						code,
						storedCodeVerifier
					);

					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
					window.history.replaceState({}, document.title, window.location.pathname);

					console.log(`[⏱️ TOTP-CONFIG-V8] ✅ OAuth token exchange successful`);
					setCredentials((prev) => ({
						...prev,
						userToken: 'oauth_completed',
						tokenType: 'user' as const,
					}));

					toastV8.success('Authentication successful! You can now proceed.');
				} catch (error) {
					console.error(`[⏱️ TOTP-CONFIG-V8] Failed to exchange code for tokens`, error);
					const errorMessage =
						error instanceof Error
							? error.message
							: 'Failed to exchange authorization code for tokens';
					if (errorMessage.includes('invalid_grant') || errorMessage.includes('expired')) {
						toastV8.error(
							'Authorization code expired or already used. Please try logging in again.'
						);
					} else {
						toastV8.error(errorMessage);
					}

					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
				} finally {
					isProcessingCallbackRef.current = false;
				}
			}
		};

		if (code || error) {
			processCallback();
		}
	}, [searchParams, showUserLoginModal]);

	// Bidirectional sync between Registration Flow Type and tokenType dropdown
	React.useEffect(() => {
		if (isSyncingRef.current) return;

		if (registrationFlowType === 'user' && credentials.tokenType !== 'user') {
			isSyncingRef.current = true;
			setCredentials((prev) => ({
				...prev,
				tokenType: 'user' as const,
				userToken: prev.userToken || '',
			}));
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		} else if (registrationFlowType === 'admin' && credentials.tokenType !== 'worker') {
			isSyncingRef.current = true;
			setCredentials((prev) => ({
				...prev,
				tokenType: 'worker',
				userToken: '',
			}));
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [registrationFlowType, credentials.tokenType]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	React.useEffect(() => {
		if (isSyncingRef.current) return;

		if (credentials.tokenType === 'user' && registrationFlowType !== 'user') {
			isSyncingRef.current = true;
			setRegistrationFlowType('user');
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		} else if (credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			isSyncingRef.current = true;
			setRegistrationFlowType('admin');
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [credentials.tokenType, registrationFlowType]);

	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	const handleProceedToRegistration = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			e.stopPropagation();

			const tokenType = credentials.tokenType || 'worker';
			const isTokenValid =
				tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();

			if (
				!credentials.environmentId?.trim() ||
				!credentials.username?.trim() ||
				!credentials.deviceAuthenticationPolicyId?.trim() ||
				!isTokenValid
			) {
				toastV8.warning(
					'Please fill in all required configuration fields and ensure a valid token is provided.'
				);
				return;
			}

			navigate('/v8/mfa/register/totp/device', {
				replace: false,
				state: {
					deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
					environmentId: credentials.environmentId,
					username: credentials.username,
					tokenType: credentials.tokenType,
					userToken: credentials.userToken,
					registrationFlowType: registrationFlowType,
					adminDeviceStatus: adminDeviceStatus,
					configured: true, // Flag to indicate configuration is complete
				},
			});
		},
		[navigate, credentials, tokenStatus.isValid, registrationFlowType, adminDeviceStatus]
	);

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			<MFANavigationV8 currentPage="registration" showBackToMain={true} />

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			<div
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: '32px 20px',
					paddingBottom: isApiDisplayVisible ? '450px' : '32px',
					transition: 'padding-bottom 0.3s ease',
				}}
			>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
						borderRadius: '12px',
						padding: '32px',
						marginBottom: '32px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
						<FiClock size={32} color="white" />
						<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>
							TOTP Configuration
						</h1>
					</div>
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Configure TOTP device registration, learn about authenticator apps, and prepare for
						device setup
					</p>
				</div>

				{/* Registration Flow Type Selection - TOTP specific */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are inside */}
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '16px',
						}}
					>
						Registration Flow Type <span style={{ color: '#dc2626' }}>*</span>
					</label>
					<div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
						<label
							style={{
								flex: 1,
								padding: '16px',
								border: `2px solid ${registrationFlowType === 'admin' ? '#3b82f6' : '#d1d5db'}`,
								borderRadius: '8px',
								background: registrationFlowType === 'admin' ? '#eff6ff' : 'white',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setRegistrationFlowType('admin')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="admin"
									checked={registrationFlowType === 'admin'}
									onChange={() => setRegistrationFlowType('admin')}
									style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
								/>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
										Admin Flow
									</span>
									<div
										style={{
											fontSize: '12px',
											color: '#6b7280',
											marginTop: '2px',
											fontStyle: 'italic',
										}}
									>
										Using worker token
									</div>
								</div>
							</div>
							{/* Device status options for Admin Flow */}
							<div
								style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}
							>
								<div
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '8px',
									}}
								>
									Device Status:
								</div>
								<div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '8px 12px',
											border: `1px solid ${adminDeviceStatus === 'ACTIVE' ? '#10b981' : '#d1d5db'}`,
											borderRadius: '6px',
											background: adminDeviceStatus === 'ACTIVE' ? '#f0fdf4' : 'white',
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
											transition: 'all 0.2s ease',
											opacity: registrationFlowType === 'admin' ? 1 : 0.7,
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus('ACTIVE');
											}
										}}
									>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVE"
											checked={adminDeviceStatus === 'ACTIVE'}
											onChange={() => {
												if (registrationFlowType === 'admin') {
													setAdminDeviceStatus('ACTIVE');
												}
											}}
											onClick={(e) => e.stopPropagation()}
											disabled={registrationFlowType !== 'admin'}
											style={{
												margin: 0,
												cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
												width: '16px',
												height: '16px',
											}}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>
											<strong>ACTIVE</strong> - Device created as ready to use, no activation needed
										</span>
									</label>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '8px 12px',
											border: `1px solid ${adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#f59e0b' : '#d1d5db'}`,
											borderRadius: '6px',
											background: adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#fffbeb' : 'white',
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
											transition: 'all 0.2s ease',
											opacity: registrationFlowType === 'admin' ? 1 : 0.7,
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus('ACTIVATION_REQUIRED');
											}
										}}
									>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVATION_REQUIRED"
											checked={adminDeviceStatus === 'ACTIVATION_REQUIRED'}
											onChange={() => {
												if (registrationFlowType === 'admin') {
													setAdminDeviceStatus('ACTIVATION_REQUIRED');
												}
											}}
											onClick={(e) => e.stopPropagation()}
											disabled={registrationFlowType !== 'admin'}
											style={{
												margin: 0,
												cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
												width: '16px',
												height: '16px',
											}}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>
											<strong>ACTIVATION_REQUIRED</strong> - OTP will be sent for device activation
										</span>
									</label>
								</div>
							</div>
						</label>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
						<label
							style={{
								flex: 1,
								padding: '16px',
								border: `2px solid ${registrationFlowType === 'user' ? '#3b82f6' : '#d1d5db'}`,
								borderRadius: '8px',
								background: registrationFlowType === 'user' ? '#eff6ff' : 'white',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setRegistrationFlowType('user')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="user"
									checked={registrationFlowType === 'user'}
									onChange={() => setRegistrationFlowType('user')}
									style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
								/>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
										User Flow
									</span>
									<div
										style={{
											fontSize: '12px',
											color: '#6b7280',
											marginTop: '2px',
											fontStyle: 'italic',
										}}
									>
										Using access token from User Authentication
									</div>
								</div>
							</div>
							<div
								style={{
									fontSize: '13px',
									color: '#6b7280',
									marginLeft: '28px',
									lineHeight: '1.5',
									padding: '8px 12px',
									background: '#f9fafb',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP will be sent
								for device activation
							</div>
						</label>
					</div>
					<small
						style={{
							display: 'block',
							marginTop: '12px',
							fontSize: '12px',
							color: '#6b7280',
							lineHeight: '1.5',
						}}
					>
						Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow
						always requires activation.
					</small>
				</div>

	
				{/* Device Authentication Policy Configuration */}
				<MFAConfigurationStepV8
					credentials={credentials}
					setCredentials={setCredentials}
					tokenStatus={tokenStatus}
					deviceType="TOTP"
					deviceTypeLabel="TOTP"
					policyDescription="Determines which PingOne policy governs TOTP challenges."
					fetchDeviceAuthPolicies={fetchDeviceAuthPolicies}
				/>

	
				{/* Clean Worker Token Section - Always show */}
				<WorkerTokenSectionV8
					environmentId={credentials.environmentId}
					onTokenUpdated={(token) => {
						// Update credentials when worker token is generated
						setCredentials(prev => ({
							...prev,
							workerToken: token,
							tokenType: 'worker' as const,
						}));
					}}
					compact={false}
					showSettings={true}
					silentApiRetrieval={silentApiRetrieval}
					onSilentApiRetrievalChange={setSilentApiRetrieval}
					showTokenAtEnd={showTokenAtEnd}
					onShowTokenAtEndChange={setShowTokenAtEnd}
				/>

				{/* Clean User Login Section - Only show for user flow */}
				{registrationFlowType === 'user' && (
					<UserLoginSectionV8
						onTokenUpdated={(token) => {
							// Update credentials when user token is received
							setCredentials(prev => ({
								...prev,
								userToken: token,
								tokenType: 'user' as const,
							}));
						}}
						compact={false}
						showUserInfo={true}
					/>
				)}

				{/* Education Section */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
						<FiBook size={24} color="#3b82f6" />
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
							About OATH TOTP (RFC 6238)
						</h2>
					</div>
					<div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>OATH TOTP (Time-based One-Time Password, RFC 6238)</strong> is an open
							standard for generating time-based authentication codes using authenticator apps like
							Google Authenticator, Authy, or Microsoft Authenticator.
						</p>
						<ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
							<li>
								<strong>Phishing-resistant:</strong> Codes are generated locally on your device,
								making them immune to SMS interception attacks
							</li>
							<li>
								<strong>Offline-capable:</strong> Doesn't rely on network connectivity - codes are
								generated using time-based algorithms
							</li>
							<li>
								<strong>Time-based:</strong> Each 6-digit code is valid for 30 seconds,
								automatically rotating for enhanced security
							</li>
							<li>
								<strong>Industry standard:</strong> Based on RFC 6238, ensuring compatibility across
								different authenticator apps
							</li>
							<li>
								<strong>Secure storage:</strong> Secret keys are stored securely in your
								authenticator app and never transmitted
							</li>
							<li>
								<strong>Easy setup:</strong> Simple QR code scan or manual secret key entry to get
								started
							</li>
						</ul>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>How it works:</strong> After registering your TOTP device, you'll receive a QR
							code containing your secret key. Scan this QR code with an authenticator app to set up
							OATH TOTP (RFC 6238). The app will then generate time-based codes that you enter when
							authenticating.
						</p>
						<p
							style={{
								margin: 0,
								padding: '12px',
								background: '#f0f9ff',
								borderRadius: '6px',
								border: '1px solid #bfdbfe',
							}}
						>
							<strong>📚 Learn more:</strong> OATH TOTP (RFC 6238) is part of the Initiative for
							Open Authentication (OATH) framework, providing a standardized approach to two-factor
							authentication. The standard ensures codes are generated using HMAC-SHA1 algorithm
							with time-based intervals, making it highly secure and widely compatible.
						</p>
					</div>
				</div>

				{/* Navigation Button - Only show Cancel, navigation happens via flow */}
				<div
					style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}
				>
					<button
						type="button"
						onClick={() => navigateToMfaHubWithCleanup(navigate)}
						style={{
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							background: 'white',
							color: '#374151',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					{/* Debug: Add button enabling debug */}
					{(() => {
						const hasDeviceAuthPolicy = !!credentials.deviceAuthenticationPolicyId;
						const hasEnvironmentId = !!credentials.environmentId;
						const isWorkerTokenType = (credentials.tokenType || 'worker') === 'worker';
						const hasValidWorkerToken = tokenStatus.isValid;
						const hasValidUserToken = !!credentials.userToken?.trim();
						const isDisabled = !hasDeviceAuthPolicy || !hasEnvironmentId || (isWorkerTokenType ? !hasValidWorkerToken : !hasValidUserToken);
						
						console.log('[TOTP] BUTTON DEBUG:', {
							'Raw Values': {
								deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
								environmentId: credentials.environmentId,
								tokenType: credentials.tokenType || 'worker',
								tokenStatus: tokenStatus,
								userToken: credentials.userToken
							},
							'Boolean Checks': {
								hasDeviceAuthPolicy,
								hasEnvironmentId,
								isWorkerTokenType,
								hasValidWorkerToken,
								hasValidUserToken
							},
							'Final Result': {
								isDisabled,
								disabledReason: !hasDeviceAuthPolicy ? 'Missing device auth policy' :
												!hasEnvironmentId ? 'Missing environment ID' :
												isWorkerTokenType && !hasValidWorkerToken ? 'Invalid worker token' :
												!isWorkerTokenType && !hasValidUserToken ? 'Invalid user token' :
												'Unknown reason'
							}
						});
						
						return null;
					})()}
					
					<button
						type="button"
						onClick={handleProceedToRegistration}
						disabled={
							!credentials.deviceAuthenticationPolicyId ||
							!credentials.environmentId ||
							((credentials.tokenType || 'worker') === 'worker'
								? !tokenStatus.isValid
								: !credentials.userToken?.trim())
						}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								credentials.deviceAuthenticationPolicyId &&
								credentials.environmentId &&
								((credentials.tokenType || 'worker') === 'worker'
									? tokenStatus.isValid
									: !!credentials.userToken?.trim())
									? '#8b5cf6'
									: '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								credentials.deviceAuthenticationPolicyId &&
								credentials.environmentId &&
								((credentials.tokenType || 'worker') === 'worker'
									? tokenStatus.isValid
									: !!credentials.userToken?.trim())
									? 'pointer'
									: 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						Proceed to TOTP Registration
						<FiArrowRight size={18} />
					</button>
				</div>

			{/* Modals */}
			{showWorkerTokenModal &&
				(() => {
					// Check if we should show token only (matches MFA pattern)
					try {
						const {
							MFAConfigurationServiceV8,
						} = require('@/v8/services/mfaConfigurationServiceV8');
						const config = MFAConfigurationServiceV8.loadConfiguration();
						const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();

						// Show token-only if showTokenAtEnd is ON and token is valid
						const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;

						return (
							<WorkerTokenModalV8
								isOpen={showWorkerTokenModal}
								onClose={() => {
									setShowWorkerTokenModal(false);
									setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());
								}}
								showTokenOnly={showTokenOnly}
							/>
						);
					} catch {
						return (
							<WorkerTokenModalV8
								isOpen={showWorkerTokenModal}
								onClose={() => {
									setShowWorkerTokenModal(false);
									setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());
								}}
							/>
						);
					}
				})()}
			{showUserLoginModal && (
				<UserLoginModalV8
					isOpen={showUserLoginModal}
					onClose={() => setShowUserLoginModal(false)}
					onTokenReceived={handleUserTokenReceived}
					environmentId={credentials.environmentId}
				/>
			)}
		</div>
		</div>
	);
};
