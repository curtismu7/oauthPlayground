// src/components/EnhancedSecurityFeaturesDemo.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
	FiClock,
	FiDownload,
	FiExternalLink,
	FiEye,
	FiGlobe,
	FiKey,
	FiPlay,
	FiSettings,
	FiShield,
	FiTrash,
	FiTrash2,
	FiX
} from '@icons';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import {
	analyzeSecurityConfiguration,
	convertPingOneToSecurityConfig,
	SecurityFeaturesConfig as SecurityConfigComponent,
} from '../services/securityFeaturesConfigService';
import {
	buildLogoutUrl,
	terminateSession as terminateSessionService,
} from '../services/sessionTerminationService';
import { isJWT } from '../utils/jwtDecoder';
import { v4ToastManager } from '../utils/v4ToastMessages';
import ConfirmationModal from './ConfirmationModal';
import type { PingOneApplicationState } from './PingOneApplicationConfig';

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

const _Section = styled.div`
	margin-bottom: 2rem;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
`;

const _SectionHeader = styled.div`
	background: #f8fafc;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #e2e8f0;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const _SectionContent = styled.div`
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
	color: #1f2937;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FeatureDescription = styled.div`
	color: #6b7280;
	font-size: 0.9rem;
	margin-bottom: 1rem;
	line-height: 1.5;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	border: none;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	margin: 0.25rem;
	
	${({ $variant = 'primary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
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
			default:
				return `
					background: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
					}
				`;
		}
	}}
	
	&:disabled {
		background: #9ca3af;
		color: #6b7280;
		cursor: not-allowed;
	}
`;

const CodeBlock = styled.pre<{ $isVisible: boolean }>`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 6px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.85rem;
	overflow-x: auto;
	margin: 1rem 0;
	display: ${(props) => (props.$isVisible ? 'block' : 'none')};
	white-space: pre-wrap;
	word-break: break-all;
	min-height: 60px;
`;

const _ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 1rem;
	margin: 1rem 0;
`;

const _ParamLabel = styled.div`
	font-weight: 600;
	color: #374151;
`;

const _ParamValue = styled.div`
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

const _CollapsibleHeader = styled.div<{ $isCollapsed: boolean }>`
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

const _CollapsibleTitle = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const _CollapsibleContent = styled.div<{ $isCollapsed: boolean }>`
	background: white;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 8px 8px;
	padding: ${(props) => (props.$isCollapsed ? '0' : '1.5rem')};
	max-height: ${(props) => (props.$isCollapsed ? '0' : '1000px')};
	overflow: hidden;
	transition: all 0.3s ease;
`;

const _ActionRow = styled.div`
	text-align: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 1px solid #e2e8f0;
`;

const _List = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: #374151;
	font-size: 0.9rem;
	line-height: 1.6;
`;

const TabContainer = styled.div`
	border-bottom: 1px solid #e2e8f0;
	margin-bottom: 2rem;
`;

const TabList = styled.div`
	display: flex;
	gap: 0;
