// src/pages/flows/v9/McpServerConfigFlowV9.tsx

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../../../components/Card';
import { WorkerTokenSectionV9 } from '../../../components/WorkerTokenSectionV9';
import { showGlobalError, showGlobalSuccess } from '../../../contexts/NotificationSystem';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { unifiedWorkerTokenService } from '../../../services/unifiedWorkerTokenService';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServerStatus {
	running: boolean;
	pid: number | null;
	version: string;
	distExists: boolean;
	configExists: boolean;
	credentialsConfigured: boolean;
	environmentId: string | null;
	region: string | null;
}

interface McpCredentials {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	apiUrl?: string;
	tokenAuthMethod?: 'CLIENT_SECRET_POST' | 'CLIENT_SECRET_BASIC';
	scope?: string;
}

interface ToolDef {
	name: string;
	category: string;
	description: string;
}

// ─── Tool Catalog ─────────────────────────────────────────────────────────────

const TOOL_CATALOG: ToolDef[] = [
	// Auth
	{
		name: 'pingone.auth.login',
		category: 'Auth',
		description: 'Authenticate a user via username/password credentials',
	},
	{
		name: 'pingone.auth.refresh',
		category: 'Auth',
		description: 'Obtain a new access token from a refresh token',
	},
	{
		name: 'pingone.auth.logout',
		category: 'Auth',
		description: 'Revoke an access or refresh token',
	},
	{
		name: 'pingone.auth.userinfo',
		category: 'Auth',
		description: 'Retrieve OIDC UserInfo for an access token',
	},
	// OIDC
	{
		name: 'pingone_oidc_config',
		category: 'OIDC',
		description: 'Get OIDC configuration for the environment',
	},
	{
		name: 'pingone_oidc_discovery',
		category: 'OIDC',
		description: 'Fetch the .well-known/openid-configuration document',
	},
	// Worker Token / Applications
	{
		name: 'pingone.workerToken.issue',
		category: 'Worker & Apps',
		description: 'Exchange client credentials for a worker token (client_credentials grant)',
	},
	{
		name: 'pingone.applications.list',
		category: 'Worker & Apps',
		description: 'List all application registrations in the environment',
	},
	{
		name: 'pingone_get_application',
		category: 'Worker & Apps',
		description: 'Get an application by ID',
	},
	{
		name: 'pingone_get_application_resources',
		category: 'Worker & Apps',
		description: 'Get resource/scope configuration for an application',
	},
	{
		name: 'pingone_create_application',
		category: 'Worker & Apps',
		description: 'Create a new OAuth application',
	},
];

// ─── Styled Components (V9 Color Standards) ───────────────────────────────────

const Container = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 1.5rem;
`;

const TabBar = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	border-bottom: 1px solid ${V9_COLORS.BORDER.GRAY};
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1.5rem;
	border: none;
	background: none;
	border-bottom: 2px solid ${({ $active }) => ($active ? V9_COLORS.PRIMARY.BLUE : 'transparent')};
	color: ${({ $active }) => ($active ? V9_COLORS.PRIMARY.BLUE : V9_COLORS.TEXT.GRAY_MEDIUM)};
	font-weight: ${({ $active }) => ($active ? 600 : 400)};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		color: ${V9_COLORS.PRIMARY.BLUE};
	}
`;

const CardTitle = styled.h3`
	margin: 0 0 1rem 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const FormGrid = styled.div`
	display: grid;
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const FormLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const FormInput = styled.input`
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const FormHint = styled.small`
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	font-size: 0.75rem;
`;

const SaveBtn = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: none;

	${({ $variant = 'primary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background-color: ${V9_COLORS.PRIMARY.BLUE};
					color: white;
					&:hover:not(:disabled) {
						background-color: ${V9_COLORS.PRIMARY.BLUE_DARK};
					}
				`;
			case 'secondary':
				return `
					background-color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
					color: white;
					&:hover:not(:disabled) {
						background-color: #4b5563;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
	padding: 0.75rem 1rem;
	border-radius: 0.375rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	border: 1px solid;
	background-color: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return `${V9_COLORS.BG.SUCCESS_LIGHT}20`;
			case 'error':
				return `${V9_COLORS.BG.ERROR_LIGHT}20`;
		}
	}};
	border-color: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return V9_COLORS.BORDER.SUCCESS;
			case 'error':
				return V9_COLORS.BORDER.ERROR;
		}
	}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return V9_COLORS.TEXT.SUCCESS;
			case 'error':
				return V9_COLORS.TEXT.ERROR;
		}
	}};
`;

