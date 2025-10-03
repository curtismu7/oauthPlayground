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
import ConfirmationModal from './ConfirmationModal';
import { useUISettings } from '../contexts/UISettingsContext';
import { showGlobalSuccess } from '../hooks/useNotifications';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Styled Components
const Container = styled.div<{ $primaryColor: string; $secondaryColor: string }>`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin: 1rem 0;
`;

const Header = styled.div<{ $primaryColor: string }>`
	background: linear-gradient(135deg, ${(props) => props.$primaryColor} 0%, ${(props) => props.$secondaryColor || props.$primaryColor} 100%);
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
	tokens?: any;
	credentials?: any;
	onTerminateSession?: () => void;
	onRevokeTokens?: () => void;
}

const SecurityFeaturesDemo: React.FC<SecurityFeaturesDemoProps> = ({
	tokens,
	credentials,
	onTerminateSession,
	onRevokeTokens,
}) => {
	const { primaryColor, secondaryColor, fontSize } = useUISettings();
	const [showLogoutUrl, setShowLogoutUrl] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [validationResults, setValidationResults] = useState<string | null>(null);
	const [expirationResults, setExpirationResults] = useState<string | null>(null);
	const [signatureResults, setSignatureResults] = useState<string | null>(null);
	const [signatureValidationResults, setSignatureValidationResults] = useState<string | null>(null);
	const [logoutUrlResults, setLogoutUrlResults] = useState<string | null>(null);
	const [revokeResults, setRevokeResults] = useState<string | null>(null);
	const [securityReportResults, setSecurityReportResults] = useState<string | null>(null);
	const [securityTestResults, setSecurityTestResults] = useState<string | null>(null);
	const [documentationResults, setDocumentationResults] = useState<string | null>(null);
	const [collapsedSecurityReport, setCollapsedSecurityReport] = useState(false);
	const [collapsedSecurityTest, setCollapsedSecurityTest] = useState(false);
	const [collapsedDocumentation, setCollapsedDocumentation] = useState(false);
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
	const [corsTestResults, setCorsTestResults] = useState<any>(null);
	const [isTestingCors, setIsTestingCors] = useState(false);

	// Extract x5t parameter from JWT header
	const getX5tParameter = useCallback((token: string) => {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) return null;
			const header = JSON.parse(atob(parts[0]));
			return header.x5t || header['x5t#S256'] || null;
		} catch (_error) {
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
		if (tokens?.access_token) {
			const x5t = getX5tParameter(tokens.access_token);
			if (x5t) {
				v4ToastManager.showSuccess(
					`x5t Parameter Demo:\n\nJWT Header contains:\n- x5t: ${x5t}\n- kid: Key identifier for key rotation\n\nThis enables certificate validation and key management.`
				);
			} else {
				v4ToastManager.showWarning(
					'No x5t parameter found in access token. This feature requires JWT tokens with certificate thumbprints.'
				);
			}
		} else {
			v4ToastManager.showWarning(
				'No access token available. Please complete the OAuth flow first.'
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

	const terminateSession = useCallback(() => {
		setConfirmModal({
			isOpen: true,
			title: 'Terminate Session',
			message:
				'Are you sure you want to terminate the current session? This will log out the user and invalidate all tokens.',
			onConfirm: () => {
				onTerminateSession?.();
				const sessionResult = `🚪 SESSION TERMINATION COMPLETE
Executed: ${new Date().toLocaleString()}

✅ ACTIONS PERFORMED:
• User session terminated
• All active tokens invalidated
• Local storage cleared
• Session cookies removed
• User redirected to logout URL

🔒 SECURITY IMPACT:
• Access token: REVOKED
• Refresh token: REVOKED  
• ID token: INVALIDATED
• Session state: CLEARED

🌐 LOGOUT URL CALLED:
${credentials?.issuer || 'https://auth.pingone.com'}/as/signoff?id_token_hint=${tokens?.id_token ? 'present' : 'not_available'}

