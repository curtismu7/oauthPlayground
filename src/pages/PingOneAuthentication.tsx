import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiBook, FiCheck, FiSettings } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { callbackUriService } from '../services/callbackUriService';
import ModalPresentationService from '../services/modalPresentationService';
import { CredentialGuardService } from '../services/credentialGuardService';
import HEBLoginPopup, { type HEBLoginCredentials, type HEBBrandingOverrides } from '../components/HEBLoginPopup';
import { useDavinciBranding } from '../hooks/useDavinciBranding';
import AuthorizationUrlValidationModal from '../components/AuthorizationUrlValidationModal';
import { authorizationUrlValidationService } from '../services/authorizationUrlValidationService';
import type { ParsedAuthorizationUrl } from '../services/authorizationUrlValidationService';
import { AuthenticationModalService } from '../services/authenticationModalService';
import { FlowHeader } from '../services/flowHeaderService';
import ColoredUrlDisplay from '../components/ColoredUrlDisplay';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import UnifiedTokenDisplayService from '../services/unifiedTokenDisplayService';
import PingOneApplicationPicker from '../components/PingOneApplicationPicker';
import { getWorkerToken as getPingOneWorkerToken, type PingOneApplication } from '../services/pingOneApplicationService';

type LoginMode = 'redirect' | 'redirectless';

export interface PlaygroundConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	responseType: string;
	tokenEndpointAuthMethod: string;
	region?: string; // PingOne region (us, eu, ap, ca, na)
}

export interface PlaygroundResult {
	timestamp: number;
	mode: LoginMode;
	responseType: string;
	tokens: Record<string, string>;
	config: PlaygroundConfig;
	authUrl: string;
	context: {
		isRedirectless: boolean;
		redirectlessUsername?: string;
		resumeUrl?: string | null;
		flowId?: string | null;
	};
}

export const RESPONSE_TYPES = [
	{ value: 'code', label: 'code (Authorization Code)' },
	{ value: 'token', label: 'token (Implicit)' },
	{ value: 'id_token', label: 'id_token (Implicit)' },
	{ value: 'code id_token', label: 'code id_token (Hybrid)' },
	{ value: 'code token', label: 'code token (Hybrid)' },
	{ value: 'code id_token token', label: 'code id_token token (Hybrid)' }
];

export const STORAGE_KEY = 'pingone_login_playground_config';
export const RESULT_STORAGE_KEY = 'pingone_login_playground_result';
export const FLOW_CONTEXT_KEY = 'pingone_login_playground_context';
export const REDIRECT_FLOW_CONTEXT_KEY = 'pingone_redirect_flow_context';
export const REDIRECTLESS_FLOW_CONTEXT_KEY = 'pingone_redirectless_flow_context';
export const REDIRECTLESS_CREDS_KEY = 'pingone_login_redirectless_creds';
export const WORKER_CREDENTIALS_KEY = 'pingone_worker_credentials';

export const DEFAULT_CONFIG: PlaygroundConfig = {
	environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
	clientId: 'sample-client-id-1234',
	clientSecret: 'sample-client-secret-shhh',
	redirectUri: callbackUriService.getCallbackUri('p1authCallback'),
	scopes: 'openid',
	responseType: 'code',
	tokenEndpointAuthMethod: 'client_secret_post'
};

const DEFAULT_REDIRECTLESS_CREDS = {
	username: '',
	password: '',
	codeVerifier: '',
	codeChallenge: ''
};

const TOKEN_ENDPOINT_AUTH_METHODS = [
	{ value: 'client_secret_post', label: 'Client Secret POST', description: 'Send client credentials in request body' },
	{ value: 'client_secret_basic', label: 'Client Secret Basic', description: 'Send client credentials in Authorization header' },
	{ value: 'client_secret_jwt', label: 'Client Secret JWT', description: 'Use JWT signed with client secret' },
	{ value: 'private_key_jwt', label: 'Private Key JWT', description: 'Use JWT signed with private key' },
	{ value: 'none', label: 'None', description: 'No client authentication (public clients)' }
];

// Styled Components
const Page = styled.div`
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
	background: white;
	min-height: 100vh;
	padding: 2rem;
	margin-left: 320px;
	margin-top: 100px;
	transition: margin 0.3s ease;

	@media (max-width: 1024px) {
		margin-left: 0;
		margin-top: 100px;
		padding: 1rem;
	}
`;

const Card = styled.div`
	max-width: 100%;
	box-sizing: border-box;
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	padding: 2rem;
	margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
	color: #333;
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: 1rem;
`;

const Callout = styled.div`
	background: #f8f9fa;
	border-left: 4px solid #007bff;
	padding: 1rem;
	margin-bottom: 1.5rem;
	border-radius: 4px;
`;

const Field = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	color: #333;
	font-weight: 500;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 1rem;
	color: #333;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 1rem;
	color: #333;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
`;

// Flow log display components
const FlowLogContainer = styled.div`
	margin-top: 2rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	overflow-x: auto;
	max-width: 100%;
	box-sizing: border-box;
`;

const FlowLogTitle = styled.h3`
	color: white;
	margin: 0 0 1.5rem 0;
	font-size: 1.5rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const FlowStep = styled.div<{ $status?: number }>`
	overflow-x: auto;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
	background: white;
	border-radius: 8px;
	padding: 1.25rem;
	margin-bottom: 1rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	border-left: 4px solid ${props => {
		if (!props.$status) return '#6c757d';
		if (props.$status >= 200 && props.$status < 300) return '#28a745';
		if (props.$status >= 400) return '#dc3545';
		return '#ffc107';
	}};
`;

const StepHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
`;

const StepNumber = styled.div<{ $status?: number }>`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: ${props => {
		if (!props.$status) return '#6c757d';
		if (props.$status >= 200 && props.$status < 300) return '#28a745';
		if (props.$status >= 400) return '#dc3545';
		return '#ffc107';
	}};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 0.9rem;
`;

const StepTitle = styled.div`
	font-weight: 600;
	color: #2c3e50;
	font-size: 1.1rem;
	flex: 1;
`;

const StepMethod = styled.span<{ $method: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	background: ${props => {
		switch (props.$method) {
			case 'POST': return '#007bff';
			case 'GET': return '#28a745';
			case 'UI': return '#ff9800';
			default: return '#6c757d';
		}
	}};
	color: white;
`;

const StepStatus = styled.span<{ $status: number }>`
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	background: ${props => {
		if (props.$status >= 200 && props.$status < 300) return '#d4edda';
		if (props.$status >= 400) return '#f8d7da';
		return '#fff3cd';
	}};
	color: ${props => {
		if (props.$status >= 200 && props.$status < 300) return '#155724';
		if (props.$status >= 400) return '#721c24';
		return '#856404';
	}};
`;

const StepUrl = styled.div`
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.85rem;
	color: #495057;
	background: #f8f9fa;
	padding: 0.75rem;
	border-radius: 4px;
	margin-bottom: 0.75rem;
	word-break: break-all;
	overflow-wrap: break-word;
	overflow-x: auto;
	max-width: 100%;
`;

const StepParams = styled.div`
	margin-bottom: 0.75rem;
	max-width: 100%;
	overflow-x: auto;
	box-sizing: border-box;
`;

const ParamItem = styled.div`
	display: flex;
	gap: 0.5rem;
	padding: 0.5rem;
	background: #f8f9fa;
	border-radius: 4px;
	margin-bottom: 0.25rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.85rem;
	max-width: 100%;
	overflow-x: auto;
	box-sizing: border-box;
`;

const ParamKey = styled.span`
	font-weight: 600;
	color: #007bff;
	min-width: 120px;
	flex-shrink: 0;
	@media (max-width: 768px) {
		min-width: 100px;
		font-size: 0.9rem;
	}
`;

const ParamValue = styled.span`
	color: #6c757d;
	word-break: break-word;
	overflow-wrap: break-word;
	flex: 1;
	min-width: 0;
`;

const StepNote = styled.div`
	background: #e7f3ff;
	border-left: 3px solid #007bff;
	padding: 0.75rem;
	border-radius: 4px;
	font-size: 0.9rem;
	color: #004085;
	margin-top: 0.75rem;
	line-height: 1.6;
	white-space: pre-wrap;
	word-wrap: break-word;
	overflow-wrap: break-word;
	overflow-x: hidden;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
`;

const StepResponse = styled.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: #d4edda;
	border-radius: 4px;
	border: 1px solid #c3e6cb;
	overflow-x: auto;
	max-width: 100%;
`;

const ResponseTitle = styled.div`
	font-weight: 600;
	color: #155724;
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const ToggleButton = styled.button`
	background: transparent;
	border: 1px solid #155724;
	color: #155724;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	
	&:hover {
		background: #155724;
		color: white;
	}
`;

const FullResponseContainer = styled.div`
	overflow-x: auto;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
	margin-top: 0.75rem;
	padding: 1rem;
	background: white;
	border-radius: 4px;
	border: 1px solid #e5e7eb;
	font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	max-height: 600px;
	overflow-y: auto;
	word-break: break-word;
`;

const JSONKeySpan = styled.span`
	color: #dc2626; /* Red for keys - per user preference */
	font-weight: 600;
`;

const JSONValueSpan = styled.span`
	color: #3b82f6; /* Blue for values - per user preference */
`;

const JSONPunctuationSpan = styled.span`
	color: #6b7280; /* Gray for punctuation */
`;

const Modes = styled.div`
	display: grid;
	grid-template-columns: 1fr 1.5fr 1fr;
	gap: 1rem;
	margin-bottom: 2rem;
`;

const ModeButton = styled.button<{ $active: boolean }>`
	padding: 1rem;
	border: 2px solid ${props => props.$active ? '#0ea5e9' : '#cbd5f5'};
	border-radius: 8px;
	background: ${props => props.$active ? '#0ea5e9' : '#f1f5f9'};
	color: ${props => props.$active ? '#ffffff' : '#334155'};
	font-weight: ${props => props.$active ? '700' : '500'};
	box-shadow: ${props => props.$active ? '0 8px 16px rgba(14, 165, 233, 0.25)' : 'none'};
	cursor: pointer;
	transition: all 0.25s ease;

	&:hover {
		border-color: #0ea5e9;
		background: ${props => props.$active ? '#0284c7' : '#e2e8f0'};
		color: ${props => props.$active ? '#ffffff' : '#0f172a'};
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.35);
	}
`;

const ModeDetails = styled.div`
	grid-column: 2;
	padding: 1rem;
	background: #e0f2fe;
	border-radius: 8px;
	color: #0f172a;
	font-weight: 600;
`;

const LaunchButton = styled.button`
	background: #28a745;
	color: white;
	border: none;
	padding: 1rem 2rem;
	border-radius: 8px;
	font-size: 1.1rem;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	margin-bottom: 2rem;
	
	&:hover:not(:disabled) {
		background: #218838;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`;

const ComedyLogin = styled.div`
	background: #fff3cd;
	border: 1px solid #ffeaa7;
	border-radius: 8px;
	padding: 1.75rem;
	margin-top: 2rem;
	margin-bottom: 2rem;
`;

const ComedyHeading = styled.h3`
	color: #856404;
	margin-bottom: 1rem;
	font-size: 1.2rem;
`;

const ComedyText = styled.p`
	color: #856404;
	margin-bottom: 1rem;
`;

