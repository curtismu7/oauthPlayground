import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from './Card';

interface FlowCategory {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	useCases: string[];
	flows: OAuthFlow[];
	color: string;
}

interface OAuthFlow {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	security: 'high' | 'medium' | 'low';
	recommended: boolean;
	complexity: 'low' | 'medium' | 'high';
	implementationTime: string;
	useCases: string[];
	route: string;
}

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1.5rem;
`;

const PageHeader = styled.div`
	margin-bottom: 2rem;
	text-align: center;

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: ${({ theme }) => theme.colors.gray900};
		margin-bottom: 1rem;
	}

	p {
		color: ${({ theme }) => theme.colors.gray600};
		font-size: 1.2rem;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}
`;

const CategoryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 2rem;
	margin-bottom: 3rem;
`;

const CategoryCard = styled(Card)<{ $color: string }>`
	border-left: 4px solid ${({ $color }) => $color};
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}
`;

const CategoryHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;

	.category-icon {
		font-size: 2rem;
		color: ${({ theme }) => theme.colors.primary};
	}

	.category-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: ${({ theme }) => theme.colors.gray900};
		margin: 0;
	}
`;

const DifficultyBadge = styled.span<{ $level: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	font-size: 0.75rem;
	font-weight: 500;
	border-radius: 1rem;
	margin-bottom: 1rem;

	${({ $level }) => {
		switch ($level) {
			case 'beginner':
				return `
          background-color: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'intermediate':
				return `
          background-color: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
        `;
			case 'advanced':
				return `
          background-color: V9_COLORS.BG.ERROR;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_DARK;
        `;
		}
	}}
`;

const UseCasesList = styled.div`
	margin-bottom: 1.5rem;

	h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: ${({ theme }) => theme.colors.gray700};
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.use-cases {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.use-case {
		padding: 0.25rem 0.75rem;
		background-color: ${({ theme }) => theme.colors.gray100};
		color: ${({ theme }) => theme.colors.gray700};
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}
`;

const FlowsList = styled.div`
	.flows-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: background-color 0.2s;

		&:hover {
			background-color: ${({ theme }) => theme.colors.gray100};
		}

		h3 {
			font-size: 1rem;
			font-weight: 600;
			color: ${({ theme }) => theme.colors.gray900};
			margin: 0;
		}

		.flow-count {
			font-size: 0.875rem;
			color: ${({ theme }) => theme.colors.gray500};
		}
	}

	.flows-list {
		display: grid;
		gap: 0.75rem;
	}
`;

const FlowItem = styled(Link)`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem;
	border: 1px solid ${({ theme }) => theme.colors.gray200};
	border-radius: 0.5rem;
	text-decoration: none;
	transition: all 0.2s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary};
		background-color: ${({ theme }) => theme.colors.primary}05;
	}

	.flow-icon {
		font-size: 1.25rem;
		color: ${({ theme }) => theme.colors.primary};
	}

	.flow-content {
		flex: 1;

		.flow-title {
			font-size: 0.875rem;
			font-weight: 600;
			color: ${({ theme }) => theme.colors.gray900};
			margin: 0 0 0.25rem 0;
		}

		.flow-meta {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-size: 0.75rem;
			color: ${({ theme }) => theme.colors.gray500};
		}
	}

	.flow-badges {
		display: flex;
		gap: 0.25rem;
	}
`;

const SecurityBadge = styled.span<{ $level: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.125rem;
	padding: 0.125rem 0.5rem;
	font-size: 0.625rem;
	font-weight: 500;
	border-radius: 0.25rem;

	${({ $level }) => {
		switch ($level) {
			case 'high':
				return `
          background-color: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'medium':
				return `
          background-color: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
        `;
			case 'low':
				return `
          background-color: V9_COLORS.BG.ERROR;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_DARK;
        `;
		}
	}}