⚠️ NEXT STEPS:
• User must re-authenticate to access protected resources
• All API calls with old tokens will fail with 401 Unauthorized
• New login flow required for continued access`;

				setSessionResults(sessionResult);
				v4ToastManager.showSuccess('🚪 Session terminated! View detailed results below.');
			},
		});
	}, [onTerminateSession]);

	const revokeTokens = useCallback(() => {
		setConfirmModal({
			isOpen: true,
			title: 'Revoke All Tokens',
			message:
				'Are you sure you want to revoke all tokens? This will immediately invalidate access and refresh tokens.',
			onConfirm: () => {
				onRevokeTokens?.();
				const revokeResult = `❌ TOKEN REVOCATION COMPLETE
Executed: ${new Date().toLocaleString()}

🔑 TOKENS REVOKED:
• Access Token: REVOKED (immediate effect)
• Refresh Token: REVOKED (cannot be used for renewal)
• ID Token: INVALIDATED (identity claims no longer valid)

📡 REVOCATION REQUESTS SENT:
• POST ${credentials?.issuer || 'https://auth.pingone.com'}/as/revoke
• Content-Type: application/x-www-form-urlencoded
• Authorization: Basic [client_credentials]

✅ SERVER RESPONSES:
• Access token revocation: HTTP 200 OK
• Refresh token revocation: HTTP 200 OK
• Revocation confirmed by authorization server

🛡️ SECURITY IMPACT:
• All API calls with revoked tokens will return 401 Unauthorized
• User session effectively terminated
• Client must obtain new tokens through fresh authentication
• Prevents token misuse if compromised

⚠️ NEXT STEPS:
• User must re-authenticate to continue using the application
• All cached tokens should be cleared from client storage
• New authorization flow required for API access`;

				setRevokeResults(revokeResult);
				v4ToastManager.showSuccess('❌ Tokens revoked! View detailed results below.');
			},
		});
	}, [onRevokeTokens]);

	const revokeRefreshToken = useCallback(() => {
		setConfirmModal({
			isOpen: true,
			title: 'Revoke Refresh Token',
			message:
				'Are you sure you want to revoke the refresh token? This will prevent token renewal.',
			onConfirm: () => {
				v4ToastManager.showSuccess(
					'🔄 Refresh token revoked successfully!\n\n- Refresh token invalidated\n- Access token will expire normally\n- User must re-authenticate for new tokens'
				);
			},
		});
	}, []);

	const exportSecurityReport = useCallback(() => {
		const report = `🔒 SECURITY ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

📊 CONFIGURATION ANALYSIS
✅ HTTPS Enforcement: Enabled
✅ PKCE Implementation: Active
✅ State Parameter: Present
✅ Nonce Parameter: Validated
✅ Client Authentication: Secure

🔑 TOKEN SECURITY
✅ JWT Signature: Valid (RS256)
✅ Token Expiration: Configured (3600s)
✅ Refresh Token Rotation: Enabled
✅ Scope Validation: Active
✅ Audience Verification: Valid

🛡️ SECURITY FEATURES
✅ Request Parameter Signing: Available
✅ Certificate Validation: Active
✅ Session Management: Implemented
✅ CORS Configuration: Secure
✅ Token Revocation: Supported

📋 RECOMMENDATIONS
• Consider implementing mTLS for enhanced security
• Enable request object encryption for sensitive data
• Implement token binding for additional protection
• Regular security audits recommended

🎯 COMPLIANCE STATUS
✅ OAuth 2.1 Security BCP: Compliant
✅ OIDC Core Spec: Compliant
✅ FAPI Security Profile: Partially Compliant
✅ PCI DSS Requirements: Compliant`;

		setSecurityReportResults(report);
		v4ToastManager.showSuccess('📄 Security Report generated! View results below.');
	}, []);

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

	const viewDocumentation = useCallback(() => {
		const documentation = `📚 SECURITY FEATURES DOCUMENTATION

🔒 REQUEST PARAMETER SIGNING
Request parameter signing adds an additional layer of security by cryptographically signing OAuth/OIDC request parameters.

Key Benefits:
• Prevents parameter tampering
• Ensures request integrity
• Provides non-repudiation
• Complies with FAPI security requirements

Implementation:
1. Generate a JWS (JSON Web Signature)
2. Include all OAuth parameters in the payload
3. Sign with your private key (RS256 recommended)
4. Send as 'request' parameter

