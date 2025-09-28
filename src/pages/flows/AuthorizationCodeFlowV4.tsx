// src/pages/flows/AuthorizationCodeFlowV4.tsx - Educational Authorization Code Flow V4

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	FiCheckCircle,
	FiChevronLeft,
	FiChevronRight,
	FiCopy,
	FiExternalLink,
	FiBook,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiUser,
} from "react-icons/fi";
import styled from "styled-components";
import AuthorizationRequestModal from "../../components/AuthorizationRequestModal";
import EnhancedStepFlowV2 from "../../components/EnhancedStepFlowV2";
import {
	FormField,
	FormInput,
	FormLabel,
	InfoBox,
} from "../../components/steps/CommonSteps";
import TokenDisplay from "../../components/TokenDisplay";
import { useAuth } from "../../contexts/NewAuthContext";
import {
	showGlobalError,
	showGlobalSuccess,
	showGlobalWarning,
} from "../../hooks/useNotifications";
import { getCallbackUrlForFlow } from "../../utils/callbackUrls";
import {
	type ClientAuthConfig,
	type ClientAuthMethod,
	applyClientAuthentication,
	getAuthMethodSecurityLevel,
} from "../../utils/clientAuthentication";
import { copyToClipboard } from "../../utils/clipboard";
import { credentialManager } from "../../utils/credentialManager";
import { enhancedDebugger } from "../../utils/enhancedDebug";
import { useFlowStepManager } from "../../utils/flowStepSystem";
import {
	generateCodeChallenge,
	generateCodeVerifier,
	validateIdToken,
} from "../../utils/oauth";
import { logger } from "../../utils/logger";
import { storeOAuthTokens } from "../../utils/tokenStorage";

// Types
interface StepCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	authMethod: ClientAuthMethod;
}

interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

interface FlowStep {
	id: string;
	title: string;
	description: string;
	component: React.ReactNode;
	completed: boolean;
	active: boolean;
}

// Styled Components
const Container = styled.div`
	min-height: 100vh;
	background: #f8fafc;
	padding: 2rem 1rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;
	color: #1f2937;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0 0 1rem 0;
	color: #1f2937;
`;

const Subtitle = styled.p`
	font-size: 1.2rem;
	color: #6b7280;
	margin: 0;
	max-width: 800px;
	margin-left: auto;
	margin-right: auto;
	line-height: 1.6;
`;

const FlowCard = styled.div`
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	max-width: 1200px;
	margin: 0 auto;
`;

const StepHeader = styled.div<{ $isActive: boolean }>`
	background: ${({ $isActive }) =>
		$isActive
			? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
			: "#f8fafc"};
	color: ${({ $isActive }) => ($isActive ? "white" : "#1f2937")};
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const ProgressBar = styled.div`
	background: #e5e7eb;
	height: 4px;
	border-radius: 2px;
	overflow: hidden;
	margin-bottom: 2rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
	height: 100%;
	background: linear-gradient(90deg, #3b82f6, #10b981);
	width: ${({ $progress }) => $progress}%;
	transition: width 0.3s ease;
`;

const StepNavigation = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 2rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 12px;
`;

const NavigationButton = styled.button<{ $variant: "primary" | "secondary" }>`
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	border: none;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;

	${({ $variant }) =>
		$variant === "primary"
			? `
		background: #3b82f6;
		color: white;
		&:hover {
			background: #2563eb;
		}
	`
			: `
		background: #e5e7eb;
		color: #374151;
		&:hover {
			background: #d1d5db;
		}
	`}
`;

const StepIndicator = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
`;

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({ $active, $completed }) =>
		$completed ? "#10b981" : $active ? "#3b82f6" : "#e5e7eb"};
	transition: all 0.3s ease;
	${({ $active }) => $active && "transform: scale(1.2);"}
`;

const EducationalSection = styled.div`
	background: #f1f5f9;
	border-left: 4px solid #3b82f6;
	padding: 1.5rem;
	margin: 1.5rem 0;
	border-radius: 0 8px 8px 0;
`;

const CodeBlock = styled.div`
	background: #1e293b;
	color: #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	font-family: "Monaco", "Menlo", monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	overflow-x: auto;
	margin: 1rem 0;
`;

const InfoBox = styled.div`
	background: #dbeafe;
	border: 1px solid #3b82f6;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
`;

const WarningBox = styled.div`
	background: #fee2e2;
	border: 1px solid #ef4444;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
`;

const SuccessBox = styled.div`
	background: #d1fae5;
	border: 1px solid #10b981;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
`;

const QuizSection = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 12px;
	padding: 2rem;
	margin: 2rem 0;
`;

const QuizOption = styled.div<{ $selected: boolean; $correct?: boolean; $incorrect?: boolean }>`
	padding: 0.75rem;
	border: 2px solid #f59e0b;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-bottom: 0.5rem;

	${({ $selected, $correct, $incorrect }) => {
		if ($correct) return "background: #10b981; border-color: #10b981; color: white;";
		if ($incorrect) return "background: #ef4444; border-color: #ef4444; color: white;";
		if ($selected) return "background: #f59e0b; color: white;";
		return "&:hover { background: #fbbf24; }";
	}}
`;

const CopyButton = styled.button`
	background: #3b82f6;
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		background: #2563eb;
	}

	&.copied {
		background: #10b981;
	}
