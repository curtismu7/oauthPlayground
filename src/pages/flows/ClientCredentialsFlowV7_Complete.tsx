// src/pages/flows/ClientCredentialsFlowV7_Complete.tsx
// V7.0.0 OAuth 2.0 Client Credentials Flow - Complete V7 Implementation with Step Numbers

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiSettings,
} from 'react-icons/fi';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';
import { FlowCredentialService } from '../../services/flowCredentialService';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { CopyButtonService } from '../../services/copyButtonService';
import { ClientAuthMethod } from '../../services/clientCredentialsSharedService';

// V7 Styled Components
const Container = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.div`
	background: rgba(255, 255, 255, 0.2);
	color: #ffffff;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`;

const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`;

const StepHeaderRight = styled.div`
	text-align: right;
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const CollapsibleSection = styled.div`
	margin-bottom: 1.5rem;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	overflow: hidden;
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	padding: 1rem;
	background: #f9fafb;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f3f4f6;
	}
`;

const CollapsibleTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: #374151;
`;

const CollapsibleContent = styled.div`
	padding: 1rem;
	background: white;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary'; loading?: boolean }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	opacity: ${props => props.loading ? 0.7 : 1};
	pointer-events: ${props => props.loading ? 'none' : 'auto'};

	${props => props.variant === 'primary' ? `
		background: #3b82f6;
		color: white;
		&:hover {
			background: #2563eb;
		}
	` : `
		background: #f3f4f6;
		color: #374151;
		&:hover {
			background: #e5e7eb;
		}
	`}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' | 'error' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	${props => {
		switch (props.$variant) {
			case 'success':
				return 'background: #dcfce7; border: 1px solid #10b981; color: #166534;';
			case 'warning':
				return 'background: #fef3c7; border: 1px solid #f59e0b; color: #d97706;';
			case 'error':
				return 'background: #fef2f2; border: 1px solid #ef4444; color: #dc2626;';
			default:
				return 'background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af;';
		}
	}}
`;

const InfoTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 1rem;
	font-weight: 600;
`;

const InfoText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	overflow-x: auto;
	margin: 1rem 0;
`;

const GeneratedContentBox = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const GeneratedLabel = styled.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	margin: 1rem 0;
	flex-wrap: wrap;
`;

// Step metadata
const STEP_METADATA = [
	{
		title: 'Credentials & Configuration',
		subtitle: 'Set up your client credentials and authentication method',
		description: 'Configure environment, client ID, client secret, and authentication method'
	},
	{
		title: 'Authentication Method',
		subtitle: 'Choose how to authenticate with the authorization server',
		description: 'Select between client_secret_post, client_secret_basic, or none'
	},
	{
		title: 'Token Request',
		subtitle: 'Generate and send the token request',
		description: 'Create the token request with proper authentication'
	},
	{
		title: 'Token Response',
		subtitle: 'Receive and validate the access token',
		description: 'Process the token response and validate the access token'
	},
	{
		title: 'API Call',
		subtitle: 'Use the access token to call protected APIs',
		description: 'Make authenticated requests to protected resources'
	},
	{
		title: 'Token Introspection',
		subtitle: 'Validate the access token',
		description: 'Introspect the token to verify its validity and claims'
	},
	{
		title: 'Flow Complete',
		subtitle: 'Review the completed flow',
		description: 'Summary of the client credentials flow implementation'
	}
];

