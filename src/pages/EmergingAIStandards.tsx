import {
	FiAlertCircle,
	FiGitBranch,
	FiGlobe,
	FiLayers,
	FiLink,
	FiShield,
	FiUsers,
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody } from '../components/Card';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import { PageLayoutService } from '../services/pageLayoutService';

const SummaryCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
`;

const SpecCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.info};
  height: 100%;
`;

const SpecIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const SpecTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const SpecSummary = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const SpecList = styled.ul`
  margin: 0 0 1.25rem 1.25rem;
  color: ${({ theme }) => theme.colors.gray700};
  line-height: 1.6;
`;

const ResourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Highlight = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.success}10;
  color: ${({ theme }) => theme.colors.success};
  font-weight: 600;
`;

const specData = [
	{
		title: 'Client ID Metadata Document (CIMD)',
		icon: <FiGlobe />,
		summary:
			'Enables authorization servers to fetch rich client metadata directly from a URL-based client_id, bypassing pre-registration requirements and supporting open ecosystems of AI agents.',
		points: [
			'Transforms client_id into a resolvable HTTPS URL hosting OAuth client metadata.',
			'Supports dynamic trust establishment when the server and agent have no prior relationship.',
			'Recently adopted as an official work item by the IETF OAuth Working Group.',
		],
		link: {
			href: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document',
			label: 'Read the CIMD draft',
		},
	},
	{
		title: 'Identity Assertion Authorization Grant (ID-JAG)',
		icon: <FiUsers />,
		summary:
			'Coordinates enterprise identities so an agent can exchange a trusted identity assertion for access tokens targeting third-party APIs, using OAuth Token Exchange and JWT grant profiles.',
		points: [
			'Introduces a grant that accepts identity assertions from a common enterprise identity provider.',
			'Builds on RFC8693 Token Exchange and RFC7523 JWT Profile for Authorization Grants.',
			'Targets cross-application access where AI agents operate on behalf of enterprise users.',
		],
		link: {
			href: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant',
			label: 'Review the ID-JAG proposal',
		},
	},
	{
		title: 'Identity and Authorization Chaining',
		icon: <FiLayers />,
		summary:
			'Preserves identity context and authorization data across multiple trust domains so chained services can verify who initiated a request and under which policy.',
		points: [
			'Defines mechanisms to carry authoritative identity attributes across OAuth domains.',
			'Complements ID-JAG by keeping authorization context intact during token hand-offs.',
			'Facilitates enterprise-grade auditability for AI-driven delegated actions.',
		],
		link: {
			href: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining',
			label: 'Explore identity chaining',
		},
	},
	{
		title: 'Model Context Protocol (MCP) Client Registration',
		icon: <FiGitBranch />,
		summary:
			'The MCP ecosystem is reevaluating traditional Dynamic Client Registration for personal agents, experimenting with CIMD to streamline discovery and trust establishment.',
		points: [
			'Highlights limitations of Dynamic Client Registration when agents and servers are unknown to each other.',
			'Proposes URL-based client identifiers to align with CIMD capabilities.',
			'Signals active collaboration between MCP contributors and OAuth standards leads.',
		],
		link: {
			href: 'https://blog.modelcontextprotocol.io/posts/client_registration',
			label: 'Read the MCP analysis',
		},
	},
];

const resourceLinks = [
	{
		label: 'GitHub: MCP enhancement proposal for CIMD',
		href: 'https://github.com/modelcontextprotocol/modelcontextprotocol/issues/991',
	},
	{
		label: 'Cross-App Access and MCP Enterprise Identity Integration',
		href: 'https://docs.google.com/document/d/14FGg98Gng2Jne2_kctdpcWU_CFULhmjAn-fY3tu0ssI/edit?tab=t.0#heading=h.igzso6n0gtjb',
	},
];

const EmergingAIStandards = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'purple' as const,
		maxWidth: '72rem',
		showHeader: true,
		showFooter: false,
		responsive: true,
	};

	const { PageContainer, ContentWrapper, SectionContainer, ContentGrid, Spacing } =
		PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader flowId="emerging-ai-standards" />

				<SectionContainer>
					<CollapsibleHeader
						title="Why AI agents need new OAuth primitives"
						subtitle="Dynamic Client Registration alone cannot sustain autonomous agent ecosystems"
						icon={<FiAlertCircle />}
						defaultCollapsed={false}
						theme="orange"
					>
						<SummaryCard>
							<CardBody>
								<p>
									Personal and enterprise AI agents increasingly interact with services that have no
									advance knowledge of the client. Traditional Dynamic Client Registration forces
									prior trust arrangements and manual approvals, creating friction that stalls
									emerging agent-to-service topologies. The community is responding with
									URL-addressable client metadata, assertion-based grants, and cross-domain identity
									chaining to preserve security while enabling spontaneous collaboration.
								</p>
								<Highlight>
									<FiLink />
									Coordinated standards work across the IETF OAuth Working Group and the Model
									Context Protocol is accelerating these capabilities.
								</Highlight>
							</CardBody>
						</SummaryCard>
					</CollapsibleHeader>
				</SectionContainer>

				<Spacing />

				<SectionContainer>
					<CollapsibleHeader
						title="Specifications shaping the AI agent ecosystem"
						subtitle="Four converging efforts define discovery, identity, and delegation for autonomous clients"
						icon={<FiShield />}
						defaultCollapsed={false}
						theme="purple"
					>
						<ContentGrid>
							{specData.map((spec) => (
								<SpecCard key={spec.title}>
									<CardBody>
										<SpecIcon>{spec.icon}</SpecIcon>
										<SpecTitle>{spec.title}</SpecTitle>
										<SpecSummary>{spec.summary}</SpecSummary>
										<SpecList>
											{spec.points.map((point) => (
												<li key={point}>{point}</li>
											))}
										</SpecList>
										<ResourceLink href={spec.link.href} target="_blank" rel="noopener noreferrer">
											<FiLink />
											{spec.link.label}
										</ResourceLink>
									</CardBody>
								</SpecCard>
							))}
						</ContentGrid>
					</CollapsibleHeader>
				</SectionContainer>

				<Spacing />

				<SectionContainer>
					<CollapsibleHeader
						title="Further reading"
						subtitle="Key discussions and reference material from industry contributors"
						icon={<FiGitBranch />}
						defaultCollapsed={false}
						theme="green"
					>
						<Card>
							<CardBody>
								<SpecList>
									{resourceLinks.map((item) => (
										<li key={item.href}>
											<ResourceLink href={item.href} target="_blank" rel="noopener noreferrer">
												<FiLink />
												{item.label}
											</ResourceLink>
										</li>
									))}
								</SpecList>
								<p>
									These resources capture the ongoing collaboration between standards leaders,
									including Brian Campbell, Aaron Parecki, and the Model Context Protocol community,
									as they align OAuth extensions with real-world agent requirements.
								</p>
							</CardBody>
						</Card>
					</CollapsibleHeader>
				</SectionContainer>
			</ContentWrapper>
		</PageContainer>
	);
};

export default EmergingAIStandards;
