import React from 'react';
import styled from 'styled-components';
import { 
  FiShield, 
  FiLock, 
  FiKey, 
  FiGlobe, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiExternalLink,
  FiBook,
  FiCode,
  FiUsers,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiRefreshCw
} from 'react-icons/fi';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  padding: 3rem;
  border-radius: 1rem;
  margin-bottom: 3rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
`;

const PageTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageSubtitle = styled.p`
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  opacity: 0.9;
`;

const PageDescription = styled.p`
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.8;
  line-height: 1.6;
`;

const ReferenceCard = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 2rem 0;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const ReferenceIcon = styled.div`
  color: #3b82f6;
  font-size: 1.5rem;
  margin-top: 0.25rem;
`;

const ReferenceContent = styled.div`
  flex: 1;
`;

const ReferenceTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
`;

const ReferenceText = styled.p`
  margin: 0 0 1rem 0;
  color: #475569;
  line-height: 1.6;
`;

const ReferenceLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Section = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SectionIcon = styled.div`
  color: #3b82f6;
  font-size: 1.5rem;
`;

const Subsection = styled.div`
  margin-bottom: 2rem;
`;

const SubsectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SubsectionIcon = styled.div`
  color: #6b7280;
  font-size: 1.25rem;
`;

const BestPracticeCard = styled.div<{ $type: 'critical' | 'important' | 'recommended' }>`
  background: ${({ $type }) => {
    switch ($type) {
      case 'critical': return '#fef2f2';
      case 'important': return '#fffbeb';
      case 'recommended': return '#f0f9ff';
      default: return '#f9fafb';
    }
  }};
  border: 2px solid ${({ $type }) => {
    switch ($type) {
      case 'critical': return '#fecaca';
      case 'important': return '#fed7aa';
      case 'recommended': return '#bfdbfe';
      default: return '#e5e7eb';
    }
  }};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const PracticeIcon = styled.div<{ $type: 'critical' | 'important' | 'recommended' }>`
  color: ${({ $type }) => {
    switch ($type) {
      case 'critical': return '#dc2626';
      case 'important': return '#d97706';
      case 'recommended': return '#2563eb';
      default: return '#6b7280';
    }
  }};
  font-size: 1.25rem;
  margin-top: 0.25rem;
`;

const PracticeContent = styled.div`
  flex: 1;
`;

const PracticeTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const PracticeDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #374151;
  line-height: 1.6;
`;

const PracticeList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #374151;
`;

const PracticeListItem = styled.li`
  margin-bottom: 0.5rem;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const CodeComment = styled.span`
  color: #6b7280;
`;

const CodeString = styled.span`
  color: #10b981;
`;

const CodeKeyword = styled.span`
  color: #f59e0b;
`;

const CodeNumber = styled.span`
  color: #8b5cf6;
`;

const WarningBox = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const WarningIcon = styled.div`
  color: #dc2626;
  font-size: 1.5rem;
  margin-top: 0.25rem;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #dc2626;
  font-size: 1.125rem;
  font-weight: 600;
`;

const WarningText = styled.p`
  margin: 0;
  color: #374151;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoIcon = styled.div`
  color: #0ea5e9;
  font-size: 1.5rem;
  margin-top: 0.25rem;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #0c4a6e;
  font-size: 1.125rem;
  font-weight: 600;
`;

const InfoText = styled.p`
  margin: 0;
  color: #374151;
  line-height: 1.6;
