	import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { useAuth } from '../contexts/NewAuthContext';

type LoginMode = 'redirect' | 'redirectless';

export interface PlaygroundConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	responseType: string;
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

export const STORAGE_KEY = 'pingone_login_playground_config';
export const RESULT_STORAGE_KEY = 'pingone_login_playground_result';
export const FLOW_CONTEXT_KEY = 'pingone_login_playground_context';
export const REDIRECTLESS_CREDS_KEY = 'pingone_login_redirectless_creds';

export const DEFAULT_CONFIG: PlaygroundConfig = {
	environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
	clientId: 'sample-client-id-1234',
	clientSecret: 'sample-client-secret-shhh',
	redirectUri: 'https://localhost:3000/authz-callback',
	scopes: 'openid profile email',
	responseType: 'token'
};

const DEFAULT_REDIRECTLESS_CREDS = {
	username: 'curtis7',
	password: 'Wolverine7&'
};

export const RESPONSE_TYPES = [
	{ value: 'token', label: 'token (Implicit Access Token)' },
	{ value: 'id_token', label: 'id_token (OIDC Implicit)' },
	{ value: 'id_token token', label: 'id_token token (Hybrid Implicit)' }
];

const Page = styled.div`
	min-height: 100vh;
	padding: 3rem 1.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: radial-gradient(circle at top left, #fde68a 0%, transparent 55%),
		rgba(15, 23, 42, 0.95);
	color: #f8fafc;
	font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Layout = styled.div`
	max-width: 1040px;
	width: 100%;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
`;

const Card = styled.section<{ $tone?: 'primary' | 'secondary' | 'comedy' }>`
	background: ${({ $tone }) =>
		$tone === 'primary'
			? 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9))'
			: $tone === 'comedy'
				? 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(217,70,239,0.9))'
				: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,58,138,0.85))'};
	border-radius: 20px;
	padding: 2rem;
	box-shadow: 0 35px 80px -30px rgba(14, 116, 144, 0.45);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.08);
`;

const Title = styled.h1`
	font-size: 2.25rem;
	margin-bottom: 0.5rem;
	text-align: center;
	line-height: 1.1;
`;

const Subtitle = styled.p`
	max-width: 720px;
	margin: 0 auto 2.5rem;
	text-align: center;
	color: rgba(226, 232, 240, 0.85);
	font-size: 1rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.15rem;
	margin-bottom: 1.25rem;
	font-weight: 600;
	letter-spacing: 0.01em;
