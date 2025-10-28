// src/pages/flows/OAuthImplicitFlowV5_1.tsx
// Brand new OAuth Implicit Flow V5.1 using service-based architecture

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnvironmentIdInput from '../../components/EnvironmentIdInput';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import JWTTokenDisplay from '../../components/JWTTokenDisplay';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { FlowSequenceDisplay } from '../../components/FlowSequenceDisplay';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../../components/PingOneApplicationConfig';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { FlowAnalyticsService } from '../../services/flowAnalyticsService';
import { FlowComponentService } from '../../services/flowComponentService';
import { FlowConfigService } from '../../services/flowConfigService';
import { FlowControllerService } from '../../services/flowControllerService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowLayoutService } from '../../services/flowLayoutService';
import FlowStateService from '../../services/flowStateService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { useImplicitFlowController } from '../../hooks/useImplicitFlowController';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Service-generated styled components
const Container = FlowLayoutService.getContainerStyles();
const ContentWrapper = FlowLayoutService.getContentWrapperStyles();
const MainCard = FlowLayoutService.getMainCardStyles();
const StepHeader = FlowLayoutService.getStepHeaderStyles('orange'); // Orange theme for Implicit
const StepHeaderLeft = FlowLayoutService.getStepHeaderLeftStyles();
const StepHeaderRight = FlowLayoutService.getStepHeaderRightStyles();
const VersionBadge = FlowLayoutService.getVersionBadgeStyles('orange');
const StepHeaderTitle = FlowLayoutService.getStepHeaderTitleStyles();
const StepHeaderSubtitle = FlowLayoutService.getStepHeaderSubtitleStyles();
const StepNumber = FlowLayoutService.getStepNumberStyles();
const StepTotal = FlowLayoutService.getStepTotalStyles();
const StepContentWrapper = FlowLayoutService.getStepContentWrapperStyles();

// Service-generated collapsible components
const CollapsibleSection = FlowComponentService.createCollapsibleSection();
const CollapsibleHeaderButton = FlowComponentService.createCollapsibleHeaderButton('orange');
const CollapsibleTitle = FlowComponentService.createCollapsibleTitle();
const CollapsibleToggleIcon = FlowComponentService.createCollapsibleToggleIcon('blue');
const CollapsibleContent = FlowComponentService.createCollapsibleContent();

// Service-generated info components
const InfoBox = FlowComponentService.createInfoBox();
const InfoTitle = FlowComponentService.createInfoTitle();
const InfoText = FlowComponentService.createInfoText();
const RequirementsIndicator = FlowComponentService.createRequirementsIndicator();
const RequirementsIcon = FlowComponentService.createRequirementsIcon();
const RequirementsText = FlowComponentService.createRequirementsText();

// Service-generated action components
const Button = FlowComponentService.createButton();
const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

// Service-generated form components (removed unused ones)

// Service-generated results components
const ResultsSection = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const ResultsHeading = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HelperText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

// Service-generated parameter display components
const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const ParameterLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #ea580c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #7c2d12;
  word-break: break-all;
  background-color: #fff7ed;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #fed7aa;
`;

const GeneratedContentBox = styled.div`
  background-color: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  position: relative;
