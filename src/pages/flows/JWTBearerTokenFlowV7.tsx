// src/pages/flows/JWTBearerTokenFlowV7.tsx
// OAuth 2.0 JWT Bearer Token Flow (RFC 7523) - V7 Service Architecture

import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
} from '@icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { readBestEnvironmentId } from '../../hooks/useAutoEnvironmentId';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
// Import V6 UI components
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { CopyButtonService } from '../../services/copyButtonService';
import { CredentialGuardService } from '../../services/credentialGuardService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import type { StepCredentials } from '../../services/flowCredentialService';
// Import V6 service architecture components
import { FlowHeader } from '../../services/flowHeaderService';
// Get shared UI components from FlowUIService
import { FlowUIService } from '../../services/flowUIService';
import ModalPresentationService from '../../services/modalPresentationService';
import { OAuthFlowComparisonService } from '../../services/oauthFlowComparisonService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Styled Components
const SectionDivider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
	margin: 2rem 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border: none;
	
	${(props) => {
		if (props.$variant === 'primary') {
			return `
				background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
				color: white;
				
				&:hover:not(:disabled) {
					background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
				}
			`;
		} else if (props.$variant === 'success') {
			return `
				background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
				color: white;
				
				&:hover:not(:disabled) {
					background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
				}
			`;
		} else {
			return `
				background: white;
				color: #374151;
				border: 1px solid #d1d5db;
				
				&:hover {
					background: #f9fafb;
					border-color: #9ca3af;
				}
			`;
		}
	}}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

// Step Metadata
const STEP_METADATA = [
	{
		title: 'Configuration & Credentials',
		subtitle: 'Configure JWT Bearer authentication',
		description: 'Set up credentials and JWT parameters',
	},
	{
		title: 'JWT Generation',
		subtitle: 'Create signed JWT assertion',
		description: 'Generate JWT with required claims and signature',
	},
	{
		title: 'Token Request',
		subtitle: 'Exchange JWT for access token',
		description: 'Send JWT assertion to token endpoint',
	},
	{
		title: 'Token Response',
		subtitle: 'Receive and validate access token',
		description: 'Process the returned access token',
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete the flow',
		description: 'Summary and next steps',
	},
];

// Types
interface JWTClaims {
	iss: string; // issuer (client_id)
	sub: string; // subject (client_id)
	aud: string; // audience (token endpoint)
	iat: number; // issued at
	exp: number; // expiration
	jti: string; // JWT ID
	[key: string]: unknown;
}

interface JWTSignature {
	algorithm: 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';
	privateKey: string;
	publicKey?: string;
}