`;

const Callout = styled.div`
	margin-top: 1.5rem;
	padding: 1rem 1.25rem;
	border-radius: 14px;
	background: rgba(56, 189, 248, 0.18);
	border: 1px solid rgba(125, 211, 252, 0.45);
	color: rgba(240, 249, 255, 0.95);
	font-size: 0.88rem;
	line-height: 1.55;
	code {
		background: rgba(15, 23, 42, 0.35);
		color: #fbbf24;
		padding: 0.15rem 0.45rem;
		border-radius: 8px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
`;

const Field = styled.label`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1.25rem;
	font-size: 0.9rem;
`;

const Input = styled.input`
	border-radius: 14px;
	border: 1px solid rgba(148, 163, 184, 0.35);
	padding: 0.75rem 1rem;
	font-size: 0.95rem;
	background: rgba(15, 23, 42, 0.38);
	color: #f8fafc;
	outline: none;
	transition: border 0.2s ease, transform 0.2s ease;

	&:focus {
		border-color: rgba(14, 165, 233, 0.9);
		transform: translateY(-1px);
	}

	&::placeholder {
		color: rgba(148, 163, 184, 0.65);
	}
`;

const Modes = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const ModeButton = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.9rem 1.2rem;
	border-radius: 16px;
	border: 1px solid ${({ $active }) =>
		$active ? 'rgba(56,189,248,0.9)' : 'rgba(148,163,184,0.35)'};
	background: ${({ $active }) =>
		$active ? 'rgba(14,116,144,0.35)' : 'rgba(15,23,42,0.55)'};
	color: inherit;
	cursor: pointer;
	transition: border 0.2s ease, transform 0.2s ease, background 0.2s ease;
	text-align: left;

	&:hover {
		border-color: rgba(56, 189, 248, 0.7);
		transform: translateY(-1px);
	}
`;

const ModeDetails = styled.div`
	font-size: 0.85rem;
	color: rgba(226, 232, 240, 0.75);
`;

const LaunchButton = styled.button<{ disabled?: boolean }>`
	margin-top: 1.5rem;
	width: 100%;
	padding: 0.95rem 1.25rem;
	border-radius: 16px;
	border: none;
	background: linear-gradient(135deg, rgba(13, 148, 136, 0.95), rgba(59, 130, 246, 0.95));
	color: #f8fafc;
	font-weight: 600;
	font-size: 1rem;
	cursor: pointer;
	box-shadow: 0 25px 45px -18px rgba(56, 189, 248, 0.6);
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 30px 55px -20px rgba(56, 189, 248, 0.75);
	}

	&:disabled {
		opacity: 0.65;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;

const AuthUrlDisplay = styled.pre`
	margin-top: 1.5rem;
	border-radius: 16px;
	background: rgba(15, 23, 42, 0.75);
	padding: 1rem;
	font-size: 0.78rem;
	line-height: 1.4;
	color: rgba(226, 232, 240, 0.85);
	overflow-x: auto;
	border: 1px solid rgba(56, 189, 248, 0.25);
`;

const ComedyLogin = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1.5rem;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 18px;
	padding: 1.5rem;
	border: 1px dashed rgba(15, 118, 110, 0.45);
`;

const ComedyHeading = styled.h3`
	margin: 0;
	font-size: 1.2rem;
	color: #fef08a;
`;

const ComedyText = styled.p`
	margin: 0;
	font-size: 0.9rem;
	color: rgba(248, 250, 252, 0.85);
`;

const ComedyInput = styled.input`
	border-radius: 12px;
	border: 1px solid rgba(251, 191, 36, 0.5);
	background: rgba(15, 23, 42, 0.65);
	color: #fef08a;
	padding: 0.7rem 0.95rem;
	font-size: 0.95rem;
	outline: none;

	&::placeholder {
		color: rgba(253, 224, 71, 0.6);
	}
`;

const ComedyButton = styled.button<{ disabled?: boolean }>`
	border-radius: 999px;
	padding: 0.75rem 1.5rem;
	background: linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(239, 68, 68, 0.9));
	border: none;
	color: #fff7ed;
	font-weight: 600;
	letter-spacing: 0.04em;
	cursor: pointer;
	box-shadow: 0 20px 35px -18px rgba(239, 68, 68, 0.7);
	transition: transform 0.2s ease;

	&:hover {
		transform: translateY(-2px) rotate(-1deg);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;

const ConfigActions = styled.div`
	margin-top: 1rem;
	display: flex;
	gap: 0.75rem;
`;

const SaveButton = styled.button`
	border-radius: 14px;
	padding: 0.7rem 1.2rem;
	border: 1px solid rgba(125, 211, 252, 0.6);
	background: rgba(14, 116, 144, 0.35);
	color: #f1f5f9;
	font-weight: 600;
	letter-spacing: 0.02em;
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 18px 32px -20px rgba(56, 189, 248, 0.6);
		background: rgba(14, 116, 144, 0.55);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;


const PingOneAuthentication: React.FC = () => {
	const { config: authContextConfig } = useAuth();
	const [config, setConfig] = useState<PlaygroundConfig>(() => ({
		...DEFAULT_CONFIG,
		// Override with values from AuthContext if available, otherwise use correct stored credentials
		environmentId: authContextConfig?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
		clientId: authContextConfig?.clientId || 'c70bb938-8a65-4508-b761-a5e02e0f543b',
		clientSecret: authContextConfig?.clientSecret || 'j77noWxt6R~3_QoVd9kloSMm7ahghrmXoZHnOT~SsvNrDDs4xUs5DcwxU5ogRCLI',
		redirectUri: authContextConfig?.redirectUri || 'https://localhost:3000/mfa-callback',
		scopes: (Array.isArray(authContextConfig?.scopes) ? authContextConfig.scopes.join(' ') : authContextConfig?.scopes) || 'openid profile email',
	}));
	const [mode, setMode] = useState<LoginMode>('redirect');
	const [redirectlessShown, setRedirectlessShown] = useState(false);
	const [redirectlessCreds, setRedirectlessCreds] = useState(DEFAULT_REDIRECTLESS_CREDS);
	const [redirectlessFlowContext, setRedirectlessFlowContext] = useState<{
		resumeUrl: string | null;
		flowId: string | null;
		flowState?: string | null;
		flowEnvironment?: string | null;
		flowLinks?: unknown;
		tokens?: Record<string, string>;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const [isSaving, setIsSaving] = useState(false);
	const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
	const popupRef = useRef<Window | null>(null);

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

	// Sync with AuthContext when it changes
	useEffect(() => {
		if (authContextConfig) {
			setConfig(prev => ({
				...prev,
				environmentId: authContextConfig.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
				clientId: authContextConfig.clientId || 'c70bb938-8a65-4508-b761-a5e02e0f543b',
				clientSecret: authContextConfig.clientSecret || 'j77noWxt6R~3_QoVd9kloSMm7ahghrmXoZHnOT~SsvNrDDs4xUs5DcwxU5ogRCLI',
				redirectUri: authContextConfig.redirectUri || 'https://localhost:3000/mfa-callback',
				scopes: (Array.isArray(authContextConfig.scopes) ? authContextConfig.scopes.join(' ') : authContextConfig.scopes) || 'openid profile email',
			}));
		}
	}, [authContextConfig]);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				setConfig(prev => ({
					...prev,
					...parsed,
					responseType: parsed?.responseType || prev.responseType || DEFAULT_CONFIG.responseType,
				}));
			}
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to load saved config:', error);
		} finally {
			setHasLoadedConfig(true);
		}
	}, []);

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

	useEffect(() => {
		try {
			const storedCreds = localStorage.getItem(REDIRECTLESS_CREDS_KEY);
			if (storedCreds) {
				const parsed = JSON.parse(storedCreds) as typeof redirectlessCreds;
				setRedirectlessCreds({
					username: parsed.username ?? DEFAULT_REDIRECTLESS_CREDS.username,
					password: parsed.password ?? DEFAULT_REDIRECTLESS_CREDS.password
				});
			}
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to load redirectless credentials:', error);
		}
	}, []);

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

	const authUrl = useMemo(() => {
		const environment = config.environmentId.trim() || DEFAULT_CONFIG.environmentId;
		const base = `https://auth.pingone.com/${environment}/as/authorize`;
		if (mode === 'redirectless') {
			return `${base} (POST)`;
		}
		const params = new URLSearchParams({
			client_id: config.clientId.trim() || DEFAULT_CONFIG.clientId,
			response_type: config.responseType || 'token',
			scope: config.scopes.trim() || 'openid',
			state: `giggles-${Date.now()}`,
			redirect_uri: config.redirectUri.trim() || DEFAULT_CONFIG.redirectUri
		});
		return `${base}?${params.toString()}`;
	}, [config, mode]);

	const runRedirectlessLogin = useCallback(async () => {
		setLoading(true);
		try {
			setRedirectlessFlowContext(null);
			const environmentId = config.environmentId.trim() || DEFAULT_CONFIG.environmentId;
			const authorizeEndpoint = `https://auth.pingone.com/${environmentId}/as/authorize`;
			const state = `pi-flow-${Date.now()}`;
			// Generate PKCE codes for authorization code flow
			const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			const payload: Record<string, unknown> = {
				environmentId,
				clientId: config.clientId.trim() || DEFAULT_CONFIG.clientId,
				responseType: 'code', // Use 'code' for proper authorization code flow
				scope: config.scopes.trim() || 'openid',
				state,
				responseMode: 'pi.flow',
				codeChallenge,
				codeChallengeMethod: 'S256'
			};

			if (config.redirectUri.trim()) {
				payload.redirectUri = config.redirectUri.trim();
			}

			if (redirectlessCreds.username) {
				payload.username = redirectlessCreds.username;
			}
			if (redirectlessCreds.password) {
				payload.password = redirectlessCreds.password;
			}

			// Convert payload to URLSearchParams format (like the working flow)
			const formData = new URLSearchParams();
			Object.entries(payload).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					formData.append(key, String(value));
				}
			});

			console.log('🔍 [PingOneAuthentication] Sending form data:', formData.toString());

			const response = await fetch('/api/pingone/redirectless/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Accept': 'application/json'
				},
				credentials: 'include',
				body: formData.toString()
			});

			console.log('🔍 [PingOneAuthentication] Response status:', response.status);
			console.log('🔍 [PingOneAuthentication] Response ok:', response.ok);
			console.log('🔍 [PingOneAuthentication] Response headers:', Object.fromEntries(response.headers.entries()));

			if (!response.ok) {
				let errorMessage = `Redirectless login failed (status ${response.status})`;
				try {
					const errorBody = await response.json();
					console.log('🔍 [PingOneAuthentication] Error response body:', JSON.stringify(errorBody, null, 2));
					errorMessage =
						errorBody?.message ||
						errorBody?.error_description ||
						errorBody?.error ||
						errorMessage;
				} catch {
					// ignore
				}
				throw new Error(errorMessage);
			}

			const data: Record<string, unknown> = await response.json();
			console.log('🔍 [PingOneAuthentication] Authorization response data:', JSON.stringify(data, null, 2));

			// Check if we got a resumeUrl (for redirectless flow)
			const resumeUrl = data.resumeUrl as string;
			const flowId = data.id as string;
			if (resumeUrl && flowId) {
				console.log('🔍 [PingOneAuthentication] Got resumeUrl, calling resume endpoint...');
				
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
						clientSecret: config.clientSecret.trim() || DEFAULT_CONFIG.clientSecret
					})
				});

				if (!resumeResponse.ok) {
					let errorMessage = `Resume request failed (status ${resumeResponse.status})`;
					try {
						const errorBody = await resumeResponse.json();
						console.log('🔍 [PingOneAuthentication] Resume error:', JSON.stringify(errorBody, null, 2));
						errorMessage = errorBody?.message || errorBody?.error_description || errorBody?.error || errorMessage;
					} catch {
						// ignore
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
							redirect_uri: 'urn:pingidentity:redirectless', // Use redirectless redirect URI
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

					// Set the tokens in the redirectless context
					setRedirectlessFlowContext({
						resumeUrl: null,
						flowId: null,
						flowState: null,
						flowEnvironment: null,
						flowLinks: null,
						tokens
					});

					v4ToastManager.showSuccess('Redirectless login successful! Tokens obtained.');
					return;
				} else {
					throw new Error('No authorization code received after calling resume endpoint');
				}
			}

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
				flowId: (data?.id as string) || ((data?.flow as Record<string, unknown>)?.id as string) || null,
				flowState: ((data?.flow as Record<string, unknown>)?.state as string) || (data?.state as string) || null,
				flowEnvironment: ((data?.flow as Record<string, unknown>)?.environment as Record<string, unknown>) || (data?.environment as Record<string, unknown>) || null,
				flowLinks: (data?._links as Record<string, unknown>) || ((data?.flow as Record<string, unknown>)?.links as Record<string, unknown>) || null
			};
			setRedirectlessFlowContext({
				resumeUrl: redirectlessContext.resumeUrl,
				flowId: redirectlessContext.flowId,
				flowState: redirectlessContext.flowState,
				flowEnvironment: redirectlessContext.flowEnvironment ? JSON.stringify(redirectlessContext.flowEnvironment) : null,
				flowLinks: redirectlessContext.flowLinks
			});

			const tokenCount = Object.keys(tokens).length;

			const result: PlaygroundResult = {
				timestamp: Date.now(),
				mode,
				responseType: config.responseType,
				tokens,
				config,
				authUrl: authorizeEndpoint,
				context: redirectlessContext
			};

			sessionStorage.removeItem(FLOW_CONTEXT_KEY);
			localStorage.removeItem(RESULT_STORAGE_KEY);
			localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));

			if (tokenCount > 0) {
				v4ToastManager.showSuccess('Redirectless login succeeded. Tokens captured without a redirect.');
			} else if (redirectlessContext.resumeUrl) {
				v4ToastManager.showInfo('Redirectless flow established. Continue the flow using the captured resume metadata.');
			} else {
				v4ToastManager.showWarning('PingOne did not return tokens or a resume URL. Double-check your configuration.');
			}

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

	const handleLaunch = useCallback(() => {
		if (loading) {
			return;
		}
		if (!config.clientSecret.trim()) {
			v4ToastManager.showError('Client secret required. We are assuming client credentials with client_secret_basic.');
			return;
		}
		if (mode === 'redirect') {
			localStorage.removeItem(RESULT_STORAGE_KEY);
			try {
				sessionStorage.setItem(
					FLOW_CONTEXT_KEY,
					JSON.stringify({
						mode: 'redirect',
						responseType: config.responseType,
						returnPath: '/pingone-authentication/result',
						timestamp: Date.now(),
					})
				);
			} catch (error) {
				console.warn('[PingOneAuthentication] Failed to persist flow context:', error);
			}
			popupRef.current = window.open(authUrl, 'PingOneLoginWindow', 'width=480,height=720');
			v4ToastManager.showSuccess(
				'Launching PingOne hosted login – complete it and we\'ll capture tokens on the callback page.'
			);
			return;
		}

		// Redirectless mode: run the flow immediately and navigate to results
		setRedirectlessShown(true);
		try {
			sessionStorage.removeItem(FLOW_CONTEXT_KEY);
		} catch (error) {
			console.warn('[PingOneAuthentication] Failed to clear flow context:', error);
		}
		v4ToastManager.showInfo('Starting redirectless authentication with PingOne…');
		void runRedirectlessLogin();
	}, [authUrl, config, config.responseType, loading, mode, runRedirectlessLogin]);

	const handleRedirectlessSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!redirectlessCreds.username || !redirectlessCreds.password) {
				v4ToastManager.showError('Even imaginary users need both a username and password.');
				return;
			}
			if (!config.clientSecret.trim()) {
				v4ToastManager.showError('Please provide a client secret so our client_secret_basic exchange can play along.');
				return;
			}

			v4ToastManager.showInfo('Starting redirectless authentication with PingOne…');
			void runRedirectlessLogin();
		},
		[config.clientSecret, redirectlessCreds.password, redirectlessCreds.username, runRedirectlessLogin]
	);

	return (
		<Page>
			<Title>PingOne Login Playground</Title>
			<Subtitle>
				Pick your adventure: let PingOne host the login page. You sit back and sip espresso while the browser
				does a round-trip.
				reluctantly serious redirectless experience powered by <code>response_mode=pi.flow</code>.
			</Subtitle>

			<Layout>
				<Card $tone="primary">
					<SectionTitle>Configuration</SectionTitle>
					<Field>
						<span>Environment ID</span>
						<Input
							placeholder={DEFAULT_CONFIG.environmentId}
							value={config.environmentId}
							onChange={event => updateConfig('environmentId', event.target.value)}
						/>
					</Field>
					<Field>
						<span>Client ID</span>
						<Input
							placeholder={DEFAULT_CONFIG.clientId}
							value={config.clientId}
							onChange={event => updateConfig('clientId', event.target.value)}
						/>
					</Field>
					<Field>
						<span>Client Secret</span>
						<Input
							type="password"
							placeholder="super-secret-service-account"
							value={config.clientSecret}
							onChange={event => updateConfig('clientSecret', event.target.value)}
						/>
					</Field>
					<Field>
						<span>Redirect URI (redirect mode only)</span>
						<Input
							placeholder={DEFAULT_CONFIG.redirectUri}
							value={config.redirectUri}
							onChange={event => updateConfig('redirectUri', event.target.value)}
						/>
					</Field>
					<Field>
						<span>Scopes</span>
						<Input
							placeholder="openid profile email"
							value={config.scopes}
							onChange={event => updateConfig('scopes', event.target.value)}
						/>
					</Field>
					<Field>
						<span>Response Type</span>
						<select
							value={config.responseType}
							onChange={event => updateConfig('responseType', event.target.value)}
							style={{
								borderRadius: 14,
								border: '1px solid rgba(148, 163, 184, 0.35)',
								padding: '0.75rem 1rem',
								background: 'rgba(15, 23, 42, 0.55)',
								color: '#f8fafc',
								fontSize: '0.95rem',
							}}
						>
							{RESPONSE_TYPES.map(type => (
								<option key={type.value} value={type.value} style={{ color: '#0f172a' }}>
									{type.label}
								</option>
							))}
						</select>
					</Field>
					<ConfigActions>
						<SaveButton onClick={handleSaveConfig} disabled={isSaving}>
							{isSaving ? 'Saving…' : 'Save Credentials'}
						</SaveButton>
					</ConfigActions>
				</Card>

				<Card>
					<SectionTitle>Choose Your Destiny</SectionTitle>
					<Modes>
						<ModeButton $active={mode === 'redirect'} onClick={() => setMode('redirect')}>
							<div>
								<strong>Redirect Mode</strong>
								<ModeDetails>
									PingOne hosts the login page. You sit back and sip espresso while the browser
									does a round-trip.
								</ModeDetails>
							</div>
							<span role="img" aria-label="redirect">🛫</span>
						</ModeButton>
						<ModeButton $active={mode === 'redirectless'} onClick={() => setMode('redirectless')}>
							<div>
								<strong>Redirectless Mode</strong>
								<ModeDetails>
									You pretend to be PingOne. <code>response_mode=pi.flow</code> delivers the code,
									and you supply the stellar user experience.
								</ModeDetails>
							</div>
							<span role="img" aria-label="redirectless">🛸</span>
						</ModeButton>
					</Modes>

					<LaunchButton onClick={handleLaunch} disabled={loading}>
						{loading
							? 'Working…'
							: mode === 'redirect'
								? 'Launch PingOne Hosted Login'
								: 'Summon Redirectless Portal'}
					</LaunchButton>

					<AuthUrlDisplay>{authUrl}</AuthUrlDisplay>
					<Callout>
						We assume a <strong>Client Credentials</strong> token exchange using <code>client_secret_basic</code>.
						Give this playground its own <code>redirect_uri</code> (for example
							<code>https://localhost:3000/p1-callback</code>) and register that exact callback in PingOne so
							it doesn’t collide with other implicit flows.
					</Callout>
				</Card>

				<Card $tone="comedy">
					<SectionTitle>Redirectless Login Laboratory</SectionTitle>
					{redirectlessShown ? (
						<>
							<ComedyHeading>🧪 Welcome to the DIY Auth Boutique</ComedyHeading>
							<ComedyText>
								You asked PingOne to step aside, so now it is just you, a keyboard, and the
								power of <code>pi.flow</code>. Please use your imagination responsibly.
							</ComedyText>
							<ComedyLogin onSubmit={handleRedirectlessSubmit}>
								<label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
									<span style={{ fontSize: '0.85rem', color: 'rgba(254, 240, 138, 0.95)' }}>Username</span>
									<ComedyInput
										type="text"
										placeholder="astro-user@example.com"
										autoComplete="username"
										value={redirectlessCreds.username}
										onChange={event =>
											setRedirectlessCreds(prev => ({ ...prev, username: event.target.value }))
										}
										required
									/>
								</label>
								<label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
									<span style={{ fontSize: '0.85rem', color: 'rgba(254, 240, 138, 0.95)' }}>Password</span>
									<ComedyInput
										type="password"
										placeholder="••••••••"
										autoComplete="current-password"
										value={redirectlessCreds.password}
										onChange={event =>
											setRedirectlessCreds(prev => ({ ...prev, password: event.target.value }))
										}
										required
									/>
								</label>
								<ComedyButton type="submit" disabled={loading}>
									{loading ? 'Contacting PingOne…' : 'Authenticate & Capture Tokens'}
								</ComedyButton>
							</ComedyLogin>
							{redirectlessFlowContext ? (
								<div
									style={{
										marginTop: '1.5rem',
										padding: '1rem 1.25rem',
										borderRadius: 14,
										background: 'rgba(254, 240, 138, 0.15)',
										border: '1px dashed rgba(250, 204, 21, 0.55)',
										display: 'flex',
										flexDirection: 'column',
										gap: '0.6rem'
									}}
								>
									<ComedyText>
										Captured resume metadata from PingOne. Use it to continue the flow programmatically or in another
										tool if tokens were not returned yet.
									</ComedyText>
									<code style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>
										{redirectlessFlowContext.resumeUrl ?? 'No resume URL provided'}
									</code>
								</div>
							) : null}
						</>
					) : (
						<ComedyText>
							Tap “Summon Redirectless Portal” to craft your own login screen. No professional actors
							were hired for this demo.
						</ComedyText>
					)}
				</Card>
			</Layout>
		</Page>
	);
};

export default PingOneAuthentication;
