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

const ImplicitFlowOIDC: React.FC = () => {
  return (
    <Page>
      <Title>Implicit Flow (OpenID Connect)</Title>
      <Description>
        Implicit Flow for OpenID Connect allows clients to obtain access and ID tokens directly from the authorization endpoint.
        This flow is suitable for public clients (e.g., SPAs) that cannot securely store client secrets. However, it is
        considered legacy and less secure than Authorization Code with PKCE.
      </Description>

      <Section>
        <SectionTitle>Flow Steps</SectionTitle>
        <ol>
          <li>Client initiates authorization request with <code>response_type=id_token</code> or <code>id_token token</code></li>
          <li>User authenticates and consents</li>
          <li>Authorization server redirects with tokens in fragment</li>
          <li>Client extracts tokens from URL fragment</li>
          <li>Client validates ID token</li>
        </ol>
      </Section>

      <Section>
        <SectionTitle>Security Notes</SectionTitle>
        <ul>
          <li>Use <code>nonce</code> to prevent replay attacks</li>
          <li>Validate ID token signature and claims</li>
          <li>Do not store tokens in localStorage</li>
          <li>Consider migrating to Authorization Code + PKCE</li>
          <li>Access tokens may be exposed in browser history</li>
        </ul>
      </Section>
    </Page>
  );
};

export default ImplicitFlowOIDC;
