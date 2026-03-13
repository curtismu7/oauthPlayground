// src/pages/docs/OAuthAndOIDCForAI.PingUI.tsx
// Comprehensive OAuth 2.0 & OpenID Connect for AI/Agentic Systems Guide - Ping UI Migrated

import styled from 'styled-components';
import { PingIcon } from '../../components/PingIcon';
import { SpecCard } from '../../components/SpecCard';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';

// Ping UI namespace wrapper
const PingUIWrapper = styled.div`
  &.end-user-nano {
    /* All components inherit Ping UI styling */
    * {
      transition: var(--ping-transition-fast, 0.15s ease-in-out);
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
  border-radius: var(--ping-border-radius-md, 0.5rem);
  box-shadow: var(--ping-shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
  padding: 1.5rem;
  transition: var(--ping-transition-fast, 0.15s ease-in-out);
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--ping-color-gray-light, #e5e7eb);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--ping-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.1));
    border-color: var(--ping-color-primary-light, #2563eb40);
  }
  
  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: var(--ping-color-primary, #2563eb);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  p {
    color: var(--ping-color-text-secondary, #6b7280);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
  }
  
  i {
    color: var(--ping-color-primary, #2563eb);
    opacity: 0.7;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ping-color-text-primary, #111827);
  margin: 2rem 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  i {
    color: var(--ping-color-primary, #2563eb);
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

// AI/Agentic Systems Resources
const aiAuthResources = [
	{
		title: 'OAuth 2.0 for AI Agents',
		description:
			'Comprehensive guide on implementing OAuth 2.0 flows specifically for AI agents and agentic systems.',
		url: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-agent-flow-01',
		icon: 'FiCpu',
	},
	{
		title: 'OpenID Connect for AI',
		description:
			'OIDC implementation patterns for AI systems with proper identity verification and token handling.',
		url: 'https://openid.net/connect/',
		icon: 'FiShield',
	},
	{
		title: 'JWT Bearer Tokens for AI',
		description:
			'JWT-based authentication patterns for AI agent-to-agent communication and service integration.',
		url: 'https://datatracker.ietf.org/doc/html/rfc7523',
		icon: 'FiKey',
	},
	{
		title: 'AI Agent Security Best Practices',
		description:
			'Security considerations and best practices for AI agent authentication and authorization.',
		url: 'https://owasp.org/www-project-ai-security/',
		icon: 'FiLock',
	},
	{
		title: 'Machine-to-Machine OAuth',
		description:
			'Client Credentials flow optimization for AI systems and automated agent interactions.',
		url: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.4',
		icon: 'FiServer',
	},
	{
		title: 'Token Exchange for AI Delegation',
		description: 'OAuth 2.0 Token Exchange for AI agent delegation and impersonation scenarios.',
		url: 'https://datatracker.ietf.org/doc/html/rfc8693',
		icon: 'FiLayers',
	},
];

const OAuthAndOIDCForAI: React.FC = () => {
	return (
		<PingUIWrapper className="end-user-nano">
			<ContentContainer>
				<FlowHeader
					flowType="oauth-oidc-ai"
					title="OAuth 2.0 & OpenID Connect for AI Systems"
					subtitle="Comprehensive authentication and authorization patterns for AI agents and agentic systems"
				/>

				<CollapsibleHeader
					title="AI/Agentic Systems Authentication"
					subtitle="OAuth 2.0 and OpenID Connect implementation patterns for AI agents"
				/>

				<SectionTitle>
					<PingIcon icon="FiCpu" size={24} />
					AI Agent Authentication Resources
				</SectionTitle>

				<LinkGrid>
					{aiAuthResources.map((resource, index) => (
						<ExternalLink
							key={index}
							href={resource.url}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Visit ${resource.title} (opens in new tab)`}
						>
							<h3>
								{resource.title}
								<PingIcon icon="FiExternalLink" size={16} />
							</h3>
							<p>{resource.description}</p>
						</ExternalLink>
					))}
				</LinkGrid>

				<SectionTitle>
					<PingIcon icon="FiBookOpen" size={24} />
					Implementation Specifications
				</SectionTitle>

				<SpecCard
					title="OAuth 2.0 Agent Flow (IETF Draft)"
					description="Draft specification for OAuth 2.0 flows specifically designed for AI agents and autonomous systems."
					status="draft"
					version="draft-ietf-oauth-agent-flow-01"
					url="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-agent-flow-01"
				/>

				<SpecCard
					title="JWT Profile for OAuth 2.0 Client Authentication"
					description="JWT-based authentication for AI agents using signed assertions and client credentials."
					status="published"
					version="RFC 7523"
					url="https://datatracker.ietf.org/doc/html/rfc7523"
				/>

				<SpecCard
					title="OAuth 2.0 Token Exchange"
					description="Token exchange mechanisms for AI agent delegation and cross-system authentication."
					status="published"
					version="RFC 8693"
					url="https://datatracker.ietf.org/doc/html/rfc8693"
				/>

				<SectionTitle>
					<PingIcon icon="FiShield" size={24} />
					Security Considerations for AI Systems
				</SectionTitle>

				<SpecCard
					title="OWASP AI Security & Privacy Guide"
					description="Comprehensive security guidelines for AI systems including authentication and authorization best practices."
					status="community"
					version="Latest"
					url="https://owasp.org/www-project-ai-security/"
				/>

				<SpecCard
					title="NIST AI Risk Management Framework"
					description="Framework for managing risks in AI systems including security and privacy considerations."
					status="standard"
					version="1.0"
					url="https://www.nist.gov/itl/ai-risk-management-framework"
				/>
			</ContentContainer>
		</PingUIWrapper>
	);
};

export default OAuthAndOIDCForAI;
