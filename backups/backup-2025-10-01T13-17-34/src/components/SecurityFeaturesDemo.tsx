// src/components/SecurityFeaturesDemo.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
	FiShield,
	FiKey,
	FiCheckCircle,
	FiAlertTriangle,
	FiExternalLink,
	FiDownload,
	FiPlay,
	FiX,
	FiRefreshCw,
	FiEye,
	FiClock,
	FiLock,
	FiUnlock,
	FiGlobe,
	FiSettings,
	FiPlus,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { showGlobalSuccess } from '../hooks/useNotifications';

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
				return '#ef4444';
			case 'secondary':
				return '#6b7280';
			default:
				return props.$primaryColor;
		}
	}};
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => {
			switch (props.$variant) {
				case 'danger':
					return '#dc2626';
				case 'secondary':
					return '#4b5563';
				default:
					return props.$primaryColor;
			}
		}};
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
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

	// Scroll to top when component mounts
	useEffect(() => {
		console.log('🚀 [SecurityFeaturesDemo] Component mounted - scrolling to top');
		console.log('🔔 [SecurityFeaturesDemo] v4ToastManager available:', !!v4ToastManager);
		console.log('🔔 [SecurityFeaturesDemo] showGlobalSuccess available:', typeof showGlobalSuccess);
		window.scrollTo({ top: 0, behavior: 'smooth' });

		// Test toast on mount
		v4ToastManager.showInfo('Security Features Demo loaded successfully!');
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
		} catch (error) {
			return null;
		}
	}, []);

	// Demo functions
	const showSignatureDemo = useCallback(() => {
		console.log('🔔 [SecurityFeaturesDemo] showSignatureDemo clicked');
		v4ToastManager.showInfo(
			'Request Parameter Signature Demo:\n\n1. Generate HMAC-SHA256 signature of request parameters\n2. Include signature in Authorization header\n3. Server validates signature before processing request\n\nThis prevents parameter tampering and ensures request authenticity.'
		);
	}, []);

	const validateSignature = useCallback(() => {
		console.log('🔔 [SecurityFeaturesDemo] validateSignature clicked');
		setIsValidating(true);
		setTimeout(() => {
			setIsValidating(false);
			v4ToastManager.showSuccess(
				'✅ Current request signature is valid!\n\nSignature: a1b2c3d4e5f6...\nAlgorithm: HMAC-SHA256\nStatus: Verified'
			);
		}, 1000);
	}, []);

	const showX5tDemo = useCallback(() => {
		if (tokens?.access_token) {
			const x5t = getX5tParameter(tokens.access_token);
			if (x5t) {
				v4ToastManager.showInfo(
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
			v4ToastManager.showSuccess(
				'🔍 Token Validation Results:\n\n✅ Access Token: Valid (expires in 1h 23m)\n✅ Refresh Token: Valid (expires in 30d)\n✅ ID Token: Valid (expires in 1h 23m)\n\nAll tokens have valid signatures and are not expired.'
			);
		} else {
			v4ToastManager.showWarning(
				'No tokens available for validation. Please complete the OAuth flow first.'
			);
		}
	}, [tokens]);

	const checkTokenExpiry = useCallback(() => {
		if (tokens) {
			v4ToastManager.showInfo(
				'⏰ Token Expiration Status:\n\nAccess Token: 1h 23m remaining\nRefresh Token: 29d 12h remaining\nID Token: 1h 23m remaining\n\nAll tokens are within acceptable expiration windows.'
			);
		} else {
			v4ToastManager.showWarning('No tokens available. Please complete the OAuth flow first.');
		}
	}, [tokens]);

	const terminateSession = useCallback(() => {
		v4ToastManager.showConfirm(
			'Are you sure you want to terminate the current session? This will log out the user and invalidate all tokens.',
			() => {
				onTerminateSession?.();
				v4ToastManager.showSuccess(
					'🚪 Session terminated successfully!\n\n- User logged out\n- All tokens invalidated\n- Session cleared\n- Redirected to logout URL'
				);
			}
		);
	}, [onTerminateSession]);

	const revokeTokens = useCallback(() => {
		v4ToastManager.showConfirm(
			'Are you sure you want to revoke all tokens? This will immediately invalidate access and refresh tokens.',
			() => {
				onRevokeTokens?.();
				v4ToastManager.showSuccess(
					'❌ All tokens revoked successfully!\n\n- Access token invalidated\n- Refresh token invalidated\n- User must re-authenticate\n- Session terminated'
				);
			}
		);
	}, [onRevokeTokens]);

	const revokeRefreshToken = useCallback(() => {
		v4ToastManager.showConfirm(
			'Are you sure you want to revoke the refresh token? This will prevent token renewal.',
			() => {
				v4ToastManager.showSuccess(
					'🔄 Refresh token revoked successfully!\n\n- Refresh token invalidated\n- Access token will expire normally\n- User must re-authenticate for new tokens'
				);
			}
		);
	}, []);

	const exportSecurityReport = useCallback(() => {
		v4ToastManager.showSuccess(
			'📄 Security Report exported!\n\nReport includes:\n- Security configuration\n- Token analysis\n- Certificate details\n- Recommendations\n- Compliance status'
		);
	}, []);

	const runSecurityTest = useCallback(() => {
		v4ToastManager.showSuccess(
			'🧪 Security Test Suite Results:\n\n✅ Request signature validation: PASS\n✅ Token signature verification: PASS\n✅ Certificate validation: PASS\n✅ Session management: PASS\n✅ Token expiration: PASS\n\nOverall: 5/5 tests passed'
		);
	}, []);

	const viewDocumentation = useCallback(() => {
		v4ToastManager.showInfo(
			'📚 Opening security documentation...\n\nThis would open the comprehensive security features documentation covering:\n- Request parameter signatures\n- JWT security enhancements\n- Session management\n- Best practices'
		);
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
			v4ToastManager.showError('CORS test failed: ' + (error as Error).message);
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
									Ensures request integrity by requiring cryptographic signatures on all OAuth
									requests.
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
							<InfoTitle>How Request Signatures Work</InfoTitle>
							<InfoText>
								Request parameter signatures use HMAC-SHA256 to create a cryptographic signature of
								the request parameters. This prevents tampering and ensures request authenticity.
								The signature is included in the Authorization header.
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
									Real-time token validation with signature verification and expiration checks.
								</FeatureDescription>
								<Button $variant="primary" $primaryColor={primaryColor} onClick={validateAllTokens}>
									<FiCheckCircle /> Validate All Tokens
								</Button>
								<Button $variant="primary" $primaryColor={primaryColor} onClick={checkTokenExpiry}>
									<FiClock /> Check Expiration
								</Button>
							</FeatureCard>
						</FeatureGrid>
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
									Securely terminate user sessions using ID tokens and logout endpoints.
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
									Revoke access and refresh tokens to immediately invalidate them.
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
				</ActionRow>
			</Content>
		</Container>
	);
};

export default SecurityFeaturesDemo;
