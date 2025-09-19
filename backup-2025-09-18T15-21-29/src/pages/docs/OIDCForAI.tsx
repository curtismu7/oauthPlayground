 
import React from 'react';
import styled from 'styled-components';
import PageTitle from '../../components/PageTitle';
import { SpecCard } from '../../components/SpecCard';

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
  return (
    <DocsContainer>
      <PageTitle 
        title={
          <>
            <FiCpu />
            OpenID Connect for AI Applications
          </>
        }
        subtitle="Resources and guidance for implementing OpenID Connect in AI and machine learning applications"
      />

      <Section>
        <h2>
          <FiShield />
          Industry Resources
        </h2>
        <LinkGrid>
          <ExternalLink href="https://www.pingidentity.com/en/resources/blog/post/oauth-oidc-ai-applications.html" target="_blank" rel="noopener noreferrer">
            <h3>
              Ping Identity - OAuth & OIDC for AI
              <FiExternalLink size={16} />
            </h3>
            <p>
              Comprehensive guide on implementing OAuth 2.0 and OpenID Connect for AI applications and machine learning platforms.
            </p>
          </ExternalLink>

          <ExternalLink href="https://openid.net/connect/" target="_blank" rel="noopener noreferrer">
            <h3>
              OpenID Foundation - Connect
              <FiExternalLink size={16} />
            </h3>
            <p>
              Official OpenID Connect resources and specifications from the OpenID Foundation.
            </p>
          </ExternalLink>

          <ExternalLink href="https://auth0.com/blog/oauth-2-0-and-openid-connect-for-ai-applications/" target="_blank" rel="noopener noreferrer">
            <h3>
              Auth0 - OAuth 2.0 for AI Applications
              <FiExternalLink size={16} />
            </h3>
            <p>
              Best practices and implementation patterns for securing AI applications with OAuth 2.0 and OpenID Connect.
            </p>
          </ExternalLink>
        </LinkGrid>
      </Section>

      <Section>
        <h2>
          <FiCode />
          Research & Standards
        </h2>
        <LinkGrid>
          <ExternalLink href="https://www.ietf.org/rfc/rfc6749.txt" target="_blank" rel="noopener noreferrer">
            <h3>
              RFC 6749 - OAuth 2.0 Authorization Framework
              <FiExternalLink size={16} />
            </h3>
            <p>
              The core OAuth 2.0 specification that forms the foundation for OpenID Connect.
            </p>
          </ExternalLink>

          <ExternalLink href="https://www.ietf.org/rfc/rfc7636.txt" target="_blank" rel="noopener noreferrer">
            <h3>
              RFC 7636 - PKCE (Proof Key for Code Exchange)
              <FiExternalLink size={16} />
            </h3>
            <p>
              Security extension for OAuth 2.0, essential for public clients and AI applications.
            </p>
          </ExternalLink>

          <ExternalLink href="https://www.ietf.org/rfc/rfc7519.txt" target="_blank" rel="noopener noreferrer">
            <h3>
              RFC 7519 - JSON Web Token (JWT)
              <FiExternalLink size={16} />
            </h3>
            <p>
              The JWT specification used for ID tokens and access tokens in OpenID Connect.
            </p>
          </ExternalLink>
        </LinkGrid>
      </Section>

      <Section>
        <h2>
          <FiUsers />
          AI-Specific Considerations
        </h2>
        <SpecCard title="Authentication Patterns for AI Applications">
          <p>
            AI applications have unique authentication and authorization requirements:
          </p>
          <ul>
            <li><strong>Service-to-Service Authentication:</strong> Use Client Credentials flow for AI model access</li>
            <li><strong>User Context Preservation:</strong> Maintain user identity through the AI processing pipeline</li>
            <li><strong>Token Lifecycle Management:</strong> Implement proper token refresh for long-running AI processes</li>
            <li><strong>Scope-Based Access Control:</strong> Use OAuth scopes to control AI model access and capabilities</li>
            <li><strong>Audit and Compliance:</strong> Ensure all AI operations are properly logged and auditable</li>
          </ul>
        </SpecCard>

        <SpecCard title="Security Best Practices for AI">
          <p>
            Key security considerations when implementing OIDC for AI applications:
          </p>
          <ul>
            <li>Implement proper input validation and sanitization</li>
            <li>Use secure token storage with encryption at rest</li>
            <li>Implement rate limiting and abuse prevention</li>
            <li>Ensure proper error handling without information leakage</li>
            <li>Use HTTPS for all communications</li>
            <li>Implement proper session management and timeout policies</li>
          </ul>
        </SpecCard>
      </Section>

      <Section>
        <h2>
          <FiBookOpen />
          Implementation Guides
        </h2>
        <LinkGrid>
          <ExternalLink href="https://developers.google.com/identity/protocols/oauth2" target="_blank" rel="noopener noreferrer">
            <h3>
              Google OAuth 2.0 for AI
              <FiExternalLink size={16} />
            </h3>
            <p>
              Google's implementation guide for OAuth 2.0 in AI and machine learning applications.
            </p>
          </ExternalLink>

          <ExternalLink href="https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow" target="_blank" rel="noopener noreferrer">
            <h3>
              Microsoft Azure AD - Client Credentials
              <FiExternalLink size={16} />
            </h3>
            <p>
              Microsoft's guide for implementing client credentials flow for service-to-service authentication in AI applications.
            </p>
          </ExternalLink>

          <ExternalLink href="https://aws.amazon.com/blogs/security/how-to-use-oauth-2-0-to-access-aws-apis-from-an-application/" target="_blank" rel="noopener noreferrer">
            <h3>
              AWS - OAuth 2.0 for API Access
              <FiExternalLink size={16} />
            </h3>
            <p>
              AWS implementation patterns for OAuth 2.0 in cloud-based AI applications.
            </p>
          </ExternalLink>
        </LinkGrid>
      </Section>
    </DocsContainer>
  );
};

export default OIDCForAI;
