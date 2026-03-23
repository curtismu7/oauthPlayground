// src/pages/docs/MCPDocumentation.tsx
// Model Context Protocol (MCP) documentation for MasterFlow API

import { Link } from 'react-router-dom';
import styled from 'styled-components';
import DocumentationHeader from '../../components/DocumentationHeader';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import PageLayoutService from '../../services/pageLayoutService';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

const pageConfig = {
	flowType: 'pingone' as const,
	theme: 'red' as const,
	maxWidth: '90rem',
	showHeader: true,
	showFooter: false,
	responsive: true,
};

const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

const MDIIcon: React.FC<{ icon: string; size?: number }> = ({ icon, size = 16 }) => {
	const iconMap: Record<string, string> = {
		FiBookOpen: 'mdi-book-open-page-variant',
		FiCode: 'mdi-code-tags',
		FiExternalLink: 'mdi-open-in-new',
		FiShield: 'mdi-shield-check',
		FiTool: 'mdi-tools',
	};
	return <i className={`mdi ${iconMap[icon] || 'mdi-help'}`} style={{ fontSize: `${size}px` }} />;
};

const ExternalLink = styled.a`
	color: ${V9_COLORS.PRIMARY.BLUE};
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-weight: 500;

	&:hover {
		text-decoration: underline;
	}
`;

const SpecLink = styled(ExternalLink)`
	font-weight: 600;
	font-size: 1.05rem;
`;

const CardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
	margin: 1rem 0;
`;

const DocCard = styled(Link)`
	background: ${V9_COLORS.BG.WHITE};
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	padding: 20px;
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
		font-size: 1rem;
		margin-bottom: 0.5rem;
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		font-weight: 600;
	}

	p {
		color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0;
	}
`;

const ComplianceTable = styled.div`
	overflow-x: auto;
	margin: 1rem 0;

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	}
	th {
		background: ${V9_COLORS.BG.GRAY_LIGHT};
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		font-weight: 600;
	}
`;

const ToolList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	line-height: 1.8;
	font-size: 0.9rem;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const ToolRow = styled.li`
	margin-bottom: 0.4rem;