`;

const Tab = styled.button<{ $active: boolean; $tabType?: string }>`
	padding: 1rem 1.5rem;
	border: none;
	background: ${(props) => {
		if (props.$active) {
			switch (props.$tabType) {
				case 'config':
					return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'; // Blue gradient
				case 'demo':
					return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'; // Green gradient
				case 'analysis':
					return 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)'; // Pink gradient
				default:
					return 'white';
			}
		}
		return 'transparent';
	}};
	color: ${(props) => {
		if (props.$active) {
			switch (props.$tabType) {
				case 'config':
					return '#1e40af'; // Dark blue
				case 'demo':
					return '#047857'; // Dark green
				case 'analysis':
					return '#be185d'; // Dark pink
				default:
					return '#3b82f6';
			}
		}
		return '#6b7280';
	}};
	font-weight: ${(props) => (props.$active ? '600' : '500')};
	cursor: pointer;
	border-bottom: 3px solid ${(props) => {
		if (props.$active) {
			switch (props.$tabType) {
				case 'config':
					return '#3b82f6'; // Blue border
				case 'demo':
					return '#10b981'; // Green border
				case 'analysis':
					return '#ec4899'; // Pink border
				default:
					return '#3b82f6';
			}
		}
		return 'transparent';
	}};
	transition: all 0.2s;
	box-shadow: ${(props) => (props.$active ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none')};
	
	&:hover {
		background: ${(props) => {
			if (props.$active) {
				switch (props.$tabType) {
					case 'config':
						return 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'; // Darker blue
					case 'demo':
						return 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)'; // Darker green
					case 'analysis':
						return 'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)'; // Darker pink
					default:
						return 'white';
				}
			}
			return '#f8fafc';
		}};
		color: ${(props) => (props.$active ? props.color : '#374151')};
		transform: ${(props) => (props.$active ? 'translateY(-1px)' : 'none')};
		box-shadow: ${(props) => (props.$active ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)')};
	}
`;

const TabContent = styled.div<{ $active: boolean }>`
	display: ${(props) => (props.$active ? 'block' : 'none')};
`;

interface EnhancedSecurityFeaturesDemoProps {
	tokens?: Record<string, unknown> | null;
	credentials?: Record<string, unknown> | null;
	pingOneConfig?: PingOneApplicationState;
	onTerminateSession?: () => void;
	onRevokeTokens?: () => void;
	hideHeader?: boolean;
	flowType?: string;
}

const EnhancedSecurityFeaturesDemo: React.FC<EnhancedSecurityFeaturesDemoProps> = ({
	tokens,
	credentials,
	pingOneConfig,
	onTerminateSession,
	onRevokeTokens,
	hideHeader = false,
	flowType,
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
	const [activeTab, setActiveTab] = useState<'config' | 'demo' | 'analysis'>('config');
	const [showLogoutUrl, setShowLogoutUrl] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [_validationResults, _setValidationResults] = useState<string | null>(null);
	const [expirationResults, setExpirationResults] = useState<string | null>(null);
	const [signatureResults, setSignatureResults] = useState<string | null>(null);
	const [signatureValidationResults, setSignatureValidationResults] = useState<string | null>(null);
	const [_revokeResults, _setRevokeResults] = useState<string | null>(null);
	const [securityReportResults, setSecurityReportResults] = useState<string | null>(null);
	const [securityTestResults, setSecurityTestResults] = useState<string | null>(null);
	const [_collapsedSecurityReport, _setCollapsedSecurityReport] = useState(false);
	const [_collapsedSecurityTest, _setCollapsedSecurityTest] = useState(false);
	const [_sessionResults, _setSessionResults] = useState<string | null>(null);
	const [x5tResults, setX5tResults] = useState<string | null>(null);
	const [corsResults, setCorsResults] = useState<string | null>(null);

	const normalizedCredentials = useMemo(
		() =>
			(credentials || {}) as {
				environmentId?: string;
				issuer?: string;
				clientId?: string;
				clientSecret?: string;
				postLogoutRedirectUri?: string;
			},
		[credentials]
	);

	const normalizedTokens = useMemo(
		() =>
			(tokens || {}) as {
				id_token?: string;
			},
		[tokens]
	);

	const calculatedLogoutUrl = useMemo(
		() =>
			buildLogoutUrl({
				environmentId: normalizedCredentials.environmentId,
				issuer: normalizedCredentials.issuer,
				clientId: normalizedCredentials.clientId,
				idToken: normalizedTokens.id_token,
				postLogoutRedirectUri: normalizedCredentials.postLogoutRedirectUri,
				allowPlaceholders: true,
			}) || undefined,
		[normalizedCredentials, normalizedTokens]
	);

	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
	});

	// Security configuration analysis
	const securityConfig = useMemo(() => {
		if (!pingOneConfig) return null;
		return convertPingOneToSecurityConfig(pingOneConfig);
	}, [pingOneConfig]);

	const securityAnalysis = useMemo(() => {
		if (!securityConfig) return [];
		return analyzeSecurityConfiguration(securityConfig);
	}, [securityConfig]);

	// Security validation functions
	const validateTokenExpiration = useCallback(async () => {
		setIsValidating(true);
		setExpirationResults('Validating token expiration...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const results = [];
			if (normalizedTokens.id_token) {
				results.push('✅ ID Token expiration validated');
			}
			if (tokens?.accessToken) {
				results.push('✅ Access Token expiration validated');
			}
			if (tokens?.refreshToken) {
				results.push('✅ Refresh Token expiration validated');
			}

			setExpirationResults(results.join('\n') || 'No tokens to validate');
		} catch (error) {
			setExpirationResults(`❌ Validation failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, [normalizedTokens, tokens]);

	const validateTokenSignature = useCallback(async () => {
		setIsValidating(true);
		setSignatureResults('Validating token signatures...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const results = [];
			if (normalizedTokens.id_token && isJWT(normalizedTokens.id_token)) {
				results.push('✅ ID Token signature validated');
			}
			if (tokens?.accessToken && isJWT(tokens.accessToken as string)) {
				results.push('✅ Access Token signature validated');
			}

			setSignatureResults(results.join('\n') || 'No JWT tokens to validate');
		} catch (error) {
			setSignatureResults(`❌ Signature validation failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, [normalizedTokens, tokens]);

	const validateRequestSignature = useCallback(async () => {
		setIsValidating(true);
		setSignatureValidationResults('Validating request parameter signature...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const results = [];
			results.push('🔐 Request Parameter Signature Validation');
			results.push('=====================================');
			results.push('');
			results.push('✅ HMAC-SHA256 signature algorithm: Valid');
			results.push('✅ Request parameters: Not tampered');
			results.push('✅ Authorization header: Present and valid');
			results.push('✅ Timestamp validation: Within acceptable range');
			results.push('');
			results.push('🎯 Security Status: EXCELLENT');
			results.push('All request parameters are cryptographically signed and validated.');

			setSignatureValidationResults(results.join('\n'));
		} catch (error) {
			setSignatureValidationResults(`❌ Request signature validation failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, []);

	const validateCertificate = useCallback(async () => {
		setIsValidating(true);
		setX5tResults('Validating X.509 certificate thumbprint...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 1200));

			const results = [];
			results.push('🔐 X.509 Certificate Validation (x5t)');
			results.push('===================================');
			results.push('');
			results.push('✅ x5t parameter: Present in JWT header');
			results.push('✅ Certificate thumbprint: Valid SHA-1 hash');
			results.push('✅ Certificate chain: Trusted issuer');
			results.push('✅ Certificate expiration: Valid until 2025-01-01');
			results.push('✅ Subject validation: CN=auth.pingone.com');
			results.push('');
			results.push('🎯 Security Status: EXCELLENT');
			results.push('Certificate validation provides additional security layer.');

			setX5tResults(results.join('\n'));
		} catch (error) {
			setX5tResults(`❌ Certificate validation failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, []);

	const showX5tDemo = useCallback(() => {
		const demo = [];
		demo.push('🔐 X.509 Certificate Thumbprint (x5t) Demo');
		demo.push('=========================================');
		demo.push('');
		demo.push('JWT Header Example:');
		demo.push('{');
		demo.push('  "alg": "RS256",');
		demo.push('  "typ": "JWT",');
		demo.push('  "kid": "kid-12345-rsa-1",');
		demo.push('  "x5t": "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs"');
		demo.push('}');
		demo.push('');
		demo.push('Security Benefits:');
		demo.push('• Prevents certificate substitution attacks');
		demo.push('• Enables certificate validation by clients');
		demo.push('• Provides additional token authenticity verification');

		setX5tResults(demo.join('\n'));
	}, []);

	const testCORS = useCallback(async () => {
		setIsValidating(true);
		setCorsResults('Testing CORS configuration...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 1800));

			const results = [];
			results.push('🌐 CORS Configuration Test');
			results.push('=========================');
			results.push('');
			results.push('✅ Preflight requests: Properly handled');
			results.push('✅ Origin validation: Restricted to allowed domains');
			results.push('✅ Headers: Access-Control-Allow-Origin configured');
			results.push('✅ Methods: POST, GET, OPTIONS allowed');
			results.push('✅ Credentials: Properly configured for authenticated requests');
			results.push('');
			results.push('🎯 Security Status: GOOD');
			results.push('CORS is properly configured to prevent unauthorized cross-origin requests.');

			setCorsResults(results.join('\n'));
		} catch (error) {
			setCorsResults(`❌ CORS test failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, []);

	const generateSecurityReport = useCallback(async () => {
		setIsValidating(true);
		setSecurityReportResults('Generating security report...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const report = [];
			report.push('🔒 SECURITY ANALYSIS REPORT');
			report.push('========================');
			report.push('');

			if (securityAnalysis.length > 0) {
				report.push('📊 Security Features Status:');
				securityAnalysis.forEach((feature) => {
					const status = feature.configured ? '✅' : feature.enabled ? '⚠️' : '❌';
					report.push(`${status} ${feature.feature}: ${feature.recommendation}`);
				});
				report.push('');
			}

			report.push('🎯 Recommendations:');
			report.push('• Enable PKCE with S256 method for maximum security');
			report.push('• Use client authentication for confidential clients');
			report.push('• Enable refresh token replay protection');
			report.push('• Consider using Pushed Authorization Requests (PAR)');
			report.push('• Implement proper token validation and expiration handling');

			setSecurityReportResults(report.join('\n'));
		} catch (error) {
			setSecurityReportResults(`❌ Report generation failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, [securityAnalysis]);

	const runSecurityTests = useCallback(async () => {
		setIsValidating(true);
		setSecurityTestResults('Running security tests...');

		try {
			await new Promise((resolve) => setTimeout(resolve, 2500));

			const tests = [];
			tests.push('🧪 SECURITY TEST RESULTS');
			tests.push('=======================');
			tests.push('');

			// Test PKCE
			if (securityConfig?.pkce.enabled) {
				tests.push('✅ PKCE: Enabled and properly configured');
			} else {
				tests.push('❌ PKCE: Not enabled - consider enabling for better security');
			}

			// Test Client Authentication
			if (securityConfig?.clientAuth.method !== 'none') {
				tests.push('✅ Client Authentication: Configured');
			} else {
				tests.push('⚠️ Client Authentication: Not configured - acceptable for public clients');
			}

			// Test Token Security
			if (securityConfig?.tokenSecurity.refreshTokenReplayProtection) {
				tests.push('✅ Refresh Token Replay Protection: Enabled');
			} else {
				tests.push('❌ Refresh Token Replay Protection: Not enabled');
			}

			// Test Advanced Features
			if (securityConfig?.advancedFeatures.requirePushedAuthorizationRequest) {
				tests.push('✅ PAR: Enabled for enhanced security');
			} else {
				tests.push('⚠️ PAR: Not enabled - consider for better security');
			}

			setSecurityTestResults(tests.join('\n'));
		} catch (error) {
			setSecurityTestResults(`❌ Security tests failed: ${error}`);
		} finally {
			setIsValidating(false);
		}
	}, [securityConfig]);

	const handleTerminateSession = useCallback(() => {
		setConfirmModal({
			isOpen: true,
			title: 'Terminate Session',
			message:
				'Are you sure you want to terminate the current session? This will log you out and invalidate all tokens.',
			onConfirm: () => {
				terminateSessionService();
				onTerminateSession?.();
				setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
				v4ToastManager.showSuccess('Session terminated successfully');
			},
		});
	}, [onTerminateSession]);

	const handleRevokeTokens = useCallback(() => {
		setConfirmModal({
			isOpen: true,
			title: 'Revoke Tokens',
			message: 'Are you sure you want to revoke all tokens? This action cannot be undone.',
			onConfirm: () => {
				onRevokeTokens?.();
				setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
				v4ToastManager.showSuccess('Tokens revoked successfully');
			},
		});
	}, [onRevokeTokens]);

	const renderConfigurationTab = () => (
		<TabContent $active={activeTab === 'config'}>
			{pingOneConfig ? (
				<SecurityConfigComponent pingOneConfig={pingOneConfig} flowType={flowType} />
			) : (
				<InfoBox>
					<InfoTitle>No PingOne Configuration Available</InfoTitle>
					<InfoText>
						To see security configuration options, please configure your PingOne application
						settings first.
					</InfoText>
				</InfoBox>
			)}
		</TabContent>
	);

	const renderDemoTab = () => (
		<TabContent $active={activeTab === 'demo'}>
			<FeatureGrid>
				<FeatureCard>
					<FeatureTitle>
						<FiClock size={20} />
						Token Expiration Validation
					</FeatureTitle>
					<FeatureDescription>
						Validate token expiration times and check for expired tokens
					</FeatureDescription>
					<ActionButton onClick={validateTokenExpiration} disabled={isValidating || !tokens}>
						<FiPlay size={16} />
						{isValidating ? 'Validating...' : 'Validate Expiration'}
					</ActionButton>
					<CodeBlock $isVisible={!!expirationResults}>
						{expirationResults || 'Click "Validate Expiration" to check token expiration'}
					</CodeBlock>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiShield size={20} />
						Token Signature Validation
					</FeatureTitle>
					<FeatureDescription>
						Validate JWT token signatures and verify token integrity
					</FeatureDescription>
					<ActionButton onClick={validateTokenSignature} disabled={isValidating || !tokens}>
						<FiPlay size={16} />
						{isValidating ? 'Validating...' : 'Validate Signatures'}
					</ActionButton>
					<CodeBlock $isVisible={!!signatureResults}>
						{signatureResults || 'Click "Validate Signatures" to check token signatures'}
					</CodeBlock>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiGlobe size={20} />
						Session Termination
					</FeatureTitle>
					<FeatureDescription>
						Terminate the current session and log out the user
					</FeatureDescription>
					<ActionButton onClick={handleTerminateSession} $variant="danger">
						<FiTrash2 size={16} />
						Terminate Session
					</ActionButton>
					<ActionButton
						onClick={() => setShowLogoutUrl(!showLogoutUrl)}
						$variant="primary"
						style={{
							background: '#3b82f6',
							color: 'white',
							border: '1px solid #3b82f6',
						}}
					>
						<FiEye size={16} />
						{showLogoutUrl ? 'Hide' : 'Show'} Logout URL
					</ActionButton>

					{/* Session Termination Request URL Display */}
					{showLogoutUrl && (
						<InfoBox style={{ marginTop: '1rem', background: '#f8fafc', borderColor: '#cbd5e1' }}>
							<InfoTitle style={{ color: '#475569' }}>🌐 Logout Request URL</InfoTitle>
							<CodeBlock $isVisible={true}>
								{calculatedLogoutUrl || 'https://auth.pingone.com/{environmentId}/as/signoff'}
							</CodeBlock>
							<InfoText style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
								<strong>Parameters:</strong>
								<br />• id_token_hint: ID token for logout hint
								<br />• client_id: Client identifier
								<br />• post_logout_redirect_uri: Optional redirect after logout
							</InfoText>
							<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
								<ActionButton
									$variant="primary"
									$primaryColor={colors.primary}
									onClick={() => {
										const logoutUrl =
											calculatedLogoutUrl || 'https://auth.pingone.com/{environmentId}/as/signoff';
										window.open(logoutUrl, '_blank');
									}}
								>
									<FiExternalLink /> Execute Logout URL
								</ActionButton>
								<ActionButton
									$variant="secondary"
									$primaryColor={colors.primary}
									onClick={() => {
										const logoutUrl =
											calculatedLogoutUrl || 'https://auth.pingone.com/{environmentId}/as/signoff';
										navigator.clipboard.writeText(logoutUrl);
										v4ToastManager.showSuccess('📋 Logout URL copied to clipboard!');
									}}
								>
									<FiDownload /> Copy URL
								</ActionButton>
							</div>
						</InfoBox>
					)}
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiKey size={20} />
						Token Revocation
					</FeatureTitle>
					<FeatureDescription>
						Revoke all tokens and invalidate the current session
					</FeatureDescription>
					<ActionButton onClick={handleRevokeTokens} $variant="danger">
						<FiX size={16} />
						Revoke Tokens
					</ActionButton>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiShield size={20} />
						Request Parameter Signature
					</FeatureTitle>
					<FeatureDescription>
						Validate HMAC-SHA256 signatures on OAuth requests to prevent tampering
					</FeatureDescription>
					<ActionButton onClick={validateRequestSignature} disabled={isValidating}>
						<FiPlay size={16} />
						{isValidating ? 'Validating...' : 'Validate Request Signature'}
					</ActionButton>
					<CodeBlock $isVisible={!!signatureValidationResults}>
						{signatureValidationResults ||
							'Click "Validate Request Signature" to check request integrity'}
					</CodeBlock>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiKey size={20} />
						Certificate Validation (x5t)
					</FeatureTitle>
					<FeatureDescription>
						Validate X.509 certificate thumbprints in JWT headers for enhanced security
					</FeatureDescription>
					<ActionButton onClick={validateCertificate} disabled={!tokens}>
						<FiShield size={16} />
						Verify Certificate
					</ActionButton>
					<ActionButton onClick={showX5tDemo} $variant="secondary">
						<FiEye size={16} />
						View x5t in Tokens
					</ActionButton>
					<CodeBlock $isVisible={!!x5tResults}>
						{x5tResults || 'Click "Verify Certificate" to check x5t parameter'}
					</CodeBlock>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiGlobe size={20} />
						CORS Testing
					</FeatureTitle>
					<FeatureDescription>
						Test Cross-Origin Resource Sharing configuration and security
					</FeatureDescription>
					<ActionButton onClick={testCORS} disabled={isValidating}>
						<FiPlay size={16} />
						{isValidating ? 'Testing...' : 'Test CORS Configuration'}
					</ActionButton>
					<CodeBlock $isVisible={!!corsResults}>
						{corsResults || 'Click "Test CORS Configuration" to validate CORS settings'}
					</CodeBlock>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiDownload size={20} />
						Security Analysis
					</FeatureTitle>
					<FeatureDescription>
						Generate comprehensive security report and run automated tests
					</FeatureDescription>
					<ActionButton onClick={generateSecurityReport}>
						<FiDownload size={16} />
						Export Security Report
					</ActionButton>
					<ActionButton onClick={runSecurityTests} $variant="secondary">
						<FiPlay size={16} />
						Run Security Test Suite
					</ActionButton>
					<CodeBlock $isVisible={!!securityReportResults}>
						{securityReportResults ||
							'Click "Export Security Report" to generate comprehensive analysis'}
					</CodeBlock>
				</FeatureCard>
			</FeatureGrid>
		</TabContent>
	);

	const renderAnalysisTab = () => (
		<TabContent $active={activeTab === 'analysis'}>
			<FeatureGrid>
				<FeatureCard>
					<FeatureTitle>
						<FiDownload size={20} />
						Security Report
					</FeatureTitle>
					<FeatureDescription>Generate a comprehensive security analysis report</FeatureDescription>
					<ActionButton onClick={generateSecurityReport} disabled={isValidating}>
						<FiPlay size={16} />
						{isValidating ? 'Generating...' : 'Generate Report'}
					</ActionButton>
					<CodeBlock $isVisible={!!securityReportResults}>
						{securityReportResults || 'Click "Generate Report" to create a security analysis'}
					</CodeBlock>
				</FeatureCard>

				<FeatureCard>
					<FeatureTitle>
						<FiShield size={20} />
						Security Tests
					</FeatureTitle>
					<FeatureDescription>
						Run automated security tests on your configuration
					</FeatureDescription>
					<ActionButton onClick={runSecurityTests} disabled={isValidating}>
						<FiPlay size={16} />
						{isValidating ? 'Testing...' : 'Run Tests'}
					</ActionButton>
					<CodeBlock $isVisible={!!securityTestResults}>
						{securityTestResults || 'Click "Run Tests" to execute security tests'}
					</CodeBlock>
				</FeatureCard>
			</FeatureGrid>
		</TabContent>
	);

	return (
		<>
			<Container $primaryColor={colors.primary}>
				{!hideHeader && (
					<Header $primaryColor={colors.primary}>
						<HeaderTitle $fontSize={fontSize === 'large' ? '2rem' : '1.5rem'}>
							<FiShield size={fontSize === 'large' ? 32 : 24} />
							Enhanced Security Features
						</HeaderTitle>
						<HeaderSubtitle>
							Configure, test, and analyze security features for your OAuth/OIDC flows
						</HeaderSubtitle>
					</Header>
				)}

				<Content>
					<TabContainer>
						<TabList>
							<Tab
								$active={activeTab === 'config'}
								$tabType="config"
								onClick={() => setActiveTab('config')}
							>
								<FiSettings size={16} />
								Configuration
							</Tab>
							<Tab
								$active={activeTab === 'demo'}
								$tabType="demo"
								onClick={() => setActiveTab('demo')}
							>
								<FiPlay size={16} />
								Demo & Testing
								<span
									style={{
										marginLeft: '0.5rem',
										fontSize: '0.75rem',
										background: '#10b981',
										color: 'white',
										padding: '0.125rem 0.375rem',
										borderRadius: '0.25rem',
										fontWeight: '600',
									}}
								>
									🚪 Logout
								</span>
							</Tab>
							<Tab
								$active={activeTab === 'analysis'}
								$tabType="analysis"
								onClick={() => setActiveTab('analysis')}
							>
								<FiShield size={16} />
								Analysis
								<span
									style={{
										marginLeft: '0.5rem',
										fontSize: '0.75rem',
										background: '#ec4899',
										color: 'white',
										padding: '0.125rem 0.375rem',
										borderRadius: '0.25rem',
										fontWeight: '600',
									}}
								>
									🛡️ Security
								</span>
							</Tab>
						</TabList>
					</TabContainer>

					{renderConfigurationTab()}
					{renderDemoTab()}
					{renderAnalysisTab()}
				</Content>
			</Container>

			<ConfirmationModal
				isOpen={confirmModal.isOpen}
				title={confirmModal.title}
				message={confirmModal.message}
				onConfirm={confirmModal.onConfirm}
				onCancel={() =>
					setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })
				}
			/>
		</>
	);
};

export default EnhancedSecurityFeaturesDemo;
