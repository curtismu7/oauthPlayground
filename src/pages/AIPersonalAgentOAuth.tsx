import { FiAlertTriangle, FiArrowRight, FiExternalLink, FiLayers, FiTrendingUp } from '@icons';
import styled from 'styled-components';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';

const Content = styled.div`
	display: grid;
	gap: clamp(1.75rem, 4vw, 2.5rem);
`;

const IntroCard = styled.section`
	background: #0f172a;
	color: #e2e8f0;
	border-radius: 1.25rem;
	padding: clamp(1.75rem, 5vw, 2.5rem);
	display: grid;
	gap: 1.5rem;
	box-shadow: 0 25px 35px -20px rgba(15, 23, 42, 0.6);
`;

const IntroTitle = styled.h1`
	font-size: clamp(1.9rem, 4vw, 2.4rem);
	font-weight: 700;
	margin: 0;
`;

const IntroLead = styled.p`
	margin: 0;
	font-size: clamp(1.075rem, 3vw, 1.2rem);
	line-height: 1.7;
	color: rgba(226, 232, 240, 0.85);
`;

const Callout = styled.div<{ $tone?: 'warning' | 'vision' }>`
	border-radius: 1rem;
	padding: 1.5rem;
	display: grid;
	gap: 0.75rem;
	background: ${({ $tone }) =>
		$tone === 'warning' ? 'rgba(254, 226, 226, 0.8)' : 'rgba(59, 130, 246, 0.12)'};
	border: 1px solid ${({ $tone }) => ($tone === 'warning' ? '#fca5a5' : '#60a5fa')};
`;

const CalloutTitle = styled.h3`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.6rem;
	font-size: 1.05rem;
	font-weight: 600;
	color: #0f172a;
`;

const SectionText = styled.p`
	margin: 0;
	color: #1e293b;
	line-height: 1.75;
	font-size: 1rem;
`;

const HighlightList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	color: #1f2937;
	font-size: 1rem;
	line-height: 1.7;
	display: grid;
	gap: 0.6rem;
`;

const ExternalLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: #2563eb;
	text-decoration: none;
	font-weight: 600;

	&:hover {
		color: #1d4ed8;
		text-decoration: underline;
	}
`;

const RoadmapGrid = styled.div`
	display: grid;
	gap: 1.25rem;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const RoadmapCard = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 1.5rem;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 18px 25px -22px rgba(15, 23, 42, 0.35);
	display: grid;
	gap: 0.9rem;
`;

const CardTitle = styled.h3`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.6rem;
	font-size: 1.05rem;
	font-weight: 600;
	color: #0f172a;
`;

const CardBody = styled.div`
	color: #334155;
	font-size: 0.98rem;
	line-height: 1.7;
	display: grid;
	gap: 0.6rem;
`;

const StepList = styled.ol`
	margin: 0;
	padding-left: 1.25rem;
	display: grid;
	gap: 0.75rem;
	color: #1f2937;
`;

