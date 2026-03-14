// src/pages/docs/MCPDocumentation.tsx
// Model Context Protocol (MCP) documentation for MasterFlow API

import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import PageLayoutService from '../../services/pageLayoutService';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

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
	transition: transform 0.2s, box-shadow 0.2s;
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
			{PageHeader ? (
				<PageHeader>
					<h1>Model Context Protocol (MCP)</h1>
					<p>Open-source standard for connecting AI applications to external systems</p>
				</PageHeader>
			) : null}
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
							applications to data sources, tools, and workflows. MasterFlow API implements MCP
							to enable the MasterFlow Agent and other AI clients to interact with PingOne
							identity services.
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
							<h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: V9_COLORS.TEXT.GRAY_DARK }}>
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
							way to connect devices, MCP provides a standardized way to connect AI applications
							to data sources, tools, and workflows. Using MCP, AI assistants like Claude or
							ChatGPT can connect to local files, databases, search engines, and APIs—
							enabling them to access information and perform tasks on your behalf.
						</p>
						<p style={{ marginTop: '1rem' }}>
							MCP uses JSON-RPC 2.0 over stdio or Streamable HTTP. Servers expose tools (callable
							functions), resources (readable content), and prompts. Clients negotiate
							capabilities during initialization and invoke tools or read resources as needed.
						</p>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Protocol Communication (MCP Spec 2025-11-25)"
						subtitle="JSON-RPC 2.0 between Hosts, Clients, and Servers"
						icon={<MDIIcon icon="FiCode" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							Per the <SpecLink
								href="https://modelcontextprotocol.io/specification/2025-11-25"
								target="_blank"
								rel="noopener noreferrer"
							>
								MCP Specification 2025-11-25
								<MDIIcon icon="FiExternalLink" size={14} />
							</SpecLink>
							, the protocol uses <strong>JSON-RPC 2.0</strong> messages to establish
							communication between:
						</p>
						<ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
							<li><strong>Hosts</strong> — LLM applications that initiate connections. The MasterFlow API web app is the Host when it embeds the AI Assistant.</li>
							<li><strong>Clients</strong> — Connectors within the host application. The MasterFlow Agent acts as a Client when it sends MCP-style requests to the backend or pingone-mcp-server.</li>
							<li><strong>Servers</strong> — Services that provide context and capabilities. The <code>pingone-mcp-server</code> and our backend <code>/api/mcp/query</code> proxy both act as MCP servers, exposing PingOne tools.</li>
						</ul>
						<p style={{ marginTop: '1rem', color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
							MCP takes inspiration from the Language Server Protocol. In the same way LSP standardizes programming language support across tools, MCP standardizes how AI applications integrate context and tools.
						</p>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="AI Assistant Flow: How MCP, Host, and Agent Interact"
						subtitle="User → Host → Agent → MCP → PingOne"
						icon={<MDIIcon icon="FiCode" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							When you use the <strong>MasterFlow Agent</strong> (AI Assistant), several components work together. Understanding this flow helps you see how natural-language queries become PingOne API calls.
						</p>

						<h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Components</h3>
						<ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
							<li><strong>User</strong> — Types a natural-language query (e.g. &quot;List all users&quot;, &quot;Get worker token&quot;) in the chat.</li>
							<li><strong>Host</strong> — The MasterFlow API web app (React) that embeds the AI Assistant UI and handles routing, configuration, and worker token storage.</li>
							<li><strong>Agent</strong> — The AI Assistant component. It classifies the query (worker token, help, list tools, userinfo, or general MCP), sends MCP-style requests to the backend, and renders responses (including McpResultCard for live data).</li>
							<li><strong>MCP client (backend)</strong> — The <code>POST /api/mcp/query</code> endpoint. It matches the query to a tool intent (MCP_INTENTS), calls the PingOne API directly, and returns structured data (tool name, API call, result, explanation).</li>
							<li><strong>pingone-mcp-server</strong> — The standalone MCP server (stdio) that implements the same tools. Used by MCP Inspector, Cursor, and other MCP clients. The web backend replicates this tool semantics for browser use.</li>
							<li><strong>PingOne APIs</strong> — Management API, OIDC, Auth, etc. The source of real identity data.</li>
						</ul>

						<h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Flow (with Live MCP ON)</h3>
						<ol style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
							<li>User types a query in the AI Assistant.</li>
							<li>Agent checks: worker token? help? list tools? userinfo? Or a general MCP query (when Live toggle is on).</li>
							<li>Agent calls <code>callMcpQuery(query)</code> → <code>POST /api/mcp/query</code> with worker token and environment ID.</li>
							<li>Backend matches query to MCP_INTENTS, selects the PingOne tool/operation, and calls the PingOne API.</li>
							<li>Backend returns <code>McpQueryResult</code> (success, tool name, API path, data, howItWorks).</li>
							<li>Agent renders McpResultCard with the tool, API call, and result for learning.</li>
						</ol>

						<p style={{ marginTop: '1rem', color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
							For conversational answers (no Live data), the Agent uses Groq. When Live is ON and the query matches a PingOne operation, it goes through the MCP path above.
						</p>
						<p style={{ marginTop: '0.5rem' }}>
							<Link to="/ai-assistant">Open MasterFlow Agent</Link> to try it.
						</p>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Token Exchange &amp; Mock Agent Flow"
						subtitle="PingOne Token Exchange and educational mock flow"
						icon={<MDIIcon icon="FiShield" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							<strong>Token Exchange command</strong> (planned): The AI Assistant will support a dedicated &quot;Token exchange&quot; command that prompts for username/password, runs Authorization Code flow with PingOne (<code>response_mode=pi.flow</code>), then uses PingOne Token Exchange (RFC 8693) to obtain a new token with broader scope for additional MCP operations.
						</p>
						<p style={{ marginTop: '1rem' }}>
							<strong>Mock Agent flow</strong> (planned): An educational flow will simulate an Agent, MCP server, and Token Exchange to demonstrate how MCP, tokens, and token exchange work together per the spec.
						</p>
						<p style={{ marginTop: '1rem' }}>
							Full implementation plan: <code>docs/MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md</code> (Token Exchange command flow, Mock Agent+MCP+Token Exchange design).
						</p>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="PingOne MCP Tools"
						subtitle="70+ tools exposed by pingone-mcp-server (collapse to browse by category)"
						icon={<MDIIcon icon="FiTool" />}
						defaultCollapsed={true}
						theme="ping"
					>
						<p style={{ marginBottom: '1rem' }}>
							The <code>pingone-mcp-server</code> exposes these PingOne operations as MCP tools. The backend <code>/api/mcp/query</code> uses the same tool semantics for the web AI Assistant.
						</p>

						<CollapsibleHeader title="Worker &amp; Auth" subtitle="Token and session management" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_get_worker_token</ToolName> / <ToolName>pingone.workerToken.issue</ToolName> — Exchange client credentials for worker token.</ToolRow>
								<ToolRow><ToolName>pingone.applications.list</ToolName> — List applications (worker token or client credentials).</ToolRow>
								<ToolRow><ToolName>pingone.auth.*</ToolName> — Login, logout, refresh, userinfo (auth flows).</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader title="Users" subtitle="Get, list, lookup users" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_get_user</ToolName> — Get user profile by ID.</ToolRow>
								<ToolRow><ToolName>pingone_list_users</ToolName> — List users with optional SCIM filter + pagination.</ToolRow>
								<ToolRow><ToolName>pingone_lookup_users</ToolName> — Look up users by UUID or username/email.</ToolRow>
								<ToolRow><ToolName>pingone_get_user_groups</ToolName> — Get groups for a user (memberOfGroups).</ToolRow>
								<ToolRow><ToolName>pingone_get_user_roles</ToolName> — Get role assignments for a user.</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader title="User CRUD" subtitle="Create, update, delete users" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_create_user</ToolName> — Create user (requires username + population.id).</ToolRow>
								<ToolRow><ToolName>pingone_update_user</ToolName> — Update user (PATCH).</ToolRow>
								<ToolRow><ToolName>pingone_delete_user</ToolName> — Delete user (irreversible).</ToolRow>
								<ToolRow><ToolName>pingone_add_user_to_group</ToolName> — Add user to group (supports name lookup).</ToolRow>
								<ToolRow><ToolName>pingone_remove_user_from_group</ToolName> — Remove user from group.</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader title="Groups" subtitle="List and manage groups" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_list_groups</ToolName> — List groups (SCIM filter + limit).</ToolRow>
								<ToolRow><ToolName>pingone_get_group</ToolName> — Get group by ID.</ToolRow>
								<ToolRow><ToolName>pingone_create_group</ToolName>, <ToolName>pingone_update_group</ToolName>, <ToolName>pingone_delete_group</ToolName> — CRUD.</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader title="Applications" subtitle="Get and manage applications" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_get_application</ToolName> — Get application by ID.</ToolRow>
								<ToolRow><ToolName>pingone_get_application_resources</ToolName> — Get resource (scopes) config.</ToolRow>
								<ToolRow><ToolName>pingone_get_application_secret</ToolName>, <ToolName>pingone_rotate_application_secret</ToolName> — Secrets.</ToolRow>
								<ToolRow><ToolName>pingone_create_application</ToolName>, <ToolName>pingone_update_application</ToolName>, <ToolName>pingone_delete_application</ToolName> — CRUD.</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader title="OIDC &amp; OAuth" subtitle="Discovery and tokens" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_oidc_config</ToolName> — OIDC discovery for environment (no auth).</ToolRow>
								<ToolRow><ToolName>pingone_oidc_discovery</ToolName> — OIDC discovery from arbitrary issuer URL.</ToolRow>
								<ToolRow><ToolName>pingone_introspect_token</ToolName> — Token introspection (RFC 7662).</ToolRow>
								<ToolRow><ToolName>pingone_device_authorization</ToolName> — Device authorization (RFC 8628).</ToolRow>
								<ToolRow><ToolName>pingone_token_exchange</ToolName> — Exchange auth code (or other grant) for tokens.</ToolRow>
								<ToolRow><ToolName>pingone_userinfo</ToolName> — UserInfo with token.</ToolRow>
							</ToolList>
						</CollapsibleHeader>

						<CollapsibleHeader title="Directory &amp; Other" subtitle="Populations, passwords, MFA, redirectless" defaultCollapsed={true} theme="ping">
							<ToolList>
								<ToolRow><ToolName>pingone_get_population</ToolName>, <ToolName>pingone_list_populations</ToolName> — Populations.</ToolRow>
								<ToolRow><ToolName>pingone_password_state</ToolName>, <ToolName>pingone_password_send_recovery_code</ToolName> — Password ops.</ToolRow>
								<ToolRow><ToolName>pingone.mfa.*</ToolName> — MFA devices, policies, challenges.</ToolRow>
								<ToolRow><ToolName>pingone.redirectless.*</ToolName> — Redirectless flows.</ToolRow>
								<ToolRow><ToolName>pingone_get_organization_licenses</ToolName> — Show org licenses.</ToolRow>
								<ToolRow><ToolName>pingone_check_username_password</ToolName> — Validate credentials in flow context.</ToolRow>
							</ToolList>
						</CollapsibleHeader>
					</CollapsibleHeader>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="AI Assistant Flow: How MCP, Host, and Agent Interact"
						subtitle="User → Host → Agent → MCP → PingOne"
						icon={<MDIIcon icon="FiCode" />}
						defaultCollapsed={false}
						theme="ping"
					>
						<p>
							When you use the <strong>MasterFlow Agent</strong> (AI Assistant), several components work together. Understanding this flow helps you see how natural-language queries become PingOne API calls.
						</p>

						<h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Components</h3>
						<ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
							<li><strong>User</strong> — Types a natural-language query (e.g. &quot;List all users&quot;, &quot;Get worker token&quot;) in the chat.</li>
							<li><strong>Host</strong> — The MasterFlow API web app (React) that embeds the AI Assistant UI and handles routing, configuration, and worker token storage.</li>
							<li><strong>Agent</strong> — The AI Assistant component. It classifies the query (worker token, help, list tools, userinfo, or general MCP), sends MCP-style requests to the backend, and renders responses (including McpResultCard for live data).</li>
							<li><strong>MCP client (backend)</strong> — The <code>POST /api/mcp/query</code> endpoint. It matches the query to a tool intent (MCP_INTENTS), calls the PingOne API directly, and returns structured data (tool name, API call, result, explanation).</li>
							<li><strong>pingone-mcp-server</strong> — The standalone MCP server (stdio) that implements the same tools. Used by MCP Inspector, Cursor, and other MCP clients. The web backend replicates this tool semantics for browser use.</li>
							<li><strong>PingOne APIs</strong> — Management API, OIDC, Auth, etc. The source of real identity data.</li>
						</ul>

						<h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Flow (with Live MCP ON)</h3>
						<ol style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
							<li>User types a query in the AI Assistant.</li>
							<li>Agent checks: worker token? help? list tools? userinfo? Or a general MCP query (when Live toggle is on).</li>
							<li>Agent calls <code>callMcpQuery(query)</code> → <code>POST /api/mcp/query</code> with worker token and environment ID.</li>
							<li>Backend matches query to MCP_INTENTS, selects the PingOne tool/operation, and calls the PingOne API.</li>
							<li>Backend returns <code>McpQueryResult</code> (success, tool name, API path, data, howItWorks).</li>
							<li>Agent renders McpResultCard with the tool, API call, and result for learning.</li>
						</ol>

						<p style={{ marginTop: '1rem', color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
							For conversational answers (no Live data), the Agent uses Groq. When Live is ON and the query matches a PingOne operation, it goes through the MCP path above.
						</p>
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
							The <strong>pingone-mcp-server</strong> in this repo implements MCP to expose 70+
							PingOne identity operations as tools. It uses the official{' '}
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
										<td>70+ tools with name, description, inputSchema</td>
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
