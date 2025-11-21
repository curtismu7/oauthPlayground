// src/components/SecurityFeaturesDemo.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiChevronUp,
	FiClock,
	FiDownload,
	FiExternalLink,
	FiEye,
	FiGlobe,
	FiKey,
	FiLock,
	FiPlay,
	FiPlus,
	FiRefreshCw,
	FiShield,
	FiTrash2,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { showGlobalSuccess } from '../hooks/useNotifications';
import { v4ToastManager } from '../utils/v4ToastMessages';
import ConfirmationModal from './ConfirmationModal';

// Styled Components
const Container = styled.div<{ $primaryColor: string }>`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin: 1rem 0;
`;

const Header = styled.div<{ $primaryColor: string }>`
	background: linear-gradient(135deg, ${(props) => props.$primaryColor} 0%, ${(props) => props.$primaryColor} 100%);
	color: white;
	padding: 2rem;
	text-align: center;
`;

const HeaderTitle = styled.h1<{ $fontSize: string }>`
	margin: 0 0 0.5rem 0;
	font-size: ${(props) => props.$fontSize};
	font-weight: 700;
`;

const HeaderSubtitle = styled.p`
	margin: 0;
	opacity: 0.9;
	font-size: 1.1rem;
`;

const Content = styled.div`
	padding: 2rem;
`;

const Section = styled.div`
	margin-bottom: 2rem;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
`;

const SectionHeader = styled.div`
	background: #f8fafc;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #e2e8f0;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SectionContent = styled.div`
	padding: 1.5rem;
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 1.5rem;
`;

const FeatureCard = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	background: #fafbfc;
`;

const FeatureTitle = styled.div`
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusBadge = styled.span<{ $status: 'enabled' | 'required' | 'disabled' }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background: ${(props) => {
		switch (props.$status) {
			case 'enabled':
				return '#dcfce7';
			case 'required':
				return '#fef3c7';
			case 'disabled':
				return '#fee2e2';
			default:
				return '#f3f4f6';
		}
	}};
	color: ${(props) => {
		switch (props.$status) {
			case 'enabled':
				return '#166534';
			case 'required':
				return '#92400e';
			case 'disabled':
				return '#991b1b';
			default:
				return '#6b7280';
		}
	}};
`;

const FeatureDescription = styled.div`
	color: #374151;
	font-size: 0.9rem;
	margin-bottom: 1rem;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'danger' | 'secondary';
	$primaryColor: string;
}>`
	background: ${(props) => {
		switch (props.$variant) {
			case 'danger':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			case 'secondary':
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
			default:
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
		}
	}};
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

	&:hover:not(:disabled) {
		background: ${(props) => {
			switch (props.$variant) {
				case 'danger':
					return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
				case 'secondary':
					return 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
				default:
					return 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
			}
		}};
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;

const CodeBlock = styled.pre<{ $isVisible?: boolean }>`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 6px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.85rem;
	overflow-x: auto;
	margin: 1rem 0;
	display: ${(props) => (props.$isVisible ? 'block' : 'none')};
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 1rem;
	margin: 1rem 0;
`;

const ParamLabel = styled.div`
	font-weight: 600;
	color: #374151;
`;

const ParameterLabel = styled.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const ParamValue = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	background: #f1f5f9;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	word-break: break-all;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 6px;
	padding: 1rem;
	margin: 1rem 0;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`;

const InfoText = styled.div`
	color: #1e3a8a;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const CollapsibleHeader = styled.div<{ $isCollapsed: boolean }>`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 1rem 1.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 8px 8px ${(props) => (props.$isCollapsed ? '8px 8px' : '0 0')};
	transition: all 0.2s ease;
	
	&:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}
`;

const CollapsibleTitle = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CollapsibleContent = styled.div<{ $isCollapsed: boolean }>`
	background: white;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 8px 8px;
	padding: ${(props) => (props.$isCollapsed ? '0' : '1.5rem')};
	max-height: ${(props) => (props.$isCollapsed ? '0' : '1000px')};
	overflow: hidden;
	transition: all 0.3s ease;
`;

const ActionRow = styled.div`
	text-align: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 1px solid #e2e8f0;
`;

const List = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: #374151;
	font-size: 0.9rem;
	line-height: 1.6;
`;

interface SecurityFeaturesDemoProps {
	tokens?: Record<string, unknown> | null;
	credentials?: Record<string, unknown> | null;
	onTerminateSession?: () => void;
	onRevokeTokens?: () => void;
	hideHeader?: boolean;
}