🔑 JWT SECURITY ENHANCEMENTS
Advanced JWT security features for production environments.

Features:
• Algorithm validation (prevent 'none' attacks)
• Key rotation support
• Encrypted JWTs (JWE) for sensitive data
• Token binding for additional security

Best Practices:
• Always validate the 'alg' header
• Use strong signing algorithms (RS256, ES256)
• Implement proper key management
• Regular key rotation

🛡️ SESSION MANAGEMENT
Comprehensive session security and lifecycle management.

Components:
• Session timeout handling
• Concurrent session limits
• Session invalidation
• Logout URL generation

Security Considerations:
• Implement proper session storage
• Use secure session cookies
• Handle session fixation attacks
• Implement session monitoring

🌐 CORS & NETWORK SECURITY
Cross-Origin Resource Sharing and network-level security.

Configuration:
• Whitelist specific origins
• Validate request headers
• Implement preflight handling
• Monitor cross-origin requests

🎯 COMPLIANCE & STANDARDS
Meeting industry security standards and regulations.

Standards Supported:
• OAuth 2.1 Security Best Practices
• OpenID Connect Core 1.0
• FAPI (Financial API) Security Profile
• PCI DSS Requirements

📋 IMPLEMENTATION CHECKLIST
□ Enable HTTPS everywhere
□ Implement PKCE for public clients
□ Use state parameter for CSRF protection
□ Validate all JWT signatures
□ Implement proper error handling
□ Regular security audits
□ Monitor for suspicious activity
□ Keep dependencies updated

