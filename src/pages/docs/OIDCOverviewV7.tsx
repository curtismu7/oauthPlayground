// src/pages/docs/OIDCOverviewV7.tsx
// V7 OIDC Overview with Enhanced Architecture

import React, { useCallback, useState } from 'react';
import {
	FiArrowRight,
	FiCheckCircle,
	FiCode,
	FiGitBranch,
	FiGlobe,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiSettings,
	FiSmartphone,
	FiUsers,
	FiZap,
} from '@icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
// Import V7 service architecture components
import { FlowHeader } from '../../services/flowHeaderService';
// Get shared UI components from FlowUIService
import { FlowUIService } from '../../services/flowUIService';
import { OAuthFlowComparisonService } from '../../services/oauthFlowComparisonService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const { Container, ContentWrapper, MainCard, InfoBox, InfoTitle, SectionDivider, HelperText } =
	FlowUIService.getFlowUIComponents();

// V7 Styled Components
const ResponsiveContainer = styled(Container)`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem;
	
	@media (max-width: 768px) {
		padding: 0.5rem;
		max-width: 100%;
	}
`;

const ResponsiveContentWrapper = styled(ContentWrapper)`
	max-width: 100%;
	overflow: hidden;
	
	@media (max-width: 768px) {
		padding: 0;
	}
`;

const FlowGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 2rem;
	margin: 3rem 0;
	justify-items: stretch;
	align-items: start;
	
	@media (max-width: 1200px) {
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
	}
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 1.25rem;
	}
	
	@media (max-width: 480px) {
		gap: 1rem;
	}
`;

const FlowCard = styled(MainCard)`
	position: relative;
	cursor: pointer;
	transition: all 0.3s ease;
	border: 2px solid #e5e7eb;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: white;
	padding: 1.5rem;
	
	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
		border-color: #3b82f6;
	}
	

