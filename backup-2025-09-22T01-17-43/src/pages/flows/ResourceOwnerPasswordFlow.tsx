import React from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiInfo, FiShield, FiUser, FiLock, FiX } from 'react-icons/fi';

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

const CardIcon = styled.div`
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
`;

const WarningIcon = styled(CardIcon)`
  background: #dc2626;
`;

const InfoIcon = styled(CardIcon)`
  background: #0ea5e9;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const CardText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  color: #374151;
`;

const CardList = styled.ul`
  margin: 1rem 0;
  padding-left: 1.5rem;
`;

const CardListItem = styled.li`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const FlowSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StepContainer = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
`;

const StepNumber = styled.div`
  display: inline-block;
  background: #3b82f6;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  text-align: center;
  line-height: 2rem;
  font-weight: 600;
  margin-right: 1rem;
`;

const StepTitle = styled.h3`
  display: inline;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
`;

const StepDescription = styled.p`
  margin: 1rem 0 0 0;
  color: #374151;
  line-height: 1.6;
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

const ReferenceLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ResourceOwnerPasswordFlow: React.FC = () => {
	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>
					<FiShield />
					Resource Owner Password Credentials Flow
				</PageTitle>
				<PageSubtitle>OAuth 2.0 Grant Type - Not Supported by PingOne</PageSubtitle>
			</PageHeader>

			<WarningCard>
				<WarningIcon>
					<FiX />
				</WarningIcon>
				<CardContent>
					<CardTitle>⚠️ Not Supported by PingOne</CardTitle>
					<CardText>
						The Resource Owner Password Credentials flow is <strong>not supported</strong> by
						PingOne Identity Platform. This page is provided for educational purposes and to help
						you understand why this flow is generally not recommended for modern applications.
					</CardText>
				</CardContent>
			</WarningCard>

			<InfoCard>
				<InfoIcon>
					<FiInfo />
				</InfoIcon>
				<CardContent>
					<CardTitle>Why is this flow not recommended?</CardTitle>
					<CardText>
						The Resource Owner Password Credentials flow is considered insecure and is generally not
						recommended for modern applications. Here's why:
					</CardText>
					<CardList>
						<CardListItem>
							<strong>Security Risk:</strong> Applications must handle user credentials directly
						</CardListItem>
						<CardListItem>
							<strong>Password Exposure:</strong> Passwords are transmitted to the client
							application
						</CardListItem>
						<CardListItem>
							<strong>Limited Scope:</strong> Cannot support modern security features like MFA
						</CardListItem>
						<CardListItem>
							<strong>User Experience:</strong> Poor UX compared to modern authentication flows
						</CardListItem>
						<CardListItem>
							<strong>Compliance Issues:</strong> May violate security standards and regulations
						</CardListItem>
					</CardList>
				</CardContent>
			</InfoCard>

			<FlowSection>
				<SectionTitle>
					<FiUser />
					How Resource Owner Password Credentials Flow Works
				</SectionTitle>

				<StepContainer>
					<StepNumber>1</StepNumber>
					<StepTitle>User Provides Credentials</StepTitle>
					<StepDescription>
						The user enters their username and password directly into the client application. The
						application collects these credentials through a form or similar interface.
					</StepDescription>
				</StepContainer>

				<StepContainer>
					<StepNumber>2</StepNumber>
					<StepTitle>Client Sends Credentials to Authorization Server</StepTitle>
					<StepDescription>
						The client application sends the user's credentials directly to the authorization
						server's token endpoint.
					</StepDescription>
					<CodeBlock>
						<CodeComment>POST /as/token</CodeComment>
						<br />
						<CodeComment>Content-Type: application/x-www-form-urlencoded</CodeComment>
						<br />
						<br />
						<CodeKeyword>grant_type</CodeKeyword>=<CodeString>password</CodeString>&
						<CodeKeyword>username</CodeKeyword>=<CodeString>user@example.com</CodeString>&
						<CodeKeyword>password</CodeKeyword>=<CodeString>userpassword</CodeString>&
						<CodeKeyword>client_id</CodeKeyword>=<CodeString>your_client_id</CodeString>&
						<CodeKeyword>client_secret</CodeKeyword>=<CodeString>your_client_secret</CodeString>&
						<CodeKeyword>scope</CodeKeyword>=<CodeString>openid profile email</CodeString>
					</CodeBlock>
				</StepContainer>

				<StepContainer>
					<StepNumber>3</StepNumber>
					<StepTitle>Authorization Server Validates Credentials</StepTitle>
					<StepDescription>
						The authorization server validates the user's credentials against its user store. If
						valid, it issues an access token (and optionally a refresh token).
					</StepDescription>
				</StepContainer>

				<StepContainer>
					<StepNumber>4</StepNumber>
					<StepTitle>Client Receives Tokens</StepTitle>
					<StepDescription>
						The client application receives the access token and can now make API calls on behalf of
						the user.
					</StepDescription>
					<CodeBlock>
						<CodeComment>Response:</CodeComment>
						<br />
						{`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}`}
					</CodeBlock>
				</StepContainer>
			</FlowSection>

			<FlowSection>
				<SectionTitle>
					<FiLock />
					Security Considerations
				</SectionTitle>

				<CardList>
					<CardListItem>
						<strong>Credential Storage:</strong> The application must securely store user
						credentials, which increases the attack surface and security risk.
					</CardListItem>
					<CardListItem>
						<strong>Password Transmission:</strong> Passwords are transmitted over the network,
						requiring additional security measures like HTTPS and proper encryption.
					</CardListItem>
					<CardListItem>
						<strong>No MFA Support:</strong> This flow cannot support modern multi-factor
						authentication methods that are essential for security.
					</CardListItem>
					<CardListItem>
						<strong>Phishing Vulnerability:</strong> Users may be more susceptible to phishing
						attacks as they're trained to enter credentials into applications.
					</CardListItem>
					<CardListItem>
						<strong>Compliance Issues:</strong> Many security standards and regulations discourage
						or prohibit this flow due to its inherent security risks.
					</CardListItem>
				</CardList>
			</FlowSection>

			<FlowSection>
				<SectionTitle>
					<FiShield />
					Recommended Alternatives
				</SectionTitle>

				<CardText>
					Instead of the Resource Owner Password Credentials flow, consider these more secure
					alternatives:
				</CardText>

				<CardList>
					<CardListItem>
						<strong>Authorization Code Flow with PKCE:</strong> The most secure and recommended flow
						for modern applications. Supports MFA, SSO, and other advanced security features.
					</CardListItem>
					<CardListItem>
						<strong>Device Authorization Flow:</strong> For devices with limited input capabilities,
						this flow provides a secure way to authenticate without direct credential handling.
					</CardListItem>
					<CardListItem>
						<strong>Client Credentials Flow:</strong> For machine-to-machine authentication where no
						user interaction is required.
					</CardListItem>
					<CardListItem>
						<strong>Hybrid Flow:</strong> Combines the security of the Authorization Code flow with
						immediate access to ID tokens for better user experience.
					</CardListItem>
				</CardList>
			</FlowSection>

			<FlowSection>
				<SectionTitle>
					<FiInfo />
					References
				</SectionTitle>

				<CardText>Learn more about OAuth 2.0 flows and security best practices:</CardText>

				<CardList>
					<CardListItem>
						<ReferenceLink
							href="https://frontegg.com/blog/oauth-flows"
							target="_blank"
							rel="noopener noreferrer"
						>
							OAuth Flows Explained - Frontegg Blog
						</ReferenceLink>
					</CardListItem>
					<CardListItem>
						<ReferenceLink
							href="https://tools.ietf.org/html/rfc6749#section-4.3"
							target="_blank"
							rel="noopener noreferrer"
						>
							RFC 6749 - OAuth 2.0 Authorization Framework (Section 4.3)
						</ReferenceLink>
					</CardListItem>
					<CardListItem>
						<ReferenceLink
							href="https://tools.ietf.org/html/draft-ietf-oauth-security-topics"
							target="_blank"
							rel="noopener noreferrer"
						>
							OAuth 2.0 Security Best Current Practice
						</ReferenceLink>
					</CardListItem>
					<CardListItem>
						<ReferenceLink
							href="https://apidocs.pingidentity.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							PingOne API Documentation
						</ReferenceLink>
					</CardListItem>
				</CardList>
			</FlowSection>
		</PageContainer>
	);
};

export default ResourceOwnerPasswordFlow;
