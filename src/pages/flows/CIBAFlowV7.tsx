// src/pages/flows/CIBAFlowV7.tsx
// V7.0.0 OIDC Client Initiated Backchannel Authentication (CIBA) Flow - Enhanced Service Architecture

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
import { LearningTooltip } from '../../components/LearningTooltip';

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

	// Scroll to top when step changes (ensures each step appears as a separate page)
	useEffect(() => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}, [currentStep]);

	// Local state for form inputs
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scope: 'openid profile',
		loginHint: '',
		bindingMessage: '',
		requestContext: JSON.stringify({"device":"Smart TV", "location": "living Room", "ip": "192.168.1.1"}, null, 2),
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
					// Load CIBA-specific fields from flowConfig if available
					loginHint: (flowData.flowConfig as any)?.loginHint || prev.loginHint || '',
					bindingMessage: (flowData.flowConfig as any)?.bindingMessage || prev.bindingMessage || '',
					requestContext: (flowData.flowConfig as any)?.requestContext || prev.requestContext || JSON.stringify({"device":"Smart TV", "location": "living Room", "ip": "192.168.1.1"}, null, 2),
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

	// Update configuration when form data changes - with debounce to prevent infinite loops
	const updateConfigTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	
	useEffect(() => {
		// Clear any pending update
		if (updateConfigTimeoutRef.current) {
			clearTimeout(updateConfigTimeoutRef.current);
		}
		
		// Only update if we have all required fields
		if (formData.environmentId && formData.clientId && formData.scope && formData.loginHint) {
			// Debounce updates to prevent infinite loops
			updateConfigTimeoutRef.current = setTimeout(() => {
				controller.updateConfig({
					environmentId: formData.environmentId,
					clientId: formData.clientId,
					clientSecret: formData.clientSecret || undefined,
					scope: formData.scope,
					loginHint: formData.loginHint,
					bindingMessage: formData.bindingMessage || undefined,
					authMethod: clientAuthMethod as 'client_secret_post' | 'client_secret_basic',
					requestContext: formData.requestContext || undefined,
				});
			}, 150); // Small debounce to prevent rapid updates
		}
		
		return () => {
			if (updateConfigTimeoutRef.current) {
				clearTimeout(updateConfigTimeoutRef.current);
			}
		};
		// Only depend on the actual values, not the objects themselves
	}, [formData.environmentId, formData.clientId, formData.clientSecret, formData.scope, formData.loginHint, formData.bindingMessage, formData.requestContext, clientAuthMethod, controller.updateConfig]);

	// Save credentials when form data changes (similar to Device Authorization Flow)
	// Use a ref to track the previous values to prevent unnecessary saves
	const previousCredentialsRef = useRef<{
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		scope?: string;
		loginHint?: string;
		bindingMessage?: string;
		requestContext?: string;
		clientAuthMethod?: ClientAuthMethod;
	}>({});
	const saveCredentialsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	
	useEffect(() => {
		// Only save if we have required credentials and values have actually changed
		if (formData.environmentId && formData.clientId) {
			const prev = previousCredentialsRef.current;
			const hasChanged = 
				prev.environmentId !== formData.environmentId ||
				prev.clientId !== formData.clientId ||
				prev.clientSecret !== formData.clientSecret ||
				prev.scope !== formData.scope ||
				prev.loginHint !== formData.loginHint ||
				prev.bindingMessage !== formData.bindingMessage ||
				prev.requestContext !== formData.requestContext ||
				prev.clientAuthMethod !== clientAuthMethod;
			
			if (hasChanged) {
				// Clear any pending save
				if (saveCredentialsTimeoutRef.current) {
					clearTimeout(saveCredentialsTimeoutRef.current);
				}
				
				// Debounce the save to prevent excessive writes
				saveCredentialsTimeoutRef.current = setTimeout(() => {
					console.log('🔧 [CIBA-V7] Saving credentials to comprehensive service:', {
						flowKey: 'ciba-flow-v7',
						environmentId: formData.environmentId,
						clientId: formData.clientId?.substring(0, 8) + '...',
						hasClientSecret: !!formData.clientSecret,
						scope: formData.scope,
						hasLoginHint: !!formData.loginHint,
					});
					
					// Save to comprehensive service with complete isolation (same pattern as other V7 flows)
					try {
						const success = comprehensiveFlowDataService.saveFlowDataComprehensive('ciba-flow-v7', {
							...(formData.environmentId && {
							sharedEnvironment: {
								environmentId: formData.environmentId,
								region: formData.region || 'us',
								issuerUrl: (() => {
									const regionDomains: Record<string, string> = {
										us: 'auth.pingone.com',
										eu: 'auth.pingone.eu',
										ap: 'auth.pingone.asia',
										ca: 'auth.pingone.ca',
										na: 'auth.pingone.com'
									};
									const domain = regionDomains[formData.region || 'us'] || 'auth.pingone.com';
									return `https://${domain}/${formData.environmentId}`;
								})()
							}
							}),
							flowCredentials: {
								clientId: formData.clientId,
								clientSecret: formData.clientSecret,
								scopes: formData.scope ? formData.scope.split(/\s+/).filter(Boolean) : [],
								tokenEndpointAuthMethod: clientAuthMethod,
								lastUpdated: Date.now()
							},
							// Save CIBA-specific fields in flowConfig
							flowConfig: {
								loginHint: formData.loginHint || undefined,
								bindingMessage: formData.bindingMessage || undefined,
								requestContext: formData.requestContext || undefined,
							}
						}, { showToast: false });

						if (!success) {
							console.error('[CIBA-V7] Failed to save credentials to comprehensive service');
						} else {
							console.log('✅ [CIBA-V7] Credentials saved successfully');
							// Update ref with current values
							previousCredentialsRef.current = {
								environmentId: formData.environmentId,
								clientId: formData.clientId,
								clientSecret: formData.clientSecret,
								scope: formData.scope,
								loginHint: formData.loginHint,
								bindingMessage: formData.bindingMessage,
								requestContext: formData.requestContext,
								clientAuthMethod: clientAuthMethod,
							};
						}
					} catch (error) {
						console.error('[CIBA-V7] Failed to save credentials:', error);
					}
				}, 500); // 500ms debounce
			}
		}
		
		return () => {
			if (saveCredentialsTimeoutRef.current) {
				clearTimeout(saveCredentialsTimeoutRef.current);
			}
		};
	}, [formData.environmentId, formData.clientId, formData.clientSecret, formData.scope, formData.loginHint, formData.bindingMessage, formData.requestContext, clientAuthMethod]);

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
			requestContext: JSON.stringify({"device":"Smart TV", "location": "living Room", "ip": "192.168.1.1"}, null, 2),
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
						{/* Comprehensive CIBA Educational Content */}
						<InfoBox $variant="info" style={{ marginBottom: '1.5rem' }}>
							<FiInfo />
							<div>
								<InfoTitle>
									What is <LearningTooltip variant="learning" title="CIBA (Client Initiated Backchannel Authentication)" content="An OIDC extension (RFC 9436) that enables decoupled authentication. The client initiates authentication on one device, and the user approves it on a different trusted device (e.g., phone)." placement="top">CIBA</LearningTooltip>? (Client Initiated Backchannel Authentication)
								</InfoTitle>
								<InfoText>
									<strong><LearningTooltip variant="info" title="RFC 9436" content="OpenID Connect specification for Client Initiated Backchannel Authentication" placement="top">CIBA (RFC 9436)</LearningTooltip></strong> is an <LearningTooltip variant="info" title="OIDC Extension" content="OpenID Connect extension that adds new capabilities beyond the base OIDC specification" placement="top">OIDC extension</LearningTooltip> that enables <strong><LearningTooltip variant="learning" title="Decoupled Authentication" content="Authentication where the client and user interact on different devices. The client starts authentication, and the user approves on their trusted device." placement="top">decoupled authentication</LearningTooltip></strong>. 
									Unlike traditional OAuth flows where the user interacts directly with the authorization server, CIBA allows 
									the client to initiate authentication on one device while the user approves it on a completely different device.
								</InfoText>
								<InfoText style={{ marginTop: '0.75rem' }}>
									<strong>Why Use CIBA?</strong>
								</InfoText>
								<InfoText style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
									• <strong>IoT Devices:</strong> Smart TVs, printers, smart speakers that can't display a full browser<br/>
									• <strong>Kiosks & Terminals:</strong> Public-facing devices without keyboards or secure input methods<br/>
									• <strong>Better UX:</strong> User approves on their trusted device (phone) with full security controls<br/>
									• <strong>Security:</strong> No redirect URIs needed, reduces phishing risks, enables device binding
								</InfoText>
								<InfoText style={{ marginTop: '0.75rem' }}>
									<strong>How CIBA Works:</strong>
								</InfoText>
								<InfoText style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
									1. <strong>Client sends <LearningTooltip variant="learning" title="Backchannel Request" content="A server-to-server request from the client to the authorization server. Unlike front-channel flows, this happens without user interaction in the browser." placement="top">backchannel request</LearningTooltip></strong> with <LearningTooltip variant="info" title="Login Hint" content="Parameter (login_hint) that identifies the user (email, phone, or user ID). Required to tell the authorization server which user should receive the notification." placement="top"><code>login_hint</code></LearningTooltip> to identify the user<br/>
									2. <strong><LearningTooltip variant="info" title="Authorization Server" content="The OAuth/OIDC server (like PingOne) that handles authentication and authorization" placement="top">Authorization server</LearningTooltip></strong> validates the request and sends a notification to the user's device<br/>
									3. <strong>User approves/denies</strong> on their trusted device (phone, tablet)<br/>
									4. <strong>Client <LearningTooltip variant="learning" title="Polling" content="The client repeatedly requests tokens from the token endpoint using auth_req_id until the user completes authentication. Uses grant_type=urn:openid:params:grant-type:ciba." placement="top">polls</LearningTooltip></strong> the <LearningTooltip variant="info" title="Token Endpoint" content="OAuth/OIDC endpoint where clients exchange credentials for tokens" placement="top">token endpoint</LearningTooltip> with <LearningTooltip variant="learning" title="Auth Request ID" content="Unique identifier (auth_req_id) returned from the backchannel authentication request. Used in polling to check if user has approved." placement="top"><code>auth_req_id</code></LearningTooltip> until user completes authentication<br/>
									5. <strong><LearningTooltip variant="info" title="Tokens" content="Access tokens and ID tokens returned after successful authentication" placement="top">Tokens are returned</LearningTooltip></strong> to the client once user approves
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
									<Label>
										<LearningTooltip variant="learning" title="Login Hint (login_hint)" content="Required parameter (RFC 9436) that identifies which user should receive the authentication notification. Can be an email address, phone number, or user ID." placement="top">Login Hint</LearningTooltip> *
									</Label>
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
									<div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
										<div style={{ fontSize: '0.75rem', color: '#475569' }}>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>What is Login Hint?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												The <code>login_hint</code> parameter identifies which user should receive the authentication notification. 
												This tells the authorization server who to send the approval request to.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Why it's Required:</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												Without a login hint, the authorization server wouldn't know which user's device to send the notification to. 
												The user must already be registered in PingOne with this identifier.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Copyable Examples:</strong>
											</p>
											<p style={{ margin: 0 }}>
												• Email: <code style={{ background: '#e2e8f0', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); updateFormData('loginHint', 'user@example.com'); }}>user@example.com</code>
												<br/>• Phone: <code style={{ background: '#e2e8f0', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); updateFormData('loginHint', '+1234567890'); }}>+1234567890</code>
												<br/>• User ID: <code style={{ background: '#e2e8f0', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); updateFormData('loginHint', 'user_id_12345'); }}>user_id_12345</code>
											</p>
										</div>
									</div>
								</FormField>
								
								<FormField>
									<Label>
										<LearningTooltip variant="info" title="Binding Message (binding_message)" content="Optional parameter (RFC 9436) - Short text displayed to the user during approval to help verify they're approving the correct request." placement="top">Binding Message</LearningTooltip>
									</Label>
									<Input
										type="text"
										value={formData.bindingMessage}
										onChange={(e) => updateFormData('bindingMessage', e.target.value)}
										placeholder="Sign in request from your Smart TV"
									/>
									<div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
										<div style={{ fontSize: '0.75rem', color: '#475569' }}>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>What is Binding Message?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												The <code>binding_message</code> is a short text displayed to the user during the approval process. 
												It helps the user verify they're approving the correct request.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Why Use It?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												In enterprise environments or when multiple devices are present, the binding message helps prevent 
												users from accidentally approving the wrong device's authentication request.
											</p>
											<p style={{ margin: 0 }}>
												<strong style={{ color: '#1e293b' }}>Copyable Example:</strong>
												<br/><code style={{ background: '#e2e8f0', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); updateFormData('bindingMessage', 'Sign in request from your Smart TV'); }}>Sign in request from your Smart TV</code>
											</p>
										</div>
									</div>
								</FormField>
								
								<FormField>
									<Label>
										<LearningTooltip variant="info" title="Request Context (requested_context)" content="Optional parameter (RFC 9436) - JSON object with additional context (device info, location, IP) to help users identify the authentication request." placement="top">Request Context</LearningTooltip>
									</Label>
									<TextArea
										value={formData.requestContext}
										onChange={(e) => updateFormData('requestContext', e.target.value)}
										placeholder='{"device": "Smart TV", "location": "Living Room", "ip": "192.168.1.100"}'
										rows={6}
									/>
									<div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
										<div style={{ fontSize: '0.75rem', color: '#475569' }}>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>What is Request Context?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												The <code>requested_context</code> is a JSON object containing additional context about the authentication request. 
												This helps the user identify the source device and verify the request is legitimate.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Why Use It?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												Provides device identification (name, model), location, IP address, or other metadata that helps users 
												make informed approval decisions. This is especially important for security-conscious organizations.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Copyable Example (Click to Fill):</strong>
											</p>
											<div style={{ 
												background: '#ffffff', 
												padding: '0.75rem', 
												borderRadius: '0.5rem', 
												border: '1px solid #cbd5e1',
												cursor: 'pointer',
												marginTop: '0.5rem',
												transition: 'all 0.2s ease'
											}} 
											onClick={(e) => { 
												e.stopPropagation(); 
												updateFormData('requestContext', JSON.stringify({ 
													device: 'Smart TV', 
													location: 'Living Room', 
													ip: '192.168.1.100' 
												}, null, 2)); 
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#f1f5f9';
												e.currentTarget.style.borderColor = '#94a3b8';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#ffffff';
												e.currentTarget.style.borderColor = '#cbd5e1';
											}}
											>
												<pre style={{ 
													margin: 0, 
													fontFamily: 'monospace', 
													fontSize: '0.875rem', 
													color: '#1e293b',
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-word'
												}}>
{JSON.stringify({ 
	device: 'Smart TV', 
	location: 'Living Room', 
	ip: '192.168.1.100' 
}, null, 2)}
												</pre>
											</div>
										</div>
									</div>
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
										<p>Auth Request ID: {controller.authRequest.auth_req_id.substring(0, 20)}...</p>
									</div>
								</StatusCard>
								
								{/* Educational: Show what the actual API request would look like */}
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
										<LearningTooltip variant="learning" title="Backchannel Authentication Request" content="The actual HTTP POST request sent to the /backchannel-authentication endpoint (RFC 9436). This shows what parameters are required." placement="top">Backchannel Authentication Request (RFC 9436)</LearningTooltip>:
									</h4>
									<CodeBlock style={{ fontSize: '0.75rem' }}>
{`POST /backchannel-authentication HTTP/1.1
Host: ${(() => {
	const regionDomains: Record<string, string> = { us: 'auth.pingone.com', eu: 'auth.pingone.eu', ap: 'auth.pingone.asia', ca: 'auth.pingone.ca', na: 'auth.pingone.com' };
	return regionDomains[formData.region || 'us'] || 'auth.pingone.com';
})()}/${formData.environmentId}/as
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${btoa(`${formData.clientId}:${formData.clientSecret}`)}

client_id=${formData.clientId}
&scope=${formData.scope}
&login_hint=${formData.loginHint}${formData.bindingMessage ? `
&binding_message=${encodeURIComponent(formData.bindingMessage)}` : ''}${formData.requestContext ? `
&requested_context=${encodeURIComponent(formData.requestContext)}` : ''}`}
									</CodeBlock>
								</div>
								
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
										Response (with <LearningTooltip variant="learning" title="Auth Request ID" content="Unique identifier returned from the backchannel request. Used in polling to check if user has approved." placement="top">auth_req_id</LearningTooltip>):
									</h4>
									<CodeBlock style={{ fontSize: '0.75rem' }}>
{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "auth_req_id": "${controller.authRequest.stateId}",
  "expires_in": ${controller.authRequest.expiresIn},
  "interval": ${controller.authRequest.interval},
  "binding_message": "${controller.authRequest.bindingMessage}"
}`}
									</CodeBlock>
								</div>
								
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
										Response Details (RFC 9436):
									</h4>
									<CodeBlock>
										{JSON.stringify({
											auth_req_id: controller.authRequest.auth_req_id,
											expires_in: controller.authRequest.expiresIn,
											interval: controller.authRequest.interval,
											...(controller.authRequest.bindingMessage && { binding_message: controller.authRequest.bindingMessage }),
										}, null, 2)}
									</CodeBlock>
								</div>
								
								<InfoBox $variant="info" style={{ marginTop: '1.5rem' }}>
									<FiInfo />
									<div>
										<InfoTitle>📚 RFC 9436 Reference</InfoTitle>
										<InfoText>
											<strong>Learn More:</strong> Read the <a href="https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>official CIBA specification (RFC 9436)</a> for complete details on backchannel authentication requests and polling mechanisms.
										</InfoText>
									</div>
								</InfoBox>
								
								<div style={{ marginTop: '1.5rem' }}>
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
										<LearningTooltip variant="learning" title="Auth Request ID (auth_req_id)" content="RFC 9436: Unique identifier returned from the backchannel request. Used in polling to check if user has approved. Required for token endpoint requests." placement="top">Auth Request ID (auth_req_id)</LearningTooltip>:
									</h4>
									<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
										<CodeBlock style={{ margin: 0, flex: 1 }}>
											{controller.authRequest.auth_req_id}
										</CodeBlock>
										<Button onClick={() => handleCopy(controller.authRequest!.auth_req_id, 'Auth Request ID')}>
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
									<h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
										<LearningTooltip variant="learning" title="Token Polling Request" content="The client polls the token endpoint using grant_type=urn:openid:params:grant-type:ciba with the auth_req_id from the backchannel request. Continues until user approves." placement="top">Token Polling Request (RFC 9436)</LearningTooltip>:
									</h4>
									<CodeBlock style={{ fontSize: '0.75rem' }}>
{`POST /token HTTP/1.1
Host: ${(() => {
	const regionDomains: Record<string, string> = { us: 'auth.pingone.com', eu: 'auth.pingone.eu', ap: 'auth.pingone.asia', ca: 'auth.pingone.ca', na: 'auth.pingone.com' };
	return regionDomains[formData.region || 'us'] || 'auth.pingone.com';
})()}/${formData.environmentId}/as
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${btoa(`${formData.clientId}:${formData.clientSecret}`)}

grant_type=urn:openid:params:grant-type:ciba
&client_id=${formData.clientId}
&auth_req_id=${controller.authRequest.auth_req_id}`}
									</CodeBlock>
								</div>
								
								<div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
									<InfoText style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
										<strong style={{ color: '#1e293b' }}>Polling Behavior (RFC 9436):</strong>
										<br/>• If user hasn't approved: Returns <code>400</code> with <code>error=authorization_pending</code> → continue polling
										<br/>• If polling too fast: Returns <code>400</code> with <code>error=slow_down</code> → increase interval
										<br/>• If expired: Returns <code>400</code> with <code>error=expired_token</code> → stop polling
										<br/>• If denied: Returns <code>400</code> with <code>error=access_denied</code> → stop polling
										<br/>• If approved: Returns <code>200</code> with tokens → success!
									</InfoText>
								</div>
								
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
