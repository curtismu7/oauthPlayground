import { useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCpu,
	FiInfo,
	FiKey,
	FiLock,
	FiServer,
	FiShield,
	FiX,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody } from '../components/Card';
import CollapsibleIcon from '../components/CollapsibleIcon';
import { FlowHeader } from '../services/flowHeaderService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
`;

const FeatureCard = styled(Card)<{ $supported?: boolean }>`
  border-left: 4px solid ${({ $supported, theme }) =>
		$supported === true
			? theme.colors.success
			: $supported === false
				? theme.colors.error
				: theme.colors.warning};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin: 0;
  }

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const StatusBadge = styled.div<{ $status: 'supported' | 'not-supported' | 'partial' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  
  ${({ $status }) => {
		switch ($status) {
			case 'supported':
				return `
          background-color: #dcfce7;
          color: #166534;
        `;
			case 'not-supported':
				return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
			case 'partial':
				return `
          background-color: #fef3c7;
          color: #92400e;
        `;
		}
	}}

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const TechnicalDetails = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin: 0 0 0.5rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: ${({ theme }) => theme.colors.gray600};
    
    li {
      margin-bottom: 0.25rem;
    }
  }
`;

const PingOneNote = styled.div<{ $type: 'info' | 'warning' | 'success' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  
  ${({ $type, theme }) => {
		switch ($type) {
			case 'info':
				return `
          background-color: ${theme.colors.info}10;
          border: 1px solid ${theme.colors.info}30;
          color: ${theme.colors.info};
        `;
			case 'warning':
				return `
          background-color: ${theme.colors.warning}10;
          border: 1px solid ${theme.colors.warning}30;
          color: ${theme.colors.warning};
        `;
			case 'success':
				return `
          background-color: ${theme.colors.success}10;
          border: 1px solid ${theme.colors.success}30;
          color: ${theme.colors.success};
        `;
		}
	}}

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  div {
    flex: 1;
    
    h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }
`;

const ComparisonSection = styled(Card)`
  margin: 3rem 0;
`;

const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray300};
  }
  
  th {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 600;
  }
  
  td {
    color: ${({ theme }) => theme.colors.gray700};
    vertical-align: top;
  }
  
  tr:hover {
    background-color: ${({ theme }) => theme.colors.gray50};
  }
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
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  svg {
    color: #6b7280;
    transition: transform 0.2s ease;
  }
`;

const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  transition: opacity 0.2s ease-in-out;
`;

