import {
	FiAlertTriangle,
	FiBookOpen,
	FiCheckCircle,
	FiCode,
	FiExternalLink,
	FiGlobe,
	FiHelpCircle,
	FiKey,
	FiLock,
	FiPlay,
	FiSettings,
	FiShield,
	FiTool,
	FiUsers,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import { FlowUIService } from '../services/flowUIService';
import PageLayoutService from '../services/pageLayoutService';

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
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
  .tools { background: linear-gradient(135deg, #22c55e, #16a34a); }

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
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white !important;
  text-decoration: none;
  border: 2px solid white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #2563eb;
    color: white !important;
    border-color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
    border-color: white;
  }
`;

const Documentation = () => {
	// Centralized scroll management
	usePageScroll({ pageName: 'PingOne SSO Documentation', force: true });

	// UI Settings integration
	const { settings } = useUISettings();

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for documentation content
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'pingone-sso-documentation', // Enables FlowHeader integration
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

				<CollapsibleHeader
					title="PingOne SSO Documentation"
					subtitle="Complete guide to implementing Single Sign-On with PingOne Identity Platform"
					icon={<FiUsers />}
					defaultCollapsed={false}
				>
					<QuickStartBanner>
						<h2>Ready to Implement PingOne SSO?</h2>
						<p>
							Jump into our interactive tutorials and start learning PingOne SSO implementation with
							hands-on examples
						</p>
						<QuickStartButton to="/tutorials">
							<FiPlay size={16} />
							Start PingOne SSO Tutorials
						</QuickStartButton>
					</QuickStartBanner>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne SSO Overview"
					subtitle="Complete guide to implementing Single Sign-On with PingOne Identity Platform"
					icon={<FiBookOpen />}
					defaultCollapsed={false}
				>
					<p>
						This documentation provides comprehensive guidance for implementing Single Sign-On (SSO)
						with PingOne Identity Platform. Whether you're integrating with web applications, mobile
						apps, or enterprise systems, you'll find the resources you need to build secure,
						standards-compliant SSO solutions.
					</p>

					<div
						style={{
							background: '#f0f9ff',
							border: '1px solid #bae6fd',
							borderRadius: '0.5rem',
							padding: '1.5rem',
							marginTop: '1rem',
						}}
					>
						<h3 style={{ marginTop: 0, color: '#0c4a6e' }}>PingOne SSO Implementation Guide:</h3>
						<ul style={{ marginBottom: 0, color: '#0369a1' }}>
							<li>
								<strong>PingOne Environment Setup:</strong> Configure your PingOne environment and
								applications
							</li>
							<li>
								<strong>SSO Flow Implementation:</strong> Authorization Code Flow with PKCE for
								secure SSO
							</li>
							<li>
								<strong>User Authentication:</strong> PingOne login flows and user management
							</li>
							<li>
								<strong>Session Management:</strong> Token handling and refresh strategies
							</li>
							<li>
								<strong>Multi-Factor Authentication:</strong> PingOne MFA integration and policies
							</li>
							<li>
								<strong>Enterprise Integration:</strong> SAML, LDAP, and directory services
							</li>
							<li>
								<strong>Security Best Practices:</strong> PingOne-specific security recommendations
							</li>
							<li>
								<strong>Troubleshooting:</strong> Common PingOne SSO issues and solutions
							</li>
						</ul>
					</div>
				</CollapsibleHeader>

				<FeatureHighlight>
					<FeatureCard>
						<div className="icon tutorials">
							<FiPlay />
						</div>
						<h3>Interactive Tutorials</h3>
						<p>Step-by-step guided learning with real examples and immediate feedback</p>
						<FeatureButton to="/tutorials">Try Tutorials</FeatureButton>
					</FeatureCard>

					<FeatureCard>
						<div className="icon flows">
							<FiCode />
						</div>
						<h3>OAuth Flows</h3>
						<p>Explore different OAuth 2.0 grant types with live implementations</p>
						<FeatureButton to="/flows">View Flows</FeatureButton>
					</FeatureCard>

					<FeatureCard>
						<div className="icon security">
							<FiShield />
						</div>
						<h3>Security Guide</h3>
						<p>Learn security best practices and common pitfalls to avoid</p>
						<FeatureButton to="/documentation#security">Security Tips</FeatureButton>
					</FeatureCard>

					<FeatureCard>
						<div className="icon tools">
							<FiTool />
						</div>
						<h3>Developer Tools</h3>
						<p>JWT decoder, PKCE generator, and other useful OAuth utilities</p>
						<FeatureButton to="/tutorials?tab=utilities">Use Tools</FeatureButton>
					</FeatureCard>
				</FeatureHighlight>

				<CollapsibleHeader
					title="PingOne SSO Getting Started"
					subtitle="Essential resources for implementing PingOne Single Sign-On"
					icon={<FiSettings />}
					defaultCollapsed={false}
				>
					<p>
						If you're new to PingOne SSO implementation, start with these resources to understand
						the PingOne platform and how to integrate SSO effectively.
					</p>

					<CardGrid>
						<DocCard to="/documentation/pingone-basics">
							<h3>
								PingOne SSO Basics <FiExternalLink size={16} />
							</h3>
							<p>
								Learn the fundamental concepts of PingOne SSO, including environments, applications,
								and user management.
							</p>
						</DocCard>

						<DocCard to="/documentation/pingone-oidc">
							<h3>
								PingOne OpenID Connect <FiExternalLink size={16} />
							</h3>
							<p>
								Understand how PingOne implements OpenID Connect for enterprise SSO and user
								authentication.
							</p>
						</DocCard>

						<DocCard to="/documentation/pingone-setup">
							<h3>
								PingOne Environment Setup <FiExternalLink size={16} />
							</h3>
							<p>
								Step-by-step instructions for configuring your PingOne environment, applications,
								and SSO policies.
							</p>
						</DocCard>
					</CardGrid>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne SSO Flows"
					subtitle="OAuth 2.0 and OpenID Connect flows optimized for PingOne SSO implementation"
					icon={<FiCode />}
					defaultCollapsed={false}
				>
					<p>
						PingOne supports all standard OAuth 2.0 and OpenID Connect flows, each optimized for
						different SSO scenarios. Choose the right flow based on your application type and
						security requirements.
					</p>

					<CardGrid>
						<DocCard to="/flows/oauth-authorization-code-v5">
							<h3>PingOne Authorization Code SSO</h3>
							<p>
								The most secure PingOne SSO flow for server-side applications with confidential
								client credentials.
							</p>
						</DocCard>

						<DocCard to="/flows/oidc-authorization-code-v5">
							<h3>PingOne OIDC SSO Flow</h3>
							<p>
								Enhanced PingOne SSO with OpenID Connect for user authentication and identity
								information.
							</p>
						</DocCard>

						<DocCard to="/flows/client-credentials-v5">
							<h3>PingOne Service-to-Service</h3>
							<p>PingOne machine-to-machine authentication for backend services and API access.</p>
						</DocCard>

						<DocCard to="/flows/oidc-device-authorization-v5">
							<h3>PingOne Device SSO</h3>
							<p>
								PingOne SSO for devices with limited input capabilities like smart TVs and IoT
								devices.
							</p>
						</DocCard>
					</CardGrid>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne SSO Security"
					subtitle="Security best practices and recommendations for PingOne SSO implementation"
					icon={<FiLock />}
					defaultCollapsed={false}
				>
					<p>
						Implementing PingOne SSO securely requires following PingOne-specific best practices to
						protect against common vulnerabilities and ensure enterprise-grade security.
					</p>

					<div
						style={{
							background: '#fef2f2',
							border: '1px solid #fecaca',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1.5rem',
						}}
					>
						<p style={{ margin: 0, color: '#dc2626', fontWeight: '500' }}>
							<strong> Security Warning:</strong> OAuth 2.0 and OpenID Connect handle sensitive
							authentication data. Always follow these security guidelines to protect your users and
							applications.
						</p>
					</div>

					<div style={{ marginTop: '1.5rem' }}>
						<h3>Always Use HTTPS</h3>
						<p>
							All OAuth 2.0 and OpenID Connect endpoints must be accessed over HTTPS to protect
							tokens and sensitive data in transit.
						</p>

						<h3>Validate ID Tokens</h3>
						<p>
							Always validate ID tokens to ensure they are properly signed, not expired, and issued
							by a trusted identity provider.
						</p>

						<CodeBlock>
							<code>{`// Example ID token validation
const validateIdToken = (idToken, clientId, issuer) => {
  // Verify the token signature
  // Check the token expiration (exp claim)
  // Validate the issuer (iss claim)
  // Verify the audience (aud claim)
  // Check the nonce (if used)
};`}</code>
						</CodeBlock>

						<h3>Secure Token Storage</h3>
						<p>
							Store tokens securely based on your application type. For web applications, use
							HTTP-only cookies or secure browser storage with appropriate security flags.
						</p>

						<h3>Use PKCE for Public Clients</h3>
						<p>
							Always use PKCE (Proof Key for Code Exchange) for public clients to protect against
							authorization code interception attacks.
						</p>
					</div>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Common Issues & Troubleshooting"
					subtitle="Solutions to the most common OAuth 2.0 and OpenID Connect implementation issues"
					icon={<FiHelpCircle />}
					defaultCollapsed={false}
				>
					<p>
						This section covers the most common issues developers encounter when implementing OAuth
						2.0 and OpenID Connect, along with practical solutions and debugging tips to help you
						resolve them quickly.
					</p>

					<div
						style={{
							background: '#f0f9ff',
							border: '1px solid #bae6fd',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1.5rem',
						}}
					>
						<p style={{ margin: 0, color: '#0369a1', fontWeight: '500' }}>
							<strong> Pro Tip:</strong> Most OAuth 2.0 errors are related to configuration issues.
							Double-check your client settings, redirect URIs, and scopes before diving into
							complex debugging.
						</p>
					</div>

					<div style={{ marginTop: '1.5rem' }}>
						<h3>Invalid Redirect URI</h3>
						<p>
							<strong>Error:</strong> "The redirect URI in the request does not match the registered
							redirect URIs"
							<br />
							<strong>Solution:</strong> Ensure the redirect URI in your application configuration
							matches exactly (including trailing slashes) with the one used in the authorization
							request.
						</p>

						<h3>Invalid Client</h3>
						<p>
							<strong>Error:</strong> "Invalid client"
							<br />
							<strong>Solution:</strong> Verify that your client ID and client secret are correct
							and that your application is properly configured in PingOne.
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
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne SSO Resources"
					subtitle="Additional resources and external links for PingOne SSO implementation"
					icon={<FiExternalLink />}
					defaultCollapsed={false}
				>
					<div style={{ marginTop: '1.5rem' }}>
						<p>Explore these PingOne-specific resources for SSO implementation:</p>

						<ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
							<li style={{ marginBottom: '0.75rem' }}>
								<ExternalLink
									href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2"
									target="_blank"
									rel="noopener noreferrer"
								>
									PingOne API Documentation
									<FiExternalLink />
								</ExternalLink>
							</li>
							<li style={{ marginBottom: '0.75rem' }}>
								<ExternalLink
									href="https://docs.pingidentity.com/sdks/latest/sdks/index.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									PingOne SDKs
									<FiExternalLink />
								</ExternalLink>
							</li>
							<li style={{ marginBottom: '0.75rem' }}>
								<ExternalLink
									href="https://docs.pingidentity.com/bundle/pingone/page/lyc1469003009660.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									PingOne SSO Configuration Guide
									<FiExternalLink />
								</ExternalLink>
							</li>
							<li style={{ marginBottom: '0.75rem' }}>
								<ExternalLink
									href="https://docs.pingidentity.com/bundle/pingone/page/lyc1469003009660.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									PingOne Security Best Practices
									<FiExternalLink />
								</ExternalLink>
							</li>
						</ul>
					</div>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default Documentation;
