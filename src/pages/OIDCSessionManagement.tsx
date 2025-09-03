import React from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiUsers, FiLogOut, FiMonitor, FiShield, FiRefreshCw, FiInfo, FiCheck } from 'react-icons/fi';
import PageTitle from '../components/PageTitle';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;



const OverviewCard = styled(Card)`
  margin-bottom: 2rem;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const FlowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const FlowCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.info};
`;

const FlowIcon = styled.div`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.info};
  margin-bottom: 1rem;
`;

const FlowTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

const FlowDescription = styled.p`
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

const SecurityNote = styled.div`
  background-color: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.warning};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h4 {
    color: ${({ theme }) => theme.colors.warning};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.warning};
    font-size: 0.9rem;
  }
`;

const OIDCSessionManagement = () => {
  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiUsers />
            OpenID Connect Session Management
          </>
        }
        subtitle="OpenID Connect Session Management 1.0 is a specification that defines how to manage sessions for OpenID Connect, including when to log out the End-User. It enables Relying Parties to monitor the End-User's login status at the OpenID Provider on an ongoing basis."
      />

      <OverviewCard>
        <CardHeader>
          <h2>What is OpenID Connect Session Management?</h2>
        </CardHeader>
        <CardBody>
          <p>
            OpenID Connect Session Management complements the OpenID Connect Core 1.0 specification by defining how to 
            monitor the End-User's login status at the OpenID Provider on an ongoing basis. This allows Relying Parties 
            to log out End-Users who have logged out of the OpenID Provider.
          </p>
          <p>
            <strong>Specification:</strong> OpenID Connect Session Management 1.0 - 
            <a href="https://openid.net/specs/openid-connect-session-1_0.html" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>
              View on openid.net →
            </a>
          </p>
        </CardBody>
      </OverviewCard>

      <Card>
        <CardHeader>
          <h2>Session Management Flows</h2>
        </CardHeader>
        <CardBody>
          <FlowGrid>
            {/* Session Creation */}
            <FlowCard>
              <CardBody>
                <FlowIcon>
                  <FiUsers />
                </FlowIcon>
                <FlowTitle>Creating and Updating Sessions</FlowTitle>
                <FlowDescription>
                  In OpenID Connect, the session at the RP typically starts when the RP validates the End-User's ID Token. 
                  The OP returns a session_state parameter for session management.
                </FlowDescription>
                <CodeBlock>{`// Authentication Response includes session_state
{
  "code": "authorization_code",
  "state": "xyz123",
  "session_state": "abc456def789"
}

