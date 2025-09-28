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

const StepDot = styled.button<{ active?: boolean; completed?: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	transition: all 0.3s ease;
	background: #e5e7eb;
	
	${props => {
		if (props.active) {
			return `
				background: #3b82f6;
				transform: scale(1.2);
			`;
		} else if (props.completed) {
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

	const totalSteps = 7;

	// Initialize PKCE codes
	useEffect(() => {
		const initializePKCE = async () => {
			try {
				const codeVerifier = generateCodeVerifier();
				const codeChallenge = await generateCodeChallenge(codeVerifier);
				setPkceCodes({
					codeVerifier,
					codeChallenge,
					codeChallengeMethod: "S256"
				});
			} catch (error) {
				console.error("Failed to initialize PKCE:", error);
			}
		};
		initializePKCE();
	}, []);

	const handleSaveConfiguration = async () => {
		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			showGlobalSuccess("Configuration saved successfully!");
		} catch (error) {
			showGlobalError("Failed to save configuration");
		} finally {
			setIsLoading(false);
		}
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
		// Store the URL for potential future use
		console.log("Generated Authorization URL:", authUrl);
		showGlobalSuccess("Authorization URL generated successfully!");
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

							{/* Save Configuration Button */}
							<div style={{ textAlign: 'center', marginTop: '2rem' }}>
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
							</div>
						</MainCard>
					</div>
				);

			case 1:
				return (
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">PKCE Parameters</h2>
						
						<div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
							<h3 className="text-lg font-semibold text-blue-900 mb-3">What is PKCE?</h3>
							<p className="text-blue-800">
								PKCE (Proof Key for Code Exchange) is a security extension for OAuth 2.0 that adds 
								an extra layer of security, especially important for public clients like mobile apps 
								and SPAs that cannot securely store a client secret.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-white p-6 rounded-lg border border-gray-200">
								<h4 className="font-semibold mb-4">Code Verifier</h4>
								<div className="bg-gray-100 p-3 rounded font-mono text-sm break-all mb-3">
									{pkceCodes.codeVerifier || "Generating..."}
								</div>
								<button
									onClick={() => handleCopy(pkceCodes.codeVerifier, "Code verifier")}
									className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
								>
									<FiCopy className="mr-2" />
									Copy
								</button>
							</div>

							<div className="bg-white p-6 rounded-lg border border-gray-200">
								<h4 className="font-semibold mb-4">Code Challenge</h4>
								<div className="bg-gray-100 p-3 rounded font-mono text-sm break-all mb-3">
									{pkceCodes.codeChallenge || "Generating..."}
								</div>
								<button
									onClick={() => handleCopy(pkceCodes.codeChallenge, "Code challenge")}
									className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
								>
									<FiCopy className="mr-2" />
									Copy
								</button>
							</div>
						</div>

						<div className="mt-6">
							<button
								onClick={handleGeneratePKCE}
								className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
							>
								<FiSettings className="mr-2" />
								Generate New PKCE Parameters
							</button>
						</div>
					</div>
				);

			case 2:
				return (
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Authorization Request</h2>
						
						<div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-6">
							<h3 className="text-lg font-semibold text-yellow-900 mb-3">Step 2: Authorization Request</h3>
							<p className="text-yellow-800">
								The authorization request is the first step where your application redirects the user 
								to the authorization server (PingOne) to obtain their consent and authorization.
							</p>
						</div>

						<div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-semibold mb-4">Authorization URL Parameters</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="font-medium">response_type:</span>
									<span className="font-mono">code</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">client_id:</span>
									<span className="font-mono">{credentials.clientId}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">redirect_uri:</span>
									<span className="font-mono">{credentials.redirectUri}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">scope:</span>
									<span className="font-mono">{credentials.scopes}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">code_challenge:</span>
									<span className="font-mono">{pkceCodes.codeChallenge}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">code_challenge_method:</span>
									<span className="font-mono">{pkceCodes.codeChallengeMethod}</span>
								</div>
							</div>
						</div>

						<div className="flex space-x-4">
							<button
								onClick={handleGenerateAuthUrl}
								className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
							>
								<FiExternalLink className="mr-2" />
								Generate Authorization URL
							</button>
							<button
								onClick={() => showGlobalSuccess("Opening authorization URL in new window...")}
								className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
							>
								<FiExternalLink className="mr-2" />
								Open Authorization URL
							</button>
						</div>
					</div>
				);

			case 3:
				return (
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Authorization Response</h2>
						
						<div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
							<h3 className="text-lg font-semibold text-green-900 mb-3">Step 3: Authorization Response</h3>
							<p className="text-green-800">
								After the user grants consent, the authorization server redirects back to your 
								application with an authorization code.
							</p>
						</div>

						<div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-semibold mb-4">Authorization Code</h4>
							<p className="text-gray-600 mb-4">
								Enter the authorization code you received from the redirect:
							</p>
							<input
								type="text"
								value={authCode}
								onChange={(e) => setAuthCode(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
								placeholder="Enter authorization code here..."
							/>
							<button
								onClick={() => handleCopy(authCode, "Authorization code")}
								className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								<FiCopy className="mr-2" />
								Copy Code
							</button>
						</div>

						<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
							<h5 className="font-semibold text-blue-900 mb-2">Important Security Notes:</h5>
							<ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
								<li>Authorization codes are short-lived (typically 10 minutes)</li>
								<li>They can only be used once</li>
								<li>Always validate the state parameter to prevent CSRF attacks</li>
								<li>The code must be exchanged for tokens immediately</li>
							</ul>
						</div>
					</div>
				);

			case 4:
				return (
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Token Exchange</h2>
						
						<div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-6">
							<h3 className="text-lg font-semibold text-purple-900 mb-3">Step 4: Token Exchange</h3>
							<p className="text-purple-800">
								Exchange the authorization code for access tokens. This is where PKCE provides 
								additional security by proving that the same client that initiated the flow 
								is completing it.
							</p>
						</div>

						<div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-semibold mb-4">Token Request</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="font-medium">grant_type:</span>
									<span className="font-mono">authorization_code</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">code:</span>
									<span className="font-mono">{authCode || "Enter code above"}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">redirect_uri:</span>
									<span className="font-mono">{credentials.redirectUri}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">client_id:</span>
									<span className="font-mono">{credentials.clientId}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">code_verifier:</span>
									<span className="font-mono">{pkceCodes.codeVerifier}</span>
								</div>
							</div>
						</div>

						<button
							onClick={handleExchangeTokens}
							disabled={isLoading || !authCode}
							className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
								isLoading || !authCode
									? 'bg-gray-400 cursor-not-allowed text-white'
									: 'bg-blue-600 hover:bg-blue-700 text-white'
							}`}
						>
							{isLoading ? (
								<>
									<FiLoader className="mr-2 animate-spin" />
									Exchanging Tokens...
								</>
							) : (
								<>
									<FiSettings className="mr-2" />
									Exchange for Tokens
								</>
							)}
						</button>

						{tokens && (
							<div className="mt-6 bg-green-50 p-6 rounded-lg border border-green-200">
								<h4 className="font-semibold text-green-900 mb-4 flex items-center">
									<FiCheckCircle className="mr-2" />
									Tokens Received Successfully!
								</h4>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="font-medium">Access Token:</span>
										<span className="font-mono text-xs">{tokens.access_token.substring(0, 20)}...</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">ID Token:</span>
										<span className="font-mono text-xs">{tokens.id_token.substring(0, 20)}...</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Refresh Token:</span>
										<span className="font-mono text-xs">{tokens.refresh_token}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Expires In:</span>
										<span className="font-mono">{tokens.expires_in} seconds</span>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case 5:
				return (
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">User Information</h2>
						
						<div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200 mb-6">
							<h3 className="text-lg font-semibold text-indigo-900 mb-3">Step 5: Fetch User Information</h3>
							<p className="text-indigo-800">
								Use the access token to fetch user information from the UserInfo endpoint. 
								This step is optional but commonly used in OpenID Connect flows.
							</p>
						</div>

						<div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-semibold mb-4">UserInfo Request</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="font-medium">Endpoint:</span>
									<span className="font-mono">https://auth.pingone.com/{credentials.environmentId}/as/userinfo</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">Method:</span>
									<span className="font-mono">GET</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">Authorization:</span>
									<span className="font-mono">Bearer {tokens?.access_token.substring(0, 20)}...</span>
								</div>
							</div>
						</div>

						<button
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
							className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
								!tokens
									? 'bg-gray-400 cursor-not-allowed text-white'
									: 'bg-indigo-600 hover:bg-indigo-700 text-white'
							}`}
						>
							<FiExternalLink className="mr-2" />
							Fetch User Information
						</button>

						{userInfo && (
							<div className="mt-6 bg-green-50 p-6 rounded-lg border border-green-200">
								<h4 className="font-semibold text-green-900 mb-4 flex items-center">
									<FiCheckCircle className="mr-2" />
									User Information Retrieved
								</h4>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="font-medium">Subject:</span>
										<span className="font-mono">{userInfo.sub}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Name:</span>
										<span className="font-mono">{userInfo.name}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Email:</span>
										<span className="font-mono">{userInfo.email}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Username:</span>
										<span className="font-mono">{userInfo.preferred_username}</span>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case 6:
				return (
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Flow Complete!</h2>
						
						<div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
							<h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
								<FiCheckCircle className="mr-2" />
								Authorization Code Flow Completed Successfully
							</h3>
							<p className="text-green-800">
								Congratulations! You have successfully completed the Authorization Code Flow with PKCE. 
								You now have secure access tokens and user information.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-white p-6 rounded-lg border border-gray-200">
								<h4 className="font-semibold mb-4">Tokens Obtained</h4>
								<ul className="space-y-2 text-sm">
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										Access Token
									</li>
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										ID Token (OpenID Connect)
									</li>
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										Refresh Token
									</li>
								</ul>
							</div>

							<div className="bg-white p-6 rounded-lg border border-gray-200">
								<h4 className="font-semibold mb-4">Security Features Used</h4>
								<ul className="space-y-2 text-sm">
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										PKCE (Code Challenge/Verifier)
									</li>
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										State Parameter
									</li>
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										Client Authentication
									</li>
									<li className="flex items-center">
										<FiCheckCircle className="mr-2 text-green-500" />
										HTTPS/TLS
									</li>
								</ul>
							</div>
						</div>

						<div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
							<h4 className="font-semibold text-blue-900 mb-3">Next Steps</h4>
							<ul className="list-disc list-inside space-y-1 text-blue-800">
								<li>Use the access token to make API calls</li>
								<li>Store tokens securely (consider refresh token rotation)</li>
								<li>Implement proper error handling and token refresh</li>
								<li>Consider implementing logout functionality</li>
								<li>Review and implement additional security measures</li>
							</ul>
						</div>
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
							active={i === currentStep}
							completed={i < currentStep}
							aria-label={`Go to step ${i + 1}`}
						/>
					))}
				</StepIndicator>
				
				<NavigationButtons>
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
		</Container>
	);
};

export default AuthorizationCodeFlowV4;