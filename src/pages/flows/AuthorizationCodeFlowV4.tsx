// src/pages/flows/AuthorizationCodeFlowV4.tsx - Complete Educational Authorization Code Flow V4

import { useState, useEffect } from "react";
import styled from "styled-components";
import { 
	FiChevronLeft, 
	FiChevronRight, 
	FiSettings, 
	FiLoader, 
	FiBook, 
	FiCopy, 
	FiExternalLink,
	FiCheckCircle
} from "react-icons/fi";
import { generateCodeVerifier, generateCodeChallenge } from "../../utils/oauth";
import { showGlobalSuccess, showGlobalError, showGlobalWarning } from "../../hooks/useNotifications";

// Styled Components
const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const HeaderSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const MainTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #4b5563;
	max-width: 42rem;
	margin: 0 auto;
`;

const MainCard = styled.div`
	background-color: white;
	padding: 2rem;
	border-radius: 0.75rem;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	border: 1px solid #e5e7eb;
	margin-bottom: 2rem;
`;

const CardTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1.5rem;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormField = styled.div`
	margin-bottom: 1rem;
`;

const FormLabel = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${props => {
		switch (props.size) {
			case 'sm': return '0.5rem 1rem';
			case 'lg': return '0.75rem 2rem';
			default: return '0.75rem 1.5rem';
		}
	}};
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: ${props => props.size === 'lg' ? '1.125rem' : '1rem'};
	border: none;
	cursor: pointer;
	transition: all 0.2s;
	margin: 0 auto;
	
	${props => {
		if (props.disabled) {
			return `
				background-color: #9ca3af;
				color: white;
				cursor: not-allowed;
			`;
		}
		
		switch (props.variant) {
			case 'secondary':
				return `
					background-color: #4b5563;
					color: white;
					&:hover { background-color: #374151; }
				`;
			case 'success':
				return `
					background-color: #059669;
					color: white;
					&:hover { background-color: #047857; }
				`;
			case 'danger':
				return `
					background-color: #dc2626;
					color: white;
					&:hover { background-color: #b91c1c; }
				`;
			default:
				return `
					background-color: #2563eb;
					color: white;
					&:hover { background-color: #1d4ed8; }
				`;
		}
	}}
`;

const StepNavigation = styled.div`
	position: fixed;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	background: white;
	border-radius: 50px;
	padding: 1rem 2rem;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	display: flex;
	gap: 1rem;
	align-items: center;
	z-index: 1000;
`;

const StepIndicator = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
`;

const StepDot = styled.button<{ $active?: boolean; $completed?: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	transition: all 0.3s ease;
	background: #e5e7eb;

	${props => {
		if (props.$active) {
			return `
				background: #3b82f6;
				transform: scale(1.2);
			`;
		} else if (props.$completed) {
			return `
				background: #10b981;
			`;
		}
		return '';
	}}

	&:hover {
		transform: scale(1.1);
	}
`;

const NavigationButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const NavButton = styled.button<{ variant?: 'primary' | 'secondary'; disabled?: boolean }>`
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	border: none;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	
	${props => {
		if (props.disabled) {
			return `
				background-color: #e5e7eb;
				color: #9ca3af;
				cursor: not-allowed;
			`;
		}
		
		if (props.variant === 'primary') {
			return `
				background-color: #3b82f6;
				color: white;
				&:hover { background-color: #2563eb; }
			`;
		} else {
			return `
				background-color: #d1d5db;
				color: #374151;
				&:hover { background-color: #9ca3af; }
			`;
		}
	}}
`;

const InfoBox = styled.div<{ type?: 'info' | 'warning' | 'success' | 'error' }>`
	padding: 1.5rem;
	border-radius: 0.5rem;
	border: 1px solid;
	margin-bottom: 1.5rem;
	
	${props => {
		switch (props.type) {
			case 'warning':
				return `
					background-color: #fef3c7;
					border-color: #f59e0b;
					color: #92400e;
				`;
			case 'success':
				return `
					background-color: #d1fae5;
					border-color: #10b981;
					color: #065f46;
				`;
			case 'error':
				return `
					background-color: #fee2e2;
					border-color: #ef4444;
					color: #991b1b;
				`;
			default:
				return `
					background-color: #dbeafe;
					border-color: #3b82f6;
					color: #1e40af;
				`;
		}
	}}
`;

const InfoTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
`;

const InfoText = styled.p`
	margin-bottom: 1rem;
`;

const InfoList = styled.ul`
	list-style-type: disc;
	list-style-position: inside;
	
	li {
		margin-bottom: 0.25rem;
	}
`;

const StepTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1.5rem;
`;

const GeneratedContentBox = styled.div`
	background-color: #d1fae5;
	border: 2px solid #10b981;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
	
	&::before {
		content: "✓ Generated";
		position: absolute;
		top: -10px;
		left: 1rem;
		background-color: #10b981;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
	}
`;

const GeneratedUrlDisplay = styled.div`
	background-color: white;
	border: 1px solid #10b981;
	border-radius: 0.375rem;
	padding: 0.75rem;
	font-family: monospace;
	font-size: 0.875rem;
	word-break: break-all;
	margin-top: 1rem;
	color: #065f46;
`;

const Modal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
`;

const ModalContent = styled.div<{ type?: 'info' | 'success' }>`
	background-color: white;
	border-radius: 0.75rem;
	padding: 2rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	max-width: 400px;
	text-align: center;
	border: 3px solid;
	
	${props => {
		if (props.type === 'success') {
			return `
				border-color: #10b981;
				background: linear-gradient(135deg, #d1fae5 0%, #ffffff 100%);
			`;
		} else {
			return `
				border-color: #3b82f6;
				background: linear-gradient(135deg, #dbeafe 0%, #ffffff 100%);
			`;
		}
	}}
`;

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: #111827;
`;

const ModalText = styled.p`
	color: #6b7280;
	margin-bottom: 1.5rem;
	line-height: 1.5;
`;

const ModalIcon = styled.div<{ type?: 'info' | 'success' }>`
	font-size: 3rem;
	margin-bottom: 1rem;
	
	${props => {
		if (props.type === 'success') {
			return `color: #10b981;`;
		} else {
			return `color: #3b82f6;`;
		}
	}}
`;


interface StepCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	authMethod: string;
}

interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

const AuthorizationCodeFlowV4 = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	
	// Form credentials state
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: "b9817c16-9910-4415-b67e-4ac687da74d9",
		clientId: "a4f963ea-0736-456a-be72-b1fa4f63f81f",
		clientSecret: "",
		redirectUri: "https://localhost:3000/authz-callback",
		scopes: "openid profile email",
		authMethod: "client_secret_post"
	});

	// PKCE state
	const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
		codeVerifier: "",
		codeChallenge: "",
		codeChallengeMethod: "S256"
	});

	// Token state
	const [authCode, setAuthCode] = useState("");
	const [tokens, setTokens] = useState<any>(null);
	const [userInfo, setUserInfo] = useState<any>(null);

	// Authorization URL state
	const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);

	// Modal states
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	const totalSteps = 7;

	// Load saved configuration and check for authorization code
	useEffect(() => {
		// Load saved configuration from localStorage
		try {
			const savedConfig = localStorage.getItem('oauth-v4-test-config');
			if (savedConfig) {
				const configData = JSON.parse(savedConfig);
				setCredentials({
					environmentId: configData.environmentId || credentials.environmentId,
					clientId: configData.clientId || credentials.clientId,
					clientSecret: configData.clientSecret || credentials.clientSecret,
					redirectUri: configData.redirectUri || credentials.redirectUri,
					scopes: configData.scopes || credentials.scopes,
					authMethod: configData.authMethod || credentials.authMethod
				});
				showGlobalSuccess("Configuration loaded from previous session");
			}
		} catch (error) {
			console.warn("Failed to load saved configuration:", error);
		}

		// Check for authorization code in URL parameters (when returning from PingOne)
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const error = urlParams.get('error');
		
		if (code) {
			setAuthCode(code);
			// Show success modal
			setShowSuccessModal(true);
			// Auto dismiss modal after 2 seconds
			setTimeout(() => {
				setShowSuccessModal(false);
			}, 2000);
			// Navigate to Step 3 (Authorization Response) to show the captured code
			setCurrentStep(2); // Step 3 is index 2
		} else if (error) {
			showGlobalError(`Authorization failed: ${error}`);
		}
	}, []);

	const handleSaveConfiguration = async () => {
		setIsLoading(true);
		try {
			// Save configuration to localStorage for testing
			const configData = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes,
				authMethod: credentials.authMethod,
				timestamp: new Date().toISOString()
			};
			
			localStorage.setItem('oauth-v4-test-config', JSON.stringify(configData));
			
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			showGlobalSuccess("Configuration saved successfully! (Including client secret for testing)");
		} catch (error) {
			showGlobalError("Failed to save configuration");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClearConfiguration = () => {
		localStorage.removeItem('oauth-v4-test-config');
		setCredentials({
			environmentId: "b9817c16-9910-4415-b67e-4ac687da74d9",
			clientId: "a4f963ea-0736-456a-be72-b1fa4f63f81f",
			clientSecret: "",
			redirectUri: "https://localhost:3000/authz-callback",
			scopes: "openid profile email",
			authMethod: "client_secret_post"
		});
		showGlobalSuccess("Configuration cleared! Ready for production cleanup.");
	};

	const handleResetFlow = () => {
		// Reset all flow state
		setCurrentStep(0);
		setPkceCodes({
			codeVerifier: "",
			codeChallenge: "",
			codeChallengeMethod: "S256"
		});
		setAuthCode("");
		setTokens(null);
		setUserInfo(null);
		setAuthorizationUrl(null);
		setShowRedirectModal(false);
		setShowSuccessModal(false);
		
		// Clear saved configuration
		localStorage.removeItem('oauth-v4-test-config');
		
		// Reset credentials to defaults
		setCredentials({
			environmentId: "b9817c16-9910-4415-b67e-4ac687da74d9",
			clientId: "a4f963ea-0736-456a-be72-b1fa4f63f81f",
			clientSecret: "",
			redirectUri: "https://localhost:3000/authz-callback",
			scopes: "openid profile email",
			authMethod: "client_secret_post"
		});
		
		showGlobalSuccess("Flow reset! Starting fresh from Step 1.");
	};

	const handleGeneratePKCE = async () => {
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			setPkceCodes({
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: "S256"
			});
			showGlobalSuccess("PKCE parameters generated successfully!");
		} catch (error) {
			showGlobalError("Failed to generate PKCE parameters");
		}
	};

	const handleGenerateAuthUrl = () => {
		const params = new URLSearchParams({
			response_type: "code",
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			scope: credentials.scopes,
			state: "random-state-string",
			code_challenge: pkceCodes.codeChallenge,
			code_challenge_method: pkceCodes.codeChallengeMethod
		});
		
		const authUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize?${params.toString()}`;
		setAuthorizationUrl(authUrl);
		showGlobalSuccess("Authorization URL generated successfully!");
	};

	const handleOpenAuthUrl = () => {
		if (authorizationUrl) {
			// Show redirect modal
			setShowRedirectModal(true);
			// Auto dismiss modal after 2 seconds and open URL
			setTimeout(() => {
				setShowRedirectModal(false);
				window.open(authorizationUrl, '_blank');
				// Auto advance to next step after opening URL
				if (currentStep < totalSteps - 1) {
					setCurrentStep(currentStep + 1);
					showGlobalSuccess("Advanced to Step 3: Authorization Response");
				}
			}, 2000);
		} else {
			showGlobalWarning("Please generate the authorization URL first");
		}
	};

	const handleExchangeTokens = async () => {
		if (!authCode) {
			showGlobalWarning("Please enter an authorization code first");
			return;
		}
		
		setIsLoading(true);
		try {
			// Simulate token exchange
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			const mockTokens = {
				access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
				id_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
				refresh_token: "refresh_token_here",
				expires_in: 3600,
				token_type: "Bearer",
				scope: credentials.scopes
			};
			
			setTokens(mockTokens);
			showGlobalSuccess("Tokens exchanged successfully!");
		} catch (error) {
			showGlobalError("Failed to exchange tokens");
		} finally {
			setIsLoading(false);
		}
	};


	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		showGlobalSuccess(`${label} copied to clipboard!`);
	};

	const nextStep = () => {
		if (currentStep < totalSteps - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const goToStep = (step: number) => {
		setCurrentStep(step);
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						{/* Header Section */}
						<HeaderSection>
							<MainTitle>
								Understanding OAuth 2.0 Authorization Code Flow
							</MainTitle>
							<Subtitle>
								Learn about the most secure OAuth 2.0 flow, its implementation details, and how PingOne supports it according to OIDC specifications.
							</Subtitle>
						</HeaderSection>

						{/* Comprehensive Educational Content */}
						<InfoBox type="info">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								What is the Authorization Code Flow?
							</InfoTitle>
							<InfoText>
								The Authorization Code Flow is the most secure OAuth 2.0 flow for web applications. 
								It's designed for applications that can securely store a client secret and can 
								make server-to-server requests. This flow is defined in RFC 6749 (OAuth 2.0) and 
								extended by OpenID Connect Core 1.0 specification.
							</InfoText>
							
							<div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #93c5fd', marginTop: '1rem' }}>
								<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>Key Security Benefits:</h4>
								<InfoList>
									<li><strong>Client Secret Protection:</strong> Never exposed to user agent or browser</li>
									<li><strong>PKCE Support:</strong> Additional security for public clients</li>
									<li><strong>Refresh Tokens:</strong> Long-lived access without re-authentication</li>
									<li><strong>State Parameter:</strong> CSRF attack prevention</li>
									<li><strong>Server-to-Server:</strong> Secure token exchange on backend</li>
								</InfoList>
							</div>
						</InfoBox>

						{/* OIDC Specification Details */}
						<InfoBox type="warning">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								OpenID Connect Authorization Code Flow (OIDC Core 1.0)
							</InfoTitle>
							<InfoText>
								According to the OpenID Connect Core 1.0 specification, the Authorization Code Flow 
								extends OAuth 2.0 to provide authentication in addition to authorization. Key requirements:
							</InfoText>
							
							<div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #f59e0b', marginTop: '1rem' }}>
								<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>OIDC Requirements:</h4>
								<InfoList>
									<li><strong>response_type=code:</strong> Must be used for authorization code flow</li>
									<li><strong>scope=openid:</strong> Required for OpenID Connect flows</li>
									<li><strong>nonce parameter:</strong> Replay attack prevention (recommended)</li>
									<li><strong>ID Token:</strong> JWT containing user identity information</li>
									<li><strong>UserInfo endpoint:</strong> Additional user claims beyond ID token</li>
								</InfoList>
							</div>
						</InfoBox>

						{/* PingOne Implementation Details */}
						<InfoBox type="success">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								PingOne Authorization Code Flow Implementation
							</InfoTitle>
							<InfoText>
								PingOne Identity Platform implements the Authorization Code Flow with full OIDC compliance. 
								Here's how PingOne handles this flow:
							</InfoText>
							
							<div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #10b981', marginTop: '1rem' }}>
								<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#065f46' }}>PingOne Features:</h4>
								<InfoList>
									<li><strong>Environment-based URLs:</strong> auth.pingone.com/[environment-id]/as/authorize</li>
									<li><strong>PKCE Support:</strong> S256 and plain challenge methods supported</li>
									<li><strong>Multiple Client Auth:</strong> client_secret_post, client_secret_basic, private_key_jwt</li>
									<li><strong>Comprehensive Scopes:</strong> openid, profile, email, address, phone, offline_access</li>
									<li><strong>Token Endpoint:</strong> Full OAuth 2.0 and OIDC token response</li>
									<li><strong>UserInfo Endpoint:</strong> Standard OIDC user claims</li>
								</InfoList>
							</div>
						</InfoBox>

						{/* Flow Steps Overview */}
						<MainCard>
							<CardTitle>Authorization Code Flow Steps</CardTitle>
							<div style={{ display: 'grid', gap: '1rem' }}>
								{[
									{
										step: 1,
										title: "Authorization Request",
										description: "Client redirects user to authorization server with response_type=code"
									},
									{
										step: 2,
										title: "User Authentication",
										description: "User authenticates and grants consent to requested scopes"
									},
									{
										step: 3,
										title: "Authorization Response",
										description: "Authorization server redirects back with authorization code"
									},
									{
										step: 4,
										title: "Token Exchange",
										description: "Client exchanges authorization code for access, ID, and refresh tokens"
									},
									{
										step: 5,
										title: "UserInfo Request",
										description: "Optional: Client requests additional user information"
									}
								].map((step) => (
									<div key={step.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
										<div style={{ backgroundColor: '#3b82f6', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', flexShrink: 0 }}>
											{step.step}
										</div>
										<div>
											<h4 style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>{step.title}</h4>
											<p style={{ color: '#6b7280', margin: 0 }}>{step.description}</p>
										</div>
									</div>
								))}
							</div>
						</MainCard>

						{/* Security Best Practices */}
						<InfoBox type="error">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								Security Best Practices
							</InfoTitle>
							<InfoText>
								Critical security considerations for implementing the Authorization Code Flow:
							</InfoText>
							
							<div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #ef4444', marginTop: '1rem' }}>
								<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#991b1b' }}>Security Requirements:</h4>
								<InfoList>
									<li><strong>HTTPS Only:</strong> All communications must use TLS 1.2 or higher</li>
									<li><strong>State Parameter:</strong> Always use random, unguessable state values</li>
									<li><strong>PKCE for Public Clients:</strong> Mandatory for SPAs and mobile apps</li>
									<li><strong>Token Storage:</strong> Store tokens securely, never in localStorage</li>
									<li><strong>Redirect URI Validation:</strong> Exact match required by authorization server</li>
									<li><strong>Token Expiration:</strong> Implement proper token refresh and expiration handling</li>
								</InfoList>
							</div>
						</InfoBox>

						{/* PingOne Application Configuration - Moved to Bottom */}
						<MainCard>
							<CardTitle>
								PingOne Application Configuration
							</CardTitle>
							<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
								Configure your PingOne application settings. This information will be used throughout the flow.
							</p>
							
							<FormGrid>
								{/* Environment ID */}
								<FormField>
									<FormLabel>
										Environment ID
									</FormLabel>
									<FormInput
										type="text"
										value={credentials.environmentId}
										onChange={(e) => setCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
										placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
									/>
								</FormField>

								{/* Client ID */}
								<FormField>
									<FormLabel>
										Client ID
									</FormLabel>
									<FormInput
										type="text"
										value={credentials.clientId}
										onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
										placeholder="a4f963ea-0736-456a-be72-b1fa4f63f81f"
									/>
								</FormField>

								{/* Client Secret */}
								<FormField>
									<FormLabel>
										Client Secret
									</FormLabel>
									<FormInput
										type="password"
										value={credentials.clientSecret}
										onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
										placeholder="Your client secret"
									/>
								</FormField>

								{/* Redirect URI */}
								<FormField>
									<FormLabel>
										Redirect URI
									</FormLabel>
									<FormInput
										type="text"
										value={credentials.redirectUri}
										onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
										placeholder="https://localhost:3000/authz-callback"
									/>
								</FormField>
							</FormGrid>

							{/* Save Configuration Buttons */}
							<div style={{ textAlign: 'center', marginTop: '2rem' }}>
								<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
									<Button
										onClick={handleSaveConfiguration}
										disabled={isLoading}
										variant="primary"
										size="lg"
									>
										{isLoading ? (
											<>
												<FiLoader style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
												Saving...
											</>
										) : (
											<>
												<FiSettings style={{ marginRight: '0.5rem' }} />
												Save Configuration
											</>
										)}
									</Button>
									<Button
										onClick={handleClearConfiguration}
										variant="danger"
										size="lg"
									>
										<FiSettings style={{ marginRight: '0.5rem' }} />
										Clear Configuration
									</Button>
								</div>
								<p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
									Configuration is saved locally for testing. Use "Clear Configuration" before production.
								</p>
							</div>
						</MainCard>
					</div>
				);

			case 1:
				return (
					<div>
						<StepTitle>PKCE Parameters</StepTitle>
						
						<InfoBox type="info">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								What is PKCE?
							</InfoTitle>
							<InfoText>
								PKCE (Proof Key for Code Exchange) is a security extension for OAuth 2.0 that adds 
								an extra layer of security, especially important for public clients like mobile apps 
								and SPAs that cannot securely store a client secret.
							</InfoText>
						</InfoBox>

						<InfoBox type="warning">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								How PKCE Works
							</InfoTitle>
							<InfoText>
								PKCE uses two cryptographic values to secure the authorization code flow:
							</InfoText>
							<InfoList>
								<li><strong>Code Verifier:</strong> A high-entropy random string (43-128 characters) generated by the client</li>
								<li><strong>Code Challenge:</strong> A SHA256 hash of the code verifier, base64url-encoded</li>
								<li><strong>Code Challenge Method:</strong> Always "S256" for SHA256 hashing</li>
							</InfoList>
							<InfoText>
								The client sends the code challenge with the authorization request, then sends the 
								code verifier with the token exchange. The server verifies they match, preventing 
								authorization code interception attacks.
							</InfoText>
						</InfoBox>

						<InfoBox type="success">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								Why Use PKCE?
							</InfoTitle>
							<InfoText>
								PKCE provides critical security benefits for OAuth 2.0 flows:
							</InfoText>
							<InfoList>
								<li><strong>Prevents Code Interception:</strong> Even if an attacker intercepts the authorization code, they can't exchange it for tokens without the code verifier</li>
								<li><strong>No Client Secret Required:</strong> Perfect for mobile apps and SPAs that can't securely store secrets</li>
								<li><strong>RFC 7636 Standard:</strong> Industry-standard security extension recommended by OAuth 2.1</li>
								<li><strong>Mandatory for Public Clients:</strong> Required by OAuth 2.1 for all public clients</li>
							</InfoList>
						</InfoBox>

						{pkceCodes.codeVerifier && pkceCodes.codeChallenge ? (
							<GeneratedContentBox>
								<h4 style={{ fontWeight: '600', marginBottom: '1rem', color: '#065f46' }}>
									Generated PKCE Parameters
								</h4>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
									<div>
										<h5 style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Code Verifier</h5>
										<GeneratedUrlDisplay style={{ fontSize: '0.75rem' }}>
											{pkceCodes.codeVerifier}
										</GeneratedUrlDisplay>
									</div>
									<div>
										<h5 style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Code Challenge</h5>
										<GeneratedUrlDisplay style={{ fontSize: '0.75rem' }}>
											{pkceCodes.codeChallenge}
										</GeneratedUrlDisplay>
									</div>
								</div>
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
									<Button
										onClick={() => handleCopy(pkceCodes.codeVerifier, "Code verifier")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy Verifier
									</Button>
									<Button
										onClick={() => handleCopy(pkceCodes.codeChallenge, "Code challenge")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy Challenge
									</Button>
								</div>
							</GeneratedContentBox>
						) : (
							<MainCard>
								<div style={{ textAlign: 'center', padding: '2rem' }}>
									<div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#d1d5db' }}>🔐</div>
									<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
										PKCE Parameters Not Generated
									</h4>
									<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
										Click the button below to generate secure PKCE parameters for your OAuth flow.
									</p>
									<div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
										<span>Code Verifier: Not generated</span>
										<span>•</span>
										<span>Code Challenge: Not generated</span>
									</div>
								</div>
							</MainCard>
						)}

						<div style={{ textAlign: 'center' }}>
							<Button
								onClick={handleGeneratePKCE}
								variant="success"
								size="md"
							>
								<FiSettings style={{ marginRight: '0.5rem' }} />
								Generate New PKCE Parameters
							</Button>
						</div>
					</div>
				);

			case 2:
				return (
					<div>
						<StepTitle>Authorization Request</StepTitle>
						
						<InfoBox type="warning">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								Step 2: Authorization Request
							</InfoTitle>
							<InfoText>
								The authorization request is the first step where your application redirects the user 
								to the authorization server (PingOne) to obtain their consent and authorization.
							</InfoText>
						</InfoBox>

						<MainCard>
							<h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.125rem' }}>Authorization URL Parameters</h4>
							<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
								<span style={{ fontWeight: '500' }}>response_type:</span>
								<span style={{ fontFamily: 'monospace' }}>code</span>
								<span style={{ fontWeight: '500' }}>client_id:</span>
								<span style={{ fontFamily: 'monospace' }}>{credentials.clientId}</span>
								<span style={{ fontWeight: '500' }}>redirect_uri:</span>
								<span style={{ fontFamily: 'monospace' }}>{credentials.redirectUri}</span>
								<span style={{ fontWeight: '500' }}>scope:</span>
								<span style={{ fontFamily: 'monospace' }}>{credentials.scopes}</span>
								<span style={{ fontWeight: '500' }}>code_challenge:</span>
								<span style={{ fontFamily: 'monospace' }}>{pkceCodes.codeChallenge}</span>
								<span style={{ fontWeight: '500' }}>code_challenge_method:</span>
								<span style={{ fontFamily: 'monospace' }}>{pkceCodes.codeChallengeMethod}</span>
							</div>
						</MainCard>

						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', alignItems: 'center' }}>
							<Button
								onClick={handleGenerateAuthUrl}
								variant="primary"
								size="md"
							>
								<FiExternalLink style={{ marginRight: '0.5rem' }} />
								Generate Authorization URL
							</Button>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<Button
									onClick={handleOpenAuthUrl}
									disabled={!authorizationUrl}
									variant="success"
									size="md"
								>
									<FiExternalLink style={{ marginRight: '0.5rem' }} />
									Open Authorization URL
								</Button>
								<span style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
									(Login to PingOne)
								</span>
							</div>
						</div>

						{authorizationUrl && (
							<GeneratedContentBox>
								<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#065f46' }}>
									Generated Authorization URL
								</h4>
								<GeneratedUrlDisplay>
									{authorizationUrl}
								</GeneratedUrlDisplay>
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
									<Button
										onClick={() => handleCopy(authorizationUrl, "Authorization URL")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy URL
									</Button>
								</div>
							</GeneratedContentBox>
						)}
					</div>
				);

			case 3:
				return (
					<div>
						<StepTitle>Authorization Response</StepTitle>
						
						<InfoBox type="success">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								Step 3: Authorization Response
							</InfoTitle>
							<InfoText>
								After the user grants consent, the authorization server redirects back to your 
								application with an authorization code. This code is a temporary credential that 
								proves the user authorized your application. It will be exchanged for access tokens 
								in the next step.
							</InfoText>
						</InfoBox>

						{authCode ? (
							<GeneratedContentBox>
								<h4 style={{ fontWeight: '600', marginBottom: '1rem', color: '#065f46', display: 'flex', alignItems: 'center' }}>
									<FiCheckCircle style={{ marginRight: '0.5rem' }} />
									Authorization Code Received!
								</h4>
								<p style={{ color: '#065f46', marginBottom: '1rem', fontSize: '0.875rem' }}>
									The authorization code was automatically captured from PingOne.
								</p>
								<GeneratedUrlDisplay>
									{authCode}
								</GeneratedUrlDisplay>
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
									<Button
										onClick={() => handleCopy(authCode, "Authorization code")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy Code
									</Button>
									<Button
										onClick={nextStep}
										variant="success"
										size="sm"
									>
										<FiChevronRight style={{ marginRight: '0.5rem' }} />
										Continue to Token Exchange
									</Button>
								</div>
							</GeneratedContentBox>
						) : (
							<MainCard>
								<div style={{ textAlign: 'center', padding: '2rem' }}>
									<div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#d1d5db' }}>🔑</div>
									<h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
										Authorization Code Not Received
									</h4>
									<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
										Complete the authorization process on PingOne to receive your authorization code.
									</p>
									<div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
										<span>Status: Waiting for authorization code</span>
									</div>
								</div>
								
								<div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
									<h5 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>Manual Entry (Optional)</h5>
									<p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
										If you have the authorization code, you can enter it manually:
									</p>
									<FormInput
										type="text"
										value={authCode}
										onChange={(e) => setAuthCode(e.target.value)}
										placeholder="Enter authorization code here..."
										style={{ marginBottom: '1rem' }}
									/>
									<Button
										onClick={() => handleCopy(authCode, "Authorization code")}
										disabled={!authCode}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy Code
									</Button>
								</div>
							</MainCard>
						)}

						<InfoBox type="info">
							<h5 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>Important Security Notes:</h5>
							<InfoList>
								<li>Authorization codes are short-lived (typically 10 minutes)</li>
								<li>They can only be used once</li>
								<li>Always validate the state parameter to prevent CSRF attacks</li>
								<li>The code must be exchanged for tokens immediately</li>
							</InfoList>
						</InfoBox>
					</div>
				);

			case 4:
				return (
					<div>
						<StepTitle>Token Exchange</StepTitle>
						
						<InfoBox type="warning">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								Step 4: Token Exchange
							</InfoTitle>
							<InfoText>
								Exchange the authorization code for access tokens. This is where PKCE provides 
								additional security by proving that the same client that initiated the flow 
								is completing it.
							</InfoText>
						</InfoBox>

						<MainCard>
							<h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.125rem' }}>Token Request</h4>
							<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
								<span style={{ fontWeight: '500' }}>grant_type:</span>
								<span style={{ fontFamily: 'monospace' }}>authorization_code</span>
								<span style={{ fontWeight: '500' }}>code:</span>
								<span style={{ fontFamily: 'monospace' }}>{authCode || "Enter code above"}</span>
								<span style={{ fontWeight: '500' }}>redirect_uri:</span>
								<span style={{ fontFamily: 'monospace' }}>{credentials.redirectUri}</span>
								<span style={{ fontWeight: '500' }}>client_id:</span>
								<span style={{ fontFamily: 'monospace' }}>{credentials.clientId}</span>
								<span style={{ fontWeight: '500' }}>code_verifier:</span>
								<span style={{ fontFamily: 'monospace' }}>{pkceCodes.codeVerifier}</span>
							</div>
						</MainCard>

						<div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
							<Button
								onClick={handleExchangeTokens}
								disabled={isLoading || !authCode}
								variant="primary"
								size="lg"
							>
								{isLoading ? (
									<>
										<FiLoader style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
										Exchanging Tokens...
									</>
								) : (
									<>
										<FiSettings style={{ marginRight: '0.5rem' }} />
										Exchange for Tokens
									</>
								)}
							</Button>
						</div>

						{tokens && (
							<GeneratedContentBox>
								<h4 style={{ fontWeight: '600', marginBottom: '1rem', color: '#065f46', display: 'flex', alignItems: 'center' }}>
									<FiCheckCircle style={{ marginRight: '0.5rem' }} />
									Tokens Exchanged Successfully!
								</h4>
								<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
									<span style={{ fontWeight: '500' }}>Access Token:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{tokens.access_token.substring(0, 30)}...
									</GeneratedUrlDisplay>
									<span style={{ fontWeight: '500' }}>ID Token:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{tokens.id_token.substring(0, 30)}...
									</GeneratedUrlDisplay>
									<span style={{ fontWeight: '500' }}>Refresh Token:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{tokens.refresh_token}
									</GeneratedUrlDisplay>
									<span style={{ fontWeight: '500' }}>Expires In:</span>
									<span style={{ fontFamily: 'monospace', color: '#065f46' }}>{tokens.expires_in} seconds</span>
								</div>
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
									<Button
										onClick={() => handleCopy(tokens.access_token, "Access token")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy Access Token
									</Button>
									<Button
										onClick={() => handleCopy(tokens.id_token, "ID token")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy ID Token
									</Button>
								</div>
							</GeneratedContentBox>
						)}
					</div>
				);

			case 5:
				return (
					<div>
						<StepTitle>User Information</StepTitle>
						
						<InfoBox type="info">
							<InfoTitle>
								<FiBook style={{ marginRight: '0.5rem' }} />
								Step 5: Fetch User Information
							</InfoTitle>
							<InfoText>
								Use the access token to fetch user information from the UserInfo endpoint. 
								This step is optional but commonly used in OpenID Connect flows.
							</InfoText>
						</InfoBox>

						<MainCard>
							<h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.125rem' }}>UserInfo Request</h4>
							<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
								<span style={{ fontWeight: '500' }}>Endpoint:</span>
								<span style={{ fontFamily: 'monospace' }}>https://auth.pingone.com/{credentials.environmentId}/as/userinfo</span>
								<span style={{ fontWeight: '500' }}>Method:</span>
								<span style={{ fontFamily: 'monospace' }}>GET</span>
								<span style={{ fontWeight: '500' }}>Authorization:</span>
								<span style={{ fontFamily: 'monospace' }}>Bearer {tokens?.access_token.substring(0, 20)}...</span>
							</div>
						</MainCard>

						<div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
							<Button
								onClick={() => {
									// Simulate user info fetch
									const mockUserInfo = {
										sub: "user123",
										name: "John Doe",
										email: "john.doe@example.com",
										given_name: "John",
										family_name: "Doe",
										preferred_username: "johndoe"
									};
									setUserInfo(mockUserInfo);
									showGlobalSuccess("User information retrieved successfully!");
								}}
								disabled={!tokens}
								variant="primary"
								size="lg"
							>
								<FiExternalLink style={{ marginRight: '0.5rem' }} />
								Fetch User Information
							</Button>
						</div>

						{userInfo && (
							<GeneratedContentBox>
								<h4 style={{ fontWeight: '600', marginBottom: '1rem', color: '#065f46', display: 'flex', alignItems: 'center' }}>
									<FiCheckCircle style={{ marginRight: '0.5rem' }} />
									User Information Retrieved Successfully!
								</h4>
								<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
									<span style={{ fontWeight: '500' }}>Subject:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{userInfo.sub}
									</GeneratedUrlDisplay>
									<span style={{ fontWeight: '500' }}>Name:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{userInfo.name}
									</GeneratedUrlDisplay>
									<span style={{ fontWeight: '500' }}>Email:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{userInfo.email}
									</GeneratedUrlDisplay>
									<span style={{ fontWeight: '500' }}>Username:</span>
									<GeneratedUrlDisplay style={{ fontSize: '0.75rem', margin: '0', padding: '0.25rem' }}>
										{userInfo.preferred_username}
									</GeneratedUrlDisplay>
								</div>
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
									<Button
										onClick={() => handleCopy(JSON.stringify(userInfo, null, 2), "User information")}
										variant="primary"
										size="sm"
									>
										<FiCopy style={{ marginRight: '0.5rem' }} />
										Copy User Info
									</Button>
								</div>
							</GeneratedContentBox>
						)}
					</div>
				);

			case 6:
				return (
					<div>
						<StepTitle>Flow Complete!</StepTitle>
						
						<InfoBox type="success">
							<InfoTitle>
								<FiCheckCircle style={{ marginRight: '0.5rem' }} />
								Authorization Code Flow Completed Successfully
							</InfoTitle>
							<InfoText>
								Congratulations! You have successfully completed the Authorization Code Flow with PKCE. 
								You now have secure access tokens and user information.
							</InfoText>
						</InfoBox>

						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
							<MainCard>
								<h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.125rem' }}>Tokens Obtained</h4>
								<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										Access Token
									</li>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										ID Token (OpenID Connect)
									</li>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										Refresh Token
									</li>
								</ul>
							</MainCard>

							<MainCard>
								<h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.125rem' }}>Security Features Used</h4>
								<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										PKCE (Code Challenge/Verifier)
									</li>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										State Parameter
									</li>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										Client Authentication
									</li>
									<li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
										<FiCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
										HTTPS/TLS
									</li>
								</ul>
							</MainCard>
						</div>

						<InfoBox type="info">
							<h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#1e40af' }}>Next Steps</h4>
							<InfoList>
								<li>Use the access token to make API calls</li>
								<li>Store tokens securely (consider refresh token rotation)</li>
								<li>Implement proper error handling and token refresh</li>
								<li>Consider implementing logout functionality</li>
								<li>Review and implement additional security measures</li>
							</InfoList>
						</InfoBox>
					</div>
				);

			default:
				return <div>Unknown Step</div>;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				{/* Step Content */}
				{renderStepContent()}
				
				{/* Add bottom padding to prevent content from being hidden behind fixed navigation */}
				<div style={{ height: '8rem' }} />
			</ContentWrapper>

			{/* Fixed Step Navigation */}
			<StepNavigation>
				<StepIndicator>
					{Array.from({ length: totalSteps }, (_, i) => (
						<StepDot
							key={i}
							onClick={() => goToStep(i)}
							$active={i === currentStep}
							$completed={i < currentStep}
							aria-label={`Go to step ${i + 1}`}
						/>
					))}
				</StepIndicator>
				
				<NavigationButtons>
					<NavButton
						onClick={handleResetFlow}
						variant="danger"
						style={{ marginRight: '1rem' }}
					>
						<FiSettings style={{ marginRight: '0.5rem' }} />
						Reset Flow
					</NavButton>
					
					<NavButton
						onClick={prevStep}
						disabled={currentStep === 0}
						variant="secondary"
					>
						<FiChevronLeft />
						Previous
					</NavButton>
					
					<NavButton
						onClick={nextStep}
						disabled={currentStep === totalSteps - 1}
						variant="primary"
					>
						Next
						<FiChevronRight />
					</NavButton>
				</NavigationButtons>
			</StepNavigation>

			{/* Redirect Modal */}
			{showRedirectModal && (
				<Modal>
					<ModalContent type="info">
						<ModalIcon type="info">🔐</ModalIcon>
						<ModalTitle>Redirecting to PingOne</ModalTitle>
						<ModalText>
							You are being redirected to PingOne Identity Provider to authenticate and authorize this application.
						</ModalText>
					</ModalContent>
				</Modal>
			)}

			{/* Success Modal */}
			{showSuccessModal && (
				<Modal>
					<ModalContent type="success">
						<ModalIcon type="success">✅</ModalIcon>
						<ModalTitle>Authorization Successful!</ModalTitle>
						<ModalText>
							You have successfully authorized this application. The authorization code has been captured and you can now proceed to exchange it for tokens.
						</ModalText>
					</ModalContent>
				</Modal>
			)}
		</Container>
	);
};

export default AuthorizationCodeFlowV4;