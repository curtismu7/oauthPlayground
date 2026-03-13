// src/pages/flows/v9/PARFlowV9.tsx
// lint-file-disable: token-value-in-jsx
// V9 PAR (Pushed Authorization Requests) Flow - RFC 9126 mock/educational app

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import ColoredUrlDisplay from '../../../components/ColoredUrlDisplay';
import { StandardizedCredentialExportImport } from '../../../components/StandardizedCredentialExportImport';
import { usePageStepper } from '../../../contexts/FloatingStepperContext';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { FlowUIService } from '../../../services/flowUIService';
import { V9FlowCredentialService } from '../../../services/v9/core/V9FlowCredentialService';
import { EnvironmentIdServiceV8 } from '../../../services/v9/environmentIdServiceV9';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import { V7MMockBanner } from '../../../v7/components/V7MMockBanner';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import WorkerTokenStatusDisplayV8 from '../../../v8/components/WorkerTokenStatusDisplayV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

const maskToken = (token: string): string => {
	if (!token || token.length <= 12) return '••••••••';
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

const {
	Container,
	ContentWrapper,
	MainCard,
	StepContentWrapper,
	CollapsibleSection,
	CollapsibleHeaderButton,
	CollapsibleTitle,
	CollapsibleToggleIcon,
	CollapsibleContent,
	SectionDivider,
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	HelperText,
	FormGroup,
	Label,
	Input,
	Button,
	CodeBlock,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	GeneratedContentBox,
} = FlowUIService.getFlowUIComponents();

const PRIMARY_BLUE = V9_COLORS.PRIMARY.BLUE;
const DARK_BLUE = V9_COLORS.PRIMARY.BLUE_DARK;
const BORDER = V9_COLORS.TEXT.GRAY_LIGHTER;
const LIGHT_BLUE_BG = V9_COLORS.BG.GRAY_LIGHT;
const WHITE = V9_COLORS.TEXT.WHITE;
const TEXT_PRIMARY = V9_COLORS.TEXT.GRAY_DARK;
const TEXT_SECONDARY = V9_COLORS.TEXT.GRAY_MEDIUM;

const ResponsiveContainer = styled(Container)`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem;
	border: 1px solid ${BORDER};
	@media (max-width: 768px) {
		padding: 0.5rem;
		max-width: 100%;
	}
	@media (max-width: 480px) {
		padding: 0.25rem;
	}
`;

const ResponsiveContentWrapper = styled(ContentWrapper)`
	max-width: 100%;
	overflow: hidden;
	@media (max-width: 768px) {
		padding: 0;
	}
`;

const ResponsiveMainCard = styled(MainCard)`
	padding: 1rem;
	max-width: 100%;
	border: 1px solid ${BORDER};
	background-color: ${WHITE};
	@media (max-width: 768px) {
		padding: 0.75rem;
		margin: 0;
	}
	@media (max-width: 480px) {
		padding: 0.5rem;
	}
`;

const ResponsiveFormGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}
	@media (max-width: 480px) {
		gap: 0.5rem;
	}
