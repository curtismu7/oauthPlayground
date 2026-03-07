const WorkerActions: React.FC<{
	onNext: () => void;
	onClearToken: () => void;
	onClearAll: () => void;
}> = ({ onNext, onClearToken, onClearAll }) => (
	<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
		<Button
			variant="primary"
			onClick={onNext}
			style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
		>
			<FiArrowRight /> Next: Create Applications
		</Button>
		<Button
			variant="danger"
			onClick={onClearToken}
			style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
		>
			<FiSettings /> Clear Token Only
		</Button>
		<Button
			variant="danger"
			onClick={onClearAll}
			style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
		>
			<FiX /> Clear All Credentials
		</Button>
	</div>
);

import { FiArrowRight, FiEye, FiEyeOff, FiKey, FiSettings, FiShield, FiX } from '@icons';
// src/pages/ClientGenerator.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';
import ColoredUrlDisplay from '../components/ColoredUrlDisplay';
import { CredentialsInput } from '../components/CredentialsInput';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { usePageScroll } from '../hooks/usePageScroll';
import { FlowHeader } from '../services/flowHeaderService';
import TokenDisplayService from '../services/tokenDisplayService';
import { logger } from '../utils/logger';
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1.5rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.primary};
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.25rem;
	color: ${({ theme }) => theme.colors.gray600};
	max-width: 800px;
	margin: 0 auto;
	line-height: 1.6;
`;

const FormContainer = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	margin-bottom: 2rem;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
`;

const FormTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.5rem;
`;

const Select = styled.select`
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}
`;

const Button = styled.button.withConfig({
	shouldForwardProp: (prop) => prop !== 'variant',
})<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid transparent;

	${({ variant, theme }) =>
		variant === 'primary'
			? `
		background: ${theme.colors.primary};
		color: white;
		&:hover {
			background: ${theme.colors.primaryDark};
		}
	`
			: variant === 'danger'
				? `
		background: linear-gradient(135deg, ${V9_COLORS.PRIMARY.RED} 0%, ${V9_COLORS.PRIMARY.RED_DARK} 100%);
		color: white;
		box-shadow: 0 12px 28px -18px rgba(220, 38, 38, 0.55);
		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 16px 35px -20px rgba(220, 38, 38, 0.65);
		}
	`
				: `
		background: white;
		color: ${theme.colors.gray700};
		border-color: ${V9_COLORS.TEXT.GRAY_LIGHTER};
		&:hover {
			background: ${V9_COLORS.BG.GRAY_LIGHT};
			border-color: ${V9_COLORS.TEXT.GRAY_LIGHT};
		}
	`}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ActionButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	background: linear-gradient(135deg, ${V9_COLORS.PRIMARY.GREEN} 0%, ${V9_COLORS.PRIMARY.GREEN_DARK} 100%);
	box-shadow: 0 12px 30px -15px rgba(22, 163, 74, 0.6);
	color: white;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 16px 35px -18px rgba(22, 163, 74, 0.7);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		box-shadow: none;
	}

	svg {
		width: 16px;
		height: 16px;
	}
`;

const LoadingSpinner = styled.div`
	display: inline-block;
	width: 20px;
	height: 20px;
	border: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 50%;
	border-top-color: ${V9_COLORS.PRIMARY.BLUE};
	animation: spin 1s ease-in-out infinite;

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`;

