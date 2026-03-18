// src/pages/docs/OIDCForAIV9.tsx
// OIDC for AI - V9 Standardized Version
// OpenID Connect patterns and implementations for AI systems

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

const OIDCForAIV9: React.FC = () => {
	usePageScroll();

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oidc-for-ai" />

				<Header>
					<h1>
						<span>🔑</span>
						OIDC for AI
					</h1>
					<p>
						OpenID Connect patterns and implementations for AI systems authentication,
						authorization, and identity management.
					</p>
				</Header>

				<CollapsibleHeader
					title="AI Authentication Patterns"
					defaultCollapsed={false}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🤖</span>
								AI Agent Authentication
							</h2>
							<InfoBox $variant="info">
								<span>📋</span>
								<div>
									<strong>Pattern:</strong> AI agents can authenticate using OAuth 2.0 Assertion Grant
									with JWT assertions signed by the AI platform or enterprise identity provider.
								</div>
							</InfoBox>
							<LinkGrid>
								<ExternalLink href="https://tools.ietf.org/html/rfc7523" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 7523 - JWT Bearer Token Profiles</LinkTitle>
									<LinkDescription>
										Defines how to use JWTs for OAuth 2.0 bearer token authentication, ideal for AI agent authentication.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="https://openid.net/specs/openid-connect-core-1_0.html" target="_blank" rel="noopener noreferrer">
									<LinkTitle>OpenID Connect Core 1.0</LinkTitle>
									<LinkDescription>
										Core specification for OIDC authentication flows that can be adapted for AI systems.
									</LinkDescription>
								</ExternalLink>
							</LinkGrid>
						</Section>

						<Section>
							<h2>
								<span>🏢</span>
								Enterprise AI Integration
							</h2>
							<InfoBox $variant="success">
								<span>✅</span>
								<div>
									<strong>PingOne Integration:</strong> Enterprise-grade OIDC provider with
									specific features for AI workload identity and agent authentication.
								</div>
							</InfoBox>
							<LinkGrid>
								<ExternalLink href="https://documentation.pingidentity.com/pingone/access/v1/api/" target="_blank" rel="noopener noreferrer">
									<LinkTitle>PingOne OIDC API</LinkTitle>
									<LinkDescription>
										Complete API reference for implementing OIDC authentication with PingOne for AI systems.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="/flows/v9/saml-sp-dynamic-acs" target="_blank" rel="noopener noreferrer">
									<LinkTitle>SAML Service Provider V9</LinkTitle>
									<LinkDescription>
										Implementation example showing enterprise identity patterns for AI systems.
									</LinkDescription>
								</ExternalLink>
							</LinkGrid>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Security Considerations"
					defaultCollapsed={true}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🛡️</span>
								AI-Specific Security
							</h2>
							<InfoBox $variant="warning">
								<span>⚠️</span>
								<div>
									<strong>Critical Considerations:</strong> AI systems require enhanced security
									measures including model attestation, audit trails, and anomaly detection.
								</div>
							</InfoBox>
							<LinkGrid>
								<ExternalLink href="https://tools.ietf.org/html/rfc8705" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 8705 - OAuth 2.0 Mutual TLS Client Authentication</LinkTitle>
									<LinkDescription>
										Enhanced authentication methods suitable for high-security AI workloads.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="https://tools.ietf.org/html/rfc8474" target="_blank" rel="noopener noreferrer">
									<LinkTitle>RFC 8474 - OAuth 2.0 Token Revocation</LinkTitle>
									<LinkDescription>
										Token management for AI systems requiring immediate revocation capabilities.
									</LinkDescription>
								</ExternalLink>
							</LinkGrid>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Implementation Examples"
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
									and other V9 flows for complete implementation patterns.
								</div>
							</InfoBox>
							<SpecCard title="AI Agent OIDC Flow">
								<p>Complete implementation of OIDC authentication for AI agents with assertion grants</p>
								<ul>
									<li>
										<SpecLink href="https://tools.ietf.org/html/rfc7523" target="_blank" rel="noopener noreferrer">
											RFC 7523 - JWT Bearer Token Profiles
										</SpecLink>
									</li>
									<li>
										<SpecLink href="https://openid.net/specs/openid-connect-core-1_0.html" target="_blank" rel="noopener noreferrer">
											OpenID Connect Core 1.0
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

export default OIDCForAIV9;
