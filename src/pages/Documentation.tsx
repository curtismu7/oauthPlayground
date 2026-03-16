import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

const pageConfig = {
	flowType: 'pingone' as const,
	theme: 'red' as const,
	maxWidth: '1200px',
	showHeader: true,
	showFooter: false,
	responsive: true,
};

const { PageContainer, ContentWrapper, PageHeader } =
	PageLayoutService.createPageLayout(pageConfig);

const MDIIcon: React.FC<{ icon: string; size?: number; className?: string }> = ({
	icon,
	size = 16,
	className = '',
}) => {
	const iconMap: Record<string, string> = {
		FiBookOpen: 'mdi-book-open-page-variant',
		FiCode: 'mdi-code-tags',
		FiExternalLink: 'mdi-open-in-new',
		FiHelpCircle: 'mdi-help-circle',
		FiLock: 'mdi-lock',
		FiPlay: 'mdi-play',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield-check',
		FiTool: 'mdi-tools',
		FiCpu: 'mdi-cpu-64-bit',
		FiFileText: 'mdi-file-document-outline',
		FiGlobe: 'mdi-earth',
		FiZap: 'mdi-lightning-bolt',
	};

	const mdiIcon = iconMap[icon] || 'mdi-help';

	return <i className={`mdi ${mdiIcon} ${className}`} style={{ fontSize: `${size}px` }}></i>;
};

const CardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 20px;
	margin-bottom: 0;
