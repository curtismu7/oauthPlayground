// src/pages/docs/OAuthAndOIDCForAI.tsx
// Comprehensive OAuth 2.0 & OpenID Connect for AI/Agentic Systems Guide

import styled from 'styled-components';
import { SpecCard } from '../../components/SpecCard';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import {
	FiBookOpen,
	FiCode,
	FiCpu,
	FiExternalLink,
	FiLayers,
	FiShield,
	FiUsers,
} from '../../services/commonImportsService';
import { FlowHeader } from '../../services/flowHeaderService';
import { PageLayoutService } from '../../services/pageLayoutService';

const LinkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ExternalLink = styled.a`
  display: block;
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

const CompatibilityTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  }

  th {
    background: ${({ theme }) => theme.colors.gray100};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray800};
    border-bottom: 2px solid ${({ theme }) => theme.colors.gray300};
  }

  tr:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }

  .status-supported {
    color: #16a34a;
    font-weight: 600;
  }

  .status-partial {
    color: #f59e0b;
    font-weight: 600;
  }

  .status-not-supported {
    color: #dc2626;
    font-weight: 600;
  }

  .status-draft {
    color: #2563eb;
    font-weight: 600;
  }

  .status-proposed {
    color: #6b7280;
    font-weight: 600;
  }
`;

