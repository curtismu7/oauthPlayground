// src/pages/flows/RARFlowV5.tsx
// Rich Authorization Requests (RAR) Flow - V5 Implementation with Service Architecture

import { useCallback, useEffect, useState } from 'react';
import {
	FiCheckCircle,
	FiExternalLink,
	FiKey,
	FiRefreshCw,
	FiZap,
	FiPlus,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import JWTTokenDisplay from '../../components/JWTTokenDisplay';
import { CodeExamplesDisplay } from '../../components/CodeExamplesDisplay';
import { FlowHeader } from '../../services/flowHeaderService';
import { createOAuthTemplate } from '../../services/enhancedApiCallDisplayService';
import EnhancedApiCallDisplay from '../../components/EnhancedApiCallDisplay';
import { trackOAuthFlow } from '../../utils/activityTracker';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { getFlowInfo } from '../../utils/flowInfoConfig';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand RAR flow and configure credentials',
	},
	{
		title: 'Step 1: Configuration',
		subtitle: 'Set up client credentials and authorization details',
	},
	{
		title: 'Step 2: Authorization Request',
		subtitle: 'Generate authorization request with RAR parameters',
	},
	{
		title: 'Step 3: Token Exchange',
		subtitle: 'Exchange authorization code for access token with RAR claims',
	},
	{
		title: 'Step 4: Token Analysis',
		subtitle: 'Analyze the received access token and RAR claims',
	},
	{
		title: 'Step 5: Security Features',
		subtitle: 'Demonstrate advanced security implementations',
	},
];

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	color: #1f2937;
`;

const StepContainer = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin-bottom: 2rem;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 1.5rem 2rem;
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const StepNumber = styled.div`
	background: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	font-size: 1.1rem;
`;

const StepTitle = styled.div`
	flex: 1;
`;

const StepTitleText = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
`;

const StepSubtitle = styled.p`
	margin: 0.5rem 0 0 0;
	opacity: 0.9;
	font-size: 1rem;
`;

const StepBody = styled.div`
	padding: 2rem;
	color: #1f2937;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
	color: #1f2937;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: #374151;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
`;


