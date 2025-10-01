import React, { useState } from 'react';
import styled from 'styled-components';
import { FiShield, FiLock, FiZap, FiCpu, FiCode, FiInfo, FiCheckCircle, FiBook, FiUsers, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import CollapsibleIcon from '../components/CollapsibleIcon';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  background: white;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #0f1419 0%, #1a252f 100%);
  color: white;
  padding: 3.5rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border-bottom: 3px solid #667eea;

  h1 {
    font-size: 2.8rem;
    margin-bottom: 0.75rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #ffffff;
    text-shadow: 0 3px 6px rgba(0,0,0,0.4);
    letter-spacing: -0.5px;
  }

  p {
    font-size: 1.3rem;
    opacity: 1;
    color: #f0f4f8;
    font-weight: 500;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
`;

const Nav = styled.nav`
  background: #1a252f;
  padding: 1.125rem 2.5rem;
  position: sticky;
  top: 60px;
  z-index: 100;
  box-shadow: 0 3px 12px rgba(0,0,0,0.3);
  border-bottom: 2px solid rgba(102, 126, 234, 0.3);

  ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
    margin: 0;
    padding: 0;
  }

  a {
    color: #ffffff;
    text-decoration: none;
    padding: 0.625rem 1.25rem;
    border-radius: 0.375rem;
    transition: all 0.3s;
    font-weight: 600;
    font-size: 1rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);

    &:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
  }
`;

const Content = styled.div`
  padding: 2.5rem;
`;

const Section = styled.section`
  margin-bottom: 3.125rem;
`;

const SectionTitle = styled.h2`
  color: #1a252f;
  font-size: 2rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.625rem;
  border-bottom: 3px solid #667eea;
  font-weight: 700;
`;

const SubTitle = styled.h3`
  color: #2c3e50;
  font-size: 1.5rem;
  margin: 1.5625rem 0 0.9375rem 0;
  font-weight: 600;
`;

const InfoBox = styled.div`
  background: #f8f9fa;
  padding: 1.875rem;
  border-radius: 0.5rem;
  margin: 1.25rem 0;
  border-left: 4px solid #667eea;

  strong {
    color: #667eea;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
  margin: 1.25rem 0;
`;

const Card = styled.div`
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 0.75rem;
  padding: 1.5625rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  }

  h4 {
    color: #667eea;
    margin-top: 0;
    font-size: 1.25rem;
  }

  p {
    margin: 0.5rem 0;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.25rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);

  th, td {
    padding: 0.9375rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background: #667eea;
    color: white;
    font-weight: 600;
  }

  tr:hover {
    background: #f5f5f5;
  }
`;

const CodeBlock = styled.pre`
  background: #1a252f;
  color: #e8eef3;
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.25rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  border: 1px solid #34495e;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
`;

const FlowDiagram = styled.div`
  background: #f8f9fa;
  padding: 1.875rem;
  border-radius: 0.5rem;
  margin: 1.25rem 0;
  text-align: center;
`;

const FlowStep = styled.div`
  background: white;
  border: 2px solid #667eea;
  border-radius: 0.5rem;
  padding: 0.9375rem;
  margin: 0.625rem auto;
  max-width: 600px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const Arrow = styled.div`
  color: #667eea;
  font-size: 2rem;
  margin: 0.625rem 0;
`;

const Tag = styled.span<{ $type?: 'security' | 'privacy' | 'future' | 'standard' }>`
  display: inline-block;
  background: ${({ $type }) => {
    switch ($type) {
      case 'security': return '#e74c3c';
      case 'privacy': return '#9b59b6';
      case 'future': return '#27ae60';
      case 'standard': return '#3498db';
      default: return '#667eea';
    }
  }};
  color: white;
  padding: 0.3125rem 0.75rem;
  border-radius: 1.25rem;
  font-size: 0.85rem;
  margin: 0.3125rem 0.3125rem 0.3125rem 0;
  font-weight: 500;
`;

// Collapsible Section Components
const CollapsibleSection = styled.div`
  margin-bottom: 2rem;
`;

const CollapsibleHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  &:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }
  
  h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1a252f;
    display: flex;
    align-items: center;
    gap: 1rem;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
`;

const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '5000px' : '0')};
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  transition: opacity 0.3s ease-in-out;
`;

const ComprehensiveOAuthEducation: React.FC = () => {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basics: true,
    flows: true,
    currentStandards: true,
    aiConsiderations: true,
    security: true,
    future: true,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <Container>
      <Header>
        <h1>
          <FiLock />
          OAuth 2.0 & OpenID Connect for AI
        </h1>
        <p>A Comprehensive Guide to Authentication & Authorization in the Age of AI</p>
      </Header>

      <Nav>
        <ul>
          <li><a href="#basics">Basics</a></li>
          <li><a href="#flows">Flows</a></li>
          <li><a href="#current-standards">Current Standards</a></li>
          <li><a href="#ai-considerations">AI Considerations</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#future">Future</a></li>
        </ul>
      </Nav>

      <Content>
        <CollapsibleSection>
          <CollapsibleHeader onClick={() => toggleSection('basics')}>
            <h2>
              <FiBook />
              Understanding the Basics
            </h2>
            <CollapsibleIcon isExpanded={expandedSections.basics} />
          </CollapsibleHeader>
          <CollapsibleContent $isOpen={expandedSections.basics}>
            <Section id="basics">
              <SubTitle>What is OAuth 2.0?</SubTitle>
              <p>OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service. It works by delegating user authentication to the service that hosts the user account and authorizing third-party applications to access that user account.</p>

              <InfoBox>
                <strong>Key Concept:</strong> OAuth 2.0 is about <strong>authorization</strong> (what you can do), not authentication (who you are). That's where OpenID Connect comes in.
              </InfoBox>

              <SubTitle>What is OpenID Connect (OIDC)?</SubTitle>
              <p>OpenID Connect is an identity layer built on top of OAuth 2.0. It allows clients to verify the identity of end-users based on authentication performed by an authorization server, and to obtain basic profile information about the end-user.</p>

              <Grid>
                <Card>
                  <h4>OAuth 2.0</h4>
                  <p><strong>Purpose:</strong> Authorization</p>
                  <p><strong>Question:</strong> "What can this app access?"</p>
                  <p><strong>Output:</strong> Access tokens</p>
                </Card>
                <Card>
                  <h4>OpenID Connect</h4>
                  <p><strong>Purpose:</strong> Authentication</p>
                  <p><strong>Question:</strong> "Who is this user?"</p>
                  <p><strong>Output:</strong> ID tokens (JWT)</p>
                </Card>
              </Grid>

              <SubTitle>Key Terminology</SubTitle>
              <Table>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Definition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Resource Owner</strong></td>
                    <td>The user who owns the data (you)</td>
                  </tr>
                  <tr>
                    <td><strong>Client</strong></td>
                    <td>The application requesting access (the AI app)</td>
                  </tr>
                  <tr>
                    <td><strong>Authorization Server</strong></td>
                    <td>The server that authenticates the user and issues tokens</td>
                  </tr>
                  <tr>
                    <td><strong>Resource Server</strong></td>
                    <td>The API that holds the protected resources</td>
                  </tr>
                  <tr>
                    <td><strong>Access Token</strong></td>
                    <td>Credential used to access protected resources</td>
                  </tr>
                  <tr>
                    <td><strong>Refresh Token</strong></td>
                    <td>Long-lived token used to obtain new access tokens</td>
                  </tr>
                  <tr>
                    <td><strong>ID Token</strong></td>
                    <td>JWT containing user identity information (OIDC)</td>
                  </tr>
                </tbody>
              </Table>
            </Section>
          </CollapsibleContent>
        </CollapsibleSection>

        <CollapsibleSection>
          <CollapsibleHeader onClick={() => toggleSection('flows')}>
            <h2>
              <FiCode />
              OAuth 2.0 Grant Types & Flows
            </h2>
            <CollapsibleIcon isExpanded={expandedSections.flows} />
          </CollapsibleHeader>
          <CollapsibleContent $isOpen={expandedSections.flows}>
            <Section id="flows">
              <SubTitle>1. Authorization Code Flow (Recommended for AI Apps)</SubTitle>
              <FlowDiagram>
                <FlowStep>
                  <strong>Step 1:</strong> User clicks "Login" in AI app
                </FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>
                  <strong>Step 2:</strong> App redirects to Authorization Server with client_id, redirect_uri, scope, state
                </FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>
                  <strong>Step 3:</strong> User authenticates and consents to permissions
                </FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>
                  <strong>Step 4:</strong> Authorization Server redirects back with authorization code
                </FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>
                  <strong>Step 5:</strong> App exchanges code for tokens (access + refresh + ID token)
                </FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>
                  <strong>Step 6:</strong> App uses access token to call APIs
                </FlowStep>
              </FlowDiagram>

              <CodeBlock>{`// Step 2: Authorization Request
GET /authorize?
  response_type=code&
  client_id=ai_app_123&
  redirect_uri=https://aiapp.com/callback&
  scope=openid profile email ai:read ai:write&
  state=xyz123&
  code_challenge=E9Melhoa...&
  code_challenge_method=S256

// Step 5: Token Exchange
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=abc123&
redirect_uri=https://aiapp.com/callback&
client_id=ai_app_123&
client_secret=secret&
code_verifier=dBjftJeZ...`}</CodeBlock>

              <SubTitle>2. Authorization Code Flow with PKCE</SubTitle>
              <InfoBox>
                <strong>PKCE (Proof Key for Code Exchange):</strong> Essential security extension that prevents authorization code interception attacks. <strong>Required for public clients</strong> (SPAs, mobile apps, desktop apps).
                <br /><br />
                <Tag $type="security">Security</Tag>
                <Tag $type="standard">RFC 7636</Tag>
              </InfoBox>

              <CodeBlock>{`// Generate PKCE values
const codeVerifier = generateRandomString(43-128 chars);
const codeChallenge = base64url(sha256(codeVerifier));

// Include in authorization request
code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
code_challenge_method=S256

// Include verifier in token request
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`}</CodeBlock>

              <SubTitle>3. Client Credentials Flow (AI-to-AI Communication)</SubTitle>
              <p>Used when the AI application itself needs to access resources, not on behalf of a user. Common for background AI agents, batch processing, and service-to-service communication.</p>

              <CodeBlock>{`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=ai_service_456&
client_secret=service_secret&
scope=ai:process ai:analyze`}</CodeBlock>

              <SubTitle>4. Device Authorization Flow (AI Devices & IoT)</SubTitle>
              <p>For input-constrained devices like AI assistants, smart displays, or IoT devices that don't have a browser.</p>

              <FlowDiagram>
                <FlowStep>Device requests device code from authorization server</FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>Server returns device code, user code, and verification URL</FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>Device displays user code and verification URL</FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>User visits URL on another device and enters code</FlowStep>
                <Arrow>↓</Arrow>
                <FlowStep>Device polls token endpoint until user completes authorization</FlowStep>
              </FlowDiagram>
            </Section>
          </CollapsibleContent>
        </CollapsibleSection>

        <CollapsibleSection>
          <CollapsibleHeader onClick={() => toggleSection('currentStandards')}>
            <h2>
              <FiShield />
              Current Standards & Best Practices
            </h2>
            <CollapsibleIcon isExpanded={expandedSections.currentStandards} />
          </CollapsibleHeader>
          <CollapsibleContent $isOpen={expandedSections.currentStandards}>
            <Section id="current-standards">
              <SubTitle>Pushed Authorization Requests (PAR) - RFC 9126</SubTitle>
              <Tag $type="standard">RFC 9126</Tag>
              <Tag $type="security">Security</Tag>

              <InfoBox>
                <strong>What is PAR?</strong> Instead of passing authorization parameters in the URL, the client POSTs them directly to the authorization server and receives a request URI. This significantly improves security and privacy.
              </InfoBox>

              <p><strong>Benefits:</strong></p>
              <ul>
                <li>Prevents parameter tampering</li>
                <li>Protects sensitive data in authorization requests</li>
                <li>Enables larger request payloads</li>
                <li>Reduces URL length issues</li>
              </ul>

              <CodeBlock>{`// Step 1: Push authorization request
POST /as/par
Content-Type: application/x-www-form-urlencoded

client_id=ai_app_123&
response_type=code&
redirect_uri=https://aiapp.com/callback&
scope=openid profile ai:read&
code_challenge=E9Melhoa...&
code_challenge_method=S256

// Response
{
  "request_uri": "urn:ietf:params:oauth:request_uri:abc123",
  "expires_in": 90
}

// Step 2: Use request_uri in authorization request
GET /authorize?
  client_id=ai_app_123&
  request_uri=urn:ietf:params:oauth:request_uri:abc123`}</CodeBlock>
            </Section>
          </CollapsibleContent>
        </CollapsibleSection>

        <CollapsibleSection>
          <CollapsibleHeader onClick={() => toggleSection('aiConsiderations')}>
            <h2>
              <FiUsers />
              Special Considerations for AI Applications
            </h2>
            <CollapsibleIcon isExpanded={expandedSections.aiConsiderations} />
          </CollapsibleHeader>
          <CollapsibleContent $isOpen={expandedSections.aiConsiderations}>
            <Section id="ai-considerations">
              <Grid>
                <Card>
                  <h4><FiCpu style={{ marginRight: '0.5rem' }} />Long-Running Sessions</h4>
                  <p>AI applications often need extended access. Use refresh tokens with appropriate rotation policies.</p>
                </Card>
                <Card>
                  <h4><FiShield style={{ marginRight: '0.5rem' }} />Fine-Grained Permissions</h4>
                  <p>Define specific scopes for AI capabilities: ai:read, ai:write, ai:train, ai:deploy</p>
                </Card>
                <Card>
                  <h4><FiZap style={{ marginRight: '0.5rem' }} />Rate Limiting</h4>
                  <p>Implement token-based rate limiting to prevent abuse of AI resources</p>
                </Card>
              </Grid>

              <SubTitle>Recommended Scopes for AI Applications</SubTitle>
              <Table>
                <thead>
                  <tr>
                    <th>Scope</th>
                    <th>Description</th>
                    <th>Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>ai:read</code></td>
                    <td>Read AI model outputs and results</td>
                    <td>Viewing AI-generated content</td>
                  </tr>
                  <tr>
                    <td><code>ai:write</code></td>
                    <td>Create and modify AI requests</td>
                    <td>Submitting prompts, training data</td>
                  </tr>
                  <tr>
                    <td><code>ai:train</code></td>
                    <td>Train or fine-tune AI models</td>
                    <td>Custom model training</td>
                  </tr>
                  <tr>
                    <td><code>ai:deploy</code></td>
                    <td>Deploy AI models to production</td>
                    <td>Model deployment and management</td>
                  </tr>
                  <tr>
                    <td><code>ai:admin</code></td>
                    <td>Full administrative access</td>
                    <td>System configuration and management</td>
                  </tr>
                </tbody>
              </Table>
            </Section>
          </CollapsibleContent>
        </CollapsibleSection>

        <CollapsibleSection>
          <CollapsibleHeader onClick={() => toggleSection('security')}>
            <h2>
              <FiAlertTriangle />
              Security Best Practices
            </h2>
            <CollapsibleIcon isExpanded={expandedSections.security} />
          </CollapsibleHeader>
          <CollapsibleContent $isOpen={expandedSections.security}>
            <Section id="security">
              <InfoBox>
                <strong>Critical Security Measures for AI Applications:</strong>
              </InfoBox>

              <Grid>
                <Card>
                  <h4>1. Always Use HTTPS</h4>
                  <p>All OAuth/OIDC communication must use TLS 1.2 or higher to protect tokens in transit.</p>
                </Card>
                <Card>
                  <h4>2. Implement PKCE</h4>
                  <p>Required for public clients. Prevents authorization code interception attacks.</p>
                </Card>
                <Card>
                  <h4>3. Validate Redirect URIs</h4>
                  <p>Strictly validate redirect URIs to prevent open redirect vulnerabilities.</p>
                </Card>
                <Card>
                  <h4>4. Short-Lived Access Tokens</h4>
                  <p>Keep access token lifetime short (15-60 minutes). Use refresh tokens for extended access.</p>
                </Card>
                <Card>
                  <h4>5. Rotate Refresh Tokens</h4>
                  <p>Implement refresh token rotation to detect token theft.</p>
                </Card>
                <Card>
                  <h4>6. Validate JWT Signatures</h4>
                  <p>Always verify ID token and JWT signatures using the issuer's public keys (JWKS).</p>
                </Card>
              </Grid>

              <SubTitle>Token Storage Best Practices</SubTitle>
              <Table>
                <thead>
                  <tr>
                    <th>Environment</th>
                    <th>Storage Method</th>
                    <th>Security Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Web (SPA)</td>
                    <td>Memory only (no localStorage)</td>
                    <td>Use BFF pattern for sensitive apps</td>
                  </tr>
                  <tr>
                    <td>Mobile (Native)</td>
                    <td>Secure keychain/keystore</td>
                    <td>OS-level encryption</td>
                  </tr>
                  <tr>
                    <td>Server-Side</td>
                    <td>Encrypted database or secrets manager</td>
                    <td>Never log tokens</td>
                  </tr>
                  <tr>
                    <td>Desktop</td>
                    <td>OS credential manager</td>
                    <td>Encrypt at rest</td>
                  </tr>
                </tbody>
              </Table>
            </Section>
          </CollapsibleContent>
        </CollapsibleSection>

        <CollapsibleSection>
          <CollapsibleHeader onClick={() => toggleSection('future')}>
            <h2>
              <FiTrendingUp />
              Future of OAuth for AI
            </h2>
            <CollapsibleIcon isExpanded={expandedSections.future} />
          </CollapsibleHeader>
          <CollapsibleContent $isOpen={expandedSections.future}>
            <Section id="future">
              <SubTitle>Emerging Standards</SubTitle>

              <Card>
                <h4>Rich Authorization Requests (RAR) - RFC 9396</h4>
                <Tag $type="future">Future</Tag>
                <Tag $type="standard">RFC 9396</Tag>
                <p>Enables fine-grained authorization using structured JSON instead of simple scopes.</p>
                <CodeBlock>{`{
  "authorization_details": [
    {
      "type": "ai_model_access",
      "model": "gpt-4",
      "actions": ["read", "write"],
      "max_tokens": 10000,
      "rate_limit": "100/hour"
    }
  ]
}`}</CodeBlock>
              </Card>

              <Card style={{ marginTop: '1.25rem' }}>
                <h4>DPoP (Demonstrating Proof of Possession) - RFC 9449</h4>
                <Tag $type="future">Future</Tag>
                <Tag $type="security">Security</Tag>
                <p>Sender-constrained tokens that prevent token theft and replay attacks.</p>
              </Card>

              <SubTitle>AI-Specific Challenges</SubTitle>
              <ul>
                <li><strong>Model Access Control:</strong> How to authorize access to specific AI models</li>
                <li><strong>Token Consumption:</strong> Tracking and limiting AI token usage per authorization</li>
                <li><strong>Multi-Modal Permissions:</strong> Different permissions for text, image, audio AI capabilities</li>
                <li><strong>Training Data Privacy:</strong> Ensuring user data used for AI training is properly authorized</li>
                <li><strong>AI Agent Delegation:</strong> How AI agents can act on behalf of users with proper authorization chains</li>
              </ul>
            </Section>
          </CollapsibleContent>
        </CollapsibleSection>
      </Content>
    </Container>
  );
};

export default ComprehensiveOAuthEducation;
