// src/services/securityFeaturesConfigService.tsx
import React, { useMemo } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiSettings, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import type { PingOneApplicationState } from '../components/PingOneApplicationConfig';

// Security Features Configuration Interface
export interface SecurityFeaturesConfig {
	// PKCE Configuration
	pkce: {
		enabled: boolean;
		enforcement: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';
		codeChallengeMethod: 'S256' | 'plain';
	};

	// Client Authentication
	clientAuth: {
		method:
			| 'client_secret_post'
			| 'client_secret_basic'
			| 'client_secret_jwt'
			| 'private_key_jwt'
			| 'none';
		hasClientSecret: boolean;
		hasPrivateKey: boolean;
	};

	// Request Security
	requestSecurity: {
		requireSignedRequests: boolean;
		allowUnsignedRequests: boolean;
		requestParameterSignature: 'DEFAULT' | 'REQUIRE_SIGNED' | 'ALLOW_UNSIGNED';
		// JWT Secured Authorization Request (JAR) - RFC 9101
		jarSupport: boolean;
		jarAlgorithm: 'RS256' | 'ES256' | 'PS256';
		// Pushed Authorization Requests (PAR) - RFC 9126
		parSupport: boolean;
	};

	// Token Security
	tokenSecurity: {
		refreshTokenReplayProtection: boolean;
		includeX5tParameter: boolean;
		terminateSessionByIdToken: boolean;
		// X.509 Certificate Thumbprint (x5t) - RFC 7515
		x5tAlgorithm: 'SHA-1' | 'SHA-256'; // x5t vs x5t#S256
		x5tThumbprint: string;
	};

	// Session Management
	sessionManagement: {
		oidcSessionManagement: boolean;
		requestScopesForMultipleResources: boolean;
	};

	// Advanced Features
	advancedFeatures: {
		enableDPoP: boolean;
		requirePushedAuthorizationRequest: boolean;
		enableJWKS: boolean;
	};

	// CORS Configuration
	cors: {
		allowAnyOrigin: boolean;
		allowedOrigins: string[];
	};
}

// Security Feature Status
export interface SecurityFeatureStatus {
	feature: string;
	enabled: boolean;
	configured: boolean;
	description: string;
	impact: 'low' | 'medium' | 'high';
	recommendation: string;
}

// Convert PingOne config to security features config
export const convertPingOneToSecurityConfig = (
	pingOneConfig: PingOneApplicationState
): SecurityFeaturesConfig => {
	return {
		pkce: {
			enabled: pingOneConfig.pkceEnforcement !== 'OPTIONAL',
			enforcement: pingOneConfig.pkceEnforcement,
			codeChallengeMethod: pingOneConfig.pkceEnforcement === 'S256_REQUIRED' ? 'S256' : 'S256',
		},
		clientAuth: {
			method: pingOneConfig.clientAuthMethod,
			hasClientSecret:
				pingOneConfig.clientAuthMethod !== 'none' &&
				pingOneConfig.clientAuthMethod !== 'private_key_jwt',
			hasPrivateKey:
				pingOneConfig.clientAuthMethod === 'private_key_jwt' && !!pingOneConfig.privateKey,
		},
		requestSecurity: {
			requireSignedRequests:
				pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED',
			allowUnsignedRequests:
				pingOneConfig.requestParameterSignatureRequirement === 'ALLOW_UNSIGNED',
			requestParameterSignature: pingOneConfig.requestParameterSignatureRequirement,
			// JAR (JWT Secured Authorization Request) - RFC 9101
			jarSupport: pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED',
			jarAlgorithm: 'RS256', // Default to RS256, could be configurable
			// PAR (Pushed Authorization Requests) - RFC 9126
			parSupport: pingOneConfig.requirePushedAuthorizationRequest,
		},
		tokenSecurity: {
			refreshTokenReplayProtection: pingOneConfig.additionalRefreshTokenReplayProtection,
			includeX5tParameter: pingOneConfig.includeX5tParameter,
			terminateUserSessionByIdToken: pingOneConfig.terminateUserSessionByIdToken,
			// X.509 Certificate Thumbprint (x5t) - RFC 7515
			x5tAlgorithm: pingOneConfig.includeX5tParameter ? 'SHA-256' : 'SHA-1', // Prefer SHA-256 for security
			x5tThumbprint: '', // Would be populated from actual certificate
		},
		sessionManagement: {
			oidcSessionManagement: pingOneConfig.oidcSessionManagement,
			requestScopesForMultipleResources: pingOneConfig.requestScopesForMultipleResources,
		},
		advancedFeatures: {
			enableDPoP: pingOneConfig.enableDPoP,
			requirePushedAuthorizationRequest: pingOneConfig.requirePushedAuthorizationRequest,
			enableJWKS: pingOneConfig.enableJWKS,
		},
		cors: {
			allowAnyOrigin: pingOneConfig.corsAllowAnyOrigin,
			allowedOrigins: pingOneConfig.corsOrigins,
		},
	};
};

