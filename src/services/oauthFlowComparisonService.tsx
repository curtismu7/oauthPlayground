// src/services/oauthFlowComparisonService.tsx
// Service for displaying OAuth flow comparisons with collapsible headers

import { FiAlertTriangle, FiCheckCircle, FiGlobe, FiShield, FiUsers, FiXCircle } from '@icons';
import styled from 'styled-components';
import { CollapsibleHeader } from './collapsibleHeaderService';

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	background: white;
	border-radius: 0.5rem;
	overflow: hidden;
`;

const Thead = styled.thead`
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
`;

const Th = styled.th`
	padding: 1rem;
	text-align: left;
	font-weight: 600;
	font-size: 0.875rem;
`;

const Tbody = styled.tbody`
	tr:nth-child(even) {
		background: #f8fafc;
	}
`;

const Td = styled.td`
	padding: 1rem;
	font-size: 0.875rem;
	color: #374151;
	border-bottom: 1px solid #e5e7eb;
	vertical-align: top;
`;

const FeatureLabel = styled.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
`;

const Badge = styled.span<{ $variant: 'success' | 'error' | 'warning' | 'info' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${(props) => {
		switch (props.$variant) {
			case 'success':
				return '#d1fae5';
			case 'error':
				return '#fee2e2';
			case 'warning':
				return '#fef3c7';
			case 'info':
				return '#dbeafe';
		}
	}};
	color: ${(props) => {
		switch (props.$variant) {
			case 'success':
				return '#065f46';
			case 'error':
				return '#991b1b';
			case 'warning':
				return '#78350f';
			case 'info':
				return '#1e40af';
		}
	}};
`;

const CodeBlock = styled.code`
	background: #1e293b;
	color: #e2e8f0;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.75rem;
	white-space: nowrap;
`;

const IconWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
`;

const UseCaseList = styled.ul`
	margin: 0.5rem 0;
	padding-left: 1.5rem;
	li {
		margin: 0.5rem 0;
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' }>`
	display: flex;
	gap: 1rem;
	padding: 1.5rem;
	background: ${(props) => (props.$variant === 'warning' ? '#fef3c7' : '#eff6ff')};
	border: 1px solid ${(props) => (props.$variant === 'warning' ? '#fbbf24' : '#bfdbfe')};
	border-radius: 0.75rem;
	margin: 1rem 0;
	font-size: 0.875rem;
	line-height: 1.6;
	color: ${(props) => (props.$variant === 'warning' ? '#78350f' : '#1e40af')};
`;

const InfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
	color: inherit;
`;

const InfoText = styled.p`
	margin: 0.5rem 0;
	&:first-child {
		margin-top: 0;
	}
	&:last-child {
		margin-bottom: 0;
	}
`;

interface OAuthFlowComparisonServiceProps {
	highlightFlow?: 'jwt' | 'saml';
	collapsed?: boolean;
}

export class OAuthFlowComparisonService {
	static getComparisonTable({ highlightFlow, collapsed = true }: OAuthFlowComparisonServiceProps) {
		return (
			<CollapsibleHeader
				title="OAuth Flow Comparison: Authorization vs JWT Bearer vs SAML Bearer"
				icon={<FiGlobe />}
				defaultCollapsed={collapsed}
				showArrow={true}
			>
				<InfoBox $variant="info">
					<FiShield size={24} />
					<div>
						<InfoTitle>Understanding Different OAuth Flows</InfoTitle>
						<InfoText>
							OAuth 2.0 provides multiple flows for different scenarios. This table helps you
							understand when to use each flow and how they differ in terms of authentication,
							security, and use cases.
						</InfoText>
					</div>
				</InfoBox>

				<Table>
					<Thead>
						<tr>
							<Th>Feature</Th>
							<Th>Authorization Code</Th>
							<Th style={{ background: highlightFlow === 'jwt' ? '#8b5cf6' : undefined }}>
								JWT Bearer (RFC 7523)
							</Th>
							<Th style={{ background: highlightFlow === 'saml' ? '#06b6d4' : undefined }}>
								SAML Bearer (RFC 7522)
							</Th>
						</tr>
					</Thead>
					<Tbody>
						<tr>
							<Td>
								<FeatureLabel>User Interaction</FeatureLabel>
							</Td>
							<Td>
								<Badge $variant="success">
									<FiCheckCircle /> Required
								</Badge>
							</Td>
							<Td>
								<Badge $variant="error">
									<FiXCircle /> None
								</Badge>
							</Td>
							<Td>
								<Badge $variant="error">
									<FiXCircle /> None
								</Badge>
							</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Browser Required</FeatureLabel>
							</Td>
							<Td>
								<Badge $variant="success">
									<FiCheckCircle /> Yes
								</Badge>
							</Td>
							<Td>
								<Badge $variant="error">
									<FiXCircle /> No
								</Badge>
							</Td>
							<Td>
								<Badge $variant="error">
									<FiXCircle /> No
								</Badge>
							</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Authentication Method</FeatureLabel>
							</Td>
							<Td>User credentials + browser</Td>
							<Td>Client assertion (JWT)</Td>
							<Td>IdP assertion (SAML)</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Grant Type</FeatureLabel>
							</Td>
							<Td>
								<CodeBlock>authorization_code</CodeBlock>
							</Td>
							<Td>
								<CodeBlock>jwt-bearer</CodeBlock>
							</Td>
							<Td>
								<CodeBlock>saml2-bearer</CodeBlock>
							</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Cryptography</FeatureLabel>
							</Td>
							<Td>Optional (PKCE recommended)</Td>
							<Td>
								<Badge $variant="warning">
									<FiAlertTriangle /> Required (JWT signing)
								</Badge>
							</Td>
							<Td>
								<Badge $variant="warning">
									<FiAlertTriangle /> Required (SAML signing)
								</Badge>
							</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Key Management</FeatureLabel>
							</Td>
							<Td>Client secret</Td>
							<Td>Private/Public key pair</Td>
							<Td>IdP trust relationship</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Typical Use Case</FeatureLabel>
							</Td>
							<Td>
								<IconWrapper>
									<FiUsers /> User authentication
								</IconWrapper>
							</Td>
							<Td>
								<IconWrapper>
									<FiShield /> Server-to-server
								</IconWrapper>
							</Td>
							<Td>
								<IconWrapper>
									<FiGlobe /> Enterprise SSO
								</IconWrapper>
							</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>Complexity</FeatureLabel>
							</Td>
							<Td>
								<Badge $variant="info">Medium</Badge>
							</Td>
							<Td>
								<Badge $variant="warning">High</Badge>
							</Td>
							<Td>
								<Badge $variant="error">Very High</Badge>
							</Td>
						</tr>

						<tr>
							<Td>
								<FeatureLabel>PingOne Support</FeatureLabel>
							</Td>
							<Td>
								<Badge $variant="success">
									<FiCheckCircle /> Supported
								</Badge>
							</Td>
							<Td>
								<Badge $variant="error">
									<FiXCircle /> Not Supported
								</Badge>
							</Td>
							<Td>
								<Badge $variant="error">
									<FiXCircle /> Not Supported
								</Badge>
							</Td>
						</tr>
					</Tbody>
				</Table>

				<div style={{ marginTop: '2rem' }}>
					<InfoTitle style={{ color: '#1f2937', marginBottom: '1rem' }}>
						<FiUsers /> When to Use Each Flow
					</InfoTitle>

					<Table>
						<Thead>
							<tr>
								<Th>Flow Type</Th>
								<Th>Best For</Th>
								<Th>Examples</Th>
							</tr>
						</Thead>
						<Tbody>
							<tr>
								<Td>
									<FeatureLabel>Authorization Code</FeatureLabel>
								</Td>
								<Td>
									<UseCaseList>
										<li>Web applications with user login</li>
										<li>Mobile apps with user accounts</li>
										<li>Any scenario requiring user consent</li>
										<li>Delegated authorization</li>
									</UseCaseList>
								</Td>
								<Td>Social login, SaaS applications, consumer apps</Td>
							</tr>

							<tr>
								<Td>
									<FeatureLabel>JWT Bearer</FeatureLabel>
								</Td>
								<Td>
									<UseCaseList>
										<li>Microservices communication</li>
										<li>Batch processing systems</li>
										<li>Automated workflows</li>
										<li>Service accounts</li>
									</UseCaseList>
								</Td>
								<Td>Google Service Accounts, Auth0 M2M, API gateways</Td>
							</tr>

							<tr>
								<Td>
									<FeatureLabel>SAML Bearer</FeatureLabel>
								</Td>
								<Td>
									<UseCaseList>
										<li>Enterprise SSO integration</li>
										<li>SAML federation scenarios</li>
										<li>Legacy system integration</li>
										<li>Cross-domain authentication</li>
									</UseCaseList>
								</Td>
								<Td>Enterprise SaaS, government systems, corporate portals</Td>
							</tr>
						</Tbody>
					</Table>
				</div>

				{highlightFlow && (
					<InfoBox $variant="warning" style={{ marginTop: '1.5rem' }}>
						<FiAlertTriangle size={24} />
						<div>
							<InfoTitle>
								{highlightFlow === 'jwt' ? 'JWT Bearer Token Flow' : 'SAML Bearer Assertion Flow'} -
								Educational Mock
							</InfoTitle>
							<InfoText>
								This flow is a <strong>mock/educational implementation</strong> because PingOne does
								not support {highlightFlow === 'jwt' ? 'JWT Bearer' : 'SAML Bearer'} assertions.
								However, this flow is widely used in enterprise OAuth servers and is valuable to
								understand for real-world OAuth implementations.
							</InfoText>
							<InfoText>
								<strong>Where it's used:</strong> Enterprise OAuth servers like Okta, Auth0, Azure
								AD, and Google Cloud support this flow for{' '}
								{highlightFlow === 'jwt' ? 'service account' : 'enterprise SSO'} scenarios.
							</InfoText>
						</div>
					</InfoBox>
				)}
			</CollapsibleHeader>
		);
	}
}

export default OAuthFlowComparisonService;
