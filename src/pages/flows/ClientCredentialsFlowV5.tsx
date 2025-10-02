// src/pages/flows/ClientCredentialsFlowV5.tsx
// OAuth 2.0 Client Credentials Flow - V5 Implementation
import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { ClientAuthMethod, useClientCredentialsFlow } from '../../hooks/useClientCredentialsFlow';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Service imports
import { FlowLayoutService } from '../../services/flowLayoutService';
import { FlowStateService } from '../../services/flowStateService';
import { FlowValidationService } from '../../services/flowValidationService';

// Flow configuration
const FLOW_TYPE = 'client-credentials';
const FLOW_THEME = 'blue';

// Service-generated styled components
const FlowContainer = FlowLayoutService.getContainerStyles();
const FlowContent = FlowLayoutService.getContentWrapperStyles();
const FlowHeader = FlowLayoutService.getStepHeaderStyles(FLOW_THEME);
const FlowTitle = FlowLayoutService.getStepHeaderTitleStyles();
const FlowSubtitle = FlowLayoutService.getStepHeaderSubtitleStyles();
const StepBadge = FlowLayoutService.getVersionBadgeStyles(FLOW_THEME);

const CollapsibleSection = FlowLayoutService.getCollapsibleSectionStyles();
const CollapsibleHeaderButton = FlowLayoutService.getCollapsibleHeaderButtonStyles();
const CollapsibleTitle = FlowLayoutService.getCollapsibleTitleStyles();
const CollapsibleToggleIcon = FlowLayoutService.getCollapsibleToggleIconStyles();
const CollapsibleContent = FlowLayoutService.getCollapsibleContentStyles();

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-text-primary, #1e293b);
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	font-size: 1rem;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.5rem;
	background-color: var(--color-surface, #ffffff);
	color: var(--color-text-primary, #1e293b);
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: var(--color-primary, #7c3aed);
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}

	&:disabled {
		background-color: #f1f5f9;
		cursor: not-allowed;
	}
`;

const PasswordInputWrapper = styled.div`
	position: relative;
	width: 100%;
`;

const PasswordToggleButton = styled.button`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	color: var(--color-text-secondary, #64748b);
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s;

	&:hover {
		color: var(--color-primary, #7c3aed);
	}

	&:focus {
		outline: none;
		color: var(--color-primary, #7c3aed);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	font-size: 1rem;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.5rem;
	background-color: var(--color-surface, #ffffff);
	color: var(--color-text-primary, #1e293b);
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: var(--color-primary, #7c3aed);
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.5rem;
	background-color: var(--color-surface, #ffffff);
	color: var(--color-text-primary, #1e293b);
	transition: border-color 0.2s, box-shadow 0.2s;
	min-height: 120px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: var(--color-primary, #7c3aed);
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'outline' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 1rem;
	font-weight: 600;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: 2px solid;

	${(props) => {
		if (props.$variant === 'danger') {
			return `
				background-color: #ef4444;
				border-color: #ef4444;
				color: #ffffff;
				&:hover:not(:disabled) {
					background-color: #dc2626;
					border-color: #dc2626;
				}
			`;
		}
		if (props.$variant === 'outline') {
			return `
				background-color: transparent;
				border-color: var(--color-primary, #7c3aed);
				color: var(--color-primary, #7c3aed);
				&:hover:not(:disabled) {
					background-color: rgba(124, 58, 237, 0.1);
				}
			`;
		}
		return `
			background-color: var(--color-primary, #7c3aed);
			border-color: var(--color-primary, #7c3aed);
			color: #ffffff;
			&:hover:not(:disabled) {
				background-color: #6d28d9;
				border-color: #6d28d9;
			}
		`;
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 1.5rem;
	flex-wrap: wrap;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;

	${(props) => {
		switch (props.$variant) {
			case 'warning':
				return `
					background-color: #fef3c7;
					border: 1px solid #fbbf24;
					color: #92400e;
				`;
			case 'success':
				return `
					background-color: #dcfce7;
					border: 1px solid #4ade80;
					color: #166534;
				`;
			case 'error':
				return `
					background-color: #fee2e2;
					border: 1px solid #f87171;
					color: #991b1b;
				`;
			default:
				return `
					background-color: #dbeafe;
					border: 1px solid #60a5fa;
					color: #1e40af;
				`;
		}
	}}

	svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
`;

const InfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.875rem;
	line-height: 1.6;
	margin: 0;
`;

const TokenDisplay = styled.div`
	background: #f0fdf4;
	color: #15803d;
	border: 2px solid #16a34a;
	border-radius: 0.5rem;
	padding: 1rem;
	box-shadow: 0 1px 3px rgba(22, 163, 74, 0.1);
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	position: relative;
`;

const TokenMask = styled.div`
	filter: blur(4px);
	user-select: none;
`;

const ExpiryChip = styled.span<{ $expired?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${(props) => (props.$expired ? '#fee2e2' : '#dcfce7')};
	color: ${(props) => (props.$expired ? '#991b1b' : '#166534')};
	border: 1px solid ${(props) => (props.$expired ? '#f87171' : '#4ade80')};
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterItem = styled.div`
	padding: 0.75rem;
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.25rem;
`;

const ParameterValue = styled.div`
	font-size: 0.875rem;
	color: #1e293b;
	font-weight: 500;
	word-break: break-word;
`;

// Step configuration
const STEP_CONFIGS = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Flow' },
	{ title: 'Step 1: Configuration', subtitle: 'Set up credentials and parameters' },
	{ title: 'Step 2: Token Exchange', subtitle: 'Exchange client credentials for access token' },
	{ title: 'Step 3: Security Features', subtitle: 'Advanced security demonstrations' },
];

// Service-generated metadata
const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);
const INTRO_SECTION_KEYS = FlowStateService.createIntroSectionKeys(FLOW_TYPE);
const DEFAULT_COLLAPSED_SECTIONS = FlowStateService.createDefaultCollapsedSections(INTRO_SECTION_KEYS);

const ClientCredentialsFlowV5: React.FC = () => {
	const clientCredsFlow = useClientCredentialsFlow();

	// State management using services
	const [currentStep] = useState(0);
	const [formData, setFormData] = useState({
		issuer: clientCredsFlow.config?.issuer || '',
		clientId: clientCredsFlow.config?.clientId || '',
		clientSecret: clientCredsFlow.config?.clientSecret || '',
		authMethod: clientCredsFlow.config?.authMethod || ('client_secret_post' as ClientAuthMethod),
		scopes: clientCredsFlow.config?.scopes || 'api:read api:write',
		audience: clientCredsFlow.config?.audience || '',
		resource: clientCredsFlow.config?.resource || '',
		tokenEndpoint: clientCredsFlow.config?.tokenEndpoint || '',
		jwtSigningAlg: clientCredsFlow.config?.jwtSigningAlg || 'HS256',
		jwtSigningKid: clientCredsFlow.config?.jwtSigningKid || '',
		jwtPrivateKey: clientCredsFlow.config?.jwtPrivateKey || '',
		enableMtls: clientCredsFlow.config?.enableMtls || false,
	});

	const [showTokens, setShowTokens] = useState(false);
	const [showSecret, setShowSecret] = useState(false);
	const [collapsedSections, setCollapsedSections] = useState(DEFAULT_COLLAPSED_SECTIONS);

	// Service-generated handlers
	const toggleSectionHandler = FlowStateService.createToggleSectionHandler(setCollapsedSections);

	// Validation - simplified for now
	const isStepValid = useCallback((stepIndex: number) => {
		switch (stepIndex) {
			case 0: return true; // Introduction step
			case 1: return !!(formData.clientId && formData.clientSecret);
			case 2: return !!(clientCredsFlow.tokens?.access_token);
			case 3: return true; // Security features step
			default: return true;
		}
	}, [formData, clientCredsFlow.tokens]);

	const getStepRequirements = useCallback((stepIndex: number) => 
		FlowValidationService.getStepRequirements(stepIndex, FLOW_TYPE), 
		[]
	);

	// Load saved config on mount
	useEffect(() => {
		if (clientCredsFlow.config) {
			const config = clientCredsFlow.config;
			setFormData(prev => ({
				...prev,
				issuer: config.issuer || '',
				clientId: config.clientId || '',
				clientSecret: config.clientSecret || '',
				authMethod: config.authMethod || 'client_secret_post',
				scopes: config.scopes || 'api:read api:write',
				audience: config.audience || '',
				resource: config.resource || '',
				tokenEndpoint: config.tokenEndpoint || '',
				jwtSigningAlg: config.jwtSigningAlg || 'HS256',
				jwtSigningKid: config.jwtSigningKid || '',
				jwtPrivateKey: config.jwtPrivateKey || '',
				enableMtls: config.enableMtls || false,
			}));
		}
	}, [clientCredsFlow.config]);

	// Remove duplicate toggleSection function - using toggleSectionHandler from service

	const handleInputChange = useCallback((field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleSaveConfiguration = useCallback(() => {
		clientCredsFlow.setConfig({
			issuer: formData.issuer,
			clientId: formData.clientId,
			clientSecret: formData.clientSecret,
			authMethod: formData.authMethod,
			scopes: formData.scopes,
			audience: formData.audience,
			resource: formData.resource,
			tokenEndpoint: formData.tokenEndpoint,
			jwtSigningAlg: formData.jwtSigningAlg,
			jwtSigningKid: formData.jwtSigningKid,
			jwtPrivateKey: formData.jwtPrivateKey,
			enableMtls: formData.enableMtls,
		});
		v4ToastManager.showSuccess('Configuration saved!');
	}, [formData, clientCredsFlow]);

	const handleRequestToken = useCallback(async () => {
		await clientCredsFlow.requestToken();
		setCollapsedSections((prev) => ({ ...prev, tokens: false }));
	}, [clientCredsFlow]);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
	}, []);

	const handleReset = useCallback(() => {
		clientCredsFlow.reset();
		setShowTokens(false);
	}, [clientCredsFlow]);

	const renderConfiguration = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSectionHandler('configuration')}
				aria-expanded={!collapsedSections.configuration}
			>
				<CollapsibleTitle>
					<FiZap /> Configuration
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.configuration}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.configuration && (
				<CollapsibleContent>
					{/* Environment ID removed - not part of ClientCredentialsConfig */}

					<FormGroup>
						<Label>Issuer URL *</Label>
						<Input
							type="text"
							placeholder="https://auth.pingone.com/{environmentId}"
							value={formData.issuer}
							onChange={(e) => handleInputChange('issuer', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Client ID *</Label>
						<Input
							type="text"
							placeholder="your-client-id"
							value={formData.clientId}
							onChange={(e) => handleInputChange('clientId', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Authentication Method *</Label>
						<Select
							value={formData.authMethod}
							onChange={(e) => handleInputChange('authMethod', e.target.value)}
						>
							<option value="client_secret_post">Client Secret (POST body)</option>
							<option value="client_secret_basic">Client Secret (Basic Auth)</option>
							<option value="client_secret_jwt">Client Secret JWT</option>
							<option value="private_key_jwt">Private Key JWT</option>
							<option value="tls_client_auth">mTLS</option>
							<option value="none">None (Public Client)</option>
						</Select>
					</FormGroup>

					{formData.authMethod !== 'none' &&
						!formData.authMethod.includes('jwt') &&
						formData.authMethod !== 'tls_client_auth' && (
							<FormGroup>
								<Label>Client Secret *</Label>
								<PasswordInputWrapper>
									<Input
										type={showSecret ? 'text' : 'password'}
										placeholder="your-client-secret"
										value={formData.clientSecret}
										onChange={(e) => handleInputChange('clientSecret', e.target.value)}
										style={{ paddingRight: '3rem' }}
									/>
									<PasswordToggleButton
										type="button"
										onClick={() => setShowSecret(!showSecret)}
										aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
									>
										{showSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
									</PasswordToggleButton>
								</PasswordInputWrapper>
							</FormGroup>
						)}

					{(formData.authMethod === 'client_secret_jwt' ||
						formData.authMethod === 'private_key_jwt') && (
						<>
							<FormGroup>
								<Label>JWT Signing Algorithm</Label>
								<Select
									value={formData.jwtSigningAlg}
									onChange={(e) => handleInputChange('jwtSigningAlg', e.target.value)}
								>
									<option value="HS256">HS256</option>
									<option value="HS384">HS384</option>
									<option value="HS512">HS512</option>
									<option value="RS256">RS256</option>
									<option value="RS384">RS384</option>
									<option value="RS512">RS512</option>
									<option value="ES256">ES256</option>
									<option value="ES384">ES384</option>
									<option value="ES512">ES512</option>
								</Select>
							</FormGroup>

							<FormGroup>
								<Label>Key ID (kid) - Optional</Label>
								<Input
									type="text"
									placeholder="optional-key-id"
									value={formData.jwtSigningKid}
									onChange={(e) => handleInputChange('jwtSigningKid', e.target.value)}
								/>
							</FormGroup>

							<FormGroup>
								<Label>Private Key (PEM format)</Label>
								<TextArea
									placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
									value={formData.jwtPrivateKey}
									onChange={(e) => handleInputChange('jwtPrivateKey', e.target.value)}
								/>
								<InfoBox $variant="warning">
									<FiAlertCircle size={20} />
									<div>
										<InfoText>
											<strong>Note:</strong> JWT assertion generation requires backend
											implementation for proper cryptographic signing. This demo uses placeholder
											signatures.
										</InfoText>
									</div>
								</InfoBox>
							</FormGroup>
						</>
					)}

					<FormGroup>
						<Label>Scopes *</Label>
						<Input
							type="text"
							placeholder="api:read api:write"
							value={formData.scopes}
							onChange={(e) => handleInputChange('scopes', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Audience - Optional</Label>
						<Input
							type="text"
							placeholder="https://api.example.com"
							value={formData.audience}
							onChange={(e) => handleInputChange('audience', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Resource - Optional</Label>
						<Input
							type="text"
							placeholder="urn:example:resource"
							value={formData.resource}
							onChange={(e) => handleInputChange('resource', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Token Endpoint - Optional (auto-derived if empty)</Label>
						<Input
							type="text"
							placeholder="{issuer}/as/token"
							value={formData.tokenEndpoint}
							onChange={(e) => handleInputChange('tokenEndpoint', e.target.value)}
						/>
					</FormGroup>

					<ActionRow>
						<Button onClick={handleSaveConfiguration}>
							<FiCheckCircle /> Save Configuration
						</Button>
					</ActionRow>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderHowItWorks = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSectionHandler('howItWorks')}
				aria-expanded={!collapsedSections.howItWorks}
			>
				<CollapsibleTitle>
					<FiInfo /> How It Works
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.howItWorks}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.howItWorks && (
				<CollapsibleContent>
					<ExplanationSection>
						<ExplanationHeading>
							<FiServer /> Client Credentials Flow Overview
						</ExplanationHeading>
						<InfoText>
							The Client Credentials flow is used for <strong>server-to-server</strong>{' '}
							(machine-to-machine) authentication where no user is involved. The client
							authenticates directly with the authorization server using its credentials to obtain
							an access token.
						</InfoText>
					</ExplanationSection>

					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>When to Use This Flow</InfoTitle>
							<InfoText>
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										<strong>Backend Services</strong>: API-to-API communication
									</li>
									<li>
										<strong>Batch Jobs</strong>: Scheduled tasks and cron jobs
									</li>
									<li>
										<strong>Microservices</strong>: Service-to-service calls
									</li>
									<li>
										<strong>IoT Devices</strong>: Trusted device authentication
									</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>

					<div style={{ marginTop: '1.5rem' }}>
						<ExplanationHeading style={{ fontSize: '1.1rem' }}>
							<FiZap /> Flow Steps
						</ExplanationHeading>
						<ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
							<li>Client authenticates with authorization server using configured method</li>
							<li>Authorization server validates credentials</li>
							<li>Server issues access token (and optionally refresh token)</li>
							<li>Client uses access token to access protected resources</li>
						</ol>
					</div>

					<InfoBox $variant="warning">
						<FiShield size={20} />
						<div>
							<InfoTitle>Security Best Practices</InfoTitle>
							<InfoText>
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										Prefer <code>private_key_jwt</code> over client secrets
									</li>
									<li>Use mTLS when available for highest security</li>
									<li>Never log or expose client secrets or tokens</li>
									<li>Rotate credentials regularly</li>
									<li>Use short-lived tokens with appropriate scopes</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>

					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Refresh Token Caveats & Considerations</InfoTitle>
							<InfoText>
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										<strong>Configuration-Dependent:</strong> Whether a refresh token is issued
										depends on client settings and policy configuration in your Authorization Server
										(e.g., PingOne)
									</li>
									<li>
										<strong>Not Always Enabled:</strong> Some security-conscious setups may disable
										refresh tokens for Client Credentials to reduce risk from long-lived tokens
									</li>
									<li>
										<strong>Opt-In Required:</strong> Default behavior may not include refresh
										tokens — you may need to explicitly enable them in client or realm settings
									</li>
									<li>
										<strong>Best Practice:</strong> Even if refresh tokens are issued, combine them
										with rotation, short lifetimes, and protective measures (PingOne supports
										refresh token rotation)
									</li>
									<li>
										<strong>M2M Context:</strong> Many implementations skip refresh tokens for
										Client Credentials since the client can always request a new access token
										directly
									</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => handleRequestToken} aria-expanded={true}>
				<CollapsibleTitle>
					<FiKey /> Request Access Token
				</CollapsibleTitle>
			</CollapsibleHeaderButton>
			<CollapsibleContent>
				{!clientCredsFlow.config ? (
					<InfoBox $variant="warning">
						<FiAlertCircle size={20} />
						<div>
							<InfoTitle>Configuration Required</InfoTitle>
							<InfoText>
								Please configure the flow settings above before requesting a token.
							</InfoText>
						</div>
					</InfoBox>
				) : (
					<>
						<InfoText style={{ marginBottom: '1rem' }}>
							Click the button below to request an access token using the Client Credentials flow.
							The token will be obtained directly from the authorization server without user
							interaction.
						</InfoText>

						<ActionRow>
							<Button onClick={handleRequestToken} disabled={clientCredsFlow.isRequesting}>
								{clientCredsFlow.isRequesting ? (
									<>
										<FiRefreshCw className="spin" /> Requesting...
									</>
								) : (
									<>
										<FiKey /> Request Token
									</>
								)}
							</Button>

							{clientCredsFlow.tokens && (
								<Button $variant="danger" onClick={handleReset}>
									<FiRefreshCw /> Reset Flow
								</Button>
							)}
						</ActionRow>

						{clientCredsFlow.error && (
							<InfoBox $variant="error">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Error</InfoTitle>
									<InfoText>{clientCredsFlow.error}</InfoText>
								</div>
							</InfoBox>
						)}
					</>
				)}
			</CollapsibleContent>
		</CollapsibleSection>
	);

	const renderTokens = () => {
		if (!clientCredsFlow.tokens) return null;

		const isExpired = clientCredsFlow.isTokenExpired();

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSectionHandler('tokens')}
					aria-expanded={!collapsedSections.tokens}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Access Token
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokens}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokens && (
					<CollapsibleContent>
						<ResultsSection>
							<ResultsHeading>
								<FiKey size={18} /> Token Details
							</ResultsHeading>

							<ParameterGrid>
								<ParameterItem>
									<ParameterLabel>Token Type</ParameterLabel>
									<ParameterValue>{clientCredsFlow.tokens.token_type}</ParameterValue>
								</ParameterItem>

								{clientCredsFlow.tokens.expires_in && (
									<ParameterItem>
										<ParameterLabel>Expires In</ParameterLabel>
										<ParameterValue>
											<ExpiryChip $expired={isExpired}>
												<FiClock size={12} />
												{clientCredsFlow.formatExpiry(clientCredsFlow.tokens.expires_in)}
												{isExpired && ' (Expired)'}
											</ExpiryChip>
										</ParameterValue>
									</ParameterItem>
								)}

								{clientCredsFlow.tokens.scope && (
									<ParameterItem>
										<ParameterLabel>Granted Scopes</ParameterLabel>
										<ParameterValue>{clientCredsFlow.tokens.scope}</ParameterValue>
									</ParameterItem>
								)}
							</ParameterGrid>

							<div style={{ marginTop: '1.5rem' }}>
								<Label>Access Token</Label>
								<TokenDisplay>
									{showTokens ? (
										clientCredsFlow.tokens.access_token
									) : (
										<TokenMask>{clientCredsFlow.tokens.access_token.replace(/./g, '•')}</TokenMask>
									)}
								</TokenDisplay>

								<ActionRow>
									<Button $variant="outline" onClick={() => setShowTokens(!showTokens)}>
										<FiKey /> {showTokens ? 'Mask' : 'Reveal'} Token
									</Button>
									<Button
										$variant="outline"
										onClick={() => handleCopy(clientCredsFlow.tokens!.access_token, 'Access Token')}
									>
										<FiCopy /> Copy Token
									</Button>
									<Button
										$variant="outline"
										onClick={() => {
											localStorage.setItem(
												'token_to_analyze',
												clientCredsFlow.tokens!.access_token
											);
											localStorage.setItem('token_type', 'access');
											localStorage.setItem('flow_source', 'client-credentials-v5');
											window.location.href = '/token-management';
										}}
									>
										<FiExternalLink /> View in Token Management
									</Button>
								</ActionRow>
							</div>

							{clientCredsFlow.decodedToken && (
								<div style={{ marginTop: '1.5rem' }}>
									<ExplanationHeading style={{ fontSize: '1.1rem' }}>
										<FiShield /> Decoded JWT
									</ExplanationHeading>

									<div style={{ marginTop: '1rem' }}>
										<Label>Header</Label>
										<TokenDisplay>
											<pre>{JSON.stringify(clientCredsFlow.decodedToken.header, null, 2)}</pre>
										</TokenDisplay>
									</div>

									<div style={{ marginTop: '1rem' }}>
										<Label>Payload</Label>
										<TokenDisplay>
											<pre>{JSON.stringify(clientCredsFlow.decodedToken.payload, null, 2)}</pre>
										</TokenDisplay>
									</div>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>JWT Claims</InfoTitle>
											<InfoText>
												<strong>Issuer (iss):</strong>{' '}
												{clientCredsFlow.decodedToken.payload.iss || 'N/A'}
												<br />
												<strong>Subject (sub):</strong>{' '}
												{clientCredsFlow.decodedToken.payload.sub || 'N/A'}
												<br />
												<strong>Audience (aud):</strong>{' '}
												{Array.isArray(clientCredsFlow.decodedToken.payload.aud)
													? clientCredsFlow.decodedToken.payload.aud.join(', ')
													: clientCredsFlow.decodedToken.payload.aud || 'N/A'}
												<br />
												<strong>Expires:</strong>{' '}
												{clientCredsFlow.decodedToken.payload.exp
													? new Date(
															clientCredsFlow.decodedToken.payload.exp * 1000
														).toLocaleString()
													: 'N/A'}
											</InfoText>
										</div>
									</InfoBox>
								</div>
							)}

							{!clientCredsFlow.decodedToken && (
								<InfoBox $variant="info">
									<FiInfo size={20} />
									<div>
										<InfoTitle>Opaque Token</InfoTitle>
										<InfoText>
											This access token is opaque (not a JWT). Use token introspection to retrieve
											metadata about the token. Navigate to the Token Management page for
											introspection capabilities.
										</InfoText>
									</div>
								</InfoBox>
							)}
						</ResultsSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	// Render step content
	const renderStepContent = useCallback(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="client-credentials" variant="oauth" />
						
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSectionHandler('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> Flow Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<FlowInfoCard flowInfo={getFlowInfo('client-credentials')!} />
									<FlowSequenceDisplay flowType="client-credentials" />
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 1:
				return renderConfiguration();

			case 2:
				return (
					<>
						{renderTokenRequest()}
						{renderTokens()}
					</>
				);

			case 3:
				return renderHowItWorks();

			default:
				return null;
		}
	}, [currentStep, collapsedSections, toggleSectionHandler, renderConfiguration, renderTokenRequest, renderTokens, renderHowItWorks]);

	return (
		<FlowContainer>
			<FlowContent>
				<FlowHeader>
					<div>
						<StepBadge>Client Credentials Flow · V5</StepBadge>
						<FlowTitle>{STEP_METADATA[currentStep].title}</FlowTitle>
						<FlowSubtitle>{STEP_METADATA[currentStep].subtitle}</FlowSubtitle>
					</div>
					<div style={{ textAlign: 'right' }}>
						<div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>
							{String(currentStep + 1).padStart(2, '0')}
						</div>
						<div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.75)', letterSpacing: '0.05em' }}>
							of {String(STEP_METADATA.length).padStart(2, '0')}
						</div>
					</div>
				</FlowHeader>

				{!isStepValid(currentStep) && currentStep !== 0 && (
					<div style={{
						background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
						border: '1px solid #f59e0b',
						borderRadius: '8px',
						padding: '1rem',
						margin: '1rem 0',
						display: 'flex',
						alignItems: 'flex-start',
						gap: '0.75rem'
					}}>
						<div style={{ color: '#d97706', fontSize: '1.25rem', marginTop: '0.125rem', flexShrink: 0 }}>
							<FiAlertCircle />
						</div>
						<div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: 1.5 }}>
							<strong style={{ display: 'block', marginBottom: '0.5rem' }}>Complete this step to continue:</strong>
							<ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
								{getStepRequirements(currentStep).map((requirement, index) => (
									<li key={index}>{requirement}</li>
								))}
							</ul>
						</div>
					</div>
				)}

				<div style={{ padding: '2rem', background: '#ffffff' }}>
					{renderStepContent()}
				</div>
			</FlowContent>
		</FlowContainer>
	);
};

export default ClientCredentialsFlowV5;