// Analyze security configuration and provide recommendations
export const analyzeSecurityConfiguration = (
	config: SecurityFeaturesConfig
): SecurityFeatureStatus[] => {
	const features: SecurityFeatureStatus[] = [];

	// PKCE Analysis
	features.push({
		feature: 'PKCE (Proof Key for Code Exchange)',
		enabled: config.pkce.enabled,
		configured:
			config.pkce.enforcement === 'REQUIRED' || config.pkce.enforcement === 'S256_REQUIRED',
		description: 'Prevents authorization code interception attacks',
		impact: 'high',
		recommendation: config.pkce.enabled
			? 'PKCE is properly configured for enhanced security'
			: 'Enable PKCE with S256 method for maximum security',
	});

	// Client Authentication Analysis
	features.push({
		feature: 'Client Authentication',
		enabled: config.clientAuth.method !== 'none',
		configured: config.clientAuth.hasClientSecret || config.clientAuth.hasPrivateKey,
		description: 'Authenticates the client application to the authorization server',
		impact: 'high',
		recommendation:
			config.clientAuth.method === 'none'
				? 'Consider using client authentication for better security'
				: 'Client authentication is properly configured',
	});

	// Request Security Analysis
	features.push({
		feature: 'Request Parameter Signing',
		enabled: config.requestSecurity.requireSignedRequests,
		configured: config.requestSecurity.requestParameterSignature === 'REQUIRE_SIGNED',
		description: 'Cryptographically signs request parameters for integrity',
		impact: 'medium',
		recommendation: config.requestSecurity.requireSignedRequests
			? 'Request signing provides excellent security'
			: 'Consider enabling request parameter signing for enhanced security',
	});

	// JAR (JWT Secured Authorization Request) Analysis
	features.push({
		feature: 'JWT Secured Authorization Request (JAR)',
		enabled: config.requestSecurity.jarSupport,
		configured:
			config.requestSecurity.jarSupport && config.requestSecurity.jarAlgorithm === 'RS256',
		description: 'RFC 9101 - Signs authorization request parameters using JWT',
		impact: 'high',
		recommendation: config.requestSecurity.jarSupport
			? `JAR is enabled with ${config.requestSecurity.jarAlgorithm} algorithm`
			: 'Enable JAR (RFC 9101) for maximum request parameter security',
	});

	// PAR (Pushed Authorization Requests) Analysis
	features.push({
		feature: 'Pushed Authorization Requests (PAR)',
		enabled: config.requestSecurity.parSupport,
		configured: config.requestSecurity.parSupport,
		description: 'RFC 9126 - Pushes authorization requests to secure endpoint',
		impact: 'high',
		recommendation: config.requestSecurity.parSupport
			? 'PAR provides excellent security for authorization requests'
			: 'Enable PAR (RFC 9126) for enhanced authorization request security',
	});

	// Token Security Analysis
	features.push({
		feature: 'Refresh Token Replay Protection',
		enabled: config.tokenSecurity.refreshTokenReplayProtection,
		configured: config.tokenSecurity.refreshTokenReplayProtection,
		description: 'Prevents refresh tokens from being used multiple times',
		impact: 'high',
		recommendation: config.tokenSecurity.refreshTokenReplayProtection
			? 'Refresh token replay protection is enabled'
			: 'Enable refresh token replay protection to prevent token reuse attacks',
	});

	// X5T Parameter Analysis
	features.push({
		feature: 'X.509 Certificate Thumbprint (x5t)',
		enabled: config.tokenSecurity.includeX5tParameter,
		configured:
			config.tokenSecurity.includeX5tParameter && config.tokenSecurity.x5tAlgorithm === 'SHA-256',
		description: 'RFC 7515 - Includes X.509 certificate thumbprint in JWT header',
		impact: 'medium',
		recommendation: config.tokenSecurity.includeX5tParameter
			? `X5T parameter is enabled with ${config.tokenSecurity.x5tAlgorithm} algorithm`
			: 'Enable X5T parameter for certificate-based token validation',
	});

	// Session Management Analysis
	features.push({
		feature: 'OIDC Session Management',
		enabled: config.sessionManagement.oidcSessionManagement,
		configured: config.sessionManagement.oidcSessionManagement,
		description: 'Enables session state tracking and logout functionality',
		impact: 'medium',
		recommendation: config.sessionManagement.oidcSessionManagement
			? 'OIDC session management is properly configured'
			: 'Enable OIDC session management for better user session handling',
	});

	// Advanced Features Analysis
	features.push({
		feature: 'Pushed Authorization Requests (PAR)',
		enabled: config.advancedFeatures.requirePushedAuthorizationRequest,
		configured: config.advancedFeatures.requirePushedAuthorizationRequest,
		description: 'Pushes authorization requests to a secure endpoint',
		impact: 'high',
		recommendation: config.advancedFeatures.requirePushedAuthorizationRequest
			? 'PAR provides excellent security for authorization requests'
			: 'Consider enabling PAR for enhanced authorization request security',
	});

	// DPoP Analysis (if supported)
	if (config.advancedFeatures.enableDPoP) {
		features.push({
			feature: 'DPoP (Demonstration of Proof of Possession)',
			enabled: config.advancedFeatures.enableDPoP,
			configured: config.advancedFeatures.enableDPoP,
			description: 'Cryptographic proof for each HTTP request',
			impact: 'high',
			recommendation: 'DPoP provides advanced token binding security',
		});
	}

	return features;
};

