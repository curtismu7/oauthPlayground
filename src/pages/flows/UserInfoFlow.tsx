import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '@/v8u/components/CompactAppPickerV8U';
import { CardBody, CardHeader } from '../../components/Card';
import ConfigurationButton from '../../components/ConfigurationButton';
import FlowCredentials from '../../components/FlowCredentials';
import { type FlowStep, StepByStepFlow } from '../../components/StepByStepFlow';
import { useAuth } from '../../contexts/NewAuthContext';
import { usePageScroll } from '../../hooks/usePageScroll';
import { FiAlertCircle, FiDownload, FiEye, FiEyeOff, FiInfo, FiSend, FiUpload } from '../../icons';
import { FlowHeader } from '../../services/flowHeaderService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import type { UserInfo as OIDCUserInfo } from '../../types/oauth';
import { logger } from '../../utils/logger';
import { isTokenExpired } from '../../utils/oauth';

/**
 * Utility function to mask tokens for security
 * Shows first 8 characters, masks middle, shows last 4 characters
 */
const maskToken = (token: string): string => {
	if (!token || token.length <= 12) {
		return '••••••••';
	}
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1.5rem;
`;

const FlowOverview = styled.div`
	background-color: #f0f8ff;
	border-radius: 0.5rem;
	box-shadow:
		0 1px 3px 0 rgba(0, 0, 0, 0.1),
		0 1px 2px 0 rgba(0, 0, 0, 0.06);
	overflow: hidden;
	margin-bottom: 2rem;
`;

const FlowDescription = styled.div`
	margin-bottom: 2rem;

	h2 {
		color: ${({ theme }) => theme.colors.gray900};
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	p {
		color: ${({ theme }) => theme.colors.gray600};
		line-height: 1.6;
		margin-bottom: 1rem;
	}
`;

const UseCaseHighlight = styled.div`
	background-color: ${({ theme }) => theme.colors.success}10;
	border: 1px solid ${({ theme }) => theme.colors.success}30;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: ${({ theme }) => theme.colors.success};
		flex-shink: 0;
		margin-top: 0.1rem;
	}

	h3 {
		color: ${({ theme }) => theme.colors.success};
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: ${({ theme }) => theme.colors.success};
		font-size: 0.9rem;
	}
`;

const DemoSection = styled.div`
	background-color: #f0f8ff;
	border-radius: 0.5rem;
	box-shadow:
		0 1px 3px 0 rgba(0, 0, 0, 0.1),
		0 1px 2px 0 rgba(0, 0, 0, 0.06);
	overflow: hidden;
	margin-bottom: 2rem;
`;

const ErrorMessage = styled.div`
	background-color: V9_COLORS.BG.ERROR;
	border: 1px solid V9_COLORS.BG.ERROR_BORDER;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: V9_COLORS.PRIMARY.RED_DARK;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		flex-shink: 0;
		margin-top: 0.1rem;
	}
`;

const RequestResponseSection = styled.div`
	margin: 2rem 0;
	border: 1px solid ${({ theme }) => theme.colors.gray200};
	border-radius: 0.5rem;
	overflow: hidden;
