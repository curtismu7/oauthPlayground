// src/components/OAuthDetective.tsx
/**
 * OAuth Detective - Reverse Engineering Tool
 * Analyzes real OAuth URLs from any provider and explains every parameter
 */

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiCopy, FiInfo, FiSearch } from '@icons';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const DetectiveContainer = styled.div`
	background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
	color: #f1f5f9;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.5rem;
`;

const Description = styled.p`
	color: #e2e8f0;
	margin: 0 0 1.5rem 0;
	line-height: 1.6;
`;

const InputArea = styled.div`
	position: relative;
	margin-bottom: 1.5rem;
`;

const URLInput = styled.textarea`
	width: 100%;
	padding: 1rem;
	padding-right: 4rem;
	border-radius: 0.75rem;
	border: 2px solid #475569;
	background: #0f172a;
	color: #f1f5f9;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
	resize: vertical;
	min-height: 100px;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #64748b;
	}
`;

const AnalyzeButton = styled.button`
	position: absolute;
	right: 1rem;
	bottom: 1rem;
	padding: 0.75rem 1.5rem;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

const QuickExamples = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	margin-bottom: 1.5rem;
`;

const ExampleButton = styled.button`
	padding: 0.5rem 1rem;
	background: rgba(51, 65, 85, 0.6);
	color: #f8fafc;
	border: 1px solid #475569;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: rgba(71, 85, 105, 0.85);
		border-color: #7dd3fc;
	}
`;

const AnalysisResult = styled.div`
	background: #0f172a;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-top: 1.5rem;
	border: 2px solid #334155;
`;

const ProviderBadge = styled.div<{ provider: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-radius: 2rem;
	font-weight: 600;
	font-size: 0.875rem;
	margin-bottom: 1.5rem;
	background: ${({ provider }) => {
		switch (provider.toLowerCase()) {
			case 'google':
				return 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)';
			case 'microsoft':
				return 'linear-gradient(135deg, #00a4ef 0%, #0078d4 100%)';
			case 'github':
				return 'linear-gradient(135deg, #333 0%, #000 100%)';
			case 'okta':
				return 'linear-gradient(135deg, #007dc1 0%, #005a8c 100%)';
			case 'pingone':
			case 'ping':
				return 'linear-gradient(135deg, #e94b35 0%, #c93524 100%)';
			default:
				return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
		}
	}};
	color: white;
`;

const ParameterList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ParameterCard = styled.div<{
	status: 'standard' | 'provider-specific' | 'advanced' | 'security';
}>`
	background: ${({ status }) => {
		switch (status) {
			case 'standard':
				return 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)';
			case 'provider-specific':
				return 'linear-gradient(135deg, #422006 0%, #1e293b 100%)';
			case 'advanced':
				return 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)';
			case 'security':
				return 'linear-gradient(135deg, #14532d 0%, #1e293b 100%)';
			default:
				return '#1e293b';
		}
	}};
	border-left: 4px solid ${({ status }) => {
		switch (status) {
			case 'standard':
				return '#3b82f6';
			case 'provider-specific':
				return '#f59e0b';
			case 'advanced':
				return '#2563eb';
			case 'security':
				return '#10b981';
			default:
				return '#64748b';
		}
	}};
	padding: 1rem;
	border-radius: 0.5rem;
`;

const ParameterHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 0.75rem;
`;

const ParameterName = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	font-weight: 600;
	color: #60a5fa;
	font-size: 1rem;
`;

const StatusBadge = styled.span<{ status: string }>`
	padding: 0.25rem 0.75rem;
	border-radius: 1rem;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${({ status }) => {
		switch (status) {
			case 'standard':
				return '#1e40af';
			case 'provider-specific':
				return '#92400e';
			case 'advanced':
				return '#1e3a8a';
			case 'security':
				return '#065f46';
			default:
				return '#374151';
		}
	}};
	color: white;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	color: #a5f3fc;
	background: #0f172a;
	padding: 0.5rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	word-break: break-all;
	margin-bottom: 0.75rem;
`;

const ParameterExplanation = styled.div`
	color: #e2e8f0;
	line-height: 1.6;
	font-size: 0.9rem;
`;

const PingOneEquivalent = styled.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: rgba(233, 75, 53, 0.1);
	border-left: 3px solid #e94b35;
	border-radius: 0.375rem;
	color: #fbbf24;
	font-size: 0.875rem;
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
`;

interface Parameter {
	name: string;
	value: string;
	status: 'standard' | 'provider-specific' | 'advanced' | 'security';
	explanation: string;
	pingoneEquivalent?: string;
}

interface AnalysisResults {
	provider: string;
	baseUrl: string;
	parameters: Parameter[];
}

