import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { useAuth } from '../contexts/NewAuthContext';
import { callbackUriService } from '../services/callbackUriService';
import ModalPresentationService from '../services/modalPresentationService';
import { CredentialGuardService } from '../services/credentialGuardService';
import HEBLoginPopup, { type HEBLoginCredentials } from '../components/HEBLoginPopup';
import AuthorizationUrlValidationModal from '../components/AuthorizationUrlValidationModal';
import { authorizationUrlValidationService } from '../services/authorizationUrlValidationService';
import { AuthenticationModalService } from '../services/authenticationModalService';
import { FlowHeader } from '../services/flowHeaderService';

type LoginMode = 'redirect' | 'redirectless';

export interface PlaygroundConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	responseType: string;
	tokenEndpointAuthMethod: string;
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
export const REDIRECTLESS_CREDS_KEY = 'pingone_login_redirectless_creds';

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
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	padding: 2rem;
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	color: #333;
	font-size: 2rem;
	font-weight: bold;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	color: #666;
	font-size: 1.1rem;
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

const Modes = styled.div`
	display: grid;
	grid-template-columns: 1fr 1.5fr 1fr;
	gap: 1rem;
	margin-bottom: 2rem;
`;

const ModeButton = styled.button<{ $active: boolean }>`
	padding: 1rem;
	border: 2px solid ${props => props.$active ? '#007bff' : '#ddd'};
	border-radius: 8px;
	background: ${props => props.$active ? '#f8f9ff' : 'white'};
	color: ${props => props.$active ? '#007bff' : '#666'};
	font-weight: ${props => props.$active ? '600' : '400'};
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		border-color: #007bff;
		background: #f8f9ff;
	}
`;

const ModeDetails = styled.div`
	grid-column: 2;
	padding: 1rem;
	background: #f8f9fa;
	border-radius: 8px;
	color: #666;
	font-size: 0.9rem;
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

const AuthUrlDisplay = styled.div`
	background: #f8f9fa;
	border: 1px solid #ddd;
	border-radius: 6px;
	padding: 1.25rem;
	margin-top: 2rem;
	font-family: monospace;
	font-size: 0.9rem;
	color: #333;
	word-break: break-all;
	line-height: 1.5;
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

const ComedyInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ffeaa7;
	border-radius: 6px;
	margin-bottom: 0.5rem;
	color: #856404;
	background: white;
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

