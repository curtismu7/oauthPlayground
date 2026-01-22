// src/pages/flows/CIBAFlowV7.tsx
// V7.0.0 OIDC Client Initiated Backchannel Authentication (CIBA) Flow - Enhanced Service Architecture

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiInfo,
	FiShield,
	FiSmartphone,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { LearningTooltip } from '../../components/LearningTooltip';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useCibaFlowV7 } from '../../hooks/useCibaFlowV7';
import { usePageScroll } from '../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { UnifiedTokenDisplay } from '../../services/unifiedTokenDisplayService';
import { ClientAuthMethod } from '../../utils/clientAuthentication';
import { v4ToastManager } from '../../utils/v4ToastMessages';

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
	
	${(props) => {
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
	width: ${(props) => props.$progress}%;
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

// Select component removed - not used

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
	}, []);

	// Local state for form inputs
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scope: 'openid profile',
		loginHint: '',
		bindingMessage: '',
		requestContext: JSON.stringify(
			{ device: 'Smart TV', location: 'living Room', ip: '192.168.1.1' },
			null,
			2
		),
	});

	// Track clientAuthMethod from ComprehensiveCredentialsService (syncs with Token Endpoint Auth Method)
	const [clientAuthMethod, setClientAuthMethod] = useState<ClientAuthMethod>('client_secret_post');

	// Update form data
	const updateFormData = useCallback((field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	// Load credentials using V7 comprehensive service with complete isolation
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('🔄 [CIBA-V7] Loading credentials with comprehensive service...');

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: 'ciba-flow-v7',
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log('✅ [CIBA-V7] Found flow-specific credentials');

				// Load clientAuthMethod from saved credentials if available
				if (
					flowData.flowCredentials &&
					(flowData.flowCredentials.tokenEndpointAuthMethod ||
						(flowData.flowCredentials as unknown as Record<string, unknown>).clientAuthMethod)
				) {
					const savedAuthMethod = (flowData.flowCredentials.tokenEndpointAuthMethod ||
						(flowData.flowCredentials as unknown as Record<string, unknown>)
							.clientAuthMethod) as ClientAuthMethod;
					if (
						[
							'client_secret_basic',
							'client_secret_post',
							'client_secret_jwt',
							'private_key_jwt',
						].includes(savedAuthMethod)
					) {
						setClientAuthMethod(savedAuthMethod);
						console.log('✅ [CIBA-V7] Loaded clientAuthMethod:', savedAuthMethod);
					}
				}

				setFormData((prev) => ({
					...prev,
					environmentId: flowData.sharedEnvironment?.environmentId || prev.environmentId || '',
					clientId: flowData.flowCredentials?.clientId || prev.clientId || '',
					clientSecret: flowData.flowCredentials?.clientSecret || prev.clientSecret || '',
					scope: flowData.flowCredentials?.scopes?.join(' ') || prev.scope || 'openid profile',
					// Load CIBA-specific fields from flowConfig if available
					loginHint:
						((flowData.flowConfig as unknown as Record<string, unknown>)?.loginHint as string) ||
						prev.loginHint ||
						'',
					bindingMessage:
						((flowData.flowConfig as unknown as Record<string, unknown>)
							?.bindingMessage as string) ||
						prev.bindingMessage ||
						'',
					requestContext:
						((flowData.flowConfig as unknown as Record<string, unknown>)
							?.requestContext as string) ||
						prev.requestContext ||
						JSON.stringify(
							{ device: 'Smart TV', location: 'living Room', ip: '192.168.1.1' },
							null,
							2
						),
				}));
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [CIBA-V7] Using shared environment data only');
				setFormData((prev) => ({
					...prev,
					environmentId: flowData.sharedEnvironment?.environmentId || prev.environmentId,
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
				const configUpdate: Partial<{
					environmentId: string;
					clientId: string;
					clientSecret: string;
					scope: string;
					loginHint: string;
					bindingMessage: string;
					authMethod: 'client_secret_post' | 'client_secret_basic';
					requestContext: string;
				}> = {
					environmentId: formData.environmentId,
					clientId: formData.clientId,
					scope: formData.scope,
					loginHint: formData.loginHint,
					authMethod: clientAuthMethod as 'client_secret_post' | 'client_secret_basic',
				};
				if (formData.clientSecret) {
					configUpdate.clientSecret = formData.clientSecret;
				}
				if (formData.bindingMessage) {
					configUpdate.bindingMessage = formData.bindingMessage;
				}
				if (formData.requestContext) {
					configUpdate.requestContext = formData.requestContext;
				}
				controller.updateConfig(configUpdate);
			}, 150); // Small debounce to prevent rapid updates
		}

		return () => {
			if (updateConfigTimeoutRef.current) {
				clearTimeout(updateConfigTimeoutRef.current);
			}
		};
		// Only depend on the actual values, not the objects themselves
	}, [
		formData.environmentId,
		formData.clientId,
		formData.clientSecret,
		formData.scope,
		formData.loginHint,
		formData.bindingMessage,
		formData.requestContext,
		clientAuthMethod,
		controller.updateConfig,
	]);

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
						clientId: `${formData.clientId?.substring(0, 8)}...`,
						hasClientSecret: !!formData.clientSecret,
						scope: formData.scope,
						hasLoginHint: !!formData.loginHint,
					});

					// Save to comprehensive service with complete isolation (same pattern as other V7 flows)
					try {
						const success = comprehensiveFlowDataService.saveFlowDataComprehensive(
							'ciba-flow-v7',
							{
								...(formData.environmentId && {
									sharedEnvironment: {
										environmentId: formData.environmentId,
										region: 'us',
										issuerUrl: (() => {
											const regionDomains: Record<string, string> = {
												us: 'auth.pingone.com',
												eu: 'auth.pingone.eu',
												ap: 'auth.pingone.asia',
												ca: 'auth.pingone.ca',
												na: 'auth.pingone.com',
											};
											const domain = regionDomains['us'] || 'auth.pingone.com';
											return `https://${domain}/${formData.environmentId}`;
										})(),
									},
								}),
								flowCredentials: {
									clientId: formData.clientId,
									clientSecret: formData.clientSecret,
									scopes: formData.scope ? formData.scope.split(/\s+/).filter(Boolean) : [],
									tokenEndpointAuthMethod: clientAuthMethod,
									lastUpdated: Date.now(),
								},
								// Save CIBA-specific fields in flowConfig (extend FlowSpecificConfig)
								flowConfig: {
									...(formData.loginHint && { loginHint: formData.loginHint }),
									...(formData.bindingMessage && { bindingMessage: formData.bindingMessage }),
									...(formData.requestContext && { requestContext: formData.requestContext }),
								} as Record<string, unknown>,
							},
							{ showToast: false }
						);

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
	}, [
		formData.environmentId,
		formData.clientId,
		formData.clientSecret,
		formData.scope,
		formData.loginHint,
		formData.bindingMessage,
		formData.requestContext,
		clientAuthMethod,
	]);

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

	// Track when user navigates to step 1 (to prevent auto-start on initial mount)
	const [hasNavigatedToStep1, setHasNavigatedToStep1] = useState(false);
	const prevStepRef = useRef(0);

	// Track step changes
	useEffect(() => {
		if (currentStep === 1 && prevStepRef.current === 0) {
			// User navigated from step 0 to step 1
			setHasNavigatedToStep1(true);
		} else if (currentStep === 0) {
			// Reset when going back to step 0
			setHasNavigatedToStep1(false);
		}
		prevStepRef.current = currentStep;
	}, [currentStep]);

	// Auto-start flow when navigating to step 1 (only after user explicitly navigates there)
	useEffect(() => {
		if (
			currentStep === 1 &&
			hasNavigatedToStep1 &&
			!controller.authRequest &&
			!controller.isInProgress &&
			controller.canStart
		) {
			// Small delay to ensure step is fully rendered
			const timer = setTimeout(() => {
				controller.startFlow();
			}, 100);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [
		currentStep,
		hasNavigatedToStep1,
		controller.authRequest,
		controller.isInProgress,
		controller.canStart,
		controller,
	]);

	// Handle form submission - navigate to step 1 (flow will auto-start)
	const _handleStartFlow = useCallback(() => {
		// Navigate to step 1 - the useEffect will auto-start the flow
		setCurrentStep(1);
	}, []);

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
			requestContext: JSON.stringify(
				{ device: 'Smart TV', location: 'living Room', ip: '192.168.1.1' },
				null,
				2
			),
		});
		setClientAuthMethod('client_secret_post'); // Reset to default
	}, [controller]);

	// Copy to clipboard
	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	}, []);

	// Step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					// For step 0, we need: credentials (env ID, client ID, scope) from ComprehensiveCredentialsService AND loginHint
					// The credentials come from ComprehensiveCredentialsService, so we check formData (populated by onCredentialsChange)
					return !!(
						formData.environmentId &&
						formData.clientId &&
						formData.scope &&
						formData.loginHint
					);
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
		},
		[formData, controller]
	);

	// Get step validation message for disabled button
	const getStepValidationMessage = useCallback(
		(step: number): string => {
			if (isStepValid(step)) return '';

			switch (step) {
				case 0: {
					const missing: string[] = [];
					if (!formData.environmentId) missing.push('Environment ID');
					if (!formData.clientId) missing.push('Client ID');
					if (!formData.scope) missing.push('Scope');
					if (!formData.loginHint) missing.push('Login Hint');
					return missing.length > 0 ? `Missing: ${missing.join(', ')}` : '';
				}
				case 1:
					return '';
				case 2:
					return !controller.authRequest ? 'Authentication request not created yet' : '';
				case 3:
					return !controller.tokens ? 'Tokens not received yet' : '';
				default:
					return '';
			}
		},
		[formData, controller, isStepValid]
	);

	// STEP_METADATA (following Implicit flow pattern)
	const STEP_METADATA = [
		{
			title: 'Step 0: Configure CIBA Parameters',
			subtitle: 'Set up environment and authentication parameters',
		},
		{
			title: 'Step 1: Initiate Authentication Request',
			subtitle: 'Start the CIBA backchannel authentication',
		},
		{ title: 'Step 2: User Approval Process', subtitle: 'Monitor user approval on their device' },
		{
			title: 'Step 3: Token Exchange & Results',
			subtitle: 'View authentication results and tokens',
		},
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
									What is{' '}
									<LearningTooltip
										variant="learning"
										title="CIBA (Client Initiated Backchannel Authentication)"
										content="An OIDC extension (RFC 9436) that enables decoupled authentication. The client initiates authentication on one device, and the user approves it on a different trusted device (e.g., phone)."
										placement="top"
									>
										CIBA
									</LearningTooltip>
									? (Client Initiated Backchannel Authentication)
								</InfoTitle>
								<InfoText>
									<strong>
										<LearningTooltip
											variant="info"
											title="RFC 9436"
											content="OpenID Connect specification for Client Initiated Backchannel Authentication"
											placement="top"
										>
											CIBA (RFC 9436)
										</LearningTooltip>
									</strong>{' '}
									is an{' '}
									<LearningTooltip
										variant="info"
										title="OIDC Extension"
										content="OpenID Connect extension that adds new capabilities beyond the base OIDC specification"
										placement="top"
									>
										OIDC extension
									</LearningTooltip>{' '}
									that enables{' '}
									<strong>
										<LearningTooltip
											variant="learning"
											title="Decoupled Authentication"
											content="Authentication where the client and user interact on different devices. The client starts authentication, and the user approves on their trusted device."
											placement="top"
										>
											decoupled authentication
										</LearningTooltip>
									</strong>
									. Unlike traditional OAuth flows where the user interacts directly with the
									authorization server, CIBA allows the client to initiate authentication on one
									device while the user approves it on a completely different device.
								</InfoText>

								<InfoText
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f0f9ff',
										borderRadius: '0.5rem',
										border: '1px solid #0ea5e9',
									}}
								>
									<strong style={{ color: '#0c4a6e' }}>
										🔑 Key Insight: CIBA Reverses the Flow Direction
									</strong>
									<br />
									<span style={{ color: '#075985', fontSize: '0.95rem' }}>
										In CIBA, the <strong>authorization server contacts the user's device</strong>{' '}
										(via push notification), rather than the user navigating to the authorization
										server. This is the opposite of traditional OAuth flows.
									</span>
								</InfoText>

								<InfoText style={{ marginTop: '1rem' }}>
									<strong>📱 CIBA Session Model — Where Sessions Exist:</strong>
								</InfoText>
								<InfoText
									style={{
										marginTop: '0.5rem',
										paddingLeft: '1rem',
										padding: '0.75rem',
										background: '#f8fafc',
										borderRadius: '0.5rem',
										border: '1px solid #e2e8f0',
									}}
								>
									• <strong>Initiating Device (Client):</strong> Kiosk, TV, or backend app — holds{' '}
									<code>auth_req_id</code> only (no user session)
									<br />• <strong>PingOne Authorization Server:</strong> Maintains CIBA transaction
									metadata and user binding
									<br />• <strong>User's Authentication Device (Mobile):</strong>{' '}
									<strong style={{ color: '#dc2626' }}>Holds active PingOne user session</strong>{' '}
									(via PingOne SDK or PingID app)
									<br />
									<br />
									<span style={{ fontStyle: 'italic', color: '#475569' }}>
										<strong>Important:</strong> The user session exists on the mobile device, not on
										the initiating client device.
									</span>
								</InfoText>

								<InfoText style={{ marginTop: '0.75rem' }}>
									<strong>Why Use CIBA?</strong>
								</InfoText>
								<InfoText style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
									• <strong>Known User Identity:</strong> You know the user's email, phone, or user
									ID (via <code>login_hint</code>)<br />• <strong>IoT Devices:</strong> Smart TVs,
									printers, smart speakers that can't display a full browser
									<br />• <strong>Kiosks & Terminals:</strong> Public-facing devices without
									keyboards or secure input methods
									<br />• <strong>Better UX:</strong> User approves on their trusted device (phone)
									with full security controls
									<br />• <strong>Security:</strong> No redirect URIs needed, reduces phishing
									risks, enables device binding
									<br />• <strong>Push Notifications:</strong> Seamless user experience with
									automatic device notification
								</InfoText>

								<InfoText style={{ marginTop: '0.75rem' }}>
									<strong>How CIBA Works (Step-by-Step):</strong>
								</InfoText>
								<InfoText style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
									<strong>1. Client → PingOne /bc-authorize:</strong>{' '}
									<strong>Our client (browser/backend) sends a POST request</strong> to PingOne's{' '}
									<code>/bc-authorize</code> endpoint with{' '}
									<LearningTooltip
										variant="info"
										title="Login Hint"
										content="Parameter (login_hint) that identifies the user (email, phone, or user ID). Required to tell the authorization server which user should receive the notification."
										placement="top"
									>
										<code>login_hint</code>
									</LearningTooltip>{' '}
									to identify the user. PingOne returns <code>auth_req_id</code>.<br />
									<strong>2. PingOne → User's Registered Mobile Device:</strong>{' '}
									<strong>PingOne then sends a push notification</strong> to the user's registered
									device (PingOne SDK app or PingID app). The user must have a registered device
									with push notifications enabled.
									<br />
									<strong>3. User Approval on Mobile:</strong> User receives notification and
									approves via the PingOne SDK or PingID app on their mobile device (biometric or
									PIN). <strong>User session exists on this mobile device.</strong>
									<br />
									<strong>4. Client Polling:</strong> <strong>Our client polls</strong> PingOne's{' '}
									<LearningTooltip
										variant="info"
										title="Token Endpoint"
										content="OAuth/OIDC endpoint where clients exchange credentials for tokens"
										placement="top"
									>
										token endpoint
									</LearningTooltip>{' '}
									using <code>grant_type=urn:openid:params:grant-type:ciba</code> and{' '}
									<LearningTooltip
										variant="learning"
										title="Auth Request ID"
										content="Unique identifier (auth_req_id) returned from the backchannel authentication request. Used in polling to check if user has approved."
										placement="top"
									>
										<code>auth_req_id</code>
									</LearningTooltip>{' '}
									until user completes authentication.
									<br />
									<strong>5. Tokens Issued:</strong>{' '}
									<LearningTooltip
										variant="info"
										title="Tokens"
										content="Access tokens and ID tokens returned after successful authentication"
										placement="top"
									>
										Tokens are returned
									</LearningTooltip>{' '}
									to our client once user approves on their mobile device.
								</InfoText>

								<InfoText
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#fef3c7',
										borderRadius: '0.5rem',
										border: '2px solid #f59e0b',
									}}
								>
									<strong style={{ color: '#92400e', fontSize: '1.1rem' }}>
										⚠️ CRITICAL: PingOne Requirements for CIBA
									</strong>
									<br />
									<br />
									<strong style={{ color: '#78350f' }}>
										For CIBA to work, you MUST have the following configured in PingOne:
									</strong>
									<br />
									<br />
									<span style={{ color: '#78350f', fontSize: '0.95rem' }}>
										<strong>1. Application Configuration:</strong>
										<br />• CIBA grant type must be <strong>enabled</strong> for your application
										<br />• Application must have <strong>client authentication</strong> configured
										(client_secret)
										<br />• Application must have proper <strong>scopes</strong> configured
										(including <code>openid</code> for OIDC)
										<br />
										<br />
										<strong>2. User Device Requirements:</strong>
										<br />• User identified by <code>login_hint</code> must have a{' '}
										<strong>registered device</strong> in PingOne
										<br />• Device must have <strong>PingOne SDK</strong> or{' '}
										<strong>PingID app</strong> installed
										<br />• Device must have <strong>push notifications enabled</strong>
										<br />• User must have an <strong>active PingOne session</strong> on their
										mobile device
										<br />
										<br />
										<strong>3. Common 403 Errors:</strong>
										<br />• User doesn't have a registered device → Register device in PingOne
										<br />• <code>login_hint</code> doesn't match a user → Use correct
										email/phone/user ID
										<br />• CIBA grant type not enabled → Enable in PingOne application settings
										<br />• Client authentication failed → Check client_id and client_secret
										<br />
									</span>
								</InfoText>

								<InfoText
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#fef3c7',
										borderRadius: '0.5rem',
										border: '1px solid #f59e0b',
									}}
								>
									<strong style={{ color: '#92400e' }}>
										⚠️ Key Difference from Device Authorization:
									</strong>
									<br />
									<span style={{ color: '#78350f', fontSize: '0.95rem' }}>
										• <strong>CIBA:</strong> No user code — automatic device binding via push
										notification. User session exists on mobile device.{' '}
										<strong>Requires registered device in PingOne.</strong>
										<br />• <strong>Device Authorization:</strong> Requires user code — user
										manually enters code. Session exists on web browser device. Works with any user.
										<br />• <strong>CIBA:</strong> Requires known user identity (
										<code>login_hint</code>) and registered device. Device Authorization works with
										unknown users and no device registration needed.
									</span>
								</InfoText>

								<InfoText
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#fee2e2',
										borderRadius: '0.5rem',
										border: '2px solid #ef4444',
									}}
								>
									<strong style={{ color: '#991b1b', fontSize: '1.1rem' }}>
										🔴 Important: CIBA Flow Direction
									</strong>
									<br />
									<br />
									<span style={{ color: '#7f1d1d', fontSize: '0.95rem' }}>
										<strong>CIBA Flow:</strong>
										<br />
										<strong>1.</strong>{' '}
										<span style={{ color: '#dc2626' }}>Our Client → PingOne</span> (POST to{' '}
										<code>/bc-authorize</code>)<br />
										<strong>2.</strong>{' '}
										<span style={{ color: '#dc2626' }}>PingOne → User's Registered Device</span>{' '}
										(Push notification)
										<br />
										<strong>3.</strong> User approves on mobile device
										<br />
										<strong>4.</strong>{' '}
										<span style={{ color: '#dc2626' }}>Our Client → PingOne</span> (Poll{' '}
										<code>/token</code> with <code>auth_req_id</code>)<br />
										<strong>5.</strong>{' '}
										<span style={{ color: '#dc2626' }}>PingOne → Our Client</span> (Returns tokens)
										<br />
										<br />
										<strong>Note:</strong> PingOne does NOT call our device. We call PingOne, and
										PingOne calls the user's registered mobile device.
									</span>
								</InfoText>
							</div>
						</InfoBox>

						{/* CIBA vs Device Authorization Comparison */}
						<InfoBox
							$variant="info"
							style={{
								marginTop: '1.5rem',
								marginBottom: '1.5rem',
								background: '#f8fafc',
								borderColor: '#cbd5e1',
							}}
						>
							<FiInfo />
							<div>
								<InfoTitle style={{ marginBottom: '1rem' }}>
									CIBA vs Device Authorization — Key Differences
								</InfoTitle>
								<div style={{ overflowX: 'auto' }}>
									<table
										style={{
											width: '100%',
											borderCollapse: 'collapse',
											fontSize: '0.875rem',
											background: 'white',
											borderRadius: '0.5rem',
											overflow: 'hidden',
										}}
									>
										<thead>
											<tr style={{ background: '#f1f5f9' }}>
												<th
													style={{
														padding: '0.75rem',
														textAlign: 'left',
														borderBottom: '2px solid #cbd5e1',
														fontWeight: '600',
														color: '#1e293b',
													}}
												>
													Aspect
												</th>
												<th
													style={{
														padding: '0.75rem',
														textAlign: 'left',
														borderBottom: '2px solid #cbd5e1',
														fontWeight: '600',
														color: '#1e293b',
													}}
												>
													Device Authorization (RFC 8628)
												</th>
												<th
													style={{
														padding: '0.75rem',
														textAlign: 'left',
														borderBottom: '2px solid #cbd5e1',
														fontWeight: '600',
														color: '#1e293b',
													}}
												>
													CIBA (RFC 9436)
												</th>
											</tr>
										</thead>
										<tbody>
											<tr style={{ borderBottom: '1px solid #e2e8f0' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													Who initiates
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Limited UI device (e.g., TV)
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Backend or web client
												</td>
											</tr>
											<tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													How user authorizes
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													User manually enters code on another device
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Authorization Server contacts known user device
												</td>
											</tr>
											<tr style={{ borderBottom: '1px solid #e2e8f0' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													User linking
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													User types verification code
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Automatic device binding
												</td>
											</tr>
											<tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													Polling
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Device polls <code>/token</code>
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Client polls <code>/token</code>
												</td>
											</tr>
											<tr style={{ borderBottom: '1px solid #e2e8f0' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													Session exists where
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													On the web browser device
												</td>
												<td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: '600' }}>
													On user's mobile (PingOne SDK/App)
												</td>
											</tr>
											<tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													User identity
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Unknown user (works for anyone)
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													Known user (requires <code>login_hint</code>)
												</td>
											</tr>
											<tr style={{ borderBottom: '1px solid #e2e8f0' }}>
												<td style={{ padding: '0.75rem', fontWeight: '600', color: '#475569' }}>
													User code
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													✅ Required (user enters code)
												</td>
												<td style={{ padding: '0.75rem', color: '#64748b' }}>
													❌ Not used (no user code)
												</td>
											</tr>
										</tbody>
									</table>
								</div>
								<InfoText
									style={{
										marginTop: '1rem',
										padding: '0.75rem',
										background: '#eff6ff',
										borderRadius: '0.5rem',
										border: '1px solid #bfdbfe',
									}}
								>
									<strong style={{ color: '#1e40af' }}>💡 Decision Guide:</strong> Use{' '}
									<strong>CIBA</strong> when you know the user's identity (email, phone, user ID).
									Use <strong>Device Authorization</strong> when the user is unknown (first-time
									setup, public kiosks).
								</InfoText>
							</div>
						</InfoBox>

						<FlowConfigurationRequirements flowType="ciba" />

						{/* Real-Life Use Case Presets */}
						<div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1e293b',
								}}
							>
								Real-Life Use Case Presets
							</h3>
							<p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
								Select a real-life scenario to pre-fill the CIBA parameters with realistic values.
								These scenarios demonstrate when CIBA is the best choice for authentication.
							</p>

							<FormGrid>
								{/* Banking Transaction Approval */}
								<div
									style={{
										padding: '1.5rem',
										border: '2px solid #e2e8f0',
										borderRadius: '0.75rem',
										background: '#ffffff',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
									onClick={() => {
										updateFormData('loginHint', 'customer@bank.com');
										updateFormData('bindingMessage', 'Approve $1,250.00');
										updateFormData(
											'requestContext',
											JSON.stringify(
												{
													transaction: {
														amount: '$1,250.00',
														merchant: 'Online Store Inc.',
														date: new Date().toISOString(),
														currency: 'USD',
													},
													device: {
														type: 'Banking App',
														location: 'San Francisco, CA',
													},
													security: {
														risk_level: 'low',
														ip_address: '192.168.1.50',
													},
												},
												null,
												2
											)
										);
										v4ToastManager.showSuccess('Banking transaction approval scenario loaded');
									}}
									onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
										e.currentTarget.style.borderColor = '#8b5cf6';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
									}}
									onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
										e.currentTarget.style.borderColor = '#e2e8f0';
										e.currentTarget.style.boxShadow = 'none';
									}}
								>
									<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
										<div
											style={{
												width: '48px',
												height: '48px',
												borderRadius: '0.5rem',
												background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											<FiShield style={{ color: 'white', fontSize: '24px' }} />
										</div>
										<div style={{ flex: 1 }}>
											<h4
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
													color: '#1e293b',
												}}
											>
												Banking Transaction Approval
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													fontSize: '0.875rem',
													color: '#64748b',
													lineHeight: '1.5',
												}}
											>
												<strong>Scenario:</strong> Customer needs to approve a $1,250.00 transaction
												from their banking app.
											</p>
											<div
												style={{
													padding: '0.75rem',
													background: '#f0fdf4',
													borderRadius: '0.5rem',
													border: '1px solid #bbf7d0',
												}}
											>
												<p style={{ margin: 0, fontSize: '0.75rem', color: '#166534' }}>
													<strong>Why CIBA:</strong> Known user, high security requirements, push
													notification UX, transaction context verification
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Payment Authorization */}
								<div
									style={{
										padding: '1.5rem',
										border: '2px solid #e2e8f0',
										borderRadius: '0.75rem',
										background: '#ffffff',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
									onClick={() => {
										updateFormData('loginHint', 'user@paymentprovider.com');
										updateFormData('bindingMessage', 'Approve payment');
										updateFormData(
											'requestContext',
											JSON.stringify(
												{
													payment: {
														amount: '$499.99',
														merchant: 'Premium Service Co.',
														description: 'Annual subscription renewal',
														transaction_id: `TXN-${Date.now()}`,
													},
													device: {
														type: 'Payment Gateway',
														browser: 'Chrome on Desktop',
													},
													user: {
														trusted_device: true,
														location: 'New York, NY',
													},
												},
												null,
												2
											)
										);
										v4ToastManager.showSuccess('Payment authorization scenario loaded');
									}}
									onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
										e.currentTarget.style.borderColor = '#8b5cf6';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
									}}
									onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
										e.currentTarget.style.borderColor = '#e2e8f0';
										e.currentTarget.style.boxShadow = 'none';
									}}
								>
									<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
										<div
											style={{
												width: '48px',
												height: '48px',
												borderRadius: '0.5rem',
												background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											<FiZap style={{ color: 'white', fontSize: '24px' }} />
										</div>
										<div style={{ flex: 1 }}>
											<h4
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
													color: '#1e293b',
												}}
											>
												Payment Authorization
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													fontSize: '0.875rem',
													color: '#64748b',
													lineHeight: '1.5',
												}}
											>
												<strong>Scenario:</strong> User needs to authorize a recurring payment
												subscription on their trusted device.
											</p>
											<div
												style={{
													padding: '0.75rem',
													background: '#eff6ff',
													borderRadius: '0.5rem',
													border: '1px solid #bfdbfe',
												}}
											>
												<p style={{ margin: 0, fontSize: '0.75rem', color: '#1e40af' }}>
													<strong>Why CIBA:</strong> Known user, transaction context, trusted
													device, seamless approval flow
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Account Recovery Approval */}
								<div
									style={{
										padding: '1.5rem',
										border: '2px solid #e2e8f0',
										borderRadius: '0.75rem',
										background: '#ffffff',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
									onClick={() => {
										updateFormData('loginHint', 'user@example.com');
										updateFormData('bindingMessage', 'Account recovery');
										updateFormData(
											'requestContext',
											JSON.stringify(
												{
													recovery: {
														reason: 'Password reset requested',
														initiated_from: 'Web browser',
														timestamp: new Date().toISOString(),
													},
													security: {
														verification_method: 'push_notification',
														risk_level: 'high',
														requires_approval: true,
													},
													device: {
														initiating_device: 'Unknown device (Chrome, Windows)',
														approval_device: 'Trusted iPhone 14 Pro',
													},
												},
												null,
												2
											)
										);
										v4ToastManager.showSuccess('Account recovery approval scenario loaded');
									}}
									onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
										e.currentTarget.style.borderColor = '#8b5cf6';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
									}}
									onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
										e.currentTarget.style.borderColor = '#e2e8f0';
										e.currentTarget.style.boxShadow = 'none';
									}}
								>
									<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
										<div
											style={{
												width: '48px',
												height: '48px',
												borderRadius: '0.5rem',
												background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											<FiSmartphone style={{ color: 'white', fontSize: '24px' }} />
										</div>
										<div style={{ flex: 1 }}>
											<h4
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
													color: '#1e293b',
												}}
											>
												Account Recovery Approval
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													fontSize: '0.875rem',
													color: '#64748b',
													lineHeight: '1.5',
												}}
											>
												<strong>Scenario:</strong> User requested password reset, needs to approve
												on their trusted device for security.
											</p>
											<div
												style={{
													padding: '0.75rem',
													background: '#fffbeb',
													borderRadius: '0.5rem',
													border: '1px solid #fde68a',
												}}
											>
												<p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
													<strong>Why CIBA:</strong> Known user, security-critical operation, push
													notification for approval, prevents unauthorized access
												</p>
											</div>
										</div>
									</div>
								</div>
							</FormGrid>
						</div>

						{formData.environmentId && formData.clientId ? (
							<StatusCard $status="completed" style={{ marginTop: '1.5rem' }}>
								<FiCheckCircle />
								<div>
									<strong>Credentials Ready</strong>
									<p>
										Basic credentials are configured above. Configure CIBA-specific parameters below
										or select a use case preset above.
									</p>
								</div>
							</StatusCard>
						) : (
							<StatusCard $status="pending" style={{ marginTop: '1.5rem' }}>
								<FiInfo />
								<div>
									<strong>Configure Credentials First</strong>
									<p>
										Please configure Environment ID, Client ID, and Scope in the credentials section
										above before proceeding.
									</p>
								</div>
							</StatusCard>
						)}

						<div style={{ marginTop: '2rem' }}>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1e293b',
								}}
							>
								CIBA-Specific Parameters
							</h3>
							<FormGrid>
								<FormField>
									<Label>
										<LearningTooltip
											variant="learning"
											title="Login Hint (login_hint)"
											content="Required parameter (RFC 9436) that identifies which user should receive the authentication notification. Can be an email address, phone number, or user ID."
											placement="top"
										>
											Login Hint
										</LearningTooltip>{' '}
										*
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
									<div
										style={{
											marginTop: '0.5rem',
											padding: '0.75rem',
											background: '#f8fafc',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#475569' }}>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>What is Login Hint?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												The <code>login_hint</code> parameter identifies which user should receive
												the authentication notification. This tells the authorization server who to
												send the approval request to.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Why it's Required:</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												Without a login hint, the authorization server wouldn't know which user's
												device to send the notification to. The user must already be registered in
												PingOne with this identifier.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Copyable Examples:</strong>
											</p>
											<p style={{ margin: 0 }}>
												• Email:{' '}
												<code
													style={{
														background: '#e2e8f0',
														padding: '0.125rem 0.25rem',
														borderRadius: '0.25rem',
														cursor: 'pointer',
													}}
													onClick={(e) => {
														e.stopPropagation();
														updateFormData('loginHint', 'user@example.com');
													}}
												>
													user@example.com
												</code>
												<br />• Phone:{' '}
												<code
													style={{
														background: '#e2e8f0',
														padding: '0.125rem 0.25rem',
														borderRadius: '0.25rem',
														cursor: 'pointer',
													}}
													onClick={(e) => {
														e.stopPropagation();
														updateFormData('loginHint', '+1234567890');
													}}
												>
													+1234567890
												</code>
												<br />• User ID:{' '}
												<code
													style={{
														background: '#e2e8f0',
														padding: '0.125rem 0.25rem',
														borderRadius: '0.25rem',
														cursor: 'pointer',
													}}
													onClick={(e) => {
														e.stopPropagation();
														updateFormData('loginHint', 'user_id_12345');
													}}
												>
													user_id_12345
												</code>
											</p>
										</div>
									</div>
								</FormField>

								<FormField>
									<Label>
										<LearningTooltip
											variant="info"
											title="Binding Message (binding_message)"
											content="Optional parameter (RFC 9436) - Short text displayed to the user during approval to help verify they're approving the correct request."
											placement="top"
										>
											Binding Message
										</LearningTooltip>
									</Label>
									<Input
										type="text"
										value={formData.bindingMessage}
										onChange={(e) => updateFormData('bindingMessage', e.target.value)}
										placeholder="Sign in request from your Smart TV"
									/>
									<div
										style={{
											marginTop: '0.5rem',
											padding: '0.75rem',
											background: '#f8fafc',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#475569' }}>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>What is Binding Message?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												The <code>binding_message</code> is a short text displayed to the user
												during the approval process. It helps the user verify they're approving the
												correct request.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Why Use It?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												In enterprise environments or when multiple devices are present, the binding
												message helps prevent users from accidentally approving the wrong device's
												authentication request.
											</p>
											<p style={{ margin: 0 }}>
												<strong style={{ color: '#1e293b' }}>Copyable Example:</strong>
												<br />
												<code
													style={{
														background: '#e2e8f0',
														padding: '0.125rem 0.25rem',
														borderRadius: '0.25rem',
														cursor: 'pointer',
													}}
													onClick={(e) => {
														e.stopPropagation();
														updateFormData('bindingMessage', 'Sign in request from your Smart TV');
													}}
												>
													Sign in request from your Smart TV
												</code>
											</p>
										</div>
									</div>
								</FormField>

								<FormField>
									<Label>
										<LearningTooltip
											variant="info"
											title="Request Context (requested_context)"
											content="Optional parameter (RFC 9436) - JSON object with additional context (device info, location, IP) to help users identify the authentication request."
											placement="top"
										>
											Request Context
										</LearningTooltip>
									</Label>
									<TextArea
										value={formData.requestContext}
										onChange={(e) => updateFormData('requestContext', e.target.value)}
										placeholder='{"device": "Smart TV", "location": "Living Room", "ip": "192.168.1.100"}'
										rows={6}
									/>
									<div
										style={{
											marginTop: '0.5rem',
											padding: '0.75rem',
											background: '#f8fafc',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
										}}
									>
										<div style={{ fontSize: '0.75rem', color: '#475569' }}>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>What is Request Context?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												The <code>requested_context</code> is a JSON object containing additional
												context about the authentication request. This helps the user identify the
												source device and verify the request is legitimate.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>Why Use It?</strong>
											</p>
											<p style={{ margin: '0 0 0.75rem 0' }}>
												Provides device identification (name, model), location, IP address, or other
												metadata that helps users make informed approval decisions. This is
												especially important for security-conscious organizations.
											</p>
											<p style={{ margin: '0 0 0.5rem 0' }}>
												<strong style={{ color: '#1e293b' }}>
													Copyable Example (Click to Fill):
												</strong>
											</p>
											<div
												style={{
													background: '#ffffff',
													padding: '0.75rem',
													borderRadius: '0.5rem',
													border: '1px solid #cbd5e1',
													cursor: 'pointer',
													marginTop: '0.5rem',
													transition: 'all 0.2s ease',
												}}
												onClick={(e) => {
													e.stopPropagation();
													updateFormData(
														'requestContext',
														JSON.stringify(
															{
																device: 'Smart TV',
																location: 'Living Room',
																ip: '192.168.1.100',
															},
															null,
															2
														)
													);
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
												<pre
													style={{
														margin: 0,
														fontFamily: 'monospace',
														fontSize: '0.875rem',
														color: '#1e293b',
														whiteSpace: 'pre-wrap',
														wordBreak: 'break-word',
													}}
												>
													{JSON.stringify(
														{
															device: 'Smart TV',
															location: 'Living Room',
															ip: '192.168.1.100',
														},
														null,
														2
													)}
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
									<h4
										style={{
											marginBottom: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										<LearningTooltip
											variant="learning"
											title="Backchannel Authentication Request"
											content="The actual HTTP POST request sent to the /backchannel-authentication endpoint (RFC 9436). This shows what parameters are required."
											placement="top"
										>
											Backchannel Authentication Request (RFC 9436)
										</LearningTooltip>
										:
									</h4>
									<CodeBlock style={{ fontSize: '0.75rem' }}>
										{`POST /backchannel-authentication HTTP/1.1
Host: ${(() => {
											const regionDomains: Record<string, string> = {
												us: 'auth.pingone.com',
												eu: 'auth.pingone.eu',
												ap: 'auth.pingone.asia',
												ca: 'auth.pingone.ca',
												na: 'auth.pingone.com',
											};
											return regionDomains['us'] || 'auth.pingone.com';
										})()}/${formData.environmentId}/as
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${btoa(`${formData.clientId}:${formData.clientSecret}`)}

client_id=${formData.clientId}
&scope=${formData.scope}
&login_hint=${formData.loginHint}${
											formData.bindingMessage
												? `
&binding_message=${encodeURIComponent(formData.bindingMessage)}`
												: ''
										}${
											formData.requestContext
												? `
&requested_context=${encodeURIComponent(formData.requestContext)}`
												: ''
										}`}
									</CodeBlock>
								</div>

								<div style={{ marginTop: '1.5rem' }}>
									<h4
										style={{
											marginBottom: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										Response (with{' '}
										<LearningTooltip
											variant="learning"
											title="Auth Request ID"
											content="Unique identifier returned from the backchannel request. Used in polling to check if user has approved."
											placement="top"
										>
											auth_req_id
										</LearningTooltip>
										):
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
									<h4
										style={{
											marginBottom: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										Response Details (RFC 9436):
									</h4>
									<CodeBlock>
										{JSON.stringify(
											{
												auth_req_id: controller.authRequest.auth_req_id,
												expires_in: controller.authRequest.expiresIn,
												interval: controller.authRequest.interval,
												...(controller.authRequest.bindingMessage && {
													binding_message: controller.authRequest.bindingMessage,
												}),
											},
											null,
											2
										)}
									</CodeBlock>
								</div>

								<InfoBox $variant="info" style={{ marginTop: '1.5rem' }}>
									<FiInfo />
									<div>
										<InfoTitle>📚 RFC 9436 Reference</InfoTitle>
										<InfoText>
											<strong>Learn More:</strong> Read the{' '}
											<a
												href="https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html"
												target="_blank"
												rel="noopener noreferrer"
												style={{ color: '#3b82f6' }}
											>
												official CIBA specification (RFC 9436)
											</a>{' '}
											for complete details on backchannel authentication requests and polling
											mechanisms.
										</InfoText>
									</div>
								</InfoBox>

								<div style={{ marginTop: '1.5rem' }}>
									<h4
										style={{
											marginBottom: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										<LearningTooltip
											variant="learning"
											title="Auth Request ID (auth_req_id)"
											content="RFC 9436: Unique identifier returned from the backchannel request. Used in polling to check if user has approved. Required for token endpoint requests."
											placement="top"
										>
											Auth Request ID (auth_req_id)
										</LearningTooltip>
										:
									</h4>
									<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
										<CodeBlock style={{ margin: 0, flex: 1 }}>
											{controller.authRequest.auth_req_id}
										</CodeBlock>
										<Button
											onClick={() =>
												handleCopy(controller.authRequest!.auth_req_id, 'Auth Request ID')
											}
										>
											<FiCopy />
											Copy
										</Button>
									</div>
								</div>
							</>
						) : controller.error ? (
							<>
								<StatusCard $status="failed">
									<FiAlertTriangle />
									<div>
										<strong>CIBA Request Failed</strong>
										<p>{controller.error}</p>
									</div>
								</StatusCard>

								<InfoBox
									$variant="info"
									style={{
										marginTop: '1.5rem',
										padding: '1rem',
										background: '#fee2e2',
										borderRadius: '0.5rem',
										border: '2px solid #ef4444',
									}}
								>
									<FiAlertTriangle style={{ color: '#dc2626' }} />
									<div>
										<InfoTitle style={{ color: '#991b1b' }}>
											⚠️ Troubleshooting 403 Forbidden Errors
										</InfoTitle>
										<InfoText style={{ color: '#7f1d1d', marginTop: '0.75rem' }}>
											<strong>Common causes of 403 errors in CIBA:</strong>
											<br />
											<br />
											<strong>1. User Device Not Registered:</strong>
											<br />• The user identified by <code>login_hint</code> must have a registered
											device in PingOne
											<br />• Device must have PingOne SDK or PingID app installed
											<br />• Device must have push notifications enabled
											<br />
											<br />
											<strong>2. Application Not Configured for CIBA:</strong>
											<br />• CIBA grant type must be enabled in PingOne application settings
											<br />• Application must support OIDC (not just OAuth 2.0)
											<br />• Required scopes must be configured (including <code>openid</code>)
											<br />
											<br />
											<strong>3. User Not Found or Invalid login_hint:</strong>
											<br />• <code>login_hint</code> must match a valid user in PingOne (email,
											phone, or user ID)
											<br />• User must exist in the same environment as the application
											<br />
											<br />
											<strong>4. Client Authentication Failed:</strong>
											<br />• Verify <code>client_id</code> and <code>client_secret</code> are
											correct
											<br />• Check that the authentication method matches your application
											configuration
											<br />
											<br />
											<strong>Next Steps:</strong> Check your PingOne admin console to verify
											application settings, user device registration, and grant type configuration.
										</InfoText>
									</div>
								</InfoBox>
							</>
						) : (
							<div>
								<InfoText>Preparing to initiate CIBA authentication request...</InfoText>
							</div>
						)}
					</>
				);

			case 2:
				return (
					<>
						<FlowSequenceDisplay flowType="ciba" />

						{controller.authRequest && (
							<>
								<StatusCard
									$status={controller.authRequest.status === 'approved' ? 'approved' : 'pending'}
								>
									{controller.authRequest.status === 'approved' ? <FiCheckCircle /> : <FiClock />}
									<div>
										<strong>
											{controller.authRequest.status === 'approved'
												? 'User Approved'
												: 'Waiting for User Approval'}
										</strong>
										<p>
											{controller.authRequest.status === 'approved'
												? 'The user has approved the authentication request.'
												: 'Please wait for the user to approve the authentication request on their device.'}
										</p>
									</div>
								</StatusCard>

								{controller.timeRemaining > 0 && (
									<div style={{ marginTop: '1.5rem' }}>
										<h4
											style={{
												marginBottom: '0.5rem',
												fontSize: '1rem',
												fontWeight: '600',
												color: '#1e293b',
											}}
										>
											Time Remaining: {Math.floor(controller.timeRemaining / 60)}:
											{(controller.timeRemaining % 60).toString().padStart(2, '0')}
										</h4>
										<ProgressBar>
											<ProgressFill $progress={controller.progressPercentage} />
										</ProgressBar>
									</div>
								)}

								<div style={{ marginTop: '1.5rem' }}>
									<h4
										style={{
											marginBottom: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										<LearningTooltip
											variant="learning"
											title="Token Polling Request"
											content="The client polls the token endpoint using grant_type=urn:openid:params:grant-type:ciba with the auth_req_id from the backchannel request. Continues until user approves."
											placement="top"
										>
											Token Polling Request (RFC 9436)
										</LearningTooltip>
										:
									</h4>
									<CodeBlock style={{ fontSize: '0.75rem' }}>
										{`POST /token HTTP/1.1
Host: ${(() => {
											const regionDomains: Record<string, string> = {
												us: 'auth.pingone.com',
												eu: 'auth.pingone.eu',
												ap: 'auth.pingone.asia',
												ca: 'auth.pingone.ca',
												na: 'auth.pingone.com',
											};
											return regionDomains['us'] || 'auth.pingone.com';
										})()}/${formData.environmentId}/as
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${btoa(`${formData.clientId}:${formData.clientSecret}`)}

grant_type=urn:openid:params:grant-type:ciba
&client_id=${formData.clientId}
&auth_req_id=${controller.authRequest.auth_req_id}`}
									</CodeBlock>
								</div>

								<div
									style={{
										marginTop: '1.5rem',
										padding: '0.75rem',
										background: '#f8fafc',
										borderRadius: '0.5rem',
										border: '1px solid #e2e8f0',
									}}
								>
									<InfoText style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
										<strong style={{ color: '#1e293b' }}>Polling Behavior (RFC 9436):</strong>
										<br />• If user hasn't approved: Returns <code>400</code> with{' '}
										<code>error=authorization_pending</code> → continue polling
										<br />• If polling too fast: Returns <code>400</code> with{' '}
										<code>error=slow_down</code> → increase interval
										<br />• If expired: Returns <code>400</code> with{' '}
										<code>error=expired_token</code> → stop polling
										<br />• If denied: Returns <code>400</code> with{' '}
										<code>error=access_denied</code> → stop polling
										<br />• If approved: Returns <code>200</code> with tokens → success!
									</InfoText>
								</div>

								<div style={{ marginTop: '1.5rem' }}>
									<h4
										style={{
											marginBottom: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										Binding Message:
									</h4>
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
								<InfoText>
									No tokens available yet. Complete the previous steps to receive tokens.
								</InfoText>
							</div>
						)}
					</>
				);

			default:
				return <div>Step not implemented</div>;
		}
	}, [currentStep, formData, controller, updateFormData, handleCopy]);

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
						redirectUri: 'https://localhost:3000/callback/ciba-v7',
					}}
					onCredentialsChange={(credentials) => {
						console.log('[CIBA-V7] Credentials changed:', credentials);
						if (credentials.environmentId)
							updateFormData('environmentId', credentials.environmentId);
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
							const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(
								result.document.issuer
							);
							if (extractedEnvId) {
								console.log('✅ [CIBA-V7] Extracted environment ID:', extractedEnvId);
								updateFormData('environmentId', extractedEnvId);
							}
						}
					}}
					requireClientSecret={true}
					// Config Checker - Disabled to remove pre-flight API calls
					showConfigChecker={false}
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

					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() => setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))}
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
