import {
	FiArrowRight,
	FiCheck,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiLogOut,
	FiMonitor,
	FiPlay,
	FiRefreshCw,
	FiShield,
	FiUsers,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import CollapsibleSection from '../components/CollapsibleSection';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';

// White background container with better spacing
const WhiteContainer = styled.div`
  background-color: white;
  min-height: 100vh;
  color: #1f2937; // Dark text for readability
  line-height: 1.6;
  padding-top: 100px; // Account for fixed Navbar (80px height + 20px margin)
  padding-bottom: 4rem; // Extra bottom padding to prevent content cutoff
  overflow-x: hidden; // Prevent horizontal scroll
  
  h1, h2, h3, h4, h5, h6 {
    color: #111827; // Darker headers
  }
  
  p {
    color: #374151; // Medium dark text
  }
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
  margin-bottom: 2rem;
  
  /* Ensure CardBody has enough bottom padding */
  div[class*="CardBody"] {
    padding-bottom: 2rem !important;
  }
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
  margin: 1rem 0 2rem 0;
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
  margin: 1rem 0 2rem 0;
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
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  position: relative;
  overflow-x: auto;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #3b82f6;
`;

const CodeTitle = styled.span`
  color: white;
  background: #3b82f6;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
`;

const CopyButton = styled.button`
  background: #3b82f6;
  color: white;
  border: 2px solid #3b82f6;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const CodeContent = styled.pre`
  color: #1e293b;
  background: white;
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
  margin: 1rem 0 2rem 0;
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
	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for session management content (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'oidc-session-management', // Enables FlowHeader integration
		padding: '100px 0 6rem', // Top padding accounts for fixed Navbar (80px) + spacing
	};

	const { PageContainer, ContentWrapper, PageHeader } =
		PageLayoutService.createPageLayout(pageConfig);

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

	const renderCodeExample = (title: string, code: string, id: string, _language = 'javascript') => (
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
		<WhiteContainer>
			<PageContainer>
				{PageHeader ? (
					<PageHeader>
						<h1>OpenID Connect Session Management</h1>
						<p>
							Comprehensive guide to monitoring and maintaining user sessions across applications.
						</p>
					</PageHeader>
				) : (
					<header
						style={{
							padding: '2rem',
							background: '#1d4ed8',
							color: 'white',
							borderRadius: '1rem 1rem 0 0',
						}}
					>
						<h1>OpenID Connect Session Management</h1>
						<p>
							Comprehensive guide to monitoring and maintaining user sessions across applications.
						</p>
					</header>
				)}
				<ContentWrapper>
					<CollapsibleHeader
						title="What is OpenID Connect Session Management?"
						subtitle="OpenID Connect Session Management 1.0 is a specification that defines how to manage sessions for OpenID Connect, including when to log out the End-User."
						icon={<FiUsers />}
						defaultCollapsed={false}
					>
						<div style={{ padding: '1.5rem' }}>
							<OverviewCard>
								<CardHeader>
									<h2>What is OpenID Connect Session Management?</h2>
								</CardHeader>
								<CardBody>
									<p>
										OpenID Connect Session Management complements the OpenID Connect Core 1.0
										specification by defining how to monitor the End-User's login status at the{' '}
										<strong>OpenID Provider (OP)</strong> on an ongoing basis. This allows{' '}
										<strong>Relying Parties (RP)</strong> to log out End-Users who have logged out
										of the OpenID Provider.
									</p>

									<div
										style={{
											background: '#eff6ff',
											border: '2px solid #3b82f6',
											borderRadius: '0.75rem',
											padding: '1.5rem',
											margin: '1.5rem 0',
										}}
									>
										<h3
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												fontSize: '1.1rem',
												fontWeight: 600,
											}}
										>
											Understanding Key Terms
										</h3>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
												gap: '1rem',
											}}
										>
											<div
												style={{
													background: 'white',
													padding: '1rem',
													borderRadius: '0.5rem',
													border: '1px solid #dbeafe',
												}}
											>
												<h4
													style={{
														margin: '0 0 0.5rem 0',
														color: '#1e40af',
														fontSize: '1rem',
														fontWeight: 600,
													}}
												>
													OpenID Provider (OP)
												</h4>
												<p
													style={{
														margin: '0 0 0.5rem 0',
														color: '#374151',
														fontSize: '0.9rem',
														lineHeight: '1.6',
													}}
												>
													The <strong>authorization server</strong> that authenticates users and
													issues ID Tokens and access tokens. The OP handles user authentication,
													manages user sessions, and provides identity information to applications.
												</p>
												<p
													style={{
														margin: 0,
														color: '#64748b',
														fontSize: '0.85rem',
														fontStyle: 'italic',
													}}
												>
													<strong>Examples:</strong> PingOne, Auth0, Okta, Azure AD, Google
													Identity, Keycloak
												</p>
												<p
													style={{
														margin: '0.5rem 0 0 0',
														color: '#1e40af',
														fontSize: '0.85rem',
														fontWeight: 500,
													}}
												>
													<strong>Why it matters:</strong> The OP is the central authority that
													knows when users log in or out, making it essential for session management
													across multiple applications.
												</p>
											</div>
											<div
												style={{
													background: 'white',
													padding: '1rem',
													borderRadius: '0.5rem',
													border: '1px solid #dbeafe',
												}}
											>
												<h4
													style={{
														margin: '0 0 0.5rem 0',
														color: '#1e40af',
														fontSize: '1rem',
														fontWeight: 600,
													}}
												>
													Relying Party (RP)
												</h4>
												<p
													style={{
														margin: '0 0 0.5rem 0',
														color: '#374151',
														fontSize: '0.9rem',
														lineHeight: '1.6',
													}}
												>
													The <strong>client application</strong> that requests and verifies ID
													Tokens from the OpenID Provider. The RP relies on the OP to authenticate
													users and provide identity information. Also known as the OAuth client.
												</p>
												<p
													style={{
														margin: 0,
														color: '#64748b',
														fontSize: '0.85rem',
														fontStyle: 'italic',
													}}
												>
													<strong>Examples:</strong> Web applications, mobile apps, Single Page Apps
													(SPAs), API services, desktop applications
												</p>
												<p
													style={{
														margin: '0.5rem 0 0 0',
														color: '#1e40af',
														fontSize: '0.85rem',
														fontWeight: 500,
													}}
												>
													<strong>Why it matters:</strong> RPs need to know when users log out at
													the OP so they can log them out locally, preventing unauthorized access to
													their applications.
												</p>
											</div>
										</div>
									</div>

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
												<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
													Enhanced Security
												</h4>
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
												<FiUsers
													style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.5rem' }}
												/>
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
												<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
													Centralized Control
												</h4>
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
										<strong style={{ color: '#1e293b' }}>Related Specifications:</strong>
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
												transition: 'all 0.2s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#dbeafe';
												e.currentTarget.style.transform = 'translateY(-1px)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#eff6ff';
												e.currentTarget.style.transform = 'translateY(0)';
											}}
										>
											<FiExternalLink />
											OpenID Connect Session Management 1.0
										</a>
										<a
											href="https://openid.net/specs/openid-connect-frontchannel-1_0.html"
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
												transition: 'all 0.2s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#dbeafe';
												e.currentTarget.style.transform = 'translateY(-1px)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#eff6ff';
												e.currentTarget.style.transform = 'translateY(0)';
											}}
										>
											<FiExternalLink />
											Front-Channel Logout 1.0
										</a>
										<a
											href="https://openid.net/specs/openid-connect-backchannel-1_0.html"
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
												transition: 'all 0.2s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#dbeafe';
												e.currentTarget.style.transform = 'translateY(-1px)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#eff6ff';
												e.currentTarget.style.transform = 'translateY(0)';
											}}
										>
											<FiExternalLink />
											Back-Channel Logout 1.0
										</a>
										<a
											href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#session-management"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: '#f59e0b',
												textDecoration: 'none',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												padding: '0.5rem 1rem',
												background: '#fffbeb',
												borderRadius: '0.5rem',
												border: '1px solid #fde68a',
												transition: 'all 0.2s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#fef3c7';
												e.currentTarget.style.transform = 'translateY(-1px)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#fffbeb';
												e.currentTarget.style.transform = 'translateY(0)';
											}}
										>
											<FiExternalLink />
											PingOne API Documentation
										</a>
									</div>
								</CardBody>
							</OverviewCard>
						</div>
					</CollapsibleHeader>

					<CollapsibleSection title=" Session Management Flows" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
								Explore the different session management flows available in OpenID Connect. Each
								flow serves a specific purpose for monitoring and managing user sessions across
								applications.
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
											In OpenID Connect, the session at the RP typically starts when the RP
											validates the End-User's ID Token. The OP returns a session_state parameter
											for session management.
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
											The <strong>Relying Party (RP)</strong> can monitor session status changes
											using iframes. The <strong>OpenID Provider (OP)</strong> iframe communicates
											logout requests to the RP iframe, enabling real-time session monitoring.
										</FlowDescription>

										<div
											style={{
												background: '#f0f9ff',
												border: '2px solid #3b82f6',
												borderRadius: '0.75rem',
												padding: '1.5rem',
												margin: '1.5rem 0',
											}}
										>
											<h4
												style={{
													margin: '0 0 1rem 0',
													color: '#1e40af',
													fontSize: '1rem',
													fontWeight: 600,
												}}
											>
												Why This Matters
											</h4>
											<p
												style={{
													margin: '0 0 1rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.7',
												}}
											>
												<strong>Real-time session monitoring</strong> is critical for maintaining
												security across multiple applications. When a user logs out at the{' '}
												<strong>OpenID Provider (OP)</strong>, all{' '}
												<strong>Relying Parties (RPs)</strong> that rely on that authentication need
												to be notified immediately. Without this mechanism, a user could log out of
												their identity provider but remain logged into individual applications,
												creating security vulnerabilities.
											</p>
											<p
												style={{
													margin: '0 0 1rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.7',
												}}
											>
												<strong>How iframes work:</strong> An iframe (inline frame) is an HTML
												element that embeds another HTML page within the current page. In session
												management, the RP creates a hidden iframe that loads a page from the OP.
												This iframe can communicate with the parent page using the{' '}
												<code>postMessage</code> API, allowing cross-origin communication in a
												secure way.
											</p>
											<p
												style={{
													margin: 0,
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.7',
												}}
											>
												<strong>Why it's important:</strong> This enables{' '}
												<strong>single sign-out (SSO logout)</strong> functionality, where logging
												out of one application (or the identity provider) automatically logs the
												user out of all other applications. This is essential for enterprise
												security, compliance, and user experience - ensuring users aren't left
												logged into applications after they've explicitly logged out.
											</p>
										</div>

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
															RP creates hidden iframes for session monitoring and OP creates iframe
															for status changes
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
													User agents may block access to third-party content, affecting
													iframe-based session monitoring.
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
											Relying Parties can initiate logout by redirecting the End-User to the OP's
											end session endpoint. This allows RPs to log out users from all sessions
											across multiple applications.
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
													PingOne supports RP-initiated logout with configurable post-logout
													redirect URIs.
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
											Front-channel logout uses the User Agent to communicate logout requests from
											the OP to RPs. This enables immediate logout across multiple applications
											without polling.
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
													PingOne supports front-channel logout for immediate session termination
													across applications.
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
											Back-channel logout uses direct communication between the OP and RPs being
											logged out. This is more reliable than front-channel logout but requires
											server-to-server communication.
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
															OP sends POST requests with logout tokens to each RP's
															backchannel_logout endpoint
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
											RPs can validate session state by comparing the session_state parameter with
											the current session state calculated using the Client ID, origin URL, and OP
											User Agent state.
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
												setActiveDemo(
													activeDemo === 'session-validation' ? null : 'session-validation'
												)
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
															RP calculates expected session state using Client ID, origin URL, and
															OP User Agent state
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
													Session state validation prevents session fixation attacks and ensures
													session integrity.
												</p>
											</div>
										</SecurityNote>
									</CardBody>
								</FlowCard>
							</FlowGrid>
						</div>
					</CollapsibleSection>

					<CollapsibleSection title=" Implementation Considerations" defaultCollapsed>
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
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Client ID
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it is:</strong> The OAuth client identifier is a unique string
												assigned to each <strong>Relying Party (RP)</strong>
												application registered with the <strong>OpenID Provider (OP)</strong>. This
												identifier distinguishes one application from another.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> The Client ID ensures that session
												state calculations are unique to each RP. This prevents session state
												collisions between different applications and ensures that each RP can
												validate its own session state independently. Without the Client ID,
												different RPs might calculate the same session state, leading to security
												vulnerabilities.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Example:</strong> "my-web-app-client-123" or "abc123def456"
												(typically an alphanumeric string)
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Origin URL
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it is:</strong> The origin URL is the protocol, domain, and
												port of the Authentication Response callback URL (e.g.,
												"https://rp.example.com" from "https://rp.example.com/callback"). It
												represents the origin where the RP receives the authentication response.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> The origin URL ensures that session
												state is bound to a specific RP application origin. This prevents session
												state reuse across different origins (e.g., preventing a session state from
												"https://evil-site.com" from being used at "https://rp.example.com"). This
												is a critical security measure that prevents cross-site session hijacking
												attacks.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Example:</strong> "https://myapp.example.com" (protocol + domain, no
												path or query parameters)
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												OP User Agent State
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it is:</strong> The OP User Agent State is a session identifier
												maintained by the <strong>OpenID Provider (OP)</strong>
												that represents the user's current login session at the OP. This state
												changes when the user logs in or out at the OP.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> This is the core component that enables
												session monitoring. When a user logs out at the OP, the OP User Agent State
												changes. By including this in the session state calculation, the{' '}
												<strong>Relying Party (RP)</strong> can detect when the user's session at
												the OP has changed. If the OP User Agent State in a new authentication
												response doesn't match the stored value, the RP knows the user has logged
												out or logged in with a different account at the OP.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Example:</strong> A base64-encoded string like "a1b2c3d4e5f6..."
												that changes when the user's OP session changes
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
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Third-party Content Blocking
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Modern browsers (Chrome, Firefox, Safari,
												Edge) implement aggressive third-party content blocking to protect user
												privacy and prevent tracking. This means iframes from different domains
												(like an OP iframe embedded in an RP page) may be blocked or have restricted
												access.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> When iframes are blocked, the session
												monitoring mechanism fails silently. The RP won't receive logout
												notifications from the OP, leaving users logged into applications even after
												they've logged out at the identity provider. This creates security gaps and
												compliance issues.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Impact:</strong> Session management may fail, requiring alternative
												approaches like polling or back-channel logout.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Cross-origin Restrictions
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> The browser's Same-Origin Policy restricts
												JavaScript access between pages from different origins (protocol, domain,
												and port must match). An RP page (e.g., https://rp.example.com) cannot
												directly access content from an OP iframe (e.g., https://op.example.com).
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> While the <code>postMessage</code> API
												allows cross-origin communication, it requires careful implementation with
												origin validation. Without proper security measures, malicious sites could
												attempt to intercept or spoof logout messages. Additionally, some browsers
												restrict certain APIs within cross-origin iframes.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Impact:</strong> Developers must implement proper origin validation
												and may need fallback mechanisms when iframe communication fails.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												User Privacy
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Users increasingly disable third-party
												cookies and tracking mechanisms to protect their privacy. Modern browsers
												(Safari, Firefox, Chrome) block third-party cookies by default or allow
												users to opt-out.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Session monitoring often relies on
												cookies to maintain state between the OP and RP iframes. When third-party
												cookies are blocked, the iframe cannot establish or maintain a session with
												the OP, breaking the session monitoring mechanism. This is a privacy vs.
												security trade-off - users want privacy, but security requires session
												awareness.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Impact:</strong> Session management may be unreliable, requiring
												alternative authentication flows or user education about cookie
												requirements.
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
										When iframe-based session monitoring isn't suitable, consider these
										alternatives:
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
											<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
												Server-Sent Events
											</h4>
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

					<CollapsibleSection title=" PingOne Session Management Features" defaultCollapsed={false}>
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
									<p
										style={{
											marginBottom: '1.5rem',
											color: '#374151',
											fontSize: '0.95rem',
											lineHeight: '1.7',
										}}
									>
										PingOne supports all standard OpenID Connect logout flows, enabling flexible
										session termination across single and multi-application environments. Each flow
										serves specific use cases and provides different levels of reliability and
										immediacy.
									</p>

									{/* RP-Initiated Logout */}
									<div
										style={{
											padding: '1.5rem',
											background: 'white',
											borderRadius: '0.75rem',
											border: '2px solid #3b82f6',
											marginBottom: '2rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<FiLogOut style={{ color: '#10b981', fontSize: '1.5rem' }} />
											<h4
												style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}
											>
												RP-Initiated Logout
											</h4>
											<PingOneBadge>Full Support</PingOneBadge>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>What it is:</strong> The <strong>Relying Party (RP)</strong>{' '}
											application initiates the logout process by redirecting the user to PingOne's
											end session endpoint (<code>/as/signoff</code>). This is the most common
											logout flow and is typically triggered when a user clicks a "Logout" button in
											the application.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>When to use:</strong> Use RP-initiated logout when you want to give
											users control over when they log out, when you need to redirect users to a
											specific page after logout (e.g., a "You've been logged out" confirmation
											page), or when implementing logout from a single application.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>How it works:</strong>
										</p>
										<ol
											style={{
												margin: '0 0 1rem 0',
												paddingLeft: '1.5rem',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<li style={{ marginBottom: '0.5rem' }}>
												User clicks logout in the RP application
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												RP redirects user to PingOne's <code>/as/signoff</code> endpoint with{' '}
												<code>id_token_hint</code> and optional{' '}
												<code>post_logout_redirect_uri</code>
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												PingOne terminates the user's session
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												User is redirected back to the RP's post-logout redirect URI (if configured)
											</li>
										</ol>
										{renderCodeExample(
											'PingOne RP-Initiated Logout Example',
											`// PingOne End Session Endpoint
// https://auth.pingone.com/{environmentId}/as/signoff

// 1. Build logout URL
const environmentId = 'your-environment-id';
const idToken = localStorage.getItem('id_token'); // Get from authentication response
const postLogoutUri = encodeURIComponent('https://your-app.com/logged-out');
const state = generateRandomString(); // For CSRF protection

const logoutUrl = \`https://auth.pingone.com/\${environmentId}/as/signoff?\` +
  \`id_token_hint=\${idToken}&\` +
  \`post_logout_redirect_uri=\${postLogoutUri}&\` +
  \`state=\${state}\`;

// 2. Redirect user to PingOne
window.location.href = logoutUrl;

// 3. Handle post-logout redirect (at /logged-out page)
const urlParams = new URLSearchParams(window.location.search);
const returnedState = urlParams.get('state');
const storedState = sessionStorage.getItem('logout_state');

if (returnedState === storedState) {
  // Logout successful, clear local session
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('logout_state');
  
  // Show confirmation message
  console.log('User logged out successfully');
} else {
  console.error('Logout state mismatch - possible CSRF attack');
}`,
											'pingone-rp-initiated-logout'
										)}
										<PingOneNote>
											<FiInfo />
											<div>
												<h4>PingOne Configuration</h4>
												<p>
													Post-logout redirect URIs must be registered in your PingOne application
													configuration. Navigate to your application settings → OIDC Settings →
													Post-Logout Redirect URIs to add allowed URIs.
													<a
														href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-logout-redirect-uris"
														target="_blank"
														rel="noopener noreferrer"
														style={{
															color: '#3b82f6',
															marginLeft: '0.5rem',
															textDecoration: 'underline',
														}}
													>
														View PingOne API Documentation
													</a>
												</p>
											</div>
										</PingOneNote>
									</div>

									{/* Front-Channel Logout */}
									<div
										style={{
											padding: '1.5rem',
											background: 'white',
											borderRadius: '0.75rem',
											border: '2px solid #3b82f6',
											marginBottom: '2rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<FiRefreshCw style={{ color: '#10b981', fontSize: '1.5rem' }} />
											<h4
												style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}
											>
												Front-Channel Logout
											</h4>
											<PingOneBadge>Enterprise Feature</PingOneBadge>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>What it is:</strong> Front-channel logout uses the browser (User
											Agent) to communicate logout requests from PingOne to multiple{' '}
											<strong>Relying Parties (RPs)</strong> simultaneously. When a user logs out at
											PingOne, the OP generates logout URLs for all registered RPs and loads them in
											hidden iframes, triggering immediate logout across all applications.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>When to use:</strong> Use front-channel logout when you need immediate
											logout across multiple applications without waiting for polling or
											server-to-server communication. This is ideal for Single Sign-Out (SSO)
											scenarios where users access multiple applications through the same identity
											provider.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>How it works:</strong>
										</p>
										<ol
											style={{
												margin: '0 0 1rem 0',
												paddingLeft: '1.5rem',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<li style={{ marginBottom: '0.5rem' }}>
												User logs out at PingOne (or at any RP that triggers OP logout)
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												PingOne generates logout URLs for all registered RPs with active sessions
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												PingOne creates hidden iframes for each RP logout URL
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												Each RP receives the logout request and terminates the user's session
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												User is redirected to post-logout page
											</li>
										</ol>
										{renderCodeExample(
											'Front-Channel Logout Implementation',
											`// RP must implement a logout endpoint that accepts front-channel logout requests
// Example: GET /logout?iss=https://auth.pingone.com/{envId}&sid={sessionId}&iat={issuedAt}

app.get('/logout', (req, res) => {
  const { iss, sid, iat } = req.query;
  
  // Validate issuer matches PingOne
  const expectedIssuer = \`https://auth.pingone.com/\${process.env.PINGONE_ENVIRONMENT_ID}\`;
  if (iss !== expectedIssuer) {
    return res.status(400).send('Invalid issuer');
  }
  
  // Validate iat (issued at) is recent (within 5 minutes)
  const issuedAt = parseInt(iat, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > 300) {
    return res.status(400).send('Logout request too old');
  }
  
  // Terminate user session using session ID (sid)
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Logout failed');
    }
    
    // Return HTML page that closes the iframe
    res.send(\`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Logged Out</title>
      </head>
      <body>
        <script>
          // Close the iframe if possible
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'logout', success: true }, '*');
          }
          // Try to close the window
          setTimeout(() => window.close(), 100);
        </script>
        <p>You have been logged out.</p>
      </body>
      </html>
    \`);
  });
});`,
											'front-channel-logout-implementation'
										)}
										<SecurityNote>
											<FiShield />
											<div>
												<h4>Security Considerations</h4>
												<p>
													Front-channel logout relies on iframes, which may be blocked by browser
													privacy settings or extensions. Always validate the <code>iss</code>{' '}
													(issuer) and <code>iat</code> (issued at) parameters to prevent malicious
													logout requests. Consider implementing back-channel logout as a fallback
													for critical applications.
												</p>
											</div>
										</SecurityNote>
										<PingOneNote>
											<FiInfo />
											<div>
												<h4>PingOne Configuration</h4>
												<p>
													Front-channel logout requires Enterprise features. Configure logout URIs
													in your PingOne application settings. The logout URI must accept GET
													requests with <code>iss</code>, <code>sid</code>, and <code>iat</code>
													query parameters.
													<a
														href="https://openid.net/specs/openid-connect-frontchannel-1_0.html"
														target="_blank"
														rel="noopener noreferrer"
														style={{
															color: '#3b82f6',
															marginLeft: '0.5rem',
															textDecoration: 'underline',
														}}
													>
														View OpenID Connect Front-Channel Logout Spec
													</a>
												</p>
											</div>
										</PingOneNote>
									</div>

									{/* Back-Channel Logout */}
									<div
										style={{
											padding: '1.5rem',
											background: 'white',
											borderRadius: '0.75rem',
											border: '2px solid #3b82f6',
											marginBottom: '2rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<FiShield style={{ color: '#10b981', fontSize: '1.5rem' }} />
											<h4
												style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}
											>
												Back-Channel Logout
											</h4>
											<PingOneBadge>Enterprise Feature</PingOneBadge>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>What it is:</strong> Back-channel logout uses direct server-to-server
											communication between PingOne and
											<strong>Relying Parties (RPs)</strong>. PingOne sends HTTP POST requests with
											signed logout tokens (JWTs) to each RP's backchannel logout endpoint. This is
											more reliable than front-channel logout because it doesn't depend on browser
											behavior or iframe restrictions.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>When to use:</strong> Use back-channel logout for critical
											applications where logout reliability is essential, when iframe-based logout
											is blocked by browser policies, or when you need guaranteed logout delivery
											without relying on browser behavior.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>How it works:</strong>
										</p>
										<ol
											style={{
												margin: '0 0 1rem 0',
												paddingLeft: '1.5rem',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<li style={{ marginBottom: '0.5rem' }}>User logs out at PingOne</li>
											<li style={{ marginBottom: '0.5rem' }}>
												PingOne generates signed logout tokens (JWTs) for each RP with active
												sessions
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												PingOne sends POST requests to each RP's <code>backchannel_logout_uri</code>{' '}
												endpoint
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												Each RP validates the logout token signature and claims
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												RPs terminate user sessions and return HTTP 200 OK
											</li>
										</ol>
										{renderCodeExample(
											'Back-Channel Logout Implementation',
											`// RP must implement a backchannel logout endpoint
// Example: POST /backchannel_logout with logout_token in request body

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Initialize JWKS client for PingOne
const client = jwksClient({
  jwksUri: \`https://auth.pingone.com/\${process.env.PINGONE_ENVIRONMENT_ID}/as/jwks\`,
  cache: true,
  cacheMaxAge: 86400000 // 24 hours
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

app.post('/backchannel_logout', async (req, res) => {
  try {
    const { logout_token } = req.body;
    
    if (!logout_token) {
      return res.status(400).json({ error: 'Missing logout_token' });
    }
    
    // Verify and decode the logout token
    const decoded = jwt.verify(logout_token, getKey, {
      algorithms: ['RS256'],
      issuer: \`https://auth.pingone.com/\${process.env.PINGONE_ENVIRONMENT_ID}\`,
      audience: process.env.PINGONE_CLIENT_ID,
    }, (err, decoded) => {
      if (err) {
        console.error('Logout token verification failed:', err);
        return res.status(400).json({ error: 'Invalid logout token' });
      }
      
      // Validate required claims
      if (!decoded.sid) {
        return res.status(400).json({ error: 'Missing sid claim' });
      }
      
      // Check token is recent (issued within last 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.iat && (now - decoded.iat > 300)) {
        return res.status(400).json({ error: 'Token too old' });
      }
      
      // Terminate user session using session ID (sid)
      await terminateSessionBySid(decoded.sid);
      
      // Return 200 OK immediately (don't wait for session termination)
      res.status(200).send('OK');
    });
  } catch (error) {
    console.error('Back-channel logout error:', error);
    // Still return 200 OK to prevent PingOne from retrying
    res.status(200).send('OK');
  }
});

async function terminateSessionBySid(sessionId) {
  // Implement your session termination logic here
  // This might involve:
  // - Looking up the session by session ID
  // - Invalidating the session in your session store
  // - Clearing any cached user data
  // - Logging the logout event
  console.log(\`Terminating session: \${sessionId}\`);
}`,
											'back-channel-logout-implementation'
										)}
										<PingOneNote>
											<FiInfo />
											<div>
												<h4>PingOne Configuration</h4>
												<p>
													Back-channel logout requires Enterprise features. Register your{' '}
													<code>backchannel_logout_uri</code> in PingOne application settings. The
													endpoint must accept POST requests with <code>logout_token</code> in the
													request body and return HTTP 200 OK.
													<a
														href="https://openid.net/specs/openid-connect-backchannel-1_0.html"
														target="_blank"
														rel="noopener noreferrer"
														style={{
															color: '#3b82f6',
															marginLeft: '0.5rem',
															textDecoration: 'underline',
														}}
													>
														View OpenID Connect Back-Channel Logout Spec
													</a>
												</p>
											</div>
										</PingOneNote>
									</div>

									{/* Session Monitoring */}
									<div
										style={{
											padding: '1.5rem',
											background: 'white',
											borderRadius: '0.75rem',
											border: '2px solid #3b82f6',
											marginBottom: '2rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<FiMonitor style={{ color: '#10b981', fontSize: '1.5rem' }} />
											<h4
												style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}
											>
												Session Monitoring
											</h4>
											<PingOneBadge>Standard</PingOneBadge>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>What it is:</strong> Session monitoring allows{' '}
											<strong>Relying Parties (RPs)</strong> to continuously check whether a user's
											session at PingOne is still active. This is typically implemented using hidden
											iframes that poll PingOne's session check endpoint or by comparing{' '}
											<code>session_state</code> values.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>When to use:</strong> Use session monitoring when you need to detect
											when users log out at the identity provider without explicit logout actions in
											your application. This is essential for maintaining security in
											multi-application environments where users might log out at the OP but remain
											logged into individual applications.
										</p>
										<p
											style={{
												margin: '0 0 1rem 0',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<strong>How it works:</strong>
										</p>
										<ol
											style={{
												margin: '0 0 1rem 0',
												paddingLeft: '1.5rem',
												color: '#374151',
												fontSize: '0.95rem',
												lineHeight: '1.7',
											}}
										>
											<li style={{ marginBottom: '0.5rem' }}>
												RP creates a hidden iframe pointing to PingOne's session check endpoint
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												RP periodically checks session state by comparing stored{' '}
												<code>session_state</code> with current state
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												If session state changes (user logged out), RP detects the mismatch
											</li>
											<li style={{ marginBottom: '0.5rem' }}>
												RP automatically logs out the user from the application
											</li>
										</ol>
										{renderCodeExample(
											'Session Monitoring Implementation',
											`// Session monitoring using iframe and postMessage
// PingOne session check endpoint: https://auth.pingone.com/{envId}/as/check_session

const environmentId = 'your-environment-id';
const clientId = 'your-client-id';
const origin = window.location.origin;
const sessionState = localStorage.getItem('session_state'); // From authentication response
const opSessionState = sessionStorage.getItem('op_session_state'); // From OP

// Create hidden iframe for session checking
const iframe = document.createElement('iframe');
iframe.id = 'pingone-session-check';
iframe.style.display = 'none';
iframe.src = \`https://auth.pingone.com/\${environmentId}/as/check_session?client_id=\${clientId}&session_state=\${sessionState}\`;
document.body.appendChild(iframe);

// Listen for session state change messages
window.addEventListener('message', (event) => {
  // Validate origin
  if (event.origin !== \`https://auth.pingone.com\`) {
    return;
  }
  
  // Handle session state change
  if (event.data.type === 'session_state_changed') {
    console.log('Session state changed - user logged out at PingOne');
    handleSessionExpired();
  }
});

function handleSessionExpired() {
  // Clear local session
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('session_state');
  
  // Redirect to login
  window.location.href = '/login';
}

// Alternative: Poll session state periodically
function checkSessionState() {
  const currentSessionState = calculateSessionState(clientId, origin, opSessionState, salt);
  const storedSessionState = localStorage.getItem('session_state');
  
  if (currentSessionState !== storedSessionState) {
    console.log('Session state mismatch - user may have logged out');
    handleSessionExpired();
  }
}

// Check every 30 seconds
setInterval(checkSessionState, 30000);`,
											'session-monitoring-implementation'
										)}
										<SecurityNote>
											<FiShield />
											<div>
												<h4>Browser Limitations</h4>
												<p>
													Session monitoring using iframes may be blocked by browser privacy
													settings (Safari ITP, Firefox ETP, Chrome Privacy Sandbox). Consider
													implementing alternative approaches like polling or server-side session
													validation for critical applications.
												</p>
											</div>
										</SecurityNote>
										<PingOneNote>
											<FiInfo />
											<div>
												<h4>PingOne Configuration</h4>
												<p>
													Session monitoring is available in all PingOne plans. The{' '}
													<code>session_state</code> parameter is automatically provided in
													authentication responses when session management is enabled. No additional
													configuration is required beyond enabling session management in your
													application settings.
													<a
														href="https://openid.net/specs/openid-connect-session-1_0.html"
														target="_blank"
														rel="noopener noreferrer"
														style={{
															color: '#3b82f6',
															marginLeft: '0.5rem',
															textDecoration: 'underline',
														}}
													>
														View OpenID Connect Session Management Spec
													</a>
												</p>
											</div>
										</PingOneNote>
									</div>

									<div
										style={{
											background: '#eff6ff',
											border: '2px solid #3b82f6',
											borderRadius: '0.75rem',
											padding: '1.5rem',
											marginTop: '2rem',
										}}
									>
										<h4
											style={{
												margin: '0 0 1rem 0',
												color: '#1e40af',
												fontSize: '1rem',
												fontWeight: 600,
											}}
										>
											Choosing the Right Logout Flow
										</h4>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
												gap: '1rem',
											}}
										>
											<div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem' }}>
												<strong style={{ color: '#1e293b' }}>RP-Initiated:</strong>
												<p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
													Best for single-application logout with user control
												</p>
											</div>
											<div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem' }}>
												<strong style={{ color: '#1e293b' }}>Front-Channel:</strong>
												<p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
													Best for immediate multi-application SSO logout
												</p>
											</div>
											<div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem' }}>
												<strong style={{ color: '#1e293b' }}>Back-Channel:</strong>
												<p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
													Best for reliable logout in critical applications
												</p>
											</div>
											<div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem' }}>
												<strong style={{ color: '#1e293b' }}>Session Monitoring:</strong>
												<p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
													Best for detecting logout events automatically
												</p>
											</div>
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
												Implement both front-channel and back-channel logout for comprehensive
												session management coverage.
											</p>
										</div>
									</PingOneNote>
								</CardBody>
							</ImplementationCard>
						</div>
					</CollapsibleSection>

					<CollapsibleSection title=" Security Best Practices" defaultCollapsed>
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
											gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
											gap: '1.5rem',
											margin: '1.5rem 0',
										}}
									>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Secure Session State
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Session state values must be generated using
												cryptographically secure random number generators and should be long enough
												(typically 128-256 bits) to prevent brute-force attacks. The session state
												calculation should use strong cryptographic hash functions (SHA-256 or
												stronger) and include a secret salt known only to the{' '}
												<strong>OpenID Provider (OP)</strong>.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Weak session state values can be
												predicted or guessed by attackers, allowing them to hijack user sessions or
												bypass session validation. Strong cryptographic session states ensure that
												each session is unique and cannot be forged, providing a foundation for
												secure session management.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Use SHA-256 or SHA-512 for hashing, include
												a secret salt in the calculation, and ensure the salt is stored securely and
												rotated periodically.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												HTTPS Only
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> All session management endpoints, including
												authentication, token exchange, logout, and session monitoring endpoints,
												must be accessed exclusively over HTTPS (TLS 1.2 or higher). HTTP should
												never be used for any session-related operations, even in development
												environments.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> HTTPS encrypts all data in transit,
												preventing attackers from intercepting session tokens, session states, or
												logout requests. Without HTTPS, attackers on the same network (e.g., public
												Wi-Fi) can perform man-in-the-middle attacks to steal sessions or force
												logouts. Session management data is highly sensitive and must be protected
												from eavesdropping.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Use TLS 1.3 when possible, enforce HTTPS
												redirects, and implement HSTS (HTTP Strict Transport Security) headers to
												prevent downgrade attacks.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiCheck
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Token Validation
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> All tokens (ID tokens, access tokens, logout
												tokens) and session state parameters must be cryptographically validated
												before use. This includes verifying signatures, checking expiration times,
												validating issuers and audiences, and ensuring the token hasn't been
												tampered with.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Invalid or tampered tokens can lead to
												unauthorized access, session hijacking, or security breaches. Proper
												validation ensures that only legitimate tokens issued by the trusted{' '}
												<strong>OpenID Provider (OP)</strong>
												are accepted. This is especially critical for logout tokens in back-channel
												logout, where an invalid token could allow an attacker to force logouts or
												prevent legitimate logouts.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Validate all token claims (iss, aud, exp,
												iat), verify cryptographic signatures using the OP's public keys from JWKS
												endpoint, and implement proper error handling for invalid tokens.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiUsers
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Logout Confirmation
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> When users initiate logout, the application
												should require explicit confirmation before proceeding. This can be a
												confirmation dialog, a two-step process, or a confirmation button that must
												be clicked. However, this should not interfere with automatic logouts
												triggered by the <strong>OpenID Provider (OP)</strong>.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Accidental logouts can disrupt user
												workflows and cause frustration. However, more importantly, requiring
												confirmation helps prevent CSRF attacks where malicious sites attempt to log
												users out without their knowledge. It also provides a clear security
												boundary between user-initiated actions and system-initiated actions.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Show a clear confirmation dialog for
												user-initiated logouts, but allow automatic logouts from the OP to proceed
												without confirmation to maintain security.
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
											gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
											gap: '1.5rem',
											margin: '1.5rem 0',
										}}
									>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												CSRF Protection
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Cross-Site Request Forgery (CSRF) protection
												prevents malicious websites from making logout requests on behalf of
												authenticated users. This is typically implemented using CSRF tokens -
												unique, unpredictable values that are included in logout requests and
												validated by the server.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Without CSRF protection, an attacker
												could embed a logout link or form on a malicious website that automatically
												logs users out when they visit. This could be used to disrupt user sessions,
												force re-authentication, or be part of a larger attack chain. CSRF tokens
												ensure that logout requests can only be made from the legitimate
												application.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Generate unique CSRF tokens per session,
												store them securely (e.g., in HttpOnly cookies), and validate them on all
												logout requests. Use SameSite cookie attributes for additional protection.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiShield
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Origin Validation
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Origin validation involves checking the{' '}
												<code>Origin</code> or <code>Referer</code> HTTP headers of logout requests
												to ensure they come from the expected <strong>Relying Party (RP)</strong>{' '}
												application. The origin must match the registered redirect URIs and
												post-logout redirect URIs configured in the{' '}
												<strong>OpenID Provider (OP)</strong>.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Origin validation prevents attackers
												from making logout requests from unauthorized domains. This is critical for
												preventing session fixation attacks and ensuring that logout operations can
												only be initiated from legitimate application origins. Without origin
												validation, any website could potentially trigger logouts on behalf of
												users.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Validate the Origin header against a
												whitelist of allowed origins, implement proper error handling for missing or
												invalid origins, and use both Origin and Referer headers for defense in
												depth.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiMonitor
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Session Timeout
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Session timeout defines the maximum duration
												a user session can remain active before requiring re-authentication. This
												includes both absolute timeouts (total session lifetime) and idle timeouts
												(time since last activity). Sessions should automatically expire after the
												timeout period.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Long-lived sessions increase the risk
												of session hijacking if tokens are stolen. Reasonable timeouts limit the
												window of opportunity for attackers and ensure that abandoned sessions don't
												remain active indefinitely. This is especially critical for high-security
												applications where session compromise could lead to unauthorized access to
												sensitive data.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Use absolute timeouts of 8-24 hours for most
												applications, implement idle timeouts of 15-30 minutes, and provide clear
												warnings before sessions expire. Balance security with user experience.
											</p>
										</div>
										<div
											style={{
												padding: '1.25rem',
												background: 'white',
												borderRadius: '0.5rem',
												border: '2px solid #3b82f6',
											}}
										>
											<FiUsers
												style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '0.75rem' }}
											/>
											<h4
												style={{
													margin: '0 0 0.75rem 0',
													color: '#1e293b',
													fontSize: '1.05rem',
													fontWeight: 600,
												}}
											>
												Audit Logging
											</h4>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>What it means:</strong> Audit logging involves recording all session
												management events, including login, logout, session creation, session
												expiration, and failed authentication attempts. Each log entry should
												include timestamps, user identifiers, IP addresses, user agents, and the
												type of event.
											</p>
											<p
												style={{
													margin: '0 0 0.75rem 0',
													color: '#374151',
													fontSize: '0.95rem',
													lineHeight: '1.6',
												}}
											>
												<strong>Why it's important:</strong> Audit logs are essential for security
												monitoring, compliance (GDPR, HIPAA, SOC 2), and incident response. They
												allow security teams to detect suspicious patterns, investigate security
												incidents, and understand user behavior. In the event of a security breach,
												audit logs provide a trail of what happened and can help identify the scope
												and impact of the incident.
											</p>
											<p
												style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}
											>
												<strong>Best Practice:</strong> Log all session events in a tamper-proof
												format, store logs securely with retention policies, and implement log
												analysis and alerting for suspicious patterns (e.g., multiple failed
												logouts, unusual logout patterns).
											</p>
										</div>
									</div>

									<SecurityNote>
										<FiShield />
										<div>
											<h4>Security Warning</h4>
											<p>
												Always validate session state and implement proper CSRF protection for
												logout endpoints.
											</p>
										</div>
									</SecurityNote>
								</CardBody>
							</WarningCard>
						</div>
					</CollapsibleSection>
					{/* Extra spacing at bottom to prevent content cutoff */}
					<div style={{ height: '4rem', width: '100%' }} />
				</ContentWrapper>
			</PageContainer>
		</WhiteContainer>
	);
};

export default OIDCSessionManagement;
