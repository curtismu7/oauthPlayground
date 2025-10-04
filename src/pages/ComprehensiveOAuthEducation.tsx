import React from 'react';
import styled from 'styled-components';
import {
	FiBook,
	FiShield,
	FiKey,
	FiGlobe,
	FiUsers,
	FiCheckCircle,
	FiArrowRight,
} from 'react-icons/fi';
import { FlowHeader } from '../services/flowHeaderService';
import { usePageScroll } from '../hooks/usePageScroll';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: #1f2937;
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

const EducationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const EducationCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: #6b7280;
    line-height: 1.6;
  }
`;

const TopicList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TopicItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.875rem;

  &:last-child {
    border-bottom: none;
  }

  svg {
    color: #10b981;
    flex-shrink: 0;
  }
`;

const ActionButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #2563eb;
  }
`;

const FlowSection = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const FlowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  p {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
`;

const ComprehensiveOAuthEducation: React.FC = () => {
	usePageScroll({ pageName: 'Comprehensive OAuth Education', force: true });

	const educationTopics = [
		{
			title: 'OAuth 2.0 Fundamentals',
			icon: <FiShield />,
			topics: [
				'Authorization vs Authentication',
				'OAuth 2.0 Roles & Actors',
				'Access Tokens & Refresh Tokens',
				'Authorization Code Flow',
				'Implicit Flow & Security Considerations',
				'Client Credentials Flow',
				'Resource Owner Password Flow',
			],
		},
		{
			title: 'OpenID Connect (OIDC)',
			icon: <FiKey />,
			topics: [
				'OIDC vs OAuth 2.0',
				'ID Tokens & Claims',
				'UserInfo Endpoint',
				'OIDC Discovery',
				'Hybrid Flow',
				'Session Management',
				'Logout & End Session',
			],
		},
		{
			title: 'Security Best Practices',
			icon: <FiShield />,
			topics: [
				'PKCE (Proof Key for Code Exchange)',
				'State Parameter Validation',
				'Token Storage Security',
				'HTTPS Requirements',
				'Scope Limitations',
				'Token Expiration',
				'Refresh Token Rotation',
			],
		},
		{
			title: 'Modern Standards',
			icon: <FiGlobe />,
			topics: [
				'OAuth 2.1 Updates',
				'Pushed Authorization Requests (PAR)',
				'Device Authorization Grant',
				'JWT Bearer Token Flow',
				'Rich Authorization Requests (RAR)',
				'FAPI (Financial-grade API)',
				'CIBA (Client Initiated Backchannel Authentication)',
			],
		},
	];

	const oauthFlows = [
		{
			name: 'Authorization Code',
			description: 'Most secure flow for web applications',
			url: '/flows/oauth-authz-code-v5',
		},
		{
			name: 'OIDC Authorization Code',
			description: 'OpenID Connect with authorization code',
			url: '/flows/oidc-authz-code-v5',
		},
		{
			name: 'Implicit Flow',
			description: 'For single-page applications (SPAs)',
			url: '/flows/oauth-implicit-v5',
		},
		{
			name: 'Hybrid Flow',
			description: 'OIDC hybrid with multiple response types',
			url: '/flows/oidc-hybrid-v5',
		},
		{
			name: 'Client Credentials',
			description: 'Machine-to-machine authentication',
			url: '/flows/client-credentials-v5',
		},
		{
			name: 'Device Code',
			description: 'For devices with limited input capabilities',
			url: '/flows/device-code-v5',
		},
		{
			name: 'Resource Owner Password',
			description: 'Direct username/password flow',
			url: '/flows/oauth2-resource-owner-password',
		},
		{
			name: 'JWT Bearer Token',
			description: 'Using JWT as authorization grant',
			url: '/flows/jwt-bearer-token-v5',
		},
	];

	return (
		<Container>
			<FlowHeader flowId="comprehensive-oauth-education" />

			<Header>
				<h1>
					<FiBook />
					Comprehensive OAuth Education
				</h1>
				<p>
					Master OAuth 2.0 and OpenID Connect fundamentals, flows, security best practices, and
					modern standards. This comprehensive guide covers everything from basic concepts to
					advanced implementation patterns.
				</p>
			</Header>

			<EducationGrid>
				{educationTopics.map((section, index) => (
					<EducationCard key={index}>
						<CardHeader>
							<h2>
								{section.icon}
								{section.title}
							</h2>
							<p>Essential concepts and practices for {section.title.toLowerCase()}</p>
						</CardHeader>
						<TopicList>
							{section.topics.map((topic, topicIndex) => (
								<TopicItem key={topicIndex}>
									<FiCheckCircle size={16} />
									{topic}
								</TopicItem>
							))}
						</TopicList>
						<ActionButton href="#flows">
							Explore Flows <FiArrowRight />
						</ActionButton>
					</EducationCard>
				))}
			</EducationGrid>

			<FlowSection>
				<CardHeader>
					<h2>
						<FiUsers />
						Interactive Flow Demonstrations
					</h2>
					<p>
						Experience each OAuth 2.0 and OpenID Connect flow with real-time demonstrations,
						step-by-step guidance, and detailed explanations of the authorization process.
					</p>
				</CardHeader>

				<FlowGrid>
					{oauthFlows.map((flow, index) => (
						<FlowCard key={index}>
							<h3>{flow.name}</h3>
							<p>{flow.description}</p>
							<ActionButton href={flow.url}>
								Try Flow <FiArrowRight />
							</ActionButton>
						</FlowCard>
					))}
				</FlowGrid>
			</FlowSection>

			<EducationCard>
				<CardHeader>
					<h2>
						<FiShield />
						Getting Started
					</h2>
					<p>
						New to OAuth 2.0 and OpenID Connect? Start here with our beginner-friendly resources.
					</p>
				</CardHeader>
				<TopicList>
					<TopicItem>
						<FiCheckCircle size={16} />
						Configure your PingOne environment in the Configuration page
					</TopicItem>
					<TopicItem>
						<FiCheckCircle size={16} />
						Try the Authorization Code flow first (most common)
					</TopicItem>
					<TopicItem>
						<FiCheckCircle size={16} />
						Understand the difference between OAuth 2.0 and OpenID Connect
					</TopicItem>
					<TopicItem>
						<FiCheckCircle size={16} />
						Learn about scopes and permissions
					</TopicItem>
					<TopicItem>
						<FiCheckCircle size={16} />
						Practice with different response modes
					</TopicItem>
				</TopicList>
				<ActionButton href="/configuration">
					Start Configuration <FiArrowRight />
				</ActionButton>
			</EducationCard>
		</Container>
	);
};

export default ComprehensiveOAuthEducation;