`;

const GeneratedLabel = styled.div`
  position: absolute;
  top: -10px;
  left: 16px;
  background-color: #ea580c;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const OAuthImplicitFlowV5_1: React.FC = () => {
	// Service-generated flow configuration
	const flowConfig = FlowConfigService.getFlowConfig('implicit');
	const serviceStepMetadata = flowConfig
		? FlowStateService.createStepMetadata(flowConfig.stepConfigs)
		: [];

	// Fallback step metadata if service-generated is empty
	const stepMetadata =
		serviceStepMetadata.length > 0
			? serviceStepMetadata
			: [
					{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the OAuth Implicit Flow' },
					{ title: 'Step 1: Configuration', subtitle: 'Configure credentials and parameters' },
					{
						title: 'Step 2: Authorization Request',
						subtitle: 'Build and launch authorization URL',
					},
					{ title: 'Step 3: Process Response', subtitle: 'Handle callback and extract tokens' },
					{ title: 'Step 4: Token Validation', subtitle: 'Validate received tokens' },
					{
						title: 'Step 5: User Info & Completion',
						subtitle: 'Fetch user info and complete flow',
					},
				];

	const introSectionKeys = FlowStateService.createIntroSectionKeys('implicit');
	// Add additional section keys for V5.1
	const additionalSectionKeys = ['pingOneConfig', 'credentials'];
	const allSectionKeys = [...introSectionKeys, ...additionalSectionKeys];
	const defaultCollapsedSections = FlowStateService.createDefaultCollapsedSections(allSectionKeys);

	// Use the same controller as V5.0 (this is the key fix!)
	const controller = useImplicitFlowController({
		flowKey: 'oauth-implicit-v5-1',
		defaultFlowVariant: 'oauth',
	});

	// Service-generated flow controller
	const flowController = FlowControllerService.createFlowController(
		{
			flowType: 'implicit',
			flowKey: 'oauth-implicit-v5-1',
			defaultFlowVariant: 'oauth',
			enableDebugger: true,
		},
		controller, // Pass the actual controller instance
		stepMetadata.length, // Use actual step count
		introSectionKeys
	);

	// Service-generated analytics tracking
	useEffect(() => {
		FlowAnalyticsService.trackFlowStart('implicit', 'oauth-implicit-v5-1');
		return () => FlowAnalyticsService.trackFlowComplete(true);
	}, []);

	// Service-generated state management
	const [collapsedSections, setCollapsedSections] = useState(defaultCollapsedSections);

	// PingOne configuration state
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'none', // Implicit flow doesn't use client authentication
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'OPTIONAL',
		responseTypeCode: false,
		responseTypeToken: true,
		responseTypeIdToken: true,
		grantTypeAuthorizationCode: false,
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
		requestParameterSignatureRequirement: 'DEFAULT',
		enableJWKS: false,
		jwksMethod: 'JWKS_URL',
		jwksUrl: '',
		jwks: '',
		requirePushedAuthorizationRequest: false,
		enableDPoP: false,
		dpopAlgorithm: 'ES256',
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});

	// Configuration management functions
	const handleSaveConfiguration = useCallback(async () => {
		const required = ['environmentId', 'clientId', 'redirectUri'];
		const missing = required.filter((field) => {
			const value =
				field === 'environmentId'
					? controller.credentials.environmentId
					: field === 'clientId'
						? controller.credentials.clientId
						: field === 'redirectUri'
							? controller.credentials.redirectUri
							: '';
			return !value || (typeof value === 'string' && !value.trim());
		});

		if (missing.length > 0) {
			console.warn('Missing required fields for saving configuration:', missing);
			v4ToastManager.showError(
				'Missing required fields: Complete all required fields before saving.'
			);
			return;
		}

		try {
			const config = {
				environmentId: controller.credentials.environmentId,
				clientId: controller.credentials.clientId,
				clientSecret: controller.credentials.clientSecret,
				redirectUri: controller.credentials.redirectUri,
				scopes: controller.credentials.scopes,
				loginHint: controller.credentials.loginHint,
				responseType: 'token',
				grantType: 'implicit',
				flowType: 'OAuthImplicitFlowV5_1',
			};

			localStorage.setItem('oauth-implicit-v5-1-config', JSON.stringify(config));
			console.log('Configuration saved successfully');
			v4ToastManager.showSuccess('Configuration saved successfully!');
		} catch (error) {
			console.error('Failed to save configuration:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to save configuration'
			);
		}
	}, [controller.credentials]);

	const handleLoadConfiguration = useCallback(
		(config?: {
			environmentId?: string;
			clientId?: string;
			clientSecret?: string;
			redirectUri?: string;
			scopes?: string;
			loginHint?: string;
			responseType?: string;
			grantType?: string;
			flowType?: string;
		}) => {
			if (!config) {
				// Load from localStorage
				try {
					const savedConfig = localStorage.getItem('oauth-implicit-v5-1-config');
					if (savedConfig) {
						const parsedConfig = JSON.parse(savedConfig);
						controller.setCredentials({
							...controller.credentials,
							environmentId: parsedConfig.environmentId || '',
							clientId: parsedConfig.clientId || '',
							clientSecret: parsedConfig.clientSecret || '',
							redirectUri: parsedConfig.redirectUri || 'https://localhost:3000/implicit-callback',
							scopes: parsedConfig.scopes || 'openid profile email',
							loginHint: parsedConfig.loginHint || '',
						});
						console.log('Configuration loaded from localStorage');
						v4ToastManager.showSuccess('Configuration loaded from saved settings.');
					} else {
						v4ToastManager.showError('No saved configuration found.');
					}
				} catch (error) {
					console.error('Failed to load configuration:', error);
					v4ToastManager.showError(
						error instanceof Error ? error.message : 'Failed to load configuration'
					);
				}
			} else {
				// Load from provided config
				controller.setCredentials({
					...controller.credentials,
					environmentId: config.environmentId || '',
					clientId: config.clientId || '',
					clientSecret: config.clientSecret || '',
					redirectUri: config.redirectUri || 'https://localhost:3000/implicit-callback',
					scopes: config.scopes || 'openid profile email',
					loginHint: config.loginHint || '',
				});
				console.log('Configuration loaded from provided config');
				v4ToastManager.showSuccess('Configuration loaded from provided settings.');
			}
		},
		[controller]
	);

	// PingOne configuration handlers
	const savePingOneConfig = useCallback((config: PingOneApplicationState) => {
		setPingOneConfig(config);
		console.log('PingOne configuration saved:', config);
		v4ToastManager.showSuccess('PingOne configuration updated successfully!');
	}, []);

	// Service-generated handlers
	const toggleSection = useCallback((key: string) => {
		setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	// Action handlers
	const handleGenerateAuthUrl = useCallback(async () => {
		if (!controller.credentials.clientId || !controller.credentials.environmentId) {
			v4ToastManager.showError(
				'Complete above action: Fill in Client ID and Environment ID first.'
			);
			return;
		}

		try {
			await controller.generateAuthorizationUrl();
			v4ToastManager.showSuccess('Authorization URL generated successfully!');
		} catch (error) {
			console.error('[OAuthImplicitFlowV5_1] Failed to generate authorization URL:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to generate authorization URL'
			);
		}
	}, [controller]);

	const handleValidateToken = useCallback(async () => {
		if (!controller.tokens?.access_token) {
			v4ToastManager.showError('Complete above action: Obtain tokens first.');
			return;
		}

		try {
			// Token validation would be implemented here
			v4ToastManager.showSuccess('Token validation would be implemented here.');
		} catch (error) {
			console.error('[OAuthImplicitFlowV5_1] Token validation failed:', error);
			v4ToastManager.showError(error instanceof Error ? error.message : 'Token validation failed');
		}
	}, [controller.tokens]);

	const handleFetchUserInfo = useCallback(async () => {
		if (!controller.tokens?.access_token) {
			v4ToastManager.showError('Complete above action: Obtain tokens first.');
			return;
		}

		try {
			// User info fetching would be implemented here
			v4ToastManager.showSuccess('User info fetching would be implemented here.');
		} catch (error) {
			console.error('[OAuthImplicitFlowV5_1] User info fetching failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'User info fetching failed'
			);
		}
	}, [controller.tokens]);

	// Controller provides handleCopy and handleFieldChange - no need to redefine

	// Service-generated step content
	
	const renderFlowSummary = useCallback(() => {
		const completionConfig = {
			...FlowCompletionConfigs.authorizationCode,
			onStartNewFlow: () => {
				// Add flow reset logic here
				setCurrentStep(0);
			},
			showUserInfo: false, // Update based on flow capabilities
			showIntrospection: false // Update based on flow capabilities
		};

		return (
			<FlowCompletionService
				config={completionConfig}
				collapsed={collapsedSections.flowSummary}
				onToggleCollapsed={() => toggleSection('flowSummary')}
			/>
		);
	}, [collapsedSections.flowSummary, toggleSection]);

const renderStepContent = useMemo(() => {
		const currentStep = flowController.state.currentStep;

		switch (currentStep) {
			case 0:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> OAuth Implicit Flow Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}></div>

									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>When to Use Implicit Flow</InfoTitle>
											<InfoText>
												OAuth Implicit Flow is designed for public clients (like SPAs) that cannot
												securely store a client secret. It's perfect for single-page applications
												and mobile apps.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<FlowConfigurationRequirements flowType="implicit" variant="oauth" />

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('credentials')}
								aria-expanded={!collapsedSections.credentials}
							>
								<CollapsibleTitle>
									<FiKey /> Application Configuration & Credentials
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.credentials && (
								<CollapsibleContent>
									<CredentialsInput
										environmentId={controller.credentials.environmentId || ''}
										clientId={controller.credentials.clientId || ''}
										clientSecret={''}
										redirectUri={controller.credentials.redirectUri || ''}
										scopes={controller.credentials.scopes || controller.credentials.scope || ''}
										loginHint={controller.credentials.loginHint || ''}
										onEnvironmentIdChange={(value) =>
											controller.setCredentials({ ...controller.credentials, environmentId: value })
										}
										onClientIdChange={(value) =>
											controller.setCredentials({ ...controller.credentials, clientId: value })
										}
										onClientSecretChange={() => {}} // Not used in Implicit
										onRedirectUriChange={(value) =>
											controller.setCredentials({ ...controller.credentials, redirectUri: value })
										}
										onScopesChange={(value) =>
											controller.setCredentials({ ...controller.credentials, scopes: value })
										}
										onLoginHintChange={(value) =>
											controller.setCredentials({ ...controller.credentials, loginHint: value })
										}
										onCopy={controller.handleCopy}
										emptyRequiredFields={new Set()}
										copiedField={controller.copiedField}
										showClientSecret={false}
									/>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('pingOneConfig')}
								aria-expanded={!collapsedSections.pingOneConfig}
							>
								<CollapsibleTitle>
									<FiSettings /> PingOne Application Configuration Requirements
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pingOneConfig}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.pingOneConfig && (
								<CollapsibleContent>
									<PingOneApplicationConfig 
										value={pingOneConfig} 
										onChange={savePingOneConfig}
										flowType="oauth-implicit-v5"
									/>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authRequestOverview')}
								aria-expanded={!collapsedSections.authRequestOverview}
							>
								<CollapsibleTitle>
									<FiGlobe /> Authorization Request Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authRequestOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiGlobe size={20} />
										<div>
											<InfoTitle>What is an Authorization Request?</InfoTitle>
											<InfoText>
												An authorization request redirects users to PingOne's authorization server
												where they authenticate and consent to sharing their information with your
												application. This is the first step in obtaining tokens.
											</InfoText>
										</div>
									</InfoBox>

									<div style={{ marginTop: '1.5rem' }}>
										<h4
											style={{
												fontSize: '1.1rem',
												fontWeight: '600',
												color: '#1f2937',
												marginBottom: '1rem',
											}}
										>
											Step-by-Step Process:
										</h4>
										<ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
											<li style={{ marginBottom: '1.5rem' }}>
												<strong>1. Build authorization URL</strong> - Construct the authorization
												endpoint URL with required parameters
												<br />
												<small style={{ color: '#64748b' }}>
													<strong>Technical Detail (URL/Endpoint):</strong>{' '}
													<code
														style={{
															background: '#f3f4f6',
															padding: '0.25rem 0.5rem',
															borderRadius: '0.25rem',
														}}
													>
														GET /as/authorize
													</code>
												</small>
												<br />
												<small style={{ color: '#64748b' }}>
													<strong>Required Parameters:</strong> response_type=token, client_id,
													redirect_uri, scope, state
												</small>
											</li>
											<li style={{ marginBottom: '1.5rem' }}>
												<strong>2. Redirect user to authorization server</strong> - Send user to
												PingOne's authorization endpoint
												<br />
												<small style={{ color: '#64748b' }}>
													<strong>Example URL:</strong>{' '}
													<code
														style={{
															background: '#f3f4f6',
															padding: '0.25rem 0.5rem',
															borderRadius: '0.25rem',
														}}
													>
														https://auth.pingone.com/{controller.credentials.environmentId}
														/as/authorize?response_type=token&client_id=...
													</code>
												</small>
											</li>
											<li style={{ marginBottom: '1.5rem' }}>
												<strong>3. User authenticates and authorizes</strong> - User logs in and
												grants permission
												<br />
												<small style={{ color: '#64748b' }}>
													<strong>User Sees:</strong> "Authorize 'My App' to access your account?"
													with scope details
												</small>
											</li>
											<li style={{ marginBottom: '1.5rem' }}>
												<strong>4. Server redirects back with tokens</strong> - PingOne returns to
												redirect_uri with tokens in URL fragment
												<br />
												<small style={{ color: '#64748b' }}>
													<strong>Response Format:</strong>{' '}
													<code
														style={{
															background: '#f3f4f6',
															padding: '0.25rem 0.5rem',
															borderRadius: '0.25rem',
														}}
													>
														https://myapp.com/callback#access_token=...&token_type=Bearer&expires_in=3600
													</code>
												</small>
											</li>
										</ol>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Generate Authorization URL
							</ResultsHeading>
							<HelperText>
								Generate the authorization URL with all required parameters. Review it carefully
								before redirecting users to ensure all parameters are correct.
							</HelperText>
							<ActionRow>
								<Button $variant="primary" onClick={handleGenerateAuthUrl}>
									<FiExternalLink /> Generate Authorization URL
								</Button>
							</ActionRow>
						</ResultsSection>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authResponseOverview')}
								aria-expanded={!collapsedSections.authResponseOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Authorization Response Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Authorization Response</InfoTitle>
											<InfoText>
												After authentication, PingOne returns you to the redirect URI with access
												tokens or error message in the URL fragment.
											</InfoText>
										</div>
									</InfoBox>

									<div style={{ marginTop: '1.5rem' }}>
										<h4
											style={{
												fontSize: '1.1rem',
												fontWeight: '600',
												color: '#1f2937',
												marginBottom: '1rem',
											}}
										>
											Response Details:
										</h4>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Success Response (URL Fragment):</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Format:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													https://myapp.com/callback#access_token=...&token_type=Bearer&expires_in=3600&state=...
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Parameters:</strong> access_token, token_type, expires_in, scope,
												state
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Error Response (URL Fragment):</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Format:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													https://myapp.com/callback#error=access_denied&error_description=...
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Common Errors:</strong> access_denied, invalid_request,
												unsupported_response_type, invalid_scope
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Token Extraction:</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>JavaScript Example:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													const params = new URLSearchParams(window.location.hash.substring(1));
												</code>
											</small>
										</div>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Authorization Response
							</ResultsHeading>
							<HelperText>
								The authorization response contains the access token and other information in the
								URL fragment.
							</HelperText>
							<GeneratedContentBox>
								<GeneratedLabel>Response</GeneratedLabel>
								{/* JWT Token Display with decoding capabilities */}
								{controller.tokens?.access_token && (
									<JWTTokenDisplay
										token={String(controller.tokens.access_token)}
										tokenType="access_token"
										onCopy={(tokenValue, label) => controller.handleCopy(tokenValue, label)}
										copyLabel="Access Token"
										showTokenType={true}
										showExpiry={true}
										{...(controller.tokens.expires_in && { expiresIn: Number(controller.tokens.expires_in) })}
										{...(controller.tokens.scope && { scope: String(controller.tokens.scope) })}
									/>
								)}

								{/* Additional token information */}
								<ParameterGrid>
									<div>
										<ParameterLabel>Token Type</ParameterLabel>
										<ParameterValue>Bearer</ParameterValue>
									</div>
									<div>
										<ParameterLabel>Expires In</ParameterLabel>
										<ParameterValue>3600</ParameterValue>
									</div>
									<div>
										<ParameterLabel>Scope</ParameterLabel>
										<ParameterValue>openid profile email</ParameterValue>
									</div>
								</ParameterGrid>
							</GeneratedContentBox>
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenValidationOverview')}
								aria-expanded={!collapsedSections.tokenValidationOverview}
							>
								<CollapsibleTitle>
									<FiShield /> Token Validation Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenValidationOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenValidationOverview && (
								<CollapsibleContent>
									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Token Validation</InfoTitle>
											<InfoText>
												Always validate tokens on your backend before using them. Never trust tokens
												that haven't been validated by your server.
											</InfoText>
										</div>
									</InfoBox>

									<div style={{ marginTop: '1.5rem' }}>
										<h4
											style={{
												fontSize: '1.1rem',
												fontWeight: '600',
												color: '#1f2937',
												marginBottom: '1rem',
											}}
										>
											Validation Methods:
										</h4>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>1. Token Introspection (Recommended)</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Endpoint:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													POST /as/introspect
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Request:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{'{ "token": "access_token", "token_type_hint": "access_token" }'}
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Response:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{'{ "active": true, "scope": "openid profile", "exp": 1234567890 }'}
												</code>
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>2. JWT Signature Verification</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>JWKS Endpoint:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													GET /.well-known/jwks.json
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Verify:</strong> Signature, expiration (exp), issuer (iss), audience
												(aud)
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>3. Local Validation (JWT only)</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Check:</strong> Token format, expiration time, required claims
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Note:</strong> Only validates structure, not revocation status
											</small>
										</div>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ResultsSection>
							<ResultsHeading>
								<FiShield size={18} /> Validate Access Token
							</ResultsHeading>
							<HelperText>
								Validate the access token to ensure it's legitimate and hasn't been tampered with.
							</HelperText>
							<ActionRow>
								<Button $variant="primary" onClick={handleValidateToken}>
									<FiShield /> Validate Token
								</Button>
							</ActionRow>
						</ResultsSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('userInfoOverview')}
								aria-expanded={!collapsedSections.userInfoOverview}
							>
								<CollapsibleTitle>
									<FiInfo /> UserInfo Endpoint Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.userInfoOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.userInfoOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>UserInfo Endpoint</InfoTitle>
											<InfoText>
												The UserInfo endpoint provides information about the authenticated user.
												This is part of the OpenID Connect specification.
											</InfoText>
										</div>
									</InfoBox>

									<div style={{ marginTop: '1.5rem' }}>
										<h4
											style={{
												fontSize: '1.1rem',
												fontWeight: '600',
												color: '#1f2937',
												marginBottom: '1rem',
											}}
										>
											UserInfo Details:
										</h4>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Endpoint:</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>URL:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													GET /as/userinfo
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Full URL:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													https://auth.pingone.com/{controller.credentials.environmentId}
													/as/userinfo
												</code>
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Authentication:</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Header:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													Authorization: Bearer {'{access_token}'}
												</code>
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Response Format:</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>JSON:</strong>{' '}
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{'{ "sub": "user123", "name": "John Doe", "email": "john@example.com" }'}
												</code>
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>Common Claims:</strong> sub, name, email, given_name, family_name,
												picture
											</small>
										</div>
										<div style={{ marginBottom: '1.5rem' }}>
											<strong>Error Handling:</strong>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>401 Unauthorized:</strong> Invalid or expired access token
											</small>
											<br />
											<small style={{ color: '#64748b' }}>
												<strong>403 Forbidden:</strong> Insufficient scope (missing 'openid' or
												'profile')
											</small>
										</div>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ResultsSection>
							<ResultsHeading>
								<FiInfo size={18} /> Fetch User Information
							</ResultsHeading>
							<HelperText>
								Use the access token to fetch user information from the UserInfo endpoint.
							</HelperText>
							<ActionRow>
								<Button $variant="primary" onClick={handleFetchUserInfo}>
									<FiInfo /> Fetch User Info
								</Button>
							</ActionRow>
						</ResultsSection>
					</>
				);

			case 5:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('completionOverview')}
								aria-expanded={!collapsedSections.completionOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Flow Complete
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.completionOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Congratulations!</InfoTitle>
											<InfoText>
												You have successfully completed the OAuth 2.0 Implicit Flow using the new
												V5.1 service architecture. This demonstrates how the new services make flows
												more consistent and maintainable.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Next Steps
							</ResultsHeading>
							<HelperText>
								Here are some next steps you can take with your OAuth implementation:
							</HelperText>
							<ul style={{ margin: '1rem 0', paddingLeft: '1.5rem' }}>
								<li>Implement token refresh logic</li>
								<li>Add token introspection</li>
								<li>Implement logout functionality</li>
								<li>Add error handling and retry logic</li>
							</ul>
						</ResultsSection>
					</>
				);

			default:
				return null;
		}
	}, [
		flowController.state.currentStep,
		collapsedSections,
		toggleSection,
		controller.copiedField,
		controller.credentials.clientId,
		controller.credentials.environmentId,
		controller.credentials.loginHint,
		controller.credentials.redirectUri,
		controller.credentials.scopes,
		pingOneConfig,
		savePingOneConfig,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-implicit-v5-1" />

				<EnhancedFlowInfoCard
					flowType="oauth-implicit"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowSequenceDisplay flowType="implicit" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>OAuth Implicit Flow · V5.1</VersionBadge>
							<StepHeaderTitle>
								{stepMetadata[flowController.state.currentStep].title}
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{stepMetadata[flowController.state.currentStep].subtitle}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>
								{String(flowController.state.currentStep + 1).padStart(2, '0')}
							</StepNumber>
							<StepTotal>of 07</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					{/* Step Requirements Indicator */}
					{!flowController.validation.isStepValid(flowController.state.currentStep) &&
						flowController.state.currentStep !== 0 && (
							<RequirementsIndicator>
								<RequirementsIcon>
									<FiAlertCircle />
								</RequirementsIcon>
								<RequirementsText>
									<strong>Complete this step to continue:</strong>
									<ul>
										{flowController.validation
											.getStepRequirements(flowController.state.currentStep)
											.map((requirement: string, index: number) => (
												<li key={index}>{requirement}</li>
											))}
									</ul>
								</RequirementsText>
							</RequirementsIndicator>
						)}

					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>

				{/* Environment ID Input */}
				<EnvironmentIdInput
					initialEnvironmentId={controller.credentials.environmentId || ''}
					onEnvironmentIdChange={(newEnvId) => {
						controller.setCredentials({
							...controller.credentials,
							environmentId: newEnvId,
						});
						// Auto-save if we have both environmentId and clientId
						if (newEnvId && controller.credentials.clientId && newEnvId.trim() && controller.credentials.clientId.trim()) {
							controller.saveCredentials();
							v4ToastManager.showSuccess('Credentials auto-saved');
						}
					}}
					onIssuerUrlChange={() => {}}
					showSuggestions={true}
					autoDiscover={false}
				/>

				{/* Credentials Input */}
				<CredentialsInput
					environmentId={controller.credentials.environmentId || ''}
					clientId={controller.credentials.clientId || ''}
					clientSecret={controller.credentials.clientSecret || ''}
					scopes={controller.credentials.scopes || 'openid profile email'}
					onEnvironmentIdChange={(newEnvId) => {
						controller.setCredentials({
							...controller.credentials,
							environmentId: newEnvId,
						});
					}}
					onClientIdChange={(newClientId) => {
						controller.setCredentials({
							...controller.credentials,
							clientId: newClientId,
						});
						// Auto-save if we have both environmentId and clientId
						if (controller.credentials.environmentId && newClientId && controller.credentials.environmentId.trim() && newClientId.trim()) {
							controller.saveCredentials();
							v4ToastManager.showSuccess('Credentials auto-saved');
						}
					}}
					onClientSecretChange={(newClientSecret) => {
						controller.setCredentials({
							...controller.credentials,
							clientSecret: newClientSecret,
						});
					}}
					onScopesChange={(newScopes) => {
						controller.setCredentials({
							...controller.credentials,
							scopes: newScopes,
						});
					}}
					onCopy={handleCopy}
					showRedirectUri={true}
					showLoginHint={true}
				/>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={flowController.state.currentStep}
				totalSteps={stepMetadata.length}
				onPrevious={flowController.navigation.handlePrev}
				onReset={flowController.navigation.handleReset}
				onNext={flowController.navigation.handleNext}
				canNavigateNext={flowController.navigation.canNavigateNext}
				isFirstStep={flowController.navigation.isFirstStep}
				nextButtonText={
					flowController.validation.isStepValid(flowController.state.currentStep)
						? 'Next'
						: 'Complete above action'
				}
				disabledMessage="Complete the action above to continue"
			/>
		</Container>
	);
};

export default OAuthImplicitFlowV5_1;