// Styled Components
const SecurityConfigContainer = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin: 1rem 0;
`;

const SecurityConfigHeader = styled.div<{ $primaryColor: string }>`
	background: linear-gradient(135deg, ${(props) => props.$primaryColor} 0%, ${(props) => props.$primaryColor} 100%);
	color: white;
	padding: 2rem;
	text-align: center;
`;

const SecurityConfigTitle = styled.h2`
	margin: 0 0 0.5rem 0;
	font-size: 1.5rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`;

const SecurityConfigSubtitle = styled.p`
	margin: 0;
	opacity: 0.9;
	font-size: 1rem;
`;

const SecurityConfigContent = styled.div`
	padding: 2rem;
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const FeatureCard = styled.div<{ $status: 'enabled' | 'disabled' | 'warning' }>`
	border: 1px solid ${(props) => {
		switch (props.$status) {
			case 'enabled':
				return '#10b981';
			case 'warning':
				return '#f59e0b';
			case 'disabled':
				return '#e5e7eb';
			default:
				return '#e5e7eb';
		}
	}};
	border-radius: 8px;
	padding: 1.5rem;
	background: ${(props) => {
		switch (props.$status) {
			case 'enabled':
				return '#f0fdf4';
			case 'warning':
				return '#fffbeb';
			case 'disabled':
				return '#f9fafb';
			default:
				return '#f9fafb';
		}
	}};
`;

const FeatureHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const FeatureIcon = styled.div<{ $status: 'enabled' | 'disabled' | 'warning' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: ${(props) => {
		switch (props.$status) {
			case 'enabled':
				return '#10b981';
			case 'warning':
				return '#f59e0b';
			case 'disabled':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	}};
	color: white;
`;

const FeatureTitle = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: #1f2937;
`;

const FeatureDescription = styled.p`
	margin: 0 0 1rem 0;
	color: #6b7280;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const FeatureRecommendation = styled.div<{ $impact: 'low' | 'medium' | 'high' }>`
	padding: 0.75rem;
	border-radius: 6px;
	background: ${(props) => {
		switch (props.$impact) {
			case 'high':
				return '#fef2f2';
			case 'medium':
				return '#fffbeb';
			case 'low':
				return '#f0f9ff';
			default:
				return '#f9fafb';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$impact) {
			case 'high':
				return '#fecaca';
			case 'medium':
				return '#fed7aa';
			case 'low':
				return '#bfdbfe';
			default:
				return '#e5e7eb';
		}
	}};
`;

const RecommendationText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: ${(props) => props.color || '#374151'};
	line-height: 1.4;
`;

const ImpactBadge = styled.span<{ $impact: 'low' | 'medium' | 'high' }>`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background: ${(props) => {
		switch (props.$impact) {
			case 'high':
				return '#dc2626';
			case 'medium':
				return '#d97706';
			case 'low':
				return '#059669';
			default:
				return '#6b7280';
		}
	}};
	color: white;
	margin-bottom: 0.5rem;
`;

const ConfigurationSummary = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	margin-top: 2rem;
`;

const SummaryTitle = styled.h3`
	margin: 0 0 1rem 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SummaryStats = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`;

const StatItem = styled.div`
	text-align: center;
	padding: 1rem;
	background: white;
	border-radius: 6px;
	border: 1px solid #e2e8f0;
`;

const StatValue = styled.div<{ $color: string }>`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${(props) => props.$color};
	margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
`;

// Main Security Features Configuration Component
interface SecurityFeaturesConfigProps {
	pingOneConfig: PingOneApplicationState;
	flowType?: string;
	onConfigChange?: (config: SecurityFeaturesConfig) => void;
}

export const SecurityFeaturesConfig: React.FC<SecurityFeaturesConfigProps> = ({
	pingOneConfig,
	flowType,
	onConfigChange,
}) => {
	const securityConfig = useMemo(
		() => convertPingOneToSecurityConfig(pingOneConfig),
		[pingOneConfig]
	);
	const securityAnalysis = useMemo(
		() => analyzeSecurityConfiguration(securityConfig),
		[securityConfig]
	);

	// Calculate security score
	const securityScore = useMemo(() => {
		const totalFeatures = securityAnalysis.length;
		const enabledFeatures = securityAnalysis.filter((f) => f.enabled).length;
		const configuredFeatures = securityAnalysis.filter((f) => f.configured).length;

		// Weight configured features more heavily
		return Math.round(((configuredFeatures * 2 + enabledFeatures) / (totalFeatures * 2)) * 100);
	}, [securityAnalysis]);

	// Get security level
	const getSecurityLevel = (score: number) => {
		if (score >= 80) return { level: 'Excellent', color: '#10b981' };
		if (score >= 60) return { level: 'Good', color: '#f59e0b' };
		if (score >= 40) return { level: 'Fair', color: '#f97316' };
		return { level: 'Needs Improvement', color: '#dc2626' };
	};

	const securityLevel = getSecurityLevel(securityScore);

	// Get feature status for styling
	const getFeatureStatus = (feature: SecurityFeatureStatus): 'enabled' | 'disabled' | 'warning' => {
		if (feature.configured) return 'enabled';
		if (feature.enabled) return 'warning';
		return 'disabled';
	};

	// Get feature icon
	const getFeatureIcon = (feature: SecurityFeatureStatus) => {
		const status = getFeatureStatus(feature);
		switch (status) {
			case 'enabled':
				return <FiCheckCircle size={20} />;
			case 'warning':
				return <FiAlertTriangle size={20} />;
			case 'disabled':
				return <FiShield size={20} />;
			default:
				return <FiShield size={20} />;
		}
	};

	return (
		<SecurityConfigContainer>
			<SecurityConfigHeader $primaryColor="#3b82f6">
				<SecurityConfigTitle>
					<FiShield size={24} />
					Security Features Configuration
				</SecurityConfigTitle>
				<SecurityConfigSubtitle>
					Configure security features to match your PingOne application settings
				</SecurityConfigSubtitle>
			</SecurityConfigHeader>

			<SecurityConfigContent>
				<ConfigurationSummary>
					<SummaryTitle>
						<FiSettings size={20} />
						Security Configuration Summary
					</SummaryTitle>
					<SummaryStats>
						<StatItem>
							<StatValue $color={securityLevel.color}>{securityScore}%</StatValue>
							<StatLabel>Security Score</StatLabel>
						</StatItem>
						<StatItem>
							<StatValue $color={securityLevel.color}>{securityLevel.level}</StatValue>
							<StatLabel>Security Level</StatLabel>
						</StatItem>
						<StatItem>
							<StatValue $color="#10b981">
								{securityAnalysis.filter((f) => f.configured).length}
							</StatValue>
							<StatLabel>Configured Features</StatLabel>
						</StatItem>
						<StatItem>
							<StatValue $color="#6b7280">
								{securityAnalysis.filter((f) => !f.configured).length}
							</StatValue>
							<StatLabel>Needs Configuration</StatLabel>
						</StatItem>
					</SummaryStats>
				</ConfigurationSummary>

				<FeatureGrid>
					{securityAnalysis.map((feature, index) => (
						<FeatureCard key={index} $status={getFeatureStatus(feature)}>
							<FeatureHeader>
								<FeatureIcon $status={getFeatureStatus(feature)}>
									{getFeatureIcon(feature)}
								</FeatureIcon>
								<FeatureTitle>{feature.feature}</FeatureTitle>
							</FeatureHeader>
							<FeatureDescription>{feature.description}</FeatureDescription>
							<FeatureRecommendation $impact={feature.impact}>
								<ImpactBadge $impact={feature.impact}>{feature.impact} impact</ImpactBadge>
								<RecommendationText
									color={
										feature.impact === 'high'
											? '#dc2626'
											: feature.impact === 'medium'
												? '#d97706'
												: '#059669'
									}
								>
									{feature.recommendation}
								</RecommendationText>
							</FeatureRecommendation>
						</FeatureCard>
					))}
				</FeatureGrid>

				<ConfigurationSummary>
					<SummaryTitle>
						<FiInfo size={20} />
						Configuration Instructions
					</SummaryTitle>
					<p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
						To configure these security features in PingOne:
					</p>
					<ol
						style={{
							color: '#374151',
							lineHeight: '1.6',
							marginTop: '1rem',
							paddingLeft: '1.5rem',
						}}
					>
						<li>Go to your PingOne environment dashboard</li>
						<li>Navigate to Applications → Your Application</li>
						<li>Configure the security settings in the "Security" tab</li>
						<li>Enable the features you want to use in your OAuth flows</li>
						<li>Save your configuration and test the flows</li>
					</ol>

					<div
						style={{
							marginTop: '1.5rem',
							padding: '1rem',
							background: '#f0f9ff',
							border: '1px solid #0ea5e9',
							borderRadius: '6px',
						}}
					>
						<h4
							style={{
								margin: '0 0 0.5rem 0',
								color: '#0c4a6e',
								fontSize: '0.9rem',
								fontWeight: '600',
							}}
						>
							🔐 Advanced Security Features
						</h4>
						<ul
							style={{
								margin: 0,
								paddingLeft: '1.5rem',
								color: '#0c4a6e',
								fontSize: '0.85rem',
								lineHeight: '1.5',
							}}
						>
							<li>
								<strong>JAR (RFC 9101):</strong> Enable "Request Parameter Signature" → "Require
								Signed"
							</li>
							<li>
								<strong>PAR (RFC 9126):</strong> Enable "Pushed Authorization Request"
							</li>
							<li>
								<strong>X5T Parameter:</strong> Enable "Include x5t Parameter" for certificate
								thumbprints
							</li>
							<li>
								<strong>PKCE:</strong> Set to "Required" or "S256 Required" for maximum security
							</li>
							<li>
								<strong>Client Authentication:</strong> Use "Private Key JWT" for confidential
								clients
							</li>
						</ul>
					</div>
				</ConfigurationSummary>
			</SecurityConfigContent>
		</SecurityConfigContainer>
	);
};

export default SecurityFeaturesConfig;
