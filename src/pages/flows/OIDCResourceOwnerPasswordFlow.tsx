import { FiAlertTriangle, FiCheckCircle, FiInfo, FiShield, FiUser, FiX } from '@icons';
import type React from 'react';
import { useEffect } from 'react';
import styled from 'styled-components';
import CollapsibleSection from '../../components/CollapsibleSection';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 2rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
`;

const WarningCard = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const OIDCCard = styled.div`
  background: #faf5ff;
  border: 2px solid #c4b5fd;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardText = styled.p`
  margin: 0 0 1rem 0;
  line-height: 1.6;
`;

const CardList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  line-height: 1.6;
`;

const CardListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1rem 0;
`;

const SecurityNotice = styled.div`
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 2rem 0;
`;

const SecurityTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SecurityList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #92400e;
`;

const SecurityListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const OIDCResourceOwnerPasswordFlow: React.FC = () => {
	// Scroll to top when component mounts
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>
					<FiCheckCircle />
					OIDC Resource Owner Password Flow
				</PageTitle>
				<PageSubtitle>OpenID Connect extension with username/password authentication</PageSubtitle>
			</PageHeader>

			<CollapsibleSection title="⚠️ Security Warning" defaultCollapsed={false}>
				<WarningCard>
					<FiAlertTriangle size={24} color="#dc2626" />
					<CardContent>
						<CardText style={{ color: '#991b1b' }}>
							The OIDC Resource Owner Password Credentials flow is <strong>deprecated</strong> and
							should be avoided in most cases due to significant security risks. This flow requires
							the application to collect and handle user credentials directly.
						</CardText>
						<CardList style={{ color: '#991b1b' }}>
							<CardListItem>Applications must handle passwords securely</CardListItem>
							<CardListItem>No delegation of authentication to authorization server</CardListItem>
							<CardListItem>Phishing attacks become easier</CardListItem>
							<CardListItem>Violates principle of least privilege</CardListItem>
							<CardListItem>OIDC benefits (SSO, MFA) are lost</CardListItem>
						</CardList>
					</CardContent>
				</WarningCard>
			</CollapsibleSection>

			<CollapsibleSection title="🆔 OpenID Connect Extension">
				<OIDCCard>
					<FiCheckCircle size={24} color="#059669" />
					<CardContent>
						<CardText style={{ color: '#374151' }}>
							This is the OIDC version of the Resource Owner Password flow, which includes
							additional OpenID Connect features:
						</CardText>
						<CardList style={{ color: '#374151' }}>
							<CardListItem>
								<strong>ID Token:</strong> Contains user identity information (JWT)
							</CardListItem>
							<CardListItem>
								<strong>User Info:</strong> Additional user profile data available
							</CardListItem>
							<CardListItem>
								<strong>Standardized Claims:</strong> Consistent user information format
							</CardListItem>
							<CardListItem>
								<strong>Session Management:</strong> OIDC session handling capabilities
							</CardListItem>
							<CardListItem>
								<strong>Discovery:</strong> Automatic endpoint discovery via .well-known
							</CardListItem>
						</CardList>
					</CardContent>
				</OIDCCard>
			</CollapsibleSection>

			<CollapsibleSection title="📋 When to Use (Rare Cases)">
				<InfoCard>
					<FiInfo size={24} color="#0ea5e9" />
					<CardContent>
						<CardText style={{ color: '#0c4a6e' }}>
							This OIDC flow should only be used in very specific, high-trust scenarios:
						</CardText>
						<CardList style={{ color: '#0c4a6e' }}>
							<CardListItem>Legacy system migration where other flows are impossible</CardListItem>
							<CardListItem>
								Highly trusted first-party applications requiring user identity
							</CardListItem>
							<CardListItem>
								Internal enterprise applications with strong security controls
							</CardListItem>
							<CardListItem>
								Server-to-server communication with shared user credentials
							</CardListItem>
							<CardListItem>When ID token and user claims are specifically needed</CardListItem>
						</CardList>
					</CardContent>
				</InfoCard>
			</CollapsibleSection>

			<CollapsibleSection title="🔐 OIDC Resource Owner Password Flow">
				<InfoCard>
					<FiShield size={24} color="#0ea5e9" />
					<CardContent>
						<CardText style={{ color: '#0c4a6e' }}>
							The application collects the user's credentials and exchanges them directly for both
							an access token and an ID token containing user identity information.
						</CardText>

						<CardTitle style={{ color: '#0c4a6e', marginTop: '1.5rem' }}>Flow Steps:</CardTitle>
						<CardList style={{ color: '#0c4a6e' }}>
							<CardListItem>Application collects username and password</CardListItem>
							<CardListItem>
								Application sends credentials to token endpoint with openid scope
							</CardListItem>
							<CardListItem>Authorization server validates credentials</CardListItem>
							<CardListItem>
								Server returns access token, ID token, and optionally refresh token
							</CardListItem>
							<CardListItem>Application can use ID token for user identity</CardListItem>
							<CardListItem>Optional: Call UserInfo endpoint for additional claims</CardListItem>
						</CardList>

						<CardTitle style={{ color: '#0c4a6e', marginTop: '1.5rem' }}>
							Token Request Example:
						</CardTitle>
						<CodeBlock>
							{`POST /as/token HTTP/1.1
Host: auth.pingone.com
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=user@example.com
&password=userpassword
&client_id=your-client-id
&client_secret=your-client-secret
&scope=openid profile email read write`}
						</CodeBlock>

						<CardTitle style={{ color: '#0c4a6e', marginTop: '1.5rem' }}>
							Token Response Example:
						</CardTitle>
						<CodeBlock>
							{`{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "scope": "openid profile email read write"
}`}
						</CodeBlock>
					</CardContent>
				</InfoCard>
			</CollapsibleSection>

			<CollapsibleSection title="🛡️ OIDC Security Best Practices">
				<SecurityNotice>
					<SecurityTitle>
						<FiAlertTriangle />
						OIDC Security Best Practices (If You Must Use This Flow)
					</SecurityTitle>
					<SecurityList>
						<SecurityListItem>
							<strong>Use HTTPS only:</strong> Never send credentials over unencrypted connections
						</SecurityListItem>
						<SecurityListItem>
							<strong>Validate ID tokens:</strong> Always verify ID token signature and claims
						</SecurityListItem>
						<SecurityListItem>
							<strong>Minimal scope:</strong> Request only the minimum required permissions and OIDC
							scopes
						</SecurityListItem>
						<SecurityListItem>
							<strong>Secure storage:</strong> Never store passwords in plain text or client-side
						</SecurityListItem>
						<SecurityListItem>
							<strong>Token security:</strong> Implement proper token storage and rotation
						</SecurityListItem>
						<SecurityListItem>
							<strong>Nonce validation:</strong> Use and validate nonce values in ID tokens
						</SecurityListItem>
						<SecurityListItem>
							<strong>Audit logging:</strong> Log all authentication attempts and failures
						</SecurityListItem>
						<SecurityListItem>
							<strong>Rate limiting:</strong> Implement brute force protection
						</SecurityListItem>
						<SecurityListItem>
							<strong>Multi-factor authentication:</strong> Consider additional authentication
							factors
						</SecurityListItem>
					</SecurityList>
				</SecurityNotice>
			</CollapsibleSection>

			<CollapsibleSection title="✅ Recommended OIDC Alternatives">
				<InfoCard>
					<FiUser size={24} color="#0ea5e9" />
					<CardContent>
						<CardText style={{ color: '#0c4a6e' }}>
							Instead of the OIDC Resource Owner Password flow, consider these more secure
							alternatives:
						</CardText>
						<CardList style={{ color: '#0c4a6e' }}>
							<CardListItem>
								<strong>OIDC Authorization Code Flow:</strong> Most secure for web applications with
								SSO
							</CardListItem>
							<CardListItem>
								<strong>OIDC Authorization Code with PKCE:</strong> Best for mobile and SPA
								applications
							</CardListItem>
							<CardListItem>
								<strong>OIDC Implicit Flow:</strong> For legacy applications (deprecated, use PKCE
								instead)
							</CardListItem>
							<CardListItem>
								<strong>OIDC Hybrid Flow:</strong> When you need both ID token and authorization
								code
							</CardListItem>
							<CardListItem>
								<strong>OIDC Device Code Flow:</strong> For devices with limited input capabilities
							</CardListItem>
							<CardListItem>
								<strong>OIDC Client Credentials Flow:</strong> For server-to-server communication
							</CardListItem>
						</CardList>
					</CardContent>
				</InfoCard>
			</CollapsibleSection>

			<CollapsibleSection title="❌ Implementation Status" defaultCollapsed={false}>
				<SecurityNotice>
					<SecurityTitle>
						<FiX />
						Implementation Status
					</SecurityTitle>
					<CardText style={{ color: '#92400e' }}>
						This OIDC Resource Owner Password flow is currently <strong>not implemented</strong> in
						PingOne SSO due to security concerns. However, we provide a{' '}
						<strong>Mock OIDC Resource Owner Password Flow</strong> for educational purposes that
						demonstrates how this flow would work while highlighting the security risks.
					</CardText>
				</SecurityNotice>
			</CollapsibleSection>
		</PageContainer>
	);
};

export default OIDCResourceOwnerPasswordFlow;
