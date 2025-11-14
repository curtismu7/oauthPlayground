import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import {
	FiUsers,
	FiLogOut,
	FiMonitor,
	FiShield,
	FiRefreshCw,
	FiInfo,
	FiCheck,
	FiPlay,
	FiCode,
	FiArrowRight,
	FiCopy,
	FiExternalLink,
} from 'react-icons/fi';
import PageTitle from '../components/PageTitle';
import CollapsibleSection from '../components/CollapsibleSection';

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
  background-color: #fdecea;
  border: 1px solid #f5c2c7;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: #dc3545;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h4 {
    color: #dc3545;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #dc3545;
    font-size: 0.9rem;
  }
`;

const InteractiveSection = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 2px solid #e2e8f0;
`;

const DemoButton = styled.button`
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin: 1rem 0;

  &:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 1.1rem;
  }
`;

const CodeExample = styled.div`
  background: #1e293b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  position: relative;
  overflow-x: auto;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #334155;
`;

const CodeTitle = styled.span`
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CopyButton = styled.button`
  background: #334155;
  color: #94a3b8;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: #475569;
    color: #e2e8f0;
  }
`;

const CodeContent = styled.pre`
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
`;

const FlowStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const StepNumber = styled.div`
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
`;

const StepDescription = styled.p`
  margin: 0 0 0.75rem 0;
  color: #64748b;
  line-height: 1.5;
`;

const FlowDiagram = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 0.75rem;
  border: 2px solid #cbd5e1;
`;

const FlowActor = styled.div`
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 2px solid #e2e8f0;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ActorIcon = styled.div`
  font-size: 2rem;
  color: #3b82f6;
  margin-bottom: 0.5rem;
`;

const ActorName = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const ActorRole = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const FlowArrow = styled.div`
  color: #3b82f6;
  font-size: 1.5rem;
  margin: 0 1rem;
`;

const PingOneBadge = styled.div`
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
`;

const ImplementationCard = styled(Card)`
  border-left: 4px solid #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
`;

const WarningCard = styled(Card)`
  border-left: 4px solid #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
