// src/pages/flows/OIDCHybridFlowV5.tsx
// V5.0.0 OIDC Hybrid Flow - Full parity with Authorization Code Flow V5
// Supports: code id_token, code token, code id_token token

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import {
	FiInfo,
	FiShield,
	FiKey,
	FiCheckCircle,
	FiAlertCircle,
	FiCopy,
	FiExternalLink,
	FiChevronDown,
	FiZap,
	FiRefreshCw,
	FiSettings,
} from 'react-icons/fi';
import { useHybridFlow } from '../../hooks/useHybridFlow';
import { credentialManager } from '../../utils/credentialManager';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';

const LOG_PREFIX = '[🔀 OIDC-HYBRID]';

const log = {
	info: (message: string, ...args: any[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [INFO]`, message, ...args);
	},
	success: (message: string, ...args: any[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [SUCCESS]`, message, ...args);
	},
	error: (message: string, ...args: any[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.error(`${timestamp} ${LOG_PREFIX} [ERROR]`, message, ...args);
	},
};

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the OIDC Hybrid Flow' },
	{ title: 'Step 1: Configuration', subtitle: 'Configure credentials and response type' },
	{ title: 'Step 2: Authorization Request', subtitle: 'Build and launch authorization URL' },
	{ title: 'Step 3: Process Response', subtitle: 'Handle callback and validate tokens' },
	{ title: 'Step 4: Token Exchange', subtitle: 'Exchange code for additional tokens' },
	{ title: 'Step 5: Tokens Received', subtitle: 'View and analyze all tokens' },
	{ title: 'Step 6: Flow Complete', subtitle: 'Summary and next steps' },
] as const;

// Styled Components (V5 parity)
const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const HeaderSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const MainTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: 700;
	color: #1e293b;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #64748b;
	margin-bottom: 1.5rem;
`;

const Badge = styled.span`
	display: inline-block;
	padding: 0.375rem 0.75rem;
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
`;

const StepIndicator = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin-bottom: 2rem;
	padding: 1rem;
	background: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
	background: ${({ $active, $completed }) =>
		$completed ? '#10b981' : $active ? '#3b82f6' : '#e2e8f0'};
	color: ${({ $active, $completed }) => ($active || $completed ? 'white' : '#64748b')};
	transition: all 0.3s ease;
`;

const CollapsibleSection = styled.div`
	background: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 1.5rem;
	overflow: hidden;
`;

const CollapsibleHeader = styled.button`
	width: 100%;
	padding: 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: none;
	border: none;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #f8fafc;
	}
`;

const CollapsibleTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
`;

const CollapsibleContent = styled.div`
	padding: 0 1.5rem 1.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
			case 'error':
				return '#fee2e2';
			default:
				return '#dbeafe';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#fbbf24';
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
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
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	font-size: 1rem;
	background: white;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'outline' | 'success' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border: none;

	${({ $variant }) => {
		if ($variant === 'success') {
			return `
				background: #10b981;
				color: white;
				&:hover { background: #059669; }
			`;
		}
		if ($variant === 'outline') {
			return `
				background: white;
				color: #3b82f6;
				border: 2px solid #3b82f6;
				&:hover { background: #eff6ff; }
			`;
		}
		return `
			background: #3b82f6;
			color: white;
			&:hover { background: #2563eb; }
		`;
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const TokenDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Courier New', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	max-height: 300px;
	overflow-y: auto;
`;

const OIDCHybridFlowV5: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const hybridFlow = useHybridFlow();
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

	// Form state
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopes, setScopes] = useState('openid profile email');
	const [responseType, setResponseType] = useState<
		'code id_token' | 'code token' | 'code id_token token'
	>('code id_token');

	// Load credentials on mount
	useEffect(() => {
		const savedCreds = credentialManager.getAllCredentials();
		if (savedCreds.environmentId) setEnvironmentId(savedCreds.environmentId);
		if (savedCreds.clientId) setClientId(savedCreds.clientId);
		if (savedCreds.clientSecret) setClientSecret(savedCreds.clientSecret || '');
		if (savedCreds.scopes) setScopes(savedCreds.scopes.join(' '));
	}, []);

	// Check for callback tokens
	useEffect(() => {
		const tokensJson = sessionStorage.getItem('hybrid_tokens');
		if (tokensJson) {
			try {
				const tokens = JSON.parse(tokensJson);
				hybridFlow.setTokens(tokens);
				sessionStorage.removeItem('hybrid_tokens');
				setCurrentStep(3); // Move to process response step
				log.success('Tokens loaded from callback');
			} catch (err) {
				log.error('Failed to parse callback tokens', err);
			}
		}

		// Check for error from callback
		const error = searchParams.get('error');
		if (error) {
			hybridFlow.setError(decodeURIComponent(error));
			v4ToastManager.showError(error);
		}
	}, [searchParams]);

	const handleSaveCredentials = useCallback(() => {
		if (!environmentId || !clientId) {
			v4ToastManager.showError('Please enter Environment ID and Client ID');
			return;
		}

		hybridFlow.setCredentials({
			environmentId,
			clientId,
			clientSecret,
			scopes,
			responseType,
		});

		credentialManager.saveAllCredentials({
			environmentId,
			clientId,
			clientSecret,
			scopes: scopes.split(' '),
		});

		v4ToastManager.showSuccess('Credentials saved successfully!');
		log.info('Credentials saved');
	}, [environmentId, clientId, clientSecret, scopes, responseType, hybridFlow]);

	const handleStartAuthorization = useCallback(() => {
		try {
			const authUrl = hybridFlow.generateAuthorizationUrl();
			log.info('Redirecting to authorization URL');
			window.location.href = authUrl;
		} catch (err: any) {
			v4ToastManager.showError(err.message || 'Failed to generate authorization URL');
		}
	}, [hybridFlow]);

	const handleExchangeCode = useCallback(async () => {
		if (!hybridFlow.tokens?.code) {
			v4ToastManager.showError('No authorization code available');
			return;
		}

		try {
			await hybridFlow.exchangeCodeForTokens(hybridFlow.tokens.code);
			setCurrentStep(5); // Move to tokens received
		} catch (err: any) {
			// Error already handled in hook
		}
	}, [hybridFlow]);

	const toggleSection = (key: string) => {
		setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
	};

	const navigateToTokenManagement = useCallback(() => {
		if (hybridFlow.tokens?.access_token) {
			localStorage.setItem('token_to_analyze', hybridFlow.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'hybrid-v5');
			log.info('Navigating to Token Management with access token');
		}
		navigate('/token-management');
	}, [hybridFlow.tokens, navigate]);

	const navigateToTokenManagementWithIdToken = useCallback(() => {
		if (hybridFlow.tokens?.id_token) {
			localStorage.setItem('token_to_analyze', hybridFlow.tokens.id_token);
			localStorage.setItem('token_type', 'id');
			localStorage.setItem('flow_source', 'hybrid-v5');
			log.info('Navigating to Token Management with ID token');
		}
		navigate('/token-management');
	}, [hybridFlow.tokens, navigate]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return renderIntroduction();
			case 1:
				return renderConfiguration();
			case 2:
				return renderAuthorizationRequest();
			case 3:
				return renderProcessResponse();
			case 4:
				return renderTokenExchange();
			case 5:
				return renderTokensReceived();
			case 6:
				return renderCompletion();
			default:
				return null;
		}
	};

	const renderIntroduction = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('intro')}>
				<CollapsibleTitle>
					<FiInfo /> OIDC Hybrid Flow Overview
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.intro ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.intro && (
				<CollapsibleContent>
					<InfoBox $variant="info">
						<FiShield size={24} />
						<div>
							<strong>What is OIDC Hybrid Flow?</strong>
							<p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
								The Hybrid Flow combines Authorization Code and Implicit flows, allowing tokens to
								be returned from both the authorization endpoint (in the fragment) and the token
								endpoint. This provides flexibility for different client types and security
								requirements.
							</p>
						</div>
					</InfoBox>

					<InfoBox $variant="warning">
						<FiAlertCircle size={24} />
						<div>
							<strong>Response Types Supported:</strong>
							<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
								<li>
									<code>code id_token</code> - Returns code + ID token in fragment
								</li>
								<li>
									<code>code token</code> - Returns code + access token in fragment
								</li>
								<li>
									<code>code id_token token</code> - Returns code + ID token + access token in
									fragment
								</li>
							</ul>
						</div>
					</InfoBox>

					<InfoBox>
						<FiZap size={24} />
						<div>
							<strong>Key Features:</strong>
							<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
								<li>Immediate access to ID token for client-side validation</li>
								<li>Authorization code for secure token exchange</li>
								<li>Flexible security model for different client types</li>
								<li>Supports both public and confidential clients</li>
							</ul>
						</div>
					</InfoBox>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderConfiguration = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('config')}>
				<CollapsibleTitle>
					<FiSettings /> Configuration
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.config ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.config && (
				<CollapsibleContent>
					<FormGroup>
						<Label>Environment ID</Label>
						<Input
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Client ID</Label>
						<Input
							type="text"
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Client Secret (Optional for Public Clients)</Label>
						<Input
							type="password"
							value={clientSecret}
							onChange={(e) => setClientSecret(e.target.value)}
							placeholder="Enter client secret if confidential client"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Scopes</Label>
						<Input
							type="text"
							value={scopes}
							onChange={(e) => setScopes(e.target.value)}
							placeholder="openid profile email"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Response Type</Label>
						<Select value={responseType} onChange={(e) => setResponseType(e.target.value as any)}>
							<option value="code id_token">code id_token</option>
							<option value="code token">code token</option>
							<option value="code id_token token">code id_token token</option>
						</Select>
					</FormGroup>

					<Button onClick={handleSaveCredentials}>
						<FiCheckCircle /> Save Credentials
					</Button>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderAuthorizationRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('authReq')}>
				<CollapsibleTitle>
					<FiExternalLink /> Authorization Request
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.authReq ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.authReq && (
				<CollapsibleContent>
					<InfoBox>
						<FiInfo size={24} />
						<div>
							<p style={{ margin: 0 }}>
								Click the button below to start the authorization flow. You'll be redirected to
								PingOne where you can authenticate and authorize the application.
							</p>
						</div>
					</InfoBox>

					<Button onClick={handleStartAuthorization} disabled={!hybridFlow.credentials}>
						<FiExternalLink /> Start Authorization
					</Button>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderProcessResponse = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('response')}>
				<CollapsibleTitle>
					<FiCheckCircle /> Process Response
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.response ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.response && (
				<CollapsibleContent>
					{hybridFlow.tokens ? (
						<>
							<InfoBox $variant="success">
								<FiCheckCircle size={24} />
								<div>
									<strong>Authorization Response Received!</strong>
									<p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
										Tokens received from authorization endpoint. Click "Exchange Code" to get
										additional tokens from the token endpoint.
									</p>
								</div>
							</InfoBox>

							{hybridFlow.tokens.id_token && (
								<div style={{ marginTop: '1rem' }}>
									<Label>ID Token (from fragment)</Label>
									<TokenDisplay>{hybridFlow.tokens.id_token}</TokenDisplay>
									<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
										<Button onClick={() => handleCopy(hybridFlow.tokens!.id_token!, 'ID Token')}>
											<FiCopy /> Copy
										</Button>
										<Button onClick={navigateToTokenManagementWithIdToken} $variant="outline">
											<FiExternalLink /> Decode ID Token
										</Button>
									</div>
								</div>
							)}

							{hybridFlow.tokens.access_token && (
								<div style={{ marginTop: '1rem' }}>
									<Label>Access Token (from fragment)</Label>
									<TokenDisplay>{hybridFlow.tokens.access_token}</TokenDisplay>
									<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
										<Button
											onClick={() => handleCopy(hybridFlow.tokens!.access_token!, 'Access Token')}
										>
											<FiCopy /> Copy
										</Button>
										<Button onClick={navigateToTokenManagement} $variant="outline">
											<FiExternalLink /> Decode Access Token
										</Button>
									</div>
								</div>
							)}

							{hybridFlow.tokens.code && (
								<div style={{ marginTop: '1rem' }}>
									<Label>Authorization Code</Label>
									<TokenDisplay>{hybridFlow.tokens.code}</TokenDisplay>
								</div>
							)}
						</>
					) : (
						<InfoBox $variant="warning">
							<FiAlertCircle size={24} />
							<div>
								<p style={{ margin: 0 }}>
									Waiting for authorization response. Please complete the authorization flow.
								</p>
							</div>
						</InfoBox>
					)}
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenExchange = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('exchange')}>
				<CollapsibleTitle>
					<FiRefreshCw /> Token Exchange
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.exchange ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.exchange && (
				<CollapsibleContent>
					<InfoBox>
						<FiInfo size={24} />
						<div>
							<p style={{ margin: 0 }}>
								Exchange the authorization code for additional tokens (access token, refresh token,
								ID token) from the token endpoint.
							</p>
						</div>
					</InfoBox>

					<Button
						onClick={handleExchangeCode}
						disabled={!hybridFlow.tokens?.code || hybridFlow.isExchangingCode}
					>
						<FiRefreshCw />{' '}
						{hybridFlow.isExchangingCode ? 'Exchanging...' : 'Exchange Code for Tokens'}
					</Button>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokensReceived = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('tokens')}>
				<CollapsibleTitle>
					<FiKey /> Tokens Received
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.tokens ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.tokens && (
				<CollapsibleContent>
					<InfoBox $variant="success">
						<FiCheckCircle size={24} />
						<div>
							<strong>All Tokens Received!</strong>
							<p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
								You now have all tokens from both the authorization endpoint and token endpoint.
							</p>
						</div>
					</InfoBox>

					{hybridFlow.tokens?.access_token && (
						<div style={{ marginTop: '1rem' }}>
							<Label>Access Token</Label>
							<TokenDisplay>{hybridFlow.tokens.access_token}</TokenDisplay>
							<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
								<Button
									onClick={() => handleCopy(hybridFlow.tokens!.access_token!, 'Access Token')}
								>
									<FiCopy /> Copy
								</Button>
								<Button onClick={navigateToTokenManagement} $variant="outline">
									<FiExternalLink /> Analyze in Token Management
								</Button>
							</div>
						</div>
					)}

					{hybridFlow.tokens?.id_token && (
						<div style={{ marginTop: '1rem' }}>
							<Label>ID Token</Label>
							<TokenDisplay>{hybridFlow.tokens.id_token}</TokenDisplay>
							<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
								<Button onClick={() => handleCopy(hybridFlow.tokens!.id_token!, 'ID Token')}>
									<FiCopy /> Copy
								</Button>
								<Button onClick={navigateToTokenManagementWithIdToken} $variant="outline">
									<FiExternalLink /> Decode ID Token
								</Button>
							</div>
						</div>
					)}

					{hybridFlow.tokens?.refresh_token && (
						<div style={{ marginTop: '1rem' }}>
							<Label>Refresh Token</Label>
							<TokenDisplay>{hybridFlow.tokens.refresh_token}</TokenDisplay>
							<Button
								onClick={() => handleCopy(hybridFlow.tokens!.refresh_token!, 'Refresh Token')}
								style={{ marginTop: '0.5rem' }}
							>
								<FiCopy /> Copy Refresh Token
							</Button>
						</div>
					)}
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderCompletion = () => (
		<CollapsibleSection>
			<CollapsibleHeader onClick={() => toggleSection('complete')}>
				<CollapsibleTitle>
					<FiCheckCircle /> Flow Complete
				</CollapsibleTitle>
				<FiChevronDown
					style={{
						transform: collapsedSections.complete ? 'rotate(-90deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</CollapsibleHeader>
			{!collapsedSections.complete && (
				<CollapsibleContent>
					<InfoBox $variant="success">
						<FiCheckCircle size={24} />
						<div>
							<strong>Hybrid Flow Completed Successfully!</strong>
							<p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
								You've successfully completed the OIDC Hybrid Flow and received all tokens.
							</p>
						</div>
					</InfoBox>

					<div style={{ marginTop: '1.5rem' }}>
						<strong>Next Steps:</strong>
						<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
							<li>Analyze tokens in Token Management</li>
							<li>Test token introspection</li>
							<li>Try different response types</li>
							<li>Implement in your application</li>
						</ul>
					</div>

					<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
						<Button onClick={navigateToTokenManagement}>
							<FiExternalLink /> Go to Token Management
						</Button>
						<Button
							onClick={() => {
								hybridFlow.reset();
								setCurrentStep(0);
							}}
							$variant="outline"
						>
							<FiRefreshCw /> Start Over
						</Button>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	return (
		<Container>
			<ContentWrapper>
				<HeaderSection>
					<Badge>🔀 OIDC Hybrid Flow V5</Badge>
					<MainTitle>OIDC Hybrid Flow</MainTitle>
					<Subtitle>
						Combine Authorization Code and Implicit flows for flexible token delivery
					</Subtitle>
				</HeaderSection>

				<StepIndicator>
					{STEP_METADATA.map((_, index) => (
						<React.Fragment key={index}>
							<StepDot
								$active={currentStep === index}
								$completed={currentStep > index}
								onClick={() => setCurrentStep(index)}
								style={{ cursor: 'pointer' }}
							>
								{currentStep > index ? <FiCheckCircle /> : index}
							</StepDot>
							{index < STEP_METADATA.length - 1 && (
								<div
									style={{
										width: '2rem',
										height: '2px',
										background: currentStep > index ? '#10b981' : '#e2e8f0',
									}}
								/>
							)}
						</React.Fragment>
					))}
				</StepIndicator>

				<div style={{ marginBottom: '2rem' }}>
					<h2
						style={{
							fontSize: '1.5rem',
							fontWeight: '600',
							color: '#1e293b',
							marginBottom: '0.5rem',
						}}
					>
						{STEP_METADATA[currentStep].title}
					</h2>
					<p style={{ color: '#64748b' }}>{STEP_METADATA[currentStep].subtitle}</p>
				</div>

				{renderStepContent()}

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
					onNext={() => setCurrentStep(Math.min(STEP_METADATA.length - 1, currentStep + 1))}
					onReset={() => {
						hybridFlow.reset();
						setCurrentStep(0);
					}}
					canNavigateNext={true}
					isFirstStep={currentStep === 0}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default OIDCHybridFlowV5;