`;

const RecommendedBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.125rem;
	padding: 0.125rem 0.5rem;
	font-size: 0.625rem;
	font-weight: 500;
	border-radius: 0.25rem;
	background-color: #dbeafe;
	color: V9_COLORS.PRIMARY.BLUE_DARK;
`;

const QuickStartSection = styled.div`
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 3rem;
	color: white;
	text-align: center;

	h2 {
		font-size: 1.875rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.125rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.quick-start-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background-color: white;
		color: #667eea;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		font-size: 1.125rem;
		transition: all 0.2s;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
		}
	}
`;

const flowCategories: FlowCategory[] = [
	{
		id: 'essential',
		title: 'Essential Flows',
		description: 'The most commonly used OAuth flows for modern applications',
		icon: <span>⭐</span>,
		difficulty: 'beginner',
		useCases: ['Web Apps', 'Mobile Apps', 'SPAs', 'Server-to-Server'],
		color: '#10b981',
		flows: [
			{
				id: 'authorization-code-v9',
				title: 'Authorization Code (PKCE)',
				description:
					'Full OAuth/OIDC authorization code flow with PKCE — the recommended choice for all modern apps',
				icon: <span>⭐</span>,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-4 hours',
				useCases: ['Web Apps', 'Mobile Apps', 'SPAs', 'Modern Applications'],
				route: '/flows/oauth-authorization-code-v9',
			},
			{
				id: 'client-credentials-v9',
				title: 'Client Credentials',
				description: 'Machine-to-machine authentication — no user involved',
				icon: <span>👤</span>,
				security: 'high',
				recommended: true,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['Server-to-Server', 'Background Processes', 'API Services'],
				route: '/flows/client-credentials-v9',
			},
			{
				id: 'device-authorization-v9',
				title: 'Device Authorization',
				description: 'For devices with limited input capabilities',
				icon: <span>🕐</span>,
				security: 'medium',
				recommended: true,
				complexity: 'medium',
				implementationTime: '3-5 hours',
				useCases: ['Smart TVs', 'IoT Devices', 'Gaming Consoles'],
				route: '/flows/device-authorization-v9',
			},
			{
				id: 'worker-token-v9',
				title: 'Worker Token',
				description: 'PingOne admin-level machine-to-machine access',
				icon: <span>🔑</span>,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-3 hours',
				useCases: ['Admin Operations', 'PingOne Management', 'System Integration'],
				route: '/flows/worker-token-v9',
			},
		],
	},
	{
		id: 'advanced',
		title: 'Advanced Flows',
		description: 'Specialized flows for high-security and enterprise use cases',
		icon: <span>🔒</span>,
		difficulty: 'intermediate',
		useCases: ['High Security', 'Enterprise', 'Financial APIs'],
		color: '#3b82f6',
		flows: [
			{
				id: 'dpop-v9',
				title: 'DPoP (Proof-of-Possession)',
				description: 'Authorization Code with sender-constrained tokens via DPoP (RFC 9449)',
				icon: <span>🛡️</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['High Security APIs', 'Token Binding', 'Financial Services'],
				route: '/flows/dpop-authorization-code-v9',
			},
			{
				id: 'par-v9',
				title: 'PAR (Pushed Authorization)',
				description: 'Pushed Authorization Requests — send auth params server-to-server (RFC 9126)',
				icon: <span>📤</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '3-5 hours',
				useCases: ['High Security', 'Request Integrity', 'Enterprise'],
				route: '/flows/pingone-par-v9',
			},
			{
				id: 'ciba-v9',
				title: 'CIBA (Backchannel Auth)',
				description:
					'Client-Initiated Backchannel Authentication — decouple consumption and authentication devices',
				icon: <span>📲</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['Call Centers', 'IoT', 'Decoupled Devices'],
				route: '/flows/ciba-v9',
			},
			{
				id: 'oidc-hybrid-v9',
				title: 'OIDC Hybrid Flow',
				description:
					'Combines authorization code and implicit — returns tokens from the authorization endpoint',
				icon: <span>🔄</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['OIDC Apps', 'Enterprise SSO', 'Legacy Migration'],
				route: '/flows/oidc-hybrid-v9',
			},
			{
				id: 'jwt-bearer-v9',
				title: 'JWT Bearer',
				description: 'Uses a JWT assertion to obtain tokens — no user redirect needed (RFC 7523)',
				icon: <span>🛡️</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['Enterprise SSO', 'Federated Identity', 'Service Accounts'],
				route: '/flows/jwt-bearer-token-v9',
			},
			{
				id: 'saml-bearer-v9',
				title: 'SAML Bearer Assertion',
				description: 'Exchange a SAML assertion for OAuth tokens (RFC 7522)',
				icon: <span>🔐</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-8 hours',
				useCases: ['SAML Migration', 'Enterprise Federation', 'Legacy SSO'],
				route: '/flows/saml-bearer-assertion-v9',
			},
			{
				id: 'token-exchange-v9',
				title: 'Token Exchange',
				description: 'Exchange one token for another — delegation and impersonation (RFC 8693)',
				icon: <span>🔁</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '3-5 hours',
				useCases: ['Microservices', 'Delegation', 'Token Downscoping'],
				route: '/flows/token-exchange-v9',
			},
			{
				id: 'ropc-v9',
				title: 'ROPC (Resource Owner Password)',
				description: 'Direct username/password grant — only for trusted first-party clients',
				icon: <span>⚠️</span>,
				security: 'medium',
				recommended: false,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['First-Party Apps', 'Migration', 'Legacy Systems'],
				route: '/flows/oauth-ropc-v9',
			},
		],
	},
	{
		id: 'example',
		title: 'Example Flows',
		description: 'Illustrative flows showing extension specs and real-world patterns',
		icon: <span>📖</span>,
		difficulty: 'intermediate',
		useCases: ['Learning', 'Rich Authorization', 'API Extensions'],
		color: '#f59e0b',
		flows: [
			{
				id: 'rar-v9',
				title: 'RAR (Rich Authorization Requests)',
				description: 'Fine-grained authorization using structured authorization_details (RFC 9396)',
				icon: <span>📋</span>,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['Open Banking', 'Fine-Grained Authz', 'Financial APIs'],
				route: '/flows/rar-v9',
			},
		],
	},
	{
		id: 'legacy',
		title: 'Legacy / Deprecated',
		description: 'Deprecated flows — use only for migration or legacy support',
		icon: <span>⚠️</span>,
		difficulty: 'advanced',
		useCases: ['Legacy Systems', 'Migration'],
		color: '#ef4444',
		flows: [
			{
				id: 'implicit-v9',
				title: 'Implicit Grant (Deprecated)',
				description: 'Simplified flow for client-side apps — superseded by Auth Code + PKCE',
				icon: <span>⚠️</span>,
				security: 'low',
				recommended: false,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['Legacy SPAs', 'Migration Only'],
				route: '/flows/implicit-v9',
			},
		],
	},
	{
		id: 'mock',
		title: 'Mock Flows',
		description: 'Simulated flows — no real credentials needed, great for demos and learning',
		icon: <span>🎭</span>,
		difficulty: 'beginner',
		useCases: ['Learning', 'Demos', 'No Credentials'],
		color: '#6366f1',
		flows: [
			{
				id: 'mock-oauth-authcode',
				title: 'OAuth Authorization Code (Mock)',
				description: 'Simulated OAuth authorization code flow — no PingOne app required',
				icon: <span>🎭</span>,
				security: 'high',
				recommended: true,
				complexity: 'low',
				implementationTime: '< 5 min',
				useCases: ['Learning', 'Demos', 'Presentations'],
				route: '/flows/oauth-authorization-code-v9',
			},
			{
				id: 'mock-oidc-authcode',
				title: 'OIDC Authorization Code (Mock)',
				description: 'Simulated OIDC authorization code flow with ID token',
				icon: <span>🎭</span>,
				security: 'high',
				recommended: false,
				complexity: 'low',
				implementationTime: '< 5 min',
				useCases: ['Learning', 'OIDC Demos'],
				route: '/flows/oidc-authorization-code-v9',
			},
			{
				id: 'mock-device',
				title: 'Device Authorization (Mock)',
				description: 'Simulated device code flow',
				icon: <span>🎭</span>,
				security: 'medium',
				recommended: false,
				complexity: 'low',
				implementationTime: '< 5 min',
				useCases: ['Learning', 'IoT Demos'],
				route: '/flows/device-authorization-v9',
			},
			{
				id: 'mock-client-credentials',
				title: 'Client Credentials (Mock)',
				description: 'Simulated machine-to-machine flow',
				icon: <span>🎭</span>,
				security: 'high',
				recommended: false,
				complexity: 'low',
				implementationTime: '< 5 min',
				useCases: ['Learning', 'API Demos'],
				route: '/flows/client-credentials-v9',
			},
			{
				id: 'mock-implicit',
				title: 'Implicit Flow (Mock)',
				description: 'Simulated implicit grant',
				icon: <span>🎭</span>,
				security: 'low',
				recommended: false,
				complexity: 'low',
				implementationTime: '< 5 min',
				useCases: ['Learning', 'Legacy Demos'],
				route: '/flows/implicit-v9',
			},
			{
				id: 'mock-ropc',
				title: 'ROPC (Mock)',
				description: 'Simulated resource owner password credentials flow',
				icon: <span>🎭</span>,
				security: 'medium',
				recommended: false,
				complexity: 'low',
				implementationTime: '< 5 min',
				useCases: ['Learning', 'Migration Demos'],
				route: '/v7/oauth/ropc',
			},
		],
	},
	{
		id: 'utilities',
		title: 'Utilities',
		description: 'Token management and utility flows',
		icon: <span>🔧</span>,
		difficulty: 'intermediate',
		useCases: ['Token Validation', 'Session Management', 'Security Auditing'],
		color: '#10b981',
		flows: [
			{
				id: 'userinfo',
				title: 'UserInfo',
				description: 'Retrieve user claims using an access token',
				icon: <span>👤</span>,
				security: 'high',
				recommended: true,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['User Profile', 'Claims', 'OIDC'],
				route: '/flows/userinfo',
			},
			{
				id: 'token-management',
				title: 'Token Management',
				description: 'Inspect, revoke, and manage OAuth tokens',
				icon: <span>🛡️</span>,
				security: 'high',
				recommended: true,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['Token Validation', 'Revocation', 'Introspection'],
				route: '/token-management',
			},
			{
				id: 'pingone-logout',
				title: 'PingOne Logout',
				description: 'End session and revoke tokens via PingOne logout endpoint',
				icon: <span>🚪</span>,
				security: 'high',
				recommended: false,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['Session Termination', 'SLO', 'OIDC Logout'],
				route: '/flows/pingone-logout',
			},
		],
	},
	{
		id: 'pingone',
		title: 'PingOne MFA',
		description: 'PingOne Multi-Factor Authentication flows',
		icon: <span>🛡️</span>,
		difficulty: 'intermediate',
		useCases: ['MFA Authentication', 'PingOne Integration', 'Enhanced Security'],
		color: '#8b5cf6',
		flows: [
			{
				id: 'mfa-v8',
				title: 'PingOne MFA',
				description: 'Multi-Factor Authentication with SMS, TOTP, Email, FIDO2, and Push',
				icon: <span>🛡️</span>,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-4 hours',
				useCases: ['MFA', 'Step-Up Auth', 'PingOne Integration'],
				route: '/flows/mfa-v8',
			},
		],
	},
];