const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	${({ $variant = 'primary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #667eea;
					color: white;
					&:hover {
						background: #5a67d8;
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover {
						background: #e5e7eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover {
						background: #dc2626;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	padding: 1rem;
	border-radius: 6px;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	${({ $variant = 'info' }) => {
		switch ($variant) {
			case 'info':
				return `
					background: #eff6ff;
					border: 1px solid #bfdbfe;
					color: #1e40af;
				`;
			case 'warning':
				return `
					background: #fffbeb;
					border: 1px solid #fed7aa;
					color: #92400e;
				`;
			case 'success':
				return `
					background: #f0fdf4;
					border: 1px solid #bbf7d0;
					color: #166534;
				`;
		}
	}}
`;

const CodeBlock = styled.pre`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	padding: 1rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: #1f2937;
`;

const AuthorizationDetailsContainer = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	color: #1f2937;
`;

const AuthorizationDetailItem = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem;
	background: #f9fafb;
	border-radius: 6px;
	margin-bottom: 0.5rem;
	color: #1f2937;

	&:last-child {
		margin-bottom: 0;
	}
`;

const DetailInput = styled.input`
	flex: 1;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 0.875rem;
	color: #1f2937;
`;

const DetailTextArea = styled.textarea`
	flex: 1;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 0.875rem;
	min-height: 60px;
	resize: vertical;
	color: #1f2937;
`;

const RemoveButton = styled.button`
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: #dc2626;
	}
`;

const AddButton = styled.button`
	background: #10b981;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 0.75rem 1rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	margin-top: 1rem;

	&:hover {
		background: #059669;
	}
`;


// RAR Flow Component
export const RARFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(() => {
		// Load current step from localStorage on initialization
		const saved = localStorage.getItem('rar-v5-current-step');
		if (saved) {
			try {
				const step = parseInt(saved, 10);
				console.log('🔄 [RAR-V5] Loaded current step from localStorage:', step);
				return step;
			} catch (error) {
				console.warn('[RAR-V5] Failed to parse saved current step:', error);
			}
		}
		return 0;
	});
	const [credentials, setCredentials] = useState(() => {
		// Load credentials from localStorage on initialization
		const saved = localStorage.getItem('rar-v5-credentials');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				console.log('🔄 [RAR-V5] Loaded credentials from localStorage:', parsed);
				return {
					environmentId: parsed.environmentId || '',
					clientId: parsed.clientId || '',
					clientSecret: parsed.clientSecret || '',
					redirectUri: parsed.redirectUri || 'https://localhost:3000/authz-callback',
					scopes: parsed.scopes || 'openid profile email',
				};
			} catch (error) {
				console.warn('[RAR-V5] Failed to parse saved credentials:', error);
			}
		}
		return {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: 'https://localhost:3000/authz-callback',
			scopes: 'openid profile email',
		};
	});

	const [authorizationDetails, setAuthorizationDetails] = useState(() => {
		// Load authorization details from localStorage on initialization
		const saved = localStorage.getItem('rar-v5-authorization-details');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				console.log('🔄 [RAR-V5] Loaded authorization details from localStorage:', parsed);
				return parsed;
			} catch (error) {
				console.warn('[RAR-V5] Failed to parse saved authorization details:', error);
			}
		}
		return [
			{
				type: 'payment_initiation',
				locations: ['https://api.example.com/payments'],
				actions: ['initiate', 'status'],
				datatypes: ['account', 'payment'],
			},
			{
				type: 'account_information',
				locations: ['https://api.example.com/accounts'],
				actions: ['read'],
				datatypes: ['account', 'balance'],
			},
		];
	});

	const [authUrl, setAuthUrl] = useState(() => {
		// Load authUrl from localStorage on initialization
		const saved = localStorage.getItem('rar-v5-auth-url');
		return saved || '';
	});
	const [authCode, setAuthCode] = useState(() => {
		// Load authCode from localStorage on initialization
		const saved = localStorage.getItem('rar-v5-auth-code');
		return saved || '';
	});
	const [tokens, setTokens] = useState<{
		access_token: string;
		token_type: string;
		expires_in: number;
		scope: string;
		authorization_details: Array<{
			type: string;
			locations: string[];
			actions: string[];
			datatypes: string[];
		}>;
	} | null>(() => {
		// Load tokens from localStorage on initialization
		const saved = localStorage.getItem('rar-v5-tokens');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				console.log('🔄 [RAR-V5] Loaded tokens from localStorage:', parsed);
				return parsed;
			} catch (error) {
				console.warn('[RAR-V5] Failed to parse saved tokens:', error);
			}
		}
		return null;
	});
	const [isRequesting, setIsRequesting] = useState(false);

	// Track flow usage
	useEffect(() => {
		trackOAuthFlow('rar-v5', true, 'started');
	}, []);

	// Save credentials to localStorage whenever they change
	useEffect(() => {
		try {
			localStorage.setItem('rar-v5-credentials', JSON.stringify(credentials));
			console.log('💾 [RAR-V5] Credentials saved to localStorage:', {
				environmentId: credentials.environmentId ? `${credentials.environmentId.substring(0, 8)}...` : 'none',
				clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'none',
				hasClientSecret: !!credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes,
			});
		} catch (error) {
			console.warn('[RAR-V5] Failed to save credentials to localStorage:', error);
		}
	}, [credentials]);

	// Save authorization details to localStorage whenever they change
	useEffect(() => {
		try {
			localStorage.setItem('rar-v5-authorization-details', JSON.stringify(authorizationDetails));
			console.log('💾 [RAR-V5] Authorization details saved to localStorage:', authorizationDetails);
		} catch (error) {
			console.warn('[RAR-V5] Failed to save authorization details to localStorage:', error);
		}
	}, [authorizationDetails]);

	// Save current step to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem('rar-v5-current-step', currentStep.toString());
			console.log('💾 [RAR-V5] Current step saved to localStorage:', currentStep);
		} catch (error) {
			console.warn('[RAR-V5] Failed to save current step to localStorage:', error);
		}
	}, [currentStep]);

	// Save authUrl to localStorage whenever it changes
	useEffect(() => {
		if (authUrl) {
			try {
				localStorage.setItem('rar-v5-auth-url', authUrl);
				console.log('💾 [RAR-V5] Auth URL saved to localStorage');
			} catch (error) {
				console.warn('[RAR-V5] Failed to save auth URL to localStorage:', error);
			}
		}
	}, [authUrl]);

	// Save authCode to localStorage whenever it changes
	useEffect(() => {
		if (authCode) {
			try {
				localStorage.setItem('rar-v5-auth-code', authCode);
				console.log('💾 [RAR-V5] Auth code saved to localStorage');
			} catch (error) {
				console.warn('[RAR-V5] Failed to save auth code to localStorage:', error);
			}
		}
	}, [authCode]);

	// Save tokens to localStorage whenever they change
	useEffect(() => {
		if (tokens) {
			try {
				localStorage.setItem('rar-v5-tokens', JSON.stringify(tokens));
				console.log('💾 [RAR-V5] Tokens saved to localStorage');
			} catch (error) {
				console.warn('[RAR-V5] Failed to save tokens to localStorage:', error);
			}
		}
	}, [tokens]);



	// Check if step is valid
	const isStepValid = useCallback((stepIndex: number): boolean => {
		switch (stepIndex) {
			case 0:
				return true;
			case 1:
				return !!(credentials.environmentId && credentials.clientId && credentials.clientSecret);
			case 2:
				return !!(authUrl);
			case 3:
				return !!(authCode);
			case 4:
				return !!(tokens);
			case 5:
				return !!(tokens);
			default:
				return false;
		}
	}, [credentials, authUrl, authCode, tokens]);

	// Check if can navigate to next step
	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	// Handle step navigation
	const handleNext = useCallback(() => {
		if (canNavigateNext()) {
			setCurrentStep(prev => prev + 1);
		}
	}, [canNavigateNext]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		// Reset authorization details to default
		setAuthorizationDetails([
			{
				type: 'payment_initiation',
				locations: ['https://api.example.com/payments'],
				actions: ['initiate', 'status'],
				datatypes: ['account', 'payment'],
			},
			{
				type: 'account_information',
				locations: ['https://api.example.com/accounts'],
				actions: ['read'],
				datatypes: ['account', 'balance'],
			},
		]);
		setAuthUrl('');
		setAuthCode('');
		setTokens(null);
		setIsRequesting(false);

		// Clear flow-specific localStorage data (but keep credentials)
		try {
			localStorage.removeItem('rar-v5-current-step');
			localStorage.removeItem('rar-v5-authorization-details');
			localStorage.removeItem('rar-v5-auth-url');
			localStorage.removeItem('rar-v5-auth-code');
			localStorage.removeItem('rar-v5-tokens');
			console.log('🗑️ [RAR-V5] Cleared flow state (credentials preserved)');
		} catch (error) {
			console.warn('[RAR-V5] Failed to clear localStorage data:', error);
		}

		v4ToastManager.showSuccess('RAR flow reset successfully. Credentials preserved.');
	}, []);

	// Handle credentials save
	const handleSaveCredentials = useCallback(() => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			v4ToastManager.showError('Please fill in all required credentials.');
			return;
		}
		v4ToastManager.showSuccess('Credentials saved successfully.');
	}, [credentials]);

	// Handle authorization details update
	const updateAuthorizationDetail = useCallback((index: number, field: string, value: string | string[]) => {
		setAuthorizationDetails((prev: Array<{
			type: string;
			locations: string[];
			actions: string[];
			datatypes: string[];
		}>) => 
			prev.map((detail: {
				type: string;
				locations: string[];
				actions: string[];
				datatypes: string[];
			}, i: number) => 
				i === index ? { ...detail, [field]: value } : detail
			)
		);
	}, []);

	const addAuthorizationDetail = useCallback(() => {
		setAuthorizationDetails((prev: Array<{
			type: string;
			locations: string[];
			actions: string[];
			datatypes: string[];
		}>) => [
			...prev,
			{
				type: '',
				locations: [''],
				actions: [''],
				datatypes: [''],
			}
		]);
	}, []);

	const removeAuthorizationDetail = useCallback((index: number) => {
		setAuthorizationDetails((prev: Array<{
			type: string;
			locations: string[];
			actions: string[];
			datatypes: string[];
		}>) => prev.filter((_: {
			type: string;
			locations: string[];
			actions: string[];
			datatypes: string[];
		}, i: number) => i !== index));
	}, []);

	// Generate authorization URL
	const handleGenerateAuthUrl = useCallback(() => {
		if (!credentials.environmentId || !credentials.clientId) {
			v4ToastManager.showError('Please fill in Environment ID and Client ID first.');
			return;
		}

		try {
			const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const params = new URLSearchParams({
				response_type: 'code',
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri,
				scope: credentials.scopes,
				state: 'rar-flow-state-' + Math.random().toString(36).substr(2, 9),
			});

			// Add RAR authorization details
			const rarDetails = {
				type: 'oauth_authorization_details',
				authorization_details: authorizationDetails.filter((detail: {
					type: string;
					locations: string[];
					actions: string[];
					datatypes: string[];
				}) => 
					detail.type && detail.locations[0] && detail.actions[0]
				)
			};

			params.append('authorization_details', JSON.stringify(rarDetails));

			const url = `${baseUrl}?${params.toString()}`;
			setAuthUrl(url);
			v4ToastManager.showSuccess('Authorization URL with RAR parameters generated successfully.');
		} catch {
			v4ToastManager.showError('Failed to generate authorization URL.');
		}
	}, [credentials, authorizationDetails]);

	// Handle token exchange
	const handleTokenExchange = useCallback(async () => {
		if (!authCode) {
			v4ToastManager.showError('Please complete authorization first.');
			return;
		}

		setIsRequesting(true);
		try {
			// Mock token exchange with RAR claims
			const mockTokens = {
				access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiYXVkIjoiY2xpZW50X2lkIiwiZXhwIjoxNzM1ODQ5NjAwLCJpYXQiOjE3MzU4NDYwMDAsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRob3JpemF0aW9uX2RldGFpbHMiOlt7InR5cGUiOiJwYXltZW50X2luaXRpYXRpb24iLCJsb2NhdGlvbnMiOlsiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20vcGF5bWVudHMiXSwiaWF0aW9ucyI6WyJpbml0aWF0ZSIsInN0YXR1cyJdLCJkYXRhdHlwZXMiOlsiYWNjb3VudCIsInBheW1lbnQiXX0seyJ0eXBlIjoiYWNjb3VudF9pbmZvcm1hdGlvbiIsImxvY2F0aW9ucyI6WyJodHRwczovL2FwaS5leGFtcGxlLmNvbS9hY2NvdW50cyJdLCJhY3Rpb25zIjpbInJlYWQiXSwiZGF0YXR5cGVzIjpbImFjY291bnQiLCJiYWxhbmNlIl19XX0.signature',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: credentials.scopes,
				authorization_details: authorizationDetails.filter((detail: {
					type: string;
					locations: string[];
					actions: string[];
					datatypes: string[];
				}) => 
					detail.type && detail.locations[0] && detail.actions[0]
				),
			};

			setTokens(mockTokens);
			v4ToastManager.showSuccess('Tokens exchanged successfully with RAR claims.');
		} catch {
			v4ToastManager.showError('Token exchange failed.');
		} finally {
			setIsRequesting(false);
		}
	}, [authCode, credentials.scopes, authorizationDetails]);

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowInfoCard flowInfo={getFlowInfo('rar') || {
							flowType: 'oauth',
							flowName: 'Rich Authorization Requests (RAR)',
							tokensReturned: 'Access Token with RAR Claims',
							purpose: 'Granular Authorization with Detailed Permissions',
							specLayer: 'OAuth 2.0 Extension (RFC 9391)',
							nonceRequirement: 'Not required (but recommended with PKCE)',
							validation: 'Validate access token and authorization_details claims',
							securityNotes: [
								'✅ Enhanced security through granular permissions',
								'Authorization details specified in token claims',
								'Enables fine-grained access control',
								'Reduces over-privileged access tokens',
								'Requires authorization server RAR support',
							],
							useCases: [
								'Open Banking and Financial APIs',
								'Healthcare data access with specific permissions',
								'IoT device authorization with granular controls',
								'Multi-tenant applications with role-based access',
							],
						}} />
						<FlowSequenceDisplay flowType="rar" />
						<FlowConfigurationRequirements flowType="rar" />
					</>
				);

			case 1:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>Configure RAR Flow Credentials</ExplanationHeading>
							<p>
								Set up your PingOne credentials and define the authorization details that will be requested
								using the Rich Authorization Requests (RAR) specification.
							</p>
						</ExplanationSection>

						<FormGroup>
							<Label>Environment ID</Label>
							<Input
								type="text"
								value={credentials.environmentId}
								onChange={(e) => setCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
								placeholder="Enter your PingOne Environment ID"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Client ID</Label>
							<Input
								type="text"
								value={credentials.clientId}
								onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
								placeholder="Enter your Client ID"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Client Secret</Label>
							<Input
								type="password"
								value={credentials.clientSecret}
								onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
								placeholder="Enter your Client Secret"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Redirect URI</Label>
							<Input
								type="text"
								value={credentials.redirectUri}
								onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
								placeholder="https://localhost:3000/authz-callback"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Scopes</Label>
							<Input
								type="text"
								value={credentials.scopes}
								onChange={(e) => setCredentials(prev => ({ ...prev, scopes: e.target.value }))}
								placeholder="openid profile email"
							/>
						</FormGroup>

						<AuthorizationDetailsContainer>
							<Label>Authorization Details (RAR)</Label>
							<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
								Define the specific authorization details that will be requested using RAR.
							</p>
							
							{authorizationDetails.map((detail: {
								type: string;
								locations: string[];
								actions: string[];
								datatypes: string[];
							}, index: number) => (
								<AuthorizationDetailItem key={index}>
									<div style={{ minWidth: '120px' }}>
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Type</Label>
										<DetailInput
											value={detail.type}
											onChange={(e) => updateAuthorizationDetail(index, 'type', e.target.value)}
											placeholder="e.g., payment_initiation"
										/>
									</div>
									<div style={{ minWidth: '200px' }}>
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Locations</Label>
										<DetailTextArea
											value={detail.locations.join('\n')}
											onChange={(e) => updateAuthorizationDetail(index, 'locations', e.target.value.split('\n'))}
											placeholder="https://api.example.com/payments"
										/>
									</div>
									<div style={{ minWidth: '120px' }}>
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Actions</Label>
										<DetailInput
											value={detail.actions.join(',')}
											onChange={(e) => updateAuthorizationDetail(index, 'actions', e.target.value.split(','))}
											placeholder="initiate,status"
										/>
									</div>
									<div style={{ minWidth: '120px' }}>
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Data Types</Label>
										<DetailInput
											value={detail.datatypes.join(',')}
											onChange={(e) => updateAuthorizationDetail(index, 'datatypes', e.target.value.split(','))}
											placeholder="account,payment"
										/>
									</div>
									<RemoveButton onClick={() => removeAuthorizationDetail(index)}>
										<FiTrash2 size={16} />
									</RemoveButton>
								</AuthorizationDetailItem>
							))}

							<AddButton onClick={addAuthorizationDetail}>
								<FiPlus size={16} />
								Add Authorization Detail
							</AddButton>
						</AuthorizationDetailsContainer>

						<Button onClick={handleSaveCredentials}>
							<FiCheckCircle />
							Save Configuration
						</Button>
					</>
				);

			case 2:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>Generate Authorization Request with RAR</ExplanationHeading>
							<p>
								Generate an authorization URL that includes Rich Authorization Request parameters.
								The authorization_details parameter contains the specific permissions being requested.
							</p>
						</ExplanationSection>

						<Button onClick={handleGenerateAuthUrl} disabled={!credentials.environmentId || !credentials.clientId}>
							<FiZap />
							Generate Authorization URL with RAR
						</Button>

						{authUrl && (
							<>
								<InfoBox $variant="success">
									<FiCheckCircle />
									<div>
										<strong>Authorization URL Generated</strong>
										<p>Click the link below to test the RAR authorization flow.</p>
									</div>
								</InfoBox>

								<FormGroup>
									<Label>Authorization URL with RAR Parameters</Label>
									<CodeBlock>{authUrl}</CodeBlock>
								</FormGroup>

								<Button onClick={() => window.open(authUrl, '_blank')}>
									<FiExternalLink />
									Open Authorization URL
								</Button>

								{/* Enhanced API Call Display */}
								<EnhancedApiCallDisplay
									apiCall={createOAuthTemplate('rar', 'authorization-request', {
										environmentId: credentials.environmentId,
										clientId: credentials.clientId,
										redirectUri: credentials.redirectUri,
										scopes: credentials.scopes.split(' '),
										authorizationDetails: authorizationDetails.filter((detail: {
											type: string;
											locations: string[];
											actions: string[];
											datatypes: string[];
										}) => 
											detail.type && detail.locations[0] && detail.actions[0]
										)
									})}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										theme: 'light'
									}}
								/>
							</>
						)}
					</>
				);

			case 3:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>Token Exchange with RAR Claims</ExplanationHeading>
							<p>
								Exchange the authorization code for an access token. The token will contain
								the authorization details from the RAR request as claims.
							</p>
						</ExplanationSection>

						<FormGroup>
							<Label>Authorization Code</Label>
							<Input
								type="text"
								value={authCode}
								onChange={(e) => setAuthCode(e.target.value)}
								placeholder="Enter the authorization code from the callback"
							/>
						</FormGroup>

						<Button 
							onClick={handleTokenExchange} 
							disabled={!authCode || isRequesting}
						>
							{isRequesting ? <FiRefreshCw className="animate-spin" /> : <FiKey />}
							{isRequesting ? 'Exchanging...' : 'Exchange for Access Token'}
						</Button>

						{tokens && (
							<InfoBox $variant="success">
								<FiCheckCircle />
								<div>
									<strong>Token Exchange Successful</strong>
									<p>Access token received with RAR authorization details as claims.</p>
								</div>
							</InfoBox>
						)}

						{/* Enhanced Token Exchange API Call Display */}
						{credentials.environmentId && credentials.clientId && (
							<EnhancedApiCallDisplay
								apiCall={createOAuthTemplate('rar', 'token-exchange', {
									environmentId: credentials.environmentId,
									clientId: credentials.clientId,
									clientSecret: credentials.clientSecret,
									redirectUri: credentials.redirectUri,
									authorizationCode: authCode || '[authorization_code]'
								})}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									theme: 'light'
								}}
							/>
						)}
					</>
				);

			case 4:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Token Analysis with RAR Claims</ResultsHeading>
							<p>
								The access token contains the authorization details from the RAR request as claims.
								These claims specify exactly what the client is authorized to do.
							</p>
						</ResultsSection>

						{tokens && (
							<>
								<JWTTokenDisplay 
									token={tokens.access_token} 
									tokenType="access"
								/>

								<SectionDivider />

								<FormGroup>
									<Label>Authorization Details Claims</Label>
									<CodeBlock>
										{JSON.stringify(tokens.authorization_details, null, 2)}
									</CodeBlock>
								</FormGroup>

								<FormGroup>
									<Label>Token Introspection</Label>
									<TokenIntrospect 
										flowName="Rich Authorization Requests (RAR)"
										flowVersion="V5"
										tokens={tokens}
										credentials={{
											environmentId: credentials.environmentId,
											clientId: credentials.clientId,
											clientSecret: credentials.clientSecret,
										}}
										onResetFlow={handleReset}
									/>
								</FormGroup>
							</>
						)}
					</>
				);

			case 5:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Security Features with RAR</ResultsHeading>
							<p>
								RAR provides enhanced security through granular authorization details.
								Demonstrate security features with the RAR-enhanced access token.
							</p>
						</ResultsSection>

						{tokens && (
							<SecurityFeaturesDemo
								tokens={tokens}
								credentials={credentials}
								onTerminateSession={() => {
									console.log('🚪 Session terminated via SecurityFeaturesDemo');
									v4ToastManager.showSuccess('Session termination completed.');
								}}
								onRevokeTokens={() => {
									console.log('❌ Tokens revoked via SecurityFeaturesDemo');
									v4ToastManager.showSuccess('Token revocation completed.');
								}}
							/>
						)}

						<CodeExamplesDisplay
							flowType="rar"
							stepId={`step-${currentStep}`}
							config={{
								environmentId: credentials.environmentId,
								clientId: credentials.clientId,
								redirectUri: credentials.redirectUri,
								scopes: credentials.scopes.split(' '),
							}}
						/>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<FlowHeader
				flowType="rar"
			/>

			<StepContainer>
				<StepHeader>
					<StepNumber>{currentStep + 1}</StepNumber>
					<StepTitle>
						<StepTitleText>{STEP_METADATA[currentStep].title}</StepTitleText>
						<StepSubtitle>{STEP_METADATA[currentStep].subtitle}</StepSubtitle>
					</StepTitle>
				</StepHeader>

				<StepBody>
					{renderStepContent()}

					<StepNavigationButtons
						currentStep={currentStep}
						totalSteps={STEP_METADATA.length}
						onPrevious={handlePrevious}
						onReset={handleReset}
						onNext={handleNext}
						canNavigateNext={canNavigateNext()}
						isFirstStep={currentStep === 0}
						nextButtonText={isStepValid(currentStep) ? 'Next' : 'Complete above action'}
						disabledMessage="Complete the action above to continue"
					/>
				</StepBody>
			</StepContainer>
		</Container>
	);
};

export default RARFlowV5;