const ClientCredentialsFlowV7Complete: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		credentials: false,
		authMethod: false,
		tokenRequest: false,
		tokenResponse: false,
		apiCall: false,
		introspection: false,
	});

	// Initialize page scroll management
	usePageScroll({ pageName: 'Client Credentials V7', force: true });

	// Check credentials on mount and show warning if missing
	useEffect(() => {
		checkCredentialsAndWarn(controller.credentials, {
			flowName: 'Client Credentials Flow',
			requiredFields: ['environmentId', 'clientId', 'clientSecret'],
			showToast: true
		});
	}, []); // Only run once on mount

	// Initialize client credentials flow controller
	const controller = useClientCredentialsFlowController({
		flowKey: 'client-credentials-v7',
	});

	const toggleSection = useCallback((key: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[key]: !prev[key]
		}));
	}, []);

	const handleNext = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(prev => prev + 1);
		}
	}, [currentStep]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		controller.resetFlow();
		
		// Clear Client Credentials Flow V7-specific storage with error handling
		try {
			FlowCredentialService.clearFlowState('client-credentials-v7');
			console.log('🔧 [Client Credentials V7] Cleared flow-specific storage');
		} catch (error) {
			console.error('[Client Credentials V7] Failed to clear flow state:', error);
			v4ToastManager.showError('Failed to clear flow state. Please refresh the page.');
		}
		
		// Clear credential backup when flow is reset
		try {
			clearBackup();
			console.log('🔧 [Client Credentials V7] Cleared credential backup');
		} catch (error) {
			console.error('[Client Credentials V7] Failed to clear credential backup:', error);
		}
	}, [controller, clearBackup]);

	// Step validation with enhanced error messages
	const isStepValid = useCallback((step: number): boolean => {
		switch (step) {
			case 0:
				// Step 0: Must have valid credentials
				return !!(controller.credentials.environmentId && controller.credentials.clientId);
			case 1:
				// Step 1: Auth method selection is always valid
				return true;
			case 2:
				// Step 2: Must have valid credentials for token request
				return !!(controller.credentials.environmentId && controller.credentials.clientId);
			case 3:
				// Step 3: Must have access token from successful request
				return !!controller.tokens?.access_token;
			case 4:
				// Step 4: Must have access token for API calls
				return !!controller.tokens?.access_token;
			case 5:
				// Step 5: Must have access token for token introspection
				return !!controller.tokens?.access_token;
			case 6:
				// Step 6: Completion step is always valid
				return true;
			default:
				return false;
		}
	}, [controller.credentials, controller.tokens]);

	// Get step validation error message
	const getStepValidationMessage = useCallback((step: number): string => {
		switch (step) {
			case 0:
				if (!controller.credentials.environmentId) return 'Environment ID is required';
				if (!controller.credentials.clientId) return 'Client ID is required';
				return '';
			case 2:
				if (!controller.credentials.environmentId) return 'Environment ID is required';
				if (!controller.credentials.clientId) return 'Client ID is required';
				return '';
			case 3:
			case 4:
			case 5:
				if (!controller.tokens?.access_token) return 'Access token is required. Please complete the token request first.';
				return '';
			default:
				return '';
		}
	}, [controller.credentials, controller.tokens]);

	const canNavigateNext = useMemo(() => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	// Ensure Client Credentials Flow V7 uses its own credential storage
	useEffect(() => {
		// Save current credentials to flow-specific storage
		if (controller.credentials && (controller.credentials.environmentId || controller.credentials.clientId)) {
			console.log('🔧 [Client Credentials V7] Saving credentials to flow-specific storage:', {
				flowKey: 'client-credentials-v7',
				environmentId: controller.credentials.environmentId,
				clientId: controller.credentials.clientId?.substring(0, 8) + '...',
				authMethod: controller.credentials.clientAuthMethod
			});
			
			// Save to flow-specific storage with enhanced error handling
			FlowCredentialService.saveFlowCredentials('client-credentials-v7', controller.credentials, {
				showToast: false
			}).catch((error) => {
				console.error('[Client Credentials V7] Failed to save credentials to V7 storage:', error);
				// Show user-friendly error message
				v4ToastManager.showError('Failed to save credentials. Please try again.');
			});
		}
	}, [controller.credentials]);

	// Use credential backup hook for automatic backup and restoration
	const { clearBackup, getBackupStats, downloadEnvFile } = useCredentialBackup({
		flowKey: 'client-credentials-v7',
		credentials: controller.credentials,
		setCredentials: controller.setCredentials,
		enabled: true
	});

	// Render step content
	const renderStepContent = useCallback(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('credentials')}
								aria-expanded={!collapsedSections.credentials}
							>
								<CollapsibleTitle>
									<FiSettings /> Credentials & Configuration
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.credentials && (
								<CollapsibleContent>
									<ComprehensiveCredentialsService
										flowType="client-credentials"
										onCredentialsChange={(credentials) => {
											controller.setCredentials(credentials);
										}}
										formData={{
											environmentId: controller.credentials.environmentId,
											clientId: controller.credentials.clientId,
											clientSecret: controller.credentials.clientSecret,
											grantTypes: ['client_credentials'], // Explicitly set for config checker
											responseTypes: [], // Client credentials doesn't use response types
											tokenEndpointAuthMethod: controller.credentials.clientAuthMethod || 'client_secret_post',
										}}
										title="Client Credentials Configuration"
										subtitle="Configure your client credentials for machine-to-machine authentication"
										requireClientSecret={true}
										showConfigChecker={true}
										workerToken={localStorage.getItem('worker-token') || ''}
										region="NA"
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
								onClick={() => toggleSection('authMethod')}
								aria-expanded={!collapsedSections.authMethod}
							>
								<CollapsibleTitle>
									<FiShield /> Authentication Method
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.authMethod && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Client Authentication Methods</InfoTitle>
											<InfoText>
												Choose how your client will authenticate with the authorization server.
												Client Credentials flow supports multiple authentication methods.
											</InfoText>
											<div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
												Current auth method: {controller.credentials.clientAuthMethod || 'none'}
											</div>
										</div>
									</InfoBox>
									
									<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
										<Button
											variant={controller.credentials.clientAuthMethod === 'client_secret_post' ? 'primary' : 'secondary'}
											onClick={() => {
												console.log('[ClientCredentials V7] Setting auth method to client_secret_post');
												controller.setCredentials({...controller.credentials, clientAuthMethod: 'client_secret_post'});
											}}
										>
											<FiKey /> Client Secret POST
										</Button>
										<Button
											variant={controller.credentials.clientAuthMethod === 'client_secret_basic' ? 'primary' : 'secondary'}
											onClick={() => {
												console.log('[ClientCredentials V7] Setting auth method to client_secret_basic');
												controller.setCredentials({...controller.credentials, clientAuthMethod: 'client_secret_basic'});
											}}
										>
											<FiShield /> Client Secret Basic
										</Button>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenRequest')}
								aria-expanded={!collapsedSections.tokenRequest}
							>
								<CollapsibleTitle>
									<FiCode /> Token Request
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenRequest && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Client Credentials Token Request</InfoTitle>
											<InfoText>
												The client sends a token request to the authorization server using its credentials.
											</InfoText>
										</div>
									</InfoBox>

									<ActionRow>
										<Button
											variant="primary"
											onClick={controller.requestToken}
											loading={controller.isLoading}
										>
											<FiRefreshCw /> Request Access Token
										</Button>
									</ActionRow>

									{controller.tokenRequest && (
										<GeneratedContentBox>
											<GeneratedLabel>Token Request Details</GeneratedLabel>
											<CodeBlock>{JSON.stringify(controller.tokenRequest, null, 2)}</CodeBlock>
											<ActionRow>
												<CopyButtonService
													text={JSON.stringify(controller.tokenRequest, null, 2)}
													label="Copy request JSON"
													variant="primary"
												/>
											</ActionRow>
										</GeneratedContentBox>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenResponse')}
								aria-expanded={!collapsedSections.tokenResponse}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Token Response
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenResponse && (
								<CollapsibleContent>
									{controller.tokens ? (
										<>
											<InfoBox $variant="success">
												<FiCheckCircle size={20} />
												<div>
													<InfoTitle>Access Token Received</InfoTitle>
													<InfoText>
														The authorization server has returned an access token for your client.
													</InfoText>
												</div>
											</InfoBox>

											{UnifiedTokenDisplayService.showTokens(
												controller.tokens,
												'oauth',
												'client-credentials-v7',
												{
													showCopyButtons: true,
													showDecodeButtons: true,
												}
											)}
										</>
									) : (
										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>No Token Received</InfoTitle>
												<InfoText>
													Complete the token request in step 2 to receive an access token.
												</InfoText>
											</div>
										</InfoBox>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('apiCall')}
								aria-expanded={!collapsedSections.apiCall}
							>
								<CollapsibleTitle>
									<FiExternalLink /> API Call
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.apiCall && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Using the Access Token</InfoTitle>
											<InfoText>
												Use the access token to make authenticated requests to protected APIs.
											</InfoText>
										</div>
									</InfoBox>

									{controller.tokens?.access_token && (
										<GeneratedContentBox>
											<GeneratedLabel>Example API Call</GeneratedLabel>
											<CodeBlock>{`curl -H "Authorization: Bearer ${controller.tokens.access_token}" \\
  https://api.example.com/protected-resource`}</CodeBlock>
											<ActionRow>
												<CopyButtonService
													text={`curl -H "Authorization: Bearer ${controller.tokens.access_token}" \\\n  https://api.example.com/protected-resource`}
													label="Copy cURL command"
													variant="primary"
												/>
											</ActionRow>
										</GeneratedContentBox>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 5:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('introspection')}
								aria-expanded={!collapsedSections.introspection}
							>
								<CollapsibleTitle>
									<FiShield /> Token Introspection
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.introspection && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Token Validation</InfoTitle>
											<InfoText>
												Validate the access token to ensure it's still valid and check its claims.
											</InfoText>
										</div>
									</InfoBox>

									<ActionRow>
										<Button
											variant="primary"
											onClick={controller.introspectToken}
											loading={controller.isLoading}
										>
											<FiShield /> Introspect Token
										</Button>
									</ActionRow>

									{controller.introspectionResult && (
										<GeneratedContentBox>
											<GeneratedLabel>Introspection Result</GeneratedLabel>
											<CodeBlock>{JSON.stringify(controller.introspectionResult, null, 2)}</CodeBlock>
											<ActionRow>
												<CopyButtonService
													text={JSON.stringify(controller.introspectionResult, null, 2)}
													label="Copy introspection result"
													variant="primary"
												/>
											</ActionRow>
										</GeneratedContentBox>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 6:
				return (
					<>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Client Credentials Flow Complete!</InfoTitle>
								<InfoText>
									You have successfully completed the OAuth 2.0 Client Credentials flow.
									Your client can now authenticate and access protected resources.
								</InfoText>
							</div>
						</InfoBox>

						<GeneratedContentBox>
							<GeneratedLabel>Flow Summary</GeneratedLabel>
							<InfoText>
								✅ Client credentials configured<br/>
								✅ Authentication method selected<br/>
								✅ Access token obtained<br/>
								✅ Token validated<br/>
								✅ Ready for API calls
							</InfoText>
						</GeneratedContentBox>
					</>
				);

			default:
				return <div>Step not implemented</div>;
		}
	}, [currentStep, collapsedSections, controller, toggleSection]);

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Client Credentials Flow · V7</VersionBadge>
							<StepHeaderTitle>
								{STEP_METADATA[currentStep].title}
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{STEP_METADATA[currentStep].subtitle}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of 07</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContent>
						{renderStepContent()}
					</StepContent>

					<StepNavigationButtons
						onNext={handleNext}
						onPrevious={handlePrevious}
						onReset={handleReset}
						canNavigateNext={canNavigateNext}
						isFirstStep={currentStep === 0}
						nextButtonText={currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next'}
						disabledMessage={controller.error || getStepValidationMessage(currentStep)}
					/>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default ClientCredentialsFlowV7Complete;