const ClientGenerator: React.FC = () => {
	usePageScroll({ pageName: 'Client Generator', force: true });
	const navigate = useNavigate();

	// Worker token state
	const [workerToken, setWorkerToken] = useState<string | null>(null);
	const [workerCredentials, setWorkerCredentials] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scopes: 'openid p1:create:application p1:read:application p1:update:application',
		tokenEndpointAuthMethod: 'client_secret_post' as 'client_secret_basic' | 'client_secret_post',
	});
	const [isGettingToken, setIsGettingToken] = useState(false);
	const [tokenError, setTokenError] = useState<string | null>(null);
	const [workerTokenRequest, setWorkerTokenRequest] = useState<{
		url: string;
		method: string;
		headers: Record<string, string>;
		body: string;
		authMethod: string;
	} | null>(null);
	const [tokenDecodeStates, setTokenDecodeStates] = React.useState<Record<string, boolean>>({});

	// Use unified global worker token hook for token management

	// Silently get worker token
	const getWorkerTokenSilently = useCallback(async (credentials: typeof workerCredentials) => {
		try {
			setIsGettingToken(true);
			setTokenError(null);

			// Validate environment ID format (should be UUID format, not a long client ID)
			const envId = credentials.environmentId?.trim();
			if (!envId) {
				throw new Error('Environment ID is required');
			}

			// Basic validation: environment IDs are typically UUID format (36 chars with dashes)
			// Client IDs are much longer base64-like strings
			if (envId.length > 50 || !envId.match(/^[a-zA-Z0-9-]+$/)) {
				logger.warn('ClientGenerator', '[App Generator] Environment ID looks suspicious:', {
					envId,
				});
				throw new Error('Invalid Environment ID format. Please check your credentials.');
			}

			const tokenEndpoint = `https://auth.pingone.com/${envId}/as/token`;
			console.log('[App Generator] Requesting token from:', tokenEndpoint);
			console.log('[App Generator] Using auth method:', credentials.tokenEndpointAuthMethod);

			// Prepare headers and body based on auth method
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			const bodyParams: Record<string, string> = {
				grant_type: 'client_credentials',
				scope: credentials.scopes,
			};

			if (credentials.tokenEndpointAuthMethod === 'client_secret_basic') {
				// Client Secret Basic: credentials in Authorization header
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				headers['Authorization'] = `Basic ${basicAuth}`;
			} else {
				// Client Secret Post: credentials in request body
				bodyParams.client_id = credentials.clientId;
				bodyParams.client_secret = credentials.clientSecret;
			}

			// Capture request details for display
			setWorkerTokenRequest({
				url: tokenEndpoint,
				method: 'POST',
				headers,
				body: new URLSearchParams(bodyParams).toString(),
				authMethod: credentials.tokenEndpointAuthMethod,
			});

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: new URLSearchParams(bodyParams),
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger.error('ClientGenerator', '[App Generator] Token request failed:', {
					status: response.status,
					errorText,
				});
				throw new Error(
					`Token request failed: ${response.status} - ${errorText.substring(0, 100)}`
				);
			}

			// Token is now managed by unified service
			console.log('[App Generator] Worker token managed by unified service');
			return workerToken;
		} catch (error) {
			logger.error(
				'ClientGenerator',
				'[App Generator] Failed to get worker token:',
				undefined,
				error as Error
			);
			setTokenError(error instanceof Error ? error.message : 'Failed to get token');
		} finally {
			setIsGettingToken(false);
		}
		return;
	}, []);

	// Load saved worker credentials and silently get token on mount
	useEffect(() => {
		const loadAndGetToken = async () => {
			try {
				// Try to load saved worker credentials from global service
				const saved = await workerTokenServiceV8.loadCredentials();
				if (saved) {
					const authMethod = saved.tokenEndpointAuthMethod || 'client_secret_post';
					const credentials = {
						environmentId: saved.environmentId,
						clientId: saved.clientId,
						clientSecret: saved.clientSecret,
						scopes: saved.scopes?.join(' ') || workerCredentials.scopes,
						tokenEndpointAuthMethod: (authMethod === 'client_secret_basic' ||
						authMethod === 'client_secret_post'
							? authMethod
							: 'client_secret_post') as 'client_secret_basic' | 'client_secret_post',
					};
					setWorkerCredentials(credentials);

					// Check if we have a valid token already
					const existingToken = await workerTokenServiceV8.getToken();
					if (existingToken) {
						console.log('[App Generator] Using existing worker token from service');
						setWorkerToken(existingToken);
					} else if (
						credentials.clientId &&
						credentials.clientSecret &&
						credentials.environmentId
					) {
						// Silently get token if we have credentials but no token
						console.log('[App Generator] Silently requesting worker token...');
						await getWorkerTokenSilently(credentials);
					}
				}
			} catch (error) {
				logger.error(
					'ClientGenerator',
					'[App Generator] Failed to load credentials:',
					undefined,
					error as Error
				);
			}
			return;
		};

		loadAndGetToken();
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
	}, [getWorkerTokenSilently, workerCredentials.scopes]);

	// Handle worker credential changes
	const handleWorkerCredentialChange = useCallback((field: string, value: string) => {
		setWorkerCredentials((prev) => ({ ...prev, [field]: value }));
	}, []);

	// Save credentials and get token
	const handleSaveAndGetToken = useCallback(async () => {
		try {
			// Credentials are now managed by unified service
			console.log('[App Generator] Worker credentials managed by unified service');
			// Save credentials to global service
			await workerTokenServiceV8.saveCredentials({
				environmentId: workerCredentials.environmentId,
				clientId: workerCredentials.clientId,
				clientSecret: workerCredentials.clientSecret,
				scopes: workerCredentials.scopes.split(/\s+/).filter(Boolean),
				tokenEndpointAuthMethod: workerCredentials.tokenEndpointAuthMethod,
			});
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Worker credentials saved to global storage',
				duration: 4000,
			});

			// Get token
			await getWorkerTokenSilently(workerCredentials);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Worker token obtained and saved!',
				duration: 4000,
			});
		} catch (error) {
			logger.error(
				'ClientGenerator',
				'[App Generator] Failed to save and get token:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: error instanceof Error ? error.message : 'Failed to obtain worker token',
				dismissible: true,
			});
		}
	}, [workerCredentials, getWorkerTokenSilently]);

	const handleTokenDecode = (tokenKey: string) => {
		const isDecoded = tokenDecodeStates[tokenKey] || false;
		setTokenDecodeStates((prev) => ({ ...prev, [tokenKey]: !isDecoded }));
	};

	return (
		<Container>
			<FlowHeader flowId="configuration" />

			<Header>
				<Title>PingOne Client Generator - Worker Token Setup</Title>
				<Subtitle>
					Obtain a worker token for managing PingOne applications. Use this token to create and
					manage OAuth applications.
				</Subtitle>
			</Header>

			{/* Worker Credentials Section */}
			{!workerToken && (
				<FormContainer>
					<FormTitle>
						<FiKey style={{ marginRight: '0.5rem' }} />
						Worker Application Credentials
					</FormTitle>
					<p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
						Enter your Worker application credentials to manage PingOne applications.
					</p>
					<p
						style={{
							color: '#f59e0b',
							fontSize: '0.875rem',
							marginBottom: '1.5rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<FiSettings />
						<strong>Note:</strong> Environment ID should be a UUID format (e.g.,
						"12345678-1234-1234-1234-123456789abc"), not a Client ID.
					</p>

					<CredentialsInput
						environmentId={workerCredentials.environmentId}
						clientId={workerCredentials.clientId}
						clientSecret={workerCredentials.clientSecret}
						scopes={workerCredentials.scopes}
						onEnvironmentIdChange={(value) => handleWorkerCredentialChange('environmentId', value)}
						onClientIdChange={(value) => handleWorkerCredentialChange('clientId', value)}
						onClientSecretChange={(value) => handleWorkerCredentialChange('clientSecret', value)}
						onScopesChange={(value) => handleWorkerCredentialChange('scopes', value)}
						showRedirectUri={false}
						showPostLogoutRedirectUri={false}
						showLoginHint={false}
						showClientSecret={true}
					/>

					{/* Token Endpoint Auth Method */}
					<FormGroup style={{ marginTop: '1rem' }}>
						<Label>
							Token Endpoint Authentication Method
							<span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
						</Label>
						<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
							This must match the authentication method configured in your PingOne worker
							application.
						</p>
						<Select
							value={workerCredentials.tokenEndpointAuthMethod}
							onChange={(e) =>
								handleWorkerCredentialChange(
									'tokenEndpointAuthMethod',
									e.target.value as 'client_secret_basic' | 'client_secret_post'
								)
							}
						>
							<option value="client_secret_post">
								Client Secret Post (credentials in request body)
							</option>
							<option value="client_secret_basic">
								Client Secret Basic (credentials in Authorization header)
							</option>
						</Select>
						<p
							style={{
								fontSize: '0.75rem',
								color: '#f59e0b',
								marginTop: '0.5rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.25rem',
							}}
						>
							<FiSettings size={12} />
							<strong>Important:</strong> Check your worker app settings in PingOne to ensure this
							matches.
						</p>
					</FormGroup>

					<div
						style={{
							marginTop: '1.5rem',
							display: 'flex',
							gap: '1rem',
							alignItems: 'center',
							flexWrap: 'wrap',
						}}
					>
						<ActionButton
							onClick={handleSaveAndGetToken}
							disabled={
								!workerCredentials.environmentId ||
								!workerCredentials.clientId ||
								!workerCredentials.clientSecret ||
								isGettingToken
							}
						>
							{isGettingToken ? (
								<>
									<LoadingSpinner /> Getting Token...
								</>
							) : (
								<>
									<FiKey /> Save & Get Worker Token
								</>
							)}
						</ActionButton>

						<Button
							variant="danger"
							onClick={async () => {
								// Clear credentials through unified service
								console.log('[App Generator] Clearing credentials through unified service');
								setWorkerCredentials({
									environmentId: '',
									clientId: '',
									clientSecret: '',
									scopes: 'openid p1:create:application p1:read:application p1:update:application',
									tokenEndpointAuthMethod: 'client_secret_post',
								});
								setWorkerToken(null);
								setTokenError(null);
								modernMessaging.showFooterMessage({
									type: 'status',
									message: 'Credentials cleared from global storage',
									duration: 4000,
								});
							}}
							style={{ padding: '0.75rem 1.25rem' }}
						>
							<FiX /> Clear
						</Button>

						{tokenError && (
							<span
								style={{ color: '#ef4444', fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}
							>
								⚠️ {tokenError}
							</span>
						)}
					</div>
				</FormContainer>
			)}

			{/* Success indicator when we have a token */}
			{workerToken && (
				<div>
					<WorkerTokenDetectedBanner
						token={workerToken}
						message="Worker token obtained successfully! Ready to create PingOne applications."
					/>
					<div style={{ marginTop: '1rem' }}>
						<WorkerActions
							onNext={() => {
								navigate('/application-generator', {
									state: {
										workerToken,
										environmentId: workerCredentials.environmentId,
									},
								});
							}}
							// Clear token through unified service
							onClearToken={async () => {
								console.log('[App Generator] Clearing token through unified service');
								setWorkerToken(null);
								setTokenError(null);
								setWorkerTokenRequest(null);
								modernMessaging.showFooterMessage({
									type: 'status',
									message: 'Token cleared - credentials preserved',
									duration: 4000,
								});
							}}
							// Clear all through unified service
							onClearAll={async () => {
								console.log('[App Generator] Clearing all through unified service');
								setWorkerToken(null);
								setTokenError(null);
								setWorkerTokenRequest(null);
								setTokenDecodeStates({});
								setWorkerCredentials({
									environmentId: '',
									clientId: '',
									clientSecret: '',
									scopes: 'openid p1:create:application p1:read:application p1:update:application',
									tokenEndpointAuthMethod: 'client_secret_post',
								});
								modernMessaging.showFooterMessage({
									type: 'status',
									message: 'All credentials and data cleared',
									duration: 4000,
								});
							}}
						/>
					</div>
				</div>
			)}

			{/* Worker Token Response - Always show when we have a token */}
			{workerToken && (
				<div style={{ marginTop: workerToken ? '2rem' : '0' }}>
					<div
						style={{
							background: '#f0fdf4',
							border: '1px solid #22c55e',
							borderRadius: '0.75rem',
							padding: '1.25rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '0.75rem',
								color: '#166534',
								fontWeight: 600,
							}}
						>
							<FiKey size={20} />
							Worker Token Response (OAuth 2.0 Token)
						</div>
						<div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '1rem' }}>
							This is the access token that will be used to authenticate API calls to PingOne's
							Management API.
						</div>

						{/* Token Response */}
						<div style={{ marginBottom: '1rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
								OAuth 2.0 Token Response:
							</div>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '0.5rem',
								}}
							>
								<pre
									style={{
										background: '#1e293b',
										color: '#e2e8f0',
										padding: '1rem',
										borderRadius: '0.5rem',
										overflowX: 'auto',
										fontSize: '0.875rem',
										lineHeight: '1.6',
										fontFamily: 'Monaco, Menlo, monospace',
										flex: 1,
										margin: 0,
									}}
								>
									{tokenDecodeStates['worker-token-response']
										? JSON.stringify(
												{
													access_token: workerToken,
													token_type: 'Bearer',
													expires_in: 3600,
													scope:
														'openid p1:create:application p1:read:application p1:update:application',
												},
												null,
												2
											)
										: JSON.stringify(
												{
													access_token: '[MASKED - Click decode to reveal]',
													token_type: 'Bearer',
													expires_in: 3600,
													scope:
														'openid p1:create:application p1:read:application p1:update:application',
												},
												null,
												2
											)}
								</pre>
								<button
									type="button"
									onClick={() => handleTokenDecode('worker-token-response')}
									style={{
										padding: '0.5rem',
										borderRadius: '0.375rem',
										border: '1px solid #d1d5db',
										background: 'white',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
									title={
										tokenDecodeStates['worker-token-response'] ? 'Mask token' : 'Reveal full token'
									}
								>
									{tokenDecodeStates['worker-token-response'] ? (
										<FiEyeOff size={16} />
									) : (
										<FiEye size={16} />
									)}
								</button>
							</div>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#166534',
									marginTop: '0.5rem',
									fontStyle: 'italic',
								}}
							>
								<strong>Security Note:</strong> Token is masked by default. Click the eye icon to
								reveal the full token value for debugging purposes.
							</div>
						</div>

						{/* Authentication Header */}
						<div>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
								Authentication Header:
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<pre
									style={{
										background: '#1e293b',
										color: '#e2e8f0',
										padding: '1rem',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
										lineHeight: '1.6',
										fontFamily: 'Monaco, Menlo, monospace',
										flex: 1,
										margin: 0,
									}}
								>
									{`Authorization: Bearer ${TokenDisplayService.maskToken(workerToken, 4)}`}
								</pre>
								<button
									type="button"
									onClick={() => handleTokenDecode('auth-header')}
									style={{
										padding: '0.5rem',
										borderRadius: '0.375rem',
										border: '1px solid #d1d5db',
										background: 'white',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
									title={
										tokenDecodeStates['auth-header']
											? 'Hide full header'
											: 'Show full header (not recommended)'
									}
								>
									{tokenDecodeStates['auth-header'] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
								</button>
							</div>
							{tokenDecodeStates['auth-header'] && (
								<div
									style={{
										background: '#fef3c7',
										border: '1px solid #f59e0b',
										borderRadius: '0.5rem',
										padding: '1rem',
										marginTop: '0.5rem',
									}}
								>
									<div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
										⚠️ Full Header Revealed:
									</div>
									<pre
										style={{
											background: '#1e293b',
											color: '#e2e8f0',
											padding: '1rem',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
											lineHeight: '1.6',
											fontFamily: 'Monaco, Menlo, monospace',
											margin: 0,
											overflowX: 'auto',
										}}
									>
										{`Authorization: Bearer ${workerToken}`}
									</pre>
								</div>
							)}
							<div
								style={{
									fontSize: '0.75rem',
									color: '#166534',
									marginTop: '0.5rem',
									fontStyle: 'italic',
								}}
							>
								This header will be included in all API requests to PingOne.
							</div>
						</div>
					</div>

					{/* Token Analysis Section - Using TokenDisplayService */}
					<div style={{ marginTop: '1.5rem' }}>
						<div
							style={{
								background: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '0.75rem',
								padding: '1.25rem',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '0.75rem',
									color: '#374151',
									fontWeight: 600,
								}}
							>
								<FiShield size={20} />
								Token Analysis (TokenDisplayService)
							</div>
							<div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
								Detailed token analysis using our secure TokenDisplayService.
							</div>

							{/* Token Metadata */}
							<div style={{ marginBottom: '1rem' }}>
								<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
									Token Metadata:
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
										gap: '0.75rem',
									}}
								>
									<div
										style={{
											padding: '0.75rem',
											background: 'white',
											border: '1px solid #e5e7eb',
											borderRadius: '0.5rem',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
											Token Type
										</div>
										<div style={{ fontWeight: 600, color: '#374151' }}>
											{TokenDisplayService.getTokenLabel('access', false)}
										</div>
									</div>
									<div
										style={{
											padding: '0.75rem',
											background: 'white',
											border: '1px solid #e5e7eb',
											borderRadius: '0.5rem',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
											Length
										</div>
										<div style={{ fontWeight: 600, color: '#374151' }}>
											{workerToken.length} characters
										</div>
									</div>
									<div
										style={{
											padding: '0.75rem',
											background: 'white',
											border: '1px solid #e5e7eb',
											borderRadius: '0.5rem',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
											Format
										</div>
										<div style={{ fontWeight: 600, color: '#374151' }}>
											{TokenDisplayService.isJWT(workerToken) ? (
												<span style={{ color: '#059669' }}>JWT ✓</span>
											) : (
												<span style={{ color: '#dc2626' }}>Opaque ✗</span>
											)}
										</div>
									</div>
									<div
										style={{
											padding: '0.75rem',
											background: 'white',
											border: '1px solid #e5e7eb',
											borderRadius: '0.5rem',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
											Flow Context
										</div>
										<div style={{ fontWeight: 600, color: '#374151' }}>Client Credentials</div>
									</div>
								</div>
							</div>

							{/* JWT Decode Section */}
							{TokenDisplayService.isJWT(workerToken) && (
								<div style={{ marginBottom: '1rem' }}>
									<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
										JWT Structure:
									</div>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<pre
											style={{
												background: '#1e293b',
												color: '#e2e8f0',
												padding: '1rem',
												borderRadius: '0.5rem',
												overflowX: 'auto',
												fontSize: '0.875rem',
												lineHeight: '1.6',
												fontFamily: 'Monaco, Menlo, monospace',
												flex: 1,
												margin: 0,
											}}
										>
											{(() => {
												const decoded = TokenDisplayService.decodeJWT(workerToken);
												if (!decoded) return 'Unable to decode JWT';

												return JSON.stringify(
													{
														header: decoded.header,
														payload: {
															...decoded.payload,
															// Mask sensitive fields in payload for security (excluding client_id as requested)
															sub: decoded.payload.sub
																? TokenDisplayService.maskToken(decoded.payload.sub, 4)
																: undefined,
															email: decoded.payload.email ? '[REDACTED]' : undefined,
															username: decoded.payload.username ? '[REDACTED]' : undefined,
															...Object.fromEntries(
																Object.entries(decoded.payload).filter(
																	([key]) => !['sub', 'email', 'username'].includes(key)
																)
															),
														},
													},
													null,
													2
												);
											})()}
										</pre>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '200px' }}>
											<strong>JWT Decoded:</strong> Header and payload shown with sensitive data
											masked for security.
										</div>
									</div>
								</div>
							)}

							{/* Opaque Token Notice */}
							{!TokenDisplayService.isJWT(workerToken) && (
								<div
									style={{
										marginBottom: '1rem',
										padding: '1rem',
										background: '#fef3c7',
										border: '1px solid #f59e0b',
										borderRadius: '0.5rem',
									}}
								>
									<div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
										Opaque Token
									</div>
									<div style={{ fontSize: '0.875rem', color: '#78350f' }}>
										{TokenDisplayService.getOpaqueTokenMessage('access')}
									</div>
									<div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.5rem' }}>
										This is normal for access tokens in many OAuth implementations for security
										reasons.
									</div>
								</div>
							)}

							{/* Security Features */}
							<div
								style={{
									padding: '1rem',
									background: '#f0fdf4',
									border: '1px solid #22c55e',
									borderRadius: '0.5rem',
								}}
							>
								<div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>
									Security Features
								</div>
								<div style={{ fontSize: '0.875rem', color: '#166534' }}>
									• Token values are never logged or stored insecurely
									<br />• Sensitive JWT claims are automatically masked
									<br />• All operations use secure TokenDisplayService methods
									<br />• Manual user action required to reveal full token values
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Display Worker Token Request Details */}
			{workerTokenRequest && (
				<div style={{ marginBottom: '2rem' }}>
					<div
						style={{
							background: '#f0fdf4',
							border: '1px solid #22c55e',
							borderRadius: '0.75rem',
							padding: '1.25rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '0.75rem',
								color: '#166534',
								fontWeight: 600,
							}}
						>
							<FiKey size={20} />
							Worker Token Request (OAuth 2.0 Client Credentials) - Client Secret Post
						</div>
						<div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '1rem' }}>
							This shows how to obtain an access token using the Client Credentials grant type with
							Client Secret Post authentication (credentials sent in request body).
						</div>

						{/* Token Endpoint */}
						<div style={{ marginBottom: '1rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
								Token Endpoint:
							</div>
							<ColoredUrlDisplay url={workerTokenRequest.url} label="POST" showCopyButton={true} />
						</div>

						{/* Authentication Method */}
						<div
							style={{
								marginBottom: '1rem',
								padding: '1rem',
								background: '#fef3c7',
								border: '1px solid #fbbf24',
								borderRadius: '0.5rem',
							}}
						>
							<div
								style={{
									fontWeight: 600,
									marginBottom: '0.5rem',
									color: '#92400e',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiKey size={16} />
								Authentication Method:{' '}
								{workerTokenRequest.authMethod === 'client_secret_basic'
									? 'Client Secret Basic'
									: 'Client Secret Post'}
							</div>
							{workerTokenRequest.authMethod === 'client_secret_basic' ? (
								<div style={{ fontSize: '0.875rem', color: '#78350f' }}>
									Credentials sent in{' '}
									<code
										style={{
											background: 'white',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
										}}
									>
										Authorization
									</code>{' '}
									header as Base64 encoded string
								</div>
							) : (
								<div style={{ fontSize: '0.875rem', color: '#78350f' }}>
									Credentials sent in request body as{' '}
									<code
										style={{
											background: 'white',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
										}}
									>
										client_id
									</code>{' '}
									and{' '}
									<code
										style={{
											background: 'white',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
										}}
									>
										client_secret
									</code>{' '}
									parameters
								</div>
							)}
						</div>

						{/* Headers */}
						<div style={{ marginBottom: '1rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
								Headers:
							</div>
							<pre
								style={{
									background: '#1e293b',
									color: '#e2e8f0',
									padding: '1rem',
									borderRadius: '0.5rem',
									overflowX: 'auto',
									fontSize: '0.875rem',
									lineHeight: '1.6',
									fontFamily: 'Monaco, Menlo, monospace',
								}}
							>
								{Object.entries(workerTokenRequest.headers)
									.map(
										([key, value]) =>
											`${key}: ${key === 'Authorization' && value.startsWith('Basic') ? 'Basic [base64_encoded_credentials]' : value}`
									)
									.join('\n')}
							</pre>
						</div>

						{/* Request Body - JSON Format */}
						<div>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>
								Request Body (as JSON for readability):
							</div>
							<pre
								style={{
									background: '#1e293b',
									color: '#e2e8f0',
									padding: '1rem',
									borderRadius: '0.5rem',
									overflowX: 'auto',
									fontSize: '0.875rem',
									lineHeight: '1.6',
									fontFamily: 'Monaco, Menlo, monospace',
								}}
							>
								{JSON.stringify(
									Object.fromEntries(
										workerTokenRequest.body.split('&').map((param) => {
											const [key, value] = param.split('=');
											return [
												key,
												key.includes('secret') ? '[REDACTED]' : decodeURIComponent(value),
											];
										})
									),
									null,
									2
								)}
							</pre>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#166534',
									marginTop: '0.5rem',
									fontStyle: 'italic',
								}}
							>
								Note: Actual request uses{' '}
								<code
									style={{
										background: 'white',
										padding: '0.125rem 0.25rem',
										borderRadius: '0.25rem',
									}}
								>
									application/x-www-form-urlencoded
								</code>{' '}
								format, but JSON is shown for clarity.
							</div>
						</div>
					</div>
				</div>
			)}

			{workerToken && (
				<div style={{ marginTop: '3rem', paddingBottom: '2rem' }}>
					<WorkerActions
						onNext={() => {
							navigate('/application-generator', {
								state: {
									workerToken,
									environmentId: workerCredentials.environmentId,
								},
							});
						}}
						onClearToken={() => {
							setWorkerToken(null);
							setTokenError(null);
							setWorkerTokenRequest(null);
							setTokenDecodeStates({});
							modernMessaging.showFooterMessage({
								type: 'status',
								message: 'Token cleared - credentials preserved',
								duration: 4000,
							});
						}}
						onClearAll={() => {
							localStorage.removeItem('app-generator-worker-credentials');
							setWorkerToken(null);
							setTokenError(null);
							setWorkerTokenRequest(null);
							setTokenDecodeStates({});
							setWorkerCredentials({
								environmentId: '',
								clientId: '',
								clientSecret: '',
								scopes: 'openid p1:create:application p1:read:application p1:update:application',
								tokenEndpointAuthMethod: 'client_secret_post',
							});
							modernMessaging.showFooterMessage({
								type: 'status',
								message: 'All credentials and data cleared',
								duration: 4000,
							});
						}}
					/>
				</div>
			)}
		</Container>
	);
};

export default ClientGenerator;
