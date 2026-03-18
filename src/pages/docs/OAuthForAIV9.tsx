// src/pages/docs/OAuthForAIV9.tsx
// OAuth for AI - V9 Standardized Version
// OAuth 2.0 patterns and implementations for AI systems

import React from 'react';
import styled from 'styled-components';
import { V9_COLORS } from '@/services/v9/V9ColorStandards';
import { SpecCard } from '../../components/SpecCard';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';

// V9 Fluid Layout - no hardcoded max-width

const Container = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: linear-gradient(135deg, ${V9_COLORS.BG.GRAY_LIGHT} 0%, ${V9_COLORS.TEXT.GRAY_LIGHTER} 100%);
`;

const ContentWrapper = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;

	h1 {
		font-size: 3rem;
		font-weight: 700;
		color: ${V9_COLORS.PRIMARY.BLUE};
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	p {
		font-size: 1.25rem;
		color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.6;
	}
`;

const Section = styled.section`
	margin-bottom: 3rem;

	h2 {
		font-size: 1.5rem;
		margin-bottom: 1.25rem;
		display: flex;
		align-items: center;
		color: ${V9_COLORS.TEXT.GRAY_DARK};

		svg {
			margin-right: 0.75rem;
			color: ${V9_COLORS.PRIMARY.BLUE};
		}
	}
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	gap: 1rem;
	padding: 1.5rem;
	background: ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			default:
				return '#f8fafc';
		}
	}};
	border: 1px solid
		${(props) => {
			switch (props.$variant) {
				case 'warning':
					return '#fbbf24';
				case 'success':
					return '#10b981';
				case 'error':
					return '#fca5a5';
				default:
					return '#e5e7eb';
			}
		}};
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	font-size: 0.875rem;
	line-height: 1.6;
	color: ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#78350f';
			case 'success':
				return '#059669';
			case 'error':
				return '#dc2626';
			default:
				return '#2563eb';
		}
	}};
`;

const SpecLink = styled.a`
	color: ${V9_COLORS.PRIMARY.BLUE};
	text-decoration: none;
	font-weight: 500;
	transition: color 0.2s ease;

	&:hover {
		color: ${V9_COLORS.PRIMARY.BLUE_DARK};
		text-decoration: underline;
	}
`;

const CompatibilityTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 2rem 0;
	background: white;
	border-radius: 0.5rem;
	overflow: hidden;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	tr:last-child td {
		border-bottom: none;
	}

	td.supported {
		color: #059669;
		font-weight: 600;
	}

	td.partial {
		color: #d97706;
		font-weight: 600;
	}

	td.unsupported {
		color: #dc2626;
		font-weight: 600;
	}
