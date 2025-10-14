// src/pages/flows/RARFlowV6.tsx
// Rich Authorization Requests (RAR) Flow - V6 Implementation with Service Architecture

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePageScroll } from '../../hooks/usePageScroll';
import {
	FiCheckCircle,
	FiCode,
	FiExternalLink,
	FiKey,
	FiRefreshCw,
	FiZap,
	FiPlus,
	FiTrash2,
	FiInfo,
	FiShield,
	FiSettings,
	FiChevronDown,
} from 'react-icons/fi';
import styled from 'styled-components';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
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
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import {
	TokenIntrospectionService,
	IntrospectionApiCallData,
} from '../../services/tokenIntrospectionService';
import { createOAuthTemplate } from '../../services/enhancedApiCallDisplayService';
import { trackOAuthFlow } from '../../utils/activityTracker';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService';
import RARService, { type AuthorizationDetail } from '../../services/rarService';
import { FlowStorageService } from '../../services/flowStorageService';
import {
	STEP_METADATA,
	type IntroSectionKey,
	DEFAULT_APP_CONFIG,
	RAR_EDUCATION,
} from './config/RARFlow.config';

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

// Example section styled components
const ExampleSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 1.5rem;
	margin: 1rem 0;
	background: #fafafa;
`;

const ExampleHeader = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: #374151;
`;

const ExampleContainer = styled.div`
	border: 1px solid #d1d5db;
	border-radius: 6px;
	overflow: hidden;
`;

const ExampleTabs = styled.div`
	display: flex;
	border-bottom: 1px solid #d1d5db;
	background: #f9fafb;
`;

const ExampleTab = styled.button<{ active?: boolean }>`
	flex: 1;
	padding: 0.75rem 1rem;
	border: none;
	background: ${({ active }) => (active ? '#ffffff' : 'transparent')};
	color: ${({ active }) => (active ? '#374151' : '#6b7280')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	border-bottom: ${({ active }) => (active ? '2px solid #3b82f6' : 'none')};
	transition: all 0.2s;

	&:hover {
		background: ${({ active }) => (active ? '#ffffff' : '#f3f4f6')};
	}
`;

const JsonExampleContainer = styled.div`
	padding: 1.5rem;
	background: #1e293b;
`;

const JsonExampleTitle = styled.h4`
	margin: 0 0 1rem 0;
	color: #e2e8f0;
	font-size: 1rem;
	font-weight: 600;
`;

const JsonExampleDisplay = styled.pre`
	background: #0f172a;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 4px;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.5;
	margin: 0 0 1rem 0;
	white-space: pre-wrap;
	word-break: break-all;
`;

const JsonExampleActions = styled.div`
	display: flex;
	gap: 0.75rem;
`;

const JsonExampleButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #475569;
	border-radius: 4px;
	background: #1e293b;
	color: #e2e8f0;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #334155;
		border-color: #64748b;
	}
`;

const FormattedExampleContainer = styled.div`
	padding: 1.5rem;
	background: white;
`;

const FormattedExampleTitle = styled.h4`
	margin: 0 0 1rem 0;
	color: #374151;
	font-size: 1rem;
	font-weight: 600;
`;

const FormattedExampleList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const FormattedExampleItem = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 1rem;
	background: #f9fafb;
`;

const FormattedExampleItemHeader = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const FormattedExampleDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const FormattedExampleDetail = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