const ComedyButton = styled.button`
	background: #ffc107;
	color: #212529;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	
	&:hover {
		background: #e0a800;
	}
`;

const ConfigActions = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
	margin-bottom: 2rem;
`;

const SaveButton = styled.button`
	background: #007bff;
	color: white;
	border: none;
	padding: 0.875rem 1.75rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	font-size: 0.95rem;
	
	&:hover:not(:disabled) {
		background: #0056b3;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`;

const CancelButton = styled.button`
	background: #6c757d;
	color: white;
	border: none;
	padding: 0.875rem 1.75rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	font-size: 0.95rem;
	
	&:hover:not(:disabled) {
		background: #545b62;
	}
	
	&:disabled {
		background: #adb5bd;
		cursor: not-allowed;
	}
`;

	// Helper function to format JSON with red keys and blue values
	const formatJSONForDisplay = (data: unknown, indent = 0): React.ReactNode => {
		if (data === null) {
			return <JSONValueSpan>null</JSONValueSpan>;
		}
		
		if (typeof data === 'boolean') {
			return <JSONValueSpan>{String(data)}</JSONValueSpan>;
		}
		
		if (typeof data === 'number') {
			return <JSONValueSpan>{String(data)}</JSONValueSpan>;
		}
		
		if (typeof data === 'string') {
			return <JSONValueSpan>&quot;{data}&quot;</JSONValueSpan>;
		}
		
		if (Array.isArray(data)) {
			if (data.length === 0) {
				return <JSONPunctuationSpan>[]</JSONPunctuationSpan>;
			}
			
			return (
				<>
					<JSONPunctuationSpan>[</JSONPunctuationSpan>
					<br />
					{data.map((item, index) => (
						<React.Fragment key={index}>
							{'  '.repeat(indent + 1)}
							{formatJSONForDisplay(item, indent + 1)}
							{index < data.length - 1 && <JSONPunctuationSpan>,</JSONPunctuationSpan>}
							<br />
						</React.Fragment>
					))}
					{'  '.repeat(indent)}
					<JSONPunctuationSpan>]</JSONPunctuationSpan>
				</>
			);
		}
		
		if (typeof data === 'object') {
			const entries = Object.entries(data);
			if (entries.length === 0) {
				return <JSONPunctuationSpan>{}</JSONPunctuationSpan>;
			}
			
			return (
				<>
					<JSONPunctuationSpan>{'{'}</JSONPunctuationSpan>
					<br />
					{entries.map(([key, value], index) => (
						<React.Fragment key={key}>
							{'  '.repeat(indent + 1)}
							<JSONKeySpan>&quot;{key}&quot;</JSONKeySpan>
							<JSONPunctuationSpan>: </JSONPunctuationSpan>
							{formatJSONForDisplay(value, indent + 1)}
							{index < entries.length - 1 && <JSONPunctuationSpan>,</JSONPunctuationSpan>}
							<br />
						</React.Fragment>
					))}
					{'  '.repeat(indent)}
					<JSONPunctuationSpan>{'}'}</JSONPunctuationSpan>
				</>
			);
		}
		
		return <span>{String(data)}</span>;
	};

	const PingOneAuthentication: React.FC = () => {
	const navigate = useNavigate();
	const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
	const [mode, setMode] = useState<LoginMode>('redirect');
	const [loading, setLoading] = useState(false);
	const [gettingWorkerToken, setGettingWorkerToken] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
	const [redirectlessCreds, setRedirectlessCreds] = useState(DEFAULT_REDIRECTLESS_CREDS);
	const [hebLoginOpen, setHebLoginOpen] = useState(false);
	const [expandedResponses, setExpandedResponses] = useState<Record<string | number, boolean>>({});
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);
	const [showUrlValidationModal, setShowUrlValidationModal] = useState(false);
	const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);
	const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
	const [pendingAuthUrl, setPendingAuthUrl] = useState<string>('');
	const [urlValidationResult, setUrlValidationResult] = useState<{
		isValid: boolean;
		errors: string[];
		warnings: string[];
		suggestions: string[];
		parsedUrl: ParsedAuthorizationUrl | null;
		flowType: string;
		severity: string;
	} | null>(null);
	const { branding, hasBranding, openDesignStudio } = useDavinciBranding();
	// Store latest real tokens to render with Decode/Copy
	const [latestTokens, setLatestTokens] = useState<Record<string, string> | null>(null);
	// Worker token for PingOne API access
	const [workerToken, setWorkerToken] = useState<string | null>(null);
	// Track selected application to detect grant types
	const [selectedApplication, setSelectedApplication] = useState<PingOneApplication | null>(null);
	// Separate worker credentials for Application Picker
	const [workerCredentials, setWorkerCredentials] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		tokenEndpointAuthMethod: 'client_secret_post' as 'client_secret_post' | 'client_secret_basic'
	});
	const [showWorkerCredentialsModal, setShowWorkerCredentialsModal] = useState(false);
	const [hasLoadedWorkerCredentials, setHasLoadedWorkerCredentials] = useState(false);

	const hebBrandingOverrides = useMemo<HEBBrandingOverrides>(() => {
		const overrides: HEBBrandingOverrides = {
			title: 'HEB',
			subtitle: 'Sign in to your HEB account',
		};

		if (!branding || !hasBranding) {
			return overrides;
		}

		if (branding.modalTitle && branding.modalTitle.trim()) {
			overrides.title = branding.modalTitle.trim();
		} else if (branding.wordmarkText && branding.wordmarkText.trim()) {
			overrides.title = branding.wordmarkText.trim();
		}
		if (branding.subtitleText && branding.subtitleText.trim()) {
			overrides.subtitle = branding.subtitleText.trim();
		}
		if (branding.primaryColor) {
			overrides.primaryColor = branding.primaryColor;
		}
		if (branding.secondaryColor) {
			overrides.secondaryColor = branding.secondaryColor;
		}
		if (branding.headerBackgroundImage) {
			overrides.headerBackgroundImage = branding.headerBackgroundImage;
		}
		if (branding.logoUrl) {
			overrides.logoUrl = branding.logoUrl;
		}
		if (branding.wordmarkText && branding.wordmarkText.trim()) {
			overrides.logoText = branding.wordmarkText.trim();
		}
		if (branding.wordmarkColor) {
			overrides.wordmarkColor = branding.wordmarkColor;
		}
		if (branding.subtitleColor) {
			overrides.subtitleColor = branding.subtitleColor;
		}
		if (branding.logoBackgroundColor) {
			overrides.logoBackgroundColor = branding.logoBackgroundColor;
		}
		if (branding.logoBorderColor) {
			overrides.logoBorderColor = branding.logoBorderColor;
		}
		if (branding.contentBackground) {
			overrides.contentBackground = branding.contentBackground;
		}
		if (branding.contentTextColor) {
			overrides.contentTextColor = branding.contentTextColor;
		}
		if (branding.formAccentColor) {
			overrides.formAccentColor = branding.formAccentColor;
		}

		return overrides;
	}, [branding, hasBranding]);
	// Flow request log for educational display
	const [flowRequestLog, setFlowRequestLog] = useState<Array<{
		step: number;
		title: string;
		method: string;
		url: string;
		params: Record<string, string>;
		requestBody?: Record<string, unknown>; // Full JSON request body sent to PingOne
		response?: Record<string, string | number | boolean>;
		fullResponse?: Record<string, unknown>; // Full PingOne JSON response
		status?: number;
		note: string;
		timestamp: number;
	}>>([]);
	
	// Store flow context when popup opens so we can continue after credentials are collected
	const [pendingFlowContext, setPendingFlowContext] = useState<{
		flowId: string;
		flowLinks: Record<string, { href?: string }>;
		sessionCookies: string[];
		resumeUrl: string;
		codeVerifier: string;
		state: string;
	} | null>(null);

	// Load saved config on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				setConfig(prev => ({
					...prev,
					...parsed,
					responseType: parsed?.responseType || prev.responseType || DEFAULT_CONFIG.responseType,
					tokenEndpointAuthMethod: parsed?.tokenEndpointAuthMethod || prev.tokenEndpointAuthMethod || DEFAULT_CONFIG.tokenEndpointAuthMethod
				}));
			}
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to load saved config:', error);
		} finally {
			setHasLoadedConfig(true);
		}
	}, []);

	// Load saved worker credentials on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(WORKER_CREDENTIALS_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				setWorkerCredentials({
					environmentId: parsed.environmentId || '',
					clientId: parsed.clientId || '',
					clientSecret: parsed.clientSecret || '',
					tokenEndpointAuthMethod: parsed.tokenEndpointAuthMethod || 'client_secret_post'
				});
			}
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to load worker credentials:', error);
		} finally {
			setHasLoadedWorkerCredentials(true);
		}
	}, []);

	// Auto-save worker credentials changes
	useEffect(() => {
		if (!hasLoadedWorkerCredentials) {
			return;
		}
		try {
			localStorage.setItem(WORKER_CREDENTIALS_KEY, JSON.stringify(workerCredentials));
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to persist worker credentials:', error);
		}
	}, [workerCredentials, hasLoadedWorkerCredentials]);

	// Auto-save config changes
	useEffect(() => {
		if (!hasLoadedConfig) {
			return;
		}
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to persist config:', error);
		}
	}, [config, hasLoadedConfig]);

	// Load redirectless credentials
	useEffect(() => {
		try {
			const saved = localStorage.getItem(REDIRECTLESS_CREDS_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				setRedirectlessCreds({
					username: parsed.username ?? DEFAULT_REDIRECTLESS_CREDS.username,
					password: parsed.password ?? DEFAULT_REDIRECTLESS_CREDS.password,
					codeVerifier: parsed.codeVerifier ?? DEFAULT_REDIRECTLESS_CREDS.codeVerifier,
					codeChallenge: parsed.codeChallenge ?? DEFAULT_REDIRECTLESS_CREDS.codeChallenge
				});
			}
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to load redirectless credentials:', error);
		}
	}, []);

	// Auto-save redirectless credentials
	useEffect(() => {
		try {
			localStorage.setItem(REDIRECTLESS_CREDS_KEY, JSON.stringify(redirectlessCreds));
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to persist redirectless credentials:', error);
		}
	}, [redirectlessCreds]);

	const updateConfig = useCallback((field: keyof PlaygroundConfig, value: string) => {
		setConfig(prev => ({ ...prev, [field]: value }));
	}, []);

	// Check if selected application is Client Credentials only
	// TODO: Future refactoring - This page should use ComprehensiveCredentialsService instead of manual detection
	// ComprehensiveCredentialsService already handles this logic in a centralized way
	const isClientCredentialsOnly = useMemo(() => {
		if (!selectedApplication) return false;
		// First check if the application type is SERVICE (client credentials)
		if (selectedApplication.type === 'SERVICE') {
			console.log('🔍 [PingOneAuthentication] Detected SERVICE type app');
			return true;
		}
		// Also check if only client_credentials grant type is present (fallback detection)
		if (selectedApplication.grantTypes && selectedApplication.grantTypes.length === 1 && selectedApplication.grantTypes.includes('client_credentials')) {
			console.log('🔍 [PingOneAuthentication] Detected single client_credentials grant');
			return true;
		}
		console.log('🔍 [PingOneAuthentication] Not client credentials', { type: selectedApplication.type, grantTypes: selectedApplication.grantTypes });
		return false;
	}, [selectedApplication]);

	const handleApplicationSelect = useCallback((application: PingOneApplication) => {
		console.log('🔍 [PingOneAuthentication] Application selected:', {
			name: application.name,
			clientId: application.clientId,
			hasClientSecret: !!application.clientSecret,
			redirectUris: application.redirectUris,
			scopes: application.scopes,
			tokenEndpointAuthMethod: application.tokenEndpointAuthMethod,
			type: application.type,
			grantTypes: application.grantTypes
		});

		// Auto-fill credentials from selected application
		setConfig(prev => ({
			...prev,
			clientId: application.clientId,
			clientSecret: application.clientSecret || prev.clientSecret, // Keep existing if no secret
			redirectUri: application.redirectUris?.[0] || prev.redirectUri, // Use first redirect URI
			scopes: application.scopes?.join(' ') || prev.scopes, // Join scopes with spaces
			tokenEndpointAuthMethod: application.tokenEndpointAuthMethod || prev.tokenEndpointAuthMethod
		}));

		// Store selected application for grant type detection
		setSelectedApplication(application);

		// Store logout URI for display/use (not part of PlaygroundConfig but useful info)
		if (application.postLogoutRedirectUris?.[0]) {
			console.log('🔍 [PingOneAuthentication] Application has logout URI:', application.postLogoutRedirectUris[0]);
			// You could store this in a separate state or localStorage if needed for other flows
		}

		const logoutUriInfo = application.postLogoutRedirectUris?.[0] ? ' (including logout URI)' : '';
		v4ToastManager.showSuccess(`Application "${application.name}" selected and credentials filled${logoutUriInfo}`);
	}, []);

    const handleGetWorkerToken = useCallback(async () => {
        // If no worker credentials are saved, show modal to collect them
        if (!workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret) {
            setShowWorkerCredentialsModal(true);
            return;
        }

        setGettingWorkerToken(true);
        try {
            const token = await getPingOneWorkerToken({
                environmentId: workerCredentials.environmentId,
                clientId: workerCredentials.clientId,
                clientSecret: workerCredentials.clientSecret,
                tokenEndpointAuthMethod: workerCredentials.tokenEndpointAuthMethod,
            });
            setWorkerToken(token);
            v4ToastManager.showSuccess('Worker token obtained! You can now select applications.');
        } catch (error) {
            console.error('[PingOneAuthentication] Error getting worker token:', error);
            v4ToastManager.showError(
                error instanceof Error ? error.message : 'Failed to get worker token'
            );
        } finally {
            setGettingWorkerToken(false);
        }
    }, [workerCredentials]);

	const handleSaveConfig = useCallback(async () => {
		setIsSaving(true);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
			v4ToastManager.showSuccess('Credentials saved to storage');
		} catch (error) {
			console.error('[PingOneAuthentication] Failed to save config:', error);
			v4ToastManager.showError('Failed to save credentials');
		} finally {
			setIsSaving(false);
		}
	}, [config]);

	const authUrl = useMemo(() => {
		// Construct region-aware authorization endpoint
		const regionDomains: Record<string, string> = {
			us: 'auth.pingone.com',
			eu: 'auth.pingone.eu',
			ap: 'auth.pingone.asia',
			ca: 'auth.pingone.ca',
			na: 'auth.pingone.com'
		};
		const domain = regionDomains[config.region || 'us'] || 'auth.pingone.com';
		const base = `https://${domain}/${config.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			response_type: config.responseType,
			client_id: config.clientId,
			scope: config.scopes,
			state: 'pi-flow-' + Date.now()
		});
		
		// Add response_mode=pi.flow for redirectless mode (pi.flow doesn't require redirect_uri)
		// For redirect mode, include redirect_uri but NOT response_mode=pi.flow
		if (mode === 'redirectless') {
			params.set('response_mode', 'pi.flow');
			// NOTE: redirect_uri is NOT required for pi.flow per PingOne docs
			// When omitted, PingOne returns flow response directly without redirects
		} else {
			// Redirect mode: include redirect_uri but use standard OAuth flow
			params.set('redirect_uri', config.redirectUri);
		}
		
		return `${base}?${params.toString()}`;
	}, [config.environmentId, config.clientId, config.responseType, config.redirectUri, config.scopes, mode]);

	const generateRedirectPKCE = useCallback(async () => {
		if (config.responseType === 'code') {
			const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			
			// Store PKCE codes for redirect flow
			sessionStorage.setItem('pkce_code_verifier', codeVerifier);
			sessionStorage.setItem('pkce_code_challenge', codeChallenge);
			
			console.log('🔐 [PingOneAuthentication] Stored PKCE codes:', {
				verifierKey: 'pkce_code_verifier',
				challengeKey: 'pkce_code_challenge',
				verifierLength: codeVerifier.length,
				challengeLength: codeChallenge.length
			});
			
			// Return URL with PKCE parameters
			const base = `https://auth.pingone.com/${config.environmentId}/as/authorize`;
			const params = new URLSearchParams({
				response_type: config.responseType,
				client_id: config.clientId,
				redirect_uri: config.redirectUri,
				scope: config.scopes,
				state: 'pi-flow-' + Date.now(),
				code_challenge: codeChallenge,
				code_challenge_method: 'S256'
			});
			return `${base}?${params.toString()}`;
		}
		return authUrl;
	}, [config, authUrl]);

		const runRedirectlessLogin = useCallback(async (providedCredentials?: { username: string; password: string }) => {
		// Use provided credentials if available, otherwise fall back to state
		const creds = providedCredentials || redirectlessCreds;
		
		// HEB login should happen first - credentials must be collected before starting flow
		if (!creds.username || !creds.password) {
			console.log('🔍 [PingOneAuthentication] Credentials not available - HEB login should happen first', {
				hasProvidedCredentials: !!providedCredentials,
				hasStateCredentials: !!(redirectlessCreds.username && redirectlessCreds.password),
				creds
			});
			v4ToastManager.showError('Please complete HEB login first');
			return;
		}
		
		// Debug: Log credential details (without exposing actual values)
		console.log('🔍 [PingOneAuthentication] Using credentials:', {
			usernameLength: creds.username.length,
			usernamePreview: creds.username.substring(0, 3) + '...',
			passwordLength: creds.password.length,
			hasSpecialChars: /[^a-zA-Z0-9]/.test(creds.password),
			source: providedCredentials ? 'provided' : 'state'
		});

		setLoading(true);
		// Clear previous log and flow context
		setFlowRequestLog([]);
		setPendingFlowContext(null);
		
		try {
			const environmentId = config.environmentId.trim() || DEFAULT_CONFIG.environmentId;
			const state = `pi-flow-${Date.now()}`;
			
			// Generate PKCE codes for redirectless authorization code flow
			const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			
			// Store PKCE codes and credentials for later use
			setRedirectlessCreds(prev => ({
				...prev,
				username: creds.username,
				password: creds.password,
				codeVerifier,
				codeChallenge
			}));

			// Step 1: Start Authorization Flow
			// Per documentation: POST /as/authorize with response_mode=pi.flow (NO credentials)
			// PingOne returns JSON flow object with flowId and status
			v4ToastManager.showInfo('Starting PingOne authorization flow...');
			
			const step1RequestBody = {
				environmentId: environmentId,
				clientId: config.clientId.trim() || DEFAULT_CONFIG.clientId,
				clientSecret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret,
				redirectUri: config.redirectUri.trim() || DEFAULT_CONFIG.redirectUri, // Include redirect_uri even for pi.flow
				scopes: config.scopes.trim() || DEFAULT_CONFIG.scopes,
				codeChallenge: codeChallenge,
				codeChallengeMethod: 'S256',
				state: state
				// NO credentials in Step 1 per documentation
			};
			
			setFlowRequestLog(prev => [...prev, {
				step: 1,
				title: 'Start Authorization Flow',
				method: 'POST',
				url: `https://auth.pingone.com/${environmentId}/as/authorize`,
				params: {
					response_type: 'code',
					response_mode: 'pi.flow',
					client_id: config.clientId.trim() || DEFAULT_CONFIG.clientId,
					scope: config.scopes.trim() || DEFAULT_CONFIG.scopes,
					code_challenge: codeChallenge.substring(0, 20) + '...',
					code_challenge_method: 'S256',
					state: state
				},
				requestBody: step1RequestBody, // Store full request body
				note: `Step 1: POST /as/authorize with response_mode=pi.flow. NO username/password here. PingOne returns JSON flow object with flowId and status (e.g., USERNAME_PASSWORD_REQUIRED).

💡 OPTIONAL: login_hint_token - You can optionally include a login_hint_token JWT parameter in this request. This is a signed JWT containing user identification (username, email, phone, sub) that helps PingOne identify the user. Since you've already authenticated the user in your app (HEB login), including login_hint_token can help PingOne pre-populate user information and potentially streamline the flow.`,
				timestamp: Date.now()
			}]);
			
			const authorizeResponse = await fetch('/api/pingone/redirectless/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(step1RequestBody)
			});

			if (!authorizeResponse.ok) {
				let errorBody: Record<string, unknown> = {};
				let errorMessage = `Authorization request failed (status ${authorizeResponse.status})`;
				try {
					errorBody = await authorizeResponse.json();
					console.log('🔍 [PingOneAuthentication] Authorization error:', JSON.stringify(errorBody, null, 2));
					errorMessage = errorBody?.error_description as string || errorBody?.message as string || errorBody?.error as string || errorMessage;
					
					// Provide more specific error messages based on error type
					if (errorBody?.error === 'dns_resolution_failed') {
						errorMessage = 'Cannot reach PingOne servers. Please check your internet connection.';
					} else if (errorBody?.error === 'connection_refused') {
						errorMessage = 'PingOne servers are currently unavailable. Please try again later.';
					} else if (errorBody?.error === 'request_timeout') {
						errorMessage = 'PingOne servers are not responding. Please try again.';
					} else if (errorBody?.error === 'invalid_response') {
						const details = errorBody?.details as { contentType?: string } | undefined;
						errorMessage = `Invalid response from PingOne (${details?.contentType || 'unknown format'}). The authorization server may be having issues.`;
					}
				} catch (parseError) {
					// If we can't parse as JSON, the error response is likely HTML (error page)
					console.error('🔍 [PingOneAuthentication] Could not parse error response as JSON:', parseError);
					try {
						const errorText = await authorizeResponse.text();
						errorBody = { raw_response: errorText.substring(0, 500) };
						if (errorText.includes('<!doctype') || errorText.includes('<html')) {
							errorMessage = 'PingOne returned an HTML error page. This may indicate a server configuration issue. Check that your Environment ID and credentials are correct.';
						}
					} catch {
						// ignore
					}
				}
				
				// Log error response to flow log BEFORE throwing
				setFlowRequestLog(prev => prev.map((log, idx) => 
					idx === prev.length - 1 
						? { 
							...log, 
							response: {
								error: true,
								status: authorizeResponse.status,
								error_code: String(errorBody?.error || 'UNKNOWN_ERROR'),
								error_description: errorMessage
							},
							fullResponse: errorBody, // Store full error response
							status: authorizeResponse.status
						}
						: log
				));
				
				throw new Error(errorMessage);
			}

			const flowData: Record<string, unknown> = await authorizeResponse.json();
			console.log('🔍 [PingOneAuthentication] Step 1 Response (flow object):', JSON.stringify(flowData, null, 2));

			// Extract flow information
			const flowId = flowData.id as string | undefined;
			const flowStatus = flowData.status as string | undefined;
			const flowLinks = flowData._links as Record<string, { href?: string }> | undefined;
			const sessionId = (flowData as { _sessionId?: string })._sessionId;
			const resumeUrl = flowData.resumeUrl as string | undefined;
			
			// CRITICAL: Log cookie details from Step 1
			console.log('🔍 [PingOneAuthentication] Step 1 session:', {
				hasSessionId: !!sessionId,
				sessionId: sessionId || 'none',
				hasFlowData: !!flowData,
				flowDataKeys: Object.keys(flowData).join(', ')
			});
			
			if (!sessionId) {
				console.error('❌ [PingOneAuthentication] WARNING: Step 1 did NOT return a sessionId!');
				console.error('❌ Backend must manage PingOne cookies server-side and return _sessionId.');
			}

			// Log Step 1 response
			setFlowRequestLog(prev => prev.map((log, idx) => 
				idx === prev.length - 1 
					? { 
						...log, 
						response: {
							flowId: flowId ? `${flowId.substring(0, 8)}...` : 'N/A',
							status: String(flowStatus || 'unknown'),
							hasResumeUrl: !!resumeUrl
						},
						fullResponse: flowData, // Store full response from PingOne
						status: authorizeResponse.status
					}
					: log
			));

			if (!flowId || flowStatus !== 'USERNAME_PASSWORD_REQUIRED') {
				throw new Error(`Unexpected flow status: ${flowStatus || 'unknown'}. Expected USERNAME_PASSWORD_REQUIRED.`);
			}

			// Per docs: _links['usernamePassword.check'].href
			const flowCheckUrl = flowLinks?.['usernamePassword.check']?.href;
			if (!flowCheckUrl) {
				throw new Error('Flow object missing usernamePassword.check link');
			}

			// Step 2: Present Login Form and Send Credentials to PingOne
			// Per documentation: POST /flows/{flowId} with action: "usernamePassword.check"
			// CRITICAL: Credentials sent DIRECTLY to PingOne Flow API (over HTTPS)
			// NEVER sent to /as/token or your backend - only to PingOne
			const step2RequestBody = {
				flowUrl: flowCheckUrl,
				username: creds.username, // Send as-is, no trimming
				password: creds.password, // Send as-is, no trimming
				sessionId: sessionId
			};
			
			console.log('🔍 [PingOneAuthentication] Step 2 request details:', {
				flowUrl: flowCheckUrl,
				usernameLength: creds.username.length,
				passwordLength: creds.password.length,
				sessionIdPresent: !!sessionId
			});
			
			// The actual body sent to PingOne Flow API (what goes to /flows/{flowId})
			const step2PingOneBody = {
				action: 'usernamePassword.check',
				username: creds.username, // Exact value sent to PingOne
				password: creds.password // Exact value sent to PingOne
			};
			
			setFlowRequestLog(prev => [...prev, {
				step: 2,
				title: 'Present Login Form and Send Credentials to PingOne',
				method: 'POST',
				url: flowCheckUrl,
				params: {
					action: 'usernamePassword.check',
					username: `${creds.username.substring(0, 3)}***`,
					password: '***'
				},
				requestBody: step2PingOneBody, // Store actual JSON sent to PingOne Flow API
				note: `Step 2: POST /flows/{flowId} with action: "usernamePassword.check". Credentials go ONLY to PingOne Flow API (over HTTPS). NEVER to /as/token or your backend. PingOne validates credentials and returns status (e.g., READY_TO_RESUME).

📋 Required Headers:
• Content-Type: application/vnd.pingidentity.usernamePassword.check+json (PingOne-specific media type)
• Accept: application/json
• Cookie: <session cookies from Step 1's /as/authorize response> - REQUIRED for stateful flows`,
				timestamp: Date.now()
			}]);

			const flowCheckResponse = await fetch('/api/pingone/flows/check-username-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(step2RequestBody)
			});

			if (!flowCheckResponse.ok) {
				const errorBody = await flowCheckResponse.json().catch(() => ({}));
				
				// Store error response in log
				setFlowRequestLog(prev => prev.map((log, idx) => 
					idx === prev.length - 1 
						? { 
							...log, 
							response: {
								error: true,
								status: flowCheckResponse.status,
								error_code: String(errorBody?.code || errorBody?.error || 'UNKNOWN_ERROR'),
								error_description: errorBody?.error_description || errorBody?.message || `Flow execution failed (status ${flowCheckResponse.status})`
							},
							fullResponse: errorBody, // Store full error response from PingOne
							status: flowCheckResponse.status
						}
						: log
				));
				
				// Handle 401 specifically - usually means invalid credentials or expired flow
				if (flowCheckResponse.status === 401) {
					const errorMessage = errorBody?.error_description || errorBody?.message || 'Authentication failed - invalid credentials or flow expired';
					
					console.error('[PingOneAuthentication] Flow API 401 Error:', {
						status: flowCheckResponse.status,
						errorCode: errorBody?.code || errorBody?.error,
						errorMessage: errorMessage,
						flowId,
						errorBody
					});
					
					// Provide more specific error messages
					if (errorBody?.code === 'INVALID_TOKEN' || errorBody?.error === 'INVALID_TOKEN') {
						throw new Error('Invalid credentials - please check your username and password');
					} else if (errorBody?.code === 'ACCESS_FAILED' || errorBody?.error === 'ACCESS_FAILED') {
						throw new Error('Access denied - invalid username or password');
					} else {
						throw new Error(errorMessage);
					}
				}
				
				throw new Error(errorBody?.error_description || `Flow execution failed (status ${flowCheckResponse.status})`);
			}

			const flowCheckData: Record<string, unknown> = await flowCheckResponse.json();
			console.log('🔍 [PingOneAuthentication] Step 2 Response:', JSON.stringify(flowCheckData, null, 2));

			// Server manages cookies; just use sessionId for subsequent steps

			const updatedResumeUrl = flowCheckData.resumeUrl as string | undefined;
			const updatedFlowId = flowCheckData.id as string | undefined || flowId;

			// Log Step 2 response
			setFlowRequestLog(prev => prev.map((log, idx) => 
				idx === prev.length - 1 
					? { 
						...log, 
						response: {
							flowId: updatedFlowId ? `${updatedFlowId.substring(0, 8)}...` : 'N/A',
							status: String(flowCheckData.status || 'unknown'),
							hasResumeUrl: !!updatedResumeUrl
						},
						fullResponse: flowCheckData, // Store full response from PingOne
						status: flowCheckResponse.status
					}
					: log
			));

			if (!updatedResumeUrl) {
				throw new Error('Flow execution completed but no resumeUrl provided');
			}

			// Step 3: Resume to Obtain Authorization Code
			// Per documentation: GET /as/resume?flowId={flowId}
			// PingOne returns authorization code in JSON (response_mode=pi.flow) or redirect Location header
			console.log('🔍 [PingOneAuthentication] Step 3 session:', {
				sessionIdPresent: !!sessionId
			});
			
			const step3RequestBody = {
				resumeUrl: updatedResumeUrl,
				flowId: updatedFlowId,
				clientId: config.clientId.trim() || DEFAULT_CONFIG.clientId,
				clientSecret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret,
				codeVerifier: codeVerifier, // Required for PKCE validation
				flowState: state, // Required for state verification
				sessionId: sessionId
			};
			
			// Note: We POST to our backend proxy, but our backend sends GET to PingOne
			// GET requests don't have bodies - all params are in the URL query string
			const resumeUrlObj = new URL(updatedResumeUrl);
			const queryParams: Record<string, string> = {};
			resumeUrlObj.searchParams.forEach((value, key) => {
				queryParams[key] = value;
			});
			// Add params that will be added by backend
			if (codeVerifier) queryParams.code_verifier = '***'; // Masked
			if (state) queryParams.state = state;
			queryParams.response_mode = 'pi.flow';

			setFlowRequestLog(prev => [...prev, {
				step: 3,
				title: 'Resume to Obtain Authorization Code',
				method: 'GET',
				url: updatedResumeUrl,
				params: queryParams, // Show actual query params that will be sent to PingOne
				requestBody: {
					note: 'Note: This is data sent to our backend proxy (POST /api/pingone/resume). The actual PingOne request is GET with query parameters only (no body).',
					proxyRequest: step3RequestBody
				},
				note: 'Step 3: GET /as/resume?flowId={flowId}&response_mode=pi.flow&code_verifier=***&state=***. PingOne API requires GET (not POST) - all parameters are in the URL query string, not in a request body. PingOne returns authorization code in JSON (with response_mode=pi.flow) or redirect Location header. Extract code and state.',
				timestamp: Date.now()
			}]);

			const resumeResponse = await fetch('/api/pingone/resume', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(step3RequestBody)
			});

			if (!resumeResponse.ok) {
				const errorBody = await resumeResponse.json().catch(() => ({}));
				
				// Log error response to flow log BEFORE throwing
				setFlowRequestLog(prev => prev.map((log, idx) => 
					idx === prev.length - 1 
						? { 
							...log, 
							response: {
								error: true,
								status: resumeResponse.status,
								error_code: errorBody?.error_code || errorBody?.error || 'UNKNOWN_ERROR',
								error_description: errorBody?.error_description || errorBody?.error || `Resume flow failed (status ${resumeResponse.status})`,
								pingone_error: errorBody?.pingone_error || null,
								location: errorBody?.location ? `${errorBody.location.substring(0, 100)}...` : 'N/A'
							},
							fullResponse: errorBody, // Store full error response
							status: resumeResponse.status
						}
						: log
				));
				
				// If PingOne returned a specific error, include it in the error message
				if (errorBody?.pingone_error) {
					const pingoneError = errorBody.pingone_error;
					const errorCode = pingoneError.code || errorBody.error_code || 'UNKNOWN_ERROR';
					const errorMessage = pingoneError.message || pingoneError.error_description || errorBody.error_description || 'Unknown error from PingOne';
					throw new Error(`PingOne Resume Error (${errorCode}): ${errorMessage}`);
				}
				
				throw new Error(errorBody?.error_description || errorBody?.error || `Resume flow failed (status ${resumeResponse.status})`);
			}

		const resumeData: Record<string, unknown> = await resumeResponse.json();
		console.log('🔍 [PingOneAuthentication] Step 3 Response:', JSON.stringify(resumeData, null, 2));
		
		// Log Step 3 response IMMEDIATELY (before code extraction) so it's always visible
		setFlowRequestLog(prev => prev.map((log, idx) => 
			idx === prev.length - 1 
				? { 
					...log, 
					response: {
						status: 'Received',
						hasCode: !!(resumeData.code && resumeData.code !== null),
						hasLocation: !!(resumeData.location),
						isRedirect: !!(resumeData.redirect),
						keys: Object.keys(resumeData).join(', ')
					},
					fullResponse: resumeData, // Store full response immediately
					status: resumeResponse.status
				}
				: log
		));
		
		// Handle redirect response - PingOne may redirect with code in Location header
		const isRedirect = resumeData.redirect === true || resumeData.redirect === 'true';
		const locationUrl = resumeData.location as string | undefined;
		
		// Debug: Log the location URL to understand what we're working with
		if (locationUrl) {
			console.log('🔍 [PingOneAuthentication] Location URL details:', {
				locationUrl: locationUrl,
				locationLength: locationUrl.length,
				hasCodeParam: locationUrl.includes('code='),
				hasStateParam: locationUrl.includes('state='),
				first200Chars: locationUrl.substring(0, 200)
			});
		}
		
		// Type guard for flow object structure
		type FlowResponse = {
			flow?: {
				code?: string;
				state?: string;
				[key: string]: unknown;
			};
			authorizeResponse?: {
				code?: string;
				state?: string;
				[key: string]: unknown;
			};
			code?: string | null;
			state?: string | null;
			redirect?: boolean | string;
			location?: string;
			[key: string]: unknown;
		};
		
		const typedResumeData = resumeData as FlowResponse;
		
		// Log full response for debugging
		const fullResponseStr = JSON.stringify(resumeData, null, 2);
		console.log('🔍 [PingOneAuthentication] Step 3 Full Response:', fullResponseStr);
		
		console.log('🔍 [PingOneAuthentication] Step 3 Response structure:', {
			hasCode: !!resumeData.code,
			codeValue: resumeData.code,
			codeType: typeof resumeData.code,
			isRedirect: isRedirect,
			hasLocation: !!locationUrl,
			hasAccessToken: !!resumeData.access_token,
			hasIdToken: !!resumeData.id_token,
			keys: Object.keys(resumeData),
			// Check if code is nested in a flow object
			hasFlowObject: !!typedResumeData.flow,
			flowHasCode: !!typedResumeData.flow?.code,
			// Check for authorizeResponse.code (pi.flow format)
			hasAuthorizeResponse: !!typedResumeData.authorizeResponse,
			authorizeResponseHasCode: !!typedResumeData.authorizeResponse?.code,
			authorizeResponseCode: typedResumeData.authorizeResponse?.code,
			// Check for error fields
			hasError: !!(resumeData.error || resumeData.error_code || resumeData.error_description),
			errorCode: resumeData.error || resumeData.error_code,
			errorMessage: resumeData.error_description || resumeData.message,
			// Check for alternative field names
			hasAuthorizationCode: !!resumeData.authorization_code,
			hasAuthCode: !!resumeData.authCode,
			// Response preview
			responsePreview: fullResponseStr.substring(0, 500)
		});

		// Try to extract code from various possible locations
		// PingOne might return code directly, or nested in a flow object for pi.flow, or in redirect Location
		let authorizationCode: string | undefined;
		
		// First try: direct code field (non-null)
		if (resumeData.code && typeof resumeData.code === 'string' && resumeData.code !== 'null') {
			authorizationCode = resumeData.code;
		}
		// Second try: authorizeResponse.code (pi.flow format)
		else if (typedResumeData.authorizeResponse?.code && typeof typedResumeData.authorizeResponse.code === 'string') {
			authorizationCode = typedResumeData.authorizeResponse.code;
			console.log('✅ [PingOneAuthentication] Found code in authorizeResponse.code:', {
				codeLength: authorizationCode.length,
				codePreview: `${authorizationCode.substring(0, 20)}...`
			});
		}
		// Third try: if redirect, extract code from Location URL
		else if (isRedirect && locationUrl) {
			console.log('🔍 [PingOneAuthentication] Attempting to extract code from Location URL:', {
				locationUrl: locationUrl.substring(0, 300),
				isAbsolute: locationUrl.startsWith('http://') || locationUrl.startsWith('https://'),
				isRelative: locationUrl.startsWith('/'),
				isQueryOnly: locationUrl.startsWith('?')
			});
			
			try {
				// Try parsing as absolute URL first
				let location: URL;
				try {
					location = new URL(locationUrl);
				} catch {
					// If not absolute, try to resolve relative to a base URL
					// Use the resume URL as base
					const baseUrl = new URL(updatedResumeUrl || `https://auth.pingone.com/${environmentId}/as/resume`);
					location = new URL(locationUrl, baseUrl.origin + baseUrl.pathname);
				}
				
				const codeFromLocation = location.searchParams.get('code');
				if (codeFromLocation) {
					authorizationCode = codeFromLocation;
					console.log('✅ [PingOneAuthentication] Extracted code from redirect Location URL:', {
						codeLength: codeFromLocation.length,
						codePreview: `${codeFromLocation.substring(0, 20)}...`
					});
				} else {
					console.warn('⚠️ [PingOneAuthentication] Redirect Location URL found but no code parameter in searchParams:', {
						locationUrl: locationUrl,
						searchParams: Array.from(location.searchParams.entries())
					});
				}
			} catch (urlError) {
				console.error('❌ [PingOneAuthentication] Failed to parse Location URL:', urlError);
				// Try to extract code from location string using regex as fallback
				// Match code=... followed by & or end of string
				const codeMatch = locationUrl.match(/[?&]code=([^&'"<>#\s]+)/);
				if (codeMatch && codeMatch[1]) {
					authorizationCode = decodeURIComponent(codeMatch[1]);
					console.log('✅ [PingOneAuthentication] Extracted code from Location URL using regex:', {
						codeLength: authorizationCode.length,
						codePreview: `${authorizationCode.substring(0, 20)}...`,
						rawMatch: codeMatch[0]
					});
				} else {
					console.error('❌ [PingOneAuthentication] Regex extraction also failed. Location URL:', {
						locationUrl: locationUrl.substring(0, 500),
						matches: locationUrl.match(/code[=\s:]/g)
					});
				}
			}
		}
		// Fourth try: nested in flow object (pi.flow response structure)
		else if (typedResumeData.flow && typeof typedResumeData.flow.code === 'string') {
			authorizationCode = typedResumeData.flow.code;
		}
		// Fifth try: alternative field names (authorization_code, authCode, etc.)
		else if (resumeData.authorization_code && typeof resumeData.authorization_code === 'string') {
			authorizationCode = resumeData.authorization_code;
			console.log('✅ [PingOneAuthentication] Found code in authorization_code field');
		}
		else if (resumeData.authCode && typeof resumeData.authCode === 'string') {
			authorizationCode = resumeData.authCode;
			console.log('✅ [PingOneAuthentication] Found code in authCode field');
		}
		// Sixth try: check for nested paths (result.code, data.code, etc.)
		else if (resumeData.result && typeof resumeData.result === 'object' && typeof (resumeData.result as { code?: string }).code === 'string') {
			authorizationCode = (resumeData.result as { code: string }).code;
			console.log('✅ [PingOneAuthentication] Found code in result.code');
		}
		else if (resumeData.data && typeof resumeData.data === 'object' && typeof (resumeData.data as { code?: string }).code === 'string') {
			authorizationCode = (resumeData.data as { code: string }).code;
			console.log('✅ [PingOneAuthentication] Found code in data.code');
		}
		// Seventh try: check if response itself is the code (unlikely but possible)
		else if (typeof resumeData === 'string') {
			authorizationCode = resumeData;
		}
		// Eighth try: check if response has tokens directly (unusual but might happen)
		else if (resumeData.access_token || resumeData.id_token) {
			console.warn('⚠️ [PingOneAuthentication] Response contains tokens but no authorization code. This is unusual for pi.flow.');
			console.warn('⚠️ Response might have bypassed code exchange step.');
		}

		if (!authorizationCode) {
			// Update Step 3 response log to show error state
			setFlowRequestLog(prev => prev.map((log, idx) => 
				idx === prev.length - 1 
					? { 
						...log, 
						response: {
							code: 'Not found',
							error: 'No authorization code in response',
							redirect: isRedirect ? 'Yes' : 'No',
							location: locationUrl ? `${locationUrl.substring(0, 200)}...` : 'N/A',
							hasCodeParam: locationUrl ? locationUrl.includes('code=') : false
						},
						fullResponse: resumeData,
						status: resumeResponse.status
					}
					: log
			));
			
			// Log full response details for debugging
			const fullResponseStr = JSON.stringify(resumeData, null, 2);
			console.error('❌ [PingOneAuthentication] No authorization code found in response:', {
				responseKeys: Object.keys(resumeData),
				responsePreview: fullResponseStr.substring(0, 1000),
				responseType: typeof resumeData,
				hasCodeField: !!resumeData.code,
				codeValue: resumeData.code,
				hasFlowObject: !!typedResumeData.flow,
				hasAuthorizeResponse: !!typedResumeData.authorizeResponse,
				authorizeResponseHasCode: !!typedResumeData.authorizeResponse?.code,
				isRedirect: isRedirect,
				hasLocation: !!locationUrl,
				locationUrl: locationUrl ? locationUrl.substring(0, 500) : null,
				fullLocationUrl: locationUrl // Log full URL for debugging
			});
			
			// Provide more detailed error message
			let errorMessage = 'Resume flow completed but no authorization code provided.';
			if (isRedirect && locationUrl) {
				errorMessage += ` Redirect Location URL: ${locationUrl.substring(0, 200)}`;
				if (!locationUrl.includes('code=')) {
					errorMessage += ' Location URL does not contain a code parameter.';
				}
			} else if (!isRedirect) {
				errorMessage += ' PingOne did not redirect and no code was returned in JSON response.';
			}
			
			throw new Error(errorMessage);
		}
		
		console.log('✅ [PingOneAuthentication] Authorization code extracted successfully:', {
			codeLength: authorizationCode.length,
			codePreview: `${authorizationCode.substring(0, 20)}...`
		});

			// Extract state from Location URL if redirect, otherwise use direct field
			let extractedState: string | undefined;
			if (isRedirect && locationUrl) {
				try {
					const location = new URL(locationUrl);
					extractedState = location.searchParams.get('state') || undefined;
				} catch {
					const stateMatch = locationUrl.match(/[?&]state=([^&]+)/);
					if (stateMatch && stateMatch[1]) {
						extractedState = decodeURIComponent(stateMatch[1]);
					}
				}
			}
			const finalState = (extractedState || resumeData.state || typedResumeData.state || typedResumeData.authorizeResponse?.state) as string | undefined;

			// Update Step 3 response log with extracted code (response already logged above)
			setFlowRequestLog(prev => prev.map((log, idx) => 
				idx === prev.length - 1 
					? { 
						...log, 
						response: {
							code: authorizationCode ? `${authorizationCode.substring(0, 20)}...` : 'Not found',
							state: finalState || 'N/A',
							redirect: isRedirect ? 'Yes' : 'No',
							location: locationUrl ? `${locationUrl.substring(0, 100)}...` : 'N/A'
						},
						fullResponse: resumeData, // Already stored, but update reference
						status: resumeResponse.status
					}
					: log
			));

			// Step 4: Backend Exchanges Code for Tokens
			// Per documentation: POST /as/token with authorization code
			// NOTE: NO username/password here - only code, client_id, code_verifier
			const step4RequestBody = {
				grant_type: 'authorization_code',
				code: authorizationCode,
				client_id: config.clientId.trim() || DEFAULT_CONFIG.clientId,
				client_secret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret,
				code_verifier: codeVerifier,
				redirect_uri: config.redirectUri.trim() || DEFAULT_CONFIG.redirectUri,
				environment_id: environmentId,
				token_endpoint_auth_method: config.tokenEndpointAuthMethod || 'client_secret_post'
			};
			
			setFlowRequestLog(prev => [...prev, {
				step: 4,
				title: 'Backend Exchanges Code for Tokens',
				method: 'POST',
				url: `https://auth.pingone.com/${environmentId}/as/token`,
				params: {
					grant_type: 'authorization_code',
					code: `${authorizationCode.substring(0, 20)}...`,
					client_id: config.clientId.trim() || DEFAULT_CONFIG.clientId,
					code_verifier: '***'
				},
				requestBody: step4RequestBody, // Store full request body
				note: 'Step 4: POST /as/token to retrieve tokens. NO username/password here - only code, client_id, code_verifier. Your backend calls this - credentials were only sent to PingOne Flow API in Step 2.',
				timestamp: Date.now()
			}]);

			const tokenResponse = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(step4RequestBody)
			});

			if (!tokenResponse.ok) {
				const errorBody = await tokenResponse.json().catch(() => ({}));
				throw new Error(errorBody?.error_description || `Token exchange failed (status ${tokenResponse.status})`);
			}

			const tokenData: Record<string, unknown> = await tokenResponse.json();
			console.log('🔍 [PingOneAuthentication] Step 4 Response (tokens):', JSON.stringify(tokenData, null, 2));

			const accessToken = tokenData.access_token as string | undefined;
			const idToken = tokenData.id_token as string | undefined;
			const refreshToken = tokenData.refresh_token as string | undefined;

			// Log Step 4 response
			setFlowRequestLog(prev => prev.map((log, idx) => 
				idx === prev.length - 1 
					? { 
						...log, 
						response: {
							access_token: accessToken ? 'received' : 'N/A',
							id_token: idToken ? 'received' : 'N/A',
							refresh_token: refreshToken ? 'received' : 'N/A'
						},
						fullResponse: tokenData, // Store full response from PingOne
						status: tokenResponse.status
					}
					: log
			));

			// Extract tokens
			const tokens: Record<string, string> = {};
			if (accessToken) tokens.access_token = accessToken;
			if (idToken) tokens.id_token = idToken;
			if (refreshToken) tokens.refresh_token = refreshToken;

			// Update local state so we can render real tokens with decode
			setLatestTokens(tokens);

			const result: PlaygroundResult = {
				timestamp: Date.now(),
				mode: 'redirectless',
				responseType: config.responseType,
				tokens,
				config,
				authUrl: `https://auth.pingone.com/${environmentId}/as/authorize`,
				context: { 
					isRedirectless: true, 
					redirectlessUsername: creds.username, 
					resumeUrl: updatedResumeUrl, 
					flowId: updatedFlowId 
				}
			};

			localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
			v4ToastManager.showSuccess('Redirectless authentication successful! Tokens obtained via 4-step flow.');
			navigate('/pingone-authentication/result');
		} catch (error) {
			console.error('[PingOneAuthentication] Redirectless login error:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Redirectless login failed unexpectedly.'
			);
		} finally {
			setLoading(false);
		}
	}, [config, mode, navigate, redirectlessCreds]);

	const handleHEBLogin = useCallback(async (credentials: HEBLoginCredentials) => {
		// Prevent double-submission
		if (loading) {
			console.log('🔍 [PingOneAuthentication] Already processing, ignoring duplicate submission');
			return;
		}
		
		// Close popup immediately
		setHebLoginOpen(false);
		
		// Store credentials
		setRedirectlessCreds(prev => ({
			...prev,
			username: credentials.username,
			password: credentials.password
		}));
		
		// Clear pending flow context (we'll start fresh with credentials)
		setPendingFlowContext(null);
		
		// Add log entry for HEB login completion (preparation step before OAuth flow)
		setFlowRequestLog([{
			step: 0,
			title: 'HEB Login - Collect Credentials',
			method: 'UI',
			url: 'N/A (UI Interaction)',
			params: {
				username: `${credentials.username.substring(0, 3)}***`,
				password: '***',
				status: 'credentials collected'
			},
			note: 'Preparation: User authenticates in our app (HEB login). This is separate from PingOne authentication. Once authenticated, we proceed to the 4-step PingOne redirectless flow (pi.flow).',
			timestamp: Date.now()
		}]);
		
		// Start the authorization code flow with the collected credentials
		// Pass credentials directly to avoid React state timing issues
		v4ToastManager.showInfo('Starting PingOne authentication with collected credentials...');
		void runRedirectlessLogin({
			username: credentials.username,
			password: credentials.password
		});
	}, [loading, runRedirectlessLogin]);

	const handleStartOver = useCallback(() => {
		// Reset everything
		setFlowRequestLog([]);
		setPendingFlowContext(null);
		setRedirectlessCreds(DEFAULT_REDIRECTLESS_CREDS);
		setHebLoginOpen(false);
		setLoading(false);
		setShowAuthenticationModal(false);
		setPendingRedirectUrl('');
		setMissingCredentialFields([]);
		setShowMissingCredentialsModal(false);
		setShowUrlValidationModal(false);
		setUrlValidationResult(null);
		setPendingAuthUrl('');
		v4ToastManager.showInfo('Flow reset. Ready to start over.');
		console.log('🔄 [PingOneAuthentication] Flow reset - ready to start over');
	}, []);

	const handleLaunch = useCallback(async () => {
		if (loading) return;

		// Validate required credentials before launching
		const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(config, {
			requiredFields: ['environmentId', 'clientId', 'clientSecret'],
			fieldLabels: {
				environmentId: 'Environment ID',
				clientId: 'Client ID',
				clientSecret: 'Client Secret',
			},
		});

		if (!canProceed) {
			setMissingCredentialFields(missingFields);
			setShowMissingCredentialsModal(true);
			console.warn('⚠️ [PingOneAuthentication] Missing required credentials', { missingFields });
			return;
		}

		// Redirect mode: redirect to PingOne (not popup)
		if (mode === 'redirect') {
			setLoading(true);
			
			try {
				// Generate PKCE URL for authorization code flow
				const finalAuthUrl = await generateRedirectPKCE();
				
				console.log('🔍 [PingOneAuthentication] Generated redirect URL:', finalAuthUrl);
				console.log('🔍 [PingOneAuthentication] Config used:', {
					environmentId: config.environmentId,
					clientId: config.clientId,
					responseType: config.responseType,
					redirectUri: config.redirectUri,
					scopes: config.scopes
				});
				
				// Validate the URL before redirecting
				try {
					new URL(finalAuthUrl);
					console.log('✅ [PingOneAuthentication] URL validation passed');
				} catch (urlError) {
					console.error('❌ [PingOneAuthentication] Invalid URL generated:', urlError);
					throw new Error('Invalid authorization URL generated');
				}
				
				// Validate authorization URL with comprehensive validation service
				console.log('🔍 [PingOneAuthentication] Validating authorization URL...');
				const validationResult = authorizationUrlValidationService.validateAuthorizationUrl(finalAuthUrl, {
					flowType: 'authorization-code',
					requireState: true,
					requireNonce: false,
					requirePkce: true
				});
				
				if (!validationResult.isValid) {
					console.warn('⚠️ [PingOneAuthentication] URL validation failed:', validationResult);
					setUrlValidationResult(validationResult);
					setPendingAuthUrl(finalAuthUrl);
					setShowUrlValidationModal(true);
					setLoading(false);
					return;
				}
				
			console.log('✅ [PingOneAuthentication] Authorization URL validation passed');
			
			// Store flow context for redirect callback (isolated from redirectless)
			sessionStorage.setItem(REDIRECT_FLOW_CONTEXT_KEY, JSON.stringify({
				environmentId: config.environmentId,
				clientId: config.clientId,
				responseType: config.responseType,
				returnPath: '/pingone-authentication/result',
				timestamp: Date.now(),
				mode: 'redirect'
			}));
			
			// Clear redirectless context to avoid conflicts
			sessionStorage.removeItem(REDIRECTLESS_FLOW_CONTEXT_KEY);
			
			// Show authentication modal with URL details
			setPendingRedirectUrl(finalAuthUrl);
			setShowAuthenticationModal(true);
			setLoading(false);
			} catch (error) {
				console.error('[PingOneAuthentication] Redirect flow error:', error);
				v4ToastManager.showError('Failed to start redirect flow. Please try again.');
				setLoading(false);
			}
		}

		// Redirectless mode: run the flow immediately and navigate to results
		if (mode === 'redirectless') {
			try {
				// Clear redirect flow context to avoid conflicts (redirectless doesn't use callbacks)
				sessionStorage.removeItem(REDIRECT_FLOW_CONTEXT_KEY);
				// Clear legacy context key if it exists
				sessionStorage.removeItem(FLOW_CONTEXT_KEY);
			} catch (error) {
				console.warn('[PingOneAuthentication] Failed to clear redirect flow context:', error);
			}
			v4ToastManager.showInfo('Starting redirectless authentication with PingOne…');
			void runRedirectlessLogin();
		}
	}, [authUrl, config, config.responseType, loading, mode, runRedirectlessLogin]);

	// URL Validation Modal callbacks
	const handleUrlValidationProceed = useCallback(() => {
		console.log('✅ [PingOneAuthentication] User chose to proceed with URL validation warnings');
		setShowUrlValidationModal(false);
		
		// Proceed with the redirect
		if (pendingAuthUrl) {
			v4ToastManager.showSuccess('Redirecting to PingOne for authentication...');
			
			// Add a small delay to prevent flash and allow user to see the message
			setTimeout(() => {
				console.log('🔍 [PingOneAuthentication] Executing redirect to:', pendingAuthUrl);
				window.location.href = pendingAuthUrl;
			}, 1000);
		}
	}, [pendingAuthUrl]);

	const handleUrlValidationFix = useCallback(() => {
		console.log('🔧 [PingOneAuthentication] User chose to fix URL validation issues');
		setShowUrlValidationModal(false);
		setLoading(false);
		v4ToastManager.showInfo('Please fix the configuration issues and try again.');
	}, []);

	// No popup communication needed for redirect flow

	// Authentication modal handlers
	const handleAuthModalContinue = useCallback(() => {
		console.log('🚀 [PingOneAuthentication] User confirmed authentication, redirecting to:', pendingRedirectUrl);
		setShowAuthenticationModal(false);
		v4ToastManager.showSuccess('Redirecting to PingOne for authentication...');
		
		// Execute the redirect
		setTimeout(() => {
			if (!pendingRedirectUrl) return;
			window.location.href = pendingRedirectUrl;
		}, 500);
	}, [pendingRedirectUrl]);

	const handleAuthModalCancel = useCallback(() => {
		console.log('🚫 [PingOneAuthentication] User cancelled authentication');
		setShowAuthenticationModal(false);
		setPendingRedirectUrl('');
		v4ToastManager.showInfo('Authentication cancelled');
	}, []);

	// Scroll to top when component mounts or mode changes
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [mode]);

	return (
		<Page>
		<FlowHeader 
			flowType="pingone"
			customConfig={{
				flowType: 'pingone',
				title: 'PingOne Authentication Playground – Authorization Code Flow',
				subtitle: 'Test PingOne authentication flows with redirect and redirectless modes',
			}}
		/>
			<Card>

				<Callout>
					<strong>Authorization Code Flow:</strong> Uses PKCE for enhanced security. 
					After authentication, PingOne redirects to <code>https://localhost:3000/p1auth-callback</code> 
					where we capture the authorization code and exchange it for tokens.
					<br /><br />
					<strong>Note:</strong> This flow requires username/password input and will not return tokens immediately. 
					The authorization code must be exchanged for tokens in a separate step.
				</Callout>

				<SectionTitle>Choose Your Destiny</SectionTitle>
				<Modes>
					<ModeButton
						$active={mode === 'redirect'}
						onClick={() => setMode('redirect')}
					>
						Redirect Flow
					</ModeButton>
					<ModeDetails>
						{mode === 'redirect' 
							? 'Opens PingOne login in a popup window. After authentication, redirects back to our callback URL where we capture tokens.'
							: 'Uses PingOne\'s redirectless flow to authenticate without redirects. Tokens are returned directly to the application.'
						}
					</ModeDetails>
					<ModeButton
						$active={mode === 'redirectless'}
						onClick={() => setMode('redirectless')}
					>
						Redirectless Flow
					</ModeButton>
				</Modes>

			<SectionTitle>Configuration</SectionTitle>
			
			{/* PingOne Application Picker */}
			<CollapsibleHeader
				title="PingOne Application Picker"
				subtitle="Auto-fill configuration from your PingOne environment"
				defaultCollapsed={true}
				icon={<FiSettings />}
				theme="orange"
			>
				{!workerToken ? (
					<>
						<div style={{ 
							padding: '1rem', 
							backgroundColor: '#f8f9fa', 
							borderRadius: '6px', 
							border: '1px solid #e9ecef',
							marginBottom: '1rem'
						}}>
							<p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#495057' }}>
								<strong>🔧 How it works:</strong> Get a worker token using the Client Credentials grant (no redirect URI or response type needed). 
								Then select an application from your PingOne environment to auto-fill all configuration fields.
							</p>
							{workerCredentials.environmentId && workerCredentials.clientId && (
								<p style={{ margin: '0', fontSize: '0.85rem', color: '#28a745', fontWeight: '500' }}>
									✓ Worker credentials saved
								</p>
							)}
						</div>
						
						<button
							onClick={handleGetWorkerToken}
							disabled={gettingWorkerToken}
							style={{
								background: '#007bff',
								color: 'white',
								border: 'none',
								padding: '0.75rem 1.5rem',
								borderRadius: '6px',
								fontWeight: '600',
								cursor: gettingWorkerToken ? 'not-allowed' : 'pointer',
								opacity: gettingWorkerToken ? 0.6 : 1,
								marginBottom: '1rem'
							}}
						>
							{gettingWorkerToken ? 'Getting Worker Token...' : 'Get Worker Token'}
						</button>
					</>
				) : (
					<div style={{ 
						padding: '1rem', 
						backgroundColor: '#d4edda', 
						borderRadius: '6px', 
						border: '1px solid #c3e6cb',
						marginBottom: '1rem'
					}}>
						<div style={{ 
							display: 'flex', 
							alignItems: 'center', 
							justifyContent: 'space-between',
							gap: '0.5rem'
						}}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								color: '#155724',
								fontWeight: '500'
							}}>
								<FiCheck size={16} />
								Worker token obtained! You can now select applications below.
							</div>
							<button
								onClick={() => setWorkerToken(null)}
								style={{
									background: '#dc3545',
									color: 'white',
									border: 'none',
									padding: '0.5rem 1rem',
									borderRadius: '4px',
									fontWeight: '500',
									cursor: 'pointer',
									fontSize: '0.875rem'
								}}
							>
								Clear Token
							</button>
						</div>
					</div>
				)}
				
				<PingOneApplicationPicker
					environmentId={workerCredentials.environmentId}
					clientId={workerCredentials.clientId}
					clientSecret={workerCredentials.clientSecret}
					workerToken={workerToken || undefined}
					onApplicationSelect={handleApplicationSelect}
					disabled={loading || !workerCredentials.environmentId || !workerToken}
				/>
			</CollapsibleHeader>

				<Field>
					<Label>Environment ID</Label>
					<Input
						type="text"
						value={config.environmentId}
						onChange={(e) => updateConfig('environmentId', e.target.value)}
						placeholder="Enter your PingOne environment ID"
						autoComplete="off"
					/>
				</Field>

				<Field>
					<Label>Client ID</Label>
					<Input
						type="text"
						value={config.clientId}
						onChange={(e) => updateConfig('clientId', e.target.value)}
						placeholder="Enter your PingOne client ID"
						autoComplete="username"
					/>
				</Field>

				<Field>
					<Label>Client Secret</Label>
					<Input
						type="password"
						value={config.clientSecret}
						onChange={(e) => updateConfig('clientSecret', e.target.value)}
						placeholder="Enter your PingOne client secret"
						autoComplete="current-password"
					/>
				</Field>

				{isClientCredentialsOnly ? (
					<Field>
						<Label>Redirect URI</Label>
						<div style={{ 
							padding: '0.75rem',
							backgroundColor: '#fff3cd',
							border: '1px solid #ffc107',
							borderRadius: '0.375rem',
							color: '#856404',
							fontSize: '0.9rem'
						}}>
							<strong>ℹ️ Not Applicable for Client Credentials Flow</strong><br />
							The Client Credentials flow does not use <code>redirect_uri</code>.
						</div>
					</Field>
				) : (
					<Field>
						<Label>Redirect URI</Label>
						<Input
							type="text"
							value={config.redirectUri}
							onChange={(e) => updateConfig('redirectUri', e.target.value)}
							placeholder="Enter your redirect URI"
							autoComplete="url"
						/>
						<div style={{
							fontSize: '0.85rem',
							color: '#666',
							marginTop: '0.5rem',
							padding: '0.75rem',
							backgroundColor: '#f8f9fa',
							borderRadius: '0.375rem',
							border: '1px solid #e9ecef'
						}}>
							<strong>🔧 PingOne Configuration Required:</strong><br />
							<strong>Redirect URI:</strong> <code>{config.redirectUri}</code><br />
							<strong>Post-Logout Redirect URI:</strong> <code>{callbackUriService.getCallbackUri('p1authLogoutCallback')}</code><br />
							<br />
							<strong>Steps to configure in PingOne:</strong><br />
							1. Go to your PingOne application settings<br />
							2. Add <code>{config.redirectUri}</code> to <strong>Redirect URIs</strong><br />
							3. Add <code>{callbackUriService.getCallbackUri('p1authLogoutCallback')}</code> to <strong>Post-Logout Redirect URIs</strong><br />
							4. Ensure your application supports <strong>Authorization Code</strong> grant type<br />
							5. Make sure <strong>PKCE</strong> is enabled for enhanced security<br />
							<br />
							<strong>💡 Pro Tip:</strong> Use the <strong>PingOne Application Picker</strong> above to automatically fill these URIs from an existing application!
						</div>
					</Field>
				)}

				<Field>
					<Label>Scopes</Label>
					<Input
						type="text"
						value={config.scopes}
						onChange={(e) => updateConfig('scopes', e.target.value)}
						placeholder="e.g., openid profile email"
						autoComplete="off"
					/>
				</Field>

				{isClientCredentialsOnly ? (
					<Field>
						<Label>Response Type</Label>
						<div style={{ 
							padding: '0.75rem',
							backgroundColor: '#fff3cd',
							borderRadius: '0.375rem',
							border: '1px solid #ffc107',
							fontSize: '0.9rem',
							color: '#856404'
						}}>
							<strong>ℹ️ Not Applicable for Client Credentials Flow</strong><br />
							The Client Credentials flow does not use a <code>response_type</code> parameter. 
							This flow goes directly to the token endpoint with <code>grant_type=client_credentials</code> 
							and does not involve the authorization endpoint or user interaction.
						</div>
					</Field>
				) : (
					<Field>
						<Label>Response Type</Label>
						<Select
							value={config.responseType}
							onChange={(e) => updateConfig('responseType', e.target.value)}
						>
							<option value="code">code (Authorization Code)</option>
							<option value="token">token (Implicit)</option>
							<option value="id_token">id_token (Implicit)</option>
							<option value="code id_token">code id_token (Hybrid)</option>
							<option value="code token">code token (Hybrid)</option>
							<option value="code id_token token">code id_token token (Hybrid)</option>
						</Select>
						<div style={{ 
							fontSize: '0.85rem', 
							color: '#666', 
							marginTop: '0.5rem',
							padding: '0.75rem',
							backgroundColor: '#f8f9fa',
							borderRadius: '0.375rem',
							border: '1px solid #e9ecef'
						}}>
							<strong>⚠️ Response Type Compatibility:</strong><br />
							• <strong>code</strong>: Most compatible, works with all PingOne applications<br />
							• <strong>Hybrid flows</strong> (code id_token, code token): Require PingOne application to support hybrid response types<br />
							• <strong>Implicit flows</strong> (token, id_token): Legacy, not recommended for new applications<br />
							<br />
							<em>If you get "unsupported_response_type" errors, try using "code" instead.</em>
						</div>
					</Field>
				)}

				<Field>
					<Label>Token Endpoint Authentication Method</Label>
					<Select
						value={config.tokenEndpointAuthMethod}
						onChange={(e) => updateConfig('tokenEndpointAuthMethod', e.target.value)}
					>
						{TOKEN_ENDPOINT_AUTH_METHODS.map(method => (
							<option key={method.value} value={method.value}>
								{method.label}
							</option>
						))}
					</Select>
					<p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
						{TOKEN_ENDPOINT_AUTH_METHODS.find(m => m.value === config.tokenEndpointAuthMethod)?.description}
					</p>
				</Field>

				<ConfigActions>
					<SaveButton onClick={handleSaveConfig} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Configuration'}
					</SaveButton>
					<CancelButton onClick={() => window.history.back()}>
						Cancel
					</CancelButton>
				</ConfigActions>

				{mode === 'redirect' && (
					<LaunchButton onClick={handleLaunch} disabled={loading}>
						{loading ? 'Processing...' : 'Launch Redirect Flow'}
					</LaunchButton>
				)}

				{mode === 'redirectless' && (
					<ComedyLogin>
						<ComedyHeading>HEB Grocery Login</ComedyHeading>
						<ComedyText>
							For redirectless flow testing, start by logging into your HEB account. 
							After successful login, the authorization code flow will begin automatically.
						</ComedyText>
						<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
							<ComedyButton onClick={() => setHebLoginOpen(true)} disabled={loading}>
								{loading ? 'Processing...' : 'Start HEB Login'}
							</ComedyButton>
							{(flowRequestLog.length > 0 || pendingFlowContext || loading) && (
								<ComedyButton 
									onClick={handleStartOver} 
									disabled={loading}
									style={{ 
										background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
										border: 'none'
									}}
								>
									🔄 Start Over
								</ComedyButton>
							)}
						</div>
					</ComedyLogin>
				)}

				<ColoredUrlDisplay
					url={authUrl}
					label="Authorization URL"
					showOpenButton
				/>
			</Card>

			{/* Educational Sections - Moved Higher on Page */}
			{mode === 'redirectless' && (
				<>
					<Card>
						<CollapsibleHeader
							title="PingOne pi.flow — Required Headers & Content-Types"
							icon={<FiBook />}
							theme="yellow"
							defaultCollapsed={false}
						>
							<div style={{ padding: '1rem 0' }}>
								<p style={{ marginBottom: '1rem' }}>
									<strong>Must-have headers on Flow API action calls (POST /{`{envId}`}/flows/{`{flowId}`}):</strong>
								</p>
								<ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
									<li style={{ marginBottom: '0.75rem' }}>
										<strong>Content-Type:</strong>
										<ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', listStyle: 'disc' }}>
											<li><code>application/vnd.pingidentity.usernamePassword.check+json</code> for username/password checks</li>
											<li><code>application/vnd.pingidentity.otp.check+json</code> for OTP checks (email/SMS/app OTP)</li>
										</ul>
										<div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontStyle: 'italic', color: '#856404' }}>
											⚠️ These are PingOne-specific vendor media types, NOT standard <code>application/json</code>
										</div>
									</li>
									<li style={{ marginBottom: '0.75rem' }}>
										<strong>Accept:</strong> <code>application/json</code> (typical)
									</li>
									<li style={{ marginBottom: '0.75rem' }}>
										<strong>Cookie:</strong> Session cookies from the initial <code>/as/authorize</code> call <strong>MUST be sent</strong>
										<ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', listStyle: 'disc' }}>
											<li>Flow API is <strong>stateful per flowId/session</strong> - cookies maintain the session state</li>
											<li>Use <code>credentials: 'include'</code> in fetch, or manually forward Set-Cookie headers</li>
											<li>The flowId in the URL alone is <strong>not sufficient</strong> - you need both flowId AND cookies</li>
										</ul>
									</li>
								</ul>
								<p style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
									<strong>Important:</strong> Cookies/session from the initial <code>/as/authorize</code> call are captured in Step 1 and automatically forwarded to Step 2. 
									If cookies are missing, the Flow API will reject the request as the flow session cannot be maintained.
								</p>
								<p style={{ marginTop: '0.75rem', fontStyle: 'italic', color: '#664d03' }}>
									📚 <strong>Reference:</strong> See <a href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#flows" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>PingOne Flow API Documentation</a> for complete header requirements.
								</p>
							</div>
						</CollapsibleHeader>
					</Card>

					<Card>
						<CollapsibleHeader
							title="About login_hint_token in Redirectless Flows"
							icon={<FiBook />}
							theme="green"
							defaultCollapsed={true}
						>
							<div style={{ padding: '1rem 0' }}>
								<p style={{ marginBottom: '0.75rem' }}>
									<strong>What is login_hint_token?</strong><br />
									The <code>login_hint_token</code> is an optional signed JWT that you can include in Step 1's authorization request to help PingOne identify the user. Since you've already authenticated the user in your app (via HEB login), this token can pre-populate user information in PingOne's authentication flow.
								</p>
								<p style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
									<strong>When to Use It:</strong>
								</p>
								<ul style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }}>
									<li style={{ marginBottom: '0.5rem' }}><strong>Pre-authenticated users:</strong> When the user has already logged into your application (like HEB login), you can include their identity in the token</li>
									<li style={{ marginBottom: '0.5rem' }}><strong>Improved UX:</strong> Helps PingOne skip unnecessary steps or pre-fill forms</li>
									<li style={{ marginBottom: '0.5rem' }}><strong>Integration scenarios:</strong> Useful when integrating PingOne with existing authentication systems (like PingFederate)</li>
									<li style={{ marginBottom: '0.5rem' }}><strong>MFA-only flows:</strong> When another system handles initial authentication and PingOne only needs to handle MFA</li>
								</ul>
								<p style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
									<strong>Token Structure:</strong><br />
									The JWT contains user identification claims such as:
									<code>username</code>, <code>email</code>, <code>phone</code>, or <code>sub</code> (subject identifier).
									The token must be signed with RS256 or ES256 using a key that PingOne can verify.
								</p>
								<p style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
									<strong>In This Flow:</strong><br />
									You <strong>can optionally</strong> add <code>login_hint_token</code> to Step 1's POST request to <code>/as/authorize</code>. 
									If included, PingOne may use it to identify the user and potentially streamline the authentication process. 
									For this redirectless flow demonstration, we're not including it, but you can add it in production if your application has already authenticated the user.
								</p>
								<p style={{ marginTop: '0.75rem', fontStyle: 'italic', color: '#664d03' }}>
									📚 <strong>Documentation:</strong> See <a href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#create-a-login_hint_token-jwt" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>PingOne API Docs</a> for details on creating login_hint_token JWTs.
								</p>
							</div>
						</CollapsibleHeader>
					</Card>
				</>
			)}

			<HEBLoginPopup
				isOpen={hebLoginOpen}
				onClose={() => setHebLoginOpen(false)}
				onLogin={handleHEBLogin}
				overrides={hebBrandingOverrides}
				onOpenDavinciStudio={openDesignStudio}
			/>

			<ModalPresentationService
				isOpen={showMissingCredentialsModal}
				onClose={() => setShowMissingCredentialsModal(false)}
				title="Credentials required"
				description={
					missingCredentialFields.length > 0
						? `Please provide the following required credential${missingCredentialFields.length > 1 ? 's' : ''} before continuing:`
						: 'Environment ID, Client ID, and Client Secret are required before launching the flow.'
				}
				actions={[
					{
						label: 'Back to configuration',
						onClick: () => setShowMissingCredentialsModal(false),
						variant: 'primary',
					},
				]}
			>
				{missingCredentialFields.length > 0 && (
					<ul style={{ marginTop: '1rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
						{missingCredentialFields.map((field) => (
							<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{field}</li>
						))}
					</ul>
				)}
			</ModalPresentationService>

		{/* Worker Credentials Modal */}
		<ModalPresentationService
			isOpen={showWorkerCredentialsModal}
			onClose={() => setShowWorkerCredentialsModal(false)}
			title="Worker Token Credentials"
			description="Provide credentials for a worker application to access PingOne APIs and list applications. These credentials use the Client Credentials grant (no redirect URI or response type needed)."
			actions={[
				{
					label: 'Cancel',
					onClick: () => setShowWorkerCredentialsModal(false),
					variant: 'secondary',
				},
				{
					label: 'Save & Get Token',
					onClick: () => {
						if (!workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret) {
							v4ToastManager.showError('Please provide all required credentials');
							return;
						}
						// Credentials are saved via useEffect hook on state change
						// Now get the token
						setShowWorkerCredentialsModal(false);
						// Trigger token fetch
						setTimeout(() => {
							handleGetWorkerToken();
						}, 100);
					},
					variant: 'primary',
				},
			]}
		>
			<Field style={{ marginTop: '1rem' }}>
				<Label>Worker Environment ID *</Label>
				<Input
					type="text"
					value={workerCredentials.environmentId}
					onChange={(e) => setWorkerCredentials({ ...workerCredentials, environmentId: e.target.value })}
					placeholder="Enter worker environment ID"
					autoComplete="off"
				/>
			</Field>
			
			<Field>
				<Label>Worker Client ID *</Label>
				<Input
					type="text"
					value={workerCredentials.clientId}
					onChange={(e) => setWorkerCredentials({ ...workerCredentials, clientId: e.target.value })}
					placeholder="Enter worker client ID"
					autoComplete="username"
				/>
			</Field>
			
			<Field>
				<Label>Worker Client Secret *</Label>
				<Input
					type="password"
					value={workerCredentials.clientSecret}
					onChange={(e) => setWorkerCredentials({ ...workerCredentials, clientSecret: e.target.value })}
					placeholder="Enter worker client secret"
					autoComplete="current-password"
				/>
			</Field>
		</ModalPresentationService>

		{/* Authorization URL Validation Modal */}
		<AuthorizationUrlValidationModal
			isOpen={showUrlValidationModal}
			onClose={() => setShowUrlValidationModal(false)}
			validationResult={urlValidationResult}
			authUrl={pendingAuthUrl}
			onProceed={handleUrlValidationProceed}
			onFix={handleUrlValidationFix}
		/>

		{/* Authentication Modal - Shows authorization URL with educational content */}
		{AuthenticationModalService.showModal(
			showAuthenticationModal,
			handleAuthModalCancel,
			handleAuthModalContinue,
			pendingRedirectUrl || '',
			'oauth',
			'PingOne Authentication Playground',
			{
				description: 'You\'re about to be redirected to PingOne for OAuth 2.0 authentication. This uses the Authorization Code Flow with PKCE for enhanced security. Take time to review the authorization URL and its parameters.',
				redirectMode: 'redirect'
			}
		)}
		
		{/* Flow Request Log - Educational Display */}
		{flowRequestLog.length > 0 && (
			<FlowLogContainer>
				<FlowLogTitle>
					📋 pi.flow Request/Response Log
				</FlowLogTitle>
				
				{flowRequestLog.map((log) => (
					<FlowStep key={log.timestamp} $status={log.status || 0}>
						<StepHeader>
							<StepNumber $status={log.status || 0}>{log.step}</StepNumber>
							<StepTitle>{log.title}</StepTitle>
							<StepMethod $method={log.method}>{log.method}</StepMethod>
							{log.status && <StepStatus $status={log.status || 0}>{log.status}</StepStatus>}
						</StepHeader>
						
						<StepUrl>{log.url}</StepUrl>
						
						{Object.keys(log.params).length > 0 && (
							<StepParams>
								{Object.entries(log.params).map(([key, value]) => (
									<ParamItem key={key}>
										<ParamKey>{key}:</ParamKey>
										<ParamValue>{value}</ParamValue>
									</ParamItem>
								))}
							</StepParams>
						)}
						
						{log.requestBody && (
							<StepResponse>
								<ResponseTitle>
									<span>Request Body:</span>
									<ToggleButton
										onClick={() => {
											setExpandedResponses(prev => ({
												...prev,
												[`request-${log.timestamp}`]: !prev[`request-${log.timestamp}`]
											}));
										}}
									>
										{expandedResponses[`request-${log.timestamp}`] ? 'Hide' : 'Show'} Request Body
									</ToggleButton>
								</ResponseTitle>
								{expandedResponses[`request-${log.timestamp}`] && (
									<FullResponseContainer>
										{formatJSONForDisplay(log.requestBody)}
									</FullResponseContainer>
								)}
							</StepResponse>
						)}
						
						<StepNote>{log.note}</StepNote>
						
						{log.response && (
							<StepResponse>
								<ResponseTitle>
									<span>Response Summary:</span>
									{log.fullResponse && (
										<ToggleButton
											onClick={() => {
												setExpandedResponses(prev => ({
													...prev,
													[log.timestamp]: !prev[log.timestamp]
												}));
											}}
										>
											{expandedResponses[log.timestamp] ? 'Hide' : 'Show'} Full Response
										</ToggleButton>
									)}
								</ResponseTitle>
								{Object.entries(log.response).map(([key, value]) => {
									// Highlight error fields
									const isErrorField = key.includes('error') || key === 'error_code' || key === 'error_description';
									return (
										<ParamItem key={key}>
											<ParamKey style={isErrorField ? { color: '#dc3545', fontWeight: 600 } : {}}>{key}:</ParamKey>
											<ParamValue style={isErrorField ? { color: '#dc3545', fontWeight: 600 } : {}}>{String(value)}</ParamValue>
										</ParamItem>
									);
								})}
								{log.fullResponse && expandedResponses[log.timestamp] && (
									<FullResponseContainer>
										{formatJSONForDisplay(log.fullResponse)}
									</FullResponseContainer>
								)}
							</StepResponse>
						)}
					</FlowStep>
				))}
			</FlowLogContainer>
		)}

		{/* Latest Tokens - Real tokens with Decode/Copy using UnifiedTokenDisplay */}
		{latestTokens && (
			<Card>
				<SectionTitle>Latest Tokens</SectionTitle>
				{UnifiedTokenDisplayService.showTokens(
					latestTokens,
					config.scopes.includes('openid') ? 'oidc' : 'oauth',
					'pingone-authentication',
					{ showCopyButtons: true, showDecodeButtons: true }
				)}
			</Card>
		)}
		
		</Page>
	);
};

export default PingOneAuthentication;