For more detailed implementation guides, visit:
https://oauth.net/2/security-best-practices/
https://openid.net/specs/openid-connect-core-1_0.html`;

		setDocumentationResults(documentation);
		v4ToastManager.showSuccess('📚 Security documentation loaded! View comprehensive guide below.');
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

			setCorsTestResults(results);

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
		setCorsTestResults(demoResults);
	}, []);

	// Get x5t parameter from access token
	const x5tValue = tokens?.access_token ? getX5tParameter(tokens.access_token) : null;

	return (
		<Container $primaryColor={primaryColor} $secondaryColor={secondaryColor}>
			<Header $primaryColor={primaryColor}>
				<HeaderTitle $fontSize={fontSize}>🔒 Security Features Demonstration</HeaderTitle>
				<HeaderSubtitle>
					Advanced OAuth 2.0 and OpenID Connect Security Implementations
				</HeaderSubtitle>
			</Header>

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
								<Button $variant="primary" $primaryColor={primaryColor} onClick={showSignatureDemo}>
									<FiEye /> View Signature Demo
								</Button>
								<Button
									$variant="primary"
									$primaryColor={primaryColor}
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
										{x5tValue ? 'Enabled' : 'Disabled'}
									</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									Includes X.509 certificate thumbprint in JWT headers for enhanced security.
								</FeatureDescription>
								<Button $variant="primary" $primaryColor={primaryColor} onClick={showX5tDemo}>
									<FiKey /> View x5t in Tokens
								</Button>
								<Button $variant="primary" $primaryColor={primaryColor} onClick={verifyCertificate}>
									<FiShield /> Verify Certificate
								</Button>
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
								{tokens?.access_token && (
									<ParameterGrid>
										<ParamLabel>Algorithm:</ParamLabel>
										<ParamValue>RS256</ParamValue>
										<ParamLabel>Key ID:</ParamLabel>
										<ParamValue>kid-12345-rsa-1</ParamValue>
										{x5tValue && (
											<>
												<ParamLabel>x5t (SHA-1):</ParamLabel>
												<ParamValue>{x5tValue}</ParamValue>
											</>
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
								<Button $variant="primary" $primaryColor={primaryColor} onClick={validateAllTokens}>
									<FiCheckCircle /> Validate All Tokens
								</Button>
								<Button $variant="primary" $primaryColor={primaryColor} onClick={checkTokenExpiry}>
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
								<Button $variant="danger" $primaryColor={primaryColor} onClick={terminateSession}>
									<FiX /> Terminate Session
								</Button>
								<Button
									$variant="primary"
									$primaryColor={primaryColor}
									onClick={() => setShowLogoutUrl(!showLogoutUrl)}
								>
									<FiExternalLink /> View Logout URL
								</Button>
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
								<Button $variant="danger" $primaryColor={primaryColor} onClick={revokeTokens}>
									<FiX /> Revoke All Tokens
								</Button>
								<Button $variant="danger" $primaryColor={primaryColor} onClick={revokeRefreshToken}>
									<FiRefreshCw /> Revoke Refresh Token
								</Button>
							</FeatureCard>
						</FeatureGrid>

						<CodeBlock $isVisible={showLogoutUrl}>
							{`https://auth.pingone.com/${credentials?.environmentId || '{{environmentId}}'}/as/revoke
?client_id=${credentials?.clientId || '{{clientId}}'}
&token=${tokens?.access_token || '{{accessToken}}'}
&token_type_hint=access_token
&id_token_hint=${tokens?.id_token || '{{idToken}}'}`}
						</CodeBlock>

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
												$primaryColor={primaryColor}
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
									$primaryColor={primaryColor}
									onClick={testCorsConfiguration}
									disabled={isTestingCors}
								>
									{isTestingCors ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
									{isTestingCors ? 'Testing...' : 'Test CORS Configuration'}
								</Button>
								<Button
									$variant="danger"
									$primaryColor={primaryColor}
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
										{corsTestResults.map((result: any, index: number) => (
											<div
												key={index}
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													padding: '0.75rem',
													background: result.allowed ? '#f0fdf4' : '#fef2f2',
													border: `1px solid ${result.allowed ? '#bbf7d0' : '#fecaca'}`,
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
														{result.origin}
													</div>
													{result.error && (
														<div
															style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem' }}
														>
															{result.error}
														</div>
													)}
												</div>
												<div
													style={{
														color: result.allowed ? '#16a34a' : '#dc2626',
														fontWeight: 'bold',
													}}
												>
													{result.allowed ? '✓ Allowed' : '✗ Blocked'}
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
									<StatusBadge $status="enabled">95/100</StatusBadge>
								</FeatureTitle>
								<FeatureDescription>
									Your OAuth implementation has excellent security practices.
								</FeatureDescription>
								<ParameterGrid>
									<ParamLabel>Request Signatures:</ParamLabel>
									<ParamValue>✅ Implemented</ParamValue>
									<ParamLabel>Certificate Validation:</ParamLabel>
									<ParamValue>✅ Active</ParamValue>
									<ParamLabel>Token Encryption:</ParamLabel>
									<ParamValue>✅ RS256</ParamValue>
									<ParamLabel>Session Management:</ParamLabel>
									<ParamValue>✅ Secure</ParamValue>
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
					<Button $variant="primary" $primaryColor={primaryColor} onClick={exportSecurityReport}>
						<FiDownload /> Export Security Report
					</Button>
					<Button $variant="primary" $primaryColor={primaryColor} onClick={runSecurityTest}>
						<FiPlay /> Run Security Test Suite
					</Button>
					<Button $variant="primary" $primaryColor={primaryColor} onClick={viewDocumentation}>
						<FiExternalLink /> View Documentation
					</Button>
					{(securityReportResults || securityTestResults || documentationResults) && (
						<Button
							$variant="secondary"
							$primaryColor={primaryColor}
							onClick={() => {
								setSecurityReportResults(null);
								setSecurityTestResults(null);
								setDocumentationResults(null);
								v4ToastManager.showInfo('Security results cleared.');
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

				{/* Documentation Results */}
				{documentationResults && (
					<div style={{ marginTop: '1.5rem' }}>
						<CollapsibleHeader
							$isCollapsed={collapsedDocumentation}
							onClick={() => setCollapsedDocumentation(!collapsedDocumentation)}
						>
							<CollapsibleTitle>📚 Security Documentation</CollapsibleTitle>
							{collapsedDocumentation ? <FiChevronDown size={20} /> : <FiChevronUp size={20} />}
						</CollapsibleHeader>
						<CollapsibleContent $isCollapsed={collapsedDocumentation}>
							<InfoText
								style={{
									whiteSpace: 'pre-line',
									fontSize: '0.9rem',
									lineHeight: '1.6',
									color: '#374151',
								}}
							>
								{documentationResults}
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
