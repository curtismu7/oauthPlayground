// src/pages/flows/CIBAFlowV7.tsx
// V7.0.0 OIDC Client Initiated Backchannel Authentication (CIBA) Flow - Enhanced Service Architecture

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
	FiAlertTriangle,
	FiInfo,
	FiShield,
	FiCheckCircle,
	FiCopy,
	FiSmartphone,
	FiZap,
	FiClock,
	FiActivity,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useCibaFlowV7 } from '../../hooks/useCibaFlowV7';
import { FlowHeader } from '../../services/flowHeaderService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { UnifiedTokenDisplay } from '../../services/unifiedTokenDisplayService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { usePageScroll } from '../../hooks/usePageScroll';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { FlowUIService } from '../../services/flowUIService';
import { ClientAuthMethod } from '../../utils/clientAuthentication';

// Get UI components from FlowUIService (following Implicit flow pattern)
const {
	Container,
	ContentWrapper,
	MainCard,
	StepHeader,
	StepHeaderLeft,
	VersionBadge,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepHeaderRight,
	StepNumber,
	StepTotal,
	StepContentWrapper,
	InfoBox,
	InfoTitle,
	InfoText,
	Button,
	CodeBlock,
} = FlowUIService.getFlowUIComponents();

// Local styled components for CIBA-specific UI
const StatusCard = styled.div<{ $status: 'pending' | 'approved' | 'completed' | 'failed' }>`
	padding: 1.5rem;
	border-radius: 0.75rem;
	border: 1px solid;
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
	
	${props => {
		switch (props.$status) {
			case 'pending':
				return `
					background: #fef3c7;
					border-color: #f59e0b;
					color: #92400e;
				`;
			case 'approved':
				return `
					background: #d1fae5;
					border-color: #10b981;
					color: #065f46;
				`;
			case 'completed':
				return `
					background: #dbeafe;
					border-color: #3b82f6;
					color: #1e40af;
				`;
			case 'failed':
				return `
					background: #fee2e2;
					border-color: #ef4444;
					color: #991b1b;
				`;
			default:
				return `
					background: #f3f4f6;
					border-color: #d1d5db;
					color: #374151;
				`;
		}
	}}
`;

const ProgressBar = styled.div`
	width: 100%;
	height: 8px;
	background: #e5e7eb;
	border-radius: 4px;
	overflow: hidden;
	margin: 1rem 0;
`;

const ProgressFill = styled.div<{ $progress: number }>`
	height: 100%;
	background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
	width: ${props => props.$progress}%;
	transition: width 0.3s ease;
`;

const FormGrid = styled.div`
	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	margin-top: 1.5rem;
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}
	
	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
`;

