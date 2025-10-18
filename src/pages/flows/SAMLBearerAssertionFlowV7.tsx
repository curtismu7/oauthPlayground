// src/pages/flows/SAMLBearerAssertionFlowV7.tsx
// OAuth 2.0 SAML Bearer Assertion Flow (RFC 7522)

import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiGlobe,
	FiInfo,
	FiPackage,
	FiRefreshCw,
	FiSend,
	FiSettings,
	FiEye,
	FiEyeOff,
	FiUsers,
} from 'react-icons/fi';
import { usePageScroll } from '../../hooks/usePageScroll';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowCompletionService } from '../../services/flowCompletionService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import SAMLAssertionService from '../../services/samlAssertionService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { credentialManager } from '../../utils/credentialManager';

// Styled Components (reusing from JWT Bearer Flow)
const Container = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const ContentWrapper = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const SectionDivider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
	margin: 2rem 0;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	gap: 1rem;
	padding: 1.5rem;
	background: ${props => {
		switch (props.$variant) {
			case 'warning': return '#fef3c7';
			case 'success': return '#f0fdf4';
			case 'error': return '#fef2f2';
			default: return '#eff6ff';
		}
	}};
	border: 1px solid ${props => {
		switch (props.$variant) {
			case 'warning': return '#fbbf24';
			case 'success': return '#bbf7d0';
			case 'error': return '#fca5a5';
			default: return '#bfdbfe';
		}
	}};
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	font-size: 0.875rem;
	line-height: 1.6;
	color: ${props => {
		switch (props.$variant) {
			case 'warning': return '#78350f';
			case 'success': return '#065f46';
			case 'error': return '#991b1b';
			default: return '#1e40af';
		}
	}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 700;
	margin: 0 0 0.75rem 0;
	color: inherit;
`;

const InfoText = styled.div`
	margin-bottom: 0.75rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: border-color 0.2s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

// Helper text component for form guidance
const Helper = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	margin-top: 0.5rem;
	line-height: 1.4;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	
	${props => props.$variant === 'primary' ? `
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		border: none;
		
		&:hover {
			background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
		}
	` : `
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		
		&:hover {
			background: #f9fafb;
			border-color: #9ca3af;
		}
	`}
`;

const GeneratedContentBox = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: 0.75rem;
	align-items: center;
`;

const ParameterLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background-color: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	padding: 0.5rem;
	border-radius: 0.25rem;
`;

// Types
interface SAMLAssertion {
	issuer: string;
	subject: string;
	audience: string;
	conditions: {
		notBefore: string;
		notOnOrAfter: string;
	};
	attributes: Record<string, string>;
}

// Main Component
const completionConfig = {
	flowName: 'SAML Bearer Assertion (Mock)',
	flowDescription: 'You generated a mock SAML assertion and simulated exchanging it for an access token.',
	completedSteps: [
		{ completed: true, description: 'Configured SAML issuer, subject, and audience' },
		{ completed: true, description: 'Generated mock SAML assertion' },
		{ completed: true, description: 'Simulated token request with SAML assertion' }
	],
	nextSteps: [
		'Implement assertion signing using enterprise IdP keys',
		'Validate SAML assertion signature and timing windows',
		'Integrate with an OAuth server that supports SAML bearer assertions'
	]
};

const SAMLBearerAssertionFlowV7: React.FC = () => {
	// Scroll management
	usePageScroll();

	// State management
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		credentials: false,
		samlBuilder: false,
		tokenRequest: false,
		tokenResponse: false,
		completion: false
	});

	// SAML Configuration
	const [environmentId, setEnvironmentId] = useState(__PINGONE_ENVIRONMENT_ID__ || 'b9817c16-9910-4415-b67e-4ac687da74d9');
	const [clientId, setClientId] = useState('mock-saml-bearer-client');
	const [tokenEndpoint, setTokenEndpoint] = useState('https://auth.mock.pingone.com/mock-environment/as/token');
	const [identityProvider, setIdentityProvider] = useState('Mock Identity Provider Co.');

	// SAML Assertion
	const [samlAssertion, setSamlAssertion] = useState<SAMLAssertion>(() => {
		const now = new Date();
		const notBefore = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
		const notOnOrAfter = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
		return {
			issuer: 'https://idp.mock.pingone.com/mock-environment',
			subject: 'mock.user@example.com',
			audience: 'https://auth.mock.pingone.com/mock-environment/as/token',
			conditions: {
				notBefore,
				notOnOrAfter
			},
			attributes: {
				email: 'mock.user@example.com',
				given_name: 'Mock',
				family_name: 'User',
				role: 'API Administrator'
			}
		};
	});

	// Generated SAML Assertion
	const [generatedSAML, setGeneratedSAML] = useState('');
	const [showDecodedSAML, setShowDecodedSAML] = useState(false);
	const [tokenResponse, setTokenResponse] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);

	const normalizeAttributes = useCallback((attributes: Record<string, string | string[]> | undefined) => {
		if (!attributes) {
			return {} as Record<string, string>;
		}

		return Object.entries(attributes).reduce<Record<string, string>>((acc, [key, value]) => {
			if (Array.isArray(value)) {
				acc[key] = value.join(', ');
			} else if (typeof value === 'string') {
				acc[key] = value;
			}
			return acc;
		}, {});
	}, []);

	const base64SAML = useMemo(() => {
		if (!generatedSAML) {
			return '';
		}
		try {
			return typeof window !== 'undefined' && window.btoa ? window.btoa(generatedSAML) : btoa(generatedSAML);
		} catch (error) {
			console.error('[SAML Bearer] Failed to encode SAML assertion to Base64:', error);
			return '';
		}
	}, [generatedSAML]);

	const decodedSAMLFromBase64 = useMemo(() => {
		if (!showDecodedSAML || !base64SAML) {
			return '';
		}
		try {
			return typeof window !== 'undefined' && window.atob ? window.atob(base64SAML) : atob(base64SAML);
		} catch (error) {
			console.error('[SAML Bearer] Failed to decode Base64 SAML assertion:', error);
			return '';
		}
	}, [showDecodedSAML, base64SAML]);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		if (!text) {
			v4ToastManager.showWarning(`No ${label} available to copy.`);
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard.`);
		} catch (error) {
			console.error('[SAML Bearer] Failed to copy to clipboard:', error);
			v4ToastManager.showError(`Unable to copy ${label}.`);
		}
	}, []);

	// Toggle section handler
	const toggleSection = useCallback((section: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	}, []);

	// Auto-populate Token Endpoint and Audience from OIDC Discovery
	useEffect(() => {
		const fetchDiscoveryAndPopulateEndpoints = async () => {
			if (!environmentId || environmentId.length < 36) {
				// Not a valid PingOne environment ID yet (UUID format)
				return;
			}

			try {
				console.log('[SAML Bearer] Fetching OIDC Discovery for environment:', environmentId);
				const issuerUrl = `https://auth.pingone.com/${environmentId}/as`;
				const result = await oidcDiscoveryService.discover({ issuerUrl });
				if (result.success && result.document) {
					const { token_endpoint, issuer } = result.document;
					if (token_endpoint) {
						setTokenEndpoint(token_endpoint);
						console.log('[SAML Bearer] Token endpoint auto-populated:', token_endpoint);
					}
					if (issuer) {
						setSamlAssertion(prev => ({
							...prev,
							issuer,
							audience: issuer
						}));
						console.log('[SAML Bearer] Issuer and Audience auto-populated:', issuer);
					}
					v4ToastManager.showSuccess('Endpoints and SAML fields auto-populated from OIDC Discovery');
				}
			} catch (error) {
				console.warn('[SAML Bearer] OIDC Discovery failed:', error);
				// Don't show error toast - user can manually enter endpoints
			}
		};

		fetchDiscoveryAndPopulateEndpoints();
	}, [environmentId]); // Only run when environmentId changes

	// Check if all required fields are filled for SAML generation
	const canGenerateSAML = useCallback(() => {
		const hasClientId = clientId.trim().length > 0;
		const hasTokenEndpoint = tokenEndpoint.trim().length > 0;
		const hasIssuer = samlAssertion.issuer.trim().length > 0;
		const hasSubject = samlAssertion.subject.trim().length > 0;
		const hasAudience = samlAssertion.audience.trim().length > 0;
		
		console.log('[SAML Bearer] Validation check:', {
			hasClientId,
			hasTokenEndpoint,
			hasIssuer,
			hasSubject,
			hasAudience,
			clientId: clientId,
			issuer: samlAssertion.issuer,
			subject: samlAssertion.subject,
			audience: samlAssertion.audience
		});
		
		return hasClientId && hasTokenEndpoint && hasIssuer && hasSubject && hasAudience;
	}, [clientId, tokenEndpoint, samlAssertion.issuer, samlAssertion.subject, samlAssertion.audience]);

	// Generate SAML Assertion using service
	const generateSAMLAssertion = useCallback(() => {
		const config = {
			clientId,
			tokenEndpoint,
			identityProvider,
			scopes: '',
			samlAssertion
		};

		const validation = SAMLAssertionService.validateConfiguration(config);
		if (!validation.isValid) {
			v4ToastManager.showWarning(`Please fill in all required fields: ${validation.errors.join(', ')}`);
			return;
		}

		try {
			const mockSAML = SAMLAssertionService.generateSAMLAssertion(config);
			setGeneratedSAML(mockSAML);
			v4ToastManager.showSuccess('SAML Assertion generated successfully!');
		} catch (error) {
			console.error('[SAML Bearer] Error generating SAML assertion:', error);
			v4ToastManager.showError('Failed to generate SAML assertion');
		}
	}, [clientId, tokenEndpoint, identityProvider, samlAssertion]);

	// Save SAML configuration using service
	const saveSAMLConfiguration = useCallback(async () => {
		const config = {
			clientId,
			tokenEndpoint,
			identityProvider,
			scopes: '',
			samlAssertion
		};
		
		try {
			await SAMLAssertionService.saveConfiguration(config);
		} catch (error) {
			console.error('[SAML Bearer] Error saving configuration:', error);
		}
	}, [clientId, tokenEndpoint, identityProvider, samlAssertion]);

	// Load SAML configuration using service
	const loadSAMLConfiguration = useCallback(() => {
		try {
			const config = SAMLAssertionService.loadConfiguration();
			if (config) {
				setClientId(config.clientId || '');
				setTokenEndpoint(config.tokenEndpoint || '');
				setIdentityProvider(config.identityProvider || '');
				if (config.samlAssertion) {
					setSamlAssertion({
						...config.samlAssertion,
						attributes: normalizeAttributes(config.samlAssertion.attributes)
					});
				} else {
					setSamlAssertion({
						issuer: '',
						subject: '',
						audience: '',
						conditions: {
							notBefore: '',
							notOnOrAfter: ''
						},
						attributes: {}
					});
				}
				v4ToastManager.showSuccess('SAML configuration loaded from saved settings');
			}
		} catch (error) {
			console.error('[SAML Bearer] Error loading configuration:', error);
		}
	}, [normalizeAttributes]);

	// Load comprehensive credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			try {
				// Load from comprehensive credential system first
				const comprehensiveCredentials = credentialManager.getAllCredentials();
				
				if (comprehensiveCredentials?.environmentId) {
					console.log('[SAML Bearer] Loading credentials from comprehensive system:', comprehensiveCredentials);
					setEnvironmentId(comprehensiveCredentials.environmentId);
					setClientId(comprehensiveCredentials.clientId || '');
					console.log('[SAML Bearer] Comprehensive credentials loaded for mock flow.');
					
					// Auto-populate token endpoint from environment ID
					const tokenEndpointUrl = `https://auth.pingone.com/${comprehensiveCredentials.environmentId}/as/token`;
					setTokenEndpoint(tokenEndpointUrl);
					console.log('[SAML Bearer] Token endpoint auto-populated from credentials:', tokenEndpointUrl);
				}
				
				// Then load SAML-specific configuration (will override if exists)
				loadSAMLConfiguration();
			} catch (error) {
				console.error('[SAML Bearer] Error loading credentials:', error);
				// Fallback to SAML-specific configuration only
				loadSAMLConfiguration();
			}
		};
		
		loadCredentials();
	}, [loadSAMLConfiguration]);

	// Make token request
	const makeTokenRequest = useCallback(async () => {
		if (!generatedSAML || !clientId || !tokenEndpoint) {
			v4ToastManager.showWarning('Please generate a SAML assertion first');
			return;
		}

		setIsLoading(true);
		try {
			// MOCK IMPLEMENTATION - Simulating network delay
			console.log('[SAML Bearer Mock] Simulating token request...');
			await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

			// MOCK IMPLEMENTATION - Generate mock token response
			const mockTokenResponse = {
				access_token: 'mock_saml_bearer_token_' + Math.random().toString(36).substr(2, 32),
				token_type: 'Bearer',
				expires_in: 3600,
				_mock: true, // Indicator that this is a mock response
				_note: 'This is a simulated response for educational purposes. PingOne does not support SAML Bearer assertions.'
			};

			console.log('[SAML Bearer Mock] Mock token response:', mockTokenResponse);
			setTokenResponse(mockTokenResponse);
			v4ToastManager.showSuccess('Mock access token generated successfully! (Educational simulation)');
		} catch (error) {
			console.error('[SAML Bearer Mock] Error in simulation:', error);
			v4ToastManager.showError('Failed to simulate token request');
		} finally {
			setIsLoading(false);
		}
	}, [generatedSAML, clientId, tokenEndpoint]);

	// Step content renderers
	const renderCredentials = () => (
		<>
			<CollapsibleHeader
				title="SAML Bearer Configuration"
				icon={<FiSettings />}
				defaultCollapsed={collapsedSections.credentials}
				showArrow={true}
			>
				<FormGroup>
					<Label>Environment ID *</Label>
					<Input
						type="text"
						value={environmentId}
						onChange={(e) => setEnvironmentId(e.target.value)}
						placeholder="Enter PingOne Environment ID (e.g., 12345678-1234-1234-1234-123456789abc)"
					/>
					<Helper>
						The Environment ID will be used to auto-populate the Token Endpoint, SAML Issuer, and Audience via OIDC Discovery.
					</Helper>
				</FormGroup>

				<FormGroup>
					<Label>Client ID *</Label>
					<Input
						type="text"
						value={clientId}
						onChange={(e) => setClientId(e.target.value)}
						placeholder="your-client-id"
					/>
				</FormGroup>

				<FormGroup>
					<Label>Token Endpoint *</Label>
					<Input
						type="url"
						value={tokenEndpoint}
						onChange={(e) => setTokenEndpoint(e.target.value)}
						placeholder="https://auth.example.com/oauth/token"
					/>
				</FormGroup>

				<FormGroup>
					<Label>Identity Provider Entity ID</Label>
					<Input
						type="url"
						value={identityProvider}
						onChange={(e) => setIdentityProvider(e.target.value)}
						placeholder="https://idp.example.com/metadata"
					/>
				</FormGroup>
			</CollapsibleHeader>
		</>
	);

	const renderSAMLBuilder = () => (
		<>
			<CollapsibleHeader
				title="SAML Assertion Builder"
				icon={<FiSettings />}
				defaultCollapsed={collapsedSections.samlBuilder}
				showArrow={true}
			>
				<InfoBox $variant="info">
					<FiInfo size={20} />
					<div>
						<InfoTitle>SAML Assertion Configuration</InfoTitle>
						<InfoText>
							Configure the SAML assertion that will be used as a client assertion
							in the token request. This represents the user's identity from the identity provider.
						</InfoText>
					</div>
				</InfoBox>

				<FormGroup>
					<Label>Issuer (Identity Provider) *</Label>
					<Input
						type="text"
						value={samlAssertion.issuer}
						onChange={(e) => setSamlAssertion(prev => ({ ...prev, issuer: e.target.value }))}
						placeholder="https://idp.example.com"
					/>
				</FormGroup>

				<FormGroup>
					<Label>Subject (User Identity) *</Label>
					<Input
						type="text"
						value={samlAssertion.subject}
						onChange={(e) => setSamlAssertion(prev => ({ ...prev, subject: e.target.value }))}
						placeholder="user@example.com"
					/>
				</FormGroup>

				<FormGroup>
					<Label>Audience (Token Endpoint) *</Label>
					<Input
						type="text"
						value={samlAssertion.audience}
						onChange={(e) => setSamlAssertion(prev => ({ ...prev, audience: e.target.value }))}
						placeholder="https://auth.example.com/oauth/token"
					/>
				</FormGroup>

				<FormGroup>
					<Label>Not Before</Label>
					<Input
						type="datetime-local"
						value={samlAssertion.conditions.notBefore.slice(0, 16)}
						onChange={(e) => setSamlAssertion(prev => ({ 
							...prev, 
							conditions: { ...prev.conditions, notBefore: new Date(e.target.value).toISOString() }
						}))}
					/>
				</FormGroup>

				<FormGroup>
					<Label>Not On Or After</Label>
					<Input
						type="datetime-local"
						value={samlAssertion.conditions.notOnOrAfter.slice(0, 16)}
						onChange={(e) => setSamlAssertion(prev => ({ 
							...prev, 
							conditions: { ...prev.conditions, notOnOrAfter: new Date(e.target.value).toISOString() }
						}))}
					/>
				</FormGroup>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
					<div style={{ display: 'flex', gap: '1rem' }}>
						<Button onClick={saveSAMLConfiguration} $variant="secondary">
							<FiSettings /> Save Configuration
						</Button>
						<Button 
							onClick={generateSAMLAssertion} 
							$variant="primary"
							disabled={!canGenerateSAML()}
							style={{ 
								opacity: !canGenerateSAML() ? 0.5 : 1,
								cursor: !canGenerateSAML() ? 'not-allowed' : 'pointer'
							}}
						>
							<FiUsers /> Generate SAML Assertion
						</Button>
					</div>
					{!canGenerateSAML() && (
						<div style={{ 
							fontSize: '0.875rem', 
							color: '#f59e0b', 
							display: 'flex', 
							flexDirection: 'column',
							gap: '0.5rem' 
						}}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
								<FiAlertTriangle size={16} />
								Missing required fields:
							</div>
							<ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
								{!clientId.trim() && <li>Client ID (in Credentials section above)</li>}
								{!tokenEndpoint.trim() && <li>Token Endpoint (in Credentials section above)</li>}
								{!samlAssertion.issuer.trim() && <li>Issuer (Identity Provider)</li>}
								{!samlAssertion.subject.trim() && <li>Subject (User Identity)</li>}
								{!samlAssertion.audience.trim() && <li>Audience (Token Endpoint)</li>}
							</ul>
						</div>
					)}
				</div>
			</CollapsibleHeader>

			{generatedSAML && (
				<CollapsibleHeader
					title="✅ Generated SAML Assertion"
					icon={<FiCheckCircle />}
					theme="green"
					defaultCollapsed={collapsedSections.generatedSAML}
					showArrow={true}
				>
					<GeneratedContentBox>
						{/* SAML Assertion Display */}
						<div style={{ marginBottom: '1.5rem' }}>
							<ParameterLabel>SAML Assertion (XML)</ParameterLabel>
							<div style={{
								background: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '0.5rem',
								padding: '1rem',
								marginTop: '0.5rem',
								position: 'relative'
							}}>
								<pre style={{
									color: '#111827',
									fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
									fontSize: '0.875rem',
									lineHeight: '1.5',
									margin: 0,
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									maxHeight: '400px',
									overflowY: 'auto'
								}}>
									{generatedSAML}
								</pre>
								<div style={{
									position: 'absolute',
									top: '0.5rem',
									right: '0.5rem',
									display: 'flex',
									gap: '0.5rem'
								}}>
									<Button 
										onClick={() => copyToClipboard(generatedSAML, 'SAML XML assertion')} 
										$variant="secondary"
										style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
										disabled={!generatedSAML}
									>
										<FiCopy /> Copy XML
									</Button>
								</div>
							</div>
						</div>

						{/* Base64 Encoded SAML */}
						<div style={{ marginBottom: '1.5rem' }}>
							<ParameterLabel>SAML Assertion (Base64 Encoded)</ParameterLabel>
							<div style={{
								background: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '0.5rem',
								padding: '1rem',
								marginTop: '0.5rem',
								position: 'relative'
							}}>
								<pre style={{
									color: '#475569',
									fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
									fontSize: '0.75rem',
									lineHeight: '1.4',
									margin: 0,
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-all',
									maxHeight: '200px',
									overflowY: 'auto'
								}}>
									{base64SAML}
								</pre>
								<div style={{
									position: 'absolute',
									top: '0.5rem',
									right: '0.5rem'
								}}>
									<Button 
										onClick={() => copyToClipboard(base64SAML, 'Base64 SAML assertion')} 
										$variant="secondary"
										style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
										disabled={!base64SAML}
									>
										<FiCopy /> Copy Base64
									</Button>
								</div>
							</div>
							{showDecodedSAML && decodedSAMLFromBase64 && (
								<div style={{
									marginTop: '1rem',
									background: '#fff7ed',
									border: '1px solid #fed7aa',
									borderRadius: '0.5rem',
									padding: '1rem'
								}}>
									<ParameterLabel>Decoded Assertion (Preview)</ParameterLabel>
									<pre style={{
										color: '#7c2d12',
										fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
										fontSize: '0.75rem',
										lineHeight: '1.4',
										margin: '0.5rem 0 0',
										whiteSpace: 'pre-wrap',
										wordBreak: 'break-word'
									}}>
										{decodedSAMLFromBase64}
									</pre>
								</div>
							)}
						</div>

						{/* Action Buttons */}
						<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
							<Button onClick={() => copyToClipboard(generatedSAML, 'SAML XML assertion')} $variant="secondary" disabled={!generatedSAML}>
								<FiCopy /> Copy XML SAML
							</Button>
							<Button onClick={() => copyToClipboard(base64SAML, 'Base64 SAML assertion')} $variant="secondary" disabled={!base64SAML}>
								<FiCopy /> Copy Base64 SAML
							</Button>
							<Button 
								onClick={() => {
									const formatted = SAMLAssertionService.formatSAMLForDisplay(generatedSAML);
									console.log('[SAML Bearer] Formatted SAML:', formatted);
									v4ToastManager.showSuccess('SAML assertion formatted for display');
								}} 
								$variant="secondary"
							>
								<FiSettings /> Format Display
							</Button>
							<Button 
								onClick={() => setShowDecodedSAML(prev => !prev)} 
								$variant="secondary"
								disabled={!base64SAML}
							>
								{showDecodedSAML ? <FiEyeOff /> : <FiEye />} {showDecodedSAML ? 'Hide Decode' : 'Decode Base64'}
							</Button>
						</div>
					</GeneratedContentBox>
				</CollapsibleHeader>
			)}
		</>
	);

	const renderTokenRequest = () => (
		<>
			<CollapsibleHeader
				title="Token Request"
				icon={<FiSend />}
				theme="blue"
				defaultCollapsed={collapsedSections.tokenRequest}
				showArrow={true}
			>
				<InfoBox $variant="warning">
					<FiAlertTriangle size={20} />
					<div>
						<InfoTitle>🎓 Mock SAML Bearer Token Request</InfoTitle>
						<InfoText>
							The SAML Bearer Assertion flow enables OAuth clients to authenticate using SAML assertions from an identity provider. This is commonly used in enterprise environments where SAML-based SSO is already established.
						</InfoText>
						<InfoText style={{ marginTop: '0.5rem' }}>
							<strong>Note:</strong> PingOne does not support SAML Bearer assertions, so this is a simulated request for learning purposes.
						</InfoText>
					</div>
				</InfoBox>

				<GeneratedContentBox>
					<ParameterGrid>
						<ParameterLabel>Request URL</ParameterLabel>
						<ParameterValue>{tokenEndpoint}</ParameterValue>
						
						<ParameterLabel>Method</ParameterLabel>
						<ParameterValue>POST</ParameterValue>
						
						<ParameterLabel>Content-Type</ParameterLabel>
						<ParameterValue>application/x-www-form-urlencoded</ParameterValue>
						
						<ParameterLabel>grant_type</ParameterLabel>
						<ParameterValue>urn:ietf:params:oauth:grant-type:saml2-bearer</ParameterValue>
						
						<ParameterLabel>assertion</ParameterLabel>
						<ParameterValue style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
							{base64SAML || 'Generate SAML assertion first'}
						</ParameterValue>
					</ParameterGrid>
				</GeneratedContentBox>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
					<Button 
						onClick={makeTokenRequest} 
						$variant="primary" 
						disabled={!generatedSAML || isLoading}
						style={{ 
							opacity: !generatedSAML ? 0.5 : 1,
							cursor: !generatedSAML ? 'not-allowed' : 'pointer'
						}}
					>
						{isLoading ? <FiRefreshCw className="animate-spin" /> : <FiGlobe />}
						{isLoading ? 'Requesting Token...' : 'Make Token Request'}
					</Button>
					{!generatedSAML && (
						<div style={{ 
							fontSize: '0.875rem', 
							color: '#f59e0b', 
							display: 'flex', 
							alignItems: 'center', 
							gap: '0.25rem' 
						}}>
							<FiAlertTriangle size={16} />
							Generate a SAML assertion first to enable token request
						</div>
					)}
				</div>
			</CollapsibleHeader>
		</>
	);

	const renderTokenResponse = () => (
		<>
			{tokenResponse && (
				<CollapsibleHeader
					title="Token Response"
					icon={<FiPackage />}
					defaultCollapsed={collapsedSections.tokenResponse}
					showArrow={true}
				>
					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>Access Token Received!</InfoTitle>
							<InfoText>
								The SAML Bearer Assertion flow has completed successfully. You now have an access token
								that can be used to access protected resources.
							</InfoText>
						</div>
					</InfoBox>

					<GeneratedContentBox>
						<ParameterGrid>
							<ParameterLabel>access_token</ParameterLabel>
							<ParameterValue style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
								{tokenResponse.access_token}
							</ParameterValue>
							
							<ParameterLabel>token_type</ParameterLabel>
							<ParameterValue>{tokenResponse.token_type}</ParameterValue>
							
							<ParameterLabel>expires_in</ParameterLabel>
							<ParameterValue>{tokenResponse.expires_in} seconds</ParameterValue>
						</ParameterGrid>
					</GeneratedContentBox>

					<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
						<Button 
							onClick={() => copyToClipboard(tokenResponse.access_token, 'access token')} 
							$variant="secondary"
							disabled={!tokenResponse?.access_token}
						>
							<FiCopy /> Copy Access Token
						</Button>
						<Button 
							onClick={() => copyToClipboard(JSON.stringify(tokenResponse, null, 2), 'token response JSON')} 
							$variant="secondary"
							disabled={!tokenResponse}
						>
							<FiCopy /> Copy Full Response
						</Button>
					</div>
				</CollapsibleHeader>
			)}
		</>
	);

	const renderCompletion = () => (
		<FlowCompletionService
			config={{
				...completionConfig,
				onStartNewFlow: () => {
					setCollapsedSections(prev => ({
						...prev,
						tokenResponse: true,
						completion: false
					}));
					setGeneratedSAML('');
					setTokenResponse(null);
					setShowDecodedSAML(false);
				}
			}}
			collapsed={collapsedSections.completion}
			onToggleCollapsed={() => toggleSection('completion')}
		/>
	);

	// Main render
	return (
		<Container>
			<FlowHeader flowId="saml-bearer" />
			<ContentWrapper>
				{renderCredentials()}
				<SectionDivider />

				{renderSAMLBuilder()}
				<SectionDivider />

				{renderTokenRequest()}
				<SectionDivider />

				{renderTokenResponse()}

				{tokenResponse && (
					<>
						<SectionDivider />
						{renderCompletion()}
					</>
				)}
			</ContentWrapper>
		</Container>
	);
};

export default SAMLBearerAssertionFlowV7;
