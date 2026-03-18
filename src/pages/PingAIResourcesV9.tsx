// src/pages/PingAIResourcesV9.tsx
// Ping Identity AI Resources - V9 Standardized Version
// Comprehensive collection of AI-related documentation and resources

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

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const ResourceGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const ResourceCard = styled.a`
	background: linear-gradient(135deg, ${V9_COLORS.TEXT.WHITE} 0%, ${V9_COLORS.BG.GRAY_LIGHT} 100%);
	border: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 0.75rem;
	padding: 1.5rem;
	text-decoration: none;
	color: inherit;
	transition: all 0.3s ease;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;

	&:hover {
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
	}

	h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	p {
		color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
		line-height: 1.6;
		margin: 0;
		flex-grow: 1;
	}

	.icon {
		font-size: 2rem;
		line-height: 1;
	}

	.external-link {
		color: ${V9_COLORS.PRIMARY.BLUE};
		font-weight: 500;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
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

const PingAIResourcesV9: React.FC = () => {
	// Scroll management
	usePageScroll();

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="ping-ai-resources" />

				<Header>
					<h1>
						<span>🖥️</span>
						Ping AI Resources
					</h1>
					<p>
						Comprehensive collection of Ping Identity AI documentation, resources,
						and implementation guides for enterprise AI identity solutions.
					</p>
				</Header>

				<CollapsibleHeader
					title="AI Identity Fundamentals"
					defaultCollapsed={false}
				>
					<MainCard>
						<ResourceGrid>
							<ResourceCard
								href="https://www.pingidentity.com/en/resources/identity-fundamentals/types-of-ai-agents.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🤖</span>
								</div>
								<h3>
									Types of AI Agents
									<span>🔗</span>
								</h3>
								<p>
									Comprehensive overview of different AI agent types, their characteristics,
									and identity requirements for enterprise implementations.
								</p>
								<span className="external-link">
									Learn More <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://lucid.app/lucidchart/2be69334-7596-4681-93f4-9403a201398d/edit?viewport_loc=-821%2C-195%2C2992%2C1552%2C0_0&invitationId=inv_87c5ac77-3255-437b-9f7e-d5713b3b7d07"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🏗️</span>
								</div>
								<h3>
									AI Identity Architecture
									<span>🔗</span>
								</h3>
								<p>
									Visual architecture diagram showing AI identity system components, flows, and
									integration patterns in enterprise environments.
								</p>
								<span className="external-link">
									View Diagram <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="/ai-identity-architectures"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🔐</span>
								</div>
								<h3>
									AI Identity Patterns
									<span>🔗</span>
								</h3>
								<p>
									Detailed implementation patterns and best practices for AI identity
									management, authentication, and authorization.
								</p>
								<span className="external-link">
									View Patterns <span>🔗</span>
								</span>
							</ResourceCard>
						</ResourceGrid>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne AI Solutions"
					defaultCollapsed={true}
				>
					<MainCard>
						<ResourceGrid>
							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone/page/adaptive-authentication.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🛡️</span>
								</div>
								<h3>
									Adaptive Authentication
									<span>🔗</span>
								</h3>
								<p>
									Learn how PingOne uses AI and machine learning to provide adaptive authentication,
									dynamically adjusting security measures based on risk assessment.
								</p>
								<span className="external-link">
									View Documentation <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="/docs/ping-view-on-ai"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🎯</span>
								</div>
								<h3>
									PingOne AI Perspective
									<span>🔗</span>
								</h3>
								<p>
									PingOne's comprehensive approach to AI identity, authentication, and security
									for enterprise AI systems and workloads.
								</p>
								<span className="external-link">
									View Perspective <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://www.pingidentity.com/en/resources/blog/post/ai-identity-security.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🔒</span>
								</div>
								<h3>
									AI Identity Security
									<span>🔗</span>
								</h3>
								<p>
									Security best practices and guidelines for implementing identity solutions in
									AI-powered applications and protecting AI systems from identity-based attacks.
								</p>
								<span className="external-link">
									Read Article <span>🔗</span>
								</span>
							</ResourceCard>
						</ResourceGrid>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Agentic AI & Identity"
					defaultCollapsed={true}
				>
					<MainCard>
						<ResourceGrid>
							<ResourceCard
								href="https://www.pingidentity.com/en/resources/identity-fundamentals/agentic-ai.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🧠</span>
								</div>
								<h3>
									Understanding Agentic AI
									<span>🔗</span>
								</h3>
								<p>
									Comprehensive guide to agentic AI systems, their identity requirements,
									and implementation considerations for enterprise environments.
								</p>
								<span className="external-link">
									Learn More <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="/docs/oauth-for-ai"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🔗</span>
								</div>
								<h3>
									OAuth for AI Systems
									<span>🔗</span>
								</h3>
								<p>
									OAuth 2.0 patterns and implementations specifically designed for AI systems,
									including assertion grants and workload identity.
								</p>
								<span className="external-link">
									View Guide <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="/docs/oidc-for-ai"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>🔑</span>
								</div>
								<h3>
									OIDC for AI Applications
									<span>🔗</span>
								</h3>
								<p>
									OpenID Connect implementations for AI applications, including authentication
									flows and identity management for AI agents.
								</p>
								<span className="external-link">
									View Implementation <span>🔗</span>
								</span>
							</ResourceCard>
						</ResourceGrid>
					</MainCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Developer Resources"
					defaultCollapsed={true}
				>
					<MainCard>
						<ResourceGrid>
							<ResourceCard
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>📚</span>
								</div>
								<h3>
									PingOne Platform API
									<span>🔗</span>
								</h3>
								<p>
									Complete API documentation for PingOne Platform services, including AI workload
									identity and authentication endpoints.
								</p>
								<span className="external-link">
									View API Docs <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone/page/zho1563794995833.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>⚙️</span>
								</div>
								<h3>
									OAuth 2.0 Configuration Guide
									<span>🔗</span>
								</h3>
								<p>
									Step-by-step configuration guide for setting up OAuth 2.0 and OpenID Connect in
									PingOne for AI applications and workloads.
								</p>
								<span className="external-link">
									View Guide <span>🔗</span>
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://support.pingidentity.com/s/"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<span>💬</span>
								</div>
								<h3>
									Ping Identity Support
									<span>🔗</span>
								</h3>
								<p>
									Access Ping Identity's support portal for technical assistance, knowledge base
									articles, community forums, and AI-specific support.
								</p>
								<span className="external-link">
									Get Support <span>🔗</span>
								</span>
							</ResourceCard>
						</ResourceGrid>
					</MainCard>
				</CollapsibleHeader>

				<InfoBox $variant="info">
					<span>🚀</span>
					<div>
						<strong>Getting Started:</strong> Begin with the "Types of AI Agents" document to
						understand different AI agent architectures. Then explore the PingOne AI-powered
						identity documentation for implementation guidance. Use the developer resources
						section for API references and configuration guides.
					</div>
				</InfoBox>
			</ContentWrapper>
		</Container>
	);
};

export default PingAIResourcesV9;
