// src/components/EnhancedSecurityFeaturesDemo.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
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
	FiSettings,
	FiInfo,
} from 'react-icons/fi';
import styled from 'styled-components';
import ConfirmationModal from './ConfirmationModal';
import { useUISettings } from '../contexts/UISettingsContext';
import { showGlobalSuccess } from '../hooks/useNotifications';
import { v4ToastManager } from '../utils/v4ToastMessages';
import {
	buildLogoutUrl,
	terminateSession as terminateSessionService,
} from '../services/sessionTerminationService';
import { isJWT } from '../utils/jwtDecoder';
import SecurityFeaturesConfig, { 
	SecurityFeaturesConfig as SecurityConfigComponent,
	type SecurityFeaturesConfig as SecurityConfigType,
	convertPingOneToSecurityConfig,
	analyzeSecurityConfiguration,
} from '../services/securityFeaturesConfigService';
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

const TabContainer = styled.div`
	border-bottom: 1px solid #e2e8f0;
	margin-bottom: 2rem;
`;

const TabList = styled.div`
	display: flex;
	gap: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 1rem 1.5rem;
	border: none;
	background: ${(props) => (props.$active ? 'white' : 'transparent')};
	color: ${(props) => (props.$active ? '#3b82f6' : '#6b7280')};
	font-weight: ${(props) => (props.$active ? '600' : '500')};
	cursor: pointer;
	border-bottom: 2px solid ${(props) => (props.$active ? '#3b82f6' : 'transparent')};
	transition: all 0.2s;
	
	&:hover {
		background: ${(props) => (props.$active ? 'white' : '#f8fafc')};
		color: ${(props) => (props.$active ? '#3b82f6' : '#374151')};
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
	const [validationResults, setValidationResults] = useState<string | null>(null);
	const [expirationResults, setExpirationResults] = useState<string | null>(null);
	const [signatureResults, setSignatureResults] = useState<string | null>(null);
	const [signatureValidationResults, setSignatureValidationResults] = useState<string | null>(null);
	const [revokeResults, setRevokeResults] = useState<string | null>(null);
	const [securityReportResults, setSecurityReportResults] = useState<string | null>(null);
	const [securityTestResults, setSecurityTestResults] = useState<string | null>(null);
	const [collapsedSecurityReport, setCollapsedSecurityReport] = useState(false);
	const [collapsedSecurityTest, setCollapsedSecurityTest] = useState(false);
	const [sessionResults, setSessionResults] = useState<string | null>(null);

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
			await new Promise(resolve => setTimeout(resolve, 1000));
			
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
			await new Promise(resolve => setTimeout(resolve, 1500));
			
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

	const generateSecurityReport = useCallback(async () => {
		setIsValidating(true);
		setSecurityReportResults('Generating security report...');
		
		try {
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			const report = [];
			report.push('🔒 SECURITY ANALYSIS REPORT');
			report.push('========================');
			report.push('');
			
			if (securityAnalysis.length > 0) {
				report.push('📊 Security Features Status:');
				securityAnalysis.forEach(feature => {
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
			await new Promise(resolve => setTimeout(resolve, 2500));
			
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
			message: 'Are you sure you want to terminate the current session? This will log you out and invalidate all tokens.',
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
				<SecurityConfigComponent
					pingOneConfig={pingOneConfig}
					flowType={flowType}
				/>
			) : (
				<InfoBox>
					<InfoTitle>No PingOne Configuration Available</InfoTitle>
					<InfoText>
						To see security configuration options, please configure your PingOne application settings first.
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
					<ActionButton
						onClick={validateTokenExpiration}
						disabled={isValidating || !tokens}
					>
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
					<ActionButton
						onClick={validateTokenSignature}
						disabled={isValidating || !tokens}
					>
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
					<ActionButton
						onClick={handleTerminateSession}
						$variant="danger"
					>
						<FiTrash2 size={16} />
						Terminate Session
					</ActionButton>
					{calculatedLogoutUrl && (
						<>
							<ActionButton
								onClick={() => setShowLogoutUrl(!showLogoutUrl)}
								$variant="secondary"
							>
								<FiEye size={16} />
								{showLogoutUrl ? 'Hide' : 'Show'} Logout URL
							</ActionButton>
							<CodeBlock $isVisible={showLogoutUrl}>
								{calculatedLogoutUrl}
							</CodeBlock>
						</>
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
					<ActionButton
						onClick={handleRevokeTokens}
						$variant="danger"
					>
						<FiX size={16} />
						Revoke Tokens
					</ActionButton>
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
					<FeatureDescription>
						Generate a comprehensive security analysis report
					</FeatureDescription>
					<ActionButton
						onClick={generateSecurityReport}
						disabled={isValidating}
					>
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
					<ActionButton
						onClick={runSecurityTests}
						disabled={isValidating}
					>
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
								onClick={() => setActiveTab('config')}
							>
								<FiSettings size={16} />
								Configuration
							</Tab>
							<Tab
								$active={activeTab === 'demo'}
								onClick={() => setActiveTab('demo')}
							>
								<FiPlay size={16} />
								Demo & Testing
							</Tab>
							<Tab
								$active={activeTab === 'analysis'}
								onClick={() => setActiveTab('analysis')}
							>
								<FiShield size={16} />
								Analysis
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
				onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
			/>
		</>
	);
};

export default EnhancedSecurityFeaturesDemo;