`;

const OAuth2SecurityBestPractices: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <FiShield />
          OAuth 2.0 Security Best Practices
        </PageTitle>
        <PageSubtitle>
          Comprehensive Security Guidelines for OAuth 2.0 Implementations
        </PageSubtitle>
        <PageDescription>
          Based on RFC 9700 - Best Current Practice for OAuth 2.0 Security. 
          Essential security recommendations for building secure OAuth 2.0 applications.
        </PageDescription>
      </PageHeader>

      <ReferenceCard>
        <ReferenceIcon>
          <FiBook />
        </ReferenceIcon>
        <ReferenceContent>
          <ReferenceTitle>Official Reference</ReferenceTitle>
          <ReferenceText>
            This guide is based on the official IETF RFC 9700 - Best Current Practice for OAuth 2.0 Security, 
            published in January 2025. This document updates and consolidates security recommendations from 
            RFC 6749, RFC 6750, and RFC 6819.
          </ReferenceText>
          <ReferenceLink href="https://datatracker.ietf.org/doc/html/rfc9700" target="_blank" rel="noopener noreferrer">
            <FiExternalLink />
            View RFC 9700 on IETF Datatracker
          </ReferenceLink>
        </ReferenceContent>
      </ReferenceCard>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiLock />
          </SectionIcon>
          Client Security
        </SectionTitle>

        <Subsection>
          <SubsectionTitle>
            <SubsectionIcon>
              <FiKey />
            </SubsectionIcon>
            Client Authentication
          </SubsectionTitle>

          <BestPracticeCard $type="critical">
            <PracticeIcon>
              <FiAlertTriangle />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Use Strong Client Authentication</PracticeTitle>
              <PracticeDescription>
                Implement robust client authentication mechanisms to prevent unauthorized access to your OAuth 2.0 client.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Use client secrets for confidential clients</PracticeListItem>
                <PracticeListItem>Implement PKCE (Proof Key for Code Exchange) for public clients</PracticeListItem>
                <PracticeListItem>Use mutual TLS (mTLS) for high-security scenarios</PracticeListItem>
                <PracticeListItem>Consider JWT-based client assertions for stateless authentication</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>

          <BestPracticeCard $type="important">
            <PracticeIcon>
              <FiShield />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Secure Client Secret Management</PracticeTitle>
              <PracticeDescription>
                Protect client secrets with the same rigor as user passwords.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Store secrets in secure, encrypted storage</PracticeListItem>
                <PracticeListItem>Use environment variables or secure key management systems</PracticeListItem>
                <PracticeListItem>Rotate secrets regularly</PracticeListItem>
                <PracticeListItem>Never log or expose secrets in error messages</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>

          <BestPracticeCard $type="recommended">
            <PracticeIcon>
              <FiSettings />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Client Registration Security</PracticeTitle>
              <PracticeDescription>
                Ensure proper client registration and validation processes.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Validate redirect URIs against a whitelist</PracticeListItem>
                <PracticeListItem>Use exact URI matching (no wildcards for security-critical apps)</PracticeListItem>
                <PracticeListItem>Implement client metadata validation</PracticeListItem>
                <PracticeListItem>Use dynamic client registration with proper validation</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>
        </Subsection>

        <Subsection>
          <SubsectionTitle>
            <SubsectionIcon>
              <FiGlobe />
            </SubsectionIcon>
            Redirect URI Security
          </SubsectionTitle>

          <BestPracticeCard $type="critical">
            <PracticeIcon>
              <FiAlertTriangle />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Validate Redirect URIs Strictly</PracticeTitle>
              <PracticeDescription>
                Redirect URI validation is critical to prevent authorization code interception attacks.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Use exact string matching for redirect URIs</PracticeListItem>
                <PracticeListItem>Validate scheme, host, port, and path components</PracticeListItem>
                <PracticeListItem>Reject redirect URIs with fragments (#)</PracticeListItem>
                <PracticeListItem>Use HTTPS for all production redirect URIs</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>

          <CodeBlock>
            <CodeComment>// Good: Exact URI matching</CodeComment>
            <br />
            <CodeString>'https://myapp.com/callback'</CodeString> <CodeComment>// ✅ Allowed</CodeComment>
            <br />
            <CodeString>'https://myapp.com/callback?param=value'</CodeString> <CodeComment>// ✅ Allowed</CodeComment>
            <br /><br />
            <CodeComment>// Bad: Wildcard matching (security risk)</CodeComment>
            <br />
            <CodeString>'https://*.myapp.com/callback'</CodeString> <CodeComment>// ❌ Dangerous</CodeComment>
            <br />
            <CodeString>'https://myapp.com/callback#'</CodeString> <CodeComment>// ❌ Invalid (fragment)</CodeComment>
          </CodeBlock>
        </Subsection>
      </Section>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiRefreshCw />
          </SectionIcon>
          Authorization Code Flow Security
        </SectionTitle>

        <Subsection>
          <SubsectionTitle>
            <SubsectionIcon>
              <FiCode />
            </SubsectionIcon>
            PKCE Implementation
          </SubsectionTitle>

          <BestPracticeCard $type="critical">
            <PracticeIcon>
              <FiAlertTriangle />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Always Use PKCE for Public Clients</PracticeTitle>
              <PracticeDescription>
                PKCE (Proof Key for Code Exchange) is essential for securing public clients and should be used even for confidential clients.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Generate a cryptographically random code_verifier (43-128 characters)</PracticeListItem>
                <PracticeListItem>Create code_challenge using SHA256 of code_verifier</PracticeListItem>
                <PracticeListItem>Include code_challenge_method=S256 in authorization request</PracticeListItem>
                <PracticeListItem>Send code_verifier in token exchange request</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>

          <CodeBlock>
            <CodeComment>// PKCE Implementation Example</CodeComment>
            <br />
            <CodeKeyword>const</CodeKeyword> codeVerifier = generateCodeVerifier(); <CodeComment>// 43-128 chars</CodeComment>
            <br />
            <CodeKeyword>const</CodeKeyword> codeChallenge = generateCodeChallenge(codeVerifier); <CodeComment>// SHA256</CodeComment>
            <br /><br />
            <CodeComment>// Authorization URL</CodeComment>
            <br />
            <CodeString>'https://auth.pingone.com/env/as/authorize'</CodeString> +
            <br />
            <CodeString>'?response_type=code'</CodeString> +
            <br />
            <CodeString>'&client_id=your_client_id'</CodeString> +
            <br />
            <CodeString>'&redirect_uri=https://yourapp.com/callback'</CodeString> +
            <br />
            <CodeString>'&code_challenge='</CodeString> + codeChallenge +
            <br />
            <CodeString>'&code_challenge_method=S256'</CodeString>
          </CodeBlock>
        </Subsection>

        <Subsection>
          <SubsectionTitle>
            <SubsectionIcon>
              <FiShield />
            </SubsectionIcon>
            State Parameter Security
          </SubsectionTitle>

          <BestPracticeCard $type="critical">
            <PracticeIcon>
              <FiAlertTriangle />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Always Use State Parameter</PracticeTitle>
              <PracticeDescription>
                The state parameter prevents CSRF attacks and should be used in all authorization requests.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Generate cryptographically random state value</PracticeListItem>
                <PracticeListItem>Store state in secure session storage</PracticeListItem>
                <PracticeListItem>Validate state parameter on callback</PracticeListItem>
                <PracticeListItem>Use state for additional context (nonce, return URL, etc.)</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>
        </Subsection>
      </Section>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiUsers />
          </SectionIcon>
          Token Security
        </SectionTitle>

        <Subsection>
          <SubsectionTitle>
            <SubsectionIcon>
              <FiKey />
            </SubsectionIcon>
            Access Token Security
          </SubsectionTitle>

          <BestPracticeCard $type="critical">
            <PracticeIcon>
              <FiAlertTriangle />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Secure Token Storage</PracticeTitle>
              <PracticeDescription>
                Access tokens must be stored securely to prevent unauthorized access.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Use secure, HTTP-only cookies when possible</PracticeListItem>
                <PracticeListItem>If using localStorage, implement additional security measures</PracticeListItem>
                <PracticeListItem>Encrypt tokens at rest</PracticeListItem>
                <PracticeListItem>Implement token rotation for long-lived tokens</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>

          <BestPracticeCard $type="important">
            <PracticeIcon>
              <FiShield />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Token Transmission Security</PracticeTitle>
              <PracticeDescription>
                Always use HTTPS for token transmission and include proper security headers.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Use HTTPS for all token-related communications</PracticeListItem>
                <PracticeListItem>Include Authorization header with Bearer token</PracticeListItem>
                <PracticeListItem>Implement proper CORS policies</PracticeListItem>
                <PracticeListItem>Use secure headers (HSTS, CSP, etc.)</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>

          <WarningBox>
            <WarningIcon>
              <FiAlertTriangle />
            </WarningIcon>
            <WarningContent>
              <WarningTitle>Never Expose Tokens in URLs</WarningTitle>
              <WarningText>
                Access tokens should never be included in URL parameters, query strings, or fragments. 
                Always use the Authorization header with Bearer authentication.
              </WarningText>
            </WarningContent>
          </WarningBox>
        </Subsection>

        <Subsection>
          <SubsectionTitle>
            <SubsectionIcon>
              <FiRefreshCw />
            </SubsectionIcon>
            Refresh Token Security
          </SubsectionTitle>

          <BestPracticeCard $type="critical">
            <PracticeIcon>
              <FiAlertTriangle />
            </PracticeIcon>
            <PracticeContent>
              <PracticeTitle>Secure Refresh Token Handling</PracticeTitle>
              <PracticeDescription>
                Refresh tokens require even stronger security measures than access tokens.
              </PracticeDescription>
              <PracticeList>
                <PracticeListItem>Store refresh tokens in secure, HTTP-only cookies</PracticeListItem>
                <PracticeListItem>Implement token binding (binding to client/device)</PracticeListItem>
                <PracticeListItem>Use shorter refresh token lifetimes</PracticeListItem>
                <PracticeListItem>Implement refresh token rotation</PracticeListItem>
                <PracticeListItem>Revoke refresh tokens on logout</PracticeListItem>
              </PracticeList>
            </PracticeContent>
          </BestPracticeCard>
        </Subsection>
      </Section>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiGlobe />
          </SectionIcon>
          Transport Security
        </SectionTitle>

        <BestPracticeCard $type="critical">
          <PracticeIcon>
            <FiAlertTriangle />
          </PracticeIcon>
          <PracticeContent>
            <PracticeTitle>Always Use HTTPS</PracticeTitle>
            <PracticeDescription>
              All OAuth 2.0 communications must use HTTPS in production environments.
            </PracticeDescription>
            <PracticeList>
              <PracticeListItem>Use TLS 1.2 or higher for all communications</PracticeListItem>
              <PracticeListItem>Implement proper certificate validation</PracticeListItem>
              <PracticeListItem>Use HSTS headers to enforce HTTPS</PracticeListItem>
              <PracticeListItem>Validate certificate chains properly</PracticeListItem>
            </PracticeList>
          </PracticeContent>
        </BestPracticeCard>

        <BestPracticeCard $type="important">
          <PracticeIcon>
            <FiShield />
          </PracticeIcon>
          <PracticeContent>
            <PracticeTitle>Implement Security Headers</PracticeTitle>
            <PracticeDescription>
              Use security headers to protect against common web vulnerabilities.
            </PracticeDescription>
            <PracticeList>
              <PracticeListItem>Content Security Policy (CSP)</PracticeListItem>
              <PracticeListItem>X-Frame-Options (prevent clickjacking)</PracticeListItem>
              <PracticeListItem>X-Content-Type-Options</PracticeListItem>
              <PracticeListItem>Strict-Transport-Security (HSTS)</PracticeListItem>
            </PracticeList>
          </PracticeContent>
        </BestPracticeCard>
      </Section>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiSettings />
          </SectionIcon>
          Scope and Permission Security
        </SectionTitle>

        <BestPracticeCard $type="important">
          <PracticeIcon>
            <FiShield />
          </PracticeIcon>
          <PracticeContent>
            <PracticeTitle>Implement Principle of Least Privilege</PracticeTitle>
            <PracticeDescription>
              Only request the minimum scopes necessary for your application to function.
            </PracticeDescription>
            <PracticeList>
              <PracticeListItem>Request only necessary scopes</PracticeListItem>
              <PracticeListItem>Use granular, specific scopes instead of broad ones</PracticeListItem>
              <PracticeListItem>Implement scope validation on the resource server</PracticeListItem>
              <PracticeListItem>Regularly audit and review granted permissions</PracticeListItem>
            </PracticeList>
          </PracticeContent>
        </BestPracticeCard>

        <InfoBox>
          <InfoIcon>
            <FiEye />
          </InfoIcon>
          <InfoContent>
            <InfoTitle>Scope Examples</InfoTitle>
            <InfoText>
              <strong>Good:</strong> <code>read:profile</code>, <code>write:posts</code><br />
              <strong>Bad:</strong> <code>read</code>, <code>write</code>, <code>admin</code>
            </InfoText>
          </InfoContent>
        </InfoBox>
      </Section>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiAlertTriangle />
          </SectionIcon>
          Common Security Pitfalls
        </SectionTitle>

        <WarningBox>
          <WarningIcon>
            <FiAlertTriangle />
          </WarningIcon>
          <WarningContent>
            <WarningTitle>Implicit Grant Flow Deprecation</WarningTitle>
            <WarningText>
              The Implicit Grant flow is deprecated and should not be used for new applications. 
              Use the Authorization Code flow with PKCE instead for better security.
            </WarningText>
          </WarningContent>
        </WarningBox>

        <BestPracticeCard $type="critical">
          <PracticeIcon>
            <FiAlertTriangle />
          </PracticeIcon>
          <PracticeContent>
            <PracticeTitle>Avoid Resource Owner Password Credentials</PracticeTitle>
            <PracticeDescription>
              The Resource Owner Password Credentials flow is not recommended and should be avoided.
            </PracticeDescription>
            <PracticeList>
              <PracticeListItem>Never collect user credentials directly</PracticeListItem>
              <PracticeListItem>Use Authorization Code flow instead</PracticeListItem>
              <PracticeListItem>Implement proper user authentication flows</PracticeListItem>
            </PracticeList>
          </PracticeContent>
        </BestPracticeCard>

        <BestPracticeCard $type="important">
          <PracticeIcon>
            <FiShield />
          </PracticeIcon>
          <PracticeContent>
            <PracticeTitle>Prevent Token Leakage</PracticeTitle>
            <PracticeDescription>
              Implement measures to prevent accidental token exposure.
            </PracticeDescription>
            <PracticeList>
              <PracticeListItem>Never log tokens in plain text</PracticeListItem>
              <PracticeListItem>Use secure error handling (don't expose tokens in errors)</PracticeListItem>
              <PracticeListItem>Implement proper session management</PracticeListItem>
              <PracticeListItem>Use secure coding practices</PracticeListItem>
            </PracticeList>
          </PracticeContent>
        </BestPracticeCard>
      </Section>

      <Section>
        <SectionTitle>
          <SectionIcon>
            <FiCheckCircle />
          </SectionIcon>
          Security Checklist
        </SectionTitle>

        <BestPracticeCard $type="recommended">
          <PracticeIcon>
            <FiCheckCircle />
          </PracticeIcon>
          <PracticeContent>
            <PracticeTitle>Pre-Implementation Checklist</PracticeTitle>
            <PracticeDescription>
              Essential security measures to implement before going live.
            </PracticeDescription>
            <PracticeList>
              <PracticeListItem>✅ Use HTTPS for all communications</PracticeListItem>
              <PracticeListItem>✅ Implement PKCE for all clients</PracticeListItem>
              <PracticeListItem>✅ Use state parameter for CSRF protection</PracticeListItem>
              <PracticeListItem>✅ Validate redirect URIs strictly</PracticeListItem>
              <PracticeListItem>✅ Secure client secret storage</PracticeListItem>
              <PracticeListItem>✅ Implement proper token storage</PracticeListItem>
              <PracticeListItem>✅ Use least privilege scopes</PracticeListItem>
              <PracticeListItem>✅ Implement security headers</PracticeListItem>
              <PracticeListItem>✅ Regular security audits</PracticeListItem>
              <PracticeListItem>✅ Monitor for suspicious activity</PracticeListItem>
            </PracticeList>
          </PracticeContent>
        </BestPracticeCard>
      </Section>

      <ReferenceCard>
        <ReferenceIcon>
          <FiBook />
        </ReferenceIcon>
        <ReferenceContent>
          <ReferenceTitle>Additional Resources</ReferenceTitle>
          <ReferenceText>
            For more detailed information about OAuth 2.0 security, consult these official resources:
          </ReferenceText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <ReferenceLink href="https://datatracker.ietf.org/doc/html/rfc6749" target="_blank" rel="noopener noreferrer">
              <FiExternalLink />
              RFC 6749 - OAuth 2.0 Authorization Framework
            </ReferenceLink>
            <ReferenceLink href="https://datatracker.ietf.org/doc/html/rfc6750" target="_blank" rel="noopener noreferrer">
              <FiExternalLink />
              RFC 6750 - OAuth 2.0 Bearer Token Usage
            </ReferenceLink>
            <ReferenceLink href="https://datatracker.ietf.org/doc/html/rfc6819" target="_blank" rel="noopener noreferrer">
              <FiExternalLink />
              RFC 6819 - OAuth 2.0 Threat Model and Security Considerations
            </ReferenceLink>
            <ReferenceLink href="https://datatracker.ietf.org/doc/html/rfc7636" target="_blank" rel="noopener noreferrer">
              <FiExternalLink />
              RFC 7636 - PKCE for OAuth 2.0
            </ReferenceLink>
          </div>
        </ReferenceContent>
      </ReferenceCard>
    </PageContainer>
  );
};

export default OAuth2SecurityBestPractices;