`;

const OIDCSessionManagement = () => {
	const [activeDemo, setActiveDemo] = useState<string | null>(null);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCode(id);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const renderCodeExample = (title: string, code: string, id: string, language = 'javascript') => (
		<CodeExample>
			<CodeHeader>
				<CodeTitle>
					<FiCode />
					{title}
				</CodeTitle>
				<CopyButton onClick={() => copyToClipboard(code, id)}>
					<FiCopy />
					{copiedCode === id ? 'Copied!' : 'Copy'}
				</CopyButton>
			</CodeHeader>
			<CodeContent>{code}</CodeContent>
		</CodeExample>
	);

	const renderFlowDiagram = (
		actors: Array<{ name: string; role: string; icon: React.ReactNode }>
	) => (
		<FlowDiagram>
			{actors.map((actor, index) => (
				<React.Fragment key={index}>
					<FlowActor>
						<ActorIcon>{actor.icon}</ActorIcon>
						<ActorName>{actor.name}</ActorName>
						<ActorRole>{actor.role}</ActorRole>
					</FlowActor>
					{index < actors.length - 1 && <FlowArrow></FlowArrow>}
				</React.Fragment>
			))}
		</FlowDiagram>
	);

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
						OpenID Connect Session Management complements the OpenID Connect Core 1.0 specification
						by defining how to monitor the End-User's login status at the OpenID Provider on an
						ongoing basis. This allows Relying Parties to log out End-Users who have logged out of
						the OpenID Provider.
					</p>

					<InteractiveSection>
						<h3> Key Benefits</h3>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
								gap: '1rem',
								marginTop: '1rem',
							}}
						>
							<div
								style={{
									padding: '1rem',
									background: 'white',
									borderRadius: '0.5rem',
									border: '2px solid #e2e8f0',
								}}
							>
								<FiShield
									style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
								/>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Enhanced Security</h4>
								<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
									Real-time session monitoring prevents unauthorized access
								</p>
							</div>
							<div
								style={{
									padding: '1rem',
									background: 'white',
									borderRadius: '0.5rem',
									border: '2px solid #e2e8f0',
								}}
							>
								<FiUsers style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.5rem' }} />
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Better UX</h4>
								<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
									Seamless logout across multiple applications
								</p>
							</div>
							<div
								style={{
									padding: '1rem',
									background: 'white',
									borderRadius: '0.5rem',
									border: '2px solid #e2e8f0',
								}}
							>
								<FiMonitor
									style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
								/>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Centralized Control</h4>
								<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
									Manage sessions from a single identity provider
								</p>
							</div>
						</div>
					</InteractiveSection>

					<div
						style={{
							marginTop: '1.5rem',
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
							flexWrap: 'wrap',
						}}
					>
						<strong>Specification:</strong> OpenID Connect Session Management 1.0
						<a
							href="https://openid.net/specs/openid-connect-session-1_0.html"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: '#3b82f6',
								textDecoration: 'none',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.5rem 1rem',
								background: '#eff6ff',
								borderRadius: '0.5rem',
								border: '1px solid #dbeafe',
							}}
						>
							<FiExternalLink />
							View on openid.net
						</a>
					</div>
				</CardBody>
			</OverviewCard>

			<CollapsibleSection title=" Session Management Flows" defaultOpen={true}>
				<div style={{ marginTop: '1rem' }}>
					<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
						Explore the different session management flows available in OpenID Connect. Each flow
						serves a specific purpose for monitoring and managing user sessions across applications.
					</p>

					<FlowGrid>
						{/* Session Creation */}
						<FlowCard>
							<CardBody>
								<FlowIcon>
									<FiUsers />
								</FlowIcon>
								<FlowTitle>
									Creating and Updating Sessions
									<PingOneBadge>PingOne</PingOneBadge>
								</FlowTitle>
								<FlowDescription>
									In OpenID Connect, the session at the RP typically starts when the RP validates
									the End-User's ID Token. The OP returns a session_state parameter for session
									management.
								</FlowDescription>

								{renderFlowDiagram([
									{ name: 'User', role: 'End User', icon: <FiUsers /> },
									{ name: 'RP', role: 'Relying Party', icon: <FiMonitor /> },
									{
										name: 'PingOne',
										role: 'OpenID Provider',
										icon: (
											<div
												style={{
													background: 'linear-gradient(135deg, #f59e0b, #d97706)',
													color: 'white',
													borderRadius: '4px',
													padding: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 'bold',
												}}
											>
												P1
											</div>
										),
									},
								])}

								<DemoButton
									onClick={() =>
										setActiveDemo(activeDemo === 'session-creation' ? null : 'session-creation')
									}
								>
									<FiPlay />
									{activeDemo === 'session-creation' ? 'Hide' : 'Show'} Implementation
								</DemoButton>

								{activeDemo === 'session-creation' && (
									<div>
										<h4>Step-by-Step Process:</h4>
										<FlowStep>
											<StepNumber>1</StepNumber>
											<StepContent>
												<StepTitle>User Authentication</StepTitle>
												<StepDescription>
													User completes authentication flow and receives authorization code
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>2</StepNumber>
											<StepContent>
												<StepTitle>Token Exchange</StepTitle>
												<StepDescription>
													RP exchanges authorization code for ID token and session_state
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>3</StepNumber>
											<StepContent>
												<StepTitle>Session Establishment</StepTitle>
												<StepDescription>
													RP creates local session and stores session_state for monitoring
												</StepDescription>
											</StepContent>
										</FlowStep>

										{renderCodeExample(
											'Authentication Response with session_state',
											`// PingOne authentication response
{
  "code": "authorization_code",
  "state": "xyz123",
  "session_state": "abc456def789"
}