const LinkGroup = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const AIPersonalAgentOAuth = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'ai-personal-agent-oauth',
	};

	const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				<Content>
					<IntroCard>
						<IntroTitle>Evolving MCP Authorization for Agentic Clients</IntroTitle>
						<IntroLead>
							The Model Context Protocol adopted OAuth 2.1 for agent authorization, but real-world
							deployments show that traditional Dynamic Client Registration breaks down when
							personal or ephemeral agents appear without warning. New proposals streamline how an
							assistant proves its identity, publishes policy, and exchanges assertions on behalf of
							users.
						</IntroLead>
						<LinkGroup>
							<ExternalLink
								href="https://blog.modelcontextprotocol.io/posts/client_registration/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Evolving OAuth Client Registration in MCP
								<FiExternalLink size={16} />
							</ExternalLink>
							<ExternalLink
								href="https://www.ietf.org/archive/id/draft-parecki-oauth-client-id-metadata-document-03.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								OAuth Client ID Metadata Document
								<FiExternalLink size={16} />
							</ExternalLink>
							<ExternalLink
								href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Identity Assertion Authorization Grant
								<FiExternalLink size={16} />
							</ExternalLink>
							<ExternalLink
								href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Identity Chaining Draft
								<FiExternalLink size={16} />
							</ExternalLink>
						</LinkGroup>
					</IntroCard>

					<CollapsibleHeader
						title="Why OAuth 2.1 DCR Falls Short for Personal Agents"
						subtitle="MCP deployments need on-demand registration that preserves user safety and operator trust"
						icon={<FiAlertTriangle />}
						defaultCollapsed={false}
					>
						<SectionText>
							The MCP blog highlights two blockers with classic Dynamic Client Registration (DCR).
							First, relying on a shared out-of-band onboarding ceremony fails because client and
							server operators frequently meet for the first time when a user connects their
							personal assistant. Second, registration endpoints in the wild still require human
							approval or duplicated metadata, delaying the conversational experience that agents
							promise.
						</SectionText>
						<Callout $tone="warning">
							<CalloutTitle>
								<FiAlertTriangle />
								Operational obstacles called out in the MCP post
							</CalloutTitle>
							<HighlightList>
								<li>Ad-hoc agents spawn per task, so pre-registration cannot scale.</li>
								<li>Manual vetting stalls conversation setup, breaking user expectations.</li>
								<li>
									Relying parties still need cryptographic assurance about the assistant they are
									authorizing.
								</li>
							</HighlightList>
						</Callout>
					</CollapsibleHeader>

					<CollapsibleHeader
						title="Self-Describing Clients via Metadata Documents"
						subtitle="Using a client_id URL to bootstrap trust without pre-registration"
						icon={<FiLayers />}
						defaultCollapsed={false}
					>
						<SectionText>
							The draft OAuth Client ID Metadata Document introduces a pragmatic bridge. Instead of
							minting a UUID, the personal agent presents a URL as its client_id. The authorization
							server dereferences that URL, retrieves a signed metadata document, and learns
							everything it needs to treat the agent as a first-class OAuth client.
						</SectionText>
						<HighlightList>
							<li>
								Enables self-asserted registration while retaining policy controls per authorization
								server.
							</li>
							<li>
								Document fields align with existing DCR metadata, so servers can reuse validation
								logic.
							</li>
							<li>
								Supports rotation by pointing to updated policy or signing keys without breaking the
								client_id.
							</li>
						</HighlightList>
						<SectionText>
							For MCP ecosystems this means a digital assistant can ship its metadata endpoint once.
							Any compatible server can fetch analytics, supported scopes, or custom privacy
							disclosures before issuing tokens.
						</SectionText>
					</CollapsibleHeader>

					<CollapsibleHeader
						title="Identity Assertions Build End-to-End Trust"
						subtitle="Moving beyond registration into delegated identity guarantees"
						icon={<FiTrendingUp />}
						defaultCollapsed={false}
					>
						<SectionText>
							Registration alone does not grant the assistant permission to wield user data. The
							Identity Assertion Authorization Grant couples the metadata document with a verifiable
							assertion that the assistant can act for a user in a given context. It layers on top
							of Token Exchange (RFC 8693) and the JWT Profile for OAuth 2.0 Authorization Grants
							(RFC 7523), reusing well understood token formats.
						</SectionText>
						<RoadmapGrid>
							<RoadmapCard>
								<CardTitle>
									<FiArrowRight />
									Identity Assertion Authorization Grant
								</CardTitle>
								<CardBody>
									<SectionText>
										The draft specification lets a relying party accept a signed assertion from an
										enterprise or platform identity provider, then exchange it for an access token
										targeted at a third-party API. This aligns with MCP multi-tenant scenarios where
										the assistant mediates between users and specialized tools.
									</SectionText>
									<ExternalLink
										href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/"
										target="_blank"
										rel="noopener noreferrer"
									>
										Draft overview
										<FiExternalLink size={16} />
									</ExternalLink>
								</CardBody>
							</RoadmapCard>
							<RoadmapCard>
								<CardTitle>
									<FiArrowRight />
									Identity Chaining for Assistants
								</CardTitle>
								<CardBody>
									<SectionText>
										The Identity Chaining draft defines how multiple identity providers can
										collaborate so that downstream APIs understand the full delegation path. It
										builds directly on the identity assertion draft, enabling assistants to present
										layered claims about enterprises, agents, and end users.
									</SectionText>
									<ExternalLink
										href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/"
										target="_blank"
										rel="noopener noreferrer"
									>
										Draft overview
										<FiExternalLink size={16} />
									</ExternalLink>
								</CardBody>
							</RoadmapCard>
						</RoadmapGrid>
					</CollapsibleHeader>

					<CollapsibleHeader
						title="Implementation Checklist for MCP Integrators"
						subtitle="Practical steps to get from experimentation to production"
						icon={<FiArrowRight />}
						defaultCollapsed={false}
					>
						<StepList>
							<li>
								Adopt metadata documents for agent registration so servers can evaluate policy
								before issuing credentials.
							</li>
							<li>
								Leverage token exchange capabilities already shipping with MCP to wire assertions
								into downstream APIs.
							</li>
							<li>
								Plan for identity chaining so enterprise controls and user consent flow through
								every resource boundary.
							</li>
						</StepList>
					</CollapsibleHeader>
				</Content>
			</ContentWrapper>
		</PageContainer>
	);
};

export default AIPersonalAgentOAuth;
