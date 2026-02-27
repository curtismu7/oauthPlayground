// src/pages/flows/RARFlowV7.tsx
// V7 RAR (Rich Authorization Requests) Flow with Enhanced Architecture

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiArrowRight,
	FiCheckCircle,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { LearningTooltip } from '../../components/LearningTooltip';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { readBestEnvironmentId } from '../../hooks/useAutoEnvironmentId';
import { usePageScroll } from '../../hooks/usePageScroll';
// Import V7 UI components
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import type { StepCredentials } from '../../services/flowCredentialService';
// Import V7 service architecture components
import { FlowHeader } from '../../services/flowHeaderService';
// Get shared UI components from FlowUIService
import { FlowUIService } from '../../services/flowUIService';
import ModalPresentationService from '../../services/modalPresentationService';
import { OAuthFlowComparisonService } from '../../services/oauthFlowComparisonService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

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

// Custom responsive container for RAR flow
const ResponsiveContainer = styled(Container)`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem;
	
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
const RARFlowV7: React.FC = () => {
	// Scroll management
	usePageScroll();

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		overview: true,
		configuration: false,
		authorization: true,
		tokenExchange: true,
		completion: true,
	});

	// RAR Configuration
	const [environmentId, setEnvironmentId] = useState(() => readBestEnvironmentId());
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopes, setScopes] = useState('openid');
	const [redirectUri, setRedirectUri] = useState('https://localhost:3000/rar-callback');

	// RAR Authorization Details with enhanced examples
	const [rarDetails, setRarDetails] = useState<RARAuthorizationDetails>({
		resource: 'https://api.example.com/accounts',
		actions: ['read'],
		locations: ['https://api.example.com'],
		datatypes: ['account_info'],
		identifier: 'user123',
		privileges: ['view_balance'],
	});

	// RAR Example Scenarios
	const rarExamples = {
		banking: {
			name: '🏦 Banking API',
			description: 'Account access with specific permissions',
			details: {
				resource: 'https://api.bank.com/accounts/12345',
				actions: ['read', 'transfer'],
				locations: ['https://api.bank.com'],
				datatypes: ['account_balance', 'transaction_history'],
				identifier: 'account_12345',
				privileges: ['view_balance', 'make_transfer'],
			},
		},
		healthcare: {
			name: '🏥 Healthcare API',
			description: 'Patient data with HIPAA compliance',
			details: {
				resource: 'https://api.hospital.com/patients/67890',
				actions: ['read', 'update'],
				locations: ['https://api.hospital.com'],
				datatypes: ['medical_records', 'lab_results'],
				identifier: 'patient_67890',
				privileges: ['view_records', 'update_notes'],
			},
		},
		enterprise: {
			name: '🏢 Enterprise API',
			description: 'Document management with role-based access',
			details: {
				resource: 'https://api.company.com/documents',
				actions: ['read', 'write', 'delete'],
				locations: ['https://api.company.com', 'https://cdn.company.com'],
				datatypes: ['documents', 'metadata', 'audit_logs'],
				identifier: 'dept_engineering',
				privileges: ['read_docs', 'write_docs', 'admin_access'],
			},
		},
		iot: {
			name: '🔌 IoT Device API',
			description: 'Smart home device control',
			details: {
				resource: 'https://api.smarthome.com/devices/thermostat_001',
				actions: ['read', 'control'],
				locations: ['https://api.smarthome.com'],
				datatypes: ['temperature_data', 'schedule_data'],
				identifier: 'thermostat_001',
				privileges: ['read_temperature', 'set_temperature', 'modify_schedule'],
			},
		},
	};

	const [selectedExample, setSelectedExample] = useState<string>('banking');

	// Generated authorization URL and tokens
	const [authUrl, setAuthUrl] = useState('');
	const [authCode, setAuthCode] = useState('');
	const [tokenResponse, setTokenResponse] = useState<Record<string, unknown> | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

	// Flow key for credential storage
	const FLOW_KEY = 'rar-v7';

	// Toggle section handler
	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Apply RAR example
	const applyRarExample = useCallback(
		(exampleKey: string) => {
			const example = rarExamples[exampleKey];
			if (example) {
				setRarDetails(example.details);
				setSelectedExample(exampleKey);
				v4ToastManager.showSuccess(`Applied ${example.name} RAR example`);
			}
		},
		// biome-ignore lint/correctness/useExhaustiveDependencies: rarExamples is stable
		[rarExamples]
	);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('🔄 [RAR-V7] Loading credentials with comprehensive service...');

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: FLOW_KEY,
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log('✅ [RAR-V7] Found flow-specific credentials');
				setEnvironmentId(flowData.sharedEnvironment?.environmentId || '');
				setClientId(flowData.flowCredentials.clientId || '');
				setClientSecret(flowData.flowCredentials.clientSecret || '');
				setScopes(
					Array.isArray(flowData.flowCredentials.scopes)
						? flowData.flowCredentials.scopes.join(' ')
						: flowData.flowCredentials.scopes || 'openid'
				);
				setRedirectUri(
					flowData.flowCredentials.redirectUri || 'https://localhost:3000/rar-callback'
				);
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [RAR-V7] Using shared environment data only');
				setEnvironmentId(flowData.sharedEnvironment.environmentId);
			} else {
				console.log('ℹ️ [RAR-V7] No saved credentials found, using defaults');
			}
		};

		loadCredentials();
	}, []);

	// Save credentials
	const saveCredentials = useCallback(
		async (updates: Partial<StepCredentials>) => {
			const credentials: StepCredentials = {
				environmentId,
				clientId,
				clientSecret,
				scopes,
				redirectUri,
				...updates,
			};

			// Save to comprehensive service with complete isolation
			const success = comprehensiveFlowDataService.saveFlowDataComprehensive(FLOW_KEY, {
				...(environmentId && {
					sharedEnvironment: {
						environmentId,
						region: 'us', // Default region
						issuerUrl: `https://auth.pingone.com/${environmentId}`,
					},
				}),
				flowCredentials: {
					clientId,
					clientSecret,
					redirectUri,
					scopes: Array.isArray(scopes) ? scopes : scopes ? [scopes] : [],
					tokenEndpointAuthMethod: 'client_secret_basic',
					lastUpdated: Date.now(),
				},
			});

			if (!success) {
				console.error('[RAR-V7] Failed to save credentials to comprehensive service');
			}

			console.log('💾 [RAR-V7] Credentials saved:', credentials);
		},
		[environmentId, clientId, clientSecret, scopes, redirectUri]
	);

	// Generate RAR authorization URL
	const generateRARAuthUrl = useCallback(() => {
		if (!clientId || !environmentId) {
			setMissingCredentialFields(['Environment ID', 'Client ID']);
			setShowMissingCredentialsModal(true);
			return;
		}

		// Create RAR authorization details object
		const rarAuthorizationDetails = {
			type: 'rar',
			authorization_details: [rarDetails],
		};

		// Encode RAR details as JSON
		const rarJson = JSON.stringify(rarAuthorizationDetails);
		const encodedRar = encodeURIComponent(rarJson);

		// Build authorization URL with RAR parameter
		const baseUrl = `https://auth.pingone.com/${environmentId}/as/authorize`;
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: scopes,
			state: `rar-state-${Math.random().toString(36).substr(2, 9)}`,
			authorization_details: encodedRar,
		});

		const url = `${baseUrl}?${params.toString()}`;
		setAuthUrl(url);

		// Generate mock authorization code for demonstration
		const mockAuthCode = `rar_auth_code_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
		setAuthCode(mockAuthCode);

		console.log('🔗 [RAR-V7] Generated RAR authorization URL:', url);
		console.log('📋 [RAR-V7] RAR Details:', rarDetails);
		console.log('🎭 [RAR-V7] Mock authorization code generated:', mockAuthCode);

		v4ToastManager.showSuccess('RAR authorization URL generated with mock code!');
	}, [clientId, environmentId, redirectUri, scopes, rarDetails]);

	// Exchange authorization code for tokens (Mock Implementation)
	const exchangeCodeForTokens = useCallback(async () => {
		if (!authCode || !clientId || !clientSecret) {
			v4ToastManager.showError('Missing authorization code or credentials');
			return;
		}

		setIsLoading(true);
		try {
			// Enhanced mock token generation with comprehensive RAR context
			const mockTokenResponse = {
				access_token: `rar_access_token_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: scopes,
				// RFC 9396 compliant authorization_details
				authorization_details: [
					{
						type: 'rar_authorization',
						resource: rarDetails.resource,
						actions: rarDetails.actions,
						locations: rarDetails.locations || [],
						datatypes: rarDetails.datatypes || [],
						identifier: rarDetails.identifier,
						privileges: rarDetails.privileges || [],
						// Additional RAR fields for enhanced demo
						authorization_server: `https://auth.pingone.com/${environmentId}`,
						client_id: clientId,
						issued_at: Math.floor(Date.now() / 1000),
						expires_at: Math.floor(Date.now() / 1000) + 3600,
					},
				],
				// Enhanced RAR context with approval details
				rar_context: {
					flow_type: 'authorization_code_with_rar',
					approved_resources: [rarDetails.resource],
					approved_actions: rarDetails.actions,
					approved_locations: rarDetails.locations || [],
					approved_datatypes: rarDetails.datatypes || [],
					approved_identifier: rarDetails.identifier,
					approved_privileges: rarDetails.privileges || [],
					authorization_timestamp: new Date().toISOString(),
					rar_version: '1.0',
					compliance_level: 'RFC_9396',
					// Mock approval metadata
					approval_metadata: {
						user_consent: 'explicit',
						consent_timestamp: new Date().toISOString(),
						risk_assessment: 'low',
						approval_method: 'interactive_consent',
					},
					// Mock resource server information
					resource_server_info: {
						endpoint: rarDetails.resource,
						supported_actions: rarDetails.actions,
						data_classification: rarDetails.datatypes?.join(', ') || 'general',
						access_level: rarDetails.privileges?.join(', ') || 'standard',
					},
				},
				// Additional standard OAuth fields
				refresh_token: `rar_refresh_token_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
				id_token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vJHtlbnZJZH0iLCJhdWQiOiIke2NsaWVudElkfSIsImV4cCI6MTY5ODc2ODAwMCwiaWF0IjoxNjk4NzY0NDAwLCJzdWIiOiJ1c2VyMTIzIiwicmFyX2NvbnRleHQiOiIke3JhckRldGFpbHMucmVzb3VyY2V9In0.mock_rar_signature`,
			};

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			setTokenResponse(mockTokenResponse);
			v4ToastManager.showSuccess('Mock tokens generated with RAR context!');
			console.log('🎉 [RAR-V7] Mock token exchange successful:', mockTokenResponse);
		} catch (error) {
			console.error('❌ [RAR-V7] Mock token exchange failed:', error);
			v4ToastManager.showError(`Mock token generation failed: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	}, [authCode, clientId, clientSecret, environmentId, scopes, rarDetails]);

	// Navigation handlers
	const handleNext = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [currentStep]);

	const handlePrev = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setAuthUrl('');
		setAuthCode('');
		setTokenResponse(null);
	}, []);

	const handleStartOver = useCallback(() => {
		handleReset();

		// Clear any potential ConfigChecker-related state or cached data
		try {
			// Clear any comparison results or cached application data
			sessionStorage.removeItem('config-checker-diffs');
			sessionStorage.removeItem('config-checker-last-check');
			sessionStorage.removeItem('pingone-app-cache');
			localStorage.removeItem('pingone-applications-cache');

			// Clear any worker token related cache that might be used for pre-flight checks
			sessionStorage.removeItem('worker-token-cache');
			localStorage.removeItem('worker-apps-cache');

			console.log('🔄 [RARFlowV7] Starting over: cleared ConfigChecker and pre-flight cache data');
		} catch (error) {
			console.warn('[RARFlowV7] Failed to clear cache data:', error);
		}

		v4ToastManager.showInfo('RAR flow reset to beginning');
	}, [handleReset]);

	// Check if can navigate to next step
	const canNavigateNext = useCallback(() => {
		switch (currentStep) {
			case 0:
				return true;
			case 1:
				return environmentId && clientId;
			case 2:
				return authUrl;
			case 3:
				return tokenResponse;
			default:
				return true;
		}
	}, [currentStep, environmentId, clientId, authUrl, tokenResponse]);

	// Render step content
	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						{/* RAR Educational Content */}
						<InfoBox
							$variant="success"
							style={{ marginBottom: '1.5rem', background: '#dcfce7', borderColor: '#10b981' }}
						>
							<FiCheckCircle size={24} style={{ color: '#047857' }} />
							<div>
								<InfoTitle style={{ color: '#065f46', fontSize: '1.125rem' }}>
									<LearningTooltip
										variant="learning"
										title="RAR (Rich Authorization Requests)"
										content="RFC 9396 - Fine-grained authorization using structured JSON. Specifies detailed resource and action permissions."
										placement="top"
									>
										RAR
									</LearningTooltip>{' '}
									= Fine-Grained Authorization with Structured JSON (
									<LearningTooltip
										variant="info"
										title="RFC 9396"
										content="OAuth 2.0 Rich Authorization Requests specification"
										placement="top"
									>
										RFC 9396
									</LearningTooltip>
									)
								</InfoTitle>
								<InfoText style={{ color: '#064e3b', marginBottom: '0.75rem' }}>
									<LearningTooltip
										variant="learning"
										title="RAR"
										content="RFC 9396 - Rich Authorization Requests"
										placement="top"
									>
										RAR
									</LearningTooltip>{' '}
									enables{' '}
									<LearningTooltip
										variant="info"
										title="Fine-Grained Authorization"
										content="Precise control over what resources and actions are authorized"
										placement="top"
									>
										fine-grained authorization
									</LearningTooltip>{' '}
									using{' '}
									<LearningTooltip
										variant="info"
										title="Structured JSON"
										content="JSON format specifying resources, actions, and conditions"
										placement="top"
									>
										structured JSON
									</LearningTooltip>
									. {RAR_EDUCATION.overview.description}
								</InfoText>
								<InfoText
									style={{ color: '#064e3b', marginBottom: '0.75rem', fontStyle: 'italic' }}
								>
									{RAR_EDUCATION.overview.keyPoint}
								</InfoText>
								<InfoList style={{ color: '#064e3b' }}>
									{RAR_EDUCATION.benefits.map((benefit, index) => (
										<li key={index}>{benefit}</li>
									))}
								</InfoList>
								<HelperText style={{ color: '#064e3b', fontWeight: 600, marginTop: '0.75rem' }}>
									📋 <strong>Example:</strong> {RAR_EDUCATION.example.description}
								</HelperText>
								<HelperText style={{ color: '#064e3b', fontWeight: 600, marginTop: '0.5rem' }}>
									<strong>Use Cases:</strong> {RAR_EDUCATION.useCases.join(' | ')}
								</HelperText>
								<HelperText
									style={{
										color: '#059669',
										fontWeight: 700,
										marginTop: '0.5rem',
										padding: '0.5rem',
										background: '#d1fae5',
										borderRadius: '0.375rem',
									}}
								>
									📚 <strong>Standard:</strong> {RAR_EDUCATION.standard}
								</HelperText>
								<HelperText
									style={{
										color: '#dc2626',
										fontWeight: 600,
										marginTop: '0.75rem',
										padding: '0.75rem',
										background: '#fef2f2',
										borderRadius: '0.375rem',
										border: '1px solid #fecaca',
									}}
								>
									🎭 <strong>Mock Flow:</strong> {RAR_EDUCATION.mockFlow.description}
								</HelperText>
								<HelperText
									style={{
										color: '#1f2937',
										fontWeight: 500,
										marginTop: '0.5rem',
										padding: '0.5rem',
										background: '#f9fafb',
										borderRadius: '0.375rem',
										border: '1px solid #e5e7eb',
									}}
								>
									💡 <strong>Note:</strong> {RAR_EDUCATION.mockFlow.note}
								</HelperText>

								{/* Interactive RAR vs Scopes Comparison */}
								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f0f9ff',
										borderRadius: '0.5rem',
										border: '1px solid #0ea5e9',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.75rem 0',
											color: '#0c4a6e',
											fontSize: '0.875rem',
											fontWeight: '600',
										}}
									>
										🔄 RAR vs Traditional Scopes Comparison
									</h4>
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '1fr 1fr',
											gap: '1rem',
											fontSize: '0.75rem',
										}}
									>
										<div>
											<strong style={{ color: '#dc2626' }}>❌ Traditional Scopes (Limited)</strong>
											<div
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem',
													background: '#fef2f2',
													borderRadius: '0.25rem',
												}}
											>
												<code>scope=read write delete</code>
												<br />
												<span style={{ color: '#7f1d1d' }}>• All-or-nothing permissions</span>
												<br />
												<span style={{ color: '#7f1d1d' }}>• No resource specificity</span>
												<br />
												<span style={{ color: '#7f1d1d' }}>• Limited context</span>
											</div>
										</div>
										<div>
											<strong style={{ color: '#16a34a' }}>✅ RAR (Fine-Grained)</strong>
											<div
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem',
													background: '#f0fdf4',
													borderRadius: '0.25rem',
												}}
											>
												<code>
													authorization_details=[{'{'}resource, actions, datatypes{'}'}]
												</code>
												<br />
												<span style={{ color: '#166534' }}>• Specific resource targeting</span>
												<br />
												<span style={{ color: '#166534' }}>• Granular action control</span>
												<br />
												<span style={{ color: '#166534' }}>• Rich contextual data</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</InfoBox>

						{/* RAR Configuration Requirements */}
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('configuration')}
								aria-expanded={!collapsedSections.configuration}
							>
								<CollapsibleTitle>
									<FiSettings /> RAR Configuration & Examples
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.configuration}>
									<FiArrowRight />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.configuration && (
								<CollapsibleContent style={{ padding: '0.75rem' }}>
									{/* RAR Example Selector */}
									<div
										style={{
											marginBottom: '1.5rem',
											padding: '1rem',
											background: '#f8fafc',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
										}}
									>
										<h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
											📋 RAR Example Scenarios
										</h4>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											{Object.entries(rarExamples).map(([key, example]) => (
												<button
													type="button"
													key={key}
													onClick={() => applyRarExample(key)}
													style={{
														padding: '0.75rem',
														border: `2px solid ${selectedExample === key ? '#3b82f6' : '#e5e7eb'}`,
														borderRadius: '0.5rem',
														background: selectedExample === key ? '#eff6ff' : 'white',
														color: selectedExample === key ? '#1e40af' : '#374151',
														cursor: 'pointer',
														textAlign: 'left',
														fontSize: '0.875rem',
														transition: 'all 0.2s ease',
													}}
												>
													<div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
														{example.name}
													</div>
													<div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
														{example.description}
													</div>
												</button>
											))}
										</div>
										<div
											style={{
												padding: '0.75rem',
												background: '#fef3c7',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												color: '#92400e',
											}}
										>
											💡 <strong>Tip:</strong> Click an example above to auto-fill the RAR
											configuration with realistic use case data.
										</div>
									</div>

									<ResponsiveFormGrid>
										<FormGroup>
											<Label>
												<LearningTooltip
													variant="learning"
													title="Resource"
													content="The target resource URI that the authorization applies to (e.g., 'https://api.example.com/accounts'). Specifies what data or service is being accessed."
													placement="top"
												>
													Resource
												</LearningTooltip>{' '}
												*
											</Label>
											<Input
												type="text"
												value={rarDetails.resource}
												onChange={(e) =>
													setRarDetails((prev) => ({ ...prev, resource: e.target.value }))
												}
												placeholder="https://api.example.com/accounts"
												style={{ fontSize: '0.875rem' }}
											/>
										</FormGroup>

										<FormGroup>
											<Label>
												<LearningTooltip
													variant="learning"
													title="Actions"
													content="The specific operations allowed on the resource (e.g., 'read', 'write', 'delete'). Provides fine-grained control beyond simple scope strings."
													placement="top"
												>
													Actions
												</LearningTooltip>{' '}
												*
											</Label>
											<Input
												type="text"
												value={rarDetails.actions.join(', ')}
												onChange={(e) =>
													setRarDetails((prev) => ({
														...prev,
														actions: e.target.value.split(',').map((s) => s.trim()),
													}))
												}
												placeholder="read, write, delete"
												style={{ fontSize: '0.875rem' }}
											/>
										</FormGroup>

										<FormGroup>
											<Label>
												<LearningTooltip
													variant="info"
													title="Locations"
													content="Optional URIs specifying where the resource can be accessed from. Used for data residency or compliance requirements (e.g., EU-only data access)."
													placement="top"
												>
													Locations
												</LearningTooltip>{' '}
												(Optional)
											</Label>
											<Input
												type="text"
												value={rarDetails.locations?.join(', ') || ''}
												onChange={(e) =>
													setRarDetails((prev) => ({
														...prev,
														locations: e.target.value.split(',').map((s) => s.trim()),
													}))
												}
												placeholder="https://api.example.com, https://api.secure.example.com"
												style={{ fontSize: '0.875rem' }}
											/>
										</FormGroup>

										<FormGroup>
											<Label>
												<LearningTooltip
													variant="info"
													title="Data Types"
													content="Optional identifiers for specific types of data within the resource (e.g., 'account_info', 'transaction_history'). Enables even more granular authorization."
													placement="top"
												>
													Data Types
												</LearningTooltip>{' '}
												(Optional)
											</Label>
											<Input
												type="text"
												value={rarDetails.datatypes?.join(', ') || ''}
												onChange={(e) =>
													setRarDetails((prev) => ({
														...prev,
														datatypes: e.target.value.split(',').map((s) => s.trim()),
													}))
												}
												placeholder="account_info, transaction_history"
												style={{ fontSize: '0.875rem' }}
											/>
										</FormGroup>

										<FormGroup>
											<Label>
												<LearningTooltip
													variant="info"
													title="Identifier"
													content="Optional specific identifier for the resource (e.g., user ID, account number). Enables authorization for specific instances rather than all resources of a type."
													placement="top"
												>
													Identifier
												</LearningTooltip>{' '}
												(Optional)
											</Label>
											<Input
												type="text"
												value={rarDetails.identifier || ''}
												onChange={(e) =>
													setRarDetails((prev) => ({ ...prev, identifier: e.target.value }))
												}
												placeholder="user123, account456"
												style={{ fontSize: '0.875rem' }}
											/>
										</FormGroup>

										<FormGroup>
											<Label>
												<LearningTooltip
													variant="info"
													title="Privileges"
													content="Optional higher-level privileges or capabilities beyond basic actions (e.g., 'view_balance', 'transfer_funds'). Used for business logic authorization."
													placement="top"
												>
													Privileges
												</LearningTooltip>{' '}
												(Optional)
											</Label>
											<Input
												type="text"
												value={rarDetails.privileges?.join(', ') || ''}
												onChange={(e) =>
													setRarDetails((prev) => ({
														...prev,
														privileges: e.target.value.split(',').map((s) => s.trim()),
													}))
												}
												placeholder="view_balance, transfer_funds"
												style={{ fontSize: '0.875rem' }}
											/>
										</FormGroup>
									</ResponsiveFormGrid>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 1:
				return (
					<ComprehensiveCredentialsService
						flowType="rar-v7"
						onCredentialsChange={(credentials) => {
							console.log('🔧 [RAR-V7] Credentials changed:', credentials);
							setEnvironmentId(credentials.environmentId || '');
							setClientId(credentials.clientId || '');
							setClientSecret(credentials.clientSecret || '');
							setScopes(credentials.scopes || 'read write');
							setRedirectUri(credentials.redirectUri || 'https://localhost:3000/rar-callback');

							// Auto-save credentials when changed
							saveCredentials({
								environmentId: credentials.environmentId || '',
								clientId: credentials.clientId || '',
								clientSecret: credentials.clientSecret || '',
								scopes: credentials.scopes || 'read write',
								redirectUri: credentials.redirectUri || 'https://localhost:3000/rar-callback',
							});
						}}
						onDiscoveryComplete={(result) => {
							console.log('🔍 [RAR-V7] OIDC Discovery completed:', result);
							if (result.success && result.document) {
								const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(
									result.document.issuer
								);
								if (extractedEnvId) {
									console.log('✅ [RAR-V7] Extracted environment ID:', extractedEnvId);
									setEnvironmentId(extractedEnvId);
								}
							}
						}}
						credentials={{
							environmentId,
							clientId,
							clientSecret,
							scopes,
							redirectUri,
						}}
						title="🎯 RAR Flow V7 Configuration"
						subtitle="Configure PingOne environment and client credentials for Rich Authorization Requests"
						requireClientSecret={true}
						showRedirectUri={true}
						showAdvancedConfig={true}
						// Config Checker - Disabled to remove pre-flight API calls
						showConfigChecker={false}
						workerToken={localStorage.getItem('worker_token') || ''}
						defaultCollapsed={false}
					/>
				);

			case 2:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton
							onClick={() => toggleSection('authorization')}
							aria-expanded={!collapsedSections.authorization}
						>
							<CollapsibleTitle>
								<FiKey /> Generate{' '}
								<LearningTooltip
									variant="learning"
									title="RAR Authorization URL"
									content="The authorization endpoint URL with RAR parameters. Includes 'authorization_details' parameter containing the structured JSON with resource, actions, and other fine-grained authorization requirements (RFC 9396)."
									placement="top"
								>
									RAR Authorization URL
								</LearningTooltip>
							</CollapsibleTitle>
							<CollapsibleToggleIcon $collapsed={collapsedSections.authorization}>
								<FiArrowRight />
							</CollapsibleToggleIcon>
						</CollapsibleHeaderButton>
						{!collapsedSections.authorization && (
							<CollapsibleContent>
								<FormGroup>
									<Label>
										<LearningTooltip
											variant="learning"
											title="RAR Authorization Details"
											content="Structured JSON object containing resource, actions, locations, datatypes, and other fine-grained authorization parameters. Sent as 'authorization_details' parameter in the authorization request (RFC 9396)."
											placement="top"
										>
											RAR Authorization Details
										</LearningTooltip>
									</Label>
									<CodeBlock>{JSON.stringify(rarDetails, null, 2)}</CodeBlock>
								</FormGroup>

								<Button onClick={generateRARAuthUrl} $variant="primary">
									<FiKey /> Generate RAR Authorization URL
								</Button>

								{authUrl && (
									<GeneratedContentBox style={{ marginTop: '1rem', padding: '0.75rem' }}>
										<ParameterGrid>
											<ParameterLabel>Authorization URL</ParameterLabel>
											<ParameterValue
												style={{
													wordBreak: 'break-all',
													fontSize: '0.75rem',
													maxWidth: '100%',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
												}}
											>
												{authUrl}
											</ParameterValue>
										</ParameterGrid>
									</GeneratedContentBox>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 3:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton
							onClick={() => toggleSection('tokenExchange')}
							aria-expanded={!collapsedSections.tokenExchange}
						>
							<CollapsibleTitle>
								<FiRefreshCw />{' '}
								<LearningTooltip
									variant="learning"
									title="Token Exchange"
									content="The process of exchanging an authorization code for access and ID tokens at the token endpoint. The server validates the code and returns tokens that include the approved RAR authorization details."
									placement="top"
								>
									Token Exchange
								</LearningTooltip>
							</CollapsibleTitle>
							<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchange}>
								<FiArrowRight />
							</CollapsibleToggleIcon>
						</CollapsibleHeaderButton>
						{!collapsedSections.tokenExchange && (
							<CollapsibleContent>
								<FormGroup>
									<Label>
										<LearningTooltip
											variant="learning"
											title="Authorization Code"
											content="A short-lived credential (typically 10 minutes) returned from the authorization server after user consent. Single-use and must be exchanged server-side for tokens."
											placement="top"
										>
											Authorization Code
										</LearningTooltip>
									</Label>
									<Input
										type="text"
										value={authCode}
										onChange={(e) => setAuthCode(e.target.value)}
										placeholder="Enter authorization code from callback"
									/>
								</FormGroup>

								<Button
									onClick={exchangeCodeForTokens}
									$variant="primary"
									disabled={!authCode || isLoading}
								>
									<FiRefreshCw /> {isLoading ? 'Exchanging...' : 'Exchange for Tokens'}
								</Button>

								{/* Enhanced Token Display with RAR Context using UnifiedTokenDisplayService */}
								{tokenResponse && (
									<>
										{UnifiedTokenDisplayService.showTokens(
											tokenResponse,
											'oauth',
											'rar-v7-tokens',
											{
												showCopyButtons: true,
												showDecodeButtons: true,
												showIntrospection: true,
												title: '🎯 RAR Flow V7 Tokens with Authorization Details',
												className: 'rar-token-display',
											}
										)}

										{/* Enhanced RAR-Specific Fields Display */}
										{(tokenResponse.authorization_details || tokenResponse.rar_context) && (
											<div style={{ marginTop: '1rem' }}>
												<h4
													style={{
														margin: '0 0 1rem 0',
														color: '#16a34a',
														fontSize: '1rem',
														fontWeight: '600',
														display: 'flex',
														alignItems: 'center',
														gap: '0.5rem',
													}}
												>
													<FiShield size={16} />
													RAR Authorization Details & Context
												</h4>

												{tokenResponse.authorization_details && (
													<GeneratedContentBox style={{ marginBottom: '1rem', padding: '1rem' }}>
														<h5
															style={{
																margin: '0 0 0.75rem 0',
																color: '#059669',
																fontSize: '0.875rem',
																fontWeight: '600',
															}}
														>
															📋 RFC 9396 Authorization Details
														</h5>
														<CodeBlock
															style={{
																fontSize: '0.75rem',
																margin: '0',
																maxHeight: '200px',
																overflow: 'auto',
															}}
														>
															{JSON.stringify(tokenResponse.authorization_details, null, 2)}
														</CodeBlock>
														<div
															style={{
																marginTop: '0.75rem',
																padding: '0.5rem',
																background: '#ecfdf5',
																borderRadius: '0.25rem',
																fontSize: '0.75rem',
																color: '#065f46',
															}}
														>
															<strong>✅ Approved Permissions:</strong>{' '}
															{tokenResponse.authorization_details[0]?.actions?.join(', ')} on{' '}
															{tokenResponse.authorization_details[0]?.resource}
														</div>
													</GeneratedContentBox>
												)}

												{tokenResponse.rar_context && (
													<GeneratedContentBox style={{ padding: '1rem' }}>
														<h5
															style={{
																margin: '0 0 0.75rem 0',
																color: '#0369a1',
																fontSize: '0.875rem',
																fontWeight: '600',
															}}
														>
															🔍 RAR Context & Metadata
														</h5>
														<CodeBlock
															style={{
																fontSize: '0.75rem',
																margin: '0 0 0.75rem 0',
																maxHeight: '200px',
																overflow: 'auto',
															}}
														>
															{JSON.stringify(tokenResponse.rar_context, null, 2)}
														</CodeBlock>

														{/* RAR Context Summary */}
														<div
															style={{
																display: 'grid',
																gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
																gap: '0.75rem',
																marginTop: '0.75rem',
															}}
														>
															<div
																style={{
																	padding: '0.5rem',
																	background: '#eff6ff',
																	borderRadius: '0.25rem',
																	fontSize: '0.75rem',
																}}
															>
																<strong style={{ color: '#1e40af' }}>Flow Type:</strong>
																<br />
																<span style={{ color: '#1e3a8a' }}>
																	{tokenResponse.rar_context.flow_type}
																</span>
															</div>
															<div
																style={{
																	padding: '0.5rem',
																	background: '#f0fdf4',
																	borderRadius: '0.25rem',
																	fontSize: '0.75rem',
																}}
															>
																<strong style={{ color: '#166534' }}>Compliance:</strong>
																<br />
																<span style={{ color: '#14532d' }}>
																	{tokenResponse.rar_context.compliance_level}
																</span>
															</div>
															<div
																style={{
																	padding: '0.5rem',
																	background: '#fefce8',
																	borderRadius: '0.25rem',
																	fontSize: '0.75rem',
																}}
															>
																<strong style={{ color: '#a16207' }}>Risk Level:</strong>
																<br />
																<span style={{ color: '#92400e' }}>
																	{tokenResponse.rar_context.approval_metadata?.risk_assessment}
																</span>
															</div>
														</div>
													</GeneratedContentBox>
												)}
											</div>
										)}
									</>
								)}
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 4:
				return (
					<>
						<FlowCompletionService
							config={{
								...FlowCompletionConfigs.rar,
								title: '🎉 RAR Flow V7 Complete!',
								description:
									'You have successfully completed the Rich Authorization Requests (RAR) flow demonstration with enhanced mock tokens and comprehensive authorization details.',
								nextSteps: [
									'🔍 Examine the authorization_details in the token response',
									'📋 Compare RAR vs traditional scopes approach',
									'🏦 Try different RAR example scenarios (Banking, Healthcare, Enterprise, IoT)',
									'📚 Learn about RFC 9396 - Rich Authorization Requests standard',
									'🔧 Implement RAR in your real OAuth applications',
									'🎯 Explore fine-grained permission models',
									'🛡️ Understand enhanced security through contextual authorization',
								],
							}}
							collapsed={collapsedSections.completion}
							onToggleCollapsed={() => toggleSection('completion')}
							tokens={tokenResponse}
							onReset={() => {
								setCurrentStep(0);
								setAuthUrl('');
								setAuthCode('');
								setTokenResponse(null);
								setRarDetails({
									resource: 'https://api.example.com/accounts',
									actions: ['read'],
									locations: ['https://api.example.com'],
									datatypes: ['account_info'],
									identifier: 'user123',
									privileges: ['view_balance'],
								});
								v4ToastManager.showInfo('RAR Flow V7 reset successfully');
							}}
						/>

						{/* Additional RAR Resources */}
						<div
							style={{
								marginTop: '1.5rem',
								padding: '1.5rem',
								background: '#f8fafc',
								borderRadius: '0.75rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<h3
								style={{
									margin: '0 0 1rem 0',
									color: '#1f2937',
									fontSize: '1.125rem',
									fontWeight: '600',
								}}
							>
								📚 RAR Learning Resources
							</h3>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '1px solid #e5e7eb',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#059669',
											fontSize: '1rem',
											fontWeight: '600',
										}}
									>
										🔗 Official Specification
									</h4>
									<p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										RFC 9396 - Rich Authorization Requests
									</p>
									<a
										href="https://datatracker.ietf.org/doc/html/rfc9396"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }}
									>
										Read RFC 9396 →
									</a>
								</div>

								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '1px solid #e5e7eb',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#dc2626',
											fontSize: '1rem',
											fontWeight: '600',
										}}
									>
										🏦 Real-World Examples
									</h4>
									<p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Banking, Healthcare, Enterprise use cases
									</p>
									<button
										type="button"
										onClick={() => setCurrentStep(0)}
										style={{
											background: 'none',
											border: 'none',
											color: '#3b82f6',
											fontSize: '0.875rem',
											cursor: 'pointer',
											textDecoration: 'underline',
										}}
									>
										Try Examples →
									</button>
								</div>

								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '1px solid #e5e7eb',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#7c3aed',
											fontSize: '1rem',
											fontWeight: '600',
										}}
									>
										🔧 Implementation Guide
									</h4>
									<p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										How to implement RAR in your applications
									</p>
									<span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Coming soon...</span>
								</div>
							</div>
						</div>
					</>
				);

			default:
				return <div>Invalid step</div>;
		}
	}, [
		currentStep,
		collapsedSections,
		toggleSection,
		environmentId,
		clientId,
		clientSecret,
		scopes,
		redirectUri,
		rarDetails,
		authUrl,
		authCode,
		tokenResponse,
		isLoading,
		generateRARAuthUrl,
		exchangeCodeForTokens,
		applyRarExample,
		saveCredentials,
		selectedExample,
		// biome-ignore lint/correctness/useExhaustiveDependencies: rarExamples is stable
		rarExamples,
	]);

	// Main render
	return (
		<ResponsiveContainer>
			<FlowHeader flowId="rar-v7" />

			<ResponsiveContentWrapper>
				{/* RAR Educational Callout - More Compact */}
				<InfoBox $variant="info" style={{ marginBottom: '1rem', padding: '1rem' }}>
					<FiInfo size={20} />
					<div>
						<InfoTitle style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
							🎯 V7: Enhanced RAR Implementation
						</InfoTitle>
						<InfoText style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
							This V7 implementation demonstrates Rich Authorization Requests (RAR) with enhanced
							architecture, comprehensive credential management, and modern UI components.
						</InfoText>
						<HelperText
							style={{
								color: '#dc2626',
								fontWeight: 600,
								marginTop: '0.5rem',
								padding: '0.5rem',
								background: '#fef2f2',
								borderRadius: '0.375rem',
								border: '1px solid #fecaca',
								fontSize: '0.875rem',
							}}
						>
							🎭 <strong>Mock Flow:</strong> This is an educational demonstration with mock tokens
							and responses. In production, PingOne would process the RAR parameters and return real
							tokens with authorization details.
						</HelperText>
					</div>
				</InfoBox>

				<SectionDivider />

				{/* Flow Comparison Table - Collapsed by default for space */}
				{OAuthFlowComparisonService.getComparisonTable({
					highlightFlow: 'rar',
					collapsed: true,
				})}

				<SectionDivider />

				<ResponsiveMainCard>
					<StepContentWrapper style={{ maxWidth: '100%', overflow: 'hidden' }}>
						{renderStepContent}
					</StepContentWrapper>
				</ResponsiveMainCard>
			</ResponsiveContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrev}
				onNext={handleNext}
				onReset={handleReset}
				onStartOver={handleStartOver}
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
			/>

			<ModalPresentationService
				isOpen={showMissingCredentialsModal}
				onClose={() => setShowMissingCredentialsModal(false)}
				title="Credentials required"
				description={
					missingCredentialFields.length > 0
						? `Please provide the following required credential${missingCredentialFields.length > 1 ? 's' : ''} before continuing:`
						: 'Environment ID and Client ID are required before moving to the next step.'
				}
				actions={[
					{
						label: 'Back to credentials',
						onClick: () => setShowMissingCredentialsModal(false),
						variant: 'primary',
					},
				]}
			>
				{missingCredentialFields.length > 0 && (
					<ul style={{ marginTop: '1rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
						{missingCredentialFields.map((field) => (
							<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
								{field}
							</li>
						))}
					</ul>
				)}
			</ModalPresentationService>
		</ResponsiveContainer>
	);
};

export default RARFlowV7;
