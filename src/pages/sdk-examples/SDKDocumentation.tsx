import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c757d;
  color: #ffffff !important;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #545b62;
    color: #ffffff !important;
  }
`;

const DocumentationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const DocCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const DocTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const DocDescription = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const DocLink = styled.a`
  display: inline-block;
  background: #007bff;
  color: #ffffff !important;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
    color: #ffffff !important;
  }
`;

const StatusBadge = styled.span<{ status: 'available' | 'coming-soon' }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
  
  ${(props) =>
		props.status === 'available'
			? `
    background: #d4edda;
    color: #155724;
  `
			: `
    background: #fff3cd;
    color: #856404;
  `}
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
`;

const CodeBlock = styled.pre`
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
`;

const SDKDocumentation: React.FC = () => {
  return (
    <Container>
      <BackButton to="/sdk-examples">
        ← Back to SDK Examples
      </BackButton>
      
      <Header>SDK Documentation</Header>
      <Description>
        Comprehensive documentation for PingOne SDKs, including usage guides, examples, 
        and best practices for integrating PingOne services into your applications.
      </Description>

      <Section>
        <SectionTitle>Core SDKs</SectionTitle>
        <DocumentationGrid>
          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>PingOne Advanced Identity Cloud</DocTitle>
            <DocDescription>
              Complete SDK for user authentication, authorization, and identity management 
              with support for OAuth 2.0, OpenID Connect, and MFA.
            </DocDescription>
            <DocLink href="https://docs.pingidentity.com/pingone/aic/v1/api/" target="_blank" rel="noopener noreferrer">
              View Documentation
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>PingOne Protect SDK</DocTitle>
            <DocDescription>
              Security and fraud detection SDK that provides risk assessment, 
              behavioral biometrics, and adaptive authentication.
            </DocDescription>
            <DocLink href="https://docs.pingidentity.com/pingone/protect/v1/api/" target="_blank" rel="noopener noreferrer">
              View Documentation
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>PingOne Verify SDK</DocTitle>
            <DocDescription>
              Identity verification SDK for document verification, biometric matching, 
              and KYC compliance workflows.
            </DocDescription>
            <DocLink href="https://docs.pingidentity.com/pingone/verify/v1/api/" target="_blank" rel="noopener noreferrer">
              View Documentation
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>PingOne DaVinci SDK</DocTitle>
            <DocDescription>
              Workflow automation SDK for creating custom authentication flows, 
              user journeys, and business processes.
            </DocDescription>
            <DocLink href="https://docs.pingidentity.com/pingone/davinci/v1/api/" target="_blank" rel="noopener noreferrer">
              View Documentation
            </DocLink>
          </DocCard>
        </DocumentationGrid>
      </Section>

      <Section>
        <SectionTitle>Quick Start Examples</SectionTitle>
        <DocumentationGrid>
          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>JWT Authentication</DocTitle>
            <DocDescription>
              Learn how to implement JWT-based authentication with private key 
              and client secret JWT generation.
            </DocDescription>
            <DocLink href="/sdk-examples/jwt-authentication">
              Try Example
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>OIDC Centralized Login</DocTitle>
            <DocDescription>
              Implement OpenID Connect centralized login with server-side UI 
              authentication and token management.
            </DocDescription>
            <DocLink href="/sdk-examples/oidc-centralized-login">
              Try Example
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>DaVinci Todo App</DocTitle>
            <DocDescription>
              Complete todo application demonstrating DaVinci workflow integration 
              with dynamic form rendering.
            </DocDescription>
            <DocLink href="/sdk-examples/davinci-todo-app">
              Try Example
            </DocLink>
          </DocCard>
        </DocumentationGrid>
      </Section>

      <Section>
        <SectionTitle>Code Examples</SectionTitle>
        <DocCard>
          <DocTitle>Initialize PingOne SDK</DocTitle>
          <DocDescription>
            Basic initialization of the PingOne SDK with your application credentials.
          </DocDescription>
          <CodeBlock>{`import { PingOneSDK } from '@pingone/sdk';

const sdk = new PingOneSDK({
  environmentId: 'your-environment-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

await sdk.initialize();`}</CodeBlock>
        </DocCard>
      </Section>

      <Section>
        <SectionTitle>Additional Resources</SectionTitle>
        <DocumentationGrid>
          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>SDK Examples Inventory</DocTitle>
            <DocDescription>
              Complete tracking of all SDK implementations and examples in this playground.
            </DocDescription>
            <DocLink href="/SDK_EXAMPLES_INVENTORY.md" target="_blank" rel="noopener noreferrer">
              View Inventory
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>SDK Usage Guide</DocTitle>
            <DocDescription>
              Comprehensive usage examples and best practices for PingOne SDKs.
            </DocDescription>
            <DocLink href="/SDK_EXAMPLES_GUIDE.md" target="_blank" rel="noopener noreferrer">
              View Guide
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>SWE-15 Development Guide</DocTitle>
            <DocDescription>
              Software engineering best practices for development in this playground.
            </DocDescription>
            <DocLink href="/SWE-15_UNIFIED_MFA_GUIDE.md" target="_blank" rel="noopener noreferrer">
              View Guide
            </DocLink>
          </DocCard>

          <DocCard>
            <StatusBadge status="available">Available</StatusBadge>
            <DocTitle>Official PingOne Documentation</DocTitle>
            <DocDescription>
              Official PingOne SDK documentation and API references.
            </DocDescription>
            <DocLink href="https://docs.pingidentity.com/sdks/latest/" target="_blank" rel="noopener noreferrer">
              Visit Docs Site
            </DocLink>
          </DocCard>
        </DocumentationGrid>
      </Section>
    </Container>
  );
};

export default SDKDocumentation;
