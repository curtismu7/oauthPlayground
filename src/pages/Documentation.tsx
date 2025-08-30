import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiBookOpen, FiCode, FiLock, FiUser, FiHelpCircle, FiExternalLink } from 'react-icons/fi';

const DocumentationContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2.5rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.75rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    max-width: 800px;
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
    color: ${({ theme }) => theme.colors.gray800};
    
    svg {
      margin-right: 0.75rem;
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const DocCard = styled(Link)`
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

const ExternalLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  margin-top: 1rem;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    margin-left: 0.5rem;
    font-size: 0.875em;
  }
`;

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1.5rem 0;
  
  code {
    font-family: inherit;
  }
`;

const Documentation = () => {
  return (
    <DocumentationContainer>
      <PageHeader>
        <h1>OAuth 2.0 & OpenID Connect Documentation</h1>
        <p>
          Welcome to the OAuth Playground documentation. Here you'll find guides, examples, and references
          to help you understand and implement OAuth 2.0 and OpenID Connect with PingOne.
        </p>
      </PageHeader>
      
      <Section>
        <h2><FiBookOpen /> Getting Started</h2>
        <p>
          If you're new to OAuth 2.0 and OpenID Connect, start with these resources to understand the basics
          and how to use this playground effectively.
        </p>
        
        <CardGrid>
          <DocCard to="/documentation/oauth-basics">
            <h3>OAuth 2.0 Basics <FiExternalLink size={16} /></h3>
            <p>Learn the fundamental concepts of OAuth 2.0, including roles, tokens, and the different grant types.</p>
          </DocCard>
          
          <DocCard to="/documentation/oidc-basics">
            <h3>OpenID Connect Overview <FiExternalLink size={16} /></h3>
            <p>Understand how OpenID Connect builds on OAuth 2.0 to provide authentication and single sign-on.</p>
          </DocCard>
          
          <DocCard to="/documentation/setup-guide">
            <h3>PingOne Setup Guide <FiExternalLink size={16} /></h3>
            <p>Step-by-step instructions for configuring your PingOne environment and application.</p>
          </DocCard>
        </CardGrid>
      </Section>
      
      <Section>
        <h2><FiCode /> OAuth 2.0 Flows</h2>
        <p>
          OAuth 2.0 defines several grant types (or flows) for different use cases. Each flow is designed
          for specific scenarios and has different security characteristics.
        </p>
        
        <CardGrid>
          <DocCard to="/flows/authorization-code">
            <h3>Authorization Code Flow</h3>
            <p>The most secure flow for server-side applications where the client secret can be kept confidential.</p>
          </DocCard>
          
          <DocCard to="/flows/pkce">
            <h3>PKCE Flow</h3>
            <p>An extension of the Authorization Code flow for public clients that cannot store a client secret.</p>
          </DocCard>
          
          <DocCard to="/flows/implicit">
            <h3>Implicit Flow</h3>
            <p>A simplified flow for client-side applications (not recommended for new applications).</p>
          </DocCard>
          
          <DocCard to="/flows/client-credentials">
            <h3>Client Credentials</h3>
            <p>For machine-to-machine authentication where the client is also the resource owner.</p>
          </DocCard>
          
          <DocCard to="/flows/device-code">
            <h3>Device Code Flow</h3>
            <p>For input-constrained devices that can display a code and prompt the user to visit a URL.</p>
          </DocCard>
        </CardGrid>
      </Section>
      
      <Section>
        <h2><FiLock /> Security Best Practices</h2>
        <p>
          Implementing OAuth 2.0 and OpenID Connect securely requires following best practices to protect
          against common vulnerabilities.
        </p>
        
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Always Use HTTPS</h3>
          <p>
            All OAuth 2.0 and OpenID Connect endpoints must be accessed over HTTPS to protect tokens and
            sensitive data in transit.
          </p>
          
          <h3>Validate ID Tokens</h3>
          <p>
            Always validate ID tokens to ensure they are properly signed, not expired, and issued by a trusted
            identity provider.
          </p>
          
          <CodeBlock>
            <code>{
`// Example ID token validation
const validateIdToken = (idToken, clientId, issuer) => {
  // Verify the token signature
  // Check the token expiration (exp claim)
  // Validate the issuer (iss claim)
  // Verify the audience (aud claim)
  // Check the nonce (if used)
};`
            }</code>
          </CodeBlock>
          
          <h3>Secure Token Storage</h3>
          <p>
            Store tokens securely based on your application type. For web applications, use HTTP-only cookies
            or secure browser storage with appropriate security flags.
          </p>
          
          <h3>Use PKCE for Public Clients</h3>
          <p>
            Always use PKCE (Proof Key for Code Exchange) for public clients to protect against authorization
            code interception attacks.
          </p>
        </div>
      </Section>
      
      <Section>
        <h2><FiHelpCircle /> Common Issues & Troubleshooting</h2>
        
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Invalid Redirect URI</h3>
          <p>
            <strong>Error:</strong> "The redirect URI in the request does not match the registered redirect URIs"
            <br />
            <strong>Solution:</strong> Ensure the redirect URI in your application configuration matches exactly
            (including trailing slashes) with the one used in the authorization request.
          </p>
          
          <h3>Invalid Client</h3>
          <p>
            <strong>Error:</strong> "Invalid client"
            <br />
            <strong>Solution:</strong> Verify that your client ID and client secret are correct and that your
            application is properly configured in PingOne.
          </p>
          
          <h3>Invalid Grant</h3>
          <p>
            <strong>Error:</strong> "Invalid grant"
            <br />
            <strong>Solution:</strong> This can occur for several reasons:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>The authorization code has expired (typically after 10 minutes)</li>
            <li>The authorization code has already been used</li>
            <li>The code verifier doesn't match the code challenge</li>
          </ul>
        </div>
      </Section>
      
      <Section>
        <h2><FiExternalLink /> Additional Resources</h2>
        
        <div style={{ marginTop: '1.5rem' }}>
          <p>Explore these external resources to learn more about OAuth 2.0 and OpenID Connect:</p>
          
          <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <ExternalLink href="https://datatracker.ietf.org/doc/html/rfc6749" target="_blank" rel="noopener noreferrer">
                OAuth 2.0 Authorization Framework (RFC 6749)
                <FiExternalLink />
              </ExternalLink>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <ExternalLink href="https://openid.net/connect/" target="_blank" rel="noopener noreferrer">
                OpenID Connect Documentation
                <FiExternalLink />
              </ExternalLink>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <ExternalLink href="https://docs.pingidentity.com/bundle/pingone/page/lyc1469003009660.html" target="_blank" rel="noopener noreferrer">
                PingOne Documentation
                <FiExternalLink />
              </ExternalLink>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <ExternalLink href="https://oauth.net/2/" target="_blank" rel="noopener noreferrer">
                OAuth.net - Community Resource
                <FiExternalLink />
              </ExternalLink>
            </li>
          </ul>
        </div>
      </Section>
    </DocumentationContainer>
  );
};

export default Documentation;
