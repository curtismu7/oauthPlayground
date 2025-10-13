// src/pages/flows/SAMLBearerAssertionFlowV6.tsx
// OAuth 2.0 SAML Bearer Assertion Flow (RFC 7522)

import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiPackage,
	FiRefreshCw,
	FiSend,
	FiSettings,
	FiShield,
	FiCode,
	FiClock,
	FiEye,
	FiEyeOff,
	FiUsers,
} from 'react-icons/fi';
import { usePageScroll } from '../../hooks/usePageScroll';
import { FlowHeader } from '../../services/flowHeaderService';
import { UISettingsService } from '../../services/uiSettingsService';
import { FlowSequenceDisplay } from '../../components/FlowSequenceDisplay';
import EducationalContentService from '../../services/educationalContentService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { CopyButtonService } from '../../services/copyButtonService';
import { OAuthFlowComparisonService } from '../../services/oauthFlowComparisonService';
import SAMLAssertionService from '../../services/samlAssertionService';
import SAMLIssuerService from '../../services/samlIssuerService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';

const LOG_PREFIX = '[🏢 SAML-BEARER-V6]';

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

const InfoList = styled.ul`
	margin: 0.5rem 0;
	padding-left: 1.5rem;
	
	li {
		margin-bottom: 0.5rem;
		
		&:last-child {
			margin-bottom: 0;
		}
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

const Textarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	min-height: 120px;
	resize: vertical;
	transition: border-color 0.2s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
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

const CodeBlock = styled.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
	margin: 1rem 0;
	border: 1px solid #334155;
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
	attributes: Record<string, string[]>;
}

// Educational Content
const SAMLBearerEducationalContent = {
	overview: {
		title: 'OAuth 2.0 SAML Bearer Assertion Flow (RFC 7522)',
		description: 'The SAML Bearer Assertion flow enables OAuth clients to authenticate using SAML assertions from an identity provider. This is commonly used in enterprise environments where SAML-based SSO is already established.',
		useCases: [
			'Enterprise SSO integration',
			'Federation with identity providers',
			'Legacy system integration',
			'Cross-domain authentication',
			'Corporate identity management'
		]
	},
	security: {
		title: 'Security Considerations',
		description: 'SAML Bearer Assertion flow provides enterprise-grade security through XML digital signatures and established trust relationships.',
		features: [
			'XML digital signatures prevent tampering',
			'Trust relationships with identity providers',
			'Attribute-based authorization',
			'Configurable assertion lifetime',
			'Enterprise-grade audit trails'
		]
	},
	implementation: {
		title: 'Implementation Steps',
		description: 'The SAML Bearer Assertion flow involves obtaining a SAML assertion from an identity provider and exchanging it for an access token.',
		steps: [
			'Obtain SAML assertion from identity provider',
			'Verify SAML assertion signature and validity',
			'Make token request with SAML assertion',
			'Receive access token for API access'
		]
	}
};

// Main Component
const SAMLBearerAssertionFlowV6: React.FC = () => {
	// Scroll management
	usePageScroll();

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		comparison: false,
		overview: false,
		security: false,
		implementation: false,
		credentials: false,
		samlBuilder: false,
		tokenRequest: false,
		tokenResponse: false,
		completion: false
	});

	// SAML Configuration
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [tokenEndpoint, setTokenEndpoint] = useState('');
	const [identityProvider, setIdentityProvider] = useState('');
	const [scopes, setScopes] = useState('');

	// SAML Assertion
	const [samlAssertion, setSamlAssertion] = useState<SAMLAssertion>(SAMLAssertionService.getDefaultSAMLAssertion());

	// Generated SAML Assertion
	const [generatedSAML, setGeneratedSAML] = useState('');
	const [tokenResponse, setTokenResponse] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);

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
			if (!environmentId || environmentId.length < 32) {
				// Not a valid PingOne environment ID yet
				return;
			}

			try {
				console.log('[SAML Bearer] Fetching OIDC Discovery for environment:', environmentId);
				
				// Construct issuer URL from environment ID
				const issuerUrl = `https://auth.pingone.com/${environmentId}/as`;
				
				const result = await oidcDiscoveryService.discover({ issuerUrl });
				
		if (result.success && result.document) {
			console.log('[SAML Bearer] OIDC Discovery successful:', result.document);
			
			// Auto-populate Token Endpoint (always update from discovery)
			if (result.document.token_endpoint) {
				setTokenEndpoint(result.document.token_endpoint);
				console.log('[SAML Bearer] Token endpoint auto-populated:', result.document.token_endpoint);
			}
			
			// Auto-populate SAML Assertion fields from OIDC Discovery (always update from discovery)
			if (result.document.issuer) {
				setSamlAssertion(prev => ({
					...prev,
					issuer: result.document.issuer,
					audience: result.document.issuer
				}));
				console.log('[SAML Bearer] Issuer and Audience auto-populated:', result.document.issuer);
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
			scopes,
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
	}, [clientId, tokenEndpoint, identityProvider, scopes, samlAssertion]);

	// Save SAML configuration using service
	const saveSAMLConfiguration = useCallback(async () => {
		const config = {
			clientId,
			tokenEndpoint,
			identityProvider,
			scopes,
			samlAssertion
		};
		
		try {
			await SAMLAssertionService.saveConfiguration(config);
		} catch (error) {
			console.error('[SAML Bearer] Error saving configuration:', error);
		}
	}, [clientId, tokenEndpoint, identityProvider, scopes, samlAssertion]);

	// Load SAML configuration using service
	const loadSAMLConfiguration = useCallback(() => {
		try {
			const config = SAMLAssertionService.loadConfiguration();
			if (config) {
				setClientId(config.clientId || '');
				setTokenEndpoint(config.tokenEndpoint || '');
				setIdentityProvider(config.identityProvider || '');
				setScopes(config.scopes || '');
				setSamlAssertion(config.samlAssertion || SAMLAssertionService.getDefaultSAMLAssertion());
				v4ToastManager.showInfo('SAML configuration loaded from saved settings');
			}
		} catch (error) {
			console.error('[SAML Bearer] Error loading configuration:', error);
		}
	}, []);

	// Load configuration on mount
	useEffect(() => {
		loadSAMLConfiguration();
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
				scope: scopes || 'read write',
				_mock: true, // Indicator that this is a mock response
				_note: 'This is a simulated response for educational purposes. PingOne does not support SAML Bearer assertions.'
			};

			console.log('[SAML Bearer Mock] Mock token response:', mockTokenResponse);
			setTokenResponse(mockTokenResponse);
			setCurrentStep(3); // Move to token response step
			v4ToastManager.showSuccess('Mock access token generated successfully! (Educational simulation)');
		} catch (error) {
			console.error('[SAML Bearer Mock] Error in simulation:', error);
			v4ToastManager.showError('Failed to simulate token request');
		} finally {
			setIsLoading(false);
		}
	}, [generatedSAML, clientId, tokenEndpoint, scopes]);

	// Step content renderers
	const renderCredentials = () => (
		<>
			<EducationalContentService
				title="SAML Bearer Configuration"
				content={{
					title: 'Configure SAML Bearer Authentication',
					description: 'Set up the required credentials and endpoints for SAML Bearer Assertion flow.',
					useCases: [
						'Client ID: Your OAuth client identifier',
						'Token Endpoint: OAuth server token endpoint URL',
						'Identity Provider: SAML identity provider URL',
						'Scopes: Requested permissions (optional)'
					]
				}}
				collapsed={collapsedSections.credentials}
				onToggleCollapsed={() => toggleSection('credentials')}
				flowType="saml-bearer"
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
					<Label>Identity Provider URL</Label>
					<Input
						type="url"
						value={identityProvider}
						onChange={(e) => setIdentityProvider(e.target.value)}
						placeholder="https://idp.example.com/sso"
					/>
				</FormGroup>

				<FormGroup>
					<Label>Scopes (Optional)</Label>
					<Input
						type="text"
						value={scopes}
						onChange={(e) => setScopes(e.target.value)}
						placeholder="read write admin"
					/>
				</FormGroup>
			</EducationalContentService>
		</>
	);

	const renderSAMLBuilder = () => (
		<>
			<CollapsibleHeader
				title="SAML Assertion Builder"
				icon={<FiSettings />}
				theme="orange"
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

						<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
							<Button onClick={saveSAMLConfiguration} $variant="secondary">
								<FiSettings /> Save Configuration
							</Button>
							<Button 
								onClick={generateSAMLAssertion} 
								$variant="primary"
								disabled={!canGenerateSAML()}
							>
								<FiUsers /> Generate SAML Assertion
							</Button>
						</div>
			</CollapsibleHeader>

			{generatedSAML && (
				<CollapsibleHeader
					title="Generated SAML Assertion"
					icon={<FiPackage />}
					defaultCollapsed={collapsedSections.generatedSAML}
					showArrow={true}
				>
							<GeneratedContentBox>
								{/* SAML Assertion Display */}
								<div style={{ marginBottom: '1.5rem' }}>
									<ParameterLabel>SAML Assertion (XML)</ParameterLabel>
									<div style={{
										background: '#1e293b',
										border: '1px solid #334155',
										borderRadius: '0.5rem',
										padding: '1rem',
										marginTop: '0.5rem',
										position: 'relative'
									}}>
										<pre style={{
											color: '#e2e8f0',
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
												onClick={() => CopyButtonService.copyToClipboard(generatedSAML)} 
												$variant="secondary"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
											{btoa(generatedSAML)}
										</pre>
										<div style={{
											position: 'absolute',
											top: '0.5rem',
											right: '0.5rem'
										}}>
											<Button 
												onClick={() => CopyButtonService.copyToClipboard(btoa(generatedSAML))} 
												$variant="secondary"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
											>
												<FiCopy /> Copy Base64
											</Button>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
									<Button onClick={() => CopyButtonService.copyToClipboard(generatedSAML)} $variant="secondary">
										<FiCopy /> Copy XML SAML
									</Button>
									<Button onClick={() => CopyButtonService.copyToClipboard(btoa(generatedSAML))} $variant="secondary">
										<FiCopy /> Copy Base64 SAML
									</Button>
									<Button 
										onClick={() => {
											const formatted = SAMLAssertionService.formatSAMLForDisplay(generatedSAML);
											console.log('[SAML Bearer] Formatted SAML:', formatted);
											v4ToastManager.showInfo('SAML assertion formatted for display');
										}} 
										$variant="secondary"
									>
										<FiSettings /> Format Display
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
									<strong>Educational Simulation:</strong> This demonstrates how a SAML Bearer token request 
									would be sent to an OAuth 2.0 server that supports RFC 7522. The assertion parameter 
									contains the Base64-encoded SAML assertion that proves the user's identity.
								</InfoText>
								<InfoText style={{ marginTop: '0.5rem' }}>
									<strong>Note:</strong> PingOne does not support SAML Bearer assertions, so this is a 
									simulated request for learning purposes.
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
									{generatedSAML ? btoa(generatedSAML) : 'Generate SAML assertion first'}
								</ParameterValue>
								
								<ParameterLabel>scope</ParameterLabel>
								<ParameterValue>{scopes || 'Not specified'}</ParameterValue>
							</ParameterGrid>
						</GeneratedContentBox>

						<Button 
							onClick={makeTokenRequest} 
							$variant="primary" 
							disabled={!generatedSAML || isLoading}
						>
						{isLoading ? <FiRefreshCw className="animate-spin" /> : <FiGlobe />}
						{isLoading ? 'Requesting Token...' : 'Make Token Request'}
					</Button>
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
									
									<ParameterLabel>scope</ParameterLabel>
									<ParameterValue>{tokenResponse.scope}</ParameterValue>
								</ParameterGrid>
							</GeneratedContentBox>

							<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
								<Button 
									onClick={() => CopyButtonService.copyToClipboard(tokenResponse.access_token)} 
									$variant="secondary"
								>
									<FiCopy /> Copy Access Token
								</Button>
								<Button 
									onClick={() => CopyButtonService.copyToClipboard(JSON.stringify(tokenResponse, null, 2))} 
									$variant="secondary"
								>
									<FiCopy /> Copy Full Response
							</Button>
						</div>
				</CollapsibleHeader>
			)}
		</>
	);

	const renderCompletion = () => (
		<>
			<FlowCompletionService
				config={FlowCompletionConfigs.samlBearer}
				collapsed={collapsedSections.completion}
				onToggleCollapsed={() => toggleSection('completion')}
			/>
		</>
	);

	// Main render
	return (
		<Container>
			<FlowHeader
				title="OAuth 2.0 SAML Bearer Assertion Flow (Mock)"
				subtitle="RFC 7522 - Enterprise SSO Integration with SAML Assertions"
				flowType="saml-bearer"
			/>

			<ContentWrapper>
				{/* Flow Sequence Diagram */}
				<FlowSequenceDisplay flowType="saml-bearer" />
				
				<SectionDivider />

				{/* Mock Implementation Warning */}
				<InfoBox $variant="warning" style={{ marginBottom: '2rem' }}>
					<FiAlertTriangle size={24} />
					<div>
						<InfoTitle>🎓 Educational Mock Implementation</InfoTitle>
						<InfoText>
							This is a <strong>mock/educational implementation</strong> of the SAML Bearer Assertion flow. 
							PingOne does not currently support SAML Bearer assertions for client authentication.
						</InfoText>
						<InfoText style={{ marginTop: '0.5rem' }}>
							<strong>What you'll learn:</strong>
						</InfoText>
						<InfoList>
							<li>How SAML Bearer Assertion flow works (RFC 7522)</li>
							<li>SAML assertion structure and XML format</li>
							<li>Identity provider integration patterns</li>
							<li>Enterprise SSO and federation concepts</li>
							<li>Assertion lifecycle and validity conditions</li>
						</InfoList>
						<InfoText style={{ marginTop: '0.5rem' }}>
							This flow demonstrates the concepts and provides a simulation of how SAML Bearer 
							authentication would work in production OAuth 2.0 servers that support this grant type.
						</InfoText>
					</div>
				</InfoBox>

				{/* UI Settings */}
				{UISettingsService.getFlowSpecificSettingsPanel('saml-bearer')}

				<SectionDivider />

			{/* Flow Comparison Table */}
			{OAuthFlowComparisonService.getComparisonTable({
				highlightFlow: 'saml',
				collapsed: collapsedSections.comparison
			})}

				<SectionDivider />

				{/* Educational Content */}
				<EducationalContentService
					title="SAML Bearer Assertion Flow Overview"
					content={SAMLBearerEducationalContent.overview}
					collapsed={collapsedSections.overview}
					onToggleCollapsed={() => toggleSection('overview')}
					flowType="saml-bearer"
				/>

				<SectionDivider />

				<EducationalContentService
					title="Security Considerations"
					content={SAMLBearerEducationalContent.security}
					collapsed={collapsedSections.security}
					onToggleCollapsed={() => toggleSection('security')}
					flowType="saml-bearer"
				/>

				<SectionDivider />

				<EducationalContentService
					title="Implementation Steps"
					content={SAMLBearerEducationalContent.implementation}
					collapsed={collapsedSections.implementation}
					onToggleCollapsed={() => toggleSection('implementation')}
					flowType="saml-bearer"
				/>

				<SectionDivider />

				{/* Step Content - Show all steps for mock flow */}
				{renderCredentials()}
				<SectionDivider />
				
				{renderSAMLBuilder()}
				<SectionDivider />
				
				{renderTokenRequest()}
				
				{tokenResponse && (
					<>
						<SectionDivider />
						{renderTokenResponse()}
					</>
				)}
				
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

export default SAMLBearerAssertionFlowV6;