`;

const FlowIcon = styled.div<{ $color: string }>`
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	background: ${(props) => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.5rem;
	margin-bottom: 1rem;
`;

const FlowTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #1f2937;
`;

const FlowDescription = styled.p`
	color: #6b7280;
	margin-bottom: 1rem;
	line-height: 1.6;
`;

const SecurityLevel = styled.div<{ $level: number }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	
	.stars {
		display: flex;
		gap: 0.125rem;
	}
	
	.star {
		width: 1rem;
		height: 1rem;
		background: ${(props) => (props.$level >= 3 ? '#10b981' : props.$level >= 2 ? '#f59e0b' : '#ef4444')};
		clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
	}
`;

const ConceptGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;
	margin: 3rem 0;
	justify-items: stretch;
	align-items: start;
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 1rem;
	}
`;

const ConceptCard = styled(MainCard)`
	padding: 2rem;
	text-align: center;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: white;
	border: 1px solid #e5e7eb;
	
	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}
	
	.icon {
		font-size: 2rem;
		color: #3b82f6;
		margin-bottom: 1rem;
	}
	
	h4 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #1f2937;
	}
	
	p {
		color: #6b7280;
		line-height: 1.6;
	}
`;

const ComparisonTable = styled.div`
	overflow-x: auto;
	margin: 2rem 0;
	
	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		
		th, td {
			padding: 1rem;
			text-align: left;
			border-bottom: 1px solid #e5e7eb;
		}
		
		th {
			background: #f9fafb;
			font-weight: 600;
			color: #374151;
		}
		
		tr:hover {
			background: #f9fafb;
		}
	}
`;

// OIDC Flow Data
interface OIDCFlow {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<any>;
	color: string;
	securityLevel: number;
	deprecated?: boolean;
	oauth21Status: 'included' | 'deprecated' | 'not-specified';
	path: string;
	bestFor: string[];
	pros: string[];
	cons: string[];
}

const oidcFlows: OIDCFlow[] = [
	{
		id: 'authorization-code',
		title: 'Authorization Code Flow',
		description:
			'The most secure flow for applications that can securely store client credentials. Provides both access and ID tokens.',
		icon: FiKey,
		color: '#10b981',
		securityLevel: 5,
		oauth21Status: 'included',
		path: '/flows/oauth-authorization-code-v7',
		bestFor: ['Web applications', 'Server-side applications', 'Mobile apps with secure storage'],
		pros: ['Highest security', 'Refresh token support', 'Client authentication'],
		cons: ['More complex implementation', 'Requires secure client storage'],
	},
	{
		id: 'implicit',
		title: 'Implicit Flow',
		description:
			'Legacy flow for browser-based applications. Returns tokens directly from authorization endpoint.',
		icon: FiZap,
		color: '#f59e0b',
		securityLevel: 2,
		deprecated: true,
		oauth21Status: 'deprecated',
		path: '/flows/implicit-v7',
		bestFor: ['Legacy SPAs (not recommended)'],
		pros: ['Simple implementation', 'No backend required'],
		cons: ['Less secure', 'No refresh tokens', 'Deprecated in OAuth 2.1'],
	},
	{
		id: 'hybrid',
		title: 'Hybrid Flow',
		description:
			'Combines Authorization Code and Implicit flows. Returns some tokens immediately and others via backchannel.',
		icon: FiGitBranch,
		color: '#8b5cf6',
		securityLevel: 4,
		oauth21Status: 'not-specified',
		path: '/flows/oidc-hybrid-v7',
		bestFor: ['Complex applications', 'Multi-tier architectures'],
		pros: ['Flexible token delivery', 'Immediate access to some tokens'],
		cons: ['Complex implementation', 'Multiple endpoints'],
	},
	{
		id: 'device-authorization',
		title: 'Device Authorization Flow',
		description:
			'For devices with limited input capabilities. User authenticates on a separate device.',
		icon: FiSmartphone,
		color: '#06b6d4',
		securityLevel: 4,
		oauth21Status: 'included',
		path: '/flows/device-authorization-v7',
		bestFor: ['Smart TVs', 'IoT devices', 'CLI applications'],
		pros: ['Works on input-limited devices', 'Secure authentication'],
		cons: ['Requires secondary device', 'More complex UX'],
	},
	{
		id: 'client-credentials',
		title: 'Client Credentials Flow',
		description:
			'Machine-to-machine authentication without user interaction. Uses client ID and secret.',
		icon: FiSettings,
		color: '#6366f1',
		securityLevel: 4,
		oauth21Status: 'included',
		path: '/flows/client-credentials-v7',
		bestFor: ['APIs', 'Microservices', 'Background services'],
		pros: ['Simple M2M auth', 'No user interaction', 'High throughput'],
		cons: ['No user context', 'Requires secure credential storage'],
	},
	{
		id: 'refresh-token',
		title: 'Refresh Token Flow',
		description: 'Renew access tokens without user re-authentication using refresh tokens.',
		icon: FiRefreshCw,
		color: '#8b5cf6',
		securityLevel: 4,
		oauth21Status: 'included',
		path: '/flows/token-refresh-v7',
		bestFor: ['Long-lived sessions', 'Mobile apps', 'Background sync'],
		pros: ['Seamless token renewal', 'Better UX', 'Maintains sessions'],
		cons: ['Requires secure storage', 'Token rotation complexity'],
	},
	{
		id: 'ropc',
		title: 'Resource Owner Password',
		description: 'Direct username/password authentication. Deprecated for most use cases.',
		icon: FiLock,
		color: '#ef4444',
		securityLevel: 2,
		deprecated: true,
		oauth21Status: 'deprecated',
		path: '/flows/ropc-v7',
		bestFor: ['Legacy systems', 'Trusted first-party apps'],
		pros: ['Simple implementation', 'Direct credential use'],
		cons: ['Security risks', 'No SSO', 'Deprecated pattern'],
	},
	{
		id: 'ciba',
		title: 'CIBA Flow',
		description:
			'Client Initiated Backchannel Authentication for decoupled authentication scenarios.',
		icon: FiUsers,
		color: '#10b981',
		securityLevel: 5,
		oauth21Status: 'not-specified',
		path: '/flows/ciba-v7',
		bestFor: ['Banking apps', 'High-security scenarios', 'Decoupled auth'],
		pros: ['High security', 'Decoupled flow', 'Push notifications'],
		cons: ['Complex implementation', 'Limited adoption'],
	},
	{
		id: 'token-exchange',
		title: 'Token Exchange Flow',
		description:
			'Exchange tokens for different audiences or scopes (RFC 8693). Modern microservices pattern.',
		icon: FiCode,
		color: '#f59e0b',
		securityLevel: 4,
		oauth21Status: 'not-specified',
		path: '/flows/token-exchange-v7',
		bestFor: ['Microservices', 'Token delegation', 'Service mesh'],
		pros: ['Flexible token handling', 'Secure delegation', 'Standards-based'],
		cons: ['Complex setup', 'Limited provider support'],
	},
];

// OIDC Concepts
const oidcConcepts = [
	{
		title: 'ID Token',
		description: 'A JWT containing user identity information and authentication details.',
		icon: FiUsers,
		examples: ['User ID', 'Email', 'Name', 'Authentication time'],
	},
	{
		title: 'UserInfo Endpoint',
		description: 'Protected endpoint that returns user profile information using an access token.',
		icon: FiInfo,
		examples: ['Profile data', 'Claims', 'Custom attributes'],
	},
	{
		title: 'Scopes & Claims',
		description:
			'Scopes request access to specific user information, claims are the actual data returned.',
		icon: FiLock,
		examples: ['openid', 'profile', 'email', 'address'],
	},
	{
		title: 'Discovery',
		description: 'Automatic configuration discovery using well-known endpoints.',
		icon: FiGlobe,
		examples: ['Authorization endpoint', 'Token endpoint', 'Supported scopes'],
	},
];

const OIDCOverviewV7: React.FC = () => {
	usePageScroll();
	const navigate = useNavigate();
	const [_selectedFlow, _setSelectedFlow] = useState<string | null>(null);

	const handleFlowClick = useCallback(
		(flow: OIDCFlow) => {
			if (flow.deprecated) {
				v4ToastManager.showWarning(
					`${flow.title} is deprecated`,
					{ description: 'This flow is deprecated and should not be used in new applications.' },
					{ duration: 4000 }
				);
			}

			// Navigate with OIDC context
			navigate(flow.path, { state: { fromSection: 'oidc', protocol: 'oidc' } });
		},
		[navigate]
	);

	const renderSecurityLevel = useCallback((level: number) => {
		return (
			<SecurityLevel $level={level}>
				<span>Security:</span>
				<div className="stars">
					{[1, 2, 3, 4, 5].map((star) => (
						<div key={star} className={`star ${star <= level ? 'filled' : ''}`} />
					))}
				</div>
				<span>{level}/5</span>
			</SecurityLevel>
		);
	}, []);

	return (
		<ResponsiveContainer>
			<FlowHeader flowId="oidc-overview" />

			<ResponsiveContentWrapper>
				{/* OIDC Overview Introduction */}
				<InfoBox $variant="info" style={{ marginBottom: '2rem' }}>
					<FiInfo size={24} />
					<div>
						<InfoTitle>OpenID Connect (OIDC) Overview</InfoTitle>
						<p style={{ marginBottom: '1rem' }}>
							OpenID Connect is an identity layer built on top of OAuth 2.0. It enables applications
							to verify user identity and obtain basic profile information in a standardized, secure
							manner.
						</p>
						<HelperText>
							🎯 <strong>Key Difference:</strong> While OAuth 2.0 handles authorization (what you
							can do), OIDC adds authentication (who you are) with standardized identity tokens.
						</HelperText>
					</div>
				</InfoBox>

				<SectionDivider />

				{/* Core OIDC Concepts */}
				<CollapsibleHeader title="Core OIDC Concepts" defaultOpen={true}>
					<ConceptGrid>
						{oidcConcepts.map((concept, index) => (
							<ConceptCard key={index}>
								<div className="icon">
									<concept.icon />
								</div>
								<h4>{concept.title}</h4>
								<p>{concept.description}</p>
								<div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
									<strong>Examples:</strong> {concept.examples.join(', ')}
								</div>
							</ConceptCard>
						))}
					</ConceptGrid>
				</CollapsibleHeader>

				<SectionDivider />

				{/* OIDC Flows */}
				<CollapsibleHeader title="OIDC Authentication Flows" defaultOpen={true}>
					<FlowGrid>
						{oidcFlows.map((flow) => (
							<FlowCard key={flow.id} onClick={() => handleFlowClick(flow)}>
								{/* OAuth 2.1 Status Badge */}
								<div
									style={{
										position: 'absolute',
										top: '1rem',
										right: '1rem',
										padding: '0.25rem 0.5rem',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										fontWeight: '600',
										textTransform: 'uppercase',
										backgroundColor:
											flow.oauth21Status === 'included'
												? '#dcfce7'
												: flow.oauth21Status === 'deprecated'
													? '#fef3c7'
													: '#f3f4f6',
										color:
											flow.oauth21Status === 'included'
												? '#166534'
												: flow.oauth21Status === 'deprecated'
													? '#d97706'
													: '#6b7280',
										border: `1px solid ${
											flow.oauth21Status === 'included'
												? '#bbf7d0'
												: flow.oauth21Status === 'deprecated'
													? '#fde68a'
													: '#e5e7eb'
										}`,
									}}
								>
									{flow.oauth21Status === 'included'
										? 'OAuth 2.1'
										: flow.oauth21Status === 'deprecated'
											? 'Deprecated in OAuth 2.1'
											: 'OIDC Only'}
								</div>

								<FlowIcon $color={flow.color}>
									<flow.icon />
								</FlowIcon>

								<FlowTitle>{flow.title}</FlowTitle>
								<FlowDescription>{flow.description}</FlowDescription>

								{renderSecurityLevel(flow.securityLevel)}

								<div style={{ marginBottom: '1rem' }}>
									<strong style={{ color: '#374151', fontSize: '0.875rem' }}>Best For:</strong>
									<ul
										style={{
											margin: '0.5rem 0',
											paddingLeft: '1rem',
											fontSize: '0.875rem',
											color: '#6b7280',
										}}
									>
										{flow.bestFor.map((item, index) => (
											<li key={index}>{item}</li>
										))}
									</ul>
								</div>

								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginTop: 'auto',
										paddingTop: '1rem',
										borderTop: '1px solid #e5e7eb',
									}}
								>
									<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Click to explore</span>
									<FiArrowRight style={{ color: '#3b82f6' }} />
								</div>
							</FlowCard>
						))}
					</FlowGrid>
				</CollapsibleHeader>

				<SectionDivider />

				{/* Flow Comparison */}
				<CollapsibleHeader title="Quick Flow Comparison" defaultOpen={false}>
					<ComparisonTable>
						<table>
							<thead>
								<tr>
									<th>Flow</th>
									<th>Security Level</th>
									<th>Use Case</th>
									<th>Tokens Returned</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{oidcFlows.map((flow) => (
									<tr key={flow.id}>
										<td>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<FlowIcon
													$color={flow.color}
													style={{ width: '2rem', height: '2rem', fontSize: '1rem' }}
												>
													<flow.icon />
												</FlowIcon>
												{flow.title}
											</div>
										</td>
										<td>{renderSecurityLevel(flow.securityLevel)}</td>
										<td>{flow.bestFor[0]}</td>
										<td>
											{flow.id === 'authorization-code' && 'Access + ID + Refresh'}
											{flow.id === 'implicit' && 'Access + ID (direct)'}
											{flow.id === 'hybrid' && 'Mixed delivery'}
											{flow.id === 'device-authorization' && 'Access + ID + Refresh'}
											{flow.id === 'client-credentials' && 'Access only'}
											{flow.id === 'refresh-token' && 'New Access + ID'}
											{flow.id === 'ropc' && 'Access + ID + Refresh'}
											{flow.id === 'ciba' && 'Access + ID + Refresh'}
											{flow.id === 'token-exchange' && 'New Access token'}
										</td>
										<td>
											{flow.deprecated ? (
												<span style={{ color: '#f59e0b', fontWeight: '600' }}>Deprecated</span>
											) : (
												<span style={{ color: '#10b981', fontWeight: '600' }}>Recommended</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</ComparisonTable>
				</CollapsibleHeader>

				<SectionDivider />

				{/* OAuth vs OIDC Comparison */}
				{OAuthFlowComparisonService.getComparisonTable({
					highlightFlow: 'oidc',
					collapsed: true,
					title: 'OAuth 2.0 vs OpenID Connect',
				})}

				<SectionDivider />

				{/* Implementation Guidelines */}
				<InfoBox $variant="success" style={{ marginTop: '2rem' }}>
					<FiCheckCircle size={24} />
					<div>
						<InfoTitle>Implementation Best Practices</InfoTitle>
						<ul style={{ margin: '1rem 0', paddingLeft: '1rem' }}>
							<li>
								<strong>Always validate ID tokens:</strong> Verify signature, issuer, audience, and
								expiration
							</li>
							<li>
								<strong>Use PKCE:</strong> Even for confidential clients when possible
							</li>
							<li>
								<strong>Implement proper logout:</strong> Use RP-initiated logout for complete
								session cleanup
							</li>
							<li>
								<strong>Handle token refresh:</strong> Implement proper refresh token rotation
							</li>
							<li>
								<strong>Scope management:</strong> Request only necessary scopes for your
								application
							</li>
						</ul>
						<HelperText>
							💡 <strong>Pro Tip:</strong> Start with Authorization Code Flow + PKCE for most
							applications. It provides the best security and is supported by all modern OIDC
							providers.
						</HelperText>
					</div>
				</InfoBox>
			</ResponsiveContentWrapper>
		</ResponsiveContainer>
	);
};

export default OIDCOverviewV7;
