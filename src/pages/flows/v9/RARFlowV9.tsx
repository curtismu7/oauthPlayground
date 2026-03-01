// src/pages/flows/v9/RARFlowV9.tsx
// V9 RAR (Rich Authorization Requests) Flow with Enhanced Architecture

import {
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
} from '@icons';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { StandardizedCredentialExportImport } from '../../../components/StandardizedCredentialExportImport';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import { usePageScroll } from '../../../hooks/usePageScroll';
// V9 specific imports
import { FlowUIService } from '../../../services/flowUIService.tsx';
import { V9FlowCredentialService } from '../../../services/v9/core/V9FlowCredentialService';
import { EnvironmentIdServiceV8 } from '../../../services/v9/environmentIdServiceV9';
import WorkerTokenStatusDisplayV8 from '../../../v8/components/WorkerTokenStatusDisplayV8';
import { toastV8 } from '../../../v8/utils/toastNotificationsV8';

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

// V9 Color Standards - Approved Colors Only: Red, Blue, Black, White
const V9_COLORS = {
	PRIMARY_BLUE: '#2563eb',
	DARK_BLUE: '#1e40af',
	DARKEST_BLUE: '#1e3a8a',
	LIGHT_BLUE_BG: '#eff6ff',
	LIGHTER_BLUE_BG: '#dbeafe',
	RED: '#dc2626',
	BLACK: '#000000',
	WHITE: '#ffffff',
	BORDER: '#e5e7eb',
	TEXT_PRIMARY: '#111827',
	TEXT_SECONDARY: '#6b7280',
};