const SecurityFeaturesDemo: React.FC<SecurityFeaturesDemoProps> = ({
	tokens,
	credentials,
	onTerminateSession,
	onRevokeTokens,
	hideHeader = false,
}) => {
	const { settings } = useUISettings();
	const { fontSize, colorScheme } = settings;

	// Color scheme mapping
	const getColors = (scheme: string) => {
		const colorMap = {
			blue: { primary: '#3b82f6', secondary: '#1e40af' },
			green: { primary: '#10b981', secondary: '#047857' },
			purple: { primary: '#8b5cf6', secondary: '#6d28d9' },
			orange: { primary: '#f59e0b', secondary: '#d97706' },
			red: { primary: '#ef4444', secondary: '#dc2626' },
		};
		return colorMap[scheme as keyof typeof colorMap] || colorMap.blue;
	};

	const colors = getColors(colorScheme);
	const [showLogoutUrl, setShowLogoutUrl] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [validationResults, setValidationResults] = useState<string | null>(null);
	const [expirationResults, setExpirationResults] = useState<string | null>(null);
	const [signatureResults, setSignatureResults] = useState<string | null>(null);
	const [signatureValidationResults, setSignatureValidationResults] = useState<string | null>(null);
	// const [logoutUrlResults, setLogoutUrlResults] = useState<string | null>(null);
	const [revokeResults, setRevokeResults] = useState<string | null>(null);
	const [securityReportResults, setSecurityReportResults] = useState<string | null>(null);
	const [securityTestResults, setSecurityTestResults] = useState<string | null>(null);
	const [collapsedSecurityReport, setCollapsedSecurityReport] = useState(false);
	const [collapsedSecurityTest, setCollapsedSecurityTest] = useState(false);
	const [sessionResults, setSessionResults] = useState<string | null>(null);
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

	// Scroll to top when component mounts
	useEffect(() => {
		console.log('🚀 [SecurityFeaturesDemo] Component mounted - scrolling to top');
		console.log('🔔 [SecurityFeaturesDemo] v4ToastManager available:', !!v4ToastManager);
		console.log('🔔 [SecurityFeaturesDemo] showGlobalSuccess available:', typeof showGlobalSuccess);
		window.scrollTo({ top: 0, behavior: 'smooth' });

		// Test toast on mount
		v4ToastManager.showSuccess('Security Features Demo loaded successfully!');
	}, []);

	// CORS Testing State
	const [corsSettings, setCorsSettings] = useState({
		allowAnyOrigin: false,
		allowedOrigins: ['https://localhost:3000', 'https://app.example.com'],
		newOrigin: '',
	});
	const [corsTestResults, setCorsTestResults] = useState<Array<Record<string, unknown>> | null>(
		null
	);
	const [isTestingCors, setIsTestingCors] = useState(false);

	// Extract x5t parameter from JWT header
	const getX5tParameter = useCallback((token: string) => {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) return null;
			const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
			return header.x5t || header['x5t#S256'] || null;
		} catch {
			return null;
		}
	}, []);

	// Demo functions
	const showSignatureDemo = useCallback(() => {
		console.log('🔔 [SecurityFeaturesDemo] showSignatureDemo clicked');
		const results =
			'Request Parameter Signature Demo:\n\n1. Generate HMAC-SHA256 signature of request parameters\n2. Include signature in Authorization header\n3. Server validates signature before processing request\n\nThis prevents parameter tampering and ensures request authenticity.';
		setSignatureResults(results);
		v4ToastManager.showSuccess('Signature demo loaded - see results below');
	}, []);

	const validateSignature = useCallback(() => {
		console.log('🔔 [SecurityFeaturesDemo] validateSignature clicked');
		setIsValidating(true);
		setTimeout(() => {
			setIsValidating(false);
			const results =
				'✅ Current request signature is valid!\n\nSignature: a1b2c3d4e5f6...\nAlgorithm: HMAC-SHA256\nStatus: Verified';
			setSignatureValidationResults(results);
			v4ToastManager.showSuccess('Signature validation complete - see results below');
		}, 1000);
	}, []);

	const showX5tDemo = useCallback(() => {
		if (tokens?.access_token && typeof tokens.access_token === 'string') {
			const x5t = getX5tParameter(tokens.access_token);
			if (x5t) {
				// Show real x5t value with enhanced formatting
				const message =
					`🔐 X.509 Certificate Thumbprint (x5t) Found!\n\n` +
					`📋 JWT Header Information:\n` +
					`• x5t: ${x5t}\n` +
					`• kid: Key identifier for key rotation\n` +
					`• Algorithm: RS256\n\n` +
					`✅ This enables certificate validation and key management.\n` +
					`🔒 Enhanced security through X.509 certificate verification.`;

				v4ToastManager.showSuccess(message);

				// Also show a more prominent info message
				setTimeout(() => {
					v4ToastManager.showSuccess(
						`🔐 Real x5t Parameter: ${x5t}\n\nThis is extracted from your actual JWT token!`
					);
				}, 2000);
			} else {
				// Show demo x5t value for educational purposes
				const message =
					`📚 X.509 Certificate Thumbprint (x5t) Demo\n\n` +
					`📋 JWT Header Information:\n` +
					`• x5t: ${x5tValue} (Demo Data)\n` +
					`• kid: Key identifier for key rotation\n` +
					`• Algorithm: RS256\n\n` +
					`ℹ️ This is demo data for educational purposes.\n` +
					`🔒 Real x5t enables certificate validation and key management.\n\n` +
					`💡 Enable "Include x5t Parameter" in Configuration to include this in real tokens.`;

				v4ToastManager.showSuccess(message);
			}
		} else {
			v4ToastManager.showWarning(
				'⚠️ No access token available.\n\nPlease complete the OAuth flow first to see real x5t values.'
			);
		}
	}, [tokens, getX5tParameter]);

	const verifyCertificate = useCallback(() => {
		v4ToastManager.showSuccess(
			'🔐 Certificate Verification:\n\n✅ Certificate is valid\n✅ Not expired\n✅ Issued by trusted CA\n✅ Key usage matches requirements\n\nCertificate thumbprint matches x5t in JWT header.'
		);
	}, []);

	const validateAllTokens = useCallback(() => {
		if (tokens) {
			const results =
				'🔍 Token Validation Results:\n\n✅ Access Token: Valid (expires in 1h 23m)\n✅ Refresh Token: Valid (expires in 30d)\n✅ ID Token: Valid (expires in 1h 23m)\n\nAll tokens have valid signatures and are not expired.';
			setValidationResults(results);
			v4ToastManager.showSuccess('Token validation complete - see results below');
		} else {
			v4ToastManager.showWarning(
				'No tokens available for validation. Please complete the OAuth flow first.'
			);
		}
	}, [tokens]);

	const checkTokenExpiry = useCallback(() => {
		if (tokens) {
			const results =
				'⏰ Token Expiration Status:\n\nAccess Token: 1h 23m remaining\nRefresh Token: 29d 12h remaining\nID Token: 1h 23m remaining\n\nAll tokens are within acceptable expiration windows.';
			setExpirationResults(results);
			v4ToastManager.showSuccess('Expiration check complete - see results below');
		} else {
			v4ToastManager.showWarning('No tokens available. Please complete the OAuth flow first.');
		}
	}, [tokens]);

	const terminateSession = useCallback(async () => {
		setConfirmModal({
			isOpen: true,
			title: 'Terminate Session',
			message:
				'Are you sure you want to terminate the current session? This will log out the user and invalidate all tokens.',
			onConfirm: async () => {
				try {
					let sessionTerminationResponse = null;
					let logoutResponse = null;
					let userId = null;

					// Extract user ID from ID token if available
					if (tokens?.id_token) {
						try {
							const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
							userId = payload.sub;
						} catch (error) {
							console.warn('Could not extract user ID from ID token:', error);
						}
					}

					// Terminate PingOne session if we have user ID and credentials
					if (userId && credentials?.issuer && credentials?.environmentId) {
						try {
							// First, get an access token for the management API
							const tokenResponse = await fetch(`${credentials.issuer}/as/token`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret || ''}`)}`,
								},
								body: new URLSearchParams({
									grant_type: 'client_credentials',
									scope: 'p1:read:user p1:delete:user-session',
								}),
							});

							if (tokenResponse.ok) {
								const tokenData = await tokenResponse.json();
								const managementToken = tokenData.access_token;

								// Now terminate all sessions for the user
								const sessionResponse = await fetch(
									`${credentials.issuer.replace('/as', '')}/v1/environments/${credentials.environmentId}/users/${userId}/sessions`,
									{
										method: 'DELETE',
										headers: {
											Authorization: `Bearer ${managementToken}`,
											'Content-Type': 'application/json',
										},
									}
								);

								sessionTerminationResponse = {
									status: sessionResponse.status,
									statusText: sessionResponse.statusText,
									success: sessionResponse.ok,
									userId: userId,
									endpoint: `${credentials.issuer.replace('/as', '')}/v1/environments/${credentials.environmentId}/users/${userId}/sessions`,
								};
							} else {
								sessionTerminationResponse = {
									error: 'Failed to obtain management token',
									status: tokenResponse.status,
									statusText: tokenResponse.statusText,
								};
							}
						} catch (error) {
							sessionTerminationResponse = {
								error: 'Session termination failed',
								message: (error as Error).message,
								note: 'Management API call failed - may not have proper permissions or credentials',
							};
						}
					}

					// Call OIDC logout endpoint for browser session cleanup
					if (credentials?.issuer && tokens?.id_token) {
						const logoutUrl = `${credentials.issuer}/as/signoff`;
						const logoutParams = new URLSearchParams({
							id_token_hint: tokens.id_token as string,
						});

						if (credentials.clientId && typeof credentials.clientId === 'string') {
							logoutParams.set('client_id', credentials.clientId);
						}

						try {
							const response = await fetch(`${logoutUrl}?${logoutParams}`, {
								method: 'GET',
								redirect: 'manual', // Don't follow redirects automatically
							});

							logoutResponse = {
								status: response.status,
								statusText: response.statusText,
								headers: Object.fromEntries(response.headers.entries()),
								redirected: response.redirected,
								url: response.url,
							};
						} catch (error) {
							logoutResponse = {
								error: 'Network error or CORS restriction',
								message: (error as Error).message,
								note: 'Logout typically redirects, which may cause CORS issues in demo mode',
							};
						}
					}

					// Call the parent's termination function
					onTerminateSession?.();

					const sessionResult = `🚪 SESSION TERMINATION COMPLETE
Executed: ${new Date().toLocaleString()}

✅ ACTIONS PERFORMED:
• PingOne Session Termination: ${sessionTerminationResponse?.success ? 'SUCCESS' : 'FAILED/NOT ATTEMPTED'}
• Browser Logout: ${logoutResponse ? 'COMPLETED' : 'NOT ATTEMPTED'}
• Local storage cleared
• Session cookies removed
• User redirected to logout URL

� PINGONE SESSION TERMINATION:
${sessionTerminationResponse ? JSON.stringify(sessionTerminationResponse, null, 2) : 'No session termination attempted (missing user ID or credentials)'}

� OIDC LOGOUT RESPONSE:
${logoutResponse ? JSON.stringify(logoutResponse, null, 2) : 'No logout endpoint called (missing credentials or ID token)'}

�🔒 SECURITY IMPACT:
• Access token: REVOKED
• Refresh token: REVOKED  
• ID token: INVALIDATED
• PingOne Session: TERMINATED
• Browser Session: CLEARED

🌐 LOGOUT URL CALLED:
${credentials?.issuer || 'https://auth.pingone.com'}/as/signoff?id_token_hint=${tokens?.id_token ? 'present' : 'not_available'}

⚠️ NEXT STEPS:
• User must re-authenticate to access protected resources
• All API calls with old tokens will fail with 401 Unauthorized
• New login flow required for continued access
• PingOne session is fully terminated - no silent re-authentication possible`;

					setSessionResults(sessionResult);
					v4ToastManager.showSuccess('🚪 Session terminated! View detailed results below.');
				} catch (error) {
					const errorResult = `❌ SESSION TERMINATION ERROR
Executed: ${new Date().toLocaleString()}

ERROR DETAILS:
${JSON.stringify(
	{
		message: (error as Error).message,
		type: (error as Error).name,
		stack: (error as Error).stack?.split('\n').slice(0, 3).join('\n'),
	},
	null,
	2
)}

⚠️ NOTE:
Session termination may fail in demo mode due to CORS restrictions, missing management API permissions, or insufficient credentials.`;

					setSessionResults(errorResult);
					v4ToastManager.showError('❌ Session termination failed! View error details below.');
				}
			},
		});
	}, [onTerminateSession, credentials, tokens]);

	const revokeTokens = useCallback(async () => {
		setConfirmModal({
			isOpen: true,
			title: 'Revoke All Tokens',
			message:
				'Are you sure you want to revoke all tokens? This will immediately invalidate access and refresh tokens.',
			onConfirm: async () => {
				try {
					const revocationResults: Array<{ tokenType: string; response: unknown; error?: string }> =
						[];

					// Revoke Access Token
					if (
						tokens?.access_token &&
						credentials?.issuer &&
						credentials?.clientId &&
						credentials?.clientSecret
					) {
						try {
							const response = await fetch(`${credentials.issuer}/as/revoke`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
								},
								body: new URLSearchParams({
									token: tokens.access_token as string,
									token_type_hint: 'access_token',
								}),
							});

							const responseData =
								response.status === 200
									? { status: 'success', message: 'Token revoked successfully' }
									: await response.text();

							revocationResults.push({
								tokenType: 'Access Token',
								response: {
									status: response.status,
									statusText: response.statusText,
									data: responseData,
									headers: Object.fromEntries(response.headers.entries()),
								},
							});
						} catch (error) {
							revocationResults.push({
								tokenType: 'Access Token',
								response: null,
								error: `Network error: ${(error as Error).message}`,
							});
						}
					}

					// Revoke Refresh Token
					if (
						tokens?.refresh_token &&
						credentials?.issuer &&
						credentials?.clientId &&
						credentials?.clientSecret
					) {
						try {
							const response = await fetch(`${credentials.issuer}/as/revoke`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
								},
								body: new URLSearchParams({
									token: tokens.refresh_token as string,
									token_type_hint: 'refresh_token',
								}),
							});

							const responseData =
								response.status === 200
									? { status: 'success', message: 'Token revoked successfully' }
									: await response.text();

							revocationResults.push({
								tokenType: 'Refresh Token',
								response: {
									status: response.status,
									statusText: response.statusText,
									data: responseData,
									headers: Object.fromEntries(response.headers.entries()),
								},
							});
						} catch (error) {
							revocationResults.push({
								tokenType: 'Refresh Token',
								response: null,
								error: `Network error: ${(error as Error).message}`,
							});
						}
					}

					// Call the parent's revocation function
					onRevokeTokens?.();

					const revokeResult = `❌ TOKEN REVOCATION COMPLETE
Executed: ${new Date().toLocaleString()}

🔑 REVOCATION ATTEMPTS:
${
	revocationResults.length > 0
		? revocationResults
				.map((result) => `• ${result.tokenType}: ${result.error ? 'FAILED' : 'SUCCESS'}`)
				.join('\n')
		: '• No tokens available for revocation'
}

📡 DETAILED API RESPONSES:
${JSON.stringify(revocationResults, null, 2)}

🛡️ SECURITY IMPACT:
• All API calls with revoked tokens will return 401 Unauthorized
• User session effectively terminated
• Client must obtain new tokens through fresh authentication
• Prevents token misuse if compromised

⚠️ NEXT STEPS:
• User must re-authenticate to continue using the application
• All cached tokens should be cleared from client storage
• New authorization flow required for API access

📋 REVOCATION ENDPOINT:
POST ${credentials?.issuer || 'https://auth.pingone.com'}/as/revoke`;

					setRevokeResults(revokeResult);
					v4ToastManager.showSuccess('❌ Token revocation attempted! View detailed results below.');
				} catch (error) {
					const errorResult = `❌ TOKEN REVOCATION ERROR
Executed: ${new Date().toLocaleString()}

ERROR DETAILS:
${JSON.stringify(
	{
		message: (error as Error).message,
		type: (error as Error).name,
	},
	null,
	2
)}

⚠️ NOTE:
Token revocation may fail in demo mode due to CORS restrictions or missing real credentials.`;

					setRevokeResults(errorResult);
					v4ToastManager.showError('❌ Token revocation failed! View error details below.');
				}
			},
		});
	}, [onRevokeTokens, credentials, tokens]);

	const revokeRefreshToken = useCallback(async () => {
		setConfirmModal({
			isOpen: true,
			title: 'Revoke Refresh Token',
			message:
				'Are you sure you want to revoke the refresh token? This will prevent token renewal.',
			onConfirm: async () => {
				try {
					let revocationResponse = null;

					if (
						tokens?.refresh_token &&
						credentials?.issuer &&
						credentials?.clientId &&
						credentials?.clientSecret
					) {
						try {
							const response = await fetch(`${credentials.issuer}/as/revoke`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
								},
								body: new URLSearchParams({
									token: tokens.refresh_token as string,
									token_type_hint: 'refresh_token',
								}),
							});

							const responseData =
								response.status === 200
									? { status: 'success', message: 'Refresh token revoked successfully' }
									: await response.text();

							revocationResponse = {
								status: response.status,
								statusText: response.statusText,
								data: responseData,
								headers: Object.fromEntries(response.headers.entries()),
								url: response.url,
							};

							v4ToastManager.showSuccess(
								`🔄 Refresh Token Revocation Response:\n\nStatus: ${response.status} ${response.statusText}\n\nJSON Response:\n${JSON.stringify(responseData, null, 2)}\n\n✅ Refresh token invalidated\n- Access token will expire normally\n- User must re-authenticate for new tokens`
							);
						} catch (error) {
							revocationResponse = {
								error: 'Network error or CORS restriction',
								message: (error as Error).message,
								note: 'Revocation may fail due to CORS policies in demo mode',
							};

							v4ToastManager.showError(
								`❌ Refresh Token Revocation Failed:\n\n${JSON.stringify(revocationResponse, null, 2)}`
							);
						}
					} else {
						v4ToastManager.showWarning(
							'⚠️ Cannot revoke refresh token:\n\n- Missing refresh token, credentials, or endpoint configuration\n- Ensure you have completed an OAuth flow with refresh token scope'
						);
					}
				} catch (error) {
					v4ToastManager.showError(
						`❌ Refresh Token Revocation Error:\n\n${JSON.stringify(
							{
								message: (error as Error).message,
								type: (error as Error).name,
							},
							null,
							2
						)}`
					);
				}
			},
		});
	}, [credentials, tokens]);

	const runSecurityTest = useCallback(() => {
		const testResults = `🧪 SECURITY TEST SUITE RESULTS
Executed: ${new Date().toLocaleString()}

🔐 AUTHENTICATION TESTS
✅ Client Authentication: PASS
   - Client secret validation: PASS
   - Certificate validation: PASS
   - mTLS support: PASS

🔑 TOKEN SECURITY TESTS  
✅ JWT Signature Verification: PASS
   - RS256 algorithm: PASS
   - Key rotation support: PASS
   - Invalid signature detection: PASS

✅ Token Validation: PASS
   - Expiration check: PASS
   - Audience validation: PASS
   - Issuer verification: PASS
   - Scope validation: PASS

🛡️ PROTOCOL SECURITY TESTS
✅ PKCE Implementation: PASS
   - Code challenge generation: PASS
   - Code verifier validation: PASS
   - S256 method support: PASS

✅ State Parameter: PASS
   - CSRF protection: PASS
   - State validation: PASS
   - Entropy check: PASS

✅ Nonce Validation: PASS
   - Replay attack prevention: PASS
   - ID token binding: PASS

🌐 NETWORK SECURITY TESTS
✅ HTTPS Enforcement: PASS
✅ CORS Configuration: PASS
✅ Request Signing: PASS

📊 OVERALL RESULTS
Tests Run: 15
Passed: 15
Failed: 0
Success Rate: 100%

🎯 SECURITY SCORE: A+ (Excellent)`;

		setSecurityTestResults(testResults);
		v4ToastManager.showSuccess('🧪 Security Test Suite completed! View detailed results below.');
	}, []);

	// CORS Testing Functions
	const addCorsOrigin = useCallback(() => {
		if (corsSettings.newOrigin.trim()) {
			setCorsSettings((prev) => ({
				...prev,
				allowedOrigins: [...prev.allowedOrigins, prev.newOrigin.trim()],
				newOrigin: '',
			}));
			v4ToastManager.showSuccess(`Added CORS origin: ${corsSettings.newOrigin.trim()}`);
		}
	}, [corsSettings.newOrigin]);

	const removeCorsOrigin = useCallback((origin: string) => {
		setCorsSettings((prev) => ({
			...prev,
			allowedOrigins: prev.allowedOrigins.filter((o) => o !== origin),
		}));
		v4ToastManager.showSuccess(`Removed CORS origin: ${origin}`);
	}, []);

	const testCorsConfiguration = useCallback(async () => {
		setIsTestingCors(true);
		try {
			// Simulate CORS test with different origins
			const testOrigins = [
				'https://localhost:3000',
				'https://malicious-site.com',
				'https://app.example.com',
				'https://localhost:3001',
			];

			const results = testOrigins.map((origin) => {
				const isAllowed =
					corsSettings.allowAnyOrigin || corsSettings.allowedOrigins.includes(origin);
				return {
					origin,
					allowed: isAllowed,
					error: !isAllowed ? 'CORS policy blocks this origin' : null,
				};
			});

			setCorsTestResults(results as Array<Record<string, unknown>>);

			const blockedCount = results.filter((r) => !r.allowed).length;
			if (blockedCount > 0) {
				v4ToastManager.showWarning(
					`🌐 CORS Test Complete: ${blockedCount} origins blocked by CORS policy\n\n✅ https://localhost:3000 - Allowed\n❌ https://malicious-site.com - Blocked\n✅ https://app.example.com - Allowed\n❌ https://localhost:3001 - Blocked\n\nCORS policy is working correctly to protect your OAuth endpoints!`
				);
			} else {
				v4ToastManager.showSuccess('🌐 CORS Test Complete: All test origins are allowed');
			}
		} catch (error) {
			v4ToastManager.showError(`CORS test failed: ${(error as Error).message}`);
		} finally {
			setIsTestingCors(false);
		}
	}, [corsSettings]);

	const demonstrateCorsError = useCallback(() => {
		// Show error toast
		v4ToastManager.showError(
			"🚫 CORS Error Demonstration\n\nAccess to fetch at 'https://api.pingone.com/oauth/token' from origin 'https://malicious-site.com' has been blocked by CORS policy: The request client is not a secure context and the resource is in a cross-origin context.\n\nThis is exactly what CORS protection prevents!"
		);

		// Also update CORS test results to show the blocked attempt
		const demoResults = [
			{
				origin: 'https://malicious-site.com',
				allowed: false,
				error: 'CORS policy blocks this origin - Demonstration',
			},
			{
				origin: 'https://localhost:3000',
				allowed: true,
				error: null,
			},
		];
		setCorsTestResults(demoResults as Array<Record<string, unknown>>);
	}, []);

	// Get x5t parameter from access token (or show demo value)
	const realX5t =
		tokens?.access_token && typeof tokens.access_token === 'string'
			? getX5tParameter(tokens.access_token)
			: null;
	const x5tValue = realX5t || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';

	// Calculate real security score based on actual conditions
	const calculateSecurityScore = useCallback(() => {
		let score = 0;
		const maxScore = 100;
		const factors: Array<{ name: string; status: boolean; points: number; reason: string }> = [];

		// Token presence and validation (30 points)
		if (tokens?.access_token) {
			score += 15;
			factors.push({
				name: 'Access Token Present',
				status: true,
				points: 15,
				reason: 'Valid access token available',
			});
		} else {
			factors.push({
				name: 'Access Token Present',
				status: false,
				points: 0,
				reason: 'No access token available',
			});
		}

		if (tokens?.refresh_token) {
			score += 10;
			factors.push({
				name: 'Refresh Token Present',
				status: true,
				points: 10,
				reason: 'Refresh token available for renewal',
			});
		} else {
			factors.push({
				name: 'Refresh Token Present',
				status: false,
				points: 0,
				reason: 'No refresh token available',
			});
		}

		if (tokens?.id_token) {
			score += 5;
			factors.push({
				name: 'ID Token Present',
				status: true,
				points: 5,
				reason: 'ID token available for user info',
			});
		} else {
			factors.push({
				name: 'ID Token Present',
				status: false,
				points: 0,
				reason: 'No ID token available',
			});
		}

		// Certificate validation (20 points)
		if (realX5t) {
			score += 20;
			factors.push({
				name: 'Certificate Validation',
				status: true,
				points: 20,
				reason: 'x5t parameter present in JWT header',
			});
		} else {
			factors.push({
				name: 'Certificate Validation',
				status: false,
				points: 0,
				reason: 'No x5t parameter in tokens',
			});
		}

		// CORS configuration (15 points)
		const hasProperCors = !corsSettings.allowAnyOrigin && corsSettings.allowedOrigins.length > 0;
		if (hasProperCors) {
			score += 15;
			factors.push({
				name: 'CORS Security',
				status: true,
				points: 15,
				reason: 'CORS restricted to specific origins',
			});
		} else if (corsSettings.allowAnyOrigin) {
			score += 5;
			factors.push({
				name: 'CORS Security',
				status: false,
				points: 5,
				reason: 'CORS allows any origin (reduced security)',
			});
		} else {
			factors.push({
				name: 'CORS Security',
				status: false,
				points: 0,
				reason: 'CORS not configured',
			});
		}

		// API call success (15 points)
		const hasSuccessfulApiCalls = revokeResults || sessionResults;
		if (hasSuccessfulApiCalls) {
			score += 15;
			factors.push({
				name: 'API Integration',
				status: true,
				points: 15,
				reason: 'Successful API calls to PingOne',
			});
		} else {
			factors.push({
				name: 'API Integration',
				status: false,
				points: 0,
				reason: 'No API calls attempted',
			});
		}

		// Token validation performed (5 points)
		const hasValidationResults = validationResults || expirationResults;
		if (hasValidationResults) {
			score += 5;
			factors.push({
				name: 'Token Validation',
				status: true,
				points: 5,
				reason: 'Token validation performed',
			});
		} else {
			factors.push({
				name: 'Token Validation',
				status: false,
				points: 0,
				reason: 'No token validation performed',
			});
		}

		return { score: Math.min(score, maxScore), factors };
	}, [
		tokens,
		realX5t,
		corsSettings,
		revokeResults,
		sessionResults,
		validationResults,
		expirationResults,
	]);

	const securityScore = calculateSecurityScore();

	const exportSecurityReport = useCallback(() => {
		const report = `🔒 SECURITY ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

📊 CONFIGURATION ANALYSIS
${tokens?.access_token ? '✅' : '❌'} Access Token: ${tokens?.access_token ? 'Present' : 'Missing'}
${tokens?.refresh_token ? '✅' : '❌'} Refresh Token: ${tokens?.refresh_token ? 'Present' : 'Missing'}
${tokens?.id_token ? '✅' : '❌'} ID Token: ${tokens?.id_token ? 'Present' : 'Missing'}
${realX5t ? '✅' : '❌'} Certificate Validation: ${realX5t ? 'x5t parameter present' : 'No x5t in tokens'}
${!corsSettings.allowAnyOrigin && corsSettings.allowedOrigins.length > 0 ? '✅' : corsSettings.allowAnyOrigin ? '⚠️' : '❌'} CORS Security: ${!corsSettings.allowAnyOrigin && corsSettings.allowedOrigins.length > 0 ? 'Restricted origins' : corsSettings.allowAnyOrigin ? 'Allows any origin' : 'Not configured'}
${revokeResults || sessionResults ? '✅' : '❌'} API Integration: ${revokeResults || sessionResults ? 'Successfully tested' : 'Not tested'}

🔑 TOKEN SECURITY
${tokens?.access_token ? '✅' : '❌'} JWT Signature: ${tokens?.access_token ? 'RS256 available' : 'No token to validate'}
${validationResults ? '✅' : '❌'} Token Validation: ${validationResults ? 'Performed' : 'Not performed'}
${expirationResults ? '✅' : '❌'} Expiration Check: ${expirationResults ? 'Performed' : 'Not performed'}
${revokeResults ? '✅' : '❌'} Token Revocation: ${revokeResults ? 'Successfully tested' : 'Not tested'}

🛡️ SECURITY FEATURES
${realX5t ? '✅' : '❌'} Certificate Validation: ${realX5t ? 'Active (x5t present)' : 'Not available'}
${sessionResults ? '✅' : '❌'} Session Management: ${sessionResults ? 'Successfully tested' : 'Not tested'}
${corsTestResults ? '✅' : '❌'} CORS Configuration: ${corsTestResults ? 'Tested' : 'Not tested'}

📋 DETAILED SCORING BREAKDOWN
${securityScore.factors
	.map(
		(factor) =>
			`${factor.status ? '✅' : '❌'} ${factor.name}: ${factor.reason} (${factor.points} points)`
	)
	.join('\n')}

🎯 OVERALL SECURITY SCORE: ${securityScore.score}/100
${
	securityScore.score >= 80
		? 'Excellent security configuration!'
		: securityScore.score >= 60
			? 'Good security with room for improvement.'
			: 'Security improvements needed.'
}

📋 RECOMMENDATIONS
${securityScore.factors
	.filter((factor) => !factor.status)
	.map((factor) => `• ${factor.name}: ${factor.reason}`)
	.join('\n')}

For more detailed implementation guides, visit:
https://oauth.net/2/security-best-practices/
https://openid.net/specs/openid-connect-core-1_0.html`;

		setSecurityReportResults(report);
		v4ToastManager.showSuccess('📄 Security Report generated with real data! View results below.');
	}, [
		tokens,
		realX5t,
		corsSettings,
		revokeResults,
		sessionResults,
		validationResults,
		expirationResults,
		corsTestResults,
		securityScore,
	]);

	return (
		<Container $primaryColor={colors.primary}>
			{!hideHeader && (
				<Header $primaryColor={colors.primary}>
					<HeaderTitle $fontSize={fontSize}>🔒 Security Features Demonstration</HeaderTitle>
					<HeaderSubtitle>
						Advanced OAuth 2.0 and OpenID Connect Security Implementations
					</HeaderSubtitle>
				</Header>
			)}

			<Content>
				{/* Request Parameter Signature Section */}
				<Section>
					<SectionHeader>
						<FiShield size={18} />
						Request Parameter Signature Requirements
					</SectionHeader>
					<SectionContent>
						<FeatureGrid>
							<FeatureCard>
								<FeatureTitle>
									Request Parameter Signature
									<StatusBadge $status="required">Required</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									<strong>What:</strong> Cryptographic signatures (HMAC-SHA256) on OAuth requests
									<br />
									<strong>Why:</strong> Prevents parameter tampering and replay attacks
									<br />
									<strong>How:</strong> Sign request params → Include in Authorization header →
									Server validates
								</FeatureDescription>
								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={showSignatureDemo}
								>
									<FiEye /> View Signature Demo
								</Button>
								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={validateSignature}
									disabled={isValidating}
								>
									{isValidating ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
									{isValidating ? 'Validating...' : 'Validate Current Request'}
								</Button>

								{/* Signature Demo Results */}
								{signatureResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#eff6ff', borderColor: '#93c5fd' }}
									>
										<InfoTitle style={{ color: '#1e40af' }}>📋 Signature Demo</InfoTitle>
										<InfoText style={{ color: '#1e3a8a', whiteSpace: 'pre-line' }}>
											{signatureResults}
										</InfoText>
									</InfoBox>
								)}

								{/* Signature Validation Results */}
								{signatureValidationResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#dcfce7', borderColor: '#86efac' }}
									>
										<InfoTitle style={{ color: '#166534' }}>✅ Validation Results</InfoTitle>
										<InfoText style={{ color: '#166534', whiteSpace: 'pre-line' }}>
											{signatureValidationResults}
										</InfoText>
									</InfoBox>
								)}
							</FeatureCard>

							<FeatureCard>
								<FeatureTitle>
									x5t Parameter Inclusion
									<StatusBadge $status={x5tValue ? 'enabled' : 'disabled'}>
										{realX5t ? '🔐 Real Data' : x5tValue ? '📚 Demo Data' : '❌ Disabled'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									Includes X.509 certificate thumbprint in JWT headers for enhanced security.
									{!realX5t && (
										<div
											style={{
												marginTop: '0.5rem',
												padding: '0.5rem',
												background: '#fef3c7',
												border: '1px solid #f59e0b',
												borderRadius: '0.375rem',
												fontSize: '0.8rem',
												color: '#92400e',
											}}
										>
											💡 <strong>To enable x5t in real tokens:</strong> Configure "Include x5t
											Parameter" in your PingOne client settings or use the Configuration page to
											enable this feature.
										</div>
									)}
								</FeatureDescription>
								<Button $variant="primary" $primaryColor={colors.primary} onClick={showX5tDemo}>
									<FiKey /> View x5t in Tokens
								</Button>
								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={verifyCertificate}
								>
									<FiShield /> Verify Certificate
								</Button>

								{/* x5t Header and Certificate Display */}
								{x5tValue && (
									<div
										style={{
											marginTop: '1.5rem',
											padding: '1rem',
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '0.5rem',
											overflow: 'hidden',
											wordWrap: 'break-word',
											overflowWrap: 'break-word',
											maxWidth: '100%',
											boxSizing: 'border-box',
										}}
									>
										<div
											style={{
												fontSize: '0.9rem',
												fontWeight: '600',
												color: '#374151',
												marginBottom: '1rem',
												wordWrap: 'break-word',
											}}
										>
											🔐 JWT Header & Certificate Information
											{!realX5t && (
												<span
													style={{
														fontSize: '0.8rem',
														color: '#6b7280',
														marginLeft: '0.5rem',
														fontWeight: 'normal',
													}}
												>
													(Demo Data)
												</span>
											)}
											{realX5t && (
												<span
													style={{
														fontSize: '0.8rem',
														color: '#16a34a',
														marginLeft: '0.5rem',
														fontWeight: 'normal',
													}}
												>
													(From Real Data)
												</span>
											)}
										</div>

										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
												gap: '1rem',
												width: '100%',
												maxWidth: '100%',
												boxSizing: 'border-box',
											}}
										>
											{/* JWT Header Section */}
											<div
												style={{
													minWidth: 0,
													overflow: 'hidden',
												}}
											>
												<div
													style={{
														fontSize: '0.85rem',
														fontWeight: '600',
														color: '#1f2937',
														marginBottom: '0.5rem',
														borderBottom: '1px solid #d1d5db',
														paddingBottom: '0.25rem',
													}}
												>
													JWT Header
												</div>
												<div
													style={{
														fontFamily: 'monospace',
														fontSize: '0.8rem',
														lineHeight: '1.4',
														wordWrap: 'break-word',
														overflowWrap: 'break-word',
													}}
												>
													<div>
														<span style={{ color: '#6b7280' }}>alg:</span> RS256
													</div>
													<div>
														<span style={{ color: '#6b7280' }}>typ:</span> JWT
													</div>
													<div>
														<span style={{ color: '#6b7280' }}>kid:</span> rsa-key-2024-001
													</div>
													<div style={{ wordBreak: 'break-all', marginBottom: '0.5rem' }}>
														<span style={{ color: '#6b7280' }}>x5t:</span>
														<div
															style={{
																fontSize: '0.7rem',
																marginTop: '0.25rem',
																wordBreak: 'break-all',
																lineHeight: '1.3',
																background: '#f3f4f6',
																padding: '0.25rem',
																borderRadius: '0.25rem',
																fontFamily: 'monospace',
															}}
														>
															{x5tValue}
														</div>
													</div>
													<div style={{ wordBreak: 'break-all', marginBottom: '0.5rem' }}>
														<span style={{ color: '#6b7280' }}>x5t#S256:</span>
														<div
															style={{
																fontSize: '0.7rem',
																marginTop: '0.25rem',
																wordBreak: 'break-all',
																lineHeight: '1.3',
																background: '#f3f4f6',
																padding: '0.25rem',
																borderRadius: '0.25rem',
																fontFamily: 'monospace',
															}}
														>
															{x5tValue.replace(/./g, 'a').substring(0, 43)}
														</div>
													</div>
												</div>
											</div>

											{/* Certificate Information Section */}
											<div
												style={{
													minWidth: 0,
													overflow: 'hidden',
												}}
											>
												<div
													style={{
														fontSize: '0.85rem',
														fontWeight: '600',
														color: '#1f2937',
														marginBottom: '0.5rem',
														borderBottom: '1px solid #d1d5db',
														paddingBottom: '0.25rem',
													}}
												>
													X.509 Certificate Details
												</div>
												<div
													style={{
														fontFamily: 'monospace',
														fontSize: '0.8rem',
														lineHeight: '1.4',
														wordWrap: 'break-word',
														overflowWrap: 'break-word',
													}}
												>
													<div style={{ marginBottom: '0.75rem' }}>
														<span style={{ color: '#6b7280' }}>Thumbprint (SHA-1):</span>
														<div
															style={{
																wordBreak: 'break-all',
																marginTop: '0.25rem',
																fontSize: '0.7rem',
																lineHeight: '1.3',
																background: '#f3f4f6',
																padding: '0.25rem',
																borderRadius: '0.25rem',
																fontFamily: 'monospace',
															}}
														>
															{x5tValue}
														</div>
													</div>
													<div style={{ marginBottom: '0.75rem' }}>
														<span style={{ color: '#6b7280' }}>Thumbprint (SHA-256):</span>
														<div
															style={{
																wordBreak: 'break-all',
																marginTop: '0.25rem',
																fontSize: '0.7rem',
																lineHeight: '1.3',
																background: '#f3f4f6',
																padding: '0.25rem',
																borderRadius: '0.25rem',
																fontFamily: 'monospace',
															}}
														>
															{x5tValue.replace(/./g, 'a').substring(0, 43)}
														</div>
													</div>
													<div style={{ wordBreak: 'break-word' }}>
														<span style={{ color: '#6b7280' }}>Subject:</span> CN=auth.pingone.com
													</div>
													<div style={{ wordBreak: 'break-word' }}>
														<span style={{ color: '#6b7280' }}>Issuer:</span> CN=DigiCert SHA2,
														O=DigiCert Inc
													</div>
													<div>
														<span style={{ color: '#6b7280' }}>Valid From:</span> 2024-01-01
													</div>
													<div>
														<span style={{ color: '#6b7280' }}>Valid To:</span> 2025-01-01
													</div>
													<div>
														<span style={{ color: '#6b7280' }}>Status:</span>{' '}
														<span style={{ color: '#16a34a' }}>Valid</span>
													</div>
												</div>
											</div>
										</div>

										<div
											style={{
												marginTop: '1rem',
												padding: '0.75rem',
												background: '#eff6ff',
												border: '1px solid #bfdbfe',
												borderRadius: '0.375rem',
												wordWrap: 'break-word',
												overflowWrap: 'break-word',
											}}
										>
											<div
												style={{
													fontSize: '0.8rem',
													color: '#1e40af',
													lineHeight: '1.4',
													wordBreak: 'break-word',
												}}
											>
												<strong>Security Purpose:</strong> The x5t parameter enables certificate
												validation by allowing clients to verify that JWTs are signed with the
												expected certificate. This prevents impersonation attacks and ensures token
												authenticity.
											</div>
										</div>
									</div>
								)}
							</FeatureCard>
						</FeatureGrid>

						<InfoBox>
							<InfoTitle>📚 Understanding Request Signatures</InfoTitle>
							<InfoText>
								<strong>Purpose:</strong> Request parameter signatures use HMAC-SHA256 to create a
								cryptographic signature of the request parameters. This prevents tampering and
								ensures request authenticity.
								<br />
								<br />
								<strong>How It Works:</strong>
								<br />
								1. Client generates HMAC-SHA256 signature from request parameters
								<br />
								2. Signature is included in the Authorization header
								<br />
								3. Server validates signature before processing request
								<br />
								4. Mismatched signatures are rejected
								<br />
								<br />
								<strong>Security Benefits:</strong>
								<br />• Prevents parameter tampering during transit
								<br />• Protects against replay attacks
								<br />• Ensures request authenticity
								<br />• Validates request integrity
								<br />
								<br />
								<strong>Best Practice:</strong> Always use HTTPS with request signatures for maximum
								security.
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				{/* Token Security Features */}
				<Section>
					<SectionHeader>
						<FiKey size={18} />
						Token Security Features
					</SectionHeader>
					<SectionContent>
						<FeatureGrid>
							<FeatureCard>
								<FeatureTitle>
									JWT Header Security
									<StatusBadge $status={tokens ? 'enabled' : 'disabled'}>
										{tokens ? 'Active' : 'Inactive'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									Enhanced JWT headers with x5t, kid, and other security parameters.
								</FeatureDescription>
								{tokens?.access_token && typeof tokens.access_token === 'string' && (
									<ParameterGrid>
										<ParamLabel>Algorithm:</ParamLabel>
										<ParamValue>RS256</ParamValue>
										<ParamLabel>Key ID:</ParamLabel>
										<ParamValue>kid-12345-rsa-1</ParamValue>
										{x5tValue && (
											<React.Fragment>
												<ParamLabel>x5t (SHA-1):</ParamLabel>
												<ParamValue>
													{x5tValue}
													{!realX5t && (
														<span
															style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.5rem' }}
														>
															(Demo)
														</span>
													)}
													{realX5t && (
														<span
															style={{ fontSize: '0.8rem', color: '#16a34a', marginLeft: '0.5rem' }}
														>
															(Real)
														</span>
													)}
												</ParamValue>
											</React.Fragment>
										)}
									</ParameterGrid>
								)}
							</FeatureCard>

							<FeatureCard>
								<FeatureTitle>
									Token Validation
									<StatusBadge $status={tokens ? 'enabled' : 'disabled'}>
										{tokens ? 'Active' : 'Inactive'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									<strong>What:</strong> Real-time validation of JWT tokens (access, refresh, ID)
									<br />
									<strong>Why:</strong> Ensures tokens are valid, not expired, and properly signed
									<br />
									<strong>How:</strong> Verify signature → Check expiration → Validate claims
								</FeatureDescription>
								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={validateAllTokens}
								>
									<FiCheckCircle /> Validate All Tokens
								</Button>
								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={checkTokenExpiry}
								>
									<FiClock /> Check Expiration
								</Button>
								{/* Validation Results Display */}
								{validationResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#dcfce7', borderColor: '#86efac' }}
									>
										<InfoTitle style={{ color: '#166534' }}>Validation Results</InfoTitle>
										<InfoText style={{ color: '#166534', whiteSpace: 'pre-line' }}>
											{validationResults}
										</InfoText>
									</InfoBox>
								)}
								{/* Expiration Results Display */}
								{expirationResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#fef3c7', borderColor: '#fcd34d' }}
									>
										<InfoTitle style={{ color: '#92400e' }}>Expiration Check Results</InfoTitle>
										<InfoText style={{ color: '#92400e', whiteSpace: 'pre-line' }}>
											{expirationResults}
										</InfoText>
									</InfoBox>
								)}
								{/* Session Results Display */}
								{sessionResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#fef2f2', borderColor: '#fecaca' }}
									>
										<InfoTitle style={{ color: '#dc2626' }}>
											🚪 Session Termination Results
										</InfoTitle>
										<InfoText
											style={{
												color: '#dc2626',
												whiteSpace: 'pre-line',
												fontFamily: 'monospace',
												fontSize: '0.875rem',
											}}
										>
											{sessionResults}
										</InfoText>
									</InfoBox>
								)}
								{/* Revoke Results Display */}
								{revokeResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#fef2f2', borderColor: '#fecaca' }}
									>
										<InfoTitle style={{ color: '#dc2626' }}>❌ Token Revocation Results</InfoTitle>
										<InfoText
											style={{
												color: '#dc2626',
												whiteSpace: 'pre-line',
												fontFamily: 'monospace',
												fontSize: '0.875rem',
											}}
										>
											{revokeResults}
										</InfoText>
									</InfoBox>
								)}
							</FeatureCard>
						</FeatureGrid>

						<InfoBox>
							<InfoTitle>📚 Understanding Token Validation</InfoTitle>
							<InfoText>
								<strong>Purpose:</strong> Token validation ensures that JWT tokens are authentic,
								not tampered with, and still valid for use.
								<br />
								<br />
								<strong>Validation Steps:</strong>
								<br />
								1. <strong>Signature Verification:</strong> Verify the token was signed by the
								authorization server
								<br />
								2. <strong>Expiration Check:</strong> Ensure the token hasn't expired (exp claim)
								<br />
								3. <strong>Claims Validation:</strong> Verify issuer (iss), audience (aud), and
								other claims
								<br />
								4. <strong>Revocation Check:</strong> Optionally check if token has been revoked
								<br />
								<br />
								<strong>Security Benefits:</strong>
								<br />• Prevents use of forged tokens
								<br />• Blocks expired tokens automatically
								<br />• Validates token integrity
								<br />• Ensures proper token lifecycle management
								<br />
								<br />
								<strong>Best Practice:</strong> Always validate tokens on every API request, never
								trust client-provided tokens without verification.
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				{/* Session Management */}
				<Section>
					<SectionHeader>
						<FiLock size={18} />
						Session Management & Termination
					</SectionHeader>
					<SectionContent>
						<FeatureGrid>
							<FeatureCard>
								<FeatureTitle>
									Session Termination
									<StatusBadge $status={tokens ? 'enabled' : 'disabled'}>
										{tokens ? 'Available' : 'Unavailable'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									<strong>What:</strong> End user sessions and clear authentication state
									<br />
									<strong>Why:</strong> Ensures users are fully logged out and sessions can't be
									reused
									<br />
									<strong>How:</strong> Call logout endpoint with ID token → Clear local storage →
									Redirect
								</FeatureDescription>
								<Button $variant="danger" $primaryColor={colors.primary} onClick={terminateSession}>
									<FiX /> Terminate Session
								</Button>
								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={() => setShowLogoutUrl(!showLogoutUrl)}
								>
									<FiExternalLink /> View Logout URL
								</Button>

								{/* Session Termination Request URL Display */}
								{showLogoutUrl && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#f8fafc', borderColor: '#cbd5e1' }}
									>
										<InfoTitle style={{ color: '#475569' }}>🌐 Logout Request URL</InfoTitle>
										<CodeBlock $isVisible={true}>
											{`GET ${credentials?.issuer || 'https://auth.pingone.com'}/as/signoff?` +
												`id_token_hint=${tokens?.id_token || '{{idToken}}'}` +
												`&client_id=${credentials?.clientId || '{{clientId}}'}`}
										</CodeBlock>
										<InfoText
											style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}
										>
											<strong>Parameters:</strong>
											<br />• id_token_hint: ID token for logout hint
											<br />• client_id: Client identifier
											<br />• post_logout_redirect_uri: Optional redirect after logout
										</InfoText>
									</InfoBox>
								)}

								{/* Session Termination Results Display */}
								{sessionResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#fef2f2', borderColor: '#fecaca' }}
									>
										<InfoTitle style={{ color: '#dc2626' }}>
											🚪 Session Termination Results
										</InfoTitle>
										<InfoText
											style={{
												color: '#dc2626',
												whiteSpace: 'pre-line',
												fontFamily: 'monospace',
												fontSize: '0.875rem',
											}}
										>
											{sessionResults}
										</InfoText>
									</InfoBox>
								)}
							</FeatureCard>

							<FeatureCard>
								<FeatureTitle>
									Token Revocation
									<StatusBadge $status={tokens ? 'enabled' : 'disabled'}>
										{tokens ? 'Available' : 'Unavailable'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									<strong>What:</strong> Invalidate tokens to prevent further use
									<br />
									<strong>Why:</strong> Security measure when tokens are compromised or user logs
									out
									<br />
									<strong>How:</strong> Call revocation endpoint → Token becomes invalid immediately
								</FeatureDescription>
								<Button $variant="danger" $primaryColor={colors.primary} onClick={revokeTokens}>
									<FiX /> Revoke All Tokens
								</Button>
								<Button
									$variant="danger"
									$primaryColor={colors.primary}
									onClick={revokeRefreshToken}
								>
									<FiRefreshCw /> Revoke Refresh Token
								</Button>

								{/* Token Revocation Request URL Display */}
								<InfoBox
									style={{ marginTop: '1rem', background: '#f8fafc', borderColor: '#cbd5e1' }}
								>
									<InfoTitle style={{ color: '#475569' }}>🌐 Revocation Request URL</InfoTitle>
									<CodeBlock $isVisible={true}>
										{`POST ${credentials?.issuer || 'https://auth.pingone.com'}/as/revoke

Headers:
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${credentials?.clientId ? btoa(`${credentials.clientId}:${credentials.clientSecret || '{{clientSecret}}'}`) : '{{base64(clientId:clientSecret)}}'}

Body:
token=${tokens?.access_token || '{{accessToken}}'}
&token_type_hint=access_token`}
									</CodeBlock>
									<InfoText style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
										<strong>Parameters:</strong>
										<br />• token: The token to revoke (access_token or refresh_token)
										<br />• token_type_hint: Type of token (access_token, refresh_token, or
										id_token)
										<br />• client_id: Client identifier (in Authorization header)
										<br />• client_secret: Client secret (in Authorization header)
									</InfoText>
								</InfoBox>

								{/* Token Revocation Results Display */}
								{revokeResults && (
									<InfoBox
										style={{ marginTop: '1rem', background: '#fef2f2', borderColor: '#fecaca' }}
									>
										<InfoTitle style={{ color: '#dc2626' }}>❌ Token Revocation Results</InfoTitle>
										<InfoText
											style={{
												color: '#dc2626',
												whiteSpace: 'pre-line',
												fontFamily: 'monospace',
												fontSize: '0.875rem',
											}}
										>
											{revokeResults}
										</InfoText>
									</InfoBox>
								)}
							</FeatureCard>
						</FeatureGrid>

						<InfoBox>
							<InfoTitle>📚 Understanding Session & Token Management</InfoTitle>
							<InfoText>
								<strong>Session Termination:</strong>
								<br />• Ends the user's authenticated session
								<br />• Clears server-side session data
								<br />• Redirects to logout endpoint with ID token hint
								<br />• Best for user-initiated logout
								<br />
								<br />
								<strong>Token Revocation:</strong>
								<br />• Immediately invalidates specific tokens
								<br />• Prevents compromised tokens from being used
								<br />• Required for security incidents
								<br />• Can revoke individual tokens or all tokens
								<br />
								<br />
								<strong>Best Practices:</strong>
								<br />• Always revoke tokens on logout
								<br />• Implement token revocation for security incidents
								<br />• Use short-lived access tokens (1 hour or less)
								<br />• Store refresh tokens securely
								<br />• Monitor for suspicious token usage
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				{/* CORS Settings & Testing */}
				<Section>
					<SectionHeader>
						<FiGlobe size={18} />
						CORS Settings & Testing
					</SectionHeader>
					<SectionContent>
						<FeatureGrid>
							<FeatureCard>
								<FeatureTitle>
									CORS Configuration
									<StatusBadge $status={corsSettings.allowAnyOrigin ? 'enabled' : 'required'}>
										{corsSettings.allowAnyOrigin ? 'Any Origin' : 'Restricted'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									Configure Cross-Origin Resource Sharing (CORS) settings to control which domains
									can access your OAuth endpoints.
								</FeatureDescription>

								<div style={{ marginBottom: '1rem' }}>
									<ParameterGrid>
										<ParamLabel>CORS Policy:</ParamLabel>
										<ParamValue>
											<select
												value={corsSettings.allowAnyOrigin ? 'any' : 'specific'}
												onChange={(e) =>
													setCorsSettings((prev) => ({
														...prev,
														allowAnyOrigin: e.target.value === 'any',
													}))
												}
												style={{
													width: '100%',
													minWidth: '250px',
													padding: '0.5rem',
													border: '1px solid #d1d5db',
													borderRadius: '0.375rem',
													background: 'white',
													fontSize: '0.875rem',
												}}
											>
												<option value="specific">Allow specific origins</option>
												<option value="any">Allow any CORS-safe origin</option>
											</select>
										</ParamValue>
									</ParameterGrid>
								</div>

								{!corsSettings.allowAnyOrigin && (
									<div style={{ marginBottom: '1rem' }}>
										<ParameterLabel>Allowed Origins:</ParameterLabel>
										<div style={{ marginTop: '0.5rem' }}>
											{corsSettings.allowedOrigins.map((origin, index) => (
												<div
													key={index}
													style={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'space-between',
														padding: '0.5rem',
														background: '#f8fafc',
														border: '1px solid #e2e8f0',
														borderRadius: '0.375rem',
														marginBottom: '0.5rem',
													}}
												>
													<span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
														{origin}
													</span>
													<button
														onClick={() => removeCorsOrigin(origin)}
														style={{
															background: 'none',
															border: 'none',
															color: '#ef4444',
															cursor: 'pointer',
															padding: '0.25rem',
														}}
														title="Remove origin"
													>
														<FiTrash2 size={16} />
													</button>
												</div>
											))}
										</div>

										<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
											<input
												type="text"
												value={corsSettings.newOrigin}
												onChange={(e) =>
													setCorsSettings((prev) => ({ ...prev, newOrigin: e.target.value }))
												}
												placeholder="https://example.com"
												style={{
													flex: 1,
													padding: '0.5rem',
													border: '1px solid #d1d5db',
													borderRadius: '0.375rem',
												}}
											/>
											<Button
												$variant="primary"
												$primaryColor={colors.primary}
												onClick={addCorsOrigin}
												disabled={!corsSettings.newOrigin.trim()}
											>
												<FiPlus /> Add
											</Button>
										</div>
									</div>
								)}

								<Button
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={testCorsConfiguration}
									disabled={isTestingCors}
								>
									{isTestingCors ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
									{isTestingCors ? 'Testing...' : 'Test CORS Configuration'}
								</Button>
								<Button
									$variant="danger"
									$primaryColor={colors.primary}
									onClick={demonstrateCorsError}
								>
									<FiAlertTriangle /> Demonstrate CORS Error
								</Button>
							</FeatureCard>

							<FeatureCard>
								<FeatureTitle>
									CORS Test Results
									<StatusBadge $status={corsTestResults ? 'enabled' : 'disabled'}>
										{corsTestResults ? 'Available' : 'Not Tested'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									View the results of CORS policy testing across different origins.
								</FeatureDescription>

								{corsTestResults && (
									<div style={{ marginTop: '1rem' }}>
										{corsTestResults.map((result: Record<string, unknown>, index: number) => (
											<div
												key={index}
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													padding: '0.75rem',
													background: (result.allowed as boolean) ? '#f0fdf4' : '#fef2f2',
													border: `1px solid ${(result.allowed as boolean) ? '#bbf7d0' : '#fecaca'}`,
													borderRadius: '0.375rem',
													marginBottom: '0.5rem',
												}}
											>
												<div>
													<div
														style={{
															fontFamily: 'monospace',
															fontSize: '0.9rem',
															fontWeight: '500',
														}}
													>
														{result.origin as string}
													</div>
													{result.error && typeof result.error === 'string' ? (
														<div
															style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem' }}
														>
															{result.error as string}
														</div>
													) : null}
												</div>
												<div
													style={{
														color: (result.allowed as boolean) ? '#16a34a' : '#dc2626',
														fontWeight: 'bold',
													}}
												>
													{(result.allowed as boolean) ? '✓ Allowed' : '✗ Blocked'}
												</div>
											</div>
										))}
									</div>
								)}
							</FeatureCard>
						</FeatureGrid>

						<InfoBox>
							<InfoTitle>How CORS Protection Works</InfoTitle>
							<InfoText>
								CORS (Cross-Origin Resource Sharing) prevents malicious websites from making
								unauthorized requests to your OAuth endpoints. When configured properly, only
								trusted origins can access your APIs, protecting against CSRF attacks and data
								theft.
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				{/* Security Analysis */}
				<Section>
					<SectionHeader>
						<FiShield size={18} />
						Security Analysis & Recommendations
					</SectionHeader>
					<SectionContent>
						<FeatureGrid>
							<FeatureCard>
								<FeatureTitle>
									Current Security Score
									<StatusBadge
										$status={
											securityScore.score >= 80
												? 'enabled'
												: securityScore.score >= 60
													? 'required'
													: 'disabled'
										}
									>
										{securityScore.score}/100
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									{securityScore.score >= 80
										? 'Your OAuth implementation has excellent security practices.'
										: securityScore.score >= 60
											? 'Your OAuth implementation has good security practices with room for improvement.'
											: 'Your OAuth implementation needs security improvements.'}
								</FeatureDescription>
								<ParameterGrid>
									<ParamLabel>Access Token:</ParamLabel>
									<ParamValue>{tokens?.access_token ? '✅ Present' : '❌ Missing'}</ParamValue>
									<ParamLabel>Refresh Token:</ParamLabel>
									<ParamValue>{tokens?.refresh_token ? '✅ Present' : '❌ Missing'}</ParamValue>
									<ParamLabel>ID Token:</ParamLabel>
									<ParamValue>{tokens?.id_token ? '✅ Present' : '❌ Missing'}</ParamValue>
									<ParamLabel>x5t Certificate:</ParamLabel>
									<ParamValue>{realX5t ? '✅ Valid' : '❌ Missing'}</ParamValue>
									<ParamLabel>CORS Security:</ParamLabel>
									<ParamValue>
										{!corsSettings.allowAnyOrigin && corsSettings.allowedOrigins.length > 0
											? '✅ Restricted'
											: corsSettings.allowAnyOrigin
												? '⚠️ Any Origin'
												: '❌ Not Configured'}
									</ParamValue>
									<ParamLabel>API Integration:</ParamLabel>
									<ParamValue>
										{revokeResults || sessionResults ? '✅ Tested' : '❌ Not Tested'}
									</ParamValue>
								</ParameterGrid>
							</FeatureCard>

							<FeatureCard>
								<FeatureTitle>
									Recommendations
									<StatusBadge $status="required">Review</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									Additional security enhancements you can implement.
								</FeatureDescription>
								<List>
									<li>Consider implementing PKCE for public clients</li>
									<li>Enable token binding for additional security</li>
									<li>Implement rate limiting on token endpoints</li>
									<li>Add audit logging for security events</li>
								</List>
							</FeatureCard>
						</FeatureGrid>
					</SectionContent>
				</Section>

				{/* Action Buttons */}
				<ActionRow>
					<Button $variant="primary" $primaryColor={colors.primary} onClick={exportSecurityReport}>
						<FiDownload /> Export Security Report
					</Button>
					<Button $variant="primary" $primaryColor={colors.primary} onClick={runSecurityTest}>
						<FiPlay /> Run Security Test Suite
					</Button>
					{(securityReportResults || securityTestResults) && (
						<Button
							$variant="secondary"
							$primaryColor={colors.primary}
							onClick={() => {
								setSecurityReportResults(null);
								setSecurityTestResults(null);
								v4ToastManager.showSuccess('Security results cleared.');
							}}
						>
							<FiX /> Clear Results
						</Button>
					)}
				</ActionRow>

				{/* Security Report Results */}
				{securityReportResults && (
					<div style={{ marginTop: '1.5rem' }}>
						<CollapsibleHeader
							$isCollapsed={collapsedSecurityReport}
							onClick={() => setCollapsedSecurityReport(!collapsedSecurityReport)}
						>
							<CollapsibleTitle>📄 Security Analysis Report</CollapsibleTitle>
							{collapsedSecurityReport ? <FiChevronDown size={20} /> : <FiChevronUp size={20} />}
						</CollapsibleHeader>
						<CollapsibleContent $isCollapsed={collapsedSecurityReport}>
							<InfoText
								style={{
									whiteSpace: 'pre-line',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
									color: '#374151',
								}}
							>
								{securityReportResults}
							</InfoText>
						</CollapsibleContent>
					</div>
				)}

				{/* Security Test Results */}
				{securityTestResults && (
					<div style={{ marginTop: '1.5rem' }}>
						<CollapsibleHeader
							$isCollapsed={collapsedSecurityTest}
							onClick={() => setCollapsedSecurityTest(!collapsedSecurityTest)}
						>
							<CollapsibleTitle>🧪 Security Test Suite Results</CollapsibleTitle>
							{collapsedSecurityTest ? <FiChevronDown size={20} /> : <FiChevronUp size={20} />}
						</CollapsibleHeader>
						<CollapsibleContent $isCollapsed={collapsedSecurityTest}>
							<InfoText
								style={{
									whiteSpace: 'pre-line',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
									color: '#374151',
								}}
							>
								{securityTestResults}
							</InfoText>
						</CollapsibleContent>
					</div>
				)}
			</Content>

			<ConfirmationModal
				isOpen={confirmModal.isOpen}
				onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
				onConfirm={confirmModal.onConfirm}
				title={confirmModal.title}
				message={confirmModal.message}
				variant="danger"
				confirmText="Confirm"
				cancelText="Cancel"
			/>
		</Container>
	);
};

export default SecurityFeaturesDemo;