`;

const UrlDisplay = styled.div`
	background: #f1f5f9;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	padding: 1rem;
	font-family: "Monaco", "Menlo", monospace;
	font-size: 0.875rem;
	word-break: break-all;
	margin: 1rem 0;
`;

// Main Component
const AuthorizationCodeFlowV4: React.FC = () => {
	const authContext = useAuth();
	const { config } = authContext;

	const stepManager = useFlowStepManager({
		flowType: "authz-code-v4",
		persistKey: "authz_code_v4_step_manager",
		defaultStep: 0,
		enableAutoAdvance: false,
	});

	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: "",
		clientId: "",
		clientSecret: "",
		redirectUri: "https://localhost:3000/authz-callback",
		scopes: "openid profile email",
		authMethod: "client_secret_post",
	});

	const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
		codeVerifier: "",
		codeChallenge: "",
		codeChallengeMethod: "S256",
	});

	const [authUrl, setAuthUrl] = useState<string>("");
	const [tokens, setTokens] = useState<any>(null);
	const [userInfo, setUserInfo] = useState<any>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: any }>({});

	const totalSteps = 7;

	// Initialize PKCE codes
	useEffect(() => {
		const verifier = generateCodeVerifier();
		const challenge = generateCodeChallenge(verifier);
		setPkceCodes({
			codeVerifier: verifier,
			codeChallenge: challenge,
			codeChallengeMethod: "S256",
		});
	}, []);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const savedCredentials = credentialManager.loadFlowCredentials("authz-code-v4");
				if (savedCredentials) {
					setCredentials(savedCredentials);
				}
			} catch (error) {
				console.error("Failed to load credentials:", error);
			}
		};

		loadCredentials();
	}, []);

	// Save credentials
	const saveCredentials = useCallback(async () => {
		try {
			credentialManager.saveFlowCredentials("authz-code-v4", credentials);
			showGlobalSuccess("Credentials saved successfully");
		} catch (error) {
			console.error("Failed to save credentials:", error);
			showGlobalError("Failed to save credentials");
		}
	}, [credentials]);

	// Generate authorization URL
	const generateAuthorizationUrl = useCallback(() => {
		if (!credentials.environmentId || !credentials.clientId) {
			showGlobalError("Environment ID and Client ID are required");
			return;
		}

		const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			response_type: "code",
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			scope: credentials.scopes,
			state: "state_" + Math.random().toString(36).substring(7),
			nonce: "nonce_" + Math.random().toString(36).substring(7),
			code_challenge: pkceCodes.codeChallenge,
			code_challenge_method: pkceCodes.codeChallengeMethod,
		});

		const url = `${baseUrl}?${params.toString()}`;
		setAuthUrl(url);
		showGlobalSuccess("Authorization URL generated successfully");
	}, [credentials, pkceCodes]);

	// Copy to clipboard
	const handleCopy = useCallback(async (text: string, label: string) => {
		try {
			await copyToClipboard(text);
			showGlobalSuccess(`${label} copied to clipboard`);
		} catch (error) {
			showGlobalError(`Failed to copy ${label.toLowerCase()}`);
		}
	}, []);

	// Quiz handling
	const handleQuizAnswer = useCallback((stepId: string, answer: any, isCorrect: boolean) => {
		setQuizAnswers(prev => ({
			...prev,
			[stepId]: { answer, isCorrect }
		}));
		
		if (isCorrect) {
			showGlobalSuccess("Correct answer!");
		} else {
			showGlobalWarning("Incorrect. Try again!");
		}
	}, []);

	// Navigation
	const nextStep = useCallback(() => {
		if (currentStep < totalSteps - 1) {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep, totalSteps]);

	const prevStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	// Step components
	const renderStepContent = useCallback((step: number) => {
		switch (step) {
			case 0:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3 flex items-center">
								<FiBook className="mr-2" />
								What is the Authorization Code Flow?
							</h3>
							<p className="text-gray-700 mb-4">
								The Authorization Code Flow is the most secure OAuth 2.0 flow for web applications. 
								It's designed for applications that can securely store a client secret and can 
								make server-to-server requests.
							</p>
							
							<InfoBox>
								<h4 className="font-semibold mb-2">Key Benefits:</h4>
								<ul className="list-disc list-inside space-y-1">
									<li>Most secure OAuth flow</li>
									<li>Client secret never exposed to user agent</li>
									<li>Supports PKCE for additional security</li>
									<li>Can obtain refresh tokens for long-lived access</li>
								</ul>
							</InfoBox>
						</EducationalSection>

						<QuizSection>
							<h3 className="text-lg font-semibold mb-4">Knowledge Check</h3>
							<div className="mb-4">
								Why is the Authorization Code Flow considered the most secure OAuth flow?
							</div>
							<div className="space-y-2">
								{[
									{ text: "Because it's the fastest", correct: false },
									{ text: "Because the client secret is never exposed to the user agent", correct: true },
									{ text: "Because it doesn't require a redirect URI", correct: false },
									{ text: "Because it works without HTTPS", correct: false },
								].map((option, index) => (
									<QuizOption
										key={index}
										onClick={() => handleQuizAnswer("step1", option.text, option.correct)}
										$selected={quizAnswers.step1?.answer === option.text}
										$correct={quizAnswers.step1?.answer === option.text && option.correct}
										$incorrect={quizAnswers.step1?.answer === option.text && !option.correct}
									>
										{option.text}
									</QuizOption>
								))}
							</div>
						</QuizSection>

						<div className="bg-white p-6 rounded-lg border">
							<h4 className="font-semibold mb-4">PingOne Application Configuration</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField>
									<FormLabel>Environment ID</FormLabel>
									<FormInput
										value={credentials.environmentId}
										onChange={(e) => setCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
										placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
									/>
								</FormField>
								<FormField>
									<FormLabel>Client ID</FormLabel>
									<FormInput
										value={credentials.clientId}
										onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
										placeholder="a4f963ea-0736-456a-be72-b1fa4f63f81f"
									/>
								</FormField>
								<FormField>
									<FormLabel>Client Secret</FormLabel>
									<FormInput
										type="password"
										value={credentials.clientSecret}
										onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
										placeholder="Your client secret"
									/>
								</FormField>
								<FormField>
									<FormLabel>Redirect URI</FormLabel>
									<FormInput
										value={credentials.redirectUri}
										onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
										placeholder="https://localhost:3000/authz-callback"
									/>
								</FormField>
							</div>
							<button
								onClick={saveCredentials}
								className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
							>
								<FiSettings className="mr-2 inline" />
								Save Configuration
							</button>
						</div>
					</div>
				);

			case 1:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3">Understanding OAuth Parameters</h3>
							<p className="text-gray-700 mb-4">
								Before we can start the authorization flow, we need to configure several parameters 
								that define how the authentication will work.
							</p>
						</EducationalSection>

						<div className="bg-white p-6 rounded-lg border">
							<h4 className="text-lg font-semibold mb-4">OAuth Scopes</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								{[
									{ name: "openid", required: true, description: "Required for OpenID Connect" },
									{ name: "profile", required: false, description: "Basic profile information" },
									{ name: "email", required: false, description: "Email address" },
									{ name: "address", required: false, description: "Address information" },
									{ name: "phone", required: false, description: "Phone number" },
									{ name: "offline_access", required: false, description: "Refresh tokens" },
								].map((scope) => (
									<label key={scope.name} className="flex items-center">
										<input
											type="checkbox"
											checked={credentials.scopes.includes(scope.name)}
											onChange={(e) => {
												const scopes = credentials.scopes.split(" ").filter(s => s);
												if (e.target.checked) {
													scopes.push(scope.name);
												} else {
													const index = scopes.indexOf(scope.name);
													if (index > -1) scopes.splice(index, 1);
												}
												setCredentials(prev => ({ ...prev, scopes: scopes.join(" ") }));
											}}
											className="mr-2"
											disabled={scope.required}
										/>
										<span className={`px-3 py-1 rounded-full text-sm ${
											scope.required 
												? "bg-blue-100 text-blue-800" 
												: "bg-gray-100 text-gray-800"
										}`}>
											{scope.name}
											{scope.required && " *"}
										</span>
									</label>
								))}
							</div>
						</div>
					</div>
				);

			case 2:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3 flex items-center">
								<FiShield className="mr-2" />
								What is PKCE?
							</h3>
							<p className="text-gray-700 mb-4">
								PKCE (Proof Key for Code Exchange) is a security extension to OAuth 2.0 that provides 
								additional protection for public clients and mobile applications.
							</p>
						</EducationalSection>

						<div className="bg-white p-6 rounded-lg border">
							<h4 className="text-lg font-semibold mb-4">Generated PKCE Parameters</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h5 className="font-medium mb-3">Code Verifier</h5>
									<CodeBlock>{pkceCodes.codeVerifier}</CodeBlock>
									<CopyButton onClick={() => handleCopy(pkceCodes.codeVerifier, "Code Verifier")}>
										<FiCopy className="mr-1 inline" />
										Copy Verifier
									</CopyButton>
								</div>
								<div>
									<h5 className="font-medium mb-3">Code Challenge</h5>
									<CodeBlock>{pkceCodes.codeChallenge}</CodeBlock>
									<CopyButton onClick={() => handleCopy(pkceCodes.codeChallenge, "Code Challenge")}>
										<FiCopy className="mr-1 inline" />
										Copy Challenge
									</CopyButton>
								</div>
							</div>
							<button
								onClick={() => {
									const verifier = generateCodeVerifier();
									const challenge = generateCodeChallenge(verifier);
									setPkceCodes({ codeVerifier: verifier, codeChallenge: challenge, codeChallengeMethod: "S256" });
								}}
								className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
							>
								<FiRefreshCw className="mr-2 inline" />
								Generate New PKCE Parameters
							</button>
						</div>

						<WarningBox>
							<h4 className="font-semibold mb-2">Security Considerations</h4>
							<ul className="list-disc list-inside space-y-1">
								<li>Always use S256 challenge method when possible</li>
								<li>Store code_verifier securely (never in URL parameters)</li>
								<li>Use cryptographically secure random generators</li>
								<li>PKCE is especially important for mobile and SPA applications</li>
							</ul>
						</WarningBox>
					</div>
				);

			case 3:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3 flex items-center">
								<FiExternalLink className="mr-2" />
								Building the Authorization URL
							</h3>
							<p className="text-gray-700 mb-4">
								The authorization URL is the starting point of the OAuth flow. It contains all the 
								parameters we configured in the previous steps.
							</p>
						</EducationalSection>

						<div className="bg-white p-6 rounded-lg border">
							<h4 className="text-lg font-semibold mb-4">Generated Authorization URL</h4>
							{authUrl ? (
								<>
									<UrlDisplay>{authUrl}</UrlDisplay>
									<div className="flex gap-3">
										<button
											onClick={() => window.open(authUrl, '_blank')}
											className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
										>
											<FiExternalLink className="mr-2 inline" />
											Open Authorization URL
										</button>
										<button
											onClick={() => handleCopy(authUrl, "Authorization URL")}
											className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
										>
											<FiCopy className="mr-2 inline" />
											Copy URL
										</button>
									</div>
								</>
							) : (
								<div className="text-center py-8">
									<p className="text-gray-600 mb-4">Click the button below to generate your authorization URL</p>
									<button
										onClick={generateAuthorizationUrl}
										className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
									>
										Generate Authorization URL
									</button>
								</div>
							)}
						</div>

						<SuccessBox>
							<h4 className="font-semibold mb-2">What Happens Next?</h4>
							<p className="text-gray-700">
								When you click the authorization URL, the user will be redirected to PingOne where they'll:
							</p>
							<ol className="list-decimal list-inside mt-2 space-y-1">
								<li>See your application requesting permission</li>
								<li>Log in with their credentials</li>
								<li>Review and approve the requested scopes</li>
								<li>Be redirected back to your application with an authorization code</li>
							</ol>
						</SuccessBox>
					</div>
				);

			case 4:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3 flex items-center">
								<FiUser className="mr-2" />
								User Authorization Process
							</h3>
							<p className="text-gray-700 mb-4">
								This step happens at the authorization server (PingOne). The user authenticates 
								and grants permissions to your application.
							</p>
						</EducationalSection>

						<InfoBox>
							<h4 className="font-semibold mb-2">What the user sees:</h4>
							<ul className="list-disc list-inside space-y-1">
								<li>PingOne login page</li>
								<li>Consent screen showing requested permissions</li>
								<li>Your application name and logo</li>
								<li>List of scopes being requested</li>
							</ul>
						</InfoBox>

						<div className="text-center py-8">
							<div className="text-6xl mb-4">🔄</div>
							<h3 className="text-xl font-semibold mb-2">Waiting for Authorization</h3>
							<p className="text-gray-600">
								The user is currently authenticating with PingOne. Once they complete the process, 
								they'll be redirected back to your application with an authorization code.
							</p>
						</div>
					</div>
				);

			case 5:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3">Token Exchange Process</h3>
							<p className="text-gray-700 mb-4">
								Once you receive the authorization code, you need to exchange it for access tokens. 
								This happens server-to-server to keep the client secret secure.
							</p>
						</EducationalSection>

						<InfoBox>
							<h4 className="font-semibold mb-2">Token Exchange Request:</h4>
							<ul className="list-disc list-inside space-y-1">
								<li>Authorization code from the redirect</li>
								<li>Client credentials (ID and secret)</li>
								<li>PKCE code verifier</li>
								<li>Redirect URI (must match)</li>
							</ul>
						</InfoBox>

						<div className="text-center py-8">
							<div className="text-6xl mb-4">⚡</div>
							<h3 className="text-xl font-semibold mb-2">Ready for Token Exchange</h3>
							<p className="text-gray-600">
								When you receive the authorization code, this step will automatically exchange it 
								for access tokens and display the results.
							</p>
						</div>
					</div>
				);

			case 6:
				return (
					<div>
						<EducationalSection>
							<h3 className="text-xl font-semibold mb-3">Token Validation & Usage</h3>
							<p className="text-gray-700 mb-4">
								After receiving tokens, you should validate them and use them to access protected resources.
							</p>
						</EducationalSection>

						{tokens ? (
							<TokenDisplay
								tokens={tokens}
								userInfo={userInfo}
								onAnalyzeToken={() => {
									// Navigate to token management
									window.location.href = "/token-management";
								}}
							/>
						) : (
							<div className="text-center py-8">
								<div className="text-6xl mb-4">🎯</div>
								<h3 className="text-xl font-semibold mb-2">Tokens Will Appear Here</h3>
								<p className="text-gray-600">
									Once the token exchange is complete, your access tokens and user information 
									will be displayed here for analysis and testing.
								</p>
							</div>
						)}
					</div>
				);

			default:
				return <div>Step not found</div>;
		}
	}, [
		credentials,
		pkceCodes,
		authUrl,
		tokens,
		userInfo,
		quizAnswers,
		saveCredentials,
		generateAuthorizationUrl,
		handleCopy,
		handleQuizAnswer,
	]);

	const stepTitles = [
		"Introduction & Setup",
		"Flow Configuration", 
		"PKCE Implementation",
		"Authorization URL",
		"User Authorization",
		"Token Exchange",
		"Token Validation"
	];

	const progress = ((currentStep + 1) / totalSteps) * 100;

	return (
		<Container>
			<Header>
				<Title>OAuth 2.0 Authorization Code Flow V4</Title>
				<Subtitle>
					Educational step-by-step guide to understanding and implementing the Authorization Code Flow
				</Subtitle>
			</Header>

			<FlowCard>
				<StepHeader $isActive={true}>
					<div>
						<h2 className="text-2xl font-bold mb-2">Step {currentStep + 1}: {stepTitles[currentStep]}</h2>
						<p className="text-blue-100">
							Step {currentStep + 1} of {totalSteps} - Educational OAuth Flow
						</p>
					</div>
					<div className="text-right">
						<div className="text-4xl font-bold">{String(currentStep + 1).padStart(2, '0')}</div>
						<div className="text-sm text-blue-100">of {String(totalSteps).padStart(2, '0')}</div>
					</div>
				</StepHeader>

				<StepContent>
					<ProgressBar>
						<ProgressFill $progress={progress} />
					</ProgressBar>

					{renderStepContent(currentStep)}

					<StepNavigation>
						<div className="flex gap-2">
							<NavigationButton
								$variant="secondary"
								onClick={prevStep}
								disabled={currentStep === 0}
							>
								<FiChevronLeft />
								Previous
							</NavigationButton>
							<NavigationButton
								$variant="primary"
								onClick={nextStep}
								disabled={currentStep === totalSteps - 1}
							>
								Next
								<FiChevronRight />
							</NavigationButton>
						</div>

						<StepIndicator>
							{Array.from({ length: totalSteps }, (_, i) => (
								<StepDot
									key={i}
									$active={i === currentStep}
									$completed={i < currentStep}
								/>
							))}
						</StepIndicator>
					</StepNavigation>
				</StepContent>
			</FlowCard>
		</Container>
	);
};

export default AuthorizationCodeFlowV4;