// RAR Flow Component
export const RARFlowV6: React.FC = () => {
	// Page scroll management
	usePageScroll({ pageName: 'RAR Flow V6', force: true });

	// Use service for state initialization
	const [currentStep, setCurrentStep] = useState(() => 
		AuthorizationCodeSharedService.StepRestoration.getInitialStep('rar-v6')
	);

	// Scroll to top on step change
	useEffect(() => {
		AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange(currentStep, 'rar-v6');
	}, [currentStep]);

	// Legacy: Load from old localStorage key for migration
	useEffect(() => {
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
	// API call tracking for display
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);

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

	const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetail[]>(() => {
		// Load authorization details from FlowStorageService first (preferred)
		const saved = FlowStorageService.AdvancedParameters.get('rar-v5');
		if (saved && saved.authorizationDetails) {
			console.log('💾 [RAR-V5] Loaded authorization details from FlowStorageService:', saved.authorizationDetails);
			return saved.authorizationDetails;
		}

		// Fallback to localStorage for backward compatibility
		const localSaved = localStorage.getItem('rar-v5-authorization-details');
		if (localSaved) {
			try {
				const parsed = JSON.parse(localSaved);
				console.log('💾 [RAR-V5] Loaded authorization details from localStorage (legacy):', parsed);
				return Array.isArray(parsed) ? parsed : [];
			} catch (error) {
				console.warn('[RAR-V5] Failed to parse saved authorization details:', error);
			}
		}

		// Use the example structure provided by user
		return [
			{
				type: 'payment_initiation',
				instructedAmount: {
					currency: 'USD',
					amount: '250.00',
				},
				creditorName: 'Acme Inc.',
				creditorAccount: {
					iban: 'DE02100100109307118603',
				},
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
	const [exampleViewMode, setExampleViewMode] = useState<'json' | 'formatted'>('formatted');

	// Track flow usage
	useEffect(() => {
		trackOAuthFlow('rar-v5', true, 'started');
	}, []);

	// Save credentials to localStorage whenever they change (debounced)
	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			try {
				localStorage.setItem('rar-v5-credentials', JSON.stringify(credentials));
				console.log('💾 [RAR-V5] Credentials saved to localStorage:', {
					environmentId: credentials.environmentId
						? `${credentials.environmentId.substring(0, 8)}...`
						: 'none',
					clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'none',
					hasClientSecret: !!credentials.clientSecret,
					redirectUri: credentials.redirectUri,
					scopes: credentials.scopes,
				});
			} catch (error) {
				console.warn('[RAR-V5] Failed to save credentials to localStorage:', error);
			}
		}, 500); // Debounce by 500ms
		
		return () => clearTimeout(debounceTimer);
	}, [credentials]);

	// Save authorization details to FlowStorageService (and localStorage for backward compatibility)
	useEffect(() => {
		try {
			// Save to FlowStorageService (preferred)
			FlowStorageService.AdvancedParameters.set('rar-v5', {
				authorizationDetails
			});
			console.log('💾 [RAR-V5] Authorization details saved to FlowStorageService:', authorizationDetails);

			// Also save to localStorage for backward compatibility
			localStorage.setItem('rar-v5-authorization-details', JSON.stringify(authorizationDetails));
			console.log('💾 [RAR-V5] Authorization details saved to localStorage (legacy):', authorizationDetails);
		} catch (error) {
			console.warn('[RAR-V5] Failed to save authorization details:', error);
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
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					return true;
				case 1:
					return !!(credentials.environmentId && credentials.clientId && credentials.clientSecret);
				case 2:
					return !!authUrl;
				case 3:
					return !!authCode;
				case 4:
					return !!tokens;
				case 5:
					return !!tokens;
				default:
					return false;
			}
		},
		[credentials, authUrl, authCode, tokens]
	);

	// Check if can navigate to next step
	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	// Handle step navigation
	const handleNext = useCallback(() => {
		if (canNavigateNext()) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [canNavigateNext]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
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

	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('rar-v5', currentStep, 'oauth');

		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'rar-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'rar-v5',
			tokens: tokens,
			credentials: credentials,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have tokens, pass them to Token Management
		if (tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'rar-v5');
			console.log('🔍 [RARFlowV5] Passing access token to Token Management via localStorage');
		}

		window.open('/token-management', '_blank');
	}, [tokens, credentials, currentStep]);

	// Handle authorization details update
	const updateAuthorizationDetail = useCallback((index: number, field: string, value: any) => {
		setAuthorizationDetails((prev: any[]) =>
			prev.map((detail: any, i: number) => (i === index ? { ...detail, [field]: value } : detail))
		);
	}, []);

	const addAuthorizationDetail = useCallback(() => {
		setAuthorizationDetails((prev: any[]) => [
			...prev,
			{
				type: 'payment_initiation',
				instructedAmount: { currency: 'USD', amount: '0.00' },
				creditorName: '',
				creditorAccount: { iban: '' },
			},
		]);
	}, []);

	const removeAuthorizationDetail = useCallback((index: number) => {
		setAuthorizationDetails((prev: any[]) => prev.filter((_: any, i: number) => i !== index));
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

			// Validate and add RAR authorization details using RARService
			const validation = RARService.validateAuthorizationDetails(authorizationDetails);
			if (!validation.valid) {
				throw new Error(`Invalid authorization details: ${validation.errors.join(', ')}`);
			}

			const validAuthorizationDetails = authorizationDetails.filter(
				(detail: any) =>
					detail.type &&
					detail.instructedAmount &&
					detail.creditorName &&
					detail.creditorAccount?.iban
			);

			params.append('authorization_details', JSON.stringify(validAuthorizationDetails));

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
				access_token:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiYXVkIjoiY2xpZW50X2lkIiwiZXhwIjoxNzM1ODQ5NjAwLCJpYXQiOjE3MzU4NDYwMDAsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRob3JpemF0aW9uX2RldGFpbHMiOlt7InR5cGUiOiJwYXltZW50X2luaXRpYXRpb24iLCJpbnN0cnVjdGVkQW1vdW50Ijp7ImN1cnJlbmN5IjoiVVNEIiwiYW1vdW50IjoiMjUwLjAwIn0sImNyZWRpdG9yTmFtZSI6IkFjbWUgSW5jLiIsImNyZWRpdG9yQWNjb3VudCI6eyJpYmFuIjoiREUwMjEwMDEwMDEwOTMwNzExODYwMyJ9fV19.signature',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: credentials.scopes,
				authorization_details: authorizationDetails.filter(
					(detail: any) =>
						detail.type &&
						detail.instructedAmount &&
						detail.creditorName &&
						detail.creditorAccount?.iban
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
						<FlowInfoCard
							flowInfo={
								getFlowInfo('rar') || {
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
								}
							}
						/>
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
								Set up your PingOne credentials and define the authorization details that will be
								requested using the Rich Authorization Requests (RAR) specification.
							</p>
						</ExplanationSection>

						<EnvironmentIdInput
							initialEnvironmentId={credentials.environmentId}
							onEnvironmentIdChange={(newEnvId) => {
								setCredentials((prev) => ({ ...prev, environmentId: newEnvId }));
							}}
							onIssuerUrlChange={() => {}}
							showSuggestions={true}
							autoDiscover={false}
						/>

						<FormGroup>
							<Label>Client ID</Label>
							<Input
								type="text"
								value={credentials.clientId}
								onChange={(e) => setCredentials((prev) => ({ ...prev, clientId: e.target.value }))}
								placeholder="Enter your Client ID"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Client Secret</Label>
							<Input
								type="password"
								value={credentials.clientSecret}
								onChange={(e) =>
									setCredentials((prev) => ({ ...prev, clientSecret: e.target.value }))
								}
								placeholder="Enter your Client Secret"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Redirect URI</Label>
							<Input
								type="text"
								value={credentials.redirectUri}
								onChange={(e) =>
									setCredentials((prev) => ({ ...prev, redirectUri: e.target.value }))
								}
								placeholder="https://localhost:3000/authz-callback"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Scopes</Label>
							<Input
								type="text"
								value={credentials.scopes}
								onChange={(e) => setCredentials((prev) => ({ ...prev, scopes: e.target.value }))}
								placeholder="openid profile email"
							/>
						</FormGroup>

						{/* RAR Example Display */}
						<ExampleSection>
							<ExampleHeader>
								<FiExternalLink />
								RAR Authorization Example
							</ExampleHeader>
							<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
								Here's an example of RAR authorization_details structure. You can use this as a
								starting point or create your own.
							</p>

							<ExampleContainer>
								<ExampleTabs>
									<ExampleTab
										active={exampleViewMode === 'json'}
										onClick={() => setExampleViewMode('json')}
									>
										<FiCode size={14} />
										JSON Structure
									</ExampleTab>
									<ExampleTab
										active={exampleViewMode === 'formatted'}
										onClick={() => setExampleViewMode('formatted')}
									>
										<FiEye size={14} />
										Formatted View
									</ExampleTab>
								</ExampleTabs>

								{exampleViewMode === 'json' ? (
									<JsonExampleContainer>
										<JsonExampleTitle>Raw JSON Example</JsonExampleTitle>
										<JsonExampleDisplay>
											{JSON.stringify(exampleAuthorizationDetails, null, 2)}
										</JsonExampleDisplay>
										<JsonExampleActions>
											<JsonExampleButton
												onClick={() => setAuthorizationDetails(exampleAuthorizationDetails)}
											>
												<FiCheckCircle size={14} />
												Use This Example
											</JsonExampleButton>
											<JsonExampleButton
												onClick={() =>
													navigator.clipboard.writeText(
														JSON.stringify(exampleAuthorizationDetails, null, 2)
													)
												}
											>
												<FiExternalLink size={14} />
												Copy JSON
											</JsonExampleButton>
										</JsonExampleActions>
									</JsonExampleContainer>
								) : (
									<FormattedExampleContainer>
										<FormattedExampleTitle>Formatted Example</FormattedExampleTitle>
										<FormattedExampleList>
											{exampleAuthorizationDetails.map((detail, index) => (
												<FormattedExampleItem key={index}>
													<FormattedExampleItemHeader>
														<strong>Type:</strong> {detail.type}
													</FormattedExampleItemHeader>
													<FormattedExampleDetails>
														<FormattedExampleDetail>
															<strong>instructedAmount:</strong>{' '}
															{detail.instructedAmount
																? `${detail.instructedAmount.currency} ${detail.instructedAmount.amount}`
																: 'Not set'}
														</FormattedExampleDetail>
														<FormattedExampleDetail>
															<strong>creditorName:</strong> {detail.creditorName || 'Not set'}
														</FormattedExampleDetail>
														<FormattedExampleDetail>
															<strong>creditorAccount.iban:</strong>{' '}
															{detail.creditorAccount?.iban || 'Not set'}
														</FormattedExampleDetail>
													</FormattedExampleDetails>
												</FormattedExampleItem>
											))}
										</FormattedExampleList>
										<JsonExampleActions>
											<JsonExampleButton
												onClick={() => setAuthorizationDetails(exampleAuthorizationDetails)}
											>
												<FiCheckCircle size={14} />
												Use This Example
											</JsonExampleButton>
										</JsonExampleActions>
									</FormattedExampleContainer>
								)}
							</ExampleContainer>
						</ExampleSection>

						<AuthorizationDetailsContainer>
							<Label>Authorization Details (RAR)</Label>
							<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
								Define the specific authorization details that will be requested using RAR. Use the
								example above or create your own.
							</p>

							{authorizationDetails.map((detail: any, index: number) => (
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
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
											Instructed Amount
										</Label>
										<DetailInput
											value={
												detail.instructedAmount
													? `${detail.instructedAmount.currency} ${detail.instructedAmount.amount}`
													: ''
											}
											onChange={(e) => {
												const [currency, amount] = e.target.value.split(' ');
												updateAuthorizationDetail(index, 'instructedAmount', { currency, amount });
											}}
											placeholder="USD 250.00"
										/>
									</div>
									<div style={{ minWidth: '150px' }}>
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
											Creditor Name
										</Label>
										<DetailInput
											value={detail.creditorName || ''}
											onChange={(e) =>
												updateAuthorizationDetail(index, 'creditorName', e.target.value)
											}
											placeholder="Acme Inc."
										/>
									</div>
									<div style={{ minWidth: '200px' }}>
										<Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
											Creditor Account
										</Label>
										<DetailInput
											value={detail.creditorAccount?.iban || ''}
											onChange={(e) =>
												updateAuthorizationDetail(index, 'creditorAccount', {
													iban: e.target.value,
												})
											}
											placeholder="DE02100100109307118603"
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
								The authorization_details parameter contains the specific permissions being
								requested.
							</p>
						</ExplanationSection>

						<Button
							onClick={handleGenerateAuthUrl}
							disabled={!credentials.environmentId || !credentials.clientId}
						>
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

								<ColoredUrlDisplay
									url={authUrl}
									label="Authorization URL with RAR Parameters"
									showCopyButton={true}
									showInfoButton={true}
									showOpenButton={true}
									onOpen={() => window.open(authUrl, '_blank')}
									height="120px"
								/>

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
										authorizationDetails: authorizationDetails.filter(
											(detail: any) =>
												detail.type &&
												detail.instructedAmount &&
												detail.creditorName &&
												detail.creditorAccount?.iban
										),
									})}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										theme: 'light',
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
								Exchange the authorization code for an access token. The token will contain the
								authorization details from the RAR request as claims.
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

						<Button onClick={handleTokenExchange} disabled={!authCode || isRequesting}>
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
									authorizationCode: authCode || '[authorization_code]',
								})}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									theme: 'light',
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
								<JWTTokenDisplay token={tokens.access_token} tokenType="access" />

								<SectionDivider />

								<FormGroup>
									<Label>Authorization Details Claims</Label>
									<CodeBlock>{JSON.stringify(tokens.authorization_details, null, 2)}</CodeBlock>
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
										onNavigateToTokenManagement={navigateToTokenManagement}
										onIntrospectToken={async (token: string) => {
											// Enhanced token introspection with 500ms delay and client secret check
											// Wait 500ms for PingOne to register token
											await new Promise(resolve => setTimeout(resolve, 500));

											// Check for required client secret for introspection
											if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
												throw new Error('Client secret required for token introspection. Please configure your credentials first.');
											}

											const request = {
												token: token,
												clientId: credentials.clientId,
												clientSecret: credentials.clientSecret,
												tokenTypeHint: 'access_token' as const,
											};

											try {
												// Use the reusable service to create API call data and execute introspection
												const result = await TokenIntrospectionService.introspectToken(
													request,
													'rar',
													'/api/introspect-token',
													`https://auth.pingone.com/${credentials.environmentId}/as/introspect`,
													'client_secret_post'
												);

												// Set the API call data for display
												setIntrospectionApiCall(result.apiCall);

												return result.response;
											} catch (error) {
												// Create error API call using reusable service
												const errorApiCall = TokenIntrospectionService.createErrorApiCall(
													request,
													'rar',
													error instanceof Error ? error.message : 'Unknown error',
													500,
													`https://auth.pingone.com/${credentials.environmentId}/as/introspect`
												);

												setIntrospectionApiCall(errorApiCall);
												throw error;
											}
										}}
									/>

									{/* API Call Display for Token Introspection */}
									{introspectionApiCall && (
										<EnhancedApiCallDisplay
											apiCall={introspectionApiCall}
											options={{
												showEducationalNotes: true,
												showFlowContext: true,
												urlHighlightRules:
													EnhancedApiCallDisplayService.getDefaultHighlightRules('rar'),
											}}
										/>
									)}
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
								RAR provides enhanced security through granular authorization details. Demonstrate
								security features with the RAR-enhanced access token.
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
			<FlowHeader flowId="rar" />

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

export default RARFlowV6;