// session_state is REQUIRED if session management is supported
// It represents the End-User's login state at the OP`}</CodeBlock>
                <PingOneNote>
                  <FiInfo />
                  <div>
                    <h4>PingOne Support</h4>
                    <p>PingOne provides session_state in authentication responses for session management.</p>
                  </div>
                </PingOneNote>
              </CardBody>
            </FlowCard>

            {/* Session Status Change Notification */}
            <FlowCard>
              <CardBody>
                <FlowIcon>
                  <FiMonitor />
                </FlowIcon>
                <FlowTitle>Session Status Change Notification</FlowTitle>
                <FlowDescription>
                  The RP can monitor session status changes using iframes. The OP iframe communicates logout 
                  requests to the RP iframe, enabling real-time session monitoring.
                </FlowDescription>
                <CodeBlock>{`// RP iframe for session monitoring
<iframe src="https://op.example.com/check_session"
        id="op"
        style="display:none">
</iframe>

// OP iframe for session status changes
<iframe src="https://rp.example.com/session"
        id="rp"
        style="display:none">
</iframe>`}</CodeBlock>
                <SecurityNote>
                  <FiShield />
                  <div>
                    <h4>Security Consideration</h4>
                    <p>User agents may block access to third-party content, affecting iframe-based session monitoring.</p>
                  </div>
                </SecurityNote>
              </CardBody>
            </FlowCard>

            {/* RP-Initiated Logout */}
            <FlowCard>
              <CardBody>
                <FlowIcon>
                  <FiLogOut />
                </FlowIcon>
                <FlowTitle>RP-Initiated Logout</FlowTitle>
                <FlowDescription>
                  Relying Parties can initiate logout by redirecting the End-User to the OP's end session endpoint. 
                  This allows RPs to log out users from all sessions across multiple applications.
                </FlowDescription>
                <CodeBlock>{`// RP-initiated logout
GET /endsession?
  id_token_hint=eyJhbGciOiJSUzI1NiIs...
  &post_logout_redirect_uri=https://rp.example.com/logged_out
  &state=xyz789`}</CodeBlock>
                <PingOneNote>
                  <FiInfo />
                  <div>
                    <h4>PingOne Support</h4>
                    <p>PingOne supports RP-initiated logout with configurable post-logout redirect URIs.</p>
                  </div>
                </PingOneNote>
              </CardBody>
            </FlowCard>

            {/* Front-Channel Logout */}
            <FlowCard>
              <CardBody>
                <FlowIcon>
                  <FiRefreshCw />
                </FlowIcon>
                <FlowTitle>Front-Channel Logout</FlowTitle>
                <FlowDescription>
                  Front-channel logout uses the User Agent to communicate logout requests from the OP to RPs. 
                  This enables immediate logout across multiple applications without polling.
                </FlowDescription>
                <CodeBlock>{`// Front-channel logout request
GET /logout?
  iss=https://op.example.com
  &sid=abc123def456
  &iat=1516239022`}</CodeBlock>
                <PingOneNote>
                  <FiInfo />
                  <div>
                    <h4>PingOne Support</h4>
                    <p>PingOne supports front-channel logout for immediate session termination across applications.</p>
                  </div>
                </PingOneNote>
              </CardBody>
            </FlowCard>

            {/* Back-Channel Logout */}
            <FlowCard>
              <CardBody>
                <FlowIcon>
                  <FiShield />
                </FlowIcon>
                <FlowTitle>Back-Channel Logout</FlowTitle>
                <FlowDescription>
                  Back-channel logout uses direct communication between the OP and RPs being logged out. 
                  This is more reliable than front-channel logout but requires server-to-server communication.
                </FlowDescription>
                <CodeBlock>{`// Back-channel logout request
POST /backchannel_logout
Content-Type: application/json

{
  "iss": "https://op.example.com",
  "sid": "abc123def456",
  "iat": 1516239022,
  "jti": "logout_token_123"
}`}</CodeBlock>
                <PingOneNote>
                  <FiInfo />
                  <div>
                    <h4>PingOne Support</h4>
                    <p>PingOne supports back-channel logout for reliable server-to-server logout communication.</p>
                  </div>
                </PingOneNote>
              </CardBody>
            </FlowCard>

            {/* Session Validation */}
            <FlowCard>
              <CardBody>
                <FlowIcon>
                  <FiCheck />
                </FlowIcon>
                <FlowTitle>Session Validation</FlowTitle>
                <FlowDescription>
                  RPs can validate session state by comparing the session_state parameter with the current 
                  session state calculated using the Client ID, origin URL, and OP User Agent state.
                </FlowDescription>
                <CodeBlock>{`// Session state validation
const expectedSessionState = calculateSessionState(
  clientId,
  originUrl,
  opUserAgentState
);

if (sessionState !== expectedSessionState) {
  // Session has changed, user should re-authenticate
  redirectToLogin();
}`}</CodeBlock>
                <SecurityNote>
                  <FiShield />
                  <div>
                    <h4>Security Note</h4>
                    <p>Session state validation prevents session fixation attacks and ensures session integrity.</p>
                  </div>
                </SecurityNote>
              </CardBody>
            </FlowCard>
          </FlowGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2>Implementation Considerations</h2>
        </CardHeader>
        <CardBody>
          <h3>Session State Calculation</h3>
          <p>
            The Session State value is calculated on the server and recalculated by the OP iframe in the User Agent. 
            It's based on a salted cryptographic hash of:
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Client ID:</strong> The OAuth client identifier</li>
            <li><strong>Origin URL:</strong> The origin URL of the Authentication Response</li>
            <li><strong>OP User Agent State:</strong> The OpenID Provider's User Agent state</li>
          </ul>

          <h3>Iframe Communication</h3>
          <p>
            Session monitoring relies on iframe communication between the OP and RP. This approach has some limitations:
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Third-party Content Blocking:</strong> Modern browsers may block iframe access</li>
            <li><strong>Cross-origin Restrictions:</strong> Same-origin policy limitations</li>
            <li><strong>User Privacy:</strong> Users may disable third-party cookies</li>
          </ul>

          <h3>Alternative Approaches</h3>
          <p>
            When iframe-based session monitoring isn't suitable, consider these alternatives:
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Polling:</strong> Periodically check session status via API calls</li>
            <li><strong>WebSockets:</strong> Real-time session status updates</li>
            <li><strong>Server-Sent Events:</strong> Push-based session notifications</li>
            <li><strong>Token Refresh:</strong> Use token expiration for session management</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2>PingOne Session Management Features</h2>
        </CardHeader>
        <CardBody>
          <p>
            PingOne provides comprehensive session management capabilities aligned with OpenID Connect standards:
          </p>
          
          <h3>Supported Logout Flows</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>RP-Initiated Logout:</strong> Applications can initiate user logout</li>
            <li><strong>Front-Channel Logout:</strong> Immediate logout across multiple applications</li>
            <li><strong>Back-Channel Logout:</strong> Reliable server-to-server logout communication</li>
            <li><strong>Session Monitoring:</strong> Real-time session status tracking</li>
          </ul>

          <h3>Configuration Options</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Post-Logout Redirect URIs:</strong> Configure where users go after logout</li>
            <li><strong>Session Timeout:</strong> Configurable session duration</li>
            <li><strong>Idle Timeout:</strong> Automatic logout after inactivity</li>
            <li><strong>Multi-Session Support:</strong> Manage multiple concurrent sessions</li>
          </ul>

          <PingOneNote>
            <FiInfo />
            <div>
              <h4>Best Practice</h4>
              <p>Implement both front-channel and back-channel logout for comprehensive session management coverage.</p>
            </div>
          </PingOneNote>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2>Security Best Practices</h2>
        </CardHeader>
        <CardBody>
          <h3>Session Security</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Secure Session State:</strong> Use cryptographically strong session state values</li>
            <li><strong>HTTPS Only:</strong> Always use HTTPS for session management endpoints</li>
            <li><strong>Token Validation:</strong> Validate all tokens and session state parameters</li>
            <li><strong>Logout Confirmation:</strong> Confirm logout actions to prevent accidental logouts</li>
          </ul>

          <h3>Implementation Security</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>CSRF Protection:</strong> Implement CSRF tokens for logout requests</li>
            <li><strong>Origin Validation:</strong> Validate origin headers for security</li>
            <li><strong>Session Timeout:</strong> Implement reasonable session timeouts</li>
            <li><strong>Audit Logging:</strong> Log all session management events</li>
          </ul>

          <SecurityNote>
            <FiShield />
            <div>
              <h4>Security Warning</h4>
              <p>Always validate session state and implement proper CSRF protection for logout endpoints.</p>
            </div>
          </SecurityNote>
        </CardBody>
      </Card>
    </Container>
  );
};

export default OIDCSessionManagement;