`;

const RequestSection = styled.div`
	background-color: V9_COLORS.TEXT.GRAY_DARK;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_DARK;
	padding: 1.5rem;
	color: #f9fafb;

	h3 {
		margin: 0 0 1rem 0;
		color: #f9fafb;
		font-size: 1.125rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
`;

const ResponseSection = styled.div`
	background-color: V9_COLORS.TEXT.GRAY_DARK;
	padding: 1.5rem;
	color: #f9fafb;

	h3 {
		margin: 0 0 1rem 0;
		color: #f9fafb;
		font-size: 1.125rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
`;

const CodeBlock = styled.pre`
	background-color: ${({ theme }) => theme.colors.gray900};
	color: ${({ theme }) => theme.colors.gray100};
	padding: 1rem;
	border-radius: 0.375rem;
	overflow-x: auto;
	font-size: 0.875rem;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	border: 1px solid ${({ theme }) => theme.colors.gray800};
	position: relative;
	white-space: pre-wrap;
`;

const CopyButton = styled.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	background: rgba(255, 255, 255, 0.1);
	color: white;
	border: none;
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
`;

const JsonResponse = styled.div`
	background-color: white;
	border: 1px solid ${({ theme }) => theme.colors.gray200};
	border-radius: 0.375rem;
	padding: 1.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.gray800};
	overflow-x: auto;
	max-height: 400px;
	overflow-y: auto;
`;

const JsonKey = styled.span`
	color: V9_COLORS.PRIMARY.GREEN_DARK;
	font-weight: 600;
`;

const JsonString = styled.span`
	color: V9_COLORS.PRIMARY.RED_DARK;
`;

const JsonNumber = styled.span`
	color: V9_COLORS.PRIMARY.GREEN_DARK;
`;

const JsonBoolean = styled.span`
	color: #ea580c;
`;

const JsonNull = styled.span`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-style: italic;
`;

/**
 * Renders the Authorization header with a show/hide toggle so users
 * can inspect the Bearer token for educational purposes.
 */
const AuthHeaderReveal: React.FC<{ tokenValue: string }> = ({ tokenValue }) => {
	const [revealed, setRevealed] = React.useState(false);
	const masked = `${tokenValue.substring(0, 12)}••••••••••••${tokenValue.substring(tokenValue.length - 8)}`;
	const codeStyle: React.CSSProperties = {
		background: revealed ? '#e5e7eb' : '#fef3c7',
		padding: '0.15rem 0.4rem',
		borderRadius: '4px',
		fontSize: '0.8rem',
		wordBreak: 'break-all',
		maxWidth: '400px',
	};
	const btnStyle: React.CSSProperties = {
		background: 'none',
		border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
		borderRadius: '4px',
		cursor: 'pointer',
		padding: '0.1rem 0.4rem',
		fontSize: '0.75rem',
		color: '#6b7280',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.2rem',
	};
	return (
		<div
			style={{
				marginLeft: '1rem',
				display: 'flex',
				alignItems: 'center',
				gap: '0.5rem',
				flexWrap: 'wrap',
			}}
		>
			<span>Authorization: Bearer</span>
			<code style={codeStyle}>{revealed ? tokenValue : masked}</code>
			<button
				type="button"
				onClick={() => setRevealed((r) => !r)}
				style={btnStyle}
				title={revealed ? 'Mask token' : 'Reveal full Bearer token for inspection'}
				aria-label={revealed ? 'Mask Authorization token' : 'Reveal Authorization token'}
			>
				{revealed ? <FiEyeOff size={12} /> : <FiEye size={12} />}
				{revealed ? 'mask' : 'reveal'}
			</button>
		</div>
	);
};

const UserInfoFlow: React.FC = () => {
	const { tokens, config, updateTokens } = useAuth();

	usePageScroll();

	// Token and config available via useAuth() hook

	// Enhanced token detection and loading system
	const [localTokens, setLocalTokens] = useState<OAuthTokens | null>(null);

	// Function to scan localStorage for tokens
	const scanForTokens = useCallback(() => {
		const possibleTokenKeys = [
			'pingone_playground_tokens', // Official storage key
			'oauth_tokens', // Alternative key
			'access_token', // Direct token storage
			'tokens', // Generic tokens key
		];

		for (const key of possibleTokenKeys) {
			const storedTokens = localStorage.getItem(key);
			if (storedTokens) {
				try {
					let parsedTokens;
					if (key === 'access_token') {
						// Handle direct token storage
						parsedTokens = { access_token: storedTokens };
					} else {
						parsedTokens = JSON.parse(storedTokens);
					}

					if (parsedTokens.access_token) {
						setLocalTokens(parsedTokens);

						// Also update the auth context if it doesn't have tokens
						if (!tokens?.access_token) {
							updateTokens(parsedTokens);
						}
						return parsedTokens;
					}
				} catch {
					// Skip malformed localStorage entry
				}
			}
		}

		setLocalTokens(null);
		return null;
	}, [tokens, updateTokens]);

	// Load tokens on mount and when tokens change
	useEffect(() => {
		scanForTokens();
	}, [scanForTokens]);

	// Listen for storage changes (when tokens are added/removed from other tabs)
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key?.includes('token') || e.key === 'pingone_playground_tokens') {
				scanForTokens();
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [scanForTokens]);

	// Function to manually refresh tokens
	const refreshTokens = useCallback(() => {
		scanForTokens();
	}, [scanForTokens]);

	// Config import/export
	const importFileRef = useRef<HTMLInputElement>(null);

	const handleExportConfig = useCallback(() => {
		try {
			const raw = localStorage.getItem('pingone_config');
			const cfg = raw ? JSON.parse(raw) : {};
			const exportData = {
				_meta: { flowType: 'userinfo', exportedAt: new Date().toISOString() },
				...cfg,
			};
			const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'userinfo-config.json';
			a.click();
			URL.revokeObjectURL(url);
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Config exported successfully',
				duration: 3000,
			});
		} catch (_err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to export config',
				dismissible: true,
			});
		}
	}, []);

	const handleImportConfig = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const imported = JSON.parse(ev.target?.result as string);
				// Strip internal meta key before saving
				const { _meta: _m, ...configData } = imported;
				localStorage.setItem('pingone_config', JSON.stringify(configData));
				window.dispatchEvent(new StorageEvent('storage', { key: 'pingone_config' }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Config imported — reloading...',
					duration: 3000,
				});
				setTimeout(() => window.location.reload(), 800);
			} catch (_err) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Invalid config file — must be valid JSON',
					dismissible: true,
				});
			}
		};
		reader.readAsText(file);
		// Reset input so the same file can be re-imported if needed
		e.target.value = '';
	}, []);

	// Handle app selection from CompactAppPickerV8U
	const handleAppSelected = (app: DiscoveredApp) => {
		// Update config with app ID as clientId
		const updatedConfig = {
			...config,
			clientId: app.id, // Use app.id as clientId (standard pattern)
		};

		// Save to localStorage and trigger storage event
		localStorage.setItem('pingone_config', JSON.stringify(updatedConfig));
		window.dispatchEvent(new StorageEvent('storage', { key: 'pingone_config' }));

		modernMessaging.showFooterMessage({
			type: 'info',
			message: `App "${app.name}" selected - Client ID updated`,
			duration: 3000,
		});
	};

	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [currentStep, setCurrentStep] = useState(0);
	const [userInfo, setUserInfo] = useState<OIDCUserInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [accessToken, setAccessToken] = useState('');
	const [requestDetails, setRequestDetails] = useState<{
		url: string;
		headers: Record<string, string>;
		method: string;
	} | null>(null);
	// Track execution results for each step
	const [, setStepResults] = useState<Record<number, unknown>>({});
	const [, setExecutedSteps] = useState<Set<number>>(new Set());
	const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

	// UserInfo authentication mode
	const [useAuthentication, setUseAuthentication] = useState(false);

	// Function to format JSON with color coding
	const formatJson = (obj: unknown, indent: number = 0): React.ReactNode[] => {
		const spaces = '  '.repeat(indent);
		const elements: React.ReactNode[] = [];

		if (obj === null) {
			elements.push(<JsonNull>null</JsonNull>);
			return elements;
		}

		if (typeof obj === 'string') {
			elements.push(<JsonString>"{obj}"</JsonString>);
			return elements;
		}

		if (typeof obj === 'number') {
			elements.push(<JsonNumber>{obj}</JsonNumber>);
			return elements;
		}

		if (typeof obj === 'boolean') {
			elements.push(<JsonBoolean>{obj.toString()}</JsonBoolean>);
			return elements;
		}

		if (Array.isArray(obj)) {
			elements.push('[\n');
			obj.forEach((item, index) => {
				elements.push(`${spaces}  `);
				elements.push(...formatJson(item, indent + 1));
				if (index < obj.length - 1) elements.push(',');
				elements.push('\n');
			});
			elements.push(`${spaces}]`);
			return elements;
		}

		if (typeof obj === 'object') {
			elements.push('{\n');
			const keys = Object.keys(obj);
			keys.forEach((key, index) => {
				elements.push(`${spaces}  `);
				elements.push(<JsonKey>"{key}"</JsonKey>);
				elements.push(': ');
				elements.push(...formatJson(obj[key], indent + 1));
				if (index < keys.length - 1) elements.push(',');
				elements.push('\n');
			});
			elements.push(`${spaces}}`);
			return elements;
		}

		return elements;
	};

	// Function to copy text to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			// You could add a toast notification here
		} catch {
			modernMessaging.showBanner({
				type: 'error',
				message: 'Failed to copy to clipboard',
				dismissible: true,
			});
		}
	};

	const startUserInfoFlow = () => {
		setDemoStatus('loading');
		setCurrentStep(0);
		setError(null);
		setUserInfo(null);
		setRequestDetails(null);
		setStepResults({});
		setExecutedSteps(new Set());
		setStepsWithResults([]);
		setStepsWithResults([...steps]); // Initialize with copy of steps
	};

	const resetDemo = () => {
		setDemoStatus('idle');
		setCurrentStep(0);
		setUserInfo(null);
		setError(null);
		setAccessToken('');
		setRequestDetails(null);
		setStepResults({});
		setExecutedSteps(new Set());
	};

	const handleStepResult = (stepIndex: number, result: unknown) => {
		setStepResults((prev) => ({ ...prev, [stepIndex]: result }));
		setStepsWithResults((prev) => {
			const newSteps = [...prev];
			if (newSteps[stepIndex]) {
				newSteps[stepIndex] = { ...newSteps[stepIndex], result };
			}
			return newSteps;
		});
	};

	const maskedToken = accessToken ? maskToken(accessToken) : '';

	const steps: FlowStep[] = [
		...(useAuthentication
			? [
					{
						title: 'Obtain Access Token',
						description: 'First, obtain an access token through any OAuth flow with openid scope',
						code: `// Access token obtained from OAuth flow
const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

// This token contains:
// - User identity information
// - Granted scopes (including 'openid')
// - Expiration time
// - Token type (Bearer)`,
						execute: () => {
							// Try to get tokens from multiple sources
							const availableTokens = tokens?.access_token ? tokens : localTokens;

							if (!availableTokens?.access_token) {
								setError(
									'No access token available. Complete an OAuth flow with openid scope first, or check if tokens are stored in localStorage.'
								);
								return;
							}

							if (isTokenExpired(availableTokens.access_token)) {
								setError('Access token is expired. Please sign in again.');
								return;
							}

							setAccessToken(availableTokens.access_token);
							const result = {
								token: availableTokens.access_token,
								tokenInfo: {
									type: availableTokens.token_type,
									scopes: availableTokens.scope,
									expires: availableTokens.expires_at ? new Date(availableTokens.expires_at) : null,
								},
							};
							setStepResults((prev) => ({
								...prev,
								0: result,
							}));
							setExecutedSteps((prev) => new Set(prev).add(0));

							logger.debug('UserInfoFlow', ' [UserInfoFlow] Access token validated');
							return result;
						},
					},
				]
			: []),
		{
			title: 'Prepare UserInfo Request',
			description: useAuthentication
				? 'Prepare GET request to UserInfo endpoint with Bearer token'
				: 'Prepare GET request to UserInfo endpoint (no authentication)',
			code: useAuthentication
				? `// UserInfo endpoint URL (from OpenID Connect discovery)
const userInfoUrl = '${config?.userInfoEndpoint || 'https://auth.pingone.com/{envId}/as/userinfo'}';

// Prepare request headers with Bearer token
const headers = {
  'Authorization': 'Bearer ${maskedToken}',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Optional: Include DPoP proof for enhanced security
// headers['DPoP'] = generateDPoPProof(userInfoUrl, 'GET', accessToken);`
				: `// UserInfo endpoint URL (from OpenID Connect discovery)
const userInfoUrl = '${config?.userInfoEndpoint || 'https://auth.pingone.com/{envId}/as/userinfo'}';

// Prepare request headers (no authentication)
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// For unprotected UserInfo endpoints, no Authorization header needed`,
			execute: () => {
				if (!config?.pingone?.userInfoEndpoint) {
					setError('UserInfo endpoint is not configured. Check Configuration page.');
					return;
				}

				const userInfoUrl = config.pingone.userInfoEndpoint.replace(
					'{envId}',
					config.pingone.environmentId
				);
				const headers: Record<string, string> = {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				};

				if (useAuthentication) {
					if (!accessToken) {
						setError('Access token not available. Please execute previous step first.');
						return;
					}
					headers.Authorization = `Bearer ${accessToken}`;
				}

				setRequestDetails({
					url: userInfoUrl,
					headers,
					method: 'GET',
				});

				const result = {
					url: userInfoUrl,
					headers,
					method: 'GET',
					authenticated: useAuthentication,
				};
				setStepResults((prev) => ({
					...prev,
					[useAuthentication ? 1 : 0]: result,
				}));
				setExecutedSteps((prev) => new Set(prev).add(useAuthentication ? 1 : 0));

				return result;
			},
		},
		{
			title: 'Make UserInfo API Call',
			description: useAuthentication
				? 'Send authenticated request to UserInfo endpoint'
				: 'Send request to UserInfo endpoint (no authentication)',
			code: useAuthentication
				? `// Make authenticated GET request
const response = await fetch(userInfoUrl, {
  method: 'GET',
  headers: headers,
  credentials: 'same-origin' // For CORS considerations
});

// Handle response
if (!response.ok) {
  if (response.status === 401) {
    // Token expired or invalid
    throw new Error('Access token expired or invalid');
  }
  if (response.status === 403) {
    // Insufficient scope
    throw new Error('Access token does not have openid scope');
  }
  throw new Error('UserInfo request failed');
}

const userInfo = await response.json();`
				: `// Make unauthenticated GET request
const response = await fetch(userInfoUrl, {
  method: 'GET',
  headers: headers,
  credentials: 'same-origin' // For CORS considerations
});

// Handle response
if (!response.ok) {
  if (response.status === 401) {
    // Endpoint requires authentication
    throw new Error('Endpoint requires authentication. Try enabling authentication mode.');
  }
  if (response.status === 403) {
    // Access forbidden
    throw new Error('Access forbidden. Check endpoint permissions.');
  }
  throw new Error('UserInfo request failed');
}

const userInfo = await response.json();`,
			execute: async () => {
				if (!requestDetails?.url || (useAuthentication && !accessToken)) {
					setError('Request details not available. Please execute previous steps first.');
					return;
				}

				try {
					const response = await fetch(requestDetails.url, {
						method: requestDetails.method,
						headers: requestDetails.headers,
						credentials: 'same-origin',
					});

					if (!response.ok) {
						if (useAuthentication && response.status === 401) {
							throw new Error('Access token expired or invalid');
						}
						if (useAuthentication && response.status === 403) {
							throw new Error('Access token does not have openid scope');
						}
						if (!useAuthentication && response.status === 401) {
							throw new Error(
								'Endpoint requires authentication. Try enabling authentication mode.'
							);
						}
						if (response.status === 403) {
							throw new Error('Access forbidden. Check endpoint permissions.');
						}
						throw new Error(`UserInfo request failed: ${response.status} ${response.statusText}`);
					}

					const userInfoData = await response.json();
					setUserInfo(userInfoData);

					const stepIndex = useAuthentication ? 2 : 1;
					const result = {
						response: userInfoData,
						status: response.status,
						headers: Object.fromEntries(response.headers.entries()),
						authenticated: useAuthentication,
					};
					setStepResults((prev) => ({
						...prev,
						[stepIndex]: result,
					}));
					setExecutedSteps((prev) => new Set(prev).add(stepIndex));

					logger.info('UserInfoFlow', ' [UserInfoFlow] UserInfo API call successful');
					return result;
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(`Failed to call UserInfo endpoint: ${errorMessage}`);
				}
			},
		},
		{
			title: 'Process UserInfo Response',
			description: 'Handle and validate the user information returned',
			code: `// Validate response structure
if (!userInfo.sub) {
  throw new Error('Invalid UserInfo response: missing subject');
}

// Standard OpenID Connect claims
const user = {
  id: userInfo.sub,                    // Subject identifier
  name: userInfo.name,                 // Full name
  givenName: userInfo.given_name,      // First name
  familyName: userInfo.family_name,    // Last name
  email: userInfo.email,               // Email address
  emailVerified: userInfo.email_verified, // Email verification status
  picture: userInfo.picture,           // Profile picture URL
  locale: userInfo.locale,             // User locale
  updatedAt: userInfo.updated_at       // Last update timestamp
};

// Store user information securely
// Avoid storing tokens; store minimal, non-sensitive user profile if needed
localStorage.setItem('user_profile', JSON.stringify({ id: user.id, name: user.name, email: user.email }));

// Use user information in your application
logger.info('Welcome, ' + user.name + '!');`,
			execute: () => {
				if (!userInfo) {
					setError('No user information received. Please execute the API call first.');
					return;
				}

				// Validate UserInfo response
				if (!userInfo.sub) {
					setError('Invalid UserInfo response: missing subject claim');
					return;
				}

				const result = {
					userInfo,
					validation: {
						hasSubject: !!userInfo.sub,
						claims: Object.keys(userInfo),
					},
				};
				setStepResults((prev) => ({
					...prev,
					3: result,
				}));
				setExecutedSteps((prev) => new Set(prev).add(3));
				setDemoStatus('success');

				logger.info('UserInfoFlow', ' [UserInfoFlow] User information processed successfully');
				return result;
			},
		},
	];

	return (
		<Container>
			<FlowHeader
				flowType="oidc"
				customConfig={{
					flowType: 'oidc',
					title: 'User Info',
					subtitle:
						'Learn how to retrieve user profile information using the UserInfo endpoint. This endpoint provides detailed user claims and supports both authenticated and unauthenticated requests.',
				}}
			/>

			<FlowCredentials flowType="userinfo" onCredentialsChange={(_credentials) => {}} />

			{/* Config import/export */}
			<div
				style={{
					display: 'flex',
					gap: '0.75rem',
					alignItems: 'center',
					padding: '0.75rem 1rem',
					background: '#f9fafb',
					border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
					borderRadius: '0.5rem',
					marginBottom: '1rem',
				}}
			>
				<span style={{ fontSize: '0.8rem', color: '#6b7280', marginRight: 'auto' }}>Config</span>
				<button
					type="button"
					onClick={handleExportConfig}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.4rem',
						padding: '0.4rem 0.9rem',
						background: '#2563eb',
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						fontSize: '0.8rem',
						fontWeight: 600,
						cursor: 'pointer',
					}}
				>
					<FiDownload size={13} />
					Export Config
				</button>
				<button
					type="button"
					onClick={() => importFileRef.current?.click()}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.4rem',
						padding: '0.4rem 0.9rem',
						background: 'white',
						color: '#2563eb',
						border: '1px solid V9_COLORS.PRIMARY.BLUE_DARK',
						borderRadius: '0.375rem',
						fontSize: '0.8rem',
						fontWeight: 600,
						cursor: 'pointer',
					}}
				>
					<FiUpload size={13} />
					Import Config
				</button>
				<input
					ref={importFileRef}
					type="file"
					accept=".json,application/json"
					onChange={handleImportConfig}
					style={{ display: 'none' }}
				/>
			</div>

			{/* App Picker for Quick Configuration */}
			<CompactAppPickerV8U
				environmentId={config?.environmentId || ''}
				onAppSelected={handleAppSelected}
			/>

			<FlowOverview>
				<CardHeader>
					<h2>UserInfo Endpoint Overview</h2>
				</CardHeader>
				<CardBody>
					<FlowDescription>
						<h2>What is the UserInfo Endpoint?</h2>
						<p>
							The UserInfo endpoint in OpenID Connect allows clients to retrieve additional
							information about the authenticated user beyond what's included in the ID token.
							Unlike other OAuth endpoints, UserInfo can be either <strong>protected</strong> or
							<strong>unprotected</strong> depending on your implementation.
						</p>
						<p>
							<strong>How it works:</strong> You can make a GET request to the UserInfo endpoint to
							get detailed user profile information including name, email, profile picture, and
							other claims. This can be done with or without authentication depending on your
							server's configuration.
						</p>

						<div
							style={{
								marginTop: '1rem',
								padding: '1rem',
								backgroundColor: '#f8f9fa',
								borderRadius: '6px',
								border: '1px solid #dee2e6',
							}}
						>
							<h3
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '1rem',
									color: '#495057',
								}}
							>
								Authentication Mode
							</h3>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									cursor: 'pointer',
								}}
							>
								<input
									type="checkbox"
									checked={useAuthentication}
									onChange={(e) => setUseAuthentication(e.target.checked)}
									style={{ margin: 0 }}
								/>
								<span>Use Bearer token authentication</span>
							</label>
							<p
								style={{
									margin: '0.5rem 0 0 0',
									fontSize: '0.9rem',
									color: '#6c757d',
								}}
							>
								{useAuthentication
									? 'Will include Bearer token in request (requires valid access token)'
									: 'Will make unauthenticated request (endpoint must be unprotected)'}
							</p>
						</div>
					</FlowDescription>

					<UseCaseHighlight>
						<FiInfo size={20} />
						<div>
							<h3>Perfect For</h3>
							<p>
								Getting detailed user profiles, email addresses, profile pictures, and other user
								attributes beyond the basic ID token claims.
							</p>
						</div>
					</UseCaseHighlight>
				</CardBody>
			</FlowOverview>

			<DemoSection>
				<CardHeader>
					<h2>Interactive Demo</h2>
				</CardHeader>
				<CardBody>
					<StepByStepFlow
						steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
						onStart={startUserInfoFlow}
						onReset={resetDemo}
						status={demoStatus}
						currentStep={currentStep}
						onStepChange={setCurrentStep}
						onStepResult={handleStepResult}
						disabled={
							!config ||
							(useAuthentication && (!tokens?.access_token || isTokenExpired(tokens.access_token)))
						}
						title="UserInfo Flow"
						configurationButton={<ConfigurationButton flowType="userinfo" />}
					/>

					{!config && (
						<ErrorMessage>
							<FiAlertCircle />
							<strong>Configuration Required:</strong> Please configure your PingOne settings in the
							Configuration page before running this demo.
							<br />
							<button
								onClick={() => {
									window.location.reload();
								}}
								style={{
									marginTop: '10px',
									padding: '8px 16px',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							>
								Refresh Page
							</button>
						</ErrorMessage>
					)}

					{config &&
						useAuthentication &&
						(!tokens?.access_token ||
							(tokens?.access_token && isTokenExpired(tokens.access_token))) && (
							<>
								{/* Enhanced Token Detection Debug Panel */}
								<div
									style={{
										marginBottom: '1rem',
										padding: '1rem',
										backgroundColor: '#f8fafc',
										border: '2px solid #0ea5e9',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
										Enhanced Token Detection System
									</h4>
									<div style={{ color: '#1f2937', lineHeight: '1.6' }}>
										<strong> Auth Context Tokens:</strong>{' '}
										{tokens ? ' Available' : ' Not available'}
										<br />
										<strong> Local Storage Tokens:</strong>{' '}
										{localTokens ? ' Available' : ' Not available'}
										<br />
										<strong> Active Access Token:</strong>{' '}
										{accessToken ? maskToken(accessToken) : 'None'}
										<br />
										<strong> Token Source:</strong>{' '}
										{tokens?.access_token
											? 'Auth Context'
											: localTokens?.access_token
												? 'Local Storage'
												: 'None'}
										<br />
										<strong> Config:</strong> {config ? ' Loaded' : ' Not loaded'}
										<br />
										<strong> Token expired:</strong>{' '}
										{accessToken ? (isTokenExpired(accessToken) ? ' Yes' : ' No') : 'N/A'}
										<br />
										<strong> Scope:</strong> {tokens?.scope || localTokens?.scope || 'None'}
										<br />
										<strong> localStorage keys:</strong>{' '}
										{Object.keys(localStorage)
											.filter((key) => key.includes('token') || key.includes('pingone'))
											.join(', ') || 'None'}
									</div>
								</div>
								<ErrorMessage>
									<FiAlertCircle />
									<strong>Sign-in Required:</strong> Authentication mode is enabled. Complete an
									OAuth login with openid scope to obtain a valid access token before calling
									UserInfo.
									<br />
									<br />
									<strong>To get tokens:</strong>
									<ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
										<li>Go to any OAuth flow page (e.g., Authorization Code Flow)</li>
										<li>Complete the OAuth flow to get tokens</li>
										<li>Return here to use the UserInfo endpoint</li>
									</ul>
									<br />
									<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
										<button
											onClick={() => (window.location.href = '/flows/authorization-code')}
											style={{
												padding: '8px 16px',
												backgroundColor: '#28a745',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '14px',
											}}
										>
											Go to Authorization Code Flow
										</button>
										<button
											onClick={() => (window.location.href = '/flows/implicit')}
											style={{
												padding: '8px 16px',
												backgroundColor: '#17a2b8',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '14px',
											}}
										>
											Go to Implicit Flow
										</button>
										<button
											onClick={() => {
												logger.debug('UserInfoFlow', 'Debug info', {
													config,
													tokens,
													tokenExpired: tokens?.access_token
														? isTokenExpired(tokens.access_token)
														: 'No token',
												});
												modernMessaging.showFooterMessage({
													type: 'info',
													message:
														'Debug information logged to browser console - check developer tools',
													duration: 3000,
												});
											}}
											style={{
												padding: '8px 16px',
												backgroundColor: '#6c757d',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '14px',
											}}
										>
											Debug Info
										</button>
										<button
											onClick={refreshTokens}
											style={{
												padding: '8px 16px',
												backgroundColor: '#ffc107',
												color: '#212529',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '14px',
											}}
										>
											Refresh Token Detection
										</button>
										<button
											onClick={() => {
												// Force refresh the page to reload auth context

												window.location.reload();
											}}
											style={{
												padding: '8px 16px',
												backgroundColor: '#dc3545',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '14px',
											}}
										>
											Force Refresh Page
										</button>
									</div>
								</ErrorMessage>
							</>
						)}

					{error && (
						<ErrorMessage>
							<FiAlertCircle />
							<strong>Error:</strong> {error}
						</ErrorMessage>
					)}

					{accessToken &&
						UnifiedTokenDisplayService.showTokens(
							{ access_token: accessToken, token_type: 'Bearer' },
							'oauth',
							'userinfo-flow',
							{
								showCopyButtons: true,
								showDecodeButtons: true,
							}
						)}

					{/* Request/Response Section */}
					{(requestDetails || userInfo) && (
						<RequestResponseSection>
							{requestDetails && (
								<RequestSection>
									<h3>
										<FiSend />
										Request Details
									</h3>
									<CodeBlock>
										<CopyButton
											onClick={() => copyToClipboard(JSON.stringify(requestDetails, null, 2))}
										>
											Copy
										</CopyButton>
										<strong>URL:</strong> {requestDetails.url}
										<br />
										<strong>Method:</strong> {requestDetails.method}
										<br />
										<strong>Headers:</strong>
										<br />
										{Object.entries(requestDetails.headers).map(([key, value]) => {
											if (key === 'Authorization' && accessToken) {
												return <AuthHeaderReveal key={key} tokenValue={accessToken} />;
											}
											return (
												<div key={key} style={{ marginLeft: '1rem' }}>
													{key}: {value}
												</div>
											);
										})}
									</CodeBlock>
								</RequestSection>
							)}

							{userInfo && (
								<ResponseSection>
									<h3>
										<FiDownload />
										Response Data
									</h3>
									<JsonResponse>{formatJson(userInfo)}</JsonResponse>

									<div
										style={{
											marginTop: '1rem',
											fontSize: '0.9rem',
											color: '#6b7280',
										}}
									>
										<strong>Standard Claims:</strong>
										<br /> <strong>sub:</strong> Subject identifier ({userInfo?.sub || ''})<br />{' '}
										<strong>name:</strong> Full name ({userInfo?.name || ''})<br />{' '}
										<strong>email:</strong> Email address ({userInfo?.email || ''})<br />{' '}
										<strong>email_verified:</strong> Email verification status (
										{userInfo?.email_verified ? 'Verified' : 'Unverified'})
										<br /> <strong>updated_at:</strong> Last update (
										{userInfo?.updated_at
											? new Date((userInfo.updated_at as number) * 1000).toLocaleString()
											: ''}
										)
									</div>
								</ResponseSection>
							)}
						</RequestResponseSection>
					)}
				</CardBody>
			</DemoSection>
		</Container>
	);
};

export default UserInfoFlow;
