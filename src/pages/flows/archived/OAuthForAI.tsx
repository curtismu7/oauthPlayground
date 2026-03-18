import styled from 'styled-components';
import { SpecCard } from '../../components/SpecCard';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import { PageLayoutService } from '../../services/pageLayoutService';

const _DocsContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1.5rem;
`;

const _Section = styled.section`
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

const CompatibilityTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 2rem 0;
	background: white;
	border-radius: 0.5rem;
	overflow: hidden;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

	th,
	td {
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
		background: ${({ theme }) => theme.colors.gray50};
	}

	.status-supported {
		color: V9_COLORS.PRIMARY.GREEN_DARK;
		font-weight: 600;
	}

	.status-partial {
		color: V9_COLORS.PRIMARY.YELLOW;
		font-weight: 600;
	}

	.status-not-supported {
		color: V9_COLORS.PRIMARY.RED_DARK;
		font-weight: 600;
	}

	.status-draft {
		color: #8b5cf6;
		font-weight: 600;
	}

	.status-proposed {
		color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
          color: V9_COLORS.PRIMARY.GREEN_DARK;
        `;
			case 'partial':
				return `
          background: rgba(245, 158, 11, 0.1);
          color: V9_COLORS.PRIMARY.YELLOW;
        `;
			case 'not-supported':
				return `
          background: rgba(220, 38, 38, 0.1);
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			case 'draft':
				return `
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        `;
			case 'proposed':
				return `
          background: rgba(107, 114, 128, 0.1);
          color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
			content: '•';
			color: ${({ theme }) => theme.colors.primary};
			font-weight: bold;
			margin-right: 0.5rem;
		}
	}
`;

const pageConfig = {
	flowType: 'documentation' as const,
	theme: 'blue' as const,
	maxWidth: '1200px',
	showHeader: false, // We handle the header manually with FlowHeader
	showFooter: false,
	responsive: true,
};
const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

const OAuthForAI = () => {
	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader flowId="oauth-for-ai" />

				<CollapsibleHeader
					title="Key OAuth Specs for AI"
					subtitle="Essential OAuth specifications relevant to AI and agentic systems"
					icon={<span>🖥️</span>}
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
								<td>Modernized OAuth baseline (PKCE, redirect URI, best practices)</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>JWT Bearer Assertion</strong>
								</td>
								<td>RFC 7523</td>
								<td>Key-based service auth without client secrets</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Token Exchange</strong>
								</td>
								<td>RFC 8693</td>
								<td>Delegation and impersonation between agents</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Rich Authorization Requests (RAR)</strong>
								</td>
								<td>RFC 9396</td>
								<td>Structured, machine-readable authorization objects</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Pushed Authorization Requests (PAR)</strong>
								</td>
								<td>RFC 9126</td>
								<td>Secure pre-submission of authorization requests</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>JWT-Secured Authorization Requests (JAR)</strong>
								</td>
								<td>RFC 9101</td>
								<td>Signed JWT request objects for integrity</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>DPoP (Proof of Possession)</strong>
								</td>
								<td>RFC 9449</td>
								<td>Token key-binding (per agent instance)</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Step-Up Authentication Challenge</strong>
								</td>
								<td>RFC 9470</td>
								<td>Contextual step-up for dynamic reauthentication</td>
								<td>
									<StatusBadge $status="supported">✅ Final</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>GNAP (Grant Negotiation and Authorization Protocol)</strong>
								</td>
								<td>draft-ietf-gnap-core-protocol</td>
								<td>Next-generation dynamic delegation model</td>
								<td>
									<StatusBadge $status="draft">🧪 Draft</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Attestation-Based Client Authentication</strong>
								</td>
								<td>draft-ietf-oauth-attestation-based-client-auth</td>
								<td>Hardware/runtime-bound client attestation</td>
								<td>
									<StatusBadge $status="draft">🧪 Draft</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Attestation-Based Token Binding</strong>
								</td>
								<td>draft-ietf-oauth-attestation-based-token-binding</td>
								<td>Token binding via enclave proofs</td>
								<td>
									<StatusBadge $status="draft">🧪 Draft</StatusBadge>
								</td>
							</tr>
							<tr>
								<td>
									<strong>Identity Federation for AI</strong>
								</td>
								<td>emerging</td>
								<td>Cross-organization AI and model federation</td>
								<td>
									<StatusBadge $status="proposed">🧩 Proposed</StatusBadge>
								</td>
							</tr>
						</tbody>
					</CompatibilityTable>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne Compatibility Matrix"
					subtitle="Publicly verified PingOne support status for AI-relevant OAuth features"
					icon={<span>🛡️</span>}
					defaultCollapsed={false}
				>
					<CompatibilityTable>
						<thead>
							<tr>
								<th>Spec / Feature</th>
								<th>PingOne Public Status</th>
								<th>How to Implement or Simulate</th>
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
								<td>Default for all PingOne OAuth/OIDC apps</td>
								<td>Baseline for secure token issuance</td>
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
								<td>Service-to-service or AI agent authentication</td>
							</tr>
							<tr>
								<td>
									<strong>PAR (RFC 9126)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>
									<code>/as/par</code> endpoint available in PingOne Auth API
								</td>
								<td>Redirect-less secure authorization</td>
							</tr>
							<tr>
								<td>
									<strong>RAR (RFC 9396)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>Configurable via PingOne Authorize / SSO</td>
								<td>Fine-grained AI task and context-specific consent</td>
							</tr>
							<tr>
								<td>
									<strong>Step-Up Authentication (RFC 9470)</strong>
								</td>
								<td>
									<span className="status-supported">✅ Supported</span>
								</td>
								<td>PingOne Protect adaptive MFA and policies</td>
								<td>Human-in-loop decisioning for AI actions</td>
							</tr>
							<tr>
								<td>
									<strong>Token Exchange (RFC 8693)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate using Worker tokens and introspection</td>
								<td>Delegation chain between AI agents</td>
							</tr>
							<tr>
								<td>
									<strong>DPoP (RFC 9449)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate via mTLS or key-bound claims</td>
								<td>Proof-of-possession for model endpoints</td>
							</tr>
							<tr>
								<td>
									<strong>JAR (RFC 9101)</strong>
								</td>
								<td>
									<span className="status-partial">🔸 Partial via PAR</span>
								</td>
								<td>JAR semantics implied through signed PAR requests</td>
								<td>Secure request integrity for AI-to-AI auth</td>
							</tr>
							<tr>
								<td>
									<strong>GNAP (draft)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate via PAR + RAR + DaVinci orchestration</td>
								<td>Dynamic multi-agent negotiation</td>
							</tr>
							<tr>
								<td>
									<strong>Attestation Auth / Binding</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Simulate via mTLS + PingOne Protect</td>
								<td>Trusted AI agent provenance</td>
							</tr>
							<tr>
								<td>
									<strong>AI Federation (draft)</strong>
								</td>
								<td>
									<span className="status-not-supported">❌ Not Supported</span>
								</td>
								<td>Not available in PingOne</td>
								<td>Cross-tenant AI orchestration</td>
							</tr>
						</tbody>
					</CompatibilityTable>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne Components for AI"
					subtitle="Relevant PingOne components and their OAuth capabilities for AI use cases"
					icon={<i className="bi bi-question-circle"></i>}
					defaultCollapsed={false}
				>
					<CompatibilityTable>
						<thead>
							<tr>
								<th>Component</th>
								<th>Relevant OAuth Capabilities</th>
								<th>AI-Oriented Use Case</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<strong>PingOne SSO</strong>
								</td>
								<td>OAuth 2.1, PKCE, PAR, RAR, JWT Bearer</td>
								<td>Secure multi-agent login orchestration</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne Protect</strong>
								</td>
								<td>Step-Up (RFC 9470), risk policies</td>
								<td>Adaptive MFA for agent-triggered actions</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne DaVinci</strong>
								</td>
								<td>Visual flow orchestration</td>
								<td>Simulate GNAP-style dynamic authorization</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne Authorize</strong>
								</td>
								<td>Policy and RAR enforcement</td>
								<td>Structured consent for AI actions</td>
							</tr>
							<tr>
								<td>
									<strong>Worker Apps</strong>
								</td>
								<td>JWT Bearer and Client Credentials</td>
								<td>Non-interactive agent/service identity</td>
							</tr>
							<tr>
								<td>
									<strong>PingOne APIs</strong>
								</td>
								<td>Full PAR/RAR endpoint compliance</td>
								<td>Redirect-less AI integration</td>
							</tr>
						</tbody>
					</CompatibilityTable>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Summary & Recommendations"
					subtitle="Key takeaways and implementation guidance for AI-ready OAuth orchestration"
					icon={<i className="bi bi-question-circle"></i>}
					defaultCollapsed={false}
				>
					<SpecCard title="PingOne AI-Ready Features">
						<p>
							PingOne provides most foundational OAuth capabilities for{' '}
							<strong>AI-ready orchestration</strong>, including:
						</p>
						<ul>
							<li>
								<strong>JWT Bearer (RFC 7523)</strong> for agent-based key authentication
							</li>
							<li>
								<strong>PAR (RFC 9126)</strong> and <strong>RAR (RFC 9396)</strong> for structured,
								redirect-less authorization
							</li>
							<li>
								<strong>Step-Up (RFC 9470)</strong> via PingOne Protect for adaptive security
							</li>
						</ul>

						<p>
							Features such as <strong>Token Exchange</strong>, <strong>DPoP</strong>, and{' '}
							<strong>GNAP</strong> are <strong>not publicly supported</strong>, but can be{' '}
							<strong>safely simulated</strong> using <strong>Worker tokens</strong>,{' '}
							<strong>RAR/PAR</strong>, and <strong>PingOne DaVinci</strong> for prototype AI
							authorization chains.
						</p>
					</SpecCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="RFC References"
					subtitle="Complete list of OAuth specifications and drafts relevant to AI systems"
					icon={<span>🔗</span>}
					defaultCollapsed={true}
				>
					<div style={{ margin: '2rem 0' }}>
						<h3 style={{ color: '#2563eb', marginBottom: '1rem' }}>
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
								<strong>OAuth 2.0 PKCE</strong> — RFC 7636:{' '}
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
						</ReferenceList>

						<h3 style={{ color: '#2563eb', marginTop: '2rem', marginBottom: '1rem' }}>
							AI-Relevant OAuth Extensions
						</h3>
						<ReferenceList>
							<li>
								<strong>JWT Bearer Token / Assertion</strong> — RFC 7523:{' '}
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
									rfc-editor.org/rfc9126
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

						<h3 style={{ color: '#2563eb', marginTop: '2rem', marginBottom: '1rem' }}>
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
							*"Identity Federation for AI" is an emerging area without a single canonical draft;
							monitor the OAuth WG and GNAP WG for new documents.
						</p>
					</div>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OAuthForAI;
