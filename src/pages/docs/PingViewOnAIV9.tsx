// src/pages/docs/PingViewOnAIV9.tsx
// PingOne AI Perspective - V9 Standardized Version
// PingOne's view on AI identity and authentication

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
		color: ${V9_COLORS.PRIMARY.BLUE_DARK};
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
			color: ${V9_COLORS.PRIMARY.BLUE_DARK};
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

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin: 2rem 0;
`;

const FeatureCard = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	border: 2px solid #e5e7eb;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${V9_COLORS.PRIMARY.BLUE_DARK};
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(34, 197, 94, 0.15);
	}

	h3 {
		color: ${V9_COLORS.PRIMARY.BLUE_DARK};
		font-size: 1.25rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	p {
		color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	ul {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		padding-left: 1.5rem;

		li {
			margin-bottom: 0.5rem;
			line-height: 1.6;
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

const PingViewOnAIV9: React.FC = () => {
	usePageScroll();

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="ping-view-on-ai" />

				<Header>
					<h1>
						<span>🛡️</span>
						PingOne AI Perspective
					</h1>
					<p>
						PingOne's comprehensive approach to AI identity, authentication, and security
						for enterprise AI systems and workloads.
					</p>
				</Header>

				<CollapsibleHeader
					title="PingOne AI Identity Strategy"
					defaultCollapsed={false}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🎯</span>
								Enterprise AI Identity Framework
							</h2>
							<InfoBox $variant="success">
								<span>✅</span>
								<div>
									<strong>PingOne Vision:</strong> Unified identity management that seamlessly
									integrates human users and AI agents under enterprise security controls.
								</div>
							</InfoBox>
							<FeatureGrid>
								<FeatureCard>
									<h3>
										<span>🔐</span>
										AI Workload Identity
									</h3>
									<p>
										Enterprise-grade identity management for AI agents, models, and workloads
										with full lifecycle management.
									</p>
									<ul>
										<li>Credential lifecycle management</li>
										<li>Automated rotation and revocation</li>
										<li>Policy-based access control</li>
										<li>Audit and compliance reporting</li>
									</ul>
								</FeatureCard>

								<FeatureCard>
									<h3>
										<span>🏢</span>
										Federated AI Trust
									</h3>
									<p>
										Cross-organization trust relationships for federated AI systems and
										collaborative machine learning environments.
									</p>
									<ul>
										<li>Inter-domain AI agent authentication</li>
										<li>Federated learning identity</li>
										<li>Cross-cloud workload trust</li>
										<li>Standards-based federation</li>
									</ul>
								</FeatureCard>

								<FeatureCard>
									<h3>
										<span>🛡️</span>
										Zero Trust AI Security
									</h3>
									<p>
										Comprehensive security framework implementing never-trust, always-verify
										principles for AI systems and interactions.
									</p>
									<ul>
										<li>Continuous authentication</li>
										<li>Real-time threat detection</li>
										<li>Anomaly detection for AI behavior</li>
										<li>Automated response capabilities</li>
									</ul>
								</FeatureCard>
							</FeatureGrid>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne AI Product Features"
					defaultCollapsed={true}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🚀</span>
								AI-Specific Capabilities
							</h2>
							<InfoBox $variant="info">
								<span>📋</span>
								<div>
									<strong>Product Integration:</strong> PingOne provides specialized features
									for AI systems including workload identity, advanced authentication, and compliance.
								</div>
							</InfoBox>
							<LinkGrid>
								<ExternalLink href="https://documentation.pingidentity.com/pingone/access/v1/api/" target="_blank" rel="noopener noreferrer">
									<LinkTitle>PingOne Advanced Identity Cloud</LinkTitle>
									<LinkDescription>
										Enterprise identity platform with AI workload support and advanced security features.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="https://documentation.pingidentity.com/pingone/platform/v1/api/" target="_blank" rel="noopener noreferrer">
									<LinkTitle>PingOne Platform APIs</LinkTitle>
									<LinkDescription>
										Complete API suite for AI identity management, authentication, and authorization.
									</LinkDescription>
								</ExternalLink>
								<ExternalLink href="/flows/v9/saml-sp-dynamic-acs" target="_blank" rel="noopener noreferrer">
									<LinkTitle>SAML Service Provider V9</LinkTitle>
									<LinkDescription>
										Implementation example showing PingOne enterprise patterns for AI systems.
									</LinkDescription>
								</ExternalLink>
							</LinkGrid>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Security Best Practices"
					defaultCollapsed={true}
				>
					<MainCard>
						<Section>
							<h2>
								<span>🔒</span>
								AI Security Framework
							</h2>
							<InfoBox $variant="warning">
								<span>⚠️</span>
								<div>
									<strong>Critical Security:</strong> AI systems require enhanced security measures
									including model integrity, data privacy, and continuous monitoring.
								</div>
							</InfoBox>
							<FeatureGrid>
								<FeatureCard>
									<h3>
										<span>🔍</span>
										Model Integrity
									</h3>
									<p>
										Cryptographic attestation and verification of AI models to ensure
										authenticity and prevent tampering.
									</p>
								</FeatureCard>

								<FeatureCard>
									<h3>
										<span>📊</span>
										Data Privacy
									</h3>
									<p>
										Comprehensive data governance and privacy controls for AI training
										data and inference outputs.
									</p>
								</FeatureCard>

								<FeatureCard>
									<h3>
										<span>🚨</span>
										Threat Detection
									</h3>
									<p>
										AI-specific threat detection including adversarial attacks, model
										poisoning, and anomalous behavior.
									</p>
								</FeatureCard>
							</FeatureGrid>
						</Section>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Implementation Resources"
					defaultCollapsed={true}
				>
					<MainCard>
						<Section>
							<h2>
								<span>💻</span>
								Code Examples & Documentation
							</h2>
							<InfoBox $variant="info">
								<span>📋</span>
								<div>
									<strong>Implementation:</strong> See the{' '}
									<SpecLink href="/flows/v9/saml-sp-dynamic-acs" target="_blank" rel="noopener noreferrer">
										SAML Service Provider V9
									</SpecLink>{' '}
									and other V9 flows for complete PingOne AI implementation patterns.
								</div>
							</InfoBox>
							<SpecCard title="PingOne AI Integration">
								<p>Complete implementation of PingOne AI identity and authentication patterns</p>
								<ul>
									<li>
										<SpecLink href="https://documentation.pingidentity.com/pingone/access/v1/api/" target="_blank" rel="noopener noreferrer">
											PingOne Advanced Identity Cloud API
										</SpecLink>
									</li>
									<li>
										<SpecLink href="https://apidocs.pingidentity.com/pingone/platform/v1/api/" target="_blank" rel="noopener noreferrer">
											PingOne Platform API Documentation
										</SpecLink>
									</li>
									<li>
										<SpecLink href="/ai-identity-architectures" target="_blank" rel="noopener noreferrer">
											AI Identity Architectures V9
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

export default PingViewOnAIV9;