const EXAMPLE_URLS = {
	google:
		'https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://example.com/callback&response_type=code&scope=openid%20email%20profile&access_type=offline&include_granted_scopes=true&state=security_token&prompt=consent',
	microsoft:
		'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://example.com/callback&response_mode=query&scope=openid%20profile%20email%20offline_access&state=12345&prompt=select_account',
	github:
		'https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://example.com/callback&scope=user%20repo&state=random_string&allow_signup=true',
	pingone:
		'https://auth.pingone.com/YOUR_ENV_ID/as/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://example.com/callback&response_type=code&scope=openid%20profile%20email&state=security_token&nonce=random_nonce&prompt=login',
};

const OAuthDetective: React.FC = () => {
	const [url, setUrl] = useState('');
	const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	// Detect provider from URL
	const detectProvider = useCallback((urlString: string): string => {
		const lowerUrl = urlString.toLowerCase();
		if (lowerUrl.includes('google.com') || lowerUrl.includes('googleapis.com')) return 'Google';
		if (lowerUrl.includes('microsoft.com') || lowerUrl.includes('microsoftonline'))
			return 'Microsoft';
		if (lowerUrl.includes('github.com')) return 'GitHub';
		if (lowerUrl.includes('okta.com')) return 'Okta';
		if (lowerUrl.includes('pingone.com') || lowerUrl.includes('pingidentity')) return 'PingOne';
		if (lowerUrl.includes('auth0.com')) return 'Auth0';
		if (lowerUrl.includes('salesforce.com')) return 'Salesforce';
		return 'Unknown';
	}, []);

	// Analyze parameter and provide context
	const analyzeParameter = useCallback(
		(name: string, value: string, provider: string): Parameter => {
			const decodedValue = decodeURIComponent(value);

			// Standard OAuth/OIDC parameters
			const standardParams: Record<string, Omit<Parameter, 'name' | 'value'>> = {
				client_id: {
					status: 'standard',
					explanation:
						'🔑 Your application identifier. This tells the authorization server which application is requesting access. Every OAuth client must have a unique client_id.',
				},
				redirect_uri: {
					status: 'security',
					explanation:
						'🔒 Where users return after authentication. This MUST be pre-registered with the authorization server to prevent redirect attacks. Only exact matches are allowed for security.',
				},
				response_type: {
					status: 'standard',
					explanation: `🎯 Determines the OAuth flow: "code" = Authorization Code flow (most secure), "token" = Implicit flow (legacy), "id_token" = OIDC authentication. You're using: ${decodedValue}`,
				},
				scope: {
					status: 'standard',
					explanation: `🎫 What permissions you're requesting. Space-separated list. Common scopes: "openid" (OIDC), "profile", "email", "offline_access" (refresh tokens). Your scopes: ${decodedValue}`,
				},
				state: {
					status: 'security',
					explanation:
						'🛡️ CSRF protection token. Your app generates this random value, sends it with the request, and validates it when the user returns. Prevents cross-site request forgery attacks.',
					pingoneEquivalent: '✅ PingOne fully supports state parameter - always use it!',
				},
				nonce: {
					status: 'security',
					explanation:
						'🔐 Replay attack prevention for ID tokens. This random value is hashed into the ID token, ensuring the token was issued for THIS specific request and cannot be reused.',
					pingoneEquivalent: '✅ PingOne requires nonce when using implicit/hybrid flows',
				},
				prompt: {
					status: 'advanced',
					explanation: `👤 Controls authentication UX: "none" = silent auth (no UI), "login" = force re-login, "consent" = show consent screen, "select_account" = show account picker. You're using: ${decodedValue}`,
					pingoneEquivalent: '✅ PingOne supports: none, login, consent',
				},
				max_age: {
					status: 'security',
					explanation: `⏱️ Maximum authentication age in seconds. If the user's last authentication is older than this, they must re-authenticate. Critical for high-security operations. Your value: ${decodedValue}s (${Math.floor(parseInt(decodedValue, 10) / 60)} minutes)`,
					pingoneEquivalent: '✅ PingOne supports max_age parameter',
				},
				display: {
					status: 'advanced',
					explanation: `📱 UI presentation mode: "page" (full page), "popup" (popup window), "touch" (mobile-optimized), "wap" (legacy mobile). Your value: ${decodedValue}`,
					pingoneEquivalent:
						'⚠️ PingOne uses responsive design - display parameter has limited effect',
				},
				login_hint: {
					status: 'advanced',
					explanation: `💡 Pre-fills the username/email field to improve UX for known users. Your value: ${decodedValue}`,
					pingoneEquivalent: '✅ PingOne supports login_hint to pre-populate username',
				},
				ui_locales: {
					status: 'advanced',
					explanation: `🌍 Preferred languages for auth UI (RFC 5646 language tags). Space-separated priority list. Your value: ${decodedValue}`,
					pingoneEquivalent: '✅ PingOne supports ui_locales for internationalization',
				},
				acr_values: {
					status: 'advanced',
					explanation: `🔐 Authentication Context Class Reference - specifies required authentication strength (e.g., MFA, biometric). Your value: ${decodedValue}`,
					pingoneEquivalent:
						'⚠️ PingOne uses policy-based MFA - configure in console rather than acr_values',
				},
				claims: {
					status: 'advanced',
					explanation: `📋 OIDC Claims Request - JSON object specifying which user attributes to include in tokens. Length: ${decodedValue.length} chars`,
					pingoneEquivalent: '✅ PingOne supports claims parameter for selective disclosure',
				},
				response_mode: {
					status: 'standard',
					explanation: `📬 How the authorization server returns the response: "query" (URL params), "fragment" (URL hash), "form_post" (HTTP POST). Your value: ${decodedValue}`,
					pingoneEquivalent: '✅ PingOne supports query, fragment, and form_post',
				},
				code_challenge: {
					status: 'security',
					explanation: `🔒 PKCE code challenge - hashed version of code_verifier. Prevents authorization code interception attacks. Essential for mobile/SPA apps. Length: ${decodedValue.length} chars`,
					pingoneEquivalent: '✅ PingOne REQUIRES PKCE for public clients (SPAs, mobile apps)',
				},
				code_challenge_method: {
					status: 'security',
					explanation: `🔐 PKCE hash algorithm: "S256" (SHA-256, recommended), "plain" (not recommended). Your value: ${decodedValue}`,
					pingoneEquivalent: '✅ PingOne supports S256 (recommended) and plain',
				},
			};

			// Provider-specific parameters
			const providerSpecificParams: Record<
				string,
				Record<string, Omit<Parameter, 'name' | 'value'>>
			> = {
				Google: {
					access_type: {
						status: 'provider-specific',
						explanation: `🔄 Google-specific: "offline" requests a refresh token, "online" doesn't. Your value: ${decodedValue}`,
						pingoneEquivalent: '💡 PingOne equivalent: Add "offline_access" to scope parameter',
					},
					include_granted_scopes: {
						status: 'provider-specific',
						explanation: `➕ Google-specific: Incremental authorization - preserves previously granted scopes. Your value: ${decodedValue}`,
						pingoneEquivalent:
							"⚠️ PingOne doesn't have direct equivalent - request all scopes upfront",
					},
					hd: {
						status: 'provider-specific',
						explanation: `🏢 Google Workspace: Restricts authentication to specific domain. Your domain: ${decodedValue}`,
						pingoneEquivalent: '💡 PingOne equivalent: Use population restrictions in console',
					},
				},
				Microsoft: {
					tenant: {
						status: 'provider-specific',
						explanation: `🏢 Microsoft-specific: Azure AD tenant ID or "common" for multi-tenant. Your value: ${decodedValue}`,
						pingoneEquivalent: '💡 PingOne equivalent: Use environment ID in authorization URL',
					},
					domain_hint: {
						status: 'provider-specific',
						explanation: `🌐 Microsoft-specific: Skips account selection for known domain users. Your value: ${decodedValue}`,
						pingoneEquivalent: '💡 PingOne equivalent: Use login_hint with email address',
					},
				},
				GitHub: {
					allow_signup: {
						status: 'provider-specific',
						explanation: `📝 GitHub-specific: Whether to show "Sign up" link during auth. Your value: ${decodedValue}`,
						pingoneEquivalent: '💡 PingOne equivalent: Configure user registration in console',
					},
				},
			};

			// Check standard parameters first
			if (standardParams[name]) {
				return {
					name,
					value: decodedValue,
					...standardParams[name],
				};
			}

			// Check provider-specific parameters
			if (providerSpecificParams[provider]?.[name]) {
				return {
					name,
					value: decodedValue,
					...providerSpecificParams[provider][name],
				};
			}

			// Unknown parameter
			return {
				name,
				value: decodedValue,
				status: 'provider-specific',
				explanation: `🔍 Custom or provider-specific parameter. Value: ${decodedValue}`,
			};
		},
		[]
	);

	// Main analysis function
	const analyzeURL = useCallback(() => {
		if (!url.trim()) {
			v4ToastManager.showWarning('Please paste an OAuth URL to analyze');
			return;
		}

		setIsAnalyzing(true);

		try {
			// Parse URL
			const urlObj = new URL(url.trim());
			const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
			const provider = detectProvider(url);

			// Extract all parameters
			const parameters: Parameter[] = [];
			urlObj.searchParams.forEach((value, name) => {
				const param = analyzeParameter(name, value, provider);
				parameters.push(param);
			});

			// Sort parameters: security first, then standard, then advanced, then provider-specific
			parameters.sort((a, b) => {
				const order = ['security', 'standard', 'advanced', 'provider-specific'];
				return order.indexOf(a.status) - order.indexOf(b.status);
			});

			setAnalysis({
				provider,
				baseUrl,
				parameters,
			});

			v4ToastManager.showSuccess(`Analyzed ${parameters.length} parameters from ${provider}`);
		} catch (error) {
			console.error('[OAuth Detective] Error analyzing URL:', error);
			v4ToastManager.showError('Invalid URL. Please paste a complete OAuth authorization URL.');
		} finally {
			setIsAnalyzing(false);
		}
	}, [url, detectProvider, analyzeParameter]);

	// Load example
	const loadExample = useCallback((provider: keyof typeof EXAMPLE_URLS) => {
		setUrl(EXAMPLE_URLS[provider]);
		setAnalysis(null);
	}, []);

	// Copy parameter to clipboard
	const copyParameter = useCallback((name: string, value: string) => {
		navigator.clipboard.writeText(`${name}=${value}`);
		v4ToastManager.showSuccess(`Copied ${name} parameter`);
	}, []);

	return (
		<DetectiveContainer>
			<Title>
				<FiSearch size={28} />
				OAuth Detective
			</Title>
			<Description>
				🔍 Paste any real OAuth authorization URL (from Google, Microsoft, GitHub, etc.) and I'll
				reverse-engineer it, explaining every parameter and showing PingOne equivalents.
			</Description>

			<QuickExamples>
				<strong style={{ color: '#cbd5e1', marginRight: '0.5rem' }}>Try an example:</strong>
				<ExampleButton onClick={() => loadExample('google')}>Google OAuth</ExampleButton>
				<ExampleButton onClick={() => loadExample('microsoft')}>Microsoft</ExampleButton>
				<ExampleButton onClick={() => loadExample('github')}>GitHub</ExampleButton>
				<ExampleButton onClick={() => loadExample('pingone')}>PingOne</ExampleButton>
			</QuickExamples>

			<InputArea>
				<URLInput
					placeholder="Paste a complete OAuth authorization URL here...&#10;Example: https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
							analyzeURL();
						}
					}}
				/>
				<AnalyzeButton onClick={analyzeURL} disabled={isAnalyzing || !url.trim()}>
					<FiSearch />
					{isAnalyzing ? 'Analyzing...' : 'Analyze URL'}
				</AnalyzeButton>
			</InputArea>

			{analysis && (
				<AnalysisResult>
					<ProviderBadge provider={analysis.provider}>
						<FiCheckCircle />
						Detected: {analysis.provider}
					</ProviderBadge>

					<div style={{ marginBottom: '1.5rem' }}>
						<div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
							Base URL:
						</div>
						<div
							style={{
								color: '#60a5fa',
								fontFamily: 'Monaco, monospace',
								fontSize: '0.9rem',
								wordBreak: 'break-all',
							}}
						>
							{analysis.baseUrl}
						</div>
					</div>

					<div
						style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}
					>
						📊 Found {analysis.parameters.length} Parameters:
					</div>

					<ParameterList>
						{analysis.parameters.map((param, index) => (
							<ParameterCard key={index} status={param.status}>
								<ParameterHeader>
									<ParameterName>{param.name}</ParameterName>
									<StatusBadge status={param.status}>
										{param.status === 'standard' && '✅ Standard'}
										{param.status === 'security' && '🛡️ Security'}
										{param.status === 'advanced' && '⚡ Advanced'}
										{param.status === 'provider-specific' && '🔧 Provider-Specific'}
									</StatusBadge>
								</ParameterHeader>

								<ParameterValue>
									{param.value}
									<button
										onClick={() => copyParameter(param.name, param.value)}
										style={{
											float: 'right',
											background: 'transparent',
											border: 'none',
											color: '#60a5fa',
											cursor: 'pointer',
											padding: '0.25rem',
										}}
										title="Copy parameter"
									>
										<FiCopy size={14} />
									</button>
								</ParameterValue>

								<ParameterExplanation>{param.explanation}</ParameterExplanation>

								{param.pingoneEquivalent && (
									<PingOneEquivalent>
										<FiInfo size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
										<div>{param.pingoneEquivalent}</div>
									</PingOneEquivalent>
								)}
							</ParameterCard>
						))}
					</ParameterList>

					<div
						style={{
							marginTop: '2rem',
							padding: '1rem',
							background: 'rgba(59, 130, 246, 0.1)',
							borderRadius: '0.5rem',
							color: '#93c5fd',
							fontSize: '0.9rem',
						}}
					>
						<strong>💡 Pro Tip:</strong> Click any parameter's copy button to use it in your own
						OAuth requests. Parameters marked with ✅ are fully supported by PingOne!
					</div>
				</AnalysisResult>
			)}
		</DetectiveContainer>
	);
};

export default OAuthDetective;