// Custom responsive container for RAR flow with V9 colors
const ResponsiveContainer = styled(Container)`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem;
	border: 1px solid ${V9_COLORS.BORDER};
	
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
	border: 1px solid ${V9_COLORS.BORDER};
	background-color: ${V9_COLORS.WHITE};
	
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

// RAR Educational Content
const RAR_EDUCATION = {
	overview: {
		description:
			'Rich Authorization Requests (RAR) enable fine-grained authorization by allowing clients to specify detailed authorization requirements using structured JSON. This goes beyond simple scopes to provide granular permission specifications.',
		keyPoint:
			"RAR transforms OAuth from 'all-or-nothing' scopes to precise, contextual authorization requests.",
	},
	benefits: [
		'Fine-grained permission control beyond basic scopes',
		'Contextual authorization with resource-specific permissions',
		'Structured JSON format for complex authorization requirements',
		'Better security through precise permission specifications',
		'Enhanced user consent with detailed permission descriptions',
	],
	example: {
		description:
			"Instead of requesting 'read' scope, RAR allows specifying exactly what to read: 'user profile name and email, but not phone number'",
	},
	useCases: [
		'Banking APIs with account-specific permissions',
		'Healthcare systems with patient data access controls',
		'Enterprise applications with role-based resource access',
		'IoT devices with device-specific permissions',
	],
	standard: 'RFC 9396 - Rich Authorization Requests (RAR)',
	mockFlow: {
		description:
			'This is a mock/educational implementation demonstrating RAR concepts. In a real implementation, the authorization server would process the RAR parameters and return tokens with the approved authorization details.',
		note: 'PingOne supports RAR parameters in authorization requests, making this flow valuable for understanding real-world OAuth implementations.',
	},
};

// Step metadata
const STEP_METADATA = [
	{
		title: 'RAR Overview',
		subtitle: 'Understanding Rich Authorization Requests',
		description: 'Learn about RAR concepts and benefits',
	},
	{
		title: 'RAR Configuration',
		subtitle: 'Set up RAR parameters and authorization details',
		description: 'Configure RAR-specific authorization requirements',
	},
	{
		title: 'Authorization Request',
		subtitle: 'Generate RAR-enabled authorization URL',
		description: 'Create authorization request with RAR parameters',
	},
	{
		title: 'Token Exchange',
		subtitle: 'Exchange authorization code for tokens',
		description: 'Complete the OAuth flow with RAR context',
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete the flow',
		description: 'Summary and next steps',
	},
];

// Types
interface RARAuthorizationDetails {
	resource: string;
	actions: string[];
	locations?: string[];
	datatypes?: string[];
	identifier?: string;
	privileges?: string[];
}

// Main Component
const RARFlowV9: React.FC = () => {
	// Scroll management
	usePageScroll({ pageName: 'RAR Flow V9', force: true });

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		overview: true,
		configuration: false,
		authorization: true,
		tokenExchange: true,
		completion: true,
	});

	// V9 Credential management
	const [credentials, _setCredentials] = useState(() => V9FlowCredentialService.load());
	const [environmentId, setEnvironmentId] = useState(() =>
		EnvironmentIdServiceV8.getEnvironmentId()
	);

	// Worker token state
	const [isWorkerTokenStatusCollapsed, setIsWorkerTokenStatusCollapsed] = useState(true);

	// RAR-specific state
	const [rarConfig, setRarConfig] = useState({
		clientId: credentials.clientId || '',
		redirectUri: 'https://localhost:3000/callback',
		resource: 'https://api.example.com/records',
		actions: ['read', 'write'],
		locations: ['https://api.example.com'],
		datatypes: ['user_profile', 'financial_data'],
		identifier: 'user_123',
		privileges: ['basic', 'premium'],
	});

	// Flow state
	const [authorizationUrl, setAuthorizationUrl] = useState('');
	const [authorizationCode, setAuthorizationCode] = useState('');
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	// Toggle collapsible sections
	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Navigation functions
	const nextStep = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [currentStep]);

	const prevStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [currentStep]);

	const goToStep = useCallback((step: number) => {
		if (step >= 0 && step < STEP_METADATA.length) {
			setCurrentStep(step);
		}
	}, []);

	// Generate RAR authorization details
	const generateRARAuthorizationDetails = useCallback((): RARAuthorizationDetails => {
		return {
			resource: rarConfig.resource,
			actions: rarConfig.actions,
			locations: rarConfig.locations,
			datatypes: rarConfig.datatypes,
			identifier: rarConfig.identifier,
			privileges: rarConfig.privileges,
		};
	}, [rarConfig]);

	// Generate authorization URL with RAR parameters
	const generateAuthorizationUrl = useCallback(() => {
		if (!environmentId || !rarConfig.clientId) {
			setErrors(['Environment ID and Client ID are required']);
			return;
		}

		const authDetails = generateRARAuthorizationDetails();
		const rarParams = encodeURIComponent(JSON.stringify([authDetails]));

		const url =
			`https://auth.pingone.com/${environmentId}/as/authorization.oauth2?` +
			`response_type=code&` +
			`client_id=${encodeURIComponent(rarConfig.clientId)}&` +
			`redirect_uri=${encodeURIComponent(rarConfig.redirectUri)}&` +
			`authorization_details=${rarParams}&` +
			`state=rar_v9_${Date.now()}`;

		setAuthorizationUrl(url);
		setErrors([]);
	}, [environmentId, rarConfig, generateRARAuthorizationDetails]);

	// Mock token exchange
	const mockTokenExchange = useCallback(async () => {
		if (!authorizationCode) {
			setErrors(['Authorization code is required']);
			return;
		}

		setIsLoading(true);
		setErrors([]);

		try {
			// Mock token response with RAR context
			const mockTokens = {
				access_token: `mock_access_token_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'rar_granted',
				authorization_details: JSON.stringify([generateRARAuthorizationDetails()]),
				issued_at: Math.floor(Date.now() / 1000),
			};

			setTokens(mockTokens);
			v4ToastManager.success('Token exchange completed successfully');
		} catch (_error) {
			setErrors(['Token exchange failed. Please try again.']);
			v4ToastManager.error('Token exchange failed');
		} finally {
			setIsLoading(false);
		}
	}, [authorizationCode, generateRARAuthorizationDetails]);

	// Handle input changes
	const handleConfigChange = useCallback(
		(field: keyof typeof rarConfig, value: string | number | boolean) => {
			setRarConfig((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[]
	);

	// Handle array field changes (actions, locations, etc.)
	const handleArrayFieldChange = useCallback((field: keyof typeof rarConfig, value: string) => {
		const arrayValue = value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
		setRarConfig((prev) => ({
			...prev,
			[field]: arrayValue,
		}));
	}, []);

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0: // RAR Overview
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('overview')}>
							<CollapsibleTitle>
								<FiInfo /> Rich Authorization Requests Overview
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.overview} />
						</CollapsibleHeaderButton>
						{!collapsedSections.overview && (
							<CollapsibleContent>
								<InfoBox $variant="info">
									<InfoTitle>{RAR_EDUCATION.overview.description}</InfoTitle>
									<InfoText>{RAR_EDUCATION.overview.keyPoint}</InfoText>
								</InfoBox>

								<InfoBox $variant="success">
									<InfoTitle>Key Benefits</InfoTitle>
									<InfoList>
										{RAR_EDUCATION.benefits.map((benefit, index) => (
											<li key={index}>{benefit}</li>
										))}
									</InfoList>
								</InfoBox>

								<InfoBox $variant="warning">
									<InfoTitle>Example Use Case</InfoTitle>
									<InfoText>{RAR_EDUCATION.example.description}</InfoText>
								</InfoBox>

								<InfoBox $variant="info">
									<InfoTitle>Common Use Cases</InfoTitle>
									<InfoList>
										{RAR_EDUCATION.useCases.map((useCase, index) => (
											<li key={index}>{useCase}</li>
										))}
									</InfoList>
								</InfoBox>

								<InfoBox $variant="info">
									<InfoTitle>Standard Reference</InfoTitle>
									<InfoText>{RAR_EDUCATION.standard}</InfoText>
								</InfoBox>

								<InfoBox $variant="warning">
									<InfoTitle>Educational Implementation</InfoTitle>
									<InfoText>{RAR_EDUCATION.mockFlow.description}</InfoText>
									<InfoText>{RAR_EDUCATION.mockFlow.note}</InfoText>
								</InfoBox>
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 1: // RAR Configuration
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('configuration')}>
							<CollapsibleTitle>
								<FiSettings /> RAR Configuration
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.configuration} />
						</CollapsibleHeaderButton>
						{!collapsedSections.configuration && (
							<CollapsibleContent>
								<ResponsiveFormGrid>
									<FormGroup>
										<Label>Environment ID</Label>
										<Input
											type="text"
											value={environmentId}
											onChange={(e) => setEnvironmentId(e.target.value)}
											placeholder="Enter PingOne Environment ID"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Your PingOne environment identifier</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Client ID</Label>
										<Input
											type="text"
											value={rarConfig.clientId}
											onChange={(e) => handleConfigChange('clientId', e.target.value)}
											placeholder="Enter Client ID"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>OAuth client identifier</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Redirect URI</Label>
										<Input
											type="url"
											value={rarConfig.redirectUri}
											onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
											placeholder="https://localhost:3000/callback"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Where the user is redirected after authorization</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Resource</Label>
										<Input
											type="url"
											value={rarConfig.resource}
											onChange={(e) => handleConfigChange('resource', e.target.value)}
											placeholder="https://api.example.com/records"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>The API resource being accessed</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Actions (comma-separated)</Label>
										<Input
											type="text"
											value={rarConfig.actions.join(', ')}
											onChange={(e) => handleArrayFieldChange('actions', e.target.value)}
											placeholder="read, write, delete"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Permitted actions on the resource</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Locations (comma-separated)</Label>
										<Input
											type="text"
											value={rarConfig.locations.join(', ')}
											onChange={(e) => handleArrayFieldChange('locations', e.target.value)}
											placeholder="https://api.example.com"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Resource locations (optional)</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Data Types (comma-separated)</Label>
										<Input
											type="text"
											value={rarConfig.datatypes.join(', ')}
											onChange={(e) => handleArrayFieldChange('datatypes', e.target.value)}
											placeholder="user_profile, financial_data"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Types of data to be accessed (optional)</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Identifier</Label>
										<Input
											type="text"
											value={rarConfig.identifier}
											onChange={(e) => handleConfigChange('identifier', e.target.value)}
											placeholder="user_123"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Resource identifier (optional)</HelperText>
									</FormGroup>

									<FormGroup>
										<Label>Privileges (comma-separated)</Label>
										<Input
											type="text"
											value={rarConfig.privileges.join(', ')}
											onChange={(e) => handleArrayFieldChange('privileges', e.target.value)}
											placeholder="basic, premium, admin"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>Access privileges (optional)</HelperText>
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

			case 2: // Authorization Request
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('authorization')}>
							<CollapsibleTitle>
								<FiKey /> Generate Authorization Request
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.authorization} />
						</CollapsibleHeaderButton>
						{!collapsedSections.authorization && (
							<CollapsibleContent>
								<Button
									onClick={generateAuthorizationUrl}
									disabled={!environmentId || !rarConfig.clientId}
									style={{
										backgroundColor: V9_COLORS.PRIMARY_BLUE,
										color: V9_COLORS.WHITE,
										border: 'none',
										padding: '0.75rem 1.5rem',
										marginBottom: '1rem',
									}}
								>
									<FiArrowRight /> Generate Authorization URL
								</Button>

								{authorizationUrl && (
									<GeneratedContentBox>
										<InfoTitle>Authorization URL</InfoTitle>
										<CodeBlock>{authorizationUrl}</CodeBlock>
										<HelperText>
											This URL contains RAR authorization details that specify exactly what
											permissions are being requested.
										</HelperText>

										<ParameterGrid>
											<ParameterLabel>Authorization Details:</ParameterLabel>
											<ParameterValue>
												<CodeBlock>
													{JSON.stringify([generateRARAuthorizationDetails()], null, 2)}
												</CodeBlock>
											</ParameterValue>
										</ParameterGrid>
									</GeneratedContentBox>
								)}

								{authorizationUrl && (
									<FormGroup style={{ marginTop: '1rem' }}>
										<Label>Authorization Code (for testing)</Label>
										<Input
											type="text"
											value={authorizationCode}
											onChange={(e) => setAuthorizationCode(e.target.value)}
											placeholder="Enter mock authorization code"
											style={{ borderColor: V9_COLORS.BORDER }}
										/>
										<HelperText>
											In a real flow, this would be obtained from the authorization server callback
										</HelperText>
									</FormGroup>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 3: // Token Exchange
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('tokenExchange')}>
							<CollapsibleTitle>
								<FiRefreshCw /> Token Exchange
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.tokenExchange} />
						</CollapsibleHeaderButton>
						{!collapsedSections.tokenExchange && (
							<CollapsibleContent>
								<Button
									onClick={mockTokenExchange}
									disabled={!authorizationCode || isLoading}
									style={{
										backgroundColor: V9_COLORS.PRIMARY_BLUE,
										color: V9_COLORS.WHITE,
										border: 'none',
										padding: '0.75rem 1.5rem',
										marginBottom: '1rem',
									}}
								>
									{isLoading ? (
										'Exchanging Token...'
									) : (
										<>
											<FiRefreshCw /> Exchange Authorization Code for Tokens
										</>
									)}
								</Button>

								{tokens && (
									<GeneratedContentBox>
										<InfoTitle>Token Response</InfoTitle>
										<ParameterGrid>
											<ParameterLabel>Access Token:</ParameterLabel>
											<ParameterValue>
												<CodeBlock>{tokens.access_token}</CodeBlock>
											</ParameterValue>
										</ParameterGrid>

										<ParameterGrid>
											<ParameterLabel>Token Type:</ParameterLabel>
											<ParameterValue>{tokens.token_type}</ParameterValue>
										</ParameterGrid>

										<ParameterGrid>
											<ParameterLabel>Expires In:</ParameterLabel>
											<ParameterValue>{tokens.expires_in} seconds</ParameterValue>
										</ParameterGrid>

										<ParameterGrid>
											<ParameterLabel>Scope:</ParameterLabel>
											<ParameterValue>{tokens.scope}</ParameterValue>
										</ParameterGrid>

										<ParameterGrid>
											<ParameterLabel>Authorization Details:</ParameterLabel>
											<ParameterValue>
												<CodeBlock>{tokens.authorization_details}</CodeBlock>
											</ParameterValue>
										</ParameterGrid>

										<InfoBox $variant="success" style={{ marginTop: '1rem' }}>
											<InfoTitle>
												<FiCheckCircle /> Token Exchange Successful
											</InfoTitle>
											<InfoText>
												The token includes RAR authorization details that grant specific permissions
												as configured in step 2.
											</InfoText>
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

			case 4: // Flow Completion
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton onClick={() => toggleSection('completion')}>
							<CollapsibleTitle>
								<FiCheckCircle /> Flow Completion
							</CollapsibleTitle>
							<CollapsibleToggleIcon collapsed={!collapsedSections.completion} />
						</CollapsibleHeaderButton>
						{!collapsedSections.completion && (
							<CollapsibleContent>
								<InfoBox $variant="success">
									<InfoTitle>RAR Flow Completed Successfully</InfoTitle>
									<InfoText>
										You have successfully completed the Rich Authorization Requests flow
										demonstration. The token you received includes specific authorization details
										that grant precise permissions as configured in the RAR parameters.
									</InfoText>
								</InfoBox>

								<InfoBox $variant="info">
									<InfoTitle>Key Takeaways</InfoTitle>
									<InfoList>
										<li>RAR enables fine-grained authorization beyond simple scopes</li>
										<li>Authorization details are structured JSON objects with specific fields</li>
										<li>PingOne supports RAR parameters in authorization requests</li>
										<li>Tokens can include the granted authorization details for verification</li>
										<li>RAR provides better security and user consent experiences</li>
									</InfoList>
								</InfoBox>

								<InfoBox $variant="warning">
									<InfoTitle>Next Steps</InfoTitle>
									<InfoList>
										<li>Explore other OAuth flows in the playground</li>
										<li>Read the RFC 9396 specification for detailed RAR information</li>
										<li>Test with real PingOne applications to implement RAR in production</li>
										<li>Review PingOne documentation for RAR-specific configuration</li>
									</InfoList>
								</InfoBox>

								{tokens && (
									<GeneratedContentBox style={{ marginTop: '1rem' }}>
										<InfoTitle>Final Token Summary</InfoTitle>
										<ParameterGrid>
											<ParameterLabel>Token Type:</ParameterLabel>
											<ParameterValue>{tokens.token_type}</ParameterValue>
										</ParameterGrid>

										<ParameterGrid>
											<ParameterLabel>Granted Permissions:</ParameterLabel>
											<ParameterValue>
												<CodeBlock>{tokens.authorization_details}</CodeBlock>
											</ParameterValue>
										</ParameterGrid>

										<ParameterGrid>
											<ParameterLabel>Expires In:</ParameterLabel>
											<ParameterValue>{tokens.expires_in} seconds</ParameterValue>
										</ParameterGrid>
									</GeneratedContentBox>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			default:
				return null;
		}
	};

	return (
		<ResponsiveContainer>
			<ResponsiveContentWrapper>
				<FlowHeader
					title="Rich Authorization Requests (RAR) Flow V9"
					subtitle="Fine-grained OAuth authorization with structured permissions"
					badge="V9"
					badgeColor={V9_COLORS.PRIMARY_BLUE}
				/>

				<ResponsiveMainCard>
					<StepContentWrapper>
						{/* Step Progress */}
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
									<div
										key={index}
										style={{
											flex: 1,
											minWidth: '120px',
											textAlign: 'center',
											padding: '0.5rem',
											borderRadius: '0.375rem',
											backgroundColor:
												index <= currentStep ? V9_COLORS.PRIMARY_BLUE : V9_COLORS.LIGHT_BLUE_BG,
											color: index <= currentStep ? V9_COLORS.WHITE : V9_COLORS.TEXT_PRIMARY,
											border: `1px solid ${index <= currentStep ? V9_COLORS.PRIMARY_BLUE : V9_COLORS.BORDER}`,
											fontSize: '0.875rem',
											fontWeight: index <= currentStep ? '600' : '400',
										}}
									>
										<div>{step.title}</div>
										<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
											{index + 1} of {STEP_METADATA.length}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Current Step Info */}
						<div style={{ marginBottom: '2rem' }}>
							<h2
								style={{
									color: V9_COLORS.DARK_BLUE,
									marginBottom: '0.5rem',
									fontSize: '1.5rem',
									fontWeight: '600',
								}}
							>
								{STEP_METADATA[currentStep].title}
							</h2>
							<p
								style={{
									color: V9_COLORS.TEXT_SECONDARY,
									marginBottom: '1rem',
									fontSize: '1rem',
								}}
							>
								{STEP_METADATA[currentStep].subtitle}
							</p>
							<p
								style={{
									color: V9_COLORS.TEXT_PRIMARY,
									fontSize: '0.875rem',
								}}
							>
								{STEP_METADATA[currentStep].description}
							</p>
						</div>

						<SectionDivider />

						{/* Step Content */}
						{renderStepContent()}

						<SectionDivider />

						{/* Navigation */}
						<StepNavigationButtons
							currentStep={currentStep}
							totalSteps={STEP_METADATA.length}
							onNext={nextStep}
							onPrevious={prevStep}
							onGoToStep={goToStep}
							canGoNext={currentStep < STEP_METADATA.length - 1}
							canGoPrevious={currentStep > 0}
							nextLabel={currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next Step'}
							previousLabel="Previous Step"
							style={{
								nextButtonBackgroundColor: V9_COLORS.PRIMARY_BLUE,
								nextButtonColor: V9_COLORS.WHITE,
								previousButtonBackgroundColor: V9_COLORS.WHITE,
								previousButtonColor: V9_COLORS.PRIMARY_BLUE,
								previousButtonBorderColor: V9_COLORS.PRIMARY_BLUE,
							}}
						/>
					</StepContentWrapper>
				</ResponsiveMainCard>

				{/* Worker Token Status Section */}
				<ResponsiveMainCard style={{ marginTop: '2rem' }}>
					<button
						type="button"
						onClick={() => setIsWorkerTokenStatusCollapsed(!isWorkerTokenStatusCollapsed)}
						style={{
							width: '100%',
							padding: '16px 20px',
							background: isWorkerTokenStatusCollapsed
								? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
								: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
							border: 'none',
							borderBottom: isWorkerTokenStatusCollapsed ? '1px solid #e2e8f0' : 'none',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							transition: 'all 0.3s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background =
								'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)';
							e.currentTarget.style.color = '#1f2937';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = isWorkerTokenStatusCollapsed
								? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
								: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
							e.currentTarget.style.color = '#374151';
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<FiKey style={{ fontSize: '20px', color: '#6b7280' }} />
							<span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
								Worker Token Status
							</span>
						</div>
						<FiChevronDown
							style={{
								fontSize: '16px',
								color: '#6b7280',
								transform: isWorkerTokenStatusCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
								transition: 'all 0.3s ease',
							}}
						/>
					</button>

					{/* Worker Token Status Content */}
					{!isWorkerTokenStatusCollapsed && (
						<div style={{ padding: '20px' }}>
							<WorkerTokenStatusDisplayV8
								appName="RAR Flow V9"
								compact={false}
								showRefreshButton={true}
								onTokenUpdate={(tokenData) => {
									// Update environment ID from worker token if available
									if (tokenData?.credentials?.environmentId) {
										setEnvironmentId(tokenData.credentials.environmentId);
									}
								}}
							/>
						</div>
					)}
				</ResponsiveMainCard>

				{/* Credential Export/Import Section */}
				<ResponsiveMainCard style={{ marginTop: '2rem' }}>
					<StepContentWrapper>
						<h3
							style={{
								color: V9_COLORS.DARK_BLUE,
								marginBottom: '1rem',
								fontSize: '1.25rem',
								fontWeight: '600',
							}}
						>
							<FiSettings /> Credential Management
						</h3>
						<StandardizedCredentialExportImport
							appName="RAR Flow V9"
							appType="oauth"
							credentials={{
								environmentId,
								clientId: rarConfig.clientId,
								clientSecret: '',
								redirectUri: rarConfig.redirectUri,
							}}
							onCredentialsImported={(importedCredentials) => {
								if (importedCredentials.environmentId) {
									setEnvironmentId(importedCredentials.environmentId);
								}
								if (importedCredentials.clientId) {
									handleConfigChange('clientId', importedCredentials.clientId);
								}
								if (importedCredentials.redirectUri) {
									handleConfigChange('redirectUri', importedCredentials.redirectUri);
								}
								toastV8.success('Credentials imported successfully');
							}}
						/>
					</StepContentWrapper>
				</ResponsiveMainCard>
			</ResponsiveContentWrapper>
		</ResponsiveContainer>
	);
};

export default RARFlowV9;
