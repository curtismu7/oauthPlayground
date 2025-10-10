import { FiBookOpen, FiCode, FiCpu, FiExternalLink, FiShield, FiUsers } from 'react-icons/fi';
import styled from 'styled-components';
import PageTitle from '../../components/PageTitle';
import { SpecCard } from '../../components/SpecCard';
import { FlowHeader } from '../../services/flowHeaderService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { PageLayoutService } from '../../services/pageLayoutService';
import { FlowUIService } from '../../services/flowUIService';

const DocsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Section = styled.section`
  margin-bottom: 3rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.gray800};
    
    svg {
      margin-right: 0.75rem;
      color: ${({ theme }) => theme.colors.primary};
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
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary}40;
  }
  
  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.primary};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 0;
  }
`;

const OIDCForAI = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'oidc-for-ai',
	};
	const { PageContainer, ContentWrapper, FlowHeader: LayoutFlowHeader } =
		PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

			<CollapsibleHeader
				title="Industry Resources"
				subtitle="Comprehensive guides and resources for implementing OAuth 2.0 and OpenID Connect for AI applications"
				icon={<FiShield />}
				defaultCollapsed={false}
			>
				<LinkGrid>
					<ExternalLink
						href="https://www.pingidentity.com/en/resources/identity-fundamentals/agentic-ai.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Ping Identity - OAuth & OIDC for AI
							<FiExternalLink size={16} />
						</h3>
						<p>
							Comprehensive guide on implementing OAuth 2.0 and OpenID Connect for AI applications
							and machine learning platforms.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/connect/"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							OpenID Foundation - Connect
							<FiExternalLink size={16} />
						</h3>
						<p>Official OpenID Connect resources and specifications from the OpenID Foundation.</p>
					</ExternalLink>

					<ExternalLink
						href="https://auth0.com/blog/oauth-2-0-and-openid-connect-for-ai-applications/"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Auth0 - OAuth 2.0 for AI Applications
							<FiExternalLink size={16} />
						</h3>
						<p>
							Best practices and implementation patterns for securing AI applications with OAuth 2.0
							and OpenID Connect.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://learn.microsoft.com/en-us/azure/ai-services/authentication"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Microsoft Azure AI Services - Authentication
							<FiExternalLink size={16} />
						</h3>
						<p>
							Microsoft's comprehensive guide to authentication and authorization for AI services,
							including OAuth 2.0, API keys, and Azure Active Directory integration.
						</p>
					</ExternalLink>
				</LinkGrid>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Research & Standards"
				subtitle="Official specifications and research papers for OAuth 2.0 and OpenID Connect"
				icon={<FiCode />}
				defaultCollapsed={false}
			>
				<LinkGrid>
					<ExternalLink
						href="https://www.ietf.org/rfc/rfc6749.txt"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							RFC 6749 - OAuth 2.0 Authorization Framework
							<FiExternalLink size={16} />
						</h3>
						<p>The core OAuth 2.0 specification that forms the foundation for OpenID Connect.</p>
					</ExternalLink>

					<ExternalLink
						href="https://www.ietf.org/rfc/rfc7636.txt"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							RFC 7636 - PKCE (Proof Key for Code Exchange)
							<FiExternalLink size={16} />
						</h3>
						<p>
							Security extension for OAuth 2.0, essential for public clients and AI applications.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://www.ietf.org/rfc/rfc7519.txt"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							RFC 7519 - JSON Web Token (JWT)
							<FiExternalLink size={16} />
						</h3>
						<p>The JWT specification used for ID tokens and access tokens in OpenID Connect.</p>
					</ExternalLink>
				</LinkGrid>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="AI Authentication Training"
				subtitle="Comprehensive training content for AI authentication and authorization"
				icon={<FiUsers />}
				defaultCollapsed={false}
			>
				<SpecCard title="AI Authentication Fundamentals">
					<p>Understanding how AI systems authenticate and authorize access to resources and services:</p>
					<ul>
						<li>
							<strong>AI Agent Identity:</strong> How AI systems establish their identity and prove they are authorized to act
						</li>
						<li>
							<strong>User Context Preservation:</strong> Maintaining user identity through the AI processing pipeline
						</li>
						<li>
							<strong>Service-to-Service Authentication:</strong> AI systems authenticating with other services and APIs
						</li>
						<li>
							<strong>Delegated Authorization:</strong> AI acting on behalf of users with appropriate permissions
						</li>
						<li>
							<strong>Token Lifecycle Management:</strong> Managing authentication tokens for long-running AI processes
						</li>
					</ul>
				</SpecCard>

				<SpecCard title="AI Authentication Patterns">
					<p>Common authentication patterns used in AI applications:</p>
					<ul>
						<li>
							<strong>Client Credentials Flow:</strong> For AI model access and service-to-service authentication
						</li>
						<li>
							<strong>Authorization Code Flow:</strong> When AI needs to act on behalf of a user
						</li>
						<li>
							<strong>Device Authorization Flow:</strong> For AI systems running on constrained devices
						</li>
						<li>
							<strong>JWT Bearer Token Flow:</strong> For AI systems with existing JWT tokens
						</li>
						<li>
							<strong>Token Exchange (RFC 8693):</strong> For AI systems exchanging tokens between services
						</li>
					</ul>
				</SpecCard>

				<SpecCard title="AI-Specific OAuth Scopes">
					<p>Specialized OAuth scopes designed for AI applications:</p>
					<ul>
						<li><strong>ai:read</strong> - AI can read user data for inference</li>
						<li><strong>ai:analyze</strong> - AI can analyze patterns in user data</li>
						<li><strong>ai:train</strong> - Use data for model training (requires explicit consent)</li>
						<li><strong>ai:personalize</strong> - Store preferences for personalization</li>
						<li><strong>ai:generate</strong> - Generate content using user context</li>
						<li><strong>ai:share_insights</strong> - Share anonymized insights with third parties</li>
					</ul>
				</SpecCard>

				<SpecCard title="Privacy-Preserving AI Authentication">
					<p>Advanced authentication techniques that protect user privacy:</p>
					<ul>
						<li>
							<strong>Zero-Knowledge Proofs:</strong> Allow AI to verify user attributes without learning them
						</li>
						<li>
							<strong>Federated Learning Credentials:</strong> Authenticate AI contributions without revealing data sources
						</li>
						<li>
							<strong>Differential Privacy Tokens:</strong> Tokens that encode privacy budgets for AI queries
						</li>
						<li>
							<strong>Homomorphic Encryption:</strong> Process encrypted data without decryption
						</li>
						<li>
							<strong>Secure Multi-Party Computation:</strong> Collaborative AI without sharing raw data
						</li>
					</ul>
				</SpecCard>

				<SpecCard title="Multi-Modal AI Authentication">
					<p>Authentication for AI systems that process multiple data types:</p>
					<ul>
						<li><strong>Text Processing:</strong> Messages, documents, emails</li>
						<li><strong>Image Analysis:</strong> Photos, diagrams, screenshots</li>
						<li><strong>Audio Processing:</strong> Voice recordings, music</li>
						<li><strong>Video Analysis:</strong> Calls, recordings</li>
						<li><strong>Structured Data:</strong> Databases, spreadsheets</li>
						<li><strong>Real-time Streams:</strong> Sensor data, live feeds</li>
					</ul>
				</SpecCard>

				<SpecCard title="AI Security Best Practices">
					<p>Critical security considerations for AI authentication:</p>
					<ul>
						<li>Implement proper input validation and sanitization for all AI inputs</li>
						<li>Use secure token storage with encryption at rest and in transit</li>
						<li>Implement rate limiting and abuse prevention for AI API calls</li>
						<li>Ensure proper error handling without information leakage</li>
						<li>Use HTTPS for all AI communications</li>
						<li>Implement proper session management and timeout policies</li>
						<li>Regular security audits of AI authentication flows</li>
						<li>Monitor for unusual AI behavior patterns</li>
					</ul>
				</SpecCard>

				<SpecCard title="AI Token Exchange (RFC 8693)">
					<p>Advanced token exchange patterns for AI systems:</p>
					<pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
{`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange&
subject_token=user_access_token&
subject_token_type=urn:ietf:params:oauth:token-type:access_token&
actor_token=ai_agent_token&
actor_token_type=urn:ietf:params:oauth:token-type:access_token&
scope=downstream_api:access&
requested_token_type=urn:ietf:params:oauth:token-type:access_token&
audience=https://downstream-api.example.com`}
					</pre>
				</SpecCard>

				<SpecCard title="AI Compliance and Audit">
					<p>Ensuring AI operations are properly logged and auditable:</p>
					<ul>
						<li>Log all AI authentication events with timestamps and user context</li>
						<li>Maintain audit trails for AI model access and data processing</li>
						<li>Implement data retention policies for AI training data</li>
						<li>Ensure GDPR, CCPA, and other privacy regulation compliance</li>
						<li>Regular compliance audits of AI authentication systems</li>
						<li>User consent management for AI data processing</li>
						<li>Data minimization and purpose limitation for AI operations</li>
					</ul>
				</SpecCard>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Implementation Guides"
				subtitle="Step-by-step guides for implementing OAuth 2.0 and OpenID Connect in AI applications"
				icon={<FiBookOpen />}
				defaultCollapsed={false}
			>
				<LinkGrid>
					<ExternalLink
						href="https://developers.google.com/identity/protocols/oauth2"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Google OAuth 2.0 for AI
							<FiExternalLink size={16} />
						</h3>
						<p>
							Google's implementation guide for OAuth 2.0 in AI and machine learning applications.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Microsoft Azure AD - Client Credentials
							<FiExternalLink size={16} />
						</h3>
						<p>
							Microsoft's guide for implementing client credentials flow for service-to-service
							authentication in AI applications.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://aws.amazon.com/blogs/security/how-to-use-oauth-2-0-to-access-aws-apis-from-an-application/"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							AWS - OAuth 2.0 for API Access
							<FiExternalLink size={16} />
						</h3>
						<p>AWS implementation patterns for OAuth 2.0 in cloud-based AI applications.</p>
					</ExternalLink>
				</LinkGrid>
			</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OIDCForAI;