const PingOneAuthentication: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
	const [mode, setMode] = useState<LoginMode>('redirect');
	const [loading, setLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
	const [redirectlessCreds, setRedirectlessCreds] = useState(DEFAULT_REDIRECTLESS_CREDS);
	const [redirectlessShown, setRedirectlessShown] = useState(false);
	const [hebLoginOpen, setHebLoginOpen] = useState(false);
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);
	const [showUrlValidationModal, setShowUrlValidationModal] = useState(false);
	const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);
	const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string>('');
	const [urlValidationResult, setUrlValidationResult] = useState<{
		isValid: boolean;
		errors: string[];
		warnings: string[];
		suggestions: string[];
		parsedUrl: any;
		flowType: string;
		severity: string;
	} | null>(null);
	const [pendingAuthUrl, setPendingAuthUrl] = useState<string>('');

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
		const base = `https://auth.pingone.com/${config.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			response_type: config.responseType,
			client_id: config.clientId,
			redirect_uri: config.redirectUri,
			scope: config.scopes,
			state: 'pi-flow-' + Date.now()
		});
		return `${base}?${params.toString()}`;
	}, [config.environmentId, config.clientId, config.responseType, config.redirectUri, config.scopes]);

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

	const runRedirectlessLogin = useCallback(async () => {
		setLoading(true);
		try {
			// First, check network connectivity
			v4ToastManager.showInfo('Checking network connectivity to PingOne...');
			
			try {
				const connectivityResponse = await fetch('/api/network/check', {
					method: 'GET',
					credentials: 'include'
				});
				
				if (!connectivityResponse.ok) {
					const errorData = await connectivityResponse.json();
					throw new Error(errorData.message || 'Network connectivity check failed');
				}
				
				const connectivityData = await connectivityResponse.json();
				console.log('🔍 [PingOneAuthentication] Network check result:', connectivityData);
				v4ToastManager.showSuccess('Network connectivity confirmed');
			} catch (connectivityError) {
				console.error('🔍 [PingOneAuthentication] Network check failed:', connectivityError);
				v4ToastManager.showError('Network connectivity issue detected. Please check your internet connection.');
				throw new Error('Network connectivity to PingOne failed. Please check your internet connection and try again.');
			}
			
			const environmentId = config.environmentId.trim() || DEFAULT_CONFIG.environmentId;
			const state = `pi-flow-${Date.now()}`;
			
			// Generate PKCE codes for redirectless authorization code flow
			const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			
			// Store PKCE codes for later use
			setRedirectlessCreds(prev => ({
				...prev,
				codeVerifier,
				codeChallenge
			}));

			// Step 1: Start authorization with PKCE via backend to avoid CORS
			v4ToastManager.showInfo('Starting PingOne authorization request...');
			const response = await fetch('/api/pingone/redirectless/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					environmentId: environmentId,
					clientId: config.clientId.trim() || DEFAULT_CONFIG.clientId,
					clientSecret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret,
					scopes: config.scopes.trim() || DEFAULT_CONFIG.scopes,
					codeChallenge: codeChallenge,
					codeChallengeMethod: 'S256',
					state: state,
					username: redirectlessCreds.username,
					password: redirectlessCreds.password
				})
			});

			if (!response.ok) {
				let errorMessage = `Authorization request failed (status ${response.status})`;
				try {
					const errorBody = await response.json();
					console.log('🔍 [PingOneAuthentication] Authorization error:', JSON.stringify(errorBody, null, 2));
					errorMessage = errorBody?.error_description || errorBody?.message || errorBody?.error || errorMessage;
					
					// Provide more specific error messages based on error type
					if (errorBody?.error === 'dns_resolution_failed') {
						errorMessage = 'Cannot reach PingOne servers. Please check your internet connection.';
					} else if (errorBody?.error === 'connection_refused') {
						errorMessage = 'PingOne servers are currently unavailable. Please try again later.';
					} else if (errorBody?.error === 'request_timeout') {
						errorMessage = 'PingOne servers are not responding. Please try again.';
					}
				} catch {
					// ignore
				}
				throw new Error(errorMessage);
			}

			const data: Record<string, unknown> = await response.json();
			console.log('🔍 [PingOneAuthentication] Authorization response data:', JSON.stringify(data, null, 2));

			// Check if we got a resumeUrl (for redirectless flow only)
			const resumeUrl = data.resumeUrl as string;
			const flowId = data.id as string;
			
			if (resumeUrl && flowId && mode === 'redirectless') {
				console.log('🔍 [PingOneAuthentication] Got resumeUrl for redirectless flow, calling resume endpoint...');
				
				// Step 2: Call the resume endpoint to get authorization code
				const resumeResponse = await fetch('/api/pingone/resume', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						resumeUrl: resumeUrl,
						flowId: flowId,
						flowState: state,
						clientId: config.clientId.trim() || DEFAULT_CONFIG.clientId,
						clientSecret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret,
						environmentId: config.environmentId.trim() || DEFAULT_CONFIG.environmentId,
						redirectUri: config.redirectUri.trim() || DEFAULT_CONFIG.redirectUri,
						codeVerifier: redirectlessCreds.codeVerifier || undefined
					})
				});

				if (!resumeResponse.ok) {
					let errorMessage = `Resume request failed (status ${resumeResponse.status})`;
					try {
						const errorBody = await resumeResponse.json();
						console.log('🔍 [PingOneAuthentication] Resume error response:', JSON.stringify(errorBody, null, 2));
						errorMessage = errorBody?.error_description || errorBody?.message || errorBody?.error || errorMessage;
					} catch (parseError) {
						console.log('🔍 [PingOneAuthentication] Could not parse error response:', parseError);
					}
					throw new Error(errorMessage);
				}

				const resumeData: Record<string, unknown> = await resumeResponse.json();
				console.log('🔍 [PingOneAuthentication] Resume response data:', JSON.stringify(resumeData, null, 2));

				// Check if we got an authorization code from resume
				const authorizationCode = resumeData.code as string;
				if (authorizationCode) {
					console.log('🔍 [PingOneAuthentication] Got authorization code, exchanging for tokens...');
					
					// Step 3: Exchange authorization code for tokens
					const tokenResponse = await fetch('/api/token-exchange', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						credentials: 'include',
						body: JSON.stringify({
							grant_type: 'authorization_code',
							code: authorizationCode,
							code_verifier: codeVerifier,
							redirect_uri: 'urn:pingidentity:redirectless',
							environment_id: environmentId,
							client_id: config.clientId.trim() || DEFAULT_CONFIG.clientId,
							client_secret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret
						})
					});

					if (!tokenResponse.ok) {
						let errorMessage = `Token exchange failed (status ${tokenResponse.status})`;
						try {
							const errorBody = await tokenResponse.json();
							console.log('🔍 [PingOneAuthentication] Token exchange error:', JSON.stringify(errorBody, null, 2));
							errorMessage = errorBody?.message || errorBody?.error_description || errorBody?.error || errorMessage;
						} catch {
							// ignore
						}
						throw new Error(errorMessage);
					}

					const tokenData: Record<string, unknown> = await tokenResponse.json();
					console.log('🔍 [PingOneAuthentication] Token exchange successful:', JSON.stringify(tokenData, null, 2));

					// Extract tokens from token exchange response
					const tokens: Record<string, string> = {};
					if (tokenData.access_token && typeof tokenData.access_token === 'string') {
						tokens.access_token = tokenData.access_token;
					}
					if (tokenData.id_token && typeof tokenData.id_token === 'string') {
						tokens.id_token = tokenData.id_token;
					}
					if (tokenData.refresh_token && typeof tokenData.refresh_token === 'string') {
						tokens.refresh_token = tokenData.refresh_token;
					}

					const redirectlessContext = {
						isRedirectless: true,
						redirectlessUsername: redirectlessCreds.username,
						resumeUrl: null,
						flowId: null
					};

					const result: PlaygroundResult = {
						timestamp: Date.now(),
						mode: 'redirectless',
						responseType: config.responseType,
						tokens,
						config,
						authUrl: `https://auth.pingone.com/${environmentId}/as/authorize`,
						context: redirectlessContext
					};

					sessionStorage.removeItem(FLOW_CONTEXT_KEY);
					localStorage.removeItem(RESULT_STORAGE_KEY);
					localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));

					v4ToastManager.showSuccess('Redirectless login successful! Tokens obtained.');
					navigate('/pingone-authentication/result');
					return;
				} else {
					throw new Error('No authorization code received after calling resume endpoint');
				}
			} else {
				// Fallback: Check for direct tokens (for implicit flow)
				const tokens: Record<string, string> = {};
				if (data.access_token && typeof data.access_token === 'string') {
					tokens.access_token = data.access_token;
				}
				if (data.id_token && typeof data.id_token === 'string') {
					tokens.id_token = data.id_token;
				}
				if (data.refresh_token && typeof data.refresh_token === 'string') {
					tokens.refresh_token = data.refresh_token;
				}

				const redirectlessContext = {
					isRedirectless: true,
					redirectlessUsername: redirectlessCreds.username,
					resumeUrl: (data?.resumeUrl as string) || ((data?.flow as Record<string, unknown>)?.resumeUrl as string) || null,
					flowId: (data?.id as string) || ((data?.flow as Record<string, unknown>)?.id as string) || null
				};

				const tokenCount = Object.keys(tokens).length;

				const result: PlaygroundResult = {
					timestamp: Date.now(),
					mode: 'redirectless',
					responseType: config.responseType,
					tokens,
					config,
					authUrl: `https://auth.pingone.com/${environmentId}/as/authorize`,
					context: redirectlessContext
				};

				sessionStorage.removeItem(FLOW_CONTEXT_KEY);
				localStorage.removeItem(RESULT_STORAGE_KEY);
				localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));

				if (tokenCount > 0) {
					v4ToastManager.showSuccess('Redirectless login succeeded. Tokens captured without a redirect.');
					navigate('/pingone-authentication/result');
				} else if (redirectlessContext.resumeUrl) {
					v4ToastManager.showInfo('Redirectless flow established. Continue the flow using the captured resume metadata.');
					navigate('/pingone-authentication/result');
				} else {
					v4ToastManager.showError('PingOne did not return tokens or a resume URL. Please check your configuration and try again.');
					// Don't navigate to result page if no tokens were received
				}
			}
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
		try {
			setLoading(true);
			v4ToastManager.showInfo('Processing HEB login credentials...');
			
			// Simulate processing the credentials
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Update redirectless credentials with HEB login data
			setRedirectlessCreds(prev => ({
				...prev,
				username: credentials.username,
				password: credentials.password
			}));
			
			v4ToastManager.showSuccess('HEB credentials captured! Starting authentication...');
			
			// Start the redirectless flow with the captured credentials
			await runRedirectlessLogin();
			
		} catch (error) {
			console.error('[PingOneAuthentication] HEB login error:', error);
			v4ToastManager.showError('Failed to process HEB login. Please try again.');
			throw error;
		} finally {
			setLoading(false);
		}
	}, [runRedirectlessLogin]);

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
			
			// Store flow context for callback
			sessionStorage.setItem(FLOW_CONTEXT_KEY, JSON.stringify({
				environmentId: config.environmentId,
				clientId: config.clientId,
				responseType: config.responseType,
				returnPath: '/pingone-authentication/result',
				timestamp: Date.now(),
			}));
			
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
			setRedirectlessShown(true);
			try {
				sessionStorage.removeItem(FLOW_CONTEXT_KEY);
			} catch (error) {
				console.warn('[PingOneAuthentication] Failed to clear flow context:', error);
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
			window.location.href = pendingRedirectUrl;
		}, 500);
	}, [pendingRedirectUrl]);

	const handleAuthModalCancel = useCallback(() => {
		console.log('🚫 [PingOneAuthentication] User cancelled authentication');
		setShowAuthenticationModal(false);
		setPendingRedirectUrl('');
		v4ToastManager.showInfo('Authentication cancelled');
	}, []);

	return (
		<Page>
		<FlowHeader 
			flowType="pingone"
			customConfig={{
				flowType: 'pingone',
				title: 'PingOne Authentication Playground',
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
				<Field>
					<Label>Environment ID</Label>
					<Input
						type="text"
						value={config.environmentId}
						onChange={(e) => updateConfig('environmentId', e.target.value)}
						placeholder="Enter your PingOne environment ID"
					/>
				</Field>

				<Field>
					<Label>Client ID</Label>
					<Input
						type="text"
						value={config.clientId}
						onChange={(e) => updateConfig('clientId', e.target.value)}
						placeholder="Enter your PingOne client ID"
					/>
				</Field>

				<Field>
					<Label>Client Secret</Label>
					<Input
						type="password"
						value={config.clientSecret}
						onChange={(e) => updateConfig('clientSecret', e.target.value)}
						placeholder="Enter your PingOne client secret"
					/>
				</Field>

				<Field>
					<Label>Redirect URI</Label>
					<Input
						type="text"
						value={config.redirectUri}
						onChange={(e) => updateConfig('redirectUri', e.target.value)}
						placeholder="Enter your redirect URI"
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
						5. Make sure <strong>PKCE</strong> is enabled for enhanced security
					</div>
				</Field>

				<Field>
					<Label>Scopes</Label>
					<Input
						type="text"
						value={config.scopes}
						onChange={(e) => updateConfig('scopes', e.target.value)}
						placeholder="e.g., openid profile email"
					/>
				</Field>

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
							For redirectless flow testing, we'll use a simulated HEB grocery login page.
						</ComedyText>
						<ComedyButton onClick={() => setHebLoginOpen(true)}>
							Open HEB Login
						</ComedyButton>
					</ComedyLogin>
				)}

				<AuthUrlDisplay>
					<strong>Authorization URL:</strong><br />
					{authUrl}
				</AuthUrlDisplay>
			</Card>

			<HEBLoginPopup
				isOpen={hebLoginOpen}
				onClose={() => setHebLoginOpen(false)}
				onLogin={handleHEBLogin}
				title="HEB"
				subtitle="Sign in to your HEB account"
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
			pendingRedirectUrl,
			'oauth',
			'PingOne Authentication Playground',
			{
				description: 'You\'re about to be redirected to PingOne for OAuth 2.0 authentication. This uses the Authorization Code Flow with PKCE for enhanced security. Take time to review the authorization URL and its parameters.',
				redirectMode: 'redirect'
			}
		)}
		</Page>
	);
};

export default PingOneAuthentication;