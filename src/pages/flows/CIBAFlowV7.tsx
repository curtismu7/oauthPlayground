// src/pages/flows/CIBAFlowV7.tsx
// V7.0.0 OIDC Client Initiated Backchannel Authentication (CIBA) Flow - Enhanced Service Architecture

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiInfo,
	FiLock,
	FiShield,
	FiUser,
	FiKey,
	FiCheckCircle,
	FiRefreshCw,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiBook,
	FiSave,
	FiSmartphone,
	FiZap,
	FiClock,
	FiActivity,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useCibaFlowV7 } from '../../hooks/useCibaFlowV7';
import { FlowHeader } from '../../services/flowHeaderService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { FlowCredentialService } from '../../services/flowCredentialService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { EducationalContentService } from '../../services/educationalContentService.tsx';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { UnifiedTokenDisplay } from '../../services/unifiedTokenDisplayService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';
import { usePageScroll } from '../../hooks/usePageScroll';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';

// V7 Styled Components with enhanced styling
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
	background-color: #ffffff;
	border-radius: 1.5rem;
	box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15);
	overflow: hidden;
`;

const StepCard = styled.section`
	background: var(--surface-color, #ffffff);
	border-radius: 1rem;
	border: 1px solid var(--border-subtle, #e5e7eb);
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
	overflow: hidden;
	margin-bottom: 1.5rem;
`;

const StepHeader = styled.header`
	padding: clamp(1.5rem, 3vw, 2rem);
	background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	color: #ffffff;
	display: grid;
	gap: 0.75rem;
`;

const StepBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border-radius: 999px;
	padding: 0.375rem 0.9rem;
	background: rgba(255, 255, 255, 0.16);
	border: 1px solid rgba(255, 255, 255, 0.3);
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
`;

const StepTitle = styled.h2`
	margin: 0;
	font-size: clamp(1.3rem, 2.6vw, 1.6rem);
	font-weight: 700;
	letter-spacing: -0.01em;
`;

const StepSubtitle = styled.p`
	margin: 0;
	font-size: clamp(0.95rem, 2.2vw, 1.05rem);
	opacity: 0.9;
	line-height: 1.6;
`;

const StepBody = styled.div`
	padding: clamp(1.5rem, 3vw, 2rem);
	display: grid;
	gap: clamp(1.25rem, 3vw, 2rem);
`;

const FormGrid = styled.div`
	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	
	${props => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
					color: white;
					&:hover:not(:disabled) {
						transform: translateY(-1px);
						box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover:not(:disabled) {
						background: #e5e7eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover:not(:disabled) {
						background: #dc2626;
					}
				`;
			default:
				return `
					background: #8b5cf6;
					color: white;
					&:hover:not(:disabled) {
						background: #7c3aed;
					}
				`;
		}
	}}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const StatusCard = styled.div<{ $status: 'pending' | 'approved' | 'completed' | 'failed' }>`
	padding: 1.5rem;
	border-radius: 0.75rem;
	border: 1px solid;
	display: flex;
	align-items: center;
	gap: 1rem;
	
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
`;

const ProgressFill = styled.div<{ $progress: number }>`
	height: 100%;
	background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
	width: ${props => props.$progress}%;
	transition: width 0.3s ease;
`;

