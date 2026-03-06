// OIDC Device Code Flow implementation following V3 patterns

import { FiCheckCircle, FiClock, FiGlobe, FiRefreshCw, FiSettings, FiShield } from '@icons';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import DevicePolling from '../../components/device/DevicePolling';
import DeviceVerification from '../../components/device/DeviceVerification';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import FlowIntro from '../../components/flow/FlowIntro';
import { FormField, FormInput, FormLabel } from '../../components/steps/CommonSteps';
import { useAuth } from '../../contexts/NewAuthContext';
import type { DeviceCodeFlowState, DeviceCodeStep, DeviceCodeTokens } from '../../types/deviceCode';
import { credentialManager } from '../../utils/credentialManager';
import {
	requestDeviceAuthorization,
	validateDeviceAuthorizationResponse,
} from '../../utils/deviceCode';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { logger } from '../../utils/logger';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const HeroSection = styled.section`
  margin-bottom: 2rem;
  padding: 2.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #38bdf8 100%);
  color: white;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
`;

const CredentialsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const _StatusSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const DeviceCodeFlowOIDC: React.FC = () => {
	const authContext = useAuth();
	const { config } = authContext;

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: 'device-code',
		persistKey: 'device_code_flow_step_manager',
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Flow state
	const [flowState, setFlowState] = useState<DeviceCodeFlowState>({
		config: {
			deviceAuthorizationEndpoint: config?.deviceAuthorizationEndpoint || '',
			tokenEndpoint: config?.tokenEndpoint || '',
			clientId: config?.clientId || '',
			scope: ['openid', 'profile', 'email'],
			environmentId: config?.environmentId || '',
		},
		status: 'idle',
		pollingAttempts: 0,
		pollingDuration: 0,
	});

	const [isRequestingAuthorization, setIsRequestingAuthorization] = useState(false);
	const [isPolling, setIsPolling] = useState(false);

	// Load credentials following proper priority: flow-specific > global > defaults
	useEffect(() => {
		const loadCredentials = () => {
			try {
				// 1. Try device flow-specific credentials first
				const deviceCredentials = credentialManager.loadFlowCredentials('oidc-device-code-v3');

				if (deviceCredentials.environmentId || deviceCredentials.clientId) {
					setFlowState((prev) => ({
						...prev,
						config: {
							...prev.config,
							environmentId: deviceCredentials.environmentId || prev.config.environmentId,
							clientId: deviceCredentials.clientId || prev.config.clientId,
							scope: Array.isArray(deviceCredentials.scopes)
								? deviceCredentials.scopes
								: prev.config.scope,
						},
					}));
					logger.info('DEVICE-CODE-V3', 'Loaded device flow-specific credentials');
				} else {
					// 2. Fall back to global configuration
					const configCredentials = credentialManager.loadConfigCredentials();
					if (configCredentials.environmentId || configCredentials.clientId) {
						setFlowState((prev) => ({
							...prev,
							config: {
								...prev.config,
								environmentId: configCredentials.environmentId || prev.config.environmentId,
								clientId: configCredentials.clientId || prev.config.clientId,
								scope: Array.isArray(configCredentials.scopes)
									? configCredentials.scopes
									: prev.config.scope,
							},
						}));
						logger.info('DEVICE-CODE-V3', 'Loaded global config credentials');
					} else {
						// 3. Fall back to auth context (existing behavior)
						if (config?.environmentId || config?.clientId) {
							setFlowState((prev) => ({
								...prev,
								config: {
									...prev.config,
									environmentId: config?.environmentId || prev.config.environmentId,
									clientId: config?.clientId || prev.config.clientId,
								},
							}));
							logger.info('DEVICE-CODE-V3', 'Loaded from auth context');
						}
					}
				}
			} catch (error) {
				logger.error('DEVICE-CODE-V3', 'Failed to load credentials', error);
			}
		};

		loadCredentials();
	}, [config]);

	// Auto-populate endpoints when environment ID changes
	useEffect(() => {
		if (flowState.config.environmentId && !flowState.config.environmentId.includes('{')) {
			const deviceEndpoint = `https://auth.pingone.com/${flowState.config.environmentId}/as/device`;
			const tokenEndpoint = `https://auth.pingone.com/${flowState.config.environmentId}/as/token`;

			setFlowState((prev) => ({
				...prev,
				config: {
					...prev.config,
					deviceAuthorizationEndpoint: deviceEndpoint,
					tokenEndpoint: tokenEndpoint,
				},
			}));
		}
	}, [flowState.config.environmentId]);

	// Request device authorization
	const requestDeviceAuth = useCallback(async () => {
		logger.info('DeviceCodeFlow', 'Starting device authorization request', {
			endpoint: flowState.config.deviceAuthorizationEndpoint,
			clientId: `${flowState.config.clientId.substring(0, 8)}...`,
			scopes: flowState.config.scope,
		});

		setIsRequestingAuthorization(true);
		v4ToastManager.showWarning('saveConfigurationStart');

		try {
			// Validate required fields
			if (!flowState.config.deviceAuthorizationEndpoint || !flowState.config.clientId) {
				throw new Error('Device authorization endpoint and Client ID are required');
			}

			const response = await requestDeviceAuthorization(
				flowState.config.deviceAuthorizationEndpoint,
				flowState.config.clientId,
				flowState.config.scope
			);

			if (!validateDeviceAuthorizationResponse(response)) {
				throw new Error('Invalid device authorization response received');
			}

			setFlowState((prev) => ({
				...prev,
				deviceCode: response.device_code,
				userCode: response.user_code,
				verificationUri: response.verification_uri,
				verificationUriComplete: response.verification_uri_complete,
				expiresIn: response.expires_in,
				interval: response.interval || 5,
				startTime: Date.now(),
				status: 'verifying',
				error: undefined,
			}));

			v4ToastManager.showWarning(
				'Device code received - please visit the verification URL to complete authentication'
			);

			logger.success('DeviceCodeFlow', 'Device authorization successful', {
				userCode: response.user_code,
				expiresIn: response.expires_in,
				hasCompleteUri: !!response.verification_uri_complete,
			});

			return { success: true };
		} catch (error) {
			logger.error('DeviceCodeFlow', 'Device authorization failed', error);
			v4ToastManager.showError(
				'Device authorization request failed - check your client credentials and try again'
			);
			throw error;
		} finally {
			setIsRequestingAuthorization(false);
		}
	}, [flowState.config]);

	// Handle successful token polling
	const handlePollingSuccess = useCallback(async (tokens: DeviceCodeTokens) => {
		logger.success('DeviceCodeFlow', 'Token polling successful', {
			hasAccessToken: !!tokens.access_token,
			hasIdToken: !!tokens.id_token,
			hasRefreshToken: !!tokens.refresh_token,
		});

		setFlowState((prev) => ({
			...prev,
			tokens,
			status: 'success',
		}));

		// Store tokens
		await storeOAuthTokens(tokens, 'device-code');

		v4ToastManager.showSuccess('Device flow completed successfully - tokens received and stored');
	}, []);

	// Handle polling error
	const handlePollingError = useCallback((error: Error) => {
		logger.error('DeviceCodeFlow', 'Token polling failed', error);
		setFlowState((prev) => ({
			...prev,
			status: 'error',
			error: error.message,
		}));
		v4ToastManager.showError('networkError');
	}, []);

	// Handle polling progress
	const handlePollingProgress = useCallback((attempt: number, status: string) => {
		setFlowState((prev) => ({
			...prev,
			pollingAttempts: attempt,
		}));
		logger.info('DeviceCodeFlow', 'Polling progress', { attempt, status });
	}, []);

	// Start polling
	const startPolling = useCallback(() => {
		if (!flowState.deviceCode || !flowState.config.clientId || !flowState.config.tokenEndpoint) {
			v4ToastManager.showError('Cannot start polling - device code or configuration is missing');
			return;
		}

		setIsPolling(true);
		setFlowState((prev) => ({ ...prev, status: 'polling' }));

		logger.info('DeviceCodeFlow', 'Starting token polling', {
			deviceCode: `${flowState.deviceCode.substring(0, 8)}...`,
			interval: flowState.interval,
		});
	}, [
		flowState.deviceCode,
		flowState.config.clientId,
		flowState.config.tokenEndpoint,
		flowState.interval,
	]);

	// Copy user code
	const handleCopyUserCode = useCallback(() => {
		logger.info('DeviceCodeFlow', 'User code copied');
	}, []);

	// Copy verification URI
	const handleCopyVerificationUri = useCallback(() => {
		logger.info('DeviceCodeFlow', 'Verification URI copied');
	}, []);

	// Reset flow
	const _resetFlow = useCallback(() => {
		setFlowState({
			config: {
				deviceAuthorizationEndpoint: config?.deviceAuthorizationEndpoint || '',
				tokenEndpoint: config?.tokenEndpoint || '',
				clientId: config?.clientId || '',
				scope: ['openid', 'profile', 'email'],
				environmentId: config?.environmentId || '',
			},
			status: 'idle',
			pollingAttempts: 0,
			pollingDuration: 0,
		});
		setIsPolling(false);
		logger.info('DeviceCodeFlow', 'Flow reset');
	}, [config]);

	// Define flow steps
	const steps: DeviceCodeStep[] = [
		{
			id: 'configure',
			title: 'Configure Device Code Flow',
			description: 'Set up your PingOne application credentials for device code flow',
			status: 'pending',
			canExecute: Boolean(
				flowState.config.deviceAuthorizationEndpoint && flowState.config.clientId
			),
			completed: Boolean(flowState.config.deviceAuthorizationEndpoint && flowState.config.clientId),
		},
		{
			id: 'request-authorization',
			title: 'Request Device Authorization',
			description: 'Get user code and verification URL from PingOne',
			status: 'pending',
			canExecute: Boolean(
				flowState.config.deviceAuthorizationEndpoint &&
					flowState.config.clientId &&
					!isRequestingAuthorization
			),
			completed: Boolean(flowState.deviceCode && flowState.userCode),
		},
		{
			id: 'verify-device',
			title: 'Verify Device',
			description: 'Complete device verification using QR code or manual entry',
			status: 'pending',
			canExecute: Boolean(flowState.deviceCode && flowState.userCode),
			completed: Boolean(flowState.status === 'success'),
		},
	];

	// Auto-start polling when verification step is active
	useEffect(() => {
		if (flowState.status === 'verifying' && !isPolling) {
			startPolling();
		}
	}, [flowState.status, isPolling, startPolling]);

	return (
		<Container>
			<HeroSection>
				<FlowIntro
					title="OIDC Device Code Flow"
					description="Authorize devices without browsers or limited input using PingOne's device code OAuth flow."
					introCopy={
						<p>
							The device presents a user code and verification URL. The user switches to a secondary
							device to authorize, while this application polls PingOne until the device is
							approved.
						</p>
					}
					bullets={[
						'Great for TVs, kiosks, IoT hardware, and CLI utilities',
						'No credentials are stored on the constrained device',
						'Polling interval balances user experience and security',
					]}
					warningTitle="Security Considerations"
					warningBody="User codes and device codes expire quickly. Always validate the device status before granting access."
					warningIcon={<FiShield />}
					illustration="/images/flows/device-code.svg"
					illustrationAlt="Device code flow"
				/>
			</HeroSection>

			<EnhancedStepFlowV2
				steps={steps.map((step) => ({
					id: step.id,
					title: step.title,
					description: step.description,
					icon:
						step.id === 'configure' ? (
							<FiSettings />
						) : step.id === 'request-authorization' ? (
							<FiRefreshCw />
						) : (
							<FiCheckCircle />
						),
					category:
						step.id === 'configure'
							? ('preparation' as const)
							: step.id === 'request-authorization'
								? ('token-exchange' as const)
								: ('cleanup' as const),
					content: (
						<div>
							{step.id === 'configure' && (
								<CredentialsSection>
									{/* Main Content Block */}
									<div
										style={{
											backgroundColor: '#f0f9ff',
											border: '1px solid #bae6fd',
											borderRadius: '0.75rem',
											padding: '1.5rem',
											marginBottom: '1.5rem',
										}}
									>
										<h3
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												fontSize: '1.125rem',
												fontWeight: '600',
											}}
										>
											<FiGlobe />
											OIDC Device Code Flow - Step 1
										</h3>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												lineHeight: '1.6',
											}}
										>
											The Device Code Flow is designed for devices with limited input capabilities.
											Users will scan a QR code or enter a user code manually to authorize the
											device on a separate device with full browser capabilities.
										</p>

										{/* Why Device Code Flow Section */}
										<div style={{ marginTop: '1.5rem' }}>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e40af',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												Why Device Code Flow?
											</h4>
											<ul
												style={{
													margin: '0',
													paddingLeft: '1.5rem',
													color: '#1e40af',
													lineHeight: '1.6',
												}}
											>
												<li>
													Perfect for devices with limited input capabilities (smart TVs, IoT
													devices, CLI tools)
												</li>
												<li>
													Eliminates the need to type complex credentials on constrained devices
												</li>
												<li>Uses a separate device (phone, computer) for authentication</li>
												<li>
													Provides secure authorization without storing credentials on the device
												</li>
											</ul>
										</div>

										{/* When to Use Section */}
										<div style={{ marginTop: '1.5rem' }}>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e40af',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												When to Use Device Code Flow?
											</h4>
											<ul
												style={{
													margin: '0',
													paddingLeft: '1.5rem',
													color: '#1e40af',
													lineHeight: '1.6',
												}}
											>
												<li>Smart TVs and streaming devices</li>
												<li>IoT devices and embedded systems</li>
												<li>Command-line tools and scripts</li>
												<li>Kiosks and public terminals</li>
												<li>Gaming consoles and media players</li>
											</ul>
										</div>

										{/* Security Considerations Section */}
										<div style={{ marginTop: '1.5rem' }}>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e40af',
													fontSize: '1rem',
													fontWeight: '600',
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
												}}
											>
												<FiShield />
												Security Considerations
											</h4>
											<ul
												style={{
													margin: '0',
													paddingLeft: '1.5rem',
													color: '#1e40af',
													lineHeight: '1.6',
												}}
											>
												<li>User codes expire after a short time (typically 15 minutes)</li>
												<li>Device codes can only be used once</li>
												<li>Polling interval prevents brute force attacks</li>
												<li>No credentials are stored on the constrained device</li>
												<li>Authorization happens on a trusted device with full browser</li>
											</ul>
										</div>
									</div>

									<FormField>
										<FormLabel>Environment ID *</FormLabel>
										<FormInput
											type="text"
											value={flowState.config.environmentId}
											onChange={(e) =>
												setFlowState((prev) => ({
													...prev,
													config: {
														...prev.config,
														environmentId: e.target.value,
													},
												}))
											}
											placeholder="e.g., 12345678-1234-1234-1234-123456789012"
											required
										/>
									</FormField>

									<FormField>
										<FormLabel>Device Authorization Endpoint *</FormLabel>
										<FormInput
											type="url"
											value={flowState.config.deviceAuthorizationEndpoint}
											onChange={(e) =>
												setFlowState((prev) => ({
													...prev,
													config: {
														...prev.config,
														deviceAuthorizationEndpoint: e.target.value,
													},
												}))
											}
											placeholder="https://auth.pingone.com/{env-id}/as/device"
											required
										/>
									</FormField>

									<FormField>
										<FormLabel>Token Endpoint *</FormLabel>
										<FormInput
											type="url"
											value={flowState.config.tokenEndpoint}
											onChange={(e) =>
												setFlowState((prev) => ({
													...prev,
													config: {
														...prev.config,
														tokenEndpoint: e.target.value,
													},
												}))
											}
											placeholder="https://auth.pingone.com/{env-id}/as/token"
											required
										/>
									</FormField>

									<FormField>
										<FormLabel>Client ID *</FormLabel>
										<FormInput
											type="text"
											value={flowState.config.clientId}
											onChange={(e) =>
												setFlowState((prev) => ({
													...prev,
													config: { ...prev.config, clientId: e.target.value },
												}))
											}
											placeholder="Enter your application Client ID"
											required
										/>
									</FormField>

									<FormField>
										<FormLabel>Scopes</FormLabel>
										<FormInput
											type="text"
											value={flowState.config.scope.join(' ')}
											onChange={(e) =>
												setFlowState((prev) => ({
													...prev,
													config: {
														...prev.config,
														scope: e.target.value.split(' ').filter((s) => s.trim()),
													},
												}))
											}
											placeholder="openid profile email"
										/>
									</FormField>
								</CredentialsSection>
							)}

							{step.id === 'request-authorization' && (
								<div>
									{/* Main Content Block */}
									<div
										style={{
											backgroundColor: '#f0f9ff',
											border: '1px solid #bae6fd',
											borderRadius: '0.75rem',
											padding: '1.5rem',
											marginBottom: '1.5rem',
										}}
									>
										<h3
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												fontSize: '1.125rem',
												fontWeight: '600',
											}}
										>
											<FiRefreshCw />
											OIDC Device Code Flow - Step 2
										</h3>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												lineHeight: '1.6',
											}}
										>
											Request a device authorization from PingOne. This will generate a user code
											and verification URL that the user can use on their phone or computer to
											authorize the device.
										</p>

										{/* What Happens Next Section */}
										<div style={{ marginTop: '1.5rem' }}>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e40af',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												What Happens Next?
											</h4>
											<ul
												style={{
													margin: '0',
													paddingLeft: '1.5rem',
													color: '#1e40af',
													lineHeight: '1.6',
												}}
											>
												<li>PingOne generates a unique user code (e.g., "ABCD-EFGH")</li>
												<li>A QR code is created with the verification URL</li>
												<li>The device polls the token endpoint for authorization</li>
												<li>User scans QR code or visits URL on their phone/computer</li>
												<li>User enters the code and authorizes the device</li>
												<li>Device receives access tokens after successful authorization</li>
											</ul>
										</div>
									</div>

									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '1rem',
											marginBottom: '1rem',
										}}
									>
										<FiClock size={24} color="#6b7280" />
										<div>
											<h3 style={{ margin: 0, color: '#1f2937' }}>
												Ready to Request Authorization
											</h3>
											<p style={{ margin: 0, color: '#6b7280' }}>
												Click the button below to request a user code and verification URL from
												PingOne.
											</p>
										</div>
									</div>
								</div>
							)}

							{step.id === 'verify-device' && flowState.userCode && (
								<div>
									{/* Main Content Block */}
									<div
										style={{
											backgroundColor: '#f0f9ff',
											border: '1px solid #bae6fd',
											borderRadius: '0.75rem',
											padding: '1.5rem',
											marginBottom: '1.5rem',
										}}
									>
										<h3
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												fontSize: '1.125rem',
												fontWeight: '600',
											}}
										>
											<FiCheckCircle />
											OIDC Device Code Flow - Step 3
										</h3>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												lineHeight: '1.6',
											}}
										>
											Complete device verification by having the user scan the QR code or enter the
											user code on their phone or computer. The device will automatically poll for
											tokens once authorization is complete.
										</p>

										{/* User Instructions Section */}
										<div style={{ marginTop: '1.5rem' }}>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e40af',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												User Instructions
											</h4>
											<ul
												style={{
													margin: '0',
													paddingLeft: '1.5rem',
													color: '#1e40af',
													lineHeight: '1.6',
												}}
											>
												<li>Use your phone or computer to scan the QR code below</li>
												<li>Alternatively, visit the verification URL and enter the user code</li>
												<li>Log in with your PingOne credentials</li>
												<li>Grant permission to the application</li>
												<li>The device will automatically receive tokens after authorization</li>
											</ul>
										</div>
									</div>

									<DeviceVerification
										userCode={flowState.userCode}
										verificationUri={flowState.verificationUri ?? ''}
										verificationUriComplete={flowState.verificationUriComplete}
										expiresIn={flowState.expiresIn ?? 0}
										startTime={flowState.startTime ?? Date.now()}
										onCopyUserCode={handleCopyUserCode}
										onCopyVerificationUri={handleCopyVerificationUri}
									/>

									{isPolling && (
										<DevicePolling
											deviceCode={flowState.deviceCode ?? ''}
											clientId={flowState.config.clientId}
											tokenEndpoint={flowState.config.tokenEndpoint}
											interval={(flowState.interval || 5) * 1000}
											onSuccess={handlePollingSuccess}
											onError={handlePollingError}
											onProgress={handlePollingProgress}
										/>
									)}
								</div>
							)}
						</div>
					),
					execute:
						step.id === 'configure'
							? () => Promise.resolve({ success: true })
							: step.id === 'request-authorization'
								? requestDeviceAuth
								: () => Promise.resolve({ success: true }),
					canExecute: step.canExecute,
					completed: step.completed,
				}))}
				stepManager={stepManager}
				onStepComplete={() => {}}
			/>
		</Container>
	);
};

export default DeviceCodeFlowOIDC;