const CheckRow = styled.div<{ $ok: boolean; $warn?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0;
	font-size: 0.875rem;
	color: ${({ $ok, $warn }) => {
		if ($ok) return V9_COLORS.TEXT.SUCCESS;
		if ($warn) return V9_COLORS.STATUS.WARNING;
		return V9_COLORS.TEXT.ERROR;
	}};
`;

const CodeBlock = styled.code`
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ToolGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	max-height: 400px;
	overflow-y: auto;
	padding: 1rem;
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	background: ${V9_COLORS.BG.GRAY_LIGHT};
`;

const ToolCard = styled.div`
	background: white;
	padding: 1rem;
	border-radius: 0.375rem;
	border: 1px solid ${V9_COLORS.BORDER.GRAY_LIGHT};
	transition: all 0.2s;

	&:hover {
		border-color: ${V9_COLORS.BORDER.INFO};
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`;

const ToolName = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${V9_COLORS.PRIMARY.BLUE};
	margin-bottom: 0.25rem;
`;

const ToolCategory = styled.span`
	display: inline-block;
	padding: 0.125rem 0.5rem;
	background: ${V9_COLORS.BG.INFO_LIGHT};
	color: ${V9_COLORS.TEXT.INFO};
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
`;

const ToolDescription = styled.div`
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	line-height: 1.4;
`;


const DocumentationLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: #ffffff;
	border: 1px solid ${V9_COLORS.BORDER.INFO};
	border-radius: 0.375rem;
	color: ${V9_COLORS.PRIMARY.BLUE};
	text-decoration: none;
	font-weight: 600;
	font-size: 0.875rem;
	transition: all 0.2s;

	&:hover,
	&:focus {
		background-color: ${V9_COLORS.PRIMARY.BLUE};
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		color: #ffffff;
	}
`;

// ─── Component ─────────────────────────────────────────────────────────────

const McpServerConfigFlowV9: React.FC = () => {
	usePageScroll();

	const [activeTab, setActiveTab] = useState<'status' | 'credentials' | 'tools' | 'connect'>(
		'status'
	);

	// Status
	const [status, setStatus] = useState<ServerStatus>({
		running: false,
		pid: null,
		version: 'unknown',
		distExists: false,
		configExists: false,
		credentialsConfigured: false,
		environmentId: null,
		region: null,
	});

	// Credentials
	const [creds, setCreds] = useState<McpCredentials>({});
	const [credsMsg, setCredsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
		null
	);
	const [showSecret, setShowSecret] = useState(false);




	const handleWorkerTokenUpdated = useCallback(() => {
		const tokenData = unifiedWorkerTokenService.getTokenDataSync();
		if (tokenData) {
			setCreds({
				environmentId: tokenData.credentials.environmentId,
				clientId: tokenData.credentials.clientId,
				clientSecret: tokenData.credentials.clientSecret,
				apiUrl:
					tokenData.credentials.region === 'eu'
						? 'https://api.pingone.eu'
						: 'https://api.pingone.com',
			});
		}
	}, []);

	const fetchStatus = useCallback(async () => {
		try {
			const r = await fetch('/api/mcp/server/status');
			const d = await r.json();
			setStatus(d);
		} catch {
			/* ignore */
		}
	}, []);

	const fetchCreds = useCallback(async () => {
		try {
			const r = await fetch('/api/mcp/server/credentials');
			const d = (await r.json()) as { credentials: McpCredentials };
			setCreds(d.credentials ?? {});
		} catch {
			/* ignore */
		}
	}, []);

	useEffect(() => {
		if (activeTab === 'status') {
			fetchStatus();
		}
		if (activeTab === 'credentials') {
			fetchCreds();
		}
	}, [activeTab, fetchStatus, fetchCreds]);

	const saveCreds = async () => {
		setCredsMsg(null);
		try {
			const r = await fetch('/api/mcp/server/credentials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(creds),
			});
			const d = await r.json();
			if (d.success) {
				setCredsMsg({
					type: 'success',
					text: 'Credentials saved to ~/.pingone-playground/credentials/mcp-config.json. Restart the MCP server to pick them up.',
				});
				showGlobalSuccess('MCP Server credentials saved successfully');
			} else {
				setCredsMsg({ type: 'error', text: d.error ?? 'Save failed' });
				showGlobalError('Failed to save MCP Server credentials');
			}
		} catch {
			setCredsMsg({ type: 'error', text: 'Network error' });
			showGlobalError('Network error while saving credentials');
		}
	};


	const renderTools = () => {
		const grouped = TOOL_CATALOG.reduce(
			(acc, tool) => {
				if (!acc[tool.category]) acc[tool.category] = [];
				acc[tool.category].push(tool);
				return acc;
			},
			{} as Record<string, ToolDef[]>
		);

		return Object.entries(grouped).map(([category, tools]) => (
			<div key={category}>
				<h4 style={{ margin: '1.5rem 0 1rem 0', color: V9_COLORS.TEXT.GRAY_DARK }}>
					{category} ({tools.length})
				</h4>
				<ToolGrid>
					{tools.map((tool) => (
						<ToolCard key={tool.name}>
							<ToolCategory>{category}</ToolCategory>
							<ToolName>{tool.name}</ToolName>
							<ToolDescription>{tool.description}</ToolDescription>
						</ToolCard>
					))}
				</ToolGrid>
			</div>
		));
	};

	return (
		<Container>
			<V9FlowHeader flowId="mcp-server-config" />

			{/* Documentation Link */}
			<div style={{ marginBottom: '2rem', textAlign: 'center' }}>
				<DocumentationLink href="/documentation/mcp">
					<span>📚</span>
					View MCP Documentation
					<span style={{ fontSize: '0.75rem', opacity: 0.8 }}>→</span>
				</DocumentationLink>
			</div>

			<TabBar>
				{(['status', 'credentials', 'tools', 'connect'] as const).map((t) => (
					<Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>
						{
							{
								status: '🟢 Status',
								credentials: '🔑 Credentials',
								tools: '🧰 Tools',
								connect: '🔌 Connect',
							}[t]
						}
					</Tab>
				))}
			</TabBar>

			{/* ── STATUS TAB ──────────────────────────────────────── */}
			{activeTab === 'status' && (
				<Card>
					<CardBody>
						<CardTitle>🟢 MCP Server Status</CardTitle>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
							<CheckRow $ok={status.running}>
								{status.running ? '✅' : '⚠️'} Server{' '}
								{status.running ? `running (PID ${status.pid})` : 'not running'}
							</CheckRow>
							<CheckRow $ok={status.distExists}>
								{status.distExists ? '✅' : '⚠️'} Built distribution{' '}
								{status.distExists ? 'found' : 'missing — run npm run build in pingone-mcp-server'}
							</CheckRow>
							<CheckRow $ok={status.configExists}>
								{status.configExists ? '✅' : '⚠️'} mcp-config.json{' '}
								{status.configExists
									? 'found'
									: 'not found — set credentials in the Credentials tab'}
							</CheckRow>
							<CheckRow $ok={status.credentialsConfigured}>
								{status.credentialsConfigured ? '✅' : '⚠️'} PingOne credentials{' '}
								{status.credentialsConfigured
									? 'configured'
									: 'not configured (environmentId + clientId required)'}
							</CheckRow>
						</div>
					</CardBody>
				</Card>
			)}

			{/* ── CREDENTIALS TAB ──────────────────────────────────────── */}
			{activeTab === 'credentials' && (
				<Card>
					<CardBody>
						<CardTitle>🔑 MCP Server Credentials</CardTitle>

						<p
							style={{
								fontSize: 13,
								color: V9_COLORS.TEXT.GRAY_MEDIUM,
								marginTop: -8,
								marginBottom: 20,
							}}
						>
							Saved to <CodeBlock>~/.pingone-playground/credentials/mcp-config.json</CodeBlock>. The
							MCP server reads these at startup. Restart the server after saving.
						</p>

						<FormGrid>
							<FormGroup>
								<FormLabel>Environment ID *</FormLabel>
								<FormInput
									value={creds.environmentId ?? ''}
									onChange={(e) => setCreds((c) => ({ ...c, environmentId: e.target.value }))}
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								/>
								<FormHint>Your PingOne environment UUID</FormHint>
							</FormGroup>
							<FormGroup>
								<FormLabel>Client ID *</FormLabel>
								<FormInput
									value={creds.clientId ?? ''}
									onChange={(e) => setCreds((c) => ({ ...c, clientId: e.target.value }))}
									placeholder="Worker app client ID"
								/>
								<FormHint>Client ID of a worker application</FormHint>
							</FormGroup>
							<FormGroup>
								<FormLabel>Client Secret *</FormLabel>
								<div style={{ position: 'relative' }}>
									<FormInput
										type={showSecret ? 'text' : 'password'}
										value={creds.clientSecret ?? ''}
										onChange={(e) => setCreds((c) => ({ ...c, clientSecret: e.target.value }))}
										placeholder="Worker app client secret"
										style={{ width: '100%', boxSizing: 'border-box', paddingRight: 60 }}
									/>
									<button
										type="button"
										onClick={() => setShowSecret((s) => !s)}
										style={{
											position: 'absolute',
											right: 8,
											top: '50%',
											transform: 'translateY(-50%)',
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											color: V9_COLORS.TEXT.GRAY_MEDIUM,
											fontSize: 13,
										}}
									>
										{showSecret ? 'Hide' : 'Show'}
									</button>
								</div>
								<FormHint>Worker app client secret</FormHint>
							</FormGroup>
							<FormGroup>
								<FormLabel>API URL (optional)</FormLabel>
								<FormInput
									value={creds.apiUrl ?? ''}
									onChange={(e) => setCreds((c) => ({ ...c, apiUrl: e.target.value }))}
									placeholder="https://api.pingone.com (default)"
								/>
								<FormHint>Override for non-NA regions (e.g. api.pingone.eu)</FormHint>
							</FormGroup>
						</FormGrid>
						<SaveBtn $variant="primary" onClick={() => void saveCreds()}>
							💾 Save Credentials
						</SaveBtn>
						{credsMsg && <Alert $type={credsMsg.type}>{credsMsg.text}</Alert>}
					</CardBody>
				</Card>
			)}

			{/* ── TOOLS TAB ──────────────────────────────────────── */}
			{activeTab === 'tools' && (
				<Card>
					<CardBody>
						<CardTitle>🧰 Available MCP Tools</CardTitle>
						<p style={{ fontSize: 13, color: V9_COLORS.TEXT.GRAY_MEDIUM, marginBottom: 20 }}>
							{TOOL_CATALOG.length} tools exposed by the PingOne MCP server
						</p>
						{renderTools()}
					</CardBody>
				</Card>
			)}

			{/* ── CONNECT TAB ──────────────────────────────────────── */}
			{activeTab === 'connect' && (
				<Card>
					<CardBody>
						<CardTitle>🔌 Connect MCP Clients</CardTitle>
						<p style={{ fontSize: 13, color: V9_COLORS.TEXT.GRAY_MEDIUM, marginBottom: 20 }}>
							Connect your MCP client (Cursor, Claude, etc.) to the PingOne MCP server
						</p>
						<div
							style={{
								background: V9_COLORS.BG.GRAY_LIGHT,
								padding: '1rem',
								borderRadius: '0.375rem',
							}}
						>
							<h4 style={{ margin: '0 0 1rem 0' }}>VSCode / Cursor Configuration</h4>
							<CodeBlock>
								{`{
  "mcpServers": {
    "pingone": {
      "command": "node",
      "args": ["/Users/cmuir/P1Import-apps/oauth-playground/pingone-mcp-server/dist/index.js"],
      "env": {
        "MCP_LOG_DIR": "logs"
      }
    }
  }
}`}
							</CodeBlock>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Worker Token Section */}
			<WorkerTokenSectionV9
				compact={true}
				onTokenUpdated={handleWorkerTokenUpdated}
			/>

			<V9FlowRestartButton flowId="mcp-server-config" />
		</Container>
	);
};

export default McpServerConfigFlowV9;