const CodeBlock = styled.pre`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
	margin: 0;
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

	// Local state for form inputs
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scope: 'openid profile',
		loginHint: '',
		bindingMessage: '',
		authMethod: 'client_secret_post' as const,
		requestContext: '',
	});

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
				setFormData(prev => ({
					...prev,
					environmentId: flowData.sharedEnvironment?.environmentId || '',
					clientId: flowData.flowCredentials.clientId,
					clientSecret: flowData.flowCredentials.clientSecret,
					scope: flowData.flowCredentials.scopes.join(' '),
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
				authMethod: formData.authMethod,
				requestContext: formData.requestContext || undefined,
			});
		}
	}, [formData, controller]);

	// Handle credentials from ComprehensiveCredentialsService
	const handleCredentialsUpdate = useCallback((credentials: any) => {
		console.log('[CIBA-V7] Credentials updated from ComprehensiveCredentialsService:', credentials);
		
		// Update form data with credentials from the service
		if (credentials.environmentId) {
			updateFormData('environmentId', credentials.environmentId);
		}
		if (credentials.clientId) {
			updateFormData('clientId', credentials.clientId);
		}
		if (credentials.clientSecret) {
			updateFormData('clientSecret', credentials.clientSecret);
		}
		if (credentials.scope) {
			updateFormData('scope', credentials.scope);
		}
	}, [updateFormData]);

	// Handle OIDC discovery completion
	const handleDiscoveryComplete = useCallback((result: any) => {
		console.log('🔍 [CIBA-V7] OIDC Discovery completed:', result);
		if (result.success && result.document) {
			const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
			if (extractedEnvId) {
				console.log('✅ [CIBA-V7] Extracted environment ID:', extractedEnvId);
				updateFormData('environmentId', extractedEnvId);
			}
		}
	}, [updateFormData]);

	// Save credentials using V7 standardized storage
	const saveCredentials = useCallback(async () => {
		try {
			const credentials = {
				environmentId: formData.environmentId,
				clientId: formData.clientId,
				clientSecret: formData.clientSecret,
				scope: formData.scope,
				scopes: formData.scope,
			};

			// Save credentials using comprehensive service with complete isolation
			const success = comprehensiveFlowDataService.saveFlowDataComprehensive('ciba-flow-v7', {
				sharedEnvironment: formData.environmentId ? {
					environmentId: formData.environmentId,
					region: 'us', // Default region
					issuerUrl: `https://auth.pingone.com/${formData.environmentId}`
				} : undefined,
				flowCredentials: {
					clientId: formData.clientId,
					clientSecret: formData.clientSecret,
					redirectUri: formData.redirectUri || 'https://example.com/callback',
					scopes: formData.scope.split(' ').filter(s => s.length > 0),
					logoutUrl: formData.logoutUrl,
					loginHint: formData.loginHint,
					tokenEndpointAuthMethod: 'client_secret_basic',
					lastUpdated: Date.now()
				}
			});

			if (success) {
				v4ToastManager.showSuccess('Credentials saved successfully!');
			} else {
				v4ToastManager.showError('Failed to save credentials');
			}
		} catch (error) {
			console.error('[CIBA-V7] Failed to save credentials:', error);
			v4ToastManager.showError('Failed to save credentials');
		}
	}, [formData]);

	// Handle form submission
	const handleStartFlow = useCallback(() => {
		controller.startFlow();
	}, [controller]);

	// Handle reset
	const handleReset = useCallback(() => {
		controller.resetFlow();
		setFormData({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			scope: 'openid profile',
			loginHint: '',
			bindingMessage: '',
			authMethod: 'client_secret_post',
			requestContext: '',
		});
	}, [controller]);

	// Copy to clipboard
	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	}, []);

	// Render step content
	const renderStepContent = () => {
		switch (controller.currentStep) {
			case 0:
				return (
					<StepCard>
						<StepHeader>
							<StepBadge>
								<FiShield />
								Step 1 of {controller.totalSteps}
							</StepBadge>
							<StepTitle>Configure CIBA Parameters</StepTitle>
							<StepSubtitle>
								Set up your CIBA configuration with environment details and authentication parameters. 
								Basic credentials are managed by the ComprehensiveCredentialsService above.
							</StepSubtitle>
						</StepHeader>
						<StepBody>
							{/* Enhanced CIBA Educational Content */}
							<EnhancedFlowInfoCard
								flowType="ciba-v7"
							/>

							<FlowConfigurationRequirements
								flowType="ciba"
								requirements={[
									"PingOne environment with CIBA support",
									"Client credentials (ID and secret)",
									"Proper redirect URI configuration",
									"CIBA-specific authentication parameters"
								]}
							/>

							<EnhancedFlowWalkthrough
								flowType="ciba"
								steps={[
									"Configure CIBA parameters and credentials",
									"Initiate backchannel authentication request",
									"Monitor authentication status",
									"Exchange tokens upon successful authentication"
								]}
							/>
							{formData.environmentId && formData.clientId && (
								<StatusCard $status="completed">
									<FiCheckCircle />
									<div>
										<strong>Credentials Loaded</strong>
										<p>Basic credentials have been loaded from ComprehensiveCredentialsService. You can now configure CIBA-specific parameters below.</p>
									</div>
								</StatusCard>
							)}
							
							<FormGrid>
								<FormField>
									<Label>Environment ID *</Label>
									<Input
										type="text"
										value={formData.environmentId}
										onChange={(e) => updateFormData('environmentId', e.target.value)}
										placeholder="Enter your PingOne environment ID"
										disabled={!!formData.environmentId}
									/>
									{formData.environmentId && (
										<small style={{ color: '#10b981', fontSize: '0.75rem' }}>
											✓ Loaded from ComprehensiveCredentialsService
										</small>
									)}
								</FormField>
								
								<FormField>
									<Label>Client ID *</Label>
									<Input
										type="text"
										value={formData.clientId}
										onChange={(e) => updateFormData('clientId', e.target.value)}
										placeholder="Enter your application client ID"
										disabled={!!formData.clientId}
									/>
									{formData.clientId && (
										<small style={{ color: '#10b981', fontSize: '0.75rem' }}>
											✓ Loaded from ComprehensiveCredentialsService
										</small>
									)}
								</FormField>
								
								<FormField>
									<Label>Client Secret</Label>
									<Input
										type="password"
										value={formData.clientSecret}
										onChange={(e) => updateFormData('clientSecret', e.target.value)}
										placeholder="Enter your client secret (optional for public clients)"
										disabled={!!formData.clientSecret}
									/>
									{formData.clientSecret && (
										<small style={{ color: '#10b981', fontSize: '0.75rem' }}>
											✓ Loaded from ComprehensiveCredentialsService
										</small>
									)}
								</FormField>
								
								<FormField>
									<Label>Scope *</Label>
									<Input
										type="text"
										value={formData.scope}
										onChange={(e) => updateFormData('scope', e.target.value)}
										placeholder="openid profile email"
										disabled={!!formData.scope}
									/>
									{formData.scope && (
										<small style={{ color: '#10b981', fontSize: '0.75rem' }}>
											✓ Loaded from ComprehensiveCredentialsService
										</small>
									)}
								</FormField>
								
								<FormField>
									<Label>Login Hint *</Label>
									<Input
										type="text"
										value={formData.loginHint}
										onChange={(e) => updateFormData('loginHint', e.target.value)}
										placeholder="user@example.com or user_id"
									/>
								</FormField>
								
								<FormField>
									<Label>Authentication Method *</Label>
									<Select
										value={formData.authMethod}
										onChange={(e) => updateFormData('authMethod', e.target.value)}
									>
										<option value="client_secret_post">Client Secret Post</option>
										<option value="client_secret_basic">Client Secret Basic</option>
									</Select>
								</FormField>
								
								<FormField>
									<Label>Binding Message</Label>
									<Input
										type="text"
										value={formData.bindingMessage}
										onChange={(e) => updateFormData('bindingMessage', e.target.value)}
										placeholder="Optional binding message for user"
									/>
								</FormField>
								
								<FormField>
									<Label>Request Context</Label>
									<TextArea
										value={formData.requestContext}
										onChange={(e) => updateFormData('requestContext', e.target.value)}
										placeholder="Optional request context (JSON format)"
									/>
								</FormField>
							</FormGrid>
							
							{controller.error && (
								<StatusCard $status="failed">
									<FiAlertTriangle />
									<div>
										<strong>Configuration Error:</strong> {controller.error}
									</div>
								</StatusCard>
							)}
						</StepBody>
					</StepCard>
				);

			case 1:
				return (
					<StepCard>
						<StepHeader>
							<StepBadge>
								<FiZap />
								Step 2 of {controller.totalSteps}
							</StepBadge>
							<StepTitle>Initiate Authentication Request</StepTitle>
							<StepSubtitle>
								Start the CIBA authentication process and generate the authentication request
							</StepSubtitle>
						</StepHeader>
						<StepBody>
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
									
									<div>
										<h4>Request Details:</h4>
										<CodeBlock>
											{JSON.stringify(controller.authRequest, null, 2)}
										</CodeBlock>
									</div>
									
									<div>
										<h4>User Code:</h4>
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
									<p>Click the button below to initiate the CIBA authentication request.</p>
									<Button onClick={handleStartFlow} disabled={!controller.canStart}>
										<FiZap />
										Start CIBA Flow
									</Button>
								</div>
							)}
						</StepBody>
					</StepCard>
				);

			case 2:
				return (
					<StepCard>
						<StepHeader>
							<StepBadge>
								<FiSmartphone />
								Step 3 of {controller.totalSteps}
							</StepBadge>
							<StepTitle>User Approval Process</StepTitle>
							<StepSubtitle>
								Monitor the user approval process and wait for authentication completion
							</StepSubtitle>
						</StepHeader>
						<StepBody>
							{/* CIBA User Approval Educational Content */}
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
										<div>
											<h4>Time Remaining: {Math.floor(controller.timeRemaining / 60)}:{(controller.timeRemaining % 60).toString().padStart(2, '0')}</h4>
											<ProgressBar>
												<ProgressFill $progress={controller.progressPercentage} />
											</ProgressBar>
										</div>
									)}
									
									<div>
										<h4>Binding Message:</h4>
										<CodeBlock>{controller.authRequest.bindingMessage}</CodeBlock>
									</div>
								</>
							)}
						</StepBody>
					</StepCard>
				);

			case 3:
				return (
					<StepCard>
						<StepHeader>
							<StepBadge>
								<FiCheckCircle />
								Step 4 of {controller.totalSteps}
							</StepBadge>
							<StepTitle>Token Exchange & Results</StepTitle>
							<StepSubtitle>
								View the authentication results and access tokens
							</StepSubtitle>
						</StepHeader>
						<StepBody>
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
									<p>No tokens available yet. Complete the previous steps to receive tokens.</p>
								</div>
							)}
						</StepBody>
					</StepCard>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<FlowHeader flowId="ciba-v7" />
					
					<ComprehensiveCredentialsService
						flowKey="ciba-v7"
						flowType="oidc"
						flowVersion="V7"
						showConfigChecker={true}
						showExportImport={true}
						showAdvancedSettings={true}
						onCredentialsUpdate={handleCredentialsUpdate}
						onDiscoveryComplete={handleDiscoveryComplete}
						initialCredentials={{
							environmentId: formData.environmentId,
							clientId: formData.clientId,
							clientSecret: formData.clientSecret,
							scope: formData.scope,
						}}
					/>
					
					{renderStepContent()}
					
					<StepNavigationButtons
						onNext={controller.stepManager.next}
						onPrevious={controller.stepManager.previous}
						onReset={handleReset}
						canNavigateNext={controller.currentStep < controller.totalSteps - 1}
						isFirstStep={controller.currentStep === 0}
						nextButtonText={controller.currentStep === controller.totalSteps - 1 ? 'Complete' : 'Next'}
						disabledMessage={controller.error || ''}
					/>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default CIBAFlowV7;