// session_state is REQUIRED if session management is supported
// It represents the End-User's login state at the OP
// Format: base64url(sha256(client_id + origin + OP_session_state + salt))`,
											'session-state-response'
										)}

										{renderCodeExample(
											'Session State Validation',
											`// Validate session state on RP
function validateSessionState(sessionState, clientId, origin, opSessionState) {
  const salt = 'your-salt-value'; // From OP configuration
  const expected = base64url(sha256(clientId + origin + opSessionState + salt));
  return sessionState === expected;
}

// Usage
if (validateSessionState(sessionState, clientId, origin, opSessionState)) {
  console.log('Session state is valid');
} else {
  console.log('Session state mismatch - user may have logged out');
  redirectToLogin();
}`,
											'session-state-validation'
										)}
									</div>
								)}

								<PingOneNote>
									<FiInfo />
									<div>
										<h4>PingOne Configuration</h4>
										<p>
											Enable session management in your PingOne application configuration. The
											session_state parameter will be automatically included in authentication
											responses.
										</p>
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
									The RP can monitor session status changes using iframes. The OP iframe
									communicates logout requests to the RP iframe, enabling real-time session
									monitoring.
								</FlowDescription>

								{renderFlowDiagram([
									{ name: 'RP', role: 'Relying Party', icon: <FiMonitor /> },
									{ name: 'OP iframe', role: 'Session Monitor', icon: <FiShield /> },
									{
										name: 'OP',
										role: 'OpenID Provider',
										icon: (
											<div
												style={{
													background: 'linear-gradient(135deg, #f59e0b, #d97706)',
													color: 'white',
													borderRadius: '4px',
													padding: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 'bold',
												}}
											>
												P1
											</div>
										),
									},
								])}

								<DemoButton
									onClick={() =>
										setActiveDemo(
											activeDemo === 'session-notification' ? null : 'session-notification'
										)
									}
								>
									<FiPlay />
									{activeDemo === 'session-notification' ? 'Hide' : 'Show'} Implementation
								</DemoButton>

								{activeDemo === 'session-notification' && (
									<div>
										<h4>Step-by-Step Process:</h4>
										<FlowStep>
											<StepNumber>1</StepNumber>
											<StepContent>
												<StepTitle>Setup Monitoring iframes</StepTitle>
												<StepDescription>
													RP creates hidden iframes for session monitoring and OP creates iframe for
													status changes
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>2</StepNumber>
											<StepContent>
												<StepTitle>Session Status Check</StepTitle>
												<StepDescription>
													RP iframe polls OP to check current session status
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>3</StepNumber>
											<StepContent>
												<StepTitle>Logout Detection</StepTitle>
												<StepDescription>
													When user logs out, OP sends logout notification to RP iframe
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>4</StepNumber>
											<StepContent>
												<StepTitle>RP Logout</StepTitle>
												<StepDescription>
													RP receives notification and logs out user from application
												</StepDescription>
											</StepContent>
										</FlowStep>

										{renderCodeExample(
											'iframe Session Monitoring',
											`// RP iframe for session monitoring
<iframe src="https://op.example.com/check_session"
        id="op"
        style="display:none">
</iframe>

// OP iframe for session status changes
<iframe src="https://rp.example.com/session"
        id="rp"
        style="display:none">
</iframe>

// JavaScript for handling session changes
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://op.example.com') {
    return;
  }
  
  if (event.data.type === 'logout') {
    // User has been logged out, redirect to login
    window.location.href = '/login';
  }
});`,
											'iframe-session-monitoring'
										)}
									</div>
								)}

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
										<p>
											User agents may block access to third-party content, affecting iframe-based
											session monitoring.
										</p>
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
									Relying Parties can initiate logout by redirecting the End-User to the OP's end
									session endpoint. This allows RPs to log out users from all sessions across
									multiple applications.
								</FlowDescription>

								{renderFlowDiagram([
									{ name: 'RP', role: 'Relying Party', icon: <FiMonitor /> },
									{ name: 'User', role: 'End User', icon: <FiUsers /> },
									{
										name: 'OP',
										role: 'OpenID Provider',
										icon: (
											<div
												style={{
													background: 'linear-gradient(135deg, #f59e0b, #d97706)',
													color: 'white',
													borderRadius: '4px',
													padding: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 'bold',
												}}
											>
												P1
											</div>
										),
									},
								])}

								<DemoButton
									onClick={() => setActiveDemo(activeDemo === 'rp-logout' ? null : 'rp-logout')}
								>
									<FiPlay />
									{activeDemo === 'rp-logout' ? 'Hide' : 'Show'} Implementation
								</DemoButton>

								{activeDemo === 'rp-logout' && (
									<div>
										<h4>Step-by-Step Process:</h4>
										<FlowStep>
											<StepNumber>1</StepNumber>
											<StepContent>
												<StepTitle>User Requests Logout</StepTitle>
												<StepDescription>
													User clicks logout button in RP application
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>2</StepNumber>
											<StepContent>
												<StepTitle>RP Redirects to OP</StepTitle>
												<StepDescription>
													RP redirects user to OP's end session endpoint with logout parameters
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>3</StepNumber>
											<StepContent>
												<StepTitle>OP Logs Out User</StepTitle>
												<StepDescription>
													OP terminates user session and redirects back to RP
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>4</StepNumber>
											<StepContent>
												<StepTitle>RP Confirms Logout</StepTitle>
												<StepDescription>
													RP receives confirmation and logs out user from application
												</StepDescription>
											</StepContent>
										</FlowStep>

										{renderCodeExample(
											'RP-Initiated Logout Implementation',
											`// RP-initiated logout
function initiateLogout() {
  const idToken = localStorage.getItem('id_token');
  const postLogoutUri = encodeURIComponent('https://rp.example.com/logged_out');
  const state = generateRandomString();
  
  // Store state for validation
  sessionStorage.setItem('logout_state', state);
  
  // Redirect to OP end session endpoint
  const logoutUrl = \`https://op.example.com/endsession?\` +
    \`id_token_hint=\${idToken}&\` +
    \`post_logout_redirect_uri=\${postLogoutUri}&\` +
    \`state=\${state}\`;
    
  window.location.href = logoutUrl;
}

// Handle post-logout redirect
function handlePostLogoutRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const returnedState = urlParams.get('state');
  const storedState = sessionStorage.getItem('logout_state');
  
  if (returnedState === storedState) {
    // Logout successful, clear local session
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    sessionStorage.removeItem('logout_state');
    
    // Redirect to login page
    window.location.href = '/login';
  }
}`,
											'rp-initiated-logout'
										)}
									</div>
								)}

								<CodeBlock>{`// RP-initiated logout
GET /endsession?
  id_token_hint=eyJhbGciOiJSUzI1NiIs...
  &post_logout_redirect_uri=https://rp.example.com/logged_out
  &state=xyz789`}</CodeBlock>
								<PingOneNote>
									<FiInfo />
									<div>
										<h4>PingOne Support</h4>
										<p>
											PingOne supports RP-initiated logout with configurable post-logout redirect
											URIs.
										</p>
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
									Front-channel logout uses the User Agent to communicate logout requests from the
									OP to RPs. This enables immediate logout across multiple applications without
									polling.
								</FlowDescription>

								{renderFlowDiagram([
									{
										name: 'OP',
										role: 'OpenID Provider',
										icon: (
											<div
												style={{
													background: 'linear-gradient(135deg, #f59e0b, #d97706)',
													color: 'white',
													borderRadius: '4px',
													padding: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 'bold',
												}}
											>
												P1
											</div>
										),
									},
									{ name: 'User Agent', role: 'Browser', icon: <FiMonitor /> },
									{ name: 'RP', role: 'Relying Party', icon: <FiMonitor /> },
								])}

								<DemoButton
									onClick={() =>
										setActiveDemo(
											activeDemo === 'front-channel-logout' ? null : 'front-channel-logout'
										)
									}
								>
									<FiPlay />
									{activeDemo === 'front-channel-logout' ? 'Hide' : 'Show'} Implementation
								</DemoButton>

								{activeDemo === 'front-channel-logout' && (
									<div>
										<h4>Step-by-Step Process:</h4>
										<FlowStep>
											<StepNumber>1</StepNumber>
											<StepContent>
												<StepTitle>User Logs Out at OP</StepTitle>
												<StepDescription>
													User initiates logout at the OpenID Provider
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>2</StepNumber>
											<StepContent>
												<StepTitle>OP Generates Logout URLs</StepTitle>
												<StepDescription>
													OP creates logout URLs for all registered RPs with active sessions
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>3</StepNumber>
											<StepContent>
												<StepTitle>Browser Loads Logout Pages</StepTitle>
												<StepDescription>
													User Agent loads logout URLs for each RP in hidden iframes
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>4</StepNumber>
											<StepContent>
												<StepTitle>RPs Process Logout</StepTitle>
												<StepDescription>
													Each RP receives logout request and terminates user session
												</StepDescription>
											</StepContent>
										</FlowStep>

										{renderCodeExample(
											'Front-Channel Logout Implementation',
											`// OP logout page that triggers front-channel logout
<!DOCTYPE html>
<html>
<head>
  <title>Logout</title>
</head>
<body>
  <script>
    // Get logout URLs for all RPs
    const rpLogoutUrls = [
      'https://rp1.example.com/logout?iss=https://op.example.com&sid=abc123&iat=1516239022',
      'https://rp2.example.com/logout?iss=https://op.example.com&sid=def456&iat=1516239022'
    ];
    
    // Create hidden iframes for each RP logout URL
    rpLogoutUrls.forEach(url => {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    });
    
    // After logout iframes load, redirect to post-logout page
    setTimeout(() => {
      window.location.href = 'https://op.example.com/post_logout';
    }, 2000);
  </script>
</body>
</html>

// RP logout endpoint
app.get('/logout', (req, res) => {
  const { iss, sid, iat } = req.query;
  
  // Validate logout request
  if (iss !== 'https://op.example.com') {
    return res.status(400).send('Invalid issuer');
  }
  
  // Terminate user session
  req.session.destroy();
  
  // Return logout confirmation page
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head><title>Logged Out</title></head>
    <body>
      <script>window.close();</script>
      <p>You have been logged out.</p>
    </body>
    </html>
  \`);
});`,
											'front-channel-logout'
										)}
									</div>
								)}

								<CodeBlock>{`// Front-channel logout request
GET /logout?
  iss=https://op.example.com
  &sid=abc123def456
  &iat=1516239022`}</CodeBlock>
								<PingOneNote>
									<FiInfo />
									<div>
										<h4>PingOne Support</h4>
										<p>
											PingOne supports front-channel logout for immediate session termination across
											applications.
										</p>
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
									Back-channel logout uses direct communication between the OP and RPs being logged
									out. This is more reliable than front-channel logout but requires server-to-server
									communication.
								</FlowDescription>

								{renderFlowDiagram([
									{
										name: 'OP',
										role: 'OpenID Provider',
										icon: (
											<div
												style={{
													background: 'linear-gradient(135deg, #f59e0b, #d97706)',
													color: 'white',
													borderRadius: '4px',
													padding: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 'bold',
												}}
											>
												P1
											</div>
										),
									},
									{ name: 'RP1', role: 'Relying Party 1', icon: <FiMonitor /> },
									{ name: 'RP2', role: 'Relying Party 2', icon: <FiMonitor /> },
								])}

								<DemoButton
									onClick={() =>
										setActiveDemo(
											activeDemo === 'back-channel-logout' ? null : 'back-channel-logout'
										)
									}
								>
									<FiPlay />
									{activeDemo === 'back-channel-logout' ? 'Hide' : 'Show'} Implementation
								</DemoButton>

								{activeDemo === 'back-channel-logout' && (
									<div>
										<h4>Step-by-Step Process:</h4>
										<FlowStep>
											<StepNumber>1</StepNumber>
											<StepContent>
												<StepTitle>User Logs Out at OP</StepTitle>
												<StepDescription>
													User initiates logout at the OpenID Provider
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>2</StepNumber>
											<StepContent>
												<StepTitle>OP Generates Logout Tokens</StepTitle>
												<StepDescription>
													OP creates logout tokens for all registered RPs with active sessions
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>3</StepNumber>
											<StepContent>
												<StepTitle>OP Sends Logout Requests</StepTitle>
												<StepDescription>
													OP sends POST requests with logout tokens to each RP's backchannel_logout
													endpoint
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>4</StepNumber>
											<StepContent>
												<StepTitle>RPs Process Logout</StepTitle>
												<StepDescription>
													Each RP validates the logout token and terminates the user session
												</StepDescription>
											</StepContent>
										</FlowStep>

										{renderCodeExample(
											'Back-Channel Logout Implementation',
											`// OP sends logout request to RP
async function sendBackchannelLogout(rpEndpoint, logoutToken) {
  try {
    const response = await fetch(rpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logout_token: logoutToken
      })
    });
    
    if (response.ok) {
      console.log('Back-channel logout successful');
    } else {
      console.error('Back-channel logout failed:', response.status);
    }
  } catch (error) {
    console.error('Back-channel logout error:', error);
  }
}

// RP backchannel_logout endpoint
app.post('/backchannel_logout', async (req, res) => {
  try {
    const { logout_token } = req.body;
    
    // Validate logout token
    const decoded = jwt.verify(logout_token, opPublicKey, {
      issuer: 'https://op.example.com',
      algorithms: ['RS256']
    });
    
    // Check token claims
    if (decoded.aud !== clientId) {
      return res.status(400).send('Invalid audience');
    }
    
    if (decoded.iat < Math.floor(Date.now() / 1000) - 300) {
      return res.status(400).send('Token too old');
    }
    
    // Terminate user session
    await terminateUserSession(decoded.sid);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Back-channel logout error:', error);
    res.status(400).send('Invalid logout token');
  }
});`,
											'back-channel-logout'
										)}
									</div>
								)}

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
										<p>
											PingOne supports back-channel logout for reliable server-to-server logout
											communication.
										</p>
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
									RPs can validate session state by comparing the session_state parameter with the
									current session state calculated using the Client ID, origin URL, and OP User
									Agent state.
								</FlowDescription>

								{renderFlowDiagram([
									{ name: 'RP', role: 'Relying Party', icon: <FiMonitor /> },
									{ name: 'Session State', role: 'Validation', icon: <FiCheck /> },
									{
										name: 'OP',
										role: 'OpenID Provider',
										icon: (
											<div
												style={{
													background: 'linear-gradient(135deg, #f59e0b, #d97706)',
													color: 'white',
													borderRadius: '4px',
													padding: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: 'bold',
												}}
											>
												P1
											</div>
										),
									},
								])}

								<DemoButton
									onClick={() =>
										setActiveDemo(activeDemo === 'session-validation' ? null : 'session-validation')
									}
								>
									<FiPlay />
									{activeDemo === 'session-validation' ? 'Hide' : 'Show'} Implementation
								</DemoButton>

								{activeDemo === 'session-validation' && (
									<div>
										<h4>Step-by-Step Process:</h4>
										<FlowStep>
											<StepNumber>1</StepNumber>
											<StepContent>
												<StepTitle>RP Receives Session State</StepTitle>
												<StepDescription>
													RP receives session_state parameter from OP during authentication
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>2</StepNumber>
											<StepContent>
												<StepTitle>Calculate Expected State</StepTitle>
												<StepDescription>
													RP calculates expected session state using Client ID, origin URL, and OP
													User Agent state
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>3</StepNumber>
											<StepContent>
												<StepTitle>Compare Session States</StepTitle>
												<StepDescription>
													RP compares received session_state with calculated expected state
												</StepDescription>
											</StepContent>
										</FlowStep>

										<FlowStep>
											<StepNumber>4</StepNumber>
											<StepContent>
												<StepTitle>Handle State Mismatch</StepTitle>
												<StepDescription>
													If states don't match, RP may need to check session status with OP or
													redirect to login
												</StepDescription>
											</StepContent>
										</FlowStep>

										{renderCodeExample(
											'Session State Validation Implementation',
											`// Session state validation
function calculateSessionState(clientId, origin, opSessionState, salt) {
  const crypto = require('crypto');
  
  // Combine parameters as specified in OpenID Connect Session Management
  const input = clientId + origin + opSessionState + salt;
  
  // Calculate SHA256 hash and encode as base64url
  const hash = crypto.createHash('sha256').update(input).digest();
  return base64url(hash);
}

function validateSessionState(receivedState, clientId, origin, opSessionState, salt) {
  const expectedState = calculateSessionState(clientId, origin, opSessionState, salt);
  
  if (receivedState === expectedState) {
    console.log('Session state is valid');
    return true;
  } else {
    console.log('Session state mismatch - user may have logged out');
    return false;
  }
}

// Usage in session check
function checkSessionStatus() {
  const receivedState = localStorage.getItem('session_state');
  const clientId = 'your-client-id';
  const origin = window.location.origin;
  const opSessionState = sessionStorage.getItem('op_session_state');
  const salt = 'your-salt-value'; // From OP configuration
  
  if (!validateSessionState(receivedState, clientId, origin, opSessionState, salt)) {
    // Session may have changed, redirect to login
    window.location.href = '/login';
  }
}

// Helper function for base64url encoding
function base64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/+/g, '-')
    .replace(///g, '_')
    .replace(/=/g, '');
}`,
											'session-validation'
										)}
									</div>
								)}

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
										<p>
											Session state validation prevents session fixation attacks and ensures session
											integrity.
										</p>
									</div>
								</SecurityNote>
							</CardBody>
						</FlowCard>
					</FlowGrid>
				</div>
			</CollapsibleSection>

			<CollapsibleSection title=" Implementation Considerations" defaultOpen={false}>
				<div style={{ marginTop: '1rem' }}>
					<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
						Understanding the technical details and best practices for implementing OIDC session
						management in your applications.
					</p>

					<ImplementationCard>
						<CardHeader>
							<h3> Session State Calculation</h3>
						</CardHeader>
						<CardBody>
							<p>
								The Session State value is calculated on the server and recalculated by the OP
								iframe in the User Agent. It's based on a salted cryptographic hash of:
							</p>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>
										Client ID
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										The OAuth client identifier
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>
										Origin URL
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										The origin URL of the Authentication Response
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>
										OP User Agent State
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										The OpenID Provider's User Agent state
									</p>
								</div>
							</div>

							{renderCodeExample(
								'Session State Calculation Algorithm',
								`// Session State calculation formula
function calculateSessionState(clientId, origin, opUserAgentState, salt) {
  const input = clientId + origin + opUserAgentState + salt;
  const hash = sha256(input);
  return base64url(hash);
}

// Example implementation
const clientId = 'your-client-id';
const origin = 'https://your-app.com';
const opUserAgentState = 'op-session-state-from-pingone';
const salt = 'your-salt-value';

const sessionState = calculateSessionState(clientId, origin, opUserAgentState, salt);
console.log('Calculated session state:', sessionState);`,
								'session-state-calculation'
							)}
						</CardBody>
					</ImplementationCard>

					<WarningCard>
						<CardHeader>
							<h3> Iframe Communication Limitations</h3>
						</CardHeader>
						<CardBody>
							<p>
								Session monitoring relies on iframe communication between the OP and RP. This
								approach has some limitations:
							</p>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
										Third-party Content Blocking
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Modern browsers may block iframe access
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
										Cross-origin Restrictions
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Same-origin policy limitations
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>User Privacy</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Users may disable third-party cookies
									</p>
								</div>
							</div>
						</CardBody>
					</WarningCard>

					<ImplementationCard>
						<CardHeader>
							<h3> Alternative Approaches</h3>
						</CardHeader>
						<CardBody>
							<p>
								When iframe-based session monitoring isn't suitable, consider these alternatives:
							</p>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiRefreshCw
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Polling</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Periodically check session status via API calls
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiMonitor
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>WebSockets</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Real-time session status updates
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiUsers
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Server-Sent Events</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Push-based session notifications
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiCheck
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Token Refresh</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Use token expiration for session management
									</p>
								</div>
							</div>

							{renderCodeExample(
								'Polling-based Session Monitoring',
								`// Alternative: Polling-based session monitoring
class SessionMonitor {
  constructor(apiEndpoint, interval = 30000) {
    this.apiEndpoint = apiEndpoint;
    this.interval = interval;
    this.pollingInterval = null;
  }

  startPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(\`\${this.apiEndpoint}/session-status\`, {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          // Session expired, redirect to login
          this.handleSessionExpired();
        }
      } catch (error) {
        console.error('Session monitoring error:', error);
      }
    }, this.interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  handleSessionExpired() {
    this.stopPolling();
    // Redirect to login or show login modal
    window.location.href = '/login';
  }
}

// Usage
const sessionMonitor = new SessionMonitor('https://api.yourapp.com');
sessionMonitor.startPolling();`,
								'polling-session-monitoring'
							)}
						</CardBody>
					</ImplementationCard>
				</div>
			</CollapsibleSection>

			<CollapsibleSection title=" PingOne Session Management Features" defaultOpen={true}>
				<div style={{ marginTop: '1rem' }}>
					<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
						PingOne provides comprehensive session management capabilities aligned with OpenID
						Connect standards.
					</p>

					<ImplementationCard>
						<CardHeader>
							<h3> Supported Logout Flows</h3>
						</CardHeader>
						<CardBody>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiLogOut
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>RP-Initiated Logout</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Applications can initiate user logout
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiRefreshCw
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Front-Channel Logout</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Immediate logout across multiple applications
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiShield
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Back-Channel Logout</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Reliable server-to-server logout communication
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiMonitor
										style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Session Monitoring</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Real-time session status tracking
									</p>
								</div>
							</div>
						</CardBody>
					</ImplementationCard>

					<ImplementationCard>
						<CardHeader>
							<h3> Configuration Options</h3>
						</CardHeader>
						<CardBody>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiArrowRight
										style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
										Post-Logout Redirect URIs
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Configure where users go after logout
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiMonitor
										style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Session Timeout</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Configurable session duration
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiRefreshCw
										style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Idle Timeout</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Automatic logout after inactivity
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #e2e8f0',
									}}
								>
									<FiUsers
										style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
										Multi-Session Support
									</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Manage multiple concurrent sessions
									</p>
								</div>
							</div>

							<PingOneNote>
								<FiInfo />
								<div>
									<h4>Best Practice</h4>
									<p>
										Implement both front-channel and back-channel logout for comprehensive session
										management coverage.
									</p>
								</div>
							</PingOneNote>
						</CardBody>
					</ImplementationCard>
				</div>
			</CollapsibleSection>

			<CollapsibleSection title=" Security Best Practices" defaultOpen={false}>
				<div style={{ marginTop: '1rem' }}>
					<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
						Essential security considerations and best practices for implementing OIDC session
						management securely.
					</p>

					<WarningCard>
						<CardHeader>
							<h3> Session Security</h3>
						</CardHeader>
						<CardBody>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Secure Session State</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Use cryptographically strong session state values
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>HTTPS Only</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Always use HTTPS for session management endpoints
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiCheck
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Token Validation</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Validate all tokens and session state parameters
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiUsers
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Logout Confirmation</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Confirm logout actions to prevent accidental logouts
									</p>
								</div>
							</div>
						</CardBody>
					</WarningCard>

					<WarningCard>
						<CardHeader>
							<h3> Implementation Security</h3>
						</CardHeader>
						<CardBody>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
									margin: '1.5rem 0',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>CSRF Protection</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Implement CSRF tokens for logout requests
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiShield
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Origin Validation</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Validate origin headers for security
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiMonitor
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Session Timeout</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Implement reasonable session timeouts
									</p>
								</div>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '0.5rem',
										border: '2px solid #fbbf24',
									}}
								>
									<FiUsers
										style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}
									/>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Audit Logging</h4>
									<p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
										Log all session management events
									</p>
								</div>
							</div>

							<SecurityNote>
								<FiShield />
								<div>
									<h4>Security Warning</h4>
									<p>
										Always validate session state and implement proper CSRF protection for logout
										endpoints.
									</p>
								</div>
							</SecurityNote>
						</CardBody>
					</WarningCard>
				</div>
			</CollapsibleSection>
		</Container>
	);
};

export default OIDCSessionManagement;