const StatusBadge = styled.span<{
	$status: 'supported' | 'partial' | 'not-supported' | 'draft' | 'proposed';
}>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${({ $status }) => {
		switch ($status) {
			case 'supported':
				return `
          background: rgba(22, 163, 74, 0.1);
          color: #16a34a;
        `;
			case 'partial':
				return `
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        `;
			case 'not-supported':
				return `
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
        `;
			case 'draft':
				return `
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        `;
			case 'proposed':
				return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        `;
		}
	}}
`;

const ReferenceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 2rem 0;

  li {
    margin-bottom: 0.5rem;
    line-height: 1.6;

    a {
      color: ${({ theme }) => theme.colors.primary};
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    &::before {
      content: "•";
      color: ${({ theme }) => theme.colors.primary};
      font-weight: bold;
      margin-right: 0.5rem;
    }
  }
`;

const SectionDivider = styled.div`
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #06b6d4 100%);
  margin: 3rem 0;
  border-radius: 2px;
`;

const OAuthAndOIDCForAI = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: false,
		showFooter: false,
		responsive: true,
	};
	const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader
					flowId="oauth-oidc-for-ai"
					customConfig={{
						flowType: 'documentation',
						title: 'OAuth 2.0 & OIDC for AI Systems',
						subtitle:
							'Comprehensive guide to securing AI agents and agentic systems with OAuth 2.0, OpenID Connect, and PingOne',
						icon: '🤖',
					}}
				/>

				{/* ========================================
				    SECTION 1: OAuth 2.0 for AI/Agents
				    ======================================== */}

				<div
					style={{
						background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						marginBottom: '2rem',
						color: 'white',
					}}
				>
					<h2
						style={{
							margin: '0 0 0.5rem 0',
							fontSize: '1.75rem',
							fontWeight: '700',
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
						}}
					>
						<FiShield size={32} />
						Part 1: OAuth 2.0 for AI & Agentic Systems
					</h2>
					<p style={{ margin: 0, fontSize: '1rem', opacity: 0.95 }}>
						OAuth 2.0 specifications, extensions, and PingOne compatibility for securing AI agents,
						multi-agent systems, and autonomous workflows
					</p>
				</div>

				<CollapsibleHeader
					title="Key OAuth 2.0 Specifications for AI"
					subtitle="Essential OAuth specs and extensions designed for AI agents, autonomous systems, and machine-to-machine authentication"
					icon={<FiCpu />}
					theme="blue"
					defaultCollapsed={false}
				>
					<CompatibilityTable>
						<thead>
							<tr>
								<th>Spec / Draft</th>
								<th>RFC / Draft ID</th>
								<th>Purpose for AI / Agents</th>
								<th>Status (IETF)</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<strong>OAuth 2.1 Core</strong>
								</td>
								<td>RFC 6749 + updates</td>
								<td>
									Modernized OAuth baseline with PKCE, redirect URI validation, and security best
									practices
								</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>JWT Bearer Assertion</strong>
								</td>
								<td>RFC 7523</td>
								<td>
									Key-based service authentication without client secrets - critical for AI agents
								</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Client Credentials Flow</strong>
								</td>
								<td>RFC 6749 §4.4</td>
								<td>
									Machine-to-machine authentication for AI model access and service-to-service calls
								</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Token Exchange</strong>
								</td>
								<td>RFC 8693</td>
								<td>Delegation and impersonation chains between AI agents and services</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Rich Authorization Requests (RAR)</strong>
								</td>
								<td>RFC 9396</td>
								<td>
									Structured, machine-readable authorization objects for fine-grained AI task
									permissions
								</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Pushed Authorization Requests (PAR)</strong>
								</td>
								<td>RFC 9126</td>
								<td>
									Secure pre-submission of authorization requests for redirect-less AI workflows
								</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>JWT-Secured Authorization Requests (JAR)</strong>
								</td>
								<td>RFC 9101</td>
								<td>Signed JWT request objects ensuring integrity in AI-to-AI authorization</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>DPoP (Proof of Possession)</strong>
								</td>
								<td>RFC 9449</td>
								<td>Token key-binding per agent instance for enhanced security</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Step-Up Authentication Challenge</strong>
								</td>
								<td>RFC 9470</td>
								<td>
									Contextual step-up for dynamic reauthentication when AI requires elevated
									permissions
								</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Device Authorization Flow</strong>
								</td>
								<td>RFC 8628</td>
								<td>OAuth for AI systems running on constrained or input-limited devices</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>GNAP (Grant Negotiation and Authorization Protocol)</strong>
								</td>
								<td>draft-ietf-gnap-core-protocol</td>
								<td>Next-generation dynamic delegation model for multi-agent negotiation</td>
								<td>
									<StatusBadge $status="draft">🧪 Draft</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Attestation-Based Client Authentication</strong>
								</td>
								<td>draft-ietf-oauth-attestation-based-client-auth</td>
								<td>Hardware/runtime-bound client attestation for trusted AI agent provenance</td>
								<td>
									<StatusBadge $status="draft">🧪 Draft</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Attestation-Based Token Binding</strong>
								</td>
								<td>draft-ietf-oauth-attestation-based-token-binding</td>
								<td>Token binding via secure enclave proofs for AI model endpoints</td>
								<td>
									<StatusBadge $status="draft">🧪 Draft</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Identity Federation for AI</strong>
								</td>
								<td>emerging</td>
								<td>Cross-organization AI model and agent federation (no canonical draft yet)</td>
								<td>
									<StatusBadge $status="proposed">🧩 Proposed</StatusBadge>
								</td>
							</tr>
						</tbody>
					</CompatibilityTable>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne OAuth Compatibility for AI"
					subtitle="Publicly verified PingOne support status for AI-relevant OAuth 2.0 features and implementation guidance"
					icon={<FiShield />}
					theme="green"
					defaultCollapsed={false}
				>
					<CompatibilityTable>
						<thead>
							<tr>
								<th>Spec / Feature</th>
								<th>PingOne Status</th>
								<th>Implementation / Simulation</th>
								<th>AI Use Case</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<strong>OAuth 2.1 Core</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>Default for all PingOne OAuth/OIDC applications</td>
								<td>Baseline for secure AI agent token issuance</td>
							</tr>
							<tr>
								<td>
									<strong>JWT Bearer (RFC 7523)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>
									Worker Apps using JWT assertion with <code>client_credentials</code> grant
								</td>
								<td>Key-based AI agent and service-to-service authentication</td>
							</tr>
							<tr>
								<td>
									<strong>Client Credentials Flow</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>Native support via Worker and Service app types</td>
								<td>Machine-to-machine auth for AI model APIs</td>
							</tr>
							<tr>
								<td>
									<strong>PAR (RFC 9126)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>
									<code>/as/par</code> endpoint available in PingOne Authorization API
								</td>
								<td>Redirect-less secure authorization for headless AI agents</td>
							</tr>
							<tr>
								<td>
									<strong>RAR (RFC 9396)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>Configurable via PingOne Authorize policies and SSO</td>
								<td>Fine-grained AI task permissions and context-specific consent</td>
							</tr>
							<tr>
								<td>
									<strong>Step-Up Authentication (RFC 9470)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>PingOne Protect adaptive MFA and risk-based policies</td>
								<td>Human-in-the-loop decisioning for high-risk AI actions</td>
							</tr>
							<tr>
								<td>
									<strong>Device Authorization (RFC 8628)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>Native device flow support in PingOne</td>
								<td>AI on IoT devices, smart home agents, edge computing</td>
							</tr>
							<tr>
								<td>
									<strong>Token Exchange (RFC 8693)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate using Worker tokens + token introspection</td>
								<td>Delegation chain between AI agents and downstream services</td>
							</tr>
							<tr>
								<td>
									<strong>DPoP (RFC 9449)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate via mTLS or custom key-bound claims</td>
								<td>Proof-of-possession for AI model endpoints and agent instances</td>
							</tr>
							<tr>
								<td>
									<strong>JAR (RFC 9101)</strong>
								</td>
								<td>
									<span className="status-partial">🔸 Partial via PAR</span>
								</td>
								<td>JAR semantics implied through signed PAR requests</td>
								<td>Secure request integrity for agent-to-agent authorization</td>
							</tr>
							<tr>
								<td>
									<strong>GNAP (draft)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate via PAR + RAR + PingOne DaVinci orchestration</td>
								<td>Dynamic multi-agent negotiation and delegation</td>
							</tr>
							<tr>
								<td>
									<strong>Attestation Auth / Binding</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate via mTLS + PingOne Protect device policies</td>
								<td>Trusted AI agent provenance and hardware-bound identity</td>
							</tr>
							<tr>
								<td>
									<strong>AI Federation (draft)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Not available in PingOne (emerging standard)</td>
								<td>Cross-tenant AI model orchestration and federation</td>
							</tr>
						</tbody>
					</CompatibilityTable>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne Components for AI Orchestration"
					subtitle="Relevant PingOne components and their OAuth capabilities for building AI-ready authentication flows"
					icon={<FiCode />}
					theme="yellow"
					defaultCollapsed={false}
				>
					<CompatibilityTable>
						<thead>
							<tr>
								<th>Component</th>
								<th>OAuth Capabilities</th>
								<th>AI-Oriented Use Case</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<strong>PingOne SSO</strong>
								</td>
								<td>OAuth 2.1, PKCE, PAR, RAR, JWT Bearer, Authorization Code Flow</td>
								<td>Secure multi-agent login orchestration and user context preservation</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne Protect</strong>
								</td>
								<td>Step-Up (RFC 9470), adaptive risk policies, contextual MFA</td>
								<td>Adaptive MFA for agent-triggered actions and risk-based AI decisioning</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne DaVinci</strong>
								</td>
								<td>Visual flow orchestration, conditional logic, API integrations</td>
								<td>Simulate GNAP-style dynamic authorization and multi-agent workflows</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne Authorize</strong>
								</td>
								<td>
									Policy-based authorization, RAR enforcement, attribute-based access control (ABAC)
								</td>
								<td>Structured consent for AI actions and fine-grained resource permissions</td>
							</tr>
							<tr>
								<td>
									<strong>Worker Apps</strong>
								</td>
								<td>JWT Bearer (RFC 7523), Client Credentials, service-to-service auth</td>
								<td>Non-interactive agent/service identity for AI model backends</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne Management APIs</strong>
								</td>
								<td>Full PAR/RAR endpoint compliance, token introspection, user management</td>
								<td>Redirect-less AI integration and programmatic agent provisioning</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne Credentials</strong>
								</td>
								<td>Verifiable credentials, decentralized identity (DID)</td>
								<td>Future: AI agent credentials and portable identity across systems</td>
							</tr>
						</tbody>
					</CompatibilityTable>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="OAuth Summary & AI Implementation Recommendations"
					subtitle="Key takeaways and implementation guidance for AI-ready OAuth 2.0 orchestration with PingOne"
					icon={<FiBookOpen />}
					theme="green"
					defaultCollapsed={false}
				>
					<SpecCard title="PingOne AI-Ready OAuth Features">
						<p>
							PingOne provides <strong>most foundational OAuth 2.0 capabilities</strong> for
							building <strong>AI-ready authentication and authorization systems</strong>,
							including:
						</p>
						<ul>
							<li>
								<strong>✅ JWT Bearer (RFC 7523)</strong> — Key-based authentication for AI agents
								without client secrets
							</li>
							<li>
								<strong>✅ Client Credentials Flow</strong> — Machine-to-machine auth for AI model
								APIs and service calls
							</li>
							<li>
								<strong>✅ PAR (RFC 9126) + RAR (RFC 9396)</strong> — Structured, redirect-less
								authorization with fine-grained permissions
							</li>
							<li>
								<strong>✅ Step-Up Authentication (RFC 9470)</strong> — Adaptive security via
								PingOne Protect for high-risk AI actions
							</li>
							<li>
								<strong>✅ Device Authorization (RFC 8628)</strong> — OAuth for AI systems on
								constrained IoT and edge devices
							</li>
						</ul>

						<p style={{ marginTop: '1.5rem' }}>
							Features such as <strong>Token Exchange (RFC 8693)</strong>,{' '}
							<strong>DPoP (RFC 9449)</strong>, and <strong>GNAP (draft)</strong> are{' '}
							<strong>not publicly supported</strong>, but can be <strong>safely simulated</strong>{' '}
							using:
						</p>
						<ul>
							<li>
								<strong>Worker tokens + introspection</strong> for delegation chains
							</li>
							<li>
								<strong>mTLS or key-bound claims</strong> for proof-of-possession
							</li>
							<li>
								<strong>PAR + RAR + PingOne DaVinci</strong> for GNAP-style dynamic authorization
							</li>
						</ul>

						<p
							style={{
								marginTop: '1.5rem',
								padding: '1rem',
								background: '#fef3c7',
								borderLeft: '4px solid #f59e0b',
								borderRadius: '0.5rem',
							}}
						>
							<strong>💡 Pro Tip:</strong> For production AI systems, prioritize{' '}
							<strong>JWT Bearer</strong> for agent identity, <strong>RAR</strong> for structured
							permissions, and <strong>PingOne Protect</strong> for adaptive risk-based security.
							Use <strong>DaVinci</strong> to orchestrate complex multi-agent workflows.
						</p>
					</SpecCard>
				</CollapsibleHeader>

				<SectionDivider />

				{/* ========================================
				    SECTION 2: OIDC for AI/Agents
				    ======================================== */}

				<div
					style={{
						background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						marginBottom: '2rem',
						color: 'white',
					}}
				>
					<h2
						style={{
							margin: '0 0 0.5rem 0',
							fontSize: '1.75rem',
							fontWeight: '700',
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
						}}
					>
						<FiLayers size={32} />
						Part 2: OpenID Connect (OIDC) for AI Systems
					</h2>
					<p style={{ margin: 0, fontSize: '1rem', opacity: 0.95 }}>
						Identity layer, user authentication patterns, and AI-specific authentication flows built
						on OAuth 2.0
					</p>
				</div>

				<CollapsibleHeader
					title="AI Authentication Fundamentals"
					subtitle="Understanding how AI systems authenticate, preserve user context, and manage identity throughout the AI processing pipeline"
					icon={<FiUsers />}
					theme="blue"
					defaultCollapsed={false}
				>
					<SpecCard title="Core AI Authentication Concepts">
						<p>
							AI systems require unique authentication patterns to establish identity, preserve user
							context, and maintain secure access throughout complex processing pipelines:
						</p>
						<ul>
							<li>
								<strong>🤖 AI Agent Identity:</strong> How autonomous AI systems establish their own
								identity, prove they are authorized to act, and distinguish themselves from other
								agents
							</li>
							<li>
								<strong>👤 User Context Preservation:</strong> Maintaining the original user's
								identity, permissions, and consent throughout the AI processing pipeline, even
								across multiple service boundaries
							</li>
							<li>
								<strong>🔗 Service-to-Service Authentication:</strong> AI systems authenticating
								with other services, APIs, and downstream systems while preserving security context
							</li>
							<li>
								<strong>🎭 Delegated Authorization:</strong> AI agents acting on behalf of users
								with appropriate scoped permissions, ensuring the principle of least privilege
							</li>
							<li>
								<strong>⏱️ Token Lifecycle Management:</strong> Managing authentication tokens for
								long-running AI processes, batch jobs, and asynchronous workflows without token
								expiration issues
							</li>
							<li>
								<strong>🔐 Multi-Tenancy & Isolation:</strong> Ensuring proper isolation between
								different AI agents, user contexts, and organizational boundaries
							</li>
						</ul>
					</SpecCard>

					<SpecCard title="OAuth vs OIDC for AI: When to Use Which">
						<p>
							Understanding the difference between OAuth 2.0 and OpenID Connect is critical for AI
							system design:
						</p>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '1rem',
								marginTop: '1rem',
							}}
						>
							<div
								style={{
									padding: '1rem',
									background: '#f0f9ff',
									border: '2px solid #3b82f6',
									borderRadius: '0.5rem',
								}}
							>
								<h4 style={{ color: '#1e40af', marginTop: 0 }}>🔵 Use OAuth 2.0 When:</h4>
								<ul style={{ marginBottom: 0, paddingLeft: '1.25rem' }}>
									<li>AI needs access to resources/APIs</li>
									<li>Service-to-service authentication</li>
									<li>Authorization without identity needed</li>
									<li>AI model backend access</li>
									<li>Machine-to-machine workflows</li>
								</ul>
							</div>

							<div
								style={{
									padding: '1rem',
									background: '#eff6ff',
									border: '2px solid #2563eb',
									borderRadius: '0.5rem',
								}}
							>
								<h4 style={{ color: '#6b21a8', marginTop: 0 }}>🟣 Use OIDC When:</h4>
								<ul style={{ marginBottom: 0, paddingLeft: '1.25rem' }}>
									<li>AI needs to know WHO the user is</li>
									<li>User profile/attributes required</li>
									<li>SSO for AI applications</li>
									<li>User consent and permissions</li>
									<li>Personalized AI experiences</li>
								</ul>
							</div>
						</div>
					</SpecCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI Authentication Flow Patterns"
					subtitle="Common OAuth 2.0 and OIDC flows used in AI applications, when to use each, and implementation examples"
					icon={<FiCode />}
					theme="yellow"
					defaultCollapsed={false}
				>
					<SpecCard title="OAuth/OIDC Flow Selection for AI Systems">
						<p>
							Choose the right authentication flow based on your AI system's architecture and use
							case:
						</p>

						<CompatibilityTable>
							<thead>
								<tr>
									<th>Flow</th>
									<th>When to Use</th>
									<th>AI Use Case</th>
									<th>Security Level</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										<strong>Client Credentials</strong>
									</td>
									<td>Service-to-service, no user context</td>
									<td>AI model backend access, batch processing, scheduled AI jobs</td>
									<td>
										<span style={{ color: '#16a34a' }}>🟢 High</span>
									</td>
								</tr>
								<tr>
									<td>
										<strong>Authorization Code + PKCE</strong>
									</td>
									<td>AI needs to act on behalf of user</td>
									<td>
										Personal AI assistants, user-facing chatbots, AI agents with user permissions
									</td>
									<td>
										<span style={{ color: '#16a34a' }}>🟢 High</span>
									</td>
								</tr>
								<tr>
									<td>
										<strong>Device Authorization</strong>
									</td>
									<td>AI on constrained devices (no browser)</td>
									<td>IoT AI agents, smart home devices, edge AI systems, voice assistants</td>
									<td>
										<span style={{ color: '#16a34a' }}>🟢 High</span>
									</td>
								</tr>
								<tr>
									<td>
										<strong>JWT Bearer Token</strong>
									</td>
									<td>AI already has JWT from another system</td>
									<td>Federated AI systems, cross-domain AI agents, JWT-based service mesh</td>
									<td>
										<span style={{ color: '#16a34a' }}>🟢 High</span>
									</td>
								</tr>
								<tr>
									<td>
										<strong>Token Exchange (RFC 8693)</strong>
									</td>
									<td>Multi-agent delegation chains</td>
									<td>AI agent passing context to downstream agents, impersonation flows</td>
									<td>
										<span style={{ color: '#f59e0b' }}>🟡 Medium (if simulated)</span>
									</td>
								</tr>
								<tr>
									<td>
										<strong>Implicit Flow</strong>
									</td>
									<td>⚠️ DEPRECATED - Do not use</td>
									<td>Not recommended for AI systems (insecure)</td>
									<td>
										<span style={{ color: '#dc2626' }}>🔴 Low</span>
									</td>
								</tr>
								<tr>
									<td>
										<strong>Resource Owner Password</strong>
									</td>
									<td>⚠️ Legacy only - avoid if possible</td>
									<td>Only for legacy AI system migrations (use Client Credentials instead)</td>
									<td>
										<span style={{ color: '#dc2626' }}>🔴 Low</span>
									</td>
								</tr>
							</tbody>
						</CompatibilityTable>
					</SpecCard>

					<SpecCard title="AI Token Exchange Pattern (RFC 8693)">
						<p>
							Token Exchange enables AI agents to exchange one token for another, preserving user
							context across service boundaries:
						</p>
						<pre
							style={{
								background: '#f8f9fa',
								padding: '1rem',
								borderRadius: '0.5rem',
								fontSize: '0.875rem',
								overflow: 'auto',
							}}
						>
							{`// AI Agent Token Exchange Request
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=user_access_token_from_frontend
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&actor_token=ai_agent_service_token
&actor_token_type=urn:ietf:params:oauth:token-type:access_token
&scope=downstream_api:access ai:generate
&requested_token_type=urn:ietf:params:oauth:token-type:access_token
&audience=https://ai-model-backend.example.com
&resource=https://api.example.com/user-data`}
						</pre>
						<p
							style={{
								marginTop: '1rem',
								fontSize: '0.9rem',
								color: '#6b7280',
								fontStyle: 'italic',
							}}
						>
							⚠️ <strong>Note:</strong> PingOne does not natively support RFC 8693. Simulate using
							Worker tokens + introspection or custom delegation logic in PingOne DaVinci.
						</p>
					</SpecCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI-Specific OAuth Scopes & Permissions"
					subtitle="Specialized OAuth scopes designed for AI applications, with examples of fine-grained access control for AI agents"
					icon={<FiShield />}
					theme="green"
					defaultCollapsed={false}
				>
					<SpecCard title="Recommended AI OAuth Scopes">
						<p>
							Define clear, purpose-limited scopes for AI operations to implement the principle of
							least privilege:
						</p>

						<CompatibilityTable>
							<thead>
								<tr>
									<th>Scope</th>
									<th>Permission Level</th>
									<th>Use Case</th>
									<th>Risk Level</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										<code>ai:read</code>
									</td>
									<td>Read-only access to user data</td>
									<td>AI can read user data for inference, analysis, and recommendations</td>
									<td>
										<span style={{ color: '#16a34a' }}>🟢 Low</span>
									</td>
								</tr>
								<tr>
									<td>
										<code>ai:analyze</code>
									</td>
									<td>Analyze patterns in user data</td>
									<td>AI can detect patterns, anomalies, and insights without storing data</td>
									<td>
										<span style={{ color: '#16a34a' }}>🟢 Low</span>
									</td>
								</tr>
								<tr>
									<td>
										<code>ai:generate</code>
									</td>
									<td>Generate content using user context</td>
									<td>AI can create text, images, code, or other content based on user input</td>
									<td>
										<span style={{ color: '#f59e0b' }}>🟡 Medium</span>
									</td>
								</tr>
								<tr>
									<td>
										<code>ai:personalize</code>
									</td>
									<td>Store preferences for personalization</td>
									<td>AI can save user preferences, history, and personalization settings</td>
									<td>
										<span style={{ color: '#f59e0b' }}>🟡 Medium</span>
									</td>
								</tr>
								<tr>
									<td>
										<code>ai:train</code>
									</td>
									<td>Use data for model training</td>
									<td>
										AI can use data to improve models (requires explicit consent and privacy
										controls)
									</td>
									<td>
										<span style={{ color: '#dc2626' }}>🔴 High</span>
									</td>
								</tr>
								<tr>
									<td>
										<code>ai:share_insights</code>
									</td>
									<td>Share anonymized insights</td>
									<td>
										AI can share aggregated, anonymized insights with third parties (requires
										consent)
									</td>
									<td>
										<span style={{ color: '#dc2626' }}>🔴 High</span>
									</td>
								</tr>
								<tr>
									<td>
										<code>ai:execute_actions</code>
									</td>
									<td>Perform actions on behalf of user</td>
									<td>AI can send emails, make purchases, modify data, or trigger workflows</td>
									<td>
										<span style={{ color: '#dc2626' }}>🔴 High</span>
									</td>
								</tr>
							</tbody>
						</CompatibilityTable>

						<p
							style={{
								marginTop: '1.5rem',
								padding: '1rem',
								background: '#fef2f2',
								borderLeft: '4px solid #dc2626',
								borderRadius: '0.5rem',
							}}
						>
							<strong>🚨 Security Best Practice:</strong> Always use <strong>RAR (RFC 9396)</strong>{' '}
							with AI scopes to provide structured, auditable authorization requests. Include
							context like <code>purpose</code>, <code>duration</code>, and{' '}
							<code>data_categories</code> in RAR objects.
						</p>
					</SpecCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Privacy-Preserving AI Authentication"
					subtitle="Advanced authentication techniques that protect user privacy while enabling AI functionality"
					icon={<FiShield />}
					theme="blue"
					defaultCollapsed={false}
				>
					<SpecCard title="Privacy-Enhancing Technologies for AI Auth">
						<p>
							Emerging techniques that allow AI to verify user attributes and process data without
							exposing sensitive information:
						</p>
						<ul>
							<li>
								<strong>🔒 Zero-Knowledge Proofs (ZKP):</strong> Allow AI to verify user attributes
								(e.g., age &gt; 18, member of group) without learning the actual values. Useful for
								compliance and privacy-preserving authorization.
							</li>
							<li>
								<strong>🤝 Federated Learning Credentials:</strong> Authenticate AI model
								contributions without revealing individual training data sources. Enables
								collaborative AI while preserving data sovereignty.
							</li>
							<li>
								<strong>📊 Differential Privacy Tokens:</strong> OAuth tokens that encode privacy
								budgets, limiting how much information AI queries can extract from datasets over
								time.
							</li>
							<li>
								<strong>🔐 Homomorphic Encryption:</strong> Process encrypted data in AI models
								without decryption, ensuring data remains protected throughout the AI pipeline.
							</li>
							<li>
								<strong>🤐 Secure Multi-Party Computation (SMPC):</strong> Multiple AI agents
								collaborate on computations without sharing their underlying data with each other.
							</li>
							<li>
								<strong>🏷️ Verifiable Credentials (W3C VC):</strong> Portable, cryptographically
								verifiable identity attributes that AI can verify without contacting the issuer
								(future PingOne Credentials integration).
							</li>
						</ul>
						<p
							style={{
								marginTop: '1rem',
								fontSize: '0.9rem',
								color: '#6b7280',
								fontStyle: 'italic',
							}}
						>
							💡 <strong>PingOne Roadmap:</strong> PingOne Credentials is exploring W3C Verifiable
							Credentials for decentralized identity, which will be valuable for AI agent identity
							and portable user attributes.
						</p>
					</SpecCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Multi-Modal AI Authentication Patterns"
					subtitle="Authentication strategies for AI systems that process multiple data types (text, images, audio, video)"
					icon={<FiCpu />}
					theme="yellow"
					defaultCollapsed={false}
				>
					<SpecCard title="Authentication for Multi-Modal AI Systems">
						<p>
							AI systems processing multiple data modalities require careful scope and permission
							design:
						</p>

						<CompatibilityTable>
							<thead>
								<tr>
									<th>Data Type</th>
									<th>Recommended Scopes</th>
									<th>Privacy Considerations</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										<strong>📄 Text Processing</strong>
									</td>
									<td>
										<code>ai:read:text</code>, <code>ai:analyze:text</code>
									</td>
									<td>Messages, documents, emails, chat history — PII detection required</td>
								</tr>
								<tr>
									<td>
										<strong>🖼️ Image Analysis</strong>
									</td>
									<td>
										<code>ai:read:images</code>, <code>ai:analyze:images</code>
									</td>
									<td>
										Photos, diagrams, screenshots — facial recognition consent, BIPA compliance
									</td>
								</tr>
								<tr>
									<td>
										<strong>🎵 Audio Processing</strong>
									</td>
									<td>
										<code>ai:read:audio</code>, <code>ai:transcribe:audio</code>
									</td>
									<td>Voice recordings, music — biometric voice data, consent for recording</td>
								</tr>
								<tr>
									<td>
										<strong>🎥 Video Analysis</strong>
									</td>
									<td>
										<code>ai:read:video</code>, <code>ai:analyze:video</code>
									</td>
									<td>Video calls, recordings — consent for recording, facial recognition, GDPR</td>
								</tr>
								<tr>
									<td>
										<strong>📊 Structured Data</strong>
									</td>
									<td>
										<code>ai:read:database</code>, <code>ai:query:data</code>
									</td>
									<td>Databases, spreadsheets, APIs — data minimization, access logging</td>
								</tr>
								<tr>
									<td>
										<strong>📡 Real-time Streams</strong>
									</td>
									<td>
										<code>ai:subscribe:stream</code>, <code>ai:process:realtime</code>
									</td>
									<td>Sensor data, live feeds, IoT — continuous consent, data retention limits</td>
								</tr>
							</tbody>
						</CompatibilityTable>

						<p
							style={{
								marginTop: '1.5rem',
								padding: '1rem',
								background: '#fef3c7',
								borderLeft: '4px solid #f59e0b',
								borderRadius: '0.5rem',
							}}
						>
							<strong>💡 Best Practice:</strong> Use{' '}
							<strong>Rich Authorization Requests (RAR)</strong> to specify not just the data type,
							but also the <strong>purpose</strong>, <strong>retention period</strong>, and{' '}
							<strong>allowed operations</strong> (e.g., "analyze images for product
							recommendations, retain for 30 days, no training use").
						</p>
					</SpecCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="AI Security & Compliance Best Practices"
					subtitle="Critical security considerations, audit requirements, and regulatory compliance for AI authentication"
					icon={<FiShield />}
					theme="green"
					defaultCollapsed={false}
				>
					<SpecCard title="Security Best Practices for AI Authentication">
						<p>Essential security controls for AI systems using OAuth 2.0 and OIDC:</p>
						<ul>
							<li>
								<strong>✅ Input Validation:</strong> Implement proper input validation and
								sanitization for all AI inputs to prevent prompt injection, jailbreaks, and
								adversarial attacks
							</li>
							<li>
								<strong>🔐 Secure Token Storage:</strong> Use encryption at rest and in transit for
								all AI agent tokens; leverage hardware security modules (HSM) or secure enclaves for
								production
							</li>
							<li>
								<strong>⏱️ Rate Limiting:</strong> Implement rate limiting and abuse prevention for
								AI API calls to prevent DoS, token exhaustion, and cost abuse
							</li>
							<li>
								<strong>🚨 Error Handling:</strong> Ensure proper error handling without information
								leakage; avoid exposing internal system details in AI error messages
							</li>
							<li>
								<strong>🔒 HTTPS Everywhere:</strong> Use HTTPS/TLS 1.3 for all AI communications;
								implement certificate pinning for high-security environments
							</li>
							<li>
								<strong>⏰ Session Management:</strong> Implement proper session management, timeout
								policies, and token refresh for long-running AI processes
							</li>
							<li>
								<strong>🔍 Security Audits:</strong> Regular security audits of AI authentication
								flows, penetration testing, and red team exercises
							</li>
							<li>
								<strong>📊 Anomaly Detection:</strong> Monitor for unusual AI behavior patterns,
								unexpected token usage, and potential compromise indicators
							</li>
							<li>
								<strong>🎯 Least Privilege:</strong> AI agents should request only the minimum
								necessary scopes and permissions for their task
							</li>
							<li>
								<strong>🔁 Token Rotation:</strong> Implement automatic token rotation for AI
								agents; revoke and reissue tokens on security events
							</li>
						</ul>
					</SpecCard>

					<SpecCard title="AI Compliance and Audit Requirements">
						<p>
							Ensuring AI operations are properly logged, auditable, and compliant with regulations:
						</p>
						<ul>
							<li>
								<strong>📝 Comprehensive Logging:</strong> Log all AI authentication events with
								timestamps, user context, agent identity, and action details
							</li>
							<li>
								<strong>🔍 Audit Trails:</strong> Maintain tamper-evident audit trails for AI model
								access, data processing, and permission grants
							</li>
							<li>
								<strong>📦 Data Retention:</strong> Implement data retention policies for AI
								training data, logs, and user interactions (comply with GDPR, CCPA)
							</li>
							<li>
								<strong>✅ GDPR Compliance:</strong> Right to access, right to be forgotten, data
								portability, and consent management for AI data processing
							</li>
							<li>
								<strong>📋 CCPA Compliance:</strong> California privacy rights including opt-out of
								AI training, data sale disclosure, and deletion requests
							</li>
							<li>
								<strong>🏥 HIPAA Compliance:</strong> For healthcare AI: PHI protection, access
								controls, audit logs, and business associate agreements
							</li>
							<li>
								<strong>💳 PCI DSS Compliance:</strong> For payment-related AI: cardholder data
								protection, access controls, and security testing
							</li>
							<li>
								<strong>🤝 User Consent:</strong> Explicit, informed consent management for AI data
								processing, training use, and third-party sharing
							</li>
							<li>
								<strong>📊 Data Minimization:</strong> Collect and process only the minimum
								necessary data for AI operations (GDPR principle)
							</li>
							<li>
								<strong>🎯 Purpose Limitation:</strong> Use data only for the specific purposes
								disclosed to and consented by users
							</li>
							<li>
								<strong>🔒 Data Security:</strong> Implement appropriate technical and
								organizational measures to protect AI data
							</li>
							<li>
								<strong>📢 Breach Notification:</strong> Procedures for notifying users and
								regulators in case of AI data breaches
							</li>
						</ul>
					</SpecCard>
				</CollapsibleHeader>

				<SectionDivider />

				{/* ========================================
				    SECTION 3: Industry Resources & RFC References
				    ======================================== */}

				<CollapsibleHeader
					title="Industry Resources & Guides"
					subtitle="Comprehensive guides, vendor documentation, and best practices from leading identity providers"
					icon={<FiBookOpen />}
					theme="blue"
					defaultCollapsed={true}
				>
					<LinkGrid>
						<ExternalLink
							href="https://www.pingidentity.com/en/resources/identity-fundamentals/agentic-ai.html"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								Ping Identity - Agentic AI & OAuth
								<FiExternalLink size={16} />
							</h3>
							<p>
								Comprehensive guide on implementing OAuth 2.0 and OpenID Connect for AI
								applications, agentic systems, and autonomous agents from Ping Identity.
							</p>
						</ExternalLink>

						<ExternalLink
							href="https://openid.net/connect/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								OpenID Foundation - Connect
								<FiExternalLink size={16} />
							</h3>
							<p>
								Official OpenID Connect resources, specifications, and certification programs from
								the OpenID Foundation.
							</p>
						</ExternalLink>

						<ExternalLink
							href="https://auth0.com/blog/oauth-2-0-and-openid-connect-for-ai-applications/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								Auth0 - OAuth 2.0 for AI Applications
								<FiExternalLink size={16} />
							</h3>
							<p>
								Best practices and implementation patterns for securing AI applications with OAuth
								2.0 and OpenID Connect from Okta/Auth0.
							</p>
						</ExternalLink>

						<ExternalLink
							href="https://learn.microsoft.com/en-us/azure/ai-services/authentication"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								Microsoft Azure AI - Authentication
								<FiExternalLink size={16} />
							</h3>
							<p>
								Microsoft's comprehensive guide to authentication and authorization for AI services,
								including OAuth 2.0, API keys, and Azure AD integration.
							</p>
						</ExternalLink>

						<ExternalLink
							href="https://developers.google.com/identity/protocols/oauth2"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								Google OAuth 2.0 for AI
								<FiExternalLink size={16} />
							</h3>
							<p>
								Google's implementation guide for OAuth 2.0 in AI and machine learning applications,
								including best practices for service accounts and user consent.
							</p>
						</ExternalLink>

						<ExternalLink
							href="https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								Microsoft Azure AD - Client Credentials
								<FiExternalLink size={16} />
							</h3>
							<p>
								Microsoft's guide for implementing client credentials flow for service-to-service
								authentication in AI applications and daemon processes.
							</p>
						</ExternalLink>

						<ExternalLink
							href="https://aws.amazon.com/blogs/security/how-to-use-oauth-2-0-to-access-aws-apis-from-an-application/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3>
								AWS - OAuth 2.0 for API Access
								<FiExternalLink size={16} />
							</h3>
							<p>
								AWS implementation patterns for OAuth 2.0 in cloud-based AI applications, including
								IAM integration and API Gateway security.
							</p>
						</ExternalLink>
					</LinkGrid>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="OAuth & OIDC RFC References"
					subtitle="Complete list of OAuth 2.0 and OpenID Connect specifications, RFCs, and drafts relevant to AI systems"
					icon={<FiExternalLink />}
					theme="yellow"
					defaultCollapsed={true}
				>
					<div style={{ margin: '2rem 0' }}>
						<h3
							style={{
								color: '#1e40af',
								marginBottom: '1rem',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							Core OAuth 2.0 Specifications
						</h3>
						<ReferenceList>
							<li>
								<strong>OAuth 2.0 Authorization Framework</strong> — RFC 6749:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc6749"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc6749
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 Authorization Server Metadata</strong> — RFC 8414:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc8414"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc8414
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 for Native Apps</strong> — RFC 8252:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc8252"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc8252
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 PKCE (Proof Key for Code Exchange)</strong> — RFC 7636:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc7636"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc7636
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 Mutual-TLS Client Authentication</strong> — RFC 8705:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc8705"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc8705
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 Authorization Server Issuer Identification</strong> — RFC 9207:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc9207"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc9207
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 Device Authorization Grant</strong> — RFC 8628:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc8628"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc8628
								</a>
							</li>
						</ReferenceList>

						<h3
							style={{
								color: '#1e40af',
								marginTop: '2rem',
								marginBottom: '1rem',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							AI-Relevant OAuth Extensions
						</h3>
						<ReferenceList>
							<li>
								<strong>JWT Bearer Token / Assertion Grant</strong> — RFC 7523:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc7523"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc7523
								</a>
							</li>
							<li>
								<strong>Token Exchange</strong> — RFC 8693:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc8693"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc8693
								</a>
							</li>
							<li>
								<strong>Rich Authorization Requests (RAR)</strong> — RFC 9396:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc9396"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc9396
								</a>
							</li>
							<li>
								<strong>JWT-Secured Authorization Request (JAR)</strong> — RFC 9101:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc9101"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc9101
								</a>
							</li>
							<li>
								<strong>Pushed Authorization Requests (PAR)</strong> — RFC 9126:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc9126"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc9126
								</a>
							</li>
							<li>
								<strong>Demonstrating Proof-of-Possession (DPoP)</strong> — RFC 9449:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc9449"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc9449
								</a>
							</li>
							<li>
								<strong>OAuth 2.0 Step-up Authentication Challenge</strong> — RFC 9470:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc9470"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc9470
								</a>
							</li>
						</ReferenceList>

						<h3
							style={{
								color: '#2563eb',
								marginTop: '2rem',
								marginBottom: '1rem',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							OpenID Connect (OIDC) Specifications
						</h3>
						<ReferenceList>
							<li>
								<strong>OpenID Connect Core 1.0</strong>:{' '}
								<a
									href="https://openid.net/specs/openid-connect-core-1_0.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									openid.net/specs/openid-connect-core-1_0.html
								</a>
							</li>
							<li>
								<strong>OpenID Connect Discovery 1.0</strong>:{' '}
								<a
									href="https://openid.net/specs/openid-connect-discovery-1_0.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									openid.net/specs/openid-connect-discovery-1_0.html
								</a>
							</li>
							<li>
								<strong>OpenID Connect Dynamic Client Registration 1.0</strong>:{' '}
								<a
									href="https://openid.net/specs/openid-connect-registration-1_0.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									openid.net/specs/openid-connect-registration-1_0.html
								</a>
							</li>
							<li>
								<strong>JSON Web Token (JWT)</strong> — RFC 7519:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc7519"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc7519
								</a>
							</li>
							<li>
								<strong>JSON Web Signature (JWS)</strong> — RFC 7515:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc7515"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc7515
								</a>
							</li>
							<li>
								<strong>JSON Web Encryption (JWE)</strong> — RFC 7516:{' '}
								<a
									href="https://www.rfc-editor.org/rfc/rfc7516"
									target="_blank"
									rel="noopener noreferrer"
								>
									rfc-editor.org/rfc/rfc7516
								</a>
							</li>
						</ReferenceList>

						<h3
							style={{
								color: '#dc2626',
								marginTop: '2rem',
								marginBottom: '1rem',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							Emerging Standards & Drafts
						</h3>
						<ReferenceList>
							<li>
								<strong>GNAP Core Protocol</strong> — draft-ietf-gnap-core-protocol:{' '}
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-gnap-core-protocol/"
									target="_blank"
									rel="noopener noreferrer"
								>
									datatracker.ietf.org/doc/draft-ietf-gnap-core-protocol/
								</a>
							</li>
							<li>
								<strong>GNAP Resource Servers</strong> — draft-ietf-gnap-resource-servers:{' '}
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-gnap-resource-servers/"
									target="_blank"
									rel="noopener noreferrer"
								>
									datatracker.ietf.org/doc/draft-ietf-gnap-resource-servers/
								</a>
							</li>
							<li>
								<strong>Attestation-Based Client Authentication</strong> —
								draft-ietf-oauth-attestation-based-client-auth:{' '}
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/"
									target="_blank"
									rel="noopener noreferrer"
								>
									datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/
								</a>
							</li>
							<li>
								<strong>Attestation-Based Token Binding</strong> —
								draft-ietf-oauth-attestation-based-token-binding:{' '}
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-token-binding/"
									target="_blank"
									rel="noopener noreferrer"
								>
									datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-token-binding/
								</a>
							</li>
						</ReferenceList>

						<p
							style={{
								marginTop: '2rem',
								fontSize: '0.9rem',
								color: '#6b7280',
								fontStyle: 'italic',
							}}
						>
							* "Identity Federation for AI" is an emerging area without a single canonical draft.
							Monitor the{' '}
							<a
								href="https://datatracker.ietf.org/group/oauth/documents/"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: '#3b82f6' }}
							>
								OAuth Working Group
							</a>{' '}
							and{' '}
							<a
								href="https://datatracker.ietf.org/group/gnap/documents/"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: '#3b82f6' }}
							>
								GNAP Working Group
							</a>{' '}
							for new specifications.
						</p>
					</div>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OAuthAndOIDCForAI;