`;

const LinkGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const ExternalLink = styled.a`
	display: block;
	background: white;
	border-radius: 0.5rem;
	box-shadow:
		0 1px 3px 0 rgba(0, 0, 0, 0.1),
		0 1px 2px 0 rgba(0, 0, 0, 0.06);
	padding: 1.5rem;
	transition:
		transform 0.2s,
		box-shadow 0.2s;
	text-decoration: none;
	color: inherit;

	&:hover {
		transform: translateY(-2px);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
`;

const LinkTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin-bottom: 0.5rem;
`;

const LinkDescription = styled.p`
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	line-height: 1.5;
`;

const OAuthForAIV9: React.FC = () => {
	usePageScroll();

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-for-ai" />

				<Header>
					<h1>
						<span>🔗</span>
						OAuth for AI
					</h1>
					<p>
						OAuth 2.0 patterns and implementations for AI systems authentication,
						authorization, and secure API access.
					</p>
				</Header>

				<CollapsibleHeader
					title="OAuth 2.0 for AI Systems"
					defaultCollapsed={false}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🤖</span>
								AI Agent Authorization
							</h2>
							<InfoBox $variant="info">
								<span>📋</span>
								<div>
									<strong>Pattern:</strong> AI agents use OAuth 2.0 Assertion Grant with JWT assertions
									for secure, scalable authorization to backend services and APIs.
								</div>
							</InfoBox>
							<LinkGrid>
								<ExternalLink href="https://tools.ietf.org/html/rfc7523" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 7523 - JWT Bearer Token Profiles</LinkTitle>
									<LinkDescription>
										Defines JWT-based authentication for OAuth 2.0, perfect for AI agent authentication.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="https://tools.ietf.org/html/rfc6749" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 6749 - OAuth 2.0 Framework</LinkTitle>
									<LinkDescription>
										Core OAuth 2.0 specification that forms the foundation for AI system authorization.
									</LinkDescription>
								</ExternalLink>
							</LinkGrid>
						</Section>

						<Section>
							<h2>
								<span>🏢</span>
								PingOne OAuth Integration
							</h2>
							<InfoBox $variant="success">
								<span>✅</span>
								<div>
									<strong>PingOne Integration:</strong> Enterprise OAuth provider with specialized
									features for AI workload authentication and authorization.
								</div>
							</InfoBox>
							<CompatibilityTable>
								<thead>
									<tr>
										<th>OAuth 2.0 Grant Type</th>
										<th>AI System Use Case</th>
										<th>PingOne Support</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Assertion Grant (JWT Bearer)</td>
										<td>AI Agent Authentication</td>
										<td className="supported">✅ Fully Supported</td>
									</tr>
									<tr>
										<td>Client Credentials</td>
										<td>Service-to-AI Communication</td>
										<td className="supported">✅ Fully Supported</td>
									</tr>
									<tr>
										<td>Authorization Code</td>
										<td>Human-in-the-Loop AI</td>
										<td className="supported">✅ Fully Supported</td>
									</tr>
									<tr>
										<td>Resource Owner Password</td>
										<td>Legacy AI Systems</td>
										<td className="partial">⚠️ Deprecated</td>
									</tr>
								</tbody>
							</CompatibilityTable>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI-Specific OAuth Extensions"
					defaultCollapsed={true}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🔧</span>
								Enhanced Security for AI
							</h2>
							<InfoBox $variant="warning">
								<span>⚠️</span>
								<div>
									<strong>Critical Requirements:</strong> AI systems require enhanced OAuth security
									including short-lived tokens, continuous validation, and anomaly detection.
								</div>
							</InfoBox>
							<LinkGrid>
								<ExternalLink href="https://tools.ietf.org/html/rfc8705" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 8705 - Mutual TLS Client Authentication</LinkTitle>
									<LinkDescription>
										Enhanced authentication for high-security AI workloads and model access.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="https://tools.ietf.org/html/rfc8474" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 8474 - Token Revocation</LinkTitle>
									<LinkDescription>
										Immediate token revocation for compromised AI agents or models.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="https://tools.ietf.org/html/rfc8693" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 8693 - Token Exchange</LinkTitle>
									<LinkDescription>
										Token delegation patterns for AI system-to-system communication.
									</LinkDescription>
								</ExternalLink>
							</LinkGrid>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Implementation Patterns"
					defaultCollapsed={true}
				>
					<MainCard>
						<Section>
							<h2>
								<span>💻</span>
								Code Examples
							</h2>
							<InfoBox $variant="info">
								<span>📋</span>
								<div>
									<strong>Implementation:</strong> See the{' '}
									<SpecLink href="/flows/v9/saml-sp-dynamic-acs" target="_blank" rel="noopener noreferrer">
										SAML Service Provider V9
									</SpecLink>{' '}
									and other V9 flows for complete OAuth implementation patterns.
								</div>
							</InfoBox>
							<SpecCard title="AI Agent OAuth Flow">
								<p>Complete implementation of OAuth 2.0 Assertion Grant for AI agents with JWT assertions</p>
								<ul>
									<li>
										<SpecLink href="https://tools.ietf.org/html/rfc7523" target="_blank" rel="noopener noreferrer">
											RFC 7523 - JWT Bearer Token Profiles
										</SpecLink>
									</li>
									<li>
										<SpecLink href="https://tools.ietf.org/html/rfc6749" target="_blank" rel="noopener noreferrer">
											RFC 6749 - OAuth 2.0 Framework
										</SpecLink>
									</li>
									<li>
										<SpecLink href="https://tools.ietf.org/html/rfc8705" target="_blank" rel="noopener noreferrer">
											RFC 8705 - Mutual TLS Client Authentication
										</SpecLink>
									</li>
								</ul>
							</SpecCard>
						</Section>
					</MainCard>
				</CollapsibleHeader>
			</ContentWrapper>
		</Container>
	);
};

export default OAuthForAIV9;
