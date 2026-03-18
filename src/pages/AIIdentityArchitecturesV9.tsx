// src/pages/AIIdentityArchitecturesV9.tsx
// AI Identity Architectures - V9 Standardized Version
// Demonstrates AI identity patterns and architectures with PingOne integration

import React from 'react';
import styled from 'styled-components';
import { V9_COLORS } from '@/services/v9/V9ColorStandards';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';

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

const ArchitectureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 2rem;
	margin: 2rem 0;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	padding: 1.5rem;
`;

const ArchitectureCard = styled.div`
	background: linear-gradient(135deg, ${V9_COLORS.BG.GRAY_LIGHT} 0%, ${V9_COLORS.TEXT.GRAY_LIGHTER} 100%);
	border: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 0.75rem;
	padding: 2rem;
	height: 100%;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
	}

	h3 {
		color: ${V9_COLORS.PRIMARY.BLUE};
		font-size: 1.5rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	ul {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		margin: 1rem 0;
		padding-left: 1.5rem;

		li {
			margin-bottom: 0.5rem;
			line-height: 1.6;
		}
	}
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

const AIIdentityArchitecturesV9: React.FC = () => {
	// Scroll management
	usePageScroll();

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="ai-identity-architectures" />

				<Header>
					<h1>
						<span>🤖</span>
						AI Identity Architectures
					</h1>
					<p>
						Comprehensive patterns and architectures for AI identity management,
						security, and integration with enterprise identity systems.
					</p>
				</Header>

				<CollapsibleHeader
					title="AI Agent Identity Patterns"
					defaultCollapsed={false}
				>
					<ArchitectureGrid>
						<MainCard>
							<ArchitectureCard>
								<h3>
									<span>🔐</span>
									OAuth Assertion Grant
								</h3>
								<p>
									<strong>JWT Bearer Grant for AI Agents</strong> enables secure agent-to-service authentication
									using signed assertions.
								</p>
								<ul>
									<li>Agent authenticates with client credentials</li>
									<li>Exchanges credentials for signed JWT assertion</li>
									<li>Uses assertion to access backend services</li>
									<li>Eliminates need for per-service credential management</li>
								</ul>
								<InfoBox $variant="info">
									<span>📋</span>
									<div>
										<strong>Specification:</strong>{' '}
										<SpecLink href="https://tools.ietf.org/html/rfc7523" target="_blank" rel="noopener noreferrer">
											RFC 7523 - JWT Bearer Token Profiles
										</SpecLink>
									</div>
								</InfoBox>
							</ArchitectureCard>
						</MainCard>

						<MainCard>
							<ArchitectureCard>
								<h3>
									<span>🛡️</span>
									Zero Trust Architecture
								</h3>
								<p>
									<strong>Zero Trust for AI Systems</strong> implements never-trust, always-verify
									principles for AI agent interactions.
								</p>
								<ul>
									<li>Continuous authentication and authorization</li>
									<li>Micro-segmentation of AI services</li>
									<li>Real-time threat detection and response</li>
									<li>Least privilege access for AI agents</li>
								</ul>
								<InfoBox $variant="warning">
									<span>⚠️</span>
									<div>
										<strong>Security Consideration:</strong> AI systems require enhanced monitoring
										and anomaly detection due to their autonomous nature.
									</div>
								</InfoBox>
							</ArchitectureCard>
						</MainCard>
					</ArchitectureGrid>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Enterprise Integration Patterns"
					defaultCollapsed={true}
				>
					<ArchitectureGrid>
						<MainCard>
							<ArchitectureCard>
								<h3>
									<span>🏢</span>
									PingOne Integration
								</h3>
								<p>
									<strong>PingOne AI Identity Services</strong> provides enterprise-grade
									identity management for AI agents and workloads.
								</p>
								<ul>
									<li>Centralized AI agent credential management</li>
									<li>Enterprise SSO for AI applications</li>
									<li>AI workload identity federation</li>
									<li>Compliance and audit logging</li>
								</ul>
								<InfoBox $variant="success">
									<span>✅</span>
									<div>
										<strong>Key Benefits:</strong> Unified identity management across
										human users and AI agents with enterprise security controls.
									</div>
								</InfoBox>
							</ArchitectureCard>
						</MainCard>

						<MainCard>
							<ArchitectureCard>
								<h3>
									<span>🔄</span>
									Federated Identity
								</h3>
								<p>
									<strong>Federated AI Identity</strong> enables cross-domain
									authentication for distributed AI systems.
								</p>
								<ul>
									<li>Cross-organization AI agent trust</li>
									<li>Federated learning identity management</li>
									<li>Inter-cloud AI workload identity</li>
									<li>Standards-based federation protocols</li>
								</ul>
								<InfoBox $variant="info">
									<span>📋</span>
									<div>
										<strong>Specifications:</strong>{' '}
										<SpecLink href="https://openid.net/specs/openid-connect-federation-1_0.html" target="_blank" rel="noopener noreferrer">
											OpenID Connect Federation
										</SpecLink>
									</div>
								</InfoBox>
							</ArchitectureCard>
						</MainCard>
					</ArchitectureGrid>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Security Best Practices"
					defaultCollapsed={true}
				>
					<MainCard>
						<ArchitectureCard>
							<h3>
								<span>🔒</span>
								AI Security Framework
							</h3>
							<p>
								<strong>Comprehensive Security</strong> for AI systems includes
								authentication, authorization, and ongoing monitoring.
							</p>
							<ul>
								<li>Cryptographic attestation of AI models</li>
								<li>Secure AI model deployment and versioning</li>
								<li>AI-specific threat detection and response</li>
								<li>Compliance with AI regulations and standards</li>
								<li>Data privacy and governance for AI systems</li>
							</ul>
							<InfoBox $variant="warning">
								<span>⚠️</span>
								<div>
									<strong>Critical:</strong> AI systems introduce unique security challenges
									including model poisoning, adversarial attacks, and privacy concerns.
								</div>
							</InfoBox>
						</ArchitectureCard>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Implementation Examples"
					defaultCollapsed={true}
				>
					<MainCard>
						<ArchitectureCard>
							<h3>
								<span>💻</span>
								Agent Authentication Flow
							</h3>
							<p>
								<strong>Implementation Pattern</strong> for secure AI agent authentication.
							</p>
							<InfoBox $variant="info">
								<span>📋</span>
								<div>
									<strong>Code Example:</strong> See the{' '}
									<SpecLink href="/flows/v9/saml-sp-dynamic-acs" target="_blank" rel="noopener noreferrer">
										SAML Service Provider V9
									</SpecLink>{' '}
									for implementation patterns and code samples.
								</div>
							</InfoBox>
						</ArchitectureCard>
					</MainCard>
				</CollapsibleHeader>
			</ContentWrapper>
		</Container>
	);
};

export default AIIdentityArchitecturesV9;
