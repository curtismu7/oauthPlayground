import React from 'react';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import { PageLayoutService } from '../../services/pageLayoutService';

const Card = FlowUIService.getMainCard();
const InfoBox = FlowUIService.getInfoBox();

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	p {
		font-size: 1.25rem;
		color: var(--color-text-secondary);
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.6;
	}
`;

const SectionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const SectionCard = styled.div`
	background: var(--color-surface);
	border: 2px solid var(--color-border);
	border-radius: 0.75rem;
	padding: 1.5rem;
	transition: all 0.3s ease;

	&:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	p {
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}
`;

const ExternalLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--color-primary);
	text-decoration: none;
	font-weight: 500;
	transition: color 0.2s;

	&:hover {
		color: var(--color-primary-dark);
	}
`;

const DraftLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--color-primary);
	text-decoration: none;
	font-weight: 600;
	font-size: 1rem;
	margin-top: 1.5rem;
	transition: color 0.2s;

	&:hover {
		color: var(--color-primary-dark);
		text-decoration: underline;
	}
`;

const AuthorBadge = styled.span`
	background: var(--color-primary-bg);
	color: var(--color-primary-text);
	font-size: 0.7rem;
	font-weight: 600;
	padding: 0.15rem 0.4rem;
	border-radius: 0.25rem;
	border: 1px solid var(--color-primary-light);
	margin-left: 0.4rem;
	vertical-align: middle;
	white-space: nowrap;
`;

const AuthorHighlight = styled.strong`
	color: var(--color-primary-text);
	background: var(--color-primary-bg);
	padding: 0 0.3rem;
	border-radius: 0.25rem;
	font-weight: 700;
`;

const SpecGroup = styled.p`
	margin: 1.5rem 0 0.25rem;
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-primary);
	border-bottom: 1px solid var(--color-border);
	padding-bottom: 0.25rem;

	&:first-child {
		margin-top: 0;
	}
`;

const SpecList = styled.ul`
	list-style: disc;
	padding-left: 2rem;
	font-size: 1rem;
	line-height: 2;
	margin: 0 0 0.25rem 0;
`;

const MetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-top: 1rem;
	font-size: 0.9rem;
	color: var(--color-text-secondary);

	span {
		background: var(--color-surface);
		border-radius: 0.375rem;
		padding: 0.25rem 0.75rem;
		border: 1px solid var(--color-border);
	}
`;

// Create layout components at module level — styled-components v6 calls useContext
// internally, so createPageLayout must never run inside a component function body.
const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout({
	flowType: 'pingone' as const,
	theme: 'red' as const,
	maxWidth: '1200px',
	showHeader: false,
	showFooter: false,
	responsive: true,
});