`;

const PAR_EDUCATION = {
	overview: {
		description:
			'Pushed Authorization Requests (PAR) allow the client to push the full authorization request to the authorization server via a direct request, and receive a request_uri that is then used in the user-facing authorization request. This reduces the risk of parameter tampering and allows for larger requests.',
		keyPoint:
			'PAR moves authorization parameters from the redirect URL to a secure server-to-server call, then the user is sent with only a short request_uri.',
	},
	benefits: [
		'Reduces parameter tampering—parameters are set by the AS',
		'Supports requests larger than URL length limits',
		'Enables binding of the authorization request to the client',
		'Improves security for authorization code flow',
		'Required by FAPI 2.0 and other high-security profiles',
	],
	standard: 'RFC 9126 - Pushed Authorization Requests (PAR)',
	mockFlow: {
		description:
			'This is a mock/educational implementation demonstrating PAR concepts. In production, the client would POST to the PAR endpoint and the AS would return a request_uri to use in the authorization redirect.',
		note: 'PingOne supports PAR; this flow helps you understand the request shape and flow.',
	},
};

const STEP_METADATA = [
	{
		title: 'PAR Overview',
		subtitle: 'Understanding Pushed Authorization Requests',
		description: 'Learn about PAR and RFC 9126',
	},
	{
		title: 'PAR Configuration',
		subtitle: 'Set up client and authorization parameters',
		description: 'Configure client_id, redirect_uri, scope, etc.',
	},
	{
		title: 'Push PAR Request',
		subtitle: 'Push parameters to the AS',
		description: 'Obtain request_uri from the PAR endpoint',
	},
	{
		title: 'Authorization URL',
		subtitle: 'Redirect URL with request_uri',
		description: 'User-facing authorization URL',
	},
	{
		title: 'Token Exchange',
		subtitle: 'Exchange authorization code for tokens',
		description: 'Complete the OAuth flow',
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete',
		description: 'Summary and next steps',
	},
];

const PAR_SECTION_KEYS = [
	'overview',
	'configuration',
	'pushPar',
	'authorization',
	'tokenExchange',
	'completion',
] as const;

const PARFlowV9: React.FC = () => {
	usePageScroll({ pageName: 'PAR Flow V9', force: false });
	const stepContentRef = useRef<HTMLDivElement>(null);

	const { registerSteps, clearSteps, resetSteps, currentStep, setCurrentStep } = usePageStepper();
	useEffect(() => {
		const steps = STEP_METADATA.map((step) => ({
			id: step.title.toLowerCase().replace(/\s+/g, '-'),
			title: step.title,
			description: step.subtitle,
		}));
		registerSteps(steps);
		return () => clearSteps();
	}, [registerSteps, clearSteps]);

	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		overview: true,
		configuration: false,
		pushPar: true,
		authorization: true,
		tokenExchange: true,
		completion: true,
	});

	// Sync section expansion with stepper: when user clicks Next/Previous, expand the active step's section.
	// Only update when the section is currently collapsed to avoid unnecessary re-renders and update loops.
	useEffect(() => {
		const key = PAR_SECTION_KEYS[currentStep];
		if (!key) return;
		setCollapsedSections((prev) => (prev[key] === false ? prev : { ...prev, [key]: false }));
	}, [currentStep]);

	const [credentials] = useState(() => V9FlowCredentialService.load());
	const [environmentId, setEnvironmentId] = useState(() =>
		EnvironmentIdServiceV8.getEnvironmentId()
	);
	const [isWorkerTokenStatusCollapsed, setIsWorkerTokenStatusCollapsed] = useState(true);

	const [parConfig, setParConfig] = useState({
		clientId: credentials.clientId || '',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile',
		responseType: 'code',
		state: `par_v9_${Date.now()}`,
	});

	const [requestUri, setRequestUri] = useState('');
	const [authorizationUrl, setAuthorizationUrl] = useState('');
	const [authorizationCode, setAuthorizationCode] = useState('');
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	useEffect(() => {
		const synced = V9CredentialStorageService.loadSync('v9:par');
		if (synced?.environmentId) setEnvironmentId(synced.environmentId);
		if (synced?.clientId)
			setParConfig((prev) => ({ ...prev, clientId: synced.clientId ?? prev.clientId }));
		V9CredentialStorageService.load('v9:par').then((creds) => {
			if (creds?.environmentId) setEnvironmentId(creds.environmentId);
			if (creds?.clientId)
				setParConfig((prev) => ({ ...prev, clientId: creds.clientId ?? prev.clientId }));
		});
	}, []);

	const saveParCredentials = useCallback((clientId: string, envId: string) => {
		V9CredentialStorageService.save(
			'v9:par',
			{ clientId, environmentId: envId },
			envId ? { environmentId: envId } : {}
		);
	}, []);

	const handleParAppSelected = useCallback(
		(app: DiscoveredApp) => {
			setParConfig((prev) => ({ ...prev, clientId: app.id }));
			saveParCredentials(app.id, environmentId);
		},
		[environmentId, saveParCredentials]
	);

	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
	}, []);

	const handleConfigChange = useCallback((field: keyof typeof parConfig, value: string) => {
		setParConfig((prev) => ({ ...prev, [field]: value }));
	}, []);

	const pushParRequest = useCallback(() => {
		if (!environmentId || !parConfig.clientId) {
			setErrors(['Environment ID and Client ID are required']);
			return;
		}
		const mockUri = `https://auth.pingone.com/${environmentId}/as/par.request.oauth2?request_uri=urn:pingone:par:mock_${Date.now()}`;
		setRequestUri(mockUri);
		setErrors([]);
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'PAR request pushed (mock request_uri generated)',
			duration: 3000,
		});
	}, [environmentId, parConfig.clientId]);

	const generateAuthorizationUrl = useCallback(() => {
		if (!requestUri) {
			setErrors(['Push PAR Request first to get request_uri']);
			return;
		}
		const url =
			`https://auth.pingone.com/${environmentId}/as/authorization.oauth2?` +
			`client_id=${encodeURIComponent(parConfig.clientId)}&` +
			`request_uri=${encodeURIComponent(requestUri)}&` +
			`response_type=${encodeURIComponent(parConfig.responseType)}&` +
			`state=${encodeURIComponent(parConfig.state)}`;
		setAuthorizationUrl(url);
		setErrors([]);
	}, [environmentId, parConfig.clientId, parConfig.responseType, parConfig.state, requestUri]);

	const mockTokenExchange = useCallback(async () => {
		if (!authorizationCode) {
			setErrors(['Authorization code is required']);
			return;
		}
		setIsLoading(true);
		setErrors([]);
		try {
			setTokens({
				access_token: `mock_access_token_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: parConfig.scope,
				issued_at: Math.floor(Date.now() / 1000),
			});
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Token exchange completed successfully',
				duration: 3000,
			});
		} catch {
			setErrors(['Token exchange failed. Please try again.']);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Token exchange failed',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [authorizationCode, parConfig.scope]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('overview')}>
							<CollapsibleTitle>
								<span>ℹ️</span>PAR Overview
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.overview} />
						</CollapsibleHeaderButton>
						{!collapsedSections.overview && (
							<CollapsibleContent>
								<InfoBox $variant="info">
									<InfoTitle>{PAR_EDUCATION.overview.description}</InfoTitle>
									<InfoText>{PAR_EDUCATION.overview.keyPoint}</InfoText>
								</InfoBox>
								<InfoBox $variant="success">
									<InfoTitle>Key Benefits</InfoTitle>
									<InfoList>
										{PAR_EDUCATION.benefits.map((benefit, index) => (
											<li key={index}>{benefit}</li>
										))}
									</InfoList>
								</InfoBox>
								<InfoBox $variant="info">
									<InfoTitle>Standard Reference</InfoTitle>
									<InfoText>{PAR_EDUCATION.standard}</InfoText>
								</InfoBox>
								<InfoBox $variant="warning">
									<InfoTitle>Educational Implementation</InfoTitle>
									<InfoText>{PAR_EDUCATION.mockFlow.description}</InfoText>
									<InfoText>{PAR_EDUCATION.mockFlow.note}</InfoText>
								</InfoBox>
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 1:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('configuration')}>
							<CollapsibleTitle>
								<span>⚙️</span>PAR Configuration
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.configuration} />
						</CollapsibleHeaderButton>
						{!collapsedSections.configuration && (
							<CollapsibleContent>
								<CompactAppPickerV8U
									environmentId={environmentId}
									onAppSelected={handleParAppSelected}
								/>
								<ResponsiveFormGrid>
									<FormGroup>
										<Label>Environment ID</Label>
										<Input
											type="text"
											value={environmentId}
											onChange={(e) => setEnvironmentId(e.target.value)}
											placeholder="PingOne Environment ID"
											style={{ borderColor: BORDER }}
										/>
										<HelperText>Your PingOne environment identifier</HelperText>
									</FormGroup>
									<FormGroup>
										<Label>Client ID</Label>
										<Input
											type="text"
											value={parConfig.clientId}
											onChange={(e) => handleConfigChange('clientId', e.target.value)}
											placeholder="Client ID"
											style={{ borderColor: BORDER }}
										/>
										<HelperText>OAuth client identifier</HelperText>
									</FormGroup>
									<FormGroup>
										<Label>Redirect URI</Label>
										<Input
											type="url"
											value={parConfig.redirectUri}
											onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
											placeholder="https://localhost:3000/callback"
											style={{ borderColor: BORDER }}
										/>
										<HelperText>Callback URL after authorization</HelperText>
									</FormGroup>
									<FormGroup>
										<Label>Scope</Label>
										<Input
											type="text"
											value={parConfig.scope}
											onChange={(e) => handleConfigChange('scope', e.target.value)}
											placeholder="openid profile"
											style={{ borderColor: BORDER }}
										/>
										<HelperText>Space-separated scopes</HelperText>
									</FormGroup>
									<FormGroup>
										<Label>Response Type</Label>
										<Input
											type="text"
											value={parConfig.responseType}
											onChange={(e) => handleConfigChange('responseType', e.target.value)}
											placeholder="code"
											style={{ borderColor: BORDER }}
										/>
										<HelperText>Usually "code" for authorization code flow</HelperText>
									</FormGroup>
									<FormGroup>
										<Label>State</Label>
										<Input
											type="text"
											value={parConfig.state}
											onChange={(e) => handleConfigChange('state', e.target.value)}
											placeholder="state value"
											style={{ borderColor: BORDER }}
										/>
										<HelperText>CSRF protection value</HelperText>
									</FormGroup>
								</ResponsiveFormGrid>
								{errors.length > 0 && (
									<InfoBox $variant="error" style={{ marginTop: '1rem' }}>
										<InfoTitle>Configuration Errors</InfoTitle>
										<InfoList>
											{errors.map((error, index) => (
												<li key={index}>{error}</li>
											))}
										</InfoList>
									</InfoBox>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 2:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('pushPar')}>
							<CollapsibleTitle>
								<span>📤</span>Push PAR Request
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.pushPar} />
						</CollapsibleHeaderButton>
						{!collapsedSections.pushPar && (
							<CollapsibleContent>
								<Button
									$variant="primary"
									onClick={pushParRequest}
									disabled={!environmentId || !parConfig.clientId}
									style={{
										backgroundColor: PRIMARY_BLUE,
										color: WHITE,
										border: 'none',
										padding: '0.75rem 1.5rem',
										marginBottom: '1rem',
									}}
								>
									<span>📤</span>Push Authorization Request (PAR)
								</Button>
								<HelperText>
									In production, the client POSTs authorization parameters to the PAR endpoint. This
									mock generates a request_uri.
								</HelperText>
								{requestUri && (
									<GeneratedContentBox>
										<InfoTitle>Request URI (mock)</InfoTitle>
										<ColoredUrlDisplay
											url={requestUri}
											label="Request URI (mock)"
											showCopyButton={true}
											showInfoButton={false}
											showOpenButton={false}
										/>
									</GeneratedContentBox>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 3:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('authorization')}>
							<CollapsibleTitle>
								<span>🔑</span>Authorization URL
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.authorization} />
						</CollapsibleHeaderButton>
						{!collapsedSections.authorization && (
							<CollapsibleContent>
								<Button
									$variant="primary"
									onClick={generateAuthorizationUrl}
									disabled={!requestUri}
									style={{
										backgroundColor: PRIMARY_BLUE,
										color: WHITE,
										border: 'none',
										padding: '0.75rem 1.5rem',
										marginBottom: '1rem',
									}}
								>
									<span>➡️</span>Generate Authorization URL
								</Button>
								{authorizationUrl && (
									<>
										<GeneratedContentBox>
											<InfoTitle>Authorization URL (with request_uri)</InfoTitle>
											<ColoredUrlDisplay
												url={authorizationUrl}
												label="Authorization URL (with request_uri)"
												showCopyButton={true}
												showInfoButton={true}
												showOpenButton={false}
											/>
											<HelperText>
												User is redirected to this URL; the AS resolves the request_uri to the
												pushed parameters.
											</HelperText>
										</GeneratedContentBox>
										<FormGroup style={{ marginTop: '1rem' }}>
											<Label>Authorization Code (for testing)</Label>
											<Input
												type="text"
												value={authorizationCode}
												onChange={(e) => setAuthorizationCode(e.target.value)}
												placeholder="Enter mock authorization code"
												style={{ borderColor: BORDER }}
											/>
											<HelperText>
												Obtained from the authorization server callback in a real flow.
											</HelperText>
										</FormGroup>
									</>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 4:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('tokenExchange')}>
							<CollapsibleTitle>
								<span>🔄</span>Token Exchange
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.tokenExchange} />
						</CollapsibleHeaderButton>
						{!collapsedSections.tokenExchange && (
							<CollapsibleContent>
								<Button
									$variant="primary"
									onClick={mockTokenExchange}
									disabled={!authorizationCode || isLoading}
									style={{
										backgroundColor: PRIMARY_BLUE,
										color: WHITE,
										border: 'none',
										padding: '0.75rem 1.5rem',
										marginBottom: '1rem',
									}}
								>
									{isLoading ? (
										'Exchanging Token...'
									) : (
										<>
											<span>🔄</span>Exchange Authorization Code for Tokens
										</>
									)}
								</Button>
								{tokens && (
									<GeneratedContentBox>
										<InfoTitle>Token Response</InfoTitle>
										<ParameterGrid>
											<ParameterLabel>Access Token:</ParameterLabel>
											<ParameterValue>
												<CodeBlock>{maskToken(String(tokens.access_token))}</CodeBlock>
											</ParameterValue>
										</ParameterGrid>
										<ParameterGrid>
											<ParameterLabel>Token Type:</ParameterLabel>
											<ParameterValue>{String(tokens.token_type)}</ParameterValue>
										</ParameterGrid>
										<ParameterGrid>
											<ParameterLabel>Expires In:</ParameterLabel>
											<ParameterValue>{String(tokens.expires_in)} seconds</ParameterValue>
										</ParameterGrid>
										<ParameterGrid>
											<ParameterLabel>Scope:</ParameterLabel>
											<ParameterValue>{String(tokens.scope)}</ParameterValue>
										</ParameterGrid>
										<InfoBox $variant="success" style={{ marginTop: '1rem' }}>
											<InfoTitle>
												<span>✅</span>Token Exchange Successful
											</InfoTitle>
											<InfoText>PAR flow token exchange completed (mock).</InfoText>
										</InfoBox>
									</GeneratedContentBox>
								)}
								{errors.length > 0 && (
									<InfoBox $variant="error" style={{ marginTop: '1rem' }}>
										<InfoTitle>Token Exchange Errors</InfoTitle>
										<InfoList>
											{errors.map((error, index) => (
												<li key={index}>{error}</li>
											))}
										</InfoList>
									</InfoBox>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 5:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('completion')}>
							<CollapsibleTitle>
								<span>✅</span>Flow Completion
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.completion} />
						</CollapsibleHeaderButton>
						{!collapsedSections.completion && (
							<CollapsibleContent>
								<InfoBox $variant="success">
									<InfoTitle>PAR Flow Completed Successfully</InfoTitle>
									<InfoText>
										You have completed the Pushed Authorization Requests flow demonstration. PAR
										improves security by pushing parameters to the AS before the user is redirected.
									</InfoText>
								</InfoBox>
								<InfoBox $variant="info">
									<InfoTitle>Key Takeaways</InfoTitle>
									<InfoList>
										<li>PAR uses a POST to the PAR endpoint to obtain request_uri</li>
										<li>
											The authorization URL contains only request_uri (and client_id), not full
											parameters
										</li>
										<li>PingOne supports PAR; see PingOne docs for production setup</li>
										<li>RFC 9126 defines the PAR endpoint and request format</li>
									</InfoList>
								</InfoBox>
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			default:
				return null;
		}
	};

	const handleReset = useCallback(() => {
		resetSteps();
		setCurrentStep(0);
		setRequestUri('');
		setAuthorizationUrl('');
		setAuthorizationCode('');
		setTokens(null);
		setErrors([]);
		setCollapsedSections({
			overview: true,
			configuration: false,
			pushPar: true,
			authorization: true,
			tokenExchange: true,
			completion: true,
		});
		window.scrollTo({ top: 0, behavior: 'smooth' });
		modernMessaging.showBanner({
			type: 'info',
			title: 'Flow reset',
			message: 'All progress has been reset. Start again from step 1.',
			dismissible: true,
		});
	}, [resetSteps, setCurrentStep]);

	return (
		<ResponsiveContainer>
			<ResponsiveContentWrapper>
				<V7MMockBanner description="This flow demonstrates Pushed Authorization Requests (RFC 9126). PAR parameters are simulated in-browser. No real API calls to an authorization server are made; responses are generated for learning." />
				<V9FlowHeader flowId="par-v9" customConfig={{ flowType: 'pingone' }} />
				<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
					<V9FlowRestartButton
						onRestart={handleReset}
						currentStep={currentStep}
						totalSteps={STEP_METADATA.length}
						position="header"
					/>
				</div>

				<ResponsiveMainCard>
					<StepContentWrapper>
						<div style={{ marginBottom: '2rem' }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									marginBottom: '1rem',
									flexWrap: 'wrap',
									gap: '0.5rem',
								}}
							>
								{STEP_METADATA.map((step, index) => (
									<button
										key={index}
										type="button"
										onClick={() => setCurrentStep(index)}
										style={{
											flex: 1,
											minWidth: '100px',
											textAlign: 'center',
											padding: '0.5rem',
											borderRadius: '0.375rem',
											backgroundColor: index <= currentStep ? PRIMARY_BLUE : LIGHT_BLUE_BG,
											color: index <= currentStep ? WHITE : TEXT_PRIMARY,
											border: `1px solid ${index <= currentStep ? PRIMARY_BLUE : BORDER}`,
											fontSize: '0.875rem',
											fontWeight: index <= currentStep ? '600' : '400',
											cursor: 'pointer',
										}}
									>
										<div>{step.title}</div>
										<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
											{index + 1} of {STEP_METADATA.length}
										</div>
									</button>
								))}
							</div>
						</div>

						<div ref={stepContentRef} style={{ marginBottom: '2rem' }}>
							<h2
								style={{
									color: DARK_BLUE,
									marginBottom: '0.5rem',
									fontSize: '1.5rem',
									fontWeight: '600',
								}}
							>
								{STEP_METADATA[currentStep].title}
							</h2>
							<p style={{ color: TEXT_SECONDARY, marginBottom: '1rem', fontSize: '1rem' }}>
								{STEP_METADATA[currentStep].subtitle}
							</p>
							<p style={{ color: TEXT_PRIMARY, fontSize: '0.875rem' }}>
								{STEP_METADATA[currentStep].description}
							</p>
						</div>

						<SectionDivider />
						{renderStepContent()}
						<SectionDivider />
					</StepContentWrapper>
				</ResponsiveMainCard>

				<ResponsiveMainCard style={{ marginTop: '2rem' }}>
					<button
						type="button"
						onClick={() => setIsWorkerTokenStatusCollapsed(!isWorkerTokenStatusCollapsed)}
						style={{
							width: '100%',
							padding: '16px 20px',
							background: isWorkerTokenStatusCollapsed
								? `linear-gradient(135deg, ${V9_COLORS.BG.GRAY_LIGHT} 0%, ${V9_COLORS.BG.GRAY_MEDIUM} 100%)`
								: `linear-gradient(135deg, ${V9_COLORS.TEXT.WHITE} 0%, ${V9_COLORS.BG.GRAY_LIGHT} 100%)`,
							border: 'none',
							borderBottom: isWorkerTokenStatusCollapsed
								? `1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER}`
								: 'none',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							transition: 'all 0.3s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = `linear-gradient(135deg, ${V9_COLORS.TEXT.WHITE} 0%, ${V9_COLORS.BG.GRAY_MEDIUM} 100%)`;
							e.currentTarget.style.color = TEXT_PRIMARY;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = isWorkerTokenStatusCollapsed
								? `linear-gradient(135deg, ${V9_COLORS.BG.GRAY_LIGHT} 0%, ${V9_COLORS.BG.GRAY_MEDIUM} 100%)`
								: `linear-gradient(135deg, ${V9_COLORS.TEXT.WHITE} 0%, ${V9_COLORS.BG.GRAY_LIGHT} 100%)`;
							e.currentTarget.style.color = TEXT_PRIMARY;
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<span>🔑</span>
							<span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
								Worker Token Status
							</span>
						</div>
						<span
							style={{
								fontSize: '16px',
								color: '#6b7280',
								transform: isWorkerTokenStatusCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
								transition: 'all 0.3s ease',
							}}
						>
							🔽
						</span>
					</button>
					{!isWorkerTokenStatusCollapsed && (
						<div style={{ padding: '20px' }}>
							<WorkerTokenStatusDisplayV8
								appName="PAR Flow V9"
								compact={false}
								showRefreshButton={true}
								onTokenUpdate={(tokenData) => {
									if (tokenData?.credentials?.environmentId)
										setEnvironmentId(tokenData.credentials.environmentId);
								}}
							/>
						</div>
					)}
				</ResponsiveMainCard>

				<ResponsiveMainCard style={{ marginTop: '2rem' }}>
					<StepContentWrapper>
						<h3
							style={{
								color: DARK_BLUE,
								marginBottom: '0.5rem',
								fontSize: '1.25rem',
								fontWeight: '600',
							}}
						>
							<span>⚙️</span>Credential Management
						</h3>
						<p
							style={{
								fontSize: '0.875rem',
								color: TEXT_SECONDARY,
								marginBottom: '1rem',
								lineHeight: 1.5,
							}}
						>
							<strong>Export</strong> saves your PAR flow credentials to a file.{' '}
							<strong>Import</strong> loads a previously exported file.
						</p>
						<StandardizedCredentialExportImport
							appName="PAR Flow V9"
							appType="oauth"
							credentials={{
								environmentId,
								clientId: parConfig.clientId,
								clientSecret: '',
								redirectUri: parConfig.redirectUri,
							}}
							onImport={(importedCredentials) => {
								const c = importedCredentials as {
									environmentId?: string;
									clientId?: string;
									redirectUri?: string;
								};
								if (c.environmentId) setEnvironmentId(c.environmentId);
								if (c.clientId) handleConfigChange('clientId', c.clientId);
								if (c.redirectUri) handleConfigChange('redirectUri', c.redirectUri);
								modernMessaging.showFooterMessage({
									type: 'info',
									message: 'Credentials imported successfully',
									duration: 3000,
								});
							}}
						/>
					</StepContentWrapper>
				</ResponsiveMainCard>
			</ResponsiveContentWrapper>
		</ResponsiveContainer>
	);
};

export default PARFlowV9;