const FlowCategories: React.FC = () => {
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(['essential']) // Start with essential flows expanded
	);

	const toggleCategory = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	return (
		<Container>
			<PageHeader>
				<h1>OAuth Flows</h1>
				<p>
					Choose the right OAuth flow for your application. Start with Essential Flows if you're new
					to OAuth, or explore Advanced Flows for specialized use cases.
				</p>
			</PageHeader>

			<QuickStartSection>
				<h2>Quick Start</h2>
				<p>
					New to OAuth? Start with Authorization Code + PKCE — the most secure and widely supported
					flow for modern applications. Or try a Mock Flow with no credentials required.
				</p>
				<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
					<Link to="/flows/oauth-authorization-code-v9" className="quick-start-button">
						<span>⭐</span>
						Authorization Code (Live)
					</Link>
					<Link
						to="/flows/oauth-authorization-code-v9"
						className="quick-start-button"
						style={{
							background: 'rgba(255, 255, 255, 0.2)',
							border: '1px solid rgba(255, 255, 255, 0.3)',
						}}
					>
						<span>🎭</span>
						Try a Mock Flow
					</Link>
					<Link
						to="/v8u/flow-comparison"
						className="quick-start-button"
						style={{
							background: 'rgba(255, 255, 255, 0.2)',
							border: '1px solid rgba(255, 255, 255, 0.3)',
						}}
					>
						<span>🔄</span>
						Compare Flows
					</Link>
				</div>
			</QuickStartSection>

			<CategoryGrid>
				{flowCategories.map((category) => (
					<CategoryCard key={category.id} $color={category.color}>
						<CardHeader>
							<CategoryHeader>
								<div className="category-icon">{category.icon}</div>
								<h2 className="category-title">{category.title}</h2>
							</CategoryHeader>

							<DifficultyBadge $level={category.difficulty}>
								{category.difficulty === 'beginner' && <span>✅</span>}
								{category.difficulty === 'intermediate' && <span>🕐</span>}
								{category.difficulty === 'advanced' && <span>⚠️</span>}
								{category.difficulty}
							</DifficultyBadge>

							<p style={{ color: '#6b7280', marginBottom: '1rem' }}>{category.description}</p>

							<UseCasesList>
								<h4>Best for:</h4>
								<div className="use-cases">
									{category.useCases.map((useCase) => (
										<span key={useCase} className="use-case">
											{useCase}
										</span>
									))}
								</div>
							</UseCasesList>
						</CardHeader>

						<CardBody>
							<FlowsList>
								<button
									type="button"
									className="flows-header"
									onClick={() => toggleCategory(category.id)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											toggleCategory(category.id);
										}
									}}
									aria-expanded={expandedCategories.has(category.id)}
									aria-controls={`flows-${category.id}`}
								>
									<h3>Available Flows</h3>
									<div className="flow-count">
										{category.flows.length} flow{category.flows.length !== 1 ? 's' : ''}
										{expandedCategories.has(category.id) ? <span>⬇️</span> : <span>➡️</span>}
									</div>
								</button>

								{expandedCategories.has(category.id) && (
									<div className="flows-list">
										{category.flows.map((flow) => (
											<FlowItem key={flow.id} to={flow.route}>
												<div className="flow-icon">{flow.icon}</div>
												<div className="flow-content">
													<h4 className="flow-title">{flow.title}</h4>
													<div className="flow-meta">
														<span>{flow.implementationTime}</span>
														<span></span>
														<span>{flow.complexity} complexity</span>
													</div>
												</div>
												<div className="flow-badges">
													<SecurityBadge $level={flow.security}>
														{flow.security} security
													</SecurityBadge>
													{flow.recommended && (
														<RecommendedBadge>
															<span>⭐</span>
															Recommended
														</RecommendedBadge>
													)}
												</div>
											</FlowItem>
										))}
									</div>
								)}
							</FlowsList>
						</CardBody>
					</CategoryCard>
				))}
			</CategoryGrid>
		</Container>
	);
};

export default FlowCategories;
