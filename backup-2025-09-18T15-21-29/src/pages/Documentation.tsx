/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import PageTitle from '../components/PageTitle';

const DocumentationContainer = styled.div`
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

const QuickStartBanner = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight});
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  text-align: center;

  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    color: white;
  }

  p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
    opacity: 0.9;
  }
`;

const QuickStartButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const FeatureHighlight = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const FeatureCard = styled.div`
  background: white;
  border: 2px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  .icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-size: 1.5rem;
    color: white;
  }

  .tutorials { background: linear-gradient(135deg, #10b981, #059669); }
  .flows { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .security { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .tools { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.gray900};
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    margin-bottom: 1rem;
  }
`;

const FeatureButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  text-decoration: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const Documentation = () => {
  return (
    <DocumentationContainer>
      <PageTitle 
        title={
          <>
            <FiBookOpen />
            OAuth 2.0 & OpenID Connect Documentation
          </>
        }
        subtitle="Welcome to the OAuth Playground documentation. Here you'll find guides, examples, and references to help you understand and implement OAuth 2.0 and OpenID Connect with PingOne."
      />

      <QuickStartBanner>
        <h2>🚀 Ready to Get Started?</h2>
        <p>
          Jump into our interactive tutorials and start learning OAuth 2.0 with hands-on examples
        </p>
        <QuickStartButton to="/tutorials">
          <FiPlay size={16} />
          Start Interactive Tutorials
        </QuickStartButton>
      </QuickStartBanner>

      <Section>
        <h2><FiBookOpen /> Documentation Overview</h2>
        <p>
          This documentation provides comprehensive guidance for implementing OAuth 2.0 and OpenID Connect with PingOne. 
          Whether you're a beginner or an experienced developer, you'll find the resources you need to build secure, 
          standards-compliant authentication systems.
        </p>
        
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '0.5rem', 
          padding: '1.5rem', 
          marginTop: '1rem' 
        }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>What You'll Learn:</h3>
          <ul style={{ marginBottom: 0, color: '#4b5563' }}>
            <li><strong>OAuth 2.0 Fundamentals:</strong> Understanding roles, tokens, and grant types</li>
            <li><strong>OpenID Connect:</strong> Authentication layer built on OAuth 2.0</li>
            <li><strong>Security Best Practices:</strong> Protecting against common vulnerabilities</li>
            <li><strong>PingOne Integration:</strong> Step-by-step setup and configuration</li>
            <li><strong>Flow Implementation:</strong> Hands-on examples for each OAuth flow</li>
            <li><strong>Troubleshooting:</strong> Common issues and their solutions</li>
          </ul>
        </div>
      </Section>

      <FeatureHighlight>
        <FeatureCard>
          <div className="icon tutorials">
            <FiPlay />
          </div>
          <h3>Interactive Tutorials</h3>
          <p>Step-by-step guided learning with real examples and immediate feedback</p>
          <FeatureButton to="/tutorials">
            Try Tutorials
          </FeatureButton>
        </FeatureCard>

        <FeatureCard>
          <div className="icon flows">
            <FiCode />
          </div>
          <h3>OAuth Flows</h3>
          <p>Explore different OAuth 2.0 grant types with live implementations</p>
          <FeatureButton to="/flows">
            View Flows
          </FeatureButton>
        </FeatureCard>

        <FeatureCard>
          <div className="icon security">
            <FiShield />
          </div>
          <h3>Security Guide</h3>
          <p>Learn security best practices and common pitfalls to avoid</p>
          <FeatureButton to="/documentation#security">
            Security Tips
          </FeatureButton>
        </FeatureCard>

        <FeatureCard>
          <div className="icon tools">
            <FiTool />
          </div>
          <h3>Developer Tools</h3>
          <p>JWT decoder, PKCE generator, and other useful OAuth utilities</p>
          <FeatureButton to="/tutorials?tab=utilities">
            Use Tools
          </FeatureButton>
        </FeatureCard>
      </FeatureHighlight>
      
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
          against common vulnerabilities. This section covers essential security measures that every developer
          should implement when working with OAuth 2.0 and OpenID Connect.
        </p>
        
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <p style={{ margin: 0, color: '#dc2626', fontWeight: '500' }}>
            <strong>⚠️ Security Warning:</strong> OAuth 2.0 and OpenID Connect handle sensitive authentication data. 
            Always follow these security guidelines to protect your users and applications.
          </p>
        </div>
        
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
        <p>
          This section covers the most common issues developers encounter when implementing OAuth 2.0 and OpenID Connect,
          along with practical solutions and debugging tips to help you resolve them quickly.
        </p>
        
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <p style={{ margin: 0, color: '#0369a1', fontWeight: '500' }}>
            <strong>💡 Pro Tip:</strong> Most OAuth 2.0 errors are related to configuration issues. Double-check your 
            client settings, redirect URIs, and scopes before diving into complex debugging.
          </p>
        </div>
        
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