const TextArea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	min-height: 100px;
	resize: vertical;
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}
`;

const Select = styled.select`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}
`;

const CIBAFlowV7: React.FC = () => {
	// Initialize page scroll management
	usePageScroll();
	
	// Initialize CIBA V7 flow controller
	const controller = useCibaFlowV7({
		flowKey: 'ciba-v7',
		flowVersion: 'V7',
		enableAdvancedFeatures: true,
		enableSecurityFeatures: true,
		enableEducationalContent: true,
	});

	// Local currentStep state (following Implicit flow pattern)
	const [currentStep, setCurrentStep] = useState(0);

	// Local state for form inputs
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scope: 'openid profile',
		loginHint: '',
		bindingMessage: '',
		requestContext: '',
	});

	// Track clientAuthMethod from ComprehensiveCredentialsService (syncs with Token Endpoint Auth Method)
	const [clientAuthMethod, setClientAuthMethod] = useState<ClientAuthMethod>('client_secret_post');

	// Update form data
	const updateFormData = useCallback((field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	}, []);

	// Load credentials using V7 comprehensive service with complete isolation
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('🔄 [CIBA-V7] Loading credentials with comprehensive service...');
			
			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: 'ciba-flow-v7',
				useSharedEnvironment: true,
				useSharedDiscovery: true
			});

			if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log('✅ [CIBA-V7] Found flow-specific credentials');
				
				// Load clientAuthMethod from saved credentials if available
				if (flowData.flowCredentials.tokenEndpointAuthMethod || flowData.flowCredentials.clientAuthMethod) {
					const savedAuthMethod = (flowData.flowCredentials.tokenEndpointAuthMethod || flowData.flowCredentials.clientAuthMethod) as ClientAuthMethod;
					if (['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'].includes(savedAuthMethod)) {
						setClientAuthMethod(savedAuthMethod);
						console.log('✅ [CIBA-V7] Loaded clientAuthMethod:', savedAuthMethod);
					}
				}
				
				setFormData(prev => ({
					...prev,
					environmentId: flowData.sharedEnvironment?.environmentId || prev.environmentId || '',
					clientId: flowData.flowCredentials.clientId || prev.clientId || '',
					clientSecret: flowData.flowCredentials.clientSecret || prev.clientSecret || '',
					scope: flowData.flowCredentials.scopes?.join(' ') || prev.scope || 'openid profile',
					// Preserve loginHint and other CIBA-specific fields (don't overwrite from credentials)
					loginHint: prev.loginHint || '',
					bindingMessage: prev.bindingMessage || '',
					requestContext: prev.requestContext || '',
				}));
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [CIBA-V7] Using shared environment data only');
				setFormData(prev => ({
					...prev,
					environmentId: flowData.sharedEnvironment.environmentId,
				}));
			} else {
				console.log('ℹ️ [CIBA-V7] No saved credentials found, using defaults');
			}
		};

		loadCredentials();
	}, []);

	// Update configuration when form data changes
	useEffect(() => {
		if (formData.environmentId && formData.clientId && formData.scope && formData.loginHint) {
			controller.updateConfig({
				environmentId: formData.environmentId,
				clientId: formData.clientId,
				clientSecret: formData.clientSecret || undefined,
				scope: formData.scope,
				loginHint: formData.loginHint,
				bindingMessage: formData.bindingMessage || undefined,
				authMethod: clientAuthMethod as 'client_secret_post' | 'client_secret_basic', // Use synced value from ComprehensiveCredentialsService
				requestContext: formData.requestContext || undefined,
			});
		}
	}, [formData, clientAuthMethod, controller]);

	// Auto-advance to step 2 when auth request is created
	useEffect(() => {
		if (controller.authRequest && currentStep === 1) {
			setCurrentStep(2);
		}
	}, [controller.authRequest, currentStep]);

	// Auto-advance to step 3 when tokens are received
	useEffect(() => {
		if (controller.tokens && currentStep < 3) {
			setCurrentStep(3);
		}
	}, [controller.tokens, currentStep]);

	// Handle form submission
	const handleStartFlow = useCallback(() => {
		controller.startFlow();
		if (currentStep === 0) {
			setCurrentStep(1);
		}
	}, [controller, currentStep]);

	// Handle reset
	const handleReset = useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
		setFormData({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			scope: 'openid profile',
			loginHint: '',
			bindingMessage: '',
			requestContext: '',
		});
		setClientAuthMethod('client_secret_post'); // Reset to default
	}, [controller]);

	// Copy to clipboard
	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	}, []);

	// Step validation
	const isStepValid = useCallback((step: number): boolean => {
		switch (step) {
			case 0:
				// For step 0, we need: credentials (env ID, client ID, scope) from ComprehensiveCredentialsService AND loginHint
				// The credentials come from ComprehensiveCredentialsService, so we check formData (populated by onCredentialsChange)
				return !!(formData.environmentId && formData.clientId && formData.scope && formData.loginHint);
			case 1:
				// Step 1 is valid if we have an auth request (can navigate to step 2 to see polling)
				return true; // Always allow navigation to step 1
			case 2:
				// Step 2 validation - allow navigation if we have an auth request
				return !!controller.authRequest;
			case 3:
				// Step 3 validation - tokens available
				return !!controller.tokens;
			default:
				return true;
		}
	}, [formData, controller]);

	// Get step validation message for disabled button
	const getStepValidationMessage = useCallback((step: number): string => {
		if (isStepValid(step)) return '';
		
		switch (step) {
			case 0:
				const missing: string[] = [];
				if (!formData.environmentId) missing.push('Environment ID');
				if (!formData.clientId) missing.push('Client ID');
				if (!formData.scope) missing.push('Scope');
				if (!formData.loginHint) missing.push('Login Hint');
				return missing.length > 0 ? `Missing: ${missing.join(', ')}` : '';
			case 1:
				return '';
			case 2:
				return !controller.authRequest ? 'Authentication request not created yet' : '';
			case 3:
				return !controller.tokens ? 'Tokens not received yet' : '';
			default:
				return '';
		}
	}, [formData, controller, isStepValid]);

	// STEP_METADATA (following Implicit flow pattern)
	const STEP_METADATA = [
		{ title: 'Step 0: Configure CIBA Parameters', subtitle: 'Set up environment and authentication parameters' },
		{ title: 'Step 1: Initiate Authentication Request', subtitle: 'Start the CIBA backchannel authentication' },
		{ title: 'Step 2: User Approval Process', subtitle: 'Monitor user approval on their device' },
		{ title: 'Step 3: Token Exchange & Results', subtitle: 'View authentication results and tokens' },
	];

	// Render step content (following Implicit flow pattern)
	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						{/* Concise CIBA Educational Content */}
						<InfoBox $variant="info" style={{ marginBottom: '1.5rem' }}>
							<FiInfo />
							<div>
								<InfoTitle>What is CIBA?</InfoTitle>
								<InfoText>
									<strong>Client Initiated Backchannel Authentication (CIBA)</strong> is an OIDC extension (RFC 9436) 
									that enables decoupled authentication. The client initiates authentication on one device (e.g., IoT device, 
									smart TV), and the user approves it on a different device (e.g., their phone). Perfect for devices without 
									keyboards or full browsers.
								</InfoText>
								<InfoText style={{ marginTop: '0.75rem' }}>
									<strong>Key Steps:</strong> (1) Client sends backchannel request with login_hint (2) User receives notification 
									on their device (3) User approves/denies (4) Client polls for tokens using auth_req_id.
								</InfoText>
							</div>
						</InfoBox>

						<FlowConfigurationRequirements
							flowType="ciba"
							requirements={[
								"PingOne environment with CIBA support enabled",
								"Client ID and secret (client authentication required)",
								"Login hint (email, phone, or user ID) to identify the user",
								"Scope: 'openid' required for OIDC; add 'profile', 'email' as needed"
							]}
						/>

						{formData.environmentId && formData.clientId ? (
							<StatusCard $status="completed" style={{ marginTop: '1.5rem' }}>
								<FiCheckCircle />
								<div>
									<strong>Credentials Ready</strong>
									<p>Basic credentials are configured above. Configure CIBA-specific parameters below.</p>
								</div>
							</StatusCard>
						) : (
							<StatusCard $status="pending" style={{ marginTop: '1.5rem' }}>
								<FiInfo />
								<div>
									<strong>Configure Credentials First</strong>
									<p>Please configure Environment ID, Client ID, and Scope in the credentials section above before proceeding.</p>
								</div>
							</StatusCard>
						)}
						
						<div style={{ marginTop: '2rem' }}>
							<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
								CIBA-Specific Parameters
							</h3>
							<FormGrid>
								<FormField>
									<Label>Login Hint *</Label>
									<Input
										type="text"
										value={formData.loginHint || ''}
										onChange={(e) => {
											console.log('[CIBA-V7] Login Hint changed:', e.target.value);
											updateFormData('loginHint', e.target.value);
										}}
										placeholder="user@example.com"
										disabled={false}
										readOnly={false}
										autoComplete="off"
									/>
									<small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
										💡 Examples: user@example.com, +1234567890, or user_id_12345
									</small>
								</FormField>
								
								<FormField>
									<Label>Binding Message</Label>
									<Input
										type="text"
										value={formData.bindingMessage}
										onChange={(e) => updateFormData('bindingMessage', e.target.value)}
										placeholder="Please approve login to Smart TV in Living Room"
									/>
									<small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
										💡 Example: "Sign in request from your Smart TV" - displayed to user during approval (optional)
									</small>
								</FormField>
								
								<FormField>
									<Label>Request Context</Label>
									<TextArea
										value={formData.requestContext}
										onChange={(e) => updateFormData('requestContext', e.target.value)}
										placeholder='{"device": "Smart TV", "location": "Living Room", "ip": "192.168.1.100"}'
										rows={4}
									/>
									<small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
										💡 Example: Additional context in JSON format (optional) - helps user identify the request source
									</small>
								</FormField>
							</FormGrid>
						</div>
						
						{controller.error && (
							<StatusCard $status="failed" style={{ marginTop: '1.5rem' }}>
								<FiAlertTriangle />
								<div>
									<strong>Configuration Error:</strong> {controller.error}
								</div>
							</StatusCard>
						)}
					</>
				);

			case 1:
				return (
					<>
						{controller.isInProgress ? (
							<StatusCard $status="pending">
								<FiActivity />
								<div>
									<strong>Initiating CIBA Request...</strong>
									<p>Please wait while we initiate the authentication request.</p>
								</div>
							</StatusCard>
						) : controller.authRequest ? (
							<>
								<StatusCard $status="approved">
									<FiCheckCircle />
									<div>
										<strong>Authentication Request Created</strong>
										<p>Request ID: {controller.authRequest.stateId}</p>
									</div>
								</StatusCard>
								
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>Request Details:</h4>
									<CodeBlock>
										{JSON.stringify(controller.authRequest, null, 2)}
									</CodeBlock>
								</div>
								
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>User Code:</h4>
									<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
										<CodeBlock style={{ margin: 0, flex: 1 }}>
											{controller.authRequest.userCode}
										</CodeBlock>
										<Button onClick={() => handleCopy(controller.authRequest!.userCode, 'User Code')}>
											<FiCopy />
											Copy
										</Button>
									</div>
								</div>
							</>
						) : (
							<div>
								<InfoText>Click the button below to initiate the CIBA authentication request.</InfoText>
								<Button onClick={handleStartFlow} disabled={!controller.canStart} style={{ marginTop: '1rem' }}>
									<FiZap />
									Start CIBA Flow
								</Button>
							</div>
						)}
					</>
				);

			case 2:
				return (
					<>
						<FlowSequenceDisplay
							title="CIBA User Approval Process"
							description="The user approval process is a critical part of CIBA authentication, ensuring secure backchannel communication."
							steps={[
								{
									title: "Authentication Request Sent",
									description: "The client initiates a backchannel authentication request to PingOne",
									status: "completed"
								},
								{
									title: "User Notification",
									description: "PingOne notifies the user through their preferred method (push notification, SMS, etc.)",
									status: "completed"
								},
								{
									title: "User Approval",
									description: "The user reviews and approves the authentication request on their device",
									status: controller.authRequest?.status === 'approved' ? 'completed' : 'pending'
								},
								{
									title: "Token Exchange",
									description: "Upon approval, tokens are exchanged and returned to the client",
									status: controller.authRequest?.status === 'approved' ? 'completed' : 'pending'
								}
							]}
						/>

						{controller.authRequest && (
							<>
								<StatusCard $status={controller.authRequest.status === 'approved' ? 'approved' : 'pending'}>
									{controller.authRequest.status === 'approved' ? <FiCheckCircle /> : <FiClock />}
									<div>
										<strong>
											{controller.authRequest.status === 'approved' ? 'User Approved' : 'Waiting for User Approval'}
										</strong>
										<p>
											{controller.authRequest.status === 'approved' 
												? 'The user has approved the authentication request.'
												: 'Please wait for the user to approve the authentication request on their device.'
											}
										</p>
									</div>
								</StatusCard>
								
								{controller.timeRemaining > 0 && (
									<div style={{ marginTop: '1.5rem' }}>
										<h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
											Time Remaining: {Math.floor(controller.timeRemaining / 60)}:{(controller.timeRemaining % 60).toString().padStart(2, '0')}
										</h4>
										<ProgressBar>
											<ProgressFill $progress={controller.progressPercentage} />
										</ProgressBar>
									</div>
								)}
								
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>Binding Message:</h4>
									<CodeBlock>{controller.authRequest.bindingMessage}</CodeBlock>
								</div>
							</>
						)}
					</>
				);

			case 3:
				return (
					<>
						{controller.tokens ? (
							<>
								<StatusCard $status="completed">
									<FiCheckCircle />
									<div>
										<strong>Authentication Successful</strong>
										<p>CIBA flow completed successfully. Access tokens have been issued.</p>
									</div>
								</StatusCard>
								
								<UnifiedTokenDisplay
									tokens={controller.tokens}
									flowType="oidc"
									flowKey="ciba-v7"
									showCopyButtons={true}
									showDecodeButtons={true}
								/>
							</>
						) : (
							<div>
								<InfoText>No tokens available yet. Complete the previous steps to receive tokens.</InfoText>
							</div>
						)}
					</>
				);

			default:
				return <div>Step not implemented</div>;
		}
	}, [currentStep, formData, controller, updateFormData, handleCopy, handleStartFlow]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="ciba-v7" />
				
				<ComprehensiveCredentialsService
					flowType="ciba-v7"
					isOIDC={true}
					workerToken={localStorage.getItem('worker_token') || ''}
					region="NA"
					credentials={{
						environmentId: formData.environmentId,
						clientId: formData.clientId,
						clientSecret: formData.clientSecret,
						scope: formData.scope,
					}}
					onCredentialsChange={(credentials) => {
						console.log('[CIBA-V7] Credentials changed:', credentials);
						if (credentials.environmentId) updateFormData('environmentId', credentials.environmentId);
						if (credentials.clientId) updateFormData('clientId', credentials.clientId);
						if (credentials.clientSecret) updateFormData('clientSecret', credentials.clientSecret);
						if (credentials.scope) updateFormData('scope', credentials.scope);
						// Don't update loginHint from ComprehensiveCredentialsService - it's CIBA-specific
					}}
					onClientAuthMethodChange={(method) => {
						console.log('[CIBA-V7] Client Auth Method changed:', method);
						setClientAuthMethod(method);
					}}
					clientAuthMethod={clientAuthMethod}
					onDiscoveryComplete={(result) => {
						console.log('🔍 [CIBA-V7] OIDC Discovery completed:', result);
						if (result.success && result.document) {
							const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
							if (extractedEnvId) {
								console.log('✅ [CIBA-V7] Extracted environment ID:', extractedEnvId);
								updateFormData('environmentId', extractedEnvId);
							}
						}
					}}
					requireClientSecret={true}
					showConfigChecker={true}
					defaultCollapsed={false}
					showLoginHint={false}
					title="CIBA Flow Configuration"
					subtitle="Configure your client credentials for CIBA backchannel authentication"
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V7</VersionBadge>
							<div>
								<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
								<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
							</div>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>
						{renderStepContent}
					</StepContentWrapper>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() => setCurrentStep(prev => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep)}
					isFirstStep={currentStep === 0}
					nextButtonText="Next"
					disabledMessage={getStepValidationMessage(currentStep)}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default CIBAFlowV7;
