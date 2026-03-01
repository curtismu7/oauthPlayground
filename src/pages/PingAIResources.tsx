// src/pages/PingAIResources.tsx
// Ping Identity AI Resources - Comprehensive collection of AI-related documentation and resources

import {
	FiBookOpen,
	FiCode,
	FiCpu,
	FiDatabase,
	FiExternalLink,
	FiHelpCircle,
	FiShield,
	FiTool,
	FiUsers,
} from '@icons';
import React from 'react';
import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowUIService } from '../services/flowUIService';
import { PageLayoutService } from '../services/pageLayoutService';

const Card = FlowUIService.getMainCard();
const InfoBox = FlowUIService.getInfoBox();

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
`;

const ResourceCard = styled.a`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
  }

  .icon {
    color: #3b82f6;
    font-size: 1.5rem;
  }

  .external-link {
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #3b82f6;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: #6b7280;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const PingAIResources: React.FC = () => {
	usePageScroll({ pageName: 'Ping AI Resources', force: true });

	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'purple' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'ping-ai-resources',
	};
	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

				<Header>
					<h1>
						<FiCpu />
						Ping Identity AI Resources
					</h1>
					<p>
						Comprehensive collection of Ping Identity's AI-related documentation, guides, and
						resources for implementing AI-powered identity solutions
					</p>
				</Header>

				<CollapsibleHeader
					title="AI Agent Types & Architecture"
					subtitle="Understanding different types of AI agents and their identity requirements"
					icon={<FiCpu />}
					theme="purple"
					defaultCollapsed={false}
				>
					<Card>
						<ResourceGrid>
							<ResourceCard
								href="https://pingidentity.atlassian.net/wiki/spaces/KRIFA/pages/1852276785/DRAFT+-+Types+of+agents"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiDatabase />
								</div>
								<h3>
									Types of Agents
									<FiExternalLink size={16} />
								</h3>
								<p>
									Comprehensive guide to different types of AI agents and their specific identity
									and authentication requirements. Learn about agent architectures, capabilities,
									and how OAuth/OIDC applies to each type.
								</p>
								<span className="external-link">
									View Document <FiExternalLink size={14} />
								</span>
							</ResourceCard>
						</ResourceGrid>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI Identity Documentation"
					subtitle="Official Ping Identity documentation for AI-powered identity solutions"
					icon={<FiBookOpen />}
					theme="blue"
					defaultCollapsed={false}
				>
					<Card>
						<ResourceGrid>
							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone/page/ai-powered-identity.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiBookOpen />
								</div>
								<h3>
									PingOne AI-Powered Identity
									<FiExternalLink size={16} />
								</h3>
								<p>
									Official PingOne documentation for AI-powered identity solutions, including
									configuration, best practices, and implementation guides.
								</p>
								<span className="external-link">
									View Documentation <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://developer.pingidentity.com/identity-for-ai/index.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiCode />
								</div>
								<h3>
									Identity for AI Developer Guide
									<FiExternalLink size={16} />
								</h3>
								<p>
									Developer-focused guide for implementing identity solutions in AI applications,
									including code samples, API references, and integration patterns.
								</p>
								<span className="external-link">
									View Guide <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://pingidentity.atlassian.net/wiki/x/NwA7bQ"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiCpu />
								</div>
								<h3>
									Ping on AI Group (Atlassian Wiki)
									<FiExternalLink size={16} />
								</h3>
								<p>
									Internal Ping Identity wiki page covering AI group perspectives, strategies, and
									resources for AI-powered identity solutions.
								</p>
								<span className="external-link">
									View Wiki <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://lucid.app/lucidchart/09ba5245-acf3-4b29-8974-5ecd8f91294b/edit?viewport_loc=-832%2C-207%2C3034%2C1574%2C0_0&invitationId=inv_e47f786c-4f65-4673-897a-2f207e205f45"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiCpu />
								</div>
								<h3>
									AI Identity Architecture Diagram
									<FiExternalLink size={16} />
								</h3>
								<p>
									Visual architecture diagram showing AI identity system components, flows, and
									integration patterns in Lucidchart.
								</p>
								<span className="external-link">
									View Diagram <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://lucid.app/lucidchart/2be69334-7596-4681-93f4-9403a201398d/edit?viewport_loc=-821%2C-195%2C2992%2C1552%2C0_0&invitationId=inv_87c5ac77-3255-437b-9f7e-d5713b3b7d07"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiCpu />
								</div>
								<h3>
									AI Identity Flow Diagram
									<FiExternalLink size={16} />
								</h3>
								<p>
									Detailed flow diagram illustrating AI identity authentication and authorization
									processes in Lucidchart.
								</p>
								<span className="external-link">
									View Diagram <FiExternalLink size={14} />
								</span>
							</ResourceCard>
						</ResourceGrid>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI Security & Best Practices"
					subtitle="Security considerations and best practices for AI identity implementations"
					icon={<FiShield />}
					theme="red"
					defaultCollapsed={false}
				>
					<Card>
						<ResourceGrid>
							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone/page/adaptive-authentication.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiShield />
								</div>
								<h3>
									Adaptive Authentication
									<FiExternalLink size={16} />
								</h3>
								<p>
									Learn how PingOne uses AI and machine learning to provide adaptive authentication,
									dynamically adjusting security measures based on risk assessment.
								</p>
								<span className="external-link">
									View Documentation <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://www.pingidentity.com/en/resources/blog/post/ai-identity-security.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiShield />
								</div>
								<h3>
									AI Identity Security Best Practices
									<FiExternalLink size={16} />
								</h3>
								<p>
									Security best practices and guidelines for implementing identity solutions in
									AI-powered applications and protecting AI systems from identity-based attacks.
								</p>
								<span className="external-link">
									View Article <FiExternalLink size={14} />
								</span>
							</ResourceCard>
						</ResourceGrid>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Agentic AI & Identity"
					subtitle="Resources for understanding and implementing agentic AI with proper identity management"
					icon={<FiUsers />}
					theme="green"
					defaultCollapsed={false}
				>
					<Card>
						<ResourceGrid>
							<ResourceCard
								href="https://www.pingidentity.com/en/resources/identity-fundamentals/agentic-ai.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiUsers />
								</div>
								<h3>
									Agentic AI Guide
									<FiExternalLink size={16} />
								</h3>
								<p>
									Comprehensive guide to agentic AI, understanding how autonomous AI agents work and
									how identity and access management applies to agentic AI systems.
								</p>
								<span className="external-link">
									View Guide <FiExternalLink size={14} />
								</span>
							</ResourceCard>
						</ResourceGrid>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Ping Identity Developer Resources"
					subtitle="Essential Ping Identity documentation, APIs, SDKs, and configuration guides"
					icon={<FiTool />}
					theme="orange"
					defaultCollapsed={false}
				>
					<Card>
						<ResourceGrid>
							<ResourceCard
								href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiCode />
								</div>
								<h3>
									PingOne API Documentation
									<FiExternalLink size={16} />
								</h3>
								<p>
									Complete API reference for PingOne authentication services, including OAuth 2.0
									and OpenID Connect endpoints, request/response formats, and authentication
									methods.
								</p>
								<span className="external-link">
									View API Docs <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://docs.pingidentity.com/sdks/latest/sdks/index.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiCode />
								</div>
								<h3>
									PingOne SDKs
									<FiExternalLink size={16} />
								</h3>
								<p>
									Official PingOne SDKs for multiple programming languages and platforms, including
									JavaScript, Python, Java, .NET, and mobile SDKs for iOS and Android.
								</p>
								<span className="external-link">
									View SDKs <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone-oauth-20/page/lyc1469003009669.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiShield />
								</div>
								<h3>
									PingOne OAuth 2.0 Documentation
									<FiExternalLink size={16} />
								</h3>
								<p>
									Comprehensive guide to configuring and implementing OAuth 2.0 with PingOne,
									including grant types, token management, and security best practices.
								</p>
								<span className="external-link">
									View Guide <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone-openidconnect/page/lyc1469003009669.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiShield />
								</div>
								<h3>
									PingOne OpenID Connect Documentation
									<FiExternalLink size={16} />
								</h3>
								<p>
									Complete OpenID Connect implementation guide for PingOne, covering ID tokens, user
									information, discovery, and OIDC-specific features.
								</p>
								<span className="external-link">
									View Guide <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://docs.pingidentity.com/en/cloud/configure-oauth-openid-connect.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiTool />
								</div>
								<h3>
									Configure OAuth/OpenID Connect
									<FiExternalLink size={16} />
								</h3>
								<p>
									Step-by-step configuration guide for setting up OAuth 2.0 and OpenID Connect in
									PingOne, including application creation, scope configuration, and endpoint setup.
								</p>
								<span className="external-link">
									View Guide <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://docs.pingidentity.com/bundle/pingone/page/lyc1469003009660.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiShield />
								</div>
								<h3>
									PingOne SSO Configuration Guide
									<FiExternalLink size={16} />
								</h3>
								<p>
									Complete guide to configuring Single Sign-On (SSO) with PingOne, including
									application integration, identity provider setup, and user experience
									configuration.
								</p>
								<span className="external-link">
									View Guide <FiExternalLink size={14} />
								</span>
							</ResourceCard>

							<ResourceCard
								href="https://support.pingidentity.com/s/"
								target="_blank"
								rel="noopener noreferrer"
							>
								<div className="icon">
									<FiHelpCircle />
								</div>
								<h3>
									Ping Identity Support
									<FiExternalLink size={16} />
								</h3>
								<p>
									Access Ping Identity's support portal for technical assistance, knowledge base
									articles, community forums, and support ticket submission.
								</p>
								<span className="external-link">
									Visit Support <FiExternalLink size={14} />
								</span>
							</ResourceCard>
						</ResourceGrid>
					</Card>
				</CollapsibleHeader>

				<InfoBox $variant="info" style={{ marginTop: '2rem' }}>
					<FiCpu size={20} />
					<div>
						<strong>Getting Started:</strong> Begin with the "Types of Agents" document to
						understand different AI agent architectures. Then explore the PingOne AI-powered
						identity documentation for implementation guidance and best practices. Use the developer
						resources section for API references and configuration guides.
					</div>
				</InfoBox>
			</ContentWrapper>
		</PageContainer>
	);
};

export default PingAIResources;
