/**
 * @file CIBAFlowV9.tsx
 * @module pages/flows
 * @description CIBA (Client Initiated Backchannel Authentication) Flow V9 - OpenID Connect Core 1.0 Compliant
 * @version 9.0.0
 * @since 2026-02-17
 *
 * V9 CIBA flow implementation with full OpenID Connect Core 1.0 compliance:
 * - Enhanced CIBA service with proper grant type and parameters
 * - Complete login hint support (login_hint, id_token_hint, login_hint_token)
 * - Token delivery modes (poll, ping, push) with discovery metadata
 * - Signed authentication requests (JWS) support
 * - Comprehensive error handling per specification
 * - Modern V9 UI with enhanced user experience
 *
 * Features:
 * - Real-time polling with intelligent retry
 * - Discovery metadata integration
 * - Multiple authentication methods
 * - Educational content and examples
 * - Professional UI with V9 styling
 *
 * @example
 * <CIBAFlowV9 />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiCopy, FiX } from '@icons';
import styled from 'styled-components';

import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { Button } from '@/components/ui/button';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { v4ToastManager } from '@/utils/v4ToastMessages';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';
import {
	type CibaCredentials,
	type CibaDiscoveryMetadata,
	CibaServiceV8Enhanced,
} from '@/v8/services/cibaServiceV8Enhanced';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

const MODULE_TAG = '[🔐 CIBA-FLOW-V9]';
const FLOW_KEY = 'ciba-v9';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	color: #6b7280;
	font-size: 1.125rem;
	margin-bottom: 1rem;
`;

const VersionBadge = styled.span`
	background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-left: 0.5rem;
`;

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #374151;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 1rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 1rem;
	font-family: monospace;
	resize: vertical;
	min-height: 100px;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
`;

const StatusCard = styled.div<{ status: string }>`
	background: ${(props) => {
		switch (props.status) {
			case 'pending':
				return '#fef3c7';
			case 'approved':
				return '#d1fae5';
			case 'denied':
				return '#fee2e2';
			case 'expired':
				return '#f3f4f6';
			case 'error':
				return '#fee2e2';
			default:
				return '#f9fafb';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.status) {
			case 'pending':
				return '#f59e0b';
			case 'approved':
				return '#10b981';
			case 'denied':
				return '#ef4444';
			case 'expired':
				return '#d1d5db';
			case 'error':
				return '#ef4444';
			default:
				return '#e5e7eb';
		}
	}};
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const StatusTitle = styled.h4`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #1f2937;
`;

const StatusText = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
`;

const TokenDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	padding: 1rem;
	margin-top: 1rem;
`;

const TokenTitle = styled.h5`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #1f2937;
`;

const TokenContent = styled.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 4px;
	overflow-x: auto;
	font-size: 0.875rem;
`;

const CopyButton = styled.button`
	background: #3b82f6;
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	font-size: 0.875rem;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: #2563eb;
	}
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CIBAFlowV9: React.FC = () => {
	const cibaFlow = useCibaFlowV8Enhanced();
	const { globalTokenStatus, getWorkerToken } = useGlobalWorkerToken();

	// Form state
	const [credentials, setCredentials] = useState<CibaCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scope: 'openid profile email',
		loginHint: '',
		tokenDeliveryMode: 'poll',
		clientAuthMethod: 'client_secret_basic',
		bindingMessage: '',
		userCode: '',
		requestContext: '',
		clientNotificationEndpoint: '',
	});

	// UI state
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [copiedToken, setCopiedToken] = useState(false);
	const [discoveryRetryCount, setDiscoveryRetryCount] = useState(0);
	const [lastDiscoveryAttempt, setLastDiscoveryAttempt] = useState(0);
	const [discoveryCache, setDiscoveryCache] = useState<
		Map<string, { metadata: CibaDiscoveryMetadata; timestamp: number }>
	>(new Map());
	const discoveryRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Load saved credentials on mount
	useEffect(() => {
		const saved = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: true,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: true,
		});

		if (saved) {
			setCredentials((prev) => ({
				...prev,
				environmentId: saved.environmentId || '',
				clientId: saved.clientId || '',
				clientSecret: saved.clientSecret || '',
				scope: saved.scope || 'openid profile email',
			}));
		}
	}, []);

	// Load discovery metadata when environment changes (with rate limiting and caching)
	const loadDiscoveryMetadataWithRetry = useCallback(
		async (envId: string) => {
			if (!envId) return;

			// Check cache first (cache for 5 minutes)
			const cached = discoveryCache.get(envId);
			if (cached && Date.now() - cached.timestamp < 300000) {
				console.log(`${MODULE_TAG} Using cached discovery metadata for ${envId}`);
				return;
			}

			const now = Date.now();
			const timeSinceLastAttempt = now - lastDiscoveryAttempt;

			// Rate limiting: wait at least 5 seconds between attempts
			if (timeSinceLastAttempt < 5000) {
				console.warn(`${MODULE_TAG} Rate limiting discovery metadata attempts`);
				return;
			}

			// Don't attempt if we recently got a 429
			if (discoveryRetryCount >= 3 && timeSinceLastAttempt < 30000) {
				console.warn(`${MODULE_TAG} Too many failed attempts, waiting`);
				return;
			}

			setLastDiscoveryAttempt(now);

			try {
				await cibaFlow.loadDiscoveryMetadata(envId);
				setDiscoveryRetryCount(0); // Reset on success

				// Cache successful result
				setDiscoveryCache(
					(prev) =>
						new Map(
							prev.set(envId, {
								metadata: cibaFlow.discoveryMetadata,
								timestamp: Date.now(),
							})
						)
				);
			} catch (error) {
				setDiscoveryRetryCount((prev) => prev + 1);
				// Don't show toast for 429 errors, just log
				if (error instanceof Error && error.message?.includes('429')) {
					console.warn(`${MODULE_TAG} Got 429 error, will retry later`);
				} else if (
					error instanceof Error &&
					error.message?.includes('ERR_INSUFFICIENT_RESOURCES')
				) {
					console.warn(`${MODULE_TAG} Browser resource exhaustion detected, waiting before retry`);
					// Wait longer for resource exhaustion errors - use ref to manage timeout
					discoveryRetryTimeoutRef.current = setTimeout(() => {
						setDiscoveryRetryCount(0); // Reset retry count after waiting
						discoveryRetryTimeoutRef.current = null;
					}, 60000);
				} else {
					// Show toast for other errors
					console.error(`${MODULE_TAG} Failed to load discovery metadata:`, error);
				}
			}
		},
		[cibaFlow, lastDiscoveryAttempt, discoveryRetryCount, discoveryCache]
	);

	useEffect(() => {
		return () => {
			if (discoveryRetryTimeoutRef.current) {
				clearTimeout(discoveryRetryTimeoutRef.current);
				discoveryRetryTimeoutRef.current = null;
			}
		};
	}, []);

	// Save credentials when they change
	useEffect(() => {
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: true,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: true,
		});
	}, [credentials]);

	useEffect(() => {
		if (credentials.environmentId) {
			loadDiscoveryMetadataWithRetry(credentials.environmentId);
		}
	}, [credentials.environmentId, loadDiscoveryMetadataWithRetry]);

	// Handle form changes
	const handleInputChange = (field: keyof CibaCredentials, value: string) => {
		setCredentials((prev) => ({ ...prev, [field]: value }));
	};

	// Generate login hint token
	const generateLoginHintToken = async () => {
		try {
			const response = await fetch('/api/generate-login-hint-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					clientId: credentials.clientId,
					environmentId: credentials.environmentId,
					loginHint: credentials.loginHint,
				}),
			});

			if (!response.ok) {
				const error: { error_description?: string } = await response.json();
				throw new Error(error.error_description || 'Failed to generate login hint token');
			}

			const data = await response.json();
			setCredentials((prev) => ({
				...prev,
				loginHintToken: data.login_hint_token,
			}));

			console.log(`${MODULE_TAG} Generated login hint token successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to generate login hint token:`, error);
			// Show error to user
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			v4ToastManager.showError(`Failed to generate login hint token: ${errorMessage}`);
		}
	};

	// Handle authentication initiation
	const handleInitiateAuth = async () => {
		try {
			// Validate credentials
			const validation = CibaServiceV8Enhanced.validateCredentials(credentials);
			if (!validation.valid) {
				v4ToastManager.showError(`Invalid credentials: ${validation.errors.join(', ')}`);
				return;
			}

			await cibaFlow.initiateAuthentication(credentials);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initiate authentication:`, error);
		}
	};

	// Handle token polling
	const handlePollForTokens = async () => {
		if (!cibaFlow.authRequest) return;

		try {
			const result = await cibaFlow.pollForTokensWithRetry(
				cibaFlow.authRequest.auth_req_id,
				credentials
			);

			if (result.status === 'approved' && result.tokens) {
				v4ToastManager.showSuccess('CIBA authentication completed successfully!');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to poll for tokens:`, error);
		}
	};

	// Copy token to clipboard
	const copyToken = async (token: string) => {
		try {
			await navigator.clipboard.writeText(token);
			setCopiedToken(true);
			v4ToastManager.showSuccess('Token copied to clipboard');
			setTimeout(() => setCopiedToken(false), 2000);
		} catch {
			v4ToastManager.showError('Failed to copy token');
		}
	};

	// Reset flow
	const handleReset = () => {
		cibaFlow.reset();
		setCredentials({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			scope: 'openid profile email',
			loginHint: '',
			tokenDeliveryMode: 'poll',
			clientAuthMethod: 'client_secret_basic',
			bindingMessage: '',
			userCode: '',
			requestContext: '',
			clientNotificationEndpoint: '',
		});
	};

	// V8 Handler functions
	const handleGetWorkerToken = async () => {
		try {
			await getWorkerToken();
			v4ToastManager.showSuccess('Worker token retrieved successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get worker token:`, error);
			v4ToastManager.showError('Failed to retrieve worker token');
		}
	};

	return (
		<Container>
			<Header>
				<Title>
					CIBA Flow
					<VersionBadge>V9</VersionBadge>
				</Title>
				<Subtitle>
					Client-Initiated Backchannel Authentication - OpenID Connect Core 1.0 Compliant
				</Subtitle>
			</Header>

			{/* V8 Header and Worker Token Section */}
			<MFAHeaderV8 />
			<WorkerTokenStatusDisplayV8
				workerTokenStatus={globalTokenStatus}
				onGetWorkerToken={handleGetWorkerToken}
			/>

			{/* Configuration Card */}
			<Card>
				<CardTitle>🔐 CIBA Configuration</CardTitle>

				{/* Basic Configuration */}
				<FormGroup>
					<Label htmlFor="environmentId">Environment ID *</Label>
					<Input
						id="environmentId"
						value={credentials.environmentId}
						onChange={(e) => handleInputChange('environmentId', e.target.value)}
						placeholder="PingOne Environment ID"
					/>
				</FormGroup>

				<FormGroup>
					<Label htmlFor="clientId">Client ID *</Label>
					<Input
						id="clientId"
						value={credentials.clientId}
						onChange={(e) => handleInputChange('clientId', e.target.value)}
						placeholder="OAuth Client ID"
					/>
				</FormGroup>

				<FormGroup>
					<Label htmlFor="clientSecret">Client Secret *</Label>
					<Input
						id="clientSecret"
						type="password"
						value={credentials.clientSecret}
						onChange={(e) => handleInputChange('clientSecret', e.target.value)}
						placeholder="OAuth Client Secret"
					/>
				</FormGroup>

				<FormGroup>
					<Label htmlFor="scope">Scope *</Label>
					<Input
						id="scope"
						value={credentials.scope}
						onChange={(e) => handleInputChange('scope', e.target.value)}
						placeholder="openid profile email"
					/>
				</FormGroup>

				{/* Login Hint - Exactly one required */}
				<FormGroup>
					<Label>Login Hint (Exactly one required) *</Label>
					<Select
						value={
							credentials.loginHint
								? 'login_hint'
								: credentials.idTokenHint
									? 'id_token_hint'
									: credentials.loginHintToken
										? 'login_hint_token'
										: ''
						}
						onChange={(e) => {
							const selectedType = e.target.value;
							// Clear all login hints first, then set the selected one
							setCredentials((prev) => ({
								...prev,
								loginHint: selectedType === 'login_hint' ? prev.loginHint || '' : '',
								idTokenHint: selectedType === 'id_token_hint' ? prev.idTokenHint || '' : '',
								loginHintToken:
									selectedType === 'login_hint_token' ? prev.loginHintToken || '' : '',
							}));
						}}
					>
						<option value="">Select login hint type...</option>
						<option value="login_hint">Login Hint (email/phone/username)</option>
						<option value="id_token_hint">ID Token Hint</option>
						<option value="login_hint_token">Login Hint Token (JWT)</option>
					</Select>
				</FormGroup>

				{credentials.loginHint !== '' && (
					<FormGroup>
						<Label htmlFor="loginHint">Login Hint *</Label>
						<Input
							id="loginHint"
							value={credentials.loginHint}
							onChange={(e) => handleInputChange('loginHint', e.target.value)}
							placeholder="user@example.com or +1234567890"
						/>
					</FormGroup>
				)}

				{credentials.idTokenHint !== '' && (
					<FormGroup>
						<Label htmlFor="idTokenHint">ID Token Hint *</Label>
						<TextArea
							id="idTokenHint"
							value={credentials.idTokenHint}
							onChange={(e) => handleInputChange('idTokenHint', e.target.value)}
							placeholder="Paste your ID token here..."
							rows={4}
						/>
					</FormGroup>
				)}

				{credentials.loginHintToken !== '' && (
					<FormGroup>
						<Label htmlFor="loginHintToken">Login Hint Token (JWT) *</Label>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
							<TextArea
								id="loginHintToken"
								value={credentials.loginHintToken}
								onChange={(e) => handleInputChange('loginHintToken', e.target.value)}
								placeholder="Paste or generate JWT login hint token..."
								rows={4}
								style={{ flex: 1 }}
							/>
							<Button
								type="button"
								onClick={generateLoginHintToken}
								disabled={
									!credentials.clientId || !credentials.environmentId || !credentials.loginHint
								}
								title="Generate Login Hint Token"
								style={{
									padding: '0.5rem',
									minWidth: '120px',
									whiteSpace: 'nowrap',
								}}
							>
								Generate
							</Button>
						</div>
						{!credentials.clientId || !credentials.environmentId || !credentials.loginHint ? (
							<small
								style={{
									color: '#6b7280',
									fontSize: '0.875rem',
									marginTop: '0.25rem',
									display: 'block',
								}}
							>
								⚠️ Requires Client ID, Environment ID, and Login Hint to generate token
							</small>
						) : (
							<small
								style={{
									color: '#6b7280',
									fontSize: '0.875rem',
									marginTop: '0.25rem',
									display: 'block',
								}}
							>
								💡 Generate a signed JWT token for the login hint
							</small>
						)}
					</FormGroup>
				)}

				{/* Token Delivery Mode */}
				<FormGroup>
					<Label htmlFor="tokenDeliveryMode">Token Delivery Mode</Label>
					<Select
						id="tokenDeliveryMode"
						value={credentials.tokenDeliveryMode}
						onChange={(e) =>
							handleInputChange('tokenDeliveryMode', e.target.value as 'poll' | 'ping' | 'push')
						}
					>
						<option value="poll">Poll (Client polls token endpoint)</option>
						<option value="ping">Ping (Server notifies client)</option>
						<option value="push">Push (Server pushes token to client)</option>
					</Select>
				</FormGroup>

				{(credentials.tokenDeliveryMode === 'ping' || credentials.tokenDeliveryMode === 'push') && (
					<FormGroup>
						<Label htmlFor="clientNotificationEndpoint">Client Notification Endpoint *</Label>
						<Input
							id="clientNotificationEndpoint"
							value={credentials.clientNotificationEndpoint}
							onChange={(e) => handleInputChange('clientNotificationEndpoint', e.target.value)}
							placeholder="https://your-app.com/ciba-callback"
						/>
					</FormGroup>
				)}

				{/* Advanced Options */}
				<div style={{ marginTop: '2rem' }}>
					<button
						type="button"
						onClick={() => setShowAdvanced(!showAdvanced)}
						style={{
							background: 'none',
							border: 'none',
							color: '#3b82f6',
							cursor: 'pointer',
							fontWeight: '500',
							marginBottom: '1rem',
						}}
					>
						{showAdvanced ? 'Hide' : 'Show'} Advanced Options
					</button>

					{showAdvanced && (
						<>
							<FormGroup>
								<Label htmlFor="clientAuthMethod">Client Authentication Method</Label>
								<Select
									id="clientAuthMethod"
									value={credentials.clientAuthMethod}
									onChange={(e) =>
										handleInputChange(
											'clientAuthMethod',
											e.target.value as
												| 'client_secret_basic'
												| 'client_secret_post'
												| 'private_key_jwt'
										)
									}
								>
									<option value="client_secret_basic">Client Secret Basic</option>
									<option value="client_secret_post">Client Secret Post</option>
									<option value="private_key_jwt">Private Key JWT</option>
								</Select>
							</FormGroup>

							<FormGroup>
								<Label htmlFor="bindingMessage">Binding Message (Optional)</Label>
								<Input
									id="bindingMessage"
									value={credentials.bindingMessage}
									onChange={(e) => handleInputChange('bindingMessage', e.target.value)}
									placeholder="Human-readable message to user"
								/>
							</FormGroup>

							<FormGroup>
								<Label htmlFor="userCode">User Code (Optional)</Label>
								<Input
									id="userCode"
									value={credentials.userCode}
									onChange={(e) => handleInputChange('userCode', e.target.value)}
									placeholder="User code for additional verification"
								/>
							</FormGroup>

							<FormGroup>
								<Label htmlFor="requestContext">Request Context (Optional)</Label>
								<TextArea
									id="requestContext"
									value={credentials.requestContext}
									onChange={(e) => handleInputChange('requestContext', e.target.value)}
									placeholder="Additional context information"
								/>
							</FormGroup>
						</>
					)}
				</div>

				{/* Action Buttons */}
				<ButtonGroup>
					<ButtonSpinner
						loading={cibaFlow.isInitiating}
						onClick={handleInitiateAuth}
						disabled={
							!credentials.environmentId ||
							!credentials.clientId ||
							!credentials.clientSecret ||
							!credentials.scope ||
							(!credentials.loginHint && !credentials.idTokenHint && !credentials.loginHintToken)
						}
						spinnerSize={16}
						spinnerPosition="left"
						style={{
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							padding: '0.75rem 1.5rem',
							borderRadius: '6px',
							fontWeight: '500',
							cursor: 'pointer',
						}}
					>
						Initiate CIBA Authentication
					</ButtonSpinner>

					<button
						type="button"
						onClick={handleReset}
						style={{
							background: '#6b7280',
							color: 'white',
							border: 'none',
							padding: '0.75rem 1.5rem',
							borderRadius: '6px',
							fontWeight: '500',
							cursor: 'pointer',
						}}
					>
						Reset
					</button>
				</ButtonGroup>
			</Card>

			{/* Discovery Metadata */}
			{cibaFlow.discoveryMetadata && (
				<Card>
					<CardTitle>🔍 Discovery Metadata</CardTitle>
					<div style={{ display: 'grid', gap: '1rem', fontSize: '0.875rem' }}>
						<div>
							<strong>Authentication Endpoint:</strong>{' '}
							{cibaFlow.discoveryMetadata.backchannel_authentication_endpoint}
						</div>
						<div>
							<strong>Supported Delivery Modes:</strong>{' '}
							{cibaFlow.discoveryMetadata.backchannel_token_delivery_modes_supported.join(', ')}
						</div>
						<div>
							<strong>User Code Support:</strong>{' '}
							{cibaFlow.discoveryMetadata.backchannel_user_code_parameter_supported ? 'Yes' : 'No'}
						</div>
						{cibaFlow.discoveryMetadata
							.backchannel_authentication_request_signing_alg_values_supported && (
							<div>
								<strong>Supported Signing Algorithms:</strong>{' '}
								{cibaFlow.discoveryMetadata.backchannel_authentication_request_signing_alg_values_supported.join(
									', '
								)}
							</div>
						)}
					</div>
				</Card>
			)}

			{/* Authentication Status */}
			{cibaFlow.authRequest && (
				<Card>
					<CardTitle>📊 Authentication Status</CardTitle>

					<StatusCard status={cibaFlow.status}>
						<StatusTitle>
							{cibaFlow.status === 'pending' && <FiClock />}
							{cibaFlow.status === 'approved' && <FiCheckCircle />}
							{cibaFlow.status === 'denied' && <FiX />}
							{cibaFlow.status === 'expired' && <FiAlertTriangle />}
							{cibaFlow.status === 'error' && <FiAlertTriangle />} Status:{' '}
							{cibaFlow.status.toUpperCase()}
						</StatusTitle>
						<StatusText>
							{cibaFlow.status === 'pending' && 'Waiting for user approval...'}
							{cibaFlow.status === 'approved' && 'Authentication approved!'}
							{cibaFlow.status === 'denied' && 'Authentication denied by user'}
							{cibaFlow.status === 'expired' && 'Authentication request expired'}
							{(cibaFlow.status === 'error' && cibaFlow.error) || 'An error occurred'}
						</StatusText>
					</StatusCard>

					{/* Authentication Request Details */}
					<div
						style={{
							background: '#f8fafc',
							padding: '1rem',
							borderRadius: '6px',
							marginBottom: '1rem',
						}}
					>
						<h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
							Authentication Request Details
						</h5>
						<div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
							<div>
								<strong>Request ID:</strong> {cibaFlow.authRequest.auth_req_id}
							</div>
							<div>
								<strong>Expires In:</strong> {cibaFlow.authRequest.expires_in} seconds
							</div>
							<div>
								<strong>Polling Interval:</strong> {cibaFlow.authRequest.interval} seconds
							</div>
							{cibaFlow.authRequest.binding_message && (
								<div>
									<strong>Binding Message:</strong> {cibaFlow.authRequest.binding_message}
								</div>
							)}
							{cibaFlow.authRequest.user_code && (
								<div>
									<strong>User Code:</strong> {cibaFlow.authRequest.user_code}
								</div>
							)}
						</div>
					</div>

					{/* Polling Controls */}
					{cibaFlow.status === 'pending' && (
						<ButtonSpinner
							loading={cibaFlow.isPolling}
							onClick={handlePollForTokens}
							spinnerSize={16}
							spinnerPosition="left"
							style={{
								background: '#10b981',
								color: 'white',
								border: 'none',
								padding: '0.75rem 1.5rem',
								borderRadius: '6px',
								fontWeight: '500',
								cursor: 'pointer',
							}}
						>
							{cibaFlow.isPolling
								? 'Polling...'
								: `Poll for Tokens (${cibaFlow.pollingCount} attempts)`}
						</ButtonSpinner>
					)}
				</Card>
			)}

			{/* Tokens Display */}
			{cibaFlow.tokens && (
				<Card>
					<CardTitle>🎉 Authentication Tokens</CardTitle>

					<TokenDisplay>
						<TokenTitle>Access Token</TokenTitle>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<TokenContent>{cibaFlow.tokens.access_token}</TokenContent>
							<CopyButton onClick={() => copyToken(cibaFlow.tokens.access_token)}>
								{copiedToken ? 'Copied!' : <FiCopy />}
							</CopyButton>
						</div>
					</TokenDisplay>

					{cibaFlow.tokens.refresh_token && (
						<TokenDisplay>
							<TokenTitle>Refresh Token</TokenTitle>
							<div
								style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
							>
								<TokenContent>{cibaFlow.tokens.refresh_token}</TokenContent>
								<CopyButton onClick={() => copyToken(cibaFlow.tokens.refresh_token)}>
									<FiCopy />
								</CopyButton>
							</div>
						</TokenDisplay>
					)}

					{cibaFlow.tokens.id_token && (
						<TokenDisplay>
							<TokenTitle>ID Token</TokenTitle>
							<div
								style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
							>
								<TokenContent>{cibaFlow.tokens.id_token}</TokenContent>
								<CopyButton onClick={() => copyToken(cibaFlow.tokens.id_token)}>
									<FiCopy />
								</CopyButton>
							</div>
						</TokenDisplay>
					)}

					{/* Token Metadata */}
					<div
						style={{
							background: '#f8fafc',
							padding: '1rem',
							borderRadius: '6px',
							marginTop: '1rem',
						}}
					>
						<h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Token Information</h5>
						<div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
							<div>
								<strong>Token Type:</strong> {cibaFlow.tokens.token_type}
							</div>
							{cibaFlow.tokens.expires_in && (
								<div>
									<strong>Expires In:</strong> {cibaFlow.tokens.expires_in} seconds
								</div>
							)}
							{cibaFlow.tokens.scope && (
								<div>
									<strong>Scope:</strong> {cibaFlow.tokens.scope}
								</div>
							)}
							{cibaFlow.tokens.sub && (
								<div>
									<strong>Subject:</strong> {cibaFlow.tokens.sub}
								</div>
							)}
							{cibaFlow.tokens.iss && (
								<div>
									<strong>Issuer:</strong> {cibaFlow.tokens.iss}
								</div>
							)}
							{cibaFlow.tokens.aud && (
								<div>
									<strong>Audience:</strong>{' '}
									{Array.isArray(cibaFlow.tokens.aud)
										? cibaFlow.tokens.aud.join(', ')
										: cibaFlow.tokens.aud}
								</div>
							)}
						</div>
					</div>
				</Card>
			)}

			{/* Educational Content */}
			<Card>
				<CardTitle>📚 About CIBA (Client-Initiated Backchannel Authentication)</CardTitle>
				<div style={{ lineHeight: '1.6', color: '#4b5563' }}>
					<p>
						<strong>CIBA</strong> is an OpenID Connect extension that enables authentication without
						direct user interaction with the client application. This is particularly useful for
						scenarios like:
					</p>
					<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
						<li>AI agents requiring human-in-the-loop approvals</li>
						<li>Call center agents accessing customer information</li>
						<li>Kiosk or limited-input device authentication</li>
						<li>Secure transaction approval on mobile devices</li>
					</ul>

					<h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>
						How it works:
					</h4>
					<ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
						<li>Client initiates authentication request to OpenID Provider</li>
						<li>Provider sends notification to user's authentication device</li>
						<li>User reviews and approves/denies the request</li>
						<li>Client polls token endpoint to retrieve results</li>
					</ol>

					<h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>
						Token Delivery Modes:
					</h4>
					<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
						<li>
							<strong>Poll:</strong> Client continuously polls token endpoint (default)
						</li>
						<li>
							<strong>Ping:</strong> Provider notifies client when ready, then client polls
						</li>
						<li>
							<strong>Push:</strong> Provider pushes tokens directly to client endpoint
						</li>
					</ul>
				</div>
			</Card>
		</Container>
	);
};

export default CIBAFlowV9;