// Main Component
const JWTBearerTokenFlowV7: React.FC = () => {
	// Get shared UI components from FlowUIService
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
		InfoBox,
		InfoTitle,
		InfoText,
		InfoList,
		FormGroup,
		Label,
		Input,
		TextArea: Textarea,
		GeneratedContentBox,
		ParameterGrid,
		ParameterLabel,
		ParameterValue,
		HelperText,
	} = FlowUIService.getFlowUIComponents();

	// Scroll management
	usePageScroll();

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		overview: true, // Collapsed
		security: true, // Collapsed
		implementation: true, // Collapsed
		credentials: false, // Expanded (JWT Bearer Configuration)
		endpoint: false, // Expanded (Token Endpoint Configuration) - FIXED: Now visible by default
		jwtBuilder: false, // Expanded (JWT Claims & Signature Builder)
		generatedJWT: false, // Expanded (Generated JWT)
		tokenRequest: true, // Collapsed
		tokenResponse: true, // Collapsed
		completion: true, // Collapsed
	});

	// JWT Configuration with defaults
	const [environmentId, setEnvironmentId] = useState(() => readBestEnvironmentId());
	const [clientId, setClientId] = useState('');
	const [tokenEndpoint, setTokenEndpoint] = useState('https://auth.pingone.com/as/token');
	const [audience, setAudience] = useState('https://auth.pingone.com/as/token');
	const [scopes, setScopes] = useState('openid');

	// JWT Claims with better defaults
	const [jwtClaims, setJwtClaims] = useState<JWTClaims>({
		iss: 'https://auth.pingone.com', // Issuer should be the authorization server, not client ID
		sub: '', // Subject will be set to client ID when user enters it
		aud: 'https://auth.pingone.com/as/token', // Audience is the token endpoint
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
		jti: `jwt-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique JWT ID
	});

	// JWT Signature
	const [jwtSignature, setJwtSignature] = useState<JWTSignature>({
		algorithm: 'RS256',
		privateKey: '',
		publicKey: '',
	});

	// Generated JWT
	const [generatedJWT, setGeneratedJWT] = useState('');
	const [tokenResponse, setTokenResponse] = useState<Record<string, unknown> | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);
	const [showMissingJWTFieldsModal, setShowMissingJWTFieldsModal] = useState(false);
	const [missingJWTFields, setMissingJWTFields] = useState<string[]>([]);
	const [isDiscoveringAudience, setIsDiscoveringAudience] = useState(false);

	// Only JWT Bearer Configuration should be expanded by default
	const shouldCollapseAll = false;

	// Flow key for credential storage
	const FLOW_KEY = 'jwt-bearer-v6';

	// Toggle section handler
	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('🔄 [JWTBearerTokenFlowV7] Loading credentials with comprehensive service...');

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: FLOW_KEY,
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log('✅ [JWTBearerTokenFlowV7] Found flow-specific credentials');
				if (flowData.sharedEnvironment?.environmentId)
					setEnvironmentId(flowData.sharedEnvironment.environmentId);
				if (flowData.flowCredentials.clientId) setClientId(flowData.flowCredentials.clientId);
				if (flowData.flowCredentials.scopes) {
					const scopesValue = Array.isArray(flowData.flowCredentials.scopes)
						? flowData.flowCredentials.scopes.join(' ')
						: flowData.flowCredentials.scopes;
					setScopes(scopesValue || 'openid');
				}
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [JWTBearerTokenFlowV7] Using shared environment data only');
				setEnvironmentId(flowData.sharedEnvironment.environmentId);
			} else {
				console.log('ℹ️ [JWTBearerTokenFlowV7] No saved credentials found');
			}
		};

		loadCredentials();
	}, []);

	// Save credentials when they change
	const saveCredentials = useCallback(
		async (updatedCredentials: Partial<StepCredentials>) => {
			const credentials: StepCredentials = {
				environmentId,
				clientId,
				scopes,
				...updatedCredentials,
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
					scopes: Array.isArray(scopes) ? scopes : scopes ? [scopes] : [],
					tokenEndpointAuthMethod: 'none', // JWT Bearer uses the assertion itself for authentication (RFC 7523)
					lastUpdated: Date.now(),
				},
			});

			if (!success) {
				console.error('[JWTBearerTokenFlowV7] Failed to save credentials to comprehensive service');
			}

			console.log('💾 [JWTBearerTokenFlowV7] Credentials saved:', credentials);
		},
		[environmentId, clientId, scopes]
	);

	// Generate JWT ID
	const generateJWTId = useCallback(() => {
		const jti = `jwt_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
		setJwtClaims((prev) => ({ ...prev, jti }));
	}, []);

	// Discover audience from OIDC endpoint
	const discoverAudience = useCallback(async () => {
		// Enhanced validation with better error messages
		if (!environmentId || environmentId.trim() === '') {
			console.warn('⚠️ [JWT Bearer] Cannot discover audience - Environment ID is empty');
			v4ToastManager.showWarning('Please enter an Environment ID first');
			return;
		}

		// Additional validation for environment ID format
		const trimmedEnvId = environmentId.trim();
		if (!trimmedEnvId || trimmedEnvId.length < 10) {
			console.warn('⚠️ [JWT Bearer] Environment ID appears to be invalid:', trimmedEnvId);
			v4ToastManager.showWarning('Please enter a valid Environment ID');
			return;
		}

		setIsDiscoveringAudience(true);
		try {
			console.log('🔍 [JWT Bearer] Discovering audience for environment:', trimmedEnvId);

			// Construct issuer URL from environment ID
			const issuerUrl = `https://auth.pingone.com/${trimmedEnvId}/as`;
			console.log('🔍 [JWT Bearer] Constructed issuer URL:', issuerUrl);

			// Validate issuer URL before calling discovery
			if (!issuerUrl || typeof issuerUrl !== 'string' || !issuerUrl.startsWith('https://')) {
				throw new Error('Invalid issuer URL constructed');
			}

			// Perform OIDC discovery with validated issuer URL
			if (!issuerUrl || issuerUrl.trim() === '') {
				throw new Error('Issuer URL is required and must be a string');
			}
			const result = await oidcDiscoveryService.discover({ issuerUrl: issuerUrl.trim() });

			if (result.document?.issuer) {
				const discoveredAudience = result.document.issuer;
				setAudience(discoveredAudience);
				setJwtClaims((prev) => ({ ...prev, aud: discoveredAudience }));
				console.log('✅ [JWT Bearer] Audience discovered:', discoveredAudience);
				v4ToastManager.showSuccess('Audience discovered and populated!');
			} else {
				throw new Error('No issuer found in OIDC discovery document');
			}
		} catch (error) {
			console.error('❌ [JWT Bearer] Failed to discover audience:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			v4ToastManager.showError(
				`Failed to discover audience: ${errorMessage}. Please enter manually.`
			);
		} finally {
			setIsDiscoveringAudience(false);
		}
	}, [environmentId]);

	// Generate sample RSA key pair (for educational/testing purposes)
	const generateSampleKeyPair = useCallback(() => {
		// Sample 2048-bit RSA private key (for educational purposes only)
		const samplePrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGvH7GvJqF0Q1l
XxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYX
fmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYX8vN0jkz5EqDn
VqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9v
BQYXvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDn
VqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9v
BQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqD
nVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9
vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJAgMBAAECggEAEqDnVqP0nwBzB8vAUQYXfm
gKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lX
xS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXf
mgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1l
XxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYX
fmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1
lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQY
XfmgKx8TqhJDH4YXNqkLVqaQKBgQDx8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8
TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y
5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx
8TqhJDH4YXNqkLVqaP8QvL5KqU0fQKBgQDSOmfEXamplE7IvQZD0JqH/GUjQqQsq
R4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8
QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQs
qR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP
8QvL5KqU0fNgF3qJF5UxXqwKBgBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5
KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4z
K3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL
5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4
zK3mDvW+pX8vN0jkz5AoGBAIvQZD0JqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqD
nVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9
vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5Eq
DnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL
9vBQYXGvH7GvJqF0AoGAEqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8
QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQs
qR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP
8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQ
sqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqa
P8QvL5KqU0fNgF3qJF5UxXqL9vBQYX=
-----END PRIVATE KEY-----`;

		const samplePublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxrx+xryahdENZV8Uu2OU
6i/VySqh/xlI0KkLKkeMyt5g71vqV/LzdI5M+RKg51aj9J8AcwfLwFEGF35oCsfE
6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGF/LzdI5M+RKg51aj9J8A
cwfLwFEGF35oCsfE6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGF7x+
xryahdENZV8Uu2OU6i/VySqh/xlI0KkLKkeMyt5g71vqV/LzdI5M+RKg51aj9J8A
cwfLwFEGF35oCsfE6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGFxrx
+xryahdENZV8Uu2OU6i/VySqh/xlI0KkLKkeMyt5g71vqV/LzdI5M+RKg51aj9J8
AcwfLwFEGF35oCsfE6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGFxrx
+xryahdENZV8Uu2OU6i/VyQIDAQAB
-----END PUBLIC KEY-----`;

		setJwtSignature((prev) => ({
			...prev,
			privateKey: samplePrivateKey,
			publicKey: samplePublicKey,
		}));

		v4ToastManager.showSuccess('Sample RSA key pair generated! (For educational purposes only)');
		console.log('🔑 [JWT Bearer] Generated sample RSA-2048 key pair');
	}, []);

	// Auto-update JWT Claims when clientId, tokenEndpoint, or audience changes (from OIDC Discovery or manual entry)
	useEffect(() => {
		setJwtClaims((prev) => ({
			...prev,
			iss: prev.iss, // Keep issuer as authorization server, don't change to client ID
			sub: clientId || prev.sub, // Subject should be the client ID
			aud: audience || tokenEndpoint || prev.aud, // Prioritize audience, fallback to tokenEndpoint
		}));
		console.log(
			'🔄 [JWT Bearer] Auto-updated JWT claims with audience:',
			audience || tokenEndpoint
		);
	}, [clientId, tokenEndpoint, audience]);

	// Generate JWT
	const generateJWT = useCallback(() => {
		// Determine audience value (prioritize manually set aud, then audience field, then tokenEndpoint)
		const audienceValue = jwtClaims.aud || audience || tokenEndpoint;

		// Build list of missing fields
		const missing: string[] = [];

		console.log('🔍 [JWT Generation Validation]', {
			clientId: clientId || '❌ EMPTY',
			tokenEndpoint: tokenEndpoint || '❌ EMPTY',
			audience: audience || '❌ EMPTY',
			audienceValue: audienceValue || '❌ EMPTY',
			'jwtClaims.aud': jwtClaims.aud || '❌ EMPTY',
			privateKey: jwtSignature.privateKey
				? `✓ (${jwtSignature.privateKey.length} chars)`
				: '❌ EMPTY',
		});

		if (!clientId || clientId.trim() === '') missing.push('Client ID');
		if (!tokenEndpoint || tokenEndpoint.trim() === '') missing.push('Token Endpoint');
		if (!audienceValue || audienceValue.trim() === '') missing.push('Audience');
		if (!jwtSignature.privateKey || jwtSignature.privateKey.trim() === '')
			missing.push('Private Key');

		if (missing.length > 0) {
			console.warn('⚠️ [JWT Generation] Missing required fields:', missing);
			setMissingJWTFields(missing);
			setShowMissingJWTFieldsModal(true);
			return;
		}

		try {
			// Update claims with current values
			const claims: JWTClaims = {
				...jwtClaims,
				iss: clientId,
				sub: clientId,
				aud: audienceValue,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			// For demo purposes, create a mock JWT (in real implementation, you'd use a JWT library)
			const header = {
				alg: jwtSignature.algorithm,
				typ: 'JWT',
			};

			const encodedHeader = btoa(JSON.stringify(header));
			const encodedPayload = btoa(JSON.stringify(claims));
			const signature = `mock_signature_${Date.now()}`; // Mock signature
			const encodedSignature = btoa(signature);

			const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
			setGeneratedJWT(jwt);

			v4ToastManager.showSuccess('JWT generated successfully!');
		} catch (error) {
			console.error('[JWT Bearer] Error generating JWT:', error);
			v4ToastManager.showError('Failed to generate JWT');
		}
	}, [clientId, tokenEndpoint, jwtClaims, jwtSignature, audience]);

	// Make token request
	const makeTokenRequest = useCallback(async () => {
		if (!generatedJWT || !clientId || !tokenEndpoint) {
			v4ToastManager.showWarning('Please generate a JWT first');
			return;
		}

		setIsLoading(true);
		try {
			// MOCK IMPLEMENTATION - Simulating network delay
			console.log('[JWT Bearer Mock] Simulating token request...');
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

			// MOCK IMPLEMENTATION - Generate mock JWT access token that matches displayed values
			const now = Math.floor(Date.now() / 1000);
			const exp = now + 3600; // 1 hour from now

			// Create JWT header and payload
			const header = {
				alg: 'RS256',
				typ: 'JWT',
				kid: 'mock-key-id',
			};

			const payload = {
				sub: clientId,
				client_id: clientId,
				iss: tokenEndpoint.replace('/token', ''), // issuer is the base URL
				aud: audience || tokenEndpoint.replace('/token', ''),
				scope: scopes || 'openid',
				iat: now,
				exp: exp,
				jti: `mock_jti_${Math.random().toString(36).substr(2, 16)}`,
				token_use: 'access',
				_mock: true,
				_note: 'Mock JWT Bearer access token for educational purposes',
			};

			// Encode to create mock JWT (base64url encoding)
			const encodedHeader = btoa(JSON.stringify(header))
				.replace(/=/g, '')
				.replace(/\+/g, '-')
				.replace(/\//g, '_');
			const encodedPayload = btoa(JSON.stringify(payload))
				.replace(/=/g, '')
				.replace(/\+/g, '-')
				.replace(/\//g, '_');
			const mockSignature = `mock_signature_${Math.random().toString(36).substr(2, 43)}`;
			const mockAccessToken = `${encodedHeader}.${encodedPayload}.${mockSignature}`;

			// MOCK IMPLEMENTATION - Generate mock token response
			const mockTokenResponse = {
				access_token: mockAccessToken, // Now a proper JWT that can be decoded
				token_type: 'Bearer',
				expires_in: 3600,
				scope: scopes || 'openid',
				_mock: true, // Indicator that this is a mock response
				_note:
					'This is a simulated response for educational purposes. PingOne does not support JWT Bearer assertions.',
			};

			console.log('[JWT Bearer Mock] Mock token response:', mockTokenResponse);
			setTokenResponse(mockTokenResponse);
			setCurrentStep(3); // Move to token response step
			v4ToastManager.showSuccess(
				'Mock access token generated successfully! (Educational simulation)'
			);
		} catch (error) {
			console.error('[JWT Bearer Mock] Error in simulation:', error);
			v4ToastManager.showError('Failed to simulate token request');
		} finally {
			setIsLoading(false);
		}
	}, [generatedJWT, clientId, tokenEndpoint, scopes, audience]);

	// Step validation
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					return true; // Configuration always valid
				case 1:
					return !!generatedJWT; // JWT must be generated
				case 2:
					return !!generatedJWT; // JWT must be generated for request
				case 3:
					return !!tokenResponse; // Token response must be received
				case 4:
					return !!tokenResponse; // Completion available when tokens received
				default:
					return false;
			}
		},
		[generatedJWT, tokenResponse]
	);

	// Navigation handlers
	const handleNext = useCallback(() => {
		if (currentStep === 0) {
			// For JWT Bearer flow Step 0, we only need: environmentId, clientId
			// Private key is entered in Step 1 (JWT Generation)
			const credentials = {
				environmentId,
				clientId,
			};

			const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(
				credentials as Record<string, unknown>,
				{
					requiredFields: ['environmentId', 'clientId'],
					fieldLabels: {
						environmentId: 'Environment ID',
						clientId: 'Client ID',
					},
				}
			);

			if (!canProceed) {
				setMissingCredentialFields(missingFields);
				setShowMissingCredentialsModal(true);
				console.warn('⚠️ [JWTBearerTokenFlowV6] Missing required credentials', { missingFields });
				return;
			}
		}

		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep, environmentId, clientId]);

	const handlePrev = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setGeneratedJWT('');
		setTokenResponse(null);
		setIsLoading(false);
	}, []);

	const handleStartOver = useCallback(() => {
		const flowKey = 'jwt-bearer-token-v6';
		sessionStorage.removeItem(`${flowKey}-tokens`);
		sessionStorage.removeItem('restore_step');
		setCurrentStep(0);
		setGeneratedJWT('');
		setTokenResponse(null);

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

			console.log(
				'🔄 [JWTBearerTokenFlowV6] Starting over: cleared tokens/JWT, ConfigChecker cache, keeping credentials'
			);
		} catch (error) {
			console.warn('[JWTBearerTokenFlowV6] Failed to clear cache data:', error);
		}

		v4ToastManager.showSuccess('Flow restarted', {
			description: 'Tokens, JWT, and cache cleared. Credentials preserved.',
		});
	}, []);

	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	// Step content renderers
	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						{/* Educational Content */}
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> JWT Bearer Flow Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>JWT Bearer Token Flow (RFC 7523)</InfoTitle>
											<InfoText>
												The JWT Bearer Token flow enables OAuth clients to authenticate using JWT
												assertions instead of traditional client credentials. Perfect for
												server-to-server scenarios.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="error">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Educational Mock Implementation</InfoTitle>
											<InfoText>
												This is a mock implementation for educational purposes. PingOne does not
												currently support JWT Bearer assertions for client authentication.
											</InfoText>
											<InfoText
												style={{
													marginTop: '0.5rem',
													color: '#dc2626',
													fontWeight: '600',
													backgroundColor: '#fee2e2',
													padding: '0.75rem',
													borderRadius: '0.5rem',
													border: '2px solid #ef4444',
												}}
											>
												<strong>⚠️ SIMULATION WARNING:</strong> This is a simulated/mock
												implementation for learning purposes only.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{/* Token Endpoint Configuration */}
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('endpoint')}
								aria-expanded={!collapsedSections.endpoint}
							>
								<CollapsibleTitle>
									<FiExternalLink /> Token Endpoint Configuration
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.endpoint}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.endpoint && (
								<CollapsibleContent>
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
										<Label>Audience (Optional)</Label>
										<Input
											type="text"
											value={audience}
											onChange={(e) => setAudience(e.target.value)}
											placeholder="https://api.example.com"
										/>
									</FormGroup>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />

						{/* Credentials Configuration */}
						<ComprehensiveCredentialsService
							flowType="jwt-bearer-token-v7" // Used to detect JWT Bearer and disable auth method selector
							// Discovery props
							onDiscoveryComplete={(result) => {
								console.log('[JWT Bearer V6] Discovery completed:', result);

								// Auto-populate Token Endpoint and Audience (always update from discovery)
								if (result.document) {
									if (result.document.token_endpoint) {
										setTokenEndpoint(result.document.token_endpoint);
										console.log(
											'[JWT Bearer V6] Token endpoint auto-populated:',
											result.document.token_endpoint
										);
									}
									if (result.document.issuer) {
										setAudience(result.document.issuer);
										console.log('[JWT Bearer V6] Audience auto-populated:', result.document.issuer);
									}
								}

								// Try to extract environment ID from multiple sources
								let extractedEnvId: string | null = null;

								// 1. Try from issuerUrl
								if (result.issuerUrl) {
									const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
									if (envIdMatch?.[1]) {
										extractedEnvId = envIdMatch[1];
									}
								}

								// 2. Try from document.issuer if available
								if (!extractedEnvId && result.document?.issuer) {
									const envIdMatch = result.document.issuer.match(/\/([a-f0-9-]{36})\//i);
									if (envIdMatch?.[1]) {
										extractedEnvId = envIdMatch[1];
									}
								}

								// Update environment ID if extracted
								if (extractedEnvId) {
									setEnvironmentId(extractedEnvId);
									console.log('[JWT Bearer V6] Environment ID extracted:', extractedEnvId);
								}

								v4ToastManager.showSuccess(
									'Token Endpoint and Audience auto-populated from OIDC Discovery'
								);
							}}
							discoveryPlaceholder="Enter Environment ID, issuer URL, or OIDC provider..."
							showProviderInfo={true}
							// Credentials props
							environmentId={environmentId}
							clientId={clientId}
							clientSecret="" // Not needed for JWT Bearer
							scopes={scopes}
							// Change handlers
							onEnvironmentIdChange={(value) => {
								setEnvironmentId(value);
								saveCredentials({ environmentId: value });
							}}
							onClientIdChange={(value) => {
								setClientId(value);
								saveCredentials({ clientId: value });
							}}
							onScopesChange={(value) => {
								setScopes(value);
								saveCredentials({ scopes: value });
							}}
							// Save handlers
							onSave={async () => {
								await saveCredentials({});
								v4ToastManager.showSuccess('Configuration saved');
							}}
							hasUnsavedChanges={false}
							isSaving={false}
							// Field visibility
							requireClientSecret={false}
							showRedirectUri={false}
							showPostLogoutRedirectUri={false}
							showLoginHint={false}
							// Show auth method selector with "none" but disabled (JWT Bearer uses assertion for auth)
							clientAuthMethod="none"
							allowedAuthMethods={['none']}
							// Display config
							title="JWT Bearer Configuration"
							subtitle="Configure environment, client ID, and scopes"
							defaultCollapsed={shouldCollapseAll}
							showAdvancedConfig={false} // No need for PingOne advanced settings in JWT Bearer
						/>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleHeader
							title="JWT Claims & Signature Builder"
							theme="blue"
							isCollapsed={collapsedSections.jwtBuilder}
							onToggle={() => toggleSection('jwtBuilder')}
						>
							<div style={{ padding: '1.5rem' }}>
								<InfoBox $variant="info">
									<FiInfo size={20} />
									<div>
										<InfoTitle>JWT Claims Configuration</InfoTitle>
										<InfoText>
											Configure the JWT claims and signature algorithm. The JWT will be used as a
											client assertion in the token request.
										</InfoText>
									</div>
								</InfoBox>

								<FormGroup>
									<Label>Issuer (iss) *</Label>
									<Input
										type="text"
										value={jwtClaims.iss}
										onChange={(e) => setJwtClaims((prev) => ({ ...prev, iss: e.target.value }))}
										placeholder="https://auth.pingone.com"
									/>
									<HelperText style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
										<FiInfo size={14} style={{ marginRight: '0.5rem' }} />
										The issuer should be the authorization server URL, not the client ID
									</HelperText>
								</FormGroup>

								<FormGroup>
									<Label>Subject (sub) *</Label>
									<Input
										type="text"
										value={jwtClaims.sub}
										onChange={(e) => setJwtClaims((prev) => ({ ...prev, sub: e.target.value }))}
										placeholder="your-client-id"
									/>
								</FormGroup>

								<FormGroup>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<Label style={{ margin: 0 }}>Audience (aud) *</Label>
										<Button
											onClick={() => {
												console.log(
													'🔍 [JWT Bearer] Auto Discover clicked, environmentId:',
													environmentId
												);
												if (!environmentId || environmentId.trim() === '') {
													console.warn('⚠️ [JWT Bearer] Button clicked but environmentId is empty');
													v4ToastManager.showWarning('Please enter an Environment ID first');
													return;
												}
												discoverAudience();
											}}
											disabled={
												!environmentId || environmentId.trim() === '' || isDiscoveringAudience
											}
											$variant="secondary"
											style={{
												padding: '0.25rem 0.5rem',
												fontSize: '0.75rem',
												display: 'flex',
												alignItems: 'center',
												gap: '0.25rem',
												backgroundColor:
													environmentId && environmentId.trim() !== '' ? '#10b981' : '#6b7280',
												color: '#ffffff',
												border: 'none',
												cursor:
													environmentId && environmentId.trim() !== '' ? 'pointer' : 'not-allowed',
												opacity: !environmentId || environmentId.trim() === '' ? 0.5 : 1,
											}}
											title={
												environmentId && environmentId.trim() !== ''
													? 'Auto-discover audience from OIDC endpoint'
													: 'Enter Environment ID first'
											}
										>
											{isDiscoveringAudience ? (
												<>
													<FiRefreshCw size={12} className="animate-spin" />
													<span>Discovering...</span>
												</>
											) : (
												<>
													<FiExternalLink size={12} />
													<span>Auto-discover</span>
												</>
											)}
										</Button>
									</div>
									<Input
										type="text"
										value={jwtClaims.aud}
										onChange={(e) => setJwtClaims((prev) => ({ ...prev, aud: e.target.value }))}
										placeholder="https://auth.example.com"
									/>
									<HelperText style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
										<FiInfo size={14} style={{ marginRight: '0.5rem' }} />
										Click "Auto-discover" to fetch the audience from the OIDC discovery endpoint.
									</HelperText>
								</FormGroup>

								<FormGroup>
									<Label>Expiration Time (exp) *</Label>
									<Input
										type="number"
										value={jwtClaims.exp}
										onChange={(e) =>
											setJwtClaims((prev) => ({ ...prev, exp: parseInt(e.target.value, 10) }))
										}
										placeholder="1640995200"
									/>
								</FormGroup>

								<FormGroup>
									<Label>JWT ID (jti) *</Label>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Input
											type="text"
											value={jwtClaims.jti}
											onChange={(e) => setJwtClaims((prev) => ({ ...prev, jti: e.target.value }))}
											placeholder="unique-jwt-id"
										/>
										<Button onClick={generateJWTId} $variant="secondary">
											<FiRefreshCw /> Generate
										</Button>
									</div>
								</FormGroup>

								<FormGroup>
									<Label>Signature Algorithm</Label>
									<select
										value={jwtSignature.algorithm}
										onChange={(e) =>
											setJwtSignature((prev) => ({
												...prev,
												algorithm: e.target.value as JWTSignature['algorithm'],
											}))
										}
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
										}}
									>
										<option value="RS256">RS256 (RSA with SHA-256)</option>
										<option value="RS384">RS384 (RSA with SHA-384)</option>
										<option value="RS512">RS512 (RSA with SHA-512)</option>
										<option value="ES256">ES256 (ECDSA with SHA-256)</option>
										<option value="ES384">ES384 (ECDSA with SHA-384)</option>
										<option value="ES512">ES512 (ECDSA with SHA-512)</option>
									</select>
								</FormGroup>

								<FormGroup style={{ marginTop: '2rem' }}>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '0.75rem',
										}}
									>
										<Label>Private Key (PEM format) *</Label>
										<Button
											onClick={generateSampleKeyPair}
											$variant="secondary"
											style={{
												padding: '0.5rem 1rem',
												fontSize: '0.875rem',
												backgroundColor: '#10b981',
												color: '#ffffff',
											}}
										>
											<FiKey /> Generate Sample Key Pair
										</Button>
									</div>
									<Textarea
										value={jwtSignature.privateKey}
										onChange={(e) =>
											setJwtSignature((prev) => ({ ...prev, privateKey: e.target.value }))
										}
										placeholder="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."
										rows={10}
										style={{ marginBottom: '0.75rem' }}
									/>
									<HelperText style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
										<FiInfo size={14} style={{ marginRight: '0.5rem' }} />
										Click "Generate Sample Key Pair" to create a test RSA-2048 key pair for
										educational purposes.
									</HelperText>
								</FormGroup>

								<Button
									onClick={generateJWT}
									$variant="primary"
									style={{
										backgroundColor: '#0066cc',
										color: '#ffffff',
										fontWeight: 600,
										fontSize: '1rem',
										padding: '0.75rem 1.5rem',
									}}
								>
									<FiKey /> Generate Access Token from JWT
								</Button>
							</div>
						</CollapsibleHeader>

						{generatedJWT &&
							UnifiedTokenDisplayService.showTokens(
								{ access_token: generatedJWT }, // Pass JWT as access_token
								'oauth',
								'jwt-bearer-v6',
								{
									showCopyButtons: true,
									showDecodeButtons: true,
								}
							)}
					</>
				);

			case 2:
				return (
					<CollapsibleSection>
						<CollapsibleHeaderButton
							onClick={() => toggleSection('tokenRequest')}
							aria-expanded={!collapsedSections.tokenRequest}
						>
							<CollapsibleTitle>
								<FiExternalLink /> Token Request
							</CollapsibleTitle>
							<CollapsibleToggleIcon $collapsed={collapsedSections.tokenRequest}>
								<FiChevronDown />
							</CollapsibleToggleIcon>
						</CollapsibleHeaderButton>
						{!collapsedSections.tokenRequest && (
							<CollapsibleContent>
								<InfoBox $variant="warning">
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>🎓 JWT Bearer Token Request</InfoTitle>
										<InfoText>
											This demonstrates how a JWT Bearer token request would be sent to an OAuth 2.0
											server that supports RFC 7523. The assertion parameter contains the signed JWT
											that proves the client's identity.
										</InfoText>
										<InfoText style={{ marginTop: '0.5rem' }}>
											<strong>Note:</strong> PingOne does not support JWT Bearer assertions, but
											many other OAuth providers do. Below are real-world examples of providers that
											support JWT Bearer grant type.
										</InfoText>
									</div>
								</InfoBox>

								{/* Real-world JWT Bearer Examples */}
								<div style={{ marginBottom: '1.5rem' }}>
									<h4
										style={{
											margin: '0 0 1rem 0',
											fontSize: '1rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										🌐 Real-World JWT Bearer Examples
									</h4>
									<div style={{ display: 'grid', gap: '0.75rem' }}>
										<button
											type="button"
											onClick={() => setTokenEndpoint('https://oauth2.googleapis.com/token')}
											style={{
												padding: '0.75rem',
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
												fontSize: '0.875rem',
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												textAlign: 'left',
												width: '100%',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#f1f5f9';
												e.currentTarget.style.borderColor = '#3b82f6';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#f8fafc';
												e.currentTarget.style.borderColor = '#e2e8f0';
											}}
										>
											<div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
												🔵 Google Cloud Platform
											</div>
											<div style={{ color: '#6b7280', fontFamily: 'monospace' }}>
												https://oauth2.googleapis.com/token
											</div>
											<div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
												Supports JWT Bearer for service account authentication
											</div>
										</button>

										<button
											type="button"
											onClick={() =>
												setTokenEndpoint(
													'https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token'
												)
											}
											style={{
												padding: '0.75rem',
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
												fontSize: '0.875rem',
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												textAlign: 'left',
												width: '100%',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#f1f5f9';
												e.currentTarget.style.borderColor = '#3b82f6';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#f8fafc';
												e.currentTarget.style.borderColor = '#e2e8f0';
											}}
										>
											<div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
												🟠 Microsoft Azure AD
											</div>
											<div style={{ color: '#6b7280', fontFamily: 'monospace' }}>
												https://login.microsoftonline.com/&#123;tenant-id&#125;/oauth2/v2.0/token
											</div>
											<div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
												Supports JWT Bearer for application authentication
											</div>
										</button>

										<button
											type="button"
											onClick={() => setTokenEndpoint('https://{pingfederate-host}:9031/as/token')}
											style={{
												padding: '0.75rem',
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
												fontSize: '0.875rem',
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												textAlign: 'left',
												width: '100%',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#f1f5f9';
												e.currentTarget.style.borderColor = '#3b82f6';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#f8fafc';
												e.currentTarget.style.borderColor = '#e2e8f0';
											}}
										>
											<div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
												🟢 PingFederate
											</div>
											<div style={{ color: '#6b7280', fontFamily: 'monospace' }}>
												https://&#123;pingfederate-host&#125;:9031/as/token
											</div>
											<div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
												Supports JWT Bearer for enterprise authentication
											</div>
										</button>

										<button
											type="button"
											onClick={() => setTokenEndpoint('https://{pingone-ais-host}/oauth/token')}
											style={{
												padding: '0.75rem',
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
												fontSize: '0.875rem',
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												textAlign: 'left',
												width: '100%',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#f1f5f9';
												e.currentTarget.style.borderColor = '#3b82f6';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#f8fafc';
												e.currentTarget.style.borderColor = '#e2e8f0';
											}}
										>
											<div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
												🟣 PingOne Advanced Identity Cloud
											</div>
											<div style={{ color: '#6b7280', fontFamily: 'monospace' }}>
												https://&#123;pingone-ais-host&#125;/oauth/token
											</div>
											<div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
												Supports JWT Bearer (RFC 7523) for advanced identity scenarios
											</div>
										</button>
									</div>

									<div
										style={{
											marginTop: '1rem',
											padding: '0.75rem',
											background: '#fef3c7',
											border: '1px solid #f59e0b',
											borderRadius: '6px',
											fontSize: '0.875rem',
											color: '#92400e',
										}}
									>
										<strong>💡 Tip:</strong> Click on any example above to use it as your token
										endpoint, or enter your own OAuth provider's token endpoint that supports JWT
										Bearer grant type.
									</div>
								</div>

								<GeneratedContentBox>
									<ParameterGrid>
										<ParameterLabel>Request URL</ParameterLabel>
										<ParameterValue>{tokenEndpoint}</ParameterValue>

										<ParameterLabel>Method</ParameterLabel>
										<ParameterValue>POST</ParameterValue>

										<ParameterLabel>Content-Type</ParameterLabel>
										<ParameterValue>application/x-www-form-urlencoded</ParameterValue>

										<ParameterLabel>grant_type</ParameterLabel>
										<ParameterValue>urn:ietf:params:oauth:grant-type:jwt-bearer</ParameterValue>

										<ParameterLabel>assertion</ParameterLabel>
										<ParameterValue style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
											{generatedJWT || 'Generate JWT first'}
										</ParameterValue>

										<ParameterLabel>scope</ParameterLabel>
										<ParameterValue>{scopes || 'Not specified'}</ParameterValue>
									</ParameterGrid>
								</GeneratedContentBox>

								<Button
									onClick={makeTokenRequest}
									variant="success"
									disabled={!generatedJWT || isLoading}
								>
									{isLoading ? <FiRefreshCw className="animate-spin" /> : <FiExternalLink />}
									{isLoading ? 'Requesting Token...' : 'Make Token Request'}
								</Button>
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				);

			case 3:
				return (
					<>
						{tokenResponse && (
							<>
								<InfoBox $variant="success" style={{ marginBottom: '2rem' }}>
									<FiCheckCircle size={20} />
									<div>
										<InfoTitle>Access Token Received!</InfoTitle>
										<InfoText>
											The JWT Bearer Token flow has completed successfully. You now have an access
											token that can be used to access protected resources.
										</InfoText>
									</div>
								</InfoBox>

								{/* Token Response Parameters */}
								<CollapsibleSection>
									<CollapsibleHeaderButton
										onClick={() => toggleSection('tokenResponse')}
										aria-expanded={!collapsedSections.tokenResponse}
									>
										<CollapsibleTitle>
											<FiCheckCircle /> Token Response
										</CollapsibleTitle>
										<CollapsibleToggleIcon $collapsed={collapsedSections.tokenResponse}>
											<FiChevronDown />
										</CollapsibleToggleIcon>
									</CollapsibleHeaderButton>
									{!collapsedSections.tokenResponse && (
										<CollapsibleContent>
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
													onClick={() =>
														CopyButtonService.copyToClipboard(tokenResponse.access_token)
													}
													$variant="secondary"
												>
													<FiCopy /> Copy Access Token
												</Button>
												<Button
													onClick={() =>
														CopyButtonService.copyToClipboard(
															JSON.stringify(tokenResponse, null, 2)
														)
													}
													$variant="secondary"
												>
													<FiCopy /> Copy Full Response
												</Button>
											</div>
										</CollapsibleContent>
									)}
								</CollapsibleSection>

								{/* Access Token Display with Decode */}
								{UnifiedTokenDisplayService.showTokens(
									tokenResponse, // Pass full token response
									'oauth',
									'jwt-bearer-v6',
									{
										showCopyButtons: true,
										showDecodeButtons: true,
									}
								)}
							</>
						)}
					</>
				);

			case 4:
				return (
					<FlowCompletionService
						config={FlowCompletionConfigs.jwtBearer}
						collapsed={collapsedSections.completion}
						onToggleCollapsed={() => toggleSection('completion')}
					/>
				);

			default:
				return <div>Invalid step</div>;
		}
	}, [
		currentStep,
		collapsedSections,
		toggleSection,
		clientId,
		tokenEndpoint,
		audience,
		scopes,
		jwtClaims,
		jwtSignature,
		generatedJWT,
		tokenResponse,
		isLoading,
		makeTokenRequest,
		discoverAudience,
		environmentId,
		generateJWT,
		generateJWTId,
		generateSampleKeyPair,
		isDiscoveringAudience,
		saveCredentials,
		CollapsibleContent,
		CollapsibleHeaderButton,
		CollapsibleSection,
		CollapsibleTitle,
		CollapsibleToggleIcon,
		FormGroup,
		GeneratedContentBox,
		HelperText,
		InfoBox,
		InfoText,
		InfoTitle,
		Input,
		Label,
		ParameterGrid,
		ParameterLabel,
		ParameterValue,
		Textarea,
	]);

	// Main render
	return (
		<Container>
			<FlowHeader flowId="jwt-bearer-token-v7" />

			<ContentWrapper>
				{/* Mock Implementation Warning */}
				<InfoBox $variant="error" style={{ marginBottom: '2rem' }}>
					<FiAlertTriangle size={24} />
					<div>
						<InfoTitle>🎓 Educational Mock Implementation</InfoTitle>
						<InfoText>
							This is a <strong>mock/educational implementation</strong> of the JWT Bearer Token
							flow. PingOne does not currently support JWT Bearer assertions for client
							authentication.
						</InfoText>
						<InfoText
							style={{
								marginTop: '0.75rem',
								color: '#dc2626',
								fontWeight: '600',
								backgroundColor: '#fee2e2',
								padding: '0.75rem',
								borderRadius: '0.5rem',
								border: '2px solid #ef4444',
							}}
						>
							<strong>⚠️ SIMULATION WARNING:</strong> This is a simulated/mock implementation for
							learning purposes only.
						</InfoText>
						<InfoText style={{ marginTop: '0.5rem' }}>
							<strong>What you'll learn:</strong>
						</InfoText>
						<InfoList>
							<li>How JWT Bearer Token flow works (RFC 7523)</li>
							<li>JWT structure and claims for client assertions</li>
							<li>Cryptographic signature algorithms (RS256, ES256, etc.)</li>
							<li>Private key management and PKI concepts</li>
							<li>Enterprise server-to-server authentication patterns</li>
						</InfoList>
						<InfoText style={{ marginTop: '0.5rem' }}>
							This flow demonstrates the concepts and provides a simulation of how JWT Bearer
							authentication would work in production OAuth 2.0 servers that support this grant
							type.
						</InfoText>
					</div>
				</InfoBox>

				<SectionDivider />

				{/* Flow Comparison Table */}
				{OAuthFlowComparisonService.getComparisonTable({
					highlightFlow: 'jwt',
					collapsed: false,
				})}

				<SectionDivider />

				<MainCard>
					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>
			</ContentWrapper>

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

			{/* JWT Generation Validation Modal */}
			<ModalPresentationService
				isOpen={showMissingJWTFieldsModal}
				onClose={() => setShowMissingJWTFieldsModal(false)}
				title="JWT Generation Requirements"
				description={
					missingJWTFields.length > 0
						? `Please provide the following required field${missingJWTFields.length > 1 ? 's' : ''} before generating the JWT:`
						: 'All required fields must be filled to generate a JWT.'
				}
				actions={[
					{
						label: "OK, I'll fill them in",
						onClick: () => setShowMissingJWTFieldsModal(false),
						variant: 'primary',
					},
				]}
			>
				{missingJWTFields.length > 0 && (
					<ul style={{ marginTop: '1rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
						{missingJWTFields.map((field) => (
							<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#d97706' }}>
								{field}
							</li>
						))}
					</ul>
				)}
			</ModalPresentationService>
		</Container>
	);
};

export default JWTBearerTokenFlowV7;
