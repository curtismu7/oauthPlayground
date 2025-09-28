import React from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { SpecCard } from '../components/SpecCard';
import { FiShield, FiAlertTriangle, FiCheck, FiX, FiInfo } from 'react-icons/fi';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const OverviewCard = styled(Card)`
  margin-bottom: 2rem;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ChangesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ChangeCard = styled(Card)<{ $type: 'improvement' | 'deprecation' | 'requirement' }>`
  border-left: 4px solid ${({ $type, theme }) => {
    switch ($type) {
      case 'improvement': return theme.colors.success;
      case 'deprecation': return theme.colors.warning;
      case 'requirement': return theme.colors.primary;
      default: return theme.colors.gray300;
    }
  }};
`;

const ChangeIcon = styled.div<{ $type: 'improvement' | 'deprecation' | 'requirement' }>`
  font-size: 1.5rem;
  color: ${({ $type, theme }) => {
    switch ($type) {
      case 'improvement': return theme.colors.success;
      case 'deprecation': return theme.colors.warning;
      case 'requirement': return theme.colors.primary;
      default: return theme.colors.gray300;
    }
  }};
  margin-bottom: 1rem;
`;

const ChangeTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

const ChangeDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
`;

const PingOneNote = styled.div`
  background-color: ${({ theme }) => theme.colors.info}10;
  border: 1px solid ${({ theme }) => theme.colors.info}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.info};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h4 {
    color: ${({ theme }) => theme.colors.info};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.info};
    font-size: 0.9rem;
  }
`;

