import {
	FiAlertTriangle,
	FiBookOpen,
	FiCheckCircle,
	FiCode,
	FiCpu,
	FiExternalLink,
	FiGlobe,
	FiKey,
	FiShield,
	FiUsers,
	FiZap,
} from '@icons';
import React from 'react';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import { PageLayoutService } from '../../services/pageLayoutService';

// Use V6 services for common components
const Card = FlowUIService.getMainCard();
const InfoBox = FlowUIService.getInfoBox();

// Keep page-specific custom components
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #3b82f6;
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

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
`;

const FeatureCard = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #2563eb;
  }
`;

const PingViewOnAI: React.FC = () => {
	usePageScroll({ pageName: 'Ping View on AI', force: true });

	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'ping-view-on-ai',
	};
	const { PageContainer, ContentWrapper, PageHeader } =
		PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{PageHeader && <PageHeader />}
				<Header>
					<h1>
						<FiCpu />
						Ping View on AI
					</h1>
					<p>
						Ping Identity's comprehensive perspective on Artificial Intelligence in identity and
						access management
					</p>
				</Header>

				<CollapsibleHeader
					title="AI Resources & Documentation"
					subtitle="Comprehensive resources for implementing AI-powered identity solutions"
					icon={<FiBookOpen />}
					theme="highlight"
					defaultCollapsed={false}
				>
					<Card
						style={{ backgroundColor: '#f8fafc', border: '2px solid #3b82f6', padding: '2rem' }}
					>
						<ul
							style={{
								listStyle: 'disc',
								paddingLeft: '2rem',
								fontSize: '1.1rem',
								lineHeight: '2',
								margin: 0,
							}}
						>
							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://developer.pingidentity.com/identity-for-ai/index.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiCode />
									Identity for AI (Developer Guide)
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://docs.pingidentity.com/bundle/pingone/page/ai-powered-identity.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiBookOpen />
									PingOne AI Documentation
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://www.pingidentity.com/en/resources/identity-fundamentals/agentic-ai.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiCpu />
									Agentic AI Guide
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://docs.pingidentity.com/bundle/pingone/page/adaptive-authentication.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiShield />
									Adaptive Authentication
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://www.pingidentity.com/en/resources/blog/post/ai-identity-security.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiExternalLink />
									AI Security Best Practices
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://cloud.google.com/blog/topics/threat-intelligence/threat-actor-usage-of-ai-tools"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiShield />
									Google Threat Intelligence: AI Tools Misuse Report
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://pingidentity.atlassian.net/wiki/x/NwA7bQ"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiCpu />
									Ping on AI Group (Atlassian Wiki)
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://lucid.app/lucidchart/09ba5245-acf3-4b29-8974-5ecd8f91294b/edit?viewport_loc=-832%2C-207%2C3034%2C1574%2C0_0&invitationId=inv_e47f786c-4f65-4673-897a-2f207e205f45"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiCpu />
									AI Identity Architecture Diagram (Lucidchart)
								</ExternalLink>
							</li>

							<li style={{ marginBottom: '1rem' }}>
								<ExternalLink
									href="https://lucid.app/lucidchart/2be69334-7596-4681-93f4-9403a201398d/edit?viewport_loc=-821%2C-195%2C2992%2C1552%2C0_0&invitationId=inv_87c5ac77-3255-437b-9f7e-d5713b3b7d07"
									target="_blank"
									rel="noopener noreferrer"
									style={{ fontSize: '1.1rem', fontWeight: '500' }}
								>
									<FiCpu />
									AI Identity Flow Diagram (Lucidchart)
								</ExternalLink>
							</li>
						</ul>

						<InfoBox $variant="info" style={{ marginTop: '2rem', padding: '1.5rem' }}>
							<FiCpu size={24} />
							<div style={{ fontSize: '1.1rem' }}>
								<strong>Getting Started:</strong> Begin with our AI readiness assessment to
								understand your organization's current capabilities and identify the best starting
								point for AI implementation.
							</div>
						</InfoBox>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI in Identity & Access Management"
					subtitle="How AI is transforming the identity landscape and Ping's strategic approach"
					icon={<FiShield />}
					defaultCollapsed={false}
				>
					<Card>
						<p>
							Artificial Intelligence is revolutionizing how organizations approach identity and
							access management. Ping Identity recognizes AI as both an opportunity and a challenge,
							requiring new approaches to security, user experience, and identity verification.
						</p>

						<InfoBox $variant="info">
							<FiCpu size={20} />
							<div>
								<strong>Ping's AI Vision:</strong> We believe AI should enhance security while
								maintaining user privacy and regulatory compliance. Our approach focuses on
								AI-powered identity solutions that are secure, transparent, and user-centric.
							</div>
						</InfoBox>

						<FeatureGrid>
							<FeatureCard>
								<h3>
									<FiShield />
									AI-Enhanced Security
								</h3>
								<p>
									Leverage machine learning for threat detection, anomaly detection, and adaptive
									authentication to protect against sophisticated attacks.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiUsers />
									Intelligent User Experience
								</h3>
								<p>
									Use AI to personalize authentication flows, predict user needs, and provide
									seamless access experiences across all touchpoints.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiKey />
									Smart Identity Verification
								</h3>
								<p>
									Implement AI-powered identity verification that adapts to risk levels and provides
									frictionless authentication for legitimate users.
								</p>
							</FeatureCard>
						</FeatureGrid>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI-Powered Identity Solutions"
					subtitle="Ping's comprehensive AI-driven identity management capabilities"
					icon={<FiZap />}
					defaultCollapsed={false}
				>
					<Card>
						<h3>Core AI Capabilities</h3>

						<FeatureGrid>
							<FeatureCard>
								<h3>
									<FiShield />
									Adaptive Authentication
								</h3>
								<p>
									AI-driven risk assessment that continuously evaluates user behavior, device
									characteristics, and contextual factors to determine appropriate authentication
									requirements.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiCpu />
									Behavioral Analytics
								</h3>
								<p>
									Machine learning models that analyze user patterns, access patterns, and
									behavioral indicators to detect anomalies and potential security threats.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiGlobe />
									Intelligent Access Management
								</h3>
								<p>
									AI-powered access decisions that consider user roles, resource sensitivity, and
									risk factors to provide dynamic, context-aware access control.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiUsers />
									Personalized User Experience
								</h3>
								<p>
									AI-driven personalization that adapts authentication flows, UI elements, and user
									journeys based on individual user preferences and behavior patterns.
								</p>
							</FeatureCard>
						</FeatureGrid>

						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<strong>Enterprise Ready:</strong> All AI capabilities are designed for enterprise
								environments with built-in compliance, audit trails, and governance controls.
							</div>
						</InfoBox>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI Security & Privacy Considerations"
					subtitle="Ensuring AI implementations maintain security and privacy standards"
					icon={<FiShield />}
					defaultCollapsed={false}
				>
					<Card>
						<h3>Security-First AI Approach</h3>

						<FeatureGrid>
							<FeatureCard>
								<h3>
									<FiShield />
									Data Protection
								</h3>
								<p>
									All AI models are trained on anonymized data with strict data governance policies.
									No personally identifiable information is used in model training.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiKey />
									Model Security
								</h3>
								<p>
									AI models are secured with encryption, access controls, and regular security
									audits. Model integrity is continuously monitored and validated.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiGlobe />
									Privacy by Design
								</h3>
								<p>
									AI implementations follow privacy-by-design principles with data minimization,
									purpose limitation, and user consent management.
								</p>
							</FeatureCard>

							<FeatureCard>
								<h3>
									<FiUsers />
									Transparent AI
								</h3>
								<p>
									AI decisions are explainable and auditable. Users and administrators can
									understand how AI models make decisions and access detailed audit logs.
								</p>
							</FeatureCard>
						</FeatureGrid>

						<InfoBox $variant="warning">
							<FiAlertTriangle size={20} />
							<div>
								<strong>Compliance Ready:</strong> All AI features are designed to meet GDPR, CCPA,
								and other privacy regulations with built-in data protection and user rights
								management.
							</div>
						</InfoBox>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI Implementation Strategy"
					subtitle="How to successfully implement AI-powered identity solutions"
					icon={<FiBookOpen />}
					defaultCollapsed={false}
				>
					<Card>
						<h3>Implementation Phases</h3>

						<div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
							<div
								style={{
									padding: '1.5rem',
									background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
									border: '2px solid #0ea5e9',
									borderRadius: '0.75rem',
								}}
							>
								<h4
									style={{
										fontSize: '1.125rem',
										fontWeight: '600',
										marginBottom: '0.5rem',
										color: '#0369a1',
									}}
								>
									Phase 1: Foundation
								</h4>
								<p style={{ color: '#0369a1', marginBottom: '1rem' }}>
									Establish data governance, privacy controls, and baseline security measures before
									implementing AI features.
								</p>
								<ul style={{ color: '#0369a1', paddingLeft: '1.25rem' }}>
									<li>Data classification and governance policies</li>
									<li>Privacy impact assessments</li>
									<li>Security baseline establishment</li>
									<li>Compliance framework setup</li>
								</ul>
							</div>

							<div
								style={{
									padding: '1.5rem',
									background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
									border: '2px solid #22c55e',
									borderRadius: '0.75rem',
								}}
							>
								<h4
									style={{
										fontSize: '1.125rem',
										fontWeight: '600',
										marginBottom: '0.5rem',
										color: '#15803d',
									}}
								>
									Phase 2: Pilot Implementation
								</h4>
								<p style={{ color: '#15803d', marginBottom: '1rem' }}>
									Start with low-risk AI features in controlled environments to validate
									effectiveness and security.
								</p>
								<ul style={{ color: '#15803d', paddingLeft: '1.25rem' }}>
									<li>Behavioral analytics pilot</li>
									<li>Adaptive authentication testing</li>
									<li>User experience optimization</li>
									<li>Performance monitoring</li>
								</ul>
							</div>

							<div
								style={{
									padding: '1.5rem',
									background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
									border: '2px solid #f59e0b',
									borderRadius: '0.75rem',
								}}
							>
								<h4
									style={{
										fontSize: '1.125rem',
										fontWeight: '600',
										marginBottom: '0.5rem',
										color: '#92400e',
									}}
								>
									Phase 3: Full Deployment
								</h4>
								<p style={{ color: '#92400e', marginBottom: '1rem' }}>
									Roll out AI capabilities across the organization with comprehensive monitoring and
									governance.
								</p>
								<ul style={{ color: '#92400e', paddingLeft: '1.25rem' }}>
									<li>Enterprise-wide AI deployment</li>
									<li>Continuous monitoring and optimization</li>
									<li>User training and adoption</li>
									<li>Ongoing compliance management</li>
								</ul>
							</div>
						</div>
					</Card>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default PingViewOnAI;
