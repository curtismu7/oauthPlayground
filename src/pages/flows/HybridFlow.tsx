import React from 'react';
import styled from 'styled-components';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const Section = styled.section`
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const HybridFlow: React.FC = () => {
  return (
    <Page>
      <Title>Hybrid Flow (OpenID Connect)</Title>
      <Description>
        Hybrid Flow combines elements of Authorization Code and Implicit flows. The client receives an authorization code
        and access/id tokens directly in the redirect URI. This flow is useful for SPAs that need immediate access to
        tokens while maintaining security through PKCE and server-side code exchange.
      </Description>

      <Section>
        <SectionTitle>Flow Steps</SectionTitle>
        <ol>
          <li>Client initiates authorization request with <code>response_type=code id_token</code> or <code>code id_token token</code></li>
          <li>User authenticates and consents</li>
          <li>Authorization server redirects with code and tokens</li>
          <li>Client exchanges code for additional tokens (if needed)</li>
          <li>Client validates ID token</li>
        </ol>
      </Section>

      <Section>
        <SectionTitle>Security Notes</SectionTitle>
        <ul>
          <li>Always use PKCE for security</li>
          <li>Validate ID token signature and claims</li>
          <li>Store tokens securely (HttpOnly cookies preferred)</li>
          <li>Use <code>nonce</code> to prevent replay attacks</li>
        </ul>
      </Section>
    </Page>
  );
};

export default HybridFlow;