const OAuth21 = () => {
  return (
    <Container>
      <Header>
        <h1>
          <FiShield />
          OAuth 2.1
        </h1>
        <p>
          OAuth 2.1 is an in-progress effort to consolidate and simplify the most commonly used features of OAuth 2.0. 
          Since the original publication of OAuth 2.0 (RFC 6749) in 2012, several new RFCs have been published that 
          either add or remove functionality from the core spec.
        </p>
      </Header>

      <OverviewCard>
        <CardHeader>
          <h2>What is OAuth 2.1?</h2>
        </CardHeader>
        <CardBody>
          <p>
            OAuth 2.1 consolidates the changes published in later specifications to simplify the core document. 
            It represents the evolution of OAuth 2.0 with security improvements and best practices built-in.
          </p>
          <p>
            <strong>Status:</strong> Currently in draft (draft-ietf-oauth-v2-1-13) - 
            <a href="https://oauth.net/2.1/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>
              View on oauth.net 
            </a>
          </p>
        </CardBody>
      </OverviewCard>

      <Card>
        <CardHeader>
          <h2>Key Changes from OAuth 2.0 to OAuth 2.1</h2>
        </CardHeader>
        <CardBody>
          <ChangesGrid>
            {/* PKCE Requirement */}
            <SpecCard title="PKCE Required for Authorization Code Flow">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiCheck style={{ color: '#10b981', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: '600', color: '#10b981' }}>REQUIRED</span>
              </div>
              <p>
                PKCE (Proof Key for Code Exchange) is now <strong>required</strong> for all OAuth clients using 
                the authorization code flow, not just public clients.
              </p>
              <pre>{`// OAuth 2.1 REQUIRES PKCE for all clients
GET /authorize?
  response_type=code
  &client_id=your_client_id
  &code_challenge=YOUR_CODE_CHALLENGE
  &code_challenge_method=S256`}</pre>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: '1rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>PingOne Support</h4>
                  <p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>PingOne fully supports PKCE and recommends its use for all OAuth flows.</p>
                </div>
              </div>
            </SpecCard>

            {/* Redirect URI Matching */}
            <SpecCard title="Exact String Matching for Redirect URIs">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiCheck style={{ color: '#10b981', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: '600', color: '#10b981' }}>REQUIRED</span>
              </div>
              <p>
                Redirect URIs must be compared using exact string matching, eliminating the previous 
                substring matching behavior that could lead to security vulnerabilities.
              </p>
              <pre>{`// OAuth 2.1: Exact string matching required
//  Correct - exact match
redirect_uri=https://app.example.com/callback

//  OAuth 2.0 allowed substring matching
// This is no longer permitted in OAuth 2.1`}</pre>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: '1rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>PingOne Support</h4>
                  <p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>PingOne already enforces exact redirect URI matching for security.</p>
                </div>
              </div>
            </SpecCard>

            {/* Implicit Flow Deprecation */}
            <SpecCard title="Implicit Grant Deprecated">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiX style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: '600', color: '#f59e0b' }}>DEPRECATED</span>
              </div>
              <p>
                The Implicit grant (`response_type=token`) is omitted from OAuth 2.1 specification 
                due to security concerns. Use Authorization Code flow with PKCE instead.
              </p>
              <pre>{`//  OAuth 2.1: Implicit flow deprecated
// response_type=token is no longer supported

//  OAuth 2.1: Use Authorization Code + PKCE
response_type=code
&code_challenge=YOUR_CODE_CHALLENGE
&code_challenge_method=S256`}</pre>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: '1rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>PingOne Support</h4>
                  <p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>PingOne still supports Implicit flow for backward compatibility but recommends using Authorization Code + PKCE.</p>
                </div>
              </div>
            </SpecCard>

            {/* Password Grant Deprecation */}
            <SpecCard title="Resource Owner Password Credentials Deprecated">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiX style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: '600', color: '#f59e0b' }}>DEPRECATED</span>
              </div>
              <p>
                The Password grant is omitted from OAuth 2.1 specification. Use Authorization Code flow 
                for user authentication scenarios.
              </p>
              <pre>{`//  OAuth 2.1: Password grant deprecated
// grant_type=password is no longer supported

//  OAuth 2.1: Use Authorization Code flow
// Let the authorization server handle authentication`}</pre>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: '1rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>PingOne Support</h4>
                  <p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>PingOne still supports Password grant for legacy applications but recommends migrating to Authorization Code flow.</p>
                </div>
              </div>
            </SpecCard>

            {/* Bearer Token Security */}
            <SpecCard title="Enhanced Bearer Token Security">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: '600', color: '#3b82f6' }}>IMPROVEMENT</span>
              </div>
              <p>
                Bearer token usage omits the use of bearer tokens in the query string of URIs, 
                improving security by preventing token leakage in logs and referrer headers.
              </p>
              <pre>{`//  OAuth 2.1: No tokens in query strings
// https://api.example.com/data?access_token=TOKEN

//  OAuth 2.1: Use Authorization header
Authorization: Bearer YOUR_ACCESS_TOKEN`}</pre>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: '1rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>PingOne Support</h4>
                  <p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>PingOne follows OAuth 2.1 best practices for bearer token usage.</p>
                </div>
              </div>
            </SpecCard>

            {/* Refresh Token Security */}
            <SpecCard title="Enhanced Refresh Token Security">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: '600', color: '#3b82f6' }}>IMPROVEMENT</span>
              </div>
              <p>
                Refresh tokens for public clients must either be sender-constrained or one-time use, 
                improving security for public client applications.
              </p>
              <pre>{`// OAuth 2.1: Enhanced refresh token security
// Public clients must use:
// 1. Sender-constrained refresh tokens (e.g., mTLS)
// 2. One-time use refresh tokens
// 3. Or no refresh tokens at all`}</pre>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: '1rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>PingOne Support</h4>
                  <p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>PingOne supports both sender-constrained and one-time use refresh tokens for enhanced security.</p>
                </div>
              </div>
            </SpecCard>
          </ChangesGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2>Migration Guide</h2>
        </CardHeader>
        <CardBody>
          <h3>For Existing OAuth 2.0 Applications</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Enable PKCE:</strong> Add PKCE to all Authorization Code flows</li>
            <li><strong>Remove Implicit Flow:</strong> Migrate to Authorization Code + PKCE</li>
            <li><strong>Remove Password Grant:</strong> Use Authorization Code flow instead</li>
            <li><strong>Secure Bearer Tokens:</strong> Use Authorization headers, not query strings</li>
            <li><strong>Enhance Refresh Tokens:</strong> Implement sender-constrained or one-time use tokens</li>
          </ol>

          <h3>Benefits of Migration</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Enhanced Security:</strong> PKCE prevents authorization code interception</li>
            <li><strong>Better Token Handling:</strong> Prevents token leakage in logs and referrers</li>
            <li><strong>Future-Proof:</strong> Aligns with industry best practices and standards</li>
            <li><strong>Improved User Experience:</strong> More secure and reliable authentication flows</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2>PingOne OAuth 2.1 Readiness</h2>
        </CardHeader>
        <CardBody>
          <p>
            PingOne is well-positioned for OAuth 2.1 adoption with comprehensive support for:
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>PKCE Support:</strong> Full PKCE implementation for all flows</li>
            <li><strong>Exact URI Matching:</strong> Secure redirect URI validation</li>
            <li><strong>Bearer Token Security:</strong> Proper token handling practices</li>
            <li><strong>Enhanced Refresh Tokens:</strong> Sender-constrained and one-time use options</li>
            <li><strong>Backward Compatibility:</strong> Gradual migration support</li>
          </ul>
          
          <PingOneNote>
            <FiInfo />
            <div>
              <h4>Recommendation</h4>
              <p>Start implementing OAuth 2.1 practices now to ensure a smooth transition when the specification is finalized.</p>
            </div>
          </PingOneNote>
        </CardBody>
      </Card>
    </Container>
  );
};

export default OAuth21;