`;

const ToolName = styled.code`
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	font-size: 0.85em;
`;

const MCPDocumentation: React.FC = () => {
	usePageScroll({ pageName: 'MCP Documentation', force: true });

	return (
		<PageContainer>
			<DocumentationHeader
				emoji="🤖"
				title="Model Context Protocol (MCP)"
				description="Open-source standard for connecting AI applications to external systems"
			/>
			<ContentWrapper>
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Official MCP Specification"
						subtitle="Authoritative specification and documentation"
						icon={<MDIIcon icon="FiBookOpen" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							The Model Context Protocol (MCP) is an open-source standard for connecting AI
							applications to data sources, tools, and workflows. MasterFlow API implements MCP to
							enable the MasterFlow Agent and other AI clients to interact with PingOne identity
							services.
						</p>
						<div
							style={{
								background: V9_COLORS.BG.GRAY_LIGHT,
								border: `1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER}`,
								borderRadius: '8px',
								padding: '20px',
								marginTop: '1rem',
							}}
						>
							<h3
								style={{ marginTop: 0, marginBottom: '0.75rem', color: V9_COLORS.TEXT.GRAY_DARK }}
							>
								Latest MCP Spec Links
							</h3>
							<ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
								<li style={{ marginBottom: '0.5rem' }}>
									<SpecLink
										href="https://modelcontextprotocol.io"
										target="_blank"
										rel="noopener noreferrer"
									>
										MCP Official Documentation
										<MDIIcon icon="FiExternalLink" size={14} />
									</SpecLink>
								</li>
								<li style={{ marginBottom: '0.5rem' }}>
									<SpecLink
										href="https://modelcontextprotocol.io/specification/2025-11-25"
										target="_blank"
										rel="noopener noreferrer"
									>
										MCP Specification 2025-11-25 (latest)
										<MDIIcon icon="FiExternalLink" size={14} />
									</SpecLink>
								</li>
								<li style={{ marginBottom: '0' }}>
									<SpecLink
										href="https://github.com/modelcontextprotocol/modelcontextprotocol"
										target="_blank"
										rel="noopener noreferrer"
									>
										MCP Specification Source (GitHub)
										<MDIIcon icon="FiExternalLink" size={14} />
									</SpecLink>
								</li>
							</ul>
						</div>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="What is MCP?"
						subtitle="Standardized way to connect AI to external systems"
						icon={<MDIIcon icon="FiTool" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							MCP is like a USB-C port for AI applications. Just as USB-C provides a standardized
							way to connect devices, MCP provides a standardized way to connect AI applications to
							data sources, tools, and workflows. Using MCP, AI assistants like Claude or ChatGPT
							can connect to local files, databases, search engines, and APIs— enabling them to
							access information and perform tasks on your behalf.
						</p>
						<p style={{ marginTop: '1rem' }}>
							MCP uses JSON-RPC 2.0 over stdio or Streamable HTTP. Servers expose tools (callable
							functions), resources (readable content), and prompts. Clients negotiate capabilities
							during initialization and invoke tools or read resources as needed.
						</p>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="PingOne MCP Tools - Complete List"
						subtitle="73 tools exposed by pingone-mcp-server"
						icon={<MDIIcon icon="FiTool" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p style={{ marginBottom: '1.5rem' }}>
							The <code>pingone-mcp-server</code> exposes <strong>73 PingOne operations</strong> as
							MCP tools. The backend <code>/api/mcp/query</code> uses the same tool semantics for
							the web AI Assistant. All tools follow MCP specification patterns with proper input
							schemas and error handling.
						</p>

						<CollapsibleHeader
							title="Worker Token & Auth (6 tools)"
							subtitle="Token issuance and authentication flows"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone.workerToken.issue</ToolName> — Exchange client credentials for
									worker token
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_worker_token</ToolName> — Get worker token (legacy alias)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.auth.login</ToolName> — Initiate user login flow
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.auth.logout</ToolName> — End user session
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.auth.refresh</ToolName> — Refresh access token
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.auth.userinfo</ToolName> — Get authenticated user info
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Users - Read (6 tools)"
							subtitle="Get, list, and lookup user information"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_get_user</ToolName> — Get user profile by ID
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_list_users</ToolName> — List users with SCIM filter and
									pagination
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_lookup_users</ToolName> — Look up users by UUID or
									username/email
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_user_groups</ToolName> — Get groups for a user
									(memberOfGroups)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_user_roles</ToolName> — Get role assignments for a user
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_user_consents</ToolName> — Get user consent grants
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Users - Write (6 tools)"
							subtitle="Create, update, delete users and manage group membership"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_create_user</ToolName> — Create user (requires username +
									population.id)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_update_user</ToolName> — Update user profile (PATCH)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_delete_user</ToolName> — Delete user (irreversible)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_add_user_to_group</ToolName> — Add user to group (supports name
									lookup)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_remove_user_from_group</ToolName> — Remove user from group
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_check_username_password</ToolName> — Validate credentials in
									flow context
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Groups (5 tools)"
							subtitle="List and manage groups"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_list_groups</ToolName> — List groups (SCIM filter + limit)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_group</ToolName> — Get group by ID
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_create_group</ToolName> — Create new group
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_update_group</ToolName> — Update group properties
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_delete_group</ToolName> — Delete group
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Applications (8 tools)"
							subtitle="Manage OAuth/OIDC applications"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone.applications.list</ToolName> — List all applications
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_application</ToolName> — Get application by ID
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_application_resources</ToolName> — Get resource (scopes)
									config
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_application_secret</ToolName> — Get application client
									secret
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_rotate_application_secret</ToolName> — Rotate client secret
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_create_application</ToolName> — Create new application
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_update_application</ToolName> — Update application config
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_delete_application</ToolName> — Delete application
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="OIDC & OAuth (7 tools)"
							subtitle="Discovery, tokens, and JWT utilities"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_oidc_config</ToolName> — OIDC discovery for environment (no
									auth)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_oidc_discovery</ToolName> — OIDC discovery from arbitrary issuer
									URL
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_introspect_token</ToolName> — Token introspection (RFC 7662)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_device_authorization</ToolName> — Device authorization (RFC
									8628)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_token_exchange</ToolName> — Token exchange (RFC 8693)
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_userinfo</ToolName> — UserInfo endpoint with token
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_decode_jwt</ToolName> — Decode and inspect JWT tokens
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="MFA Devices (15 tools)"
							subtitle="Multi-factor authentication device management"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone.mfa.devices.list</ToolName> — List user's MFA devices
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.register</ToolName> — Register new MFA device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.activate</ToolName> — Activate MFA device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.delete</ToolName> — Delete MFA device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.block</ToolName> — Block MFA device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.unblock</ToolName> — Unblock MFA device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.unlock</ToolName> — Unlock MFA device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.nickname</ToolName> — Set device nickname
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.reorder</ToolName> — Reorder MFA devices
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.reorder.remove</ToolName> — Remove from device order
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.devices.otp</ToolName> — Generate OTP for device
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.challenge.send</ToolName> — Send MFA challenge
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.challenge.validate</ToolName> — Validate MFA challenge
									response
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.bypass.check</ToolName> — Check MFA bypass status
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.bypass.allow</ToolName> — Allow MFA bypass
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="MFA Policies (4 tools)"
							subtitle="Manage MFA policies"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone.mfa.policy.list</ToolName> — List MFA policies
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.policy.get</ToolName> — Get MFA policy by ID
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.policy.create</ToolName> — Create MFA policy
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.mfa.policy.update</ToolName> — Update MFA policy
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Redirectless Flows (3 tools)"
							subtitle="Headless authentication flows"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone.redirectless.start</ToolName> — Start redirectless flow
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.redirectless.poll</ToolName> — Poll flow status
								</ToolRow>
								<ToolRow>
									<ToolName>pingone.redirectless.complete</ToolName> — Complete redirectless flow
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Populations & Passwords (4 tools)"
							subtitle="User populations and password management"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_list_populations</ToolName> — List populations
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_population</ToolName> — Get population by ID
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_password_state</ToolName> — Get password state for user
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_password_send_recovery_code</ToolName> — Send password recovery
									code
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Subscriptions & Risk (6 tools)"
							subtitle="Webhook subscriptions and risk evaluation"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_list_subscriptions</ToolName> — List webhook subscriptions
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_get_subscription</ToolName> — Get subscription by ID
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_create_subscription</ToolName> — Create webhook subscription
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_update_subscription</ToolName> — Update subscription
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_delete_subscription</ToolName> — Delete subscription
								</ToolRow>
								<ToolRow>
									<ToolName>pingone_risk_evaluation</ToolName> — Evaluate authentication risk
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Organization (1 tool)"
							subtitle="Organization-level operations"
							defaultCollapsed={true}
							theme="ping"
						>
							<ToolList>
								<ToolRow>
									<ToolName>pingone_get_organization_licenses</ToolName> — Get organization licenses
								</ToolRow>
							</ToolList>
						</CollapsibleHeader>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="MasterFlow API MCP Implementation"
						subtitle="Our pingone-mcp-server conforms to the MCP specification"
						icon={<MDIIcon icon="FiCode" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							The <strong>pingone-mcp-server</strong> in this repo implements MCP to expose{' '}
							<strong>73 PingOne identity operations</strong> as tools. It uses the official{' '}
							<ExternalLink
								href="https://www.npmjs.com/package/@modelcontextprotocol/sdk"
								target="_blank"
								rel="noopener noreferrer"
							>
								@modelcontextprotocol/sdk
							</ExternalLink>
							, JSON-RPC 2.0 over stdio, and follows MCP patterns for tools, resources, error
							handling, and capability negotiation.
						</p>

						<h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Compliance Summary</h3>
						<ComplianceTable>
							<table>
								<thead>
									<tr>
										<th>Area</th>
										<th>Status</th>
										<th>Notes</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Base protocol</td>
										<td>✅</td>
										<td>JSON-RPC 2.0, stdio transport, SDK</td>
									</tr>
									<tr>
										<td>Tools</td>
										<td>✅</td>
										<td>73 tools with name, description, inputSchema</td>
									</tr>
									<tr>
										<td>Resources</td>
										<td>✅</td>
										<td>pingone://applications resource</td>
									</tr>
									<tr>
										<td>listChanged</td>
										<td>✅</td>
										<td>Capability + debounced notifications</td>
									</tr>
									<tr>
										<td>Cancellation</td>
										<td>✅</td>
										<td>AbortSignal support for user tools</td>
									</tr>
									<tr>
										<td>Error handling</td>
										<td>✅</td>
										<td>Protocol + tool errors with isError pattern</td>
									</tr>
									<tr>
										<td>Security</td>
										<td>✅</td>
										<td>Input validation, credential handling</td>
									</tr>
								</tbody>
							</table>
						</ComplianceTable>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Related Resources"
						subtitle="Explore MCP and PingOne integration"
						icon={<MDIIcon icon="FiExternalLink" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<CardGrid>
							<DocCard to="/mcp-server">
								<h3>MCP Server Config</h3>
								<p>Configure and test the PingOne MCP server in MasterFlow API.</p>
							</DocCard>
							<DocCard to="/ai-assistant">
								<h3>MasterFlow Agent</h3>
								<p>AI assistant that uses MCP tools to interact with PingOne.</p>
							</DocCard>
							<DocCard to="/ai-agent-overview">
								<h3>AI Agent Overview</h3>
								<p>Architecture and capabilities of our AI integration.</p>
							</DocCard>
						</CardGrid>

						<p style={{ marginTop: '1rem', color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
							External links:{' '}
							<ExternalLink
								href="https://modelcontextprotocol.io/clients"
								target="_blank"
								rel="noopener noreferrer"
							>
								MCP Clients
							</ExternalLink>
							{' · '}
							<ExternalLink
								href="https://github.com/modelcontextprotocol/servers"
								target="_blank"
								rel="noopener noreferrer"
							>
								MCP Server Examples
							</ExternalLink>
							{' · '}
							<ExternalLink
								href="https://github.com/modelcontextprotocol/inspector"
								target="_blank"
								rel="noopener noreferrer"
							>
								MCP Inspector
							</ExternalLink>
						</p>
					</CollapsibleHeader>
				</div>
			</ContentWrapper>
		</PageContainer>
	);
};

export default MCPDocumentation;