const AIAgentAuthDraft: React.FC = () => {
	usePageScroll({ pageName: 'AI Agent Auth IETF Draft', force: true });

	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader flowId="ai-agent-auth-draft" />

				<Header>
					<h1>
						<span>🖥️</span>
						AI Agent Authentication &amp; Authorization
					</h1>
					<p>
						IETF Internet-Draft — <strong>draft-klrc-aiagent-auth-00</strong>
					</p>
					<MetaRow>
						<span>Status: Internet-Draft (I-D Exists)</span>
						<span>Published: 2 March 2026</span>
						<span>Expires: 3 September 2026</span>
						<span>
							Authors: Kasselman, Lombardo, Rosomakho,{' '}
							<AuthorHighlight>Brian Campbell</AuthorHighlight> (Ping Identity)
						</span>
					</MetaRow>
				</Header>

				{/* Summary */}
				<CollapsibleHeader
					title="Document Summary"
					subtitle="What this draft is about and why it matters"
					icon={<i className="bi bi-question-circle"></i>}
					theme="highlight"
					defaultCollapsed={false}
				>
					<Card style={{ padding: '2rem' }}>
						<p
							style={{
								fontSize: '1.05rem',
								lineHeight: '1.8',
								color: 'var(--color-text-primary)',
								marginTop: 0,
							}}
						>
							This Internet-Draft proposes a comprehensive model for authenticating and authorizing
							AI agents as they interact with tools, services, large language models (LLMs), and
							other agents. Rather than defining new protocols, the draft demonstrates how existing,
							widely-deployed standards — including the Workload Identity in Multi-System
							Environments (WIMSE) architecture, OAuth 2.0, SPIFFE, and OpenID Shared Signals
							Framework (SSF) — can be composed and applied to the specific challenges of agentic
							workloads. Agents are treated as workloads that require unique identifiers,
							cryptographic credentials, and authorization grants, regardless of whether they act
							autonomously or on behalf of a human user.
						</p>
						<p
							style={{
								fontSize: '1.05rem',
								lineHeight: '1.8',
								color: 'var(--color-text-primary)',
								marginBottom: 0,
							}}
						>
							The draft introduces the concept of an Agent Identity Management System (AIMS) — a
							layered stack covering agent identifiers (WIMSE/SPIFFE URIs), short-lived
							cryptographic credentials, attestation, credential provisioning, transport- and
							application-layer authentication (mTLS, WIMSE Proof Tokens, HTTP Message Signatures),
							and OAuth 2.0-based delegation for user-directed, autonomous, and agent-to-agent
							scenarios. It also addresses cross-domain access via OAuth identity chaining, risk
							reduction through Transaction Tokens, human-in-the-loop authorization via CIBA, and
							runtime monitoring and remediation via OpenID Shared Signals. The document explicitly
							calls out static API keys as an anti-pattern and positions this framework as both a
							consolidation of prior art and a foundation for identifying remaining gaps in
							standardization.
						</p>

						<DraftLink
							href="https://datatracker.ietf.org/doc/draft-klrc-aiagent-auth/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span>🔗</span>
							View Full Specification on IETF Datatracker
						</DraftLink>
					</Card>
				</CollapsibleHeader>

				{/* Key Concepts */}
				<CollapsibleHeader
					title="Key Concepts"
					subtitle="Core components of the AI agent identity framework"
					icon={<span>🛡️</span>}
					theme="blue"
					defaultCollapsed={false}
				>
					<SectionGrid>
						<SectionCard>
							<h3>
								<span>🖥️</span> Agent as Workload
							</h3>
							<p>
								AI agents are modeled as autonomous workloads that iteratively interact with an LLM
								and a set of Tools, Services, and Resources. They may act on behalf of a user or
								operate fully autonomously, and require the same identity and authorization
								infrastructure as any other software workload.
							</p>
						</SectionCard>

						<SectionCard>
							<h3>
								<span>🔑</span> Agent Identity &amp; Credentials
							</h3>
							<p>
								Each agent MUST be assigned a WIMSE/SPIFFE URI as its stable identifier. Credentials
								(X.509 certificates, JWT-SVIDs, Workload Identity Tokens) MUST be short-lived and
								cryptographically bound to the agent's identifier. Static API keys are explicitly an
								anti-pattern.
							</p>
						</SectionCard>

						<SectionCard>
							<h3>
								<span>🛡️</span> Authentication Layers
							</h3>
							<p>
								Authentication operates at both the transport layer (mTLS with SPIFFE/WIMSE workload
								certificates) and the application layer (WIMSE Proof Tokens and HTTP Message
								Signatures), ensuring end-to-end identity continuity even when requests traverse
								proxies, load balancers, or API gateways that terminate TLS.
							</p>
						</SectionCard>

						<SectionCard>
							<h3>
								<span>👥</span> OAuth 2.0 Authorization
							</h3>
							<p>
								OAuth 2.0 is used as the delegation authorization framework. Agents obtain access
								tokens via Authorization Code (user delegates), Client Credentials / JWT Grant
								(agent acts on own behalf), or through token exchange for cross-domain access.
								Transaction Tokens reduce risk when access tokens pass through internal microservice
								call chains.
							</p>
						</SectionCard>

						<SectionCard>
							<h3>
								<span>🛡️</span> Human in the Loop
							</h3>
							<p>
								When elevated authorization is required, the draft specifies integration with OpenID
								CIBA (Client-Initiated Backchannel Authentication) to obtain explicit out-of-band
								user approval. Local UI confirmations alone are not considered sufficient
								authorization — the authorization server must issue a formal grant.
							</p>
						</SectionCard>

						<SectionCard>
							<h3>
								<i className="bi bi-question-circle"></i> Monitoring &amp; Observability
							</h3>
							<p>
								Deployments MUST maintain tamper-evident audit logs covering agent identifier,
								delegated subject, resource accessed, action, timestamp, and attestation state.
								Real-time signals via OpenID SSF (CAEP/RISC) enable dynamic remediation — cached
								tokens MUST NOT be used after a revocation signal is received.
							</p>
						</SectionCard>
					</SectionGrid>
				</CollapsibleHeader>

				{/* Standards Referenced */}
				<CollapsibleHeader
					title="Standards Referenced"
					subtitle="Existing specifications this draft builds upon"
					icon={<span>🔗</span>}
					theme="blue"
					defaultCollapsed={true}
				>
					<Card style={{ padding: '2rem' }}>
						<SpecGroup>Foundation</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc6749"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Authorization Framework (RFC 6749)
								</ExternalLink>
							</li>
						</SpecList>

						<SpecGroup>Agent Workload Identity</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/html/draft-ietf-wimse-arch-07"
									target="_blank"
									rel="noopener noreferrer"
								>
									WIMSE Architecture (draft-ietf-wimse-arch)
								</ExternalLink>
							</li>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/draft-ietf-wimse-wpt/"
									target="_blank"
									rel="noopener noreferrer"
								>
									WIMSE Workload Proof Token (draft-ietf-wimse-wpt)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/draft-ietf-wimse-workload-creds/"
									target="_blank"
									rel="noopener noreferrer"
								>
									WIMSE Workload Credentials (draft-ietf-wimse-workload-creds)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://spiffe.io/docs/latest/spiffe-about/overview/"
									target="_blank"
									rel="noopener noreferrer"
								>
									SPIFFE — Secure Production Identity Framework for Everyone
								</ExternalLink>
							</li>
						</SpecList>

						<SpecGroup>Service-to-Service Authentication</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc7521"
									target="_blank"
									rel="noopener noreferrer"
								>
									Assertion Framework for OAuth 2.0 Client Authentication and Authorization Grants
									(RFC 7521)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-rfc7523bis/"
									target="_blank"
									rel="noopener noreferrer"
								>
									JWT Profile for OAuth 2.0 Client Authentication and Authorization Grants (RFC 7523
									/ rfc7523bis)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Identity Assertion JWT Authorization Grant
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
						</SpecList>

						<SpecGroup>Authorization, Delegation &amp; Scoping</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc8693"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Token Exchange (RFC 8693)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-chaining-08"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth Identity &amp; Authorization Chaining Across Domains
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc8707"
									target="_blank"
									rel="noopener noreferrer"
								>
									Resource Indicators for OAuth 2.0 (RFC 8707)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc9396"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Rich Authorization Requests — RAR (RFC 9396)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
						</SpecList>

						<SpecGroup>Cryptographic Binding &amp; Proof of Possession</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc8705"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens —
									mTLS (RFC 8705)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc9449"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Demonstrating Proof of Possession — DPoP (RFC 9449)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc9126"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Pushed Authorization Requests — PAR (RFC 9126)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
						</SpecList>

						<SpecGroup>Risk-Adaptive &amp; Contextual Authorization</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-transaction-tokens-07"
									target="_blank"
									rel="noopener noreferrer"
								>
									Transaction Tokens (draft-ietf-oauth-transaction-tokens)
								</ExternalLink>
							</li>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc9470"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Step Up Authentication Challenge Protocol (RFC 9470)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									OpenID Connect CIBA (Client-Initiated Backchannel Authentication)
								</ExternalLink>
							</li>
						</SpecList>

						<SpecGroup>Verifiable Credentials &amp; Selective Disclosure</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc9901"
									target="_blank"
									rel="noopener noreferrer"
								>
									Selective Disclosure for JSON Web Tokens — SD-JWT (RFC 9901)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
							<li>
								<ExternalLink
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/"
									target="_blank"
									rel="noopener noreferrer"
								>
									SD-JWT-based Verifiable Credentials (draft-ietf-oauth-sd-jwt-vc)
								</ExternalLink>
								<AuthorBadge>Brian Campbell</AuthorBadge>
							</li>
						</SpecList>

						<SpecGroup>Monitoring &amp; Continuous Assessment</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://openid.net/specs/openid-sharedsignals-framework-1_0-final.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									OpenID Shared Signals Framework (SSF) — CAEP &amp; RISC
								</ExternalLink>
							</li>
							<li>
								<ExternalLink
									href="https://www.rfc-editor.org/rfc/rfc9700"
									target="_blank"
									rel="noopener noreferrer"
								>
									OAuth 2.0 Security Best Current Practice (RFC 9700)
								</ExternalLink>
							</li>
						</SpecList>

						<SpecGroup>Agent Protocols</SpecGroup>
						<SpecList>
							<li>
								<ExternalLink
									href="https://modelcontextprotocol.io/specification/2025-11-25"
									target="_blank"
									rel="noopener noreferrer"
								>
									Model Context Protocol (MCP) 2025-11-25
								</ExternalLink>
							</li>
						</SpecList>
					</Card>
				</CollapsibleHeader>

				{/* Full document link */}
				<InfoBox style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }}>
					<p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
						This is an individual Internet-Draft submitted to the IETF. It has no formal IETF
						standing and may be updated or superseded at any time. Brian Campbell of Ping Identity
						is one of the co-authors.
					</p>
					<ExternalLink
						href="https://datatracker.ietf.org/doc/draft-klrc-aiagent-auth/"
						target="_blank"
						rel="noopener noreferrer"
						style={{ fontSize: '1.1rem' }}
					>
						<span>🔗</span>
						Read the full draft on IETF Datatracker
					</ExternalLink>
				</InfoBox>
			</ContentWrapper>
		</PageContainer>
	);
};

export default AIAgentAuthDraft;