`;

const DocCard = styled(Link)`
	background: ${V9_COLORS.BG.WHITE};
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	padding: 24px;
	transition:
		transform 0.2s,
		box-shadow 0.2s;
	text-decoration: none;
	color: inherit;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: ${V9_COLORS.PRIMARY.BLUE};
	}

	h3 {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	p {
		color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
		font-size: 0.95rem;
		line-height: 1.5;
		margin-bottom: 0;
	}
`;

const QuickStartBanner = styled.div`
	background: linear-gradient(135deg, ${V9_COLORS.PRIMARY.BLUE}, ${V9_COLORS.PRIMARY.BLUE_DARK});
	color: white;
	padding: 24px;
	border-radius: 12px;
	margin-bottom: 0;
	text-align: center;

	h2 {
		font-size: 1.75rem;
		margin-bottom: 1rem;
		color: white;
		font-weight: 700;
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

const CodeBlock = styled.pre`
	background-color: ${V9_COLORS.TEXT.BLACK} !important;
	color: ${V9_COLORS.TEXT.GRAY_LIGHTER} !important;
	padding: 1rem;
	border-radius: 0.375rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 1.5rem 0;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_MEDIUM} !important;
	code {
		font-family: inherit;
		background-color: transparent !important;
		color: ${V9_COLORS.TEXT.GRAY_LIGHTER} !important;
		border: none !important;
	}
`;

const SpecList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const SpecItem = styled.li`
	margin-bottom: 12px;
	padding-bottom: 12px;
	border-bottom: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	&:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
`;

const SpecLink = styled.a`
	color: ${V9_COLORS.PRIMARY.BLUE};
	text-decoration: none;
	font-weight: 600;
	font-size: 0.9rem;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	&:hover {
		text-decoration: underline;
		color: ${V9_COLORS.PRIMARY.BLUE_DARK};
	}
`;

const SpecDesc = styled.p`
	margin: 4px 0 0;
	font-size: 0.82rem;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	line-height: 1.4;
`;

const Documentation = () => {
	usePageScroll({ pageName: 'Documentation Hub', force: true });

	return (
		<PageContainer>
			{PageHeader ? (
				<PageHeader>
					<h1>📚 Documentation Hub</h1>
					<p>Internal guides, OAuth/OIDC specs, RFC references, and PingOne platform docs</p>
				</PageHeader>
			) : null}
			<ContentWrapper>
				{/* ── Quick Jump ──────────────────────────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Quick Jump"
						subtitle="Jump directly into tutorials, flows, or tools"
						icon={<MDIIcon icon="FiPlay" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<QuickStartBanner>
							<h2>Start Exploring</h2>
							<p>Interactive OAuth/OIDC flows with live PingOne API integration</p>
							<div
								style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
							>
								<QuickStartButton to="/tutorials">
									<MDIIcon icon="FiPlay" size={16} /> Tutorials
								</QuickStartButton>
								<QuickStartButton to="/flows">
									<MDIIcon icon="FiCode" size={16} /> Flows
								</QuickStartButton>
								<QuickStartButton to="/v8u/unified">
									<MDIIcon icon="FiZap" size={16} /> Unified OAuth &amp; OIDC
								</QuickStartButton>
							</div>
						</QuickStartBanner>
					</CollapsibleHeader>
				</div>

				{/* ── Internal: Documentation & Reference ─────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Documentation & Reference Pages"
						subtitle="Internal guides built into this playground"
						icon={<MDIIcon icon="FiBookOpen" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<CardGrid>
							<DocCard to="/documentation/oidc-overview">
								<h3>
									OIDC Overview <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									OpenID Connect concepts, token types, and PingOne-specific implementation notes.
								</p>
							</DocCard>
							<DocCard to="/docs/migration">
								<h3>
									V7/V8 → V9 Migration Guide <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Comprehensive guide for migrating services to the V9 architecture with quality
									gates and patterns.
								</p>
							</DocCard>
							<DocCard to="/oauth-2-1">
								<h3>
									OAuth 2.1 Specification <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Interactive breakdown of the OAuth 2.1 draft — consolidated best practices from
									2.0.
								</p>
							</DocCard>
							<DocCard to="/docs/oauth2-security-best-practices">
								<h3>
									OAuth 2.0 Security BCP <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Security best current practices (draft-ietf-oauth-security-topics) with live
									examples.
								</p>
							</DocCard>
							<DocCard to="/comprehensive-oauth-education">
								<h3>
									OAuth Education Hub <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Complete educational journey through OAuth 2.0 grant types and flows.</p>
							</DocCard>
							<DocCard to="/pingone-scopes-reference">
								<h3>
									OAuth Scopes Reference <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Full catalog of PingOne OAuth scopes — what they unlock and how to request them.
								</p>
							</DocCard>
							<DocCard to="/docs/oidc-specs">
								<h3>
									OIDC Specifications <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Annotated reference for OpenID Connect specifications with PingOne implementation
									notes.
								</p>
							</DocCard>
							<DocCard to="/par-vs-rar">
								<h3>
									RAR vs PAR vs DPoP Guide <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Side-by-side comparison of advanced OAuth extensions: RAR, PAR, and DPoP.</p>
							</DocCard>
							<DocCard to="/ciba-vs-device-authz">
								<h3>
									CIBA vs Device Authorization <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>When to use CIBA vs Device Authorization Grant — tradeoffs and use cases.</p>
							</DocCard>
							<DocCard to="/docs/spiffe-spire-pingone">
								<h3>
									SPIFFE/SPIRE with PingOne <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Workload identity using SPIFFE/SPIRE integrated with PingOne for zero-trust
									architectures.
								</p>
							</DocCard>
							<DocCard to="/pingone-sessions-api">
								<h3>
									PingOne Sessions API <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Session management, inspection, and invalidation via the PingOne Sessions API.
								</p>
							</DocCard>
							<DocCard to="/oidc-session-management">
								<h3>
									OIDC Session Management <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Front-channel logout, back-channel logout, and session state checks per OIDC
									Session spec.
								</p>
							</DocCard>
							<DocCard to="/pingone-mock-features">
								<h3>
									Mock & Educational Features <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									How mock flows work in this playground and what each mock is designed to teach.
								</p>
							</DocCard>
							<DocCard to="/v9/resources-api">
								<h3>
									Resources API Tutorial <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Step-by-step guide to the PingOne Resources and Scopes Management API.</p>
							</DocCard>
							<DocCard to="/flows/advanced-oauth-params-demo">
								<h3>
									Advanced OAuth Parameters <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Explore request parameters like <code>max_age</code>, <code>acr_values</code>,{' '}
									<code>claims</code>, and more.
								</p>
							</DocCard>
						</CardGrid>
					</CollapsibleHeader>
				</div>

				{/* ── Internal: OAuth Flows ────────────────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Interactive OAuth & OIDC Flows"
						subtitle="Live implementations of every standard grant type and advanced extension"
						icon={<MDIIcon icon="FiCode" />}
						defaultCollapsed={true}
						theme="ping"
					>
						<p style={{ marginBottom: '16px', color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
							All flows below run against the PingOne API (or mock mode) and show real
							request/response payloads.
						</p>
						<CardGrid>
							<DocCard to="/flows/oidc-authorization-code-v9">
								<h3>Authorization Code + PKCE (Mock)</h3>
								<p>The most secure grant type. Uses PKCE to protect public clients.</p>
							</DocCard>
							<DocCard to="/flows/client-credentials-v9">
								<h3>Client Credentials (Mock)</h3>
								<p>Machine-to-machine authentication for backend service accounts.</p>
							</DocCard>
							<DocCard to="/flows/device-authorization-v9">
								<h3>Device Authorization (Mock)</h3>
								<p>RFC 8628 — for input-constrained devices like smart TVs and IoT.</p>
							</DocCard>
							<DocCard to="/flows/ciba-v9">
								<h3>CIBA Backchannel (Mock)</h3>
								<p>Client-Initiated Backchannel Authentication with push/poll/ping modes.</p>
							</DocCard>
							<DocCard to="/flows/dpop">
								<h3>DPoP (RFC 9449)</h3>
								<p>Demonstrating Proof of Possession — sender-constrained access tokens.</p>
							</DocCard>
							<DocCard to="/flows/par-v9">
								<h3>Pushed Authorization Requests (RFC 9126)</h3>
								<p>Pre-register authorization requests server-side before redirecting.</p>
							</DocCard>
							<DocCard to="/flows/rar-v9">
								<h3>Rich Authorization Requests (RFC 9396)</h3>
								<p>Fine-grained authorization using structured authorization_details objects.</p>
							</DocCard>
							<DocCard to="/flows/gnap-v1">
								<h3>GNAP (RFC 9635)</h3>
								<p>Grant Negotiation and Authorization Protocol — the next-gen OAuth successor.</p>
							</DocCard>
							<DocCard to="/flows/jar-jarm-v1">
								<h3>JAR + JARM (FAPI 2.0)</h3>
								<p>JWT-secured authorization requests and responses for high-security APIs.</p>
							</DocCard>
							<DocCard to="/flows/mtls-client-auth-v1">
								<h3>mTLS Certificate-Bound Tokens (RFC 8705)</h3>
								<p>Mutual TLS client authentication with certificate-bound access tokens.</p>
							</DocCard>
							<DocCard to="/flows/wimse-v1">
								<h3>WIMSE Workload Identity</h3>
								<p>IETF WIMSE draft — workload identity for service-to-service auth.</p>
							</DocCard>
							<DocCard to="/flows/attestation-client-auth-v1">
								<h3>Attestation Client Auth</h3>
								<p>RFC 9449-style client attestation for mobile and platform credentials.</p>
							</DocCard>
							<DocCard to="/flows/step-up-auth-v1">
								<h3>Step-Up Authentication</h3>
								<p>Re-authenticate with elevated assurance (MFA) mid-session on demand.</p>
							</DocCard>
							<DocCard to="/flows/token-introspection-v1">
								<h3>Token Introspection (RFC 7662)</h3>
								<p>Inspect opaque tokens at the AS introspection endpoint.</p>
							</DocCard>
							<DocCard to="/flows/spiffe-spire-v9">
								<h3>SPIFFE/SPIRE (Mock)</h3>
								<p>Workload identity using SVID certificates — zero-trust service mesh.</p>
							</DocCard>
						</CardGrid>
					</CollapsibleHeader>
				</div>

				{/* ── Internal: AI & Identity ──────────────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="AI & Identity Documentation"
						subtitle="OAuth/OIDC for AI agents, MCP, and IETF emerging standards"
						icon={<MDIIcon icon="FiCpu" />}
						defaultCollapsed={true}
						theme="ping"
					>
						<CardGrid>
							<DocCard to="/docs/oidc-for-ai">
								<h3>
									OIDC for AI Agents <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>How AI agents authenticate users and handle delegated identity using OIDC.</p>
							</DocCard>
							<DocCard to="/docs/oauth-for-ai">
								<h3>
									OAuth for AI Agents <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Delegated authorization patterns for agentic workflows consuming protected APIs.
								</p>
							</DocCard>
							<DocCard to="/docs/ping-view-on-ai">
								<h3>
									PingOne AI Perspective <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>PingOne's approach to identity for AI — platform features and roadmap.</p>
							</DocCard>
							<DocCard to="/docs/ai-agent-auth-draft">
								<h3>
									AI Agent Auth (IETF Draft) <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Emerging IETF standards for authenticating AI agents — draft-ietf-oauth-agentic.
								</p>
							</DocCard>
							<DocCard to="/ai-agent-overview">
								<h3>
									AI Agent Overview <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Architecture patterns: user-in-the-loop, fully autonomous, and delegated agents.
								</p>
							</DocCard>
							<DocCard to="/ai-identity-architectures">
								<h3>
									AI Identity Architectures <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Reference architectures for binding identity to AI agents and tool calls.</p>
							</DocCard>
							<DocCard to="/documentation/mcp">
								<h3>
									MCP Documentation <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Model Context Protocol — how MCP servers expose tools and handle auth.</p>
							</DocCard>
							<DocCard to="/ai-glossary">
								<h3>
									AI Identity Glossary <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Definitions for agentic AI terms: RAG, tool-use, delegation, attestation.</p>
							</DocCard>
							<DocCard to="/ping-ai-resources">
								<h3>
									Ping AI Resources <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>Links, research, and Ping Identity AI-related content and integrations.</p>
							</DocCard>
							<DocCard to="/docs/prompts/prompt-all">
								<h3>
									🚀 Complete Prompts Guide <MDIIcon icon="FiExternalLink" size={14} />
								</h3>
								<p>
									Prompt engineering guide for working with MasterFlow Agent and this
									playground.{' '}
								</p>
							</DocCard>
						</CardGrid>
					</CollapsibleHeader>
				</div>

				{/* ── External: RFC Specifications ─────────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="OAuth RFCs & IETF Specifications"
						subtitle="Normative standards — all links open IETF / oauth.net"
						icon={<MDIIcon icon="FiFileText" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
								gap: '24px',
							}}
						>
							{/* Core OAuth 2.0 */}
							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.BLUE}`,
										paddingBottom: '8px',
									}}
								>
									Core OAuth 2.0
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc6749"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 6749 — OAuth 2.0 Authorization Framework{' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>The foundational spec for all OAuth 2.0 flows.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc6750"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 6750 — Bearer Token Usage <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											How to use Bearer tokens in Authorization headers and requests.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc7636"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 7636 — PKCE <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Proof Key for Code Exchange — required for all public clients.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc7662"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 7662 — Token Introspection <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Query the AS about token status, metadata, and claims.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc7591"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 7591 — Dynamic Client Registration{' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Programmatically register OAuth clients with the AS.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc8693"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 8693 — Token Exchange <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Delegate or impersonate by exchanging one token for another.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc8628"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 8628 — Device Authorization Grant{' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>OAuth flow for input-constrained devices (smart TVs, IoT).</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://oauth.net/2.1/"
											target="_blank"
											rel="noopener noreferrer"
										>
											OAuth 2.1 Draft (oauth.net) <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Consolidated OAuth spec — removes implicit, ROPC; mandates PKCE.
										</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>

							{/* Advanced Extensions */}
							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.BLUE}`,
										paddingBottom: '8px',
									}}
								>
									Advanced Extensions
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc9449"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 9449 — DPoP <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Demonstrating Proof-of-Possession — sender-constrained tokens.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc9126"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 9126 — Pushed Authorization Requests (PAR){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Push request parameters to AS before redirect — prevents manipulation.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc9396"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 9396 — Rich Authorization Requests (RAR){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Structured authorization_details for fine-grained access control.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc9101"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 9101 — JWT-Secured Authorization Requests (JAR){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Sign/encrypt authorization request parameters as a JWT.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc8705"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 8705 — mTLS Client Authentication{' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Mutual TLS for client auth and certificate-bound access tokens.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc9068"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 9068 — JWT Access Tokens <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Standard claims and structure for JWT-formatted access tokens.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc9635"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 9635 — GNAP <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Grant Negotiation and Authorization Protocol — next-gen OAuth.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://www.rfc-editor.org/rfc/rfc7519"
											target="_blank"
											rel="noopener noreferrer"
										>
											RFC 7519 — JSON Web Tokens (JWT) <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Structure, signing, and validation of JWTs (JWS/JWE).</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>

							{/* Security & Best Practices */}
							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.RED}`,
										paddingBottom: '8px',
									}}
								>
									Security Drafts &amp; BCPs
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics"
											target="_blank"
											rel="noopener noreferrer"
										>
											OAuth 2.0 Security BCP (draft-ietf-oauth-security-topics){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Up-to-date security threats and mitigations for OAuth deployments.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps"
											target="_blank"
											rel="noopener noreferrer"
										>
											OAuth for Browser-Based Apps (BCP) <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Best practices for SPAs — token storage, backend-for-frontend pattern.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://datatracker.ietf.org/doc/draft-ietf-oauth-native-apps/"
											target="_blank"
											rel="noopener noreferrer"
										>
											OAuth for Native Apps (RFC 8252) <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Mobile app OAuth flows — custom URI schemes vs app links.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://datatracker.ietf.org/doc/draft-ietf-wimse-workload-identity-bcp/"
											target="_blank"
											rel="noopener noreferrer"
										>
											WIMSE Workload Identity BCP (IETF Draft){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Best practices for workload identity in zero-trust architectures.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://datatracker.ietf.org/doc/draft-ietf-oauth-step-up-authn-challenge/"
											target="_blank"
											rel="noopener noreferrer"
										>
											Step-Up Authentication Challenge (IETF Draft){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											WWW-Authenticate challenges for requesting elevated auth mid-session.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/"
											target="_blank"
											rel="noopener noreferrer"
										>
											Attestation-Based Client Auth (IETF Draft){' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Platform attestation (TPM, Secure Enclave) as OAuth client authentication.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://oauth.net/specs/"
											target="_blank"
											rel="noopener noreferrer"
										>
											Full OAuth Spec Index (oauth.net) <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Canonical list of all OAuth RFCs, active drafts, and extensions.
										</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>
						</div>
					</CollapsibleHeader>
				</div>

				{/* ── External: OpenID Foundation Specs ───────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="OpenID Connect Specifications"
						subtitle="OpenID Foundation normative specs — openid.net"
						icon={<MDIIcon icon="FiGlobe" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
								gap: '24px',
							}}
						>
							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.GREEN}`,
										paddingBottom: '8px',
									}}
								>
									Core OIDC
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-core-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Core 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											ID tokens, UserInfo endpoint, authentication flows, and claims.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-discovery-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Discovery 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Provider metadata at <code>/.well-known/openid-configuration</code>.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-registration-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Dynamic Registration 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Dynamic registration of OIDC Relying Parties.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-session-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Session Management 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>iframe-based session monitoring and coordinated logout.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-frontchannel-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Front-Channel Logout 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Browser-based coordinated logout via redirect to RP logout URIs.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-backchannel-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Back-Channel Logout 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Server-to-server logout via direct HTTP POST to RP logout endpoint.
										</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>

							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.GREEN}`,
										paddingBottom: '8px',
									}}
								>
									CIBA &amp; FAPI
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											CIBA Core 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Client-Initiated Backchannel Authentication — push, poll, ping modes.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/fapi-2_0-security-profile-ID2.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											FAPI 2.0 Security Profile <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											High-security OAuth profile for open banking and financial APIs.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/fapi-2_0-message-signing-ID1.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											FAPI 2.0 Message Signing (JARM) <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											JWT Authorization Response Mode — sign authorization responses (JARM).
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/openid-connect-native-sso-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											OIDC Native SSO for Mobile Apps 1.0{' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Device-bound SSO for native mobile apps sharing authentication.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											Multiple Response Types 1.0 <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Hybrid flow response type combinations (code id_token, code token, etc.).
										</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>
						</div>
					</CollapsibleHeader>
				</div>

				{/* ── External: PingOne Official Docs ─────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="PingOne Official Documentation"
						subtitle="Ping Identity platform docs, API references, and developer resources"
						icon={<MDIIcon icon="FiSettings" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
								gap: '24px',
							}}
						>
							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.RED}`,
										paddingBottom: '8px',
									}}
								>
									API References
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2"
											target="_blank"
											rel="noopener noreferrer"
										>
											PingOne Auth API — OAuth 2.0 / OIDC{' '}
											<MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Authorization, token, userinfo, and JWKS endpoints with full examples.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://apidocs.pingidentity.com/pingone/platform/v1/api/"
											target="_blank"
											rel="noopener noreferrer"
										>
											PingOne Platform Management API <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Manage environments, populations, applications, resources, and scopes.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://apidocs.pingidentity.com/pingone/mfa/v1/api/"
											target="_blank"
											rel="noopener noreferrer"
										>
											PingOne MFA API <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Device registration, TOTP, FIDO2, and MFA policy management.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://apidocs.pingidentity.com/pingone/protect/v1/api/"
											target="_blank"
											rel="noopener noreferrer"
										>
											PingOne Protect API <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Risk evaluation, behavioral analytics, and threat detection.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://apidocs.pingidentity.com/pingone/authorize/v1/api/"
											target="_blank"
											rel="noopener noreferrer"
										>
											PingOne Authorize API <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Policy-based authorization engine for fine-grained access decisions.
										</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>

							<div>
								<h3
									style={{
										color: V9_COLORS.TEXT.GRAY_DARK,
										marginTop: 0,
										borderBottom: `2px solid ${V9_COLORS.PRIMARY.RED}`,
										paddingBottom: '8px',
									}}
								>
									Developer Resources
								</h3>
								<SpecList>
									<SpecItem>
										<SpecLink
											href="https://developer.pingidentity.com"
											target="_blank"
											rel="noopener noreferrer"
										>
											Ping Identity Developer Portal <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>SDKs, sample apps, quick starts, and integration guides.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://docs.pingidentity.com/sdks/latest/sdks/index.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											PingOne SDKs <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											JavaScript, iOS, Android, and server SDKs for PingOne integration.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://developer.pingidentity.com/identity-for-ai/index.html"
											target="_blank"
											rel="noopener noreferrer"
										>
											Identity for AI <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Ping's platform for AI agent identity — concepts, APIs, and architecture.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://library.pingidentity.com"
											target="_blank"
											rel="noopener noreferrer"
										>
											Ping Identity Library <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Whitepapers, webinars, solution briefs, and technical deep-dives.
										</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://support.pingidentity.com"
											target="_blank"
											rel="noopener noreferrer"
										>
											Ping Identity Support <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>Knowledge base, release notes, and case management portal.</SpecDesc>
									</SpecItem>
									<SpecItem>
										<SpecLink
											href="https://community.pingidentity.com"
											target="_blank"
											rel="noopener noreferrer"
										>
											Ping Identity Community <MDIIcon icon="FiExternalLink" size={12} />
										</SpecLink>
										<SpecDesc>
											Forums, Q&amp;A, community-contributed integrations and recipes.
										</SpecDesc>
									</SpecItem>
								</SpecList>
							</div>
						</div>
					</CollapsibleHeader>
				</div>

				{/* ── Security ─────────────────────────────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Security Best Practices"
						subtitle="Critical security considerations for OAuth 2.0 and OIDC implementations"
						icon={<MDIIcon icon="FiLock" />}
						defaultCollapsed={true}
						theme="ping"
					>
						<div
							style={{
								background: V9_COLORS.BG.ERROR,
								border: `1px solid ${V9_COLORS.BG.ERROR_BORDER}`,
								borderRadius: '8px',
								padding: '16px',
								marginBottom: '1.5rem',
							}}
						>
							<p style={{ margin: 0, color: V9_COLORS.PRIMARY.RED, fontWeight: '500' }}>
								<strong>Security Warning:</strong> OAuth 2.0 and OIDC handle sensitive
								authentication data. Always follow these guidelines to protect your users and
								applications.
							</p>
						</div>
						<div style={{ marginTop: '1.5rem' }}>
							<h3>Always Use HTTPS</h3>
							<p>
								All endpoints (authorization, token, userinfo, introspection) must be accessed over
								HTTPS.
							</p>
							<h3>Validate ID Tokens</h3>
							<p>
								Verify signature, <code>exp</code>, <code>iss</code>, <code>aud</code>, and{' '}
								<code>nonce</code> before trusting any claims.
							</p>
							<CodeBlock>
								<code>{`// Minimal ID token validation checklist
// ✅ Verify signature (using JWKS from discovery endpoint)
// ✅ Check exp > now  
// ✅ Verify iss === expected issuer
// ✅ Verify aud includes your client_id
// ✅ Validate nonce matches what you sent (replay prevention)`}</code>
							</CodeBlock>
							<h3>Use PKCE for All Public Clients</h3>
							<p>
								Mandatory for SPAs, mobile apps, and any client that cannot securely store a client
								secret.
							</p>
							<h3>Rotate Refresh Tokens</h3>
							<p>
								Use refresh token rotation (one-time use) to detect token theft. PingOne supports
								this via the token endpoint.
							</p>
							<h3>Secure Token Storage</h3>
							<p>
								SPAs: prefer BFF (Backend for Frontend) pattern with HTTP-only cookies. Avoid{' '}
								<code>localStorage</code> for sensitive tokens.
							</p>
						</div>
					</CollapsibleHeader>
				</div>

				{/* ── Troubleshooting ──────────────────────────────────────── */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Common Issues & Troubleshooting"
						subtitle="Quick reference for the most frequent OAuth/OIDC errors"
						icon={<MDIIcon icon="FiHelpCircle" />}
						defaultCollapsed={true}
						theme="ping"
					>
						<div
							style={{
								background: V9_COLORS.BG.GRAY_LIGHT,
								border: `1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER}`,
								borderRadius: '8px',
								padding: '16px',
								marginBottom: '1.5rem',
							}}
						>
							<p style={{ margin: 0, color: V9_COLORS.PRIMARY.BLUE, fontWeight: '500' }}>
								<strong>Pro Tip:</strong> Most errors are configuration issues. Check redirect URIs,
								client IDs, scopes, and clock skew first.
							</p>
						</div>
						<div style={{ marginTop: '1.5rem' }}>
							<h3>Invalid Redirect URI</h3>
							<p>
								<strong>Error:</strong> <code>redirect_uri_mismatch</code>
								<br />
								<strong>Fix:</strong> The redirect URI must match exactly (scheme, host, path,
								trailing slash) with what's registered in PingOne.
							</p>
							<h3>Invalid Client</h3>
							<p>
								<strong>Error:</strong> <code>invalid_client</code>
								<br />
								<strong>Fix:</strong> Check client ID and secret. Ensure the application type
								(public vs confidential) matches your auth method (PKCE vs client_secret).
							</p>
							<h3>Invalid Grant</h3>
							<p>
								<strong>Error:</strong> <code>invalid_grant</code>
								<br />
								<strong>Fix:</strong> Authorization codes expire (typically 60s). Ensure the code
								hasn't been used, and the <code>code_verifier</code> matches the{' '}
								<code>code_challenge</code>.
							</p>
							<h3>Clock Skew / Token Expired</h3>
							<p>
								<strong>Error:</strong> ID token validation fails with <code>exp</code> check
								<br />
								<strong>Fix:</strong> PingOne allows ±5min clock skew. Ensure server time is
								NTP-synchronized.
							</p>
							<h3>400 Missing Required Fields (API)</h3>
							<p>
								<strong>Error:</strong> Backend returns 400 with "Missing required fields:
								environmentId, workerToken"
								<br />
								<strong>Fix:</strong> Configure your Environment ID and Worker Token in{' '}
								<Link to="/configuration" style={{ color: V9_COLORS.PRIMARY.BLUE }}>
									Configuration Management
								</Link>{' '}
								before using API-connected features.
							</p>
						</div>
					</CollapsibleHeader>
				</div>
			</ContentWrapper>
		</PageContainer>
	);
};

export default Documentation;