const AIAgentOverview = () => {
	// State for collapsible sections
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		overview: true,
		features: true,
		comparison: true,
		recommendations: true,
	});

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}));
	};

	const features = [
		{
			id: 'par',
			title: 'Pushed Authorization Requests (PAR)',
			icon: FiLock,
			status: 'supported' as const,
			description:
				'PAR allows clients to push authorization request parameters directly to the authorization server before redirecting the user. Critical for AI agents to securely transmit complex authorization parameters.',
			technicalDetails: [
				'RFC 9126 - Pushed Authorization Requests',
				'Prevents parameter tampering and injection attacks',
				'Enables large or complex authorization requests',
				'Returns request_uri for use in authorization endpoint',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Available',
				message:
					'PingOne fully supports PAR for enhanced security in authorization flows. Use the /as/par endpoint to push authorization parameters.',
			},
		},
		{
			id: 'rar',
			title: 'Rich Authorization Requests (RAR)',
			icon: FiZap,
			status: 'not-supported' as const,
			description:
				'RAR enables fine-grained authorization by allowing clients to specify detailed authorization requirements using structured JSON. Essential for AI agents requiring specific permissions and resource access.',
			technicalDetails: [
				'RFC 9396 - Rich Authorization Requests',
				'Structured JSON authorization_details parameter',
				'Fine-grained resource and action specifications',
				'Type-specific authorization requirements',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Not Available',
				message:
					'PingOne does not currently support RAR. Use traditional scopes or custom claims as an alternative for authorization requirements.',
			},
		},
		{
			id: 'dpop',
			title: 'DPoP (Demonstrating Proof of Possession)',
			icon: FiKey,
			status: 'not-supported' as const,
			description:
				'DPoP provides sender-constrained tokens by requiring clients to prove possession of a private key. Critical for preventing token theft and replay attacks in AI agent scenarios.',
			technicalDetails: [
				'RFC 9449 - OAuth 2.0 Demonstrating Proof-of-Possession',
				'Sender-constrained access and refresh tokens',
				'JWT-based proof of possession',
				'Protection against token theft and replay',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Not Available',
				message:
					'PingOne does not currently support DPoP. Consider using mTLS (mutual TLS) or one-time use refresh tokens as alternatives.',
			},
		},
		{
			id: 'mtls',
			title: 'Mutual TLS (mTLS)',
			icon: FiShield,
			status: 'partial' as const,
			description:
				'mTLS provides certificate-based authentication and sender-constrained tokens. Important for high-security AI agent deployments requiring strong authentication.',
			technicalDetails: [
				'RFC 8705 - OAuth 2.0 Mutual-TLS Client Authentication',
				'Certificate-bound access tokens',
				'PKI-based client authentication',
				'Protection against token misuse',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Limited',
				message:
					'PingOne supports mTLS for client authentication but not for certificate-bound tokens. Contact PingOne support for enterprise mTLS requirements.',
			},
		},
		{
			id: 'jwt-secured-auth',
			title: 'JWT-Secured Authorization Request (JAR)',
			icon: FiServer,
			status: 'supported' as const,
			description:
				'JAR allows authorization request parameters to be passed as a signed JWT. Provides integrity and authenticity for authorization requests from AI agents.',
			technicalDetails: [
				'RFC 9101 - JWT-Secured Authorization Request',
				'Signed and optionally encrypted request objects',
				'Request parameter integrity protection',
				'Support for request_uri parameter',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Available',
				message:
					'PingOne supports JAR through request objects. Use the request or request_uri parameter with signed JWTs.',
			},
		},
		{
			id: 'client-credentials',
			title: 'Client Credentials Grant',
			icon: FiCpu,
			status: 'supported' as const,
			description:
				'Essential OAuth 2.0 grant for machine-to-machine authentication. The primary flow for AI agents acting autonomously without user context.',
			technicalDetails: [
				'RFC 6749 Section 4.4 - Client Credentials',
				'Machine-to-machine authentication',
				'No user context required',
				'Supports multiple authentication methods',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Full Support',
				message:
					'PingOne fully supports Client Credentials grant with multiple authentication methods including client_secret_basic, client_secret_post, client_secret_jwt, and private_key_jwt.',
			},
		},
		{
			id: 'token-exchange',
			title: 'Token Exchange',
			icon: FiZap,
			status: 'not-supported' as const,
			description:
				'Enables secure token exchange and delegation scenarios. Important for AI agents that need to act on behalf of users or exchange tokens between services.',
			technicalDetails: [
				'RFC 8693 - OAuth 2.0 Token Exchange',
				'Token delegation and impersonation',
				'Cross-domain token exchange',
				'Support for multiple token types',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Not Available',
				message:
					'PingOne does not currently support RFC 8693 Token Exchange. Consider using refresh tokens or re-authentication for token renewal scenarios.',
			},
		},
		{
			id: 'device-code',
			title: 'Device Authorization Grant',
			icon: FiServer,
			status: 'supported' as const,
			description:
				'Enables authentication on input-constrained devices. Useful for AI agents running on IoT devices, CLIs, or environments without browser access.',
			technicalDetails: [
				'RFC 8628 - OAuth 2.0 Device Authorization Grant',
				'Browser-less authentication flow',
				'User code and device code separation',
				'Polling-based token retrieval',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Available',
				message:
					'PingOne supports Device Authorization Grant for input-constrained devices and CLI applications.',
			},
		},
	];

	return (
		<Container>
			<FlowHeader
				flowType="documentation"
				customConfig={{
					flowType: 'documentation',
					title: 'AI Agent Authentication with PingOne',
					subtitle: 'Explore OAuth 2.0 and OpenID Connect features for AI agents. See which advanced authentication and authorization capabilities PingOne supports today for secure machine-to-machine communication, token security, and agent delegation.',
				}}
			/>

			{/* Overview Section */}
			<CollapsibleSection>
				<CollapsibleHeader onClick={() => toggleSection('overview')}>
					<h2>
						<FiInfo />
						Why AI Agents Need Advanced OAuth/OIDC Features
					</h2>
					<CollapsibleIcon isExpanded={expandedSections.overview} />
				</CollapsibleHeader>
				<CollapsibleContent $isOpen={expandedSections.overview}>
					<Card>
						<CardBody>
							<p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
								AI agents present unique challenges for identity and access management:
							</p>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>
									<strong>Autonomous Operation:</strong> AI agents often operate without direct user
									supervision, requiring robust machine-to-machine authentication
								</li>
								<li>
									<strong>Fine-Grained Permissions:</strong> Agents need specific, granular
									permissions to access resources and perform actions
								</li>
								<li>
									<strong>Token Security:</strong> Long-running agents require sender-constrained
									tokens to prevent theft and misuse
								</li>
								<li>
									<strong>Complex Authorization:</strong> Agents may need to express complex
									authorization requirements beyond simple scopes
								</li>
								<li>
									<strong>Delegation:</strong> Agents acting on behalf of users need secure
									delegation mechanisms
								</li>
							</ul>
						</CardBody>
					</Card>
				</CollapsibleContent>
			</CollapsibleSection>

			{/* Features Grid */}
			<CollapsibleSection>
				<CollapsibleHeader onClick={() => toggleSection('features')}>
					<h2>
						<FiShield />
						Key OAuth/OIDC Features for AI Agents
					</h2>
					<CollapsibleIcon isExpanded={expandedSections.features} />
				</CollapsibleHeader>
				<CollapsibleContent $isOpen={expandedSections.features}>
					<FeatureGrid>
						{features.map((feature) => (
							<FeatureCard
								key={feature.id}
								$supported={
									feature.status === 'supported'
										? true
										: feature.status === 'not-supported'
											? false
											: undefined
								}
							>
								<CardBody>
									<FeatureHeader>
										<FeatureTitle>
											<feature.icon size={24} />
											<h3>{feature.title}</h3>
										</FeatureTitle>
										<StatusBadge $status={feature.status}>
											{feature.status === 'supported' && <FiCheckCircle />}
											{feature.status === 'not-supported' && <FiX />}
											{feature.status === 'partial' && <FiAlertTriangle />}
											{feature.status === 'supported'
												? 'Supported'
												: feature.status === 'not-supported'
													? 'Not Supported'
													: 'Partial'}
										</StatusBadge>
									</FeatureHeader>

									<FeatureDescription>{feature.description}</FeatureDescription>

									<TechnicalDetails>
										<h4>Technical Details:</h4>
										<ul>
											{feature.technicalDetails.map((detail, idx) => (
												<li key={idx}>{detail}</li>
											))}
										</ul>
									</TechnicalDetails>

									<PingOneNote $type={feature.pingoneSupport.type}>
										<FiInfo />
										<div>
											<h4>{feature.pingoneSupport.title}</h4>
											<p>{feature.pingoneSupport.message}</p>
										</div>
									</PingOneNote>
								</CardBody>
							</FeatureCard>
						))}
					</FeatureGrid>
				</CollapsibleContent>
			</CollapsibleSection>

			{/* Comparison Table */}
			<CollapsibleSection>
				<CollapsibleHeader onClick={() => toggleSection('comparison')}>
					<h2>
						<FiServer />
						PingOne Support Summary
					</h2>
					<CollapsibleIcon isExpanded={expandedSections.comparison} />
				</CollapsibleHeader>
				<CollapsibleContent $isOpen={expandedSections.comparison}>
					<ComparisonSection>
						<CardBody>
							<ComparisonTable>
								<thead>
									<tr>
										<th>Feature</th>
										<th>RFC/Spec</th>
										<th>PingOne Status</th>
										<th>Alternative</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<strong>PAR</strong>
										</td>
										<td>RFC 9126</td>
										<td>
											<StatusBadge $status="supported">
												<FiCheckCircle />
												Supported
											</StatusBadge>
										</td>
										<td>-</td>
									</tr>
									<tr>
										<td>
											<strong>RAR</strong>
										</td>
										<td>RFC 9396</td>
										<td>
											<StatusBadge $status="not-supported">
												<FiX />
												Not Supported
											</StatusBadge>
										</td>
										<td>Use scopes or custom claims</td>
									</tr>
									<tr>
										<td>
											<strong>DPoP</strong>
										</td>
										<td>RFC 9449</td>
										<td>
											<StatusBadge $status="not-supported">
												<FiX />
												Not Supported
											</StatusBadge>
										</td>
										<td>Use mTLS or one-time refresh tokens</td>
									</tr>
									<tr>
										<td>
											<strong>mTLS</strong>
										</td>
										<td>RFC 8705</td>
										<td>
											<StatusBadge $status="partial">
												<FiAlertTriangle />
												Partial
											</StatusBadge>
										</td>
										<td>Client auth only, not token binding</td>
									</tr>
									<tr>
										<td>
											<strong>JAR</strong>
										</td>
										<td>RFC 9101</td>
										<td>
											<StatusBadge $status="supported">
												<FiCheckCircle />
												Supported
											</StatusBadge>
										</td>
										<td>-</td>
									</tr>
									<tr>
										<td>
											<strong>Client Credentials</strong>
										</td>
										<td>RFC 6749</td>
										<td>
											<StatusBadge $status="supported">
												<FiCheckCircle />
												Supported
											</StatusBadge>
										</td>
										<td>-</td>
									</tr>
									<tr>
										<td>
											<strong>Token Exchange</strong>
										</td>
										<td>RFC 8693</td>
										<td>
											<StatusBadge $status="not-supported">
												<FiX />
												Not Supported
											</StatusBadge>
										</td>
										<td>Use refresh tokens</td>
									</tr>
									<tr>
										<td>
											<strong>Device Code</strong>
										</td>
										<td>RFC 8628</td>
										<td>
											<StatusBadge $status="supported">
												<FiCheckCircle />
												Supported
											</StatusBadge>
										</td>
										<td>-</td>
									</tr>
								</tbody>
							</ComparisonTable>
						</CardBody>
					</ComparisonSection>
				</CollapsibleContent>
			</CollapsibleSection>

			{/* Recommendations */}
			<CollapsibleSection>
				<CollapsibleHeader onClick={() => toggleSection('recommendations')}>
					<h2>
						<FiCheckCircle />
						Recommendations for AI Agent Deployments with PingOne
					</h2>
					<CollapsibleIcon isExpanded={expandedSections.recommendations} />
				</CollapsibleHeader>
				<CollapsibleContent $isOpen={expandedSections.recommendations}>
					<Card>
						<CardBody>
							<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
								Current Best Practices:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '2rem' }}>
								<li>
									<strong>Use Client Credentials Grant:</strong> Primary flow for AI agents with
									private_key_jwt authentication for enhanced security
								</li>
								<li>
									<strong>Implement PAR:</strong> Use Pushed Authorization Requests for complex
									authorization scenarios
								</li>
								<li>
									<strong>Leverage JAR:</strong> Sign authorization requests with JWT for integrity
									protection
								</li>
								<li>
									<strong>Scope-Based Authorization:</strong> Use well-defined scopes until RAR
									becomes available
								</li>
								<li>
									<strong>Short-Lived Tokens:</strong> Implement short access token lifetimes with
									refresh token rotation
								</li>
								<li>
									<strong>Device Code for CLI:</strong> Use Device Authorization Grant for
									command-line AI tools
								</li>
							</ul>

							<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
								Future Considerations:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>Monitor PingOne roadmap for RAR, DPoP, and Token Exchange support</li>
								<li>Plan migration strategy when sender-constrained tokens become available</li>
								<li>Evaluate custom solutions for fine-grained authorization if RAR is critical</li>
								<li>
									Consider hybrid approaches combining PingOne with policy engines (e.g., OPA) for
									complex authorization
								</li>
							</ul>
						</CardBody>
					</Card>
				</CollapsibleContent>
			</CollapsibleSection>
		</Container>
	);
};

export default AIAgentOverview;
