import { useState } from 'react';
import {
	FiAlertTriangle,
	FiArrowRight,
	FiBookOpen,
	FiCheckCircle,
	FiCode,
	FiInfo,
	FiShield,
	FiTrendingUp,
	FiUsers,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../../components/Card';
import InteractiveFlowDiagram from '../../components/InteractiveFlowDiagram';
import { FlowHeader } from '../../services/flowHeaderService';
import FlowConfigurationTable from '../../components/FlowConfigurationTable';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { PageLayoutService } from '../../services/pageLayoutService';
import { FlowUIService } from '../../services/flowUIService';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FlowCard = styled(Card)`
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FlowIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;

  &.auth-code { background-color: #dbeafe; color: #1e40af; }
  &.implicit { background-color: #fef3c7; color: #d97706; }
  &.hybrid { background-color: #ecfdf5; color: #059669; }
  &.pkce { background-color: #f0fdf4; color: #16a34a; }
`;

const ConceptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const ConceptCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const SecuritySection = styled(Card)`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #cbd5e1;
`;

const _FlowDiagram = styled.div`
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
  font-family: monospace;
  font-size: 0.9rem;
  color: #374151;
`;

const RecommendationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background-color: #f8fafc;
    border-radius: 0.5rem;
    border-left: 3px solid ${({ theme }) => theme.colors.success};

    svg {
      color: ${({ theme }) => theme.colors.success};
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`;

const AIGeneratedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ComparisonTable = styled(Card)`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 2px solid #374151;
  color: white;
  margin: 2rem 0;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  h2 {
    color: white;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  svg {
    color: #60a5fa;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #374151;
  }
  
  th {
    background-color: #374151;
    color: #f9fafb;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  td {
    color: #e5e7eb;
    vertical-align: top;
  }
  
  tr:hover {
    background-color: rgba(55, 65, 81, 0.3);
  }
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  
  &.recommended {
    color: #10b981;
  }
  
  &.warning {
    color: #f59e0b;
  }
  
  svg {
    flex-shrink: 0;
  }
`;

const OIDCOverview = () => {
	const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
	
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1400px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'oidc-overview',
	};
	const { PageContainer, ContentWrapper, FlowHeader: LayoutFlowHeader } =
		PageLayoutService.createPageLayout(pageConfig);

	const oidcFlows = [
		{
			id: 'auth-code',
			title: 'Authorization Code Flow',
			description: 'Most secure flow for applications that can maintain a client secret securely',
			icon: FiShield,
			color: 'auth-code',
			details: 'User authenticates  Authorization Code  Token Exchange  ID Token + Access Token',
			security: 'High',
			useCase: 'Web applications, mobile apps with secure backend',
		},
		{
			id: 'implicit',
			title: 'Implicit Flow',
			description: 'Legacy flow for browser-based applications without secure backend',
			icon: FiAlertTriangle,
			color: 'implicit',
			details: 'User authenticates  ID Token + Access Token directly in redirect',
			security: 'Low (Deprecated)',
			useCase: 'Legacy browser applications (not recommended for new apps)',
		},
		{
			id: 'hybrid',
			title: 'Hybrid Flow',
			description: 'Combines Authorization Code and Implicit flows for flexibility',
			icon: FiCode,
			color: 'hybrid',
			details: 'User authenticates  ID Token + Authorization Code  Token Exchange',
			security: 'Medium-High',
			useCase: 'Applications needing immediate ID token and flexible token management',
		},
		{
			id: 'pkce',
			title: 'PKCE Enhanced Flow',
			description: 'Authorization Code with Proof Key for Code Exchange (PKCE)',
			icon: FiCheckCircle,
			color: 'pkce',
			details: 'Enhanced security for public clients without client secret',
			security: 'Very High',
			useCase: 'Mobile apps, SPAs, public clients',
		},
	];

	const oidcConcepts = [
		{
			title: 'ID Token',
			description:
				'JSON Web Token (JWT) signed by the OpenID Provider containing claims about user identity and authentication event.',
			icon: FiUsers,
			examples: [
				'sub (subject)',
				'name',
				'email',
				'email_verified',
				'iss (issuer)',
				'aud (audience)',
			],
		},
		{
			title: 'Relying Party (RP)',
			description:
				'The client application that requests and verifies the ID Token from the OpenID Provider.',
			icon: FiShield,
			examples: ['Web applications', 'Mobile apps', 'Single Page Apps', 'API services'],
		},
		{
			title: 'OpenID Provider (OP)',
			description:
				'The authorization server that authenticates users and issues ID Tokens and access tokens.',
			icon: FiBookOpen,
			examples: ['PingOne', 'Auth0', 'Okta', 'Azure AD', 'Google Identity'],
		},
		{
			title: 'Claims',
			description: 'Pieces of information about the end user included in the ID Token.',
			icon: FiInfo,
			examples: [
				'Standard claims (sub, name, email)',
				'Custom claims',
				'Verified claims',
				'Aggregated claims',
			],
		},
	];

	const flowComparison = [
		{
			flow: 'Authorization Code',
			tokens: 'ID + Access (+Refresh)',
			useCase: 'Web, mobile apps (PKCE)',
			security: { type: 'recommended', text: 'Recommended', icon: FiCheckCircle },
		},
		{
			flow: 'Implicit',
			tokens: 'ID + Access',
			useCase: 'Legacy SPAs',
			security: { type: 'warning', text: 'Deprecated', icon: FiAlertTriangle },
		},
		{
			flow: 'Hybrid',
			tokens: 'Code + ID + Access',
			useCase: 'Mixed web apps',
			security: { type: 'warning', text: 'Rare today', icon: FiAlertTriangle },
		},
		{
			flow: 'Client Credentials',
			tokens: 'Access only',
			useCase: 'Machine-to-machine',
			security: { type: 'recommended', text: 'No user context', icon: FiCheckCircle },
		},
		{
			flow: 'Device Code',
			tokens: 'ID + Access (+Refresh)',
			useCase: 'IoT, TVs, CLI tools',
			security: { type: 'recommended', text: 'Secure', icon: FiCheckCircle },
		},
		{
			flow: 'Refresh Token',
			tokens: 'New ID + Access',
			useCase: 'Long-lived sessions',
			security: { type: 'warning', text: 'Secure storage needed', icon: FiAlertTriangle },
		},
	];

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}
			<div style={{ marginBottom: '2rem' }}>
				<AIGeneratedBadge>AI-Generated Overview</AIGeneratedBadge>
			</div>

			{/* OIDC Flows Overview */}
			<section style={{ marginBottom: '3rem' }}>
				<h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}>
					OpenID Connect Authentication Flows
				</h2>

				<OverviewGrid>
					{oidcFlows.map((flow) => (
						<FlowCard key={flow.id}>
							<CardBody>
								<FlowIcon className={flow.color}>
									<flow.icon size={24} />
								</FlowIcon>
								<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
									{flow.title}
								</h3>
								<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
									{flow.description}
								</p>
								<div style={{ marginBottom: '1rem' }}>
									<strong style={{ fontSize: '0.875rem', color: '#374151' }}>Security:</strong>
									<span
										style={{
											marginLeft: '0.5rem',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.75rem',
											fontWeight: '500',
											backgroundColor:
												flow.security === 'Very High'
													? '#dcfce7'
													: flow.security === 'High'
														? '#dbeafe'
														: flow.security === 'Medium-High'
															? '#ecfdf5'
															: '#fef3c7',
											color:
												flow.security === 'Very High'
													? '#166534'
													: flow.security === 'High'
														? '#1e40af'
														: flow.security === 'Medium-High'
															? '#059669'
															: '#d97706',
										}}
									>
										{flow.security}
									</span>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
									<strong>Use Case:</strong> {flow.useCase}
								</div>
								<button
									onClick={() => setExpandedFlow(expandedFlow === flow.id ? null : flow.id)}
									style={{
										width: '100%',
										padding: '0.5rem',
										backgroundColor: 'transparent',
										border: '1px solid #d1d5db',
										borderRadius: '0.375rem',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										fontSize: '0.875rem',
									}}
								>
									{expandedFlow === flow.id ? 'Hide Details' : 'Show Details'}
									<FiArrowRight
										size={14}
										style={{
											transform: expandedFlow === flow.id ? 'rotate(90deg)' : 'rotate(0deg)',
											transition: 'transform 0.2s',
											marginLeft: '0.5rem',
										}}
									/>
								</button>
								{expandedFlow === flow.id && (
									<div
										style={{
											marginTop: '1rem',
											padding: '1rem',
											backgroundColor: '#f9fafb',
											borderRadius: '0.375rem',
										}}
									>
										<div
											style={{
												fontFamily: 'monospace',
												fontSize: '0.875rem',
												marginBottom: '0.5rem',
											}}
										>
											{flow.details}
										</div>
									</div>
								)}
							</CardBody>
						</FlowCard>
					))}
				</OverviewGrid>
			</section>

			{/* Quick Comparison Table */}
			<ComparisonTable>
				<CardBody>
					<TableHeader>
						<FiTrendingUp size={20} />
						<h2>Quick Comparison</h2>
					</TableHeader>

					<Table>
						<thead>
							<tr>
								<th>Flow</th>
								<th>Tokens Returned</th>
								<th>Use Case</th>
								<th>Security Notes</th>
							</tr>
						</thead>
						<tbody>
							{flowComparison.map((row, index) => (
								<tr key={index}>
									<td>
										<strong>{row.flow}</strong>
									</td>
									<td>{row.tokens}</td>
									<td>{row.useCase}</td>
									<td>
										<SecurityNote className={row.security.type}>
											<row.security.icon size={16} />
											{row.security.text}
										</SecurityNote>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</CardBody>
			</ComparisonTable>

			{/* Key OIDC Concepts */}
			<section style={{ marginBottom: '3rem' }}>
				<h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}>
					Key OpenID Connect Concepts
				</h2>

				<ConceptGrid>
					{oidcConcepts.map((concept, index) => (
						<ConceptCard key={index}>
							<CardBody>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										marginBottom: '1rem',
									}}
								>
									<concept.icon size={20} style={{ color: '#3b82f6' }} />
									<h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
										{concept.title}
									</h3>
								</div>
								<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
									{concept.description}
								</p>
								<div>
									<strong style={{ fontSize: '0.875rem', color: '#374151' }}>Examples:</strong>
									<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
										{concept.examples.map((example, idx) => (
											<li
												key={idx}
												style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}
											>
												{example}
											</li>
										))}
									</ul>
								</div>
							</CardBody>
						</ConceptCard>
					))}
				</ConceptGrid>
			</section>

			{/* Interactive Flow Diagrams */}
			<section style={{ marginBottom: '3rem' }}>
				<h2
					style={{
						fontSize: '2rem',
						fontWeight: '600',
						marginBottom: '2rem',
						color: '#1f2937',
						textAlign: 'center',
					}}
				>
					Interactive Flow Diagrams
				</h2>
				<p
					style={{
						textAlign: 'center',
						color: '#6b7280',
						marginBottom: '2rem',
						fontSize: '1.125rem',
					}}
				>
					Explore OAuth and OpenID Connect flows with interactive, step-by-step diagrams
				</p>
				<InteractiveFlowDiagram />
			</section>

			{/* Security Recommendations */}
			<SecuritySection>
				<CardHeader>
					<h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
						<FiShield size={24} />
						Security Recommendations
					</h2>
				</CardHeader>
				<CardBody>
					<p style={{ marginBottom: '1.5rem', color: '#6b7280', lineHeight: '1.6' }}>
						Following security best practices is crucial for protecting user data and maintaining
						trust. Here are the key recommendations for implementing OpenID Connect securely:
					</p>

					<RecommendationList>
						<li>
							<FiCheckCircle size={16} />
							<div>
								<strong>Use Authorization Code Flow with PKCE</strong>
								<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
									Always use PKCE for enhanced security, especially for public clients without
									client secrets.
								</p>
							</div>
						</li>
						<li>
							<FiCheckCircle size={16} />
							<div>
								<strong>Validate ID Tokens Properly</strong>
								<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
									Always validate issuer (iss), audience (aud), and expiration (exp) claims.
								</p>
							</div>
						</li>
						<li>
							<FiCheckCircle size={16} />
							<div>
								<strong>Use HTTPS Everywhere</strong>
								<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
									Never transmit tokens over HTTP - always use HTTPS for all OAuth/OIDC endpoints.
								</p>
							</div>
						</li>
						<li>
							<FiCheckCircle size={16} />
							<div>
								<strong>Implement Proper State Parameter</strong>
								<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
									Use cryptographically secure random state values to prevent CSRF attacks.
								</p>
							</div>
						</li>
						<li>
							<FiCheckCircle size={16} />
							<div>
								<strong>Regular Token Rotation</strong>
								<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
									Implement refresh token rotation and regular access token expiration.
								</p>
							</div>
						</li>
					</RecommendationList>
				</CardBody>
			</SecuritySection>

			{/* Implementation Notes */}
			<section
				style={{
					marginTop: '3rem',
					padding: '2rem',
					backgroundColor: '#f8fafc',
					borderRadius: '0.75rem',
				}}
			>
				<h2
					style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}
				>
					Implementation Notes
				</h2>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1.5rem',
					}}
				>
					<div>
						<h3
							style={{
								fontSize: '1.125rem',
								fontWeight: '600',
								marginBottom: '0.5rem',
								color: '#374151',
							}}
						>
							For Web Applications
						</h3>
						<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
							Use Authorization Code Flow with PKCE. Store tokens securely and implement proper
							logout flows.
						</p>
					</div>
					<div>
						<h3
							style={{
								fontSize: '1.125rem',
								fontWeight: '600',
								marginBottom: '0.5rem',
								color: '#374151',
							}}
						>
							For Mobile Applications
						</h3>
						<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
							Use Authorization Code Flow with PKCE. Implement secure token storage and certificate
							pinning.
						</p>
					</div>
					<div>
						<h3
							style={{
								fontSize: '1.125rem',
								fontWeight: '600',
								marginBottom: '0.5rem',
								color: '#374151',
							}}
						>
							For APIs
						</h3>
						<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
							Validate JWT tokens, implement proper scopes, and use refresh tokens for long-lived
							sessions.
						</p>
					</div>
				</div>
			</section>

			{/* Configuration Requirements Table */}
			<section style={{ marginTop: '3rem' }}>
				<FlowConfigurationTable />
			</section>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OIDCOverview;
